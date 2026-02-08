import { ConvexError, v } from 'convex/values'
import { retry } from '@lifeomic/attempt'
import { OpenRouter } from '@openrouter/sdk'
import { Liquid } from 'liquidjs'
import { internal } from './_generated/api'
import { GamePhase, gamePhase } from './game_phase'
import { FACTIONS, SCENARIOS } from './game_data'
import {


  action,
  internalMutation,
  mutation,
  query
} from './_generated/server'
import {
  GENERATE_FACTION_BRIEF_SYSTEM,
  GENERATE_FACTION_BRIEF_USER,
  SCORE_SUBMITTED_ACTION_SYSTEM,
  SCORE_SUBMITTED_ACTION_USER,
} from './prompts'
import type { MutationCtx, QueryCtx } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel'

const DEFAULT_OPENROUTER_MODEL = 'google/gemini-3-flash-preview'
const SUBMITTING_DURATION_MS = 120_000
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

const factionGenerationScenario = v.object({
  id: v.string(),
  title: v.string(),
  event: v.string(),
})

const factionGenerationFaction = v.object({
  code: v.string(),
  name: v.string(),
  description: v.string(),
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

const gradingRubric = v.record(v.string(), v.number())

const submittedActionSummary = v.object({
  id: v.id('submitted_actions'),
  factionId: v.id('factions'),
  actionTypeId: v.string(),
  actionName: v.string(),
  content: v.string(),
  cost: v.number(),
  gradingRubric: v.optional(gradingRubric),
  effectiveness: v.optional(v.number()),
  impact: v.optional(v.number()),
})

const planningGenerationStatus = v.union(
  v.literal('started'),
  v.literal('ready'),
  v.literal('noop'),
)

const roundProcessingStatus = v.union(
  v.literal('started'),
  v.literal('ready'),
  v.literal('noop'),
)

const scoringCriterionInput = v.object({
  name: v.string(),
  description: v.string(),
  aiInstructions: v.string(),
})

const roundProcessingSubmission = v.object({
  submissionId: v.id('submitted_actions'),
  factionId: v.id('factions'),
  factionName: v.string(),
  factionDescription: v.string(),
  factionArchetype: v.string(),
  actionTypeId: v.string(),
  actionName: v.string(),
  actionPrompt: v.string(),
  content: v.string(),
  cost: v.number(),
  scoringCriteria: v.array(scoringCriterionInput),
  isAbstain: v.boolean(),
})

const scoredSubmission = v.object({
  gradingRubric: gradingRubric,
  effectiveness: v.number(),
  impact: v.number(),
  reasoning: v.string(),
})

type SentimentsValue = {
  stability: number
  attention: number
  curiosity: number
  corporate_blame: number
  government_blame: number
}

type RoundProcessingCriterionValue = {
  name: string
  description: string
  aiInstructions: string
}

type RoundProcessingSubmissionValue = {
  submissionId: Id<'submitted_actions'>
  factionId: Id<'factions'>
  factionName: string
  factionDescription: string
  factionArchetype: string
  actionTypeId: string
  actionName: string
  actionPrompt: string
  content: string
  cost: number
  scoringCriteria: Array<RoundProcessingCriterionValue>
  isAbstain: boolean
}

type ScoredSubmissionValue = {
  gradingRubric: Record<string, number>
  effectiveness: number
  impact: number
  reasoning: string
}

type BeginRoundProcessingResult = {
  status: 'started' | 'ready' | 'noop'
  phase: GamePhase
  roundId?: Id<'rounds'>
  scenarioTitle?: string
  roundNumber?: number
  maxRounds?: number
  event?: string
  sentiments?: SentimentsValue
  submissions?: Array<RoundProcessingSubmissionValue>
}

type CompleteRoundProcessingResult = {
  status: 'completed' | 'noop'
  phase: GamePhase
  appliedCount: number
}

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
    const factionsById = new Map(factions.map((faction) => [faction._id, faction]))

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
          .map((action) => {
            const faction = factionsById.get(action.faction_id)
            const actionType =
              faction && action.action_type_id !== 'abstain'
                ? findActionType(game, faction, action.action_type_id)
                : null

            return {
              id: action._id,
              factionId: action.faction_id,
              actionTypeId: action.action_type_id,
              actionName:
                action.action_type_id === 'abstain'
                  ? 'No Submission'
                  : actionType?.name ?? formatActionTypeLabel(action.action_type_id),
              content: action.content,
              cost: action.cost,
              gradingRubric: action.grading_rubric,
              effectiveness: action.effectiveness,
              impact: action.impact,
            }
          })

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
          actionName: v.string(),
          cost: v.number(),
          content: v.string(),
          gradingRubric: v.optional(gradingRubric),
          effectiveness: v.optional(v.number()),
          impact: v.optional(v.number()),
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
      ctx.db.get("factions", player.faction_id),
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
    const submittedActionType =
      submittedAction && submittedAction.action_type_id !== 'abstain'
        ? findActionType(game, faction, submittedAction.action_type_id)
        : null

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
          actionName:
            submittedAction.action_type_id === 'abstain'
              ? 'No Submission'
              : submittedActionType?.name ?? formatActionTypeLabel(submittedAction.action_type_id),
          cost: submittedAction.cost,
          content: submittedAction.content,
          gradingRubric: submittedAction.grading_rubric,
          effectiveness: submittedAction.effectiveness,
          impact: submittedAction.impact,
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

    const faction = await ctx.db.get("factions", factionId)

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

    await ctx.db.patch("factions", faction._id, {
      credits: faction.credits - actionType.cost,
    })

    const nextFactionSubmitted = {
      ...round.faction_submitted,
      [faction._id]: true,
    }

    await ctx.db.patch("rounds", round._id, {
      faction_submitted: nextFactionSubmitted,
    })

    if (areAllParticipatingFactionsSubmitted(nextFactionSubmitted)) {
      await ctx.db.patch("games", game._id, {
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
      await ctx.db.patch("rounds", round._id, {
        faction_submitted: nextFactionSubmitted,
      })
    }

    await ctx.db.patch("games", game._id, {
      phase: GamePhase.RoundProcessing,
    })

    return {
      phase: GamePhase.RoundProcessing,
      insertedAbstains,
    }
  },
})

export const processRoundSubmissions = action({
  args: {
    gameId: v.string(),
  },
  returns: v.object({
    status: v.union(v.literal('processed'), v.literal('noop')),
    phase: gamePhase,
    processedCount: v.number(),
    appliedCount: v.number(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    status: 'processed' | 'noop'
    phase: GamePhase
    processedCount: number
    appliedCount: number
  }> => {
    const begin = (await ctx.runMutation(internal.gameplay.beginRoundProcessing as any, {
      gameId: args.gameId,
    })) as BeginRoundProcessingResult

    if (begin.status === 'noop') {
      return {
        status: 'noop' as const,
        phase: begin.phase,
        processedCount: 0,
        appliedCount: 0,
      }
    }

    if (!begin.roundId) {
      throw new ConvexError('Current round not found for processing')
    }

    if (begin.status === 'ready') {
      const complete = (await ctx.runMutation(
        internal.gameplay.completeRoundProcessingAndEnterResults as any,
        {
          gameId: args.gameId,
          roundId: begin.roundId,
          scores: {},
        },
      )) as CompleteRoundProcessingResult

      return {
        status: complete.status === 'completed' ? ('processed' as const) : ('noop' as const),
        phase: complete.phase,
        processedCount: 0,
        appliedCount: complete.appliedCount,
      }
    }

    const submissions = begin.submissions ?? []
    const needsModel = submissions.some(
      (submission) => !submission.isAbstain && submission.scoringCriteria.length > 0,
    )
    const openRouterApiKey = getEnvironmentVariable('OPENROUTER_API_KEY')

    if (needsModel && !openRouterApiKey) {
      throw new ConvexError('OPENROUTER_API_KEY is required for submission scoring')
    }

    const openRouterModel =
      getEnvironmentVariable('OPENROUTER_MODEL') || DEFAULT_OPENROUTER_MODEL
    const liquid = new Liquid()
    const openRouter = openRouterApiKey ? new OpenRouter({ apiKey: openRouterApiKey }) : null
    const sentimentsText = formatSentiments(begin.sentiments ?? getDefaultSentiments())

    const scoredEntries = await Promise.all(
      submissions.map(async (submission: RoundProcessingSubmissionValue) => {
        const score = await scoreSubmittedRoundAction({
          submission,
          scenarioTitle: begin.scenarioTitle ?? 'Breaking Story',
          roundNumber: begin.roundNumber ?? 1,
          maxRounds: begin.maxRounds ?? 1,
          event: begin.event ?? '',
          sentimentsText,
          liquid,
          openRouter,
          openRouterModel,
        })

        return [submission.submissionId, score] as const
      }),
    )

    const scores = Object.fromEntries(scoredEntries) as Record<Id<'submitted_actions'>, ScoredSubmissionValue>

    const complete = (await ctx.runMutation(
      internal.gameplay.completeRoundProcessingAndEnterResults as any,
      {
        gameId: args.gameId,
        roundId: begin.roundId,
        scores,
      },
    )) as CompleteRoundProcessingResult

    return {
      status: complete.status === 'completed' ? ('processed' as const) : ('noop' as const),
      phase: complete.phase,
      processedCount: submissions.length,
      appliedCount: complete.appliedCount,
    }
  },
})

export const getFactionGenerationDebugSettings = query({
  args: {},
  returns: v.object({
    scenarios: v.array(factionGenerationScenario),
    factions: v.array(factionGenerationFaction),
  }),
  handler: () => {
    return {
      scenarios: SCENARIOS.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        event: scenario.event,
      })),
      factions: FACTIONS.map((faction) => ({
        code: faction.code,
        name: faction.name,
        description: faction.description,
      })),
    }
  },
})

