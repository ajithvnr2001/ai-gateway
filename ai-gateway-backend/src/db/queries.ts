import { Env, Provider, Router, RoutingRule, GatewayKey, ModelCost, UserModelCost } from '../types';

export async function getUserBudget(db: D1Database, userId: string): Promise<number> {
  const result = await db.prepare('SELECT budget_usd FROM users WHERE id = ?')
    .bind(userId)
    .first<{ budget_usd: number }>();
  return result?.budget_usd || 0;
}

export async function getUserTotalSpend(db: D1Database, userId: string): Promise<number> {
  const result = await db.prepare('SELECT COALESCE(SUM(total_cost), 0) as total FROM api_logs WHERE user_id = ?')
    .bind(userId)
    .first<{ total: number | string }>();

  // Handle both number and string returns from D1
  const total = result?.total;
  if (typeof total === 'string') {
    return parseFloat(total) || 0;
  }
  return total || 0;
}

export async function getModelCost(db: D1Database, modelName: string): Promise<ModelCost | null> {
  return await db.prepare('SELECT * FROM model_costs WHERE model_name = ?')
    .bind(modelName)
    .first<ModelCost>();
}

export async function getUserModelCost(db: D1Database, userId: string, modelName: string): Promise<UserModelCost | null> {
  return await db.prepare('SELECT * FROM user_model_costs WHERE user_id = ? AND model_name = ?')
    .bind(userId, modelName)
    .first<UserModelCost>();
}

export async function getProviderById(db: D1Database, providerId: string): Promise<Provider | null> {
  return await db.prepare('SELECT * FROM providers WHERE id = ?')
    .bind(providerId)
    .first<Provider>();
}

export async function getRoutingRulesByRouter(db: D1Database, routerId: string): Promise<RoutingRule[]> {
  const { results } = await db.prepare('SELECT * FROM routing_rules WHERE router_id = ? ORDER BY priority ASC')
    .bind(routerId)
    .all<RoutingRule>();
  return results || [];
}

export async function getGatewayKeyInfo(db: D1Database, keyId: string): Promise<{ user_id: string; router_id: string } | null> {
  return await db.prepare('SELECT user_id, router_id FROM gateway_keys WHERE id = ? AND is_active = 1')
    .bind(keyId)
    .first<{ user_id: string; router_id: string }>();
}
