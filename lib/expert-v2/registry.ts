import "server-only";
import type { NextRequest } from "next/server";
import { GET as market } from "@/app/api/market/xauusd/route";
import { GET as materials } from "@/app/api/materials/route";
import type { Resource } from "./types";
// Only existing providers are invoked; absent feeds return OFFLINE.
export const handlers: Partial<Record<Resource, (request: NextRequest) => Response | Promise<Response>>> = { market, materials };
