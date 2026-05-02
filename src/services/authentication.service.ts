import { AppError } from '../lib/errors.js';
import type {
  AuthContext,
  AuthTokenMetadata,
} from '../modules/auth/contracts/auth.types.js';
import { tokenIdentitySchema } from '../schemas/auth.js';
import type { AuthSessionRepository } from '../repositories/contracts/auth-session.repository.js';
import type { CompanyRepository } from '../repositories/contracts/company.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';
import type { SessionJwtService } from './session-jwt.service.js';

export class AuthenticationService {
  public constructor(
    private readonly jwtService: SessionJwtService,
    private readonly userRepository: UserRepository,
    private readonly authSessionRepository: AuthSessionRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  public async resolveContext(bearerToken: string | null): Promise<AuthContext> {
    if (!this.jwtService.isVerificationEnabled()) {
      return this.buildUnauthenticatedContext(bearerToken, 'none');
    }

    if (!bearerToken) {
      return this.buildUnauthenticatedContext(null, 'jwt');
    }

    const verifiedToken = await this.jwtService.verifyAccessToken(bearerToken);
    const tokenIdentity = this.mapTokenIdentity(verifiedToken.payload);

    if (!tokenIdentity.sessionId || tokenIdentity.tokenUse !== 'access') {
      throw new AppError(401, 'INVALID_TOKEN', 'JWT authentication failed.');
    }

    const company = await this.companyRepository.findById(tokenIdentity.companyId);

    if (!company || !company.active || company.status !== 'ACTIVE') {
      throw new AppError(401, 'INVALID_TOKEN', 'JWT authentication failed.');
    }

    const user = await this.userRepository.findById(tokenIdentity.companyId, tokenIdentity.subject);

    if (!user || !user.active || user.status !== 'ACTIVE') {
      throw new AppError(401, 'INVALID_TOKEN', 'JWT authentication failed.');
    }

    const session = await this.authSessionRepository.findById(tokenIdentity.sessionId);

    if (
      !session ||
      session.userId !== user.id ||
      session.companyId !== user.companyId ||
      session.revokedAt !== null ||
      new Date(session.expiresAt).getTime() <= Date.now()
    ) {
      throw new AppError(401, 'SESSION_REVOKED', 'The current session is no longer active.');
    }

    return {
      isAuthenticated: true,
      strategy: 'jwt',
      bearerToken,
      actor: {
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
        name: user.name,
        email: user.email,
        firstAccess: user.firstAccess,
        sessionId: tokenIdentity.sessionId,
      },
      token: this.buildTokenMetadata(verifiedToken.payload, tokenIdentity.sessionId, tokenIdentity.tokenUse),
    };
  }

  private buildUnauthenticatedContext(
    bearerToken: string | null,
    strategy: 'jwt' | 'none',
  ): AuthContext {
    return {
      isAuthenticated: false,
      strategy,
      bearerToken,
      actor: null,
      token: null,
    };
  }

  private mapTokenIdentity(payload: Record<string, unknown>) {
    const claimNames = this.jwtService.getClaimNames();
    const parsedIdentity = tokenIdentitySchema.safeParse({
      subject: payload.sub,
      role: this.readOptionalStringClaim(payload, claimNames.role),
      companyId: this.readStringClaim(payload, claimNames.companyId),
      email: this.readOptionalStringClaim(payload, claimNames.email),
      sessionId: this.readOptionalStringClaim(payload, 'sid'),
      tokenUse: this.readOptionalStringClaim(payload, 'token_use'),
      refreshTokenId: this.readOptionalStringClaim(payload, 'rti'),
    });

    if (!parsedIdentity.success) {
      throw new AppError(401, 'INVALID_TOKEN', 'JWT authentication failed.');
    }

    return parsedIdentity.data;
  }

  private buildTokenMetadata(
    payload: Record<string, unknown>,
    sessionId: string | null,
    tokenUse: 'access' | 'refresh' | undefined,
  ): AuthTokenMetadata {
    return {
      subject: typeof payload.sub === 'string' ? payload.sub : '',
      issuer: typeof payload.iss === 'string' ? payload.iss : null,
      audience: this.normalizeAudience(payload.aud),
      expiresAt: typeof payload.exp === 'number' ? payload.exp : null,
      issuedAt: typeof payload.iat === 'number' ? payload.iat : null,
      sessionId,
      tokenUse: tokenUse ?? 'unknown',
    };
  }

  private normalizeAudience(audience: unknown): readonly string[] {
    if (typeof audience === 'string') {
      return [audience];
    }

    if (Array.isArray(audience)) {
      return audience.filter((entry): entry is string => typeof entry === 'string');
    }

    return [];
  }

  private readStringClaim(payload: Record<string, unknown>, claimName: string): string | undefined {
    const value = claimName === 'sub' ? payload.sub : payload[claimName];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private readOptionalStringClaim(payload: Record<string, unknown>, claimName: string): string | undefined {
    const value = payload[claimName];
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }
}
