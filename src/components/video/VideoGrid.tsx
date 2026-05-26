'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Play, Clock, Eye } from 'lucide-react';

interface TrailerVideo {
  id: string;
  title: string;
  slug: string;
  description: string;
  release_year: number;
  genre: string;
  studio: string;
  duration_secs: number;
  trailer_type: string;
  thumbnail_url: string;
  source_name: string;
  view_count: number;
  created_at: string;
}

interface VideoGridProps {
  initialVideos?: TrailerVideo[];
  category?: string;
}

export default function VideoGrid({ initialVideos, category }: VideoGridProps) {
  const [videos, setVideos] = useState<TrailerVideo[]>(initialVideos || []);
  const [loading, setLoading] = useState(!initialVideos);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (initialVideos) return;

    const fetchVideos = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '20' })
        if (category) params.set('category', category)

        const res = await fetch(`/api/videos?${params}`)
        const data = await res.json()

        if (page === 1) {
          setVideos(data.videos || [])
        } else {
          setVideos(prev => [...prev, ...(data.videos || [])])
        }
        setHasMore(page < (data.totalPages || 1))
      } catch (err) {
        console.error('Failed to fetch videos:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [page, category, initialVideos])

  const formatDuration = (secs: number): string => {
    if (!secs) return '—'
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatViews = (count: number): string => {
    if (!count) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map((video) => (
          <a key={video.id} href={`/watch/${video.slug}`} className="group">
            <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="relative aspect-video bg-muted">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Play className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                {video.duration_secs > 0 && (
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(video.duration_secs)}
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="bg-blue-600 text-white text-[10px] uppercase px-2 py-0.5 rounded font-semibold">
                    {video.trailer_type}
                  </span>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1">
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {video.release_year} • {video.genre}
                </p>
                <p className="text-xs text-muted-foreground mb-0.5">
                  {video.studio || video.source_name}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatViews(video.view_count)}
                  </span>
                  {video.trailer_type && (
                    <span className="text-blue-500">{video.trailer_type === 'teaser' ? 'Teaser' : 'Official Trailer'}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center py-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Load More
          </button>
        </div>
      )}

      {!loading && videos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Play className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No trailers yet</p>
          <p className="text-sm">Run the scraper to populate the library.</p>
        </div>
      )}
    </div>
  );
}
