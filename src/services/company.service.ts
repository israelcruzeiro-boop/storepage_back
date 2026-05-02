import { randomUUID } from 'node:crypto';
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
import type { OrgTopLevelRecord } from '../modules/structure/contracts/structure.types.js';
import type { CompanyRepository } from '../repositories/contracts/company.repository.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';

interface UpdateAppearanceInput {
  logoUrl?: string | null;
  faviconUrl?: string | null;
  theme?: Partial<CompanyRecord['branding']['theme']>;
  hero?: Partial<CompanyRecord['branding']['hero']>;
  landingPageActive?: boolean;
  landingPageLayout?: string | null;
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

interface InsertParentLevelInput {
  orgLevels: string[];
  orgUnitName?: string;
  parentName: string;
  childTopLevelIds: string[];
}

export class CompanyService {
  private readonly publicCompanyCache: TtlCache<string, CompanyPublicView>;

  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly structureRepository: StructureRepository,
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
      landingPageActive: input.landingPageActive ?? company.landingPageActive,
      landingPageLayout: input.landingPageLayout === undefined ? company.landingPageLayout : input.landingPageLayout,
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
    if (input.orgLevels !== undefined) {
      await this.assertOrgLevelsCompatible(companyId, input.orgLevels);
    }

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

  public async insertParentLevel(companyId: string, input: InsertParentLevelInput): Promise<CompanyAuthenticatedView> {
    const company = await this.getCompanyRecord(companyId);
    const currentOrgLevels = company.general.orgLevels;
    const nextOrgLevels = input.orgLevels.map((level) => level.trim());
    const parentName = input.parentName.trim();

    if (currentOrgLevels.length !== 1 || nextOrgLevels.length !== 2) {
      throw new AppError(
        400,
        'BAD_REQUEST',
        'This transition is only available when inserting a new parent level above an existing single-level hierarchy.',
      );
    }

    if (nextOrgLevels[1] !== currentOrgLevels[0]) {
      throw new AppError(
        400,
        'BAD_REQUEST',
        'The existing hierarchy level must be preserved as the second level during this transition.',
      );
    }

    const [topLevels, units] = await Promise.all([
      this.structureRepository.listTopLevels(companyId),
      this.structureRepository.listUnits(companyId),
    ]);

    const existingLevelOneNodes = topLevels.filter((topLevel) => topLevel.levelIndex === 1);
    const outOfRangeNode = topLevels.find((topLevel) => topLevel.levelIndex !== 1);
    if (outOfRangeNode) {
      throw new AppError(
        409,
        'RESOURCE_IN_USE',
        'Cannot insert a parent level because this hierarchy already has nodes outside the current leaf level.',
      );
    }

    if (existingLevelOneNodes.length === 0) {
      throw new AppError(
        409,
        'RESOURCE_IN_USE',
        'Create at least one existing leaf node before starting the parent-level transition.',
      );
    }

    const childIds = new Set(input.childTopLevelIds);
    if (childIds.size !== input.childTopLevelIds.length || childIds.size !== existingLevelOneNodes.length) {
      throw new AppError(
        400,
        'BAD_REQUEST',
        'Map every existing leaf node exactly once before inserting the new parent level.',
      );
    }

    const existingIds = new Set(existingLevelOneNodes.map((topLevel) => topLevel.id));
    const hasUnknownChild = input.childTopLevelIds.some((id) => !existingIds.has(id));
    if (hasUnknownChild) {
      throw new AppError(400, 'BAD_REQUEST', 'One or more mapped hierarchy nodes were not found in this tenant.');
    }

    this.assertLegacyParentLinksCompatible(existingLevelOneNodes);

    const unitWithInvalidParent = units.find((unit) => unit.topLevelId && !existingIds.has(unit.topLevelId));
    if (unitWithInvalidParent) {
      throw new AppError(
        409,
        'RESOURCE_IN_USE',
        'All units must be linked to an existing leaf hierarchy node before inserting a parent level.',
      );
    }

    const now = new Date().toISOString();
    const result = await this.structureRepository.insertParentLevelTransition({
      company,
      parentTopLevel: {
        id: randomUUID(),
        companyId,
        name: parentName,
        levelIndex: 1,
        parentId: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      childTopLevelIds: input.childTopLevelIds,
      nextOrgLevels,
      orgUnitName: input.orgUnitName,
    });

    this.invalidatePublicCache(result.company);
    return this.toAuthenticatedView(result.company);
  }

  private assertLegacyParentLinksCompatible(topLevels: OrgTopLevelRecord[]): void {
    const topLevelsById = new Map(topLevels.map((topLevel) => [topLevel.id, topLevel]));

    for (const topLevel of topLevels) {
      if (!topLevel.parentId) continue;

      if (!topLevelsById.has(topLevel.parentId)) {
        throw new AppError(
          409,
          'RESOURCE_IN_USE',
          'Cannot insert a parent level because an existing hierarchy parent belongs to another tenant or no longer exists.',
        );
      }
    }

    for (const topLevel of topLevels) {
      const visited = new Set<string>();
      let cursor: OrgTopLevelRecord | undefined = topLevel;

      while (cursor?.parentId) {
        if (visited.has(cursor.id)) {
          throw new AppError(
            409,
            'RESOURCE_IN_USE',
            'Cannot insert a parent level because the existing hierarchy contains a parent cycle.',
          );
        }

        visited.add(cursor.id);
        cursor = topLevelsById.get(cursor.parentId);
      }
    }
  }

  private async assertOrgLevelsCompatible(companyId: string, nextOrgLevels: string[]): Promise<void> {
    const [topLevels, units] = await Promise.all([
      this.structureRepository.listTopLevels(companyId),
      this.structureRepository.listUnits(companyId),
    ]);
    const nextLeafLevelIndex = nextOrgLevels.length;
    const outOfRangeTopLevel = topLevels.find((topLevel) => topLevel.levelIndex > nextLeafLevelIndex);

    if (outOfRangeTopLevel) {
      throw new AppError(
        409,
        'RESOURCE_IN_USE',
        'Cannot update organization levels because existing top-level nodes are outside the new hierarchy configuration.',
      );
    }

    const topLevelsById = new Map(topLevels.map((topLevel) => [topLevel.id, topLevel]));
    const unitLinkedToNonLeaf = units.find((unit) => {
      if (!unit.topLevelId) return false;
      const topLevel = topLevelsById.get(unit.topLevelId);
      return !topLevel || topLevel.levelIndex !== nextLeafLevelIndex;
    });

    if (unitLinkedToNonLeaf) {
      throw new AppError(
        409,
        'RESOURCE_IN_USE',
        'Cannot update organization levels because existing units would be linked to a non-leaf hierarchy level.',
      );
    }
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
