export interface AuthUser {
  id: string;
  name: string;
  email: string;
  companyId: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
  tenantId: string;
  user: AuthUser;
}

const sessionKey = "pulsechart.authSession";

export function readAuthSession(): AuthSession | null {
  const stored = window.sessionStorage.getItem(sessionKey);
  if (!stored) return null;

  try {
    const session: unknown = JSON.parse(stored);
    if (
      typeof session === "object" &&
      session !== null &&
      "accessToken" in session &&
      typeof session.accessToken === "string" &&
      "tenantId" in session &&
      typeof session.tenantId === "string" &&
      "user" in session &&
      typeof session.user === "object" &&
      session.user !== null &&
      "id" in session.user &&
      typeof session.user.id === "string" &&
      "name" in session.user &&
      typeof session.user.name === "string" &&
      "email" in session.user &&
      typeof session.user.email === "string" &&
      "companyId" in session.user &&
      typeof session.user.companyId === "string" &&
      "role" in session.user &&
      typeof session.user.role === "string"
    ) {
      return session as AuthSession;
    }
  } catch {
    window.sessionStorage.removeItem(sessionKey);
    return null;
  }

  window.sessionStorage.removeItem(sessionKey);
  return null;
}

export function saveAuthSession(session: AuthSession) {
  window.sessionStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearAuthSession() {
  window.sessionStorage.removeItem(sessionKey);
}
