// Export Zod schemas here
import { z } from 'zod'

// Example: Env Schema (now in src/env.ts)
// export const envSchema = z.object({
//   NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
//   NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
// })

// Add more schemas as needed for forms, API responses, etc.
export const exampleFormSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
})