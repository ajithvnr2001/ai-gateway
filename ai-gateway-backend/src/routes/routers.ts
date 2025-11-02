import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../auth';

const routers = new Hono<{ Bindings: Env }>();

routers.use('*', authMiddleware);

// GET all routers
routers.get('/', async (c) => {
  const userId = c.get('user_id');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM routers WHERE user_id = ?'
  ).bind(userId).all();

  return c.json({ routers: results });
});

// GET single router with rules
routers.get('/:id', async (c) => {
  const userId = c.get('user_id');
  const routerId = c.req.param('id');

  const router = await c.env.DB.prepare(
    'SELECT * FROM routers WHERE id = ? AND user_id = ?'
  ).bind(routerId, userId).first();

  if (!router) {
    return c.json({ error: 'Router not found' }, 404);
  }

  const { results: rules } = await c.env.DB.prepare(
    'SELECT * FROM routing_rules WHERE router_id = ? ORDER BY priority ASC'
  ).bind(routerId).all();

  return c.json({ router, rules });
});

// POST create router
routers.post('/', async (c) => {
  const userId = c.get('user_id');
  const { name } = await c.req.json();

  if (!name) {
    return c.json({ error: 'Router name is required' }, 400);
  }

  const routerId = `router_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    'INSERT INTO routers (id, user_id, name) VALUES (?, ?, ?)'
  ).bind(routerId, userId, name).run();

  return c.json({
    id: routerId,
    message: 'Router created successfully'
  }, 201);
});

// POST create routing rule
routers.post('/:id/rules', async (c) => {
  const userId = c.get('user_id');
  const routerId = c.req.param('id');
  const { priority, condition, provider_id, allowed_models } = await c.req.json();

  // Verify router belongs to user
  const router = await c.env.DB.prepare(
    'SELECT * FROM routers WHERE id = ? AND user_id = ?'
  ).bind(routerId, userId).first();

  if (!router) {
    return c.json({ error: 'Router not found' }, 404);
  }

  const ruleId = `rule_${crypto.randomUUID()}`;

  await c.env.DB.prepare(
    'INSERT INTO routing_rules (id, router_id, priority, condition, provider_id, allowed_models) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(ruleId, routerId, priority || 1, condition || 'primary', provider_id, allowed_models || null).run();

  return c.json({
    id: ruleId,
    message: 'Routing rule created successfully'
  }, 201);
});

// DELETE routing rule
routers.delete('/:routerId/rules/:ruleId', async (c) => {
  const userId = c.get('user_id');
  const routerId = c.req.param('routerId');
  const ruleId = c.req.param('ruleId');

  // Verify router belongs to user
  const router = await c.env.DB.prepare(
    'SELECT * FROM routers WHERE id = ? AND user_id = ?'
  ).bind(routerId, userId).first();

  if (!router) {
    return c.json({ error: 'Router not found' }, 404);
  }

  const result = await c.env.DB.prepare(
    'DELETE FROM routing_rules WHERE id = ? AND router_id = ?'
  ).bind(ruleId, routerId).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Rule not found' }, 404);
  }

  return c.json({ message: 'Rule deleted successfully' });
});

// DELETE router
routers.delete('/:id', async (c) => {
  const userId = c.get('user_id');
  const routerId = c.req.param('id');

  const result = await c.env.DB.prepare(
    'DELETE FROM routers WHERE id = ? AND user_id = ?'
  ).bind(routerId, userId).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Router not found' }, 404);
  }

  return c.json({ message: 'Router deleted successfully' });
});

export default routers;
