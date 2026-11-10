/* PIX.MOV portable SPA — landing, Movie vs Movie, SHOWCASE, Dracula, auth+MFA. */
/* LAUNCH (Brian's order, 2026-11-04): CINE is removed from the visitor
   surface until it is stable. This one flag guards every CINE entry point
   in this bundle — the account-menu NAV entry, the header CINE button and
   the #/cine route. The CINE Lite implementation below and its /api/cine
   endpoints are preserved untouched; flip this to true to restore CINE
   exactly as it was. Mirrors CINE_ENABLED in v1/client/src/App.tsx. */
const CINE_ENABLED = false;

let sb = null, session = null;

/* Per-user film state (settings.json → posterRules / nowPlaying.triageRule). */
let seenSet = new Set();
let interestMap = {};
let reactionMap = {};
let moodMap = {}; // REACTION VOCAB per film: { imdb_id: [labels] }
let dnaStats = null;

/* Landing layout: row order + folded state persist per user (settings.json → channels.rowChrome.persistence). */
const LAYOUT_KEY = 'pix-landing-layout';
const CONSENT_KEY = 'pix-consent';
function readLayout() {
  try { return JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}') || {}; } catch { return {}; }
}
function saveLayout(l) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(l)); } catch { /* private mode */ }
}
function readConsent() {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); } catch { return null; }
}
function writeConsent(v) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify(v)); } catch { /* private mode */ }
  /* Server-side record (Belvedere handoff §3.1): append-only via
     /api/consent. Fire-and-forget — the endpoint is flag-gated and its
     store lands with the DB cutover; a disabled/unavailable envelope is
     an expected state, never a user-facing error. Local stays the
     client's own record of the decision. */
  try {
    api('/api/consent', { method: 'POST', body: JSON.stringify({
      essential: true,
      pix_save: !!v.personalization,
      ads: !!v.ad_measurement,
    }) }).catch(() => {});
  } catch { /* offline / private mode */ }
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* One title formatter, everywhere: the catalog stores some titles with the year
   already in them (classic films), so never append a second "(YYYY)". */
const titleYear = (title, year) => {
  const t = String(title || '').trim();
  if (!year) return t;
  return /\(\d{4}\)\s*$/.test(t) ? t : `${t} (${year})`;
};
const bareTitle = (title) => String(title || '').replace(/\s*\(\d{4}\)\s*$/, '').trim();
const errHtml = (e) => (e ? `<pre class="err">${esc(e)}</pre>` : '');

async function boot() {
  const cfg = await (await fetch('/api/config')).json();
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    document.getElementById('app').innerHTML =
      `<div class="login-wrap"><div class="card"><h2>Not configured</h2>
       <p class="muted">Set SUPABASE_URL and SUPABASE_ANON_KEY in .env and restart.</p></div></div>`;
    return;
  }
  sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const { data } = await sb.auth.getSession();
  session = data.session;
  await loadFilmState();
  mountConsentGate();
  mountChatWidget();
  /* First launch opens on the hook (Founder, 2026-11-06): PIX MIX is the
     hook of the site, so a first-time visitor lands in NOW PLAYING. The
     flag makes it once-only; a deep link is never hijacked. */
  try {
    if (!localStorage.getItem('pix_welcomed_v1')) {
      localStorage.setItem('pix_welcomed_v1', '1');
      if (!location.hash || location.hash === '#' || location.hash === '#/') location.hash = '#/play';
    }
  } catch (e) { /* private mode: land on the page as linked */ }
  route();
  window.addEventListener('hashchange', route);
  document.addEventListener('pix:open-consent', openConsentGate);
}

/* LAUNCH WINDOW (Founder, 2026-11-06): pix.mov loads only tantalizing PIX
   from the past 40 years — the marquee pool and the genre channel rows are
   filtered to it here, and the server enforces the same window on the game
   (decks / genres / matchup). Top-100 lists and the Top 500 page are
   deliberate destinations and stay all-time; the streaming shelves are the
   funnel's third step, what we have available to stream. */
const LAUNCH_YEAR_MIN = new Date().getFullYear() - 40;

/* Seen films + interest verdicts drive the green edges and the triage rule. */
async function loadFilmState() {
  const j = await api('/api/seen/mine');
  if (j && j.ok) {
    seenSet = new Set(j.seen || []);
    interestMap = j.interest || {};
  }
  const rx = await api('/api/reactions/mine');
  if (rx && rx.ok) reactionMap = rx.reactions || {};
  const md = await api('/api/moods/mine').catch(() => null);
  if (md && md.ok) moodMap = md.moods || {};
}


async function api(path, opts = {}) {
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  const r = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(window.PIX_BUILD ? { 'X-Pix-Build': window.PIX_BUILD } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(token ? {} : { 'X-Pix-Anon': anonId() }),
      ...(opts.headers || {}),
    },
  });
  const j = await r.json().catch(() => ({ ok: false, error: 'bad response' }));
  /* 401/403 means "this action needs a signed-in account" (e.g. MFA not
     enrolled). The anonymous identity is a real identity, so the gate only
     trips when the server says the account itself is unusable. */
  if (!r.ok && (r.status === 401 || r.status === 403) && String(j.error || '').toLowerCase().includes('mfa')) {
    location.hash = '#/auth';
  }
  return j;
}

/* Anonymous identity: a stable local id sent as X-Pix-Anon so a visitor's
 * first vote counts toward FILM DNA before any account exists. */
function anonId() {
  let id = null;
  try { id = localStorage.getItem('pix_anon_id'); } catch { /* private mode */ }
  if (!id || !/^anon_[0-9a-f-]{8,40}$/.test(id)) {
    const rnd = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
    id = 'anon_' + rnd;
    try { localStorage.setItem('pix_anon_id', id); } catch { /* ignore */ }
  }
  return id;
}

/* ---- build beacon + self-update (version refresh) ----
 * Every /api/* request carries X-Pix-Build: <sha12 of this bundle>,
 * stamped into the page as window.PIX_BUILD by scripts/stamp-assets.mjs.
 * The beacon is functional, cookieless and aggregate-only: it carries no
 * user id, no session id and no cross-site identifier, and it is NOT
 * gated by the consent gate. Poll /api/version every 5 minutes and on
 * visibilitychange -> visible; on a build mismatch show a non-blocking
 * toast — never a modal, never an auto-reload (especially mid-vote). */
const PIX_BUILD = window.PIX_BUILD || null;

if (PIX_BUILD && typeof window.fetch === 'function') {
  const pixOrigFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    try {
      const rawUrl = typeof input === 'string' ? input : (input && input.url) || '';
      const u = new URL(rawUrl, location.href);
      if (u.origin === location.origin && u.pathname.startsWith('/api/')) {
        if (typeof Request !== 'undefined' && input instanceof Request) {
          if (!input.headers.get('X-Pix-Build')) {
            const headers = new Headers(input.headers);
            headers.set('X-Pix-Build', PIX_BUILD);
            input = new Request(input, { headers });
          }
        } else {
          init = init || {};
          const headers = new Headers(init.headers || {});
          if (!headers.get('X-Pix-Build')) headers.set('X-Pix-Build', PIX_BUILD);
          init = { ...init, headers };
        }
      }
    } catch { /* the beacon must never break a request */ }
    return pixOrigFetch(input, init);
  };
}

function hideUpdateToast() {
  const t = document.getElementById('pix-update-toast');
  if (t) t.remove();
}

function showUpdateToast() {
  if (document.getElementById('pix-update-toast')) return;
  const el = document.createElement('div');
  el.id = 'pix-update-toast';
  el.textContent = 'New version available — reload';
  el.setAttribute('role', 'button');
  el.title = 'Reload to update';
  el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;'
    + 'background:#141414;color:#ffd94d;border:1px solid #ffd94d;border-radius:999px;'
    + 'padding:10px 18px;font:600 14px/1.2 system-ui,sans-serif;cursor:pointer;'
    + 'box-shadow:0 4px 24px rgba(0,0,0,.55)';
  el.addEventListener('click', () => location.reload());
  document.body.appendChild(el);
}

async function checkBuildVersion() {
  if (!PIX_BUILD) return;
  try {
    const r = await fetch('/api/version', { cache: 'no-store' });
    const j = await r.json();
    const remote = j && j.assetSha256 ? String(j.assetSha256).slice(0, 12) : null;
    if (!remote) return;
    if (remote !== PIX_BUILD) showUpdateToast(); else hideUpdateToast();
  } catch { /* offline or endpoint absent — stay silent, retry next poll */ }
}

setInterval(checkBuildVersion, 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkBuildVersion();
});

/* ---- pix-design shell (components.md §1: chased bulb wordmark, NP on the rule) */
const NAV = [
  ['#/', 'Home', 'home'],
  ['#/play', 'Now Playing', 'play'],
  ['#/top500', 'Top 500', 'top500'],
  ['#/seen', 'Seen', 'seen'],
  ['#/attractions', 'Attractions', 'attractions'],
  ['#/lists', 'Lists', 'lists'],
  ['#/friends', 'Friends', 'friends'],
  ['#/classics', 'Classics', 'classics'],
  ...(CINE_ENABLED ? [['#/cine', 'Cine', 'cine']] : []),
  ['#/showcase', 'Showcase', 'showcase'],
  ['#/settings', 'Account Settings', 'settings'],
  ['#/mood', 'In the Mood For', 'mood'],
];

/* 12 bulbs per side; delays per components.md §1 ((i-23)*.09s left, (i-11)*.09s right). */
function chaseBulbs(side, count = 12, offset = 0) {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const d = (side === 'left' ? i - 23 : i - 11) * 0.09 + offset;
    out += `<span style="--bulb-delay:${d.toFixed(2)}s"></span>`;
  }
  return out;
}

/* Who is signed in, derived from every carrier (1.00.33). The account
 * menu's who-line, the LOGIN hide, the Sign out gate and the Settings
 * identity lines all read session.user.email — but a browser-stored
 * session can carry a working access token while its user object lacks
 * the email field (Founder report 2026-11-09: the menu opens, he is
 * signed in everywhere it matters, yet no name renders at the top; the
 * server-side user record DOES carry his email — his feedback rows are
 * stamped with it from req.user.email). Fall back through the metadata
 * to the access token's own claims: the token is minted from the same
 * user record, so its email claim is the account's email. */
function whoEmail() {
  const u = session?.user || {};
  if (u.email) return u.email;
  if (u.user_metadata?.email) return u.user_metadata.email;
  try {
    const payload = (session?.access_token || '').split('.')[1];
    if (payload) {
      const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      if (claims.email) return String(claims.email);
    }
  } catch { /* no readable claims — signed-out presentation */ }
  return '';
}

function shell(inner, active) {
  const menu = NAV.map(([href, label, key]) =>
    `<button data-nav="${href}"${key === active ? ' aria-current="page"' : ''}>${label}</button>`).join('');
  const avatar = session?.user?.user_metadata?.avatar_url || session?.user?.user_metadata?.picture || '';
  const who = whoEmail();
  const dnaText = dnaStats ? `FILM DNA ${Number(dnaStats.pct || 0).toFixed(2)}%` : 'FILM DNA 0.00%';
  const gameOpen = active === 'play';
  return `
  <header class="pix-app-header is-v2${gameOpen ? ' is-game-open' : ''}">
    <a class="pixmov-wordmark" href="#/" aria-label="PIX.MOV home"><span>PIX</span><i class="pixmov-bulb" aria-hidden="true"></i><span>MOV</span></a>
    <span class="pix-header-chase pix-header-chase-left" aria-hidden="true">${chaseBulbs('left')}</span>
    <span class="pix-header-now-playing-anchor">
      <span class="pix-header-now-playing${gameOpen ? ' is-open' : ''}" role="button" tabindex="0" id="npBtn" aria-label="Open Now Playing" aria-expanded="${gameOpen}">NOW PLAYING</span>
    </span>
    <span class="pix-header-chase pix-header-chase-right" aria-hidden="true">${chaseBulbs('right')}</span>
    <div class="pix-header-slot pix-header-slot-actions">
      <span class="film-dna-mini" id="dnaMini">${esc(dnaText)}</span>
      ${CINE_ENABLED ? `<button class="pix-header-nav-btn" data-nav="#/cine"${active === 'cine' ? ' aria-current="page"' : ''}>CINE</button>` : ''}
      ${who ? '' : '<button class="pix-header-nav-btn" data-nav="#/auth">LOGIN</button>'}
      <div class="pix-header-search" id="hdrSearchWrap">
        <button class="pix-header-search-btn" id="hdrSearchBtn" type="button" aria-label="Search films" aria-expanded="false">⌕</button>
        <input class="pix-header-search-input" id="hdrSearchInput" type="search" placeholder="Search films or a mood…" aria-label="Search films" autocomplete="off" hidden>
        <div class="pix-header-search-results" id="hdrSearchResults" hidden></div>
      </div>
      <div class="pix-header-slot pix-header-slot-account">
        <button class="account-trigger" id="acctBtn" aria-label="Account menu" aria-expanded="false">${avatar ? `<img class="account-trigger-avatar" src="${esc(avatar)}" alt="">` : '…'}</button>
        <div class="acct-menu" id="acctMenu" hidden>
          ${who ? `<p class="acct-who">${esc(who)}</p>` : ''}
          ${menu}
          <div class="acct-sep"></div>
          ${who ? '<button id="logout">Sign out</button>' : '<button data-nav="#/auth">Sign in</button>'}
        </div>
      </div>
    </div>
  </header>
  <div class="pix-main" id="view">${inner}</div>
  <footer class="pix-site-footer">
    <button class="pix-feedback-button" id="fbBtn" type="button">Feedback</button>
    <button class="pix-consent-footer-button" id="consentBtn" type="button">Cookie &amp; Data Consent</button>
    <a href="#/privacy">Privacy Policy</a>
    <a href="#/agreements">Agreements</a>
    <a href="#/attractions">Attractions</a>
    <a href="#/showcase">Profile</a>
    <a href="#/top500">Catalog</a>
    <p class="pix-footer-note">PIX.MOV is a safe space: ratings, reviews and picks are for the love of film.
      Harassment or doxxing can be <a href="#/feedback">appealed here</a>.</p>
    <p class="pix-footer-note">© 2029 PIX.MOV — All rights reserved. · BUILD V-01-00-33</p>
  </footer>`;
}
function mount(active, inner) {
  const app = document.getElementById('app');
  app.innerHTML = shell(inner, active);
  app.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => (location.hash = b.dataset.nav)));
  const lo = document.getElementById('logout');
  if (lo) lo.onclick = async () => {
    /* Sign-out must always land locally (Founder report 2026-11-06: "Sign
       out does nothing"). The old handler awaited the server revoke BEFORE
       clearing anything — a revoke that rejects or hangs on a stale stored
       session stranded the local session, and when the visitor was already
       on '#/', assigning the hash changed nothing (no hashchange, no
       re-render), so the menu kept showing the old session. Clear local
       state first, revoke best-effort with a local-scope fallback, then
       force the re-render explicitly. */
    session = null; seenSet = new Set(); interestMap = {}; dnaStats = null; filmStateFor = null;
    try { await sb.auth.signOut(); } catch { try { await sb.auth.signOut({ scope: 'local' }); } catch { /* already out locally */ } }
    if (location.hash === '#/' || !location.hash) route(); else location.hash = '#/';
  };
  const acct = document.getElementById('acctBtn'), acctMenu = document.getElementById('acctMenu');
  if (acct && acctMenu) {
    acct.onclick = () => {
      const open = acctMenu.hidden;
      acctMenu.hidden = !open;
      acct.setAttribute('aria-expanded', String(open));
    };
  }
  const np = document.getElementById('npBtn');
  if (np) {
    np.onclick = () => (location.hash = '#/play');
    np.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); location.hash = '#/play'; } };
  }
  const fb = document.getElementById('fbBtn');
  if (fb) fb.onclick = () => (location.hash = '#/feedback');
  const consent = document.getElementById('consentBtn');
  if (consent) consent.onclick = () => document.dispatchEvent(new Event('pix:open-consent'));
  wireHeaderSearch();
  refreshDna();
}

/* Header search: magnifier expands, typing shows poster-backed hits, Enter
   opens the full results view at #/search/<q> (P0-2). */
function wireHeaderSearch() {
  const btn = document.getElementById('hdrSearchBtn');
  const input = document.getElementById('hdrSearchInput');
  const box = document.getElementById('hdrSearchResults');
  if (!btn || !input || !box) return;
  let timer = null, seq = 0;
  const close = () => {
    box.hidden = true; box.innerHTML = ''; input.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
  };
  const open = () => {
    input.hidden = false; btn.setAttribute('aria-expanded', 'true'); input.focus();
  };
  btn.onclick = () => (input.hidden ? open() : close());
  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(timer);
    if (q.length < 2) { box.hidden = true; box.innerHTML = ''; return; }
    timer = setTimeout(async () => {
      const mine = ++seq;
      const j = await api('/api/search?q=' + encodeURIComponent(q));
      if (mine !== seq || !j || !j.ok) return;
      const films = (j.films || []).slice(0, 8);
      box.innerHTML = films.length
        ? `<p class="pix-header-search-count">${j.total} result${j.total === 1 ? '' : 's'} · press Enter for all</p>` +
          films.map((f) => `<a class="pix-header-search-hit" href="#/film/${esc(f.imdb_id)}">
            <img src="${esc(f.poster_hint)}" alt="" loading="lazy">
            <span><strong>${esc(bareTitle(f.title))}</strong><small>${esc(f.release_year || '')}${f.genre ? ' · ' + esc(String(f.genre).split(',')[0]) : ''}</small></span></a>`).join('')
        : '<p class="pix-header-search-count">No films match that yet.</p>';
      box.hidden = false;
    }, 180);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q.length >= 2) { close(); location.hash = '#/search/' + encodeURIComponent(q); }
    } else if (e.key === 'Escape') { close(); }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#hdrSearchWrap')) close();
  });
}

/* FILM DNA X.XX% = films this identity has rated ÷ films on record
   (settings.json → header). Rendered for anonymous visitors too — 0.00% until
   a decision accrues, never an em dash. (The word RECORDED was dropped by
   Founder ruling in 1.00.10; the refresh kept re-writing it — the attested
   FAIL — until 1.00.27 aligned this string too.) */
async function refreshDna() {
  const el = document.getElementById('dnaMini');
  const band = document.getElementById('dnaBandPct');
  if (!el && !band) return;
  if (!dnaStats) {
    const j = await api('/api/dna');
    if (j && j.ok) dnaStats = j;
  }
  if (dnaStats) {
    const txt = `FILM DNA ${Number(dnaStats.pct || 0).toFixed(2)}%`;
    if (el) el.textContent = txt;
    if (band) band.textContent = txt;
  }
}

/* ---------------- BISCUIT · the single consent gate (components.md §7) ---------------- */
function consentRoot() {
  let r = document.getElementById('biscuitRoot');
  if (!r) { r = document.createElement('div'); r.id = 'biscuitRoot'; document.body.appendChild(r); }
  return r;
}
/* FEEDBACK — the floating quick-feedback box (1:1 Pass 6 as TALK TO PIX;
   renamed PIX GURU in 1.00.25; FEEDBACK from 1.00.30). Founder pattern
   ruling 2026-11-08: every property's chat is a quick feedback box — one
   short message, send, done; never a conversational agent. Messages post
   to /api/chat with the page they were sent from, land in the feedback
   store, and travel to MAIL for the Control Plane. The panel says plainly
   that PIX reads everything — it never pretends to be a live conversation.
   The root lives outside #app so the widget survives page navigation. */
function chatRoot() {
  let el = document.getElementById('chat-root');
  if (!el) { el = document.createElement('div'); el.id = 'chat-root'; document.body.appendChild(el); }
  return el;
}
function mountChatWidget() {
  const root = chatRoot();
  if (root.querySelector('.pix-chat-widget')) return;
  root.innerHTML = `
  <div class="pix-chat-widget">
    <section class="pix-chat-panel" id="chatPanel" hidden role="dialog" aria-label="Feedback">
      <header class="pix-chat-head"><strong>Feedback</strong><button type="button" id="chatClose" aria-label="Close feedback">×</button></header>
      <p class="pix-chat-note">Quick feedback — one message, straight to the PIX team. We read everything; this isn't a live chat, and if you're signed in, replies come by email.</p>
      <div class="pix-chat-thread" id="chatThread" aria-live="polite"></div>
      <div class="pix-chat-sentbox" id="chatSent" hidden>
        <p class="pix-chat-sent">Message sent — Thank you for sharing your thoughts!</p>
        <button class="pix-tough-button" id="chatAgain" type="button">Send another message?</button>
      </div>
      <form class="pix-chat-form" id="chatForm">
        <textarea id="chatInput" rows="2" maxlength="2000" placeholder="Say it like you'd say it to a friend…" aria-label="Your feedback for PIX"></textarea>
        <button class="primary-button" type="submit">Send feedback</button>
      </form>
      <p class="pix-chat-status" id="chatStatus" role="status"></p>
    </section>
    <button class="pix-chat-launcher" id="chatOpen" type="button" aria-expanded="false" aria-controls="chatPanel">Feedback</button>
  </div>`;
  const panel = root.querySelector('#chatPanel');
  const openBtn = root.querySelector('#chatOpen');
  const setOpen = (open) => {
    panel.hidden = !open;
    openBtn.setAttribute('aria-expanded', String(open));
    if (open) root.querySelector('#chatInput').focus();
  };
  openBtn.onclick = () => setOpen(panel.hidden);
  root.querySelector('#chatAgain').onclick = () => {
    root.querySelector('#chatSent').hidden = true;
    root.querySelector('#chatForm').hidden = false;
    root.querySelector('#chatInput').focus();
  };
  root.querySelector('#chatClose').onclick = () => setOpen(false);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });
  root.querySelector('#chatForm').onsubmit = async (e) => {
    e.preventDefault();
    const input = root.querySelector('#chatInput');
    const status = root.querySelector('#chatStatus');
    const text = input.value.trim();
    if (!text) return;
    const r = await api('/api/chat', { method: 'POST', body: JSON.stringify({ body: text, page: location.hash || '#/' }) }).catch(() => null);
    if (!r || !r.ok) {
      status.textContent = (r && r.error) || 'Could not send — check your connection and try again.';
      return;
    }
    input.value = '';
    /* Sent state (Founder, 2026-11-06): the panel says just this — no
       thread echo, no extra copy. */
    root.querySelector('#chatThread').innerHTML = '';
    root.querySelector('#chatForm').hidden = true;
    status.textContent = '';
    root.querySelector('#chatSent').hidden = false;
    PIX_ANALYTICS.send('feedback.submitted');
  };
}

/* ANALYTICS beacon (founder directive 2026-11-08, mail row 114; steward delta
   pending absorption into the next Builder crossing). Speaks the EXISTING
   Phase 3 scaffold: POST /api/events takes an array, each event carrying its
   own idempotency_key. Aggregate events are cookieless; no personal id sent. */
const PIX_ANALYTICS = (() => {
  let sid = null;
  try { sid = sessionStorage.getItem('pix_sid'); } catch (e) {}
  if (!sid) {
    sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    try { sessionStorage.setItem('pix_sid', sid); } catch (e) {}
  }
  function send(action, extra) {
    try {
      const at = new Date().toISOString();
      const page = location.hash || location.pathname || '/';
      const ev = {
        occurred_at: at, surface: 'web', action, subject_hash: null,
        props: Object.assign({ session_id: sid, page, property: 'pix.mov' }, extra || {}),
        idempotency_key: action + '|' + sid + '|' + page + '|' + at,
      };
      const headers = { 'Content-Type': 'application/json' };
      if (window.PIX_BUILD) headers['x-pix-build'] = String(window.PIX_BUILD);
      fetch('/api/events', { method: 'POST', headers, body: JSON.stringify([ev]), keepalive: true }).catch(() => {});
    } catch (e) {}
  }
  return { send };
})();
PIX_ANALYTICS.send('session.start');
PIX_ANALYTICS.send('page.view');
window.addEventListener('hashchange', () => PIX_ANALYTICS.send('page.view'));

function mountConsentGate() {
  const h = location.hash || '#/';
  const decided = readConsent();
  if (!decided && !h.startsWith('#/privacy') && !h.startsWith('#/agreements')) openConsentBar();
}
/* First visit = a dismissible BAR, never a blocking modal (Belvedere
   handoff §3.1 UX; 1:1 Pass 2, 2026-11-05): the page stays scrollable
   and usable underneath. Accept carries the panel's defaults
   (personalisation on, ad measurement off); Details opens the full
   panel for granular choice; the footer button still opens the panel
   directly as the settings surface. */
