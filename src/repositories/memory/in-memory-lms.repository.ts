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
import type { LmsRepository } from '../contracts/lms.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

function isActive<T extends { deletedAt: string | null }>(record: T): boolean {
  return record.deletedAt === null;
}

export class InMemoryLmsRepository implements LmsRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async listCourses(companyId: string): Promise<CourseRecord[]> {
    return this.store
      .listCourses()
      .filter((course) => course.companyId === companyId && isActive(course))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async findCourseById(companyId: string, courseId: string): Promise<CourseRecord | null> {
    const course = this.store.getCourse(courseId);
    return course && course.companyId === companyId && isActive(course) ? course : null;
  }

  public async saveCourse(course: CourseRecord): Promise<CourseRecord> {
    return this.store.setCourse(course);
  }

  public async listModules(courseId: string): Promise<CourseModuleRecord[]> {
    return this.store
      .listCourseModules()
      .filter((module) => module.courseId === courseId && isActive(module))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async listModulesByCourseIds(courseIds: string[]): Promise<CourseModuleRecord[]> {
    if (courseIds.length === 0) return [];
    const ids = new Set(courseIds);
    return this.store
      .listCourseModules()
      .filter((module) => ids.has(module.courseId) && isActive(module))
      .sort((a, b) => a.courseId.localeCompare(b.courseId) || a.orderIndex - b.orderIndex);
  }

  public async findModuleById(companyId: string, moduleId: string): Promise<CourseModuleRecord | null> {
    const module = this.store.getCourseModule(moduleId);
    if (!module || !isActive(module)) return null;
    const course = await this.findCourseById(companyId, module.courseId);
    return course ? module : null;
  }

  public async saveModule(module: CourseModuleRecord): Promise<CourseModuleRecord> {
    return this.store.setCourseModule(module);
  }

  public async listContents(companyId: string, filters: { moduleId?: string; moduleIds?: string[] }): Promise<CourseContentRecord[]> {
    const allowedModules = new Set(
      this.store
        .listCourseModules()
        .filter((module) => module.companyId === companyId || this.store.getCourse(module.courseId)?.companyId === companyId)
        .map((module) => module.id),
    );
    const requestedModules = new Set([...(filters.moduleIds ?? []), ...(filters.moduleId ? [filters.moduleId] : [])]);

    return this.store
      .listCourseContents()
      .filter((content) => content.companyId === companyId && isActive(content))
      .filter((content) => allowedModules.has(content.moduleId))
      .filter((content) => requestedModules.size === 0 || requestedModules.has(content.moduleId))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async findContentById(companyId: string, contentId: string): Promise<CourseContentRecord | null> {
    const content = this.store.getCourseContent(contentId);
    return content && content.companyId === companyId && isActive(content) ? content : null;
  }

  public async saveContent(content: CourseContentRecord): Promise<CourseContentRecord> {
    return this.store.setCourseContent(content);
  }

  public async listQuestions(companyId: string, filters: { moduleId?: string; moduleIds?: string[] }): Promise<CoursePhaseQuestionRecord[]> {
    const moduleIds = new Set(
      this.store
        .listCourseModules()
        .filter((module) => module.companyId === companyId || this.store.getCourse(module.courseId)?.companyId === companyId)
        .map((module) => module.id),
    );
    const requestedModules = new Set([...(filters.moduleIds ?? []), ...(filters.moduleId ? [filters.moduleId] : [])]);

    return this.store
      .listCourseQuestions()
      .filter((question) => isActive(question))
      .filter((question) => moduleIds.has(question.moduleId))
      .filter((question) => requestedModules.size === 0 || requestedModules.has(question.moduleId))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async findQuestionById(companyId: string, questionId: string): Promise<CoursePhaseQuestionRecord | null> {
    const question = this.store.getCourseQuestion(questionId);
    if (!question || !isActive(question)) return null;
    const module = await this.findModuleById(companyId, question.moduleId);
    return module ? question : null;
  }

  public async saveQuestion(question: CoursePhaseQuestionRecord): Promise<CoursePhaseQuestionRecord> {
    return this.store.setCourseQuestion(question);
  }

  public async listQuestionOptions(questionIds: string[]): Promise<CourseQuestionOptionRecord[]> {
    const ids = new Set(questionIds);
    return this.store
      .listCourseQuestionOptions()
      .filter((option) => ids.has(option.questionId) && isActive(option))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async saveQuestionOption(option: CourseQuestionOptionRecord): Promise<CourseQuestionOptionRecord> {
    return this.store.setCourseQuestionOption(option);
  }

  public async findEnrollment(companyId: string, courseId: string, userId: string): Promise<CourseEnrollmentRecord | null> {
    return (
      this.store
        .listCourseEnrollments()
        .find(
          (enrollment) =>
            enrollment.companyId === companyId &&
            enrollment.courseId === courseId &&
            enrollment.userId === userId &&
            isActive(enrollment),
        ) ?? null
    );
  }

  public async findEnrollmentIncludingDeleted(companyId: string, courseId: string, userId: string): Promise<CourseEnrollmentRecord | null> {
    return (
      this.store
        .listCourseEnrollments()
        .filter(
          (enrollment) =>
            enrollment.companyId === companyId &&
            enrollment.courseId === courseId &&
            enrollment.userId === userId,
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
    );
  }

  public async findEnrollmentById(companyId: string, enrollmentId: string): Promise<CourseEnrollmentRecord | null> {
    const enrollment = this.store.getCourseEnrollment(enrollmentId);
    return enrollment && enrollment.companyId === companyId && isActive(enrollment) ? enrollment : null;
  }

  public async listEnrollments(companyId: string, filters: { courseId?: string; courseIds?: string[]; userId?: string } = {}): Promise<CourseEnrollmentRecord[]> {
    const courseIds = filters.courseIds ? new Set(filters.courseIds) : null;
    return this.store
      .listCourseEnrollments()
      .filter((enrollment) => enrollment.companyId === companyId && isActive(enrollment))
      .filter((enrollment) => !filters.courseId || enrollment.courseId === filters.courseId)
      .filter((enrollment) => !courseIds || courseIds.has(enrollment.courseId))
      .filter((enrollment) => !filters.userId || enrollment.userId === filters.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public async saveEnrollment(enrollment: CourseEnrollmentRecord): Promise<CourseEnrollmentRecord> {
    return this.store.setCourseEnrollment(enrollment);
  }

  public async listAnswers(enrollmentId: string): Promise<CourseAnswerRecord[]> {
    return this.store.listCourseAnswers().filter((answer) => answer.enrollmentId === enrollmentId);
  }

  public async listAnswersByEnrollmentIds(enrollmentIds: string[]): Promise<CourseAnswerRecord[]> {
    const ids = new Set(enrollmentIds);
    return this.store.listCourseAnswers().filter((answer) => ids.has(answer.enrollmentId));
  }

  public async findAnswer(enrollmentId: string, questionId: string): Promise<CourseAnswerRecord | null> {
    return this.store.listCourseAnswers().find((answer) => answer.enrollmentId === enrollmentId && answer.questionId === questionId) ?? null;
  }

  public async saveAnswer(answer: CourseAnswerRecord): Promise<CourseAnswerRecord> {
    return this.store.setCourseAnswer(answer);
  }

  public async findQuiz(filters: { contentId?: string; courseContentId?: string }): Promise<QuizRecord | null> {
    return (
      this.store
        .listQuizzes()
        .find(
          (quiz) =>
            isActive(quiz) &&
            ((filters.contentId && quiz.contentId === filters.contentId) ||
              (filters.courseContentId && quiz.courseContentId === filters.courseContentId)),
        ) ?? null
    );
  }

  public async findQuizById(quizId: string): Promise<QuizRecord | null> {
    const quiz = this.store.getQuiz(quizId);
    return quiz && isActive(quiz) ? quiz : null;
  }

  public async listQuizQuestions(quizId: string): Promise<QuizQuestionRecord[]> {
    return this.store
      .listQuizQuestions()
      .filter((question) => question.quizId === quizId && isActive(question))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async listQuizOptions(questionIds: string[]): Promise<QuizOptionRecord[]> {
    const ids = new Set(questionIds);
    return this.store
      .listQuizOptions()
      .filter((option) => ids.has(option.questionId) && isActive(option))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  public async saveQuizAttempt(attempt: QuizAttemptRecord): Promise<QuizAttemptRecord> {
    return this.store.setQuizAttempt(attempt);
  }
}
