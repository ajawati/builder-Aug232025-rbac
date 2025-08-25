import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("free"),
  persona: text("persona").notNull().default("end_user"), // 'super_admin', 'builder', 'end_user'
  tenant: text("tenant"), // optional tenant/org id for multi-tenant scoping
  createdAt: timestamp("created_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  status: text("status").notNull().default("development"), // development, testing, completed
  llm: text("llm").notNull(), // claude, gemini, llama, gpt4
  mcpServers: jsonb("mcp_servers").$type<string[]>().notNull().default([]),
  files: jsonb("files").$type<{name: string, size: string, type: string}[]>().default([]),
  revenue: integer("revenue").default(0), // in cents
  revenueGrowth: integer("revenue_growth").default(0), // percentage
  published: text("published").default("false"), // "true" or "false"
  createdAt: timestamp("created_at").defaultNow(),
});

export const mcpServers = pgTable("mcp_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("sse"), // sse, stdio, websocket, grpc
  url: text("url"),
  description: text("description"),
  status: text("status").notNull().default("disconnected"), // connected, disconnected
  latency: integer("latency").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  sender: text("sender").notNull(), // user, ai
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketplaceApps = pgTable("marketplace_apps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in cents
  rating: text("rating").notNull().default("0"),
  downloads: integer("downloads").default(0),
  category: text("category").notNull().default("custom"),
  icon: text("icon").notNull().default("🔧"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({
  id: true,
  createdAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertMarketplaceAppSchema = createInsertSchema(marketplaceApps).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type MarketplaceApp = typeof marketplaceApps.$inferSelect;
export type InsertMarketplaceApp = z.infer<typeof insertMarketplaceAppSchema>;