function openConsentBar() {
  const root = consentRoot();
  if (root.querySelector('.cookie-bar')) return;
  root.innerHTML = `
  <div class="cookie-bar" role="region" aria-label="Cookie and data consent">
    <p class="cookie-bar-text"><strong>BISCUIT · Cookie &amp; Data Consent</strong>
      PIX.MOV works without an account. Save your picks, seen films and lists — or decline and play anonymously.
      <a href="#/privacy">Privacy Policy</a> · <a href="#/agreements">Consent Agreements</a></p>
    <div class="cookie-bar-actions">
      <button class="secondary-button" type="button" id="cbDetails">Details</button>
      <button class="secondary-button" type="button" data-consent="decline">Decline</button>
      <button class="primary-button" type="button" data-consent="accept">Accept</button>
    </div>
  </div>`;
  root.querySelector('#cbDetails').onclick = () => openConsentGate();
  root.querySelectorAll('[data-consent]').forEach((b) => (b.onclick = () => {
    const accept = b.dataset.consent === 'accept';
    writeConsent({
      decision: accept ? 'accepted' : 'declined',
      personalization: accept,
      ad_measurement: false,
      at: new Date().toISOString(),
    });
    root.innerHTML = '';
  }));
}
function openConsentGate() {
  const saved = readConsent() || {};
  const root = consentRoot();
  root.innerHTML = `
  <div class="cookie-window" role="presentation">
    <section class="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-title">
      <p class="cookie-kicker">BISCUIT · Cookie &amp; Data Consent</p>
      <h2 id="cookie-title">Play anonymously or save your choices</h2>
      <p>PIX.MOV works without an account. Sign in to keep your picks, seen films and lists, and let FILM DNA learn your taste.</p>
      <nav class="biscuit-links" aria-label="PIX.MOV legal pages">
        <a href="#/privacy">Privacy Policy</a>
        <a href="#/agreements">Consent Agreements</a>
      </nav>
      <div class="consent-options">
        <label class="consent-option">
          <span><strong>Essential</strong><span>Required for sign-in, security, and the player.</span></span>
          <input type="checkbox" checked disabled>
        </label>
        <label class="consent-option">
          <span><strong>Save my PIX data</strong><span>Your picks, seen films, lists, and FILM DNA.</span></span>
          <input type="checkbox" id="cPersonal" ${saved.personalization === false ? '' : 'checked'}>
        </label>
        <label class="consent-option">
          <span><strong>Ad measurement</strong><span>Anonymous measurement of advertising performance.</span></span>
          <input type="checkbox" id="cAds" ${saved.ad_measurement ? 'checked' : ''}>
        </label>
      </div>
      <div class="cookie-actions">
        <button class="secondary-button" type="button" data-consent="decline">Decline</button>
        <button class="primary-button" type="button" data-consent="accept">Accept</button>
      </div>
    </section>
  </div>`;
  document.body.style.overflow = 'hidden';
  root.querySelectorAll('[data-consent]').forEach((b) => (b.onclick = () => {
    const accept = b.dataset.consent === 'accept';
    writeConsent({
      decision: accept ? 'accepted' : 'declined',
      personalization: accept ? !!root.querySelector('#cPersonal').checked : false,
      ad_measurement: accept ? !!root.querySelector('#cAds').checked : false,
      at: new Date().toISOString(),
    });
    root.innerHTML = '';
    document.body.style.overflow = '';
  }));
  root.querySelectorAll('a[href^="#/"]').forEach((a) => (a.onclick = () => {
    root.innerHTML = ''; document.body.style.overflow = '';
  }));
}
let filmStateFor = null;
async function refreshSession() {
  const { data } = await sb.auth.getSession();
  session = data.session;
  /* Sign-in / sign-out between routes must refresh the seen set + FILM DNA readout. */
  const uid = session?.user?.id || null;
  if (uid !== filmStateFor) {
    filmStateFor = uid;
    dnaStats = null;
    await loadFilmState();
    if (uid) refreshDna();
  }
}

async function route() {
  const h = location.hash || '#/';
  await refreshSession();
  if (!h.startsWith('#/film/')) {
    try { sessionStorage.setItem('pix-last-route', h); } catch { /* private mode */ }
  }
  if (h.startsWith('#/play')) return viewPlay();
  if (h.startsWith('#/top500')) return viewTop500();
  if (h.startsWith('#/seen/')) return viewSeenYear(h.split('#/seen/')[1].split('?')[0]);
  if (h.startsWith('#/seen')) return viewSeen();
  if (h.startsWith('#/attractions')) return viewAttractions();
  if (h.startsWith('#/lists/')) return viewListDetail(h.split('#/lists/')[1].split('?')[0]);
  if (h.startsWith('#/lists')) return viewLists();
  if (h.startsWith('#/fan/')) return viewFan(decodeURIComponent(h.split('#/fan/')[1].split('?')[0]));
  if (h.startsWith('#/film/')) return viewFilm(h.split('#/film/')[1].split('?')[0]);
  if (h.startsWith('#/tough/')) return viewTough(h.split('#/tough/')[1].split('?')[0]);
  if (h.startsWith('#/search/')) return viewSearch(decodeURIComponent(h.split('#/search/')[1].split('?')[0]));
  if (h.startsWith('#/privacy')) return viewPrivacy();
  if (h.startsWith('#/agreements')) return viewAgreements();
  if (h.startsWith('#/feedback')) return viewFeedback();
  if (h.startsWith('#/profile')) return viewShowcase();
  if (h.startsWith('#/screening/')) return viewFilm(h.split('#/screening/')[1].split('?')[0]);
  if (h.startsWith('#/feature/')) return viewFeature(h.split('#/feature/')[1].split('?')[0]);
  if (h.startsWith('#/feature')) return viewFeature();
  if (h.startsWith('#/dna')) return viewDna();
  if (h.startsWith('#/grossers')) return viewGrossers();
  if (h.startsWith('#/watchlist')) return viewWatchlist();
  if (h === '#/mood') return viewMood();
  if (h === '#/friends') return viewFriends();
  if (h.startsWith('#/sort')) return viewSort();
  if (h.startsWith('#/dream-log')) return viewStory('dream-log');
  if (h.startsWith('#/poster')) return viewStory('poster');
  if (h.startsWith('#/monsters')) return viewStory('monsters');
  if (h.startsWith('#/notes')) return viewStory('notes');
  if (h.startsWith('#/publish')) return viewStory('publish');
  if (h.startsWith('#/cine')) return CINE_ENABLED ? viewCine() : viewLanding();
  if (h.startsWith('#/classics/')) return viewClassic(h.split('#/classics/')[1].split('?')[0]);
  if (h.startsWith('#/classics')) return viewClassics();
  if (h.startsWith('#/showcase')) return viewShowcase();
  if (h.startsWith('#/dracula')) return viewDracula();
  if (h.startsWith('#/auth')) return viewAuth();
  if (h.startsWith('#/settings')) return viewSettings();
  return viewLanding();
}

/* ---------------- landing ---------------- */
/* ---------------- designed landing (components.md §2/§3) ---------------- */
const posterUrl = (f) => `/api/poster?imdb=${encodeURIComponent(f.imdb_id)}&key=${encodeURIComponent(f.poster_key || '')}`;

/* Feature shelves show POSTERS (the artifact's PixFeaturesShelf): a
   classic whose poster resolves through the catalogue gets its poster;
   one that doesn't gets the artifact's missing-poster plate — never a
   screen grab (Founder fix, 2026-11-05). */
function featureCardMedia(c) {
  if (c.poster_key) return stagedPoster(`/api/poster?imdb=${encodeURIComponent(c.poster_imdb || '')}&key=${encodeURIComponent(c.poster_key)}`, c.title);
  return `<span class="pix-feature-poster-missing" aria-hidden="true"><b>${esc(c.release_year || '')}</b><small>FEATURE PRESENTATION</small></span>`;
}
/* Staged poster loading (Founder, 2026-11-05): a gradient paints first,
   then the smallest poster, then the full poster crossfades over it.
   smallPoster() derives the small variant — the /api/poster size=sm
   rewrite server-side, the same ._V1_ rewrite for direct IMDb URLs;
   local poster files serve as their own small variant. */
function smallPoster(src) {
  if (!src) return src;
  if (src.includes('/api/poster')) return `${src}&size=sm`;
  if (src.includes('._V1_')) return src.replace(/\._V1_.*?(\.(?:jpg|png))/i, '._V1_UX160_CR0,0,160,240_AL_$1');
  return src;
}
function stagedPoster(src, title) {
  return `<span class="pix-poster-load">
    <img class="pp-sm" src="${esc(smallPoster(src))}" alt="" aria-hidden="true" decoding="async" onload="this.classList.add('is-in')">
    <img class="pp-full" data-full="${esc(src)}" alt="${esc(title)} movie poster" decoding="async">
  </span>`;
}
function upgradePosters(root) {
  (root || document).querySelectorAll('img.pp-full[data-full]').forEach((img) => {
    if (img.dataset.upgraded) return;
    img.dataset.upgraded = '1';
    const pre = new Image();
    pre.onload = () => {
      img.src = img.dataset.full;
      img.classList.add('is-in');
      const sm = img.parentElement ? img.parentElement.querySelector('.pp-sm') : null;
      if (sm) setTimeout(() => sm.remove(), 400);
    };
    pre.onerror = () => {
      const sm = img.parentElement ? img.parentElement.querySelector('.pp-sm') : null;
      if (sm) { sm.alt = img.alt; sm.removeAttribute('aria-hidden'); sm.classList.add('is-in'); }
      img.remove();
    };
    pre.src = img.dataset.full;
  });
}


/* H-3.5's fade (app-glue.css) parks poster imgs at opacity:0 until load;
   the marquee template missed the onload that completes it — every other
   poster template in this file carries it (1:1 Pass 2 fix, 2026-11-05:
   the live marquee rendered as a black band, 0/60 posters visible). */
function marqueePoster(f, eager) {
  const src = posterUrl(f);
  const sm = smallPoster(src);
  /* Staged at tile scale: the gradient (the stage's background) paints
     first, then the smallest poster fades in over it. The full poster
     loads when the tile is clicked into the huge feature view. */
  const img = eager
    ? `<img class="pp-sm" src="${esc(sm)}" alt="${esc(f.title)} movie poster" decoding="async" onload="this.classList.add('is-in')">`
    : `<img class="pp-sm" data-src="${esc(sm)}" alt="${esc(f.title)} movie poster" loading="lazy" decoding="async" onload="this.classList.add('is-in')">`;
  return `<button class="pix-marquee-poster${seenSet.has(f.imdb_id) ? ' is-seen' : ''}"
      data-mq-id="${esc(f.imdb_id)}" data-mq-title="${esc(f.title)}" data-mq-year="${esc(f.release_year || '')}" data-mq-poster="${esc(src)}"
      aria-label="Open ${esc(f.title)}"><span class="pix-poster-load">${img}</span></button>`;
}

function marqueeRow(films) {
  /* firstBatch 12 render eagerly, the remaining 8 stream in after 200ms (settings.json → marquee.progressiveLoad) */
  const set = films.map((f, i) => marqueePoster(f, i < 12)).join('');
  return `<div class="pix-marquee-row"><div class="pix-marquee-track">
      <div class="pix-marquee-set">${set}</div>
      <div class="pix-marquee-set" aria-hidden="true">${set}</div></div></div>`;
}

/* Clicking a poster blooms .pix-marquee-feature AT the click point, clamped
   inside the band (settings.json → marquee.clickBehavior). */
function closeMarqueeFeature() {
  document.querySelectorAll('.pix-marquee-feature').forEach((el) => el.remove());
}
function openMarqueeFeature(band, btn, ev) {
  closeMarqueeFeature();
  const id = btn.dataset.mqId, title = btn.dataset.mqTitle, year = btn.dataset.mqYear;
  const seen = seenSet.has(id);
  const el = document.createElement('div');
  el.className = 'pix-marquee-feature is-huge';
  el.dataset.mqId = id;
  el.innerHTML = `
    <button class="pix-marquee-feature-close" aria-label="Dismiss">×</button>
    <button class="pix-marquee-feature-seen${seen ? ' is-seen' : ''}" aria-pressed="${seen}">${seen ? 'SEEN' : 'MARK SEEN'}</button>
    ${stagedPoster(btn.dataset.mqPoster, title)}
    <div class="pix-movie-meta pix-movie-meta-overlay">
      <h2>${esc(title)}</h2><p>${esc(year)}</p>
      <a href="#/film/${esc(id)}">MY SCREENING</a>
    </div>`;
  document.body.appendChild(el);
  /* Huge view (Founder, 2026-11-05): the poster opens big, anchored at
     the click point and clamped to the VIEWPORT — the marquee band is
     far too short to hold it. */
  const w = el.offsetWidth, h = el.offsetHeight;
  const px = (ev.clientX || innerWidth / 2) - w / 2;
  const py = (ev.clientY || innerHeight / 2) - h / 2;
  el.style.left = Math.max(8, Math.min(innerWidth - w - 8, px)) + 'px';
  /* Never slide under the fixed header (1.00.28): the top clamp used to be
     8px, which buried the panel's top — and its close button — behind the
     header bar (Founder report, 2026-11-07). */
  const headerH = (document.querySelector('.pix-app-header')?.offsetHeight || 62) + 8;
  el.style.top = Math.max(headerH, Math.min(innerHeight - h - 8, py)) + 'px';
  /* Move off the enlarged poster and it goes away (Founder, 2026-11-07);
     a tap or click anywhere outside dismisses it too. */
  el.addEventListener('mouseleave', () => el.remove());
  const outside = (e2) => {
    if (!el.contains(e2.target)) { el.remove(); document.removeEventListener('pointerdown', outside, true); }
  };
  document.addEventListener('pointerdown', outside, true);
  upgradePosters(el);
  paintMarks(el);
    el.querySelector('.pix-marquee-feature-close').onclick = (e) => { e.stopPropagation(); el.remove(); };
  el.querySelector('.pix-marquee-feature-seen').onclick = async (e) => {
    e.stopPropagation();
    if (!session) { location.hash = '#/auth'; return; }
    const sb = el.querySelector('.pix-marquee-feature-seen');
    const next = !seenSet.has(id);
    const j = await api('/api/seen', { method: 'POST', body: JSON.stringify({ imdb_id: id, seen: next }) });
    if (!j.ok) {
      /* Never fail silently (Founder, 2026-11-08: "I click SEEN and it
         does nothing") — say so on the button and let him tap again. */
      sb.textContent = 'COULD NOT SAVE — TAP TO RETRY';
      setTimeout(() => { sb.textContent = seenSet.has(id) ? 'SEEN' : 'MARK SEEN'; }, 1800);
      return;
    }
    if (next) seenSet.add(id); else seenSet.delete(id);
    /* Green border on the marquee poster, then the poster leaves the
       marquee — a seen film is filed in the fan's Profile (their seen
       list), not left scrolling (Founder spec, 2026-11-08). */
    document.querySelectorAll(`.pix-marquee-poster[data-mq-id="${id}"]`).forEach((b) => b.classList.toggle('is-seen', next));
    paintMarks(document);
    sb.classList.toggle('is-seen', next);
    sb.textContent = next ? 'SEEN' : 'MARK SEEN';
    sb.setAttribute('aria-pressed', String(next));
    if (next) {
      setTimeout(() => {
        document.querySelectorAll(`.pix-marquee-poster[data-mq-id="${id}"]`).forEach((b) => b.remove());
        el.remove();
      }, 900);
    }
  };
  el.querySelector('a[href^="#/"]').onclick = () => el.remove();
}

function featureCard(f) {
  return `<button class="pix-feature-card" data-nav="#/film/${esc(f.imdb_id)}" aria-label="Open ${esc(f.title)}">
      <img src="${posterUrl(f)}" alt="${esc(f.title)} movie poster" loading="lazy" decoding="async">
      <span class="pix-feature-overlay"><strong>${esc(f.title)}</strong><span>${esc(f.release_year || '')}</span></span></button>`;
}

/* ---------------- REACTION VOCAB (Founder dictation 2026-11-06) ----------------
   The feelings VOCAB of the hover fold: verdict-anchored label groups a fan
   records per film, feeding FILM DNA. Registered in lat.vocabulary; the
   server validates against the same set — no free text, ever. The HORROR
   group is a genre lens: it renders only on horror films. SEEN / NOT SEEN
   is the fold's standing toggle, above these groups. */
const REACTION_GROUPS = [
  { key: 'hated', label: 'HATED IT', labels: ['Boring', 'Stupid', 'Bad acting'] },
  { key: 'rewatch', label: 'REWATCH', labels: ['Rewatch all the time', 'Want to see again', 'Once was good enough'] },
  { key: 'loved', label: 'LOVED IT', labels: ['One of my favorites', 'Fun', 'Great Action', 'Very Romantic'] },
  { key: 'horror', label: 'HORROR', labels: ['Super Scary', 'Gory', 'Great Villain'], horrorOnly: true },
];
const isHorrorFilm = (f) => String(f?.genre || '').toLowerCase().includes('horror');
function reactionFoldHtml(f) {
  if (!f || !f.imdb_id) return '';
  const mine = reactionMap[f.imdb_id] || [];
  return `<div class="pix-rx">${REACTION_GROUPS.filter((g) => !g.horrorOnly || isHorrorFilm(f)).map((g) => {
    const n = mine.filter((x) => g.labels.includes(x)).length;
    return `<div class="pix-rx-group">
      <button type="button" class="pix-rx-head" data-rx-group="${g.key}" aria-expanded="false">${g.label}${n ? ` · ${n}` : ''}</button>
      <div class="pix-rx-labels" hidden>${g.labels.map((l) => `<button type="button" class="pix-rx-chip${mine.includes(l) ? ' is-on' : ''}" data-rx-label="${esc(l)}">${esc(l)}</button>`).join('')}</div>
    </div>`;
  }).join('')}</div>`;
}
function bindReactions(root) {
  if (!root) return;
  root.querySelectorAll('[data-rx-group]').forEach((h) => (h.onclick = (e) => {
    e.stopPropagation();
    const labels = h.parentElement.querySelector('.pix-rx-labels');
    if (!labels) return;
    const open = labels.hidden;
    labels.hidden = !open;
    h.setAttribute('aria-expanded', String(open));
  }));
  root.querySelectorAll('[data-rx-label]').forEach((chip) => (chip.onclick = async (e) => {
    e.stopPropagation();
    const card = chip.closest('[data-film], [data-card]');
    const id = card?.dataset.film || card?.dataset.card;
    if (!id) return;
    if (!session) { location.hash = '#/auth'; return; }
    const label = chip.dataset.rxLabel;
    const mine = reactionMap[id] || (reactionMap[id] = []);
    const on = !mine.includes(label);
    const r = await api('/api/reactions', { method: 'POST', body: JSON.stringify({ imdb_id: id, label, on }) });
    if (!r.ok) return;
    if (on) mine.push(label); else reactionMap[id] = mine.filter((x) => x !== label);
    chip.classList.toggle('is-on', on);
    const head = chip.closest('.pix-rx-group')?.querySelector('[data-rx-group]');
    if (head) {
      const g = REACTION_GROUPS.find((x) => x.key === head.dataset.rxGroup);
      const n = (reactionMap[id] || []).filter((x) => g.labels.includes(x)).length;
      head.textContent = g.label + (n ? ` · ${n}` : '');
      /* REWATCH is a single-pick axis: turning one label on turns the
         group's other labels off, here and on the server. */
      if (on && g.key === 'rewatch') {
        for (const other of g.labels) {
          if (other === label || !(reactionMap[id] || []).includes(other)) continue;
          const r2 = await api('/api/reactions', { method: 'POST', body: JSON.stringify({ imdb_id: id, label: other, on: false }) });
          if (!r2.ok) continue;
          reactionMap[id] = reactionMap[id].filter((x) => x !== other);
          chip.closest('.pix-rx-group')?.querySelectorAll('.pix-rx-chip').forEach((c) => {
            if (c.dataset.rxLabel === other) c.classList.remove('is-on');
          });
        }
        const n2 = (reactionMap[id] || []).filter((x) => g.labels.includes(x)).length;
        head.textContent = g.label + (n2 ? ` · ${n2}` : '');
      }
    }
    paintMarks(document);
  }));
}
/* Fold controls for views that inject cards after mount() (the Attractions
   wiring of 1.00.13, factored): nav, the seen toggle with its poster state,
   and the REACTION VOCAB. */
/* ---------------- MARKS (Founder, 2026-11-07) ----------------
   A film's marks paint its border in EVERY instance on the site, for
   this user — the locked poster semantics: SEEN green · WANT gold ·
   MAYBE orange · NO THANKS dimmed. FAVORITE (a HOVERS state) wears a
   gold star chip. One painter; every surface calls it after render,
   and every state change repaints so all instances agree. */
const HATED_MARK_LABELS = ['Boring', 'Stupid', 'Bad acting'];
function markOf(id) {
  if (!id) return null;
  /* Founder COLOUR LAW (2026-11-07, visual of record state-colors.png):
     HATED IT red · SEEN green · WANT TO SEE orange · NOT SEEN gray.
     Hated outranks seen (you only hate what you have seen); gray is
     the resting state for a signed-in fan's untouched films. */
  if ((reactionMap[id] || []).some((l) => HATED_MARK_LABELS.includes(l))) return 'hated';
  if (seenSet.has(id)) return 'seen';
  const iv = interestMap[id];
  if (iv === 'want_to_see') return 'want';
  if (iv === 'maybe') return 'maybe';
  if (iv === 'not_interested') return 'no';
  return session ? 'notseen' : null;
}
const isFav = (id) => (reactionMap[id] || []).includes('Favorite');
function paintMarks(root) {
  const scope = root || document;
  const els = [];
  if (scope.matches?.('[data-film], [data-card], [data-mq-id]')) els.push(scope);
  scope.querySelectorAll?.('[data-film], [data-card], [data-mq-id]').forEach((el) => els.push(el));
  els.forEach((el) => {
    const id = el.dataset.film || el.dataset.card || el.dataset.mqId;
    const m = markOf(id);
    el.classList.toggle('mk-hated', m === 'hated');
    el.classList.toggle('mk-seen', m === 'seen');
    el.classList.toggle('mk-want', m === 'want');
    el.classList.toggle('mk-maybe', m === 'maybe');
    el.classList.toggle('mk-no', m === 'no');
    el.classList.toggle('mk-notseen', m === 'notseen');
    let chip = [...el.children].find((c) => c.classList?.contains('pix-fav-chip'));
    if (isFav(id)) {
      if (!chip) {
        chip = document.createElement('span');
        chip.className = 'pix-fav-chip';
        chip.textContent = '★';
        chip.title = 'Favorite';
        el.appendChild(chip);
      }
    } else if (chip) chip.remove();
  });
}
async function toggleFavorite(id, btn) {
  if (!id) return;
  if (!session) { location.hash = '#/auth'; return; }
  const on = !isFav(id);
  const r = await api('/api/reactions', { method: 'POST', body: JSON.stringify({ imdb_id: id, label: 'Favorite', on }) });
  if (!r.ok) return;
  const mine = reactionMap[id] || (reactionMap[id] = []);
  if (on) mine.push('Favorite'); else reactionMap[id] = mine.filter((x) => x !== 'Favorite');
  if (btn) { btn.classList.toggle('is-on', on); btn.setAttribute('aria-pressed', String(on)); }
  paintMarks(document);
}
function bindFavorites(root) {
  if (!root) return;
  root.querySelectorAll('[data-fav-toggle]').forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    toggleFavorite(b.dataset.favToggle, b);
  }));
}

/* ---------------- HOVERS: ADD TO A GROUP (1.00.17) ----------------
   The fold's grouping utility: a dropdown, never a form. The fan's own
   groups + PIX-suggested groups (computed from the film itself, so
   nobody has to invent a name) + "New group…" — the only typing in the
   kit, one short name. Filing rides the lists machinery that already
   exists (POST /api/lists, POST /api/lists/:id/items). */
let myListsCache = null;
async function loadMyLists() {
  if (!session) return [];
  if (myListsCache) return myListsCache;
  const ml = await api('/api/lists/mine').catch(() => null);
  myListsCache = ml && ml.ok ? (ml.lists || []) : [];
  return myListsCache;
}
function groupSuggestions(f) {
  const out = [];
  const g = String(f?.genre || '').split(',')[0].trim();
  const y = Number(f?.release_year) || 0;
  if (g && y) out.push(`${Math.floor(y / 10) * 10}s ${g}`);
  if (g) out.push(g);
  if (!out.length && y) out.push(`${Math.floor(y / 10) * 10}s Films`);
  return [...new Set(out)];
}
function groupRowHtml(f) {
  if (!f || !f.imdb_id) return '';
  return `<div class="pix-group-row">
      <select data-group-list aria-label="Add to a group">
        <option value="">Add to a group…</option>
        ${groupSuggestions(f).map((n) => `<option value="suggest:${esc(n)}">✦ ${esc(n)} (new group)</option>`).join('')}
        <option value="__new">＋ New group…</option>
      </select>
      <button type="button" data-group-go>File</button>
      <span class="pix-group-new" hidden><input data-group-name type="text" maxlength="60" placeholder="Group name" aria-label="New group name"><button type="button" data-group-create>✓</button></span>
    </div>`;
}
async function createListNamed(name) {
  const r = await api('/api/lists', { method: 'POST', body: JSON.stringify({ name }) });
  if (!r.ok) return null;
  const list = { id: r.id, name };
  myListsCache = [...(myListsCache || []), list];
  return list;
}
/* File a film into a group chosen in a dropdown. value: a list id,
   "suggest:<name>" (create with the suggested name), or "__new"
   (create with newName). Returns the group's name, or null. */
async function fileToGroup(imdbId, value, newName) {
  let listId = value, name = null;
  if (value === '__new' || value.startsWith('suggest:')) {
    const l = await createListNamed(value === '__new' ? newName : value.slice(8));
    if (!l) return null;
    listId = l.id; name = l.name;
  } else {
    name = (myListsCache || []).find((l) => String(l.id) === String(value))?.name || 'your group';
  }
  const r = await api('/api/lists/' + listId + '/items', { method: 'POST', body: JSON.stringify({ imdb_id: imdbId }) });
  return r.ok ? name : null;
}
function bindGroups(root) {
  if (!root) return;
  if (session) loadMyLists().then((lists) => {
    root.querySelectorAll('[data-group-list]').forEach((sel) => {
      if (sel.dataset.filled) return;
      sel.dataset.filled = '1';
      const first = sel.querySelector('option[value^="suggest:"]') || sel.querySelector('option[value="__new"]');
      lists.forEach((l) => {
        const o = document.createElement('option');
        o.value = String(l.id); o.textContent = l.name;
        sel.insertBefore(o, first);
      });
    });
  });
  root.querySelectorAll('[data-group-go]').forEach((b) => (b.onclick = async (e) => {
    e.stopPropagation();
    const card = b.closest('[data-film], [data-card]');
    const id = card?.dataset.film || card?.dataset.card;
    if (!id) return;
    if (!session) { location.hash = '#/auth'; return; }
    const row = b.closest('.pix-group-row');
    const sel = row.querySelector('[data-group-list]');
    if (!sel.value) { b.textContent = 'Pick a group'; return; }
    if (sel.value === '__new') {
      row.querySelector('.pix-group-new').hidden = false;
      row.querySelector('[data-group-name]').focus();
      return;
    }
    b.textContent = '…';
    const name = await fileToGroup(id, sel.value);
    b.textContent = name ? `✓ Filed to ${name}` : 'Failed — try again';
  }));
  root.querySelectorAll('[data-group-create]').forEach((b) => (b.onclick = async (e) => {
    e.stopPropagation();
    const card = b.closest('[data-film], [data-card]');
    const id = card?.dataset.film || card?.dataset.card;
    if (!id) return;
    const row = b.closest('.pix-group-row');
    const name = row.querySelector('[data-group-name]').value.trim();
    if (!name) return;
    const filed = await fileToGroup(id, '__new', name);
    const go = row.querySelector('[data-group-go]');
    if (go) go.textContent = filed ? `✓ Filed to ${filed}` : 'Failed — try again';
    if (filed) row.querySelector('.pix-group-new').hidden = true;
  }));
}

