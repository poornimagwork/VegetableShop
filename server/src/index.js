import app from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT || 5000);

await pool.query('SELECT 1');

const server = app.listen(port, () => {
  console.log(`GreenBasket API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
