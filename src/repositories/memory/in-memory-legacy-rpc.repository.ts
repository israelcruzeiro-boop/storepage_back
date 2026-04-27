import { randomUUID } from 'node:crypto';
import type {
  IncrementUserStatsInput,
  IncrementUserStatsResult,
  LegacyRpcRepository,
  ProvisionInviteInput,
  ProvisionInviteResult,
  SubmitSurveyResponseInput,
  SubmitSurveyResponseResult,
} from '../contracts/legacy-rpc.repository.js';

interface UserStatsState {
  xpTotal: number;
  coinsTotal: number;
}

/**
 * In-memory adapter for legacy RPC operations.
 *
 * Used by tests and any developer running the backend with REPOSITORY_DRIVER=memory.
 * It mirrors the contracts of the supabase implementation but does not require a
 * live database. The state lives only for the lifetime of the process.
 */
export class InMemoryLegacyRpcRepository implements LegacyRpcRepository {
  private readonly userStats = new Map<string, UserStatsState>();
  private readonly surveyResponses: SubmitSurveyResponseInput[] = [];
  private readonly invites = new Map<string, ProvisionInviteResult>();

  public async incrementUserStats(input: IncrementUserStatsInput): Promise<IncrementUserStatsResult> {
    const current = this.userStats.get(input.userId) ?? { xpTotal: 0, coinsTotal: 0 };
    const next: UserStatsState = {
      xpTotal: current.xpTotal + input.xpToAdd,
      coinsTotal: current.coinsTotal + input.coinsToAdd,
    };
    this.userStats.set(input.userId, next);
    return { userId: input.userId, xpTotal: next.xpTotal, coinsTotal: next.coinsTotal };
  }

  public async submitSurveyResponse(input: SubmitSurveyResponseInput): Promise<SubmitSurveyResponseResult> {
    this.surveyResponses.push(input);
    return { responseId: randomUUID() };
  }

  public listSurveyResponses(): SubmitSurveyResponseInput[] {
    return structuredClone(this.surveyResponses);
  }

  public async provisionInvite(input: ProvisionInviteInput): Promise<ProvisionInviteResult> {
    const key = `${input.companyId}:${input.email.toLowerCase()}`;
    const existing = this.invites.get(key);
    const result: ProvisionInviteResult = existing
      ? { status: 'updated_existing', inviteId: existing.inviteId, userId: existing.userId }
      : { status: 'invited', inviteId: randomUUID(), userId: null };
    this.invites.set(key, result);
    return result;
  }
}
