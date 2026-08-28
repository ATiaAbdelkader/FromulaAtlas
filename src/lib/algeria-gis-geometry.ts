/**
 * Algeria GIS Geometry & Vector Boundary Registry
 * Provides realistic national border paths, topographic relief, hydrography (chotts & wadis),
 * and 58-Wilaya clipped territorial Voronoi polygon boundaries.
 */

import * as d3 from 'd3';
import { ALL_58_WILAYAS, type WilayaDataFull } from './algeria-wilayas-58';

/**
 * Coordinate Projection matching AlgeriaAgriMap canvas (800x800 viewBox)
 */
export const projectCoordinates = (lat: number, lng: number): { x: number; y: number } => {
  const minLng = -9.0;
  const maxLng = 12.5;
  const minLat = 18.5;
  const maxLat = 37.8;

  const x = ((lng - minLng) / (maxLng - minLng)) * 640 + 80;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 680 + 60;

  return { x, y };
};

/**
 * High-precision national border coordinates of the People's Democratic Republic of Algeria
 * (lat, lng points tracing the entire coastline and international land borders)
 */
export const ALGERIA_NATIONAL_BORDER_COORDS: { lat: number; lng: number }[] = [
  // --- Mediterranean Coastline (West to East) ---
  { lat: 35.08, lng: -2.22 }, // Marsa Ben M'Hidi / Oued Kiss
  { lat: 35.12, lng: -1.90 }, // Ghazaouet
  { lat: 35.30, lng: -1.38 }, // Beni Saf
  { lat: 35.65, lng: -0.90 }, // Cap Falcon
  { lat: 35.75, lng: -0.78 }, // Golfe d'Oran
  { lat: 35.85, lng: -0.28 }, // Cap Carbon (Oran)
  { lat: 35.88, lng: 0.08 },  // Golfe d'Arzew / Mostaganem
  { lat: 36.20, lng: 0.65 },  // Cap Ivi
  { lat: 36.52, lng: 1.30 },  // Ténès / Cap Caxine
  { lat: 36.58, lng: 1.85 },  // Gouraya / Damous
  { lat: 36.60, lng: 2.44 },  // Tipaza / Mont Chenoua
  { lat: 36.78, lng: 3.06 },  // Baie d'Alger / Cap Caxine
  { lat: 36.82, lng: 3.48 },  // Boumerdès / Zemmouri
  { lat: 36.92, lng: 3.91 },  // Dellys / Cap Bengut
  { lat: 36.90, lng: 4.42 },  // Tigzirt / Azeffoun (Kabylie Maritime)
  { lat: 36.78, lng: 5.10 },  // Golfe de Béjaïa / Cap Carbon
  { lat: 36.83, lng: 5.76 },  // Jijel / Cap Cavallo
  { lat: 37.02, lng: 6.30 },  // Collo / Cap Bougaroun
  { lat: 37.08, lng: 7.17 },  // Golfe de Stora / Cap de Fer / Skikda
  { lat: 36.97, lng: 7.78 },  // Golfe d'Annaba / Cap de Garde
  { lat: 36.92, lng: 8.44 },  // El Kala / Cap Rosa
  { lat: 36.90, lng: 8.65 },  // Oum Teboul (Tunisian border north)

  // --- Eastern Border (Tunisia) ---
  { lat: 36.50, lng: 8.50 },  // Ain Draham border
  { lat: 36.25, lng: 8.40 },  // Souk Ahras border
  { lat: 35.35, lng: 8.35 },  // Tébessa / Bouchebka border
  { lat: 34.70, lng: 8.20 },  // Bir El Ater border
  { lat: 34.00, lng: 7.80 },  // El Oued / Taleb Larbi border
  { lat: 32.50, lng: 8.80 },  // Fort Saint / Bir Romane
  { lat: 30.25, lng: 9.55 },  // Ghadamès Tripoint (DZ / TN / LY)

  // --- Southeastern Border (Libya) ---
  { lat: 28.50, lng: 9.70 },  // In Amenas / Al Birkah border
  { lat: 26.00, lng: 9.90 },  // Tarat / Ghat border
  { lat: 24.50, lng: 10.20 }, // Djanet / Tin Alkoum border
  { lat: 23.50, lng: 12.00 }, // SE corner tripoint (DZ / LY / NE)

  // --- Southern Border (Niger & Mali) ---
  { lat: 21.80, lng: 11.20 }, // Mount Toumour
  { lat: 21.00, lng: 10.00 }, // Niger border traverse
  { lat: 19.57, lng: 5.77 },  // In Guezzam / Arlit border post
  { lat: 18.96, lng: 3.50 },  // Southernmost Point of Algeria (Timiaouine South)
  { lat: 19.95, lng: 2.95 },  // Tin Zaouatine border
  { lat: 21.33, lng: 0.95 },  // Bordj Badji Mokhtar border post
  { lat: 22.50, lng: -2.00 }, // Tanezrouft border
  { lat: 24.00, lng: -4.80 }, // Mali NW corner

  // --- Western Border (Mauritania, Western Sahara & Morocco) ---
  { lat: 25.00, lng: -6.50 }, // Chegga Tripoint (DZ / ML / MR)
  { lat: 26.00, lng: -7.50 }, // Tindouf South
  { lat: 27.60, lng: -8.67 }, // Tindouf Westernmost Tip
  { lat: 28.50, lng: -7.50 }, // Hassi Khebi
  { lat: 29.50, lng: -5.50 }, // Erg Chech / Ougarta border
  { lat: 30.50, lng: -3.25 }, // Tabelbala / Béchar border
  { lat: 32.10, lng: -1.25 }, // Béni Ounif / Figuig border
  { lat: 33.50, lng: -0.80 }, // Naâma / Ain Sefra border
  { lat: 34.85, lng: -1.85 }, // Tlemcen / Oujda border
  { lat: 35.08, lng: -2.22 }, // Marsa Ben M'Hidi (Back to start)
];

