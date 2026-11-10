import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import { hasPixPoster, PixPosterImage } from "./PixSection";
import { SafeSpaceFlagNotice } from "./SafeSpaceNotice";

type MoviePost = ApiResponse<typeof api, "getPixMoviePage">["posts"][number];
type MovieView = "screening" | "review";

// The page the viewer was on just before this film page, recorded by
// the app shell on every hash change. The ← button returns there —
// never to another film page, and PIX home when there is no recorded
// page (a direct deep link into this film).
function lastVisitedHash(): string {
  try {
    return window.sessionStorage.getItem("pix-last-visited-hash") ?? "";
  } catch {
    return "";
  }
}

function formatPostTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function AuthorMark({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  return avatarUrl
    ? <img className="movie-post-avatar" src={avatarUrl} alt="" />
    : <span className="movie-post-avatar movie-post-initials" aria-hidden="true">{name.trim().slice(0, 2).toUpperCase() || "PX"}</span>;
}

function RelevantButton({ post }: { post: MoviePost }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.markPixMoviePostRelevant({ post_id: post.id }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["pix-movie-page", post.imdb_id] }),
  });
  return (
    <button className="movie-post-relevant" type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} aria-label={`Mark ${post.author_name}'s post relevant`}>
      Relevant <span>{mutation.isPending ? "…" : post.relevance_count}</span>
    </button>
  );
}

