/*
  # Create webhook_executions table

  1. New Tables
    - `webhook_executions`
      - `id` (uuid, primary key) - Unique execution ID
      - `flow_id` (uuid) - Reference to flows table
      - `node_id` (text) - Webhook node ID
      - `request_data` (jsonb) - Full request data including body, query, headers, method
      - `status` (text) - Execution status: pending, processing, completed, failed
      - `result` (jsonb) - Execution result data
      - `error` (text) - Error message if failed
      - `created_at` (timestamptz) - When the webhook was received
      - `updated_at` (timestamptz) - Last update time
      - `user_id` (uuid) - Reference to auth.users

  2. Security
    - Enable RLS on `webhook_executions` table
    - Add policies for authenticated users to manage their own executions

  3. Indexes
    - Index on flow_id for faster lookups
    - Index on node_id for filtering
    - Index on status for queue processing
    - Index on created_at for time-based queries
*/

-- Create webhook_executions table
CREATE TABLE IF NOT EXISTS webhook_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  request_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  result jsonb DEFAULT NULL,
  error text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_executions_flow_id ON webhook_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_webhook_executions_node_id ON webhook_executions(node_id);
CREATE INDEX IF NOT EXISTS idx_webhook_executions_status ON webhook_executions(status);
CREATE INDEX IF NOT EXISTS idx_webhook_executions_created_at ON webhook_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_executions_user_id ON webhook_executions(user_id);

-- Enable Row Level Security
ALTER TABLE webhook_executions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own webhook executions
CREATE POLICY "Users can view own webhook executions"
  ON webhook_executions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own webhook executions
CREATE POLICY "Users can insert own webhook executions"
  ON webhook_executions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own webhook executions
CREATE POLICY "Users can update own webhook executions"
  ON webhook_executions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own webhook executions
CREATE POLICY "Users can delete own webhook executions"
  ON webhook_executions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_webhook_executions_updated_at ON webhook_executions;
CREATE TRIGGER update_webhook_executions_updated_at
  BEFORE UPDATE ON webhook_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE webhook_executions IS 'Stores webhook execution records for flow processing';
COMMENT ON COLUMN webhook_executions.request_data IS 'Contains body, query, headers, and method from the webhook request';
COMMENT ON COLUMN webhook_executions.status IS 'Execution status: pending (just received), processing (being executed), completed (finished), failed (error occurred)';
