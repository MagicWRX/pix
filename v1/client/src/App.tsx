import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SafeAreaTopScrim } from "@hatch/space-sdk/client";
import { strToU8, unzipSync, zipSync } from "fflate";
import { api, type ApiResponse } from "./api";
import { PixSection, pixGenreOptions, hasPixPoster, PixPosterImage, BiscuitLauncher, openBiscuitConsent, type PixGameState } from "./PixSection";
import { getPixPosterUrl, hasPixMarqueePoster, PixFeaturePosterImage, PixMarqueePosterImage, preloadPixMarqueePosters } from "./PixPosterImage";
import { PixProfileSection } from "./PixProfileSection";
import { PixMoviePage } from "./PixMoviePage";
import { SharedListView, UserListsManager, type PixUserList } from "./PixLists";
import { SafeSpaceDialogue, SafeSpaceFlagNotice } from "./SafeSpaceNotice";
import { BILLBOARD_SECONDS, FAMOUS_QUOTES, BillboardQuoteCard, PlayerControlButtons, type BillboardQuote } from "./PixPlayerKit";

import sourceTreeArchive from "./assets/pix-source-tree.zip";
import cineDesktopAppV8 from "./assets/cine-desktop-app-v8.01.02.zip";
import rampage from "./assets/rampage-of-the-titan_20260925.webp";
import rampageV2 from "./assets/rampage-of-the-titan_v2_20260925.webp";
import rampageV3 from "./assets/rampage-of-the-titan_v3_20260925.webp";
import kragath from "./assets/terror-of-kragath_20260925.webp";
import morvax from "./assets/the-wrath-of-morvax_20260925.webp";
import vulkar from "./assets/vulkar-two-heads-of-terror_20260925.webp";
import vulkarCartoon from "./assets/vulkar-two-heads-of-terror_cartoon_20260925.webp";
import vulkarMotu from "./assets/vulkar-two-heads-of-terror_motu_20260925.webp";
import vulkarFrazetta from "./assets/vulkar-two-heads-of-terror_frazetta_20260925.webp";
import vulkarMoebius from "./assets/vulkar-two-heads-of-terror_moebius_20260925.webp";
import neonCity from "./assets/neon-city_20260925.webp";
import mountainLake from "./assets/mountain-lake_20260925.webp";
import concretePulse from "./assets/music-loops/01-concrete-pulse_hiphop_30s.mp3";
import dirtRoadDawn from "./assets/music-loops/02-dirt-road-dawn_country_30s.mp3";
import neonGrid from "./assets/music-loops/03-neon-grid_electronic_30s.mp3";
import ironTempest from "./assets/music-loops/04-iron-tempest_metal_30s.mp3";
import stillwater from "./assets/music-loops/05-stillwater_relaxing_30s.mp3";

type Note = ApiResponse<typeof api, "listNotes">["notes"][number];
type ChatMessage = ApiResponse<typeof api, "listChat">["messages"][number];
type PixBrowseMovie = ApiResponse<typeof api, "listPixBrowseCatalog">["movies"][number];
type PixSeenYearMovie = ApiResponse<typeof api, "listPixPosterYears">["movies"][number];
type PixViewsMovie = ApiResponse<typeof api, "listPixMoviesByViews">["movies"][number];
type PixTopMovie = ApiResponse<typeof api, "listPixTopMovies">["movies"][number];
type PixMoneyMovie = ApiResponse<typeof api, "listPixMoneyRankings">["movies"][number];
type PixCombGrosser = ApiResponse<typeof api, "listPixCombGrossers">["movies"][number];
type PixFriendReview = ApiResponse<typeof api, "listPixFriendReviews">["reviews"][number];
type PixWatchlistMovie = ApiResponse<typeof api, "listPixWatchlist">["queue"][number];
type PixWatchlistRewatch = ApiResponse<typeof api, "listPixWatchlist">["rewatch"][number];
type PixWatchlistCreator = ApiResponse<typeof api, "listPixWatchlist">["creators"][number];
type PixTrendingMovie = ApiResponse<typeof api, "listPixTrending">["movies"][number];
type YoutubeTrendingShort = ApiResponse<typeof api, "listYoutubeTrendingShorts">["shorts"][number];
type CineTrendingShort = ApiResponse<typeof api, "listCineTrendingShorts">["shorts"][number];
type PixClassicFilm = ApiResponse<typeof api, "listPixClassicFilm">;
type PixClassicClip = PixClassicFilm["clips"][number];
type PixClassicSection = ApiResponse<typeof api, "listPixClassicSections">["sections"][number];
type PixClassicSectionCard = PixClassicSection["films"][number];
type PixAd = ApiResponse<typeof api, "getPixControlState">["ads"][number];
type SectionKey = "pix" | "dna" | "pix-profile" | "screening" | "feature" | "seen" | "sort" | "views" | "top500" | "grossers" | "budgets" | "watchlist" | "lists" | "tough" | "attractions" | "feedback" | "privacy" | "agreements" | "cine" | "section-dream-log" | "section-posters" | "section-monsters" | "section-notes" | "section-publish";

const slugBySection: Record<SectionKey, string> = {
  pix: "pix",
  dna: "dna",
  "pix-profile": "profile",
  screening: "screening",
  feature: "feature",
  seen: "seen",
  sort: "sort",
  views: "views",
  top500: "top500",
  grossers: "grossers",
  budgets: "budgets",
  watchlist: "watchlist",
  lists: "lists",
  tough: "tough",
  attractions: "attractions",
  feedback: "feedback",
  privacy: "privacy",
  agreements: "agreements",
  cine: "cine",
  "section-dream-log": "dream-log",
  "section-posters": "poster",
  "section-monsters": "monsters",
  "section-notes": "notes",
  "section-publish": "publish",
};

const sectionBySlug = new Map(Object.entries(slugBySection).map(([key, slug]) => [slug, key as SectionKey]));

// LAUNCH (Brian's order, 2026-11-04): CINE is removed from the visitor
// surface until it is stable. Every CINE entry point — the header CONTENT
// trigger and its window, the #/cine route, the CINE section render and
// the BIN float inside it — is guarded by this one flag. All CINE code,
// server actions, tables and data are preserved untouched; flip this to
// true to restore CINE exactly as it was.
const CINE_ENABLED = false;

function hashParts(hash: string): string[] {
  try {
    return decodeURIComponent(hash.replace(/^#\/?/, ""))
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function sectionFromHash(hash: string): SectionKey | null {
  const [slug = ""] = hashParts(hash);
  const key = sectionBySlug.get(slug.toLowerCase()) ?? null;
  if (key === "cine" && !CINE_ENABLED) return "pix";
  return key;
}

function itemFromHash(hash: string, sectionSlug: string): string | null {
  const [slug = "", item = ""] = hashParts(hash);
  return slug.toLowerCase() === sectionSlug && item ? item : null;
}

const helpBubblesStorageKey = "pix-help-bubbles";
const helpBubblesChangeEvent = "pix-help-bubbles-change";

// Session-only preferences: PIX no longer keeps any game or UI preference
// in localStorage — the persistent "cookie" that made every new visit pick
// up where the last one left off (including a year filter stuck on a
// single year). Preferences now live in sessionStorage, which the browser
// wipes when the session/tab ends, so every fresh visit is a true first
// play. Game answers themselves are unaffected: votes, unseen marks, and
// interest signals are still recorded in the database exactly as before.
// The one localStorage record that stays is the CINE chunked-upload resume
// record ("pix.cine.*") — that is work-in-progress, not a preference, and
// losing it between sessions would orphan an interrupted upload.
function sessionPreferenceGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function sessionPreferenceSet(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // The current session still updates if browser storage is unavailable.
  }
}

// One-time purge of the legacy persistent values, run as this module loads
// (before any component reads its initial state), so a filter or scale
// saved by an older build can never leak into a new session.
try {
  const legacyKeys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith("pix-")) legacyKeys.push(key);
  }
  for (const key of legacyKeys) window.localStorage.removeItem(key);
} catch {
  // Storage unavailable — nothing to purge.
}

function readHelpBubblesPreference(): boolean {
  return sessionPreferenceGet(helpBubblesStorageKey) !== "off";
}

function useHelpBubblesPreference(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabledState] = useState(readHelpBubblesPreference);

  useEffect(() => {
    const syncPreference = () => setEnabledState(readHelpBubblesPreference());
    window.addEventListener("storage", syncPreference);
    window.addEventListener(helpBubblesChangeEvent, syncPreference);
    return () => {
      window.removeEventListener("storage", syncPreference);
      window.removeEventListener(helpBubblesChangeEvent, syncPreference);
    };
  }, []);

  function setEnabled(enabledNext: boolean) {
    sessionPreferenceSet(helpBubblesStorageKey, enabledNext ? "on" : "off");
    setEnabledState(enabledNext);
    window.dispatchEvent(new Event(helpBubblesChangeEvent));
  }

  return [enabled, setEnabled];
}

const imageByKey: Record<string, string> = {
  "rampage-of-the-titan": rampage,
  "rampage-of-the-titan-v2": rampageV2,
  "rampage-of-the-titan-v3": rampageV3,
  "terror-of-kragath": kragath,
  "the-wrath-of-morvax": morvax,
  "vulkar-two-heads-of-terror": vulkar,
  "vulkar-two-heads-of-terror-cartoon": vulkarCartoon,
  "vulkar-two-heads-of-terror-motu": vulkarMotu,
  "vulkar-two-heads-of-terror-frazetta": vulkarFrazetta,
  "vulkar-two-heads-of-terror-moebius": vulkarMoebius,
  "neon-city-sample": neonCity,
  "mountain-lake-sample": mountainLake,
};

function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function monsterFrom(note: Note): string {
  return note.tags.find((tag) => tag.startsWith("monster:"))?.slice(8) ?? "Environment study";
}

function ArrowMark() {
  return <span aria-hidden="true">↗</span>;
}

function StoryPosterGallery({ posters, memos }: { posters: Note[]; memos: Note[] }) {
  const [selected, setSelected] = useState<Note | null>(null);
  const sorted = [...posters].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  useEffect(() => {
    function followPosterLink() {
      const entityKey = itemFromHash(window.location.hash, "poster");
      setSelected(entityKey ? posters.find((poster) => poster.entity_key === entityKey) ?? null : null);
    }

    followPosterLink();
    window.addEventListener("hashchange", followPosterLink);
    return () => window.removeEventListener("hashchange", followPosterLink);
  }, [posters]);

  function openPoster(poster: Note) {
    setSelected(poster);
    if (poster.entity_key) window.location.hash = `poster/${encodeURIComponent(poster.entity_key)}`;
  }

  function closePoster() {
    setSelected(null);
    window.location.hash = "poster";
  }

  return (
    <section aria-labelledby="poster-heading" className="section-shell">
      <div className="section-heading gallery-heading">
        <div>
          <p className="kicker">Story / Concept archive</p>
          <h1 id="poster-heading">Posters</h1>
        </div>
        <p className="section-intro">Kaiju posters and visual concepts from the stories you’re building.</p>
      </div>

      <div className="poster-grid">
        {sorted.map((poster, index) => {
          const image = poster.entity_key ? imageByKey[poster.entity_key] : undefined;
          const linkedCount = memos.filter((memo) => memo.parent_note_id === poster.id).length;
          if (!image) return null;
          return (
            <button
              type="button"
              className={`poster-card ${index === 0 ? "poster-card-featured" : ""}`}
              key={poster.id}
              onClick={() => openPoster(poster)}
              aria-label={`View ${poster.title}`}
            >
              <div className="poster-image-wrap">
                <img src={image} alt={`${poster.title}, featuring ${monsterFrom(poster)}`} />
                <span className="issue-number">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <span className="poster-meta">
                <span>
                  <strong>{poster.title}</strong>
                  <small>{monsterFrom(poster)}</small>
                </span>
                <span className="poster-link-count">{linkedCount > 0 ? `${linkedCount} note${linkedCount === 1 ? "" : "s"}` : <ArrowMark />}</span>
              </span>
            </button>
          );
        })}
      </div>

      {selected && selected.entity_key && imageByKey[selected.entity_key] ? (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={selected.title}>
          <button className="lightbox-backdrop" aria-label="Close poster viewer" onClick={closePoster} />
          <div className="lightbox-panel">
            <button className="close-button" aria-label="Close poster viewer" onClick={closePoster}>×</button>
            <img src={imageByKey[selected.entity_key]} alt={`${selected.title}, featuring ${monsterFrom(selected)}`} />
            <div className="lightbox-caption">
              <p>{monsterFrom(selected)}</p>
              <h2>{selected.title}</h2>
              {selected.body ? <span>{selected.body}</span> : null}
              {memos.filter((memo) => memo.parent_note_id === selected.id).map((memo) => (
                <div className="linked-note" key={memo.id}>
                  <strong>{memo.title}</strong>
                  <p>{memo.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type CineAsset = ApiResponse<typeof api, "getCineWorkspace">["assets"][number];
type TimelineTrackKind = "video" | "audio" | "text" | "graphic" | "animation";
type AnimationPreset = "drift" | "spin" | "pulse";
type SocialPlatform = "tiktok" | "youtube" | "facebook" | "x" | "bluesky" | "instagram";
type SocialFormat = "vertical" | "square" | "landscape";
type VideoSnap = "width" | "height" | "fill";
type VerticalFloat = "top" | "center" | "bottom";
type BinView = "icons" | "list" | "tree";
type CineToolId = "bin" | "inout" | "framing" | "export" | "timeline" | "stitch" | "filters" | "distributor" | "library" | "pix-library" | "storage";
type CineToolColumn = "left" | "center" | "right";

type CineToolLayout = Record<CineToolColumn, CineToolId[]>;

const cineToolNames: Record<CineToolId, string> = {
  bin: "BIN",
  inout: "IN / OUT",
  framing: "FRAMING",
  export: "EXPORT",
  timeline: "TIMELINE",
  stitch: "AUTO STITCH",
  filters: "FILTERS",
  distributor: "DISTRIBUTOR",
  library: "LIBRARY",
  "pix-library": "PIX LIBRARY",
  storage: "STORAGE",
};

const defaultCineToolLayout: CineToolLayout = {
  left: ["bin", "inout", "distributor"],
  center: ["timeline", "stitch", "filters", "pix-library", "library"],
  right: ["framing", "export", "storage"],
};

// CINE feature flags. Distributor paywall (planned goal): the DISTRIBUTOR
// tool stays available to everyone for now, but it is architected to be
// gated later — flip `distributorPaywall` to true and viewers without a
// paid plan get the tool's locked state instead of the destination
// controls. See CINE-ROADMAP.md.
const cineFeatureFlags = { distributorPaywall: false };

const cineToolHelp: Partial<Record<CineToolId, string>> = {
  distributor: "Choose destinations and save an account label plus output format to your CINE profile. Developer publishing credentials are managed outside PIX; authorize each account through its provider.",
  library: "Review past reels, shorts, source clips, and exports",
  "pix-library": "Review PIX-ready clips and add them directly to the timeline",
  storage: "Manage cloud capacity and connection",
};

type TimelineTrack = {
  id: string;
  kind: TimelineTrackKind;
  label: string;
  start: number;
  end: number;
  enabled: boolean;
  sourceUrl?: string;
  // Seconds into the source media where this clip begins. Cutting a clip and
  // dragging its left edge move this forward so the picture stays in sync.
  sourceStart?: number;
  loop?: boolean;
  text?: string;
  preset?: AnimationPreset;
  thumbnails?: string[];
};

type MusicLoop = {
  title: string;
  genre: string;
  sourceUrl: string;
};

const musicLoops: MusicLoop[] = [
  { title: "Concrete Pulse", genre: "Hip-hop", sourceUrl: concretePulse },
  { title: "Dirt Road Dawn", genre: "Country", sourceUrl: dirtRoadDawn },
  { title: "Neon Grid", genre: "Electronic", sourceUrl: neonGrid },
  { title: "Iron Tempest", genre: "Heavy metal", sourceUrl: ironTempest },
  { title: "Stillwater", genre: "Relaxing", sourceUrl: stillwater },
];

const trackNames: Record<TimelineTrackKind, string> = {
  video: "Video",
  audio: "Audio",
  text: "Text",
  graphic: "Image",
  animation: "Animation",
};

type SocialPlatformSpec = {
  brand: string;
  blurbLimit: number;
  linksAllowed: boolean;
  fields: Array<{ label: string; limit: number | null }>;
};

const socialPlatformSpecs: Record<SocialPlatform, SocialPlatformSpec> = {
  tiktok: {
    brand: "#010101",
    blurbLimit: 2200,
    linksAllowed: false,
    fields: [
      { label: "Caption (your text blurb)", limit: 2200 },
      { label: "Hashtags inside the caption", limit: null },
      { label: "Clickable link", limit: 0 },
    ],
  },
  youtube: {
    brand: "#ff0000",
    blurbLimit: 5000,
    linksAllowed: true,
    fields: [
      { label: "Video title", limit: 100 },
      { label: "Description (your text blurb)", limit: 5000 },
      { label: "Tags", limit: 500 },
      { label: "Clickable links in description", limit: null },
    ],
  },
  facebook: {
    brand: "#1877f2",
    blurbLimit: 63206,
    linksAllowed: true,
    fields: [
      { label: "Post text (your text blurb)", limit: 63206 },
      { label: "Clickable link in the post", limit: null },
      { label: "Hashtags inside the text", limit: null },
    ],
  },
  x: {
    brand: "#000000",
    blurbLimit: 280,
    linksAllowed: true,
    fields: [
      { label: "Post text (your text blurb)", limit: 280 },
      { label: "A link counts as 23 characters", limit: 23 },
    ],
  },
  bluesky: {
    brand: "#0085ff",
    blurbLimit: 300,
    linksAllowed: true,
    fields: [
      { label: "Post text (your text blurb)", limit: 300 },
      { label: "Clickable links in the post", limit: null },
      { label: "Alt text for the video", limit: 2000 },
    ],
  },
  instagram: {
    brand: "#e1306c",
    blurbLimit: 2200,
    linksAllowed: false,
    fields: [
      { label: "Caption (your text blurb)", limit: 2200 },
      { label: "Hashtags inside the caption", limit: null },
      { label: "Clickable link (bio / link sticker only, not in caption)", limit: 0 },
    ],
  },
};

const socialPlatforms: Array<{
  id: SocialPlatform;
  name: string;
  short: string;
  setupUrl: string;
  setupLabel: string;
  note: string;
  defaultFormat: SocialFormat;
}> = [
  {
    id: "tiktok",
    name: "TikTok",
    short: "TT",
    setupUrl: "https://developers.tiktok.com/doc/content-posting-api-get-started-upload-content?enter_method=left_navigation",
    setupLabel: "TikTok Content Posting guide",
    note: "Register a developer app, request Content Posting access, then authorize the TikTok account with OAuth.",
    defaultFormat: "vertical",
  },
  {
    id: "youtube",
    name: "YouTube",
    short: "YT",
    setupUrl: "https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid",
    setupLabel: "Google OAuth client setup",
    note: "Create a Google Cloud OAuth client. Uploading to a channel requires account authorization; a public API key is not enough.",
    defaultFormat: "landscape",
  },
  {
    id: "facebook",
    name: "Facebook",
    short: "FB",
    setupUrl: "https://developers.facebook.com/docs/video-api/guides/publishing/?locale=en_US",
    setupLabel: "Facebook video publishing guide",
    note: "Create a Meta app and authorize a Facebook Page with the required publishing permissions and Page access token.",
    defaultFormat: "vertical",
  },
  {
    id: "x",
    name: "X / Twitter",
    short: "X",
    setupUrl: "https://github.com/xdevplatform/docs/blob/HEAD/fundamentals/developer-apps.mdx",
    setupLabel: "X developer app guide",
    note: "Create an X developer app, then use user-context OAuth. App-only credentials cannot publish for an account.",
    defaultFormat: "landscape",
  },
  {
    id: "bluesky",
    name: "Bluesky",
    short: "BS",
    setupUrl: "https://bsky.app/settings/app-passwords",
    setupLabel: "Bluesky app passwords",
    note: "Create a dedicated app password and pair it with your handle. Never enter your main Bluesky password here.",
    defaultFormat: "square",
  },
  {
    id: "instagram",
    name: "Instagram",
    short: "IG",
    setupUrl: "https://developers.facebook.com/documentation/instagram-platform/overview",
    setupLabel: "Instagram Platform overview",
    note: "Use a professional account and a Meta app. Publishing requires the correct login flow, permissions, and access token.",
    defaultFormat: "vertical",
  },
];

const socialFormatCopy: Record<SocialFormat, { label: string; ratio: string; width: number; height: number }> = {
  vertical: { label: "Vertical 9:16", ratio: "9 / 16", width: 720, height: 1280 },
  square: { label: "Square 1:1", ratio: "1 / 1", width: 1080, height: 1080 },
  landscape: { label: "Landscape 16:9", ratio: "16 / 9", width: 1280, height: 720 },
};

function trackGlyph(kind: TimelineTrackKind): string {
  return kind === "video" ? "V" : kind === "audio" ? "A" : kind === "text" ? "T" : kind === "graphic" ? "G" : "FX";
}

function formatBytes(value: number): string {
  if (value < 1_000_000) return `${Math.max(0, value / 1_000).toFixed(value < 10_000 ? 1 : 0)} KB`;
  if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(value < 10_000_000 ? 1 : 0)} MB`;
  return `${(value / 1_000_000_000).toFixed(1)} GB`;
}

function formatDuration(value: number): string {
  if (!Number.isFinite(value)) return "0:00";
  const total = Math.max(0, Math.round(value));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function safeDownloadName(name: string, format: SocialFormat): string {
  const stem = name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "cine-edit";
  const suffix = format === "vertical" ? "9x16" : format === "square" ? "1x1" : "16x9";
  return `${stem}-${suffix}-edit.webm`;
}

async function blobToBase64(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The clip could not be read."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const separator = result.indexOf(",");
      if (separator < 0) reject(new Error("The clip could not be encoded."));
      else resolve(result.slice(separator + 1));
    };
    reader.readAsDataURL(blob);
  });
}

const CINE_CHUNK_BYTES = 5_242_880;
const CHUNKED_UPLOAD_THRESHOLD_BYTES = 50_000_000;
const CHUNKED_UPLOAD_STORAGE_KEY = "pix.cine.chunkedUpload";

type ChunkedUploadRecord = {
  uploadId: string;
  name: string;
  size: number;
  lastModified: number;
  durationSeconds: number;
  kind: "source" | "export";
};

function readChunkedUploadRecord(): ChunkedUploadRecord | null {
  try {
    const raw = window.localStorage.getItem(CHUNKED_UPLOAD_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Partial<ChunkedUploadRecord>;
    if (
      typeof record.uploadId !== "string" || !record.uploadId
      || typeof record.name !== "string"
      || typeof record.size !== "number"
      || typeof record.lastModified !== "number"
      || typeof record.durationSeconds !== "number"
      || (record.kind !== "source" && record.kind !== "export")
    ) return null;
    return record as ChunkedUploadRecord;
  } catch {
    return null;
  }
}

function writeChunkedUploadRecord(record: ChunkedUploadRecord) {
  try {
    window.localStorage.setItem(CHUNKED_UPLOAD_STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage can be unavailable (private mode); in-session resume still works.
  }
}

function clearChunkedUploadRecord() {
  try {
    window.localStorage.removeItem(CHUNKED_UPLOAD_STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

function drawVideoCover(context: CanvasRenderingContext2D, video: HTMLVideoElement, width: number, height: number) {
  const sourceWidth = Math.max(1, video.videoWidth);
  const sourceHeight = Math.max(1, video.videoHeight);
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.fillStyle = "#000";
  context.fillRect(0, 0, width, height);
  context.drawImage(video, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

// FILTERS by STITCH — the STITCH tool's look book, mirrored 1:1. STITCH
// renders these as ffmpeg chains; here the same looks run as CSS/canvas
// filters so they preview live and bake into CINE's canvas exports.
type StitchLook = { id: string; label: string; css: string; flicker?: boolean; grain?: boolean; vignette?: boolean };
const STITCH_LOOKS: StitchLook[] = [
  { id: "clean", label: "Clean", css: "" },
  { id: "vivid", label: "Vivid", css: "saturate(1.5) contrast(1.15) brightness(1.03)" },
  { id: "warm", label: "Warm", css: "sepia(0.32) saturate(1.15) hue-rotate(-12deg) brightness(1.03)" },
  { id: "cool", label: "Cool", css: "saturate(1.08) hue-rotate(14deg) brightness(0.98)" },
  { id: "sepia", label: "Sepia", css: "sepia(1) contrast(1.05)" },
  { id: "bw", label: "B&W", css: "grayscale(1)" },
  { id: "noir", label: "Noir", css: "grayscale(1) contrast(1.35) brightness(0.96)", vignette: true },
  { id: "dream", label: "Dream", css: "brightness(1.06) contrast(0.9) saturate(1.2) blur(1px)" },
  { id: "vintage", label: "Vintage", css: "sepia(0.55) contrast(0.92) brightness(1.05) saturate(0.75)", grain: true, vignette: true },
  { id: "vhs", label: "VHS", css: "saturate(1.3) contrast(1.05)", grain: true },
  { id: "classic", label: "Classic", css: "grayscale(1) contrast(1.12) brightness(1.02)", flicker: true, grain: true, vignette: true },
];

function stitchLookById(id: string): StitchLook {
  return STITCH_LOOKS.find((look) => look.id === id) ?? { id: "clean", label: "Clean", css: "" };
}

// The CSS filter for a look at time t. Flicker adds the same beating
// brightness/contrast modulation as STITCH's ffmpeg eq chain.
function stitchFilterCss(lookId: string, flicker: boolean, t: number): string {
  const look = stitchLookById(lookId);
  const parts: string[] = look.css ? [look.css] : [];
  if (flicker) {
    const b = 1 + 0.05 * Math.sin(2 * Math.PI * 7 * t) + 0.03 * Math.sin(2 * Math.PI * 13.7 * t);
    const c = 1 + 0.04 * Math.sin(2 * Math.PI * 11.3 * t);
    parts.push(`brightness(${b.toFixed(3)}) contrast(${c.toFixed(3)})`);
  }
  return parts.join(" ");
}

let filmNoiseCanvas: HTMLCanvasElement | null = null;
function getFilmNoiseCanvas(): HTMLCanvasElement {
  if (filmNoiseCanvas) return filmNoiseCanvas;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const image = ctx.createImageData(256, 256);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }
  filmNoiseCanvas = canvas;
  return canvas;
}

function drawFilmGrain(context: CanvasRenderingContext2D, width: number, height: number) {
  const pattern = context.createPattern(getFilmNoiseCanvas(), "repeat");
  if (!pattern) return;
  context.save();
  context.globalAlpha = 0.09;
  context.globalCompositeOperation = "overlay";
  const dx = -Math.floor(Math.random() * 256);
  const dy = -Math.floor(Math.random() * 256);
  context.translate(dx, dy);
  context.fillStyle = pattern;
  context.fillRect(-dx, -dy, width + 256, height + 256);
  context.restore();
}

function drawFilmVignette(context: CanvasRenderingContext2D, width: number, height: number) {
  const radius = Math.hypot(width, height) / 2;
  const gradient = context.createRadialGradient(width / 2, height / 2, radius * 0.52, width / 2, height / 2, radius);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.55)");
  context.save();
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  await new Promise<void>((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.03) {
      resolve();
      return;
    }
    const done = () => {
      video.removeEventListener("seeked", done);
      resolve();
    };
    video.addEventListener("seeked", done);
    video.currentTime = time;
  });
}

// iOS Safari has no HTMLVideoElement.captureStream(), so export audio is
// routed through Web Audio instead. A media element can only ever be bound
// to one MediaElementSourceNode, so the graph is built once per element and
// reused across exports; its tracks are shared and must not be stopped.
let webAudioGraph: {
  video: HTMLVideoElement;
  context: AudioContext;
  destination: MediaStreamAudioDestinationNode;
} | null = null;

function webAudioDestinationFor(video: HTMLVideoElement): MediaStreamAudioDestinationNode | null {
  try {
    const AudioContextCtor = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!webAudioGraph || webAudioGraph.video !== video) {
      const context = new AudioContextCtor();
      const source = context.createMediaElementSource(video);
      const destination = context.createMediaStreamDestination();
      source.connect(destination);
      // Keep the element audible while the export renders in real time.
      source.connect(context.destination);
      webAudioGraph = { video, context, destination };
    }
    if (webAudioGraph.context.state === "suspended") {
      void webAudioGraph.context.resume().catch(() => undefined);
    }
    return webAudioGraph.destination;
  } catch {
    return null;
  }
}

async function createVideoFilmstrip(sourceUrl: string, frameCount = 10): Promise<{ duration: number; frames: string[] }> {
  const video = document.createElement("video");
  video.muted = true;
  video.preload = "metadata";
  video.playsInline = true;
  video.src = sourceUrl;
  await new Promise<void>((resolve, reject) => {
    const loaded = () => { cleanup(); resolve(); };
    const failed = () => { cleanup(); reject(new Error("Video preview could not be read.")); };
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", loaded);
      video.removeEventListener("error", failed);
    };
    video.addEventListener("loadedmetadata", loaded);
    video.addEventListener("error", failed);
  });
  const clipDuration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 90;
  const context = canvas.getContext("2d");
  if (!context || clipDuration <= 0 || video.videoWidth <= 0 || video.videoHeight <= 0) {
    video.removeAttribute("src");
    video.load();
    return { duration: clipDuration, frames: [] };
  }
  const frames: string[] = [];
  for (let index = 0; index < frameCount; index += 1) {
    const time = Math.min(Math.max(0, clipDuration - 0.04), ((index + 0.5) / frameCount) * clipDuration);
    await seekVideo(video, time);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL("image/jpeg", 0.72));
  }
  video.removeAttribute("src");
  video.load();
  return { duration: clipDuration, frames };
}

function CineSection() {
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [videoSnap, setVideoSnap] = useState<VideoSnap>("width");
  const [verticalFloat, setVerticalFloat] = useState<VerticalFloat>("center");
  const [binView, setBinView] = useState<BinView>("icons");
  const [selectedBinAssetId, setSelectedBinAssetId] = useState<number | null>(null);
  // BIN clip awaiting delete confirmation (the confirm step renders
  // inside the BIN panel; nothing is deleted until it is confirmed).
  const [binDeleteAsset, setBinDeleteAsset] = useState<CineAsset | null>(null);
  // Pointer-drag of a BIN clip toward the timeline: the ghost chip that
  // follows the pointer, and whether the pointer is over the timeline
  // stack (its drop target) right now.
  const [binDragGhost, setBinDragGhost] = useState<{ name: string; x: number; y: number } | null>(null);
  const [binDropActive, setBinDropActive] = useState(false);
  const trackStackRef = useRef<HTMLDivElement | null>(null);
  // BIN pop-out: docked in a tool column (its home column is remembered)
  // or floating in a draggable window over the editor. The placement is
  // saved per user on the profile (cine_bin_dock) and restored on load.
  const [binFloating, setBinFloating] = useState(false);
  const [binFloatPos, setBinFloatPos] = useState({ x: 24, y: 96 });
  const [binHomeColumn, setBinHomeColumn] = useState<CineToolColumn>("left");
  const [binDockHint, setBinDockHint] = useState<CineToolColumn | null>(null);
  const builderGridRef = useRef<HTMLDivElement | null>(null);
  const [popOutActive, setPopOutActive] = useState(false);
  const [popOutHelpVisible, setPopOutHelpVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [chunkedResume, setChunkedResume] = useState<{ name: string } | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [timelineTracks, setTimelineTracks] = useState<TimelineTrack[]>([]);
  const [baseThumbnails, setBaseThumbnails] = useState<string[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [audioPickerOpen, setAudioPickerOpen] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const [helpBubblesEnabled, setHelpBubblesEnabled] = useHelpBubblesPreference();
  const [helpBubbleVisible, setHelpBubbleVisible] = useState(false);
  const [helpBubbleConfirm, setHelpBubbleConfirm] = useState(false);
  const [channelHelpVisible, setChannelHelpVisible] = useState(false);
  const [toolLayout, setToolLayout] = useState<CineToolLayout>(defaultCineToolLayout);
  const [collapsedColumns, setCollapsedColumns] = useState({ left: false, right: false });
  const [fullFrame, setFullFrame] = useState(false);
  const [draggedTool, setDraggedTool] = useState<CineToolId | null>(null);
  // Column currently hovered by a tool-panel drag: highlighted as the drop
  // target so the user can see the move will land there.
  const [dragTargetColumn, setDragTargetColumn] = useState<CineToolColumn | null>(null);
  // dragenter/dragleave fire per child element; count depth per column so
  // moving across a panel inside the column does not flicker the highlight.
  const dragColumnDepth = useRef<Record<CineToolColumn, number>>({ left: 0, center: 0, right: 0 });
  const [collapsedTools, setCollapsedTools] = useState<Set<CineToolId>>(() => new Set());
  const [hiddenTools, setHiddenTools] = useState<Set<CineToolId>>(() => new Set());
  const [operationHelp, setOperationHelp] = useState<CineToolId | null>(null);
  const helpBubbleTimer = useRef<number | null>(null);
  const timelineUrls = useRef(new Set<string>());
  const mediaNodes = useRef(new Map<string, HTMLMediaElement>());
  const workspace = useQuery({ queryKey: ["cine-workspace"], queryFn: () => api.getCineWorkspace({}) });
  const classicLibrary = useQuery({ queryKey: ["pix-classic-features"], queryFn: () => api.listPixClassicFilms({}) });
  const [selectedClassicFilmKey, setSelectedClassicFilmKey] = useState("");
  const [classicFilmSearch, setClassicFilmSearch] = useState("");
  const socialProfile = useQuery({ queryKey: ["cine-social-profile"], queryFn: () => api.getCineSocialProfile({}) });
  const [socialFormat, setSocialFormat] = useState<SocialFormat>("vertical");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [accountLabels, setAccountLabels] = useState<Record<SocialPlatform, string>>({
    tiktok: "", youtube: "", facebook: "", x: "", bluesky: "", instagram: "",
  });
  const [distributorBlurbs, setDistributorBlurbs] = useState<Record<SocialPlatform, string>>({
    tiktok: "", youtube: "", facebook: "", x: "", bluesky: "", instagram: "",
  });
  const [binDisplayUrl, setBinDisplayUrl] = useState<string | null>(null);
  const [stitchSlideSeconds, setStitchSlideSeconds] = useState(3);
  const [stitchMusicTitle, setStitchMusicTitle] = useState("");
  const [stitchStatus, setStitchStatus] = useState("");
  const [publishMessage, setPublishMessage] = useState("");
  // FILTERS by STITCH: one look at a time, with flicker / grain / vignette
  // as stackable overlays (some looks bundle their own — see STITCH_LOOKS).
  // The panel's open state is the shared tool collapse state; a #cine/filters
  // deep link opens it via followCinePanelLink below.
  const [stitchLookId, setStitchLookId] = useState("clean");
  const [fxFlicker, setFxFlicker] = useState(false);
  const [fxGrain, setFxGrain] = useState(false);
  const [fxVignette, setFxVignette] = useState(false);
  const activeLook = stitchLookById(stitchLookId);
  const flickerOn = fxFlicker || !!activeLook.flicker;
  const grainOn = fxGrain || !!activeLook.grain;
  const vignetteOn = fxVignette || !!activeLook.vignette;
  // Drive the preview video's CSS filter. Flicker needs a per-frame update;
  // every other look is set once per change.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!flickerOn) {
      video.style.filter = stitchFilterCss(stitchLookId, false, 0);
      return;
    }
    let raf = 0;
    const tick = () => {
      video.style.filter = stitchFilterCss(stitchLookId, true, video.currentTime);
      raf = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(raf);
  }, [stitchLookId, flickerOn, localUrl]);
  const addClipToBin = useMutation({
    mutationFn: (input: { film_key: string; segment_number: number }) => api.addPixClassicClipToBin(input),
    onSuccess: async (result) => {
      if (result.ok) {
        setStatus("Clip added to your BIN from PIX Library.");
        await queryClient.invalidateQueries({ queryKey: ["cine-workspace"] });
      } else {
        setStatus(result.error);
      }
    },
    onError: () => setStatus("That clip could not be added to your BIN."),
  });
  const saveDestination = useMutation({
    mutationFn: (input: { platform: SocialPlatform; account_label: string; format: SocialFormat; enabled: boolean }) => api.saveCineSocialDestination(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cine-social-profile"] });
      setPublishMessage("Destination profile saved. Secret credentials stay in secure server configuration.");
    },
    onError: () => setPublishMessage("The destination profile could not be saved."),
  });
  const prepareSocialPublish = useMutation({
    mutationFn: () => api.prepareCineSocialPublish({ platforms: selectedPlatforms }),
    onSuccess: (result) => {
      const readyCount = result.results.filter((item) => item.status === "connector_required").length;
      const missingCount = result.results.length - readyCount;
      setPublishMessage(`${result.results.length} destination${result.results.length === 1 ? "" : "s"} checked. ${missingCount} need server credentials; ${readyCount} have credentials but still need an authorized publishing connector. No posts were sent.`);
    },
    onError: () => setPublishMessage("CINE could not check the selected destinations. No posts were sent."),
  });

  useEffect(() => {
    if (!socialProfile.data) return;
    setAccountLabels((current) => {
      const next = { ...current };
      for (const destination of socialProfile.data.destinations) next[destination.platform] = destination.account_label;
      return next;
    });
    setSelectedPlatforms(socialProfile.data.destinations.filter((destination) => destination.enabled).map((destination) => destination.platform));
  }, [socialProfile.data]);

  useEffect(() => {
    function followCinePanelLink() {
      const panel = itemFromHash(window.location.hash, "cine");
      if (!panel || !["timeline", "filters", "distributor", "library", "pix-library", "storage"].includes(panel)) return;
      if (["filters", "distributor", "library", "pix-library", "storage"].includes(panel)) {
        setCollapsedTools((current) => {
          const next = new Set(current);
          next.delete(panel as CineToolId);
          return next;
        });
        setHiddenTools((current) => {
          const next = new Set(current);
          next.delete(panel as CineToolId);
          return next;
        });
      }
      window.requestAnimationFrame(() => document.getElementById(`cine-${panel}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    followCinePanelLink();
    window.addEventListener("hashchange", followCinePanelLink);
    return () => window.removeEventListener("hashchange", followCinePanelLink);
  }, []);

  useEffect(() => () => {
    if (localUrl) URL.revokeObjectURL(localUrl);
  }, [localUrl]);

  useEffect(() => () => {
    timelineUrls.current.forEach((url) => URL.revokeObjectURL(url));
    timelineUrls.current.clear();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!localUrl || duration <= 0) {
      setBaseThumbnails([]);
      return () => { cancelled = true; };
    }
    void createVideoFilmstrip(localUrl).then(({ frames }) => {
      if (!cancelled) setBaseThumbnails(frames);
    }).catch(() => {
      if (!cancelled) setBaseThumbnails([]);
    });
    return () => { cancelled = true; };
  }, [localUrl, duration]);

  useEffect(() => () => {
    if (helpBubbleTimer.current !== null) window.clearTimeout(helpBubbleTimer.current);
  }, []);

  useEffect(() => {
    if (!helpBubblesEnabled) {
      setHelpBubbleVisible(false);
      setHelpBubbleConfirm(false);
    }
  }, [helpBubblesEnabled]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const entered = () => setPopOutActive(true);
    const left = () => setPopOutActive(false);
    video.addEventListener("enterpictureinpicture", entered);
    video.addEventListener("leavepictureinpicture", left);
    return () => {
      video.removeEventListener("enterpictureinpicture", entered);
      video.removeEventListener("leavepictureinpicture", left);
    };
  }, [localUrl]);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("cine_checkout");
    if (!sessionId) return;
    api.verifyCineCheckout({ session_id: sessionId }).then(async (result) => {
      setStatus(result.upgraded ? "Payment confirmed. Your storage allowance is updated." : result.error ?? "Payment is still processing.");
      await queryClient.invalidateQueries({ queryKey: ["cine-workspace"] });
    }).catch(() => setStatus("Payment verification could not be completed."));
  }, [queryClient]);

  const removeAsset = useMutation({
    mutationFn: (asset: CineAsset) => api.deleteCineAsset({ asset_id: asset.id }),
    onSuccess: async (result) => {
      setStatus(result.deleted ? "Clip removed from Storage." : result.error ?? "The clip could not be removed.");
      await queryClient.invalidateQueries({ queryKey: ["cine-workspace"] });
    },
  });

  // BIN delete, confirmed: removes the asset row AND its stored file
  // (deleteCineAsset deletes the blob/B2 object server-side), so the
  // storage meter drops as soon as the workspace query refetches. If
  // the clip is loaded in the display, the display clears with it.
  function confirmDeleteBinAsset() {
    if (!binDeleteAsset) return;
    const asset = binDeleteAsset;
    setBinDeleteAsset(null);
    if (selectedBinAssetId === asset.id) setSelectedBinAssetId(null);
    if (asset.preview_url && binDisplayUrl === asset.preview_url) setBinDisplayUrl(null);
    removeAsset.mutate(asset);
  }

  // ---- BIN pop-out / docking ----------------------------------------
  const binDockQuery = useQuery({ queryKey: ["cine-bin-dock"], queryFn: () => api.getCineBinDockState({}) });
  const saveBinDock = useMutation({
    mutationFn: (state: { mode: "docked" | "floating"; column: CineToolColumn; x: number; y: number }) => api.saveCineBinDockState(state),
    onSuccess: (data) => { queryClient.setQueryData(["cine-bin-dock"], data); },
  });
  const binDockAppliedRef = useRef(false);

  // Restore the saved placement once, when it first loads: docked →
  // move the BIN tool into the saved column; floating → reopen the
  // floating window at the saved position.
  useEffect(() => {
    if (!binDockQuery.data || binDockAppliedRef.current) return;
    binDockAppliedRef.current = true;
    const saved = binDockQuery.data;
    setBinHomeColumn(saved.column);
    if (saved.mode === "floating") {
      setBinFloatPos({ x: saved.x, y: saved.y });
      setBinFloating(true);
      setHiddenTools((current) => { const next = new Set(current); next.delete("bin"); return next; });
      setCollapsedTools((current) => { const next = new Set(current); next.delete("bin"); return next; });
    } else {
      moveTool("bin", saved.column);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [binDockQuery.data]);

  function revealBin() {
    setHiddenTools((current) => { const next = new Set(current); next.delete("bin"); return next; });
    setCollapsedTools((current) => { const next = new Set(current); next.delete("bin"); return next; });
  }

  function dockBin(column: CineToolColumn) {
    setBinFloating(false);
    setBinDockHint(null);
    setBinHomeColumn(column);
    moveTool("bin", column);
    revealBin();
    if (column === "left") setCollapsedColumns((current) => ({ ...current, left: false }));
    if (column === "right") setCollapsedColumns((current) => ({ ...current, right: false }));
    saveBinDock.mutate({ mode: "docked", column, x: binFloatPos.x, y: binFloatPos.y });
    setStatus(`BIN docked in the ${column} column.`);
  }

  function popOutBin() {
    const frame = document.querySelector(".cine-tool-bin");
    const rect = frame?.getBoundingClientRect();
    const width = Math.min(400, window.innerWidth - 16);
    const x = Math.max(8, Math.min(rect ? rect.left : 24, Math.max(8, window.innerWidth - width - 8)));
    const y = Math.max(8, Math.min(rect ? rect.top : 96, Math.max(8, window.innerHeight - 140)));
    setBinFloatPos({ x, y });
    setBinFloating(true);
    revealBin();
    saveBinDock.mutate({ mode: "floating", column: binHomeColumn, x, y });
    setStatus("BIN popped out — drag its title bar to move it, or drag it over a column to dock.");
  }

  const binFloatDragRef = useRef<{ pointerId: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);

  function beginBinFloatDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* capture is best-effort */ }
    binFloatDragRef.current = { pointerId: event.pointerId, offsetX: event.clientX - binFloatPos.x, offsetY: event.clientY - binFloatPos.y, moved: false };
  }

  function moveBinFloatDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = binFloatDragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.moved = true;
    const x = Math.max(0, Math.min(event.clientX - drag.offsetX, Math.max(0, window.innerWidth - 80)));
    const y = Math.max(0, Math.min(event.clientY - drag.offsetY, Math.max(0, window.innerHeight - 56)));
    setBinFloatPos({ x, y });
    // Dock hint: whichever third of the builder grid the pointer is in
    // lights up as the snap target.
    const grid = builderGridRef.current;
    if (grid) {
      const rect = grid.getBoundingClientRect();
      if (pointInRect(event.clientX, event.clientY, rect)) {
        const third = (event.clientX - rect.left) / Math.max(1, rect.width);
        setBinDockHint(third < 1 / 3 ? "left" : third < 2 / 3 ? "center" : "right");
      } else {
        setBinDockHint(null);
      }
    }
  }

  function endBinFloatDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = binFloatDragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    binFloatDragRef.current = null;
    if (binDockHint) {
      dockBin(binDockHint);
      return;
    }
    setBinDockHint(null);
    if (drag.moved) {
      saveBinDock.mutate({ mode: "floating", column: binHomeColumn, x: binFloatPos.x, y: binFloatPos.y });
    }
  }

  const checkout = useMutation({
    mutationFn: () => api.createCineCheckout({}),
    onSuccess: (result) => {
      if (result.ok) {
        setCheckoutUrl(result.checkout_url);
        setStatus("Checkout is ready in a secure Stripe page.");
      } else {
        setStatus(result.error);
      }
    },
    onError: () => setStatus("Stripe checkout could not be prepared."),
  });

  function chooseFile(nextFile: File | null) {
    if (!nextFile) return;
    const allowance = workspace.data?.quota_bytes ?? 500_000_000;
    const used = workspace.data?.used_bytes ?? 0;
    if (!nextFile.type.startsWith("video/")) {
      setStatus("Choose a video file.");
      return;
    }
    if (nextFile.size > allowance - used) {
      setStatus(`That file is larger than your remaining ${formatBytes(Math.max(0, allowance - used))}.`);
      return;
    }
    if (localUrl) URL.revokeObjectURL(localUrl);
    const nextUrl = URL.createObjectURL(nextFile);
    setFile(nextFile);
    setBinDisplayUrl(null);
    setLocalUrl(nextUrl);
    setDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setPlayhead(0);
    setSpeed(1);
    setMuted(false);
    setStatus("Clip loaded locally. Set the in and out points below.");
  }

  function addTimelineTrack(kind: TimelineTrackKind, options?: { file?: File; text?: string; label?: string; sourceUrl?: string; loop?: boolean; start?: number; end?: number; grabUrl?: string }) {
    const id = crypto.randomUUID();
    const objectUrl = options?.file ? URL.createObjectURL(options.file) : undefined;
    const sourceUrl = options?.sourceUrl ?? objectUrl;
    if (objectUrl) timelineUrls.current.add(objectUrl);
    const nextTrack: TimelineTrack = {
      id,
      kind,
      label: options?.label ?? options?.file?.name ?? (kind === "text" ? "New title" : kind === "animation" ? "Drift in" : `${trackNames[kind]} channel`),
      start: options?.start ?? 0,
      end: options?.end ?? Math.max(duration, 30),
      enabled: true,
      ...(sourceUrl ? { sourceUrl } : {}),
      ...(options?.loop ? { loop: true } : {}),
      // A registered screen grab (PIX Library clips) is the track's
      // strip visual — the same grab the library and BIN show — so no
      // frames need to be generated for this clip.
      ...(kind === "video" && options?.grabUrl ? { thumbnails: [options.grabUrl] } : {}),
      ...(kind === "text" ? { text: options?.text ?? "NEW TITLE" } : {}),
      ...(kind === "animation" ? { preset: "drift" as const } : {}),
    };
    setTimelineTracks((tracks) => [...tracks, nextTrack]);
    if (kind === "video" && sourceUrl && !options?.grabUrl) {
      void createVideoFilmstrip(sourceUrl).then(({ duration: clipDuration, frames }) => {
        setTimelineTracks((tracks) => tracks.map((track) => {
          if (track.id !== id) return track;
          return {
            ...track,
            thumbnails: frames,
            // Adopt the real clip length only while the clip is untouched —
            // never clobber a cut or trim the user already made.
            ...(clipDuration > 0 && track.start === 0 && (track.sourceStart ?? 0) === 0 ? { end: clipDuration } : {}),
          };
        }));
      }).catch(() => undefined);
    }
    setSelectedTrackId(id);
    setAudioPickerOpen(false);
    setChannelMenuOpen(false);
  }

  // AUTO STITCH: stills become a sequenced slideshow (optionally scored
  // with a built-in music loop template); mixed files merge back-to-back.
  function buildSlideshow(files: FileList | null) {
    if (!files || files.length === 0) return;
    const images = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) {
      setStitchStatus("Choose image files to stitch into a slideshow.");
      return;
    }
    const startAt = timelineTracks.reduce((max, track) => Math.max(max, track.end), 0);
    images.forEach((image, index) => {
      addTimelineTrack("graphic", {
        file: image,
        label: image.name,
        start: startAt + index * stitchSlideSeconds,
        end: startAt + (index + 1) * stitchSlideSeconds,
      });
    });
    const totalSeconds = images.length * stitchSlideSeconds;
    const loop = musicLoops.find((item) => item.title === stitchMusicTitle);
    if (loop) {
      addTimelineTrack("audio", {
        label: `${loop.title} (template music)`,
        sourceUrl: loop.sourceUrl,
        loop: true,
        start: startAt,
        end: startAt + totalSeconds,
      });
    }
    setStitchStatus(`Slideshow stitched: ${images.length} picture${images.length === 1 ? "" : "s"} · ${formatDuration(totalSeconds)}${loop ? ` · music: ${loop.title}` : ""}. It is on the timeline now.`);
  }

  function buildAutoMerge(files: FileList | null) {
    if (!files || files.length === 0) return;
    const items = Array.from(files).filter((file) => file.type.startsWith("video/") || file.type.startsWith("image/"));
    if (items.length === 0) {
      setStitchStatus("Choose video or image files to auto-merge.");
      return;
    }
    let cursor = timelineTracks.reduce((max, track) => Math.max(max, track.end), 0);
    for (const item of items) {
      const isVideo = item.type.startsWith("video/");
      const slot = isVideo ? 15 : stitchSlideSeconds;
      addTimelineTrack(isVideo ? "video" : "graphic", {
        file: item,
        label: item.name,
        start: cursor,
        end: cursor + slot,
      });
      cursor += slot;
    }
    setStitchStatus(`Auto-merge placed ${items.length} file${items.length === 1 ? "" : "s"} back-to-back on the timeline (videos get a 15s slot — trim edges to taste).`);
  }

  function loadBinAssetIntoDisplay(asset: CineAsset) {
    setSelectedBinAssetId(asset.id);
    if (asset.preview_url) {
      setBinDisplayUrl(asset.preview_url);
      setStatus(`${asset.name} loaded into the display.`);
    } else {
      setStatus(`${asset.name} has no preview to load into the display yet.`);
    }
  }

  // Place a BIN clip on the timeline. When the drop point is known
  // (clientX from either the HTML5 drop event or the pointer drag),
  // the clip starts at the timeline position under the pointer;
  // otherwise it starts at 0 like it always did. A clip with no
  // playable preview cannot be placed — say so instead of the old
  // silent no-op that made drops look broken.
  function addBinAssetToTimeline(asset: CineAsset, clientX?: number) {
    if (!asset.preview_url) {
      setStatus(`${asset.name} has no playable preview yet, so it can't be placed on the timeline.`);
      return;
    }
    let start: number | undefined;
    const stack = trackStackRef.current;
    if (stack && clientX !== undefined) {
      const lane = stack.querySelector<HTMLElement>(".cine-track-lane");
      const rect = lane?.getBoundingClientRect();
      if (rect && rect.width > 0) {
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        start = Math.round(ratio * projectDuration * 10) / 10;
      }
    }
    const at = start ?? 0;
    addTimelineTrack("video", { label: asset.name, sourceUrl: asset.preview_url, start: at, end: at + (asset.duration_seconds ?? 30), grabUrl: asset.thumbnail_url ?? undefined });
    setStatus(`${asset.name} dropped onto the timeline${start !== undefined ? ` at ${formatDuration(at)}` : ""}.`);
  }

  // Pointer-based BIN drag (the HTML5 drag below stays as a second
  // path): press a BIN clip and move — past a small threshold it
  // becomes a drag, a ghost chip follows the pointer, and releasing
  // over the timeline stack drops the clip at that spot. HTML5
  // drag-and-drop never fires at all for touch/pen pointers in the
  // webview, which is why the BIN→timeline drop felt dead; pointer
  // events are the same mechanism the (working) trim handles use.
  const binPointerDragRef = useRef<{ assetId: number; startX: number; startY: number; moved: boolean } | null>(null);
  const binClickSuppressRef = useRef(false);

  function pointInRect(x: number, y: number, rect: DOMRect): boolean {
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  function beginBinPointerDrag(event: ReactPointerEvent<HTMLElement>, asset: CineAsset) {
    binPointerDragRef.current = { assetId: asset.id, startX: event.clientX, startY: event.clientY, moved: false };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* capture is best-effort */ }
  }

  function moveBinPointerDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = binPointerDragRef.current;
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 7) return;
      drag.moved = true;
      const asset = workspace.data?.assets.find((item) => item.id === drag.assetId);
      if (asset) setBinDragGhost({ name: asset.name, x: event.clientX, y: event.clientY });
      return;
    }
    setBinDragGhost((ghost) => (ghost ? { name: ghost.name, x: event.clientX, y: event.clientY } : ghost));
    const stack = trackStackRef.current;
    setBinDropActive(Boolean(stack && pointInRect(event.clientX, event.clientY, stack.getBoundingClientRect())));
  }

  function endBinPointerDrag(event: ReactPointerEvent<HTMLElement>, commit: boolean) {
    const drag = binPointerDragRef.current;
    binPointerDragRef.current = null;
    setBinDragGhost(null);
    setBinDropActive(false);
    if (!drag?.moved) return;
    // The pointerup is followed by a click on the item — swallow it so
    // a drag doesn't also load the clip into the display.
    binClickSuppressRef.current = true;
    if (!commit) return;
    const asset = workspace.data?.assets.find((item) => item.id === drag.assetId);
    const stack = trackStackRef.current;
    if (asset && stack && pointInRect(event.clientX, event.clientY, stack.getBoundingClientRect())) {
      addBinAssetToTimeline(asset, event.clientX);
    }
  }

  function addMusicLoop(loop: MusicLoop) {
    addTimelineTrack("audio", {
      label: loop.title,
      sourceUrl: loop.sourceUrl,
      loop: true,
      end: Math.max(duration, 30),
    });
    setStatus(`${loop.title} added as an audio channel.`);
  }

  function addFileTrack(kind: "video" | "audio" | "graphic", nextFile: File | null) {
    if (!nextFile) return;
    const valid = kind === "video"
      ? nextFile.type.startsWith("video/")
      : kind === "audio"
        ? nextFile.type.startsWith("audio/")
        : nextFile.type.startsWith("image/");
    if (!valid) {
      setStatus(kind === "graphic" ? "Choose a JPEG, PNG, WebP, or GIF image." : `Choose an ${kind} file.`);
      return;
    }
    addTimelineTrack(kind, { file: nextFile });
    setStatus(`${trackNames[kind]} channel added and visible at the playhead.`);
  }

  function updateTimelineTrack(id: string, changes: Partial<TimelineTrack>) {
    setTimelineTracks((tracks) => tracks.map((track) => track.id === id ? { ...track, ...changes } : track));
  }

  function removeTimelineTrack(track: TimelineTrack) {
    if (track.sourceUrl && timelineUrls.current.has(track.sourceUrl)) {
      URL.revokeObjectURL(track.sourceUrl);
      timelineUrls.current.delete(track.sourceUrl);
    }
    mediaNodes.current.delete(track.id);
    setTimelineTracks((tracks) => tracks.filter((item) => item.id !== track.id));
    setSelectedTrackId(null);
    setStatus(`${track.label} track deleted from the timeline.`);
  }

  // Razor: split one clip into two at the playhead. The second half keeps
  // playing the same source moment via sourceStart, so the cut is seamless.
  function cutTrackAtPlayhead(track: TimelineTrack) {
    const cutAt = Math.round(playhead * 10) / 10;
    if (cutAt <= track.start + 0.09 || cutAt >= track.end - 0.09) {
      setStatus(`Move the playhead inside ${track.label} to cut it there.`);
      return;
    }
    const secondId = crypto.randomUUID();
    const second: TimelineTrack = {
      ...track,
      id: secondId,
      start: cutAt,
      sourceStart: (track.sourceStart ?? 0) + (cutAt - track.start),
    };
    setTimelineTracks((tracks) => {
      const index = tracks.findIndex((item) => item.id === track.id);
      const current = tracks[index];
      if (index < 0 || !current) return tracks;
      return [...tracks.slice(0, index), { ...current, end: cutAt }, second, ...tracks.slice(index + 1)];
    });
    setSelectedTrackId(secondId);
    setStatus(`Cut ${track.label} at ${formatDuration(cutAt)} — now two clips. Drag either edge to trim.`);
  }

  function cutAtPlayhead() {
    const selected = timelineTracks.find((track) => track.id === selectedTrackId);
    if (selected && playhead > selected.start + 0.09 && playhead < selected.end - 0.09) {
      cutTrackAtPlayhead(selected);
      return;
    }
    const crossing = timelineTracks.filter((track) => playhead > track.start + 0.09 && playhead < track.end - 0.09);
    if (crossing.length === 0) {
      setStatus("Nothing to cut — move the playhead over a clip first.");
      return;
    }
    for (const track of crossing) cutTrackAtPlayhead(track);
  }

  const trimDragRef = useRef<{
    trackId: string;
    edge: "start" | "end";
    startX: number;
    laneWidth: number;
    origStart: number;
    origEnd: number;
    origSourceStart: number;
    lastStart: number;
    lastEnd: number;
    moved: boolean;
  } | null>(null);
  const suppressClipClickRef = useRef(false);

  function beginTrim(event: ReactPointerEvent<HTMLSpanElement>, track: TimelineTrack, edge: "start" | "end") {
    event.preventDefault();
    event.stopPropagation();
    const lane = event.currentTarget.closest(".cine-track-lane");
    const laneWidth = lane?.getBoundingClientRect().width ?? 0;
    if (laneWidth <= 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    trimDragRef.current = {
      trackId: track.id,
      edge,
      startX: event.clientX,
      laneWidth,
      origStart: track.start,
      origEnd: track.end,
      origSourceStart: track.sourceStart ?? 0,
      lastStart: track.start,
      lastEnd: track.end,
      moved: false,
    };
    setSelectedTrackId(track.id);
  }

  function moveTrim(event: ReactPointerEvent<HTMLSpanElement>) {
    const drag = trimDragRef.current;
    if (!drag) return;
    const deltaSec = ((event.clientX - drag.startX) / drag.laneWidth) * projectDuration;
    if (Math.abs(event.clientX - drag.startX) > 3) drag.moved = true;
    if (drag.edge === "end") {
      const nextEnd = Math.round(Math.max(drag.origStart + 0.1, Math.min(projectDuration, drag.origEnd + deltaSec)) * 10) / 10;
      drag.lastEnd = nextEnd;
      updateTimelineTrack(drag.trackId, { end: nextEnd });
    } else {
      // The left edge can never pull the clip before its source begins.
      const minStart = Math.max(0, drag.origStart - drag.origSourceStart);
      const nextStart = Math.round(Math.max(minStart, Math.min(drag.origEnd - 0.1, drag.origStart + deltaSec)) * 10) / 10;
      drag.lastStart = nextStart;
      updateTimelineTrack(drag.trackId, {
        start: nextStart,
        sourceStart: Math.max(0, drag.origSourceStart + (nextStart - drag.origStart)),
      });
    }
  }

  function endTrim() {
    const drag = trimDragRef.current;
    trimDragRef.current = null;
    if (!drag || !drag.moved) return;
    suppressClipClickRef.current = true;
    const track = timelineTracks.find((item) => item.id === drag.trackId);
    setStatus(`${track?.label ?? "Clip"} trimmed to ${formatDuration(drag.lastStart)}–${formatDuration(drag.lastEnd)}.`);
  }

  // Clip MOVE drag — press the clip body (the edge handles keep their
  // own trim drags and stopPropagation, so a press that reaches the
  // body is a move) and drag: sideways repositions the clip in time,
  // keeping its length and source offset; dragging up or down over
  // another track's row reorders the tracks. Until now the clip body
  // had NO drag at all — click only selected/scrubbed — which is why
  // timeline clips felt glued down. Same pointer-event pattern as the
  // trims, so it works for mouse, pen, and touch alike.
  const moveDragRef = useRef<{
    trackId: string;
    pointerId: number;
    startX: number;
    startY: number;
    laneWidth: number;
    origStart: number;
    origEnd: number;
    lastStart: number;
    moved: boolean;
  } | null>(null);
  const [movingTrackId, setMovingTrackId] = useState<string | null>(null);

  function beginClipMove(event: ReactPointerEvent<HTMLButtonElement>, track: TimelineTrack) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const lane = event.currentTarget.closest(".cine-track-lane");
    const laneWidth = lane?.getBoundingClientRect().width ?? 0;
    if (laneWidth <= 0) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* capture is best-effort */ }
    moveDragRef.current = {
      trackId: track.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      laneWidth,
      origStart: track.start,
      origEnd: track.end,
      lastStart: track.start,
      moved: false,
    };
    setSelectedTrackId(track.id);
  }

  function moveClipDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = moveDragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      setMovingTrackId(drag.trackId);
    }
    const length = drag.origEnd - drag.origStart;
    const deltaSec = (dx / drag.laneWidth) * projectDuration;
    const nextStart = Math.round(Math.max(0, drag.origStart + deltaSec) * 10) / 10;
    if (nextStart !== drag.lastStart) {
      drag.lastStart = nextStart;
      updateTimelineTrack(drag.trackId, { start: nextStart, end: nextStart + length });
    }
    // Vertical travel: hovering another track's row moves this track
    // into that row's slot (live reorder).
    const stack = trackStackRef.current;
    if (stack) {
      const rows = stack.querySelectorAll<HTMLElement>("[data-track-row]");
      rows.forEach((row) => {
        const rect = row.getBoundingClientRect();
        if (event.clientY < rect.top || event.clientY > rect.bottom) return;
        const targetId = row.dataset.trackRow;
        if (!targetId || targetId === drag.trackId) return;
        setTimelineTracks((tracks) => {
          const from = tracks.findIndex((item) => item.id === drag.trackId);
          const to = tracks.findIndex((item) => item.id === targetId);
          if (from < 0 || to < 0 || from === to) return tracks;
          const next = [...tracks];
          const [movedTrack] = next.splice(from, 1);
          if (!movedTrack) return tracks;
          next.splice(to, 0, movedTrack);
          return next;
        });
      });
    }
  }

  function endClipMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const drag = moveDragRef.current;
    if (!drag || event.pointerId !== drag.pointerId) return;
    moveDragRef.current = null;
    setMovingTrackId(null);
    if (!drag.moved) return;
    suppressClipClickRef.current = true;
    const track = timelineTracks.find((item) => item.id === drag.trackId);
    setStatus(`${track?.label ?? "Clip"} moved — now starts at ${formatDuration(drag.lastStart)}.`);
  }

  function bindTimelineMedia(id: string, node: HTMLMediaElement | null) {
    if (node) mediaNodes.current.set(id, node);
    else mediaNodes.current.delete(id);
  }

  function syncTimelineMedia(time: number, playing: boolean) {
    for (const track of timelineTracks) {
      const node = mediaNodes.current.get(track.id);
      if (!node) continue;
      const activeNow = track.enabled && time >= track.start && time <= track.end;
      const relativeTime = (track.sourceStart ?? 0) + Math.max(0, time - track.start);
      const mediaTime = track.loop && Number.isFinite(node.duration) && node.duration > 0 ? relativeTime % node.duration : relativeTime;
      if (Math.abs(node.currentTime - mediaTime) > 0.18) node.currentTime = mediaTime;
      if (activeNow && playing) void node.play().catch(() => undefined);
      else node.pause();
    }
  }

  function scrubTimeline(value: number) {
    const next = Math.max(0, Math.min(value, projectDuration));
    setPlayhead(next);
    if (videoRef.current && duration) videoRef.current.currentTime = Math.min(next, duration);
    syncTimelineMedia(next, false);
  }

  async function togglePopOut() {
    const video = videoRef.current;
    if (!video) {
      setStatus("Choose a video before opening Pop Out.");
      return;
    }
    if (!document.pictureInPictureEnabled || typeof video.requestPictureInPicture !== "function") {
      setPopOutHelpVisible(true);
      return;
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.play();
        await video.requestPictureInPicture();
      }
    } catch {
      setPopOutHelpVisible(true);
    }
  }

  function showHelpBubble() {
    if (!helpBubblesEnabled) return;
    if (helpBubbleTimer.current !== null) window.clearTimeout(helpBubbleTimer.current);
    setHelpBubbleVisible(true);
    setHelpBubbleConfirm(false);
    helpBubbleTimer.current = window.setTimeout(() => {
      setHelpBubbleVisible(false);
      setHelpBubbleConfirm(false);
      helpBubbleTimer.current = null;
    }, 4_500);
  }

  function hideHelpBubble() {
    if (helpBubbleTimer.current !== null) window.clearTimeout(helpBubbleTimer.current);
    helpBubbleTimer.current = null;
    setHelpBubbleVisible(false);
    setHelpBubbleConfirm(false);
  }

  function moveTool(tool: CineToolId, column: CineToolColumn, before?: CineToolId) {
    setToolLayout((current) => {
      const next: CineToolLayout = {
        left: current.left.filter((item) => item !== tool),
        center: current.center.filter((item) => item !== tool),
        right: current.right.filter((item) => item !== tool),
      };
      const target = next[column];
      const targetIndex = before ? target.indexOf(before) : -1;
      if (targetIndex >= 0) target.splice(targetIndex, 0, tool);
      else target.push(tool);
      return next;
    });
  }

  function handleToolDrop(event: DragEvent<HTMLElement>, column: CineToolColumn, before?: CineToolId) {
    event.preventDefault();
    event.stopPropagation();
    const tool = draggedTool;
    dragColumnDepth.current = { left: 0, center: 0, right: 0 };
    setDragTargetColumn(null);
    if (!tool) return;
    moveTool(tool, column, before);
    setDraggedTool(null);
  }

  // Highlight a column while a dragged tool panel is over it. Only tool
  // drags count — BIN asset drags target the stage/timeline, not columns.
  function handleColumnDragEnter(event: DragEvent<HTMLElement>, column: CineToolColumn) {
    if (!draggedTool) return;
    event.preventDefault();
    dragColumnDepth.current[column] += 1;
    setDragTargetColumn(column);
  }

  function handleColumnDragOver(event: DragEvent<HTMLElement>, column: CineToolColumn) {
    event.preventDefault();
    if (draggedTool) setDragTargetColumn(column);
  }

  function handleColumnDragLeave(column: CineToolColumn) {
    dragColumnDepth.current[column] = Math.max(0, dragColumnDepth.current[column] - 1);
    if (dragColumnDepth.current[column] === 0) {
      setDragTargetColumn((current) => (current === column ? null : current));
    }
  }

  function endToolDrag() {
    dragColumnDepth.current = { left: 0, center: 0, right: 0 };
    setDragTargetColumn(null);
    setDraggedTool(null);
  }

  function renderToolFrame(id: CineToolId, column: CineToolColumn, children: ReactNode) {
    const collapsed = collapsedTools.has(id);
    const helpText = cineToolHelp[id];
    const operationId = ["filters", "distributor", "library", "pix-library", "storage"].includes(id) ? `cine-${id}` : undefined;
    return (
      <section
        id={operationId}
        className={`cine-tool cine-tool-${id} ${collapsed ? "is-collapsed" : ""}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => handleToolDrop(event, column, id)}
      >
        <header
          className="cine-tool-head"
          draggable
          onDragStart={(event) => {
            setDraggedTool(id);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", id);
          }}
          onDragEnd={endToolDrag}
        >
          <span className="cine-tool-grip" aria-hidden="true">⠿</span>
          {id === "timeline" && helpBubblesEnabled ? (
            <span className="cine-help-wrap" onMouseEnter={showHelpBubble} onMouseLeave={hideHelpBubble}>
              <button
                className="cine-tool-title-help"
                type="button"
                aria-label="Show timeline Help Bubble"
                aria-expanded={helpBubbleVisible}
                onFocus={showHelpBubble}
                onBlur={(event) => {
                  if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) hideHelpBubble();
                }}
              >TIMELINE</button>
              {helpBubbleVisible ? (
                <aside className="cine-help-bubble" role="dialog" aria-label="Timeline Help Bubble">
                  <div className="cine-help-bubble-head">
                    <strong>Help Bubble</strong>
                    <button type="button" aria-label="Turn off Help Bubbles" onClick={() => setHelpBubbleConfirm(true)}>×</button>
                  </div>
                  {helpBubbleConfirm ? (
                    <div className="cine-help-confirm">
                      <p>Would you like to turn off Help Bubbles?</p>
                      <div>
                        <button type="button" onClick={() => { setHelpBubblesEnabled(false); hideHelpBubble(); }}>Yes</button>
                        <button type="button" onClick={() => setHelpBubbleConfirm(false)}>No</button>
                      </div>
                      <small>Help Bubbles can be turned back on in Profile Settings.</small>
                    </div>
                  ) : <p>Layer video, audio, titles, graphics, transitions, effects.</p>}
                </aside>
              ) : null}
            </span>
          ) : helpText && helpBubblesEnabled ? (
            <span className="cine-help-wrap" onMouseEnter={() => setOperationHelp(id)} onMouseLeave={() => setOperationHelp(null)}>
              <button className="cine-tool-title-help" type="button" aria-label={`Show ${cineToolNames[id]} Help Bubble`} aria-expanded={operationHelp === id} onFocus={() => setOperationHelp(id)} onBlur={() => setOperationHelp(null)}>{cineToolNames[id]}</button>
              {operationHelp === id ? <aside className="cine-help-bubble cine-operation-help" role="tooltip"><strong>Help Bubble</strong><p>{helpText}</p></aside> : null}
            </span>
          ) : <strong>{cineToolNames[id]}</strong>}
          <span className="cine-tool-actions">
            {id === "bin" ? (
              <button className="cine-tool-popout" type="button" aria-label="Pop the BIN out into a floating window" title="Pop the BIN out into a floating window" onClick={popOutBin}>
                <span aria-hidden="true">⧉</span>
              </button>
            ) : null}
            <button className="cine-tool-collapse" type="button" aria-label={`${collapsed ? "Expand" : "Collapse"} ${cineToolNames[id]} tool`} aria-expanded={!collapsed} onClick={() => setCollapsedTools((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })}>{collapsed ? "+" : "−"}</button>
          </span>
        </header>
        {!collapsed ? <div className="cine-tool-body">{children}</div> : null}
      </section>
    );
  }

  async function uploadChunked(blob: Blob, name: string, roundedDuration: number, kind: "source" | "export") {
    const totalChunks = Math.ceil(blob.size / CINE_CHUNK_BYTES);
    const mimeType = blob.type.split(";", 1)[0]?.trim() || "video/webm";
    const lastModified = blob instanceof File ? blob.lastModified : 0;
    let uploadId: string | null = null;
    let received = new Set<number>();
    const saved = readChunkedUploadRecord();
    if (saved && saved.name === name && saved.size === blob.size && saved.lastModified === lastModified) {
      const status = await api.getChunkedUploadStatus({ upload_id: saved.uploadId });
      if (status.ok && status.status === "uploading" && status.total_chunks === totalChunks && status.total_size_bytes === blob.size) {
        uploadId = saved.uploadId;
        received = new Set(status.received_chunks);
      }
    }
    if (!uploadId) {
      const init = await api.initChunkedUpload({
        name,
        mime_type: mimeType,
        total_size_bytes: blob.size,
        total_chunks: totalChunks,
        duration_seconds: roundedDuration,
      });
      if (!init.ok) throw new Error(init.error);
      uploadId = init.upload_id;
      writeChunkedUploadRecord({ uploadId, name, size: blob.size, lastModified, durationSeconds: roundedDuration, kind });
    }
    setUploadProgress(Math.round((received.size / totalChunks) * 100));
    for (let index = 0; index < totalChunks; index += 1) {
      if (received.has(index)) continue;
      const slice = blob.slice(index * CINE_CHUNK_BYTES, Math.min(blob.size, (index + 1) * CINE_CHUNK_BYTES));
      const dataBase64 = await blobToBase64(slice);
      const result = await api.uploadChunk({ upload_id: uploadId, chunk_index: index, data_base64: dataBase64 });
      if (!result.ok) throw new Error(result.error);
      received.add(index);
      setUploadProgress(Math.round((received.size / totalChunks) * 100));
    }
    const completed = await api.completeChunkedUpload({ upload_id: uploadId });
    if (!completed.ok) throw new Error(completed.error);
    clearChunkedUploadRecord();
    setChunkedResume(null);
    setSelectedBinAssetId(completed.asset_id);
    await queryClient.invalidateQueries({ queryKey: ["cine-workspace"] });
  }

  async function uploadToB2(blob: Blob, name: string, durationSeconds: number, kind: "source" | "export" = "source") {
    const roundedDuration = Math.ceil(durationSeconds);
    if (!Number.isFinite(roundedDuration) || roundedDuration <= 0) throw new Error("The clip duration could not be read.");
    if (kind === "export" && roundedDuration > 120) throw new Error("Finished edits for PIX Shorts and SHOWCASE can be no longer than 2 minutes. Shorten the selection before exporting.");
    if (blob.size > CHUNKED_UPLOAD_THRESHOLD_BYTES) {
      setUploadProgress(0);
      await uploadChunked(blob, name, roundedDuration, kind);
      setUploadProgress(100);
      return;
    }
    const quotaBytes = workspace.data?.quota_bytes ?? 500_000_000;
    if (blob.size > quotaBytes) throw new Error(kind === "export"
      ? `This export is larger than your ${formatBytes(quotaBytes)} storage allowance.`
      : `Source footage can be up to ${formatBytes(quotaBytes)} per file.`);
    setUploadProgress(10);
    const dataBase64 = await blobToBase64(blob);
    setUploadProgress(55);
    const mimeType = blob.type.split(";", 1)[0]?.trim() || "video/webm";
    const uploaded = await api.uploadCineAsset({
      name,
      mime_type: mimeType,
      size_bytes: blob.size,
      duration_seconds: roundedDuration,
      data_base64: dataBase64,
    });
    if (!uploaded.ok) throw new Error(uploaded.error);
    setUploadProgress(100);
    setSelectedBinAssetId(uploaded.asset_id);
    await queryClient.invalidateQueries({ queryKey: ["cine-workspace"] });
  }

  async function uploadSource() {
    if (!file) return;
    try {
      setStatus("Uploading source footage to Storage…");
      await uploadToB2(file, file.name, duration, "source");
      setStatus("Source clip saved to Storage.");
    } catch (error) {
      const saved = readChunkedUploadRecord();
      if (saved && saved.name === file.name && saved.size === file.size && saved.lastModified === file.lastModified) {
        setChunkedResume({ name: file.name });
        setStatus("The upload was interrupted. Your progress is saved — resume any time and only the missing pieces are sent.");
      } else {
        setStatus(error instanceof Error ? error.message : "The source clip could not be uploaded.");
      }
      setUploadProgress(null);
    }
  }

  async function resumeChunkedUpload() {
    if (!file) return;
    try {
      setStatus("Resuming upload — checking which pieces already arrived…");
      await uploadToB2(file, file.name, duration, "source");
      setStatus("Source clip saved to Storage.");
    } catch (error) {
      const saved = readChunkedUploadRecord();
      if (saved && saved.name === file.name && saved.size === file.size) {
        setChunkedResume({ name: file.name });
        setStatus("Still interrupted. Progress is saved — resume again when the connection is back.");
      } else {
        setChunkedResume(null);
        setStatus(error instanceof Error ? error.message : "The source clip could not be uploaded.");
      }
      setUploadProgress(null);
    }
  }

  async function exportEdit() {
    const video = videoRef.current;
    if (!video || !file || trimEnd <= trimStart) return;
    const capturable = video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream };
    const capture = capturable.captureStream ?? capturable.mozCaptureStream;
    const canvas = document.createElement("canvas");
    const format = socialFormatCopy[socialFormat];
    canvas.width = format.width;
    canvas.height = format.height;
    const context = canvas.getContext("2d");
    const canvasCapture = canvas.captureStream?.bind(canvas);
    if (!context || !canvasCapture || typeof MediaRecorder === "undefined") {
      setStatus("This browser cannot export formatted media streams. Use a current Chrome or Edge browser.");
      return;
    }
    let animationFrame = 0;
    // Tracks borrowed from the shared Web Audio graph stay alive for the
    // next export, so they are excluded from the cleanup stop() below.
    const borrowedTracks = new Set<MediaStreamTrack>();
    try {
      setStatus(`Rendering ${format.label} in real time — keep this tab open while the selection plays.`);
      await seekVideo(video, trimStart);
      video.playbackRate = speed;
      video.muted = muted;
      const outputStream = canvasCapture(30);
      if (!muted) {
        let audioTracks: MediaStreamTrack[] = [];
        if (capture) {
          try {
            audioTracks = capture.call(video).getAudioTracks();
          } catch {
            audioTracks = [];
          }
        }
        if (audioTracks.length === 0) {
          // iOS Safari path: pull the element's audio through Web Audio.
          const destination = webAudioDestinationFor(video);
          if (destination) {
            audioTracks = destination.stream.getAudioTracks();
            audioTracks.forEach((track) => borrowedTracks.add(track));
          }
        }
        // No audio source at all still exports — video only, never an error.
        audioTracks.forEach((track) => outputStream.addTrack(track));
      }
      const draw = () => {
        context.filter = stitchFilterCss(stitchLookId, flickerOn, video.currentTime) || "none";
        drawVideoCover(context, video, canvas.width, canvas.height);
        context.filter = "none";
        if (grainOn) drawFilmGrain(context, canvas.width, canvas.height);
        if (vignetteOn) drawFilmVignette(context, canvas.width, canvas.height);
        animationFrame = window.requestAnimationFrame(draw);
      };
      draw();
      const mimeType = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"]
        .find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
      const recorder = mimeType ? new MediaRecorder(outputStream, { mimeType }) : new MediaRecorder(outputStream);
      const chunks: BlobPart[] = [];
      const finished = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = () => reject(new Error("The browser render stopped unexpectedly."));
        recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || mimeType || "video/mp4" }));
      });
      const monitor = window.setInterval(() => {
        if (video.currentTime >= trimEnd || video.ended) {
          video.pause();
          window.clearInterval(monitor);
          if (recorder.state !== "inactive") recorder.stop();
        }
      }, 80);
      recorder.start(500);
      await video.play();
      const output = await finished;
      window.cancelAnimationFrame(animationFrame);
      outputStream.getTracks().forEach((track) => { if (!borrowedTracks.has(track)) track.stop(); });
      const outputName = safeDownloadName(file.name, socialFormat)
        .replace(/\.webm$/, output.type.includes("mp4") ? ".mp4" : ".webm");
      setStatus("Render complete. Saving the formatted edit to Storage…");
      await uploadToB2(output, outputName, (trimEnd - trimStart) / Math.max(speed, 0.1), "export");
      const objectUrl = URL.createObjectURL(output);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = outputName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
      setStatus(`${format.label} edit saved to Storage and downloaded to this device.`);
    } catch (error) {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      setStatus(error instanceof Error ? error.message : "The edit could not be exported.");
      setUploadProgress(null);
    }
  }

  const used = workspace.data?.used_bytes ?? 0;
  const quota = workspace.data?.quota_bytes ?? 500_000_000;
  const percent = quota > 0 ? Math.min(100, (used / quota) * 100) : 0;
  const projectDuration = Math.max(duration, 30, ...timelineTracks.map((track) => track.end));
  const selectedTrack = timelineTracks.find((track) => track.id === selectedTrackId) ?? null;
  const selectedBinAsset = workspace.data?.assets.find((asset) => asset.id === selectedBinAssetId) ?? workspace.data?.assets[0] ?? null;
  const pixLibraryAssets = (workspace.data?.assets ?? []).filter((asset) => asset.mime_type.startsWith("video/") && asset.duration_seconds !== null && asset.duration_seconds > 0 && asset.duration_seconds <= 120);
  const classicFilms = classicLibrary.data?.features ?? [];
  const sortedClassicFilms = [...classicFilms].sort((left, right) => left.title.localeCompare(right.title));
  const visibleClassicFilms = classicFilmSearch.trim() ? sortedClassicFilms.filter((film) => film.title.toLowerCase().includes(classicFilmSearch.trim().toLowerCase())) : sortedClassicFilms;
  const selectedClassicFilm = visibleClassicFilms.find((film) => film.film_key === selectedClassicFilmKey) ?? visibleClassicFilms[0] ?? null;
  const publicClipCount = classicFilms.reduce((count, film) => count + film.total_segments, 0);
  const binClipUrls = new Set((workspace.data?.assets ?? []).map((asset) => asset.preview_url).filter((url): url is string => Boolean(url)));
  const visibleTracks = timelineTracks.filter((track) => track.enabled && playhead >= track.start && playhead <= track.end);
  const activeAnimation = visibleTracks.find((track) => track.kind === "animation");
  const animationProgress = activeAnimation
    ? Math.max(0, Math.min(1, (playhead - activeAnimation.start) / Math.max(0.1, activeAnimation.end - activeAnimation.start)))
    : 1;
  const overlayStyle = activeAnimation?.preset === "spin"
    ? { transform: `rotate(${animationProgress * 360}deg) scale(${0.72 + animationProgress * 0.28})`, opacity: 1 }
    : activeAnimation?.preset === "pulse"
      ? { transform: `scale(${1 + Math.sin(animationProgress * Math.PI * 4) * 0.08})`, opacity: 1 }
      : activeAnimation
        ? { transform: `translateX(${(1 - animationProgress) * -18}%)`, opacity: animationProgress }
        : undefined;


  // The BIN's contents, shared verbatim by the docked tool panel and
  // the popped-out floating window — one body, two homes, so popping
  // out or docking never loses clips, selection, or the delete flow
  // (all of that state lives in CineSection, not in the body).
  function renderBinBody(): ReactNode {
    return (
      <>
        <div className="cine-bin-head">
          <p className="cine-overline">Uploaded content</p>
          <div className="cine-bin-views" role="group" aria-label="BIN view">
            <button type="button" className={binView === "icons" ? "active" : ""} aria-label="Icon view" onClick={() => setBinView("icons")}><span aria-hidden="true">▦</span><small>Icons</small></button>
            <button type="button" className={binView === "list" ? "active" : ""} aria-label="List view" onClick={() => setBinView("list")}><span aria-hidden="true">≡</span><small>List</small></button>
            <button type="button" className={binView === "tree" ? "active" : ""} aria-label="Explorer tree view" onClick={() => setBinView("tree")}><span aria-hidden="true">⌘</span><small>Explorer</small></button>
          </div>
        </div>
        {!workspace.data?.storage_ready ? (
          <p className="cine-bin-empty">Connect Storage to browse uploaded content in BIN.</p>
        ) : workspace.data.assets.length === 0 ? (
          <p className="cine-bin-empty">Uploaded source clips and exports will appear here.</p>
        ) : (
          <div className={`cine-bin-browser cine-bin-${binView}`}>
            {binView === "tree" ? (
              <div className="cine-bin-tree" role="tree" aria-label="CINE BIN explorer">
                <div className="cine-bin-tree-root" role="treeitem" aria-expanded="true"><span aria-hidden="true">▾</span><strong>CINE BIN</strong></div>
                <div role="group">
                  <div className="cine-bin-tree-root cine-bin-tree-folder" role="treeitem" aria-expanded="true"><span aria-hidden="true">▾</span><strong>Uploaded</strong><small>{workspace.data.assets.length}</small></div>
                  <div role="group">
                    {workspace.data.assets.map((asset) => (
                      <div key={asset.id} className={`cine-bin-tree-item ${selectedBinAsset?.id === asset.id ? "selected" : ""}`}>
                        <button role="treeitem" type="button" draggable className={selectedBinAsset?.id === asset.id ? "selected" : ""} title="Click to load into the display — or drag onto the display or timeline"
                          onDragStart={(event) => { event.dataTransfer.setData("text/pix-bin-asset", String(asset.id)); event.dataTransfer.effectAllowed = "copy"; }}
                          onPointerDown={(event) => beginBinPointerDrag(event, asset)}
                          onPointerMove={moveBinPointerDrag}
                          onPointerUp={(event) => endBinPointerDrag(event, true)}
                          onPointerCancel={(event) => endBinPointerDrag(event, false)}
                          onClick={() => { if (binClickSuppressRef.current) { binClickSuppressRef.current = false; return; } loadBinAssetIntoDisplay(asset); }}>
                          {asset.thumbnail_url ? <img className="cine-bin-tree-grab" src={asset.thumbnail_url} alt="" /> : <span aria-hidden="true">□</span>}<span><strong>{asset.name}</strong><small>{formatBytes(asset.size_bytes)}</small></span>
                        </button>
                        <button type="button" className="cine-bin-delete" aria-label={`Delete ${asset.name} from the BIN`} title={`Delete ${asset.name} from the BIN`} onClick={() => setBinDeleteAsset(asset)}>
                          <span aria-hidden="true">✕</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="cine-bin-items">
                {workspace.data.assets.map((asset) => (
                  <div key={asset.id} className={`cine-bin-item ${selectedBinAsset?.id === asset.id ? "selected" : ""}`}>
                    <button type="button" draggable className={selectedBinAsset?.id === asset.id ? "selected" : ""} title="Click to load into the display — or drag onto the display or timeline"
                      onDragStart={(event) => { event.dataTransfer.setData("text/pix-bin-asset", String(asset.id)); event.dataTransfer.effectAllowed = "copy"; }}
                      onPointerDown={(event) => beginBinPointerDrag(event, asset)}
                      onPointerMove={moveBinPointerDrag}
                      onPointerUp={(event) => endBinPointerDrag(event, true)}
                      onPointerCancel={(event) => endBinPointerDrag(event, false)}
                      onClick={() => { if (binClickSuppressRef.current) { binClickSuppressRef.current = false; return; } loadBinAssetIntoDisplay(asset); }}>
                      {asset.thumbnail_url ? (
                        <img className="cine-bin-media-grab" src={asset.thumbnail_url} alt="" />
                      ) : (
                        <span className="cine-bin-media-mark" aria-hidden="true">VID</span>
                      )}
                      <span className="cine-bin-item-copy"><strong>{asset.name}</strong><small>{formatBytes(asset.size_bytes)} · {formatDuration(asset.duration_seconds ?? 0)}</small></span>
                    </button>
                    <button type="button" className="cine-bin-delete" aria-label={`Delete ${asset.name} from the BIN`} title={`Delete ${asset.name} from the BIN`} onClick={() => setBinDeleteAsset(asset)}>
                      <span aria-hidden="true">✕</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {selectedBinAsset ? (
              <aside className="cine-bin-preview" aria-label={`BIN preview: ${selectedBinAsset.name}`}>
                {selectedBinAsset.preview_url ? <video key={selectedBinAsset.id} src={selectedBinAsset.preview_url} poster={selectedBinAsset.thumbnail_url ?? undefined} controls playsInline preload="metadata" /> : <div className="cine-bin-preview-unavailable">Preview unavailable</div>}
                <div><strong>{selectedBinAsset.name}</strong><small>{formatBytes(selectedBinAsset.size_bytes)} · uploaded {formatTimestamp(selectedBinAsset.created_at)}</small></div>
              </aside>
            ) : null}
          </div>
        )}
        {binDeleteAsset ? (
          <div className="cine-bin-delete-confirm" role="alertdialog" aria-labelledby="cine-bin-delete-title" aria-describedby="cine-bin-delete-copy">
            <strong id="cine-bin-delete-title">Delete {binDeleteAsset.name}?</strong>
            <p id="cine-bin-delete-copy">
              This removes the clip from your BIN and deletes its stored file, freeing {formatBytes(binDeleteAsset.size_bytes)} of storage. It can’t be undone.
              {binDeleteAsset.preview_url && timelineTracks.some((track) => track.sourceUrl === binDeleteAsset.preview_url) ? (
                <> Heads up: this clip is on the timeline, and timeline copies placed from the BIN play from this stored file — deleting it will break that timeline copy too.</>
              ) : null}
            </p>
            <div className="cine-bin-delete-actions">
              <button type="button" className="cine-bin-delete-confirm-button" disabled={removeAsset.isPending} onClick={confirmDeleteBinAsset}>
                {removeAsset.isPending ? "Deleting…" : "Delete clip"}
              </button>
              <button type="button" onClick={() => setBinDeleteAsset(null)}>Keep clip</button>
            </div>
            {removeAsset.isError ? <p className="form-error" role="alert">The clip couldn’t be deleted. Try again.</p> : null}
          </div>
        ) : null}
      </>
    );
  }

  function renderCineTool(tool: CineToolId, column: CineToolColumn): ReactNode {
    if (tool === "bin") return renderToolFrame("bin", column, renderBinBody());

    if (tool === "inout") return renderToolFrame("inout", column, (
      <>
        <div className="cine-panel-heading"><span>EDIT 01</span><strong>{file?.name ?? "No clip selected"}</strong></div>
        <div className="cine-control-group">
          <div className="cine-control-label"><label htmlFor="cine-in">In</label><output>{formatDuration(trimStart)}</output></div>
          <input id="cine-in" type="range" min="0" max={Math.max(duration, 0.1)} step="0.1" value={trimStart} disabled={!duration} onChange={(event) => {
            const value = Math.min(Number(event.target.value), Math.max(0, trimEnd - 0.1));
            setTrimStart(value);
            if (videoRef.current) videoRef.current.currentTime = value;
          }} />
        </div>
        <div className="cine-control-group">
          <div className="cine-control-label"><label htmlFor="cine-out">Out</label><output>{formatDuration(trimEnd)}</output></div>
          <input id="cine-out" type="range" min="0" max={Math.max(duration, 0.1)} step="0.1" value={trimEnd} disabled={!duration} onChange={(event) => {
            const value = Math.max(Number(event.target.value), Math.min(duration, trimStart + 0.1));
            setTrimEnd(value);
            if (videoRef.current) videoRef.current.currentTime = value;
          }} />
        </div>
        <div className="cine-control-group">
          <span className="cine-label">Speed</span>
          <div className="cine-segmented" role="group" aria-label="Playback speed">
            {[0.5, 1, 1.5, 2].map((value) => <button key={value} type="button" className={speed === value ? "active" : ""} onClick={() => setSpeed(value)}>{value}×</button>)}
          </div>
        </div>
      </>
    ));

    if (tool === "framing") return renderToolFrame("framing", column, (
      <>
        <div className="cine-control-group cine-control-group-first">
          <span className="cine-label">Frame format</span>
          <div className="cine-format-grid" role="group" aria-label="Export frame format">
            {(Object.keys(socialFormatCopy) as SocialFormat[]).map((formatKey) => (
              <button key={formatKey} type="button" className={socialFormat === formatKey ? "active" : ""} onClick={() => setSocialFormat(formatKey)}>
                <strong>{socialFormatCopy[formatKey].label}</strong><span>{socialFormatCopy[formatKey].width}×{socialFormatCopy[formatKey].height}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="cine-control-group">
          <span className="cine-label">Video snap</span>
          <div className="cine-snap-grid" role="group" aria-label="Snap video to frame">
            <button type="button" className={videoSnap === "width" ? "active" : ""} onClick={() => setVideoSnap("width")}>Fit width</button>
            <button type="button" className={videoSnap === "height" ? "active" : ""} onClick={() => setVideoSnap("height")}>Fill height</button>
            <button type="button" className={videoSnap === "fill" ? "active" : ""} onClick={() => setVideoSnap("fill")}>Fill frame</button>
          </div>
        </div>
        <div className="cine-control-group">
          <span className="cine-label">Snap position</span>
          <div className="cine-float-grid" role="group" aria-label={`${socialFormatCopy[socialFormat].label} video position`}>
            {(["top", "center", "bottom"] as VerticalFloat[]).map((position) => <button key={position} type="button" className={verticalFloat === position ? "active" : ""} onClick={() => setVerticalFloat(position)}>{position}</button>)}
          </div>
        </div>
        <label className="cine-toggle"><input type="checkbox" checked={muted} onChange={(event) => setMuted(event.target.checked)} /><span>Mute exported audio</span></label>
      </>
    ));

    if (tool === "export") return renderToolFrame("export", column, (
      <>
        <div className="cine-selection"><span>Selection</span><strong>{formatDuration(Math.max(0, trimEnd - trimStart))}</strong></div>
        <button className="primary-button cine-export" type="button" disabled={!file || !duration || trimEnd <= trimStart || !workspace.data?.storage_ready || uploadProgress !== null && uploadProgress < 100} onClick={exportEdit}>Export cut</button>
        <button className="secondary-button cine-source-upload" type="button" disabled={!file || !workspace.data?.storage_ready || uploadProgress !== null && uploadProgress < 100} onClick={uploadSource}>Save original</button>
        {uploadProgress !== null ? <div className="cine-upload-progress" aria-label={`Upload ${uploadProgress}%`}><span style={{ width: `${uploadProgress}%` }} /></div> : null}
        {chunkedResume && file ? <button className="secondary-button cine-resume-upload" type="button" onClick={resumeChunkedUpload}>Resume upload — {chunkedResume.name}</button> : null}
        {status ? <p className="cine-status-message" role="status">{status}</p> : null}
      </>
    ));

    if (tool === "distributor" && cineFeatureFlags.distributorPaywall && workspace.data?.plan !== "paid") return renderToolFrame("distributor", column, (
      <p className="empty-state">Distributor is part of the paid CINE plan. Upgrade storage to unlock publishing destinations.</p>
    ));

    if (tool === "distributor") return renderToolFrame("distributor", column, (
      <>
        <div className="cine-publisher-summary">
          <div><span>Master export</span><strong>{socialFormatCopy[socialFormat].label}</strong></div>
          <div><span>Latest cloud file</span><strong>{workspace.data?.assets[0]?.name ?? "Export a cut first"}</strong></div>
          <button type="button" className="primary-button" disabled={selectedPlatforms.length === 0 || !workspace.data?.assets.length || prepareSocialPublish.isPending} onClick={() => prepareSocialPublish.mutate()}>
            {prepareSocialPublish.isPending ? "Checking…" : `Check ${selectedPlatforms.length || ""} destination${selectedPlatforms.length === 1 ? "" : "s"}`}
          </button>
        </div>
        <p className="cine-publisher-trust">A provider response—not this button—is the only confirmation of a published post. Until authorized publishing connectors are configured, this control checks readiness and sends nothing.</p>
        {publishMessage ? <p className="cine-publish-result" role="status">{publishMessage}</p> : null}
        <div className="cine-destination-grid">
          {socialPlatforms.map((platform) => {
            const saved = socialProfile.data?.destinations.find((destination) => destination.platform === platform.id);
            const selected = selectedPlatforms.includes(platform.id);
            const selectedFormat = saved?.format ?? platform.defaultFormat;
            const spec = socialPlatformSpecs[platform.id];
            const blurb = distributorBlurbs[platform.id];
            return (
              <article className={`cine-destination ${selected ? "selected" : ""}`} key={platform.id}>
                <div className="cine-destination-brand" style={{ background: spec.brand }}>
                  <span className="cine-destination-logo" aria-hidden="true">{platform.short}</span>
                  <strong>{platform.name}</strong>
                  <small>{socialFormatCopy[selectedFormat].label}</small>
                </div>
                <div className="cine-destination-heading">
                  <span aria-hidden="true">{platform.short}</span>
                  <div><h3>{platform.name}</h3><small>{saved?.server_credentials_ready ? "Server credentials detected" : "Server credentials needed"}</small></div>
                  <label className="cine-destination-toggle"><input type="checkbox" checked={selected} aria-label={`Include ${platform.name} in single deploy`} onChange={(event) => { setSelectedPlatforms((current) => event.target.checked ? current.includes(platform.id) ? current : [...current, platform.id] : current.filter((item) => item !== platform.id)); if (event.target.checked) setSocialFormat(selectedFormat); }} /><span>Use</span></label>
                </div>
                <p>{platform.note}</p>
                <div className="cine-blurb">
                  <div className="cine-blurb-head">
                    <label htmlFor={`cine-blurb-${platform.id}`}>Text blurb</label>
                    <span className={`cine-blurb-count ${blurb.length > spec.blurbLimit ? "is-over" : ""}`} aria-label={`${blurb.length} of ${spec.blurbLimit} characters used for ${platform.name}`}>{blurb.length}/{spec.blurbLimit}</span>
                  </div>
                  <textarea
                    id={`cine-blurb-${platform.id}`}
                    value={blurb}
                    maxLength={spec.blurbLimit + 200}
                    rows={Math.min(8, Math.max(2, Math.ceil(blurb.length / 60) + 1))}
                    placeholder={`Write the text that posts with your video on ${platform.name}…`}
                    onChange={(event) => setDistributorBlurbs((current) => ({ ...current, [platform.id]: event.target.value }))}
                  />
                  <div className="cine-blurb-preview" style={{ borderTopColor: spec.brand, minHeight: `${72 + Math.min(90, blurb.length / 3)}px` }} aria-label={`Preview for ${platform.name}`}>
                    <span style={{ color: spec.brand }}>{platform.name} preview</span>
                    <p>{blurb || "Your blurb preview grows here as you type."}</p>
                  </div>
                  <ul className="cine-blurb-spec" aria-label={`What you can add on ${platform.name}`}>
                    {spec.fields.map((field) => (
                      <li key={field.label}><span>{field.label}</span><b>{field.limit === null ? "Allowed" : field.limit === 0 ? "Not allowed" : `${field.limit.toLocaleString()} chars`}</b></li>
                    ))}
                    <li><span>Links can be added</span><b>{spec.linksAllowed ? "Yes" : "No"}</b></li>
                  </ul>
                </div>
                <a href={platform.setupUrl} target="_blank" rel="noreferrer">{platform.setupLabel} <ArrowMark /></a>
                <label htmlFor={`cine-social-label-${platform.id}`}>Account label or handle</label>
                <input id={`cine-social-label-${platform.id}`} value={accountLabels[platform.id]} placeholder={platform.id === "bluesky" ? "name.bsky.social" : `Your ${platform.name} account`} onChange={(event) => setAccountLabels((current) => ({ ...current, [platform.id]: event.target.value }))} />
                <label htmlFor={`cine-social-format-${platform.id}`}>Default format</label>
                <select id={`cine-social-format-${platform.id}`} value={selectedFormat} onChange={(event) => { const nextFormat = event.target.value as SocialFormat; setSocialFormat(nextFormat); saveDestination.mutate({ platform: platform.id, account_label: accountLabels[platform.id], format: nextFormat, enabled: selected }); }}>
                  <option value="vertical">Vertical 9:16</option><option value="square">Square 1:1</option><option value="landscape">Landscape 16:9</option>
                </select>
                <button type="button" className="cine-destination-save" disabled={saveDestination.isPending} onClick={() => saveDestination.mutate({ platform: platform.id, account_label: accountLabels[platform.id], format: selectedFormat, enabled: selected })}>Save to profile</button>
              </article>
            );
          })}
        </div>
      </>
    ));

    if (tool === "stitch") return renderToolFrame("stitch", column, (
      <div className="cine-stitch">
        <p className="cine-stitch-intro">Stitch still pictures into a slideshow video, or auto-merge videos and images back-to-back on the timeline.</p>
        <div className="cine-control-group">
          <span className="cine-label">Seconds per picture</span>
          <div className="cine-segmented" role="group" aria-label="Seconds per slideshow picture">
            {[2, 3, 5, 8].map((value) => <button key={value} type="button" className={stitchSlideSeconds === value ? "active" : ""} onClick={() => setStitchSlideSeconds(value)} aria-label={`${value} seconds per picture`}>{value}s</button>)}
          </div>
        </div>
        <div className="cine-control-group">
          <span className="cine-label">Background music template</span>
          <div className="cine-stitch-music" role="group" aria-label="Slideshow music template">
            <button type="button" className={stitchMusicTitle === "" ? "active" : ""} onClick={() => setStitchMusicTitle("")}>No music</button>
            {musicLoops.map((loop) => (
              <button key={loop.title} type="button" className={stitchMusicTitle === loop.title ? "active" : ""} onClick={() => setStitchMusicTitle(loop.title)} aria-label={`Use ${loop.title}, ${loop.genre}, as slideshow music`}>{loop.title} · {loop.genre}</button>
            ))}
          </div>
        </div>
        <label className="cine-stitch-action" htmlFor="cine-stitch-images">
          <strong>Stitch slideshow from pictures</strong>
          <span>Pick one or more still images — they land on the timeline in order{stitchMusicTitle ? `, scored with ${stitchMusicTitle}` : ""}.</span>
        </label>
        <input id="cine-stitch-images" className="visually-hidden" type="file" accept="image/*" multiple onChange={(event) => { buildSlideshow(event.target.files); event.currentTarget.value = ""; }} />
        <label className="cine-stitch-action" htmlFor="cine-stitch-merge">
          <strong>Auto-merge videos + images</strong>
          <span>Pick mixed files — each one is placed right after the last, ready to trim.</span>
        </label>
        <input id="cine-stitch-merge" className="visually-hidden" type="file" accept="video/*,image/*" multiple onChange={(event) => { buildAutoMerge(event.target.files); event.currentTarget.value = ""; }} />
        {stitchStatus ? <p className="cine-status-message" role="status">{stitchStatus}</p> : null}
      </div>
    ));

    if (tool === "filters") return renderToolFrame("filters", column, (
      <div className="cine-stitch">
        <p className="cine-stitch-intro">by STITCH — looks for your cut, live in the preview and baked into exports</p>
        <p className="cine-stitch-intro">The STITCH look book. Pick a look, then stack flicker, grain and vignette on top — the preview updates live and Export bakes the same treatment into the render.</p>
        <div className="cine-control-group">
          <span className="cine-label">Look</span>
          <div className="cine-stitch-music" role="group" aria-label="STITCH filter look">
            {STITCH_LOOKS.map((look) => (
              <button key={look.id} type="button" className={stitchLookId === look.id ? "active" : ""} onClick={() => setStitchLookId(look.id)} aria-label={`Apply the ${look.label} look`}>{look.label}</button>
            ))}
          </div>
        </div>
        <label className="cine-toggle"><input type="checkbox" checked={fxFlicker} onChange={(event) => setFxFlicker(event.target.checked)} /><span>Flicker — old-projector brightness play</span></label>
        <label className="cine-toggle"><input type="checkbox" checked={fxGrain} onChange={(event) => setFxGrain(event.target.checked)} /><span>Film grain</span></label>
        <label className="cine-toggle"><input type="checkbox" checked={fxVignette} onChange={(event) => setFxVignette(event.target.checked)} /><span>Vignette — darkened corners</span></label>
        <p className="cine-status-message" role="status">{`Active: ${activeLook.label}${flickerOn ? " · Flicker" : ""}${grainOn ? " · Grain" : ""}${vignetteOn ? " · Vignette" : ""}`}</p>
      </div>
    ));

    if (tool === "pix-library") return renderToolFrame("pix-library", column, (
      <div className="pix-library-browser">
        <div className="pix-library-public-head">
          <span>PUBLIC DOMAIN · {classicFilms.length} FILMS</span>
          <small className="pix-library-clips-available">{publicClipCount} CLIPS AVAILABLE</small>
        </div>
        {classicLibrary.isPending ? <p className="empty-state">Loading the public-domain library…</p> : null}
        {classicLibrary.isError ? <p className="empty-state" role="alert">The public-domain library could not load.</p> : null}
        {classicFilms.length > 0 ? (
          <>
            <div className="pix-library-search">
              <label htmlFor="cine-pix-library-search">Search films</label>
              <input id="cine-pix-library-search" type="search" value={classicFilmSearch} placeholder="Search by title" autoComplete="off" onChange={(event) => setClassicFilmSearch(event.target.value)} />
            </div>
            {visibleClassicFilms.length === 0 ? <p className="empty-state">No films match that title.</p> : (
              <div className="pix-library-explorer">
                <div className="pix-library-explorer-dirs" role="list" aria-label="Directories">
                  <div className="pix-library-dir is-active" role="listitem" aria-current="true">
                    <strong>public-domains</strong>
                    <span>{classicFilms.length} films</span>
                  </div>
                </div>
                <div className="pix-library-film-tabs" role="list" aria-label="Public-domain films">
                  {visibleClassicFilms.map((film) => (
                    <button
                      type="button"
                      role="listitem"
                      className={selectedClassicFilm?.film_key === film.film_key ? "is-active" : ""}
                      onClick={() => setSelectedClassicFilmKey(film.film_key)}
                      aria-pressed={selectedClassicFilm?.film_key === film.film_key}
                      key={film.film_key}
                    >
                      <strong>{film.title}</strong>
                      <span>{film.release_year} · {film.total_segments} clips</span>
                    </button>
                  ))}
                </div>
                {selectedClassicFilm ? (
                  <section className="pix-library-film" aria-labelledby="pix-library-film-title">
                    <div className="pix-library-film-head">
                      <div>
                        <span>{selectedClassicFilm.profile_name}</span>
                        <h3 id="pix-library-film-title">{selectedClassicFilm.title} ({selectedClassicFilm.release_year})</h3>
                        <p>{selectedClassicFilm.detail}</p>
                      </div>
                      {selectedClassicFilm.still_url ? (
                        <img className="pix-library-film-still" src={selectedClassicFilm.still_url} alt={`Still frame from ${selectedClassicFilm.title} (${selectedClassicFilm.release_year})`} loading="lazy" />
                      ) : selectedClassicFilm.poster_key && hasPixPoster(selectedClassicFilm.poster_key) ? (
                        <PixPosterImage className="pix-library-film-still" posterKey={selectedClassicFilm.poster_key} alt={`${selectedClassicFilm.title} movie poster`} loading="lazy" />
                      ) : null}
                      <a href={`#feature/${encodeURIComponent(selectedClassicFilm.film_key)}`}>Feature presentation</a>
                    </div>
                    <div className="pix-library-classic-clips" aria-label={`${selectedClassicFilm.title} clips`}>
                      {selectedClassicFilm.clips.map((clip) => {
                        const inBin = clip.stream_url ? binClipUrls.has(clip.stream_url) : false;
                        const adding = addClipToBin.isPending && addClipToBin.variables?.film_key === selectedClassicFilm.film_key && addClipToBin.variables?.segment_number === clip.segment_number;
                        // Representative image: the clip's registered screen
                        // grab first, then the film's registered still
                        // frame, then the film's poster, then no image
                        // (the numbered text row is the placeholder).
                        const stillGrab = !clip.thumbnail_url && selectedClassicFilm.still_url ? selectedClassicFilm.still_url : null;
                        const posterGrab = !clip.thumbnail_url && !stillGrab && selectedClassicFilm.poster_key && hasPixPoster(selectedClassicFilm.poster_key) ? selectedClassicFilm.poster_key : null;
                        return (
                          <article className={`pix-library-classic-clip ${clip.thumbnail_url || stillGrab || posterGrab ? "has-grab" : ""}`} key={`${selectedClassicFilm.film_key}-${clip.segment_number}`}>
                            {clip.thumbnail_url ? (
                              <img className="pix-library-clip-grab" src={clip.thumbnail_url} alt={`Screen grab from ${clip.title}`} loading="lazy" />
                            ) : stillGrab ? (
                              <img className="pix-library-clip-grab" src={stillGrab} alt={`Still frame from ${selectedClassicFilm.title} (${selectedClassicFilm.release_year})`} loading="lazy" />
                            ) : posterGrab ? (
                              <PixPosterImage className="pix-library-clip-grab" posterKey={posterGrab} alt={`${selectedClassicFilm.title} movie poster`} loading="lazy" />
                            ) : null}
                            <span>{String(clip.segment_number).padStart(2, "0")}</span>
                            <div><strong>{clip.file_name}</strong><small>{classicDurationLabel(clip.duration_ms)} · {clip.stream_url ? "Ready" : "Awaiting upload"}</small></div>
                            {inBin ? (
                              <button type="button" disabled aria-label={`${clip.file_name} is already in your BIN`}>IN BIN</button>
                            ) : (
                              <button type="button" disabled={!clip.stream_url || adding} aria-label={`Add ${clip.file_name} to your BIN`} onClick={() => addClipToBin.mutate({ film_key: selectedClassicFilm.film_key, segment_number: clip.segment_number })}>
                                {!clip.stream_url ? "WAITING" : adding ? "ADDING…" : "ADD"}
                              </button>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </>
        ) : null}
        <section className="pix-library-personal" aria-labelledby="pix-library-personal-heading">
          <div className="pix-library-personal-head"><strong id="pix-library-personal-heading">Your PIX-ready clips</strong><span>{pixLibraryAssets.length}</span></div>
          {!workspace.data?.storage_ready ? (
            <p className="empty-state">Connect Storage to review your own PIX-ready clips here.</p>
          ) : pixLibraryAssets.length === 0 ? (
            <div className="pix-library-empty"><strong>No personal clips yet</strong><p>Export a video no longer than 2 minutes and it will appear here automatically.</p></div>
          ) : (
            <div className="pix-library-list">
              {pixLibraryAssets.map((asset) => (
                <article className="pix-library-item" key={asset.id}>
                  {asset.preview_url ? <video src={asset.preview_url} poster={asset.thumbnail_url ?? undefined} controls playsInline preload="metadata" aria-label={`Preview ${asset.name}`} /> : <div className="pix-library-preview-empty">Preview unavailable</div>}
                  <div className="pix-library-item-copy"><span>PIX SHORT · {formatDuration(asset.duration_seconds ?? 0)}</span><strong>{asset.name}</strong><small>{formatBytes(asset.size_bytes)} · {formatTimestamp(asset.created_at)}</small></div>
                  <div className="pix-library-actions">
                    {asset.preview_url ? <a href={asset.preview_url} target="_blank" rel="noreferrer">Review</a> : null}
                    <button type="button" disabled={!asset.preview_url} onClick={() => {
                      if (!asset.preview_url) return;
                      addTimelineTrack("video", { label: asset.name, sourceUrl: asset.preview_url, end: asset.duration_seconds ?? 120, grabUrl: asset.thumbnail_url ?? undefined });
                      setStatus(`${asset.name} added to the timeline from PIX Library.`);
                    }}>Add to timeline</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    ));

    if (tool === "library") return renderToolFrame("library", column, (
      !workspace.data?.storage_ready ? (
        <p className="empty-state">Connect Storage to review saved reels and shorts here.</p>
      ) : workspace.data.assets.length === 0 ? (
        <p className="empty-state">Your saved reels, shorts, source clips, and exports will appear here.</p>
      ) : (
        <div className="cine-asset-list">
          {workspace.data.assets.map((asset) => (
            <article className="cine-asset" key={asset.id}>
              <div><strong>{asset.name}</strong><span>{formatBytes(asset.size_bytes)} · {formatTimestamp(asset.created_at)}</span></div>
              <div>{asset.preview_url ? <a href={asset.preview_url} target="_blank" rel="noreferrer">Review</a> : null}<button type="button" onClick={() => removeAsset.mutate(asset)} disabled={removeAsset.isPending}>Delete</button></div>
            </article>
          ))}
        </div>
      )
    ));

    if (tool === "storage") return renderToolFrame("storage", column, (
      <>
        <div className="cine-storage-meter" aria-label={`${formatBytes(used)} of ${formatBytes(quota)} storage used`}>
          <small>{workspace.data?.plan === "paid" ? "Paid storage" : "Free workspace · 500 MB"}</small>
          <div><strong>{formatBytes(used)}</strong><span>of {formatBytes(quota)}</span></div>
          <div className="cine-meter-track"><span style={{ width: `${percent}%` }} /></div>
        </div>
        {!workspace.data?.storage_ready ? (
          <div className="cine-setup-note"><strong>Storage connection pending</strong><p>Add the S3 endpoint, region, bucket, key ID, and application key to the server configuration. CINE never places those credentials in the browser.</p></div>
        ) : null}
        <div className="cine-storage-increase-row">
          {workspace.data?.plan === "paid" ? (
            <><strong>Increase Storage</strong><span>Paid storage active</span></>
          ) : (
            <button type="button" disabled={checkout.isPending || !workspace.data?.billing_ready} onClick={() => checkout.mutate()}>
              <strong>{checkout.isPending ? "Preparing…" : "Increase Storage"}</strong>
              <span>{workspace.data?.billing_ready ? "+" : "Setup pending"}</span>
            </button>
          )}
          {checkoutUrl ? <a href={checkoutUrl} target="_blank" rel="noreferrer" aria-label="Continue to Stripe to increase storage"><span>Continue</span><ArrowMark /></a> : null}
        </div>
      </>
    ));

    return renderToolFrame("timeline", column, (
      <>
        <div className="cine-timeline-toolbar">
          <p className="cine-overline">Sequence · 01</p>
          <div className="cine-channel-add" onMouseLeave={() => setChannelHelpVisible(false)}>
            <div className="cine-channel-add-trigger" onMouseEnter={() => { if (helpBubblesEnabled) setChannelHelpVisible(true); }}>
              <button
                className="secondary-button"
                type="button"
                aria-expanded={channelMenuOpen}
                aria-controls="cine-channel-menu"
                onFocus={() => { if (helpBubblesEnabled) setChannelHelpVisible(true); }}
                onClick={() => {
                  setChannelHelpVisible(false);
                  setChannelMenuOpen((open) => {
                    if (open) setAudioPickerOpen(false);
                    return !open;
                  });
                }}
                aria-label="Add a timeline channel"
              >[+ADD]</button>
              {channelHelpVisible ? <aside className="cine-channel-help" role="tooltip">Add a channel, then select its bar to set timing and content.</aside> : null}
            </div>
            {channelMenuOpen ? (
              <div id="cine-channel-menu" className="cine-channel-menu" role="menu">
                {audioPickerOpen ? (
                  <>
                    <button className="cine-menu-back" role="menuitem" type="button" onClick={() => setAudioPickerOpen(false)}><strong>← Channels</strong><span>Back to channel types</span></button>
                    <div className="cine-loop-menu-heading"><strong>Music loops</strong><span>Built in · 30 seconds · seamless</span></div>
                    {musicLoops.map((loop) => <button role="menuitem" type="button" key={loop.title} aria-label={`Add ${loop.title}, ${loop.genre} music loop`} onClick={() => addMusicLoop(loop)}><strong>{loop.title}</strong><span>{loop.genre}</span></button>)}
                    <label role="menuitem" htmlFor="cine-add-audio"><strong>Choose audio file</strong><span>Use a track from this device</span></label>
                  </>
                ) : (
                  <>
                    <label role="menuitem" htmlFor="cine-add-video"><strong>Video</strong><span>Layer another clip</span></label>
                    <button role="menuitem" type="button" aria-haspopup="menu" onClick={() => setAudioPickerOpen(true)}><strong>Audio</strong><span>Music loops or your own file</span></button>
                    <button role="menuitem" type="button" onClick={() => addTimelineTrack("text")}><strong>Text</strong><span>Title or caption</span></button>
                    <label role="menuitem" htmlFor="cine-add-graphic"><strong>Image</strong><span>JPEG, PNG, WebP, or GIF</span></label>
                    <button role="menuitem" type="button" onClick={() => addTimelineTrack("animation")}><strong>Animation</strong><span>Motion for overlays</span></button>
                  </>
                )}
              </div>
            ) : null}
            <input id="cine-add-video" className="visually-hidden" type="file" accept="video/*" onChange={(event) => { addFileTrack("video", event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
            <input id="cine-add-audio" className="visually-hidden" type="file" accept="audio/*" onChange={(event) => { addFileTrack("audio", event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
            <input id="cine-add-graphic" className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { addFileTrack("graphic", event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
          </div>
          <div className="cine-time-readout">
            <button type="button" onClick={() => scrubTimeline(Math.max(0, playhead - 10))} aria-label="Move playhead back ten seconds">−10s</button>
            <button type="button" onClick={() => scrubTimeline(Math.max(0, playhead - 1))} aria-label="Move playhead back one second">−1s</button>
            <output aria-label="Timeline playhead">{formatDuration(playhead)}</output>
            <button type="button" onClick={() => scrubTimeline(Math.min(projectDuration, playhead + 1))} aria-label="Move playhead forward one second">+1s</button>
            <button type="button" onClick={() => scrubTimeline(Math.min(projectDuration, playhead + 10))} aria-label="Move playhead forward ten seconds">+10s</button>
          </div>
        </div>
        <input className="cine-playhead-slider" aria-label="Timeline playhead position" type="range" min="0" max={projectDuration} step="0.1" value={Math.min(playhead, projectDuration)} onChange={(event) => scrubTimeline(Number(event.target.value))} />
        <div className="cine-timeline-actions">
          <button
            type="button"
            className="cine-cut-button"
            disabled={!timelineTracks.some((track) => playhead > track.start + 0.09 && playhead < track.end - 0.09)}
            onClick={cutAtPlayhead}
            aria-label="Cut clips at the playhead"
          >
            <span aria-hidden="true">✂</span> Cut at playhead
          </button>
          <span className="cine-timeline-actions-hint">Drag a clip to move it — sideways to reposition, up or down to reorder. Drag its edges to trim. Drag a BIN clip here to add it.</span>
        </div>
        <div
          ref={trackStackRef}
          className={`cine-track-stack ${binDropActive ? "is-bin-drop-target" : ""}`}
          onDragOver={(event) => { if (event.dataTransfer.types.includes("text/pix-bin-asset")) event.preventDefault(); }}
          onDrop={(event) => {
            const assetId = Number(event.dataTransfer.getData("text/pix-bin-asset"));
            const asset = workspace.data?.assets.find((item) => item.id === assetId);
            if (asset) {
              event.preventDefault();
              event.stopPropagation();
              addBinAssetToTimeline(asset, event.clientX);
            }
          }}
        >
          <div className="cine-track-row cine-base-track">
            <div className="cine-track-key"><span>V1</span><strong>Base video</strong></div>
            <div className="cine-track-lane">
              {file ? (
                <button className="cine-track-clip cine-track-clip-base" style={{ left: 0, width: `${Math.max(2, (Math.max(duration, 0.1) / projectDuration) * 100)}%` }} type="button" aria-label={`Scrub ${file.name}`} onClick={(event) => {
                  const rect = event.currentTarget.getBoundingClientRect();
                  const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
                  scrubTimeline(Math.max(0, Math.min(1, ratio)) * duration);
                }}>
                  {baseThumbnails.length > 0 ? <span className="cine-filmstrip" aria-hidden="true">{baseThumbnails.map((frame, index) => <img key={`${frame.slice(-16)}-${index}`} src={frame} alt="" />)}</span> : null}
                  <span className="cine-track-clip-label">{file.name}</span>
                </button>
              ) : <span className="cine-track-empty">Choose a video above</span>}
              <i style={{ left: `${(playhead / projectDuration) * 100}%` }} />
            </div>
          </div>
          {timelineTracks.map((track, index) => {
            const left = Math.max(0, Math.min(100, (track.start / projectDuration) * 100));
            const width = Math.max(2, Math.min(100 - left, ((track.end - track.start) / projectDuration) * 100));
            return (
              <div className={`cine-track-row cine-track-${track.kind} ${selectedTrackId === track.id ? "selected" : ""}`} key={track.id} data-track-row={track.id}>
                <div className="cine-track-key">
                  <button type="button" aria-label={`${track.enabled ? "Hide" : "Show"} ${track.label}`} onClick={() => updateTimelineTrack(track.id, { enabled: !track.enabled })}>{track.enabled ? trackGlyph(track.kind) : "—"}</button>
                  <strong>{trackNames[track.kind]} {index + 2}</strong>
                  <button type="button" className="cine-track-delete" aria-label={`Delete ${track.label} track`} title={`Delete ${track.label} track`} onClick={() => removeTimelineTrack(track)}>✕ Delete</button>
                </div>
                <div className="cine-track-lane">
                  <button
                    className={`cine-track-clip ${movingTrackId === track.id ? "is-moving" : ""}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    type="button"
                    aria-label={track.kind === "video" ? `Scrub, edit, or drag to move ${track.label}` : `Edit or drag to move ${track.label}`}
                    onPointerDown={(event) => beginClipMove(event, track)}
                    onPointerMove={moveClipDrag}
                    onPointerUp={endClipMove}
                    onPointerCancel={endClipMove}
                    onClick={(event) => {
                    if (suppressClipClickRef.current) {
                      suppressClipClickRef.current = false;
                      setSelectedTrackId(track.id);
                      return;
                    }
                    setSelectedTrackId(track.id);
                    if (track.kind === "video") {
                      const rect = event.currentTarget.getBoundingClientRect();
                      const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0;
                      scrubTimeline(track.start + Math.max(0, Math.min(1, ratio)) * (track.end - track.start));
                    }
                  }}>
                    <span
                      className="cine-track-clip-handle cine-track-clip-handle-start"
                      aria-hidden="true"
                      onPointerDown={(event) => beginTrim(event, track, "start")}
                      onPointerMove={moveTrim}
                      onPointerUp={endTrim}
                      onPointerCancel={endTrim}
                      onClick={(event) => event.stopPropagation()}
                    />
                    {track.kind === "video" && track.thumbnails?.length ? <span className="cine-filmstrip" aria-hidden="true">{track.thumbnails.map((frame, frameIndex) => <img key={`${track.id}-${frameIndex}`} src={frame} alt="" />)}</span> : null}
                    {track.kind === "graphic" && track.sourceUrl ? <img src={track.sourceUrl} alt="" /> : null}
                    <span className="cine-track-clip-label">{track.label}</span>
                    <span
                      className="cine-track-clip-handle cine-track-clip-handle-end"
                      aria-hidden="true"
                      onPointerDown={(event) => beginTrim(event, track, "end")}
                      onPointerMove={moveTrim}
                      onPointerUp={endTrim}
                      onPointerCancel={endTrim}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </button>
                  <i style={{ left: `${(playhead / projectDuration) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        {selectedTrack ? (
          <div className="cine-track-inspector" aria-label={`Edit ${selectedTrack.label}`}>
            <div className="cine-track-inspector-head"><strong>{trackNames[selectedTrack.kind]} channel</strong><span className="cine-track-inspector-actions"><button type="button" disabled={!(playhead > selectedTrack.start + 0.09 && playhead < selectedTrack.end - 0.09)} onClick={() => cutTrackAtPlayhead(selectedTrack)} aria-label={`Cut ${selectedTrack.label} at the playhead`}>Cut at playhead</button><button type="button" onClick={() => removeTimelineTrack(selectedTrack)} aria-label={`Delete ${selectedTrack.label} track`}>Delete track</button></span></div>
            <label htmlFor="cine-track-name">Channel name</label>
            <input id="cine-track-name" value={selectedTrack.label} onChange={(event) => updateTimelineTrack(selectedTrack.id, { label: event.target.value })} />
            {selectedTrack.kind === "text" ? <><label htmlFor="cine-track-text">On-screen text</label><textarea id="cine-track-text" value={selectedTrack.text ?? ""} onChange={(event) => updateTimelineTrack(selectedTrack.id, { text: event.target.value })} /></> : null}
            {selectedTrack.kind === "animation" ? <><label htmlFor="cine-track-preset">Motion</label><select id="cine-track-preset" value={selectedTrack.preset ?? "drift"} onChange={(event) => updateTimelineTrack(selectedTrack.id, { preset: event.target.value as AnimationPreset })}><option value="drift">Drift in</option><option value="spin">Spin</option><option value="pulse">Pulse</option></select></> : null}
            <div className="cine-track-time-fields">
              <label htmlFor="cine-track-start">Start <input id="cine-track-start" type="number" min="0" max={Math.max(0, selectedTrack.end - 0.1)} step="0.1" value={selectedTrack.start} onChange={(event) => { const nextStart = Math.max(0, Math.min(Number(event.target.value), selectedTrack.end - 0.1)); updateTimelineTrack(selectedTrack.id, { start: nextStart, sourceStart: Math.max(0, (selectedTrack.sourceStart ?? 0) + (nextStart - selectedTrack.start)) }); }} /></label>
              <label htmlFor="cine-track-end">End <input id="cine-track-end" type="number" min={selectedTrack.start + 0.1} max={projectDuration} step="0.1" value={selectedTrack.end} onChange={(event) => updateTimelineTrack(selectedTrack.id, { end: Math.max(selectedTrack.start + 0.1, Number(event.target.value)) })} /></label>
            </div>
          </div>
        ) : null}
      </>
    ));
  }

  return (
    <section aria-label="CINE" className="section-shell cine-workspace">
      <section className="cine-building-system" aria-label="CINE tools">
        <header className="cine-tools-topology">
          <div className="cine-tool-index" role="group" aria-label="Toggle CINE tools">
            {(Object.keys(cineToolNames) as CineToolId[]).map((tool) => {
              const hidden = hiddenTools.has(tool);
              return (
                <button
                  key={tool}
                  type="button"
                  className={hidden ? "is-off" : "is-on"}
                  aria-pressed={!hidden}
                  aria-label={`${hidden ? "Show" : "Hide"} ${cineToolNames[tool]} tool`}
                  onClick={() => setHiddenTools((current) => { const next = new Set(current); if (next.has(tool)) next.delete(tool); else next.add(tool); return next; })}
                >
                  {cineToolNames[tool]}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { setToolLayout(defaultCineToolLayout); setCollapsedColumns({ left: false, right: false }); setCollapsedTools(new Set()); setHiddenTools(new Set()); setFullFrame(false); if (binFloating) { setBinFloating(false); setBinDockHint(null); setBinHomeColumn("left"); saveBinDock.mutate({ mode: "docked", column: "left", x: binFloatPos.x, y: binFloatPos.y }); } }}>Reset workspace</button>
        </header>

        <div ref={builderGridRef} className={`cine-builder-grid ${collapsedColumns.left ? "cine-left-collapsed" : ""} ${collapsedColumns.right ? "cine-right-collapsed" : ""} ${fullFrame ? "cine-full-frame" : ""} ${draggedTool ? "is-tool-dragging" : ""} ${binDockHint ? `is-bin-hint-${binDockHint}` : ""}`}>
          {!fullFrame && collapsedColumns.left ? (
            <aside className="cine-collapsed-rail cine-collapsed-rail-left" aria-label="Collapsed left tools">
              <button type="button" aria-label="Expand left tool column" onClick={() => setCollapsedColumns((current) => ({ ...current, left: false }))}>›</button>
              {toolLayout.left.filter((tool) => !hiddenTools.has(tool) && !(binFloating && tool === "bin")).map((tool) => <button key={tool} type="button" onClick={() => setCollapsedColumns((current) => ({ ...current, left: false }))}>{cineToolNames[tool]}</button>)}
            </aside>
          ) : null}

          {!fullFrame && !collapsedColumns.left ? (
            <div className={`cine-tool-column cine-tool-column-left ${dragTargetColumn === "left" ? "is-drop-target" : ""}`} aria-label={dragTargetColumn === "left" && draggedTool ? `Drop ${cineToolNames[draggedTool]} in the left column` : undefined} onDragEnter={(event) => handleColumnDragEnter(event, "left")} onDragOver={(event) => handleColumnDragOver(event, "left")} onDragLeave={() => handleColumnDragLeave("left")} onDrop={(event) => handleToolDrop(event, "left")}>
              <button className="cine-column-collapse cine-column-collapse-left" type="button" aria-label="Collapse left tool column" onClick={() => setCollapsedColumns((current) => ({ ...current, left: true }))}>‹</button>
              {toolLayout.left.filter((tool) => !hiddenTools.has(tool) && !(binFloating && tool === "bin")).map((tool) => renderCineTool(tool, "left"))}
              <div className="cine-tool-dropzone">{dragTargetColumn === "left" && draggedTool ? `Drop ${cineToolNames[draggedTool]} here` : "Drop tool"}</div>
            </div>
          ) : null}

          <main className="cine-center-column">
            <div
              className={`cine-stage cine-stage-${socialFormat} ${fullFrame ? "cine-stage-full" : ""}`}
              style={{ aspectRatio: socialFormatCopy[socialFormat].ratio }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const assetId = Number(event.dataTransfer.getData("text/pix-bin-asset"));
                const asset = workspace.data?.assets.find((item) => item.id === assetId);
                if (asset) { loadBinAssetIntoDisplay(asset); return; }
                const droppedFile = event.dataTransfer.files?.[0];
                if (droppedFile) chooseFile(droppedFile);
              }}
            >
              {!localUrl && binDisplayUrl ? (
                <video
                  key={binDisplayUrl}
                  className="cine-source-video cine-source-video-width"
                  src={binDisplayUrl}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="BIN clip loaded in the display"
                />
              ) : null}
              {localUrl ? (
                <video
                  ref={videoRef}
                  className={`cine-source-video cine-source-video-${videoSnap} cine-source-video-float-${verticalFloat}`}
                  src={localUrl}
                  controls
                  playsInline
                  onLoadedMetadata={(event) => {
                    const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0;
                    setDuration(nextDuration);
                    setTrimEnd(nextDuration);
                  }}
                  onTimeUpdate={(event) => {
                    const nextTime = event.currentTarget.currentTime;
                    setPlayhead(nextTime);
                    syncTimelineMedia(nextTime, !event.currentTarget.paused);
                  }}
                  onPlay={(event) => syncTimelineMedia(event.currentTarget.currentTime, true)}
                  onPause={(event) => syncTimelineMedia(event.currentTarget.currentTime, false)}
                />
              ) : binDisplayUrl ? null : (
                <label className="cine-dropzone" htmlFor="cine-file">
                  <span>Start with a clip</span>
                  <strong>Choose video</strong>
                  <small>MP4, MOV, WebM · up to your remaining storage · or drag a BIN clip here</small>
                </label>
              )}
              <div className="cine-composite-layer" aria-hidden="true" style={overlayStyle}>
                {visibleTracks.filter((track) => track.kind === "video" && track.sourceUrl).map((track) => (
                  <video key={track.id} ref={(node) => bindTimelineMedia(track.id, node)} className="cine-overlay-video" src={track.sourceUrl} muted playsInline />
                ))}
                {visibleTracks.filter((track) => track.kind === "graphic" && track.sourceUrl).map((track) => (
                  <img key={track.id} className="cine-overlay-graphic" src={track.sourceUrl} alt="" />
                ))}
                {visibleTracks.filter((track) => track.kind === "text").map((track) => (
                  <span className="cine-overlay-text" key={track.id}>{track.text}</span>
                ))}
              </div>
              {grainOn ? <div className="cine-fx-grain" aria-hidden="true" /> : null}
              {vignetteOn ? <div className="cine-fx-vignette" aria-hidden="true" /> : null}
              <div className="cine-stage-tools" onMouseLeave={() => setPopOutHelpVisible(false)}>
                <button type="button" aria-label={popOutActive ? "Close Pop Out player" : "Open Pop Out player"} aria-pressed={popOutActive} onClick={() => void togglePopOut()}>
                  <span aria-hidden="true">↗</span>{popOutActive ? "Close Pop Out" : "Pop Out"}
                </button>
                {popOutHelpVisible ? (
                  <aside className="cine-popout-help" role="dialog" aria-label="Pop Out Help Bubble">
                    <div className="cine-help-bubble-head"><strong>Help Bubble</strong><button type="button" aria-label="Close Pop Out Help Bubble" onClick={() => setPopOutHelpVisible(false)}>×</button></div>
                    <p>Pop Out uses your browser or device’s Picture-in-Picture setting. If it is blocked, allow Picture-in-Picture for PIX in browser or device settings, then try again.</p>
                  </aside>
                ) : null}
              </div>
              <button className="cine-full-frame-toggle" type="button" aria-pressed={fullFrame} aria-label={fullFrame ? "Return to previous workspace layout" : "Show full frame"} onClick={() => setFullFrame((current) => !current)}>
                <span>{fullFrame ? "100%" : "Full frame"}</span><b aria-hidden="true">{fullFrame ? "×" : "↗"}</b>
              </button>
              {timelineTracks.filter((track) => track.kind === "audio" && track.sourceUrl).map((track) => (
                <audio key={track.id} ref={(node) => bindTimelineMedia(track.id, node)} src={track.sourceUrl} preload="metadata" loop={track.loop} />
              ))}
              <input id="cine-file" className="visually-hidden" type="file" accept="video/*" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
            </div>
            {!fullFrame ? (
              <div className={`cine-tool-column cine-tool-column-center ${dragTargetColumn === "center" ? "is-drop-target" : ""}`} aria-label={dragTargetColumn === "center" && draggedTool ? `Drop ${cineToolNames[draggedTool]} in the center column` : undefined} onDragEnter={(event) => handleColumnDragEnter(event, "center")} onDragOver={(event) => handleColumnDragOver(event, "center")} onDragLeave={() => handleColumnDragLeave("center")} onDrop={(event) => handleToolDrop(event, "center")}>
                {toolLayout.center.filter((tool) => !hiddenTools.has(tool) && !(binFloating && tool === "bin")).map((tool) => renderCineTool(tool, "center"))}
                <div className="cine-tool-dropzone">{dragTargetColumn === "center" && draggedTool ? `Drop ${cineToolNames[draggedTool]} here` : "Drop tool"}</div>
              </div>
            ) : null}
          </main>

          {!fullFrame && !collapsedColumns.right ? (
            <div className={`cine-tool-column cine-tool-column-right ${dragTargetColumn === "right" ? "is-drop-target" : ""}`} aria-label={dragTargetColumn === "right" && draggedTool ? `Drop ${cineToolNames[draggedTool]} in the right column` : undefined} onDragEnter={(event) => handleColumnDragEnter(event, "right")} onDragOver={(event) => handleColumnDragOver(event, "right")} onDragLeave={() => handleColumnDragLeave("right")} onDrop={(event) => handleToolDrop(event, "right")}>
              <button className="cine-column-collapse cine-column-collapse-right" type="button" aria-label="Collapse right tool column" onClick={() => setCollapsedColumns((current) => ({ ...current, right: true }))}>›</button>
              {toolLayout.right.filter((tool) => !hiddenTools.has(tool) && !(binFloating && tool === "bin")).map((tool) => renderCineTool(tool, "right"))}
              <div className="cine-tool-dropzone">{dragTargetColumn === "right" && draggedTool ? `Drop ${cineToolNames[draggedTool]} here` : "Drop tool"}</div>
            </div>
          ) : null}

          {!fullFrame && collapsedColumns.right ? (
            <aside className="cine-collapsed-rail cine-collapsed-rail-right" aria-label="Collapsed right tools">
              <button type="button" aria-label="Expand right tool column" onClick={() => setCollapsedColumns((current) => ({ ...current, right: false }))}>‹</button>
              {toolLayout.right.filter((tool) => !hiddenTools.has(tool) && !(binFloating && tool === "bin")).map((tool) => <button key={tool} type="button" onClick={() => setCollapsedColumns((current) => ({ ...current, right: false }))}>{cineToolNames[tool]}</button>)}
            </aside>
          ) : null}
        </div>
      </section>

      {binFloating && !hiddenTools.has("bin") ? (
        <div className="cine-bin-float" style={{ left: binFloatPos.x, top: binFloatPos.y }} role="dialog" aria-label="BIN floating window">
          <header
            className="cine-bin-float-head"
            onPointerDown={beginBinFloatDrag}
            onPointerMove={moveBinFloatDrag}
            onPointerUp={endBinFloatDrag}
            onPointerCancel={endBinFloatDrag}
          >
            <span className="cine-bin-float-grip" aria-hidden="true">⠿</span>
            <strong>BIN</strong>
            {binDockHint ? <span className="cine-bin-float-hint" aria-hidden="true">Release to dock {binDockHint}</span> : null}
            <span className="cine-bin-float-docks" role="group" aria-label="Dock the BIN" onPointerDown={(event) => event.stopPropagation()}>
              <button type="button" aria-label="Dock the BIN in the left column" title="Dock left" onClick={() => dockBin("left")}>◀</button>
              <button type="button" aria-label="Dock the BIN in the center column" title="Dock center" onClick={() => dockBin("center")}>▦</button>
              <button type="button" aria-label="Dock the BIN in the right column" title="Dock right" onClick={() => dockBin("right")}>▶</button>
            </span>
          </header>
          <div className="cine-bin-float-body">{renderBinBody()}</div>
        </div>
      ) : null}

      {binDragGhost ? (
        <div className="cine-bin-drag-ghost" style={{ left: binDragGhost.x, top: binDragGhost.y }} aria-hidden="true">
          <span>▶</span>{binDragGhost.name}
        </div>
      ) : null}
    </section>
  );
}

function Scratchpad({ scratchpad }: { scratchpad: Note }) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(scratchpad.body);
  const [dirty, setDirty] = useState(false);
  const latest = useRef(value);

  useEffect(() => {
    if (!dirty) {
      setValue(scratchpad.body);
      latest.current = scratchpad.body;
    }
  }, [scratchpad.body, dirty]);

  const save = useMutation({
    mutationFn: (body: string) => api.updateNoteBody({ id: scratchpad.id, body }),
    onSuccess: async (_data, body) => {
      if (latest.current === body) setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => save.mutate(value), 700);
    return () => window.clearTimeout(timer);
  }, [value, dirty]);

  return (
    <div className="scratchpad-wrap">
      <label htmlFor="scratchpad">Scratchpad</label>
      <textarea
        id="scratchpad"
        aria-label="Scratchpad"
        value={value}
        onChange={(event) => {
          latest.current = event.target.value;
          setValue(event.target.value);
          setDirty(true);
        }}
        placeholder="Sketch a creature, a scene, a title, a question…"
      />
      <div className={`save-status ${save.isError ? "save-error" : ""}`} aria-live="polite">
        {save.isError ? "Couldn’t save — keep this page open and try again." : save.isPending || dirty ? "Saving…" : "Saved"}
      </div>
    </div>
  );
}

function NotesSection({ notes }: { notes: Note[] }) {
  const queryClient = useQueryClient();
  const scratchpad = notes.find((note) => note.kind === "scratchpad");
  const memos = notes.filter((note) => note.kind === "memo").sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const linkTargets = notes
    .filter((note) => ["dream", "monster", "poster"].includes(note.kind))
    .sort((a, b) => a.title.localeCompare(b.title));
  const byId = new Map(notes.map((note) => [note.id, note]));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [parentId, setParentId] = useState("");

  const addMemo = useMutation({
    mutationFn: () => api.addMemo({
      title,
      body,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      parent_note_id: parentId ? Number(parentId) : null,
    }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setTags("");
      setParentId("");
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    addMemo.mutate();
  }

  return (
    <section aria-labelledby="notes-heading" className="section-shell text-section">
      <div className="section-heading">
        <div>
          <p className="kicker">Field desk</p>
          <h1 id="notes-heading">Notes</h1>
        </div>
        <p className="section-intro">Catch the raw thought. File the useful ones beside a dream, monster, or poster.</p>
      </div>

      {scratchpad ? <Scratchpad scratchpad={scratchpad} /> : <p className="error-block">Scratchpad unavailable.</p>}

      <form className="memo-form" onSubmit={submit}>
        <div className="form-heading">
          <h2>File a note</h2>
          <span>Optional link + tags</span>
        </div>
        <label htmlFor="memo-title">Title</label>
        <input id="memo-title" aria-label="Note title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
        <label htmlFor="memo-body">Note</label>
        <textarea id="memo-body" aria-label="Note body" value={body} onChange={(event) => setBody(event.target.value)} required />
        <div className="form-grid">
          <div>
            <label htmlFor="memo-link">Link to</label>
            <select id="memo-link" aria-label="Link note to" value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">Unlinked</option>
              {linkTargets.map((target) => <option value={target.id} key={target.id}>{target.title}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="memo-tags">Tags</label>
            <input id="memo-tags" aria-label="Note tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="color, scene, idea" />
          </div>
        </div>
        <button className="primary-button" type="submit" disabled={addMemo.isPending || !title.trim() || !body.trim()}>
          {addMemo.isPending ? "Filing…" : "File note"}
        </button>
        {addMemo.isError ? <p className="form-error">That note didn’t save. Try again.</p> : null}
      </form>

      <div className="entry-list" aria-label="Filed notes">
        {memos.length === 0 ? <p className="empty-state">Filed notes will gather here.</p> : memos.map((memo) => {
          const parent = memo.parent_note_id ? byId.get(memo.parent_note_id) : undefined;
          return (
            <article className="text-entry" key={memo.id}>
              <div className="entry-topline"><span>{parent ? `Linked to ${parent.title}` : "Unlinked note"}</span><time>{formatTimestamp(memo.updated_at)}</time></div>
              <h3>{memo.title}</h3>
              <p>{memo.body}</p>
              {memo.tags.length ? <div className="tag-row">{memo.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MonsterProfile({ monster, linkedNotes, posterCount }: { monster: Note; linkedNotes: Note[]; posterCount: number }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState(monster.body);
  const save = useMutation({
    mutationFn: () => api.updateNoteBody({ id: monster.id, body }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notes"] }),
  });

  useEffect(() => setBody(monster.body), [monster.body]);

  return (
    <article className="monster-profile">
      <div className="monster-index">{String(monster.sort_order ?? 0).padStart(2, "0")}</div>
      <div className="monster-copy">
        <p>{posterCount} poster{posterCount === 1 ? "" : "s"}</p>
        <h2>{monster.title}</h2>
        <label htmlFor={`monster-${monster.id}`}>Profile notes</label>
        <textarea
          id={`monster-${monster.id}`}
          aria-label={`${monster.title} profile notes`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onBlur={() => {
            if (body !== monster.body) save.mutate();
          }}
          placeholder={`Build ${monster.title}’s profile…`}
        />
        <span className="inline-save" aria-live="polite">{save.isPending ? "Saving…" : save.isError ? "Save failed" : body && body === monster.body ? "Saved" : ""}</span>
        {linkedNotes.map((note) => <div className="linked-note" key={note.id}><strong>{note.title}</strong><p>{note.body}</p></div>)}
      </div>
    </article>
  );
}

function MonstersSection({ notes }: { notes: Note[] }) {
  const monsters = notes.filter((note) => note.kind === "monster").sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  const posters = useMemo(() => notes.filter((note) => note.kind === "poster"), [notes]);
  const memos = useMemo(() => notes.filter((note) => note.kind === "memo"), [notes]);
  return (
    <section aria-labelledby="monsters-heading" className="section-shell text-section">
      <div className="section-heading">
        <div><p className="kicker">Creature index</p><h1 id="monsters-heading">Monsters</h1></div>
        <p className="section-intro">Four presences. Their dossiers grow wherever your notes take them.</p>
      </div>
      <div className="monster-list">
        {monsters.map((monster) => (
          <MonsterProfile
            key={monster.id}
            monster={monster}
            linkedNotes={memos.filter((note) => note.parent_note_id === monster.id)}
            posterCount={posters.filter((poster) => poster.tags.includes(`monster:${monster.title}`)).length}
          />
        ))}
      </div>
    </section>
  );
}

function DreamLog({ notes }: { notes: Note[] }) {
  const queryClient = useQueryClient();
  const dreams = notes
    .filter((note) => note.kind === "dream")
    .sort((a, b) => (b.note_date ?? "").localeCompare(a.note_date ?? "") || b.created_at.localeCompare(a.created_at));
  const memos = notes.filter((note) => note.kind === "memo");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const addDream = useMutation({
    mutationFn: () => api.addDream({
      title,
      dream_date: date,
      body,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    }),
    onSuccess: async () => {
      setTitle("");
      setBody("");
      setTags("");
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteNote({ id }),
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    addDream.mutate();
  }

  return (
    <section aria-labelledby="dreams-heading" className="section-shell text-section">
      <div className="section-heading dream-heading">
        <div><p className="kicker">Night transmissions</p><h1 id="dreams-heading">Dream Log</h1></div>
        <p className="section-intro">Name the vision, fix its date, preserve what remains.</p>
      </div>

      <form className="dream-form" onSubmit={submit}>
        <div className="dream-form-top">
          <div>
            <label htmlFor="dream-title">Dream title</label>
            <input id="dream-title" aria-label="Dream title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
          </div>
          <div>
            <label htmlFor="dream-date">Dream date</label>
            <input id="dream-date" aria-label="Dream date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          </div>
        </div>
        <label htmlFor="dream-body">What happened?</label>
        <textarea id="dream-body" aria-label="Dream body" value={body} onChange={(event) => setBody(event.target.value)} required placeholder="Record the fragments before they dissolve…" />
        <label htmlFor="dream-tags">Tags</label>
        <input id="dream-tags" aria-label="Dream tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="recurring, ocean, creature" />
        <button className="primary-button" type="submit" disabled={addDream.isPending || !title.trim() || !date || !body.trim()}>
          {addDream.isPending ? "Recording…" : "Record dream"}
        </button>
        {addDream.isError ? <p className="form-error">That dream didn’t save. Try again.</p> : null}
      </form>

      <div className="dream-timeline">
        {dreams.length === 0 ? <p className="empty-state">The log is quiet. Your first dream will appear here.</p> : dreams.map((dream) => (
          <article className="dream-entry" key={dream.id}>
            <div className="dream-date-block">
              <time dateTime={dream.note_date ?? undefined}>{dream.note_date ? formatDate(dream.note_date) : "Undated"}</time>
              <span>Added {formatTimestamp(dream.created_at)}</span>
            </div>
            <div className="dream-copy">
              <h2>{dream.title}</h2>
              <p>{dream.body}</p>
              {dream.tags.filter((tag) => tag !== "dream").length ? <div className="tag-row">{dream.tags.filter((tag) => tag !== "dream").map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
              {memos.filter((memo) => memo.parent_note_id === dream.id).map((memo) => <div className="linked-note" key={memo.id}><strong>{memo.title}</strong><p>{memo.body}</p></div>)}
              <button
                type="button"
                className={deleteTarget === dream.id ? "delete-button confirm-delete" : "delete-button"}
                onClick={() => deleteTarget === dream.id ? remove.mutate(dream.id) : setDeleteTarget(dream.id)}
                aria-label={deleteTarget === dream.id ? `Confirm delete ${dream.title}` : `Delete ${dream.title}`}
              >
                {deleteTarget === dream.id ? "Confirm delete" : "Delete"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PublicGalleryPreview({ posters, monsters }: { posters: Note[]; monsters: Note[] }) {
  const sortedPosters = [...posters].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  const sortedMonsters = [...monsters].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));

  return (
    <div className="public-preview" aria-label="Public gallery preview">
      <div className="preview-browser-bar">
        <span />
        <span />
        <span />
        <strong>PUBLIC PREVIEW</strong>
      </div>
      <div className="preview-page">
        <header className="preview-masthead">
          <p>Giants in ink</p>
          <h2>PIX</h2>
          <span>Kaiju, strange horizons, and the worlds they leave behind.</span>
        </header>
        <div className="preview-grid">
          {sortedPosters.map((poster, index) => {
            const image = poster.entity_key ? imageByKey[poster.entity_key] : undefined;
            if (!image) return null;
            return (
              <figure className={index === 0 ? "preview-poster preview-poster-featured" : "preview-poster"} key={poster.id}>
                <img src={image} alt={`${poster.title}, featuring ${monsterFrom(poster)}`} />
                <figcaption>
                  <strong>{poster.title}</strong>
                  <span>{monsterFrom(poster)}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
        <section className="preview-monsters" aria-labelledby="preview-monsters-heading">
          <p>Creature index</p>
          <h3 id="preview-monsters-heading">Monsters</h3>
          <div>{sortedMonsters.map((monster) => <span key={monster.id}>{monster.title}</span>)}</div>
        </section>
      </div>
    </div>
  );
}

function PublishSection({ notes }: { notes: Note[] }) {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);
  const publishState = useQuery({ queryKey: ["publish-state"], queryFn: () => api.getPublishState({}) });
  const stage = useMutation({
    mutationFn: () => api.stageDeploymentSnapshot({}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["publish-state"] });
    },
  });
  const backup = useMutation({
    mutationFn: async () => {
      const fresh = await api.listNotes({});
      const fileName = `pix-backup-${todayLocal()}.zip`;
      const payload = JSON.stringify({
        format: "pix-backup",
        version: 1,
        exported_at: new Date().toISOString(),
        notes: fresh.notes,
      }, null, 2);
      const sourceResponse = await fetch(sourceTreeArchive);
      if (!sourceResponse.ok) throw new Error("Source archive is unavailable");
      const sourceFiles = unzipSync(new Uint8Array(await sourceResponse.arrayBuffer()));
      const contents: Record<string, Uint8Array> = {
        "data/pix-data.json": strToU8(payload),
      };
      for (const [path, bytes] of Object.entries(sourceFiles)) {
        if (!path.endsWith("/")) contents[`source/${path}`] = bytes;
      }
      const libraryDb = await api.getLibraryDbBackup({});
      if (libraryDb.available) {
        const libraryResponse = await fetch(libraryDb.url);
        if (!libraryResponse.ok) throw new Error("The synced library database is unavailable");
        contents["library.db"] = new Uint8Array(await libraryResponse.arrayBuffer());
      }
      const zipBytes = zipSync(contents, { level: 9 });
      const archive = new Blob([zipBytes], { type: "application/zip" });
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      return { fileName, noteCount: fresh.notes.length, includedLibraryDb: libraryDb.available };
    },
  });
  const posters = notes.filter((note) => note.kind === "poster");
  const monsters = notes.filter((note) => note.kind === "monster");
  const latest = publishState.data?.latest ?? null;

  return (
    <section aria-labelledby="publish-heading" className="section-shell text-section publish-section">
      <div className="section-heading">
        <div><p className="kicker">Public edition</p><h1 id="publish-heading">Publish</h1></div>
        <p className="section-intro">Review the public gallery, then stage a frozen release for approval.</p>
      </div>

      <div className="publish-actions">
        <article className="publish-action">
          <div className="publish-action-number">01</div>
          <div>
            <h2>Preview the gallery</h2>
            <p>See exactly the public-safe view: poster art, titles, and monster names. Notes and dreams stay private.</p>
            <button className="secondary-button" type="button" onClick={() => setShowPreview((value) => !value)}>
              {showPreview ? "Hide preview" : "Preview"}
            </button>
          </div>
        </article>

        <article className="publish-action deploy-action">
          <div className="publish-action-number">02</div>
          <div>
            <h2>Stage the next release</h2>
            <p>Deploy saves a snapshot and marks it ready. Final publishing always needs fresh one-tap approval in your chat with Lunk.</p>
            <button className="primary-button deploy-button" type="button" disabled={stage.isPending} onClick={() => stage.mutate()}>
              {stage.isPending ? "Staging…" : "Deploy"}
            </button>
            {stage.isError ? <p className="form-error" role="alert">The snapshot wasn’t staged. Try again.</p> : null}
          </div>
        </article>

        <article className="publish-action backup-action">
          <div className="publish-action-number">03</div>
          <div>
            <h2>Back up PIX</h2>
            <p>Compress app data, the TypeScript source tree, and the latest synced library.db into a private ZIP download.</p>
            <button className="secondary-button" type="button" disabled={backup.isPending} onClick={() => backup.mutate()}>
              {backup.isPending ? "Compressing…" : "Back-Up"}
            </button>
            {backup.isSuccess ? (
              <p className="backup-result" role="status">
                Downloaded {backup.data.fileName} with {backup.data.noteCount} records{backup.data.includedLibraryDb ? " and library.db" : "; no library.db has been synced yet"}.
              </p>
            ) : null}
            {backup.isError ? <p className="form-error" role="alert">The backup couldn’t be created. Try again.</p> : null}
          </div>
        </article>
      </div>

      {stage.isSuccess ? (
        <div className="ready-banner" role="status">
          <strong>Ready to deploy</strong>
          <span>{stage.data.poster_count} posters and {stage.data.monster_count} monster names staged. Approve the final publish with Lunk in chat.</span>
        </div>
      ) : latest ? (
        <div className="latest-snapshot">
          <span>Latest staged snapshot</span>
          <strong>{latest.poster_count} posters · {latest.monster_count} monsters</strong>
          <time dateTime={latest.created_at}>{formatTimestamp(latest.created_at)}</time>
        </div>
      ) : publishState.isPending ? (
        <p className="publish-state-copy">Checking staged releases…</p>
      ) : null}

      {showPreview ? <PublicGalleryPreview posters={posters} monsters={monsters} /> : null}
    </section>
  );
}

function ContentControl({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    onOpenChange(open);
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onOpenChange, open]);

  return (
    <div className="content-control">
      <button
        className={`content-trigger ${open ? "is-open" : ""}`}
        type="button"
        title="CINE"
        aria-label="Open CINE window"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="content-plus" aria-hidden="true">+</span>
        <span className="content-trigger-label">CINE</span>
      </button>

      {open ? (
        <div className="content-window-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="content-window" role="dialog" aria-modal="true" aria-labelledby="content-window-title">
            <header className="content-window-head">
              <div>
                <p className="kicker">CONTENT</p>
                <div className="content-window-title-row">
                  <h2 id="content-window-title">CINE tool</h2>
                  <span className="cine-version-label">v8.01.02</span>
                </div>
              </div>
              <div className="content-window-actions">
                <a className="cine-download-app content-window-download" href={cineDesktopAppV8} download="cine-desktop-app-v8.01.02.zip" aria-label="Download Seen desktop app, ZIP file, 15 megabytes">
                  <span aria-hidden="true">↓</span> DOWNLOAD SEEN DESKTOP APP <small>ZIP · 15 MB</small>
                </a>
                <button className="close-button content-window-close" type="button" aria-label="Close CONTENT window" onClick={() => setOpen(false)}>×</button>
              </div>
            </header>
            <CineSection />
          </section>
        </div>
      ) : null}
    </div>
  );
}

// FILM DNA, miniaturized: a small yellow text line resting just above
// the marquee chase lights in the top right of the header, next to the
// CINE button. It stays live — the recorded percentage plus the
// strongest taste signal (top genre, else top era) in miniature — and
// tapping it opens the profile, where the full FILM DNA panel lives.
// The header's is-game-open class hides it while NOW PLAYING is open
// (see .film-dna-mini in theme.css).
function HeaderTracker({ onOpenProfile }: { onOpenProfile: () => void }) {
  const controlQuery = useQuery({ queryKey: ["pix-control"], queryFn: () => api.getPixControlState({}) });
  const dnaQuery = useQuery({ queryKey: ["film-dna-profile"], queryFn: () => api.getFilmDnaProfile({}) });
  const ratedMovies = controlQuery.data?.rated_movies ?? 0;
  const totalMovies = controlQuery.data?.total_movies ?? 0;
  const filmDnaRecorded = (controlQuery.data?.film_dna_recorded_percentage ?? 0).toFixed(2);
  const strongestSignal = dnaQuery.data?.top_genres[0]?.label ?? dnaQuery.data?.top_eras[0]?.label ?? null;

  return (
    <button
      type="button"
      className="film-dna-mini"
      onClick={onOpenProfile}
      aria-label={`FILM DNA recorded ${filmDnaRecorded} percent; ${ratedMovies} of ${totalMovies} movies rated${strongestSignal ? `; strongest signal ${strongestSignal}` : ""}. Open your PIX profile.`}
    >
      <span>FILM DNA {filmDnaRecorded}%</span>
      {strongestSignal ? <span className="film-dna-mini-signal">{strongestSignal}</span> : null}
    </button>
  );
}

function AccountControl({ onViewProfile, onOpenChange, headerVersion, onHeaderVersionChange }: { onViewProfile: () => void; onOpenChange: (open: boolean) => void; headerVersion: 1 | 2; onHeaderVersionChange: (version: 1 | 2) => void }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [email, setEmail] = useState("");
  const [humanAnswer, setHumanAnswer] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [safeSpaceAgreed, setSafeSpaceAgreed] = useState(false);
  const [flaggedWords, setFlaggedWords] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [personalization, setPersonalization] = useState(false);
  const [adMeasurement, setAdMeasurement] = useState(false);
  const [helpBubblesEnabled, setHelpBubblesEnabled] = useHelpBubblesPreference();
  const [message, setMessage] = useState("");
  const controlQuery = useQuery({ queryKey: ["pix-control"], queryFn: () => api.getPixControlState({}) });
  const profilePageQuery = useQuery({
    queryKey: ["pix-profile-page"],
    queryFn: () => api.getPixProfilePage({}),
    enabled: open,
  });
  const challengeQuery = useQuery({
    queryKey: ["pix-signup-challenge", open],
    queryFn: () => api.getPixSignupChallenge({}),
    enabled: open && controlQuery.data?.profile.account_status !== "verified",
    staleTime: 8 * 60 * 1000,
  });
  const profile = controlQuery.data?.profile;
  const loggedIn = profile?.account_status === "verified";
  const verificationPending = previewCode !== "" || profile?.account_status === "verification_pending";
  const triggerLabel = loggedIn ? profile.display_name : "LOGIN";

  useEffect(() => {
    onOpenChange(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.mode === "saved" ? profile.display_name : "");
    setPersonalization(profile.personalization);
    setAdMeasurement(profile.ad_measurement);
    setPrivacyAccepted(profile.cookie_decision === "accepted");
  }, [profile]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  async function refreshProfile() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pix-control"] }),
      queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] }),
    ]);
  }

  const startSignup = useMutation({
    mutationFn: async () => {
      const challenge = challengeQuery.data;
      if (!challenge) throw new Error("Human check unavailable");
      await api.savePixConsent({ decision: "accepted", personalization: true, ad_measurement: false });
      return api.startPixEmailSignup({
        email: email.trim(),
        display_name: displayName.trim(),
        challenge_id: challenge.challenge_id,
        human_answer: humanAnswer.trim(),
      });
    },
    onSuccess: async (result) => {
      if (!result.ok) {
        setMessage(result.error);
        setFlaggedWords(result.flagged_words ?? []);
        void challengeQuery.refetch();
        setHumanAnswer("");
        return;
      }
      setFlaggedWords([]);
      setPreviewCode(result.verification_preview_code);
      setVerificationCode("");
      setMessage(`Verification is waiting for ${result.email_hint}.`);
      await refreshProfile();
    },
    onError: () => setMessage("The account could not be started. Check each field and try again."),
  });

  const verifySignup = useMutation({
    mutationFn: () => api.verifyPixEmailSignup({ code: verificationCode.trim() }),
    onSuccess: async (result) => {
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setPreviewCode("");
      setVerificationCode("");
      setPersonalization(true);
      setMessage("Email verified. Your PIX.MOV account is active.");
      await refreshProfile();
    },
    onError: () => setMessage("The verification code could not be checked. Try again."),
  });

  const logout = useMutation({
    mutationFn: () => api.logoutPixAccount({}),
    onSuccess: async () => {
      setPreviewCode("");
      setVerificationCode("");
      setEditingName(false);
      await refreshProfile();
      setMessage("Logged out. You are browsing anonymously now.");
    },
    onError: () => setMessage("Log out could not be completed. Try again."),
  });

  const saveProfile = useMutation({
    mutationFn: async (): Promise<string[]> => {
      // Pre-check the new name against the safe-space list so the
      // viewer sees the flagged words in red instead of a silent
      // failure; the server enforces the same check on save.
      const check = await api.checkPixSafeSpace({ texts: [displayName.trim()] });
      if (check.flagged_words.length > 0) return check.flagged_words;
      await api.savePixProfile({ display_name: displayName.trim() });
      return [];
    },
    onSuccess: async (flagged) => {
      if (flagged.length > 0) {
        setFlaggedWords(flagged);
        setMessage("That name could not be saved.");
        return;
      }
      setFlaggedWords([]);
      await refreshProfile();
      setEditingName(false);
      setMessage("Profile saved.");
    },
    onError: () => setMessage("The profile could not be saved. Try again."),
  });

  // One consent truth: these toggles refine an ACCEPTED BISCUIT
  // decision; they never create one. The decision itself is written
  // only by BISCUIT (the launcher, including the signup accept) via
  // the same savePixConsent action.
  const savePrivacy = useMutation({
    mutationFn: (next: { personalization: boolean; adMeasurement: boolean }) => api.savePixConsent({
      decision: profile?.cookie_decision === "accepted" ? "accepted" : "declined",
      personalization: next.personalization,
      ad_measurement: next.adMeasurement,
    }),
    onSuccess: async (saved) => {
      setPersonalization(saved.personalization);
      setAdMeasurement(saved.ad_measurement);
      await refreshProfile();
      setMessage(saved.personalization ? "Settings saved automatically. FILM DNA is recording." : "Settings saved automatically. FILM DNA recording is paused.");
    },
    onError: () => setMessage("The setting could not be saved. Try again."),
  });

  const deletePickData = useMutation({
    mutationFn: () => api.deletePixPickData({ confirmation: "DELETE" }),
    onSuccess: async () => {
      await refreshProfile();
      setDeletePromptOpen(false);
      setDeleteConfirmation("");
      setMessage("Your saved pick data was deleted.");
    },
    onError: () => setMessage("Your pick data could not be deleted. Try again."),
  });

  const profilePage = profilePageQuery.data;

  return (
    <div className="account-control">
      <button
        className={`account-trigger ${open ? "is-open" : ""}`}
        type="button"
        aria-label={loggedIn ? `Open profile for ${triggerLabel}` : "Open account options"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => { setMessage(""); setOpen(true); }}
      >
        {profile?.avatar_url ? (
          <img className="account-trigger-avatar" src={profile.avatar_url} alt="" />
        ) : (
          <span className="account-dots" aria-hidden="true">•••</span>
        )}
        <span className="account-trigger-label">{triggerLabel}</span>
      </button>

      {open ? (
        <div className="profile-window-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="profile-window" role="dialog" aria-modal="true" aria-label={loggedIn ? `${triggerLabel} profile` : verificationPending ? "Verify email" : "Play your way"}>
            <header className={`profile-window-head ${loggedIn ? "profile-window-head-compact" : ""}`}>
              <div>
                <p className="kicker">PIX.MOV</p>
                {!loggedIn ? <h2>{verificationPending ? "Verify email" : "Play your way"}</h2> : null}
              </div>
              <button className="close-button profile-panel-close" type="button" aria-label="Close account window" onClick={() => setOpen(false)}><span aria-hidden="true">x</span></button>
            </header>

            <div className="profile-window-identity">
              {profile?.avatar_url ? <img className="profile-window-avatar-image" src={profile.avatar_url} alt="" /> : <span aria-hidden="true">{loggedIn ? profile?.display_name.trim().slice(0, 2).toUpperCase() || "ME" : "•••"}</span>}
              <div>
                <strong>{loggedIn ? profile?.display_name : "Anonymous viewer"}</strong>
                <small>{loggedIn ? `${profile?.email_hint} · verified` : "Your game choices record automatically to this anonymous viewer ID."}</small>
                {loggedIn ? <button className="profile-name-edit" type="button" onClick={() => setEditingName(true)}>edit</button> : null}
              </div>
            </div>

            <button className="profile-open-full-button" type="button" onClick={() => { setOpen(false); onViewProfile(); }}>OPEN FULL PIX.MOV Profile</button>

            {loggedIn ? <button className="profile-logout-button" type="button" disabled={logout.isPending} onClick={() => logout.mutate()}>{logout.isPending ? "Logging out…" : "LOG OUT"}</button> : null}

            {!loggedIn && verificationPending ? (
              <form className="profile-window-form signup-form" onSubmit={(event) => { event.preventDefault(); verifySignup.mutate(); }}>
                <p className="signup-step">Step 3 of 3 · Verify your email</p>
                {previewCode ? (
                  <div className="verification-preview" role="note">
                    <span>Verification code</span>
                    <strong>{previewCode}</strong>
                    <small>Email delivery is not connected in this private build, so the one-time code is shown here.</small>
                  </div>
                ) : <p className="form-note">Enter the six-digit code for {profile?.email_hint || "your email"}. If it expired, restart signup for a new code.</p>}
                <label htmlFor="account-verification-code">Six-digit code</label>
                <input id="account-verification-code" value={verificationCode} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
                <button className="primary-button" type="submit" disabled={verifySignup.isPending || verificationCode.length !== 6}>{verifySignup.isPending ? "Checking…" : "Verify and activate"}</button>
                <button className="secondary-button" type="button" onClick={() => { setPreviewCode(""); setVerificationCode(""); setHumanAnswer(""); void challengeQuery.refetch(); }}>Start again</button>
              </form>
            ) : loggedIn && editingName ? (
              <form className="profile-window-form profile-name-form" onSubmit={(event) => { event.preventDefault(); saveProfile.mutate(); }}>
                <label htmlFor="account-display-name">Profile name</label>
                <input id="account-display-name" value={displayName} maxLength={60} autoComplete="name" onChange={(event) => { setDisplayName(event.target.value); setFlaggedWords([]); }} />
                <SafeSpaceFlagNotice words={flaggedWords} />
                <button className="primary-button" type="submit" disabled={saveProfile.isPending || !displayName.trim()}>{saveProfile.isPending ? "Saving…" : "Save"}</button>
                <button className="profile-name-cancel" type="button" onClick={() => { setDisplayName(profile?.display_name ?? ""); setEditingName(false); }}>Cancel</button>
              </form>
            ) : !loggedIn ? (
              <form className="profile-window-form signup-form" onSubmit={(event) => { event.preventDefault(); startSignup.mutate(); }}>
                <p className="signup-step">Create an account · Email verification required</p>
                <SafeSpaceDialogue />
                <label htmlFor="account-display-name">Profile name</label>
                <input id="account-display-name" value={displayName} maxLength={60} placeholder="How PIX should address you" autoComplete="name" required onChange={(event) => { setDisplayName(event.target.value); setFlaggedWords([]); }} />
                <SafeSpaceFlagNotice words={flaggedWords} />
                <label htmlFor="account-email">Email</label>
                <input id="account-email" type="email" value={email} maxLength={254} placeholder="you@example.com" autoComplete="email" required onChange={(event) => setEmail(event.target.value)} />
                <label htmlFor="account-human-check">Human check · {challengeQuery.data?.prompt ?? "Loading…"}</label>
                <input id="account-human-check" value={humanAnswer} inputMode="numeric" maxLength={3} placeholder="Answer" required disabled={!challengeQuery.data} onChange={(event) => setHumanAnswer(event.target.value.replace(/\D/g, "").slice(0, 3))} />
                <label className="signup-consent">
                  <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} />
                  <span>I accept the Privacy Policy and want PIX to save my game results.</span>
                </label>
                <label className="signup-consent">
                  <input type="checkbox" checked={safeSpaceAgreed} onChange={(event) => setSafeSpaceAgreed(event.target.checked)} aria-label="I agree to keep PIX.MOV a safe space" />
                  <span>I agree to keep PIX.MOV a safe space — no hate speech, talk, or language in my name, lists, reviews, or discussions.</span>
                </label>
                <details className="privacy-policy-copy">
                  <summary>Read Privacy Policy</summary>
                  <p>PIX uses the email you provide to activate this account. Game choices are recorded against your PIX viewer ID, whether anonymous or verified, and can be paused in Profile Settings. Optional profile details are used only for PIX games and entertainment recommendations. PIX does not use voluntarily shared demographic information for advertising.</p>
                  <p><a href="#privacy">Read the full Privacy Policy</a> · <a href="#agreements">Read the Consent Agreements</a> — the same BISCUIT consent you set here governs both.</p>
                </details>
                <button className="primary-button" type="submit" disabled={startSignup.isPending || !displayName.trim() || !email.trim() || !humanAnswer || !privacyAccepted || !safeSpaceAgreed || !challengeQuery.data}>{startSignup.isPending ? "Creating…" : "Create account"}</button>
                <button className="secondary-button" type="button" onClick={() => setOpen(false)}>Continue anonymously</button>
              </form>
            ) : null}

            {profilePage ? (
              <div className="profile-window-stats" aria-label="PIX.MOV profile totals">
                <div><strong>{profilePage.total_picks}</strong><span>Picks</span></div>
                <div><strong>{profilePage.ratings.length}</strong><span>Rated</span></div>
                <div><strong>{profilePage.unseen_count}</strong><span>Not watched</span></div>
              </div>
            ) : profilePageQuery.isPending ? <p className="profile-window-loading" role="status">Loading profile…</p> : null}

            <div className="profile-window-help-settings" aria-label="Profile Settings">
              <span><strong>Profile Settings</strong><small>PIX.MOV v1.1 · production trim</small></span>
              <label>
                <span><strong>Header experiment</strong><small>{headerVersion === 2 ? "Version 2 · chase lights" : "Version 1 · classic"}</small></span>
                <input type="checkbox" checked={headerVersion === 2} onChange={(event) => onHeaderVersionChange(event.target.checked ? 2 : 1)} />
              </label>
              <label>
                <span><strong>Help Bubbles</strong><small>{helpBubblesEnabled ? "On" : "Off"}</small></span>
                <input type="checkbox" checked={helpBubblesEnabled} onChange={(event) => setHelpBubblesEnabled(event.target.checked)} />
              </label>
            </div>

            <div className="profile-window-preferences" aria-label="Recording and privacy settings">
              {profile && profile.cookie_decision !== "accepted" ? (
                <small className="profile-consent-status" role="status">BISCUIT decision: {profile.cookie_decision === "declined" ? "Declined — nothing personal is being recorded." : "Not made yet — nothing personal is recorded until you decide."} These switches apply once you accept in BISCUIT.</small>
              ) : null}
              <label>
                <span><strong>Pause FILM DNA recording</strong><small>{personalization ? "Recording automatically to your PIX viewer ID." : "Paused. New game choices will not be added to FILM DNA."}</small></span>
                <input
                  type="checkbox"
                  checked={!personalization}
                  disabled={savePrivacy.isPending}
                  aria-label="Pause FILM DNA recording"
                  onChange={(event) => {
                    if (profile?.cookie_decision !== "accepted") { setOpen(false); window.setTimeout(openBiscuitConsent, 60); return; }
                    const nextPersonalization = !event.target.checked;
                    setPersonalization(nextPersonalization);
                    savePrivacy.mutate({ personalization: nextPersonalization, adMeasurement });
                  }}
                />
              </label>
              <label>
                <span><strong>Ad measurement</strong><small>Allow aggregate interaction measurement.</small></span>
                <input
                  type="checkbox"
                  checked={adMeasurement}
                  disabled={savePrivacy.isPending}
                  onChange={(event) => {
                    if (profile?.cookie_decision !== "accepted") { setOpen(false); window.setTimeout(openBiscuitConsent, 60); return; }
                    const nextAdMeasurement = event.target.checked;
                    setAdMeasurement(nextAdMeasurement);
                    savePrivacy.mutate({ personalization, adMeasurement: nextAdMeasurement });
                  }}
                />
              </label>
              <small className="profile-auto-save-note" role="status">{savePrivacy.isPending ? "Saving automatically…" : "Settings save automatically."}</small>
              <button
                type="button"
                className="pix-consent-open-row"
                aria-label="Cookie and Data Consent — open BISCUIT to review or change your consent decision"
                onClick={() => { setOpen(false); window.setTimeout(openBiscuitConsent, 60); }}
              >
                <span><strong>Cookie &amp; Data Consent</strong><small>Review or change your BISCUIT decision — the same consent that governs this whole page.</small></span>
                <span aria-hidden="true">›</span>
              </button>
            </div>

            {message ? <p className="profile-window-message" role="status">{message}</p> : null}

            <section className="profile-delete-data-box" aria-labelledby="profile-delete-data-title">
              <strong id="profile-delete-data-title">DELETE PIX DATA</strong>
              <small>Remove saved picks, ratings, and FILM DNA for this viewer ID.</small>
              {!deletePromptOpen ? (
                <button className="profile-delete-data-trigger" type="button" onClick={() => setDeletePromptOpen(true)}>Delete saved pick data</button>
              ) : (
                <div className="profile-delete-confirm">
                  <label htmlFor="profile-delete-confirmation">Type DELETE to confirm</label>
                  <input id="profile-delete-confirmation" value={deleteConfirmation} autoComplete="off" onChange={(event) => setDeleteConfirmation(event.target.value)} />
                  <div>
                    <button type="button" onClick={() => { setDeletePromptOpen(false); setDeleteConfirmation(""); }}>Cancel</button>
                    <button type="button" disabled={deleteConfirmation !== "DELETE" || deletePickData.isPending} onClick={() => deletePickData.mutate()}>{deletePickData.isPending ? "Deleting…" : "Delete data"}</button>
                  </div>
                </div>
              )}
            </section>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ChatWidget() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendName, setFriendName] = useState("");
  const [friendSpeaker, setFriendSpeaker] = useState<"user" | "friend">("user");
  const [notice, setNotice] = useState("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const chatQuery = useQuery({ queryKey: ["brainstorm-chat"], queryFn: () => api.listChat({}), enabled: open });
  const threads = chatQuery.data?.threads ?? [];
  const agentThread = threads.find((thread) => thread.kind === "agent") ?? null;
  const friendThreads = threads.filter((thread) => thread.kind === "friend");
  const selectedThread = activeThreadId === null ? agentThread : threads.find((thread) => thread.id === activeThreadId) ?? null;
  const isAgent = activeThreadId === null || selectedThread?.kind === "agent";
  const selectedMessages = (chatQuery.data?.messages ?? []).filter((message) => message.thread_id === selectedThread?.id);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  useEffect(() => {
    const list = messageListRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [selectedMessages.length, open]);

  const createFriend = useMutation({
    mutationFn: () => api.createFriendChat({ name: friendName.trim() }),
    onSuccess: async (thread) => {
      await queryClient.invalidateQueries({ queryKey: ["brainstorm-chat"] });
      setActiveThreadId(thread.id);
      setFriendName("");
      setAddingFriend(false);
      setNotice("Friend thread created.");
    },
    onError: () => setNotice("The friend thread could not be created."),
  });

  const sendMessage = useMutation({
    mutationFn: (body: string) => api.sendChatMessage({ thread_id: selectedThread?.id ?? null, body, sender: isAgent ? "user" : friendSpeaker }),
    onSuccess: async (result) => {
      setDraft("");
      setActiveThreadId(result.thread.id);
      await queryClient.invalidateQueries({ queryKey: ["brainstorm-chat"] });
      setNotice(result.thread.kind === "friend" ? "Added to the shared PIX thread." : "");
    },
    onError: () => setNotice("The message could not be sent. Try again."),
  });

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sendMessage.isPending) return;
    setNotice("");
    sendMessage.mutate(body);
  }

  function showAgent() {
    setActiveThreadId(agentThread?.id ?? null);
    setAddingFriend(false);
    setNotice("");
  }

  function formatChatTime(message: ChatMessage): string {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at));
  }

  return (
    <div className={`chat-widget ${open ? "is-open" : ""}`}>
      {open ? (
        <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby="chat-panel-title">
          <header className="chat-panel-head">
            <div>
              <p className="kicker">Conversation</p>
              <h2 id="chat-panel-title">{isAgent ? "Muse" : selectedThread?.title ?? "Friends"}</h2>
            </div>
            <button className="chat-close" type="button" aria-label="Close chat" onClick={() => setOpen(false)}>×</button>
          </header>

          <nav className="chat-thread-strip" aria-label="Chat conversations">
            <button type="button" className={isAgent ? "active" : ""} onClick={showAgent} aria-pressed={isAgent}>
              <span className="chat-avatar agent-avatar" aria-hidden="true">M</span><strong>Agent</strong>
            </button>
            {friendThreads.map((thread) => (
              <button key={thread.id} type="button" className={activeThreadId === thread.id ? "active" : ""} onClick={() => { setActiveThreadId(thread.id); setAddingFriend(false); setNotice(""); }} aria-pressed={activeThreadId === thread.id}>
                <span className="chat-avatar" aria-hidden="true">{thread.title.slice(0, 1).toUpperCase()}</span><strong>{thread.title}</strong>
              </button>
            ))}
            <button type="button" className="chat-add-friend" aria-label="Start a friend conversation" aria-expanded={addingFriend} onClick={() => setAddingFriend((value) => !value)}>
              <span aria-hidden="true">+</span><strong>Friend</strong>
            </button>
          </nav>

          {addingFriend ? (
            <form className="chat-friend-form" onSubmit={(event) => { event.preventDefault(); if (friendName.trim()) createFriend.mutate(); }}>
              <label htmlFor="chat-friend-name">Friend’s name</label>
              <div>
                <input id="chat-friend-name" value={friendName} maxLength={60} placeholder="Name" onChange={(event) => setFriendName(event.target.value)} autoFocus />
                <button type="submit" disabled={!friendName.trim() || createFriend.isPending}>{createFriend.isPending ? "Adding…" : "Add"}</button>
              </div>
            </form>
          ) : null}

          <div className="chat-messages" ref={messageListRef} aria-live="polite">
            {chatQuery.isPending ? <p className="chat-empty">Opening conversations…</p> : null}
            {chatQuery.isError ? <p className="chat-empty form-error" role="alert">Conversations couldn’t be loaded.</p> : null}
            {!chatQuery.isPending && !chatQuery.isError && selectedMessages.length === 0 ? (
              <div className="chat-empty-state">
                <span className={`chat-avatar ${isAgent ? "agent-avatar" : ""}`} aria-hidden="true">{isAgent ? "M" : selectedThread?.title.slice(0, 1).toUpperCase() ?? "F"}</span>
                <strong>{isAgent ? "What are we building?" : `Start a thread with ${selectedThread?.title ?? "a friend"}`}</strong>
                <p>{isAgent ? "Ask for ideas, writing, or help connecting pieces in your archive." : "Messages stay in PIX so anyone with access can read and reply."}</p>
              </div>
            ) : null}
            {selectedMessages.map((message) => (
              <article className={`chat-message ${message.sender === "user" ? "from-user" : message.sender === "friend" ? "from-friend" : "from-agent"}`} key={message.id}>
                <div>
                  <strong>{message.sender === "agent" ? "Muse" : message.sender === "friend" ? selectedThread?.title ?? "Friend" : "You"}</strong>
                  <time dateTime={message.created_at}>{formatChatTime(message)}</time>
                </div>
                <p>{message.body}</p>
              </article>
            ))}
            {sendMessage.isPending && isAgent ? <p className="chat-thinking" role="status"><span />Muse is thinking…</p> : null}
          </div>

          {!isAgent ? (
            <div className="chat-speaker" aria-label="Choose who is posting">
              <span>Posting as</span>
              <button type="button" className={friendSpeaker === "user" ? "active" : ""} onClick={() => setFriendSpeaker("user")} aria-pressed={friendSpeaker === "user"}>You</button>
              <button type="button" className={friendSpeaker === "friend" ? "active" : ""} onClick={() => setFriendSpeaker("friend")} aria-pressed={friendSpeaker === "friend"}>{selectedThread?.title ?? "Friend"}</button>
            </div>
          ) : null}
          {!isAgent ? <p className="chat-local-note">Shared inside PIX · not sent to an external messenger</p> : null}
          {notice ? <p className="chat-notice" role="status">{notice}</p> : null}
          <form className="chat-composer" onSubmit={submitMessage}>
            <label className="sr-only" htmlFor="chat-message-input">Message {isAgent ? "Muse" : selectedThread?.title ?? "friend"}</label>
            <textarea
              id="chat-message-input"
              value={draft}
              maxLength={4000}
              rows={1}
              placeholder={isAgent ? "Ask Muse…" : `Message ${selectedThread?.title ?? "friend"}…`}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button type="submit" aria-label="Send message" disabled={!draft.trim() || sendMessage.isPending}>↑</button>
          </form>
        </section>
      ) : null}
      <button
        className="chat-launcher"
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="chat-launcher-icon" aria-hidden="true">{open ? "×" : "···"}</span>
        {!open ? <span className="chat-launcher-label">CHAT</span> : null}
      </button>
    </div>
  );
}

function PixSidebarControls({ game, onChange, onNewActorPair }: { game: PixGameState; onChange: (next: PixGameState) => void; onNewActorPair: () => void }) {
  const actorsQuery = useQuery({ queryKey: ["pix-actors"], queryFn: () => api.listPixActors({}) });
  const decksQuery = useQuery({ queryKey: ["pix-movie-decks"], queryFn: () => api.listPixMovieDecks({}) });
  const genresQuery = useQuery({ queryKey: ["pix-browse-genres"], queryFn: () => api.listPixBrowseCatalog({ genre: null, country: null, year: null, decade: null, discovery: "all", exclude_international: false, offset: 0, limit: 1, shuffle_seed: null, query: null, exclude_triaged: false, exclude_dismissed: false }) });
  const yearDecks = (decksQuery.data?.decks ?? []).filter((deck) => deck.entry_count >= 2);
  const yearOptions = yearDecks.map((deck) => String(deck.release_year));
  const genreOptions = ["All genres", ...(genresQuery.data?.genres.map((genre) => genre.label) ?? pixGenreOptions.filter((genre) => genre !== "All genres"))];
  function chooseCategory(category: PixGameState["category"]) {
    onChange({ ...game, category });
    if (category === "actors") onNewActorPair();
  }

  function chooseGame(movieScope: PixGameState["movieScope"]) {
    const scopeValue = movieScope === "genre"
      ? "All genres"
      : movieScope === "decade"
        ? "1970"
        : movieScope === "year"
          ? (yearOptions.includes(game.scopeValue) ? game.scopeValue : yearOptions[0] ?? "")
          : "";
    onChange({ ...game, category: "movies", movieScope, scopeValue });
  }

  const detailLabel = game.category === "actors"
    ? `${game.actorA} vs ${game.actorB}`
    : game.movieScope === "all_time" ? "All films" : game.scopeValue;

  return (
    <div className="sidebar-game-controls" aria-label="PIX game controls">
      <details className="sidebar-filter-fold group border-t border-[var(--border)]" id="dna-category" tabIndex={-1}>
        <summary><span>CATEGORY</span><small>{game.category === "movies" ? "Movies" : "Performance"}</small></summary>
        <div className="sidebar-filter-options grid">
          {(["movies", "actors"] as const).map((value) => (
            <label key={value}><input type="radio" name="pix-category" checked={game.category === value} onChange={() => chooseCategory(value)} /><span>{value === "movies" ? "Movies" : "Performance"}</span></label>
          ))}
        </div>
      </details>

      <details className="sidebar-filter-fold group border-t border-[var(--border)]" id="dna-game-type" tabIndex={-1}>
        <summary><span>TYPE</span><small>{game.category === "actors" ? "Head to head" : game.movieScope === "all_time" ? "All time" : game.movieScope[0]?.toUpperCase() + game.movieScope.slice(1)}</small></summary>
        <div className="sidebar-filter-options grid">
          {game.category === "actors" ? <p>Compare two actors.</p> : ([
            ["all_time", "All time"], ["genre", "Genre"], ["decade", "Decade"], ["year", "Year"],
          ] as const).map(([value, label]) => (
            <label key={value}><input type="radio" name="pix-game" checked={game.movieScope === value} onChange={() => chooseGame(value)} /><span>{label}</span></label>
          ))}
        </div>
      </details>

      {game.category === "movies" ? (
        <details className="sidebar-filter-fold group border-t border-[var(--border)]" id="dna-year-filter" tabIndex={-1}>
          <summary><span>YEAR FILTER</span><small>{game.movieScope === "all_time" ? "Mix all" : game.movieScope === "decade" ? `Span ${game.scopeValue}–${Number(game.scopeValue) + 9}` : game.movieScope === "year" ? `Single year ${game.scopeValue}` : "By genre"}</small></summary>
          <div className="sidebar-filter-options grid">
            <label><input type="radio" name="pix-year-filter-mode" checked={game.movieScope === "year"} onChange={() => chooseGame("year")} /><span>Single year</span></label>
            <label><input type="radio" name="pix-year-filter-mode" checked={game.movieScope === "decade"} onChange={() => chooseGame("decade")} /><span>Span of years (a decade, e.g. 1980–1989)</span></label>
            <label><input type="radio" name="pix-year-filter-mode" checked={game.movieScope === "all_time"} onChange={() => chooseGame("all_time")} /><span>Mix all years</span></label>
          </div>
        </details>
      ) : null}

      {game.category === "movies" && game.movieScope !== "all_time" ? (
        <details className="sidebar-filter-fold group border-t border-[var(--border)]" id="dna-year" tabIndex={-1}>
          <summary><span>{game.movieScope === "year" ? "YEAR" : game.movieScope === "genre" ? "GENRE" : "SPAN"}</span><small>{detailLabel}</small></summary>
          <div className="sidebar-filter-options grid">
            {(game.movieScope === "genre" ? genreOptions : game.movieScope === "decade" ? ["1920", "1930", "1940", "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"] : yearOptions).map((value) => (
              <label key={value}><input type="radio" name="pix-scope" checked={game.scopeValue === value} onChange={() => onChange({ ...game, scopeValue: value })} /><span>{game.movieScope === "decade" ? `${value}–${Number(value) + 9}` : game.movieScope === "year" ? `${value} · ${(yearDecks.find((deck) => String(deck.release_year) === value)?.entry_count ?? 0).toLocaleString()} real poster-backed films` : game.movieScope === "genre" && value !== "All genres" ? `${value} · ${(genresQuery.data?.genres.find((genre) => genre.label === value)?.count ?? 0).toLocaleString()}` : value}</span></label>
            ))}
            {game.movieScope === "year" && decksQuery.isPending ? <p>Loading available years…</p> : null}
          </div>
        </details>
      ) : null}

      {game.category === "actors" ? (
        <div className="sidebar-actor-controls">
          <p>{actorsQuery.isPending ? "Loading roster…" : `${(actorsQuery.data?.count ?? 0).toLocaleString()} poster-backed performers`}</p>
          <small>Each VS draw is random. A matchup stays hidden unless both performers have real movie posters.</small>
          <button type="button" className="sidebar-random-vs" onClick={onNewActorPair} disabled={(actorsQuery.data?.count ?? 0) < 2}>Random VS</button>
        </div>
      ) : null}
    </div>
  );
}

const pixHomeStats = [
  { value: "—", label: "Videos Uploaded", note: "Awaiting live count" },
  { value: "—", label: "Active Creators", note: "Awaiting live count" },
  { value: "—", label: "Daily Views", note: "Awaiting live count" },
  { value: "—", label: "Shorts Daily", note: "Awaiting live count" },
];

const pixTrendSourceLabels: Record<PixTrendingMovie["sources"][number], string> = {
  game_votes: "game votes",
  matchup_activity: "matchup activity",
};

function compactPullDate(value: string | null): string {
  if (!value) return "Not pulled yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pull date unavailable";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function shortDurationLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function YoutubeTrendingShortCard({ short }: { short: YoutubeTrendingShort }) {
  return (
    <article className="pix-short-card pix-youtube-short-card">
      <span className="pix-short-frame pix-youtube-link-frame">
        <b>YOUTUBE</b>
        <small>External short</small>
        <i aria-hidden="true">↗</i>
      </span>
      <span className="pix-home-card-copy">
        <strong>{short.title}</strong>
        <small>{short.channel_title} · {shortDurationLabel(short.duration_seconds)}</small>
        <small>#{short.rank} mostPopular short-form · {compactPullDate(short.pulled_at)}</small>
        <a href={short.watch_url} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
      </span>
    </article>
  );
}

function CineTrendingShortCard({ short, onPlaySequence }: { short: CineTrendingShort; onPlaySequence: () => void }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || viewedRef.current || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6) && !viewedRef.current) {
        viewedRef.current = true;
        void api.recordCineShortSignal({ asset_id: short.asset_id, signal: "view", watch_ms: 0 }).catch(() => undefined);
        observer.disconnect();
      }
    }, { threshold: 0.6 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [short.asset_id]);

  return (
    <div className="pix-short-card" ref={cardRef}>
      {short.preview_url ? (
        <button className="pix-short-launch" type="button" onClick={onPlaySequence} aria-label={`Play ${short.title} in the Shorts sequence`}>
          <video className="pix-short-video" src={short.preview_url} muted playsInline preload="metadata" tabIndex={-1} />
          <span className="pix-short-launch-mark" aria-hidden="true">▶</span>
          <span className="pix-short-launch-label">Play sequence</span>
        </button>
      ) : (
        <span className="pix-short-frame pix-short-unavailable"><b>CINE</b><small>Preview unavailable</small></span>
      )}
      <span className="pix-home-card-copy">
        <strong>{short.title}</strong>
        <small>{shortDurationLabel(short.duration_seconds)} · 2:00 max</small>
        <small>{short.plays.toLocaleString()} plays · {short.completions.toLocaleString()} completions</small>
        <small>{short.completion_rate > 0 ? `${Math.round(short.completion_rate * 100)}% completion` : "No completion data yet"}</small>
      </span>
    </div>
  );
}

function classicDurationLabel(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// Progressive fill: a row paints its first item as soon as its data lands
// (so no section sits bare while the rest downloads), then a few more,
// then the remainder — staggering poster archive downloads instead of
// firing every section's full set at the page at once.
function useProgressiveFill(total: number, ready: boolean): number {
  const [count, setCount] = useState(1);
  useEffect(() => {
    if (!ready) return;
    setCount(1);
    if (total <= 1) {
      setCount(total);
      return;
    }
    const first = window.setTimeout(() => setCount((current) => Math.max(current, Math.min(total, 4))), 350);
    const rest = window.setTimeout(() => setCount(total), 1100);
    return () => { window.clearTimeout(first); window.clearTimeout(rest); };
  }, [ready, total]);
  return Math.min(count, total);
}

function PixFeaturesShelf({ related = false, currentFilmKey }: { related?: boolean; currentFilmKey?: string }) {
  const featuresQuery = useQuery({
    queryKey: ["pix-classic-features"],
    queryFn: () => api.listPixClassicFilms({}),
  });
  const features = (featuresQuery.data?.features ?? []).filter((feature) => feature.film_key !== currentFilmKey);
  const visibleFeatures = related ? features : features.slice(0, 12);
  const featureFill = useProgressiveFill(visibleFeatures.length, featuresQuery.isSuccess);
  return (
    <section className={`pix-features ${related ? "is-related" : "is-landing"}`} aria-labelledby={related ? "pix-other-features-heading" : "pix-features-heading"}>
      <div className="pix-home-section-heading">
        <div><span>{related ? "UP NEXT" : "02"}</span><h2 id={related ? "pix-other-features-heading" : "pix-features-heading"}>{related ? "Other Features" : "Features"}</h2></div>
        <p>{related ? "More feature presentations" : "Feature presentations from the PIX library"}</p>
      </div>
      {featuresQuery.isPending ? <p className="pix-catalog-state">Loading feature presentations…</p> : null}
      {featuresQuery.isError ? <p className="pix-catalog-state" role="alert">Feature presentations could not load.</p> : null}
      {visibleFeatures.length > 0 ? (
        <div className="pix-feature-grid">
          {visibleFeatures.slice(0, featureFill).map((feature) => (
            <article className="pix-feature-poster" key={feature.film_key}>
              <a className="pix-feature-poster-image" href={`#feature/${encodeURIComponent(feature.film_key)}`} aria-label={`Open the ${feature.title} feature presentation`}>
                {feature.poster_key && hasPixPoster(feature.poster_key) ? (
                  <PixFeaturePosterImage posterKey={feature.poster_key} alt={`${feature.title} ${feature.release_year} movie poster`} loading="lazy" />
                ) : (
                  <span className="pix-feature-poster-missing" aria-hidden="true"><b>{feature.release_year}</b><small>FEATURE PRESENTATION</small></span>
                )}
              </a>
              <span className="pix-feature-poster-overlay">
                <strong>{feature.title}</strong>
                <small>{feature.release_year} · {feature.profile_name} · {feature.source_status === "pending" ? "Awaiting upload" : "Feature presentation"}</small>
                <a href={`#feature/${encodeURIComponent(feature.film_key)}`}>Watch feature</a>
              </span>
            </article>
          ))}
        </div>
      ) : !featuresQuery.isPending && !featuresQuery.isError ? (
        <p className="pix-catalog-state">No feature posters are available yet.</p>
      ) : null}
    </section>
  );
}

function classicSectionMeta(sectionKey: PixClassicSection["key"], card: PixClassicSectionCard): string {
  if ((sectionKey === "top_rated" || sectionKey === "hidden_gems") && card.win_rate !== null) {
    return `${card.release_year} · ${Math.round(card.win_rate * 100)}% liked · ${card.votes.toLocaleString()} votes`;
  }
  if (sectionKey === "recent") {
    const addedAt = new Date(card.updated_at);
    const addedLabel = Number.isNaN(addedAt.getTime()) || addedAt.getFullYear() < 2001 ? null : compactPullDate(card.updated_at);
    return `${card.release_year} · ${card.profile_name}${addedLabel ? ` · Added ${addedLabel}` : ""}`;
  }
  return `${card.release_year} · ${card.profile_name} · ${card.source_status === "pending" ? "Awaiting upload" : "Feature presentation"}`;
}

function PixClassicCard({ sectionKey, card }: { sectionKey: PixClassicSection["key"]; card: PixClassicSectionCard }) {
  return (
    <article className="pix-feature-poster pix-row-card">
      <a className="pix-feature-poster-image" href={`#feature/${encodeURIComponent(card.film_key)}`} aria-label={`Open the ${card.title} feature presentation`}>
        {card.poster_key && hasPixPoster(card.poster_key) ? (
          <PixFeaturePosterImage posterKey={card.poster_key} alt={`${card.title} ${card.release_year} movie poster`} loading="lazy" />
        ) : (
          <span className="pix-feature-poster-missing" aria-hidden="true"><b>{card.release_year}</b><small>FEATURE PRESENTATION</small></span>
        )}
      </a>
      <span className="pix-feature-poster-overlay">
        <strong>{card.title}</strong>
        <small>{classicSectionMeta(sectionKey, card)}</small>
        <a href={`#feature/${encodeURIComponent(card.film_key)}`}>Watch feature</a>
      </span>
    </article>
  );
}

// Per-row chrome for the landing page, modelled on the CINE tool
// headers and the ATTRACTIONS row chrome: a > fold chevron that folds
// the row's posters up or down, a ⠿ grip that arms dragging the whole
// row up or down the page by its header, and ↑/↓ buttons that move the
// row one slot — the touch/keyboard path for the same reorder. The
// arrangement (order + folded rows) is saved to the viewer's profile.
type PixLandingRowChrome = {
  position: number;
  collapsed: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggleCollapsed: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onGripPress: () => void;
  onGripRelease: () => void;
};

function PixHomeRowHeader({ headingId, title, note, chrome }: { headingId: string; title: string; note: string; chrome: PixLandingRowChrome }) {
  return (
    <div className="pix-home-section-heading pix-home-row-heading">
      <div>
        <span>{String(chrome.position).padStart(2, "0")}</span>
        <h2 id={headingId}>{title}</h2>
      </div>
      <div className="pix-home-row-tagline">
        <p>{note}</p>
        <div className="pix-home-row-tools">
          <button
            type="button"
            className="pix-home-row-grip"
            aria-label={`Drag to reorder the ${title} row`}
            title="Press and drag to reorder this row"
            onMouseDown={chrome.onGripPress}
            onMouseUp={chrome.onGripRelease}
            onTouchStart={chrome.onGripPress}
            onTouchEnd={chrome.onGripRelease}
          >⠿</button>
          <button
            type="button"
            className="pix-home-row-move"
            aria-label={`Move the ${title} row up`}
            title="Move this row up"
            disabled={!chrome.canMoveUp}
            onClick={chrome.onMoveUp}
          >↑</button>
          <button
            type="button"
            className="pix-home-row-move"
            aria-label={`Move the ${title} row down`}
            title="Move this row down"
            disabled={!chrome.canMoveDown}
            onClick={chrome.onMoveDown}
          >↓</button>
          <button
            type="button"
            className="pix-home-row-fold"
            aria-expanded={!chrome.collapsed}
            aria-label={chrome.collapsed ? `Unfold the ${title} row` : `Fold the ${title} row`}
            title={chrome.collapsed ? "Unfold this row" : "Fold this row"}
            onClick={chrome.onToggleCollapsed}
          ><span className={`pix-home-fold-chevron${chrome.collapsed ? " is-folded" : ""}`} aria-hidden="true">{">"}</span></button>
        </div>
      </div>
    </div>
  );
}

function PixClassicRow({ section, chrome, pool = [] }: { section: PixClassicSection; chrome: PixLandingRowChrome; pool?: PixClassicSectionCard[] }) {
  const headingId = `pix-row-${section.key}-heading`;
  // EVERY landing feature row is a full-width (100%) seamless endless
  // loop now, streaming in alternating directions down the page: even
  // rows stream right, odd rows stream left, until a click on the
  // row's own controls switches that row's direction.
  const isChannel = section.key === "horror" || section.key === "recent";
  // A channel can never be empty and never shows a poster-less slot:
  // only films whose poster PIX actually holds make the shelf, and the
  // shared poster pool tops the shelf up when the channel runs short.
  const channelFilms = useMemo(() => {
    if (!isChannel) return section.films;
    const own = section.films.filter((card) => card.poster_key && hasPixPoster(card.poster_key));
    if (own.length >= 8) return own;
    const seen = new Set(own.map((card) => card.film_key));
    return [...own, ...pool.filter((card) => !seen.has(card.film_key))].slice(0, 12);
  }, [isChannel, section.films, pool]);
  const visibleFilms = isChannel ? channelFilms : section.films.slice(0, 12);
  const direction: 1 | -1 = chrome.position % 2 === 1 ? 1 : -1;
  return (
    <section className={`pix-home-row ${isChannel ? "is-channel" : ""}`} aria-labelledby={headingId}>
      <PixHomeRowHeader headingId={headingId} title={section.title} note={section.note} chrome={chrome} />
      {!chrome.collapsed && visibleFilms.length > 0 ? (
        <LoopTrack label={`${section.title} — films stream by in an endless repeating loop`} fullBleed direction={direction}>
          {visibleFilms.map((card) => <PixClassicCard key={card.film_key} sectionKey={section.key} card={card} />)}
        </LoopTrack>
      ) : null}
    </section>
  );
}

function PixTrendingRow({ chrome }: { chrome: PixLandingRowChrome }) {
  const trendingQuery = useQuery({ queryKey: ["pix-trending"], queryFn: () => api.listPixTrending({}) });
  const movies = trendingQuery.data?.movies ?? [];
  const direction: 1 | -1 = chrome.position % 2 === 1 ? 1 : -1;
  return (
    <section className="pix-home-row" aria-labelledby="pix-row-trending-heading">
      <PixHomeRowHeader headingId="pix-row-trending-heading" title="Your Top PIX.MOV" note={trendingQuery.data?.detail ?? "What PIX players are voting on right now"} chrome={chrome} />
      {chrome.collapsed ? null : (<>
      {trendingQuery.isPending ? <p className="pix-catalog-state">Loading your top films…</p> : null}
      {trendingQuery.isError ? <p className="pix-catalog-state" role="alert">Your top films could not load.</p> : null}
      {!trendingQuery.isPending && !trendingQuery.isError && movies.length === 0 ? (
        <p className="pix-catalog-state">No top films yet — play Movie vs Movie and the most-voted films will surface here.</p>
      ) : null}
      {movies.length > 0 ? (
        <LoopTrack label="Your top PIX.MOV films — streaming by in an endless repeating loop" fullBleed direction={direction}>
          {movies.slice(0, 12).map((movie) => (
            <article className="pix-feature-poster pix-row-card" key={movie.imdb_id}>
              <a className="pix-feature-poster-image" href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open ${movie.title} (${movie.year})`}>
                {movie.poster_key && hasPixPoster(movie.poster_key) ? (
                  <PixFeaturePosterImage posterKey={movie.poster_key} alt={`${movie.title} ${movie.year} movie poster`} loading="lazy" />
                ) : (
                  <span className="pix-feature-poster-missing" aria-hidden="true"><b>{movie.year}</b><small>YOUR TOP PIX.MOV</small></span>
                )}
              </a>
              <span className="pix-feature-poster-overlay">
                <strong>{movie.title}</strong>
                <small>{movie.year} · {movie.genre} · {movie.votes.toLocaleString()} votes</small>
                <a href={`#screening/${encodeURIComponent(movie.imdb_id)}`}>Open screening</a>
              </span>
            </article>
          ))}
        </LoopTrack>
      ) : null}
      </>)}
    </section>
  );
}

function PixUserContentRow({ chrome }: { chrome: PixLandingRowChrome }) {
  const shortsQuery = useQuery({ queryKey: ["pix-cine-trending-shorts"], queryFn: () => api.listCineTrendingShorts({}) });
  const controlQuery = useQuery({ queryKey: ["pix-control"], queryFn: () => api.getPixControlState({}) });
  const shorts = shortsQuery.data?.shorts ?? [];
  const playable = shorts.filter((short) => short.preview_url);
  const [sequence, setSequence] = useState<{ items: PixShortSequenceItem[]; position: number } | null>(null);

  function playFrom(startShort: CineTrendingShort) {
    const startIndex = playable.findIndex((short) => short.asset_id === startShort.asset_id);
    if (startIndex < 0) return;
    setSequence({
      items: playable.map((short) => ({
        id: `cine-${short.asset_id}`,
        title: short.title,
        subtitle: "CINE creation",
        src: short.preview_url ?? "",
        assetId: short.asset_id,
      })),
      position: startIndex,
    });
  }

  async function advanceSequence(): Promise<boolean> {
    if (!sequence || sequence.position + 1 >= sequence.items.length) return false;
    setSequence({ items: sequence.items, position: sequence.position + 1 });
    return true;
  }

  const currentItem = sequence ? sequence.items[sequence.position] : undefined;

  return (
    <section className="pix-home-row" aria-labelledby="pix-row-user-content-heading">
      <PixHomeRowHeader headingId="pix-row-user-content-heading" title="User Content" note="CINE creations and SHOWCASE uploads" chrome={chrome} />
      {chrome.collapsed ? null : (<>
      {shortsQuery.isPending ? <p className="pix-catalog-state">Loading user creations…</p> : null}
      {shortsQuery.isError ? <p className="pix-catalog-state" role="alert">User creations could not load.</p> : null}
      {!shortsQuery.isPending && !shortsQuery.isError && shorts.length === 0 ? (
        <p className="pix-catalog-state">Nothing here yet — films cut in CINE and shared to a SHOWCASE will appear in this row.</p>
      ) : null}
      {shorts.length > 0 ? (
        <LoopTrack label="User content shorts — streaming by in an endless repeating loop" fullBleed direction={chrome.position % 2 === 1 ? 1 : -1}>
          {shorts.slice(0, 12).map((short) => (
            <CineTrendingShortCard key={short.asset_id} short={short} onPlaySequence={() => playFrom(short)} />
          ))}
        </LoopTrack>
      ) : null}
      {sequence && currentItem ? (
        <PixShortSequencePlayer
          key={currentItem.id}
          item={currentItem}
          position={sequence.position + 1}
          total={sequence.items.length}
          ad={controlQuery.data?.ads[0] ?? null}
          initialPhase="clip"
          onAdvance={advanceSequence}
          onClose={() => setSequence(null)}
        />
      ) : null}
      </>)}
    </section>
  );
}

function PixCustomListRow({ list, chrome }: { list: PixUserList; chrome: PixLandingRowChrome }) {
  const headingId = `pix-row-list-${list.id}-heading`;
  const cards = list.movies.filter((movie) => hasPixPoster(movie.poster_key));
  const direction: 1 | -1 = chrome.position % 2 === 1 ? 1 : -1;
  return (
    <section className="pix-home-row" aria-labelledby={headingId}>
      <PixHomeRowHeader
        headingId={headingId}
        title={list.name}
        note={`Your custom list · ${list.movies.length} film${list.movies.length === 1 ? "" : "s"} · ${list.visibility === "public" ? "Public" : "Private"}`}
        chrome={chrome}
      />
      {chrome.collapsed ? null : cards.length > 0 ? (
        <LoopTrack label={`${list.name} — your custom list, streaming by in an endless repeating loop`} fullBleed direction={direction}>
          {cards.slice(0, 12).map((movie) => (
            <article className="pix-feature-poster pix-row-card" key={movie.imdb_id}>
              <a className="pix-feature-poster-image" href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open ${movie.title} (${movie.year})`}>
                <PixFeaturePosterImage posterKey={movie.poster_key} alt={`${movie.title} ${movie.year} movie poster`} loading="lazy" />
              </a>
              <span className="pix-feature-poster-overlay">
                <strong>{movie.title}</strong>
                <small>{movie.year} · {movie.genre}</small>
                <a href={`#screening/${encodeURIComponent(movie.imdb_id)}`}>Open screening</a>
              </span>
            </article>
          ))}
        </LoopTrack>
      ) : (
        <p className="pix-catalog-state">{list.movies.length === 0 ? "No films in this list yet — add films from your Profile and they will stream here." : "None of this list’s films carry a poster in PIX yet, so there is nothing to stream here."}</p>
      )}
    </section>
  );
}

function PixHomeSections() {
  const sectionsQuery = useQuery({ queryKey: ["pix-classic-sections"], queryFn: () => api.listPixClassicSections({}) });
  // The frontend poster pool: every feature poster PIX holds, kept
  // ready so a CHANNEL row can always fill its shelf — even if the
  // sections feed returns a channel short or empty.
  const featuresQuery = useQuery({ queryKey: ["pix-classic-features"], queryFn: () => api.listPixClassicFilms({}) });
  const pool = useMemo<PixClassicSectionCard[]>(
    () => (featuresQuery.data?.features ?? [])
      .filter((feature) => feature.poster_key && hasPixPoster(feature.poster_key))
      .map((feature) => ({
        film_key: feature.film_key,
        title: feature.title,
        release_year: feature.release_year,
        profile_name: feature.profile_name,
        poster_key: feature.poster_key,
        still_url: feature.still_url,
        source_status: feature.source_status,
        genre: "",
        win_rate: null,
        votes: 0,
        appearances: 0,
        imdb_id: null,
        available_count: 0,
        total_segments: 0,
        updated_at: "",
      })),
    [featuresQuery.data],
  );
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  // The viewer's saved landing arrangement: row order + folded rows,
  // stored on their profile (the ATTRACTIONS layout pattern).
  const queryClient = useQueryClient();
  const layoutQuery = useQuery({ queryKey: ["pix-landing-layout"], queryFn: () => api.getPixLandingLayout({}) });
  const saveLayout = useMutation({
    mutationFn: (next: { row_order: string[]; collapsed: string[] }) => api.savePixLandingLayout(next),
    onSuccess: (data) => { queryClient.setQueryData(["pix-landing-layout"], data); },
  });
  // Drag & drop reorder, armed only while a row's grip is pressed (the
  // ATTRACTIONS pattern) so poster clicks and shelf scrolling are never
  // hijacked. The ↑/↓ header buttons commit the same moves directly.
  const [armedKey, setArmedKey] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const sections = sectionsQuery.data?.sections ?? [];
  const byKey = new Map(sections.map((section) => [section.key, section]));
  const channelMeta: Partial<Record<PixClassicSection["key"], { title: string; note: string }>> = {
    horror: { title: "Horror", note: "Terror from the public-domain vault" },
    recent: { title: "Recently Uploaded", note: "Newest additions to the vault" },
  };
  // Row definitions in the page's default order. A classic section
  // that comes back missing is synthesized for the two channels from
  // the pool — the channel still shows, posters and all, instead of
  // vanishing. The viewer's custom lists ride at the end by default,
  // one row per list, under `list:<id>` keys.
  type LandingRowDef = { key: string; render: (chrome: PixLandingRowChrome) => ReactNode };
  const defs: LandingRowDef[] = [];
  const pushClassicDef = (key: PixClassicSection["key"]) => {
    const section = byKey.get(key);
    if (section) {
      defs.push({ key, render: (chrome) => <PixClassicRow section={section} chrome={chrome} pool={pool} /> });
      return;
    }
    const meta = channelMeta[key];
    if (meta && pool.length > 0) {
      defs.push({ key, render: (chrome) => <PixClassicRow section={{ key, title: meta.title, note: meta.note, films: pool.slice(0, 12) }} chrome={chrome} pool={pool} /> });
    }
  };
  pushClassicDef("top_rated");
  pushClassicDef("horror");
  pushClassicDef("recent");
  pushClassicDef("comedy");
  // One row per additional genre the vault holds (genre:<slug> keys
  // from the sections feed), right after the named genre channels.
  for (const section of sections) {
    if (section.key.startsWith("genre:")) {
      defs.push({ key: section.key, render: (chrome) => <PixClassicRow section={section} chrome={chrome} pool={pool} /> });
    }
  }
  defs.push({ key: "user_content", render: (chrome) => <PixUserContentRow chrome={chrome} /> });
  defs.push({ key: "trending", render: (chrome) => <PixTrendingRow chrome={chrome} /> });
  pushClassicDef("hidden_gems");
  for (const list of listsQuery.data?.lists ?? []) {
    defs.push({ key: `list:${list.id}`, render: (chrome) => <PixCustomListRow list={list} chrome={chrome} /> });
  }
  // Apply the saved order: saved keys first (in saved order), then any
  // rows the saved order doesn't know yet, in default order.
  const savedOrder = layoutQuery.data?.row_order ?? [];
  const defsByKey = new Map(defs.map((def) => [def.key, def]));
  const orderedDefs: LandingRowDef[] = [];
  for (const key of savedOrder) {
    const def = defsByKey.get(key);
    if (def) {
      orderedDefs.push(def);
      defsByKey.delete(key);
    }
  }
  for (const def of defs) {
    if (defsByKey.has(def.key)) orderedDefs.push(def);
  }
  const orderedKeys = orderedDefs.map((def) => def.key);
  const collapsedKeys = layoutQuery.data?.collapsed ?? [];

  function commitLayout(nextOrder: string[], nextCollapsed: string[]) {
    queryClient.setQueryData(["pix-landing-layout"], { row_order: nextOrder, collapsed: nextCollapsed });
    saveLayout.mutate({ row_order: nextOrder, collapsed: nextCollapsed });
  }

  function moveRow(key: string, delta: 1 | -1) {
    const from = orderedKeys.indexOf(key);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= orderedKeys.length) return;
    const next = [...orderedKeys];
    next.splice(from, 1);
    next.splice(to, 0, key);
    commitLayout(next, collapsedKeys);
  }

  function toggleCollapsed(key: string) {
    const next = collapsedKeys.includes(key)
      ? collapsedKeys.filter((item) => item !== key)
      : [...collapsedKeys, key];
    commitLayout(orderedKeys, next);
  }

  function chromeFor(key: string, index: number): PixLandingRowChrome {
    return {
      position: index + 1,
      collapsed: collapsedKeys.includes(key),
      canMoveUp: index > 0,
      canMoveDown: index < orderedDefs.length - 1,
      onToggleCollapsed: () => toggleCollapsed(key),
      onMoveUp: () => moveRow(key, -1),
      onMoveDown: () => moveRow(key, 1),
      onGripPress: () => setArmedKey(key),
      onGripRelease: () => { if (!dragKey) setArmedKey(null); },
    };
  }

  function clearDrag() {
    setDragKey(null);
    setOverKey(null);
    setArmedKey(null);
  }

  function commitDrop(target: string) {
    if (dragKey && dragKey !== target) {
      const next = orderedKeys.filter((key) => key !== dragKey);
      next.splice(next.indexOf(target), 0, dragKey);
      commitLayout(next, collapsedKeys);
    }
    clearDrag();
  }

  // The ATTRACTIONS bar's GENRES menu asks for a genre's row: unfold
  // it if it is folded, then scroll its heading into view.
  const orderedKeysSignature = orderedKeys.join(",");
  const collapsedKeysSignature = collapsedKeys.join(",");
  useEffect(() => {
    function openLandingRow(event: Event) {
      const key = (event as CustomEvent<{ key?: string }>).detail?.key;
      if (!key) return;
      if (collapsedKeysSignature.split(",").includes(key)) {
        commitLayout(orderedKeysSignature.split(","), collapsedKeysSignature.split(",").filter((item) => item !== key));
      }
      window.setTimeout(() => {
        document.getElementById(`pix-row-${key}-heading`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
    window.addEventListener("pix:open-landing-row", openLandingRow);
    return () => window.removeEventListener("pix:open-landing-row", openLandingRow);
    // commitLayout only drives the query cache and the save mutation,
    // so the signature strings fully capture what the handler needs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedKeysSignature, collapsedKeysSignature]);

  return (
    <>
      {sectionsQuery.isPending ? <p className="pix-catalog-state">Loading the PIX library rows…</p> : null}
      {sectionsQuery.isError ? <p className="pix-catalog-state" role="alert">The PIX library rows could not load.</p> : null}
      {sectionsQuery.data ? orderedDefs.map((def, index) => (
        <div
          key={def.key}
          className={`pix-home-row-slot${dragKey === def.key ? " is-dragging" : ""}${overKey === def.key && dragKey !== null && dragKey !== def.key ? " is-drop-target" : ""}`}
          draggable={armedKey === def.key}
          onDragStart={(event) => {
            setDragKey(def.key);
            event.dataTransfer.effectAllowed = "move";
            try { event.dataTransfer.setData("text/plain", def.key); } catch { /* dataTransfer is best-effort */ }
          }}
          onDragOver={(event) => {
            if (dragKey) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOverKey(def.key);
            }
          }}
          onDrop={(event) => { event.preventDefault(); commitDrop(def.key); }}
          onDragEnd={clearDrag}
        >
          {def.render(chromeFor(def.key, index))}
        </div>
      )) : null}
    </>
  );
}

function ClassicFilmShowcase({ filmKey }: { filmKey: string }) {
  const queryClient = useQueryClient();
  const collectionQuery = useQuery({
    queryKey: ["pix-classic-film", filmKey],
    queryFn: () => api.listPixClassicFilm({ film_key: filmKey }),
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  // Billboard between segments: when a part ends, a famous-quote
  // billboard covers the player for exactly BILLBOARD_SECONDS before
  // the next part auto-plays.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [billboardQuote, setBillboardQuote] = useState<BillboardQuote | null>(null);
  const [billboardSecondsLeft, setBillboardSecondsLeft] = useState(BILLBOARD_SECONDS);
  const quoteCursorRef = useRef<number | null>(null);
  const clips = collectionQuery.data?.clips ?? [];
  const selectedClip: PixClassicClip | undefined = clips[selectedIndex];
  const refreshMutation = useMutation({
    mutationFn: () => api.refreshPixClassicStreams({ film_key: filmKey }),
    onSuccess: async (result) => {
      if (!result.ok) {
        setRefreshError(result.error);
        return;
      }
      setRefreshError(null);
      queryClient.setQueryData(["pix-classic-film", filmKey], result.collection);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pix-classic-film", filmKey] }),
        queryClient.invalidateQueries({ queryKey: ["pix-classic-features"] }),
      ]);
    },
    onError: () => setRefreshError("The Backblaze B2 collection could not be checked."),
  });

  useEffect(() => {
    setSelectedIndex(0);
    setPlaybackError(false);
    setRefreshError(null);
    setIsPlaying(false);
    setBillboardQuote(null);
  }, [filmKey]);

  // The billboard clock: exactly BILLBOARD_SECONDS on screen, then the
  // next part starts automatically.
  useEffect(() => {
    if (!billboardQuote) return;
    setBillboardSecondsLeft(BILLBOARD_SECONDS);
    const startedAt = Date.now();
    const ticker = window.setInterval(() => {
      setBillboardSecondsLeft(Math.max(0, BILLBOARD_SECONDS - Math.floor((Date.now() - startedAt) / 1000)));
    }, 200);
    const advance = window.setTimeout(() => {
      setBillboardQuote(null);
      playNextClip();
    }, BILLBOARD_SECONDS * 1000);
    return () => {
      window.clearInterval(ticker);
      window.clearTimeout(advance);
    };
    // playNextClip only drives stable state setters and the functional
    // index update, so the closure from this render is safe to reuse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billboardQuote]);

  useEffect(() => {
    if (clips.length > 0 && selectedIndex >= clips.length) setSelectedIndex(0);
  }, [clips.length, selectedIndex]);

  // Clip selector: one narrow horizontal row of still-frame tiles under
  // the player, scrolled with the arrow buttons (or by touch / wheel).
  const clipRowRef = useRef<HTMLDivElement | null>(null);
  const [clipRowScroll, setClipRowScroll] = useState({ left: false, right: false });

  function updateClipRowScroll() {
    const row = clipRowRef.current;
    if (!row) return;
    setClipRowScroll({
      left: row.scrollLeft > 4,
      right: row.scrollLeft < row.scrollWidth - row.clientWidth - 4,
    });
  }

  useEffect(() => {
    updateClipRowScroll();
  }, [clips.length]);

  // Keep the playing clip's tile in view as the film auto-advances.
  useEffect(() => {
    const row = clipRowRef.current;
    const tile = row?.children[selectedIndex] as HTMLElement | undefined;
    if (!row || !tile) return;
    row.scrollTo({ left: Math.max(0, tile.offsetLeft - 8), behavior: "smooth" });
  }, [selectedIndex]);

  function scrollClipRow(direction: 1 | -1) {
    const row = clipRowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * Math.max(240, row.clientWidth * 0.8), behavior: "smooth" });
  }

  function chooseClip(index: number) {
    setPlaybackError(false);
    setIsPlaying(false);
    setBillboardQuote(null);
    setSelectedIndex(index);
  }

  function playNextClip() {
    if (clips.length === 0) return;
    setPlaybackError(false);
    setIsPlaying(false);
    setSelectedIndex((current) => Math.min(current + 1, clips.length - 1));
  }

  // A part ended: if a playable next part exists, hold the billboard
  // for five seconds first (its timer advances the film); if the next
  // part is still awaiting upload, fall through to it as before; if
  // this was the final part, the film simply ends.
  function handleSegmentEnded() {
    setIsPlaying(false);
    const nextClip = clips[selectedIndex + 1];
    if (!nextClip) return;
    if (!nextClip.stream_url) {
      playNextClip();
      return;
    }
    if (quoteCursorRef.current === null) {
      quoteCursorRef.current = Math.floor(Math.random() * FAMOUS_QUOTES.length);
    }
    const quote = FAMOUS_QUOTES[quoteCursorRef.current % FAMOUS_QUOTES.length];
    quoteCursorRef.current += 1;
    if (quote) setBillboardQuote(quote);
    else playNextClip();
  }

  const film = collectionQuery.data;
  const showComingSoon = false;

  return (
    <section className="pix-classic-showcase" aria-labelledby="classic-feature-heading">
      {collectionQuery.isPending ? <p className="pix-catalog-state">Loading the feature presentation…</p> : null}
      {collectionQuery.isError ? <p className="pix-catalog-state" role="alert">This feature presentation could not load.</p> : null}
      {film ? (
        <>
          <div className="pix-home-section-heading pix-classic-heading">
            <div><span>02</span><h2 id="classic-feature-heading">{film.title} ({film.release_year})</h2></div>
            <p>{film.genre || "Classic film"} · {film.total_segments}-part presentation · {film.profile_name}</p>
          </div>
          {showComingSoon ? (
            <div className="pix-classic-coming-soon">
              <div className="pix-classic-coming-poster">
                {film.poster_key && hasPixPoster(film.poster_key) ? (
                  <PixPosterImage posterKey={film.poster_key} alt={`${film.title} ${film.release_year} movie poster`} loading="eager" />
                ) : <div className="pix-classic-poster-missing">Poster unavailable</div>}
                <span>CLIPS COMING SOON</span>
              </div>
              <div className="pix-classic-coming-copy">
                <p>FEATURE PRESENTATION</p>
                <h3>{film.title}</h3>
                <dl>
                  <div><dt>Released</dt><dd>{film.release_year}</dd></div>
                  <div><dt>Genre</dt><dd>{film.genre || "Classic film"}</dd></div>
                  <div><dt>Presentation</dt><dd>{film.total_segments} prepared chapters</dd></div>
                </dl>
                {film.synopsis ? <p className="pix-classic-synopsis">{film.synopsis}</p> : null}
                <div className="pix-classic-coming-status" role="status">
                  <strong>Clips coming soon</strong>
                  <span>The film is prepared for PIX. Playback will appear here after the chapter files are hosted.</span>
                </div>
                {film.source_url ? <a href={film.source_url} target="_blank" rel="noopener noreferrer">Film details on IMDb ↗</a> : null}
              </div>
            </div>
          ) : (
            <>
              <div className="pix-classic-player-frame">
                <div className={`pix-classic-player-stage${isPlaying ? " is-playing" : ""}`} ref={stageRef}>
                  <video
                    key={selectedClip?.stream_url ?? `pending-${selectedClip?.segment_number ?? 1}`}
                    ref={videoRef}
                    src={selectedClip?.stream_url ?? undefined}
                    poster={film.still_url ?? selectedClip?.thumbnail_url ?? undefined}
                    controls
                    autoPlay={Boolean(selectedClip?.stream_url)}
                    playsInline
                    preload="metadata"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={handleSegmentEnded}
                    onError={() => setPlaybackError(true)}
                    aria-label={`${film.title} ${film.release_year}, ${selectedClip?.title ?? `Part 1 of ${film.total_segments}`}`}
                  />
                  {billboardQuote ? (
                    <BillboardQuoteCard quote={billboardQuote} secondsLeft={billboardSecondsLeft} nextLabel="Next part" variant="overlay" />
                  ) : null}
                  {selectedClip?.stream_url && !billboardQuote ? (
                    <PlayerControlButtons videoRef={videoRef} containerRef={stageRef} label={`${film.title} (${film.release_year})`} />
                  ) : null}
                  {!selectedClip?.stream_url || playbackError ? (
                    <div className="pix-classic-player-pending" role="status">
                      <span>{String(selectedClip?.segment_number ?? 1).padStart(2, "0")}</span>
                      <strong>{film.title} ({film.release_year})</strong>
                      <p>{playbackError ? "This clip could not be streamed yet." : "The player is ready. Playback will activate when this clip reaches the public-domain bucket."}</p>
                    </div>
                  ) : null}
                  <div className="pix-classic-player-caption">
                    <span>PART {String(selectedClip?.segment_number ?? 1).padStart(2, "0")} / {String(film.total_segments).padStart(2, "0")}</span>
                    <strong>{selectedClip?.title ?? `${film.title} (${film.release_year}) - Part 1 of ${film.total_segments}`}</strong>
                    <small>{selectedClip ? classicDurationLabel(selectedClip.duration_ms) : "—"} · next part plays automatically</small>
                  </div>
                </div>
                <div className="pix-classic-player-info">
                  <div>
                    <p>THE COMPLETE FILM, IN SEQUENCE</p>
                    <h3>Choose a chapter or begin at part one.</h3>
                    <span>{film.detail}</span>
                  </div>
                  <div className="pix-classic-player-actions">
                    <button type="button" onClick={() => chooseClip(0)}>Play from beginning</button>
                    <button type="button" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
                      {refreshMutation.isPending ? "Checking B2…" : "Refresh uploaded clips"}
                    </button>
                  </div>
                  {refreshError ? <p className="pix-classic-refresh-error" role="alert">{refreshError}</p> : null}
                </div>
              </div>
              <div className="pix-classic-clip-row-wrap">
                <button
                  type="button"
                  className="pix-classic-clip-arrow"
                  onClick={() => scrollClipRow(-1)}
                  disabled={!clipRowScroll.left}
                  aria-label={`Scroll ${film.title} clips back`}
                >‹</button>
                <div
                  className="pix-classic-clip-row"
                  ref={clipRowRef}
                  onScroll={updateClipRowScroll}
                  aria-label={`${film.title} ${film.release_year} clip selector`}
                >
                  {clips.map((clip, index) => (
                    <button
                      type="button"
                      className={`pix-classic-clip-tile${index === selectedIndex ? " is-active" : ""}`}
                      onClick={() => chooseClip(index)}
                      aria-pressed={index === selectedIndex}
                      aria-label={`Play clip ${clip.segment_number} of ${film.total_segments}: ${clip.title}${clip.stream_url ? "" : " (awaiting upload)"}`}
                      key={clip.segment_number}
                    >
                      <span className="pix-classic-clip-thumb" aria-hidden="true">
                        {clip.thumbnail_url ? (
                          <img src={clip.thumbnail_url} alt="" loading="lazy" />
                        ) : film.still_url ? (
                          <img src={film.still_url} alt="" loading="lazy" />
                        ) : clip.stream_url ? (
                          <video src={`${clip.stream_url}#t=1`} preload="metadata" muted playsInline tabIndex={-1} />
                        ) : (
                          <span className="pix-classic-clip-thumb-missing">{String(clip.segment_number).padStart(2, "0")}</span>
                        )}
                        <b>{String(clip.segment_number).padStart(2, "0")}</b>
                      </span>
                      <small aria-hidden="true">{classicDurationLabel(clip.duration_ms)}{clip.stream_url ? "" : " · awaiting upload"}</small>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="pix-classic-clip-arrow"
                  onClick={() => scrollClipRow(1)}
                  disabled={!clipRowScroll.right}
                  aria-label={`Scroll ${film.title} clips forward`}
                >›</button>
              </div>
            </>
          )}
        </>
      ) : null}
    </section>
  );
}

function FeaturePresentationPage() {
  const [filmKey, setFilmKey] = useState(() => itemFromHash(window.location.hash, "feature") ?? "dracula-1931");

  useEffect(() => {
    function followFeatureLink() {
      setFilmKey(itemFromHash(window.location.hash, "feature") ?? "dracula-1931");
    }
    window.addEventListener("hashchange", followFeatureLink);
    return () => window.removeEventListener("hashchange", followFeatureLink);
  }, []);

  return (
    <section className="pix-presentation-page" aria-label="Feature presentation">
      <div className="pix-presentation-nav">
        <a href="#pix">← Features</a>
        <span>OUR FEATURE PRESENTATION</span>
      </div>
      <ClassicFilmShowcase filmKey={filmKey} />
      <PixFeaturesShelf related currentFilmKey={filmKey} />
    </section>
  );
}

type PixShortSequenceItem = {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  assetId?: number;
};

function PixShortSequencePlayer({
  item,
  position,
  total,
  ad,
  initialPhase,
  onAdvance,
  onClose,
}: {
  item: PixShortSequenceItem;
  position: number;
  total: number;
  ad: PixAd | null;
  initialPhase: "clip" | "ad";
  onAdvance: () => Promise<boolean>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"clip" | "ad" | "loading" | "error">(initialPhase);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finishedRef = useRef(false);
  // Between shorts the break runs exactly five seconds: a real ad when
  // one is booked, otherwise the rotating famous-quote billboard.
  const billboardQuote = FAMOUS_QUOTES[(position - 1) % FAMOUS_QUOTES.length];
  const playStartedAtRef = useRef<number | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (phase !== "ad") return;
    if (secondsLeft <= 0) {
      setPhase("loading");
      void onAdvance().then((advanced) => {
        if (!advanced) setPhase("error");
      });
      return;
    }
    const timeout = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1_000);
    return () => window.clearTimeout(timeout);
  }, [onAdvance, phase, secondsLeft]);

  function recordPlay() {
    playStartedAtRef.current = Date.now();
    if (playedRef.current || item.assetId === undefined) return;
    playedRef.current = true;
    void api.recordCineShortSignal({ asset_id: item.assetId, signal: "play", watch_ms: 0 }).catch(() => undefined);
  }

  function finishClip() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (item.assetId !== undefined) {
      const watchMs = playStartedAtRef.current === null ? 0 : Math.max(0, Math.min(120_000, Date.now() - playStartedAtRef.current));
      void api.recordCineShortSignal({ asset_id: item.assetId, signal: "complete", watch_ms: watchMs }).catch(() => undefined);
    }
    setSecondsLeft(5);
    setPhase("ad");
  }

  return (
    <div className="pix-sequence-shell" role="dialog" aria-modal="true" aria-label="PIX Shorts sequence player" ref={shellRef}>
      <button type="button" className="pix-sequence-close" onClick={onClose} aria-label="Close Shorts sequence">×</button>
      {phase === "clip" ? (
        <div className="pix-sequence-video-stage">
          <video
            key={item.id}
            ref={videoRef}
            src={item.src}
            controls
            autoPlay
            playsInline
            onPlay={recordPlay}
            onEnded={finishClip}
            onTimeUpdate={(event) => {
              if (event.currentTarget.currentTime >= 120) {
                event.currentTarget.pause();
                finishClip();
              }
            }}
            aria-label={`${item.title}, short ${position} of ${total}`}
          />
          <PlayerControlButtons videoRef={videoRef} containerRef={shellRef} label={item.title} align="start" />
          <div className="pix-sequence-meta">
            <span>{String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
            <strong>{item.title}</strong>
            <small>{item.subtitle} · 2:00 maximum</small>
          </div>
        </div>
      ) : phase === "ad" ? (
        ad ? (
          <div className="pix-sequence-ad" aria-live="polite">
            <span className="pix-sequence-ad-label">ADVERTISEMENT</span>
            <div className="pix-sequence-countdown" aria-label={`${secondsLeft} seconds remaining`}>{secondsLeft}</div>
            <h2>{ad.title}</h2>
            <p>{ad.body || "The next short will begin automatically."}</p>
            {ad.cta_url && ad.cta_label ? <a href={ad.cta_url} target="_blank" rel="noopener noreferrer">{ad.cta_label}</a> : null}
            <small>Next clip in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}</small>
          </div>
        ) : billboardQuote ? (
          <BillboardQuoteCard quote={billboardQuote} secondsLeft={secondsLeft} nextLabel="Next clip" variant="page" />
        ) : (
          <div className="pix-sequence-ad" aria-live="polite">
            <span className="pix-sequence-ad-label">BILLBOARD</span>
            <div className="pix-sequence-countdown" aria-label={`${secondsLeft} seconds remaining`}>{secondsLeft}</div>
            <h2>PIX.MOV</h2>
            <p>The next short will begin automatically.</p>
            <small>Next clip in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}</small>
          </div>
        )
      ) : phase === "loading" ? (
        <div className="pix-sequence-wait" aria-live="polite"><span className="loading-mark" /><strong>Preparing the next clip…</strong></div>
      ) : (
        <div className="pix-sequence-wait" role="alert"><strong>The next clip could not load.</strong><button type="button" onClick={onClose}>Return to Shorts</button></div>
      )}
    </div>
  );
}

function responsivePosterColumns(): number {
  if (typeof window === "undefined") return 12;
  if (window.innerWidth >= 900) return 20;
  if (window.innerWidth >= 620) return 16;
  return 12;
}

void ChatWidget;
void pixHomeStats;
void pixTrendSourceLabels;
void YoutubeTrendingShortCard;
void responsivePosterColumns;

// SIZER — the poster size tool: − |——o——| + — drag the slider or tap
// the end buttons. It is the bar used wherever a page displays vast
// amounts of content, so the scale runs from POSTER_SCALE_MIN (30%) to
// POSTER_SCALE_MAX (220%). Below and around 100% the end buttons move in
// fine 0.05 clicks, so posters can be walked down a little at a time —
// more clicks, more posters per screen; well above 100% they still
// jump 0.2 at a time. Tap targets stay large because on a device
// tapping beats dragging, especially for anyone who has trouble seeing
// small controls.
const POSTER_SCALE_MIN = 0.3;
const POSTER_SCALE_MAX = 2.2;

function usePosterScale(storageKey: string): [number, (next: number) => void] {
  const [scale, setScaleState] = useState<number>(() => {
    const saved = Number(sessionPreferenceGet(storageKey));
    return Number.isFinite(saved) && saved >= POSTER_SCALE_MIN && saved <= POSTER_SCALE_MAX ? saved : 1;
  });
  function setScale(next: number) {
    const clamped = Math.min(POSTER_SCALE_MAX, Math.max(POSTER_SCALE_MIN, Math.round(next * 20) / 20));
    setScaleState(clamped);
    sessionPreferenceSet(storageKey, String(clamped));
  }
  return [scale, setScale];
}

function useWindowWidth(): number {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

function posterGridColumns(windowWidth: number, scale: number): number {
  const base = windowWidth >= 1040 ? 8 : windowWidth >= 700 ? 6 : 4;
  // The cap is generous so the SIZER's smallest steps actually pack
  // more posters onto the screen for vast collections.
  return Math.max(2, Math.min(24, Math.round(base / scale)));
}

function PosterSizeTool({ scale, onChange, label }: { scale: number; onChange: (next: number) => void; label: string }) {
  // Fine clicks at the small end: shrinking steps 0.05 at a time until
  // the scale is well past 100%, growing steps 0.05 until it reaches
  // 100% — above that both directions jump 0.2 as before.
  const downStep = scale > 1.2 ? 0.2 : 0.05;
  const upStep = scale >= 1 ? 0.2 : 0.05;
  return (
    <div className="pix-size-tool" role="group" aria-label={`${label} SIZER poster size`}>
      <span className="pix-size-tool-label" aria-hidden="true">SIZER</span>
      <button type="button" className="pix-size-tool-btn" onClick={() => onChange(scale - downStep)} disabled={scale <= POSTER_SCALE_MIN} aria-label={`Make ${label} posters smaller`}>−</button>
      <input
        type="range"
        min={POSTER_SCALE_MIN}
        max={POSTER_SCALE_MAX}
        step={0.05}
        value={scale}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label} SIZER poster size slider`}
      />
      <button type="button" className="pix-size-tool-btn" onClick={() => onChange(scale + upStep)} disabled={scale >= POSTER_SCALE_MAX} aria-label={`Make ${label} posters bigger`}>+</button>
      <b aria-hidden="true">{Math.round(scale * 100)}%</b>
    </div>
  );
}

// ATTRACTIONS shelves: a full-bleed (100% page width) horizontal row
// that moves ONLY when a chevron at either end is clicked — the left
// chevron scrolls left, the right chevron scrolls right, about one row
// width per click, smoothly. The direction always follows the last
// click: no mouse glide, no auto-scroll, no scroll-jacking. Touch keeps
// the native swipe scroll. The SIZER above each shelf feeds `scale`,
// exposed as --pix-attraction-scale, which sizes that shelf's posters
// only (see the .pix-attraction-track rules in theme.css).
function AttractionScrollRow({ name, label, scale, children }: { name: string; label: string; scale: number; children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateChevrons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(el.scrollLeft > 2);
    setCanRight(max > 2 && el.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    updateChevrons();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateChevrons, { passive: true });
    window.addEventListener("resize", updateChevrons);
    const frame = window.requestAnimationFrame(updateChevrons);
    return () => {
      el.removeEventListener("scroll", updateChevrons);
      window.removeEventListener("resize", updateChevrons);
      window.cancelAnimationFrame(frame);
    };
  }, [updateChevrons, children]);

  function scrollRow(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    el.scrollBy({ left: direction * el.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <div className="pix-attraction-scrollrow">
      <button type="button" className="pix-attraction-chevron pix-attraction-chevron-left" onClick={() => scrollRow(-1)} disabled={!canLeft} aria-label={`Scroll the ${name} row left`}>◀</button>
      <div
        ref={trackRef}
        className="pix-attraction-track pix-row-track"
        style={{ "--pix-attraction-scale": scale } as CSSProperties}
        tabIndex={0}
        aria-label={label}
      >
        {children}
      </div>
      <button type="button" className="pix-attraction-chevron pix-attraction-chevron-right" onClick={() => scrollRow(1)} disabled={!canRight} aria-label={`Scroll the ${name} row right`}>▶</button>
    </div>
  );
}

// Seamless loop track for the landing feature rows: the posters glide
// in an endless loop — an endless shelf of selections that repeats
// instantly when it runs out of films, so the row never ends and never
// sits empty. A requestAnimationFrame driver moves the track (the set
// is rendered three times and the offset wraps by one set width, so
// the wrap point is invisible; the duplicate sets are hidden from
// assistive tech and pointer input — the first set carries the real
// links). Rows alternate their starting direction down the page (the
// `direction` prop: the row above streams right, the row below streams
// left). Controls fade in over the shelf: a ‹ button at 20% from the
// left and a › button at 20% from the right — CLICK one and the row
// switches to streaming in that direction (last click wins for that
// row); press and hold one and the films race that way for as long as
// it is held, looping forever — and a pause/play button in the center
// stops and restarts the glide. Honors prefers-reduced-motion (no
// automatic glide; the hold/click controls still work). `fullBleed`
// stretches the track to 100% of the viewport width while the row's
// header stays in the page column above it.
function loopSetItems(children: ReactNode): ReactNode[] {
  const base = Children.toArray(children);
  if (base.length === 0 || base.length >= 8) return base;
  // Too few posters to fill the shelf: repeat the real set (same films,
  // fresh keys) until the loop has room to breathe.
  const repeats = Math.ceil(8 / base.length);
  const items: ReactNode[] = [];
  for (let round = 0; round < repeats; round += 1) {
    base.forEach((child, index) => {
      items.push(isValidElement(child) ? cloneElement(child, { key: `loop-${round}-${index}` }) : child);
    });
  }
  return items;
}

function LoopTrack({ label, fullBleed = false, direction = 1, children }: { label: string; fullBleed?: boolean; direction?: 1 | -1; children: ReactNode }) {
  const items = loopSetItems(children);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const setRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  // -1: held left (films race left) · +1: held right (films race
  // right) · 0: not held. Holding overrides the base stream.
  const holdRef = useRef<-1 | 0 | 1>(0);
  // The direction the row streams on its own. Rows alternate down the
  // page via the `direction` prop; clicking a ‹ / › control switches
  // this row to streaming in the clicked direction (last click wins).
  const [streamDirection, setStreamDirection] = useState<1 | -1>(direction);
  const directionRef = useRef<1 | -1>(direction);
  directionRef.current = streamDirection;
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const baseSpeed = reduceMotion ? 0 : 26; // px per second, in the row's stream direction
    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const track = trackRef.current;
      const set = setRef.current;
      if (track && set) {
        const width = set.offsetWidth;
        if (width > 0) {
          // Holding a direction button overrides everything — even
          // pause — so the viewer can always muscle the shelf around.
          const velocity = holdRef.current !== 0 ? holdRef.current * 560 : pausedRef.current ? 0 : directionRef.current * baseSpeed;
          if (velocity !== 0) {
            offsetRef.current += velocity * dt;
            while (offsetRef.current > 0) offsetRef.current -= width;
            while (offsetRef.current <= -width) offsetRef.current += width;
            track.style.transform = `translateX(${offsetRef.current}px)`;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function steer(dir: -1 | 1) {
    return {
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        holdRef.current = dir;
      },
      onPointerUp: () => { if (holdRef.current === dir) holdRef.current = 0; },
      onPointerLeave: () => { if (holdRef.current === dir) holdRef.current = 0; },
      onPointerCancel: () => { if (holdRef.current === dir) holdRef.current = 0; },
      onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          holdRef.current = dir;
        }
      },
      onKeyUp: () => { if (holdRef.current === dir) holdRef.current = 0; },
      onContextMenu: (event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault(),
      // A click (or keyboard activation) makes this the row's stream
      // direction until the other control is clicked.
      onClick: () => setStreamDirection(dir),
    };
  }

  return (
    <div className={`pix-loop-viewport ${fullBleed ? "is-fullbleed" : ""}`} role="group" aria-label={label}>
      <div className="pix-loop-track" ref={trackRef}>
        <div className="pix-loop-set" ref={setRef}>{items}</div>
        <div className="pix-loop-set" aria-hidden="true">{items}</div>
        <div className="pix-loop-set" aria-hidden="true">{items}</div>
      </div>
      <button
        type="button"
        className={`pix-loop-nav pix-loop-nav-left ${streamDirection === -1 ? "is-live" : ""}`}
        aria-label="Stream this row to the left — click to set the direction, hold to race left through the repeating films"
        aria-pressed={streamDirection === -1}
        {...steer(-1)}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <button
        type="button"
        className="pix-loop-power"
        aria-label={paused ? "Play: start the row films moving again" : "Pause: stop the row films"}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        <span aria-hidden="true">{paused ? "▶" : "❚❚"}</span>
      </button>
      <button
        type="button"
        className={`pix-loop-nav pix-loop-nav-right ${streamDirection === 1 ? "is-live" : ""}`}
        aria-label="Stream this row to the right — click to set the direction, hold to race right through the repeating films"
        aria-pressed={streamDirection === 1}
        {...steer(1)}
      >
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );
}

function PixPosterMarquee({ movies }: { movies: PixBrowseMovie[] }) {
  const queryClient = useQueryClient();
  const [featuredMovie, setFeaturedMovie] = useState<{ movie: PixBrowseMovie; x: number; y: number } | null>(null);
  const [hiddenMovieIds, setHiddenMovieIds] = useState<Set<string>>(() => new Set());
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const featurePointerInsideRef = useRef(false);
  const [seenMessage, setSeenMessage] = useState("");
  const [seenMessageKind, setSeenMessageKind] = useState<"success" | "warning">("success");

  function hideMovieFromMarquee(imdbId: string) {
    setHiddenMovieIds((current) => {
      const next = new Set(current);
      next.add(imdbId);
      return next;
    });
    setPendingRemovalId((current) => current === imdbId ? null : current);
    setFeaturedMovie((current) => current?.movie.imdb_id === imdbId ? null : current);
  }

  const dismissMovie = useMutation({
    mutationFn: (imdbId: string) => api.dismissPixMarqueeMovie({ imdb_id: imdbId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pix-marquee-catalog"] });
      void queryClient.invalidateQueries({ queryKey: ["film-dna-profile"] });
    },
  });

  const markSeen = useMutation({
    mutationFn: (imdbId: string) => api.markPixSeen({ imdb_id: imdbId }),
    onSuccess: (result, imdbId) => {
      if (result.seen) {
        setFeaturedMovie((current) => current?.movie.imdb_id === imdbId ? { ...current, movie: { ...current.movie, seen: true } } : current);
        setSeenMessageKind("success");
        setSeenMessage("Saved as watched. It’s now in Profile → Watched.");
        if (featurePointerInsideRef.current) setPendingRemovalId(imdbId);
        else hideMovieFromMarquee(imdbId);
        void queryClient.invalidateQueries({ queryKey: ["pix-marquee-catalog"] });
        void queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] });
      } else if (result.requires_consent) {
        setSeenMessageKind("warning");
        setSeenMessage("Not saved — accept PIX privacy choices and turn on Personalization first.");
      } else {
        setSeenMessageKind("warning");
        setSeenMessage("Not saved — Personalization is off. Turn it on in PIX, then try again.");
      }
    },
    onError: () => {
      setSeenMessageKind("warning");
      setSeenMessage("Not saved — PIX couldn’t update your Watched list. Try again.");
    },
  });
  const pool = movies.filter((movie) => !hiddenMovieIds.has(movie.imdb_id)).slice(0, 60);
  const rows = [0, 1, 2].map((rowIndex) => pool.filter((_, index) => index % 3 === rowIndex));
  if (rows.some((row) => row.length === 0)) return null;
  return (
    <section className="pix-poster-marquee" aria-label={`Movie marquee with ${pool.length} films`}>
      {rows.map((row, rowIndex) => (
        <div className={`pix-marquee-row pix-marquee-row-${rowIndex + 1}`} key={rowIndex}>
          <div className="pix-marquee-track">
            {[0, 1].map((copyIndex) => (
              <div className="pix-marquee-set" key={copyIndex} aria-hidden={copyIndex === 1 ? true : undefined}>
                {row.map((movie) => (
                  <button
                    className={`pix-marquee-poster ${movie.seen ? "is-seen" : ""}`}
                    type="button"
                    tabIndex={copyIndex === 1 ? -1 : undefined}
                    title={`${movie.title} (${movie.year})${movie.seen ? " · watched" : ""}`}
                    aria-label={`Show ${movie.title}`}
                    aria-pressed={featuredMovie?.movie.imdb_id === movie.imdb_id}
                    onClick={(event) => {
                      const marqueeRect = event.currentTarget.closest(".pix-poster-marquee")?.getBoundingClientRect();
                      const posterRect = event.currentTarget.getBoundingClientRect();
                      if (!marqueeRect) return;
                      const x = posterRect.left - marqueeRect.left + (posterRect.width / 2);
                      const y = posterRect.top - marqueeRect.top + (posterRect.height / 2);
                      setSeenMessage("");
                      setSeenMessageKind("success");
                      setPendingRemovalId(null);
                      setFeaturedMovie((current) => current?.movie.imdb_id === movie.imdb_id ? null : { movie, x, y });
                    }}
                    key={`${movie.imdb_id}-${copyIndex}`}
                  >
                    <PixMarqueePosterImage posterKey={movie.poster_key} alt={`${movie.title} movie poster`} loading="lazy" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
      {featuredMovie ? <>
        <button
          className="pix-marquee-feature-backdrop"
          type="button"
          aria-label={`Close ${featuredMovie.movie.title}`}
          onClick={() => pendingRemovalId === featuredMovie.movie.imdb_id ? hideMovieFromMarquee(featuredMovie.movie.imdb_id) : setFeaturedMovie(null)}
        />
        <div
          className={`pix-marquee-feature ${featuredMovie.movie.seen ? "is-seen" : ""}`}
          aria-live="polite"
          onMouseEnter={() => { featurePointerInsideRef.current = true; }}
          onMouseLeave={() => {
            featurePointerInsideRef.current = false;
            if (pendingRemovalId === featuredMovie.movie.imdb_id) hideMovieFromMarquee(featuredMovie.movie.imdb_id);
          }}
          style={{ "--feature-x": `${featuredMovie.x}px`, "--feature-y": `${featuredMovie.y}px` } as CSSProperties}
        >
          <div className="pix-marquee-feature-poster">
            <PixPosterImage posterKey={featuredMovie.movie.poster_key} alt={`${featuredMovie.movie.title} movie poster`} loading="eager" />
            <button className="pix-marquee-feature-dismiss" type="button" onClick={() => { const dismissedId = featuredMovie.movie.imdb_id; const wasSeen = featuredMovie.movie.seen; hideMovieFromMarquee(dismissedId); if (!wasSeen) dismissMovie.mutate(dismissedId); }} aria-label={`Close and remove ${featuredMovie.movie.title} from the marquee`}>×</button>
            <div className="pix-marquee-feature-overlay">
              <strong>{featuredMovie.movie.title}</strong>
              <span>{featuredMovie.movie.year}</span>
              <a className="pix-marquee-screening-link" href={`#screening/${encodeURIComponent(featuredMovie.movie.imdb_id)}`}>MY SCREENING</a>
            </div>
            <button
              className="pix-marquee-seen-button"
              type="button"
              disabled={featuredMovie.movie.seen || markSeen.isPending}
              onClick={() => markSeen.mutate(featuredMovie.movie.imdb_id)}
              aria-label={featuredMovie.movie.seen ? `${featuredMovie.movie.title} is seen` : `Mark ${featuredMovie.movie.title} as seen`}
            >
              {markSeen.isPending ? "saving…" : "seen"}
            </button>
          </div>
          {seenMessage ? <small className={`pix-marquee-seen-status ${seenMessageKind === "warning" ? "is-warning" : ""}`} role={seenMessageKind === "warning" ? "alert" : "status"}>{seenMessage}</small> : null}
        </div>
      </> : null}
    </section>
  );
}

function UserListsPage() {
  // The Users Lists page manages existing lists — rename them, flip them
  // public or private, add and remove films. Creating a list happens in
  // one place only: the User Profile. A #lists/<code> link opens that
  // list read-only while its owner keeps it public.
  const [sharedCode, setSharedCode] = useState(() => itemFromHash(window.location.hash, "lists"));
  useEffect(() => {
    function followListLink() {
      setSharedCode(itemFromHash(window.location.hash, "lists"));
    }
    window.addEventListener("hashchange", followListLink);
    return () => window.removeEventListener("hashchange", followListLink);
  }, []);
  return (
    <section className="pix-seen-page" aria-labelledby="pix-lists-heading">
      <nav className="pix-seen-nav" aria-label="Users Lists navigation">
        <a href="#pix">← PIX</a>
        <span>USERS LISTS</span>
        <a href="#profile">PROFILE</a>
      </nav>
      <header className="pix-seen-heading">
        <span>YOUR CUSTOM LISTS</span>
        <h1 id="pix-lists-heading">Users Lists</h1>
        <p>Your lists, one clean row each: rename a title, flip a list public or private, add or remove films. New lists are created in your <a href="#profile">Profile</a> — that&apos;s the only place lists are born. Private lists live only on your profile; a public list can be viewed by anyone who has its link.</p>
      </header>
      {sharedCode ? <SharedListView key={sharedCode} code={sharedCode} /> : null}
      <UserListsManager allowCreate={false} />
      <p className="pix-lists-create-note">
        Want a new list? <a href="#profile">Create it in your Profile →</a>
      </p>
    </section>
  );
}

function ToughPixPage() {
  const queryClient = useQueryClient();
  const [shareId, setShareId] = useState(() => itemFromHash(window.location.hash, "tough"));
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    function followToughLink() {
      setShareId(itemFromHash(window.location.hash, "tough"));
      setPicked(null);
    }
    window.addEventListener("hashchange", followToughLink);
    return () => window.removeEventListener("hashchange", followToughLink);
  }, []);
  const shareQuery = useQuery({
    queryKey: ["pix-tough-share", shareId],
    queryFn: () => api.getPixToughShare({ share_id: shareId ?? "" }),
    enabled: Boolean(shareId),
  });
  const recordPick = useMutation({
    mutationFn: () => api.recordPixToughPick({ share_id: shareId ?? "" }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["pix-tough-shares"] }); },
  });
  const share = shareQuery.data?.share;
  return (
    <section className="pix-seen-page" aria-labelledby="pix-tough-heading">
      <nav className="pix-seen-nav" aria-label="TOUGH PIX navigation">
        <a href="#pix">← PIX</a>
        <span>TOUGH PIX</span>
        <a href="#profile">PROFILE</a>
      </nav>
      <header className="pix-seen-heading">
        <span>A SHARED MATCHUP</span>
        <h1 id="pix-tough-heading">TOUGH PIX</h1>
        <p>A friend sent you this exact VS because it was too tough to call. You’re playing as an anonymous guest — pick the one you liked better.</p>
      </header>
      {!shareId ? <p className="pix-catalog-state">This link is missing its TOUGH PIX code. Ask your friend to share it again.</p> : null}
      {shareId && shareQuery.isPending ? <p className="pix-catalog-state" role="status">Loading the shared matchup…</p> : null}
      {shareId && shareQuery.isError ? <p className="pix-catalog-state" role="alert">That TOUGH PIX matchup could not load.</p> : null}
      {shareId && shareQuery.data && !share ? <p className="pix-catalog-state">No matchup matches that TOUGH PIX link.</p> : null}
      {share ? (
        picked ? (
          <div className="pix-tough-thanks" role="status">
            <strong>Pick counted.</strong>
            <p>The sender can see this TOUGH PIX in their Profile and SHOWCASE. Want more matchups like this one?</p>
            <a className="primary-button" href="#pix">Play NOW PLAYING</a>
          </div>
        ) : (
          <div className="pix-matchup" aria-label="Shared TOUGH PIX matchup">
            {share.movies.map((movie) => (
              <article className="pix-choice" key={movie.imdb_id}>
                <div className="pix-poster-stage">
                  <button
                    className="pix-poster-button"
                    type="button"
                    disabled={recordPick.isPending}
                    onClick={() => { setPicked(movie.imdb_id); recordPick.mutate(); }}
                    aria-label={`Pick ${movie.title} in this TOUGH PIX matchup`}
                  >
                    <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} movie poster`} />
                    <span className="pix-check" aria-hidden="true">✓</span>
                  </button>
                </div>
                <div className="pix-movie-meta"><h2>{movie.title}</h2><p>{movie.year} · {movie.genre}</p></div>
              </article>
            ))}
          </div>
        )
      ) : null}
    </section>
  );
}

// ── POSTER VERDICTS + HOVER FOLDOUT ─────────────────────────────────
// Every movie poster hover in PIX offers the same calls, so sorting,
// organizing, and saying what you think about a film is always one
// hover away: your verdict (Want to Watch / Maybe / No Thanks, saved
// through recordPixInterest), Move to List for organizing, and the
// film page / Review / Discuss links for communicating. The saved
// verdict is readable at a glance on the poster itself:
//   WANT TO WATCH → gold outline · MAYBE → orange outline ·
//   NO THANKS → the poster dims under a black overlay.
type PosterVerdict = "want_to_see" | "maybe" | "not_interested";

const posterVerdictOptions: { value: PosterVerdict; label: string }[] = [
  { value: "want_to_see", label: "Want to Watch" },
  { value: "maybe", label: "Maybe" },
  { value: "not_interested", label: "No Thanks" },
];

function verdictClass(verdict: PosterVerdict | null): string {
  return verdict === "want_to_see" ? "is-verdict-want"
    : verdict === "maybe" ? "is-verdict-maybe"
    : verdict === "not_interested" ? "is-verdict-no"
    : "";
}

function PosterVerdictButtons({ imdbId, title, verdict, onVerdict }: {
  imdbId: string;
  title: string;
  verdict: PosterVerdict | null;
  onVerdict: (next: PosterVerdict | null, note: string) => void;
}) {
  const recordInterest = useMutation({
    mutationFn: (value: PosterVerdict) => api.recordPixInterest({
      imdb_id: imdbId,
      interest: value,
      keep_imdb_id: null,
      exclude_ids: [],
      game: { category: "movies", subcategory: "all_time", value: "" },
    }),
    onSuccess: (result, value) => {
      if (result.recorded) {
        const label = value === "want_to_see" ? "Want to Watch" : value === "maybe" ? "Maybe" : "No Thanks";
        onVerdict(value, `${label} saved for ${title}.`);
      } else if (result.requires_consent) {
        onVerdict(verdict, "Accept PIX privacy choices and turn on Personalization to save your call.");
      } else {
        onVerdict(verdict, "Personalization is off — your call wasn’t saved.");
      }
    },
    onError: () => onVerdict(verdict, "That didn’t save — try again."),
  });
  return (
    <div className="pix-fold-verdicts" role="group" aria-label={`Your call on ${title}`}>
      {posterVerdictOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`pix-fold-verdict pix-fold-verdict-${option.value} ${verdict === option.value ? "is-active" : ""}`}
          aria-pressed={verdict === option.value}
          aria-label={`${option.label}: ${title}`}
          disabled={recordInterest.isPending}
          onClick={() => recordInterest.mutate(option.value)}
        >
          {verdict === option.value ? <span aria-hidden="true">✓ </span> : null}{option.label}
        </button>
      ))}
    </div>
  );
}

// A poster card whose hover (or keyboard focus, or tap on touch via
// focus) folds out the full option set. The poster itself links to the
// film page; the fold carries the verdict buttons, Move to List, and
// the Review / Discuss links.
function PosterFoldCard({ imdbId, title, year, genre, posterKey, captionSmall, badge, lists, extraAction, foldOverlay = false }: {
  imdbId: string;
  title: string;
  year: number;
  genre: string;
  posterKey: string;
  captionSmall: string;
  badge?: ReactNode;
  lists?: PixUserListSummary[];
  extraAction?: ReactNode;
  foldOverlay?: boolean;
}) {
  const [verdict, setVerdict] = useState<PosterVerdict | null>(null);
  const [note, setNote] = useState("");
  return (
    <div className={`pix-seen-poster pix-fold-card ${verdictClass(verdict)}`} data-hover-type="2">
      <a className="pix-fold-poster-link" href={`#screening/${encodeURIComponent(imdbId)}`} aria-label={`Open ${title}, ${year}`}>
        <PixPosterImage posterKey={posterKey} alt={`${title} ${year} movie poster`} loading="lazy" />
        <span><strong>{title}</strong><small>{captionSmall}</small></span>
      </a>
      {badge}
      <div className={`pix-fold ${foldOverlay ? "is-overlay" : ""}`} aria-label={`Options for ${title}`}>
        <span className="pix-fold-kind">Your call · sorting, lists &amp; talk</span>
        <nav className="pix-fold-links" aria-label={`Open ${title}`}>
          <a href={`#screening/${encodeURIComponent(imdbId)}`} aria-label={`Open the film page for ${title}`}>Film page ↗</a>
          <a href={`#screening/${encodeURIComponent(imdbId)}/review`} aria-label={`Review ${title}`}>Review</a>
          <a href={`#screening/${encodeURIComponent(imdbId)}`} aria-label={`Discuss ${title}`}>Discuss</a>
        </nav>
        <PosterVerdictButtons imdbId={imdbId} title={title} verdict={verdict} onVerdict={(next, message) => { setVerdict(next); setNote(message); }} />
        {genre ? <small className="pix-fold-mood">Groups: {genre} · Hover 3 mood grouping</small> : null}
        <MoveToListControl imdbId={imdbId} title={title} lists={lists} />
        {extraAction}
        {note ? <small className="pix-fold-note" role="status">{note}</small> : null}
      </div>
    </div>
  );
}

function SeenMoviePoster({ movie, lists }: { movie: PixSeenYearMovie; lists?: PixUserListSummary[] }) {
  return (
    <PosterFoldCard
      imdbId={movie.imdb_id}
      title={movie.title}
      year={movie.year}
      genre={movie.genre}
      posterKey={movie.poster_key}
      captionSmall={`${movie.year} · ${movie.genre}`}
      lists={lists}
    />
  );
}

function SeenPage() {
  const yearPart = itemFromHash(window.location.hash, "seen");
  const initialYear = yearPart && /^\d{4}$/.test(yearPart) ? Number(yearPart) : null;
  const [selectedYear, setSelectedYear] = useState<number | null>(initialYear);
  const [posterScale, setPosterScale] = usePosterScale("pix-seen-poster-scale");
  const windowWidth = useWindowWidth();
  const columns = posterGridColumns(windowWidth, posterScale);
  const query = useQuery({
    queryKey: ["pix-poster-years", selectedYear],
    queryFn: () => api.listPixPosterYears({ selected_year: selectedYear }),
  });
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });

  useEffect(() => {
    function followSeenLink() {
      const nextPart = itemFromHash(window.location.hash, "seen");
      setSelectedYear(nextPart && /^\d{4}$/.test(nextPart) ? Number(nextPart) : null);
    }
    window.addEventListener("hashchange", followSeenLink);
    return () => window.removeEventListener("hashchange", followSeenLink);
  }, []);

  const selectedCount = query.data?.years.find((item) => item.year === selectedYear)?.count ?? query.data?.movies.length ?? 0;
  return (
    <section className="pix-seen-page" aria-labelledby="pix-seen-heading">
      <nav className="pix-seen-nav" aria-label="Watched page navigation">
        <a href="#pix">← PIX</a>
        {selectedYear === null ? <span>SORT WATCHED BY YEAR</span> : <a href="#seen">ALL YEARS</a>}
      </nav>
      <header className="pix-seen-heading">
        <span>WATCHED</span>
        <h1 id="pix-seen-heading">{selectedYear === null ? "Choose a year" : String(selectedYear)}</h1>
        <p>{selectedYear === null ? "Open a year to see every available movie poster from that year." : `${selectedCount.toLocaleString()} available movie poster${selectedCount === 1 ? "" : "s"}`}</p>
      </header>
      {query.isPending ? <p className="pix-catalog-state" role="status">Opening the poster archive…</p> : null}
      {query.isError ? <p className="pix-catalog-state" role="alert">The poster archive could not load.</p> : null}
      {query.data && selectedYear === null ? (
        query.data.years.length > 0 ? (
          <div className="pix-year-card-grid" aria-label="Movie poster years">
            {query.data.years.map((item) => (
              <a className={`pix-year-card ${item.count === 0 ? "is-empty" : ""}`} href={`#seen/${item.year}`} key={item.year} aria-label={`Open ${item.year}, ${item.count} available movie posters`}>
                <strong>{item.year}</strong>
                <small>{item.count === 0 ? "No posters" : `${item.count.toLocaleString()} poster${item.count === 1 ? "" : "s"}`}</small>
              </a>
            ))}
          </div>
        ) : <p className="pix-catalog-state">No movie-poster years are available yet.</p>
      ) : null}
      {query.data && selectedYear !== null ? (
        query.data.movies.length > 0 ? (
          <>
            <PosterSizeTool scale={posterScale} onChange={setPosterScale} label={`${selectedYear} catalog`} />
            <div className="pix-seen-poster-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-label={`${selectedYear} movie posters`}>
              {query.data.movies.map((movie) => <SeenMoviePoster movie={movie} lists={listsQuery.data?.lists} key={movie.imdb_id} />)}
            </div>
          </>
        ) : (
          <div className="pix-seen-empty"><strong>No available posters for {selectedYear}.</strong><a href="#seen">Choose another year</a></div>
        )
      ) : null}
    </section>
  );
}

function ViewsMoviePoster({ movie, lists }: { movie: PixViewsMovie; lists?: PixUserListSummary[] }) {
  return (
    <PosterFoldCard
      imdbId={movie.imdb_id}
      title={movie.title}
      year={movie.year}
      genre={movie.genre}
      posterKey={movie.poster_key}
      captionSmall={`${movie.year} · ${movie.views.toLocaleString()} view${movie.views === 1 ? "" : "s"}`}
      lists={lists}
    />
  );
}

function ViewsPage() {
  const query = useQuery({
    queryKey: ["pix-movies-by-views"],
    queryFn: () => api.listPixMoviesByViews({ limit: 240 }),
  });
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  const movies = query.data?.movies ?? [];
  const total = query.data?.total ?? 0;
  const [posterScale, setPosterScale] = usePosterScale("pix-views-poster-scale");
  const windowWidth = useWindowWidth();
  const columns = posterGridColumns(windowWidth, posterScale);
  return (
    <section className="pix-seen-page" aria-labelledby="pix-views-heading">
      <nav className="pix-seen-nav" aria-label="Most viewed page navigation">
        <a href="#pix">← PIX</a>
        <span>SORT BY VIEWS</span>
        <a href="#seen">CATALOG</a>
      </nav>
      <header className="pix-seen-heading">
        <span>MOST VIEWED</span>
        <h1 id="pix-views-heading">Sort by Views</h1>
        <p>Every poster-backed film, ranked by how often it has been viewed in PIX matchups — most viewed first.</p>
      </header>
      {query.isPending ? <p className="pix-catalog-state" role="status">Ranking the poster archive…</p> : null}
      {query.isError ? <p className="pix-catalog-state" role="alert">The view ranking could not load.</p> : null}
      {query.data ? (
        movies.length > 0 ? (
          <>
            <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Most viewed" />
            <div className="pix-seen-poster-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-label="Movies ranked by views">
              {movies.map((movie) => <ViewsMoviePoster movie={movie} lists={listsQuery.data?.lists} key={movie.imdb_id} />)}
            </div>
            {total > movies.length ? <p className="pix-catalog-state">Showing the top {movies.length.toLocaleString()} of {total.toLocaleString()} poster films.</p> : null}
          </>
        ) : <p className="pix-catalog-state">No movie posters are available yet.</p>
      ) : null}
    </section>
  );
}

const top500InterestOptions = [
  { value: "want_to_see", label: "Want to see" },
  { value: "maybe", label: "Maybe" },
  { value: "not_interested", label: "No thanks" },
  { value: "watch_again", label: "Watch again" },
] as const;
type Top500InterestValue = typeof top500InterestOptions[number]["value"];
type PixUserListSummary = ApiResponse<typeof api, "listPixUserLists">["lists"][number];

// ── HOVER TYPES ─────────────────────────────────────────────────────────
// PIX has exactly three hover types, used consistently everywhere a
// poster or card reacts to hover / keyboard focus. They are documented
// in the table on the ATTRACTIONS page (HoverTypesTable below) and every
// surface carries data-hover-type="1" | "2" | "3" so the behaviour is
// auditable in markup, not just in CSS.
//   Type 1 — NOW PLAYING Hover: the poster lifts, gains a gold border,
//     and its title / year / genre (the description) floats over the
//     poster. No decision is asked for; it is pure preview.
//   Type 2 — Personal Rating Hover (Top 500 model): the rank number and
//     the word "options" stay hidden until the poster is hovered or
//     focused. A plain click on the poster files the film as seen (seen
//     films keep a green border) — the poster never navigates. The film
//     page link lives in the options fold, alongside Review, Discuss,
//     the viewer's verdict buttons (Want to see / Maybe / No thanks /
//     Watch again), a Remove-from-seen undo for accidental clicks, and
//     the Move to List controls.
//   Type 3 — Group by Mood Hover: the card shows how the film groups —
//     its genres and the mood it fits — so a set can be scanned and
//     filtered by mood (Want to Watch mood picker is the full version).

function MoveToListControl({ imdbId, title, lists }: { imdbId: string; title: string; lists: PixUserListSummary[] | undefined }) {
  const queryClient = useQueryClient();
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const containing = (lists ?? []).filter((list) => list.movies.some((movie) => movie.imdb_id === imdbId));
  const effectiveListId = selectedListId ?? lists?.[0]?.id ?? null;
  const alreadyInSelected = effectiveListId !== null && containing.some((list) => list.id === effectiveListId);
  const addItem = useMutation({
    mutationFn: (listId: number) => api.addPixUserListItem({ list_id: listId, imdb_id: imdbId }),
    onSuccess: async (_result, listId) => {
      const list = lists?.find((candidate) => candidate.id === listId);
      setStatus(list ? `Added to “${list.name}”.` : "Added to your list.");
      await queryClient.invalidateQueries({ queryKey: ["pix-user-lists"] });
    },
    onError: () => setStatus("That didn’t add — try again."),
  });
  // Adding to an existing list is all that happens here — new lists are
  // created in one place only, the User Profile.
  return (
    <div className="pix-move-to-list" aria-label={`Move ${title} to one of your lists`}>
      <span className="pix-move-to-list-label">Move to your list · USERS LISTS</span>
      {lists === undefined ? <small className="pix-move-to-list-state" role="status">Loading your lists…</small> : null}
      {lists !== undefined && lists.length === 0 ? (
        <small className="pix-move-to-list-state">You have no lists yet — create your first one in your Profile, then add films to it from here.</small>
      ) : null}
      {lists !== undefined && lists.length > 0 ? (
        <div className="pix-move-to-list-row">
          <label className="visually-hidden" htmlFor={`pix-list-picker-${imdbId}`}>Choose a list for {title}</label>
          <select
            id={`pix-list-picker-${imdbId}`}
            value={effectiveListId ?? ""}
            onChange={(event) => { setSelectedListId(Number(event.target.value)); setStatus(""); }}
            aria-label={`Choose a list for ${title}`}
          >
            {lists.map((list) => <option key={list.id} value={list.id}>{list.name} ({list.movies.length})</option>)}
          </select>
          <button
            type="button"
            className="pix-move-to-list-add"
            disabled={addItem.isPending || alreadyInSelected}
            onClick={() => { if (effectiveListId !== null) addItem.mutate(effectiveListId); }}
            aria-label={alreadyInSelected ? `${title} is already in the selected list` : `Add ${title} to the selected list`}
          >
            {alreadyInSelected ? "✓ In list" : addItem.isPending ? "Adding…" : "＋ Add"}
          </button>
        </div>
      ) : null}
      {containing.length > 0 ? <small className="pix-move-to-list-in">In: {containing.map((list) => list.name).join(" · ")}</small> : null}
      {status ? <small className="pix-move-to-list-status" role="status">{status}</small> : null}
      <a className="pix-move-to-list-manage" href="#profile">Create &amp; manage lists in your Profile →</a>
    </div>
  );
}

function HoverTypesTable() {
  return (
    <section className="pix-hover-types" aria-labelledby="pix-hover-types-heading">
      <div className="pix-home-section-heading">
        <div><span>HOVER SYSTEM</span><h2 id="pix-hover-types-heading">Three hovers, used everywhere</h2></div>
        <p>Every poster in PIX uses one of these — the same three behaviours on the home rows, the games, and every ATTRACTION.</p>
      </div>
      <div className="pix-hover-table-wrap">
        <table className="pix-hover-table">
          <thead><tr><th scope="col">Type</th><th scope="col">Name</th><th scope="col">What happens on hover / focus</th><th scope="col">Where you see it</th></tr></thead>
          <tbody>
            <tr data-hover-type="1">
              <th scope="row">1</th>
              <td><strong>NOW PLAYING Hover</strong><small>Preview</small></td>
              <td>The poster lifts a few percent, takes a gold border, and its description — title, year, genre — floats over the poster. Nothing is saved; it is a look, not a decision.</td>
              <td>NOW PLAYING matchups, home glide rows, and poster previews that ask for no decision.</td>
            </tr>
            <tr data-hover-type="2">
              <th scope="row">2</th>
              <td><strong>Personal Rating Hover</strong><small>Your verdict</small></td>
              <td>Hovering the poster folds out your options: the film page link, Review, Discuss, your verdict buttons, and Move to List. On the Top 500 the rank number and the word “options” stay hidden until you hover, and a plain click on the poster files the film as seen (seen films keep a green border). Your verdict stays on the poster so you can read it at a glance: <strong>Want to Watch wears a gold outline, Maybe an orange outline, and No Thanks dims the poster under a black overlay.</strong></td>
              <td>Top 500 posters, CATALOG / VIEWS / money-chart posters, the Sort Collection attraction previews, and the NOW PLAYING interest menu.</td>
            </tr>
            <tr data-hover-type="3">
              <th scope="row">3</th>
              <td><strong>Group by Mood Hover</strong><small>Grouping</small></td>
              <td>The card shows how the film groups — its genres and the mood it fits — with a blue edge, so a whole set can be scanned, compared, and filtered by mood.</td>
              <td>Want to Watch queue and its mood picker, mood-grouped rows, ATTRACTION Row 4 review cards (grouped by film).</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="pix-hover-types-note">On touch screens there is no hover, so every hover panel is also reachable by tap and by keyboard focus — nothing in PIX is hover-only.</p>
    </section>
  );
}

function Top500MoviePoster({ movie, rank, lists }: { movie: PixTopMovie; rank: number; lists: PixUserListSummary[] | undefined }) {
  const queryClient = useQueryClient();
  const [interest, setInterest] = useState<Top500InterestValue | null>(null);
  // Seen state is durable: it comes from the server (movie.seen, your
  // Watched catalog) and the poster click / options undo write through
  // markPixSeen / unmarkPixSeen. The override only bridges the gap until
  // the refetch lands, so every film you have seen keeps its green
  // border on every visit — not just until the page reloads.
  const [seenOverride, setSeenOverride] = useState<boolean | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const isSeen = seenOverride ?? movie.seen;
  const markSeen = useMutation({
    mutationFn: (imdbId: string) => api.markPixSeen({ imdb_id: imdbId }),
    onSuccess: (result) => {
      if (result.seen) {
        setSeenOverride(true);
        void queryClient.invalidateQueries({ queryKey: ["pix-top-movies"] });
        void queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] });
        void queryClient.invalidateQueries({ queryKey: ["pix-sort-stats"] });
      }
    },
  });
  const unmarkSeen = useMutation({
    mutationFn: (imdbId: string) => api.unmarkPixSeen({ imdb_id: imdbId }),
    onSuccess: () => {
      setSeenOverride(false);
      void queryClient.invalidateQueries({ queryKey: ["pix-top-movies"] });
      void queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] });
      void queryClient.invalidateQueries({ queryKey: ["pix-sort-stats"] });
    },
  });
  const recordInterest = useMutation({
    mutationFn: (input: { imdbId: string; value: "want_to_see" | "maybe" | "not_interested" }) => api.recordPixInterest({
      imdb_id: input.imdbId,
      interest: input.value,
      keep_imdb_id: null,
      exclude_ids: [],
      game: { category: "movies", subcategory: "all_time", value: "" },
    }),
  });

  function chooseInterest(value: Top500InterestValue) {
    setInterest(value);
    if (value === "watch_again") {
      // "Watch again" is an explicit I've-seen-it statement, so it files
      // the film as seen just like the green check does.
      if (!isSeen) markSeen.mutate(movie.imdb_id);
    } else {
      recordInterest.mutate({ imdbId: movie.imdb_id, value });
    }
  }

  // A plain click on the poster files the film as seen — the poster is
  // not a link and never navigates. The film page lives in the options
  // fold, and an accidental click is undone there with Remove from seen.
  function clickPoster() {
    if (isSeen || markSeen.isPending) return;
    markSeen.mutate(movie.imdb_id);
  }

  return (
    <div className={`pix-seen-poster pix-top500-card ${isSeen ? "is-seen" : ""} ${verdictClass(interest === "watch_again" ? null : interest)}`} data-hover-type="2">
      <button
        type="button"
        className="pix-top500-poster-button"
        onClick={clickPoster}
        disabled={markSeen.isPending}
        aria-pressed={isSeen}
        aria-label={isSeen
          ? `${movie.title}, ${movie.year}, ranked number ${rank} — in your Watched catalog`
          : `Mark ${movie.title}, ${movie.year}, ranked number ${rank}, as seen`}
        title={isSeen ? "Seen — in your Watched catalog" : "Click to mark as seen"}
      >
        <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} ${movie.year} movie poster`} loading="lazy" />
        <span className={`pix-top500-seen-hint ${isSeen ? "is-seen" : ""}`} aria-hidden="true">✓</span>
        <span className="pix-top500-poster-caption"><strong>{movie.title}</strong><small>#{rank} · {movie.year} · {movie.genre}</small></span>
      </button>
      {movie.imdb_rating !== null ? <b className="pix-top500-rating">{movie.imdb_rating.toFixed(1)}</b> : null}
      <div className={`pix-top500-options ${optionsOpen ? "is-open" : ""}`}>
        <button
          type="button"
          className="pix-top500-options-trigger"
          aria-expanded={optionsOpen}
          aria-haspopup="true"
          onClick={() => setOptionsOpen((value) => !value)}
          aria-label={`${optionsOpen ? "Hide" : "Show"} options for ${movie.title}, ranked number ${rank}`}
        >
          <span className="pix-top500-rank">#{rank}</span>
          <span className="pix-top500-options-word">options</span>
        </button>
        <div className="pix-top500-fold" aria-label={`Film page, your rating and lists for ${movie.title}`}>
          <span className="pix-top500-fold-kind">Hover 2 · Your rating</span>
          <nav className="pix-top500-fold-links" aria-label={`Open ${movie.title}`}>
            <a href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open the film page for ${movie.title}`}>Film page ↗</a>
            <a href={`#screening/${encodeURIComponent(movie.imdb_id)}/review`} aria-label={`Review ${movie.title}`}>Review</a>
            <a href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Discuss ${movie.title}`}>Discuss</a>
          </nav>
          <div className="pix-top500-fold-buttons">
            {top500InterestOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={interest === option.value ? "is-active" : ""}
                aria-pressed={interest === option.value}
                aria-label={`${option.label}: ${movie.title}`}
                onClick={() => chooseInterest(option.value)}
              >
                {interest === option.value ? <span className="pix-top500-btn-check" aria-hidden="true">✓</span> : null}
                {option.label}
              </button>
            ))}
          </div>
          {isSeen ? (
            <div className="pix-top500-fold-seen">
              <small className="pix-top500-fold-note">✓ Seen — in your Watched catalog</small>
              <button
                type="button"
                className="pix-top500-remove-seen"
                disabled={unmarkSeen.isPending}
                onClick={() => unmarkSeen.mutate(movie.imdb_id)}
                aria-label={`Remove ${movie.title} from the movies you have seen`}
              >
                {unmarkSeen.isPending ? "Removing…" : "Remove from seen"}
              </button>
            </div>
          ) : null}
          <MoveToListControl imdbId={movie.imdb_id} title={movie.title} lists={lists} />
        </div>
      </div>
    </div>
  );
}

function Top500Page() {
  const query = useQuery({
    queryKey: ["pix-top-movies"],
    queryFn: () => api.listPixTopMovies({ limit: 500 }),
  });
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  const userLists = listsQuery.data?.lists;
  const movies = query.data?.movies ?? [];
  const total = query.data?.total ?? 0;
  const [posterScale, setPosterScale] = usePosterScale("pix-top500-poster-scale");
  const windowWidth = useWindowWidth();
  const columns = posterGridColumns(windowWidth, posterScale);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => new Set([0]));
  const groups = useMemo(() => {
    const chunks: PixTopMovie[][] = [];
    for (let index = 0; index < movies.length; index += 100) chunks.push(movies.slice(index, index + 100));
    return chunks;
  }, [movies]);
  return (
    <section className="pix-seen-page" aria-labelledby="pix-top500-heading">
      <nav className="pix-seen-nav" aria-label="Top 500 page navigation">
        <a href="#pix">← PIX</a>
        <span>TOP 500 OF ALL TIME</span>
        <a href="#seen">CATALOG</a>
      </nav>
      <header className="pix-seen-heading">
        <span>HIGHEST IMDb RATINGS</span>
        <h1 id="pix-top500-heading">Top 500 Movies of All Time</h1>
        <p>The 500 highest-rated films in the PIX catalog, ranked by IMDb rating — ties broken by total IMDb votes. Click a poster and the film joins the movies you have seen — seen films keep a green border, and the poster never takes you anywhere. Each poster&apos;s rank number and “options” stay hidden until you hover it: the options fold holds the link to the film page, Review, Discuss, your rating buttons, the Move to List controls, and Remove from seen for an accidental click. Each hundred stays folded until you open it.</p>
        <p className="pix-top500-lists-line">
          {listsQuery.isPending ? "Loading your lists…" : userLists && userLists.length > 0
            ? <>Your lists: {userLists.map((list) => `${list.name} (${list.movies.length})`).join(" · ")} — <a href="#lists">open USERS LISTS →</a></>
            : <>You have no lists yet — <a href="#profile">create your first one in your Profile →</a></>}
        </p>
      </header>
      <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Top 500" />
      {query.isPending ? <p className="pix-catalog-state" role="status">Ranking the top 500…</p> : null}
      {query.isError ? <div className="pix-catalog-state" role="alert"><p>The Top 500 ranking could not load.</p><button type="button" className="secondary-button" onClick={() => void query.refetch()}>Try again</button></div> : null}
      {query.data ? (
        movies.length > 0 ? (
          <>
            {groups.map((group, groupIndex) => {
              const start = groupIndex * 100 + 1;
              const end = groupIndex * 100 + group.length;
              const expanded = expandedGroups.has(groupIndex);
              return (
                <section className="pix-top500-group" key={start} aria-label={`Ranked ${start} to ${end}`}>
                  <button
                    type="button"
                    className="pix-top500-group-head"
                    aria-expanded={expanded}
                    aria-label={`${expanded ? "Minimize" : "Expand"} ranked ${start} to ${end}`}
                    onClick={() => setExpandedGroups((current) => { const next = new Set(current); if (next.has(groupIndex)) next.delete(groupIndex); else next.add(groupIndex); return next; })}
                  >
                    <strong>{start}–{end}</strong>
                    <span>{group.length} films</span>
                    <small>{expanded ? "Tap to minimize" : "Tap to view"}</small>
                    <b aria-hidden="true">{expanded ? "−" : "+"}</b>
                  </button>
                  {expanded ? (
                    <div className="pix-seen-poster-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-label={`Top movies ranked ${start} to ${end}`}>
                      {group.map((movie, index) => <Top500MoviePoster movie={movie} rank={start + index} lists={userLists} key={movie.imdb_id} />)}
                    </div>
                  ) : null}
                </section>
              );
            })}
            {total > movies.length ? <p className="pix-catalog-state">Showing the top {movies.length.toLocaleString()} of {total.toLocaleString()} rated poster films.</p> : null}
          </>
        ) : <p className="pix-catalog-state">No rated movie posters are available yet.</p>
      ) : null}
    </section>
  );
}

function formatUsdAmount(amount: number): string {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(2)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount >= 100_000_000 ? 0 : 1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

function MoneyMoviePoster({ movie, rank, amountLabel, lists }: { movie: PixMoneyMovie; rank: number; amountLabel: string; lists?: PixUserListSummary[] }) {
  return (
    <PosterFoldCard
      imdbId={movie.imdb_id}
      title={movie.title}
      year={movie.year}
      genre={movie.genre}
      posterKey={movie.poster_key}
      captionSmall={`#${rank} · ${movie.year} · ${amountLabel} ${formatUsdAmount(movie.amount)}`}
      badge={<b className="pix-top500-rating">{formatUsdAmount(movie.amount)}</b>}
      lists={lists}
    />
  );
}

const moneyRankingCopy = {
  gross: {
    navLabel: "TOP GROSSERS",
    headingId: "pix-grossers-heading",
    heading: "Top Grossers",
    kicker: "WORLDWIDE BOX OFFICE",
    blurb: "Every poster-backed film in the PIX catalog with a recorded box-office gross, ranked biggest first.",
    amountLabel: "Gross",
    loading: "Ranking the top grossers…",
    error: "The Top Grossers ranking could not load.",
    gridLabel: "Movies ranked by box office gross",
    empty: "No box-office figures are on file for catalog films yet. This ranking fills in automatically as grosses are recorded — nothing here is estimated.",
    showing: (shown: number, total: number) => `Showing the top ${shown.toLocaleString()} of ${total.toLocaleString()} films with a recorded gross.`,
  },
  budget: {
    navLabel: "BIGGEST BUDGETS",
    headingId: "pix-budgets-heading",
    heading: "Biggest Budgets",
    kicker: "PRODUCTION BUDGETS",
    blurb: "Every poster-backed film in the PIX catalog with a recorded production budget, ranked biggest first.",
    amountLabel: "Budget",
    loading: "Ranking the biggest budgets…",
    error: "The Biggest Budgets ranking could not load.",
    gridLabel: "Movies ranked by production budget",
    empty: "No production budgets are on file for catalog films yet. This ranking fills in automatically as budgets are recorded — nothing here is estimated.",
    showing: (shown: number, total: number) => `Showing the top ${shown.toLocaleString()} of ${total.toLocaleString()} films with a recorded budget.`,
  },
} as const;

function MoneyRankingPage({ kind }: { kind: "gross" | "budget" }) {
  const copy = moneyRankingCopy[kind];
  const query = useQuery({
    queryKey: ["pix-money-rankings", kind],
    queryFn: () => api.listPixMoneyRankings({ kind, limit: 200 }),
  });
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  const movies = query.data?.movies ?? [];
  const total = query.data?.total ?? 0;
  const [posterScale, setPosterScale] = usePosterScale(`pix-money-${kind}-poster-scale`);
  const windowWidth = useWindowWidth();
  const columns = posterGridColumns(windowWidth, posterScale);
  return (
    <section className="pix-seen-page" aria-labelledby={copy.headingId}>
      <nav className="pix-seen-nav" aria-label={`${copy.heading} page navigation`}>
        <a href="#pix">← PIX</a>
        <span>{copy.navLabel}</span>
        <a href="#seen">CATALOG</a>
      </nav>
      <header className="pix-seen-heading">
        <span>{copy.kicker}</span>
        <h1 id={copy.headingId}>{copy.heading}</h1>
        <p>{copy.blurb}</p>
      </header>
      {query.isPending ? <p className="pix-catalog-state" role="status">{copy.loading}</p> : null}
      {query.isError ? <p className="pix-catalog-state" role="alert">{copy.error}</p> : null}
      {query.data ? (
        movies.length > 0 ? (
          <>
            <PosterSizeTool scale={posterScale} onChange={setPosterScale} label={copy.heading} />
            <div className="pix-seen-poster-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-label={copy.gridLabel}>
              {movies.map((movie, index) => <MoneyMoviePoster movie={movie} rank={index + 1} amountLabel={copy.amountLabel} lists={listsQuery.data?.lists} key={movie.imdb_id} />)}
            </div>
            {total > movies.length ? <p className="pix-catalog-state">{copy.showing(movies.length, total)}</p> : null}
          </>
        ) : <p className="pix-catalog-state">{copy.empty}</p>
      ) : null}
    </section>
  );
}

function formatUsdFull(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

function CombGrosserCard({ movie, lists }: { movie: PixCombGrosser; lists?: PixUserListSummary[] }) {
  const [listOpen, setListOpen] = useState(false);
  const badge = <b className="pix-top500-rating">{formatUsdAmount(movie.gross)}</b>;
  const caption = (
    <span>
      <strong>{movie.title}</strong>
      <small>#{movie.rank} · {movie.year} · Gross {formatUsdFull(movie.gross)}</small>
    </span>
  );
  if (movie.in_catalog && movie.imdb_id && hasPixPoster(movie.poster_key)) {
    return (
      <div className="pix-seen-poster pix-grosser-card" data-hover-type="2">
        <a className="pix-grosser-poster-link" href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open ${movie.title}, ${movie.year}, ranked number ${movie.rank} with a worldwide gross of ${formatUsdFull(movie.gross)}`}>
          <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} ${movie.year} movie poster`} loading="lazy" />
          {caption}
        </a>
        {badge}
        <button
          type="button"
          className="pix-grosser-list-toggle"
          aria-expanded={listOpen}
          aria-label={`${listOpen ? "Hide" : "Show"} list options for ${movie.title}`}
          onClick={() => setListOpen((open) => !open)}
        >＋ LIST</button>
        {listOpen ? (
          <div className="pix-grosser-list-panel">
            <MoveToListControl imdbId={movie.imdb_id} title={movie.title} lists={lists} />
            <button type="button" className="pix-grosser-list-close" onClick={() => setListOpen(false)} aria-label={`Close list options for ${movie.title}`}>Close</button>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <div className="pix-seen-poster pix-attraction-text-tile" data-hover-type="1" aria-label={`${movie.title}, ${movie.year}, ranked number ${movie.rank} with a worldwide gross of ${formatUsdFull(movie.gross)}. Its poster is not in the PIX catalog yet.`}>
      <div className="pix-attraction-text-tile-body">
        <strong>{movie.title}</strong>
        <small>{movie.year} · Poster coming to the catalog</small>
      </div>
      {badge}
      {caption}
    </div>
  );
}

function CombGrossersPage() {
  const query = useQuery({
    queryKey: ["pix-comb-grossers"],
    queryFn: () => api.listPixCombGrossers({ limit: 100 }),
  });
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  const movies = query.data?.movies ?? [];
  const [posterScale, setPosterScale] = usePosterScale("pix-comb-grossers-poster-scale");
  const windowWidth = useWindowWidth();
  const columns = posterGridColumns(windowWidth, posterScale);
  return (
    <section className="pix-seen-page" aria-labelledby="pix-grossers-heading">
      <nav className="pix-seen-nav" aria-label="Biggest Financial Success page navigation">
        <a href="#pix">← PIX</a>
        <span>BIGGEST FINANCIAL SUCCESS</span>
        <a href="#attractions">ATTRACTIONS</a>
      </nav>
      <header className="pix-seen-heading">
        <span>ATTRACTION ROW 2 · WORLDWIDE BOX OFFICE</span>
        <h1 id="pix-grossers-heading">Biggest Financial Success</h1>
        <p>The 100 biggest money-makers in film history, ranked by worldwide box office gross — COMB&apos;s chart, supplied to PIX.</p>
      </header>
      {query.isPending ? <p className="pix-catalog-state" role="status">Loading COMB&apos;s chart…</p> : null}
      {query.isError ? <div className="pix-catalog-state" role="alert"><p>COMB&apos;s top grossers chart could not load.</p><button type="button" className="secondary-button" onClick={() => void query.refetch()}>Try again</button></div> : null}
      {query.data ? (
        movies.length > 0 ? (
          <>
            <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Biggest Financial Success" />
            <div className="pix-seen-poster-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-label="Films ranked by worldwide box office gross, supplied by COMB">
              {movies.map((movie) => <CombGrosserCard movie={movie} lists={listsQuery.data?.lists} key={movie.rank} />)}
            </div>
            <p className="pix-catalog-state">All {query.data.total.toLocaleString()} films from COMB&apos;s chart · {query.data.catalog_matched.toLocaleString()} carry their poster in the PIX catalog — the rest show as title tiles until their posters arrive.</p>
            <p className="pix-attraction-source">{query.data.source_note} Grosses are the worldwide totals COMB reported; PIX does not adjust or estimate them.</p>
          </>
        ) : <p className="pix-catalog-state">COMB&apos;s chart has not arrived yet.</p>
      ) : null}
    </section>
  );
}

// Per-row chrome on the ATTRACTIONS page: a drag grip (press it, then
// drag the row to a new spot in the stack — the page arms dragging only
// while the grip is pressed, so poster clicks and shelf scrolling are
// never hijacked) and a small square −/+ minimize toggle that collapses
// the row's posters while its header stays put.
type AttractionRowChrome = {
  position: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onGripPress: () => void;
  onGripRelease: () => void;
};

function AttractionRowHeader({ headingId, title, note, href, linkLabel, chrome }: { headingId: string; title: string; note: string; href: string; linkLabel: string; chrome: AttractionRowChrome }) {
  return (
    <div className="pix-attraction-row-head">
      <div className="pix-attraction-row-head-top">
        <div className="pix-attraction-row-title">
          <span>{`ATTRACTION ROW ${chrome.position}`}</span>
          <h2 id={headingId}>{title}</h2>
        </div>
        <div className="pix-attraction-row-tools">
          <button
            type="button"
            className="pix-attraction-grip"
            aria-label={`Drag to reorder the ${title} row`}
            title="Press and drag to reorder this row"
            onMouseDown={chrome.onGripPress}
            onMouseUp={chrome.onGripRelease}
            onTouchStart={chrome.onGripPress}
            onTouchEnd={chrome.onGripRelease}
          >⠿</button>
          <button
            type="button"
            className="pix-attraction-min-toggle"
            aria-expanded={!chrome.collapsed}
            aria-label={chrome.collapsed ? `Expand the ${title} row` : `Minimize the ${title} row`}
            onClick={chrome.onToggleCollapsed}
          >{chrome.collapsed ? "+" : "−"}</button>
          <a className="pix-attraction-open" href={href}>{linkLabel}</a>
        </div>
      </div>
      <p className="pix-attraction-row-note">{note}</p>
    </div>
  );
}

function AttractionRowTop500({ chrome }: { chrome: AttractionRowChrome }) {
  const query = useQuery({ queryKey: ["pix-top-movies"], queryFn: () => api.listPixTopMovies({ limit: 500 }) });
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  const [posterScale, setPosterScale] = usePosterScale("pix-attraction-row-1-poster-scale");
  const movies = (query.data?.movies ?? []).slice(0, 24);
  return (
    <section className="pix-attraction-row" aria-labelledby="pix-attraction-row-1-heading">
      <AttractionRowHeader
        headingId="pix-attraction-row-1-heading"
        title="Top 500 Films of All Time"
        note="The 500 highest-rated films in the PIX catalog, ranked by IMDb rating. Click a poster to file it as seen (Hover Type 2) — posters never navigate; hover to reveal the rank and “options”, where the film page, Review, Discuss, rating and Move to List controls live."
        href="#top500"
        linkLabel="OPEN THE TOP 500 →"
        chrome={chrome}
      />
      {!chrome.collapsed ? (<>
      {query.isPending ? <p className="pix-catalog-state" role="status">Ranking the top films…</p> : null}
      {query.isError ? <div className="pix-catalog-state" role="alert"><p>The Top 500 ranking could not load.</p><button type="button" className="secondary-button" onClick={() => void query.refetch()}>Try again</button></div> : null}
      {query.data && movies.length > 0 ? (
        <>
          <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Top 500 Films of All Time" />
          <AttractionScrollRow name="Top 500 films" label="Top 500 films preview — use the arrow buttons at either end to scroll the row" scale={posterScale}>
            {movies.map((movie, index) => (
              <div className="pix-row-card" key={movie.imdb_id}>
                <Top500MoviePoster movie={movie} rank={index + 1} lists={listsQuery.data?.lists} />
              </div>
            ))}
          </AttractionScrollRow>
        </>
      ) : null}
      {query.data && movies.length === 0 ? <p className="pix-catalog-state">No rated movie posters are available yet — the ranking fills in as rated posters join the catalog.</p> : null}
      </>) : null}
    </section>
  );
}

function AttractionRowGrossers({ chrome }: { chrome: AttractionRowChrome }) {
  const query = useQuery({ queryKey: ["pix-comb-grossers"], queryFn: () => api.listPixCombGrossers({ limit: 100 }) });
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  const [posterScale, setPosterScale] = usePosterScale("pix-attraction-row-2-poster-scale");
  const movies = (query.data?.movies ?? []).slice(0, 24);
  return (
    <section className="pix-attraction-row" aria-labelledby="pix-attraction-row-2-heading">
      <AttractionRowHeader
        headingId="pix-attraction-row-2-heading"
        title="Biggest Financial Success"
        note="The biggest money-makers in film history, ranked by worldwide box office gross. Posters in the catalog carry a ＋ LIST button (Hover Type 2) to file them in USERS LISTS."
        href="#grossers"
        linkLabel="OPEN THE FULL CHART →"
        chrome={chrome}
      />
      {!chrome.collapsed ? (<>
      {query.isPending ? <p className="pix-catalog-state" role="status">Loading COMB&apos;s chart…</p> : null}
      {query.isError ? <div className="pix-catalog-state" role="alert"><p>COMB&apos;s top grossers chart could not load.</p><button type="button" className="secondary-button" onClick={() => void query.refetch()}>Try again</button></div> : null}
      {query.data && movies.length > 0 ? (
        <>
          <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Biggest Financial Success" />
          <AttractionScrollRow name="Biggest Financial Success" label="Biggest financial success preview — use the arrow buttons at either end to scroll the row" scale={posterScale}>
            {movies.map((movie) => (
              <div className="pix-row-card" key={movie.rank}>
                <CombGrosserCard movie={movie} lists={listsQuery.data?.lists} />
              </div>
            ))}
          </AttractionScrollRow>
          <p className="pix-attraction-source">{query.data.source_note} {query.data.catalog_matched.toLocaleString()} of {query.data.total.toLocaleString()} carry their poster in the PIX catalog; the rest show as title tiles until their posters arrive (logged for later, below).</p>
        </>
      ) : null}
      {query.data && movies.length === 0 ? <p className="pix-catalog-state">COMB&apos;s chart has not arrived yet — this row fills in the moment COMB supplies it.</p> : null}
      </>) : null}
    </section>
  );
}

function AttractionRowSeenGame({ chrome }: { chrome: AttractionRowChrome }) {
  const statsQuery = useQuery({ queryKey: ["pix-sort-stats"], queryFn: () => api.getPixSortStats({}) });
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  const [posterScale, setPosterScale] = usePosterScale("pix-attraction-row-3-poster-scale");
  const stats = statsQuery.data;
  // Preview the newest year that actually has posters to sort, falling
  // back from the current year — an empty newest year must never leave
  // this row looking broken; the game itself covers every year.
  const previewYear = useMemo(() => {
    const yearsWithPosters = (stats?.years ?? []).filter((row) => row.total > 0).map((row) => row.year);
    return yearsWithPosters.length > 0 ? Math.max(...yearsWithPosters) : 2026;
  }, [stats]);
  const catalogQuery = useQuery({
    queryKey: ["pix-attractions-sort-preview", previewYear],
    queryFn: () => api.listPixBrowseCatalog({
      genre: null, country: null, year: previewYear, decade: null, discovery: "all",
      exclude_international: false, offset: 0, limit: 24, shuffle_seed: 4242,
      query: null, exclude_triaged: false, exclude_dismissed: false,
    }),
    enabled: statsQuery.isSuccess || statsQuery.isError,
  });
  const movies = (catalogQuery.data?.movies ?? []).filter((movie) => hasPixPoster(movie.poster_key)).slice(0, 24);
  const previewYearStats = stats?.years.find((row) => row.year === previewYear);
  return (
    <section className="pix-attraction-row" aria-labelledby="pix-attraction-row-3-heading">
      <AttractionRowHeader
        headingId="pix-attraction-row-3-heading"
        title="Have You Seen It?"
        note="The discovery game: posters rain down year by year — tap the ones you've seen and rebuild your whole viewing past. Hover any preview poster and it folds out your options: your verdict (Want to Watch, Maybe, No Thanks), Move to List, the film page, Review and Discuss."
        href="#sort"
        linkLabel="PLAY SORT COLLECTION →"
        chrome={chrome}
      />
      {!chrome.collapsed ? (<>
      {stats ? (
        <p className="pix-attraction-statline" role="status">
          {stats.total_to_sort.toLocaleString()} posters still raining · you&apos;ve sorted {stats.total_sorted.toLocaleString()} so far ({stats.total_seen.toLocaleString()} seen)
          {previewYearStats ? ` · ${previewYear}: ${previewYearStats.seen.toLocaleString()} of ${previewYearStats.total.toLocaleString()} marked seen` : ""}
        </p>
      ) : null}
      {statsQuery.isError ? <p className="pix-catalog-state" role="alert">Your sorting progress could not load — the game itself still works. <a href="#sort">Play Sort Collection →</a></p> : null}
      {catalogQuery.isPending ? <p className="pix-catalog-state" role="status">Gathering {previewYear} posters…</p> : null}
      {catalogQuery.isError ? <div className="pix-catalog-state" role="alert"><p>The {previewYear} preview posters could not load.</p><button type="button" className="secondary-button" onClick={() => void catalogQuery.refetch()}>Try again</button></div> : null}
      {catalogQuery.data && movies.length > 0 ? (
        <>
          <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Have You Seen It?" />
          <AttractionScrollRow name={`${previewYear} films`} label={`${previewYear} films preview — use the arrow buttons at either end to scroll the row`} scale={posterScale}>
            {movies.map((movie) => (
              <div className="pix-row-card" key={movie.imdb_id}>
                <PosterFoldCard
                  imdbId={movie.imdb_id}
                  title={movie.title}
                  year={movie.year}
                  genre={movie.genre}
                  posterKey={movie.poster_key}
                  captionSmall={`${movie.year} · Seen it? Hover for options`}
                  lists={listsQuery.data?.lists}
                  foldOverlay
                  extraAction={<a className="pix-fold-play" href="#sort" aria-label={`Play Sort Collection with ${movie.title}`}>▶ Play Sort Collection</a>}
                />
              </div>
            ))}
          </AttractionScrollRow>
        </>
      ) : null}
      {catalogQuery.data && movies.length === 0 ? <p className="pix-catalog-state">No {previewYear} posters are in the catalog yet — <a href="#sort">the game still covers every earlier year →</a></p> : null}
      </>) : null}
    </section>
  );
}

function AttractionRowReviews({ chrome }: { chrome: AttractionRowChrome }) {
  const query = useQuery({ queryKey: ["pix-friend-reviews"], queryFn: () => api.listPixFriendReviews({ limit: 6 }) });
  const [posterScale, setPosterScale] = usePosterScale("pix-attraction-row-4-poster-scale");
  const reviews = query.data?.reviews ?? [];
  return (
    <section className="pix-attraction-row" aria-labelledby="pix-attraction-row-4-heading">
      <AttractionRowHeader
        headingId="pix-attraction-row-4-heading"
        title="Friends' Reviews"
        note="What viewers are saying — the latest reviews and comments from the PIX community, grouped by film (Hover Type 3). Tap a poster to open the film and add your own take."
        href="#profile"
        linkLabel="OPEN SHOWCASE →"
        chrome={chrome}
      />
      {!chrome.collapsed ? (<>
      {query.isPending ? <p className="pix-catalog-state" role="status">Loading the latest reviews…</p> : null}
      {query.isError ? <div className="pix-catalog-state" role="alert"><p>The latest reviews could not load.</p><button type="button" className="secondary-button" onClick={() => void query.refetch()}>Try again</button></div> : null}
      {query.data && reviews.length > 0 ? (
        <>
          <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Friends' Reviews" />
          <AttractionScrollRow name="Friends' Reviews" label="Friends' reviews — use the arrow buttons at either end to scroll the row" scale={posterScale}>
            {reviews.map((review: PixFriendReview) => (
              <article className="pix-friend-review pix-attraction-review" data-hover-type="3" key={review.id}>
                <a className="pix-friend-review-poster" href={`#screening/${encodeURIComponent(review.imdb_id)}`} aria-label={`Open ${review.movie_title} to read and write reviews`}>
                  {hasPixPoster(review.poster_key) ? <PixPosterImage posterKey={review.poster_key} alt={`${review.movie_title} movie poster`} /> : <span className="pix-attraction-review-noposter" aria-hidden="true">{review.movie_year}</span>}
                </a>
                <div className="pix-friend-review-copy">
                  <header>
                    <strong>{review.author_name}</strong>
                    <small>on {review.movie_title} ({review.movie_year}) · {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</small>
                  </header>
                  {review.title ? <h3>{review.title}</h3> : null}
                  <p>{review.body.length > 220 ? `${review.body.slice(0, 220).trimEnd()}…` : review.body}</p>
                  <a className="pix-attraction-review-link" href={`#screening/${encodeURIComponent(review.imdb_id)}`}>Read &amp; review {review.movie_title} →</a>
                </div>
              </article>
            ))}
          </AttractionScrollRow>
        </>
      ) : null}
      {query.data && reviews.length === 0 ? (
        <div className="pix-attraction-empty">
          <strong>No reviews yet — yours could be the first.</strong>
          <p>Open any film, post your take, and it lands here for the whole community. Start with a classic from the Top 500, or play a matchup and review the winner.</p>
          <div className="pix-attraction-empty-actions">
            <a className="pix-attraction-open" href="#top500">PICK A TOP 500 FILM →</a>
            <a className="pix-attraction-open" href="#pix">PLAY NOW PLAYING →</a>
          </div>
        </div>
      ) : null}
      </>) : null}
    </section>
  );
}

function AttractionRowCatalog({ chrome }: { chrome: AttractionRowChrome }) {
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  const [posterScale, setPosterScale] = usePosterScale("pix-attraction-row-5-poster-scale");
  const catalogQuery = useQuery({
    queryKey: ["pix-attractions-catalog-preview"],
    queryFn: () => api.listPixBrowseCatalog({
      genre: null, country: null, year: null, decade: null, discovery: "all",
      exclude_international: false, offset: 0, limit: 24, shuffle_seed: 777,
      query: null, exclude_triaged: false, exclude_dismissed: false,
    }),
  });
  const movies = (catalogQuery.data?.movies ?? []).filter((movie) => hasPixPoster(movie.poster_key)).slice(0, 24);
  return (
    <section className="pix-attraction-row" aria-labelledby="pix-attraction-row-5-heading">
      <AttractionRowHeader
        headingId="pix-attraction-row-5-heading"
        title="Catalog"
        note="The AVAILABLE CATALOG itself — every film PIX holds, ready to browse. Hover any poster and it folds out your options: your verdict (Want to Watch, Maybe, No Thanks), Move to List, the film page, Review and Discuss."
        href="#seen"
        linkLabel="OPEN THE CATALOG →"
        chrome={chrome}
      />
      {!chrome.collapsed ? (<>
      {catalogQuery.data ? (
        <p className="pix-attraction-statline" role="status">{catalogQuery.data.total.toLocaleString()} films in the catalog</p>
      ) : null}
      {catalogQuery.isPending ? <p className="pix-catalog-state" role="status">Opening the catalog…</p> : null}
      {catalogQuery.isError ? <div className="pix-catalog-state" role="alert"><p>The catalog preview could not load.</p><button type="button" className="secondary-button" onClick={() => void catalogQuery.refetch()}>Try again</button></div> : null}
      {catalogQuery.data && movies.length > 0 ? (
        <>
          <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Catalog" />
          <AttractionScrollRow name="Catalog" label="Catalog preview — use the arrow buttons at either end to scroll the row" scale={posterScale}>
            {movies.map((movie) => (
              <div className="pix-row-card" key={movie.imdb_id}>
                <PosterFoldCard
                  imdbId={movie.imdb_id}
                  title={movie.title}
                  year={movie.year}
                  genre={movie.genre}
                  posterKey={movie.poster_key}
                  captionSmall={`${movie.year} · In the PIX catalog`}
                  lists={listsQuery.data?.lists}
                  foldOverlay
                  extraAction={<a className="pix-fold-play" href="#seen" aria-label={`Open the catalog at ${movie.title}`}>▶ Open Catalog</a>}
                />
              </div>
            ))}
          </AttractionScrollRow>
        </>
      ) : null}
      {catalogQuery.data && movies.length === 0 ? <p className="pix-catalog-state">No catalog posters are available yet — the catalog fills in as posters join PIX.</p> : null}
      </>) : null}
    </section>
  );
}

type AttractionRowKey = "top500" | "grossers" | "seen" | "reviews" | "catalog";
const ATTRACTION_ROW_DEFAULT_ORDER: AttractionRowKey[] = ["top500", "grossers", "seen", "reviews", "catalog"];

function isAttractionRowKey(value: string): value is AttractionRowKey {
  return (ATTRACTION_ROW_DEFAULT_ORDER as string[]).includes(value);
}

function AttractionsPage() {
  const queryClient = useQueryClient();
  const layoutQuery = useQuery({ queryKey: ["pix-attractions-layout"], queryFn: () => api.getPixAttractionsLayout({}) });
  const saveLayout = useMutation({
    mutationFn: (next: AttractionRowKey[]) => api.savePixAttractionsLayout({ row_order: next }),
    onSuccess: (data) => { queryClient.setQueryData(["pix-attractions-layout"], data); },
  });
  // The whole-section minimize: the plain ATTRACTIONS heading and its
  // toggle stay on the page; every row below them hides.
  const [sectionOpen, setSectionOpen] = useState(true);
  const [collapsedRows, setCollapsedRows] = useState<Partial<Record<AttractionRowKey, boolean>>>({});
  // Drag & drop reorder: a row becomes draggable only while its grip is
  // pressed (armedKey); dragKey tracks the row in flight and overKey
  // the slot it hovers. Dropping commits the new order to the profile.
  const [armedKey, setArmedKey] = useState<AttractionRowKey | null>(null);
  const [dragKey, setDragKey] = useState<AttractionRowKey | null>(null);
  const [overKey, setOverKey] = useState<AttractionRowKey | null>(null);

  const order = useMemo<AttractionRowKey[]>(() => {
    const saved = (layoutQuery.data?.row_order ?? []).filter(isAttractionRowKey);
    return [...saved, ...ATTRACTION_ROW_DEFAULT_ORDER.filter((key) => !saved.includes(key))];
  }, [layoutQuery.data]);

  function chromeFor(key: AttractionRowKey, position: number): AttractionRowChrome {
    return {
      position,
      collapsed: collapsedRows[key] ?? false,
      onToggleCollapsed: () => setCollapsedRows((current) => ({ ...current, [key]: !(current[key] ?? false) })),
      onGripPress: () => setArmedKey(key),
      onGripRelease: () => { if (!dragKey) setArmedKey(null); },
    };
  }

  function clearDrag() {
    setDragKey(null);
    setOverKey(null);
    setArmedKey(null);
  }

  function commitDrop(target: AttractionRowKey) {
    if (dragKey && dragKey !== target) {
      const next = order.filter((key) => key !== dragKey);
      next.splice(next.indexOf(target), 0, dragKey);
      queryClient.setQueryData(["pix-attractions-layout"], { row_order: next });
      saveLayout.mutate(next);
    }
    clearDrag();
  }

  const rowNodes: Record<AttractionRowKey, (chrome: AttractionRowChrome) => ReactNode> = {
    top500: (chrome) => <AttractionRowTop500 chrome={chrome} />,
    grossers: (chrome) => <AttractionRowGrossers chrome={chrome} />,
    seen: (chrome) => <AttractionRowSeenGame chrome={chrome} />,
    reviews: (chrome) => <AttractionRowReviews chrome={chrome} />,
    catalog: (chrome) => <AttractionRowCatalog chrome={chrome} />,
  };

  return (
    <section className="pix-seen-page" aria-labelledby="pix-attractions-heading">
      <nav className="pix-seen-nav" aria-label="Attractions page navigation">
        <a href="#pix">← PIX</a>
        <span>ATTRACTIONS</span>
        <a href="#seen">CATALOG</a>
      </nav>
      <header className="pix-attractions-heading-block">
        <span className="pix-attractions-eyebrow">WHY VISIT PIX.MOV</span>
        <div className="pix-attractions-title-row">
          <h1 id="pix-attractions-heading">Attractions</h1>
          <button
            type="button"
            className="pix-attraction-min-toggle"
            aria-expanded={sectionOpen}
            aria-label={sectionOpen ? "Minimize the ATTRACTIONS section" : "Expand the ATTRACTIONS section"}
            onClick={() => setSectionOpen((open) => !open)}
          >{sectionOpen ? "−" : "+"}</button>
        </div>
        {sectionOpen ? <p className="pix-attractions-intro">The lists, money charts, games, reviews and the catalog itself — five rows, each one a reason to stay. Press a row&apos;s ⠿ grip and drag to reorder the stack; your order is saved to your profile.</p> : null}
      </header>
      {sectionOpen ? (<>
        {order.map((key, index) => {
          const renderRow = rowNodes[key];
          return (
            <div
              key={key}
              className={`pix-attraction-slot${dragKey === key ? " is-dragging" : ""}${overKey === key && dragKey !== null && dragKey !== key ? " is-drop-target" : ""}`}
              draggable={armedKey === key}
              onDragStart={(event) => {
                setDragKey(key);
                event.dataTransfer.effectAllowed = "move";
                try { event.dataTransfer.setData("text/plain", key); } catch { /* dataTransfer is best-effort */ }
              }}
              onDragOver={(event) => {
                if (dragKey) {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setOverKey(key);
                }
              }}
              onDrop={(event) => { event.preventDefault(); commitDrop(key); }}
              onDragEnd={clearDrag}
            >
              {renderRow ? renderRow(chromeFor(key, index + 1)) : null}
            </div>
          );
        })}
        <HoverTypesTable />
      <section className="pix-attraction-later" aria-labelledby="pix-attraction-later-heading">
        <h2 id="pix-attraction-later-heading">Logged for later</h2>
        <ul>
          <li><strong>Posters for COMB chart films not yet in the PIX catalog</strong> — those entries show as title tiles today (never a borrowed poster). Logged for the next poster ingest; the chart, grosses, and rankings already work without them.</li>
          <li><strong>Biggest Budgets as its own ATTRACTION row</strong> — budget figures are still sparse in the catalog, so Budgets stays a standalone page (linked from the PIX home launchers) instead of opening half-empty. Logged for when budget coverage fills in.</li>
        </ul>
      </section>
      </>) : null}
    </section>
  );
}

const pixMoodOptions = [
  { key: "uplifting", label: "Need something Uplifting" },
  { key: "jump_scares", label: "Need some jump scares" },
  { key: "action", label: "How about some ACTION" },
  { key: "introspective", label: "Introspective" },
  { key: "deep_think", label: "Deep think" },
  { key: "classic", label: "Classic" },
] as const;
type PixMoodKey = typeof pixMoodOptions[number]["key"];

function WatchlistQueueCard({ movie, moodLabel }: { movie: PixWatchlistMovie; moodLabel?: string | null }) {
  const [open, setOpen] = useState(false);
  const linksQuery = useQuery({
    queryKey: ["pix-watch-links", movie.imdb_id],
    queryFn: () => api.getPixWatchLinks({ imdb_id: movie.imdb_id }),
    enabled: open,
    staleTime: 1000 * 60 * 30,
  });
  return (
    <div className="pix-watchlist-cell">
      <a className="pix-seen-poster pix-hover-mood" data-hover-type="3" href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open ${movie.title}, ${movie.year}${moodLabel ? ` — fits the mood ${moodLabel}` : ""}`}>
        <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} ${movie.year} movie poster`} loading="lazy" />
        {movie.imdb_rating !== null ? <b className="pix-top500-rating">{movie.imdb_rating.toFixed(1)}</b> : null}
        <span><strong>{movie.title}</strong><small>{movie.year} · {movie.genre}</small>{moodLabel ? <small className="pix-hover-mood-tag">Mood: {moodLabel} · Hover 3</small> : <small className="pix-hover-mood-tag">{movie.genre} · Hover 3 — group by mood</small>}</span>
      </a>
      <button type="button" className="pix-watch-toggle" aria-expanded={open} aria-label={`${open ? "Hide" : "Show"} where to watch ${movie.title}`} onClick={() => setOpen((value) => !value)}>
        {open ? "Hide watch options" : "Where to watch"}
      </button>
      {open ? (
        <div className="pix-watch-links">
          {linksQuery.isPending ? <p role="status">Finding watch options…</p> : null}
          {linksQuery.isError ? <p role="alert">Watch options couldn't load right now.</p> : null}
          {linksQuery.data ? (
            <>
              <a href={linksQuery.data.imdb_url} target="_blank" rel="noopener noreferrer">All watch options on IMDb ↗</a>
              {linksQuery.data.links.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.title} <small>{link.source}</small></a>
              ))}
              {linksQuery.data.links.length === 0 ? <p>No listings found — check IMDb for current availability.</p> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function WatchlistRewatchCard({ movie }: { movie: PixWatchlistRewatch }) {
  return (
    <a className="pix-seen-poster pix-hover-mood" data-hover-type="3" href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Rewatch ${movie.title}, ${movie.year}`}>
      <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} ${movie.year} movie poster`} loading="lazy" />
      {movie.imdb_rating !== null ? <b className="pix-top500-rating">{movie.imdb_rating.toFixed(1)}</b> : null}
      <span><strong>{movie.title}</strong><small>{movie.year} · {movie.genre}{movie.personal_win_rate !== null ? ` · You picked it ${Math.round(movie.personal_win_rate * 100)}%` : ""}</small><small className="pix-hover-mood-tag">Hover 3 — group by mood</small></span>
    </a>
  );
}

function WatchlistCreatorCard({ creator }: { creator: PixWatchlistCreator }) {
  return (
    <article className="pix-creator-card">
      <div className="pix-creator-posters" aria-hidden="true">
        {creator.poster_keys.length > 0 ? creator.poster_keys.map((posterKey) => (
          <PixPosterImage key={posterKey} posterKey={posterKey} alt="" loading="lazy" />
        )) : <span className="pix-creator-posters-empty">{creator.name.slice(0, 1)}</span>}
      </div>
      <div className="pix-creator-copy">
        <strong>{creator.name}</strong>
        <small>{creator.kind} · {creator.film_count} features · {creator.match_score}% mood match</small>
        <small>{creator.match_reason}</small>
        {creator.genres.length > 0 ? <small>{creator.genres.join(" · ")}</small> : null}
      </div>
    </article>
  );
}

function WatchlistPage() {
  const [mood, setMood] = useState<PixMoodKey | null>(null);
  const [posterScale, setPosterScale] = usePosterScale("pix-watchlist-poster-scale");
  const windowWidth = useWindowWidth();
  const columns = posterGridColumns(windowWidth, posterScale);
  const query = useQuery({
    queryKey: ["pix-watchlist", mood],
    queryFn: () => api.listPixWatchlist({ mood }),
  });
  const data = query.data;
  const queueTotal = data?.queue_total ?? 0;
  const showPicker = queueTotal >= 50;
  return (
    <section className="pix-seen-page" aria-labelledby="pix-watchlist-heading">
      <nav className="pix-seen-nav" aria-label="Want to Watch page navigation">
        <a href="#pix">← PIX</a>
        <span>WANT TO WATCH</span>
        <a href="#seen">CATALOG</a>
      </nav>
      <header className="pix-seen-heading">
        <span>YOUR QUEUE</span>
        <h1 id="pix-watchlist-heading">Want to Watch</h1>
        <p>{queueTotal > 0 ? `${queueTotal.toLocaleString()} film${queueTotal === 1 ? "" : "s"} you marked Want to See${mood && data ? ` — ${data.queue.length.toLocaleString()} fit “${data.mood_label}” right now` : ""}.` : "Films you mark Want to See in NOW PLAYING collect here."}</p>
      </header>
      {showPicker ? (
        <div className="pix-mood-picker" role="group" aria-label="Filter your queue by mood">
          <button type="button" className={mood === null ? "active" : ""} aria-pressed={mood === null} onClick={() => setMood(null)}>Everything</button>
          {pixMoodOptions.map((option) => (
            <button key={option.key} type="button" className={mood === option.key ? "active" : ""} aria-pressed={mood === option.key} onClick={() => setMood(option.key)}>{option.label}</button>
          ))}
        </div>
      ) : null}
      {query.isPending ? <p className="pix-catalog-state" role="status">Opening your queue…</p> : null}
      {query.isError ? <p className="pix-catalog-state" role="alert">Your Want to Watch queue could not load.</p> : null}
      {data ? (
        <>
          <section aria-labelledby="pix-watchlist-queue-heading">
            {mood ? <h2 className="pix-watchlist-section-heading" id="pix-watchlist-queue-heading">From your Want to Watch queue</h2> : null}
            {data.queue.length > 0 ? (
              <>
              <PosterSizeTool scale={posterScale} onChange={setPosterScale} label="Want to Watch" />
              <div className="pix-seen-poster-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-label={mood ? `Queued films matching ${data.mood_label}` : "Your Want to Watch queue"}>
                {data.queue.map((movie) => <WatchlistQueueCard movie={movie} moodLabel={mood ? data.mood_label : null} key={movie.imdb_id} />)}
              </div>
              </>
            ) : (
              <p className="pix-catalog-state">{queueTotal === 0 ? "Nothing queued yet — tap Want to See on a film in NOW PLAYING and it will wait for you here." : "Nothing in your queue fits this mood right now."}</p>
            )}
          </section>
          {mood ? (
            <>
              <section aria-labelledby="pix-watchlist-rewatch-heading">
                <h2 className="pix-watchlist-section-heading" id="pix-watchlist-rewatch-heading">Rewatch from your collection</h2>
                {data.rewatch.length > 0 ? (
                  <>
                    <p className="pix-watchlist-section-note">You loved this — watch it again.</p>
                    <div className="pix-seen-poster-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-label={`Watched films matching ${data.mood_label}`}>
                      {data.rewatch.map((movie) => <WatchlistRewatchCard movie={movie} key={movie.imdb_id} />)}
                    </div>
                  </>
                ) : <p className="pix-catalog-state">No watched films fit this mood yet.</p>}
              </section>
              <section aria-labelledby="pix-watchlist-creators-heading">
                <h2 className="pix-watchlist-section-heading" id="pix-watchlist-creators-heading">Creators who match</h2>
                {data.creators.length > 0 ? (
                  <div className="pix-creator-grid">
                    {data.creators.map((creator) => <WatchlistCreatorCard creator={creator} key={creator.name} />)}
                  </div>
                ) : <p className="pix-catalog-state">No creators match this mood yet.</p>}
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

type RainDrop = {
  dropId: number;
  movie: PixBrowseMovie;
  lane: number;
  durationMs: number;
  imgUrl: string;
  // Organic drift: each drop sits off its lane center, sways sideways as it
  // falls, and carries a slight tilt, so the field never forms straight rows.
  jitterPx: number;
  swayPx: number;
  tiltDeg: number;
};

const MAX_RAIN_DROPS = 36;
// Drops fall at near-uniform speed (a small per-drop variation only), so
// posters in a lane keep their spacing for the whole fall and can never
// catch up to or overlap the one ahead.
const RAIN_FALL_MS = 14000;
const RAIN_LANE_GAP_PX = 10;
const RAIN_SPAWN_TICK_MS = 450;

function SortCollectionPage() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [playing, setPlaying] = useState(false);
  const [removeMode, setRemoveMode] = useState(false);
  const [session, setSession] = useState(0);
  const [drops, setDrops] = useState<RainDrop[]>([]);
  const [goneIds, setGoneIds] = useState<ReadonlySet<string>>(() => new Set());
  const [sortedCount, setSortedCount] = useState(0);
  const [status, setStatus] = useState("");
  const [statusKind, setStatusKind] = useState<"success" | "warning">("success");
  const [addOpen, setAddOpen] = useState(false);
  const [addQueryText, setAddQueryText] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [rainPosterScale, setRainPosterScale] = useState<number>(() => {
    const saved = Number(sessionPreferenceGet("pix-rain-poster-scale"));
    return Number.isFinite(saved) && saved >= 1 && saved <= 2 ? saved : 1;
  });
  const [rainSpeedScale, setRainSpeedScale] = useState<number>(() => {
    const saved = Number(sessionPreferenceGet("pix-rain-speed-scale"));
    return Number.isFinite(saved) && saved >= 0.5 && saved <= 2 ? saved : 1;
  });
  const rainPosterScaleRef = useRef(rainPosterScale);
  rainPosterScaleRef.current = rainPosterScale;
  const rainSpeedScaleRef = useRef(rainSpeedScale);
  rainSpeedScaleRef.current = rainSpeedScale;

  useEffect(() => {
    sessionPreferenceSet("pix-rain-poster-scale", String(rainPosterScale));
  }, [rainPosterScale]);
  useEffect(() => {
    sessionPreferenceSet("pix-rain-speed-scale", String(rainSpeedScale));
  }, [rainSpeedScale]);

  const dropsRef = useRef<RainDrop[]>([]);
  const dropIdRef = useRef(0);
  const cursorRef = useRef(0);
  const busyRef = useRef<Set<string>>(new Set());
  const stageRef = useRef<HTMLDivElement | null>(null);
  const pendingLaneRef = useRef<Map<number, number>>(new Map());
  const spawnTokenRef = useRef(0);
  const [stageMetrics, setStageMetrics] = useState({ width: 0, posterWidth: 108, laneCount: 0, offsetX: 0 });
  const metricsRef = useRef(stageMetrics);
  metricsRef.current = stageMetrics;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => {
      const width = stage.clientWidth;
      // Base width matches the .pix-sort-drop clamp in theme.css; the rain
      // controls scale it up so posters are easier to see on a device.
      const posterWidth = Math.min(108, Math.max(80, window.innerWidth * 0.09)) * rainPosterScaleRef.current;
      const laneCount = Math.max(1, Math.floor((width + RAIN_LANE_GAP_PX) / (posterWidth + RAIN_LANE_GAP_PX)));
      const lanesWidth = laneCount * posterWidth + (laneCount - 1) * RAIN_LANE_GAP_PX;
      setStageMetrics({ width, posterWidth, laneCount, offsetX: Math.max(0, (width - lanesWidth) / 2) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [rainPosterScale]);

  // A lane is clear for a new drop only once its highest (most recently
  // entered) poster has fallen at least one gap into the stage, measured from
  // the real on-screen position so pausing never fools it.
  function laneEntryClear(lane: number) {
    const stage = stageRef.current;
    if (!stage) return false;
    if (pendingLaneRef.current.has(lane)) return false;
    const stageRect = stage.getBoundingClientRect();
    let minTop = Number.POSITIVE_INFINITY;
    stage.querySelectorAll<HTMLElement>(`[data-lane="${lane}"]`).forEach((el) => {
      const top = el.getBoundingClientRect().top - stageRect.top;
      if (top < minTop) minTop = top;
    });
    return minTop === Number.POSITIVE_INFINITY || minTop >= RAIN_LANE_GAP_PX;
  }
  const goneIdsRef = useRef<ReadonlySet<string>>(goneIds);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  useEffect(() => { goneIdsRef.current = goneIds; }, [goneIds]);

  function updateDrops(next: RainDrop[]) {
    dropsRef.current = next;
    setDrops(next);
  }

  function removeDropById(dropId: number) {
    updateDrops(dropsRef.current.filter((drop) => drop.dropId !== dropId));
  }

  function removeDropByMovie(imdbId: string) {
    updateDrops(dropsRef.current.filter((drop) => drop.movie.imdb_id !== imdbId));
  }

  function addGone(imdbId: string) {
    setGoneIds((previous) => {
      const next = new Set(previous);
      next.add(imdbId);
      return next;
    });
  }

  const yearsQuery = useQuery({
    queryKey: ["pix-poster-years", null],
    queryFn: () => api.listPixPosterYears({ selected_year: null }),
  });
  const sortStatsQuery = useQuery({
    queryKey: ["pix-sort-stats"],
    queryFn: () => api.getPixSortStats({}),
  });
  const sortStats = sortStatsQuery.data;
  const statsYearRows = (sortStats?.years ?? []).filter((row) => row.year === selectedYear || row.seen > 0 || row.not_seen > 0);
  const yearOptions = useMemo(
    () => (yearsQuery.data?.years ?? []).filter((item) => item.count > 0),
    [yearsQuery.data],
  );

  const catalogQuery = useQuery({
    queryKey: ["pix-sort-catalog", selectedYear, session],
    queryFn: () => api.listPixBrowseCatalog({
      genre: null,
      country: null,
      year: selectedYear,
      decade: null,
      discovery: "all",
      exclude_international: false,
      offset: 0,
      limit: 240,
      shuffle_seed: 7919 + session * 131 + selectedYear,
      query: null,
      exclude_triaged: true,
      exclude_dismissed: false,
    }),
  });

  const pool = useMemo(
    () => (catalogQuery.data?.movies ?? []).filter((movie) => hasPixPoster(movie.poster_key) && !goneIds.has(movie.imdb_id)),
    [catalogQuery.data, goneIds],
  );
  const poolRef = useRef(pool);
  poolRef.current = pool;

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const spawn = () => {
      if (cancelled || !playingRef.current) return;
      const metrics = metricsRef.current;
      if (metrics.laneCount === 0) return;
      const currentPool = poolRef.current;
      if (currentPool.length === 0 || dropsRef.current.length >= MAX_RAIN_DROPS) return;
      // Fill lanes whose entry is clear, so the rain stays dense — but skip
      // some lanes each tick at random so posters enter staggered and uneven
      // instead of marching in lockstep rows.
      for (let lane = 0; lane < metrics.laneCount; lane += 1) {
        if (dropsRef.current.length >= MAX_RAIN_DROPS) return;
        if (!laneEntryClear(lane)) continue;
        if (Math.random() < 0.3) continue;
        const falling = new Set(dropsRef.current.map((drop) => drop.movie.imdb_id));
        let chosen: PixBrowseMovie | undefined;
        for (let tries = 0; tries < currentPool.length; tries += 1) {
          const candidate = currentPool[cursorRef.current % currentPool.length];
          cursorRef.current += 1;
          if (candidate && !falling.has(candidate.imdb_id)) {
            chosen = candidate;
            break;
          }
        }
        if (!chosen) return;
        const movie = chosen;
        const laneForDrop = lane;
        spawnTokenRef.current += 1;
        const token = spawnTokenRef.current;
        pendingLaneRef.current.set(laneForDrop, token);
        void getPixPosterUrl(movie.poster_key).then((url) => {
          if (pendingLaneRef.current.get(laneForDrop) === token) pendingLaneRef.current.delete(laneForDrop);
          if (!url || cancelled || !playingRef.current) return;
          if (goneIdsRef.current.has(movie.imdb_id)) return;
          if (dropsRef.current.length >= MAX_RAIN_DROPS) return;
          if (dropsRef.current.some((drop) => drop.movie.imdb_id === movie.imdb_id)) return;
          dropIdRef.current += 1;
          updateDrops([...dropsRef.current, {
            dropId: dropIdRef.current,
            movie,
            lane: laneForDrop,
            durationMs: (RAIN_FALL_MS / rainSpeedScaleRef.current) * (0.92 + Math.random() * 0.16),
            imgUrl: url,
            jitterPx: Math.round((Math.random() * 2 - 1) * 6),
            swayPx: Math.round((Math.random() * 2 - 1) * 18),
            tiltDeg: Math.round((Math.random() * 2 - 1) * 15) / 10,
          }]);
        });
      }
    };
    spawn();
    const timer = window.setInterval(spawn, RAIN_SPAWN_TICK_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [playing, selectedYear, session]);

  const markSeen = useMutation({
    mutationFn: (imdbId: string) => api.markPixSeen({ imdb_id: imdbId }),
    onSuccess: (result, imdbId) => {
      if (result.seen) {
        addGone(imdbId);
        removeDropByMovie(imdbId);
        setSortedCount((count) => count + 1);
        setStatusKind("success");
        setStatus("Saved as watched — it’s filed in Profile → Watched.");
        void queryClient.invalidateQueries({ queryKey: ["pix-poster-years"] });
        void queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] });
        void queryClient.invalidateQueries({ queryKey: ["pix-sort-stats"] });
      } else if (result.requires_consent) {
        setStatusKind("warning");
        setStatus("Not saved — accept PIX privacy choices and turn on Personalization first.");
      } else {
        setStatusKind("warning");
        setStatus("Not saved — Personalization is off. Turn it on in PIX, then try again.");
      }
    },
    onError: () => {
      setStatusKind("warning");
      setStatus("Not saved — PIX couldn’t update your Watched list. Try again.");
    },
    onSettled: (_result, _error, imdbId) => { busyRef.current.delete(imdbId); },
  });

  const removeFromRain = useMutation({
    mutationFn: (imdbId: string) => api.dismissPixMarqueeMovie({ imdb_id: imdbId }),
    onSuccess: (result, imdbId) => {
      if (result.recorded) {
        addGone(imdbId);
        removeDropByMovie(imdbId);
        setStatusKind("success");
        setStatus("Removed from the collection rain.");
        void queryClient.invalidateQueries({ queryKey: ["pix-marquee-catalog"] });
      } else {
        setStatusKind("warning");
        setStatus("Not removed — Personalization is off, so PIX can’t record removals.");
      }
    },
    onError: () => {
      setStatusKind("warning");
      setStatus("Not removed — PIX couldn’t record that. Try again.");
    },
    onSettled: (_result, _error, imdbId) => { busyRef.current.delete(imdbId); },
  });

  function handlePosterClick(movie: PixBrowseMovie) {
    if (busyRef.current.has(movie.imdb_id)) return;
    busyRef.current.add(movie.imdb_id);
    if (removeMode) removeFromRain.mutate(movie.imdb_id);
    else markSeen.mutate(movie.imdb_id);
  }

  function chooseYear(year: number) {
    setSelectedYear(year);
    updateDrops([]);
    cursorRef.current = 0;
    setGoneIds(new Set());
    setSortedCount(0);
    setPlaying(false);
    setRemoveMode(false);
    setStatus("");
  }

  function resetRain() {
    updateDrops([]);
    cursorRef.current = 0;
    setGoneIds(new Set());
    setSortedCount(0);
    setStatus("");
    setSession((value) => value + 1);
    setPlaying(true);
  }

  const addQuery = useQuery({
    queryKey: ["pix-sort-add-search", addSearch],
    queryFn: () => api.listPixBrowseCatalog({
      genre: null,
      country: null,
      year: null,
      decade: null,
      discovery: "all",
      exclude_international: false,
      offset: 0,
      limit: 12,
      shuffle_seed: null,
      query: addSearch,
      exclude_triaged: false,
      exclude_dismissed: false,
    }),
    enabled: addOpen && addSearch.trim().length >= 2,
  });
  const addResults = useMemo(
    () => (addQuery.data?.movies ?? []).filter((movie) => hasPixPoster(movie.poster_key)),
    [addQuery.data],
  );

  const addToCollection = useMutation({
    mutationFn: (imdbId: string) => api.setPixUserLibrary({ imdb_id: imdbId, saved: true }),
    onSuccess: (result) => {
      if (result.saved) {
        setStatusKind("success");
        setStatus("Added to your collection.");
        void queryClient.invalidateQueries({ queryKey: ["pix-sort-add-search"] });
        void queryClient.invalidateQueries({ queryKey: ["pix-user-library"] });
      } else {
        setStatusKind("warning");
        setStatus("That film couldn’t be added.");
      }
    },
    onError: () => {
      setStatusKind("warning");
      setStatus("That film couldn’t be added. Try again.");
    },
  });

  return (
    <section className="pix-sort-page" aria-labelledby="pix-sort-heading">
      <nav className="pix-seen-nav" aria-label="Sort Collection navigation">
        <a href="#pix">← PIX</a>
        <span>SORT COLLECTION</span>
        <a href="#seen">CATALOG</a>
      </nav>
      <header className="pix-seen-heading">
        <span>FAST TRIAGE</span>
        <h1 id="pix-sort-heading">Sort Collection</h1>
        <p>
          Posters rain down from {selectedYear}. Tap one you’ve watched and it disappears, filed as seen.
          {sortedCount > 0 ? ` ${sortedCount} sorted this session ·` : ""} {pool.length} left in this year’s rain.
        </p>
        {sortStats ? (
          <p className="pix-sort-total" role="status" aria-label={`${sortStats.total_to_sort.toLocaleString()} movies left to sort across all years`}>
            <strong>{sortStats.total_to_sort.toLocaleString()}</strong> movies left to sort
            {sortedCount > 0 ? <span> · {sortedCount} sorted this session</span> : null}
          </p>
        ) : null}
      </header>

      <div className="pix-sort-controls" role="group" aria-label="Sort Collection controls">
        <label className="pix-sort-year">
          <span>Year</span>
          <select
            aria-label="Rain year"
            value={selectedYear}
            disabled={yearsQuery.isPending}
            onChange={(event) => chooseYear(Number(event.target.value))}
          >
            {yearOptions.map((item) => (
              <option key={item.year} value={item.year}>{item.year} · {item.count}</option>
            ))}
          </select>
        </label>
        <div className="pix-sort-transport" role="group" aria-label="Rain transport">
          <button type="button" className="pix-sort-btn" onClick={() => setPlaying(true)} disabled={playing} aria-label="Play: start the poster rain">▶ Play</button>
          <button type="button" className="pix-sort-btn" onClick={() => setPlaying(false)} disabled={!playing} aria-label="Pause: freeze the poster rain">❚❚ Pause</button>
          <button type="button" className="pix-sort-btn" onClick={resetRain} aria-label="Reset: restart the poster rain">↺ Reset</button>
        </div>
        <div className="pix-rain-controls" role="group" aria-label="Rain controls">
          <span className="pix-rain-controls-title" aria-hidden="true">Rain</span>
          <label className="pix-rain-control">
            <span>Poster size</span>
            <input
              type="range"
              min={1}
              max={2}
              step={0.1}
              value={rainPosterScale}
              aria-label="Rain poster size"
              onChange={(event) => setRainPosterScale(Number(event.target.value))}
            />
            <b>{rainPosterScale.toFixed(1)}×</b>
          </label>
          <label className="pix-rain-control">
            <span>Speed</span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.25}
              value={rainSpeedScale}
              aria-label="Rain speed"
              onChange={(event) => setRainSpeedScale(Number(event.target.value))}
            />
            <b>{rainSpeedScale}×</b>
          </label>
        </div>
        <div className="pix-sort-tools" role="group" aria-label="Collection tools">
          <span aria-hidden="true">Tools →</span>
          <button
            type="button"
            className={`pix-sort-btn ${addOpen ? "is-active" : ""}`}
            onClick={() => setAddOpen((open) => !open)}
            aria-expanded={addOpen}
            aria-label="Add a film to the collection"
          >+ Add</button>
          <button
            type="button"
            className={`pix-sort-btn ${removeMode ? "is-remove-active" : ""}`}
            onClick={() => setRemoveMode((mode) => !mode)}
            aria-pressed={removeMode}
            aria-label="Remove mode: tap raining posters to remove them from the collection"
          >− Remove</button>
        </div>
      </div>

      {addOpen ? (
        <div className="pix-sort-add">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setAddSearch(addQueryText.trim());
            }}
          >
            <label className="pix-sort-add-label" htmlFor="pix-sort-add-input">Add a film to the collection</label>
            <div className="pix-sort-add-row">
              <input
                id="pix-sort-add-input"
                type="search"
                value={addQueryText}
                onChange={(event) => setAddQueryText(event.target.value)}
                placeholder="Search the catalog by title…"
                aria-label="Search the catalog by title"
              />
              <button type="submit" className="pix-sort-btn" aria-label="Search for a film to add">Search</button>
            </div>
          </form>
          {addSearch.trim().length >= 2 && addQuery.isPending ? <p className="pix-sort-add-state" role="status">Searching the catalog…</p> : null}
          {addSearch.trim().length >= 2 && addQuery.isError ? <p className="pix-sort-add-state" role="alert">Search failed. Try again.</p> : null}
          {addSearch.trim().length >= 2 && addQuery.data && addResults.length === 0 ? <p className="pix-sort-add-state">No poster-backed films match “{addSearch}”.</p> : null}
          {addResults.length > 0 ? (
            <ul className="pix-sort-add-results" aria-label="Films you can add">
              {addResults.map((movie) => (
                <li key={movie.imdb_id}>
                  <span><strong>{movie.title}</strong> <small>{movie.year}{movie.genre ? ` · ${movie.genre}` : ""}</small></span>
                  {movie.saved ? (
                    <span className="pix-sort-in-collection">In collection</span>
                  ) : (
                    <button
                      type="button"
                      className="pix-sort-btn"
                      disabled={addToCollection.isPending}
                      onClick={() => addToCollection.mutate(movie.imdb_id)}
                      aria-label={`Add ${movie.title} (${movie.year}) to the collection`}
                    >+ Add</button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {status ? (
        <p className={`pix-sort-status ${statusKind === "warning" ? "is-warning" : ""}`} role={statusKind === "warning" ? "alert" : "status"}>{status}</p>
      ) : null}

      <div
        ref={stageRef}
        className={`pix-sort-stage ${playing ? "is-playing" : "is-paused"} ${removeMode ? "is-remove-mode" : ""}`}
        aria-label={`${selectedYear} poster rain`}
      >
        {drops.map((drop) => (
          <button
            key={drop.dropId}
            type="button"
            className="pix-sort-drop"
            data-lane={drop.lane}
            style={{
              left: `${stageMetrics.offsetX + Math.min(drop.lane, Math.max(0, stageMetrics.laneCount - 1)) * (stageMetrics.posterWidth + RAIN_LANE_GAP_PX) + drop.jitterPx}px`,
              width: `${stageMetrics.posterWidth}px`,
              animationDuration: `${drop.durationMs}ms`,
              "--sway": `${drop.swayPx}px`,
              "--tilt": `${drop.tiltDeg}deg`,
              "--drop-h": `${stageMetrics.posterWidth * 1.5 + 12}px`,
            } as CSSProperties}
            onAnimationEnd={() => removeDropById(drop.dropId)}
            onClick={() => handlePosterClick(drop.movie)}
            aria-label={removeMode
              ? `Remove ${drop.movie.title} (${drop.movie.year}) from the collection`
              : `Mark ${drop.movie.title} (${drop.movie.year}) as watched`}
            title={`${drop.movie.title} (${drop.movie.year})`}
          >
            <img src={drop.imgUrl} alt="" draggable={false} />
          </button>
        ))}
        {drops.length === 0 ? (
          <div className="pix-sort-stage-empty">
            {catalogQuery.isPending ? (
              <strong>Loading the {selectedYear} collection…</strong>
            ) : catalogQuery.isError ? (
              <>
                <strong>The collection could not load.</strong>
                <button type="button" className="pix-sort-btn" onClick={() => void catalogQuery.refetch()} aria-label="Retry loading the collection">Retry</button>
              </>
            ) : pool.length === 0 ? (
              <strong>Nothing left to sort in {selectedYear} — every poster is triaged.</strong>
            ) : (
              <>
                <strong>{playing ? "The rain is starting…" : "Press Play and the posters rain down."}</strong>
                {!playing ? <button type="button" className="pix-sort-btn" onClick={() => setPlaying(true)} aria-label="Play: start the poster rain">▶ Play</button> : null}
              </>
            )}
          </div>
        ) : null}
        {removeMode && drops.length > 0 ? <p className="pix-sort-mode-note" role="status">Remove mode — tap a poster to remove it.</p> : null}
      </div>
      <p className="pix-sort-hint">Tap a poster you’ve seen to file it as watched — the same triage as the catalog picker. Posters you don’t tap loop back into the rain until you pause or reset.</p>

      {/* The game sits at the top of the page; the trophy shelf and the
          per-year sorted counts live below it. */}
      {sortStats ? (
        <div className="pix-sort-stats-wrap">
          <div className="pix-sort-stats" role="table" aria-label="Sorted counts by year">
            <div className="pix-sort-stats-head" role="row">
              <span role="columnheader" className="pix-sort-col-year">Year</span>
              <span role="columnheader" className="pix-sort-col-seen">Seen</span>
              <span role="columnheader" className="pix-sort-col-notseen">Not SEEN</span>
            </div>
            {statsYearRows.map((row) => (
              <div className={`pix-sort-stats-row ${row.year === selectedYear ? "is-current" : ""}`} role="row" key={row.year}>
                <span role="cell" className="pix-sort-col-year">{row.year}</span>
                <span role="cell" className="pix-sort-col-seen">{row.seen.toLocaleString()}</span>
                <span role="cell" className="pix-sort-col-notseen">{row.not_seen.toLocaleString()}</span>
              </div>
            ))}
            <div className="pix-sort-stats-row pix-sort-stats-total" role="row">
              <span role="cell" className="pix-sort-col-year">ALL</span>
              <span role="cell" className="pix-sort-col-seen">{sortStats.total_seen.toLocaleString()}</span>
              <span role="cell" className="pix-sort-col-notseen">{sortStats.total_not_seen.toLocaleString()}</span>
            </div>
          </div>
          <aside className="pix-trophy-shelf" aria-label="PIX.MOV trophies">
            <div className="pix-trophy-head"><span aria-hidden="true">🏆</span><strong>PIX.MOV TROPHY</strong></div>
            <ul>
              {sortStats.trophies.map((trophy) => (
                <li key={trophy.key} className={trophy.earned ? "is-earned" : ""}>
                  <span aria-hidden="true">{trophy.earned ? "🏆" : "◦"}</span>
                  <span><strong>{trophy.label}</strong><small>{trophy.detail}</small></span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : sortStatsQuery.isPending ? <p className="pix-catalog-state" role="status">Counting your sorted films…</p> : null}
    </section>
  );
}

function PixMarqueeBand() {
  const [marqueeSeed] = useState(() => {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] ?? Date.now();
  });
  const marqueeQuery = useQuery({
    queryKey: ["pix-marquee-catalog", marqueeSeed],
    queryFn: () => api.listPixBrowseCatalog({
      genre: null,
      country: null,
      year: null,
      decade: null,
      discovery: "all",
      exclude_international: false,
      offset: 0,
      limit: 60,
      shuffle_seed: marqueeSeed,
      query: null,
      exclude_triaged: false,
      exclude_dismissed: true,
    }),
  });
  const marqueeCandidates = useMemo(
    () => (marqueeQuery.data?.movies ?? []).filter((movie) => hasPixPoster(movie.poster_key) && hasPixMarqueePoster(movie.poster_key)),
    [marqueeQuery.data?.movies],
  );
  const [readyPosterKeys, setReadyPosterKeys] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    let active = true;
    setReadyPosterKeys(new Set());
    // Progressive marquee: the first dozen posters land as fast as possible
    // so the marquee appears immediately, then the rest trickle in a few at
    // a time instead of one 60-poster slam of archive downloads.
    const keys = marqueeCandidates.map((movie) => movie.poster_key);
    void (async () => {
      let index = 0;
      while (index < keys.length) {
        const batchSize = index === 0 ? 12 : 8;
        const batch = keys.slice(index, index + batchSize);
        index += batch.length;
        const loaded = await preloadPixMarqueePosters(batch);
        if (!active) return;
        if (loaded.size > 0) {
          setReadyPosterKeys((current) => new Set([...current, ...loaded]));
        }
        if (index < keys.length) {
          await new Promise((resolve) => { window.setTimeout(resolve, 200); });
          if (!active) return;
        }
      }
    })();
    return () => { active = false; };
  }, [marqueeCandidates]);
  const marqueeMovies = marqueeCandidates.filter((movie) => readyPosterKeys.has(movie.poster_key));
  const marqueeLoading = marqueeQuery.isPending || (marqueeCandidates.length > 0 && marqueeMovies.length < 3);
  return (
    <div className="pix-marquee-band">
      {marqueeMovies.length >= 3 ? <PixPosterMarquee movies={marqueeMovies} /> : marqueeLoading ? <div className="pix-marquee-loading" role="status">Loading the marquee…</div> : null}
    </div>
  );
}

// The Feedback page: one inbox for feedback, ideas, issues, and user
// reports — and the appeal route for safe-space flags. Submissions are
// stored in the PIX feedback inbox for the team; nothing is public.
// BISCUIT consent gate — the single mount point for PIX.MOV's
// cookie & data consent launcher. It presents BISCUIT on first visit
// (while the saved decision is still "pending"), re-opens whenever
// anything dispatches "pix:open-consent" (the game's consent blocks,
// the footer and profile "Cookie & Data Consent" links, the legal
// pages), and stays out of the way on the Privacy Policy and Consent
// Agreements pages themselves so they can be read unobstructed — the
// decision is still outstanding when the reader comes back. The one
// consent truth lives in the profile fields written by
// savePixConsent; this gate only reads them.
function BiscuitConsentGate({ active }: { active: SectionKey }) {
  const controlQuery = useQuery({ queryKey: ["pix-control"], queryFn: () => api.getPixControlState({}) });
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    function open() { setRequested(true); }
    window.addEventListener("pix:open-consent", open);
    return () => window.removeEventListener("pix:open-consent", open);
  }, []);
  const profile = controlQuery.data?.profile;
  if (!profile) return null;
  const onLegalPage = active === "privacy" || active === "agreements";
  const visible = requested || (profile.cookie_decision === "pending" && !onLegalPage);
  if (!visible) return null;
  return (
    <BiscuitLauncher
      decision={profile.cookie_decision}
      savedPersonalization={profile.personalization}
      savedAdMeasurement={profile.ad_measurement}
      onClose={() => setRequested(false)}
    />
  );
}

function PixConsentStatusLine() {
  const controlQuery = useQuery({ queryKey: ["pix-control"], queryFn: () => api.getPixControlState({}) });
  const profile = controlQuery.data?.profile;
  return (
    <div className="pix-legal-consent-box">
      <p>
        {profile ? (
          profile.cookie_decision === "accepted"
            ? <>Your BISCUIT decision: <strong>Accepted</strong> — Save my PIX data is {profile.personalization ? "on" : "off"}, ad measurement is {profile.ad_measurement ? "on" : "off"}.</>
            : profile.cookie_decision === "declined"
              ? <>Your BISCUIT decision: <strong>Declined</strong> — PIX is recording nothing personal about you.</>
              : <>You have not made a BISCUIT decision yet — PIX is recording nothing personal until you do.</>
        ) : "Loading your BISCUIT decision…"}
      </p>
      <button type="button" className="pix-consent-open-button" onClick={openBiscuitConsent} aria-label="Open Cookie and Data Consent — review or change your BISCUIT decision">Cookie &amp; Data Consent</button>
    </div>
  );
}

function PrivacyPolicyPage() {
  return (
    <section className="pix-seen-page pix-legal-page" aria-labelledby="pix-privacy-heading">
      <p className="pix-back-to-game"><a className="pix-back-link" href="#pix" aria-label="Back to PIX.MOV">← PIX.MOV</a></p>
      <p className="kicker">Privacy Policy</p>
      <h2 id="pix-privacy-heading">What PIX.MOV records — and what it never does</h2>
      <p>PIX.MOV is a movie-taste network: PIX (the games and recommendations), CINE (the creator editor), and the founder&apos;s DB Interface are one app. <strong>BISCUIT</strong>, the consent launcher, is the gate for everything on this page: until you accept in BISCUIT, and whenever you decline, PIX records nothing personal about you.</p>
      <PixConsentStatusLine />
      <h3>What PIX records when you accept</h3>
      <ul>
        <li><strong>Game choices</strong> — your Movie vs Movie and Performance votes, &ldquo;never seen it&rdquo; marks, pair skips, and watched / not-watched catalog triage. Triage answers are permanent by design: you can unmark one by hand, but bulk resets would corrupt the deck for everyone.</li>
        <li><strong>FILM DNA</strong> — the taste signature PIX derives from those choices (genre and era weights, vote and search counts), used to suggest films people with similar likes enjoyed. Search requests are logged into FILM DNA only while personalization is on.</li>
        <li><strong>Your fan type</strong> — the fan-type blend PIX infers from your play (for example Horror Hound or Prestige Hunter), plus any focus you set by answering the game&apos;s direct question.</li>
        <li><strong>What you make</strong> — custom lists, ratings, reviews, discussions, SHOWCASE profile details, and CINE projects, uploads, and clip metadata.</li>
        <li><strong>Voluntary demographics</strong> — only what you willingly share in your profile: country, state or province, age range, gender, faith, and similar fields. Nothing is inferred.</li>
        <li><strong>Account details</strong> — if you create an account, your email address, so the account can be verified and recovered. Verification codes are stored only as expiring hashes.</li>
      </ul>
      <h3>The PIX privacy rule</h3>
      <p>Voluntarily shared demographic information is used <strong>only</strong> for games and for helping you choose entertainment. It is never used for advertising, never sold, and never shared for anyone else&apos;s marketing. Review and rating aggregations are published only at Global, Country, and State/Province level — never at a level that could identify a person — and your personal overlay compares your ratings against those aggregates honestly, including while aggregate data is still being collected.</p>
      <h3>What declining means</h3>
      <p>Declining in BISCUIT switches your profile to anonymous: PIX does not save your game choices, build FILM DNA, or measure ads for you, and the profile keeps no email or display name. Essential processing is limited to running the game and remembering this privacy decision itself. You can keep playing — picks still move the game forward; they just are not recorded.</p>
      <h3>Ads and measurement</h3>
      <p>Ad measurement happens only if you accept <em>and</em> leave the ad-measurement option on in BISCUIT; it is off by default. Between short segments PIX shows a five-second billboard — until advertising is live, those billboards carry famous movie quotes. Google Ads is not live yet; when it launches it runs under BISCUIT consent and the BISCUIT consent banner, and this policy will be updated first.</p>
      <h3>Email and accounts</h3>
      <p>An email is collected only if you create an account, and the account stays inactive until the email-verification step is completed. Outbound email is not connected yet, so verification codes currently appear as a clearly labeled preview inside the app — that gap is stated here rather than hidden, and it closes when the mail channel is wired.</p>
      <h3>Your controls</h3>
      <ul>
        <li><strong>Change your mind any time</strong> — the &ldquo;Cookie &amp; Data Consent&rdquo; link in the footer and in your profile re-opens BISCUIT.</li>
        <li><strong>Pause personalization</strong> — the recording settings in your profile can pause FILM DNA capture without deleting your account.</li>
        <li><strong>Export and delete</strong> — your profile carries a SAVE MY PICK DATA export and a DELETE PIX DATA control; deletion is a typed confirmation, never a single accidental tap.</li>
        <li><strong>Private by default</strong> — lists and profiles you create choose their own visibility; private stays private.</li>
      </ul>
      <h3>Third-party keys</h3>
      <p>Integration keys (for services such as YouTube, Freesound, Vimeo, Backblaze B2, and Stripe) are stored server-side only, founder-managed through the DB Interface, and are never exposed to the app client. API keys are credentials, never content, and are never sold or shared.</p>
      <p className="pix-legal-source">Sources: the PIX.MOV Privacy Policy as presented in the app since September 30, 2026, and the data inventory in PIX.MOV Legal &amp; Compliance v1.0.0 (updated October 21, 2026). This page is a plain-language record of what PIX.MOV does; it is not legal advice. The matching consent terms are on the <a href="#agreements">Consent Agreements</a> page.</p>
    </section>
  );
}

function AgreementsPage() {
  return (
    <section className="pix-seen-page pix-legal-page" aria-labelledby="pix-agreements-heading">
      <p className="pix-back-to-game"><a className="pix-back-link" href="#pix" aria-label="Back to PIX.MOV">← PIX.MOV</a></p>
      <p className="kicker">Consent Agreements</p>
      <h2 id="pix-agreements-heading">The agreements behind the BISCUIT switch</h2>
      <p>These are the agreements your BISCUIT decision puts into effect. Accepting or declining in BISCUIT — including at signup — is the same single act, stored in the same place, and changeable at any time from the &ldquo;Cookie &amp; Data Consent&rdquo; link in the footer and your profile.</p>
      <PixConsentStatusLine />
      <h3>1. The data recording agreement</h3>
      <p>When you <strong>accept</strong>, you agree that PIX may record the items described in the <a href="#privacy">Privacy Policy</a>, governed by the switches you set:</p>
      <ul>
        <li><strong>Essential processing — always on.</strong> The minimum needed to run the game and remember this decision. It is not optional because the app cannot honor a choice it cannot remember.</li>
        <li><strong>Save my PIX data — your choice.</strong> Your game choices, seen marks, triage, and the FILM DNA taste signature built from them, used for games and entertainment recommendations.</li>
        <li><strong>Ad measurement — off unless you turn it on.</strong> Measurement of advertising shown between segments. Never a use for voluntarily shared demographics.</li>
      </ul>
      <p>When you <strong>decline</strong>, you agree to play anonymously: PIX records none of the above for you, your profile carries no email or display name, and anything that would have been recorded simply is not.</p>
      <h3>2. The safe-space agreement</h3>
      <p>Creating an account also accepts the PIX safe-space rules: no hate speech or discriminatory slurs anywhere on PIX.MOV — including usernames, reviews, lists, and discussions. Automated screening plus human moderation enforce the rules; a blocked word can be appealed through Feedback with the word and where you used it, and moderation decisions are reviewed by a person.</p>
      <h3>3. The account agreement</h3>
      <ul>
        <li>An account is created with an email address and a six-digit verification code, with a human-verification step at signup. Codes are stored as expiring hashes; the account stays inactive until verification completes.</li>
        <li>CINE creator capabilities require a <strong>verified</strong> email address — unverified accounts can watch and play, but cannot publish or distribute.</li>
        <li>Declining consent after signup returns the profile to anonymous and clears the account email on file.</li>
      </ul>
      <h3>4. Creator terms (summary)</h3>
      <ul>
        <li>Content creators keep <strong>70%</strong> of revenue from their work; the PIX share is 30%. Asset creators are paid out of the content creator&apos;s share by usage deduction until each asset&apos;s rights price is paid in full, and the clearance ledger is the DISTRIBUTOR&apos;s proof of clearance.</li>
        <li>DISTRIBUTOR charges $49 per title for all destinations and $9 per re-push (free on the Studio tier). CINE storage tiers: Free 500&nbsp;MB, Creator 100&nbsp;GB at $4.99/mo, Studio 1&nbsp;TB at $14.99/mo.</li>
        <li>Nothing may be distributed without completed rights clearance, founded in chain of title.</li>
      </ul>
      <h3>5. Changing your mind</h3>
      <p>Consent is not a one-way door. Re-open BISCUIT from any &ldquo;Cookie &amp; Data Consent&rdquo; link, flip the switches, and the new decision governs recording from that moment. Turning personalization off stops new capture; deleting your PIX data from your profile removes what was recorded.</p>
      <p className="pix-legal-source">Sources: the PIX.MOV signup consent flow (live since September 30, 2026), the PIX.MOV Legal &amp; Compliance document v1.0.0 (updated October 21, 2026), and the pricing locked October 20, 2026. This page records the agreements as the app actually enforces them; it is not legal advice.</p>
    </section>
  );
}

type PixFeedbackKind = "feedback" | "idea" | "issue" | "report_user";
const pixFeedbackKinds: { value: PixFeedbackKind; label: string; hint: string }[] = [
  { value: "feedback", label: "Feedback", hint: "Anything about PIX.MOV — including safe-space flag appeals: name the word and where you used it." },
  { value: "idea", label: "Ideas", hint: "A feature, a game, a row, a channel — what should PIX.MOV do next?" },
  { value: "issue", label: "Issues", hint: "Something broken, missing, or wrong. Tell us the page and what happened." },
  { value: "report_user", label: "Report user", hint: "Report a user name, list, review, or discussion that breaks the safe-space rules." },
];

function FeedbackPage() {
  const [kind, setKind] = useState<PixFeedbackKind>("feedback");
  const [message, setMessage] = useState("");
  const [reportedUser, setReportedUser] = useState("");
  const [sentId, setSentId] = useState<number | null>(null);
  const activeKind = pixFeedbackKinds.find((entry) => entry.value === kind) ?? pixFeedbackKinds[0];
  const submit = useMutation({
    mutationFn: () => api.submitPixFeedback({
      kind,
      message: message.trim(),
      reported_user: kind === "report_user" ? reportedUser.trim() : "",
    }),
    onSuccess: (result) => {
      setSentId(result.id);
      setMessage("");
      setReportedUser("");
    },
  });
  return (
    <section className="pix-seen-page pix-feedback-page" aria-labelledby="pix-feedback-heading">
      <nav className="pix-seen-nav" aria-label="Feedback page navigation">
        <a href="#pix">← PIX</a>
        <span>FEEDBACK</span>
        <a href="#profile">PROFILE</a>
      </nav>
      <header className="pix-seen-heading">
        <span>TALK TO PIX.MOV</span>
        <h1 id="pix-feedback-heading">Feedback</h1>
        <p>Feedback, ideas, issues, and user reports — one inbox, read by the PIX.MOV team. Appealing a safe-space flag? Choose Feedback and name the word and where you used it, and we will review your case.</p>
      </header>
      {sentId !== null ? (
        <div className="pix-feedback-sent" role="status">
          <strong>Thank you — your message is in.</strong>
          <p>Reference #{sentId}. The PIX.MOV team reads every submission; reports and appeals are reviewed before any action is taken.</p>
          <button type="button" className="secondary-button" onClick={() => setSentId(null)} aria-label="Write another feedback message">Write another</button>
        </div>
      ) : (
        <form
          className="pix-feedback-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (message.trim() && (kind !== "report_user" || reportedUser.trim())) submit.mutate();
          }}
        >
          <fieldset className="pix-feedback-kinds">
            <legend>What is this about?</legend>
            <div role="radiogroup" aria-label="Feedback type">
              {pixFeedbackKinds.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  role="radio"
                  aria-checked={kind === entry.value}
                  className={kind === entry.value ? "is-active" : ""}
                  onClick={() => setKind(entry.value)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <p className="pix-feedback-kind-hint">{activeKind?.hint}</p>
          </fieldset>
          {kind === "report_user" ? (
            <>
              <label htmlFor="pix-feedback-reported-user">User you are reporting</label>
              <input
                id="pix-feedback-reported-user"
                value={reportedUser}
                onChange={(event) => setReportedUser(event.target.value)}
                maxLength={80}
                placeholder="Their PIX.MOV user name"
                aria-label="User you are reporting"
                required
              />
            </>
          ) : null}
          <label htmlFor="pix-feedback-message">{kind === "report_user" ? "What happened?" : "Your message"}</label>
          <textarea
            id="pix-feedback-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={4000}
            rows={7}
            placeholder={kind === "report_user" ? "What did they post, and where? Quote the words if you can." : "Write it the way you would say it…"}
            aria-label="Your feedback message"
            required
          />
          <div className="pix-feedback-actions">
            <span>{message.length.toLocaleString()} / 4,000</span>
            <button type="submit" className="primary-button" disabled={submit.isPending || !message.trim() || (kind === "report_user" && !reportedUser.trim())}>
              {submit.isPending ? "Sending…" : "Send to PIX.MOV"}
            </button>
          </div>
          {submit.isError ? <p className="form-error" role="alert">Your message couldn’t be sent. Try again.</p> : null}
        </form>
      )}
    </section>
  );
}

// The ATTRACTIONS button row on the landing page, directly below the
// Movie vs Movie game: a gold GENRES button whose drop-down lists
// every genre with a row on the landing page (picking one scrolls to
// that genre's row and unfolds it), the PIX.MOV LISTS button, one tap
// to each attraction, plus the full ATTRACTIONS page. The bar's other
// buttons are black with a gold outline; GENRES is gold with black
// text.
function AttractionsButtonRow() {
  const sectionsQuery = useQuery({ queryKey: ["pix-classic-sections"], queryFn: () => api.listPixClassicSections({}) });
  const [genresOpen, setGenresOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const genres = (sectionsQuery.data?.sections ?? [])
    .filter((section) => section.key === "horror" || section.key === "comedy" || section.key.startsWith("genre:"))
    .sort((a, b) => a.title.localeCompare(b.title));

  useEffect(() => {
    if (!genresOpen) return;
    function closeOnOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setGenresOpen(false);
    }
    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setGenresOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [genresOpen]);

  function openGenreRow(key: string) {
    setGenresOpen(false);
    window.dispatchEvent(new CustomEvent("pix:open-landing-row", { detail: { key } }));
  }

  return (
    <nav className="pix-attractions-row" aria-label="PIX attractions">
      <span className="pix-attractions-row-label" aria-hidden="true">ATTRACTIONS</span>
      <div className="pix-genres-menu" ref={menuRef}>
        <button
          type="button"
          className="pix-attraction-btn is-genres"
          aria-haspopup="true"
          aria-expanded={genresOpen}
          aria-label="Open the GENRES menu — every genre with a row on this page"
          onClick={() => setGenresOpen((open) => !open)}
        >GENRES ▾</button>
        {genresOpen ? (
          <div className="pix-genres-dropdown" role="menu" aria-label="Genres with a row on this page">
            {genres.length > 0 ? genres.map((genre) => (
              <button
                key={genre.key}
                type="button"
                role="menuitem"
                className="pix-genres-item"
                aria-label={`Go to the ${genre.title} row`}
                onClick={() => openGenreRow(genre.key)}
              >{genre.title}</button>
            )) : <p className="pix-genres-empty">{sectionsQuery.isPending ? "Loading genres…" : "No genre rows yet"}</p>}
          </div>
        ) : null}
      </div>
      <a className="pix-attraction-btn" href="#lists" aria-label="Open PIX.MOV LISTS — your custom lists">PIX.MOV LISTS</a>
      <a className="pix-attraction-btn" href="#top500" aria-label="Open the Top 500 Films of All Time attraction">Top 500 Films</a>
      <a className="pix-attraction-btn" href="#grossers" aria-label="Open the Biggest Financial Success attraction">Biggest Financial Success</a>
      <a className="pix-attraction-btn" href="#sort" aria-label="Open the Have You Seen It attraction — Sort Collection">Have You Seen It?</a>
      <a className="pix-attraction-btn" href="#attractions" aria-label="Open the Friends' Reviews attraction on the ATTRACTIONS page">Friends&apos; Reviews</a>
      <a className="pix-attraction-btn is-all" href="#attractions" aria-label="Open all ATTRACTIONS">All Attractions →</a>
    </nav>
  );
}

function PixBody() {
  return (
    <section className="pix-body pix-body-trimmed" aria-label="PIX discovery">
      <PixHomeSections />
    </section>
  );
}

export function App() {
  const [active, setActive] = useState<SectionKey>(() => sectionFromHash(window.location.hash) ?? "pix");
  const [headerVersion, setHeaderVersion] = useState<1 | 2>(() => sessionPreferenceGet("pix-header-version") === "1" ? 1 : 2);
  const [pixGameOpen, setPixGameOpen] = useState(false);
  const [profileWindowOpen, setProfileWindowOpen] = useState(false);
  const [cineWindowOpen, setCineWindowOpen] = useState(false);
  // Fresh first play every session: NOW PLAYING opens on the all-time mix
  // (every year), never pre-filtered to a single year. The game filter is
  // in-memory only — changing it lasts for this visit, and nothing about
  // it is written to a cookie or storage that a later session would load.
  const [pixGame, setPixGame] = useState<PixGameState>({ category: "movies", movieScope: "all_time", scopeValue: "", actorA: "Robert De Niro", actorB: "Robert Redford" });
  const notesQuery = useQuery({ queryKey: ["notes"], queryFn: () => api.listNotes({}) });
  const notes = notesQuery.data?.notes ?? [];
  const posters = useMemo(() => notes.filter((note) => note.kind === "poster"), [notes]);
  const memos = useMemo(() => notes.filter((note) => note.kind === "memo"), [notes]);

  useEffect(() => {
    function followDeepLink() {
      const linkedSection = sectionFromHash(window.location.hash);
      if (linkedSection) {
        setActive(linkedSection);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    window.addEventListener("hashchange", followDeepLink);
    return () => window.removeEventListener("hashchange", followDeepLink);
  }, []);

  // Remember the page visited just before the current one, so a film
  // (synopsis) page's ← button returns to the page last visited instead
  // of always sending the viewer back to PIX home. Session-only, like
  // every other PIX preference.
  useEffect(() => {
    let previousHash = window.location.hash;
    function rememberVisit() {
      const currentHash = window.location.hash;
      if (previousHash && previousHash !== currentHash) {
        sessionPreferenceSet("pix-last-visited-hash", previousHash.replace(/^#/, ""));
      }
      previousHash = currentHash;
    }
    window.addEventListener("hashchange", rememberVisit);
    return () => window.removeEventListener("hashchange", rememberVisit);
  }, []);

  function selectSection(key: SectionKey) {
    setActive(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeHeaderVersion(version: 1 | 2) {
    sessionPreferenceSet("pix-header-version", String(version));
    setHeaderVersion(version);
  }

  const notesRequired = !["pix", "dna", "pix-profile", "screening", "feature", "seen", "sort", "views", "top500", "grossers", "budgets", "watchlist", "lists", "tough", "attractions", "feedback", "privacy", "agreements"].includes(active);
  if (notesRequired && notesQuery.isPending) {
    return <div className="app-state"><span className="loading-mark" />Loading archive…</div>;
  }
  if (notesRequired && notesQuery.isError) {
    return <div className="app-state error-block">The archive couldn’t be opened. Try again.</div>;
  }

  return (
    <div className={`archive-app ${profileWindowOpen ? "is-profile-window-open" : ""} ${cineWindowOpen ? "is-cine-window-open" : ""}`}>
      <SafeAreaTopScrim backgroundColor="#000" />
      <header className={`pix-app-header is-v${headerVersion} ${pixGameOpen ? "is-game-open" : ""}`}>
        {headerVersion === 1 ? (
          <a className="pixmov-badge" aria-label="Return to PIX home" href="#pix">PIX.MOV</a>
        ) : (
          <a className="pixmov-wordmark" aria-label="Return to PIX home" href="#pix">
            <span>PIX</span><i className="pixmov-bulb" aria-hidden="true" /><span>MOV</span>
          </a>
        )}
        {headerVersion === 2 ? <div className="header-chase header-chase-left" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--bulb-delay": `${(index - 23) * .09}s` } as CSSProperties} />)}</div> : null}
        <HeaderTracker onOpenProfile={() => { window.location.hash = slugBySection["pix-profile"]; selectSection("pix-profile"); }} />
        <button
          className={`header-now-playing ${pixGameOpen ? "is-open" : ""}`}
          type="button"
          aria-label={pixGameOpen ? "Now Playing game is open" : "Open Now Playing game"}
          aria-expanded={pixGameOpen}
          onClick={() => {
            window.location.hash = slugBySection.pix;
            setActive("pix");
            setPixGame((current) => ({ ...current, category: "movies" }));
            setPixGameOpen(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          NOW PLAYING
        </button>
        {headerVersion === 2 && pixGameOpen ? (
          <div className="header-now-playing-active-lights" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--bulb-delay": `${(index - 9) * .09}s` } as CSSProperties} />)}
          </div>
        ) : null}
        {headerVersion === 2 ? <div className="header-chase header-chase-right" aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--bulb-delay": `${(index - 11) * .09}s` } as CSSProperties} />)}</div> : null}
        <div className="top-controls" aria-label="App controls">
          {CINE_ENABLED ? <ContentControl onOpenChange={setCineWindowOpen} /> : null}
          <AccountControl headerVersion={headerVersion} onHeaderVersionChange={changeHeaderVersion} onOpenChange={setProfileWindowOpen} onViewProfile={() => { window.location.hash = slugBySection["pix-profile"]; selectSection("pix-profile"); }} />
        </div>
      </header>
      <main className="archive-main">
        {active === "pix" ? (
          <>
            <PixMarqueeBand />
            <PixSection gameOpen={pixGameOpen} onClose={() => setPixGameOpen(false)} onOpenProfile={() => { setPixGameOpen(false); window.location.hash = slugBySection["pix-profile"]; selectSection("pix-profile"); }} gameState={pixGame} onGameStateChange={setPixGame} gameControls={(onNewActorPair) => <PixSidebarControls game={pixGame} onChange={setPixGame} onNewActorPair={onNewActorPair} />} />
            <AttractionsButtonRow />
            <PixBody />
          </>
        ) : null}
        {active === "dna" ? <PixSection dnaHome gameOpen={pixGameOpen} onClose={() => setPixGameOpen(false)} onOpenProfile={() => { setPixGameOpen(false); window.location.hash = slugBySection["pix-profile"]; selectSection("pix-profile"); }} gameState={pixGame} onGameStateChange={setPixGame} gameControls={(onNewActorPair) => <PixSidebarControls game={pixGame} onChange={setPixGame} onNewActorPair={onNewActorPair} />} /> : null}
        {active === "pix-profile" ? <PixProfileSection /> : null}
        {active === "screening" ? <PixMoviePage imdbId={itemFromHash(window.location.hash, "screening") ?? ""} initialView={hashParts(window.location.hash)[2] === "review" ? "review" : "screening"} /> : null}
        {active === "feature" ? <FeaturePresentationPage /> : null}
        {active === "seen" ? <SeenPage /> : null}
        {active === "sort" ? <SortCollectionPage /> : null}
        {active === "views" ? <ViewsPage /> : null}
        {active === "top500" ? <Top500Page /> : null}
        {active === "grossers" ? <CombGrossersPage /> : null}
        {active === "attractions" ? <AttractionsPage /> : null}
        {active === "feedback" ? <FeedbackPage /> : null}
        {active === "privacy" ? <PrivacyPolicyPage /> : null}
        {active === "agreements" ? <AgreementsPage /> : null}
        {active === "budgets" ? <MoneyRankingPage kind="budget" /> : null}
        {active === "watchlist" ? <WatchlistPage /> : null}
        {active === "lists" ? <UserListsPage /> : null}
        {active === "tough" ? <ToughPixPage /> : null}
        {CINE_ENABLED && active === "cine" ? <CineSection /> : null}
        {active === "section-posters" ? <StoryPosterGallery posters={posters} memos={memos} /> : null}
        {active === "section-monsters" ? <MonstersSection notes={notes} /> : null}
        {active === "section-notes" ? <NotesSection notes={notes} /> : null}
        {active === "section-dream-log" ? <DreamLog notes={notes} /> : null}
        {active === "section-publish" ? <PublishSection notes={notes} /> : null}
      </main>
      <footer className="pix-site-footer">
        <div className="pix-site-footer-main">
          <span className="pix-site-copyright">© 2026 PIX.MOV — All rights reserved. · BUILD V-01-00-38</span>
          <nav className="pix-site-footer-nav" aria-label="Footer">
            <a className="pix-feedback-button" href="#feedback" aria-label="Open the Feedback page — feedback, ideas, issues, and user reports">Feedback</a>
            <button type="button" className="pix-consent-footer-button" onClick={openBiscuitConsent} aria-label="Cookie and Data Consent — open BISCUIT to review or change what PIX.MOV may record">Cookie &amp; Data Consent</button>
            <a href="#privacy" aria-label="Read the PIX.MOV Privacy Policy">Privacy Policy</a>
            <a href="#agreements" aria-label="Read the PIX.MOV Consent Agreements">Agreements</a>
            <a href="#attractions">Attractions</a>
            <a href="#profile">Profile</a>
            <a href="#seen">Catalog</a>
          </nav>
        </div>
        <small className="pix-site-footer-note">
          PIX.MOV is a safe space — no hate speech, talk, or language in user names, list titles, reviews, or discussions.{" "}
          <a href="#feedback">Appeal a safe-space flag or report a user →</a>
        </small>
      </footer>
      <BiscuitConsentGate active={active} />
    </div>
  );
}
