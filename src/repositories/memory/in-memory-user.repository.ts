import type { UserRecord } from '../../modules/user/contracts/user.types.js';
import { normalizeEmail } from '../../lib/normalization.js';
import type { UserIdentifierLookup, UserListFilters, UserListResult, UserRepository } from '../contracts/user.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

function isVisible(user: UserRecord): boolean {
  return user.deletedAt === null;
}

function applyUserFilters(users: UserRecord[], filters: UserListFilters): UserRecord[] {
  const normalizedSearch = filters.search?.trim().toLowerCase();

  return users.filter((user) => {
    if (filters.status && filters.status !== 'ALL' && user.status !== filters.status) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [user.name, user.email, user.cpf ?? ''].some((value) => value.toLowerCase().includes(normalizedSearch));
  });
}

export class InMemoryUserRepository implements UserRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async findById(companyId: string, userId: string): Promise<UserRecord | null> {
    const user = this.store.getUser(userId);
    return user && isVisible(user) && user.companyId === companyId ? user : null;
  }

  public async findAnyById(userId: string): Promise<UserRecord | null> {
    return this.store.getUser(userId);
  }

  public async findByEmail(companyId: string, normalizedEmail: string): Promise<UserRecord | null> {
    return (
      this.store
        .listUsers()
        .find(
          (user) => isVisible(user) && user.companyId === companyId && user.normalizedEmail === normalizeEmail(normalizedEmail),
        ) ?? null
    );
  }

  public async findByCpf(companyId: string, cpfDigits: string): Promise<UserRecord | null> {
    return (
      this.store
        .listUsers()
        .find((user) => isVisible(user) && user.companyId === companyId && user.cpf === cpfDigits) ?? null
    );
  }

  public async findByIdentifier(lookup: UserIdentifierLookup): Promise<UserRecord | null> {
    const users = this.store.listUsers().filter((user) => isVisible(user) && (!lookup.companyId || user.companyId === lookup.companyId));

    const byEmail =
      users.find((user) => lookup.emailCandidates.some((candidate) => user.normalizedEmail === normalizeEmail(candidate))) ?? null;

    if (byEmail) {
      return byEmail;
    }

    if (!lookup.cpfDigits) {
      return null;
    }

    return users.find((user) => user.cpf === lookup.cpfDigits) ?? null;
  }

  public async countByOrgUnit(companyId: string, orgUnitId: string): Promise<number> {
    return this.store
      .listUsers()
      .filter((user) => isVisible(user) && user.companyId === companyId && user.orgUnitId === orgUnitId && user.active)
      .length;
  }

  public async listByCompany(companyId: string, filters: UserListFilters): Promise<UserListResult> {
    const visibleUsers = this.store
      .listUsers()
      .filter((user) => (filters.includeDeleted || isVisible(user)) && user.companyId === companyId);
    const filteredUsers = applyUserFilters(visibleUsers, filters);
    const startIndex = (filters.page - 1) * filters.limit;

    return {
      items: filteredUsers.slice(startIndex, startIndex + filters.limit),
      total: filteredUsers.length,
    };
  }

  public async listAll(filters: UserListFilters & { companyId?: string }): Promise<UserListResult> {
    const visibleUsers = this.store
      .listUsers()
      .filter((user) => (filters.includeDeleted || isVisible(user)) && (!filters.companyId || user.companyId === filters.companyId));
    const filteredUsers = applyUserFilters(visibleUsers, filters);
    const startIndex = (filters.page - 1) * filters.limit;

    return {
      items: filteredUsers.slice(startIndex, startIndex + filters.limit),
      total: filteredUsers.length,
    };
  }

  public async save(user: UserRecord): Promise<UserRecord> {
    return this.store.setUser(user);
  }
}
