import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const deploymentSnapshots = sqliteTable(
  "deployment_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    status: text("status", { enum: ["ready_to_deploy"] }).notNull(),
    contentJson: text("content_json").notNull(),
    posterCount: integer("poster_count").notNull(),
    monsterCount: integer("monster_count").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("deployment_snapshots_created_idx").on(table.createdAt)],
);

export const pixProfiles = sqliteTable("pix_profiles", {
  id: integer("id").primaryKey(),
  displayName: text("display_name").notNull().default("Anonymous"),
  mode: text("mode", { enum: ["anonymous", "saved"] }).notNull().default("anonymous"),
  cookieDecision: text("cookie_decision", { enum: ["pending", "accepted", "declined"] }).notNull().default("pending"),
  personalization: integer("personalization", { mode: "boolean" }).notNull().default(true),
  adMeasurement: integer("ad_measurement", { mode: "boolean" }).notNull().default(false),
  gender: text("gender").notNull().default(""),
  ageRange: text("age_range").notNull().default(""),
  raceEthnicity: text("race_ethnicity").notNull().default(""),
  faith: text("faith").notNull().default(""),
  country: text("country").notNull().default(""),
  region: text("region").notNull().default(""),
  email: text("email").notNull().default(""),
  attractionsRowOrder: text("attractions_row_order").notNull().default(""),
  cineBinDock: text("cine_bin_dock").notNull().default(""),
  landingLayout: text("landing_layout").notNull().default(""),
  avatarBlobKey: text("avatar_blob_key"),
  emailStatus: text("email_status", { enum: ["none", "pending", "verified"] }).notNull().default("none"),
  verificationCodeHash: text("verification_code_hash").notNull().default(""),
  verificationExpiresAt: integer("verification_expires_at", { mode: "timestamp_ms" }),
  verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const pixSignupChallenges = sqliteTable(
  "pix_signup_challenges",
  {
    id: text("id").primaryKey(),
    prompt: text("prompt").notNull(),
    answerHash: text("answer_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("pix_signup_challenges_expiry_idx").on(table.expiresAt)],
);

export const pixAds = sqliteTable(
  "pix_ads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    placement: text("placement", { enum: ["matchup", "profile", "shorts"] }).notNull().default("matchup"),
    ctaLabel: text("cta_label").notNull().default(""),
    ctaUrl: text("cta_url"),
    active: integer("active", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("pix_ads_active_idx").on(table.active, table.updatedAt)],
);

export const pixActors = sqliteTable(
  "pix_actors",
  {
    qid: text("qid").primaryKey(),
    name: text("name").notNull(),
    sourceUrl: text("source_url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("pix_actors_name_idx").on(table.name)],
);

export const pixActorVotes = sqliteTable(
  "pix_actor_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    winnerQid: text("winner_qid").notNull().references(() => pixActors.qid, { onDelete: "cascade" }),
    loserQid: text("loser_qid").notNull().references(() => pixActors.qid, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("pix_actor_votes_created_idx").on(table.createdAt)],
);

export const pixMovieStats = sqliteTable(
  "pix_movie_stats",
  {
    imdbId: text("imdb_id").primaryKey(),
    title: text("title").notNull(),
    releaseYear: integer("release_year").notNull(),
    genre: text("genre").notNull(),
    posterKey: text("poster_key").notNull(),
    sourceUrl: text("source_url").notNull(),
    posterSourceUrl: text("poster_source_url").notNull().default(""),
    synopsis: text("synopsis").notNull().default(""),
    synopsisSourceUrl: text("synopsis_source_url").notNull().default(""),
    attributesJson: text("attributes_json").notNull().default("{}"),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    appearances: integer("appearances").notNull().default(0),
    unseenCount: integer("unseen_count").notNull().default(0),
    gameAppearancesJson: text("game_appearances_json").notNull().default("{}"),
    lastPlayedAt: integer("last_played_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    index("pix_movie_stats_year_idx").on(table.releaseYear, table.title),
    index("pix_movie_stats_updated_idx").on(table.updatedAt),
  ],
);

export const pixMoviePosts = sqliteTable(
  "pix_movie_posts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    authorProfileId: integer("author_profile_id").notNull().default(1).references(() => pixProfiles.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["comment", "thread", "response"] }).notNull(),
    parentId: integer("parent_id"),
    title: text("title").notNull().default(""),
    body: text("body").notNull(),
    relevanceCount: integer("relevance_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    index("pix_movie_posts_movie_idx").on(table.imdbId, table.createdAt),
    index("pix_movie_posts_parent_idx").on(table.parentId, table.createdAt),
    index("pix_movie_posts_relevance_idx").on(table.imdbId, table.relevanceCount),
  ],
);

// COMB's reported Top 100 highest-grossing films of all time — the supply
// line for ATTRACTIONS Row 2 (Biggest Financial Success). COMB publishes
// the chart (ranks 1–50 from Wikipedia's "List of highest-grossing films",
// ranks 51–100 from Box Office Mojo's all-time worldwide chart, checked
// Oct 2026); PIX stores the findings verbatim and resolves posters from
// the PIX catalog by title + year when the chart is read.
export const pixCombGrossers = sqliteTable("pix_comb_grossers", {
  rank: integer("rank").primaryKey(),
  title: text("title").notNull(),
  releaseYear: integer("release_year").notNull(),
  worldwideGross: integer("worldwide_gross").notNull(),
  source: text("source").notNull().default(""),
});

export const pixConfig = sqliteTable("pix_config", {
  service: text("service", { enum: ["youtube", "pixabay", "freesound", "vimeo", "backblaze_b2"] }).primaryKey(),
  secretValue: text("secret_value").notNull(),
  configuredAt: integer("configured_at", { mode: "timestamp_ms" }).notNull(),
  configuredByViewerKey: text("configured_by_viewer_key").notNull(),
  status: text("status", { enum: ["configured", "connected", "error"] }).notNull().default("configured"),
  statusDetail: text("status_detail").notNull().default(""),
  lastCheckedAt: integer("last_checked_at", { mode: "timestamp_ms" }),
});

export const pixTrending = sqliteTable(
  "pix_trending",
  {
    source: text("source", { enum: ["youtube_shorts"] }).notNull(),
    providerId: text("provider_id").notNull(),
    imdbId: text("imdb_id").references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    title: text("title"),
    channelTitle: text("channel_title"),
    durationSeconds: integer("duration_seconds"),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    rank: integer("rank").notNull(),
    datePulled: integer("date_pulled", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.source, table.providerId] }),
    index("pix_trending_rank_idx").on(table.source, table.rank),
    index("pix_trending_pulled_idx").on(table.datePulled),
  ],
);

export const pixTrendingRuns = sqliteTable(
  "pix_trending_runs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    status: text("status", { enum: ["updated", "not_configured", "source_error"] }).notNull(),
    detail: text("detail").notNull().default(""),
    matchedCount: integer("matched_count").notNull().default(0),
    pulledAt: integer("pulled_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("pix_trending_runs_pulled_idx").on(table.pulledAt)],
);

export const pixMovieDecks = sqliteTable(
  "pix_movie_decks",
  {
    deckKey: text("deck_key").primaryKey(),
    label: text("label").notNull(),
    releaseYear: integer("release_year").notNull(),
    targetSize: integer("target_size").notNull().default(100),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("pix_movie_decks_year_idx").on(table.releaseYear, table.sortOrder)],
);

export const pixMovieDeckEntries = sqliteTable(
  "pix_movie_deck_entries",
  {
    deckKey: text("deck_key").notNull().references(() => pixMovieDecks.deckKey, { onDelete: "cascade" }),
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.deckKey, table.imdbId] }),
    uniqueIndex("pix_movie_deck_position_idx").on(table.deckKey, table.position),
  ],
);

export const pixHorrorTags = sqliteTable(
  "pix_horror_tags",
  {
    tagKey: text("tag_key").primaryKey(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("pix_horror_tags_label_idx").on(table.label)],
);

export const pixMovieHorrorTags = sqliteTable(
  "pix_movie_horror_tags",
  {
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    tagKey: text("tag_key").notNull().references(() => pixHorrorTags.tagKey, { onDelete: "cascade" }),
    waveNumber: integer("wave_number").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.imdbId, table.tagKey] }),
    index("pix_movie_horror_tags_wave_idx").on(table.waveNumber, table.tagKey),
    index("pix_movie_horror_tags_tag_idx").on(table.tagKey, table.imdbId),
  ],
);

export const pixThrillerTags = sqliteTable(
  "pix_thriller_tags",
  {
    tagKey: text("tag_key").primaryKey(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("pix_thriller_tags_label_idx").on(table.label)],
);

export const pixMovieThrillerTags = sqliteTable(
  "pix_movie_thriller_tags",
  {
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    tagKey: text("tag_key").notNull().references(() => pixThrillerTags.tagKey, { onDelete: "cascade" }),
    waveNumber: integer("wave_number").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.imdbId, table.tagKey] }),
    index("pix_movie_thriller_tags_wave_idx").on(table.waveNumber, table.tagKey),
    index("pix_movie_thriller_tags_tag_idx").on(table.tagKey, table.imdbId),
  ],
);

