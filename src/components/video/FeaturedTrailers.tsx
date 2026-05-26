'use client';

import { useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FeaturedVideo {
  id: string;
  title: string;
  slug: string;
  description: string;
  release_year: number;
  genre: string;
  studio: string;
  thumbnail_url: string;
  trailer_type: string;
}

export default function FeaturedTrailers() {
  const [videos, setVideos] = useState<FeaturedVideo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/videos/featured');
        const data = await res.json();
        setVideos(data.videos || []);
      } catch (err) {
        console.error('Failed to fetch featured:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (videos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % videos.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [videos.length]);

  if (loading) {
    return (
      <section className="py-16 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </section>
    );
  }

  if (videos.length === 0) return null;

  const video = videos[current];

  return (
    <section className="py-16 bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Play className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Featured Trailers</h2>
          </div>
          {videos.length > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setCurrent(prev => (prev - 1 + videos.length) % videos.length)}
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrent(prev => (prev + 1) % videos.length)}
                className="p-2 rounded-full bg-muted hover:bg-muted/80 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        <a href={`/watch/${video.slug}`} className="group block relative rounded-xl overflow-hidden">
          <div className="aspect-[21/9] bg-muted relative">
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Play className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-600 text-white text-xs uppercase px-2 py-1 rounded font-semibold">
                  {video.trailer_type === 'teaser' ? 'Teaser' : 'Official Trailer'}
                </span>
                <span className="text-white/70 text-sm">{video.release_year}</span>
                <span className="text-white/70 text-sm">{video.genre}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{video.title}</h3>
              {video.description && (
                <p className="text-white/70 text-sm max-w-2xl line-clamp-2">{video.description}</p>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            </div>
          </div>

          {/* Carousel dots */}
          {videos.length > 1 && (
            <div className="absolute bottom-2 right-8 flex gap-1.5">
              {videos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === current ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </a>
      </div>
    </section>
  );
}
