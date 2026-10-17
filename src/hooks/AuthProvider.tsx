import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { useAppData } from "./useAppData";
import { AuthContext } from "./authContext";
import type { AuthSession, CompanyRegistrationInput, RegistrationInput } from "./authContext";
import { defaultSettings } from "../data/seedData";
import type { LocalWorkspace, WorkspaceSubscription } from "../types/models";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { accounts, currentAccount, workspace, addAccount, createInitialAdmin, signIn, signOut } = useAppData();

  const session = useMemo<AuthSession | null>(() => currentAccount ? {
    user: {
      id: currentAccount.id,
      name: currentAccount.fullName,
      email: currentAccount.email,
      role: currentAccount.role,
    },
    workspaceName: workspace?.companyName ?? "Local workspace",
  } : null, [currentAccount, workspace]);

  const login = useCallback(async (email: string, password: string) => {
    if (!(await signIn(email, password))) {
      throw new Error("Email or password is incorrect.");
    }
  }, [signIn]);

  const register = useCallback(async (input: RegistrationInput) => {
    if (!input.invite_code.trim()) {
      throw new Error("Enter the workspace invite code.");
    }
    if (!workspace) {
      throw new Error("Create a company workspace on this browser before joining it.");
    }
    if (input.invite_code.trim().toUpperCase() !== workspace.inviteCode) {
      throw new Error("That invite code does not match this workspace.");
    }
    const result = await addAccount({
      fullName: input.name.trim(),
      email: input.email.trim(),
      phone: "",
      role: "Member",
    }, input.password, true);
    if (result !== "created") {
      throw new Error(result === "duplicate" ? "An account with this email already exists." : "Secure password storage is unavailable in this browser.");
    }
  }, [addAccount, workspace]);

  const registerCompany = useCallback(async (input: CompanyRegistrationInput) => {
    if (workspace || accounts.length > 0) {
      throw new Error("A local workspace already exists in this browser. Sign in or clear the local app data to start over.");
    }

    const subscription: WorkspaceSubscription = input.subscription ?? {
      plan: "Starter",
      billingCycle: "monthly",
      price: 1500,
      seats: 5,
      startedAt: new Date().toISOString(),
      status: "active",
    };

    const workspaceDetails: LocalWorkspace = {
      companyName: input.company_name.trim(),
      domain: input.domain.trim().toLowerCase(),
      industry: input.industry,
      country: input.country,
      adminJobTitle: input.admin_job_title.trim(),
      inviteCode: input.invite_code,
      subscription,
    };
    const initialSettings = {
      ...defaultSettings,
      profile: {
        fullName: input.admin_name.trim(),
        email: input.admin_email.trim().toLowerCase(),
        phone: "",
        role: "Administrator",
      },
      system: input.system_preferences,
      notifications: input.notification_preferences,
    };
    const result = await createInitialAdmin({
      fullName: input.admin_name.trim(),
      email: input.admin_email.trim(),
      phone: "",
      role: "Administrator",
    }, input.admin_password, workspaceDetails, initialSettings);
    if (result !== "created") {
      throw new Error(result === "closed" ? "A local account already exists. Sign in instead." : "Secure password storage is unavailable in this browser.");
    }
  }, [accounts.length, createInitialAdmin, workspace]);

  const logout = useCallback(() => signOut(), [signOut]);

  const value = useMemo(() => ({ session, login, register, registerCompany, logout }), [session, login, register, registerCompany, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
