import type { AuthSessionRecord } from '../../modules/auth/contracts/session.types.js';
import type { CompanyRecord } from '../../modules/company/contracts/company.types.js';
import type {
  CategoryRecord,
  ContentRatingRecord,
  ContentRecord,
  ContentViewRecord,
  RepositoryRecord,
  SimpleLinkRecord,
} from '../../modules/content/contracts/content.types.js';
import type { InviteRecord } from '../../modules/invite/contracts/invite.types.js';
import type {
  ActionPlanRecord,
  ChecklistAnswerRecord,
  ChecklistFolderRecord,
  ChecklistQuestionRecord,
  ChecklistRecord,
  ChecklistSectionRecord,
  ChecklistSubmissionRecord,
} from '../../modules/checklists/contracts/checklists.types.js';
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
import type {
  SurveyAnswerRecord,
  SurveyQuestionRecord,
  SurveyRecord,
  SurveyResponseRecord,
} from '../../modules/surveys/contracts/surveys.types.js';
import type { OrgTopLevelRecord, OrgUnitRecord } from '../../modules/structure/contracts/structure.types.js';
import type { UserRecord } from '../../modules/user/contracts/user.types.js';

export interface InMemoryStoreSeed {
  companies?: CompanyRecord[];
  users?: UserRecord[];
  invites?: InviteRecord[];
  topLevels?: OrgTopLevelRecord[];
  units?: OrgUnitRecord[];
  sessions?: AuthSessionRecord[];
  repositories?: RepositoryRecord[];
  categories?: CategoryRecord[];
  contents?: ContentRecord[];
  simpleLinks?: SimpleLinkRecord[];
  contentViews?: ContentViewRecord[];
  contentRatings?: ContentRatingRecord[];
  courses?: CourseRecord[];
  courseModules?: CourseModuleRecord[];
  courseContents?: CourseContentRecord[];
  courseQuestions?: CoursePhaseQuestionRecord[];
  courseQuestionOptions?: CourseQuestionOptionRecord[];
  courseEnrollments?: CourseEnrollmentRecord[];
  courseAnswers?: CourseAnswerRecord[];
  quizzes?: QuizRecord[];
  quizQuestions?: QuizQuestionRecord[];
  quizOptions?: QuizOptionRecord[];
  quizAttempts?: QuizAttemptRecord[];
  surveys?: SurveyRecord[];
  surveyQuestions?: SurveyQuestionRecord[];
  surveyResponses?: SurveyResponseRecord[];
  surveyAnswers?: SurveyAnswerRecord[];
  checklists?: ChecklistRecord[];
  checklistFolders?: ChecklistFolderRecord[];
  checklistSections?: ChecklistSectionRecord[];
  checklistQuestions?: ChecklistQuestionRecord[];
  checklistSubmissions?: ChecklistSubmissionRecord[];
  checklistAnswers?: ChecklistAnswerRecord[];
  actionPlans?: ActionPlanRecord[];
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function getClone<T>(map: Map<string, T>, id: string): T | null {
  const value = map.get(id);
  return value ? cloneValue(value) : null;
}

function listClones<T>(map: Map<string, T>): T[] {
  return [...map.values()].map((value) => cloneValue(value));
}

function setClone<T extends { id: string }>(map: Map<string, T>, value: T): T {
  const clonedValue = cloneValue(value);
  map.set(clonedValue.id, clonedValue);
  return cloneValue(clonedValue);
}

export class InMemoryStore {
  private readonly companies = new Map<string, CompanyRecord>();
  private readonly users = new Map<string, UserRecord>();
  private readonly invites = new Map<string, InviteRecord>();
  private readonly topLevels = new Map<string, OrgTopLevelRecord>();
  private readonly units = new Map<string, OrgUnitRecord>();
  private readonly sessions = new Map<string, AuthSessionRecord>();
  private readonly repositories = new Map<string, RepositoryRecord>();
  private readonly categories = new Map<string, CategoryRecord>();
  private readonly contents = new Map<string, ContentRecord>();
  private readonly simpleLinks = new Map<string, SimpleLinkRecord>();
  private readonly contentViews = new Map<string, ContentViewRecord>();
  private readonly contentRatings = new Map<string, ContentRatingRecord>();
  private readonly courses = new Map<string, CourseRecord>();
  private readonly courseModules = new Map<string, CourseModuleRecord>();
  private readonly courseContents = new Map<string, CourseContentRecord>();
  private readonly courseQuestions = new Map<string, CoursePhaseQuestionRecord>();
  private readonly courseQuestionOptions = new Map<string, CourseQuestionOptionRecord>();
  private readonly courseEnrollments = new Map<string, CourseEnrollmentRecord>();
  private readonly courseAnswers = new Map<string, CourseAnswerRecord>();
  private readonly quizzes = new Map<string, QuizRecord>();
  private readonly quizQuestions = new Map<string, QuizQuestionRecord>();
  private readonly quizOptions = new Map<string, QuizOptionRecord>();
  private readonly quizAttempts = new Map<string, QuizAttemptRecord>();
  private readonly surveys = new Map<string, SurveyRecord>();
  private readonly surveyQuestions = new Map<string, SurveyQuestionRecord>();
  private readonly surveyResponses = new Map<string, SurveyResponseRecord>();
  private readonly surveyAnswers = new Map<string, SurveyAnswerRecord>();
  private readonly checklists = new Map<string, ChecklistRecord>();
  private readonly checklistFolders = new Map<string, ChecklistFolderRecord>();
  private readonly checklistSections = new Map<string, ChecklistSectionRecord>();
  private readonly checklistQuestions = new Map<string, ChecklistQuestionRecord>();
  private readonly checklistSubmissions = new Map<string, ChecklistSubmissionRecord>();
  private readonly checklistAnswers = new Map<string, ChecklistAnswerRecord>();
  private readonly actionPlans = new Map<string, ActionPlanRecord>();

