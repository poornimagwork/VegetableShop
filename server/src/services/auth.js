import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { httpError } from '../http.js';
import { mapUser } from '../mappers.js';
import { signToken } from '../middleware/auth.js';
import {
  requireEmail,
  requirePassword,
  requirePhone,
  requireText,
} from '../validation.js';

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function registerUser(body) {
  const name = requireText(body.name, 'Name', { min: 2, max: 80 });
  const email = requireEmail(body.email);
  const phone = requirePhone(body.phone);
  const password = requirePassword(body.password);
  const address = String(body.address ?? '').trim().slice(0, 300);

  const existing = await findByEmail(email);
  if (existing) {
    throw httpError(409, 'An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, phone, password_hash, role, address)
     VALUES ($1, $2, $3, $4, 'customer', $5)
     RETURNING id, name, email, phone, role, address`,
    [name, email, phone, passwordHash, address],
  );
  const user = mapUser(result.rows[0]);

  return { user, token: signToken(user) };
}

export async function loginUser(body) {
  const email = requireEmail(body.email);
  const password = String(body.password ?? '');
  const row = await findByEmail(email);

  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    throw httpError(401, 'Email or password is incorrect');
  }

  const user = mapUser(row);
  return { user, token: signToken(user) };
}

export async function getCurrentUser(id) {
  const result = await pool.query(
    `SELECT id, name, email, phone, role, address
     FROM users
     WHERE id = $1`,
    [id],
  );

  if (result.rowCount === 0) {
    throw httpError(401, 'Please log in again');
  }

  return mapUser(result.rows[0]);
}
