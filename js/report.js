// Nagarik Drishti — Report an Issue (DEMO: saved only in this browser).
// All user text is written with textContent / value, never innerHTML.
(function () {
  var D = window.ND_NEPAL, C = window.NDCatalog, S = window.NDStore;
  var $ = function (id) { return document.getElementById(id); };
  function lang() { return window.NDLang.get(); }
  function t(k) { return window.NDLang.t(k); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function el(tag, text, cls) { var e = document.createElement(tag); if (text != null) e.textContent = text; if (cls) e.className = cls; return e; }

  var state = { lat: null, lng: null, image: null };
  var lastErrors = [];
  var dupCount = 0, dupToken = 0, sending = false;
  var map = null, marker = null, basemaps = null;

  document.addEventListener('DOMContentLoaded', function () {
    var form = $('rep-form'); if (!form) return;
    $('f-observed').max = todayStr();

    // ---------- selects ----------
    function setOptions(sel, first, items, keep) {
      var cur = keep ? sel.value : '';
      sel.innerHTML = '';
      sel.appendChild(new Option(first, ''));
      items.forEach(function (it) { sel.appendChild(new Option(it[1], it[0])); });
      sel.value = cur; if (sel.value !== cur) sel.value = '';
    }
    function fillCategories() {
      setOptions($('f-cat'), t('rep.choose'), C.categories.map(function (c) { return [c.id, C.categoryName(c.id)]; }), true);
    }
    function fillSubs() {
      var c = C.category($('f-cat').value);
      setOptions($('f-sub'), t('rep.choose'), c ? c.subs.map(function (s) { return [s[0], C.subName(c.id, s[0])]; }) : [], true);
    }
    function fillProvinces() {
      setOptions($('f-province'), t('rep.choose'), D.provinces.map(function (p) { return [p.id, lang() === 'ne' ? p.ne : p.en]; }), true);
    }
    function fillDistricts() {
      var pid = $('f-province').value;
      setOptions($('f-district'), t('rep.choose'), D.districts.filter(function (d) { return d[0] === pid; })
        .map(function (d) { return [d[1], lang() === 'ne' ? d[2] : d[1]]; }), true);
    }
    // Local government: a dropdown only if a verified dataset (window.ND_LOCAL_LEVELS) is supplied; otherwise free text.
    function renderLocal() {
      var box = $('local-input'), keep = $('f-local') ? $('f-local').value : '';
      var list = window.ND_LOCAL_LEVELS && window.ND_LOCAL_LEVELS[$('f-district').value];
      box.innerHTML = '';
      var ctl;
      if (list && list.length) {
        ctl = document.createElement('select');
        ctl.appendChild(new Option(t('rep.choose'), ''));
        list.forEach(function (n) { ctl.appendChild(new Option(n, n)); });
      } else { ctl = document.createElement('input'); ctl.type = 'text'; ctl.maxLength = 80; ctl.autocomplete = 'off'; }
      ctl.id = 'f-local'; ctl.setAttribute('aria-describedby', 'h-local err-local');
      box.appendChild(ctl); ctl.value = keep; if (ctl.tagName === 'SELECT' && ctl.value !== keep) ctl.value = '';
    }
    function districtCentre() {
      var n = $('f-district').value; if (!n) return null;
      for (var i = 0; i < D.districts.length; i++) if (D.districts[i][1] === n) return [D.districts[i][3], D.districts[i][4]];
      return null;
    }

    $('f-cat').addEventListener('change', function () { fillSubs(); updateDuplicates(); });
    $('f-province').addEventListener('change', function () {
      fillDistricts(); renderLocal();
      for (var i = 0; i < D.provinces.length; i++) if (D.provinces[i].id === $('f-province').value && map) map.flyTo(D.provinces[i].c, D.provinces[i].z);
    });
    $('f-district').addEventListener('change', function () {
      renderLocal(); var c = districtCentre();
      if (c && map && state.lat == null) map.flyTo(c, 11);
      checkFar();
    });

    // ---------- map picker ----------
    var libMissing = typeof L === 'undefined';
    if (libMissing) { $('rep-lib-error').hidden = false; }
    else {
      map = L.map('rep-map', { center: D.center, zoom: D.zoom, minZoom: 6, maxZoom: 19, maxBounds: D.bounds, maxBoundsViscosity: 0.8 });
      basemaps = NDBasemaps.install(map, { errorId: 'rep-tile-error' });
      $('rep-map').setAttribute('aria-label', t('rep.loc.title'));
      map.on('click', function (e) { setPoint(e.latlng.lat, e.latlng.lng, false); });
    }

    function inNepal(lat, lng) { return lat >= D.bounds[0][0] && lat <= D.bounds[1][0] && lng >= D.bounds[0][1] && lng <= D.bounds[1][1]; }
    function setPoint(lat, lng, fly) {
      lat = Number(lat); lng = Number(lng);
      if (!isFinite(lat) || !isFinite(lng) || !inNepal(lat, lng)) { showWarn(t('rep.loc.outside')); return; }
      state.lat = Math.round(lat * 1e6) / 1e6; state.lng = Math.round(lng * 1e6) / 1e6;
      if (map) {
        if (marker) map.removeLayer(marker);
        marker = L.circleMarker([state.lat, state.lng], { radius: 11, weight: 3, color: '#0f2557', fillColor: '#dc2626', fillOpacity: 0.9 }).addTo(map);
        if (fly) map.flyTo([state.lat, state.lng], Math.max(map.getZoom(), 15));
      }
      $('f-lat').value = state.lat; $('f-lng').value = state.lng;
      $('loc-status').textContent = t('rep.loc.set') + ': ' + state.lat.toFixed(5) + ', ' + state.lng.toFixed(5);
      showFieldError('location', null);
      checkFar(); updateDuplicates();
    }
    function showWarn(msg) { var w = $('loc-warn'); w.textContent = msg || ''; w.hidden = !msg; }
    function checkFar() {
      var c = districtCentre();
      if (state.lat == null || !c) { if (state.lat != null) showWarn(''); return; }
      showWarn(S.distanceM([state.lat, state.lng], c) > 100000 ? t('rep.loc.far') : '');
    }

    $('loc-apply').addEventListener('click', function () { setPoint($('f-lat').value, $('f-lng').value, true); });
    $('loc-device').addEventListener('click', function () {
      if (!navigator.geolocation) { $('loc-search-status').textContent = t('rep.loc.devErr'); return; }
      navigator.geolocation.getCurrentPosition(function (p) { setPoint(p.coords.latitude, p.coords.longitude, true); },
        function () { $('loc-search-status').textContent = t('rep.loc.devErr'); }, { timeout: 10000 });
    });

    // address search (OpenStreetMap Nominatim, Nepal only; sent only when the user presses Search)
    var ctrl = null;
    function runSearch() {
      var q = $('loc-q').value.trim(); if (q.length < 2) return;
      if (ctrl) ctrl.abort(); ctrl = new AbortController();
      var list = $('loc-results'), st = $('loc-search-status'); list.innerHTML = ''; st.textContent = t('map.search.loading');
      fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&countrycodes=np&accept-language=' + encodeURIComponent(lang()) + '&q=' + encodeURIComponent(q), { signal: ctrl.signal })
        .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
        .then(function (rows) {
          if (!rows.length) { st.textContent = t('map.search.none'); return; }
          st.textContent = t('map.search.results') + ': ' + rows.length;
          rows.forEach(function (r) {
            var li = document.createElement('li'), b = el('button', r.display_name); b.type = 'button';
            b.addEventListener('click', function () { setPoint(parseFloat(r.lat), parseFloat(r.lon), true); list.innerHTML = ''; });
            li.appendChild(b); list.appendChild(li);
          });
        })
        .catch(function (e) { if (!e || e.name !== 'AbortError') st.textContent = t('map.search.error'); });
    }
    $('loc-search-btn').addEventListener('click', runSearch);
    $('loc-q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });

    // ---------- duplicate warning ----------
    function updateDuplicates() {
      var box = $('dup-box'), list = $('dup-list'), cat = $('f-cat').value;
      list.innerHTML = ''; dupCount = 0;
      box.hidden = true; $('rep-submit').textContent = t('rep.submit');
      if (state.lat != null && cat) {
        var token = ++dupToken;
        S.nearbyAsync(state.lat, state.lng, cat, 90, 300).then(function (near) {
          if (token !== dupToken) return; // a newer lookup replaced this one
          list.innerHTML = ''; dupCount = near.length;
          near.slice(0, 5).forEach(function (r) {
            var li = document.createElement('li'), a = el('a', r.ref + ' — ' + S.text(r.title));
            a.href = 'track.html?ref=' + encodeURIComponent(r.ref); a.target = '_blank'; a.rel = 'noopener';
            li.appendChild(a); list.appendChild(li);
          });
          box.hidden = dupCount === 0;
          $('rep-submit').textContent = t(dupCount ? 'rep.submit.anyway' : 'rep.submit');
        });
      }
    }

    // ---------- photo (re-encoded to a small JPEG: strips EXIF/GPS metadata) ----------
    var TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    $('f-photo').addEventListener('change', function () {
      var f = this.files && this.files[0]; showFieldError('photo', null); clearPhoto(true);
      if (!f) return;
      if (TYPES.indexOf(f.type) === -1) { showFieldError('photo', 'err.photo.type'); this.value = ''; return; }
      if (f.size > 2 * 1024 * 1024) { showFieldError('photo', 'err.photo.size'); this.value = ''; return; }
      var url = URL.createObjectURL(f), img = new Image();
      img.onload = function () {
        var max = 800, k = Math.min(1, max / Math.max(img.width, img.height));
        var cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(img.width * k)); cv.height = Math.max(1, Math.round(img.height * k));
        var ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, 0, 0, cv.width, cv.height);
        state.image = cv.toDataURL('image/jpeg', 0.72); URL.revokeObjectURL(url);
        $('photo-img').src = state.image; $('photo-preview').hidden = false;
      };
      img.onerror = function () { URL.revokeObjectURL(url); showFieldError('photo', 'err.photo.read'); };
      img.src = url;
    });
    function clearPhoto(keepInput) { state.image = null; $('photo-preview').hidden = true; $('photo-img').removeAttribute('src'); if (!keepInput) $('f-photo').value = ''; }
    $('photo-remove').addEventListener('click', function () { clearPhoto(false); });

    // ---------- validation ----------
    var FIELD_ID = { location: 'rep-map' };
    function fid(name) { return FIELD_ID[name] || 'f-' + name; }
    function showFieldError(name, key) {
      var p = $('err-' + name); if (!p) return;
      p.hidden = !key; p.textContent = key ? t(key) : ''; p.setAttribute('data-key', key || '');
      var c = $(fid(name)); if (c && name !== 'location') { if (key) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid'); }
    }
    function validate() {
      var errs = [], v = function (id) { var e = $(id); return e ? e.value.trim() : ''; };
      if (v('f-title').length < 5) errs.push(['title', 'err.title']);
      if (!v('f-cat')) errs.push(['cat', 'err.cat']);
      if (!v('f-sub')) errs.push(['sub', 'err.sub']);
      if (v('f-desc').length < 20) errs.push(['desc', 'err.desc']);
      var ob = v('f-observed');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(ob) || ob > todayStr() || ob < '2000-01-01') errs.push(['observed', 'err.observed']);
      if (!v('f-province')) errs.push(['province', 'err.province']);
      if (!v('f-district')) errs.push(['district', 'err.district']);
      if (!v('f-local')) errs.push(['local', 'err.local']);
      var w = Number(v('f-ward'));
      if (!(Number.isInteger(w) && w >= 1 && w <= 35)) errs.push(['ward', 'err.ward']);
      if (state.lat == null) errs.push(['location', 'err.location']);
      return errs;
    }
    function renderErrors(errs, focus) {
      ['title', 'cat', 'sub', 'desc', 'observed', 'province', 'district', 'local', 'ward', 'location'].forEach(function (n) { showFieldError(n, null); });
      errs.forEach(function (e) { showFieldError(e[0], e[1]); });
      var box = $('rep-errors'); box.innerHTML = '';
      if (!errs.length) { box.hidden = true; return; }
      box.appendChild(el('strong', t('rep.errs')));
      var ul = document.createElement('ul');
      errs.forEach(function (e) {
        var li = document.createElement('li'), a = el('a', t(e[1])); a.href = '#' + fid(e[0]);
        a.addEventListener('click', function (ev) { ev.preventDefault(); var c = $(fid(e[0])); if (c) c.focus(); });
        li.appendChild(a); ul.appendChild(li);
      });
      box.appendChild(ul); box.hidden = false; if (focus) box.focus();
    }

    // ---------- submit ----------
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      lastErrors = validate(); renderErrors(lastErrors, true);
      if (lastErrors.length) return;
      if (sending) return;
      if (S.config && !S.config().accepting) { renderErrors([['title', 'live.closed']], true); return; }
      var contact = form.querySelector('input[name="contact"]:checked'), btn = $('rep-submit'), label = btn.textContent;
      sending = true; btn.disabled = true; if (!S.demo) btn.textContent = t('live.sending');
      S.create({
        title: $('f-title').value, cat: $('f-cat').value, sub: $('f-sub').value, desc: $('f-desc').value,
        observed: $('f-observed').value, province: $('f-province').value, district: $('f-district').value,
        local: $('f-local').value, ward: $('f-ward').value, lat: state.lat, lng: state.lng,
        image: state.image, contact: contact ? contact.value : 'none', hp: $('f-website') ? $('f-website').value : ''
      }).then(function (res) { showDone(res.report, res.imageDropped); })
        .catch(function (e) { renderErrors([['title', e && e.message === 'closed' ? 'live.closed' : (S.demo ? 'err.save' : 'live.fail')]], true); })
        .then(function () { sending = false; btn.disabled = false; btn.textContent = label; });
    });

    function showDone(r, imageDropped) {
      $('rep-view-form').hidden = true; $('rep-view-done').hidden = false;
      $('done-ref').textContent = r.ref; $('done-track').href = 'track.html?ref=' + encodeURIComponent(r.ref);
      $('done-noimg').hidden = !imageDropped;
      var dl = $('done-summary'); dl.innerHTML = '';
      [[t('f.category'), C.categoryName(r.cat) + ' — ' + C.subName(r.cat, r.sub)], [t('f.location'), S.locationText(r)],
       [t('f.status'), t('status.' + r.status)], [t('f.submitted'), new Date(r.created).toLocaleString(lang() === 'ne' ? 'ne-NP' : 'en-GB')]]
        .forEach(function (row) { var d = document.createElement('div'); d.appendChild(el('dt', row[0])); d.appendChild(el('dd', row[1])); dl.appendChild(d); });
      window.scrollTo({ top: 0 });
      $('done-ref').setAttribute('tabindex', '-1'); $('done-ref').focus();
    }
    $('done-copy').addEventListener('click', function () {
      var btn = this, ref = $('done-ref').textContent;
      function ok() { btn.textContent = t('rep.done.copied'); setTimeout(function () { btn.textContent = t('rep.done.copy'); }, 1500); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ref).then(ok, function () {});
    });
    $('done-another').addEventListener('click', function () {
      form.reset(); state.lat = state.lng = null; clearPhoto(false);
      if (marker && map) { map.removeLayer(marker); marker = null; }
      $('loc-status').textContent = ''; showWarn(''); $('loc-results').innerHTML = ''; $('loc-search-status').textContent = '';
      fillSubs(); fillDistricts(); renderLocal(); renderErrors([], false); updateDuplicates();
      $('rep-view-done').hidden = true; $('rep-view-form').hidden = false; window.scrollTo({ top: 0 });
    });

    // ---------- language ----------
    function refresh() {
      fillCategories(); fillSubs(); fillProvinces(); fillDistricts(); renderLocal();
      if (basemaps) basemaps.renderControl();
      if (map) $('rep-map').setAttribute('aria-label', t('rep.loc.title'));
      if (state.lat != null) $('loc-status').textContent = t('rep.loc.set') + ': ' + state.lat.toFixed(5) + ', ' + state.lng.toFixed(5);
      else $('loc-status').textContent = t('rep.loc.none');
      if (lastErrors.length) renderErrors(validate(), false);
      updateDuplicates();
    }
    document.addEventListener('nd:langchange', refresh);
    refresh();
    var preCat = new URLSearchParams(location.search).get('cat');
    if (preCat && C.category(preCat)) { $('f-cat').value = preCat; fillSubs(); }
  });
})();
