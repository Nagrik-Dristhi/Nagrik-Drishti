// Nagarik Drishti — shared base maps (Leaflet). Used by the Civic Map and the Report form map.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function t(k) { return window.NDLang ? window.NDLang.t(k) : k; }

  // install(map, { errorId }) -> { renderControl() }
  function install(map, opts) {
    opts = opts || {};
    var ERR_ID = opts.errorId || 'map-tile-error';
    // Base maps (none needs an API key):
    //  - Clean map: OpenFreeMap vector tiles (MapLibre/WebGL), light or dark to match the site theme
    //  - Street map: Esri raster tiles (also the automatic fallback if vector fails)
    //  - Satellite: Esri World Imagery + place-name labels
    //  - OpenStreetMap standard (403 unless the page is hosted or served from localhost)
    var BASEMAP_KEY = 'nd-basemap';
    var tileErrors = 0;
    var ATTR_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';
    var ATTR_ESRI = 'Tiles &copy; Esri';

    var street = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, attribution: ATTR_ESRI + ' &mdash; Esri, HERE, Garmin, OpenStreetMap contributors'
    });
    var imagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, maxNativeZoom: 18,
      attribution: ATTR_ESRI + ' &mdash; Esri, Maxar, Earthstar Geographics, and the GIS User Community'
    });
    var placeLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19, maxNativeZoom: 18
    });
    var satellite = L.layerGroup([imagery, placeLabels]);
    var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: ATTR_OSM });

    [street, imagery, osm].forEach(function (layer) {
      layer.on('tileerror', function () {
        tileErrors += 1;
        if (tileErrors >= 6) { var el = $(ERR_ID); if (el) el.hidden = false; }
      });
      layer.on('tileload', function () {
        var el = $(ERR_ID);
        if (el && tileErrors) { el.hidden = true; tileErrors = 0; }
      });
    });

    var VECTOR_ATTR = '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
      '&copy; <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
      'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
    function makeVector(style) {
      if (!(L.maplibreGL && window.maplibregl)) return null;
      try { return L.maplibreGL({ style: 'https://tiles.openfreemap.org/styles/' + style, attribution: VECTOR_ATTR }); }
      catch (err) { return null; }
    }
    var vectorLight = makeVector('positron');
    var vectorDark = makeVector('dark');
    var clean = L.layerGroup([]); // holds whichever vector style matches the theme
    var hasVector = !!(vectorLight && vectorDark);

    function themeName() { return window.NDTheme ? window.NDTheme.get() : 'light'; }
    function useStreetFallback() {
      if (map.hasLayer(clean)) map.removeLayer(clean);
      if (!map.hasLayer(street) && !map.hasLayer(satellite) && !map.hasLayer(osm)) street.addTo(map);
    }
    function watchVector(v) {
      try {
        var gl = v.getMaplibreMap && v.getMaplibreMap();
        if (!gl || !gl.on || v._ndWatched === gl) return;
        v._ndWatched = gl;
        var errs = 0;
        gl.on('error', function () { errs += 1; if (errs >= 3) useStreetFallback(); });
      } catch (err) { /* ignore */ }
    }
    function syncClean() {
      if (!hasVector) return;
      var v = themeName() === 'dark' ? vectorDark : vectorLight;
      if (clean.hasLayer(v)) return;
      clean.clearLayers();
      try { clean.addLayer(v); } catch (err) { useStreetFallback(); return; }
      if (map.hasLayer(clean)) watchVector(v);
    }

    var CHOICES = { clean: clean, street: street, satellite: satellite, osm: osm };
    function savedChoice() { try { return localStorage.getItem(BASEMAP_KEY); } catch (e) { return null; } }
    function saveChoice(k) { try { localStorage.setItem(BASEMAP_KEY, k); } catch (e) { /* ignore */ } }

    var startKey = savedChoice();
    if (!CHOICES[startKey] || (startKey === 'clean' && !hasVector)) startKey = hasVector ? 'clean' : 'street';
    syncClean();
    CHOICES[startKey].addTo(map);
    if (startKey === 'clean') { var first = themeName() === 'dark' ? vectorDark : vectorLight; if (first) watchVector(first); }

    map.on('baselayerchange', function (e) {
      tileErrors = 0; var el = $(ERR_ID); if (el) el.hidden = true;
      Object.keys(CHOICES).forEach(function (k) { if (CHOICES[k] === e.layer) saveChoice(k); });
      if (e.layer === clean) syncClean();
    });
    document.addEventListener('nd:themechange', syncClean);

    var layerControl = null;
    function renderLayerControl() {
      if (layerControl) map.removeControl(layerControl);
      var base = {};
      if (hasVector) base[t('map.layer.clean')] = clean;
      base[t('map.layer.street')] = street;
      base[t('map.layer.satellite')] = satellite;
      base[t('map.layer.osm')] = osm;
      layerControl = L.control.layers(base, null, { position: 'topright', collapsed: true }).addTo(map);
    }

    return { renderControl: renderLayerControl };
  }

  window.NDBasemaps = { install: install };
})();
