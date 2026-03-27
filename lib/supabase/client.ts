import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

// Lazy singleton — only created when first accessed at runtime,
// NOT at module-load / build time. This prevents CI builds from
// crashing when env vars aren't set.
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        const url = SUPABASE_URL
        const key = SUPABASE_SERVICE_ROLE_KEY

        if (!url || !key) {
            throw new Error(
                'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
            )
        }

        _supabase = createClient(url, key)
    }
    return _supabase
}

// Convenience re-export so existing `supabase.from(...)` calls still work
export const supabase = new Proxy({} as SupabaseClient, {
    get(_target, prop) {
        return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
    },
})
