import assert from 'node:assert/strict';
import test from 'node:test';
import { SignJWT } from 'jose';
import { buildApp } from '../src/app.js';
import { parseEnv, type AppEnv } from '../src/config/env.js';
import { INVITE_ACTIVATION_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME } from '../src/lib/auth-cookies.js';
import { PasswordService } from '../src/lib/passwords.js';
import { sanitizeHtml } from '../src/lib/sanitize-html.js';
import type { InviteDeliveryProvider, InviteDeliverySendInput } from '../src/services/invite-delivery.service.js';

const SHARED_SECRET = '0123456789abcdef0123456789abcdef';
const COMPANY_ALPHA_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_BETA_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ALPHA_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ADMIN_BETA_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER_ALPHA_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const SUPER_ADMIN_ALPHA_ID = '12121212-1212-4121-8121-121212121212';
const INVITE_ALPHA_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const INVITE_BETA_ID = 'dddddddd-dddd-4ddd-8ddd-eeeeeeeeeeee';
const TOP_LEVEL_ALPHA_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const UNIT_ALPHA_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const UNIT_ALPHA_OTHER_ID = '24242424-2424-4242-8242-242424242424';
const UNIT_BETA_ID = '99999999-9999-4999-8999-999999999999';
const SURVEY_ALPHA_ID = '34343434-3434-4343-8343-343434343434';
const SURVEY_BETA_ID = '45454545-4545-4454-8454-454545454545';
const SURVEY_QUESTION_ALPHA_ID = '56565656-5656-4565-8565-565656565656';
const SURVEY_QUESTION_DELETED_ID = '57575757-5757-4575-8575-575757575757';
const SURVEY_RESPONSE_ALPHA_ID = '58585858-5858-4585-8585-585858585858';
const SURVEY_RESPONSE_BETA_ID = '59595959-5959-4595-8595-595959595959';
const SURVEY_ANSWER_ALPHA_ID = '60606060-6060-4606-8606-606060606060';
const SURVEY_ANSWER_BETA_ID = '61616161-6161-4616-8616-616161616161';
const REPOSITORY_ALPHA_ID = '67676767-6767-4676-8676-676767676767';
const REPOSITORY_BETA_ID = '78787878-7878-4787-8787-787878787878';
const CATEGORY_ALPHA_ID = '89898989-8989-4898-8898-898989898989';
const CONTENT_ALPHA_ID = '90909090-9090-4909-8909-909090909090';
const SIMPLE_LINK_ALPHA_ID = '13131313-1313-4131-8131-131313131313';
const COURSE_ALPHA_ID = '14141414-1414-4141-8141-141414141414';
const COURSE_BETA_ID = '15151515-1515-4151-8151-151515151515';
const COURSE_MODULE_ALPHA_ID = '16161616-1616-4161-8161-161616161616';
const COURSE_CONTENT_ALPHA_ID = '17171717-1717-4171-8171-171717171717';
const COURSE_QUESTION_ALPHA_ID = '18181818-1818-4181-8181-181818181818';
const COURSE_OPTION_ALPHA_ID = '19191919-1919-4191-8191-191919191919';
const QUIZ_ALPHA_ID = '20202020-2020-4202-8202-202020202020';
const QUIZ_QUESTION_ALPHA_ID = '21212121-2121-4212-8212-212121212121';
const QUIZ_OPTION_ALPHA_ID = '23232323-2323-4232-8232-232323232323';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

test('HTML content sanitizer blocks executable markup and preserves allowed course HTML', () => {
  const dirtyHtml = [
    '<h2 onclick="alert(1)">Titulo</h2>',
    '<p>Hello <strong>bold</strong> <em>italic</em></p>',
    '<script>alert(1)</script>',
    '<a href="javascript:alert(1)" onclick="alert(1)" target="_blank">bad link</a>',
    '<a href="https://storepage.test/course" target="_blank">safe link</a>',
    '<img src="https://cdn.storepage.test/image.png" alt="Imagem" onerror="alert(1)">',
    '<img src="data:image/svg+xml,<svg onload=alert(1)>" alt="svg">',
    '<svg><animate onbegin="alert(1)" /></svg>',
    '<iframe src="https://evil.test"></iframe>',
  ].join('');
  const sanitized = sanitizeHtml(dirtyHtml);

  assert.equal(/<script|onclick|onerror|javascript:|<svg|<iframe|data:image\/svg\+xml/i.test(sanitized), false);
  assert.match(sanitized, /<h2>Titulo<\/h2>/);
  assert.match(sanitized, /<p>Hello <strong>bold<\/strong> <em>italic<\/em><\/p>/);
  assert.match(sanitized, /<a[^>]+href="https:\/\/storepage\.test\/course"[^>]*>safe link<\/a>/);
  assert.equal(sanitized.includes('target="_blank"'), true);
  assert.equal(sanitized.includes('rel="noopener noreferrer"'), true);
  assert.match(sanitized, /<img[^>]+src="https:\/\/cdn\.storepage\.test\/image\.png"[^>]*alt="Imagem"/);
});

function createJwtEnv(overrides: Partial<Record<string, string>> = {}): AppEnv {
  return parseEnv({
    NODE_ENV: 'test',
    HOST: '127.0.0.1',
    PORT: '3333',
    API_PREFIX: '/api',
    LOG_LEVEL: 'silent',
    REQUEST_TIMEOUT_MS: '10000',
    CORS_ORIGINS: '*',
    CORS_ALLOW_CREDENTIALS: 'false',
    JWT_AUTH_MODE: 'shared-secret',
    JWT_ISSUER: 'https://auth.storepage.local',
    JWT_AUDIENCE: 'storepage-api',
    JWT_ALLOWED_ALGORITHMS: 'HS256',
    JWT_SHARED_SECRET: SHARED_SECRET,
    JWT_JWKS_URL: '',
    JWT_ROLE_CLAIM: 'role',
    JWT_COMPANY_ID_CLAIM: 'company_id',
    JWT_EMAIL_CLAIM: 'email',
    JWT_CLOCK_TOLERANCE_SECONDS: '0',
    ACCESS_TOKEN_TTL_MINUTES: '15',
    REFRESH_TOKEN_TTL_DAYS: '14',
    PUBLIC_TENANT_CACHE_TTL_SECONDS: '60',
    INVITE_DELIVERY_PROVIDER: 'noop',
    INVITE_ACTIVATION_BASE_URL: 'http://localhost:8080/ativar-convite',
    INVITE_DELIVERY_FROM: '',
    SMTP_HOST: '',
    SMTP_PORT: '587',
    SMTP_USER: '',
    SMTP_PASS: '',
    SMTP_SECURE: 'false',
    ...overrides,
  });
}

function smtpInviteDeliveryEnv(overrides: Partial<Record<string, string>> = {}): Record<string, string> {
  return {
    INVITE_DELIVERY_PROVIDER: 'smtp',
    INVITE_ACTIVATION_BASE_URL: 'https://app.storepage.com/ativar-convite',
    INVITE_DELIVERY_FROM: 'StorePage <no-reply@storepage.com>',
    SMTP_HOST: 'smtp.storepage.com',
    SMTP_PORT: '587',
    SMTP_USER: 'smtp-user',
    SMTP_PASS: 'smtp-pass',
    SMTP_SECURE: 'true',
    ...overrides,
  };
}

class CapturingInviteDeliveryProvider implements InviteDeliveryProvider {
  public readonly name = 'smtp';
  public readonly channel = 'email';
  public readonly calls: InviteDeliverySendInput[] = [];

  public async sendInviteActivation(input: InviteDeliverySendInput): Promise<void> {
    this.calls.push(input);
  }
}

class FailingInviteDeliveryProvider implements InviteDeliveryProvider {
  public readonly name = 'smtp';
  public readonly channel = 'email';

  public async sendInviteActivation(): Promise<void> {
    throw new Error('failed while sending activation URL and token');
  }
}

