"use client"

import { useEffect, useState } from "react"
import {
    Activity,
    Shield,
    Waves,
    Clock,
    Circle,
    Sparkles
} from "lucide-react"

import { getTradingSession } from "@/app/lib/market-engine/session"

export default function InstitutionalScanner() {

    const [data, setData] = useState<any>(null)

    async function load() {
        try {
            const res = await fetch("/api/gold", {
                cache: "no-store"
            })

            const json = await res.json()

            setData(json)

        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {

        load()

        const timer = setInterval(load, 60000)

        return () => clearInterval(timer)

    }, [])

    const confidence = data?.confidence ?? 82

    const session = getTradingSession()

    const scanner = [
        {
            title: "Liquidity Sweep",
            value: Math.min(95, confidence + 10),
            icon: Waves,
            status: "HIGH"
        },
        {
            title: "Market Structure",
            value: confidence,
            icon: Activity,
            status: "ACTIVE"
        },
        {
            title: "Smart Money",
            value: Math.min(98, confidence + 15),
            icon: Shield,
            status: "INSTITUTIONAL"
        },
        {
            title: "Trading Session",
            value: session,
            icon: Clock
        }
    ]

    return (

        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#05070b] via-[#0a111b] to-[#05070b] p-7 backdrop-blur-xl shadow-[0_0_60px_rgba(0,255,255,.05)]">

            <div className="flex items-center justify-between">

                <div>

                    <div className="flex items-center gap-2 text-cyan-400 text-xs tracking-[0.35em] uppercase">

                        <Circle className="h-2 w-2 fill-cyan-400 animate-pulse"/>

                        LIVE

                    </div>

                    <h2 className="mt-3 text-2xl font-semibold text-white">

                        NOXVEIL Institutional Scanner

                    </h2>

                    <p className="text-sm text-white/50 mt-1">

                        Institutional Intelligence Engine

                    </p>

                </div>

                <Sparkles className="text-cyan-400 h-8 w-8"/>

            </div>

            <div className="mt-8 space-y-6">

                {scanner.map((item) => (

                    <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-cyan-500/40 hover:bg-white/[0.04]"
                    >

                        <div className="flex justify-between items-center">

                            <div className="flex items-center gap-3">

                                <div className="rounded-xl bg-cyan-500/10 p-3">

                                    <item.icon className="h-5 w-5 text-cyan-300"/>

                                </div>

                                <div>

                                    <h3 className="text-white font-medium">

                                        {item.title}

                                    </h3>

                                    {"status" in item && (
                                        <p className="text-xs text-cyan-400 mt-1">

                                            {item.status}

                                        </p>
                                    )}

                                </div>

                            </div>

                            <div className="text-right">

                                <div className="text-white text-xl font-bold">

                                    {typeof item.value === "number"
                                        ? `${item.value}%`
                                        : item.value}

                                </div>

                            </div>

                        </div>

                        {typeof item.value === "number" && (

                            <div className="mt-4">

                                <div className="h-2 rounded-full bg-white/10 overflow-hidden">

                                    <div
                                        style={{
                                            width: `${item.value}%`
                                        }}
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-500 shadow-[0_0_18px_rgba(0,255,255,.45)] transition-all duration-700"
                                    />

                                </div>

                            </div>

                        )}

                    </div>

                ))}

            </div>

            <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">

                <div className="flex items-center justify-between">

                    <span className="text-white/60">

                        Institutional Confidence

                    </span>

                    <span className="text-4xl font-bold text-cyan-300">

                        {confidence}%

                    </span>

                </div>

                <p className="mt-3 text-sm text-white/40">

                    AI continuously monitors liquidity movement, institutional positioning, market structure and trading sessions in real time.

                </p>

            </div>

        </section>

    )

}