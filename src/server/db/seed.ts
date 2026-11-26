// db/seed.ts
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

config({ path: ".env" }); // use ".env" if that's your file

const {
  users,
  organizations,
  memberships,
  clients,
  products,
  invoices,
  invoiceItems,
} = schema;

/* ───────────── Your data ───────────── */

const ME = {
  clerkUserId: "user_3MbSjjwhvOmgNYbh363XcrFf00o",
  name: "Maya Alla",
  email: "mayaalla888@gmail.com",
};

const RESET = process.argv.includes("--reset");

// All money is whole centimes: 5 000,00 DA = 500000
const PRODUCTS = {
  logo: { name: "Logo design", unitPrice: 500_000, vatRate: 1900 },
  website: { name: "Website development", unitPrice: 8_000_000, vatRate: 1900 },
  hosting: { name: "Monthly hosting", unitPrice: 250_000, vatRate: 1900 },
  consulting: { name: "Consulting (1 hour)", unitPrice: 300_000, vatRate: 900 },
} as const;

type ProductKey = keyof typeof PRODUCTS;

const CLIENTS = [
  { key: "atlas", name: "Sarl Atlas", email: "contact@atlas.example.com", address: "12 Rue Didouche Mourad, Alger" },
  { key: "amel", name: "Boulangerie El Amel", email: "amel@example.com", address: "5 Rue des Frères Bouadou, Oran" },
  { key: "tassili", name: "Studio Tassili", email: "hello@tassili.example.com", address: "Zone d'activité, Constantine" },
] as const;

type ClientKey = (typeof CLIENTS)[number]["key"];

type InvoiceSeed = {
  client: ClientKey;
  number: string;
  status: schema.InvoiceStatus;
  issueDate: string;
  dueDate: string;
  items: { product: ProductKey; quantity: number }[];
};

const INVOICES: InvoiceSeed[] = [
  {
    client: "atlas",
    number: "2026-0001",
    status: "paid",
    issueDate: "2026-09-01",
    dueDate: "2026-09-15",
    items: [{ product: "logo", quantity: 1 }],
  },
  {
    client: "amel",
    number: "2026-0002",
    status: "paid",
    issueDate: "2026-10-05",
    dueDate: "2026-10-20",
    items: [
      { product: "website", quantity: 1 },
      { product: "hosting", quantity: 12 },
    ],
  },
  {
    // "sent" + due date in the past = shows as OVERDUE (calculated)
    client: "tassili",
    number: "2026-0003",
    status: "sent",
    issueDate: "2026-10-25",
    dueDate: "2026-11-10",
    items: [{ product: "consulting", quantity: 4 }],
  },
  {
    client: "atlas",
    number: "2026-0004",
    status: "sent",
    issueDate: "2026-11-20",
    dueDate: "2026-12-20",
    items: [{ product: "hosting", quantity: 3 }],
  },
  {
    client: "amel",
    number: "2026-0005",
    status: "draft",
    issueDate: "2026-11-25",
    dueDate: "2026-12-25",
    items: [{ product: "logo", quantity: 1 }],
  },
  {
    client: "tassili",
    number: "2026-0006",
    status: "void",
    issueDate: "2026-10-10",
    dueDate: "2026-10-25",
    items: [{ product: "consulting", quantity: 2 }],
  },
];

/* ───────────── Helpers ───────────── */

// VAT is rounded per line, then summed
function computeTotals(items: { quantity: number; unitPrice: number; vatRate: number }[]) {
  let subtotal = 0;
  let vat = 0;
  for (const it of items) {
    const line = it.quantity * it.unitPrice;
    subtotal += line;
    vat += Math.round((line * it.vatRate) / 10_000);
  }
  return { subtotal, vat, total: subtotal + vat };
}

/* ───────────── Seed ───────────── */

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Check your env file.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  try {
    await db.transaction(async (tx) => {
      // 1. User (upsert on the Clerk ID)
      const [user] = await tx
        .insert(users)
        .values(ME)
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { name: ME.name, email: ME.email },
        })
        .returning();

      // 2. Already have a workspace? Stop, or wipe it with --reset
      const existing = await tx
        .select({ orgId: memberships.orgId })
        .from(memberships)
        .where(eq(memberships.userId, user.id));

      if (existing.length > 0) {
        if (!RESET) {
          console.log("⚠️  This user already has a workspace. Nothing seeded.");
          console.log("    Run with --reset to delete it and seed again.");
          return;
        }
        for (const m of existing) {
          // clients, products, invoices and items cascade from the org
          await tx.delete(organizations).where(eq(organizations.id, m.orgId));
        }
        console.log("🗑️  Old workspace deleted.");
      }

      // 3. Workspace + membership
      const [org] = await tx
        .insert(organizations)
        .values({
          name: "Maya Alla Studio",
          address: "Alger, Algérie",
          // Fake placeholders: replace with real values (confirm with an accountant)
          nif: "000000000000000",
          nis: "000000000000000",
          rc: "00/00-0000000A00",
          ai: "00000000000",
        })
        .returning();

      await tx.insert(memberships).values({
        orgId: org.id,
        userId: user.id,
        role: "owner",
      });

      // 4. Clients
      const insertedClients = await tx
        .insert(clients)
        .values(
          CLIENTS.map((c) => ({
            orgId: org.id,
            name: c.name,
            email: c.email,
            address: c.address,
          })),
        )
        .returning();

      const clientIdByKey = new Map<ClientKey, string>();
      CLIENTS.forEach((c) => {
        const row = insertedClients.find((r) => r.name === c.name)!;
        clientIdByKey.set(c.key, row.id);
      });

      // 5. Products
      await tx
        .insert(products)
        .values(Object.values(PRODUCTS).map((p) => ({ orgId: org.id, ...p })));

      // 6. Invoices + items (totals computed from the items)
      for (const inv of INVOICES) {
        const lines = inv.items.map((i) => ({
          description: PRODUCTS[i.product].name,
          quantity: i.quantity,
          unitPrice: PRODUCTS[i.product].unitPrice,
          vatRate: PRODUCTS[i.product].vatRate,
        }));

        const [created] = await tx
          .insert(invoices)
          .values({
            orgId: org.id,
            clientId: clientIdByKey.get(inv.client)!,
            number: inv.number,
            status: inv.status,
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            ...computeTotals(lines),
          })
          .returning();

        await tx
          .insert(invoiceItems)
          .values(lines.map((l) => ({ invoiceId: created.id, ...l })));
      }

      console.log("✅ Seeded:");
      console.log(`   user: ${user.name} (${user.email})`);
      console.log(`   org: ${org.name}`);
      console.log(`   ${CLIENTS.length} clients, ${Object.keys(PRODUCTS).length} products, ${INVOICES.length} invoices`);
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});