async function createSeed() {
  const passwordService = new PasswordService();
  const [adminPasswordHash, userPasswordHash] = await Promise.all([
    passwordService.hashPassword('Password123!'),
    passwordService.hashPassword('UserPass123!'),
  ]);
  const now = '2026-04-23T12:00:00.000Z';

  return {
    companies: [
      {
        id: COMPANY_ALPHA_ID,
        name: 'Alpha Store',
        slug: 'alpha-store',
        linkName: 'alpha',
        status: 'ACTIVE' as const,
        active: true,
        branding: {
          logoUrl: 'https://cdn.storepage.test/alpha/logo.png',
          faviconUrl: 'https://cdn.storepage.test/alpha/favicon.ico',
          theme: {
            primary: '#111827',
            secondary: '#1f2937',
            accent: '#f59e0b',
            surface: '#ffffff',
            text: '#111827',
          },
          hero: {
            title: 'Portal Alpha',
            subtitle: 'Treinamentos e operacao do tenant Alpha.',
            ctaLabel: 'Entrar',
            imageUrl: 'https://cdn.storepage.test/alpha/hero.png',
          },
        },
        features: {
          repositories: true,
          lms: true,
          checklists: true,
          surveys: false,
          metrics: true,
        },
        general: {
          orgLevels: ['Regional', 'Distrito'],
          orgUnitName: 'Loja',
          supportEmail: 'support@alpha.test',
        },
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: COMPANY_BETA_ID,
        name: 'Beta Store',
        slug: 'beta-store',
        linkName: 'beta',
        status: 'ACTIVE' as const,
        active: true,
        branding: {
          logoUrl: 'https://cdn.storepage.test/beta/logo.png',
          faviconUrl: null,
          theme: {
            primary: '#0f172a',
            secondary: '#1e293b',
            accent: '#10b981',
            surface: '#ffffff',
            text: '#0f172a',
          },
          hero: {
            title: 'Portal Beta',
            subtitle: 'Contexto publico do tenant Beta.',
            ctaLabel: 'Comecar',
            imageUrl: null,
          },
        },
        features: {
          repositories: true,
          lms: false,
          checklists: false,
          surveys: false,
          metrics: false,
        },
        general: {
          orgLevels: ['Regiao'],
          orgUnitName: 'Filial',
          supportEmail: 'support@beta.test',
        },
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    users: [
      {
        id: ADMIN_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        name: 'Admin Alpha',
        email: 'admin.alpha@storepage.com',
        normalizedEmail: 'admin.alpha@storepage.com',
        cpf: '11111111111',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        active: true,
        firstAccess: false,
        avatarUrl: null,
        orgUnitId: UNIT_ALPHA_ID,
        passwordHash: adminPasswordHash,
        passwordUpdatedAt: now,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ADMIN_BETA_ID,
        companyId: COMPANY_BETA_ID,
        name: 'Admin Beta',
        email: 'admin.beta@storepage.com',
        normalizedEmail: 'admin.beta@storepage.com',
        cpf: '22222222222',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        active: true,
        firstAccess: false,
        avatarUrl: null,
        orgUnitId: UNIT_BETA_ID,
        passwordHash: adminPasswordHash,
        passwordUpdatedAt: now,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: USER_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        name: 'User Alpha',
        email: 'user.alpha@storepage.com',
        normalizedEmail: 'user.alpha@storepage.com',
        cpf: '33333333333',
        role: 'USER' as const,
        status: 'ACTIVE' as const,
        active: true,
        firstAccess: false,
        avatarUrl: null,
        orgUnitId: UNIT_ALPHA_ID,
        passwordHash: userPasswordHash,
        passwordUpdatedAt: now,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: SUPER_ADMIN_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        name: 'Super Admin Alpha',
        email: 'super.admin@storepage.com',
        normalizedEmail: 'super.admin@storepage.com',
        cpf: '99988877766',
        role: 'SUPER_ADMIN' as const,
        status: 'ACTIVE' as const,
        active: true,
        firstAccess: false,
        avatarUrl: null,
        orgUnitId: null,
        passwordHash: adminPasswordHash,
        passwordUpdatedAt: now,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    invites: [
      {
        id: INVITE_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        name: 'Invite Alpha',
        email: 'invite.alpha@storepage.com',
        normalizedEmail: 'invite.alpha@storepage.com',
        cpf: '44444444444',
        role: 'MANAGER' as const,
        orgUnitId: UNIT_ALPHA_ID,
        token: 'invite_token_alpha_pending_12345',
        status: 'PENDING_SETUP' as const,
        invitedByUserId: ADMIN_ALPHA_ID,
        userId: null,
        expiresAt: '2026-06-01T12:00:00.000Z',
        activatedAt: null,
        cancelledAt: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    topLevels: [
      {
        id: TOP_LEVEL_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        name: 'Regional Centro',
        levelIndex: 1,
        parentId: null,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    units: [
      {
        id: UNIT_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        name: 'Loja Centro',
        code: 'ALPHA-01',
        topLevelId: TOP_LEVEL_ALPHA_ID,
        active: true,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: UNIT_ALPHA_OTHER_ID,
        companyId: COMPANY_ALPHA_ID,
        name: 'Loja Norte',
        code: 'ALPHA-02',
        topLevelId: TOP_LEVEL_ALPHA_ID,
        active: true,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: UNIT_BETA_ID,
        companyId: COMPANY_BETA_ID,
        name: 'Filial Sul',
        code: 'BETA-01',
        topLevelId: null,
        active: true,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    repositories: [
      {
        id: REPOSITORY_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        name: 'Biblioteca Alpha',
        description: 'Conteudos operacionais do tenant Alpha.',
        type: 'FULL' as const,
        coverImage: 'https://cdn.storepage.test/alpha/repo.png',
        bannerImage: null,
        bannerPosition: null,
        bannerBrightness: null,
        featured: true,
        showInLanding: true,
        status: 'ACTIVE' as const,
        accessType: 'ALL' as const,
        allowedUserIds: [],
        allowedRegionIds: [],
        allowedStoreIds: [],
        excludedUserIds: [],
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: REPOSITORY_BETA_ID,
        companyId: COMPANY_BETA_ID,
        name: 'Biblioteca Beta',
        description: 'Conteudos do tenant Beta.',
        type: 'FULL' as const,
        coverImage: null,
        bannerImage: null,
        bannerPosition: null,
        bannerBrightness: null,
        featured: false,
        showInLanding: false,
        status: 'ACTIVE' as const,
        accessType: 'ALL' as const,
        allowedUserIds: [],
        allowedRegionIds: [],
        allowedStoreIds: [],
        excludedUserIds: [],
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    categories: [
      {
        id: CATEGORY_ALPHA_ID,
        repositoryId: REPOSITORY_ALPHA_ID,
        name: 'Guias',
        orderIndex: 1,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    contents: [
      {
        id: CONTENT_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        repositoryId: REPOSITORY_ALPHA_ID,
        categoryId: CATEGORY_ALPHA_ID,
        title: 'Manual Alpha',
        description: 'Manual operacional.',
        thumbnailUrl: 'https://cdn.storepage.test/alpha/manual.png',
        type: 'PDF' as const,
        url: 'https://cdn.storepage.test/alpha/manual.pdf',
        embedUrl: null,
        featured: true,
        recent: true,
        status: 'ACTIVE' as const,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    simpleLinks: [
      {
        id: SIMPLE_LINK_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        repositoryId: REPOSITORY_ALPHA_ID,
        name: 'Portal Alpha',
        url: 'https://alpha.storepage.test',
        type: 'LINK',
        date: '2026-04-23',
        status: 'ACTIVE' as const,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    courses: [
      {
        id: COURSE_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        title: 'Curso Alpha',
        description: 'Treinamento do tenant Alpha.',
        thumbnailUrl: 'https://cdn.storepage.test/alpha/course.png',
        coverImage: null,
        imageUrl: 'https://cdn.storepage.test/alpha/course.png',
        status: 'ACTIVE' as const,
        accessType: 'ALL' as const,
        allowedUserIds: [],
        allowedRegionIds: [],
        allowedStoreIds: [],
        excludedUserIds: [],
        targetAudience: [],
        passingScore: 70,
        diplomaTemplate: 'azul',
        layoutTemplate: 'focus',
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: COURSE_BETA_ID,
        companyId: COMPANY_BETA_ID,
        title: 'Curso Beta',
        description: 'Treinamento do tenant Beta.',
        thumbnailUrl: null,
        coverImage: null,
        imageUrl: null,
        status: 'ACTIVE' as const,
        accessType: 'ALL' as const,
        allowedUserIds: [],
        allowedRegionIds: [],
        allowedStoreIds: [],
        excludedUserIds: [],
        targetAudience: [],
        passingScore: 70,
        diplomaTemplate: 'azul',
        layoutTemplate: 'focus',
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    courseModules: [
      {
        id: COURSE_MODULE_ALPHA_ID,
        courseId: COURSE_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        title: 'Modulo Alpha',
        orderIndex: 0,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    courseContents: [
      {
        id: COURSE_CONTENT_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        moduleId: COURSE_MODULE_ALPHA_ID,
        title: 'Conteudo Alpha',
        description: 'Conteudo do modulo.',
        type: 'VIDEO' as const,
        url: 'https://cdn.storepage.test/alpha/course-video.mp4',
        contentUrl: null,
        filePath: null,
        sizeBytes: null,
        htmlContent: null,
        orderIndex: 0,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    courseQuestions: [
      {
        id: COURSE_QUESTION_ALPHA_ID,
        moduleId: COURSE_MODULE_ALPHA_ID,
        questionText: 'Pergunta Alpha?',
        questionType: 'MULTIPLE_CHOICE' as const,
        configuration: null,
        imageUrl: null,
        explanation: 'Porque sim.',
        orderIndex: 0,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    courseQuestionOptions: [
      {
        id: COURSE_OPTION_ALPHA_ID,
        questionId: COURSE_QUESTION_ALPHA_ID,
        optionText: 'Resposta correta',
        isCorrect: true,
        orderIndex: 0,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    quizzes: [
      {
        id: QUIZ_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        contentId: null,
        courseContentId: COURSE_CONTENT_ALPHA_ID,
        title: 'Quiz Alpha',
        passingScore: 70,
        timeLimit: null,
        shuffleQuestions: false,
        pointsReward: 10,
        deletedAt: null,
        createdAt: now,
      },
    ],
    quizQuestions: [
      {
        id: QUIZ_QUESTION_ALPHA_ID,
        quizId: QUIZ_ALPHA_ID,
        questionText: 'Quiz Alpha?',
        explanation: null,
        sourceExcerpt: null,
        orderIndex: 0,
        deletedAt: null,
      },
    ],
    quizOptions: [
      {
        id: QUIZ_OPTION_ALPHA_ID,
        questionId: QUIZ_QUESTION_ALPHA_ID,
        optionText: 'Alternativa A',
        isCorrect: true,
        orderIndex: 0,
        deletedAt: null,
      },
    ],
    surveys: [
      {
        id: SURVEY_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        title: 'Pesquisa Alpha',
        description: 'Pesquisa do tenant Alpha.',
        status: 'ACTIVE' as const,
        accessType: 'ALL' as const,
        allowedUserIds: [],
        allowedRegionIds: [],
        allowedStoreIds: [],
        excludedUserIds: [],
        allowMultipleResponses: true,
        anonymous: false,
        startsAt: null,
        endsAt: null,
        coverImage: null,
        createdBy: ADMIN_ALPHA_ID,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: SURVEY_BETA_ID,
        companyId: COMPANY_BETA_ID,
        title: 'Pesquisa Beta',
        description: 'Pesquisa do tenant Beta.',
        status: 'ACTIVE' as const,
        accessType: 'ALL' as const,
        allowedUserIds: [],
        allowedRegionIds: [],
        allowedStoreIds: [],
        excludedUserIds: [],
        allowMultipleResponses: true,
        anonymous: false,
        startsAt: null,
        endsAt: null,
        coverImage: null,
        createdBy: ADMIN_BETA_ID,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    surveyQuestions: [
      {
        id: SURVEY_QUESTION_ALPHA_ID,
        surveyId: SURVEY_ALPHA_ID,
        questionText: 'Como foi a experiencia?',
        description: null,
        questionType: 'SHORT_TEXT' as const,
        configuration: { type: 'SHORT_TEXT' },
        required: true,
        orderIndex: 0,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: SURVEY_QUESTION_DELETED_ID,
        surveyId: SURVEY_ALPHA_ID,
        questionText: 'Pergunta removida',
        description: null,
        questionType: 'SHORT_TEXT' as const,
        configuration: { type: 'SHORT_TEXT' },
        required: false,
        orderIndex: 1,
        deletedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    surveyResponses: [
      {
        id: SURVEY_RESPONSE_ALPHA_ID,
        surveyId: SURVEY_ALPHA_ID,
        companyId: COMPANY_ALPHA_ID,
        userId: USER_ALPHA_ID,
        orgUnitId: UNIT_ALPHA_ID,
        orgTopLevelId: TOP_LEVEL_ALPHA_ID,
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: SURVEY_RESPONSE_BETA_ID,
        surveyId: SURVEY_BETA_ID,
        companyId: COMPANY_BETA_ID,
        userId: ADMIN_BETA_ID,
        orgUnitId: UNIT_BETA_ID,
        orgTopLevelId: null,
        startedAt: now,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    ],
    surveyAnswers: [
      {
        id: SURVEY_ANSWER_ALPHA_ID,
        responseId: SURVEY_RESPONSE_ALPHA_ID,
        questionId: SURVEY_QUESTION_ALPHA_ID,
        value: { type: 'SHORT_TEXT', text: 'Muito boa' },
        createdAt: now,
      },
      {
        id: SURVEY_ANSWER_BETA_ID,
        responseId: SURVEY_RESPONSE_BETA_ID,
        questionId: SURVEY_QUESTION_ALPHA_ID,
        value: { type: 'SHORT_TEXT', text: 'Beta' },
        createdAt: now,
      },
    ],
  };
}

async function createFixtureApp() {
  const env = createJwtEnv();
  const seed = await createSeed();
  const app = buildApp(env, { seed });
  await app.ready();

  return { app, env };
}

function readSetCookieHeader(headers: Record<string, unknown>): string {
  const rawHeader = headers['set-cookie'];
  assert.ok(rawHeader, 'Expected Set-Cookie header');
  return Array.isArray(rawHeader) ? String(rawHeader[0]) : String(rawHeader);
}

function readSetCookieHeaders(headers: Record<string, unknown>): string[] {
  const rawHeader = headers['set-cookie'];
  assert.ok(rawHeader, 'Expected Set-Cookie header');
  return Array.isArray(rawHeader) ? rawHeader.map(String) : [String(rawHeader)];
}

function readRefreshCookiePair(headers: Record<string, unknown>): string {
  return readSetCookieHeader(headers).split(';')[0]!;
}

async function injectAdminAlphaLogin(app: ReturnType<typeof buildApp>) {
  return await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.alpha@storepage.com',
      password: 'Password123!',
      company_slug: 'alpha-store',
    },
  });
}

async function loginAsAdminAlpha(app: ReturnType<typeof buildApp>) {
  const response = await injectAdminAlphaLogin(app);

  assert.equal(response.statusCode, 200);
  return response.json() as SuccessResponse<{
    accessToken: string;
    user: { id: string; role: string };
    company: { id: string; slug: string };
  }>;
}

async function loginAsUserAlpha(app: ReturnType<typeof buildApp>) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'user.alpha@storepage.com',
      password: 'UserPass123!',
      company_slug: 'alpha-store',
    },
  });

  assert.equal(response.statusCode, 200);
  return response.json() as SuccessResponse<{
    accessToken: string;
    user: { id: string; role: string };
    company: { id: string; slug: string };
  }>;
}

async function loginAsSuperAdminAlpha(app: ReturnType<typeof buildApp>) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'super.admin@storepage.com',
      password: 'Password123!',
      company_slug: 'alpha-store',
    },
  });

  assert.equal(response.statusCode, 200);
  return response.json() as SuccessResponse<{
    accessToken: string;
    user: { id: string; role: string };
    company: { id: string; slug: string };
  }>;
}

test('login returns session bundle and protected endpoints resolve the tenant context', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const loginResponse = await injectAdminAlphaLogin(app);
  assert.equal(loginResponse.statusCode, 200);
  const setCookieHeader = readSetCookieHeader(loginResponse.headers as Record<string, unknown>);
  assert.match(setCookieHeader, new RegExp(`^${REFRESH_TOKEN_COOKIE_NAME}=`));
  assert.match(setCookieHeader, /HttpOnly/);
  assert.match(setCookieHeader, /SameSite=Lax/);
  assert.match(setCookieHeader, /Path=\/api\/auth/);
  assert.doesNotMatch(setCookieHeader, /Secure/);

  const login = loginResponse.json() as SuccessResponse<{
    accessToken: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
    company: { slug: string };
  }>;
  assert.equal(login.data.company.slug, 'alpha-store');
  assert.equal(login.data.refreshToken, undefined);
  assert.equal(login.data.refreshTokenExpiresAt, undefined);
  assert.equal(loginResponse.body.includes('refreshToken'), false);

  const meResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(meResponse.statusCode, 200);
  const mePayload = meResponse.json() as SuccessResponse<{
    user: { id: string; name: string };
    company: { id: string; slug: string };
  }>;
  assert.equal(mePayload.data.user.id, ADMIN_ALPHA_ID);
  assert.equal(mePayload.data.company.id, COMPANY_ALPHA_ID);

  const currentCompanyResponse = await app.inject({
    method: 'GET',
    url: '/api/companies/current',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(currentCompanyResponse.statusCode, 200);
  const currentCompanyPayload = currentCompanyResponse.json() as SuccessResponse<{ slug: string; supportEmail: string | null }>;
  assert.equal(currentCompanyPayload.data.slug, 'alpha-store');
  assert.equal(currentCompanyPayload.data.supportEmail, 'support@alpha.test');
});

test('CORS credentials use explicit allowed origins and reject wildcard credential config', async (t) => {
  const env = createJwtEnv({
    CORS_ORIGINS: 'http://localhost:8080',
    CORS_ALLOW_CREDENTIALS: 'true',
  });
  const seed = await createSeed();
  const app = buildApp(env, { seed });
  await app.ready();
  t.after(async () => {
    await app.close();
  });

  const preflightResponse = await app.inject({
    method: 'OPTIONS',
    url: '/api/auth/login',
    headers: {
      origin: 'http://localhost:8080',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type',
    },
  });

  assert.equal(preflightResponse.statusCode, 204);
  assert.equal(preflightResponse.headers['access-control-allow-origin'], 'http://localhost:8080');
  assert.notEqual(preflightResponse.headers['access-control-allow-origin'], '*');
  assert.equal(preflightResponse.headers['access-control-allow-credentials'], 'true');

  assert.throws(
    () =>
      createJwtEnv({
        CORS_ORIGINS: '*',
        CORS_ALLOW_CREDENTIALS: 'true',
      }),
    /CORS_ORIGINS cannot be "\*" when CORS_ALLOW_CREDENTIALS=true/,
  );
});

test('production env requires cookie-compatible auth and explicit origins', () => {
  assert.throws(
    () =>
      createJwtEnv({
        NODE_ENV: 'production',
        JWT_AUTH_MODE: 'disabled',
        CORS_ORIGINS: 'https://app.storepage.com',
        CORS_ALLOW_CREDENTIALS: 'true',
      }),
    /JWT_AUTH_MODE must be shared-secret or jwks in production/,
  );

  assert.throws(
    () =>
      createJwtEnv({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.storepage.com',
        CORS_ALLOW_CREDENTIALS: 'false',
      }),
    /CORS_ALLOW_CREDENTIALS must be true in production for HttpOnly cookie auth/,
  );

  assert.throws(
    () =>
      createJwtEnv({
        NODE_ENV: 'production',
        CORS_ORIGINS: '*',
        CORS_ALLOW_CREDENTIALS: 'true',
      }),
    /CORS_ORIGINS must list explicit frontend origins in production/,
  );

  const sharedSecretEnv = createJwtEnv({
    ...smtpInviteDeliveryEnv(),
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://app.storepage.com',
    CORS_ALLOW_CREDENTIALS: 'true',
    JWT_AUTH_MODE: 'shared-secret',
    JWT_SHARED_SECRET: SHARED_SECRET,
    JWT_JWKS_URL: '',
  });
  assert.equal(sharedSecretEnv.AUTH.mode, 'shared-secret');
  assert.equal(sharedSecretEnv.CORS_ALLOW_CREDENTIALS, true);
  assert.deepEqual(sharedSecretEnv.CORS_ORIGINS, ['https://app.storepage.com']);

  const jwksEnv = createJwtEnv({
    ...smtpInviteDeliveryEnv(),
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://app.storepage.com',
    CORS_ALLOW_CREDENTIALS: 'true',
    JWT_AUTH_MODE: 'jwks',
    JWT_ALLOWED_ALGORITHMS: 'RS256',
    JWT_SHARED_SECRET: '',
    JWT_JWKS_URL: 'https://auth.storepage.com/.well-known/jwks.json',
  });
  assert.equal(jwksEnv.AUTH.mode, 'jwks');
  assert.equal(jwksEnv.AUTH.jwksUrl, 'https://auth.storepage.com/.well-known/jwks.json');
});

test('production env requires secure invite delivery configuration', () => {
  assert.throws(
    () =>
      createJwtEnv({
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.storepage.com',
        CORS_ALLOW_CREDENTIALS: 'true',
        INVITE_DELIVERY_PROVIDER: 'noop',
        INVITE_ACTIVATION_BASE_URL: 'https://app.storepage.com/ativar-convite',
      }),
    /INVITE_DELIVERY_PROVIDER cannot be noop in production/,
  );

  assert.throws(
    () =>
      createJwtEnv({
        ...smtpInviteDeliveryEnv({ INVITE_ACTIVATION_BASE_URL: 'http://app.storepage.com/ativar-convite' }),
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.storepage.com',
        CORS_ALLOW_CREDENTIALS: 'true',
      }),
    /INVITE_ACTIVATION_BASE_URL must be HTTPS in production/,
  );

  assert.throws(
    () =>
      createJwtEnv({
        ...smtpInviteDeliveryEnv({ SMTP_PASS: '' }),
        NODE_ENV: 'production',
        CORS_ORIGINS: 'https://app.storepage.com',
        CORS_ALLOW_CREDENTIALS: 'true',
      }),
    /SMTP_PASS is required when INVITE_DELIVERY_PROVIDER=smtp/,
  );

  const env = createJwtEnv({
    ...smtpInviteDeliveryEnv(),
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://app.storepage.com',
    CORS_ALLOW_CREDENTIALS: 'true',
  });
  assert.equal(env.INVITE_DELIVERY.provider, 'smtp');
  assert.equal(env.INVITE_DELIVERY.activationBaseUrl, 'https://app.storepage.com/ativar-convite');
});

test('login requires tenant for regular users but allows global super admin login', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const missingTenantResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.alpha@storepage.com',
      password: 'Password123!',
    },
  });

  assert.equal(missingTenantResponse.statusCode, 400);
  const missingTenantPayload = missingTenantResponse.json() as ErrorResponse;
  assert.equal(missingTenantPayload.code, 'TENANT_REQUIRED');

  const globalSuperAdminResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'super.admin@storepage.com',
      password: 'Password123!',
    },
  });

  assert.equal(globalSuperAdminResponse.statusCode, 200);
  const globalSuperAdminPayload = globalSuperAdminResponse.json() as SuccessResponse<{
    user: { id: string; role: string };
    company: { id: string; slug: string };
  }>;
  assert.equal(globalSuperAdminPayload.data.user.role, 'SUPER_ADMIN');
  assert.equal(globalSuperAdminPayload.data.company.slug, 'alpha-store');

  const linkNameResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.alpha@storepage.com',
      password: 'Password123!',
      company_slug: 'alpha',
    },
  });

  assert.equal(linkNameResponse.statusCode, 401);
  const linkNamePayload = linkNameResponse.json() as ErrorResponse;
  assert.equal(linkNamePayload.code, 'INVALID_CREDENTIALS');
});

test('login rejects legacy super admin without company assignment without leaking an internal error', async (t) => {
  const env = createJwtEnv();
  const seed = await createSeed();
  seed.users = seed.users.map((user) =>
    user.id === SUPER_ADMIN_ALPHA_ID ? { ...user, companyId: null as unknown as string } : user,
  );
  const app = buildApp(env, { seed });
  await app.ready();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'super.admin@storepage.com',
      password: 'Password123!',
    },
  });

  assert.equal(response.statusCode, 401);
  const payload = response.json() as ErrorResponse;
  assert.equal(payload.code, 'INVALID_CREDENTIALS');
});

test('own profile onboarding endpoint is authenticated and only accepts the lightweight contract', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const unauthenticatedResponse = await app.inject({
    method: 'PATCH',
    url: '/api/users/me/profile',
    payload: {
      onboardingCompleted: true,
    },
  });

  assert.equal(unauthenticatedResponse.statusCode, 401);
  const unauthenticatedPayload = unauthenticatedResponse.json() as ErrorResponse;
  assert.equal(unauthenticatedPayload.code, 'UNAUTHENTICATED');

  const login = await loginAsUserAlpha(app);
  const headers = { authorization: `Bearer ${login.data.accessToken}` };

  const invalidPayloadResponse = await app.inject({
    method: 'PATCH',
    url: '/api/users/me/profile',
    headers,
    payload: {
      onboardingCompleted: true,
      role: 'ADMIN',
      companyId: COMPANY_BETA_ID,
      password: 'Password123!',
      userId: ADMIN_ALPHA_ID,
    },
  });

  assert.equal(invalidPayloadResponse.statusCode, 400);
  const invalidPayload = invalidPayloadResponse.json() as ErrorResponse;
  assert.equal(invalidPayload.code, 'VALIDATION_ERROR');

  const updateResponse = await app.inject({
    method: 'PATCH',
    url: '/api/users/me/profile',
    headers,
    payload: {
      onboardingCompleted: true,
    },
  });

  assert.equal(updateResponse.statusCode, 200);
  const updatePayload = updateResponse.json() as SuccessResponse<{
    user: { id: string; onboardingCompleted: boolean; companyId: string };
  }>;
  assert.equal(updatePayload.data.user.id, USER_ALPHA_ID);
  assert.equal(updatePayload.data.user.companyId, COMPANY_ALPHA_ID);
  assert.equal(updatePayload.data.user.onboardingCompleted, true);

  const meResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers,
  });

  assert.equal(meResponse.statusCode, 200);
  const mePayload = meResponse.json() as SuccessResponse<{
    user: { id: string; onboardingCompleted: boolean };
  }>;
  assert.equal(mePayload.data.user.id, USER_ALPHA_ID);
  assert.equal(mePayload.data.user.onboardingCompleted, true);
});

test('refresh rotates refresh tokens and invalidates the previous one', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const loginResponse = await injectAdminAlphaLogin(app);
  assert.equal(loginResponse.statusCode, 200);
  const loginCookiePair = readRefreshCookiePair(loginResponse.headers as Record<string, unknown>);

  const refreshResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/refresh',
    headers: {
      cookie: loginCookiePair,
    },
  });

  assert.equal(refreshResponse.statusCode, 200);
  const refreshPayload = refreshResponse.json() as SuccessResponse<{
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
    accessToken: string;
  }>;
  assert.equal(refreshPayload.data.refreshToken, undefined);
  assert.equal(refreshPayload.data.refreshTokenExpiresAt, undefined);
  assert.equal(refreshResponse.body.includes('refreshToken'), false);
  const rotatedCookiePair = readRefreshCookiePair(refreshResponse.headers as Record<string, unknown>);
  assert.notEqual(rotatedCookiePair, loginCookiePair);

  const bodyRefreshResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/refresh',
    payload: {
      refreshToken: 'x'.repeat(64),
    },
  });

  assert.equal(bodyRefreshResponse.statusCode, 401);
  const bodyRefreshPayload = bodyRefreshResponse.json() as ErrorResponse;
  assert.equal(bodyRefreshPayload.code, 'INVALID_REFRESH_TOKEN');

  const staleRefreshResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/refresh',
    headers: {
      cookie: loginCookiePair,
    },
  });

  assert.equal(staleRefreshResponse.statusCode, 401);
  const staleRefreshPayload = staleRefreshResponse.json() as ErrorResponse;
  assert.equal(staleRefreshPayload.code, 'INVALID_REFRESH_TOKEN');
});

