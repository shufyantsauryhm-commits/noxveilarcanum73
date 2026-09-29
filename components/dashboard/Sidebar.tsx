"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  BarChart3,
  CalendarDays,
  Bot,
  Signal,
  BookMarked,
  Users,
  Settings,
} from "lucide-react";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Academy",
    href: "/academy",
    icon: GraduationCap,
  },
  {
    title: "PDF Library",
    href: "/library",
    icon: BookOpen,
  },
  {
    title: "Market Research",
    href: "/research",
    icon: BarChart3,
  },
  {
    title: "Economic Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "AI Scanner",
    href: "/scanner",
    icon: Bot,
  },
  {
    title: "Premium Signal",
    href: "/signal",
    icon: Signal,
  },
  {
    title: "Trading Journal",
    href: "/journal",
    icon: BookMarked,
  },
  {
    title: "Community",
    href: "/community",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-72 border-r border-white/10 bg-[#090909]">
      <div className="flex h-full flex-col">
        <div className="border-b border-white/10 p-6">
          <h1 className="text-2xl font-bold tracking-widest text-cyan-400">
            NOXVEIL
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            ARCANUM
          </p>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {menu.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                  active
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={20} />

                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-5">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
            <p className="text-xs text-zinc-400">
              Membership
            </p>

            <p className="mt-1 text-lg font-bold text-cyan-400">
              EXPERT
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}