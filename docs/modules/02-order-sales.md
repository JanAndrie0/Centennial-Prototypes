# 2.0 · Order and Sales Management

**Chapter 3:** "Order and Sales Management will record sales orders and deliveries from the administrative/warehouse staff and sales agents, and issue receipts to the customer."

**Child diagram 2.0** (revised Chapter 3)
- 2.1 Record Sales Order: takes the orders **encoded by the administrative/warehouse staff** and the **agent's order with the order slip photo**; checks the customer in D6 and saves a new customer.
- 2.2 Review and Validate Order: checks the order against the **stock availability** (3.0) and the customer's **payment record** (5.0). Orders the **Sales Supervisor** sends for approval also enter here.
- 2.3 Process Order Approval: sends the order and the customer's payment record to the **Office Manager**, who approves or rejects (bad payers, bounced cheques, late installments). The approved order goes to the administrative/warehouse staff.
- 2.4 Record Sales Transaction: saves the order in D7 and logs it in D2; sends the ordered and shipped items to 3.0 and the sales order amount to 5.0.
- 2.5 Generate Receipt: issues the sales receipt to the customer.
- 2.6 Schedule and Track Delivery: uses the stock locations in D4 for the **truck load list**, takes the delivery details and the agent's delivery confirmation, saves to D8, and sends back the order and delivery status.

**Proposed Solution table covers:**
- Order Management and Product Sales
- Customer-to-company purchase order
- **Agent order form**
- **Minimum order check at order entry**
- Receipt generation
- **Delivery schedule per customer and weekday**
- **Truck load list**
- Delivery status

**Solves problems:**
- A1–A6: many channels, hand encoding, double-checking, Sunday checks, minimum order only on paper
- F5: credit limit
- F6: the agent sees the balance
- F7: the receipt shows the balance
- Old-system issue: stock meant for one customer goes to another

**Chapter 3 Methods constraint:** agents can **add products to an order until the delivery date**.

## Adapted features in this module

| From | Feature | Where |
|---|---|---|
| **Turis** | Orders from several channels; **AI-parsed** photo, PDF or Excel, so nobody retypes | New order → "Read slip with AI" |
| **Turis** | Validation rules: **minimum order, credit, stock available** | 2.2 Review and Validate Order, inline on the order screen |
| **Turis** | One order list **filtered by status**, with an **internal comment** | Orders list |
| Turis (difference) | No separate pre-order category; **negative available = backordered**; orders and stock in one system | Order lines, stock |
| Unleashed | Stock updated automatically when the sale is processed | 2.4 → 3.0 |
| Zoho / Unleashed | **Allocated** stock reserved for the order | 2.3 approval → 2.4 |
| Unleashed / Ch. 2 "Order Attachment" | Order slip photo attached to the sales record | New order, detail |
| inFlow | Unit shown on every line | Order lines |

## Order status flow

`Draft → For approval → Approved → For delivery → Shipped → Completed`, plus `Rejected` and `Cancelled`.

- **For approval → Approved** is the **Office Manager's** approval (2.3 Process Order Approval). It is always on.
- On **Approved**, the quantities become **allocated**. On **Shipped**, on hand drops and allocation is released. **Completed** happens when the **sales agent confirms** the delivery.
- Stock is deducted when the transaction is recorded, matching the old system's behavior. In the prototype, show the stock movement at Approve / Record.

## Access

| Screen | CEO / SS | Office Manager | Admin / Warehouse | Sales Agent (mobile) |
|---|---|---|---|---|
| Orders list | All | All | Own branch | Own orders |
| New order | ✔ (Sales Supervisor: send order for approval) | ✔ | ✔ (encodes, 2.1) | ✔ (agent order form, 2.1) |
| Approvals | View | **Approve / Reject** | — | — |
| Receipt | ✔ | ✔ | ✔ | View |
| Deliveries | ✔ | ✔ | ✔ (schedule, load list, ship) | **Confirm delivery** |

## Screens and build steps

### Step 1 · Orders list (`orders/list.html`)

**What is displayed**
- Title "Sales Orders", with the description "All customer orders and where they are now."
- **Status tabs with counts** (Turis): All · Draft · For approval · Approved · For delivery · Shipped · Completed · Rejected.
- Search: order no. or store name. Filters: agent, branch, date, delivery date.
- Table columns: Order no. · Store · Agent · Order date · **Delivery date** · Items · Total ₱ · Status badge · ⚠ icons (backordered lines, over credit) · 💬 internal note.
- Primary button: **New order**.

### Step 2 · New order (`orders/new.html`, agent version `m/new-order.html`), 2.1 Record Sales Order + 2.2 Review and Validate Order

Follow the staff's current encoding order, keep it fast for **up to about 100 lines**, and autosave the draft.

