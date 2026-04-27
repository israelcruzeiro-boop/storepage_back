export interface CompanyFeatureFlags {
  repositories: boolean;
  lms: boolean;
  checklists: boolean;
  surveys: boolean;
  metrics: boolean;
}

export interface CompanyTheme {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
}

export interface CompanyHero {
  title: string;
  subtitle: string;
  ctaLabel: string | null;
  imageUrl: string | null;
}

export interface CompanyBranding {
  logoUrl: string | null;
  faviconUrl: string | null;
  theme: CompanyTheme;
  hero: CompanyHero;
}

export interface CompanyGeneralSettings {
  orgLevels: string[];
  orgUnitName: string;
  supportEmail: string | null;
}

export interface CompanyRecord {
  id: string;
  name: string;
  slug: string;
  linkName: string;
  status: 'ACTIVE' | 'INACTIVE';
  active: boolean;
  landingPageEnabled?: boolean;
  landingPageActive?: boolean;
  landingPageLayout?: string | null;
  branding: CompanyBranding;
  features: CompanyFeatureFlags;
  general: CompanyGeneralSettings;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyPublicView {
  id: string;
  name: string;
  slug: string;
  linkName: string;
  branding: CompanyBranding;
  general: Pick<CompanyGeneralSettings, 'orgLevels' | 'orgUnitName'>;
}

export interface CompanyAuthenticatedView extends CompanyPublicView {
  status: 'ACTIVE' | 'INACTIVE';
  active: boolean;
  features: CompanyFeatureFlags;
  supportEmail: string | null;
  landingPageEnabled?: boolean;
  landingPageActive?: boolean;
  landingPageLayout?: string | null;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
