import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Package } from 'lucide-react';

interface FilamentEntry {
  filament_id: string;
  grams: string;
}

interface FilamentOption {
  id: string;
  name: string;
  cost_per_gram: number;
}

interface MultiFilamentSelectorProps {
  filaments: FilamentOption[];
  entries: FilamentEntry[];
  onChange: (entries: FilamentEntry[]) => void;
}

export function MultiFilamentSelector({ filaments, entries, onChange }: MultiFilamentSelectorProps) {
  const addEntry = () => {
    onChange([...entries, { filament_id: '', grams: '' }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      onChange(entries.filter((_, i) => i !== index));
    }
  };

  const updateEntry = (index: number, field: keyof FilamentEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const totalCost = entries.reduce((sum, entry) => {
    const filament = filaments.find(f => f.id === entry.filament_id);
    const grams = parseFloat(entry.grams) || 0;
    return sum + (filament ? grams * filament.cost_per_gram : 0);
  }, 0);

  const totalGrams = entries.reduce((sum, entry) => sum + (parseFloat(entry.grams) || 0), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Filaments Used *
        </Label>
        <Button type="button" variant="ghost" size="sm" onClick={addEntry} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />Add Filament
        </Button>
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => {
          const filament = filaments.find(f => f.id === entry.filament_id);
          const entryCost = filament && entry.grams ? (parseFloat(entry.grams) * filament.cost_per_gram) : 0;
          
          return (
            <div key={index} className="flex gap-2 items-start p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex-1 space-y-2">
                <Select 
                  value={entry.filament_id} 
                  onValueChange={(v) => updateEntry(index, 'filament_id', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select filament" />
                  </SelectTrigger>
                  <SelectContent>
                    {filaments.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} (€{f.cost_per_gram.toFixed(4)}/g)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  step="0.1"
                  value={entry.grams}
                  onChange={(e) => updateEntry(index, 'grams', e.target.value)}
                  placeholder="Grams"
                  className="h-9"
                />
              </div>
              {entries.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEntry(index)}
                  className="h-9 w-9 shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              {entryCost > 0 && (
                <div className="text-xs text-muted-foreground whitespace-nowrap self-center">
                  €{entryCost.toFixed(2)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {entries.length > 0 && totalGrams > 0 && (
        <div className="flex justify-between text-sm p-2 rounded bg-accent/10 border border-accent/20">
          <span className="text-muted-foreground">Total: {totalGrams.toFixed(1)}g</span>
          <span className="font-medium text-accent">€{totalCost.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}
