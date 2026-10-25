/* 4.0 Supplier and Purchasing: purchase order steps in one place, each logged.
   Draft → For approval (4.2) → Approved → Ordered (4.3) → Partially received / Received (4.4); payment Unpaid / Paid (4.5).
   Quantities on PO lines are in the supplier's unit; stock is added in the selling unit using product_supplier.conversion. */
(function (CNS) {
  'use strict';

  var S = CNS.store;
  var MODULE = 'Purchasing & Suppliers';

  function items(poId) { return S.where('purchase_order_items', function (it) { return it.po_id === poId; }); }

  function link(productId, supplierId) {
    return S.where('product_supplier', function (ps) { return ps.product_id === productId && ps.supplier_id === supplierId; })[0] || null;
  }

  function setStatus(po, status, session, action, extra) {
    var changes = { status: status };
    Object.keys(extra || {}).forEach(function (k) { changes[k] = extra[k]; });
    var old = S.update('purchase_orders', po.id, changes);
    CNS.history.log({ action: action || 'Edit', module: MODULE, record_type: 'purchase_orders', record_id: po.id,
      field: 'status', old_value: old.status, new_value: status, user_id: session.user.id });
    return S.get('purchase_orders', po.id);
  }

  CNS.poActions = {
    MODULE: MODULE,
    items: items,
    link: link,

    total: function (poId) {
      return items(poId).reduce(function (t, it) { return t + it.qty_ordered * (it.unit_cost || 0); }, 0);
    },

    nextNo: function () {
      var max = 0;
      S.all('purchase_orders').forEach(function (p) { var m = /(\d+)$/.exec(p.po_no); if (m) max = Math.max(max, Number(m[1])); });
      return 'PO-' + new Date().getFullYear() + '-' + String(max + 1).padStart(4, '0');
    },

    // Unpaid amount owed to a supplier (POs ordered or received, not yet paid)
    supplierUnpaid: function (supplierId) {
      return S.where('purchase_orders', function (p) {
        return p.supplier_id === supplierId && p.payment_status === 'Unpaid' && ['Received', 'Partially received', 'Ordered'].indexOf(p.status) >= 0;
      }).reduce(function (t, p) { return t + CNS.poActions.total(p.id); }, 0);
    },

    approve: function (po, session) { return setStatus(po, 'Approved', session, 'Approve', { approved_by: session.user.id }); },
    reject: function (po, reason, session) { return setStatus(po, 'Rejected', session, 'Reject', { approved_by: session.user.id, note: 'Rejected: ' + reason }); },

    // 4.3 Issue Purchase Order: printed and sent to the supplier
    issue: function (po, session) { return setStatus(po, 'Ordered', session, 'Edit'); },

    // 4.4 Receive Supplier Delivery. lines: [{ item_id, received (purchase units), parts: [{ product_id, qty (selling units), area_id }] }]
    receive: function (po, lines, paid, session) {
      var now = new Date().toISOString();
      lines.forEach(function (l) {
        if (!l.received) return;
        var it = S.get('purchase_order_items', l.item_id);
        S.update('purchase_order_items', it.id, { qty_received: it.qty_received + l.received });
        l.parts.forEach(function (part) {
          if (!part.qty) return;
          var area = S.get('storage', part.area_id);
          S.insert('stock_movements', {
            datetime: now, product_id: part.product_id, branch_id: area.branch_id, area_id: area.id,
            type: 'Receive', qty_change: part.qty, ref: po.po_no, user_id: session.user.id, reason: null
          });
          if (!S.where('stock_locations', function (x) { return x.product_id === part.product_id && x.area_id === area.id; }).length) {
            S.insert('stock_locations', { product_id: part.product_id, area_id: area.id });
          }
          var p = S.get('products', part.product_id);
          CNS.history.log({ action: 'Stock change', module: MODULE, record_type: 'purchase_orders', record_id: po.id, field: 'qty_change',
            new_value: p.name + ' +' + CNS.format.qty(part.qty, p.unit_id) + ' · ' + area.name, user_id: session.user.id });
        });
      });
      var done = items(po.id).every(function (it) { return it.qty_received >= it.qty_ordered; });
      po = setStatus(po, done ? 'Received' : 'Partially received', session, 'Edit');
      if (paid && po.payment_status !== 'Paid') po = CNS.poActions.markPaid(po, session);
      return po;
    },

    // 4.5 Verify Supplier Payables (Office Manager)
    markPaid: function (po, session) {
      var old = S.update('purchase_orders', po.id, { payment_status: 'Paid' });
      CNS.history.log({ action: 'Approve', module: MODULE, record_type: 'purchase_orders', record_id: po.id,
        field: 'payment_status', old_value: old.payment_status, new_value: 'Paid', user_id: session.user.id });
      return S.get('purchase_orders', po.id);
    },

    statusBadge: function (status) {
      var b = {
        'Draft': ['neutral', 'pencil-square'], 'For approval': ['info', 'clipboard-document-list'], 'Approved': ['success', 'check'],
        'Ordered': ['info', 'shopping-cart'], 'Partially received': ['warning', 'arrow-down-tray'], 'Received': ['success', 'check-circle'],
        'Rejected': ['error', 'x-mark']
      }[status] || ['neutral', 'information-circle'];
      return CNS.ui.badge(b[0], b[1], status);
    },

    paymentBadge: function (status) {
      return status === 'Paid' ? CNS.ui.badge('success', 'check-circle', 'Paid') : CNS.ui.badge('warning', 'banknotes', 'Unpaid');
    }
  };
})(window.CNS);
