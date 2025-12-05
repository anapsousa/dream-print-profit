// Known filament materials and colors

export const FILAMENT_MATERIALS = [
  'PLA',
  'PLA+',
  'PLA Silk',
  'PLA Matte',
  'PLA Wood',
  'PLA Glitter',
  'PLA CF',
  'PETG',
  'PETG CF',
  'PETG Matte',
  'PETG Metallic',
  'PETG Translucent',
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
] as const;

export type FilamentMaterial = typeof FILAMENT_MATERIALS[number];
export type FilamentColor = typeof FILAMENT_COLORS[number];
