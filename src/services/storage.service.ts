import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type { AppEnv } from '../config/env.js';

interface UploadInput {
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUCKET_PATTERN = /^[a-z0-9][a-z0-9._-]{1,62}$/i;
const ALLOWED_MIME_TYPES = new Set([
  'application/json',
  'application/octet-stream',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd.ms-word',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
]);
const ALLOWED_MIME_PREFIXES = ['image/', 'audio/', 'video/', 'text/'] as const;

export class StorageService {
  public constructor(private readonly env: AppEnv) {}

  public async upload(actor: AuthenticatedActor, input: UploadInput): Promise<StorageUploadResult> {
    const bucket = this.resolveBucket(input.bucket);
    const contentType = this.normalizeContentType(input.contentType);
    const bytes = this.decodeBase64(input.base64);

    this.assertStorageConfigured();
    this.assertAllowedContentType(contentType);

    if (bytes.byteLength > this.env.SUPABASE.storage.maxUploadBytes) {
      throw new AppError(400, 'BAD_REQUEST', 'File exceeds the configured storage upload limit.');
    }

    const path = this.buildTenantPath(actor.companyId, input.folder, input.fileName, contentType);
    const uploadBody = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const response = await fetch(`${this.storageUrl}/object/${encodeURIComponent(bucket)}/${this.encodePath(path)}`, {
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
      bucket,
      path,
      publicUrl: this.buildPublicUrl(bucket, path),
      contentType,
      sizeBytes: bytes.byteLength,
    };
  }

  public getPublicUrl(actor: AuthenticatedActor, input: PublicUrlInput): { bucket: string; path: string; publicUrl: string } {
    const bucket = this.resolveBucket(input.bucket);
    const path = this.sanitizeExistingPath(input.path);

    this.assertStorageConfigured();
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

  private resolveBucket(bucket: string | undefined): string {
    const resolvedBucket = (bucket?.trim() || this.env.SUPABASE.storage.defaultBucket).toLowerCase();

    if (!BUCKET_PATTERN.test(resolvedBucket) || !this.env.SUPABASE.storage.allowedBuckets.includes(resolvedBucket)) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage bucket is not allowed.');
    }

    return resolvedBucket;
  }

  private normalizeContentType(contentType: string): string {
    return contentType.trim().toLowerCase() || 'application/octet-stream';
  }

  private assertAllowedContentType(contentType: string): void {
    if (ALLOWED_MIME_TYPES.has(contentType)) {
      return;
    }

    if (ALLOWED_MIME_PREFIXES.some((prefix) => contentType.startsWith(prefix))) {
      return;
    }

    throw new AppError(400, 'BAD_REQUEST', 'File content type is not allowed.');
  }

  private decodeBase64(value: string): Buffer {
    const normalized = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;

    if (!/^[a-z0-9+/=\r\n]+$/i.test(normalized)) {
      throw new AppError(400, 'BAD_REQUEST', 'File payload must be base64 encoded.');
    }

    return Buffer.from(normalized, 'base64');
  }

  private buildTenantPath(companyId: string, folder: string | undefined, fileName: string, contentType: string): string {
    const cleanFolder = this.sanitizePath(folder ?? 'uploads').replace(new RegExp(`^companies/${companyId}/?`), '');
    const extension = this.resolveExtension(fileName, contentType);
    const tenantPrefix = `companies/${companyId}`;
    const objectName = `${randomUUID()}.${extension}`;

    return [tenantPrefix, cleanFolder, objectName].filter((segment) => segment.length > 0).join('/');
  }

  private sanitizeExistingPath(path: string): string {
    const cleanPath = this.sanitizePath(path);

    if (!cleanPath) {
      throw new AppError(400, 'BAD_REQUEST', 'Storage path is required.');
    }

    return cleanPath;
  }

  private sanitizePath(value: string): string {
    return value
      .split('/')
      .map((segment) =>
        segment
          .trim()
          .replace(/[^a-z0-9._-]+/gi, '-')
          .replace(/^-+|-+$/g, ''),
      )
      .filter((segment) => segment.length > 0 && segment !== '.' && segment !== '..')
      .join('/');
  }

  private assertTenantPath(actor: AuthenticatedActor, path: string): void {
    const segments = path.split('/');

    if (segments[0] === 'companies' && segments[1] && UUID_PATTERN.test(segments[1]) && segments[1] !== actor.companyId) {
      throw new AppError(403, 'TENANT_ACCESS_DENIED', 'Storage path does not belong to the authenticated tenant.');
    }
  }

  private resolveExtension(fileName: string, contentType: string): string {
    const sanitizedName = fileName.trim().replace(/\\/g, '/').split('/').pop() ?? '';
    const extension = sanitizedName.includes('.') ? sanitizedName.split('.').pop() : null;

    if (extension && /^[a-z0-9]{1,12}$/i.test(extension)) {
      return extension.toLowerCase();
    }

    if (contentType === 'image/webp') return 'webp';
    if (contentType === 'image/jpeg') return 'jpg';
    if (contentType === 'image/png') return 'png';
    if (contentType === 'application/pdf') return 'pdf';
    if (contentType === 'text/csv') return 'csv';

    return 'bin';
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
