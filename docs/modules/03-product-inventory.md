# 3.0 · Product and Inventory Monitoring

**Chapter 3:** "Product and Inventory Monitoring will track product and stock levels, record stock adjustments, send low-stock alerts and answer stock inquiries."

**Child diagram 3.0** (revised Chapter 3)
- 3.1 Maintain Product Records: product and stock details from the administrative/warehouse staff in D3, using the supplier details in D9; logs to D2.
- 3.2 Update Stock Levels: changes the stock when items are **ordered, shipped, received or adjusted** (stock adjustment details from the staff). Each change is recorded in **D5 Stock Movement Records** and **D4 Stock Location Records**.
- 3.3 Check Stock Availability: reads D3 so sales agents and 2.0 can see what's available.
- 3.4 Monitor Stock Levels: compares stock against the **stock level settings** from the Office Manager, then sends the **low-stock alerts and the reorder list**.

**Proposed Solution table covers:**
- Product Management, Inventory Monitoring, **Warehouse and Stockroom Management**, Inventory Adjustment
- Unit display and conversion (mother box → pieces)
- Floor and ceiling, reorder points, low-stock alerts
- Fast and slow movers
- Negative (pre-order) stock
- **Branch stock transfers**

**Solves problems:**
- B1–B5: no alert, no reorder level, office-only, confusing negatives, manual conversion
- A4–A5: Sunday stock checks, agents calling to ask about stock
- E2, E3, E5, E6: no company-wide view, no transfers, different names and prices across branches

## Adapted features in this module

| From | Feature | Where |
|---|---|---|
| Cin7 Core | Cloud access to stock from personal devices | Stock Check (desktop + mobile) |
| Cin7 Core / inFlow | UOM: one selling unit, purchase units with a conversion ratio | Product form → Units tab |
| inFlow | Reorder point + **reorder list** of products that fall below it as orders are placed | Reorder List screen |
| inFlow (difference) | Negative available stays visible as pre-ordered | Every stock column |
| Zoho | Committed (allocated) vs available stock; unit shown; low against reorder level **and maximum level** | Lists, detail, alerts |
| Unleashed | Available, allocated, floor and ceiling **on one screen**; stock by warehouse; stock updated automatically by sales | Product detail header |
| Zoho / Unleashed | Fast- and slow-moving filter (the full report lives in 6.0) | Product list filter |

## Stock rules (show on every stock screen)

| Value | Rule |
|---|---|
| **On hand** | Physical quantity in that branch's storage areas |
| **Allocated** | Quantity in approved orders that haven't shipped yet (reserved for a customer) |
| **Available** | On hand − allocated. **It can be negative**, for example −19 pcs = **Backordered**. |

Status badges, shown with an icon and a label. ⚠ **Thresholds to confirm with the client**; see 00 §5.

| Badge | Condition | Style |
|---|---|---|
| OK | — | Success |
| **Low** | available ≤ critical (reorder point) | Warning |
| **Below floor** | available < floor | Error style, with an icon and a label |
| **Backordered** | available < 0 | Info |
| **Over ceiling** | on hand > ceiling | Warning |

**Suggested reorder quantity** = ceiling − (available + on order).

Every stock change writes a **stock movement**: Sale, Receive, Adjust, Transfer out/in or Count. Each movement includes the user, date, reason and reference, plus `logChange`.

## Access

| Screen | CEO / OM / SS | Admin / Warehouse | Sales Agent |
|---|---|---|---|
| Product list / detail | Full | Full | View (Stock Check only) |
| Product form (create, edit) | Full | Full | — |
| Stock level settings (floor, ceiling, critical) | **Office Manager** sets them; others view | View | — |
| Adjust / Transfer / Count | Full | Full (own branch; can send to another branch) | — |
| Reorder list | Full (SS sends a stock order request to 4.2) | Full | — |

## Screens and build steps

### Step 1 · Product list (`products/list.html`), 3.1 Maintain Product Records / 3.3 Check Stock Availability

**What is displayed**
- Title "Products & Inventory", with the description "Find a product and see its stock."
- A big search box (name or code). It must stay fast with **more than 10,000 products**, so paginate the mock data.
- Filter chips: Category · Stock status (Low, Below floor, Backordered, Over ceiling) · Fast/Slow mover · Branch (management can pick **All branches** for the company-wide view).
- Table columns:
  - Code
  - Product name (no ugly wrapping)
  - Category
  - **Unit**
  - **On hand**, **Allocated**, **Available** (negative in the Backordered style)
  - Status badge
  - Location
