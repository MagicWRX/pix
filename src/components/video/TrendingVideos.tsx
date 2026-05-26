'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Play, Star } from 'lucide-react';

interface TrailerVideo {
  id: string;
  title: string;
  slug: string;
  description: string;
  release_year: number;
  genre: string;
  studio: string;
  thumbnail_url: string;
  view_count: number;
}

export default function TrendingVideos() {
  const [videos, setVideos] = useState<TrailerVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/videos?sort=view_count&limit=5&order=desc')
        const data = await res.json()
        setVideos(data.videos || [])
      } catch (err) {
        console.error('Failed to fetch trending:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  const formatViews = (count: number): string => {
    if (!count) return '0'
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  if (loading) return null

  if (videos.length === 0) {
    return (
      <section className="py-16 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Trending Trailers</h2>
          </div>
          <p className="text-muted-foreground">Run the trailer scraper to see trending content.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Trending Trailers</h2>
        </div>

        <div className="space-y-4">
          {videos.map((video, index) => (
            <a
              key={video.id}
              href={`/watch/${video.slug}`}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition group"
            >
              <span className="text-2xl font-bold text-muted-foreground w-8 text-right">
                {(index + 1).toString().padStart(2, '0')}
              </span>
              <div className="w-24 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Play className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm group-hover:text-primary transition line-clamp-1">
                  {video.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {video.release_year} • {video.genre} • {video.studio}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <Star className="w-4 h-4 text-yellow-500" />
                  {video.view_count > 0 ? (
                    <span>{formatViews(video.view_count)}</span>
                  ) : (
                    <span className="text-muted-foreground">New</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">views</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
