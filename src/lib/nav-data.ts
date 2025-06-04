// src/lib/nav-data.ts

export interface SubCategory {
  slug: string;
  name: string;
  href: string; // Full path for the subcategory
  dataAiHint?: string;
}

export interface NavCategory {
  href: string; // Main category link (can be a general page or first subcategory)
  label: string; // Main category display name
  slug: string; // Main category slug
  subcategories?: SubCategory[];
  dataAiHint?: string; // For potential icons or imagery for the main category
  icon?: React.ElementType; // Optional: For an icon next to the main category label
}

export const navigationCategories: NavCategory[] = [
  {
    href: '/category/podoabe-accesorii',
    label: 'Podoabe & Accesorii',
    slug: 'podoabe-accesorii',
    dataAiHint: 'colier perle',
    subcategories: [
      { slug: 'genti-posete', name: 'Genți & Poșete Artizanale', href: '/category/podoabe-accesorii?subcategory=genti-posete', dataAiHint: 'geantă piele' },
      { slug: 'esarfe-fulare', name: 'Eșarfe & Fulare de Poveste', href: '/category/podoabe-accesorii?subcategory=esarfe-fulare', dataAiHint: 'eșarfă mătase' },
      { slug: 'palarii-sepci', name: 'Pălării & Șepci Cu Stil', href: '/category/podoabe-accesorii?subcategory=palarii-sepci', dataAiHint: 'pălărie paie' },
      { slug: 'curele-catarame', name: 'Curele & Catarame Unicat', href: '/category/podoabe-accesorii?subcategory=curele-catarame', dataAiHint: 'curea piele' },
      { slug: 'manusi-mitene', name: 'Mănuși & Mitene Călduroase', href: '/category/podoabe-accesorii?subcategory=manusi-mitene', dataAiHint: 'mănuși lână' },
      { slug: 'bijuterii', name: 'Bijuterii Făurite cu Har', href: '/category/podoabe-accesorii?subcategory=bijuterii', dataAiHint: 'inel argint' },
      { slug: 'ochelari-accesorii', name: 'Ochelari & Accesorii Optice', href: '/category/podoabe-accesorii?subcategory=ochelari-accesorii', dataAiHint: 'toc ochelari' },
    ],
  },
  {
    href: '/category/vesminte-incaltari',
    label: 'Veșminte & Încălțări',
    slug: 'vesminte-incaltari',
    dataAiHint: 'rochie tradițională',
    subcategories: [
      { slug: 'pentru-femei', name: 'Pentru Femei (Rochii, Ii, Bluze)', href: '/category/vesminte-incaltari?subcategory=pentru-femei', dataAiHint: 'ie românească' },
      { slug: 'pentru-barbati', name: 'Pentru Bărbați (Cămăși, Veste)', href: '/category/vesminte-incaltari?subcategory=pentru-barbati', dataAiHint: 'cămașă in' },
      { slug: 'pentru-copii', name: 'Pentru Copii & Prichindei', href: '/category/vesminte-incaltari?subcategory=pentru-copii', dataAiHint: 'botoșei croșetați' },
      { slug: 'incaltaminte-artizanala', name: 'Încălțăminte Meșterită (Opincuțe, Ghete)', href: '/category/vesminte-incaltari?subcategory=incaltaminte-artizanala', dataAiHint: 'opinci piele' },
    ],
  },
  {
    href: '/category/casa-gradina',
    label: 'Casă & Grădină Fermecată',
    slug: 'casa-gradina',
    dataAiHint: 'vază ceramică flori',
    subcategories: [
      { slug: 'decoratiuni-interioare', name: 'Decorațiuni Interioare cu Suflet', href: '/category/casa-gradina?subcategory=decoratiuni-interioare', dataAiHint: 'pernă decorativă' },
      { slug: 'covoare-presuri', name: 'Covoare Țesute & Preșuri Tradiționale', href: '/category/casa-gradina?subcategory=covoare-presuri', dataAiHint: 'covor lână' },
      { slug: 'mobilier-artizanal', name: 'Mobilier Mic, de Meșter Faur', href: '/category/casa-gradina?subcategory=mobilier-artizanal', dataAiHint: 'scaun lemn sculptat' },
      { slug: 'corpuri-iluminat', name: 'Corpuri de Iluminat Artizanale', href: '/category/casa-gradina?subcategory=corpuri-iluminat', dataAiHint: 'lampă ceramică' },
      { slug: 'bucatarie-masa', name: 'Bucătărie & Masă Îmbelșugată', href: '/category/casa-gradina?subcategory=bucatarie-masa', dataAiHint: 'castron ceramică' },
      { slug: 'lenjerii-paturi', name: 'Așternuturi & Pături de Vis', href: '/category/casa-gradina?subcategory=lenjerii-paturi', dataAiHint: 'pătură lână' },
      { slug: 'baie-frumusete', name: 'Baie & Ritualuri de Frumusețe', href: '/category/casa-gradina?subcategory=baie-frumusete', dataAiHint: 'săpun natural' },
      { slug: 'exterior-gradinarit', name: 'Exterior & Grădinărit cu Har', href: '/category/casa-gradina?subcategory=exterior-gradinarit', dataAiHint: 'ghiveci ceramică' },
    ],
  },
  {
    href: '/category/nunti-petreceri',
    label: 'Nunți & Petreceri de Poveste',
    slug: 'nunti-petreceri',
    dataAiHint: 'invitație nuntă',
    subcategories: [
      { slug: 'articole-petrecere', name: 'Articole de Petrecere Unicat', href: '/category/nunti-petreceri?subcategory=articole-petrecere', dataAiHint: 'ghirlandă petrecere' },
      { slug: 'invitatii-papetarie', name: 'Invitații & Papetărie Festivă', href: '/category/nunti-petreceri?subcategory=invitatii-papetarie', dataAiHint: 'invitație caligrafie' },
      { slug: 'decoratiuni-nunta', name: 'Decorațiuni Nuntă de Basm', href: '/category/nunti-petreceri?subcategory=decoratiuni-nunta', dataAiHint: 'aranjament floral nuntă' },
      { slug: 'cadouri-nunta-botez', name: 'Cadouri Nuntă & Botez Speciale', href: '/category/nunti-petreceri?subcategory=cadouri-nunta-botez', dataAiHint: 'album foto manual' },
      { slug: 'accesorii-nunta', name: 'Accesorii Nuntă Însuflețite', href: '/category/nunti-petreceri?subcategory=accesorii-nunta', dataAiHint: 'coroniță flori mireasă' },
    ],
  },
  {
    href: '/category/jucarii-divertisment',
    label: 'Jucării & Joacă Creativă',
    slug: 'jucarii-divertisment',
    dataAiHint: 'jucărie lemn',
    subcategories: [
      { slug: 'jucarii-artizanale', name: 'Jucării Artizanale (Lemn, Textile)', href: '/category/jucarii-divertisment?subcategory=jucarii-artizanale', dataAiHint: 'căluț lemn' },
      { slug: 'jocuri-puzzle-uri', name: 'Jocuri & Puzzle-uri Meșteșugite', href: '/category/jucarii-divertisment?subcategory=jocuri-puzzle-uri', dataAiHint: 'puzzle lemn' },
      { slug: 'carti-muzica-artizanala', name: 'Cărți & Muzică Artizanală', href: '/category/jucarii-divertisment?subcategory=carti-muzica-artizanala', dataAiHint: 'carte legată manual' },
    ],
  },
  {
    href: '/category/arta-colectionabile',
    label: 'Artă & Obiecte de Colecție',
    slug: 'arta-colectionabile',
    dataAiHint: 'pictură abstractă',
    subcategories: [
      { slug: 'pictura-grafica', name: 'Pictură & Grafică Originală', href: '/category/arta-colectionabile?subcategory=pictura-grafica', dataAiHint: 'tablou peisaj' },
      { slug: 'sculptura', name: 'Sculptură (Lemn, Piatră, Ceramică)', href: '/category/arta-colectionabile?subcategory=sculptura', dataAiHint: 'sculptură bronz' },
      { slug: 'fotografie-artistica', name: 'Fotografie Artistică & Printuri', href: '/category/arta-colectionabile?subcategory=fotografie-artistica', dataAiHint: 'fotografie alb negru' },
      { slug: 'arta-sticla', name: 'Artă în Sticlă & Vitralii', href: '/category/arta-colectionabile?subcategory=arta-sticla', dataAiHint: 'vitraliu colorat' },
      { slug: 'ceramica-artistica', name: 'Ceramică Artistică de Autor', href: '/category/arta-colectionabile?subcategory=ceramica-artistica', dataAiHint: 'platou ceramică pictat' },
      { slug: 'textile-artistice', name: 'Textile Artistice (Tapiserii)', href: '/category/arta-colectionabile?subcategory=textile-artistice', dataAiHint: 'tapiserie lână' },
      { slug: 'obiecte-colectie', name: 'Obiecte de Colecție Rare', href: '/category/arta-colectionabile?subcategory=obiecte-colectie', dataAiHint: 'monedă veche' },
    ],
  },
  {
    href: '/category/materiale-unelte',
    label: 'Materiale & Unelte Creative',
    slug: 'materiale-unelte',
    dataAiHint: 'fire lână colorate',
    subcategories: [
      { slug: 'materiale-hobby', name: 'Materiale pentru Hobby & Meșteșug', href: '/category/materiale-unelte?subcategory=materiale-hobby', dataAiHint: 'mărgele colorate' },
      { slug: 'unelte-artizanat', name: 'Unelte pentru Artizanat', href: '/category/materiale-unelte?subcategory=unelte-artizanat', dataAiHint: 'daltă sculptură' },
      { slug: 'kituri-creative', name: 'Kituri Creative DIY', href: '/category/materiale-unelte?subcategory=kituri-creative', dataAiHint: 'kit broderie' },
    ],
  },
  {
    href: '/category/vintage',
    label: 'Comori de Odinioară (Vintage)',
    slug: 'vintage',
    dataAiHint: 'ceas buzunar vechi',
    subcategories: [
      { slug: 'imbracaminte-vintage', name: 'Îmbrăcăminte Vintage Autentică', href: '/category/vintage?subcategory=imbracaminte-vintage', dataAiHint: 'rochie anii 50' },
      { slug: 'bijuterii-vintage', name: 'Bijuterii Vintage cu Patină', href: '/category/vintage?subcategory=bijuterii-vintage', dataAiHint: 'broșă argint veche' },
      { slug: 'decoratiuni-vintage', name: 'Decorațiuni Vintage pentru Casă', href: '/category/vintage?subcategory=decoratiuni-vintage', dataAiHint: 'telefon disc vechi' },
      { slug: 'obiecte-colectie-vintage', name: 'Obiecte de Colecție Vintage', href: '/category/vintage?subcategory=obiecte-colectie-vintage', dataAiHint: 'carte poștală veche' },
    ],
  },
];

    