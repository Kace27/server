const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool();
async function test() {
  try {
    const res = await pool.query(`
      SELECT 
          p.id AS player_id,
          p.name AS username,
          COALESCE(COUNT(mp.id), 0) AS matches_played,
          COALESCE(SUM(
              CASE 
                  WHEN (mp.home = true AND m.score_home > m.score_away) OR 
                       (mp.home = false AND m.score_away > m.score_home) THEN 1
                  ELSE 0
              END
          ), 0) AS matches_won,
          p.points AS points
      FROM profiles p
      LEFT JOIN matches_played mp ON mp.profile_id = p.id
      LEFT JOIN matches m ON mp.match_id = m.id
      WHERE p.deleted = false
      GROUP BY p.id, p.name, p.points
    `);
    console.log(res.rows);
  } catch (e) { console.error(e); }
  pool.end();
}
test();