test('first-access users can login with the temporary password but must change it before protected access', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const adminLogin = await loginAsAdminAlpha(app);
  const createResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/users/invite',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Primeiro Acesso',
      email: 'primeiro.acesso@storepage.com',
      cpf: '55555555558',
      role: 'USER',
      orgUnitId: UNIT_ALPHA_ID,
    },
  });
  assert.equal(createResponse.statusCode, 201);
  const createPayload = createResponse.json() as SuccessResponse<{
    user: { id: string; email: string; status: string; firstAccess: boolean };
  }>;
  assert.equal(createPayload.data.user.email, 'primeiro.acesso@storepage.com');
  assert.equal(createPayload.data.user.status, 'ACTIVE');
  assert.equal(createPayload.data.user.firstAccess, true);
  assert.equal(createResponse.body.includes('123456'), false);
  assert.equal(createResponse.body.includes('scrypt$'), false);
  assert.equal(createResponse.body.includes('activationToken'), false);
  assert.equal(createResponse.body.includes('inviteToken'), false);

  const createdUser = await app.repositories.user.findByEmail(COMPANY_ALPHA_ID, 'primeiro.acesso@storepage.com');
  assert.ok(createdUser);
  assert.equal(createdUser.id, createPayload.data.user.id);
  assert.equal(createdUser.status, 'ACTIVE');
  assert.equal(createdUser.firstAccess, true);
  assert.ok(createdUser.passwordHash);
  assert.equal(createdUser.passwordHash.includes('123456'), false);
  assert.equal(await new PasswordService().verifyPassword('123456', createdUser.passwordHash), true);

  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'primeiro.acesso@storepage.com',
      password: '123456',
      company_slug: 'alpha-store',
    },
  });
  assert.equal(loginResponse.statusCode, 200);
  assert.equal(loginResponse.body.includes('123456'), false);
  const loginPayload = loginResponse.json() as SuccessResponse<{
    accessToken: string;
    user: { firstAccess: boolean };
  }>;
  assert.equal(loginPayload.data.user.firstAccess, true);

  const meResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${loginPayload.data.accessToken}`,
    },
  });
  assert.equal(meResponse.statusCode, 200);

  const protectedResponse = await app.inject({
    method: 'GET',
    url: '/api/companies/current',
    headers: {
      authorization: `Bearer ${loginPayload.data.accessToken}`,
    },
  });
  assert.equal(protectedResponse.statusCode, 409);
  const protectedPayload = protectedResponse.json() as ErrorResponse;
  assert.equal(protectedPayload.code, 'PASSWORD_CHANGE_REQUIRED');

  const temporaryAsNewPasswordResponse = await app.inject({
    method: 'PATCH',
    url: '/api/auth/password',
    headers: {
      authorization: `Bearer ${loginPayload.data.accessToken}`,
    },
    payload: {
      currentPassword: '123456',
      newPassword: '123456',
    },
  });
  assert.equal(temporaryAsNewPasswordResponse.statusCode, 400);

  const passwordChangeResponse = await app.inject({
    method: 'PATCH',
    url: '/api/auth/password',
    headers: {
      authorization: `Bearer ${loginPayload.data.accessToken}`,
    },
    payload: {
      currentPassword: '123456',
      newPassword: 'FirstAccess123!',
    },
  });
  assert.equal(passwordChangeResponse.statusCode, 200);

  const oldPasswordLoginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'primeiro.acesso@storepage.com',
      password: '123456',
      company_slug: 'alpha-store',
    },
  });
  assert.equal(oldPasswordLoginResponse.statusCode, 401);

  const newPasswordLoginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'primeiro.acesso@storepage.com',
      password: 'FirstAccess123!',
      company_slug: 'alpha-store',
    },
  });
  assert.equal(newPasswordLoginResponse.statusCode, 200);
  const newPasswordLoginPayload = newPasswordLoginResponse.json() as SuccessResponse<{
    user: { firstAccess: boolean };
  }>;
  assert.equal(newPasswordLoginPayload.data.user.firstAccess, false);
});

test('logout revokes the current session and blocks subsequent authenticated access', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const loginResponse = await injectAdminAlphaLogin(app);
  assert.equal(loginResponse.statusCode, 200);
  const login = loginResponse.json() as SuccessResponse<{ accessToken: string }>;

  const logoutResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/logout',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
      cookie: readRefreshCookiePair(loginResponse.headers as Record<string, unknown>),
    },
  });

  assert.equal(logoutResponse.statusCode, 200);
  const logoutCookieHeader = readSetCookieHeader(logoutResponse.headers as Record<string, unknown>);
  assert.match(logoutCookieHeader, new RegExp(`^${REFRESH_TOKEN_COOKIE_NAME}=`));
  assert.match(logoutCookieHeader, /Max-Age=0/);
  assert.match(logoutCookieHeader, /HttpOnly/);

  const meAfterLogoutResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(meAfterLogoutResponse.statusCode, 401);
  const meAfterLogoutPayload = meAfterLogoutResponse.json() as ErrorResponse;
  assert.equal(meAfterLogoutPayload.code, 'SESSION_REVOKED');
});

test('access tokens must be bound to an active revocable backend session', async (t) => {
  const { app, env } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const looseAccessToken = await new SignJWT({
    company_id: COMPANY_ALPHA_ID,
    role: 'ADMIN',
    email: 'admin.alpha@storepage.com',
    token_use: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(env.AUTH.issuer!)
    .setAudience(env.AUTH.audience[0]!)
    .setSubject(ADMIN_ALPHA_ID)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode(SHARED_SECRET));

  const meResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${looseAccessToken}`,
    },
  });

  assert.equal(meResponse.statusCode, 401);
  const mePayload = meResponse.json() as ErrorResponse;
  assert.equal(mePayload.code, 'INVALID_TOKEN');
});

test('authenticated requests revalidate active tenant status on every request', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const loginResponse = await injectAdminAlphaLogin(app);
  assert.equal(loginResponse.statusCode, 200);
  const login = loginResponse.json() as SuccessResponse<{ accessToken: string }>;

  const deactivateResponse = await app.inject({
    method: 'PATCH',
    url: '/api/admin/settings/general',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
    payload: {
      status: 'INACTIVE',
      active: false,
    },
  });

  assert.equal(deactivateResponse.statusCode, 200);

  const meResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(meResponse.statusCode, 401);
  const mePayload = meResponse.json() as ErrorResponse;
  assert.equal(mePayload.code, 'INVALID_TOKEN');

  const refreshResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/refresh',
    headers: {
      cookie: readRefreshCookiePair(loginResponse.headers as Record<string, unknown>),
    },
  });

  assert.equal(refreshResponse.statusCode, 403);
  const refreshPayload = refreshResponse.json() as ErrorResponse;
  assert.equal(refreshPayload.code, 'FORBIDDEN');
});

test('public tenant and settings routes resolve branding by slug or link_name', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const publicCompanyResponse = await app.inject({
    method: 'GET',
    url: '/api/companies/public/alpha',
  });

  assert.equal(publicCompanyResponse.statusCode, 200);
  const publicCompanyPayload = publicCompanyResponse.json() as SuccessResponse<{ slug: string; linkName: string }>;
  assert.equal(publicCompanyPayload.data.slug, 'alpha-store');
  assert.equal(publicCompanyPayload.data.linkName, 'alpha');

  const publicAppearanceResponse = await app.inject({
    method: 'GET',
    url: '/api/settings/appearance/alpha-store',
  });

  assert.equal(publicAppearanceResponse.statusCode, 200);
  const publicAppearancePayload = publicAppearanceResponse.json() as SuccessResponse<{
    branding: { hero: { title: string } };
    orgUnitName: string;
  }>;
  assert.equal(publicAppearancePayload.data.branding.hero.title, 'Portal Alpha');
  assert.equal(publicAppearancePayload.data.orgUnitName, 'Loja');
});

test('invite validation and activation create an authenticated user session', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const inviteValidationResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/session',
    payload: {
      token: 'invite_token_alpha_pending_12345',
    },
  });

  assert.equal(inviteValidationResponse.statusCode, 200);
  const inviteValidationPayload = inviteValidationResponse.json() as SuccessResponse<{
    invite: { id: string; email: string };
    availableUnits: Array<{ id: string }>;
  }>;
  assert.equal(inviteValidationPayload.data.invite.id, INVITE_ALPHA_ID);
  assert.equal(inviteValidationPayload.data.availableUnits[0]?.id, UNIT_ALPHA_ID);
  assert.equal(inviteValidationResponse.body.includes('invite_token_alpha_pending_12345'), false);

  const inviteCookieHeader = readSetCookieHeader(inviteValidationResponse.headers as Record<string, unknown>);
  assert.match(inviteCookieHeader, new RegExp(`^${INVITE_ACTIVATION_COOKIE_NAME}=`));
  assert.match(inviteCookieHeader, /HttpOnly/);
  assert.match(inviteCookieHeader, /SameSite=Lax/);
  assert.match(inviteCookieHeader, /Path=\/api\/auth\/invites/);
  assert.doesNotMatch(inviteCookieHeader, /Secure/);

  const temporaryPasswordActivationResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/activate',
    headers: {
      cookie: inviteCookieHeader.split(';')[0]!,
    },
    payload: {
      email: 'invite.alpha@storepage.com',
      cpf: '44444444444',
      password: '123456',
      orgUnitId: UNIT_ALPHA_ID,
    },
  });
  assert.equal(temporaryPasswordActivationResponse.statusCode, 400);

  const activationResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/activate',
    headers: {
      cookie: inviteCookieHeader.split(';')[0]!,
    },
    payload: {
      email: 'invite.alpha@storepage.com',
      cpf: '44444444444',
      password: 'InvitePass123!',
      orgUnitId: UNIT_ALPHA_ID,
      avatarUrl: 'https://cdn.storepage.test/avatars/invite-alpha.png',
    },
  });

  assert.equal(activationResponse.statusCode, 201);
  const activationPayload = activationResponse.json() as SuccessResponse<{
    accessToken: string;
    refreshToken?: string;
    refreshTokenExpiresAt?: string;
    user: { email: string; role: string };
  }>;
  assert.equal(activationPayload.data.refreshToken, undefined);
  assert.equal(activationPayload.data.refreshTokenExpiresAt, undefined);
  assert.equal(activationResponse.body.includes('refreshToken'), false);
  assert.equal(activationResponse.body.includes('invite_token_alpha_pending_12345'), false);
  const activationCookieHeaders = readSetCookieHeaders(activationResponse.headers as Record<string, unknown>);
  assert.ok(activationCookieHeaders.some((header) => header.startsWith(`${INVITE_ACTIVATION_COOKIE_NAME}=`) && header.includes('Max-Age=0')));
  assert.ok(activationCookieHeaders.some((header) => header.startsWith(`${REFRESH_TOKEN_COOKIE_NAME}=`) && header.includes('HttpOnly')));
  assert.equal(activationPayload.data.user.email, 'invite.alpha@storepage.com');
  assert.equal(activationPayload.data.user.role, 'MANAGER');

  const meResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${activationPayload.data.accessToken}`,
    },
  });

  assert.equal(meResponse.statusCode, 200);
  const mePayload = meResponse.json() as SuccessResponse<{ user: { email: string; firstAccess: boolean } }>;
  assert.equal(mePayload.data.user.email, 'invite.alpha@storepage.com');
  assert.equal(mePayload.data.user.firstAccess, false);

  const reusedInviteValidationResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/session',
    payload: {
      token: 'invite_token_alpha_pending_12345',
    },
  });

  assert.equal(reusedInviteValidationResponse.statusCode, 409);
});

test('invite activation sessions require valid tokens and final activation requires the HttpOnly cookie', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const invalidPostExchangeResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/session',
    payload: {
      token: 'invalid_invite_token_1234567890',
    },
  });
  assert.equal(invalidPostExchangeResponse.statusCode, 404);

  const invalidGetExchangeResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/invites/invalid_invite_token_1234567890',
  });
  assert.equal(invalidGetExchangeResponse.statusCode, 404);

  const getExchangeResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/invites/invite_token_alpha_pending_12345',
  });
  assert.equal(getExchangeResponse.statusCode, 200);
  assert.equal(getExchangeResponse.body.includes('invite_token_alpha_pending_12345'), false);

  const inviteCookieHeader = readSetCookieHeader(getExchangeResponse.headers as Record<string, unknown>);
  assert.match(inviteCookieHeader, new RegExp(`^${INVITE_ACTIVATION_COOKIE_NAME}=`));
  assert.match(inviteCookieHeader, /HttpOnly/);
  assert.match(inviteCookieHeader, /SameSite=Lax/);

  const activationWithoutCookieResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/activate',
    payload: {
      email: 'invite.alpha@storepage.com',
      cpf: '44444444444',
      password: 'InvitePass123!',
    },
  });
  assert.equal(activationWithoutCookieResponse.statusCode, 401);

  const activationWithBodyTokenResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/activate',
    headers: {
      cookie: inviteCookieHeader.split(';')[0]!,
    },
    payload: {
      token: 'invite_token_alpha_pending_12345',
      email: 'invite.alpha@storepage.com',
      cpf: '44444444444',
      password: 'InvitePass123!',
    },
  });
  assert.equal(activationWithBodyTokenResponse.statusCode, 400);
  const bodyTokenPayload = activationWithBodyTokenResponse.json() as ErrorResponse;
  assert.equal(bodyTokenPayload.code, 'VALIDATION_ERROR');
});

test('invite activation cookie is secure in production', async (t) => {
  const env = createJwtEnv({
    ...smtpInviteDeliveryEnv(),
    NODE_ENV: 'production',
    CORS_ORIGINS: 'https://app.storepage.com',
    CORS_ALLOW_CREDENTIALS: 'true',
  });
  const seed = await createSeed();
  const app = buildApp(env, { seed });
  await app.ready();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/session',
    payload: {
      token: 'invite_token_alpha_pending_12345',
    },
  });

  assert.equal(response.statusCode, 200);
  const cookieHeader = readSetCookieHeader(response.headers as Record<string, unknown>);
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Lax/);
  assert.match(cookieHeader, /Secure/);
});

test('sensitive public auth endpoints apply conservative rate limits', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        identifier: 'admin.alpha@storepage.com',
        password: 'wrong-password',
        company_slug: 'alpha-store',
      },
    });

    assert.equal(response.statusCode, 401);
  }

  const limitedLoginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.alpha@storepage.com',
      password: 'wrong-password',
      company_slug: 'alpha-store',
    },
  });

  assert.equal(limitedLoginResponse.statusCode, 429);
  const limitedLoginPayload = limitedLoginResponse.json() as ErrorResponse;
  assert.equal(limitedLoginPayload.code, 'RATE_LIMITED');

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/invites/activate',
      payload: {
        email: 'invite.alpha@storepage.com',
        cpf: '44444444444',
        password: 'InvitePass123!',
      },
    });

    assert.equal(response.statusCode, 401);
  }

  const limitedActivationResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/invites/activate',
    payload: {
      email: 'invite.alpha@storepage.com',
      cpf: '44444444444',
      password: 'InvitePass123!',
    },
  });

  assert.equal(limitedActivationResponse.statusCode, 429);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refreshToken: 'x'.repeat(32),
      },
    });

    assert.equal(response.statusCode, 401);
  }

  const limitedRefreshResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/refresh',
    payload: {
      refreshToken: 'x'.repeat(32),
    },
  });

  assert.equal(limitedRefreshResponse.statusCode, 429);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await app.inject({
      method: 'GET',
      url: '/api/auth/invites/invalid_invite_token_1234567890',
    });

    assert.equal(response.statusCode, 404);
  }

  const limitedInviteLookupResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/invites/invalid_invite_token_1234567890',
  });

  assert.equal(limitedInviteLookupResponse.statusCode, 429);
});

test('admin user endpoints enforce tenant isolation and self-protection rules', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const login = await loginAsAdminAlpha(app);

  const usersResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/users',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(usersResponse.statusCode, 200);
  const usersPayload = usersResponse.json() as SuccessResponse<{
    users: Array<{ id: string }>;
    invites: Array<{ id: string }>;
  }>;
  assert.equal(usersPayload.data.users.some((user) => user.id === ADMIN_BETA_ID), false);
  assert.equal(usersPayload.data.invites[0]?.id, INVITE_ALPHA_ID);

  const crossTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/admin/users/${ADMIN_BETA_ID}`,
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(crossTenantResponse.statusCode, 404);

  const createUserResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/users/invite',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
    payload: {
      name: 'Novo Gestor',
      email: 'novo.gestor@storepage.com',
      cpf: '55555555555',
      role: 'MANAGER',
      orgUnitId: UNIT_ALPHA_ID,
    },
  });

  assert.equal(createUserResponse.statusCode, 201);
  const createUserPayload = createUserResponse.json() as SuccessResponse<{
    user: { id: string; email: string; status: string; firstAccess: boolean };
  }>;
  assert.equal(createUserPayload.data.user.email, 'novo.gestor@storepage.com');
  assert.equal(createUserPayload.data.user.status, 'ACTIVE');
  assert.equal(createUserPayload.data.user.firstAccess, true);
  assert.equal(createUserResponse.body.includes('123456'), false);
  assert.equal(createUserResponse.body.includes('scrypt$'), false);
  assert.equal(createUserResponse.body.includes('activationToken'), false);
  assert.equal(createUserResponse.body.includes('inviteToken'), false);
  assert.equal(createUserResponse.body.includes('/ativar-convite'), false);

  const createdUser = await app.repositories.user.findByEmail(COMPANY_ALPHA_ID, 'novo.gestor@storepage.com');
  assert.ok(createdUser);
  assert.equal(createdUser.id, createUserPayload.data.user.id);
  assert.equal(createdUser.status, 'ACTIVE');
  assert.equal(createdUser.firstAccess, true);
  assert.ok(createdUser.passwordHash);
  assert.equal(createdUser.passwordHash.includes('123456'), false);

  const selfDeleteResponse = await app.inject({
    method: 'DELETE',
    url: `/api/admin/users/${ADMIN_ALPHA_ID}`,
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(selfDeleteResponse.statusCode, 409);
  const selfDeletePayload = selfDeleteResponse.json() as ErrorResponse;
  assert.equal(selfDeletePayload.code, 'SELF_MODIFICATION_FORBIDDEN');
});

test('admin user creation issues a temporary first-access password without leaking it', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const login = await loginAsAdminAlpha(app);
  const response = await app.inject({
    method: 'POST',
    url: '/api/admin/users/invite',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
    payload: {
      name: 'Entrega Segura',
      email: 'entrega.segura@storepage.com',
      cpf: '55555555556',
      role: 'USER',
      orgUnitId: UNIT_ALPHA_ID,
    },
  });

  assert.equal(response.statusCode, 201);
  const payload = response.json() as SuccessResponse<{
    user: { id: string; email: string; status: string; firstAccess: boolean };
  }>;
  assert.equal(payload.data.user.email, 'entrega.segura@storepage.com');
  assert.equal(payload.data.user.status, 'ACTIVE');
  assert.equal(payload.data.user.firstAccess, true);
  assert.equal(response.body.includes('123456'), false);
  assert.equal(response.body.includes('scrypt$'), false);
  assert.equal(response.body.includes('/ativar-convite/'), false);
  assert.equal(response.body.includes('activationUrl'), false);
  assert.equal(response.body.includes('activationToken'), false);
  assert.equal(response.body.includes('inviteToken'), false);

  const savedUser = await app.repositories.user.findByEmail(COMPANY_ALPHA_ID, 'entrega.segura@storepage.com');
  assert.ok(savedUser);
  assert.equal(savedUser.id, payload.data.user.id);
  assert.equal(savedUser.status, 'ACTIVE');
  assert.equal(savedUser.firstAccess, true);
  assert.ok(savedUser.passwordHash);
  assert.equal(savedUser.passwordHash.includes('123456'), false);
  assert.equal(await new PasswordService().verifyPassword('123456', savedUser.passwordHash), true);
});

