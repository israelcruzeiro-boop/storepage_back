import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole, requireAuthenticatedRequest } from '../lib/access-control.js';
import {
  actionPlanIdParamsSchema,
  actionPlansQuerySchema,
  answerParamsSchema,
  checklistIdParamsSchema,
  createActionPlanBodySchema,
  createChecklistBodySchema,
  createFolderBodySchema,
  createQuestionBodySchema,
  createSectionBodySchema,
  createSubmissionBodySchema,
  folderIdParamsSchema,
  questionIdParamsSchema,
  reorderBodySchema,
  sectionIdParamsSchema,
  submissionIdParamsSchema,
  submissionsQuerySchema,
  updateActionPlanBodySchema,
  updateChecklistBodySchema,
  updateFolderBodySchema,
  updateQuestionBodySchema,
  updateSectionBodySchema,
  upsertAnswerBodySchema,
} from '../schemas/checklists.js';

export const checklistsRoutes: FastifyPluginAsync = async (app) => {
  /* ==================== User-facing ==================== */

  app.get('/checklists', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.checklists.listChecklists(auth.actor);
    return reply.success(data, { message: 'Checklists loaded successfully.' });
  });

  app.get('/checklist-folders', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.checklists.listReadableFolders(auth.actor);
    return reply.success(data, { message: 'Checklist folders loaded successfully.' });
  });

  app.get('/checklists/:id', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = checklistIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.getChecklist(auth.actor, params.id);
    return reply.success(data, { message: 'Checklist loaded successfully.' });
  });

  app.post('/checklists/:id/submissions', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = checklistIdParamsSchema.parse(request.params);
    const body = createSubmissionBodySchema.parse(request.body);
    const data = await app.services.checklists.createSubmission(auth.actor, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Submission started successfully.' });
  });

  app.get('/checklists/submissions', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = submissionsQuerySchema.parse(request.query);
    const data = await app.services.checklists.listUserSubmissions(auth.actor, {
      status: query?.status,
    });
    return reply.success(data, { message: 'Submissions loaded successfully.' });
  });

  app.get('/checklists/submissions/:id', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = submissionIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.getSubmission(auth.actor, params.id);
    return reply.success(data, { message: 'Submission loaded successfully.' });
  });

  app.put('/checklists/submissions/:id/answers/:questionId', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = answerParamsSchema.parse(request.params);
    const body = upsertAnswerBodySchema.parse(request.body);
    const data = await app.services.checklists.upsertAnswer(auth.actor, params.id, params.questionId, body);
    return reply.success(data, { message: 'Answer saved successfully.' });
  });

  app.post('/checklists/submissions/:id/complete', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = submissionIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.completeSubmission(auth.actor, params.id);
    return reply.success(data, { message: 'Submission completed successfully.' });
  });

  /* Action Plans */
  app.get('/action-plans', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = actionPlansQuerySchema.parse(request.query);
    const data = await app.services.checklists.listActionPlans(auth.actor, query);
    return reply.success(data, { message: 'Action plans loaded successfully.' });
  });

  app.post('/action-plans', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const body = createActionPlanBodySchema.parse(request.body);
    const data = await app.services.checklists.createActionPlan(auth.actor, body);
    return reply.success(data, { statusCode: 201, message: 'Action plan created successfully.' });
  });

  app.put('/action-plans/:id', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = actionPlanIdParamsSchema.parse(request.params);
    const body = updateActionPlanBodySchema.parse(request.body);
    const data = await app.services.checklists.updateActionPlan(auth.actor, params.id, body);
    return reply.success(data, { message: 'Action plan updated successfully.' });
  });

  /* ==================== Admin ==================== */

  app.get('/admin/checklists', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.checklists.adminListChecklists(auth.actor.companyId);
    return reply.success(data, { message: 'Checklists loaded successfully.' });
  });

  app.post('/admin/checklists', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createChecklistBodySchema.parse(request.body);
    const data = await app.services.checklists.createChecklist(auth.actor.companyId, body);
    return reply.success(data, { statusCode: 201, message: 'Checklist created successfully.' });
  });

  app.put('/admin/checklists/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = checklistIdParamsSchema.parse(request.params);
    const body = updateChecklistBodySchema.parse(request.body);
    const data = await app.services.checklists.updateChecklist(auth.actor.companyId, params.id, body);
    return reply.success(data, { message: 'Checklist updated successfully.' });
  });

  app.delete('/admin/checklists/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = checklistIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.deleteChecklist(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Checklist deleted successfully.' });
  });

  /* Folders */
  app.get('/admin/checklist-folders', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.checklists.listFolders(auth.actor.companyId);
    return reply.success(data, { message: 'Checklist folders loaded successfully.' });
  });

  app.post('/admin/checklist-folders', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createFolderBodySchema.parse(request.body);
    const data = await app.services.checklists.createFolder(auth.actor.companyId, body);
    return reply.success(data, { statusCode: 201, message: 'Checklist folder created successfully.' });
  });

  app.put('/admin/checklist-folders/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = folderIdParamsSchema.parse(request.params);
    const body = updateFolderBodySchema.parse(request.body);
    const data = await app.services.checklists.updateFolder(auth.actor.companyId, params.id, body);
    return reply.success(data, { message: 'Checklist folder updated successfully.' });
  });

  app.delete('/admin/checklist-folders/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = folderIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.deleteFolder(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Checklist folder deleted successfully.' });
  });

  /* Sections */
  app.get('/admin/checklists/:id/sections', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = checklistIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.listSections(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Checklist sections loaded successfully.' });
  });

  app.post('/admin/checklists/:id/sections', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = checklistIdParamsSchema.parse(request.params);
    const body = createSectionBodySchema.parse(request.body);
    const data = await app.services.checklists.createSection(auth.actor.companyId, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Checklist section created successfully.' });
  });

  app.put('/admin/checklist-sections/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = sectionIdParamsSchema.parse(request.params);
    const body = updateSectionBodySchema.parse(request.body);
    const data = await app.services.checklists.updateSection(auth.actor.companyId, params.id, body);
    return reply.success(data, { message: 'Checklist section updated successfully.' });
  });

  app.delete('/admin/checklist-sections/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = sectionIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.deleteSection(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Checklist section deleted successfully.' });
  });

  app.post('/admin/checklist-sections/reorder', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = reorderBodySchema.parse(request.body);
    const data = await app.services.checklists.reorderSections(auth.actor.companyId, body.items);
    return reply.success(data, { message: 'Sections reordered successfully.' });
  });

  /* Questions */
  app.get('/admin/checklist-sections/:id/questions', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = sectionIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.listQuestions(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Checklist questions loaded successfully.' });
  });

  app.post('/admin/checklist-sections/:id/questions', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = sectionIdParamsSchema.parse(request.params);
    const body = createQuestionBodySchema.parse(request.body);
    const data = await app.services.checklists.createQuestion(auth.actor.companyId, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Checklist question created successfully.' });
  });

  app.put('/admin/checklist-questions/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = questionIdParamsSchema.parse(request.params);
    const body = updateQuestionBodySchema.parse(request.body);
    const data = await app.services.checklists.updateQuestion(auth.actor.companyId, params.id, body);
    return reply.success(data, { message: 'Checklist question updated successfully.' });
  });

  app.delete('/admin/checklist-questions/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = questionIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.deleteQuestion(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Checklist question deleted successfully.' });
  });

  app.post('/admin/checklist-questions/reorder', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = reorderBodySchema.parse(request.body);
    const data = await app.services.checklists.reorderQuestions(auth.actor.companyId, body.items);
    return reply.success(data, { message: 'Questions reordered successfully.' });
  });

  /* Admin submissions */
  app.get('/admin/checklists/dashboard', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.checklists.getDashboard(auth.actor.companyId);
    return reply.success(data, { message: 'Dashboard loaded successfully.' });
  });

  app.get('/admin/checklists/submissions', async (request, reply) => {
    const auth = requireAdminRole(request);
    const query = submissionsQuerySchema.parse(request.query);
    const data = await app.services.checklists.adminListSubmissions(auth.actor.companyId, query);
    return reply.success(data, { message: 'Submissions loaded successfully.' });
  });

  app.get('/admin/checklists/submissions/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = submissionIdParamsSchema.parse(request.params);
    const data = await app.services.checklists.adminGetSubmission(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Submission loaded successfully.' });
  });
};
