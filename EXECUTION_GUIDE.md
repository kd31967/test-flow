# Flow Execution Guide

## Overview
This guide explains how the WhatsApp Flow Builder executes flows, handles user interactions, and manages paused executions. The system has been enhanced to properly wait for user responses before continuing flow execution.

---

## Execution State Management

### How Pause/Resume Works

The flow execution system now includes sophisticated pause/resume functionality for interactive nodes:

1. **Execution Start**: When a flow is triggered (via webhook or keyword), it begins executing from the start node
2. **Interactive Node Encountered**: When an interactive node is reached (send_button, send_list, send_flow), the system:
   - Sends the WhatsApp message to the user
   - **Pauses execution** and stores the current state in memory
   - Waits for the user to respond
3. **User Response**: When the user interacts (clicks button, selects list item, submits flow form):
   - The webhook endpoint receives the user's response
   - The system retrieves the paused execution state
   - User response is captured as a variable
   - **Execution resumes** from the next connected node

### Paused Execution Storage

```typescript
// In-memory storage structure
pausedExecutions = Map<string, {
  flowId: string,
  pausedAtNodeId: string,
  variables: Record<string, any>,
  expectedResponseType: 'button' | 'list' | 'flow',
  executionId?: string,
  timestamp: number
}>
```

**Key**: `${userPhone}_${flowId}` - ensures one active paused execution per user per flow

---

## Interactive Nodes (Auto-Pause)

These nodes automatically pause execution and wait for user interaction:

### 1. Send Button (`send_button`)

**Purpose**: Send interactive buttons to the user

**Behavior**:
- ✅ Sends button message to WhatsApp
- ⏸️ **Pauses execution** after sending
- ⏳ Waits for user to click a button
- ▶️ Resumes execution when user responds
- 💾 Stores clicked button ID and title in variables

**Variable Capture**:
```javascript
// Automatically stored in context.variables[node_id]:
{
  button_id: "btn_1",           // Button identifier clicked
  button_text: "Option 1",      // Button display text
  clicked: true,
  timestamp: "2025-10-22T16:30:00Z"
}

// Access in downstream nodes:
{{send_button_node.button_id}}
{{send_button_node.button_text}}
```

**Configuration Fields**:
- `bodyText`: Main message text (supports variables)
- `headerText`: Optional header (text only)
- `footerText`: Optional footer
- `buttons`: Array of button objects `[{id, title}]`

**Example Flow**:
```
[send_button] → [condition: check button_id] → [send_message: personalized response]
```

---

### 2. Send List (`send_list`)

**Purpose**: Send interactive list menu to the user

**Behavior**:
- ✅ Sends list message to WhatsApp
- ⏸️ **Pauses execution** after sending
- ⏳ Waits for user to select a list item
- ▶️ Resumes execution when user responds
- 💾 Stores selected item ID, title, and description in variables

**Variable Capture**:
```javascript
// Automatically stored in context.variables[node_id]:
{
  row_id: "row_12345",          // Selected row identifier
  title: "Product A",           // Row title
  description: "Best seller",   // Row description (if any)
  selected: true,
  timestamp: "2025-10-22T16:30:00Z"
}

// Access in downstream nodes:
{{send_list_node.row_id}}
{{send_list_node.title}}
{{send_list_node.description}}
```

**Configuration Fields**:
- `bodyText`: Main message text
- `buttonText`: Text for list button (e.g., "View Options")
- `headerText`: Optional header
- `footerText`: Optional footer
- `sections`: Array of sections containing rows
  - Each section: `{title, rows: [{id, title, description}]}`

**Row ID Requirements**:
- Each row MUST have a unique `id` field
- System auto-generates IDs like `row_${Date.now()}` when creating rows
- WhatsApp validates these IDs - duplicates will cause errors

**Example Flow**:
```
[send_list: product catalog] 
  → [http: fetch product details using {{send_list_node.row_id}}]
  → [send_message: show product info]
```

---

### 3. Send Flow (`send_flow`)

**Purpose**: Send WhatsApp Flow (interactive form) to collect structured data

**Behavior**:
- ✅ Sends flow message to WhatsApp
- ⏸️ **Pauses execution** after sending
- ⏳ Waits for user to complete and submit the form
- ▶️ Resumes execution when user submits
- 💾 Stores all form field values in variables

