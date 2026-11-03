// Nagarik Drishti — Home page: dot map, demo indicators, category index, latest reports.
// All figures come from the simulated demo data layer. Text is set with textContent only.
(function () {
  var S = window.NDStore, C = window.NDCatalog, D = window.ND_NEPAL;
  var $ = function (id) { return document.getElementById(id); };
  function lang() { return window.NDLang.get(); }
  function t(k) { return window.NDLang.t(k); }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  var NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  var DAY = 86400000;

  // Equirectangular projection of lat/lng into the SVG box (a schematic, not a border).
  function px(lng) { return 20 + (lng - 80) * 88; }
  function py(lat) { return 20 + (30.6 - lat) * 100; }

  function drawDots() {
    var box = $('dotmap'); box.innerHTML = '';
    var ds = D.districts.slice().sort(function (a, b) { return a[4] - b[4]; });
    ds.forEach(function (d, i) {
      var c = svg('circle', { cx: px(d[4]).toFixed(1), cy: py(d[3]).toFixed(1), r: 3.2, class: 'd' });
      c.style.setProperty('--i', i); box.appendChild(c);
    });
    D.provinces.forEach(function (p) {
      var tx = svg('text', { x: px(p.c[1]).toFixed(1), y: (py(p.c[0]) + 4).toFixed(1), 'text-anchor': 'middle', class: 'plabel' });
      tx.textContent = lang() === 'ne' ? p.ne.replace(' प्रदेश', '') : p.en.replace(' Province', ''); box.appendChild(tx);
    });
    // one bubble per district with reports: size = number of reports, colour = most common status
    var by = {}, recent = Date.now() - 14 * DAY;
    S.all().forEach(function (r) {
      var g = by[r.district] || (by[r.district] = { n: 0, st: {}, fresh: false });
      g.n++; g.st[r.status] = (g.st[r.status] || 0) + 1; if (new Date(r.created).getTime() > recent) g.fresh = true;
    });
    var i = 0;
    D.districts.forEach(function (d) {
      var g = by[d[1]]; if (!g) return;
      var top = Object.keys(g.st).sort(function (a, b) { return g.st[b] - g.st[a]; })[0], col = C.statusColors[top];
      var r = 4 + Math.sqrt(g.n) * 1.7, x = px(d[4]).toFixed(1), y = py(d[3]).toFixed(1);
      var name = lang() === 'ne' ? d[2] : d[1];
      var a = svg('a', { href: 'map.html', 'aria-label': name + ': ' + g.n + ' ' + t('unit.reports') });
      var dot = svg('circle', { cx: x, cy: y, r: r.toFixed(1), fill: col, 'fill-opacity': '.88', class: 'rep' });
      dot.style.setProperty('--i', i++);
      var title = svg('title', {}); title.textContent = name + ': ' + g.n + ' ' + t('unit.reports') + ' (' + t('status.' + top) + ')';
      a.appendChild(dot); a.appendChild(title);
      if (g.fresh) { var ping = svg('circle', { cx: x, cy: y, r: r.toFixed(1), stroke: col, class: 'ping' }); ping.style.setProperty('--i', i); a.appendChild(ping); }
      box.appendChild(a);
    });
  }

  function drawLedger() {
    var all = S.all(), n = function (f) { return all.filter(f).length; };
    var districts = {}; all.forEach(function (r) { districts[r.district] = 1; });
    var items = [
      [all.length, t('ind.total')],
      [n(function (r) { return r.status === 'reported' || r.status === 'review' || r.status === 'info'; }), t('ind.review')],
      [n(function (r) { return r.status === 'assigned' || r.status === 'progress'; }), t('ind.assigned')],
      [n(function (r) { return r.status === 'resolved'; }), t('ind.resolved')],
      [Object.keys(districts).length + ' / ' + D.districts.length, t('ind.coverage')]
    ];
    var box = $('ledger'); box.innerHTML = '';
    items.forEach(function (it) { var d = el('div', null, 'ledger-item'); d.appendChild(el('div', String(it[0]), 'ledger-num')); d.appendChild(el('div', it[1], 'ledger-label')); box.appendChild(d); });
  }

  function drawCategories() {
    var count = {}; S.all().forEach(function (r) { count[r.cat] = (count[r.cat] || 0) + 1; });
    var box = $('cat-index'); box.innerHTML = '';
    C.categories.forEach(function (c) {
      var a = el('a'); a.href = 'report.html?cat=' + encodeURIComponent(c.id);
      a.appendChild(el('span', C.categoryName(c.id))); a.appendChild(el('span', (count[c.id] || 0) + ' ' + t('unit.reports'), 'n')); box.appendChild(a);
    });
  }

  function drawLatest() {
    var ul = $('latest-rows'); ul.innerHTML = '';
    S.all().sort(function (a, b) { return a.created < b.created ? 1 : -1; }).slice(0, 6).forEach(function (r) {
      var li = el('li'), a = el('a'); a.href = 'track.html?ref=' + encodeURIComponent(r.ref);
      a.appendChild(el('span', r.ref, 'r-meta'));
      var mid = el('span'); mid.appendChild(el('span', S.text(r.title), 'r-title')); mid.appendChild(document.createElement('br'));
      mid.appendChild(el('span', S.districtName(r.district) + ', ' + S.provinceName(r.province), 'r-meta')); a.appendChild(mid);
      a.appendChild(el('span', t('status.' + r.status), 'badge badge-' + r.status));
      li.appendChild(a); ul.appendChild(li);
    });
  }

  function draw() { drawDots(); drawLedger(); drawCategories(); drawLatest(); }
  document.addEventListener('DOMContentLoaded', function () {
    if (!$('dotmap')) return;
    draw();
    document.addEventListener('nd:langchange', draw);
    document.addEventListener('nd:datachange', draw);
  });
})();
