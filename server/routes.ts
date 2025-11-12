import { Router, type Request, type Response } from 'express';
import type { IStorage } from './storage.js';
import { insertFlowSchema, insertFlowExecutionSchema, insertWebhookLogSchema, insertWebhookExecutionSchema } from '../shared/schema.js';
import { executeFlow } from './flowExecutor.js';

export function createRouter(storage: IStorage) {
  const router = Router();

  // Flows CRUD
  router.get('/api/flows', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId || 'demo-user';
      const flows = await storage.getFlows(userId);
      res.json(flows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get('/api/flows/:id', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId || 'demo-user';
      const flow = await storage.getFlow(req.params.id, userId);
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      res.json(flow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/api/flows', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId || 'demo-user';
      const validated = insertFlowSchema.parse({ ...req.body, userId });
      const flow = await storage.createFlow(validated);
      res.json(flow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  router.patch('/api/flows/:id', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId || 'demo-user';
      const flow = await storage.updateFlow(req.params.id, userId, req.body);
      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      res.json(flow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete('/api/flows/:id', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId || 'demo-user';
      const deleted = await storage.deleteFlow(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Flow not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Flow Executions
  router.get('/api/flows/:id/executions', async (req: Request, res: Response) => {
    try {
      const executions = await storage.getFlowExecutions(req.params.id);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Analytics
  router.get('/api/flows/:id/analytics', async (req: Request, res: Response) => {
    try {
      const analytics = await storage.getFlowAnalytics(req.params.id);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Templates
  router.get('/api/templates', async (req: Request, res: Response) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User Profile
  router.get('/api/profile', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId || 'demo-user';
      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ id: userId });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.patch('/api/profile', async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId || 'demo-user';
      const profile = await storage.updateUserProfile(userId, req.body);
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // WhatsApp Webhook - GET for verification (Meta requirement)
  router.get('/api/whatsapp-webhook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log('📞 WhatsApp Webhook Verification Request:', { mode, token: token ? '***' : null });

    if (mode === 'subscribe' && token) {
      const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'test-verify-token';
      
      if (token === verifyToken) {
        console.log('✅ Webhook verified successfully');
        return res.status(200).send(challenge);
      } else {
        console.log('❌ Invalid verify token');
        return res.status(403).json({ error: 'Invalid verify token' });
      }
    }

    return res.status(400).json({ error: 'Missing verification parameters' });
  });

  // WhatsApp Webhook - POST for incoming messages
  router.post('/api/whatsapp-webhook', async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const body = req.body;

      // Handle webhook event
      if (!body.entry || !body.entry[0]?.changes || !body.entry[0].changes[0]?.value) {
        await storage.createWebhookLog({
          method: 'POST',
          webhookPayload: body,
          errorMessage: 'Invalid webhook payload structure',
          processingTimeMs: Date.now() - startTime,
        });
        return res.status(200).json({ success: true });
      }

      const value = body.entry[0].changes[0].value;
      const messages = value.messages;
      
      if (!messages || messages.length === 0) {
        return res.status(200).json({ success: true });
      }

      const message = messages[0];
      const fromPhone = message.from;
      const messageType = message.type;
      const messageBody = message.text?.body || message.interactive?.button_reply?.title || '';

      // Prepare variables based on message type
      const messageVariables: Record<string, any> = {
        userMessage: messageBody,
        'user.phone': fromPhone,
        'message.type': messageType,
        'message.body': messageBody,
        'message.timestamp': message.timestamp,
        'message.id': message.id
      };

      // Handle different message types
      if (messageType === 'text') {
        messageVariables['text.body'] = message.text?.body || '';
      } else if (messageType === 'image' && message.image) {
        messageVariables['media.type'] = 'image';
        messageVariables['media.id'] = message.image.id;
        messageVariables['media.mime_type'] = message.image.mime_type;
        messageVariables['media.caption'] = message.image.caption || '';
        messageVariables['image.id'] = message.image.id;
      } else if (messageType === 'video' && message.video) {
        messageVariables['media.type'] = 'video';
        messageVariables['media.id'] = message.video.id;
        messageVariables['media.mime_type'] = message.video.mime_type;
        messageVariables['media.caption'] = message.video.caption || '';
        messageVariables['video.id'] = message.video.id;
      } else if (messageType === 'audio' && message.audio) {
        messageVariables['media.type'] = 'audio';
        messageVariables['media.id'] = message.audio.id;
        messageVariables['media.mime_type'] = message.audio.mime_type;
        messageVariables['audio.id'] = message.audio.id;
      } else if (messageType === 'document' && message.document) {
        messageVariables['media.type'] = 'document';
        messageVariables['media.id'] = message.document.id;
        messageVariables['media.mime_type'] = message.document.mime_type;
        messageVariables['media.filename'] = message.document.filename || '';
        messageVariables['media.caption'] = message.document.caption || '';
        messageVariables['document.id'] = message.document.id;
      } else if (messageType === 'location' && message.location) {
        messageVariables['location.latitude'] = message.location.latitude;
        messageVariables['location.longitude'] = message.location.longitude;
        messageVariables['location.name'] = message.location.name || '';
        messageVariables['location.address'] = message.location.address || '';
      } else if (messageType === 'interactive') {
        if (message.interactive?.type === 'button_reply') {
          messageVariables['button.id'] = message.interactive.button_reply.id;
          messageVariables['button.title'] = message.interactive.button_reply.title;
        } else if (message.interactive?.type === 'list_reply') {
          messageVariables['list.id'] = message.interactive.list_reply.id;
          messageVariables['list.title'] = message.interactive.list_reply.title;
          messageVariables['list.description'] = message.interactive.list_reply.description || '';
        } else if (message.interactive?.type === 'nfm_reply') {
          // WhatsApp Flow response - dynamically extract ALL fields
          console.log('🔄 WhatsApp Flow response detected');
          
          try {
            const responseJson = message.interactive.nfm_reply?.response_json;
            if (responseJson) {
              const flowData = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
              
              // Store flow response with ALL fields dynamically (not hardcoded)
              messageVariables['flow_response'] = flowData;
              
              // Also store each field individually for easy access
              Object.keys(flowData).forEach(key => {
                messageVariables[`flow_response.${key}`] = flowData[key];
              });
              
              console.log('✅ Flow response parsed. Fields:', Object.keys(flowData));
              console.log('📦 Flow data:', flowData);
            }
          } catch (error) {
            console.error('❌ Error parsing flow response:', error);
          }
        }
      }

      // Check if this is a response to a paused execution (button, list, or flow)
      const { getPausedExecution, resumeExecution } = await import('./flowExecutor.js');
      const pausedExecution = getPausedExecution(fromPhone);
      
      if (pausedExecution) {
        console.log(`🔄 Found paused execution for ${fromPhone}, resuming...`);
        
        // Prepare response data based on message type
        let responseData: Record<string, any> = {};
        
        if (messageType === 'interactive') {
          if (message.interactive?.type === 'button_reply') {
            // Store button response under the node ID
            responseData[pausedExecution.currentNodeId] = {
              type: 'button',
              id: message.interactive.button_reply.id,
              title: message.interactive.button_reply.title,
            };
            responseData['button.id'] = message.interactive.button_reply.id;
            responseData['button.title'] = message.interactive.button_reply.title;
          } else if (message.interactive?.type === 'list_reply') {
            // Store list response under the node ID
            responseData[pausedExecution.currentNodeId] = {
              type: 'list',
              id: message.interactive.list_reply.id,
              title: message.interactive.list_reply.title,
              description: message.interactive.list_reply.description || '',
            };
            responseData['list.id'] = message.interactive.list_reply.id;
            responseData['list.title'] = message.interactive.list_reply.title;
            responseData['list.description'] = message.interactive.list_reply.description || '';
          } else if (message.interactive?.type === 'nfm_reply') {
            // WhatsApp Flow response - store ALL fields under node ID dynamically
            try {
              const responseJson = message.interactive.nfm_reply?.response_json;
              if (responseJson) {
                const flowData = typeof responseJson === 'string' ? JSON.parse(responseJson) : responseJson;
                
                // Store complete flow data under the node ID
                responseData[pausedExecution.currentNodeId] = flowData;
                
                // Also store each field individually for easy access
                // Can now use {{node_id.task_name}}, {{node_id.due_date}}, etc.
                Object.keys(flowData).forEach(key => {
                  responseData[`${pausedExecution.currentNodeId}.${key}`] = flowData[key];
                });
                
                // Also store as flow_response for backward compatibility
                responseData['flow_response'] = flowData;
                Object.keys(flowData).forEach(key => {
                  responseData[`flow_response.${key}`] = flowData[key];
                });
                
                console.log(`✅ Captured ${Object.keys(flowData).length} fields from flow response`);
                console.log('📝 Available variables:', Object.keys(flowData).map(k => `{{${pausedExecution.currentNodeId}.${k}}}`).join(', '));
              }
            } catch (error) {
              console.error('❌ Error parsing flow response for resume:', error);
            }
          }
        }
        
        // Resume execution with the captured data
        await resumeExecution(fromPhone, pausedExecution.flowId, responseData, storage);
        
        await storage.createWebhookLog({
          method: 'POST',
          fromPhone,
          messageType,
          messageBody,
          webhookPayload: body,
          flowMatched: true,
          flowId: pausedExecution.flowId,
          executionId: pausedExecution.executionId,
          processingTimeMs: Date.now() - startTime,
        });
        
        return res.status(200).json({ success: true });
      }

      // Find matching flow (only if not resuming)
      const flow = await storage.getFlowByTrigger(messageBody);
      
      if (flow) {
        const execution = await storage.createFlowExecution({
          flowId: flow.id,
          userPhone: fromPhone,
          status: 'running',
          currentNode: 'start',
          variables: messageVariables,
        });

        await storage.createWebhookLog({
          method: 'POST',
          fromPhone,
          messageType,
          messageBody,
          webhookPayload: body,
          flowMatched: true,
          flowId: flow.id,
          executionId: execution.id,
          processingTimeMs: Date.now() - startTime,
        });

        executeFlow({
          flowId: flow.id,
          executionId: execution.id,
          variables: messageVariables,
          userPhone: fromPhone,
          storage
        }).catch(error => {
          console.error('Flow execution error:', error);
        });
      } else {
        await storage.createWebhookLog({
          method: 'POST',
          fromPhone,
          messageType,
          messageBody,
          webhookPayload: body,
          flowMatched: false,
          processingTimeMs: Date.now() - startTime,
        });
      }

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('WhatsApp webhook error:', error);
      await storage.createWebhookLog({
        method: 'POST',
        webhookPayload: req.body,
        errorMessage: error.message,
        processingTimeMs: Date.now() - startTime,
      });
      res.status(200).json({ success: true });
    }
  });

  // Custom Webhook
  router.all('/api/custom-webhook/:flowIdentifier/:nodeId', async (req: Request, res: Response) => {
    try {
      const { flowIdentifier, nodeId } = req.params;
      
      // Try to find flow
      const allFlows = await storage.getFlows('demo-user');
      let flow = allFlows.find(f => f.id === flowIdentifier);
      
      if (!flow) {
        flow = allFlows.find(f => {
          const urlFriendlyName = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return urlFriendlyName === flowIdentifier;
        });
      }

      if (!flow) {
        return res.status(404).json({ error: 'Flow not found' });
      }

      const requestData = {
        body: req.body,
        query: req.query,
        headers: req.headers,
        method: req.method,
      };

      try {
        await storage.createWebhookLog({
          method: req.method,
          webhookId: nodeId,
          flowId: flow.id,
          nodeId,
          headers: {},
          body: req.body || {},
          queryParams: Object.fromEntries(Object.entries(req.query || {})),
          timestamp: new Date().toISOString(),
          userId: flow.userId || 'demo-user',
        });
      } catch (logError) {
        console.warn('Failed to create webhook log:', logError);
      }

      const execution = await storage.createWebhookExecution({
        flowId: flow.id,
        nodeId,
        requestData,
        status: 'pending',
        userId: flow.userId,
      });

      const variables: Record<string, any> = {
        'webhook.method': req.method,
      };

      if (req.body && typeof req.body === 'object') {
        Object.entries(req.body).forEach(([key, value]) => {
          variables[`webhook.body.${key}`] = value;
        });
      }

      Object.entries(req.query).forEach(([key, value]) => {
        variables[`webhook.query.${key}`] = value;
      });

      const userPhone = req.body?.phone || req.body?.phoneNumber || req.query.phone || req.query.phoneNumber;

      res.json({
        success: true,
        message: 'Webhook received and processed successfully',
        flow_id: flow.id,
        flow_name: flow.name,
        node_id: nodeId,
        execution_id: execution.id,
        captured_data: requestData,
        variables_generated: Object.keys(variables),
        timestamp: new Date().toISOString(),
      });

      executeFlow({
        flowId: flow.id,
        executionId: execution.id,
        variables: {
          ...variables,
          'webhook.timestamp': new Date().toISOString(),
          'user.phone': userPhone || ''
        },
        userPhone: userPhone as string | undefined,
        storage
      }, nodeId).catch(error => {
        console.error('Custom webhook flow execution error:', error);
      });
    } catch (error: any) {
      console.error('Custom webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Completion
  router.post('/api/ai-completion', async (req: Request, res: Response) => {
    try {
      const { provider, model, system_prompt, prompt, temperature = 0.7, max_tokens = 1000 } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      let response;
      let tokensUsed = 0;

      if (provider === 'openai') {
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
          return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        const messages: any[] = [];
        if (system_prompt) {
          messages.push({ role: 'system', content: system_prompt });
        }
        messages.push({ role: 'user', content: prompt });

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'gpt-3.5-turbo',
            messages,
            temperature,
            max_tokens
          })
        });

        const data = await openaiResponse.json();
        if (!openaiResponse.ok) {
          throw new Error(data.error?.message || 'OpenAI API error');
        }

        response = data.choices[0]?.message?.content || '';
        tokensUsed = data.usage?.total_tokens || 0;
      } else if (provider === 'anthropic') {
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicApiKey) {
          return res.status(500).json({ error: 'Anthropic API key not configured' });
        }

        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicApiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'claude-3-sonnet-20240229',
            max_tokens,
            temperature,
            system: system_prompt || undefined,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        const data = await anthropicResponse.json();
        if (!anthropicResponse.ok) {
          throw new Error(data.error?.message || 'Anthropic API error');
        }

        response = data.content[0]?.text || '';
        tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
      } else {
        return res.status(400).json({ error: 'Invalid provider. Use "openai" or "anthropic"' });
      }

      res.json({
        success: true,
        response,
        tokens_used: tokensUsed,
        provider,
        model,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('AI completion error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Send Email
  router.post('/api/send-email', async (req: Request, res: Response) => {
    try {
      const { to, subject, body, from } = req.body;

      if (!to || !subject || !body) {
        return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
      }

      // Mock email sending (in production, integrate with SendGrid, etc.)
      console.log('Sending email:', { to, subject, from: from || 'noreply@whatsappflow.app' });

      res.json({
        success: true,
        message: 'Email sent successfully',
        to,
        subject,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Send email error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Database Query
  router.post('/api/database-query', async (req: Request, res: Response) => {
    try {
      const { operation, table, filters = {} } = req.body;

      if (!table) {
        return res.status(400).json({ error: 'Table name is required' });
      }

      // Mock database query (in production, use actual DB connection)
      let result: any = [];
      
      switch (operation) {
        case 'select':
          result = [];
          break;
        case 'insert':
          result = [filters];
          break;
        case 'update':
          result = [filters];
          break;
        case 'delete':
          result = [];
          break;
        default:
          return res.status(400).json({ error: 'Invalid operation' });
      }

      res.json({
        success: true,
        data: result,
        rows_affected: Array.isArray(result) ? result.length : 1,
        operation,
        table,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Database query error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // HTTP Test API
  router.post('/api/test-http-api', async (req: Request, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { url, method = 'GET', headers = {}, body, timeout = 30000 } = req.body;

      if (!url) {
        return res.status(400).json({ 
          success: false,
          error: 'URL is required' 
        });
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        const responseText = await response.text();
        let parsedBody;
        try {
          parsedBody = JSON.parse(responseText);
        } catch {
          parsedBody = responseText;
        }

        // Generate variables based on response
        const variables: string[] = [
          'http.response.status',
          'http.response.statusText',
          'http.response.body'
        ];

        // Add variables for each response body field if it's an object
        if (typeof parsedBody === 'object' && parsedBody !== null) {
          Object.keys(parsedBody).forEach(key => {
            variables.push(`http.response.body.${key}`);
          });
        }

        res.json({
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedBody,
          duration,
          requestDetails: {
            url,
            method,
            headers,
            body
          },
          variables_generated: variables,
          timestamp: new Date().toISOString(),
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        
        res.status(200).json({
          success: false,
          error: fetchError.name === 'AbortError' ? 'Request timeout' : fetchError.message,
          duration,
          requestDetails: {
            url,
            method,
            headers,
            body
          }
        });
      }
    } catch (error: any) {
      console.error('HTTP test error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  });

  // Webhook Logs
  router.get('/api/webhook-logs', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getWebhookLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
