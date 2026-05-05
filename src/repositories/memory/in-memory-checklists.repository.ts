import type {
  ActionPlanRecord,
  ChecklistAnswerRecord,
  ChecklistFolderRecord,
  ChecklistQuestionRecord,
  ChecklistRecord,
  ChecklistSectionRecord,
  ChecklistSubmissionRecord,
} from '../../modules/checklists/contracts/checklists.types.js';
import type { ChecklistListFilters, ChecklistQuestionPatch, ChecklistsRepository, SubmissionListFilters } from '../contracts/checklists.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

export class InMemoryChecklistsRepository implements ChecklistsRepository {
  public constructor(private readonly store: InMemoryStore) {}

  /* Checklists */
  public async listChecklists(companyId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistRecord[]> {
    return this.store
      .listChecklists()
      .filter((c) => c.companyId === companyId && (options?.includeDeleted || !c.deletedAt));
  }

  public async listChecklistsPaginated(companyId: string, filters: ChecklistListFilters) {
    const search = filters.search?.trim().toLowerCase();
    const filtered = this.store
      .listChecklists()
      .filter((checklist) => checklist.companyId === companyId && (filters.includeDeleted || !checklist.deletedAt))
      .filter((checklist) => !filters.status || filters.status === 'ALL' || checklist.status === filters.status)
      .filter((checklist) => {
        if (!search) return true;
        return [checklist.title, checklist.description ?? ''].some((value) => value.toLowerCase().includes(search));
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const offset = (filters.page - 1) * filters.limit;
    return {
      items: filtered.slice(offset, offset + filters.limit),
      total: filtered.length,
    };
  }

  public async findChecklistById(companyId: string, checklistId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistRecord | null> {
    const record = this.store.getChecklist(checklistId);
    if (!record || record.companyId !== companyId || (!options?.includeDeleted && record.deletedAt)) return null;
    return record;
  }

  public async saveChecklist(checklist: ChecklistRecord): Promise<ChecklistRecord> {
    return this.store.setChecklist(checklist);
  }

  /* Folders */
  public async listFolders(companyId: string): Promise<ChecklistFolderRecord[]> {
    return this.store
      .listChecklistFolders()
      .filter((f) => f.companyId === companyId && !f.deletedAt);
  }

  public async findFolderById(companyId: string, folderId: string): Promise<ChecklistFolderRecord | null> {
    const record = this.store.getChecklistFolder(folderId);
    if (!record || record.companyId !== companyId || record.deletedAt) return null;
    return record;
  }

  public async saveFolder(folder: ChecklistFolderRecord): Promise<ChecklistFolderRecord> {
    return this.store.setChecklistFolder(folder);
  }

  /* Sections */
  public async listSections(checklistId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistSectionRecord[]> {
    return this.store
      .listChecklistSections()
      .filter((s) => s.checklistId === checklistId && (options?.includeDeleted || !s.deletedAt))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async findSectionById(sectionId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistSectionRecord | null> {
    const record = this.store.getChecklistSection(sectionId);
    if (!record || (!options?.includeDeleted && record.deletedAt)) return null;
    return record;
  }

  public async saveSection(section: ChecklistSectionRecord): Promise<ChecklistSectionRecord> {
    return this.store.setChecklistSection(section);
  }

  /* Questions */
  public async listQuestions(sectionId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistQuestionRecord[]> {
    return this.store
      .listChecklistQuestions()
      .filter((q) => q.sectionId === sectionId && (options?.includeDeleted || !q.deletedAt))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async listQuestionsByChecklistId(checklistId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistQuestionRecord[]> {
    return this.store
      .listChecklistQuestions()
      .filter((q) => q.checklistId === checklistId && (options?.includeDeleted || !q.deletedAt))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async findQuestionById(questionId: string, options?: { includeDeleted?: boolean }): Promise<ChecklistQuestionRecord | null> {
    const record = this.store.getChecklistQuestion(questionId);
    if (!record || (!options?.includeDeleted && record.deletedAt)) return null;
    return record;
  }

  public async saveQuestion(question: ChecklistQuestionRecord): Promise<ChecklistQuestionRecord> {
    return this.store.setChecklistQuestion(question);
  }

  public async patchQuestion(questionId: string, patch: ChecklistQuestionPatch): Promise<ChecklistQuestionRecord> {
    const question = this.store.getChecklistQuestion(questionId);
    if (!question) {
      throw new Error(`Checklist question ${questionId} not found.`);
    }
    return this.store.setChecklistQuestion({ ...question, ...patch });
  }

  /* Submissions */
  public async listSubmissions(companyId: string, filters?: { checklistId?: string; userId?: string }): Promise<ChecklistSubmissionRecord[]> {
    return this.store
      .listChecklistSubmissions()
      .filter((s) => {
        if (s.companyId !== companyId || s.deletedAt) return false;
        if (filters?.checklistId && s.checklistId !== filters.checklistId) return false;
        if (filters?.userId && s.userId !== filters.userId) return false;
        return true;
      });
  }

  public async listSubmissionsPaginated(companyId: string, filters: SubmissionListFilters) {
    const search = filters.search?.trim().toLowerCase();
    const checklistById = new Map(this.store.listChecklists().map((checklist) => [checklist.id, checklist]));
    const filtered = this.store
      .listChecklistSubmissions()
      .filter((submission) => {
        if (submission.companyId !== companyId || submission.deletedAt) return false;
        if (filters.checklistId && submission.checklistId !== filters.checklistId) return false;
        if (filters.userId && submission.userId !== filters.userId) return false;
        if (filters.status && submission.status !== filters.status) return false;
        if (!search) return true;
        const checklist = checklistById.get(submission.checklistId);
        return [submission.id, checklist?.title ?? ''].some((value) => value.toLowerCase().includes(search));
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const offset = (filters.page - 1) * filters.limit;
    return {
      items: filtered.slice(offset, offset + filters.limit),
      total: filtered.length,
    };
  }

  public async findSubmissionById(submissionId: string): Promise<ChecklistSubmissionRecord | null> {
    const record = this.store.getChecklistSubmission(submissionId);
    if (!record || record.deletedAt) return null;
    return record;
  }

  public async saveSubmission(submission: ChecklistSubmissionRecord): Promise<ChecklistSubmissionRecord> {
    return this.store.setChecklistSubmission(submission);
  }

  /* Answers */
  public async listAnswers(submissionId: string): Promise<ChecklistAnswerRecord[]> {
    return this.store
      .listChecklistAnswers()
      .filter((a) => a.submissionId === submissionId);
  }

  public async findAnswer(submissionId: string, questionId: string): Promise<ChecklistAnswerRecord | null> {
    return (
      this.store
        .listChecklistAnswers()
        .find((a) => a.submissionId === submissionId && a.questionId === questionId) ?? null
    );
  }

  public async saveAnswer(answer: ChecklistAnswerRecord): Promise<ChecklistAnswerRecord> {
    return this.store.setChecklistAnswer(answer);
  }

  /* Action Plans */
  public async listActionPlans(companyId: string, filters?: { submissionId?: string; assigneeUserId?: string }): Promise<ActionPlanRecord[]> {
    return this.store
      .listActionPlans()
      .filter((p) => {
        if (p.companyId !== companyId || p.deletedAt) return false;
        if (filters?.submissionId && p.submissionId !== filters.submissionId) return false;
        if (filters?.assigneeUserId && p.assigneeUserId !== filters.assigneeUserId) return false;
        return true;
      });
  }

  public async findActionPlanById(companyId: string, actionPlanId: string): Promise<ActionPlanRecord | null> {
    const record = this.store.getActionPlan(actionPlanId);
    if (!record || record.companyId !== companyId || record.deletedAt) return null;
    return record;
  }

  public async saveActionPlan(plan: ActionPlanRecord): Promise<ActionPlanRecord> {
    return this.store.setActionPlan(plan);
  }
}
