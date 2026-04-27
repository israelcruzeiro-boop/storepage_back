import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import { buildIdentifierLookup, normalizeCpf, normalizeEmail } from '../lib/normalization.js';
import { toInviteView, toUnitView, toUserView } from '../lib/dto-mappers.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type { AuthSessionRecord, SessionTokenBundle, SessionView } from '../modules/auth/contracts/session.types.js';
import type { UserRecord } from '../modules/user/contracts/user.types.js';
import type { PasswordService } from '../lib/passwords.js';
import type { AuthSessionRepository } from '../repositories/contracts/auth-session.repository.js';
import type { InviteRepository } from '../repositories/contracts/invite.repository.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';
import { tokenIdentitySchema } from '../schemas/auth.js';
import type { CompanyService } from './company.service.js';
import type { SessionJwtPayload, SessionJwtService } from './session-jwt.service.js';

interface LoginInput {
  identifier: string;
  password: string;
  companySlug: string;
}

interface RefreshInput {
  refreshToken: string;
}

interface ActivateInviteInput {
  token: string;
  email: string;
  cpf?: string;
  password: string;
  avatarUrl?: string | null;
  name?: string;
  orgUnitId?: string | null;
}

interface UpdateProfileInput {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
}

interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface UpdateOwnProfileInput {
  onboardingCompleted?: boolean;
}

interface SessionResponse extends SessionTokenBundle {
  session: SessionView;
  user: ReturnType<typeof toUserView>;
  company: Awaited<ReturnType<CompanyService['getCurrentCompany']>>;
}

export class AuthService {
  public constructor(
    private readonly companyService: CompanyService,
    private readonly userRepository: UserRepository,
    private readonly inviteRepository: InviteRepository,
    private readonly structureRepository: StructureRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: SessionJwtService,
  ) {}

  public async login(input: LoginInput): Promise<SessionResponse> {
    const expectedTenant = await this.companyService.resolveLoginTenantBySlug(input.companySlug);
    const lookup = buildIdentifierLookup(input.identifier, expectedTenant.id);
    const user = await this.userRepository.findByIdentifier(lookup);

    if (!user || user.companyId !== expectedTenant.id) {
      await this.assertPendingInviteLogin(input.identifier, expectedTenant.id);
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid identifier or password.');
    }

    await this.assertUserCanAuthenticate(user);

    const passwordMatches = await this.passwordService.verifyPassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid identifier or password.');
    }

