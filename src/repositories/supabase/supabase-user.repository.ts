import { normalizeEmail } from '../../lib/normalization.js';
import type { UserRecord } from '../../modules/user/contracts/user.types.js';
import type {
  UserIdentifierLookup,
  UserListFilters,
  UserListResult,
  UserRepository,
} from '../contracts/user.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
import { fromUserRecord, toUserRecord, USER_SELECT, type UserRow } from './supabase-row-mappers.js';

export class SupabaseUserRepository implements UserRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async findById(companyId: string, userId: string): Promise<UserRecord | null> {
    const row = await this.client.selectOne<UserRow>('users', {
      select: USER_SELECT,
      filters: this.visibleTenantFilters(companyId, [{ column: 'id', operator: 'eq', value: userId }]),
    });

    return row ? toUserRecord(row) : null;
  }

  public async findAnyById(userId: string): Promise<UserRecord | null> {
    const row = await this.client.selectOne<UserRow>('users', {
      select: USER_SELECT,
      filters: [{ column: 'id', operator: 'eq', value: userId }],
    });

    return row ? toUserRecord(row) : null;
  }

  public async findAnyByEmail(normalizedEmail: string): Promise<UserRecord | null> {
    const row = await this.client.selectOne<UserRow>('users', {
      select: USER_SELECT,
      filters: [
        { column: 'normalized_email', operator: 'eq', value: normalizeEmail(normalizedEmail) },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });

    return row ? toUserRecord(row) : null;
  }

  public async findByEmail(companyId: string, normalizedEmail: string): Promise<UserRecord | null> {
    const row = await this.client.selectOne<UserRow>('users', {
      select: USER_SELECT,
      filters: this.visibleTenantFilters(companyId, [
        { column: 'normalized_email', operator: 'eq', value: normalizeEmail(normalizedEmail) },
      ]),
    });

    return row ? toUserRecord(row) : null;
  }

  public async findByCpf(companyId: string, cpfDigits: string): Promise<UserRecord | null> {
    const row = await this.client.selectOne<UserRow>('users', {
      select: USER_SELECT,
      filters: this.visibleTenantFilters(companyId, [{ column: 'cpf', operator: 'eq', value: cpfDigits }]),
    });

    return row ? toUserRecord(row) : null;
  }

  public async findByIdentifier(lookup: UserIdentifierLookup): Promise<UserRecord | null> {
    const companyFilters = lookup.companyId ? [{ column: 'company_id', operator: 'eq' as const, value: lookup.companyId }] : [];
    const baseFilters = [
      ...companyFilters,
      { column: 'deleted_at', operator: 'is' as const, value: null },
    ];

    if (lookup.emailCandidates.length > 0) {
      const emails = lookup.emailCandidates.map((candidate) => normalizeEmail(candidate));
      const byEmail = await this.client.selectOne<UserRow>('users', {
        select: USER_SELECT,
        filters: baseFilters,
        or: emails.map((email) => `normalized_email.eq.${email}`).join(','),
      });

      if (byEmail) {
        return toUserRecord(byEmail);
      }
    }

    if (!lookup.cpfDigits) {
      return null;
    }

    const byCpf = await this.client.selectOne<UserRow>('users', {
      select: USER_SELECT,
      filters: [...baseFilters, { column: 'cpf', operator: 'eq', value: lookup.cpfDigits }],
    });

    return byCpf ? toUserRecord(byCpf) : null;
  }

  public async countByOrgUnit(companyId: string, orgUnitId: string): Promise<number> {
    const result = await this.client.select<{ id: string }>('users', {
      select: 'id',
      filters: this.visibleTenantFilters(companyId, [
        { column: 'org_unit_id', operator: 'eq', value: orgUnitId },
        { column: 'active', operator: 'eq', value: true },
      ]),
      count: true,
    });

    return result.total ?? result.rows.length;
  }

  public async listByCompany(companyId: string, filters: UserListFilters): Promise<UserListResult> {
    const filterList = filters.includeDeleted
      ? [{ column: 'company_id', operator: 'eq' as const, value: companyId }]
      : this.visibleTenantFilters(companyId, []);

    if (filters.status && filters.status !== 'ALL') {
      filterList.push({ column: 'status', operator: 'eq', value: filters.status });
    }

    const search = filters.search?.trim();
    const result = await this.client.select<UserRow>('users', {
      select: USER_SELECT,
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
      items: result.rows.map(toUserRecord),
      total: result.total ?? result.rows.length,
    };
  }

  public async listAll(filters: UserListFilters & { companyId?: string }): Promise<UserListResult> {
    const filterList: Array<{ column: string; operator: 'eq' | 'is' | 'ilike' | 'in'; value: string | number | boolean | null }> = [];

    if (filters.companyId) {
      filterList.push({ column: 'company_id', operator: 'eq', value: filters.companyId });
    }

    if (!filters.includeDeleted) {
      filterList.push({ column: 'deleted_at', operator: 'is', value: null });
    }

    if (filters.status && filters.status !== 'ALL') {
      filterList.push({ column: 'status', operator: 'eq', value: filters.status });
    }

    const search = filters.search?.trim();
    const result = await this.client.select<UserRow>('users', {
      select: USER_SELECT,
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
      items: result.rows.map(toUserRecord),
      total: result.total ?? result.rows.length,
    };
  }

  public async save(user: UserRecord): Promise<UserRecord> {
    const row = await this.client.upsert<UserRow>('users', fromUserRecord(user), {
      select: USER_SELECT,
      onConflict: 'id',
    });

    return toUserRecord(row);
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
