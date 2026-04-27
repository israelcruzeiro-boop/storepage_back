export const repositoryTypeValues = ['FULL', 'SIMPLE', 'PLAYLIST', 'VIDEO_PLAYLIST'] as const;
export const repositoryStatusValues = ['ACTIVE', 'DRAFT'] as const;
export const repositoryAccessTypeValues = ['ALL', 'RESTRICTED'] as const;
export const contentTypeValues = ['PDF', 'VIDEO', 'DOCUMENT', 'LINK', 'MUSIC', 'IMAGE', 'QUIZ'] as const;
export const simpleLinkStatusValues = ['ACTIVE', 'INACTIVE'] as const;

export type RepositoryType = (typeof repositoryTypeValues)[number];
export type RepositoryStatus = (typeof repositoryStatusValues)[number];
export type RepositoryAccessType = (typeof repositoryAccessTypeValues)[number];
export type ContentType = (typeof contentTypeValues)[number];
export type SimpleLinkStatus = (typeof simpleLinkStatusValues)[number];

export interface RepositoryRecord {
  id: string;
  companyId: string;
  name: string;
  description: string;
  type: RepositoryType;
  coverImage: string | null;
  bannerImage: string | null;
  bannerPosition: number | null;
  bannerBrightness: number | null;
  featured: boolean;
  showInLanding: boolean;
  status: RepositoryStatus;
  accessType: RepositoryAccessType;
  allowedUserIds: string[];
  allowedRegionIds: string[];
  allowedStoreIds: string[];
  excludedUserIds: string[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryRecord {
  id: string;
  repositoryId: string;
  name: string;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRecord {
  id: string;
  companyId: string;
  repositoryId: string;
  categoryId: string | null;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  type: ContentType;
  url: string;
  embedUrl: string | null;
  featured: boolean;
  recent: boolean;
  status: RepositoryStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SimpleLinkRecord {
  id: string;
  companyId: string;
  repositoryId: string;
  name: string;
  url: string;
  type: string;
  date: string | null;
  status: SimpleLinkStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentViewRecord {
  id: string;
  userId: string | null;
  companyId: string;
  repositoryId: string;
  contentId: string;
  contentType: string;
  orgUnitId: string | null;
  createdAt: string;
}

export interface ContentRatingRecord {
  id: string;
  userId: string | null;
  companyId: string;
  repositoryId: string;
  contentId: string;
  rating: number;
  orgUnitId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryCatalog {
  repository: RepositoryRecord;
  categories: CategoryRecord[];
  contents: ContentRecord[];
  simpleLinks: SimpleLinkRecord[];
}

export interface RepositoryMetricsSummary {
  repositoryId: string;
  totalViews: number;
  totalRatings: number;
  averageRating: number;
  contents: Array<{
    contentId: string;
    title: string;
    views: number;
    averageRating: number | null;
  }>;
}
