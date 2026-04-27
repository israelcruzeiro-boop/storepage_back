import type { FastifyPluginAsync } from 'fastify';
import { adminStructureRoutes } from './admin-structure.js';
import { adminUsersRoutes } from './admin-users.js';
import { authRoutes } from './auth.js';
import { checklistsRoutes } from './checklists.js';
import { companiesRoutes } from './companies.js';
import { contentsRoutes } from './contents.js';
import { coursesRoutes } from './courses.js';
import { landingRoutes } from './landing.js';
import { metricsRoutes } from './metrics.js';
import { quizzesRoutes } from './quizzes.js';
import { repositoriesRoutes } from './repositories.js';
import { rewardsRoutes } from './rewards.js';
import { settingsRoutes } from './settings.js';
import { storageRoutes } from './storage.js';
import { structureRoutes } from './structure.js';
import { superAdminRoutes } from './super-admin.js';
import { surveysRoutes } from './surveys.js';
import { usersRoutes } from './users.js';

export const apiRoutes: FastifyPluginAsync = async (app) => {
  app.get('/', async (_request, reply) =>
    reply.success(app.services.system.getApiInfo(), {
      message: 'StorePage_back API foundation is available.',
    }),
  );

  await app.register(authRoutes);
  await app.register(companiesRoutes);
  await app.register(settingsRoutes);
  await app.register(storageRoutes);
  await app.register(structureRoutes);
  await app.register(repositoriesRoutes);
  await app.register(contentsRoutes);
  await app.register(coursesRoutes);
  await app.register(quizzesRoutes);
  await app.register(landingRoutes);
  await app.register(metricsRoutes);
  await app.register(usersRoutes);
  await app.register(adminUsersRoutes);
  await app.register(adminStructureRoutes);
  await app.register(rewardsRoutes);
  await app.register(surveysRoutes);
  await app.register(checklistsRoutes);
  await app.register(superAdminRoutes);
};
