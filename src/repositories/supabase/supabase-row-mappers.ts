import type { UserRole } from '../../modules/auth/contracts/auth.types.js';
import type { AuthSessionRecord } from '../../modules/auth/contracts/session.types.js';
import type {
  CompanyBranding,
  CompanyFeatureFlags,
  CompanyGeneralSettings,
  CompanyRecord,
  CompanyTheme,
} from '../../modules/company/contracts/company.types.js';
import type {
  CategoryRecord,
  ContentRatingRecord,
  ContentRecord,
  ContentViewRecord,
  RepositoryRecord,
  SimpleLinkRecord,
} from '../../modules/content/contracts/content.types.js';
import type { InviteRecord, InviteStatus } from '../../modules/invite/contracts/invite.types.js';
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
  CourseLayoutTemplate,
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
import type { UserRecord, UserStatus } from '../../modules/user/contracts/user.types.js';
import type { InviteDeliveryAttemptRecord } from '../../modules/invite/contracts/invite-delivery.types.js';

export const COMPANY_SELECT =
  'id,name,slug,link_name,status,active,theme,logo_url,favicon_url,hero_image,hero_title,hero_subtitle,hero_cta_label,landing_page_enabled,landing_page_active,landing_page_layout,org_levels,org_unit_name,support_email,repositories_enabled,lms_enabled,checklists_enabled,surveys_enabled,metrics_enabled,deleted_at,created_at,updated_at';
export const USER_SELECT =
  'id,company_id,name,email,normalized_email,cpf,role,status,active,first_access,onboarding_completed,avatar_url,org_unit_id,password_hash,password_updated_at,deleted_at,created_at,updated_at';
export const INVITE_SELECT =
  'id,company_id,name,email,normalized_email,cpf,role,org_unit_id,token,status,invited_by_user_id,user_id,expires_at,activated_at,cancelled_at,deleted_at,created_at,updated_at';
export const INVITE_DELIVERY_ATTEMPT_SELECT =
  'id,invite_id,company_id,channel,provider,status,error_code,requested_by_user_id,sent_at,created_at';
export const TOP_LEVEL_SELECT =
  'id,company_id,name,level_index,parent_id,deleted_at,created_at,updated_at';
export const UNIT_SELECT =
  'id,company_id,name,code,top_level_id,active,deleted_at,created_at,updated_at';
export const SESSION_SELECT =
  'id,user_id,company_id,refresh_token_hash,refresh_token_id,created_at,updated_at,last_authenticated_at,expires_at,refresh_expires_at,revoked_at,revoked_reason';
export const REPOSITORY_SELECT =
  'id,company_id,name,description,cover_image,banner_image,featured,show_in_landing,type,status,access_type,allowed_user_ids,allowed_region_ids,allowed_store_ids,excluded_user_ids,banner_position,banner_brightness,deleted_at,created_at,updated_at';
export const CATEGORY_SELECT = 'id,repository_id,name,order_index,deleted_at,created_at,updated_at';
export const CONTENT_SELECT =
  'id,company_id,repository_id,category_id,title,description,thumbnail_url,type,url,embed_url,featured,recent,status,deleted_at,created_at,updated_at';
export const SIMPLE_LINK_SELECT = 'id,company_id,repository_id,name,url,type,date,status,deleted_at,created_at,updated_at';
export const CONTENT_VIEW_SELECT = 'id,user_id,content_id,company_id,repository_id,content_type,org_unit_id,viewed_at';
export const CONTENT_RATING_SELECT =
  'id,user_id,content_id,company_id,repository_id,rating,org_unit_id,created_at,updated_at';
export const COURSE_SELECT =
  'id,company_id,title,description,thumbnail_url,cover_image,image_url,status,access_type,allowed_user_ids,allowed_region_ids,allowed_store_ids,excluded_user_ids,target_audience,passing_score,diploma_template,layout_template,deleted_at,created_at,updated_at';
export const COURSE_MODULE_SELECT = 'id,course_id,company_id,title,order_index,deleted_at,created_at,updated_at';
export const COURSE_CONTENT_SELECT =
  'id,company_id,module_id,title,description,type,url,content_url,file_path,size_bytes,html_content,order_index,deleted_at,created_at,updated_at';
export const COURSE_QUESTION_SELECT =
  'id,module_id,question_text,question_type,configuration,image_url,explanation,order_index,deleted_at,created_at,updated_at';
export const COURSE_QUESTION_OPTION_SELECT = 'id,question_id,option_text,is_correct,order_index,deleted_at,created_at,updated_at';
export const COURSE_ENROLLMENT_SELECT =
  'id,course_id,user_id,company_id,status,started_at,completed_at,score_percent,total_correct,total_questions,time_spent_seconds,current_module_id,current_content_id,deleted_at,created_at,updated_at';
export const COURSE_ANSWER_SELECT =
  'id,enrollment_id,question_id,completed_answer_id,selected_option_id,complex_answer,is_correct,answered_at';
export const QUIZ_SELECT =
  'id,company_id,content_id,course_content_id,title,passing_score,time_limit,shuffle_questions,points_reward,deleted_at,created_at';
export const QUIZ_QUESTION_SELECT = 'id,quiz_id,question_text,explanation,source_excerpt,order_index,deleted_at';
export const QUIZ_OPTION_SELECT = 'id,question_id,option_text,is_correct,order_index,deleted_at';
export const QUIZ_ATTEMPT_SELECT = 'id,company_id,user_id,quiz_id,score,passed,answers,completed_at';
export const SURVEY_SELECT =
  'id,company_id,title,description,status,access_type,allowed_user_ids,allowed_region_ids,allowed_store_ids,excluded_user_ids,allow_multiple_responses,anonymous,starts_at,ends_at,cover_image,created_by,deleted_at,created_at,updated_at';
export const SURVEY_QUESTION_SELECT =
  'id,survey_id,question_text,description,question_type,configuration,required,order_index,deleted_at,created_at,updated_at';
export const SURVEY_RESPONSE_SELECT =
  'id,survey_id,company_id,user_id,org_unit_id,org_top_level_id,started_at,completed_at,created_at,updated_at';
export const SURVEY_ANSWER_SELECT = 'id,response_id,question_id,value,created_at';

type JsonObject = Record<string, unknown>;

