import { useEffect, useState } from "react";

// Shared player upgrades for the PIX.MOV movie players (the classic-film
// SCREENING player and the Shorts sequence player):
//
// 1. BILLBOARD — between segments the player shows a full-player
//    billboard for exactly BILLBOARD_SECONDS, then the next clip
//    auto-plays. Until real ads are available the billboard carries a
//    famous movie quote, rotating through the built-in set below.
// 2. DISPLAY CONTROLS — picture-in-picture (standard API + the iOS
//    Safari webkit presentation-mode fallback), full screen (standard
//    API + the iOS webkitEnterFullscreen fallback), and pop-out
//    (Document Picture-in-Picture). Every control detects its own
//    support and hides itself where the device/browser cannot do it.

export const BILLBOARD_SECONDS = 5;

export type BillboardQuote = {
  text: string;
  credit: string;
};

export const FAMOUS_QUOTES: BillboardQuote[] = [
  { text: "Frankly, my dear, I don't give a damn.", credit: "Rhett Butler · Gone with the Wind (1939)" },
  { text: "Here's looking at you, kid.", credit: "Rick Blaine · Casablanca (1942)" },
  { text: "Louis, I think this is the beginning of a beautiful friendship.", credit: "Rick Blaine · Casablanca (1942)" },
  { text: "May the Force be with you.", credit: "Star Wars (1977)" },
  { text: "I'm going to make him an offer he can't refuse.", credit: "Vito Corleone · The Godfather (1972)" },
  { text: "Keep your friends close, but your enemies closer.", credit: "Michael Corleone · The Godfather Part II (1974)" },
  { text: "Toto, I've a feeling we're not in Kansas anymore.", credit: "Dorothy Gale · The Wizard of Oz (1939)" },
  { text: "There's no place like home.", credit: "Dorothy Gale · The Wizard of Oz (1939)" },
  { text: "You talking to me?", credit: "Travis Bickle · Taxi Driver (1976)" },
  { text: "I'll be back.", credit: "The Terminator (1984)" },
  { text: "You can't handle the truth!", credit: "Col. Nathan Jessup · A Few Good Men (1992)" },
  { text: "Mama always said life was like a box of chocolates. You never know what you're gonna get.", credit: "Forrest Gump (1994)" },
  { text: "Houston, we have a problem.", credit: "Jim Lovell · Apollo 13 (1995)" },
  { text: "E.T. phone home.", credit: "E.T. the Extra-Terrestrial (1982)" },
  { text: "Bond. James Bond.", credit: "James Bond · Dr. No (1962)" },
  { text: "To infinity — and beyond!", credit: "Buzz Lightyear · Toy Story (1995)" },
  { text: "Just keep swimming.", credit: "Dory · Finding Nemo (2003)" },
  { text: "It's alive! It's alive!", credit: "Henry Frankenstein · Frankenstein (1931)" },
  { text: "Listen to them, the children of the night. What music they make!", credit: "Count Dracula · Dracula (1931)" },
  { text: "Fasten your seatbelts. It's going to be a bumpy night.", credit: "Margo Channing · All About Eve (1950)" },
  { text: "What we've got here is failure to communicate.", credit: "The Captain · Cool Hand Luke (1967)" },
  { text: "I'm king of the world!", credit: "Jack Dawson · Titanic (1997)" },
  { text: "Carpe diem. Seize the day, boys.", credit: "John Keating · Dead Poets Society (1989)" },
  { text: "I'll have what she's having.", credit: "When Harry Met Sally… (1989)" },
  { text: "You had me at 'hello.'", credit: "Dorothy Boyd · Jerry Maguire (1996)" },
  { text: "Show me the money!", credit: "Jerry Maguire (1996)" },
  { text: "Here's Johnny!", credit: "Jack Torrance · The Shining (1980)" },
  { text: "I love the smell of napalm in the morning.", credit: "Lt. Col. Bill Kilgore · Apocalypse Now (1979)" },
  { text: "Well, nobody's perfect.", credit: "Osgood Fielding III · Some Like It Hot (1959)" },
  { text: "After all, tomorrow is another day!", credit: "Scarlett O'Hara · Gone with the Wind (1939)" },
  { text: "Why so serious?", credit: "The Joker · The Dark Knight (2008)" },
  { text: "There's no crying in baseball!", credit: "Jimmy Dugan · A League of Their Own (1992)" },
  { text: "I see dead people.", credit: "Cole Sear · The Sixth Sense (1999)" },
  { text: "I'm mad as hell, and I'm not going to take this anymore!", credit: "Howard Beale · Network (1976)" },
  { text: "Say 'hello' to my little friend!", credit: "Tony Montana · Scarface (1983)" },
  { text: "Magic mirror on the wall, who is the fairest one of all?", credit: "The Evil Queen · Snow White and the Seven Dwarfs (1937)" },
  { text: "Love means never having to say you're sorry.", credit: "Love Story (1970)" },
  { text: "We rob banks.", credit: "Clyde Barrow · Bonnie and Clyde (1967)" },
];

