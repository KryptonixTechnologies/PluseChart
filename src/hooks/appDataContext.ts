import { createContext } from "react";
import type { Account, AccountInput, AppSettings, Channel, ChannelInput, Contact, ContactInput, LocalWorkspace, Message, MessageInput, WorkspaceSubscription } from "../types/models";

export interface AppDataContextValue {
  accounts: Account[];
  currentAccount: Account | null;
  workspace: LocalWorkspace | null;
  updateSubscription: (subscription: WorkspaceSubscription) => void;
  registerInvitedAccount: (input: AccountInput, password: string, inviteCode: string) => Promise<"created" | "duplicate" | "unavailable" | "invalid_invite">;
  contacts: Contact[];
  channels: Channel[];
  messages: Message[];
  settings: AppSettings;
  addAccount: (input: AccountInput, password: string, signInAfterCreate?: boolean) => Promise<"created" | "duplicate" | "unavailable">;
  updateAccount: (id: string, input: AccountInput, password?: string) => Promise<"updated" | "duplicate" | "unavailable" | "not_found">;
  deleteAccount: (id: string) => boolean;
  createInitialAdmin: (input: AccountInput, password: string, workspace?: LocalWorkspace, initialSettings?: AppSettings) => Promise<"created" | "closed" | "unavailable">;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  addContact: (input: ContactInput) => void;
  updateContact: (id: string, input: ContactInput) => void;
  deleteContact: (id: string) => void;
  addChannel: (input: ChannelInput) => Channel;
  updateChannel: (id: string, changes: Partial<Channel>) => void;
  deleteChannel: (id: string) => void;
  addMessage: (input: MessageInput) => void;
  updateMessage: (id: string, changes: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);
