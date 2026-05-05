import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import type { AppEnv } from '../config/env.js';
import type { AuthenticatedActor, UserRole } from '../modules/auth/contracts/auth.types.js';

type UploadPurpose =
  | 'avatar'
  | 'company-logo'
  | 'company-hero'
  | 'repository-cover'
  | 'repository-banner'
  | 'content-thumbnail'
  | 'content-file'
  | 'course-cover'
  | 'course-material'
  | 'course-hotspot'
  | 'survey-cover'
  | 'checklist-photo'
  | 'superadmin-company-logo';

type StorageBucket = 'uploads' | 'assets' | 'course-materials' | 'checklist-photos' | 'company-assets';
type MimeGroup = 'image' | 'document' | 'media';

interface UploadInput {
  purpose?: UploadPurpose;
  targetCompanyId?: string;
  bucket?: string;
  folder?: string;
  fileName: string;
  contentType: string;
  base64: string;
}

interface PublicUrlInput {
  bucket?: string;
  path: string;
}

interface StorageUploadResult {
  bucket: string;
  path: string;
  publicUrl: string;
  contentType: string;
  sizeBytes: number;
}

interface UploadPolicy {
  bucket: StorageBucket;
  pathPrefix: string;
  roles: readonly UserRole[];
  mimeGroups: readonly MimeGroup[];
  maxBytes: number;
  requiresTargetCompany?: boolean;
}

interface ResolvedUploadPolicy {
  policy: UploadPolicy;
  targetCompanyId: string;
}

interface MimeRule {
  group: MimeGroup;
  extensions: readonly string[];
  validate: (bytes: Buffer, extension: string) => boolean;
}

interface LegacyUploadRoute {
  bucket: StorageBucket;
  purpose: UploadPurpose;
  pattern: RegExp;
}

const UUID_SOURCE = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const UUID_PATTERN = new RegExp(`^${UUID_SOURCE}$`, 'i');
const BUCKET_PATTERN = /^[a-z0-9][a-z0-9._-]{1,62}$/i;
const SAFE_PATH_SEGMENT_PATTERN = /^[a-z0-9._-]{1,255}$/i;
const ALL_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'GUEST'];
const ADMIN_ROLES: readonly UserRole[] = ['SUPER_ADMIN', 'ADMIN'];
const PUBLIC_READABLE_BUCKETS = new Set<StorageBucket>([
  'uploads',
  'assets',
  'course-materials',
  'checklist-photos',
  'company-assets',
]);

