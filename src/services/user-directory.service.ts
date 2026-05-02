import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type { UserRecord } from '../modules/user/contracts/user.types.js';
import type { ChecklistsRepository } from '../repositories/contracts/checklists.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';

interface VisibleUsersFilters {
  ids?: string[];
}

export class UserDirectoryService {
  public constructor(
    private readonly userRepository: UserRepository,
    private readonly checklistsRepository: ChecklistsRepository,
  ) {}

  public async listVisibleUsers(actor: AuthenticatedActor, filters: VisibleUsersFilters = {}) {
    const candidateIds = await this.getVisibleUserIds(actor);
    const requestedIds = filters.ids?.length ? new Set(filters.ids) : null;
    const visibleIds = requestedIds
      ? [...candidateIds].filter((id) => requestedIds.has(id))
      : [...candidateIds];

    if (visibleIds.length === 0) return [];

    const users = await Promise.all(visibleIds.map((id) => this.userRepository.findById(actor.companyId, id)));
    return users
      .filter((user): user is UserRecord => Boolean(user && user.active && user.status === 'ACTIVE'))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((user) => ({
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        orgUnitId: user.orgUnitId,
      }));
  }

  private async getVisibleUserIds(actor: AuthenticatedActor): Promise<Set<string>> {
    const actorUser = await this.userRepository.findById(actor.companyId, actor.userId);
    const visibleIds = new Set<string>([actor.userId]);

    if (actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN') {
      const users = await this.userRepository.listByCompany(actor.companyId, {
        page: 1,
        limit: 100,
        status: 'ACTIVE',
      });
      users.items.forEach((user) => {
        if (user.active && user.status === 'ACTIVE') visibleIds.add(user.id);
      });
    } else if (actorUser?.orgUnitId) {
      const sameUnitUsers = await this.userRepository.listByCompany(actor.companyId, {
        page: 1,
        limit: 100,
        status: 'ACTIVE',
      });
      sameUnitUsers.items
        .filter((user) => user.orgUnitId === actorUser.orgUnitId && user.active && user.status === 'ACTIVE')
        .forEach((user) => visibleIds.add(user.id));
    }

    const plans = await this.checklistsRepository.listActionPlans(actor.companyId);
    const submissions = await this.checklistsRepository.listSubmissions(actor.companyId);
    const submissionById = new Map(submissions.map((submission) => [submission.id, submission]));

    plans
      .filter((plan) => {
        if (plan.deletedAt) return false;
        const submission = plan.submissionId ? submissionById.get(plan.submissionId) : null;
        return (
          plan.assigneeUserId === actor.userId ||
          plan.createdByUserId === actor.userId ||
          submission?.userId === actor.userId
        );
      })
      .forEach((plan) => {
        if (plan.assigneeUserId) visibleIds.add(plan.assigneeUserId);
        if (plan.createdByUserId) visibleIds.add(plan.createdByUserId);
        const submission = plan.submissionId ? submissionById.get(plan.submissionId) : null;
        if (submission?.userId) visibleIds.add(submission.userId);
      });

    return visibleIds;
  }
}
