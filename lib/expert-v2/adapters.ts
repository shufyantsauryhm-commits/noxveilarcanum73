import type {
  ActivityItem,
  CalendarEvent,
  Intelligence,
  MarketData,
  Material,
  NewsItem,
  Pressure,
  Resource,
  Resources,
  Signal,
  ToolContext,
} from "./types";
export function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export function text(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim() &&
    !/^[-–—]+$/.test(value.trim())
    ? value.trim().slice(0, 8000)
    : null;
}
export function numeric(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (
    typeof value === "string" &&
    !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())
  )
    return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
export function timestamp(value: unknown): string | null {
  const object = record(value);
  const seconds = numeric(object.seconds ?? object._seconds);
  const input = seconds !== null ? seconds * 1000 : value;
  // A time-only string cannot establish freshness. Never substitute fetch time.
  if (
    typeof input === "string" &&
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d.*(?:Z|[+-]\d\d:\d\d)$/.test(input)
  )
    return null;
  if (typeof input !== "number" && typeof input !== "string") return null;
  const ms =
    typeof input === "number" && input > 1e9 && input < 1e11
      ? input * 1000
      : input;
  const date = new Date(ms);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}
export function safeLink(value: unknown): string | null {
  const url = text(value);
  if (!url) return null;
  if (/^\/api\/(?:uploads|media\/file)\/[a-zA-Z0-9._%()-]+$/.test(url))
    return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}
const scalar = (value: unknown) =>
  text(value) ?? (numeric(value) !== null ? String(value) : null);
