import { useState } from 'react';
import { Database, Play, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import VariableInput from './VariableInput';

interface DatabaseQueryConfigProps {
  config: any;
  onChange: (config: any) => void;
}

interface TestResult {
  success: boolean;
  data?: any[];
  rows_affected?: number;
  duration?: number;
  error?: string;
}

export default function DatabaseQueryConfig({ config, onChange }: DatabaseQueryConfigProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateConfig = (updates: Partial<any>) => {
    onChange({ ...config, ...updates });
  };

  const testDatabaseQuery = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const startTime = Date.now();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/database-query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation: config.operation || 'select',
          table: config.table,
          query: config.query,
          filters: config.filters || {}
        })
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          data: data.data,
          rows_affected: data.rows_affected,
          duration
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Database query failed'
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
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
        <Database className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-purple-900 mb-1">Database Query Node</h4>
          <p className="text-sm text-purple-700">
            Execute SQL queries on your Supabase database. Supports SELECT, INSERT, UPDATE, and DELETE operations.
            Use variables like {'{{'} webhook.body.email {'}}'} in your queries.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Operation Type <span className="text-red-500">*</span>
        </label>
        <select
          value={config.operation || 'select'}
          onChange={(e) => updateConfig({ operation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="select">SELECT (Read Data)</option>
          <option value="insert">INSERT (Create New Record)</option>
          <option value="update">UPDATE (Modify Record)</option>
          <option value="delete">DELETE (Remove Record)</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Table Name <span className="text-red-500">*</span>
        </label>
        <VariableInput
          value={config.table || ''}
          onChange={(value) => updateConfig({ table: value })}
          placeholder="users"
        />
        <p className="text-xs text-gray-500">
          The database table to query. Can use variables: {'{{'} webhook.body.table_name {'}}'}

        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Custom SQL Query
          </label>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-orange-600 hover:text-orange-700"
          >
            {showAdvanced ? 'Use Simple Mode' : 'Use Advanced SQL'}
          </button>
        </div>

        {showAdvanced ? (
          <>
            <VariableInput
              value={config.query || ''}
              onChange={(value) => updateConfig({ query: value })}
              placeholder="SELECT * FROM users WHERE email = {{webhook.body.email}}"
              multiline
              rows={6}
            />
            <p className="text-xs text-gray-500">
              Write custom SQL with variable interpolation. Overrides operation and filters.
            </p>
          </>
        ) : (
          <>
            <VariableInput
              value={typeof config.filters === 'string' ? config.filters : JSON.stringify(config.filters || {}, null, 2)}
              onChange={(value) => {
                try {
                  const parsed = JSON.parse(value);
                  updateConfig({ filters: parsed });
                } catch {
                  updateConfig({ filters: value });
                }
              }}
              placeholder='{"email": "{{webhook.body.email}}", "status": "active"}'
              multiline
              rows={6}
            />
            <p className="text-xs text-gray-500">
              JSON filters for the query. Example: {'{'}"{'}'}email": "user@example.com"{'}'}
            </p>
          </>
        )}
      </div>

      {config.operation === 'select' && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Query Examples</h4>
          <div className="space-y-2 text-xs">
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="font-mono text-purple-600">SELECT * FROM users WHERE id = 123</div>
              <div className="text-gray-500 mt-1">Get user by ID</div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="font-mono text-purple-600">SELECT email, name FROM users WHERE status = 'active'</div>
              <div className="text-gray-500 mt-1">Get active users</div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200">
              <div className="font-mono text-purple-600">SELECT * FROM orders WHERE user_id = {'{{'}webhook.body.userId{'}}'}</div>
              <div className="text-gray-500 mt-1">Get orders with variable</div>
            </div>
          </div>
        </div>
      )}

      {config.operation === 'insert' && (
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>INSERT Example:</strong><br/>
            Table: <code className="bg-white px-2 py-0.5 rounded">users</code><br/>
            Filters: <code className="bg-white px-2 py-0.5 rounded">{'{'} "email": "user@example.com" {'}'}</code>
          </p>
        </div>
      )}

      {config.operation === 'update' && (
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>UPDATE Example:</strong><br/>
            Table: <code className="bg-white px-2 py-0.5 rounded">users</code><br/>
            Filters: <code className="bg-white px-2 py-0.5 rounded">{'{'}"{'}'}id": 123, "status": "inactive"{'}'}{'}'}</code>
          </p>
        </div>
      )}

      {config.operation === 'delete' && (
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <strong>⚠️ DELETE Warning:</strong> This operation permanently removes data. Use with caution.<br/>
            Filters: <code className="bg-white px-2 py-0.5 rounded">{'{'}"{'}'}id": 123{'}'}{'}'}</code>
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Save Result As
        </label>
        <input
          type="text"
          value={config.save_as || 'db_result'}
          onChange={(e) => updateConfig({ save_as: e.target.value })}
          placeholder="db_result"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        />
        <p className="text-xs text-gray-500">
          Variable name for accessing query results: {'{{'}db_result{'}}'} or {'{{'}db_result.0.email{'}}'}

        </p>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Test Database Query</h3>
          <button
            onClick={testDatabaseQuery}
            disabled={testing || !config.table}
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
                Test Query
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
                  {testResult.success ? 'Query Executed Successfully' : 'Query Failed'}
                </h4>

                {testResult.success ? (
                  <div className="space-y-2">
                    <div className="bg-white rounded p-3 border border-green-200 max-h-64 overflow-auto">
                      <pre className="text-xs text-gray-900">{JSON.stringify(testResult.data, null, 2)}</pre>
                    </div>
                    <div className="flex gap-4 text-xs text-green-700">
                      <span>Rows: {testResult.data?.length || testResult.rows_affected || 0}</span>
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
