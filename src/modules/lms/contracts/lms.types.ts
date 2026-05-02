export const courseStatusValues = ['ACTIVE', 'DRAFT', 'ARCHIVED'] as const;
export const courseAccessTypeValues = ['ALL', 'RESTRICTED'] as const;
export const courseLayoutTemplateValues = ['focus', 'studio', 'journey'] as const;
export const courseContentTypeValues = ['PDF', 'IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT', 'HTML'] as const;
export const courseQuestionTypeValues = ['MULTIPLE_CHOICE', 'WORD_SEARCH', 'ORDERING', 'HOTSPOT', 'FILE', 'HANGMAN', 'TEXT'] as const;
export const courseEnrollmentStatusValues = ['IN_PROGRESS', 'COMPLETED', 'DROPPED'] as const;

export type CourseStatus = (typeof courseStatusValues)[number];
export type CourseAccessType = (typeof courseAccessTypeValues)[number];
export type CourseLayoutTemplate = (typeof courseLayoutTemplateValues)[number];
export type CourseContentType = (typeof courseContentTypeValues)[number];
export type CourseQuestionType = (typeof courseQuestionTypeValues)[number];
export type CourseEnrollmentStatus = (typeof courseEnrollmentStatusValues)[number];

export interface CourseRecord {
  id: string;
  companyId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  coverImage: string | null;
  imageUrl: string | null;
  status: CourseStatus;
  accessType: CourseAccessType;
  allowedUserIds: string[];
  allowedRegionIds: string[];
  allowedStoreIds: string[];
  excludedUserIds: string[];
  targetAudience: string[];
  passingScore: number;
  diplomaTemplate: string;
  layoutTemplate: CourseLayoutTemplate;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleRecord {
  id: string;
  courseId: string;
  companyId: string | null;
  title: string;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseContentRecord {
  id: string;
  companyId: string;
  moduleId: string;
  title: string;
  description: string;
  type: CourseContentType;
  url: string;
  contentUrl: string | null;
  filePath: string | null;
  sizeBytes: number | null;
  htmlContent: string | null;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseQuestionOptionRecord {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePhaseQuestionRecord {
  id: string;
  moduleId: string;
  questionText: string;
  questionType: CourseQuestionType;
  configuration: unknown | null;
  imageUrl: string | null;
  explanation: string | null;
  orderIndex: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseEnrollmentRecord {
  id: string;
  courseId: string;
  userId: string;
  companyId: string;
  status: CourseEnrollmentStatus;
  startedAt: string;
  completedAt: string | null;
  scorePercent: number | null;
  totalCorrect: number | null;
  totalQuestions: number | null;
  timeSpentSeconds: number | null;
  currentModuleId: string | null;
  currentContentId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseAnswerRecord {
  id: string;
  enrollmentId: string;
  questionId: string;
  selectedOptionId: string | null;
  completedAnswerId: string | null;
  complexAnswer: unknown | null;
  isCorrect: boolean;
  answeredAt: string;
}

export interface QuizRecord {
  id: string;
  companyId: string | null;
  contentId: string | null;
  courseContentId: string | null;
  title: string | null;
  passingScore: number;
  timeLimit: number | null;
  shuffleQuestions: boolean;
  pointsReward: number;
  deletedAt: string | null;
  createdAt: string;
}

export interface QuizOptionRecord {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
  deletedAt: string | null;
}

export interface QuizQuestionRecord {
  id: string;
  quizId: string;
  questionText: string;
  explanation: string | null;
  sourceExcerpt: string | null;
  orderIndex: number;
  deletedAt: string | null;
  options?: QuizOptionRecord[];
}

export interface QuizAttemptRecord {
  id: string;
  companyId: string;
  userId: string | null;
  quizId: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  completedAt: string;
}
