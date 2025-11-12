import { Copy, Edit, Trash2, Circle } from 'lucide-react';

interface ExpandedFlowNodeProps {
  node: any;
  isSelected: boolean;
  isConnecting: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onConnectionStart: (nodeId: string, side: 'input' | 'output') => void;
  onConnectionEnd: (nodeId: string, side: 'input' | 'output') => void;
}

export default function ExpandedFlowNode({
  node,
  isSelected,
  isConnecting,
  onSelect,
  onDelete,
  onEdit,
  onDuplicate,
  onConnectionStart,
  onConnectionEnd,
}: ExpandedFlowNodeProps) {
  const getNodeColor = (type: string) => {
    const colors: Record<string, string> = {
      'on_message': 'bg-green-50 border-green-300',
      'webhook': 'bg-purple-50 border-purple-300',
      'send_message': 'bg-blue-50 border-blue-300',
      'send_button': 'bg-indigo-50 border-indigo-300',
      'send_media': 'bg-pink-50 border-pink-300',
      'wait_for_reply': 'bg-yellow-50 border-yellow-300',
      'http_api': 'bg-orange-50 border-orange-300',
      'database_query': 'bg-teal-50 border-teal-300',
      'ai_completion': 'bg-violet-50 border-violet-300',
      'email': 'bg-red-50 border-red-300',
      'transform': 'bg-gray-50 border-gray-300',
    };
    return colors[type] || 'bg-gray-50 border-gray-300';
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'on_message': return '💬';
      case 'webhook': return '🔗';
      case 'send_message': return '📤';
      case 'send_button': return '🔘';
      case 'send_media': return '🖼️';
      case 'wait_for_reply': return '⏳';
      case 'http_api': return '🌐';
      case 'database_query': return '🗄️';
      case 'ai_completion': return '🤖';
      case 'email': return '📧';
      case 'transform': return '⚙️';
      default: return '📦';
    }
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`relative bg-white rounded-lg border-2 shadow-md hover:shadow-lg transition-all cursor-pointer ${
        getNodeColor(node.type)
      } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
      style={{
        minWidth: '200px',
        minHeight: '80px',
      }}
    >
      {/* Input Connection Dot */}
      <div
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md cursor-crosshair hover:scale-125 transition-transform z-10"
        onMouseDown={(e) => {
          e.stopPropagation();
          onConnectionStart(node.id, 'input');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onConnectionEnd(node.id, 'input');
        }}
      >
        <Circle className="w-full h-full text-white" fill="currentColor" />
      </div>

      {/* Output Connection Dot */}
      <div
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-md cursor-crosshair hover:scale-125 transition-transform z-10"
        onMouseDown={(e) => {
          e.stopPropagation();
          onConnectionStart(node.id, 'output');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onConnectionEnd(node.id, 'output');
        }}
      >
        <Circle className="w-full h-full text-white" fill="currentColor" />
      </div>

      {/* Node Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getNodeIcon(node.type)}</span>
            <div>
              <h3 className="font-semibold text-sm text-gray-800">
                {node.data.label}
              </h3>
              {node.data.preview && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {node.data.preview}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isSelected && (
          <div className="flex gap-1 mt-3 pt-3 border-t border-gray-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center justify-center gap-1"
            >
              <Edit className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this node?')) {
                  onDelete();
                }
              }}
              className="flex-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
