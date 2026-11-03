// Nagarik Drishti — Civic Map (Leaflet + OpenStreetMap). Vanilla JS.
(function () {
  var D = window.ND_NEPAL;
  var STATUS_COLORS = window.NDCatalog.statusColors;

  var $ = function (id) { return document.getElementById(id); };
  function lang() { return window.NDLang ? window.NDLang.get() : 'en'; }
  function t(k) { return window.NDLang ? window.NDLang.t(k) : k; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nameOf(obj) { return lang() === 'ne' ? obj.ne : obj.en; }

  document.addEventListener('DOMContentLoaded', function () {
    var mapEl = $('nd-map');
    if (!mapEl) return;

    if (typeof L === 'undefined') {
      var e = $('map-lib-error'); if (e) e.hidden = false;
      return;
    }

    var map = L.map(mapEl, {
      center: D.center, zoom: D.zoom, minZoom: 6, maxZoom: 19,
      maxBounds: D.bounds, maxBoundsViscosity: 0.8, worldCopyJump: false
    });

    var basemaps = NDBasemaps.install(map, { errorId: 'map-tile-error' });

    // ---------- selection marker (searched / chosen place) ----------
    var selection = null; // { layer, label: function -> string }
    function showSelection(latlng, labelFn) {
      clearSelection();
      var layer = L.circleMarker(latlng, {
        radius: 10, weight: 3, color: '#0f2557', fillColor: '#0d9488', fillOpacity: 0.9
      }).addTo(map);
      layer.bindPopup(function () { return esc(labelFn()); });
      selection = { layer: layer, label: labelFn };
      layer.openPopup();
    }
    function clearSelection() {
      if (selection) { map.removeLayer(selection.layer); selection = null; }
    }

    // ---------- province / district selects ----------
    var provSel = $('map-province'), distSel = $('map-district');

    function fillProvinces() {
      var cur = provSel.value;
      provSel.innerHTML = '';
      provSel.appendChild(new Option(t('map.all'), ''));
      D.provinces.forEach(function (p) { provSel.appendChild(new Option(nameOf(p), p.id)); });
      provSel.value = cur;
    }
    function fillDistricts() {
      var cur = distSel.value, pid = provSel.value;
      distSel.innerHTML = '';
      distSel.appendChild(new Option(t('map.alld'), ''));
      function add(parent, d, idx) {
        parent.appendChild(new Option(lang() === 'ne' ? d[2] : d[1], String(idx)));
      }
      if (pid) {
        D.districts.forEach(function (d, i) { if (d[0] === pid) add(distSel, d, i); });
      } else {
        D.provinces.forEach(function (p) {
          var g = document.createElement('optgroup'); g.label = nameOf(p);
          D.districts.forEach(function (d, i) { if (d[0] === p.id) add(g, d, i); });
          distSel.appendChild(g);
        });
      }
      distSel.value = cur;
      if (distSel.value !== cur) distSel.value = '';
    }
    function provinceById(id) { return D.provinces.filter(function (p) { return p.id === id; })[0]; }

    provSel.addEventListener('change', function () {
      distSel.value = '';
      fillDistricts();
      clearSelection();
      var p = provinceById(provSel.value);
      if (p) map.flyTo(p.c, p.z); else map.flyTo(D.center, D.zoom);
    });
    distSel.addEventListener('change', function () {
      if (distSel.value === '') return;
      var d = D.districts[Number(distSel.value)];
      provSel.value = d[0];
      var keep = distSel.value; fillDistricts(); distSel.value = keep;
      map.flyTo([d[3], d[4]], 11);
      var idx = Number(keep);
      showSelection([d[3], d[4]], function () {
        var dd = D.districts[idx], pp = provinceById(dd[0]);
        return (lang() === 'ne' ? dd[2] : dd[1]) + ' · ' + nameOf(pp);
      });
    });

    $('map-reset').addEventListener('click', function () {
      provSel.value = ''; fillDistricts(); distSel.value = '';
      clearSelection(); clearResults();
      map.flyTo(D.center, D.zoom);
    });

    // ---------- place search (OpenStreetMap Nominatim, Nepal only) ----------
    var form = $('map-search-form'), input = $('map-search-input');
    var status = $('map-search-status'), list = $('map-results');
    var controller = null;

    function clearResults() { list.innerHTML = ''; status.textContent = ''; }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var q = input.value.trim();
      if (q.length < 2) return;
      if (controller) controller.abort();
      controller = new AbortController();
      list.innerHTML = '';
      status.textContent = t('map.search.loading');
      var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&countrycodes=np' +
        '&accept-language=' + encodeURIComponent(lang()) + '&q=' + encodeURIComponent(q);
      fetch(url, { signal: controller.signal })
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (rows) {
          if (!rows.length) { status.textContent = t('map.search.none'); return; }
          status.textContent = t('map.search.results') + ': ' + rows.length;
          rows.forEach(function (r) {
            var li = document.createElement('li');
            var b = document.createElement('button');
            b.type = 'button'; b.textContent = r.display_name;
            b.addEventListener('click', function () { goToResult(r); });
            li.appendChild(b); list.appendChild(li);
          });
        })
        .catch(function (err) {
          if (err && err.name === 'AbortError') return;
          status.textContent = t('map.search.error');
        });
    });
    function goToResult(r) {
      var ll = [parseFloat(r.lat), parseFloat(r.lon)];
      if (r.boundingbox && r.boundingbox.length === 4) {
        var bb = r.boundingbox.map(parseFloat); // [south, north, west, east]
        map.flyToBounds([[bb[0], bb[2]], [bb[1], bb[3]]], { maxZoom: 16 });
      } else { map.flyTo(ll, 15); }
      var label = r.display_name;
      showSelection(ll, function () { return label; });
    }

    // ---------- my location (stays in the browser, nothing is sent anywhere) ----------
    $('map-locate').addEventListener('click', function () {
      if (!navigator.geolocation) { status.textContent = t('map.locate.err'); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        var ll = [pos.coords.latitude, pos.coords.longitude];
        map.flyTo(ll, 15);
        showSelection(ll, function () { return t('map.locate.here'); });
      }, function () { status.textContent = t('map.locate.err'); }, { timeout: 10000 });
    });

    // ---------- sample pins + legend ----------
    var haveCluster = typeof L.markerClusterGroup === 'function';
    var haveHeat = typeof L.heatLayer === 'function';
    var samples = (haveCluster ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 }) : L.layerGroup()).addTo(map);
    var heat = haveHeat ? L.heatLayer([], { radius: 28, blur: 22, maxZoom: 11, minOpacity: 0.35 }) : null;
    if (!haveHeat) { var hl = $('map-heat-label'); if (hl) hl.hidden = true; }
    var DAY = 86400000;
    function visibleReports() {
      var c = $('map-f-cat').value, st = $('map-f-status').value, per = Number($('map-f-period').value) || 0;
      var since = per ? Date.now() - per * DAY : 0;
      return window.NDStore.all().filter(function (r) {
        return (!c || r.cat === c) && (!st || r.status === st) && (!since || new Date(r.created).getTime() >= since);
      });
    }
    function popupFor(r) {
      var C = window.NDCatalog, S = window.NDStore;
      var wrap = document.createElement('div');
      function line(label, value, strong) {
        var d = document.createElement('div');
        var b = document.createElement(strong ? 'strong' : 'span'); b.textContent = (label ? label + ': ' : '') + value;
        d.appendChild(b); wrap.appendChild(d);
      }
      line('', r.ref, true);
      line('', S.text(r.title), true);
      line(t('f.category'), C.categoryName(r.cat));
      line(t('f.location'), S.districtName(r.district) + ', ' + S.provinceName(r.province));
      line(t('f.status'), t('status.' + r.status));
      line(t('f.submitted'), new Date(r.created).toLocaleDateString(lang() === 'ne' ? 'ne-NP' : 'en-GB'));
      var em = document.createElement('em'); em.textContent = t('f.demonote'); wrap.appendChild(em);
      var a = document.createElement('a'); a.href = 'track.html?ref=' + encodeURIComponent(r.ref);
      a.textContent = t('map.viewdetails'); a.style.cssText = 'display:block;margin-top:.4rem;font-weight:600';
      wrap.appendChild(a);
      return wrap;
    }
    function renderSamples() {
      samples.clearLayers();
      var list = visibleReports(), pts = [];
      list.forEach(function (r) {
        var ll = window.NDStore.publicPoint(r); // rounded (~1 km) for privacy
        var m = L.circleMarker(ll, { radius: 9, weight: 2, color: '#ffffff', fillColor: STATUS_COLORS[r.status] || '#64748b', fillOpacity: 0.95 });
        m.bindPopup(function () { return popupFor(r); });
        samples.addLayer(m); pts.push([ll[0], ll[1], 1]);
      });
      if (heat) heat.setLatLngs(pts);
      $('map-count').textContent = t('map.count').replace('%1', list.length).replace('%2', window.NDStore.all().length);
    }
    function fillFilters() {
      function setOpts(sel, items) { var cur = sel.value; sel.innerHTML = ''; sel.appendChild(new Option(t('map.f.all'), '')); items.forEach(function (it) { sel.appendChild(new Option(it[1], it[0])); }); sel.value = cur; if (sel.value !== cur) sel.value = ''; }
      setOpts($('map-f-cat'), window.NDCatalog.categories.map(function (c) { return [c.id, window.NDCatalog.categoryName(c.id)]; }));
      setOpts($('map-f-status'), window.NDCatalog.statuses.map(function (x) { return [x.id, t('status.' + x.id)]; }));
      var per = $('map-f-period'), cur = per.value; per.innerHTML = '';
      [['', 'st.p.all'], ['30', 'st.p.30'], ['90', 'st.p.90'], ['180', 'st.p.180']].forEach(function (o) { per.appendChild(new Option(t(o[1]), o[0])); });
      per.value = cur;
    }
    ['map-f-cat', 'map-f-status', 'map-f-period'].forEach(function (id) { $(id).addEventListener('change', renderSamples); });
    var heatToggle = $('map-heat-toggle');
    heatToggle.addEventListener('change', function () { if (!heat) return; if (heatToggle.checked) heat.addTo(map); else map.removeLayer(heat); });
    var toggle = $('map-demo-toggle');
    toggle.addEventListener('change', function () {
      if (toggle.checked) { map.addLayer(samples); } else { map.removeLayer(samples); }
    });
    function renderLegend() {
      var box = $('map-legend-items'); box.innerHTML = '';
      Object.keys(STATUS_COLORS).forEach(function (k) {
        var li = document.createElement('li');
        var dot = document.createElement('span'); dot.className = 'dot'; dot.style.background = STATUS_COLORS[k];
        li.appendChild(dot); li.appendChild(document.createTextNode(' ' + t('status.' + k)));
        box.appendChild(li);
      });
    }

    // ---------- language changes ----------
    function refresh() {
      fillProvinces(); fillDistricts(); fillFilters(); renderSamples(); renderLegend(); basemaps.renderControl();
      mapEl.setAttribute('aria-label', t('map.aria'));
      input.setAttribute('placeholder', t('map.search.ph'));
      if (selection) selection.layer.setPopupContent(esc(selection.label()));
    }
    document.addEventListener('nd:langchange', refresh);
    document.addEventListener('nd:datachange', renderSamples);
    refresh();
  });
})();
