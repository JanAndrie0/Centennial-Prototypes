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
| 6 | **05 Customer Accounts, part 2** | **Next** | installments, record payment (office `payments/record.html`, field `m/payments.html`), verify, receivables `payments/receivables.html`, `m/customers.html` |
| 7 | 06 Reports | Not started | `reports/index.html`, `reports/view.html` |
| 8 | Dashboards | Not started (placeholders exist) | `dashboard.html`, `m/home.html` (agent home is partly built) |

The sidebar already links to `reports/index.html`; those pages don't exist yet.

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

## 3. Open questions (ask the team or client before building these)

- **D5:** which number triggers the low-stock alert. The plans treat the critical level and the reorder point as the same number.
- **D6:** `branches` isn't in the thesis ERD yet; the prototype adds it.
- **D7:** order edit window. The plans allow edits until Shipped; Chapter 3 says "until the delivery date".
- **D8:** one selling unit per product, and no product cost stored (so no cost/ABC reports).
- **D9:** map the Online Transaction Module for the coordinator.
- Agents can't edit their own orders on the phone yet (Chapter 3 says they can add products until the delivery date). Office staff can edit items on the desktop.

## 4. How the code is organized (reuse, don't copy)

- Every page loads `assets/js/core.js, icons.js, format.js, data.js, store.js, history.js, auth.js, layout.js` and calls `CNS.layout.desktop({ active: '<menu id>' })` or `CNS.layout.mobile({ active: '<tab id>' })`.
- **Data:** only through `CNS.store` (localStorage). Table and column names follow the ERD. If you change the seed in `data.js`, bump `VERSION` in `store.js` so every browser reloads the sample data.
- **Every change is logged** with `CNS.history.log(...)` or `CNS.history.logChange(module, recordType, id, field, old, new)`.
- Shared helpers: `CNS.ui.badge / stockBadge / orderBadge / toast / flash / confirm / tabs`, `CNS.autosave.attach`, `CNS.layout.moduleTabs`, `CNS.stockActions` (adjust/transfer/receive), `CNS.orderActions` (order status steps), `CNS.poActions` (purchase order steps), `CNS.slipReader`, `CNS.stockCheck`.
- Styles: only the tokens in `assets/css/tokens.css` and the classes in `components.css` / `layout.css`. No hard-coded colors.
- Tab addresses look like `#view=items` (a plain `#items` can clash with element ids and make the page jump).
- Icons: Heroicons v2.2.0 outline in `assets/icons/outline/`. After adding an SVG there, run `node tools/build-icons.js`.
- Test in the browser (1440px and a phone width) before calling a page done. Use **Reset demo data** (page footer) after testing.

## 5. Working together

- Split work by module so two people don't edit the same page at once.
- Every session: **start** with "get the latest from GitHub" (`git pull`), **end** with "upload my changes to GitHub" (commit + `git push`).
- If git reports a conflict, ask Claude to explain both versions in plain words before keeping one.
- Update this file when you finish a step or make a decision.
