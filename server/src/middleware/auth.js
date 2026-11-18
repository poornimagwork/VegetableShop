import jwt from 'jsonwebtoken';
import { httpError } from '../http.js';

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    next(httpError(401, 'Please log in'));
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: Number(payload.sub),
      role: payload.role,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch {
    next(httpError(401, 'Your session has expired. Please log in again'));
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    next(httpError(403, 'Admin access is required'));
    return;
  }

  next();
}
