import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Printer, Edit, Trash2, Loader2, Sparkles } from 'lucide-react';
import { PRINTER_BRANDS, getModelsForBrand, getPrinterSpec, hoursToMonths } from '@/lib/printerData';

interface PrinterType {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  purchase_cost: number;
  depreciation_months: number;
  depreciation_hours: number;
  maintenance_cost: number;
  power_watts: number;
  default_electricity_settings_id: string | null;
  notes: string | null;
}

interface ElectricitySetting {
  id: string;
  name: string;
}

export default function Printers() {
  const { user } = useAuth();
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [electricitySettings, setElectricitySettings] = useState<ElectricitySetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<PrinterType | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    brand: '',
    model: '',
    customModel: '',
    purchase_cost: '',
    depreciation_months: '24',
    depreciation_hours: '5000',
    maintenance_cost: '0',
    power_watts: '200',
    default_electricity_settings_id: '',
    notes: '',
  });

  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [useCustomModel, setUseCustomModel] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (form.brand && form.brand !== 'Other') {
      setAvailableModels(getModelsForBrand(form.brand));
    } else {
      setAvailableModels([]);
      setUseCustomModel(true);
    }
  }, [form.brand]);

  async function fetchData() {
    if (!user) return;

    const [printersRes, electricityRes] = await Promise.all([
      supabase.from('printers').select('*').order('created_at', { ascending: false }),
      supabase.from('electricity_settings').select('id, name'),
    ]);

    if (printersRes.data) setPrinters(printersRes.data as PrinterType[]);
    if (electricityRes.data) setElectricitySettings(electricityRes.data);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      name: '',
      brand: '',
      model: '',
      customModel: '',
      purchase_cost: '',
      depreciation_months: '24',
      depreciation_hours: '5000',
      maintenance_cost: '0',
      power_watts: '200',
      default_electricity_settings_id: '',
      notes: '',
    });
    setEditingPrinter(null);
    setAvailableModels([]);
    setUseCustomModel(false);
  }

  function openEditDialog(printer: PrinterType) {
    setEditingPrinter(printer);
    const brand = printer.brand || '';
    const isKnownModel = brand && brand !== 'Other' && getModelsForBrand(brand).includes(printer.model || '');
    
    setForm({
      name: printer.name,
      brand: brand,
      model: isKnownModel ? (printer.model || '') : '',
      customModel: isKnownModel ? '' : (printer.model || ''),
      purchase_cost: printer.purchase_cost.toString(),
      depreciation_months: printer.depreciation_months.toString(),
      depreciation_hours: (printer.depreciation_hours || 5000).toString(),
      maintenance_cost: (printer.maintenance_cost || 0).toString(),
      power_watts: printer.power_watts.toString(),
      default_electricity_settings_id: printer.default_electricity_settings_id || '',
      notes: printer.notes || '',
    });
    
    if (brand && brand !== 'Other') {
      setAvailableModels(getModelsForBrand(brand));
      setUseCustomModel(!isKnownModel);
    } else {
      setUseCustomModel(true);
    }
    setDialogOpen(true);
  }

  function handleBrandChange(brand: string) {
    setForm(prev => ({ ...prev, brand, model: '', customModel: '' }));
    if (brand && brand !== 'Other') {
      setAvailableModels(getModelsForBrand(brand));
      setUseCustomModel(false);
    } else {
      setAvailableModels([]);
      setUseCustomModel(true);
    }
  }

  function handleModelChange(model: string) {
    if (model === '__custom__') {
      setUseCustomModel(true);
      setForm(prev => ({ ...prev, model: '', customModel: '' }));
      return;
    }
    
    setUseCustomModel(false);
    const spec = getPrinterSpec(form.brand, model);
    if (spec) {
      const depreciationMonths = hoursToMonths(spec.depreciationHours);
      setForm(prev => ({
        ...prev,
        model,
        customModel: '',
        name: prev.name || `${spec.brand} ${spec.model}`,
        purchase_cost: spec.purchaseCost.toString(),
        power_watts: spec.powerWatts.toString(),
        depreciation_hours: spec.depreciationHours.toString(),
        depreciation_months: depreciationMonths.toString(),
        maintenance_cost: spec.maintenanceCost.toString(),
      }));
      toast({
        title: 'Specs auto-filled',
        description: `Power: ${spec.powerWatts}W, Cost: €${spec.purchaseCost}, Maintenance: €${spec.maintenanceCost}`,
      });
    } else {
      setForm(prev => ({ ...prev, model, customModel: '' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const finalModel = useCustomModel ? form.customModel.trim() : form.model.trim();

    const data = {
      user_id: user.id,
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      model: finalModel || null,
      purchase_cost: parseFloat(form.purchase_cost) || 0,
      depreciation_months: parseFloat(form.depreciation_months) || 24,
      depreciation_hours: parseFloat(form.depreciation_hours) || 5000,
      maintenance_cost: parseFloat(form.maintenance_cost) || 0,
      power_watts: parseFloat(form.power_watts) || 200,
      default_electricity_settings_id: form.default_electricity_settings_id || null,
      notes: form.notes.trim() || null,
    };

    let error;
    if (editingPrinter) {
      const res = await supabase.from('printers').update(data).eq('id', editingPrinter.id);
      error = res.error;
    } else {
      const res = await supabase.from('printers').insert([data]);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: editingPrinter ? 'Printer updated' : 'Printer added' });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this printer?')) return;

    const { error } = await supabase.from('printers').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Printer deleted' });
      fetchData();
    }
  }

  const showAutoFillNotice = form.brand && form.model && !useCustomModel && getPrinterSpec(form.brand, form.model);

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Printers</h1>
            <p className="text-muted-foreground mt-1">Manage your 3D printers and their costs</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4" />
                Add Printer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPrinter ? 'Edit Printer' : 'Add Printer'}</DialogTitle>
                <DialogDescription>Select a known printer to auto-fill specs, or enter manually</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand</Label>
                    <Select value={form.brand} onValueChange={handleBrandChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRINTER_BRANDS.map((brand) => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    {availableModels.length > 0 && !useCustomModel ? (
                      <Select value={form.model} onValueChange={handleModelChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                          <SelectItem value="__custom__">Other (custom)</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          id="model"
                          value={form.customModel}
                          onChange={(e) => setForm({ ...form, customModel: e.target.value })}
                          placeholder="e.g. MK3S+"
                        />
                        {availableModels.length > 0 && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => setUseCustomModel(false)}
                          >
                            Choose from list instead
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Printer Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. My Workshop Printer"
                    required
                  />
                </div>

                {showAutoFillNotice && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                    <p className="text-sm text-primary">
                      Specs auto-filled from known printer database
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchase_cost">Purchase Cost (€)</Label>
                    <Input
                      id="purchase_cost"
                      type="number"
                      step="0.01"
                      value={form.purchase_cost}
                      onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance_cost">Maintenance Cost (€)</Label>
                    <Input
                      id="maintenance_cost"
                      type="number"
                      step="0.01"
                      value={form.maintenance_cost}
                      onChange={(e) => setForm({ ...form, maintenance_cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depreciation_hours">Depreciation (hours)</Label>
                    <Input
                      id="depreciation_hours"
                      type="number"
                      value={form.depreciation_hours}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value) || 5000;
                        setForm({ 
                          ...form, 
                          depreciation_hours: e.target.value,
                          depreciation_months: hoursToMonths(hours).toString()
                        });
                      }}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="power_watts">Power Usage (watts)</Label>
                    <Input
                      id="power_watts"
                      type="number"
                      value={form.power_watts}
                      onChange={(e) => setForm({ ...form, power_watts: e.target.value })}
                      placeholder="200"
                    />
                  </div>
                </div>

                {electricitySettings.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="electricity">Default Electricity Profile</Label>
                    <Select
                      value={form.default_electricity_settings_id}
                      onValueChange={(v) => setForm({ ...form, default_electricity_settings_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select profile (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {electricitySettings.map((es) => (
                          <SelectItem key={es.id} value={es.id}>{es.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Any additional notes..."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPrinter ? 'Update Printer' : 'Add Printer'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : printers.length === 0 ? (
          <Card className="shadow-card border-border/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Printer className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No printers yet</h3>
              <p className="text-muted-foreground mb-4">Add your first printer to start tracking costs</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Printer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {printers.map((printer) => (
              <Card key={printer.id} className="shadow-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Printer className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{printer.name}</CardTitle>
                        {(printer.brand || printer.model) && (
                          <CardDescription>{[printer.brand, printer.model].filter(Boolean).join(' ')}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(printer)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(printer.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Cost</span>
                    <span className="font-medium">€{printer.purchase_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Maintenance</span>
                    <span className="font-medium">€{(printer.maintenance_cost || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depreciation</span>
                    <span className="font-medium">{printer.depreciation_hours || 5000}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Power</span>
                    <span className="font-medium">{printer.power_watts}W</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Cost/hour</span>
                    <span>€{((printer.purchase_cost + (printer.maintenance_cost || 0)) / (printer.depreciation_hours || 5000)).toFixed(4)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
