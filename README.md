# Base Template

A production-ready Next.js 15 template with Supabase, Tailwind CSS, and strict architectural standards.

## 🚀 Features

- **Framework**: Next.js 15 App Router
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth + DB)
- **Config**: Centralized config in `src/config/`
- **Ads**: Privacy-aware Google AdSense integration (disabled by default)

## 🛠 Setup

1. **Clone & Install**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Ensure `.env.local` is populated with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Run Local**
   ```bash
   npm run dev
   ```

## 🏗 Architecture

- `src/app`: App Router pages and layouts
- `src/components`: Reusable UI components
- `src/config`: Static configuration (Site, SEO, Ads)
- `src/lib/supabase`: Supabase clients (Server, Client, Middleware)
- `src/middleware.ts`: Auth session handling and security headers
- `src/types`: Global TypeScript definitions
- `src/schemas`: Zod schemas for validation

## 🔒 Security & Privacy

- **Auth**: Managed via `src/middleware.ts` + `@supabase/ssr`
- **Ads**: Disabled by default. Requires consent (cookie-based).
- **Headers**: Strict security headers applied in middleware.

## 📜 License

Private / Proprietary
