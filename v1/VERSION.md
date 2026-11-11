# PIX.MOV releases

## v1

Feature-complete snapshot stamped 2026-10-15.

## v1.1

Production-trim pass. Removed the landing-page activity statistics, Trending Now, Shorts, My Library, Library, poster-density controls, and chat entry point.

## 1.00.01

Launch pass, 2026-11-05 — BUILD V-01-00-01 (homepage footer stamp).
(Version corrected 2026-11-05: the launch pass is 1.00.01 per the root
VERSION.md log — a patch increment on the 1.00.00 start. The V-01-01-00
naming in commit 2ac05800 is superseded by this entry.)
CINE removed from the visitor surface until stable: one flag
(`CINE_ENABLED` in `client/src/App.tsx`) guards the header CONTENT
trigger/window, the `#/cine` route and the CINE section render. All CINE
code, server actions, tables and data are preserved; flip the flag to restore.

## 1.00.02

1:1 LIVE BUILD Pass 1, 2026-11-05 — BUILD V-01-00-02. Header as one unit
in the artifact's arrangement, applied to the served portable trunk
(`public/app.js` + design CSS): PIX.MOV wordmark at the left of the bar,
account trigger moved to the right-hand control cluster (its menu now
drops at the right), chase bulbs anchored to the bar flanking the
centred NOW PLAYING straddle, FILM DNA mini + LOGIN + search at right.
Tokens/ground verified already at parity (design tokens extracted from
this source). CINE stays out (separated — a MagicWRX tool).

## 1.00.03

