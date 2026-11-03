/**
 * NAGARIK DRISHTI — Google Sheets backend (Google Apps Script web app)
 * ---------------------------------------------------------------
 * Stores reports in a Google Sheet, photos in Google Drive, and serves
 * a small JSON API to the website + the hidden admin panel.
 * Setup steps are in backend/SETUP.md.
 */

var T_REPORTS = 'Reports', T_AUDIT = 'Audit';
var HEAD = ['ref', 'created', 'updated', 'status', 'dept', 'cat', 'sub', 'title', 'desc', 'province', 'district',
  'local', 'ward', 'lat', 'lng', 'observed', 'contact', 'imageId', 'events', 'adminNote'];
var STATUSES = ['reported', 'review', 'verified', 'assigned', 'progress', 'resolved', 'rejected', 'duplicate', 'reopened', 'info'];
var DEPTS = ['infra', 'roads', 'water', 'waste', 'env', 'works', 'power', 'facilities'];
var CATS = {
  roads: ['potholes', 'footpath', 'signs', 'bridge', 'traffic'], water: ['leak', 'drain', 'tap', 'toilet'],
  waste: ['dump', 'collect', 'bins'], power: ['streetlight', 'wires', 'pole'], infra: ['building', 'wall', 'landslide'],
  env: ['park', 'trees', 'pollution'], access: ['ramp', 'crossing'], heritage: ['monument', 'ghat'],
  facilities: ['shelter', 'market'], other: ['other']
};
var DEPT_OF = { roads: 'roads', water: 'water', waste: 'waste', power: 'power', infra: 'infra', env: 'env', access: 'works', heritage: 'works', facilities: 'facilities', other: 'works' };
var BOUNDS = [[26.2, 79.9], [30.6, 88.4]];
var TOKEN_HOURS = 2, MAX_FAILS = 5, LOCK_MIN = 15;

/* ---------- entry points ---------- */
function doGet(e) {
  try {
    var a = (e && e.parameter && e.parameter.action) || 'list';
    if (a === 'list') return out({ ok: true, reports: readAll().map(pub), config: getConfig() });
    if (a === 'config') return out({ ok: true, config: getConfig() });
    if (a === 'nearby') return out({ ok: true, near: nearby(e.parameter) });
    if (a === 'ping') return out({ ok: true, time: new Date().toISOString() });
    return out({ ok: false, error: 'unknown_action' });
  } catch (err) { return out({ ok: false, error: 'server_error' }); }
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents || '{}');
    var a = d.action;
    if (a === 'create') return out(createReport(d));
    if (a === 'adminLogin') return out(adminLogin(d.password));
    if (!verify(d.token)) return out({ ok: false, error: 'auth' });   // everything below needs a valid admin token
    if (a === 'adminList') return out({ ok: true, reports: readAll().map(full), config: getConfig() });
    if (a === 'adminUpdate') return out(adminUpdate(d));
    if (a === 'adminBulk') return out(adminBulk(d));
    if (a === 'adminDelete') return out(adminDelete(d));
    if (a === 'adminAudit') return out({ ok: true, audit: readAudit() });
    if (a === 'adminConfig') return out(adminConfig(d));
    if (a === 'adminPassword') return out(adminPassword(d));
    if (a === 'adminRevoke') { PropertiesService.getScriptProperties().setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid()); return out({ ok: true }); }
    return out({ ok: false, error: 'unknown_action' });
  } catch (err) { return out({ ok: false, error: 'server_error' }); }
}

function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function props() { return PropertiesService.getScriptProperties(); }

/** Run this ONCE from the editor (Run ▶ setup) to create the sheets and authorise Drive access. */
function setup() {
  sheet(T_REPORTS); sheet(T_AUDIT);
  folder();
  if (!props().getProperty('SECRET')) props().setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid());
  Logger.log(props().getProperty('ADMIN_PASSWORD') ? 'Setup OK. Admin password is set.' :
    'Setup OK. NOW add a Script Property named ADMIN_PASSWORD (Project Settings → Script properties).');
}

