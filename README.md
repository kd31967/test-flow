# WhatsApp Flow Builder

A complete visual flow builder for WhatsApp Business automation. Create conversational workflows with a drag-and-drop interface, no coding required.

![Status](https://img.shields.io/badge/status-production--ready-green)
![Auth](https://img.shields.io/badge/auth-enabled-blue)
![Database](https://img.shields.io/badge/database-supabase-orange)
![Platform](https://img.shields.io/badge/platform-whatsapp-brightgreen)

## ✨ Features

### Multi-Flow Management
- ✅ Create unlimited flows
- ✅ Draft and Active status for each flow
- ✅ Multiple active flows simultaneously
- ✅ Duplicate, export, and delete flows
- ✅ Custom trigger keywords per flow

### Visual Flow Builder
- ✅ 18+ node types
- ✅ Drag-and-drop interface
- ✅ Real-time configuration
- ✅ Variable substitution system
- ✅ All WhatsApp message types supported

### Authentication & Security
- ✅ User sign up and sign in
- ✅ Secure credential storage
- ✅ Row Level Security (RLS)
- ✅ Per-user flow isolation

### WhatsApp Integration
- ✅ Cloud API webhook handler
- ✅ Session management
- ✅ Variable system ({{USER_NAME}}, etc.)
- ✅ Support for text, media, buttons, lists
- ✅ Automatic flow execution

## 🚀 Quick Start

### 1. Sign Up
```
1. Open the application
2. Click "Sign Up"
3. Enter email and password
4. Sign in with your credentials
```

### 2. Configure WhatsApp
```
1. Click Settings (top right)
2. Enter Phone Number ID (from Meta)
3. Enter Access Token (from Meta)
4. Save settings
```

### 3. Create Your First Flow
```
1. Click "Create New Flow"
2. Add "On Message" trigger node
3. Set keywords: hello, hi, start
4. Add "Send Message" node
5. Write your greeting message
6. Connect nodes
7. Toggle to Active
8. Save
```

### 4. Test
```
1. Send "hello" to your WhatsApp Business number
2. Receive automated reply
3. Success! 🎉
```

**📖 See [QUICK_START.md](./QUICK_START.md) for detailed step-by-step guide**

## 📚 Documentation

| File | Description |
|------|-------------|
| [QUICK_START.md](./QUICK_START.md) | Complete setup guide with examples |
| [FLOW_EXAMPLES.md](./FLOW_EXAMPLES.md) | Flow patterns and best practices |
| [WEBHOOK_SETUP.md](./WEBHOOK_SETUP.md) | Technical documentation |

## 🎯 Use Cases

### Customer Support
- Auto-respond to common questions
- Route inquiries to departments
- Collect customer feedback

### Lead Generation
- Capture contact information
- Qualify leads with questions
- Send product information

### Notifications
- Order confirmations
- Appointment reminders
- Status updates

### E-commerce
- Product catalogs
- Order placement
- Payment confirmation

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth
- **API:** WhatsApp Cloud API

## 🏗️ Architecture

```
┌─────────────────┐
│   User (Web)    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  React   │
    │   App    │
    └────┬─────┘
         │
    ┌────▼──────────┐
    │   Supabase    │
    │   Database    │
    ├───────────────┤
    │ • flows       │
    │ • profiles    │
    │ • executions  │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │ Edge Function │
    │   (Webhook)   │
    └────┬──────────┘
         │
    ┌────▼──────────┐
    │   WhatsApp    │
    │   Cloud API   │
    └───────────────┘
```

## 📦 Database Schema

### flows
Stores all flow configurations
```sql
- id (uuid)
- user_id (uuid)
- name (text)
- description (text)
- status ('draft' | 'active')
- config (jsonb)
- trigger_keywords (text[])
- created_at (timestamp)
```

### user_profiles
User settings and credentials
```sql
- id (uuid)
- whatsapp_app_id (text)
- whatsapp_access_token (text)
- settings (jsonb)
```

### flow_executions
Active conversation sessions
```sql
- id (uuid)
- flow_id (uuid)
- user_phone (text)
- current_node (text)
- variables (jsonb)
- status ('running' | 'completed')
```

## 🎨 Node Types

### Triggers
- **On Message** - Start flow on keyword match
- **Catch Webhook** - Trigger from external API

### Messages
- **Send Message** - Plain text messages
- **Send Media** - Images, videos, audio, documents
- **Send Button** - Interactive reply buttons
- **Send List** - Dropdown selection list
- **Send Template** - WhatsApp templates

### Questions
- **Ask Question** - Capture user input
- **Wait for Reply** - Pause until response

### Logic
- **Condition** - Branch based on variables
- **Delay** - Wait before continuing
- **Stop Chatbot** - End conversation

### Integrations
- **HTTP** - Call external APIs
- **Google Sheets** - Save to spreadsheet
- **AI Agent** - OpenAI integration (coming soon)

## 🔐 Security

- ✅ User authentication required
- ✅ Row Level Security (RLS) on all tables
- ✅ Credentials encrypted in database
- ✅ API tokens never exposed to client
- ✅ CORS properly configured
- ✅ Service role for Edge Functions

## 🧪 Testing

### Unit Testing
```bash
npm run test
```

### Flow Testing
1. Create a test flow with keyword "test"
2. Toggle to Active and Save
3. Send "test" to WhatsApp number
4. Check Edge Function logs
5. Verify response received

### Debug Tools
- Edge Function logs in Supabase Dashboard
- `flow_executions` table for session state
- Database queries for flow configuration
- WhatsApp webhook logs in Meta portal

## 📊 Monitoring

### Check Active Sessions
```sql
SELECT * FROM flow_executions
WHERE status = 'running'
ORDER BY started_at DESC;
```

### View Flow Analytics
```sql
SELECT
  f.name,
  COUNT(fe.id) as total_executions,
  COUNT(CASE WHEN fe.status = 'completed' THEN 1 END) as completed
FROM flows f
LEFT JOIN flow_executions fe ON f.id = fe.flow_id
GROUP BY f.name;
```

### Edge Function Logs
```
Supabase Dashboard → Edge Functions → whatsapp-webhook → Logs
```

## 🐛 Troubleshooting

### Flow Not Triggering
- Verify flow is Active (not Draft)
- Check trigger keywords match exactly
- Confirm webhook configured in Meta
- Verify credentials in Settings

### Authentication Issues
- Clear browser cache
- Check Supabase Auth is enabled
- Verify RLS policies are correct

### Messages Not Sending
- Validate Phone Number ID
- Check Access Token expiry
- Review Edge Function logs
- Verify WhatsApp Business number active

## 🤝 Contributing

This is a complete production-ready system. To extend:

1. Add new node types in `src/types/flow.ts`
2. Implement handlers in Edge Function
3. Create configuration UI in `NodeConfig.tsx`
4. Update database schema if needed

## 📝 License

MIT License - feel free to use for commercial projects

## 🌟 Features Coming Soon

- [ ] AI-powered responses with OpenAI
- [ ] Advanced analytics dashboard
- [ ] Flow templates library
- [ ] A/B testing for flows
- [ ] Team collaboration
- [ ] Custom webhook integrations
- [ ] Multi-language support

## 💬 Support

- Check [QUICK_START.md](./QUICK_START.md) for setup help
- Review [FLOW_EXAMPLES.md](./FLOW_EXAMPLES.md) for patterns
- Monitor Edge Function logs for debugging
- Check `flow_executions` table for session state

## 🎉 Success Stories

Use this system to:
- ✅ Automate customer support 24/7
- ✅ Generate and qualify leads
- ✅ Send order confirmations
- ✅ Collect customer feedback
- ✅ Build interactive product catalogs
- ✅ Schedule appointments
- ✅ Send notifications and reminders

---

**Built with ❤️ using React, TypeScript, Supabase, and WhatsApp Cloud API**

Start building your WhatsApp automation today! 🚀
