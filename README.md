# 🤖 AI Gateway - Intelligent Multi-Provider AI Routing System

A production-ready AI gateway that intelligently routes requests across multiple AI providers, tracks costs, manages budgets, and provides a seamless OpenAI-compatible API experience.

![AI Gateway](https://img.shields.io/badge/Status-Production--Ready-green?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![Models](https://img.shields.io/badge/Models-196%2B-orange?style=for-the-badge)

## 🌟 Features

### 🚀 Core Functionality
- **Multi-Provider Support**: OpenAI, Anthropic, Google, OpenRouter (196+ models)
- **Intelligent Routing**: Priority-based routing with automatic failover
- **Cost Tracking**: Real-time cost calculation and budget management
- **OpenAI Compatibility**: Drop-in replacement for OpenAI SDK
- **Secure Key Management**: Gateway keys with router associations
- **Usage Analytics**: Comprehensive request logging and metrics

### 🎨 User Interface
- **Modern Dashboard**: Clean, responsive interface built with Next.js
- **Real-time Statistics**: Live cost tracking and usage metrics
- **Model Browser**: Search and filter through 196+ AI models
- **Router Management**: Visual routing rule configuration
- **Provider Management**: Easy provider setup and configuration

### 🔧 Technical Features
- **Cloudflare Workers**: Global edge deployment with low latency
- **D1 Database**: Serverless SQLite for data persistence
- **KV Storage**: High-performance caching layer
- **TypeScript**: Full type safety across the entire codebase
- **RESTful API**: Well-documented API endpoints

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/ajithvnr2001/ai-gateway.git
   cd ai-gateway
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd ai-gateway-backend
   npm install

   # Frontend
   cd ../ai-gateway-frontend
   npm install --legacy-peer-deps
   ```

3. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd ai-gateway-backend
   npm run dev

   # Terminal 2 - Frontend
   cd ai-gateway-frontend
   npm run dev
   ```

4. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8787`

5. **Demo Credentials**
   - Username: `ajithvnr2001`
   - Password: `0000asdf`

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Providers     │
│   (Next.js)     │◄──►│   (Workers)     │◄──►│   (AI APIs)     │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Auth          │    │ • OpenAI        │
│ • Router Mgmt   │    │ • Routing       │    │ • Anthropic     │
│ • Key Mgmt      │    │ • Cost Tracking │    │ • Google        │
│ • Analytics     │    │ • API Gateway   │    │ • OpenRouter    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Database      │
                    │   (D1 + KV)     │
                    │                 │
                    │ • User Data     │
                    │ • Providers     │
                    │ • Routers       │
                    │ • API Logs      │
                    │ • Model Costs   │
                    └─────────────────┘
```

### Components

- **Frontend**: Next.js application with TypeScript and Tailwind CSS
- **Backend**: Cloudflare Workers with Hono framework
- **Database**: Cloudflare D1 (SQLite) + KV for caching
- **Authentication**: Simple token-based auth (production-ready for enhancement)
- **Routing Engine**: Priority-based routing with failover logic

## 📚 API Documentation

### Authentication
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "ajithvnr2001",
  "password": "0000asdf"
}
```

### Gateway API (OpenAI Compatible)
```bash
POST /v1/chat/completions
Authorization: Bearer gw_your_gateway_key
Content-Type: application/json

{
  "model": "gpt-4o-mini",
  "messages": [
    {"role": "user", "content": "Hello, world!"}
  ]
}
```

### Management APIs

#### Providers
- `GET /api/providers` - List providers
- `POST /api/providers` - Create provider
- `PUT /api/providers/:id` - Update provider
- `DELETE /api/providers/:id` - Delete provider

#### Routers
- `GET /api/routers` - List routers
- `GET /api/routers/:id` - Get router details
- `POST /api/routers` - Create router
- `POST /api/routers/:id/rules` - Add routing rule
- `DELETE /api/routers/:id` - Delete router
- `DELETE /api/routers/:id/rules/:ruleId` - Delete rule

#### Gateway Keys
- `GET /api/keys` - List keys
- `POST /api/keys` - Create key
- `PUT /api/keys/:id` - Toggle key status
- `DELETE /api/keys/:id` - Delete key

#### Models & Analytics
- `GET /api/user-models/global` - Browse models
- `GET /api/user-models/stats` - Model statistics
- `GET /api/logs` - API logs
- `GET /api/logs/summary` - Usage summary

## 🚀 Deployment

### Production URLs
- **Frontend**: `https://fc8e235e.ai-gateway-frontend.pages.dev`
- **Backend**: `https://ai-gateway-worker.ltimindtree.workers.dev`

### Automated Deployment

See `deploymentsteps.md` for complete deployment instructions including:
- Cloudflare Workers setup
- D1 Database configuration
- KV Namespace creation
- Cloudflare Pages deployment
- Error troubleshooting guide

### Quick Deploy Commands

```bash
# Backend deployment
cd ai-gateway-backend
npm run db:migrate  # Local migration
wrangler d1 execute ai_gateway_db --file=./src/db/schema.sql --remote  # Remote migration
npm run deploy

# Frontend deployment
cd ../ai-gateway-frontend
npm run build
wrangler pages deploy out --project-name ai-gateway-frontend
```

## ⚙️ Configuration

### Environment Variables

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://ai-gateway-worker.ltimindtree.workers.dev
```

**Backend (wrangler.toml):**
```toml
name = "ai-gateway-worker"
compatibility_date = "2024-11-01"

