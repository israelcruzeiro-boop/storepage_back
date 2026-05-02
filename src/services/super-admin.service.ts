import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import { normalizeEmail, normalizeSlug } from '../lib/normalization.js';
import { TEMPORARY_INITIAL_PASSWORD } from '../lib/password-policy.js';
import { toInviteView, toUserView } from '../lib/dto-mappers.js';
import type { AuthenticatedActor, UserRole } from '../modules/auth/contracts/auth.types.js';
import type { CompanyAuthenticatedView, CompanyRecord } from '../modules/company/contracts/company.types.js';
import type { UserRecord, UserStatus } from '../modules/user/contracts/user.types.js';
import type { AuthSessionRepository } from '../repositories/contracts/auth-session.repository.js';
import type { CompanyRepository } from '../repositories/contracts/company.repository.js';
import type { InviteRepository } from '../repositories/contracts/invite.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';
import type { PasswordService } from '../lib/passwords.js';

export interface ProvisionAdminCommand {
  companyId: string;
  name: string;
  email: string;
  role?: UserRole;
}

export type ProvisionAdminStatus = 'created_user' | 'updated_existing';

export interface ProvisionAdminResult {
  status: ProvisionAdminStatus;
  inviteId: string | null;
  userId: string | null;
}

export interface SuperAdminListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus | 'ALL';
  includeDeleted?: boolean;
  companyId?: string;
}

interface CompanyInput {
  name: string;
  slug?: string;
  linkName?: string;
  logoUrl?: string | null;
  active?: boolean;
  landingPageEnabled?: boolean;
  landingPageActive?: boolean;
  landingPageLayout?: string | null;
  checklistsEnabled?: boolean;
  surveysEnabled?: boolean;
}

interface UserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  active?: boolean;
}

/**
 * Super admin operations that the legacy frontend used to perform via direct
 * Supabase RPC. Only the `provision_invite` flow lives here today — the rest
 * of the super-admin namespace will be implemented in Phase 6.
 *
 * Authorization rule: only SUPER_ADMIN actors may call this service. The route
 * layer enforces the role; the service double-checks tenant existence and
 * normalizes the input to keep audit logs clean.
 */
