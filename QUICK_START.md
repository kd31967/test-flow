# Quick Start Guide - WhatsApp Flow Builder

## ✅ Complete Solution

You now have a fully functional WhatsApp Flow Builder with:
- ✅ Authentication system (Sign Up / Sign In)
- ✅ Multi-flow management
- ✅ Visual flow builder
- ✅ WhatsApp webhook integration
- ✅ Database persistence
- ✅ Session management

---

## 🚀 Getting Started (5 Minutes)

### Step 1: Sign Up (1 minute)

1. Open the application
2. You'll see a login screen
3. Click **"Don't have an account? Sign Up"**
4. Enter your email: `yourname@example.com`
5. Enter a password (min 6 characters): `yourpassword123`
6. Click **Sign Up**
7. Wait for "Account created!" message
8. Click **"Already have an account? Sign In"**
9. Enter same email and password
10. Click **Sign In**

You're now logged in!

---

### Step 2: Configure WhatsApp (2 minutes)

1. Click **Settings** button (top right, gear icon)
2. Enter your WhatsApp credentials:

   **Phone Number ID:** Get from Meta Developer Portal
   - Go to https://developers.facebook.com/apps
   - Select your WhatsApp Business app
   - Navigate to WhatsApp → API Setup
   - Copy the "Phone number ID" (looks like: 712851615243145)

   **Access Token:** Generate from Meta
   - In same page, click "Generate access token"
   - Copy the token (starts with "EAAO...")

3. Paste both values in Settings
4. Click **Save Settings**
5. Scroll down to see your **Webhook URL**:
   ```
   https://your-project.supabase.co/functions/v1/whatsapp-webhook
   ```
6. Copy this URL

---

### Step 3: Configure Meta Webhook (1 minute)

1. In Meta Developer Portal, go to WhatsApp → Configuration
2. Click **Edit** button next to "Webhook"
3. Paste your webhook URL
4. Enter verify token: `my-verify-token`
5. Click **Verify and Save**
6. Subscribe to webhook fields:
   - ☑ messages
7. Click Save

---

### Step 4: Create Your First Flow (1 minute)

Now the fun part! Create a simple "Hello Bot":

1. Click **Create New Flow** (orange button)
2. Change name from "Untitled Flow" to **"Hello Bot"**
3. Toggle switch to **Active** (should be orange)

4. **Add Trigger Node:**
   - Drag **On Message** from left sidebar
   - Click on the node
   - Configure:
     - **Trigger Keywords:** `hello, hi, start` (exactly this)
     - **Response Format:** Text
     - **Timeout:** 300
     - **Save Response As:** `user_message`

5. **Add Reply Node:**
   - Drag **Send Message** from left sidebar
   - Place it below the On Message node
   - Click on it
   - Configure:
     - **Message:** `Hello {{USER_NAME}}! 👋 Welcome to our service. How can I help you?`

6. **Connect Nodes:**
   - Click on the **Send Message** node
   - Copy its node ID (e.g., `node_1729180234567`)
   - Click on the **On Message** node
   - Paste the node ID in **Next Node** field

7. Click **Save** button (top right)

---

## 🧪 Testing Your Flow

### Test 1: Send a Message

1. Open WhatsApp on your phone
2. Send message to your WhatsApp Business number
3. Type: `hello`
4. Press send

**Expected Result:**
- Bot should reply: "Hello [Your Name]! 👋 Welcome to our service. How can I help you?"

### Test 2: Try Different Keywords

- Type: `hi`
- Type: `start`
- All should trigger the same bot response

### Test 3: Check Logs

1. Go to Supabase Dashboard
2. Navigate to: Edge Functions → whatsapp-webhook → Logs
3. Send another `hello` message
4. Watch logs appear:
   ```
   📥 Incoming webhook
   ✅ Found matching flow: Hello Bot
   ➡️ Executing node: send_message_1
   ✅ Message sent
   ```

---

## 📊 Example Flow Configurations

### Example 1: Simple Welcome (What you just built!)

**Trigger:** `hello, hi, start`
**Response:** Greeting message with user's name

**Nodes:**
1. On Message → triggers on keywords
2. Send Message → replies with greeting

---

### Example 2: Ask Name

**Trigger:** `register, signup`
**Flow:** Asks for name, then confirms

**Nodes:**
1. On Message (trigger: `register, signup`)
2. Ask Question (message: "What's your name?", save as: `USER_FULL_NAME`)
3. Send Message (message: `Nice to meet you {{USER_FULL_NAME}}!`)

**How to build:**
1. Create new flow named "Registration"
2. Add On Message node with keywords: `register, signup`
3. Add Ask Question node:
   - Message: `What's your full name?`
   - Save As: `USER_FULL_NAME`
