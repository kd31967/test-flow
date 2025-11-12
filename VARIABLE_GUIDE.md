# WhatsApp Flow Builder - Variable System Guide

## 📚 Table of Contents
1. [How Variable Capture Works](#how-variable-capture-works)
2. [Accessing Previous Node Variables](#accessing-previous-node-variables)
3. [Media File Handling](#media-file-handling)
4. [Node-Specific Variable Examples](#node-specific-variable-examples)
5. [Complete Flow Example](#complete-flow-example)

---

## How Variable Capture Works

Every node in your flow automatically captures its output as **variables** that subsequent nodes can access. When a node executes, it stores data in the execution context using this pattern:

```
context.variables[node_id] = {
  // Node-specific data
}
```

### Variable Naming Convention
- **Format**: `{{node_id.field_name}}`
- **Example**: `{{node_123.message_text}}` or `{{location_capture.latitude}}`

---

## Accessing Previous Node Variables

### Step 1: Find the Node ID
Every node has a unique ID (e.g., `node_123`, `location_capture`, `button_choice`). You can see the node ID:
- In the node configuration panel (shown below the node title)
- When you select a node in the canvas

### Step 2: Use the Variable Syntax
In any configuration field that supports variables, use double curly braces:

```
{{node_id.field_name}}
```

### Step 3: Common Variable Fields

| Node Type | Available Variables | Example Usage |
|-----------|-------------------|---------------|
| `on_message` (text) | `{{node_id.message_text}}` | Use received text |
| `on_message` (media) | `{{node_id.media.id}}`<br>`{{node_id.media.type}}`<br>`{{node_id.media.mime_type}}` | Download media files |
| `send_button` | `{{node_id.button_id}}`<br>`{{node_id.button_title}}` | Capture button click |
| `send_list` | `{{node_id.selected_id}}`<br>`{{node_id.selected_title}}`<br>`{{node_id.selected_description}}` | Capture list selection |
| `request_location` | `{{node_id.latitude}}`<br>`{{node_id.longitude}}`<br>`{{node_id.name}}`<br>`{{node_id.address}}` | Use shared location |
| `http` | `{{node_id.response}}` | Use API response |
| `ai_agent` | `{{node_id.completion}}` | Use AI output |

---

## Media File Handling

### How WhatsApp Handles Media

When users send media (images, videos, audio, documents), WhatsApp **does NOT send the actual file**. Instead, it sends **metadata** about the file:

```json
{
  "media": {
    "id": "wamid.HBgLMTY1MDU1NjQwNzgVAgARGBI5QUFEMTA3RDU4M0I5RTRGMUMAA",
    "type": "image",
    "mime_type": "image/jpeg",
    "caption": "Check out this photo!"
  }
}
```

### Step-by-Step: Download Media Files

#### 1. Capture Media Metadata
First node captures the media ID when user sends media:

**Node**: `on_message` (trigger)
- **Type**: Image/Video/Audio
- **Variables Created**:
  - `{{media_capture.media.id}}`
  - `{{media_capture.media.type}}`
  - `{{media_capture.media.mime_type}}`
  - `{{media_capture.media.caption}}`

#### 2. Download the File Using HTTP Request
Use the WhatsApp Media Download API:

**Node**: `http` (HTTP Request)
- **Method**: GET
- **URL**: `https://graph.facebook.com/v17.0/{{media_capture.media.id}}`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer YOUR_WHATSAPP_ACCESS_TOKEN"
  }
  ```
- **Variables Created**: `{{download_media.response}}`

#### 3. Get Download URL
The API returns a download URL:

```json
{
  "url": "https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=...",
  "mime_type": "image/jpeg",
  "sha256": "...",
  "file_size": 123456,
  "id": "wamid..."
}
```

#### 4. Download the Actual File

**Node**: `http` (HTTP Request #2)
- **Method**: GET
- **URL**: `{{download_media.response.url}}`
- **Headers**:
  ```json
  {
    "Authorization": "Bearer YOUR_WHATSAPP_ACCESS_TOKEN"
  }
  ```

#### 5. Store or Process the File
Now you have the actual media file! You can:
- Save it to your server
- Upload to cloud storage (S3, Google Cloud Storage)
- Process it (resize images, extract audio, etc.)
- Send to another API

### Example Variable Chain for Media

```
1. on_message (trigger) → {{msg.media.id}}
2. http (get URL) → {{get_url.response.url}}
3. http (download) → {{download.file_data}}
4. Store in database or cloud
```

---

## Node-Specific Variable Examples

### Example 1: Button Response Flow

**Flow**: Ask user to choose a product category

```
1. send_button (node: choose_category)
   - Body: "What are you looking for?"
   - Buttons:
     - ID: electronics, Title: 📱 Electronics
     - ID: clothing, Title: 👕 Clothing
     - ID: food, Title: 🍕 Food

2. send_message (node: confirm_choice)
   - Text: "Great! You selected: {{choose_category.button_title}}"
   
3. condition (node: check_category)
   - Condition: {{choose_category.button_id}} == "electronics"
   - If true → show electronics catalog
   - If false → show other categories
```

**Variables Available**:
- `{{choose_category.button_id}}` → "electronics"
- `{{choose_category.button_title}}` → "📱 Electronics"

---

### Example 2: Location-Based Service

**Flow**: User shares location, find nearby stores

```
1. request_location (node: get_location)
   - Body: "📍 Share your location to find stores near you"

2. http (node: find_stores)
   - Method: POST
   - URL: "https://api.yourservice.com/stores/nearby"
   - Body:
     {
       "latitude": {{get_location.latitude}},
       "longitude": {{get_location.longitude}},
       "radius": 5000
     }

3. send_message (node: show_results)
   - Text: "Found {{find_stores.response.count}} stores near {{get_location.name}}"
```

**Variables Available**:
- `{{get_location.latitude}}` → 37.7749
- `{{get_location.longitude}}` → -122.4194
- `{{get_location.name}}` → "San Francisco"
- `{{get_location.address}}` → "123 Market St, San Francisco, CA"
- `{{find_stores.response}}` → API response with stores

---

### Example 3: AI Chatbot with Context

**Flow**: User asks a question, AI responds with context

```
1. on_message (trigger: user_question)
   - Keywords: "help", "question", "ask"

2. ai_agent (node: ai_response)
   - Prompt: "User asked: {{user_question.message_text}}. Please provide a helpful response."
   - Model: gpt-4

3. send_message (node: send_answer)
   - Text: "{{ai_response.completion}}"

4. send_button (node: ask_followup)
   - Body: "Was this helpful?"
   - Buttons:
     - ID: yes, Title: ✅ Yes
     - ID: no, Title: ❌ No

5. condition (node: check_satisfaction)
   - If {{ask_followup.button_id}} == "no":
     → Connect to human agent
```

---

### Example 4: Form Data Collection

**Flow**: Collect user information step by step

```
1. send_message (node: ask_name)
   - Text: "What's your name?"

2. on_message (trigger: capture_name)
   - Wait for reply

3. send_message (node: ask_email)
   - Text: "Thanks {{capture_name.message_text}}! What's your email?"

4. on_message (trigger: capture_email)
   - Wait for reply

5. http (node: save_user)
   - Method: POST
   - URL: "https://api.yourdb.com/users"
   - Body:
     {
       "name": "{{capture_name.message_text}}",
       "email": "{{capture_email.message_text}}",
       "phone": "{{capture_name.from}}"
     }

6. send_message (node: confirm)
   - Text: "All set, {{capture_name.message_text}}! We'll contact you at {{capture_email.message_text}}"
```

---

## Complete Flow Example

### E-Commerce Order Flow

**Scenario**: User browses products, selects items, provides delivery location

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Welcome & Category Selection                        │
└─────────────────────────────────────────────────────────────┘

Node: send_button (ID: welcome)
  Body: "👋 Welcome to our store! What are you looking for?"
  Buttons:
    - electronics
    - clothing
    - food

Variables Created:
  - {{welcome.button_id}} = "electronics"
  - {{welcome.button_title}} = "Electronics"

┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Fetch Products from API                             │
└─────────────────────────────────────────────────────────────┘

Node: http (ID: get_products)
  Method: GET
  URL: https://api.store.com/products?category={{welcome.button_id}}

Variables Created:
  - {{get_products.response}} = [{"id": 1, "name": "iPhone", "price": 999}, ...]

┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Show Product List                                   │
└─────────────────────────────────────────────────────────────┘

Node: send_list (ID: product_list)
  Header: "Available Products"
  Body: "Choose a product:"
  Button: "Select"
  Sections:
    - Section 1:
      - Row 1: iPhone - $999
      - Row 2: MacBook - $1999

Variables Created:
  - {{product_list.selected_id}} = "iphone_15"
  - {{product_list.selected_title}} = "iPhone 15 Pro"

┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Request Delivery Location                           │
└─────────────────────────────────────────────────────────────┘

Node: request_location (ID: delivery_address)
  Body: "📍 Share your delivery location"

Variables Created:
  - {{delivery_address.latitude}} = 37.7749
  - {{delivery_address.longitude}} = -122.4194
  - {{delivery_address.address}} = "123 Market St"

┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Calculate Delivery Fee                              │
└─────────────────────────────────────────────────────────────┘

Node: http (ID: calc_delivery)
  Method: POST
  URL: https://api.delivery.com/calculate
  Body: {
    "lat": {{delivery_address.latitude}},
    "lng": {{delivery_address.longitude}}
  }

Variables Created:
  - {{calc_delivery.response.fee}} = 5.99

┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Create Order                                        │
└─────────────────────────────────────────────────────────────┘

Node: http (ID: create_order)
  Method: POST
  URL: https://api.store.com/orders
  Body: {
    "product": "{{product_list.selected_title}}",
    "delivery_address": "{{delivery_address.address}}",
    "delivery_fee": {{calc_delivery.response.fee}},
    "customer_phone": "{{delivery_address.from}}"
  }

Variables Created:
  - {{create_order.response.order_id}} = "ORD-12345"

┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Send Confirmation                                   │
└─────────────────────────────────────────────────────────────┘

Node: send_message (ID: confirmation)
  Text: "✅ Order confirmed! 

Order ID: {{create_order.response.order_id}}
Product: {{product_list.selected_title}}
Delivery to: {{delivery_address.address}}
Delivery fee: ${{calc_delivery.response.fee}}

Expected delivery: 30-45 minutes"
```

---

## 🎯 Key Takeaways

1. **Every node creates variables** using its node ID as the prefix
2. **Access variables** using `{{node_id.field_name}}` syntax
3. **Media files** require 2-step process: get metadata, then download
4. **Chain variables** from node to node to build complex flows
5. **Test your flow** by checking what variables each node creates

---

## 💡 Pro Tips

1. **Use descriptive node IDs**: Instead of `node_123`, rename to `capture_email` or `get_products`
2. **Check variable names**: Each node type creates different variables (see table above)
3. **Test with console.log**: Add a webhook node to see all variables in the execution context
4. **Handle missing data**: Use conditions to check if variables exist before using them
5. **Media downloads**: Always use the 2-step process (metadata → download URL → file)

---

## Need Help?

If you're stuck:
1. Check the node ID in the configuration panel
2. Verify the field name from the "Node-Specific Variables" table
3. Make sure you're using `{{node_id.field}}` syntax
4. Test with a simple send_message node to verify the variable value
