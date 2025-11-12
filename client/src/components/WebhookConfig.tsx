import { useState, useEffect } from 'react';
import { Copy, RefreshCw, CheckCircle, XCircle, Play, Loader, ChevronDown } from 'lucide-react';
import { generateWebhookId, FlowVariable } from '../lib/variableSystem';
import { generateWebhookUrl } from '../config/environment';

interface WebhookConfigProps {
  config: any;
  onChange: (config: any) => void;
  nodeId: string;
  flowId?: string;
  flowName?: string;
  flowVariables?: FlowVariable[];
}

interface TestRequest {
  method: string;
  headers: Record<string, string>;
  body: any;
  timestamp: string;
}

export default function WebhookConfig({ config, onChange, nodeId, flowId, flowName, flowVariables = [] }: WebhookConfigProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testRequests, setTestRequests] = useState<TestRequest[]>([]);

  useEffect(() => {
    // Generate DYNAMIC webhook URL using flow_name and node_id
    // Format: {SUPABASE_URL}/functions/v1/custom-webhook/:flow_name/:node_id
    // Use flow name for easier identification, fallback to flowId if no name
    const identifier = flowName || flowId || 'untitled_flow';
    if (identifier && nodeId) {
      // Create URL-friendly flow identifier
      const urlFriendlyName = identifier.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const url = generateWebhookUrl(urlFriendlyName, nodeId);
      setWebhookUrl(url);

      // Store the URL in config for easy access
      // Only update if URL changed, and preserve existing allowed_methods
      if (config.webhook_url !== url) {
        const updates: any = {
          ...config,
          webhook_url: url,
          flow_id: flowId,
          flow_name: flowName,
          url_identifier: urlFriendlyName,
          node_id: nodeId
        };
        
        // Only set default allowed_methods if not already set
        if (!config.allowed_methods || config.allowed_methods.length === 0) {
          updates.allowed_methods = ['GET', 'POST', 'DELETE'];
        }
        
        onChange(updates);
      }
    }
  }, [flowId, nodeId, flowName]);

  const updateConfig = (updates: Partial<any>) => {
    onChange({ ...config, ...updates });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateWebhook = () => {
    const newWebhookId = generateWebhookId();
    updateConfig({ webhook_id: newWebhookId });
  };

  const sendTestWebhook = async () => {
    if (!webhookUrl) return;

    setTesting(true);

    try {
      const testData = {
        test: true,
        message: 'This is a test webhook call',
        timestamp: new Date().toISOString(),
        data: {
          sample_field_1: 'value1',
          sample_field_2: 'value2',
          nested: {
            field: 'nested_value'
          }
        }
      };

      const response = await fetch(webhookUrl, {
        method: config.allowed_methods?.includes('POST') ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Webhook': 'true'
        },
        body: config.allowed_methods?.includes('POST') ? JSON.stringify(testData) : undefined
      });

      const testRequest: TestRequest = {
        method: config.allowed_methods?.includes('POST') ? 'POST' : 'GET',
        headers: { 'Content-Type': 'application/json', 'X-Test-Webhook': 'true' },
        body: testData,
        timestamp: new Date().toISOString()
      };

      setTestRequests([testRequest, ...testRequests.slice(0, 4)]);

      if (response.ok) {
        alert('✅ Test webhook sent successfully!');
      } else {
        alert(`⚠️ Webhook returned status: ${response.status}`);
      }
    } catch (error: any) {
      alert(`❌ Test webhook failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const isFlowSaved = flowId && flowId !== 'flow_id_here' && flowName && flowName !== 'Untitled Flow';

  return (
    <div className="space-y-6">
      {/* Flow Save Warning */}
      {!isFlowSaved && (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">⚠️ Save Flow First!</h4>
              <p className="text-sm text-yellow-800">
                The webhook URL will not work until you save this flow. Click the <strong>Save</strong> button above to activate the webhook.
              </p>
              <p className="text-xs text-yellow-700 mt-2">
                Current URL is a placeholder and will return "Flow not found" error if called.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {isFlowSaved && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-900">Webhook Active</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            This webhook is ready to receive requests from external services.
          </p>
        </div>
      )}

      {/* Detected Server Info */}
      <div className="p-3 bg-gray-50 border border-gray-300 rounded-lg">
        <div className="text-xs text-gray-600 mb-1">
          Detected Server Origin:
        </div>
        <code className="text-xs font-mono text-gray-900">
          {window.location.origin}
        </code>
        <div className="text-xs text-gray-500 mt-1">
          All webhook URLs use this actual running server address
        </div>
      </div>

      {/* Webhook URL Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Webhook URL
          <span className="ml-2 text-xs text-blue-600 font-normal">
            (Auto-Generated - No Hardcoded URLs)
          </span>
        </label>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <code className="text-xs text-blue-900 break-all">
            {webhookUrl}
          </code>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy URL
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Use this URL to receive data from external services. Each request creates variables automatically.
        </p>
      </div>

      {/* URL Structure Info */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">URL Structure</h4>
        <div className="space-y-1 text-xs text-gray-600 font-mono">
          <div><span className="text-gray-400">[Base URL]</span>/api/custom-webhook/</div>
          <div><span className="text-orange-600">{flowName || flowId || 'flow-name'}</span> <span className="text-gray-400">← Flow Name (URL-friendly)</span></div>
          <div><span className="text-blue-600">{nodeId || 'node_id'}</span> <span className="text-gray-400">← Node ID (Unique)</span></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Each webhook node gets a unique URL based on flow name and node ID
        </p>
      </div>

      {/* Webhook ID */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Webhook ID
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={config.webhook_id || ''}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
          />
          <button
            onClick={regenerateWebhook}
            className="px-3 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
            title="Regenerate webhook ID"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate
          </button>
        </div>
        <p className="text-xs text-orange-600">
          ⚠️ Regenerating will invalidate the old webhook URL
        </p>
      </div>

      {/* Allowed HTTP Methods */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Allowed HTTP Methods
          </label>
          <p className="text-xs text-gray-500">
            Select which HTTP methods this webhook will accept
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => {
            const methodColors = {
              GET: 'border-blue-300 bg-blue-50 hover:bg-blue-100',
              POST: 'border-green-300 bg-green-50 hover:bg-green-100',
              PUT: 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100',
              PATCH: 'border-purple-300 bg-purple-50 hover:bg-purple-100',
              DELETE: 'border-red-300 bg-red-50 hover:bg-red-100'
            };
            const isSelected = config.allowed_methods?.includes(method);
            
            return (
              <label 
                key={method} 
                className={`flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected 
                    ? methodColors[method as keyof typeof methodColors] + ' ring-2 ring-offset-1 ring-orange-400'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                data-testid={`checkbox-http-${method.toLowerCase()}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    const methods = config.allowed_methods || [];
                    if (e.target.checked) {
                      updateConfig({ allowed_methods: [...methods, method] });
                    } else {
                      updateConfig({ allowed_methods: methods.filter((m: string) => m !== method) });
                    }
                  }}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
                <span className={`text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{method}</span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Select which HTTP methods this webhook accepts
        </p>
      </div>

      {/* Webhook Status */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Webhook Status
        </label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={config.status === 'active'}
              onChange={() => updateConfig({ status: 'active' })}
              className="w-4 h-4 text-orange-600 focus:ring-orange-500"
            />
            <span className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Active
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={config.status === 'inactive'}
              onChange={() => updateConfig({ status: 'inactive' })}
              className="w-4 h-4 text-orange-600 focus:ring-orange-500"
            />
            <span className="flex items-center gap-2 text-sm">
              <XCircle className="w-4 h-4 text-gray-400" />
              Inactive
            </span>
          </label>
        </div>
        <p className="text-xs text-gray-500">
          Inactive webhooks will reject all incoming requests
        </p>
      </div>

      {/* Security */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700">
          Security Options
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.require_secret || false}
            onChange={(e) => updateConfig({ require_secret: e.target.checked })}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
          />
          <span className="text-sm">Require Secret Token</span>
        </label>

        {config.require_secret && (
          <input
            type="text"
            value={config.secret_token || ''}
            onChange={(e) => updateConfig({ secret_token: e.target.value })}
            placeholder="Enter secret token"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.validate_signature || false}
            onChange={(e) => updateConfig({ validate_signature: e.target.checked })}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
          />
          <span className="text-sm">Validate Request Signature</span>
        </label>
      </div>

      {/* Auto-Generated Variables Info */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="text-sm font-semibold text-purple-900 mb-3">
          Auto-Generated Variables
        </h4>
        <div className="space-y-2 text-xs text-purple-800">
          <div>
            <span className="font-mono bg-purple-100 px-2 py-1 rounded">
              {'{{webhook.method}}'}
            </span>
            <span className="ml-2">HTTP method</span>
          </div>
          <div>
            <span className="font-mono bg-purple-100 px-2 py-1 rounded">
              {'{{webhook.body.*}}'}
            </span>
            <span className="ml-2">All body parameters</span>
          </div>
          <div>
            <span className="font-mono bg-purple-100 px-2 py-1 rounded">
              {'{{webhook.query.*}}'}
            </span>
            <span className="ml-2">All query parameters</span>
          </div>
          <div>
            <span className="font-mono bg-purple-100 px-2 py-1 rounded">
              {'{{webhook.header.*}}'}
            </span>
            <span className="ml-2">All headers</span>
          </div>
          
          {/* Show actual captured variables */}
          {flowVariables && flowVariables.length > 0 && (
            <div className="mt-4 pt-3 border-t border-purple-300">
              <div className="font-semibold text-purple-900 mb-2">✨ Currently Available:</div>
              {flowVariables.slice(0, 8).map((v, idx) => (
                <div key={idx} className="ml-2">
                  <span className="font-mono bg-purple-100 px-2 py-1 rounded text-blue-600">
                    {'{{' + v.key + '}}'}
                  </span>
                </div>
              ))}
              {flowVariables.length > 8 && (
                <div className="ml-2 text-gray-500 italic">
                  +{flowVariables.length - 8} more variables...
                </div>
              )}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-purple-700">
          Variables are created automatically based on incoming request data. No configuration needed!
        </p>
      </div>

      {/* Test Webhook */}
      <div className="pt-6 border-t-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Webhook</h3>
          <span className="text-xs text-gray-500">Test without connecting third-party</span>
        </div>

        <button
          onClick={sendTestWebhook}
          disabled={testing || !webhookUrl || config.status === 'inactive'}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-700 hover:to-orange-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
        >
          {testing ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              Testing Webhook...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              Test Webhook
            </>
          )}
        </button>

        <p className="mt-2 text-xs text-center text-gray-500">
          This will send a sample request to test your webhook configuration
        </p>
      </div>

      {/* Test Request History */}
      {testRequests.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Recent Test Requests</h4>
          {testRequests.map((req, index) => (
            <details key={index} className="bg-white rounded-lg border">
              <summary className="cursor-pointer p-3 font-medium text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                <span>📤 {req.method} - {new Date(req.timestamp).toLocaleTimeString()}</span>
                <ChevronDown className="w-4 h-4" />
              </summary>
              <div className="p-4 border-t">
                <pre className="p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                  {JSON.stringify({ method: req.method, headers: req.headers, body: req.body }, null, 2)}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
