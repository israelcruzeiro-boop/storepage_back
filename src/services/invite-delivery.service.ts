import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport/index.js';
import type { AppEnv } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import type {
  InviteActivationDeliveryView,
  InviteDeliveryAttemptRecord,
  InviteDeliveryAttemptView,
  InviteDeliveryChannel,
  InviteDeliveryProviderName,
  InviteDeliveryStatus,
} from '../modules/invite/contracts/invite-delivery.types.js';
import type { InviteRecord } from '../modules/invite/contracts/invite.types.js';
import type { InviteDeliveryAttemptRepository } from '../repositories/contracts/invite-delivery-attempt.repository.js';

export interface InviteDeliverySendInput {
  inviteId: string;
  companyId: string;
  email: string;
  name: string;
  activationUrl: string;
  expiresAt: string;
}

export interface InviteDeliveryProvider {
  readonly name: InviteDeliveryProviderName;
  readonly channel: InviteDeliveryChannel;
  sendInviteActivation(input: InviteDeliverySendInput): Promise<void>;
}

export class InviteDeliveryProviderError extends Error {
  public constructor(public readonly code: string) {
    super(code);
    this.name = 'InviteDeliveryProviderError';
  }
}

export class NoopInviteDeliveryProvider implements InviteDeliveryProvider {
  public readonly name = 'noop';
  public readonly channel = 'manual';

  public async sendInviteActivation(): Promise<void> {
    return Promise.resolve();
  }
}

export class SmtpInviteDeliveryProvider implements InviteDeliveryProvider {
  public readonly name = 'smtp';
  public readonly channel = 'email';
  private readonly transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  public constructor(private readonly env: AppEnv) {
    const smtp = env.INVITE_DELIVERY.smtp;
    this.transporter = nodemailer.createTransport({
      host: smtp.host ?? '',
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user ?? '',
        pass: smtp.pass ?? '',
      },
    });
  }

  public async sendInviteActivation(input: InviteDeliverySendInput): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.env.INVITE_DELIVERY.from ?? '',
        to: input.email,
        subject: 'Ative seu acesso ao StorePage',
        text: [
          `Ola, ${input.name}.`,
          '',
          'Seu acesso foi criado. Use o link abaixo para definir sua senha:',
          input.activationUrl,
          '',
          `Este convite expira em ${new Date(input.expiresAt).toLocaleString('pt-BR')}.`,
        ].join('\n'),
        html: [
          `<p>Ola, ${escapeHtml(input.name)}.</p>`,
          '<p>Seu acesso foi criado. Use o link abaixo para definir sua senha:</p>',
          `<p><a href="${escapeHtml(input.activationUrl)}">Ativar acesso</a></p>`,
          `<p>Este convite expira em ${escapeHtml(new Date(input.expiresAt).toLocaleString('pt-BR'))}.</p>`,
        ].join(''),
      });
    } catch {
      throw new InviteDeliveryProviderError('SMTP_SEND_FAILED');
    }
  }
}

export function buildInviteDeliveryProvider(env: AppEnv): InviteDeliveryProvider {
  if (env.INVITE_DELIVERY.provider === 'smtp') {
    return new SmtpInviteDeliveryProvider(env);
  }

  return new NoopInviteDeliveryProvider();
}

export class InviteDeliveryService {
  public constructor(
    private readonly env: AppEnv,
    private readonly attemptsRepository: InviteDeliveryAttemptRepository,
    private readonly provider: InviteDeliveryProvider = buildInviteDeliveryProvider(env),
  ) {}

  public async sendInviteActivation(
    invite: InviteRecord,
    requestedByUserId: string,
  ): Promise<InviteActivationDeliveryView> {
    const now = new Date().toISOString();
    let status: InviteDeliveryStatus = this.provider.name === 'noop' ? 'manual_delivery_pending' : 'sent';
    let errorCode: string | null = null;

    try {
      await this.provider.sendInviteActivation({
        inviteId: invite.id,
        companyId: invite.companyId,
        email: invite.email,
        name: invite.name,
        activationUrl: this.buildActivationUrl(invite.token),
        expiresAt: invite.expiresAt,
      });
    } catch (error) {
      status = 'failed';
      errorCode = getDeliveryErrorCode(error);
    }

    const attempt = await this.saveAttempt({
      id: randomUUID(),
      inviteId: invite.id,
      companyId: invite.companyId,
      channel: this.provider.channel,
      provider: this.provider.name,
      status,
      errorCode,
      requestedByUserId,
      sentAt: status === 'sent' ? now : null,
      createdAt: now,
    });

    return toInviteActivationDeliveryView(attempt);
  }