export const generateFactionBriefDebug = action({
  args: {
    scenarioId: v.string(),
    factionCode: v.string(),
  },
  returns: v.object({
    scenarioId: v.string(),
    scenarioTitle: v.string(),
    event: v.string(),
    factionCode: v.string(),
    factionName: v.string(),
    model: v.string(),
    goal: v.string(),
    briefing: v.string(),
  }),
  handler: async (_ctx, args) => {
    const scenario = SCENARIOS.find((candidate) => candidate.id === args.scenarioId)

    if (!scenario) {
      throw new ConvexError('Scenario not found')
    }

    const faction = FACTIONS.find((candidate) => candidate.code === args.factionCode)

    if (!faction) {
      throw new ConvexError('Faction not found')
    }

    const openRouterApiKey = getEnvironmentVariable('OPENROUTER_API_KEY')

    if (!openRouterApiKey) {
      throw new ConvexError('OPENROUTER_API_KEY is required for briefing generation')
    }

    const openRouterModel =
      getEnvironmentVariable('OPENROUTER_MODEL') || DEFAULT_OPENROUTER_MODEL
    const openRouter = new OpenRouter({ apiKey: openRouterApiKey })
    const liquid = new Liquid()
    const defaultSentiments = getDefaultSentiments()
    const templateVars = {
      scenario_title: scenario.title,
      event: scenario.event,
      round_number: 1,
      max_rounds: 4,
      sentiments: formatSentiments(defaultSentiments),
      faction_name: faction.name,
      faction_description: faction.description,
      faction_voice: faction.archetype,
      faction_scoring: formatScoring(faction.scoring, defaultSentiments),
      team_size: 1,
    }
    const systemPrompt = await liquid.parseAndRender(GENERATE_FACTION_BRIEF_SYSTEM, templateVars)
    const userPrompt = await liquid.parseAndRender(GENERATE_FACTION_BRIEF_USER, templateVars)

    const generated = await retry(async () => {
      const response = await openRouter.chat.send({
        chatGenerationParams: {
          model: openRouterModel,
          stream: false,
          temperature: 0.6,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
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

      return normalizeBrief(parsed)
    }, {
      maxAttempts: 3,
      delay: 500,
      factor: 2,
      maxDelay: 2_500,
    })

    return {
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      event: scenario.event,
      factionCode: faction.code,
      factionName: faction.name,
      model: openRouterModel,
      goal: generated.goal,
      briefing: generated.briefing,
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
      const templateVars = {
        scenario_title: begin.scenarioTitle,
        event: begin.event,
        round_number: begin.roundNumber,
        max_rounds: begin.maxRounds,
        sentiments: sentimentsText,
        faction_name: faction.name,
        faction_description: faction.description,
        faction_voice: faction.archetype,
        faction_scoring: formatScoring(faction.scoring, begin.sentiments),
        team_size: faction.teamSize,
      }
      const systemPrompt = await liquid.parseAndRender(GENERATE_FACTION_BRIEF_SYSTEM, templateVars)
      const userPrompt = await liquid.parseAndRender(GENERATE_FACTION_BRIEF_USER, templateVars)

      const aiBrief = await retry(async () => {
        const response = await openRouter.chat.send({
          chatGenerationParams: {
            model: openRouterModel,
            stream: false,
            temperature: 1,
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: userPrompt,
              },
            ],
            reasoning: {
              enabled: true,
              effort: "xhigh",
            } as any,
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
                    concrete_strategy: {
                      type: 'string',
                       description: '2-3 paragraphs of internal monologue where you pause the faction roleplay and actually think about the current sentiments and how to in-universe push them towards where the player likely wants them to be.'
                    },
                    briefing: {
                      type: 'string'
                      , description: 'The briefing is an in-world message from faction leadership to the team.'
                    },
                    goal: { type: 'string', description: 'The goal is a mission assignment. It lands on a player\'s phone screen and needs to immediately orient them. After reading it, the player should think "I know exactly what I\'d write for a social media post or an interview or a leak about this." Unlike the briefing, this is a bit more grounded' },
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

export const beginRoundProcessing = internalMutation({
  args: {
    gameId: v.string(),
  },
  returns: v.object({
    status: roundProcessingStatus,
    phase: gamePhase,
    roundId: v.optional(v.id('rounds')),
    scenarioTitle: v.optional(v.string()),
    roundNumber: v.optional(v.number()),
    maxRounds: v.optional(v.number()),
    event: v.optional(v.string()),
    sentiments: v.optional(sentiments),
    submissions: v.optional(v.array(roundProcessingSubmission)),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    const phase = game.phase

    if (phase !== GamePhase.RoundProcessing) {
      return {
        status: 'noop' as const,
        phase,
      }
    }

    const round = await getCurrentRound(ctx, game)

    if (!round) {
      throw new ConvexError('Current round not found for round processing')
    }

    const [factions, submissions] = await Promise.all([
      ctx.db
        .query('factions')
        .withIndex('by_game', (q) => q.eq('game_id', game._id))
        .collect(),
      ctx.db
        .query('submitted_actions')
        .withIndex('by_round', (q) => q.eq('round_id', round._id))
        .collect(),
    ])
    const factionsById = new Map(factions.map((faction) => [faction._id, faction]))
    const sortedSubmissions = submissions.sort((a, b) => a._creationTime - b._creationTime)
    const allScored = sortedSubmissions.every(
      (submission) =>
        submission.grading_rubric !== undefined &&
        typeof submission.effectiveness === 'number' &&
        typeof submission.impact === 'number' &&
        typeof submission.reasoning === 'string' &&
        submission.reasoning.trim().length > 0,
    )

    if (allScored) {
      return {
        status: 'ready' as const,
        phase,
        roundId: round._id,
        roundNumber: round.number,
        maxRounds: game.max_rounds,
        scenarioTitle: game.scenario_title ?? 'Breaking Story',
        event: round.event_development,
        sentiments: game.sentiments,
        submissions: [],
      }
    }

    const submissionPayloads = sortedSubmissions.map((submission) => {
      const faction = factionsById.get(submission.faction_id)

      if (!faction) {
        throw new ConvexError('Faction not found for submitted action')
      }

      const actionType =
        submission.action_type_id === 'abstain'
          ? null
          : findActionType(game, faction, submission.action_type_id)
      const scoringCriteria =
        actionType?.scoring_criteria.map((criterion) => ({
          name: criterion.name,
          description: criterion.description,
          aiInstructions: criterion.ai_scoring_instructions,
        })) ?? []

      return {
        submissionId: submission._id,
        factionId: faction._id,
        factionName: faction.name,
        factionDescription: faction.description,
        factionArchetype: faction.archetype,
        actionTypeId: submission.action_type_id,
        actionName:
          submission.action_type_id === 'abstain'
            ? 'No Submission'
            : actionType?.name ?? formatActionTypeLabel(submission.action_type_id),
        actionPrompt:
          submission.action_type_id === 'abstain'
            ? 'No submission before the deadline.'
            : actionType?.prompt ?? 'No prompt metadata available.',
        content: submission.content,
        cost: submission.cost,
        scoringCriteria,
        isAbstain: submission.action_type_id === 'abstain',
      }
    })

    return {
      status: 'started' as const,
      phase,
      roundId: round._id,
      roundNumber: round.number,
      maxRounds: game.max_rounds,
      scenarioTitle: game.scenario_title ?? 'Breaking Story',
      event: round.event_development,
      sentiments: game.sentiments,
      submissions: submissionPayloads,
    }
  },
})

export const completeRoundProcessingAndEnterResults = internalMutation({
  args: {
    gameId: v.string(),
    roundId: v.id('rounds'),
    scores: v.record(v.id('submitted_actions'), scoredSubmission),
  },
  returns: v.object({
    status: v.union(v.literal('completed'), v.literal('noop')),
    phase: gamePhase,
    appliedCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    const phase = game.phase

    if (phase !== GamePhase.RoundProcessing) {
      return {
        status: 'noop' as const,
        phase,
        appliedCount: 0,
      }
    }

    const round = await getCurrentRound(ctx, game)

    if (!round || round._id !== args.roundId) {
      return {
        status: 'noop' as const,
        phase,
        appliedCount: 0,
      }
    }

    const submissions = await ctx.db
      .query('submitted_actions')
      .withIndex('by_round', (q) => q.eq('round_id', round._id))
      .collect()

    let appliedCount = 0

    for (const submission of submissions) {
      const score = args.scores[submission._id]

      if (!score) {
        continue
      }

      await ctx.db.patch("submitted_actions", submission._id, {
        grading_rubric: score.gradingRubric,
        effectiveness: score.effectiveness,
        impact: score.impact,
        reasoning: score.reasoning,
      })
      appliedCount += 1
    }

    await ctx.db.patch("games", game._id, {
      phase: GamePhase.RoundResults,
    })

    return {
      status: 'completed' as const,
      phase: GamePhase.RoundResults,
      appliedCount,
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

      await ctx.db.patch("rounds", round._id, {
        planning_generated_at_ms: round.planning_generated_at_ms ?? now,
        submitting_started_at_ms: round.submitting_started_at_ms ?? now,
        submitting_deadline_ms: submittingDeadlineMs,
      })

      await ctx.db.patch("games", game._id, {
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

    await ctx.db.patch("rounds", round._id, {
      faction_briefs:
        finalizedBriefs as Record<Id<'factions'>, { goal: string; briefing: string }>,
      planning_generated_at_ms: round.planning_generated_at_ms ?? now,
      submitting_started_at_ms: round.submitting_started_at_ms ?? now,
      submitting_deadline_ms: submittingDeadlineMs,
    })

    await ctx.db.patch("games", game._id, {
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
  scoring_criteria: Array<{
    name: string
    description: string
    ai_scoring_instructions: string
  }>
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

async function scoreSubmittedRoundAction({
  submission,
  scenarioTitle,
  roundNumber,
  maxRounds,
  event,
  sentimentsText,
  liquid,
  openRouter,
  openRouterModel,
}: {
  submission: RoundProcessingSubmissionValue
  scenarioTitle: string
  roundNumber: number
  maxRounds: number
  event: string
  sentimentsText: string
  liquid: Liquid
  openRouter: OpenRouter | null
  openRouterModel: string
}): Promise<ScoredSubmissionValue> {
  const criterionNames = Array.from(
    new Set(
      submission.scoringCriteria
        .map((criterion) => criterion.name.trim())
        .filter((criterionName) => criterionName.length > 0),
    ),
  )

  if (submission.isAbstain) {
    return createZeroSubmissionScore(
      criterionNames,
      'No submission before deadline; assigned zero score.',
    )
  }

  if (criterionNames.length === 0) {
    return createZeroSubmissionScore(
      criterionNames,
      'Action scoring criteria unavailable; assigned zero score.',
    )
  }

  if (!openRouter) {
    return createZeroSubmissionScore(
      criterionNames,
      'Scoring service unavailable; assigned zero score.',
    )
  }

  const templateVars = {
    scenario_title: scenarioTitle,
    round_number: roundNumber,
    max_rounds: maxRounds,
    event,
    sentiments: sentimentsText,
    faction_name: submission.factionName,
    faction_description: submission.factionDescription,
    faction_archetype: submission.factionArchetype,
    action_name: submission.actionName,
    action_prompt: submission.actionPrompt,
    submission_content: submission.content,
    scoring_criteria: formatScoringCriteriaForPrompt(submission.scoringCriteria),
  }
  const systemPrompt = await liquid.parseAndRender(SCORE_SUBMITTED_ACTION_SYSTEM, templateVars)
  const userPrompt = await liquid.parseAndRender(SCORE_SUBMITTED_ACTION_USER, templateVars)

  try {
    return await retry(async () => {
      const response = await openRouter.chat.send({
        chatGenerationParams: {
          model: openRouterModel,
          stream: false,
          temperature: 0.2,
          reasoning: {
            effort: 'medium',
            summary: 'detailed',
          },
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
          responseFormat: {
            type: 'json_schema',
            jsonSchema: {
              name: 'submission_score',
              strict: true,
              schema: buildSubmissionScoreSchema(criterionNames),
            },
          },
        },
      })

      const parsed = parseSubmissionScore(extractAssistantText(response), criterionNames, submission.cost)

      if (!parsed) {
        throw new Error('Model did not return a valid submission score payload')
      }

      return parsed
    }, {
      maxAttempts: 3,
      delay: 500,
      factor: 2,
      maxDelay: 2_500,
    })
  } catch {
    return createZeroSubmissionScore(
      criterionNames,
      'Scoring failed after retries; assigned zero score.',
    )
  }
}

function parseSubmissionScore(
  value: string,
  criterionNames: Array<string>,
  cost: number,
): ScoredSubmissionValue | null {
  try {
    const parsed = JSON.parse(extractJsonPayload(value)) as unknown

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const objectValue = parsed as { grading_rubric?: unknown; reasoning?: unknown }

    if (typeof objectValue.reasoning !== 'string') {
      return null
    }

    const rubric = normalizeGradingRubric(objectValue.grading_rubric, criterionNames)
    const effectiveness = calculateEffectiveness(rubric)
    const impact = roundToSingleDecimal(cost * effectiveness)

    return {
      gradingRubric: rubric,
      effectiveness,
      impact,
      reasoning: normalizeReasoning(objectValue.reasoning),
    }
  } catch {
    return null
  }
}

function normalizeGradingRubric(
  value: unknown,
  criterionNames: Array<string>,
): Record<string, number> {
  const rubricValue =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const normalized: Record<string, number> = {}

  for (const criterionName of criterionNames) {
    const rawScore = rubricValue[criterionName]
    const numericScore =
      typeof rawScore === 'number' && Number.isFinite(rawScore) ? rawScore : 0

    normalized[criterionName] = clampCriterionScore(numericScore)
  }

  return normalized
}

function calculateEffectiveness(gradingRubric: Record<string, number>): number {
  const scores = Object.values(gradingRubric)

  if (scores.length === 0) {
    return 0
  }

  const total = scores.reduce((sum, score) => sum + score, 0)
  return roundToSingleDecimal(total / scores.length)
}

function createZeroSubmissionScore(
  criterionNames: Array<string>,
  reason: string,
): ScoredSubmissionValue {
  const gradingRubric = Object.fromEntries(
    criterionNames.map((criterionName) => [criterionName, 0]),
  ) as Record<string, number>

  return {
    gradingRubric,
    effectiveness: 0,
    impact: 0,
    reasoning: normalizeReasoning(reason),
  }
}

function buildSubmissionScoreSchema(
  criterionNames: Array<string>,
): Record<string, unknown> {
  const rubricProperties = Object.fromEntries(
    criterionNames.map((criterionName) => [
      criterionName,
      {
        type: 'number',
      },
    ]),
  )

  return {
    type: 'object',
    additionalProperties: false,
    required: ['grading_rubric', 'reasoning'],
    properties: {
      grading_rubric: {
        type: 'object',
        additionalProperties: false,
        required: criterionNames,
        properties: rubricProperties,
      },
      reasoning: {
        type: 'string',
      },
    },
  }
}

function formatScoringCriteriaForPrompt(
  criteria: Array<{ name: string; description: string; aiInstructions: string }>,
): string {
  if (criteria.length === 0) {
    return '- No criteria provided.'
  }

  return criteria
    .map(
      (criterion, index) =>
        `${index + 1}. ${criterion.name}\n` +
        `   - Description: ${criterion.description}\n` +
        `   - Scoring instruction: ${criterion.aiInstructions}`,
    )
    .join('\n')
}

function clampCriterionScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  if (value < 0) {
    return 0
  }

  if (value > 10) {
    return 10
  }

  return roundToSingleDecimal(value)
}

function normalizeReasoning(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ')

  if (!trimmed) {
    return 'No reasoning provided by the model.'
  }

  return trimmed.slice(0, 2_000)
}

function extractJsonPayload(value: string): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return trimmed
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }

  const firstBraceIndex = trimmed.indexOf('{')
  const lastBraceIndex = trimmed.lastIndexOf('}')

  if (firstBraceIndex >= 0 && lastBraceIndex > firstBraceIndex) {
    return trimmed.slice(firstBraceIndex, lastBraceIndex + 1)
  }

  return trimmed
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function formatActionTypeLabel(actionTypeId: string): string {
  return actionTypeId
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function getDefaultSentiments(): {
  stability: number
  attention: number
  curiosity: number
  corporate_blame: number
  government_blame: number
} {
  return {
    stability: 50,
    attention: 50,
    curiosity: 50,
    corporate_blame: 50,
    government_blame: 50,
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




function formatScoring(
  scoring: Record<string, number[]>,
  sentiments: Record<string, number>
): string {
  function sentimentToLevel(value: number): string {
    if (value >= 85) return 'very high'
    if (value >= 65) return 'high'
    if (value >= 45) return 'medium'
    if (value >= 30) return 'low'
    return 'very low'
  }
  function describeScore(score: number): string {
    if (score >= 4) return 'benefits a lot'
    if (score >= 0) return 'benefits'
    if (score >= -3) return 'loses'
    return 'loses a lot'
  }
  const lines: string[] = []

  for (const [axis, values] of Object.entries(scoring)) {
    const lowLabel = describeScore(values[0]!)
    const highLabel = describeScore(values[3]!)
    const current = sentimentToLevel(sentiments[axis]!)
    const name = axis.replace('_', ' ')

    lines.push(
      `This faction **${lowLabel}** if ${name} is **low** and **${highLabel}** if ${name} is **high**. **${name.charAt(0).toUpperCase() + name.slice(1)} is currently ${current}.**`
    )
  }

  return lines.join('\n')
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
