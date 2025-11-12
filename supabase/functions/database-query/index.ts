import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DatabaseRequest {
  operation: 'select' | 'insert' | 'update' | 'delete';
  table: string;
  query?: string;
  filters?: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  console.log('🗄️ Database Query - Request received:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const requestData: DatabaseRequest = await req.json();
    const { operation, table, query, filters = {} } = requestData;

    if (!table) {
      return new Response(
        JSON.stringify({ error: 'Table name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    let error;

    if (query) {
      const { data, error: queryError } = await supabase.rpc('execute_sql', {
        sql_query: query
      });

      result = data;
      error = queryError;

      if (!error && !data) {
        const { data: rawData, error: rawError } = await supabase
          .from(table)
          .select('*');

        result = rawData;
        error = rawError;
      }
    } else {
      switch (operation) {
        case 'select': {
          let selectQuery = supabase.from(table).select('*');

          Object.entries(filters).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              if (value.$gte !== undefined) selectQuery = selectQuery.gte(key, value.$gte);
              if (value.$lte !== undefined) selectQuery = selectQuery.lte(key, value.$lte);
              if (value.$gt !== undefined) selectQuery = selectQuery.gt(key, value.$gt);
              if (value.$lt !== undefined) selectQuery = selectQuery.lt(key, value.$lt);
              if (value.$ne !== undefined) selectQuery = selectQuery.neq(key, value.$ne);
            } else {
              selectQuery = selectQuery.eq(key, value);
            }
          });

          const { data, error: selectError } = await selectQuery;
          result = data;
          error = selectError;
          break;
        }

        case 'insert': {
          const { data, error: insertError } = await supabase
            .from(table)
            .insert(filters)
            .select();

          result = data;
          error = insertError;
          break;
        }

        case 'update': {
          const { id, ...updateData } = filters;

          if (!id) {
            return new Response(
              JSON.stringify({ error: 'ID is required for update operations' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data, error: updateError } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id)
            .select();

          result = data;
          error = updateError;
          break;
        }

        case 'delete': {
          const { id } = filters;

          if (!id) {
            return new Response(
              JSON.stringify({ error: 'ID is required for delete operations' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const { data, error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .select();

          result = data;
          error = deleteError;
          break;
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Invalid operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    }

    if (error) {
      console.error('❌ Database query error:', error);
      return new Response(
        JSON.stringify({
          error: 'Database query failed',
          message: error.message,
          details: error
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Database query executed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        rows_affected: Array.isArray(result) ? result.length : 1,
        operation,
        table,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Database query error:', error);

    return new Response(
      JSON.stringify({
        error: 'Database query failed',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
