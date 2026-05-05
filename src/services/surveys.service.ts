import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import type { RestrictedAccessEvaluator } from '../lib/restricted-access.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type {
  SurveyQuestionRecord,
  SurveyRecord,
  SurveyResponseRecord,
} from '../modules/surveys/contracts/surveys.types.js';
import type { SubmitSurveyAnswerInput, SubmitSurveyResponseResult } from '../repositories/contracts/legacy-rpc.repository.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';
import type { SurveyListFilters, SurveysRepository } from '../repositories/contracts/surveys.repository.js';
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

type SurveyQuestionConfiguration = Record<string, unknown>;
type SurveyAnswerValue = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeSurveyQuestionConfiguration(
  questionType: SurveyQuestionRecord['questionType'],
  configuration: unknown,
): SurveyQuestionConfiguration {
  const base = isRecord(configuration) ? { ...configuration } : {};
  if (base.type !== questionType) {
    base.type = questionType;
  }

  if (questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE') {
    const options = Array.isArray(base.options) ? base.options : [];
    const normalizedOptions = options
      .filter(isRecord)
      .map((option) => ({
        id: getString(option.id)?.trim() ?? '',
        label: getString(option.label)?.trim() ?? '',
      }))
      .filter((option) => option.id.length > 0 && option.label.length > 0);

    if (normalizedOptions.length < 2) {
      throw new AppError(400, 'BAD_REQUEST', 'Choice questions require at least two valid options.');
    }

    base.options = normalizedOptions;
    base.allow_other = typeof base.allow_other === 'boolean' ? base.allow_other : false;
  }

  if (questionType === 'RATING') {
    const max = getNumber(base.max ?? base.max_stars) ?? 5;
    if (!Number.isInteger(max) || max < 3 || max > 10) {
      throw new AppError(400, 'BAD_REQUEST', 'Rating questions require a max value between 3 and 10.');
    }
    base.max = max;
    delete base.max_stars;
  }

  if (questionType === 'NUMBER') {
    const min = getNumber(base.min);
    const max = getNumber(base.max);
    if (min !== null && max !== null && min > max) {
      throw new AppError(400, 'BAD_REQUEST', 'Number question min cannot be greater than max.');
    }
  }

  return base;
}

export class SurveysService {
  public constructor(
    private readonly repository: SurveysRepository,
    private readonly users: UserRepository,
    private readonly structure: StructureRepository,
    private readonly access: RestrictedAccessEvaluator,
  ) {}