- Primary button: **Add product** (staff and management).
- Row click → product detail.

### Step 2 · Product detail (`products/detail.html`)

**What is displayed**
- Header with the name, code, category and unit.
- **Four stat tiles in one row** (Unleashed): **Available · Allocated · Floor · Ceiling**. The critical / reorder point is shown under Floor.

**Tabs**
1. **Overview**: price, minimum order quantity, supplier, status badge, suggested reorder quantity.
2. **Stock by location**: table of branch → storage area → on hand. Buttons: Adjust, Transfer.
3. **Movements**: stock movement history (date, type, qty change with unit, ref, user, reason).
4. **Units and conversion**: selling unit; for each supplier, the purchase unit and conversion ("1 box = 12 pcs", "1 mother box = 250 pcs").
5. **History**: this record's audit log (old → new).

### Step 3 · Product form (`products/form.html`), 3.1 Maintain Product Records

Fields, in this order:
1. Code (SKU), name, category
2. **Selling unit** (one per product, as in inFlow)
3. Selling price (₱)
4. **Minimum order qty**
5. Supplier(s) with purchase unit + conversion
6. Storage location
7. Stock levels: **Floor**, **Ceiling** and **Critical / reorder point**. Only the Office Manager edits them (stock level settings → 3.4); others see them read-only.

Behavior:
- Autosave the draft; one primary **Save product** button.
- Validation: ceiling > critical ≥ floor ≥ 0.
- Product names, units and prices are **one record shared by all branches** (fixes Problems E5 and E6).

### Step 4 · Stock Check (desktop `products/stock-check.html`, mobile `m/stock.html`), 3.3 Check Stock Availability

**What is displayed**
- One search box, with results as cards: product name, **Available + unit** (Backordered badge when negative), status, and branch. An optional "Other branches" line shows where else it's available.
- **View only.** This is the agent's answer to "may stock pa ba?" without calling the Sales Supervisor (Problems A4 and A5).

### Step 5 · Stock adjustment / count / transfer (modals or `products/transfers.html`, `products/counts.html`), 3.2 Update Stock Levels (stock adjustment details) and Warehouse & Stockroom

**Adjust**
- Fields: product, area, quantity change (+/−), **reason** (damaged, count correction, return, other).
- Writes a movement + log entry.

**Physical stock count** (Warehouse and Stockroom Management)
- Pick an area → list the products with the system qty and a field for the counted qty → shows the differences → **Post count**, which creates the adjustments.

**Transfer** (Problem E3)
- From branch/area → to branch/area, product, qty (with unit).
- Status: Requested → Sent → Received. It writes Transfer out and Transfer in movements.

### Step 6 · Low-stock alerts and Reorder list (`products/reorder.html`), 3.4 Monitor Stock Levels → 4.2

**What is displayed**
- The alert banner count also shows in the header bell.
- Table columns: Product · Unit · Available · Critical/reorder point · Floor · Ceiling · **Suggested reorder qty** · Main supplier · Status badge.
- Tabs: **Needs reorder** (Low, Below floor, Backordered) · **Over ceiling** (overstock alert).

**Actions**
- **Create purchase request**: select rows, then go to 4.2 Prepare Purchase Request with the items filled in, grouped by supplier.
- **Stock order request** (Sales Supervisor): sends the selection to 4.2 Prepare Purchase Request, which then goes to the Office Manager for approval.
- Management on **All branches** sees the combined needs of all branches. This feeds 4.0's combined supplier order (Problems E2 and E4).

### Step 7 · Connect to other modules
- 2.4 Record Sales Transaction → deduct stock (Sale movement); allocated updates on approval (2.3).
- 2.6 Mark shipped → allocated drops and on hand drops.
- 4.4 Receive Supplier Delivery → Receive movement in the selling unit.
- Each change re-evaluates the badges and the reorder list.

## Acceptance

- [ ] Search, filter and All-branches view work.
- [ ] Negative available shows as **Backordered**, not as an error.
- [ ] The four tiles show on the product detail.
- [ ] Adjust, count and transfer write movements and logs.
- [ ] The reorder list and over-ceiling list update when stock changes.
- [ ] The agent mobile stock check is view only and readable at 16px.
