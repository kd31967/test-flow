# Dynamic WhatsApp Flow Response Variables

## Overview

This system automatically captures **ALL fields** from WhatsApp Flow responses without requiring hardcoded variable names. When a user submits a WhatsApp Flow form, all fields are dynamically extracted and made available as variables in subsequent nodes.

## How It Works

### 1. **Send Flow Node**
When you add a "Send Flow" node to your flow, it sends a WhatsApp Flow form to the user and automatically **pauses execution** until the user submits the form.

### 2. **User Submits Form**
When the user fills out and submits the form (like the example with task_name, task_details, due_date, etc.), WhatsApp sends the response data back to your webhook.

### 3. **Automatic Variable Capture**
The system automatically:
- Detects the flow response
- Parses **ALL fields** dynamically (no hardcoding needed)
- Stores them under the node ID
- Resumes flow execution with those variables available

### 4. **Use Variables in Next Nodes**
You can now reference any field from the flow response using this syntax:

```
{{node_id.field_name}}
```

## Example Usage

### Scenario: Task Creation Flow

**Flow Structure:**
1. **On Message** - Triggered by "create task"
2. **Send Message** - "Please fill out the task details"
3. **Send Flow** (node_1761158613020) - Displays form with fields:
   - `task_name`
   - `task_details`
   - `due_date`
   - `due_time`
   - `assign_to`
4. **Send Message** - Confirmation message using captured data

**User Fills Form:**
- Task Name: "Fhh"
- Task Details: "Ghh"
- Due Date: "Oct 23 2025"
- Due Time: "10:00"
- Assign To: "DEV"

**Available Variables in Next Nodes:**

```
{{node_1761158613020.task_name}}      → "Fhh"
{{node_1761158613020.task_details}}   → "Ghh"
{{node_1761158613020.due_date}}       → "Oct 23 2025"
{{node_1761158613020.due_time}}       → "10:00"
{{node_1761158613020.assign_to}}      → "DEV"
```

**Example Confirmation Message:**

```
✅ Task Created Successfully!

📋 Task: {{node_1761158613020.task_name}}
📝 Details: {{node_1761158613020.task_details}}
📅 Due: {{node_1761158613020.due_date}} at {{node_1761158613020.due_time}}
👤 Assigned to: {{node_1761158613020.assign_to}}

Your task has been saved!
```

**Output:**
```
✅ Task Created Successfully!

📋 Task: Fhh
📝 Details: Ghh
📅 Due: Oct 23 2025 at 10:00
👤 Assigned to: DEV

Your task has been saved!
```

## Variable Syntax Patterns

### 1. **Node ID Based (Recommended)**
Access fields using the send_flow node's unique ID:

```
{{node_id.field_name}}
```

**Why this is recommended:**
- Unique per node
- Prevents conflicts
- Clear which flow the data came from

### 2. **Generic Flow Response**
For backward compatibility, also available as:

```
{{flow_response.field_name}}
```

## Dynamic Field Detection

The system **automatically detects ALL fields** in the flow response, regardless of:
- Field names
- Field types
- Number of fields
- Field structure

**Example: If your flow has these fields:**
- `customer_name`
- `email`
- `phone`
- `product_id`
- `quantity`
- `notes`

**All are automatically captured and available as:**
```
{{node_id.customer_name}}
{{node_id.email}}
{{node_id.phone}}
{{node_id.product_id}}
{{node_id.quantity}}
{{node_id.notes}}
```

## How to Find Your Node ID

### Method 1: Check the Flow Builder
- Select the "Send Flow" node
- Look at the node properties
- The ID is displayed in the node header

### Method 2: Check the Logs
When a flow is sent, the logs show:
```
✅ Flow sent - waiting for user form submission
⏸️  Execution paused for 919373393645, waiting for: flow
📝 Stored response for node node_1761158613020: ...
```

The node ID is shown in the logs.

### Method 3: Variable Auto-Complete (Coming Soon)
Future updates will include auto-completion for available variables in the UI.

## Integration with Other Nodes

### Send to HTTP API

```json
{
  "task": "{{node_1761158613020.task_name}}",
  "description": "{{node_1761158613020.task_details}}",
  "due_date": "{{node_1761158613020.due_date}}",
  "assignee": "{{node_1761158613020.assign_to}}"
}
```

