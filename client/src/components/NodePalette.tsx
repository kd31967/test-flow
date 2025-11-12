import { NODE_TYPES } from '../types/flow';
import * as Icons from 'lucide-react';

export default function NodePalette() {
  const categories = {
    communication: 'Communication',
    data: 'Data Collection',
    logic: 'Logic & Control'
  };

  const handleDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Node Library</h2>
        <p className="text-sm text-gray-500 mt-1">Drag nodes to the canvas</p>
      </div>

      <div className="p-4 space-y-6">
        {Object.entries(categories).map(([key, label]) => {
          const categoryNodes = NODE_TYPES.filter(node => node.category === key);

          return (
            <div key={key}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {label}
              </h3>
              <div className="space-y-2">
                {categoryNodes.map((nodeType) => {
                  const IconComponent = (Icons as any)[nodeType.icon];

                  return (
                    <div
                      key={nodeType.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, nodeType.type)}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-move transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 group-hover:border-blue-500 flex items-center justify-center flex-shrink-0">
                        {IconComponent && <IconComponent className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 group-hover:text-blue-900">
                          {nodeType.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {nodeType.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
