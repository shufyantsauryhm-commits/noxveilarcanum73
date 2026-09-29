"use client";
import { useEffect, useState } from "react";
import type { Feed, FeedResponse, Resource, Resources } from "./types";
const periods: Record<Resource, number> = {
  market: 5000,
  news: 90000,
  calendar: 60000,
  signals: 15000,
  intelligence: 60000,
  activity: 60000,
  materials: 90000,
  tools: 60000,
};
export function useFeed<K extends Resource>(
  resource: K,
  enabled = true,
): Feed<Resources[K]> {
  const [state, setState] = useState<Feed<Resources[K]>>({
    data: null,
    status: "WAITING",
    error: null,
    receivedAt: null,
  });
  useEffect(() => {
    if (!enabled) return;
    let disposed = false,
      busy = false,
      failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined,
      controller: AbortController | undefined;
    const run = async () => {
      if (disposed || busy) return;
      if (document.visibilityState === "hidden") {
        timer = setTimeout(run, periods[resource]);
        return;
      }
      busy = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 12000);
      try {
        const response = await fetch(`/api/expert/${resource}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) {
          disposed = true;
          setState({
            data: null,
            status: "OFFLINE",
            error: "Akses berakhir.",
            receivedAt: null,
          });
          window.location.replace(
            response.status === 401
              ? "/login?next=/expert/dashboard"
              : "/dashboard",
          );
          return;
        }
        if (!response.ok)
          throw new Error(
            response.status === 429
              ? "Batas request tercapai. Mencoba lagi sebentar."
              : "Sumber data belum tersedia.",
          );
        const body: FeedResponse = await response.json();
        if (
          (body.status !== "ONLINE" && body.status !== "DEGRADED") ||
          body.payload === undefined
        )
          throw new Error("Data belum tersedia.");
        failures = 0;
        if (!disposed)
          setState({
            data: body.payload as Resources[K],
            status: body.status,
            error: null,
            receivedAt: Date.now(),
          });
      } catch (error) {
        failures++;
        if (!disposed)
          setState((previous) => ({
            ...previous,
            status: previous.data !== null ? "DEGRADED" : "OFFLINE",
            error:
              error instanceof Error && error.name !== "AbortError"
                ? error.message
                : "Koneksi terlalu lama. Mencoba lagi.",
          }));
      } finally {
        clearTimeout(timeout);
        busy = false;
        if (!disposed)
          timer = setTimeout(
            run,
            Math.min(periods[resource] * 2 ** Math.min(failures, 3), 300000),
          );
      }
    };
    const resume = () => {
      if (document.visibilityState === "visible" && !busy) {
        clearTimeout(timer);
        void run();
      }
    };
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    void run();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [resource, enabled]);
  return state;
}
