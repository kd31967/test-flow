import { X, Plus, Trash2, Upload } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/api';
import NodeConfig from './NodeConfig';
import { generateWebhookUrl } from '../config/environment';
import { FlowVariable, SystemVariables } from '../lib/variableSystem';
import VariableInput from './VariableInput';

interface ConfigPanelProps {
  node: any;
  allNodes?: any[];
  onUpdate: (updatedNode: any) => void;
  onClose: () => void;
  flowId?: string;
  flowVariables?: FlowVariable[];
}

export default function ConfigPanel({ node, allNodes = [], onUpdate, onClose, flowId, flowVariables = [] }: ConfigPanelProps) {
  const [config, setConfig] = useState(node.data.config || {});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const systemVariables = new SystemVariables();

  // Use specialized NodeConfig for send_button and other node types from flow.ts
  const useSpecializedConfig = ['send_button', 'send_list', 'send_template', 'send_location', 'request_location', 'send_flow', 
    'message', 'button_message', 'list_message', 'template',
    'cta_url', 'form', 'capture_response', 'webhook', 'catch_webhook', 'conditional', 'api', 'delay', 'end'].includes(node.type);

  if (useSpecializedConfig) {
    return <NodeConfig node={node} allNodes={allNodes} onUpdate={onUpdate} onClose={onClose} flowId={flowId} flowName={(node as any).flowName} flowVariables={flowVariables} />;
  }

  useEffect(() => {
    setConfig(node.data.config || {});
  }, [node]);

  const handleUpdate = (field: string, value: any) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    onUpdate({
      ...node,
      data: {
        ...node.data,
        config: newConfig
      }
    });
  };

  const renderField = () => {
    switch (node.type) {
      case 'on_message':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
              <select
                value={config.messageType || 'Text'}
                onChange={(e) => handleUpdate('messageType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>Text</option>
                <option>Image</option>
                <option>Video</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
              <input
                type="text"
                value={config.keywords || ''}
                onChange={(e) => handleUpdate('keywords', e.target.value)}
                placeholder="Add keyword..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">Separate keywords with commas. Use commas for multiple keywords.</p>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.fuzzyMatching || false}
                  onChange={(e) => handleUpdate('fuzzyMatching', e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700">Enable Fuzzy Matching</div>
                  <div className="text-xs text-gray-500">Allow partial keyword matches with configurable sensitivity</div>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Numbers</label>
              <input
                type="text"
                value={config.phoneNumbers || ''}
                onChange={(e) => handleUpdate('phoneNumbers', e.target.value)}
                placeholder="15557735263"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session timeout (minutes)</label>
              <input
                type="number"
                value={config.sessionTimeout || 5}
                onChange={(e) => handleUpdate('sessionTimeout', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        );

      case 'send_message':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Answer Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['Text', 'Image', 'Video', 'Document', 'Audio', 'Interactive'].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="answerType"
                      value={type}
                      checked={config.answerType === type}
                      onChange={(e) => handleUpdate('answerType', e.target.value)}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer Text</label>
              <VariableInput
                value={config.answerText || ''}
                onChange={(value) => handleUpdate('answerText', value)}
                placeholder="Type your message... Use {{ to insert variables"
                flowVariables={flowVariables}
                systemVariables={systemVariables.getDefinitions()}
                multiline
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">1024 characters left</p>
            </div>

            <button className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
              Next Step
            </button>
          </div>
        );

      case 'wait_for_reply':
        return (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Wait for a reply</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Save reply as</label>
              <input
                type="text"
                value={config.saveAs || ''}
                onChange={(e) => handleUpdate('saveAs', e.target.value)}
                placeholder="variable_name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check a condition</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Match</span>
                  <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option>Any</option>
                    <option>All</option>
                  </select>
                  <span className="text-sm text-gray-600">of these conditions:</span>
                </div>

                <div className="space-y-2">
                  {(config.conditions || ['']).map((condition: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={condition}
                        onChange={(e) => {
                          const newConditions = [...(config.conditions || [''])];
                          newConditions[index] = e.target.value;
                          handleUpdate('conditions', newConditions);
                        }}
                        placeholder="{{ASIB.JilvYR.message}}"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option>Contains</option>
                        <option>Equals</option>
                        <option>Starts with</option>
                        <option>Ends with</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Hi"
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={() => {
                          const newConditions = (config.conditions || ['']).filter((_: any, i: number) => i !== index);
                          handleUpdate('conditions', newConditions);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const newConditions = [...(config.conditions || ['']), ''];
                    handleUpdate('conditions', newConditions);
                  }}
                  className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add another condition
                </button>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="p-3 border border-gray-300 rounded-lg text-center">
                    <div className="text-xs text-gray-600">True</div>
                  </div>
                  <div className="p-3 border border-gray-300 rounded-lg text-center">
                    <div className="text-xs text-gray-600">False</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'send_button':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Header Type</label>
              <select
                value={config.headerType || 'None'}
                onChange={(e) => handleUpdate('headerType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>None</option>
                <option>Text</option>
                <option>Image</option>
                <option>Video</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
              <textarea
                value={config.bodyText || ''}
                onChange={(e) => handleUpdate('bodyText', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">1024 characters left</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Title</label>
              <input
                type="text"
                value={config.buttonTitle || ''}
                onChange={(e) => handleUpdate('buttonTitle', e.target.value)}
                placeholder="Button Text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">20 characters left</p>
            </div>

            <button className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
              <Plus className="w-4 h-4" />
              Add Button
            </button>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
              <input
                type="text"
                value={config.footerText || ''}
                onChange={(e) => handleUpdate('footerText', e.target.value)}
                placeholder="Enter footer text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">60 characters left</p>
            </div>
          </div>
        );

      case 'send_list':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Header Type</label>
              <select
                value={config.headerType || 'None'}
                onChange={(e) => handleUpdate('headerType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>None</option>
                <option>Text</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
              <textarea
                value={config.bodyText || ''}
                onChange={(e) => handleUpdate('bodyText', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">1024 characters left</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
              <input
                type="text"
                value={config.buttonText || 'View Options'}
                onChange={(e) => handleUpdate('buttonText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">20 characters left</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sections</label>
              <div className="space-y-2">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    value={config.sectionTitle || 'Section title'}
                    onChange={(e) => handleUpdate('sectionTitle', e.target.value)}
                    placeholder="Section title"
                    className="w-full px-2 py-1 text-sm border-none focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">24 characters left</p>

                  <div className="mt-2">
                    <input
                      type="text"
                      value={config.rowTitle || 'Row title'}
                      onChange={(e) => handleUpdate('rowTitle', e.target.value)}
                      placeholder="Row title"
                      className="w-full px-2 py-1 text-sm border-none focus:outline-none"
                    />
                    <p className="text-xs text-gray-500">24 characters left</p>

                    <input
                      type="text"
                      placeholder="Row description"
                      className="w-full px-2 py-1 text-sm border-none focus:outline-none mt-1"
                    />
                    <p className="text-xs text-gray-500">72 characters left</p>

                    <button className="p-1 text-red-500 hover:bg-red-50 rounded mt-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>

                <button className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
              <input
                type="text"
                value={config.footerText || ''}
                onChange={(e) => handleUpdate('footerText', e.target.value)}
                placeholder="Enter footer text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">60 characters left</p>
            </div>
          </div>
        );

      case 'send_media':
        const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          if (!file) return;

          const mediaType = (config.mediaType || 'image').toLowerCase();

          // Validate file type
          const validTypes: Record<string, string[]> = {
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'],
            video: ['video/mp4', 'video/3gpp', 'video/quicktime', 'video/x-msvideo'],
            audio: ['audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/aac', 'audio/amr'],
            document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
          };

          if (!validTypes[mediaType]?.some(type => file.type.startsWith(type.split('/')[0]))) {
            alert(`Invalid file type for ${mediaType}. Please select a valid ${mediaType} file.`);
            return;
          }

          const maxSizes: Record<string, number> = {
            image: 5 * 1024 * 1024, // 5MB
            video: 16 * 1024 * 1024, // 16MB
            audio: 16 * 1024 * 1024, // 16MB
            document: 100 * 1024 * 1024 // 100MB
          };

          if (file.size > maxSizes[mediaType]) {
            alert(`File too large! Maximum size for ${mediaType} is ${maxSizes[mediaType] / (1024 * 1024)}MB`);
            return;
          }

          setUploading(true);
          setUploadProgress(0);

          try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `${mediaType}/${fileName}`;

            setUploadProgress(30);

            const { error } = await supabase.storage
              .from('whatsapp-media')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) throw error;

            setUploadProgress(80);

            const { data: urlData } = supabase.storage
              .from('whatsapp-media')
              .getPublicUrl(filePath);

            handleUpdate('mediaUrl', urlData.publicUrl);
            handleUpdate('uploadedFileName', file.name);
            setUploadProgress(100);

            setTimeout(() => {
              alert('File uploaded successfully!');
            }, 300);
          } catch (error: any) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
          } finally {
            setTimeout(() => {
              setUploading(false);
              setUploadProgress(0);
            }, 500);
          }
        };

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
              <select
                value={config.mediaType || 'image'}
                onChange={(e) => handleUpdate('mediaType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="audio">Audio</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {config.mediaType === 'image' && 'Supported: JPG, PNG, GIF, SVG, WEBP (Max 5MB)'}
                {config.mediaType === 'video' && 'Supported: MP4, 3GP, MOV, AVI (Max 16MB)'}
                {config.mediaType === 'document' && 'Supported: PDF, DOC, DOCX, XLS, XLSX, TXT (Max 100MB)'}
                {config.mediaType === 'audio' && 'Supported: MP3, OGG, AAC, AMR, WAV (Max 16MB)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer bg-gray-50 hover:bg-orange-50"
                onClick={() => document.getElementById('media-upload')?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('border-orange-500', 'bg-orange-100');
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-orange-500', 'bg-orange-100');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('border-orange-500', 'bg-orange-100');
                  const file = e.dataTransfer.files[0];
                  if (file) {
                    const input = document.getElementById('media-upload') as HTMLInputElement;
                    if (input) {
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(file);
                      input.files = dataTransfer.files;
                      handleFileUpload({ target: { files: dataTransfer.files } } as any);
                    }
                  }
                }}
              >
                <input
                  type="file"
                  id="media-upload"
                  accept={(() => {
                    const acceptMap: Record<string, string> = {
                      image: 'image/jpeg,image/png,image/gif,image/svg+xml,image/webp,.jpg,.jpeg,.png,.gif,.svg,.webp',
                      video: 'video/mp4,video/3gpp,video/quicktime,video/x-msvideo,.mp4,.3gp,.mov,.avi',
                      audio: 'audio/mpeg,audio/mp3,audio/ogg,audio/aac,audio/amr,audio/wav,.mp3,.ogg,.aac,.amr,.wav',
                      document: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,.pdf,.doc,.docx,.xls,.xlsx,.txt'
                    };
                    return acceptMap[config.mediaType || 'image'] || 'image/*';
                  })()}
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="pointer-events-none inline-flex flex-col items-center">
                  <Upload className={`w-12 h-12 mb-2 ${uploading ? 'text-gray-400' : 'text-orange-500'}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {uploading ? 'Uploading...' : 'Click anywhere or drag and drop'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {config.uploadedFileName || 'No file selected'}
                  </span>
                </div>
              </div>
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media URL</label>
              <input
                type="url"
                value={config.mediaUrl || ''}
                onChange={(e) => handleUpdate('mediaUrl', e.target.value)}
                placeholder="https://example.com/media.jpg"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a publicly accessible URL for your media file
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption (Optional)</label>
              <textarea
                value={config.caption || ''}
                onChange={(e) => handleUpdate('caption', e.target.value)}
                rows={2}
                placeholder="Add a caption for the media..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum 1024 characters
              </p>
            </div>

            {config.mediaType === 'document' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filename (Optional)</label>
                <input
                  type="text"
                  value={config.filename || ''}
                  onChange={(e) => handleUpdate('filename', e.target.value)}
                  placeholder="document.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Custom filename for the document
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> Make sure your media URL is publicly accessible and uses HTTPS.
                WhatsApp will download and cache the media from this URL.
              </p>
            </div>
          </div>
        );

      case 'catch_webhook':
        // Generate dynamic webhook URL using actual flow and node IDs
        const dynamicWebhookUrl = generateWebhookUrl(
          flowId || 'flow_id_here',
          node.id || 'node_id_here'
        );

        return (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-green-900">Configured</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wait until flow is done</label>
              <select
                value={config.waitForFlow || 'No'}
                onChange={(e) => handleUpdate('waitForFlow', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook</label>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  type="text"
                  value={dynamicWebhookUrl}
                  readOnly
                  className="w-full px-2 py-1 text-xs bg-transparent border-none focus:outline-none text-blue-900 font-mono"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Dynamic webhook URL generated from actual server: <strong>{window.location.origin}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-1">Use this URL to receive data from external services.</p>
            </div>
          </div>
        );

      case 'ask_question':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={config.message || ''}
                onChange={(e) => handleUpdate('message', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="What is your question?"
              />
              <p className="text-xs text-gray-500 mt-1">Only 1024/1024 characters are allowed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Response Format</label>
              <select
                value={config.responseFormat || 'Any Response'}
                onChange={(e) => handleUpdate('responseFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>Any Response</option>
                <option>Text Only</option>
                <option>Number Only</option>
                <option>Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeout Value</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.timeoutValue || 60}
                  onChange={(e) => handleUpdate('timeoutValue', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <select
                  value={config.timeoutUnit || 'Seconds'}
                  onChange={(e) => handleUpdate('timeoutUnit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option>Seconds</option>
                  <option>Minutes</option>
                  <option>Hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeout Message</label>
              <textarea
                value={config.timeoutMessage || ''}
                onChange={(e) => handleUpdate('timeoutMessage', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Message shown when the timeout is reached"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.continueOnTimeout || false}
                  onChange={(e) => handleUpdate('continueOnTimeout', e.target.checked)}
                  className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Continue on Timeout</span>
              </label>
            </div>
          </div>
        );

      case 'ai_agent':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stop Agent Keywords</label>
              <input
                type="text"
                value={config.stopKeywords || '/stop'}
                onChange={(e) => handleUpdate('stopKeywords', e.target.value)}
                placeholder="/stop"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assistant</label>
              <select
                value={config.assistant || ''}
                onChange={(e) => handleUpdate('assistant', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Select an assistant</option>
                <option>GPT-4</option>
                <option>GPT-3.5</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeout Value</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.timeoutValue || 5}
                  onChange={(e) => handleUpdate('timeoutValue', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <select
                  value={config.timeoutUnit || 'Minutes'}
                  onChange={(e) => handleUpdate('timeoutUnit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option>Seconds</option>
                  <option>Minutes</option>
                  <option>Hours</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
              <textarea
                value={config.welcomeMessage || ''}
                onChange={(e) => handleUpdate('welcomeMessage', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeout Message (Optional)</label>
              <textarea
                value={config.timeoutMessage || ''}
                onChange={(e) => handleUpdate('timeoutMessage', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Message shown when the timeout is reached"
              />
            </div>
          </div>
        );

      case 'http':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HTTP Method</label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => handleUpdate('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleUpdate('url', e.target.value)}
                placeholder="https://api.example.com/endpoint"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Headers</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Header key"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Header value"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <button className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
                  <Plus className="w-4 h-4" />
                  Add Header
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={config.body || ''}
                onChange={(e) => handleUpdate('body', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delay Type</label>
              <select
                value={config.delayType || 'Delay for'}
                onChange={(e) => handleUpdate('delayType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>Delay for</option>
                <option>Delay until</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Choose how you want to configure the delay</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={config.delayValue || 1}
                  onChange={(e) => handleUpdate('delayValue', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter delay duration"
                />
                <select
                  value={config.delayUnit || 'Minutes'}
                  onChange={(e) => handleUpdate('delayUnit', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option>Seconds</option>
                  <option>Minutes</option>
                  <option>Hours</option>
                  <option>Days</option>
                </select>
              </div>
              <p className="text-xs text-gray-500 mt-1">Select time unit</p>
            </div>
          </div>
        );

      case 'send_cta':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Header Type</label>
              <select
                value={config.headerType || 'None'}
                onChange={(e) => handleUpdate('headerType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>None</option>
                <option>Text</option>
                <option>Image</option>
                <option>Video</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
              <textarea
                value={config.bodyText || ''}
                onChange={(e) => handleUpdate('bodyText', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">1024 characters left</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Text</label>
              <input
                type="text"
                value={config.displayText || ''}
                onChange={(e) => handleUpdate('displayText', e.target.value)}
                placeholder="Enter display text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">20 characters left</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleUpdate('url', e.target.value)}
                placeholder="Enter URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
              <input
                type="text"
                value={config.footerText || ''}
                onChange={(e) => handleUpdate('footerText', e.target.value)}
                placeholder="Enter footer text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">60 characters left</p>
            </div>
          </div>
        );

      case 'send_product':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catalog ID</label>
              <input
                type="text"
                value={config.catalogId || ''}
                onChange={(e) => handleUpdate('catalogId', e.target.value)}
                placeholder="Enter catalog ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Retailer ID</label>
              <input
                type="text"
                value={config.productRetailerId || ''}
                onChange={(e) => handleUpdate('productRetailerId', e.target.value)}
                placeholder="Enter product retailer ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Text</label>
              <textarea
                value={config.bodyText || ''}
                onChange={(e) => handleUpdate('bodyText', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">1024 characters left</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
              <input
                type="text"
                value={config.footerText || ''}
                onChange={(e) => handleUpdate('footerText', e.target.value)}
                placeholder="Enter footer text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">60 characters left</p>
            </div>
          </div>
        );

      case 'google_sheets':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Spreadsheet URL</label>
              <input
                type="text"
                value={config.spreadsheetUrl || ''}
                onChange={(e) => handleUpdate('spreadsheetUrl', e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Name</label>
              <input
                type="text"
                value={config.sheetName || 'Sheet1'}
                onChange={(e) => handleUpdate('sheetName', e.target.value)}
                placeholder="Sheet1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={config.action || 'Add Row'}
                onChange={(e) => handleUpdate('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>Add Row</option>
                <option>Update Row</option>
                <option>Get Row</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data (JSON)</label>
              <textarea
                value={config.data || ''}
                onChange={(e) => handleUpdate('data', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-mono text-sm"
                placeholder='{"Name": "{{user_name}}", "Email": "{{user_email}}"}'
              />
            </div>
          </div>
        );

      case 'update_columns':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Column Updates</label>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <p className="text-sm text-gray-600">No column updates configured</p>
                <p className="text-xs text-gray-500 mt-1">Click "Add Column" to start updating columns</p>
              </div>
            </div>

            <button className="flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 font-medium">
              <Plus className="w-4 h-4" />
              Add Column
            </button>
          </div>
        );

      case 'stop_chatbot':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-900">Stopping the session will reset the chatbot to its initial state.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Final Message (Optional)</label>
              <textarea
                value={config.finalMessage || ''}
                onChange={(e) => handleUpdate('finalMessage', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Thank you for using our service!"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-gray-600">
            Configuration for {node.type} coming soon...
          </div>
        );
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {node.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {renderField()}
      </div>
    </div>
  );
}
