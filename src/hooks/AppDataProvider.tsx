import { useEffect, useMemo, useRef, useState } from "react";
import { defaultSettings, seedChannels, seedContacts, seedMessages } from "../data/seedData";
import { createPasswordCredential, verifyPassword } from "../services/localAuth";
import { readStored, writeStored } from "../services/storage";
import { AppDataContext } from "./appDataContext";
import type { AppDataContextValue } from "./appDataContext";
import type { Account, AppSettings, Channel, LocalWorkspace, SubscriptionPlan, WorkspaceSubscription } from "../types/models";
import { defaultWorkspaceSubscription } from "../types/models";
import type { PasswordCredential } from "../services/localAuth";

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createInviteCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
}

function readWorkspace(): LocalWorkspace | null {
  const stored = readStored<Partial<LocalWorkspace> | null>("workspace", null);
  if (!stored) return null;

  const savedPlan = (stored.subscription as { plan?: string } | undefined)?.plan;
  const plan: SubscriptionPlan = savedPlan === "Enterprise"
    ? "Premium"
    : savedPlan === "Growth"
      ? "Most Popular"
      : savedPlan === "Free" || savedPlan === "Starter" || savedPlan === "Most Popular" || savedPlan === "Premium"
      ? savedPlan
      : defaultWorkspaceSubscription.plan;
  const billingCycle = stored.subscription?.billingCycle ?? defaultWorkspaceSubscription.billingCycle;
  const previousPrices: Record<SubscriptionPlan, number> = { Free: 0, Starter: 29, "Most Popular": 79, Premium: 149 };
  const currentPrices: Record<SubscriptionPlan, number> = { Free: 0, Starter: 1500, "Most Popular": 4900, Premium: 12000 };
  const previousPrice = previousPrices[plan] * (billingCycle === "yearly" ? 10 : 1);
  const currentPrice = currentPrices[plan] * (billingCycle === "yearly" ? 10 : 1);
  const savedPrice = stored.subscription?.price;
  const startedAt = stored.subscription?.startedAt ?? new Date().toISOString();
  const subscription: WorkspaceSubscription = {
    ...defaultWorkspaceSubscription,
    ...(stored.subscription ?? {}),
    price: savedPrice === previousPrice ? currentPrice : savedPrice ?? defaultWorkspaceSubscription.price,
    startedAt,
    trialEndsAt: stored.subscription?.trialEndsAt ?? (plan === "Free"
      ? new Date(new Date(startedAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      : undefined),
  };

  return {
    companyName: stored.companyName ?? "",
    domain: stored.domain ?? "",
    industry: stored.industry ?? "",
    country: stored.country ?? "",
    adminJobTitle: stored.adminJobTitle ?? "",
    inviteCode: stored.inviteCode || createInviteCode(),
    inviteCodeUsed: stored.inviteCodeUsed ?? false,
    subscription,
  };
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState(() => readStored("contacts", seedContacts));
  const [channels, setChannels] = useState<Channel[]>(() => readStored("channels", seedChannels));
  const [messages, setMessages] = useState(() => readStored("messages", seedMessages));
  const [settings, setSettings] = useState(() => readStored("settings", defaultSettings));
  const [accounts, setAccounts] = useState<Account[]>(() => readStored("accounts", []));
  const [workspace, setWorkspace] = useState<LocalWorkspace | null>(readWorkspace);
  const [credentials, setCredentials] = useState<PasswordCredential[]>(() => readStored("credentials", []));
  const [sessionAccountId, setSessionAccountId] = useState<string | null>(() => readStored<string | null>("sessionAccountId", null));
  const initialAdminSetupStarted = useRef(false);
  const inviteRegistrationInProgress = useRef(false);

  useEffect(() => writeStored("accounts", accounts), [accounts]);
  useEffect(() => writeStored("workspace", workspace), [workspace]);
  useEffect(() => writeStored("credentials", credentials), [credentials]);
  useEffect(() => writeStored("contacts", contacts), [contacts]);
  useEffect(() => writeStored("channels", channels), [channels]);
  useEffect(() => writeStored("messages", messages), [messages]);
  useEffect(() => writeStored("settings", settings), [settings]);

  useEffect(() => {
    const syncMessages = (event: StorageEvent) => {
      if (event.key !== "pulsechart.messages" || !event.newValue) return;
      try {
        const nextMessages: unknown = JSON.parse(event.newValue);
        if (Array.isArray(nextMessages)) setMessages(nextMessages);
      } catch {
        // Ignore malformed data written by another tab.
      }
    };

    const syncChannels = (event: StorageEvent) => {
      if (event.key !== "pulsechart.channels" || !event.newValue) return;
      try {
        const nextChannels: unknown = JSON.parse(event.newValue);
        if (Array.isArray(nextChannels)) setChannels(nextChannels);
      } catch {
        // Ignore malformed data written by another tab.
      }
    };

    window.addEventListener("storage", syncMessages);
    window.addEventListener("storage", syncChannels);
    return () => {
      window.removeEventListener("storage", syncMessages);
      window.removeEventListener("storage", syncChannels);
    };
  }, []);

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
      workspace,
      updateSubscription: (subscription) => setWorkspace((current) => current ? { ...current, subscription } : current),
      registerInvitedAccount: async (input, password, inviteCode) => {
        const normalizedInviteCode = inviteCode.trim().toUpperCase();
        if (!workspace || workspace.inviteCodeUsed || inviteRegistrationInProgress.current || workspace.inviteCode.toUpperCase() !== normalizedInviteCode) {
          return "invalid_invite";
        }

        inviteRegistrationInProgress.current = true;
        const result = await createLocalAccount(input, password, true);
        if (result === "created") {
          setWorkspace((current) => current ? { ...current, inviteCodeUsed: true } : current);
        } else {
          inviteRegistrationInProgress.current = false;
        }
        return result;
      },
      contacts,
      channels,
      messages,
      settings,
      addAccount: (input, password, signInAfterCreate = false) => createLocalAccount(input, password, signInAfterCreate),
      updateAccount: async (id, input, password) => {
        const email = input.email.trim().toLowerCase();
        if (accounts.some((account) => account.id !== id && account.email.toLowerCase() === email)) return "duplicate";
        const account = accounts.find((item) => item.id === id);
        if (!account) return "not_found";

        let nextCredential: PasswordCredential | null = null;
        if (password) {
          try {
            nextCredential = await createPasswordCredential(id, password);
          } catch {
            return "unavailable";
          }
        }

        const updatedAccount = { ...account, ...input, email };
        setAccounts((current) => current.map((item) => item.id === id ? updatedAccount : item));
        if (nextCredential) {
          setCredentials((current) => [...current.filter((credential) => credential.accountId !== id), nextCredential]);
        }
        if (currentAccount?.id === id) {
          setSettings((current) => ({
            ...current,
            profile: { ...current.profile, fullName: updatedAccount.fullName, email: updatedAccount.email, phone: updatedAccount.phone, role: updatedAccount.role },
          }));
        }
        return "updated";
      },
      deleteAccount: (id) => {
        if (currentAccount?.id === id || !accounts.some((account) => account.id === id)) return false;
        const replacementOwnerId = accounts.find((account) => account.id !== id && account.role === "Administrator")?.id
          ?? accounts.find((account) => account.id !== id)?.id
          ?? "";
        setAccounts((current) => current.filter((account) => account.id !== id));
        setCredentials((current) => current.filter((credential) => credential.accountId !== id));
        setChannels((current) => current.map((channel) => ({
          ...channel,
          ownerId: channel.ownerId === id ? replacementOwnerId : channel.ownerId,
          memberIds: channel.memberIds.filter((memberId) => memberId !== id),
        })));
        return true;
      },
      createInitialAdmin: async (input, password, workspaceDetails, initialSettings) => {
        if (accounts.length > 0 || initialAdminSetupStarted.current) return "closed";

        initialAdminSetupStarted.current = true;
        const result = await createLocalAccount({ ...input, role: "Administrator" }, password, true);
        if (result === "created" && workspaceDetails) {
          setWorkspace(workspaceDetails);
          if (initialSettings) setSettings(initialSettings);
        }
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
      addChannel: (input) => {
        const channel: Channel = { ...input, id: createId("channel"), pinnedMessageIds: [], createdAt: new Date().toISOString() };
        setChannels((current) => [...current, channel]);
        return channel;
      },
      updateChannel: (id, changes) => setChannels((current) => current.map((channel) => channel.id === id ? { ...channel, ...changes } : channel)),
      deleteChannel: (id) => {
        setChannels((current) => current.filter((channel) => channel.id !== id));
        setMessages((current) => current.filter((message) => message.conversationId !== id));
      },
      addMessage: (input) => {
        setMessages((current) => [
          {
            ...input,
            id: createId("message"),
            senderId: currentAccount?.id,
            senderName: currentAccount?.fullName ?? settings.profile.fullName,
            direction: "sent",
            folder: "sent",
            read: true,
            readBy: currentAccount ? [currentAccount.id] : [],
            createdAt: new Date().toISOString(),
          },
          ...current,
        ]);
      },
      updateMessage: (id, changes) => setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...changes } : message))),
      deleteMessage: (id) => setMessages((current) => current.filter((message) => message.id !== id)),
      updateSettings: (nextSettings: AppSettings) => {
        setSettings(nextSettings);
        if (currentAccount) {
          setAccounts((current) => current.map((account) => account.id === currentAccount.id
            ? { ...account, fullName: nextSettings.profile.fullName, email: nextSettings.profile.email.trim().toLowerCase(), phone: nextSettings.profile.phone }
            : account));
        }
      },
      };
    },
    [accounts, channels, contacts, credentials, currentAccount, messages, settings, workspace],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}
