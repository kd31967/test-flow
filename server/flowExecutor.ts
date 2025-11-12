import type { IStorage } from './storage.js';

interface ExecutionContext {
  flowId: string;
  executionId?: string;
  variables: Record<string, any>;
  userPhone?: string;
  storage: IStorage;
}

interface PausedExecution {
  flowId: string;
  currentNodeId: string;
  variables: Record<string, any>;
  userPhone: string;
  executionId?: string;
  pausedAt: Date;
  waitingFor: 'button' | 'list' | 'flow' | 'location' | 'message' | 'delay';
}

// In-memory storage for paused executions
const pausedExecutions: Map<string, PausedExecution> = new Map();

interface FlowNode {
  id: string;
  type: string;
  config: any;
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

function replaceVariables(text: string, variables: Record<string, any>): string {
  if (!text) return text;
  
  return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    const trimmed = varName.trim();
    
    if (trimmed.startsWith('system.')) {
      const systemVar = trimmed.substring(7);
      if (systemVar === 'current_date') {
        return new Date().toISOString().split('T')[0];
      } else if (systemVar === 'current_time') {
        return new Date().toLocaleTimeString();
      } else if (systemVar === 'current_datetime') {
        return new Date().toISOString();
      }
      return match;
    }
    
    return variables[trimmed] !== undefined ? String(variables[trimmed]) : match;
  });
}

// Helper: Pause execution for user interaction
function pauseExecution(
  userPhone: string,
  flowId: string,
  currentNodeId: string,
  variables: Record<string, any>,
  waitingFor: PausedExecution['waitingFor'],
  executionId?: string
): void {
  const key = `${userPhone}_${flowId}`;
  pausedExecutions.set(key, {
    flowId,
    currentNodeId,
    variables,
    userPhone,
    executionId,
    pausedAt: new Date(),
    waitingFor
  });
  console.log(`⏸️  Execution paused for ${userPhone}, waiting for: ${waitingFor}`);
}

// Helper: Get paused execution by user phone
export function getPausedExecution(userPhone: string): PausedExecution | null {
  // Check all paused executions for this user
  for (const [, paused] of pausedExecutions.entries()) {
    if (paused.userPhone === userPhone) {
      return paused;
    }
  }
  return null;
}

// Helper: Resume execution with user response
export async function resumeExecution(
  userPhone: string,
  flowId: string,
  userResponse: Record<string, any>,
  storage: IStorage
): Promise<void> {
  const key = `${userPhone}_${flowId}`;
  const paused = pausedExecutions.get(key);
  
  if (!paused) {
    console.log(`⚠️  No paused execution found for ${userPhone} in flow ${flowId}`);
    return;
  }
  
  console.log(`▶️  Resuming execution for ${userPhone}, was waiting for: ${paused.waitingFor}`);
  
  // Merge user response into variables
  const updatedVariables = {
    ...paused.variables,
    ...userResponse
  };
  
  // Remove from paused state
  pausedExecutions.delete(key);
  
  // Find the next node to execute
  const flow = await storage.getFlow(flowId, 'demo-user');
  if (!flow) {
    console.error('Flow not found:', flowId);
    return;
  }
  
  let flowConfig = flow.config;
  if (typeof flowConfig === 'string') {
    try {
      flowConfig = JSON.parse(flowConfig);
    } catch {
      console.error('Invalid flow config');
      return;
    }
  }
  
  if (!flowConfig || typeof flowConfig !== 'object') {
    console.error('Invalid flow config after parsing');
    return;
  }
  
  const edges: FlowEdge[] = (flowConfig as any).edges || [];
  const nextEdge = edges.find((e: FlowEdge) => e.source === paused.currentNodeId);
  
  if (nextEdge) {
    // Continue from the next node
    await executeFlow(
      {
        flowId,
        executionId: paused.executionId,
        variables: updatedVariables,
        userPhone,
        storage
      },
      nextEdge.target
    );
  } else {
    console.log('🏁 No next node found - flow complete');
  }
}