[[d1_databases]]
binding = "DB"
database_name = "ai_gateway_db"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"
```

### Database Schema

The system includes 196+ AI models across 12 providers:
- **Native Providers**: OpenAI, Anthropic, Google Gemini
- **OpenRouter Models**: 150+ free models + paid options
- **Automatic Cost Tracking**: Real-time pricing updates
- **Model Categories**: Chat, Code, Vision, Multimodal

## 💻 Usage Examples

### Python Client
```python
from openai import OpenAI

client = OpenAI(
    api_key="gw_your_gateway_key_here",
    base_url="https://ai-gateway-worker.ltimindtree.workers.dev/v1"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

### cURL Request
```bash
curl -X POST "https://ai-gateway-worker.ltimindtree.workers.dev/v1/chat/completions" \
  -H "Authorization: Bearer gw_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3-haiku",
    "messages": [{"role": "user", "content": "Explain quantum computing"}]
  }'
```

### JavaScript/Node.js
```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'gw_your_gateway_key_here',
  baseURL: 'https://ai-gateway-worker.ltimindtree.workers.dev/v1'
});

const completion = await client.chat.completions.create({
  model: 'google/gemini-flash-1.5',
  messages: [{ role: 'user', content: 'Write a haiku about AI' }]
});

console.log(completion.choices[0].message.content);
```

## 🎯 Key Features in Action

### 1. Multi-Provider Routing
```json
// Request comes in for "gpt-4o-mini"
// System checks routing rules:
// 1. Try OpenAI (priority 1)
// 2. If fails, try OpenRouter (priority 2)
// 3. Track costs and update budget
```

### 2. Cost Management
```json
// Automatic cost calculation
{
  "model": "gpt-4o-mini",
  "tokens": 150,
  "cost": 0.000225,  // $0.15/1M tokens * 1500
  "provider": "openai",
  "budget_remaining": 0.999775
}
```

### 3. Intelligent Failover
```json
// Automatic provider switching
{
  "original_request": "claude-3-haiku",
  "attempts": [
    {"provider": "anthropic", "status": "failed", "error": "rate_limit"},
    {"provider": "openrouter", "status": "success", "cost": 0.0000375}
  ]
}
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

### Code Structure
```
ai-gateway/
├── ai-gateway-backend/          # Cloudflare Workers backend
│   ├── src/
│   │   ├── routes/             # API route handlers
│   │   ├── db/                 # Database schemas & queries
│   │   ├── gateway/            # AI proxy & routing logic
│   │   └── types.ts            # TypeScript definitions
│   └── wrangler.toml           # Cloudflare configuration
├── ai-gateway-frontend/         # Next.js frontend
│   ├── src/
│   │   ├── app/                # Next.js app router pages
│   │   ├── components/         # React components
│   │   └── lib/                # API clients & utilities
│   └── next.config.js          # Next.js configuration
├── deploymentsteps.md           # Complete deployment guide
└── README.md                    # This file
```

### Adding New Providers
1. Add provider configuration to `src/db/schema.sql`
2. Update `src/gateway/providers.ts` with proxy logic
3. Add provider to frontend dropdowns
4. Test integration thoroughly

## 📊 Model Coverage

| Provider | Models | Free Models | Paid Models |
|----------|--------|-------------|-------------|
| OpenAI | 4 | 0 | 4 |
| Anthropic | 3 | 0 | 3 |
| Google | 2 | 0 | 2 |
| **OpenRouter** | **~160** | **~150** | **~10** |
| **Total** | **196+** | **150+** | **46+** |

### Popular Free Models
- `openai/gpt-oss-20b:free` - OpenAI's free model
- `meta-llama/llama-3.3-8b-instruct:free` - Meta's latest
- `mistralai/mistral-nemo:free` - Mistral's free option
- `deepseek/deepseek-r1:free` - DeepSeek's reasoning model
- `qwen/qwen-2.5-72b-instruct:free` - Alibaba's model
- And 145+ more free models!

## 🔒 Security

- **API Key Encryption**: Provider keys stored encrypted
- **Gateway Keys**: Secure key generation and management
- **Rate Limiting**: Built-in protection against abuse
- **Audit Logging**: Complete request/response logging
- **Budget Controls**: Automatic spending limits

## 📈 Performance

- **Global CDN**: Cloudflare's edge network
- **Sub-millisecond Latency**: Optimized routing logic
- **Caching Layer**: KV storage for frequently accessed data
- **Connection Pooling**: Efficient database connections
- **Static Asset Optimization**: Optimized frontend delivery

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Check `src/index.ts` CORS configuration
2. **Database Errors**: Run migrations with `--remote` flag
3. **Build Failures**: Remove invalid favicon.ico files
4. **API Timeouts**: Check provider rate limits and keys

### Debug Endpoints
- Health check: `GET /`
- Database debug: `GET /debug/db`
- Environment info: Check wrangler.toml bindings

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Cloudflare**: For the amazing Workers and D1 platform
- **OpenRouter**: For providing access to 150+ free AI models
- **Hono**: For the excellent web framework
- **Next.js**: For the React framework
- **Tailwind CSS**: For the utility-first CSS framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/ajithvnr2001/ai-gateway/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ajithvnr2001/ai-gateway/discussions)
- **Documentation**: See `deploymentsteps.md` for detailed setup

---

**Built with ❤️ using Cloudflare Workers, Next.js, and cutting-edge AI APIs**

[![Deployed on Cloudflare](https://img.shields.io/badge/Deployed%20on-Cloudflare-orange?style=flat-square)](https://workers.cloudflare.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=flat-square)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
