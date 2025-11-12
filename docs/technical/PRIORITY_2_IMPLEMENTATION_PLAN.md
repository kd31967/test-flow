# Priority 2: New Feature Implementations - Phased Rollout Plan

## Status: 📋 PLANNING PHASE - Ready for Phased Implementation

**Note:** This document outlines the implementation plan for Priority 2 features. Priority 1 critical bug fixes have been completed and are ready for deployment.

---

## Implementation Strategy

### Phased Approach

To maintain system stability and minimize risk, Priority 2 features will be implemented in the following phases:

**Phase 1:** Variable System & Core Infrastructure (2-3 weeks)
- Feature 1: Dynamic Variable & Unique ID System
- Feature 4: System Variables Implementation

**Phase 2:** External Integrations (2-3 weeks)
- Feature 2: HTTP API Integration Node
- Feature 3: Webhook Node Implementation

**Phase 3:** Advanced Integrations (2-3 weeks)
- Feature 5: Google Sheets Integration Node

**Phase 4:** Advanced Flow Control (1-2 weeks)
- Feature 6: Advanced Flow Control Features

---

## Feature 1: Dynamic Variable & Unique ID System

### Status: 🟡 REQUIRES IMPLEMENTATION

### Overview
Implement comprehensive variable system with unique identification, autocomplete functionality, and flow-scoped memory.

### Technical Requirements

#### 1.1 Unique Identification System

**Node ID Generation:**
```typescript
// Already implemented for duplication, extend for all node creation
const generateUniqueNodeId = (): string => {
  return `node_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

