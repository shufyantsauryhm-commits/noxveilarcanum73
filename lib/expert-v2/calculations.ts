export interface PositionInput {
  balance: number;
  riskPercent: number;
  entry: number;
  stop: number;
  contractSize: number;
  lotStep: number;
  minLot: number;
  maxLot: number;
  costPerLot: number;
  direction: "BUY" | "SELL";
}
export function sizePosition(p: PositionInput) {
  if (
    !Object.values(p).every((v) => typeof v !== "number" || Number.isFinite(v))
  )
    return null;
  if (
    p.balance <= 0 ||
    p.riskPercent <= 0 ||
    p.riskPercent > 100 ||
    p.entry <= 0 ||
    p.stop <= 0 ||
    p.contractSize <= 0 ||
    p.lotStep <= 0 ||
    p.minLot <= 0 ||
    p.maxLot < p.minLot ||
    p.costPerLot < 0
  )
    return null;
  if (p.direction === "BUY" ? p.stop >= p.entry : p.stop <= p.entry)
    return null;
  const budget = (p.balance * p.riskPercent) / 100,
    distance = Math.abs(p.entry - p.stop);
  const riskPerLot = distance * p.contractSize + p.costPerLot;
  if (
    !Number.isFinite(budget) ||
    !Number.isFinite(riskPerLot) ||
    riskPerLot <= 0
  )
    return null;
  const raw = Math.min(budget / riskPerLot, p.maxLot);
  let lots = Math.floor((raw + Number.EPSILON) / p.lotStep) * p.lotStep;
  if (lots * riskPerLot > budget) lots = Math.max(0, lots - p.lotStep);
  lots = Number(lots.toFixed(8));
  if (lots < p.minLot) lots = 0;
  return { budget, distance, lots, actualRisk: lots * riskPerLot };
}
export function fibonacci(start: number, end: number) {
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start <= 0 ||
    end <= 0 ||
    start === end
  )
    return null;
  return [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map((ratio) => ({
    ratio,
    price: end - (end - start) * ratio,
  }));
}
export function gridPlan(
  input: PositionInput,
  lastEntry: number,
  count: number,
) {
  if (
    !sizePosition(input) ||
    !Number.isFinite(lastEntry) ||
    lastEntry <= 0 ||
    !Number.isInteger(count) ||
    count < 2 ||
    count > 10
  )
    return null;
  if (
    input.direction === "BUY"
      ? lastEntry <= input.stop
      : lastEntry >= input.stop
  )
    return null;
  const entries = Array.from(
    { length: count },
    (_, i) => input.entry + ((lastEntry - input.entry) * i) / (count - 1),
  );
  const legs = entries.map((entry) => ({
    entry,
    size: sizePosition({
      ...input,
      entry,
      riskPercent: input.riskPercent / count,
    }),
  }));
  if (legs.some((leg) => !leg.size)) return null;
  return {
    legs,
    totalRisk: legs.reduce((sum, leg) => sum + (leg.size?.actualRisk ?? 0), 0),
    totalLots: legs.reduce((sum, leg) => sum + (leg.size?.lots ?? 0), 0),
  };
}
