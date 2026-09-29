"use client";
import { useRouter } from "next/navigation";
import React, {
  
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bell,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  LayoutDashboard,
  LineChart,
  Lock,
  MapPin,
  Menu,
  MessageSquare,
  Megaphone,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  Pin,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  Video,
  X,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   NOXVEIL ARCANUM — FreeDashboard (single authoritative file)

   Design reference: JAPSKU (layout/UX/hierarchy only).
   Branding: NOXVEIL ARCANUM — deep navy / black / premium blue.

   REAL (runs from this file alone):
   - TradingView official widget (XAUUSD interactive chart)
   - Owner CMS CRUD (persistent via IndexedDB)
   - File upload from PC (FileReader → persistent data URL stored in IndexedDB)
   - Progress persistence (localStorage)
   - Forex / Compounding calculators
   - WIB session clock (Intl.DateTimeFormat Asia/Jakarta)

   INTEGRATION BOUNDARY (honest; no fabricated data):
   - News         → GET /api/news
   - Calendar     → GET /api/calendar
   - XAUUSD price → GET /api/market?symbol=XAUUSD (real provider only)
  
   HARD RULES:
   - NO fake price / fake news / fake economic event / fake accuracy
   - FileReader reads real file; no fake success
═══════════════════════════════════════════════════════════════ */

/* ───────────────────────────── Types ───────────────────────── */

type Role = "member" | "owner";

type PageId =
  | "dashboard"
  | "chart"
  | "news"
  | "calendar"
  | "world"
  | "videos"
  | "pdfs"
  | "brokers"
  | "expert"
  | "community"
  | "live"
  | "announcements"
  | "events"
  | "forex-calc"
  | "compounding"
  | "sessions"
  | "settings"
  | "owner-dashboard"
  | "owner-videos"
  | "owner-pdfs"
  | "owner-expert"
  | "owner-brokers"
  | "owner-live"
  | "owner-events"
  | "owner-announcements"
  | "owner-community"
  | "owner-settings"
  | "owner-providers";

type ViewState =
  | { kind: "page"; page: PageId }
  | { kind: "material"; collection: "video" | "pdf" | "expert"; id: string }
  | {
      kind: "owner-material-edit";
      collection: "video" | "pdf" | "expert";
      id?: string;
    }
  | { kind: "owner-live-edit"; id?: string }
  | { kind: "owner-event-edit"; id?: string }
  | { kind: "owner-announcement-edit"; id?: string }
  | { kind: "owner-broker-edit"; id?: string };

type ContentStatus = "draft" | "published" | "archived";
type MaterialKind = "video" | "pdf";
type ExpertCategory = "technical" | "method" | "execution";

type Material = {
  id: string;
  title: string;
  description: string;
  kind: MaterialKind;
  status: ContentStatus;
  order: number;
  thumbnailUrl?: string;
  mediaUrl?: string;
  attachmentUrl?: string;
  durationMinutes?: number;
  expert?: { category: ExpertCategory; locked: boolean };
};

type LiveItem = {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  status: "scheduled" | "live" | "ended";
  coverUrl?: string;
  watchUrl?: string;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: ContentStatus;
  coverUrl?: string;
  joinUrl?: string;
  pinned?: boolean;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  status: ContentStatus;
  pinned?: boolean;
  coverUrl?: string;
  category?: string;
  createdAt: string;
};

type Broker = {
  id: string;
  name: string;
  description: string;
  registerUrl: string;
  logoUrl?: string;
  visual: "hfm" | "kos" | "generic";
  status: ContentStatus;
  disclaimer?: string;
};

type Discussion = {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: string;
  pinned?: boolean;
  replies: number;
  category: "general" | "xauusd" | "macro" | "education";
};

type PlatformSettings = {
  platformName: string;
  tagline: string;
  description: string;
  telegramUrl: string;
  tradingViewSymbol: string;
  tradingViewInterval: string;
  newsSourceLabel: string;
  calendarSourceLabel: string;
};

type ProgressSnapshot = {
  completedMaterialIds: string[];
  lastMaterialId?: string;
};

type MarketDataSnapshot = {
  symbol: "XAUUSD";
  price?: number;
  bid?: number;
  ask?: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  timestamp?: string;
  receivedAt: string;
  status: "live" | "delayed" | "offline";
  provider?: string;
};

type NewsItem = {
  id: string;
  headline: string;
  source: string;
  publishedAt: string;
  url: string;
  summary?: string;
  imageUrl?: string;
  relevance?: "gold" | "usd" | "macro" | "general";
};

type EconomicEventStatus = "upcoming" | "live" | "released";
type EconomicEventCategory =
  | "inflation"
  | "labor-market"
  | "central-bank"
  | "growth"
  | "consumer"
  | "manufacturing"
  | "business-activity"
  | "housing"
  | "trade"
  | "energy"
  | "gold"
  | "holiday"
  | "macro";

type EconomicEvent = {
  id: string;
  publishedAt: string;
  currency: string;
  event: string;
  impact: "low" | "medium" | "high";
  previous?: string;
  forecast?: string;
  actual?: string;
  relevance?: "gold" | "usd" | "macro";
  country?: string;
  timestamp?: string;
  source?: string;
  status?: EconomicEventStatus;
  imageQuery?: string;
  category?: EconomicEventCategory;
};

type CalendarApiResponse = {
  events: EconomicEvent[];
  provider?: string;
  source?: string;
  fetchedAt?: string | null;
  servedAt?: string;
  stale?: boolean;
  warning?: string;
  error?: string;
  refreshIntervalMs?: number;
  upstreamRefreshSeconds?: number;
  mode?: "near-live" | string;
};

type WorldMarketRow = {
  id: string;
  label: string;
  symbol: string;
  value?: string;
  change?: string;
  changePct?: string;
  status: "live" | "delayed" | "unavailable";
};

type IntegrationState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "empty" }
  | { status: "error"; message: string };

interface MarketDataProvider {
  getXauUsd(signal?: AbortSignal): Promise<MarketDataSnapshot>;
}
interface NewsProvider {
  getLatestMarketNews(signal?: AbortSignal): Promise<NewsItem[]>;
}
interface EconomicCalendarProvider {
  getEvents(): Promise<CalendarApiResponse>;
}
interface WorldMarketProvider {
  getRows(): Promise<WorldMarketRow[]>;
}

/* Provider boundaries — every number shown by the dashboard must come from a real API response. */
const MARKET_DATA_PROVIDER: MarketDataProvider = {
  async getXauUsd(signal) {
    const res = await fetch("/api/market?symbol=XAUUSD", {
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    });
    const json = (await res.json()) as {
      status?: string;
      stale?: boolean;
      message?: string;
      fetchedAt?: string;
      data?: Record<string, unknown>;
    };

    if (!res.ok) {
      throw new Error(
        json.message ?? `Market route returned ${res.status}`,
      );
    }

    const raw = isRecord(json.data) ? json.data : {};
    const finite = (value: unknown) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : undefined;
    };
    const positive = (value: unknown) => {
      const number = finite(value);
      return typeof number === "number" && number > 0 ? number : undefined;
    };

    const price = positive(raw.price ?? raw.mid ?? raw.last ?? raw.value);
    const bid = positive(raw.bid);
    const ask = positive(raw.ask);

    if (
      typeof price !== "number" &&
      typeof bid !== "number" &&
      typeof ask !== "number"
    ) {
      throw new Error("Market provider returned no valid XAUUSD quote.");
    }

    const timestampCandidate =
      typeof raw.timestamp === "string"
        ? raw.timestamp
        : typeof raw.lastQuoteAt === "string"
          ? raw.lastQuoteAt
          : typeof json.fetchedAt === "string"
            ? json.fetchedAt
            : undefined;
    const timestampMs = timestampCandidate
      ? Date.parse(timestampCandidate)
      : Number.NaN;
    const timestamp = Number.isFinite(timestampMs)
      ? new Date(timestampMs).toISOString()
      : undefined;

    const provider =
      typeof raw.provider === "string"
        ? raw.provider
        : typeof raw.source === "string"
          ? raw.source
          : "Market API";

    const providerStatus =
      String(raw.status ?? json.status ?? "").toLowerCase();
    const status: MarketDataSnapshot["status"] =
      json.stale || providerStatus === "delayed" || providerStatus === "stale"
        ? "delayed"
        : providerStatus === "offline" || providerStatus === "error"
          ? "offline"
          : "live";

    return {
      symbol: "XAUUSD",
      price,
      bid,
      ask,
      change: finite(raw.change),
      changePercent: finite(
        raw.changePercent ?? raw.change_pct ?? raw.changePct,
      ),
      high: positive(raw.high ?? raw.dayHigh),
      low: positive(raw.low ?? raw.dayLow),
      timestamp,
      receivedAt: new Date().toISOString(),
      status,
      provider,
    };
  },
};

const WORLD_MARKET_PROVIDER: WorldMarketProvider | null = null;

const NEWS_PROVIDER: NewsProvider = {
  async getLatestMarketNews(signal) {
    const res = await fetch("/api/news", {
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`News route returned ${res.status}`);
    const json = (await res.json()) as { items?: NewsItem[] };
    return Array.isArray(json.items) ? json.items : [];
  },
};

const ECONOMIC_CALENDAR_PROVIDER: EconomicCalendarProvider = {
  async getEvents() {
    const res = await fetch("/api/calendar", { cache: "no-store" });
    const json = (await res.json()) as CalendarApiResponse;
    if (!res.ok) {
      throw new Error(json.error ?? `Calendar route returned ${res.status}`);
    }
    return {
      ...json,
      events: Array.isArray(json.events) ? json.events : [],
    };
  },
};

/* ───────────────────────────── Live market store ──────────── */

type MarketHistoryPoint = {
  value: number;
  timestamp: number;
};

type MarketFeedSnapshot = {
  integration: IntegrationState<MarketDataSnapshot>;
  history: MarketHistoryPoint[];
  refreshing: boolean;
  message?: string;
};

const MARKET_POLL_MS = 15_000;
const MARKET_STALE_MS = 90_000;
const MARKET_FUTURE_TOLERANCE_MS = 30_000;
const MARKET_HISTORY_LIMIT = 40;

const marketListeners = new Set<() => void>();
let marketTimer: ReturnType<typeof setTimeout> | null = null;
let marketAbortController: AbortController | null = null;
let marketFeedSnapshot: MarketFeedSnapshot = {
  integration: { status: "idle" },
  history: [],
  refreshing: false,
};

function marketPrimaryValue(data: MarketDataSnapshot): number | undefined {
  if (typeof data.price === "number") return data.price;
  if (typeof data.bid === "number" && typeof data.ask === "number") {
    return (data.bid + data.ask) / 2;
  }
  if (typeof data.bid === "number") return data.bid;
  if (typeof data.ask === "number") return data.ask;
  return undefined;
}

function publishMarketFeed(next: MarketFeedSnapshot) {
  marketFeedSnapshot = next;
  marketListeners.forEach((listener) => listener());
}

function validateMarketSnapshot(
  input: MarketDataSnapshot,
): MarketDataSnapshot {
  const now = Date.now();
  const timestampMs = input.timestamp
    ? Date.parse(input.timestamp)
    : Number.NaN;

  if (
    Number.isFinite(timestampMs) &&
    timestampMs > now + MARKET_FUTURE_TOLERANCE_MS
  ) {
    throw new Error("Market provider returned a future timestamp.");
  }

  const stale =
    !Number.isFinite(timestampMs) ||
    now - timestampMs > MARKET_STALE_MS;

  return {
    ...input,
    status:
      input.status === "offline"
        ? "offline"
        : stale || input.status === "delayed"
          ? "delayed"
          : "live",
  };
}

function scheduleMarketRefresh() {
  if (marketTimer) clearTimeout(marketTimer);
  if (!marketListeners.size) return;
  marketTimer = setTimeout(() => {
    void refreshMarketFeed();
  }, MARKET_POLL_MS);
}

async function refreshMarketFeed() {
  marketAbortController?.abort();
  const controller = new AbortController();
  marketAbortController = controller;

  const previous = marketFeedSnapshot.integration;
  publishMarketFeed({
    ...marketFeedSnapshot,
    integration:
      previous.status === "idle" ? { status: "loading" } : previous,
    refreshing: true,
    message: undefined,
  });

  try {
    const raw = await MARKET_DATA_PROVIDER.getXauUsd(
      controller.signal,
    );
    const data = validateMarketSnapshot(raw);
    const value = marketPrimaryValue(data);
    const pointTimestamp = data.timestamp
      ? Date.parse(data.timestamp)
      : Date.parse(data.receivedAt);

    let history = marketFeedSnapshot.history;
    if (
      typeof value === "number" &&
      Number.isFinite(pointTimestamp)
    ) {
      const last = history[history.length - 1];
      if (
        !last ||
        last.timestamp !== pointTimestamp ||
        last.value !== value
      ) {
        history = [
          ...history,
          { value, timestamp: pointTimestamp },
        ].slice(-MARKET_HISTORY_LIMIT);
      }
    }

    publishMarketFeed({
      integration: { status: "ready", data },
      history,
      refreshing: false,
      message:
        data.status === "delayed"
          ? "Quote diterima, tetapi timestamp provider tidak cukup fresh untuk diklaim LIVE."
          : undefined,
    });
  } catch (error) {
    if (controller.signal.aborted) return;

    const message =
      error instanceof Error
        ? error.message
        : "Market data unavailable.";

    if (previous.status === "ready") {
      publishMarketFeed({
        integration: {
          status: "ready",
          data: { ...previous.data, status: "delayed" },
        },
        history: marketFeedSnapshot.history,
        refreshing: false,
        message,
      });
    } else {
      publishMarketFeed({
        integration: { status: "error", message },
        history: marketFeedSnapshot.history,
        refreshing: false,
        message,
      });
    }
  } finally {
    if (marketAbortController === controller) {
      scheduleMarketRefresh();
    }
  }
}

function subscribeMarketFeed(listener: () => void) {
  marketListeners.add(listener);

  if (marketListeners.size === 1) {
    void refreshMarketFeed();
  }

  return () => {
    marketListeners.delete(listener);
    if (!marketListeners.size) {
      if (marketTimer) clearTimeout(marketTimer);
      marketTimer = null;
      marketAbortController?.abort();
      marketAbortController = null;
    }
  };
}

function getMarketFeedSnapshot() {
  return marketFeedSnapshot;
}

function useMarketFeed() {
  return useSyncExternalStore(
    subscribeMarketFeed,
    getMarketFeedSnapshot,
    getMarketFeedSnapshot,
  );
}

/* ───────────────────────────── Seed content ───────────────── */

const INITIAL_VIDEOS: Material[] = [
  {
    id: "vid-market-basics",
    title: "Market Basics — Cara Kerja Pasar",
    description:
      "Dasar pasar forex, metal, dan indeks. Bagaimana harga terbentuk, siapa pelakunya, dan bagaimana retail trader membaca konteks.",
    kind: "video",
    status: "published",
    order: 1,
    durationMinutes: 18,
  },
  {
    id: "vid-risk-basics",
    title: "Risk Basics — Position Sizing",
    description:
      "Prinsip dasar manajemen risiko: berapa persen per posisi, bagaimana menghitung lot, kenapa risk ditentukan lebih dulu.",
    kind: "video",
    status: "published",
    order: 2,
    durationMinutes: 22,
  },
  {
    id: "vid-psychology-basics",
    title: "Trading Psychology Dasar",
    description:
      "Emosi, disiplin, dan proses keputusan. Mengapa psikologi lebih menentukan hasil daripada indikator.",
    kind: "video",
    status: "published",
    order: 3,
    durationMinutes: 16,
  },
  {
    id: "vid-xauusd-basics",
    title: "XAUUSD Basic — Karakter Gold",
    description:
      "Karakter pergerakan XAUUSD, sesi aktif, volatilitas, dan reaksi gold terhadap makro USD.",
    kind: "video",
    status: "published",
    order: 4,
    durationMinutes: 20,
  },
];

const INITIAL_PDFS: Material[] = [
  {
    id: "pdf-glossary",
    title: "Trading Glossary NOXVEIL",
    description:
      "Istilah trading wajib: struktur, likuiditas, spread, margin, leverage, dan lainnya.",
    kind: "pdf",
    status: "published",
    order: 1,
  },
  {
    id: "pdf-risk-basics",
    title: "Basic Risk Management",
    description:
      "Panduan ringkas: position sizing, stop loss, risk-reward, dan disiplin eksekusi.",
    kind: "pdf",
    status: "published",
    order: 2,
  },
  {
    id: "pdf-market-structure",
    title: "Basic Market Structure",
    description:
      "Pengantar struktur market: swing high/low, trend, konsolidasi, dan konteks harga.",
    kind: "pdf",
    status: "published",
    order: 3,
  },
];

const INITIAL_EXPERT: Material[] = [
  {
    id: "exp-technical",
    title: "Technical Analysis",
    description:
      "Methodology technical analysis lengkap: multi-timeframe, confluence, eksekusi presisi.",
    kind: "video",
    status: "published",
    order: 1,
    durationMinutes: 90,
    expert: { category: "technical", locked: true },
  },
  {
    id: "exp-method",
    title: "Trading Method",
    description: "Framework trading NOXVEIL: dari bias harian hingga eksekusi intraday.",
    kind: "video",
    status: "published",
    order: 2,
    durationMinutes: 120,
    expert: { category: "method", locked: true },
  },
  {
    id: "exp-snd",
    title: "SND — Supply & Demand",
    description: "Identifikasi zona supply & demand berkualitas, validasi, entry presisi.",
    kind: "video",
    status: "published",
    order: 3,
    durationMinutes: 75,
    expert: { category: "technical", locked: true },
  },
  {
    id: "exp-snr",
    title: "SNR — Support & Resistance",
    description: "SNR high-probability: validasi level, konfirmasi reaksi, manajemen entry.",
    kind: "video",
    status: "published",
    order: 4,
    durationMinutes: 80,
    expert: { category: "technical", locked: true },
  },
  {
    id: "exp-structure",
    title: "Market Structure",
    description: "BOS, CHOCH, swing, cara membaca struktur market XAUUSD presisi.",
    kind: "video",
    status: "published",
    order: 5,
    durationMinutes: 95,
    expert: { category: "technical", locked: true },
  },
  {
    id: "exp-liquidity",
    title: "Liquidity",
    description: "Liquidity grab, false break, trap market, dan cara memanfaatkannya.",
    kind: "video",
    status: "published",
    order: 6,
    durationMinutes: 85,
    expert: { category: "technical", locked: true },
  },
  {
    id: "exp-precision",
    title: "Precision Entry",
    description: "Entry presisi di level kunci dengan konfirmasi multi-faktor.",
    kind: "video",
    status: "published",
    order: 7,
    durationMinutes: 70,
    expert: { category: "execution", locked: true },
  },
  {
    id: "exp-grid",
    title: "Grid Method",
    description: "Methodology grid disiplin: sizing, level, manajemen risiko.",
    kind: "video",
    status: "published",
    order: 8,
    durationMinutes: 110,
    expert: { category: "method", locked: true },
  },
  {
    id: "exp-scalping",
    title: "Scalping XAUUSD",
    description: "Scalping presisi XAUUSD: momentum, timing, eksekusi cepat terkontrol.",
    kind: "video",
    status: "published",
    order: 9,
    durationMinutes: 100,
    expert: { category: "execution", locked: true },
  },
];

const INITIAL_LIVES: LiveItem[] = [
  {
    id: "live-weekly",
    title: "Weekly XAUUSD Live Session",
    description:
      "Live market breakdown: struktur, level kunci, dan rencana eksekusi XAUUSD.",
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    status: "scheduled",
    watchUrl: "",
  },
];

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "evt-weekly-review",
    title: "Weekly XAUUSD Structure Review",
    description:
      "Sesi edukasi mingguan: review struktur, liquidity, dan bias mingguan XAUUSD. Q&A terbuka.",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    time: "19:30",
    status: "published",
    pinned: true,
  },
  {
    id: "evt-macro-primer",
    title: "Macro Primer: CPI & Fed Impact on Gold",
    description:
      "Pengantar bagaimana CPI dan kebijakan Fed mempengaruhi XAUUSD.",
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    time: "20:00",
    status: "published",
  },
];

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-welcome",
    title: "Selamat datang di NOXVEIL ARCANUM",
    body:
      "Free Dashboard berisi basic education, tools, dan market resources. Advanced technical methodology (SNR, SND, Market Structure, Liquidity, Precision Entry, Grid Method, Scalping XAUUSD) tersedia untuk Expert Member setelah registrasi + verifikasi.",
    status: "published",
    pinned: true,
    category: "welcome",
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_BROKERS: Broker[] = [
  {
    id: "broker-hfm",
    name: "HFM",
    description:
      "Akses pasar global dengan eksekusi cepat. Trading account untuk forex, metal, dan indeks.",
    registerUrl:
      "https://www.hfmtrade-ind.com/sv/en/?refid=30474368&utm_source=chatgpt.com",
    visual: "hfm",
    status: "published",
    disclaimer:
      "Trading memiliki risiko. Kinerja masa lalu bukan jaminan hasil di masa depan.",
  },
  {
    id: "broker-kos",
    name: "KOS MARKET",
    description:
      "Registrasi trading account untuk akses market global melalui KOS Back Office.",
    registerUrl:
      "https://client.kosbackoffice.com/register/trader?link_id=g5ho0t48&referrer_id=oxvlhnr7",
    visual: "kos",
    status: "published",
    disclaimer:
      "Trading memiliki risiko. Pahami kondisi dan aturan sebelum membuka posisi.",
  },
];

const INITIAL_DISCUSSIONS: Discussion[] = [
  {
    id: "disc-1",
    title: "Bias XAUUSD minggu ini — struktur & level",
    body:
      "Bagaimana pandangan kalian untuk XAUUSD minggu ini? Level mana yang kalian perhatikan sebagai konfirmasi struktur?",
    author: "Member",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    replies: 0,
    category: "xauusd",
  },
  {
    id: "disc-2",
    title: "Risk management ketika news besar (CPI/NFP)",
    body:
      "Bagaimana kalian mengelola risiko saat rilis data besar? Mengurangi lot atau menahan posisi?",
    author: "Member",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    replies: 0,
    category: "macro",
  },
];

const INITIAL_SETTINGS: PlatformSettings = {
  platformName: "NOXVEIL ARCANUM",
  tagline: "Trade With Mega bintang. Learn With Discipline.",
  description:
    "Platform edukasi trading terstruktur: market intelligence, tools presisi, dan komunitas.",
  telegramUrl: "https://t.me/murid_andry_hakim",
  tradingViewSymbol: "OANDA:XAUUSD",
  tradingViewInterval: "60",
  newsSourceLabel: "/api/news",
  calendarSourceLabel: "/api/calendar",
};

/* ───────────────────────────── Nav ───────────────────────── */

type NavItem = {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
};

const NAV_MEMBER: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Market",
    items: [
      { id: "chart", label: "TradingView", icon: LineChart },
      { id: "news", label: "Market News", icon: Newspaper },
      { id: "calendar", label: "Economic Calendar", icon: Calendar },
      { id: "world", label: "World Market", icon: Globe },
    ],
  },
  {
    label: "Learning",
    items: [
      { id: "videos", label: "Basic Videos", icon: Video },
      { id: "pdfs", label: "PDF Resources", icon: FileText },
      { id: "brokers", label: "Broker / Account", icon: MapPin },
    ],
  },
  {
    label: "Expert",
    items: [{ id: "expert", label: "Expert Access", icon: Lock }],
  },
  {
    label: "Community",
    items: [
      { id: "community", label: "Discussion", icon: MessageSquare },
      { id: "live", label: "Live", icon: Radio },
      { id: "announcements", label: "Announcement", icon: Megaphone },
      { id: "events", label: "Events", icon: Calendar },
    ],
  },
  {
    label: "Tools",
    items: [
      { id: "forex-calc", label: "Forex Calculator", icon: Calculator },
      { id: "compounding", label: "Compounding", icon: Percent },
      { id: "sessions", label: "Session Clock", icon: Clock },
    ],
  },
  {
    label: "Account",
    items: [{ id: "settings", label: "Settings", icon: Settings }],
  },
];

