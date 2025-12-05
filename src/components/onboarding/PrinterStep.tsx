import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PRINTER_BRANDS, getModelsForBrand, getPrinterSpec } from '@/lib/printerData';
import { Printer, ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';

interface PrinterStepProps {
  onNext: () => void;
  onBack: () => void;
  onPrinterAdded: () => void;
}

export function PrinterStep({ onNext, onBack, onPrinterAdded }: PrinterStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [form, setForm] = useState({
    name: '',
    purchase_cost: '',
    power_watts: '',
    depreciation_hours: '5000',
    maintenance_cost: '0',
  });

  const availableModels = selectedBrand ? getModelsForBrand(selectedBrand) : [];

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand);
    setSelectedModel('');
    if (brand === 'Other') {
      setForm({ name: '', purchase_cost: '', power_watts: '', depreciation_hours: '5000', maintenance_cost: '0' });
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    const spec = getPrinterSpec(selectedBrand, model);
    if (spec) {
      setForm({
        name: `${spec.brand} ${spec.model}`,
        purchase_cost: spec.purchaseCost.toString(),
        power_watts: spec.powerWatts.toString(),
        depreciation_hours: spec.depreciationHours.toString(),
        maintenance_cost: spec.maintenanceCost.toString(),
      });
    }
  };

  const handleSave = async () => {
    if (!user || !form.name) return;
    setSaving(true);
    
    const { error } = await supabase.from('printers').insert([{
      user_id: user.id,
      name: form.name,
      brand: selectedBrand !== 'Other' ? selectedBrand : null,
      model: selectedModel || null,
      purchase_cost: parseFloat(form.purchase_cost) || 0,
      power_watts: parseFloat(form.power_watts) || 200,
      depreciation_hours: parseFloat(form.depreciation_hours) || 5000,
      maintenance_cost: parseFloat(form.maintenance_cost) || 0,
    }]);

    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setAdded(true);
      onPrinterAdded();
      toast({ title: 'Printer added!' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <Printer className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold">Add Your First Printer</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Select from popular brands or enter custom details
        </p>
      </div>

      {added ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <p className="font-medium text-success">Printer added successfully!</p>
          <p className="text-sm text-muted-foreground mt-1">You can add more printers later from Settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={selectedBrand} onValueChange={handleBrandChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {PRINTER_BRANDS.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedBrand && selectedBrand !== 'Other' && (
              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={selectedModel} onValueChange={handleModelChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map(model => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {(selectedModel || selectedBrand === 'Other') && (
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="space-y-2">
                <Label>Printer Name</Label>
                <Input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. My Bambu Lab P1S"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Purchase Cost (€)</Label>
                  <Input
                    type="number"
                    value={form.purchase_cost}
                    onChange={e => setForm({ ...form, purchase_cost: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Power (Watts)</Label>
                  <Input
                    type="number"
                    value={form.power_watts}
                    onChange={e => setForm({ ...form, power_watts: e.target.value })}
                    placeholder="200"
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving || !form.name} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Add Printer'}
              </Button>
            </div>
          )}
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
