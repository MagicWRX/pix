'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { CheckoutButton, PortalButton } from '@magicwrx/stripe-tool';
import {
  User,
  Video,
  Heart,
  Users,
  TrendingUp,
  Settings,
  Crown,
  Star
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('videos');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please sign in to view your profile.</p>
            <Button className="w-full">Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mockStats = {
    videos: 24,
    followers: 15420,
    following: 89,
    likes: 45600,
    views: 1250000
  };

  const mockVideos = [
    { id: '1', title: 'My First Video', views: '12K', likes: 450, date: '2 days ago' },
    { id: '2', title: 'Cooking Tutorial', views: '8K', likes: 320, date: '1 week ago' },
    { id: '3', title: 'Travel Vlog', views: '15K', likes: 680, date: '2 weeks ago' }
  ];

  const mockLikedVideos = [
    { id: '1', title: 'Amazing Recipe', creator: 'ChefPro', likes: 1200 },
    { id: '2', title: 'Gaming Tips', creator: 'GameMaster', likes: 890 },
    { id: '3', title: 'Tech Review', creator: 'TechGuru', likes: 2100 }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Header */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start space-x-6">
            <div className="relative">
              <img
                src={user.user_metadata?.avatar_url || '/api/placeholder/120/120'}
                alt={user.user_metadata?.full_name || 'User'}
                className="w-32 h-32 rounded-full"
              />
              <div className="absolute -bottom-2 -right-2">
                <Badge className="bg-green-500">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-foreground">
                  {user.user_metadata?.full_name || 'Creator'}
                </h1>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>

              <p className="text-muted-foreground mb-4">
                Passionate creator sharing amazing content with the world! 🎥✨
              </p>

              {/* Stats */}
              <div className="grid grid-cols-5 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{mockStats.videos}</div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{mockStats.followers.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{mockStats.following}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{(mockStats.likes / 1000).toFixed(1)}K</div>
                  <div className="text-sm text-muted-foreground">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{(mockStats.views / 1000000).toFixed(1)}M</div>
                  <div className="text-sm text-muted-foreground">Views</div>
                </div>
              </div>

              {/* Subscription Section */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <Star className="w-5 h-5 text-yellow-500 mr-2" />
                      Premium Creator
                    </h3>
                    <p className="text-sm text-gray-600">Unlock advanced analytics and monetization features</p>
                  </div>
                  <CheckoutButton
                    productConfig={{
                      name: 'Premium Creator',
                      description: 'Advanced creator tools and analytics',
                      price: 999, // $9.99
                      interval: 'month'
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Upgrade
                  </CheckoutButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'videos', label: 'My Videos', icon: Video },
              { id: 'liked', label: 'Liked Videos', icon: Heart },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'subscribers', label: 'Subscribers', icon: Users }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'videos' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockVideos.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 rounded-t-lg flex items-center justify-center">
                  <Video className="w-12 h-12 text-gray-400" />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{video.views} views</span>
                    <span>{video.likes} likes</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{video.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'liked' && (
          <div className="space-y-4">
            {mockLikedVideos.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-16 bg-gray-200 rounded flex items-center justify-center">
                      <Video className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-600">by {video.creator}</p>
                      <p className="text-xs text-gray-500">{video.likes} likes</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Heart className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">1.2M</p>
                    <p className="text-sm text-green-600">+12% this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Heart className="w-8 h-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Likes</p>
                    <p className="text-2xl font-bold text-gray-900">45.6K</p>
                    <p className="text-sm text-green-600">+8% this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Subscribers</p>
                    <p className="text-2xl font-bold text-gray-900">15.4K</p>
                    <p className="text-sm text-green-600">+5% this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Crown className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">$2,340</p>
                    <p className="text-sm text-green-600">+15% this month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Subscriber Management</h3>
                    <p className="text-sm text-gray-600">Manage your subscriber perks and communications</p>
                  </div>
                  <PortalButton className="bg-blue-600 hover:bg-blue-700">
                    Manage Subscriptions
                  </PortalButton>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">15.4K</div>
                  <div className="text-sm text-gray-600">Total Subscribers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">2.1K</div>
                  <div className="text-sm text-gray-600">This Month</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">94%</div>
                  <div className="text-sm text-gray-600">Retention Rate</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}