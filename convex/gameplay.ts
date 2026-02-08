import { ConvexError, v } from 'convex/values'
import { retry } from '@lifeomic/attempt'
import { OpenRouter } from '@openrouter/sdk'
import { Liquid } from 'liquidjs'
import { internal } from './_generated/api'
import type { Doc, Id } from './_generated/dataModel'
import { GamePhase, gamePhase } from './game_phase'
import {
  action,
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from './_generated/server'
import { GENERATE_FACTION_BRIEF } from './prompts'

const DEFAULT_OPENROUTER_MODEL = 'anthropic/claude-sonnet-4.5'
const SUBMITTING_DURATION_MS = 60_000
const MAX_SUBMISSION_CONTENT_LENGTH = 1800

const sentiments = v.object({
  stability: v.number(),
  attention: v.number(),
  curiosity: v.number(),
  corporate_blame: v.number(),
  government_blame: v.number(),
})

const scoringRow = v.array(v.number())

const scoring = v.object({
  stability: scoringRow,
  attention: scoringRow,
  curiosity: scoringRow,
  corporate_blame: scoringRow,
  government_blame: scoringRow,
})

const actionOption = v.object({
  id: v.string(),
  name: v.string(),
  cost: v.number(),
  prompt: v.string(),
  isSpecial: v.boolean(),
  isShared: v.boolean(),
  affordable: v.boolean(),
})

const factionPlayer = v.object({
  id: v.string(),
  name: v.string(),
  avatar: v.string(),
})

const brief = v.object({
  goal: v.string(),
  briefing: v.string(),
})

const participatingFactionStatus = v.object({
  id: v.id('factions'),
  code: v.string(),
  name: v.string(),
  description: v.string(),
  playerCount: v.number(),
  submitted: v.boolean(),
  hasBriefing: v.boolean(),
})

const submittedActionSummary = v.object({
  id: v.id('submitted_actions'),
  factionId: v.id('factions'),
  actionTypeId: v.string(),
  content: v.string(),
  cost: v.number(),
})

const planningGenerationStatus = v.union(
  v.literal('started'),
  v.literal('ready'),
  v.literal('noop'),
)

export const getMainScreenRoundState = query({
  args: {
    gameId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      gameId: v.string(),
      phase: gamePhase,
      scenarioTitle: v.string(),
      event: v.string(),
      sentiments: sentiments,
      roundNumber: v.optional(v.number()),
      submittingDeadlineMs: v.optional(v.number()),
      participatingFactionCount: v.number(),
      submittedFactionCount: v.number(),
      allParticipatingSubmitted: v.boolean(),
      factions: v.array(participatingFactionStatus),
      submittedActions: v.array(submittedActionSummary),
    }),
  ),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      return null
    }

    const [factions, players, round] = await Promise.all([
      ctx.db
        .query('factions')
        .withIndex('by_game', (q) => q.eq('game_id', game._id))
        .collect(),
      ctx.db
        .query('players')
        .withIndex('by_game', (q) => q.eq('game_id', game._id))
        .collect(),
      getCurrentRound(ctx, game),
    ])

    const playerCounts = countPlayersByFaction(players)
    const participatingFactionIds = getParticipatingFactionIds(round)
    const participatingSet = new Set(participatingFactionIds)

    const factionsForView = (round ? factions.filter((faction) => participatingSet.has(faction._id)) : factions)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((faction) => {
        const submitted = round ? Boolean(round.faction_submitted[faction._id]) : false
        const hasBriefing = round ? Boolean(round.faction_briefs[faction._id]) : false

        return {
          id: faction._id,
          code: faction.code,
          name: faction.name,
          description: faction.description,
          playerCount: playerCounts.get(faction._id) ?? 0,
          submitted,
          hasBriefing,
        }
      })

    const submittedActions =
      round === null
        ? []
        : (await ctx.db
            .query('submitted_actions')
            .withIndex('by_round', (q) => q.eq('round_id', round._id))
            .collect())
            .sort((a, b) => a._creationTime - b._creationTime)
            .map((action) => ({
              id: action._id,
              factionId: action.faction_id,
              actionTypeId: action.action_type_id,
              content: action.content,
              cost: action.cost,
            }))

    const submittedFactionCount = round
      ? Object.values(round.faction_submitted).filter(Boolean).length
      : 0

    return {
      gameId: game.public_id,
      phase: game.phase,
      scenarioTitle: game.scenario_title ?? 'Breaking Story',
      event: round?.event_development ?? game.event,
      sentiments: game.sentiments,
      roundNumber: round?.number,
      submittingDeadlineMs: round?.submitting_deadline_ms,
      participatingFactionCount: participatingFactionIds.length,
      submittedFactionCount,
      allParticipatingSubmitted:
        round !== null &&
        participatingFactionIds.length > 0 &&
        participatingFactionIds.every((factionId) => Boolean(round.faction_submitted[factionId])),
      factions: factionsForView,
      submittedActions,
    }
  },
})

