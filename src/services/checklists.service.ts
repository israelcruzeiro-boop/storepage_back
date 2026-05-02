import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import type { RestrictedAccessEvaluator } from '../lib/restricted-access.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type {
  ActionPlanRecord,
  ChecklistAnswerRecord,
  ChecklistFolderRecord,
  ChecklistQuestionRecord,
  ChecklistRecord,
  ChecklistSectionRecord,
  ChecklistSubmissionRecord,
} from '../modules/checklists/contracts/checklists.types.js';
import type { ChecklistsRepository } from '../repositories/contracts/checklists.repository.js';

/* ---------- Input types ---------- */
interface ChecklistInput {
  title: string;
  description?: string;
  coverImage?: string | null;
  status: ChecklistRecord['status'];
  accessType: ChecklistRecord['accessType'];
  allowedUserIds: string[];
  allowedRegionIds: string[];
  allowedStoreIds: string[];
  excludedUserIds: string[];
  folderId?: string | null;
}
type ChecklistUpdateInput = Partial<ChecklistInput>;

interface FolderInput { name: string; orderIndex: number; }
type FolderUpdateInput = Partial<FolderInput>;

interface SectionInput { title: string; orderIndex: number; }
type SectionUpdateInput = Partial<SectionInput>;

interface QuestionInput {
  questionText: string;
  questionType: ChecklistQuestionRecord['questionType'];
  required: boolean;
  configuration?: unknown | null;
  orderIndex: number;
}
type QuestionUpdateInput = Partial<QuestionInput>;

type ChecklistQuestionConfiguration = {
  photo_required?: boolean;
  photo_policy?: 'ALWAYS' | 'NON_COMPLIANCE' | 'OPTIONAL';
};

interface AnswerInput {
  value?: unknown | null;
  textValue?: string | null;
  numericValue?: number | null;
  booleanValue?: boolean | null;
  attachmentUrls?: string[];
  photoUrls?: string[];
  conformity?: ChecklistAnswerRecord['conformity'];
  notes?: string | null;
  note?: string | null;
  actionPlan?: string | null;
  assignedUserId?: string | null;
  actionPlanDueDate?: string | null;
  actionPlanCreatedBy?: string | null;
}

interface ActionPlanInput {
  submissionId?: string | null;
  answerId?: string | null;
  checklistId?: string | null;
  title: string;
  description?: string;
  status: ActionPlanRecord['status'];
  priority: ActionPlanRecord['priority'];
  assigneeUserId?: string | null;
  dueDate?: string | null;
}
type ActionPlanUpdateInput = Partial<ActionPlanInput>;

export class ChecklistsService {
  public constructor(
    private readonly repository: ChecklistsRepository,
    private readonly access: RestrictedAccessEvaluator,
  ) {}

  /* ======================== User-facing ======================== */

  public async listChecklists(actor: AuthenticatedActor) {
    const checklists = await this.repository.listChecklists(actor.companyId);
    const readableChecklists = await this.access.filterReadable(actor, checklists);
    return readableChecklists.map(this.toChecklistView);
  }

  public async listReadableFolders(actor: AuthenticatedActor) {
    const checklists = await this.repository.listChecklists(actor.companyId);
    const readableChecklists = await this.access.filterReadable(actor, checklists);
    const readableFolderIds = new Set(
      readableChecklists
        .map((checklist) => checklist.folderId)
        .filter((folderId): folderId is string => Boolean(folderId)),
    );

    if (readableFolderIds.size === 0) return [];

    const folders = await this.repository.listFolders(actor.companyId);
    return folders
      .filter((folder) => readableFolderIds.has(folder.id))
      .map(this.toFolderView);
  }

  public async getChecklist(actor: AuthenticatedActor, checklistId: string) {
    const checklist = await this.getReadableChecklist(actor, checklistId);
    const sections = await this.repository.listSections(checklist.id);
    const questions = await this.repository.listQuestionsByChecklistId(checklist.id);
    const checklistView = this.toChecklistView(checklist);
    const sectionViews = sections.map((s) => ({
      ...this.toSectionView(s),
      questions: questions.filter((q) => q.sectionId === s.id).map((q) => this.toQuestionView(q, s.checklistId)),
    }));
    const questionViews = questions.map((question) => {
      const section = sections.find((s) => s.id === question.sectionId);
      return this.toQuestionView(question, section?.checklistId ?? checklist.id);
    });
    return {
      ...checklistView,
      checklist: checklistView,
      sections: sectionViews,
      questions: questionViews,
    };
  }

