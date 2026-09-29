"use client";

import type { IntelligenceCategory } from "@/types/intelligence";

export default function IntelligenceVisual({
  category,
  label,
  compact = false,
}: {
  category: IntelligenceCategory;
  label?: string;
  compact?: boolean;
}) {
  const icon =
    category === "inflation" ? "%" :
    category === "labor-market" ? "EMP" :
    category === "central-bank" ? "CB" :
    category === "growth" ? "GDP" :
    category === "consumer" ? "RET" :
    category === "manufacturing" ? "MFG" :
    category === "business-activity" ? "PMI" :
    category === "housing" ? "HOM" :
    category === "trade" ? "TRD" :
    category === "energy" ? "OIL" :
    category === "gold" ? "XAU" :
    category === "geopolitics" ? "GEO" :
    category === "risk-sentiment" ? "RSK" :
    category === "china" ? "CN" :
    category === "commodities" ? "CMD" :
    category === "holiday" ? "OFF" : "MAC";

  return (
    <div className={`relative overflow-hidden rounded-xl border border-[#4EA4FF]/[0.12] bg-[linear-gradient(145deg,rgba(9,25,46,0.98),rgba(4,11,22,0.99))] ${compact ? "h-16" : "aspect-[16/7] min-h-40"}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(30,130,255,0.26),transparent_52%)]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="relative flex h-full items-center justify-between gap-3 px-4">
        <div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#75BDFF]">NOXVEIL INTEL</div>
          {label ? <div className="mt-1 max-w-[260px] truncate text-xs text-[#8EA3BA]">{label}</div> : null}
        </div>
        <div className="flex h-11 min-w-11 items-center justify-center rounded-xl border border-[#1677FF]/25 bg-[#1677FF]/10 px-2 font-mono text-[11px] font-bold tracking-[0.1em] text-[#A9D4FF]">
          {icon}
        </div>
      </div>
    </div>
  );
}