/* ---------------- PIX STATS band (1.00.19) ----------------
   What fans marked, in counts, on film and list pages. A segment
   renders only when its count is real; a film nobody has marked yet
   says so plainly. */
function statsBandHtml(st, films) {
  if (!st) return '';
  const seg = [];
  if (st.seen) seg.push(`${st.seen} seen`);
  if (st.want) seg.push(`${st.want} want to see`);
  if (st.maybe) seg.push(`${st.maybe} maybe`);
  if (st.no) seg.push(`${st.no} no thanks`);
  if (st.favorites) seg.push(`★ ${st.favorites} favorite${st.favorites === 1 ? '' : 's'}`);
  if (st.loved) seg.push(`Loved ${st.loved}`);
  if (st.hated) seg.push(`Hated ${st.hated}`);
  const rw = st.rewatch || {};
  if (rw.all) seg.push(`Rewatch all the time ${rw.all}`);
  if (rw.again) seg.push(`Want to see again ${rw.again}`);
  if (rw.once) seg.push(`Once was good enough ${rw.once}`);
  if (st.moods && st.moods.length) seg.push('Top moods: ' + st.moods.map((m) => `${m.mood} ${m.n}`).join(' · '));
  const head = films ? `PIX STATS — ${films} film${films === 1 ? '' : 's'}, fan marks` : 'PIX STATS — what fans marked';
  return `<div class="pix-stats-band"><div class="pix-stats-head">${head}</div><div class="pix-stats-segs">${seg.length ? seg.join(' · ') : 'No fan marks yet — yours will be the first.'}</div></div>`;
}

/* ---------------- HOVERS: IN THE MOOD FOR… (1.00.18) ----------------
   The mood filing block: the curated MOOD set locked 2026-10-19 (PIX
   Topology v1.0.6) as chips in every fold — a film can fit several
   moods, so the chips are multi-pick. Filings are per-fan (moodMap,
   /api/moods) and feed FILM DNA + the film-page fingerprint. */
const MOODS = ['Feel-good', 'Dark', 'Thrilling', 'Romantic', 'Nostalgic', 'Mind-bending',
  'Cozy', 'Intense', 'Funny', 'Sad', 'Epic', 'Chill', 'Scary', 'Inspiring', 'Weird', 'Heartwarming'];
function moodFoldHtml(f) {
  if (!f || !f.imdb_id) return '';
  const mine = moodMap[f.imdb_id] || [];
  return `<div class="pix-rx pix-mood">
      <div class="pix-rx-head">IN THE MOOD FOR…${mine.length ? ` <span class="pix-rx-count">${mine.length} filed</span>` : ''}</div>
      <div class="pix-rx-chips">${MOODS.map((mo) => `<button type="button" class="pix-rx-chip${mine.includes(mo) ? ' is-on' : ''}" data-mood-toggle="${esc(f.imdb_id)}" data-mood="${esc(mo)}" aria-pressed="${mine.includes(mo)}">${esc(mo)}</button>`).join('')}</div>
    </div>`;
}
function bindMoods(root) {
  if (!root) return;
  root.querySelectorAll('[data-mood-toggle]').forEach((b) => (b.onclick = async (e) => {
    e.stopPropagation();
    const id = b.dataset.moodToggle, mood = b.dataset.mood;
    if (!session) { location.hash = '#/auth'; return; }
    const on = !b.classList.contains('is-on');
    const r = await api('/api/moods', { method: 'POST', body: JSON.stringify({ imdb_id: id, mood, on }) });
    if (!r.ok) return;
    moodMap[id] = r.moods || [];
    document.querySelectorAll(`[data-mood-toggle="${CSS.escape(id)}"][data-mood="${CSS.escape(mood)}"]`).forEach((c) => {
      const now = moodMap[id].includes(mood);
      c.classList.toggle('is-on', now); c.setAttribute('aria-pressed', String(now));
    });
  }));
}

function bindCardFold(box) {
  if (!box) return;
  box.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => (location.hash = b.dataset.nav)));
  box.querySelectorAll('[data-seen-toggle]').forEach((b) => (b.onclick = async (e) => {
    e.stopPropagation();
    await toggleSeen(b.dataset.seenToggle, b.closest('.pix-foldout-card'));
    const card = b.closest('.pix-foldout-card');
    const on = seenSet.has(b.dataset.seenToggle);
    card?.classList.toggle('pix-seen-poster', on);
    card?.querySelector('.pix-marquee-poster')?.classList.toggle('is-seen', on);
  }));
  bindReactions(box);
  bindFavorites(box);
  bindGroups(box);
  bindMoods(box);
  paintMarks(box);
}

function loopCard(f) {
  /* H-3.1: Horror classics have film_key instead of imdb_id */
  if (f && f.film_key && !f.imdb_id) {
    /* A streamable classic: the fold carries Watch first, then — when the
       film is matched to the catalogue — the standard hover kit keyed to
       its catalogue twin (Founder hover rule, 2026-11-08: any poster
       hovered displays the hover; no bare posters). */
    const pf = f.poster_imdb ? { ...f, imdb_id: f.poster_imdb } : null;
    const seenPf = pf ? seenSet.has(pf.imdb_id) : false;
    return `<article class="pix-foldout-card" data-hover-type="2"${pf ? ` data-film="${esc(pf.imdb_id)}"` : ''}>
      <button class="pix-marquee-poster" style="width:100%;display:block" data-nav="#/classics/${esc(f.film_key)}" aria-label="Watch ${esc(f.title)}">
        <img src="${esc(f.poster || '')}" alt="${esc(f.title)} poster" loading="lazy" decoding="async" onload="this.style.opacity=1">
        <span class="pix-foldout-caption"><strong>${esc(f.title)}</strong><span>${esc(f.release_year || '')}${f.segments ? ` · ${f.segments} clips` : ''}</span></span>
      </button>
      <div class="pix-fold">
        <button data-nav="#/classics/${esc(f.film_key)}">Watch</button>
        ${pf ? `<button data-nav="#/film/${esc(pf.imdb_id)}">Film page</button>
        <button data-seen-toggle="${esc(pf.imdb_id)}">${seenPf ? 'Remove from seen' : 'Mark seen'}</button>
        <button data-fav-toggle="${esc(pf.imdb_id)}"${(reactionMap[pf.imdb_id] || []).includes('Favorite') ? ' class="is-on"' : ''} aria-pressed="${(reactionMap[pf.imdb_id] || []).includes('Favorite')}">★ Favorite</button>
        ${groupRowHtml(pf)}
        ${reactionFoldHtml(pf)}
        ${moodFoldHtml(pf)}` : ''}
      </div></article>`;
  }
  if (!f || !f.imdb_id) {
    /* Rows may carry titles with no catalog match (COMB grossers) — render the
     title tile rather than a broken poster. */
    return `<article class="pix-foldout-card" data-hover-type="0"><div class="pix-film-panel">
      <p class="pix-kicker">${esc(f?.title || 'Untitled')}</p>
      <p class="pix-film-meta">${esc(f?.release_year || '')} ${f?.worldwide_gross ? `· ${esc(f.source_label || 'gross')}` : ''}</p>
    </div></article>`;
  }
  const seen = seenSet.has(f.imdb_id);
  const iv = interestMap[f.imdb_id];
  const verdict = iv === 'want_to_see' ? ' is-verdict-want' : iv === 'maybe' ? ' is-verdict-maybe'
    : iv === 'not_interested' ? ' is-verdict-no' : '';
  return `<article class="pix-foldout-card${seen ? ' pix-seen-poster' : ''}${verdict}" data-hover-type="2" data-film="${esc(f.imdb_id)}">
      <button class="pix-marquee-poster${seen ? ' is-seen' : ''}" style="width:100%;display:block" data-nav="#/film/${esc(f.imdb_id)}" aria-label="Open ${esc(f.title)}">
        <img src="${posterUrl(f)}" alt="${esc(f.title)} movie poster" loading="lazy" decoding="async" onload="this.style.opacity=1">
        <span class="pix-foldout-caption"><strong>${esc(f.title)}</strong><span>${esc(f.release_year || '')}</span></span>
      </button>
      <div class="pix-fold">
        <button data-nav="#/film/${esc(f.imdb_id)}">Film page</button>
        <button data-nav="#/film/${esc(f.imdb_id)}">Review</button>
        <button data-nav="#/showcase">Discuss</button>
        <button data-seen-toggle="${esc(f.imdb_id)}">${seen ? 'Remove from seen' : 'Mark seen'}</button>
        <button data-fav-toggle="${esc(f.imdb_id)}"${(reactionMap[f.imdb_id] || []).includes('Favorite') ? ' class="is-on"' : ''} aria-pressed="${(reactionMap[f.imdb_id] || []).includes('Favorite')}">★ Favorite</button>
        ${groupRowHtml(f)}
        ${reactionFoldHtml(f)}
        ${moodFoldHtml(f)}
      </div></article>`;
}

/* Row header per components.md §3: number + title, then the tag line carrying
   the note and the RIGHT-ALIGNED tools (grip, ↑, ↓, fold). */
function channelRow(index, row, folded) {
  const set = row.films.map(loopCard).join('');
  const num = row.number || String(index).padStart(2, '0');
  return `<section class="pix-home-section pix-loop-row pix-home-row-slot${folded ? ' is-folded' : ''}" data-row-key="${esc(row.key)}" aria-labelledby="pix-row-${esc(row.key)}-heading">
      <div class="pix-home-section-heading pix-home-row-heading">
        <div><span>${num}</span><h2 id="pix-row-${esc(row.key)}-heading">${esc(row.title)}</h2></div>
        <div class="pix-home-row-tagline"><p>${esc(row.note)}</p>
          <div class="pix-home-row-tools">
            <button class="pix-home-row-grip" aria-label="Drag to reorder the ${esc(row.title)} row" title="Press and drag to reorder this row">⠿</button>
            <button class="pix-home-row-move" data-move="up" aria-label="Move the ${esc(row.title)} row up">↑</button>
            <button class="pix-home-row-move" data-move="down" aria-label="Move the ${esc(row.title)} row down">↓</button>
            <button class="pix-home-row-fold" aria-expanded="${!folded}" aria-label="Fold the ${esc(row.title)} row">
              <span class="pix-home-fold-chevron${folded ? ' is-folded' : ''}">&gt;</span>
            </button>
          </div>
        </div>
      </div>
      <div class="pix-loop-viewport is-fullbleed" tabindex="0" aria-label="${esc(row.title)} channel">
        <div class="pix-loop-track">
          <div class="pix-loop-set">${set}</div><div class="pix-loop-set" aria-hidden="true">${set}</div><div class="pix-loop-set" aria-hidden="true">${set}</div>
        </div>
        <button class="pix-loop-nav pix-loop-nav-left" aria-label="Stream ${esc(row.title)} channel left">‹</button>
        <button class="pix-loop-power" aria-label="Pause ${esc(row.title)} channel">❚❚</button>
        <button class="pix-loop-nav pix-loop-nav-right is-live" aria-label="Stream ${esc(row.title)} channel right">›</button>
      </div>
    </section>`;
}

/* Loop engine: base glide 26 px/s, hold-to-race 560 px/s (settings.json → channels).
   Directions alternate down the page; the live direction's button stays lit gold. */
