# WhatsApp Flow Builder - Webhook Setup Guide

## Overview

This WhatsApp Flow Builder is a complete automation system that allows you to create visual flows for WhatsApp Business messaging. The system consists of:

1. **Frontend UI** - Visual flow builder with drag-and-drop interface
2. **Supabase Database** - Stores flows, user settings, and session data
3. **Edge Function** - Handles WhatsApp webhooks and executes flows

## Features

### Multi-Flow Management
- Create unlimited flows
- Draft and Active status for each flow
- Duplicate, export, and delete flows
- Trigger flows with custom keywords

### Visual Flow Builder
- 18+ node types including:
  - Triggers: On Message, Catch Webhook
  - Messages: Text, Media (Image/Video/Audio/Document), Buttons, Lists
  - Logic: Conditions, Delays, AI Agents
  - Integrations: HTTP, Google Sheets, Webhooks
  - Actions: Ask Questions, Stop Chatbot

### Session Management
- Persistent sessions in database
- Variable substitution ({{USER_NAME}}, {{USER_PHONE}}, etc.)
- Multi-step conversation flows
- Automatic session cleanup

## Setup Instructions

### 1. Configure WhatsApp Business API

1. Go to [Meta Developer Portal](https://developers.facebook.com/apps)
2. Create or select your WhatsApp Business App
3. Navigate to **WhatsApp > API Setup**
4. Copy your **Phone Number ID**
5. Generate a **Permanent Access Token**

### 2. Configure Application Settings

1. Click **Settings** button in the application
2. Enter your **Phone Number ID**
3. Enter your **WhatsApp Access Token**
4. Click **Save Settings**

### 3. Configure Webhook in Meta Developer Portal

1. In your Meta app, go to **WhatsApp > Configuration**
2. Click **Edit** next to Webhook
3. Enter your webhook URL:
   ```
   YOUR_SUPABASE_URL/functions/v1/whatsapp-webhook
   ```
   Example: `https://abc123.supabase.co/functions/v1/whatsapp-webhook`

4. Enter verify token: `my-verify-token`
5. Click **Verify and Save**
6. Subscribe to webhook fields:
   - ☑ messages
   - ☑ message_echoes (optional)

### 4. Create Your First Flow

1. Click **Create New Flow**
2. Add an **On Message** trigger node
3. Configure trigger keywords (e.g., "hello", "start")
4. Add action nodes:
   - **Send Message** - Reply with text
   - **Ask Question** - Capture user input
   - **Send Media** - Send images, videos, audio
   - **Condition** - Branch based on responses
5. Connect nodes by configuring the `next` field
6. Toggle flow to **Active**
7. Click **Save**

## Flow Configuration

### Node Types

#### 1. On Message (Trigger)
- **Trigger Keywords**: Comma-separated keywords to start flow
- **Save As**: Variable name to store user message
- Example: `hello, hi, start`

#### 2. Send Message
- **Message**: Text to send (supports {{variables}})
- **Next**: Next node to execute
- Example: `Hello {{USER_NAME}}! Welcome to our service.`

#### 3. Ask Question
- **Message**: Question to ask user
- **Response Format**: Text, Number, Email, etc.
- **Timeout**: How long to wait for response
- **Save As**: Variable to store answer

#### 4. Send Media
- **Media Type**: Image, Video, Audio, Document
- **Media URL**: URL to media file
- **Caption**: Optional caption
- **Next**: Auto-advance to next node

#### 5. Condition
- **Condition**: Check variable value
- **True Path**: Node to execute if true
- **False Path**: Node to execute if false

#### 6. Stop Chatbot
- **Final Message**: Optional goodbye message
- Ends the conversation and clears session

### Variable Substitution

Use `{{VARIABLE_NAME}}` in any message field:

- `{{USER_NAME}}` - User's WhatsApp name
- `{{USER_PHONE}}` - User's phone number
- `{{ANSWER}}` - Answer from "Ask Question" node
- Custom variables from your flow

Example:
```
Thank you {{USER_NAME}}!
Your email {{EMAIL}} has been saved.
```

## Database Schema

### Tables

#### flows
- Stores all flow configurations
- Columns: id, user_id, name, description, status, config, trigger_keywords

#### user_profiles
- Stores WhatsApp API credentials per user
- Columns: id, whatsapp_app_id, whatsapp_access_token

#### flow_executions
- Tracks active sessions
- Columns: id, flow_id, user_phone, current_node, variables, status

## Edge Function Details

### Endpoint
```
POST /functions/v1/whatsapp-webhook
GET  /functions/v1/whatsapp-webhook (verification)
```

### Flow Execution Logic

1. **Incoming Message** arrives from WhatsApp
2. **Check Session**: Does user have active session?
   - No → Match trigger keyword → Start new flow
   - Yes → Continue from current node
3. **Execute Node**: Process current node type
4. **Save Response**: Store user input in variables
5. **Advance**: Move to next node or end session

### Supported Message Types

- Text messages
- Interactive buttons
- Interactive lists
- Media (images, videos, audio, documents)
- Location (coming soon)

## Testing Your Flow

### 1. Activate Flow
- Toggle flow status to **Active**
- Save the flow

### 2. Send Trigger Message
- Open WhatsApp
- Send a message to your WhatsApp Business number
- Type one of your trigger keywords

### 3. Interact with Flow
- Bot will respond based on your flow configuration
- Answer questions when prompted
- Session persists across messages

### 4. Monitor Logs
- Check Supabase Edge Function logs for debugging
- View `flow_executions` table for session data

## Advanced Features

### Multiple Active Flows
- Have multiple flows active simultaneously
- Each flow triggered by different keywords
- No conflicts - first matching keyword wins

### Session Management
- Sessions stored in database
- Survive server restarts
- Automatic cleanup on flow completion

### Variable System
- Built-in variables: USER_NAME, USER_PHONE
- Custom variables from Ask Question nodes
- Use in any message with {{VARIABLE}}

### Webhook Integration
- **Catch Raw Webhook** node receives external data
- Map webhook fields to flow variables
- Trigger flows from external systems

## Troubleshooting

### Flow Not Triggering
1. Check flow is **Active** (not Draft)
2. Verify trigger keyword matches exactly
3. Check webhook is configured in Meta portal
4. Verify WhatsApp credentials in Settings

### Messages Not Sending
1. Check Phone Number ID is correct
2. Verify Access Token is valid and not expired
3. Check Edge Function logs for errors
4. Ensure phone number is registered with WhatsApp Business

### Session Issues
1. Check `flow_executions` table for stuck sessions
2. Clear old sessions manually if needed
3. Verify node connections in flow

## API Reference

### WhatsApp Cloud API
- [Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Message Types](https://developers.facebook.com/docs/whatsapp/cloud-api/messages)
- [Webhooks](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)

### Supabase
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Database](https://supabase.com/docs/guides/database)
- [Authentication](https://supabase.com/docs/guides/auth)

## Security

- All credentials stored in Supabase with RLS
- Edge Function runs with service role for database access
- WhatsApp tokens never exposed to client
- CORS enabled for webhook calls

## Support

For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Review `flow_executions` table for session state
3. Test with simple flows first
4. Verify all credentials are correct

---

**Built with**: React, TypeScript, Supabase, WhatsApp Cloud API
