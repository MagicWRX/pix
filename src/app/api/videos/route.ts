import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/videos
 *
 * List published trailers with optional filters.
 * Query params: category, page, limit, sort, search
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const search = searchParams.get('search') || ''

    let query = supabase
      .from('videos')
      .select('id, title, slug, description, release_year, genre, studio, duration_secs, trailer_type, thumbnail_url, source_name, view_count, created_at', { count: 'exact' })
      .eq('status', 'published')

    if (category) query = query.eq('genre', category)
    if (search) query = query.ilike('title', `%${search}%`)

    const from = (page - 1) * limit
    const to = from + limit - 1

    const sortColumn = ['created_at', 'view_count', 'title', 'release_year'].includes(sort) ? sort : 'created_at'
    const sortOrder = order === 'asc' ? { ascending: true } as const : { ascending: false } as const
    query = query.order(sortColumn, sortOrder).range(from, to)

    const { data: videos, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      videos: videos || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * POST /api/videos/scrape — Trigger a scrape cycle
 * Used by admin or crontab to populate the trailer database.
 */
export const dynamic = 'force-dynamic'
