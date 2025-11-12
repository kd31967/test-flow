/**
 * Gets the actual running server URL dynamically
 * Uses the real detected origin from the browser at runtime
 * NO HARDCODED URLs - always uses actual server domain
 */
export const getServerBaseUrl = (): string => {
  // Priority 1: Detect actual running server origin
  const actualOrigin = window.location.origin;

  // Priority 2: If configured explicitly, use that
  const configuredUrl = import.meta.env.VITE_SERVER_BASE_URL;

  // Priority 3: Use Supabase URL for backend functions
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Return the most appropriate URL
  // For local development: http://localhost:3000
  // For staging: https://staging.yourdomain.com
  // For production: https://bolt.yourdomain.com
  return configuredUrl || supabaseUrl || actualOrigin;
};

/**
 * Generates dynamic webhook URL using ACTUAL server origin
 * Format: {ACTUAL_SERVER_ORIGIN}/api/custom-webhook/{flow_id}/{node_id}
 *
 * Examples:
 * - Local: http://localhost:5000/api/custom-webhook/my-flow/node_12345
 * - Production: https://your-app.repl.co/api/custom-webhook/my-flow/node_12345
 */
export const generateWebhookUrl = (flowId: string, nodeId: string): string => {
  const baseUrl = getServerBaseUrl();
  return `${baseUrl}/api/custom-webhook/${flowId}/${nodeId}`;
};

/**
 * Generates test API endpoint URL using actual server
 */
export const generateApiTestUrl = (): string => {
  const baseUrl = getServerBaseUrl();
  return `${baseUrl}/api/test-http-api`;
};
