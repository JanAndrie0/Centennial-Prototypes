# Build progress and decisions

**Read this first, then keep it up to date.** Two people (each with their own Claude) work on this prototype. This file is the shared memory: what is built, what was decided and why, and what is still open. When you finish a step or the team decides something, update this file in the same commit.

Order of authority: decisions here and in the module plans (`docs/modules/`) beat the older text in `CLAUDE.md`.

---

## 1. Build status

Build order (from `docs/modules/00-overview-and-feature-map.md` §4): foundation → 01 → 03 → 05 part 1 → 02 → 04 → 05 part 2 → 06 → dashboards last → end-to-end walkthrough.

| Step | Module | Status | Pages |
|---|---|---|---|
| 0 | Foundation | Done | `assets/css/*`, `assets/js/*`, `dev/foundation.html` (test page) |
| 1 | 01 User Accounts & History Log | Done, approved | `login.html`, `users/list.html`, `users/history-log.html`, `users/account.html` |
| 2 | 03 Products & Inventory | Done, approved | `products/list, detail, form, stock-check, transfers, counts, reorder`, `m/stock.html` |
| 3 | 05 Customer Accounts, part 1 | Done, approved | `customers/list.html`, `customers/detail.html` |
| 4 | 02 Sales Orders & Deliveries | Done, browser-tested | `orders/list, new, approvals, detail, receipt`, `deliveries/list, detail, load-list`, `m/home, new-order, deliveries` |
| 5 | 04 Purchasing & Suppliers | Done, browser-tested | `purchasing/list, suppliers, new, approvals, detail, receive` |
| 6 | 05 Customer Accounts, part 2 | Done, browser-tested (Oct 25) | `payments/record, receipt, receivables`, installment plan modal in `customers/detail.html`, `m/customers, payments` |
| 7 | 06 Reports | Done, browser-tested (Oct 25) | `reports/index.html`, `reports/view.html?type=…` (9 reports) |
| 8 | Dashboards | Done, browser-tested (Oct 25) | `dashboard.html` (management: banner, 4 KPIs, sales per day 14 days, sales by category 30 days, OM approval card; staff: orders to pack, deliveries today, low stock, supplier deliveries, due-date reminders), `m/home.html` (agent: New order, deliveries to confirm, quick stock check, orders by status, customers to follow up) |
| 9 | End-to-end walkthrough | Done (Oct 25): no broken links, every page opened per role with no script errors; demo script written | `docs/WALKTHROUGH.md` (3 review sessions, steps per role, questions for the client, feature checklist, feedback table) |
| 10 | **Design polish pass (ADR-006)** | **In progress** — shared motion done (Oct 25): new tokens `--ease-out`, `--ease-drawer`, `--dur-press/modal/toast/drawer`; dialogs pop in + backdrop fade; toasts fade out; KPI tiles, stock cards and queue items lift on hover; press scale 0.97. Depth started: KPI tiles have a 3px top accent by tone (hover turns it red); empty-state icons sit in a soft circle. Dashboard reviewed (Oct 25): category chart rows share one grid so labels show in full and bars line up; OM approval rows are full-width 48px links with a chevron. Product page reviewed (Oct 25): new shared **stock level meter** (`CNS.ui.levelMeter`, `.level-meter`) on the product Overview shows available against floor / reorder point / ceiling with a plain sentence ("36 pairs above the reorder point"), one meter per branch in All branches; Overview split into Product and Stock level cards (status badge no longer repeated); list shows Available in bold, shorter "Needs reorder" filter option, category text wraps instead of making the table scroll sideways. **Next:** page-by-page review (order page, agent home) for visual depth, not just motion | `assets/css/tokens.css`, `base.css`, `components.css`, `layout.css`, `assets/js/format.js` |
| 11 | Review sessions with Centennial | After the polish pass | Run `docs/WALKTHROUGH.md`; record feedback here, then revise |

