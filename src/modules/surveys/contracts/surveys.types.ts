export type SurveyStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type SurveyAccessType = 'ALL' | 'RESTRICTED';
export type SurveyQuestionType =
  | 'SHORT_TEXT'
  | 'LONG_TEXT'
  | 'SINGLE_CHOICE'
  | 'MULTIPLE_CHOICE'
  | 'RATING'
  | 'NPS'
  | 'DATE'
  | 'NUMBER'
  | 'YES_NO';

export interface SurveyRecord {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  status: SurveyStatus;
  accessType: SurveyAccessType;
  allowedUserIds: string[];
  allowedRegionIds: string[];
  allowedStoreIds: string[];
  excludedUserIds: string[];
  allowMultipleResponses: boolean;
  anonymous: boolean;
  startsAt: string | null;
  endsAt: string | null;
  coverImage: string | null;
  createdBy: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyQuestionRecord {
  id: string;
  surveyId: string;
  questionText: string;
  description: string | null;
  questionType: SurveyQuestionType;
  configuration: unknown;
  required: boolean;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyResponseRecord {
  id: string;
  surveyId: string;
  companyId: string;
  userId: string | null;
  orgUnitId: string | null;
  orgTopLevelId: string | null;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SurveyAnswerRecord {
  id: string;
  responseId: string;
  questionId: string;
  value: unknown;
  createdAt: string;
}
