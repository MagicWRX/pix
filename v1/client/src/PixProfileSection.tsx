import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "./api";
import { FanTypePanel, FilmDnaSearch, hasPixPoster, PixPosterImage } from "./PixSection";
import { UserListsManager } from "./PixLists";
import { getPixPosterUrl } from "./PixPosterImage";

function formatPickDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

type CropImage = {
  src: string;
  width: number;
  height: number;
  element: HTMLImageElement;
  revokeOnClose: boolean;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

async function cropToBase64(image: CropImage, stageSize: number, zoom: number, x: number, y: number): Promise<string> {
  const scale = Math.max(stageSize / image.width, stageSize / image.height) * zoom;
  const sourceSize = stageSize / scale;
  const sourceX = clamp(-((stageSize - image.width * scale) / 2 + x) / scale, 0, image.width - sourceSize);
  const sourceY = clamp(-((stageSize - image.height * scale) / 2 + y) / scale, 0, image.height - sourceSize);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The crop editor could not start.");
  context.drawImage(image.element, sourceX, sourceY, sourceSize, sourceSize, 0, 0, 512, 512);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("The cropped image could not be created.")), "image/jpeg", 0.88);
  });
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The cropped image could not be read."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      if (comma < 0) reject(new Error("The cropped image is invalid."));
      else resolve(result.slice(comma + 1));
    };
    reader.readAsDataURL(blob);
  });
}

