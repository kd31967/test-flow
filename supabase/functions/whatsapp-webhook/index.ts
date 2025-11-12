import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  let logId: string | null = null;

  console.log('\n========================================')
  console.log('🚀 WEBHOOK REQUEST RECEIVED');
  console.log('   Method:', req.method);
  console.log('   URL:', req.url);
  console.log('   Time:', new Date().toISOString());
  console.log('========================================\n');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS request - returning CORS headers');
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);

    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      console.log('🔍 VERIFICATION REQUEST:');
      console.log('   Mode:', mode);
      console.log('   Token:', token);
      console.log('   Challenge:', challenge);

      await supabase.from('webhook_logs').insert({
        method: 'GET',
        webhook_payload: { mode, token, challenge },
        processing_time_ms: Date.now() - startTime,
      });

      if (mode === 'subscribe' && token === 'my-verify-token') {
        console.log('✅ Verification successful!');
        return new Response(challenge, {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
        });
      }

      console.log('❌ Verification failed!');
      return new Response('Forbidden', {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    if (req.method === 'POST') {
      const rawBody = await req.text();
      console.log('📨 POST REQUEST - Raw Body Length:', rawBody.length);

      let body;
      try {
        body = JSON.parse(rawBody);
        console.log('✅ Body parsed successfully');
        console.log('   Entry count:', body.entry?.length || 0);
      } catch (e) {
        console.error('❌ Failed to parse JSON body:', e);
        return new Response(JSON.stringify({ status: 'error', message: 'Invalid JSON' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create initial webhook log
      const { data: logData, error: logError } = await supabase
        .from('webhook_logs')
        .insert({
          method: 'POST',
          webhook_payload: body,
        })
        .select()
        .single();

      if (logError) {
        console.error('❌ Error creating webhook log:', logError);
      } else {
        logId = logData?.id;
        console.log('✅ Webhook log created:', logId);
      }

      const entry = body?.entry?.[0];
      const changes = entry?.changes?.[0];
      const messages = changes?.value?.messages;

      console.log('\n🔍 PARSING WEBHOOK DATA:');
      console.log('   Entry exists:', !!entry);
      console.log('   Changes exist:', !!changes);
      console.log('   Messages exist:', !!messages);
      console.log('   Messages count:', messages?.length || 0);

      if (!messages || messages.length === 0) {
        console.log('⚠️ No messages in webhook - responding OK');
        return new Response(JSON.stringify({ status: 'ok' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const message = messages[0];
      const from = message.from;
      const messageType = message.type;

      console.log('\n📱 MESSAGE DETAILS:');
      console.log('   From:', from);
      console.log('   Type:', messageType);
      console.log('   Message ID:', message.id);

      // Extract message content based on type
      const extractedMessage = extractMessageContent(message);
      console.log('   Extracted Message:', JSON.stringify(extractedMessage, null, 2));

      // Update webhook log with message details
      if (logId) {
        await supabase
          .from('webhook_logs')
          .update({
            from_phone: from,
            message_body: extractedMessage.text,
          })
          .eq('id', logId);
      }

      // Check for existing execution from same number
      const { data: existingExecution } = await supabase
        .from('flow_executions')
        .select('*')
        .eq('user_phone', from)
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('\n🔍 CHECKING FOR ACTIVE SESSION:');
      console.log('   Existing execution:', existingExecution?.id || 'NONE');
      console.log('   Flow ID:', existingExecution?.flow_id || 'N/A');
      console.log('   Current node:', existingExecution?.current_node || 'N/A');
      console.log('   Status:', existingExecution?.status || 'N/A');

      if (logId) {
        await supabase
          .from('webhook_logs')
          .update({
            session_found: !!existingExecution,
            execution_id: existingExecution?.id,
            flow_id: existingExecution?.flow_id,
            current_node: existingExecution?.current_node,
          })
          .eq('id', logId);
      }

      // If session exists, continue the flow
      if (existingExecution) {
        console.log('\n♻️ CONTINUING EXISTING FLOW...');

        const { data: flowData } = await supabase
          .from('flows')
          .select('*')
          .eq('id', existingExecution.flow_id)
          .maybeSingle();

        if (!flowData) {
          console.error('❌ Flow not found for execution');
          if (logId) {
            await supabase
              .from('webhook_logs')
              .update({
                error_message: 'Flow not found for execution',
                processing_time_ms: Date.now() - startTime,
              })
              .eq('id', logId);
          }
          return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', flowData.user_id)
          .maybeSingle();

        if (!userProfile) {
          console.error('❌ User profile not found');
          if (logId) {
            await supabase
              .from('webhook_logs')
              .update({
                error_message: 'User profile not found',
                processing_time_ms: Date.now() - startTime,
              })
              .eq('id', logId);
          }
          return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        await continueFlow(
          existingExecution,
          flowData,
          userProfile,
          from,
          extractedMessage,
          message,
          supabase,
          logId
        );
      } else {
        // No session - Try to match a trigger to start new flow
        console.log('\n🔍 NO ACTIVE SESSION - Looking for matching trigger...');

        const { data: flows, error } = await supabase
          .from('flows')
          .select('*')
          .eq('status', 'active');

        console.log('\n📊 DATABASE QUERY RESULT:');
        console.log('   Error:', error ? error.message : 'NO');
        console.log('   Flows found:', flows?.length || 0);

        if (flows && flows.length > 0) {
          flows.forEach((flow, index) => {
            console.log(`\n   Flow ${index + 1}:`);
            console.log('      ID:', flow.id);
            console.log('      Name:', flow.name);
            console.log('      Triggers:', flow.trigger_keywords);
          });
        }

        if (error) {
          console.error('❌ Error fetching flows:', error);
          if (logId) {
            await supabase
              .from('webhook_logs')
              .update({
                error_message: `Error fetching flows: ${error.message}`,
                processing_time_ms: Date.now() - startTime,
              })
              .eq('id', logId);
          }
          return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Try to match flow based on message content
        let matchedFlow = null;
        if (flows) {
          matchedFlow = matchFlowTrigger(flows, extractedMessage);
        }

        if (matchedFlow) {
          console.log('\n🎯 MATCHED FLOW:');
          console.log('   Flow ID:', matchedFlow.id);
          console.log('   Flow Name:', matchedFlow.name);
          console.log('   Triggers:', matchedFlow.trigger_keywords);

          if (logId) {
            await supabase
              .from('webhook_logs')
              .update({
                flow_matched: true,
                flow_id: matchedFlow.id,
              })
              .eq('id', logId);
          }

          const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', matchedFlow.user_id)
            .maybeSingle();

          if (!userProfile) {
            console.error('❌ User profile not found');
            if (logId) {
              await supabase
                .from('webhook_logs')
                .update({
                  error_message: 'User profile not found',
                  processing_time_ms: Date.now() - startTime,
                })
                .eq('id', logId);
            }
            return new Response(JSON.stringify({ status: 'ok' }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          await startNewFlow(matchedFlow, userProfile, from, extractedMessage, message, supabase, logId);
        } else {
          console.log('\n❌ NO MATCHING FLOW');
          console.log('   Message:', extractedMessage.text);
          console.log('   Available flows:', flows?.length || 0);

          if (logId) {
            await supabase
              .from('webhook_logs')
              .update({
                flow_matched: false,
                error_message: `No matching flow for: ${extractedMessage.text}`,
                processing_time_ms: Date.now() - startTime,
              })
              .eq('id', logId);
          }
        }
      }

      console.log('\n========================================');
      console.log('✅ WEBHOOK PROCESSING COMPLETE');
      console.log('   Processing time:', Date.now() - startTime, 'ms');
      console.log('========================================\n');

      return new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('\n💥 FATAL ERROR:');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);

    if (logId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase
          .from('webhook_logs')
          .update({
            error_message: `Fatal error: ${error.message}`,
            processing_time_ms: Date.now() - startTime,
          })
          .eq('id', logId);
      } catch (logError) {
        console.error('   Failed to update error log:', logError);
      }
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ==================== MESSAGE EXTRACTION ====================
function extractMessageContent(message: any): any {
  const messageType = message.type;

  console.log('📝 Extracting message content, type:', messageType);

  switch (messageType) {
    case 'text':
      return {
        type: 'text',
        text: message.text?.body?.trim() || '',
        id: null,
        title: null
      };

    case 'interactive':
      const interactiveType = message.interactive?.type;
      console.log('   Interactive type:', interactiveType);

      if (interactiveType === 'button_reply') {
        const reply = message.interactive.button_reply;
        return {
          type: 'interactive_button',
          text: reply.title || reply.id || '',
          id: reply.id,
          title: reply.title
        };
      } else if (interactiveType === 'list_reply') {
        const reply = message.interactive.list_reply;
        return {
          type: 'interactive_list',
          text: reply.title || reply.id || '',
          id: reply.id,
          title: reply.title
        };
      } else if (interactiveType === 'flow_reply' || interactiveType === 'nfm_reply') {
        const flowReply = message.interactive.flow_reply || message.interactive.nfm_reply;
        return {
          type: 'interactive_flow',
          text: JSON.stringify(flowReply.response_json || {}),
          id: flowReply.id,
          title: flowReply.title,
          response_json: flowReply.response_json
        };
      }
      break;

    case 'location':
      const loc = message.location;
      return {
        type: 'location',
        text: 'location_shared',
        location: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address || '',
          name: loc.name || ''
        }
      };

    case 'image':
    case 'video':
    case 'audio':
    case 'document':
      return {
        type: messageType,
        text: `${messageType}_received`,
        media_id: message[messageType]?.id,
        caption: message[messageType]?.caption
      };

    default:
      console.warn('⚠️ Unsupported message type:', messageType);
      return {
        type: 'unknown',
        text: '',
        id: null,
        title: null
      };
  }

  return {
    type: 'unknown',
    text: '',
    id: null,
    title: null
  };
}

// ==================== FLOW MATCHING ====================
function matchFlowTrigger(flows: any[], extractedMessage: any): any | null {
  const messageText = extractedMessage.text?.toLowerCase() || '';
  const messageId = extractedMessage.id?.toLowerCase() || '';
  const messageTitle = extractedMessage.title?.toLowerCase() || '';

  console.log('🔍 Matching flow trigger:');
  console.log('   Text:', messageText);
  console.log('   ID:', messageId);
  console.log('   Title:', messageTitle);

  for (const flow of flows) {
    console.log('\n   Checking flow:', flow.name);
    console.log('      Trigger keywords:', flow.trigger_keywords);

    if (flow.trigger_keywords && Array.isArray(flow.trigger_keywords)) {
      const keywords = flow.trigger_keywords.map((k: string) => k.toLowerCase());
      console.log('      Normalized keywords:', keywords);

      // Check if any keyword matches text, id, or title
      const isMatch = keywords.some((keyword: string) =>
        messageText === keyword ||
        messageId === keyword ||
        messageTitle === keyword
      );

      if (isMatch) {
        console.log('      ✅ MATCH FOUND!');
        return flow;
      } else {
        console.log('      ❌ No match');
      }
    } else {
      console.log('      ⚠️ No trigger keywords defined');
    }
  }

  return null;
}

// ==================== START NEW FLOW ====================
async function startNewFlow(
  flowData: any,
  userProfile: any,
  from: string,
  extractedMessage: any,
  originalMessage: any,
  supabase: any,
  logId: string | null
) {
  console.log('\n🚀 STARTING NEW FLOW EXECUTION');
  console.log('   Flow:', flowData.name);
  console.log('   User:', from);

  const triggerNode = flowData.config?.trigger;
  const startNodeId = flowData.config?.start_node || Object.keys(flowData.config?.nodes || {})[0];

  console.log('\n📍 FLOW CONFIG:');
  console.log('   Trigger node:', triggerNode?.type || 'NONE');
  console.log('   Start node ID:', startNodeId);
  console.log('   Available nodes:', Object.keys(flowData.config?.nodes || {}).length);

  const initialVariables = {
    USER_PHONE: from,
    USER_NAME: originalMessage.profile?.name || originalMessage.contacts?.[0]?.profile?.name || '~',
    TRIGGER_MESSAGE: extractedMessage.text,
  };

  console.log('\n📝 INITIAL VARIABLES:');
  console.log('   ', JSON.stringify(initialVariables, null, 2));

  const { data: execution, error: execError } = await supabase
    .from('flow_executions')
    .insert({
      flow_id: flowData.id,
      user_phone: from,
      status: 'running',
      current_node: startNodeId,
      variables: initialVariables,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (execError) {
    console.error('❌ Error creating flow execution:', execError);
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({
          error_message: `Error creating flow execution: ${execError.message}`,
        })
        .eq('id', logId);
    }
    return;
  }

  console.log('✅ Flow execution created:', execution.id);

  if (logId) {
    await supabase
      .from('webhook_logs')
      .update({
        execution_id: execution.id,
        current_node: startNodeId,
      })
      .eq('id', logId);
  }

  if (!flowData.config?.nodes) {
    console.error('❌ No nodes in flow config');
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({
          error_message: 'No nodes in flow config',
        })
        .eq('id', logId);
    }
    return;
  }

  if (!startNodeId) {
    console.error('❌ No start node in flow config');
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({
          error_message: 'No start node in flow config',
        })
        .eq('id', logId);
    }
    return;
  }

  console.log('\n⚡ EXECUTING START NODE:', startNodeId);
  await executeNode(startNodeId, from, initialVariables, flowData, userProfile, supabase, execution.id, logId);
}

// ==================== CONTINUE FLOW ====================
async function continueFlow(
  execution: any,
  flowData: any,
  userProfile: any,
  from: string,
  extractedMessage: any,
  originalMessage: any,
  supabase: any,
  logId: string | null
) {
  console.log('\n♻️ CONTINUING FLOW EXECUTION');
  console.log('   Execution ID:', execution.id);
  console.log('   Current Node:', execution.current_node);
  console.log('   Message:', extractedMessage.text);
  console.log('   Message Type:', extractedMessage.type);
  console.log('   Button ID:', extractedMessage.id);

  const currentNode = flowData.config?.nodes?.[execution.current_node];

  if (!currentNode) {
    console.error('❌ Current node not found in flow');
    return;
  }

  console.log('   Node type:', currentNode.type);

  const updatedVariables = {
    ...execution.variables,
    LAST_USER_MESSAGE: extractedMessage.text,
  };

  // ✅ FIX: Handle button clicks (Button 1, Button 2, etc.)
  if (extractedMessage.type === 'interactive_button' && extractedMessage.id) {
    console.log('   🔘 BUTTON CLICK DETECTED');
    console.log('   Button ID:', extractedMessage.id);

    // Check if current node has button connections
    if (currentNode.type === 'send_button' && currentNode.config?.buttons) {
      const clickedButton = currentNode.config.buttons.find((btn: any) => btn.id === extractedMessage.id);

      if (clickedButton && clickedButton.nextNodeId) {
        console.log('   ✅ Button has connection to:', clickedButton.nextNodeId);

        await supabase
          .from('flow_executions')
          .update({ variables: updatedVariables })
          .eq('id', execution.id);

        // Execute the connected node
        await executeNode(clickedButton.nextNodeId, from, updatedVariables, flowData, userProfile, supabase, execution.id, logId);
        return;
      } else {
        console.log('   ⚠️ Button has no connection - completing flow');
      }
    }
  }

  // Save response based on node configuration
  if (currentNode.type === 'wait_for_reply' && currentNode.config?.saveAs) {
    updatedVariables[currentNode.config.saveAs] = extractedMessage.text;
    console.log(`   Saved user input to variable: ${currentNode.config.saveAs}`);
  }

  await supabase
    .from('flow_executions')
    .update({ variables: updatedVariables })
    .eq('id', execution.id);

  if (currentNode.next) {
    console.log('   Moving to next node:', currentNode.next);
    await executeNode(currentNode.next, from, updatedVariables, flowData, userProfile, supabase, execution.id, logId);
  } else {
    console.log('   No next node - completing flow');
    await supabase
      .from('flow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', execution.id);
  }
}

// ==================== EXECUTE NODE ====================
async function executeNode(
  nodeId: string,
  to: string,
  sessionData: any,
  flowData: any,
  userProfile: any,
  supabase: any,
  executionId: string | null,
  logId: string | null
) {
  console.log('\n⚙️ EXECUTING NODE:', nodeId);

  const node = flowData.config?.nodes?.[nodeId];

  if (!node) {
    console.error('   ❌ Node not found:', nodeId);
    return;
  }

  console.log('   Node type:', node.type);
  console.log('   Node config:', JSON.stringify(node.config || {}, null, 2));
  console.log('   Node next:', node.next || 'NONE');

  const phoneNumberId = userProfile.phone_number_id;
  const accessToken = userProfile.whatsapp_access_token;

  if (!phoneNumberId || !accessToken) {
    console.error('   ❌ Missing WhatsApp credentials');
    if (logId) {
      await supabase
        .from('webhook_logs')
        .update({
          error_message: 'Missing WhatsApp credentials (phone_number_id or whatsapp_access_token)',
        })
        .eq('id', logId);
    }
    return;
  }

  console.log('   WhatsApp Phone Number ID:', phoneNumberId);
  console.log('   Access Token exists:', !!accessToken);

  switch (node.type) {
    case 'on_message':
      console.log('   🎯 ON_MESSAGE trigger node');
      console.log('   Keywords:', node.config?.keywords || 'NONE');

      if (node.next) {
        console.log('   ➡️ Moving to next node:', node.next);
        if (executionId) {
          await supabase
            .from('flow_executions')
            .update({ current_node: node.next })
            .eq('id', executionId);
        }
        await executeNode(node.next, to, sessionData, flowData, userProfile, supabase, executionId, logId);
      } else {
        console.warn('   ⚠️ ON_MESSAGE node has no next node - flow will wait for user input');
      }
      break;

    case 'send_message':
      // ✅ FIX: Check if this node already sent a message to prevent duplicates
      const { data: existingLog } = await supabase
        .from('webhook_logs')
        .select('id, message_sent')
        .eq('execution_id', executionId)
        .eq('current_node', nodeId)
        .not('message_sent', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingLog && existingLog.message_sent) {
        console.log(`   ⚠️ MESSAGE ALREADY SENT for node ${nodeId} - skipping to prevent duplicate`);
        console.log(`   Previous message: "${existingLog.message_sent}"`);

        // Move to next node without sending
        if (node.next && flowData.config?.nodes?.[node.next]) {
          if (executionId) {
            await supabase
              .from('flow_executions')
              .update({ current_node: node.next })
              .eq('id', executionId);
          }
          await executeNode(node.next, to, sessionData, flowData, userProfile, supabase, executionId, logId);
        } else {
          console.log('   ✅ Flow completed - no next node');
          if (executionId) {
            await supabase
              .from('flow_executions')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', executionId);
          }
        }
        break;
      }

      const messageText = node.config?.answerText || node.config?.message || '';
      console.log(`   📤 SENDING MESSAGE: "${messageText}"`);

      const substituted = substitute(messageText, sessionData);
      console.log(`   📝 After substitution: "${substituted}"`);

      const whatsappResponse = await sendWhatsAppMessage(to, substituted, phoneNumberId, accessToken);

      // Update webhook log with sent message
      if (logId && whatsappResponse) {
        await supabase
          .from('webhook_logs')
          .update({
            whatsapp_response: whatsappResponse,
            message_sent: substituted,  // Store the sent message
            current_node: nodeId  // Track which node sent this message
          })
          .eq('id', logId);
      }

      if (node.next && flowData.config?.nodes?.[node.next]) {
        if (executionId) {
          await supabase
            .from('flow_executions')
            .update({ current_node: node.next })
            .eq('id', executionId);
        }
        await executeNode(node.next, to, sessionData, flowData, userProfile, supabase, executionId, logId);
      } else {
        console.log('   ✅ Flow completed - no next node');
        if (executionId) {
          await supabase
            .from('flow_executions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', executionId);
        }
      }
      break;

    case 'send_media':
      // ✅ FIX: Check if this node already sent media to prevent duplicates
      const { data: existingMediaLog } = await supabase
        .from('webhook_logs')
        .select('id, message_sent')
        .eq('execution_id', executionId)
        .eq('current_node', nodeId)
        .not('message_sent', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingMediaLog && existingMediaLog.message_sent) {
        console.log(`   ⚠️ MEDIA ALREADY SENT for node ${nodeId} - skipping to prevent duplicate`);
        console.log(`   Previous media: "${existingMediaLog.message_sent}"`);

        // Move to next node without sending
        if (node.next && flowData.config?.nodes?.[node.next]) {
          if (executionId) {
            await supabase
              .from('flow_executions')
              .update({ current_node: node.next })
              .eq('id', executionId);
          }
          await executeNode(node.next, to, sessionData, flowData, userProfile, supabase, executionId, logId);
        } else {
          console.log('   ✅ Flow completed - no next node');
          if (executionId) {
            await supabase
              .from('flow_executions')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', executionId);
          }
        }
        break;
      }

      const mediaType = (node.config?.mediaType || 'image').toLowerCase();
      const mediaUrl = substitute(node.config?.mediaUrl || '', sessionData);
      const mediaCaption = substitute(node.config?.caption || '', sessionData);
      console.log(`   📸 SENDING MEDIA: type=${mediaType}, url=${mediaUrl}`);

      const mediaResponse = await sendWhatsAppMedia(to, mediaType, mediaUrl, mediaCaption, node.config?.filename, phoneNumberId, accessToken);

      if (logId && mediaResponse) {
        await supabase
          .from('webhook_logs')
          .update({
            whatsapp_response: mediaResponse,
            message_sent: `[${mediaType}] ${mediaCaption || 'Media sent'}`,
            current_node: nodeId  // Track which node sent this media
          })
          .eq('id', logId);
      }

      if (node.next && flowData.config?.nodes?.[node.next]) {
        if (executionId) {
          await supabase
            .from('flow_executions')
            .update({ current_node: node.next })
            .eq('id', executionId);
        }
        await executeNode(node.next, to, sessionData, flowData, userProfile, supabase, executionId, logId);
      } else {
        console.log('   ✅ Flow completed - no next node');
        if (executionId) {
          await supabase
            .from('flow_executions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', executionId);
        }
      }
      break;

    case 'send_button':
      // ✅ FIX: Check if this node already sent buttons to prevent duplicates
      const { data: existingButtonLog } = await supabase
        .from('webhook_logs')
        .select('id, message_sent')
        .eq('execution_id', executionId)
        .eq('current_node', nodeId)
        .not('message_sent', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingButtonLog && existingButtonLog.message_sent) {
        console.log(`   ⚠️ BUTTONS ALREADY SENT for node ${nodeId} - waiting for user button click`);
        console.log(`   Previous message: "${existingButtonLog.message_sent}"`);

        // Keep flow in running state, waiting for button click
        if (executionId) {
          await supabase
            .from('flow_executions')
            .update({
              current_node: nodeId,
              status: 'running',
            })
            .eq('id', executionId);
        }
        break;
      }

      const headerType = node.config?.headerType || 'none';
      const headerText = substitute(node.config?.headerText || '', sessionData);
      const headerMediaUrl = substitute(node.config?.headerMediaUrl || '', sessionData);
      const bodyText = substitute(node.config?.bodyText || '', sessionData);
      const footerText = node.config?.footerText ? substitute(node.config.footerText, sessionData) : '';
      const buttons = node.config?.buttons || [];

      console.log(`   🔘 SENDING INTERACTIVE BUTTONS: ${buttons.length} buttons`);
      console.log(`   Header Type: ${headerType}`);
      console.log(`   Body: ${bodyText}`);

      // Build WhatsApp interactive message
      const interactivePayload: any = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText
          },
          action: {
            buttons: buttons.slice(0, 3).map((btn: any, idx: number) => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title.slice(0, 20)
              }
            }))
          }
        }
      };

      // Add header if present
      if (headerType === 'text' && headerText) {
        interactivePayload.interactive.header = {
          type: 'text',
          text: headerText
        };
      } else if (['image', 'video', 'document'].includes(headerType) && headerMediaUrl) {
        interactivePayload.interactive.header = {
          type: headerType,
          [headerType]: {
            link: headerMediaUrl
          }
        };
      }

      // Add footer if present
      if (footerText) {
        interactivePayload.interactive.footer = {
          text: footerText
        };
      }

      const buttonResponse = await sendWhatsAppInteractive(to, interactivePayload, phoneNumberId, accessToken);

      if (logId && buttonResponse) {
        await supabase
          .from('webhook_logs')
          .update({
            whatsapp_response: buttonResponse,
            message_sent: `[Interactive Buttons] ${bodyText.slice(0, 50)}...`,
            current_node: nodeId
          })
          .eq('id', logId);
      }

      // Keep flow in running state, waiting for button click
      console.log('   ⏳ Waiting for user to click a button...');
      if (executionId) {
        await supabase
          .from('flow_executions')
          .update({
            current_node: nodeId,
            status: 'running',
          })
          .eq('id', executionId);
      }
      break;

    case 'wait_for_reply':
      console.log('   ⏳ WAIT_FOR_REPLY node');
      console.log('   Save as:', node.config?.saveAs || 'NONE');
      console.log('   Keeping flow in running state...');

      if (executionId) {
        await supabase
          .from('flow_executions')
          .update({
            current_node: nodeId,
            status: 'running',
          })
          .eq('id', executionId);
      }
      break;

    default:
      console.warn(`   ⚠️ Unknown node type: ${node.type}`);
      if (node.next) {
        console.log('   ➡️ Attempting to move to next node:', node.next);
        await executeNode(node.next, to, sessionData, flowData, userProfile, supabase, executionId, logId);
      }
      break;
  }
}

// ==================== UTILITIES ====================
function substitute(text: string, variables: Record<string, any>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = variables[key.trim()];
    return value !== undefined ? String(value) : match;
  });
}

async function sendWhatsAppMessage(
  to: string,
  message: string,
  phoneNumberId: string,
  accessToken: string
): Promise<any> {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: 'text',
    text: { body: message },
  };

  console.log('\n📡 SENDING TO WHATSAPP API:');
  console.log('   URL:', url);
  console.log('   To:', to);
  console.log('   Message:', message);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    console.log('   ✅ WhatsApp API Response:', JSON.stringify(responseData, null, 2));

    return responseData;
  } catch (error) {
    console.error('   💥 Error sending message:', error);
    throw error;
  }
}

async function sendWhatsAppMedia(
  to: string,
  mediaType: string,
  mediaUrl: string,
  caption: string | undefined,
  filename: string | undefined,
  phoneNumberId: string,
  accessToken: string
): Promise<any> {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const mediaObject: any = {
    link: mediaUrl
  };

  if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
    mediaObject.caption = caption;
  }

  if (filename && mediaType === 'document') {
    mediaObject.filename = filename;
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    type: mediaType,
    [mediaType]: mediaObject
  };

  console.log('\n📡 SENDING MEDIA TO WHATSAPP API:');
  console.log('   URL:', url);
  console.log('   To:', to);
  console.log('   Type:', mediaType);
  console.log('   Media URL:', mediaUrl);
  console.log('   Caption:', caption || 'none');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    console.log('   ✅ WhatsApp Media API Response:', JSON.stringify(responseData, null, 2));

    return responseData;
  } catch (error) {
    console.error('   💥 Error sending media:', error);
    throw error;
  }
}

async function sendWhatsAppInteractive(
  to: string,
  payload: any,
  phoneNumberId: string,
  accessToken: string
): Promise<any> {
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  console.log('\n📡 SENDING INTERACTIVE MESSAGE TO WHATSAPP API:');
  console.log('   URL:', url);
  console.log('   To:', to);
  console.log('   Type:', payload.type);
  console.log('   Buttons:', payload.interactive?.action?.buttons?.length || 0);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    console.log('   ✅ WhatsApp Interactive API Response:', JSON.stringify(responseData, null, 2));

    return responseData;
  } catch (error) {
    console.error('   💥 Error sending interactive message:', error);
    throw error;
  }
}
