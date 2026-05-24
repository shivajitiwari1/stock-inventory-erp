# JSON to Database Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the JSON-file-based data layer with Supabase (PostgreSQL) via Prisma ORM, keeping all frontend and API route interfaces identical.

**Architecture:** All 13 JSON files become PostgreSQL tables managed by Prisma. `lib/db.ts` is replaced by `lib/prisma.ts` (a Prisma client singleton). Each API route replaces `readJSON`/`writeJSON` calls with Prisma queries. The frontend and sessionStorage cache layer are untouched.

**Tech Stack:** Supabase (PostgreSQL), Prisma ORM, Next.js 16 App Router, TypeScript

---

## PREREQUISITE — Create Supabase Project (Manual Step)

The user must do this before any code changes:

1. Go to **https://supabase.com** → Sign up / Log in
2. Click **New project** → give it a name (e.g., `stock-erp`)
3. Choose a region closest to your users → click **Create new project**
4. Wait ~2 minutes for provisioning
5. Go to **Project Settings → Database**
6. Under **Connection string**, select **URI** tab
7. Copy two strings:
   - **Transaction pooler** (port 6543) → this is `DATABASE_URL`
   - **Direct connection** (port 5432) → this is `DIRECT_URL`

---

## Task 1: Install Prisma Dependencies

**Files:**
- Modify: `package.json` (via npm)
- Create: `.env` (local env file)
- Create: `.env.example`

- [ ] **Step 1: Install Prisma and client**

```bash
cd "e:\Demo Website\Stock Inventory Management\stock-inventory-erp"
npm install prisma @prisma/client
npm install --save-dev prisma
```

Expected output: `added N packages`

- [ ] **Step 2: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected output: Creates `prisma/schema.prisma` and `.env` with `DATABASE_URL` placeholder.

- [ ] **Step 3: Fill in `.env` with Supabase connection strings**

Open `.env` and replace its contents with:

```env
# Supabase connection — get these from Supabase Project Settings > Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Replace `[PROJECT-REF]`, `[PASSWORD]`, and `[REGION]` with actual values from Supabase dashboard.

- [ ] **Step 4: Create `.env.example` (safe to commit)**

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
```

- [ ] **Step 5: Add `.env` to `.gitignore`**

Check `.gitignore` has this line (add if missing):
```
.env
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json prisma/schema.prisma .env.example .gitignore
git commit -m "chore: install prisma and initialize with postgresql provider"
```

---

## Task 2: Write Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Replace `prisma/schema.prisma` with full schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  sku         String   @unique
  category    String
  description String?
  unitType    String   @default("PCS")
  price       Float    @default(0)
  image       String?
  minQuantity Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  inventory      Inventory[]
  stockIssues    StockIssue[]
  stockMovements StockMovement[]
}

model Warehouse {
  id           String   @id @default(cuid())
  name         String
  location     String?
  address      String?
  manager      String?
  capacity     Int      @default(0)
  currentUsage Int      @default(0)
  status       String   @default("ACTIVE")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  inventory      Inventory[]
  stockIssues    StockIssue[]
  stockMovements StockMovement[]
  transfersFrom  StockTransfer[] @relation("FromWarehouse")
  transfersTo    StockTransfer[] @relation("ToWarehouse")
  supplyReceipts SupplyReceipt[]
}

model Inventory {
  id                String   @id @default(cuid())
  productId         String
  warehouseId       String
  totalQuantity     Int      @default(0)
  availableQuantity Int      @default(0)
  reservedQuantity  Int      @default(0)
  damagedQuantity   Int      @default(0)
  lostQuantity      Int      @default(0)
  lastUpdated       DateTime @default(now()) @updatedAt

  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)

  @@unique([productId, warehouseId])
}

model Supplier {
  id        String   @id @default(cuid())
  name      String
  email     String?
  phone     String?
  address   String?
  city      String?
  country   String?
  status    String   @default("ACTIVE")
  createdAt DateTime @default(now())

  supplyReceipts SupplyReceipt[]
}

model Contractor {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  role      String?
  company   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stockIssues StockIssue[]
}

