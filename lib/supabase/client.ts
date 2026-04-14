import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client (uses anon key + RLS)
// Typed once `supabase gen types typescript` is run and types.ts is updated
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
