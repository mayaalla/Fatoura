// db/schema.ts
import { randomBytes } from "node:crypto";
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/* ───────────── Enums ───────────── */

export const roleEnum = pgEnum("role", ["owner"]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "void",
]);

/* ───────────── Helpers ───────────── */

// All money is whole centimes: 12 500,00 DA = 1250000
const centimes = (name: string) => bigint(name, { mode: "number" });

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

/* ───────────── Users (Clerk handles the password) ───────────── */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: createdAt(),
});

/* ───────────── Organizations (the workspace) ───────────── */

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // shown on invoices
  address: text("address"),
  // Legal identifiers: confirm with an accountant
  nif: text("nif"),
  nis: text("nis"),
  rc: text("rc"),
  ai: text("ai"),
  createdAt: createdAt(),
});

/* ───────────── Memberships (who has a key to which workspace) ───────────── */

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("owner"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("memberships_org_user_unique").on(t.orgId, t.userId),
    index("memberships_user_idx").on(t.userId), // "which workspaces does this user have?"
  ],
);

/* ───────────── Clients ───────────── */

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    address: text("address"),
    createdAt: createdAt(),
  },
  (t) => [index("clients_org_idx").on(t.orgId)],
);

/* ───────────── Products ───────────── */

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    unitPrice: centimes("unit_price").notNull(),
    vatRate: integer("vat_rate").notNull().default(1900), // basis points: 1900 = 19%
    createdAt: createdAt(),
  },
  (t) => [
    index("products_org_idx").on(t.orgId),
    check("products_unit_price_check", sql`${t.unitPrice} >= 0`),
    check("products_vat_rate_check", sql`${t.vatRate} BETWEEN 0 AND 10000`),
  ],
);

/* ───────────── Invoices ───────────── */

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // No onDelete cascade: a client with invoices cannot be deleted
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    number: text("number").notNull(), // e.g. "2026-0001"
    status: invoiceStatusEnum("status").notNull().default("draft"), // "overdue" is calculated, not stored
    issueDate: date("issue_date", { mode: "string" }).notNull(),
    dueDate: date("due_date", { mode: "string" }).notNull(),
    subtotal: centimes("subtotal").notNull().default(0),
    vat: centimes("vat").notNull().default(0),
    total: centimes("total").notNull().default(0),
    // Secret link for the client
    publicToken: text("public_token")
      .notNull()
      .unique()
      .$defaultFn(() => randomBytes(24).toString("base64url")),
    createdAt: createdAt(),
  },
  (t) => [
    unique("invoices_org_number_unique").on(t.orgId, t.number),
    index("invoices_org_status_idx").on(t.orgId, t.status),
    index("invoices_client_idx").on(t.clientId),
    check("invoices_dates_check", sql`${t.dueDate} >= ${t.issueDate}`),
    check(
      "invoices_totals_check",
      sql`${t.subtotal} >= 0 AND ${t.vat} >= 0 AND ${t.total} = ${t.subtotal} + ${t.vat}`,
    ),
  ],
);

/* ───────────── Invoice items ───────────── */

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    quantity: integer("quantity").notNull().default(1),
    // Copied from the product at invoice time, so old invoices never change
    unitPrice: centimes("unit_price").notNull(),
    vatRate: integer("vat_rate").notNull(), // basis points
  },
  (t) => [
    index("invoice_items_invoice_idx").on(t.invoiceId),
    check("invoice_items_quantity_check", sql`${t.quantity} > 0`),
    check("invoice_items_unit_price_check", sql`${t.unitPrice} >= 0`),
    check("invoice_items_vat_rate_check", sql`${t.vatRate} BETWEEN 0 AND 10000`),
  ],
);

/* ───────────── Relations (for db.query.* with `with:`) ───────────── */

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(memberships),
  clients: many(clients),
  products: many(products),
  invoices: many(invoices),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberships.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.orgId],
    references: [organizations.id],
  }),
  invoices: many(invoices),
}));

export const productsRelations = relations(products, ({ one }) => ({
  organization: one(organizations, {
    fields: [products.orgId],
    references: [organizations.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.orgId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

/* ───────────── Inferred types (replace your types.ts) ───────────── */

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

export type Role = (typeof roleEnum.enumValues)[number];
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];

// Overdue is calculated, never stored
export const isOverdue = (inv: Invoice, today = new Date()): boolean =>
  inv.status === "sent" && new Date(inv.dueDate) < today;