test('invite delivery attempts batch latest lookup preserves tenant isolation', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  await app.repositories.inviteDeliveryAttempt.save({
    id: '84848484-8484-4484-8484-848484848484',
    inviteId: INVITE_ALPHA_ID,
    companyId: COMPANY_ALPHA_ID,
    channel: 'email',
    provider: 'smtp',
    status: 'failed',
    errorCode: 'OLDER_FAILURE',
    requestedByUserId: ADMIN_ALPHA_ID,
    sentAt: null,
    createdAt: '2026-04-24T12:00:00.000Z',
  });

  await app.repositories.inviteDeliveryAttempt.save({
    id: '85858585-8585-4585-8585-858585858585',
    inviteId: INVITE_ALPHA_ID,
    companyId: COMPANY_ALPHA_ID,
    channel: 'email',
    provider: 'smtp',
    status: 'sent',
    errorCode: null,
    requestedByUserId: ADMIN_ALPHA_ID,
    sentAt: '2026-04-25T12:00:00.000Z',
    createdAt: '2026-04-25T12:00:00.000Z',
  });

  await app.repositories.inviteDeliveryAttempt.save({
    id: '86868686-8686-4686-8686-868686868686',
    inviteId: INVITE_ALPHA_ID,
    companyId: COMPANY_BETA_ID,
    channel: 'email',
    provider: 'smtp',
    status: 'failed',
    errorCode: 'CROSS_TENANT_NEWER',
    requestedByUserId: ADMIN_BETA_ID,
    sentAt: null,
    createdAt: '2026-04-26T12:00:00.000Z',
  });

  const latestByInvite = await app.repositories.inviteDeliveryAttempt.findLatestForInvites(COMPANY_ALPHA_ID, [
    INVITE_ALPHA_ID,
    '99999999-9999-4999-8999-111111111111',
  ]);
  assert.equal(latestByInvite.get(INVITE_ALPHA_ID)?.status, 'sent');
  assert.equal(latestByInvite.get(INVITE_ALPHA_ID)?.errorCode, null);
  assert.equal(latestByInvite.has('99999999-9999-4999-8999-111111111111'), false);

  const login = await loginAsAdminAlpha(app);
  const listResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/users',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(listResponse.statusCode, 200);
  const listPayload = listResponse.json() as SuccessResponse<{
    invites: Array<{ id: string; activationDelivery: { status: string; errorCode?: string } }>;
  }>;
  const invite = listPayload.data.invites.find((entry) => entry.id === INVITE_ALPHA_ID);
  assert.equal(invite?.activationDelivery.status, 'sent');
  assert.equal(listResponse.body.includes('invite_token_alpha_pending_12345'), false);
  assert.equal(listResponse.body.includes('/ativar-convite/'), false);
});

test('legacy invite delivery failure is reported without leaking token or link', async (t) => {
  const env = createJwtEnv();
  const seed = await createSeed();
  const app = buildApp(env, { seed, inviteDeliveryProvider: new FailingInviteDeliveryProvider() });
  await app.ready();
  t.after(async () => {
    await app.close();
  });

  const login = await loginAsAdminAlpha(app);
  const response = await app.inject({
    method: 'POST',
    url: `/api/admin/users/invites/${INVITE_ALPHA_ID}/resend`,
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(response.statusCode, 200);
  const payload = response.json() as SuccessResponse<{
    invite: { id: string };
    activationDelivery: { status: string; sent: boolean; lastAttempt: { errorCode: string | null } | null };
  }>;
  assert.equal(payload.data.activationDelivery.status, 'failed');
  assert.equal(payload.data.activationDelivery.sent, false);
  assert.equal(payload.data.activationDelivery.lastAttempt?.errorCode, 'INVITE_DELIVERY_FAILED');

  const savedInvite = await app.repositories.invite.findById(COMPANY_ALPHA_ID, payload.data.invite.id);
  assert.ok(savedInvite);
  assert.equal(response.body.includes(savedInvite.token), false);
  assert.equal(response.body.includes('/ativar-convite/'), false);
  assert.equal(response.body.includes('activationUrl'), false);

  const attempt = await app.repositories.inviteDeliveryAttempt.findLatestForInvite(COMPANY_ALPHA_ID, savedInvite.id);
  assert.ok(attempt);
  const auditJson = JSON.stringify(attempt);
  assert.equal(auditJson.includes(savedInvite.token), false);
  assert.equal(auditJson.includes('/ativar-convite/'), false);
});

test('admin invite resend enforces tenant and pending invite rules', async (t) => {
  const env = createJwtEnv();
  const seed = await createSeed();
  const provider = new CapturingInviteDeliveryProvider();
  const app = buildApp(env, { seed, inviteDeliveryProvider: provider });
  await app.ready();
  t.after(async () => {
    await app.close();
  });

  await app.repositories.invite.save({
    id: INVITE_BETA_ID,
    companyId: COMPANY_BETA_ID,
    name: 'Invite Beta',
    email: 'invite.beta@storepage.com',
    normalizedEmail: 'invite.beta@storepage.com',
    cpf: '55555555558',
    role: 'USER',
    orgUnitId: UNIT_BETA_ID,
    token: 'invite_token_beta_pending_12345',
    status: 'PENDING_SETUP',
    invitedByUserId: ADMIN_BETA_ID,
    userId: null,
    expiresAt: '2026-06-01T12:00:00.000Z',
    activatedAt: null,
    cancelledAt: null,
    deletedAt: null,
    createdAt: '2026-04-23T12:00:00.000Z',
    updatedAt: '2026-04-23T12:00:00.000Z',
  });

  const login = await loginAsAdminAlpha(app);
  const resendResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/users/invites/${INVITE_ALPHA_ID}/resend`,
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });

  assert.equal(resendResponse.statusCode, 200);
  assert.equal(provider.calls.length, 1);
  assert.equal(provider.calls[0]?.activationUrl.includes('invite_token_alpha_pending_12345'), true);
  assert.equal(resendResponse.body.includes('invite_token_alpha_pending_12345'), false);
  assert.equal(resendResponse.body.includes('/ativar-convite/'), false);

  const resendPayload = resendResponse.json() as SuccessResponse<{
    activationDelivery: { status: string; sent: boolean; lastAttempt: { status: string } | null };
  }>;
  assert.equal(resendPayload.data.activationDelivery.status, 'sent');
  assert.equal(resendPayload.data.activationDelivery.sent, true);

  const latestAttempt = await app.repositories.inviteDeliveryAttempt.findLatestForInvite(COMPANY_ALPHA_ID, INVITE_ALPHA_ID);
  assert.ok(latestAttempt);
  assert.equal(latestAttempt.status, 'sent');
  assert.equal(JSON.stringify(latestAttempt).includes('invite_token_alpha_pending_12345'), false);

  const crossTenantResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/users/invites/${INVITE_BETA_ID}/resend`,
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
  });
  assert.equal(crossTenantResponse.statusCode, 404);

  const blockedInvites = [
    {
      id: '81818181-8181-4181-8181-818181818181',
      status: 'CANCELLED' as const,
      activatedAt: null,
      cancelledAt: '2026-04-23T12:00:00.000Z',
      userId: null,
      expiresAt: '2026-06-01T12:00:00.000Z',
      expectedStatus: 409,
    },
    {
      id: '82828282-8282-4282-8282-828282828282',
      status: 'ACTIVATED' as const,
      activatedAt: '2026-04-23T12:00:00.000Z',
      cancelledAt: null,
      userId: USER_ALPHA_ID,
      expiresAt: '2026-06-01T12:00:00.000Z',
      expectedStatus: 409,
    },
    {
      id: '83838383-8383-4383-8383-838383838383',
      status: 'PENDING_SETUP' as const,
      activatedAt: null,
      cancelledAt: null,
      userId: null,
      expiresAt: '2026-04-01T12:00:00.000Z',
      expectedStatus: 410,
    },
  ];

  for (const invite of blockedInvites) {
    await app.repositories.invite.save({
      id: invite.id,
      companyId: COMPANY_ALPHA_ID,
      name: 'Blocked Invite',
      email: `${invite.id}@storepage.com`,
      normalizedEmail: `${invite.id}@storepage.com`,
      cpf: null,
      role: 'USER',
      orgUnitId: UNIT_ALPHA_ID,
      token: `invite_token_${invite.id.replace(/-/g, '')}`,
      status: invite.status,
      invitedByUserId: ADMIN_ALPHA_ID,
      userId: invite.userId,
      expiresAt: invite.expiresAt,
      activatedAt: invite.activatedAt,
      cancelledAt: invite.cancelledAt,
      deletedAt: null,
      createdAt: '2026-04-23T12:00:00.000Z',
      updatedAt: '2026-04-23T12:00:00.000Z',
    });

    const blockedResponse = await app.inject({
      method: 'POST',
      url: `/api/admin/users/invites/${invite.id}/resend`,
      headers: {
        authorization: `Bearer ${login.data.accessToken}`,
      },
    });
    assert.equal(blockedResponse.statusCode, invite.expectedStatus);
  }
});

test('settings and organizational structure endpoints support admin management and forbid regular users', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const adminLogin = await loginAsAdminAlpha(app);

  const logoOnlyAppearanceResponse = await app.inject({
    method: 'PATCH',
    url: '/api/admin/settings/appearance',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      logoUrl: 'https://cdn.storepage.test/alpha/logo-v2.png',
    },
  });

  assert.equal(logoOnlyAppearanceResponse.statusCode, 200);

  const heroImageOnlyAppearanceResponse = await app.inject({
    method: 'PATCH',
    url: '/api/admin/settings/appearance',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      hero: {
        imageUrl: 'https://cdn.storepage.test/alpha/hero-v2.png',
      },
    },
  });

  assert.equal(heroImageOnlyAppearanceResponse.statusCode, 200);
  const heroImageOnlyAppearancePayload = heroImageOnlyAppearanceResponse.json() as SuccessResponse<{
    branding: { logoUrl: string | null; hero: { title: string; subtitle: string; imageUrl: string | null } };
  }>;
  assert.equal(heroImageOnlyAppearancePayload.data.branding.logoUrl, 'https://cdn.storepage.test/alpha/logo-v2.png');
  assert.equal(heroImageOnlyAppearancePayload.data.branding.hero.imageUrl, 'https://cdn.storepage.test/alpha/hero-v2.png');
  assert.equal(heroImageOnlyAppearancePayload.data.branding.hero.title, 'Portal Alpha');
  assert.equal(heroImageOnlyAppearancePayload.data.branding.hero.subtitle, 'Treinamentos e operacao do tenant Alpha.');

  const updateAppearanceResponse = await app.inject({
    method: 'PATCH',
    url: '/api/admin/settings/appearance',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      hero: {
        title: 'Portal Alpha Atualizado',
      },
      theme: {
        primary: '#0b1120',
      },
    },
  });

  assert.equal(updateAppearanceResponse.statusCode, 200);

  const updatedAppearanceResponse = await app.inject({
    method: 'GET',
    url: '/api/settings/appearance/alpha-store',
  });

  const updatedAppearancePayload = updatedAppearanceResponse.json() as SuccessResponse<{
    branding: { hero: { title: string }; theme: { primary: string } };
  }>;
  assert.equal(updatedAppearancePayload.data.branding.hero.title, 'Portal Alpha Atualizado');
  assert.equal(updatedAppearancePayload.data.branding.theme.primary, '#0b1120');

  const createTopLevelResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/top-levels',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Distrito Norte',
      levelIndex: 2,
      parentId: TOP_LEVEL_ALPHA_ID,
    },
  });

  assert.equal(createTopLevelResponse.statusCode, 201);
  const createTopLevelPayload = createTopLevelResponse.json() as SuccessResponse<{ id: string }>;

  const createUnitResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/units',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Loja Nova',
      code: 'ALPHA-02',
      topLevelId: createTopLevelPayload.data.id,
      active: true,
    },
  });

  assert.equal(createUnitResponse.statusCode, 201);

  const deleteUnitInUseResponse = await app.inject({
    method: 'DELETE',
    url: `/api/admin/structure/units/${UNIT_ALPHA_ID}`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(deleteUnitInUseResponse.statusCode, 409);
  const deleteUnitInUsePayload = deleteUnitInUseResponse.json() as ErrorResponse;
  assert.equal(deleteUnitInUsePayload.code, 'RESOURCE_IN_USE');

  const userLoginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'user.alpha@storepage.com',
      password: 'UserPass123!',
      company_slug: 'alpha-store',
    },
  });

  assert.equal(userLoginResponse.statusCode, 200);
  const userLoginPayload = userLoginResponse.json() as SuccessResponse<{ accessToken: string }>;

  const forbiddenAdminResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/structure',
    headers: {
      authorization: `Bearer ${userLoginPayload.data.accessToken}`,
    },
  });

  assert.equal(forbiddenAdminResponse.statusCode, 403);
  const forbiddenAdminPayload = forbiddenAdminResponse.json() as ErrorResponse;
  assert.equal(forbiddenAdminPayload.code, 'FORBIDDEN');
});

test('admin structure supports a single configured hierarchy level for units', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const betaLoginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.beta@storepage.com',
      password: 'Password123!',
      company_slug: 'beta-store',
    },
  });

  assert.equal(betaLoginResponse.statusCode, 200);
  const betaLogin = betaLoginResponse.json() as SuccessResponse<{ accessToken: string }>;

  const createTopLevelResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/top-levels',
    headers: {
      authorization: `Bearer ${betaLogin.data.accessToken}`,
    },
    payload: {
      name: 'Regional Sul',
      levelIndex: 1,
      parentId: null,
    },
  });

  assert.equal(createTopLevelResponse.statusCode, 201);
  const createTopLevelPayload = createTopLevelResponse.json() as SuccessResponse<{ id: string }>;

  const createUnitResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/units',
    headers: {
      authorization: `Bearer ${betaLogin.data.accessToken}`,
    },
    payload: {
      name: 'Filial Regional',
      topLevelId: createTopLevelPayload.data.id,
      active: true,
    },
  });

  assert.equal(createUnitResponse.statusCode, 201);
});

test('admin structure inserts a parent level through an explicit safe transition', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const betaLoginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.beta@storepage.com',
      password: 'Password123!',
      company_slug: 'beta-store',
    },
  });

  assert.equal(betaLoginResponse.statusCode, 200);
  const betaLogin = betaLoginResponse.json() as SuccessResponse<{ accessToken: string }>;
  const betaHeaders = { authorization: `Bearer ${betaLogin.data.accessToken}` };

  const createTopLevelResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/top-levels',
    headers: betaHeaders,
    payload: {
      name: 'Regional Sul',
      levelIndex: 1,
      parentId: null,
    },
  });

  assert.equal(createTopLevelResponse.statusCode, 201);
  const createTopLevelPayload = createTopLevelResponse.json() as SuccessResponse<{ id: string }>;
  const regionalId = createTopLevelPayload.data.id;

  const legacyParentResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/top-levels',
    headers: betaHeaders,
    payload: {
      name: 'Sede Legada',
      levelIndex: 1,
      parentId: null,
    },
  });

  assert.equal(legacyParentResponse.statusCode, 201);
  const legacyParentPayload = legacyParentResponse.json() as SuccessResponse<{ id: string }>;
  const legacyParentId = legacyParentPayload.data.id;

  const regionalRecord = (await app.repositories.structure.listTopLevels(COMPANY_BETA_ID)).find(
    (topLevel) => topLevel.id === regionalId,
  );
  assert.ok(regionalRecord);
  await app.repositories.structure.saveTopLevel({
    ...regionalRecord,
    parentId: legacyParentId,
  });

  const createUnitResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/units',
    headers: betaHeaders,
    payload: {
      name: 'Filial Regional',
      topLevelId: regionalId,
      active: true,
    },
  });

  assert.equal(createUnitResponse.statusCode, 201);
  const createUnitPayload = createUnitResponse.json() as SuccessResponse<{ id: string; topLevelId: string }>;
  assert.equal(createUnitPayload.data.topLevelId, regionalId);

  const directSettingsUpdateResponse = await app.inject({
    method: 'PATCH',
    url: '/api/admin/settings/general',
    headers: betaHeaders,
    payload: {
      orgLevels: ['Diretoria', 'Regiao'],
    },
  });

  assert.equal(directSettingsUpdateResponse.statusCode, 409);
  const directSettingsUpdatePayload = directSettingsUpdateResponse.json() as ErrorResponse;
  assert.equal(directSettingsUpdatePayload.code, 'RESOURCE_IN_USE');

  const transitionResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/transitions/insert-parent-level',
    headers: betaHeaders,
    payload: {
      orgLevels: ['Diretoria', 'Regiao'],
      orgUnitName: 'Filial',
      parentName: 'Diretoria Nacional',
      childTopLevelIds: [regionalId, legacyParentId],
    },
  });

  assert.equal(transitionResponse.statusCode, 200);
  const transitionPayload = transitionResponse.json() as SuccessResponse<{
    general: { orgLevels: string[]; orgUnitName: string };
  }>;
  assert.deepEqual(transitionPayload.data.general.orgLevels, ['Diretoria', 'Regiao']);
  assert.equal(transitionPayload.data.general.orgUnitName, 'Filial');

  const structureResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/structure',
    headers: betaHeaders,
  });

  assert.equal(structureResponse.statusCode, 200);
  const structurePayload = structureResponse.json() as SuccessResponse<{
    orgLevels: string[];
    topLevels: Array<{ id: string; name: string; levelIndex: number; parentId: string | null }>;
    units: Array<{ id: string; topLevelId: string | null }>;
  }>;

  const parent = structurePayload.data.topLevels.find((topLevel) => topLevel.name === 'Diretoria Nacional');
  const regional = structurePayload.data.topLevels.find((topLevel) => topLevel.id === regionalId);
  const legacyParent = structurePayload.data.topLevels.find((topLevel) => topLevel.id === legacyParentId);
  const unit = structurePayload.data.units.find((entry) => entry.id === createUnitPayload.data.id);

  assert.ok(parent);
  assert.equal(parent.levelIndex, 1);
  assert.equal(parent.parentId, null);
  assert.ok(regional);
  assert.equal(regional.levelIndex, 2);
  assert.equal(regional.parentId, parent.id);
  assert.ok(legacyParent);
  assert.equal(legacyParent.levelIndex, 2);
  assert.equal(legacyParent.parentId, parent.id);
  assert.ok(unit);
  assert.equal(unit.topLevelId, regionalId);
});

