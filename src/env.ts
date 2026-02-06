import { z } from "zod"

// Centralized environment validation for runtime safety
// This ensures required env vars are present and correctly typed at startup

export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key required"),
  NEXT_PUBLIC_GOOGLE_ADSENSE_ID: z.string().optional(),
  NEXT_PUBLIC_AD_MODE: z.string().optional(),
})

export const env = envSchema.parse(process.env)

// Type-safe access to validated environment variables
export type Env = z.infer<typeof envSchema>