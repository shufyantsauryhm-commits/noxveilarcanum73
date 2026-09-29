import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NOXVEIL ARCANUM",
    template: "%s • NOXVEIL",
  },
  description:
    "Institutional Trading Platform powered by AI, Smart Money Concepts, and Market Intelligence.",
  applicationName: "NOXVEIL ARCANUM",
  keywords: [
    "NOXVEIL",
    "Trading",
    "XAUUSD",
    "Forex",
    "Smart Money",
    "Institutional",
    "AI",
  ],
  themeColor: "#05070A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`
        ${inter.variable}
        ${spaceGrotesk.variable}
        ${jetbrains.variable}
        dark
      `}
    >
      <body
        className="
          bg-[#05070A]
          text-white
          min-h-screen
          overflow-x-hidden
          antialiased
          selection:bg-blue-600
          selection:text-white
        "
      >
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[#05070A]" />

          <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[180px]" />

          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/5 blur-[180px]" />
        </div>

        {children}
      </body>
    </html>
  );
}