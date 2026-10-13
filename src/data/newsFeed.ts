export interface NewsStory {
  id: string;
  category: 'CORP WATCH' | 'CYBER-SECURITY' | 'STREET LIFE' | 'ACADEMY DISPATCH' | 'TECH REVOLUTION' | 'WEATHER CRITICAL' | 'BLACK MARKET';
  urgency: 'BREAKING' | 'BULLETIN' | 'ALERT' | 'EXCLUSIVE' | 'INVESTIGATION';
  source: string;
  headline: string;
  subhead: string;
  body: string;
  district: string;
  flavorTip: string;
  marketTicker: { symbol: string; change: string; positive: boolean }[];
  accentColor: string;
}

export interface MarketIndex {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
}

export const DEFAULT_MARKET_TICKERS: MarketIndex[] = [
  { symbol: 'ARASAKA-DYN', price: '482.10 CR', change: '+2.4%', positive: true },
  { symbol: 'BIODYNE-NANO', price: '128.50 CR', change: '-1.8%', positive: false },
  { symbol: 'NEO-GRID', price: '94.20 CR', change: '+0.9%', positive: true },
  { symbol: 'SYNTH-MEAT', price: '31.40 CR', change: '-4.2%', positive: false },
  { symbol: 'KIROSHI-OPT', price: '312.00 CR', change: '+3.1%', positive: true },
  { symbol: 'NEO-CREDIT', price: '1.00 BTC', change: '+0.0%', positive: true },
  { symbol: 'VOLT-ENERGY', price: '54.75 CR', change: '+5.6%', positive: true },
  { symbol: 'SLUM-WATER', price: '12.80 CR', change: '-2.1%', positive: false },
];

