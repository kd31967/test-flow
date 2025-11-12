# WhatsApp Flow Examples & Testing Guide

## Quick Start: Your First Flow

### Step 1: Sign In / Sign Up

1. Open the application
2. Click **Sign Up** if you don't have an account
3. Enter your email and password (minimum 6 characters)
4. Click **Sign Up** button
5. You'll see "Account created! You can now sign in."
6. Click **Sign In** and enter your credentials

### Step 2: Configure WhatsApp Settings

Before creating flows, you need to add your WhatsApp credentials:

1. Click the **Settings** button (top right)
2. Enter your **Phone Number ID** (from Meta Developer Portal)
3. Enter your **WhatsApp Access Token** (from Meta Developer Portal)
4. Click **Save Settings**

**Where to get these credentials:**
- Go to https://developers.facebook.com/apps
- Select your WhatsApp Business app
- Navigate to WhatsApp → API Setup
- Copy Phone Number ID and generate Access Token

### Step 3: Create Your First Flow

## Example 1: Simple Welcome Bot

This bot greets users when they type "hello" or "hi"

### Flow Configuration:

**Flow Name:** Welcome Bot
**Status:** Active
**Description:** Greets new users

### Nodes:

#### Node 1: On Message (Trigger)
- **Type:** On Message
- **Trigger Keywords:** `hello, hi, start`
- **Save As:** `user_message`
- **Next Node:** `send_message_1`

Configuration in UI:
```
Trigger Keywords: hello, hi, start
Response Format: Text
Timeout (seconds): 300
Save Response As: user_message
```

#### Node 2: Send Message
- **Type:** Send Message
- **Message:** `Hello {{USER_NAME}}! 👋 Welcome to our WhatsApp service. How can I help you today?`
- **Next Node:** (leave empty to end flow)

Configuration in UI:
```
Message: Hello {{USER_NAME}}! 👋 Welcome to our WhatsApp service. How can I help you today?
```

### How to Build This Flow:

1. Click **Create New Flow**
2. Name it "Welcome Bot"
3. Toggle to **Active**
4. Drag **On Message** node from left sidebar
5. Click the node to configure:
   - Keywords: `hello, hi, start`
   - Save As: `user_message`
6. Drag **Send Message** node below it
7. Click the Send Message node:
   - Message: `Hello {{USER_NAME}}! 👋 Welcome to our WhatsApp service.`
8. In the On Message node config, set **Next Node:** `node_XXX` (the ID of Send Message node)
9. Click **Save** (top right)

### Testing:

1. Open WhatsApp on your phone
2. Send message to your WhatsApp Business number: `hello`
3. Bot should reply: "Hello [Your Name]! 👋 Welcome to our WhatsApp service."

---

## Example 2: Question & Answer Bot

This bot asks for user information

### Flow Configuration:

**Flow Name:** User Registration
**Status:** Active

### Nodes:

#### Node 1: On Message (Trigger)
```
Type: On Message
Trigger Keywords: register, signup, join
Save As: trigger_message
Next: ask_name
```

#### Node 2: Ask Question - Name
```
Type: Ask Question
Message: Thanks for your interest! What's your full name?
Response Format: Text
Timeout: 300
Save As: USER_FULL_NAME
Next: ask_email
```

#### Node 3: Ask Question - Email
```
Type: Ask Question
Message: Great {{USER_FULL_NAME}}! What's your email address?
Response Format: Email
Timeout: 300
Save As: USER_EMAIL
Next: send_confirmation
```

#### Node 4: Send Confirmation
```
Type: Send Message
Message: Perfect! Your details have been saved:
Name: {{USER_FULL_NAME}}
Email: {{USER_EMAIL}}
Phone: {{USER_PHONE}}

Thank you for registering!
Next: (empty - flow ends)
```

### Testing:

1. Send: `register`
2. Bot asks: "What's your full name?"
3. Reply: `John Doe`
4. Bot asks: "What's your email address?"
5. Reply: `john@example.com`
6. Bot confirms all details

---

## Example 3: Support Menu with Buttons

This bot shows a menu of options

### Flow Configuration:

**Flow Name:** Support Menu
**Status:** Active

### Nodes:

#### Node 1: On Message (Trigger)
```
Type: On Message
Trigger Keywords: support, help, menu
Save As: trigger
Next: send_menu
```

#### Node 2: Send Button
```
Type: Send Button
Message: How can we help you today? Please select an option:
Buttons:
  - ID: technical, Title: Technical Support
  - ID: billing, Title: Billing Question
  - ID: general, Title: General Inquiry

Button Mapping (Next Node by ID):
  technical → send_technical
  billing → send_billing
  general → send_general
```

#### Node 3a: Technical Support
```
Type: Send Message
Message: Our technical team will assist you. Please describe your issue.
```

#### Node 3b: Billing Support
```
Type: Send Message
Message: For billing questions, please email billing@company.com or call 1-800-BILLING
```

#### Node 3c: General Support
```
Type: Send Message
Message: How can we help? Please describe your question.
```

---

## Example 4: Media Sharing Bot

Send images or videos to users

### Flow Configuration:

**Flow Name:** Product Showcase
**Status:** Active

### Nodes:

#### Node 1: On Message (Trigger)
```
Trigger Keywords: catalog, products, shop
Next: send_welcome
```

