"use client";

export default function Topbar() {
  return (
    <div className="h-16 border-b border-cyan-500/20 bg-[#07111f]/80 backdrop-blur-xl flex items-center justify-between px-6">
      <h1 className="text-white font-bold">
        NOXVEIL <span className="text-cyan-400">ARCANUM</span>
      </h1>

      <div className="text-sm text-zinc-400">
        Institutional Trading Intelligence
      </div>
    </div>
  );
}