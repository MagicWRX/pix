# PIX.MOV Components — markup patterns

Annotated reference snippets drawn from the real Muse **pix-2** build
(`App.tsx`, `PixSection.tsx`, `PixPlayerKit.tsx`). Class names match
`theme.css` 1:1. These are **structure references**, not runnable app code —
state hooks, data fetching, and persistence are the consuming build's job.
Where a pattern depends on app structure, that dependency is stated.

Pair with: `tokens.css` (values), `theme.css` (styles), `settings.json`
(behavioral numbers).

---

## 1 · Header

Fixed black bar, 2px gold underline. The v2 header is a 3-column grid:
account slot · centered wordmark · spacer. The wordmark sits **outside any
box**; its separator dot is a light bulb (`.pixmov-bulb`). Chase bulbs run
along the bottom edge on both sides, generated per index with a
`--bulb-delay` staggered by 0.09s so the chase travels. The NOW PLAYING
button is centered on the gold rule, straddling the header's bottom edge.

```html
<header class="pix-app-header is-v2">
  <!-- left slot: account trigger ('…' glyph, or the user's profile
       picture with .account-trigger-avatar when one is set) -->
  <div class="pix-header-slot pix-header-slot-account">
    <button class="account-trigger" aria-label="Account menu">…</button>
  </div>

  <!-- center: wordmark + chase + NP button -->
  <div class="pix-header-logo-wrap">
    <button class="pix-header-logo-center" aria-label="PIX.MOV home">
      <span class="pix-header-chase pix-header-chase-left" aria-hidden="true">
        <!-- 12 bulbs; left side delays run ((i - 23) * .09)s -->
        <span style="--bulb-delay:-1.08s"></span> <!-- … ×12 -->
      </span>
      <a class="pixmov-wordmark" href="#home">
        <span>PIX</span><i class="pixmov-bulb" aria-hidden="true"></i><span>MOV</span>
      </a>
      <span class="pix-header-chase pix-header-chase-right" aria-hidden="true">
        <!-- 12 bulbs; right side delays run ((i - 11) * .09)s -->
        <span style="--bulb-delay:0s"></span> <!-- … ×12 -->
      </span>
      <span class="pix-header-now-playing-anchor">
        <span class="pix-header-now-playing-wrap">
          <span class="pix-header-now-playing" role="button">NOW PLAYING</span>
          <!-- FILM DNA readout rides under the button when present -->
          <span class="film-dna-mini">FILM DNA RECORDED 12.40%</span>
        </span>
      </span>
    </button>
  </div>

  <div class="pix-header-slot" aria-hidden="true"></div>
</header>
```

Notes from the source:
- When the game is open, the NP button gets `.is-open` (scales to 1.25) and
  each chase run gains a second 10-bulb run closer to the button.
- A legacy variant keeps the wordmark inside a gold badge box
  (`.pixmov-badge`); a per-user header-version toggle chooses between them.
  The package ships the v2 (outside-the-box) pattern as canonical.
- The FILM DNA percentage strip (`.header-tracker-recorded`) is a separate
  fixed element shown transiently after a recorded vote.

## 2 · Poster marquee

Three full-bleed rows under the hero. Each row's track holds **two copies**
of a set; every poster is `flex: 0 0 5%` (20 per pass) and the track
animates `translateX(0 → -50%)` for a seamless wrap. Rows alternate
direction; durations 48s / 56s / 118s (see `settings.json` → `marquee`,
including the 60-vs-100 pool note).

```html
<div class="pix-poster-marquee" aria-label="PIX.MOV poster marquee">
  <div class="pix-marquee-row">
    <div class="pix-marquee-track">
      <div class="pix-marquee-set">
        <button class="pix-marquee-poster" aria-label="Open {Title}">
          <img src="{poster}" alt="{Title} movie poster">
        </button>
        <!-- … 20 posters … -->
      </div>
      <div class="pix-marquee-set" aria-hidden="true"><!-- exact copy --></div>
    </div>
  </div>
  <!-- rows 2 and 3 identical in shape -->
</div>
```

Clicking a poster opens `.pix-marquee-feature` — a gold-bordered bloom
positioned **at the click point**, clamped inside the band, carrying the
poster, a white × dismiss, a green seen toggle, and (on hover) a title/year
overlay with a MY SCREENING link. Seen posters carry `.is-seen` (green edge).

## 3 · Channel row (landing)

Every landing row — built-in channels, genre rows, custom lists — shares
one header: number + title on the left, and the tag line carrying the note
plus the **right-aligned row tools** (drag grip, ↑, ↓, fold chevron). The
body is a full-bleed endless loop viewport.

