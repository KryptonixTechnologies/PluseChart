import { createContext } from "react";
import type { AppSettings, Contact, ContactInput, Message, MessageInput } from "../types/models";

export interface AppDataContextValue {
  contacts: Contact[];
  messages: Message[];
  settings: AppSettings;
  addContact: (input: ContactInput) => void;
  updateContact: (id: string, input: ContactInput) => void;
  deleteContact: (id: string) => void;
  addMessage: (input: MessageInput) => void;
  updateMessage: (id: string, changes: Partial<Message>) => void;
  deleteMessage: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
}

export const AppDataContext = createContext<AppDataContextValue | null>(null);