export const pixActorMovieCredits = sqliteTable(
  "pix_actor_movie_credits",
  {
    actorName: text("actor_name").notNull(),
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [primaryKey({ columns: [table.actorName, table.imdbId] })],
);

export const pixMovieReviewScores = sqliteTable(
  "pix_movie_review_scores",
  {
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    scope: text("scope", { enum: ["global", "country", "region"] }).notNull(),
    scopeCode: text("scope_code").notNull().default("*"),
    averageScore: integer("average_score").notNull(),
    ratingCount: integer("rating_count").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.imdbId, table.scope, table.scopeCode] })],
);

export const pixMovieVotes = sqliteTable(
  "pix_movie_votes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    winnerImdbId: text("winner_imdb_id").notNull(),
    loserImdbId: text("loser_imdb_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("pix_movie_votes_created_idx").on(table.createdAt)],
);

export const pixMovieUnseen = sqliteTable("pix_movie_unseen", {
  imdbId: text("imdb_id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pixUserLibrary = sqliteTable(
  "pix_user_library",
  {
    userId: text("user_id").notNull(),
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.imdbId] }),
    index("pix_user_library_created_idx").on(table.userId, table.createdAt),
  ],
);

export const userDnaStrands = sqliteTable(
  "user_dna_strands",
  {
    strandKey: text("strand_key").primaryKey(),
    mediaType: text("media_type", { enum: ["movie", "tv", "reel"] }).notNull(),
    mediaId: text("media_id").notNull(),
    title: text("title").notNull(),
    knowledge: text("knowledge", { enum: ["unknown", "seen", "unseen"] }).notNull().default("unknown"),
    interest: text("interest", { enum: ["none", "want_to_see", "maybe", "not_interested", "never_heard_of_it"] }).notNull().default("none"),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    why: text("why").notNull().default(""),
    sourceGameKey: text("source_game_key").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("user_dna_media_idx").on(table.mediaType, table.mediaId),
    index("user_dna_game_idx").on(table.sourceGameKey, table.updatedAt),
  ],
);

