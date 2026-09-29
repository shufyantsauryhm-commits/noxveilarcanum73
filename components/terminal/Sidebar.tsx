"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Zap,
  Compass,
  Bot,
  ShieldAlert,
  Newspaper,
  BookOpen,
  Calendar,
  MessageSquare,
  Headphones,
  ChevronLeft,
  ChevronRight,
  Lock,
  LogOut,
  Activity,
} from "lucide-react";
import { UserRole } from "@/types/terminal";

interface SidebarProps {
  userRole: UserRole;
}

type NavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  isPremium: boolean;
};

type NavigationSection = {
  group: string;
  items: NavigationItem[];
};

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation: NavigationSection[] = [
    {
      group: "TERMINAL",
      items: [
        {
          name: "Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
          isPremium: false,
        },
        {
          name: "AI Signals",
          href: "/expert/signals",
          icon: Zap,
          isPremium: true,
        },
        {
          name: "Market Outlook",
          href: "/expert/outlook",
          icon: Compass,
          isPremium: true,
        },
        {
          name: "AI Analytics",
          href: "/expert/analytics",
          icon: Bot,
          isPremium: true,
        },
        {
          name: "SND Zones",
          href: "/expert/snd",
          icon: ShieldAlert,
          isPremium: true,
        },
      ],
    },
    {
      group: "INTELLIGENCE",
      items: [
        {
          name: "Market News",
          href: "/news",
          icon: Newspaper,
          isPremium: false,
        },
        {
          name: "Economic Calendar",
          href: "/calendar",
          icon: Calendar,
          isPremium: false,
        },
        {
          name: "Academy",
          href: "/academy",
          icon: BookOpen,
          isPremium: false,
        },
      ],
    },
    {
      group: "COMMUNITY",
      items: [
        {
          name: "Terminal Chat",
          href: "/dashboard/community",
          icon: MessageSquare,
          isPremium: false,
        },
        {
          name: "Desk Support",
          href: "/dashboard/support",
          icon: Headphones,
          isPremium: false,
        },
      ],
    },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 248 }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative z-40 flex h-screen shrink-0 flex-col overflow-hidden border-r border-white/[0.055] bg-[#07090D] text-slate-200"
    >
      {/* Subtle terminal atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />
      </div>

      {/* BRAND */}
      <div className="relative flex h-[68px] shrink-0 items-center justify-between border-b border-white/[0.055] px-4">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3"
        >
          {/* NOXVEIL mark */}
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-blue-400/20 bg-[#0B1018] shadow-[0_0_24px_rgba(59,130,246,0.08)]">
            <div className="absolute inset-[1px] rounded-[8px] border border-white/[0.035]" />
            <span className="relative font-mono text-[13px] font-semibold tracking-[-0.08em] text-[#DCE8F7]">
              N
            </span>
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                className="min-w-0"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold tracking-[0.18em] text-[#E6EDF7]">
                    NOXVEIL
                  </span>

                  <span className="rounded border border-blue-400/15 bg-blue-400/[0.06] px-1.5 py-0.5 font-mono text-[7px] font-medium tracking-[0.16em] text-blue-300/70">
                    ARC
                  </span>
                </div>

                <div className="mt-0.5 font-mono text-[7px] uppercase tracking-[0.18em] text-slate-600">
                  Intelligence Terminal
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.025] text-slate-500 transition-all hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-slate-200"
        >
          {collapsed ? (
            <ChevronRight size={13} strokeWidth={1.7} />
          ) : (
            <ChevronLeft size={13} strokeWidth={1.7} />
          )}
        </button>
      </div>

      {/* SYSTEM STATUS */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 44 }}
            exit={{ opacity: 0, height: 0 }}
            className="relative overflow-hidden border-b border-white/[0.04]"
          >
            <div className="flex h-11 items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400/30" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
                </span>

                <span className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-500">
                  Intelligence Online
                </span>
              </div>

              <Activity
                size={12}
                strokeWidth={1.5}
                className="text-slate-600"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION */}
      <div className="relative flex-1 overflow-y-auto px-2.5 py-4 scrollbar-none">
        {navigation.map((section) => (
          <div key={section.group} className="mb-6 last:mb-0">
            {!collapsed && (
              <div className="mb-2 flex items-center gap-2 px-2.5">
                <span className="font-mono text-[8px] font-medium tracking-[0.2em] text-slate-600">
                  {section.group}
                </span>

                <div className="h-px flex-1 bg-white/[0.035]" />
              </div>
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isLocked =
                  item.isPremium && userRole === "FREE";

                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    pathname.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={isLocked ? "#" : item.href}
                    aria-disabled={isLocked}
                    onClick={(event) => {
                      if (isLocked) {
                        event.preventDefault();
                      }
                    }}
                    title={collapsed ? item.name : undefined}
                    className={[
                      "group relative flex h-10 items-center rounded-lg",
                      "px-2.5 transition-all duration-150",
                      isActive
                        ? "bg-blue-500/[0.075] text-slate-100"
                        : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-300",
                      isLocked ? "cursor-not-allowed opacity-55" : "",
                    ].join(" ")}
                  >
                    {/* Active rail */}
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-blue-400"
                        transition={{
                          duration: 0.2,
                          ease: "easeOut",
                        }}
                      />
                    )}

                    <div
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                        "transition-all",
                        isActive
                          ? "bg-blue-400/[0.09] text-blue-300"
                          : "text-slate-500 group-hover:text-slate-300",
                      ].join(" ")}
                    >
                      <Icon
                        size={16}
                        strokeWidth={1.6}
                      />
                    </div>

                    <AnimatePresence initial={false}>
                      {!collapsed && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="ml-2.5 flex min-w-0 flex-1 items-center justify-between"
                        >
                          <span className="truncate text-[11px] font-medium tracking-[0.01em]">
                            {item.name}
                          </span>

                          {isLocked && (
                            <Lock
                              size={10}
                              strokeWidth={1.7}
                              className="ml-2 shrink-0 text-slate-700"
                            />
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="relative shrink-0 border-t border-white/[0.055] bg-[#080B10] p-2.5">
        <div
          className={[
            "flex items-center rounded-lg border border-white/[0.045]",
            "bg-white/[0.018] px-2.5 py-2",
            collapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-cyan-400/10 bg-cyan-400/[0.035] font-mono text-[9px] font-semibold text-cyan-300/80">
              TR
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[10px] font-medium text-slate-300">
                  Trader One
                </div>

                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-cyan-400/70" />
                  <span className="font-mono text-[7px] uppercase tracking-[0.15em] text-slate-600">
                    {userRole} ACCESS
                  </span>
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              aria-label="Sign out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-rose-500/[0.06] hover:text-rose-400"
            >
              <LogOut size={13} strokeWidth={1.6} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};