import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Download, FileText, FileSpreadsheet } from 'lucide-react';

interface PrintCalculations {
  filamentCost: number;
  energyCost: number;
  depreciationCost: number;
  fixedCostShare: number;
  extraCosts: number;
  preparationCost: number;
  postProcessingCost: number;
  shippingCost: number;
  consumablesCost: number;
  totalCost: number;
  priceBeforeDiscount: number;
  recommendedPrice: number;
  profit: number;
  profitAmount: number;
  discountTable: {
    discountPct: number;
    discountedPrice: number;
    discountAmount: number;
    potentialProfit: number;
    finalPrice: number;
  }[];
}

interface PrintInfo {
  id: string;
  name: string;
  printerName: string;
  filamentName: string;
  filamentUsedGrams: number;
  printTimeHours: number;
  profitMarginPercent: number;
  discountPercent: number;
}

interface PrintDetailPanelProps {
  print: PrintInfo | null;
  calculations: PrintCalculations | null;
  onExportCSV: () => void;
  onExportPDF: () => void;
}

const DISCOUNT_PERCENTAGES = [0, 5, 10, 20, 30, 50];

export function PrintDetailPanel({ print, calculations, onExportCSV, onExportPDF }: PrintDetailPanelProps) {
  if (!print || !calculations) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-2">Select a print</h3>
        <p className="text-muted-foreground">Click on a print from the list to view its pricing details</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">{print.name}</h2>
          <p className="text-muted-foreground">{print.printerName} • {print.filamentName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPDF}>
            <Download className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </div>

      {/* Print Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-lg bg-muted/50">
          <span className="text-muted-foreground">Filament Used</span>
          <p className="font-semibold">{print.filamentUsedGrams}g</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <span className="text-muted-foreground">Print Time</span>
          <p className="font-semibold">{print.printTimeHours}h</p>
        </div>
      </div>

      {/* Recommended Price */}
      <div className="p-6 rounded-xl gradient-accent text-accent-foreground space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Recommended Sale Price
        </h3>
        <p className="text-4xl font-bold">€{calculations.recommendedPrice.toFixed(2)}</p>
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4" />
          <span>Profit: €{calculations.profit.toFixed(2)}</span>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="p-4 rounded-xl bg-muted/50 space-y-3">
        <h4 className="font-semibold">Cost Breakdown</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Filament</span>
            <span>€{calculations.filamentCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depreciation</span>
            <span>€{calculations.depreciationCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Electricity</span>
            <span>€{calculations.energyCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Consumables</span>
            <span>€{calculations.consumablesCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Preparation</span>
            <span>€{calculations.preparationCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Post-Processing</span>
            <span>€{calculations.postProcessingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>€{calculations.shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subscriptions/Fixed</span>
            <span>€{calculations.fixedCostShare.toFixed(2)}</span>
          </div>
          {calculations.extraCosts > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Extra Costs</span>
              <span>€{calculations.extraCosts.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total Production Cost</span>
            <span>€{calculations.totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Profit ({print.profitMarginPercent}%)</span>
            <span>€{calculations.profitAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Discount Table */}
      <div className="p-4 rounded-xl bg-muted/50">
        <h4 className="font-semibold mb-3">Discount Table (without VAT)</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Discount</TableHead>
              {DISCOUNT_PERCENTAGES.map(d => (
                <TableHead key={d} className="text-xs text-center">{d}%</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-xs font-medium">Price</TableCell>
              {calculations.discountTable.map((d, i) => (
                <TableCell key={i} className="text-xs text-center">
                  €{d.discountedPrice.toFixed(2)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-medium">Cost</TableCell>
              {calculations.discountTable.map((_, i) => (
                <TableCell key={i} className="text-xs text-center text-muted-foreground">
                  €{calculations.totalCost.toFixed(2)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-medium">Discount</TableCell>
              {calculations.discountTable.map((d, i) => (
                <TableCell key={i} className="text-xs text-center text-muted-foreground">
                  €{d.discountAmount.toFixed(2)}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-medium">Profit</TableCell>
              {calculations.discountTable.map((d, i) => (
                <TableCell
                  key={i}
                  className={`text-xs text-center font-medium ${d.potentialProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  €{d.potentialProfit.toFixed(2)}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
