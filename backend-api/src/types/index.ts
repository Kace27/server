import { Request } from 'express';

export interface UserPayload {
  username: string;
  role: 'admin';
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export interface PlayerProfile {
  id: number;
  username: string;
  name: string;
  rank: number;
  rating: number;
  points: number;
  disconnects: number;
  seconds_played: number;
  comment: string | null;
  deleted: boolean;
  updated_on: Date;
}

export interface MatchHistoryItem {
  id: string;
  score_home: number;
  score_away: number;
  team_id_home: number;
  team_id_away: number;
  played_on: Date;
  opponent_name: string;
  opponent_id: number;
  result: 'win' | 'loss' | 'draw';
  home: boolean;
}

export interface RankingCache {
  player_id: number;
  username: string;
  matches_played: number;
  matches_won: number;
  points: number;
  updated_at: Date;
}
