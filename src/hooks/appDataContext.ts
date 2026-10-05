import { createContext } from "react";
import type { Account, AccountInput, AppSettings, Contact, ContactInput, Message, MessageInput } from "../types/models";

export interface AppDataContextValue {
  accounts: Account[];
  currentAccount: Account | null;
  contacts: Contact[];
  messages: Message[];
  settings: AppSettings;
  addAccount: (input: AccountInput, password: string) => Promise<"created" | "duplicate" | "unavailable">;
  createInitialAdmin: (input: AccountInput, password: string) => Promise<"created" | "closed" | "unavailable">;
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
