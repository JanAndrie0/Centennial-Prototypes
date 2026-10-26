/* 6.0 Generate Reports: the 9 reports of the 06 plan, each computed from the same mock data the modules use,
   so the numbers match (6.2 sales and payments, 6.3 inventory, 6.4 purchasing; 6.5 produces the view).

   Each report: { id, name, icon, desc, process, dates: true|false (false = "as of today"), freq, filters: [...], views: [...],
                  preset (default date range), run(f) → { tiles, chart, columns, rows, foot } }
   f = { from, to, branch ('all' or id), category, supplier, view, freq ('daily'|'weekly'|'monthly') }
   A cell is { t: text (CSV and default HTML), h: optional HTML, n: true for number columns }. */
(function (CNS) {
  'use strict';

  var S = CNS.store, fmt = CNS.format, esc = CNS.escape;
  var BILLED = ['Approved', 'For delivery', 'Shipped', 'Completed'];
  var ALLOCATING = ['Approved', 'For delivery'];

  // ---- helpers ----
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function localDay(datetime) { return /^\d{4}-\d{2}-\d{2}$/.test(datetime) ? datetime : iso(new Date(datetime)); }
  function inRange(day, f) { return day >= f.from && day <= f.to; }
  function inBranch(branchId, f) { return f.branch === 'all' || branchId === f.branch; }
  function sum(rows, fn) { return rows.reduce(function (t, r) { return t + fn(r); }, 0); }
  function userName(id) { var u = id && S.get('users', id); return u ? u.full_name : '—'; }
  function product(id) { return S.get('products', id); }
  function catName(id) { var c = S.get('categories', id); return c ? c.name : '—'; }
  function supName(id) { var s = S.get('suppliers', id); return s ? s.company_name : '—'; }
  function branchesIn(f) { return f.branch === 'all' ? S.all('branches').map(function (b) { return b.id; }) : [f.branch]; }
  function stocks(productId, branchId) {
    return S.where('stock_locations', function (l) {
      if (l.product_id !== productId) return false;
      var a = S.get('storage', l.area_id);
      return a && a.branch_id === branchId;
    }).length > 0;
  }
  function pct(n) { return Math.round(n * 100) + '%'; }

  function text(v) { return { t: v == null ? '—' : String(v) }; }
  function html(t, h) { return { t: t, h: h }; }
  function money(n) { return { t: fmt.money(n), n: true, v: n }; }
  function num(n) { return { t: fmt.number(n), n: true, v: n }; }
  function qty(n, unit) { return { t: fmt.qty(n, unit), n: true, v: n }; }
  function signed(n, unit) { return n ? { t: (n > 0 ? '+' : '') + fmt.qty(n, unit), n: true, v: n } : { t: '—', n: true, v: 0 }; }
  function date(d) { return { t: d ? fmt.date(d) : '—' }; }
  function badge(tone, icon, label) { return { t: label, h: CNS.ui.badge(tone, icon, label) }; }
  function productCell(p) { return html(p.name + ' (' + p.code + ')', '<span class="truncate" title="' + esc(p.name) + '">' + esc(p.name) + '</span><span class="cell-sub">' + esc(p.code) + '</span>'); }
  // under: on screen, show this column as a second line in the column before it (the CSV keeps it separate)
  function col(label, isNum, under) { return { label: label, n: !!isNum, under: !!under }; }

  // Period key and label for the Sales frequency (daily / weekly from Monday / monthly)
  function periodKey(day, freq) {
    var d = fmt.toDate(day);
    if (freq === 'monthly') return day.slice(0, 7);
    if (freq === 'weekly') { var w = new Date(d); w.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(w); }
    return day;
  }
  function periodLabel(key, freq, longForm) {
    if (freq === 'monthly') return fmt.toDate(key + '-01').toLocaleDateString('en-US', { month: longForm ? 'long' : 'short', year: 'numeric' });
    var d = fmt.toDate(key);
    var s = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return freq === 'weekly' ? (longForm ? 'Week of ' + fmt.date(key) : s) : (longForm ? fmt.date(key) : s);
  }
  function periods(f, freq) {
    var keys = [], d = fmt.toDate(f.from), end = fmt.toDate(f.to);
    while (d <= end) {
      var k = periodKey(iso(d), freq);
      if (keys.indexOf(k) < 0) keys.push(k);
      d.setDate(d.getDate() + 1);
    }
    return keys;
  }

  function billedOrders(f) {
    return S.where('sales_orders', function (o) {
      return BILLED.indexOf(o.status) >= 0 && inRange(o.order_date, f) && inBranch(o.branch_id, f) && (!f.agent || o.agent_id === f.agent);
    });
  }

  function ranked(map, fmtFn, limit) {
    return Object.keys(map).map(function (k) { return { label: k, value: map[k] }; })
      .sort(function (a, b) { return b.value - a.value; }).slice(0, limit || 10)
      .map(function (r) { r.display = fmtFn ? fmtFn(r.value) : undefined; return r; });
  }

  // ======================================================================
  var LIST = [

    // ---- 1. Sales (6.2) ----
    {
      id: 'sales', name: 'Sales report', icon: 'chart-bar', process: '6.2',
      desc: 'Sales per day, week or month; by agent, category, branch or product.',
      dates: true, freq: true, preset: 'month', filters: ['category', 'agent'],
      views: [['period', 'By period'], ['agent', 'By agent'], ['category', 'By category'], ['branch', 'By branch'], ['product', 'Top products']],
      run: function (f) {
        var orders = billedOrders(f);
        var ids = orders.map(function (o) { return o.id; });
        var lines = S.where('sales_order_items', function (it) {
          return ids.indexOf(it.order_id) >= 0 && (!f.category || product(it.product_id).category_id === f.category);
        });
        var byOrder = {};
        lines.forEach(function (it) { byOrder[it.order_id] = (byOrder[it.order_id] || 0) + it.qty * it.unit_price; });
        var counted = orders.filter(function (o) { return byOrder[o.id]; });
        var total = sum(lines, function (it) { return it.qty * it.unit_price; });
        var byCat = {};
        lines.forEach(function (it) { var k = catName(product(it.product_id).category_id); byCat[k] = (byCat[k] || 0) + it.qty * it.unit_price; });
        var topCat = ranked(byCat)[0];
        var tiles = [
          ['Total sales', fmt.money(total), fmt.date(f.from) + ' to ' + fmt.date(f.to)],
          ['Orders', fmt.number(counted.length), lines.length + ' product lines'],
          ['Average order', fmt.money(counted.length ? total / counted.length : 0), 'Per billed order'],
          ['Top category', topCat ? topCat.label : '—', topCat ? fmt.money(topCat.value) : 'No sales']
        ];
        var orderOf = {}; orders.forEach(function (o) { orderOf[o.id] = o; });
        var view = f.view || 'period';

        if (view === 'period') {
          var freq = f.freq || 'daily';
          var keys = periods(f, freq);
          var agg = {};
          keys.forEach(function (k) { agg[k] = { orders: {}, lines: 0, amount: 0 }; });
          lines.forEach(function (it) {
            var k = periodKey(orderOf[it.order_id].order_date, freq);
            if (!agg[k]) return;
            agg[k].orders[it.order_id] = 1; agg[k].lines++; agg[k].amount += it.qty * it.unit_price;
          });
          var todayKey = periodKey(S.today(), freq);
          var label = { daily: 'Sales per day', weekly: 'Sales per week', monthly: 'Sales per month' }[freq];
          return {
            tiles: tiles,
            chart: { kind: 'columns', title: label, label: label, format: fmt.money,
              rows: keys.map(function (k) { return { label: periodLabel(k, freq), title: periodLabel(k, freq, true), value: agg[k].amount, hi: k === todayKey }; }) },
            columns: [col(freq === 'daily' ? 'Date' : freq === 'weekly' ? 'Week' : 'Month'), col('Orders', true), col('Product lines', true), col('Sales', true)],
            rows: keys.filter(function (k) { return agg[k].lines; }).reverse().map(function (k) {
              return [text(periodLabel(k, freq, true)), num(Object.keys(agg[k].orders).length), num(agg[k].lines), money(agg[k].amount)];
            }),
            foot: [text('Total'), num(counted.length), num(lines.length), money(total)]
          };
        }

        // Grouped views: one row per agent / category / branch / product
        var groups = {};
        lines.forEach(function (it) {
          var o = orderOf[it.order_id], p = product(it.product_id), k, name;
          if (view === 'agent') { k = o.agent_id; name = userName(o.agent_id); }
          else if (view === 'category') { k = p.category_id; name = catName(p.category_id); }
          else if (view === 'branch') { k = o.branch_id; name = S.branchName(o.branch_id); }
          else { k = p.id; name = p.name; }
          var g = groups[k] = groups[k] || { name: name, orders: {}, qty: 0, unit: p.unit_id, amount: 0, p: p };
          g.orders[o.id] = 1; g.qty += it.qty; g.amount += it.qty * it.unit_price;
        });
        var list = Object.keys(groups).map(function (k) { return groups[k]; }).sort(function (a, b) { return b.amount - a.amount; });
        if (view === 'product') list = list.slice(0, 20);
        var title = { agent: 'Sales by agent', category: 'Sales by category', branch: 'Sales by branch', product: 'Top 10 products' }[view];
        return {
          tiles: tiles,
          chart: { kind: 'rows', title: title, label: title, format: fmt.money,
            rows: list.slice(0, 10).map(function (g) { return { label: g.name, value: g.amount }; }) },
          columns: view === 'product'
            ? [col('Product'), col('Category'), col('Orders', true), col('Qty sold', true), col('Sales', true), col('Share', true)]
            : [col({ agent: 'Agent', category: 'Category', branch: 'Branch' }[view]), col('Orders', true), col('Sales', true), col('Share', true)],
          rows: list.map(function (g) {
            var share = { t: total ? pct(g.amount / total) : '0%', n: true };
            return view === 'product'
              ? [productCell(g.p), text(catName(g.p.category_id)), num(Object.keys(g.orders).length), qty(g.qty, g.unit), money(g.amount), share]
              : [text(g.name), num(Object.keys(g.orders).length), money(g.amount), share];
          }),
          foot: view === 'product' ? null : [text('Total'), num(counted.length), money(total), { t: '100%', n: true }]
        };
      }
    },

    // ---- 2. Backorders (6.2 + 6.3) ----
    {
      id: 'backorders', name: 'Backorder report', icon: 'information-circle', process: '6.2',
      desc: 'Products with negative available stock, the orders waiting, and what is on order.',
      dates: false, filters: ['category'],
      run: function (f) {
        var rows = [];
        branchesIn(f).forEach(function (b) {
          S.all('products').forEach(function (p) {
            if (f.category && p.category_id !== f.category) return;
            var avail = S.available(p.id, b);
            if (avail >= 0) return;
            var waiting = S.where('sales_orders', function (o) {
              return ALLOCATING.indexOf(o.status) >= 0 && o.branch_id === b &&
                S.where('sales_order_items', function (it) { return it.order_id === o.id && it.product_id === p.id; }).length;
            });
            rows.push({ p: p, b: b, hand: S.onHand(p.id, b), alloc: S.allocated(p.id, b), avail: avail, onOrder: S.onOrder(p.id, b), waiting: waiting });
          });
        });
        rows.sort(function (a, b) { return a.avail - b.avail; });
        var covered = rows.filter(function (r) { return r.onOrder >= -r.avail; }).length;
        var orderIds = {};
        rows.forEach(function (r) { r.waiting.forEach(function (o) { orderIds[o.id] = 1; }); });
        return {
          tiles: [
            ['Backordered products', fmt.number(rows.length), 'As of ' + fmt.date(S.today())],
            ['Orders waiting', fmt.number(Object.keys(orderIds).length), 'Approved or for delivery'],
            ['Covered by supplier orders', fmt.number(covered), 'On order is enough'],
            ['Not yet ordered', fmt.number(rows.length - covered), rows.length - covered ? 'Make a purchase request' : 'Nothing to order']
          ],
          chart: { kind: 'rows', title: 'Short by product', label: 'Units short by product',
            rows: rows.slice(0, 10).map(function (r) { return { label: r.p.name + (f.branch === 'all' ? ' · ' + S.branchName(r.b) : ''), value: -r.avail, display: fmt.qty(-r.avail, r.p.unit_id) }; }) },
          columns: [col('Product'), col('Branch'), col('On hand', true), col('Reserved', true), col('Available', true), col('On order', true), col('Orders waiting')],
          rows: rows.map(function (r) {
            return [productCell(r.p), text(S.branchName(r.b)), qty(r.hand, r.p.unit_id), qty(r.alloc, r.p.unit_id),
              html(fmt.qty(r.avail, r.p.unit_id), '<span class="qty-neg">' + esc(fmt.qty(r.avail, r.p.unit_id)) + '</span> ' + CNS.ui.stockBadge('backordered')),
              qty(r.onOrder, r.p.unit_id),
              html(r.waiting.map(function (o) { return o.order_no; }).join(', '), r.waiting.map(function (o) {
                var c = S.get('clients', o.client_id);
                return '<a class="row-link nowrap" href="../orders/detail.html?id=' + encodeURIComponent(o.id) + '">' + esc(o.order_no) + '</a><span class="cell-sub">' + esc(c ? c.store_name : '') + '</span>';
              }).join(''))];
          }),
          foot: null
        };
      }
    },

    // ---- 3. Reorder (6.3) ----
    {
      id: 'reorder', name: 'Reorder report', icon: 'bell', process: '6.3',
      desc: 'Products at or below the reorder point or floor, with the suggested quantity and supplier.',
      dates: false, filters: ['category', 'supplier'],
      run: function (f) {
        var rows = [];
        branchesIn(f).forEach(function (b) {
          S.all('products').forEach(function (p) {
            if (f.category && p.category_id !== f.category) return;
            if (f.supplier && p.supplier_id !== f.supplier) return;
            var st = S.stockStatus(p.id, b);
            if (['backordered', 'below-floor', 'low'].indexOf(st) < 0) return;
            rows.push({ p: p, b: b, st: st, avail: S.available(p.id, b), onOrder: S.onOrder(p.id, b), sug: S.suggestedReorder(p.id, b) });
          });
        });
        var order = ['backordered', 'below-floor', 'low'];
        rows.sort(function (a, b) { return order.indexOf(a.st) - order.indexOf(b.st) || a.p.name.localeCompare(b.p.name); });
        var bySup = {};
        rows.forEach(function (r) { var k = supName(r.p.supplier_id); bySup[k] = (bySup[k] || 0) + 1; });
        var count = function (s) { return rows.filter(function (r) { return r.st === s; }).length; };
        return {
          tiles: [
            ['Products to reorder', fmt.number(rows.length), 'As of ' + fmt.date(S.today())],
            ['Backordered', fmt.number(count('backordered')), 'Available below zero'],
            ['Below floor', fmt.number(count('below-floor')), 'Under the minimum'],
            ['Suppliers to call', fmt.number(Object.keys(bySup).length), 'One request per supplier']
          ],
          chart: { kind: 'rows', title: 'Products to reorder by supplier', label: 'Products to reorder by supplier', format: function (n) { return n + (n === 1 ? ' product' : ' products'); },
            rows: ranked(bySup) },
          columns: [col('Product'), col('Branch', false, true), col('Status'), col('Available', true), col('Reorder point', true), col('Floor', true, true), col('Ceiling', true, true), col('On order', true), col('Suggested qty', true), col('Supplier')],
          rows: rows.map(function (r) {
            var u = r.p.unit_id;
            return [productCell(r.p), text(S.branchName(r.b)), { t: CNS.ui.stockBadge(r.st).replace(/<[^>]+>/g, ''), h: CNS.ui.stockBadge(r.st) },
              qty(r.avail, u), qty(r.p.critical_qty, u), qty(r.p.floor_qty, u), qty(r.p.ceiling_qty, u), qty(r.onOrder, u),
              html(fmt.qty(r.sug, u), '<strong>' + esc(fmt.qty(r.sug, u)) + '</strong>'), text(supName(r.p.supplier_id))];
          }),
          foot: null
        };
      }
    },

    // ---- 4. Inventory Summary (6.3; Zoho "frequency-based": daily, weekly, monthly) ----
    {
      id: 'inventory', name: 'Inventory Summary', icon: 'cube', process: '6.3',
      desc: 'Opening, sold, received, adjusted, transferred and closing stock per product.',
      dates: true, periodPresets: true, preset: 'month', filters: ['category'],
      run: function (f) {
        var moves = S.where('stock_movements', function (m) { return inBranch(m.branch_id, f); });
        var rows = [];
        var typeCount = { 'Sale': 0, 'Receive': 0, 'Adjust': 0, 'Count': 0, 'Transfer out': 0, 'Transfer in': 0 };
        S.all('products').forEach(function (p) {
          if (f.category && p.category_id !== f.category) return;
          var r = { p: p, opening: 0, sold: 0, received: 0, adjusted: 0, transferred: 0, any: false };
          moves.forEach(function (m) {
            if (m.product_id !== p.id) return;
            var day = localDay(m.datetime);
            if (day < f.from) { r.opening += m.qty_change; r.any = true; return; }
            if (day > f.to) return;
            r.any = true;
            typeCount[m.type] = (typeCount[m.type] || 0) + 1;
            if (m.type === 'Sale') r.sold += m.qty_change;
            else if (m.type === 'Receive') r.received += m.qty_change;
            else if (m.type === 'Adjust' || m.type === 'Count') r.adjusted += m.qty_change;
            else r.transferred += m.qty_change;
          });
          if (!r.any) return;
          r.closing = r.opening + r.sold + r.received + r.adjusted + r.transferred;
          r.available = S.available(p.id, f.branch);
          rows.push(r);
        });
        rows.sort(function (a, b) { return a.p.name.localeCompare(b.p.name); });
        var moved = rows.filter(function (r) { return r.sold || r.received || r.adjusted || r.transferred; }).length;
        return {
          tiles: [
            ['Products', fmt.number(rows.length), moved + ' with movement in the period'],
            ['Sales out', fmt.number(typeCount['Sale']), 'Stock movements'],
            ['Received', fmt.number(typeCount['Receive']), 'Supplier deliveries'],
            ['Adjustments and transfers', fmt.number(typeCount['Adjust'] + typeCount['Count'] + typeCount['Transfer out'] + typeCount['Transfer in']), 'Counts, damage, moves']
          ],
          chart: { kind: 'rows', title: 'Stock movements in the period', label: 'Stock movements by type', format: function (n) { return n + (n === 1 ? ' entry' : ' entries'); },
            rows: Object.keys(typeCount).map(function (k) { return { label: k, value: typeCount[k] }; }) },
          columns: [col('Product'), col('Opening', true), col('Sold', true), col('Received', true), col('Adjusted', true), col('Transferred', true), col('Closing', true), col('Available now', true)],
          rows: rows.map(function (r) {
            var u = r.p.unit_id;
            return [productCell(r.p), qty(r.opening, u), signed(r.sold, u), signed(r.received, u), signed(r.adjusted, u), signed(r.transferred, u),
              html(fmt.qty(r.closing, u), '<strong>' + esc(fmt.qty(r.closing, u)) + '</strong>'),
              r.available < 0 ? html(fmt.qty(r.available, u) + ' Backordered', '<span class="qty-neg">' + esc(fmt.qty(r.available, u)) + '</span>') : qty(r.available, u)];
          }),
          foot: null
        };
      }
    },

    // ---- 5. Fast- and slow-moving products (6.3; SDG 12) ----
    {
      id: 'movers', name: 'Fast- and slow-moving products', icon: 'arrow-up-circle', process: '6.3',
      desc: 'Products ranked by how much of their ceiling sold. Slow means no sales in the period.',
      dates: true, preset: 'last30', filters: ['category'],
      views: [['all', 'All products'], ['fast', 'Fast movers'], ['slow', 'Slow movers']],
      run: function (f) {
        var rows = [];
        var branches = branchesIn(f);
        S.all('products').forEach(function (p) {
          if (f.category && p.category_id !== f.category) return;
          if (!branches.some(function (b) { return stocks(p.id, b); })) return;
          var sales = S.where('stock_movements', function (m) { return m.product_id === p.id && m.type === 'Sale' && inBranch(m.branch_id, f); });
          var sold = -sum(sales.filter(function (m) { return inRange(localDay(m.datetime), f); }), function (m) { return m.qty_change; });
          var last = sales.map(function (m) { return localDay(m.datetime); }).filter(function (d) { return d <= f.to; }).sort().pop() || null;
          var share = p.ceiling_qty ? sold / p.ceiling_qty : 0;
          // Same rule as the 3.0 filter (store.mover): fast = at least 20% of the ceiling sold, slow = none sold
          var kind = sold === 0 ? 'slow' : share >= 0.2 ? 'fast' : null;
          rows.push({ p: p, sold: sold, share: share, last: last, days: null, hand: S.onHand(p.id, f.branch), kind: kind });
        });
        rows.forEach(function (r) { r.days = r.last ? Math.round((fmt.toDate(f.to) - fmt.toDate(r.last)) / 86400000) : null; });
        rows.sort(function (a, b) { return b.share - a.share || (b.days || 9999) - (a.days || 9999); });
        var fast = rows.filter(function (r) { return r.kind === 'fast'; }), slow = rows.filter(function (r) { return r.kind === 'slow'; });
        var shown = f.view === 'fast' ? fast : f.view === 'slow' ? slow : rows;
        return {
          tiles: [
            ['Fast movers', fmt.number(fast.length), '20% of the ceiling or more sold'],
            ['Slow movers', fmt.number(slow.length), 'Nothing sold in the period'],
            ['Never sold yet', fmt.number(rows.filter(function (r) { return !r.last; }).length), 'No sale on record'],
            ['Top mover', rows[0] && rows[0].sold ? rows[0].p.name : '—', rows[0] && rows[0].sold ? pct(rows[0].share) + ' of the ceiling' : 'No sales']
          ],
          chart: { kind: 'rows', title: 'Top 10 by share of ceiling sold', label: 'Top products by share of ceiling sold', format: pct,
            rows: rows.filter(function (r) { return r.sold; }).slice(0, 10).map(function (r) { return { label: r.p.name, value: r.share, display: pct(r.share) + ' · ' + fmt.qty(r.sold, r.p.unit_id), hi: r.kind === 'fast' }; }) },
          columns: [col('Rank', true), col('Product'), col('Sold', true), col('Share of ceiling', true), col('On hand', true), col('Last sale'), col('Days since', true), col('Movement')],
          rows: shown.map(function (r) {
            return [num(rows.indexOf(r) + 1), productCell(r.p), qty(r.sold, r.p.unit_id), { t: pct(r.share), n: true }, qty(r.hand, r.p.unit_id),
              date(r.last), r.days == null ? { t: '—', n: true } : num(r.days),
              r.kind === 'fast' ? badge('success', 'arrow-up-circle', 'Fast') : r.kind === 'slow' ? badge('warning', 'no-symbol', 'Slow') : text('Steady')];
          }),
          foot: null
        };
      }
    },

    // ---- 6. Stock adjustments (6.3) ----
    {
      id: 'adjustments', name: 'Stock adjustment report', icon: 'pencil-square', process: '6.3',
      desc: 'Adjustments and stock counts, with the reason and who recorded them.',
      dates: true, preset: 'month', filters: ['category'],
      run: function (f) {
        var list = S.where('stock_movements', function (m) {
          return (m.type === 'Adjust' || m.type === 'Count') && inBranch(m.branch_id, f) && inRange(localDay(m.datetime), f) &&
            (!f.category || product(m.product_id).category_id === f.category);
        }).sort(function (a, b) { return a.datetime < b.datetime ? 1 : -1; });
        var byReason = {};
        list.forEach(function (m) { var k = m.reason || (m.type === 'Count' ? 'Stock count' : 'No reason'); byReason[k] = (byReason[k] || 0) + 1; });
        var top = ranked(byReason)[0];
        return {
          tiles: [
            ['Entries', fmt.number(list.length), fmt.date(f.from) + ' to ' + fmt.date(f.to)],
            ['Stock added', fmt.number(list.filter(function (m) { return m.qty_change > 0; }).length), 'Entries that raised stock'],
            ['Stock removed', fmt.number(list.filter(function (m) { return m.qty_change < 0; }).length), 'Entries that lowered stock'],
            ['Most common reason', top ? top.label : '—', top ? top.value + (top.value === 1 ? ' entry' : ' entries') : 'No entries']
          ],
          chart: { kind: 'rows', title: 'Entries by reason', label: 'Adjustments by reason', format: function (n) { return n + (n === 1 ? ' entry' : ' entries'); }, rows: ranked(byReason) },
          columns: [col('Date'), col('Ref'), col('Product'), col('Branch and area'), col('Type'), col('Change', true), col('Reason'), col('Recorded by')],
          rows: list.map(function (m) {
            var p = product(m.product_id), a = S.get('storage', m.area_id);
            return [text(fmt.dateTime(m.datetime)), text(m.ref), productCell(p), text(S.branchName(m.branch_id) + (a ? ' · ' + a.name : '')),
              text(m.type), signed(m.qty_change, p.unit_id), text(m.reason || '—'), text(userName(m.user_id))];
          }),
          foot: null
        };
      }
    },

    // ---- 7. Deliveries (6.2) ----
    {
      id: 'deliveries', name: 'Delivery report', icon: 'arrow-right-start-on-rectangle', process: '6.2',
      desc: 'Deliveries by date, truck and driver, with shipped and completed dates.',
      dates: true, preset: 'month', filters: [],
      run: function (f) {
        var list = S.where('deliveries', function (d) {
          var o = S.get('sales_orders', d.order_id);
          return o && inBranch(o.branch_id, f) && inRange(d.schedule_date, f);
        }).sort(function (a, b) { return a.schedule_date < b.schedule_date ? 1 : -1; });
        var count = function (s) { return list.filter(function (d) { return d.status === s; }).length; };
        var trucks = {};
        list.forEach(function (d) { trucks[d.truck_id] = 1; });
        var keys = periods(f, 'daily'), per = {};
        keys.forEach(function (k) { per[k] = 0; });
        list.forEach(function (d) { if (per[d.schedule_date] != null) per[d.schedule_date]++; });
        var today = S.today();
        return {
          tiles: [
            ['Deliveries', fmt.number(list.length), fmt.date(f.from) + ' to ' + fmt.date(f.to)],
            ['Scheduled', fmt.number(count('Scheduled')), 'Not yet out'],
            ['On the way', fmt.number(count('Shipped')), 'Waiting for the agent to confirm'],
            ['Completed', fmt.number(count('Completed')), Object.keys(trucks).length + (Object.keys(trucks).length === 1 ? ' truck used' : ' trucks used')]
          ],
          chart: { kind: 'columns', title: 'Deliveries per day', label: 'Deliveries per day', format: function (n) { return n + (n === 1 ? ' delivery' : ' deliveries'); },
            rows: keys.map(function (k) { return { label: periodLabel(k, 'daily'), title: fmt.date(k), value: per[k], hi: k === today }; }) },
          columns: [col('Date'), col('Order'), col('Customer'), col('Truck'), col('Driver'), col('Status'), col('Shipped'), col('Completed'), col('Confirmed by')],
          rows: list.map(function (d) {
            var o = S.get('sales_orders', d.order_id), c = S.get('clients', o.client_id), t = S.get('trucks', d.truck_id), dr = S.get('drivers', d.driver_id);
            var st = { 'Scheduled': ['neutral', 'clipboard-document-list'], 'Shipped': ['info', 'arrow-right-start-on-rectangle'], 'Completed': ['success', 'check-circle'] }[d.status] || ['neutral', 'information-circle'];
            return [date(d.schedule_date), html(o.order_no, '<a class="row-link nowrap" href="../deliveries/detail.html?id=' + encodeURIComponent(d.id) + '">' + esc(o.order_no) + '</a>'),
              text(c ? c.store_name : '—'), text(t ? t.name + ' · ' + t.plate_no : '—'), text(dr ? dr.full_name : '—'), badge(st[0], st[1], d.status),
              text(d.shipped_at ? fmt.dateTime(d.shipped_at) : '—'), text(d.completed_at ? fmt.dateTime(d.completed_at) : '—'), text(d.confirmed_by ? userName(d.confirmed_by) : '—')];
          }),
          foot: null
        };
      }
    },

    // ---- 8. Purchase orders and payables (6.4) ----
    {
      id: 'purchasing', name: 'Purchase order and payables report', icon: 'shopping-cart', process: '6.4',
      desc: 'Purchase orders by supplier and status, and what is still unpaid.',
      dates: true, preset: 'month', filters: ['supplier'],
      views: [['all', 'All purchase orders'], ['unpaid', 'Unpaid only']],
      run: function (f) {
        var total = function (po) { return sum(S.where('purchase_order_items', function (it) { return it.po_id === po.id; }), function (it) { return it.qty_ordered * (it.unit_cost || 0); }); };
        var owed = function (po) { return po.payment_status === 'Unpaid' && ['Ordered', 'Partially received', 'Received'].indexOf(po.status) >= 0; };
        var list = S.where('purchase_orders', function (po) {
          return po.status !== 'Draft' && inBranch(po.branch_id, f) && inRange(po.date, f) && (!f.supplier || po.supplier_id === f.supplier) && (f.view !== 'unpaid' || owed(po));
        }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
        var live = list.filter(function (po) { return po.status !== 'Rejected'; });
        var bySup = {};
        live.forEach(function (po) { var k = supName(po.supplier_id); bySup[k] = (bySup[k] || 0) + total(po); });
        var all = sum(live, total), unpaid = sum(live.filter(owed), total), paid = sum(live.filter(function (po) { return po.payment_status === 'Paid'; }), total);
        var badgeFor = CNS.poActions ? CNS.poActions.statusBadge : function (s) { return esc(s); };
        var payFor = CNS.poActions ? CNS.poActions.paymentBadge : function (s) { return esc(s); };
        return {
          tiles: [
            ['Purchase orders', fmt.number(live.length), list.length - live.length ? (list.length - live.length) + ' rejected not counted' : fmt.date(f.from) + ' to ' + fmt.date(f.to)],
            ['Total ordered', fmt.money(all), 'At supplier cost'],
            ['Unpaid payables', fmt.money(unpaid), 'Ordered or received, not paid'],
            ['Paid', fmt.money(paid), 'Verified by the Office Manager']
          ],
          chart: { kind: 'rows', title: 'Ordered by supplier', label: 'Purchase order totals by supplier', format: fmt.money, rows: ranked(bySup) },
          columns: [col('PO no.'), col('Date'), col('Supplier'), col('Branch'), col('Status'), col('Payment'), col('Total', true)],
          rows: list.map(function (po) {
            return [html(po.po_no, '<a class="row-link nowrap" href="../purchasing/detail.html?id=' + encodeURIComponent(po.id) + '">' + esc(po.po_no) + '</a>'),
              date(po.date), text(supName(po.supplier_id)), text(S.branchName(po.branch_id)),
              html(po.status, badgeFor(po.status)), html(po.payment_status, payFor(po.payment_status)), money(total(po))];
          }),
          foot: [text('Total'), text(''), text(''), text(''), text(''), text(''), money(all)]
        };
      }
    },

    // ---- 9. Payments and receivables (6.2 + 5.0 receivables data) ----
    {
      id: 'payments', name: 'Payments and receivables report', icon: 'banknotes', process: '6.2',
      desc: 'Collections by date and channel, and receivables aging (current, 30, 60, 90+ days).',
      dates: true, preset: 'month', filters: [],
      views: [['collections', 'Collections'], ['aging', 'Receivables aging']],
      run: function (f) {
        var P = CNS.payActions;
        var clientsIn = S.where('clients', function (c) { return inBranch(c.branch_id, f); });
        var ids = clientsIn.map(function (c) { return c.id; });
        var agingRows = clientsIn.map(function (c) { return { c: c, a: P.aging(c.id) }; }).filter(function (x) { return x.a.total !== 0; })
          .sort(function (a, b) { return b.a.total - a.a.total; });
        var receivable = sum(agingRows, function (x) { return x.a.total; });
        var overdue = sum(agingRows, function (x) { return x.a.d30 + x.a.d60 + x.a.d90 + x.a.d90p; });

        if (f.view === 'aging') {
          var keys = ['current', 'd30', 'd60', 'd90', 'd90p', 'total'];
          var tot = {};
          keys.forEach(function (k) { tot[k] = sum(agingRows, function (x) { return x.a[k]; }); });
          return {
            tiles: [
              ['Total receivables', fmt.money(receivable), 'As of ' + fmt.date(S.today())],
              ['Current', fmt.money(tot.current), 'Not yet due'],
              ['Overdue', fmt.money(overdue), 'Late installments'],
              ['Over 90 days', fmt.money(tot.d90p), 'Hardest to collect']
            ],
            chart: { kind: 'rows', title: 'Receivables by age', label: 'Receivables by age', format: fmt.money,
              rows: [['Current', 'current'], ['1–30 days', 'd30'], ['31–60 days', 'd60'], ['61–90 days', 'd90'], ['Over 90 days', 'd90p']].map(function (b) {
                return { label: b[0], value: tot[b[1]], hi: b[1] !== 'current' }; }) },
            columns: [col('Customer'), col('Current', true), col('1–30 days', true), col('31–60 days', true), col('61–90 days', true), col('Over 90 days', true), col('Total', true)],
            rows: agingRows.map(function (x) {
              return [html(x.c.store_name, '<a class="row-link" href="../customers/detail.html?id=' + encodeURIComponent(x.c.id) + '">' + esc(x.c.store_name) + '</a>')]
                .concat(keys.map(function (k) { return money(x.a[k]); }));
            }),
            foot: [text('Total')].concat(keys.map(function (k) { return money(tot[k]); })),
            asOf: true
          };
        }

        var list = S.where('payments', function (p) { return ids.indexOf(p.client_id) >= 0 && inRange(p.date, f); })
          .sort(function (a, b) { return a.date < b.date ? 1 : -1; });
        var counted = list.filter(P.counted), waiting = list.filter(P.pending), bad = list.filter(function (p) { return p.bounced; });
        var collected = sum(counted, function (p) { return p.amount; });
        var days = periods(f, 'daily'), per = {};
        days.forEach(function (k) { per[k] = 0; });
        counted.forEach(function (p) { if (per[p.date] != null) per[p.date] += p.amount; });
        var today = S.today();
        var field = sum(counted.filter(function (p) { return p.channel === 'Field'; }), function (p) { return p.amount; });
        return {
          tiles: [
            ['Collected', fmt.money(collected), counted.length + ' payments · ' + fmt.money(field) + ' from the field'],
            ['Waiting for verification', fmt.money(sum(waiting, function (p) { return p.amount; })), waiting.length + (waiting.length === 1 ? ' field payment' : ' field payments')],
            ['Bounced or rejected', fmt.money(sum(bad, function (p) { return p.amount; })), bad.length + (bad.length === 1 ? ' payment' : ' payments')],
            ['Overdue receivables', fmt.money(overdue), 'Of ' + fmt.money(receivable) + ' owed today']
          ],
          chart: { kind: 'columns', title: 'Collections per day', label: 'Verified collections per day', format: fmt.money,
            rows: days.map(function (k) { return { label: periodLabel(k, 'daily'), title: fmt.date(k), value: per[k], hi: k === today }; }) },
          columns: [col('Date'), col('Receipt no.'), col('Customer'), col('Order'), col('Method'), col('Channel'), col('Status'), col('Amount', true)],
          rows: list.map(function (p) {
            var c = S.get('clients', p.client_id), o = p.order_id && S.get('sales_orders', p.order_id);
            return [date(p.date), html(P.receiptNo(p), '<a class="row-link nowrap" href="../payments/receipt.html?id=' + encodeURIComponent(p.id) + '">' + esc(P.receiptNo(p)) + '</a>'),
              text(c ? c.store_name : '—'), text(o ? o.order_no : '—'), text(p.method + (p.reference_no ? ' · ' + p.reference_no : '')), text(p.channel),
              html(p.bounced ? 'Bounced' : p.verified_by ? 'Verified' : 'For verification', P.statusBadge(p)), money(p.amount)];
          }),
          foot: [text('Collected (verified)'), text(''), text(''), text(''), text(''), text(''), text(''), money(collected)]
        };
      }
    }
  ];

  // Date range presets (6.1: report type and date range)
  function presetRange(preset) {
    var t = fmt.toDate(S.today()), from = new Date(t);
    if (preset === 'week') from.setDate(t.getDate() - ((t.getDay() + 6) % 7));
    else if (preset === 'month') from.setDate(1);
    else if (preset === 'last30') from.setDate(t.getDate() - 29);
    else if (preset === 'last90') from.setDate(t.getDate() - 89);
    return { from: iso(from), to: iso(t) };
  }

  CNS.reports = {
    LIST: LIST,
    get: function (id) { return LIST.filter(function (r) { return r.id === id; })[0] || null; },
    presetRange: presetRange,
    PRESETS: [['today', 'Today'], ['week', 'This week'], ['month', 'This month'], ['last30', 'Last 30 days'], ['last90', 'Last 90 days'], ['custom', 'Custom dates']],
    // Inventory Summary reads the frequency as the period itself (daily = today, weekly = this week, monthly = this month)
    PERIOD_PRESETS: [['today', 'Daily (today)'], ['week', 'Weekly (this week)'], ['month', 'Monthly (this month)'], ['custom', 'Custom dates']]
  };
})(window.CNS);
