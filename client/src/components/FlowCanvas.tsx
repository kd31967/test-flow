import { useRef, useState, useEffect } from 'react';
import { NodeDefinition, NODE_TYPES } from '../types/flow';
import * as Icons from 'lucide-react';
import { Trash2, Copy, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';

interface FlowCanvasProps {
  nodes: NodeDefinition[];
  setNodes: (nodes: NodeDefinition[]) => void;
  onNodeSelect: (node: NodeDefinition) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export default function FlowCanvas({ nodes, setNodes, onNodeSelect, zoom = 1, onZoomChange }: FlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [draggedNode, setDraggedNode] = useState<NodeDefinition | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connections, setConnections] = useState<{ from: string; to: string }[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [localZoom, setLocalZoom] = useState(zoom);

  useEffect(() => {
    setLocalZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.3, Math.min(3, localZoom + delta));
        setLocalZoom(newZoom);
        if (onZoomChange) {
          onZoomChange(newZoom);
        }
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      return () => canvas.removeEventListener('wheel', handleWheel);
    }
  }, [localZoom, onZoomChange]);

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const nodeConfig = NODE_TYPES.find(n => n.type === nodeType);
    if (!nodeConfig) return;

    const newNode: NodeDefinition = {
      id: `node_${Date.now()}`,
      type: nodeType,
      position: {
        x: (event.clientX - canvasRect.left - panOffset.x) / zoom,
        y: (event.clientY - canvasRect.top - panOffset.y) / zoom
      },
      data: {
        label: nodeConfig.label,
        config: { ...nodeConfig.defaultConfig }
      }
    };

    setNodes([...nodes, newNode]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleNodeMouseDown = (event: React.MouseEvent, node: NodeDefinition) => {
    if (event.button !== 0) return;

    event.stopPropagation();
    setDraggedNode(node);
    setDragOffset({
      x: event.clientX - (node.position.x * zoom + panOffset.x),
      y: event.clientY - (node.position.y * zoom + panOffset.y)
    });
    setSelectedNodeId(node.id);
    onNodeSelect(node);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y
      });
      return;
    }

    if (!draggedNode) return;

    const newNodes = nodes.map(node => {
      if (node.id === draggedNode.id) {
        return {
          ...node,
          position: {
            x: (event.clientX - dragOffset.x) / zoom,
            y: (event.clientY - dragOffset.y) / zoom
          }
        };
      }
      return node;
    });

    setNodes(newNodes);
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (event: React.MouseEvent) => {
    if (event.button === 1 || (event.button === 0 && event.shiftKey) || (event.button === 0 && event.ctrlKey)) {
      // Middle mouse, Shift+Left mouse, or Ctrl+Left mouse for panning
      event.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: event.clientX - panOffset.x,
        y: event.clientY - panOffset.y
      });
    }
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setConnections(connections.filter(c => c.from !== nodeId && c.to !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleDuplicateNode = (node: NodeDefinition) => {
    const newNode: NodeDefinition = {
      ...node,
      id: `node_${Date.now()}`,
      position: {
        x: node.position.x + 50,
        y: node.position.y + 50
      }
    };
    setNodes([...nodes, newNode]);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(3, localZoom + 0.1);
    setLocalZoom(newZoom);
    if (onZoomChange) onZoomChange(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.3, localZoom - 0.1);
    setLocalZoom(newZoom);
    if (onZoomChange) onZoomChange(newZoom);
  };

  const handleResetZoom = () => {
    setLocalZoom(1);
    if (onZoomChange) onZoomChange(1);
  };

  const handleResetPan = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex-1 relative flex flex-col">
      <div
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={handleCanvasMouseDown}
        className="flex-1 relative bg-gray-100"
      style={{
        backgroundImage: `
          linear-gradient(to right, #e5e7eb 1px, transparent 1px),
          linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
        `,
        backgroundSize: `${20 * localZoom}px ${20 * localZoom}px`,
        cursor: isPanning ? 'grabbing' : 'default',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <div
        ref={contentRef}
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${localZoom})`,
          transformOrigin: '0 0',
          minWidth: '5000px',
          minHeight: '5000px',
          position: 'relative'
        }}
      >
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg font-medium">
                Drag nodes from the palette to start building your flow
              </div>
              <div className="text-gray-400 text-sm mt-2">
                Connect nodes to create automation workflows
              </div>
              <div className="text-gray-400 text-xs mt-2">
                Tip: Hold Ctrl/Shift + Left Click to pan, Ctrl + Scroll to zoom
              </div>
            </div>
          </div>
        )}

        {nodes.map((node) => {
        const nodeConfig = NODE_TYPES.find(n => n.type === node.type);
        const IconComponent = nodeConfig ? (Icons as any)[nodeConfig.icon] : null;
        const isSelected = selectedNodeId === node.id;

        return (
          <div
            key={node.id}
            onMouseDown={(e) => handleNodeMouseDown(e, node)}
            style={{
              position: 'absolute',
              left: node.position.x,
              top: node.position.y,
              transform: 'translate(-50%, -50%)'
            }}
            className={`
              w-64 bg-white rounded-lg shadow-lg border-2 cursor-move transition-all
              ${isSelected ? 'border-blue-500 shadow-xl' : 'border-gray-300 hover:border-gray-400'}
            `}
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {IconComponent && (
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">
                    {node.data.label}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {node.id}
                  </div>
                </div>
              </div>

              {node.data.config.content && (
                <div className="text-xs text-gray-600 mb-3 line-clamp-2 bg-gray-50 p-2 rounded">
                  {node.data.config.content}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicateNode(node);
                    }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode(node.id);
                    }}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  {nodeConfig?.category}
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    </div>

      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Move className="w-3 h-3" />
          <span>Nodes: {nodes.length}</span>
          <span className="mx-2">|</span>
          <span>Pan: Ctrl+Click or Shift+Click</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out (Ctrl + Scroll Down)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={handleResetZoom}
              className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors min-w-[60px]"
              title="Reset Zoom to 100%"
              aria-label="Reset zoom"
            >
              {Math.round(localZoom * 100)}%
            </button>
          </div>

          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In (Ctrl + Scroll Up)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button
            onClick={handleResetPan}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Reset Pan Position"
            aria-label="Reset pan position"
          >
            <Maximize2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Zoom: {Math.round(localZoom * 100)}%</span>
          <span className="mx-2">|</span>
          <span className="text-gray-400">Ctrl+Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
