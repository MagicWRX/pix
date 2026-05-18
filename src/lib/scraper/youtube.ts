/**
 * YouTube trailer client
 *
 * Fetches movie trailers from YouTube using the Data API v3.
 * Requires YOUTUBE_API_KEY env var.
 *
 * Falls back gracefully with console warnings when no key is set.
 */

const YT_BASE = 'https://www.googleapis.com/youtube/v3'

function getApiKey(): string {
  return process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || ''
}

export function hasYoutubeKey(): boolean {
  return !!getApiKey()
}

export interface YouTubeVideoResult {
  id: string
  title: string
  description: string
  publishedAt: string
  channelTitle: string
  thumbnailUrl: string
  duration: string  // ISO 8601
}

/**
 * Search YouTube for movie trailers
 */
export async function searchMovieTrailers(movieTitle: string, year?: number): Promise<YouTubeVideoResult[]> {
  const key = getApiKey()
  if (!key) {
    console.warn('[youtube] No YOUTUBE_API_KEY set. Skipping search.')
    return []
  }

  const query = year
    ? `${movieTitle} ${year} official trailer`
    : `${movieTitle} official trailer`

  const qs = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '3',
    key,
    videoDuration: 'short', // trailers are usually <20 min
    relevanceLanguage: 'en',
  })

  const res = await fetch(`${YT_BASE}/search?${qs}`)
  if (!res.ok) {
    console.error(`[youtube] search failed: ${res.status}`)
    return []
  }

  const data = await res.json()
  return (data.items || []).map((item: any) => ({
    id: item.id?.videoId || '',
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    publishedAt: item.snippet?.publishedAt || '',
    channelTitle: item.snippet?.channelTitle || '',
    thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
    duration: '',
  }))
}

/**
 * Get video details (including duration)
 */
export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoResult[]> {
  const key = getApiKey()
  if (!key || videoIds.length === 0) return []

  const qs = new URLSearchParams({
    part: 'snippet,contentDetails',
    id: videoIds.join(','),
    key,
  })

  const res = await fetch(`${YT_BASE}/videos?${qs}`)
  if (!res.ok) return []

  const data = await res.json()
  return (data.items || []).map((item: any) => ({
    id: item.id || '',
    title: item.snippet?.title || '',
    description: item.snippet?.description || '',
    publishedAt: item.snippet?.publishedAt || '',
    channelTitle: item.snippet?.channelTitle || '',
    thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
    duration: item.contentDetails?.duration || '',
  }))
}
