import { useState, useRef, useEffect } from 'react';
import VariableAutocomplete from './VariableAutocomplete';
import { FlowVariable, SystemVariable } from '../lib/variableSystem';

interface VariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  flowVariables?: FlowVariable[];
  systemVariables?: SystemVariable[];
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export default function VariableInput({
  value,
  onChange,
  placeholder,
  flowVariables = [],
  systemVariables = [],
  multiline = false,
  rows = 4,
  className = ''
}: VariableInputProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart || 0;

    onChange(newValue);
    setCursorPosition(cursorPos);

    // Check if user typed {{
    const beforeCursor = newValue.substring(0, cursorPos);
    const lastOpenBraces = beforeCursor.lastIndexOf('{{');

    if (lastOpenBraces !== -1) {
      const afterBraces = beforeCursor.substring(lastOpenBraces + 2);
      const closeBraces = afterBraces.indexOf('}}');

      if (closeBraces === -1) {
        // We're inside {{ }}
        setSearchTerm(afterBraces);
        setShowAutocomplete(true);

        // Calculate position for autocomplete
        if (inputRef.current) {
          const rect = inputRef.current.getBoundingClientRect();
          setAutocompletePosition({
            x: rect.left,
            y: rect.bottom + 5
          });
        }
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleVariableSelect = (variableKey: string) => {
    if (!inputRef.current) return;

    const beforeCursor = value.substring(0, cursorPosition);
    const afterCursor = value.substring(cursorPosition);
    const lastOpenBraces = beforeCursor.lastIndexOf('{{');

    if (lastOpenBraces !== -1) {
      const newValue =
        value.substring(0, lastOpenBraces) +
        `{{${variableKey}}}` +
        afterCursor;

      onChange(newValue);

      // Set cursor after the inserted variable
      setTimeout(() => {
        const newCursorPos = lastOpenBraces + variableKey.length + 4;
        inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        inputRef.current?.focus();
      }, 0);
    }

    setShowAutocomplete(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '{' && e.shiftKey) {
      // Don't interfere with autocomplete keyboard nav when it's open
      if (!showAutocomplete) {
        // User might be starting to type {{
        setTimeout(() => {
          if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            setAutocompletePosition({
              x: rect.left,
              y: rect.bottom + 5
            });
          }
        }, 10);
      }
    }
  };

  const commonProps = {
    ref: inputRef as any,
    value,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    placeholder,
    className: `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${className}`
  };

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          {...commonProps}
          rows={rows}
          className={`${commonProps.className} resize-none`}
        />
      ) : (
        <input
          {...commonProps}
          type="text"
        />
      )}

      <VariableAutocomplete
        isOpen={showAutocomplete}
        position={autocompletePosition}
        searchTerm={searchTerm}
        flowVariables={flowVariables}
        systemVariables={systemVariables}
        onSelect={handleVariableSelect}
        onClose={() => setShowAutocomplete(false)}
      />

      {/* Helper text */}
      <div className="mt-1 text-xs text-gray-500">
        Type <code className="px-1 py-0.5 bg-gray-100 rounded font-mono">{'{{'}</code> to insert variables
      </div>
    </div>
  );
}
