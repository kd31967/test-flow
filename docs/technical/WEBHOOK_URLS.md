# WhatsApp Flow Builder - Webhook URLs & Meta Configuration

## Application URLs

Your WhatsApp Flow Builder is now running on Replit! Here are the important URLs:

### Main Application
- **Frontend**: `https://<your-repl-name>.<your-username>.repl.co`
- Replace with your actual Replit URL

### Webhook Endpoints

#### 1. WhatsApp Business API Webhook
**URL**: `https://<your-repl-name>.<your-username>.repl.co/api/whatsapp-webhook`

**Method**: POST

**Purpose**: Receives incoming WhatsApp messages and triggers flows based on keywords

**Verification Token**: `test-verify-token` (or set your own in `process.env.WHATSAPP_VERIFY_TOKEN`)

#### 2. Custom Webhook (for flow nodes)
**URL Pattern**: `https://<your-repl-name>.<your-username>.repl.co/api/custom-webhook/:flowIdentifier/:nodeId`

**Examples**:
- By Flow ID: `/api/custom-webhook/550e8400-e29b-41d4-a716-446655440000/node_12345`
- By Flow Name: `/api/custom-webhook/my-flow-name/node_12345`

**Methods**: GET, POST, PUT, DELETE

**Purpose**: Catches webhook calls from external services within your flows

---

## Meta (Facebook) WhatsApp Business API Configuration

### Step 1: Set Up WhatsApp Business App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select existing app
3. Add "WhatsApp" product to your app
4. Get your Phone Number ID from the WhatsApp Business Account

### Step 2: Configure Webhook in Meta Dashboard

1. Navigate to **WhatsApp > Configuration** in your Meta app dashboard
2. Click **"Edit"** next to Webhook
3. Enter Callback URL: `https://<your-repl-url>.repl.co/api/whatsapp-webhook`
4. Enter Verify Token: `test-verify-token`
5. Click **"Verify and Save"**

### Step 3: Subscribe to Webhook Fields

Subscribe to these webhook fields:
- ✅ `messages` - Receive incoming messages
- ✅ `message_status` - Track message delivery status
- ✅ `message_template_status_update` - Template approval status

### Step 4: Get Access Token

1. Go to **WhatsApp > Getting Started**
2. Generate a permanent access token (not the temporary one)
3. Copy the access token and Phone Number ID

### Step 5: Configure in Your App

1. Click **Settings** (⚙️) in your WhatsApp Flow Builder
2. Enter:
   - **Phone Number ID**: Your WhatsApp Phone Number ID from Meta
   - **WhatsApp Access Token**: Your permanent access token
3. Click **Save Settings**

---

## Testing Webhooks

### Test WhatsApp Webhook
```bash
curl -X POST https://<your-repl-url>.repl.co/api/whatsapp-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "1234567890",
            "type": "text",
            "text": { "body": "hello" }
          }]
        }
      }]
    }]
  }'
```

### Test Custom Webhook
```bash
curl -X POST https://<your-repl-url>.repl.co/api/custom-webhook/my-flow/webhook-node-1 \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## Available API Endpoints

- `GET /api/flows` - List all flows
- `POST /api/flows` - Create new flow
- `GET /api/flows/:id` - Get specific flow
- `PATCH /api/flows/:id` - Update flow
- `DELETE /api/flows/:id` - Delete flow
- `GET /api/flows/:id/executions` - Get flow executions
- `GET /api/flows/:id/analytics` - Get flow analytics
- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update user profile
- `POST /api/ai-completion` - AI completion requests
- `POST /api/send-email` - Send emails
- `POST /api/database-query` - Database queries
- `POST /api/test-http-api` - Test HTTP APIs
- `GET /api/webhook-logs` - Get webhook logs

---

## Environment Variables

Create a `.env` file or use Replit Secrets:

```bash
# WhatsApp Configuration (set in app Settings UI)
WHATSAPP_VERIFY_TOKEN=test-verify-token

# Optional: AI Providers (for AI completion nodes)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database (automatically set by Replit)
DATABASE_URL=postgresql://...
```

---

## Next Steps

1. ✅ Configure webhook URL in Meta Dashboard
2. ✅ Add WhatsApp credentials in app Settings
3. ✅ Create your first flow with trigger keywords
4. ✅ Set flow status to "Active"
5. ✅ Test by sending a message to your WhatsApp Business number!

---

## Support & Documentation

- Meta WhatsApp Business API: https://developers.facebook.com/docs/whatsapp
- Webhooks Guide: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
- Message Templates: https://developers.facebook.com/docs/whatsapp/message-templates
