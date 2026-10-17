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

export type SubscriptionPlan = "Starter" | "Growth" | "Enterprise";
export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trial" | "active" | "payment_pending";

export interface WorkspaceSubscription {
  plan: SubscriptionPlan;
  billingCycle: BillingCycle;
  price: number;
  seats: number;
  startedAt: string;
  status?: SubscriptionStatus;
}

export const defaultWorkspaceSubscription: WorkspaceSubscription = {
  plan: "Starter",
  billingCycle: "monthly",
  price: 1500,
  seats: 5,
  startedAt: new Date().toISOString(),
  status: "active",
};

export interface LocalWorkspace {
  companyName: string;
  domain: string;
  industry: string;
  country: string;
  adminJobTitle: string;
  inviteCode: string;
  subscription: WorkspaceSubscription;
}

export type MessageFolder = "inbox" | "sent" | "archived";
export type MessageDirection = "sent" | "received";

export interface Message {
  id: string;
  recipientId: string;
  senderName: string;
  subject: string;
  content: string;
  direction: MessageDirection;
  folder: MessageFolder;
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
  subject: string;
  content: string;
}