function ProfileCropEditor({ image, saving, error, onCancel, onSave }: {
  image: CropImage;
  saving: boolean;
  error: string;
  onCancel: () => void;
  onSave: (dataBase64: string) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; pointerX: number; pointerY: number; imageX: number; imageY: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [working, setWorking] = useState(false);

  function bounds(nextZoom = zoom) {
    const size = stageRef.current?.clientWidth ?? 280;
    const scale = Math.max(size / image.width, size / image.height) * nextZoom;
    return {
      x: Math.max(0, (image.width * scale - size) / 2),
      y: Math.max(0, (image.height * scale - size) / 2),
    };
  }

  function updateZoom(nextZoom: number) {
    const nextBounds = bounds(nextZoom);
    setZoom(nextZoom);
    setPosition((current) => ({
      x: clamp(current.x, -nextBounds.x, nextBounds.x),
      y: clamp(current.y, -nextBounds.y, nextBounds.y),
    }));
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement>) {
    dragRef.current = { pointerId: event.pointerId, pointerX: event.clientX, pointerY: event.clientY, imageX: position.x, imageY: position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function drag(event: ReactPointerEvent<HTMLDivElement>) {
    const active = dragRef.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const limit = bounds();
    setPosition({
      x: clamp(active.imageX + event.clientX - active.pointerX, -limit.x, limit.x),
      y: clamp(active.imageY + event.clientY - active.pointerY, -limit.y, limit.y),
    });
  }

  async function save() {
    const stageSize = stageRef.current?.clientWidth ?? 280;
    setWorking(true);
    try {
      onSave(await cropToBase64(image, stageSize, zoom, position.x, position.y));
    } finally {
      setWorking(false);
    }
  }

  const limit = bounds();
  return (
    <div className="profile-crop-backdrop" role="presentation">
      <section className="profile-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-crop-heading">
        <div className="profile-crop-head"><div><p className="kicker">Profile picture</p><h2 id="profile-crop-heading">Frame your photo</h2></div><button type="button" aria-label="Close crop editor" onClick={onCancel}>×</button></div>
        <p className="profile-crop-help">Drag to reposition. Use zoom to choose what appears in the square profile picture.</p>
        <div
          ref={stageRef}
          className="profile-crop-stage"
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={() => { dragRef.current = null; }}
          onPointerCancel={() => { dragRef.current = null; }}
          aria-label="Profile picture crop preview"
        >
          <img src={image.src} alt="Crop preview" draggable={false} style={{
            width: image.width <= image.height ? "100%" : "auto",
            height: image.width > image.height ? "100%" : "auto",
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          }} />
          <span aria-hidden="true" />
        </div>
        <div className="profile-crop-controls">
          <label>Zoom <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => updateZoom(Number(event.target.value))} /></label>
          <label>Horizontal position <input type="range" min={-limit.x} max={limit.x || 0.01} step="1" value={position.x} disabled={limit.x === 0} onChange={(event) => setPosition((current) => ({ ...current, x: Number(event.target.value) }))} /></label>
          <label>Vertical position <input type="range" min={-limit.y} max={limit.y || 0.01} step="1" value={position.y} disabled={limit.y === 0} onChange={(event) => setPosition((current) => ({ ...current, y: Number(event.target.value) }))} /></label>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="profile-crop-actions"><button className="secondary-button" type="button" onClick={onCancel} disabled={saving || working}>Cancel</button><button className="primary-button" type="button" onClick={() => void save()} disabled={saving || working}>{saving || working ? "Saving…" : "Use this crop"}</button></div>
      </section>
    </div>
  );
}

function ProfileUserListsPanel() {
  // The Profile is the one place lists are created. Each list also gets
  // its title edited and its visibility (private / public) set here.
  return (
    <section className="pix-profile-lists" aria-labelledby="pix-profile-lists-heading">
      <div className="pix-profile-section-head">
        <div><p className="kicker">Users Lists</p><h2 id="pix-profile-lists-heading">My Lists</h2></div>
        <p>Create a list, rename it any time, and choose per list whether it stays private on your profile or goes public for anyone with its link. Films join a list from here, from any film page, or from the Top 500.</p>
      </div>
      <UserListsManager allowCreate />
    </section>
  );
}

function ProfileToughPixPanel() {
  const sharesQuery = useQuery({ queryKey: ["pix-tough-shares"], queryFn: () => api.listPixToughShares({}) });
  const shares = sharesQuery.data?.shares ?? [];
  return (
    <section className="pix-profile-tough" aria-labelledby="pix-profile-tough-heading">
      <div className="pix-profile-section-head">
        <div><p className="kicker">Growth</p><h2 id="pix-profile-tough-heading">My TOUGH PIX</h2></div>
        <p>Matchups you shared from NOW PLAYING. Friends open the link, get an anonymous guest account, and face the exact same VS.</p>
      </div>
      {sharesQuery.isPending ? <p className="empty-state">Loading your shared matchups…</p> : null}
      {shares.length > 0 ? (
        <ul className="pix-profile-tough-list">
          {shares.map((share) => (
            <li key={share.id}>
              <a href={`#tough/${share.id}`}><strong>{share.left_title} vs {share.right_title}</strong><small>{share.pick_count} friend pick{share.pick_count === 1 ? "" : "s"} · shared {formatPickDate(share.created_at)}</small></a>
            </li>
          ))}
        </ul>
      ) : sharesQuery.data ? <p className="empty-state">Nothing shared yet — hit TOUGH PIX on a close matchup in NOW PLAYING.</p> : null}
    </section>
  );
}

function FriendsReviewItem({ review }: { review: ApiResponseFriendReview }) {
  const queryClient = useQueryClient();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const reply = useMutation({
    mutationFn: () => review.kind === "thread"
      ? api.createPixMoviePost({ imdb_id: review.imdb_id, kind: "response", title: "", body: replyText.trim(), parent_id: review.id })
      : api.createPixMoviePost({ imdb_id: review.imdb_id, kind: "comment", title: "", body: replyText.trim(), parent_id: null }),
    onSuccess: async () => {
      setReplyText("");
      setReplyOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["pix-friend-reviews"] });
    },
  });
  return (
    <article className="pix-friend-review">
      <a className="pix-friend-review-poster" href={`#screening/${encodeURIComponent(review.imdb_id)}`} aria-label={`Open ${review.movie_title}`}>
        {hasPixPoster(review.poster_key) ? <PixPosterImage posterKey={review.poster_key} alt="" /> : null}
      </a>
      <div className="pix-friend-review-copy">
        <header>
          <strong>{review.author_name}</strong>
          <small>on {review.movie_title} ({review.movie_year}) · {formatPickDate(review.created_at)}</small>
        </header>
        {review.title ? <h3>{review.title}</h3> : null}
        <p>{review.body}</p>
        <button type="button" className="pix-friend-reply-toggle" aria-expanded={replyOpen} onClick={() => setReplyOpen((open) => !open)}>
          {replyOpen ? "Cancel reply" : "Chime in"}
        </button>
        {replyOpen ? (
          <form className="pix-friend-reply-form" onSubmit={(event) => { event.preventDefault(); if (replyText.trim()) reply.mutate(); }}>
            <label htmlFor={`pix-friend-reply-${review.id}`}>Reply to {review.author_name}</label>
            <textarea id={`pix-friend-reply-${review.id}`} value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={2000} rows={3} placeholder="Add your take…" />
            <button type="submit" disabled={!replyText.trim() || reply.isPending}>{reply.isPending ? "Posting…" : "Post reply"}</button>
            {reply.isError ? <p className="form-error" role="alert">That reply didn’t post. Try again.</p> : null}
          </form>
        ) : null}
      </div>
    </article>
  );
}

