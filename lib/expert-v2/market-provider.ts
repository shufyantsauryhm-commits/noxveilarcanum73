import "server-only";
import { numeric, record, text, timestamp } from "./adapters";
import type { MarketData } from "./types";
let cache: { expiresAt: number; data: MarketData | null } | null = null;
let pending: Promise<MarketData | null> | null = null;
async function readProvider(): Promise<MarketData | null> {
  const configured = process.env.MARKET_DATA_API_URL;
  const url = new URL(configured || "https://api.gold-api.com/price/XAU");
  if (url.protocol !== "https:" || url.username || url.password)
    throw new Error("Invalid market provider URL");
  const key = configured ? process.env.MARKET_DATA_API_KEY : undefined;
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    headers: key ? { Authorization: `Bearer ${key}` } : {},
  });
  if (!response.ok) throw new Error("Market provider unavailable");
  const raw = record(await response.json()),
    data = record(raw.data ?? raw.quote ?? raw);
  const price = numeric(data.price);
  if (price === null || price <= 0) throw new Error("Invalid price");
  const symbol = text(data.symbol)?.toUpperCase();
  if (symbol && !["XAU", "XAUUSD", "XAU/USD"].includes(symbol))
    throw new Error("Invalid symbol");
  const bid = numeric(data.bid),
    ask = numeric(data.ask),
    spread = numeric(data.spread);
  return {
    symbol: "XAUUSD",
    price,
    source:
      text(process.env.MARKET_DATA_SOURCE_LABEL) ??
      (configured ? "Configured market provider" : "Gold API"),
    updatedAt: timestamp(data.updatedAt ?? data.timestamp),
    realtime: data.realtime === true,
    change: numeric(data.change),
    changePercent: numeric(data.changePercent),
    bid,
    ask,
    spread:
      spread !== null && spread >= 0
        ? spread
        : bid !== null && ask !== null && ask >= bid
          ? ask - bid
          : null,
    marketStatus: text(data.marketStatus),
    session: text(data.session),
    volatility: text(data.volatility),
  };
}
export async function getVerifiedMarket(): Promise<MarketData | null> {
  if (cache && cache.expiresAt > Date.now()) return cache.data;
  if (pending) return pending;
  pending = readProvider()
    .catch(() => null)
    .then((data) => {
      cache = { data, expiresAt: Date.now() + (data ? 5000 : 15000) };
      return data;
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}
