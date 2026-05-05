import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';
import { parseEnv, type AppEnv } from '../src/config/env.js';
import { PasswordService } from '../src/lib/passwords.js';

const SHARED_SECRET = '0123456789abcdef0123456789abcdef';
const COMPANY_ALPHA_ID = '11111111-1111-4111-8111-111111111111';
const COMPANY_BETA_ID = '22222222-2222-4222-8222-222222222222';
const ADMIN_ALPHA_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ADMIN_BETA_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER_ALPHA_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const UNIT_ALPHA_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const UNIT_BETA_ID = '99999999-9999-4999-8999-999999999999';
const TOP_LEVEL_ALPHA_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

const CHECKLIST_ALPHA_ID = 'c1c1c1c1-c1c1-4c1c-a1c1-c1c1c1c1c1c1';
const CHECKLIST_BETA_ID = 'c2c2c2c2-c2c2-4c2c-a2c2-c2c2c2c2c2c2';
const FOLDER_ALPHA_ID = 'f1f1f1f1-f1f1-4f1f-a1f1-f1f1f1f1f1f1';
const SECTION_ALPHA_ID = 'a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1';
const SECTION_ALPHA_2_ID = 'a2a2a2a2-a2a2-4a2a-a2a2-a2a2a2a2a2a2';
const QUESTION_ALPHA_ID = 'b1b1b1b1-b1b1-4b1b-a1b1-b1b1b1b1b1b1';
const QUESTION_ALPHA_2_ID = 'b2b2b2b2-b2b2-4b2b-a2b2-b2b2b2b2b2b2';

interface SuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

