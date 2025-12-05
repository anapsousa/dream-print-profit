// Known printer brands and models with default specs
export interface PrinterSpec {
  brand: string;
  model: string;
  purchaseCost: number;
  powerWatts: number;
  depreciationHours: number;
  maintenanceCost: number;
}

export const PRINTER_BRANDS = [
  'Bambu Lab',
  'Prusa',
  'Creality',
  'Anycubic',
  'Elegoo',
  'Voron',
  'Raise3D',
  'Ultimaker',
  'FlashForge',
  'QIDI',
  'Sovol',
  'Artillery',
  'Voxelab',
  'Other'
] as const;

export const KNOWN_PRINTERS: PrinterSpec[] = [
  // Bambu Lab (updated with user values)
  { brand: 'Bambu Lab', model: 'X1-Carbon Combo', purchaseCost: 0, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 200 },
  { brand: 'Bambu Lab', model: 'X1-Carbon', purchaseCost: 1200, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 350 },
  { brand: 'Bambu Lab', model: 'P1S Combo', purchaseCost: 950, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 400 },
  { brand: 'Bambu Lab', model: 'P1S', purchaseCost: 700, powerWatts: 150, depreciationHours: 5000, maintenanceCost: 350 },
  { brand: 'Bambu Lab', model: 'P1P', purchaseCost: 550, powerWatts: 180, depreciationHours: 5000, maintenanceCost: 350 },
  { brand: 'Bambu Lab', model: 'A1 Combo', purchaseCost: 560, powerWatts: 120, depreciationHours: 3000, maintenanceCost: 250 },
  { brand: 'Bambu Lab', model: 'A1', purchaseCost: 400, powerWatts: 120, depreciationHours: 3000, maintenanceCost: 200 },
  { brand: 'Bambu Lab', model: 'A1 mini Combo', purchaseCost: 460, powerWatts: 80, depreciationHours: 3000, maintenanceCost: 200 },
  { brand: 'Bambu Lab', model: 'A1 mini', purchaseCost: 300, powerWatts: 80, depreciationHours: 3000, maintenanceCost: 150 },
  { brand: 'Bambu Lab', model: 'H2S', purchaseCost: 1400, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 700 },
  { brand: 'Bambu Lab', model: 'H2D', purchaseCost: 2100, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 1000 },
  // Prusa (updated with user values)
  { brand: 'Prusa', model: 'MK4S', purchaseCost: 1100, powerWatts: 120, depreciationHours: 5000, maintenanceCost: 350 },
  { brand: 'Prusa', model: 'MK4', purchaseCost: 1050, powerWatts: 120, depreciationHours: 5000, maintenanceCost: 350 },
  { brand: 'Prusa', model: 'MK3S+', purchaseCost: 800, powerWatts: 120, depreciationHours: 5000, maintenanceCost: 300 },
  { brand: 'Prusa', model: 'Mini+', purchaseCost: 460, powerWatts: 80, depreciationHours: 3000, maintenanceCost: 200 },
  { brand: 'Prusa', model: 'XL', purchaseCost: 4400, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 1200 },
  { brand: 'Prusa', model: 'XL 2-Head', purchaseCost: 3100, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 900 },
  { brand: 'Prusa', model: 'XL 5-Head', purchaseCost: 4400, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 1200 },
  { brand: 'Prusa', model: 'Core One', purchaseCost: 1350, powerWatts: 250, depreciationHours: 5000, maintenanceCost: 400 },
  // Creality
  { brand: 'Creality', model: 'Ender 3 V3', purchaseCost: 200, powerWatts: 350, depreciationHours: 2000, maintenanceCost: 100 },
  { brand: 'Creality', model: 'Ender 3 V3 SE', purchaseCost: 180, powerWatts: 270, depreciationHours: 2000, maintenanceCost: 80 },
  { brand: 'Creality', model: 'Ender 3 V3 Plus', purchaseCost: 300, powerWatts: 400, depreciationHours: 2500, maintenanceCost: 120 },
  { brand: 'Creality', model: 'Ender 3 V3 KE', purchaseCost: 250, powerWatts: 350, depreciationHours: 2000, maintenanceCost: 100 },
  { brand: 'Creality', model: 'Ender 5 S1', purchaseCost: 400, powerWatts: 350, depreciationHours: 3000, maintenanceCost: 150 },
  { brand: 'Creality', model: 'K1', purchaseCost: 450, powerWatts: 350, depreciationHours: 3000, maintenanceCost: 150 },
  { brand: 'Creality', model: 'K1C', purchaseCost: 500, powerWatts: 400, depreciationHours: 3000, maintenanceCost: 180 },
  { brand: 'Creality', model: 'K1 Max', purchaseCost: 750, powerWatts: 500, depreciationHours: 4000, maintenanceCost: 250 },
  { brand: 'Creality', model: 'K2 Plus', purchaseCost: 1200, powerWatts: 600, depreciationHours: 5000, maintenanceCost: 400 },
  { brand: 'Creality', model: 'Sermoon V1', purchaseCost: 350, powerWatts: 350, depreciationHours: 2500, maintenanceCost: 120 },
  { brand: 'Creality', model: 'Sermoon V1 Pro', purchaseCost: 450, powerWatts: 400, depreciationHours: 3000, maintenanceCost: 150 },
  { brand: 'Creality', model: 'CR-10 SE', purchaseCost: 400, powerWatts: 450, depreciationHours: 3000, maintenanceCost: 150 },
  { brand: 'Creality', model: 'CR-10 Smart Pro', purchaseCost: 550, powerWatts: 500, depreciationHours: 3500, maintenanceCost: 200 },
  // Anycubic
  { brand: 'Anycubic', model: 'Kobra 3', purchaseCost: 350, powerWatts: 400, depreciationHours: 3000, maintenanceCost: 150 },
  { brand: 'Anycubic', model: 'Kobra 3 Combo', purchaseCost: 450, powerWatts: 400, depreciationHours: 3000, maintenanceCost: 180 },
  { brand: 'Anycubic', model: 'Kobra 2', purchaseCost: 250, powerWatts: 400, depreciationHours: 2000, maintenanceCost: 100 },
  { brand: 'Anycubic', model: 'Kobra 2 Pro', purchaseCost: 300, powerWatts: 400, depreciationHours: 3000, maintenanceCost: 120 },
  { brand: 'Anycubic', model: 'Kobra 2 Max', purchaseCost: 450, powerWatts: 500, depreciationHours: 3500, maintenanceCost: 180 },
  { brand: 'Anycubic', model: 'Kobra 2 Plus', purchaseCost: 400, powerWatts: 450, depreciationHours: 3000, maintenanceCost: 150 },
  { brand: 'Anycubic', model: 'Kobra S1', purchaseCost: 280, powerWatts: 350, depreciationHours: 2500, maintenanceCost: 100 },
  { brand: 'Anycubic', model: 'Vyper', purchaseCost: 350, powerWatts: 350, depreciationHours: 2500, maintenanceCost: 120 },
  // Elegoo
  { brand: 'Elegoo', model: 'Neptune 4', purchaseCost: 230, powerWatts: 310, depreciationHours: 2000, maintenanceCost: 80 },
  { brand: 'Elegoo', model: 'Neptune 4 Pro', purchaseCost: 300, powerWatts: 310, depreciationHours: 3000, maintenanceCost: 100 },
  { brand: 'Elegoo', model: 'Neptune 4 Plus', purchaseCost: 380, powerWatts: 400, depreciationHours: 3000, maintenanceCost: 130 },
  { brand: 'Elegoo', model: 'Neptune 4 Max', purchaseCost: 470, powerWatts: 450, depreciationHours: 3000, maintenanceCost: 160 },
  { brand: 'Elegoo', model: 'Neptune 3 Pro', purchaseCost: 280, powerWatts: 350, depreciationHours: 2500, maintenanceCost: 100 },
  { brand: 'Elegoo', model: 'Neptune 3 Plus', purchaseCost: 350, powerWatts: 400, depreciationHours: 3000, maintenanceCost: 120 },
  { brand: 'Elegoo', model: 'Neptune 3 Max', purchaseCost: 450, powerWatts: 450, depreciationHours: 3000, maintenanceCost: 150 },
  // Voron (DIY kits - estimated)
  { brand: 'Voron', model: '0.2', purchaseCost: 400, powerWatts: 200, depreciationHours: 5000, maintenanceCost: 100 },
  { brand: 'Voron', model: 'Trident 250', purchaseCost: 800, powerWatts: 400, depreciationHours: 6000, maintenanceCost: 150 },
  { brand: 'Voron', model: 'Trident 300', purchaseCost: 900, powerWatts: 450, depreciationHours: 6000, maintenanceCost: 180 },
  { brand: 'Voron', model: 'Trident 350', purchaseCost: 1000, powerWatts: 500, depreciationHours: 6000, maintenanceCost: 200 },
  { brand: 'Voron', model: '2.4 250', purchaseCost: 1000, powerWatts: 450, depreciationHours: 6000, maintenanceCost: 200 },
  { brand: 'Voron', model: '2.4 300', purchaseCost: 1100, powerWatts: 500, depreciationHours: 6000, maintenanceCost: 220 },
  { brand: 'Voron', model: '2.4 350', purchaseCost: 1200, powerWatts: 550, depreciationHours: 6000, maintenanceCost: 250 },
  // Raise3D
  { brand: 'Raise3D', model: 'E2', purchaseCost: 3500, powerWatts: 350, depreciationHours: 8000, maintenanceCost: 500 },
  { brand: 'Raise3D', model: 'Pro3', purchaseCost: 5000, powerWatts: 500, depreciationHours: 10000, maintenanceCost: 800 },
  { brand: 'Raise3D', model: 'Pro3 Plus', purchaseCost: 7000, powerWatts: 600, depreciationHours: 10000, maintenanceCost: 1000 },
  { brand: 'Raise3D', model: 'RMF500', purchaseCost: 25000, powerWatts: 1500, depreciationHours: 15000, maintenanceCost: 3000 },
  // Ultimaker
  { brand: 'Ultimaker', model: 'S3', purchaseCost: 4000, powerWatts: 350, depreciationHours: 8000, maintenanceCost: 600 },
  { brand: 'Ultimaker', model: 'S5', purchaseCost: 6500, powerWatts: 500, depreciationHours: 10000, maintenanceCost: 900 },
  { brand: 'Ultimaker', model: 'S7', purchaseCost: 7500, powerWatts: 500, depreciationHours: 10000, maintenanceCost: 1000 },
  { brand: 'Ultimaker', model: 'Method', purchaseCost: 5000, powerWatts: 400, depreciationHours: 8000, maintenanceCost: 700 },
  { brand: 'Ultimaker', model: 'Method X', purchaseCost: 7000, powerWatts: 500, depreciationHours: 10000, maintenanceCost: 900 },
  // FlashForge
  { brand: 'FlashForge', model: 'Adventurer 5M', purchaseCost: 400, powerWatts: 350, depreciationHours: 3000, maintenanceCost: 120 },
  { brand: 'FlashForge', model: 'Adventurer 5M Pro', purchaseCost: 550, powerWatts: 400, depreciationHours: 3500, maintenanceCost: 150 },
  { brand: 'FlashForge', model: 'Creator 4', purchaseCost: 4500, powerWatts: 500, depreciationHours: 8000, maintenanceCost: 600 },
  { brand: 'FlashForge', model: 'Guider 3', purchaseCost: 2000, powerWatts: 400, depreciationHours: 6000, maintenanceCost: 300 },
  { brand: 'FlashForge', model: 'Guider 3 Plus', purchaseCost: 2500, powerWatts: 450, depreciationHours: 6000, maintenanceCost: 400 },
  // QIDI
  { brand: 'QIDI', model: 'X-Max 3', purchaseCost: 800, powerWatts: 500, depreciationHours: 4000, maintenanceCost: 200 },
  { brand: 'QIDI', model: 'X-Plus 3', purchaseCost: 600, powerWatts: 400, depreciationHours: 3500, maintenanceCost: 150 },
  { brand: 'QIDI', model: 'X-Smart 3', purchaseCost: 450, powerWatts: 350, depreciationHours: 3000, maintenanceCost: 120 },
  { brand: 'QIDI', model: 'Q1 Pro', purchaseCost: 500, powerWatts: 400, depreciationHours: 3500, maintenanceCost: 150 },
  // Sovol
  { brand: 'Sovol', model: 'SV06', purchaseCost: 220, powerWatts: 350, depreciationHours: 2000, maintenanceCost: 80 },
  { brand: 'Sovol', model: 'SV06 Plus', purchaseCost: 300, powerWatts: 400, depreciationHours: 2500, maintenanceCost: 100 },
  { brand: 'Sovol', model: 'SV07', purchaseCost: 400, powerWatts: 450, depreciationHours: 3000, maintenanceCost: 130 },
  { brand: 'Sovol', model: 'SV07 Plus', purchaseCost: 500, powerWatts: 500, depreciationHours: 3500, maintenanceCost: 160 },
  // Artillery
  { brand: 'Artillery', model: 'Sidewinder X4 Plus', purchaseCost: 400, powerWatts: 500, depreciationHours: 3000, maintenanceCost: 130 },
  { brand: 'Artillery', model: 'Sidewinder X4 Pro', purchaseCost: 350, powerWatts: 450, depreciationHours: 3000, maintenanceCost: 120 },
  { brand: 'Artillery', model: 'Genius Pro', purchaseCost: 280, powerWatts: 350, depreciationHours: 2500, maintenanceCost: 100 },
  { brand: 'Artillery', model: 'Hornet', purchaseCost: 200, powerWatts: 300, depreciationHours: 2000, maintenanceCost: 80 },
  // Voxelab
  { brand: 'Voxelab', model: 'Aquila X2', purchaseCost: 180, powerWatts: 300, depreciationHours: 2000, maintenanceCost: 70 },
  { brand: 'Voxelab', model: 'Aquila D1', purchaseCost: 250, powerWatts: 350, depreciationHours: 2500, maintenanceCost: 90 },
  { brand: 'Voxelab', model: 'Aquila S2', purchaseCost: 300, powerWatts: 350, depreciationHours: 3000, maintenanceCost: 100 },
];

export function getModelsForBrand(brand: string): string[] {
  return KNOWN_PRINTERS
    .filter(p => p.brand === brand)
    .map(p => p.model);
}

export function getPrinterSpec(brand: string, model: string): PrinterSpec | undefined {
  return KNOWN_PRINTERS.find(p => p.brand === brand && p.model === model);
}

// Convert depreciation hours to approximate months (assuming 8 hours/day, 20 days/month)
export function hoursToMonths(hours: number): number {
  const hoursPerMonth = 8 * 20; // 160 hours per month
  return Math.round(hours / hoursPerMonth);
}
