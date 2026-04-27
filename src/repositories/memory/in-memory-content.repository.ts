import type {
  CategoryRecord,
  ContentRatingRecord,
  ContentRecord,
  ContentViewRecord,
  RepositoryRecord,
  SimpleLinkRecord,
} from '../../modules/content/contracts/content.types.js';
import type { ContentListFilters, ContentRepository, SimpleLinkListFilters } from '../contracts/content.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

function isVisible(record: { deletedAt: string | null }): boolean {
  return record.deletedAt === null;
}

function byNewest(left: { createdAt: string }, right: { createdAt: string }): number {
  return right.createdAt.localeCompare(left.createdAt);
}

function byOrderThenName(left: { orderIndex?: number; name: string }, right: { orderIndex?: number; name: string }): number {
  return (left.orderIndex ?? 0) - (right.orderIndex ?? 0) || left.name.localeCompare(right.name);
}

export class InMemoryContentRepository implements ContentRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async listRepositories(companyId: string): Promise<RepositoryRecord[]> {
    return this.store
      .listRepositories()
      .filter((repository) => isVisible(repository) && repository.companyId === companyId)
      .sort(byNewest);
  }

  public async findRepositoryById(companyId: string, repositoryId: string): Promise<RepositoryRecord | null> {
    const repository = this.store.getRepository(repositoryId);
    return repository && isVisible(repository) && repository.companyId === companyId ? repository : null;
  }

  public async findPublicRepositoryById(repositoryId: string): Promise<RepositoryRecord | null> {
    const repository = this.store.getRepository(repositoryId);
    return repository && isVisible(repository) && repository.status === 'ACTIVE' && repository.showInLanding ? repository : null;
  }

  public async saveRepository(repository: RepositoryRecord): Promise<RepositoryRecord> {
    return this.store.setRepository(repository);
  }

  public async listCategories(repositoryId: string): Promise<CategoryRecord[]> {
    return this.store
      .listCategories()
      .filter((category) => isVisible(category) && category.repositoryId === repositoryId)
      .sort(byOrderThenName);
  }

  public async findCategoryById(companyId: string, categoryId: string): Promise<CategoryRecord | null> {
    const category = this.store.getCategory(categoryId);
    if (!category || !isVisible(category)) return null;
    const repository = this.store.getRepository(category.repositoryId);
    return repository && repository.companyId === companyId && isVisible(repository) ? category : null;
  }

  public async saveCategory(category: CategoryRecord): Promise<CategoryRecord> {
    return this.store.setCategory(category);
  }

  public async listContents(companyId: string, filters: ContentListFilters = {}): Promise<ContentRecord[]> {
    return this.store
      .listContents()
      .filter(
        (content) =>
          isVisible(content) &&
          content.companyId === companyId &&
          (!filters.repositoryId || content.repositoryId === filters.repositoryId),
      )
      .sort(byNewest);
  }

  public async findContentById(companyId: string, contentId: string): Promise<ContentRecord | null> {
    const content = this.store.getContent(contentId);
    return content && isVisible(content) && content.companyId === companyId ? content : null;
  }

  public async saveContent(content: ContentRecord): Promise<ContentRecord> {
    return this.store.setContent(content);
  }

  public async listSimpleLinks(companyId: string, filters: SimpleLinkListFilters = {}): Promise<SimpleLinkRecord[]> {
    return this.store
      .listSimpleLinks()
      .filter(
        (simpleLink) =>
          isVisible(simpleLink) &&
          simpleLink.companyId === companyId &&
          (!filters.repositoryId || simpleLink.repositoryId === filters.repositoryId),
      )
      .sort(byNewest);
  }

  public async findSimpleLinkById(companyId: string, simpleLinkId: string): Promise<SimpleLinkRecord | null> {
    const simpleLink = this.store.getSimpleLink(simpleLinkId);
    return simpleLink && isVisible(simpleLink) && simpleLink.companyId === companyId ? simpleLink : null;
  }

  public async saveSimpleLink(simpleLink: SimpleLinkRecord): Promise<SimpleLinkRecord> {
    return this.store.setSimpleLink(simpleLink);
  }

  public async listPublicRepositories(companyId: string): Promise<RepositoryRecord[]> {
    return this.store
      .listRepositories()
      .filter(
        (repository) =>
          isVisible(repository) &&
          repository.companyId === companyId &&
          repository.status === 'ACTIVE' &&
          repository.showInLanding,
      )
      .sort(byNewest);
  }

  public async listPublicContents(repositoryId: string): Promise<ContentRecord[]> {
    return this.store
      .listContents()
      .filter((content) => isVisible(content) && content.repositoryId === repositoryId && content.status === 'ACTIVE')
      .sort(byNewest);
  }

  public async listPublicSimpleLinks(repositoryId: string): Promise<SimpleLinkRecord[]> {
    return this.store
      .listSimpleLinks()
      .filter((simpleLink) => isVisible(simpleLink) && simpleLink.repositoryId === repositoryId && simpleLink.status === 'ACTIVE')
      .sort(byNewest);
  }

  public async saveContentView(view: ContentViewRecord): Promise<ContentViewRecord> {
    return this.store.setContentView(view);
  }

  public async listContentViews(companyId: string, filters: { repositoryId?: string; userId?: string } = {}): Promise<ContentViewRecord[]> {
    return this.store
      .listContentViews()
      .filter(
        (view) =>
          view.companyId === companyId &&
          (!filters.repositoryId || view.repositoryId === filters.repositoryId) &&
          (!filters.userId || view.userId === filters.userId),
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  public async findRating(companyId: string, userId: string, contentId: string): Promise<ContentRatingRecord | null> {
    return (
      this.store
        .listContentRatings()
        .find((rating) => rating.companyId === companyId && rating.userId === userId && rating.contentId === contentId) ?? null
    );
  }

  public async saveRating(rating: ContentRatingRecord): Promise<ContentRatingRecord> {
    return this.store.setContentRating(rating);
  }

  public async listRatings(companyId: string, filters: { repositoryId?: string } = {}): Promise<ContentRatingRecord[]> {
    return this.store
      .listContentRatings()
      .filter((rating) => rating.companyId === companyId && (!filters.repositoryId || rating.repositoryId === filters.repositoryId))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
}