function createJwtEnv(): AppEnv {
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
  });
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
          theme: { primary: '#111827', secondary: '#1f2937', accent: '#f59e0b', surface: '#ffffff', text: '#111827' },
          hero: { title: 'Portal Alpha', subtitle: 'Treinamentos.', ctaLabel: 'Entrar', imageUrl: null },
        },
        features: { repositories: true, lms: true, checklists: true, surveys: false, metrics: true },
        general: { orgLevels: ['Regional', 'Distrito'], orgUnitName: 'Loja', supportEmail: 'support@alpha.test' },
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
          logoUrl: null,
          faviconUrl: null,
          theme: { primary: '#0f172a', secondary: '#1e293b', accent: '#10b981', surface: '#ffffff', text: '#0f172a' },
          hero: { title: 'Portal Beta', subtitle: '', ctaLabel: 'Comecar', imageUrl: null },
        },
        features: { repositories: true, lms: false, checklists: true, surveys: false, metrics: false },
        general: { orgLevels: ['Regiao'], orgUnitName: 'Filial', supportEmail: 'support@beta.test' },
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    users: [
      {
        id: ADMIN_ALPHA_ID, companyId: COMPANY_ALPHA_ID, name: 'Admin Alpha',
        email: 'admin.alpha@storepage.com', normalizedEmail: 'admin.alpha@storepage.com',
        cpf: '11111111111', role: 'ADMIN' as const, status: 'ACTIVE' as const,
        active: true, firstAccess: false, avatarUrl: null, orgUnitId: UNIT_ALPHA_ID,
        passwordHash: adminPasswordHash, passwordUpdatedAt: now,
        deletedAt: null, createdAt: now, updatedAt: now,
      },
      {
        id: ADMIN_BETA_ID, companyId: COMPANY_BETA_ID, name: 'Admin Beta',
        email: 'admin.beta@storepage.com', normalizedEmail: 'admin.beta@storepage.com',
        cpf: '22222222222', role: 'ADMIN' as const, status: 'ACTIVE' as const,
        active: true, firstAccess: false, avatarUrl: null, orgUnitId: UNIT_BETA_ID,
        passwordHash: adminPasswordHash, passwordUpdatedAt: now,
        deletedAt: null, createdAt: now, updatedAt: now,
      },
      {
        id: USER_ALPHA_ID, companyId: COMPANY_ALPHA_ID, name: 'User Alpha',
        email: 'user.alpha@storepage.com', normalizedEmail: 'user.alpha@storepage.com',
        cpf: '33333333333', role: 'USER' as const, status: 'ACTIVE' as const,
        active: true, firstAccess: false, avatarUrl: null, orgUnitId: UNIT_ALPHA_ID,
        passwordHash: userPasswordHash, passwordUpdatedAt: now,
        deletedAt: null, createdAt: now, updatedAt: now,
      },
    ],
    invites: [],
    topLevels: [
      {
        id: TOP_LEVEL_ALPHA_ID, companyId: COMPANY_ALPHA_ID, name: 'Regional Centro',
        levelIndex: 1, parentId: null, deletedAt: null, createdAt: now, updatedAt: now,
      },
    ],
    units: [
      { id: UNIT_ALPHA_ID, companyId: COMPANY_ALPHA_ID, name: 'Loja Centro', code: 'ALPHA-01', topLevelId: TOP_LEVEL_ALPHA_ID, active: true, deletedAt: null, createdAt: now, updatedAt: now },
      { id: UNIT_BETA_ID, companyId: COMPANY_BETA_ID, name: 'Filial Sul', code: 'BETA-01', topLevelId: null, active: true, deletedAt: null, createdAt: now, updatedAt: now },
    ],
    checklists: [
      {
        id: CHECKLIST_ALPHA_ID, companyId: COMPANY_ALPHA_ID, title: 'Checklist Alpha',
        description: 'Main checklist for Alpha tenant', coverImage: null,
        status: 'ACTIVE' as const, accessType: 'ALL' as const,
        allowedUserIds: [], allowedRegionIds: [], allowedStoreIds: [],
        folderId: FOLDER_ALPHA_ID, deletedAt: null, createdAt: now, updatedAt: now,
      },
      {
        id: CHECKLIST_BETA_ID, companyId: COMPANY_BETA_ID, title: 'Checklist Beta',
        description: 'Main checklist for Beta tenant', coverImage: null,
        status: 'ACTIVE' as const, accessType: 'ALL' as const,
        allowedUserIds: [], allowedRegionIds: [], allowedStoreIds: [],
        folderId: null, deletedAt: null, createdAt: now, updatedAt: now,
      },
    ],
    checklistFolders: [
      {
        id: FOLDER_ALPHA_ID, companyId: COMPANY_ALPHA_ID, name: 'Operacional',
        orderIndex: 0, deletedAt: null, createdAt: now, updatedAt: now,
      },
    ],
    checklistSections: [
      {
        id: SECTION_ALPHA_ID, checklistId: CHECKLIST_ALPHA_ID, title: 'Section A',
        orderIndex: 0, deletedAt: null, createdAt: now, updatedAt: now,
      },
      {
        id: SECTION_ALPHA_2_ID, checklistId: CHECKLIST_ALPHA_ID, title: 'Section B',
        orderIndex: 1, deletedAt: null, createdAt: now, updatedAt: now,
      },
    ],
    checklistQuestions: [
      {
        id: QUESTION_ALPHA_ID, checklistId: CHECKLIST_ALPHA_ID, sectionId: SECTION_ALPHA_ID, questionText: 'Is the store clean?',
        questionType: 'YES_NO' as const, required: true, configuration: null,
        orderIndex: 0, deletedAt: null, createdAt: now, updatedAt: now,
      },
      {
        id: QUESTION_ALPHA_2_ID, checklistId: CHECKLIST_ALPHA_ID, sectionId: SECTION_ALPHA_ID, questionText: 'Rate the lighting',
        questionType: 'RATING' as const, required: false, configuration: { min: 1, max: 5 },
        orderIndex: 1, deletedAt: null, createdAt: now, updatedAt: now,
      },
    ],
    checklistSubmissions: [],
    checklistAnswers: [],
    actionPlans: [],
  };
}

async function createFixtureApp() {
  const env = createJwtEnv();
  const seed = await createSeed();
  const app = buildApp(env, { seed });
  await app.ready();
  return { app, env };
}

async function loginAsAdminAlpha(app: ReturnType<typeof buildApp>) {
  const response = await app.inject({
    method: 'POST', url: '/api/auth/login',
    payload: { identifier: 'admin.alpha@storepage.com', password: 'Password123!', company_slug: 'alpha-store' },
  });
  assert.equal(response.statusCode, 200);
  return response.json() as SuccessResponse<{ accessToken: string; refreshToken: string; user: { id: string; role: string }; company: { id: string; slug: string } }>;
}

async function loginAsAdminBeta(app: ReturnType<typeof buildApp>) {
  const response = await app.inject({
    method: 'POST', url: '/api/auth/login',
    payload: { identifier: 'admin.beta@storepage.com', password: 'Password123!', company_slug: 'beta-store' },
  });
  assert.equal(response.statusCode, 200);
  return response.json() as SuccessResponse<{ accessToken: string; refreshToken: string; user: { id: string; role: string }; company: { id: string; slug: string } }>;
}