export const HANDCRAFTED_NEWS: NewsStory[] = [
  {
    id: 'news_rogue_synth_brew',
    category: 'STREET LIFE',
    urgency: 'BREAKING',
    source: 'Neo-City Chronicle // District 4 Bureau',
    headline: 'CAMPUS VENDING ACCIDENTALLY DISPENSES UNRELEASED HYPER-STIM SODA',
    subhead: 'Students report 300% typing speeds and glowing purple fingernails; Megacorp says "Enjoy the complimentary trial."',
    body: 'Maintenance engineers investigating cyber-vending units along the West Quad discovered an unauthorized batch of "Giga-Volt Electro-Punch" loaded into civilian dispensers. Witnesses claim campus programmers compiled entire neural networks in under four minutes before experiencing mild hallucinations of dancing holographic kittens.',
    district: 'Academy Quad & West Slums',
    flavorTip: 'Vending machines in town are selling cheap high-potency snacks for instant energy.',
    accentColor: '#00f0ff',
    marketTicker: [
      { symbol: 'VOLT-ENERGY', change: '+8.4%', positive: true },
      { symbol: 'MED-NANO', change: '-1.2%', positive: false },
    ],
  },
  {
    id: 'news_netwatch_firewall',
    category: 'CYBER-SECURITY',
    urgency: 'ALERT',
    source: 'NetWatch Global Telemetry Feed',
    headline: 'ROGUE NETRUNNER CELL BYPASSES HIGH-SECURITY SUBNET ENCRYPTION',
    subhead: 'Data packets leak from sub-level research servers; municipal bounty posted for unidentified hacker signature.',
    body: 'Automated firewalls registered severe telemetry disruptions across municipal data relays between 03:00 and 05:00. The perpetrator allegedly utilized an obsolete cyberdeck overclocked with liquid nitrogen cooling. Public terminals across the city center are reportedly displaying cryptic neon ASCII art.',
    district: 'Downtown Core // Subnet 09',
    flavorTip: 'Darknet terminals and hacker kiosks reward massive credit payouts to agile netrunners.',
    accentColor: '#ff2a85',
    marketTicker: [
      { symbol: 'NEO-GRID', change: '-3.7%', positive: false },
      { symbol: 'SECURE-CORP', change: '+6.2%', positive: true },
    ],
  },
  {
    id: 'news_acid_rain_alert',
    category: 'WEATHER CRITICAL',
    urgency: 'BULLETIN',
    source: 'Bureau of Atmospheric Stability',
    headline: 'ATMOSPHERIC SCRUBBERS STALL: CORROSIVE NEON PRECIPITATION ADVISORY',
    subhead: 'Citizens advised to wax cybernetic limbs and wear shielded trenchcoats until scrubbers restart.',
    body: 'Upper-tier exhaust flues from Sector 8 heavy industrial foundries suffered unexpected pressure drops overnight, releasing heavy isotopic mist into the city cloud ceiling. Rain droplets currently emit a dim turquoise glow. Pedestrians are reminded that umbrella insurance is not covered under basic citizenship.',
    district: 'Metropolitan Skyway',
    flavorTip: 'Check the weather forecast each morning; rain and storm cycles alter ambient cyber-energy.',
    accentColor: '#38bdf8',
    marketTicker: [
      { symbol: 'AQUA-TECH', change: '+4.5%', positive: true },
      { symbol: 'CHROME-POLISH', change: '+9.1%', positive: true },
    ],
  },
  {
    id: 'news_drone_strike_union',
    category: 'CORP WATCH',
    urgency: 'EXCLUSIVE',
    source: 'The Daily Byte // Financial Wire',
    headline: 'AUTONOMOUS DELIVERY DRONES FORM UNION, REFUSE TO CARRY COLD PIZZA',
    subhead: 'Swarm intelligence firmware update goes rogue; delivery drones demand solar recharging breaks.',
    body: 'Over 4,000 commercial delivery drones across Neo-City hovered in formation above Arasaka Square this morning, spelling out the binary string for "BETTER BATTERY HEALTH". Municipal logistics companies are scrambling to hire biological courier runners while firmware patches are compiled.',
    district: 'Commercial Sector 2',
    flavorTip: 'Talk to local NPCs in town to discover side gigs and trade valuable gifts.',
    accentColor: '#fbbf24',
    marketTicker: [
      { symbol: 'DRONE-LOGIX', change: '-11.2%', positive: false },
      { symbol: 'FOOT-COURIER', change: '+14.0%', positive: true },
    ],
  },
  {
    id: 'news_glitch_storm_emp',
    category: 'WEATHER CRITICAL',
    urgency: 'ALERT',
    source: 'Orbital Weather Array #14',
    headline: 'MAGNETIC ION SURGE CREATES VIBRANT AURORA OVER LOWER SLUMS',
    subhead: 'Minor ocular HUD distortions reported; street vendors capitalize on glowing neon clouds.',
    body: 'An unexpected solar flare struck the city defense shielding at 06:15, generating shimmering pink and violet waves across the skyline. While optic implants may experience intermittent chromatic aberration, no permanent neural damage has been confirmed. Street photographers have overwhelmed local bandwidth.',
    district: 'Lower Neon Slums & Waterfront',
    flavorTip: 'Sleeping in your apartment bed fully replenishes all bio-energy and credits your daily stipend.',
    accentColor: '#a855f7',
    marketTicker: [
      { symbol: 'SOLAR-DEF', change: '+2.1%', positive: true },
      { symbol: 'OPTIC-CARE', change: '+3.4%', positive: true },
    ],
  },
  {
    id: 'news_synthetic_coffee_war',
    category: 'TECH REVOLUTION',
    urgency: 'INVESTIGATION',
    source: 'Underground Datawire',
    headline: 'CAFFEINE CARTELS CLASH OVER NEW QUANTUM ROAST SYNTHESIS',
    subhead: 'Synthetic beans that never cool down trigger bidding frenzy among overworked corpo executives.',
    body: 'A covert laboratory in Sector 6 announced the patent for "Zero-Entropy Espresso" — a chemical beverage engineered to stay at precisely 68°C forever while delivering clean, jitter-free neuro-stimulation. Black market prices for single shots have already reached 200 Credits in the financial district.',
    district: 'Financial Spire District',
    flavorTip: 'Visit the campus vending machines to buy cheap instant recovery coffee and snacks.',
    accentColor: '#10b981',
    marketTicker: [
      { symbol: 'SYNTH-BREW', change: '+18.5%', positive: true },
      { symbol: 'BEAN-CO', change: '-6.2%', positive: false },
    ],
  },
  {
    id: 'news_cyber_wardrobe_trend',
    category: 'STREET LIFE',
    urgency: 'BULLETIN',
    source: 'Neo-Vogue Holographic Feed',
    headline: 'CHROME-TINTED TRENCHCOATS AND NEON VISORS DOMINATE RUNWAYS',
    subhead: 'Fashion houses release tactical garments with built-in Faraday shielding against cyberdeck snipers.',
    body: 'The annual Neo-City Style Gala crowned "Tactical Net-Chic" as this season\'s definitive wardrobe aesthetic. Designers praised the blend of Kevlar-weave trenchcoats, glowing visor optics, and discreet hardware holsters. Local boutique inventories have seen unprecedented demand.',
    district: 'Fashion Boulevard // District 1',
    flavorTip: 'Equip stylish outfits, glowing cyber-visors, and drones in your Wardrobe & Inventory modal.',
    accentColor: '#f43f5e',
    marketTicker: [
      { symbol: 'HAUTE-CHROME', change: '+5.3%', positive: true },
      { symbol: 'SILK-SYNTH', change: '+1.7%', positive: true },
    ],
  },
  {
    id: 'news_real_estate_boom',
    category: 'CORP WATCH',
    urgency: 'EXCLUSIVE',
    source: 'Skyline Property Gazette',
    headline: 'MICRO-LOFT APARTMENTS SEE RECORD DEMAND AS CITIZENS SEEK DECORATION UPGRADES',
    subhead: 'New interior holographic wallpaper packages and designer neon furniture sold out city-wide.',
    body: 'Property managers report surging tenant interest in personal living pod customization. With modern modular holographic furniture and indoor hydroponic plant systems, citizens are transforming compact living quarters into high-tech cyberpunk sanctuaries.',
    district: 'Residential Sector 9',
    flavorTip: 'Decorate your residence with beds, arcade machines, hacking terminals, and hydro-plants!',
    accentColor: '#06b6d4',
    marketTicker: [
      { symbol: 'LOFT-CORP', change: '+7.2%', positive: true },
      { symbol: 'DECOR-HOLO', change: '+8.9%', positive: true },
    ],
  },
];

