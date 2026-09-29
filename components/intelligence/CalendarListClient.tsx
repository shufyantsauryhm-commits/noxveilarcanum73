"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import type {
  AnalysisEnvelope,
  CalendarAnalysis,
  CalendarFeedResponse,
  EconomicEvent,
  FundamentalPressure,
  NewsItem,
} from "@/types/intelligence";

type Focus = "all" | "high" | "usd" | "gold" | "macro";
type WindowFilter = "all" | "today" | "tomorrow" | "week";

type CalendarDetailPayload = {
  event: EconomicEvent;
  relatedNews: Array<Omit<NewsItem, "content">>;
  fundamental: {
    comparison: { available: boolean; text: string };
    pressure: FundamentalPressure;
  };
};

type AnalysisApiResponse = Partial<AnalysisEnvelope<CalendarAnalysis>> & {
  error?: string;
  cooldownRemainingSeconds?: number;
  retryAfterSeconds?: number;
};

const DETAIL_TIMEOUT_MS = 20_000;
const ANALYZE_TIMEOUT_MS = 90_000;

function dateKey(ms: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(ms));
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDay(key: string, amount: number) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount, 12))
    .toISOString()
    .slice(0, 10);
}

function exactTime(event: EconomicEvent) {
  return !event.timeMode || event.timeMode.toLowerCase() === "exact";
}

function timeWib(event: EconomicEvent) {
  if (!exactTime(event)) {
    const mode = event.timeMode?.toLowerCase();
    if (mode === "date" || mode === "notime") return "ALL DAY";
    return "TENTATIVE";
  }
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(event.timestamp));
}