async function loginAsUserAlpha(app: ReturnType<typeof buildApp>) {
  const response = await app.inject({
    method: 'POST', url: '/api/auth/login',
    payload: { identifier: 'user.alpha@storepage.com', password: 'UserPass123!', company_slug: 'alpha-store' },
  });
  assert.equal(response.statusCode, 200);
  return response.json() as SuccessResponse<{ accessToken: string; refreshToken: string; user: { id: string; role: string }; company: { id: string; slug: string } }>;
}

/* =================================================================== */
/*  Test 1 – User checklist listing respects tenant isolation          */
/* =================================================================== */
test('phase 4 user checklist listing respects tenant isolation', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const alphaLogin = await loginAsAdminAlpha(app);
  const betaLogin = await loginAsAdminBeta(app);
  const userLogin = await loginAsUserAlpha(app);

  // Admin Alpha sees only Alpha checklists
  const alphaRes = await app.inject({
    method: 'GET', url: '/api/checklists',
    headers: { authorization: `Bearer ${alphaLogin.data.accessToken}` },
  });
  assert.equal(alphaRes.statusCode, 200);
  const alphaBody = alphaRes.json() as SuccessResponse<unknown[]>;
  assert.ok(alphaBody.data.length >= 1);
  for (const item of alphaBody.data as Array<{ companyId: string }>) {
    assert.equal(item.companyId, COMPANY_ALPHA_ID);
  }

  // User Alpha also sees Alpha checklists (ACTIVE + ALL access)
  const userRes = await app.inject({
    method: 'GET', url: '/api/checklists',
    headers: { authorization: `Bearer ${userLogin.data.accessToken}` },
  });
  assert.equal(userRes.statusCode, 200);
  const userBody = userRes.json() as SuccessResponse<unknown[]>;
  assert.ok(userBody.data.length >= 1);

  const userFoldersRes = await app.inject({
    method: 'GET', url: '/api/checklist-folders',
    headers: { authorization: `Bearer ${userLogin.data.accessToken}` },
  });
  assert.equal(userFoldersRes.statusCode, 200);
  const userFoldersBody = userFoldersRes.json() as SuccessResponse<Array<{ id: string; companyId: string; name: string }>>;
  assert.equal(userFoldersBody.data.length, 1);
  assert.equal(userFoldersBody.data[0].id, FOLDER_ALPHA_ID);
  assert.equal(userFoldersBody.data[0].companyId, COMPANY_ALPHA_ID);
  assert.equal(userFoldersBody.data[0].name, 'Operacional');

  // Admin Beta sees only Beta checklists
  const betaRes = await app.inject({
    method: 'GET', url: '/api/checklists',
    headers: { authorization: `Bearer ${betaLogin.data.accessToken}` },
  });
  assert.equal(betaRes.statusCode, 200);
  const betaBody = betaRes.json() as SuccessResponse<unknown[]>;
  for (const item of betaBody.data as Array<{ companyId: string }>) {
    assert.equal(item.companyId, COMPANY_BETA_ID);
  }
});

