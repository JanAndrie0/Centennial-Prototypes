/* Mock data seed (foundation.md 0.5): Chapter 3 ERD table names plus `branches`.
   store.js calls CNS.seed() on first load and on "Reset demo data". Dates are relative to today,
   so overdue installments and this week's deliveries stay realistic whenever the demo runs.
   Stock levels are never stored: they come from stock_movements (ADR-003).

   Demo cases the plan requires (foundation.md 0.5):
   - Pioneer Epoxy A at Centennial: on hand 6, allocated 25 → available −19 (Backordered)
   - Teflon tape: Low · Concrete nail 3": Below floor · Cable ties: Over ceiling
   - Bagong Pag-asa Hardware: an overdue installment (no credit limits and no bounced status since the Nov 11 ERD)
   - Golden Star Hardware: a clean payment record, to contrast with Bagong Pag-asa
   Kept small on purpose (panel demo): one user per role, 12 products, 6 customers, 10 orders. */
(function (CNS) {
  'use strict';

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function day(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function at(offset, hours, minutes) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(hours, minutes || 0, 0, 0);
    return d.toISOString();
  }

  CNS.seed = function () {
    var R = CNS.ROLES;

    var branches = [
      { id: 'b1', name: 'Centennial Nail & Screw Construction Corporation', short_name: 'Centennial' },
      { id: 'b2', name: 'I-KU Construction Corporation', short_name: 'I-KU' },
      { id: 'b3', name: 'ECK 888 Construction Corporation', short_name: 'ECK 888' }
    ];

    // [id, username, full_name, role, branch_id, is_active]
    var users = [
      ['u1', 'ceo', 'Roberto Tan', R.CEO, 'b1', true],
      ['u2', 'officemgr', 'Maricel Santos', R.OM, 'b1', true],
      ['u3', 'supervisor', 'Joel Ramos', R.SS, 'b1', true],
      ['u4', 'warehouse', 'Ana Cruz', R.STAFF, 'b1', true],
      ['u8', 'agent', 'Ramon Dela Cruz', R.AGENT, 'b1', true],
      ['u10', 'agent3', 'Paolo Reyes', R.AGENT, 'b2', true],
      ['u11', 'om.iku', 'Teresa Lim', R.OM, 'b2', true],
      ['u13', 'om.eck', 'Carmela Uy', R.OM, 'b3', true],
      ['u15', 'agent4', 'Jessa Flores', R.AGENT, 'b3', true]
    ].map(function (u, i) {
      // Spread recent logins over the last few days; the inactive account last logged in a month ago
      var lastLogin = u[5] ? at(-(i % 4), 7 + (i % 4), (i * 7) % 60) : at(-31, 8, 15);
      return { id: u[0], username: u[1], full_name: u[2], role: u[3], branch_id: u[4], is_active: u[5], last_login: lastLogin };
    });

    var categories = [
      { id: 'c1', name: 'Pipes & Fittings' },
      { id: 'c2', name: 'Nails' },
      { id: 'c3', name: 'Screws & Fasteners' },
      { id: 'c4', name: 'Adhesives & Sealants' },
      { id: 'c5', name: 'Paints' },
      { id: 'c6', name: 'Door & Cabinet Hardware' },
      { id: 'c7', name: 'Electrical' },
      { id: 'c8', name: 'Tapes' }
    ];

    var units = [
      { id: 'pcs', name: 'Pieces' }, { id: 'box', name: 'Boxes' }, { id: 'pack', name: 'Packs' },
      { id: 'roll', name: 'Rolls' }, { id: 'dozen', name: 'Dozens' }, { id: 'gallon', name: 'Gallons' },
      { id: 'can', name: 'Cans' }, { id: 'pair', name: 'Pairs' }
    ];

    var suppliers = [
      { id: 's1', company_name: 'Pacific Pipe Supply Co.', contact_person: 'Arturo Lim', contact_number: '(02) 8555 0201', address: 'Edsa, Caloocan City' },
      { id: 's2', company_name: 'Luzon Steel Wire Products', contact_person: 'Belen Navarro', contact_number: '(02) 8555 0202', address: 'Km. 18 MacArthur Hwy., Valenzuela City' },
      { id: 's3', company_name: 'Metro Fastener Distributors', contact_person: 'Henry Co', contact_number: '(02) 8555 0203', address: 'Soler St., Binondo, Manila' },
      { id: 's4', company_name: 'Bonding Solutions Trading', contact_person: 'Gina Ferrer', contact_number: '(02) 8555 0204', address: 'Mercedes Ave., Pasig City' },
      { id: 's5', company_name: 'Rainbow Paints Wholesale', contact_person: 'Oscar Bello', contact_number: '(02) 8555 0205', address: 'Del Monte Ave., Quezon City' },
      { id: 's6', company_name: 'Mabuhay Hardware & Electrical Supply', contact_person: 'Lito Manalastas', contact_number: '(02) 8555 0206', address: 'Rizal Ave., Sta. Cruz, Manila' }
    ];

    // [id, code, name, category, unit, price, min order, floor, critical (= reorder point), ceiling, supplier, purchase unit, conversion]
    var productRows = [
      ['p1', 'PVC-050', 'PVC pipe ½" × 10 ft', 'c1', 'pcs', 95, 10, 50, 80, 400, 's1', 'bundle', 10],
      ['p7', 'NL-CW2', 'Common wire nail 2"', 'c2', 'box', 1150, 2, 10, 20, 80, 's2', 'bundle', 10],
      ['p10', 'NL-CN2', 'Concrete nail 2"', 'c2', 'box', 1350, 2, 8, 15, 60, 's2', 'bundle', 10],
      ['p11', 'NL-CN3', 'Concrete nail 3"', 'c2', 'box', 1400, 2, 8, 15, 60, 's2', 'bundle', 10],
      ['p14', 'SC-GY1', 'Gypsum screw 1" (box of 1,000)', 'c3', 'box', 450, 5, 20, 30, 150, 's3', 'case', 10],
      ['p21', 'TX-6', 'Tox 6 mm (plastic wall anchor)', 'c3', 'pack', 45, 10, 30, 50, 300, 's3', 'carton', 50],
      ['p23', 'EP-A', 'Pioneer Epoxy A', 'c4', 'pcs', 165, 12, 24, 48, 250, 's4', 'mother box', 250],
      ['p24', 'EP-B', 'Pioneer Epoxy B', 'c4', 'pcs', 165, 12, 24, 48, 250, 's4', 'mother box', 250],
      ['p27', 'PT-PRW', 'Primer paint, white', 'c5', 'gallon', 690, 4, 10, 20, 80, 's5', 'case', 4],
      ['p31', 'HW-HG3', 'Butt hinges 3"', 'c6', 'pair', 85, 12, 24, 48, 240, 's6', 'box', 6],
      ['p35', 'EL-CT8', 'Cable ties 8" (pack of 100)', 'c7', 'pack', 95, 10, 30, 60, 300, 's6', 'carton', 50],
      ['p37', 'TP-TEF', 'Teflon tape', 'c8', 'roll', 18, 50, 30, 60, 500, 's6', 'box', 100]
    ];

    var products = [];
    var productSupplier = [];
    productRows.forEach(function (r) {
      products.push({
        id: r[0], code: r[1], name: r[2], category_id: r[3], unit_id: r[4], selling_price: r[5],
        min_order_qty: r[6], floor_qty: r[7], critical_qty: r[8], ceiling_qty: r[9], supplier_id: r[10]
      });
      productSupplier.push({ product_id: r[0], supplier_id: r[10], purchase_unit: r[11], conversion: r[12] });
    });

    function product(id) {
      return products.filter(function (p) { return p.id === id; })[0];
    }

    var storage = [
      { id: 'a1', branch_id: 'b1', name: 'Warehouse A' },
      { id: 'a2', branch_id: 'b1', name: 'Warehouse B' },
      { id: 'a3', branch_id: 'b1', name: 'Stockroom' },
      { id: 'a4', branch_id: 'b2', name: 'Main storage' },
      { id: 'a5', branch_id: 'b3', name: 'Main storage' }
    ];

    // Where each product is kept at Centennial: pipes, nails, screws in Warehouse A;
    // adhesives and paints in Warehouse B; small hardware and tapes in the Stockroom.
    function centennialArea(p) {
      if (['c1', 'c2', 'c3'].indexOf(p.category_id) >= 0) return 'a1';
      if (['c4', 'c5'].indexOf(p.category_id) >= 0) return 'a2';
      return 'a3';
    }

    var branchStocked = ['p1', 'p7', 'p14', 'p27', 'p31', 'p37'];
    var stockLocations = [];
    products.forEach(function (p) {
      stockLocations.push({ product_id: p.id, area_id: centennialArea(p) });
      if (branchStocked.indexOf(p.id) >= 0) {
        stockLocations.push({ product_id: p.id, area_id: 'a4' });
        stockLocations.push({ product_id: p.id, area_id: 'a5' });
      }
    });

    var movements = [];
    var seq = 0;
    function move(offset, productId, branchId, areaId, type, qty, ref, userId, reason) {
      movements.push({
        id: 'm' + (++seq), datetime: at(offset, 8, 30), product_id: productId, branch_id: branchId, area_id: areaId,
        type: type, qty_change: qty, ref: ref, user_id: userId, reason: reason || null
      });
    }

    // Opening stock: 60% of ceiling at Centennial, 30% at the other branches, except the demo cases.
    var OPENING = { p23: 6, p37: 45, p11: 6, p35: 900, p27: 60 };
    products.forEach(function (p) {
      var qty = OPENING[p.id] != null ? OPENING[p.id] : Math.round(p.ceiling_qty * 0.6);
      move(-45, p.id, 'b1', centennialArea(p), 'Receive', qty, 'Opening stock', 'u4');
      if (branchStocked.indexOf(p.id) >= 0) {
        var small = Math.round(p.ceiling_qty * 0.3);
        move(-45, p.id, 'b2', 'a4', 'Receive', small, 'Opening stock', 'u4');
        move(-45, p.id, 'b3', 'a5', 'Receive', small, 'Opening stock', 'u4');
      }
    });

    var clients = [
      ['k1', 'Golden Star Hardware', 'Ernesto Lim', '0917 555 0101', '128 A. Mabini St., Caloocan City', 'b1', 'u8'],
      ['k2', 'RJ Construction Supply', 'Rodel Javier', '0918 555 0102', '45 Commonwealth Ave., Quezon City', 'b1', 'u8'],
      ['k3', 'Bagong Pag-asa Hardware', 'Lorna Dizon', '0919 555 0103', '12 J.P. Rizal St., Marikina City', 'b1', 'u8'],
      ['k4', 'Sto. Niño Builders Depot', 'Fernando Cruz', '0920 555 0104', '88 Gov. Pascual Ave., Malabon City', 'b1', 'u8'],
      ['k9', 'Bayanihan Builders Supply', 'Rogelio Santos', '0926 555 0109', 'Ortigas Ave. Ext., Cainta, Rizal', 'b2', 'u10'],
      ['k11', 'Evergreen Construction Supply', 'Marvin Tolentino', '0928 555 0111', 'Aguinaldo Hwy., Bacoor, Cavite', 'b3', 'u15']
    ].map(function (c) {
      return { id: c[0], store_name: c[1], contact_person: c[2], contact_number: c[3], address: c[4], branch_id: c[5], agent_id: c[6] };
    });

    // [id, client, agent, encoded_by, branch, order day, status, delivery day, approved_by, note, lines [[product, qty]]]
    var orderRows = [
      ['o1', 'k3', 'u8', 'u4', 'b1', -25, 'Completed', -20, 'u2', null, [['p7', 20], ['p10', 10], ['p14', 40], ['p27', 20]]],
      ['o2', 'k3', 'u8', 'u8', 'b1', -3, 'Approved', 4, 'u2', 'Combined with next week\'s order.', [['p23', 25], ['p24', 24], ['p1', 60], ['p21', 30], ['p31', 24], ['p35', 200]]],
      ['o3', 'k1', 'u8', 'u8', 'b1', -12, 'Completed', -7, 'u2', null, [['p1', 40], ['p21', 40], ['p27', 10], ['p35', 30]]],
      ['o4', 'k2', 'u8', 'u4', 'b1', -9, 'Completed', -4, 'u2', null, [['p14', 10], ['p10', 5], ['p31', 24]]],
      ['o5', 'k4', 'u8', 'u4', 'b1', -6, 'Completed', -1, 'u2', null, [['p7', 4], ['p21', 30], ['p27', 6]]],
      ['o6', 'k1', 'u8', 'u4', 'b1', -4, 'Completed', -1, 'u2', null, [['p1', 30], ['p35', 10], ['p21', 10], ['p31', 24]]],
      ['o7', 'k2', 'u8', 'u4', 'b1', 0, 'Approved', 7, 'u2', null, [['p10', 4], ['p31', 12], ['p21', 10]]],
      ['o8', 'k9', 'u10', 'u10', 'b2', -8, 'Completed', -3, 'u11', null, [['p1', 20], ['p7', 3]]],
      ['o9', 'k11', 'u15', 'u15', 'b3', -10, 'Completed', -5, 'u13', null, [['p1', 30], ['p31', 12]]],
      ['o10', 'k3', 'u8', 'u8', 'b1', -1, 'For approval', 6, null, null, [['p27', 8], ['p14', 10], ['p7', 2]]]
    ];

    var salesOrders = [];
    var salesOrderItems = [];
    var itemSeq = 0;
    orderRows.forEach(function (o, i) {
      salesOrders.push({
        id: o[0], order_no: 'SO-2026-' + String(101 + i).padStart(4, '0'), client_id: o[1], agent_id: o[2], encoded_by: o[3],
        branch_id: o[4], order_date: day(o[5]), status: o[6], delivery_date: day(o[7]), approved_by: o[8],
        internal_note: o[9], slip_photo: null
      });
      o[10].forEach(function (line) {
        salesOrderItems.push({ id: 'oi' + (++itemSeq), order_id: o[0], product_id: line[0], qty: line[1], unit_price: product(line[0]).selling_price });
      });
    });

    // Shipped and Completed orders have left the warehouse: one Sale movement per line on the delivery day.
    salesOrders.forEach(function (o) {
      if (o.status !== 'Shipped' && o.status !== 'Completed') return;
      var offset = orderRows.filter(function (r) { return r[0] === o.id; })[0][7];
      salesOrderItems.filter(function (it) { return it.order_id === o.id; }).forEach(function (it) {
        var area = o.branch_id === 'b1' ? centennialArea(product(it.product_id)) : (o.branch_id === 'b2' ? 'a4' : 'a5');
        move(offset, it.product_id, o.branch_id, area, 'Sale', -it.qty, o.order_no, 'u4');
      });
    });

    var trucks = [
      { id: 't1', name: 'Isuzu Elf', plate_no: 'NBC 1234' },
      { id: 't2', name: 'Mitsubishi Fuso Canter', plate_no: 'NDE 5678' }
    ];

    var drivers = [
      { id: 'd1', full_name: 'Rodel Santos', contact_number: '0917 555 0301' },
      { id: 'd2', full_name: 'Benjie Ocampo', contact_number: '0918 555 0302' }
    ];

    // [id, order, schedule day, truck, driver, status, confirmed_by]
    var deliveries = [
      ['dl1', 'o1', -20, 't1', 'd1', 'Completed', 'u8'],
      ['dl2', 'o3', -7, 't1', 'd2', 'Completed', 'u8'],
      ['dl3', 'o4', -4, 't2', 'd1', 'Completed', 'u8'],
      ['dl4', 'o5', -1, 't1', 'd1', 'Completed', 'u8'],
      ['dl5', 'o6', -1, 't2', 'd2', 'Completed', 'u8'],
      ['dl6', 'o8', -3, 't1', 'd2', 'Completed', 'u10'],
      ['dl7', 'o9', -5, 't2', 'd1', 'Completed', 'u15']
    ].map(function (d) {
      var shipped = d[5] !== 'Scheduled';
      return {
        id: d[0], order_id: d[1], schedule_date: day(d[2]), truck_id: d[3], driver_id: d[4], status: d[5],
        shipped_at: shipped ? at(d[2], 7, 30) : null,
        completed_at: d[5] === 'Completed' ? at(d[2], 15, 10) : null,
        confirmed_by: d[6]
      };
    });

    // [plan id, order, total, no. of payments, frequency, schedule [[due day, amount due, amount paid]]]
    var planRows = [
      ['ip1', 'o1', 68300, 3, 'Every 15 days', [[-20, 22800, 22800], [-5, 22750, 0], [5, 22750, 0]]]
    ];

    var installmentPlans = [];
    var installmentSchedules = [];
    var schedSeq = 0;
    planRows.forEach(function (p) {
      installmentPlans.push({ id: p[0], order_id: p[1], total: p[2], no_of_payments: p[3], frequency: p[4], start_date: day(p[5][0][0]) });
      p[5].forEach(function (s) {
        installmentSchedules.push({ id: 'is' + (++schedSeq), plan_id: p[0], due_date: day(s[0]), amount_due: s[1], amount_paid: s[2] });
      });
    });

    // [id, order, client, schedule, amount, method (COD, E-wallet, Cheque, Bank transfer), reference, day, received_by, channel, verified_by]
    var payments = [
      ['pay1', 'o1', 'k3', 'is1', 22800, 'Cheque', 'BDO 004512', -20, 'u4', 'Office', 'u2'],
      ['pay2', 'o3', 'k1', null, 15350, 'Bank transfer', 'BPI-TRF-88213', -5, 'u4', 'Office', 'u2'],
      ['pay3', 'o5', 'k4', null, 10090, 'COD', '', -1, 'u4', 'Office', 'u2'],
      ['pay4', 'o6', 'k1', null, 6290, 'E-wallet', 'GCash 8821 4410', -1, 'u8', 'Field', 'u2']
    ].map(function (p) {
      return {
        id: p[0], order_id: p[1], client_id: p[2], schedule_id: p[3], amount: p[4], method: p[5], reference_no: p[6],
        date: day(p[7]), payment_photo: null, received_by: p[8], channel: p[9], verified_by: p[10]
      };
    });

    // [id, supplier, branch, day, status, payment status, approved_by, requested_by, lines [[product, qty in purchase unit, received, unit cost]]]
    var poRows = [
      ['po1', 's4', 'b1', -2, 'Ordered', 'Unpaid', 'u2', 'u4', [['p23', 1, 0, 26000]]],
      ['po2', 's2', 'b1', -12, 'Received', 'Paid', 'u2', 'u4', [['p7', 2, 2, 9500]]]
    ];

    var purchaseOrders = [];
    var purchaseOrderItems = [];
    var poItemSeq = 0;
    poRows.forEach(function (p, i) {
      purchaseOrders.push({
        id: p[0], po_no: 'PO-2026-' + String(38 + i).padStart(4, '0'), supplier_id: p[1], branch_id: p[2], date: day(p[3]),
        status: p[4], payment_status: p[5], approved_by: p[6], requested_by: p[7], expected_date: day(p[3] + 3)
      });
      p[8].forEach(function (line) {
        purchaseOrderItems.push({ id: 'pi' + (++poItemSeq), po_id: p[0], product_id: line[0], qty_ordered: line[1], qty_received: line[2], unit_cost: line[3] });
      });
    });

    // Received purchase orders, one stock adjustment and one branch transfer
    move(-10, 'p7', 'b1', 'a1', 'Receive', 20, 'PO-2026-0039', 'u4');
    move(-5, 'p24', 'b1', 'a2', 'Adjust', -3, 'ADJ-0001', 'u4', 'Damaged');
    move(-4, 'p7', 'b1', 'a1', 'Transfer out', -10, 'TR-0001', 'u4', 'To I-KU');
    move(-3, 'p7', 'b2', 'a4', 'Transfer in', 10, 'TR-0001', 'u4', 'From Centennial');

    // tbl_stock_counts (Nov 11 ERD): one past count of the Centennial Stockroom. Cable ties were 2 packs short,
    // so the count also wrote a Count movement; the other two matched and changed nothing.
    var stockCounts = [
      ['sc1', 'p31', 144, 144], ['sc2', 'p35', 870, 868], ['sc3', 'p37', 45, 45]
    ].map(function (r) {
      return { id: r[0], product_id: r[1], area_id: 'a3', counted_by: 'u4', system_qty: r[2], counted_qty: r[3], count_date: day(-6) };
    });
    move(-6, 'p35', 'b1', 'a3', 'Count', -2, 'CNT-0001', 'u4', 'Physical count');

    var historyLogs = [
      { id: 'h1', datetime: at(-2, 9, 14), user_id: 'u2', branch_id: 'b1', action: 'Edit', module: 'Products & Inventory', record_type: 'products', record_id: 'p11', field: 'ceiling_qty', old_value: '50', new_value: '60' },
      { id: 'h2', datetime: at(-3, 10, 2), user_id: 'u2', branch_id: 'b1', action: 'Approve', module: 'Sales Orders & Deliveries', record_type: 'sales_orders', record_id: 'o2', field: 'status', old_value: 'For approval', new_value: 'Approved' },
      { id: 'h3', datetime: at(-5, 15, 40), user_id: 'u4', branch_id: 'b1', action: 'Stock change', module: 'Products & Inventory', record_type: 'stock_movements', record_id: 'ADJ-0001', field: 'qty_change', old_value: null, new_value: '-3 (Damaged)' },
      { id: 'h7', datetime: at(-4, 14, 0), user_id: 'u4', branch_id: 'b1', action: 'Stock change', module: 'Products & Inventory', record_type: 'stock_movements', record_id: 'TR-0001', field: 'qty_change', old_value: null, new_value: '-10 (To I-KU)' },
      { id: 'h9', datetime: at(-3, 13, 15), user_id: 'u2', branch_id: 'b1', action: 'Approve', module: 'Customer Accounts & Payments', record_type: 'payments', record_id: 'pay4', field: 'verified_by', old_value: null, new_value: 'Maricel Santos' },
      { id: 'h10', datetime: at(-2, 8, 2), user_id: 'u2', branch_id: 'b1', action: 'Approve', module: 'Purchasing & Suppliers', record_type: 'purchase_orders', record_id: 'po1', field: 'status', old_value: 'For approval', new_value: 'Approved' },
      { id: 'h11', datetime: at(-1, 7, 58), user_id: 'u4', branch_id: 'b1', action: 'Login', module: 'User Accounts & History Log', record_type: 'users', record_id: 'u4', field: null, old_value: null, new_value: null },
      { id: 'h12', datetime: at(-1, 9, 40), user_id: 'u4', branch_id: 'b1', action: 'Create', module: 'Sales Orders & Deliveries', record_type: 'sales_orders', record_id: 'o10', field: null, old_value: null, new_value: 'SO-2026-0110' },
      { id: 'h13', datetime: at(-1, 10, 12), user_id: 'u8', branch_id: 'b1', action: 'Login', module: 'User Accounts & History Log', record_type: 'users', record_id: 'u8', field: null, old_value: null, new_value: null }
    ];

    return {
      seq: 1000,
      branches: branches,
      users: users,
      history_logs: historyLogs,
      categories: categories,
      units: units,
      suppliers: suppliers,
      products: products,
      product_suppliers: productSupplier,
      storage_areas: storage,
      stock_locations: stockLocations,
      stock_movements: movements,
      stock_counts: stockCounts,
      clients: clients,
      sales_orders: salesOrders,
      sales_order_items: salesOrderItems,
      trucks: trucks,
      drivers: drivers,
      deliveries: deliveries,
      installment_plans: installmentPlans,
      installment_schedules: installmentSchedules,
      payments: payments,
      purchase_orders: purchaseOrders,
      purchase_order_items: purchaseOrderItems
    };
  };
})(window.CNS);
