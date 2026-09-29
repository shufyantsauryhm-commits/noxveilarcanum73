"use client";

import { useEffect, useState } from "react";

interface MarketData {
  pair: string;
  price: number;
  bias: string;
  structure: string;
  confidence: number;
  position: string;
  updated: string;
}

export default function MarketCard() {
  const [data, setData] = useState<MarketData | null>(null);

  useEffect(() => {
    // Ambil data awal
    fetch("/api/market-analysis", {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((json) => setData(json));

    // Live Price
    const eventSource = new EventSource("/api/live-price");

    eventSource.onmessage = (event) => {
      const live = JSON.parse(event.data);

      setData((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          price: live.price,
          updated: live.updated,
        };
      });
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  if (!data) {
    return (
      <div className="rounded-2xl border border-orange-500/30 bg-zinc-950 p-5">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-zinc-950 p-5">

      <h2 className="text-xl font-bold text-orange-400">
        NOXVEIL AI
      </h2>

      <div className="mt-5 space-y-3">

        <div className="flex justify-between">
          <span className="text-gray-400">PAIR</span>
          <span>{data.pair}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">PRICE</span>

          <span className="font-bold text-yellow-400">
            {data.price}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">BIAS</span>

          <span
            className={
              data.bias === "BUY"
                ? "text-green-400"
                : data.bias === "SELL"
                ? "text-red-400"
                : "text-yellow-400"
            }
          >
            {data.bias}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">STRUCTURE</span>
          <span>{data.structure}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">CONFIDENCE</span>
          <span>{data.confidence}%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">UPDATED</span>
          <span>{data.updated}</span>
        </div>

      </div>
    </div>
  );
}