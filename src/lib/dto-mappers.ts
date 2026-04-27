import type { InviteView, InviteRecord } from '../modules/invite/contracts/invite.types.js';
import type { OrgTopLevelRecord, OrgTopLevelView, OrgUnitRecord, OrgUnitView } from '../modules/structure/contracts/structure.types.js';
import type { UserRecord, UserView } from '../modules/user/contracts/user.types.js';

export function toUserView(user: UserRecord): UserView {
  return {
    id: user.id,
    companyId: user.companyId,
    name: user.name,
    email: user.email,
    cpf: user.cpf,
    role: user.role,
    status: user.status,
    active: user.active,
    firstAccess: user.firstAccess,
    onboardingCompleted: user.onboardingCompleted ?? false,
    avatarUrl: user.avatarUrl,
    orgUnitId: user.orgUnitId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toInviteView(invite: InviteRecord): InviteView {
  return {
    id: invite.id,
    companyId: invite.companyId,
    name: invite.name,
    email: invite.email,
    cpf: invite.cpf,
    role: invite.role,
    orgUnitId: invite.orgUnitId,
    status: invite.status,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    activatedAt: invite.activatedAt,
  };
}

export function toTopLevelView(topLevel: OrgTopLevelRecord): OrgTopLevelView {
  return {
    id: topLevel.id,
    name: topLevel.name,
    levelIndex: topLevel.levelIndex,
    parentId: topLevel.parentId,
    createdAt: topLevel.createdAt,
    updatedAt: topLevel.updatedAt,
  };
}

export function toUnitView(unit: OrgUnitRecord): OrgUnitView {
  return {
    id: unit.id,
    name: unit.name,
    code: unit.code,
    topLevelId: unit.topLevelId,
    active: unit.active,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };
}