function startLoop(viewport, startDir) {
  const track = viewport.querySelector('.pix-loop-track');
  if (!track || track.dataset.wired) return;
  track.dataset.wired = '1';
  let x = 0, dir = startDir || -1, hold = 0, paused = false, last = performance.now();
  const power = viewport.querySelector('.pix-loop-power');
  const left = viewport.querySelector('.pix-loop-nav-left');
  const right = viewport.querySelector('.pix-loop-nav-right');
  const light = () => {
    left?.classList.toggle('is-live', dir < 0 && !hold);
    right?.classList.toggle('is-live', dir > 0 && !hold);
  };
  light();
  const frame = (now) => {
    const dt = Math.min(80, now - last); last = now;
    if (!paused) {
      const speed = hold ? 560 : 26;
      const d = hold || dir;
      x -= (speed * dt / 1000) * d;
      const w = track.scrollWidth / 3;
      if (w > 0) { if (-x >= w) x += w; if (x > 0) x -= w; }
      track.style.transform = `translateX(${x}px)`;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  const bind = (btn, sign) => {
    if (!btn) return;
    btn.addEventListener('pointerdown', () => { hold = sign; light(); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, () => { hold = 0; light(); }));
    btn.addEventListener('click', () => { dir = sign; light(); });
  };
  bind(left, -1); bind(right, 1);
  if (power) power.addEventListener('click', () => {
    paused = !paused;
    power.textContent = paused ? '▶' : '❚❚';
    power.classList.toggle('is-paused', paused);
    power.setAttribute('aria-label', paused ? 'Play channel' : 'Pause channel');
  });
}

function saveRowOrder() {
  const keys = [...document.querySelectorAll('#channels .pix-loop-row')].map((s) => s.dataset.rowKey);
  const l = readLayout(); l.order = keys; saveLayout(l);
}

function wireRowTools(section) {
  const key = section.dataset.rowKey;
  const fold = section.querySelector('.pix-home-row-fold');
  const chev = section.querySelector('.pix-home-fold-chevron');
  if (fold) fold.onclick = () => {
    const nowFolded = !section.classList.contains('is-folded');
    section.classList.toggle('is-folded', nowFolded);
    chev?.classList.toggle('is-folded', nowFolded);
    fold.setAttribute('aria-expanded', String(!nowFolded));
    const l = readLayout(); l.folded = { ...(l.folded || {}), [key]: nowFolded }; saveLayout(l);
  };
  section.querySelectorAll('.pix-home-row-move').forEach((b) => (b.onclick = () => {
    const sib = b.dataset.move === 'up' ? section.previousElementSibling : section.nextElementSibling;
    if (!sib || !sib.classList.contains('pix-loop-row')) return;
    if (b.dataset.move === 'up') sib.before(section); else sib.after(section);
    saveRowOrder();
  }));
  /* The grip only arms dragging while pressed (components.md §3). */
  const grip = section.querySelector('.pix-home-row-grip');
  if (grip) {
    grip.addEventListener('pointerdown', () => { section.draggable = true; });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => grip.addEventListener(ev, () => { section.draggable = false; }));
  }
  section.addEventListener('dragstart', (e) => {
    section.classList.add('is-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  });
  section.addEventListener('dragend', () => {
    section.draggable = false;
    section.classList.remove('is-dragging');
    document.querySelectorAll('.is-drop-target').forEach((n) => n.classList.remove('is-drop-target'));
    saveRowOrder();
  });
  section.addEventListener('dragover', (e) => {
    e.preventDefault();
    const dragged = document.querySelector('.pix-loop-row.is-dragging');
    if (!dragged || dragged === section) return;
    document.querySelectorAll('.pix-loop-row.is-drop-target').forEach((n) => n.classList.remove('is-drop-target'));
    section.classList.add('is-drop-target');
    const r = section.getBoundingClientRect();
    if (e.clientY < r.top + r.height / 2) section.before(dragged); else section.after(dragged);
  });
  section.addEventListener('drop', (e) => { e.preventDefault(); section.classList.remove('is-drop-target'); });
}

/* Build the landing rows in spec order: built-ins first, then genre rows
   (settings.json → genres.rowOrderDefault). */
function buildRows(films, classics) {
  const rows = [];
  const usedLeads = new Set();

  /* H-3.2: Top Rated = 02 (the crowd row — not a genre row; kept). */
  const topRatedFilms = films.slice(6, 26);
  if (topRatedFilms[0]) usedLeads.add(topRatedFilms[0].imdb_id || topRatedFilms[0].film_key);
  rows.push({ key: 'top_rated', number: '02', title: 'Top Rated', note: "The crowd's highest-win films", films: topRatedFilms, count: 20 });

  /* Genre rows = OUR CONTENT ONLY (Founder, 2026-11-08): a genre row
     scrolls only films PIX streams — the classics catalogue grouped by
     each film's library genre — never catalogue posters. Poster-backed
     only (a stream still is not a poster); a genre with fewer than four
     poster-backed streamable films gets no row, never a backfill. */
  const GENRE_NAMES = { horror: 'Horror', scifi: 'Sci-Fi', drama: 'Drama', comedy: 'Comedy', noir: 'Film Noir', crime: 'Crime', mystery: 'Mystery', romance: 'Romance', thriller: 'Thriller', adventure: 'Adventure', fantasy: 'Fantasy', war: 'War', westerns: 'Westerns', european: 'European', action: 'Action', documentary: 'Documentary', animation: 'Animation', musical: 'Musical', talkies: 'Talkies', soviet: 'Soviet' };
  const byGenre = new Map();
  (classics || []).forEach((c) => {
    if (!c.film_key || !c.poster_key || !c.poster_imdb) return;
    const g = String(c.genre || 'classics').toLowerCase();
    if (!byGenre.has(g)) byGenre.set(g, []);
    byGenre.get(g).push({
      imdb_id: c.poster_imdb, title: c.title, release_year: c.release_year,
      poster_key: c.poster_key, genre: c.genre,
      poster: `/api/poster?imdb=${encodeURIComponent(c.poster_imdb)}&key=${encodeURIComponent(c.poster_key)}`,
      film_key: c.film_key,
    });
  });
  const genreRows = [...byGenre.entries()]
    .filter(([, v]) => v.length >= 4)
    .sort((a, b) => b[1].length - a[1].length);
  genreRows.forEach(([g, v]) => {
    let rowFilms = v.slice(0, 16);
    const leadId = rowFilms[0]?.film_key;
    if (leadId && usedLeads.has(leadId)) rowFilms = v.slice(1, 17);
    if (rowFilms[0]) usedLeads.add(rowFilms[0].film_key);
    const name = GENRE_NAMES[g] || g.toUpperCase();
    rows.push({
      key: `genre:${g}`, title: name,
      note: `PIX streams these · ${v.length} classic${v.length === 1 ? '' : 's'}`,
      films: rowFilms, count: v.length,
    });
  });
  return rows;
}

async function viewLanding() {
  closeMarqueeFeature();
  mount('home', `
    <div class="pix-poster-marquee" id="marquee" aria-label="PIX.MOV poster marquee"></div>
    <div class="pix-dna-band">
      <p class="pix-dna-band-head">Discover your natural algorithm</p>
      <a class="pix-dna-band-num" href="#/dna" id="dnaBandPct">${dnaStats ? `FILM DNA ${Number(dnaStats.pct || 0).toFixed(2)}%` : 'FILM DNA 0.00%'}</a>
    </div>
    <div class="pix-attractions-row" id="attractions">
      <span class="pix-attractions-slot">
        <button class="pix-attraction-btn is-genres" id="genresBtn" aria-expanded="false" aria-haspopup="true">GENRES ▾</button>
        <div class="pix-genres-dropdown" id="genresMenu" hidden></div>
      </span>
      <span class="pix-attractions-slot"><button class="pix-attraction-btn" data-nav="#/lists">PIX.MOV Lists</button></span>
      <span class="pix-attractions-slot"><button class="pix-attraction-btn" data-nav="#/top500">Top 500</button></span>
      <span class="pix-attractions-slot"><button class="pix-attraction-btn" data-nav="#/classics">Classics</button></span>
      <span class="pix-attractions-slot"><button class="pix-attraction-btn" data-nav="#/showcase">Showcase</button></span>
      <a class="pix-seen-entry" href="#/seen" aria-label="Open your seen posters">
        <span class="pix-seen-entry-plate" aria-hidden="true">SEEN</span>
        <span class="pix-seen-entry-caption" id="seenEntryCount">Your wall</span>
      </a>
      <p class="pix-attractions-note">Pick the film you liked better. Every choice is one vote in the taste network.</p>
    </div>
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><span>02</span><h2>Features</h2></div>
        <div class="pix-home-row-tagline"><p>Feature presentations from the PIX library</p></div></div>
      <div class="pix-feature-grid" id="features"><p class="pix-status">loading…</p></div>
    </section>
    <div id="channels"><p class="pix-status pix-content-width">loading channels…</p></div>`);

  document.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => (location.hash = b.dataset.nav)));
  refreshDna();

  let films = [];
  let classics = [];
  try {
    const [t, c] = await Promise.all([
      api('/api/top500?limit=500'),
      api('/api/classics')
    ]);
    films = (t.films || []).filter((f) => Number(f.release_year) >= LAUNCH_YEAR_MIN);
    classics = c.films || [];
  } catch (e) { /* fall through to the empty states below */ }

  if (!films.length && !classics.length) {
    document.getElementById('features').innerHTML = '<p class="pix-status">The catalogue is unavailable right now.</p>';
    document.getElementById('channels').innerHTML = '';
    return;
  }

  /* 3 rows × 20 posters, pool split round-robin (index % 3) — settings.json → marquee.pool */
  const pool = films.slice(0, 60);
  const bands = [0, 1, 2].map((r) => pool.filter((_, i) => i % 3 === r));
  document.getElementById('marquee').innerHTML = bands.map(marqueeRow).join('');
  paintMarks(document.getElementById('marquee'));
  /* progressive load: the tail of each set arrives after 200ms */
  setTimeout(() => {
    document.querySelectorAll('.pix-marquee-poster img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
      delete img.dataset.src;
    });
  }, 200);
  document.getElementById('marquee').onclick = (e) => {
    const btn = e.target.closest('.pix-marquee-poster');
    if (!btn) { closeMarqueeFeature(); return; }
    openMarqueeFeature(document.getElementById('marquee'), btn, e);
  };

  /* FEATURES = the artifact's PixFeaturesShelf (is-landing): up to 12
     feature presentations, each opening its FEATURE PRESENTATION section
     (#/feature/:key). The img carries the H-3.5 fade completion — the
     shelf rendered invisible without it, same fault as the marquee. */
  document.getElementById('features').innerHTML = classics.slice(0, 12).map((c) => {
    /* Foldout article (Founder hover rule, 2026-11-08): the poster carries
       the standard hover fold — Watch feature first, then the kit keyed
       to the film's catalogue twin when it has one. */
    const pf = c.poster_imdb ? { ...c, imdb_id: c.poster_imdb } : null;
    return `<article class="pix-foldout-card pix-feature-card" data-hover-type="2"${pf ? ` data-film="${esc(pf.imdb_id)}"` : ''}>
      <button class="pix-feature-posterbtn" data-nav="#/feature/${esc(c.film_key)}" aria-label="Open the ${esc(c.title)} feature presentation">
        ${featureCardMedia(c)}
        <span class="pix-feature-overlay"><strong>${esc(c.title)}</strong><span>${esc(c.release_year || '')} · Feature presentation</span><span class="pix-feature-open">Watch feature</span></span>
      </button>
      <div class="pix-fold">
        <button data-nav="#/feature/${esc(c.film_key)}">Watch feature</button>
        ${pf ? `<button data-nav="#/film/${esc(pf.imdb_id)}">Film page</button>
        <button data-seen-toggle="${esc(pf.imdb_id)}">${seenSet.has(pf.imdb_id) ? 'Remove from seen' : 'Mark seen'}</button>
        <button data-fav-toggle="${esc(pf.imdb_id)}"${(reactionMap[pf.imdb_id] || []).includes('Favorite') ? ' class="is-on"' : ''} aria-pressed="${(reactionMap[pf.imdb_id] || []).includes('Favorite')}">★ Favorite</button>
        ${groupRowHtml(pf)}
        ${reactionFoldHtml(pf)}
        ${moodFoldHtml(pf)}` : ''}
      </div></article>`;
  }).join('');
  upgradePosters(document.getElementById('features'));
  bindCardFold(document.getElementById('features'));
  paintMarks(document.getElementById('features'));

  const rows = buildRows(films, classics);
  const layout = readLayout();
  const order = Array.isArray(layout.order) ? layout.order : [];
  const pos = (k) => { const i = order.indexOf(k); return i < 0 ? 999 : i; };
  rows.sort((a, b) => pos(a.key) - pos(b.key));
  document.getElementById('channels').innerHTML = rows
    .map((r, i) => channelRow(i + 3, r, !!(layout.folded || {})[r.key])).join('');

  document.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => (location.hash = b.dataset.nav)));
  /* Row-card fold: the seen toggle flips state without leaving the row. */
  document.querySelectorAll('#channels [data-seen-toggle]').forEach((b) => (b.onclick = async (e) => {
    e.stopPropagation();
    const id = b.dataset.seenToggle;
    if (!session) { location.hash = '#/auth'; return; }
    const next = !seenSet.has(id);
    const r = await api('/api/seen', { method: 'POST', body: JSON.stringify({ imdb_id: id, seen: next }) });
    if (!r.ok) return;
    if (next) seenSet.add(id); else seenSet.delete(id);
    b.textContent = next ? 'Remove from seen' : 'Mark seen';
    document.querySelectorAll(`#channels .pix-foldout-card[data-film="${id}"]`).forEach((c) => {
      c.classList.toggle('pix-seen-poster', next);
      c.querySelector('.pix-marquee-poster')?.classList.toggle('is-seen', next);
    });
    dnaStats = null; refreshDna();
  }));
  bindReactions(document.getElementById('channels'));
  bindFavorites(document.getElementById('channels'));
  bindGroups(document.getElementById('channels'));
  bindMoods(document.getElementById('channels'));
  paintMarks(document.getElementById('channels'));
  /* directions alternate down the page (settings.json → channels.loop) */
  document.querySelectorAll('#channels .pix-loop-row').forEach((section, i) => {
    wireRowTools(section);
    const vp = section.querySelector('.pix-loop-viewport');
    if (vp) startLoop(vp, i % 2 === 0 ? -1 : 1);
  });

  /* GENRES drop-down: every genre with a landing row; choosing one scrolls
     to that row and unfolds it (settings.json → attractionsBar.genresButton). */
  const gBtn = document.getElementById('genresBtn'), gMenu = document.getElementById('genresMenu');
  gMenu.innerHTML = rows.map((r) =>
    `<button class="pix-genres-item" data-genre-row="${esc(r.key)}">${esc(r.title)} <span class="pix-dim">(${r.count ?? r.films.length})</span></button>`).join('');
  gBtn.onclick = () => {
    const open = gMenu.hidden;
    gMenu.hidden = !open;
    gBtn.setAttribute('aria-expanded', String(open));
  };
  gMenu.querySelectorAll('[data-genre-row]').forEach((b) => (b.onclick = () => {
    gMenu.hidden = true; gBtn.setAttribute('aria-expanded', 'false');
    const target = document.querySelector(`.pix-loop-row[data-row-key="${b.dataset.genreRow}"]`);
    if (!target) return;
    target.classList.remove('is-folded');
    target.querySelector('.pix-home-fold-chevron')?.classList.remove('is-folded');
    target.querySelector('.pix-home-row-fold')?.setAttribute('aria-expanded', 'true');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  document.addEventListener('click', (e) => {
    if (!gMenu.hidden && !e.target.closest('#genresMenu') && !e.target.closest('#genresBtn')) {
      gMenu.hidden = true; gBtn.setAttribute('aria-expanded', 'false');
    }
  }, { once: true });
}

/* ---------------- Movie vs Movie ---------------- */
let gameFilter = { scope: 'all', value: '' }; // the artifact's game model: scope all | genre | decade | year
let streakState = null; // { imdbId, count } — consecutive wins of the reigning film
let recentIds = []; // session-recent films, preferred out of challenger slots
let pendingPick = null; // { winner, loser } held while the WHY panel is open
const WHY_OPTIONS = ['Story', 'Performance', 'Feeling', 'Craft', 'Rewatch value'];
const TRIAGE_INTERESTS = ['maybe', 'not_interested', 'never_heard_of_it'];
const INTEREST_LABELS = { want_to_see: 'Want to See', maybe: 'Maybe', not_interested: 'No, Thanks', never_heard_of_it: 'Never Heard of it' };
function pushRecent(id) { recentIds = [id, ...recentIds.filter((x) => x !== id)].slice(0, 240); }
function matchupQuery() {
  if (gameFilter.scope === 'genre') return `mode=mix&genre=${encodeURIComponent(gameFilter.value)}`;
  if (gameFilter.scope === 'decade') { const f = Number(gameFilter.value); return `year_from=${f}&year_to=${f + 9}`; }
  if (gameFilter.scope === 'year') return `deck=year-${gameFilter.value}`;
  if (gameFilter.scope === 'mix') return 'mode=mix';
  return 'mode=top10';
}
function filterLabel() {
  if (gameFilter.scope === 'genre') return `genre-${gameFilter.value}`;
  if (gameFilter.scope === 'decade') return `${gameFilter.value}–${Number(gameFilter.value) + 9}`;
  if (gameFilter.scope === 'year') return String(gameFilter.value);
  if (gameFilter.scope === 'mix') return 'Past 40 Years';
  return 'Past Ten Years';
}
function syncGameTitle() {
  const gd = document.getElementById('gameDeck');
  if (gd) gd.textContent = filterLabel();
}

/* The artifact's sidebar game controls, fed by /api/decks + /api/genres.
   (Its CATEGORY fold also offers Performance matchups; that category has
   no performer-pair endpoint on this backend yet, so it is not offered —
   named in the Pass 4 crossing, not faked.) */
let gameOptionsCache = null;
async function loadGameOptions() {
  if (gameOptionsCache) return gameOptionsCache;
  const [d, g] = await Promise.all([api('/api/decks').catch(() => null), api('/api/genres').catch(() => null)]);
  gameOptionsCache = {
    decks: ((d && d.ok && d.decks) || []).filter((x) => (x.movies || 0) >= 2),
    genres: (g && g.ok && g.genres) || [],
  };
  return gameOptionsCache;
}
function renderGameControls() {
  const host = document.getElementById('gameControls');
  if (!host) return;
  const scope = gameFilter.scope;
  const typeLabel = scope === 'all' ? 'Past Ten Years' : scope === 'mix' ? 'Past 40 Years' : scope === 'genre' ? 'Genre' : scope === 'decade' ? 'Decade' : 'Year';
  const scopeName = scope === 'genre' ? 'GENRE' : scope === 'decade' ? 'SPAN' : 'YEAR';
  let scopeOptions = '';
  if (scope === 'genre') scopeOptions = (gameOptionsCache?.genres || []).map((g) => `<label><input type="radio" name="pix-scope" value="${esc(g.label)}"${gameFilter.value === g.label ? ' checked' : ''}><span>${esc(g.label)} · ${Number(g.movies || 0).toLocaleString()}</span></label>`).join('');
  if (scope === 'decade') scopeOptions = ['1920', '1930', '1940', '1950', '1960', '1970', '1980', '1990', '2000', '2010', '2020'].map((d0) => `<label><input type="radio" name="pix-scope" value="${d0}"${gameFilter.value === d0 ? ' checked' : ''}><span>${d0}–${Number(d0) + 9}</span></label>`).join('');
  if (scope === 'year') scopeOptions = (gameOptionsCache?.decks || []).map((dk) => `<label><input type="radio" name="pix-scope" value="${esc(dk.release_year)}"${String(gameFilter.value) === String(dk.release_year) ? ' checked' : ''}><span>${esc(dk.release_year)} · ${Number(dk.movies || 0).toLocaleString()} real poster-backed films</span></label>`).join('');
  host.innerHTML = `
    <details class="sidebar-filter-fold" open>
      <summary><span>TYPE</span><small>${esc(typeLabel)}</small></summary>
      <div class="sidebar-filter-options grid">
        ${[['all', 'Past Ten Years'], ['mix', 'Past 40 Years'], ['genre', 'Genre'], ['decade', 'Decade'], ['year', 'Year']].map(([val, lab]) => `<label><input type="radio" name="pix-game-type" value="${val}"${scope === val ? ' checked' : ''}><span>${lab}</span></label>`).join('')}
      </div>
    </details>
    ${scope !== 'all' ? `<details class="sidebar-filter-fold" open>
      <summary><span>${scopeName}</span><small>${esc(gameFilter.value || '')}</small></summary>
      <div class="sidebar-filter-options grid">${scopeOptions || '<p class="pix-status">loading options…</p>'}</div>
    </details>` : ''}`;
  host.querySelectorAll('input[name="pix-game-type"]').forEach((r) => (r.onchange = () => {
    const v = r.value;
    gameFilter = v === 'genre' ? { scope: 'genre', value: (gameOptionsCache?.genres[0]?.label || '') }
      : v === 'decade' ? { scope: 'decade', value: '1970' }
      : v === 'year' ? { scope: 'year', value: String(gameOptionsCache?.decks[0]?.release_year || '2025') }
      : v === 'mix' ? { scope: 'mix', value: '' }
      : { scope: 'all', value: '' };
    streakState = null;
    syncGameTitle(); renderGameControls(); nextMatchup();
  }));
  host.querySelectorAll('input[name="pix-scope"]').forEach((r) => (r.onchange = () => {
    gameFilter = { scope, value: r.value };
    streakState = null;
    syncGameTitle(); renderGameControls(); nextMatchup();
  }));
}
async function viewPlay() {
  mount('play', `
  <section class="pix-section pix-section-overlay" aria-label="PIX Now Playing">
    <div class="pix-game-frame pix-game-frame-expanded">
      <div class="pix-now-playing-header">
        <div class="pix-now-playing-control">
          <button class="pix-now-playing-banner" id="filterBtn" aria-label="Now Playing game controls" aria-expanded="false">
            <h2>NOW PLAYING</h2><small>EDIT FILTER</small>
          </button>
          <div class="pix-now-playing-popover" id="filterPop" hidden>
            <div class="sidebar-game-controls" id="gameControls" aria-label="PIX game controls"><p class="pix-status">loading controls…</p></div>
          </div>
        </div>
        <p class="pix-current-game-title">PIX MIX: movie vs movie · <span id="gameDeck">${esc(filterLabel())}</span></p>
        <button class="pix-game-close-button" id="npClose" aria-label="Close Now Playing game"><span aria-hidden="true">×</span></button>
      </div>
      <div class="pix-game-headline-block">
        <h2 class="pix-game-headline">Which MOVIE DID you ENJOY MORE</h2>
        <p class="pix-game-subhead">Past Ten Year Blockbusters</p>
      </div>
      <div class="pix-film-dna-row">
        <div class="pix-new-pair-frame">
          <button class="pix-new-pair-button" id="newPair" type="button" aria-label="Haven't watched it either; show a new pair" title="Haven't watched it either">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7h-5V2"/><path d="M20 7a8 8 0 0 0-13.5-2.5L4 7"/><path d="M4 17h5v5"/><path d="M4 17a8 8 0 0 0 13.5 2.5L20 17"/></svg>
            <span>Haven't watched it either</span>
          </button>
        </div>
      </div>
      <div class="pix-matchup" id="matchup" aria-label="Choose between two films"><p class="pix-status">loading matchup…</p></div>
      <p class="pix-interest-feedback" id="interestMsg" role="status" aria-live="polite"></p>
      <div class="pix-tough-bar">
        <div class="pix-tough-actions">
          <button class="pix-tough-button" id="toughBtn" type="button" title="Share this matchup">TOUGH PIX</button>
        </div>
        <p class="pix-tough-caption">Share PIX.MOV Challenge For Advice</p>
        <div id="toughOut" class="pix-tough-out"></div>
      </div>
      <div class="pix-fan-panel" id="fanPanel">
        <p class="pix-kicker">FAN TYPE</p>
        <p class="pix-fan-type-label" id="fanTypeLabel">${session ? 'reading your picks…' : 'sign in to see your type'}</p>
        <p class="pix-footer-note" id="fanTypeDesc">Your fan type is derived from your picks — it changes as you vote.</p>
      </div>
      <p class="pix-status" id="gmsg"></p>
    </div>
  </section>`);

  const pop = document.getElementById('filterPop'), fBtn = document.getElementById('filterBtn');
  const ctl = document.querySelector('.pix-now-playing-control');
  const setPop = (open) => { pop.hidden = !open; fBtn.setAttribute('aria-expanded', String(open)); };
  fBtn.onclick = () => setPop(pop.hidden);
  if (ctl) {
    ctl.addEventListener('mouseenter', () => setPop(true));
    ctl.addEventListener('mouseleave', () => { if (!ctl.contains(document.activeElement)) setPop(false); });
    ctl.addEventListener('focusin', () => setPop(true));
    ctl.addEventListener('focusout', (e) => { if (!ctl.contains(e.relatedTarget)) setPop(false); });
  }
  const q = new URLSearchParams((location.hash.split('?')[1] || ''));
  const dk = q.get('deck');
  if (dk) {
    const my = dk.match(/(\d{4})/);
    if (my) gameFilter = { scope: 'year', value: my[1] };
  }
  syncGameTitle();
  loadGameOptions().then(() => renderGameControls());
  document.getElementById('npClose').onclick = () => (location.hash = '#/');
  document.getElementById('newPair').onclick = () => nextMatchup();
  document.getElementById('toughBtn').onclick = shareTough;
  /* FAN TYPE is DERIVED from behaviour (pix2.pix_user_fan_types), never chosen —
     the panel reads the current type back from /api/showcase. */
  if (session) {
    api('/api/showcase').then((sc) => {
      const lab = document.getElementById('fanTypeLabel');
      if (!lab) return;
      const ft = sc.ok ? sc.showcase.fanType : null;
      lab.textContent = ft ? ft.label : 'not enough picks yet';
      document.getElementById('fanTypeDesc').textContent = ft
        ? `${ft.description} · confidence ${Math.round(Number(ft.confidence || 0) * 100)}% over ${ft.signal_count} signals`
        : 'Keep voting — your type emerges from your picks.';
      document.getElementById('fanPanel').classList.toggle('is-open', !!ft);
    }).catch(() => { /* offline: leave the placeholder */ });
  }
  document.addEventListener('keydown', npEsc);
  nextMatchup();
}
function npEsc(e) { if (e.key === 'Escape' && document.getElementById('npClose')) location.hash = '#/'; }

/* Poster stage per components.md §4: poster button = pick, interest fold on the
   OUTER top corner, meta overlay hidden until hover/focus/selection. */
function streakBadgeHtml(m) {
  return streakState && streakState.imdbId === m.imdb_id && streakState.count >= 2
    ? `<span class="pix-streak-badge" role="status">Win streak ×${streakState.count}</span>` : '';
}
function choiceCard(m, side) {
  return `
  <article class="pix-choice">
    <div class="pix-poster-stage" data-hover-type="1">
      <button class="pix-poster-button" data-pick="${esc(m.imdb_id)}" data-side="${side}"
        aria-label="Choose ${esc(m.title)}; use the interest fold if you haven't watched it">
        ${stagedPoster(m.poster || posterUrl(m), m.title)}
        <span class="pix-check" aria-hidden="true">✓</span>
      </button>
      <div class="pix-interest-menu pix-interest-menu-${side === 'a' ? 'left' : 'right'}">
        <button class="pix-interest-trigger" aria-label="Show interest options for ${esc(m.title)}" aria-expanded="false">x</button>
        <div class="pix-interest-controls">
          <button data-interest="want_to_see">WANT TO SEE</button>
          <button data-interest="maybe">MAYBE</button>
          <button data-interest="not_interested">NO THANKS</button>
          <button data-interest="never_heard_of_it">NEVER HEARD OF IT</button>
        </div>
      </div>
      <div class="pix-movie-meta pix-movie-meta-overlay">
        ${streakBadgeHtml(m)}<h2>${esc(m.title)}</h2><p>${esc(m.release_year || '')}${m.genre ? ' · ' + esc(m.genre) : ''}</p>
        <a class="pix-screening-link" href="#/film/${esc(m.imdb_id)}">MY SCREENING</a>
      </div>
    </div>
  </article>`;
}

function wireMatchup(box) {
  const a = JSON.parse(box.dataset.a), b = JSON.parse(box.dataset.b);
  box.querySelectorAll('[data-pick]').forEach((elc) => (elc.onclick = () => {
    vote(elc.dataset.pick, elc.dataset.side === 'a' ? b.imdb_id : a.imdb_id);
  }));
  /* The fold opens with .is-open on its wrapper (settings/hover rules in the
     package animate max-height), never by toggling display. */
  box.querySelectorAll('.pix-interest-trigger').forEach((t) => (t.onclick = (e) => {
    e.stopPropagation();
    const menu = t.closest('.pix-interest-menu');
    const open = !menu.classList.contains('is-open');
    box.querySelectorAll('.pix-interest-menu').forEach((mm) => mm.classList.remove('is-open'));
    box.querySelectorAll('.pix-interest-trigger').forEach((x) => x.setAttribute('aria-expanded', 'false'));
    menu.classList.toggle('is-open', open);
    t.setAttribute('aria-expanded', String(open));
  }));
  /* Drag a poster DOWN = "haven't seen it" (hoverTypes type 1). */
  box.querySelectorAll('.pix-poster-button').forEach((btn) => {
    let y0 = null;
    btn.addEventListener('pointerdown', (e) => { y0 = e.clientY; });
    btn.addEventListener('pointerup', (e) => {
      if (y0 == null) return;
      const dy = e.clientY - y0; y0 = null;
      if (dy > 70) { e.preventDefault(); markUnseen(btn.dataset.pick); }
    });
    btn.addEventListener('pointercancel', () => { y0 = null; });
  });
  box.querySelectorAll('[data-interest]').forEach((btn) => (btn.onclick = async (e) => {
    e.stopPropagation();
    const id = btn.closest('.pix-choice').querySelector('[data-pick]').dataset.pick;
    await setInterest(id, btn.dataset.interest);
  }));
}

async function setInterest(imdbId, interest) {
  const r = await api('/api/interest', { method: 'POST', body: JSON.stringify({ imdb_id: imdbId, interest }) });
  if (!r.ok) { const g = document.getElementById('gmsg'); if (g) g.textContent = r.error || 'failed'; return; }
  interestMap[imdbId] = interest;
  paintMarks(document);
  const msg = document.getElementById('interestMsg');
  if (msg) msg.textContent = `${INTEREST_LABELS[interest] || interest} — recorded.`;
  /* Want to See queues the film and it stays on screen; the triage three
     (Maybe / No, Thanks / Never Heard of it) clear their side of the
     stage. Every decision permanently removes the film from future
     rotation — the server enforces that in /api/matchup. */
  if (!TRIAGE_INTERESTS.includes(interest)) return;
  replaceMatchupSide(imdbId);
}

/* FILM DNA readout: strip under the header while a vote lands. */
let dnaFlashTimer = null;
function flashDnaRecorded() {
  document.querySelectorAll('.header-tracker-recorded').forEach((n) => n.remove());
  clearTimeout(dnaFlashTimer);
  const el = document.createElement('div');
  el.className = 'header-tracker-recorded';
  const pct = dnaStats ? Math.min(100, Math.max(2, dnaStats.pct)) : 4;
  el.innerHTML = `FILM DNA RECORDED <progress max="100" value="${pct}"></progress>
    <small>${dnaStats ? `${dnaStats.filmsRated} of ${dnaStats.onRecord} films` : 'saving your pick'}</small>`;
  document.body.appendChild(el);
  dnaFlashTimer = setTimeout(() => el.remove(), 2400);
}

function nextPairFrom(box, j) {
  box.dataset.a = JSON.stringify(j.a);
  box.dataset.b = JSON.stringify(j.b);
  box.innerHTML = choiceCard(j.a, 'a') + choiceCard(j.b, 'b');
  upgradePosters(box);
  wireMatchup(box);
}

async function nextMatchup(replaceOnly) {
  const box = document.getElementById('matchup');
  if (!box) return;
  streakState = null;
  if (pendingPick) { pendingPick = null; }
  if (!replaceOnly) box.innerHTML = '<p class="pix-status">dealing…</p>';
  const j = await api('/api/matchup?' + matchupQuery());
  if (!j.ok) { box.innerHTML = errHtml(j.error); return; }
  nextPairFrom(box, j);
  PIX_ANALYTICS.send('np.matchup_served');
}

function vote(winner, loser) {
  /* The pick records immediately (Founder, 2026-11-08): the game no longer
     offers the "Why did you pick this choice" beat — a fan's reason now
     lives on their own movie review, under their showcase. The pick is
     still marked first: the package's .pix-choice-selected carries the
     green ring + check for the beat before the next pair deals. */
  const picked = document.querySelector(`.pix-choice .pix-poster-button[data-pick="${winner}"]`);
  picked?.closest('.pix-choice')?.classList.add('pix-choice-selected');
  document.querySelectorAll('.pix-poster-button').forEach((b) => { b.disabled = true; });
  pendingPick = { winner, loser };
  submitVote('', '');
}

async function submitVote(whyTag, whyDetail) {
  if (!pendingPick) return;
  const { winner, loser } = pendingPick;
  const r = await api('/api/vote', { method: 'POST', body: JSON.stringify({
    winner_imdb_id: winner, loser_imdb_id: loser, deck_key: filterLabel(),
    why_tag: whyTag || '', why_detail: whyDetail || '',
  }) });
  pendingPick = null;
  if (!r.ok) {
    document.querySelectorAll('.pix-choice').forEach((c) => c.classList.remove('pix-choice-selected'));
    document.querySelectorAll('.pix-poster-button').forEach((b) => { b.disabled = false; });
    const g = document.getElementById('gmsg'); if (g) g.textContent = r.error || 'vote failed';
    return;
  }
  dnaStats = null;
  flashDnaRecorded();
  PIX_ANALYTICS.send('np.vote');
  refreshDna();
  streakState = streakState && streakState.imdbId === winner
    ? { imdbId: winner, count: streakState.count + 1 }
    : { imdbId: winner, count: 1 };
  dealWinnerStays(winner);
}

/* Winner-stays dealing (the artifact's flow): the winner keeps its side
   of the stage and a fresh challenger is dealt against it, preferring a
   film this session has not recently shown. */
async function dealWinnerStays(winnerId) {
  const box = document.getElementById('matchup');
  if (!box || !box.dataset.a) return nextMatchup();
  const a = JSON.parse(box.dataset.a), b = JSON.parse(box.dataset.b);
  const winner = a.imdb_id === winnerId ? a : b;
  const loserId = a.imdb_id === winnerId ? b.imdb_id : a.imdb_id;
  pushRecent(loserId);
  const j = await api('/api/matchup?' + matchupQuery()).catch(() => null);
  if (!j || !j.ok) return nextMatchup();
  const cands = [j.a, j.b].filter(Boolean).filter((m) => m.imdb_id !== winnerId && m.imdb_id !== loserId);
  const fresh = cands.find((m) => !recentIds.includes(m.imdb_id)) || cands[0];
  if (!fresh) return nextMatchup();
  pushRecent(fresh.imdb_id);
  nextPairFrom(box, a.imdb_id === winnerId ? { a: winner, b: fresh } : { a: fresh, b: winner });
}

/* Single-side replacement: a triage verdict (or an unseen mark) removes
   one film; its partner keeps the stage and a challenger is dealt in.
   A verdict on the streak holder ends its run. */
async function replaceMatchupSide(imdbId) {
  const box = document.getElementById('matchup');
  if (!box || !box.dataset.a) return;
  if (streakState && streakState.imdbId === imdbId) streakState = null;
  const a = JSON.parse(box.dataset.a), b = JSON.parse(box.dataset.b);
  const kept = a.imdb_id === imdbId ? b : a;
  const side = a.imdb_id === imdbId ? 'a' : 'b';
  pushRecent(imdbId);
  const j = await api('/api/matchup?' + matchupQuery()).catch(() => null);
  if (!j || !j.ok) { nextMatchup(); return; }
  const cands = [j.a, j.b].filter(Boolean).filter((m) => m.imdb_id !== kept.imdb_id && m.imdb_id !== imdbId);
  const added = cands.find((m) => !recentIds.includes(m.imdb_id)) || cands[0];
  if (!added) { nextMatchup(); return; }
  pushRecent(added.imdb_id);
  nextPairFrom(box, side === 'a' ? { a: added, b: kept } : { a: kept, b: added });
}

async function markUnseen(imdbId) {
  const r = await api('/api/unseen', { method: 'POST', body: JSON.stringify({ imdb_id: imdbId }) });
  if (!r.ok) { const g = document.getElementById('gmsg'); if (g) g.textContent = r.error || 'failed'; return; }
  /* Spec: only the unseen poster is replaced; the pair is rebuilt, never patched. */
  replaceMatchupSide(imdbId);
}

async function shareTough() {
  const box = document.getElementById('matchup');
  const out = document.getElementById('toughOut');
  if (!box.dataset.a) return;
  if (!session) { location.hash = '#/auth'; return; }
  const a = JSON.parse(box.dataset.a), b = JSON.parse(box.dataset.b);
  out.textContent = 'creating share link…';
  const r = await api('/api/tough/share', { method: 'POST',
    body: JSON.stringify({ a_imdb_id: a.imdb_id, b_imdb_id: b.imdb_id, deck_key: filterLabel() }) });
  if (!r.ok) { out.textContent = r.error || 'share failed'; return; }
  const url = location.origin + location.pathname + r.url;
  out.innerHTML = `TOUGH PIX link: <input readonly value="${esc(url)}" style="width:min(420px,90%)" onclick="this.select()">`;
}


/* ---------------- SHOWCASE ---------------- */
async function viewShowcase() {
  if (!session) return viewShowcasePublic();
  mount('showcase', '<div class="pix-home-section pix-content-width" id="shop"><p class="pix-status">loading SHOWCASE…</p></div>');
  const j = await api('/api/showcase');
  const box = document.getElementById('shop');
  if (!j.ok) { box.innerHTML = errHtml(j.error); return; }
  const s = j.showcase;
  box.innerHTML = `
    <div class="pix-home-section-heading"><div><span>06</span><h2>SHOWCASE</h2></div>
      <div class="pix-home-row-tagline"><p>${esc(s.user || 'Film buff')}</p></div></div>
    <div class="pix-film-panel">
      <p class="pix-kicker">FAN TYPE</p>
      ${s.fanType
        ? `<p class="pix-fan-type-label">${esc(s.fanType.label)}</p>
           <p class="pix-footer-note">${esc(s.fanType.description || '')} · confidence ${Math.round(Number(s.fanType.confidence || 0) * 100)}%</p>`
        : '<p class="pix-status">No fan type yet — play PIX MIX and your type emerges from your picks.</p>'}
    </div>
    <div class="pix-stat-row">
      <div class="pix-stat"><b>${s.votes}</b><span>votes</span></div>
      <div class="pix-stat"><b>${s.unseen}</b><span>unseen marks</span></div>
      <div class="pix-stat"><b>${s.filmsRated}</b><span>films rated</span></div>
    </div>
    ${s.topGenres.length ? `<p class="pix-kicker">TASTE SIGNALS</p>
      <div class="pix-genre-tags">${s.topGenres.map((g) => `<span>${esc(g.genre)}</span>`).join('')}</div>` : ''}
    <p><a class="pix-attraction-btn" href="#/lists">Your lists →</a></p>`;
}

/* SHOWCASE for visitors: a real page (never a bounce to #/auth). */
async function viewShowcasePublic() {
  mount('showcase', '<div class="pix-home-section pix-content-width" id="shop"><p class="pix-status">loading SHOWCASE…</p></div>');
  const j = await api('/api/showcase/public');
  const box = document.getElementById('shop');
  if (!j.ok) { box.innerHTML = errHtml(j.error); return; }
  box.innerHTML = `
    <div class="pix-home-section-heading"><div><span>06</span><h2>SHOWCASE</h2></div>
      <div class="pix-home-row-tagline"><p>Your film-buff identity, on display</p></div></div>
    <div class="pix-film-panel">
      <p class="pix-kicker">WHAT SHOWCASE IS</p>
      <p>Every pick you make sharpens your FAN TYPE. SHOWCASE is where that becomes a page:
        the type you play like, the genres you keep returning to, the lists you keep, and the
        films you have marked seen — ${Number(j.catalog || 0).toLocaleString()} on record.</p>
      <p class="pix-footer-note">You are browsing as a visitor. Sign in to open your own SHOWCASE.</p>
      <div class="pix-feedback-choices">
        <a class="pix-attraction-btn" href="#/auth">Sign in / create account</a>
        <a class="pix-attraction-btn" href="#/play">Play to build your DNA</a>
      </div>
    </div>
    ${(j.fanTypes || []).length ? `<p class="pix-kicker">THE FAN TYPES</p>
      <div class="pix-stat-row">${j.fanTypes.map((f) => `<div class="pix-stat"><b>${esc(f.label)}</b><span>${esc(String(f.description || '').slice(0, 90))}</span></div>`).join('')}</div>` : ''}`;
}

/* ---------------- Dracula 1931 (legacy route → shared classic player) ---------------- */
async function viewDracula() { return viewClassic('dracula-1931'); }

/* ---------------- 1:1 Pass 3 · sections parity ----------------
 * The artifact's registry (v1 slugBySection) names 24 sections; CINE is
 * separated, Views and Budgets have no data source on this backend
 * (named, not faked — see the Pass 3 crossing). These views land the
 * rest: dna, sort, grossers, watchlist, feature, and the five Story
 * sections, plus profile/screening aliases for sections already here. */

async function viewFeature(filmKey) {
  const key = filmKey || 'dracula-1931';
  mount('feature', `
  <section class="pix-presentation-page" aria-label="Feature presentation">
    <div class="pix-presentation-nav"><a href="#/classics">← Features</a><span>OUR FEATURE PRESENTATION</span></div>
    <div class="player-wrap"><p class="muted">loading…</p></div>
    <div id="featureShelf"></div>
  </section>`);
  await renderClassicInto(key, document.querySelector('.player-wrap'));
  const c = await api('/api/classics').catch(() => null);
  const shelf = document.getElementById('featureShelf');
  if (shelf && c && c.ok && (c.films || []).length) {
    shelf.innerHTML = `<div class="pix-home-section pix-content-width"><div class="pix-home-section-heading"><div><span>UP NEXT</span><h2>Other Features</h2></div><div class="pix-home-row-tagline"><p>More feature presentations</p></div></div>
      <div class="pix-feature-grid">${c.films.filter((f) => f.film_key !== key).slice(0, 6).map((f) => `
        <button class="pix-feature-card" data-nav="#/feature/${esc(f.film_key)}" aria-label="Watch ${esc(f.title)}">
          ${featureCardMedia(f)}
          <span class="pix-feature-overlay"><strong>${esc(f.title)}</strong><span>${esc(f.release_year || '')}</span></span></button>`).join('')}
      </div></div>`;
    upgradePosters(shelf);
    shelf.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => (location.hash = b.dataset.nav)));
  }
}

