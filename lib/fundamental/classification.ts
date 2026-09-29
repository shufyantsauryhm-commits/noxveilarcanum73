import type {
  IntelligenceCategory,
  IntelligenceRelevance,
} from "@/types/intelligence";

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9%+.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function classifyCategory(text: string): IntelligenceCategory {
  const t = normalizeText(text);

  if (/\b(core cpi|cpi|consumer price|core pce|pce|core ppi|ppi|producer price|inflation)\b/.test(t)) return "inflation";
  if (/\b(nfp|nonfarm|non farm|unemployment|jobless|claims|jolts|adp|employment|payroll|labor market|labour market)\b/.test(t)) return "labor-market";
  if (/\b(fomc|federal reserve|\bfed\b|interest rate|rate decision|monetary policy|ecb|boe|boj|rba|rbnz|boc|snb|central bank)\b/.test(t)) return "central-bank";
  if (/\b(gdp|economic growth|growth rate)\b/.test(t)) return "growth";
  if (/\b(retail sales|consumer confidence|consumer sentiment|personal spending|consumer spending)\b/.test(t)) return "consumer";
  if (/\b(manufacturing|industrial production|durable goods|factory orders)\b/.test(t)) return "manufacturing";
  if (/\b(ism services|ism manufacturing|services pmi|manufacturing pmi|composite pmi|\bpmi\b|business activity)\b/.test(t)) return "business-activity";
  if (/\b(housing|home sales|building permits|mortgage)\b/.test(t)) return "housing";
  if (/\b(trade balance|current account|imports|exports)\b/.test(t)) return "trade";
  if (/\b(crude oil|brent|wti|natural gas|oil inventories|energy)\b/.test(t)) return "energy";
  if (/\b(gold|xau|xauusd|precious metal)\b/.test(t)) return "gold";
  if (/\b(china|chinese|pboc)\b/.test(t)) return "china";
  if (/\b(war|missile|conflict|sanction|geopolit|ceasefire|invasion|attack)\b/.test(t)) return "geopolitics";
  if (/\b(risk off|risk-on|risk on|volatility|safe haven|market stress)\b/.test(t)) return "risk-sentiment";
  if (/\b(commodity|commodities|copper|silver)\b/.test(t)) return "commodities";
  if (/\b(bank holiday|holiday)\b/.test(t)) return "holiday";
  return "macro";
}

export function classifyRelevance(
  text: string,
  currency?: string,
): IntelligenceRelevance {
  const t = normalizeText(text);
  if (/\b(gold|xau|xauusd|precious metal)\b/.test(t)) return "gold";
  if ((currency ?? "").toUpperCase() === "USD") return "usd";
  if (/\b(fomc|federal reserve|\bfed\b|dxy|treasury|yield|cpi|pce|ppi|nfp|nonfarm|us dollar|usd)\b/.test(t)) return "usd";
  if (/\b(gdp|inflation|employment|central bank|geopolit|oil|china|recession|risk off|risk-on)\b/.test(t)) return "macro";
  return "general";
}

export function buildImageQuery(
  text: string,
  currency?: string,
): string {
  const category = classifyCategory(text);
  const prefix =
    currency === "USD" ? "US " :
    currency === "EUR" ? "Eurozone " :
    currency === "GBP" ? "UK " :
    currency === "JPY" ? "Japan " :
    currency === "CNY" ? "China " : "";

  const map: Record<IntelligenceCategory, string> = {
    inflation: "inflation CPI PCE producer consumer prices economic data",
    "labor-market": "jobs employment labor market payrolls economic data",
    "central-bank": "central bank interest rate monetary policy",
    growth: "GDP economic growth macro data",
    consumer: "consumer spending retail sales economy",
    manufacturing: "manufacturing industry factory economic data",
    "business-activity": "PMI ISM business activity services economy",
    housing: "housing property mortgage economic data",
    trade: "international trade imports exports economy",
    energy: "energy oil crude commodities market",
    gold: "gold XAUUSD precious metals financial market",
    geopolitics: "geopolitical risk global markets safe haven",
    "risk-sentiment": "financial market risk sentiment volatility",
    china: "China economy macro financial markets",
    commodities: "global commodities financial markets",
    holiday: "financial market bank holiday calendar",
    macro: "global macroeconomics financial markets",
  };
  return `${prefix}${map[category]}`.trim();
}

export function countryLabel(code: string | undefined, currency?: string): string | undefined {
  const byCode: Record<string, string> = {
    US: "United States", EU: "Eurozone", GB: "United Kingdom", JP: "Japan",
    AU: "Australia", NZ: "New Zealand", CA: "Canada", CH: "Switzerland",
    CN: "China", DE: "Germany", FR: "France", IT: "Italy", ES: "Spain",
  };
  const normalized = (code ?? "").toUpperCase();
  if (byCode[normalized]) return byCode[normalized];
  const byCurrency: Record<string, string> = {
    USD: "United States", EUR: "Eurozone", GBP: "United Kingdom", JPY: "Japan",
    AUD: "Australia", NZD: "New Zealand", CAD: "Canada", CHF: "Switzerland", CNY: "China",
  };
  return currency ? byCurrency[currency.toUpperCase()] : undefined;
}