"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentMatches = void 0;
const db_1 = __importDefault(require("../config/db"));
// Get recent matches list
const getRecentMatches = async (req, res) => {
    const limit = parseInt(req.query.limit || '10');
    const offset = parseInt(req.query.offset || '0');
    try {
        const query = `
      SELECT 
          m.id AS match_id,
          m.score_home,
          m.score_away,
          m.team_id_home,
          m.team_id_away,
          m.played_on,
          p_home.name AS home_player_name,
          p_home.id AS home_player_id,
          p_away.name AS away_player_name,
          p_away.id AS away_player_id
      FROM matches m
      JOIN matches_played mp_home ON mp_home.match_id = m.id AND mp_home.home = true
      JOIN profiles p_home ON mp_home.profile_id = p_home.id
      JOIN matches_played mp_away ON mp_away.match_id = m.id AND mp_away.home = false
      JOIN profiles p_away ON mp_away.profile_id = p_away.id
      ORDER BY m.played_on DESC
      LIMIT $1 OFFSET $2;
    `;
        const result = await db_1.default.query(query, [limit, offset]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching recent matches:', error);
        res.status(500).json({ error: 'Database error' });
    }
};
exports.getRecentMatches = getRecentMatches;
