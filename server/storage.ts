import { eq, and, desc } from 'drizzle-orm';
import { db } from './db.js';
import * as schema from '../shared/schema.js';
import type {
  Flow,
  FlowNode,
  FlowExecution,
  FlowAnalytics,
  UserProfile,
  Template,
  WebhookLog,
  WebhookExecution,
  InsertFlow,
  InsertFlowNode,
  InsertFlowExecution,
  InsertFlowAnalytics,
  InsertUserProfile,
  InsertTemplate,
  InsertWebhookLog,
  InsertWebhookExecution,
} from '../shared/schema.js';

export interface IStorage {
  // Flows
  getFlows(userId: string): Promise<Flow[]>;
  getFlow(id: string, userId: string): Promise<Flow | null>;
  getFlowByTrigger(keyword: string): Promise<Flow | null>;
  createFlow(flow: InsertFlow): Promise<Flow>;
  updateFlow(id: string, userId: string, updates: Partial<InsertFlow>): Promise<Flow | null>;
  deleteFlow(id: string, userId: string): Promise<boolean>;

  // Flow Nodes
  getFlowNodes(flowId: string): Promise<FlowNode[]>;
  createFlowNode(node: InsertFlowNode): Promise<FlowNode>;
  deleteFlowNodes(flowId: string): Promise<void>;

  // Flow Executions
  getFlowExecutions(flowId: string): Promise<FlowExecution[]>;
  getFlowExecution(id: string): Promise<FlowExecution | null>;
  getActiveExecution(flowId: string, userPhone: string): Promise<FlowExecution | null>;
  createFlowExecution(execution: InsertFlowExecution): Promise<FlowExecution>;
  updateFlowExecution(id: string, updates: Partial<InsertFlowExecution>): Promise<FlowExecution | null>;

  // Flow Analytics
  createFlowAnalytics(analytics: InsertFlowAnalytics): Promise<FlowAnalytics>;
  getFlowAnalytics(flowId: string): Promise<FlowAnalytics[]>;

