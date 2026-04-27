import type {
  CategoryRecord,
  ContentRatingRecord,
  ContentRecord,
  ContentViewRecord,
  RepositoryRecord,
  SimpleLinkRecord,
} from '../../modules/content/contracts/content.types.js';
import type { ContentListFilters, ContentRepository, SimpleLinkListFilters } from '../contracts/content.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
import {
  CATEGORY_SELECT,
  CONTENT_RATING_SELECT,
  CONTENT_SELECT,
  CONTENT_VIEW_SELECT,
  REPOSITORY_SELECT,
  SIMPLE_LINK_SELECT,
  fromCategoryRecord,
  fromContentRatingRecord,
  fromContentRecord,
  fromContentViewRecord,
  fromRepositoryRecord,
  fromSimpleLinkRecord,
  toCategoryRecord,
  toContentRatingRecord,
  toContentRecord,
  toContentViewRecord,
  toRepositoryRecord,
  toSimpleLinkRecord,
  type CategoryRow,
  type ContentRatingRow,
  type ContentRow,
  type ContentViewRow,
  type RepositoryRow,
  type SimpleLinkRow,
} from './supabase-row-mappers.js';

type SelectFilter = {
  column: string;
  operator: 'eq' | 'is';
  value: string | boolean | null;
};

export class SupabaseContentRepository implements ContentRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async listRepositories(companyId: string): Promise<RepositoryRecord[]> {
    const result = await this.client.select<RepositoryRow>('repositories', {
      select: REPOSITORY_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'created_at', ascending: false }],
    });

    return result.rows.map(toRepositoryRecord);
  }

  public async findRepositoryById(companyId: string, repositoryId: string): Promise<RepositoryRecord | null> {
    const row = await this.client.selectOne<RepositoryRow>('repositories', {
      select: REPOSITORY_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'id', operator: 'eq', value: repositoryId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });

    return row ? toRepositoryRecord(row) : null;
  }

  public async findPublicRepositoryById(repositoryId: string): Promise<RepositoryRecord | null> {
    const row = await this.client.selectOne<RepositoryRow>('repositories', {
      select: REPOSITORY_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: repositoryId },
        { column: 'status', operator: 'eq', value: 'ACTIVE' },
        { column: 'show_in_landing', operator: 'eq', value: true },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });

    return row ? toRepositoryRecord(row) : null;
  }

  public async saveRepository(repository: RepositoryRecord): Promise<RepositoryRecord> {
    const row = await this.client.upsert<RepositoryRow>('repositories', fromRepositoryRecord(repository), {
      select: REPOSITORY_SELECT,
      onConflict: 'id',
    });

    return toRepositoryRecord(row);
  }

  public async listCategories(repositoryId: string): Promise<CategoryRecord[]> {
    const result = await this.client.select<CategoryRow>('categories', {
      select: CATEGORY_SELECT,
      filters: [
        { column: 'repository_id', operator: 'eq', value: repositoryId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'order_index' }, { column: 'name' }],
    });

    return result.rows.map(toCategoryRecord);
  }

  public async findCategoryById(companyId: string, categoryId: string): Promise<CategoryRecord | null> {
    const row = await this.client.selectOne<CategoryRow>('categories', {
      select: CATEGORY_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: categoryId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    if (!row) return null;

    const category = toCategoryRecord(row);
    const repository = await this.findRepositoryById(companyId, category.repositoryId);
    return repository ? category : null;
  }

  public async saveCategory(category: CategoryRecord): Promise<CategoryRecord> {
    const row = await this.client.upsert<CategoryRow>('categories', fromCategoryRecord(category), {
      select: CATEGORY_SELECT,
      onConflict: 'id',
    });

    return toCategoryRecord(row);
  }

  public async listContents(companyId: string, filters: ContentListFilters = {}): Promise<ContentRecord[]> {
    const queryFilters: SelectFilter[] = [
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'deleted_at', operator: 'is', value: null },
    ];
    if (filters.repositoryId) {
      queryFilters.push({ column: 'repository_id', operator: 'eq', value: filters.repositoryId });
    }

    const result = await this.client.select<ContentRow>('contents', {
      select: CONTENT_SELECT,
      filters: queryFilters,
      order: [{ column: 'created_at', ascending: false }],
    });

    return result.rows.map(toContentRecord);
  }

  public async findContentById(companyId: string, contentId: string): Promise<ContentRecord | null> {
    const row = await this.client.selectOne<ContentRow>('contents', {
      select: CONTENT_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'id', operator: 'eq', value: contentId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });

    return row ? toContentRecord(row) : null;
  }

  public async saveContent(content: ContentRecord): Promise<ContentRecord> {
    const row = await this.client.upsert<ContentRow>('contents', fromContentRecord(content), {
      select: CONTENT_SELECT,
      onConflict: 'id',
    });

    return toContentRecord(row);
  }

  public async listSimpleLinks(companyId: string, filters: SimpleLinkListFilters = {}): Promise<SimpleLinkRecord[]> {
    const queryFilters: SelectFilter[] = [
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'deleted_at', operator: 'is', value: null },
    ];
    if (filters.repositoryId) {
      queryFilters.push({ column: 'repository_id', operator: 'eq', value: filters.repositoryId });
    }

    const result = await this.client.select<SimpleLinkRow>('simple_links', {
      select: SIMPLE_LINK_SELECT,
      filters: queryFilters,
      order: [{ column: 'created_at', ascending: false }],
    });

    return result.rows.map(toSimpleLinkRecord);
  }

  public async findSimpleLinkById(companyId: string, simpleLinkId: string): Promise<SimpleLinkRecord | null> {
    const row = await this.client.selectOne<SimpleLinkRow>('simple_links', {
      select: SIMPLE_LINK_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'id', operator: 'eq', value: simpleLinkId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });

    return row ? toSimpleLinkRecord(row) : null;
  }

  public async saveSimpleLink(simpleLink: SimpleLinkRecord): Promise<SimpleLinkRecord> {
    const row = await this.client.upsert<SimpleLinkRow>('simple_links', fromSimpleLinkRecord(simpleLink), {
      select: SIMPLE_LINK_SELECT,
      onConflict: 'id',
    });

    return toSimpleLinkRecord(row);
  }

  public async listPublicRepositories(companyId: string): Promise<RepositoryRecord[]> {
    const result = await this.client.select<RepositoryRow>('repositories', {
      select: REPOSITORY_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'status', operator: 'eq', value: 'ACTIVE' },
        { column: 'show_in_landing', operator: 'eq', value: true },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'created_at', ascending: false }],
    });

    return result.rows.map(toRepositoryRecord);
  }

  public async listPublicContents(repositoryId: string): Promise<ContentRecord[]> {
    const result = await this.client.select<ContentRow>('contents', {
      select: CONTENT_SELECT,
      filters: [
        { column: 'repository_id', operator: 'eq', value: repositoryId },
        { column: 'status', operator: 'eq', value: 'ACTIVE' },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'created_at', ascending: false }],
    });

    return result.rows.map(toContentRecord);
  }

  public async listPublicSimpleLinks(repositoryId: string): Promise<SimpleLinkRecord[]> {
    const result = await this.client.select<SimpleLinkRow>('simple_links', {
      select: SIMPLE_LINK_SELECT,
      filters: [
        { column: 'repository_id', operator: 'eq', value: repositoryId },
        { column: 'status', operator: 'eq', value: 'ACTIVE' },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'created_at', ascending: false }],
    });

    return result.rows.map(toSimpleLinkRecord);
  }

  public async saveContentView(view: ContentViewRecord): Promise<ContentViewRecord> {
    const row = await this.client.upsert<ContentViewRow>('content_views', fromContentViewRecord(view), {
      select: CONTENT_VIEW_SELECT,
      onConflict: 'id',
    });

    return toContentViewRecord(row);
  }

  public async listContentViews(companyId: string, filters: { repositoryId?: string; userId?: string } = {}): Promise<ContentViewRecord[]> {
    const queryFilters: SelectFilter[] = [{ column: 'company_id', operator: 'eq', value: companyId }];
    if (filters.repositoryId) queryFilters.push({ column: 'repository_id', operator: 'eq', value: filters.repositoryId });
    if (filters.userId) queryFilters.push({ column: 'user_id', operator: 'eq', value: filters.userId });

    const result = await this.client.select<ContentViewRow>('content_views', {
      select: CONTENT_VIEW_SELECT,
      filters: queryFilters,
      order: [{ column: 'viewed_at', ascending: false }],
    });

    return result.rows.map(toContentViewRecord);
  }

  public async findRating(companyId: string, userId: string, contentId: string): Promise<ContentRatingRecord | null> {
    const row = await this.client.selectOne<ContentRatingRow>('content_ratings', {
      select: CONTENT_RATING_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'user_id', operator: 'eq', value: userId },
        { column: 'content_id', operator: 'eq', value: contentId },
      ],
    });

    return row ? toContentRatingRecord(row) : null;
  }

  public async saveRating(rating: ContentRatingRecord): Promise<ContentRatingRecord> {
    const row = await this.client.upsert<ContentRatingRow>('content_ratings', fromContentRatingRecord(rating), {
      select: CONTENT_RATING_SELECT,
      onConflict: 'id',
    });

    return toContentRatingRecord(row);
  }

  public async listRatings(companyId: string, filters: { repositoryId?: string } = {}): Promise<ContentRatingRecord[]> {
    const queryFilters: SelectFilter[] = [{ column: 'company_id', operator: 'eq', value: companyId }];
    if (filters.repositoryId) queryFilters.push({ column: 'repository_id', operator: 'eq', value: filters.repositoryId });

    const result = await this.client.select<ContentRatingRow>('content_ratings', {
      select: CONTENT_RATING_SELECT,
      filters: queryFilters,
      order: [{ column: 'created_at', ascending: false }],
    });

    return result.rows.map(toContentRatingRecord);
  }
}
