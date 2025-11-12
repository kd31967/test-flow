import { useState } from 'react';
import { Mail, Play, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import VariableInput from './VariableInput';

interface EmailConfigProps {
  config: any;
  onChange: (config: any) => void;
}

interface TestResult {
  success: boolean;
  message_id?: string;
  duration?: number;
  error?: string;
}

export default function EmailConfig({ config, onChange }: EmailConfigProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const updateConfig = (updates: Partial<any>) => {
    onChange({ ...config, ...updates });
  };

  const testEmail = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const startTime = Date.now();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: config.to,
          subject: config.subject,
          body: config.body,
          html: config.html !== false,
          from_name: config.from_name
        })
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message_id: data.message_id,
          duration
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Email sending failed'
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Network error occurred'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">Email Node</h4>
          <p className="text-sm text-blue-700">
            Send emails to users with dynamic content. Supports HTML and plain text formats.
            Use variables like {'{{'} webhook.body.email {'}}'} for dynamic recipients and content.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          To Email <span className="text-red-500">*</span>
        </label>
        <VariableInput
          value={config.to || ''}
          onChange={(value) => updateConfig({ to: value })}
          placeholder="{{webhook.body.email}}"
        />
        <p className="text-xs text-gray-500">
          Recipient email address. Can use variables or hardcode: user@example.com
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          From Name
        </label>
        <input
          type="text"
          value={config.from_name || ''}
          onChange={(e) => updateConfig({ from_name: e.target.value })}
          placeholder="Your Company Name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p className="text-xs text-gray-500">
          Display name shown to recipients (e.g., "Your Company" or "Support Team")
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Subject <span className="text-red-500">*</span>
        </label>
        <VariableInput
          value={config.subject || ''}
          onChange={(value) => updateConfig({ subject: value })}
          placeholder="Welcome {{webhook.body.name}}!"
        />
        <p className="text-xs text-gray-500">
          Email subject line. Variables will be replaced with actual values.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Email Body <span className="text-red-500">*</span>
        </label>
        <VariableInput
          value={config.body || ''}
          onChange={(value) => updateConfig({ body: value })}
          placeholder="Hello {{webhook.body.name}}, welcome to our platform!"
          multiline
          rows={10}
        />
        <p className="text-xs text-gray-500">
          Email content. Supports HTML if enabled below, otherwise plain text.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.html !== false}
            onChange={(e) => updateConfig({ html: e.target.checked })}
            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
          />
          <span className="text-sm font-medium text-gray-700">Send as HTML</span>
        </label>
        <span className="text-xs text-gray-500">
          Enable to send formatted HTML emails with styling
        </span>
      </div>

      {config.html !== false && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">HTML Email Example</h4>
          <div className="bg-white p-3 rounded border border-gray-200">
            <pre className="text-xs text-gray-800 overflow-x-auto">{`<html>
  <body style="font-family: Arial, sans-serif;">
    <h1>Welcome {{webhook.body.name}}!</h1>
    <p>Thank you for signing up.</p>
    <a href="https://example.com/verify?token={{webhook.body.token}}"
       style="background: #f97316; color: white; padding: 10px 20px;
              text-decoration: none; border-radius: 5px;">
      Verify Email
    </a>
  </body>
</html>`}</pre>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">📧 Email Configuration Required</h4>
        <p className="text-xs text-yellow-800">
          To send emails, configure your SMTP settings or email service API keys in the environment variables.
          Supported providers: SendGrid, Resend, Mailgun, AWS SES, or custom SMTP.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Email</h3>
          <button
            onClick={testEmail}
            disabled={testing || !config.to || !config.subject || !config.body}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Send Test Email
              </>
            )}
          </button>
        </div>

        {testResult && (
          <div className={`rounded-lg p-4 ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium ${testResult.success ? 'text-green-900' : 'text-red-900'} mb-2`}>
                  {testResult.success ? 'Email Sent Successfully' : 'Email Sending Failed'}
                </h4>

                {testResult.success ? (
                  <div className="space-y-2">
                    <p className="text-sm text-green-700">
                      Email has been queued for delivery to {config.to}
                    </p>
                    <div className="flex gap-4 text-xs text-green-700">
                      {testResult.message_id && <span>Message ID: {testResult.message_id}</span>}
                      <span>Duration: {testResult.duration}ms</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-700">{testResult.error}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