### Save to Google Sheets

| Column A | Column B | Column C | Column D |
|----------|----------|----------|----------|
| {{node_1761158613020.task_name}} | {{node_1761158613020.task_details}} | {{node_1761158613020.due_date}} | {{node_1761158613020.assign_to}} |

### Conditional Logic (Future Feature)

```
If {{node_1761158613020.assign_to}} equals "DEV"
  → Send to developer team webhook
Else
  → Send to general team webhook
```

## Technical Implementation

### Webhook Handling

When a WhatsApp Flow response is received:

```javascript
// 1. Detect flow response
if (message.interactive?.type === 'nfm_reply') {
  // 2. Parse response JSON
  const flowData = JSON.parse(message.interactive.nfm_reply.response_json);
  
  // 3. Store ALL fields dynamically
  responseData[nodeId] = flowData;
  
  // 4. Create individual field variables
  Object.keys(flowData).forEach(key => {
    responseData[`${nodeId}.${key}`] = flowData[key];
  });
  
  // 5. Resume execution with variables
  await resumeExecution(userPhone, flowId, responseData, storage);
}
```

### Variable Replacement

Variables are replaced in all text fields:

```javascript
function replaceVariables(text, variables) {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    return variables[varName.trim()] || match;
  });
}
```

## Debugging

### Check Available Variables

Look for these log messages:

```
✅ Captured 5 fields from flow response
📝 Available variables: {{node_1761158613020.task_name}}, {{node_1761158613020.task_details}}, ...
```

### Webhook Logs

Check the webhook logs in the UI:
1. Go to **Webhook Logs** section
2. Filter by flow ID
3. View the captured response data

### Console Logs

Server logs show:
```
🔄 WhatsApp Flow response detected
✅ Flow response parsed. Fields: ['task_name', 'task_details', 'due_date', 'due_time', 'assign_to']
📦 Flow data: { task_name: 'Fhh', task_details: 'Ghh', ... }
```

## Best Practices

### 1. **Use Descriptive Field Names**
In your WhatsApp Flow JSON:
```json
{
  "task_name": "...",      // ✅ Good - clear purpose
  "field1": "...",         // ❌ Bad - unclear
}
```

### 2. **Test with Small Flows First**
Start with a simple flow to understand the variable capture.

### 3. **Check Logs for Variable Names**
Always verify the exact field names in the logs.

### 4. **Use Node IDs Consistently**
Reference the same node ID throughout your flow.

## Supported Message Types

This dynamic variable system also works for:

### Buttons
```
{{node_id.id}}       → Button ID clicked
{{node_id.title}}    → Button text
```

### Lists
```
{{node_id.id}}          → List item ID
{{node_id.title}}       → List item title
{{node_id.description}} → List item description
```

### Location
```
{{location.latitude}}
{{location.longitude}}
{{location.name}}
{{location.address}}
```

## Troubleshooting

### Variables Not Showing Up

**Problem:** Variables like `{{node_id.field_name}}` show as-is instead of being replaced.

**Solutions:**
1. Check the node ID is correct
2. Verify the field name matches exactly (case-sensitive)
3. Check logs to see if the flow response was captured
4. Ensure the flow execution resumed properly

### Wrong Node ID

**Problem:** Using wrong node ID gives no data.

**Solution:**
- Check server logs for the correct node ID
- Copy the node ID from the "Stored response for node X" log message

### Flow Not Pausing

**Problem:** Flow continues without waiting for response.

**Solution:**
- Verify you're using the "Send Flow" node type
- Check WhatsApp API credentials are configured
- Review execution logs for pause confirmation

## Next Steps

1. ✅ Create a simple test flow
2. ✅ Send the flow and fill it out on WhatsApp
3. ✅ Check the logs to see captured variables
4. ✅ Use the variables in a confirmation message
5. ✅ Integrate with HTTP API or Google Sheets

## Support

For more information:
- Check `VARIABLE_GUIDE.md` for general variable usage
- Check `EXECUTION_GUIDE.md` for pause/resume system details
- Review server logs for debugging
- Test with the provided examples
