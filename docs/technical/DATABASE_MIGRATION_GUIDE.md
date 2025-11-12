# Database Migration Guide - External Supabase Setup

## Overview

This guide provides complete instructions for migrating your WhatsApp Flow Builder to a **different Supabase instance** or connecting to an **external PostgreSQL database**.

**Current Database:**
- URL: `https://gdjjmdkjtlhufwriyaon.supabase.co`
- Type: Supabase (PostgreSQL 17.6)
- Status: Fully operational with all tables and data

---

## Migration Options

### Option 1: Migrate to New Supabase Project (Recommended)
✅ Keeps all features intact
✅ Edge Functions continue working
✅ Maintains security and RLS
✅ Minimal code changes

### Option 2: Connect to External PostgreSQL
⚠️ Loses Edge Functions
⚠️ Requires custom webhook server
⚠️ More complex setup
⚠️ Significant code modifications

---

## Option 1: Migrate to New Supabase Project

### Prerequisites

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version
```

### Step 1: Create New Supabase Project

1. **Go to Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Create New Project**
   - Click "New Project"
   - Organization: Select or create
   - Name: `whatsapp-flow-builder-new`
   - Database Password: Generate strong password
   - Region: Choose closest to your users
   - Plan: Select appropriate tier

3. **Wait for Project Setup**
   - Usually takes 2-3 minutes
   - Note your new project URL and keys

4. **Save New Credentials**
   ```
   Project URL: https://YOUR_NEW_PROJECT.supabase.co
   Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
   Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ...
   Database Password: [your password]
   ```

### Step 2: Export Current Database

**Method A: Using Supabase Dashboard**

1. Go to: `https://supabase.com/dashboard/project/gdjjmdkjtlhufwriyaon`
2. Navigate to: Database → Backups
3. Click "Download Backup"
4. Save file as: `whatsapp_backup.sql`

**Method B: Using pg_dump (Direct Export)**

```bash
# Export schema and data
pg_dump \
  -h db.gdjjmdkjtlhufwriyaon.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  --clean \
  --if-exists \
  --schema=public \
  -f whatsapp_backup.sql

# When prompted, enter database password
```

**Method C: Export Specific Tables Only**

```bash
# Export only application tables
pg_dump \
  -h db.gdjjmdkjtlhufwriyaon.supabase.co \
  -U postgres \
  -d postgres \
  -t public.flows \
  -t public.flow_nodes \
  -t public.flow_executions \
  -t public.flow_analytics \
  -t public.user_profiles \
  -t public.templates \
  -t public.webhook_logs \
  --data-only \
  -f whatsapp_data.sql
```

### Step 3: Apply Migrations to New Database

**Option A: Using Supabase CLI**

```bash
# Initialize Supabase in your project (if not already)
cd /path/to/your/project
supabase init

# Link to new project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Apply migrations
supabase db push

# Migrations will be applied from:
# - supabase/migrations/20251017103718_create_flow_builder_schema.sql
# - supabase/migrations/20251017152332_add_phone_number_id_to_user_profiles.sql
# - supabase/migrations/20251017182106_create_webhook_logs_table.sql
# - supabase/migrations/20251018081153_add_message_sent_column.sql
```

**Option B: Manual Migration Application**

1. **Access SQL Editor**
   ```
   New Supabase Dashboard → SQL Editor → New Query
   ```

2. **Run Each Migration File**

   Copy and paste content from each file in order:

   **Migration 1: Create Tables**
   ```sql
   -- Paste content from:
   -- supabase/migrations/20251017103718_create_flow_builder_schema.sql
   ```

   **Migration 2: Add Phone Number ID**
   ```sql
   -- Paste content from:
   -- supabase/migrations/20251017152332_add_phone_number_id_to_user_profiles.sql
   ```

   **Migration 3: Create Webhook Logs**
   ```sql
   -- Paste content from:
   -- supabase/migrations/20251017182106_create_webhook_logs_table.sql
   ```

   **Migration 4: Add Message Sent Column**
   ```sql
   -- Paste content from:
   -- supabase/migrations/20251018081153_add_message_sent_column.sql
   ```

### Step 4: Import Data

**Method A: Using Supabase SQL Editor**

```sql
-- Go to: New Supabase Dashboard → SQL Editor
-- Paste contents of whatsapp_backup.sql or whatsapp_data.sql
-- Run query
```

**Method B: Using psql**

```bash
# Import full backup
psql \
  -h db.YOUR_NEW_PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f whatsapp_backup.sql

# Or import data only
psql \
  -h db.YOUR_NEW_PROJECT.supabase.co \
  -U postgres \
  -d postgres \
  -p 5432 \
  -f whatsapp_data.sql
```

**Method C: Manual Data Import (Small Datasets)**

