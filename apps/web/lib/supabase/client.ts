import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } from "@/lib/env";

const IS_BROWSER = typeof window !== "undefined";

// Server-side client (uses service role key - full admin access)
let _supabaseServer: SupabaseClient | null = null;

// Browser-side client (uses anon key - respects RLS policies)
let _supabaseBrowser: SupabaseClient | null = null;

// Server-side Supabase client with service role key
export function getSupabase(): SupabaseClient {
  if (!_supabaseServer) {
    const url = SUPABASE_URL;
    const key = SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars",
      );
    }

    _supabaseServer = createClient(url, key);
  }
  return _supabaseServer;
}

// Browser-safe Supabase client with anon key (respects RLS)
export function getSupabaseBrowser(): SupabaseClient {
  if (!_supabaseBrowser) {
    const url = SUPABASE_URL;
    const key = SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.warn("[Supabase] Missing browser credentials, returning dummy client");
      // Return a dummy client that won't crash
      return createClient("https://placeholder.supabase.co", "placeholder-key");
    }

    _supabaseBrowser = createClient(url, key);
  }
  return _supabaseBrowser;
}

// Convenience re-export for server-side usage (existing code)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    // On browser, use browser client; on server, use server client
    const client = IS_BROWSER ? getSupabaseBrowser() : getSupabase();
    return (client as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// Named export for explicit browser usage
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseBrowser() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
