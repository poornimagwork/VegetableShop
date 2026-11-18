import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../src/db.js';

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'migrations',
);

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`);

const applied = await pool.query('SELECT filename FROM schema_migrations');
const done = new Set(applied.rows.map((row) => row.filename));
const files = (await fs.readdir(migrationsDir))
  .filter((name) => name.endsWith('.sql'))
  .sort();

for (const filename of files) {
  if (done.has(filename)) {
    console.log(`skip ${filename}`);
    continue;
  }

  const sql = await fs.readFile(path.join(migrationsDir, filename), 'utf8');
  await pool.query(sql);
  await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
  console.log(`applied ${filename}`);
}

await pool.end();
