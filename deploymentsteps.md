# AI Gateway Deployment Steps - Complete Command Reference

## 📋 Overview
This document contains the complete deployment process for the AI Gateway system, including all commands executed, errors encountered, debugging steps, and final working solutions.

## 🚀 System Architecture
- **Backend**: Cloudflare Workers + D1 Database + KV Storage
- **Frontend**: Next.js + Cloudflare Pages
- **Total Components**: 196+ AI models, routing system, cost tracking, dashboard

---

## 🛠️ Backend Deployment (Cloudflare Workers + D1)

### Step 1: Navigate to Backend Directory
```bash
cd "C:\Users\ajith\Downloads\ai-routing-gateway (4)\ai-gateway-backend"
```

### Step 2: Create D1 Database
```bash
npm run db:create
```
**Output:**
```
✅ Successfully created DB 'ai_gateway_db' in region APAC
Created your new D1 database.
[[d1_databases]]
binding = "DB"
database_name = "ai_gateway_db"
database_id = "dbf42c03-b429-4ed8-b54c-f016524a240b"
```
**Notes:** Database created successfully without errors.

### Step 3: Update wrangler.toml with Database ID
**File:** `ai-gateway-backend/wrangler.toml`
**Change:**
```toml
[[d1_databases]]
binding = "DB"
database_name = "ai_gateway_db"
database_id = "dbf42c03-b429-4ed8-b54c-f016524a240b"  # Added this line
```

### Step 4: Create KV Namespace
```bash
wrangler kv namespace create CACHE
```
**Output:**
```
🌀 Creating namespace with title "CACHE"
✨ Success!
To access your new KV Namespace in your Worker, add the following snippet to your configuration file:
[[kv_namespaces]]
binding = "CACHE"
id = "b6f208541f0e4d3c9c359455f702cd43"
```
**Notes:** KV namespace created successfully.

### Step 5: Update wrangler.toml with KV ID
**File:** `ai-gateway-backend/wrangler.toml`
**Change:**
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "b6f208541f0e4d3c9c359455f702cd43"  # Added this line
```

### Step 6: Run Database Migration (Local)
```bash
npm run db:migrate
```
**Output:**
```
🌀 Executing on local database ai_gateway_db (dbf42c03-b429-4ed8-b54c-f016524a240b) from .wrangler\state\v3\d1:
🌀 To execute on your remote database, add a --remote flag to your wrangler command.
🚣 34 commands executed successfully.
```
**Notes:** Successfully migrated 34 commands (all SQL statements for creating tables and seeding models).

### Step 7: Run Database Migration (Remote - Critical Fix)
```bash
wrangler d1 execute ai_gateway_db --file=./src/db/schema.sql --remote
```
**Output:**
```
🌀 Executing on remote database ai_gateway_db (dbf42c03-b429-4ed8-b54c-f016524a240b):
🚣 Executed 34 queries in 0.01 seconds (9 rows read, 265 rows written)
Database is currently at bookmark 00000004-00000007-00004faa-1f791f2d03f92eb7d30b3b23948e3a64.
```
**Notes:** Critical step - remote migration required for production deployment. Without this, database tables don't exist in production.

### Step 8: Deploy Backend Worker
```bash
npm run deploy
```
**Output:**
```
Total Upload: 75.69 KiB / gzip: 17.29 KiB
Worker Startup Time: 1 ms
Uploaded ai-gateway-worker (9.64 sec)
Deployed ai-gateway-worker triggers (3.72 sec)
https://ai-gateway-worker.ltimindtree.workers.dev
```
**Success:** Backend deployed successfully at `https://ai-gateway-worker.ltimindtree.workers.dev`

---

## 🎨 Frontend Deployment (Next.js + Cloudflare Pages)

### Step 1: Navigate to Frontend Directory
```bash
cd "C:\Users\ajith\Downloads\ai-routing-gateway (4)\ai-gateway-frontend"
```

### Step 2: Install Dependencies
```bash
npm install --legacy-peer-deps
```
**Output:** Dependencies installed successfully despite peer dependency warnings.

### Step 3: Create Environment File
**File:** `ai-gateway-frontend/.env.local`
**Content:**
```
NEXT_PUBLIC_API_URL=https://ai-gateway-worker.ltimindtree.workers.dev
```

