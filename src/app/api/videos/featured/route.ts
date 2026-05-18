import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/videos/featured
 *
 * Returns featured trailers for the homepage hero section.
 */
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: videos, error } = await supabase
      .from('videos')
      .select('id, title, slug, description, release_year, genre, studio, thumbnail_url, trailer_type, source_name, featured_order')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('featured_order', { ascending: true, nullsFirst: false })
      .limit(6)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ videos: videos || [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
