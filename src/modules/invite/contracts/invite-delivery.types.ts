export const inviteDeliveryProviderValues = ['noop', 'smtp'] as const;
export type InviteDeliveryProviderName = (typeof inviteDeliveryProviderValues)[number];

export const inviteDeliveryChannelValues = ['manual', 'email'] as const;
export type InviteDeliveryChannel = (typeof inviteDeliveryChannelValues)[number];

export const inviteDeliveryStatusValues = ['manual_delivery_pending', 'sent', 'failed'] as const;
export type InviteDeliveryStatus = (typeof inviteDeliveryStatusValues)[number];

export interface InviteDeliveryAttemptRecord {
  id: string;
  inviteId: string;
  companyId: string;
  channel: InviteDeliveryChannel;
  provider: InviteDeliveryProviderName;
  status: InviteDeliveryStatus;
  errorCode: string | null;
  requestedByUserId: string;
  sentAt: string | null;
  createdAt: string;
}

export interface InviteDeliveryAttemptView {
  id: string;
  inviteId: string;
  channel: InviteDeliveryChannel;
  provider: InviteDeliveryProviderName;
  status: InviteDeliveryStatus;
  errorCode: string | null;
  requestedByUserId: string;
  sentAt: string | null;
  createdAt: string;
}

export interface InviteActivationDeliveryView {
  status: InviteDeliveryStatus;
  channel: InviteDeliveryChannel;
  provider: InviteDeliveryProviderName;
  sent: boolean;
  lastAttempt: InviteDeliveryAttemptView | null;
}
