# Design Spec: Supply Receipt, Stock Issue & Contractor Management

**Date:** 2026-05-16  
**Domain:** Builder / Construction ERP  
**Approach:** Three new independent pages added to the sidebar

---

## Overview

Three new modules for the Stock Inventory ERP used by construction/builder companies:

1. **Supply Receipt** — Record goods received from suppliers
2. **Stock Issue to Contractor** — Issue stock items to contractors/workers on site
3. **Contractor & Worker Management** — CRUD for the contractor/worker list used as a dropdown

---

## Module 1: Supply Receipt (`/supply-receipts`)

### Purpose
Record and store receipt documents when building materials arrive from a supplier at a warehouse.

### Fields

| Field | Type | Required |
|-------|------|----------|
| Supplier Name | Dropdown (from existing suppliers) | Yes |
| Warehouse | Dropdown (from existing warehouses) | Yes |
| Date & Time | DateTime picker (defaults to now) | Yes |
| Verified By | Free-text | Yes |
| Total Amount (₹) | Number | Yes |
| Gate Pass Number | Free-text | No |
| Items Received | Line-item table (see below) | No — can be added later |
| Receipt File | File upload (PDF, JPG, PNG, max 10MB) | No |

### Items Received (optional line-item table)
Each row: Product (dropdown from inventory) + Quantity (number) + Unit (auto-filled from product).  
Rows can be added and removed dynamically. Admin can skip this at receipt creation and fill it later via the Edit modal on the saved receipt.

### List View
Table with columns: Receipt ID, Supplier, Warehouse, Date, Total Amount, Gate Pass, Actions (View / Edit / Delete).  
Search by supplier name or gate pass number.

### Data Model (`data/supplyReceipts.json`)
```json
{
  "id": "sr-001",
  "supplierId": "sup-001",
  "supplierName": "ABC Traders",
  "warehouseId": "wh-001",
  "warehouseName": "Main Site Store",
  "dateTime": "2026-05-16T10:30:00",
  "verifiedBy": "John Smith",
  "totalAmount": 45000,
  "gatePassNumber": "GP-2026-001",
  "items": [
    { "productId": "prod-001", "productName": "Cement (OPC 53)", "quantity": 50, "unit": "Bags" }
  ],
  "receiptFile": "/uploads/receipts/sr-001.pdf",
  "createdAt": "2026-05-16T10:30:00"
}
```

### API Routes
- `GET /api/supply-receipts` — list all
- `POST /api/supply-receipts` — create new
- `PUT /api/supply-receipts/[id]` — update
- `DELETE /api/supply-receipts/[id]` — delete
- `POST /api/supply-receipts/upload` — file upload handler

### File Storage
Uploaded files saved to `public/uploads/receipts/`. Filename: `{receiptId}-{originalName}`.

---

## Module 2: Stock Issue to Contractor (`/stock-issues`)

### Purpose
Record when construction materials are issued from stock to a contractor or daily worker on site.

### Fields

| Field | Type | Required |
|-------|------|----------|
| Item Name | Dropdown (from products/inventory) — shows available stock count next to each item | Yes |
| Quantity | Number | Yes |
| Contractor / Worker | Dropdown (from contractors list) | Yes |
| Issue Date | Date picker (defaults to today) | Yes |
| Status | Dropdown (see below) | Yes |

### Status Options
`Issued` · `Partially Returned` · `Fully Returned` · `Damaged` · `Lost`

Default on creation: `Issued`.

### List View
Table with columns: Item, Qty, Contractor, Issue Date, Status (colored badge), Actions (Edit / Delete).  
Search by item name or contractor. Filter by status.

### Status Badge Colors
| Status | Color |
|--------|-------|
| Issued | Green |
| Partially Returned | Yellow |
| Fully Returned | Blue |
| Damaged | Red |
| Lost | Dark Red |

### Data Model (`data/stockIssues.json`)
```json
{
  "id": "si-001",
  "productId": "prod-001",
  "productName": "Cement (OPC 53)",
  "quantity": 10,
  "unit": "Bags",
  "contractorId": "con-001",
  "contractorName": "Ramesh Kumar",
  "issueDate": "2026-05-16",
  "status": "Issued",
  "createdAt": "2026-05-16T10:30:00"
}
```

### API Routes
- `GET /api/stock-issues` — list all
- `POST /api/stock-issues` — create new
- `PUT /api/stock-issues/[id]` — update (mainly for status changes)
- `DELETE /api/stock-issues/[id]` — delete

---

## Module 3: Contractor & Worker Management (`/contractors`)

### Purpose
Manage the list of contractors and daily workers who appear in the Stock Issue dropdown.

### Fields

| Field | Type | Required |
|-------|------|----------|
| Full Name | Text | Yes |
| Phone Number | Text | Yes |
| Role | Dropdown: `Contractor` / `Daily Worker` | Yes |
| Company Name | Text | No (optional for Daily Workers) |

### List View
Table with columns: Name, Phone, Role (badge), Company, Actions (Edit / Delete).  
Search by name or company name.

### Role Badge Colors
| Role | Color |
|------|-------|
| Contractor | Green |
| Daily Worker | Blue |

### Data Model (`data/contractors.json`)
```json
{
  "id": "con-001",
  "name": "Ramesh Kumar",
  "phone": "9876543210",
  "role": "Contractor",
  "company": "Kumar Constructions",
  "createdAt": "2026-05-16T10:30:00"
}
```

### API Routes
- `GET /api/contractors` — list all
- `POST /api/contractors` — create new
- `PUT /api/contractors/[id]` — update
- `DELETE /api/contractors/[id]` — delete

---

## Sidebar Navigation

Add three new entries to the sidebar (following existing icon + label pattern):

```
Supply Receipts     (receipt/document icon)
Stock Issues        (arrow-out icon)
Contractors         (people/worker icon)
```

---

## Shared Patterns

- All pages use modal-based forms (same pattern as Suppliers, Warehouses pages)
- Data persisted in JSON files via existing `lib/db.ts` utilities
- All forms use Tailwind CSS and react-icons, consistent with existing UI
- No external libraries needed beyond what's already installed

---

## Out of Scope

- Stock deduction on issue (inventory levels not automatically reduced — separate decision)
- Notifications or alerts on low stock after issue
- PDF generation of receipts
- Approval workflow for receipts

