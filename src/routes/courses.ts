import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole, requireAuthenticatedRequest } from '../lib/access-control.js';
import {
  completeEnrollmentBodySchema,
  courseIdsQuerySchema,
  contentIdParamsSchema,
  courseIdParamsSchema,
  createContentBodySchema,
  createCourseBodySchema,
  createModuleBodySchema,
  createQuestionBodySchema,
  enrollmentIdParamsSchema,
  moduleIdParamsSchema,
  questionIdParamsSchema,
  resetEnrollmentBodySchema,
  submitCourseAnswerBodySchema,
  updateContentBodySchema,
  updateCourseBodySchema,
  updateEnrollmentProgressBodySchema,
  updateModuleBodySchema,
  updateQuestionBodySchema,
} from '../schemas/lms.js';

const moduleIdsQuerySchema = {
  parse(query: unknown) {
    const value = query && typeof query === 'object' && 'moduleIds' in query ? (query as { moduleIds?: unknown }).moduleIds : undefined;
    if (typeof value !== 'string' || value.trim() === '') return { moduleIds: [] };
    return { moduleIds: value.split(',').map((id) => id.trim()).filter(Boolean) };
  },
};

export const coursesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/courses', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.lms.listCourses(auth.actor);
    return reply.success(data, { message: 'Courses loaded successfully.' });
  });

  app.get('/courses/enrollments', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = courseIdsQuerySchema.parse(request.query);
    const data = await app.services.lms.listOwnEnrollments(auth.actor, query.courseIds);
    return reply.success(data, { message: 'Course enrollments loaded successfully.' });
  });

  app.get('/courses/:id', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = courseIdParamsSchema.parse(request.params);
    const data = await app.services.lms.getCourse(auth.actor, params.id);
    return reply.success(data, { message: 'Course loaded successfully.' });
  });

  app.post('/admin/courses', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createCourseBodySchema.parse(request.body);
    const data = await app.services.lms.createCourse(auth.actor.companyId, body);
    return reply.success(data, { statusCode: 201, message: 'Course created successfully.' });
  });

  app.put('/admin/courses/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = courseIdParamsSchema.parse(request.params);
    const body = updateCourseBodySchema.parse(request.body);
    const data = await app.services.lms.updateCourse(auth.actor.companyId, params.id, body);
    return reply.success(data, { message: 'Course updated successfully.' });
  });

  app.delete('/admin/courses/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = courseIdParamsSchema.parse(request.params);
    const data = await app.services.lms.deleteCourse(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Course deleted successfully.' });
  });

  app.get('/courses/:id/modules', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = courseIdParamsSchema.parse(request.params);
    const data = await app.services.lms.listModules(auth.actor, params.id);
    return reply.success(data, { message: 'Course modules loaded successfully.' });
  });

  app.post('/admin/courses/:id/modules', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = courseIdParamsSchema.parse(request.params);
    const body = createModuleBodySchema.parse(request.body);
    const data = await app.services.lms.createModule(auth.actor.companyId, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Course module created successfully.' });
  });

  app.put('/admin/course-modules/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = moduleIdParamsSchema.parse(request.params);
    const body = updateModuleBodySchema.parse(request.body);
    const data = await app.services.lms.updateModule(auth.actor.companyId, params.id, body);
    return reply.success(data, { message: 'Course module updated successfully.' });
  });

  app.delete('/admin/course-modules/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = moduleIdParamsSchema.parse(request.params);
    const data = await app.services.lms.deleteModule(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Course module deleted successfully.' });
  });

  app.get('/course-modules/:id/contents', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = moduleIdParamsSchema.parse(request.params);
    const data = await app.services.lms.listContents(auth.actor, params.id);
    return reply.success(data, { message: 'Course contents loaded successfully.' });
  });

  app.get('/course-contents', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = moduleIdsQuerySchema.parse(request.query);
    const data = await app.services.lms.listContentsByModules(auth.actor, query.moduleIds);
    return reply.success(data, { message: 'Course contents loaded successfully.' });
  });

  app.post('/admin/course-modules/:id/contents', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = moduleIdParamsSchema.parse(request.params);
    const body = createContentBodySchema.parse(request.body);
    const data = await app.services.lms.createContent(auth.actor.companyId, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Course content created successfully.' });
  });

  app.put('/admin/course-contents/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = contentIdParamsSchema.parse(request.params);
    const body = updateContentBodySchema.parse(request.body);
    const data = await app.services.lms.updateContent(auth.actor.companyId, params.id, body);
    return reply.success(data, { message: 'Course content updated successfully.' });
  });

  app.delete('/admin/course-contents/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = contentIdParamsSchema.parse(request.params);
    const data = await app.services.lms.deleteContent(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Course content deleted successfully.' });
  });

  app.get('/course-modules/:id/questions', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = moduleIdParamsSchema.parse(request.params);
    const data = await app.services.lms.listQuestions(auth.actor, params.id);
    return reply.success(data, { message: 'Course questions loaded successfully.' });
  });

  app.get('/course-questions', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = moduleIdsQuerySchema.parse(request.query);
    const data = await app.services.lms.listQuestionsByModules(auth.actor, query.moduleIds);
    return reply.success(data, { message: 'Course questions loaded successfully.' });
  });

  app.post('/admin/course-modules/:id/questions', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = moduleIdParamsSchema.parse(request.params);
    const body = createQuestionBodySchema.parse(request.body);
    const data = await app.services.lms.createQuestion(auth.actor.companyId, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Course question created successfully.' });
  });

  app.put('/admin/course-questions/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = questionIdParamsSchema.parse(request.params);
    const body = updateQuestionBodySchema.parse(request.body);
    const data = await app.services.lms.updateQuestion(auth.actor.companyId, params.id, body);
    return reply.success(data, { message: 'Course question updated successfully.' });
  });

  app.delete('/admin/course-questions/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = questionIdParamsSchema.parse(request.params);
    const data = await app.services.lms.deleteQuestion(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'Course question deleted successfully.' });
  });

  app.get('/courses/:id/enrollment', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = courseIdParamsSchema.parse(request.params);
    const data = await app.services.lms.getEnrollment(auth.actor, params.id);
    return reply.success(data, { message: 'Course enrollment loaded successfully.' });
  });

  app.post('/courses/:id/enroll', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = courseIdParamsSchema.parse(request.params);
    const data = await app.services.lms.enroll(auth.actor, params.id);
    return reply.success(data, { statusCode: 201, message: 'Course enrollment started successfully.' });
  });

  app.put('/courses/enrollments/:id/progress', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = enrollmentIdParamsSchema.parse(request.params);
    const body = updateEnrollmentProgressBodySchema.parse(request.body);
    const data = await app.services.lms.updateProgress(auth.actor, params.id, body);
    return reply.success(data, { message: 'Course progress updated successfully.' });
  });

  app.get('/courses/enrollments/:id/answers', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = enrollmentIdParamsSchema.parse(request.params);
    const data = await app.services.lms.listAnswers(auth.actor, params.id);
    return reply.success(data, { message: 'Course answers loaded successfully.' });
  });

  app.post('/courses/enrollments/:id/answers', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = enrollmentIdParamsSchema.parse(request.params);
    const body = submitCourseAnswerBodySchema.parse(request.body);
    const data = await app.services.lms.submitAnswer(auth.actor, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Course answer saved successfully.' });
  });

  app.post('/courses/enrollments/:id/complete', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = enrollmentIdParamsSchema.parse(request.params);
    const body = completeEnrollmentBodySchema.parse(request.body);
    const data = await app.services.lms.completeEnrollment(auth.actor, params.id, body);
    return reply.success(data, { message: 'Course enrollment completed successfully.' });
  });

  app.get('/courses/:id/stats', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = courseIdParamsSchema.parse(request.params);
    const data = await app.services.lms.getCourseStats(auth.actor, params.id);
    return reply.success(data, { message: 'Course stats loaded successfully.' });
  });

  app.get('/courses/:id/module-stats', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = courseIdParamsSchema.parse(request.params);
    const data = await app.services.lms.getModuleStats(auth.actor, params.id);
    return reply.success(data, { message: 'Course module stats loaded successfully.' });
  });

  app.get('/admin/courses/dashboard', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.lms.getDashboard(auth.actor.companyId);
    return reply.success(data, { message: 'Course dashboard loaded successfully.' });
  });

  app.get('/admin/courses/analytics', async (request, reply) => {
    const auth = requireAdminRole(request);
    const data = await app.services.lms.getAnalytics(auth.actor.companyId);
    return reply.success(data, { message: 'Course analytics loaded successfully.' });
  });

  app.get('/admin/courses/users/:id/history', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = { id: String((request.params as { id: string }).id) };
    const data = await app.services.lms.getUserHistory(auth.actor.companyId, params.id);
    return reply.success(data, { message: 'User course history loaded successfully.' });
  });

  app.post('/admin/courses/:id/reset-enrollment', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = courseIdParamsSchema.parse(request.params);
    const body = resetEnrollmentBodySchema.parse(request.body);
    const data = await app.services.lms.resetEnrollment(auth.actor.companyId, params.id, body.userId);
    return reply.success(data, { message: 'Course enrollment reset successfully.' });
  });
};
