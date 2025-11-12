-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'Custom',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  trigger_keywords jsonb DEFAULT '[]'::jsonb,
  config jsonb DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flow_nodes table
CREATE TABLE IF NOT EXISTS flow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  node_type text NOT NULL,
  config jsonb DEFAULT '{}'::jsonb,
  position jsonb DEFAULT '{"x": 0, "y": 0}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(flow_id, node_id)
);

-- Create flow_executions table
CREATE TABLE IF NOT EXISTS flow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  user_phone text NOT NULL,
  status text DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'timeout')),
  current_node text,
  variables jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create flow_analytics table
CREATE TABLE IF NOT EXISTS flow_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  execution_id uuid REFERENCES flow_executions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  node_id text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_profiles table (without auth.users reference for now)
CREATE TABLE IF NOT EXISTS user_profiles (
  id text PRIMARY KEY,
  business_name text,
  whatsapp_business_id text,
  whatsapp_app_id text,
  whatsapp_access_token text,
  phone_number_id text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  thumbnail text,
  config jsonb NOT NULL,
  is_public boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  method text NOT NULL,
  from_phone text,
  message_type text,
  message_body text,
  webhook_payload jsonb,
  flow_matched boolean DEFAULT false,
  flow_id uuid,
  execution_id uuid,
  session_found boolean DEFAULT false,
  current_node text,
  error_message text,
  whatsapp_response jsonb,
  processing_time_ms integer,
  webhook_id text,
  node_id text,
  headers jsonb,
  body jsonb,
  query_params jsonb,
  timestamp text,
  user_id text
);

-- Create webhook_executions table
CREATE TABLE IF NOT EXISTS webhook_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid REFERENCES flows(id) ON DELETE CASCADE NOT NULL,
  node_id text NOT NULL,
  request_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result jsonb,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flows_status ON flows(status);
CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_executions_flow_id ON flow_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_executions_status ON flow_executions(status);
CREATE INDEX IF NOT EXISTS idx_flow_analytics_flow_id ON flow_analytics(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_analytics_created_at ON flow_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON templates(is_public) WHERE is_public = true;

-- Enable Row Level Security
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flows (allow all for demo)
CREATE POLICY "Allow all access to flows"
  ON flows FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for flow_nodes (allow all for demo)
CREATE POLICY "Allow all access to flow_nodes"
  ON flow_nodes FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for flow_executions (allow all for demo)
CREATE POLICY "Allow all access to flow_executions"
  ON flow_executions FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for flow_analytics (allow all for demo)
CREATE POLICY "Allow all access to flow_analytics"
  ON flow_analytics FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for user_profiles (allow all for demo)
CREATE POLICY "Allow all access to user_profiles"
  ON user_profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for templates (allow all for demo)
CREATE POLICY "Allow all access to templates"
  ON templates FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for webhook_logs (allow all for demo)
CREATE POLICY "Allow all access to webhook_logs"
  ON webhook_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for webhook_executions (allow all for demo)
CREATE POLICY "Allow all access to webhook_executions"
  ON webhook_executions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for flows table
CREATE TRIGGER update_flows_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for webhook_executions table
CREATE TRIGGER update_webhook_executions_updated_at
  BEFORE UPDATE ON webhook_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();