import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware } from '../auth';
import { encrypt } from '../utils/crypto';

const providers = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
providers.use('*', authMiddleware);

// GET all providers
providers.get('/', async (c) => {
  try {
    const userId = c.get('user_id');
    const { results } = await c.env.DB.prepare(
      'SELECT id, user_id, name, provider_type, base_url, base_urls, is_enabled FROM providers WHERE user_id = ?'
    ).bind(userId).all();

    return c.json({ providers: results || [] });
  } catch (error: any) {
    console.error('Error fetching providers:', error);
    return c.json({
      error: 'Failed to fetch providers',
      details: error.message
    }, 500);
  }
});

// GET single provider
providers.get('/:id', async (c) => {
  try {
    const userId = c.get('user_id');
    const providerId = c.req.param('id');

    const provider = await c.env.DB.prepare(
      'SELECT id, user_id, name, provider_type, base_url, base_urls, is_enabled FROM providers WHERE id = ? AND user_id = ?'
    ).bind(providerId, userId).first();

    if (!provider) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    return c.json({ provider });
  } catch (error: any) {
    console.error('Error fetching provider:', error);
    return c.json({
      error: 'Failed to fetch provider',
      details: error.message
    }, 500);
  }
});

// POST create provider
providers.post('/', async (c) => {
  try {
    const userId = c.get('user_id');
    const { name, provider_type, base_url, base_urls, api_key } = await c.req.json();

    if (!name || !provider_type || !api_key) {
      return c.json({ error: 'Missing required fields: name, provider_type, api_key' }, 400);
    }

    // Encrypt the API key before saving
    const encryptedKey = await encrypt(api_key, c.env.ENCRYPTION_KEY);

    const providerId = `prov_${crypto.randomUUID()}`;

    // Handle multiple URLs
    let urlsJson = '[]';
    if (base_urls && Array.isArray(base_urls)) {
      urlsJson = JSON.stringify(base_urls.filter((u: string) => u));
    } else if (base_url) {
      urlsJson = JSON.stringify([base_url]);
    }

    await c.env.DB.prepare(
      'INSERT INTO providers (id, user_id, name, provider_type, base_url, base_urls, api_key_encrypted, is_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, 1)'
    ).bind(providerId, userId, name, provider_type, base_url || null, urlsJson, encryptedKey).run();

    return c.json({
      id: providerId,
      message: 'Provider created successfully'
    }, 201);
  } catch (error: any) {
    console.error('Error creating provider:', error);
    return c.json({
      error: 'Failed to create provider',
      details: error.message
    }, 500);
  }
});

// PUT update provider (including enable/disable)
providers.put('/:id', async (c) => {
  try {
    const userId = c.get('user_id');
    const providerId = c.req.param('id');
    const body = await c.req.json();
    const { name, base_url, base_urls, api_key, is_enabled, toggle } = body;

    if (toggle === true) {
      // Toggle logic (unchanged)
      const provider = await c.env.DB.prepare(
        'SELECT is_enabled FROM providers WHERE id = ? AND user_id = ?'
      ).bind(providerId, userId).first<{ is_enabled: number }>();

      if (!provider) {
        return c.json({ error: 'Provider not found' }, 404);
      }

      const newStatus = provider.is_enabled === 1 ? 0 : 1;

      await c.env.DB.prepare(
        'UPDATE providers SET is_enabled = ? WHERE id = ? AND user_id = ?'
      ).bind(newStatus, providerId, userId).run();

      return c.json({
        message: 'Provider status updated',
        is_enabled: newStatus === 1
      });
    }

    // Normal update with multiple URLs support
    const updateFields: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      values.push(name);
    }
    if (base_url !== undefined) {
      updateFields.push('base_url = ?');
      values.push(base_url);
    }
    if (base_urls !== undefined && Array.isArray(base_urls)) {
      updateFields.push('base_urls = ?');
      values.push(JSON.stringify(base_urls.filter((u: string) => u)));
    }
    if (api_key !== undefined) {
      // Encrypt the new API key before saving
      const encryptedKey = await encrypt(api_key, c.env.ENCRYPTION_KEY);
      updateFields.push('api_key_encrypted = ?');
      values.push(encryptedKey);
    }
    if (is_enabled !== undefined) {
      updateFields.push('is_enabled = ?');
      values.push(is_enabled ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }

    values.push(providerId, userId);

    const result = await c.env.DB.prepare(
      `UPDATE providers SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`
    ).bind(...values).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    return c.json({ message: 'Provider updated successfully' });
  } catch (error: any) {
    console.error('Error updating provider:', error);
    return c.json({
      error: 'Failed to update provider',
      details: error.message
    }, 500);
  }
});

// PATCH toggle provider status (quick enable/disable)
providers.patch('/:id/toggle', async (c) => {
  try {
    const userId = c.get('user_id');
    const providerId = c.req.param('id');

    // Get current status
    const provider = await c.env.DB.prepare(
      'SELECT is_enabled FROM providers WHERE id = ? AND user_id = ?'
    ).bind(providerId, userId).first<{ is_enabled: number }>();

    if (!provider) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    // Toggle status
    const newStatus = provider.is_enabled === 1 ? 0 : 1;

    await c.env.DB.prepare(
      'UPDATE providers SET is_enabled = ? WHERE id = ? AND user_id = ?'
    ).bind(newStatus, providerId, userId).run();

    return c.json({
      message: 'Provider status updated',
      is_enabled: newStatus === 1
    });
  } catch (error: any) {
    console.error('Error toggling provider:', error);
    return c.json({
      error: 'Failed to toggle provider',
      details: error.message
    }, 500);
  }
});

// DELETE provider
providers.delete('/:id', async (c) => {
  try {
    const userId = c.get('user_id');
    const providerId = c.req.param('id');

    const result = await c.env.DB.prepare(
      'DELETE FROM providers WHERE id = ? AND user_id = ?'
    ).bind(providerId, userId).run();

    if (result.meta.changes === 0) {
      return c.json({ error: 'Provider not found' }, 404);
    }

    return c.json({ message: 'Provider deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting provider:', error);
    return c.json({
      error: 'Failed to delete provider',
      details: error.message
    }, 500);
  }
});

export default providers;
