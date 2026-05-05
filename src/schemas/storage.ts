import { z } from 'zod';

export const storageUploadPurposeValues = [
  'avatar',
  'company-logo',
  'company-hero',
  'repository-cover',
  'repository-banner',
  'content-thumbnail',
  'content-file',
  'course-cover',
  'course-material',
  'course-hotspot',
  'survey-cover',
  'checklist-photo',
  'superadmin-company-logo',
] as const;

export const storageUploadBodySchema = z.object({
  purpose: z.enum(storageUploadPurposeValues).optional(),
  targetCompanyId: z.string().uuid().optional(),
  bucket: z.string().trim().min(2).max(63).optional(),
  folder: z.string().trim().min(1).max(512).optional(),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(255),
  base64: z.string().trim().min(4),
});

export const storagePublicUrlQuerySchema = z.object({
  bucket: z.string().trim().min(2).max(63).optional(),
  path: z.string().trim().min(1).max(1024),
});
