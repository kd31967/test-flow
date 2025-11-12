# WhatsApp Flow Builder AI

A visual no-code platform for building WhatsApp automation flows with AI integration, custom webhooks, and real-time flow execution.

## 🚀 Features

- **Visual Flow Builder** - Drag-and-drop interface for building automation flows
- **WhatsApp Integration** - Send messages, buttons, media, and interactive content
- **Custom Webhooks** - Capture external data and trigger flows
- **AI Completion** - Integrate AI-powered responses
- **Variable System** - Dynamic content with variable substitution
- **Real-time Execution** - Process messages and execute flows instantly
- **Database Storage** - All data persists in Supabase

## 📁 Project Structure

```
whatsapp-flow-builder/
├── client/                      # Frontend React Application
│   └── src/
│       ├── components/          # React Components
│       │   ├── Canvas.tsx              # Flow canvas for node placement
│       │   ├── ConfigPanel.tsx         # Node configuration panel
│       │   ├── FlowList.tsx            # List and manage flows
│       │   ├── NewFlowBuilder.tsx      # Main flow builder component
│       │   ├── NodePalette.tsx         # Available node types
│       │   ├── Settings.tsx            # WhatsApp credentials
│       │   ├── Sidebar.tsx             # Navigation sidebar
│       │   └── [NodeConfigs]/          # Configuration components for each node type
│       ├── lib/                 # Utility Libraries
│       │   ├── api.ts                  # Supabase client
│       │   ├── flowExecutor.ts         # Client-side flow execution
│       │   ├── setupSystem.ts          # System initialization
│       │   └── variableSystem.ts       # Variable management
│       ├── types/               # TypeScript Type Definitions
│       └── App.tsx              # Main application component
│
├── supabase/                    # Supabase Configuration
│   ├── functions/               # Edge Functions (Server-side)
│   │   ├── whatsapp-webhook/          # WhatsApp message webhook
│   │   └── custom-webhook/            # Custom HTTP webhook handler
│   └── migrations/              # Database Migrations
│       └── *.sql                      # SQL migration files
│
├── shared/                      # Shared Code
│   └── schema.ts                # Database schema & types (Drizzle ORM)
│
└── [Config Files]               # Configuration
    ├── package.json             # Dependencies
    ├── vite.config.ts           # Vite bundler config
    ├── tailwind.config.js       # Tailwind CSS config
    └── tsconfig.json            # TypeScript config
```

## 🗄️ Database Schema

All data is stored in Supabase PostgreSQL database:

### Core Tables

#### `flows`
Stores flow configurations and metadata
- `id` (uuid) - Primary key
- `user_id` (text) - Owner identifier
- `name` (text) - Flow name
- `description` (text) - Flow description
- `status` (text) - draft | active | paused | archived
- `trigger_keywords` (jsonb) - Keywords that trigger the flow
- `config` (jsonb) - Complete flow configuration (nodes, connections)
- `category` (text) - Flow category
- `metadata` (jsonb) - Additional metadata
- `created_at`, `updated_at` (timestamptz) - Timestamps

#### `flow_nodes`
Individual node definitions (if needed for advanced queries)
- `id` (uuid) - Primary key
- `flow_id` (uuid) - References flows
- `node_id` (text) - Node identifier
- `node_type` (text) - Type of node
- `config` (jsonb) - Node configuration
- `position` (jsonb) - Canvas position {x, y}

#### `flow_executions`
Active and completed flow sessions
- `id` (uuid) - Primary key
- `flow_id` (uuid) - References flows
- `user_phone` (text) - WhatsApp phone number
- `status` (text) - running | completed | failed | timeout
- `current_node` (text) - Current execution position
- `variables` (jsonb) - Runtime variables
- `started_at`, `completed_at` (timestamptz) - Execution timestamps

#### `webhook_logs`
Logs all webhook activity for debugging
- `id` (uuid) - Primary key
- `method` (text) - HTTP method
- `from_phone` (text) - Sender phone (WhatsApp)
- `message_type` (text) - Message type
- `message_body` (text) - Message content
- `webhook_payload` (jsonb) - Complete webhook data
- `flow_matched` (boolean) - Whether a flow was matched
- `flow_id` (uuid) - Matched flow
- `execution_id` (uuid) - Flow execution
- `whatsapp_response` (jsonb) - Response from WhatsApp API
- `error_message` (text) - Any errors
- `processing_time_ms` (integer) - Processing duration
- `created_at` (timestamptz) - Log timestamp

#### `webhook_executions`
Custom webhook trigger data
- `id` (uuid) - Primary key
- `flow_id` (uuid) - References flows
- `node_id` (text) - Webhook node
- `request_data` (jsonb) - Captured request data
- `status` (text) - pending | processing | completed | failed
- `result` (jsonb) - Execution result
- `error` (text) - Error message if failed
- `created_at`, `updated_at` (timestamptz) - Timestamps

