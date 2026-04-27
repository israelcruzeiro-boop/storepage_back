import { randomBytes, randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import { normalizeCpf, normalizeEmail } from '../lib/normalization.js';
import { toInviteView, toUserView } from '../lib/dto-mappers.js';
import type { AuthenticatedActor, UserRole } from '../modules/auth/contracts/auth.types.js';
import type { InviteRecord } from '../modules/invite/contracts/invite.types.js';
import type { UserRecord, UserStatus } from '../modules/user/contracts/user.types.js';
import type { AuthSessionRepository } from '../repositories/contracts/auth-session.repository.js';
import type { InviteRepository } from '../repositories/contracts/invite.repository.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';

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
    this.assertManageableRole(actor.role, input.role);
    await this.assertOrgUnit(actor.companyId, input.orgUnitId ?? null);

    const normalizedEmail = normalizeEmail(input.email);
    const normalizedCpf = normalizeCpf(input.cpf);
    await this.assertIdentityAvailable(actor.companyId, normalizedEmail, normalizedCpf, null);

    const now = new Date();
    const invite: InviteRecord = {
      id: randomUUID(),
      companyId: actor.companyId,
      name: input.name,
      email: normalizedEmail,
      normalizedEmail,
      cpf: normalizedCpf,
      role: input.role,
      orgUnitId: input.orgUnitId ?? null,
      token: randomBytes(24).toString('base64url'),
      status: 'PENDING_SETUP',
      invitedByUserId: actor.userId,
      userId: null,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60_000).toISOString(),
      activatedAt: null,
      cancelledAt: null,
      deletedAt: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await this.inviteRepository.save(invite);

    return {
      invite: toInviteView(invite),
      activationToken: invite.token,
    };
  }

  public async updateUser(actor: AuthenticatedActor, userId: string, input: UpdateUserInput) {
    const user = await this.userRepository.findById(actor.companyId, userId);

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    this.assertManageableRole(actor.role, user.role);
    if (input.role) {
      this.assertManageableRole(actor.role, input.role);
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

    this.assertManageableRole(actor.role, user.role);

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

  private assertManageableRole(actorRole: UserRole, targetRole: UserRole): void {
    if (targetRole === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
      throw new AppError(403, 'ROLE_ESCALATION_FORBIDDEN', 'Only a super admin can manage super admin users.');
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
