import { normalizeEmail } from '../../lib/normalization.js';
import type { InviteRecord } from '../../modules/invite/contracts/invite.types.js';
import type { InviteListFilters, InviteListResult, InviteRepository } from '../contracts/invite.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
import { fromInviteRecord, INVITE_SELECT, toInviteRecord, type InviteRow } from './supabase-row-mappers.js';

export class SupabaseInviteRepository implements InviteRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async findById(companyId: string, inviteId: string): Promise<InviteRecord | null> {
    const row = await this.client.selectOne<InviteRow>('provisioned_invites', {
      select: INVITE_SELECT,
      filters: this.visibleTenantFilters(companyId, [{ column: 'id', operator: 'eq', value: inviteId }]),
    });

    return row ? toInviteRecord(row) : null;
  }

  public async findByToken(token: string): Promise<InviteRecord | null> {
    const row = await this.client.selectOne<InviteRow>('provisioned_invites', {
      select: INVITE_SELECT,
      filters: [
        { column: 'token', operator: 'eq', value: token },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });

    return row ? toInviteRecord(row) : null;
  }

  public async findPendingByEmail(companyId: string, normalizedEmail: string): Promise<InviteRecord | null> {
    const row = await this.client.selectOne<InviteRow>('provisioned_invites', {
      select: INVITE_SELECT,
      filters: this.visibleTenantFilters(companyId, [
        { column: 'normalized_email', operator: 'eq', value: normalizeEmail(normalizedEmail) },
        { column: 'status', operator: 'eq', value: 'PENDING_SETUP' },
      ]),
    });

    return row ? toInviteRecord(row) : null;
  }

  public async listByCompany(companyId: string, filters: InviteListFilters): Promise<InviteListResult> {
    const search = filters.search?.trim();
    const result = await this.client.select<InviteRow>('provisioned_invites', {
      select: INVITE_SELECT,
      filters: filters.includeDeleted
        ? [{ column: 'company_id', operator: 'eq', value: companyId }]
        : this.visibleTenantFilters(companyId, []),
      or: search ? `name.ilike.*${search}*,email.ilike.*${search}*,cpf.ilike.*${search}*` : undefined,
      order: [{ column: 'created_at', ascending: false }],
      range: {
        offset: (filters.page - 1) * filters.limit,
        limit: filters.limit,
      },
      count: true,
    });

    return {
      items: result.rows.map(toInviteRecord),
      total: result.total ?? result.rows.length,
    };
  }

  public async listAll(filters: InviteListFilters): Promise<InviteListResult> {
    const filterList: Array<{ column: string; operator: 'eq' | 'is' | 'ilike' | 'in'; value: string | number | boolean | null }> = [];
    if (filters.companyId) {
      filterList.push({ column: 'company_id', operator: 'eq', value: filters.companyId });
    }
    if (!filters.includeDeleted) {
      filterList.push({ column: 'deleted_at', operator: 'is', value: null });
    }

    const search = filters.search?.trim();
    const result = await this.client.select<InviteRow>('provisioned_invites', {
      select: INVITE_SELECT,
      filters: filterList,
      or: search ? `name.ilike.*${search}*,email.ilike.*${search}*,cpf.ilike.*${search}*` : undefined,
      order: [{ column: 'created_at', ascending: false }],
      range: {
        offset: (filters.page - 1) * filters.limit,
        limit: filters.limit,
      },
      count: true,
    });

    return {
      items: result.rows.map(toInviteRecord),
      total: result.total ?? result.rows.length,
    };
  }

  public async save(invite: InviteRecord): Promise<InviteRecord> {
    const row = await this.client.upsert<InviteRow>('provisioned_invites', fromInviteRecord(invite), {
      select: INVITE_SELECT,
      onConflict: 'id',
    });

    return toInviteRecord(row);
  }

  private visibleTenantFilters(
    companyId: string,
    extra: Array<{ column: string; operator: 'eq' | 'is' | 'ilike' | 'in'; value: string | number | boolean | null }>,
  ) {
    return [
      { column: 'company_id', operator: 'eq' as const, value: companyId },
      { column: 'deleted_at', operator: 'is' as const, value: null },
      ...extra,
    ];
  }
}
