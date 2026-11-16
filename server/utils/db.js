import postgres from 'postgres';
import { createError } from 'h3';
import { getConfig } from './config.js';

let _sql = null;

export function getDb() {
  if (_sql) return _sql;
  const url = getConfig().neonDb;
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Falta la variable de entorno NEON_DB',
    });
  }
  _sql = postgres(url, { max: 5, prepare: false });
  return _sql;
}

export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      topic_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      is_current BOOLEAN NOT NULL DEFAULT false
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS topics_one_current
    ON topics (is_current) WHERE is_current = true
  `;
}

export async function getCurrentTopic() {
  const sql = getDb();
  const rows = await sql`SELECT topic_id FROM topics WHERE is_current = true LIMIT 1`;
  return rows[0]?.topic_id ?? null;
}

export async function setCurrentTopic(topicId) {
  const sql = getDb();
  await sql.begin(async (tx) => {
    await tx`UPDATE topics SET is_current = false WHERE is_current = true`;
    await tx`INSERT INTO topics (topic_id, is_current) VALUES (${topicId}, true)`;
  });
}
