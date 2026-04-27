import type { InviteRecord } from '../../modules/invite/contracts/invite.types.js';

export interface InviteListFilters {
  page: number;
  limit: number;
  search?: string;
  companyId?: string;
  includeDeleted?: boolean;
}

export interface InviteListResult {
  items: InviteRecord[];
  total: number;
}

export interface InviteRepository {
  findById(companyId: string, inviteId: string): Promise<InviteRecord | null>;
  findByToken(token: string): Promise<InviteRecord | null>;
  findPendingByEmail(companyId: string, normalizedEmail: string): Promise<InviteRecord | null>;
  listByCompany(companyId: string, filters: InviteListFilters): Promise<InviteListResult>;
  listAll(filters: InviteListFilters): Promise<InviteListResult>;
  save(invite: InviteRecord): Promise<InviteRecord>;
}