test('admin structure parent-level transition validates tenant scope and admin access', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const betaLoginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.beta@storepage.com',
      password: 'Password123!',
      company_slug: 'beta-store',
    },
  });

  assert.equal(betaLoginResponse.statusCode, 200);
  const betaLogin = betaLoginResponse.json() as SuccessResponse<{ accessToken: string }>;
  const betaHeaders = { authorization: `Bearer ${betaLogin.data.accessToken}` };

  const createTopLevelResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/top-levels',
    headers: betaHeaders,
    payload: {
      name: 'Regional Sul',
      levelIndex: 1,
      parentId: null,
    },
  });

  assert.equal(createTopLevelResponse.statusCode, 201);

  const crossTenantResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/transitions/insert-parent-level',
    headers: betaHeaders,
    payload: {
      orgLevels: ['Diretoria', 'Regiao'],
      parentName: 'Diretoria Nacional',
      childTopLevelIds: [TOP_LEVEL_ALPHA_ID],
    },
  });

  assert.equal(crossTenantResponse.statusCode, 400);
  const crossTenantPayload = crossTenantResponse.json() as ErrorResponse;
  assert.equal(crossTenantPayload.code, 'BAD_REQUEST');

  const forgedCompanyResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/transitions/insert-parent-level',
    headers: betaHeaders,
    payload: {
      companyId: COMPANY_ALPHA_ID,
      orgLevels: ['Diretoria', 'Regiao'],
      parentName: 'Diretoria Nacional',
      childTopLevelIds: [TOP_LEVEL_ALPHA_ID],
    },
  });

  assert.equal(forgedCompanyResponse.statusCode, 400);

  const userLogin = await loginAsUserAlpha(app);
  const forbiddenResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/transitions/insert-parent-level',
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      orgLevels: ['Diretoria', 'Regional'],
      parentName: 'Diretoria Nacional',
      childTopLevelIds: [TOP_LEVEL_ALPHA_ID],
    },
  });

  assert.equal(forbiddenResponse.statusCode, 403);
});

test('admin structure rejects units linked to non-leaf hierarchy levels', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const login = await loginAsAdminAlpha(app);

  const createUnitResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/units',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
    payload: {
      name: 'Loja Nivel Intermediario',
      topLevelId: TOP_LEVEL_ALPHA_ID,
      active: true,
    },
  });

  assert.equal(createUnitResponse.statusCode, 400);
  const createUnitPayload = createUnitResponse.json() as ErrorResponse;
  assert.equal(createUnitPayload.code, 'BAD_REQUEST');
});

test('admin structure only allows null unit parent when no hierarchy levels are configured', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const betaLoginResponse = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.beta@storepage.com',
      password: 'Password123!',
      company_slug: 'beta-store',
    },
  });

  assert.equal(betaLoginResponse.statusCode, 200);
  const betaLogin = betaLoginResponse.json() as SuccessResponse<{ accessToken: string }>;

  const rejectedResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/units',
    headers: {
      authorization: `Bearer ${betaLogin.data.accessToken}`,
    },
    payload: {
      name: 'Filial Sem Pai Bloqueada',
      topLevelId: null,
      active: true,
    },
  });

  assert.equal(rejectedResponse.statusCode, 400);

  const clearLevelsResponse = await app.inject({
    method: 'PATCH',
    url: '/api/admin/settings/general',
    headers: {
      authorization: `Bearer ${betaLogin.data.accessToken}`,
    },
    payload: {
      orgLevels: [],
    },
  });

  assert.equal(clearLevelsResponse.statusCode, 200);

  const allowedResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/units',
    headers: {
      authorization: `Bearer ${betaLogin.data.accessToken}`,
    },
    payload: {
      name: 'Filial Sem Pai Permitida',
      topLevelId: null,
      active: true,
    },
  });

  assert.equal(allowedResponse.statusCode, 201);
});

test('admin settings rejects reducing hierarchy levels while deeper top-level nodes exist', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const login = await loginAsAdminAlpha(app);

  const createTopLevelResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/structure/top-levels',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
    payload: {
      name: 'Distrito Bloqueador',
      levelIndex: 2,
      parentId: TOP_LEVEL_ALPHA_ID,
    },
  });

  assert.equal(createTopLevelResponse.statusCode, 201);

  const reduceLevelsResponse = await app.inject({
    method: 'PATCH',
    url: '/api/admin/settings/general',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
    payload: {
      orgLevels: ['Regional'],
    },
  });

  assert.equal(reduceLevelsResponse.statusCode, 409);
  const reduceLevelsPayload = reduceLevelsResponse.json() as ErrorResponse;
  assert.equal(reduceLevelsPayload.code, 'RESOURCE_IN_USE');
});

test('user rewards endpoint wraps legacy stats RPC behind authenticated self-service access', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const unauthenticatedResponse = await app.inject({
    method: 'POST',
    url: '/api/users/me/rewards/increment',
    payload: {
      xp: 25,
      coins: 5,
    },
  });

  assert.equal(unauthenticatedResponse.statusCode, 401);
  const unauthenticatedPayload = unauthenticatedResponse.json() as ErrorResponse;
  assert.equal(unauthenticatedPayload.code, 'UNAUTHENTICATED');

  const userLogin = await loginAsUserAlpha(app);
  const invalidPayloadResponse = await app.inject({
    method: 'POST',
    url: '/api/users/me/rewards/increment',
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      xp: 0,
      coins: 0,
    },
  });

  assert.equal(invalidPayloadResponse.statusCode, 400);
  const invalidPayload = invalidPayloadResponse.json() as ErrorResponse;
  assert.equal(invalidPayload.code, 'VALIDATION_ERROR');

  const incrementResponse = await app.inject({
    method: 'POST',
    url: '/api/users/me/rewards/increment',
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      xp: 50,
      coins: 7,
    },
  });

  assert.equal(incrementResponse.statusCode, 200);
  const incrementPayload = incrementResponse.json() as SuccessResponse<{
    userId: string;
    xpTotal: number;
    coinsTotal: number;
  }>;
  assert.equal(incrementPayload.data.userId, USER_ALPHA_ID);
  assert.equal(incrementPayload.data.xpTotal, 50);
  assert.equal(incrementPayload.data.coinsTotal, 7);
});

test('survey response endpoint persists responses and stamps actor tenant identity', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const unauthenticatedResponse = await app.inject({
    method: 'POST',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    payload: {
      answers: [
        {
          question_id: SURVEY_QUESTION_ALPHA_ID,
          value: {
            type: 'SHORT_TEXT',
            text: 'Sem autenticação',
          },
        },
      ],
    },
  });

  assert.equal(unauthenticatedResponse.statusCode, 401);
  const unauthenticatedPayload = unauthenticatedResponse.json() as ErrorResponse;
  assert.equal(unauthenticatedPayload.code, 'UNAUTHENTICATED');

  const userLogin = await loginAsUserAlpha(app);
  const emptyAnswersResponse = await app.inject({
    method: 'POST',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      answers: [],
    },
  });

  assert.equal(emptyAnswersResponse.statusCode, 400);
  const emptyAnswersPayload = emptyAnswersResponse.json() as ErrorResponse;
  assert.equal(emptyAnswersPayload.code, 'VALIDATION_ERROR');

  const emptyRequiredAnswerResponse = await app.inject({
    method: 'POST',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      answers: [
        {
          question_id: SURVEY_QUESTION_ALPHA_ID,
          value: {
            type: 'SHORT_TEXT',
            text: '   ',
          },
        },
      ],
    },
  });

  assert.equal(emptyRequiredAnswerResponse.statusCode, 400);
  const emptyRequiredAnswerPayload = emptyRequiredAnswerResponse.json() as ErrorResponse;
  assert.equal(emptyRequiredAnswerPayload.code, 'BAD_REQUEST');

  const mismatchedQuestionTypeResponse = await app.inject({
    method: 'POST',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      answers: [
        {
          question_id: SURVEY_QUESTION_ALPHA_ID,
          value: {
            type: 'YES_NO',
            value: true,
          },
        },
      ],
    },
  });

  assert.equal(mismatchedQuestionTypeResponse.statusCode, 400);
  const mismatchedQuestionTypePayload = mismatchedQuestionTypeResponse.json() as ErrorResponse;
  assert.equal(mismatchedQuestionTypePayload.code, 'BAD_REQUEST');

  const deletedQuestionResponse = await app.inject({
    method: 'POST',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      answers: [
        {
          question_id: SURVEY_QUESTION_DELETED_ID,
          value: {
            type: 'SHORT_TEXT',
            text: 'Resposta para pergunta removida',
          },
        },
      ],
    },
  });

  assert.equal(deletedQuestionResponse.statusCode, 400);
  const deletedQuestionPayload = deletedQuestionResponse.json() as ErrorResponse;
  assert.equal(deletedQuestionPayload.code, 'BAD_REQUEST');

  const validResponse = await app.inject({
    method: 'POST',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      user_id: ADMIN_BETA_ID,
      company_id: COMPANY_BETA_ID,
      started_at: '2026-04-23T12:05:00.000Z',
      answers: [
        {
          question_id: SURVEY_QUESTION_ALPHA_ID,
          value: {
            type: 'SHORT_TEXT',
            text: 'Resposta autenticada',
          },
        },
      ],
    },
  });

  assert.equal(validResponse.statusCode, 201);
  const validPayload = validResponse.json() as SuccessResponse<{ responseId: string }>;
  assert.match(validPayload.data.responseId, /^[0-9a-f-]{36}$/);

  const responsesResponse = await app.inject({
    method: 'GET',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
  });

  assert.equal(responsesResponse.statusCode, 403);

  const adminLogin = await loginAsAdminAlpha(app);
  const adminResponsesResponse = await app.inject({
    method: 'GET',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(adminResponsesResponse.statusCode, 200);
  const responsesPayload = adminResponsesResponse.json() as SuccessResponse<Array<{
    id: string;
    surveyId: string;
    userId: string | null;
    companyId: string;
  }>>;
  const submitted = responsesPayload.data.find((response) => response.id === validPayload.data.responseId);
  assert.equal(submitted?.surveyId, SURVEY_ALPHA_ID);
  assert.equal(submitted?.userId, USER_ALPHA_ID);
  assert.equal(submitted?.companyId, COMPANY_ALPHA_ID);
});

