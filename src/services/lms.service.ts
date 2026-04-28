import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import { sanitizeHtml } from '../lib/sanitize-html.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type {
  CourseAnswerRecord,
  CourseContentRecord,
  CourseEnrollmentRecord,
  CourseModuleRecord,
  CoursePhaseQuestionRecord,
  CourseQuestionOptionRecord,
  CourseRecord,
  QuizAttemptRecord,
  QuizRecord,
} from '../modules/lms/contracts/lms.types.js';
import type { LmsRepository } from '../repositories/contracts/lms.repository.js';

interface CourseInput {
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  coverImage?: string | null;
  imageUrl?: string | null;
  status: CourseRecord['status'];
  accessType: CourseRecord['accessType'];
  allowedUserIds: string[];
  allowedRegionIds: string[];
  allowedStoreIds: string[];
  excludedUserIds: string[];
  targetAudience: string[];
  passingScore: number;
  diplomaTemplate: string;
}
type CourseUpdateInput = Partial<CourseInput>;
type ModuleInput = Pick<CourseModuleRecord, 'title' | 'orderIndex'>;
type ModuleUpdateInput = Partial<ModuleInput>;
interface ContentInput {
  title: string;
  description?: string;
  type: CourseContentRecord['type'];
  url?: string;
  contentUrl?: string | null;
  filePath?: string | null;
  sizeBytes?: number | null;
  htmlContent?: string | null;
  orderIndex: number;
}
type ContentUpdateInput = Partial<ContentInput>;
interface QuestionInput {
  questionText: string;
  questionType: CoursePhaseQuestionRecord['questionType'];
  configuration?: unknown | null;
  imageUrl?: string | null;
  explanation?: string | null;
  orderIndex: number;
  options?: Array<{
    id?: string | null;
    optionText: string;
    isCorrect: boolean;
    orderIndex: number;
  }>;
}
type QuestionUpdateInput = Partial<QuestionInput>;

export class LmsService {
  public constructor(private readonly repository: LmsRepository) {}

  public async listCourses(actor: AuthenticatedActor) {
    const courses = await this.repository.listCourses(actor.companyId);
    const modules = await Promise.all(courses.map((course) => this.repository.listModules(course.id)));
    return courses
      .filter((course) => this.canReadCourse(actor, course))
      .map((course, index) => this.toCourseView(course, modules[index]?.length ?? 0));
  }

  public async getCourse(actor: AuthenticatedActor, courseId: string) {
    const course = await this.getReadableCourse(actor, courseId);
    return this.toCourseView(course, (await this.repository.listModules(course.id)).length);
  }