const NAV_OWNER: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Owner Studio",
    items: [
      { id: "owner-dashboard", label: "Owner Dashboard", icon: Shield },
      { id: "owner-videos", label: "Videos", icon: Video },
      { id: "owner-pdfs", label: "PDF Library", icon: FileText },
      { id: "owner-expert", label: "Expert Modules", icon: Lock },
      { id: "owner-live", label: "Live", icon: Radio },
      { id: "owner-events", label: "Events", icon: Calendar },
      { id: "owner-announcements", label: "Announcements", icon: Megaphone },
      { id: "owner-brokers", label: "Brokers", icon: MapPin },
      { id: "owner-community", label: "Community", icon: Users },
      { id: "owner-settings", label: "Settings", icon: Settings },
      { id: "owner-providers", label: "Providers", icon: RefreshCw },
    ],
  },
  {
    label: "Member view",
    items: [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
];

/* ───────────────────────────── Sessions ───────────────────── */

const SESSIONS = [
  { id: "sydney", name: "Sydney", short: "SY", open: 5, close: 14, accent: "#38BDF8" },
  { id: "tokyo", name: "Tokyo", short: "TO", open: 7, close: 16, accent: "#60A5FA" },
  { id: "london", name: "London", short: "LO", open: 14, close: 23, accent: "#818CF8" },
  { id: "newyork", name: "New York", short: "NY", open: 19, close: 28, accent: "#A78BFA" },
] as const;

type Session = (typeof SESSIONS)[number];

function getWibParts(date = new Date()) {
  const f = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const parts = f.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hour = Number.parseInt(get("hour"), 10) || 0;
  const minute = Number.parseInt(get("minute"), 10) || 0;
  return {
    hour,
    minute,
    timeStr: `${get("hour")}:${get("minute")}:${get("second")}`,
    dateStr: `${get("weekday")}, ${get("day")} ${get("month")} ${get("year")}`,
    totalMinutes: hour * 60 + minute,
  };
}

function isSessionOpen(s: Session, hour: number) {
  if (s.close > 24) return hour >= s.open || hour < s.close - 24;
  return hour >= s.open && hour < s.close;
}

/* ───────────────────────────── Math ───────────────────────── */

function calculateLotSize(p: {
  balance: number;
  riskPercent: number;
  stopPips: number;
  pipValuePerLot: number;
}) {
  const { balance, riskPercent, stopPips, pipValuePerLot } = p;
  if (balance <= 0 || riskPercent <= 0 || stopPips <= 0 || pipValuePerLot <= 0)
    return null;
  const riskAmount = (balance * riskPercent) / 100;
  return { riskAmount, lot: riskAmount / (stopPips * pipValuePerLot) };
}

function calculateCompounding(p: {
  startingBalance: number;
  returnPercent: number;
  periods: number;
  contributionPerPeriod: number;
}) {
  const { startingBalance, returnPercent, periods, contributionPerPeriod } = p;
  if (
    startingBalance < 0 ||
    periods <= 0 ||
    !Number.isFinite(returnPercent) ||
    contributionPerPeriod < 0
  )
    return null;
  const rate = returnPercent / 100;
  let balance = startingBalance;
  const rows: Array<{
    period: number;
    opening: number;
    growth: number;
    contribution: number;
    closing: number;
  }> = [];
  for (let period = 1; period <= periods; period++) {
    const opening = balance;
    const growth = opening * rate;
    balance = opening + growth + contributionPerPeriod;
    rows.push({
      period,
      opening,
      growth,
      contribution: contributionPerPeriod,
      closing: balance,
    });
  }
  return {
    finalBalance: balance,
    totalContribution: contributionPerPeriod * periods,
    netGrowth: balance - startingBalance - contributionPerPeriod * periods,
    rows,
  };
}

/* ───────────────────────────── Utilities ──────────────────── */

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return iso;
  }
}

function formatWibDateTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "medium",
      hour12: false,
    }).format(d);
  } catch {
    return iso;
  }
}

function formatDateOnly(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(d);
  } catch {
    return iso;
  }
}

/* ───────────────────────────── Persistence ────────────────── */

const PROGRESS_KEY = "noxveil.learning-progress.v1";
const SIDEBAR_KEY = "noxveil.sidebar.collapsed.v1";

const progressPersistence = {
  load(): ProgressSnapshot {
    if (typeof window === "undefined") return { completedMaterialIds: [] };
    try {
      const raw = window.localStorage.getItem(PROGRESS_KEY);
      if (!raw) return { completedMaterialIds: [] };
      const parsed = JSON.parse(raw) as Partial<ProgressSnapshot>;
      return {
        completedMaterialIds: Array.isArray(parsed.completedMaterialIds)
          ? parsed.completedMaterialIds.filter(
              (id): id is string => typeof id === "string",
            )
          : [],
        lastMaterialId:
          typeof parsed.lastMaterialId === "string"
            ? parsed.lastMaterialId
            : undefined,
      };
    } catch {
      return { completedMaterialIds: [] };
    }
  },
  save(s: ProgressSnapshot) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(s));
  },
};

function useLearningProgress(publishedIds: string[]) {
  const [hydrated, setHydrated] = useState(false);
  const [snapshot, setSnapshot] = useState<ProgressSnapshot>({
    completedMaterialIds: [],
  });

  useEffect(() => {
    setSnapshot(progressPersistence.load());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    progressPersistence.save(snapshot);
  }, [hydrated, snapshot]);

  const completedSet = useMemo(
    () => new Set(snapshot.completedMaterialIds),
    [snapshot.completedMaterialIds],
  );

  const markCompleted = useCallback((id: string) => {
    setSnapshot((c) => {
      const next = new Set(c.completedMaterialIds);
      next.add(id);
      return { completedMaterialIds: Array.from(next), lastMaterialId: id };
    });
  }, []);

  const markIncomplete = useCallback((id: string) => {
    setSnapshot((c) => ({
      completedMaterialIds: c.completedMaterialIds.filter((x) => x !== id),
      lastMaterialId: c.lastMaterialId === id ? undefined : c.lastMaterialId,
    }));
  }, []);

  const recordOpened = useCallback((id: string) => {
    setSnapshot((c) => ({ ...c, lastMaterialId: id }));
  }, []);

  const completedCount = useMemo(
    () => publishedIds.filter((id) => completedSet.has(id)).length,
    [completedSet, publishedIds],
  );

  const overallPercent = publishedIds.length
    ? Math.round((completedCount / publishedIds.length) * 100)
    : null;

  return {
    hydrated,
    snapshot,
    completedSet,
    overallPercent,
    completedCount,
    markCompleted,
    markIncomplete,
    recordOpened,
  };
}

/* ───────────────────────────── Persistent content store ───── */

type ContentSnapshot = {
  schemaVersion: 1;
  updatedAt: string;
  videos: Material[];
  pdfs: Material[];
  expert: Material[];
  lives: LiveItem[];
  events: EventItem[];
  announcements: Announcement[];
  brokers: Broker[];
  discussions: Discussion[];
  settings: PlatformSettings;
};

type PersistenceState = "hydrating" | "idle" | "saving" | "saved" | "error";

const CONTENT_DB_NAME = "noxveil-arcanum";
const CONTENT_STORE_NAME = "content";
const CONTENT_SNAPSHOT_KEY = "content-store-v1";

function cloneSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createDefaultContentSnapshot(): ContentSnapshot {
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    videos: cloneSerializable(INITIAL_VIDEOS),
    pdfs: cloneSerializable(INITIAL_PDFS),
    expert: cloneSerializable(INITIAL_EXPERT),
    lives: cloneSerializable(INITIAL_LIVES),
    events: cloneSerializable(INITIAL_EVENTS),
    announcements: cloneSerializable(INITIAL_ANNOUNCEMENTS),
    brokers: cloneSerializable(INITIAL_BROKERS),
    discussions: cloneSerializable(INITIAL_DISCUSSIONS),
    settings: cloneSerializable(INITIAL_SETTINGS),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePersistedSnapshot(raw: unknown): ContentSnapshot | null {
  if (!isRecord(raw)) return null;

  const defaults = createDefaultContentSnapshot();
  const rawSettings = isRecord(raw.settings) ? raw.settings : {};
  const settings: PlatformSettings = { ...defaults.settings };

  (Object.keys(settings) as Array<keyof PlatformSettings>).forEach((key) => {
    const value = rawSettings[key];
    if (typeof value === "string") settings[key] = value;
  });

  return {
    schemaVersion: 1,
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : new Date().toISOString(),
    videos: Array.isArray(raw.videos)
      ? (raw.videos as Material[])
      : defaults.videos,
    pdfs: Array.isArray(raw.pdfs) ? (raw.pdfs as Material[]) : defaults.pdfs,
    expert: Array.isArray(raw.expert)
      ? (raw.expert as Material[])
      : defaults.expert,
    lives: Array.isArray(raw.lives)
      ? (raw.lives as LiveItem[])
      : defaults.lives,
    events: Array.isArray(raw.events)
      ? (raw.events as EventItem[])
      : defaults.events,
    announcements: Array.isArray(raw.announcements)
      ? (raw.announcements as Announcement[])
      : defaults.announcements,
    brokers: Array.isArray(raw.brokers)
      ? (raw.brokers as Broker[])
      : defaults.brokers,
    discussions: Array.isArray(raw.discussions)
      ? (raw.discussions as Discussion[])
      : defaults.discussions,
    settings,
  };
}

function assertPersistentUrl(value: string | undefined, label: string) {
  if (!value) return;
  if (value.startsWith("blob:")) {
    throw new Error(
      `${label} masih memakai temporary blob URL. Upload ulang file agar disimpan sebagai data persistent.`,
    );
  }
}

function validateContentSnapshot(snapshot: ContentSnapshot) {
  const arrays: Array<[string, unknown]> = [
    ["videos", snapshot.videos],
    ["pdfs", snapshot.pdfs],
    ["expert", snapshot.expert],
    ["lives", snapshot.lives],
    ["events", snapshot.events],
    ["announcements", snapshot.announcements],
    ["brokers", snapshot.brokers],
    ["discussions", snapshot.discussions],
  ];

  for (const [label, value] of arrays) {
    if (!Array.isArray(value)) throw new Error(`Invalid persisted field: ${label}`);
  }

  for (const key of Object.keys(INITIAL_SETTINGS) as Array<keyof PlatformSettings>) {
    if (typeof snapshot.settings[key] !== "string") {
      throw new Error(`Invalid setting: ${key}`);
    }
  }

  for (const material of [
    ...snapshot.videos,
    ...snapshot.pdfs,
    ...snapshot.expert,
  ]) {
    assertPersistentUrl(material.thumbnailUrl, `${material.id}.thumbnailUrl`);
    assertPersistentUrl(material.mediaUrl, `${material.id}.mediaUrl`);
    assertPersistentUrl(material.attachmentUrl, `${material.id}.attachmentUrl`);
  }
  for (const item of snapshot.lives) {
    assertPersistentUrl(item.coverUrl, `${item.id}.coverUrl`);
  }
  for (const item of snapshot.events) {
    assertPersistentUrl(item.coverUrl, `${item.id}.coverUrl`);
  }
  for (const item of snapshot.announcements) {
    assertPersistentUrl(item.coverUrl, `${item.id}.coverUrl`);
  }
  for (const item of snapshot.brokers) {
    assertPersistentUrl(item.logoUrl, `${item.id}.logoUrl`);
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    transaction.onerror = () => {
      // onabort/onerror may both fire. The promise settles only once.
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
  });
}

function openIndexedDbRequest(
  version?: number,
  ensureContentStore = false,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request =
      typeof version === "number"
        ? window.indexedDB.open(CONTENT_DB_NAME, version)
        : window.indexedDB.open(CONTENT_DB_NAME);

    request.onupgradeneeded = () => {
      const db = request.result;
      // A brand-new database also reaches this handler. Create the canonical
      // content store immediately so first install works in one pass.
      if (
        (ensureContentStore || !db.objectStoreNames.contains(CONTENT_STORE_NAME)) &&
        !db.objectStoreNames.contains(CONTENT_STORE_NAME)
      ) {
        db.createObjectStore(CONTENT_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };

    request.onerror = () =>
      reject(request.error ?? new Error("Gagal membuka IndexedDB."));
    request.onblocked = () =>
      reject(
        new Error(
          "IndexedDB upgrade terblokir. Tutup tab NOXVEIL lain lalu coba lagi.",
        ),
      );
  });
}

async function openContentDb(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    throw new Error("IndexedDB tidak tersedia di browser ini.");
  }

  // IMPORTANT MIGRATION PATH:
  // Earlier NOXVEIL builds may already have created a database named
  // `noxveil-arcanum` at version 1 (or even a later version) without a
  // `content` object store. Opening that database again with the same fixed
  // version does NOT trigger `onupgradeneeded`, which caused:
  //   Failed to execute 'transaction' ... object stores was not found.
  //
  // Open the current database version first, inspect its stores, and only
  // upgrade when the canonical store is actually missing. This preserves any
  // other existing stores and works regardless of the current DB version.
  const currentDb = await openIndexedDbRequest();
  if (currentDb.objectStoreNames.contains(CONTENT_STORE_NAME)) {
    return currentDb;
  }

  const nextVersion = Math.max(1, currentDb.version + 1);
  currentDb.close();

  const upgradedDb = await openIndexedDbRequest(nextVersion, true);
  if (!upgradedDb.objectStoreNames.contains(CONTENT_STORE_NAME)) {
    upgradedDb.close();
    throw new Error(
      `IndexedDB berhasil dibuka tetapi object store "${CONTENT_STORE_NAME}" gagal dibuat.`,
    );
  }

  return upgradedDb;
}

const contentPersistence = {
  async load(): Promise<ContentSnapshot | null> {
    const db = await openContentDb();
    try {
      const tx = db.transaction(CONTENT_STORE_NAME, "readonly");
      const done = transactionToPromise(tx);
      const request = tx.objectStore(CONTENT_STORE_NAME).get(CONTENT_SNAPSHOT_KEY);
      const raw = await requestToPromise<unknown>(request);
      await done;
      if (typeof raw === "undefined") return null;
      return normalizePersistedSnapshot(raw);
    } finally {
      db.close();
    }
  },

  async save(snapshot: ContentSnapshot): Promise<void> {
    validateContentSnapshot(snapshot);
    const db = await openContentDb();
    try {
      // IMPORTANT: create the transaction and issue put() synchronously.
      // Do not await anything between transaction() and objectStore().put(),
      // otherwise browsers may auto-close the transaction and throw
      // TransactionInactiveError.
      const tx = db.transaction(CONTENT_STORE_NAME, "readwrite");
      const done = transactionToPromise(tx);
      const request = tx
        .objectStore(CONTENT_STORE_NAME)
        .put(snapshot, CONTENT_SNAPSHOT_KEY);

      await Promise.all([requestToPromise(request), done]);
    } finally {
      db.close();
    }
  },
};

let entityIdCounter = 0;
function makeEntityId(prefix: string) {
  entityIdCounter += 1;
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${entityIdCounter.toString(36)}`;
  return `${prefix}-${uuid}`;
}

/* ───────────────────────────── Store ──────────────────────── */

function useContentStore() {
  const initialSnapshotRef = useRef<ContentSnapshot>(createDefaultContentSnapshot());
  const snapshotRef = useRef<ContentSnapshot>(initialSnapshotRef.current);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());
  const persistenceReadyRef = useRef(false);

  const [videos, setVideos] = useState<Material[]>(initialSnapshotRef.current.videos);
  const [pdfs, setPdfs] = useState<Material[]>(initialSnapshotRef.current.pdfs);
  const [expert, setExpert] = useState<Material[]>(initialSnapshotRef.current.expert);
  const [lives, setLives] = useState<LiveItem[]>(initialSnapshotRef.current.lives);
  const [events, setEvents] = useState<EventItem[]>(initialSnapshotRef.current.events);
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    initialSnapshotRef.current.announcements,
  );
  const [brokers, setBrokers] = useState<Broker[]>(initialSnapshotRef.current.brokers);
  const [discussions, setDiscussions] = useState<Discussion[]>(
    initialSnapshotRef.current.discussions,
  );
  const [settings, setSettings] = useState<PlatformSettings>(
    initialSnapshotRef.current.settings,
  );
  const [hydrated, setHydrated] = useState(false);
  const [persistenceState, setPersistenceState] =
    useState<PersistenceState>("hydrating");
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  const applySnapshot = useCallback((snapshot: ContentSnapshot) => {
    setVideos(snapshot.videos);
    setPdfs(snapshot.pdfs);
    setExpert(snapshot.expert);
    setLives(snapshot.lives);
    setEvents(snapshot.events);
    setAnnouncements(snapshot.announcements);
    setBrokers(snapshot.brokers);
    setDiscussions(snapshot.discussions);
    setSettings(snapshot.settings);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      persistenceReadyRef.current = false;
      setPersistenceState("hydrating");
      setPersistenceError(null);
      try {
        const saved = await contentPersistence.load();
        if (cancelled) return;

        // DEFAULTS are used only when there is no saved record.
        const snapshot = saved ?? createDefaultContentSnapshot();
        snapshotRef.current = snapshot;
        applySnapshot(snapshot);
        persistenceReadyRef.current = true;
        setPersistenceState("idle");
      } catch (error) {
        if (cancelled) return;
        persistenceReadyRef.current = false;
        const message =
          error instanceof Error ? error.message : "Gagal memuat data persistent.";
        setPersistenceError(message);
        setPersistenceState("error");
        // Keep defaults visible, but block writes until a successful reload.
        // This prevents a failed LOAD followed by an edit from overwriting
        // an existing IndexedDB record with defaults.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applySnapshot]);

  const commit = useCallback(
    (mutate: (current: ContentSnapshot) => ContentSnapshot): Promise<void> => {
      const run = async () => {
        if (!hydrated) {
          throw new Error("Persistence masih melakukan hydration. Coba lagi sebentar.");
        }
        if (!persistenceReadyRef.current) {
          throw new Error(
            "Persistence gagal dimuat. Reload halaman sebelum menyimpan agar snapshot lama tidak tertimpa.",
          );
        }

        const next = mutate(snapshotRef.current);
        const finalSnapshot: ContentSnapshot = {
          ...next,
          schemaVersion: 1,
          updatedAt: new Date().toISOString(),
        };

        validateContentSnapshot(finalSnapshot);
        setPersistenceState("saving");
        setPersistenceError(null);

        try {
          await contentPersistence.save(finalSnapshot);
          // React state is updated only after the IndexedDB transaction completed.
          snapshotRef.current = finalSnapshot;
          applySnapshot(finalSnapshot);
          setPersistenceState("saved");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Gagal menyimpan data.";
          setPersistenceError(message);
          setPersistenceState("error");
          throw error;
        }
      };

      // Serialize writes so rapid A+B+C+D edits cannot finish out of order.
      const queued = writeQueueRef.current.then(run, run);
      writeQueueRef.current = queued.catch(() => undefined);
      return queued;
    },
    [applySnapshot, hydrated],
  );

  const videoApi = useMemo(
    () => ({
      create: async (input: Omit<Material, "id" | "kind">) => {
        const id = makeEntityId("video");
        await commit((current) => ({
          ...current,
          videos: [...current.videos, { ...input, id, kind: "video" }],
        }));
        return id;
      },
      update: (id: string, patch: Partial<Material>) =>
        commit((current) => ({
          ...current,
          videos: current.videos.map((m) =>
            m.id === id ? { ...m, ...patch, id: m.id, kind: "video" } : m,
          ),
        })),
      remove: (id: string) =>
        commit((current) => ({
          ...current,
          videos: current.videos.filter((m) => m.id !== id),
        })),
    }),
    [commit],
  );

  const pdfApi = useMemo(
    () => ({
      create: async (input: Omit<Material, "id" | "kind">) => {
        const id = makeEntityId("pdf");
        await commit((current) => ({
          ...current,
          pdfs: [...current.pdfs, { ...input, id, kind: "pdf" }],
        }));
        return id;
      },
      update: (id: string, patch: Partial<Material>) =>
        commit((current) => ({
          ...current,
          pdfs: current.pdfs.map((m) =>
            m.id === id ? { ...m, ...patch, id: m.id, kind: "pdf" } : m,
          ),
        })),
      remove: (id: string) =>
        commit((current) => ({
          ...current,
          pdfs: current.pdfs.filter((m) => m.id !== id),
        })),
    }),
    [commit],
  );

  const expertApi = useMemo(
    () => ({
      create: async (input: Omit<Material, "id" | "kind">) => {
        const id = makeEntityId("expert");
        await commit((current) => ({
          ...current,
          expert: [...current.expert, { ...input, id, kind: "video" }],
        }));
        return id;
      },
      update: (id: string, patch: Partial<Material>) =>
        commit((current) => ({
          ...current,
          expert: current.expert.map((m) =>
            m.id === id ? { ...m, ...patch, id: m.id, kind: "video" } : m,
          ),
        })),
      remove: (id: string) =>
        commit((current) => ({
          ...current,
          expert: current.expert.filter((m) => m.id !== id),
        })),
    }),
    [commit],
  );

  const createLive = useCallback(
    async (input: Omit<LiveItem, "id">) => {
      const id = makeEntityId("live");
      await commit((current) => ({
        ...current,
        lives: [...current.lives, { ...input, id }],
      }));
      return id;
    },
    [commit],
  );
  const updateLive = useCallback(
    (id: string, patch: Partial<LiveItem>) =>
      commit((current) => ({
        ...current,
        lives: current.lives.map((item) =>
          item.id === id ? { ...item, ...patch, id: item.id } : item,
        ),
      })),
    [commit],
  );
  const deleteLive = useCallback(
    (id: string) =>
      commit((current) => ({
        ...current,
        lives: current.lives.filter((item) => item.id !== id),
      })),
    [commit],
  );

  const createEvent = useCallback(
    async (input: Omit<EventItem, "id">) => {
      const id = makeEntityId("evt");
      await commit((current) => ({
        ...current,
        events: [...current.events, { ...input, id }],
      }));
      return id;
    },
    [commit],
  );
  const updateEvent = useCallback(
    (id: string, patch: Partial<EventItem>) =>
      commit((current) => ({
        ...current,
        events: current.events.map((item) =>
          item.id === id ? { ...item, ...patch, id: item.id } : item,
        ),
      })),
    [commit],
  );
  const deleteEvent = useCallback(
    (id: string) =>
      commit((current) => ({
        ...current,
        events: current.events.filter((item) => item.id !== id),
      })),
    [commit],
  );

  const createAnnouncement = useCallback(
    async (input: Omit<Announcement, "id" | "createdAt">) => {
      const id = makeEntityId("ann");
      const createdAt = new Date().toISOString();
      await commit((current) => ({
        ...current,
        announcements: [{ ...input, id, createdAt }, ...current.announcements],
      }));
      return id;
    },
    [commit],
  );
  const updateAnnouncement = useCallback(
    (id: string, patch: Partial<Announcement>) =>
      commit((current) => ({
        ...current,
        announcements: current.announcements.map((item) =>
          item.id === id ? { ...item, ...patch, id: item.id } : item,
        ),
      })),
    [commit],
  );
  const deleteAnnouncement = useCallback(
    (id: string) =>
      commit((current) => ({
        ...current,
        announcements: current.announcements.filter((item) => item.id !== id),
      })),
    [commit],
  );

  const createBroker = useCallback(
    async (input: Omit<Broker, "id">) => {
      const id = makeEntityId("broker");
      await commit((current) => ({
        ...current,
        brokers: [...current.brokers, { ...input, id }],
      }));
      return id;
    },
    [commit],
  );
  const updateBroker = useCallback(
    (id: string, patch: Partial<Broker>) =>
      commit((current) => ({
        ...current,
        brokers: current.brokers.map((item) =>
          item.id === id ? { ...item, ...patch, id: item.id } : item,
        ),
      })),
    [commit],
  );
  const deleteBroker = useCallback(
    (id: string) =>
      commit((current) => ({
        ...current,
        brokers: current.brokers.filter((item) => item.id !== id),
      })),
    [commit],
  );

  const createDiscussion = useCallback(
    async (input: Omit<Discussion, "id" | "createdAt" | "replies">) => {
      const id = makeEntityId("disc");
      const createdAt = new Date().toISOString();
      await commit((current) => ({
        ...current,
        discussions: [
          { ...input, id, createdAt, replies: 0 },
          ...current.discussions,
        ],
      }));
      return id;
    },
    [commit],
  );
  const updateDiscussion = useCallback(
    (id: string, patch: Partial<Discussion>) =>
      commit((current) => ({
        ...current,
        discussions: current.discussions.map((item) =>
          item.id === id ? { ...item, ...patch, id: item.id } : item,
        ),
      })),
    [commit],
  );
  const deleteDiscussion = useCallback(
    (id: string) =>
      commit((current) => ({
        ...current,
        discussions: current.discussions.filter((item) => item.id !== id),
      })),
    [commit],
  );

  const updateSettings = useCallback(
    (patch: Partial<PlatformSettings>) =>
      commit((current) => ({
        ...current,
        settings: { ...current.settings, ...patch },
      })),
    [commit],
  );

  const allPublishedMaterials = useMemo(() => {
    const pub = (arr: Material[]) => arr.filter((m) => m.status === "published");
    return [...pub(videos), ...pub(pdfs), ...pub(expert)];
  }, [videos, pdfs, expert]);

  return {
    videos,
    pdfs,
    expert,
    lives,
    events,
    announcements,
    brokers,
    discussions,
    settings,
    allPublishedMaterials,
    hydrated,
    persistenceState,
    persistenceError,
    videoApi,
    pdfApi,
    expertApi,
    createLive,
    updateLive,
    deleteLive,
    createEvent,
    updateEvent,
    deleteEvent,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    createBroker,
    updateBroker,
    deleteBroker,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    updateSettings,
  };
}

type Store = ReturnType<typeof useContentStore>;

/* ───────────────────────────── Primitives ─────────────────── */

const Surface = memo(function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`group relative overflow-hidden rounded-[16px] border border-[#4EA4FF]/[0.12] bg-[linear-gradient(145deg,rgba(12,31,55,0.94)_0%,rgba(6,17,32,0.97)_55%,rgba(4,11,22,0.99)_100%)] shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_-1px_0_rgba(22,119,255,0.08)_inset,0_20px_60px_-28px_rgba(0,0,0,0.9),0_14px_36px_-30px_rgba(30,126,255,0.6)] transition-all duration-500 hover:border-[#5EB2FF]/[0.22] ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
      />
      <div className="relative">{children}</div>
    </section>
  );
});

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3EA6FF]">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8B98AA]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function StatusState({
  icon: Icon = AlertCircle,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.09] bg-[#050B14] px-6 py-8 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#1677FF]/20 bg-[#1677FF]/10 text-[#3EA6FF]">
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-6 text-[#8B98AA]">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 text-xs font-medium text-[#B9C3D1] transition hover:border-[#1677FF]/30 hover:text-white"
    >
      <ArrowLeft size={14} /> Kembali
    </button>
  );
}

