import type {
  ActionPlanRecord,
  ChecklistAnswerRecord,
  ChecklistFolderRecord,
  ChecklistQuestionRecord,
  ChecklistRecord,
  ChecklistSectionRecord,
  ChecklistSubmissionRecord,
} from '../../modules/checklists/contracts/checklists.types.js';
import type { ChecklistQuestionPatch, ChecklistsRepository } from '../contracts/checklists.repository.js';
import { SupabaseRestError, type SupabaseRestClient } from './supabase-rest-client.js';
import {
  ACTION_PLAN_SELECT,
  CHECKLIST_ANSWER_SELECT,
  CHECKLIST_FOLDER_SELECT,
  CHECKLIST_QUESTION_SELECT,
  CHECKLIST_QUESTION_COMPAT_SELECT,
  CHECKLIST_QUESTION_LEGACY_SELECT,
  CHECKLIST_SECTION_SELECT,
  CHECKLIST_SELECT,
  CHECKLIST_SUBMISSION_SELECT,
  type ActionPlanRow,
  type ChecklistAnswerRow,
  type ChecklistFolderRow,
  type ChecklistQuestionColumnMode,
  type ChecklistQuestionRow,
  type ChecklistRow,
  type ChecklistSectionRow,
  type ChecklistSubmissionRow,
  fromActionPlanRecord,
  fromChecklistAnswerRecord,
  fromChecklistFolderRecord,
  fromChecklistQuestionPatch,
  fromChecklistQuestionRecord,
  fromChecklistRecord,
  fromChecklistSectionRecord,
  fromChecklistSubmissionRecord,
  toActionPlanRecord,
  toChecklistAnswerRecord,
  toChecklistFolderRecord,
  toChecklistQuestionRecord,
  toChecklistRecord,
  toChecklistSectionRecord,
  toChecklistSubmissionRecord,
} from './supabase-row-mappers.js';

