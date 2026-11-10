import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import { getPixPosterUrl, hasPixPoster, PixPosterImage } from "./PixPosterImage";

export { hasPixPoster, PixPosterImage };

type PixAd = ApiResponse<typeof api, "getPixControlState">["ads"][number];
type PixPairMovie = NonNullable<ApiResponse<typeof api, "getPixPair">["pair"]>[number];

// BISCUIT — PIX.MOV's single consent launcher — is mounted once, at
// the App level. Anything in the game that reaches the consent gate
// asks for it through this one event, so there is only ever one
// launcher and one consent truth: the profile fields written by
// savePixConsent (cookie_decision / personalization / ad_measurement).
export function openBiscuitConsent() {
  window.dispatchEvent(new CustomEvent("pix:open-consent"));
}



// BISCUIT — PIX.MOV's cookie & data consent launcher. This is the
// app's single consent gate: it asks permission before any optional
// recording, writes the one consent truth (the profile's
// cookie_decision / personalization / ad_measurement via
// savePixConsent), and links the Privacy Policy and Consent
// Agreements pages. Mounted once by the App-level BiscuitConsentGate.
export function BiscuitLauncher({
  decision,
  savedPersonalization,
  savedAdMeasurement,
  onClose,
}: {
  decision: "pending" | "accepted" | "declined";
  savedPersonalization: boolean;
  savedAdMeasurement: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [personalization, setPersonalization] = useState(savedPersonalization);
  const [adMeasurement, setAdMeasurement] = useState(savedAdMeasurement);
  const consent = useMutation({
    mutationFn: (next: { decision: "accepted" | "declined"; personalization: boolean; adMeasurement: boolean }) => api.savePixConsent({
      decision: next.decision,
      personalization: next.personalization,
      ad_measurement: next.adMeasurement,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pix-control"] });
      onClose();
    },
  });

  return (
    <div className="cookie-window" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <div className="cookie-panel">
        <div className="cookie-heading">
          <div>
            <p className="kicker">BISCUIT · Cookie &amp; Data Consent</p>
            <h2 id="cookie-title">Play anonymously or save your choices</h2>
          </div>
          {decision !== "pending" ? <button type="button" className="close-button" aria-label="Close BISCUIT consent settings" onClick={onClose}>×</button> : null}
        </div>
        <p className="cookie-copy">BISCUIT is PIX.MOV&apos;s consent launcher — the one place that decides what PIX may record about you. PIX starts in anonymous mode. Until you accept, and whenever you decline, PIX records nothing personal: no game choices saved to a profile, no FILM DNA, no ad measurement — only what the page needs to run and this decision itself.</p>
        {decision !== "pending" ? (
          <p className="cookie-copy" role="status">Your current decision: <strong>{decision === "accepted" ? "Accepted" : "Declined"}</strong> — you can change it here at any time.</p>
        ) : null}
        <p className="biscuit-links">
          <a href="#privacy" onClick={onClose}>Read the Privacy Policy</a>
          <a href="#agreements" onClick={onClose}>Read the Consent Agreements</a>
        </p>
        <div className="consent-options">
          <label className="consent-row">
            <span><strong>Essential</strong><small>Required to run this private app and remember this privacy choice.</small></span>
            <input type="checkbox" checked disabled aria-label="Essential cookies enabled" />
          </label>
          <label className="consent-row">
            <span><strong>Save my PIX data</strong><small>Stores your profile and movie choices in PIX.</small></span>
            <input type="checkbox" checked={personalization} onChange={(event) => setPersonalization(event.target.checked)} aria-label="Save my PIX data" />
          </label>
          <label className="consent-row">
            <span><strong>Ad measurement</strong><small>Allows aggregate interaction measurement for managed ad placements.</small></span>
            <input type="checkbox" checked={adMeasurement} onChange={(event) => setAdMeasurement(event.target.checked)} aria-label="Allow ad measurement" />
          </label>
        </div>
        <div className="cookie-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={consent.isPending}
            aria-label="Decline — play anonymously and record nothing personal"
            onClick={() => consent.mutate({ decision: "declined", personalization: false, adMeasurement: false })}
          >
            Decline
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={consent.isPending}
            aria-label="Accept — save my PIX data with the options above"
            onClick={() => consent.mutate({ decision: "accepted", personalization, adMeasurement })}
          >
            {consent.isPending ? "Saving…" : "Accept"}
          </button>
        </div>
        {consent.isError ? <p className="form-error" role="alert">Your BISCUIT decision did not save. Please try again.</p> : null}
      </div>
    </div>
  );
}

function AdManager({ ads }: { ads: PixAd[] }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [placement, setPlacement] = useState<"matchup" | "profile" | "shorts">("matchup");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);

  function reset() {
    setEditingId(null);
    setTitle("");
    setBody("");
    setPlacement("matchup");
    setCtaLabel("");
    setCtaUrl("");
    setActive(false);
  }

  function editAd(ad: PixAd) {
    setEditingId(ad.id);
    setTitle(ad.title);
    setBody(ad.body);
    setPlacement(ad.placement);
    setCtaLabel(ad.cta_label);
    setCtaUrl(ad.cta_url ?? "");
    setActive(ad.active);
  }

  const save = useMutation({
    mutationFn: () => api.savePixAd({
      id: editingId,
      title,
      body,
      placement,
      cta_label: ctaLabel,
      cta_url: ctaUrl.trim() || null,
      active,
    }),
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: ["pix-control"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deletePixAd({ id }),
    onSuccess: async () => {
      reset();
      await queryClient.invalidateQueries({ queryKey: ["pix-control"] });
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <details className="ad-manager" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary><span>Ad content manager</span><small>{ads.length} item{ads.length === 1 ? "" : "s"}</small></summary>
      {open ? <div className="ad-manager-body">
        <form className="ad-form" onSubmit={submit}>
          <div className="form-heading"><h2>{editingId ? "Edit ad" : "Add ad"}</h2><span>Backend managed</span></div>
          <label htmlFor="ad-title">Headline</label>
          <input id="ad-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required />
          <label htmlFor="ad-body">Message</label>
          <textarea id="ad-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={500} />
          <div className="ad-form-grid">
            <div>
              <label htmlFor="ad-placement">Placement</label>
              <select id="ad-placement" value={placement} onChange={(event) => setPlacement(event.target.value as "matchup" | "profile" | "shorts")}>
                <option value="matchup">Matchup</option>
                <option value="profile">Profile</option>
                <option value="shorts">Shorts break</option>
              </select>
            </div>
            <div>
              <label htmlFor="ad-cta">Button label</label>
              <input id="ad-cta" value={ctaLabel} onChange={(event) => setCtaLabel(event.target.value)} maxLength={40} placeholder="Learn more" />
            </div>
          </div>
          <label htmlFor="ad-url">Destination URL</label>
          <input id="ad-url" type="url" value={ctaUrl} onChange={(event) => setCtaUrl(event.target.value)} placeholder="https://…" />
          <label className="active-toggle"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Active</label>
          <div className="ad-form-actions">
            <button className="primary-button" type="submit" disabled={save.isPending || !title.trim()}>{save.isPending ? "Saving…" : editingId ? "Update ad" : "Add ad"}</button>
            {editingId ? <button className="secondary-button" type="button" onClick={reset}>Cancel</button> : null}
          </div>
          {save.isError ? <p className="form-error" role="alert">The ad did not save. Check the link and try again.</p> : null}
        </form>
        <div className="managed-ad-list" aria-label="Managed ad content">
          {ads.length === 0 ? <p className="empty-state">No ad content yet.</p> : ads.map((ad) => (
            <article className="managed-ad" key={ad.id}>
              <div><span className={ad.active ? "ad-status active" : "ad-status"}>{ad.active ? "Active" : "Paused"}</span><small>{ad.placement}</small></div>
              <h3>{ad.title}</h3>
              {ad.body ? <p>{ad.body}</p> : null}
              <div className="managed-ad-actions">
                <button type="button" onClick={() => editAd(ad)}>Edit</button>
                <button type="button" onClick={() => remove.mutate(ad.id)} disabled={remove.isPending}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      </div> : null}
    </details>
  );
}

export type PixGameSelection =
  | { category: "movies"; subcategory: "all_time" | "genre" | "decade" | "year"; value: string }
  | { category: "actors"; subcategory: "head_to_head"; actor_a: string; actor_b: string };

export const pixGenreOptions = ["All genres", "Crime", "Sci-Fi", "Horror"];

// The saved interest call, readable on the poster itself (same states
// as every other poster surface in PIX): Want to See → gold outline,
// Maybe → orange outline, No Thanks → poster dimmed under black.
function interestVerdictClass(interest: string | undefined): string {
  return interest === "want_to_see" ? "is-verdict-want"
    : interest === "maybe" ? "is-verdict-maybe"
    : interest === "not_interested" ? "is-verdict-no"
    : "";
}
export const pixDecadeOptions = ["1970", "2000", "2010"];

export type PixGameState = {
  category: "movies" | "actors";
  movieScope: "all_time" | "genre" | "decade" | "year";
  scopeValue: string;
  actorA: string;
  actorB: string;
};
const whyOptions = ["Story", "Performance", "Feeling", "Craft", "Rewatch value"];

export function FilmDnaSearch({ onOpenProfile, recordedPercentage }: { onOpenProfile: () => void; recordedPercentage: number }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const profile = useQuery({ queryKey: ["film-dna-profile"], queryFn: () => api.getFilmDnaProfile({}) });
  const search = useMutation({
    mutationFn: (value: string) => api.searchFilmDna({ query: value }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["film-dna-profile"] }); },
  });
  return (
    <details className="film-dna-panel">
      <summary><button className="film-dna-profile-link" type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onOpenProfile(); }}>FILM DNA {recordedPercentage.toFixed(2)}%</button><small>Open profile →</small></summary>
      {profile.data ? <div className="film-dna-signature" aria-label="Film DNA taste signature">
        <span><strong>{profile.data.vote_count}</strong> choices</span>
        <span><strong>{profile.data.unseen_count}</strong> not watched</span>
        <span><strong>{profile.data.query_count}</strong> searches</span>
        <small>{profile.data.similarity_ready ? "Ready to compare with people who share your taste" : `${Math.max(0, 5 - profile.data.vote_count)} more choices to start taste matching`}</small>
        {profile.data.top_genres.length ? <div className="film-dna-chips" aria-label="Strongest genre signals">{profile.data.top_genres.map((genre) => <span key={genre.label}>{genre.label}</span>)}</div> : null}
      </div> : null}
      <form onSubmit={(event) => { event.preventDefault(); if (query.trim().length >= 8) search.mutate(query.trim()); }}>
        <label htmlFor="film-dna-query">What kind of movie are you looking for?</label>
        <div className="film-dna-search-row">
          <textarea id="film-dna-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={500} placeholder="A classic movie with a strong female lead, not romantic, with a happy ending" />
          <button type="submit" disabled={search.isPending || query.trim().length < 8}>{search.isPending ? "Matching…" : "Find movies"}</button>
        </div>
      </form>
      {search.isError ? <p className="form-error" role="alert">Film DNA couldn’t search right now. Try again.</p> : null}
      {search.data ? (
        <div className="film-dna-results" aria-live="polite">
          {search.data.matches.length === 0 ? <p className="empty-state">No evidence-backed matches yet. Try a broader description.</p> : search.data.matches.map((movie) => {
            return <article key={movie.imdb_id} className="film-dna-result">
              {hasPixPoster(movie.poster_key) ? <a href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open MY SCREENING for ${movie.title}`}><PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} movie poster`} /></a> : null}
              <div>
                <div className="film-dna-result-head"><h3>{movie.title}</h3><strong>{movie.confidence}%</strong></div>
                <p className="film-dna-meta">{movie.year} · {movie.genre}</p>
                <p>{movie.reason}</p>
                <details><summary>Synopsis &amp; watch options</summary><p>{movie.synopsis}</p><div className="film-dna-links">{movie.watch_links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.title} ↗</a>)}</div><a href={movie.source_url} target="_blank" rel="noreferrer">Movie source ↗</a></details>
              </div>
            </article>;
          })}
          <small className="film-dna-asof">Watch links searched {new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(search.data.searched_at))}.</small>
        </div>
      ) : null}
    </details>
  );
}

