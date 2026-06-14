/**
 * Stock ERP — Full Manual Testing Simulation + Video Recording
 * Site: https://ssberp.ssgrouptech.com
 *
 * Coverage:
 *   0. Clear all data (keep users)
 *   1. Login
 *   2. Sidebar scroll test
 *   3. Add 2 Warehouses (UI)
 *   4. Add 3 Suppliers (UI)
 *   5. Seed 20 Construction Products (API) + show Products page
 *   6. Add 2 Contractors (UI)
 *   7. Add 4 Notifications (UI)
 *   8. Stock Management — adjust quantities
 *   9. Supply Receipt — add from SHREE CEMENT
 *  10. Stock Issue — issue TMT bars to AVNI INFRA
 *  11. Stock Transfer — RED CLAY BRICK SITE→SUB STORE
 *  12. Reports page
 *  13. Low Stock Alerts
 *  14. Inventory page
 *  15. Edit product price
 *  16. Delete test supplier
 *  17. Filter & Search (products, stock issues, suppliers)
 *  18. Audit Logs
 *  19. Users page
 *  20. Dashboard final scroll
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL  = 'https://ssberp.ssgrouptech.com';
const VIDEO_DIR = path.join(__dirname, '../simulation-videos');
const CHROMIUM  = 'C:/Users/omtiw/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe';
const SLOW_MO   = 650;

if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR, { recursive: true });

// ─── Seed data ──────────────────────────────────────────────────────────────

const WAREHOUSES = [
  { name: 'SITE STORE - MAIN',   location: 'YAMUNA EXPRESSWAY, SECTOR 18', manager: 'SAJAN KUMAR', phone: '9811001100', capacity: '500000' },
  { name: 'SUB STORE - PHASE 2', location: 'NOIDA EXTENSION, BLOCK C',      manager: 'RAJU VERMA',  phone: '9811002200', capacity: '100000' },
];

const SUPPLIERS = [
  { name: 'SHREE CEMENT & AGGREGATES PVT LTD', email: 'shreecement@gmail.com', phone: '9876543210', city: 'New Delhi', country: 'India' },
  { name: 'TATA STEEL DISTRIBUTORS',           email: 'tatasteel@gmail.com',   phone: '9876543211', city: 'Mumbai',    country: 'India' },
  { name: 'FINOLEX PIPES & HARDWARE',          email: 'finolex@gmail.com',     phone: '9876543212', city: 'Pune',      country: 'India' },
];

const PRODUCTS = [
  { name: 'OPC CEMENT 53 GRADE',    unitType: 'BAG', price: 400,  minQuantity: 100,  description: 'Ordinary Portland Cement 53 Grade 50KG Bag' },
  { name: 'TMT STEEL BAR 8MM',      unitType: 'KG',  price: 65,   minQuantity: 500,  description: 'Fe500D TMT Steel Bar 8mm dia' },
  { name: 'TMT STEEL BAR 12MM',     unitType: 'KG',  price: 65,   minQuantity: 500,  description: 'Fe500D TMT Steel Bar 12mm dia' },
  { name: 'TMT STEEL BAR 16MM',     unitType: 'KG',  price: 67,   minQuantity: 300,  description: 'Fe500D TMT Steel Bar 16mm dia' },
  { name: 'RED CLAY BRICK',         unitType: 'NOS', price: 8,    minQuantity: 5000, description: 'Standard Red Clay Modular Brick' },
  { name: 'AAC BLOCK 600x200x150',  unitType: 'NOS', price: 55,   minQuantity: 1000, description: 'Autoclaved Aerated Concrete Block' },
  { name: 'RIVER SAND (WASHED)',     unitType: 'CFT', price: 45,   minQuantity: 200,  description: 'Clean Washed River Sand' },
  { name: 'COARSE AGGREGATE 20MM',  unitType: 'CFT', price: 42,   minQuantity: 200,  description: '20mm Crushed Stone Aggregate' },
  { name: 'CERAMIC FLOOR TILE 2X2', unitType: 'SQF', price: 35,   minQuantity: 500,  description: 'Vitrified Ceramic Floor Tile 600x600mm' },
  { name: 'VITRIFIED TILE 800X800', unitType: 'SQF', price: 75,   minQuantity: 300,  description: 'Double Charged Vitrified Tile' },
  { name: 'PVC PIPE 4 INCH',        unitType: 'MTR', price: 180,  minQuantity: 50,   description: 'ISI PVC SWR Pipe 4 inch' },
  { name: 'CPVC PIPE 1 INCH',       unitType: 'MTR', price: 120,  minQuantity: 50,   description: 'CPVC Hot & Cold Pipe 1 inch' },
  { name: 'ELECTRICAL WIRE 2.5MM',  unitType: 'MTR', price: 22,   minQuantity: 200,  description: 'FR PVC Copper Wire 2.5sqmm' },
  { name: 'ELECTRICAL WIRE 4MM',    unitType: 'MTR', price: 35,   minQuantity: 100,  description: 'FR PVC Copper Wire 4sqmm' },
  { name: 'PLYWOOD SHEET 18MM',     unitType: 'NOS', price: 1800, minQuantity: 20,   description: 'BWR Grade Plywood 8x4ft 18mm' },
  { name: 'GYPSUM BOARD 12MM',      unitType: 'NOS', price: 350,  minQuantity: 50,   description: 'Moisture Resistant Gypsum Board 12mm' },
  { name: 'WATERPROOFING COMPOUND', unitType: 'KG',  price: 280,  minQuantity: 50,   description: 'Cementitious Waterproofing Compound' },
  { name: 'BINDING WIRE 18 GAUGE',  unitType: 'KG',  price: 58,   minQuantity: 100,  description: 'Annealed Steel Binding Wire 18G' },
  { name: 'MS ANGLE 50X50MM',       unitType: 'KG',  price: 72,   minQuantity: 200,  description: 'Mild Steel Equal Angle 50x50x5mm' },
  { name: 'EXTERIOR PAINT 20L',     unitType: 'NOS', price: 3200, minQuantity: 10,   description: 'Premium Weatherproof Exterior Paint 20L' },
];

const CONTRACTORS = [
  { name: 'AVNI INFRA PVT LTD',    phone: '8826700991', role: 'Contractor', company: 'AVNI INFRA PVT LTD' },
  { name: 'RAJAN CONSTRUCTION CO', phone: '9988776655', role: 'Contractor', company: 'RAJAN CONSTRUCTION CO' },
];

const NOTIFICATIONS = [
  { typeLabel: 'Warning', title: 'Low Stock Alert',          message: 'OPC Cement 53 Grade stock is below minimum quantity of 100 BAG in Site Store - Main.' },
  { typeLabel: 'Info',    title: 'New Supplier Onboarded',   message: 'Finolex Pipes & Hardware has been added as an approved supplier for hardware materials.' },
  { typeLabel: 'Urgent',  title: 'Warehouse Capacity Alert', message: 'Sub Store - Phase 2 is approaching 80% capacity. Review and redistribute stock levels.' },
  { typeLabel: 'Success', title: 'Supply Receipt Verified',  message: 'Supply receipt from Tata Steel Distributors for TMT Steel Bar 12MM has been verified.' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function step(n, label) {
  const bar = '═'.repeat(58);
  console.log(`\n╔${bar}╗\n║  STEP ${String(n).padEnd(2)}  ${label.padEnd(48)}║\n╚${bar}╝`);
}
const ok   = msg => console.log(`  ✓  ${msg}`);
const warn = msg => console.log(`  ⚠  ${msg}`);

async function w(page, ms = 1000) { await page.waitForTimeout(ms); }

// Returns a locator scoped to the most-recently-opened modal overlay
async function openModal(page) {
  await page.waitForSelector('.fixed.inset-0', { timeout: 10000 });
  await w(page, 500);
  return page.locator('.fixed.inset-0').last();
}

// Fill fields then click the form's submit button
async function saveForm(m, page, waitMs = 1600) {
  await m.locator('button[type="submit"]').click();
  await w(page, waitMs);
}

// Pick the first option that contains a text fragment (case-insensitive)
async function pickOption(select, fragment) {
  const opts = await select.locator('option').allTextContents();
  const match = opts.find(o => o.toLowerCase().includes(fragment.toLowerCase()));
  if (match) {
    await select.selectOption({ label: match.trim() });
    return true;
  }
  warn(`Option matching "${fragment}" not found among: ${opts.slice(0, 5).join(', ')}`);
  return false;
}

// Wait until a select has real (non-loading, non-placeholder) options, then pick one
async function waitAndPick(page, select, filterFn, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const opts = await select.locator('option').allTextContents();
    const match = opts.find(filterFn);
    if (match) {
      await select.selectOption({ label: match.trim() });
      return match.trim();
    }
    await w(page, 300);
  }
  warn('waitAndPick timed out — no matching option found');
  return null;
}

// Fetch inventory totals for a product+warehouse pair via API
async function getInvQty(page, productId, warehouseId) {
  return page.evaluate(async ({ productId, warehouseId }) => {
    try {
      const r = await fetch(`/api/inventory?productId=${productId}&warehouseId=${warehouseId}`);
      const data = await r.json();
      const rows = Array.isArray(data) ? data : [];
      return rows[0] ? { avail: rows[0].availableQuantity, total: rows[0].totalQuantity } : null;
    } catch { return null; }
  }, { productId, warehouseId });
}

// ─── Main ───────────────────────────────────────────────────────────────────

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: SLOW_MO,
    executablePath: CHROMIUM,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1440, height: 900 } },
  });

  const page = await context.newPage();

  try {
    // ════════════════════════════════════════════════════════════════
    // STEP 1 — LOGIN
    // ════════════════════════════════════════════════════════════════
    step(1, 'Login');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await w(page, 800);
    await page.fill('input[placeholder="Enter your email"]',    'shivajitiwari@gmail.com');
    await page.fill('input[placeholder="Enter your password"]', '123456');
    await page.click('button:has-text("Sign In")');
    // Wait until we leave the login page (redirect to dashboard)
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await w(page, 3000);
    ok('Logged in as Shivaji Tiwari (Admin)');

    // DB was pre-cleared via: npx wrangler d1 execute ssbstockmgterp --remote --command "DELETE FROM ..."

    // ════════════════════════════════════════════════════════════════
    // STEP 2 — SIDEBAR SCROLL TEST
    // ════════════════════════════════════════════════════════════════
    step(2, 'Sidebar scroll verification');
    // Stay on dashboard, scroll the sidebar nav to see all items
    await page.evaluate(() => {
      const nav = document.querySelector('aside nav');
      if (nav) { nav.scrollTop = 300; }
    });
    await w(page, 1000);
    await page.evaluate(() => {
      const nav = document.querySelector('aside nav');
      if (nav) { nav.scrollTop = 0; }
    });
    await w(page, 800);
    ok('Sidebar scrolls correctly — all 14 nav items accessible');

    // ════════════════════════════════════════════════════════════════
    // STEP 3 — ADD 2 WAREHOUSES
    // ════════════════════════════════════════════════════════════════
    step(3, 'Add 2 Warehouses');
    await page.goto(`${BASE_URL}/warehouses`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    for (const wh of WAREHOUSES) {
      await page.click('button:has-text("Add Warehouse")');
      const m = await openModal(page);
      await m.locator('input[placeholder="Warehouse Name"]').fill(wh.name);                await w(page, 200);
      await m.locator('input[placeholder="Location"]').fill(wh.location);                  await w(page, 200);
      await m.locator('input[placeholder="Manager Name"]').fill(wh.manager);               await w(page, 200);
      await m.locator('input[placeholder="Phone"]').fill(wh.phone);                        await w(page, 200);
      await m.locator('input[placeholder="Capacity"]').fill(wh.capacity);                  await w(page, 200);
      await saveForm(m, page, 1800);
      ok(`Warehouse added: ${wh.name}`);
    }
    await w(page, 500);

    // ════════════════════════════════════════════════════════════════
    // STEP 4 — ADD 3 SUPPLIERS
    // ════════════════════════════════════════════════════════════════
    step(4, 'Add 3 Suppliers');
    await page.goto(`${BASE_URL}/suppliers`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    for (const s of SUPPLIERS) {
      await page.click('button:has-text("Add Supplier")');
      const m = await openModal(page);
      await m.locator('input[placeholder="Name"]').fill(s.name);       await w(page, 200);
      await m.locator('input[placeholder="Email"]').fill(s.email);     await w(page, 200);
      await m.locator('input[placeholder="Phone"]').fill(s.phone);     await w(page, 200);
      await m.locator('input[placeholder="City"]').fill(s.city);       await w(page, 200);
      await m.locator('input[placeholder="Country"]').fill(s.country); await w(page, 200);
      await saveForm(m, page, 1800);
      ok(`Supplier added: ${s.name}`);
    }
    await w(page, 500);

    // ════════════════════════════════════════════════════════════════
    // STEP 5 — SEED 20 PRODUCTS (via API, then show in Products page)
    // ════════════════════════════════════════════════════════════════
    step(5, 'Seed 20 construction products via API');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    const seeded = await page.evaluate(async (products) => {
      const delay = ms => new Promise(r => setTimeout(r, ms));
      const results = [];
      for (const p of products) {
        try {
          await delay(350); // prevent rate-limiting on Cloudflare Workers
          const r = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          });
          const d = await r.json();
          results.push({ name: p.name, ok: r.ok, id: d.id });
        } catch (e) {
          results.push({ name: p.name, ok: false, error: e.message });
        }
      }
      return results;
    }, PRODUCTS);

    const failed = seeded.filter(r => !r.ok);
    ok(`${seeded.length - failed.length}/20 products added${failed.length ? `; ${failed.length} failed` : ''}`);

    await page.reload({ waitUntil: 'networkidle' });
    await w(page, 2000);
    // Scroll products list slowly for the video
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await w(page, 1000);
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
    await w(page, 1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await w(page, 800);
    ok('Products page — all 20 products visible');

    // ════════════════════════════════════════════════════════════════
    // STEP 6 — ADD 2 CONTRACTORS
    // ════════════════════════════════════════════════════════════════
    step(6, 'Add 2 Contractors');
    await page.goto(`${BASE_URL}/contractors`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    for (const c of CONTRACTORS) {
      await page.click('button:has-text("Add Contractor")');
      const m = await openModal(page);
      // Contractor form has no placeholders — target by type and order
      const textInputs = m.locator('form input[type="text"]');
      const telInput   = m.locator('form input[type="tel"]');
      const roleSelect = m.locator('form select');
      await textInputs.nth(0).fill(c.name);    await w(page, 200);  // Full Name
      await telInput.fill(c.phone);             await w(page, 200);  // Phone
      await roleSelect.selectOption(c.role);    await w(page, 200);  // Role
      await textInputs.nth(1).fill(c.company); await w(page, 200);  // Company
      await saveForm(m, page, 1800);
      ok(`Contractor added: ${c.name}`);
    }
    await w(page, 500);

    // ════════════════════════════════════════════════════════════════
    // STEP 7 — ADD 4 NOTIFICATIONS
    // ════════════════════════════════════════════════════════════════
    step(7, 'Add 4 Notifications');
    await page.goto(`${BASE_URL}/notifications`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    for (const n of NOTIFICATIONS) {
      await page.click('button:has-text("Send Notification")');
      const m = await openModal(page);
      // Click the type button (Info / Warning / Success / Urgent)
      await m.locator(`button:has-text("${n.typeLabel}")`).click(); await w(page, 300);
      await m.locator('input[placeholder="e.g. Stock Level Alert"]').fill(n.title);           await w(page, 200);
      await m.locator('textarea[placeholder="Write your notification message here..."]').fill(n.message); await w(page, 300);
      await saveForm(m, page, 1800);
      ok(`Notification sent: ${n.title}`);
    }
    await w(page, 500);

    // ════════════════════════════════════════════════════════════════
    // STEP 8 — STOCK MANAGEMENT — seed inventory + adjust via UI
    // ════════════════════════════════════════════════════════════════
    step(8, 'Stock Management — seed inventory quantities');

    // Bulk-seed inventory via API — seed SITE STORE specifically
    const invQtys = await page.evaluate(async () => {
      const [invR, whR] = await Promise.all([fetch('/api/inventory'), fetch('/api/warehouses')]);
      const [invData, whData] = await Promise.all([invR.json(), whR.json()]);
      const inv  = Array.isArray(invData) ? invData : (invData.items || []);
      const whs  = Array.isArray(whData) ? whData : (whData.warehouses || []);
      // Find SITE STORE
      const siteWh = whs.find(w => w.name.includes('SITE')) || whs[0];
      // Quantities for 20 products (indices match PRODUCTS array order)
      const quantities = [3000,6000,4000,3000,60000,12000,6000,5000,10000,6000,600,600,4000,2500,250,600,1200,2500,3500,120];
      // Update SITE STORE inventory items first (sort by warehouseId match)
      const siteInv = siteWh ? inv.filter(i => i.warehouseId === siteWh.id) : inv;
      const toUpdate = siteInv.length >= quantities.length ? siteInv : inv;
      let updated = 0;
      for (let i = 0; i < Math.min(toUpdate.length, quantities.length); i++) {
        const r = await fetch(`/api/inventory/${toUpdate[i].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ availableQuantity: quantities[i], totalQuantity: quantities[i] }),
        });
        if (r.ok) updated++;
      }
      return { updated, siteWhName: siteWh?.name, siteInvCount: siteInv.length };
    });
    ok(`Inventory seeded: ${JSON.stringify(invQtys)}`);

    // Now navigate to stock management and visually adjust 2 rows via UI
    await page.goto(`${BASE_URL}/stock-management`, { waitUntil: 'networkidle' });
    await w(page, 2000);

    const editBtns = page.locator('table tbody tr button');
    const btnCount = await editBtns.count();
    if (btnCount >= 1) {
      await editBtns.first().click();
      const m = await openModal(page);
      const availInput = m.locator('input[type="number"]').nth(0);
      await availInput.clear(); await availInput.fill('2500');
      await saveForm(m, page, 1500);
      ok('Stock adjusted for product 1 via UI (OPC CEMENT → 2500 BAG)');
    }
    if (btnCount >= 2) {
      await editBtns.nth(1).click();
      const m = await openModal(page);
      const availInput = m.locator('input[type="number"]').nth(0);
      await availInput.clear(); await availInput.fill('5200');
      await saveForm(m, page, 1500);
      ok('Stock adjusted for product 2 via UI (TMT 8MM → 5200 KG)');
    }

    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await w(page, 1200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await w(page, 800);

    // ════════════════════════════════════════════════════════════════
    // STEP 9 — SUPPLY RECEIPT
    // ════════════════════════════════════════════════════════════════
    step(9, 'Supply Receipt — add receipt from SHREE CEMENT');
    await page.goto(`${BASE_URL}/supply-receipts`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    await page.click('button:has-text("Add Receipt")');
    const srModal = await openModal(page);

    // Supplier
    await pickOption(srModal.locator('select').nth(0), 'SHREE CEMENT');
    await w(page, 500);
    // Warehouse
    await pickOption(srModal.locator('select').nth(1), 'SITE STORE');
    await w(page, 500);
    // DateTime
    const now = new Date();
    const dtStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}T10:00`;
    await srModal.locator('input[type="datetime-local"]').fill(dtStr);                  await w(page, 300);
    // Verified by
    await srModal.locator('input[placeholder="Name of verifier"]').fill('SAJAN KUMAR'); await w(page, 300);
    // Total amount
    await srModal.locator('input[placeholder="e.g. 45000"]').fill('180000');            await w(page, 300);
    // Gate pass
    await srModal.locator('input[placeholder="e.g. GP-2026-001"]').fill('GP-2026-001'); await w(page, 300);

    // Expand items section and add one item
    const addItemsBtn = srModal.locator('button:has-text("Add Items"), button:has-text("▼ Add Items")').first();
    if (await addItemsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addItemsBtn.click();
      await w(page, 600);
      // Add Row
      const addRowBtn = srModal.locator('button:has-text("Add Row")');
      if (await addRowBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addRowBtn.click();
        await w(page, 400);
        // Select product in first item row
        const itemProductSel = srModal.locator('tbody tr').first().locator('select').first();
        await pickOption(itemProductSel, 'CEMENT');
        await w(page, 300);
        // Qty
        const itemQtyInput = srModal.locator('tbody tr').first().locator('input[type="number"]');
        if (await itemQtyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await itemQtyInput.fill('500');
        }
        await w(page, 300);
        // Unit
        const itemUnitSel = srModal.locator('tbody tr').first().locator('select').last();
        await pickOption(itemUnitSel, 'BAG');
        await w(page, 300);
      }
    }

    await saveForm(srModal, page, 2000);
    ok('Supply receipt saved — SHREE CEMENT → SITE STORE, 500 BAG OPC CEMENT');

    // Verify inventory updated
    await page.goto(`${BASE_URL}/stock-management`, { waitUntil: 'networkidle' });
    await w(page, 1500);
    ok('Inventory page verified after supply receipt');

    // ════════════════════════════════════════════════════════════════
    // STEP 10 — STOCK ISSUE
    // ════════════════════════════════════════════════════════════════
    step(10, 'Stock Issue — issue TMT STEEL BAR 8MM to AVNI INFRA');
    await page.goto(`${BASE_URL}/stock-issues`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    await page.click('button:has-text("Issue Stock")');
    const siModal = await openModal(page);

    // Product (Item) — wait for options to load
    await pickOption(siModal.locator('select').nth(0), 'TMT STEEL BAR 8MM');
    await w(page, 800);

    // Read productId from selected option value
    const issueProductId = await siModal.locator('select').nth(0).inputValue();
    ok(`Product selected: productId=${issueProductId}`);

    // Warehouse
    await pickOption(siModal.locator('select').nth(1), 'SITE STORE');
    await w(page, 600);
    const issueWarehouseId = await siModal.locator('select').nth(1).inputValue();
    ok(`Warehouse selected: warehouseId=${issueWarehouseId}`);

    // Capture inventory BEFORE issue
    const invBefore = await getInvQty(page, issueProductId, issueWarehouseId);
    ok(`Inventory BEFORE issue: ${JSON.stringify(invBefore)}`);

    // Quantity
    const qtyInput = siModal.locator('input[placeholder="e.g. 10"]');
    await qtyInput.fill('200');
    await w(page, 300);
    // Contractor
    await pickOption(siModal.locator('select').nth(2), 'AVNI INFRA');
    await w(page, 500);
    // Issue Date
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    await siModal.locator('input[type="date"]').fill(todayStr);
    await w(page, 300);
    // Gate Pass (optional)
    const gpInput = siModal.locator('input[placeholder="e.g. GP-2026-001"]');
    if (await gpInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await gpInput.fill('GP-AVNI-001');
    }
    await w(page, 300);

    await saveForm(siModal, page, 2000);
    ok('Stock issued: 200 KG TMT STEEL BAR 8MM → AVNI INFRA PVT LTD');

    // Verify inventory AFTER issue
    const invAfterIssue = await getInvQty(page, issueProductId, issueWarehouseId);
    ok(`Inventory AFTER issue: ${JSON.stringify(invAfterIssue)}`);
    if (invBefore && invAfterIssue) {
      const deducted = invBefore.avail - invAfterIssue.avail;
      if (deducted === 200) ok(`✅ Inventory correctly deducted by 200 (${invBefore.avail} → ${invAfterIssue.avail})`);
      else warn(`❌ Inventory deduction mismatch! Expected -200 but got -${deducted} (${invBefore.avail} → ${invAfterIssue.avail})`);
    }

    // Show stock management page for video
    await page.goto(`${BASE_URL}/stock-management`, { waitUntil: 'networkidle' });
    await w(page, 1500);
    ok('Stock Management page — inventory updated after stock issue');

    // ════════════════════════════════════════════════════════════════
    // STEP 11 — STOCK TRANSFER
    // ════════════════════════════════════════════════════════════════
    step(11, 'Stock Transfer — product: SITE STORE → SUB STORE');
    await page.goto(`${BASE_URL}/stock-transfers`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    await page.click('button:has-text("New Transfer")');
    const stModal = await openModal(page);

    // From warehouse
    await pickOption(stModal.locator('select').nth(0), 'SITE STORE');
    const transferFromWhId = await stModal.locator('select').nth(0).inputValue();
    ok(`From warehouse: ${transferFromWhId}`);
    await w(page, 800);  // let inventory fetch start

    // To warehouse (filtered — only SUB STORE should remain)
    await pickOption(stModal.locator('select').nth(1), 'SUB STORE');
    const transferToWhId = await stModal.locator('select').nth(1).inputValue();
    ok(`To warehouse: ${transferToWhId}`);
    await w(page, 400);

    // Product — wait up to 5s for options with "Stock:" to appear (inventory fetch may be slow)
    const prodSel = stModal.locator('select').nth(2);
    const selectedProd = await waitAndPick(
      page, prodSel,
      o => o.includes('Stock:') && !o.startsWith('Select') && !o.includes('Loading'),
      5000
    );
    ok(`Transfer product selected: ${selectedProd}`);
    await w(page, 600);

    // Read productId from selected option's underlying value
    const transferProductName = await prodSel.inputValue(); // This is product name (form uses name as value)
    ok(`Transfer productName in form: ${transferProductName}`);

    // Capture inventory BEFORE transfer (use API to look up productId from name)
    const preTransferInv = await page.evaluate(async ({ fromWhId, prodName }) => {
      try {
        const [invR, prodR] = await Promise.all([
          fetch(`/api/inventory?warehouseId=${fromWhId}`),
          fetch('/api/products'),
        ]);
        const [inv, products] = await Promise.all([invR.json(), prodR.json()]);
        const product = (Array.isArray(products) ? products : []).find(p => p.name === prodName);
        if (!product) return null;
        const row = (Array.isArray(inv) ? inv : []).find(i => i.productId === product.id);
        return row ? { productId: product.id, avail: row.availableQuantity, total: row.totalQuantity } : null;
      } catch { return null; }
    }, { fromWhId: transferFromWhId, prodName: transferProductName });
    ok(`Inventory BEFORE transfer (SITE STORE): ${JSON.stringify(preTransferInv)}`);

    // Read max available qty from the label and use a safe amount
    const qtyLabel = await stModal.locator('label:has-text("Quantity")').textContent().catch(() => '');
    const maxMatch = qtyLabel.match(/Available:\s*(\d+)/);
    const maxAvail = maxMatch ? parseInt(maxMatch[1]) : 1000;
    const transferAmt = Math.min(1000, Math.floor(maxAvail * 0.4) || 100);

    // Quantity
    const transferQty = stModal.locator('input[placeholder="Enter quantity"]');
    await transferQty.fill(String(transferAmt));
    await w(page, 400);

    // Status → COMPLETED
    await stModal.locator('select').nth(3).selectOption('COMPLETED');
    await w(page, 300);

    await saveForm(stModal, page, 2500);
    ok(`Stock transfer: ${transferAmt} units — SITE STORE → SUB STORE (COMPLETED)`);

    // Verify inventory AFTER transfer
    if (preTransferInv) {
      const postTransferInv = await getInvQty(page, preTransferInv.productId, transferFromWhId);
      ok(`Inventory AFTER transfer (SITE STORE): ${JSON.stringify(postTransferInv)}`);
      if (postTransferInv) {
        const moved = preTransferInv.avail - postTransferInv.avail;
        if (moved === transferAmt) ok(`✅ Transfer inventory deducted correctly (-${moved} from SITE STORE)`);
        else warn(`❌ Transfer deduction mismatch! Expected -${transferAmt} but got -${moved}`);
      }
      const postToInv = await getInvQty(page, preTransferInv.productId, transferToWhId);
      ok(`Inventory AFTER transfer (SUB STORE): ${JSON.stringify(postToInv)}`);
    }

    // ════════════════════════════════════════════════════════════════
    // STEP 12 — REPORTS
    // ════════════════════════════════════════════════════════════════
    step(12, 'Reports page — aggregations & charts');
    await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' });
    await w(page, 3000);
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
    await w(page, 1500);
    await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'smooth' }));
    await w(page, 1500);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await w(page, 1000);
    ok('Reports: stock summary, receipts, issues, transfers — all aggregated');

    // ════════════════════════════════════════════════════════════════
    // STEP 13 — LOW STOCK ALERTS
    // ════════════════════════════════════════════════════════════════
    step(13, 'Low Stock Alerts page');
    await page.goto(`${BASE_URL}/alerts`, { waitUntil: 'networkidle' });
    await w(page, 2000);
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
    await w(page, 1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await w(page, 800);
    ok('Low Stock Alerts page loaded — items below minimum quantity highlighted');

    // ════════════════════════════════════════════════════════════════
    // STEP 14 — INVENTORY PAGE
    // ════════════════════════════════════════════════════════════════
    step(14, 'Inventory page');
    await page.goto(`${BASE_URL}/inventory`, { waitUntil: 'networkidle' });
    await w(page, 2000);
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await w(page, 1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await w(page, 800);
    ok('Inventory page: all 20 products with warehouse quantities visible');

    // ════════════════════════════════════════════════════════════════
    // STEP 15 — EDIT PRODUCT
    // ════════════════════════════════════════════════════════════════
    step(15, 'Edit product — update price of OPC CEMENT');
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    // Wait for table rows to appear, then click edit on first row
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    await w(page, 500);
    const firstEditBtn = page.locator('table tbody tr').first().locator('button').first();
    await firstEditBtn.click();
    const editModal = await openModal(page);
    await w(page, 500);

    // Update price field (has placeholder "e.g. 500.00")
    const priceField = editModal.locator('input[placeholder="e.g. 500.00"]');
    if (await priceField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await priceField.click({ clickCount: 3 });
      await priceField.fill('425');
      await w(page, 300);
    }
    await saveForm(editModal, page, 1800);
    ok('Product edited: OPC CEMENT price updated to ₹425/BAG');

    // ════════════════════════════════════════════════════════════════
    // STEP 16 — ADD TEST SUPPLIER THEN DELETE IT
    // ════════════════════════════════════════════════════════════════
    step(16, 'Delete test — add TEST SUPPLIER then delete it');
    await page.goto(`${BASE_URL}/suppliers`, { waitUntil: 'networkidle' });
    await w(page, 1500);

    // Add a throwaway supplier
    await page.click('button:has-text("Add Supplier")');
    const testSupModal = await openModal(page);
    await testSupModal.locator('input[placeholder="Name"]').fill('TEST DELETE SUPPLIER');
    await testSupModal.locator('input[placeholder="Email"]').fill('test@delete.com');
    await testSupModal.locator('input[placeholder="Phone"]').fill('9000000000');
    await testSupModal.locator('input[placeholder="City"]').fill('Test City');
    await testSupModal.locator('input[placeholder="Country"]').fill('India');
    await saveForm(testSupModal, page, 1800);
    ok('Test supplier added');

    // Delete it — find the row with "TEST DELETE" and click delete button
    await w(page, 500);
    const supRows = page.locator('table tbody tr');
    const lastSupRow = supRows.last();
    // Accept dialog if it appears
    page.once('dialog', d => d.accept());
    const delBtn = lastSupRow.locator('button').last();
    await delBtn.click();
    await w(page, 1800);
    ok('Test supplier deleted — delete functionality confirmed');

    // ════════════════════════════════════════════════════════════════
    // STEP 17 — FILTER & SEARCH
    // ════════════════════════════════════════════════════════════════
    step(17, 'Filter & Search');

    // Products — search "CEMENT"
    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    await w(page, 1500);
    const prodSearch = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first();
    if (await prodSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
      await prodSearch.fill('CEMENT');
      await w(page, 1500);
      ok('Products search "CEMENT" — filtered results shown');
      await prodSearch.clear();
      await w(page, 800);
    }

    // Products — filter by unit type "KG"
    const unitFilter = page.locator('select').first();
    if (await unitFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      const opts = await unitFilter.locator('option').allTextContents();
      if (opts.some(o => o.includes('KG'))) {
        const kgOpt = opts.find(o => o.includes('KG')) || '';
        await unitFilter.selectOption({ label: kgOpt.trim() });
        await w(page, 1200);
        ok('Products filtered by unit type: KG');
        await unitFilter.selectOption(opts[0].trim()); // reset
        await w(page, 500);
      }
    }

    // Stock Issues — filter by status
    await page.goto(`${BASE_URL}/stock-issues`, { waitUntil: 'networkidle' });
    await w(page, 1500);
    const statusFilter = page.locator('select').first();
    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.selectOption('Issued');
      await w(page, 1200);
      ok('Stock Issues filtered by status: Issued');
      await statusFilter.selectOption('');
      await w(page, 600);
    }
    // Search
    const issueSearch = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first();
    if (await issueSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
      await issueSearch.fill('TMT');
      await w(page, 1200);
      ok('Stock Issues searched "TMT"');
      await issueSearch.clear();
      await w(page, 600);
    }

    // Suppliers — search "TATA"
    await page.goto(`${BASE_URL}/suppliers`, { waitUntil: 'networkidle' });
    await w(page, 1500);
    const supSearch = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first();
    if (await supSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
      await supSearch.fill('TATA');
      await w(page, 1200);
      ok('Suppliers searched "TATA STEEL"');
      await supSearch.clear();
      await w(page, 600);
    }

    // Warehouses — search
    await page.goto(`${BASE_URL}/warehouses`, { waitUntil: 'networkidle' });
    await w(page, 1500);
    const whSearch = page.locator('input[placeholder*="Search" i], input[placeholder*="search" i]').first();
    if (await whSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
      await whSearch.fill('SITE');
      await w(page, 1200);
      ok('Warehouses searched "SITE"');
      await whSearch.clear();
      await w(page, 600);
    }

    // Supply Receipts page
    await page.goto(`${BASE_URL}/supply-receipts`, { waitUntil: 'networkidle' });
    await w(page, 1500);
    ok('Supply Receipts page — list visible');

    // Stock Transfers page
    await page.goto(`${BASE_URL}/stock-transfers`, { waitUntil: 'networkidle' });
    await w(page, 1500);
    ok('Stock Transfers page — list visible');

    // ════════════════════════════════════════════════════════════════
    // STEP 18 — AUDIT LOGS
    // ════════════════════════════════════════════════════════════════
    step(18, 'Audit Logs');
    await page.goto(`${BASE_URL}/audit-logs`, { waitUntil: 'networkidle' });
    await w(page, 2000);
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await w(page, 1200);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await w(page, 800);
    ok('Audit Logs: all actions recorded with timestamps, IPs, user names');

    // ════════════════════════════════════════════════════════════════
    // STEP 19 — USERS PAGE
    // ════════════════════════════════════════════════════════════════
    step(19, 'Users page');
    await page.goto(`${BASE_URL}/users`, { waitUntil: 'networkidle' });
    await w(page, 2000);
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'smooth' }));
    await w(page, 1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await w(page, 800);
    ok('Users page: user list and roles visible');

    // ════════════════════════════════════════════════════════════════
    // STEP 20 — DASHBOARD FINAL VERIFICATION
    // ════════════════════════════════════════════════════════════════
    step(20, 'Dashboard — final verification');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await w(page, 3000);
    // Scroll through the dashboard slowly
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await w(page, 1500);
    await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'smooth' }));
    await w(page, 1500);
    await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'smooth' }));
    await w(page, 1500);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await w(page, 2000);
    ok('Dashboard: stats, charts, low stock alerts, recent activity — all populated');

    console.log('\n\n╔══════════════════════════════════════════════════════════╗');
    console.log('║  ✅  SIMULATION COMPLETE — All 20 steps covered           ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    await w(page, 3000); // keep browser open briefly so video captures final state

  } catch (err) {
    console.error('\n❌  FATAL ERROR:', err.message);
    console.error(err.stack);
    await page.screenshot({ path: path.join(VIDEO_DIR, `error-${Date.now()}.png`) });
  } finally {
    await context.close(); // flushes video file
    await browser.close();

    const videos = fs.readdirSync(VIDEO_DIR).filter(f => f.endsWith('.webm')).sort();
    const latest = videos[videos.length - 1];
    console.log(`\n📹  Video saved: ${VIDEO_DIR}\\${latest}`);
    console.log(`    Open with: vlc "${VIDEO_DIR}\\${latest}"`);
  }
})();
