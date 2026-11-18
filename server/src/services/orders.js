import { pool } from '../db.js';
import { httpError } from '../http.js';
import { mapOrder } from '../mappers.js';
import { requirePhone, requireQuantity, requireText } from '../validation.js';

const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const orderSelect = `
  SELECT o.*,
         COALESCE(
           json_agg(
             json_build_object(
               'id', oi.id,
               'vegetableId', oi.vegetable_id,
               'name', oi.name_snapshot,
               'price', oi.price_snapshot,
               'quantity', oi.quantity,
               'unit', oi.unit,
               'amount', oi.amount
             )
             ORDER BY oi.id
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'
         ) AS items
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
`;

function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
  }).format(new Date());
}

async function nextInvoiceNumber(client) {
  const dayKey = todayKey();
  const result = await client.query(
    `INSERT INTO invoice_counters (day_key, last_value)
     VALUES ($1, 1)
     ON CONFLICT (day_key)
     DO UPDATE SET last_value = invoice_counters.last_value + 1
     RETURNING last_value`,
    [dayKey],
  );
  const sequence = String(result.rows[0].last_value).padStart(4, '0');
  return `GB-${dayKey.replaceAll('-', '')}-${sequence}`;
}

function mergeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'Add at least one vegetable before placing the order');
  }

  if (items.length > 30) {
    throw httpError(400, 'An order can contain at most 30 lines');
  }

  const merged = new Map();
  for (const item of items) {
    const id = Number(item?.vegetableId);
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'Each item needs a valid vegetable');
    }
    merged.set(id, (merged.get(id) || 0) + quantity);
  }

  return [...merged.entries()];
}

export async function createOrder({ userId, customerName, phone, address, items }) {
  const name = requireText(customerName, 'Customer name', { min: 2, max: 80 });
  const mobile = requirePhone(phone);
  const deliveryAddress = requireText(address, 'Delivery address', { min: 5, max: 300 });
  const requested = mergeItems(items);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const locked = await client.query(
      `SELECT id, name, price, unit, stock_qty, is_active
       FROM vegetables
       WHERE id = ANY($1::int[])
       FOR UPDATE`,
      [requested.map(([id]) => id)],
    );
    const byId = new Map(locked.rows.map((row) => [row.id, row]));
    const lines = [];

    for (const [id, rawQuantity] of requested) {
      const vegetable = byId.get(id);
      if (!vegetable || !vegetable.is_active) {
        throw httpError(400, 'One of the vegetables is no longer available');
      }

      const quantity = requireQuantity(vegetable.unit, rawQuantity);
      if (quantity > Number(vegetable.stock_qty)) {
        throw httpError(400, `Not enough stock for ${vegetable.name}`);
      }

      lines.push({
        vegetable,
        quantity,
        amount: Number((quantity * Number(vegetable.price)).toFixed(2)),
      });
    }

    const invoiceNumber = await nextInvoiceNumber(client);
    const grossAmount = Number(
      lines.reduce((sum, line) => sum + line.amount, 0).toFixed(2),
    );
    const inserted = await client.query(
      `INSERT INTO orders (
         user_id, invoice_number, payment_method, gross_amount,
         customer_name, customer_phone, customer_address
       )
       VALUES ($1, $2, 'cod', $3, $4, $5, $6)
       RETURNING id`,
      [userId, invoiceNumber, grossAmount, name, mobile, deliveryAddress],
    );
    const orderId = inserted.rows[0].id;

    for (const line of lines) {
      const stockUpdate = await client.query(
        `UPDATE vegetables
         SET stock_qty = stock_qty - $1, updated_at = NOW()
         WHERE id = $2 AND is_active = TRUE AND stock_qty >= $1`,
        [line.quantity, line.vegetable.id],
      );

      if (stockUpdate.rowCount !== 1) {
        throw httpError(400, `Not enough stock for ${line.vegetable.name}`);
      }

      await client.query(
        `INSERT INTO order_items (
           order_id, vegetable_id, name_snapshot, price_snapshot, quantity, unit, amount
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          orderId,
          line.vegetable.id,
          line.vegetable.name,
          line.vegetable.price,
          line.quantity,
          line.vegetable.unit,
          line.amount,
        ],
      );
    }

    await client.query('COMMIT');
    return getOrderById(orderId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getOrderById(id, user) {
  const params = [id];
  let userClause = '';

  if (user && user.role !== 'admin') {
    params.push(user.id);
    userClause = `AND o.user_id = $${params.length}`;
  }

  const result = await pool.query(
    `${orderSelect}
     WHERE o.id = $1 ${userClause}
     GROUP BY o.id`,
    params,
  );

  if (result.rowCount === 0) {
    throw httpError(404, 'Order not found');
  }

  return mapOrder(result.rows[0]);
}

export async function listMyOrders(userId) {
  const result = await pool.query(
    `${orderSelect}
     WHERE o.user_id = $1
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId],
  );
  return result.rows.map(mapOrder);
}

export async function listAllOrders({ status = '', page = 1, pageSize = 10 }) {
  const params = [];
  const where = [];
  const allowed = ['pending', 'confirmed', 'delivered', 'cancelled'];

  if (status) {
    if (!allowed.includes(status)) {
      throw httpError(400, 'Unknown order status');
    }
    params.push(status);
    where.push(`o.status = $${params.length}`);
  }

  const limit = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const currentPage = Math.max(Number(page) || 1, 1);
  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const count = await pool.query(
    `SELECT COUNT(*)::int AS total FROM orders o ${whereSql}`,
    params,
  );
  const listParams = [...params, limit, (currentPage - 1) * limit];
  const result = await pool.query(
    `${orderSelect}
     ${whereSql}
     GROUP BY o.id
     ORDER BY o.created_at DESC
     LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
    listParams,
  );

  return {
    orders: result.rows.map(mapOrder),
    total: count.rows[0].total,
    page: currentPage,
    pageSize: limit,
  };
}

export async function updateOrderStatus(id, nextStatus) {
  const allowed = ['pending', 'confirmed', 'delivered', 'cancelled'];
  if (!allowed.includes(nextStatus)) {
    throw httpError(400, 'Unknown order status');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const current = await client.query(
      'SELECT id, status FROM orders WHERE id = $1 FOR UPDATE',
      [id],
    );

    if (current.rowCount === 0) {
      throw httpError(404, 'Order not found');
    }

    const status = current.rows[0].status;
    if (status === nextStatus) {
      await client.query('COMMIT');
      return getOrderById(id);
    }

    if (!transitions[status].includes(nextStatus)) {
      throw httpError(
        400,
        `An order that is ${status} cannot move to ${nextStatus}`,
      );
    }

    if (nextStatus === 'cancelled') {
      const items = await client.query(
        `SELECT vegetable_id, quantity
         FROM order_items
         WHERE order_id = $1 AND vegetable_id IS NOT NULL`,
        [id],
      );

      for (const item of items.rows) {
        await client.query(
          `UPDATE vegetables
           SET stock_qty = stock_qty + $1, updated_at = NOW()
           WHERE id = $2`,
          [item.quantity, item.vegetable_id],
        );
      }
    }

    await client.query('UPDATE orders SET status = $1 WHERE id = $2', [
      nextStatus,
      id,
    ]);
    await client.query('COMMIT');
    return getOrderById(id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
