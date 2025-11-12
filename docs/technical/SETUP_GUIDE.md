# Application Setup Guide

This application features a **fully automated setup system** that handles all initialization automatically.

## Automatic Setup Features

The application automatically:
- Validates database connection
- Checks all required tables exist
- Verifies configuration settings
- Displays real-time setup progress
- Provides detailed error reporting

## Quick Start

1. **Start the Application**
   ```bash
   npm install
   npm run dev
   ```

2. **The setup system will automatically:**
   - Connect to the Supabase database
   - Verify all tables are created
   - Check configuration validity
   - Display setup status in real-time

## Database Configuration

The application is pre-configured to connect to:
- **Host:** gdjjmdkjtlhufwriyaon.supabase.co
- **Database:** PostgreSQL (Supabase)

All tables are already created:
- ✓ flows
- ✓ flow_nodes
- ✓ flow_executions
- ✓ flow_analytics
- ✓ user_profiles
- ✓ templates
- ✓ webhook_logs

## Setup Validation

On startup, the application checks:

1. **Configuration Validation**
   - Supabase URL is set
   - Supabase Anon Key is set
   - URL format is valid

2. **Database Connection**
   - Can connect to database
   - Authentication works
   - Tables are accessible

3. **Table Verification**
   - All 7 required tables exist
   - Row Level Security is enabled
   - Proper indexes are in place

## Troubleshooting

If setup fails, the application will display:
- Specific error messages
- Which component failed
- Retry option

### Common Issues

**Database Connection Failed**
- Check internet connection
- Verify Supabase credentials in `.env`
- Ensure Supabase project is active

**Tables Missing**
- Database migrations have been applied automatically
- If still missing, check Supabase dashboard
- Verify RLS policies are enabled

**Configuration Invalid**
- Check `.env` file exists
- Verify VITE_SUPABASE_URL starts with https://
- Ensure VITE_SUPABASE_ANON_KEY is set

## Health Check API

The setup system provides a health check API:

```typescript
import { setupSystem } from './lib/setupSystem';

const health = await setupSystem.getHealthCheck();
console.log(health);
```

Returns:
```json
{
  "timestamp": "2025-10-19T...",
  "database": true,
  "auth": true,
  "tables": ["flows", "flow_nodes", ...],
  "errors": []
}
```

## Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to hosting**
   - All setup runs automatically on first load
   - No manual database setup required
   - Configuration is validated on startup

3. **Monitor health**
   - Check browser console for setup logs
   - Use health check API for monitoring
   - Setup status displayed in UI

## Architecture

```
┌─────────────────────────┐
│   Application Start     │
└───────────┬─────────────┘
            │
    ┌───────▼────────┐
    │ Setup System   │
    │  Initialize    │
    └───────┬────────┘
            │
    ┌───────▼───────────┐
    │   Validate        │
    │  Configuration    │
    └───────┬───────────┘
            │
    ┌───────▼───────────┐
    │  Test Database    │
    │   Connection      │
    └───────┬───────────┘
            │
    ┌───────▼───────────┐
    │  Verify Tables    │
    │    (7 tables)     │
    └───────┬───────────┘
            │
    ┌───────▼───────────┐
    │   Setup Status    │
    │   ✓ Ready or      │
    │   ✗ Failed        │
    └───────────────────┘
```

## Security Features

- Row Level Security (RLS) enabled on all tables
- Secure credential storage
- Environment variable validation
- Automatic connection pooling
- Error handling and logging

## Support

For issues or questions:
1. Check browser console for detailed logs
2. Review setup status display in UI
3. Verify `.env` configuration
4. Check Supabase project status
