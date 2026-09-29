"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import type {
  AnalysisEnvelope,
  CalendarAnalysis,
  EconomicEvent,
  FundamentalPressure,
  NewsItem,
} from "@/types/intelligence";
import IntelligenceVisual from "./IntelligenceVisual";

type DetailPayload = {
  event: EconomicEvent;
  relatedNews: Array<Omit<NewsItem, "content">>;
  fundamental: {
    comparison: { available: boolean; text: string };
    pressure: FundamentalPressure;
  };
};

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

function biasClass(direction: CalendarAnalysis["goldBias"]["direction"]) {
  if (direction === "bullish") {
    return "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-200";
  }
  if (direction === "bearish") {
    return "border-red-400/20 bg-red-500/[0.06] text-red-200";
  }
  return "border-[#4EA4FF]/20 bg-[#1677FF]/[0.06] text-[#BBD9FF]";
}

function pressureWidth(score: number) {
  return `${Math.max(8, Math.min(100, (Math.abs(score) / 5) * 100))}%`;
}

export default function CalendarDetailClient({ id }: { id: string }) {
  const [detail, setDetail] = useState<DetailPayload | null>(null);
  const [analysis, setAnalysis] =
    useState<AnalysisEnvelope<CalendarAnalysis> | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = useCallback(
    async (force = false) => {
      setAnalyzing(true);
      setAnalysisError(null);
      try {
        const res = await fetch("/api/calendar/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, force }),
        });
        const json = (await res.json()) as AnalysisEnvelope<CalendarAnalysis> & {
          error?: string;
          cooldownRemainingSeconds?: number;
        };
        if (!res.ok && res.status !== 429) {
          throw new Error(json.error || `AI HTTP ${res.status}`);
        }
        if (json.analysis) setAnalysis(json);
        if (res.status === 429) {
          setAnalysisError(
            `Cooldown aktif ${json.cooldownRemainingSeconds ?? 0} detik. Cache terakhir tetap ditampilkan.`,
          );
        }
      } catch (error) {
        setAnalysisError(
          error instanceof Error ? error.message : "AI analysis unavailable.",
        );
      } finally {
        setAnalyzing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await fetch(`/api/calendar/${encodeURIComponent(id)}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as DetailPayload & { error?: string };
        if (!res.ok) {
          throw new Error(json.error || `Calendar detail HTTP ${res.status}`);
        }
        if (!live) return;
        setDetail(json);
        void analyze(false);
      } catch (error) {
        if (live) {
          setDetailError(
            error instanceof Error
              ? error.message
              : "Calendar detail unavailable.",
          );
        }
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [id, analyze]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#02060C] p-6">
        <div className="mx-auto h-[70vh] max-w-5xl animate-pulse rounded-3xl bg-white/[0.04]" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-[#02060C] px-6 py-20 text-center text-white">
        <AlertCircle className="mx-auto text-red-300" />
        <div className="mt-4 font-semibold">CALENDAR DATA UNAVAILABLE</div>
        <p className="mt-2 text-sm text-[#8B98AA]">{detailError}</p>
        <Link
          href="/calendar"
          className="mt-5 inline-flex text-sm text-[#3EA6FF]"
        >
          ← Kembali ke Calendar
        </Link>
      </div>
    );
  }

  const { event } = detail;
  const pressure = detail.fundamental.pressure;

  return (
    <div className="min-h-screen bg-[#02060C] text-white">
      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 lg:px-8">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#75BDFF]"
        >
          <ArrowLeft size={14} /> Economic Calendar
        </Link>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(145deg,rgba(10,25,44,.96),rgba(4,11,22,.99))] p-5 md:p-7">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                <span>{event.country ?? event.currency}</span>
                <span>·</span>
                <span>{wib(event.timestamp)} WIB</span>
                <span
                  className={`rounded-md px-2 py-0.5 ${
                    event.impact === "high"
                      ? "bg-red-500/10 text-red-300"
                      : event.impact === "medium"
                        ? "bg-amber-500/10 text-amber-200"
                        : "bg-white/[0.05] text-[#8EA3BA]"
                  }`}
                >
                  {event.impact} impact
                </span>
                <span className="rounded-md bg-[#1677FF]/10 px-2 py-0.5 text-[#75BDFF]">
                  {event.status}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                {event.event}
              </h1>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["Previous", event.previous ?? "—"],
                  ["Forecast", event.forecast ?? "—"],
                  ["Actual", event.actual ?? "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.06] bg-[#030912] p-3"
                  >
                    <div className="text-[9px] uppercase tracking-[0.12em] text-[#536275]">
                      {label}
                    </div>
                    <div
                      className={`mt-1 font-mono text-lg font-semibold ${
                        label === "Actual" && value !== "—"
                          ? "text-[#A9D4FF]"
                          : "text-white"
                      }`}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <IntelligenceVisual
                  category={event.category}
                  label={event.imageQuery}
                />
              </div>

              <div className="mt-5 rounded-xl border border-white/[0.06] bg-[#030912]/70 p-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                  Fundamental Engine
                </div>
                <p className="mt-2 text-sm leading-6 text-[#B9C3D1]">
                  {detail.fundamental.comparison.text}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 text-[10px] uppercase text-[#637285]">
                  <span>Gold fundamental pressure</span>
                  <span className="font-mono text-[#A9D4FF]">
                    {pressure.score > 0 ? "+" : ""}
                    {pressure.score} · {pressure.label}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className={`h-full rounded-full ${
                      pressure.score > 0
                        ? "bg-emerald-400/70"
                        : pressure.score < 0
                          ? "bg-red-400/70"
                          : "bg-[#3EA6FF]/60"
                    }`}
                    style={{ width: pressureWidth(pressure.score) }}
                  />
                </div>
                <div className="mt-3 space-y-2">
                  {pressure.factors.map((factor, index) => (
                    <div key={`${factor.factor}-${index}`} className="text-xs text-[#8B98AA]">
                      <span className="font-medium text-[#B9C3D1]">{factor.factor}:</span>{" "}
                      {factor.explanation}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[#4EA4FF]/[0.12] bg-[#07111F] p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3EA6FF]">
                    AI Fundamental Analysis
                  </div>
                  <h2 className="mt-1 text-lg font-semibold">
                    Apa artinya untuk Gold?
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => void analyze(true)}
                  disabled={analyzing}
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] px-3 text-xs text-[#B9C3D1] disabled:opacity-50"
                >
                  <RefreshCw
                    size={13}
                    className={analyzing ? "animate-spin" : ""}
                  />
                  Update Analysis
                </button>
              </div>

              {analyzing && !analysis ? (
                <div className="mt-5 space-y-3">
                  <div className="h-5 w-56 animate-pulse rounded bg-white/[0.05]" />
                  <div className="h-28 animate-pulse rounded-xl bg-white/[0.04]" />
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    ANALYZING FUNDAMENTAL DATA...
                  </div>
                </div>
              ) : analysis ? (
                <div className="mt-5 space-y-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                      AI Ringkasan
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#D4DCE7]">
                      {analysis.analysis.summary}
                    </p>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                      Apa artinya?
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#D4DCE7]">
                      {analysis.analysis.whatItMeans}
                    </p>
                  </div>

                  <div className="inline-flex rounded-lg border border-[#1677FF]/20 bg-[#1677FF]/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A9D4FF]">
                    Gold relevance: {analysis.analysis.goldRelevance}
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
                      Confidence: {analysis.analysis.goldBias.confidence}
                    </div>
                    <p className="mt-2 text-xs leading-5 opacity-90">
                      {analysis.analysis.goldBias.explanation}
                    </p>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                      Poin Utama
                    </div>
                    <ul className="mt-2 space-y-2 text-sm text-[#B9C3D1]">
                      {analysis.analysis.keyPoints.map((point, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="text-[#3EA6FF]">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {analysis.analysis.expectedScenarios.length ? (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                        Expected Impact / Skenario
                      </div>
                      <ul className="mt-2 space-y-2 text-xs leading-5 text-[#8EA3BA]">
                        {analysis.analysis.expectedScenarios.map((scenario, index) => (
                          <li key={index}>• {scenario}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="grid gap-2 md:grid-cols-2">
                    {analysis.analysis.fundamentalFactors.map((factor, index) => (
                      <div
                        key={`${factor.factor}-${index}`}
                        className="rounded-xl border border-white/[0.06] bg-[#030912] p-3"
                      >
                        <div className="text-xs font-semibold">{factor.factor}</div>
                        <div className="mt-1 text-[9px] uppercase text-[#75BDFF]">
                          {factor.impact}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[#8B98AA]">
                          {factor.explanation}
                        </p>
                      </div>
                    ))}
                  </div>

                  {analysis.analysis.marketContext.length ? (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                        Market Context
                      </div>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-[#8B98AA]">
                        {analysis.analysis.marketContext.map((context, index) => (
                          <li key={index}>• {context}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {analysis.analysis.risks.length ? (
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.13em] text-[#637285]">
                        Risiko / Keterbatasan
                      </div>
                      <ul className="mt-2 space-y-1 text-xs leading-5 text-[#8B98AA]">
                        {analysis.analysis.risks.map((risk, index) => (
                          <li key={index}>• {risk}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="text-[9px] text-[#536275]">
                    {analysis.cached ? "Cached" : "Generated"} · {analysis.model} ·{" "}
                    {wib(analysis.generatedAt)} WIB
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-dashed border-white/[0.09] bg-[#030912] p-5 text-sm text-[#8B98AA]">
                  AI ANALYSIS TEMPORARILY UNAVAILABLE. Data ekonomi tetap tersedia.
                </div>
              )}

              {analysisError ? (
                <div className="mt-3 text-xs text-amber-200/80">
                  {analysisError}
                </div>
              ) : null}
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-white/[0.08] bg-[#07111F] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
                Event Source
              </div>
              <div className="mt-2 text-sm font-semibold">{event.source}</div>
              {event.sourceUrl ? (
                <a
                  href={event.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs text-[#3EA6FF]"
                >
                  Buka sumber asli <ExternalLink size={12} />
                </a>
              ) : (
                <div className="mt-2 text-xs text-[#637285]">
                  Source URL tidak tersedia.
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-white/[0.08] bg-[#07111F] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
                Related News
              </div>
              <div className="mt-3 space-y-2">
                {detail.relatedNews.length ? (
                  detail.relatedNews.map((news) => (
                    <Link
                      key={news.id}
                      href={`/news/${encodeURIComponent(news.id)}`}
                      className="block rounded-xl border border-white/[0.06] bg-[#030912] p-3 hover:border-[#1677FF]/25"
                    >
                      <div className="text-[9px] uppercase text-[#637285]">
                        {news.source}
                      </div>
                      <div className="mt-1 text-xs leading-5">{news.headline}</div>
                    </Link>
                  ))
                ) : (
                  <div className="text-xs text-[#637285]">
                    Tidak ada related news yang valid.
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