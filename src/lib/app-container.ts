import type { AppEnv } from '../config/env.js';
import { InMemoryAuthSessionRepository } from '../repositories/memory/in-memory-auth-session.repository.js';
import { InMemoryChecklistsRepository } from '../repositories/memory/in-memory-checklists.repository.js';
import { InMemoryCompanyRepository } from '../repositories/memory/in-memory-company.repository.js';
import { InMemoryContentRepository } from '../repositories/memory/in-memory-content.repository.js';
import { InMemoryInviteDeliveryAttemptRepository } from '../repositories/memory/in-memory-invite-delivery-attempt.repository.js';
import { InMemoryInviteRepository } from '../repositories/memory/in-memory-invite.repository.js';
import { InMemoryLegacyRpcRepository } from '../repositories/memory/in-memory-legacy-rpc.repository.js';
import { InMemoryLmsRepository } from '../repositories/memory/in-memory-lms.repository.js';
import { InMemoryStore, type InMemoryStoreSeed } from '../repositories/memory/in-memory-store.js';
import { InMemoryStructureRepository } from '../repositories/memory/in-memory-structure.repository.js';
import { InMemorySurveysRepository } from '../repositories/memory/in-memory-surveys.repository.js';
import { InMemoryUserRepository } from '../repositories/memory/in-memory-user.repository.js';
import { RuntimeRepository } from '../repositories/runtime.repository.js';
import { SupabaseAuthSessionRepository } from '../repositories/supabase/supabase-auth-session.repository.js';
import { SupabaseChecklistsRepository } from '../repositories/supabase/supabase-checklists.repository.js';
import { SupabaseCompanyRepository } from '../repositories/supabase/supabase-company.repository.js';
import { SupabaseContentRepository } from '../repositories/supabase/supabase-content.repository.js';
import { SupabaseInviteDeliveryAttemptRepository } from '../repositories/supabase/supabase-invite-delivery-attempt.repository.js';
import { SupabaseInviteRepository } from '../repositories/supabase/supabase-invite.repository.js';
import { SupabaseLegacyRpcRepository } from '../repositories/supabase/supabase-legacy-rpc.repository.js';
import { SupabaseLmsRepository } from '../repositories/supabase/supabase-lms.repository.js';
import { SupabaseRestClient } from '../repositories/supabase/supabase-rest-client.js';
import { SupabaseStructureRepository } from '../repositories/supabase/supabase-structure.repository.js';
import { SupabaseSurveysRepository } from '../repositories/supabase/supabase-surveys.repository.js';
import { SupabaseUserRepository } from '../repositories/supabase/supabase-user.repository.js';
import type { AuthSessionRepository } from '../repositories/contracts/auth-session.repository.js';
import type { ChecklistsRepository } from '../repositories/contracts/checklists.repository.js';
import type { CompanyRepository } from '../repositories/contracts/company.repository.js';
import type { ContentRepository } from '../repositories/contracts/content.repository.js';
import type { InviteDeliveryAttemptRepository } from '../repositories/contracts/invite-delivery-attempt.repository.js';
import type { InviteRepository } from '../repositories/contracts/invite.repository.js';
import type { LegacyRpcRepository } from '../repositories/contracts/legacy-rpc.repository.js';
import type { LmsRepository } from '../repositories/contracts/lms.repository.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';
import type { SurveysRepository } from '../repositories/contracts/surveys.repository.js';
import type { TenantRepository } from '../repositories/contracts/tenant.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';
import { AdminUsersService } from '../services/admin-users.service.js';
import { AuthService } from '../services/auth.service.js';
import { AuthenticationService } from '../services/authentication.service.js';
import { ChecklistsService } from '../services/checklists.service.js';
import { CompanyService } from '../services/company.service.js';
import { ContentLibraryService } from '../services/content-library.service.js';
import { InviteDeliveryService, type InviteDeliveryProvider } from '../services/invite-delivery.service.js';
import { LmsService } from '../services/lms.service.js';
import { OrganizationService } from '../services/organization.service.js';
import { SessionJwtService } from '../services/session-jwt.service.js';
import { StorageService } from '../services/storage.service.js';
import { SuperAdminService } from '../services/super-admin.service.js';
import { SurveysService } from '../services/surveys.service.js';
import { SystemService } from '../services/system.service.js';
import { UserRewardsService } from '../services/user-rewards.service.js';
import { UserDirectoryService } from '../services/user-directory.service.js';
import { PasswordService } from './passwords.js';
import { RestrictedAccessEvaluator } from './restricted-access.js';

export interface AppRepositories {
  runtime: RuntimeRepository;
  company: CompanyRepository;
  tenant: TenantRepository;
  user: UserRepository;
  invite: InviteRepository;
  inviteDeliveryAttempt: InviteDeliveryAttemptRepository;
  content: ContentRepository;
  lms: LmsRepository;
  structure: StructureRepository;
  authSession: AuthSessionRepository;
  legacyRpc: LegacyRpcRepository;
  checklists: ChecklistsRepository;
  surveys: SurveysRepository;
}

