"use client";

import { useEffect, useState } from "react";
import NoxveilCore from "./components/core/NoxveilCore";
import { motion, AnimatePresence } from "framer-motion";
import FreeDashboard from "./components/home/FreeDashboard";
import Link from "next/link";
import {
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  Settings,
  LayoutDashboard,
  Crown,
  Compass,
  Activity,
  Cpu,
  Radio,
} from "lucide-react";

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close profile on outside click
  useEffect(() => {
    if (!isProfileOpen) return;
    const onDown = () => setIsProfileOpen(false);
    const t = setTimeout(() => {
      document.addEventListener("click", onDown);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onDown);
    };
  }, [isProfileOpen]);

  // Lock body when mobile menu open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const stagger = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.15 },
    },
  };

  const menuItems = [
    { href: "/", label: "Beranda", icon: Compass },
    { href: "#dashboard", label: "Terminal", icon: Activity },
    { href: "#intelligence", label: "Intelligence", icon: Cpu },
    { href: "#pricing", label: "Access", icon: Radio },
  ];

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      x: "100%",
      transition: { type: "spring" as const, stiffness: 400, damping: 40 },
    },
    open: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 40,
        staggerChildren: 0.08,
      },
    },
  };

  const mobileItemVariants = {
    closed: { opacity: 0, x: 20 },
    open: { opacity: 1, x: 0 },
  };

  const features = [
    { title: "Trading Mindset", desc: "Psikologi & disiplin trading profesional." },
    { title: "Market Structure", desc: "Pahami aliran harga & strukturnya." },
    { title: "Risk Management", desc: "Kelola risiko dengan sistem yang terbukti." },
  ];

  const marketItems = [
    { title: "XAUUSD Mapping", desc: "Analisis harian & struktur gold." },
    { title: "Daily Analysis", desc: "Rekomendasi harian dari tim ahli." },
    { title: "Institutional Concept", desc: "Pendekatan trading institusional." },
  ];

  const expertFeatures = [
    "Akses penuh Expert Room",
    "Trading Mindset Foundation",
    "Risk Management Framework",
    "Candlestick Analysis",
    "Market Structure Mastery",
    "Support & Resistance",
    "Supply & Demand (SND)",
    "Scalping Strategy XAUUSD",
    "Grid Numerical Entry Method",
    "Precision Entry System",
    "Video Academy",
    "Premium PDF Library",
    "Private Community",
    "Lifetime Update",
  ];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <main className="min-h-screen w-full max-w-none overflow-x-hidden bg-[#020711] text-white font-sans antialiased selection:bg-blue-500/30">
      {/* ====== PREMIUM NAVBAR - DEEP BLUE THEME ====== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="mx-auto w-full max-w-[1720px] px-3 sm:px-5 xl:px-8">
          <div
            className={`relative rounded-2xl transition-all duration-500 ${
              scrolled
                ? "bg-[#030914]/92 backdrop-blur-2xl border border-blue-400/[0.16] shadow-[0_28px_90px_-34px_rgba(0,0,0,0.95),0_14px_50px_-32px_rgba(37,99,235,0.45),inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "bg-[#04101f]/78 backdrop-blur-xl border border-blue-400/[0.12] shadow-[0_24px_80px_-42px_rgba(0,0,0,0.92),0_10px_42px_-34px_rgba(37,99,235,0.38),inset_0_1px_0_rgba(255,255,255,0.04)]"
            }`}
          >
            {/* Ambient Glow - Deep Blue */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
              <div className="absolute -top-44 -right-28 h-96 w-96 rounded-full bg-blue-500/[0.09] blur-[110px]" />
              <div className="absolute -bottom-48 -left-24 h-96 w-96 rounded-full bg-cyan-500/[0.055] blur-[120px]" />
              <div className="absolute inset-x-[14%] top-0 h-px bg-gradient-to-r from-transparent via-blue-200/25 to-transparent" />
            </div>

            {/* Animated Border - Blue */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl p-[1px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-pulse" />
            </div>

            <div className="relative flex items-center justify-between px-4 py-3">
              {/* Logo - Premium Monogram N - Blue Theme */}
              <Link
                href="/"
                className="relative z-20 flex items-center gap-3 group"
                onClick={closeMobileMenu}
              >
                <motion.div
                  className="relative flex h-10 w-10 items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="absolute inset-0 rounded-full bg-blue-400/10 blur-xl group-hover:bg-blue-400/20 transition-all duration-500" />
                  <div className="relative h-full w-full rounded-full bg-gradient-to-br from-[#1a1a2a] to-[#0a0a1a] border border-blue-400/30 shadow-[0_0_30px_rgba(59,130,246,0.08)] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] transition-all duration-500 overflow-hidden flex items-center justify-center">
                    <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
                      <path
                        d="M8 32V8L22 24V8M32 32V8L18 24V32"
                        stroke="url(#nGradientNavBlue)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <defs>
                        <linearGradient id="nGradientNavBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-tr from-white/0 via-blue-400/10 to-white/0"
                      animate={{
                        x: ["-100%", "100%"],
                        opacity: [0, 0.5, 0],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut",
                        repeatDelay: 2,
                      }}
                    />
                  </div>
                </motion.div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-black tracking-[8px] text-white">NOXVEIL</h1>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] tracking-[6px] text-blue-400/80 font-light">
                      ARCANUM
                    </span>
                    <span className="w-1 h-1 rounded-full bg-blue-400/40" />
                    <span className="text-[7px] tracking-[3px] text-zinc-500 font-light">
                      INSTITUTIONAL
                    </span>
                  </div>
                </div>
              </Link>

              {/* Desktop Menu - Blue Theme */}
              <div className="hidden lg:flex items-center gap-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href} className="group relative px-4 py-2">
                      <span className="relative text-sm font-medium tracking-[0.15em] text-zinc-400 transition-colors duration-300 group-hover:text-blue-400 flex items-center gap-2">
                        <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        {item.label}
                      </span>
                      <motion.div
                        className="absolute -bottom-0.5 left-1/2 h-[2px] bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                        initial={{ width: 0, x: "-50%" }}
                        whileHover={{
                          width: "70%",
                          x: "-50%",
                          transition: { duration: 0.3, ease: "easeOut" },
                        }}
                      />
                    </Link>
                  );
                })}
              </div>

              {/* Right Side - Desktop - Blue Theme */}
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  href="/login"
                  className="group relative px-5 py-2 text-sm font-medium uppercase tracking-[0.15em] text-zinc-400 transition-all duration-300 hover:text-blue-400"
                >
                  <span className="relative z-10">Login</span>
                  <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-blue-400/40 transition-colors duration-300" />
                </Link>

                <Link href="/pricing">
                  <motion.div
                    className="relative group"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 px-6 py-2 text-sm font-bold uppercase tracking-[0.15em] text-black shadow-[0_0_30px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] transition-shadow duration-500 overflow-hidden">
                      <span className="relative z-10 flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5" />
                        Join Expert
                      </span>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "easeInOut",
                          repeatDelay: 2,
                        }}
                      />
                    </div>
                  </motion.div>
                </Link>

                {/* Profile Dropdown - Blue Theme */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <motion.button
                    type="button"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 rounded-full border border-white/10 p-1.5 pl-3 pr-2 text-sm text-zinc-400 transition-all duration-300 hover:border-blue-400/30 hover:bg-white/5"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="relative h-7 w-7 rounded-full bg-gradient-to-br from-blue-400/20 to-cyan-400/20 border border-blue-400/30 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-blue-400" />
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black/80" />
                    </div>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform duration-300 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </motion.button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0a0a1a]/98 backdrop-blur-2xl p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-transparent to-transparent pointer-events-none" />
                        <div className="relative">
                          <div className="px-3 py-3 border-b border-white/5">
                            <p className="text-sm font-medium text-white">Shufyan Tsauy</p>
                            <p className="text-[10px] text-zinc-500 tracking-wider">
                              Premium Member
                            </p>
                          </div>
                          <div className="py-1">
                            <Link
                              href="/#dashboard"
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all duration-200 hover:bg-white/5 hover:text-blue-400 group"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <LayoutDashboard className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                              Dashboard
                            </Link>
                            <Link
                              href="/settings"
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-300 transition-all duration-200 hover:bg-white/5 hover:text-blue-400 group"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Settings className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                              Settings
                            </Link>
                          </div>
                          <div className="border-t border-white/5 py-1">
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400/70 transition-all duration-200 hover:bg-white/5 hover:text-red-400 group"
                            >
                              <LogOut className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                              Logout
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Mobile Hamburger */}
              <motion.button
                type="button"
                onClick={toggleMobileMenu}
                className="relative z-20 lg:hidden rounded-full p-2 text-zinc-400 transition-all duration-300 hover:bg-white/5 hover:text-blue-400"
                aria-label="Toggle menu"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      {/* ====== MOBILE DRAWER ====== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileMenuVariants}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={closeMobileMenu}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-gradient-to-b from-[#0a0a1a] to-[#0d0d2a] backdrop-blur-2xl border-l border-white/10 p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-y-auto"
              variants={mobileMenuVariants}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative mt-8 flex flex-col gap-6">
                <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                  <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
                      <path
                        d="M8 32V8L22 24V8M32 32V8L18 24V32"
                        stroke="black"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold tracking-widest text-white">NOXVEIL</p>
                    <p className="text-[8px] tracking-[4px] text-blue-400/80">ARCANUM</p>
                  </div>
                </div>

                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div key={item.href} variants={mobileItemVariants} className="group">
                      <Link
                        href={item.href}
                        className="flex items-center justify-between py-3 text-lg font-medium tracking-widest text-white/80 transition-all duration-300 hover:text-blue-400 hover:translate-x-1"
                        onClick={closeMobileMenu}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                          {item.label}
                        </span>
                        <span className="text-blue-400/30 group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </Link>
                      <div className="h-px bg-gradient-to-r from-white/5 to-transparent" />
                    </motion.div>
                  );
                })}

                <motion.div variants={mobileItemVariants} className="mt-4 space-y-4">
                  <Link
                    href="/pricing"
                    className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-black shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02]"
                    onClick={closeMobileMenu}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Join Expert
                  </Link>
                  <Link
                    href="/login"
                    className="flex w-full items-center justify-center rounded-full border border-white/10 px-8 py-3 text-sm font-medium uppercase tracking-[0.15em] text-zinc-400 transition-all duration-300 hover:border-blue-400/30 hover:text-blue-400 hover:bg-white/5"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                </motion.div>

                <motion.div
                  variants={mobileItemVariants}
                  className="mt-auto pt-6 border-t border-white/5"
                >
                  <p className="text-[9px] tracking-[0.15em] text-zinc-600 text-center">
                    © 2026 NOXVEIL ARCANUM
                  </p>
                  <p className="text-[8px] tracking-[0.1em] text-zinc-700 text-center mt-1">
                    INSTITUTIONAL TRADING PLATFORM
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== HERO ====== */}
      <section className="relative min-h-[100vh] flex items-center justify-center px-6 overflow-hidden bg-[#020711] pt-24">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_38%,rgba(37,99,235,0.16),transparent_46%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_82%_42%,rgba(14,165,233,0.10),transparent_44%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_86%,rgba(30,64,175,0.09),transparent_52%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-[#020711] to-transparent" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03]" />
        </div>

        <motion.div
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/5 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-1/5 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, 20, -10, 0], y: [0, 30, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl"
        />

        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-30 transition-opacity duration-300"
          style={{
            background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(59,130,246,0.06), transparent 70%)`,
          }}
        />

        <div className="relative z-10 w-full max-w-7xl text-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp}>
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
                </span>
                <span className="text-blue-400 text-xs font-mono tracking-[0.2em] uppercase">
                  Pusat Analisis Premium
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-8 text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight leading-[0.95]"
            >
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                NOXVEIL
              </span>
              <br />
              <span className="text-white/80">ARCANUM</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-lg md:text-2xl font-medium tracking-wider text-zinc-200"
            >
              <span className="text-blue-400">
                PEMANTAUAN MARKET TINGKAT LANJUT SECARA LANGSUNG
              </span>
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="mt-4 max-w-2xl mx-auto text-zinc-400 text-sm md:text-base leading-relaxed"
            >
              Pantau data market seketika, sinyal berbasis AI, dan analitik profesional — tersedia
              bebas untuk anda manfaatkan tanpa proses login.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-4">
              <motion.a
                href="#dashboard"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-black font-bold text-sm transition-all duration-300 hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <span>LIVE DASHBOARD</span>
                  <span className="text-xs opacity-70 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </motion.a>
              <Link
                href="/pricing"
                className="px-8 py-4 rounded-xl border border-white/15 bg-white/5 backdrop-blur-sm text-white font-bold text-sm transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:shadow-lg hover:shadow-blue-500/5"
              >
                JOIN EXPERT ROOM
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-16 flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                Scroll to explore
              </span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-5 h-8 rounded-full border border-white/15 flex justify-center pt-2"
              >
                <span className="w-0.5 h-2 rounded-full bg-blue-400/60" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        <motion.a
          href="https://t.me/market_discuss_bot"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1 }}
          className="fixed bottom-6 right-6 z-[99999] group"
        >
          <div className="flex items-center gap-3 rounded-full bg-[#1a8bc0] px-4 py-2.5 shadow-[0_0_30px_rgba(26,139,192,0.4)] transition-all duration-300 group-hover:shadow-[0_0_60px_rgba(26,139,192,0.6)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl">
              💬
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] text-blue-100">Need Help?</p>
              <p className="font-bold text-white text-sm">Telegram Support</p>
            </div>
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 animate-ping rounded-full bg-green-400" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-green-400" />
        </motion.a>
      </section>

      {/* ====== LIVE MARKET DASHBOARD — FULL BLEED ====== */}
      <section
        id="dashboard"
        className="relative w-full max-w-none overflow-hidden border-y border-blue-400/[0.07] bg-[#020711] py-8 md:py-10"
      >
        {/* Dashboard atmosphere: quiet depth, grid, scanline — no giant decorative orb. */}
        <style>{`
          @keyframes nxDashboardScan {
            0% { transform: translateY(-12px); opacity: 0; }
            12% { opacity: .22; }
            88% { opacity: .12; }
            100% { transform: translateY(360px); opacity: 0; }
          }
          .nx-dashboard-scan { animation: nxDashboardScan 10s linear infinite; }
          @media (prefers-reduced-motion: reduce) {
            .nx-dashboard-scan { animation: none !important; }
          }
        `}</style>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_-15%,rgba(37,99,235,0.12),transparent_40%),radial-gradient(ellipse_at_86%_0%,rgba(56,132,255,0.065),transparent_34%)]" />
          <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(96,165,250,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.08)_1px,transparent_1px)] [background-size:64px_64px]" />
          <div className="nx-dashboard-scan absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/25 to-transparent" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020711]/8 to-[#020711]/55" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[1760px] px-5 sm:px-8 xl:px-10 2xl:px-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            viewport={{ once: true }}
            className="mb-5 text-center md:mb-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/[0.16] bg-blue-500/[0.05] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-blue-300 backdrop-blur-xl">
              NOXVEIL LIVE
            </div>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] md:text-5xl">
              <span className="bg-gradient-to-r from-blue-200 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                FREE MARKET DASHBOARD
              </span>
            </h2>
            <p className="mx-auto mt-2 max-w-3xl text-xs text-zinc-400 md:text-sm">
              Real-time institutional market intelligence that everyone can access without login.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 m-0 w-full max-w-none p-0">
          <FreeDashboard />
        </div>
      </section>

      {/* ====== BASIC TRADING ACADEMY ====== */}
      <section id="academy" className="relative overflow-hidden border-t border-white/[0.04] bg-[#030914] py-20 md:py-28">
        <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 xl:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-mono tracking-[0.2em] uppercase">
              NOXVEIL ACADEMY
            </div>
            <h2 className="mt-5 text-4xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent">
                BASIC TRADING ACADEMY
              </span>
            </h2>
            <p className="mt-4 text-zinc-400 max-w-3xl mx-auto text-sm md:text-base">
              Build a strong foundation with structured modules designed for every trader.
            </p>
          </motion.div>

          <div className="grid gap-5 md:gap-6 grid-cols-1 md:grid-cols-3">
            {features.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(59,130,246,0.06)]"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <span className="text-blue-400 font-bold text-sm">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== MARKET INTELLIGENCE ====== */}
      <section id="intelligence" className="relative overflow-hidden border-t border-white/[0.04] bg-[#06111f] py-20 md:py-28">
        <div className="mx-auto w-full max-w-[1680px] px-5 sm:px-8 xl:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-mono tracking-[0.2em] uppercase">
              INTELLIGENCE
            </div>
            <h2 className="mt-5 text-4xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent">
                Market Intelligence
              </span>
            </h2>
            <p className="mt-4 text-zinc-400 text-sm md:text-base">
              Professional market insights for all members.
            </p>
          </motion.div>

          <div className="grid gap-5 md:gap-6 grid-cols-1 md:grid-cols-3">
            {marketItems.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-8 backdrop-blur-sm transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_40px_rgba(59,130,246,0.06)]"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <span className="text-2xl">{["📊", "📈", "🏛️"][idx]}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ====== NOXVEIL CORE ENGINE ====== */}
          <div className="mt-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-mono tracking-[0.2em] uppercase">
                CORE ENGINE
              </div>
              <h3 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent">
                  NOXVEIL CORE
                </span>
              </h3>
              <p className="mt-3 text-zinc-400 text-sm">Institutional Trading Intelligence System</p>
            </motion.div>
            <div className="relative overflow-hidden rounded-[28px] border border-blue-400/[0.08] bg-[#030914] shadow-[0_35px_100px_-50px_rgba(0,0,0,0.95),0_18px_70px_-55px_rgba(37,99,235,0.55),inset_0_1px_0_rgba(255,255,255,0.035)]">
              <NoxveilCore />
            </div>
          </div>
        </div>
      </section>

      {/* ====== EXPERT MEMBERSHIP ====== */}
      <section id="pricing" className="py-20 md:py-28 px-6 bg-[#050d1a]">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-mono tracking-[0.2em] uppercase">
              PREMIUM ACCESS
            </div>
            <h2 className="mt-5 text-4xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient">
                EXPERT MEMBERSHIP
              </span>
            </h2>
            <p className="mt-4 text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
              Buka akses eksklusif ke NOXVEIL Expert Room dan tingkatkan keahlian Anda melalui
              edukasi trading berstandar profesional.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.015, boxShadow: "0 0 100px rgba(59,130,246,0.15)" }}
            className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-[#0f1a3a]/90 via-[#0a1230]/90 to-[#0f1a3a]/90 backdrop-blur-xl p-8 md:p-12 shadow-2xl shadow-blue-500/5"
          >
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 animate-pulse" />
              <div className="absolute -top-1/2 -left-1/2 h-full w-full bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl" />
              <div className="absolute -bottom-1/2 -right-1/2 h-full w-full bg-gradient-to-tl from-cyan-500/10 to-transparent blur-3xl" />
            </div>

            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 blur-xl opacity-60 animate-pulse" />
                <div className="relative bg-gradient-to-r from-blue-400 to-cyan-400 text-[#07111f] px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-blue-500/20">
                  ⚡ PREMIUM
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <h3 className="text-3xl md:text-4xl font-bold tracking-wider bg-gradient-to-b from-gray-100 via-gray-300 to-gray-500 bg-clip-text text-transparent drop-shadow-md">
                NOXVEIL EXPERT
              </h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-5xl md:text-6xl font-black text-white">✦</span>
                <span className="text-zinc-400 text-sm font-medium">Akses Penuh</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-zinc-500 tracking-wider">LIFETIME ACCESS</span>
              </div>

              <div className="mt-8 w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                {expertFeatures.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 group/item"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold group-hover/item:scale-110 transition-transform">
                      ✓
                    </span>
                    <span className="text-sm text-zinc-300 group-hover/item:text-white transition-colors">
                      {feature}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center gap-3 w-full">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span>Aktif untuk semua member terverifikasi</span>
                </div>
                <p className="text-center text-xs text-zinc-500 max-w-md">
                  Hubungi admin untuk aktivasi atau login jika Anda sudah memiliki akses.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== CTA ====== */}
      <section className="py-20 md:py-28 px-6 bg-[#0a1628] text-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.05),transparent_60%)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs font-mono tracking-[0.2em] uppercase">
              GET STARTED
            </div>
            <h2 className="mt-5 text-4xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-blue-300 to-cyan-400 bg-clip-text text-transparent">
                Tingkatkan Standar Trading Anda
              </span>
            </h2>
            <p className="mt-4 text-zinc-400 text-sm md:text-base max-w-2xl mx-auto">
              Bergabunglah bersama komunitas NOXVEIL dan temukan strategi tingkat tinggi untuk
              menaklukkan market.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-8 inline-block"
            >
              <Link
                href="/pricing"
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400 px-10 py-4 font-bold text-[#07111f] transition-all duration-300 hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] text-sm md:text-base"
              >
                <span>AKSES BELAJAR EXPERT</span>
                <span className="text-lg">→</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="py-10 bg-[#050d1a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-white font-black tracking-widest text-lg">NOXVEIL</span>
            <span className="text-white/20">|</span>
            <span className="text-white/30 text-xs tracking-wider">ARCANUM</span>
          </div>
          <div className="flex gap-8 text-white/30 text-xs">
            <Link href="/privacy" className="hover:text-white/60 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white/60 transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">
              Contact
            </Link>
          </div>
          <div className="text-white/30 text-xs">
            &copy; {new Date().getFullYear()} NOXVEIL. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}