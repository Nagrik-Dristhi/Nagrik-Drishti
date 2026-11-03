// Nagarik Drishti — Public statistics (simulated demo data). Charts are plain HTML/CSS so they
// work offline, follow the theme, and always come with a table alternative. Text via textContent only.
(function () {
  var S = window.NDStore, C = window.NDCatalog, D = window.ND_NEPAL;
  var $ = function (id) { return document.getElementById(id); };
  function lang() { return window.NDLang.get(); }
  function t(k) { return window.NDLang.t(k); }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  var NS = 'http://www.w3.org/2000/svg', DAY = 86400000;

  function setOptions(sel, first, items) {
    var cur = sel.value; sel.innerHTML = '';
    sel.appendChild(new Option(first, ''));
    items.forEach(function (it) { sel.appendChild(new Option(it[1], it[0])); });
    sel.value = cur; if (sel.value !== cur) sel.value = '';
  }

  function filtered() {
    var p = $('s-province').value, d = $('s-district').value, c = $('s-cat').value, st = $('s-status').value, per = Number($('s-period').value) || 0;
    var since = per ? Date.now() - per * DAY : 0;
    return S.all().filter(function (r) {
      return (!p || r.province === p) && (!d || r.district === d) && (!c || r.cat === c) && (!st || r.status === st) &&
        (!since || new Date(r.created).getTime() >= since);
    });
  }

  function tableDetails(rows, nameHead) {
    var det = el('details'), sum = el('summary', t('st.table')); det.appendChild(sum);
    var tb = document.createElement('table'), th = document.createElement('tr');
    th.appendChild(el('th', nameHead || t('st.col.name'))); th.appendChild(el('th', t('st.col.n'))); tb.appendChild(th);
    rows.forEach(function (r) { var tr = document.createElement('tr'); tr.appendChild(el('td', r.label)); tr.appendChild(el('td', String(r.value))); tb.appendChild(tr); });
    det.appendChild(tb); return det;
  }
  function empty(box, key) { box.innerHTML = ''; box.appendChild(el('p', t(key || 'st.empty'), 'empty')); }

  function bars(box, items, color) {
    box.innerHTML = '';
    if (!items.length || !items.some(function (i) { return i.value > 0; })) return empty(box);
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1, ul = el('ul', null, 'bars');
    items.forEach(function (i) {
      var li = el('li', null, 'bar-row'); li.appendChild(el('span', i.label, 'lab')); li.lastChild.title = i.label;
      var tr = el('span', null, 'bar-track'), f = el('span', null, 'bar-fill');
      f.style.width = (i.value / max * 100).toFixed(1) + '%'; if (i.color || color) f.style.setProperty('--c', i.color || color);
      tr.appendChild(f); li.appendChild(tr); li.appendChild(el('span', String(i.value), 'val')); ul.appendChild(li);
    });
    box.appendChild(ul); box.appendChild(tableDetails(items));
  }

  function columns(box, items) {
    box.innerHTML = '';
    if (!items.some(function (i) { return i.value > 0; })) return empty(box);
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    var wrap = el('div', null, 'cols'), labs = el('div', null, 'col-labels');
    items.forEach(function (i) {
      var c = el('div', null, 'col'); c.appendChild(el('span', String(i.value), 'cv'));
      var b = el('span', null, 'cb'); b.style.height = (i.value / max * 82).toFixed(1) + '%'; c.appendChild(b); wrap.appendChild(c);
      labs.appendChild(el('span', i.label));
    });
    box.appendChild(wrap); box.appendChild(labs); box.appendChild(tableDetails(items));
  }

  function donut(box, items, total) {
    box.innerHTML = '';
    if (!total) return empty(box);
    var wrap = el('div', null, 'donut-wrap'), R = 40, CIRC = 2 * Math.PI * R, off = 0;
    var s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 100 100'); s.setAttribute('class', 'donut'); s.setAttribute('role', 'img');
    s.setAttribute('aria-label', t('st.c.status'));
    items.forEach(function (i) {
      if (!i.value) return;
      var len = i.value / total * CIRC, c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', 50); c.setAttribute('cy', 50); c.setAttribute('r', R); c.setAttribute('fill', 'none'); c.setAttribute('stroke', i.color); c.setAttribute('stroke-width', 16);
      c.setAttribute('stroke-dasharray', len.toFixed(2) + ' ' + (CIRC - len).toFixed(2)); c.setAttribute('stroke-dashoffset', (-off).toFixed(2));
      c.setAttribute('transform', 'rotate(-90 50 50)');
      var ti = document.createElementNS(NS, 'title'); ti.textContent = i.label + ': ' + i.value; c.appendChild(ti); s.appendChild(c); off += len;
    });
    var tx = document.createElementNS(NS, 'text'); tx.setAttribute('x', 50); tx.setAttribute('y', 55); tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-size', 16); tx.textContent = String(total); s.appendChild(tx);
    wrap.appendChild(s);
    var ul = el('ul', null, 'legend');
    items.forEach(function (i) { if (!i.value) return; var li = el('li'), dot = el('i'); dot.style.setProperty('--c', i.color); li.appendChild(dot); li.appendChild(el('span', i.label)); li.appendChild(el('b', String(i.value))); ul.appendChild(li); });
    wrap.appendChild(ul); box.appendChild(wrap); box.appendChild(tableDetails(items));
  }

  function render() {
    var rows = filtered(), n = rows.length, loc = lang() === 'ne' ? 'ne-NP' : 'en-GB';
    function cnt(f) { return rows.filter(f).length; }
    var districts = {}; rows.forEach(function (r) { districts[r.district] = 1; });
    var VER = { verified: 1, assigned: 1, progress: 1, resolved: 1, reopened: 1 };
    var kp = [
      [n, t('st.k.total')],
      [cnt(function (r) { return VER[r.status]; }), t('st.k.verified')],
      [cnt(function (r) { return r.status === 'progress'; }), t('st.k.progress')],
      [cnt(function (r) { return r.status === 'resolved'; }), t('st.k.resolved')],
      [cnt(function (r) { return r.status === 'reported' || r.status === 'review' || r.status === 'info'; }), t('st.k.pending')],
      [Object.keys(districts).length, t('st.k.areas')]
    ];
    var kbox = $('kpis'); kbox.innerHTML = '';
    kp.forEach(function (k) { var d = el('div', null, 'kpi'); d.setAttribute('role', 'listitem'); d.appendChild(el('div', String(k[0]), 'ledger-num')); d.appendChild(el('div', k[1], 'ledger-label')); kbox.appendChild(d); });

    // monthly trend (last 7 calendar months)
    var now = new Date(), months = [];
    for (var m = 6; m >= 0; m--) { var d0 = new Date(now.getFullYear(), now.getMonth() - m, 1); months.push({ y: d0.getFullYear(), m: d0.getMonth(), label: d0.toLocaleDateString(loc, { month: 'short' }), value: 0 }); }
    rows.forEach(function (r) { var c = new Date(r.created); months.forEach(function (mo) { if (mo.y === c.getFullYear() && mo.m === c.getMonth()) mo.value++; }); });
    columns($('c-trend'), months);

    // by province / category / district
    var prov = D.provinces.map(function (p) { return { label: lang() === 'ne' ? p.ne : p.en, value: cnt(function (r) { return r.province === p.id; }) }; })
      .sort(function (a, b) { return b.value - a.value; });
    bars($('c-province'), prov);
    var cats = C.categories.map(function (c) { return { label: C.categoryName(c.id), value: cnt(function (r) { return r.cat === c.id; }) }; })
      .filter(function (i) { return i.value > 0; }).sort(function (a, b) { return b.value - a.value; });
    bars($('c-category'), cats);
    var byD = {}; rows.forEach(function (r) { byD[r.district] = (byD[r.district] || 0) + 1; });
    var dist = Object.keys(byD).map(function (k) { return { label: S.districtName(k), value: byD[k] }; }).sort(function (a, b) { return b.value - a.value; });
    bars($('c-district'), dist.slice(0, 10));
    if (n && dist.length) {
      var top5 = dist.slice(0, 5).reduce(function (a, b) { return a + b.value; }, 0), pct = Math.round(top5 / n * 100);
      $('c-district').appendChild(el('p', t('st.conc').replace('%1', pct), 'hint'));
    }

    // status
    var sts = C.statuses.map(function (s) { return { label: t('status.' + s.id), value: cnt(function (r) { return r.status === s.id; }), color: s.color }; });
    donut($('c-status'), sts, n);

    // days to resolution
    var buckets = [[7, 'st.b1'], [14, 'st.b2'], [30, 'st.b3'], [60, 'st.b4'], [Infinity, 'st.b5']].map(function (b) { return { max: b[0], label: t(b[1]), value: 0 }; });
    var resolved = 0;
    rows.forEach(function (r) {
      var first = r.events[0], done = null;
      r.events.forEach(function (e) { if (e.type === 'resolved') done = e; });
      if (!done) return; resolved++;
      var days = (new Date(done.at) - new Date(first.at)) / DAY;
      for (var i = 0; i < buckets.length; i++) if (days <= buckets[i].max) { buckets[i].value++; break; }
    });
    if (!resolved) empty($('c-resolution'), n ? 'st.noresolved' : 'st.empty'); else columns($('c-resolution'), buckets);

    // recurring issues: same type, same district, three or more reports
    var grp = {}; rows.forEach(function (r) { if (r.status === 'rejected' || r.status === 'duplicate') return; var k = r.district + '|' + r.cat; (grp[k] = grp[k] || { d: r.district, c: r.cat, n: 0 }).n++; });
    var rec = Object.keys(grp).map(function (k) { return grp[k]; }).filter(function (g) { return g.n >= 3; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 6);
    var rbox = $('c-recurring'); rbox.innerHTML = '';
    if (!rec.length) rbox.appendChild(el('p', t(n ? 'st.recurring.none' : 'st.empty'), 'empty'));
    else {
      rbox.appendChild(el('p', t('st.recurring.note'), 'hint'));
      var ul = el('ul', null, 'recur');
      rec.forEach(function (g) { var li = el('li'); li.appendChild(el('span', C.categoryName(g.c) + ', ' + S.districtName(g.d))); li.appendChild(el('b', String(g.n))); ul.appendChild(li); });
      rbox.appendChild(ul);
    }
  }

  function fillFilters() {
    setOptions($('s-province'), t('st.all'), D.provinces.map(function (p) { return [p.id, lang() === 'ne' ? p.ne : p.en]; }));
    var pid = $('s-province').value;
    setOptions($('s-district'), t('st.all'), D.districts.filter(function (d) { return !pid || d[0] === pid; }).map(function (d) { return [d[1], lang() === 'ne' ? d[2] : d[1]]; }));
    setOptions($('s-cat'), t('st.all'), C.categories.map(function (c) { return [c.id, C.categoryName(c.id)]; }));
    setOptions($('s-status'), t('st.all'), C.statuses.map(function (s) { return [s.id, t('status.' + s.id)]; }));
    var per = $('s-period'), cur = per.value; per.innerHTML = '';
    [['', 'st.p.all'], ['30', 'st.p.30'], ['90', 'st.p.90'], ['180', 'st.p.180']].forEach(function (o) { per.appendChild(new Option(t(o[1]), o[0])); });
    per.value = cur;
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('kpis')) return;
    fillFilters(); render();
    ['s-district', 's-cat', 's-status', 's-period'].forEach(function (id) { $(id).addEventListener('change', render); });
    $('s-province').addEventListener('change', function () { $('s-district').value = ''; fillFilters(); render(); });
    $('s-clear').addEventListener('click', function () { ['s-province', 's-district', 's-cat', 's-status', 's-period'].forEach(function (id) { $(id).value = ''; }); fillFilters(); render(); });
    document.addEventListener('nd:langchange', function () { fillFilters(); render(); });
    document.addEventListener('nd:datachange', render);
  });
})();
