import { Provider } from '../types';
import { decrypt } from '../utils/crypto';

export interface ProxyConfig {
  urls: string[]; // Changed from single url to array
  headers: Record<string, string>;
}

export async function getProxyConfig(
  provider: Provider,
  originalRequest: Request,
  env: { ENCRYPTION_KEY: string }
): Promise<ProxyConfig> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Decrypt the API key just-in-time (handle both encrypted and plain-text keys for migration)
  let decryptedApiKey: string;
  try {
    decryptedApiKey = await decrypt(provider.api_key_encrypted, env.ENCRYPTION_KEY);
  } catch (error) {
    // If decryption fails, assume it's a plain-text key (backward compatibility)
    console.warn(`Failed to decrypt API key for provider ${provider.name}, assuming plain-text (migration needed):`, error);
    decryptedApiKey = provider.api_key_encrypted;
  }

  // Parse base_urls if available, fallback to base_url
  let baseUrls: string[] = [];
  if (provider.base_urls) {
    try {
      baseUrls = JSON.parse(provider.base_urls);
    } catch {
      baseUrls = provider.base_url ? [provider.base_url] : [];
    }
  } else if (provider.base_url) {
    baseUrls = [provider.base_url];
  }

  switch (provider.provider_type) {
    case 'openai':
      return {
        urls: ['https://api.openai.com/v1/chat/completions'],
        headers: {
          ...headers,
          'Authorization': `Bearer ${decryptedApiKey}`,
        }
      };

    case 'openrouter':
      return {
        urls: [
          'https://openrouter.ai/api/v1/chat/completions',
          ...(baseUrls.filter(url => url)) // Add custom URLs if provided
        ],
        headers: {
          ...headers,
          'Authorization': `Bearer ${decryptedApiKey}`,
        }
      };

    case 'google':
    case 'gemini':
      return {
        urls: [`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${decryptedApiKey}`],
        headers
      };

    case 'anthropic':
      return {
        urls: ['https://api.anthropic.com/v1/messages'],
        headers: {
          ...headers,
          'x-api-key': decryptedApiKey,
          'anthropic-version': '2023-06-01'
        }
      };

    case 'custom':
      if (!baseUrls || baseUrls.length === 0 || !baseUrls[0]) {
        throw new Error('Custom provider requires at least one base URL');
      }
      return {
        urls: baseUrls,
        headers: {
          ...headers,
          'Authorization': `Bearer ${decryptedApiKey}`,
        }
      };

    default:
      throw new Error(`Unsupported provider type: ${provider.provider_type}`);
  }
}

export async function proxyRequest(
  config: ProxyConfig,
  body: any
): Promise<{ response: Response; usage: { prompt_tokens: number; completion_tokens: number }; url_used: string }> {
  let lastError: Error | null = null;

  // Try each URL in sequence
  for (const url of config.urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error from ${url}:`, {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorText.substring(0, 500) + (errorText.length > 500 ? '...' : ''),
          url: url,
          method: 'POST'
        });
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Read response as text first for debugging and validation
      const responseText = await response.text();

      // Log response details for debugging
      console.log(`Response received from ${url}:`, {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('Content-Type'),
        headers: Object.fromEntries(response.headers.entries()),
        bodyPreview: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
        url: url,
        method: 'POST'
      });

      // Validate Content-Type before parsing JSON
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`Invalid Content-Type from ${url}:`, {
          expected: 'application/json',
          received: contentType,
          responseBody: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
        });
        throw new Error(`Expected JSON response but received ${contentType || 'unknown'} Content-Type from ${url}`);
      }

      // Validate response body is not empty
      if (!responseText.trim()) {
        console.error(`Empty response body from ${url}`);
        throw new Error(`Empty response body received from ${url}`);
      }

      // Attempt to parse JSON with detailed error handling
      let responseData: any;
      try {
        responseData = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`JSON parsing failed for ${url}:`, {
          error: jsonError,
          status: response.status,
          contentType: contentType,
          responseBody: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
          url: url,
          method: 'POST'
        });
        throw new Error(`Invalid JSON response from ${url}: ${jsonError.message}. Response body: ${responseText.substring(0, 200)}...`);
      }

      // Extract usage information (OpenAI/OpenRouter format)
      const usage = {
        prompt_tokens: responseData.usage?.prompt_tokens || 0,
        completion_tokens: responseData.usage?.completion_tokens || 0
      };

      return {
        response: new Response(JSON.stringify(responseData), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }),
        usage,
        url_used: url
      };
    } catch (error) {
      console.error(`Failed to fetch from ${url}:`, error);
      lastError = error as Error;
      continue; // Try next URL
    }
  }

  // All URLs failed
  throw new Error(`All URLs failed. Last error: ${lastError?.message}`);
}
