/* Mock database (architecture.md ADR-001/003): localStorage "centennial-db", seeded from data.js.
   All pages read and write through CNS.store so a record created on one page shows on the others.
   Stock is never stored: on hand, allocated and available are derived from movements and orders. */
(function (CNS) {
  'use strict';

  var KEY = 'centennial-db';
  var VERSION = 5;                      // bump when data.js changes shape, so every browser reseeds
  var DRAFT_PREFIX = 'centennial-draft:';

  var BILLED = ['Approved', 'For delivery', 'Shipped', 'Completed']; // count toward the customer's balance
  var ALLOCATING = ['Approved', 'For delivery'];                      // reserved for the customer until shipped
  var ON_ORDER = ['Approved', 'Ordered', 'Partially received'];       // purchase orders still to arrive
  var SEVERITY = ['backordered', 'below-floor', 'low', 'over-ceiling', 'unset', 'ok'];

  var db;

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(db));
    } catch (e) {
      console.warn('Could not save demo data (storage full or blocked).', e);
    }
  }

  function clearDrafts() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf(DRAFT_PREFIX) === 0) localStorage.removeItem(k);
      });
    } catch (e) { /* storage blocked: nothing to clear */ }
  }

  function reset() {
    db = CNS.seed();
    db.version = VERSION;
    save();
    clearDrafts();
  }

  function load() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY));
      if (parsed && parsed.version === VERSION) {
        db = parsed;
        return;
      }
    } catch (e) { /* missing or corrupt: reseed below */ }
    reset();
  }

  function table(name) {
    if (!db[name]) throw new Error('Unknown table: ' + name);
    return db[name];
  }

  function get(name, id) {
    return table(name).filter(function (r) { return r.id === id; })[0] || null;
  }

  function sum(rows, fn) {
    return rows.reduce(function (total, r) { return total + fn(r); }, 0);
  }

  function inBranch(row, branchId) {
    return !branchId || branchId === 'all' || row.branch_id === branchId;
  }

  function areaBranch(areaId) {
    var area = get('storage', areaId);
    return area ? area.branch_id : null;
  }

  function onHand(productId, branchId) {
    return sum(table('stock_movements').filter(function (m) {
      return m.product_id === productId && inBranch(m, branchId);
    }), function (m) { return m.qty_change; });
  }

  function allocated(productId, branchId) {
    var orders = table('sales_orders').filter(function (o) {
      return ALLOCATING.indexOf(o.status) >= 0 && inBranch(o, branchId);
    }).map(function (o) { return o.id; });
    return sum(table('sales_order_items').filter(function (it) {
      return it.product_id === productId && orders.indexOf(it.order_id) >= 0;
    }), function (it) { return it.qty; });
  }

  function onOrder(productId, branchId) {
    return sum(table('purchase_orders').filter(function (po) {
      return ON_ORDER.indexOf(po.status) >= 0 && inBranch(po, branchId);
    }), function (po) {
      var link = table('product_supplier').filter(function (ps) {
        return ps.product_id === productId && ps.supplier_id === po.supplier_id;
      })[0];
      var conversion = link ? link.conversion : 1;
      return sum(table('purchase_order_items').filter(function (it) {
        return it.po_id === po.id && it.product_id === productId;
      }), function (it) { return (it.qty_ordered - it.qty_received) * conversion; });
    });
  }

  // 03 plan badges. One status per product: the most urgent one wins.
  function statusFor(product, available, hand) {
    if (available < 0) return 'backordered';
    // New products wait for the Office Manager's stock level settings (the form requires ceiling > 0 once set)
    if (!product.ceiling_qty) return 'unset';
    if (available < product.floor_qty) return 'below-floor';
    if (available <= product.critical_qty) return 'low';
    if (hand > product.ceiling_qty) return 'over-ceiling';
    return 'ok';
  }

  function branchesStocking(productId) {
    var ids = [];
    table('stock_locations').forEach(function (loc) {
      var b = loc.product_id === productId ? areaBranch(loc.area_id) : null;
      if (b && ids.indexOf(b) < 0) ids.push(b);
    });
    return ids;
  }

  function stockStatus(productId, branchId) {
    var product = get('products', productId);
    if (!branchId || branchId === 'all') {
      // Company-wide view: show the worst status among the branches that stock it
      var worst = 'ok';
      branchesStocking(productId).forEach(function (b) {
        var s = stockStatus(productId, b);
        if (SEVERITY.indexOf(s) < SEVERITY.indexOf(worst)) worst = s;
      });
      return worst;
    }
    if (branchesStocking(productId).indexOf(branchId) < 0) return 'ok';
    var hand = onHand(productId, branchId);
    return statusFor(product, hand - allocated(productId, branchId), hand);
  }

  function orderTotal(orderId) {
    return sum(table('sales_order_items').filter(function (it) { return it.order_id === orderId; }),
      function (it) { return it.qty * it.unit_price; });
  }

  // 2.2 Review and Validate Order: warnings only, never blocks (02 plan step 2).
  // Before approval the order's own quantities aren't allocated yet, so they're subtracted here.
  var PENDING = ['Draft', 'For approval'];
  function orderFlags(orderId) {
    var o = get('sales_orders', orderId);
    var open = PENDING.indexOf(o.status) >= 0;
    var flags = { backordered: [], belowMin: [], overCredit: 0 };
    if (['Shipped', 'Completed', 'Rejected', 'Cancelled'].indexOf(o.status) >= 0) return flags;
    table('sales_order_items').filter(function (it) { return it.order_id === orderId; }).forEach(function (it) {
      var p = get('products', it.product_id);
      var after = onHand(it.product_id, o.branch_id) - allocated(it.product_id, o.branch_id) - (open ? it.qty : 0);
      if (after < 0) flags.backordered.push({ product_id: it.product_id, short: Math.min(it.qty, -after) });
      if (p && it.qty < p.min_order_qty) flags.belowMin.push({ product_id: it.product_id, min: p.min_order_qty });
    });
    var c = get('clients', o.client_id);
    if (c) {
      var exposure = CNS.store.clientBalance(c.id) + (open ? orderTotal(orderId) : 0);
      flags.overCredit = Math.max(0, exposure - c.credit_limit);
    }
    return flags;
  }

  load();

  CNS.store = {
    reset: reset,
    today: today,
    all: table,
    get: get,

    where: function (name, fn) {
      return table(name).filter(fn);
    },

    insert: function (name, row) {
      if (row.id == null) row.id = name.charAt(0) + (++db.seq);
      table(name).push(row);
      save();
      return row;
    },

    // Returns the old values of the changed fields, ready for history.logChange
    update: function (name, id, changes) {
      var row = get(name, id);
      if (!row) throw new Error('No ' + name + ' record ' + id);
      var old = {};
      Object.keys(changes).forEach(function (k) {
        old[k] = row[k];
        row[k] = changes[k];
      });
      save();
      return old;
    },

    // Removes the rows that match, e.g. a product's supplier links or storage areas. Returns how many went.
    // Not for business records: those are deactivated, never deleted.
    remove: function (name, fn) {
      var rows = table(name);
      var before = rows.length;
      db[name] = rows.filter(function (r) { return !fn(r); });
      save();
      return before - db[name].length;
    },

    branchName: function (branchId) {
      if (!branchId || branchId === 'all') return 'All branches';
      var b = get('branches', branchId);
      return b ? b.short_name : branchId;
    },

    // ---- Stock (ADR-003) ----
    onHand: onHand,
    allocated: allocated,
    onOrder: onOrder,
    stockStatus: stockStatus,

    available: function (productId, branchId) {
      return onHand(productId, branchId) - allocated(productId, branchId);
    },

    suggestedReorder: function (productId, branchId) {
      var p = get('products', productId);
      var avail = onHand(productId, branchId) - allocated(productId, branchId);
      return Math.max(0, p.ceiling_qty - (avail + onOrder(productId, branchId)));
    },

    // Products that need reordering (Low, Below floor, Backordered); feeds the header alert count
    lowStock: function (branchId) {
      return table('products').filter(function (p) {
        return ['backordered', 'below-floor', 'low'].indexOf(stockStatus(p.id, branchId)) >= 0;
      });
    },

    // On hand in one storage area
    areaOnHand: function (productId, areaId) {
      return sum(table('stock_movements').filter(function (m) {
        return m.product_id === productId && m.area_id === areaId;
      }), function (m) { return m.qty_change; });
    },

    // Next reference for a movement series, e.g. nextRef('ADJ') → 'ADJ-0002'
    nextRef: function (prefix) {
      var max = 0;
      table('stock_movements').forEach(function (m) {
        var hit = new RegExp('^' + prefix + '-(\\d+)$').exec(m.ref || '');
        if (hit) max = Math.max(max, Number(hit[1]));
      });
      return prefix + '-' + String(max + 1).padStart(4, '0');
    },

    // Branch transfers (3.2), derived from movements only (no transfers table in the ERD; user decision Oct 25):
    // a 'Transfer out' is In transit until a 'Transfer in' with the same ref exists. The destination branch is
    // in the out movement's reason ("To I-KU").
    transfers: function () {
      var byRef = {};
      table('stock_movements').forEach(function (m) {
        if (m.type !== 'Transfer out' && m.type !== 'Transfer in') return;
        (byRef[m.ref] = byRef[m.ref] || {})[m.type === 'Transfer out' ? 'out' : 'in'] = m;
      });
      var branches = table('branches');
      return Object.keys(byRef).filter(function (ref) { return byRef[ref].out; }).map(function (ref) {
        var out = byRef[ref].out, inn = byRef[ref].in;
        var named = branches.filter(function (b) { return out.reason === 'To ' + b.short_name; })[0];
        return {
          ref: ref, product_id: out.product_id, qty: -out.qty_change,
          from_branch: out.branch_id, from_area: out.area_id, sent_at: out.datetime, sent_by: out.user_id,
          to_branch: inn ? inn.branch_id : (named ? named.id : out.branch_id),
          to_area: inn ? inn.area_id : null,
          received_at: inn ? inn.datetime : null, received_by: inn ? inn.user_id : null,
          status: inn ? 'Received' : 'In transit'
        };
      }).sort(function (a, b) { return a.sent_at < b.sent_at ? 1 : -1; });
    },

    // Units sold (Sale movements) in the last `days` days
    soldQty: function (productId, branchId, days) {
      var since = new Date();
      since.setDate(since.getDate() - (days || 30));
      return -sum(table('stock_movements').filter(function (m) {
        return m.product_id === productId && m.type === 'Sale' && inBranch(m, branchId) && new Date(m.datetime) >= since;
      }), function (m) { return m.qty_change; });
    },

    // Fast/slow mover filter (03 plan; the full report is 6.0). Assumption to confirm with the client:
    // fast = sold at least 20% of the ceiling in 30 days, slow = nothing sold in 30 days.
    mover: function (productId, branchId) {
      var p = get('products', productId);
      var sold = CNS.store.soldQty(productId, branchId, 30);
      if (sold === 0) return 'slow';
      return sold >= p.ceiling_qty * 0.2 ? 'fast' : null;
    },

    // ---- Customers ----
    orderTotal: orderTotal,
    orderFlags: orderFlags,

    clientBalance: function (clientId) {
      var billed = sum(table('sales_orders').filter(function (o) {
        return o.client_id === clientId && BILLED.indexOf(o.status) >= 0;
      }), function (o) { return orderTotal(o.id); });
      var paid = sum(table('payments').filter(function (p) {
        return p.client_id === clientId && p.verified_by && !p.bounced;
      }), function (p) { return p.amount; });
      return billed - paid;
    },

    // Days since the oldest unpaid installment fell due (0 when nothing is overdue)
    clientOverdueDays: function (clientId) {
      var orders = table('sales_orders').filter(function (o) { return o.client_id === clientId; }).map(function (o) { return o.id; });
      var plans = table('installment_plans').filter(function (p) { return orders.indexOf(p.order_id) >= 0; }).map(function (p) { return p.id; });
      var now = today();
      var oldest = table('installment_schedules').filter(function (s) {
        return plans.indexOf(s.plan_id) >= 0 && s.due_date < now && s.amount_paid < s.amount_due;
      }).map(function (s) { return s.due_date; }).sort()[0];
      return oldest ? Math.round((new Date(now) - new Date(oldest)) / 86400000) : 0;
    },

    clientLastOrder: function (clientId) {
      return table('sales_orders').filter(function (o) { return o.client_id === clientId && o.status !== 'Draft'; })
        .map(function (o) { return o.order_date; }).sort().pop() || null;
    },

    clientOverdue: function (clientId) {
      var orders = table('sales_orders').filter(function (o) { return o.client_id === clientId; }).map(function (o) { return o.id; });
      var plans = table('installment_plans').filter(function (p) { return orders.indexOf(p.order_id) >= 0; }).map(function (p) { return p.id; });
      var now = today();
      return sum(table('installment_schedules').filter(function (s) {
        return plans.indexOf(s.plan_id) >= 0 && s.due_date < now && s.amount_paid < s.amount_due;
      }), function (s) { return s.amount_due - s.amount_paid; });
    }
  };
})(window.CNS);
