'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Provider } from '@/types';

export default function ProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

  const [createFormData, setCreateFormData] = useState({
    name: '',
    provider_type: 'openai',
    base_urls: [''], // Changed to array
    api_key: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    base_urls: [''], // Changed to array
    api_key: '',
    update_api_key: false
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await api.getProviders();
      setProviders(data.providers);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for multiple URLs
  const addUrlField = () => {
    setCreateFormData({
      ...createFormData,
      base_urls: [...createFormData.base_urls, '']
    });
  };

  const removeUrlField = (index: number) => {
    const newUrls = createFormData.base_urls.filter((_, i) => i !== index);
    setCreateFormData({ ...createFormData, base_urls: newUrls });
  };

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...createFormData.base_urls];
    newUrls[index] = value;
    setCreateFormData({ ...createFormData, base_urls: newUrls });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProvider(createFormData);
      setShowCreateForm(false);
      setCreateFormData({ name: '', provider_type: 'openai', base_urls: [''], api_key: '' });
      loadProviders();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const openEditModal = async (provider: Provider) => {
    setEditingProvider(provider);

    // Parse base_urls from provider
    let urls = [''];
    if (provider.base_urls) {
      try {
        urls = JSON.parse(provider.base_urls);
      } catch {
        urls = provider.base_url ? [provider.base_url] : [''];
      }
    } else if (provider.base_url) {
      urls = [provider.base_url];
    }

    setEditFormData({
      name: provider.name,
      base_urls: urls,
      api_key: '',
      update_api_key: false
    });
    setShowEditModal(true);
  };

  // Edit modal URL helpers
  const addEditUrl = () => {
    setEditFormData({
      ...editFormData,
      base_urls: [...editFormData.base_urls, '']
    });
  };

  const removeEditUrl = (index: number) => {
    const newUrls = editFormData.base_urls.filter((_, i) => i !== index);
    setEditFormData({ ...editFormData, base_urls: newUrls });
  };

  const updateEditUrl = (index: number, value: string) => {
    const newUrls = [...editFormData.base_urls];
    newUrls[index] = value;
    setEditFormData({ ...editFormData, base_urls: newUrls });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;

    try {
      const updateData: any = {
        name: editFormData.name,
        base_urls: editFormData.base_urls.filter(u => u) // Remove empty URLs
      };

      if (editFormData.update_api_key && editFormData.api_key) {
        updateData.api_key = editFormData.api_key;
      }

      await api.updateProvider(editingProvider.id, updateData);
      setShowEditModal(false);
      setEditingProvider(null);
      loadProviders();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleToggle = async (provider: Provider) => {
    try {
      await api.toggleProvider(provider.id);
      loadProviders();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure? This will affect all routers using this provider.')) return;
    try {
      await api.deleteProvider(id);
      loadProviders();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Providers</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Provider
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Provider</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider Name *</label>
              <input
                type="text"
                required
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                placeholder="My OpenAI Provider"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Provider Type *</label>
              <select
                value={createFormData.provider_type}
                onChange={(e) => setCreateFormData({ ...createFormData, provider_type: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
              >
                <option value="openai">OpenAI</option>
                <option value="openrouter">OpenRouter</option>
                <option value="google">Google Gemini</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="custom">Custom Endpoint</option>
              </select>
            </div>
            {createFormData.provider_type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Base URLs (Multiple for fallback)
                </label>
                {createFormData.base_urls.map((url, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      placeholder="https://api.example.com/v1/chat/completions"
                    />
                    {createFormData.base_urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlField(index)}
                        className="px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addUrlField}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add Another URL
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Add multiple URLs for automatic fallback. First working URL will be used.
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">API Key *</label>
              <input
                type="password"
                required
                value={createFormData.api_key}
                onChange={(e) => setCreateFormData({ ...createFormData, api_key: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                placeholder="sk-..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Provider
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
                  {provider.is_enabled ? (
                    <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                      ENABLED
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded">
                      DISABLED
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 capitalize mb-1">
                  Type: <span className="font-medium">{provider.provider_type}</span>
                </p>
                {provider.base_url && (
                  <p className="text-xs text-gray-500 truncate" title={provider.base_url}>
                    {provider.base_url}
                  </p>
                )}
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(provider)}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition ${
                  provider.is_enabled
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {provider.is_enabled ? '⏸ Disable' : '▶ Enable'}
              </button>
              <button
                onClick={() => openEditModal(provider)}
                className="flex-1 px-3 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => handleDelete(provider.id)}
                className="px-3 py-2 text-sm font-medium bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No providers yet. Add your first provider to get started.</p>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Edit Provider Settings</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Provider Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Provider Type</label>
                <input
                  type="text"
                  disabled
                  value={editingProvider.provider_type}
                  className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md text-gray-500 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Provider type cannot be changed</p>
              </div>
              {editingProvider.provider_type === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base URLs (Multiple for fallback)
                  </label>
                  {editFormData.base_urls.map((url, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateEditUrl(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                        placeholder="https://openrouter.ai/api/v1/chat/completions"
                      />
                      {editFormData.base_urls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditUrl(index)}
                          className="px-3 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEditUrl}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Another URL
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Add multiple URLs for automatic fallback. First working URL will be used.
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="update_api_key"
                    checked={editFormData.update_api_key}
                    onChange={(e) => setEditFormData({ ...editFormData, update_api_key: e.target.checked, api_key: '' })}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <label htmlFor="update_api_key" className="ml-2 text-sm font-medium text-gray-700">
                    Update API Key
                  </label>
                </div>
                {editFormData.update_api_key && (
                  <input
                    type="password"
                    required
                    value={editFormData.api_key}
                    onChange={(e) => setEditFormData({ ...editFormData, api_key: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                    placeholder="Enter new API key"
                  />
                )}
                {!editFormData.update_api_key && (
                  <p className="text-xs text-gray-500">API key is hidden for security. Check the box above to update it.</p>
                )}
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProvider(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