export interface CompanyRow extends JsonObject {
  id: string;
  name: string;
  slug: string;
  link_name: string;
  status: CompanyRecord['status'] | null;
  active: boolean | null;
  theme: unknown;
  logo_url: string | null;
  favicon_url: string | null;
  hero_image: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_cta_label: string | null;
  landing_page_enabled?: boolean | null;
  landing_page_active?: boolean | null;
  landing_page_layout?: string | null;
  org_levels: unknown;
  org_unit_name: string | null;
  support_email: string | null;
  repositories_enabled: boolean | null;
  lms_enabled: boolean | null;
  checklists_enabled: boolean | null;
  surveys_enabled: boolean | null;
  metrics_enabled: boolean | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRow extends JsonObject {
  id: string;
  company_id: string;
  name: string;
  email: string;
  normalized_email: string | null;
  cpf: string | null;
  role: UserRole;
  status: UserStatus | null;
  active: boolean | null;
  first_access: boolean | null;
  onboarding_completed?: boolean | null;
  avatar_url: string | null;
  org_unit_id: string | null;
  password_hash: string | null;
  password_updated_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteRow extends JsonObject {
  id: string;
  company_id: string;
  name: string;
  email: string;
  normalized_email: string | null;
  cpf: string | null;
  role: UserRole;
  org_unit_id: string | null;
  token: string;
  status: InviteStatus;
  invited_by_user_id: string;
  user_id: string | null;
  expires_at: string;
  activated_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InviteDeliveryAttemptRow extends JsonObject {
  id: string;
  invite_id: string;
  company_id: string;
  channel: InviteDeliveryAttemptRecord['channel'];
  provider: InviteDeliveryAttemptRecord['provider'];
  status: InviteDeliveryAttemptRecord['status'];
  error_code: string | null;
  requested_by_user_id: string;
  sent_at: string | null;
  created_at: string;
}

export interface TopLevelRow extends JsonObject {
  id: string;
  company_id: string;
  name: string;
  level_index: number;
  parent_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitRow extends JsonObject {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  top_level_id: string | null;
  active: boolean | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionRow extends JsonObject {
  id: string;
  user_id: string;
  company_id: string;
  refresh_token_hash: string;
  refresh_token_id: string;
  created_at: string;
  updated_at: string;
  last_authenticated_at: string;
  expires_at: string;
  refresh_expires_at: string;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export interface RepositoryRow extends JsonObject {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  banner_image: string | null;
  featured: boolean | null;
  show_in_landing: boolean | null;
  type: RepositoryRecord['type'] | null;
  status: RepositoryRecord['status'] | null;
  access_type: RepositoryRecord['accessType'] | null;
  allowed_user_ids: unknown;
  allowed_region_ids: unknown;
  allowed_store_ids: unknown;
  excluded_user_ids: unknown;
  banner_position: number | null;
  banner_brightness: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow extends JsonObject {
  id: string;
  repository_id: string;
  name: string;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentRow extends JsonObject {
  id: string;
  company_id: string;
  repository_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  type: ContentRecord['type'];
  url: string;
  embed_url: string | null;
  featured: boolean | null;
  recent: boolean | null;
  status: ContentRecord['status'] | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SimpleLinkRow extends JsonObject {
  id: string;
  company_id: string;
  repository_id: string;
  name: string;
  url: string;
  type: string | null;
  date: string | null;
  status: SimpleLinkRecord['status'] | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentViewRow extends JsonObject {
  id: string;
  user_id: string | null;
  content_id: string;
  company_id: string;
  repository_id: string;
  content_type: string;
  org_unit_id: string | null;
  viewed_at: string;
}

export interface ContentRatingRow extends JsonObject {
  id: string;
  user_id: string | null;
  content_id: string;
  company_id: string;
  repository_id: string;
  rating: number | string;
  org_unit_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseRow extends JsonObject {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  cover_image: string | null;
  image_url: string | null;
  status: CourseRecord['status'] | null;
  access_type: CourseRecord['accessType'] | null;
  allowed_user_ids: string[] | null;
  allowed_region_ids: string[] | null;
  allowed_store_ids: string[] | null;
  excluded_user_ids: string[] | null;
  target_audience: string[] | null;
  passing_score: number | null;
  diploma_template: string | null;
  layout_template?: CourseLayoutTemplate | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CourseModuleRow extends JsonObject {
  id: string;
  course_id: string;
  company_id: string | null;
  title: string;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CourseContentRow extends JsonObject {
  id: string;
  company_id: string;
  module_id: string;
  title: string;
  description: string | null;
  type: CourseContentRecord['type'] | null;
  url: string | null;
  content_url: string | null;
  file_path: string | null;
  size_bytes: number | null;
  html_content: string | null;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CoursePhaseQuestionRow extends JsonObject {
  id: string;
  module_id: string;
  question_text: string;
  question_type: CoursePhaseQuestionRecord['questionType'] | null;
  configuration: unknown | null;
  image_url: string | null;
  explanation: string | null;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CourseQuestionOptionRow extends JsonObject {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean | null;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CourseEnrollmentRow extends JsonObject {
  id: string;
  course_id: string;
  user_id: string;
  company_id: string;
  status: CourseEnrollmentRecord['status'] | null;
  started_at: string | null;
  completed_at: string | null;
  score_percent: number | null;
  total_correct: number | null;
  total_questions: number | null;
  time_spent_seconds: number | null;
  current_module_id: string | null;
  current_content_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CourseAnswerRow extends JsonObject {
  id: string;
  enrollment_id: string;
  question_id: string;
  selected_option_id: string | null;
  completed_answer_id: string | null;
  complex_answer: unknown | null;
  is_correct: boolean;
  answered_at: string;
}

export interface QuizRow extends JsonObject {
  id: string;
  company_id: string | null;
  content_id: string | null;
  course_content_id: string | null;
  title: string | null;
  passing_score: number | null;
  time_limit: number | null;
  shuffle_questions: boolean | null;
  points_reward: number | null;
  deleted_at: string | null;
  created_at: string;
}

export interface QuizQuestionRow extends JsonObject {
  id: string;
  quiz_id: string;
  question_text: string;
  explanation: string | null;
  source_excerpt: string | null;
  order_index: number | null;
  deleted_at: string | null;
}

export interface QuizOptionRow extends JsonObject {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean | null;
  order_index: number | null;
  deleted_at: string | null;
}

export interface QuizAttemptRow extends JsonObject {
  id: string;
  company_id: string;
  user_id: string | null;
  quiz_id: string;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  completed_at: string;
}

export interface SurveyRow extends JsonObject {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  status: SurveyRecord['status'] | null;
  access_type: SurveyRecord['accessType'] | null;
  allowed_user_ids: unknown;
  allowed_region_ids: unknown;
  allowed_store_ids: unknown;
  excluded_user_ids: unknown;
  allow_multiple_responses: boolean | null;
  anonymous: boolean | null;
  starts_at: string | null;
  ends_at: string | null;
  cover_image: string | null;
  created_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyQuestionRow extends JsonObject {
  id: string;
  survey_id: string;
  question_text: string;
  description: string | null;
  question_type: SurveyQuestionRecord['questionType'];
  configuration: unknown;
  required: boolean | null;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyResponseRow extends JsonObject {
  id: string;
  survey_id: string;
  company_id: string;
  user_id: string | null;
  org_unit_id: string | null;
  org_top_level_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SurveyAnswerRow extends JsonObject {
  id: string;
  response_id: string;
  question_id: string;
  value: unknown;
  created_at: string;
}

const defaultTheme: CompanyTheme = {
  primary: '#111827',
  secondary: '#1f2937',
  accent: '#f59e0b',
  surface: '#ffffff',
  text: '#111827',
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function courseLayoutTemplate(value: unknown): CourseLayoutTemplate {
  return value === 'studio' || value === 'journey' ? value : 'focus';
}

function theme(value: unknown): CompanyTheme {
  if (!value || typeof value !== 'object') return defaultTheme;
  const record = value as JsonObject;

  return {
    primary: typeof record.primary === 'string' ? record.primary : defaultTheme.primary,
    secondary: typeof record.secondary === 'string' ? record.secondary : defaultTheme.secondary,
    accent: typeof record.accent === 'string' ? record.accent : defaultTheme.accent,
    surface: typeof record.surface === 'string' ? record.surface : defaultTheme.surface,
    text: typeof record.text === 'string' ? record.text : defaultTheme.text,
  };
}

function companyFeatures(row: CompanyRow): CompanyFeatureFlags {
  return {
    repositories: row.repositories_enabled ?? true,
    lms: row.lms_enabled ?? true,
    checklists: row.checklists_enabled ?? false,
    surveys: row.surveys_enabled ?? false,
    metrics: row.metrics_enabled ?? true,
  };
}

function companyBranding(row: CompanyRow): CompanyBranding {
  return {
    logoUrl: row.logo_url,
    faviconUrl: row.favicon_url,
    theme: theme(row.theme),
    hero: {
      title: row.hero_title ?? row.name,
      subtitle: row.hero_subtitle ?? '',
      ctaLabel: row.hero_cta_label,
      imageUrl: row.hero_image,
    },
  };
}

function companyGeneral(row: CompanyRow): CompanyGeneralSettings {
  return {
    orgLevels: stringArray(row.org_levels),
    orgUnitName: row.org_unit_name ?? 'Unidade',
    supportEmail: row.support_email,
  };
}

export function toCompanyRecord(row: CompanyRow): CompanyRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    linkName: row.link_name,
    status: row.status ?? (row.active === false ? 'INACTIVE' : 'ACTIVE'),
    active: row.active ?? true,
    landingPageEnabled: row.landing_page_enabled ?? undefined,
    landingPageActive: row.landing_page_active ?? undefined,
    landingPageLayout: row.landing_page_layout ?? undefined,
    branding: companyBranding(row),
    features: companyFeatures(row),
    general: companyGeneral(row),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromCompanyRecord(company: CompanyRecord): Record<string, unknown> {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    link_name: company.linkName,
    status: company.status,
    active: company.active,
    theme: company.branding.theme,
    logo_url: company.branding.logoUrl,
    favicon_url: company.branding.faviconUrl,
    hero_image: company.branding.hero.imageUrl,
    hero_title: company.branding.hero.title,
    hero_subtitle: company.branding.hero.subtitle,
    hero_cta_label: company.branding.hero.ctaLabel,
    landing_page_enabled: company.landingPageEnabled,
    landing_page_active: company.landingPageActive,
    landing_page_layout: company.landingPageLayout,
    org_levels: company.general.orgLevels,
    org_unit_name: company.general.orgUnitName,
    support_email: company.general.supportEmail,
    repositories_enabled: company.features.repositories,
    lms_enabled: company.features.lms,
    checklists_enabled: company.features.checklists,
    surveys_enabled: company.features.surveys,
    metrics_enabled: company.features.metrics,
    deleted_at: company.deletedAt,
    created_at: company.createdAt,
    updated_at: company.updatedAt,
  };
}

export function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    email: row.email,
    normalizedEmail: row.normalized_email ?? row.email.toLowerCase(),
    cpf: row.cpf,
    role: row.role,
    status: row.status ?? (row.active === false ? 'INACTIVE' : 'ACTIVE'),
    active: row.active ?? true,
    firstAccess: row.first_access ?? false,
    onboardingCompleted: row.onboarding_completed ?? false,
    avatarUrl: row.avatar_url,
    orgUnitId: row.org_unit_id,
    passwordHash: row.password_hash,
    passwordUpdatedAt: row.password_updated_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromUserRecord(user: UserRecord): Record<string, unknown> {
  return {
    id: user.id,
    company_id: user.companyId,
    name: user.name,
    email: user.email,
    normalized_email: user.normalizedEmail,
    cpf: user.cpf,
    role: user.role,
    status: user.status,
    active: user.active,
    first_access: user.firstAccess,
    onboarding_completed: user.onboardingCompleted ?? false,
    avatar_url: user.avatarUrl,
    org_unit_id: user.orgUnitId,
    password_hash: user.passwordHash,
    password_updated_at: user.passwordUpdatedAt,
    deleted_at: user.deletedAt,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

export function toInviteRecord(row: InviteRow): InviteRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    email: row.email,
    normalizedEmail: row.normalized_email ?? row.email.toLowerCase(),
    cpf: row.cpf,
    role: row.role,
    orgUnitId: row.org_unit_id,
    token: row.token,
    status: row.status,
    invitedByUserId: row.invited_by_user_id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    activatedAt: row.activated_at,
    cancelledAt: row.cancelled_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromInviteRecord(invite: InviteRecord): Record<string, unknown> {
  return {
    id: invite.id,
    company_id: invite.companyId,
    name: invite.name,
    email: invite.email,
    normalized_email: invite.normalizedEmail,
    cpf: invite.cpf,
    role: invite.role,
    org_unit_id: invite.orgUnitId,
    token: invite.token,
    status: invite.status,
    invited_by_user_id: invite.invitedByUserId,
    user_id: invite.userId,
    expires_at: invite.expiresAt,
    activated_at: invite.activatedAt,
    cancelled_at: invite.cancelledAt,
    deleted_at: invite.deletedAt,
    created_at: invite.createdAt,
    updated_at: invite.updatedAt,
  };
}

export function toInviteDeliveryAttemptRecord(row: InviteDeliveryAttemptRow): InviteDeliveryAttemptRecord {
  return {
    id: row.id,
    inviteId: row.invite_id,
    companyId: row.company_id,
    channel: row.channel,
    provider: row.provider,
    status: row.status,
    errorCode: row.error_code,
    requestedByUserId: row.requested_by_user_id,
    sentAt: row.sent_at,
    createdAt: row.created_at,
  };
}

export function fromInviteDeliveryAttemptRecord(attempt: InviteDeliveryAttemptRecord): Record<string, unknown> {
  return {
    id: attempt.id,
    invite_id: attempt.inviteId,
    company_id: attempt.companyId,
    channel: attempt.channel,
    provider: attempt.provider,
    status: attempt.status,
    error_code: attempt.errorCode,
    requested_by_user_id: attempt.requestedByUserId,
    sent_at: attempt.sentAt,
    created_at: attempt.createdAt,
  };
}

export function toTopLevelRecord(row: TopLevelRow): OrgTopLevelRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    levelIndex: row.level_index,
    parentId: row.parent_id,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromTopLevelRecord(topLevel: OrgTopLevelRecord): Record<string, unknown> {
  return {
    id: topLevel.id,
    company_id: topLevel.companyId,
    name: topLevel.name,
    level_index: topLevel.levelIndex,
    parent_id: topLevel.parentId,
    deleted_at: topLevel.deletedAt,
    created_at: topLevel.createdAt,
    updated_at: topLevel.updatedAt,
  };
}

export function toUnitRecord(row: UnitRow): OrgUnitRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    code: row.code,
    topLevelId: row.top_level_id,
    active: row.active ?? true,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromUnitRecord(unit: OrgUnitRecord): Record<string, unknown> {
  return {
    id: unit.id,
    company_id: unit.companyId,
    name: unit.name,
    code: unit.code,
    top_level_id: unit.topLevelId,
    active: unit.active,
    deleted_at: unit.deletedAt,
    created_at: unit.createdAt,
    updated_at: unit.updatedAt,
  };
}

export function toSessionRecord(row: SessionRow): AuthSessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    companyId: row.company_id,
    refreshTokenHash: row.refresh_token_hash,
    refreshTokenId: row.refresh_token_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastAuthenticatedAt: row.last_authenticated_at,
    expiresAt: row.expires_at,
    refreshExpiresAt: row.refresh_expires_at,
    revokedAt: row.revoked_at,
    revokedReason: row.revoked_reason,
  };
}

export function fromSessionRecord(session: AuthSessionRecord): Record<string, unknown> {
  return {
    id: session.id,
    user_id: session.userId,
    company_id: session.companyId,
    refresh_token_hash: session.refreshTokenHash,
    refresh_token_id: session.refreshTokenId,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    last_authenticated_at: session.lastAuthenticatedAt,
    expires_at: session.expiresAt,
    refresh_expires_at: session.refreshExpiresAt,
    revoked_at: session.revokedAt,
    revoked_reason: session.revokedReason,
  };
}

export function toRepositoryRecord(row: RepositoryRow): RepositoryRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    description: row.description ?? '',
    type: row.type ?? 'FULL',
    coverImage: row.cover_image,
    bannerImage: row.banner_image,
    bannerPosition: row.banner_position,
    bannerBrightness: row.banner_brightness,
    featured: row.featured ?? false,
    showInLanding: row.show_in_landing ?? false,
    status: row.status ?? 'ACTIVE',
    accessType: row.access_type ?? 'ALL',
    allowedUserIds: stringArray(row.allowed_user_ids),
    allowedRegionIds: stringArray(row.allowed_region_ids),
    allowedStoreIds: stringArray(row.allowed_store_ids),
    excludedUserIds: stringArray(row.excluded_user_ids),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromRepositoryRecord(repository: RepositoryRecord): Record<string, unknown> {
  return {
    id: repository.id,
    company_id: repository.companyId,
    name: repository.name,
    description: repository.description,
    cover_image: repository.coverImage,
    banner_image: repository.bannerImage,
    featured: repository.featured,
    show_in_landing: repository.showInLanding,
    type: repository.type,
    status: repository.status,
    access_type: repository.accessType,
    allowed_user_ids: repository.allowedUserIds,
    allowed_region_ids: repository.allowedRegionIds,
    allowed_store_ids: repository.allowedStoreIds,
    excluded_user_ids: repository.excludedUserIds,
    banner_position: repository.bannerPosition,
    banner_brightness: repository.bannerBrightness,
    deleted_at: repository.deletedAt,
    created_at: repository.createdAt,
    updated_at: repository.updatedAt,
  };
}

export function toCategoryRecord(row: CategoryRow): CategoryRecord {
  return {
    id: row.id,
    repositoryId: row.repository_id,
    name: row.name,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromCategoryRecord(category: CategoryRecord): Record<string, unknown> {
  return {
    id: category.id,
    repository_id: category.repositoryId,
    name: category.name,
    order_index: category.orderIndex,
    deleted_at: category.deletedAt,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  };
}

export function toContentRecord(row: ContentRow): ContentRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    repositoryId: row.repository_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description ?? '',
    thumbnailUrl: row.thumbnail_url,
    type: row.type,
    url: row.url,
    embedUrl: row.embed_url,
    featured: row.featured ?? false,
    recent: row.recent ?? false,
    status: row.status ?? 'ACTIVE',
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromContentRecord(content: ContentRecord): Record<string, unknown> {
  return {
    id: content.id,
    company_id: content.companyId,
    repository_id: content.repositoryId,
    category_id: content.categoryId,
    title: content.title,
    description: content.description,
    thumbnail_url: content.thumbnailUrl,
    type: content.type,
    url: content.url,
    embed_url: content.embedUrl,
    featured: content.featured,
    recent: content.recent,
    status: content.status,
    deleted_at: content.deletedAt,
    created_at: content.createdAt,
    updated_at: content.updatedAt,
  };
}

export function toSimpleLinkRecord(row: SimpleLinkRow): SimpleLinkRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    repositoryId: row.repository_id,
    name: row.name,
    url: row.url,
    type: row.type ?? 'LINK',
    date: row.date,
    status: row.status ?? 'ACTIVE',
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromSimpleLinkRecord(simpleLink: SimpleLinkRecord): Record<string, unknown> {
  return {
    id: simpleLink.id,
    company_id: simpleLink.companyId,
    repository_id: simpleLink.repositoryId,
    name: simpleLink.name,
    url: simpleLink.url,
    type: simpleLink.type,
    date: simpleLink.date,
    status: simpleLink.status,
    deleted_at: simpleLink.deletedAt,
    created_at: simpleLink.createdAt,
    updated_at: simpleLink.updatedAt,
  };
}

export function toContentViewRecord(row: ContentViewRow): ContentViewRecord {
  return {
    id: row.id,
    userId: row.user_id,
    contentId: row.content_id,
    companyId: row.company_id,
    repositoryId: row.repository_id,
    contentType: row.content_type,
    orgUnitId: row.org_unit_id,
    createdAt: row.viewed_at,
  };
}

export function fromContentViewRecord(view: ContentViewRecord): Record<string, unknown> {
  return {
    id: view.id,
    user_id: view.userId,
    content_id: view.contentId,
    company_id: view.companyId,
    repository_id: view.repositoryId,
    content_type: view.contentType,
    org_unit_id: view.orgUnitId,
    viewed_at: view.createdAt,
  };
}

export function toContentRatingRecord(row: ContentRatingRow): ContentRatingRecord {
  const rating = typeof row.rating === 'number' ? row.rating : Number(row.rating);
  return {
    id: row.id,
    userId: row.user_id,
    contentId: row.content_id,
    companyId: row.company_id,
    repositoryId: row.repository_id,
    rating: Number.isFinite(rating) ? rating : 0,
    orgUnitId: row.org_unit_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromContentRatingRecord(rating: ContentRatingRecord): Record<string, unknown> {
  return {
    id: rating.id,
    user_id: rating.userId,
    content_id: rating.contentId,
    company_id: rating.companyId,
    repository_id: rating.repositoryId,
    rating: rating.rating,
    org_unit_id: rating.orgUnitId,
    created_at: rating.createdAt,
    updated_at: rating.updatedAt,
  };
}

export function toCourseRecord(row: CourseRow): CourseRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    description: row.description ?? '',
    thumbnailUrl: row.thumbnail_url,
    coverImage: row.cover_image,
    imageUrl: row.image_url,
    status: row.status ?? 'DRAFT',
    accessType: row.access_type ?? 'ALL',
    allowedUserIds: stringArray(row.allowed_user_ids),
    allowedRegionIds: stringArray(row.allowed_region_ids),
    allowedStoreIds: stringArray(row.allowed_store_ids),
    excludedUserIds: stringArray(row.excluded_user_ids),
    targetAudience: stringArray(row.target_audience),
    passingScore: row.passing_score ?? 70,
    diplomaTemplate: row.diploma_template ?? 'azul',
    layoutTemplate: courseLayoutTemplate(row.layout_template),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export function fromCourseRecord(course: CourseRecord): Record<string, unknown> {
  return {
    id: course.id,
    company_id: course.companyId,
    title: course.title,
    description: course.description,
    thumbnail_url: course.thumbnailUrl,
    cover_image: course.coverImage,
    image_url: course.imageUrl,
    status: course.status,
    access_type: course.accessType,
    allowed_user_ids: course.allowedUserIds,
    allowed_region_ids: course.allowedRegionIds,
    allowed_store_ids: course.allowedStoreIds,
    excluded_user_ids: course.excludedUserIds,
    target_audience: course.targetAudience,
    passing_score: course.passingScore,
    diploma_template: course.diplomaTemplate,
    layout_template: course.layoutTemplate,
    deleted_at: course.deletedAt,
    created_at: course.createdAt,
    updated_at: course.updatedAt,
  };
}

export function toCourseModuleRecord(row: CourseModuleRow): CourseModuleRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    companyId: row.company_id,
    title: row.title,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export function fromCourseModuleRecord(module: CourseModuleRecord): Record<string, unknown> {
  return {
    id: module.id,
    course_id: module.courseId,
    company_id: module.companyId,
    title: module.title,
    order_index: module.orderIndex,
    deleted_at: module.deletedAt,
    created_at: module.createdAt,
    updated_at: module.updatedAt,
  };
}

export function toCourseContentRecord(row: CourseContentRow): CourseContentRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    moduleId: row.module_id,
    title: row.title,
    description: row.description ?? '',
    type: row.type ?? 'DOCUMENT',
    url: row.url ?? '',
    contentUrl: row.content_url,
    filePath: row.file_path,
    sizeBytes: row.size_bytes,
    htmlContent: row.html_content,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export function fromCourseContentRecord(content: CourseContentRecord): Record<string, unknown> {
  return {
    id: content.id,
    company_id: content.companyId,
    module_id: content.moduleId,
    title: content.title,
    description: content.description,
    type: content.type,
    url: content.url,
    content_url: content.contentUrl,
    file_path: content.filePath,
    size_bytes: content.sizeBytes,
    html_content: content.htmlContent,
    order_index: content.orderIndex,
    deleted_at: content.deletedAt,
    created_at: content.createdAt,
    updated_at: content.updatedAt,
  };
}

export function toCoursePhaseQuestionRecord(row: CoursePhaseQuestionRow): CoursePhaseQuestionRecord {
  return {
    id: row.id,
    moduleId: row.module_id,
    questionText: row.question_text,
    questionType: row.question_type ?? 'MULTIPLE_CHOICE',
    configuration: row.configuration,
    imageUrl: row.image_url,
    explanation: row.explanation,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export function fromCoursePhaseQuestionRecord(question: CoursePhaseQuestionRecord): Record<string, unknown> {
  return {
    id: question.id,
    module_id: question.moduleId,
    question_text: question.questionText,
    question_type: question.questionType,
    configuration: question.configuration,
    image_url: question.imageUrl,
    explanation: question.explanation,
    order_index: question.orderIndex,
    deleted_at: question.deletedAt,
    created_at: question.createdAt,
    updated_at: question.updatedAt,
  };
}

export function toCourseQuestionOptionRecord(row: CourseQuestionOptionRow): CourseQuestionOptionRecord {
  return {
    id: row.id,
    questionId: row.question_id,
    optionText: row.option_text,
    isCorrect: row.is_correct ?? false,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? row.created_at ?? '',
  };
}

export function fromCourseQuestionOptionRecord(option: CourseQuestionOptionRecord): Record<string, unknown> {
  return {
    id: option.id,
    question_id: option.questionId,
    option_text: option.optionText,
    is_correct: option.isCorrect,
    order_index: option.orderIndex,
    deleted_at: option.deletedAt,
    created_at: option.createdAt,
    updated_at: option.updatedAt,
  };
}

export function toCourseEnrollmentRecord(row: CourseEnrollmentRow): CourseEnrollmentRecord {
  return {
    id: row.id,
    courseId: row.course_id,
    userId: row.user_id,
    companyId: row.company_id,
    status: row.status ?? 'IN_PROGRESS',
    startedAt: row.started_at ?? row.created_at,
    completedAt: row.completed_at,
    scorePercent: row.score_percent,
    totalCorrect: row.total_correct,
    totalQuestions: row.total_questions,
    timeSpentSeconds: row.time_spent_seconds,
    currentModuleId: row.current_module_id,
    currentContentId: row.current_content_id,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export function fromCourseEnrollmentRecord(enrollment: CourseEnrollmentRecord): Record<string, unknown> {
  return {
    id: enrollment.id,
    course_id: enrollment.courseId,
    user_id: enrollment.userId,
    company_id: enrollment.companyId,
    status: enrollment.status,
    started_at: enrollment.startedAt,
    completed_at: enrollment.completedAt,
    score_percent: enrollment.scorePercent,
    total_correct: enrollment.totalCorrect,
    total_questions: enrollment.totalQuestions,
    time_spent_seconds: enrollment.timeSpentSeconds,
    current_module_id: enrollment.currentModuleId,
    current_content_id: enrollment.currentContentId,
    deleted_at: enrollment.deletedAt,
    created_at: enrollment.createdAt,
    updated_at: enrollment.updatedAt,
  };
}

export function toCourseAnswerRecord(row: CourseAnswerRow): CourseAnswerRecord {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    questionId: row.question_id,
    selectedOptionId: row.selected_option_id,
    completedAnswerId: row.completed_answer_id,
    complexAnswer: row.complex_answer,
    isCorrect: row.is_correct,
    answeredAt: row.answered_at,
  };
}

export function fromCourseAnswerRecord(answer: CourseAnswerRecord): Record<string, unknown> {
  return {
    id: answer.id,
    enrollment_id: answer.enrollmentId,
    question_id: answer.questionId,
    selected_option_id: answer.selectedOptionId,
    completed_answer_id: answer.completedAnswerId,
    complex_answer: answer.complexAnswer,
    is_correct: answer.isCorrect,
    answered_at: answer.answeredAt,
  };
}

export function toQuizRecord(row: QuizRow): QuizRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    contentId: row.content_id,
    courseContentId: row.course_content_id,
    title: row.title,
    passingScore: row.passing_score ?? 70,
    timeLimit: row.time_limit,
    shuffleQuestions: row.shuffle_questions ?? false,
    pointsReward: row.points_reward ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
  };
}

export function toQuizQuestionRecord(row: QuizQuestionRow): QuizQuestionRecord {
  return {
    id: row.id,
    quizId: row.quiz_id,
    questionText: row.question_text,
    explanation: row.explanation,
    sourceExcerpt: row.source_excerpt,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
  };
}

export function toQuizOptionRecord(row: QuizOptionRow): QuizOptionRecord {
  return {
    id: row.id,
    questionId: row.question_id,
    optionText: row.option_text,
    isCorrect: row.is_correct ?? false,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
  };
}

export function fromQuizAttemptRecord(attempt: QuizAttemptRecord): Record<string, unknown> {
  return {
    id: attempt.id,
    company_id: attempt.companyId,
    user_id: attempt.userId,
    quiz_id: attempt.quizId,
    score: attempt.score,
    passed: attempt.passed,
    answers: attempt.answers,
    completed_at: attempt.completedAt,
  };
}

export function toQuizAttemptRecord(row: QuizAttemptRow): QuizAttemptRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id,
    quizId: row.quiz_id,
    score: row.score,
    passed: row.passed,
    answers: row.answers,
    completedAt: row.completed_at,
  };
}

/* ------------------------------------------------------------------ */
/*  Checklists                                                        */
/* ------------------------------------------------------------------ */

export const CHECKLIST_SELECT =
  'id,company_id,title,description,cover_image,status,access_type,allowed_user_ids,allowed_region_ids,allowed_store_ids,excluded_user_ids,folder_id,deleted_at,created_at,updated_at';
export const CHECKLIST_FOLDER_SELECT = 'id,company_id,name,order_index,deleted_at,created_at,updated_at';
export const CHECKLIST_SECTION_SELECT = 'id,checklist_id,title,order_index,deleted_at,created_at,updated_at';
export type ChecklistQuestionColumnMode = 'compatible' | 'modern' | 'legacy';
export const CHECKLIST_QUESTION_SELECT =
  'id,checklist_id,section_id,text,type,required,config,order_index,deleted_at,created_at,updated_at';
export const CHECKLIST_QUESTION_COMPAT_SELECT =
  'id,checklist_id,section_id,text,type,question_text,question_type,required,config,configuration,order_index,deleted_at,created_at,updated_at';
export const CHECKLIST_QUESTION_LEGACY_SELECT =
  'id,checklist_id,section_id,question_text,question_type,required,configuration,order_index,deleted_at,created_at,updated_at';
export const CHECKLIST_SUBMISSION_SELECT =
  'id,checklist_id,company_id,user_id,org_unit_id,status,score,started_at,completed_at,deleted_at,created_at,updated_at';
export const CHECKLIST_ANSWER_SELECT =
  'id,submission_id,question_id,value,text_value,numeric_value,boolean_value,attachment_urls,conformity,notes,answered_at';
export const ACTION_PLAN_SELECT =
  'id,company_id,submission_id,answer_id,checklist_id,title,description,status,priority,assignee_user_id,due_date,completed_at,created_by_user_id,deleted_at,created_at,updated_at';

export interface ChecklistRow extends JsonObject {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  status: ChecklistRecord['status'] | null;
  access_type: ChecklistRecord['accessType'] | null;
  allowed_user_ids: unknown;
  allowed_region_ids: unknown;
  allowed_store_ids: unknown;
  excluded_user_ids: unknown;
  folder_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistFolderRow extends JsonObject {
  id: string;
  company_id: string;
  name: string;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSectionRow extends JsonObject {
  id: string;
  checklist_id: string;
  title: string;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistQuestionRow extends JsonObject {
  id: string;
  checklist_id: string;
  section_id: string | null;
  text?: string | null;
  type?: ChecklistQuestionRecord['questionType'] | null;
  question_text?: string | null;
  question_type?: ChecklistQuestionRecord['questionType'] | null;
  required: boolean | null;
  config?: unknown | null;
  configuration?: unknown | null;
  order_index: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistSubmissionRow extends JsonObject {
  id: string;
  checklist_id: string;
  company_id: string;
  user_id: string;
  org_unit_id: string | null;
  status: ChecklistSubmissionRecord['status'] | null;
  score: number | null;
  started_at: string | null;
  completed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChecklistAnswerRow extends JsonObject {
  id: string;
  submission_id: string;
  question_id: string;
  value: unknown | null;
  text_value: string | null;
  numeric_value: number | null;
  boolean_value: boolean | null;
  attachment_urls: unknown;
  conformity: string | null;
  notes: string | null;
  answered_at: string;
}

export interface ActionPlanRow extends JsonObject {
  id: string;
  company_id: string;
  submission_id: string | null;
  answer_id: string | null;
  checklist_id: string | null;
  title: string;
  description: string | null;
  status: ActionPlanRecord['status'] | null;
  priority: ActionPlanRecord['priority'] | null;
  assignee_user_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by_user_id: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export function toChecklistRecord(row: ChecklistRow): ChecklistRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    description: row.description ?? '',
    coverImage: row.cover_image,
    status: row.status ?? 'DRAFT',
    accessType: row.access_type ?? 'ALL',
    allowedUserIds: stringArray(row.allowed_user_ids),
    allowedRegionIds: stringArray(row.allowed_region_ids),
    allowedStoreIds: stringArray(row.allowed_store_ids),
    excludedUserIds: stringArray(row.excluded_user_ids),
    folderId: row.folder_id,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromChecklistRecord(c: ChecklistRecord): Record<string, unknown> {
  return {
    id: c.id,
    company_id: c.companyId,
    title: c.title,
    description: c.description,
    cover_image: c.coverImage,
    status: c.status,
    access_type: c.accessType,
    allowed_user_ids: c.allowedUserIds,
    allowed_region_ids: c.allowedRegionIds,
    allowed_store_ids: c.allowedStoreIds,
    excluded_user_ids: c.excludedUserIds,
    folder_id: c.folderId,
    deleted_at: c.deletedAt,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export function toChecklistFolderRecord(row: ChecklistFolderRow): ChecklistFolderRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromChecklistFolderRecord(f: ChecklistFolderRecord): Record<string, unknown> {
  return {
    id: f.id,
    company_id: f.companyId,
    name: f.name,
    order_index: f.orderIndex,
    deleted_at: f.deletedAt,
    created_at: f.createdAt,
    updated_at: f.updatedAt,
  };
}

export function toChecklistSectionRecord(row: ChecklistSectionRow): ChecklistSectionRecord {
  return {
    id: row.id,
    checklistId: row.checklist_id,
    title: row.title,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromChecklistSectionRecord(s: ChecklistSectionRecord): Record<string, unknown> {
  return {
    id: s.id,
    checklist_id: s.checklistId,
    title: s.title,
    order_index: s.orderIndex,
    deleted_at: s.deletedAt,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export function toChecklistQuestionRecord(row: ChecklistQuestionRow): ChecklistQuestionRecord {
  return {
    id: row.id,
    checklistId: row.checklist_id,
    sectionId: row.section_id,
    questionText: row.text ?? row.question_text ?? '',
    questionType: row.type ?? row.question_type ?? 'COMPLIANCE',
    required: row.required ?? false,
    configuration: row.config ?? row.configuration ?? null,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromChecklistQuestionRecord(
  q: ChecklistQuestionRecord,
  mode: ChecklistQuestionColumnMode = 'compatible',
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    id: q.id,
    checklist_id: q.checklistId,
    section_id: q.sectionId,
    required: q.required,
    order_index: q.orderIndex,
    deleted_at: q.deletedAt,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
  };
  return withChecklistQuestionColumnMode(base, q, mode);
}

export function fromChecklistQuestionPatch(
  patch: Partial<Pick<ChecklistQuestionRecord, 'sectionId' | 'questionText' | 'questionType' | 'required' | 'configuration' | 'orderIndex' | 'deletedAt' | 'updatedAt'>>,
  mode: ChecklistQuestionColumnMode = 'compatible',
): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  if ('sectionId' in patch) base.section_id = patch.sectionId;
  if ('required' in patch) base.required = patch.required;
  if ('orderIndex' in patch) base.order_index = patch.orderIndex;
  if ('deletedAt' in patch) base.deleted_at = patch.deletedAt;
  if ('updatedAt' in patch) base.updated_at = patch.updatedAt;
  return withChecklistQuestionColumnMode(base, patch, mode);
}

function withChecklistQuestionColumnMode(
  base: Record<string, unknown>,
  values: Partial<Pick<ChecklistQuestionRecord, 'questionText' | 'questionType' | 'configuration'>>,
  mode: ChecklistQuestionColumnMode,
): Record<string, unknown> {
  if ('questionText' in values && mode !== 'legacy') base.text = values.questionText;
  if ('questionType' in values && mode !== 'legacy') base.type = values.questionType;
  if ('configuration' in values && mode !== 'legacy') base.config = values.configuration;
  if ('questionText' in values && mode !== 'modern') base.question_text = values.questionText;
  if ('questionType' in values && mode !== 'modern') base.question_type = values.questionType;
  if ('configuration' in values && mode !== 'modern') base.configuration = values.configuration;
  return base;
}

export function toChecklistSubmissionRecord(row: ChecklistSubmissionRow): ChecklistSubmissionRecord {
  return {
    id: row.id,
    checklistId: row.checklist_id,
    companyId: row.company_id,
    userId: row.user_id,
    orgUnitId: row.org_unit_id,
    status: row.status ?? 'IN_PROGRESS',
    score: row.score,
    startedAt: row.started_at ?? row.created_at,
    completedAt: row.completed_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromChecklistSubmissionRecord(s: ChecklistSubmissionRecord): Record<string, unknown> {
  return {
    id: s.id,
    checklist_id: s.checklistId,
    company_id: s.companyId,
    user_id: s.userId,
    org_unit_id: s.orgUnitId,
    status: s.status,
    score: s.score,
    started_at: s.startedAt,
    completed_at: s.completedAt,
    deleted_at: s.deletedAt,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export function toChecklistAnswerRecord(row: ChecklistAnswerRow): ChecklistAnswerRecord {
  return {
    id: row.id,
    submissionId: row.submission_id,
    questionId: row.question_id,
    value: row.value,
    textValue: row.text_value,
    numericValue: row.numeric_value,
    booleanValue: row.boolean_value,
    attachmentUrls: stringArray(row.attachment_urls),
    conformity: (row.conformity as ChecklistAnswerRecord['conformity']) ?? null,
    notes: row.notes,
    answeredAt: row.answered_at,
  };
}

export function fromChecklistAnswerRecord(a: ChecklistAnswerRecord): Record<string, unknown> {
  return {
    id: a.id,
    submission_id: a.submissionId,
    question_id: a.questionId,
    value: a.value,
    text_value: a.textValue,
    numeric_value: a.numericValue,
    boolean_value: a.booleanValue,
    attachment_urls: a.attachmentUrls,
    conformity: a.conformity,
    notes: a.notes,
    answered_at: a.answeredAt,
  };
}

export function toActionPlanRecord(row: ActionPlanRow): ActionPlanRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    submissionId: row.submission_id,
    answerId: row.answer_id,
    checklistId: row.checklist_id,
    title: row.title,
    description: row.description ?? '',
    status: row.status ?? 'OPEN',
    priority: row.priority ?? 'MEDIUM',
    assigneeUserId: row.assignee_user_id,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdByUserId: row.created_by_user_id,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromActionPlanRecord(p: ActionPlanRecord): Record<string, unknown> {
  return {
    id: p.id,
    company_id: p.companyId,
    submission_id: p.submissionId,
    answer_id: p.answerId,
    checklist_id: p.checklistId,
    title: p.title,
    description: p.description,
    status: p.status,
    priority: p.priority,
    assignee_user_id: p.assigneeUserId,
    due_date: p.dueDate,
    completed_at: p.completedAt,
    created_by_user_id: p.createdByUserId,
    deleted_at: p.deletedAt,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function toSurveyRecord(row: SurveyRow): SurveyRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    description: row.description,
    status: row.status ?? 'DRAFT',
    accessType: row.access_type ?? 'ALL',
    allowedUserIds: stringArray(row.allowed_user_ids),
    allowedRegionIds: stringArray(row.allowed_region_ids),
    allowedStoreIds: stringArray(row.allowed_store_ids),
    excludedUserIds: stringArray(row.excluded_user_ids),
    allowMultipleResponses: row.allow_multiple_responses ?? false,
    anonymous: row.anonymous ?? false,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    coverImage: row.cover_image,
    createdBy: row.created_by,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromSurveyRecord(survey: SurveyRecord): Record<string, unknown> {
  return {
    id: survey.id,
    company_id: survey.companyId,
    title: survey.title,
    description: survey.description,
    status: survey.status,
    access_type: survey.accessType,
    allowed_user_ids: survey.allowedUserIds,
    allowed_region_ids: survey.allowedRegionIds,
    allowed_store_ids: survey.allowedStoreIds,
    excluded_user_ids: survey.excludedUserIds,
    allow_multiple_responses: survey.allowMultipleResponses,
    anonymous: survey.anonymous,
    starts_at: survey.startsAt,
    ends_at: survey.endsAt,
    cover_image: survey.coverImage,
    created_by: survey.createdBy,
    deleted_at: survey.deletedAt,
    created_at: survey.createdAt,
    updated_at: survey.updatedAt,
  };
}

export function toSurveyQuestionRecord(row: SurveyQuestionRow): SurveyQuestionRecord {
  return {
    id: row.id,
    surveyId: row.survey_id,
    questionText: row.question_text,
    description: row.description,
    questionType: row.question_type,
    configuration: row.configuration,
    required: row.required ?? true,
    orderIndex: row.order_index ?? 0,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromSurveyQuestionRecord(question: SurveyQuestionRecord): Record<string, unknown> {
  return {
    id: question.id,
    survey_id: question.surveyId,
    question_text: question.questionText,
    description: question.description,
    question_type: question.questionType,
    configuration: question.configuration,
    required: question.required,
    order_index: question.orderIndex,
    deleted_at: question.deletedAt,
    created_at: question.createdAt,
    updated_at: question.updatedAt,
  };
}

export function toSurveyResponseRecord(row: SurveyResponseRow): SurveyResponseRecord {
  return {
    id: row.id,
    surveyId: row.survey_id,
    companyId: row.company_id,
    userId: row.user_id,
    orgUnitId: row.org_unit_id,
    orgTopLevelId: row.org_top_level_id,
    startedAt: row.started_at ?? row.created_at,
    completedAt: row.completed_at ?? row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromSurveyResponseRecord(response: SurveyResponseRecord): Record<string, unknown> {
  return {
    id: response.id,
    survey_id: response.surveyId,
    company_id: response.companyId,
    user_id: response.userId,
    org_unit_id: response.orgUnitId,
    org_top_level_id: response.orgTopLevelId,
    started_at: response.startedAt,
    completed_at: response.completedAt,
    created_at: response.createdAt,
    updated_at: response.updatedAt,
  };
}

export function toSurveyAnswerRecord(row: SurveyAnswerRow): SurveyAnswerRecord {
  return {
    id: row.id,
    responseId: row.response_id,
    questionId: row.question_id,
    value: row.value,
    createdAt: row.created_at,
  };
}

export function fromSurveyAnswerRecord(answer: SurveyAnswerRecord): Record<string, unknown> {
  return {
    id: answer.id,
    response_id: answer.responseId,
    question_id: answer.questionId,
    value: answer.value,
    created_at: answer.createdAt,
  };
}
