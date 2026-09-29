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
  ExternalLink,
  Newspaper,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import type {
  AnalysisEnvelope,
  EconomicEvent,
  NewsAnalysis,
  NewsFeedResponse,
  NewsItem,
} from "@/types/intelligence";
import IntelligenceVisual from "./IntelligenceVisual";

type Filter = "all" | "gold" | "usd" | "macro";

type NewsDetailPayload = {
  item: NewsItem;
  relatedEvents: EconomicEvent[];
  relatedNews: Array<Omit<NewsItem, "content">>;
};

type AnalysisApiResponse = Partial<AnalysisEnvelope<NewsAnalysis>> & {
  error?: string;
  cooldownRemainingSeconds?: number;
  retryAfterSeconds?: number;
};

const DETAIL_TIMEOUT_MS = 20_000;
const ANALYZE_TIMEOUT_MS = 90_000;

function wib(iso: string) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ms));
}

function isValidNewsAnalysis(value: unknown): value is NewsAnalysis {
  if (!value || typeof value !== "object") return false;
  const analysis = value as Partial<NewsAnalysis>;
  return (
    typeof analysis.summary === "string" &&
    Array.isArray(analysis.keyPoints) &&
    typeof analysis.goldRelevance === "string" &&
    Boolean(analysis.goldBias) &&
    typeof analysis.goldBias?.direction === "string" &&
    typeof analysis.goldBias?.confidence === "string" &&
    typeof analysis.goldBias?.explanation === "string" &&
    Array.isArray(analysis.fundamentalFactors) &&
    Array.isArray(analysis.affectedMarkets) &&
    Array.isArray(analysis.risks)
  );
}

function normalizeAnalysis(
  json: AnalysisApiResponse,
): AnalysisEnvelope<NewsAnalysis> | null {
  if (!isValidNewsAnalysis(json.analysis)) return null;
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

function biasClass(direction: NewsAnalysis["goldBias"]["direction"]) {
  if (direction === "bullish") {
    return "border-[#3EA6FF]/25 bg-[#0B3152]/35 text-[#C8E6FF]";
  }
  if (direction === "bearish") {
    return "border-red-400/20 bg-red-500/[0.045] text-red-100";
  }
  return "border-white/[0.09] bg-white/[0.035] text-[#D6E2EE]";
}

function DepthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#02060C]" />
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,170,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(99,170,255,.8) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "linear-gradient(to bottom,black,transparent 92%)",
        }}
      />
      <div className="nx-news-orb absolute -left-[12vw] top-[12vh] h-[42vw] w-[42vw] rounded-full bg-[#0B4C88]/16 blur-[110px]" />
      <div className="nx-news-orb-alt absolute right-[-8vw] top-[34vh] h-[34vw] w-[34vw] rounded-full bg-[#1677FF]/10 blur-[120px]" />
      <div className="nx-news-structure absolute left-[9%] top-[19%] h-px w-[58%] rotate-[-8deg] bg-gradient-to-r from-transparent via-[#3EA6FF]/15 to-transparent" />
      <div className="nx-news-structure-alt absolute bottom-[18%] right-[8%] h-px w-[48%] rotate-[11deg] bg-gradient-to-r from-transparent via-[#75BDFF]/10 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,.46)_100%)]" />
    </div>
  );
}

