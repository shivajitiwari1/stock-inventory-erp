import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// HTTPS agent that bypasses SSL verification (needed for corporate proxy environments)
const agent = new https.Agent({ rejectUnauthorized: false });

async function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = JSON.stringify(body);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      agent,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON response')); }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
  console.error('Missing env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN');
  process.exit(1);
}
const BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

function readData(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
}

async function d1Batch(statements) {
  const data = await httpPost(`${BASE_URL}/batch`, {
    statements: statements.map(s => ({ sql: s.sql, params: s.params || [] })),
  });
  if (!data.success) {
    console.error('Batch error:', JSON.stringify(data.errors));
    throw new Error(data.errors?.[0]?.message || 'Batch failed');
  }
  return data;
}

async function d1Query(sql, params = []) {
  const data = await httpPost(`${BASE_URL}/query`, { sql, params });
  if (!data.success) throw new Error(data.errors?.[0]?.message || 'Query failed');
  return data.result?.[0]?.results || [];
}

async function runBatches(statements) {
  for (const stmt of statements) {
    await d1Query(stmt.sql, stmt.params || []);
  }
}

// ─── STEP 1: Create all tables ────────────────────────────────────────────────
async function createTables() {
  console.log('\n📋 Creating tables...');

  const ddl = [
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL DEFAULT '',
      description TEXT,
      unitType TEXT DEFAULT 'PCS',
      price REAL DEFAULT 0,
      image TEXT,
      minQuantity INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      address TEXT,
      manager TEXT,
      capacity INTEGER DEFAULT 0,
      currentUsage INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      warehouseId TEXT NOT NULL,
      totalQuantity INTEGER DEFAULT 0,
      availableQuantity INTEGER DEFAULT 0,
      reservedQuantity INTEGER DEFAULT 0,
      damagedQuantity INTEGER DEFAULT 0,
      lostQuantity INTEGER DEFAULT 0,
      lastUpdated TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (warehouseId) REFERENCES warehouses(id) ON DELETE CASCADE,
      UNIQUE(productId, warehouseId)
    )`,
    `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS contractors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT,
      company TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS stock_transfers (
      id TEXT PRIMARY KEY,
      fromWarehouseId TEXT NOT NULL,
      toWarehouseId TEXT NOT NULL,
      productName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'PENDING',
      date TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (fromWarehouseId) REFERENCES warehouses(id),
      FOREIGN KEY (toWarehouseId) REFERENCES warehouses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS stock_issues (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      productName TEXT NOT NULL,
      unit TEXT DEFAULT 'PCS',
      warehouseId TEXT NOT NULL,
      contractorId TEXT NOT NULL,
      contractorName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      purpose TEXT,
      issuedBy TEXT,
      status TEXT DEFAULT 'Issued',
      notes TEXT,
      issueDate TEXT NOT NULL DEFAULT (datetime('now')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (productId) REFERENCES products(id),
      FOREIGN KEY (warehouseId) REFERENCES warehouses(id),
      FOREIGN KEY (contractorId) REFERENCES contractors(id)
    )`,
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      warehouseId TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT,
      reference TEXT,
      performedBy TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (warehouseId) REFERENCES warehouses(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS supply_receipts (
      id TEXT PRIMARY KEY,
      supplierId TEXT NOT NULL,
      supplierName TEXT NOT NULL,
      warehouseId TEXT NOT NULL,
      warehouseName TEXT NOT NULL,
      dateTime TEXT NOT NULL,
      verifiedBy TEXT,
      totalAmount REAL DEFAULT 0,
      gatePassNumber TEXT,
      items TEXT DEFAULT '[]',
      receiptFile TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (supplierId) REFERENCES suppliers(id),
      FOREIGN KEY (warehouseId) REFERENCES warehouses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'INVENTORY_MANAGER',
      status TEXT DEFAULT 'ACTIVE',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      lastLogin TEXT,
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      permissions TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      description TEXT,
      isSystem INTEGER DEFAULT 0,
      isAdmin INTEGER DEFAULT 0,
      permissions TEXT DEFAULT '{}',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      targetUserId TEXT,
      targetUserName TEXT,
      createdByName TEXT,
      dismissedBy TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      entityType TEXT,
      entityId TEXT,
      userId TEXT,
      userName TEXT,
      changes TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      ipAddress TEXT,
      details TEXT
    )`,
  ];

  for (const sql of ddl) {
    await d1Query(sql);
  }
  console.log('✅ All 13 tables created');
}

// ─── STEP 2: Seed all data ────────────────────────────────────────────────────
async function seedProducts() {
  const { products } = readData('products.json');
  if (!products?.length) return;
  const stmts = products.map(p => ({
    sql: `INSERT OR IGNORE INTO products (id,name,sku,category,description,unitType,price,image,minQuantity,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    params: [p.id, p.name, p.sku, p.category||'', p.description||null, p.unitType||'PCS', p.price||0, p.image||null, p.minQuantity||0, p.createdAt||new Date().toISOString(), p.updatedAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${products.length} products`);
}

async function seedWarehouses() {
  const { warehouses } = readData('warehouses.json');
  if (!warehouses?.length) return;
  const stmts = warehouses.map(w => ({
    sql: `INSERT OR IGNORE INTO warehouses (id,name,location,address,manager,capacity,currentUsage,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    params: [w.id, w.name, w.location||null, w.address||null, w.manager||null, w.capacity||0, w.currentUsage||0, w.status||'ACTIVE', w.createdAt||new Date().toISOString(), w.updatedAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${warehouses.length} warehouses`);
}

async function seedInventory() {
  const { inventory } = readData('inventory.json');
  if (!inventory?.length) return;
  const stmts = inventory.map(i => ({
    sql: `INSERT OR IGNORE INTO inventory (id,productId,warehouseId,totalQuantity,availableQuantity,reservedQuantity,damagedQuantity,lostQuantity,lastUpdated) VALUES (?,?,?,?,?,?,?,?,?)`,
    params: [i.id, i.productId, i.warehouseId, i.totalQuantity||0, i.availableQuantity||0, i.reservedQuantity||0, i.damagedQuantity||0, i.lostQuantity||0, i.lastUpdated||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${inventory.length} inventory records`);
}

async function seedSuppliers() {
  const { suppliers } = readData('suppliers.json');
  if (!suppliers?.length) return;
  const stmts = suppliers.map(s => ({
    sql: `INSERT OR IGNORE INTO suppliers (id,name,email,phone,address,city,country,status,createdAt) VALUES (?,?,?,?,?,?,?,?,?)`,
    params: [s.id, s.name, s.email||null, s.phone||null, s.address||null, s.city||null, s.country||null, s.status||'ACTIVE', s.createdAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${suppliers.length} suppliers`);
}

async function seedContractors() {
  const { contractors } = readData('contractors.json');
  if (!contractors?.length) return;
  const stmts = contractors.map(c => ({
    sql: `INSERT OR IGNORE INTO contractors (id,name,phone,role,company,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)`,
    params: [c.id, c.name, c.phone||null, c.role||null, c.company||null, c.createdAt||new Date().toISOString(), c.updatedAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${contractors.length} contractors`);
}

async function seedStockTransfers() {
  const { transfers } = readData('stockTransfers.json');
  if (!transfers?.length) return;
  const stmts = transfers.map(t => ({
    sql: `INSERT OR IGNORE INTO stock_transfers (id,fromWarehouseId,toWarehouseId,productName,quantity,status,date) VALUES (?,?,?,?,?,?,?)`,
    params: [t.id, t.fromWarehouseId, t.toWarehouseId, t.productName, t.quantity, t.status||'PENDING', t.date||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${transfers.length} stock transfers`);
}

async function seedStockIssues() {
  const { stockIssues } = readData('stockIssues.json');
  if (!stockIssues?.length) return;
  const stmts = stockIssues.map(s => ({
    sql: `INSERT OR IGNORE INTO stock_issues (id,productId,productName,unit,warehouseId,contractorId,contractorName,quantity,purpose,issuedBy,status,notes,issueDate,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    params: [s.id, s.productId, s.productName, s.unit||'PCS', s.warehouseId, s.contractorId, s.contractorName, s.quantity, s.purpose||null, s.issuedBy||null, s.status||'Issued', s.notes||null, s.issueDate||new Date().toISOString(), s.createdAt||new Date().toISOString(), s.updatedAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${stockIssues.length} stock issues`);
}

async function seedStockMovements() {
  const { stockMovements } = readData('stockMovements.json');
  if (!stockMovements?.length) return;
  const stmts = stockMovements.map(m => ({
    sql: `INSERT OR IGNORE INTO stock_movements (id,productId,warehouseId,type,quantity,reason,reference,performedBy,notes,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    params: [m.id, m.productId, m.warehouseId, m.type, m.quantity, m.reason||null, m.reference||null, m.performedBy||null, m.notes||null, m.createdAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${stockMovements.length} stock movements`);
}

async function seedSupplyReceipts() {
  const { supplyReceipts } = readData('supplyReceipts.json');
  if (!supplyReceipts?.length) return;
  const stmts = supplyReceipts.map(r => ({
    sql: `INSERT OR IGNORE INTO supply_receipts (id,supplierId,supplierName,warehouseId,warehouseName,dateTime,verifiedBy,totalAmount,gatePassNumber,items,receiptFile,createdAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    params: [r.id, r.supplierId, r.supplierName, r.warehouseId, r.warehouseName, r.dateTime||new Date().toISOString(), r.verifiedBy||null, r.totalAmount||0, r.gatePassNumber||null, JSON.stringify(r.items||[]), r.receiptFile||null, r.createdAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${supplyReceipts.length} supply receipts`);
}

async function seedUsers() {
  const { users } = readData('users.json');
  if (!users?.length) return;
  const stmts = users.map(u => ({
    sql: `INSERT OR IGNORE INTO users (id,name,email,password,role,status,createdAt,lastLogin,updatedAt,permissions) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    params: [u.id, u.name, u.email, u.password, u.role||'INVENTORY_MANAGER', u.status||'ACTIVE', u.createdAt||new Date().toISOString(), u.lastLogin||null, u.updatedAt||new Date().toISOString(), u.permissions ? JSON.stringify(u.permissions) : null],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${users.length} users`);
}

async function seedRoles() {
  const { roles } = readData('roles.json');
  if (!roles?.length) return;
  const stmts = roles.map(r => ({
    sql: `INSERT OR IGNORE INTO roles (id,name,key,description,isSystem,isAdmin,permissions,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?)`,
    params: [r.id, r.name, r.key, r.description||null, r.isSystem?1:0, r.isAdmin?1:0, JSON.stringify(r.permissions||{}), r.createdAt||new Date().toISOString(), r.updatedAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${roles.length} roles`);
}

async function seedNotifications() {
  const { notifications } = readData('notifications.json');
  if (!notifications?.length) return;
  const stmts = notifications.map(n => ({
    sql: `INSERT OR IGNORE INTO notifications (id,type,title,message,targetUserId,targetUserName,createdByName,dismissedBy,createdAt) VALUES (?,?,?,?,?,?,?,?,?)`,
    params: [n.id, n.type, n.title, n.message, n.targetUserId||null, n.targetUserName||null, n.createdByName||null, JSON.stringify(n.dismissedBy||[]), n.createdAt||new Date().toISOString()],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${notifications.length} notifications`);
}

async function seedAuditLogs() {
  const { auditLogs } = readData('auditLogs.json');
  if (!auditLogs?.length) return;
  const stmts = auditLogs.map(a => ({
    sql: `INSERT OR IGNORE INTO audit_logs (id,action,entityType,entityId,userId,userName,changes,timestamp,ipAddress,details) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    params: [a.id, a.action, a.entityType||null, a.entityId||null, a.userId||null, a.userName||null, a.changes ? JSON.stringify(a.changes) : null, a.timestamp||new Date().toISOString(), a.ipAddress||null, a.details||null],
  }));
  await runBatches(stmts);
  console.log(`✅ Seeded ${auditLogs.length} audit logs`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting D1 migration...\n');

  // Verify connection
  const test = await d1Query('SELECT 1 as ok');
  if (!test?.[0]?.ok) throw new Error('D1 connection failed');
  console.log('✅ D1 connection verified');

  await createTables();

  console.log('\n📦 Seeding data from JSON files...');
  // Seed in dependency order (warehouses + products before inventory etc.)
  await seedProducts();
  await seedWarehouses();
  await seedSuppliers();
  await seedContractors();
  await seedInventory();
  await seedStockTransfers();
  await seedStockIssues();
  await seedStockMovements();
  await seedSupplyReceipts();
  await seedUsers();
  await seedRoles();
  await seedNotifications();
  await seedAuditLogs();

  console.log('\n✅ Migration complete! All data is now in Cloudflare D1.');

  // Show table counts
  console.log('\n📊 Table counts:');
  const tables = ['products','warehouses','inventory','suppliers','contractors','stock_transfers','stock_issues','stock_movements','supply_receipts','users','roles','notifications','audit_logs'];
  for (const t of tables) {
    const [row] = await d1Query(`SELECT COUNT(*) as count FROM ${t}`);
    console.log(`   ${t}: ${row.count} rows`);
  }
}

main().catch(e => { console.error('❌ Migration failed:', e.message); process.exit(1); });
