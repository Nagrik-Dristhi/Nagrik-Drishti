// Nagarik Drishti — LIVE data layer (Google Sheets via Apps Script). Used only when ND_CONFIG.API_URL is set.
// Keeps the same synchronous read API as the demo store (all/get/mine...) backed by an in-memory copy that is
// refreshed from the sheet, so every page keeps working. Writes go to the server and return Promises.
(function () {
  var cfg = window.ND_CONFIG || {};
  if (!cfg.API_URL) return;
  var CK = 'nd-live-cache-v1', MK = 'nd-mine-v1', DAY = 86400000;
  var state = { reports: [], config: { accepting: true, announcement: null }, error: false, loaded: false };
  var mine = [];
  try { var c = JSON.parse(localStorage.getItem(CK) || 'null'); if (c && Array.isArray(c.reports)) { state.reports = c.reports; state.config = c.config || state.config; } } catch (e) { }
  try { mine = JSON.parse(localStorage.getItem(MK) || '[]'); if (!Array.isArray(mine)) mine = []; } catch (e) { mine = []; }
  function saveMine() { try { localStorage.setItem(MK, JSON.stringify(mine.slice(-200))); } catch (e) { } }
  function saveCache() { try { localStorage.setItem(CK, JSON.stringify({ reports: state.reports, config: state.config })); } catch (e) { } }
  function flag() { state.reports.forEach(function (r) { r.mine = mine.indexOf(r.ref) !== -1; r.demo = false; }); }
  flag();
  function changed() { document.dispatchEvent(new CustomEvent('nd:datachange')); }

  function timeout(ms) { var c = new AbortController(); setTimeout(function () { c.abort(); }, ms); return c.signal; }
  function get(q) { return fetch(cfg.API_URL + (cfg.API_URL.indexOf('?') < 0 ? '?' : '&') + q, { signal: timeout(25000) }).then(function (r) { return r.json(); }); }
  // text/plain keeps this a "simple" CORS request (Apps Script web apps do not answer preflights)
  function post(body) { return fetch(cfg.API_URL, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: timeout(45000) }).then(function (r) { return r.json(); }); }

  var inflight = null;
  function refresh() {
    if (inflight) return inflight;
    inflight = get('action=list&_=' + Date.now()).then(function (res) {
      if (!res || !res.ok) throw new Error('bad');
      state.reports = res.reports; state.config = res.config || state.config; state.error = false; state.loaded = true; flag(); saveCache();
    }).catch(function () { state.error = true; }).then(function () { inflight = null; changed(); });
    return inflight;
  }

  function lang() { return window.NDLang ? window.NDLang.get() : 'en'; }
  function text(v) { return (v && typeof v === 'object') ? (lang() === 'ne' ? v.ne : v.en) : (v || ''); }
  function districtRow(name) { var ds = window.ND_NEPAL.districts; for (var i = 0; i < ds.length; i++) if (ds[i][1] === name) return ds[i]; return null; }
  function haversine(a, b) {
    var R = 6371000, rad = Math.PI / 180, dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  var api = {
    demo: false, refresh: refresh, config: function () { return state.config; }, error: function () { return state.error; },
    all: function () { return state.reports.slice(); },
    get: function (ref) { ref = String(ref || '').trim().toUpperCase(); for (var i = 0; i < state.reports.length; i++) if (state.reports[i].ref === ref) return state.reports[i]; return null; },
    mine: function () { return state.reports.filter(function (r) { return r.mine; }).sort(function (a, b) { return a.created < b.created ? 1 : -1; }); },
    create: function (f) {
      var cat = window.NDCatalog.category(f.cat), b = window.ND_NEPAL.bounds, lat = Number(f.lat), lng = Number(f.lng);
      if (!cat || !cat.subs.some(function (s) { return s[0] === f.sub; }) || !isFinite(lat) || !isFinite(lng) || lat < b[0][0] || lat > b[1][0] || lng < b[0][1] || lng > b[1][1]) return Promise.reject(new Error('invalid'));
      var body = { action: 'create', title: f.title, desc: f.desc, cat: f.cat, sub: f.sub, province: f.province, district: f.district, local: f.local,
        ward: f.ward, lat: lat, lng: lng, observed: f.observed, contact: f.contact, image: f.image || null, hp: f.hp || '' };
      return post(body).then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'failed');
        var r = res.report; r.mine = true; r.demo = false;
        // keep the exact position locally for the person who sent it (the public copy is rounded)
        r.lat = lat; r.lng = lng;
        state.reports.push(r); mine.push(r.ref); saveMine(); saveCache(); changed();
        return { report: r, imageDropped: !!res.imageDropped };
      });
    },
    advance: function () { return null; }, canAdvance: function () { return false; }, reset: function () { }, clearMine: function () { mine = []; saveMine(); flag(); changed(); },
    publicPoint: function (r) { return [Math.round(r.lat * 100) / 100, Math.round(r.lng * 100) / 100]; },
    distanceM: haversine,
    nearby: function () { return []; },
    nearbyAsync: function (lat, lng, cat, days, radius, except) {
      return get('action=nearby&lat=' + lat + '&lng=' + lng + '&cat=' + encodeURIComponent(cat)).then(function (res) {
        return (res && res.ok ? res.near : []).filter(function (r) { return r.ref !== except; });
      }).catch(function () { return []; });
    },
    latestEvent: function (r) { return r.events[r.events.length - 1]; },
    text: text,
    provinceName: function (id) { var ps = window.ND_NEPAL.provinces; for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return lang() === 'ne' ? ps[i].ne : ps[i].en; return ''; },
    districtName: function (en) { var d = districtRow(en); return d ? (lang() === 'ne' ? d[2] : d[1]) : en; },
    locationText: function (r) { return text(r.local) + ', ' + (lang() === 'ne' ? 'वडा ' : 'Ward ') + r.ward + ', ' + api.districtName(r.district) + ', ' + api.provinceName(r.province); },
    provinceOf: function (n) { var d = districtRow(n); return d ? d[0] : ''; }
  };
  window.NDStore = api;
  document.addEventListener('DOMContentLoaded', function () {
    refresh();
    document.addEventListener('visibilitychange', function () { if (!document.hidden) refresh(); });
    setInterval(function () { if (!document.hidden) refresh(); }, 90000);
  });
})();
