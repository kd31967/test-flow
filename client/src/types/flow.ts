export interface NodeDefinition {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, any>;
  };
  next?: string;
}

export interface MediaButton {
  id: string;
  title: string;
  nextNodeId?: string;
}

export interface MediaButtonConfig {
  headerType: 'text' | 'image' | 'video' | 'document' | 'audio';
  headerText?: string;
  headerMediaUrl?: string;
  bodyText: string;
  footerText?: string;
  buttons: MediaButton[];
  buttonBranches: Record<string, string>;
}

export interface Connection {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface NodeTypeConfig {
  type: string;
  label: string;
  icon: string;
  category: 'communication' | 'data' | 'logic';
  description: string;
  defaultConfig: Record<string, any>;
  configFields: ConfigField[];
}

export interface ConfigField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'boolean' | 'json' | 'array';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

export const NODE_TYPES: NodeTypeConfig[] = [
  {
    type: 'message',
    label: 'Text Message',
    icon: 'MessageSquare',
    category: 'communication',
    description: 'Send a text message with variable interpolation',
    defaultConfig: {
      content: '',
      variables: [],
      next: ''
    },
    configFields: [
      { name: 'content', label: 'Message Content', type: 'textarea', required: true, placeholder: 'Hello {{name}}! Welcome to our service.' },
      { name: 'next', label: 'Next Node ID', type: 'text', placeholder: 'node_2' }
    ]
  },
  {
    type: 'button_message',
    label: 'Button Message',
    icon: 'Square',
    category: 'communication',
    description: 'Interactive buttons with custom routing',
    defaultConfig: {
      content: '',
      buttons: [],
      next_map: {}
    },
    configFields: [
      { name: 'content', label: 'Message Content', type: 'textarea', required: true },
      { name: 'buttons', label: 'Buttons (JSON Array)', type: 'json', required: true, placeholder: '[{"id": "btn1", "text": "Option 1"}]' }
    ]
  },
  {
    type: 'send_button',
    label: 'Send Button',
    icon: 'Send',
    category: 'communication',
    description: 'Send media with interactive buttons (up to 4) - supports branching flows',
    defaultConfig: {
      headerType: 'text',
      headerText: '',
      headerMediaUrl: '',
      bodyText: '',
      footerText: '',
      buttons: [],
      buttonBranches: {}
    },
    configFields: []
  },
  {
    type: 'list_message',
    label: 'List Menu',
    icon: 'List',
    category: 'communication',
    description: 'Structured menu with sections',
    defaultConfig: {
      content: '',
      button_text: 'View Options',
      sections: [],
      next_map: {}
    },
    configFields: [
      { name: 'content', label: 'Message Content', type: 'textarea', required: true },
      { name: 'button_text', label: 'Button Text', type: 'text', required: true },
      { name: 'sections', label: 'Sections (JSON)', type: 'json', required: true, placeholder: '[{"title": "Services", "rows": [{"id": "s1", "title": "Service 1"}]}]' }
    ]
  },
  {
    type: 'template',
    label: 'Template Message',
    icon: 'FileText',
    category: 'communication',
    description: 'WhatsApp approved message template',
    defaultConfig: {
      template_name: '',
      language: 'en',
      parameters: [],
      next: ''
    },
    configFields: [
      { name: 'template_name', label: 'Template Name', type: 'text', required: true },
      { name: 'language', label: 'Language Code', type: 'text', defaultValue: 'en' },
      { name: 'parameters', label: 'Parameters (JSON Array)', type: 'json', placeholder: '["value1", "value2"]' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'cta_url',
    label: 'CTA Button',
    icon: 'ExternalLink',
    category: 'communication',
    description: 'Click-to-action button with URL',
    defaultConfig: {
      content: '',
      button_text: '',
      url: '',
      next: ''
    },
    configFields: [
      { name: 'content', label: 'Message Content', type: 'textarea', required: true },
      { name: 'button_text', label: 'Button Text', type: 'text', required: true },
      { name: 'url', label: 'URL', type: 'text', required: true, placeholder: 'https://example.com' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'form',
    label: 'Form',
    icon: 'ClipboardList',
    category: 'data',
    description: 'Multi-step form with validation',
    defaultConfig: {
      fields: [],
      save_as: '',
      next: ''
    },
    configFields: [
      { name: 'fields', label: 'Form Fields (JSON)', type: 'json', required: true, placeholder: '[{"name": "email", "label": "Email", "type": "text", "required": true}]' },
      { name: 'save_as', label: 'Save Data As Variable', type: 'text' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'capture_response',
    label: 'Capture Response',
    icon: 'Download',
    category: 'data',
    description: 'Collect user input (text, media, location)',
    defaultConfig: {
      prompt: '',
      response_type: 'text',
      validation: {},
      save_as: '',
      next: ''
    },
    configFields: [
      { name: 'prompt', label: 'Prompt Message', type: 'textarea', required: true },
      { name: 'response_type', label: 'Response Type', type: 'select', required: true, options: [
        { value: 'text', label: 'Text' },
        { value: 'media', label: 'Media' },
        { value: 'location', label: 'Location' },
        { value: 'voice', label: 'Voice' }
      ]},
      { name: 'save_as', label: 'Save Response As', type: 'text', required: true, placeholder: 'user_response' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: 'Webhook',
    category: 'data',
    description: 'External system integration',
    defaultConfig: {
      url: '',
      method: 'POST',
      headers: {},
      body: {},
      save_as: '',
      next: ''
    },
    configFields: [
      { name: 'url', label: 'Webhook URL', type: 'text', required: true, placeholder: 'https://api.example.com/webhook' },
      { name: 'method', label: 'HTTP Method', type: 'select', options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' }
      ]},
      { name: 'headers', label: 'Headers (JSON)', type: 'json', placeholder: '{"Authorization": "Bearer token"}' },
      { name: 'body', label: 'Body (JSON)', type: 'json', placeholder: '{"data": "{{variable}}"}' },
      { name: 'save_as', label: 'Save Response As', type: 'text' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'conditional',
    label: 'Conditional Branch',
    icon: 'GitBranch',
    category: 'logic',
    description: 'Branch based on conditions',
    defaultConfig: {
      conditions: [],
      default_next: ''
    },
    configFields: [
      { name: 'conditions', label: 'Conditions (JSON)', type: 'json', required: true, placeholder: '[{"variable": "age", "operator": ">=", "value": 18, "next": "adult_path"}]' },
      { name: 'default_next', label: 'Default Next Node', type: 'text' }
    ]
  },
  {
    type: 'api',
    label: 'API Call',
    icon: 'Code',
    category: 'logic',
    description: 'HTTP API integration',
    defaultConfig: {
      url: '',
      method: 'GET',
      headers: {},
      body: {},
      auth_type: 'none',
      save_as: '',
      next: ''
    },
    configFields: [
      { name: 'url', label: 'API URL', type: 'text', required: true },
      { name: 'method', label: 'HTTP Method', type: 'select', options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'PATCH', label: 'PATCH' },
        { value: 'DELETE', label: 'DELETE' }
      ]},
      { name: 'auth_type', label: 'Authentication', type: 'select', options: [
        { value: 'none', label: 'None' },
        { value: 'bearer', label: 'Bearer Token' },
        { value: 'basic', label: 'Basic Auth' },
        { value: 'api_key', label: 'API Key' }
      ]},
      { name: 'save_as', label: 'Save Response As', type: 'text' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'ai_completion',
    label: 'AI Completion',
    icon: 'Brain',
    category: 'logic',
    description: 'Generate AI responses using GPT or Claude',
    defaultConfig: {
      provider: 'openai',
      model: 'gpt-4',
      prompt: '',
      system_prompt: '',
      temperature: 0.7,
      max_tokens: 1000,
      save_as: 'ai_response',
      next: ''
    },
    configFields: [
      { name: 'provider', label: 'AI Provider', type: 'select', required: true, options: [
        { value: 'openai', label: 'OpenAI (GPT)' },
        { value: 'anthropic', label: 'Anthropic (Claude)' }
      ]},
      { name: 'model', label: 'Model', type: 'select', required: true, options: [
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
        { value: 'claude-3-opus', label: 'Claude 3 Opus' },
        { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }
      ]},
      { name: 'system_prompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant...' },
      { name: 'prompt', label: 'User Prompt', type: 'textarea', required: true, placeholder: 'Generate a response for: {{webhook.body.query}}' },
      { name: 'temperature', label: 'Temperature', type: 'number', defaultValue: 0.7, placeholder: '0.0 - 1.0' },
      { name: 'max_tokens', label: 'Max Tokens', type: 'number', defaultValue: 1000 },
      { name: 'save_as', label: 'Save Response As', type: 'text', defaultValue: 'ai_response', placeholder: 'ai_response' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'database_query',
    label: 'Database Query',
    icon: 'Database',
    category: 'data',
    description: 'Execute SQL queries on Supabase database',
    defaultConfig: {
      operation: 'select',
      table: '',
      query: '',
      filters: {},
      save_as: 'db_result',
      next: ''
    },
    configFields: [
      { name: 'operation', label: 'Operation', type: 'select', required: true, options: [
        { value: 'select', label: 'SELECT (Read)' },
        { value: 'insert', label: 'INSERT (Create)' },
        { value: 'update', label: 'UPDATE (Modify)' },
        { value: 'delete', label: 'DELETE (Remove)' }
      ]},
      { name: 'table', label: 'Table Name', type: 'text', required: true, placeholder: 'users' },
      { name: 'query', label: 'Custom SQL Query', type: 'textarea', placeholder: 'SELECT * FROM users WHERE email = {{webhook.body.email}}' },
      { name: 'filters', label: 'Filters (JSON)', type: 'json', placeholder: '{"status": "active", "age": {"$gte": 18}}' },
      { name: 'save_as', label: 'Save Result As', type: 'text', defaultValue: 'db_result', placeholder: 'db_result' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'email',
    label: 'Send Email',
    icon: 'Mail',
    category: 'communication',
    description: 'Send emails via SMTP or email service',
    defaultConfig: {
      to: '',
      subject: '',
      body: '',
      html: true,
      from_name: '',
      attachments: [],
      next: ''
    },
    configFields: [
      { name: 'to', label: 'To Email', type: 'text', required: true, placeholder: '{{webhook.body.email}}' },
      { name: 'from_name', label: 'From Name', type: 'text', placeholder: 'Your Company' },
      { name: 'subject', label: 'Email Subject', type: 'text', required: true, placeholder: 'Welcome {{user.name}}!' },
      { name: 'body', label: 'Email Body', type: 'textarea', required: true, placeholder: 'HTML or plain text content...' },
      { name: 'html', label: 'Send as HTML', type: 'boolean', defaultValue: true },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'transform',
    label: 'Transform Data',
    icon: 'RefreshCw',
    category: 'logic',
    description: 'Transform and manipulate data with JavaScript',
    defaultConfig: {
      input_variables: [],
      transform_code: '',
      save_as: 'transformed_data',
      next: ''
    },
    configFields: [
      { name: 'input_variables', label: 'Input Variables (JSON Array)', type: 'json', placeholder: '["webhook.body.data", "api.response"]' },
      { name: 'transform_code', label: 'Transform Code (JavaScript)', type: 'textarea', required: true, placeholder: 'return { fullName: data.firstName + " " + data.lastName }' },
      { name: 'save_as', label: 'Save Result As', type: 'text', defaultValue: 'transformed_data' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: 'Clock',
    category: 'logic',
    description: 'Wait before continuing',
    defaultConfig: {
      duration: 0,
      unit: 'seconds',
      next: ''
    },
    configFields: [
      { name: 'duration', label: 'Duration', type: 'number', required: true, defaultValue: 5 },
      { name: 'unit', label: 'Time Unit', type: 'select', options: [
        { value: 'seconds', label: 'Seconds' },
        { value: 'minutes', label: 'Minutes' },
        { value: 'hours', label: 'Hours' },
        { value: 'days', label: 'Days' }
      ]},
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'end',
    label: 'End Flow',
    icon: 'StopCircle',
    category: 'logic',
    description: 'Terminate flow execution',
    defaultConfig: {
      message: 'Thank you!',
      track_completion: true
    },
    configFields: [
      { name: 'message', label: 'Final Message', type: 'textarea', placeholder: 'Thank you for using our service!' },
      { name: 'track_completion', label: 'Track Completion', type: 'boolean', defaultValue: true }
    ]
  },
  {
    type: 'button_1_branch',
    label: 'Button 1 Branch',
    icon: 'MessageSquare',
    category: 'communication',
    description: 'Button 1 branch node - Draggable and connectable',
    defaultConfig: {
      content: '',
      buttonNumber: 1,
      isDraggable: true,
      next: ''
    },
    configFields: [
      { name: 'content', label: 'Message Content', type: 'textarea', required: true, placeholder: 'Enter response message...' },
      { name: 'next', label: 'Next Node ID', type: 'text', placeholder: 'node_2' }
    ]
  },
  {
    type: 'button_2_branch',
    label: 'Button 2 Branch',
    icon: 'MessageSquare',
    category: 'communication',
    description: 'Button 2 branch node - Static node',
    defaultConfig: {
      content: '',
      buttonNumber: 2,
      isDraggable: false,
      next: ''
    },
    configFields: [
      { name: 'content', label: 'Message Content', type: 'textarea', required: true, placeholder: 'Enter response message...' },
      { name: 'next', label: 'Next Node ID', type: 'text', placeholder: 'node_2' }
    ]
  },
  {
    type: 'button_3_branch',
    label: 'Button 3 Branch',
    icon: 'MessageSquare',
    category: 'communication',
    description: 'Button 3 branch node - Static node',
    defaultConfig: {
      content: '',
      buttonNumber: 3,
      isDraggable: false,
      next: ''
    },
    configFields: [
      { name: 'content', label: 'Message Content', type: 'textarea', required: true, placeholder: 'Enter response message...' },
      { name: 'next', label: 'Next Node ID', type: 'text', placeholder: 'node_2' }
    ]
  },
  {
    type: 'button_4_branch',
    label: 'Button 4 Branch',
    icon: 'MessageSquare',
    category: 'communication',
    description: 'Button 4 branch node - Static node',
    defaultConfig: {
      content: '',
      buttonNumber: 4,
      isDraggable: false,
      next: ''
    },
    configFields: [
      { name: 'content', label: 'Message Content', type: 'textarea', required: true, placeholder: 'Enter response message...' },
      { name: 'next', label: 'Next Node ID', type: 'text', placeholder: 'node_2' }
    ]
  },
  {
    type: 'loop',
    label: 'Loop/Iteration',
    icon: 'Repeat',
    category: 'logic',
    description: 'Iterate over array or repeat actions',
    defaultConfig: {
      array_variable: '',
      item_name: 'item',
      max_iterations: 100,
      loop_body: '',
      next: ''
    },
    configFields: [
      { name: 'array_variable', label: 'Array Variable', type: 'text', required: true, placeholder: '{{api.response.items}}' },
      { name: 'item_name', label: 'Current Item Variable Name', type: 'text', defaultValue: 'item', placeholder: 'item' },
      { name: 'max_iterations', label: 'Max Iterations', type: 'number', defaultValue: 100 },
      { name: 'loop_body', label: 'Loop Body Node ID', type: 'text', placeholder: 'First node in loop' },
      { name: 'next', label: 'Next Node After Loop', type: 'text' }
    ]
  },
  {
    type: 'merge',
    label: 'Merge Paths',
    icon: 'Combine',
    category: 'logic',
    description: 'Wait for multiple paths and merge data',
    defaultConfig: {
      wait_strategy: 'all',
      paths: [],
      merge_strategy: 'combine',
      next: ''
    },
    configFields: [
      { name: 'wait_strategy', label: 'Wait Strategy', type: 'select', options: [
        { value: 'all', label: 'Wait for All Paths' },
        { value: 'any', label: 'Wait for Any Path' },
        { value: 'first', label: 'First Path Only' }
      ]},
      { name: 'merge_strategy', label: 'Merge Strategy', type: 'select', options: [
        { value: 'combine', label: 'Combine All Data' },
        { value: 'first', label: 'Use First Path Data' },
        { value: 'last', label: 'Use Last Path Data' }
      ]},
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  },
  {
    type: 'error_handler',
    label: 'Error Handler',
    icon: 'AlertTriangle',
    category: 'logic',
    description: 'Catch and handle errors gracefully',
    defaultConfig: {
      try_node: '',
      catch_node: '',
      finally_node: '',
      save_error_as: 'error',
      next: ''
    },
    configFields: [
      { name: 'try_node', label: 'Try Node ID', type: 'text', required: true, placeholder: 'Node to try executing' },
      { name: 'catch_node', label: 'Catch Node ID', type: 'text', placeholder: 'Node to run on error' },
      { name: 'finally_node', label: 'Finally Node ID', type: 'text', placeholder: 'Node to always run' },
      { name: 'save_error_as', label: 'Error Variable Name', type: 'text', defaultValue: 'error' },
      { name: 'next', label: 'Next Node ID', type: 'text' }
    ]
  }
];
