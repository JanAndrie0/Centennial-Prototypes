# 00 · Overview, build order and related-systems feature map

The plans in `docs/modules/` turn the **proposed system in Chapter 3** into buildable prototype screens. They also place every feature that **Chapter 2 says the system will adapt** from the related systems (Cin7 Core, inFlow, Zoho, Unleashed, Turis) inside the right module.

Sources used (thesis Google Doc "1CMR 1101 – BSIT CHAPTERS 1-3", read on October 23, 2026):
- Chapter 3: the 3.2 System Framework, the 3.3 DFD child diagram descriptions (**revised October 23 to match the Lucid DFD**), the 3.4 ERD (21 tables), and the 5 M's constraints.
- Chapter 2: Review of Related Systems and its Synthesis, plus the Operational Definition of Terms.
- The "Problem Identified" tab (problems A–F) and the "Proposed System Solution" table.
- The coordinator's non-negotiable module list (Tab 7).
- The October 18 role update: Management is split into CEO, Office Manager and Sales Supervisor. Chapter 3 now includes it: the Office Manager approves orders and purchase requests, verifies payments and payables, and manages the user accounts of their branch.

---

## 1. Module list (Chapter 3 numbering)

| # | Module (Ch. 3 framework) | Sub-processes (Ch. 3 child diagrams) | Coordinator items it covers |
|---|---|---|---|
| 1.0 | Manage User Accounts and History Log | 1.1 Verify User Login · 1.2 Maintain User Accounts · 1.3 Retrieve Activity Records · 1.4 Produce History Log Report | Database (security), role-based access |
| 2.0 | Order and Sales Management | 2.1 Record Sales Order · 2.2 Review and Validate Order · 2.3 Process Order Approval · 2.4 Record Sales Transaction · 2.5 Generate Receipt · 2.6 Schedule and Track Delivery | Order Management, Product Sales, Delivery Management, customer-to-company PO |
| 3.0 | Product and Inventory Monitoring | 3.1 Maintain Product Records · 3.2 Update Stock Levels · 3.3 Check Stock Availability · 3.4 Monitor Stock Levels | Product Management, Inventory Monitoring, Inventory Adjustment, Warehouse and Stockroom Management |
| 4.0 | Supplier and Purchasing | 4.1 Maintain Supplier Records · 4.2 Prepare Purchase Request · 4.3 Issue Purchase Order · 4.4 Receive Supplier Delivery · 4.5 Verify Supplier Payables | Supplier Management, company-to-supplier PO |
| 5.0 | Customer Accounts | 5.1 Maintain Customer Accounts · 5.2 Record Customer Payment · 5.3 Update Customer Balance · 5.4 Provide Customer Balance · 5.5 Monitor Receivables | Installments, partial payments, credit limits |
| 6.0 | Generate Reports | 6.1 Receive Report Request · 6.2 Compile Sales and Payment Data · 6.3 Compile Inventory Data · 6.4 Compile Purchasing Data · 6.5 Produce Reports | Reports Generation, Inventory Summary and Frequency-Based Reporting |
| — | Dashboard (each role's home, **not a module**) | — | — |

The coordinator's **Online Transaction Module** does not fit, because customers never log in. Its parts map to features already planned: viewing is stock check, reservation is allocated stock, ordering is agents encoding orders, and payment processing is staff recording payments.

---

## 2. Related-systems feature map (what we said we'd adapt, and where it goes)

### Cin7 Core
"The proposed project will adapt only the essential Unit of Measure (UOM) logic and cloud accessibility."

| Adapted feature | Module / screen | How it shows in the prototype |
|---|---|---|
| Cloud accessibility: check stock remotely from personal devices, which fixes the weekend stock inquiries | **3.0** 3.3 Check Stock Availability → Stock Check (desktop and agent mobile); **Dashboard** | A responsive web app. Management and agents can open Stock Check on a phone. The dashboard reads live data. |
| UOM conversion rules for packaging sizes: bulk boxes or pallets broken down into pieces | **3.0** Product form → "Units and conversion" tab; **4.0** 4.2 Prepare Purchase Request (conversion shown) → 4.4 Receive Supplier Delivery | Each product–supplier pair stores a conversion (for example, 1 box = 12 pcs). Receiving converts the delivered quantity into the selling unit automatically. |

### inFlow Inventory
"The proposed system will follow the inFlow approach for tracking stock, for reorder points, and for accounts", with two differences.

| Adapted feature | Module / screen | How it shows |
|---|---|---|
| One standard selling unit per product; purchase units linked by a conversion ratio; stock kept in the selling unit (10 boxes × 6 pairs = 60 pairs) | **3.0** Product form; **4.0** 4.4 Receive Supplier Delivery; **2.0** Order lines show the unit | The unit is shown next to every quantity, everywhere. |
| Reorder point, and a Reorder Stock list of products that fall below it as orders are placed | **3.0** 3.4 Monitor Stock Levels → **Reorder list**; **4.0** 4.2 Prepare Purchase Request from the reorder list | When an order pushes available stock to or below the reorder point (critical level), the product joins the reorder list. "Create purchase request" is available there; the PO is issued after the Office Manager approves (4.3). |
| Individual accounts with access rights | **1.0** User Accounts | One account per person, with a role and a branch. The menu follows the role. |
| Team Member Tracking (who changed what, and when) | **1.0** History Log | **Improved:** every change records **field, old value and new value**, which inFlow lacks. |
| *Difference 1:* negative available quantity stays visible as "pre-ordered" | **2.0** Order entry; **3.0** Stock lists | Available can go below zero. It shows as **−19 pcs, Backordered**, never as an error. |
| *Difference 2:* field-level change log | **1.0** History Log (written by every module) | See the [01 plan](01-user-accounts-history-log.md). |

### Zoho Inventory
"Follow Zoho by separating committed and available stock, displaying the unit, and indicating low stock against a reorder level and maximum stock level… only a few reports, including a fast- and slow-moving item report and alerts based on floor and ceiling."

| Adapted feature | Module / screen | How it shows |
|---|---|---|
| Committed (allocated) vs available stock | **3.0** Product list and detail; **2.0** order entry | Columns: On hand · Allocated · Available |
| Unit displayed with stock | **3.0**, **2.0** | "120 boxes", never a bare number |
| Low stock against reorder level; **maximum stock level** | **3.0** 3.4 Monitor Stock Levels | Status badges: Low (at or below critical / reorder point), Below floor, **Over ceiling** |
| Inventory Summary (quantity sold, purchased and available over a chosen period) | **6.0** Inventory Summary report, daily, weekly or monthly | This is the coordinator's "frequency-based reporting" |
| Fast- and slow-moving identification (Zoho uses aging and ABC) | **6.0** Fast- and Slow-Moving Products report; **3.0** filter | Based on **quantity sold in the period**. Zoho's ABC is cost-based, and the ERD has no product cost, so the cost-based version is skipped. |
| *Unlike Zoho:* a few focused reports, not a 60-report centre | **6.0** Reports list | About 8 report types (see [06](06-generate-reports.md)) |

### Unleashed Inventory
"Show available stock, allocated stock, and the floor and ceiling quantity of each product on one screen… a report of fast- and slow-moving products… upload a photo or scan of a customer's payment proof… pre-orders as negative available quantity."

| Adapted feature | Module / screen | How it shows |
|---|---|---|
| Stock updates automatically whenever a sale is processed | **2.0** 2.4 Record Sales Transaction → **3.0** 3.2 Update Stock Levels | Recording the order deducts stock and writes a stock movement. No separate stock count is needed. |
| Stock on hand, allocated and available by warehouse; available can go below zero | **3.0** Product detail "Stock by location / branch" | Per storage area and per branch |
| Min and max stock levels trigger reordering | **3.0** stock level settings (floor and ceiling) | Set per product by the Office Manager |
| Available, allocated, floor and ceiling **on one screen** | **3.0** Product detail header | Four stat tiles in one row |
| Top performers and reorder report | **6.0** Fast/Slow-Moving and Reorder reports | — |
| KPI dashboard (sales, stock) | **Dashboard** | 4 KPI cards, sales each day, sales by category |
| File attachments on transactions (cheque or payment proof photo on the sales record) | **5.0** 5.2 Record Customer Payment; **2.0** order attachments | The payment proof is attached to the payment, and the payment is linked to its order or receipt |

### Turis
"The system… will verify the minimum order quantity for each product when an order is placed and allow staff to sort orders by status. Orders and stock will be stored in the same system. Items ordered before stock arrives will show as a negative available quantity."

| Adapted feature | Module / screen | How it shows |
|---|---|---|
| Orders from several channels, including **AI-parsed PDF and Excel**, so agents don't retype | **2.0** 2.1 Record Sales Order → "Read slip with AI" | Upload a slip photo, PDF or Excel. The AI only reads the lines, the system matches products, and staff confirm each line. The AI never saves, prices or deducts stock. |
| Validation rules: **minimum order**, **credit**, **stock available** | **2.0** 2.2 Review and Validate Order | Inline warnings on each line and for the customer |
| One order list, filtered by **status**, with internal comments | **2.0** Sales Orders list | Status tabs and an internal note field |
| *Unlike Turis:* no separate pre-order category; orders and stock in one system | **2.0** / **3.0** | Negative available = backordered |

**Also from Chapter 2:**
- The **Order Attachment** definition (a slip photo linked to the sales record) belongs in **2.0**.
- **SDG 12** (floor, ceiling, fast and slow movers) is covered by **3.0** and **6.0**.
- **SDG 8** (no Sunday office trips; remote stock check and alerts) is covered by **3.0** and **Dashboard**.

---

## 3. Problems → modules (from "Problem Identified")

| Problem group | Covered by |
|---|---|
| A. Order taking: many channels, hand encoding, Sunday stock checks, minimum order only on paper | 2.0 (agent order form, slip photo, AI reading, minimum order check), 3.0 (remote stock check) |
| B. Stock: no alert, no reorder level, office-only, confusing negatives, manual mother-box conversion, manual supplier delivery encoding | 3.0 (alerts, reorder point, floor and ceiling, clear Backordered badge), 4.0 (receiving with conversion, paid/unpaid) |
| C. 2010 system: hangs, shared login, no history, office-only | 1.0 (accounts, history log), the whole web app |
| D. The failed software: too many buttons, no autosave | Global UX rules: one or two clicks, **autosave** everywhere |
| E. Branches: isolated data, no company-wide view, no transfers, duplicate supplier orders, different names and prices, manual consolidation, customer balance not shared | Global branch model, 3.0 (company-wide stock, transfers), 4.0 (combined branch needs), 5.0 (shared balances), 6.0 (all-branch reports) |
| F. Installments: no plans, partial payments, history, reminders, credit limit, agent can't see balance, receipt lacks balance, field payments on paper, no aging | 5.0 (all of it), 2.0 (credit check, balance on receipt) |

---

## 4. Build order (step by step)

Chapter 3 Phase 3 says the team builds "module by module, starting with the highest priority". Each module is shown to the staff before the next starts. **Master data comes before transactions.**

| Step | Plan file | Why this order |
|---|---|---|
| 0 | [foundation](foundation.md): shared layout, tokens, mock data, roles, autosave, history-log helper | Everything else uses it |
| 1 | [01 · User Accounts & History Log](01-user-accounts-history-log.md): login first | Login is the entry point; every action needs a user |
| 2 | [03 · Products & Inventory](03-product-inventory.md) | Orders and purchases need products, units and stock |
| 3 | [05 · Customer Accounts](05-customer-accounts.md), part 1: customer records and credit limits | Orders need customers and credit limits |
| 4 | [02 · Order & Sales](02-order-sales.md): the core flow | Highest business priority |
| 5 | [04 · Supplier & Purchasing](04-supplier-purchasing.md) | Needs the reorder list from 3.0 |
| 6 | [05 · Customer Accounts](05-customer-accounts.md), part 2: installments, payments, monitoring | Needs orders from 2.0 |
| 7 | [06 · Reports](06-generate-reports.md) | Reads everything |
| 8 | [Dashboards](dashboards.md) | Summarises everything |
| 9 | End-to-end walkthrough of all flows with each role | Prepares the 3 review sessions |

---

## 5. Things to settle with the team or client (they affect screens)

1. **Settled on October 23 (Chapter 3 and the Lucid DFD now match):**
   - Approvals are part of Chapter 3: 2.3 orders, 4.2 purchase requests, 4.5 supplier payables, 5.3 payment verification. They are always on.
   - **Administrative/Warehouse Staff still encode orders** (2.1 Record Sales Order takes staff-encoded orders, agent orders with the slip photo; the Sales Supervisor's orders enter at 2.2).
   - **Stock adjustments, counts and transfers** go through 3.2 Update Stock Levels ("Stock Adjustment Details" from the staff).
   - **The Office Manager manages user accounts** for their own branch (1.2). The CEO only views.
   - **The Sales Supervisor gets reports** for their own branch (changed by the user on Oct 23; the DFD 6.0 and Chapter 3 text still need the Sales Supervisor added). Reports go to the CEO, Office Manager, Sales Supervisor and Administrative/Warehouse Staff.
2. **Which number triggers the low-stock alert.** The Chapter 2 definitions say the *Critical Stock Level* triggers it, and the ERD stores "critical (reorder point)". The plans use:
   - **Low** when available ≤ critical / reorder point
   - **Below floor** when available < floor
   - **Over ceiling** when on hand > ceiling
   - Suggested reorder quantity = ceiling − (available + on order)
   - Confirm this with the client.
3. **Branches are not in the Chapter 3 ERD.** None of the 21 tables has a branch. The prototype still shows a branch on every record, as decided on October 18.
4. **Edit before loading day.** Chapter 3 (Methods) says agents can **add products to an order until the delivery date**. The plans allow editing until the order is marked Shipped, and each edit is logged.
