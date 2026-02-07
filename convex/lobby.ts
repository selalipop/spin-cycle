import { ConvexError, v } from 'convex/values'
import { mutation, query, type MutationCtx, type QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'

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

const criterion = (
  name: string,
  description: string,
  aiScoringInstructions: string,
) => ({
  name,
  description,
  ai_scoring_instructions: aiScoringInstructions,
})

const SHARED_ACTIONS = [
  {
    id: 'social_media_post',
    name: 'Social Media Post',
    cost: 1,
    prompt: 'What are you posting right now?',
    scoring_criteria: [
      criterion('Short', 'Gets to the point fast.', 'Reward concise copy under 280 chars.'),
      criterion('Catchy', 'Memorable and shareable.', 'Reward hooks that people will repeat.'),
      criterion('Emotional', 'Makes people feel something.', 'Reward emotionally resonant framing.'),
    ],
    repeatable: true,
    is_special: false,
  },
  {
    id: 'public_statement',
    name: 'Public Statement',
    cost: 1,
    prompt: 'What is your official statement?',
    scoring_criteria: [
      criterion('Clear', 'Easy to understand.', 'Reward plain language and unambiguous claims.'),
      criterion('Credible', 'Sounds trustworthy.', 'Reward details, accountability, and confidence.'),
      criterion('Strategic', 'Helps your faction goals.', 'Reward framing that advances faction interests.'),
    ],
    repeatable: true,
    is_special: false,
  },
  {
    id: 'place_story',
    name: 'Place a Story',
    cost: 2,
    prompt: 'Pitch the story angle you are placing with media outlets.',
    scoring_criteria: [
      criterion('Angle', 'Has a sharp narrative frame.', 'Reward coherent and distinct story angles.'),
      criterion('Plausible', 'Could realistically spread.', 'Reward realistic sourcing and tone.'),
      criterion('Impactful', 'Would move public sentiment.', 'Reward likely public effect and scale.'),
    ],
    repeatable: false,
    is_special: false,
  },
  {
    id: 'anonymous_leak',
    name: 'Anonymous Leak',
    cost: 3,
    prompt: 'What is being leaked, and why will people believe it?',
    scoring_criteria: [
      criterion('Explosive', 'Feels consequential.', 'Reward revelations with clear stakes.'),
      criterion('Believable', 'Passes a smell test.', 'Reward specific, plausible supporting details.'),
      criterion('Viral Potential', 'Likely to spread fast.', 'Reward content that news/social will amplify.'),
    ],
    repeatable: false,
    is_special: false,
  },
]

type FactionConfig = {
  code: string
  name: string
  description: string
  archetype: string
  scoring: Doc<'factions'>['scoring']
  faction_actions: Doc<'factions'>['faction_actions']
}

const FACTIONS: FactionConfig[] = [
  {
    code: 'the_institute',
    name: 'The Institute',
    description: 'Experts pushing calm, controlled messaging.',
    archetype:
      'Academic and technocratic. Calm, data-heavy, and authority-first. Prioritizes order and trust in institutions.',
    scoring: {
      stability: [-3, -1, 2, 5],
      attention: [-1, 1, 2, 3],
      curiosity: [-2, -1, 1, 3],
      corporate_blame: [2, 1, -1, -3],
      government_blame: [2, 1, -1, -4],
    },
    faction_actions: [
      {
        id: 'expert_panel',
        name: 'Expert Panel',
        cost: 2,
        prompt: 'Draft the panel talking points.',
        scoring_criteria: [
          criterion('Authority', 'Expert voice feels credible.', 'Reward institutional expertise and confidence.'),
          criterion('Reassurance', 'Calms the audience.', 'Reward confidence-building framing.'),
          criterion('Specificity', 'Contains concrete details.', 'Reward concrete, verifiable details.'),
        ],
        repeatable: false,
        is_special: false,
      },
      {
        id: 'release_whitepaper',
        name: 'Release Whitepaper',
        cost: 3,
        prompt: 'Write the headline thesis of your emergency whitepaper.',
        scoring_criteria: [
          criterion('Depth', 'Substance over slogans.', 'Reward nuanced and technical content.'),
          criterion('Coherence', 'Argument is internally consistent.', 'Reward logical structure and rigor.'),
          criterion('Policy Utility', 'Supports decisive action.', 'Reward actionable recommendations.'),
        ],
        repeatable: false,
        is_special: false,
      },
      {
        id: 'declare_consensus',
        name: 'Declare Scientific Consensus',
        cost: 4,
        prompt: 'Make the definitive consensus announcement.',
        scoring_criteria: [
          criterion('Finality', 'Feels definitive.', 'Reward decisive and complete framing.'),
          criterion('Legitimacy', 'Feels institutionally grounded.', 'Reward reference to methods and consensus.'),
          criterion('Narrative Control', 'Re-centers the story.', 'Reward framing that stabilizes discourse.'),
        ],
        repeatable: false,
        is_special: true,
      },
    ],
  },
  {
    code: 'crowdswell',
    name: 'Crowdswell',
    description: 'Grassroots firestarters amplifying public suspicion.',
    archetype:
      'Populist, memetic, and disruptive. Champions ordinary voices, escalates doubt, and weaponizes virality.',
    scoring: {
      stability: [5, 2, -1, -3],
      attention: [-2, 1, 3, 5],
      curiosity: [-1, 2, 4, 5],
      corporate_blame: [-2, 1, 3, 5],
      government_blame: [-2, 1, 3, 5],
    },
    faction_actions: [
      {
        id: 'street_interviews',
        name: 'Street Interviews',
        cost: 2,
        prompt: 'Write the most shareable quote from "regular people."',
        scoring_criteria: [
          criterion('Voice', 'Feels authentic.', 'Reward natural, colloquial language.'),
          criterion('Relatability', 'Connects with broad audiences.', 'Reward everyday concerns and emotion.'),
          criterion('Spark', 'Starts conversation.', 'Reward provocative but plausible framing.'),
        ],
        repeatable: false,
        is_special: false,
      },
      {
        id: 'trend_hijack',
        name: 'Trend Hijack',
        cost: 3,
        prompt: 'How are you hijacking the current trend to your narrative?',
        scoring_criteria: [
          criterion('Timing', 'Feels of-the-moment.', 'Reward current-feeling cultural hooks.'),
          criterion('Memeability', 'Built to spread.', 'Reward concise, remixable language.'),
          criterion('Narrative Pull', 'Brings attention to your angle.', 'Reward clear redirection toward faction goals.'),
        ],
        repeatable: false,
        is_special: false,
      },
      {
        id: 'people_power_flashmob',
        name: 'People Power Flash Mob',
        cost: 4,
        prompt: 'Describe the coordinated public action in one dramatic call to action.',
        scoring_criteria: [
          criterion('Mobilization', 'Could move people into action.', 'Reward urgency and clear calls to act.'),
          criterion('Visibility', 'Impossible to ignore.', 'Reward spectacle and media attractiveness.'),
          criterion('Momentum', 'Keeps pressure rising.', 'Reward sustained narrative escalation.'),
        ],
        repeatable: false,
        is_special: true,
      },
    ],
  },
  {
    code: 'pinnacle_media_group',
    name: 'Pinnacle Media Group',
    description: 'Engagement-maxing media pros chasing the biggest story.',
    archetype:
      'Ratings-obsessed media machine. Sensational framing, cliffhangers, and relentless audience capture.',
    scoring: {
      stability: [3, 1, -1, -2],
      attention: [-4, -1, 3, 5],
      curiosity: [-2, 1, 3, 5],
      corporate_blame: [1, 2, 2, 3],
      government_blame: [1, 2, 2, 3],
    },
    faction_actions: [
      {
        id: 'breaking_banner',
        name: 'Breaking Banner',
        cost: 2,
        prompt: 'Write the lower-third breaking banner.',
        scoring_criteria: [
          criterion('Urgency', 'Feels immediate.', 'Reward high urgency without gibberish.'),
          criterion('Clarity', 'Understood at a glance.', 'Reward short, punchy, clear wording.'),
          criterion('Hook', 'Makes people stay tuned.', 'Reward curiosity-inducing framing.'),
        ],
        repeatable: false,
        is_special: false,
      },
      {
        id: 'exclusive_segment',
        name: 'Exclusive Segment',
        cost: 3,
        prompt: 'Pitch the tease for your exclusive segment.',
        scoring_criteria: [
          criterion('Exclusivity', 'Feels like must-watch access.', 'Reward unique value and rarity cues.'),
          criterion('Drama', 'Heightens stakes.', 'Reward emotionally charged storytelling.'),
          criterion('Retention', 'Keeps viewers around.', 'Reward episodic, cliffhanger cadence.'),
        ],
        repeatable: false,
        is_special: false,
      },
      {
        id: 'prime_time_takedown',
        name: 'Prime Time Takedown',
        cost: 4,
        prompt: 'Write your prime-time opener for a devastating exposé.',
        scoring_criteria: [
          criterion('Cinematic', 'Feels huge and polished.', 'Reward vivid, high-production language.'),
          criterion('Narrative Dominance', 'Defines the story frame.', 'Reward framing that sets agenda for others.'),
          criterion('Virality', 'Clips will spread everywhere.', 'Reward quotable lines and shareability.'),
        ],
        repeatable: false,
        is_special: true,
      },
    ],
  },
  {
    code: 'foundation_for_public_good',
    name: 'The Foundation for Public Good',
    description: 'Well-funded pragmatists steering order through policy optics.',
    archetype:
      'Polished, philanthropic, and paternalistic. Uses institutional partnerships and benevolent framing to direct outcomes.',
    scoring: {
      stability: [-2, 1, 3, 5],
      attention: [2, 2, 1, -1],
      curiosity: [3, 1, -1, -2],
      corporate_blame: [4, 2, -1, -3],
      government_blame: [4, 2, -1, -3],
    },
    faction_actions: [
      {
        id: 'fund_rapid_response',
        name: 'Fund Rapid Response',
        cost: 2,
        prompt: 'Announce your immediate intervention grant.',
        scoring_criteria: [
          criterion('Competence', 'Feels operationally credible.', 'Reward concrete logistics and realism.'),
          criterion('Goodwill', 'Feels publicly beneficial.', 'Reward prosocial, reassuring framing.'),
          criterion('Control', 'Shows you are shaping events.', 'Reward proactive command of the narrative.'),
        ],
        repeatable: false,
        is_special: false,
      },
      {
        id: 'policy_alignment',
        name: 'Policy Alignment Brief',
        cost: 3,
        prompt: 'Write the key paragraph from your policy alignment brief.',
        scoring_criteria: [
          criterion('Institutional Fit', 'Matches official priorities.', 'Reward policy-literate and aligned language.'),
          criterion('Pragmatism', 'Sounds implementable now.', 'Reward feasible and concrete recommendations.'),
          criterion('Perception', 'Looks responsible and calm.', 'Reward tone that signals measured leadership.'),
        ],
        repeatable: false,
        is_special: false,
      },
      {
        id: 'national_reassurance_campaign',
        name: 'National Reassurance Campaign',
        cost: 4,
        prompt: 'Draft the campaign line everyone will hear tomorrow.',
        scoring_criteria: [
          criterion('Unity', 'Pulls the public together.', 'Reward collective and de-polarizing language.'),
          criterion('Trust', 'Builds confidence in institutions.', 'Reward consistent, credible framing.'),
          criterion('Narrative Closure', 'Feels like a path forward.', 'Reward action-oriented, stabilizing direction.'),
        ],
        repeatable: false,
        is_special: true,
      },
    ],
  },
]

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

export const createGame = mutation({
  args: {},
  returns: v.object({
    gameId: v.string(),
    joinCode: v.string(),
  }),
  handler: async (ctx) => {
    const joinCode = await generateUniqueJoinCode(ctx)
    const publicGameId = createPublicId()

    const gameId = await ctx.db.insert('games', {
      public_id: publicGameId,
      join_code: joinCode,
      event: DEFAULT_EVENT,
      max_rounds: 4,
      current_round: 0,
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
      phase: v.union(
        v.literal('lobby'),
        v.literal('planning'),
        v.literal('submitting'),
        v.literal('resolving'),
        v.literal('results'),
        v.literal('game_over'),
      ),
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
      phase: v.union(
        v.literal('lobby'),
        v.literal('planning'),
        v.literal('submitting'),
        v.literal('resolving'),
        v.literal('results'),
        v.literal('game_over'),
      ),
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
      phase: v.union(
        v.literal('lobby'),
        v.literal('planning'),
        v.literal('submitting'),
        v.literal('resolving'),
        v.literal('results'),
        v.literal('game_over'),
      ),
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
    phase: v.literal('planning'),
    roundNumber: v.number(),
  }),
  handler: async (ctx, args) => {
    const game = await findGameByPublicId(ctx, args.gameId)

    if (!game) {
      throw new ConvexError('Game not found')
    }

    if (game.phase !== 'lobby') {
      throw new ConvexError('Game has already started')
    }

    await ctx.db.insert('rounds', {
      game_id: game._id,
      number: 1,
      event_development: game.event,
      sentiment_before: game.sentiments,
    })

    await ctx.db.patch(game._id, {
      phase: "planning" as const,
      current_round: 1,
    })

    return {
      gameId: game.public_id,
      phase: "planning" as const,
      roundNumber: 1,
    }
  },
})

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
