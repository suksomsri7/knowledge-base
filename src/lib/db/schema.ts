import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  inet,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =============================================
// USERS
// =============================================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  avatarUrl: text("avatar_url"),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================
// BRANDS
// =============================================
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  settings: jsonb("settings").default({}).$type<Record<string, unknown>>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================
// ROLES
// =============================================
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .references(() => brands.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    description: text("description"),
    permissions: jsonb("permissions").default([]).$type<string[]>().notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("roles_brand_name_idx").on(table.brandId, table.name)]
);

// =============================================
// BRAND MEMBERS
// =============================================
export const brandMembers = pgTable(
  "brand_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .references(() => brands.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    roleId: uuid("role_id").references(() => roles.id),
    isActive: boolean("is_active").default(true).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("brand_members_brand_user_idx").on(table.brandId, table.userId)]
);

// =============================================
// AGENTS
// =============================================
export const agents = pgTable(
  "agents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .references(() => brands.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    apiKey: varchar("api_key", { length: 100 }).unique().notNull(),
    answerThreshold: integer("answer_threshold").default(75).notNull(),
    escalateThreshold: integer("escalate_threshold").default(40).notNull(),
    disclaimerMessage: text("disclaimer_message").default(
      "ข้อมูลอาจไม่ครบถ้วน กรุณาติดต่อเจ้าหน้าที่หากต้องการข้อมูลเพิ่มเติม"
    ),
    noAnswerMessage: text("no_answer_message").default(
      "ขออภัย ขอส่งเรื่องให้เจ้าหน้าที่ตรวจสอบให้ครับ"
    ),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("agents_brand_slug_idx").on(table.brandId, table.slug)]
);

// =============================================
// CATEGORIES (scoped to agent)
// =============================================
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    agentId: uuid("agent_id")
      .references(() => agents.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("categories_agent_slug_idx").on(table.agentId, table.slug)]
);

// =============================================
// KNOWLEDGE ITEMS
// =============================================
export const knowledgeItems = pgTable("knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  type: varchar("type", { length: 20 }).default("faq").notNull(),
  question: varchar("question", { length: 500 }).notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords").array().default([]),
  tags: text("tags").array().default([]),
  isActive: boolean("is_active").default(true).notNull(),
  source: varchar("source", { length: 20 }).default("manual").notNull(),
  escalationId: uuid("escalation_id"),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  reviewAt: timestamp("review_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================
// FLOWS
// =============================================
export const flows = pgTable("flows", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  triggerKeywords: text("trigger_keywords").array().default([]).notNull(),
  priority: integer("priority").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export interface FlowStepOption {
  label: string;
  keywords: string[];
  nextStepId: string | null;
}

// =============================================
// FLOW STEPS
// =============================================
export const flowSteps = pgTable("flow_steps", {
  id: uuid("id").primaryKey().defaultRandom(),
  flowId: uuid("flow_id")
    .references(() => flows.id, { onDelete: "cascade" })
    .notNull(),
  stepOrder: integer("step_order").notNull(),
  type: varchar("type", { length: 20 }).notNull(),
  message: text("message").notNull(),
  options: jsonb("options").default([]).$type<FlowStepOption[]>(),
  nextStepId: uuid("next_step_id"),
  isFinal: boolean("is_final").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================
// ESCALATIONS
// =============================================
export const escalations = pgTable("escalations", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),
  question: text("question").notNull(),
  customerContext: text("customer_context"),
  aiAttemptedAnswer: text("ai_attempted_answer"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  priority: varchar("priority", { length: 10 }).default("normal").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
  resolutionType: varchar("resolution_type", { length: 20 }),
  answer: text("answer"),
  adminNotes: text("admin_notes"),
  resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  sessionId: varchar("session_id", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================
// KB API LOGS
// =============================================
export const kbApiLogs = pgTable("kb_api_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id")
    .references(() => agents.id, { onDelete: "cascade" })
    .notNull(),
  endpoint: varchar("endpoint", { length: 50 }).notNull(),
  query: text("query"),
  resultsCount: integer("results_count").default(0),
  topConfidence: integer("top_confidence"),
  recommendation: varchar("recommendation", { length: 30 }),
  responseMs: integer("response_ms"),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================
// AUDIT LOG
// =============================================
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  brandId: uuid("brand_id").references(() => brands.id),
  action: varchar("action", { length: 50 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  resourceId: uuid("resource_id"),
  details: jsonb("details").default({}).$type<Record<string, unknown>>(),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================
// RELATIONS
// =============================================
export const usersRelations = relations(users, ({ many }) => ({
  brandMembers: many(brandMembers),
  createdBrands: many(brands),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  creator: one(users, { fields: [brands.createdBy], references: [users.id] }),
  members: many(brandMembers),
  roles: many(roles),
  agents: many(agents),
}));

export const rolesRelations = relations(roles, ({ one, many }) => ({
  brand: one(brands, { fields: [roles.brandId], references: [brands.id] }),
  members: many(brandMembers),
}));

export const brandMembersRelations = relations(brandMembers, ({ one }) => ({
  brand: one(brands, { fields: [brandMembers.brandId], references: [brands.id] }),
  user: one(users, { fields: [brandMembers.userId], references: [users.id] }),
  role: one(roles, { fields: [brandMembers.roleId], references: [roles.id] }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  brand: one(brands, { fields: [agents.brandId], references: [brands.id] }),
  creator: one(users, { fields: [agents.createdBy], references: [users.id] }),
  categories: many(categories),
  knowledgeItems: many(knowledgeItems),
  flows: many(flows),
  escalations: many(escalations),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  agent: one(agents, { fields: [categories.agentId], references: [agents.id] }),
  knowledgeItems: many(knowledgeItems),
}));

export const knowledgeItemsRelations = relations(knowledgeItems, ({ one }) => ({
  agent: one(agents, { fields: [knowledgeItems.agentId], references: [agents.id] }),
  category: one(categories, { fields: [knowledgeItems.categoryId], references: [categories.id] }),
  creator: one(users, { fields: [knowledgeItems.createdBy], references: [users.id] }),
  updater: one(users, { fields: [knowledgeItems.updatedBy], references: [users.id] }),
}));

export const flowsRelations = relations(flows, ({ one, many }) => ({
  agent: one(agents, { fields: [flows.agentId], references: [agents.id] }),
  creator: one(users, { fields: [flows.createdBy], references: [users.id] }),
  steps: many(flowSteps),
}));

export const flowStepsRelations = relations(flowSteps, ({ one }) => ({
  flow: one(flows, { fields: [flowSteps.flowId], references: [flows.id] }),
}));

export const escalationsRelations = relations(escalations, ({ one }) => ({
  agent: one(agents, { fields: [escalations.agentId], references: [agents.id] }),
  category: one(categories, { fields: [escalations.categoryId], references: [categories.id] }),
  assignee: one(users, { fields: [escalations.assignedTo], references: [users.id] }),
  resolver: one(users, { fields: [escalations.resolvedBy], references: [users.id] }),
}));
