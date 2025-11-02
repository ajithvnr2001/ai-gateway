import { Context } from 'hono';
import { Env } from '../types';
import { getGatewayKeyInfo, getRoutingRulesByRouter, getProviderById, getUserBudget, getUserTotalSpend } from '../db/queries';
import { findModelPrice, calculateCost, logMissingModel } from './costing';
import { getProxyConfig, proxyRequest } from './providers';

export async function handleGatewayRequest(c: Context<{ Bindings: Env }>) {
  const startTime = Date.now();
  const authHeader = c.req.header('Authorization');

  // A. Authenticate
  if (!authHeader || !authHeader.startsWith('Bearer gw_')) {
    return c.json({ error: 'Invalid or missing gateway key' }, 401);
  }

  const gatewayKey = authHeader.substring(7);

  const keyInfo = await getGatewayKeyInfo(c.env.DB, gatewayKey);
  if (!keyInfo) {
    return c.json({ error: 'Invalid or inactive gateway key' }, 401);
  }

  const { user_id, router_id } = keyInfo;

  try {
    // B. Fetch routing rules
    const rules = await getRoutingRulesByRouter(c.env.DB, router_id);
    if (rules.length === 0) {
      return c.json({ error: 'No routing rules configured' }, 400);
    }

    // C. Get model from request body
    const body = await c.req.json();
    const modelName = body.model;

    if (!modelName) {
      return c.json({ error: 'Model not specified in request' }, 400);
    }

    // D. Costing & Budget Pre-Flight Check
    const costInfo = await findModelPrice(c.env.DB, user_id, modelName);

    if (!costInfo) {
      await logMissingModel(c.env.DB, modelName);
      return c.json({
        error: `Model '${modelName}' is not configured. Please add pricing for this model in your dashboard.`
      }, 400);
    }

    // Check budget
    const budget = await getUserBudget(c.env.DB, user_id);
    const currentSpend = await getUserTotalSpend(c.env.DB, user_id);

    if (currentSpend >= budget) {
      return c.json({
        error: 'Budget exceeded',
        current_spend: currentSpend,
        budget: budget
      }, 429);
    }

    // E. Proxy Request (with simple failover)
    let lastError: Error | null = null;
    let usedProvider: string | null = null;
    let response: Response | null = null;
    let usage = { prompt_tokens: 0, completion_tokens: 0 };
    let isFailover = false;

    for (const rule of rules) {
      try {
        const provider = await getProviderById(c.env.DB, rule.provider_id);
        if (!provider || !provider.is_enabled) {
          continue;
        }

        const config = getProxyConfig(provider, c.req.raw);
        const result = await proxyRequest(config, body);

        response = result.response;
        usage = result.usage;
        usedProvider = provider.name;
        break;
      } catch (error) {
        lastError = error as Error;
        isFailover = true;
        continue; // Try next rule
      }
    }

    if (!response || !usedProvider) {
      return c.json({
        error: 'All providers failed',
        last_error: lastError?.message
      }, 502);
    }

    // F. Calculate cost
    const totalCost = calculateCost(usage.prompt_tokens, usage.completion_tokens, costInfo);
    const latency = Date.now() - startTime;

    // G. Async logging
    c.executionCtx.waitUntil(
      c.env.DB.prepare(`
        INSERT INTO api_logs (
          id, user_id, gateway_key_id, provider_used, model_used,
          status_code, latency_ms, prompt_tokens, completion_tokens,
          total_cost, is_cached, is_failover
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).bind(
        `log_${crypto.randomUUID()}`,
        user_id,
        gatewayKey,
        usedProvider,
        modelName,
        response.status,
        latency,
        usage.prompt_tokens,
        usage.completion_tokens,
        totalCost,
        isFailover ? 1 : 0
      ).run()
    );

    // Add cost header to response
    const responseData = await response.json();
    return c.json({
      ...responseData,
      _gateway_metadata: {
        cost: totalCost,
        provider: usedProvider,
        latency_ms: latency
      }
    });

  } catch (error: any) {
    console.error('Gateway error:', error);
    return c.json({ error: 'Internal gateway error', details: error.message }, 500);
  }
}