function rows(raw: unknown, keys: string[]): unknown[] {
  if (Array.isArray(raw)) return raw.slice(0, 300);
  const object = record(raw);
  for (const key of keys)
    if (Array.isArray(object[key]))
      return (object[key] as unknown[]).slice(0, 300);
  if (Array.isArray(object.data)) return object.data.slice(0, 300);
  for (const key of keys) {
    const nested = record(object.data)[key];
    if (Array.isArray(nested)) return nested.slice(0, 300);
  }
  throw new Error("Format data belum cocok dengan terminal.");
}
function list<T>(
  raw: unknown,
  keys: string[],
  parse: (item: unknown, index: number) => T | null,
): T[] {
  const input = rows(raw, keys);
  const output = input.map(parse).filter((item): item is T => item !== null);
  if (input.length && !output.length)
    throw new Error("Data diterima, tetapi formatnya belum valid.");
  return output;
}
export function pressure(value: unknown): Pressure {
  const p = text(value)?.toUpperCase();
  return p === "BULLISH" ||
    p === "BEARISH" ||
    p === "NEUTRAL" ||
    p === "WAITING"
    ? p
    : "UNKNOWN";
}
export function parseMarket(raw: unknown): MarketData {
  const root = record(raw);
  const m = record(root.market ?? root.data ?? raw);
  const price = numeric(m.price);
  const source = text(m.source ?? root.source ?? m.provider ?? root.provider);
  if (price === null || price <= 0 || !source)
    throw new Error("NO MARKET DATA — harga atau sumber belum valid.");
  const symbol = text(m.symbol ?? root.symbol);
  if (symbol && !["XAUUSD", "XAU/USD", "XAU"].includes(symbol.toUpperCase()))
    throw new Error("Instrumen provider bukan XAUUSD.");
  const bid = numeric(m.bid),
    ask = numeric(m.ask),
    spread = numeric(m.spread);
  return {
    symbol: "XAUUSD",
    price,
    source,
    updatedAt: timestamp(
      m.updatedAt ??
        m.timestamp ??
        m.update ??
        root.updatedAt ??
        root.timestamp,
    ),
    realtime: m.realtime === true || root.realtime === true,
    change: numeric(m.change),
    changePercent: numeric(m.changePercent ?? m.percentChange),
    bid,
    ask,
    spread:
      spread !== null && spread >= 0
        ? spread
        : bid !== null && ask !== null && ask >= bid
          ? ask - bid
          : null,
    marketStatus: text(m.marketStatus),
    session: text(m.session),
    volatility: text(m.volatility),
  };
}
export function isLive(
  market: MarketData | null,
  now: number,
  online: boolean,
): boolean {
  if (!market?.updatedAt || !market.realtime || !online) return false;
  const age = now - Date.parse(market.updatedAt);
  return (
    age >= -5000 &&
    age <= 15000 &&
    market.marketStatus?.toUpperCase() !== "CLOSED"
  );
}
export function parseSignals(raw: unknown): Signal[] {
  return list<Signal>(raw, ["signals", "items"], (value) => {
    const s = record(value),
      direction = text(s.direction ?? s.side)?.toUpperCase();
    const entry = numeric(s.entry),
      sl = numeric(s.sl ?? s.stopLoss),
      createdAt = timestamp(s.createdAt ?? s.created);
    const status = text(s.status)?.toUpperCase().replaceAll("_", " ");
    const instrument = text(s.instrument ?? s.symbol),
      id = text(s.id);
    if (
      !id ||
      !instrument ||
      !createdAt ||
      entry === null ||
      entry <= 0 ||
      sl === null ||
      sl <= 0 ||
      (direction !== "BUY" && direction !== "SELL")
    )
      return null;
    if (
      status !== "ACTIVE" &&
      status !== "HIT TP" &&
      status !== "HIT SL" &&
      status !== "CANCELLED" &&
      status !== "EXPIRED"
    )
      return null;
    return {
      id,
      instrument,
      direction,
      entry,
      sl,
      createdAt,
      status,
      expiresAt: timestamp(s.expiresAt),
      tp1: numeric(s.tp1 ?? s.target1),
      tp2: numeric(s.tp2 ?? s.target2),
      risk: scalar(s.risk),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function effectiveSignalStatus(
  signal: Signal,
  now: number,
): Signal["status"] {
  return signal.status === "ACTIVE" &&
    signal.expiresAt &&
    Date.parse(signal.expiresAt) <= now
    ? "EXPIRED"
    : signal.status;
}
export function parseNews(raw: unknown): NewsItem[] {
  return list(raw, ["news", "articles", "items"], (value, i) => {
    const n = record(value),
      title = text(n.title ?? n.headline);
    if (!title) return null;
    return {
      id: text(n.id) ?? `news-${i}`,
      title,
      source: text(n.source) ?? text(record(n.source).name),
      time: timestamp(n.publishedAt ?? n.time ?? n.date),
      impact: text(n.impact),
      category: text(n.category),
      url: safeLink(n.url ?? n.link),
    };
  }).sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""));
}
export function parseCalendar(raw: unknown): CalendarEvent[] {
  return list(raw, ["events", "calendar", "items"], (value, i) => {
    const c = record(value),
      title = text(c.title ?? c.event ?? c.name),
      currency = text(c.currency ?? c.country);
    if (!title || !currency) return null;
    return {
      id: text(c.id) ?? `event-${i}`,
      title,
      currency,
      time: timestamp(c.time ?? c.date ?? c.timestamp),
      actual: scalar(c.actual),
      forecast: scalar(c.forecast),
      previous: scalar(c.previous),
      impact: text(c.impact),
      goldPressure:
        scalar(c.actual) !== null && scalar(c.forecast) !== null
          ? pressure(c.goldPressure)
          : "UNKNOWN",
    };
  }).sort((a, b) => (a.time ?? "9999").localeCompare(b.time ?? "9999"));
}
export function parseActivity(raw: unknown): ActivityItem[] {
  return list(raw, ["activity", "events", "items"], (value, i) => {
    const a = record(value),
      title = text(a.title ?? a.message ?? a.action);
    return title
      ? {
          id: text(a.id) ?? `activity-${i}`,
          title,
          time: timestamp(a.createdAt ?? a.time),
          type: text(a.type),
        }
      : null;
  }).sort((a, b) => (b.time ?? "").localeCompare(a.time ?? ""));
}
export function parseMaterials(raw: unknown): Material[] {
  return list(raw, ["items", "materials"], (value, i) => {
    const m = record(value),
      title = text(m.title);
    return title
      ? {
          id: text(m.id) ?? `material-${i}`,
          title,
          description: text(m.description),
          kind: text(m.kind ?? m.type) ?? "MATERI",
          url: safeLink(
            m.mediaUrl ?? m.attachmentUrl ?? m.videoUrl ?? m.fileUrl,
          ),
        }
      : null;
  });
}
export function parseIntelligence(raw: unknown): Intelligence {
  const root = record(raw),
    a = record(root.intelligence ?? root.data ?? raw);
  const market = text(a.marketContext),
    fundamental = text(a.fundamentalContext),
    technical = text(a.technicalContext),
    risk = text(a.riskContext),
    updatedAt = timestamp(a.updatedAt),
    source = text(a.source ?? root.source);
  if (!market || !fundamental || !technical || !risk || !updatedAt || !source)
    throw new Error("INTELLIGENCE ENGINE OFFLINE");
  return { market, fundamental, technical, risk, updatedAt, source };
}
export function parseTools(raw: unknown): ToolContext {
  const root = record(raw),
    s = record(root.state ?? root.data ?? raw),
    context = record(s.context);
  if (!Object.keys(context).length && !Array.isArray(s.zones))
    throw new Error("Konteks SND belum tersedia.");
  return {
    condition: text(context.condition),
    structure: text(context.structure),
    liquidity: text(context.liquidity),
    fundamental: pressure(context.fundamental),
    technical: pressure(context.technical),
    overall: pressure(context.overall),
    zones: Array.isArray(s.zones)
      ? s.zones.slice(0, 40).flatMap((value) => {
          const z = record(value),
            name = text(z.name),
            v = scalar(z.value);
          return name && v ? [{ name, value: v }] : [];
        })
      : [],
  };
}
export const adapters: { [K in Resource]: (raw: unknown) => Resources[K] } = {
  market: parseMarket,
  signals: parseSignals,
  news: parseNews,
  calendar: parseCalendar,
  intelligence: parseIntelligence,
  activity: parseActivity,
  materials: parseMaterials,
  tools: parseTools,
};
