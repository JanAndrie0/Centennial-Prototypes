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
| 10 | **Design polish pass (ADR-006)** | **In progress** — shared motion done (Oct 25): new tokens `--ease-out`, `--ease-drawer`, `--dur-press/modal/toast/drawer`; dialogs pop in + backdrop fade; toasts fade out; KPI tiles, stock cards and queue items lift on hover; press scale 0.97. Depth started: KPI tiles have a 3px top accent by tone (hover turns it red); empty-state icons sit in a soft circle. Dashboard reviewed (Oct 25): category chart rows share one grid so labels show in full and bars line up; OM approval rows are full-width 48px links with a chevron. Product page reviewed (Oct 25): new shared **stock level meter** (`CNS.ui.levelMeter`, `.level-meter`) on the product Overview shows available against floor / reorder point / ceiling with a plain sentence ("36 pairs above the reorder point"), one meter per branch in All branches; Overview split into Product and Stock level cards (status badge no longer repeated); list shows Available in bold, shorter "Needs reorder" filter option, category text wraps instead of making the table scroll sideways. New order page reviewed (Oct 25): customer card leads with a **credit meter** (shared `CNS.ui.meter`: balance after this order against the credit limit, with "₱X credit left" / "Over the credit limit by ₱X"), then Balance now, Overdue, Agent · branch; remove-line buttons use the new shared quiet button (`.btn--quiet`); backorders moved out of "Check before sending" into their own info note (backordered is never a warning); line warnings no longer have big gaps (`.line-warn` margin fix); an alert at the end of a card no longer adds extra space. Agent home reviewed (Oct 25): new shared **list card** (`.list-cards`, `.list-card`; an `<a class="list-card">` gets a chevron, hover shadow and press scale); order cards lead with the store name (order no., total and delivery date below); "customers to follow up" cards show the same credit meter as New order ("₱78,060.00 credit left of ₱90,000.00"); bottom tab labels step down to 12px under 360px wide so they fit on one line at 320px. Order detail reviewed (Oct 25): new shared **status stepper** (`CNS.ui.steps`, `.steps`: done = green check, now = red ring, a rejected order stops with a red x) under the header, with a "Next: …" line (same text as the end of the Timeline tab); the staff note moved from the alert stack to a line under the order facts; the "Shipped, waiting for the agent" alert is gone (the stepper says it); line Stock badges say Shipped / Delivered instead of "Delivered from stock" on a shipped order, and nothing on a rejected one; the branch shows in the header facts only for CEO / Office Manager (others have it in the top bar). Purchase order detail reviewed (Oct 25): same status stepper + "Next" line (For approval → Approved → Ordered → [Partially received] → Received; Received + Unpaid → "Office Manager checks the invoice and marks it paid"), and **Mark paid** turns primary once everything is received; note moved under the facts; the "Approved, issue the PO" alert is gone; Received column shows the unit ("0 of 1 mother box"). **Fix:** the PO's print-only logo header and signature lines were showing on screen — `.print-only` is now hidden with `@media screen { … !important }` and keeps its own display (flex/grid) on paper. `.meta`, `.head-note`, `.progress-card`, `.progress-next` moved to `components.css` (were copied in 5 detail pages). Delivery detail reviewed (Oct 25): same stepper (Approved → Scheduled → Shipped → Completed) with a "Next" line, or "Delivered. Confirmed by … on …" once done; the Shipped / Delivered alerts are gone (the stepper line says it); Schedule and Pick list titles both sit above their cards. All four detail pages (order, PO, delivery, plus product) now share the same head pattern. Customer detail reviewed (Oct 25): the Overview "Credit" card repeated the tiles, so it became a **Payment record** card (last counted payment, installments open · late, bounced or rejected payments — the same facts the OM checks in 2.3); the credit meter moved into the Current balance tile ("Of a ₱80,000.00 credit limit"); the Credit limit tile has the OM's **Change credit limit** link instead of "You can change it in Overview"; `CNS.ui.meter`'s sentence (`say`) is now optional. Product list reviewed (Oct 25): the "Stock status" dropdown became **status filter tabs with counts** (All · Needs reorder · Backordered · Over ceiling · Levels not set; the shared `.tabs button[aria-pressed]` pattern from the order list), so problems are one click away and their counts follow the search, category and movement filters. "Needs reorder" = Low + Below floor + Backordered (same rule as the reorder list). Low / Below floor / OK no longer have their own option; old `?status=` links still filter. Order list reviewed (Oct 25): at **1280px** (office laptops) the Warnings column was cut off and the 8 status tabs scrolled sideways. Warnings now sit under the status badge in one "Status and warnings" column, and filter tabs (`.tabs button[aria-pressed]`, shared) tighten to 10px padding up to 1400px wide, still 44px tall; both fit at 1280 with no sideways scroll. **Remaining pages reviewed (Oct 26), every desktop page checked at 1280px and every `m/` page at 390 and 320px, no sideways scroll left:** order approvals shows the shared credit meter ("Balance if approved", replaces the over-credit alert; tiles Balance now · Overdue · Installments); purchase approvals puts "= 50 boxes" under the supplier qty (one column) so product names stop wrapping 4 lines; receive delivery "Adds to stock" lines up with its neighbours; reorder list, customer list, users list, history log, transfers fit 1280 (floor/ceiling under reorder point, last order under agent, date over time, branch over storage area, names and addresses wrap instead of being cut off); supplier addresses wrap; product form supplier labels back to normal size; stock check description no longer repeats the search hint; truck load list shows one empty message (no second empty section, Print disabled) and a status badge; new shared **`CNS.ui.deliveryBadge`** (list, detail, load list); report cards align icon with title; **reports**: a column can be marked `under` (shows as a line in the cell before it on screen, CSV keeps it separate), used by the Reorder report (Branch under Product, Floor and Ceiling under Reorder point); **chart fix**: day labels were clipped ("Oct 1" for Oct 13), shown labels now use their empty neighbours' room and give way to Today; record payment tiles keep values on one line; agent New order uses the same credit meter as desktop; agent "Confirmed" shows the date only. Shared: the last visible field in a card no longer doubles the bottom padding (`components.css`). **Alerts dropdown (Oct 26, user's reference image):** the header Alerts button now opens a panel (title + branch) with sections, most urgent first, same order as the dashboard banner: **Waiting for your approval** (Office Manager only, own branch: sales orders 2.3, purchase requests 4.2, field payments to verify 5.3, each row opens its queue), **Overdue customers** (CEO and Office Manager: store, overdue amount and days, opens the customer), **Low stock** (all desktop roles: product, status icon, available). Up to 4 rows per section, "See all" when there are more; the panel scrolls inside if long. The red count is the total of all sections (e.g. OM at Centennial: 4 + 1 + 6 = 11; staff: low stock only). Escape / click outside / tab away closes it; follows the branch switcher; pops in 160ms (`--dur-popover`), none with reduced motion (`layout.js`, `layout.css`). Computed from `CNS.store` so it works on every page. **1280px fixes missed earlier (Oct 26):** product list shows the code under the product name and the location wraps (it lists every branch in All branches); delivery detail's pick list lets product names wrap. Re-checked at 1280px as CEO (All branches) and as staff: order list, order detail, new order, product list and detail, customer detail, PO detail, delivery detail and the dashboard all fit with no sideways scroll. **Next:** team decides if the polish pass is done, then the review sessions (step 11) | `assets/css/tokens.css`, `base.css`, `components.css`, `layout.css`, `assets/js/format.js` |
| 11 | Review sessions with Centennial | After the polish pass | Run `docs/WALKTHROUGH.md`; record feedback here, then revise |

Dashboard notes (Oct 25): "Sales" counts an order once it is approved (2.4 Record Sales Transaction), by order date. The banner shows one item only, most urgent first: OM approvals → overdue customers → low stock (staff: deliveries today → low stock).

## 2. Decisions (with dates and reasons)

### Roles and access
- **Approvals are always on** (ADR-005). The Office Manager approves 2.3 orders and 4.2 purchase requests, verifies 4.5 supplier payables and 5.3 field payments. Each branch's own Office Manager approves that branch's records; others see them view-only.
- **The Office Manager manages user accounts for their own branch** (1.2). The CEO only views accounts and is the only role with the **History Log**.
- **The Sales Supervisor has Reports** (own branch only) but no User Accounts.
- **Admin/Warehouse Staff still encode orders** (2.1). Sales Supervisor orders enter at 2.2.
- **No module numbers in the sidebar menu** (user decision, Oct 26): "Sales Orders & Deliveries", not "2.0 Sales Orders & Deliveries". Process numbers stay in the docs and thesis, and in the approval labels (e.g. "Sales orders (2.3)").
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
