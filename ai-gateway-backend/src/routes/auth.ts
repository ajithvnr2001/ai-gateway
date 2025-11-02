import { Hono } from 'hono';
import { Env } from '../types';
import { validateCredentials, generateToken } from '../auth';

const auth = new Hono<{ Bindings: Env }>();

auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    if (validateCredentials(username, password)) {
      const token = generateToken();
      return c.json({
        token,
        user: {
          id: 'ajithvnr2001',
          email: 'ajithvnr2001@example.com',
          plan: 'free'
        }
      });
    }

    return c.json({ error: 'Invalid credentials' }, 401);
  } catch (error) {
    return c.json({ error: 'Invalid request body' }, 400);
  }
});

export default auth;
