import type { AuthSessionRecord } from '../../modules/auth/contracts/session.types.js';
import type { AuthSessionRepository } from '../contracts/auth-session.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
import { fromSessionRecord, SESSION_SELECT, toSessionRecord, type SessionRow } from './supabase-row-mappers.js';

export class SupabaseAuthSessionRepository implements AuthSessionRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async findById(sessionId: string): Promise<AuthSessionRecord | null> {
    const row = await this.client.selectOne<SessionRow>('auth_sessions', {
      select: SESSION_SELECT,
      filters: [{ column: 'id', operator: 'eq', value: sessionId }],
    });

    return row ? toSessionRecord(row) : null;
  }

  public async save(session: AuthSessionRecord): Promise<AuthSessionRecord> {
    const row = await this.client.upsert<SessionRow>('auth_sessions', fromSessionRecord(session), {
      select: SESSION_SELECT,
      onConflict: 'id',
    });

    return toSessionRecord(row);
  }

  public async revokeSession(
    sessionId: string,
    companyId: string,
    userId: string,
    revokedAt: string,
    reason: string,
  ): Promise<void> {
    const session = await this.findById(sessionId);

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
    const result = await this.client.select<SessionRow>('auth_sessions', {
      select: SESSION_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'user_id', operator: 'eq', value: userId },
        { column: 'revoked_at', operator: 'is', value: null },
      ],
    });

    await Promise.all(
      result.rows.map(async (row) => {
        const session = toSessionRecord(row);
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