type ApiResponseFriendReview = import("./api").ApiResponse<typeof api, "listPixFriendReviews">["reviews"][number];

function ProfileFriendsPanel() {
  const reviewsQuery = useQuery({ queryKey: ["pix-friend-reviews"], queryFn: () => api.listPixFriendReviews({ limit: 30 }) });
  const reviews = reviewsQuery.data?.reviews ?? [];
  return (
    <section className="pix-profile-friends" aria-labelledby="pix-profile-friends-heading">
      <div className="pix-profile-section-head">
        <div><p className="kicker">Friends</p><h2 id="pix-profile-friends-heading">Friends’ Reviews</h2></div>
        <p>The latest reviews and comments from the PIX community — read them here and chime in with a reply.</p>
      </div>
      {reviewsQuery.isPending ? <p className="empty-state">Loading friends’ reviews…</p> : null}
      {reviewsQuery.isError ? <p className="empty-state" role="alert">Friends’ reviews could not load.</p> : null}
      {reviews.length > 0 ? (
        <div className="pix-friend-reviews">
          {reviews.map((review) => <FriendsReviewItem key={review.id} review={review} />)}
        </div>
      ) : reviewsQuery.data ? <p className="empty-state">No reviews yet — the first comment on any film page will appear here.</p> : null}
    </section>
  );
}

