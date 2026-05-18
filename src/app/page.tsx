import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import VideoGrid from '@/components/video/VideoGrid'
import TrendingVideos from '@/components/video/TrendingVideos'
import { Play, Film, Sparkles, Star, Clapperboard, TrendingUp, Zap, Users } from 'lucide-react'
import FeaturedTrailers from '@/components/video/FeaturedTrailers'

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-700 via-blue-800 to-indigo-900 text-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Clapperboard className="w-10 h-10 text-yellow-400" />
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
              pix.mov
            </h1>
          </div>
          <p className="mt-4 text-xl leading-8 max-w-2xl mx-auto text-blue-100">
            Movie trailers, short clips, and community reviews. Discover what's new,
            what's trending, and what's worth watching.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6 flex-wrap gap-y-4">
            <Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 font-semibold">
              <Film className="w-5 h-5 mr-2" />
              Browse Trailers
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Sparkles className="w-5 h-5 mr-2" />
              Trending Now
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Film className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">Movie Trailers</div>
              <div className="text-sm text-muted-foreground">Curated collection</div>
            </div>
            <div className="text-center">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">Reviews</div>
              <div className="text-sm text-muted-foreground">Community powered</div>
            </div>
            <div className="text-center">
              <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">Trending</div>
              <div className="text-sm text-muted-foreground">Daily updates</div>
            </div>
            <div className="text-center">
              <Zap className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-foreground">Short Clips</div>
              <div className="text-sm text-muted-foreground">Max 2 min</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trailers */}
      <FeaturedTrailers />

      {/* Trending */}
      <TrendingVideos />

      {/* All Trailers Grid */}
      <section className="py-16 bg-muted">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Latest Trailers</h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <VideoGrid />
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-8">Browse by Genre</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Action', emoji: '💥', color: 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20' },
              { name: 'Comedy', emoji: '😂', color: 'bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20' },
              { name: 'Drama', emoji: '🎭', color: 'bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20' },
              { name: 'Sci-Fi', emoji: '🚀', color: 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20' },
              { name: 'Horror', emoji: '👻', color: 'bg-red-800/10 border-red-800/30 hover:bg-red-800/20' },
              { name: 'Animation', emoji: '🐭', color: 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20' },
              { name: 'Indie', emoji: '🎬', color: 'bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20' },
              { name: 'Documentary', emoji: '📽️', color: 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20' },
            ].map((cat) => (
              <a key={cat.name} href={`/category/${cat.name.toLowerCase()}`}>
                <Card className={`cursor-pointer transition-all hover:shadow-lg ${cat.color} border`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-2">{cat.emoji}</div>
                    <div className="text-lg font-semibold text-foreground">{cat.name}</div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Attribution */}
      <section className="py-8 bg-muted border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
          Trailers sourced from official studio channels on YouTube and TMDB. 
          All trademarks and copyrights belong to their respective owners.
          {' '}Report takedown requests to contact@pix.mov.
        </div>
      </section>
    </div>
  )
}
