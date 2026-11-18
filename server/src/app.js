import cors from 'cors';
import express from 'express';
import { asyncHandler } from './http.js';
import { requireAdmin, requireAuth } from './middleware/auth.js';
import { getCurrentUser, loginUser, registerUser } from './services/auth.js';
import {
  createOrder,
  listAllOrders,
  listMyOrders,
  updateOrderStatus,
} from './services/orders.js';
import {
  createVegetable,
  listVegetables,
  setVegetableActive,
  updateVegetable,
} from './services/vegetables.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
);
app.use(express.json({ limit: '1mb' }));

const healthHandler = (req, res) => {
  res.json({ ok: true, service: 'greenbasket-api' });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  res.status(201).json(await registerUser(req.body));
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  res.json(await loginUser(req.body));
}));

app.get('/api/auth/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: await getCurrentUser(req.user.id) });
}));

app.get('/api/vegetables', asyncHandler(async (req, res) => {
  res.json(
    await listVegetables({
      includeInactive: false,
      search: String(req.query.search || ''),
      sort: String(req.query.sort || 'name'),
      order: String(req.query.order || 'asc'),
      page: req.query.page,
      pageSize: req.query.pageSize,
    }),
  );
}));

app.get('/api/admin/vegetables', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  res.json(
    await listVegetables({
      includeInactive: true,
      search: String(req.query.search || ''),
      sort: String(req.query.sort || 'name'),
      order: String(req.query.order || 'asc'),
      page: req.query.page,
      pageSize: req.query.pageSize || 20,
    }),
  );
}));

app.post('/api/admin/vegetables', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  res.status(201).json({ vegetable: await createVegetable(req.body) });
}));

app.put('/api/admin/vegetables/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  res.json({ vegetable: await updateVegetable(Number(req.params.id), req.body) });
}));

app.patch(
  '/api/admin/vegetables/:id/active',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      vegetable: await setVegetableActive(Number(req.params.id), req.body.isActive),
    });
  }),
);

app.post('/api/orders', requireAuth, asyncHandler(async (req, res) => {
  if (req.user.role !== 'customer') {
    throw Object.assign(new Error('Use a customer account to place an order'), {
      status: 403,
    });
  }

  const order = await createOrder({
    userId: req.user.id,
    customerName: req.body.customerName,
    phone: req.body.phone,
    address: req.body.address,
    items: req.body.items,
  });
  res.status(201).json({ order });
}));

app.get('/api/orders/mine', requireAuth, asyncHandler(async (req, res) => {
  res.json({ orders: await listMyOrders(req.user.id) });
}));

app.get('/api/admin/orders', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  res.json(
    await listAllOrders({
      status: String(req.query.status || ''),
      page: req.query.page,
      pageSize: req.query.pageSize,
    }),
  );
}));

app.patch(
  '/api/admin/orders/:id/status',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json({
      order: await updateOrderStatus(Number(req.params.id), req.body.status),
    });
  }),
);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = error.status || 500;
  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error: status >= 500 ? 'Something went wrong. Please try again.' : error.message,
  });
});

export default app;
