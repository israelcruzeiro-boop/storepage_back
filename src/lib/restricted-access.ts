import { AppError } from './errors.js';
import type { AuthenticatedActor } from '../modules/auth/contracts/auth.types.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';

export interface RestrictedAccessTarget {
  accessType: 'ALL' | 'RESTRICTED';
  status?: string | null;
  allowedUserIds?: readonly string[];
  allowedRegionIds?: readonly string[];
  allowedStoreIds?: readonly string[];
  excludedUserIds?: readonly string[];
}

interface ActorOrgContext {
  orgUnitId: string | null;
  topLevelIds: ReadonlySet<string>;
}

export class RestrictedAccessEvaluator {
  public constructor(
    private readonly users: UserRepository,
    private readonly structure: StructureRepository,
  ) {}

  public async canRead(actor: AuthenticatedActor, target: RestrictedAccessTarget): Promise<boolean> {
    if (this.isAdmin(actor)) return true;
    const context = await this.getActorOrgContext(actor);
    return this.canReadWithContext(actor, target, context);
  }

  public async filterReadable<T extends RestrictedAccessTarget>(
    actor: AuthenticatedActor,
    targets: readonly T[],
  ): Promise<T[]> {
    if (this.isAdmin(actor)) return [...targets];
    const context = await this.getActorOrgContext(actor);
    return targets.filter((target) => this.canReadWithContext(actor, target, context));
  }

  public async assertValidAccessTarget(companyId: string, target: RestrictedAccessTarget): Promise<void> {
    if (target.accessType === 'RESTRICTED' && !this.hasAnyAllowedTarget(target)) {
      throw new AppError(
        400,
        'BAD_REQUEST',
        'Restricted access requires at least one allowed user, region, or store.',
      );
    }

    await Promise.all([
      this.assertUsersBelongToTenant(companyId, target.allowedUserIds ?? [], 'allowedUserIds'),
      this.assertUsersBelongToTenant(companyId, target.excludedUserIds ?? [], 'excludedUserIds'),
      this.assertTopLevelsBelongToTenant(companyId, target.allowedRegionIds ?? [], 'allowedRegionIds'),
      this.assertUnitsBelongToTenant(companyId, target.allowedStoreIds ?? [], 'allowedStoreIds'),
    ]);
  }

  private canReadWithContext(
    actor: AuthenticatedActor,
    target: RestrictedAccessTarget,
    context: ActorOrgContext,
  ): boolean {
    if (this.includes(target.excludedUserIds, actor.userId)) return false;
    if (target.status && target.status !== 'ACTIVE') return false;
    if (target.accessType === 'ALL') return true;
    if (!this.hasAnyAllowedTarget(target)) return false;
    if (this.includes(target.allowedUserIds, actor.userId)) return true;
    if (context.orgUnitId && this.includes(target.allowedStoreIds, context.orgUnitId)) return true;
    return [...context.topLevelIds].some((topLevelId) => this.includes(target.allowedRegionIds, topLevelId));
  }

  private async getActorOrgContext(actor: AuthenticatedActor): Promise<ActorOrgContext> {
    const user = await this.users.findById(actor.companyId, actor.userId);
    if (!user?.orgUnitId) {
      return {
        orgUnitId: null,
        topLevelIds: new Set(),
      };
    }

    const unit = await this.structure.findUnitById(actor.companyId, user.orgUnitId);
    const topLevelIds = unit?.topLevelId
      ? await this.collectTopLevelIds(actor.companyId, unit.topLevelId)
      : new Set<string>();

    return {
      orgUnitId: user.orgUnitId,
      topLevelIds,
    };
  }

  private async collectTopLevelIds(companyId: string, topLevelId: string): Promise<Set<string>> {
    const ids = new Set<string>();
    let currentId: string | null = topLevelId;

    while (currentId && !ids.has(currentId)) {
      const topLevel = await this.structure.findTopLevelById(companyId, currentId);
      if (!topLevel) break;
      ids.add(topLevel.id);
      currentId = topLevel.parentId;
    }

    return ids;
  }

  private async assertUsersBelongToTenant(companyId: string, ids: readonly string[], field: string): Promise<void> {
    const uniqueIds = this.unique(ids);
    if (uniqueIds.length === 0) return;

    const users = await Promise.all(uniqueIds.map((id) => this.users.findById(companyId, id)));
    if (users.some((user) => !user)) {
      throw new AppError(400, 'BAD_REQUEST', `${field} contains a user outside the authenticated tenant.`);
    }
  }

  private async assertTopLevelsBelongToTenant(companyId: string, ids: readonly string[], field: string): Promise<void> {
    const uniqueIds = this.unique(ids);
    if (uniqueIds.length === 0) return;

    const topLevels = await Promise.all(uniqueIds.map((id) => this.structure.findTopLevelById(companyId, id)));
    if (topLevels.some((topLevel) => !topLevel)) {
      throw new AppError(400, 'BAD_REQUEST', `${field} contains a structure node outside the authenticated tenant.`);
    }
  }

  private async assertUnitsBelongToTenant(companyId: string, ids: readonly string[], field: string): Promise<void> {
    const uniqueIds = this.unique(ids);
    if (uniqueIds.length === 0) return;

    const units = await Promise.all(uniqueIds.map((id) => this.structure.findUnitById(companyId, id)));
    if (units.some((unit) => !unit)) {
      throw new AppError(400, 'BAD_REQUEST', `${field} contains a unit outside the authenticated tenant.`);
    }
  }

  private hasAnyAllowedTarget(target: RestrictedAccessTarget): boolean {
    return Boolean(
      target.allowedUserIds?.length ||
        target.allowedRegionIds?.length ||
        target.allowedStoreIds?.length,
    );
  }

  private includes(ids: readonly string[] | undefined, id: string): boolean {
    return Boolean(ids?.includes(id));
  }

  private unique(ids: readonly string[]): string[] {
    return [...new Set(ids)];
  }

  private isAdmin(actor: AuthenticatedActor): boolean {
    return actor.role === 'ADMIN' || actor.role === 'SUPER_ADMIN';
  }
}
