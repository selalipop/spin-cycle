import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  // convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const sentimentsValidator = v.object({
  stability: v.number(),
  attention: v.number(),
  curiosity: v.number(),
  corporate_blame: v.number(),
  government_blame: v.number(),
});

// [low, medium, high, max] point values per sentiment bracket
const scoringRowValidator = v.array(v.number()); // always length 4

const qualityValidator = v.object({
  name: v.string(),
  description: v.string(),
  rubric: v.string(),
});

const actionTypeValidator = v.object({
  id: v.string(),
  name: v.string(),
  cost: v.number(),
  prompt: v.string(),
  qualities: v.array(qualityValidator),
  repeatable: v.boolean(),
  is_special: v.boolean(),
});

export default defineSchema({
  games: defineTable({
    event: v.string(),
    max_rounds: v.number(),
    current_round: v.number(),
    phase: v.union(
      v.literal("lobby"),
      v.literal("planning"),
      v.literal("submitting"),
      v.literal("resolving"),
      v.literal("results"),
      v.literal("game_over"),
    ),
    sentiments: sentimentsValidator,
    round_summaries: v.array(v.string()),

    // shared actions available to all factions
    shared_actions: v.array(actionTypeValidator),
  }),

  factions: defineTable({
    game_id: v.id("games"),
    name: v.string(),
    archetype: v.string(),
    credits: v.number(),

    scoring: v.object({
      stability: scoringRowValidator,
      attention: scoringRowValidator,
      curiosity: scoringRowValidator,
      corporate_blame: scoringRowValidator,
      government_blame: scoringRowValidator,
    }),

    faction_actions: v.array(actionTypeValidator),
  }).index("by_game", ["game_id"]),

  players: defineTable({
    game_id: v.id("games"),
    faction_id: v.id("factions"),
    name: v.string(),
    session_id: v.string(), // for identifying browser sessions
  })
    .index("by_game", ["game_id"])
    .index("by_faction", ["faction_id"])
    .index("by_session", ["session_id"]),

  rounds: defineTable({
    game_id: v.id("games"),
    number: v.number(),
    event_development: v.string(),

    sentiment_before: sentimentsValidator,
    sentiment_after: v.optional(sentimentsValidator),

    narrative: v.optional(v.string()),

    credit_bonuses: v.optional(
      v.object({
        quality: v.array(v.id("factions")),
        highest_impact: v.optional(v.id("factions")),
      }),
    ),
  }).index("by_game_and_number", ["game_id", "number"]),

  submitted_actions: defineTable({
    game_id: v.id("games"),
    round_id: v.id("rounds"),
    faction_id: v.id("factions"),
    action_type_id: v.string(),
    content: v.string(),
    cost: v.number(),

    // filled in during resolution
    effectiveness: v.optional(v.number()),
    quality_scores: v.optional(v.record(v.string(), v.number())),
    impact: v.optional(v.number()),
    reasoning: v.optional(v.string()),
  })
    .index("by_round", ["round_id"])
    .index("by_round_and_faction", ["round_id", "faction_id"])
    .index("by_game", ["game_id"]),
});