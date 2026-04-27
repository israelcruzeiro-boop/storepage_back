export interface TenantSummary {
  id: string;
  slug: string;
  linkName: string;
  name: string;
}

export interface TenantRepository {
  findByCompanyId(companyId: string): Promise<TenantSummary | null>;
  findBySlugOrLinkName(slugOrLinkName: string): Promise<TenantSummary | null>;
}