### Step 4: Build Application
```bash
npm run build
```
**Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (11/11)
✓ Finalizing page optimization
✓ Collecting build traces
```
**Success:** Build completed without errors.

### Step 5: Create Cloudflare Pages Project
```bash
wrangler pages project create ai-gateway-frontend --production-branch main
```
**Output:**
```
✨ Successfully created the 'ai-gateway-frontend' project. It will be available at https://ai-gateway-frontend.pages.dev/ once you create your first deployment.
```
**Notes:** Pages project created successfully.

### Step 6: Deploy to Cloudflare Pages
```bash
wrangler pages deploy out --project-name ai-gateway-frontend
```
**Output:**
```
✨ Success! Uploaded 41 files (3.20 sec)
🌎 Deploying...
✨ Deployment complete! Take a peek over at https://d6302f07.ai-gateway-frontend.pages.dev
```
**Success:** Frontend deployed successfully.

---

## 🐛 Errors Encountered and Debugging

### Error 1: Database Tables Not Found (500 Errors)
**Error:** `D1_ERROR: no such table: users: SQLITE_ERROR`
**Symptom:** All API endpoints returning 500 errors
**Root Cause:** Database migration only ran locally, not on remote/production database

**Debug Steps:**
1. Checked local database with debug endpoint
2. Found tables existed locally but not remotely
3. Added `--remote` flag to migration command
4. Verified remote database had tables after migration

**Solution:**
```bash
wrangler d1 execute ai_gateway_db --file=./src/db/schema.sql --remote
```

### Error 2: NULL Value Handling (500 Errors)
**Error:** `TypeError: Cannot read properties of null` in logs endpoint
**Symptom:** Dashboard summary failing with 500 errors
**Root Cause:** SQL SUM() and COUNT() returning NULL for empty result sets

**Debug Steps:**
1. Added console logging to identify failing queries
2. Found SUM(total_cost) returning NULL instead of 0
3. Implemented COALESCE() in SQL queries
4. Added safe type parsing for D1 responses

**Solution:** Updated `src/db/queries.ts` and `src/routes/logs.ts` with:
```sql
SELECT COALESCE(SUM(total_cost), 0) as total FROM api_logs WHERE user_id = ?
```

### Error 3: CORS Issues (Frontend Connection Errors)
**Error:** `Access to fetch at '...' has been blocked by CORS policy`
**Symptom:** Login requests failing in browser
**Root Cause:** CORS configuration too restrictive

**Debug Steps:**
1. Checked network tab in browser dev tools
2. Saw CORS preflight failures
3. Updated CORS configuration in backend
4. Added explicit mode: 'cors' in frontend API client

**Solution:** Updated `src/index.ts` CORS config:
```typescript
app.use('*', cors({
  origin: '*', // Allow all origins
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));
```

### Error 4: Favicon Build Errors (Build Failures)
**Error:** `Image import "next-metadata-image-loader...favicon.ico" is not a valid image`
**Symptom:** Next.js build failing with favicon processing error
**Root Cause:** Invalid/empty favicon.ico file causing Next.js metadata processing to fail

**Debug Steps:**
1. Removed favicon.ico file completely
2. Updated layout.tsx to remove favicon references
3. Added suppressHydrationWarning to prevent hydration mismatches

**Solution:** Removed favicon references from `src/app/layout.tsx` and deleted invalid favicon file.

### Error 5: PowerShell Command Syntax (CLI Issues)
**Error:** `The token '&&' is not a valid statement separator in this version`
**Symptom:** Command chaining failing in PowerShell
**Root Cause:** PowerShell doesn't support bash-style command chaining

**Debug Steps:**
1. Replaced `&&` with separate commands
2. Used PowerShell-specific syntax for file operations
3. Updated command sequences to work with Windows PowerShell

**Solution:** Used separate commands instead of chaining:
```powershell
cd "path/to/directory"
npm run db:create
```

---

## ✅ Final Working Commands (Error-Free)

### Backend Deployment (Complete Sequence)
```bash
# Navigate to backend
cd "C:\Users\ajith\Downloads\ai-routing-gateway (4)\ai-gateway-backend"

# Create D1 database
npm run db:create

# Update wrangler.toml with database ID from output above
# Edit ai-gateway-backend/wrangler.toml and add the database_id

# Create KV namespace
wrangler kv namespace create CACHE

# Update wrangler.toml with KV ID from output above
# Edit ai-gateway-backend/wrangler.toml and add the id

# Run local migration (for development)
npm run db:migrate

# Run remote migration (CRITICAL for production)
wrangler d1 execute ai_gateway_db --file=./src/db/schema.sql --remote

# Deploy backend
npm run deploy
```

### Frontend Deployment (Complete Sequence)
```bash
# Navigate to frontend
cd "C:\Users\ajith\Downloads\ai-routing-gateway (4)\ai-gateway-frontend"

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
Set-Content -Path ".env.local" -Value "NEXT_PUBLIC_API_URL=https://ai-gateway-worker.ltimindtree.workers.dev"

# Build application
npm run build

# Create Pages project (only needed once)
wrangler pages project create ai-gateway-frontend --production-branch main

# Deploy to Pages
wrangler pages deploy out --project-name ai-gateway-frontend
```

---

## 🔍 Testing Commands

### Backend Testing
```bash
# Test health endpoint
curl "https://ai-gateway-worker.ltimindtree.workers.dev/"

# Test debug endpoint
curl "https://ai-gateway-worker.ltimindtree.workers.dev/debug/db"

# Test login
Invoke-WebRequest -Uri "https://ai-gateway-worker.ltimindtree.workers.dev/api/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"username":"ajithvnr2001","password":"0000asdf"}'

# Test dashboard summary
Invoke-WebRequest -Uri "https://ai-gateway-worker.ltimindtree.workers.dev/api/logs/summary" -Method GET -Headers @{"Authorization"="Bearer dummy-token-ajith"}
```

### Frontend Testing
```bash
# Access deployed frontend
# URL: https://fc8e235e.ai-gateway-frontend.pages.dev

# Demo credentials:
# Username: ajithvnr2001
# Password: 0000asdf
```

---

## 📊 Deployment Results Summary

### Backend (Cloudflare Workers)
- **URL:** `https://ai-gateway-worker.ltimindtree.workers.dev`
- **Database:** D1 (dbf42c03-b429-4ed8-b54c-f016524a240b)
- **Cache:** KV (b6f208541f0e4d3c9c359455f702cd43)
- **Models:** 196+ AI models across 12 providers
- **Status:** ✅ All endpoints working, no 500 errors

### Frontend (Cloudflare Pages)
- **URL:** `https://fc8e235e.ai-gateway-frontend.pages.dev`
- **Build:** Static export successful
- **Features:** Complete dashboard with all pages
- **Status:** ✅ All functionality working

### System Features
- ✅ **Authentication:** Working login/logout
- ✅ **Provider Management:** Add/remove AI providers
- ✅ **Router Configuration:** Create routers with routing rules
- ✅ **Gateway Keys:** Generate and manage API keys
- ✅ **Model Pricing:** Browse 196+ models with search/filter
- ✅ **Cost Tracking:** Real-time usage analytics
- ✅ **OpenAI Compatibility:** Drop-in API replacement

---

## 🎯 Key Lessons Learned

1. **Always run database migrations on remote database** for production deployments
2. **Use COALESCE() for SQL aggregations** to handle NULL values properly
3. **Test CORS configuration** with actual browser requests
4. **Remove invalid favicon files** that can break Next.js builds
5. **Use PowerShell-compatible commands** instead of bash syntax
6. **Run remote database operations** with `--remote` flag
7. **Test debug endpoints** to verify database connectivity
8. **Check browser network tab** for CORS and API errors

---

## 🚀 Quick Redeploy Commands (For Future Updates)

### Backend Only
```bash
cd ai-gateway-backend
npm run deploy
```

### Frontend Only
```bash
cd ai-gateway-frontend
npm run build
wrangler pages deploy out --project-name ai-gateway-frontend
```

### Full System
```bash
# Backend
cd ai-gateway-backend
npm run deploy

# Frontend
cd ../ai-gateway-frontend
npm run build
wrangler pages deploy out --project-name ai-gateway-frontend
```

---

## 📞 Support Information

**Deployed URLs:**
- Frontend: `https://fc8e235e.ai-gateway-frontend.pages.dev`
- Backend: `https://ai-gateway-worker.ltimindtree.workers.dev`

**Demo Credentials:**
- Username: `ajithvnr2001`
- Password: `0000asdf`

**System Status:** ✅ **FULLY OPERATIONAL** - All features working, no errors detected.

---

*This document serves as a complete reference for deploying and troubleshooting the AI Gateway system.*
