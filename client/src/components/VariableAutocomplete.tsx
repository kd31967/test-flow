import { useState, useEffect, useRef } from 'react';
import { FlowVariable, SystemVariable } from '../lib/variableSystem';

interface VariableAutocompleteProps {
  isOpen: boolean;
  position: { x: number; y: number };
  searchTerm: string;
  flowVariables: FlowVariable[];
  systemVariables: SystemVariable[];
  onSelect: (variable: string) => void;
  onClose: () => void;
}

export default function VariableAutocomplete({
  isOpen,
  position,
  searchTerm,
  flowVariables,
  systemVariables,
  onSelect,
  onClose
}: VariableAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter variables based on search term
  const filteredSystemVars = systemVariables.filter(sv =>
    sv.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sv.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFlowVars = flowVariables.filter(fv => {
    const varName = `${fv.nodeName}.${fv.nodeId}.${fv.key}`;
    return varName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           fv.nodeType.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const allVariables = [
    ...filteredSystemVars.map(sv => ({
      type: 'system' as const,
      key: sv.key,
      description: sv.description,
      example: sv.example
    })),
    ...filteredFlowVars.map(fv => ({
      type: 'flow' as const,
      key: `${fv.nodeName}.${fv.nodeId}.${fv.key}`,
      description: `${fv.nodeType} node output`,
      example: typeof fv.value === 'object' ? JSON.stringify(fv.value) : String(fv.value)
    }))
  ];

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % allVariables.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + allVariables.length) % allVariables.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (allVariables[selectedIndex]) {
            onSelect(allVariables[selectedIndex].key);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allVariables, onSelect, onClose]);

  if (!isOpen || allVariables.length === 0) return null;

  return (
    <>
      {/* Backdrop to close on click */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />

      {/* Autocomplete dropdown */}
      <div
        ref={containerRef}
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl max-w-md"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxHeight: '400px',
          minWidth: '300px'
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Available Variables
        </div>

        {/* Variable list */}
        <div className="overflow-y-auto max-h-80">
          {allVariables.map((variable, index) => (
            <div
              key={variable.key}
              className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-gray-100 ${
                index === selectedIndex
                  ? 'bg-orange-50 border-l-4 border-l-orange-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelect(variable.key)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {/* Variable key */}
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-1.5 py-0.5 text-xs font-semibold rounded ${
                    variable.type === 'system'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {variable.type === 'system' ? 'SYSTEM' : 'FLOW'}
                </span>
                <code className="text-sm font-mono text-gray-900">
                  {`{{${variable.key}}}`}
                </code>
              </div>

              {/* Description */}
              <div className="text-xs text-gray-600 mb-1">
                {variable.description}
              </div>

              {/* Example value */}
              <div className="text-xs text-gray-500">
                <span className="font-medium">Example:</span>{' '}
                <span className="font-mono">{variable.example.substring(0, 50)}</span>
                {variable.example.length > 50 && '...'}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </>
  );
}
