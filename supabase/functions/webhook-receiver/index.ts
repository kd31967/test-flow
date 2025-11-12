import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  console.log('🔔 Webhook Receiver - Request received:', req.method, req.url);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const webhookId = url.searchParams.get('id');

    if (!webhookId) {
      return new Response(
        JSON.stringify({ error: 'Webhook ID is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📋 Looking up webhook:', webhookId);

    // Find the node with this webhook_id
    const { data: flows, error: flowError } = await supabase
      .from('flows')
      .select('id, name, config, user_id')
      .eq('status', 'active');

    if (flowError) {
      console.error('❌ Error fetching flows:', flowError);
      throw flowError;
    }

    let targetNode = null;
    let targetFlow = null;

    for (const flow of flows || []) {
      const nodes = flow.config?.nodes || [];
      const node = nodes.find((n: any) =>
        n.type === 'webhook' && n.data?.config?.webhook_id === webhookId
      );

      if (node) {
        targetNode = node;
        targetFlow = flow;
        break;
      }
    }

    if (!targetNode || !targetFlow) {
      console.log('❌ Webhook not found:', webhookId);
      return new Response(
        JSON.stringify({ error: 'Webhook not found or inactive' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const nodeConfig = targetNode.data?.config || {};

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
    const allowedMethods = nodeConfig.allowed_methods || ['GET', 'POST'];
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

    // Capture request data
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    let body = null;
    const contentType = req.headers.get('content-type');

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (contentType?.includes('application/json')) {
        body = await req.json();
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
      } else {
        body = await req.text();
      }
    }

    console.log('✅ Webhook data captured:', {
      method: req.method,
      hasBody: !!body,
      headerCount: Object.keys(headers).length
    });

    // Log webhook call
    const { error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhookId,
        flow_id: targetFlow.id,
        node_id: targetNode.id,
        method: req.method,
        headers: headers,
        body: body,
        timestamp: new Date().toISOString(),
        user_id: targetFlow.user_id
      });

    if (logError) {
      console.error('⚠️ Failed to log webhook:', logError);
    }

    // Store webhook data in a temporary storage for flow execution
    // This will be picked up by the flow executor
    const webhookData = {
      method: req.method,
      headers: headers,
      body: body,
      timestamp: new Date().toISOString()
    };

    // TODO: Trigger flow execution with webhook data
    // For now, just return success
    console.log('✅ Webhook processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook received successfully',
        webhook_id: webhookId,
        flow_name: targetFlow.name,
        data: webhookData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Webhook receiver error:', error);

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