/* =================================================================== */
/*  Test 2 – Admin CRUD: checklist, folder, section, question          */
/* =================================================================== */
test('phase 4 admin CRUD for checklist, folder, section, question', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const login = await loginAsAdminAlpha(app);
  const auth = { authorization: `Bearer ${login.data.accessToken}` };

  // --- Folder CRUD ---
  const createFolderRes = await app.inject({
    method: 'POST', url: '/api/admin/checklist-folders',
    headers: auth, payload: { name: 'New Folder' },
  });
  assert.equal(createFolderRes.statusCode, 201);
  const folder = (createFolderRes.json() as SuccessResponse<{ id: string; name: string }>).data;
  assert.equal(folder.name, 'New Folder');

  const updateFolderRes = await app.inject({
    method: 'PUT', url: `/api/admin/checklist-folders/${folder.id}`,
    headers: auth, payload: { name: 'Renamed Folder' },
  });
  assert.equal(updateFolderRes.statusCode, 200);
  assert.equal((updateFolderRes.json() as SuccessResponse<{ name: string }>).data.name, 'Renamed Folder');

  // --- Checklist CRUD ---
  const createChecklistRes = await app.inject({
    method: 'POST', url: '/api/admin/checklists',
    headers: auth, payload: { title: 'New Checklist', description: 'Test desc', status: 'DRAFT', folderId: folder.id },
  });
  assert.equal(createChecklistRes.statusCode, 201);
  const checklist = (createChecklistRes.json() as SuccessResponse<{ id: string; title: string; folderId: string }>).data;
  assert.equal(checklist.title, 'New Checklist');
  assert.equal(checklist.folderId, folder.id);

  const updateChecklistRes = await app.inject({
    method: 'PUT', url: `/api/admin/checklists/${checklist.id}`,
    headers: auth, payload: { title: 'Updated Checklist', status: 'ACTIVE' },
  });
  assert.equal(updateChecklistRes.statusCode, 200);
  assert.equal((updateChecklistRes.json() as SuccessResponse<{ title: string; status: string }>).data.title, 'Updated Checklist');

  // --- Section CRUD ---
  const createSectionRes = await app.inject({
    method: 'POST', url: `/api/admin/checklists/${checklist.id}/sections`,
    headers: auth, payload: { title: 'Section One' },
  });
  assert.equal(createSectionRes.statusCode, 201);
  const section = (createSectionRes.json() as SuccessResponse<{ id: string; title: string }>).data;
  assert.equal(section.title, 'Section One');

  const updateSectionRes = await app.inject({
    method: 'PUT', url: `/api/admin/checklist-sections/${section.id}`,
    headers: auth, payload: { title: 'Section Renamed' },
  });
  assert.equal(updateSectionRes.statusCode, 200);

  // --- Question CRUD ---
  const createQuestionRes = await app.inject({
    method: 'POST', url: `/api/admin/checklist-sections/${section.id}/questions`,
    headers: auth, payload: { questionText: 'Everything OK?', questionType: 'COMPLIANCE', required: true },
  });
  assert.equal(createQuestionRes.statusCode, 201);
  const question = (createQuestionRes.json() as SuccessResponse<{ id: string; questionText: string }>).data;
  assert.equal(question.questionText, 'Everything OK?');

  const updateQuestionRes = await app.inject({
    method: 'PUT', url: `/api/admin/checklist-questions/${question.id}`,
    headers: auth, payload: { questionText: 'All good?' },
  });
  assert.equal(updateQuestionRes.statusCode, 200);
  assert.equal((updateQuestionRes.json() as SuccessResponse<{ questionText: string }>).data.questionText, 'All good?');
});

test('phase 4 checklist question type stays CHECK after configuration update', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const login = await loginAsAdminAlpha(app);
  const auth = { authorization: `Bearer ${login.data.accessToken}` };

  const createQuestionRes = await app.inject({
    method: 'POST', url: `/api/admin/checklist-sections/${SECTION_ALPHA_ID}/questions`,
    headers: auth, payload: { questionText: 'Confirm item?', questionType: 'COMPLIANCE', required: false },
  });
  assert.equal(createQuestionRes.statusCode, 201);
  const question = (createQuestionRes.json() as SuccessResponse<{ id: string; questionType: string; type: string }>).data;
  assert.equal(question.questionType, 'COMPLIANCE');

  const updateTypeRes = await app.inject({
    method: 'PUT', url: `/api/admin/checklist-questions/${question.id}`,
    headers: auth, payload: { questionType: 'CHECK' },
  });
  assert.equal(updateTypeRes.statusCode, 200);
  const checkQuestion = (updateTypeRes.json() as SuccessResponse<{ questionType: string; type: string }>).data;
  assert.equal(checkQuestion.questionType, 'CHECK');
  assert.equal(checkQuestion.type, 'CHECK');

  const updateConfigRes = await app.inject({
    method: 'PUT', url: `/api/admin/checklist-questions/${question.id}`,
    headers: auth, payload: { configuration: { photo_required: true } },
  });
  assert.equal(updateConfigRes.statusCode, 200);
  const configuredQuestion = (updateConfigRes.json() as SuccessResponse<{ questionType: string; type: string; configuration: unknown; config: unknown }>).data;
  assert.equal(configuredQuestion.questionType, 'CHECK');
  assert.equal(configuredQuestion.type, 'CHECK');
  assert.deepEqual(configuredQuestion.configuration, { photo_required: true });
  assert.deepEqual(configuredQuestion.config, { photo_required: true });
});