  public async getActivationDelivery(companyId: string, inviteId: string): Promise<InviteActivationDeliveryView> {
    try {
      const attempt = await this.attemptsRepository.findLatestForInvite(companyId, inviteId);
      return attempt ? toInviteActivationDeliveryView(attempt) : defaultInviteActivationDelivery();
    } catch (error) {
      if (isMissingInviteDeliveryAuditStore(error)) {
        return defaultInviteActivationDelivery();
      }

      throw error;
    }
  }

  public async getActivationDeliveries(
    companyId: string,
    inviteIds: readonly string[],
  ): Promise<Map<string, InviteActivationDeliveryView>> {
    let attempts: Map<string, InviteDeliveryAttemptRecord>;
    try {
      attempts = await this.attemptsRepository.findLatestForInvites(companyId, inviteIds);
    } catch (error) {
      if (!isMissingInviteDeliveryAuditStore(error)) {
        throw error;
      }
      attempts = new Map();
    }

    const deliveries = new Map<string, InviteActivationDeliveryView>();

    inviteIds.forEach((inviteId) => {
      const attempt = attempts.get(inviteId);
      deliveries.set(inviteId, attempt ? toInviteActivationDeliveryView(attempt) : defaultInviteActivationDelivery());
    });

    return deliveries;
  }

  private buildActivationUrl(token: string): string {
    const url = new URL(this.env.INVITE_DELIVERY.activationBaseUrl);
    const basePath = url.pathname.replace(/\/+$/, '');
    url.pathname = `${basePath}/${encodeURIComponent(token)}`;
    url.search = '';
    url.hash = '';
    return url.toString();
  }

  private async saveAttempt(attempt: InviteDeliveryAttemptRecord): Promise<InviteDeliveryAttemptRecord> {
    try {
      return await this.attemptsRepository.save(attempt);
    } catch (error) {
      if (isMissingInviteDeliveryAuditStore(error)) {
        throw new AppError(
          503,
          'DATABASE_SCHEMA_OUT_OF_DATE',
          'A tabela invite_delivery_attempts nao existe no Supabase. Aplique a migration supabase/20260430_invite_delivery_attempts.sql antes de enviar convites.',
        );
      }

      throw error;
    }
  }
}

function toInviteDeliveryAttemptView(attempt: InviteDeliveryAttemptRecord): InviteDeliveryAttemptView {
  return {
    id: attempt.id,
    inviteId: attempt.inviteId,
    channel: attempt.channel,
    provider: attempt.provider,
    status: attempt.status,
    errorCode: attempt.errorCode,
    requestedByUserId: attempt.requestedByUserId,
    sentAt: attempt.sentAt,
    createdAt: attempt.createdAt,
  };
}

function toInviteActivationDeliveryView(attempt: InviteDeliveryAttemptRecord): InviteActivationDeliveryView {
  return {
    status: attempt.status,
    channel: attempt.channel,
    provider: attempt.provider,
    sent: attempt.status === 'sent',
    lastAttempt: toInviteDeliveryAttemptView(attempt),
  };
}

function defaultInviteActivationDelivery(): InviteActivationDeliveryView {
  return {
    status: 'manual_delivery_pending',
    channel: 'manual',
    provider: 'noop',
    sent: false,
    lastAttempt: null,
  };
}

function getDeliveryErrorCode(error: unknown): string {
  if (error instanceof InviteDeliveryProviderError) {
    return error.code;
  }

  return 'INVITE_DELIVERY_FAILED';
}

function isMissingInviteDeliveryAuditStore(error: unknown): boolean {
  if (!(error instanceof Error) || error.name !== 'SupabaseRestError') {
    return false;
  }

  const body = (error as { body?: unknown }).body;
  if (!body || typeof body !== 'object') {
    return false;
  }

  const code = (body as { code?: unknown }).code;
  const message = (body as { message?: unknown }).message;
  return (
    (code === 'PGRST205' || code === '42P01' || code === '42703') &&
    typeof message === 'string' &&
    message.includes('invite_delivery_attempts')
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
