/*
  # Add message_sent column to webhook_logs
  
  1. Changes
    - Add `message_sent` column to `webhook_logs` table to store the message sent to the user
  
  2. Purpose
    - Track both incoming messages (message_body) and outgoing messages (message_sent)
    - Enable better debugging and conversation flow tracking
*/

-- Add message_sent column to webhook_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'webhook_logs' AND column_name = 'message_sent'
  ) THEN
    ALTER TABLE webhook_logs ADD COLUMN message_sent text;
  END IF;
END $$;