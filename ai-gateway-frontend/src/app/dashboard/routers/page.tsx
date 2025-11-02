'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function RoutersPage() {
  const [routers, setRouters] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedRouter, setSelectedRouter] = useState<any>(null);
  const [showRouterForm, setShowRouterForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [routerName, setRouterName] = useState('');
  const [ruleForm, setRuleForm] = useState({
    priority: 1,
    condition: 'primary',
    provider_id: '',
    allowed_models: ''
  });

  useEffect(() => {
    loadRouters();
    loadProviders();
  }, []);

  const loadRouters = async () => {
    try {
      const data = await api.getRouters();
      setRouters(data.routers || []);
    } catch (error) {
      console.error('Failed to load routers:', error);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await api.getProviders();
      setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const loadRouterDetails = async (routerId: string) => {
    try {
      const data = await api.getRouter(routerId);
      setSelectedRouter(data);
    } catch (error) {
      console.error('Failed to load router details:', error);
    }
  };

  const createRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRouter(routerName);
      setRouterName('');
      setShowRouterForm(false);
      loadRouters();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const createRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouter) return;

    try {
      await api.createRoutingRule(selectedRouter.router.id, ruleForm);
      setRuleForm({
        priority: 1,
        condition: 'primary',
        provider_id: '',
        allowed_models: ''
      });
      setShowRuleForm(false);
      loadRouterDetails(selectedRouter.router.id);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const deleteRule = async (routerId: string, ruleId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.deleteRoutingRule(routerId, ruleId);
      loadRouterDetails(routerId);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const deleteRouter = async (routerId: string) => {
    if (!confirm('Are you sure? This will delete all rules too.')) return;
    try {
      await api.deleteRouter(routerId);
      setSelectedRouter(null);
      loadRouters();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const getPrimaryRules = () => {
    return selectedRouter?.rules?.filter((r: any) => r.condition === 'primary') || [];
  };

  const getFallbackRules = () => {
    return selectedRouter?.rules?.filter((r: any) => r.condition === 'on_failure') || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Routers & Failover Configuration</h1>
        <button
          onClick={() => setShowRouterForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Router
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">How Failover Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Primary Rules</strong>: Tried first in priority order (lower number = higher priority)</li>
          <li>• <strong>Fallback Rules</strong>: Only used if ALL primary rules fail</li>
          <li>• <strong>Allowed Models</strong>: Restrict which models can use this provider (optional, comma-separated)</li>
        </ul>
      </div>

      {/* Create Router Form */}
      {showRouterForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Create New Router</h2>
          <form onSubmit={createRouter} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Router Name</label>
              <input
                type="text"
                required
                value={routerName}
                onChange={(e) => setRouterName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                placeholder="Production Router"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowRouterForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Routers List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Routers</h2>
          {routers.map((router) => (
            <div
              key={router.id}
              onClick={() => loadRouterDetails(router.id)}
              className={`bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md transition ${
                selectedRouter?.router?.id === router.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <h3 className="font-semibold text-gray-900">{router.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{router.id}</p>
            </div>
          ))}
          {routers.length === 0 && (
            <p className="text-gray-500 text-sm">No routers yet. Create one to get started.</p>
          )}
        </div>

        {/* Router Details & Rules */}
        <div className="lg:col-span-2">
          {selectedRouter ? (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedRouter.router.name}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedRouter.router.id}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowRuleForm(true)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      Add Rule
                    </button>
                    <button
                      onClick={() => deleteRouter(selectedRouter.router.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                    >
                      Delete Router
                    </button>
                  </div>
                </div>

                {/* Add Rule Form */}
                {showRuleForm && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <h3 className="font-semibold mb-3 text-gray-900">Add Routing Rule</h3>
                    <form onSubmit={createRule} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Priority</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={ruleForm.priority}
                            onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          />
                          <p className="text-xs text-gray-500 mt-1">Lower = tried first</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Rule Type</label>
                          <select
                            value={ruleForm.condition}
                            onChange={(e) => setRuleForm({ ...ruleForm, condition: e.target.value })}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          >
                            <option value="primary">Primary (Try First)</option>
                            <option value="on_failure">Fallback (On Failure)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Provider *</label>
                        <select
                          required
                          value={ruleForm.provider_id}
                          onChange={(e) => setRuleForm({ ...ruleForm, provider_id: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                        >
                          <option value="">Select a provider...</option>
                          {providers.map((provider) => (
                            <option key={provider.id} value={provider.id}>
                              {provider.name} ({provider.provider_type})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Allowed Models (Optional)
                        </label>
                        <input
                          type="text"
                          value={ruleForm.allowed_models}
                          onChange={(e) => setRuleForm({ ...ruleForm, allowed_models: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                          placeholder="gpt-4o,gpt-4o-mini"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leave empty to allow all models, or specify comma-separated list
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Add Rule
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRuleForm(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Primary Rules */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">PRIMARY</span>
                    Primary Routing Rules ({getPrimaryRules().length})
                  </h3>
                  {getPrimaryRules().length > 0 ? (
                    <div className="space-y-2">
                      {getPrimaryRules().map((rule: any) => {
                        const provider = providers.find(p => p.id === rule.provider_id);
                        return (
                          <div
                            key={rule.id}
                            className="flex justify-between items-center p-3 border-2 border-blue-200 rounded-md bg-blue-50"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-xs font-bold bg-blue-600 text-white rounded">
                                  Priority {rule.priority}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {provider?.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({provider?.provider_type})
                                </span>
                              </div>
                              {rule.allowed_models && (
                                <p className="text-xs text-gray-600 mt-1">
                                  🎯 Models: {rule.allowed_models}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteRule(selectedRouter.router.id, rule.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm bg-gray-50 p-3 rounded border border-gray-200">
                      No primary rules. Add at least one primary rule.
                    </p>
                  )}
                </div>

                {/* Fallback Rules */}
                <div>
                  <h3 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">FALLBACK</span>
                    Fallback Rules ({getFallbackRules().length})
                  </h3>
                  {getFallbackRules().length > 0 ? (
                    <div className="space-y-2">
                      {getFallbackRules().map((rule: any) => {
                        const provider = providers.find(p => p.id === rule.provider_id);
                        return (
                          <div
                            key={rule.id}
                            className="flex justify-between items-center p-3 border-2 border-orange-200 rounded-md bg-orange-50"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-xs font-bold bg-orange-600 text-white rounded">
                                  Priority {rule.priority}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {provider?.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({provider?.provider_type})
                                </span>
                              </div>
                              {rule.allowed_models && (
                                <p className="text-xs text-gray-600 mt-1">
                                  🎯 Models: {rule.allowed_models}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteRule(selectedRouter.router.id, rule.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm bg-gray-50 p-3 rounded border border-gray-200">
                      No fallback rules. Add fallback rules for redundancy.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <p className="text-gray-500">Select a router to view and manage its rules</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
