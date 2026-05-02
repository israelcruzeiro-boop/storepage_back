import type { InviteDeliveryAttemptRecord } from '../../modules/invite/contracts/invite-delivery.types.js';
import type { InviteDeliveryAttemptRepository } from '../contracts/invite-delivery-attempt.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
import {
  fromInviteDeliveryAttemptRecord,
  INVITE_DELIVERY_ATTEMPT_SELECT,
  toInviteDeliveryAttemptRecord,
  type InviteDeliveryAttemptRow,
} from './supabase-row-mappers.js';

export class SupabaseInviteDeliveryAttemptRepository implements InviteDeliveryAttemptRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async save(attempt: InviteDeliveryAttemptRecord): Promise<InviteDeliveryAttemptRecord> {
    const row = await this.client.upsert<InviteDeliveryAttemptRow>(
      'invite_delivery_attempts',
      fromInviteDeliveryAttemptRecord(attempt),
      {
        select: INVITE_DELIVERY_ATTEMPT_SELECT,
        onConflict: 'id',
      },
    );

    return toInviteDeliveryAttemptRecord(row);
  }

  public async findLatestForInvite(companyId: string, inviteId: string): Promise<InviteDeliveryAttemptRecord | null> {
    return (await this.findLatestForInvites(companyId, [inviteId])).get(inviteId) ?? null;
  }

  public async findLatestForInvites(
    companyId: string,
    inviteIds: readonly string[],
  ): Promise<Map<string, InviteDeliveryAttemptRecord>> {
    if (inviteIds.length === 0) {
      return new Map();
    }

    const result = await this.client.select<InviteDeliveryAttemptRow>('invite_delivery_attempts', {
      select: INVITE_DELIVERY_ATTEMPT_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'invite_id', operator: 'in', value: inviteIds },
      ],
      order: [{ column: 'created_at', ascending: false }],
    });

    const latestByInviteId = new Map<string, InviteDeliveryAttemptRecord>();
    result.rows.map(toInviteDeliveryAttemptRecord).forEach((attempt) => {
      if (!latestByInviteId.has(attempt.inviteId)) {
        latestByInviteId.set(attempt.inviteId, attempt);
      }
    });

    return latestByInviteId;
  }

  public async listByInvite(companyId: string, inviteId: string, limit: number): Promise<InviteDeliveryAttemptRecord[]> {
    const result = await this.client.select<InviteDeliveryAttemptRow>('invite_delivery_attempts', {
      select: INVITE_DELIVERY_ATTEMPT_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'invite_id', operator: 'eq', value: inviteId },
      ],
      order: [{ column: 'created_at', ascending: false }],
      range: {
        offset: 0,
        limit,
      },
    });

    return result.rows.map(toInviteDeliveryAttemptRecord);
  }
}