4. Add Send Message node:
   - Message: `Nice to meet you {{USER_FULL_NAME}}! Welcome aboard.`
5. Connect: On Message → Ask Question → Send Message
6. Toggle to Active and Save

**Testing:**
- Send: `register`
- Bot asks: "What's your full name?"
- Reply: `John Doe`
- Bot says: "Nice to meet you John Doe! Welcome aboard."

---

### Example 3: Support Menu

**Trigger:** `support, help`
**Flow:** Shows button menu

**Nodes:**
1. On Message (trigger: `support, help`)
2. Send Button (shows options)
3. Multiple Send Message nodes for each option

---

## 🔧 Understanding Key Concepts

### 1. Trigger Keywords

- **What:** Words that start your flow
- **Format:** Comma-separated, case-insensitive
- **Example:** `hello, hi, start, welcome`
- **Important:** Must match exactly what user types

### 2. Variables

- **Built-in:**
  - `{{USER_NAME}}` = User's WhatsApp name
  - `{{USER_PHONE}}` = User's phone number

- **Custom:**
  - Any variable you save in "Save As" field
  - Example: Save as `EMAIL`, then use `{{EMAIL}}`

### 3. Node Types

**Trigger Nodes** (Start flow):
- On Message - triggers on keywords
- Catch Webhook - triggers from external API

**Message Nodes** (Send to user):
- Send Message - text only
- Send Media - images, videos, audio
- Send Button - interactive buttons
- Send List - dropdown list

**Question Nodes** (Wait for reply):
- Ask Question - asks and waits for answer

**Logic Nodes** (Control flow):
- Condition - if/else branching
- Delay - wait before next action
- Stop Chatbot - end conversation

### 4. Next Node Configuration

**Critical:** Every node needs to know what comes next!

- **Next Node field:** Enter the ID of next node
- **How to get ID:** Click on target node, copy its ID from config panel
- **Empty = Flow ends**

---

## 🐛 Troubleshooting

### "You must be logged in to save flows"

**Fix:** Sign up and sign in first (see Step 1)

### Flow doesn't trigger

**Checklist:**
- [ ] Flow is Active (toggle is orange)
- [ ] Flow is Saved (clicked Save button)
- [ ] Keyword matches exactly
- [ ] WhatsApp credentials configured
- [ ] Webhook configured in Meta

**Test:**
1. Check flow status: should show "Active" badge
2. Open Settings: verify Phone Number ID and Token are saved
3. Send exact keyword (case doesn't matter)

### Variables not working (shows {{USER_NAME}})

**Fix:**
- Use exact variable name (case-sensitive)
- Built-in: `USER_NAME`, `USER_PHONE`
- Custom: Match "Save As" field exactly

### Flow stops after first message

**Fix:**
- Check "Next Node" field is configured
- Verify Next Node ID is correct (copy from target node)
- Look in `flow_executions` table to see where session stopped

### Messages not sending

**Checklist:**
- [ ] Phone Number ID is correct
- [ ] Access Token is valid (not expired)
- [ ] Check Edge Function logs for errors
- [ ] Verify WhatsApp Business number is active

---

## 📚 Next Steps

Now that you have your first flow working:

1. **Add More Nodes:** Experiment with Ask Question, Send Media
2. **Use Variables:** Try `{{USER_NAME}}` and `{{USER_PHONE}}`
3. **Create Multiple Flows:** Each with different trigger keywords
4. **Build Complex Flows:** Registration, support menus, product catalogs

---

## 📖 Additional Resources

- **FLOW_EXAMPLES.md** - More detailed examples and patterns
- **WEBHOOK_SETUP.md** - Complete technical documentation
- **Edge Function Logs** - Real-time debugging in Supabase Dashboard

---

## 💡 Pro Tips

1. **Start Simple:** 2-3 nodes, test, then expand
2. **Test Often:** After adding each node
3. **Use Descriptive Names:** "Welcome Message", "Ask Email", etc.
4. **Save Variables:** Use "Save As" to store user responses
5. **Check Logs:** Watch Edge Function logs when testing
6. **Monitor Sessions:** View `flow_executions` table for active conversations

---

## ✅ Success Checklist

You're ready when you can:

- [ ] Sign in to the application
- [ ] See the flow list dashboard
- [ ] Create a new flow
- [ ] Add and configure nodes
- [ ] Toggle flow to Active
- [ ] Save the flow
- [ ] Send a WhatsApp message
- [ ] Receive an automated reply
- [ ] See the session in `flow_executions` table
- [ ] View logs in Supabase Dashboard

**Congratulations! You're now a WhatsApp Flow Builder expert! 🎉**

---

Need help? Check the logs in Supabase Dashboard → Edge Functions → whatsapp-webhook
