import type { InviteDeliveryAttemptRecord } from '../../modules/invite/contracts/invite-delivery.types.js';

export interface InviteDeliveryAttemptRepository {
  save(attempt: InviteDeliveryAttemptRecord): Promise<InviteDeliveryAttemptRecord>;
  findLatestForInvite(companyId: string, inviteId: string): Promise<InviteDeliveryAttemptRecord | null>;
  findLatestForInvites(companyId: string, inviteIds: readonly string[]): Promise<Map<string, InviteDeliveryAttemptRecord>>;
  listByInvite(companyId: string, inviteId: string, limit: number): Promise<InviteDeliveryAttemptRecord[]>;
}
