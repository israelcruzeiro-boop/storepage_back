import type {
  CategoryRecord,
  ContentRatingRecord,
  ContentRecord,
  ContentViewRecord,
  RepositoryRecord,
  SimpleLinkRecord,
} from '../../modules/content/contracts/content.types.js';

export interface ContentListFilters {
  repositoryId?: string;
}

export interface SimpleLinkListFilters {
  repositoryId?: string;
}

export interface ContentRepository {
  listRepositories(companyId: string): Promise<RepositoryRecord[]>;
  findRepositoryById(companyId: string, repositoryId: string): Promise<RepositoryRecord | null>;
  findPublicRepositoryById(repositoryId: string): Promise<RepositoryRecord | null>;
  saveRepository(repository: RepositoryRecord): Promise<RepositoryRecord>;

  listCategories(repositoryId: string): Promise<CategoryRecord[]>;
  findCategoryById(companyId: string, categoryId: string): Promise<CategoryRecord | null>;
  saveCategory(category: CategoryRecord): Promise<CategoryRecord>;

  listContents(companyId: string, filters?: ContentListFilters): Promise<ContentRecord[]>;
  findContentById(companyId: string, contentId: string): Promise<ContentRecord | null>;
  saveContent(content: ContentRecord): Promise<ContentRecord>;

  listSimpleLinks(companyId: string, filters?: SimpleLinkListFilters): Promise<SimpleLinkRecord[]>;
  findSimpleLinkById(companyId: string, simpleLinkId: string): Promise<SimpleLinkRecord | null>;
  saveSimpleLink(simpleLink: SimpleLinkRecord): Promise<SimpleLinkRecord>;

  listPublicRepositories(companyId: string): Promise<RepositoryRecord[]>;
  listPublicContents(repositoryId: string): Promise<ContentRecord[]>;
  listPublicSimpleLinks(repositoryId: string): Promise<SimpleLinkRecord[]>;

  saveContentView(view: ContentViewRecord): Promise<ContentViewRecord>;
  listContentViews(companyId: string, filters?: { repositoryId?: string; userId?: string }): Promise<ContentViewRecord[]>;
  findRating(companyId: string, userId: string, contentId: string): Promise<ContentRatingRecord | null>;
  saveRating(rating: ContentRatingRecord): Promise<ContentRatingRecord>;
  listRatings(companyId: string, filters?: { repositoryId?: string }): Promise<ContentRatingRecord[]>;
}
