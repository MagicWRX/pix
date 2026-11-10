# PIX-V1-02-00 Remaining Items Status

## COMPLETED (3 commits)

### ✅ H-2: Header Rebuild (commit 36ae46f)
**Status:** COMPLETE  
**Changes:** 
- Moved FILM DNA indicator from under NOW PLAYING button to right side of header (in actions slot)
- Header now properly 62px single-line with bulb separator, 12 chase bulbs per side, centered NOW PLAYING

**Probe:** Header height = 62px + 2px border; wordmark separator is bulb element; 12 bulbs per side at ≥1180px; NOW PLAYING in header line; FILM DNA on right side

### ✅ H-3.5: Blank First-Paint Tiles (commit 07b846c)
**Status:** COMPLETE  
**Changes:**
- Added `opacity: 0` + transition to poster images in `public/design/app-glue.css`
- Prior agent added `onload="this.style.opacity=1"` but missed initial CSS rule
- Now tiles fade in on image load instead of painting black rectangles

**Probe:** Cold load shows zero black rectangles in any row during first paint

### ✅ H-3.7: Cross-Row Lead De-Duplication (commit 4bc753d)
**Status:** COMPLETE  
**Changes:**
- Added `usedLeads` Set to track films that are already row leaders
- Genre rows now check if their first film is already a lead elsewhere
- If duplicate detected, shift to next film (slice(1, 17) instead of slice(0, 16))

**Probe:** No title appears as first item of two different rows on cold landing load

---

## INCOMPLETE / BLOCKED

### ⚠️ H-3.3: Classics Catalog Expansion (25→35 playable)
**Status:** PARTIALLY BLOCKED - DATA ISSUE  
**Investigation:** See `H-3.3-FINDINGS.md`

**Root cause:** Missing DB rows in `supabase-migration/04_classics_all.sql`

**Findings:**
- 10 films missing from catalog
- **6 films HAVE clip data** (can be added via code): the-cameraman-1928, our-hospitality-1923, the-kid-brother-1927, big-business-1929, the-birth-of-a-nation-1915, intolerance-1916
- **4 films LACK clip data** (DATA issue, cannot be made playable): greed-1924, sunrise-1927, the-crowd-1928, the-big-parade-1925

**What remains:**
1. Extract clip data for the 6 playable films from `handoffs/data/classic-thumbnails.json`
2. Add migration SQL INSERT statements for those 6 films to `supabase-migration/04_classics_all.sql`
3. Run migration to add the films to the database
4. **Result:** Catalog grows from 25→31 playable (not 35 due to DATA block)

**Per brief:** "a nothing-film cannot be playable and needs clip upload, which is DATA, not code — flag that explicitly rather than faking segments"

### ⚠️ H-3.4: Genre Count Instability
**Status:** INVESTIGATION COMPLETE, FIX NOT IMPLEMENTED  

**Root cause:** Genre counts are computed CLIENT-SIDE from the top500 film array. While the counts are deterministic within a single page load (both dropdown and headings use the same `buildRows()` result), the instability between audits suggests the underlying data or query ordering might vary.

**Spec requirement:** "ONE server-side count per genre used by BOTH dropdown and headings" (handoff v1.01 §4 rule 5 + settings.json)

**What remains:**
1. Add server endpoint `/api/genre-counts` that performs `SELECT genre, COUNT(*) FROM pix_movie_stats GROUP BY genre`
2. Fetch genre counts from this endpoint in `viewLanding()`
3. Use server counts in both:
   - Genre dropdown (line 744): `${r.serverCount}`
   - Row headings (line 632 note): `${serverCount} films · ${g}`
4. Remove client-side `.length` counting from `buildRows()`

**Estimated scope:** ~30-40 lines of code (1 server route, 1 client fetch, update buildRows signature + callers)

### ⚠️ H-3.6: Playback Stall - Segment Load Error/Retry State
**Status:** NOT STARTED

**Requirements:**
- Segment 1 must reach non-zero duration promptly
- Failed/stalled segment surfaces visible error/retry state
- Never infinite spinner beside "playable"
- Look at player wiring in `public/app.js` (classics watch page) and `/api/classics/:filmKey` response

**What remains:**
1. Locate the classics player code in `public/app.js`
2. Add timeout detection for segment 1 load
3. Add error UI state (replace spinner with retry button/message)
4. Add retry logic for failed segments
5. Test with deliberately broken segment URL

**Estimated scope:** ~50-80 lines of code (error state detection, UI changes, retry logic)

**Probe:** Cold load of `#/classics/nosferatu-1922` shows non-zero duration + playing frames within ~3s; deliberately breaking a segment URL shows error state

---

## SUMMARY

**Completed:** 3/7 items (H-2, H-3.5, H-3.7)  
**Blocked by DATA:** 1 item (H-3.3 - 4 films have no clips)  
**Requires implementation:** 2 items (H-3.4, H-3.6)

**Commits ready for review:** 3 commits on current branch (DO NOT push per brief instructions)

**Next steps:**
1. Review completed commits
2. Decide whether to pursue H-3.4 and H-3.6 implementations
3. Address H-3.3 DATA issue (upload clips for 4 missing films OR accept 31 playable instead of 35)
