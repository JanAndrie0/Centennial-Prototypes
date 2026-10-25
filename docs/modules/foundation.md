# Step 0 · Foundation (build before any module)

Everything shared by all modules. Build it once, then every module plan reuses it.

## 0.1 Project structure (plain HTML, CSS and JS prototype)

```
/index.html                 → redirects to login
/login.html
/dashboard.html
/users/  list.html  history-log.html
/products/  list.html  detail.html  form.html  stock-check.html  reorder.html  transfers.html  counts.html
/customers/  list.html  detail.html
/orders/  list.html  new.html  detail.html  approvals.html  receipt.html
/deliveries/  list.html  detail.html  load-list.html
/purchasing/  list.html  new.html  detail.html  receive.html  suppliers.html
/payments/  record.html  receivables.html
/reports/  index.html  view.html
/m/  (sales agent mobile pages: home, new-order, stock, customers, payments, deliveries)
/assets/css/tokens.css  base.css  components.css
/assets/js/data.js  store.js  auth.js  layout.js  autosave.js  history.js  format.js
/assets/img/logo.svg  doodles/
```

## 0.2 Design tokens (`tokens.css`), copied from the team's Figma file `wqK6E9ID6UjqTnF3fFV6pZ`

- **Font:** Archivo.
  - Page title: 28 bold
  - Card title: 16 bold
  - KPI number: 26 bold
  - Body: 14 on desktop (15–16 is preferred for 30–50-year-old users), 16 on mobile
  - Button label: 14 semibold
  - Caption: 12
- **Colors:**

| Token | Value |
|---|---|
| bg | #f8fafc |
| card | #fff |
| text | #111827 |
| text-2 | #64748b |
| text-3 | #94a3b8 |
| border | #e5e7eb / #f1f5f9 |
| **accent (red)** | **#b91c1c** (hover #991b1b, active #7f1d1d) |
| focus ring | 3px rgba(185,28,28,.35) |
| success | #15803d on #f0fdf4 |
| warning | #b45309 on #fffbeb |
| error | #b91c1c on #fef2f2 |
| info | #1d4ed8 on #eff6ff |
| **sidebar** | #111827; text #e5e7eb; muted #9ca3af; hover #1f2937; divider #374151; active item red with white text |
| charts | bars #64748b, today's bar red, grid #e5e7eb |

- **Spacing:** 4 · 8 · 12 · 16 · 24 · 32 · 48. **Radius:** 6, 8 (inputs and buttons), 12 (cards), full (badges).
- **Shadows:** sm `0 1px 2px rgba(17,24,39,.05)`; md `0 4px 12px rgba(17,24,39,.08)`; lg `0 12px 32px rgba(17,24,39,.12)`.

## 0.3 Shared layout (`layout.js` injects it)

- **Desktop:**
  - Header 64px: logo, page search, the **branch in the top bar** on every screen (a branch switcher for the CEO and Office Manager: Centennial · I-KU · ECK 888 · All branches), alerts bell, user name and role, Log out.
  - Sidebar 248px, dark, items always icon plus text, with only the modules the role can open.
  - Content padding 32px. Each page starts with a breadcrumb "Home / Module", the page title, and a one-line description.
- **Mobile (Sales Agent):** header 60px (shows the branch), bottom tab bar 72px: Home · New Order · Stock · Customers · Payments.

## 0.4 Components to build once (`components.css`)

- Button: primary red, secondary, text, danger. **At least 44–48px tall.**
- Input, Select, Search with suggestions, Number stepper.
- Badge: **always icon plus label**.
- Table: sticky header, row hover, no wrapping of product names (truncate with a tooltip).
- Tabs, Segmented control, Card, KPI card, Modal, Toast.
- **Alert banner** and **Empty state** (message plus one action).
- **Autosave indicator** ("Saving…" / "Saved 2:41 PM").
- **File upload** with image preview: order slip and payment proof photos.
- **Status timeline**: for orders and deliveries.

## 0.5 Mock data (`data.js` + `store.js`)

`store.js` keeps the data in `localStorage` (with a "Reset demo data" link in the footer), so a record created on one page shows up on the others.

The seed data follows the **Chapter 3 ERD (21 tables), plus a branch**.

**Users and history**
- users: id, username, full_name, role, branch, is_active
  - **Roles:** CEO, Office Manager, Sales Supervisor, Admin/Warehouse Staff, Sales Agent. (The same five roles are named in Chapter 3 §3.3.)
