import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import VideoGrid from '@/components/video/VideoGrid'
import TrendingVideos from '@/components/video/TrendingVideos'
import ShortsSection from '@/components/video/ShortsSection'
import { Play, TrendingUp, Users, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-orange-yellow text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
            Welcome to VideoHub
          </h1>
          <p className="mt-6 text-xl leading-8 max-w-2xl mx-auto">
            Discover, create, and share amazing video content with our vibrant community.
            From short clips to full productions, find your next favorite video.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
              <Play className="w-5 h-5 mr-2" />
              Start Watching
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
              Join Community
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-4">
                <Play className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">1M+</div>
              <div className="text-muted-foreground">Videos Uploaded</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-secondary/10 rounded-lg mx-auto mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-2xl font-bold text-foreground">500K+</div>
              <div className="text-muted-foreground">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-lg mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div className="text-2xl font-bold text-foreground">10M+</div>
              <div className="text-muted-foreground">Daily Views</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">50K+</div>
              <div className="text-muted-foreground">Shorts Daily</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Videos */}
      <section className="py-16 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <TrendingUp className="w-8 h-8 text-primary mr-3" />
            <h2 className="text-3xl font-bold text-foreground">Trending Now</h2>
          </div>
          <TrendingVideos />
        </div>
      </section>

      {/* Shorts Section */}
      <section className="py-16 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Zap className="w-8 h-8 text-primary mr-3" />
            <h2 className="text-3xl font-bold text-foreground">Shorts</h2>
          </div>
          <ShortsSection />
        </div>
      </section>

      {/* Main Video Grid */}
      <section className="py-16 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Recommended for You</h2>
          <VideoGrid />
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              'Gaming', 'Music', 'Education', 'Comedy', 'Tech', 'Sports',
              'Cooking', 'Travel', 'Fashion', 'Art', 'Science', 'News'
            ].map((category) => (
              <Card key={category} className="cursor-pointer hover:shadow-lg transition-shadow hover:bg-primary/5">
                <CardContent className="p-6 text-center">
                  <div className="text-lg font-semibold text-foreground">{category}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
