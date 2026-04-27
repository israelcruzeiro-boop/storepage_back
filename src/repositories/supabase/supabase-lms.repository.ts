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
import type { SupabaseRestClient } from './supabase-rest-client.js';
import {
  COURSE_ANSWER_SELECT,
  COURSE_CONTENT_SELECT,
  COURSE_ENROLLMENT_SELECT,
  COURSE_MODULE_SELECT,
  COURSE_QUESTION_OPTION_SELECT,
  COURSE_QUESTION_SELECT,
  COURSE_SELECT,
  QUIZ_ATTEMPT_SELECT,
  QUIZ_OPTION_SELECT,
  QUIZ_QUESTION_SELECT,
  QUIZ_SELECT,
  fromCourseAnswerRecord,
  fromCourseContentRecord,
  fromCourseEnrollmentRecord,
  fromCourseModuleRecord,
  fromCoursePhaseQuestionRecord,
  fromCourseQuestionOptionRecord,
  fromCourseRecord,
  fromQuizAttemptRecord,
  toCourseAnswerRecord,
  toCourseContentRecord,
  toCourseEnrollmentRecord,
  toCourseModuleRecord,
  toCoursePhaseQuestionRecord,
  toCourseQuestionOptionRecord,
  toCourseRecord,
  toQuizAttemptRecord,
  toQuizOptionRecord,
  toQuizQuestionRecord,
  toQuizRecord,
  type CourseAnswerRow,
  type CourseContentRow,
  type CourseEnrollmentRow,
  type CourseModuleRow,
  type CoursePhaseQuestionRow,
  type CourseQuestionOptionRow,
  type CourseRow,
  type QuizAttemptRow,
  type QuizOptionRow,
  type QuizQuestionRow,
  type QuizRow,
} from './supabase-row-mappers.js';

type SelectFilter = {
  column: string;
  operator: 'eq' | 'is' | 'in';
  value: string | string[] | null;
};