model StockTransfer {
  id              String   @id @default(cuid())
  fromWarehouseId String
  toWarehouseId   String
  productName     String
  quantity        Int
  status          String   @default("PENDING")
  date            DateTime @default(now())

  fromWarehouse Warehouse @relation("FromWarehouse", fields: [fromWarehouseId], references: [id])
  toWarehouse   Warehouse @relation("ToWarehouse", fields: [toWarehouseId], references: [id])
}

model StockIssue {
  id             String   @id @default(cuid())
  productId      String
  productName    String
  unit           String   @default("PCS")
  warehouseId    String
  contractorId   String
  contractorName String
  quantity       Int
  purpose        String?
  issuedBy       String?
  status         String   @default("Issued")
  notes          String?
  issueDate      DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  product    Product    @relation(fields: [productId], references: [id])
  warehouse  Warehouse  @relation(fields: [warehouseId], references: [id])
  contractor Contractor @relation(fields: [contractorId], references: [id])
}

model StockMovement {
  id          String   @id @default(cuid())
  productId   String
  warehouseId String
  type        String
  quantity    Int
  reason      String?
  reference   String?
  performedBy String?
  notes       String?
  createdAt   DateTime @default(now())

  product   Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  warehouse Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
}

model SupplyReceipt {
  id             String   @id @default(cuid())
  supplierId     String
  supplierName   String
  warehouseId    String
  warehouseName  String
  dateTime       DateTime
  verifiedBy     String?
  totalAmount    Float    @default(0)
  gatePassNumber String?
  items          Json     @default("[]")
  receiptFile    String?
  createdAt      DateTime @default(now())

  supplier  Supplier  @relation(fields: [supplierId], references: [id])
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
}

model User {
  id          String    @id @default(cuid())
  name        String
  email       String    @unique
  password    String
  role        String    @default("INVENTORY_MANAGER")
  status      String    @default("ACTIVE")
  createdAt   DateTime  @default(now())
  lastLogin   DateTime?
  updatedAt   DateTime  @updatedAt
  permissions Json?
}

model Role {
  id          String   @id @default(cuid())
  name        String
  key         String   @unique
  description String?
  isSystem    Boolean  @default(false)
  isAdmin     Boolean  @default(false)
  permissions Json     @default("{}")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Notification {
  id             String   @id @default(cuid())
  type           String
  title          String
  message        String
  targetUserId   String?
  targetUserName String?
  createdByName  String?
  dismissedBy    Json     @default("[]")
  createdAt      DateTime @default(now())
}

model AuditLog {
  id         String   @id @default(cuid())
  action     String
  entityType String?
  entityId   String?
  userId     String?
  userName   String?
  changes    Json?
  timestamp  DateTime @default(now())
  ipAddress  String?
  details    String?
}
```

- [ ] **Step 2: Push schema to Supabase**

```bash
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

If it fails, double-check `DATABASE_URL` and `DIRECT_URL` in `.env`.

- [ ] **Step 3: Generate Prisma client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add prisma schema with 13 database models"
```

---

## Task 3: Create Prisma Client Singleton

**Files:**
- Create: `lib/prisma.ts`

- [ ] **Step 1: Create `lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (or only pre-existing ones unrelated to prisma.ts).

- [ ] **Step 3: Commit**

```bash
git add lib/prisma.ts
git commit -m "feat: add prisma client singleton"
```

---

## Task 4: Create Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add seed script)

- [ ] **Step 1: Install ts-node for seed execution**

```bash
npm install --save-dev ts-node
```

- [ ] **Step 2: Create `prisma/seed.ts`**

This script reads the existing JSON files and inserts all data into the database, preserving existing IDs.

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data');

function readData(file: string) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
}

