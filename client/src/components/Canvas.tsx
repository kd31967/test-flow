import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move, X } from 'lucide-react';
import ExpandedFlowNode from './ExpandedFlowNode';

interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  type?: 'default' | 'button' | 'condition_true' | 'condition_false';
}

interface CanvasProps {
  nodes: any[];
  selectedNode: string | null;
  onNodeSelect: (nodeId: string) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeEdit: (nodeId: string) => void;
  onNodeDuplicate: (nodeId: string) => void;
  onNodeMove: (nodeId: string, position: { x: number; y: number }) => void;
  onNodeUpdate?: (nodeId: string, updates: any) => void;
}

export default function Canvas({
  nodes,
  selectedNode,
  onNodeSelect,
  onNodeDelete,
  onNodeEdit,
  onNodeDuplicate,
  onNodeMove,
  onNodeUpdate
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  // Connection state
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; handle?: string } | null>(null);
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null);
  const [connectionFeedback, setConnectionFeedback] = useState<string | null>(null);

  // Build connections from nodes data
  useEffect(() => {
    const newConnections: Connection[] = [];

    nodes.forEach(node => {
      // Check for direct next connection
      if (node.data?.config?.next) {
        const targetNode = nodes.find(n => n.id === node.data.config.next);
        if (targetNode) {
          newConnections.push({
            id: `${node.id}-${node.data.config.next}`,
            source: node.id,
            target: node.data.config.next,
            type: 'default'
          });
        }
      }

      // Check for button connections
      if (node.data?.config?.buttons && Array.isArray(node.data.config.buttons)) {
        node.data.config.buttons.forEach((button: any, index: number) => {
          if (button.nextNodeId) {
            const targetNode = nodes.find(n => n.id === button.nextNodeId);
            if (targetNode) {
              newConnections.push({
                id: `${node.id}-btn${index}-${button.nextNodeId}`,
                source: node.id,
                target: button.nextNodeId,
                sourceHandle: button.id,
                type: 'button'
              });
            }
          }
        });
      }

      // Check for buttonBranches
      if (node.data?.config?.buttonBranches) {
        Object.entries(node.data?.config?.buttonBranches).forEach(([buttonId, targetNodeId]) => {
          if (targetNodeId) {
            const targetNode = nodes.find(n => n.id === targetNodeId);
            if (targetNode) {
              newConnections.push({
                id: `${node.id}-${buttonId}-${targetNodeId}`,
                source: node.id,
                target: targetNodeId as string,
                sourceHandle: buttonId,
                type: 'button'
              });
            }
          }
        });
      }

      // Check for condition node branches (True/False paths)
      if (node.type === 'condition' && node.data?.config) {
        // True branch
        if (node.data.config.trueBranch) {
          const targetNode = nodes.find(n => n.id === node.data.config.trueBranch);
          if (targetNode) {
            newConnections.push({
              id: `${node.id}-true-${node.data.config.trueBranch}`,
              source: node.id,
              target: node.data.config.trueBranch,
              sourceHandle: 'true',
              type: 'condition_true'
            });
          }
        }

        // False branch
        if (node.data.config.falseBranch) {
          const targetNode = nodes.find(n => n.id === node.data.config.falseBranch);
          if (targetNode) {
            newConnections.push({
              id: `${node.id}-false-${node.data.config.falseBranch}`,
              source: node.id,
              target: node.data.config.falseBranch,
              sourceHandle: 'false',
              type: 'condition_false'
            });
          }
        }
      }
    });

    setConnections(newConnections);
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;

    // Check if click is on a connection dot - if so, don't start dragging
    const target = e.target as HTMLElement;
    const isConnectionDot = target.closest('[data-connection-point]');
    const isButtonDot = target.closest('[data-button-handle]');

    if (isConnectionDot || isButtonDot) {
      console.log('Click on connection dot - not starting node drag');
      return; // Let the connection dot handle the event
    }

    e.stopPropagation();

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setIsDragging(true);
    setDraggedNode(nodeId);
    setDragOffset({
      x: (e.clientX - rect.left) / zoom - node.position.x - panOffset.x / zoom,
      y: (e.clientY - rect.top) / zoom - node.position.y - panOffset.y / zoom
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // CRITICAL: Don't start panning if in connection mode!
    if (isConnecting) {
      console.log('Connection mode active - ignoring canvas click');
      return;
    }

    // Always allow panning on canvas background
    if (e.button === 0 && !isDragging) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
    }
  };

  const handleConnectionStart = (nodeId: string, handleId?: string) => {
    setIsConnecting(true);
    setConnectionStart({ nodeId, handle: handleId });
  };

  const handleConnectionEnd = (targetNodeId: string) => {
    // STRICT VALIDATION: Only allow if connection was started
    if (!isConnecting || !connectionStart) {
      setConnectionFeedback('❌ Connection failed: Please start from a connection dot first');
      setTimeout(() => setConnectionFeedback(null), 3000);

      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
      return;
    }

    // Prevent self-connection
    if (connectionStart.nodeId === targetNodeId) {
      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
      return;
    }

    const sourceNode = nodes.find(n => n.id === connectionStart.nodeId);
    if (!sourceNode || !onNodeUpdate) {
      setIsConnecting(false);
      setConnectionStart(null);
      setTempConnection(null);
      return;
    }

    // Create the connection
    if (connectionStart.handle) {
      // Check if it's a condition branch connection
      if (connectionStart.handle === 'true' || connectionStart.handle === 'false') {
        // Condition node True/False branch
        const branchField = connectionStart.handle === 'true' ? 'trueBranch' : 'falseBranch';

        onNodeUpdate(connectionStart.nodeId, {
          ...sourceNode.data,
          config: {
            ...sourceNode.data.config,
            [branchField]: targetNodeId
          }
        });

        // Show success feedback
        setConnectionFeedback(`✅ Condition ${connectionStart.handle} branch connected!`);
        setTimeout(() => setConnectionFeedback(null), 3000);
      } else {
        // Button connection
        const updatedButtons = sourceNode.data.config.buttons?.map((btn: any) => {
          if (btn.id === connectionStart.handle) {
            return { ...btn, nextNodeId: targetNodeId };
          }
          return btn;
        });

        onNodeUpdate(connectionStart.nodeId, {
          ...sourceNode.data,
          config: {
            ...sourceNode.data.config,
            buttons: updatedButtons
          }
        });

        // Show success feedback
        setConnectionFeedback('✅ Button connection created successfully!');
        setTimeout(() => setConnectionFeedback(null), 3000);
      }
    } else {
      // Default connection
      onNodeUpdate(connectionStart.nodeId, {
        ...sourceNode.data,
        config: {
          ...sourceNode.data.config,
          next: targetNodeId
        }
      });

      // Show success feedback
      setConnectionFeedback('✅ Connection created successfully!');
      setTimeout(() => setConnectionFeedback(null), 3000);
    }

    setIsConnecting(false);
    setConnectionStart(null);
    setTempConnection(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (isConnecting && connectionStart) {
      // Update temporary connection line position
      setTempConnection({
        x: (e.clientX - rect.left) / zoom - panOffset.x / zoom,
        y: (e.clientY - rect.top) / zoom - panOffset.y / zoom
      });
    } else if (isDragging && draggedNode) {
      const x = (e.clientX - rect.left) / zoom - dragOffset.x - panOffset.x / zoom;
      const y = (e.clientY - rect.top) / zoom - dragOffset.y / zoom;

      onNodeMove(draggedNode, { x, y });
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    // CRITICAL: Only cancel connection if user was panning or dragging
    // Don't cancel on normal mouse up - connection should stay active
    const wasPanning = isPanning;
    const wasDragging = isDragging;

    setIsDragging(false);
    setDraggedNode(null);
    setIsPanning(false);

    // Only cancel connection if we were actually panning/dragging
    // This prevents accidental connection cancellation on normal clicks
    if (wasPanning || wasDragging) {
      console.log('Mouse up after pan/drag - keeping connection active');
      // Don't cancel connection state
    }

    // Clear temp connection line on mouse up
    setTempConnection(null);
  };

  useEffect(() => {
    if (isDragging || isPanning || isConnecting) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, isPanning, isConnecting]);

  // ESC key to cancel connection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isConnecting) {
        console.log('Connection cancelled by user (ESC)');
        setIsConnecting(false);
        setConnectionStart(null);
        setTempConnection(null);
        setConnectionFeedback('Connection cancelled');
        setTimeout(() => setConnectionFeedback(null), 2000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isConnecting]);

  // Zoom with Ctrl+Scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.3, Math.min(3, prev + delta)));
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.3, prev - 0.1));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const handleResetPan = () => {
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDeleteConnection = (connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    if (!sourceNode || !onNodeUpdate) return;

    // Handle condition branch deletion
    if ((connection.type === 'condition_true' || connection.type === 'condition_false') && connection.sourceHandle) {
      const branchField = connection.sourceHandle === 'true' ? 'trueBranch' : 'falseBranch';

      onNodeUpdate(sourceNode.id, {
        ...sourceNode.data,
        config: {
          ...sourceNode.data.config,
          [branchField]: ''
        }
      });
      return;
    }

    // Update the node configuration to remove the connection
    if (connection.type === 'button' && connection.sourceHandle) {
      // Update button nextNodeId - set to empty string
      if (sourceNode.data.config.buttons) {
        const updatedButtons = sourceNode.data.config.buttons.map((btn: any) => {
          if (btn.id === connection.sourceHandle) {
            return { ...btn, nextNodeId: '' };
          }
          return btn;
        });

        onNodeUpdate(sourceNode.id, {
          ...sourceNode.data,
          config: {
            ...sourceNode.data.config,
            buttons: updatedButtons
          }
        });
      }

      // Also remove button branch connection if exists
      if (sourceNode.data.config.buttonBranches) {
        const newBranches = { ...sourceNode.data.config.buttonBranches };
        delete newBranches[connection.sourceHandle];

        onNodeUpdate(sourceNode.id, {
          ...sourceNode.data,
          config: {
            ...sourceNode.data.config,
            buttonBranches: newBranches
          }
        });
      }
    } else {
      // Remove default next connection
      onNodeUpdate(sourceNode.id, {
        ...sourceNode.data,
        config: {
          ...sourceNode.data.config,
          next: ''
        }
      });
    }
  };

  // Calculate precise center coordinates for connection dots
  const getOrangeDotCenter = (node: any, buttonHandle?: string) => {
    const nodeWidth = 320; // w-80 = 320px

    // Condition node branches (true/false)
    if (buttonHandle && (buttonHandle === 'true' || buttonHandle === 'false') && node.type === 'condition') {
      const headerHeight = 40;
      const contentPaddingTop = 16;
      const conditionalLogicLabel = 60; // Label + condition summary
      const branchRowHeight = 36; // Each branch row height
      const branchVerticalCenter = 18;

      const branchIndex = buttonHandle === 'true' ? 0 : 1;
      const yPosition = headerHeight + contentPaddingTop + conditionalLogicLabel + (branchIndex * branchRowHeight) + branchVerticalCenter;

      const branchDotSize = 16;
      return {
        x: node.position.x + nodeWidth + (branchDotSize / 2),
        y: node.position.y + yPosition
      };
    }

    if (buttonHandle && node.data?.config?.buttons) {
      // Button connection - calculate exact button row position
      const buttonIndex = node.data.config.buttons.findIndex((b: any) => b.id === buttonHandle);

      if (buttonIndex !== -1) {
        // More accurate calculation based on actual DOM structure
        const headerHeight = 40;          // Header height
        const contentPaddingTop = 16;     // p-4 = 16px padding
        const headerTypeSection = 88;     // Header Type section with label + buttons
        const bodyTextSection = 140;      // Body Text section with label, textarea, and char count
        const buttonTitlesLabel = 32;     // "Button Titles" label + margin
        const buttonRowHeight = 40;       // Each button row height (includes gap-2 = 8px)
        const buttonRowVerticalCenter = 20; // Center of the button row (40px / 2)

        // Calculate Y position for the button dot
        const yPosition = headerHeight + contentPaddingTop + headerTypeSection + bodyTextSection + buttonTitlesLabel + (buttonIndex * buttonRowHeight) + buttonRowVerticalCenter;

        // Button dots are w-4 h-4 (16px), positioned at the right edge
        const buttonDotSize = 16;
        const position = {
          x: node.position.x + nodeWidth + (buttonDotSize / 2), // Right edge + half dot width
          y: node.position.y + yPosition
        };
        return position;
      }
    }

    // Default connection - centered on node (for non-button connections)
    const nodeHeight = 200; // Approximate node height
    const defaultDotSize = 20; // w-5 h-5 = 20px
    const defaultDotOffset = 8; // -right-2 = -8px
    return {
      x: node.position.x + nodeWidth + defaultDotOffset + (defaultDotSize / 2),
      y: node.position.y + (nodeHeight / 2)
    };
  };

  const getBlueDotCenter = (node: any) => {
    const dotSize = 20; // w-5 h-5 = 20px
    const dotOffset = 8; // -left-2 = -8px
    const nodeHeight = 200; // Approximate node height

    return {
      x: node.position.x - dotOffset + (dotSize / 2), // Exact center
      y: node.position.y + (nodeHeight / 2)
    };
  };

  const getConnectionPath = (source: any, target: any, sourceHandle?: string) => {
    if (!source || !target) return '';

    // Get exact dot center coordinates
    const start = getOrangeDotCenter(source, sourceHandle);
    const end = getBlueDotCenter(target);

    // Calculate smooth curved bezier path for better visuals
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Control points for horizontal bezier curve
    const curvature = 0.4; // Adjust this for more/less curve (0 = straight, 1 = very curved)
    const controlX = dx * curvature;
    
    // Create smooth bezier curve
    const path = `M ${start.x} ${start.y} C ${start.x + controlX} ${start.y}, ${end.x - controlX} ${end.y}, ${end.x} ${end.y}`;
    
    return path;
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Connection Mode Banner - Enhanced with warnings */}
      {isConnecting && (
        <div className="bg-blue-500 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 shadow-md">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-semibold">Connection Mode Active:</span>
            <span>Click any dot (orange or blue) to complete | Avoid canvas clicks</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Connection manually cancelled by user');
              setIsConnecting(false);
              setConnectionStart(null);
              setTempConnection(null);
              setConnectionFeedback('Connection cancelled');
              setTimeout(() => setConnectionFeedback(null), 2000);
            }}
            className="ml-4 px-3 py-1 bg-white text-blue-500 rounded hover:bg-blue-50 transition-colors text-xs font-semibold"
          >
            Cancel (ESC)
          </button>
        </div>
      )}

      <div
        ref={canvasRef}
        className="flex-1 bg-gray-50 relative overflow-hidden"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          cursor: isPanning ? 'grabbing' : isDragging ? 'grabbing' : isConnecting ? 'crosshair' : 'default'
        }}
      >
      {/* Connection Mode Overlay - Prevents accidental canvas interactions */}
      {isConnecting && (
        <div
          className="absolute inset-0 bg-blue-50 bg-opacity-10 pointer-events-none z-5"
          style={{
            backdropFilter: 'blur(0.5px)'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-blue-600 text-sm font-medium bg-white bg-opacity-90 px-4 py-2 rounded-full shadow-lg">
              🎯 Click a connection dot to complete
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}
      >
        {/* SVG for connections */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {/* Draw all connections */}
          {connections.map((connection) => {
            const sourceNode = nodes.find(n => n.id === connection.source);
            const targetNode = nodes.find(n => n.id === connection.target);

            if (!sourceNode || !targetNode) return null;

            const path = getConnectionPath(sourceNode, targetNode, connection.sourceHandle);
            const isButtonConnection = connection.type === 'button';

            // Calculate precise midpoint using exact dot centers
            const start = getOrangeDotCenter(sourceNode, connection.sourceHandle);
            const end = getBlueDotCenter(targetNode);
            const midX = (start.x + end.x) / 2;
            const midY = (start.y + end.y) / 2;

            return (
              <g key={connection.id} className="connection-group">
                {/* Invisible hover area for easier selection */}
                <path
                  d={path}
                  stroke="transparent"
                  strokeWidth="12"
                  fill="none"
                  className="connection-hover-area"
                  style={{ pointerEvents: 'stroke' }}
                />
                {/* Main connection line - Improved styling */}
                <path
                  d={path}
                  stroke={connection.type === 'button' ? '#f97316' : connection.type === 'condition_true' ? '#22c55e' : connection.type === 'condition_false' ? '#ef4444' : '#6b7280'}
                  strokeWidth="3"
                  fill="none"
                  markerEnd={`url(#arrowhead-${connection.type === 'button' ? 'orange' : connection.type === 'condition_true' ? 'green' : connection.type === 'condition_false' ? 'red' : 'gray'})`}
                  className="connection-line"
                  style={{ pointerEvents: 'none' }}
                  strokeLinecap="round"
                />
                {/* Delete button on connection */}
                <g
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onClick={() => handleDeleteConnection(connection)}
                  className="delete-button opacity-0 hover:opacity-100 transition-opacity"
                >
                  <circle
                    cx={midX}
                    cy={midY}
                    r="12"
                    fill="white"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                    className="shadow-lg"
                  />
                  <foreignObject
                    x={midX - 8}
                    y={midY - 8}
                    width="16"
                    height="16"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </foreignObject>
                </g>
              </g>
            );
          })}

          {/* Temporary connection line with curved preview */}
          {isConnecting && connectionStart && tempConnection && (() => {
            const sourceNode = nodes.find(n => n.id === connectionStart.nodeId);
            if (!sourceNode) return null;

            // Get exact orange dot center
            const start = getOrangeDotCenter(sourceNode, connectionStart.handle);
            
            // Create smooth curve for temp connection
            const dx = tempConnection.x - start.x;
            const curvature = 0.4;
            const controlX = dx * curvature;
            const tempPath = `M ${start.x} ${start.y} C ${start.x + controlX} ${start.y}, ${tempConnection.x - controlX} ${tempConnection.y}, ${tempConnection.x} ${tempConnection.y}`;

            return (
              <g>
                <path
                  d={tempPath}
                  stroke="#6b7280"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="8,4"
                  opacity="0.6"
                  markerEnd="url(#arrowhead-gray)"
                  strokeLinecap="round"
                />
                <circle
                  cx={tempConnection.x}
                  cy={tempConnection.y}
                  r="5"
                  fill="#6b7280"
                  opacity="0.4"
                />
              </g>
            );
          })()}

          {/* Define arrow markers with different colors */}
          <defs>
            <marker
              id="arrowhead-gray"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,8 L9,4 z" fill="#6b7280" />
            </marker>
            <marker
              id="arrowhead-orange"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,8 L9,4 z" fill="#f97316" />
            </marker>
            <marker
              id="arrowhead-green"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,8 L9,4 z" fill="#22c55e" />
            </marker>
            <marker
              id="arrowhead-red"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="4"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,8 L9,4 z" fill="#ef4444" />
            </marker>
          </defs>
        </svg>

        {/* Render nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            style={{
              position: 'absolute',
              zIndex: 10
            }}
          >
            <ExpandedFlowNode
              node={node}
              isSelected={selectedNode === node.id}
              isConnecting={isConnecting}
              onSelect={() => onNodeSelect(node.id)}
              onDelete={() => onNodeDelete(node.id)}
              onEdit={() => onNodeEdit(node.id)}
              onDuplicate={() => onNodeDuplicate(node.id)}
              onConnectionStart={handleConnectionStart}
              onConnectionEnd={handleConnectionEnd}
            />
          </div>
        ))}
      </div>

      {/* Connection Success Feedback */}
      {connectionFeedback && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{connectionFeedback}</span>
          </div>
        </div>
      )}
    </div>

      {/* Bottom Toolbar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Move className="w-3 h-3" />
          <span>Nodes: {nodes.length}</span>
          <span className="mx-2">|</span>
          <span>Connections: {connections.length}</span>
          <span className="mx-2">|</span>
          <span>Pan: Drag canvas background</span>
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

          <button
            onClick={handleResetZoom}
            className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors min-w-[60px]"
            title="Reset Zoom to 100%"
            aria-label="Reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>

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
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span className="mx-2">|</span>
          <span className="text-gray-400">Ctrl+Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
