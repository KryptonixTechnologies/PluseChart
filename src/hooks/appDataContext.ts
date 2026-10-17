import { createContext } from "react";
import type { Account, AccountInput, AppSettings, Contact, ContactInput, LocalWorkspace, Message, MessageInput, WorkspaceSubscription } from "../types/models";

export interface AppDataContextValue {
  accounts: Account[];
  currentAccount: Account | null;
  workspace: LocalWorkspace | null;
  updateSubscription: (subscription: WorkspaceSubscription) => void;
  contacts: Contact[];
  messages: Message[];
  settings: AppSettings;
  addAccount: (input: AccountInput, password: string, signInAfterCreate?: boolean) => Promise<"created" | "duplicate" | "unavailable">;
  createInitialAdmin: (input: AccountInput, password: string, workspace?: LocalWorkspace, initialSettings?: AppSettings) => Promise<"created" | "closed" | "unavailable">;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  addContact: (input: ContactInput) => void;
  updateContact: (id: string, input: ContactInput) => void;
  deleteContact: (id: string) => void;
  addMessage: (input: MessageInput) => void;
  updateMessage: (id: string, changes: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);
