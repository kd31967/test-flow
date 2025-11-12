import { useState, useEffect } from 'react';
import NodePalette from './NodePalette';
import FlowCanvas from './FlowCanvas';
import NodeConfig from './NodeConfig';
import { NodeDefinition } from '../types/flow';
import { Save, Download, Upload, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';
import { supabase } from '../lib/api';

interface FlowBuilderProps {
  flowId?: string;
}

export default function FlowBuilder({ flowId: _flowId }: FlowBuilderProps) {
  const [nodes, setNodes] = useState<NodeDefinition[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeDefinition | null>(null);
  const [flowName, setFlowName] = useState('Untitled Flow');
  const [flowCategory, setFlowCategory] = useState('Custom');
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Failed to enter fullscreen:', err);
        alert('Fullscreen not supported or blocked by browser');
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleSaveFlow = async () => {
    if (!userId) {
      alert('Please log in to save flows');
      return;
    }

    setSaving(true);
    try {
      const flowData = {
        trigger: [],
        start_node: nodes[0]?.id || '',
        nodes: nodes.reduce((acc, node) => {
          acc[node.id] = {
            type: node.type,
            config: node.data.config,
            position: node.position,
            next: node.next
          };
          return acc;
        }, {} as Record<string, any>)
      };

      const { error } = await supabase
        .from('flows')
        .insert({
          user_id: userId,
          name: flowName,
          config: flowData,
          status: 'active',
          trigger_keywords: []
        });

      if (error) throw error;
      alert('Flow saved successfully to database!');
    } catch (error: any) {
      console.error('Save error:', error);
      alert(`Failed to save flow: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Export flow to JSON file
   * Creates a comprehensive JSON export with metadata and validation
   */
  const handleExportFlow = () => {
    try {
      if (nodes.length === 0) {
        alert('Cannot export empty flow. Add at least one node to export.');
        return;
      }

      const flowData = {
        flowName,
        flowCategory,
        exportedAt: new Date().toISOString(),
        version: '2.0',
        zoom,
        nodeCount: nodes.length,
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
          next: node.next
        }))
      };

      const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `${flowName.replace(/\s+/g, '_')}_${Date.now()}.json`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(`Flow exported successfully!\nFile: ${fileName}\nNodes: ${nodes.length}`);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Failed to export flow: ${error.message}`);
    }
  };

  /**
   * Import flow from JSON file
   * Validates file format and reconstructs flow state
   * Supports both v1.0 (object format) and v2.0 (array format)
   */
  const handleImportFlow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      alert('Invalid file type. Please select a JSON file (.json)');
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      alert('Failed to read file. Please try again.');
      event.target.value = '';
    };

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content || content.trim() === '') {
          throw new Error('File is empty');
        }

        const flowData = JSON.parse(content);

        // Validate required fields
        if (!flowData.nodes) {
          throw new Error('Invalid flow file: missing nodes data');
        }

        // Create a duplicate with unique name
        const timestamp = new Date().toISOString().split('T')[0];
        const newFlowName = `${flowData.flowName || 'Imported Flow'}_copy_${timestamp}`;

        setFlowName(newFlowName);
        setFlowCategory(flowData.flowCategory || 'Custom');

        // Handle both old and new format
        let importedNodes: NodeDefinition[];
        if (Array.isArray(flowData.nodes)) {
          // New format (v2.0) with positions
          importedNodes = flowData.nodes.map((node: any, index: number) => ({
            id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: node.type || 'send_message',
            position: node.position || { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
            data: node.data || { label: node.type, config: {} },
            next: node.next
          }));
        } else {
          // Old format (v1.0) as object
          importedNodes = Object.entries(flowData.nodes || {}).map(([_id, nodeData]: [string, any], index) => ({
            id: `node_${Date.now()}_${index}`,
            type: nodeData.type || 'send_message',
            position: nodeData.position || { x: 100 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 200 },
            data: {
              label: nodeData.type || 'Unknown',
              config: nodeData.config || {}
            },
            next: nodeData.next
          }));
        }

        if (importedNodes.length === 0) {
          throw new Error('No valid nodes found in flow file');
        }

        setNodes(importedNodes);
        if (flowData.zoom && typeof flowData.zoom === 'number') {
          setZoom(Math.max(0.3, Math.min(3, flowData.zoom)));
        }

        alert(`Flow imported successfully!\n\nName: ${newFlowName}\nNodes: ${importedNodes.length}\nVersion: ${flowData.version || '1.0'}`);
      } catch (error: any) {
        console.error('Import error:', error);
        const errorMessage = error instanceof SyntaxError
          ? 'Invalid JSON format. Please check the file.'
          : `Import failed: ${error.message}`;
        alert(errorMessage);
      } finally {
        // Reset input to allow re-importing the same file
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            className="text-xl font-semibold border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
          />
          <select
            value={flowCategory}
            onChange={(e) => setFlowCategory(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="Lead Generation">Lead Generation</option>
            <option value="Customer Support">Customer Support</option>
            <option value="Sales">Sales</option>
            <option value="E-commerce">E-commerce</option>
            <option value="Marketing">Marketing</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2 border-r pr-3">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleToggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
          <label className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportFlow}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportFlow}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleSaveFlow}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Flow'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <NodePalette />
        <FlowCanvas
          nodes={nodes}
          setNodes={setNodes}
          onNodeSelect={setSelectedNode}
          zoom={zoom}
          onZoomChange={setZoom}
        />
        {selectedNode && (
          <NodeConfig
            node={selectedNode}
            onUpdate={(updatedNode) => {
              setNodes(nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
              setSelectedNode(updatedNode);
            }}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}