// Flow ID generation
const generateUniqueFlowId = (): string => {
  return `flow_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};
```

**Integration Points:**
- Flow creation (FlowBuilder.tsx)
- Node creation (Canvas.tsx - drag and drop)
- Flow import (Already has unique ID regeneration)
- Flow duplication (Already has unique ID regeneration)

#### 1.2 Dynamic Response Capture

**Variable Format:**
- `{{nodename.nodeid.response}}`
- `{{nodename.nodeid.response1}}`
- `{{nodename.nodeid.response2}}`

**Data Structure:**
```typescript
interface FlowVariable {
  nodeId: string;
  nodeName: string;
  responseKey: string;
  value: any;
  timestamp: number;
}

interface FlowExecutionContext {
  flowId: string;
  variables: Map<string, FlowVariable>;
  addVariable: (nodeId: string, key: string, value: any) => void;
  getVariable: (reference: string) => any;
  resolveVariables: (text: string) => string;
}
```

**Implementation Files:**
- New: `/src/lib/variableSystem.ts`
- Update: `/src/lib/flowExecutor.ts`
- Update: `/src/types/flow.ts`

#### 1.3 Variable Autocomplete System

**Trigger:** User types `{{` in any input field

**Component Structure:**
```typescript
interface VariableAutocompleteProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  availableVariables: FlowVariable[];
  onSelect: (variable: string) => void;
}

// Features:
// - Dropdown appears below cursor
// - Filters as user types
// - Shows format: {{nodename.nodeid.response}} – [Node Description]
// - Arrow key navigation
// - Enter to select
// - Escape to cancel
```

**Integration Points:**
- All text inputs in node configurations
- Message body fields
- API request body fields
- Webhook request fields

**Implementation Files:**
- New: `/src/components/VariableAutocomplete.tsx`
- Update: All node config components

#### 1.4 Flow Isolation

**Enforcement:**
- Variable scope limited to single flow execution
- No cross-flow references
- Independent variable namespaces

**Database Schema Changes:**
```sql
-- No schema changes required
-- Variables stored in flow_executions.variables (JSONB)
-- Already supports flow-scoped storage
```

### Implementation Checklist

- [ ] Create variable system module (`/src/lib/variableSystem.ts`)
- [ ] Implement variable extraction from text
- [ ] Implement variable resolution in flow executor
- [ ] Create autocomplete component
- [ ] Integrate autocomplete in all input fields
- [ ] Add variable validation (check for undefined references)
- [ ] Add visual indicators for valid/invalid variables
- [ ] Update flow executor to capture node responses
- [ ] Add variable panel to flow builder (optional UI enhancement)
- [ ] Write unit tests for variable system
- [ ] Write integration tests for variable resolution
- [ ] Update user documentation

### Estimated Effort
- Development: 8-10 days
- Testing: 3-4 days
- Documentation: 1-2 days

### Dependencies
None (can start immediately)

---

## Feature 2: HTTP API Integration Node

### Status: 🟡 REQUIRES IMPLEMENTATION

### Overview
Enable flows to call external APIs with support for all HTTP methods, authentication, and response capture.

### Technical Requirements

#### 2.1 Node Type Definition

```typescript
{
  type: 'http_api',
  label: 'HTTP API Request',
  icon: 'Globe',
  category: 'integration',
  config: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    headers: Array<{ key: string, value: string }>,
    body: string, // JSON string, supports variable interpolation
    authentication: {
      type: 'none' | 'bearer' | 'basic' | 'apikey',
      token?: string,
      username?: string,
      password?: string,
      apiKey?: string,
      apiKeyHeader?: string
    },
    timeout: number, // milliseconds
    validateSSL: boolean
  }
}
```

#### 2.2 Configuration UI Component

**File:** `/src/components/nodes/HTTPAPIConfig.tsx`

**Features:**
- Method selector (GET, POST, PUT, DELETE, PATCH)
- URL input with variable support
- Headers table (add/remove rows)
- Body editor (JSON with syntax highlighting)
- Authentication section (expandable)
- "Test API" button
- Timeout configuration
- SSL validation toggle

#### 2.3 Test API Functionality

```typescript
const testAPIRequest = async (config: HTTPAPIConfig) => {
  try {
    const response = await fetch(config.url, {
      method: config.method,
      headers: buildHeaders(config),
      body: config.body,
      signal: AbortSignal.timeout(config.timeout)
    });

    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      body: await response.json()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

#### 2.4 Runtime Execution

**File:** `/src/lib/flowExecutor.ts`

```typescript
private async executeHTTPAPI(node: NodeDefinition) {
  const { method, url, headers, body, authentication, timeout } = node.data.config;

  // Resolve variables in URL and body
  const resolvedUrl = this.context.resolveVariables(url);
  const resolvedBody = this.context.resolveVariables(body);

  // Build request
  const response = await fetch(resolvedUrl, {
    method,
    headers: this.buildHeaders(headers, authentication),
    body: resolvedBody,
    signal: AbortSignal.timeout(timeout || 30000)
  });

  // Capture response
  const responseData = await response.json();

  this.context.addVariable(node.id, 'status', response.status);
  this.context.addVariable(node.id, 'body', responseData);
  this.context.addVariable(node.id, 'headers', Object.fromEntries(response.headers));

  return node.data.config.next;
}
```

### Implementation Checklist

- [ ] Create HTTP API node type definition
- [ ] Create configuration UI component
- [ ] Implement header management (add/remove)
- [ ] Implement authentication options
- [ ] Add "Test API" functionality
- [ ] Implement runtime execution logic
- [ ] Add error handling for timeouts
- [ ] Add error handling for network failures
- [ ] Add error handling for invalid responses
- [ ] Capture response as variables
- [ ] Add node to palette
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Update documentation

### Estimated Effort
- Development: 6-8 days
- Testing: 2-3 days
- Documentation: 1 day

### Dependencies
- Feature 1 (Variable System) - REQUIRED for variable interpolation

---

## Feature 3: Webhook Node Implementation

### Status: 🟡 REQUIRES IMPLEMENTATION

### Overview
Allow flows to receive HTTP webhooks from external services with unique URLs and request capture.

### Technical Requirements

#### 3.1 Database Schema

```sql
-- Add webhook_url column to flow_nodes table
ALTER TABLE flow_nodes
ADD COLUMN webhook_id TEXT,
ADD COLUMN webhook_active BOOLEAN DEFAULT true;

CREATE INDEX idx_flow_nodes_webhook_id ON flow_nodes(webhook_id)
WHERE webhook_id IS NOT NULL;
```

#### 3.2 Edge Function: Webhook Handler

**File:** `/supabase/functions/webhook-receiver/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Extract webhook ID from URL
    const url = new URL(req.url);
    const webhookId = url.searchParams.get('id');

    if (!webhookId) {
      return new Response('Webhook ID required', { status: 400 });
    }

    // Find webhook node
    const supabase = createClient(/* ... */);
    const { data: node, error } = await supabase
      .from('flow_nodes')
      .select('*, flows(*)')
      .eq('webhook_id', webhookId)
      .eq('webhook_active', true)
      .single();

    if (error || !node) {
      return new Response('Webhook not found', { status: 404 });
    }

    // Capture request data
    const method = req.method;
    const headers = Object.fromEntries(req.headers);
    const body = await req.json().catch(() => null);

    // Store webhook data
    await supabase
      .from('webhook_logs')
      .insert({
        webhook_id: webhookId,
        method,
        headers,
        body,
        received_at: new Date().toISOString()
      });

    // Trigger flow execution
    // TODO: Implement flow execution trigger

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

#### 3.3 Webhook Configuration UI

**File:** `/src/components/nodes/WebhookConfig.tsx`

**Features:**
- Auto-generate webhook ID
- Display webhook URL (readonly, with copy button)
- Method selector (GET, POST, PUT, DELETE)
- Active/Inactive toggle
- Test webhook interface
- Recent webhook calls log
- Webhook security settings (optional: secret validation)

#### 3.4 Variable Capture

**Variables Created:**
- `{{webhook.webhookuniqueid.method}}` - HTTP method
- `{{webhook.webhookuniqueid.body}}` - Full request body
- `{{webhook.webhookuniqueid.body.fieldname}}` - Specific body field
- `{{webhook.webhookuniqueid.headers}}` - Request headers
- `{{webhook.webhookuniqueid.headers.authorization}}` - Specific header

### Implementation Checklist

- [ ] Create database migration for webhook columns
- [ ] Create webhook-receiver edge function
- [ ] Deploy edge function to Supabase
- [ ] Create webhook node type definition
- [ ] Create configuration UI component
- [ ] Implement webhook ID generation
- [ ] Display webhook URL with copy functionality
- [ ] Add webhook testing interface
- [ ] Implement webhook deactivation
- [ ] Create webhook_logs table
- [ ] Implement webhook log viewing
- [ ] Integrate with flow executor
- [ ] Add webhook variables to variable system
- [ ] Add node to palette
- [ ] Write tests
- [ ] Update documentation

### Estimated Effort
- Development: 8-10 days
- Testing: 3-4 days
- Documentation: 1-2 days

### Dependencies
- Feature 1 (Variable System) - REQUIRED for variable capture
- Supabase Edge Functions access - REQUIRED

---

## Feature 4: System Variables Implementation

### Status: 🟡 REQUIRES IMPLEMENTATION

### Overview
Provide globally accessible system variables for date/time in IST timezone.

### Technical Requirements

#### 4.1 System Variable Module

**File:** `/src/lib/systemVariables.ts`

```typescript
export class SystemVariables {
  private timezone = 'Asia/Kolkata';

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: this.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }); // Format: YYYY-MM-DD
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('en-GB', {
      timeZone: this.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }); // Format: HH:MM:SS
  }

  getCurrentDateTime(): string {
    return new Date().toISOString(); // Format: ISO 8601
  }

  getAll(): Record<string, string> {
    return {
      'system.current_date': this.getCurrentDate(),
      'system.current_time': this.getCurrentTime(),
      'system.current_date_time': this.getCurrentDateTime()
    };
  }
}
```

#### 4.2 Integration with Variable System

**Update:** `/src/lib/variableSystem.ts`

```typescript
export class FlowExecutionContext {
  private systemVariables: SystemVariables;

  constructor() {
    this.systemVariables = new SystemVariables();
  }

  resolveVariables(text: string): string {
    let resolved = text;

    // Resolve system variables first
    const systemVars = this.systemVariables.getAll();
    for (const [key, value] of Object.entries(systemVars)) {
      resolved = resolved.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }

    // Resolve flow variables
    // ... existing logic

    return resolved;
  }
}
```

#### 4.3 Autocomplete Integration

**Update:** `/src/components/VariableAutocomplete.tsx`

```typescript
const systemVariables = [
  {
    name: 'system.current_date',
    description: 'Current date (YYYY-MM-DD) in IST',
    example: '2025-10-19'
  },
  {
    name: 'system.current_time',
    description: 'Current time (HH:MM:SS) in IST',
    example: '14:30:45'
  },
  {
    name: 'system.current_date_time',
    description: 'Current date and time (ISO 8601)',
    example: '2025-10-19T14:30:45.123Z'
  }
];

// Show system variables first in autocomplete dropdown
// Always available, regardless of flow state
```

### Implementation Checklist

- [ ] Create system variables module
- [ ] Implement date formatting (IST timezone)
- [ ] Implement time formatting (IST timezone)
- [ ] Implement ISO datetime formatting
- [ ] Integrate with variable system
- [ ] Add to autocomplete suggestions
- [ ] Add unit tests for date/time accuracy
- [ ] Test timezone handling
- [ ] Update documentation

### Estimated Effort
- Development: 2-3 days
- Testing: 1 day
- Documentation: 1 day

### Dependencies
- Feature 1 (Variable System) - REQUIRED

---

## Feature 5: Google Sheets Integration Node

### Status: 🟡 REQUIRES IMPLEMENTATION

### Overview
Enable flows to create and update rows in Google Sheets using OAuth 2.0 authentication.

### Technical Requirements

#### 5.1 OAuth 2.0 Setup

**Global Settings Panel:**
- Add Google Sheets API credentials input
- Client ID field
- Client Secret field
- OAuth 2.0 authorization flow
- Store tokens securely in user_profiles table

**Database Schema:**
```sql
ALTER TABLE user_profiles
ADD COLUMN google_sheets_refresh_token TEXT,
ADD COLUMN google_sheets_access_token TEXT,
ADD COLUMN google_sheets_token_expiry TIMESTAMPTZ;
```

#### 5.2 Edge Function: Google Sheets Operations

**File:** `/supabase/functions/google-sheets/index.ts`

```typescript
// Handles token refresh and API calls
// Supports:
// - List spreadsheets
// - List worksheets
// - Append row
// - Update row
```

#### 5.3 Node Configuration UI

**Features:**
- OAuth connection status
- Spreadsheet selector (dropdown)
- Worksheet selector (dropdown)
- Operation selector (Create Row / Update Row)
- Column mapping interface
- Variable interpolation in cell values

### Implementation Checklist

- [ ] Set up Google Cloud Project
- [ ] Enable Google Sheets API
- [ ] Create OAuth 2.0 credentials
- [ ] Add OAuth fields to Settings component
- [ ] Create database migration for tokens
- [ ] Create google-sheets edge function
- [ ] Implement token refresh logic
- [ ] Implement spreadsheet listing
- [ ] Implement worksheet listing
- [ ] Implement row creation
- [ ] Implement row updating
- [ ] Create node configuration UI
- [ ] Add column mapping interface
- [ ] Integrate with variable system
- [ ] Add error handling
- [ ] Add rate limit handling
- [ ] Write tests
- [ ] Update documentation

### Estimated Effort
- Development: 10-12 days
- OAuth setup: 2 days
- Testing: 3-4 days
- Documentation: 2 days

### Dependencies
- Feature 1 (Variable System) - REQUIRED
- Google Cloud Project setup - REQUIRED
- Supabase Edge Functions - REQUIRED

---

## Feature 6: Advanced Flow Control Features

### Status: 🟡 REQUIRES IMPLEMENTATION

### Overview
Add delay, loop, merge, and error handling nodes for advanced flow control.

### Technical Requirements

#### 6.1 Delay/Wait Node

```typescript
{
  type: 'delay',
  config: {
    delayType: 'fixed' | 'variable',
    delayValue: number, // milliseconds
    delayVariable?: string, // {{variable.reference}}
    next: string
  }
}
```

#### 6.2 Loop/Iteration Node

```typescript
{
  type: 'loop',
  config: {
    arraySource: string, // {{variable.array}}
    itemVariable: string, // Name to store current item
    indexVariable: string, // Name to store current index
    loopBody: string, // Next node ID to execute for each item
    next: string // Next node after loop completes
  }
}
```

#### 6.3 Merge Node

```typescript
{
  type: 'merge',
  config: {
    waitFor: 'all' | 'any',
    inputs: string[], // Array of node IDs to wait for
    next: string
  }
}
```

#### 6.4 Error Handling Node

```typescript
{
  type: 'error_handler',
  config: {
    tryBranch: string, // Node to execute
    catchBranch: string, // Node to execute on error
    errorVariable: string, // Variable name to store error
    next: string
  }
}
```

### Implementation Checklist

- [ ] Create delay node type and config UI
- [ ] Implement delay execution logic
- [ ] Create loop node type and config UI
- [ ] Implement loop execution logic
- [ ] Create merge node type and config UI
- [ ] Implement merge execution logic
- [ ] Create error handler node type and config UI
- [ ] Implement error handling logic
- [ ] Add all nodes to palette
- [ ] Write tests for each node type
- [ ] Update documentation

### Estimated Effort
- Development: 8-10 days
- Testing: 3-4 days
- Documentation: 2 days

### Dependencies
- Feature 1 (Variable System) - REQUIRED

---

## Implementation Timeline

### Phase 1: Variable System (Weeks 1-3)
- Week 1: Variable system core infrastructure
- Week 2: Autocomplete component and integration
- Week 3: System variables and testing

### Phase 2: External Integrations (Weeks 4-6)
- Week 4: HTTP API node implementation
- Week 5: Webhook node implementation
- Week 6: Testing and bug fixes

### Phase 3: Advanced Integrations (Weeks 7-9)
- Week 7-8: Google Sheets integration
- Week 9: Testing and documentation

### Phase 4: Advanced Flow Control (Weeks 10-11)
- Week 10: Delay, loop, and merge nodes
- Week 11: Error handling and final testing

**Total Estimated Time:** 11-12 weeks

---

## Risk Assessment & Mitigation

### High-Risk Items

1. **Google Sheets OAuth Implementation**
   - Risk: Complex OAuth flow, token management
   - Mitigation: Use well-tested OAuth libraries, implement robust error handling

2. **Webhook Edge Function Reliability**
   - Risk: High traffic could overwhelm edge function
   - Mitigation: Implement rate limiting, queuing system

3. **Variable System Performance**
   - Risk: Complex variable resolution could slow execution
   - Mitigation: Cache resolved variables, optimize regex patterns

### Medium-Risk Items

1. **Loop Node Performance**
   - Risk: Large arrays could cause timeouts
   - Mitigation: Implement iteration limits, async execution

2. **HTTP API Timeout Handling**
   - Risk: External APIs could be slow or unavailable
   - Mitigation: Configurable timeouts, retry logic

---

## Success Criteria

### Feature 1: Variable System
- [ ] Variables can be defined and referenced across nodes
- [ ] Autocomplete appears when typing {{
- [ ] Invalid variable references are highlighted
- [ ] System variables always return current IST time

### Feature 2: HTTP API Node
- [ ] All HTTP methods supported
- [ ] Test API button works correctly
- [ ] Authentication methods functional
- [ ] Response captured as variables

### Feature 3: Webhook Node
- [ ] Unique webhook URLs generated
- [ ] Webhooks trigger flow execution
- [ ] Request data captured as variables
- [ ] Webhook logs accessible

### Feature 4: System Variables
- [ ] Date returns YYYY-MM-DD format in IST
- [ ] Time returns HH:MM:SS format in IST
- [ ] DateTime returns ISO 8601 format
- [ ] Available in all input fields

### Feature 5: Google Sheets
- [ ] OAuth authentication works
- [ ] Can list spreadsheets and worksheets
- [ ] Can create rows with variable data
- [ ] Can update rows with variable data

### Feature 6: Flow Control
- [ ] Delay node pauses execution correctly
- [ ] Loop node iterates over arrays
- [ ] Merge node waits for multiple inputs
- [ ] Error handler catches and handles errors

---

## Conclusion

Priority 2 features represent a significant enhancement to the platform's capabilities. The phased approach ensures:

1. **Stability:** Each phase is fully tested before moving to the next
2. **Dependency Management:** Features are implemented in logical order
3. **Risk Mitigation:** High-risk items get extra attention and testing
4. **User Value:** Each phase delivers tangible user benefits

**Recommendation:** Begin Phase 1 (Variable System) immediately after Priority 1 bug fixes are deployed and verified in production.
