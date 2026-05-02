export const checklistStatusValues = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;
export const checklistAccessTypeValues = ['ALL', 'RESTRICTED'] as const;
export const checklistQuestionTypeValues = [
  'COMPLIANCE',
  'YES_NO',
  'MULTIPLE_CHOICE',
  'TEXT',
  'NUMBER',
  'PHOTO',
  'SIGNATURE',
  'DATE',
  'TIME',
  'RATING',
  'CHECK',
  'CHECKLIST_ITEM',
] as const;
export const submissionStatusValues = ['IN_PROGRESS', 'COMPLETED'] as const;
export const actionPlanStatusValues = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export const actionPlanPriorityValues = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type ChecklistStatus = (typeof checklistStatusValues)[number];
export type ChecklistAccessType = (typeof checklistAccessTypeValues)[number];
export type ChecklistQuestionType = (typeof checklistQuestionTypeValues)[number];
export type SubmissionStatus = (typeof submissionStatusValues)[number];
export type ActionPlanStatus = (typeof actionPlanStatusValues)[number];
export type ActionPlanPriority = (typeof actionPlanPriorityValues)[number];

export interface ChecklistRecord {
  id: string;
  companyId: string;
  title: string;
  description: string;
  coverImage: string | null;
  status: ChecklistStatus;
  accessType: ChecklistAccessType;
  allowedUserIds: string[];
  allowedRegionIds: string[];
  allowedStoreIds: string[];
  excludedUserIds: string[];
  folderId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistFolderRecord {
  id: string;
  companyId: string;
  name: string;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSectionRecord {
  id: string;
  checklistId: string;
  title: string;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistQuestionRecord {
  id: string;
  checklistId: string;
  sectionId: string | null;
  questionText: string;
  questionType: ChecklistQuestionType;
  required: boolean;
  configuration: unknown | null;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistSubmissionRecord {
  id: string;
  checklistId: string;
  companyId: string;
  userId: string;
  orgUnitId: string | null;
  status: SubmissionStatus;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistAnswerRecord {
  id: string;
  submissionId: string;
  questionId: string;
  value: unknown | null;
  textValue: string | null;
  numericValue: number | null;
  booleanValue: boolean | null;
  attachmentUrls: string[];
  conformity: 'CONFORMING' | 'NON_CONFORMING' | 'NOT_APPLICABLE' | null;
  notes: string | null;
  answeredAt: string;
}

export interface ActionPlanRecord {
  id: string;
  companyId: string;
  submissionId: string | null;
  answerId: string | null;
  checklistId: string | null;
  title: string;
  description: string;
  status: ActionPlanStatus;
  priority: ActionPlanPriority;
  assigneeUserId: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdByUserId: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
