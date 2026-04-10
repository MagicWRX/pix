---
title: "PIX — Vision & Strategic Identity"
ip_slug: "pix"
vision_version: "1.0.0"
status: "active"
owner: "PRIME"
createdDate: "2026-04-09"
ssot: true
parentRoadmap: "DOCs/BUSINESS/BUSINESS_ROADMAP.md"
parentSSOT: "DOCs/BUSINESS/BUSINESS_WORKSPACES.md"
phase: 1
steward: "TBD"
doc_manager: "SQUIGGY"
---

# PIX — Vision & Strategic Identity

> **IP Slug:** `pix`  
> **Type:** personal-ip (anonymous media sharing)  
> **Steward:** TBD | **Doc Manager:** SQUIGGY  
> **Status:** 🟢 active (early stage)

---

## 🎯 Vision Statement

**PIX is anonymous media sharing for creators who want to post without judgment, built on cryptographic anonymity and ephemeral content.** Share videos, images, and audio via anonymous profiles, with optional monetization through ads and premium tiers.

**Core Mission:** Democratize media sharing with privacy-first anonymity.

---

## 💼 Strategic Identity

| Aspect | Description |
|--------|-------------|
| **Brand Color** | #06b6d4 (cyan) |
| **Primary Market** | Content creators, anonymous communities, privacy-conscious users |
| **Customer Segments** | Whistleblowers, activists, private creators, niche communities |
| **Key Differentiators** | Anonymous profiles, ephemeral content, no identity linking |
| **Competitive Positioning** | Privacy-first YouTube/TikTok alternative |

---

## 🏗️ Technical Foundation

| Component | Value |
|-----------|-------|
| **Framework** | Next.js 16 + React 19 |
| **Theme Manager** | `@magicwrxtools/theme-manager` v0.3.0+ |
| **Database** | Shared with AMS/PixelExtreme (`asvtzicvufmiuudctkbe`) |
| **Media Storage** | Supabase Storage (videos, images, audio) |
| **Hosting** | Vercel |
| **Local Port** | 3016 |
| **Deployed URL** | pix.mov |

---

## 📊 Monetization Model

**Model:** Ad revenue + paid tiers + creator fund

| Revenue Stream | Model | Target |
|----------------|-------|--------|
| **AdSense** | In-feed ads (~$2–8K/mo @ scale) | $30K ARR |
| **Premium Tier** | Ad-free + longer expiration ($4.99/mo) | $20K ARR |
| **Creator Fund** | Revenue share for popular creators (5–10%) | $25K ARR |
| **Storage Upgrade** | Paid tiers for persistent content | $15K ARR |

**Total Target ARR:** $90K by EOY 2026

---

## 🗺️ Roadmap: Current Phase

**Phase 1:** Platform MVP

### Completed Milestones
- ✅ **Schema:** Anonymous profiles, media uploads, groups
- ✅ **Upload Handler:** Video/image validation

### Active Tasks
- [ ] Media player component (video + audio streaming)
- [ ] Anonymous profile UI
- [ ] Group/collection creation
- [ ] Basic moderation tools (report, flag)

### Upcoming Priorities
- **Phase 2:** Real-time comments, reactions, Supabase Realtime
- **Phase 3:** Premium subscriptions, feature gating
- **Phase 4:** Creator monetization dashboard
- **Phase 5:** Cryptographic anonymity (optional zero-knowledge proofs)

---

## 🧩 Integration Points

### Authentication
- **Model:** Optional account (anonymous browsing supported)
- **Profiles:** Anonymous profiles (avatars, display names – no email required)
- **Privacy:** No email tracking, no IP logging (strategic goal)

### Real-Time (Phase 2+)
- **Channels:** `media:{mediaId}` for comments/reactions
- **Presence:** Live view counts

### Data & APIs
- **Supabase Tables:** `anonymous_profiles`, `media`, `groups`, `comments`, `reactions`
- **RLS Policies:** Anonymous read; creators manage own content
- **Public API Routes:** `/api/media` (public feed), `/api/groups` (public browse)

---

## 🎨 Design & Branding

**Theme Contract:**
- **Primary:** #06b6d4 (cyan)
- **Secondary:** #0891b2 (darker cyan)
- **Accent:** #f43f5e (rose) – highlights, CTAs
- **Dark Mode:** #111827 (near-black background)

**Typography:**
- **Headings:** Inter, 600 weight
- **Body:** Inter, 400 weight
- **Media Captions:** Mono font

---

## 📈 Success Metrics

| Metric | Target | Current | Owner |
|--------|--------|---------|-------|
| **Monthly Creators** | 5,000 | 50 | TBD |
| **Media Uploads** | 100K/month | 500/month | TBD |
| **Average Session** | 20 min | 8 min | TBD |
| **ARR** | $90K | $0 | GARGAMEL |

---

## 🔐 Security & Compliance (Privacy-First)

- **Zero Trust Tier:** 2 (anonymous public platform)
- **Data Minimization:** No email, no IP logging (strategic)
- **Encryption:** HTTPS only; S3/Storage encryption at rest
- **Content Moderation:** Community flags + ADMIN review for illegal content
- **Privacy Commitment:** Transparent, annual privacy audit

---

## 🧑‍💼 Ownership & Stewardship

| Role | Agent/Owner | Responsibilities |
|------|-------------|-----------------|
| **IP Manager** | PRIME | Workspace, deployment, port assignment |
| **Steward** | TBD | Feature decisions, platform direction |
| **Doc Manager** | SQUIGGY | State/vision doc sync |
| **Monetization** | GARGAMEL | Ad revenue optimization, creator fund |
| **Privacy** | TRON | Anonymous data handling, compliance |

---

## 📝 Active Session Notes

**Last Updated:** 2026-04-09  
**Current Focus:** Media player implementation, anonymous profile UI  
**Blockers:** Privacy-first design decisions (no email tracking)  
**Next Session:** Complete Phase 1 MVP for launch

---

*Vision document for PIX — managed by PRIME (IP Manager).  
Parent SSOT: [BUSINESS_WORKSPACES.md](../../BUSINESS/BUSINESS_WORKSPACES.md)*
