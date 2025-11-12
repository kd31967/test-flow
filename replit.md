# WhatsApp Flow Builder - Multi-Tenant SaaS Platform

## Overview
A powerful multi-tenant SaaS platform enabling users to create, manage, and execute conversational flows via the WhatsApp Business API. It features a visual flow builder, extensive node types (messages, buttons, lists, templates, location, webhooks, AI), execution tracking, and analytics. The platform's core purpose is to streamline WhatsApp-based customer interactions through automated, customizable conversational flows.

## User Preferences
- Multi-tenant SaaS architecture
- WhatsApp Business API integration
- Visual flow builder with drag-and-drop
- Support for various node types (messages, webhooks, AI, email, etc.)
- Analytics and execution tracking

## System Architecture

### Technology Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Wouter, React Query, Radix UI, Lucide Icons
- **Backend**: Express.js, TypeScript
- **Database**: PostgreSQL via Drizzle ORM (fully operational with all 8 tables)

### Key Features
- **Visual Flow Builder**: Drag-and-drop canvas for creating conversational flows.
- **Node Types**:
    - **Messaging**: Send Message, Send Media, Send Button, Send List, Send Template, Send Location, Send CTA, Request Location, Wait for Reply, Delay.
    - **Triggers**: On Message (keyword-based), Catch Webhook.
    - **Integrations**: Webhook, HTTP Request, AI Completion (OpenAI/Anthropic), Email (SendGrid/SMTP), Database Query, Google Sheets.
- **Execution State Management**: Interactive nodes (send_button, send_list, send_flow) automatically pause execution and wait for user responses before continuing. Paused states are stored in memory with resume capability.
- **Multi-Tenant Support**: Isolated user profiles, per-user WhatsApp API credentials, custom webhook endpoints per flow.
- **Analytics & Tracking**: Flow execution history, webhook logs, success/failure metrics, user engagement.
- **WhatsApp Integration**: Keyword triggers, automated messages (text, media, buttons, lists, templates, locations), interactive elements, message status tracking, dynamic variables, media/text/location capture, button/list response capture.
- **Dynamic Variable System**: Automatic variable creation for incoming messages (text, media, location, button/list responses) and node outputs, allowing for chained data and conditional logic within flows. Captured responses automatically stored as `{{node_id.field_name}}`.

### Database Schema (8 Tables)
- `flows`: Main flow definitions.
- `flow_nodes`: Individual nodes within flows.
- `flow_executions`: Execution history.
- `flow_analytics`: Analytics and metrics.
- `user_profiles`: User settings and WhatsApp API credentials.
- `templates`: Reusable flow templates.
- `webhook_logs`: Webhook request logging.
- `webhook_executions`: Webhook execution history.

### API Routes
The Express API serves as the backend, handling flow management, user profiles, WhatsApp integration, custom webhooks, and external integrations. All routes previously handled by Supabase Edge Functions have been migrated. An API compatibility layer on the client side ensures seamless integration with the existing React components.

### Flow Execution System
- **Pause/Resume Mechanism**: Interactive nodes (send_button, send_list, send_flow) pause execution after sending and wait for user interaction.
- **State Storage**: In-memory Map stores paused executions with key `${userPhone}_${flowId}`, including flow state, variables, and expected response type.
- **Variable Capture**: User responses automatically captured and stored in `context.variables[node_id]` for access in downstream nodes.
- **Delay Node**: Supports time-based delays (seconds, minutes, hours) to add natural pauses between messages.
- **Implemented Nodes**:
  - ✅ send_button - Pauses after sending, captures button clicks
  - ✅ send_list - Pauses after sending, captures list selections
  - ✅ send_flow - Pauses after sending, captures form submissions
  - ✅ send_cta - Sends CTA URL button (continues immediately)
  - ✅ send_location - Sends location pin (continues immediately)
  - ✅ delay - Waits for specified duration before continuing

### Dynamic Flow Response Variables (NEW)
- **Automatic Field Capture**: When a user submits a WhatsApp Flow form, ALL fields are dynamically extracted without hardcoding
- **Variable Syntax**: Use `{{node_id.field_name}}` to access any field from a flow response
- **Example**: If a flow captures `task_name`, `due_date`, `assign_to`, access them as:
  - `{{node_1761158613020.task_name}}`
  - `{{node_1761158613020.due_date}}`
  - `{{node_1761158613020.assign_to}}`
- **Works for All Flow Fields**: No matter what fields your WhatsApp Flow has, they're all automatically captured and available
- **Resume Execution**: When user submits flow, execution automatically resumes with all variables populated

### Documentation
- **VARIABLE_GUIDE.md**: Comprehensive guide for dynamic variables, media downloads, and variable syntax
- **EXECUTION_GUIDE.md**: Complete documentation of pause/resume system, interactive nodes, and flow execution patterns
- **FLOW_RESPONSE_VARIABLES.md**: Complete guide for dynamic WhatsApp Flow response variable capture and usage

## External Dependencies
- **WhatsApp Business API**: Core integration for sending and receiving messages.
- **PostgreSQL (Neon)**: Database for storing application data.
- **OpenAI/Anthropic**: Optional AI completion services.
- **SendGrid/SMTP**: Optional email sending services.
- **Google Sheets**: Optional integration for reading/writing data.
- **Meta Developer Portal**: For WhatsApp API configuration and webhook setup.