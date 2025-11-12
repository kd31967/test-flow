import { useState } from 'react';
import { RefreshCw, Play, AlertCircle, CheckCircle, Loader, Code } from 'lucide-react';
import VariableInput from './VariableInput';

interface TransformConfigProps {
  config: any;
  onChange: (config: any) => void;
}

interface TestResult {
  success: boolean;
  result?: any;
  duration?: number;
  error?: string;
}

export default function TransformConfig({ config, onChange }: TransformConfigProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const updateConfig = (updates: Partial<any>) => {
    onChange({ ...config, ...updates });
  };

  const testTransform = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const startTime = Date.now();

      const sampleData = {
        webhook: { body: { name: "Alice", age: 30, email: "alice@example.com" } },
        api: { response: { status: "success", data: [1, 2, 3] } }
      };

      const transformFunction = new Function('data', config.transform_code || 'return data;');
      const result = transformFunction(sampleData);

      const duration = Date.now() - startTime;

      setTestResult({
        success: true,
        result,
        duration
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || 'Transform execution failed'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3">
        <RefreshCw className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-indigo-900 mb-1">Transform Data Node</h4>
          <p className="text-sm text-indigo-700">
            Transform and manipulate data using JavaScript. Access variables, perform calculations,
            format strings, and create new data structures for use in downstream nodes.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Input Variables (JSON Array)
        </label>
        <VariableInput
          value={typeof config.input_variables === 'string' ? config.input_variables : JSON.stringify(config.input_variables || [], null, 2)}
          onChange={(value) => {
            try {
              const parsed = JSON.parse(value);
              updateConfig({ input_variables: parsed });
            } catch {
              updateConfig({ input_variables: value });
            }
          }}
          placeholder='["webhook.body", "api.response.data"]'
          multiline
          rows={3}
        />
        <p className="text-xs text-gray-500">
          List of variables to access in your transform code. Leave empty to access all available data.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Transform Code (JavaScript) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <textarea
            value={config.transform_code || ''}
            onChange={(e) => updateConfig({ transform_code: e.target.value })}
            placeholder="return { fullName: data.webhook.body.name, isAdult: data.webhook.body.age >= 18 };"
            rows={12}
            className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm resize-none"
          />
          <Code className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        </div>
        <p className="text-xs text-gray-500">
          JavaScript code to transform data. Use <code className="bg-gray-100 px-1 rounded">return</code> to output the result.
          Access variables via <code className="bg-gray-100 px-1 rounded">data.webhook.body.name</code>
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <Code className="w-4 h-4" />
          Transform Examples
        </h4>

        <div className="space-y-3">
          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Combine Fields</div>
            <pre className="text-xs text-indigo-600 overflow-x-auto">{`return {
  fullName: data.webhook.body.firstName + " " + data.webhook.body.lastName,
  email: data.webhook.body.email.toLowerCase()
};`}</pre>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Calculate Values</div>
            <pre className="text-xs text-indigo-600 overflow-x-auto">{`return {
  totalPrice: data.webhook.body.quantity * data.webhook.body.price,
  discountedPrice: data.webhook.body.price * 0.9,
  tax: (data.webhook.body.price * 0.9) * 0.1
};`}</pre>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Filter and Map Arrays</div>
            <pre className="text-xs text-indigo-600 overflow-x-auto">{`return {
  activeUsers: data.api.response.users.filter(u => u.status === 'active'),
  userEmails: data.api.response.users.map(u => u.email),
  count: data.api.response.users.length
};`}</pre>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Conditional Logic</div>
            <pre className="text-xs text-indigo-600 overflow-x-auto">{`const age = data.webhook.body.age;
return {
  category: age < 18 ? 'minor' : age < 65 ? 'adult' : 'senior',
  canDrive: age >= 16,
  canVote: age >= 18
};`}</pre>
          </div>

          <div className="bg-white p-3 rounded border border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Format Dates</div>
            <pre className="text-xs text-indigo-600 overflow-x-auto">{`const date = new Date(data.webhook.body.timestamp);
return {
  formatted: date.toLocaleDateString('en-US'),
  timestamp: date.getTime(),
  dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' })
};`}</pre>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Save Result As
        </label>
        <input
          type="text"
          value={config.save_as || 'transformed_data'}
          onChange={(e) => updateConfig({ save_as: e.target.value })}
          placeholder="transformed_data"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p className="text-xs text-gray-500">
          Variable name for accessing the transformed data: {'{{'}transformed_data.fullName{'}}'}

        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ Security Note</h4>
        <p className="text-xs text-yellow-800">
          Transform code runs in a sandboxed environment. Avoid using external APIs or sensitive operations.
          Keep transforms simple and focused on data manipulation.
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Transform</h3>
          <button
            onClick={testTransform}
            disabled={testing || !config.transform_code}
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
                Test Transform
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Sample Test Data:</h4>
          <pre className="text-xs text-gray-600 overflow-x-auto">{JSON.stringify({
            webhook: { body: { name: "Alice", age: 30, email: "alice@example.com" } },
            api: { response: { status: "success", data: [1, 2, 3] } }
          }, null, 2)}</pre>
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
                  {testResult.success ? 'Transform Executed Successfully' : 'Transform Failed'}
                </h4>

                {testResult.success ? (
                  <div className="space-y-2">
                    <div className="bg-white rounded p-3 border border-green-200 max-h-64 overflow-auto">
                      <pre className="text-xs text-gray-900">{JSON.stringify(testResult.result, null, 2)}</pre>
                    </div>
                    <div className="text-xs text-green-700">
                      Execution time: {testResult.duration}ms
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
