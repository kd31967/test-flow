import { useState, useEffect } from 'react';
import { NodeDefinition, NODE_TYPES } from '../types/flow';
import { X } from 'lucide-react';
import SendButtonConfig from './SendButtonConfig';
import HttpApiConfig from './HttpApiConfig';
import WebhookConfig from './WebhookConfig';
import GoogleSheetsConfig from './GoogleSheetsConfig';
import AICompletionConfig from './AICompletionConfig';
import DatabaseQueryConfig from './DatabaseQueryConfig';
import EmailConfig from './EmailConfig';
import TransformConfig from './TransformConfig';
import { FlowVariable } from '../lib/variableSystem';

interface NodeConfigProps {
  node: NodeDefinition;
  allNodes?: NodeDefinition[];
  onUpdate: (node: NodeDefinition) => void;
  onClose: () => void;
  flowId?: string;
  flowName?: string;
  flowVariables?: FlowVariable[];
}

export default function NodeConfig({ node, allNodes = [], onUpdate, onClose, flowId, flowName, flowVariables = [] }: NodeConfigProps) {
  const [config, setConfig] = useState(node.data.config);
  const nodeType = NODE_TYPES.find(n => n.type === node.type);

  const handleConfigUpdate = (newConfig: any) => {
    setConfig(newConfig);
    onUpdate({
      ...node,
      data: {
        ...node.data,
        config: newConfig
      }
    });
  };

  if (node.type === 'send_button') {
    return (
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Send Button</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SendButtonConfig
          node={node}
          allNodes={allNodes}
          onUpdate={onUpdate}
        />
      </div>
    );
  }

  if (node.type === 'api') {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">HTTP API Integration</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <HttpApiConfig
            config={config}
            onChange={handleConfigUpdate}
            flowVariables={flowVariables}
          />
        </div>
      </div>
    );
  }

  if (node.type === 'webhook' || node.type === 'catch_webhook') {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">{node.type === 'catch_webhook' ? 'Catch Webhook' : 'Webhook Receiver'}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <WebhookConfig
            config={config}
            onChange={handleConfigUpdate}
            nodeId={node.id}
            flowId={flowId}
            flowName={flowName}
            flowVariables={flowVariables}
          />
        </div>
      </div>
    );
  }

  if (node.type === 'google_sheets') {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Google Sheets Integration</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <GoogleSheetsConfig
            config={config}
            onChange={handleConfigUpdate}
          />
        </div>
      </div>
    );
  }

  if (node.type === 'ai_completion') {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">AI Completion</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <AICompletionConfig
            config={config}
            onChange={handleConfigUpdate}
          />
        </div>
      </div>
    );
  }

  if (node.type === 'database_query') {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Database Query</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <DatabaseQueryConfig
            config={config}
            onChange={handleConfigUpdate}
          />
        </div>
      </div>
    );
  }

  if (node.type === 'email') {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Send Email</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <EmailConfig
            config={config}
            onChange={handleConfigUpdate}
          />
        </div>
      </div>
    );
  }

  if (node.type === 'transform') {
    return (
      <div className="w-[600px] bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Transform Data</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <TransformConfig
            config={config}
            onChange={handleConfigUpdate}
          />
        </div>
      </div>
    );
  }

  if (node.type === 'send_template') {
    return (
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Send Template</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              value={config.template_name || ''}
              onChange={(e) => handleConfigUpdate({ ...config, template_name: e.target.value })}
              placeholder="e.g., welcome_message"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language Code</label>
            <input
              type="text"
              value={config.language || 'en_US'}
              onChange={(e) => handleConfigUpdate({ ...config, language: e.target.value })}
              placeholder="en_US"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Components (JSON)</label>
            <textarea
              value={typeof config.components === 'string' ? config.components : JSON.stringify(config.components || [], null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigUpdate({ ...config, components: parsed });
                } catch {
                  handleConfigUpdate({ ...config, components: e.target.value });
                }
              }}
              placeholder='[{"type":"body","parameters":[{"type":"text","text":"{{user.name}}"}]}]'
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Template components with parameters</p>
          </div>
        </div>
      </div>
    );
  }

  if (node.type === 'send_location') {
    return (
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Send Location</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="text"
              value={config.latitude || ''}
              onChange={(e) => handleConfigUpdate({ ...config, latitude: e.target.value })}
              placeholder="37.7749 or {{location.latitude}}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="text"
              value={config.longitude || ''}
              onChange={(e) => handleConfigUpdate({ ...config, longitude: e.target.value })}
              placeholder="-122.4194 or {{location.longitude}}"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Name</label>
            <input
              type="text"
              value={config.name || ''}
              onChange={(e) => handleConfigUpdate({ ...config, name: e.target.value })}
              placeholder="San Francisco"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={config.address || ''}
              onChange={(e) => handleConfigUpdate({ ...config, address: e.target.value })}
              placeholder="123 Market St, San Francisco, CA"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500">💡 Supports variables like {'{'}location.latitude{'}'}</p>
        </div>
      </div>
    );
  }

  if (node.type === 'request_location') {
    return (
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Request Location</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
            <textarea
              value={config.body || config.bodyText || ''}
              onChange={(e) => handleConfigUpdate({ ...config, body: e.target.value, bodyText: e.target.value })}
              placeholder="📍 Please share your location"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Message requesting user's location</p>
          </div>
          <p className="text-xs text-gray-500">When user shares location, variables will be created: {'{'}location.latitude{'}'}, {'{'}location.longitude{'}'}, {'{'}location.name{'}'}, {'{'}location.address{'}'}</p>
        </div>
      </div>
    );
  }

  if (node.type === 'send_list') {
    const [sections, setSections] = useState(config.sections || [{ title: '', rows: [{ id: `row_${Date.now()}`, title: '', description: '' }] }]);

    const addSection = () => {
      const newSections = [...sections, { title: '', rows: [{ id: `row_${Date.now()}`, title: '', description: '' }] }];
      setSections(newSections);
      handleConfigUpdate({ ...config, sections: newSections });
    };

    const removeSection = (sectionIndex: number) => {
      const newSections = sections.filter((_: any, i: number) => i !== sectionIndex);
      setSections(newSections);
      handleConfigUpdate({ ...config, sections: newSections });
    };

    const updateSection = (sectionIndex: number, field: string, value: any) => {
      const newSections = sections.map((section: any, i: number) =>
        i === sectionIndex ? { ...section, [field]: value } : section
      );
      setSections(newSections);
      handleConfigUpdate({ ...config, sections: newSections });
    };

    const addRow = (sectionIndex: number) => {
      const newSections = sections.map((section: any, i: number) =>
        i === sectionIndex
          ? { ...section, rows: [...section.rows, { id: `row_${Date.now()}`, title: '', description: '' }] }
          : section
      );
      setSections(newSections);
      handleConfigUpdate({ ...config, sections: newSections });
    };

    const removeRow = (sectionIndex: number, rowIndex: number) => {
      const newSections = sections.map((section: any, i: number) =>
        i === sectionIndex
          ? { ...section, rows: section.rows.filter((_: any, ri: number) => ri !== rowIndex) }
          : section
      );
      setSections(newSections);
      handleConfigUpdate({ ...config, sections: newSections });
    };

    const updateRow = (sectionIndex: number, rowIndex: number, field: string, value: any) => {
      const newSections = sections.map((section: any, i: number) =>
        i === sectionIndex
          ? {
              ...section,
              rows: section.rows.map((row: any, ri: number) =>
                ri === rowIndex ? { ...row, [field]: value } : row
              )
            }
          : section
      );
      setSections(newSections);
      handleConfigUpdate({ ...config, sections: newSections });
    };

    return (
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Send List Message</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button onClick={onClose} data-testid="button-close" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Header Type</label>
            <select
              value={config.header?.type || 'text'}
              onChange={(e) => handleConfigUpdate({ ...config, header: { ...config.header, type: e.target.value } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="select-header-type"
            >
              <option value="none">None</option>
              <option value="text">Text</option>
            </select>
          </div>

          {config.header?.type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Header Text</label>
              <input
                type="text"
                value={config.header?.text || ''}
                onChange={(e) => handleConfigUpdate({ ...config, header: { ...config.header, text: e.target.value } })}
                placeholder="Header text"
                maxLength={60}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                data-testid="input-header-text"
              />
              <p className="text-xs text-gray-500 mt-1">{60 - (config.header?.text || '').length} characters left</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
            <textarea
              value={config.body || ''}
              onChange={(e) => handleConfigUpdate({ ...config, body: e.target.value })}
              placeholder="Enter body text"
              maxLength={1024}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="input-body"
            />
            <p className="text-xs text-gray-500 mt-1">{1024 - (config.body || '').length} characters left</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
            <input
              type="text"
              value={config.button || 'View Options'}
              onChange={(e) => handleConfigUpdate({ ...config, button: e.target.value })}
              placeholder="View Options"
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="input-button"
            />
            <p className="text-xs text-gray-500 mt-1">{20 - (config.button || 'View Options').length} characters left</p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">Sections</label>
            {sections.map((section: any, sectionIndex: number) => (
              <div key={sectionIndex} className="border border-gray-200 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={section.title || ''}
                    onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                    placeholder="Section title"
                    maxLength={24}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    data-testid={`input-section-title-${sectionIndex}`}
                  />
                  {sections.length > 1 && (
                    <button
                      onClick={() => removeSection(sectionIndex)}
                      className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      data-testid={`button-remove-section-${sectionIndex}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">{24 - (section.title || '').length} characters left</p>

                {section.rows.map((row: any, rowIndex: number) => (
                  <div key={rowIndex} className="bg-gray-50 rounded p-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={row.title || ''}
                        onChange={(e) => updateRow(sectionIndex, rowIndex, 'title', e.target.value)}
                        placeholder="Row title"
                        maxLength={24}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                        data-testid={`input-row-title-${sectionIndex}-${rowIndex}`}
                      />
                      <button
                        onClick={() => removeRow(sectionIndex, rowIndex)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        data-testid={`button-remove-row-${sectionIndex}-${rowIndex}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">{24 - (row.title || '').length} characters left</p>
                    
                    <input
                      type="text"
                      value={row.description || ''}
                      onChange={(e) => updateRow(sectionIndex, rowIndex, 'description', e.target.value)}
                      placeholder="Row description (Optional)"
                      maxLength={72}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      data-testid={`input-row-description-${sectionIndex}-${rowIndex}`}
                    />
                    <p className="text-xs text-gray-500">{72 - (row.description || '').length} characters left</p>
                  </div>
                ))}

                <button
                  onClick={() => addRow(sectionIndex)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  data-testid={`button-add-row-${sectionIndex}`}
                >
                  + Add Row
                </button>
              </div>
            ))}

            <button
              onClick={addSection}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              data-testid="button-add-section"
            >
              + Add Section
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
            <input
              type="text"
              value={config.footer || ''}
              onChange={(e) => handleConfigUpdate({ ...config, footer: e.target.value })}
              placeholder="Enter footer text"
              maxLength={60}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              data-testid="input-footer"
            />
            <p className="text-xs text-gray-500 mt-1">{60 - (config.footer || '').length} characters left</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
            💡 Users can select one item from your list. The selected item will be available as a variable.
          </div>
        </div>
      </div>
    );
  }

  if (node.type === 'send_flow') {
    return (
      <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-semibold text-gray-900">Send Flow</h3>
            <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Header</label>
            <input
              type="text"
              value={config.header || ''}
              onChange={(e) => handleConfigUpdate({ ...config, header: e.target.value })}
              placeholder="Flow Header"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
            <textarea
              value={config.body || ''}
              onChange={(e) => handleConfigUpdate({ ...config, body: e.target.value })}
              placeholder="Flow Body"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer</label>
            <input
              type="text"
              value={config.footer || ''}
              onChange={(e) => handleConfigUpdate({ ...config, footer: e.target.value })}
              placeholder="Footer text (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Flow ID</label>
            <input
              type="text"
              value={config.flow_id || ''}
              onChange={(e) => handleConfigUpdate({ ...config, flow_id: e.target.value })}
              placeholder="Your WhatsApp Flow ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Flow Token</label>
            <input
              type="text"
              value={config.flow_token || ''}
              onChange={(e) => handleConfigUpdate({ ...config, flow_token: e.target.value })}
              placeholder="Flow token for tracking"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
            <input
              type="text"
              value={config.flow_cta || 'Submit'}
              onChange={(e) => handleConfigUpdate({ ...config, flow_cta: e.target.value })}
              placeholder="Submit"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Screen ID</label>
            <input
              type="text"
              value={config.screen || ''}
              onChange={(e) => handleConfigUpdate({ ...config, screen: e.target.value })}
              placeholder="SCREEN_ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Flow Data (JSON)</label>
            <textarea
              value={typeof config.flow_data === 'string' ? config.flow_data : JSON.stringify(config.flow_data || {}, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigUpdate({ ...config, flow_data: parsed });
                } catch {
                  handleConfigUpdate({ ...config, flow_data: e.target.value });
                }
              }}
              placeholder='{"param1": "value1"}'
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    setConfig(node.data.config);
  }, [node]);

  const handleConfigChange = (fieldName: string, value: any) => {
    const newConfig = { ...config, [fieldName]: value };
    setConfig(newConfig);
  };

  const handleSave = () => {
    onUpdate({
      ...node,
      data: {
        ...node.data,
        config
      }
    });
  };

  const renderField = (field: any) => {
    const value = config[field.name] ?? field.defaultValue ?? '';

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleConfigChange(field.name, Number(e.target.value))}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select...</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleConfigChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable</span>
          </label>
        );

      case 'json':
        return (
          <div>
            <textarea
              value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleConfigChange(field.name, parsed);
                } catch {
                  handleConfigChange(field.name, e.target.value);
                }
              }}
              placeholder={field.placeholder}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Enter valid JSON</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h3 className="font-semibold text-gray-900">{nodeType?.label}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{node.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">{nodeType?.description}</p>
        </div>

        {nodeType?.configFields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Variable Syntax</h4>
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <code className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono">
                {'{{variable}}'}
              </code>
              <span className="text-gray-600">Insert variable value</span>
            </div>
            <div className="flex items-start gap-2">
              <code className="bg-white px-2 py-0.5 rounded border border-gray-200 font-mono">
                {'{{user.name}}'}
              </code>
              <span className="text-gray-600">Nested object access</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
