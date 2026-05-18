/**
 * Trailer Scraper Orchestrator
 *
 * Coordinates TMDB discovery + YouTube/Youtube trailer fetching.
 * Seeds data into Supabase videos table.
 * Falls back to seed data when API keys are missing.
 */

import { createClient } from '@supabase/supabase-js'
import { discoverMovies, getMovieTrailers, getTmdbImageUrl, mapGenreToCategory, hasTmdbKey } from './tmdb'
import { searchMovieTrailers, hasYoutubeKey } from './youtube'
import { SEED_TRAILERS } from './seed'

export interface TrailerRecord {
  title: string
  slug: string
  description: string
  release_year: number | null
  genre: string
  studio: string
  duration_secs: number
  trailer_type: string
  source_name: string
  source_url: string
  source_type: string
  thumbnail_url: string
  status: string
  is_featured: boolean
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_PIX_SUPABASE_URL
  const key = process.env.PIX_SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.warn('[scraper] No Supabase credentials configured.')
    return null
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Slugify a movie title
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100)
}

/**
 * Build a YouTube embed URL from a video ID
 */
function youtubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/**
 * Run a full scrape cycle:
 * 1. If no API keys, seed with hardcoded trailers
 * 2. Otherwise, discover movies from TMDB, fetch trailers, upsert to DB
 */
export async function runScrapeCycle(): Promise<{ inserted: number; source: string }> {
  const supabase = getAdminClient()
  if (!supabase) return { inserted: 0, source: 'no-db' }

  // If no TMDB key, use seed data
  if (!hasTmdbKey() && !hasYoutubeKey()) {
    return seedFromHardcoded(supabase)
  }

  return scrapeFromTmdb(supabase)
}

/**
 * Seed from hardcoded trailer data
 */
async function seedFromHardcoded(supabase: ReturnType<typeof getAdminClient>): Promise<{ inserted: number; source: string }> {
  let inserted = 0

  for (const trailer of SEED_TRAILERS) {
    const slug = slugify(trailer.title)

    // Check if already exists
    const { data: existing } = await supabase!
      .from('videos')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) continue

    const { error: insertErr } = await supabase!
      .from('videos')
      .insert({
        title: trailer.title,
        slug,
        description: trailer.description,
        release_year: trailer.release_year,
        genre: trailer.genre,
        studio: trailer.studio,
        duration_secs: trailer.duration_secs,
        trailer_type: trailer.trailer_type,
        source_name: trailer.source_name,
        source_url: trailer.source_url,
        source_type: trailer.source_type || 'youtube',
        thumbnail_url: trailer.thumbnail_url,
        status: 'published',
        is_featured: trailer.is_featured ?? false,
        view_count: 0,
      })

    if (!insertErr) inserted++
  }

  return { inserted, source: 'seed' }
}

/**
 * Scrape from TMDB: discover movies, get trailers, upsert to DB
 */
async function scrapeFromTmdb(supabase: ReturnType<typeof getAdminClient>): Promise<{ inserted: number; source: string }> {
  let inserted = 0

  // Discover popular movies from recent years
  const years = [2026, 2025, 2024, 2023].map(y => ({ year: y, page: 1 }))

  for (const { year, page } of years) {
    try {
      const { results: movies } = await discoverMovies({
        page,
        primaryReleaseYear: year,
        sortBy: 'popularity.desc',
      })

      for (const movie of movies.slice(0, 10)) { // 10 per year to avoid rate limits
        const slug = slugify(movie.title)

        // Check if exists
        const { data: existing } = await supabase!
          .from('videos')
          .select('id')
          .eq('slug', slug)
          .maybeSingle()

        if (existing) continue

        // Get trailers
        const trailers = await getMovieTrailers(movie.id)

        // Pick the best trailer (prefer official trailer over teaser)
        const bestTrailer = trailers.find(t => t.type === 'Trailer' && t.official)
          || trailers.find(t => t.type === 'Trailer')
          || trailers[0]

        if (!bestTrailer) continue // Skip movies without YouTube trailers

        const genre = mapGenreToCategory(movie.genre_ids || [])
        const thumbnail = getTmdbImageUrl(movie.backdrop_path || movie.poster_path)

        const { error: insertErr } = await supabase!
          .from('videos')
          .insert({
            title: movie.title,
            slug,
            description: movie.overview?.slice(0, 500) || '',
            release_year: movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : year,
            genre,
            studio: '',
            duration_secs: 0,
            trailer_type: bestTrailer.type.toLowerCase(),
            source_name: 'TMDB / YouTube',
            source_url: youtubeUrl(bestTrailer.key),
            source_type: 'youtube',
            thumbnail_url: thumbnail,
            status: 'published',
            is_featured: false,
            view_count: 0,
          })

        if (!insertErr) inserted++
      }
    } catch (err) {
      console.error(`[scraper] Error scraping year ${year}:`, err)
    }
  }

  return { inserted, source: 'tmdb' }
}
