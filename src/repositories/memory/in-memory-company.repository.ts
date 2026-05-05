import type { CompanyRecord } from '../../modules/company/contracts/company.types.js';
import { normalizeSlug } from '../../lib/normalization.js';
import type { CompanyPaginatedListFilters, CompanyRepository } from '../contracts/company.repository.js';
import type { TenantRepository, TenantSummary } from '../contracts/tenant.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

function isAvailable(company: CompanyRecord): boolean {
  return company.deletedAt === null;
}

export class InMemoryCompanyRepository implements CompanyRepository, TenantRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async findById(companyId: string): Promise<CompanyRecord | null> {
    const company = this.store.getCompany(companyId);
    return company && isAvailable(company) ? company : null;
  }

  public async findAnyById(companyId: string): Promise<CompanyRecord | null> {
    return this.store.getCompany(companyId);
  }

  public async list(filters: { includeDeleted?: boolean } = {}): Promise<CompanyRecord[]> {
    return this.store
      .listCompanies()
      .filter((entry) => filters.includeDeleted || isAvailable(entry))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  public async listPaginated(filters: CompanyPaginatedListFilters) {
    const search = filters.search?.trim().toLowerCase();
    const filtered = this.store
      .listCompanies()
      .filter((entry) => filters.includeDeleted || isAvailable(entry))
      .filter((entry) => {
        if (filters.status === 'ACTIVE') return entry.active && entry.status === 'ACTIVE';
        if (filters.status === 'INACTIVE') return !entry.active || entry.status === 'INACTIVE';
        return true;
      })
      .filter((entry) => {
        if (!search) return true;
        return [entry.name, entry.slug, entry.linkName].some((value) => value.toLowerCase().includes(search));
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const offset = (filters.page - 1) * filters.limit;
    return {
      items: filtered.slice(offset, offset + filters.limit),
      total: filtered.length,
    };
  }

  public async listBySlug(slug: string): Promise<CompanyRecord[]> {
    const normalized = normalizeSlug(slug);

    return this.store.listCompanies().filter((entry) => isAvailable(entry) && entry.slug === normalized);
  }

  public async findBySlugOrLinkName(slugOrLinkName: string): Promise<CompanyRecord | null> {
    const normalized = normalizeSlug(slugOrLinkName);

    const company =
      this.store
        .listCompanies()
        .find((entry) => isAvailable(entry) && (entry.slug === normalized || entry.linkName === normalized)) ?? null;

    return company;
  }

  public async save(company: CompanyRecord): Promise<CompanyRecord> {
    return this.store.setCompany(company);
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
