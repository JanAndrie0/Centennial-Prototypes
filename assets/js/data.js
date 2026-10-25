/* Mock data seed (foundation.md 0.5): Chapter 3 ERD table names plus `branches`.
   store.js calls CNS.seed() on first load and on "Reset demo data". Dates are relative to today,
   so overdue installments and this week's deliveries stay realistic whenever the demo runs.
   Stock levels are never stored: they come from stock_movements (ADR-003).

   Demo cases the plan requires (foundation.md 0.5):
   - Pioneer Epoxy A at Centennial: on hand 6, allocated 25 → available −19 (Backordered)
   - Teflon tape: Low · Concrete nail 3": Below floor · Cable ties: Over ceiling
   - Bagong Pag-asa Hardware: over its credit limit, with an overdue installment */
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
      ['u5', 'staff2', 'Mark Villanueva', R.STAFF, 'b1', true],
      ['u6', 'staff3', 'Liza Bautista', R.STAFF, 'b1', true],
      ['u7', 'staff4', 'Dennis Garcia', R.STAFF, 'b1', true],
      ['u8', 'agent', 'Ramon Dela Cruz', R.AGENT, 'b1', true],
      ['u9', 'agent2', 'Grace Mendoza', R.AGENT, 'b1', true],
      ['u10', 'agent3', 'Paolo Reyes', R.AGENT, 'b2', true],
      ['u11', 'om.iku', 'Teresa Lim', R.OM, 'b2', true],
      ['u12', 'ss.iku', 'Victor Aquino', R.SS, 'b2', true],
      ['u13', 'om.eck', 'Carmela Uy', R.OM, 'b3', true],
      ['u14', 'ss.eck', 'Arnel Domingo', R.SS, 'b3', true],
      ['u15', 'agent4', 'Jessa Flores', R.AGENT, 'b3', true],
      ['u16', 'jcastro', 'Jun Castro', R.STAFF, 'b1', false]
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
      { id: 's1', company_name: 'Pacific Pipe Supply Co.', contact_person: 'Arturo Lim', contact_no: '(02) 8555 0201', address: 'Edsa, Caloocan City' },
      { id: 's2', company_name: 'Luzon Steel Wire Products', contact_person: 'Belen Navarro', contact_no: '(02) 8555 0202', address: 'Km. 18 MacArthur Hwy., Valenzuela City' },
      { id: 's3', company_name: 'Metro Fastener Distributors', contact_person: 'Henry Co', contact_no: '(02) 8555 0203', address: 'Soler St., Binondo, Manila' },
      { id: 's4', company_name: 'Bonding Solutions Trading', contact_person: 'Gina Ferrer', contact_no: '(02) 8555 0204', address: 'Mercedes Ave., Pasig City' },
      { id: 's5', company_name: 'Rainbow Paints Wholesale', contact_person: 'Oscar Bello', contact_no: '(02) 8555 0205', address: 'Del Monte Ave., Quezon City' },
      { id: 's6', company_name: 'Mabuhay Hardware & Electrical Supply', contact_person: 'Lito Manalastas', contact_no: '(02) 8555 0206', address: 'Rizal Ave., Sta. Cruz, Manila' }
    ];

    // [id, code, name, category, unit, price, min order, floor, critical (= reorder point), ceiling, supplier, purchase unit, conversion]
    var productRows = [
      ['p1', 'PVC-050', 'PVC pipe ½" × 10 ft', 'c1', 'pcs', 95, 10, 50, 80, 400, 's1', 'bundle', 10],
      ['p2', 'PVC-075', 'PVC pipe ¾" × 10 ft', 'c1', 'pcs', 135, 10, 40, 70, 300, 's1', 'bundle', 10],
      ['p3', 'PVC-100', 'PVC pipe 1" × 10 ft', 'c1', 'pcs', 180, 10, 30, 50, 250, 's1', 'bundle', 10],
      ['p4', 'PVC-E050', 'PVC elbow ½"', 'c1', 'pcs', 12, 50, 100, 200, 1000, 's1', 'bag', 100],
      ['p5', 'PVC-T050', 'PVC tee ½"', 'c1', 'pcs', 15, 50, 100, 200, 1000, 's1', 'bag', 100],
      ['p6', 'PVC-SC100', 'PVC solvent cement 100 mL', 'c4', 'can', 85, 12, 24, 48, 200, 's1', 'case', 24],
      ['p7', 'NL-CW2', 'Common wire nail 2"', 'c2', 'box', 1150, 2, 10, 20, 80, 's2', 'bundle', 10],
      ['p8', 'NL-CW3', 'Common wire nail 3"', 'c2', 'box', 1100, 2, 10, 20, 80, 's2', 'bundle', 10],
      ['p9', 'NL-CW4', 'Common wire nail 4"', 'c2', 'box', 1080, 2, 8, 15, 60, 's2', 'bundle', 10],
      ['p10', 'NL-CN2', 'Concrete nail 2"', 'c2', 'box', 1350, 2, 8, 15, 60, 's2', 'bundle', 10],
      ['p11', 'NL-CN3', 'Concrete nail 3"', 'c2', 'box', 1400, 2, 8, 15, 60, 's2', 'bundle', 10],
      ['p12', 'NL-UMB', 'Umbrella nail 2½"', 'c2', 'box', 980, 2, 5, 10, 40, 's2', 'bundle', 10],
      ['p13', 'NL-FIN', 'Finishing nail 1½"', 'c2', 'box', 1250, 2, 5, 10, 40, 's2', 'bundle', 10],
      ['p14', 'SC-GY1', 'Gypsum screw 1" (box of 1,000)', 'c3', 'box', 450, 5, 20, 30, 150, 's3', 'case', 10],
      ['p15', 'SC-GY15', 'Gypsum screw 1½" (box of 1,000)', 'c3', 'box', 520, 5, 15, 25, 120, 's3', 'case', 10],
      ['p16', 'SC-WD1', 'Wood screw 1"', 'c3', 'box', 380, 5, 10, 20, 100, 's3', 'case', 10],
      ['p17', 'SC-TEK', 'Tekscrew 2½"', 'c3', 'box', 890, 2, 8, 15, 60, 's3', 'case', 10],
      ['p18', 'SC-MB38', 'Machine bolt ⅜" × 2"', 'c3', 'pcs', 18, 50, 100, 200, 1000, 's3', 'box', 100],
      ['p19', 'SC-NUT38', 'Hex nut ⅜"', 'c3', 'pcs', 4, 100, 200, 400, 2000, 's3', 'box', 500],
      ['p20', 'SC-WSH38', 'Flat washer ⅜"', 'c3', 'pcs', 2, 100, 200, 400, 2000, 's3', 'box', 500],
      ['p21', 'TX-6', 'Tox 6 mm (plastic wall anchor)', 'c3', 'pack', 45, 10, 30, 50, 300, 's3', 'carton', 50],
      ['p22', 'TX-8', 'Tox 8 mm (plastic wall anchor)', 'c3', 'pack', 55, 10, 30, 50, 300, 's3', 'carton', 50],
      ['p23', 'EP-A', 'Pioneer Epoxy A', 'c4', 'pcs', 165, 12, 24, 48, 250, 's4', 'mother box', 125],
      ['p24', 'EP-B', 'Pioneer Epoxy B', 'c4', 'pcs', 165, 12, 24, 48, 250, 's4', 'mother box', 125],
      ['p25', 'CC-QT', 'Contact cement (quart)', 'c4', 'can', 320, 6, 12, 24, 120, 's4', 'case', 12],
      ['p26', 'SIL-CL', 'Silicone sealant, clear', 'c4', 'pcs', 145, 12, 24, 48, 240, 's4', 'box', 24],
      ['p27', 'PT-PRW', 'Primer paint, white', 'c5', 'gallon', 690, 4, 10, 20, 80, 's5', 'case', 4],
      ['p28', 'PT-PRR', 'Red oxide primer', 'c5', 'gallon', 640, 4, 10, 20, 80, 's5', 'case', 4],
      ['p29', 'PT-THN', 'Paint thinner', 'c5', 'gallon', 380, 4, 10, 20, 80, 's5', 'case', 4],
      ['p30', 'PT-BR4', 'Paint brush 4"', 'c5', 'pcs', 75, 12, 24, 48, 240, 's5', 'box', 12],
      ['p31', 'HW-HG3', 'Butt hinges 3"', 'c6', 'pair', 85, 12, 24, 48, 240, 's6', 'box', 6],
      ['p32', 'HW-HG4', 'Butt hinges 4"', 'c6', 'pair', 110, 12, 24, 48, 240, 's6', 'box', 6],
      ['p33', 'HW-PL40', 'Padlock 40 mm', 'c6', 'pcs', 185, 6, 12, 24, 120, 's6', 'box', 12],
      ['p34', 'HW-DB4', 'Door bolt 4"', 'c6', 'pcs', 65, 12, 24, 48, 240, 's6', 'box', 24],
      ['p35', 'EL-CT8', 'Cable ties 8" (pack of 100)', 'c7', 'pack', 95, 10, 30, 60, 300, 's6', 'carton', 50],
      ['p36', 'EL-TP', 'Electrical tape', 'c8', 'dozen', 360, 2, 10, 20, 100, 's6', 'case', 10],
      ['p37', 'TP-TEF', 'Teflon tape', 'c8', 'roll', 18, 50, 30, 60, 500, 's6', 'box', 100],
      ['p38', 'TP-MSK1', 'Masking tape 1"', 'c8', 'roll', 42, 24, 48, 96, 480, 's6', 'case', 48],
      ['p39', 'TP-DUC2', 'Duct tape 2"', 'c8', 'roll', 125, 12, 24, 48, 240, 's6', 'case', 24],
      ['p40', 'EL-WN', 'Wire nut (pack of 50)', 'c7', 'pack', 120, 5, 10, 20, 100, 's6', 'box', 10]
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

    var branchStocked = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p14', 'p15', 'p16', 'p21', 'p27', 'p31', 'p36', 'p37'];
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
    var OPENING = { p23: 6, p37: 45, p11: 6, p35: 900 };
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
      ['k1', 'Golden Star Hardware', 'Ernesto Lim', '0917 555 0101', '128 A. Mabini St., Caloocan City', 150000, 'b1', 'u8'],
      ['k2', 'RJ Construction Supply', 'Rodel Javier', '0918 555 0102', '45 Commonwealth Ave., Quezon City', 250000, 'b1', 'u8'],
      ['k3', 'Bagong Pag-asa Hardware', 'Lorna Dizon', '0919 555 0103', '12 J.P. Rizal St., Marikina City', 80000, 'b1', 'u9'],
      ['k4', 'Sto. Niño Builders Depot', 'Fernando Cruz', '0920 555 0104', '88 Gov. Pascual Ave., Malabon City', 120000, 'b1', 'u9'],
      ['k5', 'JMC Hardware & Electrical', 'Jose Manalo', '0921 555 0105', 'Ortigas Ave. Ext., Antipolo, Rizal', 100000, 'b1', 'u8'],
      ['k6', 'Tres Hermanos Construction Supply', 'Antonio Reyes', '0922 555 0106', 'MacArthur Hwy., Valenzuela City', 200000, 'b1', 'u9'],
      ['k7', 'San Roque Hardware', 'Nida Pascual', '0923 555 0107', 'Caruncho Ave., Pasig City', 90000, 'b1', 'u8'],
      ['k8', 'Lucky Seven Hardware', 'Wilson Go', '0925 555 0108', 'MacArthur Hwy., Meycauayan, Bulacan', 150000, 'b1', 'u9'],
      ['k9', 'Bayanihan Builders Supply', 'Rogelio Santos', '0926 555 0109', 'Ortigas Ave. Ext., Cainta, Rizal', 120000, 'b2', 'u10'],
      ['k10', 'Masagana Hardware', 'Elena Robles', '0927 555 0110', 'Gen. Luna St., San Mateo, Rizal', 80000, 'b2', 'u10'],
      ['k11', 'Evergreen Construction Supply', 'Marvin Tolentino', '0928 555 0111', 'Aguinaldo Hwy., Bacoor, Cavite', 180000, 'b3', 'u15'],
      ['k12', 'Dalisay Hardware', 'Cecilia Dalisay', '0929 555 0112', 'Nueno Ave., Imus, Cavite', 70000, 'b3', 'u15']
    ].map(function (c) {
      return { id: c[0], store_name: c[1], contact_person: c[2], contact_no: c[3], address: c[4], credit_limit: c[5], branch_id: c[6], agent_id: c[7] };
    });

    // [id, client, agent, encoded_by, branch, order day, status, delivery day, approved_by, note, lines [[product, qty]]]
    var orderRows = [
      ['o1', 'k3', 'u9', 'u4', 'b1', -40, 'Completed', -33, 'u2', null, [['p7', 30], ['p10', 20], ['p14', 40], ['p27', 20]]],
      ['o2', 'k3', 'u9', 'u9', 'b1', -3, 'Approved', 4, 'u2', 'Combined with next week\'s order.', [['p23', 25], ['p8', 20], ['p26', 24]]],
      ['o3', 'k1', 'u8', 'u8', 'b1', -20, 'Completed', -13, 'u2', null, [['p1', 50], ['p4', 200], ['p5', 150], ['p6', 24]]],
      ['o4', 'k2', 'u8', 'u4', 'b1', -12, 'Completed', -5, 'u2', null, [['p14', 30], ['p15', 20], ['p21', 40], ['p22', 40]]],
      ['o5', 'k6', 'u9', 'u5', 'b1', -9, 'Shipped', -2, 'u2', null, [['p9', 15], ['p13', 10], ['p31', 48]]],
      ['o6', 'k8', 'u9', 'u4', 'b1', -8, 'Shipped', -1, 'u2', null, [['p27', 10], ['p28', 10], ['p29', 8], ['p30', 36]]],
      ['o7', 'k4', 'u9', 'u4', 'b1', -5, 'For delivery', 2, 'u2', null, [['p2', 40], ['p3', 30], ['p6', 12]]],
      ['o8', 'k7', 'u8', 'u5', 'b1', -4, 'For delivery', 3, 'u2', 'Deliver before 10 AM.', [['p32', 60], ['p33', 12], ['p34', 48]]],
      ['o9', 'k5', 'u8', 'u8', 'b1', -2, 'Approved', 5, 'u2', null, [['p36', 6], ['p39', 24], ['p40', 10]]],
      ['o10', 'k9', 'u10', 'u10', 'b2', -2, 'Approved', 5, 'u11', null, [['p1', 20], ['p7', 5]]],
      ['o11', 'k1', 'u8', 'u8', 'b1', -1, 'For approval', 6, null, null, [['p16', 10], ['p17', 5], ['p18', 200], ['p19', 400], ['p20', 400]]],
      ['o12', 'k2', 'u8', 'u4', 'b1', 0, 'For approval', 7, null, null, [['p12', 8], ['p25', 12], ['p38', 48]]],
      ['o13', 'k11', 'u15', 'u15', 'b3', -1, 'For approval', 6, null, null, [['p1', 30], ['p27', 6]]],
      ['o14', 'k6', 'u9', 'u9', 'b1', 0, 'Draft', 7, null, null, [['p3', 10]]],
      ['o15', 'k10', 'u10', 'u10', 'b2', -6, 'Rejected', 1, 'u11', 'Rejected: two bounced cheques this quarter.', [['p7', 10]]]
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
        move(offset, it.product_id, o.branch_id, centennialArea(product(it.product_id)), 'Sale', -it.qty, o.order_no, 'u4');
      });
    });

    var trucks = [
      { id: 't1', name: 'Isuzu Elf', plate_no: 'NBC 1234' },
      { id: 't2', name: 'Mitsubishi Fuso Canter', plate_no: 'NDE 5678' }
    ];

    var drivers = [
      { id: 'd1', full_name: 'Rodel Santos', contact_no: '0917 555 0301' },
      { id: 'd2', full_name: 'Benjie Ocampo', contact_no: '0918 555 0302' },
      { id: 'd3', full_name: 'Nestor Villar', contact_no: '0919 555 0303' }
    ];

    // [id, order, schedule day, truck, driver, status, confirmed_by]
    var deliveries = [
      ['dl1', 'o1', -33, 't1', 'd1', 'Completed', 'u9'],
      ['dl2', 'o3', -13, 't1', 'd2', 'Completed', 'u8'],
      ['dl3', 'o4', -5, 't2', 'd3', 'Completed', 'u8'],
      ['dl4', 'o5', -2, 't1', 'd1', 'Shipped', null],
      ['dl5', 'o6', -1, 't2', 'd2', 'Shipped', null],
      ['dl6', 'o7', 2, 't1', 'd1', 'Scheduled', null],
      ['dl7', 'o8', 3, 't2', 'd3', 'Scheduled', null]
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
      ['ip1', 'o1', 93300, 3, 'Every 15 days', [[-30, 31100, 31100], [-15, 31100, 0], [0, 31100, 0]]],
      ['ip2', 'o5', 32780, 4, 'Weekly', [[3, 8195, 0], [10, 8195, 0], [17, 8195, 0], [24, 8195, 0]]],
      ['ip3', 'o6', 19040, 2, 'Monthly', [[-5, 9520, 9520], [25, 9520, 0]]]
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

    // [id, order, client, schedule, amount, method, reference, day, received_by, channel, verified_by, bounced]
    var payments = [
      ['pay1', 'o1', 'k3', 'is1', 31100, 'Cheque', 'BDO 004512', -30, 'u4', 'Office', 'u2', false],
      ['pay2', 'o3', 'k1', null, 5000, 'Cash', '', -3, 'u8', 'Field', null, false],
      ['pay3', 'o4', 'k2', null, 27900, 'Bank transfer', 'BPI-TRF-88213', -4, 'u5', 'Office', 'u2', false],
      ['pay4', 'o6', 'k8', 'is8', 9520, 'Cheque', 'Metrobank 117820', -5, 'u9', 'Field', 'u2', false],
      ['pay5', null, 'k10', null, 8000, 'Cheque', 'BDO 009931', -40, 'u10', 'Office', null, true]
    ].map(function (p) {
      return {
        id: p[0], order_id: p[1], client_id: p[2], schedule_id: p[3], amount: p[4], method: p[5], reference_no: p[6],
        date: day(p[7]), proof_photo: null, received_by: p[8], channel: p[9], verified_by: p[10], bounced: p[11]
      };
    });

    // [id, supplier, branch, day, status, payment status, approved_by, requested_by, lines [[product, qty in purchase unit, received, unit cost]]]
    var poRows = [
      ['po1', 's4', 'b1', -2, 'Ordered', 'Unpaid', 'u2', 'u4', [['p23', 1, 0, 26000]]],
      ['po2', 's2', 'b1', -12, 'Received', 'Paid', 'u2', 'u4', [['p8', 2, 2, 9500]]],
      ['po3', 's3', 'b1', -1, 'For approval', 'Unpaid', null, 'u3', [['p14', 5, 0, 3800], ['p15', 3, 0, 4300]]],
      ['po4', 's6', 'b1', -8, 'Received', 'Unpaid', 'u2', 'u4', [['p33', 1, 1, 1700]]]
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
    move(-10, 'p8', 'b1', 'a1', 'Receive', 20, 'PO-2026-0039', 'u4');
    move(-6, 'p33', 'b1', 'a3', 'Receive', 12, 'PO-2026-0041', 'u5');
    move(-5, 'p26', 'b1', 'a2', 'Adjust', -3, 'ADJ-0001', 'u4', 'Damaged');
    move(-4, 'p7', 'b1', 'a1', 'Transfer out', -10, 'TR-0001', 'u4', 'To I-KU');
    move(-3, 'p7', 'b2', 'a4', 'Transfer in', 10, 'TR-0001', 'u4', 'From Centennial');
    // Still in transit: ECK 888 has not confirmed it yet (demo for Receive)
    move(-1, 'p1', 'b1', 'a1', 'Transfer out', -20, 'TR-0002', 'u4', 'To ECK 888');

    var historyLogs = [
      { id: 'h1', datetime: at(-2, 9, 14), user_id: 'u2', branch_id: 'b1', action: 'Edit', module: 'Products & Inventory', record_type: 'products', record_id: 'p11', field: 'ceiling_qty', old_value: '50', new_value: '60' },
      { id: 'h2', datetime: at(-3, 10, 2), user_id: 'u2', branch_id: 'b1', action: 'Approve', module: 'Sales Orders & Deliveries', record_type: 'sales_orders', record_id: 'o2', field: 'status', old_value: 'For approval', new_value: 'Approved' },
      { id: 'h3', datetime: at(-5, 15, 40), user_id: 'u4', branch_id: 'b1', action: 'Stock change', module: 'Products & Inventory', record_type: 'stock_movements', record_id: 'ADJ-0001', field: 'qty_change', old_value: null, new_value: '-3 (Damaged)' },
      { id: 'h4', datetime: at(-30, 8, 5), user_id: 'u2', branch_id: 'b1', action: 'Edit', module: 'User Accounts & History Log', record_type: 'users', record_id: 'u16', field: 'is_active', old_value: 'Active', new_value: 'Inactive' },
      { id: 'h5', datetime: at(-21, 9, 30), user_id: 'u2', branch_id: 'b1', action: 'Create', module: 'User Accounts & History Log', record_type: 'users', record_id: 'u7', field: null, old_value: null, new_value: 'Dennis Garcia · Administrative / Warehouse Staff' },
      { id: 'h6', datetime: at(-6, 11, 20), user_id: 'u11', branch_id: 'b2', action: 'Reject', module: 'Sales Orders & Deliveries', record_type: 'sales_orders', record_id: 'o15', field: 'status', old_value: 'For approval', new_value: 'Rejected' },
      { id: 'h7', datetime: at(-4, 14, 0), user_id: 'u4', branch_id: 'b1', action: 'Stock change', module: 'Products & Inventory', record_type: 'stock_movements', record_id: 'TR-0001', field: 'qty_change', old_value: null, new_value: '-10 (To I-KU)' },
      { id: 'h8', datetime: at(-4, 16, 45), user_id: 'u2', branch_id: 'b1', action: 'Edit', module: 'Customer Accounts & Payments', record_type: 'clients', record_id: 'k3', field: 'credit_limit', old_value: '60000', new_value: '80000' },
      { id: 'h9', datetime: at(-3, 13, 15), user_id: 'u2', branch_id: 'b1', action: 'Approve', module: 'Customer Accounts & Payments', record_type: 'payments', record_id: 'pay4', field: 'verified_by', old_value: null, new_value: 'Maricel Santos' },
      { id: 'h10', datetime: at(-2, 8, 2), user_id: 'u2', branch_id: 'b1', action: 'Approve', module: 'Purchasing & Suppliers', record_type: 'purchase_orders', record_id: 'po1', field: 'status', old_value: 'For approval', new_value: 'Approved' },
      { id: 'h11', datetime: at(-1, 7, 58), user_id: 'u4', branch_id: 'b1', action: 'Login', module: 'User Accounts & History Log', record_type: 'users', record_id: 'u4', field: null, old_value: null, new_value: null },
      { id: 'h12', datetime: at(-1, 9, 40), user_id: 'u4', branch_id: 'b1', action: 'Create', module: 'Sales Orders & Deliveries', record_type: 'sales_orders', record_id: 'o11', field: null, old_value: null, new_value: 'SO-2026-0111' },
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
      product_supplier: productSupplier,
      storage: storage,
      stock_locations: stockLocations,
      stock_movements: movements,
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
