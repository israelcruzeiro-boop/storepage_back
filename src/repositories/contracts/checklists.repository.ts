import type {
  ActionPlanRecord,
  ChecklistAnswerRecord,
  ChecklistFolderRecord,
  ChecklistQuestionRecord,
  ChecklistRecord,
  ChecklistSectionRecord,
  ChecklistSubmissionRecord,
} from '../../modules/checklists/contracts/checklists.types.js';

export interface ChecklistsRepository {
  /* Checklists */
  listChecklists(companyId: string): Promise<ChecklistRecord[]>;
  findChecklistById(companyId: string, checklistId: string): Promise<ChecklistRecord | null>;
  saveChecklist(checklist: ChecklistRecord): Promise<ChecklistRecord>;

  /* Folders */
  listFolders(companyId: string): Promise<ChecklistFolderRecord[]>;
  findFolderById(companyId: string, folderId: string): Promise<ChecklistFolderRecord | null>;
  saveFolder(folder: ChecklistFolderRecord): Promise<ChecklistFolderRecord>;

  /* Sections */
  listSections(checklistId: string): Promise<ChecklistSectionRecord[]>;
  findSectionById(sectionId: string): Promise<ChecklistSectionRecord | null>;
  saveSection(section: ChecklistSectionRecord): Promise<ChecklistSectionRecord>;

  /* Questions */
  listQuestions(sectionId: string): Promise<ChecklistQuestionRecord[]>;
  listQuestionsByChecklistId(checklistId: string): Promise<ChecklistQuestionRecord[]>;
  findQuestionById(questionId: string): Promise<ChecklistQuestionRecord | null>;
  saveQuestion(question: ChecklistQuestionRecord): Promise<ChecklistQuestionRecord>;

  /* Submissions */
  listSubmissions(companyId: string, filters?: { checklistId?: string; userId?: string }): Promise<ChecklistSubmissionRecord[]>;
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