function FileUploadField({
  label,
  accept,
  currentUrl,
  onUploaded,
  onClear,
}: {
  label: string;
  accept: string;
  currentUrl?: string;
  onUploaded: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await readFileAsDataUrl(file);
      onUploaded(url);
      setInfo(`${file.name} · ${humanFileSize(file.size)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca file.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="block">
      <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#718096]">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#1677FF]/25 bg-[#1677FF]/10 px-3 text-xs font-semibold text-[#75BDFF] transition hover:border-[#1677FF]/40 disabled:opacity-50"
        >
          <Upload size={13} />
          {busy ? "Membaca…" : currentUrl ? "Ganti file" : "Pilih file"}
        </button>
        {currentUrl ? (
          <>
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] px-3 text-xs text-[#B9C3D1] hover:border-red-400/30 hover:text-red-300"
            >
              <X size={12} /> Hapus
            </button>
            <span className="text-[10px] text-[#637285]">
              {info ?? "File siap"}
            </span>
          </>
        ) : null}
      </div>
      {error ? (
        <span className="mt-1 block text-[10px] text-red-400">{error}</span>
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Visuals ────────────────────── */

function VideoThumb({
  title,
  durationMinutes,
  coverUrl,
}: {
  title: string;
  durationMinutes?: number;
  coverUrl?: string;
}) {
  const variant =
    Array.from(title).reduce((a, c) => a + c.charCodeAt(0), 0) % 3;
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#050B14]">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 320 180"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id={`vid-${variant}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#07111F" />
              <stop offset="100%" stopColor="#0A1626" />
            </linearGradient>
          </defs>
          <rect width="320" height="180" fill={`url(#vid-${variant})`} />
          {variant === 0 && (
            <path
              d="M0 140 L40 120 L80 130 L120 90 L160 100 L200 60 L240 70 L280 40 L320 50"
              fill="none"
              stroke="#1677FF"
              strokeWidth="2.5"
            />
          )}
          {variant === 1 && (
            <g>
              {[20, 60, 100, 140, 180, 220, 260, 300].map((x, i) => {
                const h = [50, 80, 40, 90, 60, 70, 55, 85][i];
                return (
                  <rect
                    key={x}
                    x={x}
                    y={180 - h}
                    width="14"
                    height={h}
                    rx="2"
                    fill="#1677FF"
                    opacity={0.5 + i * 0.05}
                  />
                );
              })}
            </g>
          )}
          {variant === 2 && (
            <g>
              <circle cx="160" cy="90" r="50" fill="none" stroke="#1677FF" strokeWidth="2" />
              <circle cx="160" cy="90" r="30" fill="#1677FF" opacity="0.15" />
            </g>
          )}
        </svg>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-[#1677FF]/90 shadow-[0_8px_30px_rgba(22,119,255,0.4)] backdrop-blur-sm">
          <Play size={18} className="ml-0.5 fill-white text-white" />
        </div>
      </div>
      {durationMinutes ? (
        <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 font-mono text-[10px] font-medium text-white backdrop-blur-sm">
          {String(Math.floor(durationMinutes / 60)).padStart(2, "0")}:
          {String(durationMinutes % 60).padStart(2, "0")}
        </div>
      ) : null}
    </div>
  );
}

function PdfCover({
  title,
  coverUrl,
}: {
  title: string;
  coverUrl?: string;
}) {
  const hue = 210 + (Array.from(title).reduce((a, c) => a + c.charCodeAt(0), 0) % 30);
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#050B14]">
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, hsl(${hue} 70% 12%) 0%, #050B14 70%)`,
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(22,119,255,0.25),transparent_60%)]" />
        </>
      )}
      <div className="relative flex h-full flex-col justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1677FF]/30 bg-[#1677FF]/10 backdrop-blur-sm">
            <FileText size={14} className="text-[#3EA6FF]" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#75BDFF]">
            PDF
          </span>
        </div>
        <div className="rounded-lg bg-black/40 p-3 backdrop-blur-sm">
          <div className="h-[2px] w-10 bg-[#1677FF]" />
          <div className="mt-3 line-clamp-3 text-xs font-semibold leading-5 text-white">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertVisual({
  imageUrl,
  title = "Expert Module",
  locked = true,
}: {
  imageUrl?: string;
  title?: string;
  locked?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [imageUrl]);

  const fallbackId = `expert-${Math.abs(
    Array.from(title).reduce((sum, char) => sum + char.charCodeAt(0), 0),
  )}`;
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/[0.07] bg-[#050B14]">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={title}
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <svg
          viewBox="0 0 320 180"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id={`${fallbackId}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#07111F" />
              <stop offset="100%" stopColor="#0A1626" />
            </linearGradient>
            <radialGradient id={`${fallbackId}-glow`} cx="80%" cy="15%" r="80%">
              <stop offset="0%" stopColor="#1677FF" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#1677FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="320" height="180" fill={`url(#${fallbackId}-bg)`} />
          <rect width="320" height="180" fill={`url(#${fallbackId}-glow)`} />
          <g stroke="#3EA6FF" strokeWidth="1.4" opacity="0.5" fill="none">
            <path d="M0 130 L40 110 L80 118 L120 88 L160 96 L200 62 L240 72 L280 42 L320 50" />
            <path
              d="M0 150 L40 130 L80 138 L120 108 L160 116 L200 82 L240 92 L280 62 L320 70"
              opacity="0.5"
            />
          </g>
        </svg>
      )}

      {locked ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#03070D]/58 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/50">
              <Lock size={18} className="text-white" />
            </div>
            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              Expert Access
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BrokerVisual({ kind, name }: { kind: Broker["visual"]; name: string }) {
  const id = `broker-${kind}`;
  const accent = kind === "hfm" ? "#3EA6FF" : kind === "kos" ? "#75BDFF" : "#A78BFA";
  return (
    <div className="relative h-full w-full overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#07111F" />
            <stop offset="100%" stopColor="#0A1626" />
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="80%" cy="15%" r="80%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
            <stop offset="100%" stopColor="#1677FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="180" fill={`url(#${id}-bg)`} />
        <rect width="320" height="180" fill={`url(#${id}-glow)`} />
        <g stroke="#3EA6FF" strokeWidth="1.2" opacity="0.35">
          <line x1="0" y1="120" x2="320" y2="60" />
          <line x1="0" y1="140" x2="320" y2="80" />
          <line x1="0" y1="100" x2="320" y2="40" />
        </g>
        <circle cx="240" cy="70" r="26" fill="none" stroke="#75BDFF" strokeWidth="1.5" />
        <circle
          cx="240"
          cy="70"
          r="42"
          fill="none"
          stroke="#75BDFF"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.6"
        />
        <text
          x="60"
          y="150"
          fill="#75BDFF"
          opacity="0.35"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
          fontSize="12"
          letterSpacing="2"
        >
          {name.toUpperCase()}
        </text>
      </svg>
    </div>
  );
}

function NewsImage({
  imageUrl,
  title,
  category,
}: {
  imageUrl?: string;
  title: string;
  category: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
    );
  }
  const id = `news-${Array.from(title).reduce((a, c) => a + c.charCodeAt(0), 0)}`;
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#07111F" />
          <stop offset="100%" stopColor="#0A1626" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="85%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#1677FF" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#1677FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      <rect width="320" height="180" fill={`url(#${id}-glow)`} />
      <g stroke="#3EA6FF" strokeWidth="1.4" opacity="0.4" fill="none">
        <path d="M0 130 L40 110 L80 118 L120 88 L160 96 L200 62 L240 72 L280 42 L320 50" />
      </g>
      <text
        x="20"
        y="160"
        fill="#75BDFF"
        opacity="0.55"
        fontFamily="ui-sans-serif, system-ui, -apple-system"
        fontSize="11"
        letterSpacing="1.5"
      >
        {category.toUpperCase()}
      </text>
    </svg>
  );
}

function TopicVisual({
  kind,
}: {
  kind: "calendar" | "world" | "event" | "live" | "announcement";
}) {
  const id = `topic-${kind}`;
  return (
    <svg
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#07111F" />
          <stop offset="100%" stopColor="#0A1626" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="80%" cy="15%" r="80%">
          <stop offset="0%" stopColor="#1677FF" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#1677FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill={`url(#${id}-bg)`} />
      <rect width="320" height="180" fill={`url(#${id}-glow)`} />
      {kind === "calendar" && (
        <g stroke="#3EA6FF" strokeWidth="1.4" opacity="0.5" fill="none">
          <rect x="80" y="40" width="160" height="100" rx="8" />
          <line x1="80" y1="66" x2="240" y2="66" />
          {[100, 120, 140, 160, 180, 200].map((x) => (
            <line key={x} x1={x} y1="66" x2={x} y2="140" />
          ))}
          {[86, 106].map((y) => (
            <line key={y} x1="80" y1={y} x2="240" y2={y} />
          ))}
        </g>
      )}
      {kind === "world" && (
        <g stroke="#3EA6FF" strokeWidth="1.4" opacity="0.5" fill="none">
          <circle cx="160" cy="90" r="52" />
          <ellipse cx="160" cy="90" rx="52" ry="20" />
          <ellipse cx="160" cy="90" rx="20" ry="52" />
          <line x1="160" y1="38" x2="160" y2="142" />
          <line x1="108" y1="90" x2="212" y2="90" />
        </g>
      )}
      {kind === "event" && (
        <g stroke="#3EA6FF" strokeWidth="1.4" opacity="0.5" fill="none">
          <rect x="70" y="50" width="180" height="90" rx="10" />
          <circle cx="110" cy="80" r="10" />
          <line x1="135" y1="76" x2="220" y2="76" />
          <line x1="135" y1="94" x2="200" y2="94" />
          <line x1="100" y1="115" x2="220" y2="115" />
        </g>
      )}
      {kind === "live" && (
        <g stroke="#3EA6FF" strokeWidth="1.4" opacity="0.5" fill="none">
          <rect x="60" y="55" width="200" height="80" rx="8" />
          <circle cx="160" cy="95" r="16" />
          <path d="M155 88 L170 95 L155 102 Z" fill="#75BDFF" opacity="0.8" />
          <line x1="70" y1="45" x2="100" y2="45" />
          <line x1="220" y1="145" x2="250" y2="145" />
        </g>
      )}
      {kind === "announcement" && (
        <g stroke="#3EA6FF" strokeWidth="1.4" opacity="0.5" fill="none">
          <path d="M80 80 L160 60 L160 120 L80 100 Z" />
          <line x1="160" y1="60" x2="230" y2="40" />
          <line x1="160" y1="120" x2="230" y2="140" />
          <line x1="80" y1="80" x2="80" y2="100" />
        </g>
      )}
    </svg>
  );
}

/* ───────────────────────────── Clock ──────────────────────── */

const WibClock = memo(function WibClock({ compact = false }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => getWibParts());

  useEffect(() => {
    setMounted(true);
    setNow(getWibParts());
    const t = window.setInterval(() => setNow(getWibParts()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (!mounted) {
    return compact ? (
      <span className="font-mono text-xs tabular-nums text-[#8B98AA]">
        --:--:-- WIB
      </span>
    ) : (
      <div className="h-8 w-32 animate-pulse rounded bg-white/[0.05]" />
    );
  }
  if (compact)
    return (
      <span className="font-mono text-xs tabular-nums text-[#B9C3D1]">
        {now.timeStr} WIB
      </span>
    );
  return (
    <div>
      <div className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-white">
        {now.timeStr}
      </div>
      <div className="mt-1 text-xs text-[#8B98AA]">{now.dateStr} · WIB</div>
    </div>
  );
});

/* ───────────────────────────── TradingView widget ─────────── */

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

let tvPromise: Promise<void> | null = null;

function loadTvScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.TradingView) return Promise.resolve();
  if (tvPromise) return tvPromise;
  tvPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-noxveil-tv="1"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("TV load fail")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.dataset.noxveilTv = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TV load fail"));
    document.head.appendChild(script);
  });
  return tvPromise;
}

