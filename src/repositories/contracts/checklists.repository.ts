import type {
  ActionPlanRecord,
  ChecklistAnswerRecord,
  ChecklistFolderRecord,
  ChecklistQuestionRecord,
  ChecklistRecord,
  ChecklistSectionRecord,
  ChecklistSubmissionRecord,
} from '../../modules/checklists/contracts/checklists.types.js';

export interface IncludeDeletedOptions {
  includeDeleted?: boolean;
}

export interface PaginatedListOptions {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedListResult<T> {
  items: T[];
  total: number;
}

export interface ChecklistListFilters extends IncludeDeletedOptions, PaginatedListOptions {
  status?: ChecklistRecord['status'] | 'ALL';
}

export interface SubmissionListFilters extends PaginatedListOptions {
  checklistId?: string;
  userId?: string;
  status?: ChecklistSubmissionRecord['status'];
}

export type ChecklistQuestionPatch = Partial<
  Pick<
    ChecklistQuestionRecord,
    | 'sectionId'
    | 'questionText'
    | 'questionType'
    | 'required'
    | 'configuration'
    | 'orderIndex'
    | 'deletedAt'
  >
> & {
  updatedAt: string;
};

export interface ChecklistsRepository {
  /* Checklists */
  listChecklists(companyId: string, options?: IncludeDeletedOptions): Promise<ChecklistRecord[]>;
  listChecklistsPaginated(companyId: string, filters: ChecklistListFilters): Promise<PaginatedListResult<ChecklistRecord>>;
  findChecklistById(companyId: string, checklistId: string, options?: IncludeDeletedOptions): Promise<ChecklistRecord | null>;
  saveChecklist(checklist: ChecklistRecord): Promise<ChecklistRecord>;

  /* Folders */
  listFolders(companyId: string): Promise<ChecklistFolderRecord[]>;
  findFolderById(companyId: string, folderId: string): Promise<ChecklistFolderRecord | null>;
  saveFolder(folder: ChecklistFolderRecord): Promise<ChecklistFolderRecord>;

  /* Sections */
  listSections(checklistId: string, options?: IncludeDeletedOptions): Promise<ChecklistSectionRecord[]>;
  findSectionById(sectionId: string, options?: IncludeDeletedOptions): Promise<ChecklistSectionRecord | null>;
  saveSection(section: ChecklistSectionRecord): Promise<ChecklistSectionRecord>;

  /* Questions */
  listQuestions(sectionId: string, options?: IncludeDeletedOptions): Promise<ChecklistQuestionRecord[]>;
  listQuestionsByChecklistId(checklistId: string, options?: IncludeDeletedOptions): Promise<ChecklistQuestionRecord[]>;
  findQuestionById(questionId: string, options?: IncludeDeletedOptions): Promise<ChecklistQuestionRecord | null>;
  saveQuestion(question: ChecklistQuestionRecord): Promise<ChecklistQuestionRecord>;
  patchQuestion(questionId: string, patch: ChecklistQuestionPatch): Promise<ChecklistQuestionRecord>;

  /* Submissions */
  listSubmissions(companyId: string, filters?: { checklistId?: string; userId?: string }): Promise<ChecklistSubmissionRecord[]>;
  listSubmissionsPaginated(companyId: string, filters: SubmissionListFilters): Promise<PaginatedListResult<ChecklistSubmissionRecord>>;
  findSubmissionById(submissionId: string): Promise<ChecklistSubmissionRecord | null>;
  saveSubmission(submission: ChecklistSubmissionRecord): Promise<ChecklistSubmissionRecord>;

  /* Answers */
  listAnswers(submissionId: string): Promise<ChecklistAnswerRecord[]>;
  findAnswer(submissionId: string, questionId: string): Promise<ChecklistAnswerRecord | null>;
  saveAnswer(answer: ChecklistAnswerRecord): Promise<ChecklistAnswerRecord>;

  /* Action Plans */
  listActionPlans(companyId: string, filters?: { submissionId?: string; assigneeUserId?: string }): Promise<ActionPlanRecord[]>;
  findActionPlanById(companyId: string, actionPlanId: string): Promise<ActionPlanRecord | null>;
  saveActionPlan(plan: ActionPlanRecord): Promise<ActionPlanRecord>;
}
