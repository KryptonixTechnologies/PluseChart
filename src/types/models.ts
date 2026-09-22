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
