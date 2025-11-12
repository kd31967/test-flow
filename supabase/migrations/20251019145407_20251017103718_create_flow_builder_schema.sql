/*
  # WhatsApp Flow Builder Database Schema

  ## Overview
  Complete database schema for multi-tenant WhatsApp Flow Builder SaaS platform
  supporting flow creation, execution, analytics, and user management.

  ## New Tables

  ### 1. `flows`
  Main flow configuration storage
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - Flow name
  - `description` (text) - Flow description
  - `category` (text) - Business category
  - `status` (text) - draft, active, paused, archived
  - `trigger_keywords` (jsonb) - Array of trigger words/phrases
  - `config` (jsonb) - Complete flow configuration
  - `metadata` (jsonb) - WhatsApp Business API credentials
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `flow_nodes`
  Individual node definitions within flows
  - `id` (uuid, primary key)
  - `flow_id` (uuid, references flows)
  - `node_id` (text) - Unique node identifier within flow
  - `node_type` (text) - Type of node (message, button, form, etc.)
  - `config` (jsonb) - Node configuration
  - `position` (jsonb) - Canvas position {x, y}
  - `created_at` (timestamptz)

  ### 3. `flow_executions`
  Track flow execution instances
  - `id` (uuid, primary key)
  - `flow_id` (uuid, references flows)
  - `user_phone` (text) - User's WhatsApp number
  - `status` (text) - running, completed, failed, timeout
  - `current_node` (text) - Current execution position
  - `variables` (jsonb) - Runtime variables
  - `started_at` (timestamptz)
  - `completed_at` (timestamptz)

  ### 4. `flow_analytics`
  Analytics and metrics for flows
  - `id` (uuid, primary key)
  - `flow_id` (uuid, references flows)
  - `execution_id` (uuid, references flow_executions)
  - `event_type` (text) - flow_start, node_visit, flow_complete, error
  - `node_id` (text)
  - `data` (jsonb) - Event-specific data
  - `created_at` (timestamptz)

  ### 5. `user_profiles`
  Extended user profile information
  - `id` (uuid, primary key, references auth.users)
  - `business_name` (text)
  - `whatsapp_business_id` (text)
  - `whatsapp_app_id` (text)
  - `whatsapp_access_token` (text, encrypted)
  - `subscription_tier` (text) - free, pro, enterprise
  - `settings` (jsonb) - User preferences
  - `created_at` (timestamptz)

  ### 6. `templates`
  Pre-built flow templates
  - `id` (uuid, primary key)
  - `name` (text)
  - `description` (text)
  - `category` (text)
  - `thumbnail` (text) - URL to preview image
  - `config` (jsonb) - Template flow configuration
  - `is_public` (boolean)
  - `usage_count` (integer)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own flows and executions
  - Templates are readable by all authenticated users
  - Admin roles can access all data (future implementation)

  ## Indexes
  - Optimized for common queries
  - Support for JSONB searches
  - Performance-focused for analytics queries
*/

-- Create flows table
CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  whatsapp_business_id text,
  whatsapp_app_id text,
  whatsapp_access_token text,
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

-- RLS Policies for flows
CREATE POLICY "Users can view own flows"
  ON flows FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own flows"
  ON flows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flows"
  ON flows FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flows"
  ON flows FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for flow_nodes
CREATE POLICY "Users can view own flow nodes"
  ON flow_nodes FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_nodes.flow_id
    AND flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can create own flow nodes"
  ON flow_nodes FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_nodes.flow_id
    AND flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own flow nodes"
  ON flow_nodes FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_nodes.flow_id
    AND flows.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_nodes.flow_id
    AND flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own flow nodes"
  ON flow_nodes FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_nodes.flow_id
    AND flows.user_id = auth.uid()
  ));

-- RLS Policies for flow_executions
CREATE POLICY "Users can view own flow executions"
  ON flow_executions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_executions.flow_id
    AND flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can create flow executions"
  ON flow_executions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_executions.flow_id
    AND flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own flow executions"
  ON flow_executions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_executions.flow_id
    AND flows.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_executions.flow_id
    AND flows.user_id = auth.uid()
  ));

-- RLS Policies for flow_analytics
CREATE POLICY "Users can view own flow analytics"
  ON flow_analytics FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_analytics.flow_id
    AND flows.user_id = auth.uid()
  ));

CREATE POLICY "Users can create flow analytics"
  ON flow_analytics FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM flows
    WHERE flows.id = flow_analytics.flow_id
    AND flows.user_id = auth.uid()
  ));

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for templates
CREATE POLICY "Anyone can view public templates"
  ON templates FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Authenticated users can create templates"
  ON templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update templates"
  ON templates FOR UPDATE
  TO authenticated
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