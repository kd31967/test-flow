import { MessageSquare, MousePointerClick, List, Image, HelpCircle, Bot, Zap, GitBranch, FileText, Clock, ExternalLink, ShoppingBag, Database, StopCircle, Webhook, Table, MapPin, Navigation, Send } from 'lucide-react';

interface SidebarProps {
  onAddNode: (type: string) => void;
}

export default function Sidebar({ onAddNode }: SidebarProps) {
  const triggers = [
    { id: 'on_message', label: 'On Message', icon: MessageSquare, description: 'Triggered when a new message is created' },
    { id: 'catch_webhook', label: 'Catch Raw Webhook', icon: Webhook, description: 'Receive webhook data' }
  ];

  const actions = [
    { id: 'send_message', label: 'Send Message', icon: MessageSquare, description: 'Send a text message' },
    { id: 'send_media', label: 'Send Media', icon: Image, description: 'Send image/video/audio/document' },
    { id: 'send_button', label: 'Send Buttons', icon: MousePointerClick, description: 'Send interactive buttons' },
    { id: 'send_list', label: 'Send List', icon: List, description: 'Send interactive list' },
    { id: 'send_template', label: 'Send Template', icon: FileText, description: 'Send WhatsApp template' },
    { id: 'send_flow', label: 'Send Flow', icon: Send, description: 'Send WhatsApp Flow' },
    { id: 'send_location', label: 'Send Location', icon: MapPin, description: 'Send location coordinates' },
    { id: 'request_location', label: 'Request Location', icon: Navigation, description: 'Request user location' },
    { id: 'send_cta', label: 'Send CTA Message', icon: ExternalLink, description: 'Send call-to-action message' },
    { id: 'send_product', label: 'Send Product Message', icon: ShoppingBag, description: 'Send product catalog message' },
    { id: 'ask_question', label: 'Ask Question', icon: HelpCircle, description: 'Ask a question and wait for response' },
    { id: 'wait_for_reply', label: 'Wait for Reply', icon: Clock, description: 'Pause for user response' },
    { id: 'ai_agent', label: 'AI Agent', icon: Bot, description: 'AI agent interaction' },
    { id: 'http', label: 'HTTP Request', icon: Zap, description: 'Make HTTP API call' },
    { id: 'google_sheets', label: 'Google Sheets', icon: Table, description: 'Google Sheets integration' },
    { id: 'update_columns', label: 'Update Columns', icon: Database, description: 'Update database columns' },
    { id: 'condition', label: 'Condition', icon: GitBranch, description: 'Check a condition' },
    { id: 'delay', label: 'Delay', icon: Clock, description: 'Add a delay' },
    { id: 'stop_chatbot', label: 'Stop Chatbot', icon: StopCircle, description: 'Stop the conversation' }
  ];

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <input
          type="text"
          placeholder="Search components..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900">Triggers</h3>
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">2</span>
          </div>

          <div className="space-y-1">
            {triggers.map((trigger) => {
              const Icon = trigger.icon;
              return (
                <button
                  key={trigger.id}
                  onClick={() => onAddNode(trigger.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-orange-50 rounded-lg transition-colors group"
                >
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-orange-600" />
                  <span className="text-gray-700 group-hover:text-gray-900">{trigger.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-900">Actions</h3>
            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">19</span>
          </div>

          <div className="space-y-1">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => onAddNode(action.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-purple-50 rounded-lg transition-colors group"
                >
                  <Icon className="w-4 h-4 text-gray-500 group-hover:text-purple-600" />
                  <span className="text-gray-700 group-hover:text-gray-900">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
