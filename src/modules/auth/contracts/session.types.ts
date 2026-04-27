export interface AuthSessionRecord {
  id: string;
  userId: string;
  companyId: string;
  refreshTokenHash: string;
  refreshTokenId: string;
  createdAt: string;
  updatedAt: string;
  lastAuthenticatedAt: string;
  expiresAt: string;
  refreshExpiresAt: string;
  revokedAt: string | null;
  revokedReason: string | null;
}

export interface SessionView {
  id: string;
  createdAt: string;
  expiresAt: string;
  refreshExpiresAt: string;
}

export interface SessionTokenBundle {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}
