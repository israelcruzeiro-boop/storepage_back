import type {
  ActionPlanRecord,
  ChecklistAnswerRecord,
  ChecklistFolderRecord,
  ChecklistQuestionRecord,
  ChecklistRecord,
  ChecklistSectionRecord,
  ChecklistSubmissionRecord,
} from '../../modules/checklists/contracts/checklists.types.js';
import type { ChecklistsRepository } from '../contracts/checklists.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

export class InMemoryChecklistsRepository implements ChecklistsRepository {
  public constructor(private readonly store: InMemoryStore) {}

  /* Checklists */
  public async listChecklists(companyId: string): Promise<ChecklistRecord[]> {
    return this.store
      .listChecklists()
      .filter((c) => c.companyId === companyId && !c.deletedAt);
  }

  public async findChecklistById(companyId: string, checklistId: string): Promise<ChecklistRecord | null> {
    const record = this.store.getChecklist(checklistId);
    if (!record || record.companyId !== companyId || record.deletedAt) return null;
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
  public async listSections(checklistId: string): Promise<ChecklistSectionRecord[]> {
    return this.store
      .listChecklistSections()
      .filter((s) => s.checklistId === checklistId && !s.deletedAt)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async findSectionById(sectionId: string): Promise<ChecklistSectionRecord | null> {
    const record = this.store.getChecklistSection(sectionId);
    if (!record || record.deletedAt) return null;
    return record;
  }

  public async saveSection(section: ChecklistSectionRecord): Promise<ChecklistSectionRecord> {
    return this.store.setChecklistSection(section);
  }

  /* Questions */
  public async listQuestions(sectionId: string): Promise<ChecklistQuestionRecord[]> {
    return this.store
      .listChecklistQuestions()
      .filter((q) => q.sectionId === sectionId && !q.deletedAt)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async listQuestionsByChecklistId(checklistId: string): Promise<ChecklistQuestionRecord[]> {
    const sections = await this.listSections(checklistId);
    const sectionIds = new Set(sections.map((s) => s.id));
    return this.store
      .listChecklistQuestions()
      .filter((q) => sectionIds.has(q.sectionId) && !q.deletedAt)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async findQuestionById(questionId: string): Promise<ChecklistQuestionRecord | null> {
    const record = this.store.getChecklistQuestion(questionId);
    if (!record || record.deletedAt) return null;
    return record;
  }

  public async saveQuestion(question: ChecklistQuestionRecord): Promise<ChecklistQuestionRecord> {
    return this.store.setChecklistQuestion(question);
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
