import { Env, ModelCost, UserModelCost } from '../types';
import { getModelCost, getUserModelCost } from '../db/queries';

export interface CostInfo {
  input_cost_per_mil_tokens: number;
  output_cost_per_mil_tokens: number;
  source: 'global' | 'user';
}

export async function findModelPrice(
  db: D1Database,
  userId: string,
  modelName: string
): Promise<CostInfo | null> {
  // First check global costs
  const globalCost = await getModelCost(db, modelName);
  if (globalCost) {
    return {
      input_cost_per_mil_tokens: globalCost.input_cost_per_mil_tokens,
      output_cost_per_mil_tokens: globalCost.output_cost_per_mil_tokens,
      source: 'global'
    };
  }

  // Then check user costs
  const userCost = await getUserModelCost(db, userId, modelName);
  if (userCost) {
    return {
      input_cost_per_mil_tokens: userCost.input_cost_per_mil_tokens,
      output_cost_per_mil_tokens: userCost.output_cost_per_mil_tokens,
      source: 'user'
    };
  }

  return null;
}

export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  costInfo: CostInfo
): number {
  const inputCost = (promptTokens / 1000000) * costInfo.input_cost_per_mil_tokens;
  const outputCost = (completionTokens / 1000000) * costInfo.output_cost_per_mil_tokens;
  return inputCost + outputCost;
}

export async function logMissingModel(db: D1Database, modelName: string) {
  try {
    await db.prepare(`
      INSERT INTO missing_models (id, model_name, request_count, last_seen)
      VALUES (?, ?, 1, datetime('now'))
      ON CONFLICT(model_name) DO UPDATE SET
        request_count = request_count + 1,
        last_seen = datetime('now')
    `).bind(`mm_${crypto.randomUUID()}`, modelName).run();
  } catch (error) {
    console.error('Failed to log missing model:', error);
  }
}