  public constructor(seed: InMemoryStoreSeed = {}) {
    seed.companies?.forEach((company) => { setClone(this.companies, company); });
    seed.users?.forEach((user) => { setClone(this.users, user); });
    seed.invites?.forEach((invite) => { setClone(this.invites, invite); });
    seed.topLevels?.forEach((topLevel) => { setClone(this.topLevels, topLevel); });
    seed.units?.forEach((unit) => { setClone(this.units, unit); });
    seed.sessions?.forEach((session) => { setClone(this.sessions, session); });
    seed.repositories?.forEach((repository) => { setClone(this.repositories, repository); });
    seed.categories?.forEach((category) => { setClone(this.categories, category); });
    seed.contents?.forEach((content) => { setClone(this.contents, content); });
    seed.simpleLinks?.forEach((simpleLink) => { setClone(this.simpleLinks, simpleLink); });
    seed.contentViews?.forEach((view) => { setClone(this.contentViews, view); });
    seed.contentRatings?.forEach((rating) => { setClone(this.contentRatings, rating); });
    seed.courses?.forEach((course) => { setClone(this.courses, course); });
    seed.courseModules?.forEach((module) => { setClone(this.courseModules, module); });
    seed.courseContents?.forEach((content) => { setClone(this.courseContents, content); });
    seed.courseQuestions?.forEach((question) => { setClone(this.courseQuestions, question); });
    seed.courseQuestionOptions?.forEach((option) => { setClone(this.courseQuestionOptions, option); });
    seed.courseEnrollments?.forEach((enrollment) => { setClone(this.courseEnrollments, enrollment); });
    seed.courseAnswers?.forEach((answer) => { setClone(this.courseAnswers, answer); });
    seed.quizzes?.forEach((quiz) => { setClone(this.quizzes, quiz); });
    seed.quizQuestions?.forEach((question) => { setClone(this.quizQuestions, question); });
    seed.quizOptions?.forEach((option) => { setClone(this.quizOptions, option); });
    seed.quizAttempts?.forEach((attempt) => { setClone(this.quizAttempts, attempt); });
    seed.surveys?.forEach((survey) => { setClone(this.surveys, survey); });
    seed.surveyQuestions?.forEach((question) => { setClone(this.surveyQuestions, question); });
    seed.surveyResponses?.forEach((response) => { setClone(this.surveyResponses, response); });
    seed.surveyAnswers?.forEach((answer) => { setClone(this.surveyAnswers, answer); });
    seed.checklists?.forEach((checklist) => { setClone(this.checklists, checklist); });
    seed.checklistFolders?.forEach((folder) => { setClone(this.checklistFolders, folder); });
    seed.checklistSections?.forEach((section) => { setClone(this.checklistSections, section); });
    seed.checklistQuestions?.forEach((question) => { setClone(this.checklistQuestions, question); });
    seed.checklistSubmissions?.forEach((submission) => { setClone(this.checklistSubmissions, submission); });
    seed.checklistAnswers?.forEach((answer) => { setClone(this.checklistAnswers, answer); });
    seed.actionPlans?.forEach((plan) => { setClone(this.actionPlans, plan); });
  }