**Variable Capture**:
```javascript
// Automatically stored in context.variables[node_id]:
{
  // Form submission data (exact fields depend on your flow schema)
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  address: "123 Main St",
  submitted: true,
  timestamp: "2025-10-22T16:30:00Z"
}

// Access in downstream nodes:
{{send_flow_node.name}}
{{send_flow_node.email}}
{{send_flow_node.phone}}
```

**Configuration Fields**:
- `flowId`: WhatsApp Flow ID from Meta Flow Builder
- `header`: Optional header text
- `body`: Optional body text
- `screen`: Screen name in the flow to start with
- `flowData`: Initial data to pre-populate form fields

**Example Flow**:
```
[send_flow: customer registration]
  → [http: POST to CRM with {{send_flow_node.name}}, {{send_flow_node.email}}]
  → [send_message: "Thanks {{send_flow_node.name}}, you're registered!"]
```

---

## Non-Interactive Nodes (Continue Immediately)

These nodes execute and immediately continue to the next node:

### 4. Send Message (`send_message`)

**Behavior**: Sends text message and continues immediately

**Variable Capture**:
```javascript
{
  sent: true,
  text: "Message content",
  timestamp: "..."
}
```

---

### 5. Send Media (`send_media`)

**Behavior**: Sends image/video/audio/document and continues immediately

**Variable Capture**:
```javascript
{
  sent: true,
  mediaUrl: "https://...",
  mediaType: "image",
  caption: "Optional caption"
}
```

---

### 6. Send CTA (`send_cta` or `cta_url`)

**Purpose**: Send a Call-to-Action URL button

**Behavior**: Sends CTA message and continues immediately (does NOT wait for click)

**Variable Capture**:
```javascript
{
  sent: true,
  bodyText: "Visit our website",
  url: "https://example.com"
}
```

**Configuration Fields**:
- `bodyText`: Main message text
- `displayText`: Button text (e.g., "Visit Website")
- `url`: URL to open when clicked
- `headerText`: Optional header
- `footerText`: Optional footer

**Note**: CTA buttons open external URLs and don't send responses back to WhatsApp, so execution continues immediately after sending.

---

### 7. Send Location (`send_location`)

**Behavior**: Sends a location pin and continues immediately

**Variable Capture**:
```javascript
{
  sent: true,
  latitude: "40.7128",
  longitude: "-74.0060",
  name: "Our Office",
  address: "123 Main St, New York, NY"
}
```

**Configuration Fields**:
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `name`: Location name (optional)
- `address`: Full address (optional)

---

### 8. Delay (`delay`)

**Purpose**: Wait for a specified duration before continuing

**Behavior**:
- ⏳ Waits for the specified amount of time
- ▶️ Continues to next node after delay completes
- Does NOT send any messages

**Variable Capture**:
```javascript
{
  delayed: true,
  delayAmount: 5,
  delayUnit: "minutes"
}
```

**Configuration Fields**:
- `delay` or `duration` or `time`: Numeric amount
- `unit` or `timeUnit`: Time unit
  - `"seconds"` (default)
  - `"minutes"`
  - `"hours"`

**Examples**:
```javascript
// Wait 30 seconds
{delay: 30, unit: "seconds"}

// Wait 5 minutes
{delay: 5, unit: "minutes"}

// Wait 2 hours
{delay: 2, unit: "hours"}
```

**Use Cases**:
- Add natural pauses between messages
- Delay follow-up messages
- Space out automated responses
- Implement drip campaigns

**Example Flow**:
```
[send_message: "Processing your order..."]
  → [delay: 5 minutes]
  → [send_message: "Your order is ready!"]
```

---

## Complete Flow Example: E-Commerce Order

