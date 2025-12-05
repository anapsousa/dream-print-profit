import { Button } from '@/components/ui/button';
import { FileText, Edit, Trash2, Package, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PrintListItemProps {
  id: string;
  name: string;
  printerName: string;
  filamentName: string;
  filamentUsedGrams: number;
  printTimeHours: number;
  totalCost: number;
  recommendedPrice: number;
  profit: number;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PrintListItem({
  name,
  printerName,
  filamentName,
  filamentUsedGrams,
  printTimeHours,
  totalCost,
  recommendedPrice,
  profit,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: PrintListItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 rounded-xl border cursor-pointer transition-all",
        isSelected
          ? "border-accent bg-accent/5 shadow-soft"
          : "border-border/50 bg-card hover:border-accent/50 hover:bg-accent/5"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isSelected ? "bg-accent/20" : "bg-accent/10"
          )}>
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground">{printerName} • {filamentName}</p>
          </div>
        </div>
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          {filamentUsedGrams}g
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {Math.floor(printTimeHours)}h {Math.round((printTimeHours % 1) * 60)}m
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Cost</span>
          <p className="font-medium">€{totalCost.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Price</span>
          <p className="font-bold text-accent">€{recommendedPrice.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Profit</span>
          <p className={cn("font-medium", profit >= 0 ? "text-green-600" : "text-red-600")}>
            €{profit.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
