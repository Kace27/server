"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerRefreshRanking = exports.getRanking = void 0;
const db_1 = __importDefault(require("../config/db"));
const rankingService_1 = require("../services/rankingService");
const getRanking = async (req, res) => {
    try {
        const query = `
      SELECT player_id, username, matches_played, matches_won, points, updated_at 
      FROM ranking_cache 
      ORDER BY points DESC, matches_won DESC
      LIMIT 100
    `;
        const result = await db_1.default.query(query);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching rankings:', error);
        res.status(500).json({ error: 'Database error' });
    }
};
exports.getRanking = getRanking;
const triggerRefreshRanking = async (req, res) => {
    try {
        await (0, rankingService_1.refreshRankingCache)();
        res.json({ message: 'Ranking cache refreshed successfully.' });
    }
    catch (error) {
        console.error('Error triggering ranking refresh:', error);
        res.status(500).json({ error: 'Failed to refresh ranking cache' });
    }
};
exports.triggerRefreshRanking = triggerRefreshRanking;
