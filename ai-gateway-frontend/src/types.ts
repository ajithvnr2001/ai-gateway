export interface User {
  id: string;
  email: string;
  plan: string;
}

export interface Provider {
  id: string;
  name: string;
  provider_type: string;
  base_url?: string;
  base_urls?: string; // JSON string array: ["url1", "url2"]
  is_enabled: boolean;
}

export interface Router {
  id: string;
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
  name: string;
  router_id: string;
  is_active: boolean;
}

export interface ModelCost {
  id: string;
  model_name: string;
  provider: string;
  input_cost_per_mil_tokens: number;
  output_cost_per_mil_tokens: number;
}

export interface ApiLog {
  id: string;
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