export function FanTypePanel({ onApplied }: { onApplied?: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const fanState = useQuery({ queryKey: ["pix-fan-types"], queryFn: () => api.getPixFanTypeState({}) });
  const save = useMutation({
    mutationFn: (choice: { kind: "none" | "type" | "genre" | "decade"; value: string }) => api.savePixFanFocus(choice),
    onSuccess: async () => {
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["pix-fan-types"] });
      await queryClient.invalidateQueries({ queryKey: ["pix-pair"] });
      onApplied?.();
    },
  });
  const state = fanState.data;
  if (!state) return null;
  const showQuestion = state.should_ask || editing;
  const leading = [...state.fan_types].sort((left, right) => right.share - left.share).slice(0, 3);
  return (
    <section className={`pix-fan-panel ${showQuestion ? "pix-fan-panel-open" : ""}`} aria-labelledby="pix-fan-heading">
      <div className="pix-fan-panel-head">
        <div>
          <p className="kicker">FAN TYPE</p>
          <h2 id="pix-fan-heading">{showQuestion ? "What do you want more of?" : "Your live blend"}</h2>
        </div>
        {!showQuestion ? <button type="button" onClick={() => setEditing(true)}>Change</button> : null}
      </div>
      {!showQuestion ? (
        <div className="pix-fan-blend" aria-label="Current fan type blend">
          {leading.map((type) => <span key={type.type_key}><strong>{type.label}</strong><small>{type.share}% blend · {type.confidence}% confidence</small></span>)}
        </div>
      ) : (
        <div className="pix-fan-choices">
          <div><h3>Fan type</h3><div>{state.fan_types.map((type) => <button key={type.type_key} type="button" disabled={save.isPending} onClick={() => save.mutate({ kind: "type", value: type.type_key })}><strong>{type.label}</strong><small>{type.description}</small></button>)}</div></div>
          <div><h3>Genre</h3><div>{state.genres.map((genre) => <button key={genre} type="button" disabled={save.isPending} onClick={() => save.mutate({ kind: "genre", value: genre })}>{genre}</button>)}</div></div>
          <div><h3>Decade</h3><div>{state.decades.map((decade) => <button key={decade} type="button" disabled={save.isPending} onClick={() => save.mutate({ kind: "decade", value: decade })}>{decade}</button>)}</div></div>
          <button className="pix-fan-not-now" type="button" disabled={save.isPending} onClick={() => save.mutate({ kind: "none", value: "" })}>Not now</button>
        </div>
      )}
      {save.isError ? <p className="form-error" role="alert">That preference didn’t save. Try again.</p> : null}
    </section>
  );
}

