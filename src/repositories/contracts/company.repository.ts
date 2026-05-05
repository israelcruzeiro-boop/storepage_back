import type { CompanyRecord } from '../../modules/company/contracts/company.types.js';

export interface CompanyListFilters {
  includeDeleted?: boolean;
}

export interface CompanyPaginatedListFilters extends CompanyListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
}

export interface CompanyListResult {
  items: CompanyRecord[];
  total: number;
}

export interface CompanyRepository {
  findById(companyId: string): Promise<CompanyRecord | null>;
  findAnyById(companyId: string): Promise<CompanyRecord | null>;
  list(filters?: CompanyListFilters): Promise<CompanyRecord[]>;
  listPaginated(filters: CompanyPaginatedListFilters): Promise<CompanyListResult>;
  listBySlug(slug: string): Promise<CompanyRecord[]>;
  findBySlugOrLinkName(slugOrLinkName: string): Promise<CompanyRecord | null>;
  save(company: CompanyRecord): Promise<CompanyRecord>;
}
