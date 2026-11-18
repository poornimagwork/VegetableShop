import { pool } from '../db.js';
import { httpError } from '../http.js';
import { mapVegetable } from '../mappers.js';
import {
  requireMoney,
  requireStock,
  requireText,
  requireUnit,
} from '../validation.js';

function escapeLike(value) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function listQuery({ includeInactive, search, sort, order, page, pageSize }) {
  const sortColumns = { name: 'name', price: 'price' };
  const column = sortColumns[sort] || 'name';
  const direction = order === 'desc' ? 'DESC' : 'ASC';
  const term = escapeLike(search.trim());
  const where = [];
  const params = [];

  if (!includeInactive) {
    where.push('is_active = TRUE');
  }

  if (term) {
    params.push(`%${term}%`);
    where.push(`name ILIKE $${params.length} ESCAPE '\\'`);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const limit = Math.min(Math.max(Number(pageSize) || 8, 1), 24);
  const currentPage = Math.max(Number(page) || 1, 1);
  const offset = (currentPage - 1) * limit;

  return {
    whereSql,
    params,
    column,
    direction,
    limit,
    offset,
    page: currentPage,
  };
}

export async function listVegetables(options) {
  const query = listQuery(options);
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM vegetables ${query.whereSql}`,
    query.params,
  );
  const listParams = [...query.params, query.limit, query.offset];
  const result = await pool.query(
    `SELECT * FROM vegetables
     ${query.whereSql}
     ORDER BY ${query.column} ${query.direction}, id ASC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    vegetables: result.rows.map(mapVegetable),
    total: countResult.rows[0].total,
    page: query.page,
    pageSize: query.limit,
  };
}

export async function getVegetable(id) {
  const result = await pool.query('SELECT * FROM vegetables WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw httpError(404, 'Vegetable not found');
  }
  return mapVegetable(result.rows[0]);
}

function vegetableInput(body) {
  return {
    name: requireText(body.name, 'Name', { min: 2, max: 80 }),
    description: requireText(body.description || 'Fresh produce', 'Description', {
      min: 2,
      max: 200,
    }),
    price: requireMoney(body.price, 'Price'),
    unit: requireUnit(body.unit),
    image: requireText(body.image, 'Image', { min: 1, max: 300 }),
    stockQty: requireStock(body.stockQty),
    isActive: body.isActive !== false,
  };
}

export async function createVegetable(body) {
  const input = vegetableInput(body);
  const result = await pool.query(
    `INSERT INTO vegetables (name, description, price, unit, image_url, stock_qty, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.name,
      input.description,
      input.price,
      input.unit,
      input.image,
      input.stockQty,
      input.isActive,
    ],
  );
  return mapVegetable(result.rows[0]);
}

export async function updateVegetable(id, body) {
  const input = vegetableInput(body);
  const result = await pool.query(
    `UPDATE vegetables
     SET name = $1,
         description = $2,
         price = $3,
         unit = $4,
         image_url = $5,
         stock_qty = $6,
         is_active = $7,
         updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      input.name,
      input.description,
      input.price,
      input.unit,
      input.image,
      input.stockQty,
      input.isActive,
      id,
    ],
  );

  if (result.rowCount === 0) {
    throw httpError(404, 'Vegetable not found');
  }

  return mapVegetable(result.rows[0]);
}

export async function setVegetableActive(id, isActive) {
  if (typeof isActive !== 'boolean') {
    throw httpError(400, 'isActive must be true or false');
  }

  const result = await pool.query(
    `UPDATE vegetables
     SET is_active = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [isActive, id],
  );

  if (result.rowCount === 0) {
    throw httpError(404, 'Vegetable not found');
  }

  return mapVegetable(result.rows[0]);
}
