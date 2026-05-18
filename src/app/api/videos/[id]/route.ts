import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/videos/[id]
 *
 * Get a single video by UUID slug.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    const { data: raw, error } = await supabase
      .from('videos')
      .select('id, title, slug, description, release_year, genre, studio, duration_secs, trailer_type, thumbnail_url, source_name, source_url, source_type, view_count, created_at')
      .eq('slug', id)
      .eq('status', 'published')
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!raw) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    const video = raw as {
      id: string
      title: string
      slug: string
      description: string | null
      release_year: number | null
      genre: string
      studio: string
      duration_secs: number | null
      trailer_type: string
      thumbnail_url: string
      source_name: string
      source_url: string
      source_type: string
      view_count: number | null
      created_at: string
    }

    // Increment view count (fire-and-forget)
    ;(supabase as any)
      .from('videos')
      .update({ view_count: (video.view_count || 0) + 1 })
      .eq('id', video.id)
      .then(undefined, () => {})

    return NextResponse.json({ video })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