/* =================================================================== */
/*  Test 3 – Cross-tenant blocking on admin endpoints                  */
/* =================================================================== */
test('phase 4 cross-tenant blocking for admin checklists', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const betaLogin = await loginAsAdminBeta(app);
  const betaAuth = { authorization: `Bearer ${betaLogin.data.accessToken}` };

  // Beta admin cannot update Alpha's checklist
  const updateRes = await app.inject({
    method: 'PUT', url: `/api/admin/checklists/${CHECKLIST_ALPHA_ID}`,
    headers: betaAuth, payload: { title: 'Hacked' },
  });
  assert.equal(updateRes.statusCode, 404);

  // Beta admin cannot delete Alpha's checklist
  const deleteRes = await app.inject({
    method: 'DELETE', url: `/api/admin/checklists/${CHECKLIST_ALPHA_ID}`,
    headers: betaAuth,
  });
  assert.equal(deleteRes.statusCode, 404);

  // Beta admin cannot see Alpha's sections
  const sectionsRes = await app.inject({
    method: 'GET', url: `/api/admin/checklists/${CHECKLIST_ALPHA_ID}/sections`,
    headers: betaAuth,
  });
  assert.equal(sectionsRes.statusCode, 404);

  // Beta admin cannot delete Alpha's folder
  const folderRes = await app.inject({
    method: 'DELETE', url: `/api/admin/checklist-folders/${FOLDER_ALPHA_ID}`,
    headers: betaAuth,
  });
  assert.equal(folderRes.statusCode, 404);
});

/* =================================================================== */
/*  Test 4 – Soft delete checklist and folder                          */
/* =================================================================== */
test('phase 4 soft delete checklist and folder', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const login = await loginAsAdminAlpha(app);
  const auth = { authorization: `Bearer ${login.data.accessToken}` };

  // Create and then delete a checklist
  const createRes = await app.inject({
    method: 'POST', url: '/api/admin/checklists',
    headers: auth, payload: { title: 'To Delete', status: 'DRAFT' },
  });
  assert.equal(createRes.statusCode, 201);
  const cl = (createRes.json() as SuccessResponse<{ id: string }>).data;

  const deleteRes = await app.inject({
    method: 'DELETE', url: `/api/admin/checklists/${cl.id}`,
    headers: auth,
  });
  assert.equal(deleteRes.statusCode, 200);
  const deleted = (deleteRes.json() as SuccessResponse<{ deletedAt: string | null }>).data;
  assert.ok(deleted.deletedAt !== null);

  // Deleted checklist no longer shows in admin list
  const listRes = await app.inject({
    method: 'GET', url: '/api/admin/checklists',
    headers: auth,
  });
  const list = (listRes.json() as SuccessResponse<Array<{ id: string }>>).data;
  assert.ok(!list.some((item) => item.id === cl.id));

  // Delete a folder
  const deleteFolderRes = await app.inject({
    method: 'DELETE', url: `/api/admin/checklist-folders/${FOLDER_ALPHA_ID}`,
    headers: auth,
  });
  assert.equal(deleteFolderRes.statusCode, 200);
});

/* =================================================================== */
/*  Test 5 – Reorder sections and questions                            */
/* =================================================================== */
test('phase 4 reorder sections and questions', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const login = await loginAsAdminAlpha(app);
  const auth = { authorization: `Bearer ${login.data.accessToken}` };

  // Reorder sections (swap order)
  const reorderSectionsRes = await app.inject({
    method: 'POST', url: '/api/admin/checklist-sections/reorder',
    headers: auth,
    payload: { items: [{ id: SECTION_ALPHA_ID, orderIndex: 1 }, { id: SECTION_ALPHA_2_ID, orderIndex: 0 }] },
  });
  assert.equal(reorderSectionsRes.statusCode, 200);

  // Verify new order
  const sectionsRes = await app.inject({
    method: 'GET', url: `/api/admin/checklists/${CHECKLIST_ALPHA_ID}/sections`,
    headers: auth,
  });
  const sections = (sectionsRes.json() as SuccessResponse<Array<{ id: string; orderIndex: number }>>).data;
  assert.equal(sections[0].id, SECTION_ALPHA_2_ID);
  assert.equal(sections[1].id, SECTION_ALPHA_ID);

  // Reorder questions
  const reorderQuestionsRes = await app.inject({
    method: 'POST', url: '/api/admin/checklist-questions/reorder',
    headers: auth,
    payload: { items: [{ id: QUESTION_ALPHA_ID, orderIndex: 1 }, { id: QUESTION_ALPHA_2_ID, orderIndex: 0 }] },
  });
  assert.equal(reorderQuestionsRes.statusCode, 200);
});