  public listCompanies(): CompanyRecord[] {
    return listClones(this.companies);
  }

  public getCompany(companyId: string): CompanyRecord | null {
    return getClone(this.companies, companyId);
  }

  public setCompany(company: CompanyRecord): CompanyRecord {
    return setClone(this.companies, company);
  }

  public listUsers(): UserRecord[] {
    return listClones(this.users);
  }

  public getUser(userId: string): UserRecord | null {
    return getClone(this.users, userId);
  }

  public setUser(user: UserRecord): UserRecord {
    return setClone(this.users, user);
  }

  public listInvites(): InviteRecord[] {
    return listClones(this.invites);
  }

  public getInvite(inviteId: string): InviteRecord | null {
    return getClone(this.invites, inviteId);
  }

  public setInvite(invite: InviteRecord): InviteRecord {
    return setClone(this.invites, invite);
  }

  public listTopLevels(): OrgTopLevelRecord[] {
    return listClones(this.topLevels);
  }

  public getTopLevel(topLevelId: string): OrgTopLevelRecord | null {
    return getClone(this.topLevels, topLevelId);
  }

  public setTopLevel(topLevel: OrgTopLevelRecord): OrgTopLevelRecord {
    return setClone(this.topLevels, topLevel);
  }

  public listUnits(): OrgUnitRecord[] {
    return listClones(this.units);
  }

  public getUnit(unitId: string): OrgUnitRecord | null {
    return getClone(this.units, unitId);
  }

  public setUnit(unit: OrgUnitRecord): OrgUnitRecord {
    return setClone(this.units, unit);
  }

  public listSessions(): AuthSessionRecord[] {
    return listClones(this.sessions);
  }

  public getSession(sessionId: string): AuthSessionRecord | null {
    return getClone(this.sessions, sessionId);
  }

  public setSession(session: AuthSessionRecord): AuthSessionRecord {
    return setClone(this.sessions, session);
  }

  public listRepositories(): RepositoryRecord[] {
    return listClones(this.repositories);
  }

  public getRepository(repositoryId: string): RepositoryRecord | null {
    return getClone(this.repositories, repositoryId);
  }

  public setRepository(repository: RepositoryRecord): RepositoryRecord {
    return setClone(this.repositories, repository);
  }

  public listCategories(): CategoryRecord[] {
    return listClones(this.categories);
  }

  public getCategory(categoryId: string): CategoryRecord | null {
    return getClone(this.categories, categoryId);
  }

  public setCategory(category: CategoryRecord): CategoryRecord {
    return setClone(this.categories, category);
  }

  public listContents(): ContentRecord[] {
    return listClones(this.contents);
  }

  public getContent(contentId: string): ContentRecord | null {
    return getClone(this.contents, contentId);
  }

  public setContent(content: ContentRecord): ContentRecord {
    return setClone(this.contents, content);
  }

  public listSimpleLinks(): SimpleLinkRecord[] {
    return listClones(this.simpleLinks);
  }