export class SupabaseChecklistsRepository implements ChecklistsRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  /* Checklists */
  public async listChecklists(companyId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistRecord[]> {
    const filters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'company_id', operator: 'eq', value: companyId },
    ];
    if (!options?.includeDeleted) filters.push({ column: 'deleted_at', operator: 'is', value: null });
    const result = await this.client.select<ChecklistRow>('checklists', {
      select: CHECKLIST_SELECT,
      filters,
      order: [{ column: 'created_at', ascending: false }],
    });
    return result.rows.map(toChecklistRecord);
  }

  public async findChecklistById(companyId: string, checklistId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistRecord | null> {
    const filters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'id', operator: 'eq', value: checklistId },
      { column: 'company_id', operator: 'eq', value: companyId },
    ];
    if (!options?.includeDeleted) filters.push({ column: 'deleted_at', operator: 'is', value: null });
    const row = await this.client.selectOne<ChecklistRow>('checklists', {
      select: CHECKLIST_SELECT,
      filters,
    });
    return row ? toChecklistRecord(row) : null;
  }

  public async saveChecklist(checklist: ChecklistRecord): Promise<ChecklistRecord> {
    const row = await this.client.upsert<ChecklistRow>('checklists', fromChecklistRecord(checklist), {
      select: CHECKLIST_SELECT,
    });
    return toChecklistRecord(row);
  }

  /* Folders */
  public async listFolders(companyId: string): Promise<ChecklistFolderRecord[]> {
    const result = await this.client.select<ChecklistFolderRow>('checklist_folders', {
      select: CHECKLIST_FOLDER_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'order_index', ascending: true }],
    });
    return result.rows.map(toChecklistFolderRecord);
  }

  public async findFolderById(companyId: string, folderId: string): Promise<ChecklistFolderRecord | null> {
    const row = await this.client.selectOne<ChecklistFolderRow>('checklist_folders', {
      select: CHECKLIST_FOLDER_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: folderId },
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toChecklistFolderRecord(row) : null;
  }

  public async saveFolder(folder: ChecklistFolderRecord): Promise<ChecklistFolderRecord> {
    const row = await this.client.upsert<ChecklistFolderRow>('checklist_folders', fromChecklistFolderRecord(folder), {
      select: CHECKLIST_FOLDER_SELECT,
    });
    return toChecklistFolderRecord(row);
  }

  /* Sections */
  public async listSections(checklistId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistSectionRecord[]> {
    const filters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'checklist_id', operator: 'eq', value: checklistId },
    ];
    if (!options?.includeDeleted) filters.push({ column: 'deleted_at', operator: 'is', value: null });
    const result = await this.client.select<ChecklistSectionRow>('checklist_sections', {
      select: CHECKLIST_SECTION_SELECT,
      filters,
      order: [{ column: 'order_index', ascending: true }],
    });
    return result.rows.map(toChecklistSectionRecord);
  }

  public async findSectionById(sectionId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistSectionRecord | null> {
    const filters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'id', operator: 'eq', value: sectionId },
    ];
    if (!options?.includeDeleted) filters.push({ column: 'deleted_at', operator: 'is', value: null });
    const row = await this.client.selectOne<ChecklistSectionRow>('checklist_sections', {
      select: CHECKLIST_SECTION_SELECT,
      filters,
    });
    return row ? toChecklistSectionRecord(row) : null;
  }

  public async saveSection(section: ChecklistSectionRecord): Promise<ChecklistSectionRecord> {
    const row = await this.client.upsert<ChecklistSectionRow>('checklist_sections', fromChecklistSectionRecord(section), {
      select: CHECKLIST_SECTION_SELECT,
    });
    return toChecklistSectionRecord(row);
  }

  /* Questions */
  public async listQuestions(sectionId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistQuestionRecord[]> {
    const filters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'section_id', operator: 'eq', value: sectionId },
    ];
    if (!options?.includeDeleted) filters.push({ column: 'deleted_at', operator: 'is', value: null });
    const result = await this.selectChecklistQuestions({
      filters,
      order: [{ column: 'order_index', ascending: true }],
    });
    return result.rows.map(toChecklistQuestionRecord);
  }

  public async listQuestionsByChecklistId(checklistId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistQuestionRecord[]> {
    const filters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'checklist_id', operator: 'eq', value: checklistId },
    ];
    if (!options?.includeDeleted) filters.push({ column: 'deleted_at', operator: 'is', value: null });
    const result = await this.selectChecklistQuestions({
      filters,
      order: [{ column: 'order_index', ascending: true }],
    });
    return result.rows.map(toChecklistQuestionRecord);
  }

  public async findQuestionById(questionId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistQuestionRecord | null> {
    const filters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'id', operator: 'eq', value: questionId },
    ];
    if (!options?.includeDeleted) filters.push({ column: 'deleted_at', operator: 'is', value: null });
    const row = await this.selectOneChecklistQuestion({
      filters,
    });
    return row ? toChecklistQuestionRecord(row) : null;
  }

  public async saveQuestion(question: ChecklistQuestionRecord): Promise<ChecklistQuestionRecord> {
    const row = await this.writeChecklistQuestion((mode) => this.client.upsert<ChecklistQuestionRow>('checklist_questions', fromChecklistQuestionRecord(question, mode), {
      select: this.checklistQuestionSelect(mode),
    }));
    return toChecklistQuestionRecord(row);
  }

  public async patchQuestion(questionId: string, patch: ChecklistQuestionPatch): Promise<ChecklistQuestionRecord> {
    const row = await this.writeChecklistQuestion((mode) => this.client.update<ChecklistQuestionRow>('checklist_questions', fromChecklistQuestionPatch(patch, mode), {
      select: this.checklistQuestionSelect(mode),
      filters: [{ column: 'id', operator: 'eq', value: questionId }],
    }));
    return toChecklistQuestionRecord(row);
  }

  private async selectChecklistQuestions(options: Omit<Parameters<SupabaseRestClient['select']>[1], 'select'>) {
    return this.withChecklistQuestionColumns((mode) => this.client.select<ChecklistQuestionRow>('checklist_questions', {
      ...options,
      select: this.checklistQuestionSelect(mode),
    }));
  }

  private async selectOneChecklistQuestion(options: Omit<Parameters<SupabaseRestClient['selectOne']>[1], 'select'>) {
    return this.withChecklistQuestionColumns((mode) => this.client.selectOne<ChecklistQuestionRow>('checklist_questions', {
      ...options,
      select: this.checklistQuestionSelect(mode),
    }));
  }

  private async writeChecklistQuestion(operation: (mode: ChecklistQuestionColumnMode) => Promise<ChecklistQuestionRow>) {
    return this.withChecklistQuestionColumns(operation);
  }

  private async withChecklistQuestionColumns<T>(operation: (mode: ChecklistQuestionColumnMode) => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (const mode of ['compatible', 'modern', 'legacy'] as const) {
      try {
        return await operation(mode);
      } catch (error) {
        if (!isChecklistQuestionColumnCompatibilityError(error)) throw error;
        lastError = error;
      }
    }
    throw lastError;
  }

  private checklistQuestionSelect(mode: ChecklistQuestionColumnMode): string {
    if (mode === 'compatible') return CHECKLIST_QUESTION_COMPAT_SELECT;
    if (mode === 'legacy') return CHECKLIST_QUESTION_LEGACY_SELECT;
    return CHECKLIST_QUESTION_SELECT;
  }

  /* Submissions */
  public async listSubmissions(companyId: string, filters?: { checklistId?: string; userId?: string }): Promise<ChecklistSubmissionRecord[]> {
    const queryFilters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'deleted_at', operator: 'is', value: null },
    ];
    if (filters?.checklistId) queryFilters.push({ column: 'checklist_id', operator: 'eq', value: filters.checklistId });
    if (filters?.userId) queryFilters.push({ column: 'user_id', operator: 'eq', value: filters.userId });
    const result = await this.client.select<ChecklistSubmissionRow>('checklist_submissions', {
      select: CHECKLIST_SUBMISSION_SELECT,
      filters: queryFilters,
      order: [{ column: 'created_at', ascending: false }],
    });
    return result.rows.map(toChecklistSubmissionRecord);
  }

  public async findSubmissionById(submissionId: string): Promise<ChecklistSubmissionRecord | null> {
    const row = await this.client.selectOne<ChecklistSubmissionRow>('checklist_submissions', {
      select: CHECKLIST_SUBMISSION_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: submissionId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toChecklistSubmissionRecord(row) : null;
  }

  public async saveSubmission(submission: ChecklistSubmissionRecord): Promise<ChecklistSubmissionRecord> {
    const row = await this.client.upsert<ChecklistSubmissionRow>('checklist_submissions', fromChecklistSubmissionRecord(submission), {
      select: CHECKLIST_SUBMISSION_SELECT,
    });
    return toChecklistSubmissionRecord(row);
  }

  /* Answers */
  public async listAnswers(submissionId: string): Promise<ChecklistAnswerRecord[]> {
    const result = await this.client.select<ChecklistAnswerRow>('checklist_answers', {
      select: CHECKLIST_ANSWER_SELECT,
      filters: [{ column: 'submission_id', operator: 'eq', value: submissionId }],
    });
    return result.rows.map(toChecklistAnswerRecord);
  }

  public async findAnswer(submissionId: string, questionId: string): Promise<ChecklistAnswerRecord | null> {
    const row = await this.client.selectOne<ChecklistAnswerRow>('checklist_answers', {
      select: CHECKLIST_ANSWER_SELECT,
      filters: [
        { column: 'submission_id', operator: 'eq', value: submissionId },
        { column: 'question_id', operator: 'eq', value: questionId },
      ],
    });
    return row ? toChecklistAnswerRecord(row) : null;
  }

  public async saveAnswer(answer: ChecklistAnswerRecord): Promise<ChecklistAnswerRecord> {
    const row = await this.client.upsert<ChecklistAnswerRow>('checklist_answers', fromChecklistAnswerRecord(answer), {
      select: CHECKLIST_ANSWER_SELECT,
    });
    return toChecklistAnswerRecord(row);
  }

  /* Action Plans */
  public async listActionPlans(companyId: string, filters?: { submissionId?: string; assigneeUserId?: string }): Promise<ActionPlanRecord[]> {
    const queryFilters: Array<{ column: string; operator: 'eq' | 'is'; value: string | null }> = [
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'deleted_at', operator: 'is', value: null },
    ];
    if (filters?.submissionId) queryFilters.push({ column: 'submission_id', operator: 'eq', value: filters.submissionId });
    if (filters?.assigneeUserId) queryFilters.push({ column: 'assignee_user_id', operator: 'eq', value: filters.assigneeUserId });
    const result = await this.client.select<ActionPlanRow>('action_plans', {
      select: ACTION_PLAN_SELECT,
      filters: queryFilters,
      order: [{ column: 'created_at', ascending: false }],
    });
    return result.rows.map(toActionPlanRecord);
  }

  public async findActionPlanById(companyId: string, actionPlanId: string): Promise<ActionPlanRecord | null> {
    const row = await this.client.selectOne<ActionPlanRow>('action_plans', {
      select: ACTION_PLAN_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: actionPlanId },
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toActionPlanRecord(row) : null;
  }

  public async saveActionPlan(plan: ActionPlanRecord): Promise<ActionPlanRecord> {
    const row = await this.client.upsert<ActionPlanRow>('action_plans', fromActionPlanRecord(plan), {
      select: ACTION_PLAN_SELECT,
    });
    return toActionPlanRecord(row);
  }
}

function isChecklistQuestionColumnCompatibilityError(error: unknown): boolean {
  if (!(error instanceof SupabaseRestError)) return false;
  if (error.status !== 400) return false;
  const body = JSON.stringify(error.body).toLowerCase();
  return (
    body.includes('checklist_questions') &&
    (body.includes('column') || body.includes('schema cache') || body.includes('pgrst204')) &&
    (body.includes('text') ||
      body.includes('type') ||
      body.includes('config') ||
      body.includes('question_text') ||
      body.includes('question_type') ||
      body.includes('configuration'))
  );
}