  public async createCourse(companyId: string, input: CourseInput) {
    const now = new Date().toISOString();
    const course: CourseRecord = {
      id: randomUUID(),
      companyId,
      ...input,
      description: input.description ?? '',
      thumbnailUrl: input.thumbnailUrl ?? null,
      coverImage: input.coverImage ?? null,
      imageUrl: input.imageUrl ?? input.thumbnailUrl ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toCourseView(await this.repository.saveCourse(course));
  }

  public async updateCourse(companyId: string, courseId: string, input: CourseUpdateInput) {
    const course = await this.getTenantCourse(companyId, courseId);
    const next: CourseRecord = {
      ...course,
      ...input,
      thumbnailUrl: input.thumbnailUrl === undefined ? course.thumbnailUrl : input.thumbnailUrl ?? null,
      coverImage: input.coverImage === undefined ? course.coverImage : input.coverImage ?? null,
      imageUrl: input.imageUrl === undefined ? course.imageUrl : input.imageUrl ?? input.thumbnailUrl ?? null,
      updatedAt: new Date().toISOString(),
    };
    return this.toCourseView(await this.repository.saveCourse(next));
  }

  public async deleteCourse(companyId: string, courseId: string) {
    const course = await this.getTenantCourse(companyId, courseId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveCourse({ ...course, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: courseId };
  }

  public async listModules(actor: AuthenticatedActor, courseId: string) {
    await this.getReadableCourse(actor, courseId);
    const modules = await this.repository.listModules(courseId);
    return modules.map(this.toModuleView);
  }

  public async createModule(companyId: string, courseId: string, input: ModuleInput) {
    await this.getTenantCourse(companyId, courseId);
    const now = new Date().toISOString();
    const module: CourseModuleRecord = {
      id: randomUUID(),
      courseId,
      companyId,
      title: input.title,
      orderIndex: input.orderIndex,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toModuleView(await this.repository.saveModule(module));
  }

  public async updateModule(companyId: string, moduleId: string, input: ModuleUpdateInput) {
    const module = await this.getTenantModule(companyId, moduleId);
    const next = { ...module, ...input, updatedAt: new Date().toISOString() };
    return this.toModuleView(await this.repository.saveModule(next));
  }

  public async deleteModule(companyId: string, moduleId: string) {
    const module = await this.getTenantModule(companyId, moduleId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveModule({ ...module, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: moduleId };
  }

  public async listContents(actor: AuthenticatedActor, moduleId: string) {
    const module = await this.getTenantModule(actor.companyId, moduleId);
    await this.getReadableCourse(actor, module.courseId);
    const [contents, quizzes] = await Promise.all([
      this.repository.listContents(actor.companyId, { moduleId }),
      this.quizzesForModule(actor.companyId, moduleId),
    ]);
    return contents.map((content) => this.toContentView(content, quizzes.has(content.id)));
  }

  public async listContentsByModules(actor: AuthenticatedActor, moduleIds: string[]) {
    const scopedModuleIds = await this.scopedModuleIds(actor, moduleIds);
    const contents = await this.repository.listContents(actor.companyId, { moduleIds: scopedModuleIds });
    return contents.map((content) => this.toContentView(content));
  }

  public async createContent(companyId: string, moduleId: string, input: ContentInput) {
    await this.getTenantModule(companyId, moduleId);
    const now = new Date().toISOString();
    const content: CourseContentRecord = {
      id: randomUUID(),
      companyId,
      moduleId,
      ...input,
      description: input.description ?? '',
      url: input.url ?? '',
      contentUrl: input.contentUrl ?? null,
      filePath: input.filePath ?? null,
      sizeBytes: input.sizeBytes ?? null,
      htmlContent: input.htmlContent ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toContentView(await this.repository.saveContent(content));
  }

  public async updateContent(companyId: string, contentId: string, input: ContentUpdateInput) {
    const content = await this.getTenantContent(companyId, contentId);
    const next: CourseContentRecord = {
      ...content,
      ...input,
      contentUrl: input.contentUrl === undefined ? content.contentUrl : input.contentUrl ?? null,
      filePath: input.filePath === undefined ? content.filePath : input.filePath ?? null,
      sizeBytes: input.sizeBytes === undefined ? content.sizeBytes : input.sizeBytes ?? null,
      htmlContent: input.htmlContent === undefined ? content.htmlContent : input.htmlContent ?? null,
      updatedAt: new Date().toISOString(),
    };
    return this.toContentView(await this.repository.saveContent(next));
  }

  public async deleteContent(companyId: string, contentId: string) {
    const content = await this.getTenantContent(companyId, contentId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveContent({ ...content, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: contentId };
  }

  public async listQuestions(actor: AuthenticatedActor, moduleId: string) {
    const module = await this.getTenantModule(actor.companyId, moduleId);
    await this.getReadableCourse(actor, module.courseId);
    const questions = await this.repository.listQuestions(actor.companyId, { moduleId });
    return this.attachQuestionOptions(questions);
  }

  public async listQuestionsByModules(actor: AuthenticatedActor, moduleIds: string[]) {
    const scopedModuleIds = await this.scopedModuleIds(actor, moduleIds);
    const questions = await this.repository.listQuestions(actor.companyId, { moduleIds: scopedModuleIds });
    return this.attachQuestionOptions(questions);
  }

  public async createQuestion(companyId: string, moduleId: string, input: QuestionInput) {
    await this.getTenantModule(companyId, moduleId);
    const now = new Date().toISOString();
    const question: CoursePhaseQuestionRecord = {
      id: randomUUID(),
      moduleId,
      questionText: input.questionText,
      questionType: input.questionType,
      configuration: input.configuration ?? null,
      imageUrl: input.imageUrl ?? null,
      explanation: input.explanation ?? null,
      orderIndex: input.orderIndex,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const saved = await this.repository.saveQuestion(question);
    await this.replaceQuestionOptions(saved.id, input.options ?? []);
    return (await this.attachQuestionOptions([saved]))[0];
  }

  public async updateQuestion(companyId: string, questionId: string, input: QuestionUpdateInput) {
    const question = await this.getTenantQuestion(companyId, questionId);
    const next: CoursePhaseQuestionRecord = {
      ...question,
      ...input,
      questionText: input.questionText ?? question.questionText,
      questionType: input.questionType ?? question.questionType,
      configuration: input.configuration === undefined ? question.configuration : input.configuration ?? null,
      imageUrl: input.imageUrl === undefined ? question.imageUrl : input.imageUrl ?? null,
      explanation: input.explanation === undefined ? question.explanation : input.explanation ?? null,
      updatedAt: new Date().toISOString(),
    };
    const saved = await this.repository.saveQuestion(next);
    if (input.options) await this.replaceQuestionOptions(saved.id, input.options);
    return (await this.attachQuestionOptions([saved]))[0];
  }

  public async deleteQuestion(companyId: string, questionId: string) {
    const question = await this.getTenantQuestion(companyId, questionId);
    const deletedAt = new Date().toISOString();
    await this.repository.saveQuestion({ ...question, deletedAt, updatedAt: deletedAt });
    return { deleted: true, id: questionId };
  }

  public async getEnrollment(actor: AuthenticatedActor, courseId: string) {
    await this.getReadableCourse(actor, courseId);
    const enrollment = await this.repository.findEnrollment(actor.companyId, courseId, actor.userId);
    return enrollment ? this.toEnrollmentView(enrollment) : null;
  }

  public async enroll(actor: AuthenticatedActor, courseId: string) {
    await this.getReadableCourse(actor, courseId);
    const existing = await this.repository.findEnrollment(actor.companyId, courseId, actor.userId);
    if (existing) return this.toEnrollmentView(existing);

    const now = new Date().toISOString();
    const enrollment: CourseEnrollmentRecord = {
      id: randomUUID(),
      courseId,
      userId: actor.userId,
      companyId: actor.companyId,
      status: 'IN_PROGRESS',
      startedAt: now,
      completedAt: null,
      scorePercent: null,
      totalCorrect: null,
      totalQuestions: null,
      timeSpentSeconds: null,
      currentModuleId: null,
      currentContentId: null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    return this.toEnrollmentView(await this.repository.saveEnrollment(enrollment));
  }

  public async updateProgress(actor: AuthenticatedActor, enrollmentId: string, input: { moduleId?: string | null; contentId?: string | null }) {
    const enrollment = await this.getOwnedEnrollment(actor, enrollmentId);
    if (input.moduleId) await this.getTenantModule(actor.companyId, input.moduleId);
    if (input.contentId) await this.getTenantContent(actor.companyId, input.contentId);

    const next = {
      ...enrollment,
      currentModuleId: input.moduleId ?? null,
      currentContentId: input.contentId ?? null,
      updatedAt: new Date().toISOString(),
    };
    return this.toEnrollmentView(await this.repository.saveEnrollment(next));
  }

  public async listAnswers(actor: AuthenticatedActor, enrollmentId: string) {
    await this.getOwnedEnrollment(actor, enrollmentId);
    return (await this.repository.listAnswers(enrollmentId)).map(this.toAnswerView);
  }

  public async submitAnswer(
    actor: AuthenticatedActor,
    enrollmentId: string,
    input: { questionId: string; selectedOptionId?: string | null; complexAnswer?: unknown | null; isCorrect: boolean },
  ) {
    await this.getOwnedEnrollment(actor, enrollmentId);
    await this.getTenantQuestion(actor.companyId, input.questionId);
    const now = new Date().toISOString();
    const existing = await this.repository.findAnswer(enrollmentId, input.questionId);
    const answer: CourseAnswerRecord = {
      id: existing?.id ?? randomUUID(),
      enrollmentId,
      questionId: input.questionId,
      selectedOptionId: input.selectedOptionId ?? null,
      completedAnswerId: existing?.completedAnswerId ?? null,
      complexAnswer: input.complexAnswer ?? null,
      isCorrect: input.isCorrect,
      answeredAt: now,
    };
    return this.toAnswerView(await this.repository.saveAnswer(answer));
  }

  public async completeEnrollment(
    actor: AuthenticatedActor,
    enrollmentId: string,
    input: { totalCorrect: number; totalQuestions: number; startedAt?: string },
  ) {
    const enrollment = await this.getOwnedEnrollment(actor, enrollmentId);
    const completedAt = new Date().toISOString();
    const startedAt = input.startedAt ?? enrollment.startedAt;
    const elapsed = Math.max(0, Math.floor((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000));
    const score = input.totalQuestions > 0 ? Math.round((input.totalCorrect / input.totalQuestions) * 100) : 100;
    const next: CourseEnrollmentRecord = {
      ...enrollment,
      status: 'COMPLETED',
      completedAt,
      scorePercent: score,
      totalCorrect: input.totalCorrect,
      totalQuestions: input.totalQuestions,
      timeSpentSeconds: elapsed,
      updatedAt: completedAt,
    };
    return this.toEnrollmentView(await this.repository.saveEnrollment(next));
  }

  public async resetEnrollment(companyId: string, courseId: string, userId: string) {
    await this.getTenantCourse(companyId, courseId);
    const enrollment = await this.repository.findEnrollment(companyId, courseId, userId);
    if (!enrollment) return { deleted: false, courseId, userId };
    const deletedAt = new Date().toISOString();
    await this.repository.saveEnrollment({ ...enrollment, deletedAt, updatedAt: deletedAt });
    return { deleted: true, courseId, userId };
  }

  public async getCourseStats(actor: AuthenticatedActor, courseId: string) {
    await this.getReadableCourse(actor, courseId);
    const enrollments = await this.repository.listEnrollments(actor.companyId, { courseId });
    return this.buildCourseStats(enrollments);
  }

  public async getDashboard(companyId: string) {
    const [courses, enrollments] = await Promise.all([
      this.repository.listCourses(companyId),
      this.repository.listEnrollments(companyId),
    ]);
    const coursesById = new Map(courses.map((course) => [course.id, course]));
    return enrollments.map((enrollment) => ({
      ...this.toEnrollmentView(enrollment),
      courses: {
        id: enrollment.courseId,
        title: coursesById.get(enrollment.courseId)?.title ?? '',
      },
    }));
  }

  public async getAnalytics(companyId: string) {
    const courses = await this.repository.listCourses(companyId);
    const modules = (await Promise.all(courses.map((course) => this.repository.listModules(course.id)))).flat();
    const moduleIds = modules.map((module) => module.id);
    const [enrollments, questions] = await Promise.all([
      this.repository.listEnrollments(companyId),
      this.repository.listQuestions(companyId, { moduleIds }),
    ]);
    const answers = await this.repository.listAnswersByEnrollmentIds(enrollments.map((enrollment) => enrollment.id));
    return {
      enrollments: enrollments.map(this.toEnrollmentView),
      answers: answers.map(this.toAnswerView),
      questions: await this.attachQuestionOptions(questions),
    };
  }

  public async getModuleStats(actor: AuthenticatedActor, courseId: string) {
    await this.getReadableCourse(actor, courseId);
    const modules = await this.repository.listModules(courseId);
    const contents = await this.repository.listContents(actor.companyId, { moduleIds: modules.map((module) => module.id) });
    return {
      totalModules: modules.length,
      totalContents: contents.length,
    };
  }

  public async getUserHistory(companyId: string, userId: string) {
    const [courses, enrollments] = await Promise.all([
      this.repository.listCourses(companyId),
      this.repository.listEnrollments(companyId, { userId }),
    ]);
    const coursesById = new Map(courses.map((course) => [course.id, course]));
    return enrollments.map((enrollment) => ({
      ...this.toEnrollmentView(enrollment),
      courses: {
        title: coursesById.get(enrollment.courseId)?.title ?? '',
        imageUrl: coursesById.get(enrollment.courseId)?.imageUrl ?? coursesById.get(enrollment.courseId)?.thumbnailUrl ?? null,
      },
    }));
  }

  public async findQuiz(actor: AuthenticatedActor, filters: { contentId?: string; courseContentId?: string }) {
    if (filters.courseContentId) await this.getTenantContent(actor.companyId, filters.courseContentId);
    const quiz = await this.repository.findQuiz(filters);
    if (!quiz || !(await this.quizBelongsToCompany(actor.companyId, quiz))) {
      throw new AppError(404, 'NOT_FOUND', 'Quiz not found.');
    }
    return this.toQuizView(quiz);
  }

  public async listQuizQuestions(actor: AuthenticatedActor, quizId: string) {
    const quiz = await this.getTenantQuiz(actor.companyId, quizId);
    const questions = await this.repository.listQuizQuestions(quiz.id);
    const options = await this.repository.listQuizOptions(questions.map((question) => question.id));
    const optionsByQuestion = new Map<string, typeof options>();
    options.forEach((option) => {
      const list = optionsByQuestion.get(option.questionId) ?? [];
      list.push(option);
      optionsByQuestion.set(option.questionId, list);
    });
    return questions.map((question) => ({
      id: question.id,
      quizId: question.quizId,
      questionText: question.questionText,
      explanation: question.explanation,
      sourceExcerpt: question.sourceExcerpt,
      orderIndex: question.orderIndex,
      quizOptions: (optionsByQuestion.get(question.id) ?? []).map((option) => ({
        id: option.id,
        questionId: option.questionId,
        optionText: option.optionText,
        isCorrect: option.isCorrect,
        orderIndex: option.orderIndex,
      })),
    }));
  }

  public async submitQuizAttempt(actor: AuthenticatedActor, quizId: string, input: { score: number; passed: boolean; answers: Record<string, string> }) {
    await this.getTenantQuiz(actor.companyId, quizId);
    const attempt: QuizAttemptRecord = {
      id: randomUUID(),
      companyId: actor.companyId,
      userId: actor.userId,
      quizId,
      score: input.score,
      passed: input.passed,
      answers: input.answers,
      completedAt: new Date().toISOString(),
    };
    return this.toQuizAttemptView(await this.repository.saveQuizAttempt(attempt));
  }

  private async scopedModuleIds(actor: AuthenticatedActor, moduleIds: string[]) {
    const uniqueIds = [...new Set(moduleIds)];
    const modules = await Promise.all(uniqueIds.map((moduleId) => this.getTenantModule(actor.companyId, moduleId).catch(() => null)));
    const readable = await Promise.all(
      modules.filter(Boolean).map(async (module) => {
        if (!module) return null;
        const course = await this.getReadableCourse(actor, module.courseId).catch(() => null);
        return course ? module.id : null;
      }),
    );
    return readable.filter((id): id is string => Boolean(id));
  }

  private async quizzesForModule(companyId: string, moduleId: string) {
    const contents = await this.repository.listContents(companyId, { moduleId });
    const pairs = await Promise.all(contents.map(async (content) => [content.id, await this.repository.findQuiz({ courseContentId: content.id })] as const));
    return new Set(pairs.filter(([, quiz]) => Boolean(quiz)).map(([contentId]) => contentId));
  }

  private async replaceQuestionOptions(
    questionId: string,
    options: Array<{ id?: string | null; optionText: string; isCorrect: boolean; orderIndex: number }>,
  ) {
    const now = new Date().toISOString();
    const existing = await this.repository.listQuestionOptions([questionId]);
    await Promise.all(existing.map((option) => this.repository.saveQuestionOption({ ...option, deletedAt: now, updatedAt: now })));
    await Promise.all(
      options.map((option, index) =>
        this.repository.saveQuestionOption({
          id: option.id ?? randomUUID(),
          questionId,
          optionText: option.optionText,
          isCorrect: option.isCorrect,
          orderIndex: option.orderIndex ?? index,
          deletedAt: null,
          createdAt: now,
          updatedAt: now,
        }),
      ),
    );
  }

  private async attachQuestionOptions(questions: CoursePhaseQuestionRecord[]) {
    const options = await this.repository.listQuestionOptions(questions.map((question) => question.id));
    const optionsByQuestion = new Map<string, CourseQuestionOptionRecord[]>();
    options.forEach((option) => {
      const list = optionsByQuestion.get(option.questionId) ?? [];
      list.push(option);
      optionsByQuestion.set(option.questionId, list);
    });
    return questions.map((question) => ({
      ...this.toQuestionView(question),
      options: (optionsByQuestion.get(question.id) ?? []).map(this.toQuestionOptionView),
    }));
  }

  private async getTenantCourse(companyId: string, courseId: string) {
    const course = await this.repository.findCourseById(companyId, courseId);
    if (!course) throw new AppError(404, 'NOT_FOUND', 'Course not found.');
    return course;
  }

  private async getReadableCourse(actor: AuthenticatedActor, courseId: string) {
    const course = await this.getTenantCourse(actor.companyId, courseId);
    if (!this.canReadCourse(actor, course)) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to access this course.');
    }
    return course;
  }

  private async getTenantModule(companyId: string, moduleId: string) {
    const module = await this.repository.findModuleById(companyId, moduleId);
    if (!module) throw new AppError(404, 'NOT_FOUND', 'Course module not found.');
    return module;
  }

  private async getTenantContent(companyId: string, contentId: string) {
    const content = await this.repository.findContentById(companyId, contentId);
    if (!content) throw new AppError(404, 'NOT_FOUND', 'Course content not found.');
    return content;
  }

  private async getTenantQuestion(companyId: string, questionId: string) {
    const question = await this.repository.findQuestionById(companyId, questionId);
    if (!question) throw new AppError(404, 'NOT_FOUND', 'Course question not found.');
    return question;
  }

  private async getOwnedEnrollment(actor: AuthenticatedActor, enrollmentId: string) {
    const enrollment = await this.repository.findEnrollmentById(actor.companyId, enrollmentId);
    if (!enrollment) throw new AppError(404, 'NOT_FOUND', 'Course enrollment not found.');
    if (enrollment.userId !== actor.userId) {
      throw new AppError(403, 'FORBIDDEN', 'You do not have permission to update this enrollment.');
    }
    return enrollment;
  }

  private async getTenantQuiz(companyId: string, quizId: string) {
    const quiz = await this.repository.findQuizById(quizId);
    if (!quiz || !(await this.quizBelongsToCompany(companyId, quiz))) {
      throw new AppError(404, 'NOT_FOUND', 'Quiz not found.');
    }
    return quiz;
  }

  private async quizBelongsToCompany(companyId: string, quiz: QuizRecord) {
    if (quiz.companyId && quiz.companyId !== companyId) return false;
    if (quiz.courseContentId) return Boolean(await this.repository.findContentById(companyId, quiz.courseContentId));
    return quiz.companyId === companyId || !quiz.contentId;
  }

  private canReadCourse(actor: AuthenticatedActor, course: CourseRecord): boolean {
    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') return true;
    if (course.excludedUserIds.includes(actor.userId)) return false;
    if (course.status !== 'ACTIVE') return false;
    if (course.accessType === 'ALL') return true;
    return course.allowedUserIds.length === 0 || course.allowedUserIds.includes(actor.userId);
  }

  private buildCourseStats(enrollments: CourseEnrollmentRecord[]) {
    const completed = enrollments.filter((enrollment) => enrollment.status === 'COMPLETED');
    const completionRate = enrollments.length > 0 ? Math.round((completed.length / enrollments.length) * 100) : 0;
    const avgScore =
      completed.length > 0
        ? Math.round(completed.reduce((total, enrollment) => total + (enrollment.scorePercent ?? 0), 0) / completed.length)
        : 0;
    const avgTime =
      completed.length > 0
        ? Math.round(completed.reduce((total, enrollment) => total + (enrollment.timeSpentSeconds ?? 0), 0) / completed.length)
        : 0;
    return {
      totalEnrolled: enrollments.length,
      totalCompleted: completed.length,
      completionRate,
      avgScore,
      avgTimeSeconds: avgTime,
      enrollments: enrollments.map(this.toEnrollmentView),
    };
  }

  private toCourseView(course: CourseRecord, moduleCount = 0) {
    return {
      id: course.id,
      companyId: course.companyId,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      coverImage: course.coverImage,
      imageUrl: course.imageUrl,
      status: course.status,
      accessType: course.accessType,
      allowedUserIds: course.allowedUserIds,
      allowedRegionIds: course.allowedRegionIds,
      allowedStoreIds: course.allowedStoreIds,
      excludedUserIds: course.excludedUserIds,
      targetAudience: course.targetAudience,
      passingScore: course.passingScore,
      diplomaTemplate: course.diplomaTemplate,
      moduleCount,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  private toModuleView(module: CourseModuleRecord) {
    return {
      id: module.id,
      courseId: module.courseId,
      companyId: module.companyId,
      title: module.title,
      orderIndex: module.orderIndex,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
    };
  }

  private toContentView(content: CourseContentRecord, hasQuiz = false) {
    return {
      id: content.id,
      companyId: content.companyId,
      moduleId: content.moduleId,
      title: content.title,
      description: content.description,
      type: content.type,
      url: content.url,
      contentUrl: content.contentUrl,
      filePath: content.filePath,
      sizeBytes: content.sizeBytes,
      htmlContent: content.htmlContent ? sanitizeHtml(content.htmlContent) : null,
      orderIndex: content.orderIndex,
      hasQuiz,
      quizzes: hasQuiz ? [{ id: content.id }] : [],
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }

  private toQuestionView(question: CoursePhaseQuestionRecord) {
    return {
      id: question.id,
      moduleId: question.moduleId,
      questionText: question.questionText,
      questionType: question.questionType,
      configuration: question.configuration,
      imageUrl: question.imageUrl,
      explanation: question.explanation,
      orderIndex: question.orderIndex,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  private toQuestionOptionView(option: CourseQuestionOptionRecord) {
    return {
      id: option.id,
      questionId: option.questionId,
      optionText: option.optionText,
      isCorrect: option.isCorrect,
      orderIndex: option.orderIndex,
    };
  }

  private toEnrollmentView(enrollment: CourseEnrollmentRecord) {
    return {
      id: enrollment.id,
      courseId: enrollment.courseId,
      userId: enrollment.userId,
      companyId: enrollment.companyId,
      status: enrollment.status,
      startedAt: enrollment.startedAt,
      completedAt: enrollment.completedAt,
      scorePercent: enrollment.scorePercent,
      totalCorrect: enrollment.totalCorrect,
      totalQuestions: enrollment.totalQuestions,
      timeSpentSeconds: enrollment.timeSpentSeconds,
      currentModuleId: enrollment.currentModuleId,
      currentContentId: enrollment.currentContentId,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }

  private toAnswerView(answer: CourseAnswerRecord) {
    return {
      id: answer.id,
      enrollmentId: answer.enrollmentId,
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      completedAnswerId: answer.completedAnswerId,
      complexAnswer: answer.complexAnswer,
      isCorrect: answer.isCorrect,
      answeredAt: answer.answeredAt,
    };
  }

  private toQuizView(quiz: QuizRecord) {
    return {
      id: quiz.id,
      companyId: quiz.companyId,
      contentId: quiz.contentId,
      courseContentId: quiz.courseContentId,
      title: quiz.title,
      passingScore: quiz.passingScore,
      timeLimit: quiz.timeLimit,
      shuffleQuestions: quiz.shuffleQuestions,
      pointsReward: quiz.pointsReward,
      createdAt: quiz.createdAt,
    };
  }

  private toQuizAttemptView(attempt: QuizAttemptRecord) {
    return {
      id: attempt.id,
      companyId: attempt.companyId,
      userId: attempt.userId,
      quizId: attempt.quizId,
      score: attempt.score,
      passed: attempt.passed,
      answers: attempt.answers,
      completedAt: attempt.completedAt,
    };
  }
}
