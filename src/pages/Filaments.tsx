import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Edit, Trash2, Loader2, Sparkles } from 'lucide-react';
import { FILAMENT_MATERIALS, FILAMENT_COLORS, FILAMENT_BRANDS, FILAMENT_PRESETS, getFilamentPreset, getMaterialsForBrand } from '@/lib/filamentData';

interface FilamentType {
  id: string;
  name: string;
  brand: string | null;
  material: string | null;
  color: string | null;
  spool_weight_grams: number | null;
  spool_cost: number | null;
  cost_per_gram: number;
}

export default function Filaments() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [filaments, setFilaments] = useState<FilamentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<FilamentType | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    brand: '',
    material: '',
    color: '',
    customColor: '',
    spool_weight_grams: '1000',
    spool_cost: '',
    cost_per_gram: '',
  });

  const [customColors, setCustomColors] = useState<string[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);

  useEffect(() => {
    fetchFilaments();
  }, [user]);

  useEffect(() => {
    if (form.brand && form.brand !== 'Other') {
      const brandMaterials = getMaterialsForBrand(form.brand);
      if (brandMaterials.length > 0) {
        setAvailableMaterials(brandMaterials);
      } else {
        setAvailableMaterials([...FILAMENT_MATERIALS]);
      }
    } else {
      setAvailableMaterials([...FILAMENT_MATERIALS]);
    }
  }, [form.brand]);

  async function fetchFilaments() {
    if (!user) return;
    const { data } = await supabase.from('filaments').select('*').order('created_at', { ascending: false });
    if (data) {
      setFilaments(data as FilamentType[]);
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
      brand: '',
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
      brand: filament.brand || '',
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
  function updateAutoName(brand: string, material: string, color: string) {
    if (!editingFilament && (brand || material) && color) {
      const colorName = color === '__custom__' ? form.customColor : color;
      if (colorName) {
        const nameParts = [brand, material, colorName].filter(Boolean);
        setForm(prev => ({ ...prev, name: nameParts.join(' ') }));
      }
    }
  }

  function handleBrandChange(brand: string) {
    setForm(prev => ({ ...prev, brand, material: '' }));
  }

  function handleMaterialChange(material: string) {
    setForm(prev => ({ ...prev, material }));
    
    // Try to auto-fill from preset
    const preset = getFilamentPreset(form.brand, material);
    if (preset) {
      setForm(prev => ({
        ...prev,
        material,
        name: preset.name,
        spool_cost: preset.spoolCost.toString(),
        spool_weight_grams: (preset.spoolWeightKg * 1000).toString(),
        cost_per_gram: (preset.costPerKg / 1000).toFixed(4),
      }));
      toast({
        title: t('filaments.presetApplied'),
        description: `${t('filaments.presetAppliedCost')}: €${preset.costPerKg}/kg`,
      });
    } else {
      updateAutoName(form.brand, material, form.color);
    }
  }

  function handleColorChange(color: string) {
    setForm(prev => ({ ...prev, color, customColor: color === '__custom__' ? prev.customColor : '' }));
    updateAutoName(form.brand, form.material, color);
  }

  function handleCustomColorChange(customColor: string) {
    setForm(prev => ({ ...prev, customColor }));
    if (form.material || form.brand) {
      const nameParts = [form.brand, form.material, customColor].filter(Boolean);
      setForm(prev => ({ ...prev, name: prev.name || nameParts.join(' ') }));
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
      brand: form.brand.trim() || null,
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
      toast({ variant: 'destructive', title: t('error.generic'), description: error.message });
    } else {
      toast({ title: editingFilament ? t('filaments.filamentUpdated') : t('filaments.filamentAdded') });
      setDialogOpen(false);
      resetForm();
      fetchFilaments();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('filaments.confirmDelete'))) return;

    const { error } = await supabase.from('filaments').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: t('error.generic'), description: error.message });
    } else {
      toast({ title: t('filaments.filamentDeleted') });
      fetchFilaments();
    }
  }

  const allColors = [...FILAMENT_COLORS, ...customColors];
  const showPresetNotice = form.brand && form.material && getFilamentPreset(form.brand, form.material);

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('filaments.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('filaments.subtitle')}</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Plus className="w-4 h-4" />
                {t('filaments.addNew')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingFilament ? t('filaments.editFilament') : t('filaments.addNew')}</DialogTitle>
                <DialogDescription>{t('filaments.dialogDescription')}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">{t('printers.brand')}</Label>
                  <Select value={form.brand} onValueChange={handleBrandChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('filaments.selectBrand')} />
                    </SelectTrigger>
                    <SelectContent>
                      {FILAMENT_BRANDS.map((brand) => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="material">{t('filaments.material')}</Label>
                    <Select value={form.material} onValueChange={handleMaterialChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('filaments.selectMaterial')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMaterials.map((material) => (
                          <SelectItem key={material} value={material}>{material}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">{t('filaments.color')}</Label>
                    <Select value={form.color} onValueChange={handleColorChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('filaments.selectColor')} />
                      </SelectTrigger>
                      <SelectContent>
                        {allColors.map((color) => (
                          <SelectItem key={color} value={color}>{color}</SelectItem>
                        ))}
                        <SelectItem value="__custom__">{t('filaments.addNewColor')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {form.color === '__custom__' && (
                  <div className="space-y-2">
                    <Label htmlFor="customColor">{t('filaments.newColorName')}</Label>
                    <Input
                      id="customColor"
                      value={form.customColor}
                      onChange={(e) => handleCustomColorChange(e.target.value)}
                      placeholder="e.g. Midnight Blue"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">{t('filaments.filamentName')} *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. PLA+ Black"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t('filaments.autoGenerated')}</p>
                </div>

                {showPresetNotice && (
                  <div className="p-3 rounded-lg bg-secondary/10 border border-secondary/20 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-secondary mt-0.5" />
                    <p className="text-sm text-secondary">
                      {t('filaments.presetApplied')}
                    </p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-muted/50 space-y-4">
                  <p className="text-sm font-medium">{t('filaments.calculateFromSpool')}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spool_cost">{t('filaments.spoolCost')} (€)</Label>
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
                      <Label htmlFor="spool_weight">{t('filaments.spoolWeight')}</Label>
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
                  <Label htmlFor="cost_per_gram">{t('filaments.costPerGram')} (€) *</Label>
                  <Input
                    id="cost_per_gram"
                    type="number"
                    step="0.0001"
                    value={form.cost_per_gram}
                    onChange={(e) => setForm({ ...form, cost_per_gram: e.target.value })}
                    placeholder="0.02"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{t('filaments.autoCalculated')}</p>
                </div>
                <Button type="submit" variant="secondary" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingFilament ? t('filaments.updateFilament') : t('filaments.addNew')}
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
              <h3 className="font-semibold text-lg mb-2">{t('filaments.noFilamentsYet')}</h3>
              <p className="text-muted-foreground mb-4">{t('filaments.addFirstFilament')}</p>
              <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                {t('filaments.addNew')}
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
                        {(filament.brand || filament.material || filament.color) && (
                          <CardDescription>{[filament.brand, filament.material, filament.color].filter(Boolean).join(' • ')}</CardDescription>
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
                    <span className="text-muted-foreground">{t('filaments.costPerGram')}</span>
                    <span className="font-medium">€{filament.cost_per_gram.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('filaments.costPerKg')}</span>
                    <span className="font-medium">€{(filament.cost_per_gram * 1000).toFixed(2)}</span>
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
