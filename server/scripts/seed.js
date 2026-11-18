import bcrypt from 'bcryptjs';
import vegetables from '../../src/data/vegetables.js';
import { pool } from '../src/db.js';

const existing = await pool.query('SELECT COUNT(*)::int AS total FROM vegetables');

if (existing.rows[0].total === 0) {
  for (const vegetable of vegetables) {
    await pool.query(
      `INSERT INTO vegetables (name, description, price, unit, image_url, stock_qty, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
      [
        vegetable.name,
        vegetable.description,
        vegetable.price,
        vegetable.unit,
        vegetable.image,
        vegetable.unit === 'bunch' ? 40 : 50,
      ],
    );
  }
  console.log(`Seeded ${vegetables.length} vegetables`);
} else {
  console.log('Vegetables already present, seed skipped');
}

const adminEmail = 'admin@greenbasket.local';
const admin = await pool.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

if (admin.rowCount === 0) {
  const passwordHash = await bcrypt.hash('Admin@1234', 10);
  await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role, address)
     VALUES ('GreenBasket Admin', $1, '9999999999', $2, 'admin', 'GreenBasket, Bengaluru')`,
    [adminEmail, passwordHash],
  );
  console.log('Seeded admin account admin@greenbasket.local');
} else {
  console.log('Admin account already present');
}

await pool.end();
