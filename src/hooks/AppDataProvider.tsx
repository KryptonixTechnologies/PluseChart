import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSettings, seedContacts, seedMessages } from "../data/seedData";
import { createPasswordCredential, verifyPassword } from "../services/localAuth";
import { readStored, writeStored } from "../services/storage";
import { AppDataContext } from "./appDataContext";
import type { AppDataContextValue } from "./appDataContext";
import type { Account, AppSettings } from "../types/models";
import type { PasswordCredential } from "../services/localAuth";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState(() => readStored("contacts", seedContacts));
  const [messages, setMessages] = useState(() => readStored("messages", seedMessages));
  const [settings, setSettings] = useState(() => readStored("settings", defaultSettings));
  const [accounts, setAccounts] = useState<Account[]>(() => readStored("accounts", []));
  const [credentials, setCredentials] = useState<PasswordCredential[]>(() => readStored("credentials", []));
  const [sessionAccountId, setSessionAccountId] = useState<string | null>(() => readStored<string | null>("sessionAccountId", null));
  const initialAdminSetupStarted = useRef(false);

  useEffect(() => writeStored("accounts", accounts), [accounts]);
  useEffect(() => writeStored("credentials", credentials), [credentials]);
  useEffect(() => writeStored("contacts", contacts), [contacts]);
  useEffect(() => writeStored("messages", messages), [messages]);
  useEffect(() => writeStored("settings", settings), [settings]);

  const currentAccount = accounts.find((account) => account.id === sessionAccountId) ?? null;

  const value = useMemo<AppDataContextValue>(
    () => {
      const createLocalAccount = async (
        input: Parameters<AppDataContextValue["addAccount"]>[0],
        password: string,
        signInAfterCreate = false,
      ) => {
        const email = input.email.trim().toLowerCase();
        if (accounts.some((account) => account.email.toLowerCase() === email)) return "duplicate" as const;

        const account: Account = {
          ...input,
          email,
          id: createId("account"),
          createdAt: new Date().toISOString(),
        };

        try {
          const credential = await createPasswordCredential(account.id, password);
          setAccounts((current) => [account, ...current]);
          setCredentials((current) => [credential, ...current]);
          if (signInAfterCreate) {
            setSessionAccountId(account.id);
            writeStored("sessionAccountId", account.id);
            setSettings((current) => ({
              ...current,
              profile: { ...current.profile, fullName: account.fullName, email: account.email, phone: account.phone, role: account.role },
            }));
          }
          return "created" as const;
        } catch {
          return "unavailable" as const;
        }
      };

      return {
      accounts,
      currentAccount,
      contacts,
      messages,
      settings,
      addAccount: (input, password) => createLocalAccount(input, password),
      createInitialAdmin: async (input, password) => {
        if (accounts.length > 0 || initialAdminSetupStarted.current) return "closed";

        initialAdminSetupStarted.current = true;
        const result = await createLocalAccount({ ...input, role: "Administrator" }, password, true);
        if (result !== "created") initialAdminSetupStarted.current = false;
        return result === "duplicate" ? "closed" : result;
      },
      signIn: async (email, password) => {
        const account = accounts.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
        const credential = account && credentials.find((item) => item.accountId === account.id);
        if (!account || !credential) return false;

        try {
          if (!(await verifyPassword(password, credential))) return false;
        } catch {
          return false;
        }

        setSessionAccountId(account.id);
        writeStored("sessionAccountId", account.id);
        setSettings((current) => ({
          ...current,
          profile: { ...current.profile, fullName: account.fullName, email: account.email, phone: account.phone, role: account.role },
        }));
        return true;
      },
      signOut: () => {
        setSessionAccountId(null);
        writeStored("sessionAccountId", null);
      },
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
      };
    },
    [accounts, contacts, credentials, currentAccount, messages, settings],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
