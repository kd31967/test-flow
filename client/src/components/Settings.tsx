import { useState, useEffect } from 'react';
import { X, Save, Eye, EyeOff, Copy, CheckCircle } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: SettingsProps) {
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedCustom, setCopiedCustom] = useState(false);
  
  const serverUrl = window.location.origin;
  const webhookUrl = `${serverUrl}/api/whatsapp-webhook`;
  const customWebhookUrl = `${serverUrl}/api/custom-webhook/{flow-name}/{node-id}`;
  const verifyToken = 'test-verify-token';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      
      const data = await response.json();
      if (data) {
        setPhoneNumberId(data.phoneNumberId || '');
        setAccessToken(data.whatsappAccessToken || '');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumberId,
          whatsappAccessToken: accessToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Settings saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="text-gray-600">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Global Settings</h2>
            <p className="text-sm text-gray-600 mt-1">Configure your WhatsApp Business API credentials</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">📱 WhatsApp Business Setup</h3>
            <p className="text-sm text-blue-800">
              To use this flow builder, you need a WhatsApp Business Account with API access. Get your credentials from the{' '}
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Meta Developer Portal
              </a>
              .
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number ID
            </label>
            <input
              type="text"
              value={phoneNumberId}
              onChange={(e) => setPhoneNumberId(e.target.value)}
              placeholder="712851615243145"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your WhatsApp Phone Number ID from Meta Business Manager
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAO4J3qeOYUBPTPA2WRa37XDbMctNlg..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
              >
                {showToken ? (
                  <EyeOff className="w-5 h-5 text-gray-500" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Your permanent access token from Meta for WhatsApp Business API
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-yellow-900 mb-1">⚠️ Security Notice</h4>
            <p className="text-xs text-yellow-800">
              Your credentials are stored securely in our database. Never share your access token publicly.
              These credentials will be used by all your active flows.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">How to get your credentials:</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Meta Developer Portal</a></li>
              <li>Create or select your WhatsApp Business App</li>
              <li>Navigate to WhatsApp &gt; API Setup</li>
              <li>Copy your Phone Number ID</li>
              <li>Generate a permanent access token</li>
              <li>Paste both values above and save</li>
            </ol>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-green-900 mb-2">🔗 WhatsApp Webhook URL</h4>
              <p className="text-xs text-green-800 mb-2">
                Configure this webhook URL in your Meta Developer Portal (WhatsApp → Configuration):
              </p>
              <div className="bg-white border border-green-300 rounded px-3 py-2 font-mono text-xs break-all mb-2 flex items-center justify-between gap-2">
                <span>{webhookUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors"
                  title="Copy URL"
                  data-testid="button-copy-webhook"
                >
                  {copiedWebhook ? (
                    <CheckCircle className="w-4 h-4 text-green-700" />
                  ) : (
                    <Copy className="w-4 h-4 text-green-700" />
                  )}
                </button>
              </div>
              <p className="text-xs text-green-700">
                Verify Token: <span className="font-semibold bg-green-100 px-2 py-0.5 rounded">{verifyToken}</span>
              </p>
            </div>

            <div className="border-t border-green-300 pt-4">
              <h4 className="text-sm font-semibold text-green-900 mb-2">🔄 Custom Webhook URL Pattern</h4>
              <p className="text-xs text-green-800 mb-2">
                Each webhook node gets its own unique URL automatically. Pattern:
              </p>
              <div className="bg-white border border-green-300 rounded px-3 py-2 font-mono text-xs break-all mb-2 flex items-center justify-between gap-2">
                <span>{customWebhookUrl}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(customWebhookUrl);
                    setCopiedCustom(true);
                    setTimeout(() => setCopiedCustom(false), 2000);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors"
                  title="Copy pattern"
                  data-testid="button-copy-custom-webhook"
                >
                  {copiedCustom ? (
                    <CheckCircle className="w-4 h-4 text-green-700" />
                  ) : (
                    <Copy className="w-4 h-4 text-green-700" />
                  )}
                </button>
              </div>
              <p className="text-xs text-green-700">
                Each <strong>Catch Webhook</strong> node shows its unique URL in the configuration panel.
              </p>
              <p className="text-xs text-green-700 mt-1">
                Example: <span className="font-mono bg-green-100 px-1">{serverUrl}/api/custom-webhook/my-flow/node_123</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            disabled={saving || !phoneNumberId || !accessToken}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
