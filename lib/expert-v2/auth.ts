import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import {
  requireSession,
  requireExpert,
} from "@/lib/server/auth";

import type { UserSession } from "@/types/expert";
import type { ExpertSession } from "./types";

export function expertIdentity(user: UserSession): ExpertSession {
  return {
    uid: user.uid,
    name: user.displayName,
    role:
      user.role === "OWNER"
        ? "OWNER"
        : user.membership?.active && user.membership?.tier === "EXPERT"
          ? "EXPERT"
          : "FREE",
  };
}

export const requireExpertPage = cache(
  async (): Promise<ExpertSession> => {
    try {
      const user = await requireExpert();
      return expertIdentity(user);
    } catch {
      redirect("/login?next=/expert/dashboard");
    }
  },
);

export async function requireExpertRequest(
  _request: Request,
): Promise<ExpertSession> {
  const user = await requireExpert();
  return expertIdentity(user);
}

export const getExpertPageContext = cache(async () => ({
  session: await requireExpertPage(),
  serverTime: Date.now(),
}));
export async function logout() {
  const response = await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("LOGOUT_FAILED");
  }

  window.location.href = "/login";
}