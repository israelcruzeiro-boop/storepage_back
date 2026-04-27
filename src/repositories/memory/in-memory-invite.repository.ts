import type { InviteRecord } from '../../modules/invite/contracts/invite.types.js';
import { normalizeEmail } from '../../lib/normalization.js';
import type { InviteListFilters, InviteListResult, InviteRepository } from '../contracts/invite.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

function isVisible(invite: InviteRecord): boolean {
  return invite.deletedAt === null;
}

function applyInviteFilters(invites: InviteRecord[], filters: InviteListFilters): InviteRecord[] {
  const normalizedSearch = filters.search?.trim().toLowerCase();

  return invites.filter((invite) => {
    if (!normalizedSearch) {
      return true;
    }

    return [invite.name, invite.email, invite.cpf ?? ''].some((value) => value.toLowerCase().includes(normalizedSearch));
  });
}

export class InMemoryInviteRepository implements InviteRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async findById(companyId: string, inviteId: string): Promise<InviteRecord | null> {
    const invite = this.store.getInvite(inviteId);
    return invite && isVisible(invite) && invite.companyId === companyId ? invite : null;
  }

  public async findByToken(token: string): Promise<InviteRecord | null> {
    return this.store.listInvites().find((invite) => isVisible(invite) && invite.token === token) ?? null;
  }

  public async findPendingByEmail(companyId: string, normalizedEmail: string): Promise<InviteRecord | null> {
    return (
      this.store
        .listInvites()
        .find(
          (invite) =>
            isVisible(invite) &&
            invite.companyId === companyId &&
            invite.normalizedEmail === normalizeEmail(normalizedEmail) &&
            invite.status === 'PENDING_SETUP',
        ) ?? null
    );
  }

  public async listByCompany(companyId: string, filters: InviteListFilters): Promise<InviteListResult> {
    const invites = this.store
      .listInvites()
      .filter((invite) => (filters.includeDeleted || isVisible(invite)) && invite.companyId === companyId);
    const filteredInvites = applyInviteFilters(invites, filters);
    const startIndex = (filters.page - 1) * filters.limit;

    return {
      items: filteredInvites.slice(startIndex, startIndex + filters.limit),
      total: filteredInvites.length,
    };
  }

  public async listAll(filters: InviteListFilters): Promise<InviteListResult> {
    const invites = this.store
      .listInvites()
      .filter((invite) => (filters.includeDeleted || isVisible(invite)) && (!filters.companyId || invite.companyId === filters.companyId));
    const filteredInvites = applyInviteFilters(invites, filters);
    const startIndex = (filters.page - 1) * filters.limit;

    return {
      items: filteredInvites.slice(startIndex, startIndex + filters.limit),
      total: filteredInvites.length,
    };
  }

  public async save(invite: InviteRecord): Promise<InviteRecord> {
    return this.store.setInvite(invite);
  }
}