async function viewDna() {
  mount('dna', `<section class="pix-home-section pix-content-width">
    <p class="pix-kicker">FILM DNA</p><h1>Your taste, on record</h1>
    <div id="dnaBody"><p class="pix-status">reading your FILM DNA…</p></div></section>`);
  const body = document.getElementById('dnaBody');
  if (!body) return;
  const d = await api('/api/dna').catch(() => null);
  let fanHtml;
  if (session) {
    const sc = await api('/api/showcase').catch(() => null);
    const ft = sc && sc.ok ? sc.showcase.fanType : null;
    fanHtml = ft
      ? `<div class="pix-fan-panel is-open"><p class="pix-kicker">FAN TYPE</p><p class="pix-fan-type-label">${esc(ft.label)}</p><p class="pix-footer-note">${esc(ft.description)} · confidence ${Math.round(Number(ft.confidence || 0) * 100)}% over ${ft.signal_count} signals</p></div>`
      : `<div class="pix-fan-panel"><p class="pix-kicker">FAN TYPE</p><p class="pix-fan-type-label">not enough picks yet</p><p class="pix-footer-note">Keep voting in NOW PLAYING — your type emerges from your picks.</p></div>`;
  } else {
    fanHtml = `<div class="pix-fan-panel"><p class="pix-kicker">FAN TYPE</p><p class="pix-fan-type-label">sign in to see your type</p><p class="pix-footer-note">Your fan type is derived from your picks — it changes as you vote.</p></div>`;
  }
  body.innerHTML = (d && d.ok)
    ? `<div class="pix-fan-panel is-open"><p class="pix-kicker">RECORDED</p>
        <p class="pix-fan-type-label">FILM DNA RECORDED ${Number(d.pct || 0).toFixed(2)}%</p>
        <p class="pix-footer-note">${Number(d.filmsRated || 0).toLocaleString()} of ${Number(d.onRecord || 0).toLocaleString()} films on record rated. Every NOW PLAYING pick, triage and seen mark writes to this record — and permanently clears that film from your rotation.</p></div>
       ${fanHtml}
       <p><a class="primary-button" href="#/play" style="display:inline-block">Play NOW PLAYING</a></p>`
    : `<p class="pix-status">FILM DNA is unavailable right now.</p>${fanHtml}`;
}

function posterTileHtml(m) {
  /* HOVER coverage (2026-11-06): the shared tile IS the foldout card —
     Watchlist and Sort render through here, so every list surface gets
     the fold, the seen toggle, and the REACTION VOCAB from one renderer. */
  return loopCard(m);
}

async function viewMood() {
  document.title = 'In the Mood For — PIX.MOV';
  setSectionMeta('IN THE MOOD FOR… — PIX.MOV', 'Films you filed by the mood they fit — the shelf for tonight.');
  if (!session) {
    app.innerHTML = `<section class="pix-panel"><h2>Sign in to file by mood</h2><p class="pix-dim">IN THE MOOD FOR… is your shelf: films you filed under the mood they fit, ready for the night you want that mood.</p><a href="#/auth">Sign in</a></section>`;
    return;
  }
  app.innerHTML = `<section class="pix-panel"><h2>In the Mood For…</h2>
    <div class="pix-mood-pick"><label for="moodPick">Tonight I feel</label>
    <select id="moodPick"><option value="">Choose a mood…</option>${MOODS.map((mo) => `<option>${esc(mo)}</option>`).join('')}</select></div>
    <div id="moodShelf"></div>
    <div id="moodMine"></div></section>`;
  const mine = await api('/api/moods/mine').catch(() => null);
  if (mine && mine.ok) moodMap = mine.moods || {};
  const used = MOODS.filter((mo) => Object.values(moodMap).some((arr) => arr.includes(mo)));
  const mineBox = document.getElementById('moodMine');
  mineBox.innerHTML = used.length
    ? `<h3>Your mood shelves</h3><div class="pix-mood-shelves">${used.map((mo) => {
        const n = Object.values(moodMap).filter((arr) => arr.includes(mo)).length;
        return `<button type="button" class="pix-mood-shelf-btn" data-mood-pick="${esc(mo)}">${esc(mo)} — ${n} film${n === 1 ? '' : 's'}</button>`;
      }).join('')}</div>`
    : `<p class="pix-dim">You haven't filed any films by mood yet. Open any film's fold and tap a mood under IN THE MOOD FOR… — it lands here, filed for the night you want it.</p>`;
  const show = async (mood) => {
    const shelf = document.getElementById('moodShelf');
    if (!mood) { shelf.innerHTML = ''; return; }
    shelf.innerHTML = '<p class="pix-dim">Loading…</p>';
    const j = await api('/api/moods/shelf?mood=' + encodeURIComponent(mood)).catch(() => null);
    const films = j && j.ok ? (j.films || []) : [];
    shelf.innerHTML = films.length
      ? `<h3>${esc(mood)}</h3><div class="pix-loop-grid">${films.map(loopCard).join('')}</div>`
      : `<p class="pix-dim">Nothing filed under ${esc(mood)} yet.</p>`;
    if (films.length) bindCardFold(shelf);
  };
  document.getElementById('moodPick').onchange = (e) => show(e.target.value);
  mineBox.querySelectorAll('[data-mood-pick]').forEach((b) => (b.onclick = () => {
    document.getElementById('moodPick').value = b.dataset.moodPick;
    show(b.dataset.moodPick);
  }));
}

async function viewWatchlist() {
  mount('watchlist', `<section class="pix-home-section pix-content-width">
    <p class="pix-kicker">YOUR QUEUE</p><h1>Watchlist</h1>
    <div id="watchBody"><p class="pix-status">loading your queue…</p></div></section>`);
  const body = document.getElementById('watchBody');
  if (!body) return;
  const j = await api('/api/watchlist').catch(() => null);
  if (!j || !j.ok) {
    body.innerHTML = `<p class="pix-status">${session ? 'Your queue is unavailable right now.' : 'Sign in to keep a watchlist — films you mark Want to See collect here.'}</p>`;
    return;
  }
  const q = j.queue || [];
  body.innerHTML = q.length
    ? `<div class="pix-seen-grid">${q.map(posterTileHtml).join('')}</div>`
    : '<p class="pix-status">Nothing queued yet — tap Want to See on a film in NOW PLAYING and it will wait for you here.</p>';
  bindCardFold(body);
}

async function viewGrossers() {
  mount('grossers', `<section class="pix-home-section pix-content-width">
    <p class="pix-kicker">BOX OFFICE · COMB</p><h1>Grossers</h1>
    <div id="grossBody"><p class="pix-status">loading the money chart…</p></div></section>`);
  const body = document.getElementById('grossBody');
  if (!body) return;
  const j = await api('/api/grossers').catch(() => null);
  const rows = (j && j.ok && j.grossers) || [];
  if (!rows.length) { body.innerHTML = '<p class="pix-status">COMB grossers not imported yet.</p>'; return; }
  const money = (n) => (n == null || n === '') ? '' : '$' + Number(n).toLocaleString();
  body.innerHTML = `<div class="pix-money-list">${rows.map((g) => `
    <div class="pix-money-row"><span class="pix-money-rank">${esc(g.rank)}</span>
      <span class="pix-money-title">${g.imdb_id ? `<a href="#/film/${esc(g.imdb_id)}">${esc(g.title)}</a>` : esc(g.title)}${g.release_year ? ` <small>(${esc(g.release_year)})</small>` : ''}</span>
      <span class="pix-money-gross">${esc(money(g.worldwide_gross))}</span></div>`).join('')}
  </div>
  <p class="pix-footer-note">Worldwide grosses per the COMB chart${rows[0] && (rows[0].source_label || rows[0].source) ? ' · source: ' + esc(rows[0].source_label || rows[0].source) : ''}.</p>`;
}

async function viewSort() {
  mount('sort', `<section class="pix-home-section pix-content-width">
    <p class="pix-kicker">SORT COLLECTION</p><h1>Sort your seen films</h1>
    <div class="pix-filter-row"><label for="sortBy">Sort by</label>
      <select id="sortBy"><option value="year-desc">Year · newest first</option><option value="year-asc">Year · oldest first</option><option value="title">Title · A–Z</option><option value="wins">Most wins in PIX</option></select></div>
    <div id="sortBody"><p class="pix-status">gathering your collection…</p></div></section>`);
  const body = document.getElementById('sortBody');
  if (!body) return;
  const mine = await api('/api/seen/mine').catch(() => null);
  const seenIds = new Set((mine && mine.ok && mine.seen) || []);
  if (!seenIds.size) { body.innerHTML = '<p class="pix-status">No seen films yet — mark films seen and they collect here, ready to sort.</p>'; return; }
  const yearsJ = await api('/api/seen/years').catch(() => null);
  const years = ((yearsJ && yearsJ.years) || []).map((y) => y.year);
  const per = await Promise.all(years.map((y) => api('/api/seen/' + encodeURIComponent(y)).catch(() => null)));
  let films = [];
  per.forEach((r) => { if (r && r.ok) films.push(...(r.movies || [])); });
  films = films.filter((f) => seenIds.has(f.imdb_id));
  if (!films.length) { body.innerHTML = '<p class="pix-status">No poster-backed seen films yet.</p>'; return; }
  const render = () => {
    const by = document.getElementById('sortBy').value;
    const sorted = [...films].sort((a, b) => by === 'year-asc' ? a.release_year - b.release_year
      : by === 'title' ? String(a.title).localeCompare(String(b.title))
      : by === 'wins' ? (b.wins || 0) - (a.wins || 0)
      : b.release_year - a.release_year);
    body.innerHTML = `<p class="pix-status">${sorted.length} seen film${sorted.length === 1 ? '' : 's'}</p><div class="pix-seen-grid">${sorted.map(posterTileHtml).join('')}</div>`;
    bindCardFold(body);
  };
  document.getElementById('sortBy').onchange = render;
  render();
}

/* The five Story sections read one archive (GET /api/notes) and filter
   by kind exactly as the artifact's components do. */
const STORY_SECTIONS = {
  'dream-log': { kicker: 'Night transmissions', title: 'Dream Log', kinds: ['dream'], empty: 'No dream entries yet.' },
  'poster': { kicker: 'Story / Concept archive', title: 'Poster Gallery', kinds: ['poster'], empty: 'No poster notes yet.' },
  'monsters': { kicker: 'Creature index', title: 'Monsters', kinds: ['monster'], empty: 'No monster entries yet.' },
  'notes': { kicker: 'Field desk', title: 'Notes', kinds: ['dream', 'monster', 'poster'], empty: 'No notes filed yet.' },
  'publish': { kicker: 'Public edition', title: 'Publish', kinds: ['poster', 'monster'], empty: 'Nothing in the public edition yet.' },
};
function storyNoteHtml(n, selectedKey) {
  return `<article class="pix-story-note${n.entity_key && n.entity_key === selectedKey ? ' is-selected' : ''}" id="note-${esc(n.entity_key || n.id)}">
    <h2>${esc(n.title || 'Untitled')}</h2>
    ${n.note_date || n.tags ? `<p class="pix-film-meta">${n.note_date ? esc(String(n.note_date).slice(0, 10)) : ''}${n.note_date && n.tags ? ' · ' : ''}${n.tags ? esc(n.tags) : ''}</p>` : ''}
    ${n.body ? `<p>${esc(n.body)}</p>` : ''}</article>`;
}
async function viewStory(kind) {
  const cfg = STORY_SECTIONS[kind];
  mount(kind, `<section class="pix-home-section pix-content-width">
    <p class="pix-kicker">${esc(cfg.kicker)}</p><h1>${esc(cfg.title)}</h1>
    <div id="storyBody"><p class="pix-status">opening the archive…</p></div></section>`);
  const body = document.getElementById('storyBody');
  if (!body) return;
  const j = await api('/api/notes').catch(() => null);
  const all = (j && j.ok && j.notes) || [];
  let entries = all.filter((n) => cfg.kinds.includes(n.kind));
  if (kind === 'monsters') entries = [...entries].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
  const memos = all.filter((n) => n.kind === 'memo');
  const scratch = kind === 'notes' ? all.find((n) => n.kind === 'scratchpad') : null;
  const selectedKey = kind === 'poster' ? (location.hash.split('/')[2] || null) : null;
  body.innerHTML =
    (scratch ? `<article class="pix-story-note is-scratchpad"><p class="pix-kicker">SCRATCHPAD</p><h2>${esc(scratch.title || 'Scratchpad')}</h2>${scratch.body ? `<p>${esc(scratch.body)}</p>` : ''}</article>` : '')
    + (entries.length ? entries.map((n) => storyNoteHtml(n, selectedKey)).join('') : `<p class="pix-status">${esc(cfg.empty)}</p>`)
    + (memos.length && kind !== 'poster' ? `<h2 class="pix-story-sub">Memos</h2>` + memos.map((n) => storyNoteHtml(n, null)).join('') : '');
  if (selectedKey) {
    const el = document.getElementById('note-' + selectedKey);
    if (el) el.scrollIntoView({ block: 'start' });
  }
}


/* ---------------- SEARCH (P0-2) ---------------- */
async function viewSearch(q) {
  const term = String(q || '').trim();
  mount('', `
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><span>09</span><h2>SEARCH</h2></div>
        <div class="pix-home-row-tagline"><p>Title and synopsis, across the whole catalog</p></div></div>
      <div class="pix-header-search" style="margin-bottom:14px">
        <input class="pix-header-search-input" id="searchPageInput" type="search" value="${esc(term)}"
               placeholder="Search films or a mood…" aria-label="Search films" autocomplete="off"
               style="width:100%;max-width:520px">
      </div>
      <div class="pix-seen-grid" id="sres"><p class="pix-status">${term ? 'searching…' : 'Type at least two letters.'}</p></div>
    </section>`);
  const input = document.getElementById('searchPageInput');
  const box = document.getElementById('sres');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const v = input.value.trim();
      if (v.length >= 2) location.hash = '#/search/' + encodeURIComponent(v);
    }
  });
  if (term.length < 2) return;
  const j = await api('/api/search?q=' + encodeURIComponent(term));
  if (!j.ok) { box.innerHTML = errHtml(j.error); return; }
  const films = j.films || [];
  if (!films.length) { box.innerHTML = `<p class="pix-status">Nothing in the catalog matches “${esc(term)}”.</p>`; return; }
  box.innerHTML = `<p class="pix-kicker pix-content-width">${j.total} film${j.total === 1 ? '' : 's'}</p>` +
    films.map(loopCard).join('');
  bindCardFold(box);
  box.querySelectorAll('img').forEach((img) => img.addEventListener('error', () => {
    const card = img.closest('.pix-foldout-card');
    if (card) card.remove();
  }, { once: true }));
}

/* ---------------- TOP 500 ---------------- */
let top500Scale = 1;
const T5_KEY = 'pix-top500-poster-scale';
function t5Cols() {
  const base = window.innerWidth >= 1040 ? 8 : window.innerWidth >= 700 ? 6 : 4;
  return Math.max(2, Math.min(24, Math.round(base / top500Scale)));
}
function t5Apply() {
  const grid = document.getElementById('t5groups');
  if (grid) grid.style.setProperty('--pix-t5-cols', String(t5Cols()));
  const lbl = document.getElementById('t5scale');
  if (lbl) lbl.textContent = top500Scale.toFixed(2) + '×';
}

/* Top 500: collapsible hundreds (Top 100 open, 200–500 minimized); the poster
   click MARKS SEEN and never navigates — links live in the options fold
   (settings.json → top500). */
async function viewTop500() {
  try { top500Scale = Number(localStorage.getItem(T5_KEY)) || 1; } catch { top500Scale = 1; }
  mount('top500', `
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><span>02</span><h2>TOP 500</h2></div>
        <div class="pix-home-row-tagline"><p>Ranked by community wins · clicking a poster marks it seen</p>
          <div class="pix-size-tool" role="group" aria-label="SIZER poster scale">
            <span class="pix-size-label">SIZER</span>
            <button type="button" data-size="down" aria-label="Smaller posters">−</button>
            <output id="t5scale">${top500Scale.toFixed(2)}×</output>
            <button type="button" data-size="up" aria-label="Larger posters">+</button>
          </div>
        </div>
      </div>
      <div id="t5groups"><p class="pix-status">loading…</p></div>
    </section>`);

  document.getElementById('t5scale').textContent = top500Scale.toFixed(2) + '×';
  document.querySelectorAll('[data-size]').forEach((b) => (b.onclick = () => {
    const step = b.dataset.size === 'down'
      ? (top500Scale <= 1.2 ? 0.05 : 0.2)
      : (top500Scale < 1.0 ? 0.05 : 0.2);
    top500Scale = b.dataset.size === 'down' ? top500Scale - step : top500Scale + step;
    top500Scale = Math.max(0.3, Math.min(2.2, Math.round(top500Scale / 0.05) * 0.05));
    try { localStorage.setItem(T5_KEY, String(top500Scale)); } catch { /* ignore */ }
    t5Apply();
  }));

  const j = await api('/api/top500?limit=500');
  if (!j.ok) { document.getElementById('t5groups').innerHTML = errHtml(j.error); return; }
  const ml = session ? await api('/api/lists/mine') : { ok: false, lists: [] };
  const myLists = ml.ok ? ml.lists : [];
  const films = j.films || [];
  const groups = [];
  for (let i = 0; i < films.length; i += 100) groups.push(films.slice(i, i + 100));

  document.getElementById('t5groups').innerHTML = groups.map((g, gi) => `
    <section class="pix-t5-group${gi === 0 ? ' is-open' : ''}" data-group="${gi}">
      <button class="pix-t5-group-head" aria-expanded="${gi === 0}">
        <span>#${g[0].rank}–#${g[g.length - 1].rank}</span>
        <span class="pix-dim">${g.length} films</span>
        <span class="pix-t5-group-chevron">${gi === 0 ? '−' : '+'}</span>
      </button>
      <div class="pix-t5-grid-wrap"><div class="pix-t5-grid" id="t5grid-${gi}"></div></div>
    </section>`).join('');

  groups.forEach((g, gi) => {
    document.getElementById('t5grid-' + gi).innerHTML = g.map((m) => {
      const seen = seenSet.has(m.imdb_id);
      return `<article class="pix-top500-card${seen ? ' is-seen' : ''}" data-card="${esc(m.imdb_id)}">
        <button class="pix-top500-poster${seen ? ' is-seen' : ''}" data-seen="${esc(m.imdb_id)}" aria-pressed="${seen}"
          aria-label="Mark ${esc(m.title)} as seen">
          <img loading="lazy" src="/api/poster?imdb=${esc(m.imdb_id)}&key=${esc(m.poster_key || '')}"
               alt="${esc(m.title)} movie poster" decoding="async">
          <span class="pix-top500-rating">#${String(m.rank).padStart(3, '0')}</span>
          <span class="pix-top500-seen-hint" aria-hidden="true">✓</span>
        </button>
        <div class="pix-top500-caption"><strong>${esc(m.title)}</strong><span>${esc(m.release_year || '')}</span></div>
        <div class="pix-top500-options">
          <button class="pix-top500-options-trigger" aria-expanded="false">
            <span class="pix-top500-rank">#${String(m.rank).padStart(3, '0')}</span>
            <span class="pix-top500-options-word">Options</span>
          </button>
          <div class="pix-top500-fold" hidden>
            <div class="pix-top500-fold-buttons">
              <button data-nav="#/film/${esc(m.imdb_id)}">Film page</button>
              <button data-nav="#/film/${esc(m.imdb_id)}">Review</button>
              <button data-nav="#/showcase">Discuss</button>
              <button data-seen-toggle="${esc(m.imdb_id)}">${seen ? 'Remove from seen' : 'Mark seen'}</button>
            </div>
            <div class="pix-t5-verdicts">
              <button data-iv="want_to_see"${interestMap[m.imdb_id] === 'want_to_see' ? ' class="is-on"' : ''}>Want to see</button>
              <button data-iv="maybe"${interestMap[m.imdb_id] === 'maybe' ? ' class="is-on"' : ''}>Maybe</button>
              <button data-iv="not_interested"${interestMap[m.imdb_id] === 'not_interested' ? ' class="is-on"' : ''}>No thanks</button>
            </div>
            <button data-fav-toggle="${esc(m.imdb_id)}"${(reactionMap[m.imdb_id] || []).includes('Favorite') ? ' class="is-on"' : ''} aria-pressed="${(reactionMap[m.imdb_id] || []).includes('Favorite')}">★ Favorite</button>
            ${reactionFoldHtml(m)}
            ${moodFoldHtml(m)}
            ${session ? `<div class="pix-t5-move">
              <select data-move-list="${esc(m.imdb_id)}">${myLists.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}${groupSuggestions(m).map((n) => `<option value="suggest:${esc(n)}">✦ ${esc(n)} (new group)</option>`).join('')}</select>
              <button data-move-go="${esc(m.imdb_id)}">Move to List</button>
            </div>` : ''}
          </div>
        </div>
      </article>`;
    }).join('');
  });

  document.querySelectorAll('.pix-t5-group-head').forEach((h) => (h.onclick = () => {
    const sec = h.parentElement;
    const open = !sec.classList.contains('is-open');
    sec.classList.toggle('is-open', open);
    h.setAttribute('aria-expanded', String(open));
    h.querySelector('.pix-t5-group-chevron').textContent = open ? '−' : '+';
    t5Apply();
  }));
  document.querySelectorAll('.pix-top500-options-trigger').forEach((t) => (t.onclick = (e) => {
    e.stopPropagation();
    const fold = t.nextElementSibling;
    const open = fold.hidden;
    fold.hidden = !open;
    t.setAttribute('aria-expanded', String(open));
    t.closest('.pix-top500-card').querySelector('.pix-top500-options').classList.toggle('is-open', open);
  }));
  document.querySelectorAll('[data-seen]').forEach((b) => (b.onclick = () => toggleSeen(b.dataset.seen, b.closest('.pix-top500-card'))));
  document.querySelectorAll('[data-seen-toggle]').forEach((b) => (b.onclick = async (e) => {
    e.stopPropagation();
    await toggleSeen(b.dataset.seenToggle, b.closest('.pix-top500-card'));
  }));
  bindReactions(document.getElementById('view'));
  bindFavorites(document.getElementById('view'));
  paintMarks(document.getElementById('view'));
  document.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => (location.hash = b.dataset.nav)));
  document.querySelectorAll('.pix-top500-fold [data-iv]').forEach((b) => (b.onclick = async () => {
    if (!session) { location.hash = '#/auth'; return; }
    const id = b.closest('.pix-top500-card').dataset.card;
    const r = await api('/api/interest', { method: 'POST', body: JSON.stringify({ imdb_id: id, interest: b.dataset.iv }) });
    if (!r.ok) return;
    interestMap[id] = b.dataset.iv;
    b.parentElement.querySelectorAll('[data-iv]').forEach((x) => x.classList.toggle('is-on', x === b));
    paintMarks(document.getElementById('view'));
  }));
  document.querySelectorAll('[data-move-go]').forEach((b) => (b.onclick = async () => {
    const id = b.dataset.moveGo;
    const sel = b.parentElement.querySelector('[data-move-list]');
    if (!sel.value) return;
    const name = await fileToGroup(id, sel.value);
    b.textContent = name ? `✓ Filed to ${name}` : 'failed';
  }));
  t5Apply();
  window.addEventListener('resize', t5Apply, { once: true });
}