// The full-player billboard: a famous quote on the PIX gold card, with
// the countdown to the next segment. Rendered as an overlay inside the
// classic player stage, or as a full page in the Shorts sequence.
export function BillboardQuoteCard({
  quote,
  secondsLeft,
  nextLabel,
  variant,
}: {
  quote: BillboardQuote;
  secondsLeft: number;
  nextLabel: string;
  variant: "overlay" | "page";
}) {
  return (
    <div
      className={`pix-billboard pix-billboard-${variant}`}
      role="status"
      aria-label={`Billboard: “${quote.text}” ${quote.credit}. ${nextLabel} in ${secondsLeft} seconds.`}
    >
      <span className="pix-billboard-label">BILLBOARD</span>
      <div className="pix-billboard-countdown" aria-hidden="true">{secondsLeft}</div>
      <blockquote className="pix-billboard-quote">“{quote.text}”</blockquote>
      <p className="pix-billboard-attribution">— {quote.credit}</p>
      <small className="pix-billboard-next">{nextLabel} in {secondsLeft} second{secondsLeft === 1 ? "" : "s"}</small>
    </div>
  );
}

type VideoWithWebkit = HTMLVideoElement & {
  requestPictureInPicture?: () => Promise<unknown>;
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitSetPresentationMode?: (mode: string) => void;
  webkitPresentationMode?: string;
  webkitEnterFullscreen?: () => void;
};

type DocumentWithWebkit = Document & {
  pictureInPictureEnabled?: boolean;
  pictureInPictureElement?: Element | null;
  exitPictureInPicture?: () => Promise<void>;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};

type DocumentPipApi = {
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
};

function documentPipApi(): DocumentPipApi | null {
  const candidate = (window as unknown as { documentPictureInPicture?: DocumentPipApi }).documentPictureInPicture;
  return candidate && typeof candidate.requestWindow === "function" ? candidate : null;
}

function pipSupported(video: HTMLVideoElement | null): boolean {
  if (!video) return false;
  const doc = document as DocumentWithWebkit;
  const v = video as VideoWithWebkit;
  if (doc.pictureInPictureEnabled && typeof v.requestPictureInPicture === "function") return true;
  // iOS / iPadOS Safari (and older macOS Safari): webkit presentation mode.
  return typeof v.webkitSupportsPresentationMode === "function"
    && typeof v.webkitSetPresentationMode === "function"
    && v.webkitSupportsPresentationMode("picture-in-picture");
}

function fullscreenSupported(video: HTMLVideoElement | null, container: HTMLElement | null): boolean {
  if (typeof document !== "undefined" && document.fullscreenEnabled && container && typeof container.requestFullscreen === "function") return true;
  const v = video as VideoWithWebkit | null;
  if (v && typeof v.webkitEnterFullscreen === "function") return true;
  return Boolean(container && typeof container.requestFullscreen === "function");
}

