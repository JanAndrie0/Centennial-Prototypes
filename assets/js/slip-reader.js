/* "Read slip with AI" (02 plan step 2.3; Turis adapted feature). MOCKED: canned results, no real AI call
   (CLAUDE.md agent rule). The AI only suggests lines; staff confirm or change each one, and only confirmed
   lines go back to the order. It never saves, prices or deducts stock (decision of October 18).

   CNS.slipReader.open({ onAdd: function (lines) { ... } })   lines: [{ product_id, qty }] */
(function (CNS) {
  'use strict';

  var S = CNS.store;
  var fmt = CNS.format;
  var esc = CNS.escape;

  // What the "AI" read from a typical handwritten slip, with its best product match and confidence
  var CANNED = [
    { text: 'PVC 1/2 x 10ft — 20 pcs', product_id: 'p1', qty: 20, confidence: 96 },
    { text: 'Common nail 2" — 5 bx', product_id: 'p7', qty: 5, confidence: 92 },
    { text: 'Tox 6mm — 10 pk', product_id: 'p21', qty: 10, confidence: 88 },
    { text: 'Hinges 3in — 12 pr', product_id: 'p31', qty: 12, confidence: 90 },
    { text: 'Teflon — 50', product_id: 'p37', qty: 50, confidence: 81 },
    { text: 'Epoxy A&B — 12 ea', product_id: 'p23', qty: 12, confidence: 64 }
  ];

  function confidenceBadge(n) {
    return n >= 85 ? CNS.ui.badge('success', 'check-circle', n + '% sure')
      : n >= 70 ? CNS.ui.badge('warning', 'exclamation-triangle', n + '% sure')
      : CNS.ui.badge('error', 'exclamation-circle', n + '% · check this');
  }

  CNS.slipReader = {
    open: function (opts) {
      var products = S.all('products').slice().sort(function (a, b) { return a.name.localeCompare(b.name); });
      var d = document.createElement('dialog');
      d.className = 'modal modal--wide';
      d.setAttribute('aria-labelledby', 'ai-title');
      d.innerHTML =
        CNS.icon('clipboard-document-list', 'modal__icon') +
        '<h2 class="modal__title" id="ai-title">Read slip with AI</h2>' +
        '<p class="modal__body">The AI read these lines from the slip. Check each one, change the product or quantity if needed, and tick <strong>Confirm</strong>. Only confirmed lines are added.</p>' +
        '<div class="table-wrap"><table class="table"><thead><tr>' +
          '<th scope="col">What the slip says</th><th scope="col">Product</th><th scope="col" class="num-col">Qty</th>' +
          '<th scope="col">Match</th><th scope="col">Confirm</th></tr></thead><tbody>' +
          CANNED.map(function (l, i) {
            return '<tr data-i="' + i + '"><td class="nowrap"><span class="cell-main">' + esc(l.text) + '</span></td>' +
              '<td><label class="sr-only" for="ai-p-' + i + '">Product for line ' + (i + 1) + '</label>' +
                '<select class="input input--cell" id="ai-p-' + i + '">' + products.map(function (p) {
                  return '<option value="' + esc(p.id) + '"' + (p.id === l.product_id ? ' selected' : '') + '>' + esc(p.name) + '</option>';
                }).join('') + '</select></td>' +
              '<td class="num-col"><label class="sr-only" for="ai-q-' + i + '">Quantity for line ' + (i + 1) + '</label>' +
                '<input class="input input--cell input--qty" id="ai-q-' + i + '" type="number" inputmode="numeric" min="1" step="1" value="' + l.qty + '">' +
                '<span class="cell-sub" data-unit></span></td>' +
              '<td>' + confidenceBadge(l.confidence) + '</td>' +
              '<td><label class="check-row"><input type="checkbox" data-confirm> <span>Confirm</span></label></td></tr>';
          }).join('') +
        '</tbody></table></div>' +
        '<p class="notice notice--info">' + CNS.icon('information-circle') + '<span>The AI never saves the order, sets prices or changes stock. You stay in control.</span></p>' +
        '<div class="modal__actions"><button type="button" class="btn btn--secondary" data-cancel>Cancel</button>' +
          '<button type="button" class="btn btn--primary" data-add></button></div>';
      var opener = document.activeElement;
      document.body.appendChild(d);

      function rows() { return Array.prototype.slice.call(d.querySelectorAll('tbody tr')); }
      function refresh() {
        var n = 0;
        rows().forEach(function (tr) {
          var p = S.get('products', tr.querySelector('select').value);
          tr.querySelector('[data-unit]').textContent = p ? fmt.unit(p.unit_id, 2) : '';
          if (tr.querySelector('[data-confirm]').checked) n++;
        });
        var add = d.querySelector('[data-add]');
        add.innerHTML = CNS.icon('check') + 'Add ' + n + ' confirmed ' + (n === 1 ? 'line' : 'lines');
        add.setAttribute('aria-disabled', String(!n));
      }
      d.addEventListener('input', refresh);
      d.addEventListener('change', refresh);
      refresh();

      d.addEventListener('close', function () { d.remove(); if (opener && document.contains(opener)) opener.focus(); });
      d.querySelector('[data-cancel]').addEventListener('click', function () { d.close(); });
      d.querySelector('[data-add]').addEventListener('click', function () {
        var lines = rows().filter(function (tr) { return tr.querySelector('[data-confirm]').checked; }).map(function (tr) {
          return { product_id: tr.querySelector('select').value, qty: Math.max(1, Math.round(Number(tr.querySelector('input[type=number]').value) || 1)) };
        });
        if (!lines.length) return;   // nothing confirmed: the button stays inactive
        d.close();
        opts.onAdd(lines);
      });

      d.showModal();
      d.querySelector('select').focus();
    }
  };
})(window.CNS);