  public getSimpleLink(simpleLinkId: string): SimpleLinkRecord | null {
    return getClone(this.simpleLinks, simpleLinkId);
  }

  public setSimpleLink(simpleLink: SimpleLinkRecord): SimpleLinkRecord {
    return setClone(this.simpleLinks, simpleLink);
  }

  public listContentViews(): ContentViewRecord[] {
    return listClones(this.contentViews);
  }

  public setContentView(view: ContentViewRecord): ContentViewRecord {
    return setClone(this.contentViews, view);
  }

  public listContentRatings(): ContentRatingRecord[] {
    return listClones(this.contentRatings);
  }

  public getContentRating(ratingId: string): ContentRatingRecord | null {
    return getClone(this.contentRatings, ratingId);
  }

  public setContentRating(rating: ContentRatingRecord): ContentRatingRecord {
    return setClone(this.contentRatings, rating);
  }

  public listCourses(): CourseRecord[] {
    return listClones(this.courses);
  }

  public getCourse(courseId: string): CourseRecord | null {
    return getClone(this.courses, courseId);
  }

  public setCourse(course: CourseRecord): CourseRecord {
    return setClone(this.courses, course);
  }

  public listCourseModules(): CourseModuleRecord[] {
    return listClones(this.courseModules);
  }

  public getCourseModule(moduleId: string): CourseModuleRecord | null {
    return getClone(this.courseModules, moduleId);
  }

  public setCourseModule(module: CourseModuleRecord): CourseModuleRecord {
    return setClone(this.courseModules, module);
  }

  public listCourseContents(): CourseContentRecord[] {
    return listClones(this.courseContents);
  }

  public getCourseContent(contentId: string): CourseContentRecord | null {
    return getClone(this.courseContents, contentId);
  }

  public setCourseContent(content: CourseContentRecord): CourseContentRecord {
    return setClone(this.courseContents, content);
  }

  public listCourseQuestions(): CoursePhaseQuestionRecord[] {
    return listClones(this.courseQuestions);
  }

  public getCourseQuestion(questionId: string): CoursePhaseQuestionRecord | null {
    return getClone(this.courseQuestions, questionId);
  }

  public setCourseQuestion(question: CoursePhaseQuestionRecord): CoursePhaseQuestionRecord {
    return setClone(this.courseQuestions, question);
  }

  public listCourseQuestionOptions(): CourseQuestionOptionRecord[] {
    return listClones(this.courseQuestionOptions);
  }

  public setCourseQuestionOption(option: CourseQuestionOptionRecord): CourseQuestionOptionRecord {
    return setClone(this.courseQuestionOptions, option);
  }

  public listCourseEnrollments(): CourseEnrollmentRecord[] {
    return listClones(this.courseEnrollments);
  }

  public getCourseEnrollment(enrollmentId: string): CourseEnrollmentRecord | null {
    return getClone(this.courseEnrollments, enrollmentId);
  }

  public setCourseEnrollment(enrollment: CourseEnrollmentRecord): CourseEnrollmentRecord {
    return setClone(this.courseEnrollments, enrollment);
  }

  public listCourseAnswers(): CourseAnswerRecord[] {
    return listClones(this.courseAnswers);
  }

  public setCourseAnswer(answer: CourseAnswerRecord): CourseAnswerRecord {
    return setClone(this.courseAnswers, answer);
  }

  public listQuizzes(): QuizRecord[] {
    return listClones(this.quizzes);
  }

  public getQuiz(quizId: string): QuizRecord | null {
    return getClone(this.quizzes, quizId);
  }

  public listQuizQuestions(): QuizQuestionRecord[] {
    return listClones(this.quizQuestions);
  }

  public listQuizOptions(): QuizOptionRecord[] {
    return listClones(this.quizOptions);
  }

  public setQuizAttempt(attempt: QuizAttemptRecord): QuizAttemptRecord {
    return setClone(this.quizAttempts, attempt);
  }

  /* Surveys */
  public listSurveys(): SurveyRecord[] {
    return listClones(this.surveys);
  }