#### Node 2: Send Message
```
Message: Welcome to our product catalog! Here are our featured items:
Next: send_product_image
```

#### Node 3: Send Media
```
Type: Send Media
Media Type: Image
Media URL: https://example.com/product1.jpg
Caption: Product 1: Premium Widget - $99.99
Next: ask_interest
```

#### Node 4: Ask Question
```
Message: Are you interested in this product? Reply YES or NO
Save As: INTERESTED
Next: (based on response)
```

---

## Understanding Node Configuration

### On Message Node (Trigger)

This is the STARTING point of your flow. It triggers when a user sends a specific keyword.

**Important Fields:**
- **Trigger Keywords:** Comma-separated list (e.g., `hello, hi, start`)
- **Save As:** Variable name to store the message (e.g., `user_message`)
- **Next Node:** Must be set to the next node ID

**How to find Next Node ID:**
1. Create the second node (e.g., Send Message)
2. Click on it
3. Look at the node ID in the configuration panel (e.g., `node_1234567890`)
4. Go back to On Message node
5. Enter this ID in the "Next Node" field

### Send Message Node

Sends a text message to the user.

**Variables You Can Use:**
- `{{USER_NAME}}` - User's WhatsApp name
- `{{USER_PHONE}}` - User's phone number
- `{{ANY_SAVED_VARIABLE}}` - Any variable you saved earlier

**Example:**
```
Hello {{USER_NAME}}!
Your registration is complete.
Email: {{USER_EMAIL}}
```

### Ask Question Node

Asks a question and WAITS for user reply.

**Important:**
- Set **Save As** to store the answer
- The flow will pause here until user replies
- Set **Next Node** to continue after answer is received

---

## Testing Your Flow

### Method 1: Test with Real WhatsApp

1. **Ensure flow is ACTIVE** (toggle in flow builder)
2. **Save the flow** (click Save button)
3. **Configure webhook** in Meta Developer Portal
4. **Send trigger keyword** from your phone to WhatsApp Business number
5. **Check Edge Function logs** in Supabase Dashboard → Edge Functions → whatsapp-webhook → Logs

### Method 2: Check Database

Monitor active sessions:

1. Go to Supabase Dashboard
2. Navigate to Table Editor
3. Open `flow_executions` table
4. Look for your phone number
5. Check `current_node` and `variables` columns

### Method 3: View Logs

Check what's happening:

1. Supabase Dashboard → Edge Functions → whatsapp-webhook
2. Click "Logs" tab
3. Send a message from WhatsApp
4. Watch logs appear in real-time
5. Look for:
   - "Incoming webhook"
   - "Found matching flow"
   - "Executing node"
   - "Message sent"

---

## Common Issues & Solutions

### Issue: "You must be logged in to save flows"

**Solution:** You need to sign up and sign in first.
1. Click "Sign Up" in the auth screen
2. Enter email and password
3. Click Sign Up
4. Then Sign In with same credentials

### Issue: Flow doesn't trigger

**Checklist:**
- ✅ Flow status is **Active** (not Draft)
- ✅ Flow is **Saved**
- ✅ Trigger keyword matches exactly what you typed
- ✅ WhatsApp credentials are configured in Settings
- ✅ Webhook is configured in Meta Developer Portal

### Issue: Variables not working

**Example:** Message shows `{{USER_NAME}}` instead of actual name

**Solution:**
- Ensure you're using correct variable name (case-sensitive)
- Built-in variables: `USER_NAME`, `USER_PHONE`
- Custom variables: Use exact name from "Save As" field

### Issue: Flow stops at a node

**Solution:**
- Check if node has **Next Node** configured
- Verify Next Node ID is correct
- Check `flow_executions` table for session state

---

## Best Practices

### 1. Start Simple
Begin with 2-3 nodes, test, then expand

### 2. Clear Keywords
Use unique, simple trigger words: `hello`, `support`, `menu`

### 3. Save Variables
Use **Save As** field to store user responses for later use

### 4. Test Frequently
Test after adding each node

### 5. Use Clear Messages
Write messages as if talking to a real person

### 6. Set Next Nodes
Always configure where flow should go next

### 7. End Gracefully
Use **Stop Chatbot** node or leave Next Node empty to end flow

---

## Advanced: Node Types Reference

| Node Type | Purpose | Waits for Reply? |
|-----------|---------|------------------|
| On Message | Start flow on keyword | No |
| Send Message | Send text | No (auto-advance) |
| Ask Question | Ask and wait for answer | Yes |
| Send Button | Show button options | Yes |
| Send List | Show list of options | Yes |
| Send Media | Send image/video/audio | No (auto-advance) |
| Condition | Branch based on variable | No (auto-advance) |
| HTTP | Call external API | No (auto-advance) |
| Delay | Wait before next action | No (auto-advance) |
| Stop Chatbot | End conversation | Ends flow |

---

## Need Help?

1. Check Edge Function logs in Supabase
2. Verify flow configuration in database (`flows` table)
3. Monitor sessions in `flow_executions` table
4. Ensure WhatsApp credentials are correct
5. Test webhook verification in Meta Developer Portal

---

**Remember:**
- Only **ACTIVE** flows will trigger
- Trigger keywords must match exactly (case-insensitive)
- Variables use {{VARIABLE_NAME}} syntax
- Nodes need Next Node ID to advance
