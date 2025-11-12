import { Edit2, Trash2, Copy, MessageSquare, MousePointerClick, List, Image, HelpCircle, Bot, Zap, GitBranch, FileText, Clock, ExternalLink, ShoppingBag, Database, StopCircle, Webhook, Table } from 'lucide-react';

interface FlowNodeProps {
  node: {
    id: string;
    type: string;
    position: { x: number; y: number };
    data: any;
  };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}

const nodeIcons: Record<string, any> = {
  on_message: MessageSquare,
  catch_webhook: Webhook,
  send_message: MousePointerClick,
  ask_question: HelpCircle,
  wait_for_reply: HelpCircle,
  ai_agent: Bot,
  http: Zap,
  delay: Clock,
  condition: GitBranch,
  send_template: FileText,
  send_button: MousePointerClick,
  send_list: List,
  send_media: Image,
  send_cta: ExternalLink,
  send_product: ShoppingBag,
  google_sheets: Table,
  update_columns: Database,
  stop_chatbot: StopCircle
};

const nodeColors: Record<string, string> = {
  on_message: 'border-orange-300 bg-orange-50',
  catch_webhook: 'border-purple-300 bg-purple-50',
  send_message: 'border-orange-300 bg-orange-50',
  ask_question: 'border-blue-300 bg-blue-50',
  wait_for_reply: 'border-blue-300 bg-blue-50',
  ai_agent: 'border-green-300 bg-green-50',
  http: 'border-pink-300 bg-pink-50',
  delay: 'border-gray-300 bg-gray-50',
  condition: 'border-yellow-300 bg-yellow-50',
  send_template: 'border-green-300 bg-green-50',
  send_button: 'border-orange-300 bg-orange-50',
  send_list: 'border-orange-300 bg-orange-50',
  send_media: 'border-purple-300 bg-purple-50',
  send_cta: 'border-blue-300 bg-blue-50',
  send_product: 'border-teal-300 bg-teal-50',
  google_sheets: 'border-green-300 bg-green-50',
  update_columns: 'border-indigo-300 bg-indigo-50',
  stop_chatbot: 'border-red-300 bg-red-50',
  button_1_branch: 'border-orange-500 bg-orange-100',
  button_2_branch: 'border-blue-400 bg-blue-100',
  button_3_branch: 'border-green-400 bg-green-100',
  button_4_branch: 'border-purple-400 bg-purple-100'
};

export default function FlowNode({ node, isSelected, onSelect, onDelete, onEdit, onDuplicate }: FlowNodeProps) {
  const Icon = nodeIcons[node.type] || MessageSquare;
  const colorClass = nodeColors[node.type] || 'border-gray-300 bg-gray-50';

  // Check if this is a Button 1 branch (draggable and connectable)
  const isButton1Branch = node.type === 'button_1_branch';
  const isDraggable = isButton1Branch || node.data.config?.isDraggable;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        cursor: isDraggable ? 'move' : 'default'
      }}
      onClick={onSelect}
      className={`
        w-64 rounded-lg border-2 transition-all
        ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2' : ''}
        ${colorClass}
        ${isDraggable ? 'shadow-lg' : ''}
      `}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {node.data.label || node.type.replace(/_/g, ' ')}
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
              className="p-1 hover:bg-white rounded transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-1 hover:bg-white rounded transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 hover:bg-white rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        {node.data.preview && (
          <div className="text-xs text-gray-600 mt-2 line-clamp-2">
            {node.data.preview}
          </div>
        )}

        {node.type === 'condition' && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-600">True</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-600">False</span>
            </div>
          </div>
        )}
      </div>

      {/* Connection points - Only visible for Button 1 nodes */}
      {isButton1Branch && (
        <>
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-lg cursor-crosshair hover:scale-110 transition-transform"
            data-connection-point="bottom"
            title="Drag to connect to another node"
          ></div>
          <div
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-lg"
            data-connection-point="top"
            title="Connection point"
          ></div>
        </>
      )}
    </div>
  );
}
