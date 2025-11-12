import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface TestRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

Deno.serve(async (req: Request) => {
  console.log('🧪 Test HTTP API - Request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const testRequest: TestRequest = await req.json();

    if (!testRequest.url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const startTime = Date.now();
    const method = testRequest.method || 'GET';
    const timeout = testRequest.timeout || 30000;

    console.log('📤 Testing API:', {
      url: testRequest.url,
      method,
      hasHeaders: !!testRequest.headers,
      hasBody: !!testRequest.body
    });

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: testRequest.headers || {},
      signal: AbortSignal.timeout(timeout)
    };

    // Add body for non-GET requests
    if (method !== 'GET' && method !== 'HEAD' && testRequest.body) {
      fetchOptions.body = typeof testRequest.body === 'string'
        ? testRequest.body
        : JSON.stringify(testRequest.body);

      if (!fetchOptions.headers) {
        fetchOptions.headers = {};
      }

      const headers = fetchOptions.headers as Record<string, string>;
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    // Execute the HTTP request
    const response = await fetch(testRequest.url, fetchOptions);
    const duration = Date.now() - startTime;

    // Capture response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Parse response body
    let responseBody;
    const contentType = response.headers.get('content-type');

    try {
      if (contentType?.includes('application/json')) {
        responseBody = await response.json();
      } else if (contentType?.includes('text/')) {
        responseBody = await response.text();
      } else {
        responseBody = await response.text();
      }
    } catch (error) {
      responseBody = await response.text();
    }

    // Generate variable structure
    const variables: Record<string, any> = {
      'http.response.status': response.status,
      'http.response.statusText': response.statusText,
      'http.response.ok': response.ok
    };

    // Add body variables
    if (responseBody && typeof responseBody === 'object') {
      Object.entries(responseBody).forEach(([key, value]) => {
        variables[`http.response.body.${key}`] = value;
      });
    }

    // Add header variables
    Object.entries(responseHeaders).forEach(([key, value]) => {
      variables[`http.response.header.${key}`] = value;
    });

    console.log('✅ API test successful:', {
      status: response.status,
      duration: `${duration}ms`,
      variablesGenerated: Object.keys(variables).length
    });

    return new Response(
      JSON.stringify({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        duration,
        requestDetails: {
          url: testRequest.url,
          method,
          headers: testRequest.headers || {},
          body: testRequest.body
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
    console.error('❌ Test HTTP API error:', error);

    const duration = Date.now();

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Request failed',
        type: error.name || 'Error',
        duration,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
