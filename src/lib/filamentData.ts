// Known filament materials, brands, and colors

export interface FilamentPreset {
  brand: string;
  material: string;
  name: string;
  spoolCost: number;
  spoolWeightKg: number;
  costPerKg: number;
}

export const FILAMENT_MATERIALS = [
  'PLA',
  'PLA+',
  'PLA Silk',
  'PLA Matte',
  'PLA Wood',
  'PLA Glitter',
  'PLA CF',
  'PLA Basic Refill',
  'PLA Basic with Spool',
  'PLA Matte Refill',
  'PLA Silk+ with Spool',
  'PETG',
  'PETG CF',
  'PETG Matte',
  'PETG Metallic',
  'PETG Translucent',
  'PETG HF Refill',
  'PETG HF with Spool',
  'PETG Translucent Refill',
  'PETG Translucent with Spool',
  'ABS',
  'ASA',
  'ASA+ABS',
  'PA6 (Nylon)',
  'PC (Polycarbonate)',
  'TPU',
  'TPE',
  'HIPS',
  'PVA',
] as const;

export const FILAMENT_BRANDS = [
  'Lotactree',
  'Filament 3D',
  'SUBINK',
  'Bambu Lab',
  'Polymaker',
  'eSUN',
  'Overture',
  'Hatchbox',
  'Sunlu',
  'Eryone',
  'Inland',
  'Amazon Basics',
  'Prusament',
  'ColorFabb',
  'Other',
] as const;

export const FILAMENT_COLORS = [
  'White',
  'Black',
  'Gray',
  'Silver',
  'Gold',
  'Red',
  'Orange',
  'Yellow',
  'Green',
  'Blue',
  'Navy',
  'Purple',
  'Pink',
  'Brown',
  'Beige',
  'Natural',
  'Transparent',
  'Glow in Dark',
  'Wood',
  'Marble',
  'Bronze',
  'Copper',
  'Multicolor',
  'Rainbow',
] as const;

