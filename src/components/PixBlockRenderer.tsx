'use client';

// ─── PixBlockRenderer ─────────────────────────────────────────────────────────
// Thin wrapper over @magicwrxtools/block-system's BlockTreeRenderer.
// Fetches blocks from ADMIN Supabase for ip_slug='pix', context='home'.
//
// Dynamic sections (Featured Trailers, Trending, Latest Trailers) are identified
// by content.dynamic === true and content.dynamicComponent. The renderers prop
// injects the matching client component (FeaturedTrailers, TrendingVideos, VideoGrid).
//
// SSOT: DOCs/BUSINESS/MOSAIC/MOSAIC_IP_CONVERSION_ROADMAP.md
// See also: Websites/base-template/src/components/BlockRenderer.tsx (reference pattern)

import { BlockTreeRenderer } from '@magicwrxtools/block-system';
import type { Block } from '@magicwrxtools/block-system/types';
import React from 'react';
import FeaturedTrailers from '@/components/video/FeaturedTrailers';
import TrendingVideos from '@/components/video/TrendingVideos';
import VideoGrid from '@/components/video/VideoGrid';

// ─── Type guard — check if a block is a dynamic section wrapper ──────────────

function isDynamicSection(block: Block): boolean {
  return (
    block.type === 'container' &&
    block.content?.dynamic === true &&
    typeof block.content?.dynamicComponent === 'string'
  );
}

// ─── Dynamic component registry ─────────────────────────────────────────────

function getDynamicComponent(name: string): React.ComponentType | null {
  const registry: Record<string, React.ComponentType> = {
    FeaturedTrailers,
    TrendingVideos,
    VideoGrid,
  };
  return registry[name] ?? null;
}

// ─── Dynamic wrapper helpers ─────────────────────────────────────────────────

function DynamicWrapper({ block }: { block: Block }): React.ReactElement {
  const title = block.content?.title as string | undefined;
  const showViewAll = block.content?.showViewAll === true;
  const Comp = getDynamicComponent(block.content?.dynamicComponent as string);

  if (!Comp) {
    return (
      <div className="p-8 text-center text-destructive" data-block-id={block.id}>
        Unknown dynamic component: {String(block.content?.dynamicComponent)}
      </div>
    );
  }

  if (showViewAll) {
    // Latest Trailers section — title row + "View All" button + VideoGrid
    return (
      <section className={block.classes || 'py-16 bg-muted'}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              {title || 'Latest Trailers'}
            </h2>
            <a
              href="/browse"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              View All
            </a>
          </div>
          <Comp />
        </div>
      </section>
    );
  }

  // Featured Trailers / Trending — just the component (they have their own wrappers)
  return <Comp />;
}

// ─── Hero section renderer ──────────────────────────────────────────────────

function HeroSection({ heroBlock }: { heroBlock: Block }) {
  // The hero container's children provide heading + text + columns
  return null; // rendered via BlockTreeRenderer's default container handling
}

// ─── Stats card renderer ────────────────────────────────────────────────────

function StatsCard({ block }: { block: Block }) {
  const content = block.content as Record<string, unknown> | undefined;
  const iconName = content?.icon as string | undefined;
  const value = content?.value as string | undefined;
  const label = content?.label as string | undefined;

  return (
    <div className={block.classes || 'text-center'}>
      {iconName && (
        <div className={content?.iconClass as string || 'w-6 h-6 mx-auto mb-2'}>
          {/* Icons are rendered as text labels since lucide icons need dynamic imports */}
        </div>
      )}
      <div className="text-2xl font-bold text-foreground">
        {value || ''}
      </div>
      <div className="text-sm text-muted-foreground">
        {label || ''}
      </div>
    </div>
  );
}

// ─── Genre card renderer ───────────────────────────────────────────────────

