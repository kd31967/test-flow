export interface FlowVariable {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  key: string;
  value: any;
  timestamp: number;
}

export interface SystemVariable {
  key: string;
  description: string;
  example: string;
  getValue: () => string;
}

export class SystemVariables {
  private timezone = 'Asia/Kolkata';

  getCurrentDate(): string {
    const date = new Date();
    return date.toLocaleDateString('en-CA', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  getCurrentTime(): string {
    const date = new Date();
    return date.toLocaleTimeString('en-GB', {
      timeZone: this.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  getCurrentDateTime(): string {
    return new Date().toISOString();
  }

  getServerBaseUrl(): string {
    return (
      import.meta.env.VITE_SERVER_BASE_URL ||
      import.meta.env.VITE_SUPABASE_URL ||
      window.location.origin
    );
  }

  getTimestamp(): string {
    return Date.now().toString();
  }

  getAll(): Record<string, string> {
    return {
      'system.current_date': this.getCurrentDate(),
      'system.current_time': this.getCurrentTime(),
      'system.current_date_time': this.getCurrentDateTime(),
      'system.server_base_url': this.getServerBaseUrl(),
      'system.timestamp': this.getTimestamp()
    };
  }

  getDefinitions(): SystemVariable[] {
    return [
      {
        key: 'system.current_date',
        description: 'Current date in YYYY-MM-DD format (IST timezone)',
        example: this.getCurrentDate(),
        getValue: () => this.getCurrentDate()
      },
      {
        key: 'system.current_time',
        description: 'Current time in HH:MM:SS format (IST timezone)',
        example: this.getCurrentTime(),
        getValue: () => this.getCurrentTime()
      },
      {
        key: 'system.current_date_time',
        description: 'Current date and time in ISO 8601 format',
        example: this.getCurrentDateTime(),
        getValue: () => this.getCurrentDateTime()
      },
      {
        key: 'system.server_base_url',
        description: 'Current server base URL',
        example: this.getServerBaseUrl(),
        getValue: () => this.getServerBaseUrl()
      },
      {
        key: 'system.timestamp',
        description: 'Current Unix timestamp in milliseconds',
        example: this.getTimestamp(),
        getValue: () => this.getTimestamp()
      }
    ];
  }
}

export class VariableResolver {
  private variables: Map<string, FlowVariable>;
  private systemVariables: SystemVariables;

  constructor() {
    this.variables = new Map();
    this.systemVariables = new SystemVariables();
  }

  addVariable(nodeId: string, nodeName: string, nodeType: string, key: string, value: any): void {
    const variableKey = `${nodeName}.${nodeId}.${key}`;
    this.variables.set(variableKey, {
      nodeId,
      nodeName,
      nodeType,
      key,
      value,
      timestamp: Date.now()
    });
  }

  getVariable(reference: string): any {
    const cleaned = reference.replace(/\{\{|\}\}/g, '').trim();

    // Check system variables first
    const systemVars = this.systemVariables.getAll();
    if (systemVars[cleaned]) {
      return systemVars[cleaned];
    }

    // Check flow variables
    const variable = this.variables.get(cleaned);
    return variable ? variable.value : undefined;
  }

  getAllVariables(): FlowVariable[] {
    return Array.from(this.variables.values());
  }

  getVariableReferences(): string[] {
    const refs: string[] = [];

    // Add system variables
    this.systemVariables.getDefinitions().forEach(sv => {
      refs.push(`{{${sv.key}}}`);
    });

    // Add flow variables
    this.variables.forEach((variable, key) => {
      refs.push(`{{${key}}}`);
    });

    return refs;
  }

  resolveVariables(text: string): string {
    if (!text || typeof text !== 'string') return text;

    let resolved = text;

    // Resolve system variables first
    const systemVars = this.systemVariables.getAll();
    Object.entries(systemVars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      resolved = resolved.replace(regex, value);
    });

    // Resolve flow variables
    this.variables.forEach((variable, key) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      const value = typeof variable.value === 'object'
        ? JSON.stringify(variable.value)
        : String(variable.value);
      resolved = resolved.replace(regex, value);
    });

    return resolved;
  }

  extractVariableReferences(text: string): string[] {
    if (!text || typeof text !== 'string') return [];

    const regex = /\{\{([^}]+)\}\}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }

    return matches;
  }

  validateVariableReference(reference: string): { valid: boolean; message?: string } {
    const cleaned = reference.replace(/\{\{|\}\}/g, '').trim();

    // Check system variables
    const systemVars = this.systemVariables.getAll();
    if (systemVars[cleaned]) {
      return { valid: true };
    }

    // Check flow variables
    if (this.variables.has(cleaned)) {
      return { valid: true };
    }

    return {
      valid: false,
      message: `Variable '${cleaned}' not found. Make sure the node has executed and captured a response.`
    };
  }

  clear(): void {
    this.variables.clear();
  }

  addWebhookVariables(nodeId: string, nodeName: string, requestData: {
    body?: any;
    query?: any;
    headers?: any;
  }): void {
    // Add body variables dynamically
    if (requestData.body && typeof requestData.body === 'object') {
      this.extractNestedVariables(requestData.body, `webhook.body`, nodeId, nodeName, 'webhook');
    }

    // Add query variables dynamically
    if (requestData.query && typeof requestData.query === 'object') {
      this.extractNestedVariables(requestData.query, `webhook.query`, nodeId, nodeName, 'webhook');
    }

    // Add header variables dynamically
    if (requestData.headers && typeof requestData.headers === 'object') {
      this.extractNestedVariables(requestData.headers, `webhook.header`, nodeId, nodeName, 'webhook');
    }
  }

  addHttpResponseVariables(nodeId: string, nodeName: string, responseData: {
    body?: any;
    status?: number;
    statusText?: string;
    headers?: any;
  }): void {
    // Add status
    if (responseData.status !== undefined) {
      this.variables.set('http.response.status', {
        nodeId,
        nodeName,
        nodeType: 'http',
        key: 'http.response.status',
        value: responseData.status,
        timestamp: Date.now()
      });
    }

    // Add status text
    if (responseData.statusText) {
      this.variables.set('http.response.statusText', {
        nodeId,
        nodeName,
        nodeType: 'http',
        key: 'http.response.statusText',
        value: responseData.statusText,
        timestamp: Date.now()
      });
    }

    // Add body variables dynamically
    if (responseData.body && typeof responseData.body === 'object') {
      this.extractNestedVariables(responseData.body, `http.response.body`, nodeId, nodeName, 'http');
    }

    // Add header variables dynamically
    if (responseData.headers && typeof responseData.headers === 'object') {
      this.extractNestedVariables(responseData.headers, `http.response.header`, nodeId, nodeName, 'http');
    }
  }

  private extractNestedVariables(
    obj: any,
    prefix: string,
    nodeId: string,
    nodeName: string,
    nodeType: string,
    maxDepth: number = 5,
    currentDepth: number = 0
  ): void {
    if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const variableKey = `${prefix}.${key}`;

      // Store the variable
      this.variables.set(variableKey, {
        nodeId,
        nodeName,
        nodeType,
        key: variableKey,
        value,
        timestamp: Date.now()
      });

      // If value is an object or array, recursively extract nested variables
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.extractNestedVariables(value, variableKey, nodeId, nodeName, nodeType, maxDepth, currentDepth + 1);
      }
    }
  }
}

export function generateUniqueId(prefix: string = 'node'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${random}`;
}

export function generateFlowId(): string {
  return generateUniqueId('flow');
}

export function generateNodeId(): string {
  return generateUniqueId('node');
}

export function generateWebhookId(): string {
  return generateUniqueId('webhook');
}

export function generateButtonId(): string {
  return generateUniqueId('btn');
}
