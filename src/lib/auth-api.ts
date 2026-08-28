import type { AuthSession } from "./types";
import { api } from "./api-client";

export interface SignInPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  title?: string;
  timezone?: string;
}

export const authApi = {
  signIn: (payload: SignInPayload) => api<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  me: () => api<AuthSession>("/auth/me"),
  refresh: () => api<AuthSession>("/auth/refresh", { method: "POST" }),
  signOut: () => api<void>("/auth/logout", { method: "POST" }),
  updateProfile: (payload: UpdateProfilePayload) => api<AuthSession>("/users/me", { method: "PATCH", body: JSON.stringify(payload) }),
};
