-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    budget_usd REAL NOT NULL DEFAULT 1.00
);

-- Providers Table
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    base_url TEXT,
    base_urls TEXT, -- JSON array of URLs for fallback support
    api_key_encrypted TEXT NOT NULL,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Routers Table
CREATE TABLE IF NOT EXISTS routers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Routing Rules Table
CREATE TABLE IF NOT EXISTS routing_rules (
    id TEXT PRIMARY KEY,
    router_id TEXT NOT NULL,
    priority INTEGER NOT NULL,
    condition TEXT NOT NULL DEFAULT 'primary',
    provider_id TEXT NOT NULL,
    allowed_models TEXT,
    FOREIGN KEY (router_id) REFERENCES routers(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
);

-- Gateway Keys Table
CREATE TABLE IF NOT EXISTS gateway_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    router_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (router_id) REFERENCES routers(id) ON DELETE CASCADE
);

-- API Logs Table
CREATE TABLE IF NOT EXISTS api_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    gateway_key_id TEXT NOT NULL,
    provider_used TEXT NOT NULL,
    model_used TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    total_cost REAL NOT NULL,
    is_cached INTEGER NOT NULL DEFAULT 0,
    is_failover INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Model Costs Table (Admin-managed)
CREATE TABLE IF NOT EXISTS model_costs (
    id TEXT PRIMARY KEY,
    model_name TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    input_cost_per_mil_tokens REAL NOT NULL,
    output_cost_per_mil_tokens REAL NOT NULL
);

-- User Model Costs Table (User-managed custom prices)
CREATE TABLE IF NOT EXISTS user_model_costs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    model_name TEXT NOT NULL,
    input_cost_per_mil_tokens REAL NOT NULL DEFAULT 0,
    output_cost_per_mil_tokens REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE,
    UNIQUE(user_id, model_name)
);

-- Missing Models Table (Optional logging)
CREATE TABLE IF NOT EXISTS missing_models (
    id TEXT PRIMARY KEY,
    model_name TEXT NOT NULL UNIQUE,
    request_count INTEGER DEFAULT 1,
    last_seen TEXT DEFAULT (datetime('now'))
);

-- Insert hardcoded user
INSERT OR IGNORE INTO users (id, email, password, plan, budget_usd)
VALUES ('ajithvnr2001', 'ajithvnr2001@example.com', '0000asdf', 'free', 1.00);

-- ============ NATIVE OPENAI MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('mc_1', 'gpt-4o', 'openai', 2.50, 10.00),
    ('mc_2', 'gpt-4o-mini', 'openai', 0.15, 0.60),
    ('mc_3', 'gpt-3.5-turbo', 'openai', 0.50, 1.50),
    ('mc_4', 'gpt-4-turbo', 'openai', 10.00, 30.00);

-- ============ NATIVE GOOGLE GEMINI MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('mc_5', 'gemini-1.5-pro', 'google', 1.25, 5.00),
    ('mc_6', 'gemini-1.5-flash', 'google', 0.075, 0.30);

-- ============ NATIVE ANTHROPIC MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('mc_7', 'claude-3-opus', 'anthropic', 15.00, 75.00),
    ('mc_8', 'claude-3-sonnet', 'anthropic', 3.00, 15.00),
    ('mc_9', 'claude-3-haiku', 'anthropic', 0.25, 1.25);

-- ============ OPENROUTER - OPENAI MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_1', 'openai/gpt-4o', 'openrouter', 2.50, 10.00),
    ('or_2', 'openai/gpt-4o-mini', 'openrouter', 0.15, 0.60),
    ('or_3', 'openai/gpt-4-turbo', 'openrouter', 10.00, 30.00),
    ('or_4', 'openai/gpt-3.5-turbo', 'openrouter', 0.50, 1.50),
    ('or_167', 'openai/gpt-oss-20b:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - ANTHROPIC MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_5', 'anthropic/claude-3.5-sonnet', 'openrouter', 3.00, 15.00),
    ('or_6', 'anthropic/claude-3-opus', 'openrouter', 15.00, 75.00),
    ('or_7', 'anthropic/claude-3-haiku', 'openrouter', 0.25, 1.25),
    ('or_8', 'anthropic/claude-3.5-haiku', 'openrouter', 1.00, 5.00);