1:1 LIVE BUILD Pass 2, 2026-11-05 — BUILD V-01-00-03. Three legs, per
Local's acceptance criteria (mail row 46): (1) MARQUEE — the three rows
already existed with the artifact's speeds and a de-duped round-robin
pool, but rendered as a black band: the H-3.5 fade parks poster images
at opacity 0 until load, and the marquee template was the one poster
template missing the onload that completes the fade. Fixed; harness
shows 40/40 images in a row carrying it. (2) BISCUIT — first visit is
now a dismissible bottom bar, not the blocking modal (page stays
scrollable; Details opens the full panel; the footer button still opens
the panel as the settings surface), and decisions fire the append-only
server consent record (flag-gated until the DB cutover). (3) /api/* —
unknown API paths answer the JSON {ok:false, code:'not_found'}
envelope instead of the Express HTML 404.

## 1.00.04

1:1 LIVE BUILD Pass 3, 2026-11-05 — BUILD V-01-00-04. Sections parity,
enumerated from the artifact's own registry (SectionKey/slugBySection
in this source: 24 sections). Landed on the portable: FILM DNA home
(#/dna), Sort Collection (#/sort), Grossers (#/grossers, COMB data was
already served), Watchlist (#/watchlist + new GET /api/watchlist from
want_to_see signals), FEATURE PRESENTATION as its own section
(#/feature + #/feature/:key, classic showcase refactored to render into
it), the five Story sections (#/dream-log, #/poster, #/monsters,
#/notes, #/publish + new GET /api/notes, kind filters exactly as the
artifact's components), and #/profile + #/screening/:id aliases.
NOT landed, named not faked: Views and Budgets — no data source exists
on this backend (no views counter anywhere; no budget figure in any
table). CINE stays separated. Count after this pass: 21 of the 23
parity sections render; Views + Budgets blocked on data.

## 1.00.05

1:1 LIVE BUILD Pass 4, 2026-11-05 — BUILD V-01-00-05. The NOW PLAYING
component, ported from this source's PixSection: the EDIT FILTER popover
now carries the sidebar game controls (gold fold-out; TYPE = All time /
Genre / Decade / Year, scope radio lists with real counts; the
Performance category fold is NOT offered — no performer-pair endpoint
exists on the portable backend, named not faked) fed by /api/decks and
a new GET /api/genres, plus an optional genre filter on /api/matchup.
Picking a poster now holds the vote for the WHY panel ("One more beat —
Why did it win?", Story / Performance / Feeling / Craft / Rewatch value
+ optional note; Skip or Save to FILM DNA), recorded via POST /api/vote
into a server-managed pix_vote_reasons table. The winner then STAYS on
stage against a fresh challenger, with a Win streak ×N badge from the
second consecutive win. Interest: Want to See queues and keeps the
film; Maybe / No, Thanks / Never Heard of it (the fourth fold button,
replacing the duplicate haven't-seen) replace only their side. "Haven't
watched it either" moved to the FILM DNA row above the matchup with the
artifact's label and refresh icon; MY SCREENING links added to the
poster meta overlays.

## 1.00.06

1:1 LIVE BUILD Pass 5, 2026-11-05 — BUILD V-01-00-06. Landing remainder,
measured against this source before building: the features shelf takes
the artifact's treatment (number 02, "Features", tagline "Feature
presentations from the PIX library", up to 12 cards, each opening its
FEATURE PRESENTATION section at #/feature/:key, overlay "year · Feature
presentation" + "Watch feature"), the channel rows renumber from 03,
and the feature section's related shelf takes its artifact heading
("UP NEXT / Other Features"). The landing feature cards also carried
the H-3.5 fade fault (no onload) — fixed, same class as the marquee.
NOT built: a stat band — none exists anywhere in the artifact's
landing; the premise came from the portable's own components doc, and
inventing one would be drift, not parity. The GENRES attractions menu
was already at parity (rows present on the page; picking one scrolls
and unfolds).

## 1.00.07

1:1 LIVE BUILD Pass 6 (final), 2026-11-05 — BUILD V-01-00-07. Floating
panels close out: the marquee feature popup already carried the shared
window treatment, the CINE BIN stays out with CINE separated, and the
chat widget is built as TALK TO PIX under Founder ruling A (mail row
54): an orange launcher, fixed bottom-right, opening a window with the
shared treatment (gold bottom rule). There is no live chat service on
this backend, so messages post to a new POST /api/chat and land in the
feedback store as type 'chat' with the visitor's identity when signed
in — and the panel says so plainly: PIX reads everything, replies come
by email, this isn't a live chat. No pretend conversation. With this
pass the 1:1 LIVE BUILD programme is complete on the builder's side;
what remains is Local's attestation batch (rows 47/48/51/53/this) and
the Founder's promotions.

## 1.00.08

Founder fixes pass, 2026-11-05 — BUILD V-01-00-08. Six live-site edits
from the Founder's review of the 1:1 build, each fixed to this source's
own treatment: (1) Features show POSTERS, not screen grabs — /api/
classics now resolves each classic's poster through the catalogue
(title + year match into pix_movie_stats); shelves render the poster or
the artifact's missing-poster plate, never a still; the classic page's
poster slot takes the real poster (its poster_url no longer aliases a
still); the Horror channel row is poster-backed only. (2) The header
chase is bounded by the artifact's reserves (wordmark / controls) with
space-between spread and vw-sized bulbs — it now adjusts to the
display width instead of running at a fixed content width. (3) The
game frame takes the artifact's padding (12px 10px 14px; 18px from
620px up) — posters no longer sit flush. (4) The header NOW PLAYING
button's is-open state now fully disappears (opacity 0 + pointer-
events none, with the scale) — the moved-into-the-panel illusion.
(5) The in-panel NP banner takes the artifact's button shape
(inline-flex column, padding 8px 16px 7px, min-height 46px).
(6) The game dropdown is the artifact's bare shell — left-aligned
directly under the NP button, no black box / gold outline wrapper;
the gold sidebar panel itself carries a gold top rule + shadow.

## 1.00.09

Founder fixes pass 2, 2026-11-05 — BUILD V-01-00-09. (1) The Classics
catalogue page shows POSTERS (same catalogue join as the shelves),
staged, with the PIX plate where no poster resolves — not stills.
(2) Marquee clicks open a HUGE poster view: the feature panel is now
viewport-anchored at the click point (the band was too short to hold
it), min(80vw, 380px) wide with the full poster. (3) Staged poster
loading everywhere posters render large: a gradient paints first,
then the smallest poster (new /api/poster size=sm — the ._V1_ size
rewrite; local files serve as their own small variant), then the full
poster crossfades over it (marquee tiles stage gradient → small; the
full poster arrives with the huge view). (4) The NP interest dropdown
buttons stack flush — gaps removed, shared borders. (5) The right
poster's × now hugs the poster's top-right corner (it sat at the wide
menu box's left edge). (6) The play arrow at the top of the NP panel
is removed. (7) The game is PIX MIX: "PIX MIX: movie vs movie"
replaces "Current game: Movie vs Movie" in the panel header (and the
FILM DNA prompt line follows).

## 1.00.10

Founder fixes pass 3, 2026-11-05 — BUILD V-01-00-10. THE ACCOUNT BUG:
the password field's Enter handler was written as an expression
(e => e.key === 'Enter' && go()) — returning false from an onkeydown
property handler cancels the key's default action, i.e. the character
insertion itself, so the field focused, showed a cursor, and swallowed
every keystroke; no password could be typed and no account created
(confirmed by a live probe: email typed fine, password stayed empty).
Handler rewritten with a block body; it was the only input with the
pattern. Also in this pass: auth inputs guaranteed one width on a
fixed label column. Header, to the Founder's layout: LOGIN/search/…
share one outlined button box (38px; search and account trigger
matched to LOGIN), the actions ride at the top of the bar so the chase
flows underneath them, FILM DNA loses "RECORDED" and its outline and
its text top aligns with LOGIN's, the wordmark drops to rest 4px above
the gold line, and the stacked near-chase bulbs behind the NP button
are removed (the game-open pile). Landing: the attractions row moves
above Features, borderless, without the ATTRACTIONS word.

## 1.00.11 — LAUNCH FUNNEL (Founder ruling, 2026-11-06)

BUILD V-01-00-11. pix.mov loads only tantalizing PIX from the past 40
years: one LAUNCH_YEAR_MIN (current year − 40 = 1986) enforced server-side
on /api/decks, /api/genres and every /api/matchup path, and the landing's
discovery pool (marquee + genre channel rows) filtered to the window
client-side. Of the Top 500 by wins, 472 films sit inside the window, so
the marquee keeps its full 60. Deliberate destinations stay all-time:
the Top 500 page and the Top-100 lists (the spawned-lists build now
underway). The streaming shelves (FEATURES + the classics Horror row)
stay — the funnel's third step, what we have available to stream.
NOW PLAYING is OPEN for first-launch users: a first-time visitor lands
directly in PIX MIX (the hook), once only (pix_welcomed_v1 flag); deep
links are never hijacked, and the game was already playable anonymously.
Game scope relabelled honestly: "All time" → "Past 40 Years". Funnel of
record: PIX MIX (hook) → list creation + rating → stay and watch.

## 1.00.12 — MFA COLLISION FIXED + TOTP OPTIONAL (mail row 74)

BUILD V-01-00-12. The login defect — "A factor with the friendly name
"pix-portable" for this user already exists" — came from the post-sign-in
step falling through to enroll() whenever the factor list came back empty
or unread. That fall-through is gone, and with it the whole forced-MFA
design, per the Founder ruling on mail row 74 (2026-11-05):
- Sign-in/sign-up now end at a usable account. The step after password
  (afterSignIn) challenges ONLY a verified TOTP factor — enrolled
  accounts are never downgraded — and every other account walks straight
  in. enroll() is unreachable from the auth flow (one call site remains,
  in Account Settings); a factor-list error is surfaced, never swallowed.
- The auth methods are called on sb.auth, never detached into a bare
  variable (the detached-method bug); a sign-up that returns no session
  (email confirmation pending) stops with a clear message.
- The "Multi-factor authentication is required for sign-in" copy is
  removed; the panel now says two-factor is optional.
- NEW: Account Settings (#/settings, in the account menu) — enable TOTP
  (lists factors first, so a second factor is never enrolled against an
  existing one), finish or remove a half-finished enrolment, disable
  TOTP (requires password + a valid code, with the loss stated plainly).
- Recovery codes are NOT in this pass; the enable path says so in the
  UI ("Recovery codes are not available yet…") — row 74's marked-path
  option. Recovery codes remain a named follow-up.
- The auth surface was exercised before shipping in a stubbed harness
  driving the shipped code: 21/21 checks (no-factor, verified,
  unverified-only, list-error, settings enable/finish/disable states).

## 1.00.13 — SIGN-OUT FIXED + ATTRACTIONS CONTROLS WIRED

BUILD V-01-00-13. Two Founder reports (2026-11-06):
- "Signout does nothing." The account-menu handler awaited the server
  revoke before clearing anything (a failing or hanging revoke on a
  stale stored session stranded the local session), and its only
  visible action was setting location.hash to '#/' — a no-op when the
  visitor was already home, so nothing re-rendered. Now: local state
  clears first, the revoke is best-effort with a local-scope fallback,
  and the re-render is forced when the hash would not change. The
  Account Settings sign-out takes the same shape.
- Attractions 'seen'. viewAttractions injects its film rows after
  mount() and never bound them, so every control in the cards' folds —
  the poster itself, Film page, Review, Discuss, and the seen toggle —
  was dead on that page (confirmed by a live probe: clicks produced no
  navigation and no state change). The page now binds its rows exactly
  as Top 500 and the landing rows do, including the seen state landing
  on the poster.

## 1.00.14 — HOVER TYPES EVERYWHERE + REACTION VOCAB

BUILD V-01-00-14. Founder directive 2026-11-06: every list/group view
carries the HOVER types, and the hover fold records the REACTION VOCAB
that builds a fan's FILM DNA.
- Coverage: the SEEN year grids (#/seen/<year>), user list pages, and
  search results rendered bare poster tiles — no fold, no controls.
  They now render the standard foldout card (poster, fold, seen toggle),
  bound exactly like Top 500 and the landing rows. Landing rows,
  Attractions, and the Top 500 fold carry the reactions too.
- REACTION VOCAB (registered in lat.vocabulary; speciation recorded in
  PIX-SPAWNED-LISTS): the fold gains verdict groups — HATED IT (Boring /
  Stupid / Bad acting), LOVED IT (One of my favorites / Fun / Great
  Action / Very Romantic), and the HORROR lens (Super Scary / Gory /
  Great Villain, horror films only) — under the standing SEEN / NOT SEEN
  toggle. Tapping a label records it for this fan on this film (toggle
  off to remove); recorded labels fill green and count on the group head.
- Server: POST /api/reactions + GET /api/reactions/mine (identityAuth).
  Labels are validated against the governed set — no free text is ever
  stored. Storage: pix2.pix_user_reactions (created on first use),
  following the signals pattern; a mirror user-write table for the
  up-sync leg, like the other fan tables.

## 1.00.15 — ATTRACTIONS ROW, CHAT SENT STATE, CLASSICS BY GENRE, SCREEN GRABS

BUILD V-01-00-15. Founder batch 2026-11-06 (evening):
- Attractions: the NOW PLAYING promo row (ROW 3) is removed.
- TALK TO PIX: after a successful send the panel shows only "Message
  sent — Thank you for sharing your thoughts!" with a "Send another
  message?" button that restores the form. No thread echo, no extra copy.
- #/classics groups by genre (genre rides each film's library path),
  one shelf per genre with counts. A catalogue title+year match alone
  now earns a poster attempt (the poster_key filter is gone; /api/poster
  falls back to the IMDb record by id).
- Screen grabs: the segment strip is ONE scrolling row. Per-segment
  thumbs live at the mirrored /thumbs/ path — where a film's grabs were
  never made, tiles fall back to the film's own still (a real frame from
  the same print) instead of a broken image; the watch page's still is
  the recorded still_url again (it was shadowed by a derived thumb).
- Data (GAKz, same pass): A Trip to the Moon (tt0000417), Faust
  (tt0016847) and 3 Bad Men (tt0017463) were missing from the catalogue
  entirely — verified against IMDb's own records and added, which is
  what their classics posters were waiting on. A Trip to the Moon also
  received true per-segment screen grabs in B2 (separate data job).
  Still unmatched: Dr. Mabuse the Gambler + Napoléon (in the catalogue
  under variant titles) and A Woman of Paris, Die Nibelungen, Seventh
  Heaven, L'Age d'Or (no exact IMDb match verified) — named follow-up.

## 1.00.16 — HOVERS: MARKS PAINT EVERY POSTER + REWATCH RING + FAVORITE

BUILD V-01-00-16. Founder lock 2026-11-07 ("Review site and implement
in necessary places. REMEMBER based on how movies are marked changes
their border color in all instances on the site for that user — Green
SEEN in the marquee or Top 500."):
- MARKS: one painter (paintMarks) applies the locked poster semantics
  in every instance of a film, per user: SEEN green outline · WANT
  gold · MAYBE orange · NO THANKS dimmed. Surfaces: marquee posters +
  the huge view, Top 500 cards, every foldout card (landing rows,
  Attractions, lists, search, seen years, Watchlist, Sort), classics
  tiles (catalogue-matched), the film page poster. Every state change
  (seen toggle, verdict, favorite) repaints the whole page, so all
  instances of a film always agree. Before this pass only SEEN painted,
  and only where each renderer remembered to do it.
- FAVORITE (HOVERS state ring): a ★ Favorite toggle in every fold and
  on the film page; favorites wear a gold star chip on the poster
  everywhere. Stored as a governed reaction label; the five HOVERS
  terms (FAVORITE, REWATCH + its three labels) registered in
  lat.vocabulary the same day.
- REWATCH ring joins the hover fold (HATED IT / LOVED IT / HORROR):
  Rewatch all the time / Want to see again / Once was good enough —
  a single-pick axis (picking one clears the others, server included).
- Remaining kit (PIX-HOVERS.md build order): ADD TO A GROUP dropdown,
  IN THE MOOD FOR filing + page, PIX STATS band, dropdown-first
  comments — next passes.

## 1.00.17 — HOVERS: ADD TO A GROUP dropdown

BUILD V-01-00-17. The fold's grouping utility (PIX-HOVERS.md §7, pass 2):
every foldout card gains an "Add to a group…" dropdown — the fan's own
lists (loaded once, cached), PIX-suggested groups computed from the
film (decade + genre, or genre — "1990s Horror"), and "New group…" (the
kit's only typing: one short name, inline). File posts through the
existing lists machinery (POST /api/lists + /api/lists/:id/items); no
server change. Top 500's Move to List gains the same suggestions, its
row now renders for any signed-in fan, and its button files through
the shared helper and names the group it filed to.
Next in the order: IN THE MOOD FOR filing + page, PIX STATS band,
dropdown-first comments.

## 1.00.18 — HOVERS: IN THE MOOD FOR… filing + page

BUILD V-01-00-18. The mood utility goes live with the set of record:
the curated MOOD taxonomy locked 2026-10-19 (PIX Topology v1.0.6) —
Feel-good, Dark, Thrilling, Romantic, Nostalgic, Mind-bending, Cozy,
Intense, Funny, Sad, Epic, Chill, Scary, Inspiring, Weird,
Heartwarming — registered in lat.vocabulary (MOOD + IN THE MOOD FOR +
16 labels) and validated server-side; no free text. Every fold gains
the IN THE MOOD FOR… chip block (multi-pick; per-fan filings in
pix2.pix_user_moods, the reactions pattern); the film page shows the
community mood fingerprint ("Fans file this under: Dark 42 ·
Thrilling 38" once filings exist); the new #/mood page asks by mood —
a dropdown plus the fan's own mood shelves (per-mood auto-lists) fed
by /api/moods/shelf. Filings feed FILM DNA.
Next in the order: the PIX STATS band, then dropdown-first comments.

## 1.00.19 — HOVERS: PIX STATS band

BUILD V-01-00-19. The read side of the kit: GET /api/stats/film and
/api/stats/list aggregate the governed stores the folds write to —
seen / want / maybe / no counts (film_dna_media_signals), favorites,
loved vs hated, and the rewatch split (pix_user_reactions), top moods
(pix_user_moods) — counts only, never percentages or estimates; a
segment renders only when its count is real, and an unmarked film
says "No fan marks yet — yours will be the first." The band sits on
the film page and at the head of list pages. PIX STATS registered in
lat.vocabulary.
Next in the order: dropdown-first comments — the last kit pass.

## 1.00.20 — HOVERS: dropdown-first comments (kit complete)

BUILD V-01-00-20. The last HOVERS pass. Comments on the film page
(the reviews) are now dropdown-first, per the kit's no-thinking
rules: the composer leads with a COMMENT STANCE dropdown (Agree /
Same here / Hard disagree — registered in lat.vocabulary with the
parent term) and a stars dropdown; the sentence is optional and
last, and a comment with no stance, no rating and no text is
refused. Every comment renders the commenter's own verdict chip
beside their name — ★ Favorite / Loved it / Hated it / Seen it,
computed at read time from their governed marks — plus their
stance chip. pix_reviews gains a stance column (ADD COLUMN IF NOT
EXISTS); the up-sync tracking list gains nothing new (same table).
With this pass the HOVERS kit of PIX-HOVERS.md §7 is fully built:
marks layer (1.00.16) · groups (1.00.17) · moods (1.00.18) · PIX
STATS (1.00.19) · comments (1.00.20).

## 1.00.21 — Founder COLOUR LAW for poster marks

BUILD V-01-00-21. The state colours of the marks painter now follow
the Founder's colour law (2026-11-07; visual of record:
state-colors.png) in every instance — marquee, Top 500, lists,
shelves, seen pages: HATED IT → RED (new: any HATED IT reaction
label paints the poster red, outranking seen — you only hate what
you have seen) · SEEN → GREEN (unchanged) · WANT TO SEE → ORANGE
(was gold) · NOT SEEN → GRAY (the resting outline for a signed-in
fan's untouched films; NO THANKS keeps its dim and takes the gray
outline). Two judgement calls ride for the Founder to strike:
MAYBE → GOLD (the colour WANT vacated; the law did not name MAYBE)
and gray resting on signed-in surfaces only (anonymous visitors
have no marks to follow). FAVORITE keeps no colour of its own —
the gold star chip rides on the state colour, per the ruling.

## 1.00.22 — NOW SHOWING: Amazon availability on the film page

BUILD V-01-00-22. Founder brief 2026-11-07: scan what is showing on
Amazon; link it from film pages. Availability truth is TMDB
watch/providers (JustWatch data) — Amazon is never scraped. The
scanner job (streaming-scan/scan_streaming.py) resolves the
catalogue by imdb_id, stores ONLY Amazon rows (Prime Video stream,
Amazon Video rent/buy, US) in GAKz pix.pix_streaming_availability,
priority = launch window + Top 500 first; v1 links are Amazon
search URLs scoped to title + year (no affiliate tag — that is its
own ruling). The scanner refuses to run without the TMDB key in
its environment (vault path only); coverage is reported honestly
as it grows and stands at 0 until the key lands.
This build is the read side: GET /api/streaming (guarded) + the
film page's NOW SHOWING block — the Prime Video button, rent/buy
as smaller links, "Streaming data: TMDB / JustWatch" fine print.
No availability row -> no block, ever.

## 1.00.23 — NOW SHOWING goes multi-provider

BUILD V-01-00-23. Founder ask 2026-11-07: "Can you add Tubi and
YouTube and other streaming services?" The scanner now stores
EVERY US provider TMDB/JustWatch reports (flatrate/free/ads ->
stream; rent; buy), with per-service search links where a stable
pattern exists (Netflix, Hulu, Disney+, Apple TV, YouTube, Tubi,
Google Play, Amazon) and the film's TMDB watch page as the
fallback link. No affiliate tags anywhere. Film page: stream
offers render as a button row in a named priority order (Netflix,
Max, Disney+, Hulu, Prime Video, Apple TV+, Paramount+, Peacock,
Tubi, then the rest); known-free services read "Watch free on
..."; Rent and Buy render as per-type link lines naming each
service. /api/streaming is unchanged — it already returns every
row. Coverage still stands at 0 until the TMDB key lands (vault
path); the first scan's numbers cross on their own row.

## 1.00.24 — USER PERSONA: named lists + fan showcases

BUILD V-01-00-24. Founder directive 2026-11-07: "It is important
that we help build user persona. So list made by users have their
names and link back to their showcases and other list." Lists now
stamp their maker's name (the email-prefix label reviews already
use) at creation; the public lists index and every list page
carry "by <name>", the name linking to the fan's new SHOWCASE
page (#/fan/<user_id>) — their public lists with film counts,
nothing private shown (the 2026-10-20 public/private ruling
stands). List pages gain a "More lists by <name>" rail; comment
author names on film pages link to their showcases too. Labels
resolve lists -> reviews -> "A PIX fan", honestly. Terms USER
PERSONA + FAN SHOWCASE registered in lat.vocabulary (registry 62).

## 1.00.25 — TALK TO PIX renamed PIX GURU

BUILD V-01-00-25. Founder directive 2026-11-07: "Change talk to
pics to pix guru." The SUPER CHAT surfacing on PIX.MOV takes the
chartered agent's name: the chat launcher, panel header and aria
labels now read PIX GURU. Client strings only; the chat plumbing
(POST /api/chat -> pix_feedback) is untouched, and the sent state
still reads "Message sent — Thank you for sharing your thoughts!".
Recorded as a governed speciation in lat.vocabulary (PIX GURU,
lineage CHAT -> SUPER CHAT -> TALK TO PIX -> PIX GURU; registry
63); TALK TO PIX remains the historical term of record.

## 1.00.26 — Attractions row: SEEN matches the buttons; Now Playing slot out

BUILD V-01-00-26. Founder reports from iPhone 2026-11-07: "The
scene button in row is still huge. It needs to match other
buttons. Also remove the nail playing button from attractions
row." The huge one is the SEEN entry in the landing attractions
row: it was a 96px-wide poster-shaped tile (plate at a 2:3
aspect ratio, ~150px tall) standing beside 44px attraction
buttons — the same element behind his 2026-11-06 report that it
"acts like it is trying to show an image". It now takes the
.pix-attraction-btn box exactly (inline-flex, min-height 44px,
same padding and gold border); the plate is an inline SEEN
label and the count caption rides beside it. And the "Now
Playing" slot button is removed from the attractions row — the
header NOW PLAYING pill, the game's home, is untouched.

## 1.00.27 — FILM DNA band above the attractions row; RECORDED finally dropped

BUILD V-01-00-27. Founder directive 2026-11-07: above the
attractions row, a heading — "Discover your natural algorithm"
(his words) — made fainter; "the goal is to see DNA and display
percent number." The landing gains a FILM DNA band directly
above the attractions row: the heading small, dim and faded;
the fan's FILM DNA percent big and gold beneath it, linking to
the FILM DNA page. The value is the same dnaStats percent the
header carries (0.00% until a decision accrues — never invented).
Same pass, the named carry-over dies: refreshDna() still wrote
"FILM DNA RECORDED X.XX%" into the header after every load —
the shell's first render had dropped RECORDED in 1.00.10 but
the refresh kept restoring it (Local's attested FAIL). The
refresh string now matches the ruling everywhere.

## 1.00.28 — Features endpoint guard; marquee touches header; huge view repaired

BUILD V-01-00-28. Three Founder reports via PIX GURU
(2026-11-07, feedback ids 6–8). (1) Features not displaying:
GET /api/classics returns 500 on the served mirror — the
1.00.15 query names f.still_url and f.path_prefix outright and
the mirror's table lacks a column; the endpoint now probes
information_schema and builds those expressions conditionally
(missing still → derived art; missing path → one Classics
shelf). The landing FEATURES shelf and #/classics both feed
from this endpoint. (2) Black space above the marquee: the
main's header+6px padding plus the marquee's 14px top margin
made 20px of black; the marquee now touches the header.
(3) The huge marquee pop-out slid behind the header and could
not be closed: its .is-huge rule sits nested inside
.pix-marquee-feature in theme.css, where browsers read it as a
descendant selector that never matches — the panel fell back
to absolute / z-index 8 under the fixed header (z 50). The
rule is now stated flat, the panel's top clamps below the
measured header height, and it dismisses on mouse-off or any
tap/click outside it.

## 1.00.29 — FRIENDS: add friends, their picks + posts, feedback

BUILD V-01-00-29. Founder directive 2026-11-07: add friends;
when they post or make a movie choice (this over that), see
their pick and give them feedback. Built: one-tap Add friend on
every FAN SHOWCASE (state toggles to Friend — tap to remove);
a FRIENDS page (nav) with your friends list, a FRIEND FEED —
their PIX MIX picks as winner-over-loser poster pairs and
their posts (stars, stance, text) in time order — and FEEDBACK
ON YOUR ACTIVITY, what friends sent you. Feedback is
dropdown-first in the governed COMMENT STANCE vocabulary
(Agree / Same here / Hard disagree) plus an optional line; it
only flows to fans you have added, only on activity that is
really theirs. Data honesty: pix_movie_votes carried no user
column, so picks are recorded per fan only from this build
forward (guarded ALTER) — history is never backfilled or
invented; posts were already per-fan and flow in full. Terms
FRIENDS + FRIEND FEED registered in lat.vocabulary.

## 1.00.30 — FEEDBACK pattern + PIX MIX past-ten-years deck + hover/genre/WHY batch

BUILD V-01-00-30. Founder directives 2026-11-08 (seven items):
(1) PIX GURU → Feedback: the fleet pattern is a quick feedback box,
not a conversational agent — the SUPER CHAT / PIX GURU agent legs are
superseded and do not proceed. The widget posts the message with the
page it was sent from (guarded pix_feedback.page); delivery to MAIL +
the Control Plane runs through the feedback watch leg
(mail.messages kind='note', mail_from='feedback:pix.mov',
state='pending', refs carry property/page/feedback_id/reporter;
dedupe on feedback_id). FEEDBACK registered in lat.vocabulary
(lineage CHAT → SUPER CHAT → TALK TO PIX → PIX GURU → FEEDBACK);
PIX-CHAT brief at v0.4.00. (2) NOW PLAYING matchup posters render
25% smaller (game matchup at 75% width). (3) PIX MIX starts on a new
default deck: TOP MOVIES OF THE PAST TEN YEARS — release year ≥
current − 10 (1,512 catalogue films), ranked by PIX wins, pool =
top 250; the Past 40 Years mix remains selectable. (4) The game
panel carries the headline "Which MOVIE DID you ENJOY MORE" with
subhead "Past Ten Year Blockbusters", Brian's exact words.
(5) Hover rule: any poster hovered displays the standard hover fold —
landing FEATURES cards, poster-backed #/classics tiles and
friend-feed posters now render as foldout cards; marquee (huge view),
Top 500, lists, search and rows already carried it. (6) Landing
genre rows scroll only what PIX streams: classics grouped by
library genre, poster-backed, four or more to a row (comedy 21 ·
horror 15 · drama 12 · noir 12 · westerns 7 · talkies 7 · soviet 5 ·
european 5; sci-fi's 3 stay rowless rather than backfilled). The
Top Rated crowd row is not a genre row and stays. (7) The game no
longer offers "Why did you pick this choice" — picks record at
once. A fan's reason now lives on their own movie review (composer
reason select → pix_reviews.why_tag) and shows as a chip on the
film page and in the new Movie reviews section of their Fan
Showcase — individual users only.

## 1.00.31 — Hotfix: past-ten-years deck query + marquee SEEN

BUILD V-01-00-31. Founder reports 2026-11-08 (live 1.00.30):
(1) "Now Playing keeps crashing" — the 1.00.30 top10 deck branch
built its SQL as FROM (subquery) s + the triage clause
(AND NOT EXISTS ...) with no WHERE open whenever no genre filter
was set: a syntax error for every identified viewer (signed-in
fans and anonymous-id browsers alike), so /api/matchup returned
500 "server error" and no pair ever dealt. Verified against
Postgres (error 42601 at the AND) and live (viewer-carrying
requests 500, identity-less requests 200). The branch now always
opens WHERE TRUE before the genre/triage clauses. Other branches
(mix/years, named decks) already opened a WHERE and are untouched.
(2) Marquee SEEN "does nothing" — the save path was healthy but a
failed save returned silently and the poster stayed in the scroll.
Per the Founder's spec the button now reports a failed save
("COULD NOT SAVE — TAP TO RETRY") and a successful mark paints the
green border (is-seen + paintMarks), then the poster leaves the
marquee; the record itself lands in the fan's Profile via
POST /api/seen as before. (3) Absorption: Local's on-host
ANALYTICS beacon (PIX_ANALYTICS, mail row 114 — session.start /
page.view / np.matchup_served / np.vote / feedback.submitted into
the Phase 3 /api/events scaffold) is carried into the build
verbatim, closing the host-repo divergence the delta flagged.

## 1.00.32 — Hotfix: auth lookups can no longer hang a page

BUILD V-01-00-32. Founder reports 2026-11-08 (live 1.00.31,
served 2026-11-09T00:01Z): NOW PLAYING, Top 500, Friends, Showcase
and In the Mood For all "not working" for a signed-in fan, while
every anonymous probe answered 200 in ~1s. Root cause: the host's
route to the Supabase auth endpoint HANGS since the 2026-11-08
redeploy — it does not error, it never answers (live measurement:
any request carrying a Bearer token went unanswered past 30s, 3/3;
the same endpoints anonymously ~1s). The client attaches the
fan's token to every API call, and the server awaited
supaAdmin.auth.getUser with no timeout, so one hanging lookup
froze every signed-in page. Fix (server only): getUserFast races
the lookup against 2500ms at all four call sites (requireAuth,
optionalAuth, identityAuth, the tough-picks route). On timeout the
callers degrade exactly as they already do on an auth error —
reads fall back to anonymous, writes fail fast with 401 instead of
hanging. When the auth backend answers in time, nothing changes.
The host-side route repair is Local's leg, named in the 1.00.32
crossing; this build keeps the site usable until it lands.

## 1.00.33 — Account menu who-line: identity from every carrier

BUILD V-01-00-33. Founder answer relayed 2026-11-09 (live
1.00.31/32): the … account menu OPENS but shows no username at the
top, though he is signed in. Diagnosis: the menu markup is
re-baked on every route and its CSS is clean — the who-line is
gated on session.user.email in the browser-stored session object,
and that object can carry a working access token (the server
identifies him; his picks, marks and feedback all carry his id)
while its user object lacks the email field. The server-side user
record DOES carry the email — /api/chat stamps reporter_email
from req.user.email and his rows carry it. Fix (client only): a
whoEmail() derivation — user.email, then user_metadata.email,
then the access token's own email claim (minted from the same
user record) — now feeds the who-line, the LOGIN hide, the Sign
out gate, the Settings "Signed in as" line and the MFA-disable
password re-auth, which all read the same fragile field before.
Harness-verified against five session shapes (email present,
metadata only, token-claim only, garbage token, no session).

## 1.00.34 — Surfacing pass: spawned lists, annex shelves, landing removal

BUILD V-01-00-34. Founder order 2026-11-10 (Main chat): the new
Animation, British and Lists content existed in data with no build
surfacing it. (1) SPAWNED: /api/spawned-lists endpoints (guarded),
#/lists gains a SPAWNED shelf of the 12 locked lists, #/spawned/:slug
renders ranked panels via the shared loopCard (hover fold, seen/want),
source link-backs throughout; unresolved films render as title panels
marked 'Not in the PIX catalogue yet'. (2) Shelves: 'British' joins
both genre-name maps; Animation was already named — both shelf on
#/classics as the mirror rows land; Lady Vanishes rides as-is (one
clip, excerpt source; re-source call still the Founder's). (3) The
account-menu who-line fix from 1.00.33 rides (served 2026-11-09).
(4) Landing removal: Soviet + Birth of a Nation (1915) filtered in
viewLanding only. (5) version.json: real version + base commit.

## 1.00.35 — Onion-layer hovers, identity consistency, marquee half-size

BUILD V-01-00-35. Founder fix burst 2026-11-10. Hovers: FEELINGS and
MOODS became peel layers under the essentials (counts on the heads,
chips hidden until peeled; reaction groups peel again inside). The
marquee's selected bloom is half its former width. Seen/vote writes
stop flapping identity: api() falls back to the boot token,
identityAuth retries a failed bearer once and logs double failures,
toggleSeen surfaces a failed save on the button. Boot merges an
authoritative getUser() when the stored session carries no identity,
so the … menu shows the fan's name. Static shell sends no-cache.

## 1.00.36 — NOW PLAYING dead-end: the decided-pool ladder

BUILD V-01-00-36. The default game's pool is the top 250 by wins of
the past ten years; triage permanence removes a fan's decided films
from it. The Founder had decided ~all 250 → 404 'not enough movies in
range' rendered as the game's error, on every visit, while anonymous
probes dealt fine. All three matchup branches now climb a ladder:
normal pool → whole window (top10) → serve without the triage filter,
logged on the host. Marks are never altered; only the serve relaxes,
and only when the alternative is a dead game.

## 1.00.37 — Report Error loop

- **Error cards:** the 14 primary load-error renders (matchup, showcase ×2, search, top-500 groups, seen wall/year, attractions, spawned list, list detail, fan page, film page, tough pix, classic feature) now show an error card — the message, **[Report Error]**, **[Try again]** — instead of a bare red string. Form-field errors are unchanged.
- **The report:** one tap POSTs /api/feedback (type issue) with a structured diagnostic body: error text, page, context (e.g. `matchup mode=top10`), build stamp, signed-in yes/no, timestamp. No tokens, no typed content. Per-browser fingerprint throttle: the same page+context+error can be reported at most once per 24h; the card then reads *Reported ✓*.
- **Server:** /api/feedback now stores the `page` field (guarded ADD COLUMN, mirroring /api/chat).
- **Boot watchdog:** the page shell shows a Report Error banner if the app has not booted within 7 seconds (white-screen class) and posts the same diagnostic via raw fetch; a successful boot removes it.
- **The loop closes in MAIL:** the feedback watch files error reports as `waiting` rows addressed to the Mailman with `waiting_on = diagnosis`, fingerprint-deduped (page|error|build) with a running report_count — the local agents' pickup is the trigger.

## 1.00.38 — MFA wall removal + setSectionMeta

- **Server:** `requireAuth` no longer requires a verified MFA factor. The gate contradicted the Founder's locked model (MFA optional, TOTP a Settings-only opt-in, LOW FRICTION) and silently 403'd signed-in fans across 19 routes — showcase, friends feed and lists/mine are the three the Founder's console showed; dice, reviews, friends writes, feedback reads, tough/share and the CINE bin were behind the same wall. Token verification and first-touch profile provisioning are unchanged.
- **Client:** `setSectionMeta(title, desc)` defined (sets document.title + the meta description). The mood view's call has been throwing `ReferenceError: Can't find variable: setSectionMeta` as an unhandled rejection on every visit since the helper was lost in a past refactor.

## 1.00.39 — Founder five-point pass

- **Marquee:** posters half size (flex-basis 2.5%, 40 across), hover grow (scale 1.18 with shadow), and a Fisher-Yates shuffle of the launch-window pool on every load — 120 random posters across the 3 rows instead of the same top-60 slice.
- **NOW PLAYING:** `#matchup` width 75% → 52.5% (the posters come up inside by a further 30%); headline is now **Click the better Flick**.
- **Account …:** menu opens on hover and closes when the pointer leaves the account slot (click toggle kept for touch); the signed-in name slides out beside the button on hover/focus (`.acct-name-slide`); **profile picture** upload in Account Settings — square-cropped 128×128 JPEG stored as `avatar_url` in auth user_metadata, reflected on the header trigger in place.
