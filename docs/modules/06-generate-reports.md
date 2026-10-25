# 6.0 · Generate Reports

**Chapter 3:** "Generate Reports will produce the reports requested by the CEO, the office manager and the administrative/warehouse staff, using data from the database."
**Change (Oct 23):** the Sales Supervisor also requests and views reports (own branch). Chapter 3 and the DFD don't list them yet; see `revision-plan.md`.

**Child diagram 6.0** (revised Chapter 3)
- 6.1 Receive Report Request: the **report type and date range** from the CEO, the Office Manager, the Sales Supervisor or the administrative/warehouse staff.
- 6.2 Compile Sales and Payment Data: D7 sales and backorders, D8 deliveries, D12 payments, plus the receivables data from 5.0.
- 6.3 Compile Inventory Data: D3 product and stock data, D5 stock movements.
- 6.4 Compile Purchasing Data: D10 purchase orders.
- 6.5 Produce Reports.

6.2–6.4 are the data steps behind one report view; they don't need screens of their own.

**Proposed Solution table:**
- Inventory Summary
- **Backorder Reports**
- **Reorder Reports**
- Stock Adjustment Reports
- Delivery Reports
- Sales Reports

**Solves problems:**
- #17 and #28: manual consolidation (E7 hand-consolidated branch reports)
- #39: aging
- SDG 12: fast and slow movers

## Adapted features in this module

| From | Feature | Where |
|---|---|---|
| **Zoho** | **Inventory Summary**: qty sold, purchased and available per product over a chosen period, in **daily, weekly or monthly** versions (the coordinator's "frequency-based") | Inventory Summary report |
| **Zoho / Unleashed** | **Fast- and slow-moving** products (Zoho aging/ABC, Unleashed top performers). Based on quantity sold, since cost isn't stored | Fast & Slow-Moving report |
| **Unleashed** | Reorder report | Reorder report |
| **Zoho (difference)** | **A few focused reports, not a 60-report centre** | Report list is about 9 items |

## Access

| | CEO / Office Manager | Sales Supervisor | Admin / Warehouse | Agent |
|---|---|---|---|---|
| Reports | All, all branches | **All reports, own branch** | **Request and view** (own branch) | — |

## The report list (keep it to these)

| Report | Shows | Data |
|---|---|---|
| **Sales report** | Sales per day, per agent, per category, per branch; order count; top products | Sales orders and items |
| **Backorder report** | Products with negative available; the orders waiting for them; on order from suppliers | Products, orders, POs |
| **Reorder report** | Products at or below the critical point / floor; suggested qty; supplier | Products |
| **Inventory Summary** (daily / weekly / monthly) | For each product: opening, **sold, purchased (received), adjusted, transferred**, closing, **available** | Stock movements |
| **Fast- and slow-moving products** | Ranked by qty sold in the period; slow = little or no sales and high stock (days since last sale) | Movements, products |
| **Stock adjustment report** | Adjustments and counts, with reason and user | Movements (Adjust, Count) |
| **Delivery report** | Deliveries by date, truck, driver, status; shipped and completed dates; confirmed by | Deliveries |
| **Purchase order and payables report** | POs by supplier and status; paid or unpaid | POs |
| **Payments and receivables report** | Collections by date and channel; **aging** (current, 30, 60, 90+) | Payments, installments |

The History Log Report stays in 1.0.

## Screens and build steps

### Step 1 · Reports list (`reports/index.html`), 6.1 Receive Report Request

Cards, one per report: icon, name, one-line description. Click → the report view with default filters (this month, the user's branch).

### Step 2 · Report view (`reports/view.html?type=…`), 6.1–6.5

**Filter bar** (6.1):
- **Date range** (presets: Today, This week, This month, Custom)
- **Frequency**: Daily / Weekly / Monthly (Inventory Summary, Sales)
- **Branch** (the CEO and Office Manager can pick **All branches**, which ends hand consolidation)
- Category / supplier / agent where relevant

**Body:**
- **Summary tiles** (2–4 numbers)
- **One chart**: bar for sales per day (today's bar red); horizontal bar for fast and slow movers
- **Table** with totals

**Actions:** **Print** (clean print stylesheet with the company header, report name, filters and generated-by and date) and Export (CSV).

**Empty state:** "No records for these filters."

### Step 3 · Wire each report to the mock data
Compute everything from orders, movements, POs and payments, so numbers match the other modules.

## Acceptance

- [ ] All 9 reports open, filter by date, frequency and branch, and print cleanly.
- [ ] Inventory Summary totals match the stock movements.
- [ ] Fast/slow and backorder lists match 3.0.
- [ ] Staff see only their branch and can't open management-only filters.
- [ ] The Sales Supervisor has a Reports menu item and sees their own branch's reports (no All branches option).