-- ============ OPENROUTER - GOOGLE MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_9', 'google/gemini-pro-1.5', 'openrouter', 1.25, 5.00),
    ('or_10', 'google/gemini-flash-1.5', 'openrouter', 0.075, 0.30),
    ('or_11', 'google/gemini-2.0-flash-exp', 'openrouter', 0.00, 0.00),
    ('or_179', 'google/gemma-3n-e2b-it:free', 'openrouter', 0.00, 0.00),
    ('or_180', 'google/gemma-3n-e4b-it:free', 'openrouter', 0.00, 0.00),
    ('or_181', 'google/gemma-3-4b-it:free', 'openrouter', 0.00, 0.00),
    ('or_182', 'google/gemma-3-12b-it:free', 'openrouter', 0.00, 0.00),
    ('or_183', 'google/gemma-3-27b-it:free', 'openrouter', 0.00, 0.00),
    ('or_28', 'google/gemma-2-9b-it:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - META LLAMA MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_12', 'meta-llama/llama-3.1-405b-instruct', 'openrouter', 2.70, 2.70),
    ('or_13', 'meta-llama/llama-3.1-70b-instruct', 'openrouter', 0.52, 0.75),
    ('or_14', 'meta-llama/llama-3.1-8b-instruct', 'openrouter', 0.06, 0.06),
    ('or_15', 'meta-llama/llama-3-8b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_190', 'meta-llama/llama-3.3-8b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_191', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_192', 'meta-llama/llama-3.2-3b-instruct:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - MISTRAL MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_16', 'mistralai/mistral-large', 'openrouter', 2.00, 6.00),
    ('or_17', 'mistralai/mistral-medium', 'openrouter', 2.70, 8.10),
    ('or_18', 'mistralai/mistral-small', 'openrouter', 0.20, 0.60),
    ('or_19', 'mistralai/mistral-7b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_186', 'mistralai/mistral-small-3.1-24b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_187', 'mistralai/mistral-small-3.2-24b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_188', 'mistralai/mistral-small-24b-instruct-2501:free', 'openrouter', 0.00, 0.00),
    ('or_189', 'mistralai/mistral-nemo:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - DEEPSEEK MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_20', 'deepseek/deepseek-chat', 'openrouter', 0.14, 0.28),
    ('or_21', 'deepseek/deepseek-coder', 'openrouter', 0.14, 0.28),
    ('or_163', 'deepseek/deepseek-chat-v3.1:free', 'openrouter', 0.00, 0.00),
    ('or_164', 'deepseek/deepseek-r1-0528:free', 'openrouter', 0.00, 0.00),
    ('or_165', 'deepseek/deepseek-r1-0528-qwen3-8b:free', 'openrouter', 0.00, 0.00),
    ('or_166', 'deepseek/deepseek-r1-distill-llama-70b:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - QWEN MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_22', 'qwen/qwen-2.5-72b-instruct', 'openrouter', 0.40, 0.40),
    ('or_23', 'qwen/qwen-2-7b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_169', 'qwen/qwen3-coder:free', 'openrouter', 0.00, 0.00),
    ('or_170', 'qwen/qwen3-4b:free', 'openrouter', 0.00, 0.00),
    ('or_171', 'qwen/qwen3-14b:free', 'openrouter', 0.00, 0.00),
    ('or_172', 'qwen/qwen3-30b-a3b:free', 'openrouter', 0.00, 0.00),
    ('or_173', 'qwen/qwen3-235b-a22b:free', 'openrouter', 0.00, 0.00),
    ('or_174', 'qwen/qwen2.5-vl-32b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_175', 'qwen/qwen-2.5-coder-32b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_176', 'qwen/qwen-2.5-72b-instruct:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - MICROSOFT MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_24', 'microsoft/phi-3-medium-128k-instruct', 'openrouter', 0.10, 0.10),
    ('or_193', 'microsoft/mai-ds-r1:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - COHERE MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_25', 'cohere/command-r-plus', 'openrouter', 2.50, 10.00),
    ('or_26', 'cohere/command-r', 'openrouter', 0.15, 0.60);

-- ============ OPENROUTER - NVIDIA MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_29', 'nvidia/llama-3.1-nemotron-70b-instruct:free', 'openrouter', 0.00, 0.00),
    ('or_158', 'nvidia/nemotron-nano-12b-v2-vl:free', 'openrouter', 0.00, 0.00),
    ('or_159', 'nvidia/nemotron-nano-9b-v2:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - NOUSRESEARCH MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_27', 'nousresearch/hermes-3-llama-3.1-405b:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - MINIMAX MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_160', 'minimax/minimax-m2:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - ALIBABA/TONGYI MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_161', 'alibaba/tongyi-deepresearch-30b-a3b:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - MEITUAN MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_162', 'meituan/longcat-flash-chat:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - Z-AI (GLM) MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_168', 'z-ai/glm-4.5-air:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - MOONSHOT AI MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_177', 'moonshotai/kimi-k2:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - COGNITIVE COMPUTATIONS MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_178', 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - TNG TECH CHIMERA MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_184', 'tngtech/deepseek-r1t-chimera:free', 'openrouter', 0.00, 0.00),
    ('or_185', 'tngtech/deepseek-r1t2-chimera:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - SHISA AI MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_194', 'shisa-ai/shisa-v2-llama3.3-70b:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - ARLI AI MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_195', 'arliai/qwq-32b-arliai-rpr-v1:free', 'openrouter', 0.00, 0.00);

-- ============ OPENROUTER - AGENTICA ORG MODELS ============
INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)
VALUES
    ('or_196', 'agentica-org/deepcoder-14b-preview:free', 'openrouter', 0.00, 0.00);
