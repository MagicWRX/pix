import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type ApiResponse } from "./api";
import { hasPixPoster, PixPosterImage } from "./PixSection";
import { SafeSpaceFlagNotice } from "./SafeSpaceNotice";

// Shared list UI for PIX user lists. One clean layout, used in the User
// Profile (the only place a list can be created) and on the Users Lists
// page (manage existing lists, open shared links). Every list is either
// private (only its owner ever sees it) or public (anyone with the list
// link can open it read-only). Titles are editable inline.

export type PixUserList = ApiResponse<typeof api, "listPixUserLists">["lists"][number];
type PixUserListMovie = PixUserList["movies"][number];
type PixSharedList = NonNullable<ApiResponse<typeof api, "getPixSharedList">["list"]>;
type ListVisibility = "private" | "public";

function ListMovieGrid({ movies, listName, onRemove }: {
  movies: PixUserListMovie[];
  listName: string;
  onRemove?: (movie: PixUserListMovie) => void;
}) {
  if (movies.length === 0) return <p className="pix-user-list-empty">No films yet — search below and add the first one.</p>;
  return (
    <div className="pix-user-list-movies">
      {movies.map((movie) => (
        <div className="pix-user-list-movie" key={movie.imdb_id}>
          <a className="pix-seen-poster" data-hover-type="1" href={`#screening/${encodeURIComponent(movie.imdb_id)}`} aria-label={`Open ${movie.title}, ${movie.year}`}>
            <PixPosterImage posterKey={movie.poster_key} alt={`${movie.title} ${movie.year} movie poster`} loading="lazy" />
            <span><strong>{movie.title}</strong><small>{movie.year} · {movie.genre}</small></span>
          </a>
          {onRemove ? <button type="button" className="pix-user-list-remove" onClick={() => onRemove(movie)} aria-label={`Remove ${movie.title} from ${listName}`}>×</button> : null}
        </div>
      ))}
    </div>
  );
}

