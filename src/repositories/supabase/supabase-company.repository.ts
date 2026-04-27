import { normalizeSlug } from '../../lib/normalization.js';
import type { CompanyRecord } from '../../modules/company/contracts/company.types.js';
import type { CompanyRepository } from '../contracts/company.repository.js';
import type { TenantRepository, TenantSummary } from '../contracts/tenant.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
import { COMPANY_SELECT, fromCompanyRecord, toCompanyRecord, type CompanyRow } from './supabase-row-mappers.js';

export class SupabaseCompanyRepository implements CompanyRepository, TenantRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async findById(companyId: string): Promise<CompanyRecord | null> {
    const row = await this.client.selectOne<CompanyRow>('companies', {
      select: COMPANY_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: companyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });

    return row ? toCompanyRecord(row) : null;
  }

  public async findAnyById(companyId: string): Promise<CompanyRecord | null> {
    const row = await this.client.selectOne<CompanyRow>('companies', {
      select: COMPANY_SELECT,
      filters: [{ column: 'id', operator: 'eq', value: companyId }],
    });

    return row ? toCompanyRecord(row) : null;
  }

  public async list(filters: { includeDeleted?: boolean } = {}): Promise<CompanyRecord[]> {
    const result = await this.client.select<CompanyRow>('companies', {
      select: COMPANY_SELECT,
      filters: filters.includeDeleted ? [] : [{ column: 'deleted_at', operator: 'is', value: null }],
      order: [{ column: 'name' }],
    });

    return result.rows.map(toCompanyRecord);
  }

  public async listBySlug(slug: string): Promise<CompanyRecord[]> {
    const result = await this.client.select<CompanyRow>('companies', {
      select: COMPANY_SELECT,
      filters: [
        { column: 'slug', operator: 'eq', value: normalizeSlug(slug) },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'created_at' }],
    });

    return result.rows.map(toCompanyRecord);
  }

  public async findBySlugOrLinkName(slugOrLinkName: string): Promise<CompanyRecord | null> {
    const normalized = normalizeSlug(slugOrLinkName);
    const row = await this.client.selectOne<CompanyRow>('companies', {
      select: COMPANY_SELECT,
      filters: [{ column: 'deleted_at', operator: 'is', value: null }],
      or: `slug.eq.${normalized},link_name.eq.${normalized}`,
    });

    return row ? toCompanyRecord(row) : null;
  }

  public async save(company: CompanyRecord): Promise<CompanyRecord> {
    const row = await this.client.upsert<CompanyRow>('companies', fromCompanyRecord(company), {
      select: COMPANY_SELECT,
      onConflict: 'id',
    });

    return toCompanyRecord(row);
  }

  public async findByCompanyId(companyId: string): Promise<TenantSummary | null> {
    const company = await this.findById(companyId);

    if (!company) {
      return null;
    }

    return {
      id: company.id,
      slug: company.slug,
      linkName: company.linkName,
      name: company.name,
    };
  }
}
