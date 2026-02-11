'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heart, MessageCircle, Share, MoreVertical, Play } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: number;
  comments: number;
  creator: string;
  creatorAvatar: string;
  uploadedAt: string;
}

const mockVideos: Video[] = [
  {
    id: '1',
    title: 'Amazing Cooking Tutorial - Perfect Pasta',
    thumbnail: '/api/placeholder/320/180',
    duration: '12:34',
    views: '1.2M',
    likes: 45230,
    comments: 1234,
    creator: 'Chef Mario',
    creatorAvatar: '/api/placeholder/40/40',
    uploadedAt: '2 days ago'
  },
  {
    id: '2',
    title: 'Epic Gaming Montage - Best Plays 2024',
    thumbnail: '/api/placeholder/320/180',
    duration: '8:45',
    views: '890K',
    likes: 67890,
    comments: 2341,
    creator: 'GameMaster Pro',
    creatorAvatar: '/api/placeholder/40/40',
    uploadedAt: '1 day ago'
  },
  {
    id: '3',
    title: 'Travel Vlog - Exploring Hidden Gems',
    thumbnail: '/api/placeholder/320/180',
    duration: '15:20',
    views: '567K',
    likes: 34567,
    comments: 890,
    creator: 'Wanderlust Adventures',
    creatorAvatar: '/api/placeholder/40/40',
    uploadedAt: '3 days ago'
  },
  {
    id: '4',
    title: 'Tech Review - Latest Smartphone 2024',
    thumbnail: '/api/placeholder/320/180',
    duration: '10:15',
    views: '1.8M',
    likes: 89234,
    comments: 3456,
    creator: 'TechReviewer',
    creatorAvatar: '/api/placeholder/40/40',
    uploadedAt: '5 hours ago'
  },
  {
    id: '5',
    title: 'Fitness Journey - 30 Day Transformation',
    thumbnail: '/api/placeholder/320/180',
    duration: '22:10',
    views: '723K',
    likes: 56789,
    comments: 2103,
    creator: 'FitLife Coach',
    creatorAvatar: '/api/placeholder/40/40',
    uploadedAt: '1 week ago'
  },
  {
    id: '6',
    title: 'Music Production Tutorial - Making Beats',
    thumbnail: '/api/placeholder/320/180',
    duration: '18:30',
    views: '445K',
    likes: 23456,
    comments: 789,
    creator: 'BeatMaker Pro',
    creatorAvatar: '/api/placeholder/40/40',
    uploadedAt: '4 days ago'
  }
];

export default function VideoGrid() {
  const [videos, setVideos] = useState(mockVideos);

  const handleLike = (videoId: string) => {
    setVideos(prev => prev.map(video =>
      video.id === videoId
        ? { ...video, likes: video.likes + 1 }
        : video
    ));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <Card key={video.id} className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="relative aspect-video bg-muted">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex space-x-3">
              <img
                src={video.creatorAvatar}
                alt={video.creator}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">
                  {video.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">{video.creator}</p>
                <p className="text-sm text-muted-foreground">
                  {video.views} views • {video.uploadedAt}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(video.id)}
                className="flex items-center space-x-1 text-muted-foreground hover:text-primary"
              >
                <Heart className="w-4 h-4" />
                <span className="text-xs">{video.likes.toLocaleString()}</span>
              </Button>

              <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{video.comments}</span>
              </Button>

              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}