```
┌─────────────────┐
│  Trigger: "shop"│ (User texts "shop")
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  send_message   │ "Welcome! Let me show you our products"
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   send_list     │ Product catalog with sections
│  (PAUSES HERE)  │ - Electronics
└────────┬────────┘   - Clothing
         │            - Books
         ⏸️ Execution paused, waiting for user selection...
         │
         ▼ (User selects "Laptop - $999")
         │
         ▶️ Execution resumes with variables:
         │  {{send_list.row_id}} = "product_laptop"
         │  {{send_list.title}} = "Laptop"
         │  {{send_list.description}} = "$999"
         │
         ▼
┌─────────────────┐
│   http_request  │ GET /api/products/{{send_list.row_id}}
└────────┬────────┘ → Returns detailed product info
         │
         ▼
┌─────────────────┐
│  send_media     │ Product image with specs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  send_button    │ "Add to cart?" [Yes] [No]
│  (PAUSES HERE)  │
└────────┬────────┘
         ⏸️ Execution paused, waiting for button click...
         │
         ▼ (User clicks "Yes")
         │
         ▶️ Execution resumes with variables:
         │  {{send_button.button_id}} = "btn_yes"
         │  {{send_button.button_text}} = "Yes"
         │
         ▼
┌─────────────────┐
│   condition     │ If {{send_button.button_id}} == "btn_yes"
└────────┬────────┘
         │ (True path)
         ▼
┌─────────────────┐
│   send_flow     │ Shipping form (name, address, phone)
│  (PAUSES HERE)  │
└────────┬────────┘
         ⏸️ Execution paused, waiting for form submission...
         │
         ▼ (User submits form)
         │
         ▶️ Execution resumes with variables:
         │  {{send_flow.name}} = "John Doe"
         │  {{send_flow.address}} = "123 Main St"
         │  {{send_flow.phone}} = "+1234567890"
         │
         ▼
┌─────────────────┐
│   http_request  │ POST /api/orders
└────────┬────────┘ Body: {
         │           product: "{{send_list.row_id}}",
         │           customer: "{{send_flow.name}}",
         │           address: "{{send_flow.address}}",
         │           phone: "{{send_flow.phone}}"
         │         }
         │
         ▼
┌─────────────────┐
│   delay         │ Wait 2 seconds
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  send_message   │ "Thanks {{send_flow.name}}! Order confirmed."
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  send_location  │ Store location for pickup
└─────────────────┘
```

---

## Technical Implementation

### Pause Function

```typescript
function pauseExecution(
  userPhone: string,
  flowId: string,
  pausedAtNodeId: string,
  variables: Record<string, any>,
  expectedResponseType: 'button' | 'list' | 'flow',
  executionId?: string
): void {
  const key = `${userPhone}_${flowId}`;
  pausedExecutions.set(key, {
    flowId,
    pausedAtNodeId,
    variables,
    expectedResponseType,
    executionId,
    timestamp: Date.now()
  });
  console.log(`⏸️  Paused execution for ${userPhone} at node ${pausedAtNodeId}`);
}
```

### Resume Function

```typescript
function resumeExecution(
  userPhone: string,
  flowId: string,
  userResponse: any
): PausedExecutionState | null {
  const key = `${userPhone}_${flowId}`;
  const pausedState = pausedExecutions.get(key);
  
  if (!pausedState) {
    console.log(`⚠️  No paused execution found for ${userPhone}`);
    return null;
  }
  
  // Remove from paused state
  pausedExecutions.delete(key);
  
  console.log(`▶️  Resumed execution for ${userPhone} from node ${pausedState.pausedAtNodeId}`);
  return pausedState;
}
```

### Webhook Handler Integration

**Next Step**: The webhook endpoint in `server/routes.ts` needs to be updated to:

1. Detect incoming user responses (button clicks, list selections, flow submissions)
2. Call `resumeExecution()` to retrieve the paused state
3. Merge user response into variables
4. Call `executeFlow()` starting from the NEXT node after the paused node
5. Pass the merged variables to continue execution

**Example Implementation**:

```typescript
// In webhook handler
app.post('/webhook/:flowId', async (req, res) => {
  const { flowId } = req.params;
  const webhookData = req.body;
  
  // Extract user phone and response from webhook
  const userPhone = webhookData.from; // WhatsApp phone number
  const messageType = webhookData.type; // 'button_reply', 'list_reply', 'interactive'
  
  // Try to resume paused execution
  const pausedState = resumeExecution(userPhone, flowId, webhookData);
  
  if (pausedState) {
    // Merge user response into variables
    const responseData = extractResponseData(webhookData, messageType);
    const mergedVariables = {
      ...pausedState.variables,
      [pausedState.pausedAtNodeId]: responseData
    };
    
    // Find the next node to execute
    const flow = await storage.getFlowById(flowId);
    const currentNode = flow.nodes.find(n => n.id === pausedState.pausedAtNodeId);
    const nextNodeId = currentNode?.data?.next || currentNode?.data?.connections?.[0];
    
    if (nextNodeId) {
      // Resume execution from next node
      await executeFlow(
        flowId,
        mergedVariables,
        userPhone,
        storage,
        nextNodeId // Start from next node
      );
    }
  }
  
  res.sendStatus(200);
});
```