```html
<section class="pix-home-section pix-loop-row" aria-labelledby="pix-row-horror-heading">
  <div class="pix-home-section-heading pix-home-row-heading">
    <div>
      <span>02</span>
      <h2 id="pix-row-horror-heading">Horror</h2>
    </div>
    <div class="pix-home-row-tagline">
      <p>Terror from the public-domain vault</p>
      <div class="pix-home-row-tools">
        <button class="pix-home-row-grip" aria-label="Drag to reorder the Horror row" title="Press and drag to reorder this row">⠿</button>
        <button class="pix-home-row-move" aria-label="Move the Horror row up">↑</button>
        <button class="pix-home-row-move" aria-label="Move the Horror row down">↓</button>
        <button class="pix-home-row-fold" aria-expanded="true" aria-label="Fold the Horror row">
          <span class="pix-home-fold-chevron">&gt;</span>
        </button>
      </div>
    </div>
  </div>

  <div class="pix-loop-viewport is-fullbleed" tabindex="0" aria-label="Horror channel">
    <div class="pix-loop-track">
      <!-- the set is rendered 3× by the loop engine; each set is padded
           to ≥8 posters by repeating real posters -->
      <div class="pix-loop-set">
        <article class="pix-foldout-card" data-hover-type="2">…poster card…</article>
        <!-- … -->
      </div>
      <!-- ×3 -->
    </div>
    <button class="pix-loop-nav pix-loop-nav-left" aria-label="Stream Horror channel left">‹</button>
    <button class="pix-loop-power" aria-label="Pause Horror channel">❚❚</button>
    <button class="pix-loop-nav pix-loop-nav-right is-live" aria-label="Stream Horror channel right">›</button>
  </div>
</section>
```

Behavior contract (engine is app code; parameters in `settings.json` →
`channels`): base glide 26 px/s; click ‹/› sets stream direction (lit gold);
press-and-hold races at 560 px/s; center button pauses/plays; controls fade
in on hover/focus only (rest at .55 opacity on touch). The drag grip only
*arms* dragging while pressed — header drag reorders the row; order and
folded state persist per user.

The FEATURES shelf uses the same section heading without the loop:
`.pix-feature-grid` with six `.pix-feature-card`s per row.

## 4 · NOW PLAYING overlay

A fixed overlay below the 62px header on a 78% black scrim. The frame is
60vw on desktop, 90% on phones (≤620px). The red banner is the
yellow-outline / black-border / red-fill treatment from the header button,
scaled up. Markup condensed from `PixSection.tsx`.

```html
<section class="pix-section pix-section-overlay" aria-label="PIX">
  <div class="pix-game-frame pix-game-frame-expanded">
    <div class="pix-now-playing-header">
      <div class="pix-now-playing-control">
        <button class="pix-now-playing-banner" aria-label="Now Playing game controls" aria-expanded="false">
          <h2>NOW PLAYING</h2>
          <small>EDIT FILTER</small>
        </button>
        <!-- .pix-now-playing-popover with year filter + game controls
             appears here while open -->
      </div>
      <span class="pix-play-arrow" aria-hidden="true"></span>
      <p class="pix-current-game-title">Current game: Movie vs Movie</p>
      <button class="pix-game-close-button" aria-label="Close Now Playing game"><span aria-hidden="true">×</span></button>
    </div>

    <div class="pix-matchup" aria-label="Choose between two films">
      <article class="pix-choice">
        <div class="pix-poster-stage" data-hover-type="1">
          <button class="pix-poster-button" aria-label="Choose {Title}; drag down if you haven't watched it">
            <img src="{poster}" alt="{Title} movie poster">
            <span class="pix-check" aria-hidden="true">✓</span>
          </button>
          <!-- interest fold: trigger hugs the OUTER top corner -->
          <div class="pix-interest-menu pix-interest-menu-left">
            <button class="pix-interest-trigger" aria-label="Show interest options for {Title}">x</button>
            <div class="pix-interest-controls">
              <button>WANT TO SEE</button>
              <button>MAYBE</button>
              <button>NO THANKS</button>
              <!-- + "Haven't seen it / not familiar" -->
            </div>
          </div>
          <!-- description: hidden until hover/focus/selection -->
          <div class="pix-movie-meta pix-movie-meta-overlay">
            <h2>{Title}</h2>
            <p>{year} · {genres}</p>
          </div>
        </div>
      </article>
      <!-- second .pix-choice mirrors the first; its interest menu is
           .pix-interest-menu-right -->
    </div>

    <!-- new pair + FAN TYPE + TOUGH PIX live under the matchup -->
    <div class="pix-tough-bar">
      <button class="pix-tough-button">TOUGH PIX</button>
      <p class="pix-tough-caption">Share PIX.MOV Challenge For Advice</p>
    </div>
  </div>
</section>
```

Hard rules wired to this markup (see `settings.json` → `nowPlaying`):
clicking a poster records the pick and deals a new pair; **any** triage
decision permanently removes that film from the user's rotation; a matchup
never renders unless both posters exist; poster drag-down = "haven't seen
it".

## 5 · Top 500 card (bonus pattern)

