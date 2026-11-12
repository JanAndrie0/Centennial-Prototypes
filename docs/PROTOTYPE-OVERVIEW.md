# Centennial prototype: organized overview

Everything in this repository, gathered in one place (as of Nov 12, 2026, commit `e20a892`).
For day-to-day status and decisions, `docs/PROGRESS.md` is still the source of truth; this file is a map.

---

## 1. At a glance

| | |
|---|---|
| **System** | Web-Based Sales and Inventory Management System for Wholesale Hardware Operations (UE BSIT capstone, team of 5, adviser Prof. Marc Rodin C. Ligas) |
| **Client** | Centennial Nail and Screw Construction Corporation, Quezon City, plus I-KU Construction Corp. and ECK 888 Construction Corp. (one system, one database) |
| **What it is** | A clickable prototype for 3 client review sessions (Modified Waterfall, Phase 2: System Design) |
| **Tech** | Plain HTML, CSS, JavaScript. No build step, no backend. Data in the browser's `localStorage`. Later: PHP + MySQL on XAMPP |
| **Size** | 42 HTML pages (34 desktop, 7 phone, 1 dev test page), 17 shared JS files, 5 CSS files, 41 icons |
| **Status** | All modules built and browser-tested. Design polish pass in progress. Demo data trimmed for the panel (Nov 7). Next: client review sessions |
| **How to open** | Double-click `login.html` → **Demo: log in as…** → pick a role. Password for every account: `centennial`. **Reset demo data** is in every page footer |

---

## 2. Roles and what each one sees

Only 5 roles log in. Customers, suppliers and drivers never do.

| Menu item | CEO | Office Manager | Sales Supervisor | Admin / Warehouse Staff | Sales Agent (phone) |
|---|---|---|---|---|---|
| Dashboard | Management | Management + approvals list | Management | Staff dashboard | Agent home |
| User Accounts & History Log | View accounts, **History Log** (only role) | Manage own branch's accounts | — | — | — |
| Sales Orders & Deliveries | Full | Full, **approves orders** | Full | Full (encodes orders) | Own orders, confirm delivery |
| Products & Inventory | Full | Full, **sets stock levels** | Full | Full | Stock check only |
| Purchasing & Suppliers | Full | Full, **approves purchases, marks paid** | Full (stock order requests) | Full | — |
| Customer Accounts & Payments | Full | Full, **credit limits, verifies field payments** | Full | Office payments | Field payments, balances |
| Reports | All branches | Own branch | Own branch | Own branch | — |
| Branch in top bar | **Switcher** (Centennial · I-KU · ECK 888 · All) | Fixed text | Fixed text | Fixed text | In the phone header |

### Demo accounts

| Username | Name | Role | Branch |
|---|---|---|---|
| `ceo` | Roberto Tan | CEO | Centennial |
| `officemgr` | Maricel Santos | Office Manager | Centennial |
| `supervisor` | Joel Ramos | Sales Supervisor | Centennial |
| `warehouse` | Ana Cruz | Admin / Warehouse Staff | Centennial |
| `agent` | Ramon Dela Cruz | Sales Agent | Centennial |
| `om.iku` | Teresa Lim | Office Manager | I-KU |
| `agent3` | Paolo Reyes | Sales Agent | I-KU |
| `om.eck` | Carmela Uy | Office Manager | ECK 888 |
| `agent4` | Jessa Flores | Sales Agent | ECK 888 |

---

## 3. Every screen, by module

Process numbers follow the revised Chapter 3 (Oct 23). The sidebar shows module names without numbers.

### Login and home
| Page | What it does |
|---|---|
| `login.html`, `m/login.html` | Username + password, show/hide, Caps Lock warning, wrong-password and locked states, "Forgot password?" (ask your Office Manager), demo role picker (1.1) |
| `index.html` | Sends you to login |
| `dashboard.html` | **Management:** one alert banner, 4 key-number tiles (Sales today, Orders today, Low-stock items, Overdue balances) with change pills, "Sales, last 7 days" line vs the week before, Top 5 products (30 days), Sales by category donut; Office Manager also gets "Waiting for your approval". **Staff:** orders to pack, deliveries today, low stock, supplier deliveries, due-date reminders |
| Header **Alerts** panel (every desktop page) | Waiting for your approval (OM) → Overdue customers (CEO, OM) → Low stock (all), with a red count |

