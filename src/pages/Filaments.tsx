import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Edit, Trash2, Loader2 } from 'lucide-react';
import { FILAMENT_MATERIALS, FILAMENT_COLORS } from '@/lib/filamentData';

interface FilamentType {
  id: string;
  name: string;
  material: string | null;
  color: string | null;
  spool_weight_grams: number | null;
  spool_cost: number | null;
  cost_per_gram: number;
}

export default function Filaments() {
  const { user } = useAuth();
  const [filaments, setFilaments] = useState<FilamentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<FilamentType | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    material: '',
    color: '',
    customColor: '',
    spool_weight_grams: '1000',
    spool_cost: '',
    cost_per_gram: '',
  });

  const [customColors, setCustomColors] = useState<string[]>([]);

  useEffect(() => {
    fetchFilaments();
  }, [user]);

  async function fetchFilaments() {
    if (!user) return;
    const { data } = await supabase.from('filaments').select('*').order('created_at', { ascending: false });
    if (data) {
      setFilaments(data);
      // Extract custom colors from existing filaments
      const existingColors = data
        .map(f => f.color)
        .filter((c): c is string => c !== null && !FILAMENT_COLORS.includes(c as any));
      setCustomColors([...new Set(existingColors)]);
    }
    setLoading(false);
  }

  function resetForm() {
    setForm({
      name: '',
      material: '',
      color: '',
      customColor: '',
      spool_weight_grams: '1000',
      spool_cost: '',
      cost_per_gram: '',
    });
    setEditingFilament(null);
  }

  function openEditDialog(filament: FilamentType) {
    setEditingFilament(filament);
    const isCustomColor = filament.color && !FILAMENT_COLORS.includes(filament.color as any);
    setForm({
      name: filament.name,
      material: filament.material || '',
      color: isCustomColor ? '__custom__' : (filament.color || ''),
      customColor: isCustomColor ? filament.color || '' : '',
      spool_weight_grams: filament.spool_weight_grams?.toString() || '1000',
      spool_cost: filament.spool_cost?.toString() || '',
      cost_per_gram: filament.cost_per_gram.toString(),
    });
    setDialogOpen(true);
  }

  // Auto-generate name when material or color changes
  function updateAutoName(material: string, color: string) {
    if (!editingFilament && material && color) {
      const colorName = color === '__custom__' ? form.customColor : color;
      if (colorName) {
        setForm(prev => ({ ...prev, name: `${material} ${colorName}` }));
      }
    }
  }

  function handleMaterialChange(material: string) {
    setForm(prev => ({ ...prev, material }));
    updateAutoName(material, form.color);
  }

  function handleColorChange(color: string) {
    setForm(prev => ({ ...prev, color, customColor: color === '__custom__' ? prev.customColor : '' }));
    updateAutoName(form.material, color);
  }

  function handleCustomColorChange(customColor: string) {
    setForm(prev => ({ ...prev, customColor }));
    if (form.material) {
      setForm(prev => ({ ...prev, name: prev.name || `${form.material} ${customColor}` }));
    }
  }

  // Auto-calculate cost per gram when spool info changes
  function handleSpoolChange(field: 'spool_cost' | 'spool_weight_grams', value: string) {
    const newForm = { ...form, [field]: value };
    const spoolCost = parseFloat(field === 'spool_cost' ? value : form.spool_cost);
    const spoolWeight = parseFloat(field === 'spool_weight_grams' ? value : form.spool_weight_grams);
    
    if (spoolCost > 0 && spoolWeight > 0) {
      newForm.cost_per_gram = (spoolCost / spoolWeight).toFixed(4);
    }
    
    setForm(newForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const finalColor = form.color === '__custom__' ? form.customColor.trim() : form.color.trim();

    const data = {
      user_id: user.id,
      name: form.name.trim(),
      material: form.material.trim() || null,
      color: finalColor || null,
      spool_weight_grams: parseFloat(form.spool_weight_grams) || null,
      spool_cost: parseFloat(form.spool_cost) || null,
      cost_per_gram: parseFloat(form.cost_per_gram) || 0.02,
    };

    let error;
    if (editingFilament) {
      const res = await supabase.from('filaments').update(data).eq('id', editingFilament.id);
      error = res.error;
    } else {
      const res = await supabase.from('filaments').insert([data]);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: editingFilament ? 'Filament updated' : 'Filament added' });
      setDialogOpen(false);
      resetForm();
      fetchFilaments();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this filament?')) return;

    const { error } = await supabase.from('filaments').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Filament deleted' });
      fetchFilaments();
    }
  }

  const allColors = [...FILAMENT_COLORS, ...customColors];

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Filaments</h1>
            <p className="text-muted-foreground mt-1">Track your filament inventory and costs</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="w-4 h-4" />
                Add Filament
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFilament ? 'Edit Filament' : 'Add Filament'}</DialogTitle>
                <DialogDescription>Enter filament details for accurate cost tracking</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">Material</Label>
                    <Select value={form.material} onValueChange={handleMaterialChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {FILAMENT_MATERIALS.map((material) => (
                          <SelectItem key={material} value={material}>{material}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Select value={form.color} onValueChange={handleColorChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {allColors.map((color) => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                        <SelectItem value="__custom__">+ Add new color</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.color === '__custom__' && (
                  <div className="space-y-2">
                    <Label htmlFor="customColor">New Color Name</Label>
                    <Input
                      id="customColor"
                      value={form.customColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      placeholder="e.g. Midnight Blue"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Filament Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. PLA+ Black"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Auto-generated from material + color, or enter custom</p>
                </div>

                <div className="p-4 rounded-xl bg-muted/50 space-y-4">
                  <p className="text-sm font-medium">Calculate from spool</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spool_cost">Spool Cost (€)</Label>
                      <Input
                        id="spool_cost"
                        type="number"
                        step="0.01"
                        value={form.spool_cost}
                        onChange={(e) => handleSpoolChange('spool_cost', e.target.value)}
                        placeholder="20.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spool_weight">Spool Weight (g)</Label>
                      <Input
                        id="spool_weight"
                        type="number"
                        value={form.spool_weight_grams}
                        onChange={(e) => handleSpoolChange('spool_weight_grams', e.target.value)}
                        placeholder="1000"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost_per_gram">Cost Per Gram (€) *</Label>
                  <Input
                    id="cost_per_gram"
                    type="number"
                    step="0.0001"
                    value={form.cost_per_gram}
                    onChange={(e) => setForm({ ...form, cost_per_gram: e.target.value })}
                    placeholder="0.02"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated from spool info, or enter manually</p>
                </div>
                <Button type="submit" variant="secondary" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingFilament ? 'Update Filament' : 'Add Filament'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          </div>
        ) : filaments.length === 0 ? (
          <Card className="shadow-card border-border/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No filaments yet</h3>
              <p className="text-muted-foreground mb-4">Add your filament types to track material costs</p>
              <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Filament
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filaments.map((filament) => (
              <Card key={filament.id} className="shadow-card border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: filament.color ? `${filament.color}20` : 'hsl(var(--secondary) / 0.1)' }}
                      >
                        <Package className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{filament.name}</CardTitle>
                        {(filament.material || filament.color) && (
                          <CardDescription>{[filament.material, filament.color].filter(Boolean).join(' • ')}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(filament)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(filament.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cost per gram</span>
                    <span className="font-medium">€{filament.cost_per_gram.toFixed(4)}</span>
                  </div>
                  {filament.spool_cost && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spool cost</span>
                      <span className="font-medium">€{filament.spool_cost.toFixed(2)}</span>
                    </div>
                  )}
                  {filament.spool_weight_grams && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spool weight</span>
                      <span className="font-medium">{filament.spool_weight_grams}g</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