export function UserListCard({ list }: { list: PixUserList }) {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(list.name);
  const [renameFlagged, setRenameFlagged] = useState<string[]>([]);
  const invalidate = async () => { await queryClient.invalidateQueries({ queryKey: ["pix-user-lists"] }); };
  const searchQuery = useQuery({
    queryKey: ["pix-list-add-search", list.id, search],
    queryFn: () => api.listPixBrowseCatalog({
      genre: null, country: null, year: null, decade: null, discovery: "all",
      exclude_international: false, offset: 0, limit: 12, shuffle_seed: null,
      query: search, exclude_triaged: false, exclude_dismissed: false,
    }),
    enabled: search.trim().length >= 2,
  });
  const addItem = useMutation({
    mutationFn: (imdbId: string) => api.addPixUserListItem({ list_id: list.id, imdb_id: imdbId }),
    onSuccess: invalidate,
  });
  const removeItem = useMutation({
    mutationFn: (imdbId: string) => api.removePixUserListItem({ list_id: list.id, imdb_id: imdbId }),
    onSuccess: invalidate,
  });
  const deleteList = useMutation({
    mutationFn: () => api.deletePixUserList({ list_id: list.id }),
    onSuccess: invalidate,
  });
  const renameList = useMutation({
    mutationFn: (name: string) => api.renamePixUserList({ list_id: list.id, name }),
    onSuccess: async (result) => {
      if (result.flagged_words.length > 0) {
        setRenameFlagged(result.flagged_words);
        return;
      }
      setRenameFlagged([]);
      setRenaming(false);
      await invalidate();
    },
  });
  const setVisibility = useMutation({
    mutationFn: (visibility: ListVisibility) => api.setPixUserListVisibility({ list_id: list.id, visibility }),
    onSuccess: invalidate,
  });
  const inList = new Set(list.movies.map((movie) => movie.imdb_id));
  const isPublic = list.visibility === "public";
  return (
    <article className="pix-user-list">
      <header className="pix-user-list-head">
        <div className="pix-user-list-title-block">
          {renaming ? (
            <form
              className="pix-user-list-rename"
              onSubmit={(event) => { event.preventDefault(); const name = draftName.trim(); if (name && name !== list.name) renameList.mutate(name); else setRenaming(false); }}
            >
              <label className="visually-hidden" htmlFor={`pix-list-rename-${list.id}`}>Rename {list.name}</label>
              <input
                id={`pix-list-rename-${list.id}`}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={80}
                autoFocus
                aria-label={`New name for ${list.name}`}
              />
              <button type="submit" disabled={!draftName.trim() || renameList.isPending}>{renameList.isPending ? "Saving…" : "Save"}</button>
              <button type="button" onClick={() => { setDraftName(list.name); setRenameFlagged([]); setRenaming(false); }}>Cancel</button>
              {renameList.isError ? <p className="form-error" role="alert">That rename didn’t save. Try again.</p> : null}
              <SafeSpaceFlagNotice words={renameFlagged} />
            </form>
          ) : (
            <h3>{list.name}</h3>
          )}
          <small>{list.movies.length} film{list.movies.length === 1 ? "" : "s"} · {isPublic ? "Public — anyone with the link can view it" : "Private — only you can see it"}</small>
          {isPublic ? <a className="pix-user-list-share-link" href={`#lists/${list.share_code}`}>Open the public link →</a> : null}
        </div>
        <div className="pix-user-list-actions">
          {renaming ? null : <button type="button" onClick={() => { setDraftName(list.name); setRenaming(true); }} aria-label={`Rename list ${list.name}`}>Rename</button>}
          <button
            type="button"
            onClick={() => setVisibility.mutate(isPublic ? "private" : "public")}
            disabled={setVisibility.isPending}
            aria-pressed={isPublic}
            aria-label={isPublic ? `Make ${list.name} private` : `Make ${list.name} public`}
          >
            {setVisibility.isPending ? "Saving…" : isPublic ? "Make private" : "Make public"}
          </button>
          <button type="button" onClick={() => deleteList.mutate()} disabled={deleteList.isPending} aria-label={`Delete list ${list.name}`}>Delete</button>
        </div>
      </header>
      {setVisibility.isError ? <p className="form-error" role="alert">That visibility change didn’t save. Try again.</p> : null}
      <ListMovieGrid movies={list.movies} listName={list.name} onRemove={(movie) => removeItem.mutate(movie.imdb_id)} />
      <form className="pix-user-list-add" onSubmit={(event) => { event.preventDefault(); setSearch(searchText.trim()); }}>
        <label htmlFor={`pix-list-search-${list.id}`}>Add a film to {list.name}</label>
        <div>
          <input id={`pix-list-search-${list.id}`} type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search the catalog by title…" aria-label={`Search films to add to ${list.name}`} />
          <button type="submit" aria-label={`Search films for ${list.name}`}>Search</button>
        </div>
        {search.trim().length >= 2 && searchQuery.data ? (
          <ul className="pix-user-list-results" aria-label={`Films to add to ${list.name}`}>
            {searchQuery.data.movies.filter((movie) => hasPixPoster(movie.poster_key)).slice(0, 8).map((movie) => (
              <li key={movie.imdb_id}>
                <span><strong>{movie.title}</strong> <small>{movie.year}</small></span>
                {inList.has(movie.imdb_id) ? <span className="pix-sort-in-collection">In list</span> : (
                  <button type="button" disabled={addItem.isPending} onClick={() => addItem.mutate(movie.imdb_id)} aria-label={`Add ${movie.title} to ${list.name}`}>+ Add</button>
                )}
              </li>
            ))}
          </ul>
        ) : null}
      </form>
    </article>
  );
}

