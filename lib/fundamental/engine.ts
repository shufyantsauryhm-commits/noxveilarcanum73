import type {
  EconomicEvent,
  FundamentalFactor,
  FundamentalPressure,
  NewsItem,
} from "@/types/intelligence";
import { normalizeText } from "./classification";

function numericValue(value?: string): number | null {
  if (!value) return null;
  const cleaned = value.replace(/,/g, "").trim();
  const match = cleaned.match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

export function compareActualForecast(event: EconomicEvent): {
  available: boolean;
  actual?: number;
  forecast?: number;
  previous?: number;
  delta?: number;
  text: string;
} {
  const actual = numericValue(event.actual);
  const forecast = numericValue(event.forecast);
  const previous = numericValue(event.previous);
  if (actual === null || forecast === null) {
    return {
      available: false,
      text: event.actual
        ? "Actual tersedia, tetapi forecast numerik tidak tersedia untuk perbandingan yang valid."
        : "Actual belum tersedia. Analisis tidak boleh menganggap hasil rilis sudah diketahui.",
    };
  }
  const delta = actual - forecast;
  const relation = delta > 0 ? "lebih tinggi" : delta < 0 ? "lebih rendah" : "sesuai";
  return {
    available: true,
    actual,
    forecast,
    previous: previous ?? undefined,
    delta,
    text: `Actual ${event.actual} ${relation} dari forecast ${event.forecast}.`,
  };
}

function factor(
  name: string,
  score: number,
  explanation: string,
): FundamentalFactor {
  return {
    factor: name,
    score,
    impact: score > 0 ? "positive" : score < 0 ? "negative" : "neutral",
    explanation,
  };
}

export function analyzeCalendarPressure(event: EconomicEvent): FundamentalPressure {
  const comparison = compareActualForecast(event);
  const t = normalizeText(event.event);
  const factors: FundamentalFactor[] = [];

  if (!comparison.available || comparison.delta === undefined) {
    factors.push(factor("Data release", 0, comparison.text));
    return { score: 0, label: "balanced", factors };
  }

  const hotter = comparison.delta > 0;
  const colder = comparison.delta < 0;
  let score = 0;

  if (event.category === "inflation") {
    score = hotter ? -2 : colder ? 2 : 0;
    factors.push(factor("Inflation", score, hotter
      ? "Inflasi di atas ekspektasi dapat meningkatkan tekanan hawkish, mendukung USD/yields, dan berpotensi menekan Gold."
      : colder
        ? "Inflasi di bawah ekspektasi dapat mengurangi tekanan hawkish dan berpotensi mendukung Gold."
        : "Inflasi sesuai ekspektasi memberi kejutan fundamental yang terbatas."));
  } else if (event.category === "labor-market") {
    const inverse = /unemployment|jobless|claims/.test(t);
    const strongLabor = inverse ? colder : hotter;
    score = strongLabor ? -2 : strongLabor === false ? 2 : 0;
    factors.push(factor("Employment", score, strongLabor
      ? "Data tenaga kerja yang lebih kuat dari ekspektasi dapat mendukung USD/yields dan berpotensi menekan Gold."
      : "Data tenaga kerja yang lebih lemah dari ekspektasi dapat menekan USD/yields dan berpotensi mendukung Gold."));
  } else if (event.category === "central-bank") {
    score = hotter ? -2 : colder ? 2 : 0;
    factors.push(factor("Interest Rate / Central Bank", score, hotter
      ? "Hasil yang lebih hawkish/tinggi dari ekspektasi cenderung mendukung mata uang dan yields terkait, sehingga dapat menekan Gold bila konteks USD dominan."
      : colder
        ? "Hasil yang lebih dovish/rendah dari ekspektasi dapat mengurangi tekanan yields dan berpotensi mendukung Gold."
        : "Keputusan sesuai ekspektasi membuat reaksi lebih bergantung pada guidance dan komunikasi bank sentral."));
  } else if (["growth", "consumer", "manufacturing", "business-activity"].includes(event.category)) {
    score = hotter ? -1 : colder ? 1 : 0;
    factors.push(factor("Growth", score, hotter
      ? "Data aktivitas yang lebih kuat dapat mendukung USD/yields dan menjadi tekanan moderat untuk Gold."
      : colder
        ? "Data aktivitas yang lebih lemah dapat meningkatkan ekspektasi pelonggaran dan berpotensi mendukung Gold."
        : "Data sesuai ekspektasi memberi kejutan terbatas."));
  } else {
    factors.push(factor("Macro", 0, "Hubungan langsung actual-vs-forecast terhadap Gold tidak cukup kuat untuk diberi arah otomatis."));
  }

  const clamped = Math.max(-5, Math.min(5, score));
  return {
    score: clamped,
    label: clamped > 0 ? "bullish-pressure" : clamped < 0 ? "bearish-pressure" : "balanced",
    factors,
  };
}

export function inferNewsPressure(item: NewsItem): FundamentalPressure {
  const text = normalizeText(`${item.headline} ${item.summary ?? ""}`);
  const factors: FundamentalFactor[] = [];
  let score = 0;

  if (/yield.*(rise|higher|surge)|dollar.*(rise|strong)|hawk|rate hike/.test(text)) {
    score -= 2;
    factors.push(factor("USD / Yields", -2, "Headline mengandung konteks USD/yields/hawkish yang umumnya menjadi tekanan bagi Gold, tetapi reaksi market aktual tetap perlu dikonfirmasi."));
  }
  if (/yield.*(fall|lower|drop)|dollar.*(fall|weak)|dovish|rate cut/.test(text)) {
    score += 2;
    factors.push(factor("USD / Yields", 2, "Headline mengandung konteks pelemahan USD/yields atau dovish yang umumnya dapat mendukung Gold."));
  }
  if (/war|conflict|attack|sanction|geopolit|risk off|safe haven/.test(text)) {
    score += 1;
    factors.push(factor("Risk Sentiment", 1, "Kenaikan risiko geopolitik/risk-off dapat meningkatkan permintaan safe-haven, termasuk Gold."));
  }
  if (item.category === "gold") {
    factors.push(factor("Gold", 0, "Berita secara langsung membahas Gold/XAUUSD; arah tidak ditentukan hanya dari kata kunci."));
  }
  if (!factors.length) {
    factors.push(factor("Context", 0, "Belum ada sinyal fundamental satu arah yang cukup kuat dari metadata berita saja."));
  }
  const clamped = Math.max(-5, Math.min(5, score));
  return {
    score: clamped,
    label: clamped > 0 ? "bullish-pressure" : clamped < 0 ? "bearish-pressure" : "balanced",
    factors,
  };
}