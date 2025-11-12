import { useState, useEffect } from 'react';
import { Plus, Trash2, Image, Video, Type, AlertCircle, X } from 'lucide-react';
import { MediaButton, NodeDefinition } from '../types/flow';

interface SendButtonConfigProps {
  node: NodeDefinition;
  allNodes: NodeDefinition[];
  onUpdate: (node: NodeDefinition) => void;
}

export default function SendButtonConfig({
  node,
  allNodes,
  onUpdate
}: SendButtonConfigProps) {
  const [headerType, setHeaderType] = useState<'none' | 'text' | 'image' | 'video'>(
    node.data.config.headerType || 'none'
  );
  const [headerText, setHeaderText] = useState(node.data.config.headerText || '');
  const [headerMediaUrl, setHeaderMediaUrl] = useState(node.data.config.headerMediaUrl || '');
  const [bodyText, setBodyText] = useState(node.data.config.bodyText || '');
  const [footerText, setFooterText] = useState(node.data.config.footerText || '');
  const [buttons, setButtons] = useState<MediaButton[]>(node.data.config.buttons || []);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setHeaderType(node.data.config.headerType || 'none');
    setHeaderText(node.data.config.headerText || '');
    setHeaderMediaUrl(node.data.config.headerMediaUrl || '');
    setBodyText(node.data.config.bodyText || '');
    setFooterText(node.data.config.footerText || '');
    setButtons(node.data.config.buttons || []);
  }, [node]);

  const handleSave = () => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        config: {
          headerType,
          headerText,
          headerMediaUrl,
          bodyText,
          footerText,
          buttons
        }
      }
    });

    // Show success toast
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const addButton = () => {
    if (buttons.length >= 3) {
      return;
    }

    const newButton: MediaButton = {
      id: `btn_${Date.now()}`,
      title: `button${buttons.length + 1}`,
      nextNodeId: ''
    };

    setButtons([...buttons, newButton]);
  };

  const removeButton = (buttonId: string) => {
    setButtons(buttons.filter(b => b.id !== buttonId));
  };

  const updateButton = (buttonId: string, field: keyof MediaButton, value: string) => {
    setButtons(buttons.map(btn =>
      btn.id === buttonId ? { ...btn, [field]: value } : btn
    ));
  };

  const getAvailableNodes = () => {
    return allNodes.filter(n => n.id !== node.id);
  };

  const bodyCharsLeft = 1024 - bodyText.length;
  const footerCharsLeft = 60 - footerText.length;
  const isBodyTextEmpty = bodyText.trim() === '';

  return (
    <div className="flex flex-col h-full relative">
      {/* Success Toast */}
      {showSuccess && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <span className="text-lg">✅</span>
          <span className="font-medium">Node Saved Successfully</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Header Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Header Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'text', 'image', 'video'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setHeaderType(type)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                  headerType === type
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {type === 'none' && <X className="w-5 h-5 mb-1" />}
                {type === 'text' && <Type className="w-5 h-5 mb-1" />}
                {type === 'image' && <Image className="w-5 h-5 mb-1" />}
                {type === 'video' && <Video className="w-5 h-5 mb-1" />}
                <span className="text-xs capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Header Content */}
        {headerType !== 'none' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {headerType === 'text' ? 'Header Text' : 'Media URL'}
            </label>
            {headerType === 'text' ? (
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                placeholder="Enter header text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                maxLength={60}
              />
            ) : (
              <div>
                <input
                  type="url"
                  value={headerMediaUrl}
                  onChange={(e) => setHeaderMediaUrl(e.target.value)}
                  placeholder={`https://example.com/media.${headerType === 'image' ? 'jpg' : 'mp4'}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a publicly accessible URL for the {headerType}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Body Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Body Text <span className="text-red-500">*</span>
          </label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value.slice(0, 1024))}
            placeholder="Enter message body text"
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none ${
              isBodyTextEmpty ? 'border-red-300' : 'border-gray-300'
            }`}
            maxLength={1024}
          />
          <p className={`text-xs mt-1 ${isBodyTextEmpty ? 'text-red-600' : 'text-gray-500'}`}>
            {isBodyTextEmpty ? 'Body text is required' : `${bodyCharsLeft} characters left`}
          </p>
        </div>

        {/* Buttons Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Interactive Buttons <span className="text-red-500">*</span>
            </label>
            <button
              onClick={addButton}
              disabled={buttons.length >= 3}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Button ({buttons.length}/3)
            </button>
          </div>

          {buttons.length === 0 && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">No buttons added yet</p>
              <button
                onClick={addButton}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add First Button
              </button>
            </div>
          )}

          <div className="space-y-3">
            {buttons.map((button, index) => (
              <div
                key={button.id}
                className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-gray-500">Button {index + 1}</span>
                  <button
                    onClick={() => removeButton(button.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Button Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={button.title}
                    onChange={(e) => updateButton(button.id, 'title', e.target.value.slice(0, 20))}
                    placeholder={`button${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {20 - button.title.length} characters left
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Footer Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Footer Text <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={footerText}
            onChange={(e) => setFooterText(e.target.value.slice(0, 60))}
            placeholder="Enter footer text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            maxLength={60}
          />
          <p className="text-xs text-gray-500 mt-1">
            {footerCharsLeft} characters left
          </p>
        </div>

        {/* Validation Messages */}
        {isBodyTextEmpty && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">Body text is required</p>
          </div>
        )}

        {buttons.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">At least one button is required</p>
          </div>
        )}
      </div>

      {/* Save Button - Sticky Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex gap-3">
        <button
          onClick={() => {
            // Reset to initial state
            setHeaderType(node.data.config.headerType || 'none');
            setHeaderText(node.data.config.headerText || '');
            setHeaderMediaUrl(node.data.config.headerMediaUrl || '');
            setBodyText(node.data.config.bodyText || '');
            setFooterText(node.data.config.footerText || '');
            setButtons(node.data.config.buttons || []);
          }}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isBodyTextEmpty || buttons.length === 0}
          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save
        </button>
      </div>
    </div>
  );
}
