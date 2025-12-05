import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Zap, ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';

interface ElectricityStepProps {
  onNext: () => void;
  onBack: () => void;
  onElectricityAdded: () => void;
}

const PRESETS = [
  { country: 'Portugal', pricePerKwh: 0.15, flag: '🇵🇹' },
  { country: 'Spain', pricePerKwh: 0.18, flag: '🇪🇸' },
  { country: 'Germany', pricePerKwh: 0.35, flag: '🇩🇪' },
  { country: 'France', pricePerKwh: 0.22, flag: '🇫🇷' },
  { country: 'UK', pricePerKwh: 0.28, flag: '🇬🇧' },
  { country: 'USA', pricePerKwh: 0.15, flag: '🇺🇸' },
  { country: 'Netherlands', pricePerKwh: 0.25, flag: '🇳🇱' },
  { country: 'Italy', pricePerKwh: 0.24, flag: '🇮🇹' },
];

export function ElectricityStep({ onNext, onBack, onElectricityAdded }: ElectricityStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    price_per_kwh: '',
    contracted_power_kva: '3.45',
    daily_fixed_cost: '',
  });

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    setSelectedPreset(preset.country);
    setForm({
      ...form,
      name: `${preset.country} Electricity`,
      price_per_kwh: preset.pricePerKwh.toString(),
    });
  };

  const handleSave = async () => {
    if (!user || !form.name || !form.price_per_kwh) return;
    setSaving(true);

    const { error } = await supabase.from('electricity_settings').insert([{
      user_id: user.id,
      name: form.name,
      price_per_kwh: parseFloat(form.price_per_kwh) || 0.15,
      contracted_power_kva: parseFloat(form.contracted_power_kva) || 3.45,
      daily_fixed_cost: form.daily_fixed_cost ? parseFloat(form.daily_fixed_cost) : null,
    }]);

    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setAdded(true);
      onElectricityAdded();
      toast({ title: 'Electricity settings saved!' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-accent" />
        </div>
        <h2 className="font-display text-2xl font-bold">Electricity Costs</h2>
        <p className="text-muted-foreground text-sm mt-1">
          How much does electricity cost where you print?
        </p>
      </div>

      {added ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <p className="font-medium text-success">Electricity settings saved!</p>
          <p className="text-sm text-muted-foreground mt-1">You can update this later in Settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Quick presets by country</Label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(preset => (
                <button
                  key={preset.country}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={`p-3 rounded-lg border text-center transition-all hover:border-primary/50 ${
                    selectedPreset === preset.country
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 bg-card'
                  }`}
                >
                  <span className="text-xl">{preset.flag}</span>
                  <p className="text-xs font-medium mt-1">{preset.country}</p>
                  <p className="text-xs text-muted-foreground">€{preset.pricePerKwh}/kWh</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="space-y-2">
              <Label>Profile Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Home Electricity"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price per kWh (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price_per_kwh}
                  onChange={e => setForm({ ...form, price_per_kwh: e.target.value })}
                  placeholder="0.15"
                />
              </div>
              <div className="space-y-2">
                <Label>Contracted Power (kVA)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.contracted_power_kva}
                  onChange={e => setForm({ ...form, contracted_power_kva: e.target.value })}
                  placeholder="3.45"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Daily Fixed Cost (€) <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                type="number"
                step="0.01"
                value={form.daily_fixed_cost}
                onChange={e => setForm({ ...form, daily_fixed_cost: e.target.value })}
                placeholder="0.50"
              />
            </div>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.price_per_kwh} className="w-full">
              {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Electricity Settings'}
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