/* =================================================================== */
/*  Test 6 – Submission lifecycle: create, answer, complete            */
/* =================================================================== */
test('phase 4 submission lifecycle: create, upsert answer, complete', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const userLogin = await loginAsUserAlpha(app);
  const userAuth = { authorization: `Bearer ${userLogin.data.accessToken}` };

  // Create submission
  const createSubRes = await app.inject({
    method: 'POST', url: `/api/checklists/${CHECKLIST_ALPHA_ID}/submissions`,
    headers: userAuth, payload: {},
  });
  assert.equal(createSubRes.statusCode, 201);
  const submission = (createSubRes.json() as SuccessResponse<{ id: string; status: string; checklistId: string }>).data;
  assert.equal(submission.status, 'IN_PROGRESS');
  assert.equal(submission.checklistId, CHECKLIST_ALPHA_ID);

  // Upsert answer for question 1
  const answerRes1 = await app.inject({
    method: 'PUT', url: `/api/checklists/submissions/${submission.id}/answers/${QUESTION_ALPHA_ID}`,
    headers: userAuth, payload: { booleanValue: true, conformity: 'CONFORMING' },
  });
  assert.equal(answerRes1.statusCode, 200);
  const answer1 = (answerRes1.json() as SuccessResponse<{ questionId: string; booleanValue: boolean }>).data;
  assert.equal(answer1.questionId, QUESTION_ALPHA_ID);
  assert.equal(answer1.booleanValue, true);

  // Upsert answer for question 2
  const answerRes2 = await app.inject({
    method: 'PUT', url: `/api/checklists/submissions/${submission.id}/answers/${QUESTION_ALPHA_2_ID}`,
    headers: userAuth, payload: { numericValue: 4 },
  });
  assert.equal(answerRes2.statusCode, 200);

  // Get submission with answers
  const getSubRes = await app.inject({
    method: 'GET', url: `/api/checklists/submissions/${submission.id}`,
    headers: userAuth,
  });
  assert.equal(getSubRes.statusCode, 200);
  const sub = (getSubRes.json() as SuccessResponse<{ answers: unknown[] }>).data;
  assert.equal(sub.answers.length, 2);

  // Complete submission
  const completeRes = await app.inject({
    method: 'POST', url: `/api/checklists/submissions/${submission.id}/complete`,
    headers: userAuth,
  });
  assert.equal(completeRes.statusCode, 200);
  const completed = (completeRes.json() as SuccessResponse<{ status: string; completedAt: string | null }>).data;
  assert.equal(completed.status, 'COMPLETED');
  assert.ok(completed.completedAt !== null);

  // Cannot upsert answer after completion
  const afterCompleteRes = await app.inject({
    method: 'PUT', url: `/api/checklists/submissions/${submission.id}/answers/${QUESTION_ALPHA_ID}`,
    headers: userAuth, payload: { booleanValue: false },
  });
  assert.equal(afterCompleteRes.statusCode, 400);
});

/* =================================================================== */
/*  Test 7 – Submission ownership: other user cannot access            */
/* =================================================================== */
test('phase 4 submission ownership prevents cross-user access', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const userLogin = await loginAsUserAlpha(app);
  const userAuth = { authorization: `Bearer ${userLogin.data.accessToken}` };

  // User creates a submission
  const createRes = await app.inject({
    method: 'POST', url: `/api/checklists/${CHECKLIST_ALPHA_ID}/submissions`,
    headers: userAuth, payload: {},
  });
  assert.equal(createRes.statusCode, 201);
  const submission = (createRes.json() as SuccessResponse<{ id: string }>).data;

  // Admin Alpha tries to GET it as user (not admin endpoint) — should fail because different userId
  const adminLogin = await loginAsAdminAlpha(app);
  const adminAuth = { authorization: `Bearer ${adminLogin.data.accessToken}` };
  const getAsAdminRes = await app.inject({
    method: 'GET', url: `/api/checklists/submissions/${submission.id}`,
    headers: adminAuth,
  });
  // Admin is also an ADMIN role, which may or may not be allowed on user endpoints.
  // The service checks userId match for getSubmission, so it should be 403 or 404
  assert.ok([403, 404].includes(getAsAdminRes.statusCode));
});