    return await this.createSessionResponse(user);
  }

  public async refresh(input: RefreshInput): Promise<SessionResponse> {
    const verifiedToken = await this.jwtService.verifyRefreshToken(input.refreshToken);
    const tokenIdentity = this.parseTokenIdentity(verifiedToken.payload);

    if (!tokenIdentity.sessionId || !tokenIdentity.refreshTokenId) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token payload is incomplete.');
    }

    const session = await this.authSessionRepository.findById(tokenIdentity.sessionId);

    if (
      !session ||
      session.companyId !== tokenIdentity.companyId ||
      session.userId !== tokenIdentity.subject ||
      session.revokedAt !== null ||
      session.refreshTokenId !== tokenIdentity.refreshTokenId ||
      new Date(session.refreshExpiresAt).getTime() <= Date.now()
    ) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is not active.');
    }

    const refreshTokenMatches = await this.passwordService.verifyPassword(input.refreshToken, session.refreshTokenHash);

    if (!refreshTokenMatches) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is not active.');
    }

    const user = await this.userRepository.findById(tokenIdentity.companyId, tokenIdentity.subject);

    if (!user) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is not active.');
    }

    await this.assertUserCanAuthenticate(user);
    return await this.rotateSession(user, session);
  }

  public async logout(actor: AuthenticatedActor) {
    if (!actor.sessionId) {
      throw new AppError(400, 'BAD_REQUEST', 'The current token is not bound to a revocable backend session.');
    }

    const revokedAt = new Date().toISOString();
    await this.authSessionRepository.revokeSession(actor.sessionId, actor.companyId, actor.userId, revokedAt, 'user_logout');

    return {
      loggedOut: true,
      sessionId: actor.sessionId,
    };
  }

  public async getMe(actor: AuthenticatedActor) {
    const user = await this.getCurrentUser(actor);
    const company = await this.companyService.getCurrentCompany(actor.companyId);

    return {
      user: toUserView(user),
      company,
    };
  }

  public async getTenantBranding(slug: string) {
    return await this.companyService.getPublicAppearance(slug);
  }

  public async getInviteByToken(token: string) {
    const invite = await this.getActiveInvite(token);
    const [company, units] = await Promise.all([
      this.companyService.getPublicCompanyById(invite.companyId),
      this.structureRepository.listUnits(invite.companyId),
    ]);

    return {
      invite: toInviteView(invite),
      company,
      availableUnits: units.map(toUnitView),
    };
  }

  public async activateInvite(input: ActivateInviteInput): Promise<SessionResponse> {
    const invite = await this.getActiveInvite(input.token);
    const normalizedEmail = normalizeEmail(input.email);
    const normalizedCpf = normalizeCpf(input.cpf) ?? invite.cpf;

    if (invite.normalizedEmail !== normalizedEmail) {
      throw new AppError(400, 'INVITE_INVALID', 'Invite activation data does not match the pending invite.');
    }

    if (invite.cpf && invite.cpf !== normalizedCpf) {
      throw new AppError(400, 'INVITE_INVALID', 'Invite activation data does not match the pending invite.');
    }

    if (input.orgUnitId) {
      const unit = await this.structureRepository.findUnitById(invite.companyId, input.orgUnitId);

      if (!unit) {
        throw new AppError(400, 'BAD_REQUEST', 'Referenced organizational unit was not found.');
      }
    }

    const existingUser = await this.userRepository.findByEmail(invite.companyId, normalizedEmail);

    if (existingUser && existingUser.status === 'ACTIVE' && existingUser.active) {
      throw new AppError(409, 'CONFLICT', 'A user with this email already exists in the tenant.');
    }

    const now = new Date().toISOString();
    const passwordHash = await this.passwordService.hashPassword(input.password);
    const user: UserRecord = existingUser
      ? {
          ...existingUser,
          name: input.name ?? invite.name,
          email: normalizedEmail,
          normalizedEmail,
          cpf: normalizedCpf ?? null,
          role: invite.role,
          status: 'ACTIVE',
          active: true,
          firstAccess: false,
          onboardingCompleted: existingUser.onboardingCompleted ?? false,
          avatarUrl: input.avatarUrl === undefined ? existingUser.avatarUrl : input.avatarUrl,
          orgUnitId: input.orgUnitId === undefined ? invite.orgUnitId : input.orgUnitId,
          passwordHash,
          passwordUpdatedAt: now,
          deletedAt: null,
          updatedAt: now,
        }
      : {
          id: randomUUID(),
          companyId: invite.companyId,
          name: input.name ?? invite.name,
          email: normalizedEmail,
          normalizedEmail,
          cpf: normalizedCpf ?? null,
          role: invite.role,
          status: 'ACTIVE',
          active: true,
          firstAccess: false,
          onboardingCompleted: false,
          avatarUrl: input.avatarUrl ?? null,
          orgUnitId: input.orgUnitId === undefined ? invite.orgUnitId : input.orgUnitId,
          passwordHash,
          passwordUpdatedAt: now,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        };

    await this.userRepository.save(user);
    await this.inviteRepository.save({
      ...invite,
      status: 'ACTIVATED',
      userId: user.id,
      activatedAt: now,
      updatedAt: now,
    });

    return await this.createSessionResponse(user);
  }

  public async updateProfile(actor: AuthenticatedActor, input: UpdateProfileInput) {
    const user = await this.getCurrentUser(actor);
    const nextEmail = input.email ? normalizeEmail(input.email) : user.normalizedEmail;

    if (nextEmail !== user.normalizedEmail) {
      const userByEmail = await this.userRepository.findByEmail(actor.companyId, nextEmail);

      if (userByEmail && userByEmail.id !== user.id) {
        throw new AppError(409, 'CONFLICT', 'Another user already uses this email in the tenant.');
      }
    }

    await this.userRepository.save({
      ...user,
      name: input.name ?? user.name,
      email: nextEmail,
      normalizedEmail: nextEmail,
      avatarUrl: input.avatarUrl === undefined ? user.avatarUrl : input.avatarUrl,
      updatedAt: new Date().toISOString(),
    });

    return await this.getMe(actor);
  }

  public async updateOwnProfile(actor: AuthenticatedActor, input: UpdateOwnProfileInput) {
    const user = await this.getCurrentUser(actor);
    const updatedUser = await this.userRepository.save({
      ...user,
      onboardingCompleted:
        input.onboardingCompleted === undefined ? user.onboardingCompleted ?? false : input.onboardingCompleted,
      updatedAt: new Date().toISOString(),
    });

    return {
      user: toUserView(updatedUser),
    };
  }

  public async updatePassword(actor: AuthenticatedActor, input: UpdatePasswordInput) {
    const user = await this.getCurrentUser(actor);
    const passwordMatches = await this.passwordService.verifyPassword(input.currentPassword, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Current password is invalid.');
    }

    if (input.currentPassword === input.newPassword) {
      throw new AppError(400, 'PASSWORD_POLICY_VIOLATION', 'New password must be different from the current password.');
    }

    const updatedAt = new Date().toISOString();
    await this.userRepository.save({
      ...user,
      passwordHash: await this.passwordService.hashPassword(input.newPassword),
      passwordUpdatedAt: updatedAt,
      updatedAt,
    });

    await this.authSessionRepository.revokeSessionsByUser(actor.companyId, actor.userId, updatedAt, 'password_changed');

    return {
      passwordUpdated: true,
      requiresReauthentication: true,
    };
  }

  private async getCurrentUser(actor: AuthenticatedActor): Promise<UserRecord> {
    const user = await this.userRepository.findById(actor.companyId, actor.userId);

    if (!user) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Authenticated user was not found.');
    }

    return user;
  }

  private async createSessionResponse(user: UserRecord): Promise<SessionResponse> {
    const now = new Date().toISOString();
    const sessionId = randomUUID();
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken, company] = await Promise.all([
      this.jwtService.issueAccessToken({
        subject: user.id,
        companyId: user.companyId,
        role: user.role,
        email: user.email,
        sessionId,
      }),
      this.jwtService.issueRefreshToken({
        subject: user.id,
        companyId: user.companyId,
        sessionId,
        refreshTokenId,
      }),
      this.companyService.getCurrentCompany(user.companyId),
    ]);

    const session: AuthSessionRecord = {
      id: sessionId,
      userId: user.id,
      companyId: user.companyId,
      refreshTokenHash: await this.passwordService.hashPassword(refreshToken.token),
      refreshTokenId,
      createdAt: now,
      updatedAt: now,
      lastAuthenticatedAt: now,
      expiresAt: accessToken.expiresAt,
      refreshExpiresAt: refreshToken.expiresAt,
      revokedAt: null,
      revokedReason: null,
    };

    await this.authSessionRepository.save(session);

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      session: this.toSessionView(session),
      user: toUserView(user),
      company,
    };
  }

  private async rotateSession(user: UserRecord, session: AuthSessionRecord): Promise<SessionResponse> {
    const now = new Date().toISOString();
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken, company] = await Promise.all([
      this.jwtService.issueAccessToken({
        subject: user.id,
        companyId: user.companyId,
        role: user.role,
        email: user.email,
        sessionId: session.id,
      }),
      this.jwtService.issueRefreshToken({
        subject: user.id,
        companyId: user.companyId,
        sessionId: session.id,
        refreshTokenId,
      }),
      this.companyService.getCurrentCompany(user.companyId),
    ]);

    const updatedSession: AuthSessionRecord = {
      ...session,
      refreshTokenHash: await this.passwordService.hashPassword(refreshToken.token),
      refreshTokenId,
      updatedAt: now,
      lastAuthenticatedAt: now,
      expiresAt: accessToken.expiresAt,
      refreshExpiresAt: refreshToken.expiresAt,
    };

    await this.authSessionRepository.save(updatedSession);

    return {
      accessToken: accessToken.token,
      refreshToken: refreshToken.token,
      accessTokenExpiresAt: accessToken.expiresAt,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      session: this.toSessionView(updatedSession),
      user: toUserView(user),
      company,
    };
  }

  private toSessionView(session: AuthSessionRecord): SessionView {
    return {
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      refreshExpiresAt: session.refreshExpiresAt,
    };
  }

  private async assertPendingInviteLogin(identifier: string, companyId: string | null): Promise<void> {
    if (!companyId) {
      return;
    }

    const lookup = buildIdentifierLookup(identifier, companyId);

    for (const emailCandidate of lookup.emailCandidates) {
      const pendingInvite = await this.inviteRepository.findPendingByEmail(companyId, normalizeEmail(emailCandidate));

      if (pendingInvite) {
        throw new AppError(
          409,
          'INVITE_PENDING_ACTIVATION',
          'This user is provisioned but still needs invite activation before login.',
        );
      }
    }
  }

  private async assertUserCanAuthenticate(user: UserRecord): Promise<void> {
    const company = await this.companyService.getCompanyRecord(user.companyId);

    if (!company.active || company.status !== 'ACTIVE') {
      throw new AppError(403, 'FORBIDDEN', 'This tenant is not available for authentication.');
    }

    if (!user.passwordHash || user.status === 'PENDING_SETUP' || user.firstAccess) {
      throw new AppError(
        409,
        'INVITE_PENDING_ACTIVATION',
        'This user still needs activation or a valid password before login.',
      );
    }

    if (!user.active || user.status !== 'ACTIVE') {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid identifier or password.');
    }
  }

  private async getActiveInvite(token: string): Promise<NonNullable<Awaited<ReturnType<InviteRepository['findByToken']>>>> {
    const invite = await this.inviteRepository.findByToken(token);

    if (!invite || invite.status === 'CANCELLED' || invite.deletedAt !== null) {
      throw new AppError(404, 'INVITE_INVALID', 'Invite not found or no longer available.');
    }

    if (invite.status !== 'PENDING_SETUP') {
      throw new AppError(409, 'INVITE_INVALID', 'Invite is no longer available for activation.');
    }

    if (new Date(invite.expiresAt).getTime() <= Date.now()) {
      throw new AppError(410, 'INVITE_EXPIRED', 'Invite token has expired.');
    }

    return invite;
  }

  private parseTokenIdentity(payload: SessionJwtPayload) {
    const claimNames = this.jwtService.getClaimNames();
    const parsedIdentity = tokenIdentitySchema.safeParse({
      subject: payload.sub,
      companyId: payload[claimNames.companyId],
      role: payload[claimNames.role],
      email: payload[claimNames.email],
      sessionId: payload.sid,
      tokenUse: payload.token_use,
      refreshTokenId: payload.rti,
    });

    if (!parsedIdentity.success) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token payload is invalid.');
    }

    return parsedIdentity.data;
  }
}
