import "server-only";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { adminDb } from "@/lib/server/firebase-admin";

function out(doc: DocumentSnapshot) {
  return { id: doc.id, ...(doc.data() ?? {}) };
}

export async function listDocuments(collection: string, _token = "") {
  void _token;
  const snap = await adminDb().collection(collection).limit(100).get();
  return snap.docs.map(out);
}

export async function createDocument(collection: string, _token: string, data: Record<string, unknown>) {
  const ref = adminDb().collection(collection).doc();
  await ref.set(data);
  return out(await ref.get());
}

export async function patchDocument(collection: string, id: string, _token: string, data: Record<string, unknown>) {
  const ref = adminDb().collection(collection).doc(id);
  await ref.set(data, { merge: true });
  return out(await ref.get());
}

export async function deleteDocument(collection: string, id: string, _token = "") {
  void _token;
  await adminDb().collection(collection).doc(id).delete();
  return true;
}
