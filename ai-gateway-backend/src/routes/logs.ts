import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../auth';
import { getUserTotalSpend, getUserBudget } from '../db/queries';

const logs = new Hono<{ Bindings: Env }>();

logs.use('*', authMiddleware);

// GET all logs with pagination and filters
logs.get('/', async (c) => {
  try {
    const userId = c.get('user_id');
    const limit = Math.min(parseInt(c.req.query('limit') || '100'), 500);
    const offset = parseInt(c.req.query('offset') || '0');
    const provider = c.req.query('provider') || '';
    const model = c.req.query('model') || '';
    const status = c.req.query('status') || '';

    let query = 'SELECT * FROM api_logs WHERE user_id = ?';
    const params: any[] = [userId];

    if (provider) {
      query += ' AND provider_used = ?';
      params.push(provider);
    }

    if (model) {
      query += ' AND model_used LIKE ?';
      params.push(`%${model}%`);
    }

    if (status) {
      if (status === 'success') {
        query += ' AND status_code >= 200 AND status_code < 300';
      } else if (status === 'error') {
        query += ' AND status_code >= 400';
      }
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM api_logs WHERE user_id = ?';
    const countParams: any[] = [userId];

    if (provider) {
      countQuery += ' AND provider_used = ?';
      countParams.push(provider);
    }

    if (model) {
      countQuery += ' AND model_used LIKE ?';
      countParams.push(`%${model}%`);
    }

    if (status) {
      if (status === 'success') {
        countQuery += ' AND status_code >= 200 AND status_code < 300';
      } else if (status === 'error') {
        countQuery += ' AND status_code >= 400';
      }
    }

    const totalCount = await c.env.DB.prepare(countQuery)
      .bind(...countParams)
      .first<{ count: number | string }>();

    const parseValue = (val: any): number => {
      if (typeof val === 'string') return parseInt(val) || 0;
      return val || 0;
    };

    return c.json({
      logs: results || [],
      pagination: {
        total: parseValue(totalCount?.count),
        limit,
        offset,
        has_more: parseValue(totalCount?.count) > offset + limit
      }
    });
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

    const last7days = await c.env.DB.prepare(
      'SELECT COUNT(*) as count, COALESCE(SUM(total_cost), 0) as cost FROM api_logs WHERE user_id = ? AND created_at >= datetime("now", "-7 days")'
    ).bind(userId).first<{ count: number | string; cost: number | string }>();

    const successRate = await c.env.DB.prepare(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) as success FROM api_logs WHERE user_id = ?'
    ).bind(userId).first<{ total: number | string; success: number | string }>();

    const avgLatency = await c.env.DB.prepare(
      'SELECT AVG(latency_ms) as avg_latency FROM api_logs WHERE user_id = ?'
    ).bind(userId).first<{ avg_latency: number | string }>();

    const parseValue = (val: any): number => {
      if (typeof val === 'string') return parseFloat(val) || 0;
      return val || 0;
    };

    const total = parseValue(successRate?.total);
    const success = parseValue(successRate?.success);

    return c.json({
      total_spend: totalSpend,
      budget: budget,
      budget_remaining: budget - totalSpend,
      budget_used_percentage: budget > 0 ? (totalSpend / budget) * 100 : 0,
      total_requests: parseValue(totalRequests?.count),
      last_24h_requests: parseValue(last24h?.count),
      last_24h_cost: parseValue(last24h?.cost),
      last_7d_requests: parseValue(last7days?.count),
      last_7d_cost: parseValue(last7days?.cost),
      success_rate: total > 0 ? (success / total) * 100 : 0,
      avg_latency_ms: parseValue(avgLatency?.avg_latency)
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

// GET logs by provider
logs.get('/by-provider', async (c) => {
  try {
    const userId = c.get('user_id');

    const { results } = await c.env.DB.prepare(`
      SELECT
        provider_used,
        COUNT(*) as request_count,
        COALESCE(SUM(total_cost), 0) as total_cost,
        AVG(latency_ms) as avg_latency
      FROM api_logs
      WHERE user_id = ?
      GROUP BY provider_used
      ORDER BY request_count DESC
    `).bind(userId).all();

    return c.json({ providers: results || [] });
  } catch (error: any) {
    console.error('Error fetching provider stats:', error);
    return c.json({ error: 'Failed to fetch provider stats', details: error.message }, 500);
  }
});

// GET logs by model
logs.get('/by-model', async (c) => {
  try {
    const userId = c.get('user_id');

    const { results } = await c.env.DB.prepare(`
      SELECT
        model_used,
        COUNT(*) as request_count,
        COALESCE(SUM(total_cost), 0) as total_cost,
        AVG(latency_ms) as avg_latency,
        COALESCE(SUM(prompt_tokens), 0) as total_prompt_tokens,
        COALESCE(SUM(completion_tokens), 0) as total_completion_tokens
      FROM api_logs
      WHERE user_id = ?
      GROUP BY model_used
      ORDER BY request_count DESC
      LIMIT 20
    `).bind(userId).all();

    return c.json({ models: results || [] });
  } catch (error: any) {
    console.error('Error fetching model stats:', error);
    return c.json({ error: 'Failed to fetch model stats', details: error.message }, 500);
  }
});

export default logs;
