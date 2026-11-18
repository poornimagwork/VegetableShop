import { httpError } from './http.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[6-9]\d{9}$/;

export function requireText(value, label, { min = 1, max = 120 } = {}) {
  const text = String(value ?? '').trim();
  if (text.length < min || text.length > max) {
    throw httpError(400, `${label} must be between ${min} and ${max} characters`);
  }
  return text;
}

export function requireEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  if (!emailPattern.test(email) || email.length > 120) {
    throw httpError(400, 'Enter a valid email address');
  }
  return email;
}

export function requirePhone(value) {
  const phone = String(value ?? '').trim();
  if (!phonePattern.test(phone)) {
    throw httpError(400, 'Enter a valid 10-digit Indian mobile number');
  }
  return phone;
}

export function requirePassword(value) {
  const password = String(value ?? '');
  if (password.length < 8 || password.length > 72) {
    throw httpError(400, 'Password must be 8 to 72 characters');
  }
  return password;
}

export function requireMoney(value, label) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000) {
    throw httpError(400, `${label} must be a valid amount`);
  }
  return Number(amount.toFixed(2));
}

export function requireStock(value) {
  const stock = Number(value);
  if (!Number.isFinite(stock) || stock < 0 || stock > 100000) {
    throw httpError(400, 'Stock must be zero or a positive number');
  }
  return Number(stock.toFixed(3));
}

export function requireUnit(value) {
  if (value !== 'kg' && value !== 'bunch') {
    throw httpError(400, 'Unit must be kg or bunch');
  }
  return value;
}

export function requireQuantity(unit, value) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 1000) {
    throw httpError(400, 'Quantity must be greater than zero');
  }

  const thousandths = Math.round(quantity * 1000);
  if (Math.abs(quantity * 1000 - thousandths) > 0.001) {
    throw httpError(400, 'Quantity can have at most 3 decimal places');
  }

  if (unit === 'bunch' && !Number.isInteger(quantity)) {
    throw httpError(400, 'Bunch quantity must be a whole number');
  }

  return thousandths / 1000;
}
