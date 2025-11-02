import { Provider } from '../types';

export interface ProxyConfig {
  url: string;
  headers: Record<string, string>;
}

export function getProxyConfig(provider: Provider, originalRequest: Request): ProxyConfig {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  switch (provider.provider_type) {
    case 'openai':
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          ...headers,
          'Authorization': `Bearer ${provider.api_key_encrypted}`,
        }
      };

    case 'google':
    case 'gemini':
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${provider.api_key_encrypted}`,
        headers
      };

    case 'anthropic':
      return {
        url: 'https://api.anthropic.com/v1/messages',
        headers: {
          ...headers,
          'x-api-key': provider.api_key_encrypted,
          'anthropic-version': '2023-06-01'
        }
      };

    case 'custom':
      if (!provider.base_url) {
        throw new Error('Custom provider requires base_url');
      }
      return {
        url: provider.base_url,
        headers: {
          ...headers,
          'Authorization': `Bearer ${provider.api_key_encrypted}`,
        }
      };

    default:
      throw new Error(`Unsupported provider type: ${provider.provider_type}`);
  }
}

export async function proxyRequest(
  config: ProxyConfig,
  body: any
): Promise<{ response: Response; usage: { prompt_tokens: number; completion_tokens: number } }> {
  const startTime = Date.now();

  const response = await fetch(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify(body)
  });

  const responseData = await response.json() as any;

  // Extract usage information (OpenAI format)
  const usage = {
    prompt_tokens: responseData.usage?.prompt_tokens || 0,
    completion_tokens: responseData.usage?.completion_tokens || 0
  };

  // Return response with usage
  return {
    response: new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    }),
    usage
  };
}
