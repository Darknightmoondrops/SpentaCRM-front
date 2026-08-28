/**
 * Single HTTP boundary for the future NestJS API.
 * UI components should not call fetch() directly.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiRequestOptions = RequestInit & {
  query?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(path: string, query?: ApiRequestOptions["query"]) {
  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export async function api<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { query, headers, ...init } = options;
  const method = (init.method ?? "GET").toUpperCase();
  const response = await fetch(buildUrl(path, query), {
    ...init,
    // CRM reads are user-specific and operational; never rely on accidental framework caching.
    cache: init.cache ?? (method === "GET" ? "no-store" : undefined),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
    credentials: "include",
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === "object" && payload && "message" in payload
      ? String((payload as { message: unknown }).message)
      : `API request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
