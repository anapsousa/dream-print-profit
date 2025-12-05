import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface GlobalPrinter {
  id: string;
  brand: string;
  model: string;
  purchase_cost: number;
  maintenance_cost: number;
  depreciation_hours: number;
  power_watts: number;
  is_active: boolean;
}

export default function AdminPrinters() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [printers, setPrinters] = useState<GlobalPrinter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<GlobalPrinter | null>(null);
  const [form, setForm] = useState({
    brand: '',
    model: '',
    purchase_cost: '',
    maintenance_cost: '',
    depreciation_hours: '',
    power_watts: '',
    is_active: true,
  });

  const fetchPrinters = async () => {
    const { data, error } = await supabase
      .from('global_printers')
      .select('*')
      .order('brand', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setPrinters(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrinters();
  }, []);

  const resetForm = () => {
    setForm({
      brand: '',
      model: '',
      purchase_cost: '',
      maintenance_cost: '',
      depreciation_hours: '',
      power_watts: '',
      is_active: true,
    });
    setEditingPrinter(null);
  };

  const openEditDialog = (printer: GlobalPrinter) => {
    setEditingPrinter(printer);
    setForm({
      brand: printer.brand,
      model: printer.model,
      purchase_cost: printer.purchase_cost.toString(),
      maintenance_cost: printer.maintenance_cost.toString(),
      depreciation_hours: printer.depreciation_hours.toString(),
      power_watts: printer.power_watts.toString(),
      is_active: printer.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.brand || !form.model) {
      toast({ variant: 'destructive', title: 'Error', description: 'Brand and model are required' });
      return;
    }

    setSaving(true);
    const printerData = {
      brand: form.brand,
      model: form.model,
      purchase_cost: parseFloat(form.purchase_cost) || 0,
      maintenance_cost: parseFloat(form.maintenance_cost) || 0,
      depreciation_hours: parseFloat(form.depreciation_hours) || 5000,
      power_watts: parseFloat(form.power_watts) || 200,
      is_active: form.is_active,
    };

    let error;
    if (editingPrinter) {
      const result = await supabase
        .from('global_printers')
        .update(printerData)
        .eq('id', editingPrinter.id);
      error = result.error;
    } else {
      const result = await supabase.from('global_printers').insert([printerData]);
      error = result.error;
    }

    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: editingPrinter ? 'Printer updated!' : 'Printer added!' });
      setDialogOpen(false);
      resetForm();
      fetchPrinters();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this printer?')) return;

    const { error } = await supabase.from('global_printers').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Printer deleted!' });
      fetchPrinters();
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('admin.printers')}</h1>
            <p className="text-muted-foreground">Manage global printer presets available to all users</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.addPrinter')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPrinter ? t('admin.editPrinter') : t('admin.addPrinter')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('printers.brand')}</Label>
                    <Input
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      placeholder="e.g. Bambu Lab"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('printers.model')}</Label>
                    <Input
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      placeholder="e.g. P1S"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('printers.purchaseCost')} (€)</Label>
                    <Input
                      type="number"
                      value={form.purchase_cost}
                      onChange={(e) => setForm({ ...form, purchase_cost: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('printers.maintenanceCost')} (€)</Label>
                    <Input
                      type="number"
                      value={form.maintenance_cost}
                      onChange={(e) => setForm({ ...form, maintenance_cost: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('printers.depreciationHours')}</Label>
                    <Input
                      type="number"
                      value={form.depreciation_hours}
                      onChange={(e) => setForm({ ...form, depreciation_hours: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('printers.powerWatts')}</Label>
                    <Input
                      type="number"
                      value={form.power_watts}
                      onChange={(e) => setForm({ ...form, power_watts: e.target.value })}
                      placeholder="200"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <Label>{t('common.active')}</Label>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {t('common.save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : printers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common.noData')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('printers.brand')}</TableHead>
                    <TableHead>{t('printers.model')}</TableHead>
                    <TableHead className="text-right">{t('printers.purchaseCost')}</TableHead>
                    <TableHead className="text-right">{t('printers.powerWatts')}</TableHead>
                    <TableHead className="text-right">{t('printers.depreciationHours')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printers.map((printer) => (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">{printer.brand}</TableCell>
                      <TableCell>{printer.model}</TableCell>
                      <TableCell className="text-right">€{printer.purchase_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{printer.power_watts}W</TableCell>
                      <TableCell className="text-right">{printer.depreciation_hours}h</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${printer.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                          {printer.is_active ? t('common.active') : t('common.inactive')}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(printer)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(printer.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