1. **Customer:** search the store. A side card shows the **credit limit, current balance, overdue amount**, and agent (Problems F5 and F6).
2. **Order slip photo:** upload or take a photo. Required for agent orders, optional for staff. It shows as a thumbnail.
3. **Read slip with AI (optional):**
   1. Upload the photo, PDF or Excel.
   2. A modal shows a table of the lines the AI read: text as read, matched product, qty, unit, and match confidence.
   3. For each line, staff **confirm or change** the matched product.
   4. **"Add confirmed lines"** adds them to the order.
   5. The AI never saves, prices or deducts stock (decision of October 18).
4. **Lines** (keyboard-friendly; Enter adds a new row):
   - Product search
   - **Unit** (fixed per product)
   - Qty
   - Unit price (from the product)
   - **Available** (with the Backordered badge if the order makes it negative)
   - Line total
5. **Inline validation, 2.2 Review and Validate Order** (warnings only; they don't block):
   - Qty below the **minimum order qty** → "Below minimum order (min 10 boxes). Allowed if part of a combined order."
   - Order makes available negative → "**Backordered**: 19 pcs will come from the supplier."
   - Order total + balance > **credit limit** → "Over credit limit by ₱X". The order still goes to approval, with a flag.
6. **Delivery date:** defaults to the **same weekday next week** (the interview habit), and is editable.
7. Internal note; branch (auto).
8. One primary button: **Send for approval**. The Sales Supervisor uses the same screen; their orders enter at 2.2.

### Step 3 · Approvals (`orders/approvals.html`), 2.3 Process Order Approval (Office Manager)

**What is displayed**
- Queue cards or table: order no., store, total, flags (over credit, overdue, backordered lines), agent, waiting time.
- The detail drawer shows the order lines and the customer's **payment record**:
  - Balance, credit limit, overdue amounts
  - Installment status
  - Last payments
  - **Bounced or late cheques**
- Buttons: **Approve** (primary) · Reject (requires a reason) · Send back to agent with a note.
- Approve → status Approved → allocate stock → 2.4 Record Sales Transaction → log. The approved order shows up for the administrative/warehouse staff.

### Step 4 · Order detail (`orders/detail.html`), 2.4 Record Sales Transaction

**Tabs**
1. **Items**: editable until Shipped. Edits re-run the validation; if new flags appear, the order goes back to For approval. Every edit is logged.
2. **Status timeline**: who did what, and when.
3. **Slip photo / attachments**.
4. **Payments**: from 5.0.
5. **Delivery**.
6. **History**.

The amount goes to 5.0 (customer balance); the items go to 3.0 (stock).

### Step 5 · Receipt (`orders/receipt.html`), 2.5 Generate Receipt

A printable sales receipt containing:
- Company header and branch
- Receipt/order no., date
- Store, address, agent
- Lines: qty, **unit**, description, unit price, amount
- Total
- **Payments made and remaining balance** (Problem F7)
- Prepared-by and received-by lines

Buttons: **Print**, Download PDF.

### Step 6 · Deliveries (`deliveries/list.html`, `deliveries/detail.html`, `deliveries/load-list.html`), 2.6 Schedule and Track Delivery

- **List:**
  - Grouped by **delivery date** (week view tabs: Mon–Sat)
  - Columns: order, store, area, truck, driver, status (Scheduled · Shipped · Completed)
- **Detail:**
  - Schedule date
  - Assign **truck and driver** (recorded only; drivers don't log in)
  - Products to pick, with **storage locations** (from 3.0)
  - Shipped and completed timestamps, plus **who confirmed** the delivery
- **Truck load list:**
  - Pick a date and truck → all orders and lines, grouped by product, with total qty and unit, and storage area
  - Printable
  - Staff check the quantities against the receipt before loading
- Button: **Mark as shipped**. This writes a movement and a log.

### Step 7 · Agent mobile (`m/home.html`, `m/new-order.html`, `m/deliveries.html`)

- **Home:** my orders by status, and a quick **New order** button.
- **New order:** the same steps as Step 2, in a mobile layout with big fields: store → slip photo → lines → send.
- **My orders:** status list; can add products until the delivery date.
- **Confirm delivery:** one big button "Delivered", with an optional note or photo → status **Completed**, `confirmed_by` = the agent.

## Acceptance

- [ ] Status tabs with counts; internal note shows.
- [ ] The minimum order, credit and backorder warnings appear and don't block.
- [ ] The AI-reading modal requires confirmation of each line.
- [ ] Approve allocates stock; Shipped and agent confirmation complete the order; every step is in the timeline and the history.
- [ ] The receipt shows the payments and balance; the truck load list prints.
- [ ] Order drafts autosave.
