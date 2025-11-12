import { useState, useEffect } from 'react';
import { Play, RefreshCw, Loader, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import VariableInput from './VariableInput';
import { FlowVariable, SystemVariables } from '../lib/variableSystem';
import { supabase } from '../lib/api';

interface GoogleSheetsConfigProps {
  config: any;
  onChange: (config: any) => void;
  flowVariables?: FlowVariable[];
}

interface Spreadsheet {
  id: string;
  name: string;
}

interface Worksheet {
  id: string;
  title: string;
}

export default function GoogleSheetsConfig({ config, onChange, flowVariables = [] }: GoogleSheetsConfigProps) {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loadingSpreadsheets, setLoadingSpreadsheets] = useState(false);
  const [loadingWorksheets, setLoadingWorksheets] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const systemVariables = new SystemVariables();

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (config.spreadsheet_id) {
      loadWorksheets();
    }
  }, [config.spreadsheet_id]);

  const checkAuthentication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('google_sheets_refresh_token')
        .eq('id', user.id)
        .single();

      setIsAuthenticated(!!profile?.google_sheets_refresh_token);

      if (profile?.google_sheets_refresh_token) {
        loadSpreadsheets();
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  };

  const authenticateWithGoogle = async () => {
    alert(
      '📋 Google Sheets Authentication Setup Required:\n\n' +
      '1. Go to Settings → Integrations\n' +
      '2. Click "Connect Google Sheets"\n' +
      '3. Complete OAuth authentication\n' +
      '4. Return here to select your spreadsheet'
    );
  };

  const loadSpreadsheets = async () => {
    setLoadingSpreadsheets(true);
    try {
      // Call Edge Function to list spreadsheets
      const { data, error } = await supabase.functions.invoke('google-sheets-list', {
        body: { action: 'list_spreadsheets' }
      });

      if (error) throw error;

      setSpreadsheets(data.spreadsheets || []);
    } catch (error: any) {
      console.error('Error loading spreadsheets:', error);
      alert(`Failed to load spreadsheets: ${error.message}`);
    } finally {
      setLoadingSpreadsheets(false);
    }
  };

  const loadWorksheets = async () => {
    if (!config.spreadsheet_id) return;

    setLoadingWorksheets(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-list', {
        body: {
          action: 'list_worksheets',
          spreadsheet_id: config.spreadsheet_id
        }
      });

      if (error) throw error;

      setWorksheets(data.worksheets || []);
    } catch (error: any) {
      console.error('Error loading worksheets:', error);
      alert(`Failed to load worksheets: ${error.message}`);
    } finally {
      setLoadingWorksheets(false);
    }
  };

  const updateConfig = (updates: Partial<any>) => {
    onChange({ ...config, ...updates });
  };

  const testOperation = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const operation = config.operation || 'create_row';
      const rowData = config.row_data || {};

      const { data, error } = await supabase.functions.invoke('google-sheets-operation', {
        body: {
          spreadsheet_id: config.spreadsheet_id,
          worksheet_id: config.worksheet_id,
          operation,
          row_data: rowData
        }
      });

      if (error) throw error;

      setTestResult({
        success: true,
        message: 'Operation completed successfully',
        data
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Google Sheets Authentication Required
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Connect your Google account to use Google Sheets integration
          </p>
          <button
            onClick={authenticateWithGoogle}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Connect Google Sheets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Spreadsheet Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Select Spreadsheet *
          </label>
          <button
            onClick={loadSpreadsheets}
            disabled={loadingSpreadsheets}
            className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSpreadsheets ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <select
          value={config.spreadsheet_id || ''}
          onChange={(e) => {
            updateConfig({ spreadsheet_id: e.target.value, worksheet_id: '' });
          }}
          disabled={loadingSpreadsheets}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="">-- Select Spreadsheet --</option>
          {spreadsheets.map(sheet => (
            <option key={sheet.id} value={sheet.id}>
              {sheet.name}
            </option>
          ))}
        </select>
      </div>

      {/* Worksheet Selection */}
      {config.spreadsheet_id && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Select Worksheet (Tab) *
          </label>
          <select
            value={config.worksheet_id || ''}
            onChange={(e) => updateConfig({ worksheet_id: e.target.value })}
            disabled={loadingWorksheets}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="">-- Select Worksheet --</option>
            {worksheets.map(sheet => (
              <option key={sheet.id} value={sheet.id}>
                {sheet.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Operation Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Operation *
        </label>
        <select
          value={config.operation || 'create_row'}
          onChange={(e) => updateConfig({ operation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="create_row">Create New Row</option>
          <option value="update_row">Update Existing Row</option>
        </select>
      </div>

      {/* Row Data Configuration */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Row Data (JSON Format)
        </label>
        <VariableInput
          value={typeof config.row_data === 'string'
            ? config.row_data
            : JSON.stringify(config.row_data || {}, null, 2)}
          onChange={(value) => {
            try {
              const parsed = JSON.parse(value);
              updateConfig({ row_data: parsed });
            } catch {
              updateConfig({ row_data: value });
            }
          }}
          placeholder={'{\n  "Name": "{{user.name}}",\n  "Email": "{{user.email}}",\n  "Date": "{{system.current_date}}"\n}'}
          flowVariables={flowVariables}
          systemVariables={systemVariables.getDefinitions()}
          multiline
          rows={8}
        />
        <p className="text-xs text-gray-500">
          Use column names as keys. Values can include variables from previous nodes.
        </p>
      </div>

      {/* Update Row Specific Fields */}
      {config.operation === 'update_row' && (
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Find Row By Column
            </label>
            <input
              type="text"
              value={config.find_column || ''}
              onChange={(e) => updateConfig({ find_column: e.target.value })}
              placeholder="Email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Find Row By Value
            </label>
            <VariableInput
              value={config.find_value || ''}
              onChange={(value) => updateConfig({ find_value: value })}
              placeholder="{{user.email}}"
              flowVariables={flowVariables}
              systemVariables={systemVariables.getDefinitions()}
            />
          </div>
        </>
      )}

      {/* Test Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={testOperation}
          disabled={testing || !config.spreadsheet_id || !config.worksheet_id}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {testing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Testing Operation...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Test Google Sheets Operation
            </>
          )}
        </button>
      </div>

      {/* Test Results */}
      {testResult && (
        <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className={`font-semibold mb-2 ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {testResult.success ? 'Operation Successful' : 'Operation Failed'}
              </h4>
              {testResult.message && (
                <p className="text-sm text-gray-700 mb-2">{testResult.message}</p>
              )}
              {testResult.error && (
                <p className="text-sm text-red-700">{testResult.error}</p>
              )}
              {testResult.data && (
                <details className="text-sm mt-2">
                  <summary className="cursor-pointer font-medium text-gray-700">
                    View Response Data
                  </summary>
                  <pre className="mt-2 p-2 bg-white rounded text-xs overflow-x-auto">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
