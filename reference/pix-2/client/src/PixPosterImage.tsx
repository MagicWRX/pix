import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { unzipSync } from "fflate";
import { pixPosterEntryByKey } from "./pixPosterManifest";
import { pixMarqueeArchiveByYear } from "./pixMarqueeArchiveManifest";

const archivePromises = new Map<string, Promise<Map<string, string>>>();
const posterUrlCache = new Map<string, string>();
const marqueePosterUrlCache = new Map<string, string>();

function imageContentType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/webp";
}

async function loadArchive(archiveUrl: string): Promise<Map<string, string>> {
  const cached = archivePromises.get(archiveUrl);
  if (cached) return cached;
  const request = (async () => {
    const response = await fetch(archiveUrl);
    if (!response.ok) throw new Error("Poster archive unavailable");
    const files = unzipSync(new Uint8Array(await response.arrayBuffer()));
    const urls = new Map<string, string>();
    for (const [filename, bytes] of Object.entries(files)) {
      const url = URL.createObjectURL(new Blob([bytes], { type: imageContentType(filename) }));
      urls.set(filename, url);
    }
    return urls;
  })();
  archivePromises.set(archiveUrl, request);
  // A failed fetch must not poison the archive for the rest of the session:
  // evict the rejected promise so the next request for any poster from this
  // archive starts a fresh download instead of failing instantly forever.
  void request.catch(() => {
    if (archivePromises.get(archiveUrl) === request) archivePromises.delete(archiveUrl);
  });
  return request;
}

export function hasPixPoster(posterKey: string): boolean {
  return Boolean(pixPosterEntryByKey[posterKey]);
}

export async function getPixPosterUrl(posterKey: string): Promise<string | null> {
  const cached = posterUrlCache.get(posterKey);
  if (cached) return cached;
  const entry = pixPosterEntryByKey[posterKey];
  if (!entry) return null;
  try {
    const urls = await loadArchive(entry.archiveUrl);
    const url = urls.get(entry.filename);
    if (!url) return null;
    posterUrlCache.set(posterKey, url);
    return url;
  } catch {
    return null;
  }
}

function marqueeArchiveUrl(posterKey: string): string | undefined {
  const year = posterKey.slice(0, posterKey.indexOf("-"));
  return pixMarqueeArchiveByYear[year];
}

function marqueeFilename(posterKey: string): string | undefined {
  const filename = pixPosterEntryByKey[posterKey]?.filename;
  return filename ? filename.slice(filename.lastIndexOf("/") + 1) : undefined;
}

export function hasPixMarqueePoster(posterKey: string): boolean {
  return Boolean(pixPosterEntryByKey[posterKey] && marqueeArchiveUrl(posterKey));
}

export async function getPixMarqueePosterUrl(posterKey: string): Promise<string | null> {
  const loaded = await loadMarqueePosterKey(posterKey);
  return loaded ? marqueePosterUrlCache.get(posterKey) ?? null : null;
}

async function loadMarqueePosterKey(posterKey: string): Promise<string | null> {
  const cached = marqueePosterUrlCache.get(posterKey);
  if (cached) return posterKey;
  const archiveUrl = marqueeArchiveUrl(posterKey);
  const filename = marqueeFilename(posterKey);
  if (!archiveUrl || !filename) return null;
  try {
    const urls = await loadArchive(archiveUrl);
    const url = urls.get(filename);
    if (!url) return null;
    marqueePosterUrlCache.set(posterKey, url);
    return posterKey;
  } catch {
    return null;
  }
}

export async function preloadPixMarqueePosters(posterKeys: string[]): Promise<Set<string>> {
  const loaded = new Set<string>();
  let pending = [...posterKeys];
  // One retry pass: a single failed archive fetch used to drop those
  // posters from the marquee for the whole session.
  for (let pass = 0; pass < 2 && pending.length > 0; pass += 1) {
    if (pass > 0) await new Promise((resolve) => { window.setTimeout(resolve, 1500); });
    const results = await Promise.all(pending.map(loadMarqueePosterKey));
    pending = pending.filter((_, index) => results[index] === null);
    for (const key of results) if (key !== null) loaded.add(key);
  }
  return loaded;
}