### 1.0 User Accounts & History Log
| Page | Process | What it does |
|---|---|---|
| `users/list.html` | 1.2 | Accounts table; Add / Edit user modal; deactivate (never delete); OM can only Reset password on the CEO row |
| `users/account.html` | 1.2 | "My account" – only the CEO edits the CEO account |
| `users/history-log.html` | 1.3, 1.4 | Who, when, action, record, field, old → new; filters; print/export (CEO only) |

### 2.0 Sales Orders & Deliveries
| Page | Process | What it does |
|---|---|---|
| `orders/list.html` | — | Status tabs with counts (Draft, For approval, Approved, Rejected, Shipped, Completed, Backordered); warnings under the status |
| `orders/new.html` | 2.1, 2.2 | Customer + credit meter, slip photo, **Read slip with AI** (mocked, confirm each line), keyboard-friendly lines, warnings (below minimum, over credit, overdue), backorder info note, autosave, "Send for approval" |
| `orders/approvals.html` | 2.3 | OM queue with the customer's payment record and "Balance if approved" meter; Approve or Reject with reason |
| `orders/detail.html` | 2.4 | Status stepper + "Next:" line; tabs for items, timeline, slip, payments, delivery |
| `orders/receipt.html` | 2.5 | Printable receipt with payments and remaining balance |
| `deliveries/list.html` | 2.6 | Scheduled date, order, customer, truck, driver, status |
| `deliveries/detail.html` | 2.6 | Schedule, truck and driver, pick list by storage area, **Mark as shipped** (stock deducted) |
| `deliveries/load-list.html` | 2.6 | Printable truck load list |
| `m/new-order.html` | 2.1 | Agent order with slip photo and credit meter |
| `m/deliveries.html` | 2.6 | Agent confirms delivery (one big **Delivered** button per card) |

### 3.0 Products & Inventory
| Page | Process | What it does |
|---|---|---|
| `products/list.html` | 3.1 | Search, status tabs with counts (All · Needs reorder · Backordered · Over ceiling · Levels not set), On hand / Allocated / **Available** |
| `products/detail.html` | 3.1, 3.2 | Product + stock-level meter (vs floor, reorder point, ceiling), stock by location, adjust, movement history |
| `products/form.html` | 3.1 | Code, name, category, supplier, selling unit, price, minimum order, floor / reorder point / ceiling (OM only), units and conversion |
| `products/stock-check.html`, `m/stock.html` | 3.3 | Quick view-only availability search (desktop and phone) |
| `products/transfers.html` | 3.2 | Moves between storage areas (instant) and branches (Sent → Received by the other branch) |
| `products/counts.html` | 3.2 | Physical stock count per area, posts the differences |
| `products/reorder.html` | 3.4 | Reorder list → Create purchase request / Stock order request |

### 4.0 Purchasing & Suppliers
| Page | Process | What it does |
|---|---|---|
| `purchasing/suppliers.html` | 4.1 | Supplier list and form |
| `purchasing/new.html` | 4.2 | Purchase request in the supplier's unit (one per supplier) |
| `purchasing/approvals.html` | 4.2 | OM approves; shows "= 50 boxes" conversion under the supplier qty |
| `purchasing/detail.html` | 4.3, 4.5 | Status stepper, printable PO, **Mark paid** once received |
| `purchasing/list.html` | 4.3–4.5 | PO list with status and Paid / Unpaid |
| `purchasing/receive.html` | 4.4 | Receive with conversion to the selling unit, partial receipts, split a mother box (250 → 125 Epoxy A + 125 Epoxy B) |

