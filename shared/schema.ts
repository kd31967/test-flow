import { pgTable, uuid, text, timestamp, jsonb, boolean, integer, unique } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const flows = pgTable('flows', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description').default(''),
  category: text('category').default('Custom'),
  status: text('status').default('draft').$type<'draft' | 'active' | 'paused' | 'archived'>(),
  triggerKeywords: jsonb('trigger_keywords').$type<string[]>().default([]),
  config: jsonb('config').$type<Record<string, any>>().default({}),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const flowNodes = pgTable('flow_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  flowId: uuid('flow_id').notNull().references(() => flows.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),
  nodeType: text('node_type').notNull(),
  config: jsonb('config').$type<Record<string, any>>().default({}),
  position: jsonb('position').$type<{ x: number; y: number }>().default({ x: 0, y: 0 }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  unq: unique().on(table.flowId, table.nodeId),
}));

export const flowExecutions = pgTable('flow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  flowId: uuid('flow_id').notNull().references(() => flows.id, { onDelete: 'cascade' }),
  userPhone: text('user_phone').notNull(),
  status: text('status').default('running').$type<'running' | 'completed' | 'failed' | 'timeout'>(),
  currentNode: text('current_node'),
  variables: jsonb('variables').$type<Record<string, any>>().default({}),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const flowAnalytics = pgTable('flow_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  flowId: uuid('flow_id').notNull().references(() => flows.id, { onDelete: 'cascade' }),
  executionId: uuid('execution_id').references(() => flowExecutions.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  nodeId: text('node_id'),
  data: jsonb('data').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  businessName: text('business_name'),
  whatsappBusinessId: text('whatsapp_business_id'),
  whatsappAppId: text('whatsapp_app_id'),
  whatsappAccessToken: text('whatsapp_access_token'),
  phoneNumberId: text('phone_number_id'),
  subscriptionTier: text('subscription_tier').default('free').$type<'free' | 'pro' | 'enterprise'>(),
  settings: jsonb('settings').$type<Record<string, any>>().default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').default(''),
  category: text('category').notNull(),
  thumbnail: text('thumbnail'),
  config: jsonb('config').$type<Record<string, any>>().notNull(),
  isPublic: boolean('is_public').default(true),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const webhookLogs = pgTable('webhook_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at').defaultNow(),
  method: text('method').notNull(),
  fromPhone: text('from_phone'),
  messageType: text('message_type'),
  messageBody: text('message_body'),
  webhookPayload: jsonb('webhook_payload').$type<Record<string, any>>(),
  flowMatched: boolean('flow_matched').default(false),
  flowId: uuid('flow_id'),
  executionId: uuid('execution_id'),
  sessionFound: boolean('session_found').default(false),
  currentNode: text('current_node'),
  errorMessage: text('error_message'),
  whatsappResponse: jsonb('whatsapp_response').$type<Record<string, any>>(),
  processingTimeMs: integer('processing_time_ms'),
  webhookId: text('webhook_id'),
  nodeId: text('node_id'),
  headers: jsonb('headers').$type<Record<string, any>>(),
  body: jsonb('body').$type<Record<string, any>>(),
  queryParams: jsonb('query_params').$type<Record<string, any>>(),
  timestamp: text('timestamp'),
  userId: text('user_id'),
});

export const webhookExecutions = pgTable('webhook_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  flowId: uuid('flow_id').notNull().references(() => flows.id, { onDelete: 'cascade' }),
  nodeId: text('node_id').notNull(),
  requestData: jsonb('request_data').$type<Record<string, any>>().notNull().default({}),
  status: text('status').default('pending').$type<'pending' | 'processing' | 'completed' | 'failed'>(),
  result: jsonb('result').$type<Record<string, any>>(),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  userId: text('user_id'),
});

// Insert Schemas
export const insertFlowSchema = createInsertSchema(flows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFlowNodeSchema = createInsertSchema(flowNodes).omit({ id: true, createdAt: true });
export const insertFlowExecutionSchema = createInsertSchema(flowExecutions).omit({ id: true, startedAt: true });
export const insertFlowAnalyticsSchema = createInsertSchema(flowAnalytics).omit({ id: true, createdAt: true });
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({ createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true });
export const insertWebhookLogSchema = createInsertSchema(webhookLogs).omit({ id: true, createdAt: true });
export const insertWebhookExecutionSchema = createInsertSchema(webhookExecutions).omit({ id: true, createdAt: true, updatedAt: true });

// Insert Types
export type InsertFlow = z.infer<typeof insertFlowSchema>;
export type InsertFlowNode = z.infer<typeof insertFlowNodeSchema>;
export type InsertFlowExecution = z.infer<typeof insertFlowExecutionSchema>;
export type InsertFlowAnalytics = z.infer<typeof insertFlowAnalyticsSchema>;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type InsertWebhookLog = z.infer<typeof insertWebhookLogSchema>;
export type InsertWebhookExecution = z.infer<typeof insertWebhookExecutionSchema>;

// Select Types
export type Flow = typeof flows.$inferSelect;
export type FlowNode = typeof flowNodes.$inferSelect;
export type FlowExecution = typeof flowExecutions.$inferSelect;
export type FlowAnalytics = typeof flowAnalytics.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type WebhookLog = typeof webhookLogs.$inferSelect;
export type WebhookExecution = typeof webhookExecutions.$inferSelect;