function dayWib(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

function wib(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function eventStatus(
  event: EconomicEvent,
  now: number,
): EconomicEvent["status"] {
  if (event.actual) return "released";
  const ms = Date.parse(event.timestamp);
  if (!Number.isFinite(ms)) return event.status;
  if (!exactTime(event)) return now < ms ? "upcoming" : event.status;
  if (now < ms - 120_000) return "upcoming";
  if (now <= ms + 300_000) return "live";
  return "released";
}

function countdown(event: EconomicEvent, now: number) {
  if (!exactTime(event) || eventStatus(event, now) !== "upcoming") return null;
  const seconds = Math.max(
    0,
    Math.floor((Date.parse(event.timestamp) - now) / 1000),
  );
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const secs = seconds % 60;
  return days > 0
    ? `T-${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
    : `T-${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function isMacroEvent(event: EconomicEvent) {
  return event.category !== "holiday" && event.category !== "gold";
}

function isValidCalendarAnalysis(value: unknown): value is CalendarAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<CalendarAnalysis>;
  return (
    typeof analysis.summary === "string" &&
    typeof analysis.whatItMeans === "string" &&
    Array.isArray(analysis.keyPoints) &&
    typeof analysis.goldRelevance === "string" &&
    Boolean(analysis.goldBias) &&
    typeof analysis.goldBias?.direction === "string" &&
    typeof analysis.goldBias?.confidence === "string" &&
    typeof analysis.goldBias?.explanation === "string" &&
    Array.isArray(analysis.fundamentalFactors) &&
    Array.isArray(analysis.marketContext) &&
    Array.isArray(analysis.expectedScenarios) &&
    Array.isArray(analysis.risks)
  );
}

function normalizeAnalysis(
  json: AnalysisApiResponse,
): AnalysisEnvelope<CalendarAnalysis> | null {
  if (!isValidCalendarAnalysis(json.analysis)) return null;
  return {
    analysis: json.analysis,
    cached: Boolean(json.cached),
    generatedAt: json.generatedAt || new Date().toISOString(),
    model: json.model || "NOXVEIL AI",
    contentHash: json.contentHash || "",
    cacheBackend: json.cacheBackend === "firestore" ? "firestore" : "memory",
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`Server mengembalikan response kosong. HTTP ${response.status}.`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Server mengembalikan response bukan JSON. HTTP ${response.status}.`);
  }
}

function analysisErrorMessage(response: Response, json: AnalysisApiResponse) {
  if (json.error?.trim()) return json.error.trim();
  if (response.status === 429) {
    return `AI sedang cooldown${
      typeof json.cooldownRemainingSeconds === "number"
        ? ` ${json.cooldownRemainingSeconds} detik`
        : ""
    }. Cache terakhir tetap dipertahankan jika tersedia.`;
  }
  if (response.status === 503) return "AI provider sementara tidak tersedia.";
  if (response.status === 504) return "AI analysis timeout.";
  return `AI analysis gagal. HTTP ${response.status}.`;
}

function biasClass(direction: CalendarAnalysis["goldBias"]["direction"]) {
  if (direction === "bullish") {
    return "border-[#3EA6FF]/25 bg-[#0B3152]/35 text-[#C8E6FF]";
  }
  if (direction === "bearish") {
    return "border-red-400/20 bg-red-500/[0.045] text-red-100";
  }
  return "border-white/[0.09] bg-white/[0.035] text-[#D6E2EE]";
}

function impactClasses(impact: EconomicEvent["impact"]) {
  if (impact === "high") {
    return {
      row: "border-l-[#3EA6FF]/85 shadow-[inset_2px_0_0_rgba(62,166,255,.16)]",
      badge: "border-[#3EA6FF]/25 bg-[#1677FF]/12 text-[#A9D4FF]",
      dot: "border-[#8AC8FF]/55 bg-[#1677FF] shadow-[0_0_18px_rgba(62,166,255,.55)]",
    };
  }
  if (impact === "medium") {
    return {
      row: "border-l-[#35668F]/75",
      badge: "border-[#365F82]/30 bg-[#16324A]/35 text-[#A6B7C9]",
      dot: "border-[#597B99]/45 bg-[#315D82]",
    };
  }
  return {
    row: "border-l-[#263C51]/70",
    badge: "border-white/[0.07] bg-white/[0.025] text-[#75869A]",
    dot: "border-[#41556A]/45 bg-[#22384C]",
  };
}

function pressureWidth(score: number) {
  return `${Math.max(8, Math.min(100, (Math.abs(score) / 5) * 100))}%`;
}

function DepthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#02060C]" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,170,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(99,170,255,.8) 1px,transparent 1px)",
          backgroundSize: "54px 54px",
          maskImage: "linear-gradient(to bottom,black,transparent 94%)",
        }}
      />
      <div className="nx-cal-orb absolute left-[12vw] top-[6vh] h-[36vw] w-[36vw] rounded-full bg-[#0D4F86]/12 blur-[120px]" />
      <div className="nx-cal-orb-alt absolute bottom-[-12vh] right-[-6vw] h-[38vw] w-[38vw] rounded-full bg-[#1677FF]/8 blur-[130px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,.5)_100%)]" />
    </div>
  );
}

export default function CalendarListClient() {
  const [data, setData] = useState<CalendarFeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [focus, setFocus] = useState<Focus>("all");
  const [windowFilter, setWindowFilter] = useState<WindowFilter>("all");
  const [now, setNow] = useState(Date.now());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CalendarDetailPayload | null>(null);
  const [analysis, setAnalysis] =
    useState<AnalysisEnvelope<CalendarAnalysis> | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const detailCacheRef = useRef(new Map<string, CalendarDetailPayload>());
  const analysisCacheRef = useRef(
    new Map<string, AnalysisEnvelope<CalendarAnalysis>>(),
  );
  const drawerAbortRef = useRef<AbortController | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = (await response.json()) as CalendarFeedResponse;
      if (!response.ok) {
        throw new Error(json.error || `Calendar HTTP ${response.status}`);
      }
      setData(json);
      setError(json.warning ?? null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Calendar unavailable.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const poll = window.setInterval(
      () => void load(),
      data?.refreshIntervalMs ?? 60_000,
    );
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [load, data?.refreshIntervalMs]);

  const events = useMemo(() => {
    const today = dateKey(now);
    const tomorrow = addDay(today, 1);
    const [year, month, day] = today.split("-").map(Number);
    const noon = new Date(Date.UTC(year, month - 1, day, 12));
    const weekday = noon.getUTCDay();
    const monday = addDay(today, weekday === 0 ? -6 : 1 - weekday);
    const sunday = addDay(monday, 6);

    return (data?.events ?? []).filter((event) => {
      const focusOk =
        focus === "all" ||
        (focus === "high" && event.impact === "high") ||
        (focus === "usd" && event.currency === "USD") ||
        (focus === "gold" &&
          (event.relevance === "gold" ||
            (event.currency === "USD" && event.impact === "high"))) ||
        (focus === "macro" && isMacroEvent(event));

      const timestamp = Date.parse(event.timestamp);
      const key = Number.isFinite(timestamp) ? dateKey(timestamp) : "";
      const windowOk =
        windowFilter === "all" ||
        (windowFilter === "today" && key === today) ||
        (windowFilter === "tomorrow" && key === tomorrow) ||
        (windowFilter === "week" && key >= monday && key <= sunday);

      return focusOk && windowOk;
    });
  }, [data?.events, focus, windowFilter, now]);

  const upcoming = events.filter(
    (event) => eventStatus(event, now) === "upcoming",
  ).length;
  const live = events.filter((event) => eventStatus(event, now) === "live").length;

  const selectedFeedEvent = useMemo(
    () => data?.events.find((event) => event.id === selectedId) ?? null,
    [data?.events, selectedId],
  );

  const closeDrawer = useCallback(() => {
    if (!selectedId || closing) return;
    drawerAbortRef.current?.abort();
    analysisAbortRef.current?.abort();
    setClosing(true);
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setSelectedId(null);
      setDrawerLoading(false);
      setAnalyzing(false);
      setDrawerError(null);
      setAnalysisError(null);
      setClosing(false);
      closeTimerRef.current = null;
    }, 300);
  }, [closing, selectedId]);

  const openDrawer = useCallback((id: string) => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setClosing(false);
    setDetail(detailCacheRef.current.get(id) ?? null);
    setAnalysis(analysisCacheRef.current.get(id) ?? null);
    setDrawerError(null);
    setAnalysisError(null);
    setSelectedId(id);
  }, []);

  const runAnalysis = useCallback(async (id: string, force = false) => {
    analysisAbortRef.current?.abort();
    const controller = new AbortController();
    analysisAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);

    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch("/api/calendar/analyze", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, force }),
        signal: controller.signal,
      });
      const json = await readJson<AnalysisApiResponse>(response);
      const envelope = normalizeAnalysis(json);
      if (envelope) {
        analysisCacheRef.current.set(id, envelope);
        if (selectedId === id) setAnalysis(envelope);
        return;
      }
      throw new Error(analysisErrorMessage(response, json));
    } catch (analysisLoadError) {
      if (controller.signal.aborted) return;
      setAnalysisError(
        analysisLoadError instanceof Error
          ? analysisLoadError.message
          : "AI analysis unavailable.",
      );
    } finally {
      window.clearTimeout(timeout);
      if (!controller.signal.aborted) setAnalyzing(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;

    const id = selectedId;
    const cachedDetail = detailCacheRef.current.get(id);
    const cachedAnalysis = analysisCacheRef.current.get(id);

    setDetail(cachedDetail ?? null);
    setAnalysis(cachedAnalysis ?? null);
    setDrawerError(null);
    setAnalysisError(null);

    drawerAbortRef.current?.abort();
    const controller = new AbortController();
    drawerAbortRef.current = controller;

    if (cachedDetail) {
      setDrawerLoading(false);
      if (!cachedAnalysis) void runAnalysis(id, false);
      return () => controller.abort();
    }

    setDrawerLoading(true);
    const timeout = window.setTimeout(() => controller.abort(), DETAIL_TIMEOUT_MS);

    void (async () => {
      try {
        const response = await fetch(`/api/calendar/${encodeURIComponent(id)}`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const json = await readJson<CalendarDetailPayload & { error?: string }>(
          response,
        );
        if (!response.ok) {
          throw new Error(json.error || `Calendar detail HTTP ${response.status}`);
        }
        if (!json.event || json.event.id !== id) {
          throw new Error("Calendar detail response tidak cocok dengan event yang dipilih.");
        }
        if (
          !json.fundamental ||
          !json.fundamental.comparison ||
          !json.fundamental.pressure
        ) {
          throw new Error("Calendar detail tidak menyertakan fundamental context yang valid.");
        }
        const normalized: CalendarDetailPayload = {
          event: json.event,
          relatedNews: Array.isArray(json.relatedNews) ? json.relatedNews : [],
          fundamental: json.fundamental,
        };
        detailCacheRef.current.set(id, normalized);
        if (!controller.signal.aborted) setDetail(normalized);
        if (!analysisCacheRef.current.has(id)) void runAnalysis(id, false);
      } catch (detailLoadError) {
        if (controller.signal.aborted) return;
        setDrawerError(
          detailLoadError instanceof Error
            ? detailLoadError.message
            : "Calendar detail unavailable.",
        );
      } finally {
        window.clearTimeout(timeout);
        if (!controller.signal.aborted) setDrawerLoading(false);
      }
    })();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [selectedId, runAnalysis]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedId, closeDrawer]);

  const drawerEvent = detail?.event ?? selectedFeedEvent;
  const pressure = detail?.fundamental.pressure;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02060C] text-white">
      <DepthBackground />
      <style>{`
        @keyframes nxCalDrift { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(2vw,-1vh,0) scale(1.03); } }
        @keyframes nxCalDriftAlt { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-1.5vw,.8vh,0); } }
        @keyframes nxCalMarker { 0%,100% { opacity:.48; box-shadow:0 0 0 0 rgba(62,166,255,.10); } 50% { opacity:1; box-shadow:0 0 0 5px rgba(62,166,255,.025); } }
        @keyframes nxCalDrawerIn { from { transform: translate3d(100%,0,0); opacity:.72; } to { transform: translate3d(0,0,0); opacity:1; } }
        @keyframes nxCalSheetIn { from { transform: translate3d(0,6%,0); opacity:.76; } to { transform: translate3d(0,0,0); opacity:1; } }
        @keyframes nxCalFadeIn { from { opacity:0; } to { opacity:1; } }
        .nx-cal-orb { animation: nxCalDrift 20s ease-in-out infinite; }
        .nx-cal-orb-alt { animation: nxCalDriftAlt 26s ease-in-out infinite; }
        .nx-cal-marker { animation: nxCalMarker 2.8s ease-in-out infinite; }
        .nx-cal-drawer { animation: nxCalDrawerIn .34s cubic-bezier(.2,.75,.2,1) both; }
        .nx-cal-overlay { animation: nxCalFadeIn .28s ease both; }
        .nx-cal-drawer.nx-cal-closing { animation: nxCalDrawerOut .30s cubic-bezier(.4,0,.8,.25) both; }
        .nx-cal-overlay.nx-cal-closing { animation: nxCalFadeOut .30s ease both; }
        @keyframes nxCalDrawerOut { from { transform: translate3d(0,0,0); opacity:1; } to { transform: translate3d(100%,0,0); opacity:.65; } }
        @keyframes nxCalSheetOut { from { transform: translate3d(0,0,0); opacity:1; } to { transform: translate3d(0,7%,0); opacity:.65; } }
        @keyframes nxCalFadeOut { from { opacity:1; } to { opacity:0; } }
        @media (max-width: 767px) {
          .nx-cal-drawer { animation-name: nxCalSheetIn; }
          .nx-cal-drawer.nx-cal-closing { animation-name: nxCalSheetOut; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nx-cal-orb,.nx-cal-orb-alt,.nx-cal-marker,.nx-cal-drawer,.nx-cal-overlay { animation: none !important; }
        }
      `}</style>

      <main className="relative z-10 mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/[0.07] bg-[#07111F]/72 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8EA3BA] backdrop-blur-md transition hover:border-[#3EA6FF]/25 hover:text-white"
        >
          <ArrowLeft size={13} /> Back to Terminal
        </Link>

        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3EA6FF]">
              NOXVEIL · Economic Calendar
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Economic Calendar Intelligence
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8B98AA]">
              Macro event intelligence terminal untuk jadwal ekonomi, data aktual,
              dan fundamental context. News tetap menjadi sistem terpisah.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#07111F]/82 px-3 text-xs text-[#B9C3D1] backdrop-blur-md transition hover:border-[#3EA6FF]/25 hover:text-white"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-[#4EA4FF]/[0.13] bg-[linear-gradient(135deg,rgba(7,17,31,.87),rgba(3,9,18,.92))] p-4 shadow-[0_24px_80px_-48px_rgba(22,119,255,.4)] backdrop-blur-xl">
          <div className="flex flex-wrap gap-2">
            {(["all", "high", "usd", "gold", "macro"] as Focus[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFocus(value)}
                  className={`h-8 rounded-lg px-3 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
                    focus === value
                      ? "border border-[#3EA6FF]/30 bg-[#1677FF]/90 text-white"
                      : "border border-white/[0.07] bg-[#02070E]/75 text-[#8797AA] hover:border-[#3EA6FF]/20"
                  }`}
                >
                  {value === "high" ? "high impact" : value}
                </button>
              ),
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {(["all", "today", "tomorrow", "week"] as WindowFilter[]).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWindowFilter(value)}
                  className={`h-8 rounded-lg px-3 text-[10px] font-semibold uppercase tracking-[0.1em] transition ${
                    windowFilter === value
                      ? "border border-[#315D82]/40 bg-[#0F2948] text-[#B9D9F6]"
                      : "border border-white/[0.07] bg-[#02070E]/75 text-[#718096] hover:border-[#3EA6FF]/15"
                  }`}
                >
                  {value === "all"
                    ? "all dates"
                    : value === "week"
                      ? "this week"
                      : value}
                </button>
              ),
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#637285]">
            <span>{data?.provider ?? "calendar provider"}</span>
            <span>· Browser refresh {Math.round((data?.refreshIntervalMs ?? 60_000) / 1_000)}s</span>
            <span>· Upstream refresh ≤{data?.upstreamRefreshSeconds ?? 45}s</span>
            <span>· {upcoming} upcoming</span>
            <span>· {live} live window</span>
            {data?.stale ? <span>· STALE CACHE</span> : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-400/15 bg-red-500/[0.035] p-3 text-xs text-red-100/75">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        ) : null}

        {loading && !data ? (
          <div className="mt-5 space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.035]"
              />
            ))}
          </div>
        ) : events.length ? (
          <div className="relative mt-5 pl-5">
            <div className="absolute bottom-4 left-[5px] top-4 w-px bg-gradient-to-b from-[#3EA6FF]/25 via-[#244968]/30 to-transparent" />
            <div className="space-y-2">
              {events.map((event) => {
                const status = eventStatus(event, now);
                const remaining = countdown(event, now);
                const impact = impactClasses(event.impact);
                return (
                  <div key={event.id} className="relative">
                    <span
                      className={`absolute -left-[19px] top-6 z-10 h-[9px] w-[9px] rounded-full border ${impact.dot} ${
                        status === "upcoming" || status === "live" ? "nx-cal-marker" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => openDrawer(event.id)}
                      className={`group grid w-full gap-3 rounded-xl border border-l-2 border-white/[0.07] bg-[linear-gradient(105deg,rgba(8,20,36,.92),rgba(3,9,18,.98))] p-3 text-left shadow-[0_20px_60px_-50px_rgba(22,119,255,.45)] transition duration-300 hover:-translate-y-[1px] hover:border-[#3EA6FF]/24 sm:grid-cols-[110px_minmax(0,1fr)] lg:grid-cols-[110px_minmax(0,1fr)_240px_150px] lg:items-center ${impact.row}`}
                    >
                      <div>
                        <div className="font-mono text-base font-semibold text-[#E4EBF2]">
                          {timeWib(event)}{" "}
                          {exactTime(event) ? (
                            <span className="text-[9px] text-[#637285]">WIB</span>
                          ) : null}
                        </div>
                        <div className="text-[9px] uppercase tracking-[0.08em] text-[#637285]">
                          {dayWib(event.timestamp)}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="rounded-md border border-[#1677FF]/16 bg-[#1677FF]/[0.07] px-2 py-0.5 text-[9px] text-[#A9D4FF]">
                            {event.currency}
                          </span>
                          <span className={`rounded-md border px-2 py-0.5 text-[8px] uppercase ${impact.badge}`}>
                            {event.impact}
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md border border-[#1677FF]/20 bg-[#07182A]/50 px-2 py-0.5 text-[8px] uppercase tracking-[0.1em] text-[#75BDFF]">
                            {status}
                          </span>
                          {remaining ? (
                            <span className="font-mono text-[9px] text-[#8EA3BA]">
                              {remaining}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-2 truncate text-sm font-semibold text-[#EDF2F7] transition group-hover:text-white">
                          {event.event}
                        </h2>
                        <div className="mt-1 text-[9px] text-[#637285]">
                          {event.country ?? "—"} · {event.category}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          ["Previous", event.previous ?? "—"],
                          ["Forecast", event.forecast ?? "—"],
                          ["Actual", event.actual ?? "—"],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-lg border border-white/[0.055] bg-[#02070E]/75 p-2"
                          >
                            <div className="text-[8px] uppercase tracking-[0.08em] text-[#536275]">
                              {label}
                            </div>
                            <div className={`mt-1 truncate font-mono text-[11px] font-semibold ${
                              label === "Actual" && value !== "—"
                                ? "text-[#BBD9FF]"
                                : "text-[#C4CFDC]"
                            }`}>
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-lg border border-white/[0.055] bg-[#02070E]/55 px-3 py-2">
                        <div className="text-[8px] uppercase tracking-[0.1em] text-[#536275]">
                          Intelligence
                        </div>
                        <div className="mt-1 truncate text-[10px] text-[#91A2B5]">
                          {event.relevance} · {event.category}
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/[0.09] bg-[#050B14]/85 p-14 text-center backdrop-blur-md">
            <CalendarDays className="mx-auto text-[#3EA6FF]" />
            <div className="mt-3 text-sm font-semibold">CALENDAR DATA UNAVAILABLE</div>
            <p className="mt-2 text-xs text-[#718096]">
              Tidak ada event valid untuk filter saat ini.
            </p>
          </div>
        )}
      </main>

      {selectedId ? (
        <div className={`nx-cal-overlay fixed inset-0 z-[80] ${closing ? "nx-cal-closing" : ""}`}>
          <button
            type="button"
            aria-label="Tutup Event Intelligence"
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Event Intelligence"
            className={`nx-cal-drawer ${closing ? "nx-cal-closing" : ""} absolute bottom-0 right-0 top-auto flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-[#4EA4FF]/[0.16] bg-[linear-gradient(160deg,rgba(5,13,24,.995),rgba(2,7,14,.995))] shadow-[-30px_0_100px_-35px_rgba(0,0,0,.95)] md:top-0 md:h-full md:w-[42vw] md:min-w-[520px] md:max-w-[720px] md:rounded-none md:rounded-l-[24px]`}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#07111F]/88 px-4 backdrop-blur-xl md:px-5">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3EA6FF]">
                  NOXVEIL · Macro Event Intelligence
                </div>
                <div className="mt-0.5 text-xs text-[#7F8FA3]">Event Intelligence</div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-black/20 text-[#AAB6C5] transition hover:border-[#3EA6FF]/25 hover:text-white"
                aria-label="Close"
              >
                <X size={17} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 [scrollbar-width:thin] md:p-5">
              {drawerEvent ? (
                <div className="space-y-5">
                  <section>
                    <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-[#637285]">
                      <span>{drawerEvent.country ?? drawerEvent.currency}</span>
                      <span>·</span>
                      <span>{wib(drawerEvent.timestamp)} WIB</span>
                      <span className="rounded-md border border-[#1677FF]/18 bg-[#1677FF]/[0.06] px-2 py-0.5 text-[#75BDFF]">
                        {drawerEvent.status}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold leading-8 tracking-tight text-white md:text-2xl">
                      {drawerEvent.event}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] text-[#AAB7C6]">
                        {drawerEvent.currency}
                      </span>
                      <span className={`rounded-lg border px-2.5 py-1 text-[10px] uppercase ${impactClasses(drawerEvent.impact).badge}`}>
                        {drawerEvent.impact} impact
                      </span>
                      <span className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] text-[#AAB7C6]">
                        {drawerEvent.category}
                      </span>
                    </div>
                  </section>

                  <section className="grid grid-cols-3 gap-2">
                    {[
                      ["Previous", drawerEvent.previous ?? "—"],
                      ["Forecast", drawerEvent.forecast ?? "—"],
                      ["Actual", drawerEvent.actual ?? "—"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/[0.07] bg-[#02070E]/72 p-3"
                      >
                        <div className="text-[8px] uppercase tracking-[0.1em] text-[#536275]">
                          {label}
                        </div>
                        <div className={`mt-1 font-mono text-base font-semibold ${
                          label === "Actual" && value !== "—"
                            ? "text-[#BBD9FF]"
                            : "text-[#E0E7EF]"
                        }`}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </section>

                  {drawerLoading && !detail ? (
                    <section className="space-y-3 rounded-2xl border border-[#3EA6FF]/10 bg-[#07111F]/55 p-4">
                      <div className="h-3 w-36 animate-pulse rounded bg-white/[0.06]" />
                      <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
                      <div className="text-[9px] uppercase tracking-[0.14em] text-[#536275]">
                        LOADING EVENT CONTEXT...
                      </div>
                    </section>
                  ) : null}

                  {drawerError ? (
                    <section className="rounded-2xl border border-red-400/15 bg-red-500/[0.035] p-4 text-xs leading-5 text-red-100/75">
                      {drawerError}
                    </section>
                  ) : null}

                  {detail?.fundamental ? (
                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#637285]">
                        Fundamental Engine
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#B7C3D1]">
                        {detail.fundamental.comparison.text}
                      </p>
                      {pressure ? (
                        <>
                          <div className="mt-4 flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.1em] text-[#637285]">
                            <span>Gold fundamental pressure</span>
                            <span className="font-mono text-[#A9D4FF]">
                              {pressure.score > 0 ? "+" : ""}{pressure.score} · {pressure.label}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                            <div
                              className="h-full rounded-full bg-[#3EA6FF]/65"
                              style={{ width: pressureWidth(pressure.score) }}
                            />
                          </div>
                          {pressure.factors.length ? (
                            <div className="mt-3 space-y-2">
                              {pressure.factors.map((factor, index) => (
                                <div key={`${factor.factor}-${index}`} className="text-xs leading-5 text-[#8797AA]">
                                  <span className="font-medium text-[#C6D1DD]">{factor.factor}:</span>{" "}
                                  {factor.explanation}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </section>
                  ) : null}

                  <section className="rounded-2xl border border-[#3EA6FF]/[0.13] bg-[linear-gradient(145deg,rgba(7,20,36,.78),rgba(3,9,18,.9))] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#3EA6FF]">
                          AI Fundamental Analysis
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">
                          Gold impact & market context
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectedId && void runAnalysis(selectedId, true)}
                        disabled={analyzing}
                        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[9px] uppercase tracking-[0.1em] text-[#8EA3BA] transition hover:border-[#3EA6FF]/20 hover:text-white disabled:opacity-50"
                      >
                        <RefreshCw size={11} className={analyzing ? "animate-spin" : ""} />
                        Update
                      </button>
                    </div>

                    {analyzing && !analysis ? (
                      <div className="mt-4 space-y-3">
                        <div className="h-3 w-44 animate-pulse rounded bg-white/[0.06]" />
                        <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
                        <div className="text-[9px] uppercase tracking-[0.14em] text-[#536275]">
                          ANALYZING FUNDAMENTAL DATA...
                        </div>
                      </div>
                    ) : analysis ? (
                      <div className="mt-4 space-y-5">
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">AI Ringkasan</div>
                          <p className="mt-2 text-sm leading-6 text-[#D0D9E4]">{analysis.analysis.summary}</p>
                        </div>
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">Apa artinya?</div>
                          <p className="mt-2 text-sm leading-6 text-[#C2CCD8]">{analysis.analysis.whatItMeans}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-white/[0.07] bg-[#02070E]/70 p-3">
                            <div className="text-[9px] uppercase tracking-[0.13em] text-[#637285]">Gold Relevance</div>
                            <div className="mt-1 text-sm font-semibold uppercase text-[#BBD9FF]">{analysis.analysis.goldRelevance}</div>
                          </div>
                          <div className={`rounded-xl border p-3 ${biasClass(analysis.analysis.goldBias.direction)}`}>
                            <div className="text-[9px] uppercase tracking-[0.13em] opacity-65">Gold Bias</div>
                            <div className="mt-1 text-lg font-semibold uppercase">{analysis.analysis.goldBias.direction}</div>
                            <div className="mt-1 text-[9px] uppercase tracking-[0.1em] opacity-75">Confidence: {analysis.analysis.goldBias.confidence}</div>
                          </div>
                        </div>

                        <p className="text-xs leading-5 text-[#AAB7C6]">{analysis.analysis.goldBias.explanation}</p>

                        <div>
                          <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">Key Points</div>
                          <ul className="mt-2 space-y-2 text-xs leading-5 text-[#AAB7C6]">
                            {analysis.analysis.keyPoints.map((point, index) => (
                              <li key={`${point}-${index}`} className="flex gap-2">
                                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#3EA6FF]" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {analysis.analysis.fundamentalFactors.length ? (
                          <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">Fundamental Drivers</div>
                            <div className="mt-2 grid gap-2">
                              {analysis.analysis.fundamentalFactors.map((factor, index) => (
                                <div key={`${factor.factor}-${index}`} className="rounded-xl border border-white/[0.06] bg-[#02070E]/65 p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold text-[#D6E0EA]">{factor.factor}</span>
                                    <span className="text-[8px] uppercase tracking-[0.11em] text-[#75BDFF]">{factor.impact}</span>
                                  </div>
                                  <p className="mt-2 text-xs leading-5 text-[#8797AA]">{factor.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {analysis.analysis.marketContext.length ? (
                          <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">Market Context</div>
                            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#8797AA]">
                              {analysis.analysis.marketContext.map((context, index) => (
                                <li key={`${context}-${index}`}>• {context}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {analysis.analysis.expectedScenarios.length ? (
                          <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">Expected Scenarios</div>
                            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#8797AA]">
                              {analysis.analysis.expectedScenarios.map((scenario, index) => (
                                <li key={`${scenario}-${index}`}>• {scenario}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {analysis.analysis.risks.length ? (
                          <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">Risks / Limitations</div>
                            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-[#8797AA]">
                              {analysis.analysis.risks.map((risk, index) => (
                                <li key={`${risk}-${index}`}>• {risk}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        <div className="text-[9px] text-[#536275]">
                          {analysis.cached ? "Cached" : "Generated"} · {analysis.model} · {wib(analysis.generatedAt)} WIB
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-white/[0.08] bg-[#02070E]/60 p-4 text-xs leading-5 text-[#8797AA]">
                        AI ANALYSIS TEMPORARILY UNAVAILABLE. Data ekonomi tetap tersedia.
                      </div>
                    )}

                    {analysisError ? (
                      <div className="mt-3 text-[11px] leading-5 text-red-100/65">{analysisError}</div>
                    ) : null}
                  </section>

                  {detail?.relatedNews.length ? (
                    <section>
                      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#637285]">Related News</div>
                      <div className="mt-2 space-y-2">
                        {detail.relatedNews.map((news) => (
                          <Link
                            key={news.id}
                            href={`/news/${encodeURIComponent(news.id)}`}
                            className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-[#3EA6FF]/20"
                          >
                            <div className="text-[9px] uppercase text-[#637285]">{news.source} · {wib(news.publishedAt)} WIB</div>
                            <div className="mt-1 text-xs font-medium leading-5 text-[#C4CFDC]">{news.headline}</div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  <section className="border-t border-white/[0.07] pt-4">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#637285]">Event Source</div>
                    <div className="mt-2 text-sm font-medium text-[#D5DEE8]">{drawerEvent.source}</div>
                    {drawerEvent.sourceUrl ? (
                      <a
                        href={drawerEvent.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-[#3EA6FF]/20 bg-[#1677FF]/[0.08] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8CC7FF] transition hover:bg-[#1677FF]/15 hover:text-white"
                      >
                        Buka Sumber Asli <ExternalLink size={12} />
                      </a>
                    ) : (
                      <div className="mt-2 text-xs text-[#637285]">Source URL tidak tersedia.</div>
                    )}
                  </section>
                </div>
              ) : (
                <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#718096]">
                  Loading event intelligence...
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