#### `user_profiles`
User settings and WhatsApp credentials
- `id` (text) - Primary key (user identifier)
- `phone_number_id` (text) - WhatsApp Phone Number ID
- `whatsapp_access_token` (text) - WhatsApp Access Token
- `business_name` (text) - Business name
- `whatsapp_business_id` (text) - Business Account ID
- `whatsapp_app_id` (text) - App ID
- `subscription_tier` (text) - free | pro | enterprise
- `settings` (jsonb) - User preferences
- `created_at` (timestamptz) - Account creation

### Additional Tables

- `flow_analytics` - Flow metrics and analytics
- `templates` - Pre-built flow templates

## 🔧 Edge Functions (Server-side)

### `whatsapp-webhook`
**Purpose:** Receives and processes WhatsApp messages

**Location:** `supabase/functions/whatsapp-webhook/index.ts`

**Endpoint:** `https://your-project.supabase.co/functions/v1/whatsapp-webhook`

**Responsibilities:**
- Receives WhatsApp webhook events (GET for verification, POST for messages)
- Matches incoming messages to active flows using trigger keywords
- Creates or continues flow executions
- Executes flow nodes (send message, buttons, media, etc.)
- Manages session state and variables
- Logs all activity to webhook_logs table

**Key Functions:**
- `matchFlowTrigger()` - Matches message to flow
- `startNewFlow()` - Initializes new flow execution
- `continueFlow()` - Resumes existing flow
- `executeNode()` - Processes individual nodes
- `sendWhatsAppMessage()` - Sends text messages
- `sendWhatsAppMedia()` - Sends images/videos/documents
- `sendWhatsAppInteractive()` - Sends buttons/lists

### `custom-webhook`
**Purpose:** Captures external HTTP requests and triggers flows

**Location:** `supabase/functions/custom-webhook/index.ts`

**Endpoint:** `https://your-project.supabase.co/functions/v1/custom-webhook/:flow_id/:node_id`

**Responsibilities:**
- Accepts HTTP requests (GET, POST, PUT, DELETE)
- Validates flow and node existence
- Captures all request data (body, query params, headers)
- Generates webhook variables for use in flows
- Creates webhook execution records
- Logs webhook calls

**Captured Data:**
- `webhook.method` - HTTP method
- `webhook.body.{field}` - Request body fields
- `webhook.query.{param}` - Query parameters
- `webhook.header.{name}` - Request headers

### Other Edge Functions

- `ai-completion` - AI-powered text generation
- `database-query` - Database operations
- `send-email` - Email notifications
- `test-http-api` - HTTP API testing

## 🎨 UI Components

### Core Components

#### `NewFlowBuilder` (`client/src/components/NewFlowBuilder.tsx`)
Main flow builder interface
- Manages flow state (nodes, connections)
- Handles save/load operations
- Coordinates Canvas, Sidebar, and ConfigPanel

#### `Canvas` (`client/src/components/Canvas.tsx`)
Visual canvas for placing and connecting nodes
- Drag-and-drop node placement
- Visual connection lines between nodes
- Pan and zoom functionality
- Connection creation and deletion

#### `Sidebar` (`client/src/components/Sidebar.tsx`)
Node palette and available node types
- Triggers: On Message, Catch Raw Webhook
- Actions: Send Message, Send Button, Send Media
- Logic: Wait for Reply, Transform Data
- Integration: HTTP API, Database Query, AI Completion

#### `ConfigPanel` (`client/src/components/ConfigPanel.tsx`)
Node configuration interface
- Dynamically loads configuration component based on node type
- Provides variable autocomplete
- Validates configuration before saving

#### `Settings` (`client/src/components/Settings.tsx`)
WhatsApp credentials management
- Phone Number ID input
- Access Token input (password field)
- Saves to user_profiles table

#### `FlowList` (`client/src/components/FlowList.tsx`)
Flow management interface
- Lists all saved flows
- Create new flow
- Edit existing flow
- Delete flow
- Import/Export flows

### Node Configuration Components

Each node type has its own configuration component:

- `SendButtonConfig` - Interactive buttons with headers
- `WebhookConfig` - Custom webhook settings
- `HttpApiConfig` - HTTP request configuration
- `AICompletionConfig` - AI prompt configuration
- `DatabaseQueryConfig` - Database query builder
- `EmailConfig` - Email configuration
- `GoogleSheetsConfig` - Sheets integration
- `TransformConfig` - Data transformation

### Utility Components