export interface AppServices {
  system: SystemService;
  sessionJwt: SessionJwtService;
  authentication: AuthenticationService;
  company: CompanyService;
  auth: AuthService;
  adminUsers: AdminUsersService;
  organization: OrganizationService;
  contentLibrary: ContentLibraryService;
  lms: LmsService;
  storage: StorageService;
  userRewards: UserRewardsService;
  userDirectory: UserDirectoryService;
  surveys: SurveysService;
  checklists: ChecklistsService;
  superAdmin: SuperAdminService;
}

export interface AppContainer {
  repositories: AppRepositories;
  services: AppServices;
}

export interface BuildAppContainerOptions {
  seed?: InMemoryStoreSeed;
  inviteDeliveryProvider?: InviteDeliveryProvider;
}

function buildRepositories(env: AppEnv, options: BuildAppContainerOptions): AppRepositories {
  const runtimeRepository = new RuntimeRepository();

  if (env.REPOSITORY.driver === 'supabase') {
    if (!env.SUPABASE.url || !env.SUPABASE.serviceRoleKey) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when REPOSITORY_DRIVER=supabase.');
    }

    const client = new SupabaseRestClient(env.SUPABASE.url, env.SUPABASE.serviceRoleKey, env.SUPABASE.schema);
    const companyRepository = new SupabaseCompanyRepository(client);

    return {
      runtime: runtimeRepository,
      company: companyRepository,
      tenant: companyRepository,
      user: new SupabaseUserRepository(client),
      invite: new SupabaseInviteRepository(client),
      inviteDeliveryAttempt: new SupabaseInviteDeliveryAttemptRepository(client),
      content: new SupabaseContentRepository(client),
      lms: new SupabaseLmsRepository(client),
      structure: new SupabaseStructureRepository(client),
      authSession: new SupabaseAuthSessionRepository(client),
      legacyRpc: new SupabaseLegacyRpcRepository(client),
      checklists: new SupabaseChecklistsRepository(client),
      surveys: new SupabaseSurveysRepository(client),
    };
  }

  const store = new InMemoryStore(options.seed);
  const companyRepository = new InMemoryCompanyRepository(store);

  return {
    runtime: runtimeRepository,
    company: companyRepository,
    tenant: companyRepository,
    user: new InMemoryUserRepository(store),
    invite: new InMemoryInviteRepository(store),
    inviteDeliveryAttempt: new InMemoryInviteDeliveryAttemptRepository(store),
    content: new InMemoryContentRepository(store),
    lms: new InMemoryLmsRepository(store),
    structure: new InMemoryStructureRepository(store),
    authSession: new InMemoryAuthSessionRepository(store),
    legacyRpc: new InMemoryLegacyRpcRepository(),
    checklists: new InMemoryChecklistsRepository(store),
    surveys: new InMemorySurveysRepository(store),
  };
}

export function buildAppContainer(env: AppEnv, options: BuildAppContainerOptions = {}): AppContainer {
  const repositories = buildRepositories(env, options);
  const companyRepository = repositories.company;
  const userRepository = repositories.user;
  const inviteRepository = repositories.invite;
  const inviteDeliveryAttemptRepository = repositories.inviteDeliveryAttempt;
  const contentRepository = repositories.content;
  const checklistsRepository = repositories.checklists;
  const surveysRepository = repositories.surveys;
  const lmsRepository = repositories.lms;
  const structureRepository = repositories.structure;
  const authSessionRepository = repositories.authSession;
  const legacyRpcRepository = repositories.legacyRpc;
  const passwordService = new PasswordService();
  const sessionJwtService = new SessionJwtService(env);
  const companyService = new CompanyService(
    companyRepository,
    structureRepository,
    env.PUBLIC_TENANT_CACHE_TTL_SECONDS * 1000,
  );
  const inviteDeliveryService = new InviteDeliveryService(
    env,
    inviteDeliveryAttemptRepository,
    options.inviteDeliveryProvider,
  );
  const organizationService = new OrganizationService(companyRepository, structureRepository, userRepository);
  const restrictedAccess = new RestrictedAccessEvaluator(userRepository, structureRepository);

  const services: AppServices = {
    system: new SystemService(env, repositories.runtime),
    sessionJwt: sessionJwtService,
    authentication: new AuthenticationService(sessionJwtService, userRepository, authSessionRepository, companyRepository),
    company: companyService,
    auth: new AuthService(
      companyService,
      userRepository,
      inviteRepository,
      structureRepository,
      authSessionRepository,
      passwordService,
      sessionJwtService,
    ),
    adminUsers: new AdminUsersService(
      userRepository,
      inviteRepository,
      structureRepository,
      authSessionRepository,
      inviteDeliveryService,
      passwordService,
    ),
    organization: organizationService,
    contentLibrary: new ContentLibraryService(companyRepository, contentRepository, restrictedAccess),
    lms: new LmsService(lmsRepository, restrictedAccess),
    storage: new StorageService(env),
    userRewards: new UserRewardsService(legacyRpcRepository),
    userDirectory: new UserDirectoryService(userRepository, checklistsRepository),
    surveys: new SurveysService(surveysRepository, userRepository, structureRepository, restrictedAccess),
    checklists: new ChecklistsService(checklistsRepository, restrictedAccess),
    superAdmin: new SuperAdminService(
      companyRepository,
      userRepository,
      inviteRepository,
      authSessionRepository,
      passwordService,
    ),
  };

  return {
    repositories,
    services,
  };
}
