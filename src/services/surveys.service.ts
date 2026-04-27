import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type {
  SurveyQuestionRecord,
  SurveyRecord,
  SurveyResponseRecord,
} from '../modules/surveys/contracts/surveys.types.js';
import type { SubmitSurveyAnswerInput, SubmitSurveyResponseResult } from '../repositories/contracts/legacy-rpc.repository.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';
import type { SurveysRepository } from '../repositories/contracts/surveys.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';
import type { OrgTopLevelRecord, OrgUnitRecord } from '../modules/structure/contracts/structure.types.js';
import type { UserRecord } from '../modules/user/contracts/user.types.js';

export interface SubmitSurveyResponseCommand {
  surveyId: string;
  startedAt: string | null;
  answers: readonly SubmitSurveyAnswerInput[];
}

export interface SurveyInput {
  title: string;
  description?: string | null;
  status?: SurveyRecord['status'];
  accessType?: SurveyRecord['accessType'];
  allowedUserIds?: string[];
  allowedRegionIds?: string[];
  allowedStoreIds?: string[];
  excludedUserIds?: string[];
  allowMultipleResponses?: boolean;
  anonymous?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  coverImage?: string | null;
}

export type SurveyUpdateInput = Partial<SurveyInput>;

export interface SurveyQuestionInput {
  surveyId?: string;
  questionText: string;
  description?: string | null;
  questionType: SurveyQuestionRecord['questionType'];
  configuration: unknown;
  required?: boolean;
  orderIndex?: number;
}

export type SurveyQuestionUpdateInput = Partial<SurveyQuestionInput>;

export class SurveysService {
  public constructor(
    private readonly repository: SurveysRepository,
    private readonly users: UserRepository,
    private readonly structure: StructureRepository,
  ) {}

  public async listSurveys(actor: AuthenticatedActor) {
    const surveys = await this.repository.listSurveys(actor.companyId);
    return Promise.all(surveys
      .filter((survey) => this.canReadSurvey(actor, survey))
      .map(async (survey) => ({
        ...this.toSurveyView(survey),
        questionCount: (await this.repository.listQuestions(survey.id)).length,
      })));
  }

  public async getSurvey(actor: AuthenticatedActor, surveyId: string) {
    const survey = await this.getReadableSurvey(actor, surveyId);
    return this.toSurveyView(survey);
  }

  public async listQuestions(actor: AuthenticatedActor, surveyId: string) {
    await this.getReadableSurvey(actor, surveyId);
    const questions = await this.repository.listQuestions(surveyId);
    return questions.map(this.toQuestionView);
  }

  public async listResponses(actor: AuthenticatedActor, surveyId: string) {
    await this.getTenantSurvey(actor.companyId, surveyId);
    const responses = await this.repository.listResponses(actor.companyId, { surveyId });
    return this.enrichResponses(responses);
  }

  public async listUserResponses(actor: AuthenticatedActor) {
    const responses = await this.repository.listResponses(actor.companyId, { userId: actor.userId });
    return this.enrichResponses(responses);
  }

  public async listAnswers(actor: AuthenticatedActor, surveyId: string) {
    await this.getTenantSurvey(actor.companyId, surveyId);
    const responses = await this.repository.listResponses(actor.companyId, { surveyId });
    const answers = await this.repository.listAnswers(responses.map((response) => response.id));
    return answers.map(this.toAnswerView);
  }

