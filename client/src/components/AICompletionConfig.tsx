import { useState } from 'react';
import { Brain, Play, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import VariableInput from './VariableInput';

interface AICompletionConfigProps {
  config: any;
  onChange: (config: any) => void;
}

interface TestResult {
  success: boolean;
  response?: string;
  tokens_used?: number;
  duration?: number;
  error?: string;
}

export default function AICompletionConfig({ config, onChange }: AICompletionConfigProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const updateConfig = (updates: Partial<any>) => {
    onChange({ ...config, ...updates });
  };

  const testAICompletion = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const startTime = Date.now();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-completion`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: config.provider || 'openai',
          model: config.model || 'gpt-3.5-turbo',
          system_prompt: config.system_prompt || '',
          prompt: config.prompt || 'Hello, this is a test',
          temperature: config.temperature || 0.7,
          max_tokens: config.max_tokens || 1000
        })
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          response: data.response,
          tokens_used: data.tokens_used,
          duration
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'AI completion failed'
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
        <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900 mb-1">AI Completion Node</h4>
          <p className="text-sm text-blue-700">
            Generate AI responses using GPT or Claude. Configure your AI provider, model, and prompts.
            Variables like {'{{'} webhook.body.query {'}}'} will be automatically interpolated.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          AI Provider <span className="text-red-500">*</span>
        </label>
        <select
          value={config.provider || 'openai'}
          onChange={(e) => updateConfig({ provider: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="openai">OpenAI (GPT)</option>
          <option value="anthropic">Anthropic (Claude)</option>
        </select>
        <p className="text-xs text-gray-500">
          Choose your AI provider. Requires API key configuration.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Model <span className="text-red-500">*</span>
        </label>
        <select
          value={config.model || 'gpt-3.5-turbo'}
          onChange={(e) => updateConfig({ model: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          {config.provider === 'anthropic' ? (
            <>
              <option value="claude-3-opus">Claude 3 Opus (Most capable)</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet (Balanced)</option>
              <option value="claude-3-haiku">Claude 3 Haiku (Fast)</option>
            </>
          ) : (
            <>
              <option value="gpt-4">GPT-4 (Most capable)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo (Fast)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Cost-effective)</option>
            </>
          )}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          System Prompt
        </label>
        <VariableInput
          value={config.system_prompt || ''}
          onChange={(value) => updateConfig({ system_prompt: value })}
          placeholder="You are a helpful assistant that provides concise answers..."
          multiline
          rows={3}
        />
        <p className="text-xs text-gray-500">
          Set the AI's behavior and personality. Leave empty for default behavior.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          User Prompt <span className="text-red-500">*</span>
        </label>
        <VariableInput
          value={config.prompt || ''}
          onChange={(value) => updateConfig({ prompt: value })}
          placeholder="Generate a response for: {{webhook.body.query}}"
          multiline
          rows={4}
        />
        <p className="text-xs text-gray-500">
          The main prompt sent to the AI. Use variables to include dynamic content.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Temperature
          </label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={config.temperature || 0.7}
            onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <p className="text-xs text-gray-500">
            0 = deterministic, 1 = creative
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Max Tokens
          </label>
          <input
            type="number"
            min="1"
            max="4000"
            value={config.max_tokens || 1000}
            onChange={(e) => updateConfig({ max_tokens: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
          <p className="text-xs text-gray-500">
            Maximum response length
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Save Response As
        </label>
        <input
          type="text"
          value={config.save_as || 'ai_response'}
          onChange={(e) => updateConfig({ save_as: e.target.value })}
          placeholder="ai_response"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p className="text-xs text-gray-500">
          Variable name for accessing the AI response in downstream nodes: {'{{'}ai_response{'}}'}

        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Test AI Completion</h3>
          <button
            onClick={testAICompletion}
            disabled={testing || !config.prompt}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Test AI Call
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
                  {testResult.success ? 'AI Response Generated' : 'AI Completion Failed'}
                </h4>

                {testResult.success ? (
                  <div className="space-y-2">
                    <div className="bg-white rounded p-3 border border-green-200">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{testResult.response}</p>
                    </div>
                    <div className="flex gap-4 text-xs text-green-700">
                      <span>Tokens: {testResult.tokens_used}</span>
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
