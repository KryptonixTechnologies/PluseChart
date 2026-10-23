export type ContactStatus = "active" | "inactive";

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: ContactStatus;
  createdAt: string;
}

export interface Account {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

export interface AccountInput {
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

export type SubscriptionPlan = "Free" | "Starter" | "Most Popular" | "Premium";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trial" | "active" | "payment_pending";

export interface WorkspaceSubscription {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  price: number;
  seats: number;
  startedAt: string;
  trialEndsAt?: string;
  status?: SubscriptionStatus;
}

export const defaultWorkspaceSubscription: WorkspaceSubscription = {
  plan: "Free",
  billingCycle: "monthly",
  price: 0,
  seats: 3,
  startedAt: new Date().toISOString(),
  trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  status: "trial",
};

export interface LocalWorkspace {
  companyName: string;
  domain: string;
  industry: string;
  country: string;
  adminJobTitle: string;
  inviteCode: string;
  inviteCodeUsed?: boolean;
  subscription: WorkspaceSubscription;
}

export type MessageFolder = "inbox" | "sent" | "archived";
export type MessageDirection = "sent" | "received";
export type MessageConversationType = "channel" | "direct";

export interface Channel {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  pinnedMessageIds: string[];
  isPrivate: boolean;
  createdAt: string;
}

export type ChannelInput = Omit<Channel, "id" | "createdAt" | "pinnedMessageIds">;

export interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface Message {
  id: string;
  recipientId: string;
  senderId?: string;
  senderName: string;
  subject: string;
  content: string;
  direction: MessageDirection;
  folder: MessageFolder;
  conversationType?: MessageConversationType;
  conversationId?: string;
  mentions?: string[];
  attachments?: MessageAttachment[];
  readBy?: string[];
  previousFolder?: Exclude<MessageFolder, "archived">;
  read: boolean;
  createdAt: string;
}

export interface Profile {
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  messageNotifications: boolean;
  weeklyReports: boolean;
}

export interface SystemPreferences {
  language: string;
  timeZone: string;
  dateFormat: string;
}

export interface AppSettings {
  profile: Profile;
  notifications: NotificationPreferences;
  system: SystemPreferences;
}

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: ContactStatus;
}

export interface MessageInput {
  recipientId: string;
  senderId?: string;
  subject: string;
  content: string;
  conversationType?: MessageConversationType;
  conversationId?: string;
  mentions?: string[];
  attachments?: MessageAttachment[];
}