  public getSurvey(surveyId: string): SurveyRecord | null {
    return getClone(this.surveys, surveyId);
  }

  public setSurvey(survey: SurveyRecord): SurveyRecord {
    return setClone(this.surveys, survey);
  }

  public listSurveyQuestions(): SurveyQuestionRecord[] {
    return listClones(this.surveyQuestions);
  }

  public getSurveyQuestion(questionId: string): SurveyQuestionRecord | null {
    return getClone(this.surveyQuestions, questionId);
  }

  public setSurveyQuestion(question: SurveyQuestionRecord): SurveyQuestionRecord {
    return setClone(this.surveyQuestions, question);
  }

  public listSurveyResponses(): SurveyResponseRecord[] {
    return listClones(this.surveyResponses);
  }

  public getSurveyResponse(responseId: string): SurveyResponseRecord | null {
    return getClone(this.surveyResponses, responseId);
  }

  public setSurveyResponse(response: SurveyResponseRecord): SurveyResponseRecord {
    return setClone(this.surveyResponses, response);
  }

  public listSurveyAnswers(): SurveyAnswerRecord[] {
    return listClones(this.surveyAnswers);
  }

  public setSurveyAnswer(answer: SurveyAnswerRecord): SurveyAnswerRecord {
    return setClone(this.surveyAnswers, answer);
  }

  /* Checklists */
  public listChecklists(): ChecklistRecord[] {
    return listClones(this.checklists);
  }

  public getChecklist(checklistId: string): ChecklistRecord | null {
    return getClone(this.checklists, checklistId);
  }

  public setChecklist(checklist: ChecklistRecord): ChecklistRecord {
    return setClone(this.checklists, checklist);
  }

  public listChecklistFolders(): ChecklistFolderRecord[] {
    return listClones(this.checklistFolders);
  }

  public getChecklistFolder(folderId: string): ChecklistFolderRecord | null {
    return getClone(this.checklistFolders, folderId);
  }

  public setChecklistFolder(folder: ChecklistFolderRecord): ChecklistFolderRecord {
    return setClone(this.checklistFolders, folder);
  }

  public listChecklistSections(): ChecklistSectionRecord[] {
    return listClones(this.checklistSections);
  }

  public getChecklistSection(sectionId: string): ChecklistSectionRecord | null {
    return getClone(this.checklistSections, sectionId);
  }

  public setChecklistSection(section: ChecklistSectionRecord): ChecklistSectionRecord {
    return setClone(this.checklistSections, section);
  }

  public listChecklistQuestions(): ChecklistQuestionRecord[] {
    return listClones(this.checklistQuestions);
  }

  public getChecklistQuestion(questionId: string): ChecklistQuestionRecord | null {
    return getClone(this.checklistQuestions, questionId);
  }

  public setChecklistQuestion(question: ChecklistQuestionRecord): ChecklistQuestionRecord {
    return setClone(this.checklistQuestions, question);
  }

  public listChecklistSubmissions(): ChecklistSubmissionRecord[] {
    return listClones(this.checklistSubmissions);
  }

  public getChecklistSubmission(submissionId: string): ChecklistSubmissionRecord | null {
    return getClone(this.checklistSubmissions, submissionId);
  }

  public setChecklistSubmission(submission: ChecklistSubmissionRecord): ChecklistSubmissionRecord {
    return setClone(this.checklistSubmissions, submission);
  }

  public listChecklistAnswers(): ChecklistAnswerRecord[] {
    return listClones(this.checklistAnswers);
  }

  public setChecklistAnswer(answer: ChecklistAnswerRecord): ChecklistAnswerRecord {
    return setClone(this.checklistAnswers, answer);
  }

  public listActionPlans(): ActionPlanRecord[] {
    return listClones(this.actionPlans);
  }

  public getActionPlan(actionPlanId: string): ActionPlanRecord | null {
    return getClone(this.actionPlans, actionPlanId);
  }

  public setActionPlan(plan: ActionPlanRecord): ActionPlanRecord {
    return setClone(this.actionPlans, plan);
  }
}
