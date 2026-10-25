/* 3.3 Check Stock Availability: one search, result cards, view only (03 plan step 4).
   Shared by products/stock-check.html (desktop) and m/stock.html (Sales Agent).

   Usage: CNS.stockCheck.mount({ input, results, status, branch: function () { return 'b1' | 'all'; }, linkToDetail: true }) */
(function (CNS) {
  'use strict';

  var S = CNS.store;
  var fmt = CNS.format;
  var esc = CNS.escape;
  var MAX = 20;   // the catalog has 10,000+ products; show the best matches and ask for more letters

  function branchesStocking(productId) {
    var ids = [];
    S.where('stock_locations', function (l) { return l.product_id === productId; }).forEach(function (l) {
      var a = S.get('storage', l.area_id);
      if (a && ids.indexOf(a.branch_id) < 0) ids.push(a.branch_id);
    });
    return ids;
  }

  function qtyHtml(o, p) {
    return '<strong>' + esc(S.branchName(o.b)) + '</strong> ' + esc(fmt.qty(o.n, p.unit_id));
  }

  function card(p, branch, linkToDetail) {
    var avail = S.available(p.id, branch);
    var cat = S.get('categories', p.category_id);
    var stocked = branchesStocking(p.id);
    var here = branch === 'all' || stocked.indexOf(branch) >= 0;
    var name = linkToDetail
      ? '<a href="detail.html?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a>'
      : esc(p.name);

    // Company-wide view lists every branch; a branch view lists where else it is available
    var others = stocked.filter(function (b) { return branch === 'all' || b !== branch; })
      .map(function (b) { return { b: b, n: S.available(p.id, b) }; });
    var inStock = others.filter(function (o) { return o.n > 0; });
    var where = branch === 'all' ? 'Available in all branches' : 'Available at ' + S.branchName(branch);
    var otherText = branch === 'all'
      ? 'By branch: ' + others.map(function (o) { return qtyHtml(o, p); }).join(' · ')
      : inStock.length ? 'Other branches: ' + inStock.map(function (o) { return qtyHtml(o, p); }).join(' · ')
      : 'Not available at the other branches.';

    return '<li class="stock-card">' +
      '<h2 class="stock-card__name">' + name + '</h2>' +
      '<p class="stock-card__meta">' + esc(p.code + ' · ' + (cat ? cat.name : '')) + '</p>' +
      '<div class="stock-card__row">' +
        '<p class="stock-card__avail' + (here && avail < 0 ? ' qty-neg' : '') + '"><span class="stock-card__label">' + esc(where) + '</span>' +
          (here ? fmt.number(avail) + '<small> ' + esc(fmt.unit(p.unit_id, avail)) + '</small>' : '<small>Not stocked here</small>') + '</p>' +
        (here ? CNS.ui.stockBadge(S.stockStatus(p.id, branch)) : '') +
      '</div>' +
      (others.length ? '<p class="stock-card__other">' + otherText + '</p>' : '') +
      '</li>';
  }

  CNS.stockCheck = {
    mount: function (opts) {
      var timer;

      function render() {
        var typed = opts.input.value.trim();
        if (!typed) {
          opts.results.innerHTML = '';
          opts.status.textContent = 'Type a product name or code to see what\'s available.';
          return;
        }
        var words = typed.toLowerCase().split(/\s+/);
        var matches = S.all('products').filter(function (p) {
          var hay = (p.code + ' ' + p.name).toLowerCase();
          return words.every(function (w) { return hay.indexOf(w) >= 0; });
        }).sort(function (a, b) { return a.name.localeCompare(b.name); });

        var branch = opts.branch();
        opts.results.innerHTML = matches.slice(0, MAX).map(function (p) { return card(p, branch, opts.linkToDetail); }).join('');
        opts.status.textContent = !matches.length ? 'No products match "' + typed + '". Check the spelling.'
          : matches.length > MAX ? 'Showing ' + MAX + ' of ' + matches.length + ' matches. Type more of the name to narrow it down.'
          : matches.length + (matches.length === 1 ? ' product' : ' products') + ' · ' + S.branchName(branch);
      }

      opts.input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(render, 200);
      });
      render();
      return { render: render };
    }
  };
})(window.CNS);