### 5.0 Customer Accounts & Payments
| Page | Process | What it does |
|---|---|---|
| `customers/list.html` | 5.1 | Stores, credit limit, balance, overdue badge |
| `customers/detail.html` | 5.1, 5.4 | Tabs Overview (payment record card), Orders, Payments, Installments; installment plan modal; OM changes credit limit, marks a cheque bounced |
| `payments/record.html` | 5.2 | Amount, method, reference, date, proof photo |
| `payments/receipt.html` | 5.2 | Payment receipt (PR-0001…) |
| `payments/receivables.html` | 5.3, 5.5 | **To verify** queue (field payments), aging table, overdue list |
| `m/customers.html` | 5.4 | Agent's stores with balance and credit meter |
| `m/payments.html` | 5.2 | Field payment with proof photo |
| `m/home.html` | — | Agent home: New order, deliveries to confirm, quick stock check, orders by status, customers to follow up |

### 6.0 Reports
`reports/index.html` lists the 9 reports; `reports/view.html?type=…` shows filters, a chart, a table, Print and Export (exports are logged).

| Report | Process | Notes |
|---|---|---|
| Sales | 6.2 | Daily / weekly / monthly; top products |
| Backorders | 6.2 | As of today |
| Reorder | 6.3 | As of today |
| Inventory Summary | 6.3 | The "frequency-based report" (daily, weekly, monthly) |
| Fast- and slow-moving products | 6.3 | Fast = ≥20% of ceiling sold in 30 days; slow = none sold |
| Stock adjustments | 6.3 | By reason |
| Deliveries | 6.2 | Per day |
| Purchase orders and payables | 6.4 | By supplier, paid / unpaid |
| Payments and receivables | 6.2 | Aging and collections |

### Developer page
`dev/foundation.html` shows every shared component in one place for testing.

---

## 4. Main flows (how a record moves)

**Sales order**
`2.1 New order (staff, agent, or Supervisor at 2.2)` → `For approval` → `2.3 OM approves` (stock **reserved**) or `Rejected` → `2.5 Receipt` → `2.6 Schedule delivery + load list` → `Mark as shipped` (stock **deducted**) → `Agent confirms` → `Completed`

**Purchase order**
`Reorder list / Stock order request` → `4.2 Purchase request` → `OM approves` → `4.3 Ordered` → `4.4 Received` (or Partially received; stock added in the selling unit) → `4.5 OM marks Paid`

**Customer payment**
Office payment → counts right away. Field payment → `For verification` → OM verifies (or rejects with a reason) → balance and installments update. A verified cheque can later be marked **bounced**.

**Stock transfer between branches**
`Transfer out (Sent)` → the other branch's OM clicks `Receive` → `Transfer in`

---

## 5. Business rules built in

- **Stock is never stored.** On hand, allocated and available are always calculated from stock movements and orders.
- **Available can go negative.** It shows as an info badge "Backordered −19", never an error, and the order still goes through.
- Stock badges: **Low** (available ≤ reorder point), **Below floor**, **Over ceiling** (on hand > ceiling), **Levels not set** (ceiling 0, off the reorder list), **Backordered** (wins over the others).
- Suggested reorder qty = ceiling − (available + on order).
- Warnings never block: below minimum order, over credit limit, overdue balance.
- One selling unit per product; purchase units convert via `product_supplier.conversion`.
- Shipping deducts the full quantity, even on backordered lines (no partial shipping).
- A payment applies to one installment row or one whole order; extra on an installment spills into the next rows.
- Proof photo required for cheque and bank transfer at the office, and for every field payment.
- Installment plans: optional down payment, weekly / every 15 days / monthly; rows must add up to the total.
- Every create, edit, approve, delete, login and export goes to the History Log with old → new values.
- Forms autosave drafts with a visible "Saved" status.

---

## 6. Demo data (kept small for the panel)

