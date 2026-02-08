import { v } from 'convex/values'

export enum GamePhase {
  GameLobby = 'game_lobby',
  GameIntroduction = 'game_introduction',
  RoundLoading = 'round_loading',
  RoundVoting = 'round_voting',
  RoundProcessing = 'round_processing',
  RoundResults = 'round_results',
  GameEnding = 'game_ending',
  GameResults = 'game_results',
}

export const gamePhase = v.union(
  v.literal(GamePhase.GameLobby),
  v.literal(GamePhase.GameIntroduction),
  v.literal(GamePhase.RoundLoading),
  v.literal(GamePhase.RoundVoting),
  v.literal(GamePhase.RoundProcessing),
  v.literal(GamePhase.RoundResults),
  v.literal(GamePhase.GameEnding),
  v.literal(GamePhase.GameResults),
)