async function toggleSeen(id, card) {
  if (!session) { location.hash = '#/auth'; return; }
  const next = !seenSet.has(id);
  const j = await api('/api/seen', { method: 'POST', body: JSON.stringify({ imdb_id: id, seen: next }) });
  if (!j.ok) return;
  if (next) seenSet.add(id); else seenSet.delete(id);
  const btn = card?.querySelector('.pix-top500-poster');
  if (btn) { btn.classList.toggle('is-seen', next); btn.setAttribute('aria-pressed', String(next)); }
  card?.classList.toggle('is-seen', next);
  const tg = card?.querySelector('[data-seen-toggle]');
  if (tg) tg.textContent = next ? 'Remove from seen' : 'Mark seen';
  dnaStats = null; refreshDna();
  paintMarks(document);
}

/* ---------------- SEEN archive ---------------- */
const SEEN_KEY = 'pix-seen-poster-scale';
const SEEN_EARLIEST = 1895, SEEN_LATEST = 2026;
function seenCols(scale) {
  const base = window.innerWidth >= 1040 ? 8 : window.innerWidth >= 700 ? 6 : 4;
  return Math.max(2, Math.min(24, Math.round(base / 2 / scale)));
}
async function viewSeen() {
  let scale = 1;
  try { scale = Number(localStorage.getItem(SEEN_KEY)) || 1; } catch { scale = 1; }
  mount('seen', `
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><span>03</span><h2>SEEN</h2></div>
        <div class="pix-home-row-tagline"><p>Every year, every poster · 2026 back to ${SEEN_EARLIEST}</p>
          <div class="pix-size-tool" role="group" aria-label="SIZER year-card scale">
            <span class="pix-size-label">SIZER</span>
            <button type="button" data-size="down" aria-label="Smaller tiles">−</button>
            <output id="seenscale">${scale.toFixed(2)}×</output>
            <button type="button" data-size="up" aria-label="Larger tiles">+</button>
          </div>
        </div>
      </div>
      <div class="pix-seen-archive" id="ygrid"><p class="pix-status">loading…</p></div>
    </section>`);
  const j = await api('/api/seen/years');
  if (!j.ok) { document.getElementById('ygrid').innerHTML = errHtml(j.error); return; }
  const counts = new Map(j.years.map((y) => [Number(y.year), y.movies]));
  const grid = document.getElementById('ygrid');
  const paint = () => {
    grid.style.setProperty('--pix-seen-cols', String(seenCols(scale)));
    document.getElementById('seenscale').textContent = scale.toFixed(2) + '×';
    let html = '';
    for (let y = SEEN_LATEST; y >= SEEN_EARLIEST; y -= 1) {
      const n = counts.get(y) || 0;
      html += n
        ? `<a class="pix-seen-year" href="#/seen/${y}"><b>${y}</b><span>${n} film${n === 1 ? '' : 's'}</span></a>`
        : `<span class="pix-seen-year is-empty" aria-disabled="true"><b>${y}</b><span>no films</span></span>`;
    }
    grid.innerHTML = html;
  };
  paint();
  document.querySelectorAll('[data-size]').forEach((b) => (b.onclick = () => {
    const step = b.dataset.size === 'down'
      ? (scale <= 1.2 ? 0.05 : 0.2) : (scale < 1.0 ? 0.05 : 0.2);
    scale += b.dataset.size === 'down' ? -step : step;
    scale = Math.max(0.3, Math.min(2.2, Math.round(scale / 0.05) * 0.05));
    try { localStorage.setItem(SEEN_KEY, String(scale)); } catch { /* ignore */ }
    paint();
  }));
}

async function viewSeenYear(year) {
  mount('seen', `
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><span>03</span><h2>${esc(year)}</h2></div>
        <div class="pix-home-row-tagline"><p>Every poster from ${esc(year)}</p></div></div>
      <div class="pix-seen-grid" id="yfilms"><p class="pix-status">loading…</p></div>
    </section>`);
  const j = await api('/api/seen/' + encodeURIComponent(year));
  if (!j.ok) { document.getElementById('yfilms').innerHTML = errHtml(j.error); return; }
  const box = document.getElementById('yfilms');
  /* HOVER coverage (Founder, 2026-11-06): every list/group view carries the
     hover fold with the REACTION VOCAB — the year grid renders foldout
     cards, not bare tiles. */
  box.innerHTML = j.movies.map(loopCard).join('') || '<p class="pix-status">No films for this year.</p>';
  bindCardFold(box);
  /* no-poster-no-slot: a tile whose artwork will not load leaves the grid
     entirely, rather than sitting there as a blank black rectangle. */
  box.querySelectorAll('img').forEach((img) => img.addEventListener('error', () => {
    const card = img.closest('.pix-foldout-card');
    if (card) card.remove();
    if (!box.querySelector('.pix-foldout-card')) box.innerHTML = '<p class="pix-status">No poster-backed films for this year yet.</p>';
  }, { once: true }));
}

/* ---------------- ATTRACTIONS ---------------- */
async function viewAttractions() {
  mount('attractions', `
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><span>01</span><h2>ATTRACTIONS</h2></div>
        <div class="pix-home-row-tagline"><p>Why visit PIX.MOV — four ways in</p></div></div>
      <div id="arows"><p class="pix-status">loading…</p></div>
    </section>`);
  const j = await api('/api/attractions');
  if (!j.ok) { document.getElementById('arows').innerHTML = errHtml(j.error); return; }
  const { top500, grossers, reviews } = j.rows;
  const row = (title, note, films, more) => `
    <section class="pix-home-section">
      <div class="pix-home-section-heading"><div><h2>${esc(title)}</h2></div>
        <div class="pix-home-row-tagline"><p>${esc(note)}</p>${more || ''}</div></div>
      <div class="pix-glide-track">${films.map(loopCard).join('')}</div>
    </section>`;
  const reviewCards = (reviews || []).map((r) => `
    <article class="pix-foldout-card" data-hover-type="0">
      <div class="pix-film-panel">
        <p class="pix-kicker">${esc(r.title || r.imdb_id)}</p>
        <p>${r.rating ? `<span class="stars">${'★'.repeat(r.rating)}</span> ` : ''}${esc((r.body || '').slice(0, 180))}</p>
        <p class="pix-footer-note">${esc(r.user_label || 'A PIX fan')}</p>
      </div></article>`).join('');
  document.getElementById('arows').innerHTML = `
    ${row('ROW 1 · TOP 500', 'The films the community keeps choosing', top500,
      '<a class="pix-attraction-btn" href="#/top500">Open the Top 500 →</a>')}
    ${row('ROW 2 · BOX OFFICE', grossers.length ? 'Biggest financial success (COMB)' : 'COMB grossers not imported yet', grossers)}
    <section class="pix-home-section">
      <div class="pix-home-section-heading"><div><h2>ROW 4 · FRIENDS' REVIEWS</h2></div>
        <div class="pix-home-row-tagline"><p>What the room is saying</p></div></div>
      <div class="pix-attractions-reviews">${reviewCards || '<p class="pix-status">No reviews yet.</p>'}</div>
    </section>`;
  /* The rows are injected after mount(), so mount's global [data-nav]
     binding never reaches these cards — every control in the fold (the
     poster itself, Film page, Review, Discuss, the seen toggle) was dead
     on this page, and the seen toggle sat in its fold looking like a
     stray image frame instead of a working button (Founder report
     2026-11-06). Bind exactly as Top 500 and the landing rows do. */
  bindCardFold(document.getElementById('arows'));
}

/* ---------------- USERS LISTS ---------------- */
async function viewLists() {
  mount('lists', `
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><span>05</span><h2>PIX.MOV LISTS</h2></div>
        <div class="pix-home-row-tagline"><p>Lists are made in Profile · open one to watch it</p></div></div>
      <div id="newlist"></div>
      <div class="pix-list-grid" id="lists"><p class="pix-status">loading…</p></div>
    </section>`);
  if (session) {
    document.getElementById('newlist').innerHTML = `
      <div class="pix-film-panel">
        <p class="pix-kicker">NEW LIST</p>
        <div class="pix-filter-row"><label for="nlName">Name</label><input id="nlName" placeholder="Slasher Season"></div>
        <div class="pix-filter-row"><label for="nlDesc">Note</label><input id="nlDesc" placeholder="What is this list for?"></div>
        <div class="actions"><button class="pix-tough-button" id="nlGo" type="button">Create list</button></div>
        <div id="nlErr"></div>
      </div>`;
    document.getElementById('nlGo').onclick = async () => {
      const r = await api('/api/lists', { method: 'POST', body: JSON.stringify({
        name: document.getElementById('nlName').value,
        description: document.getElementById('nlDesc').value }) });
      if (!r.ok) { document.getElementById('nlErr').innerHTML = errHtml(r.error); return; }
      location.hash = '#/lists/' + r.id;
    };
  } else {
    document.getElementById('newlist').innerHTML = '<p class="pix-status">Sign in to create your own lists — creation lives in Profile.</p>';
  }
  const j = await api('/api/lists');
  const lists = j.lists || [];
  document.getElementById('lists').innerHTML = lists.map((l) => `
    <div class="pix-list-entry">
      <a class="pix-list-card" href="#/lists/${l.id}">
        <b>${esc(l.name)}</b>
        <span class="pix-dim">${l.items} film${l.items === 1 ? '' : 's'}</span>
        ${l.description ? `<span class="pix-list-note">${esc(l.description)}</span>` : ''}
      </a>
      <p class="pix-list-byline">by ${l.user_id ? `<a href="#/fan/${esc(l.user_id)}">${esc(l.user_label || 'A PIX fan')}</a>` : esc(l.user_label || 'A PIX fan')}</p>
    </div>`).join('') || '<p class="pix-status">No public lists yet.</p>';
}

async function viewListDetail(id) {
  mount('lists', `<div id="ld"><p class="pix-status">loading…</p></div>`);
  const j = await api('/api/lists/' + encodeURIComponent(id));
  const box = document.getElementById('ld');
  if (!j.ok) { box.innerHTML = errHtml(j.error); return; }
  const { list, items } = j;
  box.innerHTML = `
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><span>05</span><h2>${esc(list.name)}</h2></div>
        <div class="pix-home-row-tagline"><p>${esc(list.description || '')}</p>
          <button class="pix-attraction-btn" id="shareList" type="button">Copy share link</button></div></div>
      <p class="pix-list-byline">A list by ${list.user_id ? `<a href="#/fan/${esc(list.user_id)}">${esc(list.user_label || 'A PIX fan')}</a>` : esc(list.user_label || 'A PIX fan')}</p>
      <div id="listStats"></div>
      <div class="pix-seen-grid">${items.map(loopCard).join('') || '<p class="pix-status">Empty list.</p>'}</div>
    </section>`;
  api('/api/stats/list?id=' + encodeURIComponent(list.id)).then((r) => {
    const elx = document.getElementById('listStats');
    if (elx && r.ok) elx.innerHTML = statsBandHtml(r.stats, r.films);
  }).catch(() => {});
  const share = document.getElementById('shareList');
  share.onclick = async () => {
    const url = location.origin + location.pathname + '#/lists/' + list.id;
    try { await navigator.clipboard.writeText(url); share.textContent = '✓ Link copied'; } catch { share.textContent = url; }
  };
  bindCardFold(box);
  if (list.user_id) {
    api('/api/fans/' + encodeURIComponent(list.user_id)).then((fr) => {
      if (!fr.ok || !fr.lists) return;
      const others = fr.lists.filter((x) => String(x.id) !== String(list.id));
      if (!others.length) return;
      const rail = document.createElement('div');
      rail.innerHTML = `<h3 class="pix-fan-more">More lists by ${esc(fr.fan.label)}</h3>` + others.map((x) => `<a class="pix-list-card" href="#/lists/${x.id}"><b>${esc(x.name)}</b> <span class="pix-dim">${x.items} film${x.items === 1 ? '' : 's'}</span></a>`).join('');
      const sec = box.querySelector('section');
      if (sec) sec.appendChild(rail);
    }).catch(() => {});
  }
}