function TradingViewWidget({
  symbol,
  interval,
  height = 480,
}: {
  symbol: string;
  interval: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef(
    `noxveil-tv-${Math.abs(
      Array.from(symbol + interval).reduce((a, c) => a + c.charCodeAt(0), 0),
    )}-${Date.now().toString(36)}`,
  );
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    async function mount() {
      try {
        await loadTvScript();
        if (cancelled) return;
        const container = containerRef.current;
        if (!container || !window.TradingView) {
          if (!cancelled) setStatus("error");
          return;
        }
        container.innerHTML = `<div id="${widgetId.current}" style="height:100%;width:100%"></div>`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new (window.TradingView as any).widget({
          container_id: widgetId.current,
          autosize: true,
          symbol,
          interval,
          timezone: "Asia/Jakarta",
          theme: "dark",
          style: "1",
          locale: "id",
          toolbar_bg: "#050B14",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          withdateranges: true,
          allow_symbol_change: true,
          studies: [],
        });
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }
    void mount();
    return () => {
      cancelled = true;
    };
  }, [symbol, interval]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-[#050B14]"
      style={{ height }}
    >
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#050B14]/80">
          <div className="flex items-center gap-2 text-xs text-[#8B98AA]">
            <RefreshCw size={14} className="animate-spin" />
            Memuat chart resmi TradingView…
          </div>
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#050B14] p-6 text-center">
          <AlertCircle size={22} className="text-[#3EA6FF]" />
          <div className="text-sm font-semibold text-white">
            TradingView widget gagal dimuat
          </div>
          <p className="max-w-md text-xs leading-5 text-[#8B98AA]">
            Chart tidak dapat dimuat (kemungkinan network/adblocker).
          </p>
          <a
            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(
              symbol,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#1677FF]/30 bg-[#1677FF]/10 px-3 py-1.5 text-xs text-[#75BDFF]"
          >
            <ExternalLink size={13} /> Buka di TradingView
          </a>
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Sidebar ────────────────────── */

const Sidebar = memo(function Sidebar({
  role,
  activePage,
  collapsed,
  mobileOpen,
  onNavigate,
  onToggleCollapsed,
  onCloseMobile,
  onSwitchRole,
}: {
  role: Role;
  activePage: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: (p: PageId) => void;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
  onSwitchRole: (r: Role) => void;
}) {
  const groups = role === "owner" ? NAV_OWNER : NAV_MEMBER;
  const sidebarWidth = collapsed ? "lg:w-[86px]" : "lg:w-[280px]";

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-[#58A9FF]/[0.09] bg-[linear-gradient(180deg,#07111F_0%,#050C17_45%,#030912_100%)] shadow-[1px_0_0_rgba(255,255,255,0.035)_inset,28px_0_70px_-36px_rgba(0,0,0,0.95)] transition-[transform,width] duration-200 lg:static lg:translate-x-0 ${sidebarWidth} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div
          className={`flex h-[68px] items-center border-b border-white/[0.07] ${
            collapsed ? "lg:justify-center lg:px-2" : "px-4"
          }`}
        >
          <button
            type="button"
            onClick={() =>
              onNavigate(role === "owner" ? "owner-dashboard" : "dashboard")
            }
            className="flex min-w-0 items-center gap-3 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1677FF]/25 bg-[#1677FF]/10 shadow-[0_0_24px_rgba(22,119,255,0.2)]">
              <span className="text-sm font-semibold text-[#5DB1FF]">N/A</span>
            </div>
            <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <div className="truncate text-[13px] font-semibold tracking-[0.12em] text-white">
                NOXVEIL ARCANUM
              </div>
              <div className="mt-0.5 truncate text-[10px] text-[#718096]">
                {role === "owner" ? "Owner Studio" : "Private Trading Community"}
              </div>
            </div>
          </button>
          <button
            type="button"
            aria-label="Tutup sidebar"
            onClick={onCloseMobile}
            className="ml-auto rounded-lg p-2 text-[#8B98AA] hover:bg-white/[0.05] hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4 [scrollbar-width:thin]">
          {groups.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <div
                className={`mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#526173] ${
                  collapsed ? "lg:hidden" : ""
                }`}
              >
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;
                  return (
                    <button
                      type="button"
                      key={`${group.label}-${item.id}`}
                      title={collapsed ? item.label : undefined}
                      onClick={() => onNavigate(item.id)}
                      className={`group flex h-10 w-full items-center rounded-xl text-[13px] transition-colors ${
                        collapsed ? "lg:justify-center lg:px-0" : "gap-3 px-3"
                      } ${
                        active
                          ? "border border-[#1677FF]/20 bg-[#1677FF]/10 text-white"
                          : "border border-transparent text-[#8B98AA] hover:bg-white/[0.035] hover:text-[#DCE6F2]"
                      }`}
                    >
                      <Icon
                        size={17}
                        strokeWidth={1.8}
                        className={active ? "text-[#3EA6FF]" : "text-[#718096]"}
                      />
                      <span
                        className={`truncate font-medium ${
                          collapsed ? "lg:hidden" : ""
                        }`}
                      >
                        {item.label}
                      </span>
                      {active && !collapsed ? (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#3EA6FF]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/[0.07] p-3">
          <div
            className={`mb-2 flex items-center ${
              collapsed ? "lg:justify-center" : "gap-3 px-2"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0E1C2E] text-xs font-semibold text-[#B9C3D1]">
              {role === "owner" ? "O" : "M"}
            </div>
            <div className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}>
              <div className="truncate text-xs font-medium text-white">
                {role === "owner" ? "Owner" : "Member"}
              </div>
              <div className="truncate text-[10px] text-[#718096]">
                {role === "owner" ? "Full access" : "Membership active"}
              </div>
            </div>
          </div>
          <div className={`mb-2 ${collapsed ? "lg:hidden" : ""}`}>
            <button
              type="button"
              onClick={() => onSwitchRole(role === "owner" ? "member" : "owner")}
              className="flex h-8 w-full items-center justify-center rounded-lg border border-[#1677FF]/20 bg-[#1677FF]/[0.06] text-[10px] font-medium text-[#75BDFF]"
            >
              Switch to {role === "owner" ? "Member" : "Owner"} view
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Toggle sidebar"
          className="absolute -right-3 top-20 hidden h-7 w-7 items-center justify-center rounded-full border border-white/[0.09] bg-[#0B1625] text-[#8B98AA] shadow-xl hover:text-white lg:flex"
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </aside>
    </>
  );
});

/* ───────────────────────────── Notifications ──────────────── */

type NotificationItem = {
  id: string;
  kind: "announcement" | "event" | "live";
  title: string;
  description: string;
  timestamp: string;
  page: PageId;
};

function buildNotifications(
  announcements: Announcement[],
  events: EventItem[],
  lives: LiveItem[],
): NotificationItem[] {
  const items: NotificationItem[] = [];
  announcements
    .filter((a) => a.status === "published")
    .slice(0, 3)
    .forEach((a) =>
      items.push({
        id: `ann-${a.id}`,
        kind: "announcement",
        title: a.title,
        description: a.body.slice(0, 100) + (a.body.length > 100 ? "…" : ""),
        timestamp: a.createdAt,
        page: "announcements",
      }),
    );
  events
    .filter((e) => e.status === "published")
    .slice(0, 2)
    .forEach((e) =>
      items.push({
        id: `evt-${e.id}`,
        kind: "event",
        title: e.title,
        description: `${formatDateOnly(e.date)} · ${e.time} WIB`,
        timestamp: new Date(`${e.date}T${e.time}`).toISOString(),
        page: "events",
      }),
    );
  lives.slice(0, 2).forEach((l) =>
    items.push({
      id: `live-${l.id}`,
      kind: "live",
      title: l.title,
      description:
        l.status === "live" ? "Sedang berlangsung" : formatDateTime(l.scheduledAt),
      timestamp: l.scheduledAt,
      page: "live",
    }),
  );
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 6);
}

function NotificationButton({
  items,
  onNavigate,
}: {
  items: NotificationItem[];
  onNavigate: (p: PageId) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#07111F] text-[#8B98AA] hover:text-white"
      >
        <Bell size={17} />
        {items.length ? (
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#3EA6FF]" />
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-[46px] z-50 w-[320px] overflow-hidden rounded-xl border border-white/[0.09] bg-[#08111D] shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:w-[340px]">
          <div className="border-b border-white/[0.06] px-4 py-3 text-xs font-semibold text-white">
            Notifikasi
          </div>
          {items.length ? (
            <div className="max-h-[380px] overflow-y-auto p-1.5">
              {items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => {
                    onNavigate(it.page);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#1677FF]/[0.08]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0E1C2E] text-[#3EA6FF]">
                    {it.kind === "announcement" ? (
                      <Megaphone size={14} />
                    ) : it.kind === "event" ? (
                      <Calendar size={14} />
                    ) : (
                      <Radio size={14} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium text-white">
                      {it.title}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[10px] text-[#718096]">
                      {it.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-xs text-[#718096]">
              Belum ada notifikasi.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ───────────────────────────── Topbar ─────────────────────── */

function Topbar({
  role,
  onOpenMobile,
  store,
  onNavigate,
  onOpenMaterial,
}: {
  role: Role;
  onOpenMobile: () => void;
  store: Store;
  onNavigate: (p: PageId) => void;
  onOpenMaterial: (
    collection: "video" | "pdf" | "expert",
    id: string,
  ) => void;
}) {
  const market = useMarketFeed();
  const marketReady =
    market.integration.status === "ready" ? market.integration.data : null;
  const marketPrice = marketReady ? marketPrimaryValue(marketReady) : undefined;
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("id-ID");

  const results = useMemo(() => {
    if (normalized.length < 2) return [] as Array<{
      id: string;
      label: string;
      sub: string;
      onOpen: () => void;
      kind: string;
    }>;
    const m = (s: string) => s.toLocaleLowerCase("id-ID").includes(normalized);
    const out: Array<{
      id: string;
      label: string;
      sub: string;
      onOpen: () => void;
      kind: string;
    }> = [];
    store.videos.forEach((v) => {
      if (role !== "owner" && v.status !== "published") return;
      if (m(`${v.title} ${v.description}`))
        out.push({
          id: `v-${v.id}`,
          label: v.title,
          sub: "Basic Video",
          onOpen: () => onOpenMaterial("video", v.id),
          kind: "video",
        });
    });
    store.pdfs.forEach((p) => {
      if (role !== "owner" && p.status !== "published") return;
      if (m(`${p.title} ${p.description}`))
        out.push({
          id: `p-${p.id}`,
          label: p.title,
          sub: "PDF Resource",
          onOpen: () => onOpenMaterial("pdf", p.id),
          kind: "pdf",
        });
    });
    store.expert.forEach((e) => {
      if (role !== "owner" && e.status !== "published") return;
      if (m(`${e.title} ${e.description}`))
        out.push({
          id: `e-${e.id}`,
          label: e.title,
          sub: e.expert?.locked === false ? "Expert · Available" : "Expert · Locked",
          onOpen: () => onOpenMaterial("expert", e.id),
          kind: "expert",
        });
    });
    store.announcements.forEach((a) => {
      if (a.status !== "published") return;
      if (m(`${a.title} ${a.body}`))
        out.push({
          id: `a-${a.id}`,
          label: a.title,
          sub: "Announcement",
          onOpen: () => onNavigate("announcements"),
          kind: "announcement",
        });
    });
    store.events.forEach((e) => {
      if (e.status !== "published") return;
      if (m(`${e.title} ${e.description}`))
        out.push({
          id: `ev-${e.id}`,
          label: e.title,
          sub: `Event · ${formatDateOnly(e.date)}`,
          onOpen: () => onNavigate("events"),
          kind: "event",
        });
    });
    store.brokers.forEach((b) => {
      if (role !== "owner" && b.status !== "published") return;
      if (m(`${b.name} ${b.description}`))
        out.push({
          id: `b-${b.id}`,
          label: b.name,
          sub: "Broker",
          onOpen: () => onNavigate("brokers"),
          kind: "broker",
        });
    });
    return out.slice(0, 8);
  }, [normalized, role, store, onNavigate, onOpenMaterial]);

  const notifications = useMemo(
    () => buildNotifications(store.announcements, store.events, store.lives),
    [store.announcements, store.events, store.lives],
  );

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-3 border-b border-[#5BAEFF]/[0.08] bg-[linear-gradient(90deg,rgba(3,8,15,0.9),rgba(5,14,27,0.86),rgba(3,8,15,0.9))] px-4 backdrop-blur-2xl md:px-6">
      <button
        type="button"
        aria-label="Buka menu"
        onClick={onOpenMobile}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#07111F] text-[#B9C3D1] hover:text-white lg:hidden"
      >
        <Menu size={18} />
      </button>

      <div className="relative w-full max-w-[520px]">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66768A]"
        />
        <input
          aria-label="Cari konten"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari video, PDF, event, broker…"
          className="h-10 w-full rounded-xl border border-[#5AAEFF]/[0.1] bg-[linear-gradient(180deg,rgba(8,20,36,0.94),rgba(5,13,24,0.94))] pl-10 pr-10 text-sm text-white outline-none placeholder:text-[#5C6A7A] focus:border-[#3C98FF]/50"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#718096] hover:text-white"
          >
            <X size={14} />
          </button>
        ) : null}
        {normalized.length >= 2 ? (
          <div className="absolute left-0 right-0 top-[46px] z-50 overflow-hidden rounded-xl border border-white/[0.09] bg-[#08111D] shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
            {results.length ? (
              <div className="max-h-[400px] overflow-y-auto p-1.5">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      r.onOpen();
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-[#1677FF]/[0.08]"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0E1C2E] text-[#3EA6FF]">
                      {r.kind === "video" ? (
                        <Video size={14} />
                      ) : r.kind === "pdf" ? (
                        <FileText size={14} />
                      ) : r.kind === "expert" ? (
                        <Lock size={14} />
                      ) : r.kind === "announcement" ? (
                        <Megaphone size={14} />
                      ) : r.kind === "event" ? (
                        <Calendar size={14} />
                      ) : (
                        <MapPin size={14} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-white">
                        {r.label}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-[#718096]">
                        {r.sub}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-center text-xs text-[#718096]">
                Tidak ada konten yang cocok.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-[#07111F] px-3 py-2 xl:flex">
          <Clock size={14} className="text-[#3EA6FF]" />
          <WibClock compact />
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-[#07111F] px-3 py-2 lg:flex">
          <span
            className={`h-2 w-2 rounded-full ${
              marketReady?.status === "live"
                ? "bg-[#3298FF] motion-safe:animate-pulse"
                : marketReady
                  ? "bg-[#75879B]"
                  : market.integration.status === "loading" ||
                      market.integration.status === "idle"
                    ? "bg-[#3298FF] motion-safe:animate-pulse"
                    : "bg-[#607080]"
            }`}
          />
          <span className="font-mono text-[11px] text-[#8B98AA]">
            {marketReady && typeof marketPrice === "number"
              ? `XAUUSD ${marketPrice.toFixed(2)} · ${marketReady.status.toUpperCase()}`
              : market.integration.status === "loading" ||
                  market.integration.status === "idle"
                ? "XAUUSD connecting"
                : "XAUUSD disconnected"}
          </span>
        </div>
        <NotificationButton items={notifications} onNavigate={onNavigate} />
        <div className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-[#07111F] px-2.5 py-1.5 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0E1C2E] text-[10px] font-semibold text-[#B9C3D1]">
            {role === "owner" ? "O" : "M"}
          </div>
          <div className="hidden md:block">
            <div className="text-[11px] font-medium text-white">
              {role === "owner" ? "Owner" : "Member"}
            </div>
            <div className="text-[9px] text-[#718096]">
              {role === "owner" ? "Studio" : "Active"}
            </div>
          </div>
          <ChevronDown size={13} className="text-[#5E6D7E]" />
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────────── Dashboard home ─────────────── */

function MarketSparkline({
  points,
  compact = false,
}: {
  points: MarketHistoryPoint[];
  compact?: boolean;
}) {
  const valid = points.filter(
    (point) => Number.isFinite(point.value) && Number.isFinite(point.timestamp),
  );

  if (valid.length < 2) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#030A13] ${
          compact ? "h-28" : "h-full min-h-[180px]"
        }`}
      >
        <div className="absolute inset-0 opacity-[0.7] bg-[linear-gradient(rgba(73,132,193,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(73,132,193,.04)_1px,transparent_1px)] bg-[size:34px_34px]" />
        <div className="relative flex h-full items-center justify-between gap-4 px-4">
          <div>
            <div className="text-[8px] font-semibold uppercase tracking-[0.18em] text-[#60758C]">
              Verified Series
            </div>
            <div className="mt-1.5 text-xs font-semibold text-[#D6E0EA]">
              COLLECTING LIVE SAMPLES
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-semibold text-[#73B7FF]">
              {valid.length}/2
            </div>
            <div className="mt-1 text-[8px] uppercase tracking-[0.12em] text-[#52657A]">
              no chart until verified
            </div>
          </div>
        </div>
      </div>
    );
  }

  const values = valid.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, Math.max(Math.abs(max) * 0.00005, 0.01));
  const coordinates = valid.map((point, index) => {
    const x = (index / (valid.length - 1)) * 100;
    const y = 84 - ((point.value - min) / range) * 68;
    return { x, y };
  });
  const line = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L100 100 L0 100 Z`;
  const latest = coordinates[coordinates.length - 1];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-[#4C9DFF]/[0.12] bg-[linear-gradient(160deg,#04101E,#02070D)] ${
        compact ? "h-28" : "h-full min-h-[180px]"
      }`}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(73,132,193,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(73,132,193,.045)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-label="XAUUSD live sample series"
      >
        <defs>
          <linearGradient id="nx-market-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1677FF" />
            <stop offset="100%" stopColor="#73B7FF" />
          </linearGradient>
          <linearGradient id="nx-market-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1677FF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1677FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#nx-market-area)" />
        <path
          d={line}
          fill="none"
          stroke="url(#nx-market-line)"
          strokeWidth="1.65"
          vectorEffect="non-scaling-stroke"
          className="nx-verified-line"
        />
        <circle
          cx={latest.x}
          cy={latest.y}
          r="1.8"
          fill="#8DCCFF"
          className="motion-safe:animate-pulse"
        />
      </svg>
      <div className="absolute bottom-3 left-3 rounded-md border border-white/[0.06] bg-black/35 px-2 py-1 text-[8px] uppercase tracking-[0.14em] text-[#688099] backdrop-blur-sm">
        Verified API samples · {valid.length}
      </div>
    </div>
  );
}

function MarketConnectionVisual({
  status,
}: {
  status: "connecting" | "disconnected";
}) {
  return (
    <div className="relative h-full min-h-[180px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#030A13]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(73,132,193,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(73,132,193,.045)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="nx-market-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3298FF]/35 to-transparent" />
      <div className="absolute -right-12 top-1/4 h-40 w-40 rounded-full bg-[#1677FF]/[0.07] blur-3xl" />
      <div className="absolute inset-y-0 left-[18%] w-px bg-gradient-to-b from-transparent via-[#315B84]/15 to-transparent" />
      <div className="absolute inset-y-0 right-[24%] w-px bg-gradient-to-b from-transparent via-[#315B84]/10 to-transparent" />
      <div className="relative flex h-full min-h-[180px] flex-col justify-between p-5">
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#60758C]">
            Market Feed
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                status === "connecting"
                  ? "bg-[#3298FF] motion-safe:animate-pulse"
                  : "bg-[#617286]"
              }`}
            />
            <span className="text-sm font-semibold text-[#D8E2EC]">
              {status === "connecting" ? "CONNECTING..." : "DISCONNECTED"}
            </span>
          </div>
        </div>
        <div className="text-xs leading-5 text-[#6F8196]">
          {status === "connecting"
            ? "Waiting for verified XAUUSD market data."
            : "No verified market quote is available. No synthetic price or chart is being shown."}
        </div>
      </div>
    </div>
  );
}

function HeroPanel({
  settings,
  onNavigate,
}: {
  settings: PlatformSettings;
  onNavigate: (p: PageId) => void;
}) {
  const market = useMarketFeed();
  const parts = settings.tagline.split(".");
  const a = (parts[0] ?? "Trade With Mega bintang").trim();
  const b = (parts[1] ?? "Learn With Discipline").trim();
  const ready =
    market.integration.status === "ready" ? market.integration.data : null;
  const price = ready ? marketPrimaryValue(ready) : undefined;

  return (
    <div className="nx-terminal-hero relative overflow-hidden rounded-[22px] border border-[#54A9FF]/[0.14] bg-[linear-gradient(118deg,rgba(7,21,39,.985)_0%,rgba(4,14,27,.99)_48%,rgba(2,7,13,1)_100%)] shadow-[0_1px_0_rgba(255,255,255,.055)_inset,0_34px_90px_-42px_rgba(0,0,0,.95)]">
      <style>{`
        @keyframes nxAmbientDrift { 0%,100% { transform: translate3d(-2%,0,0) scale(1); opacity:.55 } 50% { transform: translate3d(3%,1%,0) scale(1.04); opacity:.8 } }
        @keyframes nxMarketScan { 0% { transform: translateY(-30px); opacity:0 } 12% { opacity:.28 } 88% { opacity:.18 } 100% { transform: translateY(230px); opacity:0 } }
        @keyframes nxGeometryDrift { 0%,100% { transform: translate3d(0,0,0) } 50% { transform: translate3d(12px,-7px,0) } }
        @keyframes nxVerifiedLine { 0%,100% { opacity:.78; filter:drop-shadow(0 0 3px rgba(50,152,255,.12)); } 50% { opacity:1; filter:drop-shadow(0 0 7px rgba(50,152,255,.28)); } }
        .nx-ambient-drift { animation: nxAmbientDrift 14s ease-in-out infinite; }
        .nx-market-scan { animation: nxMarketScan 7s linear infinite; }
        .nx-geometry-drift { animation: nxGeometryDrift 18s ease-in-out infinite; }
        .nx-verified-line { animation: nxVerifiedLine 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .nx-ambient-drift,.nx-market-scan,.nx-geometry-drift,.nx-verified-line { animation: none !important; }
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-[0.055] bg-[linear-gradient(rgba(115,183,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(115,183,255,.45)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="nx-ambient-drift absolute -right-[8%] -top-[45%] h-[520px] w-[520px] rounded-full bg-[#1677FF]/[0.14] blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_105%,rgba(22,119,255,.15),transparent_38%),radial-gradient(circle_at_85%_5%,rgba(74,154,255,.10),transparent_34%)]" />
        <div className="nx-geometry-drift absolute right-[8%] top-[22%] h-px w-[34%] rotate-[-8deg] bg-gradient-to-r from-transparent via-[#5E9DDA]/20 to-transparent" />
        <div className="nx-geometry-drift absolute right-[18%] top-[58%] h-px w-[29%] rotate-[7deg] bg-gradient-to-r from-transparent via-[#376C9E]/15 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,.34)_100%)]" />
      </div>

      <div className="relative grid min-h-[252px] gap-5 p-5 md:p-6 lg:grid-cols-[1.24fr_1fr] lg:items-center xl:p-7">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#1677FF]/20 bg-[#0B1B30]/70 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.19em] text-[#73B7FF] backdrop-blur-sm">
            <Sparkles size={11} /> NOXVEIL Market Command Center
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-[1.04] tracking-[-0.035em] text-[#F3F7FB] md:text-4xl xl:text-[44px]">
            {a}.
            <br />
            <span className="text-[#73B7FF]">{b}.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#8799AE]">
            {settings.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("chart")}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1677FF] px-5 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(22,119,255,.25)] transition duration-200 hover:bg-[#2387FF]"
            >
              <LineChart size={15} /> Buka Chart XAUUSD
            </button>
            <button
              type="button"
              onClick={() => onNavigate("videos")}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-5 text-xs font-semibold text-[#D7E1EB] transition duration-200 hover:border-[#1677FF]/25 hover:bg-white/[0.04]"
            >
              <Video size={15} /> Mulai Belajar
            </button>
          </div>
        </div>

        <div className="relative hidden h-[210px] lg:block">
          {ready && typeof price === "number" ? (
            <div className="grid h-full grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-[#4C9DFF]/[0.14] bg-[#030A13]/90 shadow-[0_22px_60px_-36px_rgba(22,119,255,.5)] backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.055] px-4 py-3.5">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#60758C]">
                    XAUUSD · GOLD / US DOLLAR
                  </div>
                  <div className="mt-1 font-mono text-[28px] font-semibold tracking-[-0.035em] text-[#F5F8FB]">
                    {price.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] ${
                    ready.status === "live"
                      ? "border-[#3298FF]/25 bg-[#1677FF]/10 text-[#8DCCFF]"
                      : "border-white/[0.08] bg-white/[0.03] text-[#8090A2]"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      ready.status === "live"
                        ? "bg-[#3298FF] motion-safe:animate-pulse"
                        : "bg-[#708195]"
                    }`} />
                    {ready.status}
                  </div>
                  <div className="mt-2 text-[8px] uppercase tracking-[0.12em] text-[#52657A]">
                    {ready.provider ?? "Market API"}
                  </div>
                </div>
              </div>
              <div className="p-3">
                <MarketSparkline points={market.history} compact />
              </div>
            </div>
          ) : (
            <MarketConnectionVisual
              status={
                market.integration.status === "loading" ||
                market.integration.status === "idle"
                  ? "connecting"
                  : "disconnected"
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

function MarketStatusCard({
  onNavigate,
}: {
  onNavigate: (p: PageId) => void;
}) {
  const market = useMarketFeed();
  const ready =
    market.integration.status === "ready" ? market.integration.data : null;
  const price = ready ? marketPrimaryValue(ready) : undefined;

  const metrics = ready
    ? [
        typeof price === "number"
          ? ["Price", price.toFixed(2)]
          : null,
        typeof ready.change === "number"
          ? [
              "Change",
              `${ready.change > 0 ? "+" : ""}${ready.change.toFixed(2)}`,
            ]
          : null,
        typeof ready.changePercent === "number"
          ? [
              "Change %",
              `${ready.changePercent > 0 ? "+" : ""}${ready.changePercent.toFixed(2)}%`,
            ]
          : null,
        typeof ready.bid === "number"
          ? ["Bid", ready.bid.toFixed(2)]
          : null,
        typeof ready.ask === "number"
          ? ["Ask", ready.ask.toFixed(2)]
          : null,
        typeof ready.bid === "number" && typeof ready.ask === "number"
          ? ["Spread", (ready.ask - ready.bid).toFixed(2)]
          : null,
        typeof ready.high === "number"
          ? ["High", ready.high.toFixed(2)]
          : null,
        typeof ready.low === "number"
          ? ["Low", ready.low.toFixed(2)]
          : null,
      ].filter((metric): metric is string[] => Boolean(metric))
    : [];

  return (
    <Surface className="overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.055] px-5 py-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#667A90]">
            Market Overview
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <h2 className="text-lg font-semibold text-[#F1F5F9]">XAUUSD</h2>
            <span className="text-[10px] uppercase tracking-[0.13em] text-[#52657A]">
              Gold / US Dollar
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] ${
            ready?.status === "live"
              ? "border-[#3298FF]/25 bg-[#1677FF]/10 text-[#8DCCFF]"
              : ready
                ? "border-white/[0.08] bg-white/[0.03] text-[#8494A7]"
                : "border-white/[0.07] bg-[#030912] text-[#65788D]"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              ready?.status === "live"
                ? "bg-[#3298FF] motion-safe:animate-pulse"
                : "bg-[#66788C]"
            }`} />
            {ready
              ? ready.status
              : market.integration.status === "loading" ||
                  market.integration.status === "idle"
                ? "connecting"
                : "disconnected"}
          </div>
          <button
            type="button"
            onClick={() => void refreshMarketFeed()}
            disabled={market.refreshing}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-[#030912] text-[#7E91A6] transition hover:border-[#1677FF]/25 hover:text-white disabled:opacity-50"
            aria-label="Refresh XAUUSD feed"
          >
            <RefreshCw
              size={12}
              className={market.refreshing ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {ready ? (
        <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,.9fr)]">
          <div>
            {metrics.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                {metrics.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.055] bg-[#030A13] px-3 py-3"
                  >
                    <div className="text-[8px] font-semibold uppercase tracking-[0.15em] text-[#52657A]">
                      {label}
                    </div>
                    <div className="mt-1.5 truncate font-mono text-sm font-semibold text-[#EAF0F6]">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.05] pt-3 text-[9px] uppercase tracking-[0.11em] text-[#5E7288]">
              <span>{ready.provider ?? "Market API"}</span>
              <span>
                Last update{" "}
                {formatWibDateTime(ready.timestamp ?? ready.receivedAt)}
              </span>
              {market.message ? (
                <span className="normal-case tracking-normal text-[#7D8FA2]">
                  {market.message}
                </span>
              ) : null}
            </div>
          </div>

          <MarketSparkline points={market.history} compact />
        </div>
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div className="rounded-xl border border-white/[0.055] bg-[#030A13] p-4">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#60758C]">
              Data Connection
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#687A8E]" />
              <span className="text-sm font-semibold text-[#D6E0EA]">
                {market.integration.status === "loading" ||
                market.integration.status === "idle"
                  ? "CONNECTING"
                  : "DISCONNECTED"}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-[#75879B]">
              {market.integration.status === "error"
                ? market.integration.message
                : "Waiting for verified XAUUSD data from /api/market. No price, percentage, or market direction is fabricated."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("chart")}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-[#1677FF]/20 bg-[#1677FF]/[0.07] px-4 text-xs font-semibold text-[#8DCCFF]"
          >
            <LineChart size={13} /> TradingView
          </button>
        </div>
      )}
    </Surface>
  );
}

function LearningProgressCard({
  hydrated,
  overallPercent,
  completedCount,
  totalCount,
  currentTitle,
  onContinue,
}: {
  hydrated: boolean;
  overallPercent: number | null;
  completedCount: number;
  totalCount: number;
  currentTitle?: string;
  onContinue: () => void;
}) {
  const percent = overallPercent ?? 0;
  return (
    <Surface className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.055] px-5 py-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#667A90]">
            Learning Progress
          </div>
          <h2 className="mt-1 text-base font-semibold text-[#EEF3F8]">
            Academy Path
          </h2>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1677FF]/15 bg-[#1677FF]/[0.07] text-[#73B7FF]">
          <TrendingUp size={16} />
        </div>
      </div>

      <div className="p-5">
        {!hydrated ? (
          <div className="space-y-3">
            <div className="h-7 w-28 animate-pulse rounded bg-white/[0.045]" />
            <div className="h-1.5 animate-pulse rounded bg-white/[0.04]" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-xs text-[#74869A]">
            Belum ada materi published.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-end">
              <div>
                <div className="flex items-end gap-2">
                  <span className="font-mono text-3xl font-semibold tracking-[-0.04em] text-[#F3F7FB]">
                    {String(completedCount).padStart(2, "0")}
                  </span>
                  <span className="pb-1 font-mono text-sm text-[#60758C]">
                    / {String(totalCount).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#5D7187]">
                  Modules completed
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-[9px] uppercase tracking-[0.14em] text-[#5E7288]">
                  <span>Progress</span>
                  <span className="font-mono text-[#8DCCFF]">{percent}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#1677FF,#73B7FF)] transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-white/[0.055] bg-[#030A13] p-3.5 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[#536A82]">
                  Current Path
                </div>
                <div className="mt-1 truncate text-xs font-medium text-[#D8E1EA]">
                  {currentTitle ?? "Mulai dari basic module"}
                </div>
              </div>
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#73B7FF]"
              >
                Continue <ArrowRight size={12} />
              </button>
            </div>
          </>
        )}
      </div>
    </Surface>
  );
}

function DashboardNewsPanel({
  onNavigate,
}: {
  onNavigate: (p: PageId) => void;
}) {
  const [state, setState] = useState<IntegrationState<NewsItem[]>>({
    status: "idle",
  });
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (showLoading = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (showLoading) setState({ status: "loading" });
    setRefreshing(true);

    try {
      const items = await NEWS_PROVIDER.getLatestMarketNews(controller.signal);
      if (controller.signal.aborted) return;
      setState(
        items.length
          ? { status: "ready", data: items }
          : { status: "empty" },
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "News feed unavailable.",
      });
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
    const timer = window.setInterval(() => {
      void load(false);
    }, 90_000);
    return () => {
      window.clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [load]);

  return (
    <Surface className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.055] px-5 py-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#667A90]">
            Market Intelligence
          </div>
          <h2 className="mt-1 text-base font-semibold text-[#EEF3F8]">
            Verified Headlines
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void load(false)}
          disabled={refreshing}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-[#030912] text-[#7E91A6] transition hover:border-[#1677FF]/25 hover:text-white disabled:opacity-50"
          aria-label="Refresh news"
        >
          <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-4">
        {state.status === "loading" || state.status === "idle" ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[74px] animate-pulse rounded-xl bg-white/[0.035]"
              />
            ))}
          </div>
        ) : state.status === "ready" ? (
          <div className="space-y-2">
            {state.data.slice(0, 3).map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onNavigate("news")}
                className="group grid w-full grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border border-white/[0.05] bg-[#030A13] p-2 text-left transition duration-200 hover:-translate-y-px hover:border-[#1677FF]/20 hover:bg-[#06101D]"
              >
                <div className="relative h-[58px] overflow-hidden rounded-lg border border-white/[0.05] bg-[#07111F]">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover grayscale-[.55] saturate-[.55] brightness-[.62] contrast-[1.05] transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#3C6F9F]">
                      <Newspaper size={18} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(8,18,31,.12),rgba(3,9,17,.45))]" />
                </div>

                <div className="min-w-0 py-0.5">
                  <div className="flex min-w-0 items-center gap-2 text-[8px] uppercase tracking-[0.13em] text-[#586D83]">
                    <span className="truncate">{item.source}</span>
                    {item.relevance ? (
                      <span className="ml-auto shrink-0 text-[#73B7FF]">
                        {item.relevance}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#DCE5EE] transition-colors group-hover:text-white">
                    {item.headline}
                  </div>
                  <div className="mt-1 text-[8px] text-[#52657A]">
                    {formatWibDateTime(item.publishedAt)}
                  </div>
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => onNavigate("news")}
              className="mt-2 inline-flex items-center gap-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#73B7FF]"
            >
              Open Intelligence <ArrowRight size={12} />
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.055] bg-[#030A13] p-4">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#60758C]">
              News Feed
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#687A8E]" />
              <span className="text-xs font-semibold text-[#D6E0EA]">
                WAITING FOR SOURCE
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#75879B]">
              {state.status === "error"
                ? state.message
                : "No verified headlines are currently available."}
            </p>
            <button
              type="button"
              onClick={() => void load(false)}
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#73B7FF]"
            >
              Retry <RefreshCw size={11} />
            </button>
          </div>
        )}
      </div>
    </Surface>
  );
}

function CommandAccessPanel({
  onNavigate,
}: {
  onNavigate: (p: PageId) => void;
}) {
  const items = [
    {
      icon: LineChart,
      label: "CHART",
      title: "XAUUSD",
      desc: "TradingView terminal",
      page: "chart" as PageId,
    },
    {
      icon: Video,
      label: "LEARNING",
      title: "Basic Modules",
      desc: "Structured academy",
      page: "videos" as PageId,
    },
    {
      icon: FileText,
      label: "RESOURCES",
      title: "PDF Library",
      desc: "Reference material",
      page: "pdfs" as PageId,
    },
    {
      icon: MapPin,
      label: "BROKER",
      title: "Account Access",
      desc: "Verified broker links",
      page: "brokers" as PageId,
    },
    {
      icon: Lock,
      label: "EXPERT",
      title: "Expert Access",
      desc: "Advanced methodology",
      page: "expert" as PageId,
    },
    {
      icon: Calculator,
      label: "TOOLS",
      title: "Forex Calculator",
      desc: "Position sizing",
      page: "forex-calc" as PageId,
    },
  ];

  return (
    <Surface className="overflow-hidden">
      <div className="border-b border-white/[0.055] px-5 py-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#667A90]">
          Command Access
        </div>
        <h2 className="mt-1 text-base font-semibold text-[#EEF3F8]">
          Terminal Shortcuts
        </h2>
      </div>
      <div className="p-3">
        <div className="grid gap-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => onNavigate(item.page)}
                className="group flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition duration-200 hover:translate-x-0.5 hover:border-[#1677FF]/15 hover:bg-[#07111F]"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#1677FF]/10 bg-[#08182A] text-[#5EAFFF]">
                  <Icon size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-[#50657B]">
                    {item.label}
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="truncate text-xs font-medium text-[#DCE5EE]">
                      {item.title}
                    </span>
                    <span className="hidden truncate text-[9px] text-[#5C7086] 2xl:inline">
                      {item.desc}
                    </span>
                  </div>
                </div>
                <ArrowRight
                  size={12}
                  className="text-[#4F6479] transition group-hover:text-[#73B7FF]"
                />
              </button>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}

function DashboardPage({
  store,
  progress,
  onNavigate,
  onOpenMaterial,
}: {
  store: Store;
  progress: ReturnType<typeof useLearningProgress>;
  onNavigate: (p: PageId) => void;
  onOpenMaterial: (
    collection: "video" | "pdf" | "expert",
    id: string,
  ) => void;
}) {
  const pinned = store.announcements.find(
    (a) => a.pinned && a.status === "published",
  );
  const publishedVideos = store.videos
    .filter((v) => v.status === "published")
    .slice()
    .sort((a, b) => a.order - b.order);
  const publishedPdfs = store.pdfs
    .filter((p) => p.status === "published")
    .slice()
    .sort((a, b) => a.order - b.order);
  const publishedExpert = store.expert
    .filter((e) => e.status === "published")
    .slice()
    .sort((a, b) => a.order - b.order);
  const publishedBrokers = store.brokers.filter((b) => b.status === "published");
  const nowMs = Date.now();
  const upcomingEvent = store.events
    .filter((e) => e.status === "published")
    .filter((e) => {
      const eventMs = new Date(`${e.date}T${e.time}`).getTime();
      return Number.isFinite(eventMs) && eventMs >= nowMs;
    })
    .slice()
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    )
    .slice(0, 2);
  const progressEligibleTotal = store.allPublishedMaterials.filter(
    (m) => !m.expert?.locked,
  ).length;
  const currentLearningMaterial =
    store.allPublishedMaterials.find(
      (material) => material.id === progress.snapshot.lastMaterialId,
    ) ?? publishedVideos[0];
  const liveItem = store.lives[0];

  return (
    <div className="relative space-y-5 xl:space-y-6">
      <div className="pointer-events-none absolute -inset-x-6 -top-6 bottom-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(95,145,195,.42)_1px,transparent_1px),linear-gradient(90deg,rgba(95,145,195,.42)_1px,transparent_1px)] bg-[size:52px_52px]" />
        <div className="nx-ambient-drift absolute right-[4%] top-[4%] h-72 w-72 rounded-full bg-[#1677FF]/[0.055] blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_58%,rgba(0,0,0,.24)_100%)]" />
      </div>

      <HeroPanel settings={store.settings} onNavigate={onNavigate} />

      {pinned ? (
        <Surface className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1677FF]/10 text-[#3EA6FF]">
              <Pin size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3EA6FF]">
                Pinned Announcement
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-white">
                {pinned.title}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("announcements")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#1677FF]/25 bg-[#1677FF]/10 px-3 text-[11px] font-medium text-[#75BDFF]"
            >
              Lihat <ArrowRight size={13} />
            </button>
          </div>
          <div className="px-5 py-4 text-xs leading-6 text-[#8B98AA]">
            {pinned.body.length > 260 ? `${pinned.body.slice(0, 260)}…` : pinned.body}
          </div>
        </Surface>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.55fr_0.75fr]">
        <MarketStatusCard onNavigate={onNavigate} />
        <CommandAccessPanel onNavigate={onNavigate} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <LearningProgressCard
          hydrated={progress.hydrated}
          overallPercent={progress.overallPercent}
          completedCount={progress.completedCount}
          totalCount={progressEligibleTotal}
          currentTitle={currentLearningMaterial?.title}
          onContinue={() => onNavigate("videos")}
        />
        <DashboardNewsPanel onNavigate={onNavigate} />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3EA6FF]">
              Learning
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Basic Videos
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("videos")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3EA6FF]"
          >
            Lihat semua <ArrowRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {publishedVideos.slice(0, 3).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onOpenMaterial("video", v.id)}
              className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0A1626] to-[#07111F] text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1 hover:border-[#1677FF]/35"
            >
              <div className="p-3">
                <VideoThumb
                  title={v.title}
                  durationMinutes={v.durationMinutes}
                  coverUrl={v.thumbnailUrl}
                />
              </div>
              <div className="px-4 pb-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                  Basic Video
                </div>
                <div className="mt-1.5 line-clamp-2 text-sm font-medium text-white">
                  {v.title}
                </div>
                <div className="mt-1.5 line-clamp-2 text-xs text-[#718096]">
                  {v.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3EA6FF]">
              Learning
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              PDF Resources
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("pdfs")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3EA6FF]"
          >
            Lihat semua <ArrowRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {publishedPdfs.slice(0, 4).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenMaterial("pdf", p.id)}
              className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0A1626] to-[#07111F] text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1 hover:border-[#1677FF]/35"
            >
              <div className="mx-auto max-w-[180px] p-4">
                <PdfCover title={p.title} coverUrl={p.thumbnailUrl} />
              </div>
              <div className="px-4 pb-4">
                <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                  PDF Resource
                </div>
                <div className="mt-1.5 line-clamp-2 text-sm font-medium text-white">
                  {p.title}
                </div>
                <div className="mt-1.5 line-clamp-2 text-xs text-[#718096]">
                  {p.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {publishedBrokers.length ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3EA6FF]">
                Learning
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
                Broker / Trading Account
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("brokers")}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3EA6FF]"
            >
              Lihat semua <ArrowRight size={13} />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {publishedBrokers.map((b) => (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0A1626] to-[#07111F] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]"
              >
                <div className="relative aspect-[16/7] w-full overflow-hidden border-b border-white/[0.06]">
                  {b.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.logoUrl}
                      alt={b.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <BrokerVisual kind={b.visual} name={b.name} />
                  )}
                </div>
                <div className="p-5">
                  <div className="text-sm font-semibold text-white">
                    {b.name}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[#8B98AA]">
                    {b.description}
                  </p>
                  <a
                    href={b.registerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white hover:bg-[#1D8CFF]"
                  >
                    Registrasi <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3EA6FF]">
              Expert
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Expert Modules
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("expert")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3EA6FF]"
          >
            Selengkapnya <ArrowRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {publishedExpert.slice(0, 3).map((e) => {
            const isLocked = e.expert?.locked ?? true;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onOpenMaterial("expert", e.id)}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0A1626] to-[#07111F] text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1 hover:border-[#1677FF]/35"
              >
                <div className="p-3">
                  <ExpertVisual
                    imageUrl={e.thumbnailUrl}
                    title={e.title}
                    locked={isLocked}
                  />
                </div>
                <div className="px-4 pb-4">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    Expert · {isLocked ? "Locked" : "Available"}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-medium text-white">
                    {e.title}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-xs text-[#718096]">
                    {e.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Surface className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718096]">
                Community
              </div>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Latest
              </h2>
            </div>
            <Users size={18} className="text-[#3EA6FF]" />
          </div>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => onNavigate("community")}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-[#050B14] px-4 py-3 text-left hover:border-[#1677FF]/20"
            >
              <span className="text-xs text-[#B9C3D1]">
                {store.discussions.length} diskusi aktif
              </span>
              <ChevronRight size={14} className="text-[#536275]" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("events")}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-[#050B14] px-4 py-3 text-left hover:border-[#1677FF]/20"
            >
              <span className="text-xs text-[#B9C3D1]">
                {upcomingEvent.length} event akan datang
              </span>
              <ChevronRight size={14} className="text-[#536275]" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("live")}
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-[#050B14] px-4 py-3 text-left hover:border-[#1677FF]/20"
            >
              <span className="text-xs text-[#B9C3D1]">
                {liveItem ? "Live schedule" : "Belum ada live"}
              </span>
              <ChevronRight size={14} className="text-[#536275]" />
            </button>
          </div>
        </Surface>
        <Surface className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718096]">
                Upcoming Event
              </div>
              <h2 className="mt-1 text-lg font-semibold text-white">
                Sesi berikutnya
              </h2>
            </div>
            <Calendar size={18} className="text-[#3EA6FF]" />
          </div>
          <div className="mt-4 space-y-2">
            {upcomingEvent.length ? (
              upcomingEvent.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onNavigate("events")}
                  className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-[#050B14] px-4 py-3 text-left hover:border-[#1677FF]/20"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-white">
                      {ev.title}
                    </div>
                    <div className="mt-0.5 text-[10px] text-[#718096]">
                      {formatDateOnly(ev.date)} · {ev.time} WIB
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[#536275]" />
                </button>
              ))
            ) : (
              <div className="text-xs text-[#718096]">Belum ada event.</div>
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}

/* ───────────────────────────── TradingView page ─────────── */

function TradingViewPage({ settings }: { settings: PlatformSettings }) {
  const [symbol, setSymbol] = useState(settings.tradingViewSymbol);
  const [interval, setInterval] = useState(settings.tradingViewInterval);

  const INTERVALS = [
    { value: "5", label: "5m" },
    { value: "15", label: "15m" },
    { value: "60", label: "1H" },
    { value: "240", label: "4H" },
    { value: "D", label: "1D" },
    { value: "W", label: "1W" },
  ];
  const SYMBOLS = [
    { value: "OANDA:XAUUSD", label: "XAUUSD · OANDA" },
    { value: "TVC:GOLD", label: "GOLD · TVC" },
    { value: "FX_IDC:XAUUSD", label: "XAUUSD · FX_IDC" },
    { value: "OANDA:EURUSD", label: "EURUSD" },
    { value: "OANDA:GBPUSD", label: "GBPUSD" },
    { value: "OANDA:USDJPY", label: "USDJPY" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Market"
        title="TradingView"
        description="Widget resmi TradingView. Data mengikuti feed TradingView (beberapa symbol mungkin delayed). Tidak ada harga yang dikarang di UI ini."
        action={
          <a
            href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#07111F] px-3 text-xs text-[#B9C3D1] hover:text-white"
          >
            <ExternalLink size={13} /> Buka di TradingView
          </a>
        }
      />
      <Surface className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#718096]">
              Symbol
            </span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="h-9 rounded-lg border border-white/[0.08] bg-[#050B14] px-3 text-xs text-white outline-none focus:border-[#1677FF]/45"
            >
              {SYMBOLS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#718096]">
              Timeframe
            </span>
            <div className="flex overflow-hidden rounded-lg border border-white/[0.08]">
              {INTERVALS.map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => setInterval(tf.value)}
                  className={`h-9 px-3 text-xs font-medium transition ${
                    interval === tf.value
                      ? "bg-[#1677FF] text-white"
                      : "bg-[#050B14] text-[#8B98AA] hover:text-white"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Surface>
      <Surface className="p-3">
        <TradingViewWidget symbol={symbol} interval={interval} height={560} />
      </Surface>
    </div>
  );
}

/* ───────────────────────────── News page ────────────────── */

function NewsPage() {
  const [state, setState] = useState<IntegrationState<NewsItem[]>>({
    status: "idle",
  });
  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const items = await NEWS_PROVIDER.getLatestMarketNews();
      setState(
        items.length ? { status: "ready", data: items } : { status: "empty" },
      );
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "News route unavailable.",
      });
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Market Intelligence"
        title="Market News"
        description="Diambil dari /api/news. Fokus: XAUUSD, USD, Fed, CPI, NFP, makro relevan. Tidak ada headline dummy."
        action={
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#07111F] px-3 text-xs text-[#B9C3D1] hover:text-white"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />
      <Surface className="p-5">
        {state.status === "loading" || state.status === "idle" ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-xl bg-white/[0.04]"
              />
            ))}
          </div>
        ) : state.status === "ready" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {state.data.map((item) => (
              <a
                key={item.id}
                href={`/news/${encodeURIComponent(item.id)}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#050B14] transition hover:-translate-y-0.5 hover:border-[#1677FF]/25"
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <NewsImage
                    imageUrl={item.imageUrl}
                    title={item.headline}
                    category={item.source}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {item.relevance ? (
                    <div className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#75BDFF] backdrop-blur-sm">
                      {item.relevance}
                    </div>
                  ) : null}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    <span className="truncate">{item.source}</span>
                    <span>·</span>
                    <span>{formatDateTime(item.publishedAt)}</span>
                  </div>
                  <div className="mt-2 line-clamp-3 text-sm font-medium leading-5 text-white">
                    {item.headline}
                  </div>
                  {item.summary ? (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#8B98AA]">
                      {item.summary}
                    </p>
                  ) : null}
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-[#3EA6FF]">
                    Buka sumber <ExternalLink size={11} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : state.status === "error" ? (
          <div className="space-y-4">
            <StatusState
              icon={Newspaper}
              title="News route belum tersedia"
              description="Buat file app/api/news/route.ts yang mengembalikan { items: NewsItem[] }. Tanpa route tersebut, dashboard menampilkan state ini — bukan headline dummy."
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => void refresh()}
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[#B9C3D1] hover:text-white"
              >
                <RefreshCw size={13} /> Coba lagi
              </button>
              <a
                href="https://www.forexfactory.com/news"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1677FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1D8CFF]"
              >
                <ExternalLink size={13} /> Forex Factory
              </a>
            </div>
          </div>
        ) : (
          <StatusState
            icon={Newspaper}
            title="Belum ada news"
            description="Route /api/news merespons, tetapi belum ada item."
          />
        )}
      </Surface>
    </div>
  );
}

/* ───────────────────────────── Calendar page ────────────── */

const CALENDAR_CLIENT_REFRESH_MS = 60_000;
const CALENDAR_LIVE_BEFORE_MS = 2 * 60_000;
const CALENDAR_LIVE_AFTER_MS = 5 * 60_000;

type CalendarFocusFilter = "all" | "high" | "usd" | "gold" | "macro";
type CalendarDateFilter = "all" | "today" | "tomorrow" | "week";

function formatWibTime(timestamp: string) {
  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms)) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

function formatWibDate(timestamp: string) {
  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms)) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

function formatCalendarWibDateTime(timestamp: string | null | undefined) {
  if (!timestamp) return "belum pernah";
  const ms = Date.parse(timestamp);
  if (!Number.isFinite(ms)) return "belum pernah";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

function getWibDateKey(input: Date | number) {
  const date = typeof input === "number" ? new Date(input) : input;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function addDaysToDateKey(key: string, days: number) {
  const [year, month, day] = key.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days, 12));
  return date.toISOString().slice(0, 10);
}

function getWibWeekBounds(nowMs: number) {
  const today = getWibDateKey(nowMs);
  const [year, month, day] = today.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, 12));
  const dayOfWeek = utc.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addDaysToDateKey(today, mondayOffset);
  const sunday = addDaysToDateKey(monday, 6);
  return { monday, sunday };
}

function getEffectiveCalendarStatus(
  event: EconomicEvent,
  nowMs: number,
): "upcoming" | "live" | "released" {
  if (event.actual && event.actual.trim()) return "released";
  const timestamp = event.timestamp ?? event.publishedAt;
  const eventMs = Date.parse(timestamp);
  if (!Number.isFinite(eventMs)) return event.status ?? "upcoming";
  if (nowMs < eventMs - CALENDAR_LIVE_BEFORE_MS) return "upcoming";
  if (nowMs <= eventMs + CALENDAR_LIVE_AFTER_MS) return "live";
  return "released";
}

function formatCalendarCountdown(event: EconomicEvent, nowMs: number) {
  const status = getEffectiveCalendarStatus(event, nowMs);
  if (status !== "upcoming") return null;
  const timestamp = event.timestamp ?? event.publishedAt;
  const eventMs = Date.parse(timestamp);
  if (!Number.isFinite(eventMs)) return null;
  const diff = Math.max(0, eventMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `T-${days}d ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  return `T-${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function isGoldRelevantEvent(event: EconomicEvent) {
  if (event.relevance === "gold" || event.category === "gold") return true;
  if (event.currency !== "USD") return false;
  return (
    event.impact === "high" ||
    ["inflation", "labor-market", "central-bank", "growth", "consumer"].includes(
      event.category ?? "",
    )
  );
}

function categoryLabel(category: EconomicEvent["category"]) {
  switch (category) {
    case "inflation":
      return "Inflation";
    case "labor-market":
      return "Labor Market";
    case "central-bank":
      return "Central Bank";
    case "growth":
      return "Economic Growth";
    case "consumer":
      return "Consumer";
    case "manufacturing":
      return "Manufacturing";
    case "business-activity":
      return "Business Activity";
    case "housing":
      return "Housing";
    case "trade":
      return "Trade";
    case "energy":
      return "Energy";
    case "gold":
      return "Gold / XAUUSD";
    case "holiday":
      return "Market Holiday";
    default:
      return "Macro";
  }
}

function CalendarEventVisual({ event }: { event: EconomicEvent }) {
  const category = event.category ?? "macro";
  return (
    <div
      title={event.imageQuery ?? categoryLabel(category)}
      className="relative h-[64px] w-full overflow-hidden rounded-lg border border-[#4EA4FF]/[0.12] bg-[linear-gradient(145deg,rgba(10,26,47,0.96),rgba(4,11,22,0.98))] sm:w-[108px]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(42,139,255,0.22),transparent_52%)]" />
      <svg viewBox="0 0 108 64" className="relative h-full w-full" aria-hidden="true">
        <g stroke="#4EA4FF" fill="none" strokeWidth="1.3" opacity="0.72">
          {category === "inflation" ? (
            <>
              <circle cx="34" cy="32" r="16" />
              <path d="M34 21v22M27 28h14M27 36h14" />
              <path d="M62 43V31M73 43V24M84 43V18" />
            </>
          ) : category === "labor-market" ? (
            <>
              <path d="M20 45h68" />
              <path d="M28 45V34h10v11M49 45V25h10v20M70 45V17h10v28" />
              <path d="M24 20c7-6 13-8 20-3" />
            </>
          ) : category === "central-bank" ? (
            <>
              <path d="M20 25h68L54 12 20 25Z" />
              <path d="M26 28v22M40 28v22M54 28v22M68 28v22M82 28v22" />
              <path d="M18 51h72" />
            </>
          ) : category === "growth" ? (
            <>
              <path d="M17 45 34 36 48 39 64 26 78 29 92 16" />
              <path d="M78 16h14v14" />
            </>
          ) : category === "consumer" ? (
            <>
              <path d="M22 20h9l6 24h42l8-17H35" />
              <circle cx="45" cy="50" r="3" />
              <circle cx="73" cy="50" r="3" />
            </>
          ) : category === "manufacturing" ? (
            <>
              <path d="M18 48V30l18 8V27l18 10V24l18 9v15H18Z" />
              <path d="M72 33V16h10v32" />
            </>
          ) : category === "business-activity" ? (
            <>
              <path d="M14 34h18l6-13 10 27 8-18 7 8h31" />
            </>
          ) : category === "housing" ? (
            <>
              <path d="M24 34 54 14l30 20" />
              <path d="M31 31v21h46V31M48 52V38h12v14" />
            </>
          ) : category === "trade" ? (
            <>
              <path d="M18 24h61M69 16l10 8-10 8" />
              <path d="M90 42H29M39 34l-10 8 10 8" />
            </>
          ) : category === "energy" ? (
            <>
              <path d="M58 10 33 37h18l-3 17 27-31H58V10Z" />
            </>
          ) : category === "gold" ? (
            <>
              <path d="M26 43 34 22h40l8 21H26Z" />
              <path d="M38 22 45 13h18l7 9" />
              <path d="M21 51h66" />
            </>
          ) : category === "holiday" ? (
            <>
              <rect x="24" y="18" width="60" height="35" rx="5" />
              <path d="M24 29h60M38 13v10M70 13v10" />
            </>
          ) : (
            <>
              <circle cx="54" cy="32" r="19" />
              <path d="M54 13v38M35 32h38M40 20c8 7 20 7 28 0M40 44c8-7 20-7 28 0" />
            </>
          )}
        </g>
      </svg>
      <div className="absolute bottom-1.5 left-2 max-w-[92px] truncate text-[8px] font-semibold uppercase tracking-[0.12em] text-[#8CC8FF]/80">
        {categoryLabel(category)}
      </div>
    </div>
  );
}

function CalendarPage() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    provider?: string;
    source?: string;
    stale?: boolean;
    upstreamRefreshSeconds?: number;
    refreshIntervalMs?: number;
  }>({});
  const [focusFilter, setFocusFilter] = useState<CalendarFocusFilter>("all");
  const [dateFilter, setDateFilter] = useState<CalendarDateFilter>("all");
  const [nowMs, setNowMs] = useState(() => Date.now());

  const refresh = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);

    try {
      const payload = await ECONOMIC_CALENDAR_PROVIDER.getEvents();
      setEvents(payload.events);
      setLastSuccessfulUpdate(payload.fetchedAt ?? payload.servedAt ?? new Date().toISOString());
      setMeta({
        provider: payload.provider,
        source: payload.source,
        stale: payload.stale,
        upstreamRefreshSeconds: payload.upstreamRefreshSeconds,
        refreshIntervalMs: payload.refreshIntervalMs,
      });
      setError(payload.warning ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calendar route unavailable.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh(false);
    const id = window.setInterval(() => void refresh(true), CALENDAR_CLIENT_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const today = getWibDateKey(nowMs);
    const tomorrow = addDaysToDateKey(today, 1);
    const week = getWibWeekBounds(nowMs);

    return events
      .filter((event) => {
        if (focusFilter === "high") return event.impact === "high";
        if (focusFilter === "usd") return event.currency === "USD";
        if (focusFilter === "gold") return isGoldRelevantEvent(event);
        if (focusFilter === "macro") return event.relevance === "macro";
        return true;
      })
      .filter((event) => {
        if (dateFilter === "all") return true;
        const key = getWibDateKey(Date.parse(event.timestamp ?? event.publishedAt));
        if (dateFilter === "today") return key === today;
        if (dateFilter === "tomorrow") return key === tomorrow;
        return key >= week.monday && key <= week.sunday;
      })
      .slice()
      .sort((a, b) => {
        const aStatus = getEffectiveCalendarStatus(a, nowMs);
        const bStatus = getEffectiveCalendarStatus(b, nowMs);
        const priority = { live: 0, upcoming: 1, released: 2 } as const;
        const statusDelta = priority[aStatus] - priority[bStatus];
        if (statusDelta !== 0) return statusDelta;
        const aMs = Date.parse(a.timestamp ?? a.publishedAt);
        const bMs = Date.parse(b.timestamp ?? b.publishedAt);
        return aStatus === "released" ? bMs - aMs : aMs - bMs;
      });
  }, [events, focusFilter, dateFilter, nowMs]);

  const statusCounts = useMemo(() => {
    let upcoming = 0;
    let live = 0;
    let released = 0;
    for (const event of events) {
      const status = getEffectiveCalendarStatus(event, nowMs);
      if (status === "upcoming") upcoming += 1;
      else if (status === "live") live += 1;
      else released += 1;
    }
    return { upcoming, live, released };
  }, [events, nowMs]);

  const focusButtons: Array<{ value: CalendarFocusFilter; label: string }> = [
    { value: "all", label: "ALL" },
    { value: "high", label: "HIGH IMPACT" },
    { value: "usd", label: "USD" },
    { value: "gold", label: "GOLD" },
    { value: "macro", label: "MACRO" },
  ];

  const dateButtons: Array<{ value: CalendarDateFilter; label: string }> = [
    { value: "all", label: "ALL DATES" },
    { value: "today", label: "TODAY" },
    { value: "tomorrow", label: "TOMORROW" },
    { value: "week", label: "THIS WEEK" },
  ];

  return (
    <div className="space-y-5">
      <SectionHeading
        eyebrow="Market Intelligence"
        title="Economic Calendar"
        description="Economic events dinormalisasi di server, dikonversi aman ke WIB, diklasifikasikan berdasarkan nama event, dan diperbarui otomatis tanpa fake data."
        action={
          <button
            type="button"
            onClick={() => void refresh(true)}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#07111F] px-3 text-xs text-[#B9C3D1] hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      <Surface className="p-3.5 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#637285]">
              Focus
            </span>
            {focusButtons.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFocusFilter(item.value)}
                className={`h-7 rounded-lg border px-2.5 text-[9px] font-semibold tracking-[0.08em] transition ${
                  focusFilter === item.value
                    ? "border-[#3E9BFF]/35 bg-[#1677FF]/15 text-[#9DD1FF]"
                    : "border-white/[0.07] bg-[#050B14] text-[#718096] hover:text-[#C7D3E2]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#637285]">
              Window
            </span>
            {dateButtons.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setDateFilter(item.value)}
                className={`h-7 rounded-lg border px-2.5 text-[9px] font-semibold tracking-[0.08em] transition ${
                  dateFilter === item.value
                    ? "border-[#3E9BFF]/35 bg-[#1677FF]/15 text-[#9DD1FF]"
                    : "border-white/[0.07] bg-[#050B14] text-[#718096] hover:text-[#C7D3E2]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid gap-2 border-t border-white/[0.055] pt-3 sm:grid-cols-2 xl:grid-cols-[1fr_auto_auto_auto] xl:items-center">
          <div className="min-w-0 text-[10px] leading-5 text-[#718096]">
            <span className="font-medium text-[#A8B6C8]">{meta.provider ?? "calendar provider"}</span>
            <span className="mx-1.5 text-[#445165]">·</span>
            Browser refresh {Math.round((meta.refreshIntervalMs ?? CALENDAR_CLIENT_REFRESH_MS) / 1000)}s
            <span className="mx-1.5 text-[#445165]">·</span>
            Upstream refresh ≤{Math.round((meta.upstreamRefreshSeconds ?? 180) / 60)}m
            {meta.stale ? (
              <span className="ml-2 rounded-md border border-red-400/20 bg-red-500/[0.07] px-1.5 py-0.5 text-red-300">
                STALE SNAPSHOT
              </span>
            ) : null}
          </div>
          <div className="text-[10px] text-[#718096]">
            <span className="text-[#B9C3D1]">{statusCounts.upcoming}</span> upcoming
          </div>
          <div className="text-[10px] text-[#718096]">
            <span className="text-[#69B5FF]">{statusCounts.live}</span> live window
          </div>
          <div className="text-[10px] text-[#718096]">
            Updated {formatCalendarWibDateTime(lastSuccessfulUpdate)} WIB
          </div>
        </div>
      </Surface>

      {error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.055] px-4 py-3 text-xs leading-5 text-red-200">
          <div className="font-semibold">Calendar refresh warning</div>
          <div className="mt-0.5 text-red-200/80">{error}</div>
          <div className="mt-1 text-[10px] text-[#8B98AA]">
            Last successful update: {formatCalendarWibDateTime(lastSuccessfulUpdate)} WIB
          </div>
        </div>
      ) : null}

      {loading && events.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[92px] animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.025]"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <StatusState
          icon={Calendar}
          title="CALENDAR DATA UNAVAILABLE"
          description={`Tidak ada event valid dari /api/calendar. Last successful update: ${formatCalendarWibDateTime(lastSuccessfulUpdate)} WIB. Tidak ada event dummy yang ditampilkan.`}
          action={
            <button
              type="button"
              onClick={() => void refresh(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#1677FF]/25 bg-[#1677FF]/10 px-3 py-1.5 text-xs text-[#75BDFF]"
            >
              <RefreshCw size={13} /> Coba lagi
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <StatusState
          icon={Calendar}
          title="Tidak ada event untuk filter ini"
          description="Data calendar tersedia, tetapi kombinasi filter saat ini tidak menghasilkan event."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => {
            const status = getEffectiveCalendarStatus(event, nowMs);
            const countdown = formatCalendarCountdown(event, nowMs);
            const timestamp = event.timestamp ?? event.publishedAt;
            const impactClasses =
              event.impact === "high"
                ? "border-red-400/25 bg-red-500/[0.07] text-red-300"
                : event.impact === "medium"
                  ? "border-[#3EA6FF]/20 bg-[#1677FF]/[0.06] text-[#AFC9E6]"
                  : "border-[#4EA4FF]/[0.11] bg-[#1677FF]/[0.045] text-[#8EA3BA]";
            const rowAccent =
              event.impact === "high"
                ? "border-l-red-400/55"
                : event.impact === "medium"
                  ? "border-l-[#3EA6FF]/45"
                  : "border-l-[#3E9BFF]/25";

            return (
              <article
                key={event.id}
                className={`grid min-w-0 gap-3 rounded-xl border border-white/[0.065] border-l-2 ${rowAccent} bg-[linear-gradient(105deg,rgba(8,20,36,0.93),rgba(5,13,24,0.97))] p-3 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.9)] sm:grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)_210px_108px] lg:items-center`}
              >
                <div className="min-w-0">
                  <div className="font-mono text-lg font-semibold tabular-nums text-white">
                    {formatWibTime(timestamp)}
                    <span className="ml-1 text-[9px] font-medium text-[#637285]">WIB</span>
                  </div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.08em] text-[#637285]">
                    {formatWibDate(timestamp)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md border border-[#4EA4FF]/[0.12] bg-[#1677FF]/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-[#A9D4FF]">
                      {event.currency}
                    </span>
                    <span className={`rounded-md border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] ${impactClasses}`}>
                      {event.impact}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] ${
                        status === "live"
                          ? "border-[#3E9BFF]/35 bg-[#1677FF]/15 text-[#9DD1FF]"
                          : status === "released"
                            ? "border-white/[0.08] bg-white/[0.035] text-[#718096]"
                            : "border-[#3E9BFF]/20 bg-[#1677FF]/[0.06] text-[#75BDFF]"
                      }`}
                    >
                      {status}
                    </span>
                    {countdown ? (
                      <span className="font-mono text-[9px] tabular-nums text-[#8EA3BA]">
                        {countdown}
                      </span>
                    ) : null}
                    {event.relevance ? (
                      <span className="text-[8px] font-medium uppercase tracking-[0.1em] text-[#536275]">
                        {event.relevance}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1.5 truncate text-[13px] font-semibold text-[#F5F7FA] sm:text-sm">
                    {event.event}
                  </h3>
                  <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-[#637285]">
                    <span>{categoryLabel(event.category)}</span>
                    {event.country ? <span>· {event.country}</span> : null}
                    {event.source ? <span>· {event.source}</span> : null}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:col-span-2 lg:col-span-1">
                  {[
                    ["Previous", event.previous ?? "—"],
                    ["Forecast", event.forecast ?? "—"],
                    ["Actual", event.actual ?? "—"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="min-w-0 rounded-lg border border-white/[0.055] bg-[#030912]/70 px-2.5 py-2"
                    >
                      <div className="truncate text-[8px] font-medium uppercase tracking-[0.08em] text-[#536275]">
                        {label}
                      </div>
                      <div className={`mt-1 truncate font-mono text-[11px] font-semibold ${label === "Actual" && value !== "—" ? "text-[#9DD1FF]" : "text-[#C4CFDC]"}`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <CalendarEventVisual event={event} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────── World Market ─────────────── */

function WorldMarketPage() {
  const [state, setState] = useState<IntegrationState<WorldMarketRow[]>>({
    status: "idle",
  });
  const refresh = useCallback(async () => {
    if (!WORLD_MARKET_PROVIDER) {
      setState({ status: "empty" });
      return;
    }
    setState({ status: "loading" });
    try {
      const rows = await WORLD_MARKET_PROVIDER.getRows();
      setState(
        rows.length ? { status: "ready", data: rows } : { status: "empty" },
      );
    } catch {
      setState({ status: "error", message: "World market unavailable." });
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Market"
        title="World Market"
        description="Provider-driven. Tidak ada angka market yang dikarang di UI ini."
        action={
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#07111F] px-3 text-xs text-[#B9C3D1] hover:text-white"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />
      <Surface className="overflow-hidden">
        <div className="relative aspect-[16/6] w-full overflow-hidden border-b border-white/[0.06]">
          <TopicVisual kind="world" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07111F] via-transparent to-transparent" />
        </div>
        <div className="p-5">
          {state.status === "ready" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {state.data.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-white/[0.06] bg-[#050B14] p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-[#B9C3D1]">{row.label}</span>
                    <span className="text-[10px] uppercase text-[#718096]">
                      {row.status}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-lg font-semibold text-white">
                    {row.value ?? "—"}
                  </div>
                  {row.change && row.changePct ? (
                    <div className="mt-1 text-[10px] text-[#718096]">
                      {row.change} · {row.changePct}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : state.status === "loading" ? (
            <div className="h-52 animate-pulse rounded-xl bg-white/[0.04]" />
          ) : (
            <StatusState
              icon={Globe}
              title="WORLD MARKET FEED OFFLINE"
              description="World Market provider belum dikonfigurasi. Tidak ada angka yang dikarang. Hubungkan provider legal ke WORLD_MARKET_PROVIDER atau route server-side untuk menampilkan data real."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href="https://www.tradingview.com/markets/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[#1677FF] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1D8CFF]"
                  >
                    <ExternalLink size={13} /> TradingView Markets
                  </a>
                  <a
                    href="https://www.investing.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-[#B9C3D1] hover:text-white"
                  >
                    <ExternalLink size={13} /> Investing.com
                  </a>
                </div>
              }
            />
          )}
        </div>
      </Surface>
    </div>
  );
}

/* ───────────────────────────── Videos page ─────────────── */

function VideosPage({
  videos,
  progress,
  onOpen,
}: {
  videos: Material[];
  progress: ReturnType<typeof useLearningProgress>;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("id-ID");
  const filtered = videos
    .filter((v) => v.status === "published")
    .filter((v) =>
      `${v.title} ${v.description}`.toLocaleLowerCase("id-ID").includes(q),
    )
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Learning"
        title="Basic Videos"
        description="Video dasar trading, market basics, risk basics, psychology dasar, dan XAUUSD basic."
      />
      <Surface className="p-4">
        <div className="relative max-w-xl">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66768A]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari video..."
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5C6A7A]"
          />
        </div>
      </Surface>
      {filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((v) => {
            const done = progress.completedSet.has(v.id);
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onOpen(v.id)}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0A1626] to-[#07111F] text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1 hover:border-[#1677FF]/35"
              >
                <div className="p-3">
                  <VideoThumb
                    title={v.title}
                    durationMinutes={v.durationMinutes}
                    coverUrl={v.thumbnailUrl}
                  />
                </div>
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    <span>Video</span>
                    {done ? <span className="text-[#75BDFF]">· done</span> : null}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-medium text-white">
                    {v.title}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-xs text-[#718096]">
                    {v.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <StatusState
          icon={Search}
          title="Video tidak ditemukan"
          description="Belum ada video yang cocok."
        />
      )}
    </div>
  );
}

/* ───────────────────────────── PDFs page ──────────────── */

function PdfsPage({
  pdfs,
  progress,
  onOpen,
}: {
  pdfs: Material[];
  progress: ReturnType<typeof useLearningProgress>;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("id-ID");
  const filtered = pdfs
    .filter((p) => p.status === "published")
    .filter((p) =>
      `${p.title} ${p.description}`.toLocaleLowerCase("id-ID").includes(q),
    )
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Learning"
        title="PDF Resources"
        description="Materi PDF dasar: glossary, risk management, market structure dasar."
      />
      <Surface className="p-4">
        <div className="relative max-w-xl">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66768A]"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari PDF..."
            className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#5C6A7A]"
          />
        </div>
      </Surface>
      {filtered.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((p) => {
            const done = progress.completedSet.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpen(p.id)}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0A1626] to-[#07111F] text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1 hover:border-[#1677FF]/35"
              >
                <div className="mx-auto max-w-[180px] p-4">
                  <PdfCover title={p.title} coverUrl={p.thumbnailUrl} />
                </div>
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    <span>PDF</span>
                    {done ? <span className="text-[#75BDFF]">· done</span> : null}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-medium text-white">
                    {p.title}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-xs text-[#718096]">
                    {p.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <StatusState
          icon={Search}
          title="PDF tidak ditemukan"
          description="Belum ada PDF yang cocok."
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Material detail ─────────── */

function MaterialDetailPage({
  collection,
  material,
  progress,
  onBack,
  onList,
  expertRegistrationUrl,
}: {
  collection: "video" | "pdf" | "expert";
  material: Material;
  progress: ReturnType<typeof useLearningProgress>;
  onBack: () => void;
  onList: () => void;
  expertRegistrationUrl: string;
}) {
  const done = progress.completedSet.has(material.id);
  const isExpert = collection === "expert";
  const isVideoMaterial = collection === "video" || isExpert;
  const locked = isExpert && Boolean(material.expert?.locked);

  useEffect(() => {
    if (!locked) progress.recordOpened(material.id);
  }, [material.id, locked, progress.recordOpened]);

  const listLabel =
    collection === "video"
      ? "Basic Videos"
      : collection === "pdf"
        ? "PDF Resources"
        : "Expert Access";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onList}
          className="text-xs text-[#718096] hover:text-[#3EA6FF]"
        >
          ← {listLabel}
        </button>
        <BackButton onClick={onBack} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Surface className="overflow-hidden">
          <div className="border-b border-white/[0.06] p-5 md:p-6">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#718096]">
              {collection}
              {material.expert ? ` · ${material.expert.category}` : ""}
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-white">
              {material.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8B98AA]">
              {material.description}
            </p>
          </div>
          <div className="p-5 md:p-6">
            {locked ? (
              <div className="space-y-4">
                <ExpertVisual
                  imageUrl={material.thumbnailUrl}
                  title={material.title}
                  locked
                />
                <StatusState
                  icon={Lock}
                  title="Expert Access diperlukan"
                  description="Materi ini tersedia untuk Expert Member. Flow: Expert Access → Registration → Verification → Entitlement."
                  action={
                    <a
                      href={expertRegistrationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-[#1677FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D8CFF]"
                    >
                      Register for Expert Access <ExternalLink size={12} />
                    </a>
                  }
                />
              </div>
            ) : isVideoMaterial && material.mediaUrl ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-black">
                <video
                  src={material.mediaUrl}
                  controls
                  playsInline
                  className="h-full w-full"
                />
              </div>
            ) : isVideoMaterial ? (
              <div className="space-y-4">
                <VideoThumb
                  title={material.title}
                  durationMinutes={material.durationMinutes}
                  coverUrl={material.thumbnailUrl}
                />
                <StatusState
                  icon={Video}
                  title="Video belum diunggah"
                  description="Owner dapat mengunggah file video dari Owner Studio. Tidak ada video dummy yang diputar."
                />
              </div>
            ) : collection === "pdf" && material.attachmentUrl ? (
              <div className="space-y-4">
                <div className="mx-auto max-w-[260px]">
                  <PdfCover
                    title={material.title}
                    coverUrl={material.thumbnailUrl}
                  />
                </div>
                <a
                  href={material.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1677FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1D8CFF]"
                >
                  <FileText size={14} /> Buka PDF
                </a>
              </div>
            ) : (
              <StatusState
                icon={FileText}
                title="Materi belum diunggah"
                description="Owner dapat menambahkan file dari Owner Studio."
              />
            )}
          </div>
        </Surface>
        <div className="space-y-4">
          <Surface className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718096]">
              Learning Status
            </div>
            <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#050B14] p-4">
              <div className="text-xs text-[#718096]">Current status</div>
              <div className="mt-1 text-sm font-medium text-white">
                {locked ? "Locked" : done ? "Completed" : "In progress"}
              </div>
            </div>
            {!locked ? (
              <button
                type="button"
                onClick={() =>
                  done
                    ? progress.markIncomplete(material.id)
                    : progress.markCompleted(material.id)
                }
                className={`mt-4 h-10 w-full rounded-xl text-xs font-semibold transition ${
                  done
                    ? "border border-white/[0.09] bg-white/[0.03] text-[#B9C3D1]"
                    : "bg-[#1677FF] text-white hover:bg-[#1D8CFF]"
                }`}
              >
                {done ? "Tandai belum selesai" : "Tandai selesai"}
              </button>
            ) : null}
          </Surface>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── Brokers page ──────────── */

function BrokersPage({ brokers }: { brokers: Broker[] }) {
  const published = brokers.filter((b) => b.status === "published");
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Learning"
        title="Broker / Trading Account"
        description="Registrasi trading account melalui partner. Trading memiliki risiko."
      />
      {published.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {published.map((b) => (
            <Surface key={b.id} className="overflow-hidden">
              <div className="relative aspect-[16/7] w-full overflow-hidden border-b border-white/[0.06]">
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.logoUrl}
                    alt={b.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <BrokerVisual kind={b.visual} name={b.name} />
                )}
              </div>
              <div className="p-5">
                <div className="text-sm font-semibold text-white">
                  {b.name}
                </div>
                <p className="mt-2 text-xs leading-5 text-[#8B98AA]">
                  {b.description}
                </p>
                {b.disclaimer ? (
                  <p className="mt-3 rounded-lg border border-[#3EA6FF]/15 bg-[#1677FF]/[0.05] px-3 py-2 text-[10px] leading-4 text-[#9FB5CC]">
                    {b.disclaimer}
                  </p>
                ) : null}
                <a
                  href={b.registerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white hover:bg-[#1D8CFF]"
                >
                  Registrasi <ExternalLink size={12} />
                </a>
              </div>
            </Surface>
          ))}
        </div>
      ) : (
        <StatusState
          icon={MapPin}
          title="Belum ada broker"
          description="Owner dapat menambahkan broker melalui Owner Studio."
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Expert page ──────────── */

function ExpertPage({
  expert,
  onOpen,
  registrationUrl,
}: {
  expert: Material[];
  onOpen: (id: string) => void;
  registrationUrl: string;
}) {
  const published = expert
    .filter((e) => e.status === "published")
    .slice()
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Expert"
        title="Expert Access"
        description="Advanced technical methodology. Materi tersedia untuk Expert Member. Flow: Expert Access → Registration → Verification → Entitlement."
        action={
          <a
            href={registrationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white hover:bg-[#1D8CFF]"
          >
            Register for Expert Access <ExternalLink size={12} />
          </a>
        }
      />
      {published.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {published.map((e) => {
            const isLocked = e.expert?.locked ?? true;
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onOpen(e.id)}
                className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#0A1626] to-[#07111F] text-left shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] transition-all duration-500 hover:-translate-y-1 hover:border-[#1677FF]/35"
              >
                <div className="p-3">
                  <ExpertVisual
                    imageUrl={e.thumbnailUrl}
                    title={e.title}
                    locked={isLocked}
                  />
                </div>
                <div className="px-4 pb-4">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    Expert · {e.expert?.category ?? "method"}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-sm font-medium text-white">
                    {e.title}
                  </div>
                  <div className="mt-1.5 line-clamp-2 text-xs text-[#718096]">
                    {e.description}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-[#8B98AA]">
                      {isLocked ? "Locked untuk Free User" : "Available untuk Free User"}
                    </span>
                    {isLocked ? (
                      <Lock size={14} className="text-[#536275]" />
                    ) : (
                      <CheckCircle2 size={14} className="text-[#75BDFF]" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <StatusState
          icon={Lock}
          title="Belum ada modul Expert"
          description="Owner dapat menambahkan modul Expert."
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Community page ───────── */

function CommunityPage({
  discussions,
  onCreate,
}: {
  discussions: Discussion[];
  onCreate: (input: {
    title: string;
    body: string;
    category: Discussion["category"];
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] =
    useState<Discussion["category"]>("general");
  const [open, setOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const submit = async () => {
    if (!title.trim() || !body.trim() || posting) return;
    setPosting(true);
    setPostError(null);
    try {
      await onCreate({ title: title.trim(), body: body.trim(), category });
      setTitle("");
      setBody("");
      setCategory("general");
      setOpen(false);
    } catch (error) {
      setPostError(
        error instanceof Error ? error.message : "Gagal menyimpan diskusi.",
      );
    } finally {
      setPosting(false);
    }
  };

  const sorted = discussions
    .slice()
    .sort((a, b) =>
      a.pinned === b.pinned
        ? b.createdAt.localeCompare(a.createdAt)
        : a.pinned
          ? -1
          : 1,
    );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Community"
        title="Discussion"
        description="Area diskusi member. Posting disimpan ke IndexedDB sebelum dianggap berhasil."
        action={
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white hover:bg-[#1D8CFF]"
          >
            <Plus size={14} /> {open ? "Tutup" : "Buat diskusi"}
          </button>
        }
      />
      {open ? (
        <Surface className="p-5">
          <div className="grid gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul diskusi"
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Discussion["category"])
              }
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            >
              <option value="general">General</option>
              <option value="xauusd">XAUUSD</option>
              <option value="macro">Macro</option>
              <option value="education">Education</option>
            </select>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Isi diskusi…"
              className="w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 py-2 text-sm text-white outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={posting}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1677FF] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> {posting ? "Menyimpan…" : "Posting"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={posting}
                className="h-10 rounded-xl border border-white/[0.08] px-4 text-xs text-[#B9C3D1] disabled:opacity-50"
              >
                Batal
              </button>
              {postError ? (
                <span className="self-center text-xs text-red-300">{postError}</span>
              ) : null}
            </div>
          </div>
        </Surface>
      ) : null}
      <div className="grid gap-3">
        {sorted.length ? (
          sorted.map((d) => (
            <Surface key={d.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                <span className="rounded-md bg-[#1677FF]/10 px-2 py-0.5 text-[#75BDFF]">
                  {d.category}
                </span>
                {d.pinned ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#1677FF]/15 px-2 py-0.5 text-[#75BDFF]">
                    <Pin size={10} /> pinned
                  </span>
                ) : null}
                <span>·</span>
                <span>{formatDateTime(d.createdAt)}</span>
                <span>·</span>
                <span>{d.author}</span>
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                {d.title}
              </div>
              <p className="mt-2 whitespace-pre-line text-xs leading-6 text-[#8B98AA]">
                {d.body}
              </p>
              <div className="mt-3 text-[10px] text-[#536275]">
                {d.replies} balasan
              </div>
            </Surface>
          ))
        ) : (
          <StatusState
            icon={MessageSquare}
            title="Belum ada diskusi"
            description="Mulai diskusi pertama dengan tombol Buat diskusi."
          />
        )}
      </div>
    </div>
  );
}

/* ───────────────────────────── Live page ──────────── */

function LivePage({ lives }: { lives: LiveItem[] }) {
  const now = Date.now();
  const sorted = lives
    .slice()
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Community"
        title="Live"
        description="Jadwal live trading education. Status berdasarkan data owner."
      />
      {sorted.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((l) => {
            const start = new Date(l.scheduledAt).getTime();
            const isLive = l.status === "live";
            const isUpcoming = !isLive && start > now && l.status !== "ended";
            const badge = isLive
              ? "LIVE"
              : l.status === "ended"
                ? "ENDED"
                : isUpcoming
                  ? "UPCOMING"
                  : "SCHEDULED";
            return (
              <Surface key={l.id} className="overflow-hidden">
                <div className="relative aspect-video w-full overflow-hidden border-b border-white/[0.06]">
                  {l.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.coverUrl}
                      alt={l.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <TopicVisual kind="live" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute left-3 top-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] ${
                        isLive
                          ? "bg-red-500/90 text-white"
                          : "bg-black/60 text-[#B9C3D1]"
                      }`}
                    >
                      {isLive ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                          LIVE
                        </span>
                      ) : (
                        badge
                      )}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    {formatDateTime(l.scheduledAt)}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">
                    {l.title}
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-[#8B98AA]">
                    {l.description}
                  </p>
                  {l.watchUrl ? (
                    <a
                      href={l.watchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#3EA6FF]"
                    >
                      {isLive ? "Tonton sekarang" : "Buka link"}
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <div className="mt-3 text-[10px] text-[#536275]">
                      Link tonton belum diset.
                    </div>
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      ) : (
        <StatusState
          icon={Radio}
          title="Belum ada jadwal live"
          description="Owner dapat menambahkan melalui Owner Studio."
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Events page ─────────── */

function EventsPage({ events }: { events: EventItem[] }) {
  const sorted = events
    .filter((e) => e.status === "published")
    .slice()
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    );
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Community"
        title="Events"
        description="Sesi edukasi, webinar, dan live trading education."
      />
      {sorted.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((ev) => (
            <Surface key={ev.id} className="overflow-hidden">
              <div className="relative aspect-video w-full overflow-hidden border-b border-white/[0.06]">
                {ev.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.coverUrl}
                    alt={ev.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <TopicVisual kind="event" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {ev.pinned ? (
                  <div className="absolute right-3 top-3 rounded-md bg-[#1677FF]/90 px-2 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-white">
                    FEATURED
                  </div>
                ) : null}
              </div>
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                  {formatDateOnly(ev.date)} · {ev.time} WIB
                </div>
                <div className="mt-2 text-sm font-semibold text-white">
                  {ev.title}
                </div>
                <p className="mt-2 line-clamp-3 text-xs text-[#8B98AA]">
                  {ev.description}
                </p>
                {ev.joinUrl ? (
                  <a
                    href={ev.joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#1677FF] px-3 py-1.5 text-[11px] font-semibold text-white"
                  >
                    Join <ExternalLink size={11} />
                  </a>
                ) : (
                  <div className="mt-3 text-[10px] text-[#536275]">
                    Link join belum diset.
                  </div>
                )}
              </div>
            </Surface>
          ))}
        </div>
      ) : (
        <StatusState
          icon={Calendar}
          title="Belum ada event"
          description="Owner dapat menambahkan melalui Owner Studio."
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Announcements page ─── */

function AnnouncementsPage({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const sorted = announcements
    .filter((a) => a.status === "published")
    .slice()
    .sort((a, b) =>
      a.pinned === b.pinned
        ? b.createdAt.localeCompare(a.createdAt)
        : a.pinned
          ? -1
          : 1,
    );
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Community"
        title="Announcements"
        description="Pengumuman resmi platform NOXVEIL ARCANUM."
      />
      {sorted.length ? (
        <div className="grid gap-4">
          {sorted.map((a) => (
            <Surface key={a.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative h-40 w-full shrink-0 overflow-hidden border-b border-white/[0.06] md:h-auto md:w-60 md:border-b-0 md:border-r">
                  {a.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.coverUrl}
                      alt={a.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <TopicVisual kind="announcement" />
                  )}
                </div>
                <div className="flex-1 p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    {a.pinned ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#1677FF]/15 px-2 py-0.5 text-[#75BDFF]">
                        <Pin size={10} /> pinned
                      </span>
                    ) : null}
                    {a.category ? (
                      <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[#B9C3D1]">
                        {a.category}
                      </span>
                    ) : null}
                    <span>{formatDateTime(a.createdAt)}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    {a.title}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#B9C3D1]">
                    {a.body}
                  </p>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      ) : (
        <StatusState
          icon={Megaphone}
          title="Belum ada pengumuman"
          description="Owner dapat mempublikasikan."
        />
      )}
    </div>
  );
}

/* ───────────────────────────── Sessions page ──────── */

function SessionsPage() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => getWibParts());
  useEffect(() => {
    setMounted(true);
    setNow(getWibParts());
    const t = window.setInterval(() => setNow(getWibParts()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const open = SESSIONS.filter((s) => isSessionOpen(s, now.hour));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Tools"
        title="Session Clock"
        description="Empat pilar sesi pasar dunia: Sydney, Tokyo, London, New York."
      />
      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <Surface className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718096]">
            Waktu Indonesia Barat
          </div>
          <div className="mt-4">
            {mounted ? (
              <>
                <div className="font-mono text-4xl font-semibold tabular-nums text-white">
                  {now.timeStr}
                </div>
                <div className="mt-1 text-xs text-[#718096]">
                  {now.dateStr} · Asia/Jakarta
                </div>
              </>
            ) : (
              <div className="h-12 w-48 animate-pulse rounded bg-white/[0.05]" />
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {mounted && open.length ? (
              open.map((s) => (
                <span
                  key={s.id}
                  className="rounded-lg border border-[#1677FF]/18 bg-[#1677FF]/[0.07] px-2.5 py-1 text-[10px] font-medium text-[#BBD9FF]"
                >
                  {s.name} OPEN
                </span>
              ))
            ) : (
              <span className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1 text-[10px] text-[#718096]">
                No active session
              </span>
            )}
          </div>
        </Surface>
        <Surface className="p-5">
          <div className="text-sm font-semibold text-white">Session timeline</div>
          <p className="mt-1 text-xs text-[#718096]">
            00:00–24:00 WIB · indicator bergerak setiap menit.
          </p>
          <div className="mt-5 overflow-x-auto pb-2">
            <div className="min-w-[720px]">
              <div className="mb-3 ml-24 flex text-[9px] text-[#536275]">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div key={h} className="flex-1 text-center">
                    {String(h).padStart(2, "0")}
                  </div>
                ))}
              </div>
              <div className="relative space-y-3">
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-[#3EA6FF]"
                  style={{
                    left: `calc(96px + (100% - 96px) * ${now.totalMinutes / 1440})`,
                  }}
                />
                {SESSIONS.map((s) => {
                  const startPct = (s.open / 24) * 100;
                  const widthPct = ((s.close - s.open) / 24) * 100;
                  const isOpen = mounted && isSessionOpen(s, now.hour);
                  return (
                    <div key={s.id} className="flex items-center gap-4">
                      <div className="w-20 shrink-0">
                        <div className="text-xs font-medium text-white">
                          {s.name}
                        </div>
                        <div className="mt-0.5 text-[9px] text-[#637285]">
                          {String(s.open).padStart(2, "0")}:00–
                          {String(s.close > 24 ? s.close - 24 : s.close).padStart(2, "0")}
                          :00
                        </div>
                      </div>
                      <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-white/[0.035]">
                        <div
                          className="absolute inset-y-0 rounded-md opacity-80"
                          style={{
                            left: `${startPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: s.accent,
                            boxShadow: isOpen
                              ? `0 0 18px ${s.accent}55`
                              : undefined,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

/* ───────────────────────────── Calculators ────────── */

function ForexCalculatorPage() {
  const [balance, setBalance] = useState("1000");
  const [risk, setRisk] = useState("1");
  const [sl, setSl] = useState("30");
  const [pv, setPv] = useState("10");
  const result = useMemo(() => {
    const v = [balance, risk, sl, pv].map(Number);
    if (v.some((x) => !Number.isFinite(x))) return null;
    return calculateLotSize({
      balance: v[0],
      riskPercent: v[1],
      stopPips: v[2],
      pipValuePerLot: v[3],
    });
  }, [balance, risk, sl, pv]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Tools"
        title="Forex Calculator"
        description="Pip value per lot harus mengikuti symbol/broker Anda."
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Surface className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Account Balance", balance, setBalance],
              ["Risk (%)", risk, setRisk],
              ["Stop Loss (pips)", sl, setSl],
              ["Pip Value / Lot", pv, setPv],
            ].map(([label, val, setter]) => (
              <label key={label as string} className="block">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#718096]">
                  {label as string}
                </span>
                <input
                  type="number"
                  value={val as string}
                  onChange={(e) =>
                    (setter as (v: string) => void)(e.target.value)
                  }
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
                />
              </label>
            ))}
          </div>
        </Surface>
        <Surface className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718096]">
            Result
          </div>
          {result ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-xl border border-[#1677FF]/18 bg-[#1677FF]/[0.07] p-4">
                <div className="text-[10px] uppercase text-[#83C5FF]">
                  Recommended lot size
                </div>
                <div className="mt-1 font-mono text-3xl font-semibold text-white">
                  {result.lot.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#050B14] p-4 text-sm">
                <span className="text-[#718096]">Risk amount</span>
                <span className="font-mono text-white">
                  ${result.riskAmount.toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <StatusState
              icon={Calculator}
              title="Input belum valid"
              description="Isi seluruh nilai dengan angka positif."
            />
          )}
        </Surface>
      </div>
    </div>
  );
}

function CompoundingPage() {
  const [start, setStart] = useState("1000");
  const [rate, setRate] = useState("5");
  const [periods, setPeriods] = useState("12");
  const [add, setAdd] = useState("0");
  const result = useMemo(() => {
    const s = Number(start);
    const r = Number(rate);
    const c = Math.floor(Number(periods));
    const a = Number(add);
    if (![s, r, c, a].every(Number.isFinite)) return null;
    return calculateCompounding({
      startingBalance: s,
      returnPercent: r,
      periods: c,
      contributionPerPeriod: a,
    });
  }, [start, rate, periods, add]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Tools"
        title="Compounding Calculator"
        description="Simulasi matematis pertumbuhan saldo."
      />
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Surface className="p-5">
          <div className="space-y-4">
            {[
              ["Starting Balance", start, setStart],
              ["Return per Period (%)", rate, setRate],
              ["Number of Periods", periods, setPeriods],
              ["Contribution / Period", add, setAdd],
            ].map(([label, val, setter]) => (
              <label key={label as string} className="block">
                <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#718096]">
                  {label as string}
                </span>
                <input
                  type="number"
                  value={val as string}
                  onChange={(e) =>
                    (setter as (v: string) => void)(e.target.value)
                  }
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
                />
              </label>
            ))}
          </div>
        </Surface>
        <Surface className="overflow-hidden">
          <div className="grid gap-3 border-b border-white/[0.06] p-5 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.06] bg-[#050B14] p-3.5">
              <div className="text-[10px] uppercase text-[#637285]">Final</div>
              <div className="mt-1 font-mono text-lg text-white">
                {result ? `$${result.finalBalance.toFixed(2)}` : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#050B14] p-3.5">
              <div className="text-[10px] uppercase text-[#637285]">Growth</div>
              <div className="mt-1 font-mono text-lg text-white">
                {result ? `$${result.netGrowth.toFixed(2)}` : "—"}
              </div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-[#050B14] p-3.5">
              <div className="text-[10px] uppercase text-[#637285]">
                Contributions
              </div>
              <div className="mt-1 font-mono text-lg text-white">
                {result ? `$${result.totalContribution.toFixed(2)}` : "—"}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto p-5">
            {result ? (
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="text-[10px] uppercase tracking-[0.12em] text-[#637285]">
                  <tr>
                    <th className="pb-3">Period</th>
                    <th className="pb-3">Opening</th>
                    <th className="pb-3">Growth</th>
                    <th className="pb-3">Contribution</th>
                    <th className="pb-3 text-right">Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {result.rows.slice(0, 48).map((row) => (
                    <tr key={row.period}>
                      <td className="py-3 text-[#8B98AA]">{row.period}</td>
                      <td className="py-3 font-mono text-[#B9C3D1]">
                        ${row.opening.toFixed(2)}
                      </td>
                      <td className="py-3 font-mono text-[#B9C3D1]">
                        ${row.growth.toFixed(2)}
                      </td>
                      <td className="py-3 font-mono text-[#B9C3D1]">
                        ${row.contribution.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono text-white">
                        ${row.closing.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <StatusState
                icon={Percent}
                title="Input belum valid"
                description="Pastikan saldo, periode, dan kontribusi valid."
              />
            )}
          </div>
        </Surface>
      </div>
    </div>
  );
}

/* ───────────────────────────── Settings ───────────── */

function SettingsPage({
  settings,
  onUpdate,
  editable,
}: {
  settings: PlatformSettings;
  onUpdate: (patch: Partial<PlatformSettings>) => Promise<void>;
  editable: boolean;
}) {
  const [draft, setDraft] = useState<PlatformSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const fields: Array<{ key: keyof PlatformSettings; label: string; type?: "textarea" }> = [
    { key: "platformName", label: "Platform Name" },
    { key: "tagline", label: "Tagline" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "telegramUrl", label: "Telegram URL" },
    { key: "tradingViewSymbol", label: "TradingView Symbol" },
    { key: "tradingViewInterval", label: "TradingView Interval" },
    { key: "newsSourceLabel", label: "News Source Label" },
    { key: "calendarSourceLabel", label: "Calendar Source Label" },
  ];

  const setField = (key: keyof PlatformSettings, value: string) => {
    setSaved(false);
    setSaveError(null);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (!editable || saving) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await onUpdate(draft);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Gagal menyimpan settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Account"
        title="Settings"
        description={
          editable
            ? "Settings platform. Tekan Save agar perubahan ditulis ke IndexedDB."
            : "Settings platform. Hanya Owner yang dapat mengubah."
        }
      />
      <Surface className="p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <label
              key={f.key}
              className={`block ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
            >
              <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.12em] text-[#718096]">
                {f.label}
              </span>
              {f.type === "textarea" ? (
                <textarea
                  value={draft[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={!editable || saving}
                  rows={3}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 py-2 text-sm text-white outline-none disabled:opacity-60"
                />
              ) : (
                <input
                  value={draft[f.key]}
                  onChange={(e) => setField(f.key, e.target.value)}
                  disabled={!editable || saving}
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none disabled:opacity-60"
                />
              )}
            </label>
          ))}
        </div>

        {editable ? (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1677FF] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 size={14} /> {saving ? "Menyimpan…" : "Save Settings"}
            </button>
            {saved ? (
              <span className="text-xs text-emerald-300">Saved to IndexedDB.</span>
            ) : null}
            {saveError ? (
              <span className="text-xs text-red-300">{saveError}</span>
            ) : null}
          </div>
        ) : null}

        <p className="mt-4 text-[10px] leading-5 text-[#536275]">
          Canonical content persistence: IndexedDB. Default config hanya dipakai saat belum ada snapshot tersimpan.
        </p>
      </Surface>
    </div>
  );
}

/* ───────────────────────────── Owner pages ────────── */

function OwnerDashboardPage({
  store,
  onNavigate,
}: {
  store: Store;
  onNavigate: (p: PageId) => void;
}) {
  const items = [
    ["Videos", store.videos.length],
    ["PDFs", store.pdfs.length],
    ["Expert", store.expert.length],
    ["Live", store.lives.length],
    ["Events", store.events.length],
    ["Announcements", store.announcements.length],
    ["Brokers", store.brokers.length],
    ["Discussions", store.discussions.length],
  ] as const;
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Owner Studio"
        title="Owner Dashboard"
        description={`Ringkasan platform: ${store.settings.platformName}. Content store terhydrate dari IndexedDB.`}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map(([label, value]) => (
          <Surface key={label} className="p-5">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#637285]">
              {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              {value}
            </div>
          </Surface>
        ))}
      </div>
      <Surface className="p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#718096]">
          Providers
        </div>
        <div className="mt-4 space-y-2">
          {[
            ["TradingView Widget", "ENABLED (official)"],
            ["XAUUSD Price", "NOT CONNECTED"],
            ["Market News", "ROUTE /api/news"],
            ["Economic Calendar", "ROUTE /api/calendar"],
            ["World Market", "NOT CONNECTED"],
            ["Owner Content Persistence", "INDEXEDDB ENABLED"],
          ].map(([name, status]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-[#050B14] px-4 py-3"
            >
              <span className="text-xs text-[#B9C3D1]">{name}</span>
              <span className="text-[10px] font-medium text-[#8B98AA]">
                {status}
              </span>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onNavigate("owner-providers")}
          className="mt-4 text-xs font-medium text-[#3EA6FF]"
        >
          Lihat detail providers →
        </button>
      </Surface>
    </div>
  );
}

function OwnerMaterialListPage({
  collection,
  items,
  onCreate,
  onUpdate,
  onDelete,
  onEdit,
}: {
  collection: "video" | "pdf" | "expert";
  items: Material[];
  onCreate: () => void;
  onUpdate: (id: string, patch: Partial<Material>) => void;
  onDelete: (id: string) => void;
  onEdit: (id?: string) => void;
}) {
  const label =
    collection === "video"
      ? "Videos"
      : collection === "pdf"
        ? "PDF Library"
        : "Expert Modules";
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Owner Studio"
        title={label}
        description={`Kelola ${label.toLowerCase()}. Upload file, edit, hapus, publish/unpublish.`}
        action={
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white"
          >
            <Plus size={14} /> Tambah
          </button>
        }
      />
      <div className="space-y-3">
        {items.length ? (
          items
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((m) => (
              <Surface
                key={m.id}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center"
              >
                <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.06] md:h-16 md:w-28">
                  {m.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.thumbnailUrl}
                      alt={m.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : collection === "pdf" ? (
                    <PdfCover title={m.title} />
                  ) : (
                    <VideoThumb title={m.title} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] ${
                        m.status === "published"
                          ? "bg-[#1677FF]/15 text-[#75BDFF]"
                          : "bg-white/[0.05] text-[#8B98AA]"
                      }`}
                    >
                      {m.status}
                    </span>
                    <span>order #{m.order}</span>
                    {m.expert ? (
                      <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[#B9C3D1]">
                        {m.expert.category}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold text-white">
                    {m.title}
                  </div>
                  <div className="mt-1 line-clamp-1 text-xs text-[#718096]">
                    {m.description}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate(m.id, {
                        status:
                          m.status === "published" ? "draft" : "published",
                      })
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
                  >
                    {m.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  {collection === "expert" && m.expert ? (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdate(m.id, {
                          expert: {
                            category: m.expert?.category ?? "technical",
                            locked: !(m.expert?.locked ?? true),
                          },
                        })
                      }
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
                    >
                      <Lock size={12} />
                      {m.expert.locked ? "Unlock" : "Lock"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onEdit(m.id)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Hapus "${m.title}"?`)) onDelete(m.id);
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 text-[11px] text-red-400/80 hover:bg-red-500/10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </Surface>
            ))
        ) : (
          <Surface className="p-5">
            <StatusState
              icon={Upload}
              title={`Belum ada ${label.toLowerCase()}`}
              description="Tambah baru dengan tombol di atas."
            />
          </Surface>
        )}
      </div>
    </div>
  );
}

function OwnerMaterialEditPage({
  collection,
  material,
  onSave,
  onBack,
}: {
  collection: "video" | "pdf" | "expert";
  material?: Material;
  onSave: (data: Omit<Material, "id" | "kind">) => Promise<void>;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(material?.title ?? "");
  const [description, setDescription] = useState(material?.description ?? "");
  const [order, setOrder] = useState(String(material?.order ?? 1));
  const [status, setStatus] = useState<ContentStatus>(
    material?.status ?? "draft",
  );
  const [mediaUrl, setMediaUrl] = useState(material?.mediaUrl ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(
    material?.attachmentUrl ?? "",
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(
    material?.thumbnailUrl ?? "",
  );
  const [duration, setDuration] = useState(
    material?.durationMinutes ? String(material.durationMinutes) : "",
  );
  const [category, setCategory] = useState<ExpertCategory>(
    material?.expert?.category ?? "technical",
  );
  const [locked, setLocked] = useState(material?.expert?.locked ?? true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const label =
    collection === "video"
      ? "Video"
      : collection === "pdf"
        ? "PDF"
        : "Expert Module";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#718096] hover:text-[#3EA6FF]"
        >
          ← Owner Studio
        </button>
        <BackButton onClick={onBack} />
      </div>
      <Surface className="p-5 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 py-2 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Order
            </span>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
          {collection !== "pdf" ? (
            <label className="block">
              <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
                Duration (menit)
              </span>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
              />
            </label>
          ) : null}
          {collection === "expert" ? (
            <>
              <label className="block">
                <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
                  Category
                </span>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExpertCategory)
                  }
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
                >
                  <option value="technical">technical</option>
                  <option value="method">method</option>
                  <option value="execution">execution</option>
                </select>
              </label>
              <label className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={locked}
                  onChange={(e) => setLocked(e.target.checked)}
                  className="h-4 w-4 rounded border-white/[0.08] bg-[#050B14]"
                />
                <span className="text-xs text-[#B9C3D1]">
                  Lock untuk Free User
                </span>
              </label>
            </>
          ) : null}

          <div className="sm:col-span-2">
            <FileUploadField
              label="Thumbnail / Cover"
              accept="image/*"
              currentUrl={thumbnailUrl || undefined}
              onUploaded={(url) => setThumbnailUrl(url)}
              onClear={() => setThumbnailUrl("")}
            />
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt="preview"
                className="mt-3 max-h-40 w-auto rounded-xl border border-white/[0.08]"
              />
            ) : null}
          </div>

          {collection !== "pdf" ? (
            <div className="sm:col-span-2">
              <FileUploadField
                label="Video (.mp4 / .webm)"
                accept="video/*"
                currentUrl={mediaUrl || undefined}
                onUploaded={(url) => setMediaUrl(url)}
                onClear={() => setMediaUrl("")}
              />
              {mediaUrl ? (
                <video
                  src={mediaUrl}
                  controls
                  className="mt-3 max-h-48 w-full rounded-xl border border-white/[0.08] bg-black"
                />
              ) : null}
            </div>
          ) : (
            <div className="sm:col-span-2">
              <FileUploadField
                label="PDF file"
                accept="application/pdf"
                currentUrl={attachmentUrl || undefined}
                onUploaded={(url) => setAttachmentUrl(url)}
                onClear={() => setAttachmentUrl("")}
              />
              {attachmentUrl ? (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-[#3EA6FF]"
                >
                  <FileText size={13} /> Buka attachment
                </a>
              ) : null}
            </div>
          )}
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void (async () => {
                if (!title.trim() || saving) return;
                setSaving(true);
                setSaveError(null);
                try {
                  const base: Omit<Material, "id" | "kind"> = {
                    title: title.trim(),
                    description: description.trim(),
                    order: Number(order) || 1,
                    status,
                    mediaUrl: mediaUrl.trim() || undefined,
                    attachmentUrl: attachmentUrl.trim() || undefined,
                    thumbnailUrl: thumbnailUrl.trim() || undefined,
                    durationMinutes:
                      Number(duration) > 0 ? Number(duration) : undefined,
                  };
                  if (collection === "expert") {
                    await onSave({
                      ...base,
                      expert: { category, locked },
                    });
                  } else {
                    await onSave(base);
                  }
                } catch (error) {
                  setSaveError(
                    error instanceof Error ? error.message : "Gagal menyimpan materi.",
                  );
                } finally {
                  setSaving(false);
                }
              })()
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1677FF] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="h-10 rounded-xl border border-white/[0.08] px-4 text-xs text-[#B9C3D1] disabled:opacity-50"
          >
            Batal
          </button>
          {saveError ? (
            <span className="self-center text-xs text-red-300">{saveError}</span>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}

/* ───────────────────────────── Owner Live pages ───── */

function OwnerLiveListPage({
  lives,
  onCreate,
  onUpdate,
  onDelete,
  onEdit,
}: {
  lives: LiveItem[];
  onCreate: () => void;
  onUpdate: (id: string, patch: Partial<LiveItem>) => void;
  onDelete: (id: string) => void;
  onEdit: (id?: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Owner Studio"
        title="Live"
        description="Kelola jadwal live."
        action={
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white"
          >
            <Plus size={14} /> Live baru
          </button>
        }
      />
      <div className="space-y-3">
        {lives.map((l) => (
          <Surface key={l.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.06] md:h-16 md:w-28">
              {l.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.coverUrl}
                  alt={l.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <TopicVisual kind="live" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#637285]">
                <span>{formatDateTime(l.scheduledAt)}</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[9px] ${
                    l.status === "live"
                      ? "bg-red-500/90 text-white"
                      : "bg-white/[0.05] text-[#B9C3D1]"
                  }`}
                >
                  {l.status}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-white">
                {l.title}
              </div>
              <div className="mt-1 line-clamp-1 text-xs text-[#718096]">
                {l.description}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdate(l.id, {
                    status: l.status === "live" ? "ended" : "live",
                  })
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
              >
                {l.status === "live" ? "End" : "Set live"}
              </button>
              <button
                type="button"
                onClick={() => onEdit(l.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
              >
                <Edit3 size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus live "${l.title}"?`))
                    onDelete(l.id);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 text-[11px] text-red-400/80 hover:bg-red-500/10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function OwnerLiveEditPage({
  live,
  onSave,
  onBack,
}: {
  live?: LiveItem;
  onSave: (data: Omit<LiveItem, "id">) => Promise<void>;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(live?.title ?? "");
  const [description, setDescription] = useState(live?.description ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    live?.scheduledAt ?? new Date().toISOString().slice(0, 16),
  );
  const [status, setStatus] = useState<LiveItem["status"]>(
    live?.status ?? "scheduled",
  );
  const [watchUrl, setWatchUrl] = useState(live?.watchUrl ?? "");
  const [coverUrl, setCoverUrl] = useState<string | undefined>(
    live?.coverUrl,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#718096] hover:text-[#3EA6FF]"
        >
          ← Live
        </button>
        <BackButton onClick={onBack} />
      </div>
      <Surface className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 py-2 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Scheduled
            </span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as LiveItem["status"])}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            >
              <option value="scheduled">scheduled</option>
              <option value="live">live</option>
              <option value="ended">ended</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Watch URL
            </span>
            <input
              value={watchUrl}
              onChange={(e) => setWatchUrl(e.target.value)}
              placeholder="https://..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <div className="sm:col-span-2">
            <FileUploadField
              label="Thumbnail"
              accept="image/*"
              currentUrl={coverUrl}
              onUploaded={(url) => setCoverUrl(url)}
              onClear={() => setCoverUrl(undefined)}
            />
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="preview"
                className="mt-3 max-h-40 w-auto rounded-xl border border-white/[0.08]"
              />
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void (async () => {
                if (!title.trim() || saving) return;
                setSaving(true);
                setSaveError(null);
                try {
                  await onSave({
                    title: title.trim(),
                    description: description.trim(),
                    scheduledAt,
                    status,
                    watchUrl: watchUrl.trim() || undefined,
                    coverUrl,
                  });
                } catch (error) {
                  setSaveError(error instanceof Error ? error.message : "Gagal menyimpan live session.");
                } finally {
                  setSaving(false);
                }
              })()
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1677FF] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="h-10 rounded-xl border border-white/[0.08] px-4 text-xs text-[#B9C3D1] disabled:opacity-50"
          >
            Batal
          </button>
          {saveError ? (
            <span className="self-center text-xs text-red-300">{saveError}</span>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}

/* ───────────────────────────── Owner Event pages ─── */

function OwnerEventsPage({
  events,
  onCreate,
  onUpdate,
  onDelete,
  onEdit,
}: {
  events: EventItem[];
  onCreate: () => void;
  onUpdate: (id: string, patch: Partial<EventItem>) => void;
  onDelete: (id: string) => void;
  onEdit: (id?: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Owner Studio"
        title="Events"
        description="CRUD event & webinar."
        action={
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white"
          >
            <Plus size={14} /> Event baru
          </button>
        }
      />
      <div className="space-y-3">
        {events.map((ev) => (
          <Surface key={ev.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
            <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-xl border border-white/[0.06] md:h-16 md:w-28">
              {ev.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ev.coverUrl}
                  alt={ev.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <TopicVisual kind="event" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase text-[#637285]">
                <span>{ev.date}</span>
                <span>·</span>
                <span>{ev.time} WIB</span>
                <span
                  className={`rounded-md px-2 py-0.5 text-[9px] ${
                    ev.status === "published"
                      ? "bg-[#1677FF]/15 text-[#75BDFF]"
                      : "bg-white/[0.05] text-[#8B98AA]"
                  }`}
                >
                  {ev.status}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-white">
                {ev.title}
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdate(ev.id, {
                    status:
                      ev.status === "published" ? "draft" : "published",
                  })
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
              >
                {ev.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => onEdit(ev.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
              >
                <Edit3 size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus event "${ev.title}"?`))
                    onDelete(ev.id);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 text-[11px] text-red-400/80 hover:bg-red-500/10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function OwnerEventEditPage({
  event,
  onSave,
  onBack,
}: {
  event?: EventItem;
  onSave: (data: Omit<EventItem, "id">) => Promise<void>;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [date, setDate] = useState(
    event?.date ?? new Date().toISOString().slice(0, 10),
  );
  const [time, setTime] = useState(event?.time ?? "19:30");
  const [status, setStatus] = useState<ContentStatus>(
    event?.status ?? "draft",
  );
  const [joinUrl, setJoinUrl] = useState(event?.joinUrl ?? "");
  const [pinned, setPinned] = useState(Boolean(event?.pinned));
  const [coverUrl, setCoverUrl] = useState<string | undefined>(event?.coverUrl);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#718096] hover:text-[#3EA6FF]"
        >
          ← Events
        </button>
        <BackButton onClick={onBack} />
      </div>
      <Surface className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 py-2 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Time (WIB)
            </span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Join URL
            </span>
            <input
              value={joinUrl}
              onChange={(e) => setJoinUrl(e.target.value)}
              placeholder="https://..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 rounded border-white/[0.08] bg-[#050B14]"
            />
            <span className="text-xs text-[#B9C3D1]">Pin event</span>
          </label>
          <div className="sm:col-span-2">
            <FileUploadField
              label="Cover"
              accept="image/*"
              currentUrl={coverUrl}
              onUploaded={(url) => setCoverUrl(url)}
              onClear={() => setCoverUrl(undefined)}
            />
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="preview"
                className="mt-3 max-h-40 w-auto rounded-xl border border-white/[0.08]"
              />
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void (async () => {
                if (!title.trim() || saving) return;
                setSaving(true);
                setSaveError(null);
                try {
                  await onSave({
                    title: title.trim(),
                    description: description.trim(),
                    date,
                    time,
                    status,
                    joinUrl: joinUrl.trim() || undefined,
                    pinned,
                    coverUrl,
                  });
                } catch (error) {
                  setSaveError(error instanceof Error ? error.message : "Gagal menyimpan event.");
                } finally {
                  setSaving(false);
                }
              })()
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1677FF] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="h-10 rounded-xl border border-white/[0.08] px-4 text-xs text-[#B9C3D1] disabled:opacity-50"
          >
            Batal
          </button>
          {saveError ? (
            <span className="self-center text-xs text-red-300">{saveError}</span>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}

/* ───────────────────────────── Owner Announcement pages ─ */

function OwnerAnnouncementsPage({
  announcements,
  onCreate,
  onUpdate,
  onDelete,
  onEdit,
}: {
  announcements: Announcement[];
  onCreate: () => void;
  onUpdate: (id: string, patch: Partial<Announcement>) => void;
  onDelete: (id: string) => void;
  onEdit: (id?: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Owner Studio"
        title="Announcements"
        description="CRUD pengumuman."
        action={
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white"
          >
            <Plus size={14} /> Baru
          </button>
        }
      />
      <div className="space-y-3">
        {announcements.map((a) => (
          <Surface key={a.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase text-[#637285]">
              <span>{formatDateTime(a.createdAt)}</span>
              <span
                className={`rounded-md px-2 py-0.5 text-[9px] ${
                  a.status === "published"
                    ? "bg-[#1677FF]/15 text-[#75BDFF]"
                    : "bg-white/[0.05] text-[#8B98AA]"
                }`}
              >
                {a.status}
              </span>
              {a.pinned ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#1677FF]/15 px-2 py-0.5 text-[#75BDFF]">
                  <Pin size={10} /> pinned
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-sm font-semibold text-white">
              {a.title}
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-6 text-[#8B98AA]">
              {a.body}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  onUpdate(a.id, {
                    status:
                      a.status === "published" ? "draft" : "published",
                  })
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
              >
                {a.status === "published" ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => onUpdate(a.id, { pinned: !a.pinned })}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
              >
                <Pin size={12} /> {a.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                onClick={() => onEdit(a.id)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
              >
                <Edit3 size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus "${a.title}"?`)) onDelete(a.id);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 text-[11px] text-red-400/80 hover:bg-red-500/10"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function OwnerAnnouncementEditPage({
  announcement,
  onSave,
  onBack,
}: {
  announcement?: Announcement;
  onSave: (data: Omit<Announcement, "id" | "createdAt">) => Promise<void>;
  onBack: () => void;
}) {
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [body, setBody] = useState(announcement?.body ?? "");
  const [category, setCategory] = useState(announcement?.category ?? "general");
  const [status, setStatus] = useState<ContentStatus>(
    announcement?.status ?? "draft",
  );
  const [pinned, setPinned] = useState(Boolean(announcement?.pinned));
  const [coverUrl, setCoverUrl] = useState<string | undefined>(
    announcement?.coverUrl,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#718096] hover:text-[#3EA6FF]"
        >
          ← Announcements
        </button>
        <BackButton onClick={onBack} />
      </div>
      <Surface className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Body
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 py-2 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Category
            </span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="h-4 w-4 rounded border-white/[0.08] bg-[#050B14]"
            />
            <span className="text-xs text-[#B9C3D1]">Pin announcement</span>
          </label>
          <div className="sm:col-span-2">
            <FileUploadField
              label="Banner"
              accept="image/*"
              currentUrl={coverUrl}
              onUploaded={(url) => setCoverUrl(url)}
              onClear={() => setCoverUrl(undefined)}
            />
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt="preview"
                className="mt-3 max-h-40 w-auto rounded-xl border border-white/[0.08]"
              />
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void (async () => {
                if (!title.trim() || !body.trim() || saving) return;
                setSaving(true);
                setSaveError(null);
                try {
                  await onSave({
                    title: title.trim(),
                    body: body.trim(),
                    category,
                    status,
                    pinned,
                    coverUrl,
                  });
                } catch (error) {
                  setSaveError(error instanceof Error ? error.message : "Gagal menyimpan announcement.");
                } finally {
                  setSaving(false);
                }
              })()
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1677FF] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="h-10 rounded-xl border border-white/[0.08] px-4 text-xs text-[#B9C3D1] disabled:opacity-50"
          >
            Batal
          </button>
          {saveError ? (
            <span className="self-center text-xs text-red-300">{saveError}</span>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}

/* ───────────────────────────── Owner Broker pages ──── */

function OwnerBrokersPage({
  brokers,
  onCreate,
  onUpdate,
  onDelete,
  onEdit,
}: {
  brokers: Broker[];
  onCreate: () => void;
  onUpdate: (id: string, patch: Partial<Broker>) => void;
  onDelete: (id: string) => void;
  onEdit: (id?: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Owner Studio"
        title="Brokers"
        description="Kelola broker card."
        action={
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-[#1677FF] px-4 text-xs font-semibold text-white"
          >
            <Plus size={14} /> Broker baru
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {brokers.map((b) => (
          <Surface key={b.id} className="overflow-hidden">
            <div className="relative aspect-[16/7] w-full overflow-hidden border-b border-white/[0.06]">
              {b.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={b.logoUrl}
                  alt={b.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <BrokerVisual kind={b.visual} name={b.name} />
              )}
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-white">{b.name}</h3>
                <span
                  className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    b.status === "published"
                      ? "bg-[#1677FF]/15 text-[#75BDFF]"
                      : "bg-white/[0.05] text-[#8B98AA]"
                  }`}
                >
                  {b.status}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-[#8B98AA]">
                {b.description}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdate(b.id, {
                      status:
                        b.status === "published" ? "draft" : "published",
                    })
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
                >
                  {b.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(b.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
                >
                  <Edit3 size={12} /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus broker "${b.name}"?`))
                      onDelete(b.id);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 text-[11px] text-red-400/80 hover:bg-red-500/10"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

function OwnerBrokerEditPage({
  broker,
  onSave,
  onBack,
}: {
  broker?: Broker;
  onSave: (data: Omit<Broker, "id">) => Promise<void>;
  onBack: () => void;
}) {
  const [name, setName] = useState(broker?.name ?? "");
  const [description, setDescription] = useState(broker?.description ?? "");
  const [registerUrl, setRegisterUrl] = useState(broker?.registerUrl ?? "");
  const [visual, setVisual] = useState<Broker["visual"]>(
    broker?.visual ?? "generic",
  );
  const [status, setStatus] = useState<ContentStatus>(
    broker?.status ?? "draft",
  );
  const [disclaimer, setDisclaimer] = useState(broker?.disclaimer ?? "");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(broker?.logoUrl);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-[#718096] hover:text-[#3EA6FF]"
        >
          ← Brokers
        </button>
        <BackButton onClick={onBack} />
      </div>
      <Surface className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Visual
            </span>
            <select
              value={visual}
              onChange={(e) => setVisual(e.target.value as Broker["visual"])}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            >
              <option value="hfm">hfm</option>
              <option value="kos">kos</option>
              <option value="generic">generic</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 py-2 text-sm text-white outline-none"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Registration URL
            </span>
            <input
              value={registerUrl}
              onChange={(e) => setRegisterUrl(e.target.value)}
              placeholder="https://..."
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase text-[#718096]">
              Disclaimer
            </span>
            <input
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/[0.08] bg-[#050B14] px-3 text-sm text-white outline-none"
            />
          </label>
          <div className="sm:col-span-2">
            <FileUploadField
              label="Logo (opsional)"
              accept="image/*"
              currentUrl={logoUrl}
              onUploaded={(url) => setLogoUrl(url)}
              onClear={() => setLogoUrl(undefined)}
            />
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="preview"
                className="mt-3 max-h-24 w-auto rounded-xl border border-white/[0.08] bg-white/[0.02] p-2"
              />
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void (async () => {
                if (!name.trim() || !registerUrl.trim() || saving) return;
                setSaving(true);
                setSaveError(null);
                try {
                  await onSave({
                    name: name.trim(),
                    description: description.trim(),
                    registerUrl: registerUrl.trim(),
                    visual,
                    status,
                    disclaimer: disclaimer.trim() || undefined,
                    logoUrl,
                  });
                } catch (error) {
                  setSaveError(error instanceof Error ? error.message : "Gagal menyimpan broker.");
                } finally {
                  setSaving(false);
                }
              })()
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1677FF] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> {saving ? "Menyimpan…" : "Simpan"}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="h-10 rounded-xl border border-white/[0.08] px-4 text-xs text-[#B9C3D1] disabled:opacity-50"
          >
            Batal
          </button>
          {saveError ? (
            <span className="self-center text-xs text-red-300">{saveError}</span>
          ) : null}
        </div>
      </Surface>
    </div>
  );
}

/* ───────────────────────────── Owner Community ────── */

function OwnerCommunityPage({
  discussions,
  onUpdate,
  onDelete,
}: {
  discussions: Discussion[];
  onUpdate: (id: string, patch: Partial<Discussion>) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Owner Studio"
        title="Community"
        description="Moderasi diskusi: pin, hapus."
      />
      <div className="space-y-3">
        {discussions.map((d) => (
          <Surface key={d.id} className="p-5">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase text-[#637285]">
              <span className="rounded-md bg-[#1677FF]/10 px-2 py-0.5 text-[#75BDFF]">
                {d.category}
              </span>
              <span>{formatDateTime(d.createdAt)}</span>
              <span>·</span>
              <span>{d.author}</span>
            </div>
            <div className="mt-2 text-sm font-semibold text-white">
              {d.title}
            </div>
            <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs leading-6 text-[#8B98AA]">
              {d.body}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdate(d.id, { pinned: !d.pinned })}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] px-2.5 text-[11px] text-[#B9C3D1] hover:text-white"
              >
                <Pin size={12} /> {d.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus diskusi "${d.title}"?`))
                    onDelete(d.id);
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 text-[11px] text-red-400/80 hover:bg-red-500/10"
              >
                <Trash2 size={12} /> Hapus
              </button>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── Owner Providers ────── */

function OwnerProvidersPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Owner Studio"
        title="Provider / System Status"
        description="Status jujur semua provider. Tidak ada fake live indicator."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            name: "TradingView Widget",
            status: "ENABLED",
            detail:
              "Widget resmi dari s3.tradingview.com. Data mengikuti feed TradingView.",
          },
          {
            name: "XAUUSD Price",
            status: "NOT CONNECTED",
            detail: "Dashboard membaca /api/market?symbol=XAUUSD dan hanya menampilkan quote terverifikasi.",
          },
          {
            name: "Market News",
            status: "ROUTE /api/news",
            detail: "Client fetch ke /api/news.",
          },
          {
            name: "Economic Calendar",
            status: "ROUTE /api/calendar",
            detail: "Client fetch ke /api/calendar.",
          },
          {
            name: "World Market",
            status: "NOT CONNECTED",
            detail: "WORLD_MARKET_PROVIDER = null.",
          },
          {
            name: "Owner Content Persistence",
            status: "INDEXEDDB ENABLED",
            detail:
              "Owner CRUD, settings, broker logos, covers, media, events, announcements, dan community snapshot disimpan ke IndexedDB setelah transaksi selesai.",
          },
        ].map((p) => (
          <Surface key={p.name} className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-white">{p.name}</div>
              <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[10px] font-medium text-[#B9C3D1]">
                {p.status}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#8B98AA]">{p.detail}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── Main ───────────────── */

export default function FreeDashboard() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("member");
  const [view, setView] = useState<ViewState>({
    kind: "page",
    page: "dashboard",
  });
  const [history, setHistory] = useState<ViewState[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const store = useContentStore();
  const publishedIds = useMemo(
    () =>
      store.allPublishedMaterials
        .filter((m) => !m.expert?.locked)
        .map((m) => m.id),
    [store.allPublishedMaterials],
  );
  const progress = useLearningProgress(publishedIds);

  useEffect(() => {
    const s = window.localStorage.getItem(SIDEBAR_KEY);
    if (s === "true") setSidebarCollapsed(true);
  }, []);
  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

const navigate = useCallback(
  (page: PageId) => {
    if (page === "news") {
      router.push("/news");
      return;
    }

    if (page === "calendar") {
      router.push("/calendar");
      return;
    }

    setView({ kind: "page", page });
    setHistory([]);
    setMobileSidebarOpen(false);
  },
  [router],
);
  const pushView = useCallback((next: ViewState) => {
    setView((current) => {
      setHistory((items) => [...items.slice(-19), current]);
      return next;
    });
    setMobileSidebarOpen(false);
  }, []);

  const openMaterial = useCallback(
    (collection: "video" | "pdf" | "expert", id: string) =>
      pushView({ kind: "material", collection, id }),
    [pushView],
  );

  const goBack = useCallback(() => {
    if (history.length === 0) {
      setView({
        kind: "page",
        page: role === "owner" ? "owner-dashboard" : "dashboard",
      });
      return;
    }
    const prev = history[history.length - 1];
    setView(prev);
    setHistory(history.slice(0, -1));
  }, [history, role]);

  const activePage =
    view.kind === "page"
      ? view.page
      : view.kind === "material"
        ? view.collection === "video"
          ? "videos"
          : view.collection === "pdf"
            ? "pdfs"
            : "expert"
        : view.kind === "owner-material-edit"
          ? view.collection === "video"
            ? "owner-videos"
            : view.collection === "pdf"
              ? "owner-pdfs"
              : "owner-expert"
          : view.kind === "owner-live-edit"
            ? "owner-live"
            : view.kind === "owner-event-edit"
              ? "owner-events"
              : view.kind === "owner-announcement-edit"
                ? "owner-announcements"
                : "owner-brokers";

  const findMaterial = (
    c: "video" | "pdf" | "expert",
    id: string,
  ): Material | undefined => {
    if (c === "video") return store.videos.find((v) => v.id === id);
    if (c === "pdf") return store.pdfs.find((p) => p.id === id);
    return store.expert.find((e) => e.id === id);
  };

  if (!store.hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#02060C] px-6 text-[#F5F7FA]">
        <div className="rounded-2xl border border-[#1677FF]/20 bg-[#07111F] px-6 py-5 text-center shadow-2xl">
          <RefreshCw size={20} className="mx-auto mb-3 animate-spin text-[#3EA6FF]" />
          <div className="text-sm font-semibold">Loading saved NOXVEIL project…</div>
          <div className="mt-1 text-xs text-[#718096]">IndexedDB hydration berjalan sebelum default config digunakan.</div>
        </div>
      </div>
    );
  }

  const content = (() => {
    if (view.kind === "material") {
      const material = findMaterial(view.collection, view.id);
      if (!material || (role !== "owner" && material.status !== "published"))
        return (
          <StatusState
            title="Materi tidak ditemukan"
            description="ID tidak valid atau materi belum dipublikasikan."
          />
        );
      return (
        <MaterialDetailPage
          collection={view.collection}
          material={material}
          progress={progress}
          onBack={goBack}
          expertRegistrationUrl={store.settings.telegramUrl}
          onList={() =>
            navigate(
              view.collection === "video"
                ? "videos"
                : view.collection === "pdf"
                  ? "pdfs"
                  : "expert",
            )
          }
        />
      );
    }

    if (view.kind === "owner-material-edit") {
      const existing = view.id
        ? findMaterial(view.collection, view.id)
        : undefined;
      const c = view.collection;
      return (
        <OwnerMaterialEditPage
          collection={c}
          material={existing}
          onBack={() =>
            navigate(
              c === "video"
                ? "owner-videos"
                : c === "pdf"
                  ? "owner-pdfs"
                  : "owner-expert",
            )
          }
          onSave={async (data) => {
            if (c === "video") {
              if (view.id) await store.videoApi.update(view.id, data);
              else await store.videoApi.create(data);
              navigate("owner-videos");
            } else if (c === "pdf") {
              if (view.id) await store.pdfApi.update(view.id, data);
              else await store.pdfApi.create(data);
              navigate("owner-pdfs");
            } else {
              if (view.id) await store.expertApi.update(view.id, data);
              else await store.expertApi.create(data);
              navigate("owner-expert");
            }
          }}
        />
      );
    }

    if (view.kind === "owner-live-edit") {
      const existing = view.id
        ? store.lives.find((l) => l.id === view.id)
        : undefined;
      return (
        <OwnerLiveEditPage
          live={existing}
          onBack={() => navigate("owner-live")}
          onSave={async (data) => {
            if (view.id) await store.updateLive(view.id, data);
            else await store.createLive(data);
            navigate("owner-live");
          }}
        />
      );
    }

    if (view.kind === "owner-event-edit") {
      const existing = view.id
        ? store.events.find((e) => e.id === view.id)
        : undefined;
      return (
        <OwnerEventEditPage
          event={existing}
          onBack={() => navigate("owner-events")}
          onSave={async (data) => {
            if (view.id) await store.updateEvent(view.id, data);
            else await store.createEvent(data);
            navigate("owner-events");
          }}
        />
      );
    }

    if (view.kind === "owner-announcement-edit") {
      const existing = view.id
        ? store.announcements.find((a) => a.id === view.id)
        : undefined;
      return (
        <OwnerAnnouncementEditPage
          announcement={existing}
          onBack={() => navigate("owner-announcements")}
          onSave={async (data) => {
            if (view.id) await store.updateAnnouncement(view.id, data);
            else await store.createAnnouncement(data);
            navigate("owner-announcements");
          }}
        />
      );
    }

    if (view.kind === "owner-broker-edit") {
      const existing = view.id
        ? store.brokers.find((b) => b.id === view.id)
        : undefined;
      return (
        <OwnerBrokerEditPage
          broker={existing}
          onBack={() => navigate("owner-brokers")}
          onSave={async (data) => {
            if (view.id) await store.updateBroker(view.id, data);
            else await store.createBroker(data);
            navigate("owner-brokers");
          }}
        />
      );
    }

    switch (view.page) {
      case "dashboard":
        return (
          <DashboardPage
            store={store}
            progress={progress}
            onNavigate={navigate}
            onOpenMaterial={openMaterial}
          />
        );
      case "chart":
        return <TradingViewPage settings={store.settings} />;
      case "news":
        return <NewsPage />;
      case "calendar":
        return <CalendarPage />;
      case "world":
        return <WorldMarketPage />;
      case "videos":
        return (
          <VideosPage
            videos={store.videos}
            progress={progress}
            onOpen={(id) => openMaterial("video", id)}
          />
        );
      case "pdfs":
        return (
          <PdfsPage
            pdfs={store.pdfs}
            progress={progress}
            onOpen={(id) => openMaterial("pdf", id)}
          />
        );
      case "brokers":
        return <BrokersPage brokers={store.brokers} />;
      case "expert":
        return (
          <ExpertPage
            expert={store.expert}
            onOpen={(id) => openMaterial("expert", id)}
            registrationUrl={store.settings.telegramUrl}
          />
        );
      case "community":
        return (
          <CommunityPage
            discussions={store.discussions}
            onCreate={async (input) => {
              await store.createDiscussion({
                title: input.title,
                body: input.body,
                category: input.category,
                author: "Member",
              });
            }}
          />
        );
      case "live":
        return <LivePage lives={store.lives} />;
      case "events":
        return <EventsPage events={store.events} />;
      case "announcements":
        return <AnnouncementsPage announcements={store.announcements} />;
      case "forex-calc":
        return <ForexCalculatorPage />;
      case "compounding":
        return <CompoundingPage />;
      case "sessions":
        return <SessionsPage />;
      case "settings":
        return (
          <SettingsPage
            settings={store.settings}
            onUpdate={store.updateSettings}
            editable={role === "owner"}
          />
        );
      case "owner-dashboard":
        return <OwnerDashboardPage store={store} onNavigate={navigate} />;
      case "owner-videos":
        return (
          <OwnerMaterialListPage
            collection="video"
            items={store.videos}
            onCreate={() =>
              pushView({ kind: "owner-material-edit", collection: "video" })
            }
            onUpdate={store.videoApi.update}
            onDelete={store.videoApi.remove}
            onEdit={(id) =>
              pushView({
                kind: "owner-material-edit",
                collection: "video",
                id,
              })
            }
          />
        );
      case "owner-pdfs":
        return (
          <OwnerMaterialListPage
            collection="pdf"
            items={store.pdfs}
            onCreate={() =>
              pushView({ kind: "owner-material-edit", collection: "pdf" })
            }
            onUpdate={store.pdfApi.update}
            onDelete={store.pdfApi.remove}
            onEdit={(id) =>
              pushView({
                kind: "owner-material-edit",
                collection: "pdf",
                id,
              })
            }
          />
        );
      case "owner-expert":
        return (
          <OwnerMaterialListPage
            collection="expert"
            items={store.expert}
            onCreate={() =>
              pushView({ kind: "owner-material-edit", collection: "expert" })
            }
            onUpdate={store.expertApi.update}
            onDelete={store.expertApi.remove}
            onEdit={(id) =>
              pushView({
                kind: "owner-material-edit",
                collection: "expert",
                id,
              })
            }
          />
        );
      case "owner-live":
        return (
          <OwnerLiveListPage
            lives={store.lives}
            onCreate={() => pushView({ kind: "owner-live-edit" })}
            onUpdate={store.updateLive}
            onDelete={store.deleteLive}
            onEdit={(id) => pushView({ kind: "owner-live-edit", id })}
          />
        );
      case "owner-events":
        return (
          <OwnerEventsPage
            events={store.events}
            onCreate={() => pushView({ kind: "owner-event-edit" })}
            onUpdate={store.updateEvent}
            onDelete={store.deleteEvent}
            onEdit={(id) => pushView({ kind: "owner-event-edit", id })}
          />
        );
      case "owner-announcements":
        return (
          <OwnerAnnouncementsPage
            announcements={store.announcements}
            onCreate={() => pushView({ kind: "owner-announcement-edit" })}
            onUpdate={store.updateAnnouncement}
            onDelete={store.deleteAnnouncement}
            onEdit={(id) =>
              pushView({ kind: "owner-announcement-edit", id })
            }
          />
        );
      case "owner-brokers":
        return (
          <OwnerBrokersPage
            brokers={store.brokers}
            onCreate={() => pushView({ kind: "owner-broker-edit" })}
            onUpdate={store.updateBroker}
            onDelete={store.deleteBroker}
            onEdit={(id) => pushView({ kind: "owner-broker-edit", id })}
          />
        );
      case "owner-community":
        return (
          <OwnerCommunityPage
            discussions={store.discussions}
            onUpdate={store.updateDiscussion}
            onDelete={store.deleteDiscussion}
          />
        );
      case "owner-settings":
        return (
          <SettingsPage
            settings={store.settings}
            onUpdate={store.updateSettings}
            editable
          />
        );
      case "owner-providers":
        return <OwnerProvidersPage />;
      default:
        return null;
    }
  })();

  return (
    <div className="relative min-h-screen bg-[#02060C] text-[#F5F7FA] antialiased selection:bg-[#1D8CFF]/35">
      <style>{`
        @keyframes nxShellScan {
          0% { transform: translateY(-18px); opacity: 0; }
          10% { opacity: .16; }
          90% { opacity: .08; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        .nx-shell-scan { animation: nxShellScan 13s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .nx-shell-scan { animation: none !important; }
        }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_14%_-8%,rgba(33,136,255,0.22),transparent_44%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_88%_110%,rgba(26,93,230,0.18),transparent_46%)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#1677FF]/40 to-transparent" />
        <div className="nx-shell-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#5BAEFF]/20 to-transparent" />
      </div>

      <div className="relative z-10 flex h-screen w-full overflow-hidden">
        <Sidebar
          role={role}
          activePage={activePage}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onNavigate={navigate}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onSwitchRole={(r) => {
            setRole(r);
            navigate(r === "owner" ? "owner-dashboard" : "dashboard");
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            role={role}
            onOpenMobile={() => setMobileSidebarOpen(true)}
            store={store}
            onNavigate={navigate}
            onOpenMaterial={openMaterial}
          />
          <main className="relative min-h-0 flex-1 overflow-y-auto scroll-smooth [scrollbar-width:thin]">
            <div className="relative w-full px-3 py-4 sm:px-4 md:px-5 md:py-5 xl:px-6 xl:py-6 2xl:px-7 2xl:py-7">
              {store.persistenceError ? (
                <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-xs leading-5 text-red-200">
                  <strong>Persistence error:</strong> {store.persistenceError}
                </div>
              ) : store.persistenceState === "saving" ? (
                <div className="mb-4 rounded-xl border border-[#1677FF]/20 bg-[#1677FF]/[0.06] px-4 py-2 text-xs text-[#75BDFF]">
                  Menyimpan perubahan ke IndexedDB…
                </div>
              ) : null}
              {content}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}



