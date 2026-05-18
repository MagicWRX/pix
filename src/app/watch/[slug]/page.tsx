'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import { Play, Eye, Calendar, Film, ExternalLink } from 'lucide-react';
import VideoGrid from '@/components/video/VideoGrid';

interface VideoPage {
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
  source_url: string;
  source_type: string;
  view_count: number;
  created_at: string;
}

export default function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [video, setVideo] = useState<VideoPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/videos/${slug}`);
        if (!res.ok) {
          if (res.status === 404) setError('Trailer not found');
          else setError('Failed to load trailer');
          return;
        }
        const data = await res.json();
        setVideo(data.video);
      } catch (err) {
        setError('Failed to load trailer');
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="mx-auto max-w-5xl px-4">
          <div className="aspect-video bg-muted rounded-xl animate-pulse mb-8" />
          <div className="h-8 bg-muted rounded w-1/2 animate-pulse mb-4" />
          <div className="h-4 bg-muted rounded w-1/3 animate-pulse mb-2" />
          <div className="h-20 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-background py-24 text-center">
        <Play className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{error || 'Trailer not found'}</h1>
        <p className="text-muted-foreground mb-6">This trailer might have been removed or is unavailable.</p>
        <a href="/" className="text-primary hover:underline">Back to Browse</a>
      </div>
    );
  }

  // Extract YouTube video ID from source_url
  const youtubeMatch = video.source_url?.match(/(?:v=|\/)([\w-]{11})/);
  const youtubeId = youtubeMatch ? youtubeMatch[1] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player / Thumbnail */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-6">
              {youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : video.thumbnail_url ? (
                <>
                  <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href={video.source_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition"
                    >
                      <Play className="w-10 h-10 text-white ml-1" />
                    </a>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Play className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Video Info */}
            <h1 className="text-3xl font-bold text-foreground mb-2">{video.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {video.view_count || 0} views
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {video.release_year || 'TBA'}
              </span>
              <span className="flex items-center gap-1">
                <Film className="w-4 h-4" />
                {video.genre}
              </span>
              <span className="px-2 py-0.5 bg-blue-600/10 text-blue-600 rounded text-xs font-semibold uppercase">
                {video.trailer_type}
              </span>
            </div>

            {video.description && (
              <div className="bg-card border border-border rounded-lg p-4 mb-6">
                <p className="text-foreground text-sm leading-relaxed">{video.description}</p>
              </div>
            )}

            {/* Source Attribution */}
            {video.source_name && (
              <div className="text-xs text-muted-foreground mb-6">
                Source: <a href={video.source_url || '#'} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {video.source_name} <ExternalLink className="w-3 h-3 inline" />
                </a>
                {video.studio && ` · ${video.studio}`}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3">Movie Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Year</dt>
                  <dd>{video.release_year || 'TBA'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Genre</dt>
                  <dd className="capitalize">{video.genre}</dd>
                </div>
                {video.studio && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Studio</dt>
                    <dd>{video.studio}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Trailer</dt>
                  <dd className="capitalize">{video.trailer_type}</dd>
                </div>
                {video.duration_secs > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Runtime</dt>
                    <dd>{Math.floor(video.duration_secs / 60)}:{String(video.duration_secs % 60).padStart(2, '0')}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* More Trailers */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More in {video.genre}</h2>
          <VideoGrid category={video.genre} />
        </div>
      </div>
    </div>
  );
}
