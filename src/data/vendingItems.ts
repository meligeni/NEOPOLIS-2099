export interface VendingItem {
  id: string;
  slotCode: string;
  name: string;
  category: 'drink' | 'snack' | 'meal';
  cost: number;
  energyRestore: number;
  description: string;
  flavor: string;
  iconName: string;
  color: string;
  tags: string[];
}

export const VENDING_ITEMS: VendingItem[] = [
  {
    id: 'vend_soda_blue',
    slotCode: 'A1',
    name: 'Neo-Fizz Cyber-Cola',
    category: 'drink',
    cost: 8,
    energyRestore: 22,
    description: 'Chilled neon-blue soda charged with taurine, glucose, and carbonated fizz.',
    flavor: '“Crisp, electric bite with a sweet synth-blueberry finish.”',
    iconName: 'Zap',
    color: '#00f0ff',
    tags: ['Cold Drink', '+22 Energy'],
  },
  {
    id: 'vend_gummies',
    slotCode: 'A2',
    name: 'Glitch-Berry Chews',
    category: 'snack',
    cost: 6,
    energyRestore: 16,
    description: 'Sour synthetic pectin gummies that tingle on the tongue and spark focus.',
    flavor: '“Hyper-tart sour sugar crystal coating with chewy berry core.”',
    iconName: 'Sparkles',
    color: '#ff2a85',
    tags: ['Quick Snack', '+16 Energy'],
  },
  {
    id: 'vend_espresso',
    slotCode: 'B1',
    name: 'Nano-Espresso Overdrive',
    category: 'drink',
    cost: 12,
    energyRestore: 36,
    description: 'Pressurized double-shot black cold brew infused with neuro-stimulants.',
    flavor: '“Dark roasted cyber-beans with an intense hazelnut kick.”',
    iconName: 'Coffee',
    color: '#f59e0b',
    tags: ['Neural Boost', '+36 Energy'],
  },
  {
    id: 'vend_jerky',
    slotCode: 'B2',
    name: 'Smoked Soy-Jerky Strip',
    category: 'snack',
    cost: 14,
    energyRestore: 42,
    description: 'High-protein smoked soy brisket stick seasoned with cracked pepper & wasabi.',
    flavor: '“Savory, smoky, and satisfyingly chewy street protein.”',
    iconName: 'Flame',
    color: '#ef4444',
    tags: ['High Protein', '+42 Energy'],
  },
  {
    id: 'vend_steambao',
    slotCode: 'C1',
    name: 'Cyber-Bao Spicy Steamer',
    category: 'meal',
    cost: 18,
    energyRestore: 58,
    description: 'Self-steaming sealed bun filled with savory spicy soy mince and scallions.',
    flavor: '“Piping hot fluffy dough bursting with aromatic chili broth.”',
    iconName: 'UtensilsCrossed',
    color: '#eab308',
    tags: ['Hot Food', '+58 Energy'],
  },
  {
    id: 'vend_ionfuel',
    slotCode: 'C2',
    name: 'Giga-Volt Ion Fuel',
    category: 'drink',
    cost: 24,
    energyRestore: 80,
    description: 'Dense ionic electrolyte gel pouch engineered for military runner endurance.',
    flavor: '“Citrus lightning in a foil pouch. Reboots your bio-battery in seconds.”',
    iconName: 'BatteryCharging',
    color: '#22c55e',
    tags: ['Maximum Surge', '+80 Energy'],
  },
  {
    id: 'vend_matcha',
    slotCode: 'D1',
    name: 'Matcha Synth-Tea',
    category: 'drink',
    cost: 10,
    energyRestore: 28,
    description: 'Ceremonial bio-grown green tea fortified with antioxidant micro-beads.',
    flavor: '“Smooth, calming herbal warmth with earthy grassy undertones.”',
    iconName: 'CupSoda',
    color: '#10b981',
    tags: ['Herbal Calm', '+28 Energy'],
  },
  {
    id: 'vend_ramen_can',
    slotCode: 'D2',
    name: 'Ramen-in-a-Can Broth',
    category: 'meal',
    cost: 16,
    energyRestore: 50,
    description: 'Self-heating can of rich miso broth with tender springy instant noodles.',
    flavor: '“Rich garlic-sesame broth you can sip directly from the insulated can.”',
    iconName: 'Soup',
    color: '#f97316',
    tags: ['Warm Broth', '+50 Energy'],
  },
];
