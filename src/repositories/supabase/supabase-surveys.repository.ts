import type {
  SurveyAnswerRecord,
  SurveyQuestionRecord,
  SurveyRecord,
  SurveyResponseRecord,
} from '../../modules/surveys/contracts/surveys.types.js';
import type { SurveyListFilters, SurveysRepository } from '../contracts/surveys.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
import {
  SURVEY_ANSWER_SELECT,
  SURVEY_QUESTION_SELECT,
  SURVEY_RESPONSE_SELECT,
  SURVEY_SELECT,
  type SurveyAnswerRow,
  type SurveyQuestionRow,
  type SurveyResponseRow,
  type SurveyRow,
  fromSurveyAnswerRecord,
  fromSurveyQuestionRecord,
  fromSurveyRecord,
  fromSurveyResponseRecord,
  toSurveyAnswerRecord,
  toSurveyQuestionRecord,
  toSurveyRecord,
  toSurveyResponseRecord,
} from './supabase-row-mappers.js';

export class SupabaseSurveysRepository implements SurveysRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async listSurveys(companyId: string): Promise<SurveyRecord[]> {
    const result = await this.client.select<SurveyRow>('surveys', {
      select: SURVEY_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'created_at', ascending: false }],
    });
    return result.rows.map(toSurveyRecord);
  }

  public async listSurveysPaginated(companyId: string, filters: SurveyListFilters) {
    const queryFilters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'deleted_at', operator: 'is', value: null },
    ];
    if (filters.status && filters.status !== 'ALL') {
      queryFilters.push({ column: 'status', operator: 'eq', value: filters.status });
    }

    const search = filters.search?.trim();
    const result = await this.client.select<SurveyRow>('surveys', {
      select: SURVEY_SELECT,
      filters: queryFilters,
      or: search ? `title.ilike.*${search}*,description.ilike.*${search}*` : undefined,
      order: [{ column: 'created_at', ascending: false }],
      range: {
        offset: (filters.page - 1) * filters.limit,
        limit: filters.limit,
      },
      count: true,
    });

    return {
      items: result.rows.map(toSurveyRecord),
      total: result.total ?? result.rows.length,
    };
  }

  public async findSurveyById(companyId: string, surveyId: string): Promise<SurveyRecord | null> {
    const row = await this.client.selectOne<SurveyRow>('surveys', {
      select: SURVEY_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: surveyId },
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toSurveyRecord(row) : null;
  }

  public async saveSurvey(survey: SurveyRecord): Promise<SurveyRecord> {
    const row = await this.client.upsert<SurveyRow>('surveys', fromSurveyRecord(survey), {
      select: SURVEY_SELECT,
    });
    return toSurveyRecord(row);
  }

  public async listQuestions(surveyId: string): Promise<SurveyQuestionRecord[]> {
    const result = await this.client.select<SurveyQuestionRow>('survey_questions', {
      select: SURVEY_QUESTION_SELECT,
      filters: [
        { column: 'survey_id', operator: 'eq', value: surveyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'order_index', ascending: true }],
    });
    return result.rows.map(toSurveyQuestionRecord);
  }

  public async findQuestionById(questionId: string): Promise<SurveyQuestionRecord | null> {
    const row = await this.client.selectOne<SurveyQuestionRow>('survey_questions', {
      select: SURVEY_QUESTION_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: questionId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toSurveyQuestionRecord(row) : null;
  }

  public async saveQuestion(question: SurveyQuestionRecord): Promise<SurveyQuestionRecord> {
    const row = await this.client.upsert<SurveyQuestionRow>('survey_questions', fromSurveyQuestionRecord(question), {
      select: SURVEY_QUESTION_SELECT,
    });
    return toSurveyQuestionRecord(row);
  }

  public async listResponses(companyId: string, filters?: { surveyId?: string; userId?: string }): Promise<SurveyResponseRecord[]> {
    const queryFilters: Array<{ column: string; operator: 'eq'; value: string }> = [
      { column: 'company_id', operator: 'eq', value: companyId },
    ];
    if (filters?.surveyId) queryFilters.push({ column: 'survey_id', operator: 'eq', value: filters.surveyId });
    if (filters?.userId) queryFilters.push({ column: 'user_id', operator: 'eq', value: filters.userId });

    const result = await this.client.select<SurveyResponseRow>('survey_responses', {
      select: SURVEY_RESPONSE_SELECT,
      filters: queryFilters,
      order: [{ column: 'created_at', ascending: false }],
    });
    return result.rows.map(toSurveyResponseRecord);
  }

  public async findResponseById(responseId: string): Promise<SurveyResponseRecord | null> {
    const row = await this.client.selectOne<SurveyResponseRow>('survey_responses', {
      select: SURVEY_RESPONSE_SELECT,
      filters: [{ column: 'id', operator: 'eq', value: responseId }],
    });
    return row ? toSurveyResponseRecord(row) : null;
  }

  public async saveResponse(response: SurveyResponseRecord): Promise<SurveyResponseRecord> {
    const row = await this.client.upsert<SurveyResponseRow>('survey_responses', fromSurveyResponseRecord(response), {
      select: SURVEY_RESPONSE_SELECT,
    });
    return toSurveyResponseRecord(row);
  }

  public async listAnswers(responseIds: readonly string[]): Promise<SurveyAnswerRecord[]> {
    if (responseIds.length === 0) return [];
    const result = await this.client.select<SurveyAnswerRow>('survey_answers', {
      select: SURVEY_ANSWER_SELECT,
      filters: [{ column: 'response_id', operator: 'in', value: [...responseIds] }],
    });
    return result.rows.map(toSurveyAnswerRecord);
  }

  public async saveAnswer(answer: SurveyAnswerRecord): Promise<SurveyAnswerRecord> {
    const row = await this.client.upsert<SurveyAnswerRow>('survey_answers', fromSurveyAnswerRecord(answer), {
      select: SURVEY_ANSWER_SELECT,
    });
    return toSurveyAnswerRecord(row);
  }
}