test('phase 5 survey catalog, admin CRUD and tenant isolation use repository contracts', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const adminLogin = await loginAsAdminAlpha(app);
  const userLogin = await loginAsUserAlpha(app);
  const adminHeaders = { authorization: `Bearer ${adminLogin.data.accessToken}` };
  const userHeaders = { authorization: `Bearer ${userLogin.data.accessToken}` };

  const listResponse = await app.inject({
    method: 'GET',
    url: '/api/surveys',
    headers: adminHeaders,
  });

  assert.equal(listResponse.statusCode, 200);
  const listPayload = listResponse.json() as SuccessResponse<Array<{ id: string; companyId: string; questionCount: number }>>;
  assert.equal(listPayload.data.some((survey) => survey.id === SURVEY_ALPHA_ID), true);
  assert.equal(listPayload.data.some((survey) => survey.companyId === COMPANY_BETA_ID), false);
  assert.equal(listPayload.data.find((survey) => survey.id === SURVEY_ALPHA_ID)?.questionCount, 1);

  const crossTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/surveys/${SURVEY_BETA_ID}`,
    headers: adminHeaders,
  });
  assert.equal(crossTenantResponse.statusCode, 404);

  const questionsResponse = await app.inject({
    method: 'GET',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/questions`,
    headers: userHeaders,
  });
  assert.equal(questionsResponse.statusCode, 200);
  const questionsPayload = questionsResponse.json() as SuccessResponse<Array<{ id: string; orderIndex: number }>>;
  assert.equal(questionsPayload.data.length, 1);
  assert.equal(questionsPayload.data[0]?.id, SURVEY_QUESTION_ALPHA_ID);

  const forbiddenAdminResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/surveys',
    headers: userHeaders,
    payload: {
      title: 'Pesquisa Usuario',
    },
  });
  assert.equal(forbiddenAdminResponse.statusCode, 403);

  const createSurveyResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/surveys',
    headers: adminHeaders,
    payload: {
      title: 'Pesquisa Criada',
      description: 'Criada via teste',
      status: 'DRAFT',
      accessType: 'ALL',
      allowMultipleResponses: true,
      anonymous: false,
    },
  });
  assert.equal(createSurveyResponse.statusCode, 201);
  const createSurveyPayload = createSurveyResponse.json() as SuccessResponse<{ id: string; companyId: string; title: string }>;
  assert.equal(createSurveyPayload.data.companyId, COMPANY_ALPHA_ID);

  const updateSurveyResponse = await app.inject({
    method: 'PUT',
    url: `/api/admin/surveys/${createSurveyPayload.data.id}`,
    headers: adminHeaders,
    payload: {
      title: 'Pesquisa Atualizada',
      status: 'ACTIVE',
    },
  });
  assert.equal(updateSurveyResponse.statusCode, 200);
  const updateSurveyPayload = updateSurveyResponse.json() as SuccessResponse<{ title: string; status: string }>;
  assert.equal(updateSurveyPayload.data.title, 'Pesquisa Atualizada');
  assert.equal(updateSurveyPayload.data.status, 'ACTIVE');

  const paginatedSurveysResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/surveys/paginated?page=1&limit=1&search=Pesquisa',
    headers: adminHeaders,
  });
  assert.equal(paginatedSurveysResponse.statusCode, 200);
  const paginatedSurveys = paginatedSurveysResponse.json() as SuccessResponse<{
    items: Array<{ id: string; companyId: string; title: string; questionCount: number }>;
    meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
  }>;
  assert.equal(paginatedSurveys.data.meta.page, 1);
  assert.equal(paginatedSurveys.data.meta.limit, 1);
  assert.ok(paginatedSurveys.data.meta.total >= 1);
  assert.equal(paginatedSurveys.data.items.length, 1);
  assert.equal(paginatedSurveys.data.items[0]?.companyId, COMPANY_ALPHA_ID);

  const createQuestionResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/surveys/${createSurveyPayload.data.id}/questions`,
    headers: adminHeaders,
    payload: {
      questionText: 'Qual sua nota?',
      questionType: 'NPS',
      configuration: { type: 'NPS' },
      required: true,
      orderIndex: 3,
    },
  });
  assert.equal(createQuestionResponse.statusCode, 201);
  const createQuestionPayload = createQuestionResponse.json() as SuccessResponse<{ id: string; orderIndex: number }>;

  const updateQuestionResponse = await app.inject({
    method: 'PUT',
    url: `/api/admin/survey-questions/${createQuestionPayload.data.id}`,
    headers: adminHeaders,
    payload: {
      questionText: 'Qual sua nota atualizada?',
      orderIndex: 2,
    },
  });
  assert.equal(updateQuestionResponse.statusCode, 200);

  const reorderResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/survey-questions/reorder',
    headers: adminHeaders,
    payload: {
      items: [
        {
          id: createQuestionPayload.data.id,
          orderIndex: 0,
        },
      ],
    },
  });
  assert.equal(reorderResponse.statusCode, 200);
  const reorderPayload = reorderResponse.json() as SuccessResponse<{ updated: number }>;
  assert.equal(reorderPayload.data.updated, 1);

  const deleteQuestionResponse = await app.inject({
    method: 'DELETE',
    url: `/api/admin/survey-questions/${createQuestionPayload.data.id}`,
    headers: adminHeaders,
  });
  assert.equal(deleteQuestionResponse.statusCode, 200);

  const deleteSurveyResponse = await app.inject({
    method: 'DELETE',
    url: `/api/admin/surveys/${createSurveyPayload.data.id}`,
    headers: adminHeaders,
  });
  assert.equal(deleteSurveyResponse.statusCode, 200);

  const deletedSurveyResponse = await app.inject({
    method: 'GET',
    url: `/api/surveys/${createSurveyPayload.data.id}`,
    headers: adminHeaders,
  });
  assert.equal(deletedSurveyResponse.statusCode, 404);
});

test('phase 5 survey responses and answers are scoped to tenant and authenticated user', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const adminLogin = await loginAsAdminAlpha(app);
  const userLogin = await loginAsUserAlpha(app);
  const betaLogin = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: {
      identifier: 'admin.beta@storepage.com',
      password: 'Password123!',
      company_slug: 'beta-store',
    },
  });
  const betaPayload = betaLogin.json() as SuccessResponse<{ accessToken: string }>;

  const responsesResponse = await app.inject({
    method: 'GET',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });
  assert.equal(responsesResponse.statusCode, 200);
  const responsesPayload = responsesResponse.json() as SuccessResponse<Array<{ id: string; companyId: string; user: { name: string } | null }>>;
  assert.deepEqual(responsesPayload.data.map((response) => response.companyId), [COMPANY_ALPHA_ID]);
  assert.equal(responsesPayload.data[0]?.user?.name, 'User Alpha');

  const answersResponse = await app.inject({
    method: 'GET',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/answers`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });
  assert.equal(answersResponse.statusCode, 200);
  const answersPayload = answersResponse.json() as SuccessResponse<Array<{ id: string; responseId: string }>>;
  assert.deepEqual(answersPayload.data.map((answer) => answer.id), [SURVEY_ANSWER_ALPHA_ID]);

  const userResponsesResponse = await app.inject({
    method: 'GET',
    url: '/api/users/me/survey-responses',
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
  });
  assert.equal(userResponsesResponse.statusCode, 200);
  const userResponsesPayload = userResponsesResponse.json() as SuccessResponse<Array<{ userId: string | null; companyId: string }>>;
  assert.deepEqual(userResponsesPayload.data.map((response) => response.userId), [USER_ALPHA_ID]);
  assert.deepEqual(userResponsesPayload.data.map((response) => response.companyId), [COMPANY_ALPHA_ID]);

  const betaCrossTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/surveys/${SURVEY_ALPHA_ID}/responses`,
    headers: {
      authorization: `Bearer ${betaPayload.data.accessToken}`,
    },
  });
  assert.equal(betaCrossTenantResponse.statusCode, 404);
});

test('super-admin provisioning endpoint enforces role and validates tenant admin payloads', async (t) => {
  const env = createJwtEnv();
  const seed = await createSeed();
  const provider = new CapturingInviteDeliveryProvider();
  const app = buildApp(env, { seed, inviteDeliveryProvider: provider });
  await app.ready();
  t.after(async () => {
    await app.close();
  });

  const adminLogin = await loginAsAdminAlpha(app);
  const forbiddenResponse = await app.inject({
    method: 'POST',
    url: `/api/super-admin/companies/${COMPANY_ALPHA_ID}/provision-admin`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Admin Provisionado',
      email: 'admin.provisionado@storepage.com',
      role: 'ADMIN',
    },
  });

  assert.equal(forbiddenResponse.statusCode, 403);
  const forbiddenPayload = forbiddenResponse.json() as ErrorResponse;
  assert.equal(forbiddenPayload.code, 'FORBIDDEN');

  const superAdminLogin = await loginAsSuperAdminAlpha(app);
  const missingCompanyResponse = await app.inject({
    method: 'POST',
    url: '/api/super-admin/companies/77777777-7777-4777-8777-777777777777/provision-admin',
    headers: {
      authorization: `Bearer ${superAdminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Admin Sem Empresa',
      email: 'admin.sem.empresa@storepage.com',
      role: 'ADMIN',
    },
  });

  assert.equal(missingCompanyResponse.statusCode, 404);
  const missingCompanyPayload = missingCompanyResponse.json() as ErrorResponse;
  assert.equal(missingCompanyPayload.code, 'NOT_FOUND');

  const superAdminRoleResponse = await app.inject({
    method: 'POST',
    url: `/api/super-admin/companies/${COMPANY_ALPHA_ID}/provision-admin`,
    headers: {
      authorization: `Bearer ${superAdminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Super Admin Indevido',
      email: 'super.admin.indevido@storepage.com',
      role: 'SUPER_ADMIN',
    },
  });

  assert.equal(superAdminRoleResponse.statusCode, 400);
  const superAdminRolePayload = superAdminRoleResponse.json() as ErrorResponse;
  assert.equal(superAdminRolePayload.code, 'BAD_REQUEST');

  const provisionResponse = await app.inject({
    method: 'POST',
    url: `/api/super-admin/companies/${COMPANY_ALPHA_ID}/provision-admin`,
    headers: {
      authorization: `Bearer ${superAdminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Admin Provisionado',
      email: 'admin.provisionado@storepage.com',
      role: 'ADMIN',
    },
  });

  assert.equal(provisionResponse.statusCode, 201);
  const provisionPayload = provisionResponse.json() as SuccessResponse<{
    status: string;
    inviteId: string | null;
    userId: string | null;
  }>;
  assert.equal(provisionPayload.data.status, 'created_user');
  assert.equal(provisionPayload.data.inviteId, null);
  assert.match(provisionPayload.data.userId ?? '', /^[0-9a-f-]{36}$/);
  assert.equal(provisionResponse.body.includes('123456'), false);
  assert.equal(provisionResponse.body.includes('scrypt$'), false);
  assert.equal(provisionResponse.body.includes('activationToken'), false);
  assert.equal(provisionResponse.body.includes('inviteToken'), false);
  assert.equal(provisionResponse.body.includes('/ativar-convite'), false);

  const savedInvite = await app.repositories.invite.findPendingByEmail(
    COMPANY_ALPHA_ID,
    'admin.provisionado@storepage.com',
  );
  assert.equal(savedInvite, null);
  assert.equal(provider.calls.length, 0);

  const savedUser = await app.repositories.user.findByEmail(COMPANY_ALPHA_ID, 'admin.provisionado@storepage.com');
  assert.ok(savedUser);
  assert.equal(savedUser.id, provisionPayload.data.userId);
  assert.equal(savedUser.status, 'ACTIVE');
  assert.equal(savedUser.active, true);
  assert.equal(savedUser.firstAccess, true);
  assert.ok(savedUser.passwordHash);
  assert.equal(savedUser.passwordHash.includes('123456'), false);
  assert.equal(await new PasswordService().verifyPassword('123456', savedUser.passwordHash), true);

  const duplicateProvisionResponse = await app.inject({
    method: 'POST',
    url: `/api/super-admin/companies/${COMPANY_ALPHA_ID}/provision-admin`,
    headers: {
      authorization: `Bearer ${superAdminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Admin Provisionado Atualizado',
      email: 'admin.provisionado@storepage.com',
      role: 'ADMIN',
    },
  });

  assert.equal(duplicateProvisionResponse.statusCode, 201);
  const duplicateProvisionPayload = duplicateProvisionResponse.json() as SuccessResponse<{
    status: string;
    inviteId: string | null;
    userId: string | null;
  }>;
  assert.equal(duplicateProvisionPayload.data.status, 'updated_existing');
  assert.equal(duplicateProvisionPayload.data.inviteId, null);
  assert.equal(duplicateProvisionPayload.data.userId, savedUser.id);
  assert.equal(provider.calls.length, 0);

  const updatedProvisionedUser = await app.repositories.user.findByEmail(COMPANY_ALPHA_ID, 'admin.provisionado@storepage.com');
  assert.equal(updatedProvisionedUser?.id, savedUser.id);
  assert.equal(updatedProvisionedUser?.name, 'Admin Provisionado Atualizado');
  assert.equal(updatedProvisionedUser?.firstAccess, true);

  const userLogin = await loginAsUserAlpha(app);
  const existingUserProvisionResponse = await app.inject({
    method: 'POST',
    url: `/api/super-admin/companies/${COMPANY_ALPHA_ID}/provision-admin`,
    headers: {
      authorization: `Bearer ${superAdminLogin.data.accessToken}`,
    },
    payload: {
      name: 'User Alpha Promovido',
      email: 'user.alpha@storepage.com',
      role: 'ADMIN',
    },
  });

  assert.equal(existingUserProvisionResponse.statusCode, 201);
  const existingUserProvisionPayload = existingUserProvisionResponse.json() as SuccessResponse<{
    status: string;
    inviteId: string | null;
    userId: string | null;
  }>;
  assert.equal(existingUserProvisionPayload.data.status, 'updated_existing');
  assert.equal(existingUserProvisionPayload.data.inviteId, null);
  assert.equal(existingUserProvisionPayload.data.userId, USER_ALPHA_ID);

  const updatedUser = await app.repositories.user.findAnyById(USER_ALPHA_ID);
  assert.equal(updatedUser?.role, 'ADMIN');
  assert.equal(updatedUser?.status, 'ACTIVE');
  assert.equal(updatedUser?.active, true);

  const revokedSessionResponse = await app.inject({
    method: 'GET',
    url: '/api/auth/me',
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
  });
  assert.equal(revokedSessionResponse.statusCode, 401);
});

test('phase 2 repository catalog endpoints enforce tenant scope and support admin CRUD', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const adminLogin = await loginAsAdminAlpha(app);

  const repositoriesResponse = await app.inject({
    method: 'GET',
    url: '/api/repositories',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(repositoriesResponse.statusCode, 200);
  const repositoriesPayload = repositoriesResponse.json() as SuccessResponse<Array<{ id: string; companyId: string }>>;
  assert.equal(repositoriesPayload.data.some((repository) => repository.id === REPOSITORY_ALPHA_ID), true);
  assert.equal(repositoriesPayload.data.some((repository) => repository.id === REPOSITORY_BETA_ID), false);

  const crossTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/repositories/${REPOSITORY_BETA_ID}`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(crossTenantResponse.statusCode, 404);

  const catalogResponse = await app.inject({
    method: 'GET',
    url: `/api/repositories/${REPOSITORY_ALPHA_ID}/catalog`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(catalogResponse.statusCode, 200);
  const catalogPayload = catalogResponse.json() as SuccessResponse<{
    repository: { id: string };
    categories: Array<{ id: string }>;
    contents: Array<{ id: string }>;
    simpleLinks: Array<{ id: string }>;
  }>;
  assert.equal(catalogPayload.data.repository.id, REPOSITORY_ALPHA_ID);
  assert.equal(catalogPayload.data.categories[0]?.id, CATEGORY_ALPHA_ID);
  assert.equal(catalogPayload.data.contents[0]?.id, CONTENT_ALPHA_ID);
  assert.equal(catalogPayload.data.simpleLinks[0]?.id, SIMPLE_LINK_ALPHA_ID);

  const createRepositoryResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/repositories',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Repositorio Novo',
      description: 'Criado via API',
      type: 'FULL',
      coverImage: 'https://cdn.storepage.test/alpha/new.png',
      status: 'ACTIVE',
      showInLanding: true,
    },
  });

  assert.equal(createRepositoryResponse.statusCode, 201);
  const createRepositoryPayload = createRepositoryResponse.json() as SuccessResponse<{ id: string; companyId: string }>;
  assert.equal(createRepositoryPayload.data.companyId, COMPANY_ALPHA_ID);

  const createCategoryResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/repositories/${createRepositoryPayload.data.id}/categories`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      name: 'Categoria API',
      orderIndex: 2,
    },
  });

  assert.equal(createCategoryResponse.statusCode, 201);
  const createCategoryPayload = createCategoryResponse.json() as SuccessResponse<{ id: string }>;

  const createContentResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/contents',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      repositoryId: createRepositoryPayload.data.id,
      categoryId: createCategoryPayload.data.id,
      title: 'Conteudo API',
      description: 'Conteudo criado via API',
      type: 'VIDEO',
      url: 'https://cdn.storepage.test/alpha/video.mp4',
      status: 'ACTIVE',
    },
  });

  assert.equal(createContentResponse.statusCode, 201);
  const createContentPayload = createContentResponse.json() as SuccessResponse<{ id: string }>;

  const createSimpleLinkResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/simple-links',
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
    payload: {
      repositoryId: createRepositoryPayload.data.id,
      name: 'Link API',
      url: 'https://api.storepage.test',
      type: 'LINK',
      status: 'ACTIVE',
    },
  });

  assert.equal(createSimpleLinkResponse.statusCode, 201);

  const deleteContentResponse = await app.inject({
    method: 'DELETE',
    url: `/api/admin/contents/${createContentPayload.data.id}`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(deleteContentResponse.statusCode, 200);

  const deletedContentResponse = await app.inject({
    method: 'GET',
    url: `/api/contents/${createContentPayload.data.id}`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(deletedContentResponse.statusCode, 404);
});

test('phase 2 landing and metrics endpoints expose public data safely and record engagement', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const landingResponse = await app.inject({
    method: 'GET',
    url: '/api/landing/alpha-store',
  });

  assert.equal(landingResponse.statusCode, 200);
  const landingPayload = landingResponse.json() as SuccessResponse<{ companyId: string; name: string }>;
  assert.equal(landingPayload.data.companyId, COMPANY_ALPHA_ID);

  const publicRepositoriesResponse = await app.inject({
    method: 'GET',
    url: '/api/landing/alpha/repositories',
  });

  assert.equal(publicRepositoriesResponse.statusCode, 200);
  const publicRepositoriesPayload = publicRepositoriesResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.equal(publicRepositoriesPayload.data.some((repository) => repository.id === REPOSITORY_ALPHA_ID), true);
  assert.equal(publicRepositoriesPayload.data.some((repository) => repository.id === REPOSITORY_BETA_ID), false);

  const publicContentsResponse = await app.inject({
    method: 'GET',
    url: `/api/landing/repositories/${REPOSITORY_ALPHA_ID}/contents`,
  });

  assert.equal(publicContentsResponse.statusCode, 200);
  const publicContentsPayload = publicContentsResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.equal(publicContentsPayload.data[0]?.id, CONTENT_ALPHA_ID);

  const userLogin = await loginAsUserAlpha(app);
  const viewResponse = await app.inject({
    method: 'POST',
    url: '/api/metrics/views',
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      contentId: CONTENT_ALPHA_ID,
      repositoryId: REPOSITORY_ALPHA_ID,
      contentType: 'PDF',
    },
  });

  assert.equal(viewResponse.statusCode, 201);
  const viewPayload = viewResponse.json() as SuccessResponse<{ userId: string; companyId: string }>;
  assert.equal(viewPayload.data.userId, USER_ALPHA_ID);
  assert.equal(viewPayload.data.companyId, COMPANY_ALPHA_ID);

  const ratingResponse = await app.inject({
    method: 'POST',
    url: '/api/metrics/ratings',
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      contentId: CONTENT_ALPHA_ID,
      repositoryId: REPOSITORY_ALPHA_ID,
      rating: 8,
    },
  });

  assert.equal(ratingResponse.statusCode, 200);
  const secondRatingResponse = await app.inject({
    method: 'POST',
    url: '/api/metrics/ratings',
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
    payload: {
      contentId: CONTENT_ALPHA_ID,
      repositoryId: REPOSITORY_ALPHA_ID,
      rating: 10,
    },
  });

  assert.equal(secondRatingResponse.statusCode, 200);
  const secondRatingPayload = secondRatingResponse.json() as SuccessResponse<{ rating: number }>;
  assert.equal(secondRatingPayload.data.rating, 10);

  const unauthenticatedSummariesResponse = await app.inject({
    method: 'GET',
    url: '/api/metrics/content-summaries',
  });
  assert.equal(unauthenticatedSummariesResponse.statusCode, 401);

  const contentSummariesResponse = await app.inject({
    method: 'GET',
    url: `/api/metrics/content-summaries?repositoryId=${REPOSITORY_ALPHA_ID}`,
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
  });
  assert.equal(contentSummariesResponse.statusCode, 200);
  const contentSummariesPayload = contentSummariesResponse.json() as SuccessResponse<
    Array<{
      contentId: string;
      repositoryId: string;
      viewsCount: number;
      ratingsCount: number;
      averageRating: number | null;
      currentUserRating: number | null;
      userId?: string;
    }>
  >;
  const alphaSummary = contentSummariesPayload.data.find((summary) => summary.contentId === CONTENT_ALPHA_ID);
  assert.equal(alphaSummary?.repositoryId, REPOSITORY_ALPHA_ID);
  assert.equal(alphaSummary?.viewsCount, 1);
  assert.equal(alphaSummary?.ratingsCount, 1);
  assert.equal(alphaSummary?.averageRating, 10);
  assert.equal(alphaSummary?.currentUserRating, 10);
  assert.equal(alphaSummary?.userId, undefined);

  const crossTenantSummariesResponse = await app.inject({
    method: 'GET',
    url: `/api/metrics/content-summaries?repositoryId=${REPOSITORY_BETA_ID}`,
    headers: {
      authorization: `Bearer ${userLogin.data.accessToken}`,
    },
  });
  assert.equal(crossTenantSummariesResponse.statusCode, 404);

  const adminLogin = await loginAsAdminAlpha(app);
  const repositoryMetricsResponse = await app.inject({
    method: 'GET',
    url: `/api/admin/metrics/repositories?repositoryId=${REPOSITORY_ALPHA_ID}`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(repositoryMetricsResponse.statusCode, 200);
  const repositoryMetricsPayload = repositoryMetricsResponse.json() as SuccessResponse<{
    totalViews: number;
    totalRatings: number;
    averageRating: number;
  }>;
  assert.equal(repositoryMetricsPayload.data.totalViews, 1);
  assert.equal(repositoryMetricsPayload.data.totalRatings, 1);
  assert.equal(repositoryMetricsPayload.data.averageRating, 10);

  const userActivityResponse = await app.inject({
    method: 'GET',
    url: `/api/admin/metrics/users/${USER_ALPHA_ID}/activity`,
    headers: {
      authorization: `Bearer ${adminLogin.data.accessToken}`,
    },
  });

  assert.equal(userActivityResponse.statusCode, 200);
  const userActivityPayload = userActivityResponse.json() as SuccessResponse<Array<{ userId: string }>>;
  assert.equal(userActivityPayload.data.length, 1);
  assert.equal(userActivityPayload.data[0]?.userId, USER_ALPHA_ID);
});

test('user visible users endpoint is authenticated, tenant-scoped and sanitized', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const unauthenticatedResponse = await app.inject({
    method: 'GET',
    url: '/api/users/me/visible-users',
  });
  assert.equal(unauthenticatedResponse.statusCode, 401);

  const userLogin = await loginAsUserAlpha(app);
  const userHeaders = { authorization: `Bearer ${userLogin.data.accessToken}` };
  const ownUnitResponse = await app.inject({
    method: 'GET',
    url: '/api/users/me/visible-users',
    headers: userHeaders,
  });
  assert.equal(ownUnitResponse.statusCode, 200);
  const ownUnitPayload = ownUnitResponse.json() as SuccessResponse<
    Array<{
      id: string;
      name: string;
      avatarUrl: string | null;
      orgUnitId: string | null;
      email?: string;
      cpf?: string;
      role?: string;
      status?: string;
    }>
  >;
  assert.ok(ownUnitPayload.data.some((visibleUser) => visibleUser.id === USER_ALPHA_ID));
  assert.ok(ownUnitPayload.data.some((visibleUser) => visibleUser.id === ADMIN_ALPHA_ID));
  assert.equal(ownUnitPayload.data.some((visibleUser) => visibleUser.id === ADMIN_BETA_ID), false);
  assert.equal(ownUnitPayload.data.some((visibleUser) => visibleUser.email !== undefined), false);
  assert.equal(ownUnitPayload.data.some((visibleUser) => visibleUser.cpf !== undefined), false);
  assert.equal(ownUnitPayload.data.some((visibleUser) => visibleUser.role !== undefined), false);
  assert.equal(ownUnitPayload.data.some((visibleUser) => visibleUser.status !== undefined), false);

  const filteredResponse = await app.inject({
    method: 'GET',
    url: `/api/users/me/visible-users?ids=${ADMIN_ALPHA_ID},${ADMIN_BETA_ID}`,
    headers: userHeaders,
  });
  assert.equal(filteredResponse.statusCode, 200);
  const filteredPayload = filteredResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.deepEqual(filteredPayload.data.map((visibleUser) => visibleUser.id), [ADMIN_ALPHA_ID]);
});

test('restricted access rules deny empty ACLs and enforce user, unit, exclusion and tenant scope', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const adminLogin = await loginAsAdminAlpha(app);
  const userLogin = await loginAsUserAlpha(app);
  const adminHeaders = { authorization: `Bearer ${adminLogin.data.accessToken}` };
  const userHeaders = { authorization: `Bearer ${userLogin.data.accessToken}` };

  const emptyRestrictedRequests = await Promise.all([
    app.inject({
      method: 'POST',
      url: '/api/admin/repositories',
      headers: adminHeaders,
      payload: { name: 'Repo restrito vazio', accessType: 'RESTRICTED' },
    }),
    app.inject({
      method: 'POST',
      url: '/api/admin/courses',
      headers: adminHeaders,
      payload: { title: 'Curso restrito vazio', accessType: 'RESTRICTED' },
    }),
    app.inject({
      method: 'POST',
      url: '/api/admin/checklists',
      headers: adminHeaders,
      payload: { title: 'Checklist restrito vazio', accessType: 'RESTRICTED' },
    }),
    app.inject({
      method: 'POST',
      url: '/api/admin/surveys',
      headers: adminHeaders,
      payload: { title: 'Pesquisa restrita vazia', accessType: 'RESTRICTED' },
    }),
  ]);
  emptyRestrictedRequests.forEach((response) => assert.equal(response.statusCode, 400));

  const crossTenantTargetResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/repositories',
    headers: adminHeaders,
    payload: {
      name: 'Repo alvo de outro tenant',
      accessType: 'RESTRICTED',
      allowedStoreIds: [UNIT_BETA_ID],
    },
  });
  assert.equal(crossTenantTargetResponse.statusCode, 400);

  const unitRepositoryResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/repositories',
    headers: adminHeaders,
    payload: {
      name: 'Repo liberado por unidade',
      status: 'ACTIVE',
      accessType: 'RESTRICTED',
      allowedStoreIds: [UNIT_ALPHA_ID],
    },
  });
  assert.equal(unitRepositoryResponse.statusCode, 201);
  const unitRepositoryPayload = unitRepositoryResponse.json() as SuccessResponse<{ id: string }>;

  const deniedRepositoryResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/repositories',
    headers: adminHeaders,
    payload: {
      name: 'Repo negado por unidade',
      status: 'ACTIVE',
      accessType: 'RESTRICTED',
      allowedStoreIds: [UNIT_ALPHA_OTHER_ID],
    },
  });
  assert.equal(deniedRepositoryResponse.statusCode, 201);
  const deniedRepositoryPayload = deniedRepositoryResponse.json() as SuccessResponse<{ id: string }>;

  const repositoriesResponse = await app.inject({
    method: 'GET',
    url: '/api/repositories',
    headers: userHeaders,
  });
  assert.equal(repositoriesResponse.statusCode, 200);
  const repositoriesPayload = repositoriesResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.equal(repositoriesPayload.data.some((repository) => repository.id === unitRepositoryPayload.data.id), true);
  assert.equal(repositoriesPayload.data.some((repository) => repository.id === deniedRepositoryPayload.data.id), false);

  const deniedRepositoryDetailResponse = await app.inject({
    method: 'GET',
    url: `/api/repositories/${deniedRepositoryPayload.data.id}`,
    headers: userHeaders,
  });
  assert.equal(deniedRepositoryDetailResponse.statusCode, 403);

  const regionCourseResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/courses',
    headers: adminHeaders,
    payload: {
      title: 'Curso liberado por regional',
      status: 'ACTIVE',
      accessType: 'RESTRICTED',
      allowedRegionIds: [TOP_LEVEL_ALPHA_ID],
    },
  });
  assert.equal(regionCourseResponse.statusCode, 201);
  const regionCoursePayload = regionCourseResponse.json() as SuccessResponse<{ id: string }>;

  const excludedCourseResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/courses',
    headers: adminHeaders,
    payload: {
      title: 'Curso com exclusao',
      status: 'ACTIVE',
      accessType: 'RESTRICTED',
      allowedStoreIds: [UNIT_ALPHA_ID],
      excludedUserIds: [USER_ALPHA_ID],
    },
  });
  assert.equal(excludedCourseResponse.statusCode, 201);
  const excludedCoursePayload = excludedCourseResponse.json() as SuccessResponse<{ id: string }>;

  const coursesResponse = await app.inject({
    method: 'GET',
    url: '/api/courses',
    headers: userHeaders,
  });
  assert.equal(coursesResponse.statusCode, 200);
  const coursesPayload = coursesResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.equal(coursesPayload.data.some((course) => course.id === regionCoursePayload.data.id), true);
  assert.equal(coursesPayload.data.some((course) => course.id === excludedCoursePayload.data.id), false);

  const excludedCourseDetailResponse = await app.inject({
    method: 'GET',
    url: `/api/courses/${excludedCoursePayload.data.id}`,
    headers: userHeaders,
  });
  assert.equal(excludedCourseDetailResponse.statusCode, 403);

  const checklistResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/checklists',
    headers: adminHeaders,
    payload: {
      title: 'Checklist liberado por usuario',
      status: 'ACTIVE',
      accessType: 'RESTRICTED',
      allowedUserIds: [USER_ALPHA_ID],
    },
  });
  assert.equal(checklistResponse.statusCode, 201);
  const checklistPayload = checklistResponse.json() as SuccessResponse<{ id: string; excludedUserIds?: string[] }>;
  assert.deepEqual(checklistPayload.data.excludedUserIds, []);

  const checklistsResponse = await app.inject({
    method: 'GET',
    url: '/api/checklists',
    headers: userHeaders,
  });
  assert.equal(checklistsResponse.statusCode, 200);
  const checklistsPayload = checklistsResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.equal(checklistsPayload.data.some((checklist) => checklist.id === checklistPayload.data.id), true);

  const surveyResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/surveys',
    headers: adminHeaders,
    payload: {
      title: 'Pesquisa liberada por unidade',
      status: 'ACTIVE',
      accessType: 'RESTRICTED',
      allowedStoreIds: [UNIT_ALPHA_ID],
    },
  });
  assert.equal(surveyResponse.statusCode, 201);
  const surveyPayload = surveyResponse.json() as SuccessResponse<{ id: string }>;

  const surveysResponse = await app.inject({
    method: 'GET',
    url: '/api/surveys',
    headers: userHeaders,
  });
  assert.equal(surveysResponse.statusCode, 200);
  const surveysPayload = surveysResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.equal(surveysPayload.data.some((survey) => survey.id === surveyPayload.data.id), true);
});

test('phase 3 course catalog and admin CRUD enforce tenant scope and soft delete', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const adminLogin = await loginAsAdminAlpha(app);
  const authHeaders = { authorization: `Bearer ${adminLogin.data.accessToken}` };

  const coursesResponse = await app.inject({
    method: 'GET',
    url: '/api/courses',
    headers: authHeaders,
  });

  assert.equal(coursesResponse.statusCode, 200);
  const coursesPayload = coursesResponse.json() as SuccessResponse<Array<{ id: string; layoutTemplate: string; moduleCount?: number; contentCount?: number }>>;
  assert.equal(coursesPayload.data.some((course) => course.id === COURSE_ALPHA_ID), true);
  const alphaCourse = coursesPayload.data.find((course) => course.id === COURSE_ALPHA_ID);
  assert.equal(alphaCourse?.layoutTemplate, 'focus');
  assert.equal(alphaCourse?.moduleCount, 1);
  assert.equal(alphaCourse?.contentCount, 1);
  assert.equal(coursesPayload.data.some((course) => course.id === COURSE_BETA_ID), false);

  const crossTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/courses/${COURSE_BETA_ID}`,
    headers: authHeaders,
  });

  assert.equal(crossTenantResponse.statusCode, 404);

  const modulesResponse = await app.inject({
    method: 'GET',
    url: `/api/courses/${COURSE_ALPHA_ID}/modules`,
    headers: authHeaders,
  });

  assert.equal(modulesResponse.statusCode, 200);
  const modulesPayload = modulesResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.equal(modulesPayload.data[0]?.id, COURSE_MODULE_ALPHA_ID);

  const createCourseResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/courses',
    headers: authHeaders,
    payload: {
      title: 'Curso API',
      description: 'Criado via API',
      status: 'DRAFT',
      accessType: 'ALL',
    },
  });

  assert.equal(createCourseResponse.statusCode, 201);
  const createdCourse = createCourseResponse.json() as SuccessResponse<{ id: string; layoutTemplate: string }>;
  assert.equal(createdCourse.data.layoutTemplate, 'focus');

  const paginatedCoursesResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/courses/paginated?page=1&limit=1&search=Curso',
    headers: authHeaders,
  });
  assert.equal(paginatedCoursesResponse.statusCode, 200);
  const paginatedCourses = paginatedCoursesResponse.json() as SuccessResponse<{
    items: Array<{ id: string; companyId: string; title: string }>;
    meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
  }>;
  assert.equal(paginatedCourses.data.meta.page, 1);
  assert.equal(paginatedCourses.data.meta.limit, 1);
  assert.ok(paginatedCourses.data.meta.total >= 1);
  assert.equal(paginatedCourses.data.items.length, 1);
  assert.equal(paginatedCourses.data.items[0]?.companyId, COMPANY_ALPHA_ID);

  const restrictedCourseResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/courses',
    headers: authHeaders,
    payload: {
      title: 'Curso restrito com layout',
      status: 'ACTIVE',
      accessType: 'RESTRICTED',
      allowedStoreIds: [UNIT_ALPHA_ID],
      excludedUserIds: [USER_ALPHA_ID],
    },
  });

  assert.equal(restrictedCourseResponse.statusCode, 201);
  const restrictedCourse = restrictedCourseResponse.json() as SuccessResponse<{ id: string }>;

  const updateLayoutResponse = await app.inject({
    method: 'PUT',
    url: `/api/admin/courses/${restrictedCourse.data.id}`,
    headers: authHeaders,
    payload: {
      layoutTemplate: 'studio',
    },
  });

  assert.equal(updateLayoutResponse.statusCode, 200);
  const updatedLayoutCourse = updateLayoutResponse.json() as SuccessResponse<{
    layoutTemplate: string;
    status: string;
    accessType: string;
    allowedStoreIds: string[];
    excludedUserIds: string[];
  }>;
  assert.equal(updatedLayoutCourse.data.layoutTemplate, 'studio');
  assert.equal(updatedLayoutCourse.data.status, 'ACTIVE');
  assert.equal(updatedLayoutCourse.data.accessType, 'RESTRICTED');
  assert.deepEqual(updatedLayoutCourse.data.allowedStoreIds, [UNIT_ALPHA_ID]);
  assert.deepEqual(updatedLayoutCourse.data.excludedUserIds, [USER_ALPHA_ID]);

  const invalidLayoutResponse = await app.inject({
    method: 'PUT',
    url: `/api/admin/courses/${restrictedCourse.data.id}`,
    headers: authHeaders,
    payload: {
      layoutTemplate: 'invalid',
    },
  });

  assert.equal(invalidLayoutResponse.statusCode, 400);

  const createModuleResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/courses/${createdCourse.data.id}/modules`,
    headers: authHeaders,
    payload: {
      title: 'Modulo API',
      orderIndex: 0,
    },
  });

  assert.equal(createModuleResponse.statusCode, 201);
  const createdModule = createModuleResponse.json() as SuccessResponse<{ id: string }>;

  const createContentResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/course-modules/${createdModule.data.id}/contents`,
    headers: authHeaders,
    payload: {
      title: 'HTML API',
      description: 'Conteudo API',
      type: 'HTML',
      url: 'https://cdn.storepage.test/course.html',
      htmlContent:
        '<p onclick="alert(1)">Conteudo <strong>seguro</strong></p><script>alert(1)</script><a href="javascript:alert(1)">bad</a>',
      orderIndex: 0,
    },
  });

  assert.equal(createContentResponse.statusCode, 201);
  const createdContent = createContentResponse.json() as SuccessResponse<{ id: string; htmlContent: string | null }>;
  assert.equal(/<script|onclick|javascript:/i.test(createdContent.data.htmlContent ?? ''), false);
  assert.match(createdContent.data.htmlContent ?? '', /<p>Conteudo <strong>seguro<\/strong><\/p>/);

  const persistedCreatedContent = await app.repositories.lms.findContentById(
    adminLogin.data.company.id,
    createdContent.data.id,
  );
  assert.ok(persistedCreatedContent);
  assert.equal(/<script|onclick|javascript:/i.test(persistedCreatedContent.htmlContent ?? ''), false);

  const updateContentResponse = await app.inject({
    method: 'PUT',
    url: `/api/admin/course-contents/${createdContent.data.id}`,
    headers: authHeaders,
    payload: {
      htmlContent:
        '<p><img src="data:image/svg+xml,<svg onload=alert(1)>" alt="svg"></p><p><a href="mailto:treinamento@storepage.test">email</a></p>',
    },
  });

  assert.equal(updateContentResponse.statusCode, 200);
  const updatedContent = updateContentResponse.json() as SuccessResponse<{ htmlContent: string | null }>;
  assert.equal(/data:image\/svg\+xml|onload|<svg/i.test(updatedContent.data.htmlContent ?? ''), false);
  assert.match(updatedContent.data.htmlContent ?? '', /href="mailto:treinamento@storepage\.test"/);

  const persistedUpdatedContent = await app.repositories.lms.findContentById(
    adminLogin.data.company.id,
    createdContent.data.id,
  );
  assert.ok(persistedUpdatedContent);
  assert.equal(/data:image\/svg\+xml|onload|<svg/i.test(persistedUpdatedContent.htmlContent ?? ''), false);

  const createQuestionResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/course-modules/${createdModule.data.id}/questions`,
    headers: authHeaders,
    payload: {
      questionText: 'Pergunta API?',
      questionType: 'MULTIPLE_CHOICE',
      orderIndex: 0,
      options: [{ optionText: 'Sim', isCorrect: true, orderIndex: 0 }],
    },
  });

  assert.equal(createQuestionResponse.statusCode, 201);
  const createdQuestion = createQuestionResponse.json() as SuccessResponse<{ id: string; options: Array<{ id: string }> }>;
  assert.equal(createdQuestion.data.options.length, 1);

  const deleteContentResponse = await app.inject({
    method: 'DELETE',
    url: `/api/admin/course-contents/${createdContent.data.id}`,
    headers: authHeaders,
  });

  assert.equal(deleteContentResponse.statusCode, 200);

  const deletedContentsResponse = await app.inject({
    method: 'GET',
    url: `/api/course-modules/${createdModule.data.id}/contents`,
    headers: authHeaders,
  });

  assert.equal(deletedContentsResponse.statusCode, 200);
  const deletedContentsPayload = deletedContentsResponse.json() as SuccessResponse<Array<{ id: string }>>;
  assert.equal(deletedContentsPayload.data.some((content) => content.id === createdContent.data.id), false);

  const deleteQuestionResponse = await app.inject({
    method: 'DELETE',
    url: `/api/admin/course-questions/${createdQuestion.data.id}`,
    headers: authHeaders,
  });

  assert.equal(deleteQuestionResponse.statusCode, 200);
});

test('phase 3 enrollments, analytics and quiz endpoints stamp actor identity', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const userLogin = await loginAsUserAlpha(app);
  const userHeaders = { authorization: `Bearer ${userLogin.data.accessToken}` };

  const enrollResponse = await app.inject({
    method: 'POST',
    url: `/api/courses/${COURSE_ALPHA_ID}/enroll`,
    headers: userHeaders,
    payload: {
      userId: ADMIN_ALPHA_ID,
      companyId: COMPANY_BETA_ID,
    },
  });

  assert.equal(enrollResponse.statusCode, 201);
  const enrollmentPayload = enrollResponse.json() as SuccessResponse<{ id: string; userId: string; companyId: string }>;
  assert.equal(enrollmentPayload.data.userId, USER_ALPHA_ID);
  assert.equal(enrollmentPayload.data.companyId, COMPANY_ALPHA_ID);

  const progressResponse = await app.inject({
    method: 'PUT',
    url: `/api/courses/enrollments/${enrollmentPayload.data.id}/progress`,
    headers: userHeaders,
    payload: {
      moduleId: COURSE_MODULE_ALPHA_ID,
      contentId: COURSE_CONTENT_ALPHA_ID,
    },
  });

  assert.equal(progressResponse.statusCode, 200);
  const progressPayload = progressResponse.json() as SuccessResponse<{ currentModuleId: string; currentContentId: string }>;
  assert.equal(progressPayload.data.currentModuleId, COURSE_MODULE_ALPHA_ID);
  assert.equal(progressPayload.data.currentContentId, COURSE_CONTENT_ALPHA_ID);

  const answerResponse = await app.inject({
    method: 'POST',
    url: `/api/courses/enrollments/${enrollmentPayload.data.id}/answers`,
    headers: userHeaders,
    payload: {
      questionId: COURSE_QUESTION_ALPHA_ID,
      selectedOptionId: COURSE_OPTION_ALPHA_ID,
      isCorrect: true,
      finalize: true,
    },
  });

  assert.equal(answerResponse.statusCode, 201);
  const repeatAnswerResponse = await app.inject({
    method: 'POST',
    url: `/api/courses/enrollments/${enrollmentPayload.data.id}/answers`,
    headers: userHeaders,
    payload: {
      questionId: COURSE_QUESTION_ALPHA_ID,
      selectedOptionId: COURSE_OPTION_ALPHA_ID,
      isCorrect: false,
      finalize: true,
    },
  });

  assert.equal(repeatAnswerResponse.statusCode, 201);
  const repeatAnswerPayload = repeatAnswerResponse.json() as SuccessResponse<{ isCorrect: boolean }>;
  assert.equal(repeatAnswerPayload.data.isCorrect, true);

  const completeResponse = await app.inject({
    method: 'POST',
    url: `/api/courses/enrollments/${enrollmentPayload.data.id}/complete`,
    headers: userHeaders,
    payload: {
      totalCorrect: 1,
      totalQuestions: 1,
      startedAt: '2026-04-23T12:00:00.000Z',
    },
  });

  assert.equal(completeResponse.statusCode, 200);
  const completePayload = completeResponse.json() as SuccessResponse<{ status: string; scorePercent: number }>;
  assert.equal(completePayload.data.status, 'COMPLETED');
  assert.equal(completePayload.data.scorePercent, 100);

  const completedEnrollmentResponse = await app.inject({
    method: 'GET',
    url: `/api/courses/${COURSE_ALPHA_ID}/enrollment`,
    headers: userHeaders,
  });

  assert.equal(completedEnrollmentResponse.statusCode, 200);
  const completedEnrollmentPayload = completedEnrollmentResponse.json() as SuccessResponse<{ id: string; status: string } | null>;
  assert.equal(completedEnrollmentPayload.data?.id, enrollmentPayload.data.id);
  assert.equal(completedEnrollmentPayload.data?.status, 'COMPLETED');

  const batchEnrollmentsResponse = await app.inject({
    method: 'GET',
    url: `/api/courses/enrollments?courseIds=${COURSE_ALPHA_ID},${COURSE_BETA_ID}`,
    headers: userHeaders,
  });

  assert.equal(batchEnrollmentsResponse.statusCode, 200);
  const batchEnrollmentsPayload = batchEnrollmentsResponse.json() as SuccessResponse<Array<{ id: string; courseId: string; userId: string; companyId: string }>>;
  assert.equal(batchEnrollmentsPayload.data.length, 1);
  assert.equal(batchEnrollmentsPayload.data[0]?.id, enrollmentPayload.data.id);
  assert.equal(batchEnrollmentsPayload.data[0]?.courseId, COURSE_ALPHA_ID);
  assert.equal(batchEnrollmentsPayload.data[0]?.userId, USER_ALPHA_ID);
  assert.equal(batchEnrollmentsPayload.data[0]?.companyId, COMPANY_ALPHA_ID);

  const repeatEnrollResponse = await app.inject({
    method: 'POST',
    url: `/api/courses/${COURSE_ALPHA_ID}/enroll`,
    headers: userHeaders,
  });

  assert.equal(repeatEnrollResponse.statusCode, 201);
  const repeatEnrollPayload = repeatEnrollResponse.json() as SuccessResponse<{ id: string; status: string }>;
  assert.equal(repeatEnrollPayload.data.id, enrollmentPayload.data.id);
  assert.equal(repeatEnrollPayload.data.status, 'COMPLETED');

  const quizResponse = await app.inject({
    method: 'GET',
    url: `/api/quizzes?courseContentId=${COURSE_CONTENT_ALPHA_ID}`,
    headers: userHeaders,
  });

  assert.equal(quizResponse.statusCode, 200);
  const quizPayload = quizResponse.json() as SuccessResponse<{ id: string }>;
  assert.equal(quizPayload.data.id, QUIZ_ALPHA_ID);

  const quizQuestionsResponse = await app.inject({
    method: 'GET',
    url: `/api/quizzes/${QUIZ_ALPHA_ID}/questions`,
    headers: userHeaders,
  });

  assert.equal(quizQuestionsResponse.statusCode, 200);
  const quizQuestionsPayload = quizQuestionsResponse.json() as SuccessResponse<Array<{ id: string; quizOptions: unknown[] }>>;
  assert.equal(quizQuestionsPayload.data[0]?.id, QUIZ_QUESTION_ALPHA_ID);
  assert.equal(quizQuestionsPayload.data[0]?.quizOptions.length, 1);

  const attemptResponse = await app.inject({
    method: 'POST',
    url: `/api/quizzes/${QUIZ_ALPHA_ID}/attempts`,
    headers: userHeaders,
    payload: {
      score: 100,
      passed: true,
      answers: { [QUIZ_QUESTION_ALPHA_ID]: QUIZ_OPTION_ALPHA_ID },
    },
  });

  assert.equal(attemptResponse.statusCode, 201);
  const attemptPayload = attemptResponse.json() as SuccessResponse<{ userId: string | null; companyId: string }>;
  assert.equal(attemptPayload.data.userId, USER_ALPHA_ID);
  assert.equal(attemptPayload.data.companyId, COMPANY_ALPHA_ID);

  const adminLogin = await loginAsAdminAlpha(app);
  const adminHeaders = { authorization: `Bearer ${adminLogin.data.accessToken}` };
  const analyticsResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/courses/analytics',
    headers: adminHeaders,
  });

  assert.equal(analyticsResponse.statusCode, 200);
  const analyticsPayload = analyticsResponse.json() as SuccessResponse<{
    enrollments: unknown[];
    answers: unknown[];
    questions: unknown[];
  }>;
  assert.equal(analyticsPayload.data.enrollments.length, 1);
  assert.equal(analyticsPayload.data.answers.length, 1);
  assert.equal(analyticsPayload.data.questions.length, 1);

  const resetAsUserResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/courses/${COURSE_ALPHA_ID}/reset-enrollment`,
    headers: userHeaders,
    payload: { userId: USER_ALPHA_ID },
  });

  assert.equal(resetAsUserResponse.statusCode, 403);

  const resetResponse = await app.inject({
    method: 'POST',
    url: `/api/admin/courses/${COURSE_ALPHA_ID}/reset-enrollment`,
    headers: adminHeaders,
    payload: { userId: USER_ALPHA_ID },
  });

  assert.equal(resetResponse.statusCode, 200);

  const reactivatedEnrollResponse = await app.inject({
    method: 'POST',
    url: `/api/courses/${COURSE_ALPHA_ID}/enroll`,
    headers: userHeaders,
  });

  assert.equal(reactivatedEnrollResponse.statusCode, 201);
  const reactivatedEnrollPayload = reactivatedEnrollResponse.json() as SuccessResponse<{
    id: string;
    status: string;
    completedAt: string | null;
  }>;
  assert.equal(reactivatedEnrollPayload.data.id, enrollmentPayload.data.id);
  assert.equal(reactivatedEnrollPayload.data.status, 'IN_PROGRESS');
  assert.equal(reactivatedEnrollPayload.data.completedAt, null);
});