export class SuperAdminService {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly inviteRepository: InviteRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly passwordService: PasswordService,
  ) {}

  public async listCompanies(actor: AuthenticatedActor, includeDeleted = false): Promise<CompanyAuthenticatedView[]> {
    this.assertSuperAdmin(actor);
    const companies = await this.companyRepository.list({ includeDeleted });
    return companies.map((company) => this.toCompanyView(company));
  }

  public async createCompany(actor: AuthenticatedActor, input: CompanyInput): Promise<CompanyAuthenticatedView> {
    this.assertSuperAdmin(actor);

    const now = new Date().toISOString();
    const linkName = normalizeSlug(input.linkName ?? input.slug ?? input.name);
    const slug = normalizeSlug(input.slug ?? linkName);
    const existing = (await this.companyRepository.list({ includeDeleted: true })).find(
      (company) => company.slug === slug || company.linkName === linkName,
    );

    if (existing && !existing.deletedAt) {
      throw new AppError(409, 'CONFLICT', 'Company slug or link name is already in use.');
    }

    const active = input.active ?? true;
    const baseCompany = existing ?? this.createDefaultCompany(now);
    const company: CompanyRecord = {
      ...baseCompany,
      id: existing?.id ?? randomUUID(),
      name: input.name.trim(),
      slug,
      linkName,
      status: active ? 'ACTIVE' : 'INACTIVE',
      active,
      landingPageEnabled: input.landingPageEnabled ?? baseCompany.landingPageEnabled ?? true,
      landingPageActive: input.landingPageActive ?? input.landingPageEnabled ?? baseCompany.landingPageActive ?? true,
      landingPageLayout: input.landingPageLayout === undefined ? baseCompany.landingPageLayout ?? null : input.landingPageLayout,
      branding: {
        ...baseCompany.branding,
        logoUrl: input.logoUrl === undefined ? baseCompany.branding.logoUrl : input.logoUrl,
      },
      features: {
        ...baseCompany.features,
        checklists: input.checklistsEnabled ?? baseCompany.features.checklists,
        surveys: input.surveysEnabled ?? baseCompany.features.surveys,
      },
      deletedAt: null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    return this.toCompanyView(await this.companyRepository.save(company));
  }

  public async updateCompany(actor: AuthenticatedActor, companyId: string, input: Partial<CompanyInput>): Promise<CompanyAuthenticatedView> {
    this.assertSuperAdmin(actor);
    const current = await this.companyRepository.findAnyById(companyId);
    if (!current) {
      throw new AppError(404, 'NOT_FOUND', 'Company not found.');
    }

    const active = input.active ?? current.active;
    const updated: CompanyRecord = {
      ...current,
      name: input.name?.trim() ?? current.name,
      slug: input.slug ? normalizeSlug(input.slug) : current.slug,
      linkName: input.linkName ? normalizeSlug(input.linkName) : current.linkName,
      status: active ? 'ACTIVE' : 'INACTIVE',
      active,
      landingPageEnabled: input.landingPageEnabled ?? current.landingPageEnabled,
      landingPageActive: input.landingPageActive ?? input.landingPageEnabled ?? current.landingPageActive,
      landingPageLayout: input.landingPageLayout === undefined ? current.landingPageLayout : input.landingPageLayout,
      branding: {
        ...current.branding,
        logoUrl: input.logoUrl === undefined ? current.branding.logoUrl : input.logoUrl,
      },
      features: {
        ...current.features,
        checklists: input.checklistsEnabled ?? current.features.checklists,
        surveys: input.surveysEnabled ?? current.features.surveys,
      },
      deletedAt: null,
      updatedAt: new Date().toISOString(),
    };

    return this.toCompanyView(await this.companyRepository.save(updated));
  }

  public async deleteCompany(actor: AuthenticatedActor, companyId: string) {
    this.assertSuperAdmin(actor);
    const company = await this.companyRepository.findAnyById(companyId);
    if (!company) {
      throw new AppError(404, 'NOT_FOUND', 'Company not found.');
    }

    const deletedAt = new Date().toISOString();
    await this.companyRepository.save({
      ...company,
      active: false,
      status: 'INACTIVE',
      deletedAt,
      updatedAt: deletedAt,
    });

    return {
      deleted: true,
      id: companyId,
    };
  }

  public async updateCompanyStatus(actor: AuthenticatedActor, companyId: string, active: boolean): Promise<CompanyAuthenticatedView> {
    this.assertSuperAdmin(actor);
    const company = await this.companyRepository.findAnyById(companyId);
    if (!company) {
      throw new AppError(404, 'NOT_FOUND', 'Company not found.');
    }

    const updated: CompanyRecord = {
      ...company,
      active,
      status: active ? 'ACTIVE' : 'INACTIVE',
      deletedAt: active ? null : company.deletedAt,
      updatedAt: new Date().toISOString(),
    };

    return this.toCompanyView(await this.companyRepository.save(updated));
  }

  public async listUsers(actor: AuthenticatedActor, filters: SuperAdminListFilters) {
    this.assertSuperAdmin(actor);
    const [usersResult, invitesResult] = await Promise.all([
      this.userRepository.listAll(filters),
      this.inviteRepository.listAll(filters),
    ]);

    return {
      users: usersResult.items.map(toUserView),
      invites: invitesResult.items.map(toInviteView),
      meta: {
        page: filters.page,
        limit: filters.limit,
        totalUsers: usersResult.total,
        totalInvites: invitesResult.total,
        status: filters.status ?? 'ALL',
        search: filters.search ?? null,
      },
    };
  }

  public async updateUser(actor: AuthenticatedActor, userId: string, input: UserInput) {
    this.assertSuperAdmin(actor);
    const user = await this.userRepository.findAnyById(userId);
    if (!user || user.deletedAt) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    if (input.role === 'SUPER_ADMIN') {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot assign SUPER_ADMIN through this endpoint.');
    }

    const status = this.resolveUserStatus(input.status, input.active, user.status);
    const active = input.active ?? (status === 'ACTIVE' ? user.active : false);
    const normalizedEmail = input.email ? normalizeEmail(input.email) : user.normalizedEmail;
    const updatedUser = await this.userRepository.save({
      ...user,
      name: input.name?.trim() ?? user.name,
      email: normalizedEmail,
      normalizedEmail,
      role: input.role ?? user.role,
      status,
      active,
      updatedAt: new Date().toISOString(),
    });

    if (user.role !== updatedUser.role || user.status !== updatedUser.status || user.active !== updatedUser.active) {
      await this.authSessionRepository.revokeSessionsByUser(
        updatedUser.companyId,
        updatedUser.id,
        new Date().toISOString(),
        'super_admin_user_updated',
      );
    }

    return {
      user: toUserView(updatedUser),
    };
  }

  public async updateUserStatus(actor: AuthenticatedActor, userId: string, active: boolean) {
    return this.updateUser(actor, userId, {
      active,
      status: active ? 'ACTIVE' : 'INACTIVE',
    });
  }

  public async provisionAdmin(
    actor: AuthenticatedActor,
    command: ProvisionAdminCommand,
  ): Promise<ProvisionAdminResult> {
    this.assertSuperAdmin(actor);

    const company = await this.companyRepository.findById(command.companyId);
    if (!company) {
      throw new AppError(404, 'NOT_FOUND', 'Company not found for the provided id.');
    }
    if (!company.active || company.status !== 'ACTIVE') {
      throw new AppError(409, 'CONFLICT', 'Only active companies can receive new administrators.');
    }

    const role: UserRole = command.role ?? 'ADMIN';
    if (role !== 'ADMIN' && role !== 'MANAGER' && role !== 'USER') {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot provision a super admin through this endpoint.');
    }

    const normalizedEmail = normalizeEmail(command.email);
    const name = command.name.trim();
    const now = new Date().toISOString();
    const existingUser = await this.userRepository.findAnyByEmail(normalizedEmail);

    if (existingUser) {
      if (existingUser.role === 'SUPER_ADMIN') {
        throw new AppError(409, 'CONFLICT', 'Super admin accounts cannot be provisioned as tenant administrators.');
      }

      const updatedUser = await this.userRepository.save({
        ...existingUser,
        companyId: company.id,
        name,
        email: normalizedEmail,
        normalizedEmail,
        role,
        status: 'ACTIVE',
        active: true,
        deletedAt: null,
        updatedAt: now,
      });

      if (
        existingUser.companyId !== updatedUser.companyId ||
        existingUser.role !== updatedUser.role ||
        existingUser.status !== updatedUser.status ||
        existingUser.active !== updatedUser.active
      ) {
        await this.authSessionRepository.revokeSessionsByUser(
          existingUser.companyId,
          existingUser.id,
          now,
          'super_admin_user_provisioned',
        );
      }

      return {
        status: 'updated_existing',
        inviteId: null,
        userId: updatedUser.id,
      };
    }

    await this.cancelPendingInvite(company.id, normalizedEmail, now);

    const user: UserRecord = {
      id: randomUUID(),
      companyId: company.id,
      name,
      email: normalizedEmail,
      normalizedEmail,
      cpf: null,
      role,
      status: 'ACTIVE',
      active: true,
      firstAccess: true,
      onboardingCompleted: false,
      avatarUrl: null,
      orgUnitId: null,
      passwordHash: await this.passwordService.hashPassword(TEMPORARY_INITIAL_PASSWORD),
      passwordUpdatedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const savedUser = await this.userRepository.save(user);

    return {
      status: 'created_user',
      inviteId: null,
      userId: savedUser.id,
    };
  }

  private async cancelPendingInvite(companyId: string, normalizedEmail: string, cancelledAt: string): Promise<void> {
    const pendingInvite = await this.inviteRepository.findPendingByEmail(companyId, normalizedEmail);

    if (!pendingInvite) {
      return;
    }

    await this.inviteRepository.save({
      ...pendingInvite,
      status: 'CANCELLED',
      cancelledAt,
      deletedAt: cancelledAt,
      updatedAt: cancelledAt,
    });
  }

  private assertSuperAdmin(actor: AuthenticatedActor): void {
    if (actor.role !== 'SUPER_ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Only super admins can perform this operation.');
    }
  }

  private createDefaultCompany(now: string): CompanyRecord {
    return {
      id: randomUUID(),
      name: '',
      slug: '',
      linkName: '',
      status: 'ACTIVE',
      active: true,
      landingPageEnabled: true,
      landingPageActive: true,
      landingPageLayout: 'classic',
      branding: {
        logoUrl: null,
        faviconUrl: null,
        theme: {
          primary: '#111827',
          secondary: '#1f2937',
          accent: '#f59e0b',
          surface: '#ffffff',
          text: '#111827',
        },
        hero: {
          title: '',
          subtitle: '',
          ctaLabel: null,
          imageUrl: null,
        },
      },
      features: {
        repositories: true,
        lms: true,
        checklists: false,
        surveys: true,
        metrics: true,
      },
      general: {
        orgLevels: ['Regional', 'Distrito'],
        orgUnitName: 'Loja',
        supportEmail: null,
      },
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  private toCompanyView(company: CompanyRecord): CompanyAuthenticatedView {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      linkName: company.linkName,
      branding: company.branding,
      general: {
        orgLevels: [...company.general.orgLevels],
        orgUnitName: company.general.orgUnitName,
      },
      status: company.status,
      active: company.active,
      features: company.features,
      supportEmail: company.general.supportEmail,
      landingPageEnabled: company.landingPageEnabled,
      landingPageActive: company.landingPageActive,
      landingPageLayout: company.landingPageLayout,
      deletedAt: company.deletedAt,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  private resolveUserStatus(nextStatus: UserStatus | undefined, nextActive: boolean | undefined, currentStatus: UserStatus): UserStatus {
    if (nextStatus) {
      return nextStatus;
    }
    if (nextActive === undefined) {
      return currentStatus;
    }
    return nextActive ? 'ACTIVE' : 'INACTIVE';
  }
}
