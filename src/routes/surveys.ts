import type { FastifyPluginAsync } from 'fastify';
import { requireAdminRole, requireAuthenticatedRequest } from '../lib/access-control.js';
import {
  createSurveyBodySchema,
  createSurveyQuestionBodySchema,
  reorderSurveyQuestionsBodySchema,
  submitSurveyResponseBodySchema,
  surveyIdParamsSchema,
  surveyQuestionIdParamsSchema,
  updateSurveyBodySchema,
  updateSurveyQuestionBodySchema,
} from '../schemas/surveys.js';

/**
 * `POST /api/surveys/:id/responses`
 *
 * Replaces the legacy `supabase.rpc('submit_survey_response')` call from the
 * SurveyPlayer. Tenant isolation is enforced server-side by stamping the
 * authenticated actor's `companyId` and `userId` on the persistence input.
 */
export const surveysRoutes: FastifyPluginAsync = async (app) => {
  app.get('/surveys', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.surveys.listSurveys(auth.actor);
    return reply.success(data, { message: 'Surveys loaded successfully.' });
  });

  app.get('/surveys/:id', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = surveyIdParamsSchema.parse(request.params);
    const data = await app.services.surveys.getSurvey(auth.actor, params.id);
    return reply.success(data, { message: 'Survey loaded successfully.' });
  });

  app.get('/surveys/:id/questions', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = surveyIdParamsSchema.parse(request.params);
    const data = await app.services.surveys.listQuestions(auth.actor, params.id);
    return reply.success(data, { message: 'Survey questions loaded successfully.' });
  });

  app.get('/surveys/:id/responses', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = surveyIdParamsSchema.parse(request.params);
    const data = await app.services.surveys.listResponses(auth.actor, params.id);
    return reply.success(data, { message: 'Survey responses loaded successfully.' });
  });

  app.get('/surveys/:id/answers', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = surveyIdParamsSchema.parse(request.params);
    const data = await app.services.surveys.listAnswers(auth.actor, params.id);
    return reply.success(data, { message: 'Survey answers loaded successfully.' });
  });

  app.get('/users/me/survey-responses', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const data = await app.services.surveys.listUserResponses(auth.actor);
    return reply.success(data, { message: 'Survey responses loaded successfully.' });
  });

  app.post('/surveys/:id/responses', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = surveyIdParamsSchema.parse(request.params);
    const body = submitSurveyResponseBodySchema.parse(request.body);

    const data = await app.services.surveys.submitResponse(auth.actor, {
      surveyId: params.id,
      startedAt: body.started_at ?? null,
      answers: body.answers.map((answer) => ({
        questionId: answer.question_id,
        value: answer.value,
      })),
    });

    return reply.success(data, {
      statusCode: 201,
      message: 'Survey response submitted successfully.',
    });
  });

  app.post('/admin/surveys', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = createSurveyBodySchema.parse(request.body);
    const data = await app.services.surveys.createSurvey(auth.actor, body);
    return reply.success(data, { statusCode: 201, message: 'Survey created successfully.' });
  });

  app.put('/admin/surveys/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = surveyIdParamsSchema.parse(request.params);
    const body = updateSurveyBodySchema.parse(request.body);
    const data = await app.services.surveys.updateSurvey(auth.actor, params.id, body);
    return reply.success(data, { message: 'Survey updated successfully.' });
  });

  app.delete('/admin/surveys/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = surveyIdParamsSchema.parse(request.params);
    const data = await app.services.surveys.deleteSurvey(auth.actor, params.id);
    return reply.success(data, { message: 'Survey deleted successfully.' });
  });

  app.post('/admin/surveys/:id/questions', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = surveyIdParamsSchema.parse(request.params);
    const body = createSurveyQuestionBodySchema.parse(request.body);
    const data = await app.services.surveys.createQuestion(auth.actor, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Survey question created successfully.' });
  });

  app.put('/admin/survey-questions/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = surveyQuestionIdParamsSchema.parse(request.params);
    const body = updateSurveyQuestionBodySchema.parse(request.body);
    const data = await app.services.surveys.updateQuestion(auth.actor, params.id, body);
    return reply.success(data, { message: 'Survey question updated successfully.' });
  });

  app.delete('/admin/survey-questions/:id', async (request, reply) => {
    const auth = requireAdminRole(request);
    const params = surveyQuestionIdParamsSchema.parse(request.params);
    const data = await app.services.surveys.deleteQuestion(auth.actor, params.id);
    return reply.success(data, { message: 'Survey question deleted successfully.' });
  });

  app.post('/admin/survey-questions/reorder', async (request, reply) => {
    const auth = requireAdminRole(request);
    const body = reorderSurveyQuestionsBodySchema.parse(request.body);
    const data = await app.services.surveys.reorderQuestions(auth.actor, body.items);
    return reply.success(data, { message: 'Survey questions reordered successfully.' });
  });
};
