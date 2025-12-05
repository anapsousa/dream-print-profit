import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FILAMENT_BRANDS, FILAMENT_MATERIALS, FILAMENT_COLORS, getFilamentPreset } from '@/lib/filamentData';
import { Package, ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';

interface FilamentStepProps {
  onNext: () => void;
  onBack: () => void;
  onFilamentAdded: () => void;
}

export function FilamentStep({ onNext, onBack, onFilamentAdded }: FilamentStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [form, setForm] = useState({
    name: '',
    spool_cost: '',
    spool_weight: '1000',
  });

  const handleBrandMaterialChange = (brand: string, material: string) => {
    const preset = getFilamentPreset(brand, material);
    if (preset) {
      setForm({
        name: preset.name,
        spool_cost: preset.spoolCost.toString(),
        spool_weight: (preset.spoolWeightKg * 1000).toString(),
      });
    }
  };

  const handleSave = async () => {
    if (!user || !form.name) return;
    setSaving(true);

    const spoolCost = parseFloat(form.spool_cost) || 0;
    const spoolWeight = parseFloat(form.spool_weight) || 1000;
    const costPerGram = spoolWeight > 0 ? spoolCost / spoolWeight : 0;

    const { error } = await supabase.from('filaments').insert([{
      user_id: user.id,
      name: form.name,
      brand: selectedBrand !== 'Other' ? selectedBrand : null,
      material: selectedMaterial || null,
      color: selectedColor || null,
      spool_cost: spoolCost,
      spool_weight_grams: spoolWeight,
      cost_per_gram: costPerGram,
    }]);

    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setAdded(true);
      onFilamentAdded();
      toast({ title: 'Filament added!' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Add Your First Filament</h2>
        <p className="text-muted-foreground text-sm mt-1">
          What material do you usually print with?
        </p>
      </div>

      {added ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <p className="font-medium text-success">Filament added successfully!</p>
          <p className="text-sm text-muted-foreground mt-1">You can add more filaments later from Settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={selectedBrand} onValueChange={(v) => {
                setSelectedBrand(v);
                if (selectedMaterial) handleBrandMaterialChange(v, selectedMaterial);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {FILAMENT_BRANDS.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
              <Select value={selectedMaterial} onValueChange={(v) => {
                setSelectedMaterial(v);
                if (selectedBrand) handleBrandMaterialChange(selectedBrand, v);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  {FILAMENT_MATERIALS.map(mat => (
                    <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger>
                <SelectValue placeholder="Select color (optional)" />
              </SelectTrigger>
              <SelectContent>
                {FILAMENT_COLORS.map(color => (
                  <SelectItem key={color} value={color}>{color}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="space-y-2">
              <Label>Filament Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. PLA Black"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Spool Cost (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.spool_cost}
                  onChange={e => setForm({ ...form, spool_cost: e.target.value })}
                  placeholder="20.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Spool Weight (g)</Label>
                <Input
                  type="number"
                  value={form.spool_weight}
                  onChange={e => setForm({ ...form, spool_weight: e.target.value })}
                  placeholder="1000"
                />
              </div>
            </div>
            {form.spool_cost && form.spool_weight && (
              <p className="text-sm text-muted-foreground">
                Cost per gram: €{(parseFloat(form.spool_cost) / parseFloat(form.spool_weight) || 0).toFixed(4)}
              </p>
            )}
            <Button onClick={handleSave} disabled={saving || !form.name} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Add Filament'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <Button onClick={onNext} variant={added ? 'default' : 'outline'}>
          {added ? 'Continue' : 'Skip for now'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