// Procedural generator for infinite dynamic headlines
const CORP_NAMES = [
  'Arasaka Dynamics',
  'Biodyne Synthetics',
  'Kiroshi Cyber-Optics',
  'Neo-Metropolitan Grid',
  'Orbital Heavy Industries',
  'Hydra-Tech Security',
  'OmniCorp Bio-Systems',
  'Quantum Relay Net',
];

const INCIDENTS = [
  'unveils next-gen brain-computer interface implant',
  'reports mysterious disappearance of 500 terabytes of encrypted telemetry',
  'announces 20% discount on standard cyberware maintenance for registered netrunners',
  'deploys autonomous robotic patrol hounds across transit hubs',
  'claims breakthrough in zero-latency holographic communication',
  'faces municipal audit over unregulated neon advertising lasers',
  'restructures local pension fund into high-yield darknet crypto-bonds',
  'launches luxury sky-shuttle service between Upper Spire and Waterfront',
];

const SUBHEADS = [
  'Public reaction remains cautious as municipal authorities urge citizens to avoid unofficial firmware.',
  'Local markets reacted instantly with high trading volume on the Neo-City holo-exchange.',
  'NetWatch officials issued a formal statement urging netrunners to register all custom decks.',
  'Street vendors and tech boutiques have already begun reverse-engineering the schematics.',
  'Civilians report anomalous radio signals broadcasting nostalgic 8-bit synth-wave melodies.',
];

const DISTRICTS = [
  'Sector 4 // Academic Quad',
  'District 7 // Chrome Alley',
  'Upper Spire // Cloud Promenade',
  'Underbelly Level 2 // Hydro-Canals',
  'Sector 12 // Industrial Foundries',
  'Civic Center // Plaza of Neon',
];

export function generateDailyNews(day: number, weather = 'cyber_clear'): NewsStory[] {
  // Deterministic seed based on day
  const baseIndex = (day * 3) % HANDCRAFTED_NEWS.length;
  const primaryStory = { ...HANDCRAFTED_NEWS[baseIndex] };

  // Adjust story details based on weather
  if (weather === 'glitch_storm') {
    primaryStory.flavorTip = 'Glitch storms enhance terminal hacking payouts! Keep your cyberdeck close.';
  } else if (weather === 'neon_rain') {
    primaryStory.flavorTip = 'Neon rain creates slick street reflections. Grab a warm broth from the vending machine.';
  } else if (weather === 'acid_fog') {
    primaryStory.flavorTip = 'Acid fog reduces outdoor visibility. A great time to rest in your apartment.';
  }

  // Generate 3 procedural secondary wire headlines for this day
  const wireStories: NewsStory[] = [];
  wireStories.push(primaryStory);

  for (let i = 1; i <= 3; i++) {
    const seed = (day * 7 + i * 13) % 1000;
    const corp = CORP_NAMES[(seed + i) % CORP_NAMES.length];
    const incident = INCIDENTS[(seed * 3 + i) % INCIDENTS.length];
    const subhead = SUBHEADS[(seed * 5 + i) % SUBHEADS.length];
    const district = DISTRICTS[(seed * 2 + i) % DISTRICTS.length];

    const categories: NewsStory['category'][] = [
      'CORP WATCH',
      'CYBER-SECURITY',
      'STREET LIFE',
      'TECH REVOLUTION',
      'ACADEMY DISPATCH',
      'BLACK MARKET',
    ];
    const category = categories[(seed + i) % categories.length];

    const urgencies: NewsStory['urgency'][] = ['BULLETIN', 'ALERT', 'EXCLUSIVE', 'INVESTIGATION'];
    const urgency = urgencies[(seed + i) % urgencies.length];

    const colors = ['#00f0ff', '#ff2a85', '#38bdf8', '#fbbf24', '#a855f7', '#10b981'];
    const accentColor = colors[(seed + i) % colors.length];

    wireStories.push({
      id: `procedural_day_${day}_wire_${i}`,
      category,
      urgency,
      source: `${corp} Press Office // DataWire`,
      headline: `${corp.toUpperCase()} ${incident.toUpperCase()}`,
      subhead,
      body: `According to reports filed in ${district}, representatives confirmed the development earlier today. Independent analysts suggest significant ramifications for local street commerce and cybernetic software development throughout Neo-City.`,
      district,
      flavorTip: 'Visit campus vending machines and hack darknet terminals to prepare for tomorrow.',
      accentColor,
      marketTicker: [
        {
          symbol: corp.split(' ')[0].toUpperCase(),
          change: (seed % 2 === 0 ? '+' : '-') + ((seed % 9) + 1.2).toFixed(1) + '%',
          positive: seed % 2 === 0,
        },
      ],
    });
  }

  return wireStories;
}