// Preset filaments from user data
export const FILAMENT_PRESETS: FilamentPreset[] = [
  // Lotactree
  { brand: 'Lotactree', material: 'PLA', name: 'Lotactree PLA', spoolCost: 14.23, spoolWeightKg: 1, costPerKg: 14.23 },
  { brand: 'Lotactree', material: 'PLA Silk', name: 'Lotactree PLA SILK', spoolCost: 15.04, spoolWeightKg: 1, costPerKg: 15.04 },
  { brand: 'Lotactree', material: 'PETG', name: 'Lotactree PETG', spoolCost: 14.23, spoolWeightKg: 1, costPerKg: 14.23 },
  { brand: 'Lotactree', material: 'ABS', name: 'Lotactree ABS', spoolCost: 15.04, spoolWeightKg: 1, costPerKg: 15.04 },
  { brand: 'Lotactree', material: 'PA6 (Nylon)', name: 'Lotactree PA6', spoolCost: 18.29, spoolWeightKg: 1, costPerKg: 18.29 },
  { brand: 'Lotactree', material: 'PC (Polycarbonate)', name: 'Lotactree PC', spoolCost: 21.06, spoolWeightKg: 1, costPerKg: 21.06 },
  { brand: 'Lotactree', material: 'ASA', name: 'Lotactree ASA', spoolCost: 15.85, spoolWeightKg: 1, costPerKg: 15.85 },
  { brand: 'Lotactree', material: 'ASA+ABS', name: 'Lotactree ASA+ABS', spoolCost: 15.85, spoolWeightKg: 1, costPerKg: 15.85 },
  // Filament 3D
  { brand: 'Filament 3D', material: 'PLA', name: 'Filament 3D PLA', spoolCost: 14.23, spoolWeightKg: 1, costPerKg: 14.23 },
  { brand: 'Filament 3D', material: 'PLA Silk', name: 'Filament 3D PLA SILK', spoolCost: 15.04, spoolWeightKg: 1, costPerKg: 15.04 },
  { brand: 'Filament 3D', material: 'PLA Glitter', name: 'Filament 3D PLA GLITTER', spoolCost: 16.06, spoolWeightKg: 1, costPerKg: 16.06 },
  { brand: 'Filament 3D', material: 'PLA Matte', name: 'Filament 3D PLA MATTE', spoolCost: 15.04, spoolWeightKg: 1, costPerKg: 15.04 },
  { brand: 'Filament 3D', material: 'PLA Wood', name: 'Filament 3D PLA WOOD', spoolCost: 17.07, spoolWeightKg: 0.5, costPerKg: 34.15 },
  { brand: 'Filament 3D', material: 'PETG', name: 'Filament 3D PETG', spoolCost: 15.04, spoolWeightKg: 1, costPerKg: 15.04 },
  { brand: 'Filament 3D', material: 'ASA', name: 'Filament 3D ASA', spoolCost: 17.07, spoolWeightKg: 1, costPerKg: 17.07 },
  // SUBINK
  { brand: 'SUBINK', material: 'PLA', name: 'SUBINK PLA', spoolCost: 10.56, spoolWeightKg: 1, costPerKg: 10.56 },
  { brand: 'SUBINK', material: 'PLA Silk', name: 'SUBINK PLA SILK', spoolCost: 10.56, spoolWeightKg: 1, costPerKg: 10.56 },
  { brand: 'SUBINK', material: 'PLA Matte', name: 'SUBINK PLA MATTE', spoolCost: 10.56, spoolWeightKg: 1, costPerKg: 10.56 },
  { brand: 'SUBINK', material: 'PLA CF', name: 'SUBINK PLA CF', spoolCost: 20.32, spoolWeightKg: 1, costPerKg: 20.32 },
  { brand: 'SUBINK', material: 'PLA Wood', name: 'SUBINK PLA WOOD', spoolCost: 15.85, spoolWeightKg: 1, costPerKg: 15.85 },
  { brand: 'SUBINK', material: 'PETG', name: 'SUBINK PETG', spoolCost: 10.04, spoolWeightKg: 1, costPerKg: 10.04 },
  { brand: 'SUBINK', material: 'PETG CF', name: 'SUBINK PETG CF', spoolCost: 20.32, spoolWeightKg: 1, costPerKg: 20.32 },
  { brand: 'SUBINK', material: 'PETG Matte', name: 'SUBINK PETG MATTE', spoolCost: 10.56, spoolWeightKg: 1, costPerKg: 10.56 },
  { brand: 'SUBINK', material: 'PETG Metallic', name: 'SUBINK PETG METALLIC', spoolCost: 10.56, spoolWeightKg: 1, costPerKg: 10.56 },
  // Bambu Lab
  { brand: 'Bambu Lab', material: 'PLA Basic Refill', name: 'BAMBU PLA BASIC REFILL', spoolCost: 16.25, spoolWeightKg: 1, costPerKg: 16.25 },
  { brand: 'Bambu Lab', material: 'PLA Basic with Spool', name: 'BAMBU PLA BASIC WITH SPOOL', spoolCost: 21.13, spoolWeightKg: 1, costPerKg: 21.13 },
  { brand: 'Bambu Lab', material: 'PLA Matte Refill', name: 'BAMBU PLA MATTE REFILL', spoolCost: 16.25, spoolWeightKg: 1, costPerKg: 16.25 },
  { brand: 'Bambu Lab', material: 'PLA Silk+ with Spool', name: 'BAMBU PLA SILK + WITH SPOOL', spoolCost: 19.50, spoolWeightKg: 1, costPerKg: 19.50 },
  { brand: 'Bambu Lab', material: 'PETG HF Refill', name: 'BAMBU PETG HF REFILL', spoolCost: 18.69, spoolWeightKg: 1, costPerKg: 18.69 },
  { brand: 'Bambu Lab', material: 'PETG HF with Spool', name: 'BAMBU PETG HF WITH SPOOL', spoolCost: 21.13, spoolWeightKg: 1, costPerKg: 21.13 },
  { brand: 'Bambu Lab', material: 'PETG Translucent Refill', name: 'BAMBU PETG TRANSLUCENT REFILL', spoolCost: 18.69, spoolWeightKg: 1, costPerKg: 18.69 },
  { brand: 'Bambu Lab', material: 'PETG Translucent with Spool', name: 'BAMBU PETG TRANSLUCENT WITH SPOOL', spoolCost: 21.13, spoolWeightKg: 1, costPerKg: 21.13 },
];

export function getFilamentPreset(brand: string, material: string): FilamentPreset | undefined {
  return FILAMENT_PRESETS.find(f => f.brand === brand && f.material === material);
}

export function getMaterialsForBrand(brand: string): string[] {
  const materials = FILAMENT_PRESETS
    .filter(f => f.brand === brand)
    .map(f => f.material);
  return [...new Set(materials)];
}

export type FilamentMaterial = typeof FILAMENT_MATERIALS[number];
export type FilamentColor = typeof FILAMENT_COLORS[number];
export type FilamentBrand = typeof FILAMENT_BRANDS[number];
