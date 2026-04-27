import type {
  SurveyAnswerRecord,
  SurveyQuestionRecord,
  SurveyRecord,
  SurveyResponseRecord,
} from '../../modules/surveys/contracts/surveys.types.js';

export interface SurveysRepository {
  listSurveys(companyId: string): Promise<SurveyRecord[]>;
  findSurveyById(companyId: string, surveyId: string): Promise<SurveyRecord | null>;
  saveSurvey(survey: SurveyRecord): Promise<SurveyRecord>;

  listQuestions(surveyId: string): Promise<SurveyQuestionRecord[]>;
  findQuestionById(questionId: string): Promise<SurveyQuestionRecord | null>;
  saveQuestion(question: SurveyQuestionRecord): Promise<SurveyQuestionRecord>;

  listResponses(companyId: string, filters?: { surveyId?: string; userId?: string }): Promise<SurveyResponseRecord[]>;
  findResponseById(responseId: string): Promise<SurveyResponseRecord | null>;
  saveResponse(response: SurveyResponseRecord): Promise<SurveyResponseRecord>;

  listAnswers(responseIds: readonly string[]): Promise<SurveyAnswerRecord[]>;
  saveAnswer(answer: SurveyAnswerRecord): Promise<SurveyAnswerRecord>;
}