/* =================================================================== */
/*  Test 8 – Admin dashboard and submissions by tenant                 */
/* =================================================================== */
test('phase 4 admin dashboard and submissions respect tenant', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const adminLogin = await loginAsAdminAlpha(app);
  const auth = { authorization: `Bearer ${adminLogin.data.accessToken}` };

  // First create a submission via user
  const userLogin = await loginAsUserAlpha(app);
  const userAuth = { authorization: `Bearer ${userLogin.data.accessToken}` };
  await app.inject({
    method: 'POST', url: `/api/checklists/${CHECKLIST_ALPHA_ID}/submissions`,
    headers: userAuth, payload: {},
  });

  // Dashboard
  const dashRes = await app.inject({
    method: 'GET', url: '/api/admin/checklists/dashboard',
    headers: auth,
  });
  assert.equal(dashRes.statusCode, 200);
  const dashboard = (dashRes.json() as SuccessResponse<{ totalChecklists: number; totalSubmissions: number }>).data;
  assert.ok(dashboard.totalChecklists >= 1);
  assert.ok(dashboard.totalSubmissions >= 1);

  // Admin list submissions
  const subListRes = await app.inject({
    method: 'GET', url: '/api/admin/checklists/submissions',
    headers: auth,
  });
  assert.equal(subListRes.statusCode, 200);
  const subs = (subListRes.json() as SuccessResponse<Array<{ companyId: string }>>).data;
  for (const s of subs) {
    assert.equal(s.companyId, COMPANY_ALPHA_ID);
  }

  const paginatedChecklistsRes = await app.inject({
    method: 'GET', url: '/api/admin/checklists/paginated?page=1&limit=1&search=Alpha',
    headers: auth,
  });
  assert.equal(paginatedChecklistsRes.statusCode, 200);
  const paginatedChecklists = paginatedChecklistsRes.json() as SuccessResponse<{
    items: Array<{ companyId: string; title: string }>;
    meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
  }>;
  assert.equal(paginatedChecklists.data.meta.page, 1);
  assert.equal(paginatedChecklists.data.meta.limit, 1);
  assert.ok(paginatedChecklists.data.meta.total >= 1);
  assert.equal(paginatedChecklists.data.items.length, 1);
  assert.equal(paginatedChecklists.data.items[0]?.companyId, COMPANY_ALPHA_ID);

  const paginatedSubmissionsRes = await app.inject({
    method: 'GET', url: '/api/admin/checklists/submissions/paginated?page=1&limit=1',
    headers: auth,
  });
  assert.equal(paginatedSubmissionsRes.statusCode, 200);
  const paginatedSubmissions = paginatedSubmissionsRes.json() as SuccessResponse<{
    items: Array<{ companyId: string; checklist: { title: string } | null }>;
    meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
  }>;
  assert.equal(paginatedSubmissions.data.meta.page, 1);
  assert.equal(paginatedSubmissions.data.meta.limit, 1);
  assert.ok(paginatedSubmissions.data.meta.total >= 1);
  assert.equal(paginatedSubmissions.data.items.length, 1);
  assert.equal(paginatedSubmissions.data.items[0]?.companyId, COMPANY_ALPHA_ID);

  // Beta admin dashboard sees different data
  const betaLogin = await loginAsAdminBeta(app);
  const betaAuth = { authorization: `Bearer ${betaLogin.data.accessToken}` };
  const betaDashRes = await app.inject({
    method: 'GET', url: '/api/admin/checklists/dashboard',
    headers: betaAuth,
  });
  assert.equal(betaDashRes.statusCode, 200);
  const betaDash = (betaDashRes.json() as SuccessResponse<{ totalSubmissions: number }>).data;
  assert.equal(betaDash.totalSubmissions, 0);
});

