import { createHmac, timingSafeEqual } from 'node:crypto';
import { createError, getCookie, setCookie, deleteCookie } from 'h3';
import { getConfig } from './config.js';

export const ADMIN_COOKIE = 'wk_admin';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function sign(payload) {
  const cfg = getConfig();
  if (!cfg.sessionSecret) {
    throw createError({ statusCode: 500, statusMessage: 'Falta SESSION_SECRET' });
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', cfg.sessionSecret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verify(token) {
  if (!token) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const cfg = getConfig();
  const expected = createHmac('sha256', cfg.sessionSecret).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function safeEqual(a, b) {
  const ba = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function createAdminSession(event) {
  const token = sign({ exp: Date.now() + SESSION_TTL_SECONDS * 1000 });
  setCookie(event, ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function destroyAdminSession(event) {
  deleteCookie(event, ADMIN_COOKIE, { path: '/' });
}

export function isAdmin(event) {
  return verify(getCookie(event, ADMIN_COOKIE));
}

export function requireAdmin(event) {
  if (!isAdmin(event)) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado' });
  }
}
