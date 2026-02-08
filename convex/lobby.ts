import { ConvexError, v } from 'convex/values'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { SHARED_ACTIONS, FACTIONS, SCENARIOS } from './game_data'

const DEFAULT_EVENT =
  'Breaking: A leaked safety memo reveals a fast-moving chemical spill near downtown schools.'

const INITIAL_SENTIMENTS = {
  stability: 50,
  attention: 50,
  curiosity: 50,
  corporate_blame: 50,
  government_blame: 50,
}

const JOIN_CODE_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const JOIN_CODE_LENGTH = 5
const MAX_PLAYER_NAME_LENGTH = 24

const playerSummaryValidator = v.object({
  id: v.string(),
  name: v.string(),
  avatar: v.string(),
})

const factionSummaryValidator = v.object({
  id: v.id('factions'),
  code: v.string(),
  name: v.string(),
  description: v.string(),
  playerCount: v.number(),
})

const gamePhaseValidator = v.union(
  v.literal('lobby'),
  v.literal('establishing'),
  v.literal('planning'),
  v.literal('submitting'),
  v.literal('resolving'),
  v.literal('results'),
  v.literal('game_over'),
)

export const createGame = mutation({
  args: {},
  returns: v.object({
    gameId: v.string(),
    joinCode: v.string(),
  }),
  handler: async (ctx) => {
    const joinCode = await generateUniqueJoinCode(ctx)
    const publicGameId = createPublicId()
    const scenario = chooseScenario()

    const gameId = await ctx.db.insert('games', {
      public_id: publicGameId,
      join_code: joinCode,
      scenario_id: scenario.id,
      scenario_title: scenario.title,
      intro_video: scenario.intro_video,
      event: scenario.event,
      max_rounds: 4,
      phase: 'lobby',
      sentiments: INITIAL_SENTIMENTS,
      round_summaries: [],
      shared_actions: SHARED_ACTIONS,
    })

    for (const faction of FACTIONS) {
      await ctx.db.insert('factions', {
        game_id: gameId,
        code: faction.code,
        name: faction.name,
        description: faction.description,
        archetype: faction.archetype,
        credits: 8,
        scoring: faction.scoring,
        faction_actions: faction.faction_actions,
      })
    }

    return {
      gameId: publicGameId,
      joinCode,
    }
  },
})

export const joinGame = mutation({
  args: {
    joinCode: v.string(),
    playerName: v.string(),
    factionId: v.id('factions'),
    avatar: v.string(),
    sessionId: v.string(),
  },
  returns: v.object({
    gameId: v.string(),
    playerId: v.string(),
  }),
  handler: async (ctx, args) => {
    const joinCode = normalizeJoinCode(args.joinCode)
    const playerName = normalizePlayerName(args.playerName)
    const avatar = normalizeAvatar(args.avatar)
    const sessionId = args.sessionId.trim()

    if (!sessionId) {
      throw new ConvexError('Missing session id')
    }

    const game = await findGameByJoinCode(ctx, joinCode)

    if (!game) {
      throw new ConvexError('Game code not found')
    }

    if (game.phase !== 'lobby') {
      throw new ConvexError('This game has already started')
    }

    const faction = await ctx.db.get(args.factionId)

    if (!faction || faction.game_id !== game._id) {
      throw new ConvexError('Invalid faction selection')
    }

    const existingPlayer = await ctx.db
      .query('players')
      .withIndex('by_game_and_session', (q) =>
        q.eq('game_id', game._id).eq('session_id', sessionId),
      )
      .unique()

    if (existingPlayer) {
      await ctx.db.patch(existingPlayer._id, {
        faction_id: faction._id,
        name: playerName,
        avatar,
      })

      return {
        gameId: game.public_id,
        playerId: existingPlayer.public_id,
      }
    }

    const publicPlayerId = createPublicId()

    await ctx.db.insert('players', {
      game_id: game._id,
      faction_id: faction._id,
      public_id: publicPlayerId,
      name: playerName,
      avatar,
      session_id: sessionId,
    })

    return {
      gameId: game.public_id,
      playerId: publicPlayerId,
    }
  },
})

