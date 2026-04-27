import type { FastifyPluginAsync } from 'fastify';
import { requireAuthenticatedRequest } from '../lib/access-control.js';
import { quizIdParamsSchema, quizQuerySchema, submitQuizAttemptBodySchema } from '../schemas/lms.js';

export const quizzesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/quizzes', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const query = quizQuerySchema.parse(request.query);
    const data = await app.services.lms.findQuiz(auth.actor, query);
    return reply.success(data, { message: 'Quiz loaded successfully.' });
  });

  app.get('/quizzes/:id/questions', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = quizIdParamsSchema.parse(request.params);
    const data = await app.services.lms.listQuizQuestions(auth.actor, params.id);
    return reply.success(data, { message: 'Quiz questions loaded successfully.' });
  });

  app.post('/quizzes/:id/attempts', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const params = quizIdParamsSchema.parse(request.params);
    const body = submitQuizAttemptBodySchema.parse(request.body);
    const data = await app.services.lms.submitQuizAttempt(auth.actor, params.id, body);
    return reply.success(data, { statusCode: 201, message: 'Quiz attempt saved successfully.' });
  });
};