```sql
-- Example: Copy user profiles
INSERT INTO user_profiles (id, phone_number_id, whatsapp_access_token, subscription_tier, settings, created_at)
VALUES
  ('f3c49a8c-4ce4-4fdd-89d7-edaadcfc36ee', '712851615243145', 'YOUR_TOKEN', 'free', '{}', NOW());

-- Example: Copy flows
INSERT INTO flows (id, user_id, name, status, trigger_keywords, config)
VALUES
  ('e269ea1a-9977-48e2-a391-2766409005ee', 'f3c49a8c-4ce4-4fdd-89d7-edaadcfc36ee', 'Untitled Flow', 'active', '["test123"]', '{"nodes": {...}}');
```

### Step 5: Update Application Configuration

**Update Environment Variables**

Edit `.env` file:

```env
# OLD (keep as backup)
# VITE_SUPABASE_URL=https://gdjjmdkjtlhufwriyaon.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NEW - Replace with your new project credentials
VITE_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_new_anon_key_here
```

**Verify Configuration File**

File: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ✅ No changes needed - uses environment variables
```

### Step 6: Deploy Edge Functions

**Deploy whatsapp-webhook Function**

```bash
# Login to Supabase
supabase login

# Link to new project
supabase link --project-ref YOUR_NEW_PROJECT_REF

# Deploy Edge Function
supabase functions deploy whatsapp-webhook

# Deploy custom-webhook Function (if used)
supabase functions deploy custom-webhook
```

**Verify Deployment**

```bash
# List deployed functions
supabase functions list

# Expected output:
# whatsapp-webhook (ACTIVE)
# custom-webhook (ACTIVE)
```

### Step 7: Update Meta Webhook URL

**Update WhatsApp Webhook in Meta Portal**

1. Go to: https://developers.facebook.com/apps
2. Select your WhatsApp Business App
3. Navigate to: WhatsApp → Configuration → Webhook
4. Click "Edit"
5. Update Callback URL:
   ```
   https://YOUR_NEW_PROJECT.supabase.co/functions/v1/whatsapp-webhook
   ```
6. Verify Token remains: `my-verify-token`
7. Click "Verify and Save"

### Step 8: Test New Setup

**1. Test Database Connection**

```sql
-- Run in new Supabase SQL Editor
SELECT COUNT(*) FROM flows;
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM webhook_logs;
```

**2. Test Application**

```bash
# Rebuild application
npm run build

# Start development server
npm run dev
```

**3. Test WhatsApp Integration**

- Send "test123" to WhatsApp Business number
- Verify response received
- Check webhook_logs for new entry
- Check flow_executions for session

**4. Verify Edge Function Logs**

```
New Supabase Dashboard → Edge Functions → whatsapp-webhook → Logs
```

### Step 9: Cleanup (Optional)

**After Successful Migration:**

1. **Keep Old Instance Running for 7 Days**
   - Verify all features working
   - Ensure no data loss
   - Monitor for issues

2. **Final Verification Checklist**
   - [ ] All flows working
   - [ ] Webhook receiving messages
   - [ ] Responses sent successfully
   - [ ] User credentials migrated
   - [ ] Analytics data preserved
   - [ ] Edge Functions operational

3. **Decommission Old Instance**
   - Export final backup
   - Pause old Supabase project
   - Delete after 30 days (keeps option to restore)

---

## Option 2: Connect to External PostgreSQL Database

### Prerequisites

- External PostgreSQL database (v12+)
- Database host, port, username, password
- Public access or VPN connection
- SSL support recommended

### Step 1: Prepare External Database

**Create Database and User**

```sql
-- Connect to your PostgreSQL server
CREATE DATABASE whatsapp_flow_builder;

-- Create dedicated user
CREATE USER whatsapp_admin WITH PASSWORD 'secure_password_here';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE whatsapp_flow_builder TO whatsapp_admin;

-- Connect to the new database
\c whatsapp_flow_builder

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Step 2: Run Schema Migrations

```bash
# Export schema from current Supabase
pg_dump \
  -h db.gdjjmdkjtlhufwriyaon.supabase.co \
  -U postgres \
  -d postgres \
  --schema-only \
  --schema=public \
  -f schema_only.sql

# Import to external database
psql \
  -h YOUR_EXTERNAL_HOST \
  -U whatsapp_admin \
  -d whatsapp_flow_builder \
  -f schema_only.sql
```

### Step 3: Modify Application Code

**Create New Database Connection Module**

File: `src/lib/database.ts`

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
```

**Update Environment Variables**

```env
# External PostgreSQL Connection
DB_HOST=your_external_host.com
DB_PORT=5432
DB_NAME=whatsapp_flow_builder
DB_USER=whatsapp_admin
DB_PASSWORD=your_secure_password

# Keep Supabase for Auth (if using Supabase Auth)
VITE_SUPABASE_URL=https://gdjjmdkjtlhufwriyaon.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Step 4: Replace Database Calls

**Find and Replace All Supabase Queries**

❌ **Old Code:**
```typescript
const { data, error } = await supabase
  .from('flows')
  .select('*')
  .eq('status', 'active');
```

✅ **New Code:**
```typescript
const result = await query(
  'SELECT * FROM flows WHERE status = $1',
  ['active']
);
const data = result.rows;
```

