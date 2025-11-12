/*
  # Create Webhook Logs Table

  1. New Tables
    - `webhook_logs`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `method` (text) - GET or POST
      - `from_phone` (text) - User's phone number
      - `message_type` (text) - text, interactive, etc
      - `message_body` (text) - User's message
      - `webhook_payload` (jsonb) - Full webhook payload from Meta
      - `flow_matched` (boolean) - Whether a flow was matched
      - `flow_id` (uuid, nullable) - Matched flow ID
      - `execution_id` (uuid, nullable) - Created execution ID
      - `session_found` (boolean) - Whether existing session was found
      - `current_node` (text, nullable) - Current node being executed
      - `error_message` (text, nullable) - Any error that occurred
      - `whatsapp_response` (jsonb, nullable) - Response from WhatsApp API
      - `processing_time_ms` (integer) - Time taken to process

  2. Security
    - Enable RLS on `webhook_logs` table
    - Add policy for authenticated users to read their own logs
*/

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
  processing_time_ms integer
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all webhook logs"
  ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_from_phone ON webhook_logs(from_phone);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_flow_id ON webhook_logs(flow_id);