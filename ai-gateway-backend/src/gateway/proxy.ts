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
    const allRules = await getRoutingRulesByRouter(c.env.DB, router_id);
    if (allRules.length === 0) {
      return c.json({ error: 'No routing rules configured' }, 400);
    }

    // Separate primary and fallback rules
    const primaryRules = allRules.filter(r => r.condition === 'primary');
    const fallbackRules = allRules.filter(r => r.condition === 'on_failure');

    // C. Get model from request body
    const body: any = await c.req.json(); // <-- Changed to 'any' to allow modification
    const modelName = body.model;
    if (!modelName) {
      return c.json({ error: 'Model not specified in request' }, 400);
    }

    // --- START OF FIX ---
    // Check if streaming is requested and force it to false.
    // This ensures the provider always sends a single 'application/json' response,
    // which our current proxyRequest function is built to handle.
    if (body.stream === true) {
      console.log('Client requested streaming. Forcing non-streaming for now.');
      body.stream = false;
    }
    // --- END OF FIX ---

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

    // E. Proxy Request with Failover Logic
    let lastError: Error | null = null;
    let usedProvider: string | null = null;
    let usedProviderId: string | null = null;
    let response: Response | null = null;
    let usage = { prompt_tokens: 0, completion_tokens: 0 };
    let isFailover = false;
    const attemptedProviders: string[] = [];

    // Try primary rules first
    for (const rule of primaryRules) {
      try {
        const provider = await getProviderById(c.env.DB, rule.provider_id);
        if (!provider || !provider.is_enabled) {
          console.log(`Skipping disabled provider: ${rule.provider_id}`);
          continue;
        }

        // Check if model is allowed for this rule
        if (rule.allowed_models) {
          const allowedModels = rule.allowed_models.split(',').map(m => m.trim());
          if (!allowedModels.includes(modelName)) {
            console.log(`Model ${modelName} not allowed for provider ${provider.name}`);
            continue;
          }
        }

        console.log(`Attempting primary provider: ${provider.name}`);
        attemptedProviders.push(provider.name);
        const config = await getProxyConfig(provider, c.req.raw, c.env);
        const result = await proxyRequest(config, body);

        response = result.response;
        usage = result.usage;
        usedProvider = `${provider.name} (${result.url_used})`; // Track which URL worked
        usedProviderId = provider.id;

        console.log(`✓ Success with primary provider: ${provider.name}`);
        break; // Success, exit loop

      } catch (error) {
        lastError = error as Error;
        console.error(`✗ Primary provider failed: ${error}`);
        continue; // Try next primary rule
      }
    }

    // If all primary rules failed, try fallback rules
    if (!response && fallbackRules.length > 0) {
      console.log('All primary providers failed, trying fallback providers...');
      isFailover = true;
      for (const rule of fallbackRules) {
        try {
          const provider = await getProviderById(c.env.DB, rule.provider_id);
          if (!provider || !provider.is_enabled) {
            console.log(`Skipping disabled fallback provider: ${rule.provider_id}`);
            continue;
          }

          // Check if model is allowed for this rule
          if (rule.allowed_models) {
            const allowedModels = rule.allowed_models.split(',').map(m => m.trim());
            if (!allowedModels.includes(modelName)) {
              console.log(`Model ${modelName} not allowed for fallback provider ${provider.name}`);
              continue;
            }
          }

          console.log(`Attempting fallback provider: ${provider.name}`);
          attemptedProviders.push(provider.name);
          const config = await getProxyConfig(provider, c.req.raw, c.env);
          const result = await proxyRequest(config, body);

          response = result.response;
          usage = result.usage;
          usedProvider = `${provider.name} (${result.url_used})`; // Track which URL worked
          usedProviderId = provider.id;

          console.log(`✓ Success with fallback provider: ${provider.name}`);
          break; // Success, exit loop

        } catch (error) {
          lastError = error as Error;
          console.error(`✗ Fallback provider failed: ${error}`);
          continue; // Try next fallback rule
        }
      }
    }

    if (!response || !usedProvider) {
      return c.json({
        error: 'All providers failed',
        attempted_providers: attemptedProviders,
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

    // Add metadata to response
    const responseData = await response.json();
    return c.json({
      ...responseData,
      _gateway_metadata: {
        cost: totalCost,
        provider: usedProvider,
        latency_ms: latency,
        is_failover: isFailover,
        attempted_providers: attemptedProviders
      }
    });

  } catch (error: any) {
    console.error('Gateway error:', error);
    return c.json({ error: 'Internal gateway error', details: error.message }, 500);
  }
}
