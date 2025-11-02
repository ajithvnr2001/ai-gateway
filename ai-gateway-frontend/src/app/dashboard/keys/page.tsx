'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function KeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [routers, setRouters] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    router_id: ''
  });

  useEffect(() => {
    loadKeys();
    loadRouters();
  }, []);

  const loadKeys = async () => {
    try {
      const data = await api.getKeys();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Failed to load keys:', error);
    }
  };

  const loadRouters = async () => {
    try {
      const data = await api.getRouters();
      setRouters(data.routers || []);
    } catch (error) {
      console.error('Failed to load routers:', error);
    }
  };

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await api.createKey(formData.name, formData.router_id);
      setShowKey(result.key);
      setFormData({ name: '', router_id: '' });
      setShowForm(false);
      loadKeys();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const toggleKey = async (keyId: string, currentStatus: boolean) => {
    try {
      await api.toggleKey(keyId, !currentStatus);
      loadKeys();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const deleteKey = async (keyId: string) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    try {
      await api.deleteKey(keyId);
      loadKeys();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gateway Keys</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Key
        </button>
      </div>

      {/* Show newly created key */}
      {showKey && (
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ✓ Gateway Key Created Successfully
              </h3>
              <p className="text-sm text-green-700 mb-3">
                Copy this key now. For security reasons, you won't be able to see it again.
              </p>
              <div className="bg-white p-3 rounded border border-green-300 font-mono text-sm break-all">
                {showKey}
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(showKey)}
              className="ml-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Copy Key
            </button>
          </div>
          <button
            onClick={() => setShowKey(null)}
            className="mt-4 text-sm text-green-700 hover:text-green-900 underline"
          >
            I've copied it, close this message
          </button>
        </div>
      )}

      {/* Create Key Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Create New Gateway Key</h2>
          <form onSubmit={createKey} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Key Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                placeholder="Production API Key"
              />
              <p className="mt-1 text-xs text-gray-500">
                Give this key a descriptive name to remember its purpose
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Router</label>
              <select
                required
                value={formData.router_id}
                onChange={(e) => setFormData({ ...formData, router_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="">Select a router...</option>
                {routers.map((router) => (
                  <option key={router.id} value={router.id}>
                    {router.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                This key will use the routing rules from the selected router
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Key
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Keys List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Your Gateway Keys</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your API keys for accessing the gateway
          </p>
        </div>
        <div className="divide-y divide-gray-200">
          {keys.length > 0 ? (
            keys.map((key) => {
              const router = routers.find(r => r.id === key.router_id);
              return (
                <div key={key.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{key.name}</h3>
                        {key.is_active ? (
                          <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                            DISABLED
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">Key ID:</p>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {key.id}
                          </code>
                          <button
                            onClick={() => copyToClipboard(key.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-sm text-gray-500">
                          Router: <span className="font-medium text-gray-700">{router?.name || 'Unknown'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleKey(key.id, key.is_active)}
                        className={`px-3 py-2 text-sm rounded-md ${
                          key.is_active
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {key.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteKey(key.id)}
                        className="px-3 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No gateway keys yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      {keys.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Use Your Gateway Keys</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <p className="font-semibold mb-1">1. API Endpoint:</p>
              <code className="block bg-white p-2 rounded border border-blue-300 font-mono text-xs">
                {process.env.NEXT_PUBLIC_API_URL}/v1/chat/completions
              </code>
            </div>
            <div>
              <p className="font-semibold mb-1">2. Example cURL Request:</p>
              <pre className="bg-white p-3 rounded border border-blue-300 overflow-x-auto text-xs font-mono">
{`curl -X POST ${process.env.NEXT_PUBLIC_API_URL}/v1/chat/completions \\
  -H "Authorization: Bearer ${keys[0]?.id}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'`}
              </pre>
            </div>
            <div>
              <p className="font-semibold mb-1">3. Python Example:</p>
              <pre className="bg-white p-3 rounded border border-blue-300 overflow-x-auto text-xs font-mono">
{`from openai import OpenAI

client = OpenAI(
    api_key="${keys[0]?.id}",
    base_url="${process.env.NEXT_PUBLIC_API_URL}/v1"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
