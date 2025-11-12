import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  html?: boolean;
  from_name?: string;
}

Deno.serve(async (req: Request) => {
  console.log('📧 Send Email - Request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const requestData: EmailRequest = await req.json();
    const { to, subject, body, html = true, from_name } = requestData;

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'To, subject, and body are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    if (!resendApiKey) {
      console.log('⚠️ RESEND_API_KEY not configured, simulating email send');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email simulated (no email service configured)',
          message_id: `sim_${Date.now()}`,
          to,
          subject,
          simulated: true,
          note: 'Configure RESEND_API_KEY environment variable to send real emails',
          timestamp: new Date().toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const fromEmail = Deno.env.get('FROM_EMAIL') || 'noreply@yourdomain.com';
    const fromAddress = from_name ? `${from_name} <${fromEmail}>` : fromEmail;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        ...(html ? { html: body } : { text: body })
      })
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(data.message || 'Email sending failed');
    }

    console.log('✅ Email sent successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        message_id: data.id,
        to,
        subject,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Email sending error:', error);

    return new Response(
      JSON.stringify({
        error: 'Email sending failed',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