---

## Testing Checklist

### Button Testing
- [ ] Flow sends button message
- [ ] Console shows "✅ Button sent - waiting for user click"
- [ ] Execution pauses (no further nodes execute)
- [ ] User clicks button in WhatsApp
- [ ] Webhook receives button response
- [ ] Execution resumes from next node
- [ ] Button response available as `{{node_id.button_id}}`

### List Testing
- [ ] Flow sends list message
- [ ] Console shows "✅ List sent - waiting for user selection"
- [ ] Execution pauses
- [ ] User selects list item in WhatsApp
- [ ] Webhook receives list response
- [ ] Execution resumes from next node
- [ ] List response available as `{{node_id.row_id}}`

### Flow Testing
- [ ] Flow sends WhatsApp Flow form
- [ ] Console shows "✅ Flow sent - waiting for user form submission"
- [ ] Execution pauses
- [ ] User completes and submits form
- [ ] Webhook receives flow response with all form fields
- [ ] Execution resumes from next node
- [ ] Form data available as `{{node_id.field_name}}`

### Delay Testing
- [ ] Delay node executes
- [ ] Console shows "⏳ Delaying execution for X seconds/minutes/hours..."
- [ ] System waits for specified duration
- [ ] Console shows "✅ Delay complete"
- [ ] Next node executes immediately after delay

---

## Common Issues & Solutions

### Issue: Flow continues without waiting for user
**Cause**: Node doesn't call `pauseExecution()` or `shouldContinue` flag not set to `false`  
**Solution**: Verify interactive nodes include pause logic (send_button, send_list, send_flow)

### Issue: Execution never resumes
**Cause**: Webhook handler not integrated with `resumeExecution()`  
**Solution**: Implement webhook handler to detect responses and resume execution

### Issue: Variables not captured
**Cause**: Response not merged into `context.variables[nodeId]`  
**Solution**: Ensure webhook extracts response data and stores it correctly

### Issue: Delay doesn't work
**Cause**: Using wrong field names or unit  
**Solution**: Use `delay`/`duration`/`time` for amount and `unit`/`timeUnit` for unit type

---

## Best Practices

1. **Always test interactively**: Test buttons, lists, and flows with real WhatsApp messages
2. **Use meaningful IDs**: Give nodes descriptive IDs for easier variable access
3. **Log execution states**: Monitor console for pause/resume events
4. **Handle errors gracefully**: Check if nodes sent successfully before pausing
5. **Validate user responses**: Use conditions to validate button clicks, list selections
6. **Clear paused states**: Implement cleanup for abandoned/expired paused executions
7. **Document flows**: Use node labels to describe what each node does
8. **Test variable access**: Verify variables are accessible in downstream nodes

---

## Next Steps for Production

1. **Implement Webhook Handler**:
   - Parse WhatsApp webhook payloads
   - Extract button clicks, list selections, flow responses
   - Call `resumeExecution()` and continue flow

2. **Add Persistence**:
   - Move `pausedExecutions` from in-memory Map to database
   - Store in `flow_executions` table with status "paused"
   - Query and resume from database

3. **Add Timeout Handling**:
   - Auto-expire paused executions after X hours
   - Send reminder messages for abandoned flows
   - Clean up stale pause states

4. **Add Error Handling**:
   - Retry failed WhatsApp API calls
   - Handle webhook validation
   - Log execution errors

5. **Add Analytics**:
   - Track pause/resume metrics
   - Monitor user drop-off rates
   - Analyze completion rates per node type

---

## Summary

✅ **Fixed Nodes**:
- `send_button` - Now pauses and waits for click
- `send_list` - Now pauses and waits for selection
- `send_flow` - Now pauses and waits for form submission
- `send_cta` - Working correctly (continues immediately)
- `send_location` - Working correctly (continues immediately)
- `delay` - Now properly waits for duration

✅ **New Functionality**:
- Pause/resume execution state management
- Automatic variable capture for user responses
- Proper flow control for interactive nodes
- Support for seconds/minutes/hours in delay node

🚧 **Pending Integration**:
- Webhook handler to process user responses
- Database persistence for paused executions
- Timeout/cleanup for abandoned executions
