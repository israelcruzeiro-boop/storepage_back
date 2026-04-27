import type {
  IncrementUserStatsInput,
  IncrementUserStatsResult,
  LegacyRpcRepository,
  ProvisionInviteInput,
  ProvisionInviteResult,
  ProvisionInviteStatus,
  SubmitSurveyResponseInput,
  SubmitSurveyResponseResult,
} from '../contracts/legacy-rpc.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';

interface IncrementUserStatsRow {
  id?: string;
  user_id?: string;
  xp_total?: number | string | null;
  coins_total?: number | string | null;
}

interface SubmitSurveyResponseRow {
  id?: string;
  response_id?: string;
}

interface ProvisionInviteRow {
  status?: string;
  invite_id?: string | null;
  user_id?: string | null;
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readFirst<T extends object>(value: unknown): T | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === 'object' ? (first as T) : null;
  }
  if (value && typeof value === 'object') {
    return value as T;
  }
  return null;
}

export class SupabaseLegacyRpcRepository implements LegacyRpcRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async incrementUserStats(input: IncrementUserStatsInput): Promise<IncrementUserStatsResult> {
    const result = await this.client.rpc<unknown>('increment_user_stats', {
      user_id_param: input.userId,
      xp_to_add: input.xpToAdd,
      coins_to_add: input.coinsToAdd,
    });

    const row = readFirst<IncrementUserStatsRow>(result);
    return {
      userId: input.userId,
      xpTotal: row ? toNumberOrNull(row.xp_total) : null,
      coinsTotal: row ? toNumberOrNull(row.coins_total) : null,
    };
  }

  public async submitSurveyResponse(input: SubmitSurveyResponseInput): Promise<SubmitSurveyResponseResult> {
    const payload = {
      p_payload: {
        survey_id: input.surveyId,
        user_id: input.userId,
        company_id: input.companyId,
        started_at: input.startedAt,
        answers: input.answers.map((answer) => ({
          question_id: answer.questionId,
          value: answer.value,
        })),
      },
    };

    const result = await this.client.rpc<unknown>('submit_survey_response', payload);
    const row = readFirst<SubmitSurveyResponseRow>(result);
    const responseId =
      (typeof result === 'string' ? result : null) ??
      row?.response_id ??
      row?.id ??
      null;

    if (!responseId) {
      throw new Error('submit_survey_response returned an unexpected payload.');
    }

    return { responseId };
  }

  public async provisionInvite(input: ProvisionInviteInput): Promise<ProvisionInviteResult> {
    const result = await this.client.rpc<unknown>('provision_invite', {
      target_email: input.email,
      target_name: input.name,
      target_role: input.role,
      target_company_id: input.companyId,
    });

    const row = readFirst<ProvisionInviteRow>(result);
    const status: ProvisionInviteStatus = row?.status === 'updated_existing' ? 'updated_existing' : 'invited';

    return {
      status,
      inviteId: row?.invite_id ?? null,
      userId: row?.user_id ?? null,
    };
  }
}
