import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type {
  CategoryRecord,
  ContentRecord,
  ContentViewRecord,
  RepositoryRecord,
  SimpleLinkRecord,
} from '../modules/content/contracts/content.types.js';
import type { CompanyRepository } from '../repositories/contracts/company.repository.js';
import type { ContentRepository } from '../repositories/contracts/content.repository.js';

interface RepositoryInput {
  name: string;
  description: string;
  type: RepositoryRecord['type'];
  coverImage?: string | null;
  bannerImage?: string | null;
  bannerPosition?: number | null;
  bannerBrightness?: number | null;
  featured: boolean;
  showInLanding: boolean;
  status: RepositoryRecord['status'];
  accessType: RepositoryRecord['accessType'];
  allowedUserIds: string[];
  allowedRegionIds: string[];
  allowedStoreIds: string[];
  excludedUserIds: string[];
}
type RepositoryUpdateInput = Partial<RepositoryInput>;
type CategoryInput = Pick<CategoryRecord, 'name' | 'orderIndex'>;
type CategoryUpdateInput = Partial<CategoryInput>;
interface ContentInput {
  repositoryId: string;
  categoryId?: string | null;
  title: string;
  description: string;
  thumbnailUrl?: string | null;
  type: ContentRecord['type'];
  url: string;
  embedUrl?: string | null;
  featured: boolean;
  recent: boolean;
  status: ContentRecord['status'];
}
type ContentUpdateInput = Partial<ContentInput>;
interface SimpleLinkInput {
  repositoryId: string;
  name: string;
  url: string;
  type: string;
  date?: string | null;
  status: SimpleLinkRecord['status'];
}
type SimpleLinkUpdateInput = Partial<SimpleLinkInput>;