test('storage endpoints enforce upload purposes, tenant paths and safe file types', async (t) => {
  const env = createJwtEnv({
    SUPABASE_URL: 'https://supabase.storepage.test',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
  });
  const seed = await createSeed();
  const app = buildApp(env, { seed });
  const originalFetch = globalThis.fetch;
  const fetchCalls: Array<{ url: string; init: RequestInit | undefined }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls.push({ url: String(input), init });
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  await app.ready();
  t.after(async () => {
    globalThis.fetch = originalFetch;
    await app.close();
  });

  const pngBase64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');
  const pdfBase64 = Buffer.from('%PDF-1.4\n%EOF').toString('base64');
  const svgBase64 = Buffer.from('<svg onload="alert(1)"></svg>').toString('base64');
  const htmlBase64 = Buffer.from('<!doctype html><script>alert(1)</script>').toString('base64');

  const unauthenticatedUploadResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    payload: {
      bucket: 'assets',
      folder: 'avatars',
      fileName: 'avatar.png',
      contentType: 'image/png',
      base64: 'AAAA',
    },
  });

  assert.equal(unauthenticatedUploadResponse.statusCode, 401);
  const unauthenticatedUploadPayload = unauthenticatedUploadResponse.json() as ErrorResponse;
  assert.equal(unauthenticatedUploadPayload.code, 'UNAUTHENTICATED');

  const login = await loginAsAdminAlpha(app);
  const invalidBucketResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: {
      authorization: `Bearer ${login.data.accessToken}`,
    },
    payload: {
      bucket: 'not-allowed',
      folder: 'avatars',
      fileName: 'avatar.png',
      contentType: 'image/png',
      base64: 'AAAA',
    },
  });

  assert.equal(invalidBucketResponse.statusCode, 400);
  const invalidBucketPayload = invalidBucketResponse.json() as ErrorResponse;
  assert.equal(invalidBucketPayload.code, 'BAD_REQUEST');

  const adminHeaders = { authorization: `Bearer ${login.data.accessToken}` };
  const userLogin = await loginAsUserAlpha(app);
  const userHeaders = { authorization: `Bearer ${userLogin.data.accessToken}` };

  const unknownLegacyFolderResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: adminHeaders,
    payload: {
      bucket: 'assets',
      folder: 'companies/11111111-1111-4111-8111-111111111111/free-form',
      fileName: 'avatar.png',
      contentType: 'image/png',
      base64: pngBase64,
    },
  });
  assert.equal(unknownLegacyFolderResponse.statusCode, 400);

  const divergentTenantFolderResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: adminHeaders,
    payload: {
      bucket: 'assets',
      folder: `companies/${COMPANY_BETA_ID}/avatars`,
      fileName: 'avatar.png',
      contentType: 'image/png',
      base64: pngBase64,
    },
  });
  assert.equal(divergentTenantFolderResponse.statusCode, 403);
  const divergentTenantFolderPayload = divergentTenantFolderResponse.json() as ErrorResponse;
  assert.equal(divergentTenantFolderPayload.code, 'TENANT_ACCESS_DENIED');

  const insufficientRoleResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: userHeaders,
    payload: {
      purpose: 'course-material',
      fileName: 'material.pdf',
      contentType: 'application/pdf',
      base64: pdfBase64,
    },
  });
  assert.equal(insufficientRoleResponse.statusCode, 403);

  const executableUploadResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: adminHeaders,
    payload: {
      purpose: 'content-file',
      fileName: 'setup.exe',
      contentType: 'application/octet-stream',
      base64: 'AAAA',
    },
  });
  assert.equal(executableUploadResponse.statusCode, 400);

  const svgUploadResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: adminHeaders,
    payload: {
      purpose: 'content-file',
      fileName: 'image.svg',
      contentType: 'image/svg+xml',
      base64: svgBase64,
    },
  });
  assert.equal(svgUploadResponse.statusCode, 400);

  const htmlAsTextUploadResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: adminHeaders,
    payload: {
      purpose: 'content-file',
      fileName: 'notes.txt',
      contentType: 'text/plain',
      base64: htmlBase64,
    },
  });
  assert.equal(htmlAsTextUploadResponse.statusCode, 400);

  const mismatchedExtensionResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: adminHeaders,
    payload: {
      purpose: 'avatar',
      fileName: 'avatar.html',
      contentType: 'image/png',
      base64: pngBase64,
    },
  });
  assert.equal(mismatchedExtensionResponse.statusCode, 400);

  const publicUrlOtherTenantResponse = await app.inject({
    method: 'GET',
    url: `/api/storage/public-url?bucket=assets&path=companies/${COMPANY_BETA_ID}/avatars/avatar.png`,
    headers: adminHeaders,
  });
  assert.equal(publicUrlOtherTenantResponse.statusCode, 403);
  const publicUrlOtherTenantPayload = publicUrlOtherTenantResponse.json() as ErrorResponse;
  assert.equal(publicUrlOtherTenantPayload.code, 'TENANT_ACCESS_DENIED');

  const publicUrlUnscopedResponse = await app.inject({
    method: 'GET',
    url: '/api/storage/public-url?bucket=assets&path=avatars/avatar.png',
    headers: adminHeaders,
  });
  assert.equal(publicUrlUnscopedResponse.statusCode, 403);

  const checklistUploadResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: userHeaders,
    payload: {
      purpose: 'checklist-photo',
      fileName: 'checklist.png',
      contentType: 'image/png',
      base64: pngBase64,
    },
  });
  assert.equal(checklistUploadResponse.statusCode, 201);
  const checklistUploadPayload = checklistUploadResponse.json() as SuccessResponse<{
    bucket: string;
    path: string;
    publicUrl: string;
    contentType: string;
    sizeBytes: number;
  }>;
  assert.equal(checklistUploadPayload.data.bucket, 'checklist-photos');
  assert.equal(checklistUploadPayload.data.contentType, 'image/png');
  assert.equal(checklistUploadPayload.data.sizeBytes, 8);
  assert.match(checklistUploadPayload.data.path, new RegExp(`^companies/${COMPANY_ALPHA_ID}/checklists/photos/.+\\.png$`));
  assert.equal(checklistUploadPayload.data.publicUrl.includes('/object/public/checklist-photos/'), true);

  const documentUploadResponse = await app.inject({
    method: 'POST',
    url: '/api/storage/upload',
    headers: adminHeaders,
    payload: {
      purpose: 'content-file',
      fileName: 'manual.pdf',
      contentType: 'application/pdf',
      base64: pdfBase64,
    },
  });
  assert.equal(documentUploadResponse.statusCode, 201);
  const documentUploadPayload = documentUploadResponse.json() as SuccessResponse<{ bucket: string; path: string }>;
  assert.equal(documentUploadPayload.data.bucket, 'assets');
  assert.match(documentUploadPayload.data.path, new RegExp(`^companies/${COMPANY_ALPHA_ID}/contents/files/.+\\.pdf$`));
  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0]!.url.includes('/storage/v1/object/checklist-photos/'), true);
  assert.equal(fetchCalls[1]!.url.includes('/storage/v1/object/assets/'), true);

  const unauthenticatedPublicUrlResponse = await app.inject({
    method: 'GET',
    url: '/api/storage/public-url?bucket=assets&path=companies/example/logo.png',
  });

  assert.equal(unauthenticatedPublicUrlResponse.statusCode, 401);
});

