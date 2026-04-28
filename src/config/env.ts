import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const nodeEnvSchema = z.enum(['development', 'test', 'production']);
const repositoryDriverSchema = z.enum(['memory', 'supabase']);
const jwtAuthModeSchema = z.enum(['disabled', 'shared-secret', 'jwks']);
const jwtAlgorithmSchema = z.enum([
  'HS256',
  'HS384',
  'HS512',
  'RS256',
  'RS384',
  'RS512',
  'PS256',
  'PS384',
  'PS512',
  'ES256',
  'ES384',
  'ES512',
  'EdDSA',
]);
const logLevelSchema = z.enum([
  'fatal',
  'error',
  'warn',
  'info',
  'debug',
  'trace',
  'silent',
]);

function normalizeApiPrefix(prefix: string): string {
  const trimmed = prefix.trim();
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const normalized = withLeadingSlash.replace(/\/+$/, '');
  return normalized === '' ? '/api' : normalized;
}

function parseCorsOrigins(value: string): readonly string[] {
  if (value.trim() === '*') {
    return ['*'] as const;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one origin or "*".');
  }

  return origins;
}

function parseOptionalString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseDelimitedValues(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function parseStorageBuckets(value: string): readonly string[] {
  const buckets = parseDelimitedValues(value);

  if (buckets.length === 0) {
    throw new Error('SUPABASE_STORAGE_ALLOWED_BUCKETS must contain at least one bucket.');
  }

  return buckets;
}

const rawEnvSchema = z
  .object({
    NODE_ENV: nodeEnvSchema.default('development'),
    HOST: z.string().trim().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3333),
    API_PREFIX: z.string().trim().min(1).default('/api'),
    LOG_LEVEL: logLevelSchema.default('info'),
    REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(120000).default(10000),
    CORS_ORIGINS: z.string().trim().min(1).default('*'),
    CORS_ALLOW_CREDENTIALS: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    REPOSITORY_DRIVER: repositoryDriverSchema.default('memory'),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_SCHEMA: z.string().trim().min(1).default('public'),
    SUPABASE_STORAGE_BUCKET: z.string().trim().min(1).default('uploads'),
    SUPABASE_STORAGE_ALLOWED_BUCKETS: z
      .string()
      .trim()
      .min(1)
      .default('uploads,assets,course-materials,checklist-photos,company-assets'),
    SUPABASE_STORAGE_MAX_UPLOAD_BYTES: z.coerce.number().int().min(1).max(104857600).default(104857600),
    JWT_AUTH_MODE: jwtAuthModeSchema.default('disabled'),
    JWT_ISSUER: z.string().optional(),
    JWT_AUDIENCE: z.string().optional(),
    JWT_ALLOWED_ALGORITHMS: z.string().trim().min(1).default('HS256'),
    JWT_SHARED_SECRET: z.string().optional(),
    JWT_JWKS_URL: z.string().optional(),
    JWT_ROLE_CLAIM: z.string().trim().min(1).default('role'),
    JWT_COMPANY_ID_CLAIM: z.string().trim().min(1).default('company_id'),
    JWT_EMAIL_CLAIM: z.string().trim().min(1).default('email'),
    JWT_CLOCK_TOLERANCE_SECONDS: z.coerce.number().int().min(0).max(300).default(5),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(1440).default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(14),
    PUBLIC_TENANT_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).max(3600).default(60),
  })
  .superRefine((env, context) => {
    const issuer = parseOptionalString(env.JWT_ISSUER);
    const audience = parseOptionalString(env.JWT_AUDIENCE);
    const sharedSecret = parseOptionalString(env.JWT_SHARED_SECRET);
    const jwksUrl = parseOptionalString(env.JWT_JWKS_URL);
    const algorithms = parseDelimitedValues(env.JWT_ALLOWED_ALGORITHMS);
    const corsOrigins = parseDelimitedValues(env.CORS_ORIGINS);

    if (env.CORS_ALLOW_CREDENTIALS && corsOrigins.includes('*')) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['CORS_ORIGINS'],
        message: 'CORS_ORIGINS cannot be "*" when CORS_ALLOW_CREDENTIALS=true.',
      });
    }

    if (algorithms.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ALLOWED_ALGORITHMS'],
        message: 'JWT_ALLOWED_ALGORITHMS must contain at least one algorithm.',
      });
    }

    algorithms.forEach((algorithm, index) => {
      const result = jwtAlgorithmSchema.safeParse(algorithm);

      if (!result.success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_ALLOWED_ALGORITHMS', index],
          message: `Unsupported JWT algorithm: ${algorithm}`,
        });
      }
    });

    if (env.REPOSITORY_DRIVER === 'supabase') {
      const supabaseUrl = parseOptionalString(env.SUPABASE_URL);
      const supabaseServiceRoleKey = parseOptionalString(env.SUPABASE_SERVICE_ROLE_KEY);

      if (!supabaseUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SUPABASE_URL'],
          message: 'SUPABASE_URL is required when REPOSITORY_DRIVER=supabase.',
        });
      }

      if (!supabaseServiceRoleKey) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SUPABASE_SERVICE_ROLE_KEY'],
          message: 'SUPABASE_SERVICE_ROLE_KEY is required when REPOSITORY_DRIVER=supabase.',
        });
      }
    }

    if (env.JWT_AUTH_MODE === 'disabled') {
      return;
    }

    if (!issuer) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_ISSUER'],
        message: 'JWT_ISSUER is required when JWT authentication is enabled.',
      });
    }

    if (!audience) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_AUDIENCE'],
        message: 'JWT_AUDIENCE is required when JWT authentication is enabled.',
      });
    }

    if (env.JWT_AUTH_MODE === 'shared-secret') {
      if (!sharedSecret) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SHARED_SECRET'],
          message: 'JWT_SHARED_SECRET is required in shared-secret mode.',
        });
      } else if (sharedSecret.length < 32) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SHARED_SECRET'],
          message: 'JWT_SHARED_SECRET must have at least 32 characters.',
        });
      }
    }

    if (env.JWT_AUTH_MODE === 'jwks' && !jwksUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_JWKS_URL'],
        message: 'JWT_JWKS_URL is required in jwks mode.',
      });
    }

    if (env.JWT_AUTH_MODE === 'shared-secret' && jwksUrl) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_JWKS_URL'],
        message: 'JWT_JWKS_URL must be empty when shared-secret mode is selected.',
      });
    }

    if (env.JWT_AUTH_MODE === 'jwks' && sharedSecret) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_SHARED_SECRET'],
        message: 'JWT_SHARED_SECRET must be empty when jwks mode is selected.',
      });
    }
  });