async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const url = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp API error:', data);
      return false;
    }

    console.log('✅ WhatsApp message sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

async function sendWhatsAppMedia(
  phoneNumber: string,
  mediaType: string,
  mediaUrl: string,
  caption: string | undefined,
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const url = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    const mediaTypes: Record<string, string> = {
      'Image': 'image',
      'Video': 'video',
      'Audio': 'audio',
      'Document': 'document'
    };
    
    const type = mediaTypes[mediaType] || 'image';
    
    const payload: any = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type,
      [type]: {
        link: mediaUrl
      }
    };
    
    if (caption && (type === 'image' || type === 'video' || type === 'document')) {
      payload[type].caption = caption;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp media error:', data);
      return false;
    }

    console.log('✅ WhatsApp media sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp media:', error);
    return false;
  }
}

async function sendWhatsAppButton(
  phoneNumber: string,
  bodyText: string,
  buttons: any[],
  headerText: string | undefined,
  footerText: string | undefined,
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const url = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    const interactive: any = {
      type: 'button',
      body: {
        text: bodyText
      },
      action: {
        buttons: buttons.slice(0, 3).map((btn, idx) => ({
          type: 'reply',
          reply: {
            id: btn.id || `btn_${idx}`,
            title: btn.text || btn.title || `Button ${idx + 1}`
          }
        }))
      }
    };
    
    if (headerText) {
      interactive.header = {
        type: 'text',
        text: headerText
      };
    }
    
    if (footerText) {
      interactive.footer = {
        text: footerText
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp button error:', data);
      return false;
    }

    console.log('✅ WhatsApp button sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp button:', error);
    return false;
  }
}

async function sendWhatsAppList(
  phoneNumber: string,
  bodyText: string,
  buttonText: string,
  sections: any[],
  headerText: string | undefined,
  footerText: string | undefined,
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const url = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    const interactive: any = {
      type: 'list',
      body: {
        text: bodyText
      },
      action: {
        button: buttonText || 'View Options',
        sections: sections.map(section => ({
          title: section.title || 'Options',
          rows: (section.rows || section.items || []).slice(0, 10).map((row: any, idx: number) => ({
            id: row.id || `row_${idx}`,
            title: row.title || row.text || `Option ${idx + 1}`,
            description: row.description || ''
          }))
        }))
      }
    };
    
    if (headerText) {
      interactive.header = {
        type: 'text',
        text: headerText
      };
    }
    
    if (footerText) {
      interactive.footer = {
        text: footerText
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp list error:', data);
      return false;
    }

    console.log('✅ WhatsApp list sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp list:', error);
    return false;
  }
}

async function sendWhatsAppCTA(
  phoneNumber: string,
  bodyText: string,
  displayText: string,
  url: string,
  headerText: string | undefined,
  footerText: string | undefined,
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const apiUrl = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    const interactive: any = {
      type: 'cta_url',
      body: {
        text: bodyText
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: displayText,
          url: url
        }
      }
    };
    
    if (headerText) {
      interactive.header = {
        type: 'text',
        text: headerText
      };
    }
    
    if (footerText) {
      interactive.footer = {
        text: footerText
      };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'interactive',
        interactive
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp CTA error:', data);
      return false;
    }

    console.log('✅ WhatsApp CTA sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp CTA:', error);
    return false;
  }
}

async function sendWhatsAppTemplate(
  phoneNumber: string,
  templateName: string,
  languageCode: string,
  components: any[],
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const url = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        }
      }
    };
    
    if (components && components.length > 0) {
      payload.template.components = components;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp template error:', data);
      return false;
    }

    console.log('✅ WhatsApp template sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp template:', error);
    return false;
  }
}

async function sendWhatsAppLocation(
  phoneNumber: string,
  latitude: string,
  longitude: string,
  name: string,
  address: string,
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const url = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    // Parse latitude and longitude to numbers (WhatsApp API requires numeric values)
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      console.error('Invalid latitude or longitude values:', { latitude, longitude });
      return false;
    }
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'location',
      location: {
        latitude: lat,
        longitude: lng,
        name,
        address
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp location error:', data);
      return false;
    }

    console.log('✅ WhatsApp location sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp location:', error);
    return false;
  }
}

async function requestWhatsAppLocation(
  phoneNumber: string,
  bodyText: string,
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const url = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'location_request_message',
        body: {
          text: bodyText
        },
        action: {
          name: 'send_location'
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp location request error:', data);
      return false;
    }

    console.log('✅ WhatsApp location request sent:', data);
    return true;
  } catch (error) {
    console.error('Error requesting WhatsApp location:', error);
    return false;
  }
}