/* ---------- sheet helpers ---------- */
function book() { var id = props().getProperty('SHEET_ID'); return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet(); }
function sheet(name) {
  var b = book(), s = b.getSheetByName(name);
  if (!s) {
    s = b.insertSheet(name);
    var h = name === T_REPORTS ? HEAD : ['time', 'action', 'refs', 'detail'];
    s.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#0c1f3d').setFontColor('#ffffff');
    s.setFrozenRows(1);
    s.getRange(2, 1, s.getMaxRows() - 1, h.length).setNumberFormat('@');   // plain text: blocks formula injection
  }
  return s;
}
function readAll() {
  var s = sheet(T_REPORTS), n = s.getLastRow();
  if (n < 2) return [];
  return s.getRange(2, 1, n - 1, HEAD.length).getValues().map(function (r, i) {
    var o = { _row: i + 2 };
    HEAD.forEach(function (k, j) { o[k] = r[j]; });
    return o;
  }).filter(function (o) { return o.ref; });
}
function writeRow(o) {
  var s = sheet(T_REPORTS), vals = [HEAD.map(function (k) { return o[k] == null ? '' : String(o[k]); })];
  var r = s.getRange(o._row, 1, 1, HEAD.length); r.setNumberFormat('@'); r.setValues(vals);
}
function findRow(ref) { var all = readAll(); for (var i = 0; i < all.length; i++) if (all[i].ref === ref) return all[i]; return null; }
function round(x, p) { var m = Math.pow(10, p); return Math.round(Number(x) * m) / m; }
function evs(o) { try { return JSON.parse(o.events) || []; } catch (e) { return []; } }
function imgUrl(id) { return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000'; }

/** What the PUBLIC may see: coordinates rounded to ~1 km, no admin notes. */
function pub(o) {
  return {
    ref: o.ref, title: o.title, desc: o.desc, cat: o.cat, sub: o.sub, province: o.province, district: o.district,
    local: o.local, ward: Number(o.ward), lat: round(o.lat, 2), lng: round(o.lng, 2), observed: o.observed,
    created: o.created, status: o.status, dept: o.dept || null, events: evs(o), image: o.imageId ? imgUrl(o.imageId) : null,
    contact: o.contact
  };
}
function full(o) {
  var p = pub(o);
  p.lat = Number(o.lat); p.lng = Number(o.lng); p.note = o.adminNote || ''; p.updated = o.updated; p.imageId = o.imageId || '';
  return p;
}

/* ---------- config (submissions on/off, announcement) ---------- */
function getConfig() {
  var c = {}; try { c = JSON.parse(props().getProperty('CONFIG') || '{}'); } catch (e) { }
  return { accepting: c.accepting !== false, announcement: c.announcement || { en: '', ne: '', level: 'info' } };
}

/* ---------- public: create a report ---------- */
function clip(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n); }
function createReport(d) {
  if (d.hp) return { ok: false, error: 'rejected' };                            // honeypot: bots fill hidden fields
  if (!getConfig().accepting) return { ok: false, error: 'closed' };
  var cache = CacheService.getScriptCache(), n = Number(cache.get('rate') || 0);
  if (n >= 120) return { ok: false, error: 'busy' };                            // global cap: 120 reports/hour
  var title = clip(d.title, 120), desc = clip(d.desc, 2000), lat = Number(d.lat), lng = Number(d.lng), ward = Math.round(Number(d.ward));
  var obs = clip(d.observed, 10);
  if (title.length < 5 || desc.length < 20 || !CATS[d.cat] || CATS[d.cat].indexOf(d.sub) < 0) return { ok: false, error: 'invalid' };
  if (!isFinite(lat) || !isFinite(lng) || lat < BOUNDS[0][0] || lat > BOUNDS[1][0] || lng < BOUNDS[0][1] || lng > BOUNDS[1][1]) return { ok: false, error: 'invalid' };
  if (!(ward >= 1 && ward <= 35) || !/^\d{4}-\d{2}-\d{2}$/.test(obs)) return { ok: false, error: 'invalid' };
  var province = clip(d.province, 20), district = clip(d.district, 40), local = clip(d.local, 80);
  if (!province || !district || !local) return { ok: false, error: 'invalid' };

  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var seq = Number(props().getProperty('SEQ') || 0) + 1; props().setProperty('SEQ', String(seq));
    var now = new Date().toISOString(), ref = 'ND-' + new Date().getFullYear() + '-' + ('00000' + seq).slice(-5);
    var imageId = '';
    if (typeof d.image === 'string' && d.image.indexOf('data:image/jpeg;base64,') === 0 && d.image.length < 400000) {
      try {
        var blob = Utilities.newBlob(Utilities.base64Decode(d.image.split(',')[1]), 'image/jpeg', ref + '.jpg');
        var f = folder().createFile(blob); f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); imageId = f.getId();
      } catch (e) { imageId = ''; }
    }
    var o = {
      _row: sheet(T_REPORTS).getLastRow() + 1, ref: ref, created: now, updated: now, status: 'reported', dept: '', cat: d.cat, sub: d.sub,
      title: title, desc: desc, province: province, district: district, local: local, ward: ward, lat: round(lat, 6), lng: round(lng, 6),
      observed: obs, contact: d.contact === 'inapp' ? 'inapp' : 'none', imageId: imageId, events: JSON.stringify([{ type: 'reported', at: now }]), adminNote: ''
    };
    writeRow(o); cache.put('rate', String(n + 1), 3600);
    return { ok: true, report: pub(o), imageDropped: !!d.image && !imageId };
  } finally { lock.releaseLock(); }
}
function folder() {
  var id = props().getProperty('FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) { } }
  var f = DriveApp.createFolder('NagarikDrishti-photos'); props().setProperty('FOLDER_ID', f.getId()); return f;
}
function nearby(p) {
  var lat = Number(p.lat), lng = Number(p.lng), since = Date.now() - 90 * 864e5, res = [];
  if (!isFinite(lat) || !isFinite(lng)) return [];
  readAll().forEach(function (o) {
    if (o.cat !== p.cat || o.status === 'rejected' || o.status === 'duplicate' || new Date(o.created).getTime() < since) return;
    if (dist(lat, lng, Number(o.lat), Number(o.lng)) <= 300) res.push({ ref: o.ref, title: o.title });
  });
  return res.slice(0, 5);
}
function dist(a, b, c, d) {
  var R = 6371000, r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r;
  var h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) * Math.sin(y / 2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ---------- admin: auth ---------- */
function sign(exp) { return exp + '.' + Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(String(exp), props().getProperty('SECRET') || 'x')); }
function verify(tok) {
  if (!tok || typeof tok !== 'string') return false;
  var exp = Number(tok.split('.')[0]);
  return isFinite(exp) && exp > Date.now() && safeEq(sign(exp), tok);
}
function safeEq(a, b) {
  a = String(a); b = String(b); var x = a.length ^ b.length;
  for (var i = 0; i < Math.max(a.length, b.length); i++) x |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return x === 0;
}
function adminLogin(pw) {
  var cache = CacheService.getScriptCache(), fails = Number(cache.get('fails') || 0), real = props().getProperty('ADMIN_PASSWORD');
  if (!real) return { ok: false, error: 'not_configured' };
  if (fails >= MAX_FAILS) return { ok: false, error: 'locked', minutes: LOCK_MIN };
  Utilities.sleep(600);
  if (typeof pw === 'string' && pw.length && safeEq(pw, real)) {
    cache.remove('fails'); audit('login', '', 'ok');
    return { ok: true, token: sign(Date.now() + TOKEN_HOURS * 3600000), hours: TOKEN_HOURS };
  }
  cache.put('fails', String(fails + 1), LOCK_MIN * 60); audit('login-failed', '', 'attempt ' + (fails + 1));
  return { ok: false, error: 'bad_password', left: MAX_FAILS - fails - 1 };
}
function adminPassword(d) {
  if (!safeEq(d.old || '', props().getProperty('ADMIN_PASSWORD') || '')) return { ok: false, error: 'bad_password' };
  if (typeof d.next !== 'string' || d.next.length < 10) return { ok: false, error: 'weak' };
  props().setProperty('ADMIN_PASSWORD', d.next);
  props().setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid());   // signs everyone out
  audit('password-changed', '', ''); return { ok: true };
}

