import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import { normalizeCpf, normalizeEmail } from '../lib/normalization.js';
import { TEMPORARY_INITIAL_PASSWORD } from '../lib/password-policy.js';
import { toInviteView, toUserView } from '../lib/dto-mappers.js';
import type { AuthenticatedActor, UserRole } from '../modules/auth/contracts/auth.types.js';
import type { InviteRecord } from '../modules/invite/contracts/invite.types.js';
import type { UserRecord, UserStatus } from '../modules/user/contracts/user.types.js';
import type { AuthSessionRepository } from '../repositories/contracts/auth-session.repository.js';
import type { InviteRepository } from '../repositories/contracts/invite.repository.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';
import type { PasswordService } from '../lib/passwords.js';
import type { InviteDeliveryService } from './invite-delivery.service.js';

interface AdminUsersFilters {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus | 'ALL';
}

interface CreateInviteInput {
  name: string;
  email: string;
  cpf?: string | null;
  role: UserRole;
  orgUnitId?: string | null;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  cpf?: string | null;
  role?: UserRole;
  status?: UserStatus;
  active?: boolean;
  avatarUrl?: string | null;
  orgUnitId?: string | null;
}

export class AdminUsersService {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly inviteRepository: InviteRepository,
    private readonly structureRepository: StructureRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly inviteDeliveryService: InviteDeliveryService,
    private readonly passwordService: PasswordService,
  ) {}

  public async listUsers(actor: AuthenticatedActor, filters: AdminUsersFilters) {
    const [usersResult, invitesResult] = await Promise.all([
      this.userRepository.listByCompany(actor.companyId, filters),
      this.inviteRepository.listByCompany(actor.companyId, {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
      }),
    ]);

    const activationDeliveries = await this.inviteDeliveryService.getActivationDeliveries(
      actor.companyId,
      invitesResult.items.map((invite) => invite.id),
    );

    return {
      users: usersResult.items.map(toUserView),
      invites: invitesResult.items.map((invite) => ({
        ...toInviteView(invite),
        activationDelivery: activationDeliveries.get(invite.id),
      })),
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

  public async getUser(actor: AuthenticatedActor, userId: string) {
    const user = await this.userRepository.findById(actor.companyId, userId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    const orgUnit = user.orgUnitId ? await this.structureRepository.findUnitById(actor.companyId, user.orgUnitId) : null;

    return {
      user: toUserView(user),
      orgUnit: orgUnit ? { id: orgUnit.id, name: orgUnit.name } : null,
    };
  }

  public async createInvite(actor: AuthenticatedActor, input: CreateInviteInput) {
    this.assertManageableRole(input.role);
    await this.assertOrgUnit(actor.companyId, input.orgUnitId ?? null);

    const normalizedEmail = normalizeEmail(input.email);
    const normalizedCpf = normalizeCpf(input.cpf);
    const existingUser = await this.userRepository.findByEmail(actor.companyId, normalizedEmail);

    if (existingUser) {
      throw new AppError(409, 'CONFLICT', 'Another user already uses this email in the tenant.');
    }

    if (normalizedCpf) {
      const userByCpf = await this.userRepository.findByCpf(actor.companyId, normalizedCpf);

      if (userByCpf) {
        throw new AppError(409, 'CONFLICT', 'Another user already uses this CPF in the tenant.');
      }
    }

    const now = new Date().toISOString();
    await this.cancelPendingInvite(actor.companyId, normalizedEmail, now);

    const user: UserRecord = {
      id: randomUUID(),
      companyId: actor.companyId,
      name: input.name.trim(),
      email: normalizedEmail,
      normalizedEmail,
      cpf: normalizedCpf,
      role: input.role,
      orgUnitId: input.orgUnitId ?? null,
      status: 'ACTIVE',
      active: true,
      firstAccess: true,
      onboardingCompleted: false,
      avatarUrl: null,
      passwordHash: await this.passwordService.hashPassword(TEMPORARY_INITIAL_PASSWORD),
      passwordUpdatedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    const savedUser = await this.userRepository.save(user);

    return {
      user: toUserView(savedUser),
    };
  }

  public async resendInvite(actor: AuthenticatedActor, inviteId: string) {
    const invite = await this.inviteRepository.findById(actor.companyId, inviteId);

    if (!invite) {
      throw new AppError(404, 'NOT_FOUND', 'Invite not found.');
    }

    this.assertInviteCanBeDelivered(invite);

    const activationDelivery = await this.inviteDeliveryService.sendInviteActivation(invite, actor.userId);

    return {
      invite: toInviteView(invite),
      activationDelivery,
    };
  }

  public async updateUser(actor: AuthenticatedActor, userId: string, input: UpdateUserInput) {
    const user = await this.userRepository.findById(actor.companyId, userId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    this.assertManageableRole(user.role);
    if (input.role) {
      this.assertManageableRole(input.role);
    }

    if (
      actor.userId === user.id &&
      (input.role !== undefined ||
        input.active === false ||
        (input.status !== undefined && input.status !== 'ACTIVE'))
    ) {
      throw new AppError(
        409,
        'SELF_MODIFICATION_FORBIDDEN',
        'The current administrator cannot revoke their own administrative access through this endpoint.',
      );
    }

    const normalizedEmail = input.email ? normalizeEmail(input.email) : user.normalizedEmail;
    const normalizedCpf = input.cpf !== undefined ? normalizeCpf(input.cpf) : user.cpf;

    await this.assertOrgUnit(actor.companyId, input.orgUnitId === undefined ? user.orgUnitId : input.orgUnitId);
    if (normalizedEmail !== user.normalizedEmail || normalizedCpf !== user.cpf) {
      await this.assertIdentityAvailable(actor.companyId, normalizedEmail, normalizedCpf, user.id);
    }

    const status = this.resolveUserStatus(input.status, input.active, user.status);
    const active = this.resolveUserActive(input.active, status, user.active);
    const updatedUser: UserRecord = {
      ...user,
      name: input.name ?? user.name,
      email: normalizedEmail,
      normalizedEmail,
      cpf: normalizedCpf,
      role: input.role ?? user.role,
      status,
      active,
      avatarUrl: input.avatarUrl === undefined ? user.avatarUrl : input.avatarUrl,
      orgUnitId: input.orgUnitId === undefined ? user.orgUnitId : input.orgUnitId,
      updatedAt: new Date().toISOString(),
    };

    await this.userRepository.save(updatedUser);

    if (user.role !== updatedUser.role || user.status !== updatedUser.status || user.active !== updatedUser.active) {
      await this.authSessionRepository.revokeSessionsByUser(
        actor.companyId,
        updatedUser.id,
        new Date().toISOString(),
        'admin_user_updated',
      );
    }

    return {
      user: toUserView(updatedUser),
    };
  }

  public async deleteUser(actor: AuthenticatedActor, userId: string) {
    const user = await this.userRepository.findById(actor.companyId, userId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    this.assertManageableRole(user.role);

    if (actor.userId === user.id) {
      throw new AppError(409, 'SELF_MODIFICATION_FORBIDDEN', 'The current administrator cannot delete their own account.');
    }

    const deletedAt = new Date().toISOString();
    await this.userRepository.save({
      ...user,
      active: false,
      status: 'INACTIVE',
      deletedAt,
      updatedAt: deletedAt,
    });

    await this.authSessionRepository.revokeSessionsByUser(actor.companyId, user.id, deletedAt, 'admin_user_deleted');

    return {
      deleted: true,
      id: user.id,
    };
  }

  public async cancelInvite(actor: AuthenticatedActor, inviteId: string) {
    const invite = await this.inviteRepository.findById(actor.companyId, inviteId);

    if (!invite) {
      throw new AppError(404, 'NOT_FOUND', 'Invite not found.');
    }

    const cancelledAt = new Date().toISOString();
    await this.inviteRepository.save({
      ...invite,
      status: 'CANCELLED',
      cancelledAt,
      deletedAt: cancelledAt,
      updatedAt: cancelledAt,
    });

    return {
      deleted: true,
      id: invite.id,
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

  private assertInviteCanBeDelivered(invite: InviteRecord): void {
    if (invite.status !== 'PENDING_SETUP' || invite.cancelledAt || invite.activatedAt || invite.userId) {
      throw new AppError(409, 'INVITE_NOT_PENDING', 'Only pending invites can be delivered.');
    }

    const expiresAt = new Date(invite.expiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      throw new AppError(410, 'INVITE_EXPIRED', 'Expired invites cannot be delivered.');
    }
  }

  private assertManageableRole(targetRole: UserRole): void {
    if (targetRole === 'SUPER_ADMIN') {
      throw new AppError(403, 'ROLE_ESCALATION_FORBIDDEN', 'Super admin users cannot be managed through tenant user endpoints.');
    }
  }

  private async assertOrgUnit(companyId: string, orgUnitId: string | null): Promise<void> {
    if (!orgUnitId) {
      return;
    }

    const orgUnit = await this.structureRepository.findUnitById(companyId, orgUnitId);

    if (!orgUnit) {
      throw new AppError(400, 'BAD_REQUEST', 'Referenced organizational unit was not found.');
    }
  }

  private async assertIdentityAvailable(
    companyId: string,
    normalizedEmail: string,
    normalizedCpf: string | null,
    currentUserId: string | null,
  ): Promise<void> {
    const [userByEmail, inviteByEmail] = await Promise.all([
      this.userRepository.findByEmail(companyId, normalizedEmail),
      this.inviteRepository.findPendingByEmail(companyId, normalizedEmail),
    ]);

    if (userByEmail && userByEmail.id !== currentUserId) {
      throw new AppError(409, 'CONFLICT', 'Another user already uses this email in the tenant.');
    }

    if (inviteByEmail) {
      throw new AppError(409, 'CONFLICT', 'Another pending invite already uses this email in the tenant.');
    }

    if (!normalizedCpf) {
      return;
    }

    const userByCpf = await this.userRepository.findByCpf(companyId, normalizedCpf);

    if (userByCpf && userByCpf.id !== currentUserId) {
      throw new AppError(409, 'CONFLICT', 'Another user already uses this CPF in the tenant.');
    }
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

  private resolveUserActive(nextActive: boolean | undefined, nextStatus: UserStatus, currentActive: boolean): boolean {
    if (nextActive !== undefined) {
      return nextActive;
    }

    if (nextStatus !== 'ACTIVE') {
      return false;
    }

    return currentActive;
  }
}
