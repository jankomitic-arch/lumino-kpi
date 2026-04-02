import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS kpi_data (
      id SERIAL PRIMARY KEY,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      team VARCHAR(20) NOT NULL,
      week_id VARCHAR(10) NOT NULL,
      day VARCHAR(20) NOT NULL,
      location TEXT DEFAULT '',
      power TEXT DEFAULT '',
      points DECIMAL(5,2) DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(year, month, team, week_id, day)
    )
  `;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    await initDB();
    if (req.method === 'GET') {
      const { year, month } = req.query;
      const rows = await sql`SELECT team, week_id, day, location, power, points FROM kpi_data WHERE year = ${parseInt(year)} AND month = ${parseInt(month)}`;
      const result = { panonija: {}, sumadija: {} };
      for (const row of rows) {
        if (!result[row.team][row.week_id]) result[row.team][row.week_id] = {};
        result[row.team][row.week_id][row.day] = { location: row.location || '', power: row.power || '', points: row.points ? String(row.points) : '' };
      }
      return res.status(200).json(result);
    }
    if (req.method === 'POST') {
      const { year, month, team, weekId, day, location, power, points } = req.body;
      await sql`INSERT INTO kpi_data (year, month, team, week_id, day, location, power, points) VALUES (${year}, ${month}, ${team}, ${weekId}, ${day}, ${location || ''}, ${power || ''}, ${points || 0}) ON CONFLICT (year, month, team, week_id, day) DO UPDATE SET location = EXCLUDED.location, power = EXCLUDED.power, points = EXCLUDED.points, updated_at = NOW()`;
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}