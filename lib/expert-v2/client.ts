"use client";

export async function logout() {
  const response = await fetch("/api/auth/session", {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) throw new Error("LOGOUT_FAILED");

  window.location.href = "/login";
}