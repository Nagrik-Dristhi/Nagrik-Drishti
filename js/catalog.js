// Nagarik Drishti — static reference data: categories, departments, statuses.
// Names are bilingual here (data, not UI chrome). Department list is illustrative:
// real departments differ between local governments.
(function () {
  function lang() { return window.NDLang ? window.NDLang.get() : 'en'; }
  function pick(o) { return o ? (lang() === 'ne' ? o.ne : o.en) : ''; }

  var CATEGORIES = [
    { id: 'roads', en: 'Roads and Transportation', ne: 'सडक तथा यातायात', dept: 'roads', subs: [
      ['potholes', 'Potholes / damaged road', 'खाल्डाखुल्डी / क्षतिग्रस्त सडक'],
      ['footpath', 'Damaged footpath', 'क्षतिग्रस्त पैदलमार्ग'],
      ['signs', 'Missing road signs or markings', 'सडक चिन्ह वा रेखा अभाव'],
      ['bridge', 'Bridge or culvert damage', 'पुल वा कल्भर्ट क्षति'],
      ['traffic', 'Traffic signal problem', 'ट्राफिक बत्ती समस्या'] ] },
    { id: 'water', en: 'Water and Sanitation', ne: 'खानेपानी तथा सरसफाइ', dept: 'water', subs: [
      ['leak', 'Pipe leak or supply failure', 'पाइप चुहावट वा आपूर्ति अवरोध'],
      ['drain', 'Blocked drain or sewer', 'ढल जाम वा ढल निकास समस्या'],
      ['tap', 'Public tap or well problem', 'सार्वजनिक धारा वा इनार समस्या'],
      ['toilet', 'Public toilet condition', 'सार्वजनिक शौचालयको अवस्था'] ] },
    { id: 'waste', en: 'Waste Management', ne: 'फोहोरमैला व्यवस्थापन', dept: 'waste', subs: [
      ['dump', 'Illegal dumping', 'अवैध फोहोर फाल्ने'],
      ['collect', 'Missed waste collection', 'फोहोर सङ्कलन छुट्यो'],
      ['bins', 'Overflowing public bin', 'सार्वजनिक फोहोर भाँडो भरिएको'] ] },
    { id: 'power', en: 'Electricity and Public Lighting', ne: 'विद्युत् तथा सार्वजनिक बत्ती', dept: 'power', subs: [
      ['streetlight', 'Streetlight not working', 'सडक बत्ती बिग्रिएको'],
      ['wires', 'Hanging or exposed wires', 'झुण्डिएका वा खुला तार'],
      ['pole', 'Damaged electricity pole', 'क्षतिग्रस्त विद्युत् पोल'] ] },
    { id: 'infra', en: 'Public Infrastructure', ne: 'सार्वजनिक पूर्वाधार', dept: 'infra', subs: [
      ['building', 'Damaged public building', 'क्षतिग्रस्त सार्वजनिक भवन'],
      ['wall', 'Retaining wall or embankment', 'पर्खाल वा तटबन्ध'],
      ['landslide', 'Landslide or road washout', 'पहिरो वा सडक बगेको'] ] },
    { id: 'env', en: 'Environment and Public Spaces', ne: 'वातावरण तथा सार्वजनिक स्थल', dept: 'env', subs: [
      ['park', 'Park or playground condition', 'पार्क वा खेलमैदानको अवस्था'],
      ['trees', 'Fallen or dangerous tree', 'ढलेको वा जोखिमपूर्ण रुख'],
      ['pollution', 'Pollution concern', 'प्रदूषणसम्बन्धी चिन्ता'] ] },
    { id: 'access', en: 'Public Accessibility', ne: 'सार्वजनिक पहुँच', dept: 'works', subs: [
      ['ramp', 'Missing ramp or barrier', 'र‍्याम्प अभाव वा अवरोध'],
      ['crossing', 'Unsafe pedestrian crossing', 'असुरक्षित पैदल क्रसिङ'] ] },
    { id: 'heritage', en: 'Heritage and Cultural Infrastructure', ne: 'सम्पदा तथा सांस्कृतिक पूर्वाधार', dept: 'works', subs: [
      ['monument', 'Damaged monument or temple', 'क्षतिग्रस्त स्मारक वा मन्दिर'],
      ['ghat', 'Ghat, pond or stone spout', 'घाट, पोखरी वा ढुङ्गेधारा'] ] },
    { id: 'facilities', en: 'Public Facilities', ne: 'सार्वजनिक सुविधा', dept: 'facilities', subs: [
      ['shelter', 'Bus shelter or waiting area', 'बस प्रतीक्षालय'],
      ['market', 'Public market or rest area', 'सार्वजनिक बजार वा विश्रामस्थल'] ] },
    { id: 'other', en: 'Other Civic Issues', ne: 'अन्य नागरिक समस्या', dept: 'works', subs: [
      ['other', 'Other', 'अन्य'] ] }
  ];

  var DEPARTMENTS = [
    { id: 'infra', en: 'Infrastructure Development', ne: 'पूर्वाधार विकास' },
    { id: 'roads', en: 'Roads and Transportation', ne: 'सडक तथा यातायात' },
    { id: 'water', en: 'Water Supply and Sanitation', ne: 'खानेपानी तथा सरसफाइ' },
    { id: 'waste', en: 'Waste Management', ne: 'फोहोरमैला व्यवस्थापन' },
    { id: 'env', en: 'Environment', ne: 'वातावरण' },
    { id: 'works', en: 'Public Works', ne: 'सार्वजनिक निर्माण' },
    { id: 'power', en: 'Electricity and Public Lighting', ne: 'विद्युत् तथा सार्वजनिक बत्ती' },
    { id: 'facilities', en: 'Public Facilities', ne: 'सार्वजनिक सुविधा' }
  ];

  // Main lifecycle first, then the exceptional states.
  var STATUSES = [
    { id: 'reported', color: '#64748b' }, { id: 'review', color: '#9333ea' },
    { id: 'verified', color: '#1d4ed8' }, { id: 'assigned', color: '#0891b2' },
    { id: 'progress', color: '#d97706' }, { id: 'resolved', color: '#16a34a' },
    { id: 'rejected', color: '#dc2626' }, { id: 'duplicate', color: '#94a3b8' },
    { id: 'reopened', color: '#ea580c' }, { id: 'info', color: '#ca8a04' }
  ];
  var STATUS_COLORS = {};
  STATUSES.forEach(function (s) { STATUS_COLORS[s.id] = s.color; });

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  window.NDCatalog = {
    categories: CATEGORIES, departments: DEPARTMENTS, statuses: STATUSES, statusColors: STATUS_COLORS,
    category: function (id) { return byId(CATEGORIES, id); },
    categoryName: function (id) { var c = byId(CATEGORIES, id); return c ? pick(c) : id; },
    subName: function (catId, subId) {
      var c = byId(CATEGORIES, catId); if (!c) return subId;
      for (var i = 0; i < c.subs.length; i++) if (c.subs[i][0] === subId) return lang() === 'ne' ? c.subs[i][2] : c.subs[i][1];
      return subId;
    },
    deptName: function (id) { var d = byId(DEPARTMENTS, id); return d ? pick(d) : ''; },
    deptForCategory: function (catId) { var c = byId(CATEGORIES, catId); return c ? c.dept : 'works'; }
  };
})();
