# Revision plan after the Chapter 3 DFD update

> **Status, October 23 (later):** the team answered D1–D4 (D2 took the recommendation; D3 = the Office Manager of each branch; D4 = no). Done: Lucid DFD (Diagram 0, 2.0, 3.0), thesis T1–T4 and T7 plus the DFD paragraphs, plan files P1–P10, flags doc. Still open: D5–D9, T5, T6, E1, E2, E4, F1.

> **Update, October 23:** the user changed **D4 to yes**: the Sales Supervisor gets Reports (own branch). The plan files now follow this. To match, the Lucid DFD Diagram 0 and 6.0 need a report request flow from the Sales Supervisor (E3), and the Chapter 3 text for 6.0 needs the Sales Supervisor added as a requester (T2).

> October 23, 2026. Chapter 3 §3.3 (Figures 3.3–3.10) was rewritten to match the new Lucid DFD, in both the CHAPTER 1-3 and CHAPTER 3 tabs. This plan lists everything that is now out of step with it, and the order to fix it in.

## What changed and why it causes revisions

The new DFD splits most processes into more steps and makes the Office Manager's approvals part of the design. Before this update, the thesis and the plan files treated them as an extra from the role update.

| Process | Old Chapter 3 (what the plan files still use) | New DFD and Chapter 3 text |
|---|---|---|
| 1.0 | 1.1–1.4 | Same |
| 2.0 | 2.1 Record Sales Order · 2.2 Validate · 2.3 Record Sales Transaction · 2.4 Generate Receipt · 2.5 Schedule and Track Delivery | 2.1 Record Agent Order · 2.2 Review and Validate Order · **2.3 Process Order Approval** · 2.4 Record Sales Transaction · 2.5 Generate Receipt · 2.6 Schedule and Track Delivery |
| 3.0 | 3.1 Maintain Product Records · 3.2 Update Stock Records · 3.3 Monitor Stock Levels | 3.1 Maintain Product Records · 3.2 Update Stock Levels · **3.3 Check Stock Availability** · 3.4 Monitor Stock Levels |
| 4.0 | 4.1 Maintain Supplier Records · 4.2 Create Purchase Order · 4.3 Receive Supplier Delivery | 4.1 Maintain Supplier Records · **4.2 Prepare Purchase Request** · 4.3 Issue Purchase Order · 4.4 Receive Supplier Delivery · **4.5 Verify Supplier Payables** |
| 5.0 | 5.1 Maintain Customer Records · 5.2 Set Up Installment Plan · 5.3 Record Customer Payment · 5.4 Monitor Customer Balances | 5.1 Maintain Customer Accounts (incl. installment plan, credit limit) · 5.2 Record Customer Payment · 5.3 Update Customer Balance · 5.4 Provide Customer Balance · 5.5 Monitor Receivables |
| 6.0 | 6.1 Receive Report Request · 6.2 Compile Report Data · 6.3 Produce Report | 6.1 Receive Report Request · 6.2 Compile Sales and Payment Data · 6.3 Compile Inventory Data · 6.4 Compile Purchasing Data · 6.5 Produce Reports |

## Revision order at a glance

| Step | What | Owner | Blocks |
|---|---|---|---|
| 1 | Decide the open questions D1–D9 | Team (D5, D7, D8 with the client; D9 with the coordinator) | Steps 2, 4, 5 |
| 2 | Fix the thesis text T1–T7 | Claude drafts in the groupmate's voice; team reviews | Step 5 |
| 3 | Update the ERD, DFD images and Figma (E1–E3, F1) | ERD owner, DFD owner, Figma owner | — |
| 4 | Update the prototype plan files P1–P10 | Claude | Claude Code building modules 02–06 |
| 5 | Update the flags doc | Claude | — |
| 6 | Final check across thesis, DFD, ERD and plans | Team + Claude | Submission and the first review session |

Steps 2–4 can run in parallel once Step 1 is done. Module 01 (Login, User Accounts) can keep being built during all of this. Only D3 touches it.

---

## Step 1: Decisions to make first

The new DFD raised D1–D4. D5–D9 were already open.