export const getGameByJoinCode = query({
  args: {
    joinCode: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      gameId: v.string(),
      joinCode: v.string(),
      phase: gamePhaseValidator,
      factions: v.array(factionSummaryValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const joinCode = normalizeJoinCode(args.joinCode)
    const game = await findGameByJoinCode(ctx, joinCode)

    if (!game) {
      return null
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

    const playerCounts = new Map<Id<'factions'>, number>()

    for (const player of players) {
      playerCounts.set(
        player.faction_id,
        (playerCounts.get(player.faction_id) ?? 0) + 1,
      )
    }

    return {
      gameId: game.public_id,
      joinCode: game.join_code,
      phase: game.phase,
      factions: factions.map((faction) => ({
        id: faction._id,
        code: faction.code,
        name: faction.name,
        description: faction.description,
        playerCount: playerCounts.get(faction._id) ?? 0,
      })),
    }
  },
})

export const getGameLobby = query({
  args: {
    gameId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      gameId: v.string(),
      joinCode: v.string(),
      phase: gamePhaseValidator,
      scenarioTitle: v.string(),
      introVideo: v.string(),
      event: v.string(),
      totalPlayers: v.number(),
      factions: v.array(
        v.object({
          id: v.id('factions'),
          code: v.string(),
          name: v.string(),
          description: v.string(),
          playerCount: v.number(),
          players: v.array(playerSummaryValidator),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      return null
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

    const playersByFaction = new Map<Id<'factions'>, Array<Doc<'players'>>>()

    for (const player of players) {
      const factionPlayers = playersByFaction.get(player.faction_id)

      if (factionPlayers) {
        factionPlayers.push(player)
      } else {
        playersByFaction.set(player.faction_id, [player])
      }
    }

    return {
      gameId: game.public_id,
      joinCode: game.join_code,
      phase: game.phase,
      scenarioTitle: game.scenario_title ?? 'Breaking Story',
      introVideo: game.intro_video ?? 'scenarios/golden_gate.mp4',
      event: game.event,
      totalPlayers: players.length,
      factions: factions.map((faction) => {
        const factionPlayers = playersByFaction.get(faction._id) ?? []

        return {
          id: faction._id,
          code: faction.code,
          name: faction.name,
          description: faction.description,
          playerCount: factionPlayers.length,
          players: factionPlayers
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((player) => ({
              id: player.public_id,
              name: player.name,
              avatar: player.avatar,
            })),
        }
      }),
    }
  },
})

export const getPlayerState = query({
  args: {
    gameId: v.string(),
    playerId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      gameId: v.string(),
      phase: gamePhaseValidator,
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
      factionPlayers: v.array(playerSummaryValidator),
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

    const [faction, factionPlayers] = await Promise.all([
      ctx.db.get(player.faction_id),
      ctx.db
        .query('players')
        .withIndex('by_faction', (q) => q.eq('faction_id', player.faction_id))
        .collect(),
    ])

    if (!faction || faction.game_id !== game._id) {
      return null
    }

    return {
      gameId: game.public_id,
      phase: game.phase,
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
      factionPlayers: factionPlayers
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((factionPlayer) => ({
          id: factionPlayer.public_id,
          name: factionPlayer.name,
          avatar: factionPlayer.avatar,
        })),
    }
  },
})

export const startGame = mutation({
  args: {
    gameId: v.string(),
  },
  returns: v.object({
    gameId: v.string(),
    phase: v.literal('establishing'),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    if (game.phase !== 'lobby') {
      throw new ConvexError('Game has already started')
    }

    await ctx.db.patch(game._id, {
      phase: "establishing" as const,
    })

    return {
      gameId: game.public_id,
      phase: "establishing" as const,
    }
  },
})

export const startRoundOne = mutation({
  args: {
    gameId: v.string(),
  },
  returns: v.object({
    gameId: v.string(),
    phase: v.literal('planning'),
    roundNumber: v.literal(1),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    if (game.phase !== 'establishing') {
      throw new ConvexError('Game is not ready to start round one')
    }

    const existingRoundOne = await ctx.db
      .query('rounds')
      .withIndex('by_game_and_number', (q) =>
        q.eq('game_id', game._id).eq('number', 1),
      )
      .unique()

    if (existingRoundOne) {
      throw new ConvexError('Round one already exists')
    }

    const factions = await ctx.db
      .query('factions')
      .withIndex('by_game', (q) => q.eq('game_id', game._id))
      .collect()

    if (factions.length === 0) {
      throw new ConvexError('Cannot start round one without factions')
    }

    await ctx.db.insert('rounds', {
      game_id: game._id,
      number: 1,
      event_development: game.event,
      sentiment_before: game.sentiments,
      faction_briefs: buildInitialFactionBriefs(factions),
      faction_submitted: buildInitialFactionSubmitted(factions),
    })

    await ctx.db.patch(game._id, {
      phase: "planning" as const,
      current_round: 1,
    })

    return {
      gameId: game.public_id,
      phase: "planning" as const,
      roundNumber: 1 as const,
    }
  },
})

function buildInitialFactionBriefs(
  factions: Array<Doc<'factions'>>,
): Record<Id<'factions'>, { goal: string; briefing: string }> {
  const briefs: Partial<Record<Id<'factions'>, { goal: string; briefing: string }>> = {}

  for (const faction of factions) {
    briefs[faction._id] = {
      goal: `Advance ${faction.name}'s agenda in this breaking story.`,
      briefing: `${faction.description} More detailed AI briefings will be generated before actions are submitted.`,
    }
  }

  return briefs as Record<Id<'factions'>, { goal: string; briefing: string }>
}

function buildInitialFactionSubmitted(
  factions: Array<Doc<'factions'>>,
): Record<Id<'factions'>, boolean> {
  const submitted: Partial<Record<Id<'factions'>, boolean>> = {}

  for (const faction of factions) {
    submitted[faction._id] = false
  }

  return submitted as Record<Id<'factions'>, boolean>
}

async function generateUniqueJoinCode(ctx: MutationCtx): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const joinCode = randomJoinCode(JOIN_CODE_LENGTH)
    const existing = await ctx.db
      .query('games')
      .withIndex('by_join_code', (q) => q.eq('join_code', joinCode))
      .first()

    if (!existing) {
      return joinCode
    }
  }

  throw new ConvexError('Unable to generate join code')
}

async function findGameByJoinCode(
  ctx: DbContext,
  joinCode: string,
): Promise<Doc<'games'> | null> {
  return ctx.db
    .query('games')
    .withIndex('by_join_code', (q) => q.eq('join_code', joinCode))
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

function randomJoinCode(length: number): string {
  let code = ''

  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * JOIN_CODE_LETTERS.length)
    code += JOIN_CODE_LETTERS[index]
  }

  return code
}

function normalizeJoinCode(value: string): string {
  return value.trim().toUpperCase()
}

function normalizePlayerName(value: string): string {
  const trimmed = value.trim().slice(0, MAX_PLAYER_NAME_LENGTH)

  if (!trimmed) {
    throw new ConvexError('Name is required')
  }

  return trimmed
}

function normalizeAvatar(value: string): string {
  const trimmed = value.trim()

  return trimmed ? trimmed.slice(0, 2) : '🗞️'
}

function createPublicId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

type DbContext = Pick<MutationCtx, 'db'> | Pick<QueryCtx, 'db'>

function chooseScenario(): {
  id: string
  title: string
  event: string
  intro_video: string
} {
  if (SCENARIOS.length === 0) {
    return {
      id: 'default_breaking_story',
      title: 'Breaking Story',
      event: DEFAULT_EVENT,
      intro_video: 'scenarios/golden_gate.mp4',
    }
  }

  const index = Math.floor(Math.random() * SCENARIOS.length)
  const scenario = SCENARIOS[index] as {
    id: string
    title: string
    event: string
    intro_video?: string
  }

  return {
    id: scenario.id,
    title: scenario.title,
    event: scenario.event,
    intro_video: scenario.intro_video ?? 'scenarios/golden_gate.mp4',
  }
}
