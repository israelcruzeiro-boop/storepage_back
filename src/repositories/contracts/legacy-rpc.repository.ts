/**
 * Port for legacy Supabase RPCs that have not yet received a fully modeled
 * domain in the backend. These wrappers exist exclusively so the frontend can
 * stop talking to the database directly. Each entry in this contract has a
 * direct backend HTTP endpoint mounted on top of it.
 */

import type { UserRole } from '../../modules/auth/contracts/auth.types.js';

export interface IncrementUserStatsInput {
  userId: string;
  xpToAdd: number;
  coinsToAdd: number;
}

export interface IncrementUserStatsResult {
  userId: string;
  xpTotal: number | null;
  coinsTotal: number | null;
}

export interface SubmitSurveyAnswerInput {
  questionId: string;
  value: unknown;
}

export interface SubmitSurveyResponseInput {
  surveyId: string;
  userId: string;
  companyId: string;
  startedAt: string | null;
  answers: readonly SubmitSurveyAnswerInput[];
}

export interface SubmitSurveyResponseResult {
  responseId: string;
}

export interface ProvisionInviteInput {
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
}

export type ProvisionInviteStatus = 'invited' | 'updated_existing';

export interface ProvisionInviteResult {
  status: ProvisionInviteStatus;
  inviteId: string | null;
  userId: string | null;
}

export interface LegacyRpcRepository {
  incrementUserStats(input: IncrementUserStatsInput): Promise<IncrementUserStatsResult>;
  submitSurveyResponse(input: SubmitSurveyResponseInput): Promise<SubmitSurveyResponseResult>;
  provisionInvite(input: ProvisionInviteInput): Promise<ProvisionInviteResult>;
}
