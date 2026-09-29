import { createHash } from "node:crypto";
import { adminDb } from "@/lib/firebase-admin";

const COLLECTION = "intelligence_analysis_cache";
const memory = new Map<string, StoredAnalysis<unknown>>();

export type StoredAnalysis<T> = {
  kind: "news" | "calendar";
  entityId: string;
  contentHash: string;
  generatedAt: string;
  model: string;
  analysis: T;
};

function key(kind: "news" | "calendar", entityId: string): string {
  return createHash("sha256").update(`${kind}:${entityId}`).digest("hex");
}

export async function readAnalysisCache<T>(
  kind: "news" | "calendar",
  entityId: string,
  contentHash: string,
): Promise<{ record: StoredAnalysis<T> | null; backend: "firestore" | "memory" }> {
  const docId = key(kind, entityId);
  try {
    const snap = await adminDb().collection(COLLECTION).doc(docId).get();
    if (snap.exists) {
      const data = snap.data() as StoredAnalysis<T>;
      if (data.contentHash === contentHash) return { record: data, backend: "firestore" };
    }
  } catch {
    // Firestore may be unavailable in local development without Admin credentials.
  }
  const local = memory.get(docId) as StoredAnalysis<T> | undefined;
  return {
    record: local?.contentHash === contentHash ? local : null,
    backend: "memory",
  };
}

export async function readLatestAnalysis<T>(
  kind: "news" | "calendar",
  entityId: string,
): Promise<{ record: StoredAnalysis<T> | null; backend: "firestore" | "memory" }> {
  const docId = key(kind, entityId);
  try {
    const snap = await adminDb().collection(COLLECTION).doc(docId).get();
    if (snap.exists) return { record: snap.data() as StoredAnalysis<T>, backend: "firestore" };
  } catch {
    // fall through
  }
  return { record: (memory.get(docId) as StoredAnalysis<T> | undefined) ?? null, backend: "memory" };
}

export async function writeAnalysisCache<T>(record: StoredAnalysis<T>): Promise<"firestore" | "memory"> {
  const docId = key(record.kind, record.entityId);
  memory.set(docId, record as StoredAnalysis<unknown>);
  try {
    await adminDb().collection(COLLECTION).doc(docId).set(record, { merge: false });
    return "firestore";
  } catch {
    return "memory";
  }
}