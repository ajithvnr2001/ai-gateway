export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
  ENCRYPTION_KEY: string; // Master key for encrypting API keys
}

export interface User {
  id: string;
  email: string;
  password: string;
  plan: string;
  budget_usd: number;
}

export interface Provider {
  id: string;
  user_id: string;
  name: string;
  provider_type: string;
  base_url?: string; // Keep for backward compatibility
  base_urls?: string; // JSON string array: ["url1", "url2"]
  api_key_encrypted: string;
  is_enabled: boolean;
}

export interface Router {
  id: string;
  user_id: string;
  name: string;
}

export interface RoutingRule {
  id: string;
  router_id: string;
  priority: number;
  condition: string;
  provider_id: string;
  allowed_models?: string;
}

export interface GatewayKey {
  id: string;
  user_id: string;
  router_id: string;
  name: string;
  is_active: boolean;
}

export interface ApiLog {
  id: string;
  user_id: string;
  gateway_key_id: string;
  provider_used: string;
  model_used: string;
  status_code: number;
  latency_ms: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_cost: number;
  is_cached: boolean;
  is_failover: boolean;
  created_at: string;
}

export interface ModelCost {
  id: string;
  model_name: string;
  provider: string;
  input_cost_per_mil_tokens: number;
  output_cost_per_mil_tokens: number;
}

export interface UserModelCost {
  id: string;
  user_id: string;
  provider_id: string;
  model_name: string;
  input_cost_per_mil_tokens: number;
  output_cost_per_mil_tokens: number;
}