function GenreCard({ block }: { block: Block }) {
  const content = block.content as Record<string, unknown> | undefined;
  const emoji = content?.emoji as string | undefined;
  const name = content?.name as string | undefined;
  const href = content?.href as string | undefined;
  const blockClasses = block.classes || '';

  const card = (
    <div className="p-6 text-center">
      {emoji && <div className="text-3xl mb-2">{emoji}</div>}
      {name && <div className="text-lg font-semibold text-foreground">{name}</div>}
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        className={`cursor-pointer transition-all hover:shadow-lg rounded-xl border ${blockClasses}`}
        data-block-id={block.id}
        data-block-type={block.type}
      >
        {card}
      </a>
    );
  }

  return (
    <div
      className={`rounded-xl border ${blockClasses}`}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {card}
    </div>
  );
}

// ─── Custom renderers map — passed to BlockTreeRenderer ─────────────────────

const customRenderers: Partial<Record<string, (block: Block, children: React.ReactNode) => React.ReactNode>> = {
  container(block: Block, children: React.ReactNode) {
    // Dynamic section wrappers
    if (isDynamicSection(block)) {
      return <DynamicWrapper key={block.id} block={block} />;
    }

    // Hero section — render children normally (default container behavior)
    // Stats section — render children in a grid
    if (block.classes?.includes('grid grid-cols-2')) {
      return (
        <div
          data-block-id={block.id}
          data-block-type={block.type}
          className={block.classes}
          style={block.styleOverrides}
        >
          {block.customCss && (
            <style>{`[data-block-id="${block.id}"] { ${block.customCss} }`}</style>
          )}
          {children}
        </div>
      );
    }

    // Default container — just render children
    return (
      <div
        data-block-id={block.id}
        data-block-type={block.type}
        className={block.classes}
        style={block.styleOverrides}
      >
        {block.customCss && (
          <style>{`[data-block-id="${block.id}"] { ${block.customCss} }`}</style>
        )}
        {children}
      </div>
    );
  },

  card(block: Block, children: React.ReactNode) {
    // Check if this is a stat card or genre card based on content shape
    const content = block.content as Record<string, unknown> | undefined;
    if (content?.emoji) {
      return <GenreCard key={block.id} block={block} />;
    }
    if (content?.value) {
      return <StatsCard key={block.id} block={block} />;
    }
    // Fallback: render as a generic card div
    return (
      <div
        key={block.id}
        data-block-id={block.id}
        data-block-type={block.type}
        className={block.classes || 'rounded-xl border bg-card p-4'}
        style={block.styleOverrides}
      >
        {block.customCss && (
          <style>{`[data-block-id="${block.id}"] { ${block.customCss} }`}</style>
        )}
        {children}
      </div>
    );
  },
};

// ─── PixBlockRenderer ───────────────────────────────────────────────────────

export function PixBlockRenderer() {
  return (
    <BlockTreeRenderer
      ipSlug="pix"
      context="home"
      options={{
        supabaseUrl: process.env.NEXT_PUBLIC_ADMIN_SUPABASE_URL || '',
        supabaseAnonKey: process.env.NEXT_PUBLIC_ADMIN_SUPABASE_ANON_KEY || '',
      }}
      renderers={customRenderers}
      skeleton={
        <div className="min-h-screen bg-background">
          <div className="bg-gradient-to-br from-purple-700 via-blue-800 to-indigo-900 py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
              <div className="h-12 bg-white/20 rounded-lg w-48 mx-auto mb-6 animate-pulse" />
              <div className="h-6 bg-white/10 rounded-lg w-96 mx-auto animate-pulse" />
            </div>
          </div>
          <div className="py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center animate-pulse">
                    <div className="h-6 w-6 bg-muted rounded mx-auto mb-2" />
                    <div className="h-5 bg-muted rounded w-24 mx-auto mb-1" />
                    <div className="h-4 bg-muted rounded w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome to pix.mov
            </h2>
            <p className="text-muted-foreground mb-4">
              Movie trailers, short clips, and community reviews.
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by MagicWRX — Configure your content blocks in the ADMIN panel.
            </p>
          </div>
        </div>
      }
    />
  );
}