async function sendWhatsAppFlow(
  phoneNumber: string,
  header: string,
  body: string,
  footer: string,
  flowId: string,
  flowToken: string,
  flowCta: string,
  screen: string,
  flowData: any,
  storage: IStorage
): Promise<boolean> {
  try {
    const profile = await storage.getUserProfile('demo-user');
    
    if (!profile?.phoneNumberId || !profile?.whatsappAccessToken) {
      console.error('WhatsApp credentials not configured');
      return false;
    }

    const url = `https://graph.facebook.com/v17.0/${profile.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'flow',
        header: {
          type: 'text',
          text: header
        },
        body: {
          text: body
        },
        footer: footer ? {
          text: footer
        } : undefined,
        action: {
          name: 'flow',
          parameters: {
            flow_message_version: '3',
            flow_token: flowToken,
            flow_id: flowId,
            flow_cta: flowCta,
            flow_action: 'navigate',
            flow_action_payload: {
              screen: screen,
              data: flowData || {}
            }
          }
        }
      }
    };

    // Remove undefined footer if not provided
    if (!footer) {
      delete (payload.interactive as any).footer;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('WhatsApp flow error:', data);
      return false;
    }

    console.log('✅ WhatsApp flow sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp flow:', error);
    return false;
  }
}

async function executeHttpRequest(
  config: any,
  variables: Record<string, any>
): Promise<Record<string, any>> {
  try {
    const method = replaceVariables(config.method || 'GET', variables);
    const url = replaceVariables(config.url || '', variables);
    const headers: Record<string, string> = {};
    
    if (config.headers && Array.isArray(config.headers)) {
      config.headers.forEach((h: any) => {
        if (h.key && h.value) {
          headers[replaceVariables(h.key, variables)] = replaceVariables(h.value, variables);
        }
      });
    }
    
    let body = config.body ? replaceVariables(config.body, variables) : undefined;
    
    if (config.auth_type === 'bearer' && config.bearer_token) {
      headers['Authorization'] = `Bearer ${replaceVariables(config.bearer_token, variables)}`;
    } else if (config.auth_type === 'basic' && config.basic_username && config.basic_password) {
      const credentials = Buffer.from(
        `${replaceVariables(config.basic_username, variables)}:${replaceVariables(config.basic_password, variables)}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (config.auth_type === 'api_key' && config.api_key_header && config.api_key_value) {
      headers[replaceVariables(config.api_key_header, variables)] = replaceVariables(config.api_key_value, variables);
    }
    
    if (!headers['Content-Type'] && body) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchOptions: RequestInit = {
      method,
      headers
    };
    
    if (body && method !== 'GET' && method !== 'HEAD') {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    const responseVarName = config.response_variable || 'http.response';
    const newVariables: Record<string, any> = {
      [responseVarName]: responseData,
      [`${responseVarName}.status`]: response.status,
      [`${responseVarName}.statusText`]: response.statusText
    };
    
    if (typeof responseData === 'object' && responseData !== null) {
      Object.entries(responseData).forEach(([key, value]) => {
        newVariables[`${responseVarName}.${key}`] = value;
      });
    }

    console.log('✅ HTTP request executed:', { method, url, status: response.status });
    return newVariables;
  } catch (error: any) {
    console.error('Error executing HTTP request:', error);
    return {
      'http.error': error.message
    };
  }
}

async function executeGoogleSheets(
  config: any,
  variables: Record<string, any>
): Promise<boolean> {
  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = replaceVariables(config.spreadsheet_id || '', variables);
    const sheetName = replaceVariables(config.sheet_name || 'Sheet1', variables);
    const operation = config.operation || 'append';
    
    if (!spreadsheetId) {
      console.error('Google Sheets: Spreadsheet ID required');
      return false;
    }

    if (operation === 'append') {
      const values = config.values || [];
      const processedValues = values.map((row: any[]) => 
        row.map(cell => replaceVariables(String(cell || ''), variables))
      );

      if (!apiKey) {
        console.log('⚠️  Google Sheets API key not configured - skipping append');
        return true;
      }

      const range = `${sheetName}!A1`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: processedValues
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Google Sheets API error:', error);
        return false;
      }

      console.log('✅ Google Sheets: Data appended successfully');
      return true;
      
    } else if (operation === 'update') {
      const range = replaceVariables(config.range || `${sheetName}!A1`, variables);
      const values = config.values || [];
      const processedValues = values.map((row: any[]) => 
        row.map(cell => replaceVariables(String(cell || ''), variables))
      );

      if (!apiKey) {
        console.log('⚠️  Google Sheets API key not configured - skipping update');
        return true;
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW&key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: processedValues
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Google Sheets API error:', error);
        return false;
      }

      console.log('✅ Google Sheets: Data updated successfully');
      return true;
      
    } else {
      console.log('⚠️  Google Sheets: Unknown operation:', operation);
      return true;
    }
  } catch (error) {
    console.error('Error with Google Sheets:', error);
    return false;
  }
}

