export type ExpertRole = "OWNER" | "EXPERT" | "FREE";
export type SystemStatus = "ONLINE" | "OFFLINE" | "DEGRADED" | "WAITING";
export type Pressure =
  "BULLISH" | "BEARISH" | "NEUTRAL" | "WAITING" | "UNKNOWN";
export interface ExpertSession {
  uid: string;
  name: string;
  role: ExpertRole;
}
export type Resource =
  | "market"
  | "signals"
  | "news"
  | "calendar"
  | "intelligence"
  | "activity"
  | "materials"
  | "tools";
export type View =
  | "overview"
  | "market"
  | "signals"
  | "snd"
  | "news"
  | "calendar"
  | "intelligence"
  | "tools"
  | "library"
  | "system";
export interface Feed<T> {
  data: T | null;
  status: SystemStatus;
  error: string | null;
  receivedAt: number | null;
}
export interface MarketData {
  symbol: "XAUUSD";
  price: number;
  change: number | null;
  changePercent: number | null;
  bid: number | null;
  ask: number | null;
  spread: number | null;
  source: string;
  updatedAt: string | null;
  realtime: boolean;
  marketStatus: string | null;
  session: string | null;
  volatility: string | null;
}
export interface Signal {
  id: string;
  instrument: string;
  direction: "BUY" | "SELL";
  entry: number;
  sl: number;
  tp1: number | null;
  tp2: number | null;
  risk: string | null;
  createdAt: string;
  expiresAt: string | null;
  status: "ACTIVE" | "HIT TP" | "HIT SL" | "CANCELLED" | "EXPIRED";
}
export interface NewsItem {
  id: string;
  title: string;
  source: string | null;
  time: string | null;
  impact: string | null;
  category: string | null;
  url: string | null;
}
export interface CalendarEvent {
  id: string;
  title: string;
  currency: string;
  time: string | null;
  actual: string | null;
  forecast: string | null;
  previous: string | null;
  impact: string | null;
  goldPressure: Pressure;
}
export interface ActivityItem {
  id: string;
  title: string;
  time: string | null;
  type: string | null;
}
export interface Material {
  id: string;
  title: string;
  kind: string;
  description: string | null;
  url: string | null;
}
export interface Intelligence {
  market: string;
  fundamental: string;
  technical: string;
  risk: string;
  updatedAt: string;
  source: string;
}
export interface ToolContext {
  condition: string | null;
  structure: string | null;
  liquidity: string | null;
  fundamental: Pressure;
  technical: Pressure;
  overall: Pressure;
  zones: { name: string; value: string }[];
}
export interface Resources {
  market: MarketData;
  signals: Signal[];
  news: NewsItem[];
  calendar: CalendarEvent[];
  intelligence: Intelligence;
  activity: ActivityItem[];
  materials: Material[];
  tools: ToolContext;
}
export interface FeedResponse {
  status: SystemStatus;
  payload?: unknown;
  error?: string;
}
