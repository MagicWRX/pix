'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Heart, MessageCircle, Share, Play, Volume2, VolumeX } from 'lucide-react';

interface Short {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  likes: number;
  comments: number;
  creator: string;
  creatorAvatar: string;
  description: string;
}

const mockShorts: Short[] = [
  {
    id: '1',
    title: 'Quick Recipe Hack',
    thumbnail: '/api/placeholder/200/300',
    duration: '0:15',
    likes: 12500,
    comments: 234,
    creator: 'QuickChef',
    creatorAvatar: '/api/placeholder/40/40',
    description: 'The fastest way to chop onions! 🍳'
  },
  {
    id: '2',
    title: 'Dance Move Tutorial',
    thumbnail: '/api/placeholder/200/300',
    duration: '0:22',
    likes: 8900,
    comments: 156,
    creator: 'DancePro',
    creatorAvatar: '/api/placeholder/40/40',
    description: 'Learn this viral dance in 20 seconds! 💃'
  },
  {
    id: '3',
    title: 'Pet Funny Moment',
    thumbnail: '/api/placeholder/200/300',
    duration: '0:18',
    likes: 15600,
    comments: 345,
    creator: 'PetLover',
    creatorAvatar: '/api/placeholder/40/40',
    description: 'My cat\'s reaction to food 😂'
  },
  {
    id: '4',
    title: 'Life Hack',
    thumbnail: '/api/placeholder/200/300',
    duration: '0:12',
    likes: 7800,
    comments: 98,
    creator: 'HackMaster',
    creatorAvatar: '/api/placeholder/40/40',
    description: 'Never lose your keys again! 🔑'
  },
  {
    id: '5',
    title: 'Magic Trick',
    thumbnail: '/api/placeholder/200/300',
    duration: '0:25',
    likes: 21000,
    comments: 567,
    creator: 'MagicMike',
    creatorAvatar: '/api/placeholder/40/40',
    description: 'Mind-blowing card trick! 🎴'
  }
];

export default function ShortsSection() {
  const [shorts, setShorts] = useState(mockShorts);
  const [muted, setMuted] = useState(true);

  const handleLike = (shortId: string) => {
    setShorts(prev => prev.map(short =>
      short.id === shortId
        ? { ...short, likes: short.likes + 1 }
        : short
    ));
  };

  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {shorts.map((short) => (
        <Card key={short.id} className="flex-shrink-0 w-48 group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="relative aspect-[9/16] bg-muted">
            <img
              src={short.thumbnail}
              alt={short.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
              {short.duration}
            </div>
            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMuted(!muted)}
                className="p-1 h-8 w-8 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
              >
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <CardContent className="p-3">
            <div className="flex items-start space-x-2 mb-2">
              <img
                src={short.creatorAvatar}
                alt={short.creator}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                  {short.creator}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {short.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleLike(short.id)}
                className="flex items-center space-x-1 text-muted-foreground hover:text-primary p-1"
              >
                <Heart className="w-4 h-4" />
                <span className="text-xs">{(short.likes / 1000).toFixed(1)}K</span>
              </Button>

              <Button variant="ghost" size="sm" className="flex items-center space-x-1 text-muted-foreground p-1">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{short.comments}</span>
              </Button>

              <Button variant="ghost" size="sm" className="text-muted-foreground p-1">
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}