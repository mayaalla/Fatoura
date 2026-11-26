// types.ts (MVP)

// All money is whole centimes: 12 500,00 DA = 1250000
export type Centimes = number;

// MVP: only the owner exists. Everyone who signs up owns their workspace.
export type Role = "owner";
export type InvoiceStatus = "draft" | "sent" | "paid" | "void";

// The person (Clerk handles the password)
export interface User {
  id: string;
  clerkUserId: string; // the "wristband number" from Clerk
  name: string;
  email: string;
}

// The workspace: one freelancer or one business
export interface Organization {
  id: string;
  name: string; // shown on invoices
  address?: string;
  nif?: string; // legal identifiers: confirm with an accountant
  nis?: string;
  rc?: string;
  ai?: string;
}

// Who has a key to which workspace
export interface Membership {
  id: string;
  orgId: string;
  userId: string;
  role: Role; // unique together: (orgId, userId)
}

export interface Client {
  id: string;
  orgId: string;
  name: string;
  email: string;
  address?: string;
}

export interface Product {
  id: string;
  orgId: string;
  name: string;
  unitPrice: Centimes;
  vatRate: number; // basis points: 1900 = 19%
}

export interface Invoice {
  id: string;
  orgId: string;
  clientId: string;
  number: string; // e.g. "2026-0001", unique per workspace
  status: InvoiceStatus; // "overdue" is calculated, not stored
  issueDate: string; // "2026-11-25"
  dueDate: string;
  subtotal: Centimes;
  vat: Centimes;
  total: Centimes;
  publicToken: string; // secret link for the client
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: Centimes;
  vatRate: number;
}

// Overdue is calculated, never stored
export const isOverdue = (inv: Invoice, today = new Date()): boolean =>
  inv.status === "sent" && new Date(inv.dueDate) < today;

// ─────────────── IDEAS FOR LATER (not built yet) ───────────────
//
// 1. More roles: change to  "owner" | "accountant" | "viewer"
//    and check the role on the server for every action.
//
// 2. Invitations (a row in your own table, not a JWT):
//    { id, orgId, role, email, codeHash, expiresAt, usedAt }
//
// 3. Payments: { id, invoiceId, amount, provider, providerRef, paidAt }
//    unique on (provider, providerRef) to block double payments.
//
// 4. Reminders: ReminderRule + ReminderLog,
//    unique on (invoiceId, ruleId) to block duplicate reminders.