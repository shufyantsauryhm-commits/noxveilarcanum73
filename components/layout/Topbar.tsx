"use client";

import {
  Bell,
  Search,
  UserCircle2,
  Crown,
} from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050505]/80 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-8">

        {/* LEFT */}
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome Back 👋
          </h2>

          <p className="mt-1 text-sm text-zinc-400">
            NOXVEIL ARCANUM Premium Dashboard
          </p>
        </div>

        {/* SEARCH */}
        <div className="hidden lg:flex w-[420px] items-center rounded-2xl border border-white/10 bg-[#111111] px-4 py-3">

          <Search
            size={18}
            className="text-zinc-500"
          />

          <input
            type="text"
            placeholder="Search academy, PDF, signal..."
            className="ml-3 w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />

        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4">

          <button className="relative rounded-xl border border-white/10 bg-[#101010] p-3 transition hover:border-cyan-500/30">

            <Bell
              size={18}
              className="text-white"
            />

            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-cyan-400"></span>

          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-2">

            <Crown
              size={18}
              className="text-cyan-400"
            />

            <div>

              <p className="text-xs text-zinc-400">
                Membership
              </p>

              <p className="font-bold text-cyan-400">
                EXPERT
              </p>

            </div>

          </div>

          <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#101010] px-3 py-2 transition hover:border-cyan-500/30">

            <UserCircle2
              size={38}
              className="text-cyan-400"
            />

            <div>

              <p className="text-sm font-semibold">
                Shufyan
              </p>

              <p className="text-xs text-zinc-500">
                Expert Member
              </p>

            </div>

          </button>

        </div>

      </div>
    </header>
  );
}