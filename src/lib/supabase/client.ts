import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_PIX_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_PIX_SUPABASE_ANON_KEY!
  )
