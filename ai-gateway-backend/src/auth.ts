import { Context } from 'hono';
import { Env } from './types';

const HARDCODED_USER = 'ajithvnr2001';
const HARDCODED_PASSWORD = '0000asdf';
const HARDCODED_TOKEN = 'dummy-token-ajith';

export function validateCredentials(username: string, password: string): boolean {
  return username === HARDCODED_USER && password === HARDCODED_PASSWORD;
}

export function generateToken(): string {
  return HARDCODED_TOKEN;
}

export function validateToken(token: string): boolean {
  return token === HARDCODED_TOKEN;
}

export function getHardcodedUserId(): string {
  return HARDCODED_USER;
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.substring(7);

  if (!validateToken(token)) {
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }

  // Add user_id to context
  c.set('user_id', getHardcodedUserId());

  await next();
}
