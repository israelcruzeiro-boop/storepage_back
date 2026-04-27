export const userRoleValues = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER', 'GUEST'] as const;
export const authStrategyValues = ['jwt', 'none'] as const;

export type UserRole = (typeof userRoleValues)[number];
export type AuthStrategy = (typeof authStrategyValues)[number];
export type TokenUse = 'access' | 'refresh' | 'unknown';

export interface AuthenticatedActor {
  userId: string;
  companyId: string;
  role: UserRole;
  name: string;
  email?: string;
  sessionId: string | null;
}

export interface AuthTokenMetadata {
  subject: string;
  issuer: string | null;
  audience: readonly string[];
  expiresAt: number | null;
  issuedAt: number | null;
  sessionId: string | null;
  tokenUse: TokenUse;
}

interface BaseAuthContext {
  strategy: AuthStrategy;
  bearerToken: string | null;
  token: AuthTokenMetadata | null;
}

export interface UnauthenticatedAuthContext extends BaseAuthContext {
  isAuthenticated: false;
  actor: null;
}

export interface AuthenticatedAuthContext extends BaseAuthContext {
  isAuthenticated: true;
  strategy: 'jwt';
  actor: AuthenticatedActor;
  token: AuthTokenMetadata;
}

export type AuthContext = AuthenticatedAuthContext | UnauthenticatedAuthContext;

export const adminRoleValues = ['SUPER_ADMIN', 'ADMIN'] as const;
export type AdminRole = (typeof adminRoleValues)[number];
