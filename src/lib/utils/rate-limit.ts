import "server-only";
import { createHash } from "node:crypto";
import { getServiceSupabase } from "@/lib/supabase/admin";

/** Extracts the client IP from proxy headers (first hop of X-Forwarded-For). */
export function clientIpFrom(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** Salted SHA-256 so raw IP addresses are never stored. */
export function hashIdentifier(value: string) {
  const salt = process.env.RATE_LIMIT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "local-dev-salt";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 40);
}

// Per-instance fallback used only when the database limiter is unavailable.
const memory = new Map<string, { start: number; hits: number }>();

function memoryLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  const entry = memory.get(key);
  if (!entry || now - entry.start > windowSeconds * 1000) {
    memory.set(key, { start: now, hits: 1 });
    if (memory.size > 5000) memory.clear();
    return true;
  }
  entry.hits += 1;
  return entry.hits <= limit;
}

/**
 * Fixed-window rate limit shared across server instances (Postgres function,
 * callable only with the service role). Fails closed if the database errors.
 */
export async function rateLimit(opts: { scope: string; identifier: string; limit: number; windowSeconds: number }) {
  const key = `${opts.scope}:${hashIdentifier(opts.identifier)}`;
  const supabase = getServiceSupabase();
  if (!supabase) return memoryLimit(key, opts.limit, opts.windowSeconds);

  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_key: key,
    p_limit: opts.limit,
    p_window_seconds: opts.windowSeconds,
  });
  if (error) {
    console.error("[rate-limit] database limiter failed", error.message);
    return false;
  }
  return data === true;
}
