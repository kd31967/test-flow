import { useState } from 'react';
import { Play, Plus, Trash2, AlertCircle, CheckCircle, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import VariableInput from './VariableInput';
import { FlowVariable, SystemVariables, VariableResolver } from '../lib/variableSystem';
import { generateApiTestUrl } from '../config/environment';

interface HttpApiConfigProps {
  config: any;
  onChange: (config: any) => void;
  flowVariables?: FlowVariable[];
}

interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

interface TestResult {
  success: boolean;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: any;
  error?: string;
  duration?: number;
  requestDetails?: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
  };
  variables_generated?: string[];
}

export default function HttpApiConfig({ config, onChange, flowVariables = [] }: HttpApiConfigProps) {
  const [headers, setHeaders] = useState<Header[]>(
    config.headers ? Object.entries(config.headers).map(([key, value]) => ({
      key,
      value: String(value),
      enabled: true
    })) : [{ key: '', value: '', enabled: true }]
  );
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showResponseHeaders, setShowResponseHeaders] = useState(false);
  const systemVariables = new SystemVariables();

  const updateConfig = (updates: Partial<any>) => {
    onChange({ ...config, ...updates });
  };

  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', enabled: true }]);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
    updateHeadersInConfig(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], [field]: value };
    setHeaders(newHeaders);
    updateHeadersInConfig(newHeaders);
  };

  const updateHeadersInConfig = (headersList: Header[]) => {
    const headersObj: Record<string, string> = {};
    headersList.forEach(h => {
      if (h.enabled && h.key) {
        headersObj[h.key] = h.value;
      }
    });
    updateConfig({ headers: headersObj });
  };

  const testApiCall = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Resolve variables in URL and body
      const resolver = new VariableResolver();

      // Add flow variables
      flowVariables.forEach(v => {
        resolver.addVariable(v.nodeId, v.nodeName, v.nodeType, v.key, v.value);
      });

      let resolvedUrl = resolver.resolveVariables(config.url || '');
      const method = config.method || 'GET';

      // Build headers
      const headersObj: Record<string, string> = {};
      headers.forEach(h => {
        if (h.enabled && h.key) {
          headersObj[h.key] = resolver.resolveVariables(h.value);
        }
      });

      // Add authentication headers
      if (config.auth_type === 'bearer' && config.bearer_token) {
        headersObj['Authorization'] = `Bearer ${resolver.resolveVariables(config.bearer_token)}`;
      } else if (config.auth_type === 'basic' && config.basic_username && config.basic_password) {
        const username = resolver.resolveVariables(config.basic_username);
        const password = resolver.resolveVariables(config.basic_password);
        const credentials = btoa(`${username}:${password}`);
        headersObj['Authorization'] = `Basic ${credentials}`;
      } else if (config.auth_type === 'api_key' && config.api_key_header && config.api_key_value) {
        headersObj[config.api_key_header] = resolver.resolveVariables(config.api_key_value);
      }

      if (!resolvedUrl) {
        throw new Error('API URL is required');
      }

      // Resolve body variables
      let resolvedBody = null;
      if (method !== 'GET' && method !== 'HEAD' && config.body) {
        const bodyStr = typeof config.body === 'string'
          ? config.body
          : JSON.stringify(config.body);
        const resolvedBodyStr = resolver.resolveVariables(bodyStr);

        try {
          resolvedBody = JSON.parse(resolvedBodyStr);
        } catch {
          resolvedBody = resolvedBodyStr;
        }
      }

      // Call the test API endpoint
      const testApiUrl = generateApiTestUrl();
      const response = await fetch(testApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          url: resolvedUrl,
          method,
          headers: headersObj,
          body: resolvedBody,
          timeout: (config.timeout || 30) * 1000
        })
      });

      const result = await response.json();

      if (result.success !== undefined) {
        setTestResult({
          success: result.success,
          status: result.status,
          statusText: result.statusText,
          headers: result.headers,
          body: result.body,
          duration: result.duration,
          requestDetails: result.requestDetails,
          variables_generated: result.variables_generated
        });
      } else {
        setTestResult({
          success: false,
          error: result.error || 'Test failed',
          duration: result.duration
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Request failed',
        duration: 0
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* URL and Method */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          API URL *
        </label>
        <VariableInput
          value={config.url || ''}
          onChange={(value) => updateConfig({ url: value })}
          placeholder="https://api.example.com/endpoint"
          flowVariables={flowVariables}
          systemVariables={systemVariables.getDefinitions()}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            HTTP Method
          </label>
          <select
            value={config.method || 'GET'}
            onChange={(e) => updateConfig({ method: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Timeout (seconds)
          </label>
          <input
            type="number"
            value={config.timeout || 30}
            onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) || 30 })}
            min="1"
            max="300"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
      </div>

      {/* Authentication */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700">
          Authentication
        </label>

        <select
          value={config.auth_type || 'none'}
          onChange={(e) => updateConfig({ auth_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="none">No Authentication</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="api_key">API Key</option>
        </select>

        {config.auth_type === 'bearer' && (
          <VariableInput
            value={config.bearer_token || ''}
            onChange={(value) => updateConfig({ bearer_token: value })}
            placeholder="Bearer token"
            flowVariables={flowVariables}
            systemVariables={systemVariables.getDefinitions()}
          />
        )}

        {config.auth_type === 'basic' && (
          <div className="grid grid-cols-2 gap-3">
            <VariableInput
              value={config.basic_username || ''}
              onChange={(value) => updateConfig({ basic_username: value })}
              placeholder="Username"
              flowVariables={flowVariables}
              systemVariables={systemVariables.getDefinitions()}
            />
            <VariableInput
              value={config.basic_password || ''}
              onChange={(value) => updateConfig({ basic_password: value })}
              placeholder="Password"
              flowVariables={flowVariables}
              systemVariables={systemVariables.getDefinitions()}
            />
          </div>
        )}

        {config.auth_type === 'api_key' && (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={config.api_key_header || ''}
              onChange={(e) => updateConfig({ api_key_header: e.target.value })}
              placeholder="Header name (e.g., X-API-Key)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <VariableInput
              value={config.api_key_value || ''}
              onChange={(value) => updateConfig({ api_key_value: value })}
              placeholder="API key value"
              flowVariables={flowVariables}
              systemVariables={systemVariables.getDefinitions()}
            />
          </div>
        )}
      </div>

      {/* Headers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Custom Headers
          </label>
          <button
            onClick={addHeader}
            className="flex items-center gap-1 px-2 py-1 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Header
          </button>
        </div>

        <div className="space-y-2">
          {headers.map((header, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={header.enabled}
                onChange={(e) => updateHeader(index, 'enabled', e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <input
                type="text"
                value={header.key}
                onChange={(e) => updateHeader(index, 'key', e.target.value)}
                placeholder="Header name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <VariableInput
                value={header.value}
                onChange={(value) => updateHeader(index, 'value', value)}
                placeholder="Header value"
                flowVariables={flowVariables}
                systemVariables={systemVariables.getDefinitions()}
                className="flex-1"
              />
              <button
                onClick={() => removeHeader(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Request Body */}
      {config.method !== 'GET' && config.method !== 'HEAD' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Request Body (JSON)
          </label>
          <VariableInput
            value={typeof config.body === 'string' ? config.body : JSON.stringify(config.body || {}, null, 2)}
            onChange={(value) => {
              try {
                const parsed = JSON.parse(value);
                updateConfig({ body: parsed });
              } catch {
                updateConfig({ body: value });
              }
            }}
            placeholder='{"key": "value", "data": "{{variable}}"}'
            flowVariables={flowVariables}
            systemVariables={systemVariables.getDefinitions()}
            multiline
            rows={6}
          />
        </div>
      )}

      {/* Response Variable Name */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Save Response As Variable
        </label>
        <input
          type="text"
          value={config.save_as || ''}
          onChange={(e) => updateConfig({ save_as: e.target.value })}
          placeholder="response (creates {{nodename.nodeid.response}})"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p className="text-xs text-gray-500">
          Response will be available as variables:
          <br />
          <code className="text-orange-600">{'{{nodename.nodeid.response.status}}'}</code>,
          <code className="text-orange-600 ml-2">{'{{nodename.nodeid.response.body}}'}</code>,
          <code className="text-orange-600 ml-2">{'{{nodename.nodeid.response.headers}}'}</code>
        </p>
      </div>

      {/* Test API Button */}
      <div className="pt-6 border-t-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Test API</h3>
          <span className="text-xs text-gray-500">Test without running full flow</span>
        </div>

        <button
          onClick={testApiCall}
          disabled={testing || !config.url}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-700 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
        >
          {testing ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              Testing API...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Test API Call
            </>
          )}
        </button>

        <p className="mt-2 text-xs text-center text-gray-500">
          This will execute a real API call with your current configuration
        </p>
      </div>

      {/* Enhanced Test Results */}
      {testResult && (
        <div className={`rounded-lg border-2 ${
          testResult.success
            ? 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        }`}>
          <div className="p-5">
            <div className="flex items-start gap-4">
              {testResult.success ? (
                <CheckCircle className="w-7 h-7 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-7 h-7 text-red-600 mt-0.5 flex-shrink-0" />
              )}

              <div className="flex-1 space-y-4">
                {/* Status Header */}
                <div className="flex items-center justify-between">
                  <h4 className={`text-xl font-bold ${
                    testResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {testResult.status} {testResult.statusText}
                  </h4>
                  <span className="text-sm font-mono bg-white px-3 py-1 rounded-full border">
                    {testResult.duration}ms
                  </span>
                </div>

                {/* Auto-Generated Variables Preview */}
                {testResult.success && testResult.variables_generated && testResult.variables_generated.length > 0 && (
                  <div className="p-4 bg-white rounded-lg border border-green-200">
                    <h5 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <span>📊</span> Auto-Generated Variables
                    </h5>
                    <div className="space-y-1 text-xs">
                      {testResult.variables_generated.slice(0, 8).map((varName, i) => (
                        <div key={i} className="font-mono text-blue-600">
                          {'{{' + varName + '}}'}
                        </div>
                      ))}
                      {testResult.variables_generated.length > 8 && (
                        <div className="text-gray-500 italic">
                          +{testResult.variables_generated.length - 8} more variables...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Request Details */}
                {testResult.requestDetails && (
                  <details className="bg-white rounded-lg border">
                    <summary
                      className="cursor-pointer p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between"
                      onClick={() => setShowRequestDetails(!showRequestDetails)}
                    >
                      <span>📤 Request Details</span>
                      {showRequestDetails ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </summary>
                    <div className="p-4 border-t space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">URL</div>
                        <div className="text-xs font-mono bg-gray-50 p-2 rounded break-all">
                          {testResult.requestDetails.url}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1">Method</div>
                        <span className="inline-block text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {testResult.requestDetails.method}
                        </span>
                      </div>
                      {testResult.requestDetails.body && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-1">Body</div>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(testResult.requestDetails.body, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                )}

                {/* Response Headers */}
                {testResult.headers && (
                  <details className="bg-white rounded-lg border">
                    <summary
                      className="cursor-pointer p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between"
                      onClick={() => setShowResponseHeaders(!showResponseHeaders)}
                    >
                      <span>📋 Response Headers</span>
                      {showResponseHeaders ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </summary>
                    <div className="p-4 border-t">
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                        {JSON.stringify(testResult.headers, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}

                {/* Response Body */}
                {testResult.body && (
                  <details className="bg-white rounded-lg border" open>
                    <summary className="cursor-pointer p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                      <span>📥 Response Body</span>
                      <ChevronDown className="w-4 h-4" />
                    </summary>
                    <div className="p-4 border-t">
                      <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-96">
                        {typeof testResult.body === 'string'
                          ? testResult.body
                          : JSON.stringify(testResult.body, null, 2)}
                      </pre>
                    </div>
                  </details>
                )}

                {/* Error Display */}
                {testResult.error && (
                  <div className="p-3 bg-red-100 rounded-lg border border-red-200">
                    <div className="text-sm font-semibold text-red-900 mb-1">Error</div>
                    <div className="text-sm text-red-700">{testResult.error}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