/* ---------------- FAN SHOWCASE (USER PERSONA, 1.00.24) ---------------- */
/* ---------------- friends (1.00.29) ---------------- */
let friendsCache = null;
async function loadFriends() {
  if (!session) return [];
  if (friendsCache) return friendsCache;
  const j = await api('/api/friends/mine');
  friendsCache = j.ok ? (j.friends || []) : [];
  return friendsCache;
}
function friendWhen(ts) {
  try { return new Date(Number(ts)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch { return ''; }
}
function fbRowHtml(it) {
  return `<div class="pix-friend-fb">
    <select data-fb-stance aria-label="Your stance">
      <option value="">Stance…</option>
      <option${it.my_stance === 'Agree' ? ' selected' : ''}>Agree</option>
      <option${it.my_stance === 'Same here' ? ' selected' : ''}>Same here</option>
      <option${it.my_stance === 'Hard disagree' ? ' selected' : ''}>Hard disagree</option>
    </select>
    <input data-fb-body maxlength="500" placeholder="Say something (optional)">
    <button data-fb-send data-kind="${it.kind}" data-ref="${esc(it.id)}" data-to="${esc(it.user_id)}">Send feedback</button>
    <span class="pix-dim" data-fb-note>${it.feedback_count ? `${it.feedback_count} feedback` : ''}${it.my_stance ? ` · you: ${esc(it.my_stance)}` : ''}</span>
  </div>`;
}
function bindFriendFeedback(root) {
  root.querySelectorAll('[data-fb-send]').forEach((btn) => {
    btn.onclick = async () => {
      const wrap = btn.closest('.pix-friend-fb');
      const stance = wrap.querySelector('[data-fb-stance]').value;
      const body = wrap.querySelector('[data-fb-body]').value.trim();
      const note = wrap.querySelector('[data-fb-note]');
      if (!stance && !body) { note.textContent = 'pick a stance or write a line'; return; }
      btn.disabled = true;
      const j = await api('/api/friends/feedback', { method: 'POST', body: JSON.stringify({
        to_user_id: btn.dataset.to, kind: btn.dataset.kind, ref_id: btn.dataset.ref, stance, body }) });
      note.textContent = j.ok ? 'Feedback sent ✓' : (j.error || 'could not send');
      btn.disabled = false;
    };
  });
}
async function viewFriends() {
  if (!session) {
    mount('friends', `<section class="pix-home-section pix-content-width">
      <p class="pix-kicker">FRIENDS</p>
      <div class="pix-home-section-heading"><div><h2>Friends</h2></div></div>
      <p class="pix-dim">Sign in to add friends and follow their picks.</p>
      <p><a class="pix-attraction-btn" href="#/auth">Sign in / create account</a></p></section>`);
    return;
  }
  mount('friends', `<section class="pix-home-section pix-content-width">
    <p class="pix-kicker">FRIENDS</p>
    <div class="pix-home-section-heading"><div><h2>Friends</h2></div></div>
    <div id="friendsBox"><p class="pix-status">loading…</p></div></section>`);
  const [mine, feed, inbox] = await Promise.all([
    api('/api/friends/mine'), api('/api/friends/feed'), api('/api/friends/feedback/mine')]);
  const box = document.getElementById('friendsBox');
  if (!box) return;
  const friends = mine.ok ? (mine.friends || []) : [];
  friendsCache = friends;
  const items = feed.ok ? (feed.items || []) : [];
  const got = inbox.ok ? (inbox.items || []) : [];
  const pickHtml = (it) => `<article class="pix-friend-item">
      <p class="pix-friend-head"><a class="pix-fan-link" href="#/fan/${esc(it.user_id)}">${esc(it.label)}</a>
        picked <b>${esc(it.winner.title)}</b> over ${esc(it.loser.title)} <span class="pix-dim">· ${friendWhen(it.created_at)}</span></p>
      <div class="pix-friend-pick">
        ${loopCard(it.winner)}
        <span class="pix-friend-vs">over</span>
        <span class="pix-friend-loser">${loopCard(it.loser)}</span>
      </div>
      ${fbRowHtml(it)}
    </article>`;
  const postHtml = (it) => `<article class="pix-friend-item">
      <p class="pix-friend-head"><a class="pix-fan-link" href="#/fan/${esc(it.user_id)}">${esc(it.label)}</a>
        posted on <a href="#/film/${esc(it.film.imdb_id)}"><b>${esc(it.film.title)}</b>${it.film.release_year ? ` (${esc(it.film.release_year)})` : ''}</a>
        <span class="pix-dim">· ${friendWhen(it.created_at)}</span></p>
      <div class="pix-friend-pick">${loopCard(it.film)}</div>
      ${it.rating ? `<p><span class="stars">${'★'.repeat(Math.max(0, Math.min(5, it.rating)))}</span>${it.stance ? ` <span class="pix-stance-chip">${esc(it.stance)}</span>` : ''}</p>` : (it.stance ? `<p><span class="pix-stance-chip">${esc(it.stance)}</span></p>` : '')}
      ${it.body ? `<p>${esc(it.body.slice(0, 240))}</p>` : ''}
      ${fbRowHtml(it)}
    </article>`;
  box.innerHTML = `
    <h3 class="pix-friend-h">Your friends</h3>
    <div>${friends.map((f) => `<span class="pix-friend-chip"><a class="pix-fan-link" href="#/fan/${esc(f.user_id)}">${esc(f.label)}</a>
      <button data-unfriend="${esc(f.user_id)}" aria-label="Remove ${esc(f.label)}">×</button></span>`).join('')
      || '<p class="pix-dim">No friends yet — open a fan\'s showcase from their lists or comments and tap Add friend.</p>'}</div>
    <h3 class="pix-friend-h">Friend activity</h3>
    <div>${items.map((it) => it.kind === 'pick' ? pickHtml(it) : postHtml(it)).join('')
      || '<p class="pix-dim">Nothing yet. When a friend makes a PIX MIX pick or posts, it lands here. Picks are recorded per fan from today forward.</p>'}</div>
    <h3 class="pix-friend-h">Feedback on your activity</h3>
    <div>${got.map((g) => `<article class="pix-friend-item">
      <p class="pix-friend-head"><a class="pix-fan-link" href="#/fan/${esc(g.from_user_id)}">${esc(g.from_label)}</a>
      ${g.stance ? `<span class="pix-stance-chip">${esc(g.stance)}</span>` : ''} on ${esc(g.context)}
      <span class="pix-dim">· ${friendWhen(g.created_at)}</span></p>
      ${g.body ? `<p>${esc(g.body)}</p>` : ''}</article>`).join('')
      || '<p class="pix-dim">No feedback yet.</p>'}</div>`;
  box.querySelectorAll('[data-unfriend]').forEach((b) => (b.onclick = async () => {
    await api('/api/friends/remove', { method: 'POST', body: JSON.stringify({ friend_id: b.dataset.unfriend }) });
    friendsCache = null;
    viewFriends();
  }));
  bindFriendFeedback(box);
  bindCardFold(box);
  paintMarks(box);
}
async function wireFanFriend(userId) {
  const row = document.getElementById('fanFriendRow');
  if (!row || !session) return;
  const me = session.user && session.user.id;
  if (!me || me === userId) return;
  const friends = await loadFriends();
  const isFriend = friends.some((f) => f.user_id === userId);
  row.innerHTML = `<button class="pix-attraction-btn" id="fanFriendBtn">${isFriend ? '✓ Friend — tap to remove' : '＋ Add friend'}</button>`;
  document.getElementById('fanFriendBtn').onclick = async () => {
    const now = (await loadFriends()).some((f) => f.user_id === userId);
    await api(now ? '/api/friends/remove' : '/api/friends', { method: 'POST', body: JSON.stringify({ friend_id: userId }) });
    friendsCache = null;
    wireFanFriend(userId);
  };
}

async function viewFan(userId) {
  mount('lists', `<div id="fanbox"><p class="pix-status">loading…</p></div>`);
  const j = await api('/api/fans/' + encodeURIComponent(userId));
  const box = document.getElementById('fanbox');
  if (!j.ok) { box.innerHTML = errHtml(j.error || 'fan not found'); return; }
  const lists = j.lists || [];
  const films = lists.reduce((n, l) => n + (l.items || 0), 0);
  box.innerHTML = `
    <section class="pix-home-section pix-content-width">
      <p class="pix-kicker">FAN SHOWCASE</p>
      <div class="pix-home-section-heading"><div><span>★</span><h2>${esc(j.fan.label)}</h2></div></div>
      <p class="pix-dim">${lists.length} public list${lists.length === 1 ? '' : 's'} · ${films} film${films === 1 ? '' : 's'} listed</p>
      <div>${lists.map((l) => `
        <a class="pix-list-card" href="#/lists/${l.id}">
          <b>${esc(l.name)}</b>
          <span class="pix-dim">${l.items} film${l.items === 1 ? '' : 's'}</span>
          ${l.description ? `<span class="pix-list-note">${esc(l.description)}</span>` : ''}
        </a>`).join('') || '<p class="pix-status">No public lists yet.</p>'}</div>
      <div id="fanReviews"></div>
      <div id="fanFriendRow" style="margin-top:12px"></div>
    </section>`;
  const revs = j.reviews || [];
  const rvBox = document.getElementById('fanReviews');
  if (rvBox && revs.length) rvBox.innerHTML = `<h3 class="pix-friend-h">Movie reviews</h3>` + revs.map((r) => `
    <article class="pix-friend-item">
      <p class="pix-friend-head">on <a href="#/film/${esc(r.imdb_id)}"><b>${esc(r.f_title || r.imdb_id)}</b>${r.f_year ? ` (${esc(r.f_year)})` : ''}</a>
      ${r.rating ? `<span class="stars">${'★'.repeat(Math.max(0, Math.min(5, r.rating)))}</span>` : ''}
      ${r.stance ? `<span class="pix-stance-chip">${esc(r.stance)}</span>` : ''}
      ${r.why_tag ? `<span class="pix-why-chip">${esc(r.why_tag)}</span>` : ''}</p>
      ${r.body ? `<p>${esc(r.body.slice(0, 240))}</p>` : ''}
    </article>`).join('');
  wireFanFriend(userId);
}

/* ---------------- film page ---------------- */
async function viewFilm(imdb) {
  mount('', `<div class="pix-film-page" id="filmbox"><p class="pix-status">loading…</p></div>`);
  const box = document.getElementById('filmbox');
  const j = await api('/api/film/' + encodeURIComponent(imdb));
  if (!j.ok) { box.innerHTML = errHtml(j.error || 'not found'); return; }
  const f = j.film;
  const mine = j.mine || null;
  const seen = seenSet.has(f.imdb_id);
  const iv = interestMap[f.imdb_id] || 'none';
  /* Film page chrome per settings.json → filmPages: Back returns to the last
     visited page; the title band carries + Add to list; two views —
     MY SCREENING (personal) and REVIEW (live comments + rankings). */
  const backTo = (() => { try { return sessionStorage.getItem('pix-last-route') || '#/'; } catch { return '#/'; } })();
  box.innerHTML = `
    <button class="pix-back-button" id="filmBack" type="button"><span aria-hidden="true">‹</span> Back</button>
    <div class="pix-feature-poster pix-film-feature" data-mq-id="${esc(f.imdb_id)}">
      <img src="${esc(f.poster_hint)}" alt="${esc(f.title)} movie poster">
      <div class="pix-feature-poster-overlay"><span>${esc(f.genre || '')}</span>${j.rank ? `<span>#${String(j.rank).padStart(3, '0')}</span>` : ''}</div>
    </div>
    <div class="pix-feature-title-band">
      <h1>${esc(titleYear(f.title, f.release_year))}</h1>
      <span class="pix-add-to-list" id="addtolist"></span>
    </div>
    <section class="pix-home-section pix-content-width pix-film-cols">
      <div>
        <p class="pix-film-meta">${esc(f.genre || '')} · ${f.wins} wins / ${f.losses} losses · ${f.appearances} appearances</p>
        ${f.synopsis
          ? `<p class="pix-film-synopsis">${esc(f.synopsis)}</p>
             ${f.synopsis_source_url ? `<p class="pix-footer-note">Synopsis via <a href="${esc(f.synopsis_source_url)}" target="_blank" rel="noopener">the source article →</a></p>` : ''}`
          : `<p class="pix-film-synopsis pix-dim">No synopsis on record for this title yet — the source link carries the write-up.</p>`}
        ${f.source_url ? `<p><a href="${esc(f.source_url)}" target="_blank" rel="noopener">More info →</a></p>` : ''}
        <div class="pix-film-actions">
          <button class="pix-film-seen${seen ? ' is-seen' : ''}" id="filmSeen" aria-pressed="${seen}">${seen ? '✓ Seen' : 'Mark seen'}</button>
          <button class="pix-film-seen" id="filmWant" aria-pressed="${iv === 'want_to_see'}">${iv === 'want_to_see' ? '✓ Want to see' : 'Want to see'}</button>
          <button class="pix-film-seen" id="filmFav" aria-pressed="${(reactionMap[f.imdb_id] || []).includes('Favorite')}">${(reactionMap[f.imdb_id] || []).includes('Favorite') ? '★ Favorite' : '☆ Favorite'}</button>
        </div>
        <div class="pix-rx-film">${reactionFoldHtml(f)}${moodFoldHtml(f)}</div>
        <div class="pix-mood-fp" id="filmMoodFp"></div>
        <div id="filmStats"></div>
        <div id="filmStreaming"></div>
        <div class="pix-film-actions-continued">
        </div>
        <div class="pix-view-tabs" role="tablist">
          <button role="tab" data-tab="screening" aria-selected="true">MY SCREENING</button>
          <button role="tab" data-tab="review" aria-selected="false">REVIEW</button>
        </div>
      </div>
    </section>
    <section class="pix-home-section pix-content-width" id="tabPane"></section>`;

  document.getElementById('filmBack').onclick = () => (location.hash = backTo);
  document.getElementById('filmSeen').onclick = async () => {
    const next = !seenSet.has(f.imdb_id);
    const r = await api('/api/seen', { method: 'POST', body: JSON.stringify({ imdb_id: f.imdb_id, seen: next }) });
    if (!r.ok) return;
    if (next) seenSet.add(f.imdb_id); else seenSet.delete(f.imdb_id);
    const b = document.getElementById('filmSeen');
    b.classList.toggle('is-seen', next);
    b.setAttribute('aria-pressed', String(next));
    b.textContent = next ? '✓ Seen' : 'Mark seen';
    dnaStats = null; refreshDna();
  };
  document.getElementById('filmWant').onclick = async (e) => {
    const next = interestMap[f.imdb_id] === 'want_to_see' ? 'none' : 'want_to_see';
    const r = await api('/api/interest', { method: 'POST', body: JSON.stringify({ imdb_id: f.imdb_id, interest: next }) });
    if (!r.ok) return;
    if (next === 'none') delete interestMap[f.imdb_id]; else interestMap[f.imdb_id] = next;
    e.currentTarget.textContent = next === 'want_to_see' ? '✓ Want to see' : 'Want to see';
    e.currentTarget.setAttribute('aria-pressed', String(next === 'want_to_see'));
  };
  document.getElementById('filmFav').onclick = async (e) => {
    await toggleFavorite(f.imdb_id, null);
    const on = isFav(f.imdb_id);
    e.currentTarget.textContent = on ? '★ Favorite' : '☆ Favorite';
    e.currentTarget.setAttribute('aria-pressed', String(on));
  };
  bindReactions(box);
  bindMoods(box);
  api('/api/streaming?imdb=' + encodeURIComponent(f.imdb_id)).then((r) => {
    const elx = document.getElementById('filmStreaming');
    if (!elx || !r.ok || !r.offers || !r.offers.length) return;
    const STREAM_PRIO = ['Netflix', 'Max', 'HBO Max', 'Disney Plus', 'Hulu', 'Amazon Prime Video', 'Amazon Prime Video with Ads', 'Apple TV Plus', 'Paramount Plus', 'Peacock', 'Peacock Premium', 'Tubi TV'];
    const FREE_PROVIDERS = new Set(['Tubi TV', 'Pluto TV', 'The Roku Channel', 'Amazon Freevee', 'Freevee', 'Crackle', 'Plex', 'Kanopy', 'Hoopla']);
    const streams = r.offers.filter((o) => o.offer_type === 'stream');
    streams.sort((a, b) => { const ia = STREAM_PRIO.indexOf(a.provider), ib = STREAM_PRIO.indexOf(b.provider); return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.provider.localeCompare(b.provider); });
    const altLine = (label, t) => { const list = r.offers.filter((o) => o.offer_type === t); return list.length ? `<div class="pix-stream-alt">${label}: ${list.map((o) => `<a href="${esc(o.link_url)}" target="_blank" rel="noopener">${esc(o.provider)}</a>`).join(' · ')}</div>` : ''; };
    elx.innerHTML = `<div class="pix-now-showing"><div class="pix-stats-head">NOW SHOWING</div>
      ${streams.length ? `<div class="pix-stream-btns">${streams.map((o, i) => `<a class="${i === 0 ? 'pix-watch-btn' : 'pix-watch-alt'}" href="${esc(o.link_url)}" target="_blank" rel="noopener">${FREE_PROVIDERS.has(o.provider) ? 'Watch free on ' : 'Watch on '}${esc(o.provider)}</a>`).join('')}</div>` : ''}
      ${altLine('Rent', 'rent')}
      ${altLine('Buy', 'buy')}
      <p class="pix-stream-attr">Streaming data: TMDB / JustWatch</p></div>`;
  }).catch(() => {});
  api('/api/stats/film?imdb=' + encodeURIComponent(f.imdb_id)).then((r) => {
    const elx = document.getElementById('filmStats');
    if (elx && r.ok) elx.innerHTML = statsBandHtml(r.stats);
  }).catch(() => {});
  api('/api/moods/fingerprint?imdb=' + encodeURIComponent(f.imdb_id)).then((fp) => {
    const elx = document.getElementById('filmMoodFp');
    if (elx && fp.ok && fp.counts && fp.counts.length) {
      elx.textContent = 'Fans file this under: ' + fp.counts.slice(0, 3).map((c) => `${c.mood} ${c.n}`).join(' · ');
    }
  }).catch(() => {});
  paintMarks(box);

  /* + Add to list: only the viewer's OWN lists — creation lives in Profile. */
  const alBox = document.getElementById('addtolist');
  if (session) {
    const ml = await api('/api/lists/mine');
    if (ml.ok && ml.lists.length) {
      alBox.innerHTML = `
        <button class="pix-add-to-list-trigger" id="alBtn" aria-expanded="false">+ Add to list</button>
        <div class="pix-add-to-list-menu" id="alMenu" hidden>
          ${ml.lists.map((l) => `<button data-list="${l.id}">${esc(l.name)} <span class="pix-dim">(${l.items})</span></button>`).join('')}
        </div>`;
      const alBtn = document.getElementById('alBtn'), alMenu = document.getElementById('alMenu');
      alBtn.onclick = () => { const o = alMenu.hidden; alMenu.hidden = !o; alBtn.setAttribute('aria-expanded', String(o)); };
      alMenu.querySelectorAll('[data-list]').forEach((b) => (b.onclick = async () => {
        const r = await api('/api/lists/' + b.dataset.list + '/items',
          { method: 'POST', body: JSON.stringify({ imdb_id: imdb }) });
        alMenu.hidden = true; alBtn.setAttribute('aria-expanded', 'false');
        alBtn.textContent = r.ok ? '✓ Added' : (r.error || 'failed');
      }));
    } else {
      alBox.innerHTML = `<a class="pix-add-to-list-trigger" href="#/showcase">+ Add to list</a>`;
    }
  } else {
    alBox.innerHTML = `<a class="pix-add-to-list-trigger" href="#/auth">+ Add to list</a>`;
  }

  const pane = document.getElementById('tabPane');
  const renderScreening = () => {
    pane.innerHTML = `
      <div class="pix-home-section-heading"><div><h2>MY SCREENING</h2></div>
        <div class="pix-home-row-tagline"><p>Your record of this film — private until you post it as a review</p></div></div>
      <div class="pix-film-panel">
        <p class="pix-kicker">YOUR VERDICT</p>
        <p>${seen ? 'Seen' : 'Not seen yet'}${iv !== 'none' ? ` · ${iv === 'want_to_see' ? 'Want to see' : iv === 'maybe' ? 'Maybe' : 'No thanks'}` : ''}</p>
        ${mine?.review ? `<p class="pix-kicker">YOUR ENTRY</p>
          <p>${mine.review.rating ? `<span class="stars">${'★'.repeat(mine.review.rating)}</span> ` : ''}${esc(mine.review.body)}</p>
          <p class="pix-footer-note">Written ${new Date(mine.review.created_at).toLocaleDateString()}</p>`
        : '<p class="pix-footer-note">No personal entry yet — post a review to add one.</p>'}
      </div>
      <div id="revform"></div>`;
    if (session) {
      document.getElementById('revform').innerHTML = `
        <div class="pix-filter-row"><label for="rvStance">Your take</label>
          <select id="rvStance">
            <option value="">Pick a stance…</option>
            <option>Agree</option>
            <option>Same here</option>
            <option>Hard disagree</option>
          </select></div>
        <div class="pix-filter-row"><label for="rvRating">Rating</label>
          <select id="rvRating">
            <option value="">Stars…</option>
            <option value="1">★</option>
            <option value="2">★★</option>
            <option value="3">★★★</option>
            <option value="4">★★★★</option>
            <option value="5">★★★★★</option>
          </select></div>
        <div class="pix-filter-row"><label for="rvWhy">Why this film?</label>
          <select id="rvWhy">
            <option value="">Reason (optional)</option>
            ${WHY_OPTIONS.map((o) => `<option>${esc(o)}</option>`).join('')}
          </select></div>
        <label class="pix-kicker" for="rvBody">Anything to add? (optional)</label>
        <textarea id="rvBody" rows="3" style="width:100%"></textarea>
        <div class="actions"><button class="pix-tough-button" id="rvGo">Post comment</button></div>
        <div id="rvErr"></div>`;
      document.getElementById('rvGo').onclick = async () => {
        const r = await api('/api/reviews', { method: 'POST', body: JSON.stringify({
          imdb_id: imdb,
          stance: document.getElementById('rvStance').value || null,
          rating: document.getElementById('rvRating').value ? Number(document.getElementById('rvRating').value) : null,
          why_tag: document.getElementById('rvWhy').value || null,
          body: document.getElementById('rvBody').value }) });
        if (!r.ok) { document.getElementById('rvErr').innerHTML = errHtml(r.error); return; }
        viewFilm(imdb);
      };
    } else {
      document.getElementById('revform').innerHTML = '<p class="pix-status">Sign in to keep a screening record.</p>';
    }
  };
  const renderReview = () => {
    pane.innerHTML = `
      <div class="pix-home-section-heading"><div><h2>REVIEW</h2></div>
        <div class="pix-home-row-tagline"><p>Live comments and PIX.MOV rankings</p></div></div>
      <div class="pix-film-panel">
        <p class="pix-kicker">PIX.MOV RANKING</p>
        <p>${j.rank ? `#${String(j.rank).padStart(3, '0')} of the Top 500` : 'Not yet in the Top 500'}</p>
        <p class="pix-film-meta">${f.wins} wins · ${f.losses} losses · ${f.appearances} appearances</p>
      </div>
      <div id="revlist">${j.reviews.map((r) => `<div class="review">${r.user_id ? `<a class="pix-fan-link" href="#/fan/${esc(r.user_id)}"><b>${esc(r.user_label)}</b></a>` : `<b>${esc(r.user_label)}</b>`}
        ${r.verdict ? `<span class="pix-verdict-chip">${esc(r.verdict)}</span>` : ''}
        ${r.stance ? `<span class="pix-stance-chip">${esc(r.stance)}</span>` : ''}
        ${r.why_tag ? `<span class="pix-why-chip">${esc(r.why_tag)}</span>` : ''}
        ${r.rating ? `<span class="stars">${'★'.repeat(r.rating)}</span>` : ''}
        ${r.body ? `<p>${esc(r.body)}</p>` : ''}</div>`).join('') || '<p class="pix-status">No comments yet — pick a stance and be the first.</p>'}</div>`;
  };
  renderScreening();
  pane.parentElement.querySelectorAll('[data-tab]').forEach((t) => (t.onclick = () => {
    pane.parentElement.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === t)));
    if (t.dataset.tab === 'screening') renderScreening(); else renderReview();
  }));
}

/* ---------------- TOUGH PIX (shared VS) ---------------- */
async function viewTough(key) {
  mount('', `<section class="pix-section-overlay is-details" id="toughWrap"></section>`);
  const box = document.getElementById('toughWrap');
  const j = await api('/api/tough/' + encodeURIComponent(key));
  if (!j.ok) { box.innerHTML = errHtml(j.error); return; }
  const a = j.share.a_imdb_id ? j.films.find((f) => f.imdb_id === j.share.a_imdb_id) : null;
  const b = j.share.b_imdb_id ? j.films.find((f) => f.imdb_id === j.share.b_imdb_id) : null;
  const pair = [a || j.films[0], b || j.films[1]];
  const counts = Object.fromEntries((j.picks || []).map((p) => [p.picked_imdb_id, p.c]));
  box.innerHTML = `
    <div class="pix-game-frame-expanded">
      <div class="pix-now-playing-header">
        <p class="pix-kicker">TOUGH PIX · SHARED MATCHUP</p>
        <span class="pix-play-arrow" aria-hidden="true"></span>
        <p class="pix-current-game-title">Someone thinks this is a tough call · <span>${j.picks?.length || 0} picks</span></p>
      </div>
      <div class="pix-matchup" id="toughMatchup">
        ${pair.map((m, i) => m ? `<article class="pix-choice">
          <div class="pix-poster-stage" data-hover-type="1">
            <button class="pix-poster-button" data-pick="${esc(m.imdb_id)}" data-side="${i === 0 ? 'a' : 'b'}"
              aria-label="Pick ${esc(m.title)} as the winner">
              <img src="${esc(posterUrl(m))}" alt="${esc(m.title)} movie poster">
              <span class="pix-check" aria-hidden="true">✓</span>
            </button>
            <div class="pix-movie-meta pix-movie-meta-overlay">
              <h2>${esc(m.title)}</h2><p>${esc(m.release_year || '')} · ${counts[m.imdb_id] || 0} picks</p>
            </div>
          </div></article>` : '').join('')}
      </div>
      <p class="pix-status" id="tmsg">Pick your winner — the tally updates live.</p>
    </div>`;
  box.querySelectorAll('[data-pick]').forEach((el) => (el.onclick = async () => {
    const r = await api('/api/tough/' + encodeURIComponent(key) + '/pick',
      { method: 'POST', body: JSON.stringify({ picked_imdb_id: el.dataset.pick }) });
    const msg = document.getElementById('tmsg');
    if (!r.ok) { msg.textContent = r.error || 'failed'; return; }
    msg.textContent = 'Pick recorded — forward this link to keep the argument going.';
    viewTough(key);
  }));
}

/* ---------------- CINE Lite ---------------- */
async function viewCine() {
    mount('cine', `<div class="pix-home-section pix-content-width">
    <div class="pix-home-section-heading"><div><span>08</span><h2>CINE</h2></div>
      <div class="pix-home-row-tagline"><p>The cut room · classic clips and auto-dice</p></div></div>
    <p>Every classic in the library, cut into segments, ready to slice into your own reel.
      Build a BIN, dice a scene, and the result plays back here — the browser timeline editor
      lives in the full build.</p>
    <div class="pix-attractions-row" style="margin:14px 0">
      <span class="pix-attractions-slot"><button class="pix-attraction-btn" id="cLib" type="button">Clip library</button></span>
      <span class="pix-attractions-slot"><button class="pix-attraction-btn" id="cBin" type="button">My BIN</button></span>
      <span class="pix-attractions-slot"><button class="pix-attraction-btn" id="cDice" type="button">Auto-dice</button></span>
    </div>
    <div id="cview"><p class="pix-status">loading…</p></div>
  </div>`);
  document.getElementById('cLib').onclick = cineLibrary;
  document.getElementById('cBin').onclick = cineBin;
  document.getElementById('cDice').onclick = cineDice;
  cineLibrary();
}

async function cineLibrary() {
  const v = document.getElementById('cview');
  v.innerHTML = '<p class="muted">loading…</p>';
  const j = await api('/api/classics');
  v.innerHTML = (j.films || []).map((f) => `
    <div class="card"><h3>${esc(titleYear(f.title, f.release_year))}</h3>
      <p class="muted small">${f.segments} clips</p>
      <button class="btn" data-nav="#/classics/${esc(f.film_key)}">Open</button></div>`).join('')
    || '<p class="muted">No classics yet — run the migrations.</p>';
  v.querySelectorAll('[data-nav]').forEach((b) => (b.onclick = () => (location.hash = b.dataset.nav)));
}

async function cineBin() {
  const v = document.getElementById('cview');
  if (!session) { v.innerHTML = '<p class="muted">Sign in to use your BIN.</p>'; return; }
  v.innerHTML = `<div class="card"><h3>Add to BIN</h3>
      <label>Filename</label><input id="binName" placeholder="my-project.mp4">
      <label>Note</label><input id="binNote" placeholder="work in progress…">
      <div class="actions"><button class="btn primary" id="binAdd">Add</button></div>
      <div id="binErr"></div></div>
    <div id="binList"><p class="muted">loading…</p></div>`;
  const load = async () => {
    const j = await api('/api/cine/bin');
    document.getElementById('binList').innerHTML = (j.items || []).map((it) => `
      <div class="card"><b>${esc(it.filename)}</b>
        <p class="muted small">${esc(it.note || '')}</p>
        <button class="btn" data-del="${it.id}">Remove</button></div>`).join('')
      || '<p class="muted">BIN is empty.</p>';
    v.querySelectorAll('[data-del]').forEach((b) => (b.onclick = async () => {
      await api('/api/cine/bin/' + b.dataset.del, { method: 'DELETE' }); load();
    }));
  };
  document.getElementById('binAdd').onclick = async () => {
    const r = await api('/api/cine/bin', { method: 'POST', body: JSON.stringify({
      filename: document.getElementById('binName').value,
      note: document.getElementById('binNote').value }) });
    if (!r.ok) { document.getElementById('binErr').innerHTML = errHtml(r.error); return; }
    load();
  };
  load();
}

async function cineDice() {
  const v = document.getElementById('cview');
  if (!session) { v.innerHTML = '<p class="muted">Sign in to dice films.</p>'; return; }
  v.innerHTML = `<div class="card"><h3>Auto-dice a film</h3>
      <p class="muted small">Drop a full-length MP4 into the server's DICE_MEDIA_DIR, then dice it into stream-copy chunks.</p>
      <label>Source filename (inside DICE_MEDIA_DIR)</label><input id="dSrc" placeholder="film.mp4">
      <label>Chunk seconds</label><input id="dChunk" type="number" value="119" style="width:100px">
      <div class="actions"><button class="btn primary" id="dGo">Dice</button></div>
      <div id="dOut" class="muted small"></div></div>`;
  document.getElementById('dGo').onclick = async () => {
    const r = await api('/api/dice', { method: 'POST', body: JSON.stringify({
      source_path: document.getElementById('dSrc').value,
      chunk_seconds: Number(document.getElementById('dChunk').value) || 119 }) });
    document.getElementById('dOut').textContent = r.ok ? `Job ${r.job_id} running…` : (r.error || 'failed');
  };
}

/* ---------------- classics (all films) ---------------- */
async function viewClassics() {
  mount('classics', `
    <section class="pix-home-section pix-content-width">
      <div class="pix-home-section-heading"><div><h2>PIX LIBRARY</h2></div>
        <div class="pix-home-row-tagline"><p>Public-domain features, streamed in segments</p></div></div>
      <div id="cf"><p class="pix-status">loading…</p></div>
    </section>`);
  const j = await api('/api/classics');
  const films = j.films || [];
  const box = document.getElementById('cf');
  /* Grouped by genre (Founder, 2026-11-06): the library shelves by genre;
     each film's genre rides its library path. A catalogue match alone
     earns a poster attempt — resolution itself falls back by IMDb id. */
  const GENRE_NAMES = { horror: 'Horror', scifi: 'Sci-Fi', drama: 'Drama', comedy: 'Comedy', noir: 'Film Noir', crime: 'Crime', mystery: 'Mystery', romance: 'Romance', thriller: 'Thriller', adventure: 'Adventure', fantasy: 'Fantasy', war: 'War', westerns: 'Westerns', european: 'European', action: 'Action', documentary: 'Documentary', animation: 'Animation', musical: 'Musical' };
  const tile = (f) => `
    <a class="pix-seen-tile" href="#/classics/${esc(f.film_key)}"${f.poster_imdb ? ` data-mq-id="${esc(f.poster_imdb)}"` : ''} title="${esc(titleYear(f.title, f.release_year))}">
      ${f.poster_imdb ? stagedPoster(`/api/poster?imdb=${encodeURIComponent(f.poster_imdb || '')}&key=${encodeURIComponent(f.poster_key || '')}`, f.title) : '<span class="pix-seen-tile-plate" aria-hidden="true">PIX</span>'}
      <span class="pix-seen-tile-caption"><strong>${esc(titleYear(f.title, f.release_year))}</strong>
        <small>${esc(f.director || '')}${f.segments ? ` · ${f.segments} clips` : ''}</small></span>
    </a>`;
  /* Hover rule (Founder, 2026-11-08): a poster-backed classic renders as
     the standard foldout card — the hover fold travels with the poster.
     A classic with no catalogue poster keeps the honest plate tile. */
  const cardFor = (f) => f.poster_imdb
    ? loopCard({ ...f, poster: `/api/poster?imdb=${encodeURIComponent(f.poster_imdb)}&key=${encodeURIComponent(f.poster_key || '')}` })
    : tile(f);
  const groups = new Map();
  films.forEach((f) => {
    const g = String(f.genre || 'classics').toLowerCase();
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(f);
  });
  const order = [...groups.keys()].sort((a, b) => (GENRE_NAMES[a] || a).localeCompare(GENRE_NAMES[b] || b));
  box.innerHTML = order.map((g) => `
    <section class="pix-home-section">
      <div class="pix-home-section-heading"><div><h2>${esc(GENRE_NAMES[g] || g.toUpperCase())}</h2></div>
        <div class="pix-home-row-tagline"><p>${groups.get(g).length} classic${groups.get(g).length === 1 ? '' : 's'}</p></div></div>
      <div class="pix-seen-grid">${groups.get(g).map(cardFor).join('')}</div>
    </section>`).join('') || '<p class="pix-status">No classics catalogued yet.</p>';
  box.querySelectorAll('img').forEach((img) => img.addEventListener('error', () => {
    const tile = img.closest('.pix-seen-tile');
    const plate = document.createElement('span');
    plate.className = 'pix-seen-tile-plate'; plate.setAttribute('aria-hidden', 'true'); plate.textContent = 'PIX';
    (img.closest('.pix-poster-load') || img).replaceWith(plate);
    if (tile) tile.dataset.noArt = '1';
  }));
  bindCardFold(box);
  paintMarks(box);
  upgradePosters(box);
}

/* Billboard quotes ship verbatim from settings.json → billboard.quotes; the card
   shows between ~2-minute segments and the next segment auto-plays. */
const BILLBOARD_QUOTES = [
  { text: "Frankly, my dear, I don't give a damn.", credit: 'Rhett Butler · Gone with the Wind (1939)' },
  { text: "Here's looking at you, kid.", credit: 'Rick Blaine · Casablanca (1942)' },
  { text: 'Louis, I think this is the beginning of a beautiful friendship.', credit: 'Rick Blaine · Casablanca (1942)' },
  { text: 'May the Force be with you.', credit: 'Star Wars (1977)' },
  { text: "I'm going to make him an offer he can't refuse.", credit: 'Vito Corleone · The Godfather (1972)' },
  { text: 'Keep your friends close, but your enemies closer.', credit: 'Michael Corleone · The Godfather Part II (1974)' },
  { text: "Toto, I've a feeling we're not in Kansas anymore.", credit: 'Dorothy Gale · The Wizard of Oz (1939)' },
  { text: "There's no place like home.", credit: 'Dorothy Gale · The Wizard of Oz (1939)' },
  { text: 'You talking to me?', credit: 'Travis Bickle · Taxi Driver (1976)' },
  { text: "I'll be back.", credit: 'The Terminator (1984)' },
  { text: "You can't handle the truth!", credit: 'Col. Nathan Jessup · A Few Good Men (1992)' },
  { text: "Mama always said life was like a box of chocolates. You never know what you're gonna get.", credit: 'Forrest Gump (1994)' },
  { text: 'Houston, we have a problem.', credit: 'Jim Lovell · Apollo 13 (1995)' },
  { text: 'E.T. phone home.', credit: 'E.T. the Extra-Terrestrial (1982)' },
  { text: 'Bond. James Bond.', credit: 'James Bond · Dr. No (1962)' },
  { text: 'To infinity — and beyond!', credit: 'Buzz Lightyear · Toy Story (1995)' },
  { text: 'Just keep swimming.', credit: 'Dory · Finding Nemo (2003)' },
  { text: "It's alive! It's alive!", credit: 'Henry Frankenstein · Frankenstein (1931)' },
  { text: 'Listen to them, the children of the night. What music they make!', credit: 'Count Dracula · Dracula (1931)' },
  { text: "Fasten your seatbelts. It's going to be a bumpy night.", credit: 'Margo Channing · All About Eve (1950)' },
  { text: "What we've got here is failure to communicate.", credit: 'The Captain · Cool Hand Luke (1967)' },
  { text: "I'm king of the world!", credit: 'Jack Dawson · Titanic (1997)' },
  { text: 'Carpe diem. Seize the day, boys.', credit: 'John Keating · Dead Poets Society (1989)' },
  { text: "I'll have what she's having.", credit: 'When Harry Met Sally… (1989)' },
  { text: "You had me at 'hello.'", credit: 'Dorothy Boyd · Jerry Maguire (1996)' },
  { text: 'Show me the money!', credit: 'Jerry Maguire (1996)' },
  { text: "Here's Johnny!", credit: 'Jack Torrance · The Shining (1980)' },
  { text: 'I love the smell of napalm in the morning.', credit: 'Lt. Col. Bill Kilgore · Apocalypse Now (1979)' },
  { text: "Well, nobody's perfect.", credit: 'Osgood Fielding III · Some Like It Hot (1959)' },
  { text: 'After all, tomorrow is another day!', credit: 'Scarlett O’Hara · Gone with the Wind (1939)' },
  { text: 'Why so serious?', credit: 'The Joker · The Dark Knight (2008)' },
  { text: "There's no crying in baseball!", credit: 'Jimmy Dugan · A League of Their Own (1992)' },
  { text: 'I see dead people.', credit: 'Cole Sear · The Sixth Sense (1999)' },
  { text: "I'm mad as hell, and I'm not going to take this anymore!", credit: 'Howard Beale · Network (1976)' },
  { text: "Say 'hello' to my little friend!", credit: 'Tony Montana · Scarface (1983)' },
  { text: 'Magic mirror on the wall, who is the fairest one of all?', credit: 'The Evil Queen · Snow White and the Seven Dwarfs (1937)' },
  { text: "Love means never having to say you're sorry.", credit: 'Love Story (1970)' },
  { text: 'We rob banks.', credit: 'Clyde Barrow · Bonnie and Clyde (1967)' },
];
let billboardIdx = 0;

async function viewClassic(filmKey) {
  mount('classics', '<div class="player-wrap"><p class="muted">loading…</p></div>');
  await renderClassicInto(filmKey, document.querySelector('.player-wrap'));
}

/* The classic-film showcase, renderable into any .player-wrap — the
   FEATURE PRESENTATION section (1:1 Pass 3) wraps it in its own chrome. */
async function renderClassicInto(filmKey, wrap) {
  if (!wrap) return;
  const j = await api('/api/classics/' + encodeURIComponent(filmKey));
  if (!j.ok) { wrap.innerHTML = errHtml(j.error || 'not found'); return; }
  const { film } = j;
  const clips = j.clips || j.segments || [];
  const playable = clips.filter((c) => c.url);
  const still = film.still_url || film.art_url || '';
  const headArt = film.poster_url || still;
  wrap.innerHTML = `
    <section class="pix-home-section pix-content-width">
      <p class="pix-kicker"><a href="#/classics">CLASSICS</a> · FEATURE PRESENTATION</p>
      <div class="pix-film-head">
        ${headArt ? `<div class="pix-film-poster"><img src="${esc(headArt)}" alt="${esc(bareTitle(film.title))} ${film.poster_url ? 'movie poster' : 'still'}"></div>` : ''}
        <div class="pix-film-body">
          <h1>${esc(titleYear(film.title, film.release_year))}</h1>
          <p class="pix-film-meta">${esc(film.director || '')} · ${clips.length} segments${playable.length ? ` · ${playable.length} playable` : ''}</p>
          ${film.synopsis ? `<p>${esc(film.synopsis)}</p>` : ''}
        </div>
      </div>` +
    (playable.length ? `
      <div class="pix-player-stage" id="stage">
        <video id="vplayer" controls playsinline preload="metadata"${still ? ` poster="${esc(still)}"` : ''}></video>
        <div class="pix-player-controls" id="playerControls">
          <button class="pix-player-control-btn" type="button" data-pc="pip" title="Picture in picture" aria-label="Picture in picture">⧉</button>
          <button class="pix-player-control-btn" type="button" data-pc="pop" title="Pop out player" aria-label="Pop out player">⇱</button>
          <button class="pix-player-control-btn" type="button" data-pc="full" title="Full screen" aria-label="Full screen">⛶</button>
        </div>
        <div class="pix-billboard" id="billboard" hidden>
          <p class="billboard-label">BILLBOARD</p>
          <p class="billboard-countdown">5</p>
          <figure><blockquote><p id="bbQuote"></p></blockquote><figcaption id="bbCredit"></figcaption></figure>
          <p class="billboard-next" id="bbNext">next in 5 seconds</p>
        </div>
      </div>
      <div class="pix-seg-grid" id="chapters">
        ${clips.map((c, i) => `<button class="pix-seg-tile" type="button" data-i="${i}" ${c.url ? '' : 'disabled'} aria-label="Segment ${Number(c.segment) || i + 1}">
          ${c.thumb_url ? `<img loading="lazy" src="${esc(c.thumb_url)}" alt="">` : '<span class="pix-seg-plate" aria-hidden="true">▶</span>'}
          <span class="pix-seg-n">${String(Number(c.segment) || i + 1).padStart(2, '0')}</span>
        </button>`).join('')}
      </div>` : `
      <div class="notice"><b>This title is being prepared.</b>
        <p class="pix-film-meta">${clips.length} segments catalogued — they appear here as soon as the print is ready.</p></div>`) + `
    </section>`;
  /* Screen grabs (Founder, 2026-11-06): per-segment thumbs live at the
     mirrored /thumbs/ path; where a film's grabs were never made, the tile
     falls back to the film's own still — a real frame from the same print —
     never a broken image. A poster that cannot resolve leaves the header
     art to the still. */
  if (still) document.querySelectorAll('#chapters .pix-seg-tile img').forEach((img) => {
    img.addEventListener('error', () => { if (!img.dataset.fb) { img.dataset.fb = '1'; img.src = still; } });
  });
  const headImg = document.querySelector('.pix-film-poster img');
  if (headImg) headImg.addEventListener('error', () => {
    if (headImg.dataset.fb) { headImg.closest('.pix-film-poster')?.remove(); return; }
    headImg.dataset.fb = '1';
    if (still) headImg.src = still; else headImg.closest('.pix-film-poster')?.remove();
  });
  if (!playable.length) return;
  const player = document.getElementById('vplayer');
  const stage = document.getElementById('stage');
  const billboard = document.getElementById('billboard');
  const btns = [...document.querySelectorAll('#chapters button')];
  let idx = 0, breakTimer = null;

  const hideBillboard = () => {
    billboard.hidden = true;
    clearInterval(breakTimer); breakTimer = null;
  };
  const billboardBreak = (nextIdx) => {
    const q = BILLBOARD_QUOTES[billboardIdx++ % BILLBOARD_QUOTES.length];
    document.getElementById('bbQuote').textContent = '“' + q.text + '”';
    document.getElementById('bbCredit').textContent = q.credit;
    let n = 5;
    const count = billboard.querySelector('.billboard-countdown');
    const nextLine = document.getElementById('bbNext');
    count.textContent = String(n);
    nextLine.textContent = `next in ${n} second${n === 1 ? '' : 's'}`;
    billboard.hidden = false;
    clearInterval(breakTimer);
    breakTimer = setInterval(() => {
      n -= 1;
      count.textContent = String(Math.max(0, n));
      nextLine.textContent = n > 0 ? `next in ${n} second${n === 1 ? '' : 's'}` : 'next…';
      if (n <= 0) {
        clearInterval(breakTimer); breakTimer = null;
        billboard.hidden = true;
        playAt(nextIdx, true);
      }
    }, 1000);
  };
  const playAt = (i, fromBreak) => {
    idx = i;
    hideBillboard();
    player.src = clips[i].url;
    player.play().catch(() => {});
    btns.forEach((b, k) => b.classList.toggle('active', k === i));
    if (fromBreak) return;
  };
  btns.forEach((b) => (b.onclick = () => playAt(Number(b.dataset.i))));
  player.onended = () => {
    const next = idx + 1;
    if (next < clips.length && clips[next].url) billboardBreak(next); /* ~2-minute mark: break card, then auto-play */
  };
  playAt(0);

  /* Player controls are capability-gated: each hides itself when unsupported
     (settings.json → player.controls / fallbacks). */
  const ctl = document.getElementById('playerControls');
  const pipBtn = ctl.querySelector('[data-pc="pip"]');
  const popBtn = ctl.querySelector('[data-pc="pop"]');
  const fullBtn = ctl.querySelector('[data-pc="full"]');
  const canPip = !!(document.pictureInPictureEnabled && player.requestPictureInPicture) || !!player.webkitSupportsPresentationMode;
  const canPop = 'documentPictureInPicture' in window;
  const canFull = !!(stage.requestFullscreen || player.webkitEnterFullscreen);
  pipBtn.hidden = !canPip;
  popBtn.hidden = !canPop;
  fullBtn.hidden = !canFull;
  pipBtn.onclick = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (player.requestPictureInPicture) await player.requestPictureInPicture();
      else if (player.webkitSetPresentationMode) player.webkitSetPresentationMode('picture-in-picture');
    } catch (e) { /* user gesture refused */ }
  };
  fullBtn.onclick = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (stage.requestFullscreen) await stage.requestFullscreen();
      else if (player.webkitEnterFullscreen) player.webkitEnterFullscreen();
    } catch (e) { /* refused */ }
  };
  popBtn.onclick = async () => {
    if (!('documentPictureInPicture' in window)) return;
    try {
      const win = await window.documentPictureInPicture.requestWindow({ width: 480, height: 300 });
      win.document.body.style.cssText = 'margin:0;background:#000;display:grid;place-items:center';
      const clone = win.document.createElement('video');
      clone.src = player.src; clone.controls = true; clone.currentTime = player.currentTime;
      clone.style.cssText = 'width:100%;height:100%';
      win.document.body.appendChild(clone);
      clone.play().catch(() => {});
      player.pause();
      win.addEventListener('pagehide', () => {
        player.currentTime = clone.currentTime;
        player.play().catch(() => {});
      });
    } catch (e) { /* refused */ }
  };
}

/* ---------------- auth + MFA ---------------- */
async function viewAuth() {
  if (session) { location.hash = '#/'; return; }
  mount('home', `<div class="pix-auth-wrap"><div class="pix-auth-card">
    <p class="pix-kicker">PIX.MOV · ACCOUNT</p>
    <div class="pix-auth-tabs" role="tablist">
      <button type="button" id="tIn" aria-selected="true">Sign in</button>
      <button type="button" id="tUp" aria-selected="false">Sign up</button>
    </div>
    <div id="aerr"></div>
    <div class="pix-filter-row"><label for="aemail">Email</label>
      <input type="email" id="aemail" autocomplete="username" placeholder="you@example.com"></div>
    <div class="pix-filter-row"><label for="apass">Password</label>
      <input type="password" id="apass" autocomplete="current-password" placeholder="••••••••"></div>
    <div class="actions"><button class="pix-tough-button" id="ago" type="button">Continue</button></div>
    <div id="mfaBox"></div>
    <p class="pix-footer-note">This is a safe space: nothing you rate is shown to another member without your
      say-so, and PIX never publishes your email. Read the <a href="#/privacy">privacy note</a>.</p>
    <p class="pix-footer-note">Two-factor authentication is optional — you can turn it on any time in Account settings.</p>
  </div></div>`);
  let mode = 'in';
  const tIn = document.getElementById('tIn'), tUp = document.getElementById('tUp');
  const paintTabs = () => {
    tIn.setAttribute('aria-selected', String(mode === 'in'));
    tUp.setAttribute('aria-selected', String(mode === 'up'));
  };
  tIn.onclick = () => { mode = 'in'; paintTabs(); };
  tUp.onclick = () => { mode = 'up'; paintTabs(); };
  const go = async () => {
    const email = document.getElementById('aemail').value.trim();
    const password = document.getElementById('apass').value;
    document.getElementById('aerr').innerHTML = '';
    /* The auth methods are called ON sb.auth: extracting one into a bare
       variable detaches it from its client (the detached-method bug). */
    const { data, error } = mode === 'in'
      ? await sb.auth.signInWithPassword({ email, password })
      : await sb.auth.signUp({ email, password });
    if (error) { document.getElementById('aerr').innerHTML = errHtml(error.message); return; }
    if (!data.session) {
      document.getElementById('aerr').innerHTML = '<p class="pix-status">Account created — check your email to confirm it, then sign in.</p>';
      return;
    }
    await afterSignIn();
  };
  document.getElementById('ago').onclick = go;
  /* The handler must not RETURN the && chain: returning false from an
     onkeydown property handler cancels the key's default action, which
     is the character insertion itself — the field focused and showed a
     cursor but swallowed every keystroke, so no password could ever be
     typed and no account created (Founder report + live probe,
     2026-11-05). Block body: Enter submits, everything else types. */
  document.getElementById('apass').onkeydown = (e) => { if (e.key === 'Enter') go(); };
}

/* Post-sign-in step (Founder ruling, mail row 74): TOTP is OPTIONAL.
   A verified factor is challenged — an enrolled account is never
   downgraded — and every other account walks straight in. There is NO
   enrolment wall here, and enrol() is never attempted from the sign-in
   flow: the old fall-through enrolled whenever the factor list came back
   empty or unread, which is exactly what produced "A factor with the
   friendly name "pix-portable" for this user already exists" against an
   existing factor. A factor-list error is surfaced, never swallowed into
   an enrolment attempt. Enrolment lives in Account Settings and lists
   factors before it acts. */
async function afterSignIn() {
  const { data: fl, error } = await sb.auth.mfa.listFactors();
  if (error) {
    document.getElementById('aerr').innerHTML = errHtml('Signed in, but the authenticator check could not run: ' + error.message);
    return;
  }
  const totp = (fl?.totp || []).find((f) => f.status === 'verified');
  if (totp) return mfaChallenge(totp.id);
  await refreshSession();
  location.hash = '#/';
}

async function mfaChallenge(factorId, boxId = 'mfaBox', onDone = null) {
  const box = document.getElementById(boxId);
  box.innerHTML = `<div class="pix-filter-row"><label for="mfacode">Code</label>
      <input type="text" id="mfacode" inputmode="numeric" autocomplete="one-time-code" placeholder="123456"></div>
    <div class="actions"><button class="pix-tough-button" id="mfago" type="button">Verify</button></div><div id="mfaerr"></div>`;
  const { data: ch, error: chErr } = await sb.auth.mfa.challenge({ factorId });
  if (chErr) { document.getElementById('mfaerr').innerHTML = errHtml(chErr.message); return; }
  document.getElementById('mfago').onclick = async () => {
    const code = document.getElementById('mfacode').value.trim();
    const { error } = await sb.auth.mfa.verify({ factorId, challengeId: ch.id, code });
    if (error) { document.getElementById('mfaerr').innerHTML = errHtml(error.message); return; }
    await refreshSession();
    if (onDone) onDone(); else location.hash = '#/';
  };
}

/* Enrolment — Account Settings ONLY (row 74). The settings page lists the
   factors before offering this, so a second factor is never enrolled
   against an existing one. */
async function mfaEnrollNew(boxId = 'mfaBox', onDone = null) {
  const box = document.getElementById(boxId);
  const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'pix-portable' });
  if (error) { box.innerHTML = errHtml(error.message); return; }
  box.innerHTML = `<p>Scan with your authenticator app, then enter the code:</p>
    <div class="qr">${data.totp.qr_code}</div>
    <label>Code</label><input type="text" id="mfacode" inputmode="numeric">
    <div class="actions"><button class="btn primary" id="mfago">Verify &amp; enable</button></div><div id="mfaerr"></div>`;
  document.getElementById('mfago').onclick = () => mfaEnrollVerify(data.id, boxId, onDone);
}

async function mfaEnrollVerify(factorId, boxId = 'mfaBox', onDone = null) {
  const box = document.getElementById(boxId);
  if (!document.getElementById('mfacode')) {
    box.innerHTML = `<label>Authenticator code</label><input type="text" id="mfacode" inputmode="numeric">
      <div class="actions"><button class="btn primary" id="mfago">Verify &amp; enable</button></div><div id="mfaerr"></div>`;
    document.getElementById('mfago').onclick = () => mfaEnrollVerify(factorId, boxId, onDone);
    return;
  }
  const code = document.getElementById('mfacode').value.trim();
  const { data: ch, error: chErr } = await sb.auth.mfa.challenge({ factorId });
  if (chErr) { document.getElementById('mfaerr').innerHTML = errHtml(chErr.message); return; }
  const { error } = await sb.auth.mfa.verify({ factorId, challengeId: ch.id, code });
  if (error) { document.getElementById('mfaerr').innerHTML = errHtml(error.message); return; }
  await refreshSession();
  if (onDone) onDone(); else location.hash = '#/';
}

/* ---------------- account settings (row 74: MFA lives here) ---------------- */
async function viewSettings() {
  if (!session) { location.hash = '#/auth'; return; }
  mount('settings', `<div class="pix-auth-wrap"><div class="pix-auth-card">
    <p class="pix-kicker">PIX.MOV · ACCOUNT SETTINGS</p>
    <p>Signed in as <b>${esc(whoEmail() || session?.user?.email || '')}</b></p>
    <h3>Two-factor authentication (optional)</h3>
    <div id="setMfaBox"><p class="pix-status">loading…</p></div>
    <div class="actions"><button class="pix-tough-button" id="setSignOut" type="button">Sign out</button></div>
  </div></div>`);
  document.getElementById('setSignOut').onclick = async () => {
    session = null; filmStateFor = null;
    try { await sb.auth.signOut(); } catch { try { await sb.auth.signOut({ scope: 'local' }); } catch { /* already out locally */ } }
    location.hash = '#/';
  };
  paintMfaSettings();
}

async function paintMfaSettings() {
  const box = document.getElementById('setMfaBox');
  if (!box) return;
  const { data: fl, error } = await sb.auth.mfa.listFactors();
  if (error) { box.innerHTML = errHtml(error.message); return; }
  const factors = fl?.totp || [];
  const verified = factors.find((f) => f.status === 'verified');
  const pending = factors.find((f) => f.status !== 'verified');
  if (verified) {
    box.innerHTML = `<p>Authenticator app: <b>ON</b> — sign-in asks for a code from your app.</p>
      <div class="pix-filter-row"><label for="setPass">Password</label><input type="password" id="setPass" autocomplete="current-password"></div>
      <div class="pix-filter-row"><label for="setCode">Code</label><input type="text" id="setCode" inputmode="numeric" autocomplete="one-time-code"></div>
      <div class="actions"><button class="pix-tough-button" id="mfaOff" type="button">Turn off two-factor</button></div>
      <p class="pix-footer-note">Turning this off removes the code step at sign-in. Anyone who learns your password could then sign in as you.</p>
      <div id="setMfaErr"></div>`;
    document.getElementById('mfaOff').onclick = async () => {
      const err = document.getElementById('setMfaErr');
      const password = document.getElementById('setPass').value;
      const code = document.getElementById('setCode').value.trim();
      const { error: pwErr } = await sb.auth.signInWithPassword({ email: whoEmail() || session.user.email, password });
      if (pwErr) { err.innerHTML = errHtml(pwErr.message); return; }
      const { data: ch, error: chErr } = await sb.auth.mfa.challenge({ factorId: verified.id });
      if (chErr) { err.innerHTML = errHtml(chErr.message); return; }
      const { error: vErr } = await sb.auth.mfa.verify({ factorId: verified.id, challengeId: ch.id, code });
      if (vErr) { err.innerHTML = errHtml(vErr.message); return; }
      const { error: uErr } = await sb.auth.mfa.unenroll({ factorId: verified.id });
      if (uErr) { err.innerHTML = errHtml(uErr.message); return; }
      await refreshSession();
      paintMfaSettings();
    };
    return;
  }
  if (pending) {
    box.innerHTML = `<p>Authenticator app: an earlier setup was started but never finished.</p>
      <div class="actions"><button class="pix-tough-button" id="mfaFinish" type="button">Finish setup</button>
      <button class="pix-tough-button" id="mfaDiscard" type="button">Remove it</button></div>
      <div id="setMfaErr"></div>`;
    document.getElementById('mfaFinish').onclick = () => mfaEnrollVerify(pending.id, 'setMfaBox', () => paintMfaSettings());
    document.getElementById('mfaDiscard').onclick = async () => {
      const { error: uErr } = await sb.auth.mfa.unenroll({ factorId: pending.id });
      if (uErr) { document.getElementById('setMfaErr').innerHTML = errHtml(uErr.message); return; }
      paintMfaSettings();
    };
    return;
  }
  box.innerHTML = `<p>Authenticator app: <b>OFF</b> — sign-in asks only for your password.</p>
    <div class="actions"><button class="pix-tough-button" id="mfaOn" type="button">Turn on two-factor</button></div>
    <p class="pix-footer-note">Recovery codes are not available yet. If you turn this on and lose your authenticator app, contact the PIX team — and keep your authenticator entry safe.</p>
    <div id="setMfaErr"></div>`;
  document.getElementById('mfaOn').onclick = () => mfaEnrollNew('setMfaBox', () => paintMfaSettings());
}

boot();

/* ---------------- PAGE FOOTER ROUTES ---------------- */
async function viewPrivacy() {
  mount('', `
    <section class="pix-home-section pix-content-width pix-legal">
      <p class="pix-kicker">PIX.MOV · PRIVACY POLICY</p>
      <h2>What we keep, and why</h2>
      <p>PIX.MOV is a taste network for film. You can play anonymously — no account, no picks saved.</p>
      <h3>If you sign in</h3>
      <ul>
        <li><b>Your picks</b> (which film you preferred) build FILM DNA against your account.</li>
        <li><b>Triage verdicts</b> — seen, unseen, want to see, maybe, no thanks — permanently shape your rotation.</li>
        <li><b>Lists and reviews</b> are public on your Showcase until you delete them.</li>
      </ul>
      <h3>If you decline cookie consent</h3>
      <p>Only essential session storage is kept: no personalisation, no ad measurement, no cross-site tracking.</p>
      <h3>Your controls</h3>
      <p>Re-open the consent panel any time from the footer. Deleting your account removes picks, verdicts, lists and reviews.</p>
      <p class="pix-footer-note">Questions or an appeal: <a href="#/feedback">Feedback</a>.</p>
    </section>`);
}

async function viewAgreements() {
  const c = readConsent() || {};
  mount('', `
    <section class="pix-home-section pix-content-width pix-legal">
      <p class="pix-kicker">PIX.MOV · CONSENT AGREEMENTS</p>
      <h2>The three choices in BISCUIT</h2>
      <div class="consent-options">
        <div class="consent-option"><span><strong>Essential</strong><span>Always on. Sign-in, security and playback cannot work without it.</span></span><span class="pix-dim">Required</span></div>
        <div class="consent-option"><span><strong>Save my PIX data</strong><span>Picks, seen films, lists and FILM DNA tied to your account.</span></span><span class="pix-dim">${c.personalization === false ? 'Declined' : c.decision ? 'Accepted' : 'Unknown'}</span></div>
        <div class="consent-option"><span><strong>Ad measurement</strong><span>Anonymous measurement of advertising performance. Never used to build a profile.</span></span><span class="pix-dim">${c.ad_measurement ? 'Accepted' : c.decision ? 'Declined' : 'Unknown'}</span></div>
      </div>
      <h3>Safe space</h3>
      <p>Reviews are about films, not people. Harassment, doxxing or hate speech is removable and appealable.</p>
      <button class="primary-button" id="agreeConsent" type="button">Review my consent choices</button>
      <p class="pix-footer-note">© 2029 PIX.MOV — All rights reserved. · BUILD V-01-00-33</p>
    </section>`);
  document.getElementById('agreeConsent').onclick = () => document.dispatchEvent(new Event('pix:open-consent'));
}

async function viewFeedback() {
  const TYPES = [
    { key: 'idea', label: 'Idea', hint: 'A film, a feature, a way to make PIX better.' },
    { key: 'issue', label: 'Issue', hint: 'Something broke or reads wrong.' },
    { key: 'report', label: 'Report a user', hint: 'Harassment, doxxing or abuse. Include the username.', needsUser: true },
    { key: 'appeal', label: 'Appeal', hint: 'Appeal a moderation call or a removal.', needsUser: true },
  ];
  mount('', `
    <section class="pix-home-section pix-content-width pix-legal">
      <p class="pix-kicker">PIX.MOV · FEEDBACK</p>
      <h2>Ideas, issues, reports</h2>
      <p>Tell us what broke, what you want to see, or report a user. Every message is read.</p>
      <div class="pix-feedback-choices" id="fbTypes">
        ${TYPES.map((t) => `<button class="pix-attraction-btn" type="button" data-fb="${t.key}" aria-pressed="false">${esc(t.label)}</button>`).join('')}
      </div>
      <div id="fbForm"></div>
      <p class="pix-footer-note">Reports of harassment or doxxing are prioritised. Include the film page or review link.</p>
    </section>`);
  const form = document.getElementById('fbForm');
  const paint = (key) => {
    const t = TYPES.find((x) => x.key === key);
    document.querySelectorAll('[data-fb]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fb === key)));
    form.innerHTML = `
      <div class="pix-film-panel">
        <p class="pix-kicker">${esc(t.label.toUpperCase())}</p>
        <p class="pix-footer-note">${esc(t.hint)}</p>
        ${t.needsUser ? `<div class="pix-filter-row"><label for="fbUser">Username</label>
          <input id="fbUser" type="text" placeholder="who is this about?" maxlength="120"></div>` : ''}
        <label class="pix-kicker" for="fbBody">Your message</label>
        <textarea id="fbBody" rows="5" maxlength="8000" style="width:100%" placeholder="${esc(t.hint)}"></textarea>
        <div class="pix-filter-row"><label for="fbContact">Contact</label>
          <input id="fbContact" type="email" placeholder="optional — for a reply" maxlength="200"></div>
        <div class="actions"><button class="pix-tough-button" id="fbGo" type="button">Send ${esc(t.label.toLowerCase())}</button></div>
        <div id="fbOut"></div>
      </div>`;
    document.getElementById('fbGo').onclick = async () => {
      const out = document.getElementById('fbOut');
      const body = document.getElementById('fbBody').value.trim();
      out.innerHTML = '';
      if (body.length < 4) { out.innerHTML = '<p class="pix-status">Tell us a little more first.</p>'; return; }
      const btn = document.getElementById('fbGo');
      btn.disabled = true; btn.textContent = 'Sending…';
      const r = await api('/api/feedback', { method: 'POST', body: JSON.stringify({
        type: t.key, body,
        subject_user: document.getElementById('fbUser')?.value || '',
        contact: document.getElementById('fbContact')?.value || '',
      }) });
      btn.disabled = false; btn.textContent = `Send ${t.label.toLowerCase()}`;
      if (!r.ok) { out.innerHTML = errHtml(r.error || 'could not send'); return; }
      form.innerHTML = `<div class="pix-film-panel"><p class="pix-kicker">RECEIVED</p>
        <p>Thank you — reference <b>#${esc(r.id)}</b>. A human reads every message.</p>
        <p class="pix-footer-note">Reports of harassment or doxxing jump the queue.</p></div>`;
    };
  };
  document.querySelectorAll('[data-fb]').forEach((b) => (b.onclick = () => paint(b.dataset.fb)));
  paint('idea');
}
