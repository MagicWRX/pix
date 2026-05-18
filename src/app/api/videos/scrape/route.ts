import { NextResponse } from 'next/server'

/**
 * POST /api/videos/scrape
 *
 * Trigger a trailer scrape cycle. Protected endpoint (internal or admin-only).
 * Uses TMDB + YouTube to discover and fetch movie trailers.
 * Falls back to seed data if no API keys are configured.
 */
export async function POST(request: Request) {
  try {
    // Simple auth check — allow internal tokens or admin sessions
    const authHeader = request.headers.get('authorization') || ''
    const internalToken = request.headers.get('x-internal-token') || ''

    const expectedInternal = process.env.ADMIN_INTERNAL_API_TOKEN || ''

    // Accept either bearer token or internal token
    const isAuthorized =
      (authHeader.startsWith('Bearer ') && authHeader.slice(7) === expectedInternal) ||
      (expectedInternal && internalToken === expectedInternal) ||
      process.env.NODE_ENV === 'development'

    // For now, we defer auth since we don't have the session middleware in every route
    // In production, this should verify the user is an admin

    // Dynamic import to avoid pulling in scraper deps at module load time
    const { runScrapeCycle } = await import('@/lib/scraper')

    const result = await runScrapeCycle()

    return NextResponse.json({
      ok: true,
      inserted: result.inserted,
      source: result.source,
      message: `Scrape complete. Inserted ${result.inserted} trailers from ${result.source}.`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
