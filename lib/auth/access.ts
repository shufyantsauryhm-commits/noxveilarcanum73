import type { Membership, UserRole } from "@/types/expert";

export function normalizeRole(input: unknown): UserRole {
  const role = typeof input === "string" ? input.trim().toUpperCase() : "";
  if (role === "OWNER") return "OWNER";
  if (role === "EXPERT") return "EXPERT";
  // Legacy member/free values are explicitly mapped down. Unknown/admin-like values fail closed.
  return "FREE";
}

export function canonicalAccessInstant(input: unknown): string | null | undefined {
  if (input === null || input === "") return null;
  if (input === undefined) return undefined;
  if (typeof input !== "string" || !/T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(input.trim())) return undefined;
  const ms = Date.parse(input);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : undefined;
}

export function normalizeMembership(input: unknown, nowMs = Date.now()): Membership {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const tier = typeof raw.tier === "string" && raw.tier.trim().toUpperCase() === "EXPERT" ? "EXPERT" : "FREE";
  const parsedExpiry = canonicalAccessInstant(raw.expiresAt);
  const expiryValid = raw.expiresAt === undefined || raw.expiresAt === null || raw.expiresAt === "" || parsedExpiry !== undefined;
  const expiryCurrent = !parsedExpiry || Date.parse(parsedExpiry) > nowMs;

  return {
    tier,
    active: raw.active === true && expiryValid && expiryCurrent,
    label:
      typeof raw.label === "string" && raw.label.trim()
        ? raw.label.trim()
        : tier === "EXPERT"
          ? "NOXVEIL Expert"
          : "Free",
    startedAt: canonicalAccessInstant(raw.startedAt) ?? undefined,
    expiresAt: parsedExpiry,
  };
}

export function canAccessExpert(role: UserRole, membership: Membership, nowMs = Date.now()): boolean {
  if (role === "OWNER") return true;
  if (role !== "EXPERT" || membership.tier !== "EXPERT" || membership.active !== true) return false;
  if (!membership.expiresAt) return true;
  const expiresMs = Date.parse(membership.expiresAt);
  return Number.isFinite(expiresMs) && expiresMs > nowMs;
}