| Table | What's in it |
|---|---|
| Branches | Centennial (b1), I-KU (b2), ECK 888 (b3) |
| Storage areas | Centennial: Warehouse A, Warehouse B, Stockroom · I-KU: Main storage · ECK 888: Main storage |
| Categories (8) | Pipes & Fittings, Nails, Screws & Fasteners, Adhesives & Sealants, Paints, Door & Cabinet Hardware, Electrical, Tapes |
| Selling units (8) | pcs, box, pack, roll, dozen, gallon, can, pair |
| Products (12) | PVC pipe ½" × 10 ft, Common wire nail 2", Concrete nail 2", Concrete nail 3", Gypsum screw 1", Tox 6 mm, Pioneer Epoxy A, Pioneer Epoxy B, Primer paint white, Butt hinges 3", Cable ties 8", Teflon tape |
| Suppliers (6) | Pacific Pipe Supply, Luzon Steel Wire, Metro Fastener, Bonding Solutions, Rainbow Paints, Mabuhay Hardware & Electrical |
| Customers (6) | Golden Star, RJ Construction Supply, Bagong Pag-asa, Sto. Niño Builders Depot (Centennial) · Bayanihan Builders Supply (I-KU) · Evergreen Construction Supply (ECK 888) |
| Sales orders (10) | SO-2026-0101 to 0110: 7 Completed, 2 Approved, 1 For approval |
| Deliveries (7) | All Completed; trucks Isuzu Elf, Mitsubishi Fuso Canter; drivers Rodel Santos, Benjie Ocampo |
| Purchase orders (2) | PO-2026-0038 (epoxy mother box, Ordered, Unpaid) · PO-2026-0039 (wire nails, Received, Paid) |
| Payments (5) | Cheque, bank transfer, cash, one field cheque, one **bounced** cheque |
| Installment plan (1) | On Bagong Pag-asa's order: 3 payments every 15 days, one overdue |

### The demo story (one case each)
| Case | Where |
|---|---|
| **Backordered** | Pioneer Epoxy A at Centennial: on hand 6, allocated 25 → available −19 |
| **Below floor** | Concrete nail 3" |
| **Low** | Teflon tape |
| **Over ceiling** | Cable ties 8" |
| **Bad payer** | Bagong Pag-asa Hardware: over its ₱80,000 credit limit, overdue installment, bounced cheque |
| **Good payer** | Golden Star Hardware: balance ₱0 |
| **Mother-box split** | PO-2026-0038: one 250-pc box → 125 Epoxy A + 125 Epoxy B |
| **Waiting for approval** | SO-2026-0110 (Bagong Pag-asa) |

Dates are relative to today, so overdue items and this week's deliveries always look current. If `data.js` changes, bump `VERSION` in `store.js` (now 6).

---

## 7. Code map (for the teammates)

```
login.html, index.html, dashboard.html
users/  orders/  deliveries/  products/  purchasing/  customers/  payments/  reports/   desktop pages
m/                     agent phone pages
dev/foundation.html    component test page
assets/css/            tokens.css · base.css · components.css · layout.css · login.css
assets/js/             see below
assets/icons/outline/  Heroicons v2.2.0 (rebuild with: node tools/build-icons.js)
assets/img/logo.jpg    the red Centennial N&S logo
docs/                  plans, progress, walkthrough, architecture
```

| Script | Job |
|---|---|
| `core.js` | `CNS` namespace, role constants |
| `data.js` | Demo seed (ERD table names + `branches`) |
| `store.js` | `CNS.store`: localStorage database, derived stock |
| `auth.js` | Login, session, role checks, branch switch (CEO only) |
| `layout.js` | Header, sidebar, module tabs, alerts panel, phone tab bar |
| `history.js` | `CNS.history.log` / `logChange` |
| `format.js` | Money, dates, badges, meters, stepper, toasts, confirm modals (`CNS.ui`) |
| `icons.js` | Inlined icons |
| `autosave.js` | Draft autosave with "Saved" status |
| `chart.js` | Bar, line and donut charts with screen-reader tables |
| `order-actions.js` · `po-actions.js` · `payment-actions.js` · `stock-actions.js` | Status steps for orders, POs, payments, and stock adjust / transfer / receive |
| `slip-reader.js` | Mocked AI slip reading (canned lines) |
| `stock-check.js` | Shared stock check search |
| `reports.js` | The 9 report definitions |

