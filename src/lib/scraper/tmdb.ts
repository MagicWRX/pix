/**
 * TMDB Client — Movie metadata + trailer links
 *
 * Uses TMDB API v3. Requires NEXT_PUBLIC_TMDB_API_KEY env var.
 * Falls back gracefully with console warnings when no key is set.
 *
 * Rate limit: 50 requests per second (free tier). We batch.
 */

const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p'

export interface TmdbMovieResult {
  id: number
  title: string
  release_date: string
  genre_ids: number[]
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  vote_average: number
}

export interface TmdbTrailerResult {
  key: string        // YouTube video ID
  name: string       // Trailer name
  type: string       // Teaser, Trailer, Clip, Behind the Scenes
  official: boolean
  site: string       // YouTube
}

const GENRE_MAP: Record<number, string> = {
  28: 'action', 12: 'adventure', 16: 'animation', 35: 'comedy',
  80: 'crime', 99: 'documentary', 18: 'drama', 10751: 'family',
  14: 'fantasy', 36: 'history', 27: 'horror', 10402: 'music',
  9648: 'mystery', 10749: 'romance', 878: 'sci-fi', 10770: 'tv',
  53: 'thriller', 10752: 'war', 37: 'western', 10759: 'action',
}

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY || ''
}

function getHeaders() {
  return { accept: 'application/json' }
}

export function hasTmdbKey(): boolean {
  return !!getApiKey()
}

/**
 * Discover popular/upcoming movies (for populating the trailer feed)
 */
export async function discoverMovies(params: {
  page?: number
  sortBy?: string
  primaryReleaseYear?: number
  withGenres?: string
}): Promise<{ results: TmdbMovieResult[] }> {
  const key = getApiKey()
  if (!key) {
    console.warn('[tmdb] No TMDB_API_KEY set. Skipping discover.')
    return { results: [] }
  }

  const qs = new URLSearchParams({
    api_key: key,
    page: String(params.page ?? 1),
    sort_by: params.sortBy ?? 'popularity.desc',
    ...(params.primaryReleaseYear ? { primary_release_year: String(params.primaryReleaseYear) } : {}),
    ...(params.withGenres ? { with_genres: params.withGenres } : {}),
  })

  const res = await fetch(`${TMDB_BASE}/discover/movie?${qs}`, { headers: getHeaders() })
  if (!res.ok) {
    console.error(`[tmdb] discoverMovies failed: ${res.status}`)
    return { results: [] }
  }
  return res.json()
}

/**
 * Get trailers for a specific movie
 */
export async function getMovieTrailers(movieId: number): Promise<TmdbTrailerResult[]> {
  const key = getApiKey()
  if (!key) {
    console.warn('[tmdb] No TMDB_API_KEY set. Skipping trailers.')
    return []
  }

  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}/videos?api_key=${key}&language=en-US`,
    { headers: getHeaders() }
  )

  if (!res.ok) {
    console.error(`[tmdb] getMovieTrailers(${movieId}) failed: ${res.status}`)
    return []
  }

  const data = await res.json()

  // Filter to YouTube trailers/teasers only
  return (data.results || [])
    .filter((v: any) => v.site === 'YouTube' && ['Trailer', 'Teaser', 'Clip'].includes(v.type))
    .map((v: any) => ({
      key: v.key,
      name: v.name,
      type: v.type,
      official: v.official ?? false,
      site: v.site,
    }))
}

/**
 * Get movie details by ID
 */
export async function getMovieDetails(movieId: number): Promise<TmdbMovieResult | null> {
  const key = getApiKey()
  if (!key) return null

  const res = await fetch(`${TMDB_BASE}/movie/${movieId}?api_key=${key}&language=en-US`, { headers: getHeaders() })
  if (!res.ok) return null
  return res.json()
}

/**
 * Search movies by title
 */
export async function searchMovies(query: string, page = 1): Promise<{ results: TmdbMovieResult[] }> {
  const key = getApiKey()
  if (!key) return { results: [] }

  const res = await fetch(
    `${TMDB_BASE}/search/movie?api_key=${key}&query=${encodeURIComponent(query)}&page=${page}`,
    { headers: getHeaders() }
  )
  if (!res.ok) return { results: [] }
  return res.json()
}

/**
 * Map TMDB genre IDs to our category slugs
 */
export function mapGenreToCategory(genreIds: number[]): string {
  for (const id of genreIds) {
    const cat = GENRE_MAP[id]
    if (cat) return cat
  }
  return 'action' // default
}

/**
 * Get image URL
 */
export function getTmdbImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string {
  if (!path) return ''
  return `${TMDB_IMG}/${size}${path}`
}