Dashboard notes (Oct 25): "Sales" counts an order once it is approved (2.4 Record Sales Transaction), by order date. The banner shows one item only, most urgent first: OM approvals → overdue customers → low stock (staff: deliveries today → low stock).

## 2. Decisions (with dates and reasons)

### Roles and access
- **Approvals are always on** (ADR-005). The Office Manager approves 2.3 orders and 4.2 purchase requests, verifies 4.5 supplier payables and 5.3 field payments. Each branch's own Office Manager approves that branch's records; others see them view-only.
- **The Office Manager manages user accounts for their own branch** (1.2). The CEO only views accounts and is the only role with the **History Log**.
- **The Sales Supervisor has Reports** (own branch only) but no User Accounts.
- **Admin/Warehouse Staff still encode orders** (2.1). Sales Supervisor orders enter at 2.2.
- On **User Accounts**, the Office Manager has **no branch switcher** (branch shown as fixed text via `CNS.layout.desktop({ lockBranch: [R.OM] })`). The CEO keeps it. (Oct 25)

### CEO account (Oct 25)
- The CEO account is set up once at installation. **Add/Edit user never offers CEO**, and the CEO's role can't be changed.
- **Only the CEO edits their own account**, in `users/account.html` (name, username, change password), reached from "My account" in the sidebar.
- If the CEO forgets their password, the Office Manager can only **Reset password** on the CEO row (temporary password, logged). The row shows "Managed by the CEO".
- Thesis note: add "The CEO maintains their own account" to 1.2.

### Products and stock
- **Fast/slow movers** (fine for now): fast = sold at least 20% of the ceiling in 30 days; slow = nothing sold in 30 days.
- A product with **no stock levels set** (ceiling 0) shows the grey badge **"Levels not set"** and stays off the reorder list. Backordered still wins if available is negative. Only the Office Manager edits floor / reorder point / ceiling.
- **Transfers between branches are Sent → Received** using `stock_movements` only (no transfers table in the ERD). The destination branch is in the Transfer out movement's reason ("To I-KU"). Moves inside one branch happen at once.
- Stock is **never stored**: on hand, allocated and available are always derived from movements and orders (ADR-003).

### Sales orders (Oct 25)
- **Approved / For delivery** = stock allocated (reserved). **Shipped** writes Sale movements (on hand drops). **Completed** = the agent confirmed delivery.
- **Shipping is kept simple:** Mark as shipped deducts the full quantity, even for backordered lines (on hand can go negative). Partial shipping is not modeled.
- The agent's "Confirm deliveries" screen keeps one red **Delivered** button per card (a deliberate exception to "one primary per screen").
- "Read slip with AI" is **mocked** (canned results in `assets/js/slip-reader.js`); every line must be confirmed. It never saves, prices or deducts stock.

### Purchasing
- One purchase request per supplier. Quantities are in the supplier's unit; stock is added in the selling unit using `product_supplier.conversion`. Receiving supports splitting one line into two products (mother box → Epoxy A + B).
- Payables (Unpaid) only count POs that are Ordered or received.

### Customer payments (Oct 25, confirm with the team)
- **Office payments count right away** (the money is already at the office; `verified_by` = the person who received it). **Field payments** are "For verification" until the **Office Manager of the customer's branch** verifies them in Receivables → To verify. Only counted payments lower the balance and fill installment rows.
- A payment applies to one item: an installment row, or a whole order without a plan. Partial payments allowed. On an installment, any extra spills into the next rows of the same plan.
- Proof photo is required for cheque and bank transfer at the office, and for every field payment.
- The OM can **Reject** a field payment (reason shown to the agent) and **Mark as bounced** a verified cheque on the customer's Payments tab. Both are stored as `bounced: true` plus `reject_reason`.
- Installment plans cover what is left on a billed order; optional down payment becomes the first row (due today). Frequencies: weekly, every 15 days, monthly. Rows are editable but must add up to the total.
- **Aging:** overdue installment rows age from their due date; everything else in the balance is "Current", because orders without a plan have no due date in the ERD (see open question).
- New columns added to `payments`: `receipt_no` (PR-0001…), `recorded_at`, `verified_at`, `reject_reason`; to `installment_plans`: `down_payment`, `created_by`. Seed payments show receipt numbers derived from their id.

