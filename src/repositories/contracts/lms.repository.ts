import type {
  CourseAnswerRecord,
  CourseContentRecord,
  CourseEnrollmentRecord,
  CourseModuleRecord,
  CoursePhaseQuestionRecord,
  CourseQuestionOptionRecord,
  CourseRecord,
  QuizAttemptRecord,
  QuizOptionRecord,
  QuizQuestionRecord,
  QuizRecord,
} from '../../modules/lms/contracts/lms.types.js';

export interface CourseListFilters {
  page: number;
  limit: number;
  search?: string;
  status?: CourseRecord['status'] | 'ALL';
}

export interface CourseListResult {
  items: CourseRecord[];
  total: number;
}

export interface LmsRepository {
  listCourses(companyId: string): Promise<CourseRecord[]>;
  listCoursesPaginated(companyId: string, filters: CourseListFilters): Promise<CourseListResult>;
  findCourseById(companyId: string, courseId: string): Promise<CourseRecord | null>;
  saveCourse(course: CourseRecord): Promise<CourseRecord>;

  listModules(courseId: string): Promise<CourseModuleRecord[]>;
  listModulesByCourseIds(courseIds: string[]): Promise<CourseModuleRecord[]>;
  findModuleById(companyId: string, moduleId: string): Promise<CourseModuleRecord | null>;
  saveModule(module: CourseModuleRecord): Promise<CourseModuleRecord>;

  listContents(companyId: string, filters: { moduleId?: string; moduleIds?: string[] }): Promise<CourseContentRecord[]>;
  findContentById(companyId: string, contentId: string): Promise<CourseContentRecord | null>;
  saveContent(content: CourseContentRecord): Promise<CourseContentRecord>;

  listQuestions(companyId: string, filters: { moduleId?: string; moduleIds?: string[] }): Promise<CoursePhaseQuestionRecord[]>;
  findQuestionById(companyId: string, questionId: string): Promise<CoursePhaseQuestionRecord | null>;
  saveQuestion(question: CoursePhaseQuestionRecord): Promise<CoursePhaseQuestionRecord>;
  listQuestionOptions(questionIds: string[]): Promise<CourseQuestionOptionRecord[]>;
  saveQuestionOption(option: CourseQuestionOptionRecord): Promise<CourseQuestionOptionRecord>;

  findEnrollment(companyId: string, courseId: string, userId: string): Promise<CourseEnrollmentRecord | null>;
  findEnrollmentIncludingDeleted(companyId: string, courseId: string, userId: string): Promise<CourseEnrollmentRecord | null>;
  findEnrollmentById(companyId: string, enrollmentId: string): Promise<CourseEnrollmentRecord | null>;
  listEnrollments(companyId: string, filters?: { courseId?: string; courseIds?: string[]; userId?: string }): Promise<CourseEnrollmentRecord[]>;
  saveEnrollment(enrollment: CourseEnrollmentRecord): Promise<CourseEnrollmentRecord>;

  listAnswers(enrollmentId: string): Promise<CourseAnswerRecord[]>;
  listAnswersByEnrollmentIds(enrollmentIds: string[]): Promise<CourseAnswerRecord[]>;
  findAnswer(enrollmentId: string, questionId: string): Promise<CourseAnswerRecord | null>;
  saveAnswer(answer: CourseAnswerRecord): Promise<CourseAnswerRecord>;

  findQuiz(filters: { contentId?: string; courseContentId?: string }): Promise<QuizRecord | null>;
  findQuizById(quizId: string): Promise<QuizRecord | null>;
  listQuizQuestions(quizId: string): Promise<QuizQuestionRecord[]>;
  listQuizOptions(questionIds: string[]): Promise<QuizOptionRecord[]>;
  saveQuizAttempt(attempt: QuizAttemptRecord): Promise<QuizAttemptRecord>;
}