| # | Decision | Why it came up | Recommended answer | Affects |
|---|---|---|---|---|
| D1 | **Do Administrative/Warehouse Staff still encode orders?** | In the new Diagram 0, orders come only from Sales Agents (2.1) and the Sales Supervisor (order for approval). The staff only send delivery details. The interview says the staff encode orders from chats, photos and calls. | Yes, keep it. Add an "Encoded Order" flow from Administrative/Warehouse Staff into 2.1 (and rename 2.1 "Record Sales Order"), or name it in 2.2. | DFD 2.0, Fig. 3.4 and 3.6 text, plan 02 |
| D2 | **Where do stock adjustments, counts and transfers go?** | New 3.2 only takes ordered/shipped and received items. Inventory Adjustment and Warehouse & Stockroom are on the coordinator's required list. | Add a "Stock Adjustment Details" flow from Administrative/Warehouse Staff into 3.2. Add one clause to the Fig. 3.7 text. | DFD 3.0, Fig. 3.7 text, plan 03 |
| D3 | **Who manages user accounts: CEO only, or all of management?** | Diagram 0 shows only the CEO sending user account details. The role update says "only management". | CEO only, to match the DFD. | Plan 01, CLAUDE.md roles |
| D4 | **Does the Sales Supervisor get reports?** | Diagram 0 has report requests from the CEO, Office Manager and Administrative/Warehouse Staff only. The plan gives every management role reports. | Add the Sales Supervisor to 6.0 in the DFD, since they need the backorder and reorder reports. | DFD 6.0, plan 06 |
| D5 | Low-stock trigger: critical point vs reorder point | Definitions have no Reorder Point | Treat them as the same number and say so in the definitions (T4) | Plan 03, definitions |
| D6 | Branch table | ERD has none | Add `branches` + `branch_id` (E1) | ERD, foundation |
| D7 | Order edit window | Ch3 says "until the delivery date"; the plan says "until Shipped" | Until Shipped (the day it's loaded) | Plan 02 |
| D8 | One selling unit per product; no product cost | Ch2 inFlow and Zoho sections | Client confirms one unit per product; leave out cost and trim the Ch2 "revenue/ABC" wording | Plans 03 and 06, Ch2 |
| D9 | Online Transaction Module | Customers never log in | Show the coordinator the mapping in plan 00 §1 | Tab 7 |

## Step 2: Thesis text (Google Doc)

Every change goes into **both** the CHAPTER 1-3 tab and its single-chapter tab (CHAPTER 2 or CHAPTER 3), so they stay identical. Write everything in the groupmate's voice: future tense, "the researchers/the team", plain transitions, and "administrative/warehouse staff" with the slash.

| # | Where | What to change | How |
|---|---|---|---|
| T1 | Ch3 §3.2 System Framework paragraph | It still says "the management". Name the five roles, and add that the office manager will approve the orders and purchase requests and verify the payments. | Replace that one paragraph only; leave the Figure 3.2 caption. Check the Figure 3.2 image shows the same roles. |
| T2 | Ch3 §3.3, Figures 3.4, 3.6, 3.7, 6.0 text | Only if D1, D2 or D4 add flows to the DFD | Re-run the same paragraph replacement after the DFD owner updates Lucid |
| T3 | Ch1 module list + Proposed System Solution table | "including pre-orders" | Make it "including pre-orders, which will show as a negative available quantity", which matches the Ch2 syntheses and the Pre-Order definition |
| T4 | Ch2 Operational Definition of Terms | No Reorder Point, Purchase Request or Supplier Payables | Add those three terms, alphabetized, in the same "**Term.** Definition." format. Reorder Point = the same quantity as the Critical Stock Level (per D5). |
| T5 | Ch2 Zoho section | Promises revenue-based and ABC reports, but no cost is stored | Per D8: trim to "fast- and slow-moving item reports", or the team adds a cost field (E2) |
| T6 | CHAPTER 1-3 vs CHAPTER 3 tabs, Phases 2 and 3 | The two tabs differ: one mentions Lucidchart and Figma, the other VS Code and Git/GitHub | Team picks the correct version; copy it into the other tab |
| T7 | Tab 7 coordinator mapping (working tab) | Old process numbers: "3.3 Record Sales Transaction, 3.4 Print Delivery Receipt", "process 2.4 only sends low-stock alerts", "2.2 Record Stock Adjustment" | Renumber to 2.4, 2.5, 3.4 and (after D2) 3.2 |

## Step 3: ERD, DFD images and Figma

| # | Item | Change | Owner |
|---|---|---|---|
| E1 | ERD | Add a `branches` table and `branch_id` on users, storage/stock_locations, sales_orders and purchase_orders (D6) | ERD owner |
| E2 | ERD | Only if D8 keeps cost: add `unit_cost` to `product_supplier` | ERD owner |
| E3 | DFD (Lucid) | Add the flows from D1, D2 and D4 to Diagram 0 and the matching child diagrams, then export the new images | DFD owner (Claude can rebuild) |
| E4 | Thesis images | Replace Figures 3.3–3.10. **Check that the context diagram image shows the five roles**, since the new Fig. 3.3 text names them (the context diagram is in a groupmate's Lucid file). | User / groupmate |
| F1 | Figma Access matrix (node 11:8) | Update to the 5 roles and the new process list | Figma owner |

## Step 4: Prototype plan files (`docs/modules/`)

Each file keeps its layout. Only the Chapter 3 mapping, the step labels and the approval wording change. "Role update" labels become plain Chapter 3 references, because approvals are now in Chapter 3.

| # | File | Changes |
|---|---|---|
| P1 | `00-overview-and-feature-map.md` | §1 table: new sub-process lists (table above). §5: remove decision 1 (approvals are settled) and add D1–D4. Sources: say Chapter 3 §3.3 was revised on Oct 23. |
| P2 | `01-user-accounts-history-log.md` | 1.2 access: CEO only (per D3). Everything else stays. |
| P3 | `02-order-sales.md` | Child list → 2.1–2.6. Step 2 "New order" = 2.1 Record Agent Order + 2.2 Review and Validate Order (staff entry kept per D1). Add the Sales Supervisor's "Send order for approval" as an entry into 2.2. Step 3 Approvals = **2.3 Process Order Approval**, always on, with the "without the role update" sentence removed. Step 4 = 2.4 Record Sales Transaction. Step 5 Receipt = 2.5. Step 6 Deliveries = 2.6. Order edit window per D7. |
| P4 | `03-product-inventory.md` | Child list → 3.1–3.4. Product list = 3.1. Stock Check = **3.3 Check Stock Availability**. Alerts, reorder list and stock level settings = 3.4. Adjust/count/transfer = 3.2 (per D2). The stock order request now feeds 4.2, not an approval queue in 3.0. Cross-links: "2.5 Mark shipped" → 2.6, "4.3 Receive" → 4.4. |
| P5 | `04-supplier-purchasing.md` | Child list → 4.1–4.5. Status flow: Draft → **Purchase request (4.2)** → Approved → **Ordered (4.3 Issue PO)** → Received (4.4). Unit conversion shown on the request lines (4.2) and applied on receiving (4.4). Payables tab = **4.5 Verify Supplier Payables**. Remove the "(role update)" conditionals. |
| P6 | `05-customer-accounts.md` | Child list → 5.1–5.5. The installment plan modal moves under **5.1**. Record payment = 5.2. The Office Manager's verify step = 5.3 Update Customer Balance. Agent balance screen and the 2.0 customer card = **5.4 Provide Customer Balance**. Receivables, alerts and reminders = 5.5. The part 1 / part 2 split stays. |
| P7 | `06-generate-reports.md` | Child list → 6.1–6.5. Note that 6.2–6.4 are the compile steps behind one report view (no new screens). Requesters per D4. |
| P8 | `foundation.md` | Roles note: remove "Chapter 3 names only management, staff and agent". Drop the `APPROVALS_ENABLED` flag (approvals are always on). |
| P9 | `dashboards.md` | The Office Manager's approval card lists 2.3 orders, 4.2 purchase requests, 4.5 payables and 5.3 payment verification. |
| P10 | `CLAUDE.md` + `architecture.md` | CLAUDE.md §2 and §4: update the process numbers and remove "approval (role update)". architecture.md: ADR-005 added (see below). |

## Step 5: Flags doc ("Centennial Prototype Plan — Flags and Errors")

| Flag | New status | Note |
|---|---|---|
| 1 Approval step | Fixed in thesis | Chapter 3 §3.3 now has 2.3, 4.2–4.3 and 4.5 |
| 2 Roles | Open | §3.3 now names 5 roles; §3.2 framework still says "management" (T1) |
| 3 Child diagrams differ | Fixed in thesis | Text now follows the Lucid DFD |
| 4 No installment process | Fixed in thesis | Correct the wording: installment plans are set up in 5.1 and saved to D11 |
| 13 Two copies | Open | Correct the wording: these are the CHAPTER 1-3 and CHAPTER 3 tabs, not stray copies (T6) |
| New | Open | Add D1–D4 as flags 18–21 |

## Step 6: Final check

- [ ] Every process name and number in Chapter 3 text, the DFD images, Tab 7 and the plan files matches the Lucid DFD.
- [ ] CHAPTER 1-3 and the single-chapter tabs are identical where they overlap.
- [ ] Every role named in the framework, the DFD text, CLAUDE.md and the Figma Access matrix is one of the five roles.
- [ ] The ERD has every data store D1–D12 plus `branches`.
- [ ] Every Chapter 2 adapted feature still has a screen in the plan files (00 §2).
- [ ] The flags doc has no row left at Open without an owner.