- `VariableAutocomplete` - Suggests available variables
- `VariableInput` - Text input with variable support
- `NodeConfig` - Generic node configuration wrapper

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Database URL (optional - for direct access if needed)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Update `.env` file with your Supabase credentials.

### 3. Database is Already Set Up

The database tables are already created. All 8 tables exist in Supabase:
- flows
- flow_nodes
- flow_executions
- flow_analytics
- user_profiles
- templates
- webhook_logs
- webhook_executions

### 4. Configure WhatsApp Business API

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a Business App with WhatsApp product
3. Get your Phone Number ID and Access Token
4. In the app, go to Settings and save these credentials

### 5. Set Webhook URL in WhatsApp

Configure the webhook URL in Meta Business Suite:
```
https://your-project.supabase.co/functions/v1/whatsapp-webhook
```

Verify Token: `my-verify-token` (or change in edge function)

### 6. Run Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:5000`

### 7. Build for Production

```bash
npm run build
```

## 📖 Usage Guide

### Creating a Flow

1. Click "New Flow" button
2. Enter flow name and description
3. Add trigger keywords (words that start the flow)
4. Drag nodes from sidebar to canvas
5. Connect nodes by clicking dots and dragging
6. Configure each node by clicking on it
7. Click "Save" to save to database

### Available Nodes

**Triggers:**
- **On Message** - Triggers when keywords match
- **Catch Raw Webhook** - Triggers from HTTP request

**Actions:**
- **Send Message** - Send text message
- **Send Button** - Send interactive buttons
- **Send Media** - Send image/video/document
- **Wait for Reply** - Pause and wait for user input
- **HTTP API** - Call external APIs
- **Database Query** - Query database
- **AI Completion** - Generate AI responses
- **Email** - Send emails
- **Transform Data** - Process data

### Using Variables

Variables can be used in any text field with `{{VARIABLE_NAME}}` syntax:

**System Variables:**
- `{{USER_PHONE}}` - User's phone number
- `{{USER_NAME}}` - User's name
- `{{TRIGGER_MESSAGE}}` - Initial message
- `{{LAST_USER_MESSAGE}}` - Latest response

**Custom Variables:**
- Save user input with "Wait for Reply" node
- Capture webhook data: `{{webhook.body.fieldname}}`
- Use HTTP response: `{{api.response.data}}`

### Testing Flows

**WhatsApp Flow:**
1. Save your flow with trigger keywords
2. Set flow status to "Active"
3. Send message to your WhatsApp number with trigger word
4. Flow will execute automatically

**Custom Webhook Flow:**
1. Add "Catch Raw Webhook" node to flow
2. Save the flow (note the flow ID)
3. Send HTTP request to:
   ```
   POST https://your-project.supabase.co/functions/v1/custom-webhook/FLOW_ID/NODE_ID
   ```
4. Flow will execute with captured data

### Debugging

Check the `webhook_logs` table in Supabase to see:
- All incoming messages
- Matched flows
- Execution status
- WhatsApp API responses
- Errors and processing time

## 🔒 Security Notes

- Access tokens are stored in database
- Row Level Security (RLS) is enabled on all tables
- Currently set to "allow all" for demo mode
- For production, implement proper authentication and restrict RLS policies

## 🚨 Troubleshooting

**Flow not saving:**
- Check browser console for errors
- Verify Supabase connection
- Ensure all required fields are filled

**WhatsApp messages not working:**
- Verify webhook URL is configured in Meta Business Suite
- Check Phone Number ID and Access Token in Settings
- Review webhook_logs table for errors
- Ensure flow status is "Active"
- Check trigger keywords match exactly

**Custom webhook not triggering:**
- Verify flow ID and node ID in URL
- Check webhook node exists in saved flow
- Review webhook_executions table
- Ensure flow is saved

## 📝 Development

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (bundler)
- Tailwind CSS
- TanStack Query (data fetching)
- Lucide React (icons)

**Backend:**
- Supabase (database + edge functions)
- PostgreSQL (database)
- Drizzle ORM (schema management)

**WhatsApp:**
- WhatsApp Business API
- Meta Graph API v21.0

### Code Organization

- `client/src/` - All frontend React code
- `supabase/functions/` - Edge functions (server-side)
- `supabase/migrations/` - Database migrations
- `shared/` - Shared TypeScript types and schema

### Adding a New Node Type

1. Add node type to `Sidebar.tsx`
2. Create config component in `client/src/components/`
3. Add case to `ConfigPanel.tsx`
4. Implement execution in `supabase/functions/whatsapp-webhook/index.ts`

## 📄 License

MIT License - Feel free to use for any purpose

## 🤝 Support

For issues or questions, check:
- `webhook_logs` table for webhook debugging
- Browser console for frontend errors
- Supabase logs for edge function errors

---

Built with ❤️ using React, TypeScript, and Supabase
