import type {
  SurveyAnswerRecord,
  SurveyQuestionRecord,
  SurveyRecord,
  SurveyResponseRecord,
} from '../../modules/surveys/contracts/surveys.types.js';
import type { SurveysRepository } from '../contracts/surveys.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

export class InMemorySurveysRepository implements SurveysRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async listSurveys(companyId: string): Promise<SurveyRecord[]> {
    return this.store
      .listSurveys()
      .filter((survey) => survey.companyId === companyId && !survey.deletedAt)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async findSurveyById(companyId: string, surveyId: string): Promise<SurveyRecord | null> {
    const survey = this.store.getSurvey(surveyId);
    if (!survey || survey.companyId !== companyId || survey.deletedAt) return null;
    return survey;
  }

  public async saveSurvey(survey: SurveyRecord): Promise<SurveyRecord> {
    return this.store.setSurvey(survey);
  }

  public async listQuestions(surveyId: string): Promise<SurveyQuestionRecord[]> {
    return this.store
      .listSurveyQuestions()
      .filter((question) => question.surveyId === surveyId && !question.deletedAt)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async findQuestionById(questionId: string): Promise<SurveyQuestionRecord | null> {
    const question = this.store.getSurveyQuestion(questionId);
    if (!question || question.deletedAt) return null;
    return question;
  }

  public async saveQuestion(question: SurveyQuestionRecord): Promise<SurveyQuestionRecord> {
    return this.store.setSurveyQuestion(question);
  }

  public async listResponses(companyId: string, filters?: { surveyId?: string; userId?: string }): Promise<SurveyResponseRecord[]> {
    return this.store
      .listSurveyResponses()
      .filter((response) => {
        if (response.companyId !== companyId) return false;
        if (filters?.surveyId && response.surveyId !== filters.surveyId) return false;
        if (filters?.userId && response.userId !== filters.userId) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async findResponseById(responseId: string): Promise<SurveyResponseRecord | null> {
    return this.store.getSurveyResponse(responseId);
  }

  public async saveResponse(response: SurveyResponseRecord): Promise<SurveyResponseRecord> {
    return this.store.setSurveyResponse(response);
  }

  public async listAnswers(responseIds: readonly string[]): Promise<SurveyAnswerRecord[]> {
    const ids = new Set(responseIds);
    return this.store.listSurveyAnswers().filter((answer) => ids.has(answer.responseId));
  }

  public async saveAnswer(answer: SurveyAnswerRecord): Promise<SurveyAnswerRecord> {
    return this.store.setSurveyAnswer(answer);
  }
}
