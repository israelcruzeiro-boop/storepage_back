import { z } from 'zod';
import {
  contentTypeValues,
  repositoryAccessTypeValues,
  repositoryStatusValues,
  repositoryTypeValues,
  simpleLinkStatusValues,
} from '../modules/content/contracts/content.types.js';
import { entityIdSchema, nullableUrlSchema, shortTextSchema } from './shared.js';

const idArraySchema = z.array(entityIdSchema).default([]);
const optionalNullableUrlSchema = nullableUrlSchema.optional();

export const repositoryIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const contentIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const categoryIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const simpleLinkIdParamsSchema = z.object({
  id: entityIdSchema,
});

export const landingSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(120),
});

export const contentListQuerySchema = z.object({
  repositoryId: entityIdSchema.optional(),
});

export const simpleLinkListQuerySchema = z.object({
  repositoryId: entityIdSchema.optional(),
});

export const createRepositoryBodySchema = z.object({
  name: shortTextSchema,
  description: z.string().trim().max(2000).default(''),
  type: z.enum(repositoryTypeValues).default('FULL'),
  coverImage: optionalNullableUrlSchema,
  bannerImage: optionalNullableUrlSchema,
  bannerPosition: z.number().min(0).max(100).nullable().optional(),
  bannerBrightness: z.number().min(0).max(200).nullable().optional(),
  featured: z.boolean().default(false),
  showInLanding: z.boolean().default(false),
  status: z.enum(repositoryStatusValues).default('ACTIVE'),
  accessType: z.enum(repositoryAccessTypeValues).default('ALL'),
  allowedUserIds: idArraySchema,
  allowedRegionIds: idArraySchema,
  allowedStoreIds: idArraySchema,
  excludedUserIds: idArraySchema,
});

export const updateRepositoryBodySchema = createRepositoryBodySchema.partial().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: 'At least one repository field must be provided.' },
);

export const createCategoryBodySchema = z.object({
  name: shortTextSchema,
  orderIndex: z.number().int().min(0).default(0),
});

export const updateCategoryBodySchema = createCategoryBodySchema.partial().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: 'At least one category field must be provided.' },
);

export const createContentBodySchema = z.object({
  repositoryId: entityIdSchema,
  categoryId: entityIdSchema.nullable().optional(),
  title: shortTextSchema,
  description: z.string().trim().max(4000).default(''),
  thumbnailUrl: optionalNullableUrlSchema,
  type: z.enum(contentTypeValues),
  url: z.string().trim().min(1).max(4096),
  embedUrl: z.string().trim().max(4096).nullable().optional(),
  featured: z.boolean().default(false),
  recent: z.boolean().default(false),
  status: z.enum(repositoryStatusValues).default('ACTIVE'),
});

export const updateContentBodySchema = createContentBodySchema.partial().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: 'At least one content field must be provided.' },
);

export const createSimpleLinkBodySchema = z.object({
  repositoryId: entityIdSchema,
  name: shortTextSchema,
  url: z.string().trim().url().max(4096),
  type: z.string().trim().min(1).max(80).default('LINK'),
  date: z.string().trim().max(80).nullable().optional(),
  status: z.enum(simpleLinkStatusValues).default('ACTIVE'),
});

export const updateSimpleLinkBodySchema = createSimpleLinkBodySchema.partial().refine(
  (value) => Object.values(value).some((entry) => entry !== undefined),
  { message: 'At least one simple link field must be provided.' },
);

export const recordViewBodySchema = z.object({
  contentId: entityIdSchema,
  repositoryId: entityIdSchema,
  contentType: z.string().trim().min(1).max(80),
});

export const recordRatingBodySchema = z.object({
  contentId: entityIdSchema,
  repositoryId: entityIdSchema,
  rating: z.number().int().min(0).max(10),
});

export const repositoryMetricsQuerySchema = z.object({
  repositoryId: entityIdSchema.optional(),
});

export const userActivityParamsSchema = z.object({
  id: entityIdSchema,
});
