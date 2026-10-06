import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiRequest } from "../services/apiClient";
import { clearAuthSession, readAuthSession, saveAuthSession } from "../services/authSession";
import type { AuthSession, AuthUser } from "../services/authSession";
import { AuthContext } from "./authContext";
import type { CompanyRegistrationInput, RegistrationInput } from "./authContext";

interface AuthResponse {
  access_token?: string;
  token?: string;
  company_id?: string;
  tenant_id?: string;
  tenant?: { id?: string; company_id?: string; tenant_id?: string };
  user?: {
    id?: string;
    name?: string;
    full_name?: string;
    email?: string;
    company_id?: string;
    tenant_id?: string;
    role?: string;
  };
}

function parseSession(response: AuthResponse): AuthSession {
  const token = response.access_token ?? response.token;
  const user = response.user;
  const tenantId = response.company_id
    ?? response.tenant_id
    ?? response.tenant?.id
    ?? response.tenant?.company_id
    ?? response.tenant?.tenant_id
    ?? user?.company_id
    ?? user?.tenant_id;

  if (!token || !tenantId || !user?.id || !user.email) {
    throw new Error("The server response is missing an access token, user, or active company.");
  }

  const authUser: AuthUser = {
    id: user.id,
    name: user.name ?? user.full_name ?? user.email,
    email: user.email,
    companyId: tenantId,
    role: user.role ?? "Member",
  };

  return { accessToken: token, tenantId, user: authUser };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readAuthSession());

  const establishSession = useCallback((response: AuthResponse) => {
    const nextSession = parseSession(response);
    saveAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      authenticated: false,
      body: JSON.stringify({ email, password }),
    });
    establishSession(response);
  }, [establishSession]);

  const register = useCallback(async (input: RegistrationInput) => {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      authenticated: false,
      body: JSON.stringify(input),
    });
    establishSession(response);
  }, [establishSession]);

  const registerCompany = useCallback(async (input: CompanyRegistrationInput) => {
    const response = await apiRequest<AuthResponse>("/auth/companies/register", {
      method: "POST",
      authenticated: false,
      body: JSON.stringify(input),
    });
    establishSession(response);
  }, [establishSession]);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setSession(null);
    window.addEventListener("pulsechart:unauthorized", onUnauthorized);
    return () => window.removeEventListener("pulsechart:unauthorized", onUnauthorized);
  }, []);

  const value = useMemo(() => ({ session, login, register, registerCompany, logout }), [session, login, register, registerCompany, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
