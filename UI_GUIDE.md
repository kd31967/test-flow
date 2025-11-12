# WhatsApp Flow Builder - Complete UI Guide

## ✅ UI is Now Working!

The Tailwind CSS styling has been fixed. Your WhatsApp Flow Builder now displays properly with all visual elements.

---

## 🎨 Main Interface Overview

### **1. Flow List Page (Home Screen)**

**What You See:**
- Header: "WhatsApp Flow Builder" 
- Subtitle: "Create and manage your automation flows"
- **Settings Button** (⚙️ icon, top right) - Click to configure WhatsApp API
- **Import JSON Button** - Upload existing flows
- **Create New Flow Button** (Orange button)
- Flow cards (when you have flows)

**How to Access:** This is the default page when you open the app.

---

### **2. Settings Page - WhatsApp API Configuration**

**How to Access:** Click the **Settings (⚙️)** button in the top right corner

**What You'll Configure:**
- **WhatsApp Phone Number ID** - Your Meta/Facebook WhatsApp Phone Number ID
- **WhatsApp Access Token** - Your permanent access token from Meta Developer Portal
- Click **Save Settings** to store your credentials

**Purpose:** This is where you configure your WhatsApp Business API credentials so the platform can send messages.

---

### **3. Flow Builder Canvas**

**How to Access:** Click **"Create New Flow"** or **"Create Your First Flow"**

**What You'll See:**

#### **Top Header:**
- ← Back button (returns to flow list)
- Flow name input field
- Flow description input field
- Draft/Active toggle
- **Save** button (💾)
- **Export JSON** button (⬇️)

#### **Left Sidebar - Node Palette:**
Contains all node types you can add:
- 📧 **Send Message** - Send text messages
- ⏸️ **Wait for Reply** - Pause for user input
- 🔘 **Send Button** - Interactive button menus
- 🔗 **Webhook** - Call external webhooks
- 🌐 **HTTP Request** - Make API calls
- 🤖 **AI Completion** - OpenAI/Anthropic integration
- 📨 **Email** - Send emails
- 🗄️ **Database Query** - Query databases
- 📋 **Transform Data** - Data manipulation
- 🔌 **Google Sheets** - Sheets integration

**How to Use:** Drag a node from the sidebar onto the canvas

#### **Center - Canvas Area:**
- Large white/gray workspace
- Drag nodes around to position them
- Click a node to select it and see config panel
- Connect nodes by configuring "next node" in config panel

#### **Right Side - Configuration Panel:**
Shows when you select a node:
- **Node Settings** specific to the node type
- **Next Node Selector** - Choose which node runs next
- **Delete Node** button
- **Duplicate Node** button

---

### **4. Creating Your First Flow - Step by Step**

1. **Click "Create Your First Flow"** button
2. **Name your flow** (e.g., "Welcome Message")
3. **Add description** (e.g., "Send welcome to new users")
4. **Drag "Send Message" node** from left sidebar to canvas
5. **Click the node** to configure it
6. **Enter message text** in the config panel (right side)
7. **Add more nodes** if needed and connect them
8. **Toggle to "Active"** (top right switch)
9. **Click Save** (💾 button)

---

## 🔗 Webhooks - Where to Find Them

### **WhatsApp Business API Webhook**

**URL Format:**
```
https://<your-repl-url>.repl.co/api/whatsapp-webhook
```

**Where It's Used:**
- Configure this in Meta Developer Portal
- This receives incoming WhatsApp messages
- Triggers flows based on keywords

**Documentation:** See `WEBHOOK_URLS.md` for complete setup guide

### **Custom Webhook (Per Flow Node)**

**URL Format:**
```
https://<your-repl-url>.repl.co/api/custom-webhook/:flowId/:nodeId
```

**How to Find:**
1. Create a flow
2. Add a **Webhook node** to your canvas
3. Click the webhook node
4. The webhook URL will be shown in the config panel
5. Copy this URL to use in external services

**Example:**
```
https://myapp.username.repl.co/api/custom-webhook/my-flow-name/node_12345
```

---

## 📊 Global Settings & Configuration

### **Application Settings**
**Location:** Click **Settings (⚙️)** button (top right corner)

**What's Inside:**
- WhatsApp API Configuration
  - Phone Number ID field
  - Access Token field (hidden input for security)
  - Save button
- Show/Hide token toggle (👁️ icon)

### **Flow-Specific Settings**
**Location:** In the Flow Builder (when editing a flow)

**What's Configurable:**
- Flow name
- Flow description  
- Flow status (Draft/Active)
- Trigger keywords (in flow configuration)

---

## 🎯 All Available Features

### ✅ **Currently Working:**
1. ✅ Visual flow builder with drag-and-drop
2. ✅ All node types available in sidebar
3. ✅ Node configuration panel
4. ✅ Settings page for WhatsApp API
5. ✅ Flow list management
6. ✅ Create, edit, duplicate, delete flows
7. ✅ Export/Import JSON
8. ✅ Draft/Active status toggle
9. ✅ Webhook endpoints (documented)

### 🚀 **How to Test:**

**Test 1: Create a Simple Flow**
```
1. Click "Create Your First Flow"
2. Add "Send Message" node
3. Configure: "Hello! Welcome to our service"
4. Save flow
5. Set to Active
```

**Test 2: Settings Page**
```
1. Click Settings (⚙️)
2. See WhatsApp configuration form
3. Enter test credentials (or real ones)
4. Save
```

**Test 3: Multi-Node Flow**
```
1. Create new flow
2. Add "Send Message" → "Wait for Reply" → "Send Button"
3. Configure each node
4. Connect them via "next node" setting
5. Save
```

---

## 🔍 Troubleshooting

### **If UI looks plain/unstyled:**
- ✅ FIXED! Tailwind config updated
- Refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)

### **If canvas is empty:**
- Drag nodes from the left sidebar
- Nodes appear on the canvas when dragged

### **If webhook URL not showing:**
- Add a Webhook node to your flow
- Click the node
- URL appears in right config panel

### **If Settings button not working:**
- Click the ⚙️ icon in top right
- Settings modal/page should appear

---

## 📚 Complete Documentation

- **Webhook Setup:** See `WEBHOOK_URLS.md`
- **Project Architecture:** See `replit.md`
- **Meta WhatsApp Docs:** https://developers.facebook.com/docs/whatsapp

---

## 🎉 Everything You Need

✅ **UI Styling:** Fixed and working  
✅ **Canvas:** Available when creating/editing flows  
✅ **Settings:** Click ⚙️ button  
✅ **Webhooks:** URLs documented in `WEBHOOK_URLS.md`  
✅ **Flow Creation:** Click "Create New Flow" button  
✅ **Node Palette:** Left sidebar in flow builder  
✅ **Configuration:** Right panel when node selected  

**Your WhatsApp Flow Builder is fully functional!** 🚀
