// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { gamePhase } from "./game_phase";

// =============================================================================
// SHARED FIELD DEFINITIONS
// =============================================================================

/**
 * The 5 public sentiment axes that define the "state of the world."
 * All start at 50. Range is 0-100.
 *
 * - stability: do people think things are under control?
 * - attention: is the public still watching this story?
 * - curiosity: do people want answers / are they digging deeper?
 * - corporate_blame: are people blaming the private sector?
 * - government_blame: are people blaming the government?
 */
const sentiments = v.object({
  stability: v.number(),
  attention: v.number(),
  curiosity: v.number(),
  corporate_blame: v.number(),
  government_blame: v.number(),
});

/**
 * 4 numbers: [low, medium, high, max] — points a faction earns when
 * a sentiment lands in that bracket.
 *   low = 0-25, medium = 26-50, high = 51-75, max = 76-100
 *
 * Positive = good for this faction. Negative = bad.
 * Example — The Institute's stability: [-3, -1, 2, 5]
 * means low stability hurts them, max stability is great.
 */
const scoringRow = v.array(v.number());

/**
 * One axis the AI grades player content on. Each action has ~3 of these.
 * e.g. a Social Media Post is graded on "Short", "Catchy", "Emotional."
 *
 * - name: label shown to player, e.g. "Catchy"
 * - description: guidance shown to player, e.g. "Memorable, something
 *   people would repeat or screenshot"
 * - ai_scoring_instructions: NOT shown to player. Tells the AI how to
 *   score 1-10 on this criterion.
 */
const scoringCriterion = v.object({
  name: v.string(),
  description: v.string(),
  ai_scoring_instructions: v.string(),
});

/**
 * Something a player can spend credits on. 4 shared + 3 per faction.
 *
 * - cost: 1-4 credits
 * - prompt: the question the player sees, e.g. "What are you posting?"
 * - scoring_criteria: what the AI grades their content on
 * - repeatable: can you use this multiple times in one round? (only 1-cost actions)
 * - is_special: is this the faction's big expensive signature move?
 */
const actionType = v.object({
  id: v.string(),
  name: v.string(),
  cost: v.number(),
  prompt: v.string(),
  scoring_criteria: v.array(scoringCriterion),
  repeatable: v.boolean(),
  is_special: v.boolean(),
});

// =============================================================================
// TABLES
// =============================================================================

