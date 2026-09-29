"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Terminal,
  Scan,
  Crosshair,
  Layers,
  Shield,
  Radio,
  BarChart3,
  CircleDot,
} from "lucide-react";

export default function NoxveilCore() {
  const [price, setPrice] = useState(2654.82);
  const [prevPrice, setPrevPrice] = useState(2654.82);
  const [change, setChange] = useState(4.82);
  const [changePct, setChangePct] = useState(0.182);
  const [confidence, setConfidence] = useState(78.4);
  const [isScanning, setIsScanning] = useState(false);
  const [command, setCommand] = useState("");
  const [statusText, setStatusText] = useState("System Ready");
  const [aiStatus, setAiStatus] = useState<"ONLINE" | "SCANNING" | "ANALYZING">("ONLINE");
  const inputRef = useRef<HTMLInputElement>(null);

  // Live price simulation (visual only)
  useEffect(() => {
    const interval = setInterval(() => {
      setPrevPrice(price);
      const delta = (Math.random() - 0.48) * 1.6;
      const next = Number((price + delta).toFixed(2));
      setPrice(next);
      const diff = next - 2650.0;
      setChange(Number(diff.toFixed(2)));
      setChangePct(Number(((diff / 2650.0) * 100).toFixed(3)));
    }, 1700);
    return () => clearInterval(interval);
  }, [price]);

  // Subtle confidence drift
  useEffect(() => {
    const t = setInterval(() => {
      setConfidence((c) => {
        const next = c + (Math.random() - 0.5) * 1.8;
        return Math.min(95.5, Math.max(54, Number(next.toFixed(1))));
      });
    }, 2800);
    return () => clearInterval(t);
  }, []);

  const handleScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setAiStatus("SCANNING");
    setStatusText("Scanning institutional flow...");
    setTimeout(() => {
      setAiStatus("ANALYZING");
      setStatusText("Analyzing market structure...");
    }, 1300);
    setTimeout(() => {
      setIsScanning(false);
      setAiStatus("ONLINE");
      setStatusText("Scan complete • High probability zone detected");
      setConfidence((c) => Math.min(94, Number((c + Math.random() * 5).toFixed(1))));
    }, 3100);
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    setStatusText(`Executing: ${command}`);
    setCommand("");
    handleScan();
  };

  const isUp = price >= prevPrice;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-blue-500/20">
      {/* ========== LAYERED BACKGROUND ========== */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#040B18] via-[#07142A] to-[#0B1F3A]" />
        <div className="absolute -top-40 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[110px]" />
        <div className="absolute -bottom-48 -left-40 h-[420px] w-[420px] rounded-full bg-cyan-500/12 blur-[130px]" />
        <div className="absolute top-1/2 left-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/8 blur-[100px]" />
        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(56,189,248,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(56,189,248,0.4) 1px, transparent 1px)
            `,
            backgroundSize: "42px 42px",
          }}
        />
        {/* Soft scanning line */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"
          animate={{ top: ["-2%", "102%"] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 p-5 sm:p-6 md:p-7">
        {/* ========== HEADER ========== */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-blue-500/25 blur-lg" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/30 bg-gradient-to-br from-[#0B1F3A] to-[#07142A] shadow-[0_0_28px_rgba(37,99,235,0.3)]">
                <Cpu className="h-5.5 w-5.5 text-cyan-300" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold tracking-[0.18em] text-white sm:text-xl">
                  NOXVEIL CORE
                </h2>
                <div className="hidden h-3.5 w-px bg-blue-500/40 sm:block" />
                <span className="hidden text-[10px] font-medium tracking-[0.22em] text-blue-300/70 sm:inline">
                  ENGINE
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[9px] font-medium tracking-wider text-blue-300">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  </span>
                  AI ONLINE
                </span>
                <span className="rounded-full border border-blue-500/20 bg-[#07142A]/80 px-2 py-0.5 text-[9px] font-medium tracking-wider text-blue-200/70">
                  v2.4.1
                </span>
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[9px] font-medium tracking-wider text-cyan-300/80">
                  INSTITUTIONAL
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-[#07142A]/60 px-2.5 py-1.5 backdrop-blur-sm">
              <Radio className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[10px] font-medium tracking-wider text-blue-200/80">
                LIVE FEED
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium tracking-wider text-emerald-300/90">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Thin accent line */}
        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        {/* ========== MAIN GRID ========== */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* LEFT — Live Price + Confidence */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Price Card */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#07142A]/90 to-[#040B18]/90 p-5 backdrop-blur-xl shadow-[0_0_40px_rgba(37,99,235,0.08)]">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
              <div className="relative">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium tracking-[0.2em] text-blue-300/70">
                      XAUUSD
                    </span>
                    <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-medium text-blue-300">
                      SPOT
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CircleDot className="h-3 w-3 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] tracking-wider text-cyan-300/80">LIVE</span>
                  </div>
                </div>

                <div className="flex items-end gap-3">
                  <motion.span
                    key={price}
                    initial={{ opacity: 0.6, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-bold tracking-tight text-white tabular-nums sm:text-5xl"
                    style={{
                      textShadow: "0 0 40px rgba(56,189,248,0.25)",
                    }}
                  >
                    {price.toFixed(2)}
                  </motion.span>
                  <div className="mb-1.5 flex flex-col">
                    <span
                      className={`flex items-center gap-1 text-sm font-semibold tabular-nums ${
                        isUp ? "text-cyan-300" : "text-rose-400"
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="h-3.5 w-3.5" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5" />
                      )}
                      {change >= 0 ? "+" : ""}
                      {change.toFixed(2)}
                    </span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        isUp ? "text-cyan-400/70" : "text-rose-400/70"
                      }`}
                    >
                      {changePct >= 0 ? "+" : ""}
                      {changePct.toFixed(3)}%
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-[10px] tracking-wider text-blue-200/50">
                  <span>BID 2654.61</span>
                  <span className="h-3 w-px bg-blue-500/20" />
                  <span>ASK 2655.03</span>
                  <span className="h-3 w-px bg-blue-500/20" />
                  <span>SPR 0.42</span>
                </div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#07142A]/90 to-[#040B18]/90 p-5 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-300" />
                  <span className="text-[11px] font-medium tracking-[0.18em] text-blue-200/80">
                    CONFIDENCE
                  </span>
                </div>
                <span className="text-sm font-bold tabular-nums text-cyan-300">
                  {confidence.toFixed(1)}%
                </span>
              </div>

              <div className="relative h-3 overflow-hidden rounded-full bg-[#040B18] border border-blue-500/10">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{
                    boxShadow: "0 0 20px rgba(56,189,248,0.45)",
                  }}
                />
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                  animate={{ x: ["-100%", "400%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="mt-3 flex justify-between text-[9px] tracking-wider text-blue-300/40">
                <span>LOW</span>
                <span>MODERATE</span>
                <span>HIGH</span>
                <span>EXTREME</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Quick Actions + AI Terminal */}
          <div className="lg:col-span-7 space-y-5">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: Scan, label: "Scan", action: handleScan },
                { icon: Crosshair, label: "Entry", action: () => setStatusText("Entry zones calculated") },
                { icon: Layers, label: "Structure", action: () => setStatusText("Market structure mapped") },
                { icon: BarChart3, label: "Flow", action: () => setStatusText("Institutional flow analyzed") },
              ].map((item) => (
                <motion.button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative flex flex-col items-center gap-2 rounded-xl border border-blue-500/15 bg-gradient-to-b from-[#0B1F3A]/80 to-[#07142A]/80 px-3 py-4 backdrop-blur-sm transition-all duration-300 hover:border-cyan-400/40 hover:shadow-[0_8px_30px_rgba(56,189,248,0.12)]"
                >
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-blue-500/0 to-cyan-500/0 opacity-0 transition-opacity group-hover:from-blue-500/5 group-hover:to-cyan-500/10 group-hover:opacity-100" />
                  <item.icon className="relative h-5 w-5 text-blue-300 transition-colors group-hover:text-cyan-300" />
                  <span className="relative text-[11px] font-medium tracking-wider text-blue-200/70 group-hover:text-white">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* AI Command Terminal */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[#040B18]/90 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-blue-500/15 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[11px] font-medium tracking-[0.15em] text-blue-200/80">
                    AI COMMAND
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-medium tracking-wider ${
                      aiStatus === "ONLINE"
                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : aiStatus === "SCANNING"
                          ? "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                          : "border border-blue-500/30 bg-blue-500/10 text-blue-300"
                    }`}
                  >
                    {aiStatus}
                  </span>
                </div>
              </div>

              <form onSubmit={handleCommand} className="p-4">
                <div className="relative flex items-center gap-3 rounded-xl border border-blue-500/20 bg-[#07142A]/80 px-4 py-3 transition-all focus-within:border-cyan-400/50 focus-within:shadow-[0_0_24px_rgba(56,189,248,0.15)]">
                  <span className="text-cyan-400/80 text-sm font-mono">›</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command (e.g. scan xauusd structure)"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-blue-300/30 outline-none font-mono tracking-wide"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={isScanning}
                    className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 text-[11px] font-bold tracking-wider text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] disabled:opacity-60"
                  >
                    {isScanning ? (
                      <span className="flex items-center gap-1.5">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Activity className="h-3 w-3" />
                        </motion.span>
                        SCAN
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3" />
                        RUN
                      </span>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Status line */}
              <div className="border-t border-blue-500/10 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  </span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={statusText}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[11px] tracking-wide text-blue-200/60 font-mono"
                    >
                      {statusText}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========== BOTTOM STATUS BAR ========== */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-500/15 bg-[#07142A]/50 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-4 text-[10px] tracking-wider text-blue-300/50">
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-cyan-400" />
              CORE ENGINE
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-blue-400" />
              LATENCY 12ms
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-emerald-400" />
              FEED STABLE
            </span>
          </div>
          <span className="text-[10px] tracking-[0.15em] text-blue-400/40">
            NOXVEIL ARCANUM • INSTITUTIONAL
          </span>
        </div>
      </div>
    </div>
  );
}