export function PixSection({ dnaHome = false, gameOpen, onClose, onOpenProfile: _onOpenProfile, gameState, onGameStateChange, gameControls }: { dnaHome?: boolean; gameOpen: boolean; onClose: () => void; onOpenProfile: () => void; gameState: PixGameState; onGameStateChange: (next: PixGameState) => void; gameControls: (onNewActorPair: () => void) => ReactNode }) {
  const queryClient = useQueryClient();
  const [round, setRound] = useState(0);
  const [gameControlsOpen, setGameControlsOpen] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [recentActorQids, setRecentActorQids] = useState<string[]>([]);
  const { category, movieScope, scopeValue, actorA, actorB } = gameState;
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [activePair, setActivePair] = useState<ApiResponse<typeof api, "getPixPair">["pair"]>(null);
  const [pendingChoice, setPendingChoice] = useState<{ winner: string; loser: string } | null>(null);
  const [whyTag, setWhyTag] = useState("");
  const [whyDetail, setWhyDetail] = useState("");
  const [dragPosition, setDragPosition] = useState<{ movieId: string; y: number } | null>(null);
  const [interestByMovie, setInterestByMovie] = useState<Record<string, "want_to_see" | "maybe" | "not_interested" | "never_heard_of_it">>({});
  const [openInterestId, setOpenInterestId] = useState<string | null>(null);
  const [interestMessage, setInterestMessage] = useState("");
  const [toughShare, setToughShare] = useState<{ id: string; leftTitle: string; rightTitle: string } | null>(null);
  const [toughMessage, setToughMessage] = useState("");
  const [missCount, setMissCount] = useState(0);
  const [catalogPromptOpen, setCatalogPromptOpen] = useState(false);
  const [catalogSearchInput, setCatalogSearchInput] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogBatchSeed, setCatalogBatchSeed] = useState(84621);
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<Set<string>>(() => new Set());
  // Films from batches the server confirmed as triaged this session. The
  // catalog query already excludes them server-side; this session filter is
  // the guarantee that a submitted film can never be re-dealt into a later
  // batch while this page is open, even off a stale cached response.
  const [submittedCatalogIds, setSubmittedCatalogIds] = useState<Set<string>>(() => new Set());
  const [catalogStatus, setCatalogStatus] = useState("");
  const catalogPromptShown = useRef(false);
  const activeDrag = useRef<{ pointerId: number; movieId: string; startY: number; y: number; dragged: boolean } | null>(null);
  const suppressClick = useRef(new Set<string>());
  // Winner-stays ("king of the hill"): the picked film keeps its slot and
  // one prefetched challenger replaces the loser, so a pick never waits on
  // the network. The queue is topped up in the background; every queued
  // film was dealt excluding the films shown before it in the sequence.
  const [streak, setStreak] = useState<{ imdbId: string; count: number } | null>(null);
  const streakBestRef = useRef<Record<string, number>>({});
  const challengerQueueRef = useRef<PixPairMovie[]>([]);
  const toppingUpRef = useRef(false);
  const activePairRef = useRef(activePair);
  const recentIdsRef = useRef<string[]>([]);

  const game = useMemo<PixGameSelection>(() => category === "actors"
    ? { category: "actors", subcategory: "head_to_head", actor_a: actorA, actor_b: actorB }
    : { category: "movies", subcategory: movieScope, value: movieScope === "all_time" ? "" : scopeValue },
  [actorA, actorB, category, movieScope, scopeValue]);

  useEffect(() => { activePairRef.current = activePair; }, [activePair]);
  useEffect(() => { recentIdsRef.current = recentIds; }, [recentIds]);

  // Draw up to `count` challengers from the prefetched queue, skipping
  // anything excluded or missing poster art. Drawn films leave the queue.
  function takeChallengers(count: number, exclude: Set<string>): PixPairMovie[] {
    const taken: PixPairMovie[] = [];
    const queue = challengerQueueRef.current;
    for (let index = 0; index < queue.length && taken.length < count;) {
      const movie = queue[index];
      if (!movie || exclude.has(movie.imdb_id) || !hasPixPoster(movie.poster_key)) {
        queue.splice(index, 1);
        continue;
      }
      queue.splice(index, 1);
      taken.push(movie);
      exclude.add(movie.imdb_id);
    }
    return taken;
  }

  // Background top-up: keep ~4 challenger films (two getPixPair draws)
  // buffered ahead of the visible pair, posters preloaded, so the next
  // round paints instantly when the viewer picks.
  async function topUpChallengers(extraExclude: string[] = []) {
    if (category !== "movies" || toppingUpRef.current) return;
    toppingUpRef.current = true;
    try {
      let fetches = 0;
      while (challengerQueueRef.current.length < 4 && fetches < 4) {
        fetches += 1;
        const exclude = new Set<string>([
          ...recentIdsRef.current,
          ...(activePairRef.current?.map((movie) => movie.imdb_id) ?? []),
          ...challengerQueueRef.current.map((movie) => movie.imdb_id),
          ...extraExclude,
        ]);
        const result = await api.getPixPair({ exclude_ids: [...exclude].slice(0, 200), game });
        if (!result.pair) break;
        for (const movie of result.pair) {
          if (exclude.has(movie.imdb_id) || !hasPixPoster(movie.poster_key)) continue;
          exclude.add(movie.imdb_id);
          challengerQueueRef.current.push(movie);
          void getPixPosterUrl(movie.poster_key);
        }
      }
    } catch {
      // Prefetch is best-effort: if a background draw fails, the live
      // pair query still deals the next round the way it always has.
    } finally {
      toppingUpRef.current = false;
    }
  }

  const controlQuery = useQuery({ queryKey: ["pix-control"], queryFn: () => api.getPixControlState({}) });
  const catalogQuery = useQuery({
    queryKey: ["pix-watched-catalog", catalogSearch, catalogBatchSeed],
    queryFn: () => api.listPixBrowseCatalog({
      genre: null,
      country: null,
      year: null,
      decade: null,
      discovery: "all",
      exclude_international: false,
      offset: 0,
      limit: 24,
      shuffle_seed: catalogBatchSeed,
      query: catalogSearch || null,
      exclude_triaged: true,
      exclude_dismissed: false,
    }),
    enabled: catalogPromptOpen,
  });
  const profile = controlQuery.data?.profile;
  const ads = controlQuery.data?.ads ?? [];
  const activeAds = ads.filter((ad) => ad.active);
  const catalogMovies = (catalogQuery.data?.movies ?? []).filter((movie) => !movie.seen && !submittedCatalogIds.has(movie.imdb_id) && hasPixPoster(movie.poster_key)).slice(0, 12);

  useEffect(() => {
    setRecentIds([]);
    setActivePair(null);
    setChosenId(null);
    setPendingChoice(null);
    setWhyTag("");
    setWhyDetail("");
    setOpenInterestId(null);
    setInterestMessage("");
    setMissCount(0);
    setCatalogPromptOpen(false);
    setSelectedCatalogIds(new Set());
    setCatalogStatus("");
    catalogPromptShown.current = false;
    challengerQueueRef.current = [];
    setStreak(null);
    streakBestRef.current = {};
    setRound((value) => value + 1);
  }, [category, movieScope, scopeValue, actorA, actorB]);

  useEffect(() => {
    if (category !== "movies" || missCount < 3 || catalogPromptShown.current) return;
    catalogPromptShown.current = true;
    setCatalogPromptOpen(true);
  }, [category, missCount]);

  useEffect(() => {
    if (!dnaHome) return;
    function followDnaOption() {
      const option = window.location.hash.replace(/^#\/?dna\/?/, "").toLowerCase();
      if (option === "year" && (category !== "movies" || movieScope !== "year" || !/^\d{4}$/.test(scopeValue))) {
        onGameStateChange({ ...gameState, category: "movies", movieScope: "year", scopeValue: /^\d{4}$/.test(scopeValue) ? scopeValue : "1979" });
      }
      if (!["category", "game-type", "year"].includes(option)) return;
      window.setTimeout(() => {
        const control = document.getElementById(`dna-${option}`);
        control?.scrollIntoView({ behavior: "smooth", block: "center" });
        control?.focus({ preventScroll: true });
      }, 0);
    }
    followDnaOption();
    window.addEventListener("hashchange", followDnaOption);
    return () => window.removeEventListener("hashchange", followDnaOption);
  }, [dnaHome, gameState, onGameStateChange, scopeValue]);

  const pairQuery = useQuery({
    queryKey: ["pix-pair", round, game],
    queryFn: () => api.getPixPair({ exclude_ids: recentIds, game }),
    enabled: category === "movies",
    staleTime: Infinity,
  });
  const actorPairQuery = useQuery({
    queryKey: ["pix-actor-pair", round],
    queryFn: () => api.getRandomPixActorPair({ exclude_qids: recentActorQids }),
    enabled: category === "actors",
    staleTime: Infinity,
  });

  useEffect(() => {
    const pair = pairQuery.data?.pair ?? null;
    setActivePair(pair);
    if (pair) {
      for (const movie of pair) void getPixPosterUrl(movie.poster_key);
      if (gameOpen) void topUpChallengers();
    }
  }, [pairQuery.data]);

  useEffect(() => {
    if (gameOpen && activePair) void topUpChallengers();
  }, [gameOpen]);

  function resetChoiceState() {
    setChosenId(null);
    setPendingChoice(null);
    setWhyTag("");
    setWhyDetail("");
    setOpenInterestId(null);
    setInterestMessage("");
    setToughShare(null);
    setToughMessage("");
  }

  function advancePair() {
    const pair = activePair;
    const actorPair = actorPairQuery.data?.pair;
    if (pair) setRecentIds((current) => [...pair.map((movie) => movie.imdb_id), ...current].slice(0, 198));
    if (actorPair) setRecentActorQids((current) => [...actorPair.map((actor) => actor.qid), ...current].slice(0, 12));
    resetChoiceState();
    // A full re-deal ends any win streak — the hill changes hands.
    setStreak(null);
    if (category === "movies" && pair) {
      // Deal the fresh pair from the prefetched queue when it is stocked:
      // no network wait, no "Dealing…" gap between rounds.
      const exclude = new Set<string>([...recentIdsRef.current, ...pair.map((movie) => movie.imdb_id)]);
      const fresh = takeChallengers(2, exclude);
      const [first, second] = fresh;
      if (first && second) {
        setActivePair([first, second] as typeof activePair);
        void topUpChallengers([first.imdb_id, second.imdb_id]);
        return;
      }
    }
    setRound((value) => value + 1);
  }

  const vote = useMutation({
    mutationFn: ({ winner, loser, why }: { winner: string; loser: string; why: string }) => api.recordPixVote({ winner_imdb_id: winner, loser_imdb_id: loser, why, game }),
    onSuccess: (result, variables) => {
      if (result.requires_consent) {
        setChosenId(null);
        setPendingChoice(null);
        openBiscuitConsent();
        return;
      }
      setMissCount(0);
      void queryClient.invalidateQueries({ queryKey: ["pix-control"] });
      void queryClient.invalidateQueries({ queryKey: ["pix-fan-types"] });
      // Winner stays: the picked film keeps its slot and its win streak;
      // only the loser leaves (into the session exclude list) and one
      // prefetched challenger takes its place — no fresh pair, no wait.
      const pair = activePair;
      const winnerMovie = pair?.find((movie) => movie.imdb_id === variables.winner);
      setRecentIds((current) => [variables.loser, ...current].slice(0, 238));
      setStreak((current) => {
        const next = current && current.imdbId === variables.winner
          ? { imdbId: variables.winner, count: current.count + 1 }
          : { imdbId: variables.winner, count: 1 };
        if (next.count > (streakBestRef.current[variables.winner] ?? 0)) {
          streakBestRef.current[variables.winner] = next.count;
        }
        return next;
      });
      resetChoiceState();
      if (pair && winnerMovie) {
        const exclude = new Set<string>([...recentIdsRef.current, variables.winner, variables.loser]);
        const [challenger] = takeChallengers(1, exclude);
        if (challenger) {
          setActivePair(pair.map((movie) => movie.imdb_id === variables.loser ? challenger : movie) as typeof pair);
          void topUpChallengers([variables.winner, challenger.imdb_id]);
          return;
        }
      }
      // No challenger buffered yet (prefetch still catching up): fall back
      // to a fresh deal rather than leaving the loser on screen.
      setStreak(null);
      setRecentIds((current) => [variables.winner, ...current].slice(0, 238));
      setRound((value) => value + 1);
    },
    onError: () => setChosenId(null),
  });
  const unseen = useMutation({
    mutationFn: ({ imdbId, keepId }: { imdbId: string; keepId: string }) => api.markPixUnseen({ imdb_id: imdbId, keep_imdb_id: keepId, exclude_ids: recentIds, game }),
    onSuccess: (result, variables) => {
      if (result.requires_consent) {
        openBiscuitConsent();
        return;
      }
      setMissCount((current) => current + 1);
      setRecentIds((current) => [variables.imdbId, ...current].slice(0, 238));
      // If the streak holder itself is marked unseen, the streak ends.
      setStreak((current) => current && current.imdbId === variables.imdbId ? null : current);
      const replacement = result.replacement;
      if (!replacement) {
        // No replacement in this lane — deal a fresh pair rather than
        // leaving the not-seen film in the matchup.
        advancePair();
      } else {
        setActivePair((current) => {
          if (!current) return current;
          return current.map((movie) => movie.imdb_id === variables.imdbId ? replacement : movie) as typeof current;
        });
      }
      void queryClient.invalidateQueries({ queryKey: ["pix-control"] });
      void queryClient.invalidateQueries({ queryKey: ["pix-fan-types"] });
    },
  });
  const skipPair = useMutation({
    mutationFn: ({ firstId, secondId }: { firstId: string; secondId: string }) => api.recordPixPairSkip({
      imdb_ids: [firstId, secondId],
      game,
    }),
    onSuccess: () => {
      setMissCount((current) => current + 1);
      void queryClient.invalidateQueries({ queryKey: ["pix-control"] });
      void queryClient.invalidateQueries({ queryKey: ["pix-fan-types"] });
      void queryClient.invalidateQueries({ queryKey: ["film-dna-profile"] });
    },
    onSettled: () => advancePair(),
  });
  function dealAgain() {
    const first = activePair?.[0];
    const second = activePair?.[1];
    if (category !== "movies" || !first || !second) {
      advancePair();
      return;
    }
    skipPair.mutate({ firstId: first.imdb_id, secondId: second.imdb_id });
  }
  const interest = useMutation({
    mutationFn: ({ imdbId, value }: { imdbId: string; value: "want_to_see" | "maybe" | "not_interested" | "never_heard_of_it" }) => api.recordPixInterest({
      imdb_id: imdbId,
      interest: value,
      keep_imdb_id: activePair?.find((movie) => movie.imdb_id !== imdbId)?.imdb_id ?? null,
      exclude_ids: [...recentIds, ...(activePair?.map((movie) => movie.imdb_id) ?? [])].slice(0, 240),
      game,
    }),
    onSuccess: (result, variables) => {
      if (result.requires_consent) {
        openBiscuitConsent();
        return;
      }
      // A triage verdict on the streak holder ends its run.
      setStreak((current) => current && current.imdbId === variables.imdbId ? null : current);
      const isTriage = ["maybe", "not_interested", "never_heard_of_it"].includes(result.interest);
      if (!result.recorded) {
        // Saving is off, so nothing was persisted — but a triage tap still
        // removes the film from this session's pair immediately instead of
        // leaving it on screen to be dealt again.
        if (isTriage) {
          setRecentIds((current) => [variables.imdbId, ...current].slice(0, 238));
          if (result.replacement) {
            const replacement = result.replacement;
            setActivePair((current) => current ? current.map((candidate) => candidate.imdb_id === variables.imdbId ? replacement : candidate) as typeof current : current);
          } else {
            advancePair();
          }
          setOpenInterestId(null);
        }
        setInterestMessage("Turn on Save my PIX data to keep interest signals.");
        return;
      }
      if (isTriage) {
        setMissCount((current) => current + 1);
      }
      setInterestByMovie((current) => ({ ...current, [variables.imdbId]: result.interest }));
      const movie = activePair?.find((candidate) => candidate.imdb_id === variables.imdbId);
      setRecentIds((current) => [variables.imdbId, ...current].slice(0, 238));
      if (isTriage && !result.replacement) {
        // No replacement left in this lane: deal a fresh pair (the server
        // permanently blocks Maybe / No, Thanks films) rather than leaving
        // the triaged film sitting in the matchup.
        advancePair();
      } else {
        setActivePair((current) => {
          if (!current || !result.replacement) return current;
          return current.map((candidate) => candidate.imdb_id === variables.imdbId ? result.replacement : candidate) as typeof current;
        });
      }
      setOpenInterestId(null);
      const label = result.interest === "want_to_see" ? "Want to See" : result.interest === "maybe" ? "Maybe" : result.interest === "never_heard_of_it" ? "Never Heard of it" : "No, Thanks";
      setInterestMessage(`${label} saved${movie ? ` for ${movie.title}` : ""}.`);
      void queryClient.invalidateQueries({ queryKey: ["film-dna-profile"] });
      void queryClient.invalidateQueries({ queryKey: ["pix-fan-types"] });
    },
    onError: () => setInterestMessage("That interest signal didn’t save. Try again."),
  });
  const markCatalogWatched = useMutation({
    mutationFn: ({ watchedIds, notWatchedIds }: { watchedIds: string[]; notWatchedIds: string[] }) => api.triagePixCatalogBatch({
      watched_imdb_ids: watchedIds,
      not_watched_imdb_ids: notWatchedIds,
    }),
    onSuccess: async (result, variables) => {
      if (result.requires_consent) {
        setCatalogStatus("Turn on Save my PIX data to triage this catalog batch.");
        openBiscuitConsent();
        return;
      }
      const submittedIds = [...variables.watchedIds, ...variables.notWatchedIds];
      if (result.watched + result.not_watched === 0 && submittedIds.length > 0) {
        setCatalogStatus("PIX didn’t record that batch — nothing was marked watched or not watched. Your picks are still selected; try submitting again.");
        return;
      }
      // The submitted films leave the screen immediately (session filter),
      // every cached catalog batch is dropped so a stale batch can never be
      // re-dealt, and a fresh seed deals the next batch. The server also
      // excludes triaged films from every later batch (exclude_triaged).
      setSubmittedCatalogIds((current) => new Set([...current, ...submittedIds]));
      setCatalogStatus(`${result.watched} watched · ${result.not_watched} not watched — those films are filed and won’t be dealt again. Here’s a fresh batch.`);
      setSelectedCatalogIds(new Set());
      setMissCount(0);
      queryClient.removeQueries({ queryKey: ["pix-watched-catalog"] });
      setCatalogBatchSeed((current) => current + 1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pix-marquee-catalog"] }),
        queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] }),
        queryClient.invalidateQueries({ queryKey: ["pix-control"] }),
        queryClient.invalidateQueries({ queryKey: ["film-dna-profile"] }),
        queryClient.invalidateQueries({ queryKey: ["pix-sort-stats"] }),
      ]);
    },
    onError: () => setCatalogStatus("That catalog batch didn’t save — your picks are still selected. Check your connection and submit again."),
  });
  function toggleCatalogMovie(imdbId: string) {
    setCatalogStatus("");
    setSelectedCatalogIds((current) => {
      const next = new Set(current);
      if (next.has(imdbId)) next.delete(imdbId);
      else next.add(imdbId);
      return next;
    });
  }
  const createToughShare = useMutation({
    mutationFn: ({ leftId, rightId }: { leftId: string; rightId: string }) => api.createPixToughShare({ left_imdb_id: leftId, right_imdb_id: rightId }),
    onSuccess: (result) => {
      const pair = activePairRef.current;
      if (result.ok && pair && pair[0] && pair[1]) {
        setToughShare({ id: result.share_id, leftTitle: pair[0].title, rightTitle: pair[1].title });
        setToughMessage("Your TOUGH PIX link is ready — it also lives in Profile and SHOWCASE.");
        void queryClient.invalidateQueries({ queryKey: ["pix-tough-shares"] });
      }
    },
    onError: () => setToughMessage("That TOUGH PIX link couldn’t be created. Try again."),
  });
  const actorVote = useMutation({
    mutationFn: ({ winner, loser }: { winner: string; loser: string }) => api.recordPixActorVote({ winner_qid: winner, loser_qid: loser }),
    onSuccess: (result) => {
      if (result.requires_consent) openBiscuitConsent();
      else {
        void queryClient.invalidateQueries({ queryKey: ["pix-control"] });
        advancePair();
      }
    },
  });
  function chooseActor(winnerQid: string) {
    const pair = actorPairQuery.data?.pair;
    if (!pair || actorVote.isPending) return;
    if (!profile || profile.cookie_decision === "pending") {
      openBiscuitConsent();
      return;
    }
    const loser = pair.find((actor) => actor.qid !== winnerQid);
    if (loser) actorVote.mutate({ winner: winnerQid, loser: loser.qid });
  }
  function choose(winnerId: string) {
    const pair = activePair;
    if (!pair || vote.isPending || unseen.isPending || interest.isPending) return;
    if (!profile || profile.cookie_decision === "pending") {
      openBiscuitConsent();
      return;
    }
    const loser = pair.find((movie) => movie.imdb_id !== winnerId);
    if (!loser) return;
    setChosenId(winnerId);
    vote.mutate({ winner: winnerId, loser: loser.imdb_id, why: "" });
  }

  function saveReason(skip = false) {
    if (!pendingChoice) return;
    const why = skip ? "" : [whyTag, whyDetail.trim()].filter(Boolean).join(": ");
    vote.mutate({ ...pendingChoice, why });
  }

  function startPosterDrag(event: PointerEvent<HTMLButtonElement>, movieId: string) {
    if (event.button !== 0 || vote.isPending || unseen.isPending || pendingChoice) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    activeDrag.current = { pointerId: event.pointerId, movieId, startY: event.clientY, y: 0, dragged: false };
  }

  function movePosterDrag(event: PointerEvent<HTMLButtonElement>, movieId: string) {
    const drag = activeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.movieId !== movieId) return;
    const y = Math.max(0, event.clientY - drag.startY);
    drag.y = y;
    if (y > 8) drag.dragged = true;
    if (drag.dragged) event.preventDefault();
    setDragPosition({ movieId, y: Math.min(y, 220) });
  }

  function finishPosterDrag(event: PointerEvent<HTMLButtonElement>, movieId: string) {
    const drag = activeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.movieId !== movieId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    activeDrag.current = null;
    setDragPosition(null);
    if (!drag.dragged) return;
    suppressClick.current.add(movieId);
    window.setTimeout(() => suppressClick.current.delete(movieId), 0);
    if (drag.y > 90) (() => { const other = activePair?.find((movie) => movie.imdb_id !== movieId); if (other) unseen.mutate({ imdbId: movieId, keepId: other.imdb_id }); })();
  }

  function cancelPosterDrag(event: PointerEvent<HTMLButtonElement>, movieId: string) {
    const drag = activeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId || drag.movieId !== movieId) return;
    if (drag.dragged) {
      suppressClick.current.add(movieId);
      window.setTimeout(() => suppressClick.current.delete(movieId), 0);
    }
    activeDrag.current = null;
    setDragPosition(null);
  }

  const pair = activePair;
  const posterPair = pair && pair.every((movie) => hasPixPoster(movie.poster_key)) ? pair : null;
  const actorPair = actorPairQuery.data?.pair ?? null;
  const actorPosterPair = actorPair && actorPair.every((actor) => hasPixPoster(actor.poster_key)) ? actorPair : null;
  const busy = vote.isPending || unseen.isPending || skipPair.isPending || interest.isPending || actorVote.isPending;
  const currentGameTitle = category === "actors"
    ? "Performance"
    : movieScope === "all_time"
      ? "All-Time Movies"
      : movieScope === "decade"
        ? `${scopeValue}s Movies`
        : `${scopeValue} Movies`;

  if (!gameOpen) return null;

  return (
    <section aria-label={dnaHome ? "Now Playing" : "PIX"} className={`section-shell text-section pix-section${dnaHome ? "" : " pix-section-overlay"}`}>
      {activeAds.filter((ad) => ad.placement === "profile").map((ad) => <AdPlacement key={ad.id} ad={ad} />)}

      {gameOpen ? <div className="pix-game-frame pix-game-frame-expanded">
        <div className="pix-now-playing-header">
        <div
          className="pix-now-playing-control"
          onMouseEnter={() => setGameControlsOpen(true)}
          onMouseLeave={(event) => {
            if (!event.currentTarget.contains(document.activeElement)) setGameControlsOpen(false);
          }}
          onFocusCapture={() => setGameControlsOpen(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setGameControlsOpen(false);
          }}
        >
          <button
            className="pix-now-playing-banner"
            type="button"
            aria-label="Now Playing game controls"
            aria-controls="pix-now-playing-controls"
            aria-expanded={gameControlsOpen}
            onClick={() => setGameControlsOpen((open) => !open)}
          >
            <h2>NOW PLAYING</h2>
            <small>EDIT FILTER</small>
          </button>
          {gameControlsOpen ? <div className="pix-now-playing-popover" id="pix-now-playing-controls">{gameControls(advancePair)}</div> : null}
        </div>
        <span className="pix-play-arrow" aria-hidden="true" />
        <p className="pix-current-game-title" aria-label={`Current game: ${currentGameTitle}`}>{currentGameTitle}</p>
        <button
          className="pix-game-close-button"
          type="button"
          onClick={onClose}
          aria-label="Close Now Playing game"
          title="Close"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <div className="pix-film-dna-row">
        <div className="pix-new-pair-frame">
        <button
          className="pix-new-pair-button"
          type="button"
          onClick={() => dealAgain()}
          disabled={pairQuery.isFetching || actorPairQuery.isFetching || busy}
          aria-label={category === "movies" ? "Haven't watched it either; show a new pair" : "Show a new pair"}
          title={category === "movies" ? "Haven't watched it either" : "New pair"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 7h-5V2" />
            <path d="M20 7a8 8 0 0 0-13.5-2.5L4 7" />
            <path d="M4 17h5v5" />
            <path d="M4 17a8 8 0 0 0 13.5 2.5L20 17" />
          </svg>
          <span>{category === "movies" ? "Haven't watched it either" : "New pair"}</span>
        </button>
        </div>
      </div>

      {category === "actors" ? (
        actorPairQuery.isPending ? <div className="pix-dealing" role="status">Dealing two poster-backed performers…</div> : actorPairQuery.isError ? (
          <div className="pix-empty" role="alert"><span aria-hidden="true">!</span><div><h2>Couldn’t load Performance</h2><p>Try the matchup again.</p></div><button className="secondary-button" type="button" onClick={() => actorPairQuery.refetch()}>Try again</button></div>
        ) : actorPosterPair ? (
          <div className="pix-matchup" aria-label="Choose between two performances">
            {actorPosterPair.map((actor) => {
              return (
                <article className="pix-choice" key={actor.qid}>
                  <div className="pix-poster-stage" data-hover-type="1">
                    <button className="pix-poster-button" type="button" onClick={() => chooseActor(actor.qid)} disabled={busy} aria-label={`Choose ${actor.name} in ${actor.poster_title}`}>
                      <PixPosterImage posterKey={actor.poster_key} alt={`${actor.poster_title} movie poster, representing ${actor.name}`} />
                      <span className="pix-check" aria-hidden="true">✓</span>
                    </button>
                    <div className="pix-movie-meta pix-movie-meta-overlay"><span className="pix-actor-credit">Performance</span><h2>{actor.name}</h2><p>{actor.poster_title} · {actor.poster_year}</p></div>
                  </div>
                  <a className="pix-performer-source" href={actor.source_url} target="_blank" rel="noreferrer">About this performer ↗</a>
                </article>
              );
            })}
          </div>
        ) : <div className="pix-empty"><span aria-hidden="true">00</span><div><h2>No poster-backed matchup available</h2><p>PIX only deals performers when both movie posters are ready.</p></div></div>
      ) : pairQuery.isPending ? <div className="pix-dealing" role="status">Dealing two poster-backed choices…</div> : pairQuery.isError ? (
        <div className="pix-empty" role="alert"><span aria-hidden="true">!</span><div><h2>Couldn’t load this game</h2><p>Try the matchup again.</p></div><button className="secondary-button" type="button" onClick={() => pairQuery.refetch()}>Try again</button></div>
      ) : posterPair ? (
        <div className="pix-matchup" aria-label="Choose between two films">
          {posterPair.map((movie, index) => {
            const currentInterest = interestByMovie[movie.imdb_id];
            const side = index === 0 ? "left" : "right";
            return (
              <article className={`pix-choice ${chosenId === movie.imdb_id ? "pix-choice-selected" : ""}`} key={movie.imdb_id}>
                <div className={`pix-poster-stage ${interestVerdictClass(currentInterest)}`} data-hover-type="1">
                  <button className="pix-poster-button" type="button" onClick={() => suppressClick.current.delete(movie.imdb_id) ? undefined : choose(movie.imdb_id)} onPointerDown={(event) => startPosterDrag(event, movie.imdb_id)} onPointerMove={(event) => movePosterDrag(event, movie.imdb_id)} onPointerUp={(event) => finishPosterDrag(event, movie.imdb_id)} onPointerCancel={(event) => cancelPosterDrag(event, movie.imdb_id)} style={dragPosition?.movieId === movie.imdb_id ? { transform: `translateY(${dragPosition.y}px)`, opacity: Math.max(0.28, 1 - dragPosition.y / 270) } : undefined} disabled={busy || pendingChoice !== null} aria-label={`Choose ${movie.title}; drag down if you haven’t watched it`}>
                    <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} movie poster`} />
                    <span className="pix-check" aria-hidden="true">✓</span>
                  </button>
                  <div data-hover-type="2" className={`pix-interest-menu pix-interest-menu-${side} ${openInterestId === movie.imdb_id ? "is-open" : ""}`}>
                    <button
                      className="pix-interest-trigger"
                      type="button"
                      aria-label={`Show interest options for ${movie.title}`}
                      aria-controls={`pix-interest-${movie.imdb_id}`}
                      aria-expanded={openInterestId === movie.imdb_id}
                      onClick={() => setOpenInterestId((current) => current === movie.imdb_id ? null : movie.imdb_id)}
                    >
                      <span aria-hidden="true">x</span>
                    </button>
                    <div id={`pix-interest-${movie.imdb_id}`} className="pix-interest-controls" aria-label={`Interest in ${movie.title}`}>
                      <button className={`pix-interest-button pix-interest-want ${currentInterest === "want_to_see" ? "active" : ""}`} type="button" aria-pressed={currentInterest === "want_to_see"} onClick={() => interest.mutate({ imdbId: movie.imdb_id, value: "want_to_see" })} disabled={busy || pendingChoice !== null}>Want to See</button>
                      <button className={`pix-interest-button pix-interest-maybe ${currentInterest === "maybe" ? "active" : ""}`} type="button" aria-pressed={currentInterest === "maybe"} onClick={() => interest.mutate({ imdbId: movie.imdb_id, value: "maybe" })} disabled={busy || pendingChoice !== null}>Maybe</button>
                      <button className={`pix-interest-button pix-interest-no ${currentInterest === "not_interested" ? "active" : ""}`} type="button" aria-pressed={currentInterest === "not_interested"} onClick={() => interest.mutate({ imdbId: movie.imdb_id, value: "not_interested" })} disabled={busy || pendingChoice !== null}>No, Thanks</button>
                      <button className={`pix-interest-button pix-interest-unfamiliar ${currentInterest === "never_heard_of_it" ? "active" : ""}`} type="button" aria-pressed={currentInterest === "never_heard_of_it"} onClick={() => interest.mutate({ imdbId: movie.imdb_id, value: "never_heard_of_it" })} disabled={busy || pendingChoice !== null}>Never Heard of it</button>
                    </div>
                  </div>
                  <div className="pix-movie-meta pix-movie-meta-overlay">{streak && streak.imdbId === movie.imdb_id && streak.count >= 2 ? <span className="pix-streak-badge" role="status">Win streak ×{streak.count}</span> : null}<h2>{movie.title}</h2><p>{movie.year} · {movie.genre}</p><a className="pix-screening-link" href={`#screening/${encodeURIComponent(movie.imdb_id)}`}>MY SCREENING</a></div>
                </div>
              </article>
            );
          })}
        </div>
      ) : <div className="pix-empty"><span aria-hidden="true">00</span><div><h2>No poster-backed matchup available</h2><p>PIX only deals a choice when both posters are ready.</p></div></div>}

      {interestMessage ? <p className="pix-interest-feedback" role="status" aria-live="polite">{interestMessage}</p> : null}

      {category === "movies" && posterPair ? (
        <div className="pix-tough-bar">
          <button
            type="button"
            className="pix-tough-button"
            disabled={createToughShare.isPending}
            onClick={() => {
              const [left, right] = posterPair;
              if (left && right) createToughShare.mutate({ leftId: left.imdb_id, rightId: right.imdb_id });
            }}
            aria-label="TOUGH PIX: share this matchup with friends"
          >
            TOUGH PIX
          </button>
          <p className="pix-tough-caption">Share PIX.MOV Challenge For Advice</p>
          {toughMessage ? <p className="pix-tough-message" role="status">{toughMessage}</p> : null}
          {toughShare ? (() => {
            const shareUrl = `https://www.pix.mov/#tough/${toughShare.id}`;
            const shareText = `TOUGH PIX: ${toughShare.leftTitle} vs ${toughShare.rightTitle} — too tough to call. You pick:`;
            return (
              <div className="pix-tough-share" aria-label="Share this TOUGH PIX matchup">
                <span className="pix-tough-link">{shareUrl}</span>
                <div className="pix-tough-share-links">
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" aria-label="Share this TOUGH PIX on Facebook">Facebook</a>
                  <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" aria-label="Share this TOUGH PIX on Twitter / X">Twitter / X</a>
                  <a href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" aria-label="Open TikTok to share this TOUGH PIX link">TikTok</a>
                  <button type="button" onClick={() => { void navigator.clipboard?.writeText(shareUrl).catch(() => undefined); setToughMessage("TOUGH PIX link copied — paste it anywhere, including TikTok."); }} aria-label="Copy the TOUGH PIX link">Copy link</button>
                </div>
                <small>Friends who open it get an anonymous guest account and this exact VS. Your shared TOUGH PIX live in Profile + SHOWCASE.</small>
              </div>
            );
          })() : null}
        </div>
      ) : null}

      {pendingChoice ? (
        <section className="pix-why-panel" aria-labelledby="pix-why-title">
          <div><p className="kicker">One more beat</p><h2 id="pix-why-title">Why did it win?</h2><p>This is how PIX learns more than a ranking.</p></div>
          <div className="pix-why-tags" aria-label="Reasons">
            {whyOptions.map((option) => <button key={option} type="button" className={whyTag === option ? "active" : ""} onClick={() => setWhyTag(whyTag === option ? "" : option)}>{option}</button>)}
          </div>
          <label htmlFor="pix-why-detail">In your own words <span>optional</span></label>
          <textarea id="pix-why-detail" value={whyDetail} onChange={(event) => setWhyDetail(event.target.value)} maxLength={500} placeholder="A performance, a moment, the way it made you feel…" />
          <div className="pix-why-actions"><button className="secondary-button" type="button" onClick={() => saveReason(true)} disabled={vote.isPending}>Skip</button><button className="primary-button" type="button" onClick={() => saveReason(false)} disabled={vote.isPending}>{vote.isPending ? "Saving…" : "Save to FILM DNA"}</button></div>
        </section>
      ) : null}
      </div> : null}

      {catalogPromptOpen ? (
        <div className="pix-catalog-prompt-backdrop" role="dialog" aria-modal="true" aria-labelledby="pix-catalog-prompt-title">
          <section className="pix-catalog-prompt">
            <header>
              <div><p className="kicker">Available Catalog</p><h2 id="pix-catalog-prompt-title">Mark what you’ve watched</h2></div>
              <button type="button" aria-label="Close watched movie picker" onClick={() => setCatalogPromptOpen(false)}>×</button>
            </header>
            <p className="pix-catalog-prompt-copy">Select every movie you’ve watched in this batch. When you submit, unselected movies are recorded as not watched, then PIX deals a fresh batch.</p>
            <form className="pix-catalog-search" onSubmit={(event) => { event.preventDefault(); setCatalogSearch(catalogSearchInput.trim()); setCatalogBatchSeed((current) => current + 1); setSelectedCatalogIds(new Set()); setCatalogStatus(""); }}>
              <label htmlFor="pix-catalog-search-input">Find a movie</label>
              <div><input id="pix-catalog-search-input" type="search" value={catalogSearchInput} onChange={(event) => setCatalogSearchInput(event.target.value)} placeholder="Search the available catalog" /><button type="submit">Search</button></div>
            </form>
            {catalogQuery.isPending ? <p className="pix-catalog-prompt-state" role="status">Opening the available catalog…</p> : null}
            {catalogQuery.isError ? <p className="pix-catalog-prompt-state" role="alert">The available catalog couldn’t open. Try the search again.</p> : null}
            {catalogQuery.data && catalogMovies.length > 0 ? (
              <div className="pix-catalog-prompt-grid" aria-label="Available movies to mark watched">
                {catalogMovies.map((movie) => {
                  const selected = selectedCatalogIds.has(movie.imdb_id);
                  return <button type="button" key={movie.imdb_id} className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => toggleCatalogMovie(movie.imdb_id)}><PixPosterImage posterKey={movie.poster_key} alt="" loading="lazy" /><span><strong>{movie.title}</strong><small>{movie.year}</small></span><b aria-hidden="true">✓</b></button>;
                })}
              </div>
            ) : null}
            {catalogQuery.data && catalogMovies.length === 0 ? <p className="pix-catalog-prompt-state">No unwatched poster-backed movies match that search.</p> : null}
            {catalogStatus ? <p className="pix-catalog-prompt-status" role="status">{catalogStatus}</p> : null}
            <footer>
              <span>{selectedCatalogIds.size} watched · {Math.max(0, catalogMovies.length - selectedCatalogIds.size)} not watched</span>
              <button className="secondary-button" type="button" onClick={() => setCatalogPromptOpen(false)}>Not now</button>
              <button
                className="secondary-button"
                type="button"
                disabled={catalogQuery.isFetching || markCatalogWatched.isPending}
                onClick={() => {
                  setSelectedCatalogIds(new Set());
                  setCatalogStatus("Fresh batch — nothing was recorded.");
                  setCatalogBatchSeed((current) => current + 1);
                }}
              >
                {catalogQuery.isFetching ? "Refreshing…" : "REFRESH"}
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={catalogMovies.length === 0 || markCatalogWatched.isPending}
                onClick={() => markCatalogWatched.mutate({
                  watchedIds: catalogMovies.filter((movie) => selectedCatalogIds.has(movie.imdb_id)).map((movie) => movie.imdb_id),
                  notWatchedIds: catalogMovies.filter((movie) => !selectedCatalogIds.has(movie.imdb_id)).map((movie) => movie.imdb_id),
                })}
              >
                {markCatalogWatched.isPending ? "Saving…" : "Submit batch"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {activeAds.filter((ad) => ad.placement === "matchup").map((ad) => <AdPlacement key={ad.id} ad={ad} />)}
      {vote.isError || unseen.isError || actorVote.isError ? <p className="form-error" role="alert">That answer didn’t save. Please try again.</p> : null}
      <AdManager ads={ads} />
    </section>
  );
}

function AdPlacement({ ad }: { ad: PixAd }) {
  return (
    <aside className="pix-ad-placement" aria-label="Sponsored content">
      <span>Sponsored · {ad.placement}</span>
      <h2>{ad.title}</h2>
      {ad.body ? <p>{ad.body}</p> : null}
      {ad.cta_url && ad.cta_label ? <a href={ad.cta_url} target="_blank" rel="noreferrer">{ad.cta_label} ↗</a> : null}
    </aside>
  );
}
