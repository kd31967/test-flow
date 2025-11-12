import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AIRequest {
  provider: 'openai' | 'anthropic';
  model: string;
  system_prompt?: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}

Deno.serve(async (req: Request) => {
  console.log('🤖 AI Completion - Request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: AIRequest = await req.json();
    const { provider, model, system_prompt, prompt, temperature = 0.7, max_tokens = 1000 } = requestData;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response;
    let tokensUsed = 0;

    if (provider === 'openai') {
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

      if (!openaiApiKey) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
      const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

      if (!anthropicApiKey) {
        return new Response(
          JSON.stringify({ error: 'Anthropic API key not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      const data = await anthropicResponse.json();

      if (!anthropicResponse.ok) {
        throw new Error(data.error?.message || 'Anthropic API error');
      }

      response = data.content[0]?.text || '';
      tokensUsed = data.usage?.input_tokens + data.usage?.output_tokens || 0;

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid provider. Use "openai" or "anthropic"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ AI completion generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        response,
        tokens_used: tokensUsed,
        provider,
        model,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ AI completion error:', error);

    return new Response(
      JSON.stringify({
        error: 'AI completion failed',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
