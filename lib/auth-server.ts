import "server-only";
import type { NextRequest } from "next/server";
import type { UserSession } from "@/types/expert";
import {
  requireSession,
  sessionFromIdToken,
  SESSION_COOKIE_NAME,
  verifyIdTokenForSession,
} from "@/lib/server/auth";

export const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "noxveil-arcanum";
export const SESSION_COOKIE = SESSION_COOKIE_NAME;

export const verifyFirebaseIdToken = verifyIdTokenForSession;

export async function resolveIdentity(idToken: string) {
  const session = await sessionFromIdToken(idToken);
  return { ...session, idToken };
}

export function tokenFromRequest(request: NextRequest | Request) {
  const auth = request.headers.get("authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
}

export async function identityFromRequest(request: NextRequest | Request) {
  const bearer = tokenFromRequest(request);
  if (bearer) {
    try { return await resolveIdentity(bearer); } catch { return null; }
  }
  try {
    const session = await requireSession();
    return { ...session, idToken: "" };
  } catch {
    return null;
  }
}

export async function requireOwnerFromRequest(request: NextRequest | Request) {
  const identity = await identityFromRequest(request);
  if (!identity) return { ok: false as const, status: 401, error: "UNAUTHENTICATED" };
  if (identity.role !== "OWNER") return { ok: false as const, status: 403, error: "FORBIDDEN" };
  return { ok: true as const, identity };
}

export async function currentServerIdentity(): Promise<(UserSession & { idToken: string }) | null> {
  try {
    const session = await requireSession();
    return { ...session, idToken: "" };
  } catch {
    return null;
  }
}