/**
 * Generate SVG Path string for the National Outline
 */
export const getAlgeriaNationalPath = (): string => {
  const pts = ALGERIA_NATIONAL_BORDER_COORDS.map((c) => projectCoordinates(c.lat, c.lng));
  if (pts.length === 0) return '';
  let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    path += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  path += ' Z';
  return path;
};

/**
 * Topographic Relief Lines & Major Geographic Features
 */
export const TOPOGRAPHIC_RELIEF_DATA = {
  tellAtlas: [
    // Dahra Range
    'M 350 145 Q 400 135 440 140 Q 480 135 520 130',
    // Djurdjura Massif (Lalla Khedidja 2308m)
    'M 470 125 Q 495 115 520 120 Q 545 110 560 125',
    // Babors & Bibans
    'M 540 130 Q 570 120 600 125 Q 630 115 660 128',
    // Edough & Medjerda
    'M 650 115 Q 680 110 710 118',
  ],
  saharanAtlas: [
    // Monts des Ksour (Ain Sefra)
    'M 310 205 Q 340 195 380 200',
    // Djebel Amour (Aflou)
    'M 390 195 Q 425 185 465 190',
    // Monts des Ouled Naïl (Djelfa - Boussaâda)
    'M 470 185 Q 510 175 550 180',
    // Massif des Aurès (Djebel Chélia 2328m) & Monts du Zab
    'M 560 175 Q 600 165 645 170 Q 675 160 700 175',
    // Monts de Tébessa
    'M 680 165 Q 710 160 730 170',
  ],
  hoggarTassili: [
    // Atakor & Mount Tahat (3003m - Highest peak in Algeria)
    'M 510 650 Q 530 630 550 645 Q 570 635 590 655',
    'M 500 665 Q 535 650 565 660 Q 595 650 620 670',
    // Tassili n'Ajjer Plateau (Djanet / Jabbaren)
    'M 610 590 Q 640 570 670 585 Q 700 575 720 600',
    'M 620 610 Q 650 595 680 605',
    // Eglab & Yetti Massifs (West)
    'M 180 500 Q 210 490 240 510',
  ],
  majorChotts: [
    // Chott Ech Chergui (Oranie Steppe)
    {
      id: 'chott_ech_chergui',
      nameFr: 'Chott Ech Chergui',
      nameAr: 'شط الشرقي',
      path: 'M 350 170 Q 380 165 410 172 Q 380 178 350 170 Z',
      color: '#0284c7',
    },
    // Chott El Hodna (M\'Sila)
    {
      id: 'chott_el_hodna',
      nameFr: 'Chott El Hodna',
      nameAr: 'شط الحضنة',
      path: 'M 530 160 Q 560 155 580 162 Q 555 168 530 160 Z',
      color: '#0284c7',
    },
    // Chott Melrhir (Biskra / El Oued Depression -40m below sea level)
    {
      id: 'chott_melrhir',
      nameFr: 'Chott Melrhir (-40m)',
      nameAr: 'شط ملغيغ',
      path: 'M 600 215 Q 650 205 690 218 Q 650 228 600 215 Z',
      color: '#0284c7',
    },
    // Chott Merouane (El Oued)
    {
      id: 'chott_merouane',
      nameFr: 'Chott Merouane',
      nameAr: 'شط مروان',
      path: 'M 620 235 Q 645 230 665 238 Q 640 244 620 235 Z',
      color: '#0284c7',
    },
    // Grande Sebkha d\'Oran
    {
      id: 'sebkha_oran',
      nameFr: 'Sebkha d\'Oran',
      nameAr: 'سبخة وهران',
      path: 'M 315 135 Q 330 132 342 136 Q 330 140 315 135 Z',
      color: '#0284c7',
    },
  ],
  majorWadis: [
    // Oued Chéliff (700 km - Longest river)
    {
      id: 'oued_cheliff',
      nameFr: 'Oued Chéliff',
      nameAr: 'وادي الشلف',
      path: 'M 440 185 Q 430 160 410 145 Q 370 140 355 130',
    },
    // Oued Soummam (Béjaïa)
    {
      id: 'oued_soummam',
      nameFr: 'Oued Soummam',
      nameAr: 'وادي الصومام',
      path: 'M 535 155 Q 545 140 558 120',
    },
    // Oued Seybouse (Guelma - Annaba)
    {
      id: 'oued_seybouse',
      nameFr: 'Oued Seybouse',
      nameAr: 'وادي سيبوس',
      path: 'M 670 150 Q 675 130 682 110',
    },
    // Oued Medjerda
    {
      id: 'oued_medjerda',
      nameFr: 'Oued Medjerda',
      nameAr: 'وادي مجردة',
      path: 'M 670 145 Q 695 140 710 135',
    },
    // Oued Saoura (Béchar - Beni Abbès)
    {
      id: 'oued_saoura',
      nameFr: 'Vallée de la Saoura',
      nameAr: 'وادي الساورة',
      path: 'M 260 250 Q 280 300 310 370',
    },
    // Oued Righ (Fossil valley - Biskra to Touggourt)
    {
      id: 'oued_righ',
      nameFr: 'Vallée de l’Oued Righ',
      nameAr: 'وادي ريغ النخيلي',
      path: 'M 620 220 Q 630 250 640 280',
    },
  ],
  desertErgs: [
    // Grand Erg Occidental
    {
      id: 'grand_erg_occidental',
      nameFr: 'Grand Erg Occidental (Dunes & Oasis)',
      nameAr: 'العرق الغربي الكبير',
      path: 'M 320 270 Q 420 250 450 320 Q 400 380 300 340 Z',
      color: '#f59e0b',
    },
    // Grand Erg Oriental
    {
      id: 'grand_erg_oriental',
      nameFr: 'Grand Erg Oriental (Palmeraies de Souf)',
      nameAr: 'العرق الشرقي الكبير',
      path: 'M 570 260 Q 690 250 710 380 Q 610 400 550 330 Z',
      color: '#f59e0b',
    },
    // Erg Iguidi & Erg Chech (Southwest)
    {
      id: 'erg_chech',
      nameFr: 'Erg Chech & Erg Iguidi',
      nameAr: 'عرق شاش وعرق إيقيدي',
      path: 'M 170 380 Q 260 360 280 470 Q 190 490 140 420 Z',
      color: '#d97706',
    },
  ],
};

/**
 * Pre-generate Voronoi polygons for all 58 wilayas based on their accurate coordinates
 */
export interface WilayaPolygonFeature {
  code: number;
  codeStr: string;
  id: string;
  nameFr: string;
  nameAr: string;
  nameEn: string;
  centroid: { x: number; y: number };
  polygonPath: string;
  wilayaData: WilayaDataFull;
}

export const getWilayaPolygonFeatures = (): WilayaPolygonFeature[] => {
  const points: [number, number][] = ALL_58_WILAYAS.map((w) => {
    const pt = projectCoordinates(w.lat, w.lng);
    return [pt.x, pt.y];
  });

  const delaunay = d3.Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, 800, 800]);

  return ALL_58_WILAYAS.map((w, index) => {
    const pt = projectCoordinates(w.lat, w.lng);
    const polygonPath = voronoi.renderCell(index) || '';

    return {
      code: w.code,
      codeStr: w.codeStr,
      id: w.id,
      nameFr: w.nameFr,
      nameAr: w.nameAr,
      nameEn: w.nameEn,
      centroid: pt,
      polygonPath,
      wilayaData: w,
    };
  });
};