  // User Profiles
  getUserProfile(id: string): Promise<UserProfile | null>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(id: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | null>;

  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | null>;
  createTemplate(template: InsertTemplate): Promise<Template>;

  // Webhook Logs
  createWebhookLog(log: InsertWebhookLog): Promise<WebhookLog>;
  getWebhookLogs(limit?: number): Promise<WebhookLog[]>;

  // Webhook Executions
  createWebhookExecution(execution: InsertWebhookExecution): Promise<WebhookExecution>;
  getWebhookExecutions(flowId: string): Promise<WebhookExecution[]>;
  updateWebhookExecution(id: string, updates: Partial<InsertWebhookExecution>): Promise<WebhookExecution | null>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private flows: Flow[] = [];
  private flowNodes: FlowNode[] = [];
  private flowExecutions: FlowExecution[] = [];
  private flowAnalytics: FlowAnalytics[] = [];
  private userProfiles: UserProfile[] = [];
  private templates: Template[] = [];
  private webhookLogs: WebhookLog[] = [];
  private webhookExecutions: WebhookExecution[] = [];

  async getFlows(userId: string): Promise<Flow[]> {
    return this.flows.filter(f => f.userId === userId);
  }

  async getFlow(id: string, userId: string): Promise<Flow | null> {
    return this.flows.find(f => f.id === id && f.userId === userId) || null;
  }

  async getFlowByTrigger(keyword: string): Promise<Flow | null> {
    const lowerKeyword = keyword.toLowerCase();
    return this.flows.find(f => 
      f.status === 'active' && 
      Array.isArray(f.triggerKeywords) &&
      f.triggerKeywords.some((k: string) => k.toLowerCase() === lowerKeyword)
    ) || null;
  }

  async createFlow(flow: InsertFlow): Promise<Flow> {
    const newFlow: Flow = {
      ...flow,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.flows.push(newFlow);
    return newFlow;
  }

  async updateFlow(id: string, userId: string, updates: Partial<InsertFlow>): Promise<Flow | null> {
    const index = this.flows.findIndex(f => f.id === id && f.userId === userId);
    if (index === -1) return null;
    this.flows[index] = { ...this.flows[index], ...updates, updatedAt: new Date() };
    return this.flows[index];
  }

  async deleteFlow(id: string, userId: string): Promise<boolean> {
    const index = this.flows.findIndex(f => f.id === id && f.userId === userId);
    if (index === -1) return false;
    this.flows.splice(index, 1);
    this.flowNodes = this.flowNodes.filter(n => n.flowId !== id);
    return true;
  }

  async getFlowNodes(flowId: string): Promise<FlowNode[]> {
    return this.flowNodes.filter(n => n.flowId === flowId);
  }

  async createFlowNode(node: InsertFlowNode): Promise<FlowNode> {
    const newNode: FlowNode = {
      ...node,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.flowNodes.push(newNode);
    return newNode;
  }

  async deleteFlowNodes(flowId: string): Promise<void> {
    this.flowNodes = this.flowNodes.filter(n => n.flowId !== flowId);
  }

  async getFlowExecutions(flowId: string): Promise<FlowExecution[]> {
    return this.flowExecutions.filter(e => e.flowId === flowId);
  }

  async getFlowExecution(id: string): Promise<FlowExecution | null> {
    return this.flowExecutions.find(e => e.id === id) || null;
  }

  async getActiveExecution(flowId: string, userPhone: string): Promise<FlowExecution | null> {
    return this.flowExecutions.find(
      e => e.flowId === flowId && e.userPhone === userPhone && e.status === 'running'
    ) || null;
  }

  async createFlowExecution(execution: InsertFlowExecution): Promise<FlowExecution> {
    const newExecution: FlowExecution = {
      ...execution,
      id: crypto.randomUUID(),
      startedAt: new Date(),
    };
    this.flowExecutions.push(newExecution);
    return newExecution;
  }

  async updateFlowExecution(id: string, updates: Partial<InsertFlowExecution>): Promise<FlowExecution | null> {
    const index = this.flowExecutions.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.flowExecutions[index] = { ...this.flowExecutions[index], ...updates };
    return this.flowExecutions[index];
  }

  async createFlowAnalytics(analytics: InsertFlowAnalytics): Promise<FlowAnalytics> {
    const newAnalytics: FlowAnalytics = {
      ...analytics,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.flowAnalytics.push(newAnalytics);
    return newAnalytics;
  }

  async getFlowAnalytics(flowId: string): Promise<FlowAnalytics[]> {
    return this.flowAnalytics.filter(a => a.flowId === flowId);
  }

  async getUserProfile(id: string): Promise<UserProfile | null> {
    return this.userProfiles.find(p => p.id === id) || null;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const newProfile: UserProfile = {
      ...profile,
      createdAt: new Date(),
    };
    this.userProfiles.push(newProfile);
    return newProfile;
  }

  async updateUserProfile(id: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | null> {
    const index = this.userProfiles.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.userProfiles[index] = { ...this.userProfiles[index], ...updates };
    return this.userProfiles[index];
  }

  async getTemplates(): Promise<Template[]> {
    return this.templates.filter(t => t.isPublic);
  }

  async getTemplate(id: string): Promise<Template | null> {
    return this.templates.find(t => t.id === id) || null;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const newTemplate: Template = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.templates.push(newTemplate);
    return newTemplate;
  }

  async createWebhookLog(log: InsertWebhookLog): Promise<WebhookLog> {
    const newLog: WebhookLog = {
      ...log,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    this.webhookLogs.push(newLog);
    return newLog;
  }

  async getWebhookLogs(limit: number = 100): Promise<WebhookLog[]> {
    return this.webhookLogs.slice(-limit);
  }

  async createWebhookExecution(execution: InsertWebhookExecution): Promise<WebhookExecution> {
    const newExecution: WebhookExecution = {
      ...execution,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.webhookExecutions.push(newExecution);
    return newExecution;
  }

  async getWebhookExecutions(flowId: string): Promise<WebhookExecution[]> {
    return this.webhookExecutions.filter(e => e.flowId === flowId);
  }

  async updateWebhookExecution(id: string, updates: Partial<InsertWebhookExecution>): Promise<WebhookExecution | null> {
    const index = this.webhookExecutions.findIndex(e => e.id === id);
    if (index === -1) return null;
    this.webhookExecutions[index] = { ...this.webhookExecutions[index], ...updates, updatedAt: new Date() };
    return this.webhookExecutions[index];
  }
}

// Database storage implementation using Drizzle ORM
export class DbStorage implements IStorage {
  async getFlows(userId: string): Promise<Flow[]> {
    const flows = await db.select().from(schema.flows).where(eq(schema.flows.userId, userId));
    
    return flows.map(flow => {
      if (typeof flow.config === 'string') {
        try {
          flow.config = JSON.parse(flow.config);
        } catch (e) {
          console.error('Failed to parse flow config:', e);
          flow.config = {};
        }
      }
      return flow;
    });
  }

  async getFlow(id: string, userId: string): Promise<Flow | null> {
    const results = await db.select().from(schema.flows)
      .where(and(eq(schema.flows.id, id), eq(schema.flows.userId, userId)));
    const flow = results[0] || null;
    
    if (flow && typeof flow.config === 'string') {
      try {
        flow.config = JSON.parse(flow.config);
      } catch (e) {
        console.error('Failed to parse flow config:', e);
        flow.config = {};
      }
    }
    
    return flow;
  }

  async getFlowByTrigger(keyword: string): Promise<Flow | null> {
    const allFlows = await db.select().from(schema.flows).where(eq(schema.flows.status, 'active'));
    const lowerKeyword = keyword.toLowerCase().trim();
    
    const flow = allFlows.find(f => {
      // Parse config if string
      let config = f.config;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          console.error('Failed to parse flow config:', e);
          config = {};
        }
      }
      
      // Check triggerKeywords column first
      if (Array.isArray(f.triggerKeywords) && f.triggerKeywords.length > 0) {
        const matches = f.triggerKeywords.some((k: string) => k.toLowerCase().trim() === lowerKeyword);
        if (matches) {
          console.log(`✅ Flow "${f.name}" matched keyword "${keyword}" from triggerKeywords column`);
          return true;
        }
      }
      
      // Fallback: check keywords in config.trigger.data.config.keywords
      const configKeywords = (config as any)?.trigger?.data?.config?.keywords;
      if (configKeywords) {
        const keywordList = typeof configKeywords === 'string' 
          ? configKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
          : Array.isArray(configKeywords) ? configKeywords : [];
        
        const matches = keywordList.some((k: string) => k.toLowerCase().trim() === lowerKeyword);
        if (matches) {
          console.log(`✅ Flow "${f.name}" matched keyword "${keyword}" from config.trigger`);
          return true;
        }
      }
      
      // Also check all on_message nodes in config.nodes
      const nodes = (config as any)?.nodes;
      if (Array.isArray(nodes)) {
        for (const node of nodes) {
          if (node.type === 'on_message') {
            const nodeKeywords = node.config?.keywords || '';
            const keywordList = typeof nodeKeywords === 'string'
              ? nodeKeywords.split(',').map((k: string) => k.trim()).filter(Boolean)
              : Array.isArray(nodeKeywords) ? nodeKeywords : [];
            
            const matches = keywordList.some((k: string) => k.toLowerCase().trim() === lowerKeyword);
            if (matches) {
              console.log(`✅ Flow "${f.name}" matched keyword "${keyword}" from on_message node`);
              return true;
            }
          }
        }
      }
      
      return false;
    }) || null;
    
    if (flow && typeof flow.config === 'string') {
      try {
        flow.config = JSON.parse(flow.config);
      } catch (e) {
        console.error('Failed to parse flow config:', e);
        flow.config = {};
      }
    }
    
    if (!flow) {
      console.log(`⚠️ No active flow found for keyword "${keyword}"`);
    }
    
    return flow;
  }

  async createFlow(flow: InsertFlow): Promise<Flow> {
    // Normalize config to ensure it's always an object with nodes and edges arrays
    let normalizedFlow = { ...flow };
    
    if (normalizedFlow.config) {
      let normalizedConfig = normalizedFlow.config;
      
      if (typeof normalizedConfig === 'string') {
        try {
          normalizedConfig = JSON.parse(normalizedConfig);
        } catch (e) {
          console.error('Failed to parse config string, using empty config');
          normalizedConfig = { nodes: [], edges: [] };
        }
      }
      
      if (typeof normalizedConfig !== 'object' || normalizedConfig === null) {
        normalizedConfig = { nodes: [], edges: [] };
      }
      
      // Convert nodes object to array format if needed
      if ((normalizedConfig as any).nodes && !Array.isArray((normalizedConfig as any).nodes) && typeof (normalizedConfig as any).nodes === 'object') {
        const nodesObj = (normalizedConfig as any).nodes;
        const nodesArray: any[] = [];
        const edgesArray: any[] = [];
        
        Object.entries(nodesObj).forEach(([nodeId, nodeData]: [string, any]) => {
          nodesArray.push({
            id: nodeId,
            type: nodeData.type,
            config: nodeData.config || {},
            position: nodeData.position || { x: 0, y: 0 }
          });
          
          // Create edges from 'next' relationships
          if (nodeData.next) {
            edgesArray.push({
              id: `${nodeId}-${nodeData.next}`,
              source: nodeId,
              target: nodeData.next,
              sourceHandle: null,
              targetHandle: null
            });
          }
        });
        
        (normalizedConfig as any).nodes = nodesArray;
        (normalizedConfig as any).edges = edgesArray;
      }
      
      // Ensure nodes and edges are arrays
      if (!Array.isArray((normalizedConfig as any).nodes)) {
        (normalizedConfig as any).nodes = [];
      }
      if (!Array.isArray((normalizedConfig as any).edges)) {
        (normalizedConfig as any).edges = [];
      }
      
      normalizedFlow.config = normalizedConfig;
    }
    
    const results = await db.insert(schema.flows).values(normalizedFlow).returning();
    return results[0];
  }

  async updateFlow(id: string, userId: string, updates: Partial<InsertFlow>): Promise<Flow | null> {
    // Normalize config to ensure it's always an object with nodes and edges arrays
    if (updates.config) {
      let normalizedConfig = updates.config;
      
      if (typeof normalizedConfig === 'string') {
        try {
          normalizedConfig = JSON.parse(normalizedConfig);
        } catch (e) {
          console.error('Failed to parse config string, using empty config');
          normalizedConfig = { nodes: [], edges: [] };
        }
      }
      
      if (typeof normalizedConfig !== 'object' || normalizedConfig === null) {
        normalizedConfig = { nodes: [], edges: [] };
      }
      
      // Convert nodes object to array format if needed
      if ((normalizedConfig as any).nodes && !Array.isArray((normalizedConfig as any).nodes) && typeof (normalizedConfig as any).nodes === 'object') {
        const nodesObj = (normalizedConfig as any).nodes;
        const nodesArray: any[] = [];
        const edgesArray: any[] = [];
        
        Object.entries(nodesObj).forEach(([nodeId, nodeData]: [string, any]) => {
          nodesArray.push({
            id: nodeId,
            type: nodeData.type,
            config: nodeData.config || {},
            position: nodeData.position || { x: 0, y: 0 }
          });
          
          // Create edges from 'next' relationships
          if (nodeData.next) {
            edgesArray.push({
              id: `${nodeId}-${nodeData.next}`,
              source: nodeId,
              target: nodeData.next,
              sourceHandle: null,
              targetHandle: null
            });
          }
        });
        
        (normalizedConfig as any).nodes = nodesArray;
        (normalizedConfig as any).edges = edgesArray;
      }
      
      // Ensure nodes and edges are arrays
      if (!Array.isArray((normalizedConfig as any).nodes)) {
        (normalizedConfig as any).nodes = [];
      }
      if (!Array.isArray((normalizedConfig as any).edges)) {
        (normalizedConfig as any).edges = [];
      }
      
      updates = { ...updates, config: normalizedConfig };
    }
    
    const results = await db.update(schema.flows)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(schema.flows.id, id), eq(schema.flows.userId, userId)))
      .returning();
    
    return results[0] || null;
  }

  async deleteFlow(id: string, userId: string): Promise<boolean> {
    const results = await db.delete(schema.flows)
      .where(and(eq(schema.flows.id, id), eq(schema.flows.userId, userId)))
      .returning();
    return results.length > 0;
  }

  async getFlowNodes(flowId: string): Promise<FlowNode[]> {
    return await db.select().from(schema.flowNodes).where(eq(schema.flowNodes.flowId, flowId));
  }

  async createFlowNode(node: InsertFlowNode): Promise<FlowNode> {
    const results = await db.insert(schema.flowNodes).values(node).returning();
    return results[0];
  }

  async deleteFlowNodes(flowId: string): Promise<void> {
    await db.delete(schema.flowNodes).where(eq(schema.flowNodes.flowId, flowId));
  }

  async getFlowExecutions(flowId: string): Promise<FlowExecution[]> {
    return await db.select().from(schema.flowExecutions)
      .where(eq(schema.flowExecutions.flowId, flowId))
      .orderBy(desc(schema.flowExecutions.startedAt));
  }

  async getFlowExecution(id: string): Promise<FlowExecution | null> {
    const results = await db.select().from(schema.flowExecutions)
      .where(eq(schema.flowExecutions.id, id));
    return results[0] || null;
  }

  async getActiveExecution(flowId: string, userPhone: string): Promise<FlowExecution | null> {
    const results = await db.select().from(schema.flowExecutions)
      .where(and(
        eq(schema.flowExecutions.flowId, flowId),
        eq(schema.flowExecutions.userPhone, userPhone),
        eq(schema.flowExecutions.status, 'running')
      ));
    return results[0] || null;
  }

  async createFlowExecution(execution: InsertFlowExecution): Promise<FlowExecution> {
    const results = await db.insert(schema.flowExecutions).values(execution).returning();
    return results[0];
  }

  async updateFlowExecution(id: string, updates: Partial<InsertFlowExecution>): Promise<FlowExecution | null> {
    const results = await db.update(schema.flowExecutions)
      .set(updates)
      .where(eq(schema.flowExecutions.id, id))
      .returning();
    return results[0] || null;
  }

  async createFlowAnalytics(analytics: InsertFlowAnalytics): Promise<FlowAnalytics> {
    const results = await db.insert(schema.flowAnalytics).values(analytics).returning();
    return results[0];
  }

  async getFlowAnalytics(flowId: string): Promise<FlowAnalytics[]> {
    return await db.select().from(schema.flowAnalytics)
      .where(eq(schema.flowAnalytics.flowId, flowId))
      .orderBy(desc(schema.flowAnalytics.createdAt));
  }

  async getUserProfile(id: string): Promise<UserProfile | null> {
    const results = await db.select().from(schema.userProfiles)
      .where(eq(schema.userProfiles.id, id));
    return results[0] || null;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const results = await db.insert(schema.userProfiles).values(profile).returning();
    return results[0];
  }

  async updateUserProfile(id: string, updates: Partial<InsertUserProfile>): Promise<UserProfile | null> {
    const results = await db.update(schema.userProfiles)
      .set(updates)
      .where(eq(schema.userProfiles.id, id))
      .returning();
    return results[0] || null;
  }

  async getTemplates(): Promise<Template[]> {
    return await db.select().from(schema.templates);
  }

  async getTemplate(id: string): Promise<Template | null> {
    const results = await db.select().from(schema.templates)
      .where(eq(schema.templates.id, id));
    return results[0] || null;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const results = await db.insert(schema.templates).values(template).returning();
    return results[0];
  }

  async createWebhookLog(log: InsertWebhookLog): Promise<WebhookLog> {
    const results = await db.insert(schema.webhookLogs).values(log).returning();
    return results[0];
  }

  async getWebhookLogs(limit: number = 100): Promise<WebhookLog[]> {
    return await db.select().from(schema.webhookLogs)
      .orderBy(desc(schema.webhookLogs.createdAt))
      .limit(limit);
  }

  async createWebhookExecution(execution: InsertWebhookExecution): Promise<WebhookExecution> {
    const results = await db.insert(schema.webhookExecutions).values(execution).returning();
    return results[0];
  }

  async getWebhookExecutions(flowId: string): Promise<WebhookExecution[]> {
    return await db.select().from(schema.webhookExecutions)
      .where(eq(schema.webhookExecutions.flowId, flowId))
      .orderBy(desc(schema.webhookExecutions.createdAt));
  }

  async updateWebhookExecution(id: string, updates: Partial<InsertWebhookExecution>): Promise<WebhookExecution | null> {
    const results = await db.update(schema.webhookExecutions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(schema.webhookExecutions.id, id))
      .returning();
    return results[0] || null;
  }
}