export default function NewsListClient() {
  const [data, setData] = useState<NewsFeedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<NewsDetailPayload | null>(null);
  const [analysis, setAnalysis] =
    useState<AnalysisEnvelope<NewsAnalysis> | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const detailCacheRef = useRef(new Map<string, NewsDetailPayload>());
  const analysisCacheRef = useRef(
    new Map<string, AnalysisEnvelope<NewsAnalysis>>(),
  );
  const drawerAbortRef = useRef<AbortController | null>(null);
  const analysisAbortRef = useRef<AbortController | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/news", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const json = (await res.json()) as NewsFeedResponse & { error?: string };
      if (!res.ok) throw new Error(json.error || `News HTTP ${res.status}`);
      setData(json);
      setError(json.warning ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "News unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(
      () => void load(),
      data?.refreshIntervalMs ?? 90_000,
    );
    return () => window.clearInterval(timer);
  }, [load, data?.refreshIntervalMs]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.items ?? []).filter((item) => {
      const filterOk =
        filter === "all" ||
        item.relevance === filter ||
        (filter === "macro" && item.relevance === "general");
      const queryOk =
        !q ||
        `${item.headline} ${item.summary ?? ""} ${item.source}`
          .toLowerCase()
          .includes(q);
      return filterOk && queryOk;
    });
  }, [data?.items, filter, query]);

  const selectedFeedItem = useMemo(
    () => data?.items.find((item) => item.id === selectedId) ?? null,
    [data?.items, selectedId],
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
    const cachedDetail = detailCacheRef.current.get(id) ?? null;
    const cachedAnalysis = analysisCacheRef.current.get(id) ?? null;
    setDetail(cachedDetail);
    setAnalysis(cachedAnalysis);
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
      const response = await fetch("/api/news/analyze", {
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
        const response = await fetch(`/api/news/${encodeURIComponent(id)}`, {
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const json = await readJson<NewsDetailPayload & { error?: string }>(response);
        if (!response.ok) {
          throw new Error(json.error || `News detail HTTP ${response.status}`);
        }
        if (!json.item || json.item.id !== id) {
          throw new Error("News detail response tidak cocok dengan artikel yang dipilih.");
        }
        const normalized: NewsDetailPayload = {
          item: json.item,
          relatedEvents: Array.isArray(json.relatedEvents) ? json.relatedEvents : [],
          relatedNews: Array.isArray(json.relatedNews) ? json.relatedNews : [],
        };
        detailCacheRef.current.set(id, normalized);
        if (!controller.signal.aborted) setDetail(normalized);
        if (!analysisCacheRef.current.has(id)) void runAnalysis(id, false);
      } catch (detailLoadError) {
        if (controller.signal.aborted) return;
        setDrawerError(
          detailLoadError instanceof Error
            ? detailLoadError.message
            : "News detail unavailable.",
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

  const drawerItem = detail?.item ?? selectedFeedItem;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#02060C] text-white">
      <DepthBackground />
      <style>{`
        @keyframes nxNewsDrift { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(3vw,-1.5vh,0) scale(1.04); } }
        @keyframes nxNewsDriftAlt { 0%,100% { transform: translate3d(0,0,0); } 50% { transform: translate3d(-2vw,1vh,0); } }
        @keyframes nxNewsLine { 0%,100% { opacity:.25; transform: translate3d(0,0,0) rotate(-8deg); } 50% { opacity:.5; transform: translate3d(1.5vw,-.5vh,0) rotate(-8deg); } }
        .nx-news-orb { animation: nxNewsDrift 18s ease-in-out infinite; }
        .nx-news-orb-alt { animation: nxNewsDriftAlt 24s ease-in-out infinite; }
        .nx-news-structure { animation: nxNewsLine 16s ease-in-out infinite; }
        .nx-news-structure-alt { animation: nxNewsDriftAlt 20s ease-in-out infinite; }
        .nx-news-drawer { animation: nxNewsDrawerIn .34s cubic-bezier(.2,.75,.2,1) both; }
        .nx-news-overlay { animation: nxNewsFadeIn .28s ease both; }
        .nx-news-drawer.nx-news-closing { animation: nxNewsDrawerOut .30s cubic-bezier(.4,0,.8,.25) both; }
        .nx-news-overlay.nx-news-closing { animation: nxNewsFadeOut .30s ease both; }
        @keyframes nxNewsDrawerIn { from { transform: translate3d(100%,0,0); opacity:.72; } to { transform: translate3d(0,0,0); opacity:1; } }
        @keyframes nxNewsDrawerOut { from { transform: translate3d(0,0,0); opacity:1; } to { transform: translate3d(100%,0,0); opacity:.65; } }
        @keyframes nxNewsSheetIn { from { transform: translate3d(0,6%,0); opacity:.76; } to { transform: translate3d(0,0,0); opacity:1; } }
        @keyframes nxNewsSheetOut { from { transform: translate3d(0,0,0); opacity:1; } to { transform: translate3d(0,7%,0); opacity:.65; } }
        @keyframes nxNewsFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes nxNewsFadeOut { from { opacity:1; } to { opacity:0; } }
        @media (max-width: 767px) {
          .nx-news-drawer { animation-name: nxNewsSheetIn; }
          .nx-news-drawer.nx-news-closing { animation-name: nxNewsSheetOut; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nx-news-orb,.nx-news-orb-alt,.nx-news-structure,.nx-news-structure-alt,.nx-news-drawer,.nx-news-overlay { animation: none !important; }
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
              NOXVEIL · News Intelligence
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
              Market News
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8B98AA]">
              Institutional market intelligence layer untuk membaca berita, konteks,
              dan relevansinya terhadap Gold tanpa meninggalkan terminal NOXVEIL.
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

        <div className="mt-5 rounded-2xl border border-[#4EA4FF]/[0.13] bg-[linear-gradient(135deg,rgba(7,17,31,.86),rgba(3,9,18,.9))] p-4 shadow-[0_24px_80px_-48px_rgba(22,119,255,.4)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#637285]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari headline, source, macro…"
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#02070E]/90 pl-9 pr-3 text-sm text-white outline-none placeholder:text-[#536275] focus:border-[#1677FF]/45"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "gold", "usd", "macro"] as Filter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`h-9 rounded-lg px-3 text-[10px] font-semibold uppercase tracking-[0.11em] transition ${
                    filter === value
                      ? "border border-[#3EA6FF]/30 bg-[#1677FF]/90 text-white shadow-[0_0_24px_-12px_rgba(62,166,255,.85)]"
                      : "border border-white/[0.07] bg-[#02070E]/75 text-[#8B98AA] hover:border-[#3EA6FF]/20 hover:text-[#C4CFDC]"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-[#637285]">
            <span>{data?.provider ?? "news provider"}</span>
            <span>·</span>
            <span>{data?.stale ? "STALE CACHE" : "LIVE SOURCE"}</span>
            {data?.fetchedAt ? (
              <>
                <span>·</span>
                <span>Updated {wib(data.fetchedAt)} WIB</span>
              </>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/15 bg-red-500/[0.035] px-4 py-3 text-xs leading-5 text-red-100/75">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {error}
          </div>
        ) : null}

        {loading && !data ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.035]"
              />
            ))}
          </div>
        ) : items.length ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item: NewsItem) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openDrawer(item.id)}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(8,20,36,.92),rgba(3,9,18,.98))] text-left shadow-[0_28px_70px_-50px_rgba(22,119,255,.5)] transition duration-300 hover:-translate-y-1 hover:border-[#3EA6FF]/25 hover:shadow-[0_30px_90px_-48px_rgba(22,119,255,.55)]"
              >
                <div className="relative aspect-[16/7] overflow-hidden border-b border-white/[0.06] bg-[#07111F]">
                  <div className="absolute inset-0">
                    <IntelligenceVisual category={item.category} label={item.imageQuery} />
                  </div>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 z-10 h-full w-full scale-[1.01] object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                      style={{
                        filter:
                          "grayscale(.22) saturate(.45) brightness(.62) contrast(1.12)",
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="absolute inset-0 z-20 bg-[#061525]/25 mix-blend-color" />
                  <div className="absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(2,6,12,.08),rgba(2,6,12,.18)_42%,rgba(2,6,12,.96)_100%)]" />
                  <div className="absolute left-3 top-3 z-30 rounded-md border border-white/[0.09] bg-black/35 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#C8D6E5] backdrop-blur-md">
                    {item.category}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-[#637285]">
                    <span>{item.source}</span>
                    <span>·</span>
                    <span>{wib(item.publishedAt)}</span>
                    <span className="ml-auto rounded-md border border-[#1677FF]/15 bg-[#1677FF]/[0.07] px-2 py-0.5 text-[#75BDFF]">
                      {item.relevance}
                    </span>
                  </div>
                  <h2 className="mt-2 text-[15px] font-semibold leading-6 text-[#F1F5F9] transition group-hover:text-white">
                    {item.headline}
                  </h2>
                  {item.summary ? (
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-[#93A2B5]">
                      {item.summary}
                    </p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.13em] text-[#4EA4FF]">
                    <span>Open Intelligence Layer</span>
                    <span>→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-white/[0.09] bg-[#050B14]/85 px-6 py-16 text-center backdrop-blur-md">
            <Newspaper className="mx-auto text-[#3EA6FF]" />
            <div className="mt-3 text-sm font-semibold">NEWS DATA UNAVAILABLE</div>
            <p className="mt-2 text-xs text-[#718096]">
              Tidak ada berita valid untuk filter saat ini.
            </p>
          </div>
        )}
      </main>

      {selectedId ? (
        <div className={`nx-news-overlay fixed inset-0 z-[80] ${closing ? "nx-news-closing" : ""}`}>
          <button
            type="button"
            aria-label="Tutup News Intelligence"
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="News Intelligence"
            className={`nx-news-drawer ${closing ? "nx-news-closing" : ""} absolute bottom-0 right-0 top-auto flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-[24px] border border-[#4EA4FF]/[0.16] bg-[linear-gradient(160deg,rgba(5,13,24,.995),rgba(2,7,14,.995))] shadow-[-30px_0_100px_-35px_rgba(0,0,0,.95)] md:top-0 md:h-full md:w-[42vw] md:min-w-[520px] md:max-w-[720px] md:rounded-none md:rounded-l-[24px]`}
          >
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#07111F]/88 px-4 backdrop-blur-xl md:px-5">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#3EA6FF]">
                  NOXVEIL · Private Market Intelligence
                </div>
                <div className="mt-0.5 text-xs text-[#7F8FA3]">News Intelligence</div>
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

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              {drawerItem ? (
                <>
                  <div className="relative aspect-[16/7] max-h-[240px] min-h-[170px] overflow-hidden border-b border-white/[0.06] bg-[#07111F]">
                    <div className="absolute inset-0">
                      <IntelligenceVisual
                        category={drawerItem.category}
                        label={drawerItem.imageQuery}
                      />
                    </div>
                    {drawerItem.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={drawerItem.imageUrl}
                        alt=""
                        className="absolute inset-0 z-10 h-full w-full object-cover"
                        style={{
                          filter:
                            "grayscale(.22) saturate(.42) brightness(.58) contrast(1.14)",
                        }}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                    <div className="absolute inset-0 z-20 bg-[#061525]/28 mix-blend-color" />
                    <div className="absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(2,6,12,.12),rgba(2,6,12,.18)_38%,rgba(2,6,12,.96)_100%)]" />
                    <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-[#B3C1D1]">
                      <span className="rounded-md border border-white/[0.1] bg-black/35 px-2 py-1 backdrop-blur-md">
                        {drawerItem.category}
                      </span>
                      <span className="rounded-md border border-[#1677FF]/20 bg-[#07182A]/65 px-2 py-1 text-[#75BDFF] backdrop-blur-md">
                        {drawerItem.relevance}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-5 p-4 md:p-5">
                    <section>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[0.13em] text-[#637285]">
                        <span>{drawerItem.source}</span>
                        <span>·</span>
                        <span>{wib(drawerItem.publishedAt)} WIB</span>
                      </div>
                      <h2 className="mt-3 text-xl font-semibold leading-8 tracking-tight text-white md:text-2xl">
                        {drawerItem.headline}
                      </h2>
                    </section>

                    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                      <div className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#637285]">
                        Source Summary
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[#B7C3D1]">
                        {drawerItem.summary || drawerItem.content || "Ringkasan sumber tidak tersedia."}
                      </p>
                    </section>

                    {drawerLoading && !detail ? (
                      <section className="space-y-3 rounded-2xl border border-[#3EA6FF]/10 bg-[#07111F]/55 p-4">
                        <div className="h-3 w-36 animate-pulse rounded bg-white/[0.06]" />
                        <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
                        <div className="text-[9px] uppercase tracking-[0.14em] text-[#536275]">
                          LOADING INTELLIGENCE CONTEXT...
                        </div>
                      </section>
                    ) : null}

                    {drawerError ? (
                      <section className="rounded-2xl border border-red-400/15 bg-red-500/[0.035] p-4 text-xs leading-5 text-red-100/75">
                        {drawerError}
                      </section>
                    ) : null}

                    <section className="rounded-2xl border border-[#3EA6FF]/[0.13] bg-[linear-gradient(145deg,rgba(7,20,36,.78),rgba(3,9,18,.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.025)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#3EA6FF]">
                            AI Analysis
                          </div>
                          <div className="mt-1 text-sm font-semibold text-white">
                            Fundamental context & Gold relevance
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
                            ANALYZING NEWS...
                          </div>
                        </div>
                      ) : analysis ? (
                        <div className="mt-4 space-y-5">
                          <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">
                              AI Ringkasan
                            </div>
                            <p className="mt-2 text-sm leading-6 text-[#D0D9E4]">
                              {analysis.analysis.summary}
                            </p>
                          </div>

                          <div>
                            <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">
                              Key Points
                            </div>
                            <ul className="mt-2 space-y-2 text-xs leading-5 text-[#AAB7C6]">
                              {analysis.analysis.keyPoints.map((point, index) => (
                                <li key={`${point}-${index}`} className="flex gap-2">
                                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#3EA6FF]" />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/[0.07] bg-[#02070E]/70 p-3">
                              <div className="text-[9px] uppercase tracking-[0.13em] text-[#637285]">
                                Gold Relevance
                              </div>
                              <div className="mt-1 text-sm font-semibold uppercase text-[#BBD9FF]">
                                {analysis.analysis.goldRelevance}
                              </div>
                            </div>
                            <div className={`rounded-xl border p-3 ${biasClass(analysis.analysis.goldBias.direction)}`}>
                              <div className="text-[9px] uppercase tracking-[0.13em] opacity-65">
                                Gold Bias
                              </div>
                              <div className="mt-1 text-lg font-semibold uppercase">
                                {analysis.analysis.goldBias.direction}
                              </div>
                              <div className="mt-1 text-[9px] uppercase tracking-[0.1em] opacity-75">
                                Confidence: {analysis.analysis.goldBias.confidence}
                              </div>
                            </div>
                          </div>

                          <p className="text-xs leading-5 text-[#AAB7C6]">
                            {analysis.analysis.goldBias.explanation}
                          </p>

                          {analysis.analysis.fundamentalFactors.length ? (
                            <div>
                              <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">
                                Fundamental Factors
                              </div>
                              <div className="mt-2 grid gap-2">
                                {analysis.analysis.fundamentalFactors.map((factor, index) => (
                                  <div
                                    key={`${factor.factor}-${index}`}
                                    className="rounded-xl border border-white/[0.06] bg-[#02070E]/65 p-3"
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <span className="text-xs font-semibold text-[#D6E0EA]">
                                        {factor.factor}
                                      </span>
                                      <span className="text-[8px] uppercase tracking-[0.11em] text-[#75BDFF]">
                                        {factor.impact}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-xs leading-5 text-[#8797AA]">
                                      {factor.explanation}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {analysis.analysis.affectedMarkets.length ? (
                            <div>
                              <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">
                                Affected Markets
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {analysis.analysis.affectedMarkets.map((market) => (
                                  <span
                                    key={market}
                                    className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] text-[#AAB7C6]"
                                  >
                                    {market}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {analysis.analysis.risks.length ? (
                            <div>
                              <div className="text-[9px] uppercase tracking-[0.14em] text-[#637285]">
                                Risks / Limitations
                              </div>
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
                          AI ANALYSIS TEMPORARILY UNAVAILABLE. Berita tetap dapat dibaca.
                        </div>
                      )}

                      {analysisError ? (
                        <div className="mt-3 text-[11px] leading-5 text-red-100/65">
                          {analysisError}
                        </div>
                      ) : null}
                    </section>

                    {detail?.relatedEvents.length ? (
                      <section>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#637285]">
                          Related Macro Events
                        </div>
                        <div className="mt-2 space-y-2">
                          {detail.relatedEvents.map((event) => (
                            <Link
                              key={event.id}
                              href={`/calendar/${encodeURIComponent(event.id)}`}
                              className="block rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition hover:border-[#3EA6FF]/20"
                            >
                              <div className="text-[9px] uppercase text-[#637285]">
                                {event.currency} · {event.impact} · {wib(event.timestamp)} WIB
                              </div>
                              <div className="mt-1 text-xs font-medium leading-5 text-[#C4CFDC]">
                                {event.event}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {detail?.relatedNews.length ? (
                      <section>
                        <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#637285]">
                          Related News
                        </div>
                        <div className="mt-2 space-y-2">
                          {detail.relatedNews.map((news) => (
                            <button
                              key={news.id}
                              type="button"
                              onClick={() => openDrawer(news.id)}
                              className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left transition hover:border-[#3EA6FF]/20"
                            >
                              <div className="text-[9px] uppercase text-[#637285]">
                                {news.source} · {wib(news.publishedAt)} WIB
                              </div>
                              <div className="mt-1 text-xs font-medium leading-5 text-[#C4CFDC]">
                                {news.headline}
                              </div>
                            </button>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <section className="border-t border-white/[0.07] pt-4">
                      <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#637285]">
                        Source
                      </div>
                      <div className="mt-2 text-sm font-medium text-[#D5DEE8]">
                        {drawerItem.source}
                      </div>
                      {drawerItem.url ? (
                        <a
                          href={drawerItem.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-[#3EA6FF]/20 bg-[#1677FF]/[0.08] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8CC7FF] transition hover:bg-[#1677FF]/15 hover:text-white"
                        >
                          Buka Sumber Asli <ExternalLink size={12} />
                        </a>
                      ) : (
                        <div className="mt-2 text-xs text-[#637285]">
                          Source URL tidak tersedia.
                        </div>
                      )}
                    </section>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-6 text-sm text-[#718096]">
                  Loading intelligence...
                </div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