/* =================================================================== */
/*  Test 9 – Action plan CRUD respects tenant and ownership            */
/* =================================================================== */
test('phase 4 action plan CRUD respects tenant and ownership', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const userLogin = await loginAsUserAlpha(app);
  const userAuth = { authorization: `Bearer ${userLogin.data.accessToken}` };

  // Create action plan
  const createRes = await app.inject({
    method: 'POST', url: '/api/action-plans',
    headers: userAuth,
    payload: { title: 'Fix lighting', description: 'Replace bulbs in aisle 3', priority: 'HIGH', checklistId: CHECKLIST_ALPHA_ID },
  });
  assert.equal(createRes.statusCode, 201);
  const plan = (createRes.json() as SuccessResponse<{ id: string; title: string; priority: string; createdByUserId: string }>).data;
  assert.equal(plan.title, 'Fix lighting');
  assert.equal(plan.priority, 'HIGH');
  assert.equal(plan.createdByUserId, USER_ALPHA_ID);

  // Update action plan
  const updateRes = await app.inject({
    method: 'PUT', url: `/api/action-plans/${plan.id}`,
    headers: userAuth,
    payload: { status: 'IN_PROGRESS' },
  });
  assert.equal(updateRes.statusCode, 200);
  assert.equal((updateRes.json() as SuccessResponse<{ status: string }>).data.status, 'IN_PROGRESS');

  // List action plans
  const listRes = await app.inject({
    method: 'GET', url: '/api/action-plans',
    headers: userAuth,
  });
  assert.equal(listRes.statusCode, 200);
  const plans = (listRes.json() as SuccessResponse<Array<{ id: string }>>).data;
  assert.ok(plans.some((p) => p.id === plan.id));

  // Beta admin cannot see Alpha's action plans
  const betaLogin = await loginAsAdminBeta(app);
  const betaAuth = { authorization: `Bearer ${betaLogin.data.accessToken}` };
  const betaListRes = await app.inject({
    method: 'GET', url: '/api/action-plans',
    headers: betaAuth,
  });
  assert.equal(betaListRes.statusCode, 200);
  const betaPlans = (betaListRes.json() as SuccessResponse<Array<{ id: string }>>).data;
  assert.ok(!betaPlans.some((p) => p.id === plan.id));
});

/* =================================================================== */
/*  Test 10 – Unauthenticated requests are rejected                    */
/* =================================================================== */
test('phase 4 unauthenticated requests to checklist endpoints are rejected', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const endpoints = [
    { method: 'GET' as const, url: '/api/checklists' },
    { method: 'GET' as const, url: '/api/checklist-folders' },
    { method: 'GET' as const, url: `/api/checklists/${CHECKLIST_ALPHA_ID}` },
    { method: 'GET' as const, url: '/api/admin/checklists' },
    { method: 'POST' as const, url: '/api/admin/checklists' },
    { method: 'GET' as const, url: '/api/admin/checklists/dashboard' },
    { method: 'GET' as const, url: '/api/action-plans' },
  ];

  for (const ep of endpoints) {
    const res = await app.inject({ method: ep.method, url: ep.url });
    assert.equal(res.statusCode, 401, `Expected 401 for ${ep.method} ${ep.url}`);
  }
});

/* =================================================================== */
/*  Test 11 – User endpoints reject non-admin for admin routes         */
/* =================================================================== */
test('phase 4 user role cannot access admin checklist endpoints', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const userLogin = await loginAsUserAlpha(app);
  const userAuth = { authorization: `Bearer ${userLogin.data.accessToken}` };

  const adminEndpoints = [
    { method: 'GET' as const, url: '/api/admin/checklists' },
    { method: 'POST' as const, url: '/api/admin/checklists' },
    { method: 'GET' as const, url: '/api/admin/checklists/dashboard' },
    { method: 'GET' as const, url: '/api/admin/checklists/submissions' },
    { method: 'GET' as const, url: '/api/admin/checklist-folders' },
  ];

  for (const ep of adminEndpoints) {
    const res = await app.inject({ method: ep.method, url: ep.url, headers: userAuth, ...(ep.method === 'POST' ? { payload: { title: 'x' } } : {}) });
    assert.equal(res.statusCode, 403, `Expected 403 for ${ep.method} ${ep.url}`);
  }
});

/* =================================================================== */
/*  Test 12 – Get checklist detail with sections and questions         */
/* =================================================================== */
test('phase 4 get checklist detail returns sections and questions', async (t) => {
  const { app } = await createFixtureApp();
  t.after(async () => { await app.close(); });

  const login = await loginAsAdminAlpha(app);
  const auth = { authorization: `Bearer ${login.data.accessToken}` };

  const res = await app.inject({
    method: 'GET', url: `/api/checklists/${CHECKLIST_ALPHA_ID}`,
    headers: auth,
  });
  assert.equal(res.statusCode, 200);
  const checklist = (res.json() as SuccessResponse<{ id: string; sections: Array<{ id: string; questions: unknown[] }> }>).data;
  assert.equal(checklist.id, CHECKLIST_ALPHA_ID);
  assert.ok(checklist.sections.length >= 2);
  assert.ok(checklist.sections[0].questions.length >= 1);
});
