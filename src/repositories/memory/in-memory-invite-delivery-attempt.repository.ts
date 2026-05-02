import type { InviteDeliveryAttemptRecord } from '../../modules/invite/contracts/invite-delivery.types.js';
import type { InviteDeliveryAttemptRepository } from '../contracts/invite-delivery-attempt.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

export class InMemoryInviteDeliveryAttemptRepository implements InviteDeliveryAttemptRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async save(attempt: InviteDeliveryAttemptRecord): Promise<InviteDeliveryAttemptRecord> {
    return this.store.setInviteDeliveryAttempt(attempt);
  }

  public async findLatestForInvite(companyId: string, inviteId: string): Promise<InviteDeliveryAttemptRecord | null> {
    return (await this.findLatestForInvites(companyId, [inviteId])).get(inviteId) ?? null;
  }

  public async findLatestForInvites(
    companyId: string,
    inviteIds: readonly string[],
  ): Promise<Map<string, InviteDeliveryAttemptRecord>> {
    const inviteIdSet = new Set(inviteIds);
    const latestByInviteId = new Map<string, InviteDeliveryAttemptRecord>();

    this.store
      .listInviteDeliveryAttempts()
      .filter((attempt) => attempt.companyId === companyId && inviteIdSet.has(attempt.inviteId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((attempt) => {
        if (!latestByInviteId.has(attempt.inviteId)) {
          latestByInviteId.set(attempt.inviteId, attempt);
        }
      });

    return latestByInviteId;
  }

  public async listByInvite(companyId: string, inviteId: string, limit: number): Promise<InviteDeliveryAttemptRecord[]> {
    return this.store
      .listInviteDeliveryAttempts()
      .filter((attempt) => attempt.companyId === companyId && attempt.inviteId === inviteId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}