export const filmDnaProfiles = sqliteTable("film_dna_profiles", {
  userId: text("user_id").primaryKey(),
  signatureVersion: integer("signature_version").notNull().default(1),
  voteCount: integer("vote_count").notNull().default(0),
  unseenCount: integer("unseen_count").notNull().default(0),
  queryCount: integer("query_count").notNull().default(0),
  genreWeightsJson: text("genre_weights_json").notNull().default("{}"),
  eraWeightsJson: text("era_weights_json").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const filmDnaMediaSignals = sqliteTable(
  "film_dna_media_signals",
  {
    userId: text("user_id").notNull().references(() => filmDnaProfiles.userId, { onDelete: "cascade" }),
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    knowledge: text("knowledge", { enum: ["unknown", "seen", "unseen"] }).notNull().default("unknown"),
    interest: text("interest", { enum: ["none", "want_to_see", "maybe", "not_interested", "never_heard_of_it"] }).notNull().default("none"),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    unseenCount: integer("unseen_count").notNull().default(0),
    queryMatchCount: integer("query_match_count").notNull().default(0),
    reasonsJson: text("reasons_json").notNull().default("[]"),
    sourceGameKey: text("source_game_key").notNull().default(""),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.imdbId] }),
    index("film_dna_media_user_idx").on(table.userId, table.updatedAt),
  ],
);

