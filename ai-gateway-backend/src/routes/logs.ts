import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../auth';
import { getUserTotalSpend, getUserBudget } from '../db/queries';

const logs = new Hono<{ Bindings: Env }>();

logs.use('*', authMiddleware);

// GET all logs
logs.get('/', async (c) => {
  try {
    const userId = c.get('user_id');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const { results } = await c.env.DB.prepare(
      'SELECT * FROM api_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(userId, limit, offset).all();

    return c.json({ logs: results || [] });
  } catch (error: any) {
    console.error('Error fetching logs:', error);
    return c.json({ error: 'Failed to fetch logs', details: error.message }, 500);
  }
});

// GET usage summary
logs.get('/summary', async (c) => {
  try {
    const userId = c.get('user_id');

    const totalSpend = await getUserTotalSpend(c.env.DB, userId);
    const budget = await getUserBudget(c.env.DB, userId);

    const totalRequests = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM api_logs WHERE user_id = ?'
    ).bind(userId).first<{ count: number | string }>();

    const last24h = await c.env.DB.prepare(
      'SELECT COUNT(*) as count, COALESCE(SUM(total_cost), 0) as cost FROM api_logs WHERE user_id = ? AND created_at >= datetime("now", "-1 day")'
    ).bind(userId).first<{ count: number | string; cost: number | string }>();

    // Parse values safely
    const parseValue = (val: any): number => {
      if (typeof val === 'string') return parseFloat(val) || 0;
      return val || 0;
    };

    return c.json({
      total_spend: totalSpend,
      budget: budget,
      budget_remaining: budget - totalSpend,
      budget_used_percentage: budget > 0 ? (totalSpend / budget) * 100 : 0,
      total_requests: parseValue(totalRequests?.count),
      last_24h_requests: parseValue(last24h?.count),
      last_24h_cost: parseValue(last24h?.cost)
    });
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    return c.json({
      error: 'Failed to fetch summary',
      details: error.message,
      stack: error.stack
    }, 500);
  }
});

export default logs;