export async function executeFlow(
  context: ExecutionContext,
  startNodeId?: string
): Promise<void> {
  try {
    const flow = await context.storage.getFlow(context.flowId, 'demo-user');
    if (!flow) {
      console.error('Flow not found:', context.flowId);
      return;
    }

    let flowConfig = flow.config;
    console.log('📋 Flow config type:', typeof flowConfig, 'value:', flowConfig);
    
    if (typeof flowConfig === 'string') {
      try {
        flowConfig = JSON.parse(flowConfig);
        console.log('✅ Parsed string config to object');
      } catch (e) {
        console.error('Failed to parse flow config:', e);
        flowConfig = {};
      }
    }
    
    if (!flowConfig || typeof flowConfig !== 'object') {
      console.error('❌ Invalid flow config - not an object:', flowConfig);
      flowConfig = { nodes: [], edges: [] };
    }
    
    const nodes: FlowNode[] = Array.isArray((flowConfig as any)?.nodes) ? (flowConfig as any).nodes : [];
    const edges: FlowEdge[] = Array.isArray((flowConfig as any)?.edges) ? (flowConfig as any).edges : [];
    
    console.log('📊 Parsed nodes:', nodes.length, 'edges:', edges.length);
    
    let currentNodeId = startNodeId;
    
    if (!currentNodeId) {
      const startNode = nodes.find(n => n.type === 'on_message' || n.type === 'catch_webhook');
      if (startNode) {
        currentNodeId = startNode.id;
      } else {
        currentNodeId = nodes[0]?.id;
      }
    }
    
    if (!currentNodeId) {
      console.error('No starting node found');
      return;
    }

    console.log(`🚀 Starting flow execution: ${flow.name} from node ${currentNodeId}`);
    console.log('📦 Initial variables:', Object.keys(context.variables));

    let maxIterations = 50;
    let iterations = 0;

    while (currentNodeId && iterations < maxIterations) {
      iterations++;
      
      const currentNode = nodes.find(n => n.id === currentNodeId);
      if (!currentNode) {
        console.log('❌ Node not found:', currentNodeId);
        break;
      }

      console.log(`\n▶️  Executing node: ${currentNode.type} (${currentNode.id})`);

      const config = currentNode.config || {};
      let shouldContinue = true;

      // Response capture - store node output in variables
      const nodeResponse: Record<string, any> = {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        executed: true
      };

      switch (currentNode.type) {
        case 'send_message': {
          const answerText = replaceVariables(config.answer_text || config.answerText || config.text || '', context.variables);
          if (context.userPhone && answerText) {
            const sent = await sendWhatsAppMessage(context.userPhone, answerText, context.storage);
            nodeResponse.sent = sent;
            nodeResponse.message = answerText;
            console.log(sent ? '✅ Message sent' : '❌ Message failed');
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing phone or message text';
            console.log('⚠️ No message text or phone number to send');
          }
          break;
        }

        case 'send_media': {
          const mediaUrl = replaceVariables(config.mediaUrl || config.media_url || config.url || '', context.variables);
          const caption = replaceVariables(config.caption || '', context.variables);
          const mediaType = config.mediaType || config.media_type || config.answer_type || 'Image';
          
          if (context.userPhone && mediaUrl) {
            const sent = await sendWhatsAppMedia(
              context.userPhone,
              mediaType,
              mediaUrl,
              caption,
              context.storage
            );
            nodeResponse.sent = sent;
            nodeResponse.mediaUrl = mediaUrl;
            nodeResponse.mediaType = mediaType;
            nodeResponse.caption = caption;
            console.log(sent ? '✅ Media sent' : '❌ Media failed');
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing phone or media URL';
            console.log('⚠️ Missing required fields for send_media:', { hasPhone: !!context.userPhone, mediaUrl });
          }
          break;
        }

        case 'send_button': {
          const bodyText = replaceVariables(config.bodyText || config.body_text || config.text || '', context.variables);
          let headerText: string | undefined;
          
          // Handle header - backward compatible
          const headerType = config.headerType || config.header_type;
          const hasHeaderText = !!(config.headerText || config.header_text);
          
          // If headerType is explicitly 'text' OR if headerText exists without headerType (legacy flows)
          if (hasHeaderText && (!headerType || headerType === 'none' || headerType === 'text')) {
            headerText = replaceVariables(config.headerText || config.header_text || '', context.variables);
          }
          // For image/video headers, WhatsApp API needs different format - skip for now
          
          const footerText = (config.footerText || config.footer_text) 
            ? replaceVariables(config.footerText || config.footer_text, context.variables) 
            : undefined;
          const buttons = config.buttons || [];
          
          if (context.userPhone && bodyText && buttons.length > 0) {
            const sent = await sendWhatsAppButton(
              context.userPhone,
              bodyText,
              buttons,
              headerText,
              footerText,
              context.storage
            );
            nodeResponse.sent = sent;
            nodeResponse.bodyText = bodyText;
            nodeResponse.buttons = buttons;
            console.log(sent ? '✅ Button sent - waiting for user click' : '❌ Button failed');
            
            // Pause execution - wait for user to click button
            if (sent && context.userPhone) {
              pauseExecution(
                context.userPhone,
                context.flowId,
                currentNode.id,
                context.variables,
                'button',
                context.executionId
              );
              shouldContinue = false;
            }
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing required fields';
            console.log('⚠️ Missing required fields for send_button:', { hasPhone: !!context.userPhone, bodyText, buttonCount: buttons.length });
          }
          break;
        }

        case 'send_list': {
          const bodyText = replaceVariables(config.bodyText || config.body_text || config.text || '', context.variables);
          const buttonText = replaceVariables(config.buttonText || config.button_text || 'View Options', context.variables);
          let headerText: string | undefined;
          
          // Handle header - backward compatible
          const headerType = config.headerType || config.header_type;
          const hasHeaderText = !!(config.headerText || config.header_text);
          
          // If headerType is explicitly 'text' OR if headerText exists without headerType (legacy flows)
          if (hasHeaderText && (!headerType || headerType === 'none' || headerType === 'text')) {
            headerText = replaceVariables(config.headerText || config.header_text || '', context.variables);
          }
          
          const footerText = (config.footerText || config.footer_text) 
            ? replaceVariables(config.footerText || config.footer_text, context.variables) 
            : undefined;
          const sections = config.sections || [];
          
          if (context.userPhone && bodyText && sections.length > 0) {
            const sent = await sendWhatsAppList(
              context.userPhone,
              bodyText,
              buttonText,
              sections,
              headerText,
              footerText,
              context.storage
            );
            nodeResponse.sent = sent;
            nodeResponse.bodyText = bodyText;
            nodeResponse.sections = sections;
            console.log(sent ? '✅ List sent - waiting for user selection' : '❌ List failed');
            
            // Pause execution - wait for user to select from list
            if (sent && context.userPhone) {
              pauseExecution(
                context.userPhone,
                context.flowId,
                currentNode.id,
                context.variables,
                'list',
                context.executionId
              );
              shouldContinue = false;
            }
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing required fields';
            console.log('⚠️ Missing required fields for send_list:', { hasPhone: !!context.userPhone, bodyText, sectionCount: sections.length });
          }
          break;
        }

        case 'send_cta':
        case 'cta_url': {
          const bodyText = replaceVariables(config.body || config.body_text || config.text || config.bodyText || '', context.variables);
          const displayText = replaceVariables(config.displayText || config.display_text || config.button_text || 'Visit', context.variables);
          const url = replaceVariables(config.url || '', context.variables);
          const headerText = config.headerText || config.header_text ? replaceVariables(config.headerText || config.header_text, context.variables) : undefined;
          const footerText = config.footerText || config.footer_text ? replaceVariables(config.footerText || config.footer_text, context.variables) : undefined;
          
          if (context.userPhone && bodyText && url) {
            const sent = await sendWhatsAppCTA(
              context.userPhone,
              bodyText,
              displayText,
              url,
              headerText,
              footerText,
              context.storage
            );
            nodeResponse.sent = sent;
            nodeResponse.bodyText = bodyText;
            nodeResponse.url = url;
            console.log(sent ? '✅ CTA sent' : '❌ CTA failed');
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing required fields';
            console.log('⚠️ Missing required fields for send_cta:', { hasPhone: !!context.userPhone, bodyText, url });
          }
          break;
        }
        
        case 'delay': {
          const delayAmount = parseInt(config.delay || config.duration || config.time || '5', 10);
          const delayUnit = config.unit || config.timeUnit || 'seconds';
          
          // Convert to milliseconds
          let delayMs = delayAmount * 1000; // default: seconds
          if (delayUnit === 'minutes') {
            delayMs = delayAmount * 60 * 1000;
          } else if (delayUnit === 'hours') {
            delayMs = delayAmount * 60 * 60 * 1000;
          }
          
          nodeResponse.delayed = true;
          nodeResponse.delayAmount = delayAmount;
          nodeResponse.delayUnit = delayUnit;
          console.log(`⏳ Delaying execution for ${delayAmount} ${delayUnit}...`);
          
          // Wait for the specified duration
          await new Promise(resolve => setTimeout(resolve, delayMs));
          console.log('✅ Delay complete');
          break;
        }

        case 'send_template': {
          const templateName = replaceVariables(config.templateName || config.template_name || '', context.variables);
          const languageCode = config.languageCode || config.language_code || 'en_US';
          const components = config.components || [];
          
          // Replace variables in components if needed
          const processedComponents = JSON.parse(JSON.stringify(components));
          
          if (context.userPhone && templateName) {
            const sent = await sendWhatsAppTemplate(
              context.userPhone,
              templateName,
              languageCode,
              processedComponents,
              context.storage
            );
            nodeResponse.sent = sent;
            nodeResponse.templateName = templateName;
            nodeResponse.language = languageCode;
            console.log(sent ? '✅ Template sent' : '❌ Template failed');
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing phone or template name';
            console.log('⚠️ Missing required fields for send_template:', { hasPhone: !!context.userPhone, templateName });
          }
          break;
        }

        case 'send_location': {
          const latitude = replaceVariables(config.latitude || '', context.variables);
          const longitude = replaceVariables(config.longitude || '', context.variables);
          const name = replaceVariables(config.name || config.locationName || '', context.variables);
          const address = replaceVariables(config.address || '', context.variables);
          
          if (context.userPhone && latitude && longitude) {
            const sent = await sendWhatsAppLocation(
              context.userPhone,
              latitude,
              longitude,
              name,
              address,
              context.storage
            );
            nodeResponse.sent = sent;
            nodeResponse.latitude = latitude;
            nodeResponse.longitude = longitude;
            nodeResponse.name = name;
            nodeResponse.address = address;
            console.log(sent ? '✅ Location sent' : '❌ Location failed');
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing phone, latitude, or longitude';
            console.log('⚠️ Missing required fields for send_location:', { hasPhone: !!context.userPhone, latitude, longitude });
          }
          break;
        }

        case 'request_location': {
          const bodyText = replaceVariables(config.bodyText || config.body_text || config.text || 'Please share your location', context.variables);
          
          if (context.userPhone && bodyText) {
            const sent = await requestWhatsAppLocation(
              context.userPhone,
              bodyText,
              context.storage
            );
            nodeResponse.sent = sent;
            nodeResponse.bodyText = bodyText;
            console.log(sent ? '✅ Location request sent' : '❌ Location request failed');
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing phone or body text';
            console.log('⚠️ Missing required fields for request_location:', { hasPhone: !!context.userPhone, bodyText });
          }
          break;
        }

        case 'send_flow': {
          const header = replaceVariables(config.header || 'Flow Header', context.variables);
          const body = replaceVariables(config.body || 'Flow Body', context.variables);
          const footer = replaceVariables(config.footer || '', context.variables);
          const flowId = replaceVariables(config.flow_id || '', context.variables);
          const flowToken = replaceVariables(config.flow_token || '', context.variables);
          const flowCta = replaceVariables(config.flow_cta || 'Submit', context.variables);
          const screen = replaceVariables(config.screen || '', context.variables);
          
          // Parse flow_data if it's a string
          let flowData = config.flow_data || {};
          if (typeof flowData === 'string') {
            try {
              flowData = JSON.parse(flowData);
            } catch {
              console.warn('Failed to parse flow_data, using as-is');
            }
          }
          
          // Deep substitute variables in flow_data
          const processedFlowData = JSON.parse(
            replaceVariables(JSON.stringify(flowData), context.variables)
          );
          
          if (context.userPhone && flowId) {
            const sent = await sendWhatsAppFlow(
              context.userPhone,
              header,
              body,
              footer,
              flowId,
              flowToken,
              flowCta,
              screen,
              processedFlowData,
              context.storage
            );
            nodeResponse.sent = sent;
            nodeResponse.flowId = flowId;
            nodeResponse.header = header;
            nodeResponse.body = body;
            console.log(sent ? '✅ Flow sent - waiting for user form submission' : '❌ Flow failed');
            
            // Pause execution - wait for user to submit flow form
            if (sent && context.userPhone) {
              pauseExecution(
                context.userPhone,
                context.flowId,
                currentNode.id,
                context.variables,
                'flow',
                context.executionId
              );
              shouldContinue = false;
            }
          } else {
            nodeResponse.sent = false;
            nodeResponse.error = 'Missing phone or flow ID';
            console.log('⚠️ Missing required fields for send_flow:', { hasPhone: !!context.userPhone, flowId });
          }
          break;
        }

        case 'http': {
          const newVars = await executeHttpRequest(config, context.variables);
          Object.assign(context.variables, newVars);
          console.log('✅ HTTP variables added:', Object.keys(newVars));
          break;
        }

        case 'google_sheets': {
          await executeGoogleSheets(config, context.variables);
          break;
        }

        case 'webhook': {
          const webhookUrl = replaceVariables(config.webhook_url || '', context.variables);
          const method = config.method || 'POST';
          const headers: Record<string, string> = {};
          
          if (config.headers && Array.isArray(config.headers)) {
            config.headers.forEach((h: any) => {
              if (h.key && h.value) {
                headers[replaceVariables(h.key, context.variables)] = replaceVariables(h.value, context.variables);
              }
            });
          }
          
          const body = config.body ? replaceVariables(config.body, context.variables) : JSON.stringify(context.variables);
          
          if (webhookUrl) {
            try {
              await fetch(webhookUrl, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                  ...headers
                },
                body: method !== 'GET' ? body : undefined
              });
              console.log('✅ Webhook called');
            } catch (error) {
              console.error('❌ Webhook error:', error);
            }
          }
          break;
        }

        case 'wait_for_reply': {
          console.log('⏸️  Wait for reply - stopping execution (requires user response)');
          shouldContinue = false;
          break;
        }

        case 'on_message':
        case 'catch_webhook': {
          console.log('✅ Trigger node - continuing');
          break;
        }

        default:
          console.log(`⚠️  Unknown node type: ${currentNode.type}`);
      }

      // Store node response in variables for access by subsequent nodes
      // Can be accessed as {{node_id.sent}}, {{node_id.message}}, etc.
      context.variables[currentNode.id] = nodeResponse;
      console.log(`📝 Stored response for node ${currentNode.id}:`, Object.keys(nodeResponse));

      if (!shouldContinue) {
        break;
      }

      const nextEdge = edges.find(e => e.source === currentNodeId);
      currentNodeId = nextEdge?.target ?? null;
      
      if (!currentNodeId) {
        console.log('🏁 Flow execution complete - no more nodes');
        break;
      }
    }

    if (iterations >= maxIterations) {
      console.error('⚠️  Maximum iterations reached - possible infinite loop');
    }

    console.log('✅ Flow execution finished');
  } catch (error) {
    console.error('❌ Flow execution error:', error);
  }
}
