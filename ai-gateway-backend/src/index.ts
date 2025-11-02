import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import auth from './routes/auth';
import providers from './routes/providers';
import routers from './routes/routers';
import gatewayKeys from './routes/gateway-keys';
import userModels from './routes/user-models';
import logs from './routes/logs';
import { handleGatewayRequest } from './gateway/proxy';

const app = new Hono<{ Bindings: Env }>();

// FIXED CORS - Handle preflight
app.use('*', cors({
  origin: '*', // Allow all origins for development
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // Added PATCH
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'AI Gateway API',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Debug endpoint for database connection testing
app.get('/debug/db', async (c) => {
  try {
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind('ajithvnr2001')
      .first();

    const providerCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM providers')
      .first<{ count: number }>();

    const modelCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM model_costs')
      .first<{ count: number }>();

    return c.json({
      user_exists: !!user,
      provider_count: providerCount?.count || 0,
      model_count: modelCount?.count || 0,
      db_bound: !!c.env.DB
    });
  } catch (error: any) {
    return c.json({
      error: error.message,
      stack: error.stack
    }, 500);
  }
});

// Mount API routes with error boundaries
app.route('/api/auth', auth);
app.route('/api/providers', providers);
app.route('/api/routers', routers);
app.route('/api/keys', gatewayKeys);
app.route('/api/user-models', userModels);
app.route('/api/logs', logs);

// Gateway proxy endpoint
app.post('/v1/chat/completions', handleGatewayRequest);

// 404
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Global error handler with detailed logging
app.onError((err, c) => {
  console.error('=== Global Error Handler ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('Path:', c.req.path);
  console.error('Method:', c.req.method);

  return c.json({
    error: 'Internal server error',
    message: err.message,
    path: c.req.path
  }, 500);
});

export default app;