export const filmDnaQueries = sqliteTable(
  "film_dna_queries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => filmDnaProfiles.userId, { onDelete: "cascade" }),
    queryText: text("query_text").notNull(),
    matchedImdbIdsJson: text("matched_imdb_ids_json").notNull().default("[]"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("film_dna_queries_user_idx").on(table.userId, table.createdAt)],
);

export const filmDnaEvents = sqliteTable(
  "film_dna_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => filmDnaProfiles.userId, { onDelete: "cascade" }),
    signalType: text("signal_type", { enum: ["vote", "unseen", "query", "interest", "skip", "seen"] }).notNull(),
    primaryImdbId: text("primary_imdb_id"),
    secondaryImdbId: text("secondary_imdb_id"),
    gameKey: text("game_key").notNull().default(""),
    queryText: text("query_text").notNull().default(""),
    metadataJson: text("metadata_json").notNull().default("{}"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("film_dna_events_user_idx").on(table.userId, table.createdAt)],
);

export const pixGameResults = sqliteTable(
  "pix_game_results",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    gameKey: text("game_key").notNull(),
    gameTitle: text("game_title").notNull(),
    winnerImdbId: text("winner_imdb_id").notNull(),
    loserImdbId: text("loser_imdb_id").notNull(),
    why: text("why").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("pix_game_results_game_idx").on(table.gameKey, table.createdAt)],
);

export const pixFanTypes = sqliteTable(
  "pix_fan_types",
  {
    typeKey: text("type_key").primaryKey(),
    label: text("label").notNull(),
    description: text("description").notNull(),
    genreWeightsJson: text("genre_weights_json").notNull().default("{}"),
    eraWeightsJson: text("era_weights_json").notNull().default("{}"),
    tagWeightsJson: text("tag_weights_json").notNull().default("{}"),
    explorationBias: integer("exploration_bias").notNull().default(10),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("pix_fan_types_label_idx").on(table.label), index("pix_fan_types_order_idx").on(table.active, table.sortOrder)],
);

export const pixUserFanTypes = sqliteTable(
  "pix_user_fan_types",
  {
    userId: text("user_id").notNull(),
    typeKey: text("type_key").notNull().references(() => pixFanTypes.typeKey, { onDelete: "cascade" }),
    score: integer("score").notNull().default(0),
    confidence: integer("confidence").notNull().default(0),
    signalCount: integer("signal_count").notNull().default(0),
    directSelected: integer("direct_selected", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.userId, table.typeKey] }), index("pix_user_fan_types_user_idx").on(table.userId, table.score)],
);

