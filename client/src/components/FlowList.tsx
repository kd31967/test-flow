import { useState, useEffect, useRef } from 'react';
import { Plus, Play, Pause, Trash2, Copy, Settings as SettingsIcon, Download, Upload } from 'lucide-react';
import { supabase } from '../lib/api';

interface Flow {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active';
  trigger_keywords: string[];
  created_at: string;
  updated_at: string;
}

interface FlowListProps {
  onCreateNew: () => void;
  onEditFlow: (flowId: string) => void;
  onOpenSettings: () => void;
}

export default function FlowList({ onCreateNew, onEditFlow, onOpenSettings }: FlowListProps) {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    try {
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (error) {
      console.error('Error loading flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFlowStatus = async (flowId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'draft' : 'active';
      const { error } = await supabase
        .from('flows')
        .update({ status: newStatus })
        .eq('id', flowId);

      if (error) throw error;
      loadFlows();
    } catch (error) {
      console.error('Error toggling flow status:', error);
      alert('Failed to update flow status');
    }
  };

  const generateUniqueId = (): string => {
    return `node_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  };

  const deepCloneWithNewIds = (config: any): any => {
    if (!config) return {};

    // Deep clone the entire config
    const clonedConfig = JSON.parse(JSON.stringify(config));

    // Create ID mapping (old ID -> new ID)
    const idMap = new Map<string, string>();

    // First pass: Generate new IDs for all nodes
    if (clonedConfig.nodes && Array.isArray(clonedConfig.nodes)) {
      clonedConfig.nodes.forEach((node: any) => {
        if (node.id) {
          const newId = generateUniqueId();
          idMap.set(node.id, newId);
          node.id = newId;
        }

        // Handle button IDs for send_button nodes
        if (node.data?.config?.buttons && Array.isArray(node.data.config.buttons)) {
          node.data.config.buttons.forEach((button: any) => {
            if (button.id) {
              const newButtonId = `btn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
              idMap.set(button.id, newButtonId);
              button.id = newButtonId;
            }
          });
        }
      });
    }

    // Second pass: Update all references to old IDs
    if (clonedConfig.nodes && Array.isArray(clonedConfig.nodes)) {
      clonedConfig.nodes.forEach((node: any) => {
        // Update next node references
        if (node.data?.config?.next && idMap.has(node.data.config.next)) {
          node.data.config.next = idMap.get(node.data.config.next);
        }

        // Update button nextNodeId references
        if (node.data?.config?.buttons && Array.isArray(node.data.config.buttons)) {
          node.data.config.buttons.forEach((button: any) => {
            if (button.nextNodeId && idMap.has(button.nextNodeId)) {
              button.nextNodeId = idMap.get(button.nextNodeId);
            }
          });
        }

        // Update buttonBranches references
        if (node.data?.config?.buttonBranches) {
          const newBranches: any = {};
          Object.entries(node.data.config.buttonBranches).forEach(([buttonId, targetNodeId]) => {
            const newButtonId = idMap.get(buttonId) || buttonId;
            const newTargetId = idMap.has(targetNodeId as string) ? idMap.get(targetNodeId as string) : targetNodeId;
            newBranches[newButtonId] = newTargetId;
          });
          node.data.config.buttonBranches = newBranches;
        }

        // Update condition node branches (true/false paths)
        if (node.type === 'condition' && node.data?.config) {
          if (node.data.config.trueBranch && idMap.has(node.data.config.trueBranch)) {
            node.data.config.trueBranch = idMap.get(node.data.config.trueBranch);
          }
          if (node.data.config.falseBranch && idMap.has(node.data.config.falseBranch)) {
            node.data.config.falseBranch = idMap.get(node.data.config.falseBranch);
          }
        }
      });
    }

    return clonedConfig;
  };

  const duplicateFlow = async (flow: Flow) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in to duplicate flows');
        return;
      }

      // Fetch complete flow data
      const { data: flowData, error: fetchError } = await supabase
        .from('flows')
        .select('*')
        .eq('id', flow.id)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error(`Failed to fetch flow: ${fetchError.message}`);
      }

      // Deep clone config with new unique IDs
      const clonedConfig = deepCloneWithNewIds(flowData.config);

      // Generate unique name
      const timestamp = new Date().toISOString().split('T')[0];
      const copyCount = flows.filter(f => f.name.startsWith(flow.name)).length;
      const newName = `${flow.name} (Copy ${copyCount > 0 ? copyCount : ''})`;

      // Create new flow with cloned data
      const newFlow = {
        user_id: user.id,
        name: newName.trim(),
        description: flowData.description || '',
        status: 'draft' as const,
        category: flowData.category || 'Custom',
        trigger_keywords: Array.isArray(flowData.trigger_keywords)
          ? JSON.parse(JSON.stringify(flowData.trigger_keywords))
          : [],
        config: clonedConfig,
        metadata: flowData.metadata ? JSON.parse(JSON.stringify(flowData.metadata)) : {}
      };

      const { data: insertedFlow, error: insertError } = await supabase
        .from('flows')
        .insert(newFlow)
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to create duplicate: ${insertError.message}`);
      }

      alert(
        `✅ Flow duplicated successfully!\n\n` +
        `Original: ${flow.name}\n` +
        `Copy: ${insertedFlow.name}\n` +
        `Status: Draft\n` +
        `Nodes: ${clonedConfig?.nodes?.length || 0}\n\n` +
        `All node IDs and connections have been regenerated.`
      );

      loadFlows();
    } catch (error: any) {
      console.error('Error duplicating flow:', error);
      alert(`❌ Duplication Failed\n\n${error.message || 'Failed to duplicate flow'}`);
    }
  };

  const deleteFlow = async (flowId: string) => {
    if (!confirm('Are you sure you want to delete this flow? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', flowId);

      if (error) throw error;
      loadFlows();
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('Failed to delete flow');
    }
  };

  const exportFlow = async (flowId: string) => {
    try {
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('id', flowId)
        .single();

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name.replace(/\s+/g, '_')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting flow:', error);
      alert('Failed to export flow');
    }
  };

  const validateFlowData = (data: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Name field is optional - we'll generate one if missing
    // Just validate type if it exists
    if (data.name && typeof data.name !== 'string') {
      errors.push('Invalid "name" field - must be a string');
    }

    // Config is optional but if present should be valid
    if (data.config) {
      if (typeof data.config !== 'object' || data.config === null) {
        errors.push('Invalid "config" field - must be an object');
      }
    }

    // Validate trigger_keywords if present
    if (data.trigger_keywords !== undefined && !Array.isArray(data.trigger_keywords)) {
      errors.push('Invalid "trigger_keywords" - must be an array');
    }

    // Validate status if present
    if (data.status && !['draft', 'active', 'paused', 'archived'].includes(data.status)) {
      errors.push('Invalid "status" - must be draft, active, paused, or archived');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const importFlow = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset state
    setImporting(true);
    setImportProgress('Validating file...');

    try {
      // Validate file type
      if (!file.name.endsWith('.json')) {
        throw new Error('Invalid file type. Please select a JSON file (.json)');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 10MB');
      }

      if (file.size === 0) {
        throw new Error('File is empty');
      }

      setImportProgress('Reading file...');

      // Read file content
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (!result || result.trim() === '') {
            reject(new Error('File is empty or unreadable'));
          } else {
            resolve(result);
          }
        };
        reader.readAsText(file);
      });

      setImportProgress('Parsing JSON...');

      // Parse JSON
      let flowData;
      try {
        flowData = JSON.parse(content);
      } catch (parseError) {
        throw new Error('Invalid JSON format. Please check the file structure.');
      }

      // Validate flow data structure
      setImportProgress('Validating flow data...');
      const validation = validateFlowData(flowData);
      if (!validation.valid) {
        throw new Error(
          `Flow validation failed:\n\n${validation.errors.map(e => `• ${e}`).join('\n')}`
        );
      }

      setImportProgress('Checking authentication...');

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in to import flows');
      }

      setImportProgress('Preparing flow data...');

      // Prepare new flow (remove system fields, generate unique ID)
      const { id, created_at, updated_at, user_id, ...flowToImport } = flowData;

      // Generate unique name with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const baseName = flowData.name || 'Imported Flow';
      const newFlowName = `${baseName}_import_${timestamp}`;

      const newFlow = {
        ...flowToImport,
        user_id: user.id,
        name: newFlowName,
        status: 'draft' as const,
        description: flowData.description || '',
        category: flowData.category || 'Custom',
        trigger_keywords: Array.isArray(flowData.trigger_keywords) ? flowData.trigger_keywords : [],
        config: flowData.config || {},
        metadata: flowData.metadata || {}
      };

      setImportProgress('Saving to database...');

      // Insert into database
      const { data: insertedFlow, error: insertError } = await supabase
        .from('flows')
        .insert(newFlow)
        .select()
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to save flow: ${insertError.message}`);
      }

      setImportProgress('Import complete!');

      // Show success message
      alert(
        `✅ Flow imported successfully!\n\n` +
        `Name: ${insertedFlow.name}\n` +
        `Status: Draft\n` +
        `Nodes: ${newFlow.config?.nodes?.length || 0}\n\n` +
        `You can now edit and activate this flow.`
      );

      // Reload flows list
      await loadFlows();

    } catch (error: any) {
      console.error('Import error:', error);
      alert(`❌ Import Failed\n\n${error.message}`);
    } finally {
      // Reset state
      setImporting(false);
      setImportProgress('');
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading flows...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Import Progress Banner */}
      {importing && importProgress && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-sm font-medium text-blue-900">{importProgress}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">WhatsApp Flow Builder</h1>
            <p className="text-gray-600 mt-1">Create and manage your automation flows</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSettings}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importFlow}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-4 py-2 text-gray-700 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Import Flow from JSON"
            >
              <Upload className="w-5 h-5" />
              {importing ? 'Importing...' : 'Import JSON'}
            </button>
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2 shadow-lg shadow-orange-500/20"
            >
              <Plus className="w-5 h-5" />
              Create New Flow
            </button>
          </div>
        </div>

        {flows.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No flows yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by creating your first WhatsApp automation flow
            </p>
            <button
              onClick={onCreateNew}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Flow
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{flow.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{flow.description || 'No description'}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        flow.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {flow.status === 'active' ? 'Active' : 'Draft'}
                    </span>
                  </div>
                </div>

                {flow.trigger_keywords && flow.trigger_keywords.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Triggers:</p>
                    <div className="flex flex-wrap gap-1">
                      {flow.trigger_keywords.slice(0, 3).map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                      {flow.trigger_keywords.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs">
                          +{flow.trigger_keywords.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onEditFlow(flow.id)}
                    className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleFlowStatus(flow.id, flow.status)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title={flow.status === 'active' ? 'Pause flow' : 'Activate flow'}
                  >
                    {flow.status === 'active' ? (
                      <Pause className="w-4 h-4 text-gray-600" />
                    ) : (
                      <Play className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => duplicateFlow(flow)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Duplicate flow"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => exportFlow(flow.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Export flow"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => deleteFlow(flow.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete flow"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Updated {new Date(flow.updated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
