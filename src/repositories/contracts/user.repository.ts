import type { UserRecord, UserStatus } from '../../modules/user/contracts/user.types.js';

export interface UserIdentifierLookup {
  companyId: string | null;
  emailCandidates: readonly string[];
  cpfDigits: string | null;
}

export interface UserListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: UserStatus | 'ALL';
  includeDeleted?: boolean;
}

export interface UserListResult {
  items: UserRecord[];
  total: number;
}

export interface UserRepository {
  findById(companyId: string, userId: string): Promise<UserRecord | null>;
  findAnyById(userId: string): Promise<UserRecord | null>;
  findByEmail(companyId: string, normalizedEmail: string): Promise<UserRecord | null>;
  findByCpf(companyId: string, cpfDigits: string): Promise<UserRecord | null>;
  findByIdentifier(lookup: UserIdentifierLookup): Promise<UserRecord | null>;
  countByOrgUnit(companyId: string, orgUnitId: string): Promise<number>;
  listByCompany(companyId: string, filters: UserListFilters): Promise<UserListResult>;
  listAll(filters: UserListFilters & { companyId?: string }): Promise<UserListResult>;
  save(user: UserRecord): Promise<UserRecord>;
}