  public async createSubmission(actor: AuthenticatedActor, checklistId: string, input: { orgUnitId?: string | null }) {
    await this.getReadableChecklist(actor, checklistId);
    const now = new Date().toISOString();
    const submission: ChecklistSubmissionRecord = {
      id: randomUUID(),
      checklistId,
      companyId: actor.companyId,
      userId: actor.userId,
      orgUnitId: input.orgUnitId ?? null,
      status: 'IN_PROGRESS',
      score: null,
      startedAt: now,
      completedAt: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toSubmissionView(await this.repository.saveSubmission(submission));
  }

  public async getSubmission(actor: AuthenticatedActor, submissionId: string) {
    const submission = await this.getOwnedSubmission(actor, submissionId);
    const answers = await this.repository.listAnswers(submission.id);
    const submissionView = this.toSubmissionView(submission);
    return {
      ...submissionView,
      submission: submissionView,
      answers: answers.map(this.toAnswerView),
    };
  }

  public async listUserSubmissions(actor: AuthenticatedActor, filters?: { status?: ChecklistSubmissionRecord['status'] }) {
    const submissions = await this.repository.listSubmissions(actor.companyId, { userId: actor.userId });
    return submissions
      .filter((submission) => !filters?.status || submission.status === filters.status)
      .map((submission) => this.toSubmissionView(submission));
  }

  public async upsertAnswer(actor: AuthenticatedActor, submissionId: string, questionId: string, input: AnswerInput) {
    const submission = await this.getOwnedSubmission(actor, submissionId);
    if (submission.status === 'COMPLETED') {
      throw new AppError(400, 'BAD_REQUEST', 'Cannot modify a completed submission.');
    }
    const question = await this.repository.findQuestionById(questionId);
    if (!question) throw new AppError(404, 'NOT_FOUND', 'Question not found.');
    if (question.checklistId !== submission.checklistId) {
      throw new AppError(404, 'NOT_FOUND', 'Question not found.');
    }

    const existing = await this.repository.findAnswer(submissionId, questionId);
    const now = new Date().toISOString();
    const answer: ChecklistAnswerRecord = {
      id: existing?.id ?? randomUUID(),
      submissionId,
      questionId,
      value: input.value ?? null,
      textValue: input.textValue ?? null,
      numericValue: input.numericValue ?? null,
      booleanValue: input.booleanValue ?? null,
      attachmentUrls: input.photoUrls ?? input.attachmentUrls ?? [],
      conformity: input.conformity ?? null,
      notes: input.note ?? input.notes ?? null,
      answeredAt: now,
    };
    const saved = await this.repository.saveAnswer(answer);

    if (input.actionPlan?.trim()) {
      const existingPlan = (await this.repository.listActionPlans(actor.companyId))
        .find((plan) => plan.answerId === saved.id && !plan.deletedAt);
      const dueDate = input.actionPlanDueDate ?? null;
      await this.repository.saveActionPlan({
        id: existingPlan?.id ?? randomUUID(),
        companyId: actor.companyId,
        submissionId,
        answerId: saved.id,
        checklistId: submission.checklistId,
        title: 'Plano de ação',
        description: input.actionPlan,
        status: existingPlan?.status ?? 'OPEN',
        priority: existingPlan?.priority ?? 'MEDIUM',
        assigneeUserId: input.assignedUserId ?? null,
        dueDate,
        completedAt: existingPlan?.completedAt ?? null,
        createdByUserId: input.actionPlanCreatedBy ?? actor.userId,
        deletedAt: null,
        createdAt: existingPlan?.createdAt ?? now,
        updatedAt: now,
      });
    }

    return this.toAnswerView(saved);
  }

  public async completeSubmission(actor: AuthenticatedActor, submissionId: string) {
    const submission = await this.getOwnedSubmission(actor, submissionId);
    if (submission.status === 'COMPLETED') {
      throw new AppError(400, 'BAD_REQUEST', 'Submission is already completed.');
    }
    const now = new Date().toISOString();
    const answers = await this.repository.listAnswers(submissionId);
    const questions = await this.repository.listQuestionsByChecklistId(submission.checklistId);
    this.assertRequiredPhotosHaveAttachments(questions, answers);
    const totalQuestions = questions.length;
    const answeredCount = answers.length;
    const score = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 100;

    const next: ChecklistSubmissionRecord = {
      ...submission,
      status: 'COMPLETED',
      completedAt: now,
      score,
      updatedAt: now,
    };
    return this.toSubmissionView(await this.repository.saveSubmission(next));
  }

  /* Action Plans - user facing */
  public async listActionPlans(
    actor: AuthenticatedActor,
    filters?: { submissionId?: string; assigneeUserId?: string; userId?: string; scope?: 'all' | 'received' | 'sent' },
  ) {
    const assigneeUserId = filters?.assigneeUserId ?? (filters?.scope === 'received' ? actor.userId : undefined);
    const plans = await this.repository.listActionPlans(actor.companyId, {
      submissionId: filters?.submissionId,
      assigneeUserId,
    });
    const scoped = filters?.scope === 'sent'
      ? plans.filter((plan) => plan.createdByUserId === actor.userId)
      : plans;
    return scoped.map(this.toActionPlanView);
  }

  public async createActionPlan(actor: AuthenticatedActor, input: ActionPlanInput) {
    const now = new Date().toISOString();
    const plan: ActionPlanRecord = {
      id: randomUUID(),
      companyId: actor.companyId,
      submissionId: input.submissionId ?? null,
      answerId: input.answerId ?? null,
      checklistId: input.checklistId ?? null,
      title: input.title,
      description: input.description ?? '',
      status: input.status,
      priority: input.priority,
      assigneeUserId: input.assigneeUserId ?? null,
      dueDate: input.dueDate ?? null,
      completedAt: null,
      createdByUserId: actor.userId,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toActionPlanView(await this.repository.saveActionPlan(plan));
  }

  public async updateActionPlan(actor: AuthenticatedActor, actionPlanId: string, input: ActionPlanUpdateInput) {
    const plan = await this.getTenantActionPlan(actor.companyId, actionPlanId);
    const now = new Date().toISOString();
    const next: ActionPlanRecord = {
      ...plan,
      ...input,
      submissionId: input.submissionId === undefined ? plan.submissionId : input.submissionId ?? null,
      answerId: input.answerId === undefined ? plan.answerId : input.answerId ?? null,
      checklistId: input.checklistId === undefined ? plan.checklistId : input.checklistId ?? null,
      assigneeUserId: input.assigneeUserId === undefined ? plan.assigneeUserId : input.assigneeUserId ?? null,
      dueDate: input.dueDate === undefined ? plan.dueDate : input.dueDate ?? null,
      completedAt: input.status === 'DONE' && !plan.completedAt ? now : plan.completedAt,
      updatedAt: now,
    };
    return this.toActionPlanView(await this.repository.saveActionPlan(next));
  }

  /* ======================== Admin ======================== */

  public async adminListChecklists(companyId: string) {
    const checklists = await this.repository.listChecklists(companyId);
    return checklists.map(this.toChecklistView);
  }

  public async createChecklist(companyId: string, input: ChecklistInput) {
    const now = new Date().toISOString();
    const checklist: ChecklistRecord = {
      id: randomUUID(),
      companyId,
      title: input.title,
      description: input.description ?? '',
      coverImage: input.coverImage ?? null,
      status: input.status,
      accessType: input.accessType,
      allowedUserIds: input.allowedUserIds,
      allowedRegionIds: input.allowedRegionIds,
      allowedStoreIds: input.allowedStoreIds,
      excludedUserIds: input.excludedUserIds,
      folderId: input.folderId ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await this.access.assertValidAccessTarget(companyId, checklist);
    return this.toChecklistView(await this.repository.saveChecklist(checklist));
  }

  public async updateChecklist(companyId: string, checklistId: string, input: ChecklistUpdateInput) {
    const checklist = await this.getTenantChecklist(companyId, checklistId);
    const next: ChecklistRecord = {
      ...checklist,
      ...input,
      coverImage: input.coverImage === undefined ? checklist.coverImage : input.coverImage ?? null,
      folderId: input.folderId === undefined ? checklist.folderId : input.folderId ?? null,
      updatedAt: new Date().toISOString(),
    };
    await this.access.assertValidAccessTarget(companyId, next);
    return this.toChecklistView(await this.repository.saveChecklist(next));
  }

  public async deleteChecklist(companyId: string, checklistId: string) {
    const checklist = await this.getTenantChecklist(companyId, checklistId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveChecklist({ ...checklist, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: checklistId };
  }

  /* Folders */
  public async listFolders(companyId: string) {
    const folders = await this.repository.listFolders(companyId);
    return folders.map(this.toFolderView);
  }

  public async createFolder(companyId: string, input: FolderInput) {
    const now = new Date().toISOString();
    const folder: ChecklistFolderRecord = {
      id: randomUUID(),
      companyId,
      name: input.name,
      orderIndex: input.orderIndex,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toFolderView(await this.repository.saveFolder(folder));
  }

  public async updateFolder(companyId: string, folderId: string, input: FolderUpdateInput) {
    const folder = await this.getTenantFolder(companyId, folderId);
    const next = { ...folder, ...input, updatedAt: new Date().toISOString() };
    return this.toFolderView(await this.repository.saveFolder(next));
  }

  public async deleteFolder(companyId: string, folderId: string) {
    const folder = await this.getTenantFolder(companyId, folderId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveFolder({ ...folder, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: folderId };
  }

  /* Sections */
  public async listSections(companyId: string, checklistId: string) {
    await this.getTenantChecklist(companyId, checklistId);
    const sections = await this.repository.listSections(checklistId);
    return sections.map(this.toSectionView);
  }

  public async createSection(companyId: string, checklistId: string, input: SectionInput) {
    await this.getTenantChecklist(companyId, checklistId);
    const now = new Date().toISOString();
    const section: ChecklistSectionRecord = {
      id: randomUUID(),
      checklistId,
      title: input.title,
      orderIndex: input.orderIndex,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toSectionView(await this.repository.saveSection(section));
  }

  public async updateSection(companyId: string, sectionId: string, input: SectionUpdateInput) {
    const section = await this.getTenantSection(companyId, sectionId);
    const next = { ...section, ...input, updatedAt: new Date().toISOString() };
    return this.toSectionView(await this.repository.saveSection(next));
  }

  public async deleteSection(companyId: string, sectionId: string) {
    const section = await this.getTenantSection(companyId, sectionId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveSection({ ...section, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: sectionId };
  }

  public async reorderSections(companyId: string, items: Array<{ id: string; orderIndex: number }>) {
    const results = await Promise.all(
      items.map(async (item) => {
        const section = await this.getTenantSection(companyId, item.id);
        return this.toSectionView(
          await this.repository.saveSection({ ...section, orderIndex: item.orderIndex, updatedAt: new Date().toISOString() }),
        );
      }),
    );
    return results;
  }

  /* Questions */
  public async listQuestions(companyId: string, sectionId: string) {
    await this.getTenantSection(companyId, sectionId);
    const questions = await this.repository.listQuestions(sectionId);
    const section = await this.repository.findSectionById(sectionId);
    return questions.map((question) => this.toQuestionView(question, section?.checklistId));
  }

  public async createQuestion(companyId: string, sectionId: string, input: QuestionInput) {
    const section = await this.getTenantSection(companyId, sectionId);
    const now = new Date().toISOString();
    const question: ChecklistQuestionRecord = {
      id: randomUUID(),
      checklistId: section.checklistId,
      sectionId,
      questionText: input.questionText,
      questionType: input.questionType,
      required: input.required,
      configuration: input.configuration ?? null,
      orderIndex: input.orderIndex,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toQuestionView(await this.repository.saveQuestion(question));
  }

  public async updateQuestion(companyId: string, questionId: string, input: QuestionUpdateInput) {
    await this.getTenantQuestion(companyId, questionId);
    const patch: Parameters<ChecklistsRepository['patchQuestion']>[1] = {
      updatedAt: new Date().toISOString(),
    };
    if ('questionText' in input) patch.questionText = input.questionText;
    if ('questionType' in input) patch.questionType = input.questionType;
    if ('required' in input) patch.required = input.required;
    if ('orderIndex' in input) patch.orderIndex = input.orderIndex;
    if ('configuration' in input) patch.configuration = input.configuration ?? null;
    return this.toQuestionView(await this.repository.patchQuestion(questionId, patch));
  }

  public async deleteQuestion(companyId: string, questionId: string) {
    const question = await this.getTenantQuestion(companyId, questionId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveQuestion({ ...question, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: questionId };
  }

  public async reorderQuestions(companyId: string, items: Array<{ id: string; orderIndex: number; sectionId?: string | null }>) {
    const results = await Promise.all(
      items.map(async (item) => {
        const question = await this.getTenantQuestion(companyId, item.id);
        let sectionId = question.sectionId;
        if (item.sectionId !== undefined) {
          sectionId = item.sectionId;
          if (sectionId) {
            const section = await this.getTenantSection(companyId, sectionId);
            if (section.checklistId !== question.checklistId) {
              throw new AppError(400, 'BAD_REQUEST', 'Question cannot be moved to another checklist.');
            }
          }
        }
        return this.toQuestionView(
          await this.repository.saveQuestion({ ...question, sectionId, orderIndex: item.orderIndex, updatedAt: new Date().toISOString() }),
        );
      }),
    );
    return results;
  }

  /* Admin submissions / dashboard */
  public async adminListSubmissions(
    companyId: string,
    filters?: { checklistId?: string; userId?: string; status?: ChecklistSubmissionRecord['status'] },
  ) {
    const [submissions, checklists] = await Promise.all([
      this.repository.listSubmissions(companyId, filters),
      this.repository.listChecklists(companyId, { includeDeleted: true }),
    ]);
    const checklistById = new Map(checklists.map((checklist) => [checklist.id, checklist]));
    return submissions
      .filter((submission) => !filters?.status || submission.status === filters.status)
      .map((submission) => this.toSubmissionView(submission, checklistById.get(submission.checklistId)));
  }

  public async adminGetSubmission(companyId: string, submissionId: string) {
    const submission = await this.repository.findSubmissionById(submissionId);
    if (!submission || submission.companyId !== companyId || submission.deletedAt) {
      throw new AppError(404, 'NOT_FOUND', 'Submission not found.');
    }
    const [checklist, sections, questions, answers] = await Promise.all([
      this.repository.findChecklistById(companyId, submission.checklistId, { includeDeleted: true }),
      this.repository.listSections(submission.checklistId, { includeDeleted: true }),
      this.repository.listQuestionsByChecklistId(submission.checklistId, { includeDeleted: true }),
      this.repository.listAnswers(submission.id),
    ]);
    if (!checklist) throw new AppError(404, 'NOT_FOUND', 'Submission not found.');
    const submissionView = this.toSubmissionView(submission, checklist);
    const sectionViews = sections.map((section) => ({
      ...this.toSectionView(section),
      questions: questions
        .filter((question) => question.sectionId === section.id)
        .map((question) => this.toQuestionView(question)),
    }));
    return {
      ...submissionView,
      submission: submissionView,
      checklist: this.toChecklistView(checklist),
      sections: sectionViews,
      questions: questions.map((question) => this.toQuestionView(question)),
      answers: answers.map(this.toAnswerView),
    };
  }

  public async getDashboard(companyId: string) {
    const [checklists, historicalChecklists, submissions, actionPlans] = await Promise.all([
      this.repository.listChecklists(companyId),
      this.repository.listChecklists(companyId, { includeDeleted: true }),
      this.repository.listSubmissions(companyId),
      this.repository.listActionPlans(companyId),
    ]);
    const checklistById = new Map(historicalChecklists.map((checklist) => [checklist.id, checklist]));
    const submittedChecklistIds = new Set(submissions.map((submission) => submission.checklistId));
    const reportChecklists = historicalChecklists.filter((checklist) => submittedChecklistIds.has(checklist.id) || !checklist.deletedAt);
    const questionsByChecklist = await Promise.all(
      reportChecklists.map((checklist) =>
        this.repository.listQuestionsByChecklistId(checklist.id, { includeDeleted: submittedChecklistIds.has(checklist.id) }),
      ),
    );
    const questions = questionsByChecklist.flat();
    const answersBySubmission = await Promise.all(submissions.map((submission) => this.repository.listAnswers(submission.id)));
    const answers = answersBySubmission.flat();
    const submissionById = new Map(submissions.map((submission) => [submission.id, submission]));
    const questionById = new Map(questions.map((question) => [question.id, question]));
    const completed = submissions.filter((s) => s.status === 'COMPLETED');
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, s) => sum + (s.score ?? 0), 0) / completed.length)
      : 0;
    const questionViews = questions.map((question) => this.toQuestionView(question));
    const answerViews = answers.map((answer) => this.toAnswerView(answer));
    return {
      totalChecklists: checklists.length,
      totalSubmissions: submissions.length,
      totalCompleted: completed.length,
      completionRate: submissions.length > 0 ? Math.round((completed.length / submissions.length) * 100) : 0,
      avgScore,
      submissions: submissions.map((submission) => this.toSubmissionView(submission, checklistById.get(submission.checklistId))),
      answers: answerViews,
      questions: questionViews,
      detailedAnswers: answers.map((answer) => ({
        ...this.toAnswerView(answer),
        checklistSubmissions: submissionById.has(answer.submissionId)
          ? this.toSubmissionView(
              submissionById.get(answer.submissionId)!,
              checklistById.get(submissionById.get(answer.submissionId)!.checklistId),
            )
          : null,
        checklistQuestions: questionById.has(answer.questionId)
          ? this.toQuestionView(questionById.get(answer.questionId)!)
          : null,
      })),
      actionPlans: actionPlans.map(this.toActionPlanView),
    };
  }

  /* ======================== Private ======================== */

  private assertRequiredPhotosHaveAttachments(
    questions: ChecklistQuestionRecord[],
    answers: ChecklistAnswerRecord[],
  ) {
    const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));
    const missingPhotoQuestions = questions.filter((question) => {
      const config = this.toQuestionConfiguration(question.configuration);
      if (!config.photo_required) return false;
      if (question.questionType === 'DATE' || question.questionType === 'TIME') return false;
      const answer = answerByQuestionId.get(question.id);
      if (!this.shouldRequirePhoto(config, answer)) return false;
      return !answer?.attachmentUrls?.length;
    });

    if (missingPhotoQuestions.length > 0) {
      throw new AppError(400, 'BAD_REQUEST', 'Required photo evidence is missing.', {
        missingQuestionIds: missingPhotoQuestions.map((question) => question.id),
      });
    }
  }

  private toQuestionConfiguration(configuration: unknown): ChecklistQuestionConfiguration {
    if (!configuration || typeof configuration !== 'object' || Array.isArray(configuration)) return {};
    const value = configuration as Record<string, unknown>;
    const photoPolicy = value.photo_policy;
    return {
      photo_required: value.photo_required === true,
      photo_policy:
        photoPolicy === 'ALWAYS' || photoPolicy === 'NON_COMPLIANCE' || photoPolicy === 'OPTIONAL'
          ? photoPolicy
          : undefined,
    };
  }

  private shouldRequirePhoto(config: ChecklistQuestionConfiguration, answer: ChecklistAnswerRecord | undefined) {
    if (config.photo_policy === 'NON_COMPLIANCE') return answer?.value === 'NC' || answer?.conformity === 'NON_CONFORMING';
    return true;
  }

  private async getReadableChecklist(actor: AuthenticatedActor, checklistId: string) {
    const checklist = await this.getTenantChecklist(actor.companyId, checklistId);
    if (!(await this.access.canRead(actor, checklist))) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this checklist.');
    }
    return checklist;
  }

  private async getTenantChecklist(companyId: string, checklistId: string) {
    const checklist = await this.repository.findChecklistById(companyId, checklistId);
    if (!checklist) throw new AppError(404, 'NOT_FOUND', 'Checklist not found.');
    return checklist;
  }

  private async getTenantFolder(companyId: string, folderId: string) {
    const folder = await this.repository.findFolderById(companyId, folderId);
    if (!folder) throw new AppError(404, 'NOT_FOUND', 'Checklist folder not found.');
    return folder;
  }

  private async getTenantSection(companyId: string, sectionId: string) {
    const section = await this.repository.findSectionById(sectionId);
    if (!section) throw new AppError(404, 'NOT_FOUND', 'Checklist section not found.');
    // verify that the section belongs to a checklist in this tenant
    const checklist = await this.repository.findChecklistById(companyId, section.checklistId);
    if (!checklist) throw new AppError(404, 'NOT_FOUND', 'Checklist section not found.');
    return section;
  }

  private async getTenantQuestion(companyId: string, questionId: string) {
    const question = await this.repository.findQuestionById(questionId);
    if (!question) throw new AppError(404, 'NOT_FOUND', 'Checklist question not found.');
    // verify via section → checklist → tenant
    const checklist = await this.repository.findChecklistById(companyId, question.checklistId);
    if (!checklist) throw new AppError(404, 'NOT_FOUND', 'Checklist question not found.');
    return question;
  }

  private async getOwnedSubmission(actor: AuthenticatedActor, submissionId: string) {
    const submission = await this.repository.findSubmissionById(submissionId);
    if (!submission || submission.companyId !== actor.companyId || submission.deletedAt) {
      throw new AppError(404, 'NOT_FOUND', 'Submission not found.');
    }
    if (submission.userId !== actor.userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this submission.');
    }
    return submission;
  }

  private async getTenantActionPlan(companyId: string, actionPlanId: string) {
    const plan = await this.repository.findActionPlanById(companyId, actionPlanId);
    if (!plan) throw new AppError(404, 'NOT_FOUND', 'Action plan not found.');
    return plan;
  }

  /* ======================== View mappers ======================== */

  private toChecklistView(checklist: ChecklistRecord) {
    return {
      id: checklist.id,
      companyId: checklist.companyId,
      title: checklist.title,
      description: checklist.description,
      coverImage: checklist.coverImage,
      status: checklist.status,
      accessType: checklist.accessType,
      allowedUserIds: checklist.allowedUserIds,
      allowedRegionIds: checklist.allowedRegionIds,
      allowedStoreIds: checklist.allowedStoreIds,
      excludedUserIds: checklist.excludedUserIds,
      folderId: checklist.folderId,
      createdAt: checklist.createdAt,
      updatedAt: checklist.updatedAt,
    };
  }

  private toFolderView(folder: ChecklistFolderRecord) {
    return {
      id: folder.id,
      companyId: folder.companyId,
      name: folder.name,
      orderIndex: folder.orderIndex,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  private toSectionView(section: ChecklistSectionRecord) {
    return {
      id: section.id,
      checklistId: section.checklistId,
      title: section.title,
      orderIndex: section.orderIndex,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }

  private toQuestionView(question: ChecklistQuestionRecord, checklistId?: string) {
    return {
      id: question.id,
      checklistId: checklistId ?? question.checklistId,
      sectionId: question.sectionId,
      text: question.questionText,
      questionText: question.questionText,
      type: question.questionType,
      questionType: question.questionType,
      required: question.required,
      config: question.configuration,
      configuration: question.configuration,
      orderIndex: question.orderIndex,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  private toSubmissionView(submission: ChecklistSubmissionRecord, checklist?: ChecklistRecord | null) {
    return {
      id: submission.id,
      checklistId: submission.checklistId,
      companyId: submission.companyId,
      userId: submission.userId,
      orgUnitId: submission.orgUnitId,
      status: submission.status,
      score: submission.score,
      startedAt: submission.startedAt,
      completedAt: submission.completedAt,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      checklist: checklist ? { title: checklist.title } : null,
    };
  }

  private toAnswerView(answer: ChecklistAnswerRecord) {
    return {
      id: answer.id,
      submissionId: answer.submissionId,
      questionId: answer.questionId,
      value: answer.value ?? answer.textValue ?? answer.numericValue?.toString() ?? (answer.booleanValue === null ? null : String(answer.booleanValue)),
      textValue: answer.textValue,
      numericValue: answer.numericValue,
      booleanValue: answer.booleanValue,
      attachmentUrls: answer.attachmentUrls,
      photoUrls: answer.attachmentUrls,
      conformity: answer.conformity,
      notes: answer.notes,
      note: answer.notes,
      answeredAt: answer.answeredAt,
      createdAt: answer.answeredAt,
      updatedAt: answer.answeredAt,
    };
  }

  private toActionPlanView(plan: ActionPlanRecord) {
    return {
      id: plan.id,
      companyId: plan.companyId,
      submissionId: plan.submissionId,
      answerId: plan.answerId,
      checklistId: plan.checklistId,
      title: plan.title,
      description: plan.description,
      status: plan.status,
      priority: plan.priority,
      assigneeUserId: plan.assigneeUserId,
      dueDate: plan.dueDate,
      completedAt: plan.completedAt,
      createdByUserId: plan.createdByUserId,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      questionId: plan.answerId,
      actionPlan: plan.description,
      actionPlanStatus: plan.status === 'DONE' ? 'RESOLVED' : 'PENDING',
      assignedUserId: plan.assigneeUserId,
      actionPlanDueDate: plan.dueDate,
      actionPlanCreatedBy: plan.createdByUserId,
    };
  }
}