function ReplyComposer({ imdbId, threadId, onDone }: { imdbId: string; threadId: number; onDone: () => void }) {
  const [body, setBody] = useState("");
  const [flagged, setFlagged] = useState<string[]>([]);
  const mutation = useMutation({
    mutationFn: () => api.createPixMoviePost({ imdb_id: imdbId, kind: "response", title: "", body, parent_id: threadId }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFlagged(result.flagged_words);
        return;
      }
      setFlagged([]);
      setBody("");
      onDone();
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (body.trim()) mutation.mutate();
  }
  return (
    <form className="movie-reply-form" onSubmit={submit}>
      <label htmlFor={`reply-${threadId}`}>Join this discussion</label>
      <div><textarea id={`reply-${threadId}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} rows={3} placeholder="Add to the conversation…" /><button type="submit" disabled={mutation.isPending || !body.trim()}>{mutation.isPending ? "Posting…" : "Reply"}</button></div>
      {mutation.isError ? <p role="alert">Your reply didn’t post. Try again.</p> : null}
      <SafeSpaceFlagNotice words={flagged} />
    </form>
  );
}

function ScreeningView({ imdbId, posts, viewerName, avatarUrl, refresh }: { imdbId: string; posts: MoviePost[]; viewerName: string; avatarUrl: string | null; refresh: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const threads = posts.filter((post) => post.kind === "thread");
  const responsesByParent = useMemo(() => posts.filter((post) => post.kind === "response").reduce((groups, post) => {
    if (post.parent_id === null) return groups;
    const current = groups.get(post.parent_id) ?? [];
    current.push(post);
    groups.set(post.parent_id, current);
    return groups;
  }, new Map<number, MoviePost[]>()), [posts]);
  const [flagged, setFlagged] = useState<string[]>([]);
  const publish = useMutation({
    mutationFn: () => api.createPixMoviePost({ imdb_id: imdbId, kind: "thread", title, body, parent_id: null }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFlagged(result.flagged_words);
        return;
      }
      setFlagged([]);
      setTitle("");
      setBody("");
      refresh();
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (title.trim() && body.trim()) publish.mutate();
  }
  return (
    <div className="movie-screening-layout">
      <form className="movie-blog-composer" onSubmit={submit}>
        <div className="movie-composer-author"><AuthorMark name={viewerName} avatarUrl={avatarUrl} /><span><small>YOUR SCREENING JOURNAL</small><strong>{viewerName}</strong></span></div>
        <label htmlFor="screening-title">Post title</label>
        <input id="screening-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={140} placeholder="What stayed with you?" />
        <label htmlFor="screening-body">Write about this film</label>
        <textarea id="screening-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={8000} rows={7} placeholder="Your thoughts, memories, interpretation, or questions…" />
        <div className="movie-composer-actions"><span>{body.length.toLocaleString()} / 8,000</span><button type="submit" disabled={publish.isPending || !title.trim() || !body.trim()}>{publish.isPending ? "Publishing…" : "Publish screening note"}</button></div>
        {publish.isError ? <p className="movie-form-error" role="alert">Your screening note didn’t publish. Try again.</p> : null}
        <SafeSpaceFlagNotice words={flagged} />
      </form>
      <section className="movie-discussion" aria-labelledby="screening-notes-heading">
        <div className="movie-section-head"><div><small>PERSONAL BLOG + DISCUSSION</small><h2 id="screening-notes-heading">Screening notes</h2></div><span>{threads.length} post{threads.length === 1 ? "" : "s"}</span></div>
        {threads.length === 0 ? <div className="movie-empty"><strong>The page is yours.</strong><p>Publish the first screening note, then continue the discussion underneath it.</p></div> : threads.map((thread) => {
          const replies = responsesByParent.get(thread.id) ?? [];
          return <article className="movie-thread" key={thread.id}>
            <header><AuthorMark name={thread.author_name} avatarUrl={thread.author_name === viewerName ? avatarUrl : null} /><span><strong>{thread.author_name}</strong><time dateTime={thread.created_at}>{formatPostTime(thread.created_at)}</time></span><RelevantButton post={thread} /></header>
            <h3>{thread.title}</h3><p>{thread.body}</p>
            {replies.length > 0 ? <div className="movie-thread-replies" aria-label={`${replies.length} replies`}>{replies.map((reply) => <article key={reply.id}><header><AuthorMark name={reply.author_name} avatarUrl={reply.author_name === viewerName ? avatarUrl : null} /><span><strong>{reply.author_name}</strong><time dateTime={reply.created_at}>{formatPostTime(reply.created_at)}</time></span><RelevantButton post={reply} /></header><p>{reply.body}</p></article>)}</div> : null}
            {replyingTo === thread.id ? <ReplyComposer imdbId={imdbId} threadId={thread.id} onDone={() => { setReplyingTo(null); refresh(); }} /> : <button className="movie-thread-reply" type="button" onClick={() => setReplyingTo(thread.id)}>Discuss this post</button>}
          </article>;
        })}
      </section>
    </div>
  );
}

function ReviewView({ imdbId, posts, ranking, viewerName, avatarUrl, sort, onSort, refresh }: {
  imdbId: string;
  posts: MoviePost[];
  ranking: ApiResponse<typeof api, "getPixMoviePage">["ranking"];
  viewerName: string;
  avatarUrl: string | null;
  sort: "latest" | "relevant";
  onSort: (sort: "latest" | "relevant") => void;
  refresh: () => void;
}) {
  const [body, setBody] = useState("");
  const [flagged, setFlagged] = useState<string[]>([]);
  const comments = posts.filter((post) => post.kind === "comment");
  const publish = useMutation({
    mutationFn: () => api.createPixMoviePost({ imdb_id: imdbId, kind: "comment", title: "", body, parent_id: null }),
    onSuccess: (result) => {
      if (!result.ok) {
        setFlagged(result.flagged_words);
        return;
      }
      setFlagged([]);
      setBody("");
      refresh();
    },
  });
  function submit(event: FormEvent) { event.preventDefault(); if (body.trim()) publish.mutate(); }
  return (
    <div className="movie-review-layout">
      <section className="movie-ranking-board" aria-labelledby="pix-ranking-heading">
        <div className="movie-section-head"><div><small>PLATFORM-WIDE</small><h2 id="pix-ranking-heading">PIX.MOV ranking</h2></div></div>
        <div className="movie-rank-primary"><span>{ranking.platform_rank === null ? "—" : `#${ranking.platform_rank}`}</span><div><strong>{ranking.win_rate === null ? "Not ranked yet" : `${ranking.win_rate}% matchup win rate`}</strong><small>{ranking.platform_rank === null ? "This film will rank after its first recorded matchup." : `Among ${ranking.ranked_movie_count.toLocaleString()} ranked films`}</small></div></div>
        <dl className="movie-rank-stats">
          <div><dt>Global reviews</dt><dd>{ranking.global_score === null ? "Building" : `${ranking.global_score}%`}</dd><small>{ranking.global_score === null ? "No aggregate yet" : `${ranking.global_rating_count.toLocaleString()} ratings`}</small></div>
          <div><dt>Country</dt><dd>{ranking.country_score === null ? "—" : `${ranking.country_score}%`}</dd><small>Your profile region</small></div>
          <div><dt>State / Province</dt><dd>{ranking.region_score === null ? "—" : `${ranking.region_score}%`}</dd><small>Your profile region</small></div>
        </dl>
        {ranking.global_score === null ? <p className="movie-rank-note">Audience scores appear only after real PIX reviews are collected. Matchup rank is live from PIX game results.</p> : null}
      </section>
      <section className="movie-live-comments" aria-labelledby="live-comments-heading">
        <div className="movie-section-head"><div><small>REFRESHES AUTOMATICALLY</small><h2 id="live-comments-heading">Live comments</h2></div><button type="button" className="movie-comment-refresh" onClick={refresh}>Refresh</button></div>
        <form className="movie-comment-form" onSubmit={submit}><AuthorMark name={viewerName} avatarUrl={avatarUrl} /><label htmlFor="movie-live-comment">Add a comment</label><textarea id="movie-live-comment" value={body} onChange={(event) => setBody(event.target.value)} rows={3} maxLength={2000} placeholder="What do you think?" /><button type="submit" disabled={publish.isPending || !body.trim()}>{publish.isPending ? "Posting…" : "Post live comment"}</button>{publish.isError ? <p role="alert">Your comment didn’t post. Try again.</p> : null}<SafeSpaceFlagNotice words={flagged} /></form>
        <div className="movie-comment-toolbar" aria-label="Comment order"><span>{comments.length} comment{comments.length === 1 ? "" : "s"}</span><div><button type="button" className={sort === "latest" ? "is-active" : ""} onClick={() => onSort("latest")}>Latest</button><button type="button" className={sort === "relevant" ? "is-active" : ""} onClick={() => onSort("relevant")}>Relevant</button></div></div>
        {comments.length === 0 ? <div className="movie-empty"><strong>No comments yet.</strong><p>Start the live conversation for this film.</p></div> : <div className="movie-comment-list">{comments.map((comment) => <article key={comment.id}><header><AuthorMark name={comment.author_name} avatarUrl={comment.author_name === viewerName ? avatarUrl : null} /><span><strong>{comment.author_name}</strong><time dateTime={comment.created_at}>{formatPostTime(comment.created_at)}</time></span><RelevantButton post={comment} /></header><p>{comment.body}</p></article>)}</div>}
      </section>
    </div>
  );
}

// Add to List — a button beside the synopsis that opens a drop-down of
// the viewer's own list names. This menu only adds to lists that already
// exist: new lists are created in one place only, the viewer's Profile.
function AddToListMenu({ imdbId, title }: { imdbId: string; title: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}), enabled: open });
  const lists = listsQuery.data?.lists;
  const addItem = useMutation({
    mutationFn: (listId: number) => api.addPixUserListItem({ list_id: listId, imdb_id: imdbId }),
    onSuccess: async (_result, listId) => {
      const list = lists?.find((candidate) => candidate.id === listId);
      setStatus(list ? `Added to “${list.name}”.` : "Added to your list.");
      await queryClient.invalidateQueries({ queryKey: ["pix-user-lists"] });
    },
    onError: () => setStatus("That didn’t add — try again."),
  });
  return (
    <div className="movie-add-to-list">
      <button
        type="button"
        className="movie-add-to-list-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="movie-add-to-list-menu"
        aria-label={`Add ${title} to one of your lists`}
        onClick={() => { setOpen((value) => !value); setStatus(""); }}
      >
        ＋ Add to list <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open ? (
        <div className="movie-add-to-list-menu" id="movie-add-to-list-menu" role="menu" aria-label={`Your lists — add ${title}`}>
          <span className="movie-add-to-list-head">Your lists</span>
          {listsQuery.isPending ? <p className="movie-add-to-list-state" role="status">Loading your lists…</p> : null}
          {listsQuery.isError ? <p className="movie-add-to-list-state" role="alert">Your lists could not load. <button type="button" onClick={() => void listsQuery.refetch()}>Try again</button></p> : null}
          {lists && lists.length === 0 ? (
            <p className="movie-add-to-list-state">You have no lists yet — create your first one in your Profile, then add films to it from here.</p>
          ) : null}
          {lists?.map((list) => {
            const alreadyIn = list.movies.some((movie) => movie.imdb_id === imdbId);
            return (
              <button
                key={list.id}
                type="button"
                role="menuitem"
                className="movie-add-to-list-item"
                disabled={alreadyIn || addItem.isPending}
                onClick={() => addItem.mutate(list.id)}
                aria-label={alreadyIn ? `${title} is already in ${list.name}` : `Add ${title} to ${list.name}`}
              >
                <span>{list.name}</span>
                <small>{alreadyIn ? "✓ In list" : `${list.movies.length} film${list.movies.length === 1 ? "" : "s"}`}</small>
              </button>
            );
          })}
          {status ? <p className="movie-add-to-list-status" role="status">{status}</p> : null}
          <a className="movie-add-to-list-manage" href="#profile" role="menuitem">Create &amp; manage lists in your Profile →</a>
        </div>
      ) : null}
      {!open && status ? <small className="movie-add-to-list-done" role="status">{status}</small> : null}
    </div>
  );
}

