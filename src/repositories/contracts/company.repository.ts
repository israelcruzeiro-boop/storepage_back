import type { CompanyRecord } from '../../modules/company/contracts/company.types.js';

export interface CompanyListFilters {
  includeDeleted?: boolean;
}

export interface CompanyRepository {
  findById(companyId: string): Promise<CompanyRecord | null>;
  findAnyById(companyId: string): Promise<CompanyRecord | null>;
  list(filters?: CompanyListFilters): Promise<CompanyRecord[]>;
  listBySlug(slug: string): Promise<CompanyRecord[]>;
  findBySlugOrLinkName(slugOrLinkName: string): Promise<CompanyRecord | null>;
  save(company: CompanyRecord): Promise<CompanyRecord>;
}
