import { integer, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core"

export const tasks = pgTable("tasks", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).notNull().default("todo"),
  priority: varchar("priority", { length: 50 }).notNull().default("medium"),
  orgId: varchar("org_id", { length: 255 }),
  projectId: varchar("project_id", { length: 255 }),
  teamId: varchar("team_id", { length: 255 }),
  githubIssueNumber: integer("github_issue_number"),
  githubIssueId: varchar("github_issue_id", { length: 255 }),
  githubIssueUrl: text("github_issue_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const projects = pgTable("projects", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  orgId: varchar("org_id", { length: 255 }),
  teamId: varchar("team_id", { length: 255 }),
  githubRepositoryFullName: varchar("github_repository_full_name", { length: 255 }),
  githubInstallationId: varchar("github_installation_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const views = pgTable("views", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  orgId: varchar("org_id", { length: 255 }),
  filters: jsonb("filters").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