export function PixMoviePage({ imdbId, initialView = "screening" }: { imdbId: string; initialView?: MovieView }) {
  const [view, setView] = useState<MovieView>(initialView);
  const [sort, setSort] = useState<"latest" | "relevant">("latest");
  // Deep links (Top 500 options: Review / Discuss) land on the tab they
  // named, and switching films resets to the linked tab.
  useEffect(() => { setView(initialView); }, [imdbId, initialView]);
  const query = useQuery({
    queryKey: ["pix-movie-page", imdbId, sort],
    queryFn: () => api.getPixMoviePage({ imdb_id: imdbId, sort }),
    refetchInterval: view === "review" ? 15_000 : false,
  });
  const markSeen = useMutation({
    mutationFn: () => api.markPixSeen({ imdb_id: imdbId }),
    onSuccess: () => query.refetch(),
  });
  const backTarget = useMemo(() => {
    const last = lastVisitedHash();
    return last && !last.startsWith("screening") ? last : "pix";
  }, [imdbId]);
  const backLink = (
    <a className="movie-page-back" href={`#${backTarget}`} aria-label="Back to the page you visited before this film">← Back</a>
  );
  if (query.isPending) return <section className="movie-page-state" role="status"><nav className="movie-page-nav" aria-label="Film page navigation">{backLink}</nav>Opening MY SCREENING…</section>;
  if (query.isError) return <section className="movie-page-state" role="alert"><nav className="movie-page-nav" aria-label="Film page navigation">{backLink}</nav><strong>This film page couldn’t open.</strong></section>;
  const data = query.data;
  const movie = data.movie;
  return (
    <section className="movie-page" aria-labelledby="movie-page-title">
      <nav className="movie-page-nav" aria-label="Film page navigation">{backLink}<span>{movie.year} · {movie.genre}</span></nav>
      <header className="movie-page-hero">
        <div className="movie-page-poster">{hasPixPoster(movie.poster_key) ? <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} movie poster`} loading="eager" /> : <span aria-hidden="true">PIX</span>}</div>
        <div className="movie-page-intro"><p>YOUR FILM PAGE</p><h1 id="movie-page-title">{movie.title}</h1><div className="movie-page-meta"><span>{movie.year}</span><span>{movie.genre}</span><span>{movie.appearances.toLocaleString()} PIX appearances</span></div>{movie.synopsis ? <p className="movie-page-synopsis">{movie.synopsis}</p> : <p className="movie-page-synopsis is-empty">Synopsis not available in the PIX catalog yet.</p>}<div className="movie-page-hero-actions"><button type="button" onClick={() => markSeen.mutate()} disabled={markSeen.isPending}>{markSeen.isPending ? "Saving…" : "Watched it"}</button><AddToListMenu imdbId={imdbId} title={movie.title} />{movie.source_url ? <a href={movie.source_url} target="_blank" rel="noopener noreferrer">Film source ↗</a> : null}</div></div>
      </header>
      <div className="movie-view-tabs" role="tablist" aria-label={`${movie.title} page views`}><button type="button" role="tab" aria-selected={view === "screening"} onClick={() => setView("screening")}><strong>MY SCREENING</strong><small>Blog + discuss</small></button><button type="button" role="tab" aria-selected={view === "review"} onClick={() => setView("review")}><strong>REVIEW</strong><small>Live comments + rank</small></button></div>
      {view === "screening" ? <ScreeningView imdbId={imdbId} posts={data.posts} viewerName={data.viewer.display_name} avatarUrl={data.viewer.avatar_url} refresh={() => void query.refetch()} /> : <ReviewView imdbId={imdbId} posts={data.posts} ranking={data.ranking} viewerName={data.viewer.display_name} avatarUrl={data.viewer.avatar_url} sort={sort} onSort={setSort} refresh={() => void query.refetch()} />}
    </section>
  );
}
