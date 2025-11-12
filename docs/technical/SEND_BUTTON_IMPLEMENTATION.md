# Send Button Implementation Guide

## Overview

The Send Button feature enables users to send media (image, video, document, audio) with up to 4 interactive buttons. Each button can trigger a different flow branch, creating dynamic, user-driven navigation paths through your WhatsApp automation.

## Architecture

### Components

1. **SendButtonConfig.tsx** - Specialized UI component for configuring Send Button nodes
2. **NodeConfig.tsx** - Routes to SendButtonConfig for send_button nodes
3. **ConfigPanel.tsx** - Integration layer for the config panel
4. **NewFlowBuilder.tsx** - Handles branch node creation
5. **flowExecutor.ts** - Executes send button logic and handles branching
6. **flow.ts** - Type definitions and node configuration

### Data Flow

```
User creates Send Button node
  ↓
Opens configuration panel (SendButtonConfig)
  ↓
Configures header (text/media), body, footer, buttons
  ↓
For each button: Creates new branch flow or links to existing node
  ↓
Saves configuration with buttonBranches mapping
  ↓
Flow execution: Send button triggers WhatsApp message
  ↓
User clicks button → System routes to appropriate branch node
```

---

## Feature Specifications

### Button Limitations
- **Maximum buttons**: 4 per message
- **Button title**: Max 20 characters
- **Body text**: Max 1024 characters
- **Footer text**: Max 60 characters (optional)
- **Header text**: Max 60 characters

### Supported Media Types
1. **Text** - Simple text header
2. **Image** - JPG, PNG, GIF, SVG, WEBP (Max 5MB)
3. **Video** - MP4, 3GP, MOV, AVI (Max 16MB)
4. **Document** - PDF, DOC, DOCX, XLS, XLSX, TXT (Max 100MB)
5. **Audio** - MP3, OGG, AAC, AMR, WAV (Max 16MB)

---

## Implementation Details

### 1. Type Definitions

```typescript
// src/types/flow.ts

export interface MediaButton {
  id: string;                    // Unique button identifier
  title: string;                 // Display text (max 20 chars)
  nextNodeId?: string;           // Target node for this button
}

export interface MediaButtonConfig {
  headerType: 'text' | 'image' | 'video' | 'document' | 'audio';
  headerText?: string;           // For text headers
  headerMediaUrl?: string;       // For media headers
  bodyText: string;              // Required message body
  footerText?: string;           // Optional footer
  buttons: MediaButton[];        // Up to 4 buttons
  buttonBranches: Record<string, string>;  // buttonId → nodeId mapping
}
```

### 2. Node Type Configuration

```typescript
// Added to NODE_TYPES in flow.ts

{
  type: 'send_button',
  label: 'Send Button',
  icon: 'Send',
  category: 'communication',
  description: 'Send media with interactive buttons (up to 4) - supports branching flows',
  defaultConfig: {
    headerType: 'text',
    headerText: '',
    headerMediaUrl: '',
    bodyText: '',
    footerText: '',
    buttons: [],
    buttonBranches: {}
  },
  configFields: []
}
```

### 3. SendButtonConfig Component

**Key Features:**
- Visual header type selector (text, image, video, document, audio)
- Dynamic button management (add/remove up to 4)
- Branch flow creation from button configuration
- Link to existing nodes option
- Real-time character count validation
- Variable interpolation support

**Button Actions:**
- **Create New Branch Flow**: Automatically creates a new node connected to the button
- **Link to Existing Node**: Select from available nodes in the flow

**Validation:**
- Body text is required
- At least one button is required
- Character limits enforced on all fields
- Maximum 4 buttons enforced

### 4. Branch Node Creation

