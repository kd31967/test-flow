import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WebhookRequestData {
  body: any;
  query: Record<string, string>;
  headers: Record<string, string>;
  method: string;
}

Deno.serve(async (req: Request) => {
  console.log('🔔 Custom Webhook - Request received:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse URL: /custom-webhook/:flow_identifier/:nodeid
    // flow_identifier can be either flow UUID or URL-friendly flow name
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Expected: ['functions', 'v1', 'custom-webhook', 'flow_identifier', 'nodeid']
    // Or: ['custom-webhook', 'flow_identifier', 'nodeid']
    const webhookIndex = pathParts.findIndex(p => p === 'custom-webhook');
    if (webhookIndex === -1 || pathParts.length < webhookIndex + 3) {
      return new Response(
        JSON.stringify({
          error: 'Invalid webhook URL format. Expected: /custom-webhook/:flow_identifier/:nodeid',
          received_path: url.pathname,
          path_parts: pathParts
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const flowIdentifier = pathParts[webhookIndex + 1];
    const nodeId = pathParts[webhookIndex + 2];

    console.log('📋 Webhook Details:', { flowIdentifier, nodeId, fullPath: url.pathname });

    // Try to find flow by UUID first, then by URL-friendly name
    let flow;
    let flowError;

    // Try UUID lookup first
    const uuidResult = await supabase
      .from('flows')
      .select('id, name, config, user_id, status')
      .eq('id', flowIdentifier)
      .maybeSingle();

    if (uuidResult.data) {
      flow = uuidResult.data;
      console.log('✅ Found flow by UUID');
    } else {
      // Try name-based lookup (convert URL-friendly back to match)
      // Search for flows where URL-friendly version of name matches
      const allFlows = await supabase
        .from('flows')
        .select('id, name, config, user_id, status');

      if (!allFlows.error && allFlows.data) {
        flow = allFlows.data.find(f => {
          const urlFriendlyName = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return urlFriendlyName === flowIdentifier;
        });

        if (flow) {
          console.log('✅ Found flow by name:', flow.name);
        }
      }
      flowError = uuidResult.error;
    }

    console.log('🔍 Flow lookup:', { flowIdentifier, found: !!flow, status: flow?.status });

    if (flowError || !flow) {
      console.error('❌ Flow not found:', { flowError, flowIdentifier, pathParts });
      return new Response(
        JSON.stringify({
          error: 'Flow not found or inactive',
          details: {
            flow_identifier: flowIdentifier,
            message: 'Please ensure the flow exists and has been saved. Use either flow UUID or URL-friendly flow name.'
          }
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Find the webhook node in the flow
    const nodes = flow.config?.nodes || [];
    console.log('🔍 Looking for webhook node:', { nodeId, totalNodes: Object.keys(nodes).length, nodeIds: Object.keys(nodes) });

    // Handle both array and object format
    let webhookNode;
    if (Array.isArray(nodes)) {
      webhookNode = nodes.find((n: any) => n.id === nodeId && n.type === 'webhook');
    } else {
      webhookNode = nodes[nodeId];
      if (webhookNode && webhookNode.type !== 'webhook') {
        webhookNode = null;
      }
    }

    if (!webhookNode) {
      console.log('❌ Webhook node not found in flow');
      return new Response(
        JSON.stringify({
          error: 'Webhook node not found in flow',
          details: {
            node_id: nodeId,
            available_nodes: Array.isArray(nodes) ? nodes.map((n: any) => n.id) : Object.keys(nodes),
            message: 'Please ensure the webhook node exists in the flow and has been saved'
          }
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const nodeConfig = webhookNode.data?.config || {};

    // Check if webhook is active
    if (nodeConfig.status === 'inactive') {
      return new Response(
        JSON.stringify({ error: 'Webhook is inactive' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check allowed methods
    const allowedMethods = nodeConfig.allowed_methods || ['GET', 'POST', 'PUT', 'DELETE'];
    if (!allowedMethods.includes(req.method)) {
      return new Response(
        JSON.stringify({ error: `Method ${req.method} not allowed` }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate secret token if required
    if (nodeConfig.require_secret && nodeConfig.secret_token) {
      const authHeader = req.headers.get('Authorization');
      const providedToken = authHeader?.replace('Bearer ', '');

      if (providedToken !== nodeConfig.secret_token) {
        return new Response(
          JSON.stringify({ error: 'Invalid or missing secret token' }),
          {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Dynamically capture ALL request data
    const requestData: WebhookRequestData = {
      body: null,
      query: {},
      headers: {},
      method: req.method
    };

    // Capture headers
    req.headers.forEach((value, key) => {
      requestData.headers[key] = value;
    });

    // Capture query parameters
    url.searchParams.forEach((value, key) => {
      requestData.query[key] = value;
    });

    // Capture body based on content type
    const contentType = req.headers.get('content-type');

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        if (contentType?.includes('application/json')) {
          requestData.body = await req.json();
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await req.formData();
          const formObj: Record<string, any> = {};
          formData.forEach((value, key) => {
            formObj[key] = value;
          });
          requestData.body = formObj;
        } else if (contentType?.includes('multipart/form-data')) {
          const formData = await req.formData();
          const formObj: Record<string, any> = {};
          formData.forEach((value, key) => {
            formObj[key] = value;
          });
          requestData.body = formObj;
        } else {
          requestData.body = await req.text();
        }
      } catch (error) {
        console.error('Error parsing body:', error);
        requestData.body = null;
      }
    }

    console.log('✅ Webhook data captured:', {
      method: req.method,
      hasBody: !!requestData.body,
      queryCount: Object.keys(requestData.query).length,
      headerCount: Object.keys(requestData.headers).length
    });

    // Log webhook call
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: nodeId,
        flow_id: flow.id,
        node_id: nodeId,
        method: req.method,
        headers: requestData.headers,
        body: requestData.body,
        query_params: requestData.query,
        timestamp: new Date().toISOString(),
        user_id: flow.user_id
      });

    if (logError) {
      console.error('⚠️ Failed to log webhook:', logError);
    }

    // Store webhook data for flow execution
    // This creates a webhook execution record that the flow executor will pick up
    const { data: executionData, error: executionError } = await supabase
      .from('webhook_executions')
      .insert({
        flow_id: flow.id,
        node_id: nodeId,
        request_data: requestData,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (executionError) {
      console.error('⚠️ Failed to create execution record:', executionError);
    }

    // Generate dynamic variables structure for response
    const variables: Record<string, any> = {
      'webhook.method': req.method
    };

    // Add body variables
    if (requestData.body && typeof requestData.body === 'object') {
      Object.entries(requestData.body).forEach(([key, value]) => {
        variables[`webhook.body.${key}`] = value;
      });
    }

    // Add query variables
    Object.entries(requestData.query).forEach(([key, value]) => {
      variables[`webhook.query.${key}`] = value;
    });

    // Add header variables
    Object.entries(requestData.headers).forEach(([key, value]) => {
      variables[`webhook.header.${key}`] = value;
    });

    console.log('✅ Webhook processed successfully');
    console.log('📊 Generated variables:', Object.keys(variables).length);

    // Return success with all captured data and generated variables
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook received and processed successfully',
        flow_id: flow.id,
        flow_name: flow.name,
        node_id: nodeId,
        execution_id: executionData?.id,
        captured_data: {
          method: req.method,
          body: requestData.body,
          query: requestData.query,
          headers: requestData.headers
        },
        variables_generated: Object.keys(variables),
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Custom webhook error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