export const pixFanTypeStates = sqliteTable("pix_fan_type_states", {
  userId: text("user_id").primaryKey(),
  consecutiveUnseen: integer("consecutive_unseen").notNull().default(0),
  questionAnswered: integer("question_answered", { mode: "boolean" }).notNull().default(false),
  focusKind: text("focus_kind", { enum: ["none", "type", "genre", "decade"] }).notNull().default("none"),
  focusValue: text("focus_value").notNull().default(""),
  answeredAt: integer("answered_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const pixFanTypeEvents = sqliteTable(
  "pix_fan_type_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    signalType: text("signal_type", { enum: ["vote", "unseen", "save", "direct"] }).notNull(),
    primaryImdbId: text("primary_imdb_id"),
    secondaryImdbId: text("secondary_imdb_id"),
    focusKind: text("focus_kind", { enum: ["none", "type", "genre", "decade"] }).notNull().default("none"),
    focusValue: text("focus_value").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("pix_fan_type_events_user_idx").on(table.userId, table.createdAt)],
);

export const pixClassicFilms = sqliteTable("pix_classic_films", {
  filmKey: text("film_key").primaryKey(),
  title: text("title").notNull(),
  releaseYear: integer("release_year").notNull(),
  profileName: text("profile_name").notNull().default("LunarTick"),
  bucketName: text("bucket_name").notNull(),
  pathPrefix: text("path_prefix").notNull(),
  streamBaseUrl: text("stream_base_url").notNull().default(""),
  stillUrl: text("still_url").notNull().default(""),
  totalSegments: integer("total_segments").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const pixClassicClips = sqliteTable(
  "pix_classic_clips",
  {
    filmKey: text("film_key").notNull().references(() => pixClassicFilms.filmKey, { onDelete: "cascade" }),
    segmentNumber: integer("segment_number").notNull(),
    title: text("title").notNull(),
    fileName: text("file_name").notNull(),
    streamUrl: text("stream_url").notNull().default(""),
    thumbnailUrl: text("thumbnail_url").notNull().default(""),
    durationMs: integer("duration_ms").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.filmKey, table.segmentNumber] }),
    uniqueIndex("pix_classic_clips_file_idx").on(table.fileName),
    index("pix_classic_clips_film_order_idx").on(table.filmKey, table.segmentNumber),
  ],
);

export const cineAccounts = sqliteTable("cine_accounts", {
  id: integer("id").primaryKey(),
  plan: text("plan", { enum: ["free", "paid"] }).notNull().default("free"),
  quotaBytes: integer("quota_bytes").notNull().default(500_000_000),
  stripeSessionId: text("stripe_session_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const cineSocialProfiles = sqliteTable(
  "cine_social_profiles",
  {
    platform: text("platform", { enum: ["tiktok", "youtube", "facebook", "x", "bluesky", "instagram"] }).primaryKey(),
    accountLabel: text("account_label").notNull().default(""),
    format: text("format", { enum: ["vertical", "square", "landscape"] }).notNull().default("vertical"),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("cine_social_profiles_enabled_idx").on(table.enabled, table.updatedAt)],
);

export const cineAssets = sqliteTable(
  "cine_assets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    durationSeconds: integer("duration_seconds"),
    storageKey: text("storage_key").notNull(),
    thumbnailUrl: text("thumbnail_url").notNull().default(""),
    status: text("status", { enum: ["pending", "ready"] }).notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("cine_assets_status_idx").on(table.status, table.createdAt)],
);

export const cineChunkedUploads = sqliteTable(
  "cine_chunked_uploads",
  {
    id: text("id").primaryKey(),
    assetName: text("asset_name").notNull(),
    mimeType: text("mime_type").notNull(),
    totalSizeBytes: integer("total_size_bytes").notNull(),
    totalChunks: integer("total_chunks").notNull(),
    durationSeconds: integer("duration_seconds"),
    receivedChunks: text("received_chunks").notNull().default("[]"),
    status: text("status", { enum: ["uploading", "completed", "aborted"] }).notNull().default("uploading"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("cine_chunked_uploads_status_idx").on(table.status, table.createdAt)],
);

export const cineUploadParts = sqliteTable(
  "cine_upload_parts",
  {
    uploadId: text("upload_id").notNull().references(() => cineChunkedUploads.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    dataBase64: text("data_base64").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.uploadId, table.chunkIndex] })],
);