export const getPlayerRoundState = query({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      gameId: v.string(),
      phase: gamePhase,
      roundNumber: v.optional(v.number()),
      event: v.string(),
      sentiments: sentiments,
      submittingDeadlineMs: v.optional(v.number()),
      player: v.object({
        id: v.string(),
        name: v.string(),
        avatar: v.string(),
        faction: v.object({
          id: v.id('factions'),
          code: v.string(),
          name: v.string(),
          description: v.string(),
        }),
      }),
      factionCredits: v.number(),
      factionPlayers: v.array(factionPlayer),
      goal: v.optional(v.string()),
      briefing: v.optional(v.string()),
      factionSubmitted: v.boolean(),
      sharedActions: v.array(actionOption),
      factionActions: v.array(actionOption),
      submittedAction: v.optional(
        v.object({
          id: v.id('submitted_actions'),
          actionTypeId: v.string(),
          cost: v.number(),
          content: v.string(),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      return null
    }

    const player = await ctx.db
      .query('players')
      .withIndex('by_public_id', (q) => q.eq('public_id', args.playerId))
      .unique()

    if (!player || player.game_id !== game._id) {
      return null
    }

    const [faction, factionPlayers, round] = await Promise.all([
      ctx.db.get(player.faction_id),
      ctx.db
        .query('players')
        .withIndex('by_faction', (q) => q.eq('faction_id', player.faction_id))
        .collect(),
      getCurrentRound(ctx, game),
    ])

    if (!faction || faction.game_id !== game._id) {
      return null
    }

    const factionSubmitted = round ? Boolean(round.faction_submitted[faction._id]) : false
    const factionBrief = round?.faction_briefs[faction._id]

    const submittedAction =
      round === null
        ? undefined
        : await ctx.db
            .query('submitted_actions')
            .withIndex('by_round_and_faction', (q) =>
              q.eq('round_id', round._id).eq('faction_id', faction._id),
            )
            .first()

    return {
      gameId: game.public_id,
      phase: game.phase,
      roundNumber: round?.number,
      event: round?.event_development ?? game.event,
      sentiments: game.sentiments,
      submittingDeadlineMs: round?.submitting_deadline_ms,
      player: {
        id: player.public_id,
        name: player.name,
        avatar: player.avatar,
        faction: {
          id: faction._id,
          code: faction.code,
          name: faction.name,
          description: faction.description,
        },
      },
      factionCredits: faction.credits,
      factionPlayers: factionPlayers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((factionPlayer) => ({
          id: factionPlayer.public_id,
          name: factionPlayer.name,
          avatar: factionPlayer.avatar,
        })),
      goal: factionBrief?.goal,
      briefing: factionBrief?.briefing,
      factionSubmitted,
      sharedActions: game.shared_actions.map((action) => ({
        id: action.id,
        name: action.name,
        cost: action.cost,
        prompt: action.prompt,
        isSpecial: action.is_special,
        isShared: true,
        affordable: faction.credits >= action.cost,
      })),
      factionActions: faction.faction_actions.map((action) => ({
        id: action.id,
        name: action.name,
        cost: action.cost,
        prompt: action.prompt,
        isSpecial: action.is_special,
        isShared: false,
        affordable: faction.credits >= action.cost,
      })),
      submittedAction: submittedAction
        ? {
            id: submittedAction._id,
            actionTypeId: submittedAction.action_type_id,
            cost: submittedAction.cost,
            content: submittedAction.content,
          }
        : undefined,
    }
  },
})

export const submitFactionAction = mutation({
  args: {
    gameId: v.string(),
    playerId: v.string(),
    actionTypeId: v.string(),
    content: v.string(),
  },
  returns: v.object({
    status: v.union(v.literal('submitted'), v.literal('locked')),
    phase: gamePhase,
    factionSubmitted: v.boolean(),
    submissionId: v.id('submitted_actions'),
    actionTypeId: v.string(),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    const phase = game.phase

    const player = await ctx.db
      .query('players')
      .withIndex('by_public_id', (q) => q.eq('public_id', args.playerId))
      .unique()

    if (!player || player.game_id !== game._id) {
      throw new ConvexError('Player not found')
    }

    if (phase !== GamePhase.RoundVoting) {
      throw new ConvexError('This round is not accepting submissions')
    }

    if (!game.current_round) {
      throw new ConvexError('Round has not been initialized')
    }

    const round = await ctx.db
      .query('rounds')
      .withIndex('by_game_and_number', (q) =>
        q.eq('game_id', game._id).eq('number', game.current_round as number),
      )
      .unique()

    if (!round) {
      throw new ConvexError('Current round not found')
    }

    const factionId = player.faction_id

    if (!(factionId in round.faction_submitted)) {
      throw new ConvexError('Your faction is not participating in this round')
    }

    const existingSubmission = await ctx.db
      .query('submitted_actions')
      .withIndex('by_round_and_faction', (q) =>
        q.eq('round_id', round._id).eq('faction_id', factionId),
      )
      .first()

    if (round.faction_submitted[factionId] || existingSubmission) {
      if (!existingSubmission) {
        throw new ConvexError('Faction is already locked for this round')
      }

      return {
        status: 'locked' as const,
        phase,
        factionSubmitted: true,
        submissionId: existingSubmission._id,
        actionTypeId: existingSubmission.action_type_id,
      }
    }

    const faction = await ctx.db.get(factionId)

    if (!faction || faction.game_id !== game._id) {
      throw new ConvexError('Faction not found')
    }

    const actionType = findActionType(game, faction, args.actionTypeId)

    if (!actionType) {
      throw new ConvexError('Invalid action selection')
    }

    if (faction.credits < actionType.cost) {
      throw new ConvexError('Not enough credits for that action')
    }

    const content = normalizeSubmissionContent(args.content)

    const submissionId = await ctx.db.insert('submitted_actions', {
      game_id: game._id,
      round_id: round._id,
      faction_id: faction._id,
      action_type_id: actionType.id,
      content,
      cost: actionType.cost,
    })

    await ctx.db.patch(faction._id, {
      credits: faction.credits - actionType.cost,
    })

    const nextFactionSubmitted = {
      ...round.faction_submitted,
      [faction._id]: true,
    }

    await ctx.db.patch(round._id, {
      faction_submitted: nextFactionSubmitted,
    })

    if (areAllParticipatingFactionsSubmitted(nextFactionSubmitted)) {
      await ctx.db.patch(game._id, {
        phase: GamePhase.RoundProcessing,
      })
    }

    return {
      status: 'submitted' as const,
      phase: areAllParticipatingFactionsSubmitted(nextFactionSubmitted)
        ? GamePhase.RoundProcessing
        : phase,
      factionSubmitted: true,
      submissionId,
      actionTypeId: actionType.id,
    }
  },
})

export const advanceSubmittingToResolving = mutation({
  args: {
    gameId: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    phase: gamePhase,
    insertedAbstains: v.number(),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    const phase = game.phase

    if (phase !== GamePhase.RoundVoting) {
      return {
        phase,
        insertedAbstains: 0,
      }
    }

    if (!game.current_round) {
      throw new ConvexError('No active round to resolve')
    }

    const round = await ctx.db
      .query('rounds')
      .withIndex('by_game_and_number', (q) =>
        q.eq('game_id', game._id).eq('number', game.current_round as number),
      )
      .unique()

    if (!round) {
      throw new ConvexError('Current round not found')
    }

    const nextFactionSubmitted = {
      ...round.faction_submitted,
    }

    let insertedAbstains = 0
    const abstainContent =
      args.reason === 'timeout'
        ? 'No statement issued before deadline.'
        : 'No statement issued during submission.'

    for (const [factionId, isSubmitted] of Object.entries(round.faction_submitted) as Array<
      [Id<'factions'>, boolean]
    >) {
      if (isSubmitted) {
        continue
      }

      await ctx.db.insert('submitted_actions', {
        game_id: game._id,
        round_id: round._id,
        faction_id: factionId,
        action_type_id: 'abstain',
        content: abstainContent,
        cost: 0,
      })

      nextFactionSubmitted[factionId] = true
      insertedAbstains += 1
    }

    if (insertedAbstains > 0) {
      await ctx.db.patch(round._id, {
        faction_submitted: nextFactionSubmitted,
      })
    }

    await ctx.db.patch(game._id, {
      phase: GamePhase.RoundProcessing,
    })

    return {
      phase: GamePhase.RoundProcessing,
      insertedAbstains,
    }
  },
})

export const generatePlanningBriefings = action({
  args: {
    gameId: v.string(),
  },
  returns: v.object({
    status: v.union(v.literal('generated'), v.literal('noop'), v.literal('in_progress')),
    generatedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const begin = await ctx.runMutation(internal.gameplay.beginPlanningGeneration, {
      gameId: args.gameId,
    })

    if (begin.status === 'ready' || begin.status === 'noop') {
      return {
        status: 'noop' as const,
        generatedCount: 0,
      }
    }

    const openRouterApiKey = getEnvironmentVariable('OPENROUTER_API_KEY')
    if (!openRouterApiKey) {
      throw new ConvexError('OPENROUTER_API_KEY is required for briefing generation')
    }

    const openRouterModel =
      getEnvironmentVariable('OPENROUTER_MODEL') || DEFAULT_OPENROUTER_MODEL
    const liquid = new Liquid()
    const openRouter = new OpenRouter({ apiKey: openRouterApiKey })
    const briefs: Record<Id<'factions'>, { goal: string; briefing: string }> = {}

    for (const faction of begin.factions) {
      const sentimentsText = formatSentiments(begin.sentiments)
      const prompt = await liquid.parseAndRender(GENERATE_FACTION_BRIEF, {
        scenario_title: begin.scenarioTitle,
        event: begin.event,
        round_number: begin.roundNumber,
        max_rounds: begin.maxRounds,
        sentiments: sentimentsText,
        faction_name: faction.name,
        faction_description: faction.description,
        faction_archetype: faction.archetype,
        faction_scoring: summarizeScoring(faction.scoring),
        team_size: faction.teamSize,
      })

      const aiBrief = await retry(async () => {
        const response = await openRouter.chat.send({
          chatGenerationParams: {
            model: openRouterModel,
            stream: false,
            temperature: 0.6,
            messages: [
              {
                role: 'system',
                content:
                  'You generate faction strategy copy for a game. Always return strict JSON matching the schema.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            responseFormat: {
              type: 'json_schema',
              jsonSchema: {
                name: 'faction_brief',
                strict: true,
                schema: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['goal', 'briefing'],
                  properties: {
                    goal: { type: 'string' },
                    briefing: { type: 'string' },
                  },
                },
              },
            },
          },
        })

        const parsed = parseFactionBrief(extractAssistantText(response))

        if (!parsed) {
          throw new Error('Model did not return a valid faction brief payload')
        }

        return parsed
      }, {
        maxAttempts: 3,
        delay: 500,
        factor: 2,
        maxDelay: 2_500,
      })

      briefs[faction.id] = normalizeBrief(aiBrief)
    }

    const result = await ctx.runMutation(
      internal.gameplay.completePlanningGenerationAndEnterSubmitting,
      {
        gameId: args.gameId,
        briefs,
      },
    )

    if (result.status === 'noop') {
      return {
        status: 'noop' as const,
        generatedCount: 0,
      }
    }

    return {
      status: 'generated' as const,
      generatedCount: Object.keys(briefs).length,
    }
  },
})

export const beginPlanningGeneration = internalMutation({
  args: {
    gameId: v.string(),
  },
  returns: v.object({
    status: planningGenerationStatus,
    phase: v.optional(gamePhase),
    roundNumber: v.optional(v.number()),
    maxRounds: v.optional(v.number()),
    scenarioTitle: v.optional(v.string()),
    event: v.optional(v.string()),
    sentiments: v.optional(sentiments),
    factions: v.optional(
      v.array(
        v.object({
          id: v.id('factions'),
          name: v.string(),
          description: v.string(),
          archetype: v.string(),
          scoring: scoring,
          teamSize: v.number(),
        }),
      ),
    ),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    const phase = game.phase

    if (phase !== GamePhase.RoundLoading) {
      return {
        status: 'noop' as const,
        phase,
      }
    }

    const round = await getCurrentRound(ctx, game)

    if (!round) {
      throw new ConvexError('Current round not found for round loading')
    }

    const participatingFactionIds = getParticipatingFactionIds(round)

    if (participatingFactionIds.length === 0) {
      throw new ConvexError('No participating factions are available for briefing generation')
    }

    const allBriefsReady = participatingFactionIds.every((factionId) =>
      hasBriefingForFaction(round, factionId),
    )

    if (allBriefsReady) {
      const now = Date.now()
      const submittingDeadlineMs = round.submitting_deadline_ms ?? now + SUBMITTING_DURATION_MS

      await ctx.db.patch(round._id, {
        planning_generated_at_ms: round.planning_generated_at_ms ?? now,
        submitting_started_at_ms: round.submitting_started_at_ms ?? now,
        submitting_deadline_ms: submittingDeadlineMs,
      })

      await ctx.db.patch(game._id, {
        phase: GamePhase.RoundVoting,
      })

      return {
        status: 'ready' as const,
        phase: GamePhase.RoundVoting,
        roundNumber: round.number,
      }
    }

    const [factions, players] = await Promise.all([
      ctx.db
        .query('factions')
        .withIndex('by_game', (q) => q.eq('game_id', game._id))
        .collect(),
      ctx.db
        .query('players')
        .withIndex('by_game', (q) => q.eq('game_id', game._id))
        .collect(),
    ])

    const playerCounts = countPlayersByFaction(players)
    const factionsById = new Map(factions.map((faction) => [faction._id, faction]))
    const missingFactionIds = participatingFactionIds.filter(
      (factionId) => !hasBriefingForFaction(round, factionId),
    )

    const participatingFactions = missingFactionIds
      .map((factionId) => factionsById.get(factionId))
      .filter((faction): faction is Doc<'factions'> => Boolean(faction))
      .map((faction) => ({
        id: faction._id,
        name: faction.name,
        description: faction.description,
        archetype: faction.archetype,
        scoring: faction.scoring,
        teamSize: playerCounts.get(faction._id) ?? 0,
      }))

    if (participatingFactions.length === 0) {
      throw new ConvexError('No faction records found for participating teams')
    }

    return {
      status: 'started' as const,
      phase,
      roundNumber: round.number,
      maxRounds: game.max_rounds,
      scenarioTitle: game.scenario_title ?? 'Breaking Story',
      event: round.event_development,
      sentiments: game.sentiments,
      factions: participatingFactions,
    }
  },
})

export const completePlanningGenerationAndEnterSubmitting = internalMutation({
  args: {
    gameId: v.string(),
    briefs: v.record(v.id('factions'), brief),
  },
  returns: v.object({
    status: v.union(v.literal('completed'), v.literal('ready'), v.literal('noop')),
    phase: gamePhase,
    submittingDeadlineMs: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    const phase = game.phase

    if (phase !== GamePhase.RoundLoading) {
      return {
        status: 'noop' as const,
        phase,
      }
    }

    const round = await getCurrentRound(ctx, game)

    if (!round) {
      throw new ConvexError('Current round not found')
    }

    const factionIds = getParticipatingFactionIds(round)

    if (factionIds.length === 0) {
      throw new ConvexError('Cannot enter submitting with no participating factions')
    }

    const finalizedBriefs: Partial<Record<Id<'factions'>, { goal: string; briefing: string }>> = {
      ...round.faction_briefs,
    }

    for (const factionId of factionIds) {
      if (hasBriefingValue(finalizedBriefs[factionId])) {
        continue
      }

      const generatedBrief = args.briefs[factionId]

      if (!generatedBrief) {
        throw new ConvexError('Missing briefing payload for a participating faction')
      }

      finalizedBriefs[factionId] = normalizeBrief(generatedBrief)
    }

    const allBriefsReady = factionIds.every((factionId) =>
      hasBriefingValue(finalizedBriefs[factionId]),
    )

    if (!allBriefsReady) {
      return {
        status: 'noop' as const,
        phase,
        submittingDeadlineMs: round.submitting_deadline_ms,
      }
    }

    const now = Date.now()
    const submittingDeadlineMs = round.submitting_deadline_ms ?? now + SUBMITTING_DURATION_MS

    await ctx.db.patch(round._id, {
      faction_briefs:
        finalizedBriefs as Record<Id<'factions'>, { goal: string; briefing: string }>,
      planning_generated_at_ms: round.planning_generated_at_ms ?? now,
      submitting_started_at_ms: round.submitting_started_at_ms ?? now,
      submitting_deadline_ms: submittingDeadlineMs,
    })

    await ctx.db.patch(game._id, {
      phase: GamePhase.RoundVoting,
    })

    return {
      status: 'completed' as const,
      phase: GamePhase.RoundVoting,
      submittingDeadlineMs,
    }
  },
})

function normalizeSubmissionContent(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ')

  if (!trimmed) {
    throw new ConvexError('Submission content is required')
  }

  return trimmed.slice(0, MAX_SUBMISSION_CONTENT_LENGTH)
}

function findActionType(
  game: Doc<'games'>,
  faction: Doc<'factions'>,
  actionTypeId: string,
): {
  id: string
  name: string
  cost: number
  prompt: string
  is_special: boolean
} | null {
  const normalizedId = actionTypeId.trim()

  if (!normalizedId || normalizedId === 'abstain') {
    return null
  }

  const sharedMatch = game.shared_actions.find((action) => action.id === normalizedId)

  if (sharedMatch) {
    return sharedMatch
  }

  const factionMatch = faction.faction_actions.find((action) => action.id === normalizedId)

  return factionMatch ?? null
}

function getParticipatingFactionIds(round: Doc<'rounds'> | null): Array<Id<'factions'>> {
  if (!round) {
    return []
  }

  return Object.keys(round.faction_submitted) as Array<Id<'factions'>>
}

function hasBriefingForFaction(
  round: Doc<'rounds'>,
  factionId: Id<'factions'>,
): boolean {
  return hasBriefingValue(round.faction_briefs[factionId])
}

function hasBriefingValue(
  brief: { goal: string; briefing: string } | undefined,
): boolean {
  if (!brief) {
    return false
  }

  return brief.goal.trim().length > 0 && brief.briefing.trim().length > 0
}

function countPlayersByFaction(
  players: Array<Doc<'players'>>,
): Map<Id<'factions'>, number> {
  const counts = new Map<Id<'factions'>, number>()

  for (const player of players) {
    counts.set(player.faction_id, (counts.get(player.faction_id) ?? 0) + 1)
  }

  return counts
}

function areAllParticipatingFactionsSubmitted(
  status: Record<Id<'factions'>, boolean>,
): boolean {
  const entries = Object.values(status)
  return entries.length > 0 && entries.every(Boolean)
}

function normalizeBrief(
  brief: { goal: string; briefing: string },
): { goal: string; briefing: string } {
  const goal = brief.goal.trim()
  const briefing = brief.briefing.trim()

  if (!goal || !briefing) {
    throw new ConvexError('Briefings must include a goal and briefing')
  }

  return {
    goal: goal.slice(0, 240),
    briefing: briefing.slice(0, 2_500),
  }
}

function parseFactionBrief(
  value: string,
): { goal: string; briefing: string } | null {
  try {
    const parsed = JSON.parse(value) as unknown

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const objectValue = parsed as { goal?: unknown; briefing?: unknown }

    if (
      typeof objectValue.goal !== 'string' ||
      typeof objectValue.briefing !== 'string'
    ) {
      return null
    }

    return {
      goal: objectValue.goal,
      briefing: objectValue.briefing,
    }
  } catch {
    return null
  }
}

function extractAssistantText(response: unknown): string {
  if (!response || typeof response !== 'object') {
    return ''
  }

  const choices = (response as { choices?: unknown }).choices

  if (!Array.isArray(choices) || choices.length === 0) {
    return ''
  }

  const first = choices[0] as {
    message?: {
      content?: unknown
    }
  }

  const content = first.message?.content

  if (typeof content === 'string') {
    return content
  }

  if (!Array.isArray(content)) {
    return ''
  }

  const textParts = content
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return ''
      }

      const textItem = item as { type?: unknown; text?: unknown }

      if (textItem.type === 'text' && typeof textItem.text === 'string') {
        return textItem.text
      }

      return ''
    })
    .filter(Boolean)

  return textParts.join('\n').trim()
}

function summarizeScoring(scoring: {
  stability: Array<number>
  attention: Array<number>
  curiosity: Array<number>
  corporate_blame: Array<number>
  government_blame: Array<number>
}): string {
  return (
    `stability ${summarizeSentimentPreference(scoring.stability)}; ` +
    `attention ${summarizeSentimentPreference(scoring.attention)}; ` +
    `curiosity ${summarizeSentimentPreference(scoring.curiosity)}; ` +
    `corporate blame ${summarizeSentimentPreference(scoring.corporate_blame)}; ` +
    `government blame ${summarizeSentimentPreference(scoring.government_blame)}`
  )
}

function summarizeSentimentPreference(values: Array<number>): string {
  const labels = ['low', 'medium', 'high', 'max']
  let bestIndex = 0

  for (let index = 1; index < values.length; index += 1) {
    if ((values[index] ?? -Infinity) > (values[bestIndex] ?? -Infinity)) {
      bestIndex = index
    }
  }

  const label = labels[bestIndex] ?? 'medium'
  const score = values[bestIndex] ?? 0

  return `prefers ${label} (${score})`
}

function formatSentiments(sentiments: {
  stability: number
  attention: number
  curiosity: number
  corporate_blame: number
  government_blame: number
}): string {
  return [
    `- Stability: ${Math.round(sentiments.stability)}`,
    `- Attention: ${Math.round(sentiments.attention)}`,
    `- Curiosity: ${Math.round(sentiments.curiosity)}`,
    `- Corporate Blame: ${Math.round(sentiments.corporate_blame)}`,
    `- Government Blame: ${Math.round(sentiments.government_blame)}`,
  ].join('\n')
}

function getEnvironmentVariable(name: string): string | undefined {
  const globalProcess = globalThis as {
    process?: {
      env?: Record<string, string | undefined>
    }
  }

  const value = globalProcess.process?.env?.[name]
  const trimmed = value?.trim()

  return trimmed || undefined
}

async function getCurrentRound(
  ctx: DbContext,
  game: Doc<'games'>,
): Promise<Doc<'rounds'> | null> {
  if (!game.current_round) {
    return null
  }

  return ctx.db
    .query('rounds')
    .withIndex('by_game_and_number', (q) =>
      q.eq('game_id', game._id).eq('number', game.current_round as number),
    )
    .unique()
}

async function findGameByPublicId(
  ctx: DbContext,
  gameId: string,
): Promise<Doc<'games'> | null> {
  return ctx.db
    .query('games')
    .withIndex('by_public_id', (q) => q.eq('public_id', gameId))
    .unique()
}

type DbContext = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>
