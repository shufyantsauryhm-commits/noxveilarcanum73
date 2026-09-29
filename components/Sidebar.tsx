"use client";

import Link from "next/link";

const menu = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Academy",
    href: "/academy",
  },
  {
    title: "Market",
    href: "/market",
  },
  {
    title: "AI Analysis",
    href: "/expert",
  },
  {
    title: "Video",
    href: "/academy",
  },
  {
    title: "PDF",
    href: "/pdf",
  },
  {
    title: "Trading Journal",
    href: "/journal",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-black border-r border-zinc-800">

      <div className="p-8">

        <h1 className="text-3xl font-bold tracking-[8px]">
          NOXVEIL
        </h1>

        <p className="text-amber-500 tracking-[6px] text-sm mt-2">
          ARCANUM
        </p>

      </div>

      <nav className="px-5 space-y-2">

        {menu.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="block rounded-xl p-4 hover:bg-zinc-900 transition"
          >
            {item.title}
          </Link>
        ))}

      </nav>

    </aside>
  );
}