export class SupabaseLmsRepository implements LmsRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async listCourses(companyId: string): Promise<CourseRecord[]> {
    const result = await this.client.select<CourseRow>('courses', {
      select: COURSE_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'created_at', ascending: false }],
    });
    return result.rows.map(toCourseRecord);
  }

  public async findCourseById(companyId: string, courseId: string): Promise<CourseRecord | null> {
    const row = await this.client.selectOne<CourseRow>('courses', {
      select: COURSE_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'id', operator: 'eq', value: courseId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toCourseRecord(row) : null;
  }

  public async saveCourse(course: CourseRecord): Promise<CourseRecord> {
    const row = await this.client.upsert<CourseRow>('courses', fromCourseRecord(course), {
      select: COURSE_SELECT,
      onConflict: 'id',
    });
    return toCourseRecord(row);
  }

  public async listModules(courseId: string): Promise<CourseModuleRecord[]> {
    const result = await this.client.select<CourseModuleRow>('course_modules', {
      select: COURSE_MODULE_SELECT,
      filters: [
        { column: 'course_id', operator: 'eq', value: courseId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'order_index' }],
    });
    return result.rows.map(toCourseModuleRecord);
  }

  public async findModuleById(companyId: string, moduleId: string): Promise<CourseModuleRecord | null> {
    const row = await this.client.selectOne<CourseModuleRow>('course_modules', {
      select: COURSE_MODULE_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: moduleId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    if (!row) return null;
    const module = toCourseModuleRecord(row);
    const course = await this.findCourseById(companyId, module.courseId);
    return course ? module : null;
  }

  public async saveModule(module: CourseModuleRecord): Promise<CourseModuleRecord> {
    const row = await this.client.upsert<CourseModuleRow>('course_modules', fromCourseModuleRecord(module), {
      select: COURSE_MODULE_SELECT,
      onConflict: 'id',
    });
    return toCourseModuleRecord(row);
  }

  public async listContents(companyId: string, filters: { moduleId?: string; moduleIds?: string[] }): Promise<CourseContentRecord[]> {
    const queryFilters: SelectFilter[] = [
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'deleted_at', operator: 'is', value: null },
    ];
    if (filters.moduleId) queryFilters.push({ column: 'module_id', operator: 'eq', value: filters.moduleId });
    if (filters.moduleIds) {
      if (filters.moduleIds.length === 0) return [];
      queryFilters.push({ column: 'module_id', operator: 'in', value: filters.moduleIds });
    }

    const result = await this.client.select<CourseContentRow>('course_contents', {
      select: COURSE_CONTENT_SELECT,
      filters: queryFilters,
      order: [{ column: 'order_index' }],
    });
    return result.rows.map(toCourseContentRecord);
  }

  public async findContentById(companyId: string, contentId: string): Promise<CourseContentRecord | null> {
    const row = await this.client.selectOne<CourseContentRow>('course_contents', {
      select: COURSE_CONTENT_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'id', operator: 'eq', value: contentId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toCourseContentRecord(row) : null;
  }

  public async saveContent(content: CourseContentRecord): Promise<CourseContentRecord> {
    const row = await this.client.upsert<CourseContentRow>('course_contents', fromCourseContentRecord(content), {
      select: COURSE_CONTENT_SELECT,
      onConflict: 'id',
    });
    return toCourseContentRecord(row);
  }

  public async listQuestions(companyId: string, filters: { moduleId?: string; moduleIds?: string[] }): Promise<CoursePhaseQuestionRecord[]> {
    if (filters.moduleId) {
      const module = await this.findModuleById(companyId, filters.moduleId);
      if (!module) return [];
    }
    const queryFilters: SelectFilter[] = [{ column: 'deleted_at', operator: 'is', value: null }];
    if (filters.moduleId) queryFilters.push({ column: 'module_id', operator: 'eq', value: filters.moduleId });
    if (filters.moduleIds) {
      if (filters.moduleIds.length === 0) return [];
      queryFilters.push({ column: 'module_id', operator: 'in', value: filters.moduleIds });
    }

    const result = await this.client.select<CoursePhaseQuestionRow>('course_phase_questions', {
      select: COURSE_QUESTION_SELECT,
      filters: queryFilters,
      order: [{ column: 'order_index' }],
    });
    return result.rows.map(toCoursePhaseQuestionRecord);
  }

  public async findQuestionById(companyId: string, questionId: string): Promise<CoursePhaseQuestionRecord | null> {
    const row = await this.client.selectOne<CoursePhaseQuestionRow>('course_phase_questions', {
      select: COURSE_QUESTION_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: questionId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    if (!row) return null;
    const question = toCoursePhaseQuestionRecord(row);
    const module = await this.findModuleById(companyId, question.moduleId);
    return module ? question : null;
  }

  public async saveQuestion(question: CoursePhaseQuestionRecord): Promise<CoursePhaseQuestionRecord> {
    const row = await this.client.upsert<CoursePhaseQuestionRow>('course_phase_questions', fromCoursePhaseQuestionRecord(question), {
      select: COURSE_QUESTION_SELECT,
      onConflict: 'id',
    });
    return toCoursePhaseQuestionRecord(row);
  }

  public async listQuestionOptions(questionIds: string[]): Promise<CourseQuestionOptionRecord[]> {
    if (questionIds.length === 0) return [];
    const result = await this.client.select<CourseQuestionOptionRow>('course_question_options', {
      select: COURSE_QUESTION_OPTION_SELECT,
      filters: [
        { column: 'question_id', operator: 'in', value: questionIds },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'order_index' }],
    });
    return result.rows.map(toCourseQuestionOptionRecord);
  }

  public async saveQuestionOption(option: CourseQuestionOptionRecord): Promise<CourseQuestionOptionRecord> {
    const row = await this.client.upsert<CourseQuestionOptionRow>('course_question_options', fromCourseQuestionOptionRecord(option), {
      select: COURSE_QUESTION_OPTION_SELECT,
      onConflict: 'id',
    });
    return toCourseQuestionOptionRecord(row);
  }

  public async findEnrollment(companyId: string, courseId: string, userId: string): Promise<CourseEnrollmentRecord | null> {
    const row = await this.client.selectOne<CourseEnrollmentRow>('course_enrollments', {
      select: COURSE_ENROLLMENT_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'course_id', operator: 'eq', value: courseId },
        { column: 'user_id', operator: 'eq', value: userId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toCourseEnrollmentRecord(row) : null;
  }

  public async findEnrollmentById(companyId: string, enrollmentId: string): Promise<CourseEnrollmentRecord | null> {
    const row = await this.client.selectOne<CourseEnrollmentRow>('course_enrollments', {
      select: COURSE_ENROLLMENT_SELECT,
      filters: [
        { column: 'company_id', operator: 'eq', value: companyId },
        { column: 'id', operator: 'eq', value: enrollmentId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toCourseEnrollmentRecord(row) : null;
  }

  public async listEnrollments(companyId: string, filters: { courseId?: string; userId?: string } = {}): Promise<CourseEnrollmentRecord[]> {
    const queryFilters: SelectFilter[] = [
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'deleted_at', operator: 'is', value: null },
    ];
    if (filters.courseId) queryFilters.push({ column: 'course_id', operator: 'eq', value: filters.courseId });
    if (filters.userId) queryFilters.push({ column: 'user_id', operator: 'eq', value: filters.userId });

    const result = await this.client.select<CourseEnrollmentRow>('course_enrollments', {
      select: COURSE_ENROLLMENT_SELECT,
      filters: queryFilters,
      order: [{ column: 'created_at', ascending: false }],
    });
    return result.rows.map(toCourseEnrollmentRecord);
  }

  public async saveEnrollment(enrollment: CourseEnrollmentRecord): Promise<CourseEnrollmentRecord> {
    const row = await this.client.upsert<CourseEnrollmentRow>('course_enrollments', fromCourseEnrollmentRecord(enrollment), {
      select: COURSE_ENROLLMENT_SELECT,
      onConflict: 'id',
    });
    return toCourseEnrollmentRecord(row);
  }

  public async listAnswers(enrollmentId: string): Promise<CourseAnswerRecord[]> {
    const result = await this.client.select<CourseAnswerRow>('course_answers', {
      select: COURSE_ANSWER_SELECT,
      filters: [{ column: 'enrollment_id', operator: 'eq', value: enrollmentId }],
    });
    return result.rows.map(toCourseAnswerRecord);
  }

  public async listAnswersByEnrollmentIds(enrollmentIds: string[]): Promise<CourseAnswerRecord[]> {
    if (enrollmentIds.length === 0) return [];
    const result = await this.client.select<CourseAnswerRow>('course_answers', {
      select: COURSE_ANSWER_SELECT,
      filters: [{ column: 'enrollment_id', operator: 'in', value: enrollmentIds }],
    });
    return result.rows.map(toCourseAnswerRecord);
  }

  public async findAnswer(enrollmentId: string, questionId: string): Promise<CourseAnswerRecord | null> {
    const row = await this.client.selectOne<CourseAnswerRow>('course_answers', {
      select: COURSE_ANSWER_SELECT,
      filters: [
        { column: 'enrollment_id', operator: 'eq', value: enrollmentId },
        { column: 'question_id', operator: 'eq', value: questionId },
      ],
    });
    return row ? toCourseAnswerRecord(row) : null;
  }

  public async saveAnswer(answer: CourseAnswerRecord): Promise<CourseAnswerRecord> {
    const row = await this.client.upsert<CourseAnswerRow>('course_answers', fromCourseAnswerRecord(answer), {
      select: COURSE_ANSWER_SELECT,
      onConflict: 'enrollment_id,question_id',
    });
    return toCourseAnswerRecord(row);
  }

  public async findQuiz(filters: { contentId?: string; courseContentId?: string }): Promise<QuizRecord | null> {
    const queryFilters: SelectFilter[] = [{ column: 'deleted_at', operator: 'is', value: null }];
    if (filters.courseContentId) queryFilters.push({ column: 'course_content_id', operator: 'eq', value: filters.courseContentId });
    else if (filters.contentId) queryFilters.push({ column: 'content_id', operator: 'eq', value: filters.contentId });
    else return null;

    const row = await this.client.selectOne<QuizRow>('quizzes', {
      select: QUIZ_SELECT,
      filters: queryFilters,
    });
    return row ? toQuizRecord(row) : null;
  }

  public async findQuizById(quizId: string): Promise<QuizRecord | null> {
    const row = await this.client.selectOne<QuizRow>('quizzes', {
      select: QUIZ_SELECT,
      filters: [
        { column: 'id', operator: 'eq', value: quizId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
    });
    return row ? toQuizRecord(row) : null;
  }

  public async listQuizQuestions(quizId: string): Promise<QuizQuestionRecord[]> {
    const result = await this.client.select<QuizQuestionRow>('quiz_questions', {
      select: QUIZ_QUESTION_SELECT,
      filters: [
        { column: 'quiz_id', operator: 'eq', value: quizId },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'order_index' }],
    });
    return result.rows.map(toQuizQuestionRecord);
  }

  public async listQuizOptions(questionIds: string[]): Promise<QuizOptionRecord[]> {
    if (questionIds.length === 0) return [];
    const result = await this.client.select<QuizOptionRow>('quiz_options', {
      select: QUIZ_OPTION_SELECT,
      filters: [
        { column: 'question_id', operator: 'in', value: questionIds },
        { column: 'deleted_at', operator: 'is', value: null },
      ],
      order: [{ column: 'order_index' }],
    });
    return result.rows.map(toQuizOptionRecord);
  }

  public async saveQuizAttempt(attempt: QuizAttemptRecord): Promise<QuizAttemptRecord> {
    const row = await this.client.upsert<QuizAttemptRow>('quiz_attempts', fromQuizAttemptRecord(attempt), {
      select: QUIZ_ATTEMPT_SELECT,
      onConflict: 'id',
    });
    return toQuizAttemptRecord(row);
  }
}