```html
<article class="pix-top500-card">
  <button class="pix-top500-poster" aria-label="Mark {Title} as seen">
    <img src="{poster}" alt="{Title} movie poster">
    <span class="pix-top500-rating">#00</span>
    <span class="pix-top500-seen-hint" aria-hidden="true">✓</span>
  </button>
  <div class="pix-top500-caption"><strong>{Title}</strong><span>{year}</span></div>
  <div class="pix-top500-options">
    <button class="pix-top500-options-trigger" aria-expanded="false">
      <span class="pix-top500-rank">#00</span>
      <span class="pix-top500-options-word">Options</span>
    </button>
    <div class="pix-top500-fold">
      <div class="pix-top500-fold-buttons">
        <button>Film page</button>
        <button>Review</button>
        <button>Discuss</button>
        <button>Remove from seen</button>
        <!-- verdict buttons + Move to List also live here -->
      </div>
    </div>
  </div>
</article>
```

The poster button's click **marks seen** — navigation lives only inside
the fold. Rank/options stay hidden until hover/focus (always visible on
touch). SIZER (`.pix-size-tool`) rides the shelf header; parameters in
`settings.json` → `sizer`.

## 6 · Billboard (player break card)

Rendered inside the player stage between segments. A booked ad takes this
slot when one exists; otherwise the quote card shows. The 38-quote set is
in `settings.json` → `billboard.quotes`.

```html
<div class="pix-billboard" role="status" aria-label="Billboard break">
  <span class="billboard-label">BILLBOARD</span>
  <span class="billboard-countdown" aria-hidden="true">5</span>
  <figure>
    <blockquote>“Frankly, my dear, I don't give a damn.”</blockquote>
    <figcaption>Rhett Butler · Gone with the Wind (1939)</figcaption>
  </figure>
  <p class="billboard-next">Next in 5 seconds</p>
</div>
```

Player controls ride the stage's top-right corner; each is capability-gated
and hides itself where unsupported:

```html
<div class="pix-player-controls">
  <button class="pix-player-control-btn" aria-label="Picture in picture">…svg…</button>
  <button class="pix-player-control-btn" aria-label="Pop out player">…svg…</button>
  <button class="pix-player-control-btn" aria-label="Full screen">…svg…</button>
</div>
```

## 7 · BISCUIT launcher (consent gate)

BISCUIT is the single consent gate. The launcher mounts once at app level;
it presents when the saved decision is `pending` (except on `#privacy` /
`#agreements`) and re-opens on the `pix:open-consent` event fired by the
footer / profile / legal "Cookie & Data Consent" links. Markup condensed
from `PixSection.tsx` (`BiscuitLauncher`).

```html
<div class="cookie-window" role="presentation">
  <section class="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
    <p class="cookie-kicker">BISCUIT · Cookie &amp; Data Consent</p>
    <h2 id="cookie-title">Play anonymously or save your choices</h2>
    <p>PIX.MOV works without an account…</p>

    <nav class="biscuit-links" aria-label="PIX.MOV legal pages">
      <a href="#privacy">Privacy Policy</a>
      <a href="#agreements">Consent Agreements</a>
    </nav>

    <div class="consent-options">
      <label class="consent-option">
        <span><strong>Essential</strong><span>Required for sign-in, security, and the player.</span></span>
        <input type="checkbox" checked disabled>
      </label>
      <label class="consent-option">
        <span><strong>Save my PIX data</strong><span>Your picks, seen films, lists, and FILM DNA.</span></span>
        <input type="checkbox" checked>
      </label>
      <label class="consent-option">
        <span><strong>Ad measurement</strong><span>Anonymous measurement of advertising performance.</span></span>
        <input type="checkbox">
      </label>
    </div>

    <div class="cookie-actions">
      <button class="secondary-button" type="button">Decline</button>
      <button class="primary-button" type="button">Accept</button>
    </div>
  </section>
</div>
```

Declining switches the profile to anonymous: choices are not recorded, no
FILM DNA accrues, no ad measurement — the game still plays. The consent
truth lives in three profile fields (`cookie_decision`, `personalization`,
`ad_measurement`); the profile's own toggles only refine an accepted
decision and otherwise route back here.

## 8 · What design files can't carry

These parts of the design are **behavior**, recorded in `settings.json` but
not implementable by CSS/markup alone — the consuming build must wire them:

- **Loop/marquee engines** — requestAnimationFrame wrap math, drag physics,
  hold-to-race, progressive image loading.
- **Triage permanence** — decided films never resurface; needs the data layer.
- **Verdict recording** — hover states are visual; the fold's buttons write
  to the user's profile.
- **BISCUIT gating** — recording actions must check the consent decision
  server-side; the launcher markup alone doesn't enforce anything.
- **Player capabilities** — PiP / Document-PiP / fullscreen detection and the
  iOS fallbacks; ad-slot booking that pre-empts the quote billboard.
- **Data-fed content** — genre row titles/notes, channel pools, and the
  Top 500 order come from the catalog service, not from this package.
- **Per-user persistence** — landing row order/folds, SIZER scales, fan
  type, and consent all persist per profile in the consuming app.
