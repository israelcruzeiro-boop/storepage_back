import { AppError } from '../lib/errors.js';
import { normalizeSlug } from '../lib/normalization.js';
import { TtlCache } from '../lib/ttl-cache.js';
import type {
  CompanyAuthenticatedView,
  CompanyFeatureFlags,
  CompanyPublicView,
  CompanyRecord,
} from '../modules/company/contracts/company.types.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type { CompanyRepository } from '../repositories/contracts/company.repository.js';

interface UpdateAppearanceInput {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  theme?: Partial<CompanyRecord['branding']['theme']>;
  hero?: Partial<CompanyRecord['branding']['hero']>;
}

type UpdateFeaturesInput = Partial<CompanyFeatureFlags>;

interface UpdateGeneralInput {
  name?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  active?: boolean;
  orgLevels?: string[];
  orgUnitName?: string;
  supportEmail?: string | null;
}

export class CompanyService {
  private readonly publicCompanyCache: TtlCache<string, CompanyPublicView>;

  public constructor(
    private readonly companyRepository: CompanyRepository,
    publicCacheTtlMs: number,
  ) {
    this.publicCompanyCache = new TtlCache<string, CompanyPublicView>(publicCacheTtlMs);
  }

  public async getCompanyRecord(companyId: string): Promise<CompanyRecord> {
    const company = await this.companyRepository.findById(companyId);

    if (!company) {
      throw new AppError(404, 'NOT_FOUND', 'Company not found.');
    }

    return company;
  }

  public async resolvePublicTenant(slugOrLinkName: string): Promise<Pick<CompanyRecord, 'id' | 'slug' | 'linkName' | 'name'> | null> {
    const company = await this.companyRepository.findBySlugOrLinkName(slugOrLinkName);

    if (!company || !company.active || company.status !== 'ACTIVE') {
      return null;
    }

    return {
      id: company.id,
      slug: company.slug,
      linkName: company.linkName,
      name: company.name,
    };
  }

  public async resolveLoginTenantBySlug(slug: string): Promise<Pick<CompanyRecord, 'id' | 'slug' | 'name'>> {
    const matches = await this.companyRepository.listBySlug(normalizeSlug(slug));
    const activeMatches = matches.filter((company) => company.active && company.status === 'ACTIVE');

    if (activeMatches.length !== 1) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid identifier or password.');
    }

    const company = activeMatches[0]!;

