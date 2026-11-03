// Nagarik Drishti — Control Room. All data comes from the Apps Script API; every call carries a signed,
// expiring token that the SERVER verifies. Text is always written with textContent (never innerHTML).
(function () {
  var API = (window.ND_CONFIG || {}).API_URL, C = window.NDCatalog, D = window.ND_NEPAL, DAY = 864e5, PAGE = 25;
  var $ = function (id) { return document.getElementById(id); };
  var S = { reports: [], config: {}, token: null, sel: {}, page: 0, view: 'overview', map: null, layer: null, filtered: [] };
  var COL = C.statusColors, STATUS_NAMES = { reported: 'Reported', review: 'In review', verified: 'Verified', assigned: 'Assigned', progress: 'In progress', resolved: 'Resolved', rejected: 'Rejected', duplicate: 'Duplicate', reopened: 'Reopened', info: 'Info requested' };

  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }
  function toast(m, err) { var t = $('toast'); t.textContent = m; t.className = 'toast show' + (err ? ' err' : ''); clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = 'toast'; }, 2800); }
  function ago(iso) { var d = (Date.now() - new Date(iso).getTime()) / DAY; return d < 1 ? Math.max(1, Math.round(d * 24)) + 'h' : Math.round(d) + 'd'; }
  function fmt(iso) { try { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return iso; } }
  function catName(id) { return C.categoryName(id); }
  function provName(id) { for (var i = 0; i < D.provinces.length; i++) if (D.provinces[i].id === id) return D.provinces[i].en.replace(' Province', ''); return id || '—'; }
  function badge(st) { var b = el('span', STATUS_NAMES[st] || st, 'badge'); b.style.setProperty('--c', COL[st] || '#64748b'); return b; }
  function opts(sel, first, items) { sel.innerHTML = ''; if (first) sel.appendChild(new Option(first, '')); items.forEach(function (i) { sel.appendChild(new Option(i[1], i[0])); }); }

  /* ---------- API ---------- */
  function call(body) {
    body.token = S.token;
    return fetch(API, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' } }).then(function (r) { return r.json(); }).then(function (r) {
      if (r && r.error === 'auth') { lock('Session expired — please sign in again.'); throw new Error('auth'); }
      return r;
    });
  }
  function lock(msg) { S.token = null; try { sessionStorage.removeItem('nd-admin'); } catch (e) { } $('app').hidden = true; $('gate').hidden = false; $('login-msg').textContent = msg || ''; $('pw').value = ''; $('pw').focus(); }

  /* ---------- login ---------- */
  $('login').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!API) { $('login-msg').textContent = 'No backend configured. Set API_URL in js/config.js first.'; return; }
    var btn = $('login-btn'); btn.disabled = true; btn.textContent = 'Checking…'; $('login-msg').textContent = '';
    fetch(API, { method: 'POST', body: JSON.stringify({ action: 'adminLogin', password: $('pw').value }), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
      .then(function (r) { return r.json(); }).then(function (r) {
        if (r.ok) { S.token = r.token; try { sessionStorage.setItem('nd-admin', r.token); } catch (x) { } enter(); return; }
        $('login-msg').textContent = r.error === 'locked' ? 'Too many attempts. Locked for ' + r.minutes + ' minutes.' :
          r.error === 'not_configured' ? 'ADMIN_PASSWORD is not set in the Apps Script properties.' :
          'Incorrect key.' + (r.left != null ? ' ' + r.left + ' attempt(s) left.' : '');
      }).catch(function () { $('login-msg').textContent = 'Could not reach the server.'; })
      .then(function () { btn.disabled = false; btn.textContent = 'Unlock'; $('pw').value = ''; });
  });
  $('logout').addEventListener('click', function () { lock('Signed out.'); });

  function enter() {
    $('gate').hidden = true; $('app').hidden = false;
    var exp = Number((S.token || '').split('.')[0]); $('session').textContent = 'session until ' + new Date(exp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    opts($('f-status'), 'All statuses', C.statuses.map(function (s) { return [s.id, STATUS_NAMES[s.id]]; }));
    opts($('f-cat'), 'All categories', C.categories.map(function (c) { return [c.id, c.en]; }));
    opts($('f-prov'), 'All provinces', D.provinces.map(function (p) { return [p.id, p.en.replace(' Province', '')]; }));
    opts($('bulk-status'), 'Set status…', C.statuses.map(function (s) { return [s.id, STATUS_NAMES[s.id]]; }));
    opts($('bulk-dept'), 'Assign dept…', C.departments.map(function (d) { return [d.id, d.en]; }));
    load();
  }
  function load() {
    $('sync').textContent = 'syncing…';
    return call({ action: 'adminList' }).then(function (r) {
      if (!r.ok) throw new Error('x'); S.reports = r.reports; S.config = r.config || {};
      $('sync').textContent = 'synced ' + new Date().toLocaleTimeString('en-GB'); renderAll();
    }).catch(function (e) { if (e.message !== 'auth') { $('sync').textContent = 'sync failed'; toast('Could not load data', true); } });
  }
  $('refresh').addEventListener('click', load);

  /* ---------- navigation ---------- */
  $('nav').addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) go(b.getAttribute('data-v')); });
  function go(v) {
    S.view = v; $('title').textContent = { overview: 'Overview', reports: 'Reports', map: 'Live map', site: 'Site controls', audit: 'Audit log', security: 'Security' }[v];
    document.querySelectorAll('#nav button').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-v') === v); });
    document.querySelectorAll('[data-view]').forEach(function (s) { s.hidden = s.getAttribute('data-view') !== v; });
    if (v === 'map') drawMap(); if (v === 'audit') loadAudit(); if (v === 'site') renderSite();
  }
  function renderAll() {
    var open = S.reports.filter(function (r) { return ['reported', 'reopened', 'info'].indexOf(r.status) >= 0; }).length;
    $('nb-open').textContent = open || '';
    renderOverview(); renderTable(); if (S.view === 'map') drawMap(); if (S.view === 'site') renderSite();
  }

  /* ---------- overview ---------- */
  function bars(box, rows, color) {
    box.innerHTML = ''; var max = Math.max.apply(null, rows.map(function (r) { return r[1]; }).concat([1]));
    if (!rows.length) { box.appendChild(el('div', 'No data yet', 'empty')); return; }
    var w = el('div', null, 'bars');
    rows.forEach(function (r) {
      var row = el('div', null, 'brow'), tr = el('div', null, 'track'), i = el('i'); i.style.width = (r[1] / max * 100) + '%'; i.style.setProperty('--c', r[2] || color || 'var(--blue)');
      tr.appendChild(i); row.appendChild(el('span', r[0])); row.appendChild(tr); row.appendChild(el('b', String(r[1]))); w.appendChild(row);
    });
    box.appendChild(w);
  }
  function renderOverview() {
    var R = S.reports, now = Date.now(), open = R.filter(function (r) { return ['resolved', 'rejected', 'duplicate'].indexOf(r.status) < 0; });
    var res = R.filter(function (r) { return r.status === 'resolved'; }), week = R.filter(function (r) { return now - new Date(r.created) < 7 * DAY; });
    var days = res.map(function (r) { var e = r.events.filter(function (x) { return x.type === 'resolved'; }).pop(); return e ? (new Date(e.at) - new Date(r.created)) / DAY : null; }).filter(function (x) { return x != null; });
    var avg = days.length ? (days.reduce(function (a, b) { return a + b; }, 0) / days.length).toFixed(1) + ' d' : '—';
    var k = [[R.length, 'Total reports', '#3d8bff'], [open.length, 'Open', '#f5b94a'], [res.length, 'Resolved', '#37d67a'], [week.length, 'New · 7 days', '#27c4dd'],
      [R.length ? Math.round(res.length / R.length * 100) + '%' : '—', 'Resolution rate', '#a66cff'], [avg, 'Avg. time to resolve', '#ff5d6c']];
    var box = $('kpis'); box.innerHTML = '';
    k.forEach(function (x) { var d = el('div', null, 'kpi'); d.style.setProperty('--k', x[2]); d.appendChild(el('b', String(x[0]))); d.appendChild(el('span', x[1])); box.appendChild(d); });
    // 30-day trend (SVG)
    var n = 30, cnt = []; for (var i = 0; i < n; i++) cnt.push(0);
    R.forEach(function (r) { var d = Math.floor((now - new Date(r.created)) / DAY); if (d >= 0 && d < n) cnt[n - 1 - d]++; });
    var mx = Math.max.apply(null, cnt.concat([3])), NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 300 90'); svg.setAttribute('class', 'spark'); svg.setAttribute('preserveAspectRatio', 'none');
    var pts = cnt.map(function (v, i) { return [i * (300 / (n - 1)), 82 - v / mx * 72]; });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var defs = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3d8bff" stop-opacity=".5"/><stop offset="1" stop-color="#3d8bff" stop-opacity="0"/></linearGradient></defs>';
    svg.innerHTML = defs + '<path d="' + line + ' L300 90 L0 90Z" fill="url(#g)"/><path d="' + line + '" fill="none" stroke="#5aa2ff" stroke-width="2" vector-effect="non-scaling-stroke"/>';
    $('c-trend').innerHTML = ''; $('c-trend').appendChild(svg); $('c-trend').appendChild(el('div', 'Peak: ' + Math.max.apply(null, cnt) + ' per day · total ' + cnt.reduce(function (a, b) { return a + b; }, 0), 'hint'));
    function tally(fn) { var m = {}; R.forEach(function (r) { var k = fn(r); m[k] = (m[k] || 0) + 1; }); return m; }
    var st = tally(function (r) { return r.status; }); bars($('c-status'), C.statuses.filter(function (s) { return st[s.id]; }).map(function (s) { return [STATUS_NAMES[s.id], st[s.id], COL[s.id]]; }));
    var ct = tally(function (r) { return r.cat; }); bars($('c-cat'), Object.keys(ct).sort(function (a, b) { return ct[b] - ct[a]; }).map(function (c) { return [catName(c), ct[c]]; }), '#27c4dd');
    var pv = tally(function (r) { return r.province; }); bars($('c-prov'), Object.keys(pv).sort(function (a, b) { return pv[b] - pv[a]; }).map(function (p) { return [provName(p), pv[p]]; }), '#37d67a');
    var attn = R.filter(function (r) { return r.status === 'reported' || r.status === 'reopened'; }).sort(function (a, b) { return a.created < b.created ? -1 : 1; }).slice(0, 6), ab = $('attn'); ab.innerHTML = '';
    if (!attn.length) ab.appendChild(el('div', 'Nothing waiting — inbox zero 🎉', 'empty'));
    attn.forEach(function (r) { var row = el('div', null, 'log'); row.style.cursor = 'pointer'; row.style.gridTemplateColumns = '7.5rem 1fr 6rem 3rem'; row.appendChild(el('b', r.ref)); row.appendChild(el('span', r.title)); row.appendChild(badge(r.status)); row.appendChild(el('time', ago(r.created))); row.addEventListener('click', function () { openDrawer(r.ref); }); ab.appendChild(row); });
  }

  /* ---------- reports table ---------- */
  ['q', 'f-status', 'f-cat', 'f-prov', 'f-sort'].forEach(function (id) { $(id).addEventListener('input', function () { S.page = 0; renderTable(); }); });
  function renderTable() {
    var q = $('q').value.trim().toLowerCase(), st = $('f-status').value, ct = $('f-cat').value, pv = $('f-prov').value, so = $('f-sort').value;
    var L = S.reports.filter(function (r) {
      return (!st || r.status === st) && (!ct || r.cat === ct) && (!pv || r.province === pv) &&
        (!q || (r.ref + ' ' + r.title + ' ' + r.desc + ' ' + r.district + ' ' + r.local + ' ' + (r.note || '')).toLowerCase().indexOf(q) >= 0);
    }).sort(function (a, b) { var k = so === 'upd' ? 'updated' : 'created'; return (a[k] < b[k] ? 1 : -1) * (so === 'old' ? -1 : 1); });
    S.filtered = L; var pages = Math.max(1, Math.ceil(L.length / PAGE)); if (S.page >= pages) S.page = pages - 1;
    var tb = $('tbl').querySelector('tbody'); tb.innerHTML = '';
    L.slice(S.page * PAGE, S.page * PAGE + PAGE).forEach(function (r) {
      var tr = document.createElement('tr'), c0 = document.createElement('td'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!S.sel[r.ref];
      cb.addEventListener('click', function (e) { e.stopPropagation(); if (cb.checked) S.sel[r.ref] = 1; else delete S.sel[r.ref]; bulkBar(); }); c0.appendChild(cb); tr.appendChild(c0);
      tr.appendChild(el('td', r.ref, 'ref')); tr.appendChild(el('td', r.title, 't')); tr.appendChild(el('td', catName(r.cat)));
      tr.appendChild(el('td', r.district + ', ' + provName(r.province))); var cs = document.createElement('td'); cs.appendChild(badge(r.status)); tr.appendChild(cs); tr.appendChild(el('td', ago(r.created)));
      tr.addEventListener('click', function () { openDrawer(r.ref); }); tb.appendChild(tr);
    });
    if (!L.length) { var e = document.createElement('tr'), td = el('td', 'No reports match.', 'empty'); td.colSpan = 7; e.appendChild(td); tb.appendChild(e); }
    $('pginfo').textContent = L.length + ' reports · page ' + (S.page + 1) + '/' + pages; $('all').checked = false; bulkBar();
  }
  $('prev').addEventListener('click', function () { if (S.page > 0) { S.page--; renderTable(); } });
  $('next').addEventListener('click', function () { S.page++; renderTable(); });
  $('all').addEventListener('change', function () { var on = this.checked; S.filtered.slice(S.page * PAGE, S.page * PAGE + PAGE).forEach(function (r) { if (on) S.sel[r.ref] = 1; else delete S.sel[r.ref]; }); renderTable(); $('all').checked = on; });
  function selRefs() { return Object.keys(S.sel); }
  function bulkBar() { var n = selRefs().length; $('bulk').hidden = !n; $('bulk-n').textContent = n + ' selected'; }
  $('bulk-clear').addEventListener('click', function () { S.sel = {}; renderTable(); });
  function merge(list) { list.forEach(function (n) { for (var i = 0; i < S.reports.length; i++) if (S.reports[i].ref === n.ref) S.reports[i] = n; }); renderAll(); }
  $('bulk-apply').addEventListener('click', function () {
    var st = $('bulk-status').value, dp = $('bulk-dept').value; if (!st && !dp) { toast('Choose a status or department', true); return; }
    if (!confirm('Apply to ' + selRefs().length + ' report(s)?')) return;
    call({ action: 'adminBulk', refs: selRefs(), status: st || undefined, dept: dp || undefined }).then(function (r) { if (r.ok) { merge(r.reports); S.sel = {}; renderTable(); toast(r.count + ' updated'); } else toast('Failed', true); }).catch(function () { });
  });
  $('bulk-del').addEventListener('click', function () {
    var n = selRefs().length; if (!confirm('PERMANENTLY delete ' + n + ' report(s) and their photos? This cannot be undone.')) return;
    call({ action: 'adminDelete', refs: selRefs() }).then(function (r) { if (r.ok) { S.reports = S.reports.filter(function (x) { return !S.sel[x.ref]; }); S.sel = {}; renderAll(); toast(r.count + ' deleted'); } }).catch(function () { });
  });
  $('csv').addEventListener('click', function () {
    var cols = ['ref', 'created', 'status', 'dept', 'cat', 'sub', 'title', 'desc', 'province', 'district', 'local', 'ward', 'lat', 'lng', 'observed', 'note'];
    function cell(v) { v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
    var rows = [cols.join(',')].concat(S.filtered.map(function (r) { return cols.map(function (c) { return cell(r[c]); }).join(','); }));
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.join('\n')], { type: 'text/csv' })); a.download = 'nagarik-drishti-reports-' + new Date().toISOString().slice(0, 10) + '.csv'; a.click();
  });

  /* ---------- drawer ---------- */
  function closeDrawer() { $('drawer').hidden = true; $('scrim').hidden = true; }
  $('scrim').addEventListener('click', closeDrawer); document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
  function openDrawer(ref) {
    var r = S.reports.filter(function (x) { return x.ref === ref; })[0]; if (!r) return;
    var d = $('drawer'); d.innerHTML = ''; d.hidden = false; $('scrim').hidden = false;
    var x = el('button', '✕', 'btn small ghost x'); x.addEventListener('click', closeDrawer); d.appendChild(x);
    d.appendChild(el('small', r.ref, 'ref')); d.appendChild(el('h3', r.title)); d.appendChild(badge(r.status));
    if (r.image) { var im = document.createElement('img'); im.className = 'ph'; im.src = r.image; im.alt = 'Citizen photo'; im.loading = 'lazy'; d.appendChild(im); }
    var p = el('p', r.desc); p.style.whiteSpace = 'pre-wrap'; d.appendChild(p);
    var dl = el('dl', null, 'dl');
    [['Category', catName(r.cat) + ' — ' + C.subName(r.cat, r.sub)], ['Place', r.local + ', ward ' + r.ward + ', ' + r.district + ', ' + provName(r.province)], ['Coordinates', r.lat.toFixed(6) + ', ' + r.lng.toFixed(6)],
      ['Seen on', r.observed], ['Submitted', fmt(r.created)], ['Updated', fmt(r.updated)], ['Department', r.dept ? C.deptName(r.dept) : '—'], ['Wants updates', r.contact === 'inapp' ? 'Yes (in-app)' : 'No']]
      .forEach(function (kv) { dl.appendChild(el('dt', kv[0])); dl.appendChild(el('dd', kv[1])); });
    d.appendChild(dl);
    var a = el('a', 'Open in OpenStreetMap ↗', 'btn small'); a.href = 'https://www.openstreetmap.org/?mlat=' + r.lat + '&mlon=' + r.lng + '#map=18/' + r.lat + '/' + r.lng; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.style.textDecoration = 'none'; d.appendChild(a);
    d.appendChild(el('h3', 'Timeline')); var tl = el('ol', null, 'tl');
    r.events.forEach(function (e) { var li = document.createElement('li'); li.style.setProperty('--c', COL[e.type] || '#64748b'); li.appendChild(el('span', (STATUS_NAMES[e.type] || e.type) + (e.dept ? ' — ' + C.deptName(e.dept) : ''))); li.appendChild(el('small', fmt(e.at) + (e.note ? ' · ' + e.note : ''))); tl.appendChild(li); });
    d.appendChild(tl);
    d.appendChild(el('h3', 'Take action'));
    var row = el('div', null, 'row'), ss = document.createElement('select'), ds = document.createElement('select');
    opts(ss, null, C.statuses.map(function (s) { return [s.id, STATUS_NAMES[s.id]]; })); ss.value = r.status; opts(ds, '— no department —', C.departments.map(function (z) { return [z.id, z.en]; })); ds.value = r.dept || ''; ss.style.width = ds.style.width = '100%';
    row.appendChild(ss); row.appendChild(ds); d.appendChild(row);
    var en = document.createElement('input'); en.placeholder = 'Public note shown on the timeline (optional)'; en.maxLength = 300; d.appendChild(en);
    d.appendChild(el('h3', 'Private admin note')); var nt = document.createElement('textarea'); nt.rows = 3; nt.maxLength = 2000; nt.value = r.note || ''; nt.placeholder = 'Only admins can see this'; d.appendChild(nt);
    var act = el('div', null, 'row'), save = el('button', 'Save changes', 'btn glow'), del = el('button', 'Delete report', 'btn danger');
    save.addEventListener('click', function () {
      save.disabled = true;
      call({ action: 'adminUpdate', ref: r.ref, status: ss.value, dept: ds.value || undefined, eventNote: en.value, note: nt.value }).then(function (res) {
        if (res.ok) { merge([res.report]); toast('Saved'); openDrawer(r.ref); } else { toast('Save failed', true); save.disabled = false; }
      }).catch(function () { save.disabled = false; });
    });
    del.addEventListener('click', function () { if (!confirm('Permanently delete ' + r.ref + '?')) return; call({ action: 'adminDelete', refs: [r.ref] }).then(function (res) { if (res.ok) { S.reports = S.reports.filter(function (z) { return z.ref !== r.ref; }); closeDrawer(); renderAll(); toast('Deleted'); } }).catch(function () { }); });
    act.appendChild(save); act.appendChild(del); d.appendChild(act);
  }

  /* ---------- map ---------- */
  function drawMap() {
    if (typeof L === 'undefined') { $('amap').textContent = 'Map library could not load.'; return; }
    if (!S.map) {
      S.map = L.map('amap', { center: D.center, zoom: 7, minZoom: 6, maxBounds: D.bounds });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(S.map); S.layer = L.layerGroup().addTo(S.map);
    }
    S.layer.clearLayers();
    S.reports.forEach(function (r) {
      var m = L.circleMarker([r.lat, r.lng], { radius: 8, weight: 2, color: '#fff', fillColor: COL[r.status] || '#64748b', fillOpacity: .95 });
      var box = document.createElement('div'); box.appendChild(el('b', r.ref)); box.appendChild(document.createElement('br')); box.appendChild(document.createTextNode(r.title)); box.appendChild(document.createElement('br'));
      var b = el('a', 'Open'); b.href = '#'; b.addEventListener('click', function (e) { e.preventDefault(); openDrawer(r.ref); }); box.appendChild(b); m.bindPopup(box); S.layer.addLayer(m);
    });
    setTimeout(function () { S.map.invalidateSize(); }, 50);
  }

  /* ---------- site controls ---------- */
  function renderSite() {
    var c = S.config || {}, a = c.announcement || {}; $('accepting').checked = c.accepting !== false; $('acc-label').textContent = c.accepting !== false ? 'Open — citizens can submit reports' : 'Paused — the report form is closed';
    $('ann-en').value = a.en || ''; $('ann-ne').value = a.ne || ''; $('ann-lvl').value = a.level || 'info';
  }
  $('accepting').addEventListener('change', function () {
    var on = this.checked; call({ action: 'adminConfig', accepting: on }).then(function (r) { if (r.ok) { S.config = r.config; renderSite(); toast(on ? 'Submissions open' : 'Submissions paused'); } }).catch(function () { });
  });
  $('ann-save').addEventListener('click', function () {
    call({ action: 'adminConfig', announcement: { en: $('ann-en').value, ne: $('ann-ne').value, level: $('ann-lvl').value } }).then(function (r) { if (r.ok) { S.config = r.config; toast('Announcement updated'); } }).catch(function () { });
  });

  /* ---------- audit + security ---------- */
  function loadAudit() {
    var box = $('audit-list'); box.textContent = 'Loading…';
    call({ action: 'adminAudit' }).then(function (r) {
      box.innerHTML = ''; if (!r.ok || !r.audit.length) { box.appendChild(el('div', 'No activity yet.', 'empty')); return; }
      r.audit.forEach(function (a) { var row = el('div', null, 'log'); row.appendChild(el('time', fmt(a.at))); row.appendChild(el('b', a.action)); row.appendChild(el('span', (a.refs ? a.refs + ' · ' : '') + a.detail)); box.appendChild(row); });
    }).catch(function () { });
  }
  $('pwform').addEventListener('submit', function (e) {
    e.preventDefault(); var m = $('pw-msg'); m.className = 'msg'; m.textContent = '';
    call({ action: 'adminPassword', old: $('pw-old').value, next: $('pw-new').value }).then(function (r) {
      if (r.ok) { lock('Key changed — sign in with the new key.'); } else { m.textContent = r.error === 'bad_password' ? 'Current key is wrong.' : 'New key must be at least 10 characters.'; }
    }).catch(function () { });
  });
  $('revoke').addEventListener('click', function () { if (confirm('Sign out every admin session, including this one?')) call({ action: 'adminRevoke' }).then(function () { lock('All sessions revoked.'); }).catch(function () { }); });

  // resume a session within the same tab
  try { var t = sessionStorage.getItem('nd-admin'); if (t && Number(t.split('.')[0]) > Date.now()) { S.token = t; enter(); } } catch (e) { }
})();
