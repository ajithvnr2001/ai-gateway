import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../auth';

const gatewayKeys = new Hono<{ Bindings: Env }>();

gatewayKeys.use('*', authMiddleware);

// GET all gateway keys
gatewayKeys.get('/', async (c) => {
  const userId = c.get('user_id');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM gateway_keys WHERE user_id = ?'
  ).bind(userId).all();

  return c.json({ keys: results });
});

// POST create gateway key
gatewayKeys.post('/', async (c) => {
  const userId = c.get('user_id');
  const { name, router_id } = await c.req.json();

  if (!name || !router_id) {
    return c.json({ error: 'Name and router_id are required' }, 400);
  }

  // Verify router belongs to user
  const router = await c.env.DB.prepare(
    'SELECT * FROM routers WHERE id = ? AND user_id = ?'
  ).bind(router_id, userId).first();

  if (!router) {
    return c.json({ error: 'Router not found' }, 404);
  }

  const keyId = `gw_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    'INSERT INTO gateway_keys (id, user_id, router_id, name, is_active) VALUES (?, ?, ?, ?, 1)'
  ).bind(keyId, userId, router_id, name).run();

  return c.json({
    id: keyId,
    key: keyId,
    message: 'Gateway key created successfully'
  }, 201);
});

// PUT toggle key active status
gatewayKeys.put('/:id', async (c) => {
  const userId = c.get('user_id');
  const keyId = c.req.param('id');
  const { is_active } = await c.req.json();

  const result = await c.env.DB.prepare(
    'UPDATE gateway_keys SET is_active = ? WHERE id = ? AND user_id = ?'
  ).bind(is_active ? 1 : 0, keyId, userId).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Key not found' }, 404);
  }

  return c.json({ message: 'Key updated successfully' });
});

// DELETE gateway key
gatewayKeys.delete('/:id', async (c) => {
  const userId = c.get('user_id');
  const keyId = c.req.param('id');

  const result = await c.env.DB.prepare(
    'DELETE FROM gateway_keys WHERE id = ? AND user_id = ?'
  ).bind(keyId, userId).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Key not found' }, 404);
  }

  return c.json({ message: 'Key deleted successfully' });
});

export default gatewayKeys;
