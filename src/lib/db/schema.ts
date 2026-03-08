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
// CATEGORIES
// =============================================
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .references(() => brands.id, { onDelete: "cascade" })
      .notNull(),
    parentId: uuid("parent_id"),
    name: varchar("name", { length: 100 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    icon: varchar("icon", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("categories_brand_slug_idx").on(table.brandId, table.slug)]
);

// =============================================
// ARTICLES
// =============================================
export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .references(() => brands.id, { onDelete: "cascade" })
      .notNull(),
    categoryId: uuid("category_id").references(() => categories.id),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    content: text("content").notNull().default(""),
    excerpt: text("excerpt"),
    status: varchar("status", { length: 20 }).default("draft").notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    tags: text("tags").array().default([]),
    metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),
    createdBy: uuid("created_by").references(() => users.id),
    updatedBy: uuid("updated_by").references(() => users.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("articles_brand_slug_idx").on(table.brandId, table.slug)]
);

// =============================================
// ARTICLE VERSIONS
// =============================================
export const articleVersions = pgTable("article_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id")
    .references(() => articles.id, { onDelete: "cascade" })
    .notNull(),
  versionNumber: integer("version_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  changedBy: uuid("changed_by").references(() => users.id),
  changeSummary: text("change_summary"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================
// ATTACHMENTS
// =============================================
export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  brandId: uuid("brand_id")
    .references(() => brands.id, { onDelete: "cascade" })
    .notNull(),
  articleId: uuid("article_id").references(() => articles.id, { onDelete: "set null" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  mimeType: varchar("mime_type", { length: 100 }),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
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
  categories: many(categories),
  articles: many(articles),
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

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  brand: one(brands, { fields: [categories.brandId], references: [brands.id] }),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one }) => ({
  brand: one(brands, { fields: [articles.brandId], references: [brands.id] }),
  category: one(categories, { fields: [articles.categoryId], references: [categories.id] }),
  creator: one(users, { fields: [articles.createdBy], references: [users.id] }),
  updater: one(users, { fields: [articles.updatedBy], references: [users.id] }),
}));
