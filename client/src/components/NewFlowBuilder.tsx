import { useState, useEffect, useMemo } from 'react';
import Sidebar from './Sidebar';
import Canvas from './Canvas';
import ConfigPanel from './ConfigPanel';
import { Save, Download, ArrowLeft } from 'lucide-react';
import { FlowVariable } from '../lib/variableSystem';
import { supabase } from '../lib/api';

interface NewFlowBuilderProps {
  flowId?: string;
  onBack: () => void;
}

export default function NewFlowBuilder({ flowId, onBack }: NewFlowBuilderProps) {
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [flowDescription, setFlowDescription] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentFlowId, setCurrentFlowId] = useState<string | undefined>(flowId);

  useEffect(() => {
    if (flowId) {
      loadFlow(flowId);
    }
  }, [flowId]);

  const loadFlow = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('flows')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Flow not found');

      setFlowName(data.name);
      setFlowDescription(data.description || '');
      setIsDraft(data.status === 'draft');

      if (data.config?.nodes) {
        const loadedNodes = Object.entries(data.config.nodes).map(([nodeId, nodeData]: [string, any]) => ({
          id: nodeId,
          type: nodeData.type,
          position: nodeData.position || { x: 100, y: 100 },
          data: {
            label: nodeData.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
            config: nodeData.config || {},
            preview: nodeData.type === 'on_message' ? 'Triggered when a new message is created' : ''
          }
        }));
        setNodes(loadedNodes);
      }
    } catch (error: any) {
      console.error('Error loading flow:', error);
      alert(`Failed to load flow: ${error.message}`);
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  // Compute flow variables from all preceding nodes (especially webhooks)
  const flowVariables = useMemo((): FlowVariable[] => {
    const vars: FlowVariable[] = [];
    const timestamp = Date.now();
    
    nodes.forEach(node => {
      const nodeConfig = node.data?.config || {};
      
      // Add webhook variables (both 'webhook' and 'catch_webhook' types)
      if (node.type === 'webhook' || node.type === 'catch_webhook') {
        // Always include standard webhook variables
        vars.push({
          nodeId: node.id,
          nodeName: node.data.label || 'Webhook',
          nodeType: node.type,
          key: 'webhook.method',
          value: 'POST',
          timestamp
        });
        
        // Add captured variables from test requests or default common fields
        const capturedVariables = nodeConfig.captured_variables || [
          'webhook.body.name',
          'webhook.body.email',
          'webhook.body.phone',
          'webhook.body.message',
          'webhook.body.data',
          'webhook.query.id',
          'webhook.query.token'
        ];
        
        capturedVariables.forEach((varKey: string) => {
          vars.push({
            nodeId: node.id,
            nodeName: node.data.label || 'Webhook',
            nodeType: node.type,
            key: varKey,
            value: '',
            timestamp
          });
        });
      }
      
      // Add HTTP API response variables
      if (node.type === 'api') {
        const responseVars = [
          { key: 'http.response.status', value: 200 },
          { key: 'http.response.statusText', value: 'OK' },
          { key: 'http.response.body', value: {} }
        ];
        
        responseVars.forEach(({ key, value }) => {
          vars.push({
            nodeId: node.id,
            nodeName: node.data.label || 'HTTP API',
            nodeType: 'api',
            key,
            value,
            timestamp
          });
        });
      }
    });
    
    return vars;
  }, [JSON.stringify(nodes.map(n => ({ id: n.id, type: n.type, config: n.data?.config })))]);

  const handleAddNode = (type: string) => {
    // Calculate horizontal positioning - nodes flow left to right
    const xPosition = nodes.length === 0 ? 50 : Math.max(...nodes.map(n => n.position.x)) + 450;

    const newNode = {
      id: `node_${Date.now()}`,
      type,
      position: {
        x: xPosition,
        y: 50 // Keep all nodes at same vertical level for horizontal flow
      },
      data: {
        label: type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        config: {},
        preview: type === 'on_message' ? 'Triggered when a new message is created' : ''
      }
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handleNodeDelete = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleNodeDuplicate = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const duplicatedNode = {
      ...node,
      id: `node_${Date.now()}`,
      position: {
        x: node.position.x + 450, // Place to the right horizontally
        y: node.position.y
      }
    };

    setNodes([...nodes, duplicatedNode]);
  };

  const handleNodeMove = (nodeId: string, position: { x: number; y: number }) => {
    setNodes(nodes.map(n =>
      n.id === nodeId ? { ...n, position } : n
    ));
  };

  const handleNodeUpdate = (updatedNode: any) => {
    setNodes(nodes.map(n =>
      n.id === updatedNode.id ? updatedNode : n
    ));
  };

  const handleNodeDataUpdate = (nodeId: string, data: any) => {
    setNodes(nodes.map(n =>
      n.id === nodeId ? { ...n, data } : n
    ));
  };


  const handleSave = async () => {
    setSaving(true);
    try {
      const triggerKeywords = nodes
        .filter(n => n.type === 'on_message')
        .flatMap(n => {
          const keywords = n.data.config.keywords || '';
          return keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
        });

      const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

      const flowConfig = {
        category: 'Custom',
        description: flowDescription,
        trigger: nodes.find(n => n.type === 'on_message' || n.type === 'catch_webhook'),
        start_node: nodes[0]?.id || '',
        variables: {},
        settings: {
          timeout: 1800,
          fallback_node: 'error_handler',
          error_handling: 'graceful',
          analytics_enabled: true
        },
        nodes: nodes.reduce((acc, node) => {
          const nodeIndex = sortedNodes.findIndex(n => n.id === node.id);
          const nextNode = sortedNodes[nodeIndex + 1];

          acc[node.id] = {
            type: node.type,
            config: node.data.config,
            position: node.position,
            next: node.data.config.next || (nextNode?.id) || null
          };
          return acc;
        }, {} as Record<string, any>)
      };

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'demo-user';

      const flowData = {
        name: flowName,
        description: flowDescription,
        status: isDraft ? 'draft' : 'active',
        trigger_keywords: triggerKeywords,
        config: flowConfig,
        category: 'Custom',
        user_id: userId
      };

      if (currentFlowId) {
        const { error } = await supabase
          .from('flows')
          .update(flowData)
          .eq('id', currentFlowId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('flows')
          .insert(flowData)
          .select()
          .single();

        if (error) throw error;
        if (data) setCurrentFlowId(data.id);
      }

      alert('Flow saved successfully!');
    } catch (error: any) {
      console.error('Error saving flow:', error);
      alert(`Failed to save flow: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const flowData = {
      flowName,
      metadata: {
        created_by: '{{USER_ID}}',
        app_id: '{{USER_APP_ID}}',
        business_id: '{{USER_BUSINESS_ID}}',
        access_token: '{{USER_ACCESS_TOKEN}}',
        created_at: new Date().toISOString(),
        version: '1.0'
      },
      config: {
        category: 'Custom',
        description: `${flowName} automation flow`,
        trigger: nodes[0] || {},
        start_node: nodes[0]?.id || '',
        variables: {},
        settings: {
          timeout: 1800,
          fallback_node: 'error_handler',
          error_handling: 'graceful',
          analytics_enabled: true
        }
      },
      nodes: nodes.reduce((acc, node) => {
        acc[node.id] = {
          type: node.type,
          config: node.data.config,
          position: node.position
        };
        return acc;
      }, {} as Record<string, any>)
    };

    const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${flowName.replace(/\s+/g, '_')}.json`;
    a.click();
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to flows"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="text-lg font-medium border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!isDraft}
              onChange={(e) => setIsDraft(!e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-11 h-6 rounded-full transition-colors ${isDraft ? 'bg-gray-300' : 'bg-orange-500'}`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${!isDraft ? 'translate-x-5' : ''}`}></div>
            </div>
            <span className="text-sm text-gray-600">{isDraft ? 'Draft' : 'Active'}</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Sidebar onAddNode={handleAddNode} />

        <Canvas
          nodes={nodes}
          selectedNode={selectedNodeId}
          onNodeSelect={setSelectedNodeId}
          onNodeDelete={handleNodeDelete}
          onNodeEdit={setSelectedNodeId}
          onNodeDuplicate={handleNodeDuplicate}
          onNodeMove={handleNodeMove}
          onNodeUpdate={handleNodeDataUpdate}
        />

        {selectedNode && (
          <ConfigPanel
            node={{...selectedNode, flowName}}
            allNodes={nodes}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNodeId(null)}
            flowId={currentFlowId}
            flowVariables={flowVariables}
          />
        )}
      </div>
    </div>
  );
}