export function PixMarqueePosterImage({ posterKey, alt, ...props }: { posterKey: string; alt: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  const url = marqueePosterUrlCache.get(posterKey);
  if (!url) return null;
  return <img {...props} src={url} alt={alt} />;
}

const posterLoadRetryDelaysMs = [1200, 3500];

export function PixPosterImage({ posterKey, alt, ...props }: { posterKey: string; alt: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  const entry = pixPosterEntryByKey[posterKey];
  const [fullUrl, setFullUrl] = useState<string | undefined>(() => posterUrlCache.get(posterKey));
  const [marqueeUrl, setMarqueeUrl] = useState<string | undefined>(() => marqueePosterUrlCache.get(posterKey));
  const [attempt, setAttempt] = useState(0);

  // Low-res first: paint the small marquee thumbnail as soon as its (much
  // smaller) archive lands so posters — above all the NOW PLAYING matchup
  // pair — appear instantly instead of waiting on the multi-megabyte
  // full-size poster archive, then swap to full-res when it is ready.
  useEffect(() => {
    let active = true;
    setMarqueeUrl(marqueePosterUrlCache.get(posterKey));
    if (!marqueePosterUrlCache.get(posterKey) && hasPixMarqueePoster(posterKey)) {
      void getPixMarqueePosterUrl(posterKey).then((url) => {
        if (active && url) setMarqueeUrl(url);
      });
    }
    return () => { active = false; };
  }, [posterKey]);

  useEffect(() => {
    let active = true;
    let retryTimer: number | undefined;
    const nextEntry = pixPosterEntryByKey[posterKey];
    const cached = posterUrlCache.get(posterKey);
    if (cached) {
      setFullUrl(cached);
      return () => { active = false; };
    }
    setFullUrl(undefined);
    if (!nextEntry) return () => { active = false; };
    void loadArchive(nextEntry.archiveUrl).then((urls) => {
      const nextUrl = urls.get(nextEntry.filename);
      if (!nextUrl) return;
      posterUrlCache.set(posterKey, nextUrl);
      if (active) setFullUrl(nextUrl);
    }).catch(() => {
      // The poster archives are multi-megabyte downloads; one dropped
      // connection used to leave the poster blank for the whole session.
      // Retry a couple of times with backoff before giving up.
      if (!active) return;
      const delay = posterLoadRetryDelaysMs[attempt];
      if (delay !== undefined) {
        retryTimer = window.setTimeout(() => { if (active) setAttempt((value) => value + 1); }, delay);
      }
    });
    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [posterKey, attempt]);

  if (!entry) return null;
  const url = fullUrl ?? marqueeUrl;
  return <img {...props} src={url} alt={alt} aria-busy={!url} data-resolution={fullUrl ? "full" : marqueeUrl ? "thumbnail" : "loading"} />;
}

// Feature-area poster: paint the small marquee thumbnail first so the card
// is never an empty box while the multi-megabyte full poster archive is
// still downloading, then swap to the full-size poster when it is ready.
// The full archive download only starts when the card is near the
// viewport — a page full of feature cards must not slam the network with
// dozens of multi-megabyte archives for posters nobody can see yet.
export function PixFeaturePosterImage({ posterKey, alt, ...props }: { posterKey: string; alt: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">) {
  const entry = pixPosterEntryByKey[posterKey];
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [marqueeUrl, setMarqueeUrl] = useState<string | undefined>(() => marqueePosterUrlCache.get(posterKey));
  const [fullUrl, setFullUrl] = useState<string | undefined>(() => posterUrlCache.get(posterKey));
  const [nearViewport, setNearViewport] = useState<boolean>(() => Boolean(posterUrlCache.get(posterKey)));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (nearViewport) return;
    const node = imgRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setNearViewport(true);
      return;
    }
    // The margin is generous in EVERY direction — posters glide
    // horizontally through the channel rows, and a 0px horizontal
    // margin left off-screen channel posters stuck on their low-res
    // thumbnails (the Recently Uploaded low-res bug).
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((item) => item.isIntersecting)) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: "800px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [nearViewport]);

  // Safety net: a mounted poster that still has not been marked near
  // the viewport after a few seconds (deep inside a moving track, an
  // observer edge case) starts its full-res load anyway. Archive loads
  // are deduped per archive, so the net costs nothing extra.
  useEffect(() => {
    if (nearViewport) return;
    const timer = window.setTimeout(() => setNearViewport(true), 4000);
    return () => window.clearTimeout(timer);
  }, [nearViewport]);

  useEffect(() => {
    let active = true;
    let retryTimer: number | undefined;
    if (!marqueePosterUrlCache.get(posterKey) && hasPixMarqueePoster(posterKey)) {
      void getPixMarqueePosterUrl(posterKey).then((url) => {
        if (active && url) setMarqueeUrl(url);
      });
    }
    if (nearViewport && !posterUrlCache.get(posterKey)) {
      void getPixPosterUrl(posterKey).then((url) => {
        if (!active) return;
        if (url) {
          setFullUrl(url);
          return;
        }
        // One dropped archive fetch used to strand the poster at
        // thumbnail resolution for the whole session — retry with
        // backoff, like the main poster image does.
        const delay = posterLoadRetryDelaysMs[attempt];
        if (delay !== undefined) {
          retryTimer = window.setTimeout(() => { if (active) setAttempt((value) => value + 1); }, delay);
        }
      });
    }
    return () => {
      active = false;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [posterKey, nearViewport, attempt]);

  if (!entry) return null;
  const url = fullUrl ?? marqueeUrl;
  return <img {...props} ref={imgRef} src={url} alt={alt} aria-busy={!url} data-resolution={fullUrl ? "full" : marqueeUrl ? "thumbnail" : "loading"} />;
}
