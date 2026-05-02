import type { UserRole } from '../../auth/contracts/auth.types.js';
import type { InviteActivationDeliveryView } from './invite-delivery.types.js';

export const inviteStatusValues = ['PENDING_SETUP', 'ACTIVATED', 'CANCELLED', 'EXPIRED'] as const;

export type InviteStatus = (typeof inviteStatusValues)[number];

export interface InviteRecord {
  id: string;
  companyId: string;
  name: string;
  email: string;
  normalizedEmail: string;
  cpf: string | null;
  role: UserRole;
  orgUnitId: string | null;
  token: string;
  status: InviteStatus;
  invitedByUserId: string;
  userId: string | null;
  expiresAt: string;
  activatedAt: string | null;
  cancelledAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InviteView {
  id: string;
  companyId: string;
  name: string;
  email: string;
  cpf: string | null;
  role: UserRole;
  orgUnitId: string | null;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  activatedAt: string | null;
  activationDelivery?: InviteActivationDeliveryView;
}
