// Nagarik Drishti — DEMO data layer.
// Everything here is SIMULATED and stored only in this browser (localStorage).
// This is the only module that touches storage; replace it with a REST client for a real backend.
(function () {
  if (window.ND_CONFIG && window.ND_CONFIG.API_URL) return; // live mode: js/store.js is used instead
  var KEY = 'nd-demo-v1';
  var VERSION = 2;
  var DAY = 86400000;
  var NEXT = { reported: 'review', review: 'verified', verified: 'assigned', assigned: 'progress', progress: 'resolved', info: 'review', reopened: 'review' };
  var PATHS = {
    reported: ['reported'], review: ['reported', 'review'], verified: ['reported', 'review', 'verified'],
    assigned: ['reported', 'review', 'verified', 'assigned'], progress: ['reported', 'review', 'verified', 'assigned', 'progress'],
    resolved: ['reported', 'review', 'verified', 'assigned', 'progress', 'resolved'],
    rejected: ['reported', 'review', 'rejected'], duplicate: ['reported', 'review', 'duplicate'], info: ['reported', 'review', 'info'],
    reopened: ['reported', 'review', 'verified', 'assigned', 'progress', 'resolved', 'reopened']
  };

  // [title en, title ne, category, subcategory, district, [dLat, dLng], local government, ward, status, days ago, desc en, desc ne]
  var SEED = [
    ['Pothole near the market junction', 'बजार चोकमा सडकको खाल्डो', 'roads', 'potholes', 'Kathmandu', [-0.012, 0.018], 'Kathmandu Metropolitan City', 6, 'progress', 21,
      'A deep pothole has formed at the junction and vehicles swerve to avoid it.', 'चोकमा गहिरो खाल्डो बनेको छ र सवारीहरू त्यसलाई जोगिन घुम्नुपर्छ।'],
    ['Streetlights out along the lakeside road', 'लेकसाइड सडकमा बत्ती बिग्रिएको', 'power', 'streetlight', 'Kaski', [-0.004, -0.02], 'Pokhara Metropolitan City', 6, 'assigned', 9,
      'Several streetlights have not worked for two weeks, making the walkway dark at night.', 'धेरै सडक बत्ती दुई हप्तादेखि बलेका छैनन्, राति बाटो अँध्यारो हुन्छ।'],
    ['Blocked drain after heavy rain', 'भारी वर्षापछि ढल जाम', 'water', 'drain', 'Morang', [0.006, 0.01], 'Biratnagar Metropolitan City', 4, 'review', 3,
      'Rainwater is standing on the road because the side drain is blocked with waste.', 'किनारको ढल फोहोरले जाम भएकाले सडकमा पानी जमेको छ।'],
    ['Uncollected waste at the roadside', 'सडक छेउमा फोहोर सङ्कलन भएन', 'waste', 'collect', 'Parsa', [0.004, -0.006], 'Birgunj Metropolitan City', 12, 'reported', 1,
      'Waste has not been collected here for several days.', 'यहाँ धेरै दिनदेखि फोहोर सङ्कलन भएको छैन।'],
    ['Leaking public water pipe', 'सार्वजनिक खानेपानी पाइप चुहावट', 'water', 'leak', 'Banke', [0.008, -0.012], 'Nepalgunj Sub-Metropolitan City', 5, 'resolved', 40,
      'A main pipe was leaking clean water into the street.', 'मुख्य पाइपबाट सफा पानी सडकमा बगिरहेको थियो।'],
    ['Damaged railing on the river bridge', 'नदी पुलको रेलिङ क्षतिग्रस्त', 'roads', 'bridge', 'Kailali', [-0.01, 0.015], 'Dhangadhi Sub-Metropolitan City', 3, 'verified', 6,
      'Part of the bridge railing is broken and unsafe for pedestrians.', 'पुलको रेलिङको एक भाग भाँचिएको छ र पैदलयात्रीका लागि असुरक्षित छ।'],
    ['Fallen tree blocking the footpath', 'ढलेको रुखले पैदलमार्ग रोक्यो', 'env', 'trees', 'Chitwan', [0.005, 0.009], 'Bharatpur Metropolitan City', 10, 'resolved', 15,
      'A large tree fell during the storm and blocks the footpath.', 'आँधीमा ठुलो रुख ढलेर पैदलमार्ग अवरुद्ध भएको छ।'],
    ['Unsafe pedestrian crossing near a school', 'विद्यालय नजिक असुरक्षित पैदल क्रसिङ', 'access', 'crossing', 'Sunsari', [0.003, -0.004], 'Itahari Sub-Metropolitan City', 2, 'review', 4,
      'Children cross a busy road with no marked crossing.', 'बालबालिका चिन्ह नभएको व्यस्त सडक पार गर्छन्।'],
    ['Broken bus shelter', 'बिग्रिएको बस प्रतीक्षालय', 'facilities', 'shelter', 'Rupandehi', [-0.006, 0.011], 'Butwal Sub-Metropolitan City', 8, 'info', 7,
      'The roof of the bus shelter has collapsed.', 'बस प्रतीक्षालयको छाना खसेको छ।'],
    ['Hanging electrical wires', 'झुण्डिएका विद्युत् तार', 'power', 'wires', 'Lalitpur', [0.004, 0.008], 'Lalitpur Metropolitan City', 9, 'progress', 12,
      'Low-hanging wires over a busy lane are a safety risk.', 'व्यस्त गल्लीमाथि झुण्डिएका तार जोखिमपूर्ण छन्।'],
    ['Damaged stone spout', 'क्षतिग्रस्त ढुङ्गेधारा', 'heritage', 'ghat', 'Bhaktapur', [0.006, -0.005], 'Bhaktapur Municipality', 7, 'verified', 11,
      'A traditional stone spout is cracked and water flow has stopped.', 'परम्परागत ढुङ्गेधारा चर्किएको छ र पानी आउन बन्द भएको छ।'],
    ['Missing ramp at a public office', 'सार्वजनिक कार्यालयमा र‍्याम्प अभाव', 'access', 'ramp', 'Dhanusha', [0.007, 0.003], 'Janakpur Sub-Metropolitan City', 14, 'assigned', 5,
      'Wheelchair users cannot enter the building because there is no ramp.', 'र‍्याम्प नभएकाले ह्वीलचेयर प्रयोगकर्ता भवनभित्र जान सक्दैनन्।'],
    ['Illegal dumping near the river bank', 'नदी किनारमा अवैध फोहोर', 'waste', 'dump', 'Makwanpur', [-0.008, -0.01], 'Hetauda Sub-Metropolitan City', 4, 'rejected', 18,
      'Waste is being dumped along the river bank.', 'नदी किनारमा फोहोर फालिँदैछ।'],
    ['Pothole report (possible duplicate)', 'खाल्डोको रिपोर्ट (सम्भावित दोहोरो)', 'roads', 'potholes', 'Kathmandu', [-0.0115, 0.0185], 'Kathmandu Metropolitan City', 6, 'duplicate', 20,
      'Same junction as an earlier pothole report.', 'अघिल्लो खाल्डो रिपोर्टकै चोक।'],
    ['Broken playground equipment', 'खेलमैदानको सामग्री भाँचिएको', 'env', 'park', 'Surkhet', [0.005, -0.007], 'Birendranagar Municipality', 6, 'reopened', 2,
      'The swing was repaired but has broken again.', 'झुला मर्मत गरिएको थियो तर फेरि भाँचियो।'],
    ['Road washed out by a landslide', 'पहिरोले सडक बगाएको', 'infra', 'landslide', 'Jumla', [0.006, 0.004], 'Chandannath Municipality', 2, 'reported', 0,
      'A section of the access road has slid down the slope.', 'पहुँच सडकको एक भाग भिरालोतिर बगेको छ।']
  ];

  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function districtRow(name) {
    var ds = (window.ND_NEPAL && window.ND_NEPAL.districts) || [];
    for (var i = 0; i < ds.length; i++) if (ds[i][1] === name) return ds[i];
    return null;
  }
  function provinceOf(name) { var d = districtRow(name); return d ? d[0] : ''; }


  // ---- Extra SIMULATED reports (deterministic) so statistics and map filters have data to show. ----
  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var HEAVY = { Kathmandu: 8, Lalitpur: 5, Bhaktapur: 4, Kaski: 5, Morang: 5, Sunsari: 4, Rupandehi: 4, Chitwan: 4, Jhapa: 4, Banke: 3, Kailali: 3, Dhanusha: 3, Parsa: 3, Surkhet: 2, Makwanpur: 2 };
  var CATW = [['roads', 4], ['water', 3], ['waste', 3], ['power', 3], ['infra', 1], ['env', 2], ['access', 1], ['heritage', 1], ['facilities', 1], ['other', 1]];
  var STW = [['reported', 9], ['review', 13], ['verified', 11], ['assigned', 14], ['progress', 16], ['resolved', 26], ['rejected', 4], ['duplicate', 3], ['reopened', 2], ['info', 4]];
  function pickW(rand, list) {
    var total = 0, i; for (i = 0; i < list.length; i++) total += list[i][1];
    var x = rand() * total; for (i = 0; i < list.length; i++) { x -= list[i][1]; if (x < 0) return list[i][0]; }
    return list[list.length - 1][0];
  }
  var TOTAL_DEMO = 120;
  function generated(startIndex, now, year) {
    var rand = rng(2026), ds = window.ND_NEPAL.districts, out = [];
    var dw = ds.map(function (d) { return [d[1], HEAVY[d[1]] || 1]; });
    for (var i = startIndex; i < TOTAL_DEMO; i++) {
      var dn = pickW(rand, dw), d = districtRow(dn), cat = window.NDCatalog.category(pickW(rand, CATW));
      var sub = cat.subs[Math.floor(rand() * cat.subs.length)], st = pickW(rand, STW);
      var ago = Math.floor(rand() * 175) + (st === 'resolved' ? 12 : 1);
      var path = PATHS[st], span = ago * DAY, created = now - span;
      var dept = path.indexOf('assigned') !== -1 ? cat.dept : null;
      var events = path.map(function (type, k) {
        var e = { type: type, at: new Date(created + span * k / path.length).toISOString() };
        if (type === 'assigned') e.dept = dept; return e;
      });
      out.push({
        ref: 'ND-' + year + '-' + pad(i + 1, 5),
        title: { en: sub[1] + ' — ' + d[1], ne: sub[2] + ' — ' + d[2] },
        desc: { en: 'Simulated report generated for demonstration charts and map testing.', ne: 'देखाउने चार्ट र नक्सा परीक्षणका लागि बनाइएको नक्कली रिपोर्ट।' },
        cat: cat.id, sub: sub[0], province: d[0], district: d[1],
        local: { en: d[1] + ' area', ne: d[2] + ' क्षेत्र' }, ward: 1 + Math.floor(rand() * 18),
        lat: d[3] + (rand() - 0.5) * 0.08, lng: d[4] + (rand() - 0.5) * 0.08,
        observed: new Date(created - DAY).toISOString().slice(0, 10), created: events[0].at,
        status: st, dept: dept, events: events, image: null, contact: 'none', demo: true, mine: false
      });
    }
    return out;
  }

  function seed() {
    var now = Date.now(), year = new Date().getFullYear();
    var reports = SEED.map(function (r, i) {
      var d = districtRow(r[4]);
      var path = PATHS[r[8]];
      var span = Math.max(r[9] * DAY, 3 * 3600000), created = now - span;
      var dept = path.indexOf('assigned') !== -1 ? window.NDCatalog.deptForCategory(r[2]) : null;
      var events = path.map(function (type, k) {
        var e = { type: type, at: new Date(created + span * k / path.length).toISOString() };
        if (type === 'assigned') e.dept = dept;
        return e;
      });
      return {
        ref: 'ND-' + year + '-' + pad(i + 1, 5),
        title: { en: r[0], ne: r[1] }, desc: { en: r[10], ne: r[11] },
        cat: r[2], sub: r[3], province: d ? d[0] : '', district: r[4], local: r[6], ward: r[7],
        lat: d ? d[3] + r[5][0] : 28.3, lng: d ? d[4] + r[5][1] : 84.1,
        observed: new Date(created - DAY).toISOString().slice(0, 10), created: events[0].at,
        status: r[8], dept: dept, events: events, image: null, contact: 'none', demo: true, mine: false
      };
    });
    reports = reports.concat(generated(reports.length, now, year));
    return { v: VERSION, seq: reports.length, reports: reports };
  }

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var s = JSON.parse(raw); if (s && s.v === VERSION && Array.isArray(s.reports)) return s; }
    } catch (e) { /* ignore */ }
    return null;
  }
  function write(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }

  var state = read();
  if (!state) { state = seed(); write(state); }

  function lang() { return window.NDLang ? window.NDLang.get() : 'en'; }
  function text(v) { return (v && typeof v === 'object') ? (lang() === 'ne' ? v.ne : v.en) : (v || ''); }
  function clip(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n); }

  function haversine(a, b) {
    var R = 6371000, rad = Math.PI / 180;
    var dLat = (b[0] - a[0]) * rad, dLng = (b[1] - a[1]) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function normRef(ref) { return String(ref || '').trim().toUpperCase(); }

  var api = {
    demo: true,
    config: function () { return { accepting: true, announcement: null }; }, error: function () { return false; }, refresh: function () { return Promise.resolve(); },
    nearbyAsync: function (a, b, c, d, e, f) { return Promise.resolve(api.nearby(a, b, c, d, e, f)); },
    all: function () { return state.reports.slice(); },
    get: function (ref) { ref = normRef(ref); for (var i = 0; i < state.reports.length; i++) if (state.reports[i].ref === ref) return state.reports[i]; return null; },
    mine: function () { return state.reports.filter(function (r) { return r.mine; }).sort(function (a, b) { return a.created < b.created ? 1 : -1; }); },

    // Server-style validation: never trust the form.
    create: function (f) {
      var cat = window.NDCatalog.category(f.cat);
      var okSub = cat && cat.subs.some(function (s) { return s[0] === f.sub; });
      var lat = Number(f.lat), lng = Number(f.lng), b = window.ND_NEPAL.bounds;
      if (!cat || !okSub || !isFinite(lat) || !isFinite(lng) || lat < b[0][0] || lat > b[1][0] || lng < b[0][1] || lng > b[1][1]) throw new Error('invalid report');
      var ward = Math.round(Number(f.ward));
      if (!(ward >= 1 && ward <= 35)) throw new Error('invalid ward');
      state.seq += 1;
      var at = new Date().toISOString();
      var r = {
        ref: 'ND-' + new Date().getFullYear() + '-' + pad(state.seq, 5),
        title: clip(f.title, 120), desc: clip(f.desc, 2000), cat: cat.id, sub: f.sub,
        province: clip(f.province, 20), district: clip(f.district, 40), local: clip(f.local, 80), ward: ward,
        lat: lat, lng: lng, observed: clip(f.observed, 10), created: at, status: 'reported', dept: null,
        events: [{ type: 'reported', at: at }],
        image: (typeof f.image === 'string' && f.image.indexOf('data:image/jpeg;base64,') === 0 && f.image.length < 400000) ? f.image : null,
        contact: f.contact === 'inapp' ? 'inapp' : 'none', demo: true, mine: true
      };
      state.reports.push(r);
      var imageDropped = false;
      if (!write(state) && r.image) { r.image = null; imageDropped = true; write(state); }
      return Promise.resolve({ report: r, imageDropped: imageDropped });
    },

    // DEMO ONLY: imitates an official action so the lifecycle can be seen.
    advance: function (ref) {
      var r = api.get(ref); if (!r) return null;
      var next = NEXT[r.status]; if (!next) return null;
      var e = { type: next, at: new Date().toISOString() };
      if (next === 'assigned') { r.dept = window.NDCatalog.deptForCategory(r.cat); e.dept = r.dept; }
      r.events.push(e); r.status = next; write(state); return r;
    },
    canAdvance: function (r) { return !!NEXT[r.status]; },

    reset: function () { state = seed(); write(state); },
    clearMine: function () { state.reports = state.reports.filter(function (r) { return !r.mine; }); write(state); },

    // Public map positions are rounded (~1 km) so a private home cannot be pinpointed.
    publicPoint: function (r) { return [Math.round(r.lat * 100) / 100, Math.round(r.lng * 100) / 100]; },
    distanceM: haversine,
    nearby: function (lat, lng, cat, days, radiusM, exceptRef) {
      var since = Date.now() - days * DAY;
      return state.reports.filter(function (r) {
        return r.ref !== exceptRef && r.cat === cat && r.status !== 'rejected' && r.status !== 'duplicate' &&
          new Date(r.created).getTime() >= since && haversine([lat, lng], [r.lat, r.lng]) <= radiusM;
      });
    },
    latestEvent: function (r) { return r.events[r.events.length - 1]; },
    text: text,
    provinceName: function (id) {
      var ps = window.ND_NEPAL.provinces;
      for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return lang() === 'ne' ? ps[i].ne : ps[i].en;
      return '';
    },
    districtName: function (en) { var d = districtRow(en); return d ? (lang() === 'ne' ? d[2] : d[1]) : en; },
    locationText: function (r) {
      return text(r.local) + ', ' + (lang() === 'ne' ? 'वडा ' : 'Ward ') + r.ward + ', ' + api.districtName(r.district) + ', ' + api.provinceName(r.province);
    },
    provinceOf: provinceOf
  };

  window.NDStore = api;
})();