// Picture-in-picture / full screen / pop-out buttons for a playing
// movie. Each button renders only when the current device and browser
// support that capability; unsupported controls are simply absent.
export function PlayerControlButtons({
  videoRef,
  containerRef,
  label,
  align = "end",
}: {
  videoRef: { current: HTMLVideoElement | null };
  containerRef: { current: HTMLElement | null };
  label: string;
  align?: "start" | "end";
}) {
  const [caps, setCaps] = useState({ pip: false, fullscreen: false, popout: false });
  const [pipActive, setPipActive] = useState(false);
  const [fsActive, setFsActive] = useState(false);
  const [popoutOpen, setPopoutOpen] = useState(false);

  useEffect(() => {
    const doc = document as DocumentWithWebkit;
    function sync() {
      const video = videoRef.current as VideoWithWebkit | null;
      setCaps({
        pip: pipSupported(videoRef.current),
        fullscreen: fullscreenSupported(videoRef.current, containerRef.current),
        popout: documentPipApi() !== null,
      });
      const standardPip = Boolean(video) && doc.pictureInPictureElement === video;
      const webkitPip = Boolean(video) && video?.webkitPresentationMode === "picture-in-picture";
      setPipActive(standardPip || webkitPip);
      const fsElement = document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setFsActive(Boolean(fsElement) && fsElement === containerRef.current);
    }
    sync();
    const delayed = window.setTimeout(sync, 300);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    document.addEventListener("enterpictureinpicture", sync);
    document.addEventListener("leavepictureinpicture", sync);
    document.addEventListener("webkitpresentationmodechanged", sync);
    return () => {
      window.clearTimeout(delayed);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      document.removeEventListener("enterpictureinpicture", sync);
      document.removeEventListener("leavepictureinpicture", sync);
      document.removeEventListener("webkitpresentationmodechanged", sync);
    };
  }, [videoRef, containerRef]);

  async function togglePip() {
    const video = videoRef.current as VideoWithWebkit | null;
    if (!video) return;
    const doc = document as DocumentWithWebkit;
    try {
      if (pipActive) {
        if (doc.pictureInPictureElement && typeof doc.exitPictureInPicture === "function") {
          await doc.exitPictureInPicture();
        } else if (typeof video.webkitSetPresentationMode === "function") {
          video.webkitSetPresentationMode("inline");
        }
        setPipActive(false);
        return;
      }
      if (typeof video.requestPictureInPicture === "function" && doc.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      } else if (typeof video.webkitSetPresentationMode === "function") {
        video.webkitSetPresentationMode("picture-in-picture");
      }
      setPipActive(true);
    } catch {
      // The browser refused (no user gesture, DRM, or a racing state) —
      // leave the player exactly as it is.
      setPipActive(false);
    }
  }

  async function toggleFullscreen() {
    const doc = document as DocumentWithWebkit;
    const container = containerRef.current;
    const video = videoRef.current as VideoWithWebkit | null;
    try {
      if (fsActive || document.fullscreenElement || doc.webkitFullscreenElement) {
        if (typeof document.exitFullscreen === "function") await document.exitFullscreen();
        else if (typeof doc.webkitExitFullscreen === "function") doc.webkitExitFullscreen();
        setFsActive(false);
        return;
      }
      if (container && typeof container.requestFullscreen === "function") {
        await container.requestFullscreen();
        setFsActive(true);
      } else if (video && typeof video.webkitEnterFullscreen === "function") {
        // iPhone Safari has no element fullscreen — the video itself
        // goes fullscreen with the native player.
        video.webkitEnterFullscreen();
      }
    } catch {
      // Fall back to the iOS video fullscreen when the container
      // request was rejected.
      if (video && typeof video.webkitEnterFullscreen === "function") {
        try { video.webkitEnterFullscreen(); } catch { /* unsupported after all */ }
      }
    }
  }

  async function popOut() {
    const video = videoRef.current;
    const api = documentPipApi();
    if (!video || !api || popoutOpen) return;
    try {
      const width = Math.min(960, Math.max(320, video.videoWidth || 640));
      const height = Math.min(720, Math.max(200, video.videoHeight || 360));
      const pipWindow = await api.requestWindow({ width, height });
      const pipDoc = pipWindow.document;
      pipDoc.title = label;
      const style = pipDoc.createElement("style");
      style.textContent = "html, body { margin: 0; height: 100%; background: #000; } video { display: block; width: 100%; height: 100%; object-fit: contain; background: #000; }";
      pipDoc.head.appendChild(style);
      const pipVideo = pipDoc.createElement("video");
      pipVideo.src = video.currentSrc || video.src;
      pipVideo.controls = true;
      pipVideo.autoplay = true;
      pipVideo.muted = video.muted;
      pipVideo.setAttribute("aria-label", label);
      const startAt = video.currentTime;
      const wasPlaying = !video.paused && !video.ended;
      pipVideo.addEventListener("loadedmetadata", () => {
        try { pipVideo.currentTime = startAt; } catch { /* keep playing from the start */ }
        void pipVideo.play().catch(() => undefined);
      }, { once: true });
      pipDoc.body.appendChild(pipVideo);
      video.pause();
      setPopoutOpen(true);
      pipWindow.addEventListener("pagehide", () => {
        setPopoutOpen(false);
        const current = videoRef.current;
        if (!current) return;
        try {
          if (Number.isFinite(pipVideo.currentTime) && pipVideo.currentTime > 0) current.currentTime = pipVideo.currentTime;
        } catch { /* the inline player keeps its own position */ }
        if (wasPlaying) void current.play().catch(() => undefined);
      }, { once: true });
    } catch {
      // Pop-out was dismissed or is unavailable at runtime — the
      // inline player is untouched.
    }
  }

  if (!caps.pip && !caps.fullscreen && !caps.popout) return null;

  return (
    <div className={`pix-player-controls${align === "start" ? " pix-player-controls-start" : ""}`} role="group" aria-label={`${label} — display controls`}>
      {caps.pip ? (
        <button
          type="button"
          className="pix-player-control-btn"
          onClick={() => void togglePip()}
          aria-label={pipActive ? `Exit picture in picture for ${label}` : `Play ${label} in picture in picture`}
          title={pipActive ? "Exit picture in picture" : "Picture in picture"}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
            <rect x="12.5" y="11" width="6" height="4.5" fill="currentColor" />
          </svg>
        </button>
      ) : null}
      {caps.popout ? (
        <button
          type="button"
          className="pix-player-control-btn"
          onClick={() => void popOut()}
          disabled={popoutOpen}
          aria-label={`Pop out ${label} into a floating window`}
          title="Pop out"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M14 4h6v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20 4 11.5 12.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M9.5 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
      {caps.fullscreen ? (
        <button
          type="button"
          className="pix-player-control-btn"
          onClick={() => void toggleFullscreen()}
          aria-label={fsActive ? `Exit full screen for ${label}` : `Play ${label} in full screen`}
          title={fsActive ? "Exit full screen" : "Full screen"}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M4 9V5a1 1 0 0 1 1-1h4M20 9V5a1 1 0 0 0-1-1h-4M4 15v4a1 1 0 0 0 1 1h4M20 15v4a1 1 0 0 1-1 1h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