export function PixProfileSection() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["pix-profile-page"], queryFn: () => api.getPixProfilePage({}) });
  const controlQuery = useQuery({ queryKey: ["pix-control"], queryFn: () => api.getPixControlState({}) });
  const [gender, setGender] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [raceEthnicity, setRaceEthnicity] = useState("");
  const [faith, setFaith] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropImage, setCropImage] = useState<CropImage | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [posterSearchInput, setPosterSearchInput] = useState("");
  const [posterSearch, setPosterSearch] = useState("");
  const [posterLoadingKey, setPosterLoadingKey] = useState("");
  const [expandedSeenYear, setExpandedSeenYear] = useState<number | null>(null);
  const [expandedRatingsYear, setExpandedRatingsYear] = useState<number | null>(null);
  const posterPickerQuery = useQuery({
    queryKey: ["pix-avatar-posters", posterSearch],
    queryFn: () => api.listPixBrowseCatalog({
      genre: null,
      country: null,
      year: null,
      decade: null,
      discovery: "all",
      exclude_international: false,
      offset: 0,
      limit: 60,
      shuffle_seed: null,
      query: posterSearch || null,
      exclude_triaged: false,
      exclude_dismissed: false,
    }),
    enabled: avatarPickerOpen,
  });

  useEffect(() => {
    const profile = profileQuery.data?.profile;
    if (!profile) return;
    setGender(profile.gender); setAgeRange(profile.age_range); setRaceEthnicity(profile.race_ethnicity);
    setFaith(profile.faith); setCountry(profile.country); setRegion(profile.region);
  }, [profileQuery.data]);

  const demographics = useMutation({
    mutationFn: () => api.savePixDemographics({ gender, age_range: ageRange, race_ethnicity: raceEthnicity, faith, country, region }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] }); },
  });

  function closeCrop() {
    if (cropImage?.revokeOnClose) URL.revokeObjectURL(cropImage.src);
    setCropImage(null);
    setAvatarError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const saveAvatar = useMutation({
    mutationFn: (dataBase64: string) => api.savePixAvatar({ data_base64: dataBase64 }),
    onSuccess: async () => {
      closeCrop();
      setAvatarPickerOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] }),
        queryClient.invalidateQueries({ queryKey: ["pix-control"] }),
      ]);
    },
    onError: () => setAvatarError("The profile picture didn’t save. Try a different image."),
  });

  const unmarkSeen = useMutation({
    mutationFn: (imdbId: string) => api.unmarkPixSeen({ imdb_id: imdbId }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] }),
        queryClient.invalidateQueries({ queryKey: ["pix-marquee-catalog"] }),
        queryClient.invalidateQueries({ queryKey: ["pix-control"] }),
      ]);
    },
  });

  const removeAvatar = useMutation({
    mutationFn: () => api.removePixAvatar({}),
    onSuccess: async () => {
      setAvatarError("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pix-profile-page"] }),
        queryClient.invalidateQueries({ queryKey: ["pix-control"] }),
      ]);
    },
    onError: () => setAvatarError("The profile picture couldn’t be removed. Try again."),
  });

  function openCropForSource(src: string, revokeOnClose: boolean) {
    if (cropImage?.revokeOnClose) URL.revokeObjectURL(cropImage.src);
    const image = new Image();
    image.onload = () => setCropImage({ src, width: image.naturalWidth, height: image.naturalHeight, element: image, revokeOnClose });
    image.onerror = () => {
      if (revokeOnClose) URL.revokeObjectURL(src);
      setAvatarError("That image couldn’t be opened. Try another one.");
    };
    image.src = src;
  }

  function chooseAvatar(file: File | undefined) {
    if (!file) return;
    setAvatarError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setAvatarError("Choose an image smaller than 12 MB.");
      return;
    }
    openCropForSource(URL.createObjectURL(file), true);
  }

  async function choosePoster(posterKey: string) {
    setAvatarError("");
    setPosterLoadingKey(posterKey);
    try {
      const src = await getPixPosterUrl(posterKey);
      if (!src) {
        setAvatarError("That poster couldn’t be opened. Try another one.");
        return;
      }
      openCropForSource(src, false);
    } finally {
      setPosterLoadingKey("");
    }
  }

  if (profileQuery.isPending) return <section className="section-shell text-section pix-profile-page"><div className="pix-profile-loading" role="status">Loading your PIX.MOV profile…</div></section>;
  if (profileQuery.isError) return <section className="section-shell text-section pix-profile-page"><div className="pix-empty" role="alert"><span aria-hidden="true">!</span><div><h2>Profile unavailable</h2><p>Your picks could not be opened.</p></div><button className="secondary-button" type="button" onClick={() => profileQuery.refetch()}>Try again</button></div></section>;

  const data = profileQuery.data;
  const initials = data.profile.mode === "saved" ? data.profile.display_name.trim().slice(0, 2).toUpperCase() : "AN";
  const chartData = data.comparisons.map((row) => ({ ...row, label: row.title }));
  const seenByYear = Array.from(data.seen.reduce((groups, movie) => {
    const movies = groups.get(movie.year) ?? [];
    movies.push(movie);
    groups.set(movie.year, movies);
    return groups;
  }, new Map<number, typeof data.seen>())).sort(([left], [right]) => right - left);
  const ratingsByYear = Array.from(data.ratings.reduce((groups, movie) => {
    const movies = groups.get(movie.year) ?? [];
    movies.push(movie);
    groups.set(movie.year, movies);
    return groups;
  }, new Map<number, typeof data.ratings>())).sort(([left], [right]) => right - left);

  function saveDemographics(event: FormEvent) { event.preventDefault(); demographics.mutate(); }

  return (
    <section aria-labelledby="pix-profile-heading" className="section-shell text-section pix-profile-page">
      <div className="section-heading pix-profile-heading"><div><p className="kicker">PIX record</p><h1 id="pix-profile-heading">Profile</h1></div><p className="section-intro">Your movie picks, matchup ratings, and recent taste history in one place.</p></div>

      <div className="pix-profile-identity">
        <div className="profile-avatar-editor">
          {data.profile.avatar_url ? <img className="profile-avatar profile-avatar-image" src={data.profile.avatar_url} alt={`${data.profile.display_name || "PIX"} profile picture`} /> : <div className="profile-avatar" aria-hidden="true">{initials || "AN"}</div>}
          <input ref={photoInputRef} className="profile-avatar-input" type="file" accept="image/*" aria-label="Choose a profile picture from photos" onChange={(event) => chooseAvatar(event.target.files?.[0])} />
          <input ref={fileInputRef} className="profile-avatar-input" type="file" aria-label="Upload a profile picture file" onChange={(event) => chooseAvatar(event.target.files?.[0])} />
          <button className="profile-avatar-change" type="button" aria-expanded={avatarPickerOpen} aria-controls="profile-image-picker" onClick={() => { setAvatarError(""); setAvatarPickerOpen((open) => !open); }}>{data.profile.avatar_url ? "Change" : "Add image"}</button>
          {data.profile.avatar_url ? <button className="profile-avatar-remove" type="button" disabled={removeAvatar.isPending} onClick={() => removeAvatar.mutate()}>{removeAvatar.isPending ? "Removing…" : "Remove"}</button> : null}
        </div>
        <div><span>{data.profile.mode === "saved" ? "Saved PIX.MOV profile" : "Anonymous PIX.MOV profile"}</span><h2>{data.profile.mode === "saved" ? data.profile.display_name : "Anonymous viewer"}</h2><p>{data.profile.personalization ? "Choice history saving is on." : "Choice history saving is off."}</p><button type="button" className="pix-profile-consent-link" aria-label="Cookie and Data Consent — open BISCUIT to review or change your consent decision" onClick={() => window.dispatchEvent(new CustomEvent("pix:open-consent"))}>Cookie &amp; Data Consent</button></div><a className="pix-profile-edit" href="#pix">Edit in PIX.MOV</a>
      </div>
      {avatarPickerOpen ? <section id="profile-image-picker" className="profile-image-picker" aria-labelledby="profile-image-picker-heading">
        <div className="profile-image-picker-head"><div><p className="kicker">Profile image</p><h2 id="profile-image-picker-heading">Choose your source</h2></div><button type="button" aria-label="Close profile image picker" onClick={() => setAvatarPickerOpen(false)}>×</button></div>
        <div className="profile-image-source-actions" aria-label="Profile image sources">
          <button className="is-active" type="button" aria-pressed="true">Poster art</button>
          <button type="button" onClick={() => photoInputRef.current?.click()}>Photos</button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>Upload a file</button>
        </div>
        <form className="profile-poster-search" onSubmit={(event) => { event.preventDefault(); setPosterSearch(posterSearchInput.trim()); }}>
          <label htmlFor="profile-poster-search-input">Find any movie poster</label>
          <div><input id="profile-poster-search-input" type="search" value={posterSearchInput} onChange={(event) => setPosterSearchInput(event.target.value)} placeholder="Search by movie title" /><button type="submit">Search</button></div>
        </form>
        {posterPickerQuery.isPending ? <p className="profile-poster-status" role="status">Loading poster art…</p> : posterPickerQuery.isError ? <div className="profile-poster-status" role="alert">Poster art couldn’t be loaded. <button type="button" onClick={() => posterPickerQuery.refetch()}>Try again</button></div> : posterPickerQuery.data.movies.length > 0 ? <div className="profile-poster-grid">{posterPickerQuery.data.movies.map((movie) => <button type="button" key={movie.imdb_id} disabled={posterLoadingKey.length > 0} onClick={() => void choosePoster(movie.poster_key)} aria-label={`Use ${movie.title} poster as profile image`}><PixPosterImage posterKey={movie.poster_key} alt="" /><span><strong>{movie.title}</strong><small>{movie.year}</small></span>{posterLoadingKey === movie.poster_key ? <em>Opening…</em> : null}</button>)}</div> : <p className="profile-poster-status">No poster art matches “{posterSearch}”.</p>}
      </section> : null}
      {avatarError && !cropImage ? <p className="form-error profile-avatar-error" role="alert">{avatarError}</p> : null}
      <div className="pix-profile-stats" aria-label="PIX.MOV profile totals"><div><strong>{data.total_picks}</strong><span>picks</span></div><div><strong>{data.ratings.length}</strong><span>rated movies</span></div><div><strong>{data.seen.length}</strong><span>watched</span></div><div><strong>{data.unseen_count}</strong><span>not watched</span></div></div>

      <FanTypePanel />

      <FilmDnaSearch onOpenProfile={() => window.scrollTo({ top: 0, behavior: "smooth" })} recordedPercentage={controlQuery.data?.film_dna_recorded_percentage ?? 0} />

      <ProfileUserListsPanel />

      <ProfileToughPixPanel />

      <ProfileFriendsPanel />

      <section className="pix-seen-section" aria-labelledby="pix-seen-heading">
        <div className="pix-profile-section-head"><div><p className="kicker">Sort Watched by Year</p><h2 id="pix-seen-heading">Watched</h2></div><p>Movies you marked “watched it” or rated in a matchup.</p></div>
        {data.seen.length > 0 ? <div className="pix-year-album">{seenByYear.map(([year, movies]) => <section className={`pix-year-row ${expandedSeenYear === year ? "is-expanded" : ""}`} key={year}><button className="pix-year-row-heading" type="button" aria-expanded={expandedSeenYear === year} onClick={() => setExpandedSeenYear((current) => current === year ? null : year)}><strong>{year}</strong><span>{movies.length} movie{movies.length === 1 ? "" : "s"}</span><small>{expandedSeenYear === year ? "Collapse" : "Open album"}</small></button><div className="pix-year-posters">{movies.map((movie) => <article className="pix-profile-poster-card is-seen" key={movie.imdb_id}><a className="pix-profile-poster-link" href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open MY SCREENING for ${movie.title}`}>{hasPixPoster(movie.poster_key) ? <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} movie poster`} /> : <div className="pix-profile-poster-placeholder" aria-hidden="true">PIX</div>}</a><div className="pix-profile-poster-overlay"><a href={`#screening/${encodeURIComponent(movie.imdb_id)}`}><h3>{movie.title}</h3><p>{movie.year} · {movie.genre}</p><small className="pix-profile-seen-label">MY SCREENING</small></a><button className="pix-profile-unsee" type="button" disabled={unmarkSeen.isPending} onClick={() => unmarkSeen.mutate(movie.imdb_id)} aria-label={`Remove ${movie.title} from Watched`}>×</button></div></article>)}</div></section>)}</div> : <div className="pix-seen-empty"><p>{data.profile.personalization ? "No watched movies saved yet. Open a marquee poster and tap “watched it” to add one." : "Watched movies aren’t saving because Personalization is off. Turn it on in PIX, then tap “watched it” on a marquee poster."}</p><a className="secondary-button" href="#pix">{data.profile.personalization ? "Browse the marquee" : "Open PIX settings"}</a></div>}
      </section>

      <section className="pix-demographic-panel" aria-labelledby="pix-demographic-heading">
        <div className="pix-profile-section-head"><div><p className="kicker">Optional context</p><h2 id="pix-demographic-heading">Tell PIX about you</h2></div></div>
        <p className="pix-privacy-promise"><strong>Your rule, built in:</strong> anything you voluntarily share here is used only for PIX games and helping you choose entertainment — never for ads or any other purpose.</p>
        <form onSubmit={saveDemographics}>
          <div className="pix-demographic-grid">
            <label>Gender <input value={gender} onChange={(event) => setGender(event.target.value)} maxLength={80} placeholder="Optional" /></label>
            <label>Age range <input value={ageRange} onChange={(event) => setAgeRange(event.target.value)} maxLength={40} placeholder="Optional" /></label>
            <label>Race or ethnicity <input value={raceEthnicity} onChange={(event) => setRaceEthnicity(event.target.value)} maxLength={120} placeholder="Optional" /></label>
            <label>Faith <input value={faith} onChange={(event) => setFaith(event.target.value)} maxLength={120} placeholder="Optional" /></label>
            <label>Country <input value={country} onChange={(event) => setCountry(event.target.value)} maxLength={80} placeholder="Optional" /></label>
            <label>State / province <input value={region} onChange={(event) => setRegion(event.target.value)} maxLength={120} placeholder="Optional" /></label>
          </div>
          <div className="pix-demographic-actions"><button className="primary-button" type="submit" disabled={demographics.isPending}>{demographics.isPending ? "Saving…" : "Save optional details"}</button><button className="secondary-button" type="button" onClick={() => { setGender(""); setAgeRange(""); setRaceEthnicity(""); setFaith(""); setCountry(""); setRegion(""); }}>Clear fields</button></div>
          {demographics.isSuccess ? <p className="form-success" role="status">Optional details saved.</p> : null}
          {demographics.isError ? <p className="form-error" role="alert">Those details didn’t save. Try again.</p> : null}
        </form>
      </section>

      <section className="pix-comparison-section" aria-labelledby="pix-comparison-heading">
        <div className="pix-profile-section-head"><div><p className="kicker">Taste overlay</p><h2 id="pix-comparison-heading">You vs. the audience</h2></div><p>Your matchup rating beside Global, Country, and State / Province review aggregates.</p></div>
        {chartData.length > 0 ? <div className="pix-comparison-chart" role="img" aria-label="Line chart comparing your movie ratings with global, country, and state or province review scores">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 78 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" interval={0} angle={-42} textAnchor="end" height={94} tick={{ fill: "var(--dim)", fontSize: 10 }} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "var(--dim)", fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} />
              <Legend verticalAlign="top" height={36} />
              <Line type="monotone" dataKey="personal" name="Your rating" stroke="var(--gold)" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
              <Line type="monotone" dataKey="global" name="Global" stroke="#f2b705" strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="country" name="Country" stroke="#ff8a00" strokeWidth={2} dot={false} connectNulls={false} />
              <Line type="monotone" dataKey="region" name="State / Province" stroke="#00a8ff" strokeWidth={2} dot={false} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div> : <p className="empty-state">Make a few movie picks to begin your personal rating line.</p>}
        {data.aggregate_status === "building" ? <p className="pix-aggregate-empty">Your personal line is ready. Global, country, and state / province lines will appear only when real aggregate review data is available; PIX won’t invent scores.</p> : null}
      </section>

      {data.total_picks === 0 ? <div className="pix-profile-empty"><span aria-hidden="true">00</span><div><h2>No picks yet</h2><p>Choose between movies in PIX and your ratings will build here.</p><a className="secondary-button" href="#pix">Start picking</a></div></div> : <>
        <section className="pix-ratings-section" aria-labelledby="pix-ratings-heading"><div className="pix-profile-section-head"><div><p className="kicker">Leaderboard</p><h2 id="pix-ratings-heading">Ratings</h2></div><p>Rating is the percentage of matchups each movie won.</p></div><div className="pix-year-album">{ratingsByYear.map(([year, movies]) => <section className={`pix-year-row ${expandedRatingsYear === year ? "is-expanded" : ""}`} key={year}><button className="pix-year-row-heading" type="button" aria-expanded={expandedRatingsYear === year} onClick={() => setExpandedRatingsYear((current) => current === year ? null : year)}><strong>{year}</strong><span>{movies.length} rated</span><small>{expandedRatingsYear === year ? "Collapse" : "Open album"}</small></button><div className="pix-year-posters">{movies.map((movie) => <article className="pix-profile-poster-card is-rated" key={movie.imdb_id}><a className="pix-profile-poster-link" href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open MY SCREENING for ${movie.title}`}>{hasPixPoster(movie.poster_key) ? <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} movie poster`} /> : <div className="pix-profile-poster-placeholder" aria-hidden="true">PIX</div>}</a><div className="pix-profile-poster-overlay"><a href={`#screening/${encodeURIComponent(movie.imdb_id)}`}><h3>{movie.title}</h3><p>{movie.year} · {movie.genre}</p><strong>{movie.rating}%</strong><small>Open MY SCREENING</small></a></div></article>)}</div></section>)}</div></section>
        <section className="pix-picks-section" aria-labelledby="pix-picks-heading"><div className="pix-profile-section-head"><div><p className="kicker">History</p><h2 id="pix-picks-heading">Your picks</h2></div><button type="button" onClick={() => profileQuery.refetch()} disabled={profileQuery.isFetching}>{profileQuery.isFetching ? "Refreshing…" : "Refresh"}</button></div><div className="pix-pick-list">{data.picks.map((pick) => <article className="pix-pick-row" key={pick.id}><time dateTime={pick.created_at}>{formatPickDate(pick.created_at)}</time><div className="pix-pick-matchup"><div className="pix-pick-winner">{hasPixPoster(pick.winner.poster_key) ? <PixPosterImage posterKey={pick.winner.poster_key} alt="" /> : null}<span><small>You picked</small><strong>{pick.winner.title}</strong></span></div><span className="pix-pick-over">over</span><div className="pix-pick-loser">{hasPixPoster(pick.loser.poster_key) ? <PixPosterImage posterKey={pick.loser.poster_key} alt="" /> : null}<span><small>Other choice</small><strong>{pick.loser.title}</strong></span></div></div></article>)}</div></section>
      </>}
      {cropImage ? <ProfileCropEditor image={cropImage} saving={saveAvatar.isPending} error={avatarError} onCancel={closeCrop} onSave={(dataBase64) => saveAvatar.mutate(dataBase64)} /> : null}
    </section>
  );
}
