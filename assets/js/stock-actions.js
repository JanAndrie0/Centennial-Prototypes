/* 3.2 Update Stock Levels: Adjust, Transfer and Receive dialogs (03 plan step 5).
   Every action writes stock_movements (stock is never stored, ADR-003) and a History Log entry.
   Transfers between branches are Sent → Received (user decision, Oct 25); moves inside one branch happen at once.

   CNS.stockActions.adjust({ session, productId, onDone })
   CNS.stockActions.transfer({ session, productId?, onDone })     productId omitted → pick a product in the dialog
   CNS.stockActions.receive({ session, transfer, onDone })        transfer from CNS.store.transfers() */
(function (CNS) {
  'use strict';

  var S = CNS.store;
  var fmt = CNS.format;
  var esc = CNS.escape;
  var MODULE = 'Products & Inventory';
  var REASONS = ['Damaged', 'Count correction', 'Customer return', 'Found / misplaced stock', 'Other'];

  // Storage areas this user may act on: management follows the header branch, others their own branch
  function areasFor(session) {
    var sc = CNS.auth.canSwitchBranch(session.user) ? session.branchView : session.user.branch_id;
    return S.where('storage', function (a) { return sc === 'all' || a.branch_id === sc; });
  }

  function areaLabel(a) { return S.branchName(a.branch_id) + ' · ' + a.name; }

  function stockedIn(productId, areaId) {
    return S.where('stock_locations', function (l) { return l.product_id === productId && l.area_id === areaId; }).length > 0;
  }

  function move(m) {
    m.datetime = new Date().toISOString();
    return S.insert('stock_movements', m);
  }

  function logMove(ref, text) {
    CNS.history.log({ action: 'Stock change', module: MODULE, record_type: 'stock_movements', record_id: ref, field: 'qty_change', new_value: text });
  }

  function signed(n, unitId) { return (n > 0 ? '+' : '') + fmt.qty(n, unitId); }

  // ---- Dialog shell: title, body fields, Cancel + one primary button ----
  function dialog(opts) {
    var d = document.createElement('dialog');
    d.className = 'modal modal--form';
    d.setAttribute('aria-labelledby', 'sa-title');
    d.innerHTML =
      CNS.icon(opts.icon, 'modal__icon') +
      '<h2 class="modal__title" id="sa-title">' + esc(opts.title) + '</h2>' +
      (opts.lede ? '<p class="modal__body">' + esc(opts.lede) + '</p>' : '') +
      '<form novalidate>' + opts.body +
        '<div class="modal__actions"><button type="button" class="btn btn--secondary" data-cancel>Cancel</button>' +
        '<button type="submit" class="btn btn--primary">' + esc(opts.submit) + '</button></div>' +
      '</form>';
    var opener = document.activeElement;
    document.body.appendChild(d);
    d.addEventListener('close', function () {
      d.remove();
      if (opener && document.contains(opener)) opener.focus();
    });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.querySelector('[data-cancel]').addEventListener('click', function () { d.close(); });
    d.q = function (sel) { return d.querySelector(sel); };
    d.setError = function (id, msg) {
      var el = d.q('#' + id);
      d.q('#' + id + '-error').textContent = msg || '';
      if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
      return !msg;
    };
    d.firstInvalid = function () { var el = d.q('[aria-invalid="true"]'); if (el) el.focus(); };
    d.showModal();
    return d;
  }

  function field(id, label, control) {
    return '<div class="field"><label class="label" for="' + id + '">' + label + '</label>' + control +
      '<p class="field-error" id="' + id + '-error"></p></div>';
  }

  function wholePositive(v) { return /^\d+$/.test(v) && Number(v) > 0; }

  CNS.stockActions = {
    // ---- Adjust: + or − in one area, with a reason ----
    adjust: function (opts) {
      var p = S.get('products', opts.productId);
      var areas = areasFor(opts.session).filter(function (a) { return stockedIn(p.id, a.id); });
      if (!areas.length) {
        CNS.ui.confirm({ title: 'Not stocked here', body: p.name + ' isn\'t kept in any storage area you can adjust. Add a storage area in Edit product first.', confirm: 'OK', icon: 'information-circle', alertOnly: true });
        return;
      }
      var unit = fmt.unit(p.unit_id, 2);
      var d = dialog({
        icon: 'pencil-square', title: 'Adjust stock', lede: p.name, submit: 'Save adjustment',
        body:
          field('sa-area', 'Storage area', '<select class="input" id="sa-area" aria-describedby="sa-area-error sa-now">' +
            areas.map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(areaLabel(a)) + '</option>'; }).join('') + '</select>') +
          '<fieldset class="check-list field"><legend>Change</legend>' +
            '<label class="check-row"><input type="radio" name="dir" value="remove" checked> Remove from stock</label>' +
            '<label class="check-row"><input type="radio" name="dir" value="add"> Add to stock</label></fieldset>' +
          field('sa-qty', 'Quantity (' + esc(unit) + ')', '<input class="input" id="sa-qty" type="number" inputmode="numeric" min="1" step="1" aria-describedby="sa-qty-error sa-now">') +
          '<p class="notice notice--info" id="sa-now" aria-live="polite"></p>' +
          field('sa-reason', 'Reason', '<select class="input" id="sa-reason" aria-describedby="sa-reason-error"><option value="">Choose a reason</option>' +
            REASONS.map(function (r) { return '<option>' + esc(r) + '</option>'; }).join('') + '</select>') +
          field('sa-note', 'Note <span class="main-tag">(needed for Other)</span>', '<input class="input" id="sa-note" autocomplete="off" aria-describedby="sa-note-error">')
      });

      function preview() {
        var have = S.areaOnHand(p.id, d.q('#sa-area').value);
        var n = Number(d.q('#sa-qty').value) || 0;
        var sign = d.q('input[name="dir"]:checked').value === 'add' ? 1 : -1;
        d.q('#sa-now').innerHTML = CNS.icon('information-circle') + '<span>In this area now: ' + esc(fmt.qty(have, p.unit_id)) +
          (n ? ' → after: ' + esc(fmt.qty(have + sign * n, p.unit_id)) : '') + '</span>';
      }
      ['#sa-area', '#sa-qty'].forEach(function (s) { d.q(s).addEventListener('input', preview); });
      Array.prototype.forEach.call(d.querySelectorAll('input[name="dir"]'), function (r) { r.addEventListener('change', preview); });
      preview();
      d.q('#sa-area').focus();

      d.q('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var areaId = d.q('#sa-area').value;
        var qty = d.q('#sa-qty').value;
        var add = d.q('input[name="dir"]:checked').value === 'add';
        var reason = d.q('#sa-reason').value;
        var note = d.q('#sa-note').value.trim();
        var have = S.areaOnHand(p.id, areaId);
        var ok = [
          d.setError('sa-area', ''),
          d.setError('sa-qty', !wholePositive(qty) ? 'Enter a whole number above 0.'
            : !add && Number(qty) > have ? 'Only ' + fmt.qty(have, p.unit_id) + ' are in this area.' : ''),
          d.setError('sa-reason', reason ? '' : 'Choose a reason.'),
          d.setError('sa-note', reason === 'Other' && !note ? 'Say what happened.' : '')
        ];
        if (ok.indexOf(false) >= 0) { d.firstInvalid(); return; }

        var area = S.get('storage', areaId);
        var change = (add ? 1 : -1) * Number(qty);
        var ref = S.nextRef('ADJ');
        var why = reason + (note ? ': ' + note : '');
        move({ product_id: p.id, branch_id: area.branch_id, area_id: areaId, type: 'Adjust', qty_change: change, ref: ref, user_id: opts.session.user.id, reason: why });
        logMove(ref, p.name + ' ' + signed(change, p.unit_id) + ' · ' + areaLabel(area) + ' (' + why + ')');
        d.close();
        CNS.ui.toast('Stock adjusted: ' + signed(change, p.unit_id) + ', ' + area.name + '.');
        if (opts.onDone) opts.onDone();
      });
    },

    // ---- Transfer: another area in the same branch (instant) or another branch (Sent → Received) ----
    transfer: function (opts) {
      var fixed = opts.productId ? S.get('products', opts.productId) : null;
      var fromAreas = areasFor(opts.session);
      var products = S.all('products').slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
      var d = dialog({
        icon: 'arrow-path', title: 'Transfer stock', lede: fixed ? fixed.name : 'Move stock to another storage area or branch.', submit: 'Transfer',
        body:
          (fixed ? '' : field('sa-product', 'Product', '<input class="input" id="sa-product" list="sa-products" autocomplete="off" placeholder="Type a name or code" aria-describedby="sa-product-error">' +
            '<datalist id="sa-products">' + products.map(function (p) { return '<option value="' + esc(p.code + ' — ' + p.name) + '">'; }).join('') + '</datalist>')) +
          field('sa-from', 'From', '<select class="input" id="sa-from" aria-describedby="sa-from-error sa-now"></select>') +
          '<p class="notice notice--info" id="sa-now" aria-live="polite"></p>' +
          field('sa-to-branch', 'To branch', '<select class="input" id="sa-to-branch" aria-describedby="sa-to-branch-error">' +
            S.all('branches').map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.short_name) + '</option>'; }).join('') + '</select>') +
          '<div id="sa-to-area-wrap">' + field('sa-to-area', 'To storage area', '<select class="input" id="sa-to-area" aria-describedby="sa-to-area-error"></select>') + '</div>' +
          field('sa-qty', 'Quantity', '<input class="input" id="sa-qty" type="number" inputmode="numeric" min="1" step="1" aria-describedby="sa-qty-error">')
      });

      function product() {
        if (fixed) return fixed;
        var v = d.q('#sa-product').value.trim().toLowerCase();
        return products.filter(function (p) { return (p.code + ' — ' + p.name).toLowerCase() === v || p.code.toLowerCase() === v; })[0] || null;
      }

      function refresh() {
        var p = product();
        var keep = d.q('#sa-from').value;
        // Only areas that actually hold some of it
        var options = p ? fromAreas.filter(function (a) { return S.areaOnHand(p.id, a.id) > 0; }) : [];
        d.q('#sa-from').innerHTML = options.length
          ? options.map(function (a) { return '<option value="' + esc(a.id) + '"' + (a.id === keep ? ' selected' : '') + '>' + esc(areaLabel(a)) + '</option>'; }).join('')
          : '<option value="">' + (p ? 'No stock in your areas' : 'Choose a product first') + '</option>';
        var from = S.get('storage', d.q('#sa-from').value);
        if (from && !d.q('#sa-to-branch').dataset.touched) d.q('#sa-to-branch').value = from.branch_id;
        var sameBranch = from && d.q('#sa-to-branch').value === from.branch_id;
        d.q('#sa-to-area-wrap').hidden = !sameBranch;
        if (sameBranch) {
          var keepTo = d.q('#sa-to-area').value;
          d.q('#sa-to-area').innerHTML = S.where('storage', function (a) { return a.branch_id === from.branch_id && a.id !== from.id; })
            .map(function (a) { return '<option value="' + esc(a.id) + '"' + (a.id === keepTo ? ' selected' : '') + '>' + esc(a.name) + '</option>'; }).join('');
        }
        d.q('#sa-now').innerHTML = p && from
          ? CNS.icon('information-circle') + '<span>In ' + esc(from.name) + ' now: ' + esc(fmt.qty(S.areaOnHand(p.id, from.id), p.unit_id)) +
            (sameBranch ? '' : '. The other branch confirms when it arrives.') + '</span>'
          : '';
        d.q('#sa-now').hidden = !(p && from);
      }

      if (!fixed) d.q('#sa-product').addEventListener('input', refresh);
      d.q('#sa-from').addEventListener('change', refresh);
      d.q('#sa-to-branch').addEventListener('change', function () { d.q('#sa-to-branch').dataset.touched = '1'; refresh(); });
      refresh();
      (fixed ? d.q('#sa-from') : d.q('#sa-product')).focus();

      d.q('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var p = product();
        var from = S.get('storage', d.q('#sa-from').value);
        var toBranch = d.q('#sa-to-branch').value;
        var sameBranch = from && toBranch === from.branch_id;
        var toArea = sameBranch ? S.get('storage', d.q('#sa-to-area').value) : null;
        var qty = d.q('#sa-qty').value;
        var have = p && from ? S.areaOnHand(p.id, from.id) : 0;
        var ok = [
          fixed ? true : d.setError('sa-product', p ? '' : 'Choose a product from the list.'),
          d.setError('sa-from', !p ? '' : from ? '' : 'There is no stock of this product in your areas.'),
          d.setError('sa-to-branch', ''),
          sameBranch ? d.setError('sa-to-area', toArea ? '' : 'This branch has no other storage area.') : true,
          d.setError('sa-qty', !wholePositive(qty) ? 'Enter a whole number above 0.'
            : p && from && Number(qty) > have ? 'Only ' + fmt.qty(have, p.unit_id) + ' are in ' + from.name + '.' : '')
        ];
        if (ok.indexOf(false) >= 0) { d.firstInvalid(); return; }

        var n = Number(qty);
        var ref = S.nextRef('TR');
        var user = opts.session.user.id;
        if (sameBranch) {
          move({ product_id: p.id, branch_id: from.branch_id, area_id: from.id, type: 'Transfer out', qty_change: -n, ref: ref, user_id: user, reason: 'To ' + toArea.name });
          move({ product_id: p.id, branch_id: toArea.branch_id, area_id: toArea.id, type: 'Transfer in', qty_change: n, ref: ref, user_id: user, reason: 'From ' + from.name });
          if (!stockedIn(p.id, toArea.id)) S.insert('stock_locations', { product_id: p.id, area_id: toArea.id });
          logMove(ref, p.name + ' ' + fmt.qty(n, p.unit_id) + ' · ' + areaLabel(from) + ' → ' + toArea.name);
          CNS.ui.toast('Moved ' + fmt.qty(n, p.unit_id) + ' to ' + toArea.name + '.');
        } else {
          var toName = S.branchName(toBranch);
          move({ product_id: p.id, branch_id: from.branch_id, area_id: from.id, type: 'Transfer out', qty_change: -n, ref: ref, user_id: user, reason: 'To ' + toName });
          logMove(ref, p.name + ' ' + fmt.qty(-n, p.unit_id) + ' · ' + areaLabel(from) + ' → ' + toName + ' (in transit)');
          CNS.ui.toast('Sent ' + fmt.qty(n, p.unit_id) + ' to ' + toName + '. It shows as In transit until they confirm.');
        }
        d.close();
        if (opts.onDone) opts.onDone();
      });
    },

    // ---- Receive: the other branch confirms an in-transit transfer ----
    receive: function (opts) {
      var t = opts.transfer;
      var p = S.get('products', t.product_id);
      var areas = S.where('storage', function (a) { return a.branch_id === t.to_branch; });
      var preferred = areas.filter(function (a) { return stockedIn(p.id, a.id); })[0] || areas[0];
      var d = dialog({
        icon: 'arrow-down-tray', title: 'Receive transfer ' + t.ref,
        lede: fmt.qty(t.qty, p.unit_id) + ' of ' + p.name + ' from ' + S.branchName(t.from_branch) + '. Check the count before you confirm.',
        submit: 'Confirm received',
        body: field('sa-area', 'Put it in', '<select class="input" id="sa-area" aria-describedby="sa-area-error">' +
          areas.map(function (a) { return '<option value="' + esc(a.id) + '"' + (a === preferred ? ' selected' : '') + '>' + esc(areaLabel(a)) + '</option>'; }).join('') + '</select>')
      });
      d.q('#sa-area').focus();
      d.q('form').addEventListener('submit', function (e) {
        e.preventDefault();
        var area = S.get('storage', d.q('#sa-area').value);
        move({ product_id: p.id, branch_id: area.branch_id, area_id: area.id, type: 'Transfer in', qty_change: t.qty, ref: t.ref, user_id: opts.session.user.id, reason: 'From ' + S.branchName(t.from_branch) });
        if (!stockedIn(p.id, area.id)) S.insert('stock_locations', { product_id: p.id, area_id: area.id });
        logMove(t.ref, p.name + ' ' + signed(t.qty, p.unit_id) + ' · ' + areaLabel(area) + ' (received from ' + S.branchName(t.from_branch) + ')');
        d.close();
        CNS.ui.toast('Received ' + fmt.qty(t.qty, p.unit_id) + ' into ' + area.name + '.');
        if (opts.onDone) opts.onDone();
      });
    }
  };
})(window.CNS);