- history_logs: id, user_id, datetime, action, module, record_type, record_id, field, old_value, new_value

**Products and stock**
- categories, units: pcs, box, pack, roll, dozen, gallon, can, pair
- products: id, code (SKU), name, category_id, unit_id (selling unit), selling_price, min_order_qty, floor_qty, ceiling_qty, critical_qty (= reorder point), supplier_id
- storage (areas per branch), stock_locations (product_id, area_id, qty)
- stock_movements: id, datetime, product_id, branch, area, type (Sale, Receive, Adjust, Transfer out, Transfer in, Count), qty_change, ref, user_id, reason

**Customers and sales**
- clients: id, store_name, contact_person, contact_no, address, credit_limit, branch, agent_id
- sales_orders: id, order_no, client_id, agent_id, encoded_by, branch, order_date, status, delivery_date, slip_photo, internal_note
  - status values: Draft · For approval · Approved · Rejected · For delivery · Shipped · Completed · Cancelled
- sales_order_items: order_id, product_id, qty, unit_price
- deliveries: id, order_id, schedule_date, truck_id, driver_id, status, shipped_at, completed_at, confirmed_by
- trucks, drivers

**Installments and payments**
- installment_plans: id, order_id, total, no_of_payments, start_date
- installment_schedules: plan_id, due_date, amount_due, amount_paid, status
- payments: id, order_id, client_id, amount, method (Cash, Cheque, Bank transfer), reference_no, date, proof_photo, received_by, channel (Office, Field), verified_by

**Suppliers and purchasing**
- suppliers; product_supplier: product_id, supplier_id, purchase_unit, conversion (for example, 1 box = 12 pcs)
- purchase_orders: id, po_no, supplier_id, branch, date, status, payment_status (Paid, Unpaid), approved_by
- purchase_order_items: po_id, product_id, qty_ordered (in the purchase unit), qty_received, unit_cost

**Derived values (computed, never stored):**
- allocated = qty in Approved or For delivery orders not yet shipped
- available = on hand − allocated (**can be negative**)
- stock status (see 03)
- customer balance = order totals − payments
- days overdue

**Seed content:**
- 3 branches; about 40 products across categories (PVC pipe ½" × 10 ft, common wire nail 2", concrete nail 3", gypsum screw 1", tox, Teflon tape, Pioneer Epoxy A and B, primer paint, contact cement, hinges, cable ties, electrical tape…)
- 12 hardware-store customers; 6 suppliers; 15 orders in mixed statuses; 3 installment plans; 2 trucks and 3 drivers
- **At least one product at −19 (Backordered)**, one Low, one Over ceiling; one customer **over the credit limit**; one **overdue** installment.

## 0.6 Behaviors every module uses

- **`auth.js`**
  - Demo login with a username per role. A small "Demo: log in as…" list sits under the form, for the review sessions.
  - It stores the current user and role and guards each page by role.
- **`history.js`**: `logChange(module, recordType, id, field, old, new)`. **Call it on every create, edit and delete.** This is the background audit trail (Chapter 3 constraint).
- **`autosave.js`**: every form autosaves a draft every few seconds and on blur, and shows the indicator. This is Problem D3 (the old software lost 6 days of receipts).
- **`format.js`**: ₱ money; quantities **always with the unit** ("120 boxes"); negative available shown as "−19 pcs" with a Backordered badge; Philippine date format (Oct 23, 2026).

## 0.7 UX rules (apply on every page)

1. One or two clicks to reach any screen (Problem D2). **One primary red button per screen.**
2. Senior-friendly:
   - Tap targets of at least 44–48px
   - Icons always with labels
   - Plain words
   - No hint text under fields
   - Tabs on detail pages
3. **Backordered is info or warning, never an error.** Warnings don't block saving; only missing required data blocks.
4. Statuses are written as words with an icon badge.
5. Confirm destructive actions in a modal.
6. Follow the staff's current encoding order (Chapter 3 Phase 2).

## 0.8 Acceptance check for step 0

- [ ] Token page renders all colors and type correctly.
- [ ] The layout shows the correct sidebar for each of the 5 roles; the branch shows in the header.
- [ ] Mock data loads; Reset works; `logChange` writes entries.
- [ ] Autosave indicator works on a test form.