export class ContentLibraryService {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly contentRepository: ContentRepository,
  ) {}

  public async listRepositories(actor: AuthenticatedActor) {
    const repositories = await this.contentRepository.listRepositories(actor.companyId);
    return repositories.filter((repository) => this.canReadRepository(actor, repository)).map(this.toRepositoryView);
  }

  public async getRepository(actor: AuthenticatedActor, repositoryId: string) {
    const repository = await this.getReadableRepository(actor, repositoryId);
    return this.toRepositoryView(repository);
  }

  public async getCatalog(actor: AuthenticatedActor, repositoryId: string) {
    const repository = await this.getReadableRepository(actor, repositoryId);
    const [categories, contents, simpleLinks] = await Promise.all([
      this.contentRepository.listCategories(repository.id),
      this.contentRepository.listContents(actor.companyId, { repositoryId: repository.id }),
      this.contentRepository.listSimpleLinks(actor.companyId, { repositoryId: repository.id }),
    ]);

    return {
      repository: this.toRepositoryView(repository),
      categories: categories.map(this.toCategoryView),
      contents: contents.map(this.toContentView),
      simpleLinks: simpleLinks.map(this.toSimpleLinkView),
    };
  }

  public async listContents(actor: AuthenticatedActor, repositoryId?: string) {
    if (repositoryId) {
      await this.getReadableRepository(actor, repositoryId);
    }

    const contents = await this.contentRepository.listContents(actor.companyId, { repositoryId });
    return contents.map(this.toContentView);
  }

  public async getContent(actor: AuthenticatedActor, contentId: string) {
    const content = await this.contentRepository.findContentById(actor.companyId, contentId);
    if (!content) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    await this.getReadableRepository(actor, content.repositoryId);
    return this.toContentView(content);
  }

  public async listCategories(actor: AuthenticatedActor, repositoryId: string) {
    await this.getReadableRepository(actor, repositoryId);
    const categories = await this.contentRepository.listCategories(repositoryId);
    return categories.map(this.toCategoryView);
  }

  public async listSimpleLinks(actor: AuthenticatedActor, repositoryId?: string) {
    if (repositoryId) {
      await this.getReadableRepository(actor, repositoryId);
    }

    const simpleLinks = await this.contentRepository.listSimpleLinks(actor.companyId, { repositoryId });
    return simpleLinks.map(this.toSimpleLinkView);
  }

  public async createRepository(companyId: string, input: RepositoryInput) {
    const now = new Date().toISOString();
    const repository: RepositoryRecord = {
      id: randomUUID(),
      companyId,
      ...input,
      coverImage: input.coverImage ?? null,
      bannerImage: input.bannerImage ?? null,
      bannerPosition: input.bannerPosition ?? null,
      bannerBrightness: input.bannerBrightness ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.toRepositoryView(await this.contentRepository.saveRepository(repository));
  }

  public async updateRepository(companyId: string, repositoryId: string, input: RepositoryUpdateInput) {
    const repository = await this.getTenantRepository(companyId, repositoryId);
    const updatedRepository: RepositoryRecord = {
      ...repository,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    return this.toRepositoryView(await this.contentRepository.saveRepository(updatedRepository));
  }

  public async deleteRepository(companyId: string, repositoryId: string) {
    const repository = await this.getTenantRepository(companyId, repositoryId);
    const deletedAt = new Date().toISOString();
    await this.contentRepository.saveRepository({
      ...repository,
      deletedAt,
      updatedAt: deletedAt,
    });

    return { deleted: true, id: repositoryId };
  }

  public async createCategory(companyId: string, repositoryId: string, input: CategoryInput) {
    await this.getTenantRepository(companyId, repositoryId);
    const now = new Date().toISOString();
    const category: CategoryRecord = {
      id: randomUUID(),
      repositoryId,
      name: input.name,
      orderIndex: input.orderIndex,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.toCategoryView(await this.contentRepository.saveCategory(category));
  }

  public async updateCategory(companyId: string, categoryId: string, input: CategoryUpdateInput) {
    const category = await this.getTenantCategory(companyId, categoryId);
    const updatedCategory: CategoryRecord = {
      ...category,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    return this.toCategoryView(await this.contentRepository.saveCategory(updatedCategory));
  }

  public async deleteCategory(companyId: string, categoryId: string) {
    const category = await this.getTenantCategory(companyId, categoryId);
    const deletedAt = new Date().toISOString();
    await this.contentRepository.saveCategory({
      ...category,
      deletedAt,
      updatedAt: deletedAt,
    });

    return { deleted: true, id: categoryId };
  }

  public async createContent(companyId: string, input: ContentInput) {
    await this.getTenantRepository(companyId, input.repositoryId);
    if (input.categoryId) await this.assertCategoryBelongsToRepository(companyId, input.categoryId, input.repositoryId);

    const now = new Date().toISOString();
    const content: ContentRecord = {
      id: randomUUID(),
      companyId,
      ...input,
      categoryId: input.categoryId ?? null,
      thumbnailUrl: input.thumbnailUrl ?? null,
      embedUrl: input.embedUrl ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.toContentView(await this.contentRepository.saveContent(content));
  }

  public async updateContent(companyId: string, contentId: string, input: ContentUpdateInput) {
    const content = await this.getTenantContent(companyId, contentId);
    const nextRepositoryId = input.repositoryId ?? content.repositoryId;
    await this.getTenantRepository(companyId, nextRepositoryId);
    const nextCategoryId = input.categoryId === undefined ? content.categoryId : input.categoryId;
    if (nextCategoryId) await this.assertCategoryBelongsToRepository(companyId, nextCategoryId, nextRepositoryId);

    const updatedContent: ContentRecord = {
      ...content,
      ...input,
      repositoryId: nextRepositoryId,
      categoryId: nextCategoryId,
      updatedAt: new Date().toISOString(),
    };

    return this.toContentView(await this.contentRepository.saveContent(updatedContent));
  }

  public async deleteContent(companyId: string, contentId: string) {
    const content = await this.getTenantContent(companyId, contentId);
    const deletedAt = new Date().toISOString();
    await this.contentRepository.saveContent({
      ...content,
      deletedAt,
      updatedAt: deletedAt,
    });

    return { deleted: true, id: contentId };
  }

  public async createSimpleLink(companyId: string, input: SimpleLinkInput) {
    await this.getTenantRepository(companyId, input.repositoryId);
    const now = new Date().toISOString();
    const simpleLink: SimpleLinkRecord = {
      id: randomUUID(),
      companyId,
      ...input,
      date: input.date ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.toSimpleLinkView(await this.contentRepository.saveSimpleLink(simpleLink));
  }

  public async updateSimpleLink(companyId: string, simpleLinkId: string, input: SimpleLinkUpdateInput) {
    const simpleLink = await this.getTenantSimpleLink(companyId, simpleLinkId);
    const nextRepositoryId = input.repositoryId ?? simpleLink.repositoryId;
    await this.getTenantRepository(companyId, nextRepositoryId);
    const updatedSimpleLink: SimpleLinkRecord = {
      ...simpleLink,
      ...input,
      repositoryId: nextRepositoryId,
      updatedAt: new Date().toISOString(),
    };

    return this.toSimpleLinkView(await this.contentRepository.saveSimpleLink(updatedSimpleLink));
  }

  public async deleteSimpleLink(companyId: string, simpleLinkId: string) {
    const simpleLink = await this.getTenantSimpleLink(companyId, simpleLinkId);
    const deletedAt = new Date().toISOString();
    await this.contentRepository.saveSimpleLink({
      ...simpleLink,
      deletedAt,
      updatedAt: deletedAt,
    });

    return { deleted: true, id: simpleLinkId };
  }

  public async getLanding(slug: string) {
    const company = await this.getPublicCompany(slug);
    return {
      companyId: company.id,
      name: company.name,
      slug: company.slug,
      branding: company.branding,
    };
  }

  public async listPublicRepositories(slug: string) {
    const company = await this.getPublicCompany(slug);
    const repositories = await this.contentRepository.listPublicRepositories(company.id);
    return repositories.map(this.toPublicRepositoryView);
  }

  public async listPublicContents(repositoryId: string) {
    const repository = await this.getPublicRepository(repositoryId);
    const contents = await this.contentRepository.listPublicContents(repository.id);
    return contents.map(this.toPublicContentView);
  }

  public async listPublicSimpleLinks(repositoryId: string) {
    const repository = await this.getPublicRepository(repositoryId);
    const simpleLinks = await this.contentRepository.listPublicSimpleLinks(repository.id);
    return simpleLinks.map(this.toPublicSimpleLinkView);
  }

  public async recordView(actor: AuthenticatedActor, input: { contentId: string; repositoryId: string; contentType: string }) {
    await this.assertMetricTarget(actor.companyId, input.repositoryId, input.contentId);
    await this.getReadableRepository(actor, input.repositoryId);

    const view: ContentViewRecord = {
      id: randomUUID(),
      userId: actor.userId,
      companyId: actor.companyId,
      repositoryId: input.repositoryId,
      contentId: input.contentId,
      contentType: input.contentType,
      orgUnitId: null,
      createdAt: new Date().toISOString(),
    };

    return this.toContentViewMetric(await this.contentRepository.saveContentView(view));
  }

  public async recordRating(actor: AuthenticatedActor, input: { contentId: string; repositoryId: string; rating: number }) {
    await this.assertMetricTarget(actor.companyId, input.repositoryId, input.contentId);
    await this.getReadableRepository(actor, input.repositoryId);

    const now = new Date().toISOString();
    const existing = await this.contentRepository.findRating(actor.companyId, actor.userId, input.contentId);
    const rating = {
      id: existing?.id ?? randomUUID(),
      userId: actor.userId,
      companyId: actor.companyId,
      repositoryId: input.repositoryId,
      contentId: input.contentId,
      rating: input.rating,
      orgUnitId: existing?.orgUnitId ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    return this.toContentRatingMetric(await this.contentRepository.saveRating(rating));
  }

  public async listViews(companyId: string, filters: { repositoryId?: string; userId?: string } = {}) {
    const views = await this.contentRepository.listContentViews(companyId, filters);
    return views.map(this.toContentViewMetric);
  }

  public async listRatings(companyId: string, filters: { repositoryId?: string } = {}) {
    const ratings = await this.contentRepository.listRatings(companyId, filters);
    return ratings.map(this.toContentRatingMetric);
  }

  public async getRepositoryMetrics(companyId: string, repositoryId: string) {
    await this.getTenantRepository(companyId, repositoryId);
    const [contents, views, ratings] = await Promise.all([
      this.contentRepository.listContents(companyId, { repositoryId }),
      this.contentRepository.listContentViews(companyId, { repositoryId }),
      this.contentRepository.listRatings(companyId, { repositoryId }),
    ]);

    return this.buildRepositoryMetrics(repositoryId, contents, views, ratings);
  }

  public async getSummary(companyId: string) {
    const [views, ratings] = await Promise.all([
      this.contentRepository.listContentViews(companyId),
      this.contentRepository.listRatings(companyId),
    ]);

    return {
      totalViews: views.length,
      totalRatings: ratings.length,
      activeUsers: new Set(views.map((view) => view.userId).filter(Boolean)).size,
    };
  }

  private async getPublicCompany(slug: string) {
    const company = await this.companyRepository.findBySlugOrLinkName(slug);
    if (!company || !company.active || company.status !== 'ACTIVE') {
      throw new AppError(404, 'TENANT_NOT_FOUND', 'Tenant not found.');
    }
    return company;
  }

  private async getTenantRepository(companyId: string, repositoryId: string) {
    const repository = await this.contentRepository.findRepositoryById(companyId, repositoryId);
    if (!repository) {
      throw new AppError(404, 'NOT_FOUND', 'Repository not found.');
    }
    return repository;
  }

  private async getTenantCategory(companyId: string, categoryId: string) {
    const category = await this.contentRepository.findCategoryById(companyId, categoryId);
    if (!category) {
      throw new AppError(404, 'NOT_FOUND', 'Category not found.');
    }
    return category;
  }

  private async getTenantContent(companyId: string, contentId: string) {
    const content = await this.contentRepository.findContentById(companyId, contentId);
    if (!content) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }
    return content;
  }

  private async getTenantSimpleLink(companyId: string, simpleLinkId: string) {
    const simpleLink = await this.contentRepository.findSimpleLinkById(companyId, simpleLinkId);
    if (!simpleLink) {
      throw new AppError(404, 'NOT_FOUND', 'Simple link not found.');
    }
    return simpleLink;
  }

  private async getReadableRepository(actor: AuthenticatedActor, repositoryId: string) {
    const repository = await this.getTenantRepository(actor.companyId, repositoryId);
    if (!this.canReadRepository(actor, repository)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this repository.');
    }
    return repository;
  }

  private async getPublicRepository(repositoryId: string) {
    const repository = await this.contentRepository.findPublicRepositoryById(repositoryId);
    if (!repository) {
      throw new AppError(404, 'NOT_FOUND', 'Public repository not found.');
    }

    const company = await this.companyRepository.findById(repository.companyId);
    if (!company || !company.active || company.status !== 'ACTIVE') {
      throw new AppError(404, 'TENANT_NOT_FOUND', 'Tenant not found.');
    }

    return repository;
  }

  private async assertCategoryBelongsToRepository(companyId: string, categoryId: string, repositoryId: string): Promise<void> {
    const category = await this.getTenantCategory(companyId, categoryId);
    if (category.repositoryId !== repositoryId) {
      throw new AppError(400, 'BAD_REQUEST', 'Category does not belong to the provided repository.');
    }
  }

  private async assertMetricTarget(companyId: string, repositoryId: string, contentId: string): Promise<void> {
    const [content, simpleLink] = await Promise.all([
      this.contentRepository.findContentById(companyId, contentId),
      this.contentRepository.findSimpleLinkById(companyId, contentId),
    ]);

    if (content?.repositoryId === repositoryId || simpleLink?.repositoryId === repositoryId) {
      return;
    }

    throw new AppError(404, 'NOT_FOUND', 'Content or simple link not found for the provided repository.');
  }

  private canReadRepository(actor: AuthenticatedActor, repository: RepositoryRecord): boolean {
    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') return true;
    if (repository.excludedUserIds.includes(actor.userId)) return false;
    if (repository.accessType === 'ALL') return true;
    return repository.allowedUserIds.length === 0 || repository.allowedUserIds.includes(actor.userId);
  }

  private buildRepositoryMetrics(
    repositoryId: string,
    contents: ContentRecord[],
    views: ContentViewRecord[],
    ratings: Awaited<ReturnType<ContentRepository['listRatings']>>,
  ) {
    const ratingAverage =
      ratings.length === 0 ? 0 : ratings.reduce((total, rating) => total + rating.rating, 0) / ratings.length;

    return {
      repositoryId,
      totalViews: views.length,
      totalRatings: ratings.length,
      averageRating: Number(ratingAverage.toFixed(2)),
      contents: contents.map((content) => {
        const contentViews = views.filter((view) => view.contentId === content.id);
        const contentRatings = ratings.filter((rating) => rating.contentId === content.id);
        const averageRating =
          contentRatings.length === 0
            ? null
            : Number((contentRatings.reduce((total, rating) => total + rating.rating, 0) / contentRatings.length).toFixed(2));

        return {
          contentId: content.id,
          title: content.title,
          views: contentViews.length,
          averageRating,
        };
      }),
    };
  }

  private toRepositoryView(repository: RepositoryRecord) {
    return {
      id: repository.id,
      companyId: repository.companyId,
      name: repository.name,
      description: repository.description,
      type: repository.type,
      coverImage: repository.coverImage,
      bannerImage: repository.bannerImage,
      bannerPosition: repository.bannerPosition,
      bannerBrightness: repository.bannerBrightness,
      featured: repository.featured,
      showInLanding: repository.showInLanding,
      status: repository.status,
      accessType: repository.accessType,
      allowedUserIds: repository.allowedUserIds,
      allowedRegionIds: repository.allowedRegionIds,
      allowedStoreIds: repository.allowedStoreIds,
      excludedUserIds: repository.excludedUserIds,
      createdAt: repository.createdAt,
      updatedAt: repository.updatedAt,
    };
  }

  private toPublicRepositoryView(repository: RepositoryRecord) {
    return {
      id: repository.id,
      name: repository.name,
      description: repository.description,
      type: repository.type,
      coverImage: repository.coverImage,
      featured: repository.featured,
      status: repository.status,
    };
  }

  private toCategoryView(category: CategoryRecord) {
    return {
      id: category.id,
      repositoryId: category.repositoryId,
      name: category.name,
      orderIndex: category.orderIndex,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private toContentView(content: ContentRecord) {
    return {
      id: content.id,
      companyId: content.companyId,
      repositoryId: content.repositoryId,
      categoryId: content.categoryId,
      title: content.title,
      description: content.description,
      thumbnailUrl: content.thumbnailUrl,
      type: content.type,
      url: content.url,
      embedUrl: content.embedUrl,
      featured: content.featured,
      recent: content.recent,
      status: content.status,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }

  private toPublicContentView(content: ContentRecord) {
    return {
      id: content.id,
      repositoryId: content.repositoryId,
      categoryId: content.categoryId,
      title: content.title,
      description: content.description,
      thumbnailUrl: content.thumbnailUrl,
      type: content.type,
      url: content.url,
      embedUrl: content.embedUrl,
      featured: content.featured,
      recent: content.recent,
      status: content.status,
    };
  }

  private toSimpleLinkView(simpleLink: SimpleLinkRecord) {
    return {
      id: simpleLink.id,
      companyId: simpleLink.companyId,
      repositoryId: simpleLink.repositoryId,
      name: simpleLink.name,
      url: simpleLink.url,
      type: simpleLink.type,
      date: simpleLink.date,
      status: simpleLink.status,
      createdAt: simpleLink.createdAt,
      updatedAt: simpleLink.updatedAt,
    };
  }

  private toPublicSimpleLinkView(simpleLink: SimpleLinkRecord) {
    return {
      id: simpleLink.id,
      repositoryId: simpleLink.repositoryId,
      name: simpleLink.name,
      url: simpleLink.url,
      type: simpleLink.type,
      date: simpleLink.date,
      status: simpleLink.status,
    };
  }

  private toContentViewMetric(view: ContentViewRecord) {
    return {
      id: view.id,
      userId: view.userId,
      contentId: view.contentId,
      companyId: view.companyId,
      repositoryId: view.repositoryId,
      contentType: view.contentType,
      orgUnitId: view.orgUnitId,
      createdAt: view.createdAt,
    };
  }

  private toContentRatingMetric(rating: Awaited<ReturnType<ContentRepository['saveRating']>>) {
    return {
      id: rating.id,
      userId: rating.userId,
      contentId: rating.contentId,
      companyId: rating.companyId,
      repositoryId: rating.repositoryId,
      rating: rating.rating,
      orgUnitId: rating.orgUnitId,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    };
  }
}
