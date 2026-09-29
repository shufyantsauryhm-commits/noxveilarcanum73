import "server-only";

export type MarketSnapshot = {
  symbol: "XAUUSD";
  bid: number | null;
  ask: number | null;
  price: number | null;
  spread: number | null;
  timestamp: string;
  status: "LIVE";
  provider: "twelvedata";
};

export class MarketProviderError extends Error {
  constructor(
    message: string,
    public readonly kind:
      | "NOT_CONFIGURED"
      | "PROVIDER_ERROR"
      | "INVALID_RESPONSE",
  ) {
    super(message);
    this.name = "MarketProviderError";
  }
}

type TwelveDataQuoteResponse = {
  datetime?: string;
  timestamp?: number;
  close?: string;
  bid?: string;
  ask?: string;
  code?: number;
  message?: string;
  status?: string;
};

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function fetchXauUsdSnapshot(): Promise<MarketSnapshot> {
  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new MarketProviderError(
      "MARKET_DATA_API_KEY belum diisi. Set di .env.local lalu restart dev server.",
      "NOT_CONFIGURED",
    );
  }

  const symbol = process.env.MARKET_DATA_SYMBOL?.trim() || "XAU/USD";
  const url = new URL("https://api.twelvedata.com/quote");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("apikey", apiKey);

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      next: { revalidate: 15 },
      headers: { Accept: "application/json" },
    });
  } catch (error) {
    throw new MarketProviderError(
      `Network error ke Twelve Data: ${
        error instanceof Error ? error.message : "unknown"
      }`,
      "PROVIDER_ERROR",
    );
  }

  if (!res.ok) {
    throw new MarketProviderError(
      `Twelve Data HTTP ${res.status} ${res.statusText}`,
      "PROVIDER_ERROR",
    );
  }

  let json: TwelveDataQuoteResponse;
  try {
    json = (await res.json()) as TwelveDataQuoteResponse;
  } catch {
    throw new MarketProviderError(
      "Twelve Data mengembalikan response bukan JSON.",
      "INVALID_RESPONSE",
    );
  }

  if (json.code && json.code !== 200) {
    throw new MarketProviderError(
      `Twelve Data error ${json.code}: ${json.message ?? "unknown"}`,
      "PROVIDER_ERROR",
    );
  }
  if (json.status === "error") {
    throw new MarketProviderError(
      `Twelve Data error: ${json.message ?? "unknown"}`,
      "PROVIDER_ERROR",
    );
  }

  const bid = parseNumber(json.bid);
  const ask = parseNumber(json.ask);
  const price = parseNumber(json.close);

  if (price === null && bid === null && ask === null) {
    throw new MarketProviderError(
      "Twelve Data tidak mengembalikan price/bid/ask. Cek symbol atau plan.",
      "INVALID_RESPONSE",
    );
  }

  const spread =
    bid !== null && ask !== null ? Number((ask - bid).toFixed(2)) : null;

  const timestamp =
    typeof json.timestamp === "number"
      ? new Date(json.timestamp * 1000).toISOString()
      : json.datetime
        ? new Date(json.datetime).toISOString()
        : new Date().toISOString();

  return {
    symbol: "XAUUSD",
    bid,
    ask,
    price,
    spread,
    timestamp,
    status: "LIVE",
    provider: "twelvedata",
  };
}