# MVP dashboard pages

For a single-owner MVP, the sidebar has **4 items**: Invoices, Clients, Products, Settings. Your types file has no payments, reminders or other roles, so the dashboard has no Team, Payments or Reminders pages either.

## Sidebar

```text
Invoices   ← home page after login
Clients
Products
Settings
```

## Routes

| Route | Page | What it does |
| --- | --- | --- |
| `/sign-in`, `/sign-up` | Clerk pages | Outside the dashboard |
| `/invoices` | **Invoice list** | Table with number, client, total, due date and status badge. Filter by status (draft, sent, paid, overdue). "New invoice" button |
| `/invoices/new` | **Create invoice** | Pick a client, set issue and due dates, add line items (from a product or free text). Totals update live. Save as draft |
| `/invoices/[id]` | **Invoice detail** | Read-only view with the actions below |
| `/invoices/[id]/edit` | **Edit invoice** | Reuses the create form. Only allowed while the status is `draft` |
| `/clients` | **Clients** | List, plus create/edit in a dialog |
| `/products` | **Products** | List, plus create/edit in a dialog |
| `/settings` | **Business profile** | Name, address, NIF, NIS, RC, AI (these appear on invoices) |
| `/i/[token]` | **Public invoice page** | Not in the dashboard. This is what your client sees. No login |

That's **6 real dashboard pages**. Clients and Products use dialogs instead of separate pages, which saves 4 routes.

## Actions on the invoice detail page

This page does most of the work:

| Current status | Buttons |
| --- | --- |
| `draft` | Edit, Delete, **Send** |
| `sent` | Download PDF, Copy public link, **Mark as paid**, Void |
| `paid` / `void` | Download PDF, Copy public link (read-only) |

"Mark as paid" is manual in the MVP, because the mock payment gateway is V1. It's also why the owner needs this button.

## What to skip

- **A stats dashboard.** It's V1 in your handbook. If you want something cheap, show 3 numbers at the top of `/invoices`: outstanding, overdue and paid this month.
- **Team, invitations, audit log, CSV export, Bull Board, and an Arabic/RTL interface.** All of these come later.

## Two gaps in your `types.ts`

1. **`Invoice` has no `pdfKey`.** The PDF is an MVP feature, so you need somewhere to store the file location (nullable until the background job finishes).
2. **No `paidAt`.** Even with manual "Mark as paid," you'll want to know when. Add `paidAt?: string` to `Invoice` now, and move it to a `payments` table in V1.

Everything else in the types matches these pages: `Client`, `Product`, `Invoice` and `InvoiceItem` each map to a screen, and `Organization` maps to Settings.

## Build order

1. Settings (it creates the workspace on first login)
2. Clients
3. Products
4. Create invoice and invoice list
5. Invoice detail with the status actions
6. Public page
7. PDF and email jobs