async function main() {
  console.log('Seeding database from JSON files...');

  // 1. Products
  const { products } = readData('products.json');
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category || '',
        description: p.description || null,
        unitType: p.unitType || 'PCS',
        price: p.price || 0,
        image: p.image || null,
        minQuantity: p.minQuantity || 0,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${products.length} products`);

  // 2. Warehouses
  const { warehouses } = readData('warehouses.json');
  for (const w of warehouses) {
    await prisma.warehouse.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        name: w.name,
        location: w.location || null,
        address: w.address || null,
        manager: w.manager || null,
        capacity: w.capacity || 0,
        currentUsage: w.currentUsage || 0,
        status: w.status || 'ACTIVE',
        createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
        updatedAt: w.updatedAt ? new Date(w.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${warehouses.length} warehouses`);

  // 3. Inventory
  const { inventory } = readData('inventory.json');
  for (const i of inventory) {
    await prisma.inventory.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        productId: i.productId,
        warehouseId: i.warehouseId,
        totalQuantity: i.totalQuantity || 0,
        availableQuantity: i.availableQuantity || 0,
        reservedQuantity: i.reservedQuantity || 0,
        damagedQuantity: i.damagedQuantity || 0,
        lostQuantity: i.lostQuantity || 0,
        lastUpdated: i.lastUpdated ? new Date(i.lastUpdated) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${inventory.length} inventory records`);

  // 4. Suppliers
  const { suppliers } = readData('suppliers.json');
  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        email: s.email || null,
        phone: s.phone || null,
        address: s.address || null,
        city: s.city || null,
        country: s.country || null,
        status: s.status || 'ACTIVE',
        createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${suppliers.length} suppliers`);

  // 5. Contractors
  const { contractors } = readData('contractors.json');
  for (const c of contractors) {
    await prisma.contractor.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        phone: c.phone || null,
        role: c.role || null,
        company: c.company || null,
        createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${contractors.length} contractors`);

  // 6. Stock Transfers (root key is "transfers")
  const { transfers } = readData('stockTransfers.json');
  for (const t of transfers) {
    await prisma.stockTransfer.upsert({
      where: { id: t.id },
      update: {},
      create: {
        id: t.id,
        fromWarehouseId: t.fromWarehouseId,
        toWarehouseId: t.toWarehouseId,
        productName: t.productName,
        quantity: t.quantity,
        status: t.status || 'PENDING',
        date: t.date ? new Date(t.date) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${transfers.length} stock transfers`);

  // 7. Stock Issues
  const { stockIssues } = readData('stockIssues.json');
  for (const si of stockIssues) {
    await prisma.stockIssue.upsert({
      where: { id: si.id },
      update: {},
      create: {
        id: si.id,
        productId: si.productId,
        productName: si.productName,
        unit: si.unit || 'PCS',
        warehouseId: si.warehouseId,
        contractorId: si.contractorId,
        contractorName: si.contractorName,
        quantity: si.quantity,
        purpose: si.purpose || null,
        issuedBy: si.issuedBy || null,
        status: si.status || 'Issued',
        notes: si.notes || null,
        issueDate: si.issueDate ? new Date(si.issueDate) : new Date(),
        createdAt: si.createdAt ? new Date(si.createdAt) : new Date(),
        updatedAt: si.updatedAt ? new Date(si.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${stockIssues.length} stock issues`);

  // 8. Stock Movements
  const { stockMovements } = readData('stockMovements.json');
  for (const m of stockMovements) {
    await prisma.stockMovement.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        productId: m.productId,
        warehouseId: m.warehouseId,
        type: m.type,
        quantity: m.quantity,
        reason: m.reason || null,
        reference: m.reference || null,
        performedBy: m.performedBy || null,
        notes: m.notes || null,
        createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${stockMovements.length} stock movements`);

  // 9. Supply Receipts
  const { supplyReceipts } = readData('supplyReceipts.json');
  for (const r of supplyReceipts) {
    await prisma.supplyReceipt.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        supplierId: r.supplierId,
        supplierName: r.supplierName,
        warehouseId: r.warehouseId,
        warehouseName: r.warehouseName,
        dateTime: r.dateTime ? new Date(r.dateTime) : new Date(),
        verifiedBy: r.verifiedBy || null,
        totalAmount: r.totalAmount || 0,
        gatePassNumber: r.gatePassNumber || null,
        items: r.items || [],
        receiptFile: r.receiptFile || null,
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${supplyReceipts.length} supply receipts`);

  // 10. Users
  const { users } = readData('users.json');
  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role || 'INVENTORY_MANAGER',
        status: u.status || 'ACTIVE',
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        lastLogin: u.lastLogin ? new Date(u.lastLogin) : null,
        updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        permissions: u.permissions || null,
      },
    });
  }
  console.log(`✔ Seeded ${users.length} users`);

  // 11. Roles
  const { roles } = readData('roles.json');
  for (const r of roles) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        name: r.name,
        key: r.key,
        description: r.description || null,
        isSystem: r.isSystem || false,
        isAdmin: r.isAdmin || false,
        permissions: r.permissions || {},
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${roles.length} roles`);

  // 12. Notifications
  const { notifications } = readData('notifications.json');
  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        targetUserId: n.targetUserId || null,
        targetUserName: n.targetUserName || null,
        createdByName: n.createdByName || null,
        dismissedBy: n.dismissedBy || [],
        createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
      },
    });
  }
  console.log(`✔ Seeded ${notifications.length} notifications`);

  // 13. Audit Logs
  const { auditLogs } = readData('auditLogs.json');
  for (const a of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        action: a.action,
        entityType: a.entityType || null,
        entityId: a.entityId || null,
        userId: a.userId || null,
        userName: a.userName || null,
        changes: a.changes || null,
        timestamp: a.timestamp ? new Date(a.timestamp) : new Date(),
        ipAddress: a.ipAddress || null,
        details: a.details || null,
      },
    });
  }
  console.log(`✔ Seeded ${auditLogs.length} audit logs`);

  console.log('\n✅ Database seeding complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Add seed config to `package.json`**

In `package.json`, add a `prisma` key at the root level:

```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

- [ ] **Step 4: Run the seed**

```bash
npx prisma db seed
```

Expected: All 13 `✔ Seeded N ...` lines followed by `✅ Database seeding complete!`

If a foreign key error occurs (e.g., stockIssue references a contractorId that doesn't exist in contractors), check the JSON files for dangling references and either fix the JSON or remove the offending row from the seed.

- [ ] **Step 5: Verify data in Supabase**

Open Supabase dashboard → **Table Editor** → check each table has data.

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts package.json package-lock.json
git commit -m "feat: add prisma seed script from existing json data"
```

---

## Task 5: Update Products API Routes

**Files:**
- Modify: `app/api/products/route.ts`
- Modify: `app/api/products/[id]/route.ts`

- [ ] **Step 1: Replace `app/api/products/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');

    const products = await prisma.product.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku,
        category: body.category || '',
        description: body.description || null,
        unitType: body.unitType || 'PCS',
        price: body.price || 0,
        image: body.image || null,
        minQuantity: body.minQuantity || 0,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/products/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        sku: body.sku,
        category: body.category,
        description: body.description,
        unitType: body.unitType,
        price: body.price,
        image: body.image,
        minQuantity: body.minQuantity,
      },
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    // Cascade is handled by Prisma schema (onDelete: Cascade on Inventory, StockMovement)
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Test with dev server**

```bash
npm run dev
```

Open browser → Products page → verify list loads. Add a product, edit it, delete it.

- [ ] **Step 4: Commit**

```bash
git add app/api/products/route.ts app/api/products/[id]/route.ts
git commit -m "feat: migrate products API to prisma"
```

---

## Task 6: Update Warehouses API Routes

**Files:**
- Modify: `app/api/warehouses/route.ts`
- Modify: `app/api/warehouses/[id]/route.ts`

- [ ] **Step 1: Replace `app/api/warehouses/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const warehouses = await prisma.warehouse.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(warehouses);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const warehouse = await prisma.warehouse.create({
      data: {
        name: body.name,
        location: body.location || null,
        address: body.address || null,
        manager: body.manager || null,
        capacity: body.capacity || 0,
        currentUsage: body.currentUsage || 0,
        status: body.status || 'ACTIVE',
      },
    });
    return NextResponse.json(warehouse, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/warehouses/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    return NextResponse.json(warehouse);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name: body.name,
        location: body.location,
        address: body.address,
        manager: body.manager,
        capacity: body.capacity,
        currentUsage: body.currentUsage,
        status: body.status,
      },
    });
    return NextResponse.json(warehouse);
  } catch {
    return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.warehouse.delete({ where: { id } });
    return NextResponse.json({ message: 'Warehouse deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/warehouses/route.ts app/api/warehouses/[id]/route.ts
git commit -m "feat: migrate warehouses API to prisma"
```

---

## Task 7: Update Inventory API Routes

**Files:**
- Modify: `app/api/inventory/route.ts`
- Modify: `app/api/inventory/[id]/route.ts`

- [ ] **Step 1: Replace `app/api/inventory/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      include: { product: true, warehouse: true },
      orderBy: { lastUpdated: 'desc' },
    });
    return NextResponse.json(inventory);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const item = await prisma.inventory.create({
      data: {
        productId: body.productId,
        warehouseId: body.warehouseId,
        totalQuantity: body.totalQuantity || 0,
        availableQuantity: body.availableQuantity || 0,
        reservedQuantity: body.reservedQuantity || 0,
        damagedQuantity: body.damagedQuantity || 0,
        lostQuantity: body.lostQuantity || 0,
      },
      include: { product: true, warehouse: true },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create inventory record' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/inventory/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const item = await prisma.inventory.findUnique({
      where: { id },
      include: { product: true, warehouse: true },
    });
    if (!item) return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const item = await prisma.inventory.update({
      where: { id },
      data: {
        totalQuantity: body.totalQuantity,
        availableQuantity: body.availableQuantity,
        reservedQuantity: body.reservedQuantity,
        damagedQuantity: body.damagedQuantity,
        lostQuantity: body.lostQuantity,
      },
      include: { product: true, warehouse: true },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: 'Failed to update inventory record' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.inventory.delete({ where: { id } });
    return NextResponse.json({ message: 'Inventory record deleted' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete inventory record' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/inventory/route.ts app/api/inventory/[id]/route.ts
git commit -m "feat: migrate inventory API to prisma"
```

---

## Task 8: Update Suppliers API Routes

**Files:**
- Modify: `app/api/suppliers/route.ts`
- Modify: `app/api/suppliers/[id]/route.ts`

- [ ] **Step 1: Replace `app/api/suppliers/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(suppliers);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplier = await prisma.supplier.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || null,
        status: body.status || 'ACTIVE',
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/suppliers/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    return NextResponse.json(supplier);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        country: body.country,
        status: body.status,
      },
    });
    return NextResponse.json(supplier);
  } catch {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/suppliers/route.ts app/api/suppliers/[id]/route.ts
git commit -m "feat: migrate suppliers API to prisma"
```

---

## Task 9: Update Contractors API Routes

**Files:**
- Modify: `app/api/contractors/route.ts`
- Modify: `app/api/contractors/[id]/route.ts`

- [ ] **Step 1: Replace `app/api/contractors/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const contractors = await prisma.contractor.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(contractors);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contractor = await prisma.contractor.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        role: body.role || null,
        company: body.company || null,
      },
    });
    return NextResponse.json(contractor, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create contractor' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/contractors/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const contractor = await prisma.contractor.findUnique({ where: { id } });
    if (!contractor) return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    return NextResponse.json(contractor);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const contractor = await prisma.contractor.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        role: body.role,
        company: body.company,
      },
    });
    return NextResponse.json(contractor);
  } catch {
    return NextResponse.json({ error: 'Failed to update contractor' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.contractor.delete({ where: { id } });
    return NextResponse.json({ message: 'Contractor deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete contractor' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/contractors/route.ts app/api/contractors/[id]/route.ts
git commit -m "feat: migrate contractors API to prisma"
```

---

## Task 10: Update Stock Transfers API Routes

**Files:**
- Modify: `app/api/stock-transfers/route.ts`
- Modify: `app/api/stock-transfers/[id]/route.ts`

- [ ] **Step 1: Replace `app/api/stock-transfers/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const transfers = await prisma.stockTransfer.findMany({ orderBy: { date: 'desc' } });
    return NextResponse.json(transfers);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transfer = await prisma.stockTransfer.create({
      data: {
        fromWarehouseId: body.fromWarehouseId,
        toWarehouseId: body.toWarehouseId,
        productName: body.productName,
        quantity: body.quantity,
        status: body.status || 'PENDING',
        date: body.date ? new Date(body.date) : new Date(),
      },
    });
    return NextResponse.json(transfer, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/stock-transfers/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    return NextResponse.json(transfer);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const transfer = await prisma.stockTransfer.update({
      where: { id },
      data: {
        fromWarehouseId: body.fromWarehouseId,
        toWarehouseId: body.toWarehouseId,
        productName: body.productName,
        quantity: body.quantity,
        status: body.status,
        date: body.date ? new Date(body.date) : undefined,
      },
    });
    return NextResponse.json(transfer);
  } catch {
    return NextResponse.json({ error: 'Failed to update transfer' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.stockTransfer.delete({ where: { id } });
    return NextResponse.json({ message: 'Transfer deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete transfer' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/stock-transfers/route.ts app/api/stock-transfers/[id]/route.ts
git commit -m "feat: migrate stock-transfers API to prisma"
```

---

## Task 11: Update Stock Issues API Routes

**Files:**
- Modify: `app/api/stock-issues/route.ts`
- Modify: `app/api/stock-issues/[id]/route.ts`

- [ ] **Step 1: Replace `app/api/stock-issues/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const issues = await prisma.stockIssue.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(issues);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const issue = await prisma.stockIssue.create({
      data: {
        productId: body.productId,
        productName: body.productName,
        unit: body.unit || 'PCS',
        warehouseId: body.warehouseId,
        contractorId: body.contractorId,
        contractorName: body.contractorName,
        quantity: body.quantity,
        purpose: body.purpose || null,
        issuedBy: body.issuedBy || null,
        status: body.status || 'Issued',
        notes: body.notes || null,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
      },
    });
    return NextResponse.json(issue, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create stock issue' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/stock-issues/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const issue = await prisma.stockIssue.findUnique({ where: { id } });
    if (!issue) return NextResponse.json({ error: 'Stock issue not found' }, { status: 404 });
    return NextResponse.json(issue);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const issue = await prisma.stockIssue.update({
      where: { id },
      data: {
        productId: body.productId,
        productName: body.productName,
        unit: body.unit,
        warehouseId: body.warehouseId,
        contractorId: body.contractorId,
        contractorName: body.contractorName,
        quantity: body.quantity,
        purpose: body.purpose,
        issuedBy: body.issuedBy,
        status: body.status,
        notes: body.notes,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
      },
    });
    return NextResponse.json(issue);
  } catch {
    return NextResponse.json({ error: 'Failed to update stock issue' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.stockIssue.delete({ where: { id } });
    return NextResponse.json({ message: 'Stock issue deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete stock issue' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/stock-issues/route.ts app/api/stock-issues/[id]/route.ts
git commit -m "feat: migrate stock-issues API to prisma"
```

---

## Task 12: Update Supply Receipts API Routes

**Files:**
- Modify: `app/api/supply-receipts/route.ts`
- Modify: `app/api/supply-receipts/[id]/route.ts`
- Modify: `app/api/supply-receipts/upload/route.ts` (keep upload logic, update DB write)

- [ ] **Step 1: Replace `app/api/supply-receipts/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const receipts = await prisma.supplyReceipt.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(receipts);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const receipt = await prisma.supplyReceipt.create({
      data: {
        supplierId: body.supplierId,
        supplierName: body.supplierName,
        warehouseId: body.warehouseId,
        warehouseName: body.warehouseName,
        dateTime: body.dateTime ? new Date(body.dateTime) : new Date(),
        verifiedBy: body.verifiedBy || null,
        totalAmount: body.totalAmount || 0,
        gatePassNumber: body.gatePassNumber || null,
        items: body.items || [],
        receiptFile: body.receiptFile || null,
      },
    });
    return NextResponse.json(receipt, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create supply receipt' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/supply-receipts/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const receipt = await prisma.supplyReceipt.findUnique({ where: { id } });
    if (!receipt) return NextResponse.json({ error: 'Supply receipt not found' }, { status: 404 });
    return NextResponse.json(receipt);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const receipt = await prisma.supplyReceipt.update({
      where: { id },
      data: {
        supplierId: body.supplierId,
        supplierName: body.supplierName,
        warehouseId: body.warehouseId,
        warehouseName: body.warehouseName,
        dateTime: body.dateTime ? new Date(body.dateTime) : undefined,
        verifiedBy: body.verifiedBy,
        totalAmount: body.totalAmount,
        gatePassNumber: body.gatePassNumber,
        items: body.items,
        receiptFile: body.receiptFile,
      },
    });
    return NextResponse.json(receipt);
  } catch {
    return NextResponse.json({ error: 'Failed to update supply receipt' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.supplyReceipt.delete({ where: { id } });
    return NextResponse.json({ message: 'Supply receipt deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete supply receipt' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Read `app/api/supply-receipts/upload/route.ts` then update only the DB write**

Read the file first. Find the line that calls `appendToJSON` or `writeJSON`. Replace it with:

```typescript
import { prisma } from '@/lib/prisma';
// Replace the writeJSON call with:
await prisma.supplyReceipt.create({ data: { ...receiptData } });
```

Keep all file upload logic unchanged.

- [ ] **Step 4: Commit**

```bash
git add app/api/supply-receipts/route.ts app/api/supply-receipts/[id]/route.ts app/api/supply-receipts/upload/route.ts
git commit -m "feat: migrate supply-receipts API to prisma"
```

---

## Task 13: Update Users and Roles API Routes

**Files:**
- Modify: `app/api/users/route.ts`
- Modify: `app/api/users/[id]/route.ts`
- Modify: `app/api/roles/route.ts`
- Modify: `app/api/roles/[id]/route.ts`

- [ ] **Step 1: Replace `app/api/users/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastLogin: true, updatedAt: true, permissions: true },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password,
        role: body.role || 'INVENTORY_MANAGER',
        status: body.status || 'ACTIVE',
        permissions: body.permissions || null,
      },
      select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, updatedAt: true, permissions: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/users/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const safeSelect = { id: true, name: true, email: true, role: true, status: true, createdAt: true, lastLogin: true, updatedAt: true, permissions: true };

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: safeSelect });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        ...(body.password ? { password: body.password } : {}),
        role: body.role,
        status: body.status,
        permissions: body.permissions,
        ...(body.lastLogin ? { lastLogin: new Date(body.lastLogin) } : {}),
      },
      select: safeSelect,
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Replace `app/api/roles/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(roles);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const role = await prisma.role.create({
      data: {
        name: body.name,
        key: body.key,
        description: body.description || null,
        isSystem: body.isSystem || false,
        isAdmin: body.isAdmin || false,
        permissions: body.permissions || {},
      },
    });
    return NextResponse.json(role, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Replace `app/api/roles/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    return NextResponse.json(role);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const role = await prisma.role.update({
      where: { id },
      data: {
        name: body.name,
        key: body.key,
        description: body.description,
        isSystem: body.isSystem,
        isAdmin: body.isAdmin,
        permissions: body.permissions,
      },
    });
    return NextResponse.json(role);
  } catch {
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.role.delete({ where: { id } });
    return NextResponse.json({ message: 'Role deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/users/route.ts app/api/users/[id]/route.ts app/api/roles/route.ts app/api/roles/[id]/route.ts
git commit -m "feat: migrate users and roles API to prisma"
```

---

## Task 14: Update Notifications and Stock Movements API Routes

**Files:**
- Modify: `app/api/notifications/route.ts`
- Modify: `app/api/notifications/[id]/route.ts`
- Modify: `app/api/stock-movements/route.ts`
- Modify: `app/api/audit-logs/route.ts`

- [ ] **Step 1: Replace `app/api/notifications/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const notification = await prisma.notification.create({
      data: {
        type: body.type,
        title: body.title,
        message: body.message,
        targetUserId: body.targetUserId || null,
        targetUserName: body.targetUserName || null,
        createdByName: body.createdByName || null,
        dismissedBy: body.dismissedBy || [],
      },
    });
    return NextResponse.json(notification, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Replace `app/api/notifications/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const notification = await prisma.notification.update({
      where: { id },
      data: { dismissedBy: body.dismissedBy },
    });
    return NextResponse.json(notification);
  } catch {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: any) {
  const { id } = await context.params;
  try {
    await prisma.notification.delete({ where: { id } });
    return NextResponse.json({ message: 'Notification deleted successfully' });
  } catch {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Replace `app/api/stock-movements/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const movements = await prisma.stockMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return NextResponse.json(movements);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const movement = await prisma.stockMovement.create({
      data: {
        productId: body.productId,
        warehouseId: body.warehouseId,
        type: body.type,
        quantity: body.quantity,
        reason: body.reason || null,
        reference: body.reference || null,
        performedBy: body.performedBy || null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(movement, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create stock movement' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Replace `app/api/audit-logs/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/notifications/route.ts app/api/notifications/[id]/route.ts app/api/stock-movements/route.ts app/api/audit-logs/route.ts
git commit -m "feat: migrate notifications, stock-movements, audit-logs API to prisma"
```

---

## Task 15: Update Dashboard and Reports API Routes

**Files:**
- Modify: `app/api/dashboard/route.ts`
- Modify: `app/api/reports/route.ts`
- Modify: `lib/dashboard.ts` (replace readJSON with prisma)

- [ ] **Step 1: Read `lib/dashboard.ts`**

Open the file and identify all `readJSON` calls. Replace each with the equivalent Prisma query using the `prisma` singleton from `lib/prisma.ts`.

Pattern for each entity:
- `readJSON('products.json').products` → `await prisma.product.findMany()`
- `readJSON('stockMovements.json').stockMovements` → `await prisma.stockMovement.findMany()`
- `readJSON('inventory.json').inventory` → `await prisma.inventory.findMany()`
- `readJSON('warehouses.json').warehouses` → `await prisma.warehouse.findMany()`

Make the functions `async` if they aren't already.

- [ ] **Step 2: Read `app/api/dashboard/route.ts`** and update it to `await` any now-async dashboard functions.

- [ ] **Step 3: Read `app/api/reports/route.ts`** and replace any `readJSON` calls with Prisma queries following the same pattern.

- [ ] **Step 4: Commit**

```bash
git add lib/dashboard.ts app/api/dashboard/route.ts app/api/reports/route.ts
git commit -m "feat: migrate dashboard and reports to prisma"
```

---

## Task 16: Add DATABASE_URL to Vercel and Deploy

- [ ] **Step 1: Add env vars to Vercel**

In Vercel dashboard → your project → **Settings → Environment Variables**:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | your pooled Supabase URL (port 6543) | Production, Preview, Development |
| `DIRECT_URL` | your direct Supabase URL (port 5432) | Production, Preview, Development |

- [ ] **Step 2: Add `prisma generate` to build step**

In `package.json`, update the `build` script:

```json
"build": "prisma generate && next build"
```

This ensures the Prisma client is generated during Vercel's build step.

- [ ] **Step 3: Commit and push**

```bash
git add package.json
git commit -m "chore: run prisma generate as part of build"
git push origin main
```

- [ ] **Step 4: Verify Vercel deployment**

Watch the Vercel build log — confirm `✔ Generated Prisma Client` appears before `next build`.

Open the live URL and test: Products, Stock Management, Transfers, Notifications — all CRUD operations should work and **persist across page refreshes** (unlike the JSON temp-file approach).

---

## Task 17: Cleanup — Remove `lib/db.ts`

Only do this after all routes are confirmed working on Vercel.

- [ ] **Step 1: Verify no remaining imports of `lib/db`**

```bash
grep -r "from '@/lib/db'" app/ lib/ --include="*.ts" --include="*.tsx"
```

Expected: no output (zero matches).

- [ ] **Step 2: Delete `lib/db.ts`**

```bash
rm lib/db.ts
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove json file database layer (lib/db.ts)"
```

---

## Self-Review Checklist

- [x] All 13 JSON files have corresponding Prisma models
- [x] All 27 API routes covered across Tasks 5–15
- [x] Seed script preserves existing IDs and handles all edge cases (missing fields, null values)
- [x] `stockTransfers.json` uses root key `transfers` (not `stockTransfers`) — handled in seed Task 4
- [x] Cascade deletes defined in schema for Product → Inventory, StockMovement
- [x] Password field never returned in user queries (select excludes it)
- [x] `prisma generate` added to build script for Vercel
- [x] Cleanup task gates on grep confirming zero remaining `lib/db` imports
