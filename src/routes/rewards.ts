import type { FastifyPluginAsync } from 'fastify';
import { requireAuthenticatedRequest } from '../lib/access-control.js';
import { incrementUserStatsBodySchema } from '../schemas/rewards.js';

/**
 * `POST /api/users/me/rewards/increment`
 *
 * Replaces the legacy `supabase.rpc('increment_user_stats')` call. Acts on the
 * authenticated user only — admins awarding XP to other users will land in a
 * future admin endpoint.
 */
export const rewardsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/users/me/rewards/increment', async (request, reply) => {
    const auth = requireAuthenticatedRequest(request);
    const body = incrementUserStatsBodySchema.parse(request.body);
    const data = await app.services.userRewards.incrementSelfStats(auth.actor, {
      xpToAdd: body.xp,
      coinsToAdd: body.coins,
    });

    return reply.success(data, {
      message: 'User stats updated successfully.',
    });
  });
};
