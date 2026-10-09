const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "/api"
).replace(/\/+$/, "");

export const AUTH_STORAGE_KEY = "real-estate-tenant-auth";
export const UNAUTHORIZED_EVENT = "tenant-auth:unauthorized";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
  let token;

  if (storedAuth) {
    try {
      token = JSON.parse(storedAuth).token;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }

  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new ApiError("The request was cancelled. Please try again.", 0);
    }
    if (!(error instanceof TypeError)) {
      throw error;
    }
    throw new ApiError(
      "Unable to connect to the server. Check the backend URL and try again.",
      0,
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      payload?.message || `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return payload;
}
