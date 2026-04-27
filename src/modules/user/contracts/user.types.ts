import type { UserRole } from '../../auth/contracts/auth.types.js';

export const userStatusValues = ['ACTIVE', 'PENDING_SETUP', 'INACTIVE'] as const;

export type UserStatus = (typeof userStatusValues)[number];

export interface UserRecord {
  id: string;
  companyId: string;
  name: string;
  email: string;
  normalizedEmail: string;
  cpf: string | null;
  role: UserRole;
  status: UserStatus;
  active: boolean;
  firstAccess: boolean;
  onboardingCompleted?: boolean | null;
  avatarUrl: string | null;
  orgUnitId: string | null;
  passwordHash: string | null;
  passwordUpdatedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserView {
  id: string;
  companyId: string;
  name: string;
  email: string;
  cpf: string | null;
  role: UserRole;
  status: UserStatus;
  active: boolean;
  firstAccess: boolean;
  onboardingCompleted: boolean;
  avatarUrl: string | null;
  orgUnitId: string | null;
  createdAt: string;
  updatedAt: string;
}