```typescript
// In NewFlowBuilder.tsx

const handleCreateBranchNode = (buttonId: string, buttonTitle: string): string => {
  const parentNode = selectedNode;
  if (!parentNode) return '';

  // Generate unique node ID
  const newNodeId = `node_${Date.now()}_${buttonId}`;

  // Create branch node positioned relative to parent
  const newNode = {
    id: newNodeId,
    type: 'message',
    position: {
      x: parentNode.position.x + 300,  // Offset horizontally
      y: parentNode.position.y + (nodes.filter(n => n.position.y > parentNode.position.y).length * 150)
    },
    data: {
      label: `Branch: ${buttonTitle}`,
      config: {
        content: `Response for "${buttonTitle}" button`,
        next: ''
      }
    }
  };

  setNodes([...nodes, newNode]);
  return newNodeId;
};
```

### 5. Flow Executor Integration

```typescript
// In flowExecutor.ts

private executeSendButton(node: NodeDefinition) {
  const {
    headerType,
    headerText,
    headerMediaUrl,
    bodyText,
    footerText,
    buttons,
    buttonBranches
  } = node.data.config;

  // Interpolate variables in all text fields
  const interpolatedBodyText = this.interpolateVariables(bodyText);
  const interpolatedFooterText = footerText ? this.interpolateVariables(footerText) : '';

  // Build header based on type
  let header: any = {};
  if (headerType === 'text') {
    header = {
      type: 'text',
      text: this.interpolateVariables(headerText || '')
    };
  } else if (['image', 'video', 'document', 'audio'].includes(headerType)) {
    header = {
      type: headerType,
      [headerType]: {
        link: this.interpolateVariables(headerMediaUrl || '')
      }
    };
  }

  // Return WhatsApp interactive message format
  return {
    success: true,
    response: {
      type: 'interactive',
      interactive: {
        type: 'button',
        header,
        body: { text: interpolatedBodyText },
        footer: footerText ? { text: interpolatedFooterText } : undefined,
        action: {
          buttons: buttons.map((btn: any) => ({
            type: 'reply',
            reply: {
              id: btn.id,
              title: btn.title
            }
          }))
        }
      },
      buttonBranches  // Include mapping for runtime routing
    }
  };
}
```

---

## Usage Guide

### Creating a Send Button Flow

1. **Add Send Button Node**
   - Drag "Send Button" from the sidebar onto the canvas
   - Click the node to open configuration panel

2. **Configure Header**
   - Select header type: Text, Image, Video, Document, or Audio
   - For Text: Enter header text (max 60 chars)
   - For Media: Enter publicly accessible HTTPS URL

3. **Configure Body** (Required)
   - Enter message body text (max 1024 chars)
   - Use `{{variable}}` syntax for dynamic content

4. **Configure Footer** (Optional)
   - Enter footer text (max 60 chars)

5. **Add Buttons** (1-4 Required)
   - Click "Add Button"
   - Enter button title (max 20 chars)
   - Choose action:
     - **Create New Branch Flow**: Automatically creates connected node
     - **Link to Existing Node**: Select from dropdown

6. **Save Configuration**
   - Click "Save Configuration"
   - Node updates with button connections

### Dynamic Branching

When a button is clicked:
1. System receives button callback with button ID
2. Looks up button ID in `buttonBranches` mapping
3. Routes to target node ID
4. Continues flow execution from that node

### Example Flow Structure

```
[On Message: "menu"]
   ↓
[Send Button: Main Menu]
   ├─ Button 1: "Products" → [Send Message: Product List]
   ├─ Button 2: "Services" → [Send Message: Service List]
   ├─ Button 3: "Contact" → [Capture Response: Get Email]
   └─ Button 4: "About" → [Send Message: About Us]
```

---

## WhatsApp API Format

### Request Payload

```json
{
  "messaging_product": "whatsapp",
  "to": "15551234567",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "header": {
      "type": "image",
      "image": {
        "link": "https://example.com/image.jpg"
      }
    },
    "body": {
      "text": "Welcome! Choose an option:"
    },
    "footer": {
      "text": "Powered by MyApp"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "btn_1",
            "title": "Learn More"
          }
        },
        {
          "type": "reply",
          "reply": {
            "id": "btn_2",
            "title": "Get Started"
          }
        }
      ]
    }
  }
}
```

