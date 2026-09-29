"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import type {
  AnalysisEnvelope,
  EconomicEvent,
  NewsAnalysis,
  NewsItem,
} from "@/types/intelligence";

import IntelligenceVisual from "./IntelligenceVisual";

type DetailPayload = {
  item: NewsItem;
  relatedEvents: EconomicEvent[];
  relatedNews: Array<Omit<NewsItem, "content">>;
};

type ApiResponse = Partial<AnalysisEnvelope<NewsAnalysis>> & {
  error?: string;
  cooldownRemainingSeconds?: number;
  retryAfterSeconds?: number;
};

type AnalyzeResult =
  | { ok: true; envelope: AnalysisEnvelope<NewsAnalysis> }
  | { ok: false; message: string; retryable: boolean };

const ANALYZE_TIMEOUT_MS = 90_000;
const DETAIL_TIMEOUT_MS = 20_000;
const TRANSIENT_HTTP = new Set([429, 500, 502, 503, 504]);

function wib(iso: string) {
  const ms = Date.parse(iso);

  return Number.isFinite(ms)
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(ms))
    : iso;
}

function biasClass(
  direction: NewsAnalysis["goldBias"]["direction"],
) {
  if (direction === "bullish") {
    return "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-200";
  }

  if (direction === "bearish") {
    return "border-red-400/20 bg-red-500/[0.06] text-red-200";
  }

  return "border-[#4EA4FF]/20 bg-[#1677FF]/[0.06] text-[#BBD9FF]";
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function parseRetryAfterMs(
  response: Response,
  json: ApiResponse,
): number {
  const fromBody =
    json.cooldownRemainingSeconds ??
    json.retryAfterSeconds;

  if (
    typeof fromBody === "number" &&
    Number.isFinite(fromBody) &&
    fromBody > 0
  ) {
    return Math.min(fromBody * 1000, 10_000);
  }

  const header = response.headers.get("Retry-After");

  if (header) {
    const seconds = Number(header);

    if (
      Number.isFinite(seconds) &&
      seconds >= 0
    ) {
      return Math.min(seconds * 1000, 10_000);
    }
  }

  return 1_500;
}

async function readJsonResponse<T>(
  response: Response,
): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `Server mengembalikan response kosong. HTTP ${response.status}.`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Server mengembalikan response bukan JSON. HTTP ${response.status}.`,
    );
  }
}

function isValidNewsAnalysis(
  value: unknown,
): value is NewsAnalysis {
  if (!value || typeof value !== "object") {
    return false;
  }

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

function normalizeEnvelope(
  json: ApiResponse,
): AnalysisEnvelope<NewsAnalysis> | null {
  if (!isValidNewsAnalysis(json.analysis)) {
    return null;
  }

  return {
    analysis: json.analysis,
    cached: Boolean(json.cached),
    generatedAt:
      json.generatedAt ||
      new Date().toISOString(),
    model:
      json.model ||
      "NOXVEIL AI",
    contentHash:
      json.contentHash ||
      "",
    cacheBackend:
      json.cacheBackend === "firestore"
        ? "firestore"
        : "memory",
  };
}

function humanizeAnalysisError(
  status: number,
  json: ApiResponse,
): string {
  if (json.error?.trim()) {
    return json.error.trim();
  }

  if (status === 429) {
    return "AI sedang cooldown. Analysis lama tetap dipertahankan dan bisa dicoba lagi setelah cooldown.";
  }

  if (status === 503) {
    return "AI provider sedang sibuk atau sementara tidak tersedia. Coba lagi beberapa saat.";
  }

  if (status === 504) {
    return "AI analysis timeout. Coba lagi beberapa saat.";
  }

  return `AI analysis gagal. HTTP ${status}.`;
}

export default function NewsDetailClient({
  id,
}: {
  id: string;
}) {
  const [detail, setDetail] =
    useState<DetailPayload | null>(null);

  const [analysis, setAnalysis] =
    useState<AnalysisEnvelope<NewsAnalysis> | null>(
      null,
    );

  const [loading, setLoading] =
    useState(true);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [detailError, setDetailError] =
    useState<string | null>(null);

  const [analysisError, setAnalysisError] =
    useState<string | null>(null);

  const detailAbortRef =
    useRef<AbortController | null>(null);

  const analyzeAbortRef =
    useRef<AbortController | null>(null);

  const analyzeRequestIdRef =
    useRef(0);

  const autoAnalyzedIdRef =
    useRef<string | null>(null);

  const requestAnalysis = useCallback(
    async (
      force: boolean,
      signal: AbortSignal,
      requestId: number,
    ): Promise<AnalyzeResult> => {
      const maxAttempts = force ? 1 : 2;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt += 1
      ) {
        try {
          const response = await fetch(
            "/api/news/analyze",
            {
              method: "POST",
              cache: "no-store",
              credentials: "same-origin",
              headers: {
                Accept: "application/json",
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                id,
                force,
              }),
              signal,
            },
          );

          const json =
            await readJsonResponse<ApiResponse>(
              response,
            );

          const envelope =
            normalizeEnvelope(json);

          /*
           * Backend boleh mengirim analysis bersama HTTP 429
           * ketika force-refresh masih cooldown.
           * Analysis tersebut valid dan harus tetap ditampilkan.
           */
          if (envelope) {
            return {
              ok: true,
              envelope,
            };
          }

          const retryable =
            TRANSIENT_HTTP.has(response.status);

          const message =
            humanizeAnalysisError(
              response.status,
              json,
            );

          if (
            !response.ok &&
            retryable &&
            attempt < maxAttempts &&
            analyzeRequestIdRef.current === requestId
          ) {
            await sleep(
              parseRetryAfterMs(
                response,
                json,
              ),
            );

            continue;
          }

          return {
            ok: false,
            message:
              response.ok
                ? "Server merespons tetapi payload analysis tidak valid."
                : message,
            retryable,
          };
        } catch (error) {
          if (signal.aborted) {
            return {
              ok: false,
              message:
                "AI request dibatalkan.",
              retryable: false,
            };
          }

          if (
            attempt < maxAttempts &&
            analyzeRequestIdRef.current === requestId
          ) {
            await sleep(1_500);
            continue;
          }

          return {
            ok: false,
            message:
              error instanceof Error
                ? error.message
                : "AI analysis gagal.",
            retryable: true,
          };
        }
      }

      return {
        ok: false,
        message:
          "AI analysis gagal setelah retry.",
        retryable: true,
      };
    },
    [id],
  );

  const analyze = useCallback(
    async (force = false) => {
      /*
       * Cancel request lama supaya response artikel sebelumnya
       * tidak menimpa state artikel yang sedang dibuka.
       */
      analyzeAbortRef.current?.abort();

      const controller =
        new AbortController();

      analyzeAbortRef.current =
        controller;

      const requestId =
        ++analyzeRequestIdRef.current;

      const timeout = window.setTimeout(
        () => {
          controller.abort();
        },
        ANALYZE_TIMEOUT_MS,
      );

      setAnalyzing(true);
      setAnalysisError(null);

      try {
        const result =
          await requestAnalysis(
            force,
            controller.signal,
            requestId,
          );

        if (
          requestId !==
          analyzeRequestIdRef.current
        ) {
          return;
        }

        if (result.ok) {
          setAnalysis(result.envelope);
          setAnalysisError(null);
          return;
        }

        /*
         * Jangan hapus analysis lama ketika refresh gagal.
         * User tetap bisa membaca analysis terakhir yang valid.
         */
        setAnalysisError(result.message);
      } finally {
        window.clearTimeout(timeout);

        if (
          requestId ===
          analyzeRequestIdRef.current
        ) {
          setAnalyzing(false);
        }
      }
    },
    [requestAnalysis],
  );

  /*
   * ============================================================
   * LOAD NEWS DETAIL
   * ============================================================
   */

  useEffect(() => {
    detailAbortRef.current?.abort();
    analyzeAbortRef.current?.abort();

    const controller =
      new AbortController();

    detailAbortRef.current =
      controller;

    const timeout = window.setTimeout(
      () => {
        controller.abort();
      },
      DETAIL_TIMEOUT_MS,
    );

    autoAnalyzedIdRef.current = null;

    setLoading(true);
    setDetail(null);
    setAnalysis(null);
    setDetailError(null);
    setAnalysisError(null);

    void (async () => {
      try {
        const response = await fetch(
          `/api/news/${encodeURIComponent(
            id,
          )}`,
          {
            cache: "no-store",
            credentials: "same-origin",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        const json =
          await readJsonResponse<
            DetailPayload & {
              error?: string;
            }
          >(response);

        if (!response.ok) {
          throw new Error(
            json.error ||
              `News HTTP ${response.status}`,
          );
        }

        if (
          !json.item ||
          json.item.id !== id
        ) {
          throw new Error(
            "News detail response tidak cocok dengan ID artikel yang dibuka.",
          );
        }

        setDetail({
          item: json.item,
          relatedEvents:
            Array.isArray(
              json.relatedEvents,
            )
              ? json.relatedEvents
              : [],
          relatedNews:
            Array.isArray(
              json.relatedNews,
            )
              ? json.relatedNews
              : [],
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDetailError(
          error instanceof Error
            ? error.message
            : "News detail gagal.",
        );
      } finally {
        window.clearTimeout(timeout);

        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [id]);

  /*
   * Auto-analysis hanya dijalankan setelah detail artikel valid.
   * force=false memastikan Firestore cache dicek lebih dulu.
   */
  useEffect(() => {
    if (!detail) return;

    if (detail.item.id !== id) {
      return;
    }

    if (
      autoAnalyzedIdRef.current === id
    ) {
      return;
    }

    autoAnalyzedIdRef.current = id;

    void analyze(false);
  }, [detail, id, analyze]);

  /*
   * Abort seluruh request ketika component benar-benar unmount.
   */
  useEffect(() => {
    return () => {
      detailAbortRef.current?.abort();
      analyzeAbortRef.current?.abort();
    };
  }, []);

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02060C] p-6">
        <div className="mx-auto h-[70vh] max-w-5xl animate-pulse rounded-3xl bg-white/[0.04]" />
      </div>
    );
  }

  /*
   * ============================================================
   * DETAIL ERROR
   * ============================================================
   */

  if (!detail) {
    return (
      <div className="min-h-screen bg-[#02060C] px-6 py-20 text-center text-white">
        <AlertCircle className="mx-auto text-red-300" />

        <div className="mt-4 font-semibold">
          NEWS DATA UNAVAILABLE
        </div>

        <p className="mt-2 text-sm text-[#8B98AA]">
          {detailError || "News detail tidak tersedia."}
        </p>

        <Link
          href="/news"
          className="mt-5 inline-flex text-sm text-[#3EA6FF]"
        >
          ← Kembali ke News
        </Link>
      </div>
    );
  }

  const { item } = detail;

  return (
    <div className="min-h-screen bg-[#02060C] text-white">
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8">

        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#75BDFF]"
        >
          <ArrowLeft size={14} />
          News Intelligence
        </Link>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

          <div className="space-y-5">

            {/* ==================================================
                NEWS
            ================================================== */}

            <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(10,25,44,.96),rgba(4,11,22,.99))]">

              <div className="p-5 md:p-7">

                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">

                  <span className="rounded-md bg-[#1677FF]/10 px-2 py-1 text-[#75BDFF]">
                    {item.relevance}
                  </span>

                  <span>
                    {item.source}
                  </span>

                  <span>·</span>

                  <span>
                    {wib(item.publishedAt)} WIB
                  </span>

                </div>

                <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
                  {item.headline}
                </h1>

                <div className="relative mt-5 overflow-hidden rounded-xl">

                  <IntelligenceVisual
                    category={item.category}
                    label={item.imageQuery}
                  />

                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="absolute inset-0 z-10 h-full w-full object-cover opacity-75"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : null}

                  {item.imageUrl ? (
                    <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#050B14]/90 via-transparent to-transparent" />
                  ) : null}

                </div>

                {item.summary ? (
                  <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#030912]/70 p-4">

                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
                      Ringkasan sumber
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#B9C3D1]">
                      {item.summary}
                    </p>

                  </div>
                ) : (
                  <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#030912]/70 p-4 text-xs text-[#718096]">
                    Sumber tidak menyediakan
                    ringkasan artikel melalui
                    feed. AI tidak akan
                    mengarang isi yang tidak
                    tersedia.
                  </div>
                )}

              </div>
            </section>

            {/* ==================================================
                AI
            ================================================== */}

            <section className="rounded-2xl border border-[#4EA4FF]/[0.12] bg-[#07111F] p-5 md:p-6">

              <div className="flex items-center justify-between gap-3">

                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3EA6FF]">
                    AI Analysis
                  </div>

                  <h2 className="mt-1 text-lg font-semibold">
                    Interpretasi Fundamental
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void analyze(true)
                  }
                  disabled={analyzing}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-xs text-[#B9C3D1] transition hover:border-[#3EA6FF]/30 disabled:opacity-50"
                >
                  <RefreshCw
                    size={13}
                    className={
                      analyzing
                        ? "animate-spin"
                        : ""
                    }
                  />

                  {analyzing
                    ? "Analyzing..."
                    : "Update Analysis"}
                </button>

              </div>

              {/* =================================================
                  ANALYZING
              ================================================= */}

              {analyzing && !analysis ? (
                <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#030912] p-5">

                  <div className="text-[10px] uppercase tracking-[0.14em] text-[#3EA6FF]">
                    ANALYZING NEWS...
                  </div>

                  <div className="mt-3 h-4 w-48 animate-pulse rounded bg-white/[0.05]" />

                  <div className="mt-2 h-16 animate-pulse rounded bg-white/[0.04]" />

                </div>
              ) : null}

              {/* =================================================
                  ANALYSIS RESULT
              ================================================= */}

              {analysis ? (
                <div className="mt-5 space-y-5">

                  <div>

                    <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                      AI Ringkasan
                    </div>

                    <p className="mt-2 text-sm leading-6 text-[#D4DCE7]">
                      {analysis.analysis.summary}
                    </p>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    <span className="rounded-lg border border-[#1677FF]/20 bg-[#1677FF]/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A9D4FF]">
                      Gold relevance:{" "}
                      {analysis.analysis.goldRelevance}
                    </span>

                    {analysis.analysis.affectedMarkets.map(
                      (market) => (
                        <span
                          key={market}
                          className="rounded-lg border border-white/[0.07] bg-[#030912] px-3 py-1.5 text-[10px] text-[#8EA3BA]"
                        >
                          {market}
                        </span>
                      ),
                    )}

                  </div>

                  <div>

                    <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                      Poin Utama
                    </div>

                    <ul className="mt-2 space-y-2 text-sm text-[#B9C3D1]">

                      {analysis.analysis.keyPoints.map(
                        (point, index) => (
                          <li
                            key={`${point}-${index}`}
                            className="flex gap-2"
                          >
                            <span className="text-[#3EA6FF]">
                              •
                            </span>

                            <span>
                              {point}
                            </span>
                          </li>
                        ),
                      )}

                    </ul>

                  </div>

                  <div
                    className={`rounded-xl border p-4 ${biasClass(
                      analysis.analysis.goldBias.direction,
                    )}`}
                  >

                    <div className="text-[10px] uppercase tracking-[0.14em] opacity-70">
                      Bias Utama Gold
                    </div>

                    <div className="mt-1 text-xl font-semibold uppercase">
                      {analysis.analysis.goldBias.direction}
                    </div>

                    <div className="mt-1 text-[10px] uppercase">
                      Confidence:{" "}
                      {analysis.analysis.goldBias.confidence}
                    </div>

                    <p className="mt-2 text-xs leading-5 opacity-90">
                      {analysis.analysis.goldBias.explanation}
                    </p>

                  </div>

                  <div className="grid gap-2 md:grid-cols-2">

                    {analysis.analysis.fundamentalFactors.map(
                      (factor, index) => (
                        <div
                          key={`${factor.factor}-${index}`}
                          className="rounded-xl border border-white/[0.06] bg-[#030912] p-3"
                        >

                          <div className="text-xs font-semibold text-white">
                            {factor.factor}
                          </div>

                          <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[#75BDFF]">
                            {factor.impact}
                          </div>

                          <p className="mt-2 text-xs leading-5 text-[#8B98AA]">
                            {factor.explanation}
                          </p>

                        </div>
                      ),
                    )}

                  </div>

                  {analysis.analysis.risks.length ? (
                    <div>

                      <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                        Risiko / Keterbatasan
                      </div>

                      <ul className="mt-2 space-y-1 text-xs leading-5 text-[#8B98AA]">

                        {analysis.analysis.risks.map(
                          (risk, index) => (
                            <li
                              key={`${risk}-${index}`}
                            >
                              • {risk}
                            </li>
                          ),
                        )}

                      </ul>

                    </div>
                  ) : null}

                  <div className="text-[9px] text-[#536275]">
                    {analysis.cached
                      ? "Cached"
                      : "Generated"}{" "}
                    · {analysis.model} ·{" "}
                    {wib(
                      analysis.generatedAt,
                    )}{" "}
                    WIB
                  </div>

                </div>
              ) : null}

              {/* =================================================
                  EMPTY
              ================================================= */}

              {!analysis &&
              !analyzing ? (
                <div className="mt-5 rounded-xl border border-dashed border-white/[0.09] bg-[#030912] p-5">

                  <div className="text-sm font-medium text-[#C7D2E0]">
                    AI ANALYSIS TEMPORARILY
                    UNAVAILABLE
                  </div>

                  <div className="mt-1 text-xs leading-5 text-[#718096]">
                    Berita tetap dapat
                    dibaca.
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void analyze(false)
                    }
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#1677FF]/20 bg-[#1677FF]/[0.06] px-3 py-2 text-xs text-[#75BDFF]"
                  >
                    <RefreshCw size={12} />
                    COBA LAGI
                  </button>

                </div>
              ) : null}

              {analysisError ? (
                <div className="mt-3 rounded-lg border border-amber-400/10 bg-amber-400/[0.03] px-3 py-2 text-xs text-amber-200/80">
                  {analysisError}
                </div>
              ) : null}

            </section>
          </div>

          {/* ====================================================
              SIDEBAR
          ==================================================== */}

          <aside className="space-y-4">

            <section className="rounded-2xl border border-white/[0.08] bg-[#07111F] p-4">

              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
                Source
              </div>

              <div className="mt-2 text-sm font-semibold">
                {item.source}
              </div>

              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs text-[#3EA6FF]"
                >
                  Buka sumber asli
                  <ExternalLink size={12} />
                </a>
              ) : null}

            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#07111F] p-4">

              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
                Related Economic Events
              </div>

              <div className="mt-3 space-y-2">

                {detail.relatedEvents.length ? (
                  detail.relatedEvents.map(
                    (event) => (
                      <Link
                        key={event.id}
                        href={`/calendar/${encodeURIComponent(
                          event.id,
                        )}`}
                        className="block rounded-xl border border-white/[0.06] bg-[#030912] p-3 hover:border-[#1677FF]/25"
                      >

                        <div className="text-[9px] uppercase text-[#75BDFF]">
                          {event.currency} ·{" "}
                          {event.impact}
                        </div>

                        <div className="mt-1 text-xs font-medium">
                          {event.event}
                        </div>

                      </Link>
                    ),
                  )
                ) : (
                  <div className="text-xs text-[#637285]">
                    Tidak ada event terkait
                    yang valid.
                  </div>
                )}

              </div>

            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#07111F] p-4">

              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
                Related News
              </div>

              <div className="mt-3 space-y-2">

                {detail.relatedNews.length ? (
                  detail.relatedNews.map(
                    (news) => (
                      <Link
                        key={news.id}
                        href={`/news/${encodeURIComponent(
                          news.id,
                        )}`}
                        className="block rounded-xl border border-white/[0.06] bg-[#030912] p-3 hover:border-[#1677FF]/25"
                      >

                        <div className="text-[9px] uppercase text-[#637285]">
                          {news.source}
                        </div>

                        <div className="mt-1 text-xs leading-5">
                          {news.headline}
                        </div>

                      </Link>
                    ),
                  )
                ) : (
                  <div className="text-xs text-[#637285]">
                    Tidak ada related news
                    yang valid.
                  </div>
                )}

              </div>

            </section>

          </aside>
        </div>
      </main>
    </div>
  );
}