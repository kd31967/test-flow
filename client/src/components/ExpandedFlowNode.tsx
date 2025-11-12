import { Edit2, Trash2, Copy, Plus } from 'lucide-react';

interface ExpandedFlowNodeProps {
  node: {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
  };
  isSelected: boolean;
  isConnecting?: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onConnectionStart?: (nodeId: string, handleId?: string) => void;
  onConnectionEnd?: (nodeId: string) => void;
}

export default function ExpandedFlowNode({
  node,
  isSelected,
  isConnecting = false,
  onSelect,
  onDelete,
  onEdit,
  onDuplicate,
  onConnectionStart,
  onConnectionEnd
}: ExpandedFlowNodeProps) {
  const config = node.data.config || {};
  const isButton1Branch = node.type === 'button_1_branch';

  const handleConnectionStart = (e: React.MouseEvent, handleId?: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (onConnectionStart) {
      onConnectionStart(node.id, handleId);
    }
  };

  const handleConnectionEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onConnectionEnd) {
      onConnectionEnd(node.id);
    }
  };

  const renderNodeContent = () => {
    switch (node.type) {
      case 'on_message':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message Type</label>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                {config.messageType || 'Text'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Keywords</label>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                {config.keywords || 'Add keyword...'}
              </div>
              <p className="text-xs text-gray-400 mt-1">Separate keywords with commas</p>
            </div>
            {config.fuzzyMatching && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked readOnly className="rounded" />
                <span>Enable Fuzzy Matching</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone Numbers</label>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                {config.phoneNumbers || '15557735263'}
              </div>
            </div>
          </div>
        );

      case 'send_message':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Answer Type</label>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                {config.answerType || 'Text'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Answer Text</label>
              <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700 min-h-[60px]">
                {config.answerText || 'Type your message...'}
              </div>
              <p className="text-xs text-gray-400 mt-1">1024 characters left</p>
            </div>
          </div>
        );

      case 'send_media':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Media Type</label>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                {config.mediaType || 'Image'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Media URL</label>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700 truncate">
                {config.mediaUrl || 'Enter URL...'}
              </div>
            </div>
            {config.caption && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Caption</label>
                <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                  {config.caption}
                </div>
              </div>
            )}
          </div>
        );

      case 'send_button':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Header Type</label>
              <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                {config.headerType || 'Text'}
              </div>
            </div>
            {config.headerType === 'image' && config.headerMediaUrl && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
                <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700 truncate">
                  {config.headerMediaUrl}
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body Text</label>
              <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700 min-h-[60px]">
                {config.bodyText || 'Enter message body...'}
              </div>
              <p className="text-xs text-gray-400 mt-1">1024 characters left</p>
            </div>
            {(config.buttons && config.buttons.length > 0) && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Button Titles</label>
                <div className="space-y-2">
                  {config.buttons.map((btn: any, idx: number) => (
                    <div key={btn.id || idx} className="flex items-center gap-2 relative group">
                      <div className={`flex-1 px-3 py-1.5 bg-white border rounded text-sm text-gray-700 transition-all ${
                        btn.nextNodeId
                          ? 'border-green-400 bg-green-50 shadow-sm'
                          : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span>{btn.title || `Button ${idx + 1}`}</span>
                          {btn.nextNodeId && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 border-white shadow-md transition-all ${
                          isConnecting
                            ? 'bg-orange-400 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-orange-300 animate-pulse'
                            : btn.nextNodeId
                            ? 'bg-green-500 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-green-300 hover:bg-green-600'
                            : 'bg-orange-500 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-orange-300 hover:bg-orange-600'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isConnecting) {
                            // Complete connection
                            handleConnectionEnd(e);
                          } else {
                            // Start new connection from button
                            handleConnectionStart(e, btn.id);
                          }
                        }}
                        title={
                          isConnecting
                            ? "Click to complete connection"
                            : btn.nextNodeId
                            ? `Connected - Click to reconnect ${btn.title}`
                            : `Click to connect ${btn.title} to another node`
                        }
                        data-button-handle={btn.id}
                      >
                        {/* Pulsing ring for better visibility */}
                        <div className={`absolute inset-0 rounded-full ${
                          isConnecting ? 'animate-ping bg-orange-400 opacity-75' : ''
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
                {config.buttons.length < 4 && (
                  <p className="text-xs text-gray-400 mt-1">20 characters left</p>
                )}
              </div>
            )}
            {config.footerText && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Footer Text</label>
                <div className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm text-gray-700">
                  {config.footerText}
                </div>
                <p className="text-xs text-gray-400 mt-1">60 characters left</p>
              </div>
            )}
          </div>
        );

      case 'button_1_branch':
      case 'button_2_branch':
      case 'button_3_branch':
      case 'button_4_branch':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
              <div className="px-3 py-2 bg-white border border-gray-200 rounded text-sm text-gray-700 min-h-[60px]">
                {config.content || `Response for button ${config.buttonNumber}`}
              </div>
              <p className="text-xs text-gray-400 mt-1">Only 1024/1024 characters are allowed</p>
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Conditional Logic</label>
              <div className="text-xs text-gray-600">
                {config.conditions && config.conditions.length > 0 ? (
                  `${config.conditions.length} condition${config.conditions.length > 1 ? 's' : ''} configured`
                ) : (
                  'No conditions set'
                )}
              </div>
            </div>

            <div className="space-y-2">
              {/* True Branch */}
              <div className="flex items-center gap-2 relative group">
                <div className={`flex-1 px-3 py-1.5 bg-white border rounded text-sm transition-all ${
                  config.trueBranch
                    ? 'border-green-400 bg-green-50 shadow-sm text-green-700'
                    : 'border-gray-200 text-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">✓ True</span>
                    {config.trueBranch && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-md transition-all ${
                    isConnecting
                      ? 'bg-orange-400 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-orange-300 animate-pulse'
                      : config.trueBranch
                      ? 'bg-green-500 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-green-300 hover:bg-green-600'
                      : 'bg-orange-500 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-orange-300 hover:bg-orange-600'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isConnecting) {
                      handleConnectionEnd(e);
                    } else {
                      handleConnectionStart(e, 'true');
                    }
                  }}
                  title={
                    isConnecting
                      ? "Click to complete connection"
                      : config.trueBranch
                      ? "Connected - Click to reconnect True branch"
                      : "Click to connect True branch to another node"
                  }
                  data-branch-handle="true"
                >
                  <div className={`absolute inset-0 rounded-full ${
                    isConnecting ? 'animate-ping bg-orange-400 opacity-75' : ''
                  }`}></div>
                </div>
              </div>

              {/* False Branch */}
              <div className="flex items-center gap-2 relative group">
                <div className={`flex-1 px-3 py-1.5 bg-white border rounded text-sm transition-all ${
                  config.falseBranch
                    ? 'border-green-400 bg-green-50 shadow-sm text-green-700'
                    : 'border-gray-200 text-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">✗ False</span>
                    {config.falseBranch && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-md transition-all ${
                    isConnecting
                      ? 'bg-orange-400 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-orange-300 animate-pulse'
                      : config.falseBranch
                      ? 'bg-green-500 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-green-300 hover:bg-green-600'
                      : 'bg-orange-500 cursor-pointer hover:scale-150 hover:ring-4 hover:ring-orange-300 hover:bg-orange-600'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isConnecting) {
                      handleConnectionEnd(e);
                    } else {
                      handleConnectionStart(e, 'false');
                    }
                  }}
                  title={
                    isConnecting
                      ? "Click to complete connection"
                      : config.falseBranch
                      ? "Connected - Click to reconnect False branch"
                      : "Click to connect False branch to another node"
                  }
                  data-branch-handle="false"
                >
                  <div className={`absolute inset-0 rounded-full ${
                    isConnecting ? 'animate-ping bg-orange-400 opacity-75' : ''
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-500">
            {config.content || config.bodyText || config.message || 'No content'}
          </div>
        );
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
      }}
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm transition-all
        ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
        hover:shadow-md
        w-80
      `}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50"
        onClick={onSelect}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
          <span className="text-sm font-medium text-gray-900">
            {node.data.label || node.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </span>
          {isButton1Branch && (
            <span className="px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full font-medium">
              Draggable
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5 text-gray-500" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4" onClick={onSelect}>
        {renderNodeContent()}
      </div>

      {/* Connection point - left side for input (target) - BLUE DOT - BIDIRECTIONAL */}
      <div
        className={`absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-sm transition-all z-20 cursor-pointer ${
          isConnecting
            ? 'bg-blue-500 hover:bg-blue-600 hover:scale-125 hover:ring-4 hover:ring-blue-300 animate-pulse'
            : 'bg-blue-400 hover:bg-blue-500 hover:scale-110 hover:ring-2 hover:ring-blue-300'
        }`}
        data-connection-point="input"
        data-node-id={node.id}
        onClick={(e) => {
          if (isConnecting) {
            // If connection mode is active, complete the connection
            handleConnectionEnd(e);
          } else {
            // If no connection active, start a new connection from this blue dot
            handleConnectionStart(e);
          }
        }}
        title={isConnecting ? "Click here to complete connection" : "Click to start or complete connection"}
      ></div>

      {/* Connection point - right side for output (source) - ORANGE DOT - BIDIRECTIONAL */}
      {node.type !== 'send_button' && (
        <div
          className={`absolute -right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md transition-all z-20 cursor-pointer ${
            isConnecting
              ? 'bg-orange-400 hover:bg-orange-500 hover:scale-125 hover:ring-4 hover:ring-orange-300 animate-pulse'
              : 'bg-orange-500 hover:bg-orange-600 hover:scale-110 hover:ring-2 hover:ring-orange-300'
          }`}
          data-connection-point="output"
          data-node-id={node.id}
          onClick={(e) => {
            if (isConnecting) {
              // If connection mode is active, complete the connection
              handleConnectionEnd(e);
            } else {
              // If no connection active, start a new connection
              handleConnectionStart(e);
            }
          }}
          title={isConnecting ? "Click here to complete connection" : "Click to start or complete connection"}
        ></div>
      )}
    </div>
  );
}