Every page loads `core, icons, format, data, store, history, auth, layout` and calls `CNS.layout.desktop(...)` or `CNS.layout.mobile(...)`.

---

## 8. Design system

- **Font:** Archivo. Page title 28, card title 16, key number 26, body 14–16 desktop / 16 phone.
- **Colors:** background #f8fafc, cards white, text #111827, brand red #b91c1c (hover #991b1b), dark sidebar #111827 with red active item. Success green, warning amber, error red, info blue, each on a light tint.
- **Layout:** desktop header 64px, sidebar 248px, content padding 32px, breadcrumb above the title. Phone header 60px, bottom tab bar 72px (Home, New Order, Stock, Customers, Payments).
- **Shared pieces:** buttons (incl. quiet), badges with icon + word, KPI tiles with icon and change pill, credit meter, stock-level meter, status stepper, list cards, filter tabs with counts, modals, toasts, empty states, alerts panel.
- **Motion:** CSS only, ease-out, under 300ms (modals up to 350ms), transform/opacity only, none with reduced motion.
- **UX rules:** one red button per screen, 44–48px targets, icons always with labels, plain words, warnings not blocks, destructive actions confirm in a modal. Every page checked at 1280px (desktop) and 390 / 320px (phone).

---

## 9. Documents in `docs/`

| File | What it's for |
|---|---|
| `PROGRESS.md` | **Read first.** Build status, decisions with dates, open questions, code conventions |
| `PROTOTYPE-OVERVIEW.md` | This map |
| `WALKTHROUGH.md` | Script for the 3 client review sessions, feature checklist, feedback table |
| `architecture.md` | Stack, ADR-001 to ADR-007, agent rules |
| `revision-plan.md` | Thesis / DFD / ERD fixes after the Oct 23 Chapter 3 update (T1–T7, E1–E4, F1, P1–P10) |
| `modules/00-overview-and-feature-map.md` | Module list, related-systems feature map (Cin7, inFlow, Zoho, Unleashed, Turis), problems → modules, build order |
| `modules/foundation.md` | Shared layout, tokens, mock data schema |
| `modules/01`–`06`, `dashboards.md` | Step-by-step plan and acceptance checklist per module |
| `evidence/login/` | Login screenshots and evidence |

### Architecture decisions (ADRs)
1. Static prototype with mock data, no early backend
2. Mock data follows the ERD, plus a `branches` table
3. Stock is derived from movements
4. Approval step from the role update (superseded by 5)
5. Approvals always on; revised Chapter 3 numbering
6. Polish pass follows Emil Kowalski's rules, in plain CSS
7. Two teammates, one repo, a shared progress file

---

## 10. Open questions (still to settle)

| # | Question | Ask |
|---|---|---|
| D5 | Does the low-stock alert use the critical level or the reorder point? (Treated as the same number now) | Client |
| D6 | `branches` isn't in the thesis ERD yet | ERD owner |
| D7 | Can orders be edited until Shipped, or until the delivery date? | Client |
| D8 | One selling unit per product; no product cost (so no cost / ABC reports) | Client |
| D9 | How the coordinator's Online Transaction Module maps to the system | Coordinator |
| — | When are orders without an installment plan due? (Now never overdue) | Client |
| — | Should office payments also need the OM's verification? | Team / client |
| — | Agents can't edit their own orders on the phone yet | Team |
| — | Is the design polish pass done? | Team |

---

## 11. Other files in the repo

| Item | Note |
|---|---|
| `demo-audio/`, `get-demo-audio.bat`, `Demo Audio Credits.md` | Music (3 options, CC BY), 12 sound effects (CC0) and narration takes for the demo video |
| `.agents/skills/` | Design and animation skills used for the polish pass (not part of the app) |
| `skills-lock.json` | Lock file for those skills |
| `styles.css` (root) | **Not used by any page**: an early leftover; the real styles are in `assets/css/`. Safe to delete after a check |
| `README.md` | How to open the prototype |
