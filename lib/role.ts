import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export type SessionUser = {
  uid: string;
  email?: string;
  isAdmin: boolean;
  role?: string;
};

/**
 * Baca Firebase session cookie (__session) dan verify ke Firebase.
 * Return null kalau gak ada / invalid / expired.
 *
 * PENTING: cookie `uid` MENTAH tidak diverify di sini.
 * Hanya `__session` yang diverify lewat Firebase Admin SDK.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("__session")?.value;

    if (!session) return null;

    // verifySessionCookie akan THROW kalau cookie palsu / expired
    const decoded = await adminAuth().verifySessionCookie(session, true);

    // Ambil data user dari Firestore
    const userDoc = await adminDb().collection("users").doc(decoded.uid).get();
    const data = userDoc.data();

    return {
      uid: decoded.uid,
      email: decoded.email,
      isAdmin: data?.isAdmin === true,
      role: data?.role,
    };
  } catch {
    return null;
  }
}

/**
 * Cek user adalah owner/admin.
 * Dipakai di API routes yang butuh akses owner.
 */
export async function requireOwner(): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401 | 403; message: string }
> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  if (!user.isAdmin) {
    return { ok: false, status: 403, message: "Forbidden" };
  }

  return { ok: true, user };
}

/**
 * Cek user sudah login (member ATAU owner).
 * Dipakai di API routes yang boleh diakses member login.
 */
export async function requireAuth(): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; status: 401; message: string }
> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, status: 401, message: "Unauthorized" };
  }

  return { ok: true, user };
}