    return {
      id: company.id,
      slug: company.slug,
      name: company.name,
    };
  }

  public async getCurrentCompany(companyId: string): Promise<CompanyAuthenticatedView> {
    return this.toAuthenticatedView(await this.getCompanyRecord(companyId));
  }

  public async listForActor(actor: AuthenticatedActor, includeDeleted = false): Promise<CompanyAuthenticatedView[]> {
    if (actor.role === 'SUPER_ADMIN') {
      const companies = await this.companyRepository.list({ includeDeleted });
      return companies.map((company) => this.toAuthenticatedView(company));
    }

    const company = await this.getCompanyRecord(actor.companyId);
    return [this.toAuthenticatedView(company)];
  }

  public async getPublicCompanyById(companyId: string): Promise<CompanyPublicView> {
    const company = await this.getCompanyRecord(companyId);

    if (!company.active || company.status !== 'ACTIVE') {
      throw new AppError(404, 'TENANT_NOT_FOUND', 'Tenant not found.');
    }

    return this.toPublicView(company);
  }

  public async getPublicCompany(slugOrLinkName: string): Promise<CompanyPublicView> {
    const normalized = normalizeSlug(slugOrLinkName);
    const cachedCompany = this.publicCompanyCache.get(normalized);

    if (cachedCompany) {
      return cachedCompany;
    }

    const company = await this.companyRepository.findBySlugOrLinkName(normalized);

    if (!company || !company.active || company.status !== 'ACTIVE') {
      throw new AppError(404, 'TENANT_NOT_FOUND', 'Tenant not found.');
    }

    const publicView = this.toPublicView(company);
    this.publicCompanyCache.set(company.slug, publicView);
    this.publicCompanyCache.set(company.linkName, publicView);

    return publicView;
  }

  public async getPublicAppearance(slugOrLinkName: string) {
    const company = await this.getPublicCompany(slugOrLinkName);

    return {
      companyId: company.id,
      name: company.name,
      slug: company.slug,
      linkName: company.linkName,
      branding: company.branding,
      orgUnitName: company.general.orgUnitName,
      orgLevels: company.general.orgLevels,
    };
  }

  public async getFeatureFlags(companyId: string): Promise<CompanyFeatureFlags> {
    const company = await this.getCompanyRecord(companyId);
    return company.features;
  }

  public async updateAppearance(companyId: string, input: UpdateAppearanceInput): Promise<CompanyAuthenticatedView> {
    const company = await this.getCompanyRecord(companyId);
    const updatedCompany: CompanyRecord = {
      ...company,
      branding: {
        ...company.branding,
        logoUrl: input.logoUrl === undefined ? company.branding.logoUrl : input.logoUrl,
        faviconUrl: input.faviconUrl === undefined ? company.branding.faviconUrl : input.faviconUrl,
        theme: {
          ...company.branding.theme,
          ...input.theme,
        },
        hero: {
          ...company.branding.hero,
          ...input.hero,
        },
      },
      updatedAt: new Date().toISOString(),
    };

    await this.companyRepository.save(updatedCompany);
    this.invalidatePublicCache(updatedCompany);
    return this.toAuthenticatedView(updatedCompany);
  }

  public async updateFeatures(companyId: string, input: UpdateFeaturesInput): Promise<CompanyAuthenticatedView> {
    const company = await this.getCompanyRecord(companyId);
    const updatedCompany: CompanyRecord = {
      ...company,
      features: {
        ...company.features,
        ...input,
      },
      updatedAt: new Date().toISOString(),
    };

    await this.companyRepository.save(updatedCompany);
    return this.toAuthenticatedView(updatedCompany);
  }

  public async updateGeneral(companyId: string, input: UpdateGeneralInput): Promise<CompanyAuthenticatedView> {
    const company = await this.getCompanyRecord(companyId);
    const updatedCompany: CompanyRecord = {
      ...company,
      name: input.name ?? company.name,
      status: input.status ?? company.status,
      active: input.active ?? company.active,
      general: {
        orgLevels: input.orgLevels ?? company.general.orgLevels,
        orgUnitName: input.orgUnitName ?? company.general.orgUnitName,
        supportEmail: input.supportEmail === undefined ? company.general.supportEmail : input.supportEmail,
      },
      updatedAt: new Date().toISOString(),
    };

    await this.companyRepository.save(updatedCompany);
    this.invalidatePublicCache(updatedCompany);
    return this.toAuthenticatedView(updatedCompany);
  }

  private toPublicView(company: CompanyRecord): CompanyPublicView {
    return {
      id: company.id,
      name: company.name,
      slug: company.slug,
      linkName: company.linkName,
      branding: company.branding,
      general: {
        orgLevels: [...company.general.orgLevels],
        orgUnitName: company.general.orgUnitName,
      },
    };
  }

  private toAuthenticatedView(company: CompanyRecord): CompanyAuthenticatedView {
    return {
      ...this.toPublicView(company),
      status: company.status,
      active: company.active,
      features: company.features,
      supportEmail: company.general.supportEmail,
      landingPageEnabled: company.landingPageEnabled,
      landingPageActive: company.landingPageActive,
      landingPageLayout: company.landingPageLayout,
      deletedAt: company.deletedAt,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  private invalidatePublicCache(company: CompanyRecord): void {
    this.publicCompanyCache.delete(company.slug);
    this.publicCompanyCache.delete(company.linkName);
  }
}
