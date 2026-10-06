import { clearAuthSession, readAuthSession } from "./authSession";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiRequestOptions extends RequestInit {
  authenticated?: boolean;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { authenticated = true, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set("Accept", "application/json");
  if (requestOptions.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const session = authenticated ? readAuthSession() : null;
  if (session) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
    requestHeaders.set("X-Tenant-ID", session.tenantId);
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`, {
      ...requestOptions,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiError("Could not connect to PulseChart. Check your connection and try again.", 0);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const body: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
      ? body.message
      : typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : `Request failed (${response.status}).`;
    if (response.status === 401 && authenticated && session) {
      clearAuthSession();
      window.dispatchEvent(new Event("pulsechart:unauthorized"));
    }
    throw new ApiError(message, response.status);
  }

  return body as T;
}