const UPLOAD_POLICIES: Record<UploadPurpose, UploadPolicy> = {
  avatar: {
    bucket: 'assets',
    pathPrefix: 'avatars',
    roles: ALL_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'company-logo': {
    bucket: 'assets',
    pathPrefix: 'company/logo',
    roles: ADMIN_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'company-hero': {
    bucket: 'assets',
    pathPrefix: 'company/hero',
    roles: ADMIN_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'repository-cover': {
    bucket: 'assets',
    pathPrefix: 'repositories/covers',
    roles: ADMIN_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'repository-banner': {
    bucket: 'assets',
    pathPrefix: 'repositories/banners',
    roles: ADMIN_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'content-thumbnail': {
    bucket: 'assets',
    pathPrefix: 'contents/thumbnails',
    roles: ADMIN_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'content-file': {
    bucket: 'assets',
    pathPrefix: 'contents/files',
    roles: ADMIN_ROLES,
    mimeGroups: ['image', 'document', 'media'],
    maxBytes: 100 * 1024 * 1024,
  },
  'course-cover': {
    bucket: 'assets',
    pathPrefix: 'courses/covers',
    roles: ADMIN_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'course-material': {
    bucket: 'course-materials',
    pathPrefix: 'courses/materials',
    roles: ADMIN_ROLES,
    mimeGroups: ['image', 'document', 'media'],
    maxBytes: 100 * 1024 * 1024,
  },
  'course-hotspot': {
    bucket: 'course-materials',
    pathPrefix: 'courses/hotspots',
    roles: ADMIN_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'survey-cover': {
    bucket: 'assets',
    pathPrefix: 'surveys/covers',
    roles: ADMIN_ROLES,
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
  },
  'checklist-photo': {
    bucket: 'checklist-photos',
    pathPrefix: 'checklists/photos',
    roles: ALL_ROLES,
    mimeGroups: ['image'],
    maxBytes: 10 * 1024 * 1024,
  },
  'superadmin-company-logo': {
    bucket: 'uploads',
    pathPrefix: 'super-admin/company-logos',
    roles: ['SUPER_ADMIN'],
    mimeGroups: ['image'],
    maxBytes: 20 * 1024 * 1024,
    requiresTargetCompany: true,
  },
};

const LEGACY_UPLOAD_ROUTES: readonly LegacyUploadRoute[] = [
  legacyRoute('assets', 'avatar', `^companies/(?<companyId>${UUID_SOURCE})/avatars$`),
  legacyRoute('assets', 'company-logo', `^companies/(?<companyId>${UUID_SOURCE})/logo_url$`),
  legacyRoute('assets', 'company-hero', `^companies/(?<companyId>${UUID_SOURCE})/hero_image$`),
  legacyRoute('assets', 'repository-cover', `^repositories/(?<companyId>${UUID_SOURCE})/cover_image$`),
  legacyRoute('assets', 'repository-banner', `^repositories/(?<companyId>${UUID_SOURCE})/banner_image$`),
  legacyRoute('assets', 'content-thumbnail', `^contents/(?<companyId>${UUID_SOURCE})/thumbnail$`),
  legacyRoute('assets', 'content-file', `^contents/(?<companyId>${UUID_SOURCE})/files$`),
  legacyRoute('assets', 'course-cover', `^courses/(?<companyId>${UUID_SOURCE})/covers$`),
  legacyRoute('assets', 'survey-cover', `^surveys/(?<companyId>${UUID_SOURCE})/covers$`),
  legacyRoute('course-materials', 'course-material', `^courses/${UUID_SOURCE}/modules/${UUID_SOURCE}$`),
  legacyRoute('course-materials', 'course-hotspot', `^courses/${UUID_SOURCE}/questions/hotspot$`),
  legacyRoute('checklist-photos', 'checklist-photo', '^checklist$'),
];

const MIME_RULES: Readonly<Record<string, MimeRule>> = {
  'image/png': {
    group: 'image',
    extensions: ['png'],
    validate: (bytes) => hasPrefix(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  'image/jpeg': {
    group: 'image',
    extensions: ['jpg', 'jpeg'],
    validate: (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  'image/gif': {
    group: 'image',
    extensions: ['gif'],
    validate: (bytes) => hasAsciiPrefix(bytes, 'GIF87a') || hasAsciiPrefix(bytes, 'GIF89a'),
  },
  'image/webp': {
    group: 'image',
    extensions: ['webp'],
    validate: (bytes) => hasAsciiPrefix(bytes, 'RIFF') && bytes.length >= 12 && bytes.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  'application/pdf': {
    group: 'document',
    extensions: ['pdf'],
    validate: (bytes) => hasAsciiPrefix(bytes, '%PDF-'),
  },
  'text/csv': {
    group: 'document',
    extensions: ['csv'],
    validate: isSafeTextPayload,
  },
  'text/plain': {
    group: 'document',
    extensions: ['txt'],
    validate: isSafeTextPayload,
  },
  'application/msword': {
    group: 'document',
    extensions: ['doc'],
    validate: isCompoundOfficeDocument,
  },
  'application/vnd.ms-excel': {
    group: 'document',
    extensions: ['xls'],
    validate: isCompoundOfficeDocument,
  },
  'application/vnd.ms-powerpoint': {
    group: 'document',
    extensions: ['ppt'],
    validate: isCompoundOfficeDocument,
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    group: 'document',
    extensions: ['docx'],
    validate: isOpenXmlDocument,
  },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    group: 'document',
    extensions: ['xlsx'],
    validate: isOpenXmlDocument,
  },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    group: 'document',
    extensions: ['pptx'],
    validate: isOpenXmlDocument,
  },
  'video/mp4': {
    group: 'media',
    extensions: ['mp4'],
    validate: hasIsoBaseMediaSignature,
  },
  'video/quicktime': {
    group: 'media',
    extensions: ['mov'],
    validate: hasIsoBaseMediaSignature,
  },
  'video/webm': {
    group: 'media',
    extensions: ['webm'],
    validate: isEbmlDocument,
  },
  'video/ogg': {
    group: 'media',
    extensions: ['ogv', 'ogg'],
    validate: (bytes) => hasAsciiPrefix(bytes, 'OggS'),
  },
  'audio/ogg': {
    group: 'media',
    extensions: ['ogg', 'oga'],
    validate: (bytes) => hasAsciiPrefix(bytes, 'OggS'),
  },
  'audio/mpeg': {
    group: 'media',
    extensions: ['mp3'],
    validate: isMp3Document,
  },
  'audio/wav': {
    group: 'media',
    extensions: ['wav'],
    validate: isWavDocument,
  },
  'audio/x-wav': {
    group: 'media',
    extensions: ['wav'],
    validate: isWavDocument,
  },
};

export class StorageService {
  public constructor(private readonly env: AppEnv) {}

  public async upload(actor: AuthenticatedActor, input: UploadInput): Promise<StorageUploadResult> {
    const { policy, targetCompanyId } = this.resolveUploadPolicy(actor, input);
    const contentType = this.normalizeContentType(input.contentType);
    const bytes = this.decodeBase64(input.base64);
    const extension = this.assertFileAllowed(policy, input.fileName, contentType, bytes);

    this.assertStorageConfigured();

    const path = this.buildTenantPath(targetCompanyId, policy, extension);
    const uploadBody = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const response = await fetch(`${this.storageUrl}/object/${encodeURIComponent(policy.bucket)}/${this.encodePath(path)}`, {
      method: 'POST',
      headers: {
        apikey: this.env.SUPABASE.serviceRoleKey!,
        Authorization: `Bearer ${this.env.SUPABASE.serviceRoleKey!}`,
        'Content-Type': contentType,
        'Cache-Control': '31536000',
        'x-upsert': 'false',
      },
      body: uploadBody,
    });

    if (!response.ok) {
      const details = await this.safeReadResponse(response);
      throw new AppError(response.status === 409 ? 409 : 502, response.status === 409 ? 'CONFLICT' : 'STORAGE_UNAVAILABLE', 'Storage upload failed.', {
        status: response.status,
        details,
      });
    }

    return {
      bucket: policy.bucket,
      path,
      publicUrl: this.buildPublicUrl(policy.bucket, path),
      contentType,
      sizeBytes: bytes.byteLength,
    };
  }

  public getPublicUrl(actor: AuthenticatedActor, input: PublicUrlInput): { bucket: string; path: string; publicUrl: string } {
    const bucket = this.resolveBucket(input.bucket);
    const path = this.normalizeExistingPath(input.path);

    this.assertStorageConfigured();
    this.assertPublicReadableBucket(bucket);
    this.assertTenantPath(actor, path);

    return {
      bucket,
      path,
      publicUrl: this.buildPublicUrl(bucket, path),
    };
  }

  private get storageUrl(): string {
    return `${this.env.SUPABASE.url!.replace(/\/+$/, '')}/storage/v1`;
  }

  private assertStorageConfigured(): void {
    if (!this.env.SUPABASE.url || !this.env.SUPABASE.serviceRoleKey) {
      throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Storage backend is not configured.');
    }
  }

  private resolveUploadPolicy(actor: AuthenticatedActor, input: UploadInput): ResolvedUploadPolicy {
    const requestedBucket = input.bucket ? this.resolveBucket(input.bucket) : null;
    const policy = input.purpose
      ? this.resolvePolicyByPurpose(input.purpose, requestedBucket)
      : this.resolveLegacyUploadPolicy(actor, requestedBucket, input.folder);

    this.assertPolicyBucketConfigured(policy.bucket);
    this.assertRoleAllowed(actor, policy);

    return {
      policy,
      targetCompanyId: this.resolveTargetCompanyId(actor, input, policy),
    };
  }

  private resolvePolicyByPurpose(purpose: UploadPurpose, requestedBucket: StorageBucket | null): UploadPolicy {
    const policy = UPLOAD_POLICIES[purpose];

    if (requestedBucket && requestedBucket !== policy.bucket) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage bucket is not allowed for this upload purpose.');
    }

    return policy;
  }

  private resolveLegacyUploadPolicy(
    actor: AuthenticatedActor,
    requestedBucket: StorageBucket | null,
    folder: string | undefined,
  ): UploadPolicy {
    if (!requestedBucket || !folder) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage upload purpose is required.');
    }

    const legacyFolder = this.normalizeExistingPath(folder);
    const route = LEGACY_UPLOAD_ROUTES.find((candidate) => candidate.bucket === requestedBucket && candidate.pattern.test(legacyFolder));

    if (!route) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage bucket or folder is not allowed.');
    }

    const match = route.pattern.exec(legacyFolder);
    const companyId = match?.groups?.companyId;

    if (companyId && companyId !== actor.companyId) {
      throw new AppError(403, 'TENANT_ACCESS_DENIED', 'Storage folder does not belong to the authenticated tenant.');
    }

    return UPLOAD_POLICIES[route.purpose];
  }

  private resolveTargetCompanyId(actor: AuthenticatedActor, input: UploadInput, policy: UploadPolicy): string {
    if (policy.requiresTargetCompany) {
      if (actor.role !== 'SUPER_ADMIN') {
        throw new AppError(403, 'FORBIDDEN', 'Only super administrators can upload for another tenant.');
      }

      if (!input.targetCompanyId || !UUID_PATTERN.test(input.targetCompanyId)) {
        throw new AppError(400, 'BAD_REQUEST', 'Target company id is required for this upload purpose.');
      }

      return input.targetCompanyId;
    }

    if (input.targetCompanyId) {
      throw new AppError(400, 'BAD_REQUEST', 'Target company id is not allowed for this upload purpose.');
    }

    if (!UUID_PATTERN.test(actor.companyId)) {
      throw new AppError(403, 'TENANT_CONTEXT_REQUIRED', 'Authenticated tenant context is required for storage upload.');
    }

    return actor.companyId;
  }

  private resolveBucket(bucket: string | undefined): StorageBucket {
    const resolvedBucket = (bucket?.trim() || this.env.SUPABASE.storage.defaultBucket).toLowerCase();

    if (!BUCKET_PATTERN.test(resolvedBucket) || !this.env.SUPABASE.storage.allowedBuckets.includes(resolvedBucket)) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage bucket is not allowed.');
    }

    if (!isKnownStorageBucket(resolvedBucket)) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage bucket is not supported by this product.');
    }

    return resolvedBucket;
  }

  private assertPolicyBucketConfigured(bucket: StorageBucket): void {
    if (!this.env.SUPABASE.storage.allowedBuckets.includes(bucket)) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage bucket is not allowed.');
    }
  }

  private assertPublicReadableBucket(bucket: StorageBucket): void {
    if (!PUBLIC_READABLE_BUCKETS.has(bucket)) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage bucket is not readable through this endpoint.');
    }
  }

  private assertRoleAllowed(actor: AuthenticatedActor, policy: UploadPolicy): void {
    if (!policy.roles.includes(actor.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Authenticated user is not allowed to upload this file type.');
    }
  }

  private normalizeContentType(contentType: string): string {
    return contentType.trim().toLowerCase();
  }

  private assertFileAllowed(policy: UploadPolicy, fileName: string, contentType: string, bytes: Buffer): string {
    const rule = MIME_RULES[contentType];

    if (!rule || !policy.mimeGroups.includes(rule.group)) {
      throw new AppError(400, 'BAD_REQUEST', 'File content type is not allowed.');
    }

    const maxBytes = Math.min(this.env.SUPABASE.storage.maxUploadBytes, policy.maxBytes);
    if (bytes.byteLength > maxBytes) {
      throw new AppError(400, 'BAD_REQUEST', 'File exceeds the configured storage upload limit.');
    }

    const extension = this.resolveExtension(fileName, rule);

    if (!rule.validate(bytes, extension)) {
      throw new AppError(400, 'BAD_REQUEST', 'File signature does not match the declared content type.');
    }

    return extension;
  }

  private decodeBase64(value: string): Buffer {
    const normalized = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
    const compact = normalized.replace(/[\r\n\s]+/g, '');

    if (!/^[a-z0-9+/=]+$/i.test(compact) || compact.length % 4 === 1) {
      throw new AppError(400, 'BAD_REQUEST', 'File payload must be base64 encoded.');
    }

    const bytes = Buffer.from(compact, 'base64');

    if (bytes.byteLength === 0) {
      throw new AppError(400, 'BAD_REQUEST', 'File payload is empty.');
    }

    return bytes;
  }

  private buildTenantPath(companyId: string, policy: UploadPolicy, extension: string): string {
    const objectName = `${randomUUID()}.${extension}`;
    return ['companies', companyId, policy.pathPrefix, objectName].join('/');
  }

  private normalizeExistingPath(path: string): string {
    const normalized = path.trim().replace(/\\/g, '/');

    if (!normalized || normalized.includes('\0') || normalized.startsWith('/') || normalized.endsWith('/')) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage path is invalid.');
    }

    const segments = normalized.split('/');

    if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..' || !SAFE_PATH_SEGMENT_PATTERN.test(segment))) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage path is invalid.');
    }

    return segments.join('/');
  }

  private assertTenantPath(actor: AuthenticatedActor, path: string): void {
    const segments = path.split('/');

    if (segments[0] !== 'companies' || !segments[1] || !UUID_PATTERN.test(segments[1])) {
      throw new AppError(403, 'TENANT_ACCESS_DENIED', 'Storage path must be scoped to a tenant.');
    }

    if (segments[1] !== actor.companyId) {
      throw new AppError(403, 'TENANT_ACCESS_DENIED', 'Storage path does not belong to the authenticated tenant.');
    }
  }

  private resolveExtension(fileName: string, rule: MimeRule): string {
    const sanitizedName = fileName.trim().replace(/\\/g, '/').split('/').pop() ?? '';
    const extension = sanitizedName.includes('.') ? sanitizedName.split('.').pop()?.toLowerCase() : null;

    if (!extension) {
      return rule.extensions[0]!;
    }

    if (!/^[a-z0-9]{1,12}$/i.test(extension) || !rule.extensions.includes(extension)) {
      throw new AppError(400, 'BAD_REQUEST', 'File extension is not allowed for the declared content type.');
    }

    return extension;
  }

  private encodePath(path: string): string {
    return path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
  }

  private buildPublicUrl(bucket: string, path: string): string {
    return `${this.storageUrl}/object/public/${encodeURIComponent(bucket)}/${this.encodePath(path)}`;
  }

  private async safeReadResponse(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text.slice(0, 500);
    }
  }
}

function legacyRoute(bucket: StorageBucket, purpose: UploadPurpose, source: string): LegacyUploadRoute {
  return { bucket, purpose, pattern: new RegExp(source, 'i') };
}

function isKnownStorageBucket(bucket: string): bucket is StorageBucket {
  return PUBLIC_READABLE_BUCKETS.has(bucket as StorageBucket);
}

function hasPrefix(bytes: Buffer, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function hasAsciiPrefix(bytes: Buffer, signature: string): boolean {
  return bytes.length >= signature.length && bytes.subarray(0, signature.length).toString('ascii') === signature;
}

function hasIsoBaseMediaSignature(bytes: Buffer): boolean {
  return bytes.length >= 12 && bytes.subarray(4, 8).toString('ascii') === 'ftyp';
}

function isEbmlDocument(bytes: Buffer): boolean {
  return hasPrefix(bytes, [0x1a, 0x45, 0xdf, 0xa3]);
}

function isWavDocument(bytes: Buffer): boolean {
  return hasAsciiPrefix(bytes, 'RIFF') && bytes.length >= 12 && bytes.subarray(8, 12).toString('ascii') === 'WAVE';
}

function isMp3Document(bytes: Buffer): boolean {
  if (hasAsciiPrefix(bytes, 'ID3')) return true;
  return bytes.length >= 2 && bytes[0] === 0xff && (bytes[1]! & 0xe0) === 0xe0;
}

function isOpenXmlDocument(bytes: Buffer): boolean {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function isCompoundOfficeDocument(bytes: Buffer): boolean {
  return hasPrefix(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
}

function isSafeTextPayload(bytes: Buffer): boolean {
  if (bytes.includes(0)) return false;

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return !/<\s*(?:!doctype|html|body|script|svg|iframe|object|embed)\b|<\?xml/i.test(text);
  } catch {
    return false;
  }
}
