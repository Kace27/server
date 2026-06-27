"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePlayerStatus = exports.getPlayerMatchHistory = exports.getPlayerProfile = void 0;
const db_1 = __importDefault(require("../config/db"));
// Get player profile by username
const getPlayerProfile = async (req, res) => {
    const { username } = req.params;
    try {
        const query = `
      SELECT id, name, rank, rating, points, disconnects, seconds_played, comment, updated_on 
      FROM profiles 
      WHERE LOWER(name) = LOWER($1) AND deleted = false
      LIMIT 1
    `;
        const result = await db_1.default.query(query, [username]);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Player profile not found.' });
            return;
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching player profile:', error);
        res.status(500).json({ error: 'Database error' });
    }
};
exports.getPlayerProfile = getPlayerProfile;
// Get match history for a player by username with pagination
const getPlayerMatchHistory = async (req, res) => {
    const { username } = req.params;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const offset = (page - 1) * limit;
    try {
        // 1. Get profile ID
        const profileRes = await db_1.default.query('SELECT id FROM profiles WHERE LOWER(name) = LOWER($1) LIMIT 1', [username]);
        if (profileRes.rows.length === 0) {
            res.status(404).json({ error: 'Player profile not found.' });
            return;
        }
        const profileId = profileRes.rows[0].id;
        // 2. Fetch total count of matches
        const countQuery = `
      SELECT COUNT(*) 
      FROM matches_played mp
      WHERE mp.profile_id = $1
    `;
        const countRes = await db_1.default.query(countQuery, [profileId]);
        const totalItems = parseInt(countRes.rows[0].count);
        // 3. Fetch matched records
        const historyQuery = `
      SELECT 
        m.id AS match_id,
        m.score_home,
        m.score_away,
        m.team_id_home,
        m.team_id_away,
        m.played_on,
        mp.home,
        opp_p.name AS opponent_name,
        opp_p.id AS opponent_id,
        CASE
          WHEN (mp.home = true AND m.score_home > m.score_away) OR (mp.home = false AND m.score_away > m.score_home) THEN 'win'
          WHEN m.score_home = m.score_away THEN 'draw'
          ELSE 'loss'
        END AS result
      FROM matches_played mp
      JOIN matches m ON mp.match_id = m.id
      -- Get the opponent's match_played record
      JOIN matches_played opp_mp ON opp_mp.match_id = m.id AND opp_mp.profile_id != mp.profile_id
      JOIN profiles opp_p ON opp_mp.profile_id = opp_p.id
      WHERE mp.profile_id = $1
      ORDER BY m.played_on DESC
      LIMIT $2 OFFSET $3
    `;
        const result = await db_1.default.query(historyQuery, [profileId, limit, offset]);
        res.json({
            matches: result.rows,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
            }
        });
    }
    catch (error) {
        console.error('Error fetching match history:', error);
        res.status(500).json({ error: 'Database error' });
    }
};
exports.getPlayerMatchHistory = getPlayerMatchHistory;
// Admin: Toggle player status (ban/delete or restore)
const updatePlayerStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Expecting { status: 'banned' } or { status: 'active' }
    if (!status || (status !== 'banned' && status !== 'active')) {
        res.status(400).json({ error: 'Invalid status. Must be "banned" or "active".' });
        return;
    }
    const isDeleted = status === 'banned';
    const client = await db_1.default.connect();
    try {
        await client.query('BEGIN');
        // Get user_id from profile
        const profileRes = await client.query('SELECT user_id FROM profiles WHERE id = $1', [id]);
        if (profileRes.rows.length === 0) {
            res.status(404).json({ error: 'Player profile not found.' });
            client.release();
            return;
        }
        const userId = profileRes.rows[0].user_id;
        // Update profile deleted status
        await client.query('UPDATE profiles SET deleted = $1, updated_on = NOW() WHERE id = $2', [isDeleted, id]);
        // Update user deleted status
        await client.query('UPDATE users SET deleted = $1, updated_on = NOW() WHERE id = $2', [isDeleted, userId]);
        await client.query('COMMIT');
        res.json({ message: `Player status successfully updated to ${status}.` });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating player status:', error);
        res.status(500).json({ error: 'Database error' });
    }
    finally {
        client.release();
    }
};
exports.updatePlayerStatus = updatePlayerStatus;
