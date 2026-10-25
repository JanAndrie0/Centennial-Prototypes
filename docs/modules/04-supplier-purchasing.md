# 4.0 · Supplier and Purchasing

**Chapter 3:** "Supplier and Purchasing will record supplier details and purchase orders, send the purchase order to the supplier, and record the delivery once it arrives."

**Child diagram 4.0** (revised Chapter 3)
- 4.1 Maintain Supplier Records: supplier and purchase details in D9; logs to D2.
- 4.2 Prepare Purchase Request: built from the **reorder list** (3.4) or the Sales Supervisor's **stock order request**; converts the quantities using D3 "since suppliers usually deliver in bigger units than what Centennial sells"; sends the request to the **Office Manager**.
- 4.3 Issue Purchase Order: after the Office Manager's **purchase approval**, saves the PO in D10 and sends it to the supplier.
- 4.4 Receive Supplier Delivery: takes the supplier's delivery details and sends the received items to 3.0.
- 4.5 Verify Supplier Payables: pulls the unpaid POs from D10; the Office Manager verifies them and the PO record is updated.

**Proposed Solution table covers:**
- Supplier Management
- Company-to-supplier purchase order
- Receiving supplier deliveries
- **Paid / unpaid delivery status**
- **Combined view of branch needs**

**Solves problems:**
- B5: manual mother-box conversion
- B6: supplier deliveries encoded by hand
- E2 / E4: branches ordering separately and missing bulk discounts
- #12, #23, #25 in the Proposed Solution table

## Adapted features in this module

| From | Feature | Where |
|---|---|---|
| **Cin7 Core** | UOM conversion when receiving bulk packaging (boxes and pallets → pieces) | Receive delivery |
| **inFlow** | Purchase unit linked to the selling unit by a conversion ratio (10 boxes × 6 pairs = 60 pairs) | Receive delivery, PO lines |
| **inFlow** | Reorder Stock list → purchase order | Purchase request from the 3.4 reorder list |
| Unleashed | File attachments on purchase orders (optional: supplier invoice or delivery receipt photo) | PO detail |

## Access

| Screen | CEO | Office Manager | Sales Supervisor | Admin / Warehouse | Agent |
|---|---|---|---|---|---|
| Suppliers | Full | Full | Full | Full | — |
| Purchase orders | Full | **Approves** requests (4.3), verifies payables (4.5) | Sends stock order requests (4.2) | Creates requests, receives (4.4) | — |
| Receive delivery | Full | Full | Full | **Full** | — |

## PO status flow

`Draft → Purchase request (4.2, waiting for the Office Manager) → Approved → Ordered (4.3, sent to supplier) → Partially received → Received (4.4)`

The payment status is separate: **Unpaid / Paid**, verified by the Office Manager in 4.5 Verify Supplier Payables.

## Screens and build steps

### Step 1 · Suppliers (`purchasing/suppliers.html`), 4.1 Maintain Supplier Records

**What is displayed**
- A table: Company · Contact person · Contact no. · Address · Products supplied (count) · Unpaid POs.
- **Supplier form** (modal):
  - Company, contact person, number, address.
  - **Products supplied**, each with its purchase unit and conversion. This is the shared `product_supplier` record, also shown in 3.0.

### Step 2 · Purchase orders list (`purchasing/list.html`)

**What is displayed**
- Status tabs with counts: Draft · For approval · Approved · Ordered · Partially received · Received.
- A **Payment** filter: Paid / Unpaid.
- Table columns: PO no. · Supplier · Branch · Date · Items · Total ₱ · Status · **Payment status** badge.
- Primary button: **New purchase order**.

### Step 3 · Purchase request (`purchasing/new.html`), 4.2 Prepare Purchase Request

**Entry points:**
- From the **3.4 Reorder list**: selected items arrive pre-filled and grouped per supplier, with the suggested qty.
- From a Sales Supervisor's **stock order request**.
- Blank PO.

**Fields:**
- Supplier.
- Branch. For management, an option **"Combine needs of all branches"** (Problems E2 and E4): the lines show each branch's suggested qty and a total.
- Lines: product · **purchase unit** · qty in the purchase unit · = qty in the selling unit (auto) · unit cost · amount.
- Expected delivery date, note.
- Autosave.

**Primary button:** **Send for approval** (to the Office Manager).

Once approved, **4.3 Issue Purchase Order** turns the request into a printable **purchase order** (Print or PDF) and marks it Ordered.

### Step 4 · Approvals (Office Manager) → 4.3 Issue Purchase Order

Shares the approval queue UI with 2.0 (a tab "Purchase requests").

The detail shows:
- the items
- why each was requested (reorder list status: Low, Backordered)
- the supplier's unpaid balance

Buttons: **Approve** or **Reject** (with a reason).

### Step 5 · Receive supplier delivery (`purchasing/receive.html`), 4.4 Receive Supplier Delivery

1. Pick the PO (or an "Ordered" PO from the list).
2. For each line, show: ordered qty in the purchase unit · **received qty** (input) · **conversion** ("1 box = 12 pcs") · **= qty added to stock in the selling unit** (auto, big and clear) · storage area.
   - Example: the 250-pc mother box of epoxy → 125 Pioneer A + 125 Pioneer B. Allow **splitting one received line into two products**.
3. Mark the delivery **Paid / Unpaid**, and optionally attach the supplier invoice photo.
4. **Post receipt.** This writes the Receive stock movements to 3.0, updates PO status (Partially received / Received), refreshes the reorder list and Backordered items, and logs the change.

### Step 6 · Supplier payables (tab on the PO list, or `purchasing/list.html?payment=unpaid`), 4.5 Verify Supplier Payables

Unpaid POs by supplier, with amount and age. The Office Manager can **Verify and mark Paid**, and the change is logged.

## Acceptance

- [ ] A purchase request can be created from the reorder list or a stock order request, grouped by supplier, and becomes a PO only after approval.
- [ ] The combined branch view works for management.
- [ ] Receiving converts units correctly and supports the split.
- [ ] Stock and the reorder list update after posting.
- [ ] Paid / unpaid status shows and can be changed by the Office Manager, with a log.