test('super admin company and user endpoints enforce role and avoid direct tenant bypass', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => {
    await app.close();
  });

  const [superLogin, adminLogin, userLogin] = await Promise.all([
    loginAsSuperAdminAlpha(app),
    loginAsAdminAlpha(app),
    loginAsUserAlpha(app),
  ]);
  const superHeaders = { authorization: `Bearer ${superLogin.data.accessToken}` };
  const adminHeaders = { authorization: `Bearer ${adminLogin.data.accessToken}` };
  const userHeaders = { authorization: `Bearer ${userLogin.data.accessToken}` };

  const forbiddenAdminResponse = await app.inject({
    method: 'GET',
    url: '/api/super-admin/companies',
    headers: adminHeaders,
  });
  assert.equal(forbiddenAdminResponse.statusCode, 403);

  const forbiddenUserResponse = await app.inject({
    method: 'GET',
    url: '/api/super-admin/users',
    headers: userHeaders,
  });
  assert.equal(forbiddenUserResponse.statusCode, 403);

  const listCompaniesResponse = await app.inject({
    method: 'GET',
    url: '/api/super-admin/companies?includeDeleted=true',
    headers: superHeaders,
  });
  assert.equal(listCompaniesResponse.statusCode, 200);
  const listCompaniesPayload = listCompaniesResponse.json() as SuccessResponse<Array<{ id: string; slug: string }>>;
  assert.equal(listCompaniesPayload.data.length, 2);

  const paginatedCompaniesResponse = await app.inject({
    method: 'GET',
    url: '/api/super-admin/companies/paginated?page=1&limit=1&includeDeleted=true',
    headers: superHeaders,
  });
  assert.equal(paginatedCompaniesResponse.statusCode, 200);
  const paginatedCompaniesPayload = paginatedCompaniesResponse.json() as SuccessResponse<{
    items: Array<{ id: string; slug: string }>;
    meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean };
  }>;
  assert.equal(paginatedCompaniesPayload.data.items.length, 1);
  assert.equal(paginatedCompaniesPayload.data.meta.page, 1);
  assert.equal(paginatedCompaniesPayload.data.meta.limit, 1);
  assert.equal(paginatedCompaniesPayload.data.meta.total, 2);
  assert.equal(paginatedCompaniesPayload.data.meta.totalPages, 2);
  assert.equal(paginatedCompaniesPayload.data.meta.hasNextPage, true);

  const createCompanyResponse = await app.inject({
    method: 'POST',
    url: '/api/super-admin/companies',
    headers: superHeaders,
    payload: {
      name: 'Gamma Store',
      slug: 'gamma-store',
      linkName: 'gamma-store',
      active: true,
      landingPageEnabled: true,
      checklistsEnabled: true,
      surveysEnabled: true,
    },
  });
  assert.equal(createCompanyResponse.statusCode, 201);
  const createCompanyPayload = createCompanyResponse.json() as SuccessResponse<{
    id: string;
    slug: string;
    active: boolean;
    features: { checklists: boolean; surveys: boolean };
  }>;
  assert.equal(createCompanyPayload.data.slug, 'gamma-store');
  assert.equal(createCompanyPayload.data.active, true);
  assert.equal(createCompanyPayload.data.features.checklists, true);
  assert.equal(createCompanyPayload.data.features.surveys, true);

  const updateCompanyResponse = await app.inject({
    method: 'PUT',
    url: `/api/super-admin/companies/${createCompanyPayload.data.id}`,
    headers: superHeaders,
    payload: {
      name: 'Gamma Store Updated',
      active: false,
      checklistsEnabled: false,
      surveysEnabled: false,
    },
  });
  assert.equal(updateCompanyResponse.statusCode, 200);
  const updateCompanyPayload = updateCompanyResponse.json() as SuccessResponse<{
    name: string;
    active: boolean;
    features: { checklists: boolean; surveys: boolean };
  }>;
  assert.equal(updateCompanyPayload.data.name, 'Gamma Store Updated');
  assert.equal(updateCompanyPayload.data.active, false);
  assert.equal(updateCompanyPayload.data.features.checklists, false);
  assert.equal(updateCompanyPayload.data.features.surveys, false);

  const statusCompanyResponse = await app.inject({
    method: 'PATCH',
    url: `/api/super-admin/companies/${createCompanyPayload.data.id}/status`,
    headers: superHeaders,
    payload: { active: true },
  });
  assert.equal(statusCompanyResponse.statusCode, 200);
  const statusCompanyPayload = statusCompanyResponse.json() as SuccessResponse<{ active: boolean }>;
  assert.equal(statusCompanyPayload.data.active, true);

  const archiveCompanyResponse = await app.inject({
    method: 'DELETE',
    url: `/api/super-admin/companies/${createCompanyPayload.data.id}`,
    headers: superHeaders,
  });
  assert.equal(archiveCompanyResponse.statusCode, 200);

  const includeDeletedResponse = await app.inject({
    method: 'GET',
    url: '/api/super-admin/companies?includeDeleted=true',
    headers: superHeaders,
  });
  const includeDeletedPayload = includeDeletedResponse.json() as SuccessResponse<Array<{ id: string; deletedAt: string | null }>>;
  assert.ok(includeDeletedPayload.data.some((company) => company.id === createCompanyPayload.data.id && company.deletedAt));

  const listUsersResponse = await app.inject({
    method: 'GET',
    url: '/api/super-admin/users?limit=100',
    headers: superHeaders,
  });
  assert.equal(listUsersResponse.statusCode, 200);
  const listUsersPayload = listUsersResponse.json() as SuccessResponse<{
    users: Array<{ id: string; companyId: string; role: string }>;
    invites: Array<{ id: string }>;
    meta: { total: number; totalPages: number; hasPreviousPage: boolean };
  }>;
  assert.ok(listUsersPayload.data.users.some((user) => user.id === ADMIN_BETA_ID && user.companyId === COMPANY_BETA_ID));
  assert.ok(listUsersPayload.data.invites.some((invite) => invite.id === INVITE_ALPHA_ID));
  assert.ok(listUsersPayload.data.meta.total >= listUsersPayload.data.users.length);
  assert.ok(listUsersPayload.data.meta.totalPages >= 1);
  assert.equal(listUsersPayload.data.meta.hasPreviousPage, false);

  const updateUserResponse = await app.inject({
    method: 'PUT',
    url: `/api/super-admin/users/${ADMIN_BETA_ID}`,
    headers: superHeaders,
    payload: {
      name: 'Admin Beta Updated',
      active: false,
    },
  });
  assert.equal(updateUserResponse.statusCode, 200);
  const updateUserPayload = updateUserResponse.json() as SuccessResponse<{ user: { name: string; active: boolean; status: string } }>;
  assert.equal(updateUserPayload.data.user.name, 'Admin Beta Updated');
  assert.equal(updateUserPayload.data.user.active, false);
  assert.equal(updateUserPayload.data.user.status, 'INACTIVE');

  const statusUserResponse = await app.inject({
    method: 'PATCH',
    url: `/api/super-admin/users/${ADMIN_BETA_ID}/status`,
    headers: superHeaders,
    payload: { active: true },
  });
  assert.equal(statusUserResponse.statusCode, 200);
  const statusUserPayload = statusUserResponse.json() as SuccessResponse<{ user: { active: boolean; status: string } }>;
  assert.equal(statusUserPayload.data.user.active, true);
  assert.equal(statusUserPayload.data.user.status, 'ACTIVE');

  const unsafeRoleResponse = await app.inject({
    method: 'PUT',
    url: `/api/super-admin/users/${ADMIN_BETA_ID}`,
    headers: superHeaders,
    payload: {
      role: 'SUPER_ADMIN',
    },
  });
  assert.equal(unsafeRoleResponse.statusCode, 400);
});