/* ---------- admin: actions ---------- */
function audit(action, refs, detail) {
  var s = sheet(T_AUDIT), r = s.getLastRow() + 1;
  s.getRange(r, 1, 1, 4).setNumberFormat('@').setValues([[new Date().toISOString(), action, String(refs), String(detail).slice(0, 300)]]);
}
function readAudit() {
  var s = sheet(T_AUDIT), n = s.getLastRow(); if (n < 2) return [];
  var from = Math.max(2, n - 199);
  return s.getRange(from, 1, n - from + 1, 4).getValues().reverse().map(function (r) { return { at: r[0], action: r[1], refs: r[2], detail: r[3] }; });
}
function applyChange(o, c) {
  var now = new Date().toISOString(), ev = evs(o), changed = [];
  if (c.status && STATUSES.indexOf(c.status) >= 0 && c.status !== o.status) {
    var e = { type: c.status, at: now };
    if (c.status === 'assigned') { o.dept = c.dept && DEPTS.indexOf(c.dept) >= 0 ? c.dept : (o.dept || DEPT_OF[o.cat] || 'works'); e.dept = o.dept; }
    if (c.eventNote) e.note = clip(c.eventNote, 300);
    ev.push(e); o.status = c.status; changed.push('status→' + c.status);
  }
  if (c.dept && DEPTS.indexOf(c.dept) >= 0 && c.dept !== o.dept) { o.dept = c.dept; changed.push('dept→' + c.dept); }
  if (typeof c.note === 'string' && c.note !== o.adminNote) { o.adminNote = clip(c.note, 2000); changed.push('note'); }
  if (typeof c.title === 'string' && clip(c.title, 120).length >= 5 && clip(c.title, 120) !== o.title) { o.title = clip(c.title, 120); changed.push('title'); }
  o.events = JSON.stringify(ev); o.updated = now; return changed;
}
function adminUpdate(d) {
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var o = findRow(String(d.ref)); if (!o) return { ok: false, error: 'not_found' };
    var ch = applyChange(o, d); writeRow(o); audit('update', o.ref, ch.join(', '));
    return { ok: true, report: full(o) };
  } finally { lock.releaseLock(); }
}
function adminBulk(d) {
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var refs = (d.refs || []).slice(0, 200), all = readAll(), done = [];
    all.forEach(function (o) { if (refs.indexOf(o.ref) >= 0) { applyChange(o, d); writeRow(o); done.push(o.ref); } });
    audit('bulk-update', done.join(' '), (d.status ? 'status→' + d.status + ' ' : '') + (d.dept ? 'dept→' + d.dept : ''));
    return { ok: true, count: done.length, reports: all.filter(function (o) { return done.indexOf(o.ref) >= 0; }).map(full) };
  } finally { lock.releaseLock(); }
}
function adminDelete(d) {
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var refs = (d.refs || []).slice(0, 200), all = readAll(), s = sheet(T_REPORTS), n = 0;
    all.filter(function (o) { return refs.indexOf(o.ref) >= 0; }).sort(function (a, b) { return b._row - a._row; }).forEach(function (o) {
      if (o.imageId) { try { DriveApp.getFileById(o.imageId).setTrashed(true); } catch (e) { } }
      s.deleteRow(o._row); n++;
    });
    audit('delete', refs.join(' '), n + ' removed'); return { ok: true, count: n };
  } finally { lock.releaseLock(); }
}
function adminConfig(d) {
  var c = getConfig();
  if (typeof d.accepting === 'boolean') c.accepting = d.accepting;
  if (d.announcement) c.announcement = { en: clip(d.announcement.en, 300), ne: clip(d.announcement.ne, 300), level: ['info', 'warn', 'alert'].indexOf(d.announcement.level) >= 0 ? d.announcement.level : 'info' };
  props().setProperty('CONFIG', JSON.stringify(c)); audit('config', '', JSON.stringify(c).slice(0, 250));
  return { ok: true, config: c };
}
