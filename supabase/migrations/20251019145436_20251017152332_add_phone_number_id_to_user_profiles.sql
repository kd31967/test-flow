/*
  # Add phone_number_id to user_profiles

  1. Changes
    - Add `phone_number_id` column to user_profiles table if it doesn't exist
    - This stores the WhatsApp Phone Number ID for each user
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone_number_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone_number_id text;
  END IF;
END $$;