export const cineShortStats = sqliteTable(
  "cine_short_stats",
  {
    assetId: integer("asset_id").primaryKey().references(() => cineAssets.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
    plays: integer("plays").notNull().default(0),
    completions: integer("completions").notNull().default(0),
    totalWatchMs: integer("total_watch_ms").notNull().default(0),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("cine_short_stats_rank_idx").on(table.plays, table.completions, table.views)],
);

export const chatThreads = sqliteTable(
  "chat_threads",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["agent", "friend"] }).notNull(),
    title: text("title").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("chat_threads_updated_idx").on(table.updatedAt)],
);

export const chatMessages = sqliteTable(
  "chat_messages",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    threadId: integer("thread_id").notNull().references(() => chatThreads.id, { onDelete: "cascade" }),
    sender: text("sender", { enum: ["user", "friend", "agent"] }).notNull(),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("chat_messages_thread_idx").on(table.threadId, table.createdAt)],
);

export const pixUserLists = sqliteTable(
  "pix_user_lists",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    visibility: text("visibility", { enum: ["private", "public"] }).notNull().default("private"),
    shareCode: text("share_code").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("pix_user_lists_share_code_idx").on(table.shareCode),
    index("pix_user_lists_user_idx").on(table.userId, table.createdAt),
  ],
);

export const pixUserListItems = sqliteTable(
  "pix_user_list_items",
  {
    listId: integer("list_id").notNull().references(() => pixUserLists.id, { onDelete: "cascade" }),
    imdbId: text("imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [
    primaryKey({ columns: [table.listId, table.imdbId] }),
    index("pix_user_list_items_list_idx").on(table.listId, table.createdAt),
  ],
);

export const pixToughShares = sqliteTable(
  "pix_tough_shares",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    leftImdbId: text("left_imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    rightImdbId: text("right_imdb_id").notNull().references(() => pixMovieStats.imdbId, { onDelete: "cascade" }),
    pickCount: integer("pick_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (table) => [index("pix_tough_shares_user_idx").on(table.userId, table.createdAt)],
);

export const notes = sqliteTable(
  "notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", {
      enum: ["section", "scratchpad", "dream", "monster", "poster", "movie", "memo"],
    }).notNull(),
    entityKey: text("entity_key"),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    noteDate: text("note_date"),
    tags: text("tags").notNull().default(""),
    sortOrder: integer("sort_order"),
    parentNoteId: integer("parent_note_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("notes_entity_key_idx").on(table.entityKey),
    index("notes_kind_idx").on(table.kind),
    index("notes_movie_kind_idx").on(table.kind, table.noteDate, table.createdAt),
    index("notes_dream_date_idx").on(table.noteDate, table.createdAt),
    index("notes_parent_idx").on(table.parentNoteId),
  ],
);

// Safe-space moderation dictionary: words PIX.MOV does not allow in
// user names, list titles, reviews, or discussions. Seeded by the
// migration that creates the table (~1,000 entries incl. leetspeak
// variants). `substring` rows match anywhere inside a token (reserved
// for distinctive slurs and hate terms); the rest match whole tokens
// only, so ordinary words that merely contain a flagged string are
// never caught.
export const pixFlaggedWords = sqliteTable(
  "pix_flagged_words",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    word: text("word").notNull(),
    substring: integer("substring", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("pix_flagged_words_word_idx").on(table.word)],
);

// Visitor feedback inbox: feedback, ideas, issues, and user reports
// from the Feedback page. Read by the PIX team; nothing here is public.
export const pixFeedback = sqliteTable(
  "pix_feedback",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    kind: text("kind", { enum: ["feedback", "idea", "issue", "report_user"] }).notNull(),
    message: text("message").notNull(),
    reportedUser: text("reported_user").notNull().default(""),
    authorProfileId: integer("author_profile_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("pix_feedback_created_idx").on(table.createdAt)],
);
