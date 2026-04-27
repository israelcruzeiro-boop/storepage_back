interface BaseTenantContext {
  source: 'header' | 'none' | 'session';
  slug: string | null;
  trusted: boolean;
}

export interface UnresolvedTenantContext extends BaseTenantContext {
  isResolved: false;
  companyId: null;
}

export interface ResolvedTenantContext extends BaseTenantContext {
  isResolved: true;
  companyId: string;
}

export type TenantContext = ResolvedTenantContext | UnresolvedTenantContext;
