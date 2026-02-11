'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, Play } from 'lucide-react';

interface TrendingVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  trend: string;
  rank: number;
}

const trendingVideos: TrendingVideo[] = [
  {
    id: '1',
    title: 'Viral Dance Challenge - Everyone is Doing This!',
    thumbnail: '/api/placeholder/320/180',
    duration: '3:24',
    views: '5.2M',
    trend: '+120%',
    rank: 1
  },
  {
    id: '2',
    title: 'Breaking News: Major Tech Announcement',
    thumbnail: '/api/placeholder/320/180',
    duration: '8:15',
    views: '3.8M',
    trend: '+85%',
    rank: 2
  },
  {
    id: '3',
    title: 'ASMR Cooking - Satisfying Food Prep',
    thumbnail: '/api/placeholder/320/180',
    duration: '25:40',
    views: '2.9M',
    trend: '+67%',
    rank: 3
  },
  {
    id: '4',
    title: 'Gaming World Record Broken!',
    thumbnail: '/api/placeholder/320/180',
    duration: '12:33',
    views: '4.1M',
    trend: '+95%',
    rank: 4
  }
];

export default function TrendingVideos() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {trendingVideos.map((video) => (
        <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="relative">
            <div className="absolute top-2 left-2 z-10">
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                #{video.rank}
              </Badge>
            </div>
            <div className="relative aspect-video bg-muted">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
          </div>

          <CardContent className="p-3">
            <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-2">
              {video.title}
            </h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{video.views} views</span>
              <div className="flex items-center text-accent">
                <TrendingUp className="w-3 h-3 mr-1" />
                {video.trend}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}