export default defineSchema({
  // ===========================================================================
  // GAMES — one row per game session
  // ===========================================================================
  games: defineTable({
    /**
     * Public UUID used in browser URLs, e.g. /game/:gameId/host.
     * Keep this separate from Convex document IDs.
     */
    public_id: v.string(),

    /** 4-6 character uppercase code players type on their phone. */
    join_code: v.string(),

    /** Scenario key selected for this game, e.g. "golden_gate". */
    scenario_id: v.optional(v.string()),

    /** Human-readable scenario title shown on the big screen. */
    scenario_title: v.optional(v.string()),

    /** Public path to intro video played during introduction phase. */
    intro_video: v.optional(v.string()),

    /** The seed event, e.g. "A second Golden Gate Bridge appeared overnight..." */
    event: v.string(),

    /** How many rounds. Default 4. */
    max_rounds: v.number(),

    /**
     * Which round is currently active (1-based). Missing means no round has
     * started yet (lobby + introduction).
     */
    current_round: v.optional(v.number()),

    /**
     * State machine phase:
     * game_lobby → game_introduction → round_loading → round_voting
     *   → round_processing → round_results ... → game_ending → game_results
     *
     * - game_lobby: players joining, picking factions
     * - game_introduction: host introduces the premise before round 1 starts
     * - round_loading: round setup + briefing generation
     * - round_voting: players choose and submit their faction action content
     * - round_processing: submissions locked, AI processing
     * - round_results: show round recap, sentiment movement, score updates
     * - game_ending: post-round narrative wrap-up before final standings
     * - game_results: final scores, epilogue, winner
     */
    phase: gamePhase,

    /** Current public sentiment. All start at 50. */
    sentiments: sentiments,

    /** AI-generated recap of each completed round. Index 0 = round 1. */
    round_summaries: v.array(v.string()),

    /**
     * The 4 shared actions every faction can use:
     * Social Media Post (1), Public Statement (1),
     * Place a Story (2), Anonymous Leak (3)
     */
    shared_actions: v.array(actionType),
  })
    .index("by_join_code", ["join_code"])
    .index("by_public_id", ["public_id"]),

  // ===========================================================================
  // FACTIONS — always exactly 4 per game
  //
  // The Institute: eerily calm, sanitized, GSK/Purdue energy. Wants boring.
  // Crowdswell: disorganized, Area 51, Alex Jones/Joe Rogan energy. Sells merch.
  // Pinnacle Media Group: bombastic, Ted Turner, engagement-brained. Wants eyeballs.
  // The Foundation for Public Good: EA-flavored, talks like Swedes, paternalistic.
  //   Preaches safety while grabbing power.
  // ===========================================================================
  factions: defineTable({
    game_id: v.id("games"),
    /** Stable string key for clients, e.g. "the_institute". */
    code: v.string(),
    name: v.string(),
    /** One-line player-facing summary for faction selection UI. */
    description: v.string(),

    /**
     * Full personality description used in AI prompts.
     * Describes voice, motivations, media style, selfish goals.
     * This is what makes the same action come out differently for each faction
     * and what drives the AI to generate briefings in the right voice.
     */
    archetype: v.string(),

    /**
     * Credit balance. Starts at 8.
     * Each round: +3 base, +1 for good content, +1 for highest impact.
     */
    credits: v.number(),

    /**
     * The faction's scoring table — THIS IS THEIR OBJECTIVE.
     * For each of the 5 sentiments, 4 numbers [low, med, high, max]
     * saying how many game points that bracket is worth to this faction.
     *
     * Final score = sum of points across all 5 sentiments.
     */
    scoring: v.object({
      stability: scoringRow,
      attention: scoringRow,
      curiosity: scoringRow,
      corporate_blame: scoringRow,
      government_blame: scoringRow,
    }),

    /**
     * 3 faction-specific actions:
     * [0] regular at 2 credits
     * [1] regular at 3 credits
     * [2] special at 4 credits (is_special = true)
     */
    faction_actions: v.array(actionType),
  })
    .index("by_game", ["game_id"])
    .index("by_game_and_code", ["game_id", "code"]),

  // ===========================================================================
  // PLAYERS — individual humans on phones
  // ===========================================================================
  players: defineTable({
    game_id: v.id("games"),
    faction_id: v.id("factions"),
    /** Public UUID used in browser URLs, e.g. /game/:gameId/player/:playerId. */
    public_id: v.string(),
    name: v.string(),
    /** Public avatar image path from the built-in set, e.g. /avatars/avatar_1.png. */
    avatar: v.string(),

    /**
     * Random ID from the browser. No login needed, Jackbox-style.
     * Stored in cookie/localStorage so you can rejoin if you close the tab.
     */
    session_id: v.string(),
  })
    .index("by_game", ["game_id"])
    .index("by_faction", ["faction_id"])
    .index("by_session", ["session_id"])
    .index("by_public_id", ["public_id"])
    .index("by_game_and_session", ["game_id", "session_id"]),

  // ===========================================================================
  // ROUNDS — one row per round per game
  // ===========================================================================
  rounds: defineTable({
    game_id: v.id("games"),
    number: v.number(),

    /**
     * What actually happened in the world this round, e.g.
     * "Day 2: 50,000 people drove across the new bridge. Yelp reviews
     *  are appearing. 4.8 stars."
     *
     * Round 1 = the initial event description.
     * Later rounds: AI advances the "ground truth," bent by whoever
     * won the previous round (see reality_shaped_by).
     */
    event_development: v.string(),

    /**
     * Which faction's narrative goal shaped THIS round's event_development.
     * Null for round 1 (no previous winner yet).
     *
     * The winning faction from last round doesn't literally get their goal,
     * but the AI bends reality in their direction. If Crowdswell won last
     * round wanting "evidence someone knew," a suspicious document might
     * surface. If the Institute won wanting "boring explanation," a
     * credible mundane theory gains traction.
     *
     * The story ALWAYS escalates — even an Institute win doesn't de-escalate,
     * it just makes the Institute more powerful within a still-crazy situation.
     */
    reality_shaped_by: v.optional(v.id("factions")),

    /** Sentiment snapshot BEFORE this round's actions */
    sentiment_before: sentiments,

    /** Sentiment snapshot AFTER processing. Null until processing completes. */
    sentiment_after: v.optional(sentiments),

    /**
     * The big AI output — the news cycle narrative.
     * Headlines, chyrons, social posts, public reactions.
     * This is what goes on the big screen. Null until processing completes.
     */
    narrative: v.optional(v.string()),

    /**
     * A larger second-wave consequence that escalates the event after
     * the winning narrative lands.
     */
    escalation: v.optional(v.string()),

    /**
     * Optional generated intro video state for this round. Populated when the
     * previous round resolves and we enqueue a FAL video job for this round.
     */
    intro_video_request_id: v.optional(v.string()),
    intro_video_storage_id: v.optional(v.id("_storage")),
    intro_video_error: v.optional(v.string()),

    /**
     * Who earned bonus credits this round. Null until processing completes.
     * - quality: factions that had at least one action score effectiveness >= 7
     * - highest_impact: the single faction with highest impact
     *   (impact = cost × effectiveness)
     */
    credit_bonuses: v.optional(
      v.object({
        quality: v.array(v.id("factions")),
        highest_impact: v.optional(v.id("factions")),
      }),
    ),

    /**
     * Per-faction briefing and goal for this round.
     * AI-generated based on faction archetype + current game state.
     *
     * - goal: one sentence, always visible at top of phone screen. The CTA.
     *   e.g. "Make the public believe the bridge is mundane engineering"
     * - briefing: 3-5 sentences in the faction's voice. Flavorful,
     *   reveals their selfish motivations, references current events in-game.
     *   Expandable on the phone UI, optional reading but very fun.
     *
     * Example Institute goal: "Get CalTrans to require your safety audit"
     * Example Institute briefing: "Team, this is a Code Beige. The bridge is
     *   structurally identical to the original — our materials people confirmed
     *   the alloy composition in an hour. That's GOOD. That means it's
     *   explainable. CalTrans has a consulting RFP opening in March and we
     *   need to be the ones they call. KEEP. IT. BORING."
     */
    faction_briefs: v.record(
      v.id("factions"),
      v.object({
        goal: v.string(),
        briefing: v.string(),
      }),
    ),

    /**
     * Tracks which factions have submitted their action(s) this round.
     * Used to determine when to transition from round_voting → round_processing.
     *
     * Currently the game expects 1 action per faction per round,
     * but this isn't hardcoded — we just check that every faction
     * has at least one submitted action before processing.
     */
    faction_submitted: v.record(v.id("factions"), v.boolean()),

    /** Timestamp when planning briefings were finished. */
    planning_generated_at_ms: v.optional(v.number()),

    /** Timestamp when submitting started for this round. */
    submitting_started_at_ms: v.optional(v.number()),

    /** Absolute deadline for submitting timeout handling (epoch ms). */
    submitting_deadline_ms: v.optional(v.number()),
  }).index("by_game_and_number", ["game_id", "number"]),

  // ===========================================================================
  // SUBMITTED ACTIONS — every action a faction takes in a round
  //
  // Currently 1 per faction per round, but the schema supports more.
  //
  // Lifecycle:
  // ROUND_LOADING phase: prepare round context + briefings
  // ROUND_VOTING phase: players submit their action content
  // ROUND_PROCESSING phase: AI grades it → effectiveness, grading_rubric, impact
  // ===========================================================================
  submitted_actions: defineTable({
    game_id: v.id("games"),
    round_id: v.id("rounds"),
    faction_id: v.id("factions"),

    /**
     * Which action this is (e.g. "social_media_post", "whistleblower").
     * References an action type ID from game.shared_actions or
     * faction.faction_actions.
     */
    action_type_id: v.string(),

    /** What the player actually typed. The creative content. */
    content: v.string(),

    /** Credit cost, copied from the action type for easy access. */
    cost: v.number(),

    // --- Everything below is null until the AI grades it in RESOLVING ---

    /**
     * Overall effectiveness, 0-10.
     * Average of the individual criterion scores.
     */
    effectiveness: v.optional(v.number()),

    /**
     * Per-criterion scores, e.g. { "Catchy": 7, "Emotional": 5, "Short": 8 }
     * Keys match the scoring_criteria names on the action type.
     */
    grading_rubric: v.optional(v.record(v.string(), v.number())),

    /**
     * impact = cost × effectiveness
     * A perfect 4-cost special (impact=40) beats a perfect 1-cost post (impact=10).
     * Used to determine who gets the highest-impact credit bonus.
     */
    impact: v.optional(v.number()),

    /**
     * AI's explanation of the scores, e.g.
     * "The whistleblower felt credible but the timeline didn't add up"
     * Not shown during the game. Useful for post-game recap and debugging.
     */
    reasoning: v.optional(v.string()),
  })
    .index("by_round", ["round_id"])
    .index("by_round_and_faction", ["round_id", "faction_id"])
    .index("by_game", ["game_id"]),
});