export function CreateListForm() {
  const queryClient = useQueryClient();
  const [listName, setListName] = useState("");
  const [visibility, setVisibility] = useState<ListVisibility>("private");
  const [createFlagged, setCreateFlagged] = useState<string[]>([]);
  const createList = useMutation({
    mutationFn: (input: { name: string; visibility: ListVisibility }) => api.createPixUserList({ name: input.name, visibility: input.visibility }),
    onSuccess: async (result) => {
      if (!result.ok) {
        setCreateFlagged(result.flagged_words);
        return;
      }
      setCreateFlagged([]);
      setListName("");
      setVisibility("private");
      await queryClient.invalidateQueries({ queryKey: ["pix-user-lists"] });
    },
  });
  return (
    <form
      className="pix-user-list-create"
      onSubmit={(event) => { event.preventDefault(); const name = listName.trim(); if (name) createList.mutate({ name, visibility }); }}
    >
      <label htmlFor="pix-new-list-name">New list name</label>
      <div className="pix-user-list-create-row">
        <input id="pix-new-list-name" value={listName} onChange={(event) => setListName(event.target.value)} maxLength={80} placeholder="Name your list" aria-label="New list name" />
        <div className="pix-list-visibility-picker" role="radiogroup" aria-label="New list visibility">
          <button type="button" role="radio" aria-checked={visibility === "private"} className={visibility === "private" ? "is-active" : ""} onClick={() => setVisibility("private")}>Private</button>
          <button type="button" role="radio" aria-checked={visibility === "public"} className={visibility === "public" ? "is-active" : ""} onClick={() => setVisibility("public")}>Public</button>
        </div>
        <button type="submit" className="primary-button" disabled={!listName.trim() || createList.isPending}>{createList.isPending ? "Creating…" : "Create list"}</button>
      </div>
      <small className="pix-user-list-create-note">
        {visibility === "public"
          ? "Public: anyone with this list’s link can view it (they can’t change it)."
          : "Private: the list lives only on your profile — nobody else can open it."}
      </small>
      {createList.isError ? <p className="form-error" role="alert">That list couldn’t be created. Try again.</p> : null}
      <SafeSpaceFlagNotice words={createFlagged} />
    </form>
  );
}

export function UserListsManager({ allowCreate }: { allowCreate: boolean }) {
  const listsQuery = useQuery({ queryKey: ["pix-user-lists"], queryFn: () => api.listPixUserLists({}) });
  return (
    <>
      {allowCreate ? <CreateListForm /> : null}
      {listsQuery.isPending ? <p className="pix-catalog-state" role="status">Loading your lists…</p> : null}
      {listsQuery.isError ? <p className="pix-catalog-state" role="alert">Your lists could not load.</p> : null}
      {listsQuery.data ? (
        listsQuery.data.lists.length > 0 ? (
          <div className="pix-user-lists">
            {listsQuery.data.lists.map((list) => <UserListCard key={list.id} list={list} />)}
          </div>
        ) : <p className="pix-catalog-state">{allowCreate ? "No lists yet — create your first one above." : "No lists yet — create your first one in your Profile."}</p>
      ) : null}
    </>
  );
}

export function SharedListView({ code }: { code: string }) {
  const sharedQuery = useQuery({
    queryKey: ["pix-shared-list", code],
    queryFn: () => api.getPixSharedList({ share_code: code }),
  });
  if (sharedQuery.isPending) return <p className="pix-catalog-state" role="status">Opening that list link…</p>;
  if (sharedQuery.isError) return <p className="pix-catalog-state" role="alert">That list link could not be opened.</p>;
  const list: PixSharedList | null = sharedQuery.data?.list ?? null;
  if (!list) {
    return <p className="pix-catalog-state" role="status">That list link doesn’t open a list — the list is private or the link is wrong. Your own lists are below.</p>;
  }
  return (
    <article className="pix-user-list pix-shared-list">
      <header className="pix-user-list-head">
        <div className="pix-user-list-title-block">
          <h3>{list.name}</h3>
          <small>
            {list.movies.length} film{list.movies.length === 1 ? "" : "s"} · {list.is_owner ? "Your list" : "Public list"} · View only
          </small>
        </div>
      </header>
      <ListMovieGrid movies={list.movies} listName={list.name} />
    </article>
  );
}