  public async submitResponse(
    actor: AuthenticatedActor,
    command: SubmitSurveyResponseCommand,
  ): Promise<SubmitSurveyResponseResult> {
    if (command.answers.length === 0) {
      throw new AppError(400, 'BAD_REQUEST', 'A survey response must include at least one answer.');
    }

    const survey = await this.getReadableSurvey(actor, command.surveyId);
    if (!survey.allowMultipleResponses) {
      const existing = await this.repository.listResponses(actor.companyId, {
        surveyId: command.surveyId,
        userId: actor.userId,
      });
      if (existing.length > 0) {
        throw new AppError(409, 'CONFLICT', 'Survey response already submitted.');
      }
    }

    const now = new Date().toISOString();
    const actorUser = await this.users.findById(actor.companyId, actor.userId);
    const response = await this.repository.saveResponse({
      id: randomUUID(),
      surveyId: command.surveyId,
      companyId: actor.companyId,
      userId: survey.anonymous ? null : actor.userId,
      orgUnitId: actorUser?.orgUnitId ?? null,
      orgTopLevelId: null,
      startedAt: command.startedAt ?? now,
      completedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all(
      command.answers.map((answer) =>
        this.repository.saveAnswer({
          id: randomUUID(),
          responseId: response.id,
          questionId: answer.questionId,
          value: answer.value,
          createdAt: now,
        }),
      ),
    );

    return { responseId: response.id };
  }

  public async createSurvey(actor: AuthenticatedActor, input: SurveyInput) {
    const now = new Date().toISOString();
    const survey: SurveyRecord = {
      id: randomUUID(),
      companyId: actor.companyId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'DRAFT',
      accessType: input.accessType ?? 'ALL',
      allowedUserIds: input.allowedUserIds ?? [],
      allowedRegionIds: input.allowedRegionIds ?? [],
      allowedStoreIds: input.allowedStoreIds ?? [],
      excludedUserIds: input.excludedUserIds ?? [],
      allowMultipleResponses: input.allowMultipleResponses ?? false,
      anonymous: input.anonymous ?? false,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      coverImage: input.coverImage ?? null,
      createdBy: actor.userId,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toSurveyView(await this.repository.saveSurvey(survey));
  }

  public async updateSurvey(actor: AuthenticatedActor, surveyId: string, input: SurveyUpdateInput) {
    const survey = await this.getTenantSurvey(actor.companyId, surveyId);
    const next: SurveyRecord = {
      ...survey,
      title: input.title ?? survey.title,
      description: input.description === undefined ? survey.description : input.description ?? null,
      status: input.status ?? survey.status,
      accessType: input.accessType ?? survey.accessType,
      allowedUserIds: input.allowedUserIds ?? survey.allowedUserIds,
      allowedRegionIds: input.allowedRegionIds ?? survey.allowedRegionIds,
      allowedStoreIds: input.allowedStoreIds ?? survey.allowedStoreIds,
      excludedUserIds: input.excludedUserIds ?? survey.excludedUserIds,
      allowMultipleResponses: input.allowMultipleResponses ?? survey.allowMultipleResponses,
      anonymous: input.anonymous ?? survey.anonymous,
      startsAt: input.startsAt === undefined ? survey.startsAt : input.startsAt ?? null,
      endsAt: input.endsAt === undefined ? survey.endsAt : input.endsAt ?? null,
      coverImage: input.coverImage === undefined ? survey.coverImage : input.coverImage ?? null,
      updatedAt: new Date().toISOString(),
    };
    return this.toSurveyView(await this.repository.saveSurvey(next));
  }

  public async deleteSurvey(actor: AuthenticatedActor, surveyId: string) {
    const survey = await this.getTenantSurvey(actor.companyId, surveyId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveSurvey({ ...survey, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: surveyId };
  }

  public async createQuestion(actor: AuthenticatedActor, surveyId: string, input: SurveyQuestionInput) {
    await this.getTenantSurvey(actor.companyId, surveyId);
    const now = new Date().toISOString();
    const question: SurveyQuestionRecord = {
      id: randomUUID(),
      surveyId,
      questionText: input.questionText,
      description: input.description ?? null,
      questionType: input.questionType,
      configuration: input.configuration,
      required: input.required ?? true,
      orderIndex: input.orderIndex ?? 0,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toQuestionView(await this.repository.saveQuestion(question));
  }

  public async updateQuestion(actor: AuthenticatedActor, questionId: string, input: SurveyQuestionUpdateInput) {
    const question = await this.getTenantQuestion(actor.companyId, questionId);
    const next: SurveyQuestionRecord = {
      ...question,
      questionText: input.questionText ?? question.questionText,
      description: input.description === undefined ? question.description : input.description ?? null,
      questionType: input.questionType ?? question.questionType,
      configuration: input.configuration === undefined ? question.configuration : input.configuration,
      required: input.required ?? question.required,
      orderIndex: input.orderIndex ?? question.orderIndex,
      updatedAt: new Date().toISOString(),
    };
    return this.toQuestionView(await this.repository.saveQuestion(next));
  }

  public async saveQuestion(actor: AuthenticatedActor, input: SurveyQuestionInput & { id?: string }) {
    if (input.id) {
      return this.updateQuestion(actor, input.id, input);
    }
    if (!input.surveyId) throw new AppError(400, 'BAD_REQUEST', 'surveyId is required.');
    return this.createQuestion(actor, input.surveyId, input);
  }

  public async deleteQuestion(actor: AuthenticatedActor, questionId: string) {
    const question = await this.getTenantQuestion(actor.companyId, questionId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveQuestion({ ...question, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: questionId };
  }

  public async reorderQuestions(actor: AuthenticatedActor, items: Array<{ id: string; orderIndex: number }>) {
    const results = await Promise.all(
      items.map(async (item) => {
        const question = await this.getTenantQuestion(actor.companyId, item.id);
        return this.toQuestionView(
          await this.repository.saveQuestion({
            ...question,
            orderIndex: item.orderIndex,
            updatedAt: new Date().toISOString(),
          }),
        );
      }),
    );
    return { updated: results.length, questions: results };
  }

  private canReadSurvey(actor: AuthenticatedActor, survey: SurveyRecord): boolean {
    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') return true;
    if (survey.status !== 'ACTIVE') return false;
    if (survey.accessType === 'ALL') return true;
    return survey.allowedUserIds.length === 0 || survey.allowedUserIds.includes(actor.userId);
  }

  private async getReadableSurvey(actor: AuthenticatedActor, surveyId: string) {
    const survey = await this.getTenantSurvey(actor.companyId, surveyId);
    if (!this.canReadSurvey(actor, survey)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this survey.');
    }
    return survey;
  }

  private async getTenantSurvey(companyId: string, surveyId: string) {
    const survey = await this.repository.findSurveyById(companyId, surveyId);
    if (!survey) throw new AppError(404, 'NOT_FOUND', 'Survey not found.');
    return survey;
  }

  private async getTenantQuestion(companyId: string, questionId: string) {
    const question = await this.repository.findQuestionById(questionId);
    if (!question) throw new AppError(404, 'NOT_FOUND', 'Survey question not found.');
    await this.getTenantSurvey(companyId, question.surveyId);
    return question;
  }

  private async enrichResponses(responses: SurveyResponseRecord[]) {
    const units = await this.structure.listUnits(responses[0]?.companyId ?? '');
    const topLevels = await this.structure.listTopLevels(responses[0]?.companyId ?? '');
    const enriched = await Promise.all(
      responses.map(async (response) => {
        const user = response.userId ? await this.users.findById(response.companyId, response.userId) : null;
        const unit = response.orgUnitId ? units.find((candidate) => candidate.id === response.orgUnitId) ?? null : null;
        const topLevel = response.orgTopLevelId
          ? topLevels.find((candidate) => candidate.id === response.orgTopLevelId) ?? null
          : null;
        return this.toResponseView(response, user, unit, topLevel);
      }),
    );
    return enriched;
  }

  private toSurveyView(survey: SurveyRecord) {
    return {
      id: survey.id,
      companyId: survey.companyId,
      title: survey.title,
      description: survey.description,
      status: survey.status,
      accessType: survey.accessType,
      allowedUserIds: survey.allowedUserIds,
      allowedRegionIds: survey.allowedRegionIds,
      allowedStoreIds: survey.allowedStoreIds,
      excludedUserIds: survey.excludedUserIds,
      allowMultipleResponses: survey.allowMultipleResponses,
      anonymous: survey.anonymous,
      startsAt: survey.startsAt,
      endsAt: survey.endsAt,
      coverImage: survey.coverImage,
      createdBy: survey.createdBy,
      createdAt: survey.createdAt,
      updatedAt: survey.updatedAt,
    };
  }

  private toQuestionView(question: SurveyQuestionRecord) {
    return {
      id: question.id,
      surveyId: question.surveyId,
      questionText: question.questionText,
      description: question.description,
      questionType: question.questionType,
      configuration: question.configuration,
      required: question.required,
      orderIndex: question.orderIndex,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  private toResponseView(
    response: SurveyResponseRecord,
    user: UserRecord | null,
    unit: OrgUnitRecord | null,
    topLevel: OrgTopLevelRecord | null,
  ) {
    return {
      id: response.id,
      surveyId: response.surveyId,
      companyId: response.companyId,
      userId: response.userId,
      orgUnitId: response.orgUnitId,
      orgTopLevelId: response.orgTopLevelId,
      startedAt: response.startedAt,
      completedAt: response.completedAt,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            orgUnitId: user.orgUnitId,
          }
        : null,
      orgUnit: unit ? { id: unit.id, name: unit.name } : null,
      orgTopLevel: topLevel ? { id: topLevel.id, name: topLevel.name } : null,
    };
  }

  private toAnswerView(answer: { id: string; responseId: string; questionId: string; value: unknown; createdAt: string }) {
    return {
      id: answer.id,
      responseId: answer.responseId,
      questionId: answer.questionId,
      value: answer.value,
      createdAt: answer.createdAt,
    };
  }
}
