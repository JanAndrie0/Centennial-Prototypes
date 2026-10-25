/* Sales order status changes (02 plan "Order status flow"). One place for every step so each one is logged
   the same way: Draft → For approval → Approved → For delivery → Shipped → Completed, plus Rejected.
   Stock follows the status (ADR-003): Approved/For delivery = allocated; Shipped writes Sale movements
   (on hand drops, allocation is released); Completed = the agent confirmed the delivery. */
(function (CNS) {
  'use strict';

  var S = CNS.store;
  var MODULE = 'Sales Orders & Deliveries';

  function setStatus(order, status, session, action, extra) {
    var changes = { status: status };
    Object.keys(extra || {}).forEach(function (k) { changes[k] = extra[k]; });
    var old = S.update('sales_orders', order.id, changes);
    CNS.history.log({ action: action || 'Edit', module: MODULE, record_type: 'sales_orders', record_id: order.id,
      field: 'status', old_value: old.status, new_value: status, user_id: session.user.id });
    return S.get('sales_orders', order.id);
  }

  // Where a product is picked from in a branch: its storage area there, or the branch's first area
  function areaFor(productId, branchId) {
    var loc = S.where('stock_locations', function (l) {
      var a = S.get('storage', l.area_id);
      return l.product_id === productId && a && a.branch_id === branchId;
    })[0];
    if (loc) return S.get('storage', loc.area_id);
    return S.where('storage', function (a) { return a.branch_id === branchId; })[0];
  }

  function items(orderId) {
    return S.where('sales_order_items', function (it) { return it.order_id === orderId; });
  }

  CNS.orderActions = {
    MODULE: MODULE,
    areaFor: areaFor,
    items: items,

    deliveryFor: function (orderId) {
      return S.where('deliveries', function (d) { return d.order_id === orderId; })[0] || null;
    },

    sendForApproval: function (order, session) {
      return setStatus(order, 'For approval', session, 'Edit');
    },

    // 2.3 Process Order Approval (Office Manager): the quantities become allocated to this customer
    approve: function (order, session) {
      return setStatus(order, 'Approved', session, 'Approve', { approved_by: session.user.id });
    },

    reject: function (order, reason, session) {
      return setStatus(order, 'Rejected', session, 'Reject', { approved_by: session.user.id, internal_note: 'Rejected: ' + reason });
    },

    // Back to the agent or encoder as a draft, with the Office Manager's note
    sendBack: function (order, note, session) {
      return setStatus(order, 'Draft', session, 'Edit', { internal_note: 'Sent back: ' + note });
    },

    // 2.6: create or update the delivery; the order becomes For delivery
    schedule: function (order, values, session) {
      var d = CNS.orderActions.deliveryFor(order.id);
      if (d) {
        var old = S.update('deliveries', d.id, values);
        Object.keys(values).forEach(function (k) {
          if (old[k] !== values[k]) CNS.history.logChange(MODULE, 'deliveries', d.id, k, old[k], values[k]);
        });
      } else {
        d = S.insert('deliveries', {
          order_id: order.id, schedule_date: values.schedule_date, truck_id: values.truck_id, driver_id: values.driver_id,
          status: 'Scheduled', shipped_at: null, completed_at: null, confirmed_by: null
        });
        CNS.history.log({ action: 'Create', module: MODULE, record_type: 'deliveries', record_id: d.id, new_value: order.order_no + ' · ' + values.schedule_date });
      }
      if (order.status === 'Approved') setStatus(order, 'For delivery', session, 'Edit');
      return S.get('deliveries', d.id);
    },

    // Mark as shipped: Sale movements (stock deducted), allocation released, statuses move on
    ship: function (delivery, session) {
      var order = S.get('sales_orders', delivery.order_id);
      var now = new Date().toISOString();
      items(order.id).forEach(function (it) {
        var area = areaFor(it.product_id, order.branch_id);
        S.insert('stock_movements', {
          datetime: now, product_id: it.product_id, branch_id: order.branch_id, area_id: area ? area.id : null,
          type: 'Sale', qty_change: -it.qty, ref: order.order_no, user_id: session.user.id, reason: null
        });
      });
      S.update('deliveries', delivery.id, { status: 'Shipped', shipped_at: now });
      CNS.history.log({ action: 'Stock change', module: MODULE, record_type: 'sales_orders', record_id: order.id,
        field: 'qty_change', new_value: items(order.id).length + ' lines deducted (shipped)', user_id: session.user.id });
      setStatus(order, 'Shipped', session, 'Edit');
      return S.get('deliveries', delivery.id);
    },

    // The sales agent confirms the delivery → Completed
    confirmDelivered: function (delivery, session, note) {
      var order = S.get('sales_orders', delivery.order_id);
      S.update('deliveries', delivery.id, { status: 'Completed', completed_at: new Date().toISOString(), confirmed_by: session.user.id });
      setStatus(order, 'Completed', session, 'Edit', note ? { internal_note: (order.internal_note ? order.internal_note + ' · ' : '') + 'Delivery note: ' + note } : null);
      return S.get('deliveries', delivery.id);
    }
  };
})(window.CNS);
