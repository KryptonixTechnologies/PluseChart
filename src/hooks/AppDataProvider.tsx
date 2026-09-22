import { useEffect, useMemo, useState } from "react";
import { defaultSettings, seedContacts, seedMessages } from "../data/seedData";
import { readStored, writeStored } from "../services/storage";
import { AppDataContext } from "./appDataContext";
import type { AppDataContextValue } from "./appDataContext";
import type { AppSettings } from "../types/models";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState(() => readStored("contacts", seedContacts));
  const [messages, setMessages] = useState(() => readStored("messages", seedMessages));
  const [settings, setSettings] = useState(() => readStored("settings", defaultSettings));

  useEffect(() => writeStored("contacts", contacts), [contacts]);
  useEffect(() => writeStored("messages", messages), [messages]);
  useEffect(() => writeStored("settings", settings), [settings]);

  const value = useMemo<AppDataContextValue>(
    () => ({
      contacts,
      messages,
      settings,
      addContact: (input) => {
        setContacts((current) => [
          { ...input, id: createId("contact"), createdAt: new Date().toISOString() },
          ...current,
        ]);
      },
      updateContact: (id, input) => {
        setContacts((current) => current.map((contact) => (contact.id === id ? { ...contact, ...input } : contact)));
      },
      deleteContact: (id) => setContacts((current) => current.filter((contact) => contact.id !== id)),
      addMessage: (input) => {
        const recipient = contacts.find((contact) => contact.id === input.recipientId);
        setMessages((current) => [
          {
            ...input,
            id: createId("message"),
            senderName: recipient?.name ?? "Unknown contact",
            direction: "sent",
            folder: "sent",
            read: true,
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
      },
      updateMessage: (id, changes) => setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...changes } : message))),
      deleteMessage: (id) => setMessages((current) => current.filter((message) => message.id !== id)),
      updateSettings: (nextSettings: AppSettings) => setSettings(nextSettings),
    }),
    [contacts, messages, settings],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
