import type { AuthSessionRecord } from '../../modules/auth/contracts/session.types.js';

export interface AuthSessionRepository {
  findById(sessionId: string): Promise<AuthSessionRecord | null>;
  save(session: AuthSessionRecord): Promise<AuthSessionRecord>;
  revokeSession(sessionId: string, companyId: string, userId: string, revokedAt: string, reason: string): Promise<void>;
  revokeSessionsByUser(companyId: string, userId: string, revokedAt: string, reason: string): Promise<void>;
}
