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

-- Insert all models

INSERT OR IGNORE INTO model_costs (id, model_name, provider, input_cost_per_mil_tokens, output_cost_per_mil_tokens)

VALUES

    -- ============ NATIVE MODELS ============

    ('mc_1', 'gpt-4o', 'openai', 2.50, 10.00),

    ('mc_2', 'gpt-4o-mini', 'openai', 0.15, 0.60),

    ('mc_3', 'gpt-3.5-turbo', 'openai', 0.50, 1.50),

    ('mc_4', 'gpt-4-turbo', 'openai', 10.00, 30.00),

    ('mc_5', 'gemini-1.5-pro', 'google', 1.25, 5.00),

    ('mc_6', 'gemini-1.5-flash', 'google', 0.075, 0.30),

    ('mc_7', 'claude-3-opus', 'anthropic', 15.00, 75.00),

    ('mc_8', 'claude-3-sonnet', 'anthropic', 3.00, 15.00),

    ('mc_9', 'claude-3-haiku', 'anthropic', 0.25, 1.25),

    -- ============ EXISTING FREE MODELS ============

    ('or_158', 'nvidia/nemotron-nano-12b-v2-vl:free', 'openrouter', 0.00, 0.00),

    ('or_159', 'nvidia/nemotron-nano-9b-v2:free', 'openrouter', 0.00, 0.00),

    ('or_160', 'minimax/minimax-m2:free', 'openrouter', 0.00, 0.00),

    ('or_161', 'alibaba/tongyi-deepresearch-30b-a3b:free', 'openrouter', 0.00, 0.00),

    ('or_162', 'meituan/longcat-flash-chat:free', 'openrouter', 0.00, 0.00),

    ('or_163', 'deepseek/deepseek-chat-v3.1:free', 'openrouter', 0.00, 0.00),

    ('or_164', 'deepseek/deepseek-r1-0528:free', 'openrouter', 0.00, 0.00),

    ('or_165', 'deepseek/deepseek-r1-0528-qwen3-8b:free', 'openrouter', 0.00, 0.00),

    ('or_166', 'deepseek/deepseek-r1-distill-llama-70b:free', 'openrouter', 0.00, 0.00),

    ('or_168', 'z-ai/glm-4.5-air:free', 'openrouter', 0.00, 0.00),

    ('or_169', 'qwen/qwen3-coder:free', 'openrouter', 0.00, 0.00),

    ('or_170', 'qwen/qwen3-4b:free', 'openrouter', 0.00, 0.00),

    ('or_171', 'qwen/qwen3-14b:free', 'openrouter', 0.00, 0.00),

    ('or_172', 'qwen/qwen3-30b-a3b:free', 'openrouter', 0.00, 0.00),

    ('or_173', 'qwen/qwen3-235b-a22b:free', 'openrouter', 0.00, 0.00),

    ('or_174', 'qwen/qwen2.5-vl-32b-instruct:free', 'openrouter', 0.00, 0.00),

    ('or_175', 'qwen/qwen-2.5-coder-32b-instruct:free', 'openrouter', 0.00, 0.00),

    ('or_176', 'qwen/qwen-2.5-72b-instruct:free', 'openrouter', 0.00, 0.00),

    ('or_177', 'moonshotai/kimi-k2:free', 'openrouter', 0.00, 0.00),

    ('or_178', 'cognitivecomputations/dolphin-mistral-24b-venice-edition:free', 'openrouter', 0.00, 0.00),

    ('or_179', 'google/gemma-3n-e2b-it:free', 'openrouter', 0.00, 0.00),

    ('or_180', 'google/gemma-3n-e4b-it:free', 'openrouter', 0.00, 0.00),

    ('or_181', 'google/gemma-3-4b-it:free', 'openrouter', 0.00, 0.00),

    ('or_182', 'google/gemma-3-12b-it:free', 'openrouter', 0.00, 0.00),

    ('or_183', 'google/gemma-3-27b-it:free', 'openrouter', 0.00, 0.00),

    ('or_184', 'tngtech/deepseek-r1t-chimera:free', 'openrouter', 0.00, 0.00),

    ('or_185', 'tngtech/deepseek-r1t2-chimera:free', 'openrouter', 0.00, 0.00),

    ('or_186', 'mistralai/mistral-small-3.1-24b-instruct:free', 'openrouter', 0.00, 0.00),

    ('or_187', 'mistralai/mistral-small-3.2-24b-instruct:free', 'openrouter', 0.00, 0.00),

    ('or_188', 'mistralai/mistral-small-24b-instruct-2501:free', 'openrouter', 0.00, 0.00),

    ('or_189', 'mistralai/mistral-nemo:free', 'openrouter', 0.00, 0.00),

    ('or_190', 'meta-llama/llama-3.3-8b-instruct:free', 'openrouter', 0.00, 0.00),

    ('or_191', 'meta-llama/llama-3.3-70b-instruct:free', 'openrouter', 0.00, 0.00),

    ('or_192', 'meta-llama/llama-3.2-3b-instruct:free', 'openrouter', 0.00, 0.00),

    ('or_193', 'microsoft/mai-ds-r1:free', 'openrouter', 0.00, 0.00),

    ('or_194', 'shisa-ai/shisa-v2-llama3.3-70b:free', 'openrouter', 0.00, 0.00),

    ('or_195', 'arliai/qwq-32b-arliai-rpr-v1:free', 'openrouter', 0.00, 0.00),

    ('or_196', 'agentica-org/deepcoder-14b-preview:free', 'openrouter', 0.00, 0.00),

    -- ============ NEW OPENAI MODELS (via OpenRouter) ============

    ('or_197', 'openai/gpt-oss-20b:free', 'openrouter', 0.00, 0.00),

    ('or_198', 'openai/gpt-oss-20b', 'openrouter', 0.03, 0.14),

    ('or_199', 'openai/gpt-oss-120b:exacto', 'openrouter', 0.05, 0.24),

    ('or_200', 'openai/gpt-oss-120b', 'openrouter', 0.04, 0.40),

    ('or_201', 'openai/gpt-oss-safeguard-20b', 'openrouter', 0.075, 0.30),

    ('or_202', 'openai/gpt-5', 'openrouter', 1.25, 10.00),

    ('or_203', 'openai/gpt-5-nano', 'openrouter', 0.05, 0.40),

    ('or_204', 'openai/gpt-5-mini', 'openrouter', 0.25, 2.00),

    ('or_205', 'openai/gpt-5-chat', 'openrouter', 1.25, 10.00),

    ('or_206', 'openai/gpt-5-codex', 'openrouter', 1.25, 10.00),

    ('or_207', 'openai/gpt-5-image-mini', 'openrouter', 2.50, 2.00),

    ('or_208', 'openai/gpt-5-image', 'openrouter', 10.00, 10.00),

    ('or_209', 'openai/gpt-5-pro', 'openrouter', 15.00, 120.00),

    ('or_210', 'openai/gpt-4.5-preview', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_211', 'openai/gpt-4.1-nano', 'openrouter', 0.10, 0.40),

    ('or_212', 'openai/gpt-4.1-mini', 'openrouter', 0.40, 1.60),

    ('or_213', 'openai/gpt-4.1', 'openrouter', 2.00, 8.00),

    ('or_214', 'openai/gpt-4o-mini', 'openrouter', 0.15, 0.60),

    ('or_215', 'openai/gpt-4o-mini-2024-07-18', 'openrouter', 0.15, 0.60),

    ('or_216', 'openai/gpt-4o-mini-search-preview', 'openrouter', 0.15, 0.60),

    ('or_217', 'openai/gpt-4o', 'openrouter', 2.50, 10.00),

    ('or_218', 'openai/gpt-4o-2024-05-13', 'openrouter', 5.00, 15.00),

    ('or_219', 'openai/gpt-4o-2024-08-06', 'openrouter', 2.50, 10.00),

    ('or_220', 'openai/gpt-4o-2024-11-20', 'openrouter', 2.50, 10.00),

    ('or_221', 'openai/gpt-4o:extended', 'openrouter', 6.00, 18.00),

    ('or_222', 'openai/gpt-4o-audio-preview', 'openrouter', 2.50, 10.00),

    ('or_223', 'openai/gpt-4o-search-preview', 'openrouter', 2.50, 10.00),

    ('or_224', 'openai/chatgpt-4o-latest', 'openrouter', 5.00, 15.00),

    ('or_225', 'openai/gpt-4', 'openrouter', 30.00, 60.00),

    ('or_226', 'openai/gpt-4-0314', 'openrouter', 30.00, 60.00),

    ('or_227', 'openai/gpt-4-32k', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_228', 'openai/gpt-4-32k-0314', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_229', 'openai/gpt-4-turbo', 'openrouter', 10.00, 30.00),

    ('or_230', 'openai/gpt-4-turbo-preview', 'openrouter', 10.00, 30.00),

    ('or_231', 'openai/gpt-4-1106-preview', 'openrouter', 10.00, 30.00),

    ('or_232', 'openai/gpt-4-vision-preview', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_233', 'openai/gpt-3.5-turbo', 'openrouter', 0.50, 1.50),

    ('or_234', 'openai/gpt-3.5-turbo-0301', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_235', 'openai/gpt-3.5-turbo-0613', 'openrouter', 1.00, 2.00),

    ('or_236', 'openai/gpt-3.5-turbo-1106', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_237', 'openai/gpt-3.5-turbo-0125', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_238', 'openai/gpt-3.5-turbo-16k', 'openrouter', 3.00, 4.00),

    ('or_239', 'openai/gpt-3.5-turbo-instruct', 'openrouter', 1.50, 2.00),

    ('or_240', 'openai/o1', 'openrouter', 15.00, 60.00),

    ('or_241', 'openai/o1-preview', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_242', 'openai/o1-preview-2024-09-12', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_243', 'openai/o1-mini', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_244', 'openai/o1-mini-2024-09-12', 'openrouter', 0.00, 0.00), -- Pricing NULL

    ('or_245', 'openai/o1-pro', 'openrouter', 150.00, 600.00),

    ('or_246', 'openai/o3', 'openrouter', 2.00, 8.00),

    ('or_247', 'openai/o3-mini', 'openrouter', 1.10, 4.40),

    ('or_248', 'openai/o3-mini-high', 'openrouter', 1.10, 4.40),

    ('or_249', 'openai/o3-deep-research', 'openrouter', 10.00, 40.00),

    ('or_250', 'openai/o3-pro', 'openrouter', 20.00, 80.00),

    ('or_251', 'openai/o4-mini', 'openrouter', 1.10, 4.40),

    ('or_252', 'openai/o4-mini-deep-research', 'openrouter', 2.00, 8.00),

    ('or_253', 'openai/codex-mini', 'openrouter', 1.50, 6.00);
