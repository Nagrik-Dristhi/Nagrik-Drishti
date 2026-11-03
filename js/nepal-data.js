// Nepal administrative data used only for map navigation.
// Coordinates are APPROXIMATE district-centre points (for centring the view),
// not official boundaries. Format: [provinceId, English, Nepali, lat, lng]
window.ND_NEPAL = {
  center: [28.3, 84.1],
  zoom: 7,
  bounds: [[26.2, 79.9], [30.6, 88.4]],
  provinces: [
    { id: 'koshi',   en: 'Koshi Province',          ne: 'कोशी प्रदेश',      c: [26.95, 87.3], z: 8 },
    { id: 'madhesh', en: 'Madhesh Province',        ne: 'मधेश प्रदेश',      c: [26.8, 85.6],  z: 8 },
    { id: 'bagmati', en: 'Bagmati Province',        ne: 'बागमती प्रदेश',    c: [27.75, 85.3], z: 8 },
    { id: 'gandaki', en: 'Gandaki Province',        ne: 'गण्डकी प्रदेश',    c: [28.35, 84.0], z: 8 },
    { id: 'lumbini', en: 'Lumbini Province',        ne: 'लुम्बिनी प्रदेश',  c: [28.0, 82.8],  z: 8 },
    { id: 'karnali', en: 'Karnali Province',        ne: 'कर्णाली प्रदेश',   c: [29.1, 82.1],  z: 7 },
    { id: 'sudur',   en: 'Sudurpashchim Province',  ne: 'सुदूरपश्चिम प्रदेश', c: [29.2, 80.9], z: 8 }
  ],
  districts: [
    ['koshi','Taplejung','ताप्लेजुङ',27.35,87.67],['koshi','Panchthar','पाँचथर',27.15,87.75],
    ['koshi','Ilam','इलाम',26.91,87.93],['koshi','Jhapa','झापा',26.55,88.09],
    ['koshi','Morang','मोरङ',26.45,87.28],['koshi','Sunsari','सुनसरी',26.60,87.15],
    ['koshi','Dhankuta','धनकुटा',26.98,87.34],['koshi','Terhathum','तेह्रथुम',27.13,87.55],
    ['koshi','Sankhuwasabha','सङ्खुवासभा',27.37,87.20],['koshi','Bhojpur','भोजपुर',27.17,87.05],
    ['koshi','Khotang','खोटाङ',27.22,86.80],['koshi','Solukhumbu','सोलुखुम्बु',27.50,86.58],
    ['koshi','Okhaldhunga','ओखलढुङ्गा',27.31,86.50],['koshi','Udayapur','उदयपुर',26.85,86.70],

    ['madhesh','Saptari','सप्तरी',26.54,86.75],['madhesh','Siraha','सिराहा',26.65,86.20],
    ['madhesh','Dhanusha','धनुषा',26.73,85.93],['madhesh','Mahottari','महोत्तरी',26.65,85.80],
    ['madhesh','Sarlahi','सर्लाही',26.86,85.56],['madhesh','Rautahat','रौतहट',26.77,85.28],
    ['madhesh','Bara','बारा',27.03,84.98],['madhesh','Parsa','पर्सा',27.01,84.88],

    ['bagmati','Sindhuli','सिन्धुली',27.26,85.97],['bagmati','Ramechhap','रामेछाप',27.33,86.09],
    ['bagmati','Dolakha','दोलखा',27.67,86.05],['bagmati','Sindhupalchok','सिन्धुपाल्चोक',27.78,85.71],
    ['bagmati','Kavrepalanchok','काभ्रेपलाञ्चोक',27.62,85.55],['bagmati','Lalitpur','ललितपुर',27.67,85.32],
    ['bagmati','Bhaktapur','भक्तपुर',27.67,85.43],['bagmati','Kathmandu','काठमाडौँ',27.7172,85.3240],
    ['bagmati','Nuwakot','नुवाकोट',27.91,85.15],['bagmati','Rasuwa','रसुवा',28.11,85.30],
    ['bagmati','Dhading','धादिङ',27.87,84.90],['bagmati','Makwanpur','मकवानपुर',27.43,85.03],
    ['bagmati','Chitwan','चितवन',27.68,84.43],

    ['gandaki','Gorkha','गोरखा',28.00,84.63],['gandaki','Lamjung','लमजुङ',28.23,84.38],
    ['gandaki','Tanahun','तनहुँ',27.93,84.28],['gandaki','Kaski','कास्की',28.21,83.99],
    ['gandaki','Manang','मनाङ',28.55,84.24],['gandaki','Mustang','मुस्ताङ',28.78,83.72],
    ['gandaki','Myagdi','म्याग्दी',28.35,83.57],['gandaki','Parbat','पर्वत',28.22,83.68],
    ['gandaki','Baglung','बागलुङ',28.27,83.59],['gandaki','Syangja','स्याङ्जा',28.10,83.87],
    ['gandaki','Nawalpur','नवलपुर',27.65,84.12],

    ['lumbini','Parasi','परासी',27.50,83.67],['lumbini','Rupandehi','रुपन्देही',27.50,83.45],
    ['lumbini','Kapilvastu','कपिलवस्तु',27.55,83.05],['lumbini','Arghakhanchi','अर्घाखाँची',27.92,83.15],
    ['lumbini','Gulmi','गुल्मी',28.07,83.25],['lumbini','Palpa','पाल्पा',27.87,83.55],
    ['lumbini','Dang','दाङ',28.04,82.49],['lumbini','Pyuthan','प्यूठान',28.10,82.85],
    ['lumbini','Rolpa','रोल्पा',28.30,82.63],['lumbini','Eastern Rukum','रुकुम पूर्व',28.60,82.50],
    ['lumbini','Banke','बाँके',28.05,81.62],['lumbini','Bardiya','बर्दिया',28.23,81.34],

    ['karnali','Western Rukum','रुकुम पश्चिम',28.63,82.19],['karnali','Salyan','सल्यान',28.38,82.16],
    ['karnali','Dolpa','डोल्पा',28.97,82.90],['karnali','Humla','हुम्ला',29.97,81.82],
    ['karnali','Jumla','जुम्ला',29.27,82.18],['karnali','Kalikot','कालिकोट',29.14,81.62],
    ['karnali','Mugu','मुगु',29.50,82.10],['karnali','Surkhet','सुर्खेत',28.60,81.63],
    ['karnali','Dailekh','दैलेख',28.85,81.71],['karnali','Jajarkot','जाजरकोट',28.70,82.20],

    ['sudur','Kailali','कैलाली',28.69,80.60],['sudur','Achham','अछाम',29.05,81.28],
    ['sudur','Doti','डोटी',29.26,80.94],['sudur','Bajhang','बझाङ',29.55,81.18],
    ['sudur','Bajura','बाजुरा',29.45,81.48],['sudur','Kanchanpur','कञ्चनपुर',28.97,80.18],
    ['sudur','Dadeldhura','डडेल्धुरा',29.30,80.58],['sudur','Baitadi','बैतडी',29.52,80.42],
    ['sudur','Darchula','दार्चुला',29.85,80.55]
  ]
};