### Reports (Oct 25)
- Nine reports, computed live from the same data (numbers match 3.0: backorders, reorder list and fast/slow use the same store functions).
- Snapshot reports (Backorder, Reorder, Receivables aging) say "As of today" instead of a date range.
- **Inventory Summary**'s frequency is the period itself: Daily = today, Weekly = this week, Monthly = this month (or custom dates). **Sales** frequency groups the chart and table by day, week or month.
- **Fast/slow** ranks by share of the ceiling sold (units differ between products), with the same 20% / none-sold rule as 3.0. Default range: last 30 days, so it matches the 3.0 filter.
- Branch filter: CEO and Office Manager pick any branch or All; Sales Supervisor and staff see their own branch only. Exports are logged in the History Log (action "Export").

## 3. Open questions (ask the team or client before building these)

- **D5:** which number triggers the low-stock alert. The plans treat the critical level and the reorder point as the same number.
- **D6:** `branches` isn't in the thesis ERD yet; the prototype adds it.
- **D7:** order edit window. The plans allow edits until Shipped; Chapter 3 says "until the delivery date".
- **D8:** one selling unit per product, and no product cost stored (so no cost/ABC reports).
- **D9:** map the Online Transaction Module for the coordinator.
- **Payment terms for orders without an installment plan:** when are they due (e.g. 30 days after delivery)? Until decided, they stay "Current" in aging and never become overdue.
- **Office payments verification:** confirm the Oct 25 rule above (office counts at once, only field payments need the OM).
- Agents can't edit their own orders on the phone yet (Chapter 3 says they can add products until the delivery date). Office staff can edit items on the desktop.

## 4. How the code is organized (reuse, don't copy)

- Every page loads `assets/js/core.js, icons.js, format.js, data.js, store.js, history.js, auth.js, layout.js` and calls `CNS.layout.desktop({ active: '<menu id>' })` or `CNS.layout.mobile({ active: '<tab id>' })`.
- **Data:** only through `CNS.store` (localStorage). Table and column names follow the ERD. If you change the seed in `data.js`, bump `VERSION` in `store.js` so every browser reloads the sample data.
- **Every change is logged** with `CNS.history.log(...)` or `CNS.history.logChange(module, recordType, id, field, old, new)`.
- Shared helpers: `CNS.ui.badge / stockBadge / levelMeter / orderBadge / toast / flash / confirm / tabs`, `CNS.autosave.attach`, `CNS.layout.moduleTabs`, `CNS.stockActions` (adjust/transfer/receive), `CNS.orderActions` (order status steps), `CNS.poActions` (purchase order steps), `CNS.slipReader`, `CNS.stockCheck`, `CNS.payActions` (installments, record / verify / reject payments, aging, due soon), `CNS.chart` (bar charts: `columns` over time, `rows` ranked; reuse for the dashboards), `CNS.reports` (the 9 report definitions).
- Styles: only the tokens in `assets/css/tokens.css` and the classes in `components.css` / `layout.css`. No hard-coded colors.
- Tab addresses look like `#view=items` (a plain `#items` can clash with element ids and make the page jump).
- Icons: Heroicons v2.2.0 outline in `assets/icons/outline/`. After adding an SVG there, run `node tools/build-icons.js`.
- Test in the browser (1440px and a phone width) before calling a page done. Use **Reset demo data** (page footer) after testing.

## 5. Working together

- Split work by module so two people don't edit the same page at once.
- Every session: **start** with "get the latest from GitHub" (`git pull`), **end** with "upload my changes to GitHub" (commit + `git push`).
- If git reports a conflict, ask Claude to explain both versions in plain words before keeping one.
- Update this file when you finish a step or make a decision.
