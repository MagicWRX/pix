import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Next.js Middleware - Orchestration Layer
 *
 * Responsibility: High-level request orchestration, security headers, and auth session management.
 * Delegates Supabase-specific auth helpers to @/lib/supabase/middleware.
 *
 * Do not add business logic here - keep it focused on request/response handling.
 */

export async function middleware(request: NextRequest) {
  // 1. Initialize Supabase Auth session (handles cookie refreshing)
  const response = await updateSession(request);

  // 2. Security Headers
  const headers = response.headers;
  
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy (Basic)
  // Allows scripts/styles from self and common CDNs (adjust as needed)
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://*.firebaseio.com;
  `.replace(/\s{2,}/g, ' ').trim();
  
  headers.set('Content-Security-Policy', csp);

  // 3. Geo / Consent Logic (Placeholder)
  // TODO: Add geo-blocking logic here if needed
  // TODO: Add consent cookie check here (see src/config/ads.ts)

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