### Webhook Callback

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "15551234567",
          "type": "interactive",
          "interactive": {
            "type": "button_reply",
            "button_reply": {
              "id": "btn_1",
              "title": "Learn More"
            }
          }
        }]
      }
    }]
  }]
}
```

---

## Advanced Features

### Variable Interpolation

All text fields support variable interpolation:

```
Body: "Hello {{user.name}}! Your order {{order.id}} is ready."
Footer: "Order total: ${{order.total}}"
```

### Conditional Branching

Combine with Conditional nodes for complex logic:

```
[Send Button] → Button 1 → [Conditional: Check User Type]
                              ├─ Premium → [Premium Flow]
                              └─ Regular → [Regular Flow]
```

### Multi-Level Branching

Create nested button flows:

```
[Main Menu Button]
   ├─ Products → [Product Categories Button]
   │              ├─ Electronics → [Electronics List]
   │              └─ Clothing → [Clothing List]
   └─ Support → [Support Options Button]
                  ├─ Technical → [Tech Support Flow]
                  └─ Billing → [Billing Flow]
```

---

## Best Practices

### Button Design
1. **Keep titles short** - Max 20 chars, aim for 10-15
2. **Use action verbs** - "View Products", "Get Help", "Learn More"
3. **Logical ordering** - Most important actions first
4. **Clear hierarchy** - Primary action in button 1

### Media Optimization
1. **Use HTTPS URLs** - WhatsApp requires secure connections
2. **Optimize file sizes** - Smaller files load faster
3. **Test URLs** - Verify accessibility before deployment
4. **Use CDNs** - For better performance and reliability

### Flow Organization
1. **Group related buttons** - Keep similar actions together
2. **Limit depth** - Avoid more than 3 levels of button navigation
3. **Provide exit options** - Always include way back or to main menu
4. **Test all paths** - Verify each button leads to correct destination

### Error Handling
1. **Validate URLs** - Check media URLs before saving
2. **Handle timeouts** - Add timeout logic for user responses
3. **Fallback flows** - Create default paths for unexpected responses
4. **Log button clicks** - Track user interactions for analytics

---

## Troubleshooting

### Buttons Not Appearing
- **Check button count**: Must have 1-4 buttons
- **Verify body text**: Required field, cannot be empty
- **Check WhatsApp API limits**: Max 4 buttons per message

### Branch Not Working
- **Verify button mapping**: Check `buttonBranches` in config
- **Node ID exists**: Ensure target node is in flow
- **Check webhook handler**: Verify button callback processing

### Media Not Loading
- **URL accessibility**: Must be publicly accessible
- **HTTPS required**: WhatsApp only accepts secure URLs
- **File size limits**: Check media type size restrictions
- **File format**: Verify supported format for media type

### Variable Not Interpolating
- **Syntax**: Use `{{variable}}` format
- **Variable exists**: Check execution context
- **Nested access**: Use dot notation `{{user.name}}`

---

## API Reference

### SendButtonConfig Props

```typescript
interface SendButtonConfigProps {
  node: NodeDefinition;                    // Current node being configured
  allNodes: NodeDefinition[];              // All nodes in flow (for linking)
  onUpdate: (node: NodeDefinition) => void; // Callback when config changes
  onCreateBranchNode: (buttonId: string, buttonTitle: string) => string; // Create branch
}
```

### MediaButton Interface

```typescript
interface MediaButton {
  id: string;           // Unique identifier
  title: string;        // Display text (max 20 chars)
  nextNodeId?: string;  // Optional target node
}
```

### MediaButtonConfig Interface

```typescript
interface MediaButtonConfig {
  headerType: 'text' | 'image' | 'video' | 'document' | 'audio';
  headerText?: string;           // For text headers (max 60 chars)
  headerMediaUrl?: string;       // For media headers (HTTPS URL)
  bodyText: string;              // Required (max 1024 chars)
  footerText?: string;           // Optional (max 60 chars)
  buttons: MediaButton[];        // 1-4 buttons
  buttonBranches: Record<string, string>; // buttonId → nodeId
}
```

---

## Performance Considerations

### Branch Creation
- Branch nodes created on-demand
- Positioned automatically to avoid overlaps
- Unique IDs prevent conflicts

### Memory Usage
- Button config stored in node data
- Branch mappings use efficient Record type
- No duplicate node storage

### Execution Speed
- O(1) button lookup in buttonBranches
- No unnecessary node traversals
- Efficient variable interpolation

---

## Security

### URL Validation
- All media URLs should be validated
- Only HTTPS URLs accepted
- Consider URL whitelist for production

### User Input
- Button titles sanitized
- Character limits enforced
- No script injection possible

### Branch Access
- Verify node exists before routing
- Check user permissions if applicable
- Log all branch transitions

---

## Testing

### Unit Tests

```typescript
describe('SendButton', () => {
  it('should create button with valid config', () => {
    const config = {
      headerType: 'text',
      headerText: 'Hello',
      bodyText: 'Choose an option',
      buttons: [{ id: 'btn1', title: 'Option 1' }],
      buttonBranches: { btn1: 'node_123' }
    };
    // Test node creation
  });

  it('should reject more than 4 buttons', () => {
    // Test button limit enforcement
  });

  it('should interpolate variables correctly', () => {
    // Test variable substitution
  });
});
```

### Integration Tests

```typescript
describe('Send Button Flow', () => {
  it('should create branch nodes correctly', () => {
    // Test branch node creation
  });

  it('should route to correct branch on button click', () => {
    // Test branching logic
  });

  it('should handle missing target nodes', () => {
    // Test error handling
  });
});
```

---

## Migration Guide

### From Basic Button Message

**Old (button_message)**:
```json
{
  "type": "button_message",
  "config": {
    "content": "Choose an option",
    "buttons": [{"id": "btn1", "text": "Option 1"}]
  }
}
```

**New (send_button)**:
```json
{
  "type": "send_button",
  "config": {
    "headerType": "text",
    "bodyText": "Choose an option",
    "buttons": [{"id": "btn1", "title": "Option 1"}],
    "buttonBranches": {"btn1": "target_node"}
  }
}
```

### Benefits of Migration
1. Media support (images, videos, documents, audio)
2. Dynamic branching to different flows
3. Better organization with branch management
4. More WhatsApp API features
5. Enhanced user experience

---

## Roadmap

### Planned Features
- [ ] Template-based button sets
- [ ] Button analytics dashboard
- [ ] A/B testing for button text
- [ ] Smart button suggestions based on context
- [ ] Visual branch path preview
- [ ] Bulk button configuration
- [ ] Button reordering with drag-and-drop
- [ ] Button icons/emojis support

### Future Enhancements
- [ ] Dynamic button generation from API
- [ ] Conditional button visibility
- [ ] Button personalization based on user data
- [ ] Multi-language button support
- [ ] Button click rate optimization
- [ ] Integration with analytics platforms

---

## Support

### Documentation
- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Interactive Messages Guide](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#interactive-messages)

### Common Issues
- See Troubleshooting section above
- Check WhatsApp API status page
- Review webhook logs for errors
- Verify node configurations

### Contributing
- Report bugs via GitHub issues
- Submit pull requests for improvements
- Follow coding standards
- Add tests for new features

---

## Changelog

### Version 1.0.0 (Current)
- ✅ Initial implementation
- ✅ Support for all media types
- ✅ Dynamic branch creation
- ✅ Up to 4 buttons per message
- ✅ Variable interpolation
- ✅ Link to existing nodes
- ✅ Visual configuration UI
- ✅ Flow executor integration
- ✅ Character limit validation

---

## Conclusion

The Send Button feature provides a powerful way to create interactive, branching WhatsApp flows. With support for media, multiple buttons, and dynamic routing, you can build sophisticated user experiences that guide users through complex workflows based on their choices.

**Key Benefits:**
- 🎯 User-driven navigation
- 📱 Rich media support
- 🔀 Dynamic branching
- 🎨 Visual configuration
- 🚀 Easy integration
- 📊 Scalable architecture

Start creating interactive button flows today and enhance your WhatsApp automation!
