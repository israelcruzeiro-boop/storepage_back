import type { AuthSessionRecord } from '../../modules/auth/contracts/session.types.js';
import type { AuthSessionRepository } from '../contracts/auth-session.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

export class InMemoryAuthSessionRepository implements AuthSessionRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async findById(sessionId: string): Promise<AuthSessionRecord | null> {
    return this.store.getSession(sessionId);
  }

  public async save(session: AuthSessionRecord): Promise<AuthSessionRecord> {
    return this.store.setSession(session);
  }

  public async revokeSession(
    sessionId: string,
    companyId: string,
    userId: string,
    revokedAt: string,
    reason: string,
  ): Promise<void> {
    const session = this.store.getSession(sessionId);

    if (!session || session.companyId !== companyId || session.userId !== userId) {
      return;
    }

    await this.save({
      ...session,
      revokedAt,
      revokedReason: reason,
      updatedAt: revokedAt,
    });
  }

  public async revokeSessionsByUser(companyId: string, userId: string, revokedAt: string, reason: string): Promise<void> {
    const sessions = this.store
      .listSessions()
      .filter((session) => session.companyId === companyId && session.userId === userId && session.revokedAt === null);

    await Promise.all(
      sessions.map(async (session) => {
        await this.save({
          ...session,
          revokedAt,
          revokedReason: reason,
          updatedAt: revokedAt,
        });
      }),
    );
  }
}