const appEnvSchema = rawEnvSchema.transform((env) => {
  const jwtAudience = parseOptionalString(env.JWT_AUDIENCE);
  const jwtJwksUrl = parseOptionalString(env.JWT_JWKS_URL);
  const jwtSharedSecret = parseOptionalString(env.JWT_SHARED_SECRET);

  return {
    NODE_ENV: env.NODE_ENV,
    HOST: env.HOST,
    PORT: env.PORT,
    API_PREFIX: normalizeApiPrefix(env.API_PREFIX),
    LOG_LEVEL: env.LOG_LEVEL,
    REQUEST_TIMEOUT_MS: env.REQUEST_TIMEOUT_MS,
    CORS_ORIGINS: parseCorsOrigins(env.CORS_ORIGINS),
    CORS_ALLOW_CREDENTIALS: env.CORS_ALLOW_CREDENTIALS,
    REPOSITORY: {
      driver: env.REPOSITORY_DRIVER,
    },
    SUPABASE: {
      url: parseOptionalString(env.SUPABASE_URL) ?? null,
      serviceRoleKey: parseOptionalString(env.SUPABASE_SERVICE_ROLE_KEY) ?? null,
      schema: env.SUPABASE_SCHEMA,
      storage: {
        defaultBucket: env.SUPABASE_STORAGE_BUCKET,
        allowedBuckets: parseStorageBuckets(env.SUPABASE_STORAGE_ALLOWED_BUCKETS),
        maxUploadBytes: env.SUPABASE_STORAGE_MAX_UPLOAD_BYTES,
      },
    },
    AUTH: {
      mode: env.JWT_AUTH_MODE,
      issuer: parseOptionalString(env.JWT_ISSUER) ?? null,
      audience: jwtAudience ? parseDelimitedValues(jwtAudience) : [],
      allowedAlgorithms: parseDelimitedValues(env.JWT_ALLOWED_ALGORITHMS) as Array<z.infer<typeof jwtAlgorithmSchema>>,
      sharedSecret: jwtSharedSecret ?? null,
      jwksUrl: jwtJwksUrl ?? null,
      claims: {
        role: env.JWT_ROLE_CLAIM,
        companyId: env.JWT_COMPANY_ID_CLAIM,
        email: env.JWT_EMAIL_CLAIM,
      },
      clockToleranceSeconds: env.JWT_CLOCK_TOLERANCE_SECONDS,
      accessTokenTtlMinutes: env.ACCESS_TOKEN_TTL_MINUTES,
      refreshTokenTtlDays: env.REFRESH_TOKEN_TTL_DAYS,
    },
    PUBLIC_TENANT_CACHE_TTL_SECONDS: env.PUBLIC_TENANT_CACHE_TTL_SECONDS,
  };
});

export type AppEnv = z.infer<typeof appEnvSchema>;

let cachedEnv: AppEnv | undefined;

export function parseEnv(input: NodeJS.ProcessEnv): AppEnv {
  const parsedEnv = appEnvSchema.safeParse(input);

  if (!parsedEnv.success) {
    const issues = parsedEnv.error.issues
      .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  return parsedEnv.data;
}

export function resetEnvCache(): void {
  cachedEnv = undefined;
}

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = parseEnv(process.env);
  return cachedEnv;
}
