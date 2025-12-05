// Known printer brands and models with default specs
export interface PrinterSpec {
  brand: string;
  model: string;
  purchaseCost: number;
  powerWatts: number;
  depreciationMonths: number;
}

export const PRINTER_BRANDS = ['Bambu Lab', 'Prusa', 'Creality', 'Anycubic', 'Elegoo', 'Other'] as const;

export const KNOWN_PRINTERS: PrinterSpec[] = [
  // Bambu Lab
  { brand: 'Bambu Lab', model: 'X1-Carbon Combo', purchaseCost: 1449, powerWatts: 250, depreciationMonths: 60 },
  { brand: 'Bambu Lab', model: 'X1-Carbon', purchaseCost: 1200, powerWatts: 250, depreciationMonths: 60 },
  { brand: 'Bambu Lab', model: 'P1S Combo', purchaseCost: 950, powerWatts: 250, depreciationMonths: 60 },
  { brand: 'Bambu Lab', model: 'P1S', purchaseCost: 700, powerWatts: 150, depreciationMonths: 60 },
  { brand: 'Bambu Lab', model: 'P1P', purchaseCost: 550, powerWatts: 180, depreciationMonths: 60 },
  { brand: 'Bambu Lab', model: 'A1 Combo', purchaseCost: 560, powerWatts: 120, depreciationMonths: 36 },
  { brand: 'Bambu Lab', model: 'A1', purchaseCost: 400, powerWatts: 120, depreciationMonths: 36 },
  { brand: 'Bambu Lab', model: 'A1 mini Combo', purchaseCost: 460, powerWatts: 80, depreciationMonths: 36 },
  { brand: 'Bambu Lab', model: 'A1 mini', purchaseCost: 300, powerWatts: 80, depreciationMonths: 36 },
  { brand: 'Bambu Lab', model: 'H2S', purchaseCost: 1400, powerWatts: 250, depreciationMonths: 60 },
  { brand: 'Bambu Lab', model: 'H2D', purchaseCost: 2100, powerWatts: 250, depreciationMonths: 60 },
  // Prusa
  { brand: 'Prusa', model: 'MK4S', purchaseCost: 1100, powerWatts: 120, depreciationMonths: 60 },
  { brand: 'Prusa', model: 'MK4', purchaseCost: 1050, powerWatts: 120, depreciationMonths: 60 },
  { brand: 'Prusa', model: 'MK3S+', purchaseCost: 800, powerWatts: 120, depreciationMonths: 60 },
  { brand: 'Prusa', model: 'Mini+', purchaseCost: 460, powerWatts: 80, depreciationMonths: 36 },
  { brand: 'Prusa', model: 'XL', purchaseCost: 4400, powerWatts: 250, depreciationMonths: 60 },
  { brand: 'Prusa', model: 'XL 2-Head', purchaseCost: 3100, powerWatts: 250, depreciationMonths: 60 },
  { brand: 'Prusa', model: 'XL 5-Head', purchaseCost: 4400, powerWatts: 250, depreciationMonths: 60 },
  { brand: 'Prusa', model: 'Core One', purchaseCost: 1350, powerWatts: 250, depreciationMonths: 60 },
  // Creality
  { brand: 'Creality', model: 'Ender 3 V3', purchaseCost: 200, powerWatts: 350, depreciationMonths: 24 },
  { brand: 'Creality', model: 'Ender 3 V3 SE', purchaseCost: 180, powerWatts: 270, depreciationMonths: 24 },
  { brand: 'Creality', model: 'Ender 5 S1', purchaseCost: 400, powerWatts: 350, depreciationMonths: 36 },
  { brand: 'Creality', model: 'K1', purchaseCost: 450, powerWatts: 350, depreciationMonths: 36 },
  { brand: 'Creality', model: 'K1 Max', purchaseCost: 750, powerWatts: 500, depreciationMonths: 48 },
  // Anycubic
  { brand: 'Anycubic', model: 'Kobra 3', purchaseCost: 350, powerWatts: 400, depreciationMonths: 36 },
  { brand: 'Anycubic', model: 'Kobra 2', purchaseCost: 250, powerWatts: 400, depreciationMonths: 24 },
  { brand: 'Anycubic', model: 'Kobra 2 Pro', purchaseCost: 300, powerWatts: 400, depreciationMonths: 36 },
  // Elegoo
  { brand: 'Elegoo', model: 'Neptune 4', purchaseCost: 230, powerWatts: 310, depreciationMonths: 24 },
  { brand: 'Elegoo', model: 'Neptune 4 Pro', purchaseCost: 300, powerWatts: 310, depreciationMonths: 36 },
  { brand: 'Elegoo', model: 'Neptune 4 Max', purchaseCost: 470, powerWatts: 450, depreciationMonths: 36 },
];

export function getModelsForBrand(brand: string): string[] {
  return KNOWN_PRINTERS
    .filter(p => p.brand === brand)
    .map(p => p.model);
}

export function getPrinterSpec(brand: string, model: string): PrinterSpec | undefined {
  return KNOWN_PRINTERS.find(p => p.brand === brand && p.model === model);
}