  public async listSurveys(actor: AuthenticatedActor) {
    const surveys = await this.repository.listSurveys(actor.companyId);
    const readableSurveys = await this.access.filterReadable(actor, surveys);
    return Promise.all(readableSurveys
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
    const questions = await this.repository.listQuestions(survey.id);
    this.assertValidResponseAnswers(questions, command.answers);

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
    await this.access.assertValidAccessTarget(actor.companyId, survey);
    return this.toSurveyView(await this.repository.saveSurvey(survey));
  }

  public async adminListSurveysPaginated(actor: AuthenticatedActor, filters: SurveyListFilters) {
    const { items, total } = await this.repository.listSurveysPaginated(actor.companyId, filters);
    const questionCounts = await Promise.all(items.map((survey) => this.repository.listQuestions(survey.id)));
    return {
      items: items.map((survey, index) => ({
        ...this.toSurveyView(survey),
        questionCount: questionCounts[index]?.length ?? 0,
      })),
      meta: this.toPaginationMeta(filters.page, filters.limit, total),
    };
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
    await this.access.assertValidAccessTarget(actor.companyId, next);
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
      configuration: normalizeSurveyQuestionConfiguration(input.questionType, input.configuration),
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
    const questionType = input.questionType ?? question.questionType;
    const next: SurveyQuestionRecord = {
      ...question,
      questionText: input.questionText ?? question.questionText,
      description: input.description === undefined ? question.description : input.description ?? null,
      questionType,
      configuration: normalizeSurveyQuestionConfiguration(
        questionType,
        input.configuration === undefined ? question.configuration : input.configuration,
      ),
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

  private assertValidResponseAnswers(
    questions: readonly SurveyQuestionRecord[],
    answers: readonly SubmitSurveyAnswerInput[],
  ): void {
    const questionById = new Map(questions.map((question) => [question.id, question]));
    const answeredQuestionIds = new Set<string>();

    for (const answer of answers) {
      const question = questionById.get(answer.questionId);
      if (!question) {
        throw new AppError(400, 'BAD_REQUEST', 'Survey response contains an invalid question.');
      }
      if (answeredQuestionIds.has(answer.questionId)) {
        throw new AppError(400, 'BAD_REQUEST', 'Survey response contains duplicate answers.');
      }
      answeredQuestionIds.add(answer.questionId);
      this.assertAnswerMatchesQuestion(question, answer.value);
    }

    const missingRequiredQuestionIds = questions
      .filter((question) => question.required && !answeredQuestionIds.has(question.id))
      .map((question) => question.id);

    if (missingRequiredQuestionIds.length > 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Survey response is missing required answers.', {
        missingQuestionIds: missingRequiredQuestionIds,
      });
    }
  }

  private assertAnswerMatchesQuestion(question: SurveyQuestionRecord, value: unknown): void {
    if (!isRecord(value) || value.type !== question.questionType) {
      throw new AppError(400, 'BAD_REQUEST', 'Survey answer type does not match its question.');
    }

    const config = normalizeSurveyQuestionConfiguration(question.questionType, question.configuration);
    switch (question.questionType) {
      case 'SHORT_TEXT':
      case 'LONG_TEXT':
        this.assertNonEmptyStringValue(value, 'text', question.required);
        return;
      case 'SINGLE_CHOICE':
        this.assertSingleChoiceAnswer(value, config);
        return;
      case 'MULTIPLE_CHOICE':
        this.assertMultipleChoiceAnswer(value, config, question.required);
        return;
      case 'RATING':
        this.assertRatingAnswer(value, config);
        return;
      case 'NPS':
        this.assertIntegerInRange(value.value, 0, 10, 'NPS answers must be between 0 and 10.');
        return;
      case 'DATE':
        this.assertNonEmptyStringValue(value, 'date', question.required);
        return;
      case 'NUMBER':
        this.assertNumberAnswer(value, config);
        return;
      case 'YES_NO':
        if (typeof value.value !== 'boolean') {
          throw new AppError(400, 'BAD_REQUEST', 'Yes/no answers must be boolean.');
        }
        return;
    }
  }

  private assertSingleChoiceAnswer(value: SurveyAnswerValue, config: SurveyQuestionConfiguration): void {
    const optionId = getString(value.option_id);
    if (!optionId || !this.getChoiceOptionIds(config).has(optionId)) {
      throw new AppError(400, 'BAD_REQUEST', 'Single choice answer references an invalid option.');
    }
  }

  private assertMultipleChoiceAnswer(
    value: SurveyAnswerValue,
    config: SurveyQuestionConfiguration,
    required: boolean,
  ): void {
    if (!Array.isArray(value.option_ids)) {
      throw new AppError(400, 'BAD_REQUEST', 'Multiple choice answers must include option_ids.');
    }
    const optionIds = value.option_ids.filter((optionId): optionId is string => typeof optionId === 'string');
    if (optionIds.length !== value.option_ids.length || new Set(optionIds).size !== optionIds.length) {
      throw new AppError(400, 'BAD_REQUEST', 'Multiple choice answers contain invalid options.');
    }
    if (required && optionIds.length === 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Required multiple choice questions need at least one option.');
    }

    const allowedOptionIds = this.getChoiceOptionIds(config);
    if (optionIds.some((optionId) => !allowedOptionIds.has(optionId))) {
      throw new AppError(400, 'BAD_REQUEST', 'Multiple choice answer references an invalid option.');
    }

    const minSelections = getNumber(config.min_selections);
    const maxSelections = getNumber(config.max_selections);
    if (minSelections !== null && optionIds.length < minSelections) {
      throw new AppError(400, 'BAD_REQUEST', 'Multiple choice answer has fewer selections than allowed.');
    }
    if (maxSelections !== null && optionIds.length > maxSelections) {
      throw new AppError(400, 'BAD_REQUEST', 'Multiple choice answer has more selections than allowed.');
    }
  }

  private assertRatingAnswer(value: SurveyAnswerValue, config: SurveyQuestionConfiguration): void {
    const max = getNumber(config.max) ?? 5;
    this.assertIntegerInRange(value.value, 1, max, 'Rating answers are outside the configured range.');
  }

  private assertNumberAnswer(value: SurveyAnswerValue, config: SurveyQuestionConfiguration): void {
    const numberValue = getNumber(value.value);
    if (numberValue === null) {
      throw new AppError(400, 'BAD_REQUEST', 'Number answers must be numeric.');
    }
    const min = getNumber(config.min);
    const max = getNumber(config.max);
    if (min !== null && numberValue < min) {
      throw new AppError(400, 'BAD_REQUEST', 'Number answer is below the configured minimum.');
    }
    if (max !== null && numberValue > max) {
      throw new AppError(400, 'BAD_REQUEST', 'Number answer is above the configured maximum.');
    }
  }

  private assertNonEmptyStringValue(value: SurveyAnswerValue, field: string, required: boolean): void {
    const stringValue = getString(value[field]);
    if (required && (!stringValue || stringValue.trim().length === 0)) {
      throw new AppError(400, 'BAD_REQUEST', 'Required survey answer is empty.');
    }
  }

  private assertIntegerInRange(value: unknown, min: number, max: number, message: string): void {
    const numberValue = getNumber(value);
    if (numberValue === null || !Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
      throw new AppError(400, 'BAD_REQUEST', message);
    }
  }

  private getChoiceOptionIds(config: SurveyQuestionConfiguration): Set<string> {
    const options = Array.isArray(config.options) ? config.options : [];
    return new Set(
      options
        .filter(isRecord)
        .map((option) => getString(option.id))
        .filter((optionId): optionId is string => Boolean(optionId)),
    );
  }

  private async getReadableSurvey(actor: AuthenticatedActor, surveyId: string) {
    const survey = await this.getTenantSurvey(actor.companyId, surveyId);
    if (!(await this.access.canRead(actor, survey))) {
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

  private toPaginationMeta(page: number, limit: number, total: number) {
    const totalPages = Math.ceil(total / limit);
    return {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
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
