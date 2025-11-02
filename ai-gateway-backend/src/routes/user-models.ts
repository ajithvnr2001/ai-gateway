import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../auth';
import { getModelCost } from '../db/queries';

const userModels = new Hono<{ Bindings: Env }>();

userModels.use('*', authMiddleware);

// GET all user custom models
userModels.get('/', async (c) => {
  const userId = c.get('user_id');
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM user_model_costs WHERE user_id = ?'
  ).bind(userId).all();

  return c.json({ models: results });
});

// GET global model costs (read-only) with search and filter
userModels.get('/global', async (c) => {
  const search = c.req.query('search') || '';
  const provider = c.req.query('provider') || '';
  const freeOnly = c.req.query('free_only') === 'true';

  let query = 'SELECT * FROM model_costs WHERE 1=1';
  const params: any[] = [];

  if (search) {
    query += ' AND model_name LIKE ?';
    params.push(`%${search}%`);
  }

  if (provider) {
    query += ' AND provider = ?';
    params.push(provider);
  }

  if (freeOnly) {
    query += ' AND input_cost_per_mil_tokens = 0 AND output_cost_per_mil_tokens = 0';
  }

  query += ' ORDER BY provider, model_name';

  const { results } = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ models: results });
});

// GET model statistics
userModels.get('/stats', async (c) => {
  const stats = await c.env.DB.prepare(`
    SELECT
      provider,
      COUNT(*) as total_models,
      SUM(CASE WHEN input_cost_per_mil_tokens = 0 AND output_cost_per_mil_tokens = 0 THEN 1 ELSE 0 END) as free_models
    FROM model_costs
    GROUP BY provider
    ORDER BY total_models DESC
  `).all();

  const totalModels = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM model_costs'
  ).first<{ count: number }>();

  const freeModels = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM model_costs WHERE input_cost_per_mil_tokens = 0 AND output_cost_per_mil_tokens = 0'
  ).first<{ count: number }>();

  return c.json({
    total_models: totalModels?.count || 0,
    free_models: freeModels?.count || 0,
    by_provider: stats.results
  });
});

// POST create user custom model
userModels.post('/', async (c) => {
  const userId = c.get('user_id');
  const { provider_id, model_name, input_cost_per_mil_tokens, output_cost_per_mil_tokens } = await c.req.json();

  if (!provider_id || !model_name) {
    return c.json({ error: 'provider_id and model_name are required' }, 400);
  }

  // CRITICAL: Check if model exists in global costs
  const globalModel = await getModelCost(c.env.DB, model_name);
  if (globalModel) {
    return c.json({
      error: 'This model already exists in global pricing. You cannot override global models.'
    }, 400);
  }

  // Verify provider belongs to user
  const provider = await c.env.DB.prepare(
    'SELECT * FROM providers WHERE id = ? AND user_id = ?'
  ).bind(provider_id, userId).first();

  if (!provider) {
    return c.json({ error: 'Provider not found' }, 404);
  }

  const modelId = `umc_${crypto.randomUUID()}`;

  try {
    await c.env.DB.prepare(
      'INSERT INTO user_model_costs (id, user_id, provider_id, model_name, input_cost_per_mil_tokens, output_cost_per_mil_tokens) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      modelId,
      userId,
      provider_id,
      model_name,
      input_cost_per_mil_tokens || 0,
      output_cost_per_mil_tokens || 0
    ).run();

    return c.json({
      id: modelId,
      message: 'Custom model price added successfully'
    }, 201);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      return c.json({ error: 'You have already added pricing for this model' }, 400);
    }
    throw error;
  }
});

// DELETE user custom model
userModels.delete('/:id', async (c) => {
  const userId = c.get('user_id');
  const modelId = c.req.param('id');

  const result = await c.env.DB.prepare(
    'DELETE FROM user_model_costs WHERE id = ? AND user_id = ?'
  ).bind(modelId, userId).run();

  if (result.meta.changes === 0) {
    return c.json({ error: 'Model not found' }, 404);
  }

  return c.json({ message: 'Custom model deleted successfully' });
});

export default userModels;