**Files to Update:**
- `src/components/FlowList.tsx`
- `src/components/FlowBuilder.tsx`
- `src/components/Settings.tsx`
- Any component using `supabase.from()`

### Step 5: Replace Edge Functions with Custom Server

**⚠️ Critical: Edge Functions will NOT work with external database**

You need to create a custom Node.js/Express server:

**Create Webhook Server**

File: `server/webhook.js`

```javascript
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === 'my-verify-token') {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Webhook handler
app.post('/webhook', async (req, res) => {
  try {
    // Log webhook
    await pool.query(
      'INSERT INTO webhook_logs (method, webhook_payload) VALUES ($1, $2)',
      ['POST', req.body]
    );

    // Process webhook (port logic from Edge Function)
    const entry = req.body.entry?.[0];
    const messages = entry?.changes?.[0]?.value?.messages;

    if (messages && messages.length > 0) {
      const message = messages[0];
      const from = message.from;
      const text = message.text?.body;

      // Match flow trigger
      const flowResult = await pool.query(
        'SELECT * FROM flows WHERE status = $1 AND trigger_keywords ? $2',
        ['active', text]
      );

      // Execute flow...
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});
```

**Deploy Server**
- Use services like Heroku, Railway, or DigitalOcean
- Ensure public URL with SSL
- Update Meta webhook URL to your server

### Step 6: Replace Authentication

If using Supabase Auth with external database:

**Option A: Keep Supabase Auth (Recommended)**
- Use Supabase only for authentication
- Store auth.users reference in user_profiles
- Keep current auth implementation

**Option B: Implement Custom Auth**
- Use Passport.js or similar
- Hash passwords with bcrypt
- Implement JWT tokens
- Modify all auth components

### Step 7: Test External Connection

```bash
# Test database connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'YOUR_HOST',
  database: 'whatsapp_flow_builder',
  user: 'whatsapp_admin',
  password: 'YOUR_PASSWORD'
});
pool.query('SELECT NOW()', (err, res) => {
  console.log(err ? err : res.rows[0]);
  pool.end();
});
"
```

---

## Comparison: Supabase vs External PostgreSQL

| Feature | New Supabase Project | External PostgreSQL |
|---------|---------------------|-------------------|
| Setup Time | 🟢 30 minutes | 🔴 4-8 hours |
| Edge Functions | ✅ Works out of box | ❌ Need custom server |
| Authentication | ✅ Built-in | ❌ Must implement |
| Row Level Security | ✅ Automatic | ⚠️ Manual setup |
| Real-time Updates | ✅ Available | ❌ Need custom |
| Hosting | ✅ Managed | ❌ Self-hosted |
| Cost | 💰 $25/month+ | 💰 Varies |
| Maintenance | 🟢 Low | 🔴 High |
| Recommendation | ✅ **Recommended** | ⚠️ Only if required |

---

## Troubleshooting Migration Issues

### Issue: Connection Timeout

```bash
# Test connectivity
psql "postgresql://user:password@host:port/database?sslmode=require"

# If fails, check:
# - Firewall rules
# - Security groups
# - SSL requirements
# - Network connectivity
```

### Issue: Permission Denied

```sql
-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO whatsapp_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO whatsapp_admin;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO whatsapp_admin;
```

### Issue: Missing Extensions

```sql
-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg crypto";
```

### Issue: Data Import Fails

```bash
# Import in parts
psql ... -f schema_only.sql
psql ... -f data_only.sql
psql ... -f indexes.sql

# Or import table by table
psql ... -c "COPY flows FROM 'flows.csv' CSV HEADER;"
```

---

## Post-Migration Checklist

After completing migration:

- [ ] Database connection working
- [ ] All tables present with data
- [ ] RLS policies enabled
- [ ] Edge Functions deployed (if Supabase)
- [ ] Webhook endpoint updated in Meta
- [ ] Application connects successfully
- [ ] User authentication working
- [ ] Flows can be created and saved
- [ ] WhatsApp messages trigger flows
- [ ] Responses sent successfully
- [ ] Logs being recorded
- [ ] No errors in console
- [ ] Performance acceptable
- [ ] Backup of old database stored
- [ ] Old instance kept running for 7 days
- [ ] Documentation updated

---

## Recommendation

**Use Option 1: Migrate to New Supabase Project**

Reasons:
- ✅ Faster setup (30 minutes vs 8 hours)
- ✅ Maintains all features
- ✅ Edge Functions work without modification
- ✅ Lower maintenance burden
- ✅ Better security out of the box
- ✅ Automatic backups and scaling
- ✅ Built-in monitoring and logs

Only use Option 2 if you have specific requirements like:
- Existing enterprise PostgreSQL infrastructure
- Compliance requirements for data location
- Cost optimization at very large scale
- Integration with existing database tools

---

## Support

For migration assistance:
- Review migration logs carefully
- Test in development environment first
- Keep old database accessible during transition
- Monitor application logs post-migration
- Have rollback plan ready

---

**Migration Guide End**
