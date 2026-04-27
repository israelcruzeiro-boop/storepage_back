import { createRemoteJWKSet, jwtVerify, SignJWT, type JWTPayload, type JWTVerifyResult } from 'jose';
import type { AppEnv } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import type { UserRole } from '../modules/auth/contracts/auth.types.js';

export type SessionJwtPayload = JWTPayload & Record<string, unknown>;

interface AccessTokenInput {
  subject: string;
  companyId: string;
  role: UserRole;
  email?: string;
  sessionId: string;
}

interface RefreshTokenInput {
  subject: string;
  companyId: string;
  sessionId: string;
  refreshTokenId: string;
}

interface IssuedToken {
  token: string;
  expiresAt: string;
}

export class SessionJwtService {
  private readonly sharedSecret: Uint8Array | null;
  private readonly remoteJwks: ReturnType<typeof createRemoteJWKSet> | null;

  public constructor(private readonly env: AppEnv) {
    this.sharedSecret =
      env.AUTH.mode === 'shared-secret' && env.AUTH.sharedSecret
        ? new TextEncoder().encode(env.AUTH.sharedSecret)
        : null;

    this.remoteJwks =
      env.AUTH.mode === 'jwks' && env.AUTH.jwksUrl ? createRemoteJWKSet(new URL(env.AUTH.jwksUrl)) : null;
  }

  public isVerificationEnabled(): boolean {
    return this.env.AUTH.mode !== 'disabled';
  }

  public supportsTokenIssuance(): boolean {
    return this.env.AUTH.mode === 'shared-secret' && this.sharedSecret !== null;
  }

  public getClaimNames() {
    return this.env.AUTH.claims;
  }

  public async verifyAccessToken(token: string): Promise<JWTVerifyResult<SessionJwtPayload>> {
    return await this.verifyToken(token, 'access');
  }

  public async verifyRefreshToken(token: string): Promise<JWTVerifyResult<SessionJwtPayload>> {
    return await this.verifyToken(token, 'refresh');
  }

  public async issueAccessToken(input: AccessTokenInput): Promise<IssuedToken> {
    this.assertIssuanceSupported();

    const expiresAt = new Date(Date.now() + this.env.AUTH.accessTokenTtlMinutes * 60_000);
    const payload = {
      [this.env.AUTH.claims.companyId]: input.companyId,
      [this.env.AUTH.claims.role]: input.role,
      sid: input.sessionId,
      token_use: 'access',
      ...(input.email ? { [this.env.AUTH.claims.email]: input.email } : {}),
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: this.env.AUTH.allowedAlgorithms[0] })
      .setIssuer(this.env.AUTH.issuer!)
      .setAudience(this.getAudienceClaim())
      .setSubject(input.subject)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.sharedSecret!);

    return {
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  public async issueRefreshToken(input: RefreshTokenInput): Promise<IssuedToken> {
    this.assertIssuanceSupported();

    const expiresAt = new Date(Date.now() + this.env.AUTH.refreshTokenTtlDays * 24 * 60 * 60_000);
    const payload = {
      [this.env.AUTH.claims.companyId]: input.companyId,
      sid: input.sessionId,
      rti: input.refreshTokenId,
      token_use: 'refresh',
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: this.env.AUTH.allowedAlgorithms[0] })
      .setIssuer(this.env.AUTH.issuer!)
      .setAudience(this.getAudienceClaim())
      .setSubject(input.subject)
      .setIssuedAt()
      .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
      .sign(this.sharedSecret!);

    return {
      token,
      expiresAt: expiresAt.toISOString(),
    };
  }

  private async verifyToken(
    token: string,
    expectedTokenUse: 'access' | 'refresh',
  ): Promise<JWTVerifyResult<SessionJwtPayload>> {
    try {
      const verifyOptions = {
        issuer: this.env.AUTH.issuer ?? undefined,
        audience: this.env.AUTH.audience,
        algorithms: [...this.env.AUTH.allowedAlgorithms],
        clockTolerance: this.env.AUTH.clockToleranceSeconds,
      };

      const verifiedToken =
        this.env.AUTH.mode === 'shared-secret' && this.sharedSecret
          ? await jwtVerify<SessionJwtPayload>(token, this.sharedSecret, verifyOptions)
          : this.env.AUTH.mode === 'jwks' && this.remoteJwks
            ? await jwtVerify<SessionJwtPayload>(token, this.remoteJwks, verifyOptions)
            : null;

      if (!verifiedToken) {
        throw new AppError(
          500,
          'AUTH_CONFIGURATION_ERROR',
          'Authentication is enabled but the JWT verifier is not configured correctly.',
        );
      }

      this.assertTokenUse(verifiedToken.payload, expectedTokenUse);
      return verifiedToken;
    } catch (error) {
      if (error instanceof AppError && error.code === 'AUTH_CONFIGURATION_ERROR') {
        throw error;
      }

      throw new AppError(
        401,
        expectedTokenUse === 'refresh' ? 'INVALID_REFRESH_TOKEN' : 'INVALID_TOKEN',
        'JWT authentication failed.',
      );
    }
  }

  private assertIssuanceSupported(): void {
    if (!this.supportsTokenIssuance()) {
      throw new AppError(
        501,
        'TOKEN_ISSUE_UNSUPPORTED',
        'This environment can verify JWTs but cannot issue session tokens.',
      );
    }
  }

  private assertTokenUse(
    payload: SessionJwtPayload,
    expectedTokenUse: 'access' | 'refresh',
  ): void {
    const tokenUse = payload.token_use;

    if (tokenUse !== expectedTokenUse) {
      throw new AppError(
        401,
        expectedTokenUse === 'refresh' ? 'INVALID_REFRESH_TOKEN' : 'INVALID_TOKEN',
        'JWT authentication failed.',
      );
    }
  }

  private getAudienceClaim(): string | string[] {
    return this.env.AUTH.audience.length === 1 ? this.env.AUTH.audience[0]! : [...this.env.AUTH.audience];
  }
}
