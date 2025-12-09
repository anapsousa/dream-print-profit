import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import { Plus, Zap, DollarSign, Edit, Trash2, Loader2, Crown, ExternalLink, Package, Truck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ElectricitySetting {
  id: string;
  name: string;
  contracted_power_kva: number;
  price_per_kwh: number;
  daily_fixed_cost: number | null;
  notes: string | null;
}

interface FixedExpense {
  id: string;
  name: string;
  monthly_amount: number;
  is_active: boolean;
}

interface Consumable {
  id: string;
  name: string;
  cost: number;
  is_active: boolean;
}

interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
}

interface LaborSetting {
  id: string;
  preparation_rate_per_hour: number;
  post_processing_rate_per_hour: number;
}

export default function Settings() {
  const { user, subscription, refreshSubscription } = useAuth();
  const { t } = useLanguage();
  const [electricitySettings, setElectricitySettings] = useState<ElectricitySetting[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [laborSettings, setLaborSettings] = useState<LaborSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [electricityDialogOpen, setElectricityDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [consumableDialogOpen, setConsumableDialogOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [editingElectricity, setEditingElectricity] = useState<ElectricitySetting | null>(null);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
  const [editingConsumable, setEditingConsumable] = useState<Consumable | null>(null);
  const [editingShipping, setEditingShipping] = useState<ShippingOption | null>(null);
  const [saving, setSaving] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);
  const { toast } = useToast();

  const [electricityForm, setElectricityForm] = useState({
    name: '',
    contracted_power_kva: '3.45',
    price_per_kwh: '0.15',
    daily_fixed_cost: '',
    notes: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    name: '',
    monthly_amount: '',
    is_active: true,
  });

  const [consumableForm, setConsumableForm] = useState({
    name: '',
    cost: '',
    is_active: true,
  });

  const [shippingForm, setShippingForm] = useState({
    name: '',
    description: '',
    price: '',
    is_active: true,
  });

  const [laborForm, setLaborForm] = useState({
    preparation_rate_per_hour: '15',
    post_processing_rate_per_hour: '12',
  });

  const tierInfo = SUBSCRIPTION_TIERS[subscription.tier];

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;

    const [electricityRes, expensesRes, consumablesRes, shippingRes, laborRes] = await Promise.all([
      supabase.from('electricity_settings').select('*').order('created_at', { ascending: false }),
      supabase.from('fixed_expenses').select('*').order('created_at', { ascending: false }),
      supabase.from('consumables').select('*').order('created_at', { ascending: false }),
      supabase.from('shipping_options').select('*').order('created_at', { ascending: false }),
      supabase.from('labor_settings').select('*').limit(1).single(),
    ]);

    if (electricityRes.data) setElectricitySettings(electricityRes.data);
    if (expensesRes.data) setFixedExpenses(expensesRes.data);
    if (consumablesRes.data) setConsumables(consumablesRes.data);
    if (shippingRes.data) setShippingOptions(shippingRes.data);
    if (laborRes.data) {
      setLaborSettings(laborRes.data);
      setLaborForm({
        preparation_rate_per_hour: laborRes.data.preparation_rate_per_hour.toString(),
        post_processing_rate_per_hour: laborRes.data.post_processing_rate_per_hour.toString(),
      });
    }
    setLoading(false);
  }

  // Electricity Settings functions
  function resetElectricityForm() {
    setElectricityForm({ name: '', contracted_power_kva: '3.45', price_per_kwh: '0.15', daily_fixed_cost: '', notes: '' });
    setEditingElectricity(null);
  }

  function openEditElectricityDialog(item: ElectricitySetting) {
    setEditingElectricity(item);
    setElectricityForm({
      name: item.name,
      contracted_power_kva: item.contracted_power_kva.toString(),
      price_per_kwh: item.price_per_kwh.toString(),
      daily_fixed_cost: item.daily_fixed_cost?.toString() || '',
      notes: item.notes || '',
    });
    setElectricityDialogOpen(true);
  }

  async function handleElectricitySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const data = {
      user_id: user.id,
      name: electricityForm.name.trim(),
      contracted_power_kva: parseFloat(electricityForm.contracted_power_kva) || 3.45,
      price_per_kwh: parseFloat(electricityForm.price_per_kwh) || 0.15,
      daily_fixed_cost: parseFloat(electricityForm.daily_fixed_cost) || null,
      notes: electricityForm.notes.trim() || null,
    };
    let error;
    if (editingElectricity) {
      const res = await supabase.from('electricity_settings').update(data).eq('id', editingElectricity.id);
      error = res.error;
    } else {
      const res = await supabase.from('electricity_settings').insert([data]);
      error = res.error;
    }
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: editingElectricity ? 'Updated' : 'Added' });
      setElectricityDialogOpen(false);
      resetElectricityForm();
      fetchData();
    }
  }

  async function handleDeleteElectricity(id: string) {
    if (!confirm('Delete this electricity profile?')) return;
    const { error } = await supabase.from('electricity_settings').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else { toast({ title: 'Deleted' }); fetchData(); }
  }

  // Fixed Expenses functions
  function resetExpenseForm() {
    setExpenseForm({ name: '', monthly_amount: '', is_active: true });
    setEditingExpense(null);
  }

  function openEditExpenseDialog(item: FixedExpense) {
    setEditingExpense(item);
    setExpenseForm({ name: item.name, monthly_amount: item.monthly_amount.toString(), is_active: item.is_active });
    setExpenseDialogOpen(true);
  }

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const data = { user_id: user.id, name: expenseForm.name.trim(), monthly_amount: parseFloat(expenseForm.monthly_amount) || 0, is_active: expenseForm.is_active };
    let error;
    if (editingExpense) {
      const res = await supabase.from('fixed_expenses').update(data).eq('id', editingExpense.id);
      error = res.error;
    } else {
      const res = await supabase.from('fixed_expenses').insert([data]);
      error = res.error;
    }
    setSaving(false);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else { toast({ title: editingExpense ? 'Updated' : 'Added' }); setExpenseDialogOpen(false); resetExpenseForm(); fetchData(); }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Delete this expense?')) return;
    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else { toast({ title: 'Deleted' }); fetchData(); }
  }

  async function handleToggleExpense(id: string, isActive: boolean) {
    const { error } = await supabase.from('fixed_expenses').update({ is_active: isActive }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else fetchData();
  }

  // Consumables functions
  function resetConsumableForm() {
    setConsumableForm({ name: '', cost: '', is_active: true });
    setEditingConsumable(null);
  }

  function openEditConsumableDialog(item: Consumable) {
    setEditingConsumable(item);
    setConsumableForm({ name: item.name, cost: item.cost.toString(), is_active: item.is_active });
    setConsumableDialogOpen(true);
  }

  async function handleConsumableSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const data = { user_id: user.id, name: consumableForm.name.trim(), cost: parseFloat(consumableForm.cost) || 0, is_active: consumableForm.is_active };
    let error;
    if (editingConsumable) {
      const res = await supabase.from('consumables').update(data).eq('id', editingConsumable.id);
      error = res.error;
    } else {
      const res = await supabase.from('consumables').insert([data]);
      error = res.error;
    }
    setSaving(false);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else { toast({ title: editingConsumable ? 'Updated' : 'Added' }); setConsumableDialogOpen(false); resetConsumableForm(); fetchData(); }
  }

  async function handleDeleteConsumable(id: string) {
    if (!confirm('Delete this consumable?')) return;
    const { error } = await supabase.from('consumables').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else { toast({ title: 'Deleted' }); fetchData(); }
  }

  async function handleToggleConsumable(id: string, isActive: boolean) {
    const { error } = await supabase.from('consumables').update({ is_active: isActive }).eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else fetchData();
  }

  // Shipping functions
  function resetShippingForm() {
    setShippingForm({ name: '', description: '', price: '', is_active: true });
    setEditingShipping(null);
  }

  function openEditShippingDialog(item: ShippingOption) {
    setEditingShipping(item);
    setShippingForm({ name: item.name, description: item.description || '', price: item.price.toString(), is_active: item.is_active });
    setShippingDialogOpen(true);
  }

  async function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const data = { user_id: user.id, name: shippingForm.name.trim(), description: shippingForm.description.trim() || null, price: parseFloat(shippingForm.price) || 0, is_active: shippingForm.is_active };
    let error;
    if (editingShipping) {
      const res = await supabase.from('shipping_options').update(data).eq('id', editingShipping.id);
      error = res.error;
    } else {
      const res = await supabase.from('shipping_options').insert([data]);
      error = res.error;
    }
    setSaving(false);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else { toast({ title: editingShipping ? 'Updated' : 'Added' }); setShippingDialogOpen(false); resetShippingForm(); fetchData(); }
  }

  async function handleDeleteShipping(id: string) {
    if (!confirm('Delete this shipping option?')) return;
    const { error } = await supabase.from('shipping_options').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else { toast({ title: 'Deleted' }); fetchData(); }
  }

  // Labor settings
  async function handleLaborSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const data = {
      user_id: user.id,
      preparation_rate_per_hour: parseFloat(laborForm.preparation_rate_per_hour) || 15,
      post_processing_rate_per_hour: parseFloat(laborForm.post_processing_rate_per_hour) || 12,
    };
    let error;
    if (laborSettings) {
      const res = await supabase.from('labor_settings').update(data).eq('id', laborSettings.id);
      error = res.error;
    } else {
      const res = await supabase.from('labor_settings').insert([data]);
      error = res.error;
    }
    setSaving(false);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else { toast({ title: 'Labor settings saved' }); fetchData(); }
  }

  async function handleManageSubscription() {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not open subscription management' });
    }
    setManagingPortal(false);
  }

  const totalMonthlyExpenses = fixedExpenses.filter(e => e.is_active).reduce((sum, e) => sum + e.monthly_amount, 0);
  const totalConsumablesCost = consumables.filter(c => c.is_active).reduce((sum, c) => sum + c.cost, 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </div>

        <Tabs defaultValue="electricity" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="electricity">{t('settings.electricity')}</TabsTrigger>
            <TabsTrigger value="expenses">{t('settings.expenses')}</TabsTrigger>
            <TabsTrigger value="consumables">{t('settings.consumables')}</TabsTrigger>
            <TabsTrigger value="shipping">{t('settings.shipping')}</TabsTrigger>
            <TabsTrigger value="labor">{t('settings.labor')}</TabsTrigger>
            <TabsTrigger value="subscription">{t('settings.subscription')}</TabsTrigger>
          </TabsList>

          {/* Electricity Tab */}
          <TabsContent value="electricity" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Electricity Profiles</h2>
                <p className="text-sm text-muted-foreground">Configure electricity costs</p>
              </div>
              <Dialog open={electricityDialogOpen} onOpenChange={(open) => { setElectricityDialogOpen(open); if (!open) resetElectricityForm(); }}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4" />Add Profile</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingElectricity ? 'Edit' : 'Add'} Electricity Profile</DialogTitle>
                    <DialogDescription>Configure electricity rates</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleElectricitySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Profile Name *</Label>
                      <Input value={electricityForm.name} onChange={(e) => setElectricityForm({ ...electricityForm, name: e.target.value })} placeholder="e.g. Home 3.45kVA" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Contracted Power (kVA)</Label>
                        <Input type="number" step="0.01" value={electricityForm.contracted_power_kva} onChange={(e) => setElectricityForm({ ...electricityForm, contracted_power_kva: e.target.value })} placeholder="3.45" />
                      </div>
                      <div className="space-y-2">
                        <Label>Price per kWh (€)</Label>
                        <Input type="number" step="0.0001" value={electricityForm.price_per_kwh} onChange={(e) => setElectricityForm({ ...electricityForm, price_per_kwh: e.target.value })} placeholder="0.15" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Daily Fixed Cost (€)</Label>
                      <Input type="number" step="0.01" value={electricityForm.daily_fixed_cost} onChange={(e) => setElectricityForm({ ...electricityForm, daily_fixed_cost: e.target.value })} placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea value={electricityForm.notes} onChange={(e) => setElectricityForm({ ...electricityForm, notes: e.target.value })} placeholder="Notes..." />
                    </div>
                    <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingElectricity ? 'Update' : 'Add'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : electricitySettings.length === 0 ? (
              <Card className="shadow-card border-border/50"><CardContent className="py-12 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4"><Zap className="w-8 h-8 text-muted-foreground" /></div>
                <h3 className="font-semibold text-lg mb-2">No electricity profiles</h3>
                <Button onClick={() => setElectricityDialogOpen(true)}><Plus className="w-4 h-4" />Add Profile</Button>
              </CardContent></Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {electricitySettings.map((item) => (
                  <Card key={item.id} className="shadow-card border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Zap className="w-5 h-5 text-primary" /></div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditElectricityDialog(item)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteElectricity(item.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Power</span><span className="font-medium">{item.contracted_power_kva} kVA</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Price/kWh</span><span className="font-medium">€{item.price_per_kwh.toFixed(4)}</span></div>
                      {item.daily_fixed_cost && <div className="flex justify-between"><span className="text-muted-foreground">Daily fixed</span><span className="font-medium">€{item.daily_fixed_cost.toFixed(2)}</span></div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Fixed Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-semibold">Fixed Expenses</h2><p className="text-sm text-muted-foreground">Monthly business costs</p></div>
              <Dialog open={expenseDialogOpen} onOpenChange={(open) => { setExpenseDialogOpen(open); if (!open) resetExpenseForm(); }}>
                <DialogTrigger asChild><Button variant="secondary"><Plus className="w-4 h-4" />Add Expense</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editingExpense ? 'Edit' : 'Add'} Expense</DialogTitle></DialogHeader>
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div className="space-y-2"><Label>Name *</Label><Input value={expenseForm.name} onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })} placeholder="e.g. Rent, Internet" required /></div>
                    <div className="space-y-2"><Label>Monthly Amount (€) *</Label><Input type="number" step="0.01" value={expenseForm.monthly_amount} onChange={(e) => setExpenseForm({ ...expenseForm, monthly_amount: e.target.value })} required /></div>
                    <div className="flex items-center justify-between"><Label>Include in calculations</Label><Switch checked={expenseForm.is_active} onCheckedChange={(checked) => setExpenseForm({ ...expenseForm, is_active: checked })} /></div>
                    <Button type="submit" variant="secondary" className="w-full" disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingExpense ? 'Update' : 'Add'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="shadow-card border-border/50 bg-secondary/5"><CardContent className="py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-secondary" /></div><div><p className="font-semibold">Total Monthly</p><p className="text-sm text-muted-foreground">Active only</p></div></div><p className="text-2xl font-bold">€{totalMonthlyExpenses.toFixed(2)}</p></div></CardContent></Card>
            {fixedExpenses.length === 0 ? <Card className="shadow-card border-border/50"><CardContent className="py-12 text-center"><div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4"><DollarSign className="w-8 h-8 text-muted-foreground" /></div><h3 className="font-semibold mb-2">No fixed expenses</h3><Button variant="secondary" onClick={() => setExpenseDialogOpen(true)}><Plus className="w-4 h-4" />Add</Button></CardContent></Card> : (
              <div className="space-y-3">{fixedExpenses.map((e) => (<Card key={e.id} className={`shadow-card border-border/50 ${!e.is_active ? 'opacity-60' : ''}`}><CardContent className="py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><Switch checked={e.is_active} onCheckedChange={(c) => handleToggleExpense(e.id, c)} /><span className="font-medium">{e.name}</span></div><div className="flex items-center gap-4"><span className="font-semibold">€{e.monthly_amount.toFixed(2)}/mo</span><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEditExpenseDialog(e)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(e.id)}><Trash2 className="w-4 h-4" /></Button></div></div></div></CardContent></Card>))}</div>
            )}
          </TabsContent>

          {/* Consumables Tab */}
          <TabsContent value="consumables" className="space-y-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-semibold">Consumables</h2><p className="text-sm text-muted-foreground">Packaging & misc items per print</p></div>
              <Dialog open={consumableDialogOpen} onOpenChange={(open) => { setConsumableDialogOpen(open); if (!open) resetConsumableForm(); }}>
                <DialogTrigger asChild><Button variant="secondary"><Plus className="w-4 h-4" />Add Consumable</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editingConsumable ? 'Edit' : 'Add'} Consumable</DialogTitle><DialogDescription>Items like boxes, labels, stickers</DialogDescription></DialogHeader>
                  <form onSubmit={handleConsumableSubmit} className="space-y-4">
                    <div className="space-y-2"><Label>Name *</Label><Input value={consumableForm.name} onChange={(e) => setConsumableForm({ ...consumableForm, name: e.target.value })} placeholder="e.g. Box, Label, Sticker" required /></div>
                    <div className="space-y-2"><Label>Cost per unit (€) *</Label><Input type="number" step="0.01" value={consumableForm.cost} onChange={(e) => setConsumableForm({ ...consumableForm, cost: e.target.value })} required /></div>
                    <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={consumableForm.is_active} onCheckedChange={(c) => setConsumableForm({ ...consumableForm, is_active: c })} /></div>
                    <Button type="submit" variant="secondary" className="w-full" disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingConsumable ? 'Update' : 'Add'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="shadow-card border-border/50 bg-accent/5"><CardContent className="py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Package className="w-5 h-5 text-accent" /></div><div><p className="font-semibold">Total per print</p><p className="text-sm text-muted-foreground">Active only</p></div></div><p className="text-2xl font-bold">€{totalConsumablesCost.toFixed(2)}</p></div></CardContent></Card>
            <p className="text-sm text-muted-foreground">Common: Box (€0.45), Filling (€0.10), Label (€0.01), Sticker (€0.05), Rubber bands (€0.11)</p>
            {consumables.length === 0 ? <Card className="shadow-card border-border/50"><CardContent className="py-12 text-center"><div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4"><Package className="w-8 h-8 text-muted-foreground" /></div><h3 className="font-semibold mb-2">No consumables</h3><Button variant="secondary" onClick={() => setConsumableDialogOpen(true)}><Plus className="w-4 h-4" />Add</Button></CardContent></Card> : (
              <div className="space-y-3">{consumables.map((c) => (<Card key={c.id} className={`shadow-card border-border/50 ${!c.is_active ? 'opacity-60' : ''}`}><CardContent className="py-4"><div className="flex items-center justify-between"><div className="flex items-center gap-4"><Switch checked={c.is_active} onCheckedChange={(v) => handleToggleConsumable(c.id, v)} /><span className="font-medium">{c.name}</span></div><div className="flex items-center gap-4"><span className="font-semibold">€{c.cost.toFixed(2)}</span><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEditConsumableDialog(c)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteConsumable(c.id)}><Trash2 className="w-4 h-4" /></Button></div></div></div></CardContent></Card>))}</div>
            )}
          </TabsContent>

          {/* Shipping Tab */}
          <TabsContent value="shipping" className="space-y-4">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-semibold">Shipping Options</h2><p className="text-sm text-muted-foreground">Delivery methods and costs</p></div>
              <Dialog open={shippingDialogOpen} onOpenChange={(open) => { setShippingDialogOpen(open); if (!open) resetShippingForm(); }}>
                <DialogTrigger asChild><Button variant="secondary"><Plus className="w-4 h-4" />Add Shipping</Button></DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{editingShipping ? 'Edit' : 'Add'} Shipping Option</DialogTitle></DialogHeader>
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="space-y-2"><Label>Name *</Label><Input value={shippingForm.name} onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })} placeholder="e.g. 24h Delivery" required /></div>
                    <div className="space-y-2"><Label>Description</Label><Input value={shippingForm.description} onChange={(e) => setShippingForm({ ...shippingForm, description: e.target.value })} placeholder="e.g. Delivery within 24 hours" /></div>
                    <div className="space-y-2"><Label>Price (€) *</Label><Input type="number" step="0.01" value={shippingForm.price} onChange={(e) => setShippingForm({ ...shippingForm, price: e.target.value })} required /></div>
                    <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={shippingForm.is_active} onCheckedChange={(c) => setShippingForm({ ...shippingForm, is_active: c })} /></div>
                    <Button type="submit" variant="secondary" className="w-full" disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingShipping ? 'Update' : 'Add'}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-muted-foreground">Suggestions: 24h (€5.28), 48h (€4.46), No shipping (€0)</p>
            {shippingOptions.length === 0 ? <Card className="shadow-card border-border/50"><CardContent className="py-12 text-center"><div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4"><Truck className="w-8 h-8 text-muted-foreground" /></div><h3 className="font-semibold mb-2">No shipping options</h3><Button variant="secondary" onClick={() => setShippingDialogOpen(true)}><Plus className="w-4 h-4" />Add</Button></CardContent></Card> : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{shippingOptions.map((s) => (<Card key={s.id} className={`shadow-card border-border/50 ${!s.is_active ? 'opacity-60' : ''}`}><CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Truck className="w-5 h-5 text-primary" /></div><div><CardTitle className="text-lg">{s.name}</CardTitle>{s.description && <CardDescription>{s.description}</CardDescription>}</div></div><div className="flex gap-1"><Button variant="ghost" size="icon" onClick={() => openEditShippingDialog(s)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteShipping(s.id)}><Trash2 className="w-4 h-4" /></Button></div></div></CardHeader><CardContent><p className="text-2xl font-bold">€{s.price.toFixed(2)}</p></CardContent></Card>))}</div>
            )}
          </TabsContent>

          {/* Labor Rates Tab */}
          <TabsContent value="labor" className="space-y-4">
            <div><h2 className="text-xl font-semibold">Labor Rates</h2><p className="text-sm text-muted-foreground">Hourly rates for prep and post-processing</p></div>
            <Card className="shadow-card border-border/50">
              <CardContent className="pt-6">
                <form onSubmit={handleLaborSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Clock className="w-4 h-4" />Preparation Rate (€/hour)</Label>
                      <Input type="number" step="0.01" value={laborForm.preparation_rate_per_hour} onChange={(e) => setLaborForm({ ...laborForm, preparation_rate_per_hour: e.target.value })} placeholder="15" />
                      <p className="text-xs text-muted-foreground">Model prep, slicing, print start</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Clock className="w-4 h-4" />Post-Processing Rate (€/hour)</Label>
                      <Input type="number" step="0.01" value={laborForm.post_processing_rate_per_hour} onChange={(e) => setLaborForm({ ...laborForm, post_processing_rate_per_hour: e.target.value })} placeholder="12" />
                      <p className="text-xs text-muted-foreground">Remove from plate, clean supports, extra work</p>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}Save Labor Rates</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4">
            <div><h2 className="text-xl font-semibold">Your Subscription</h2><p className="text-sm text-muted-foreground">Manage your plan</p></div>
            <Card className="shadow-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {subscription.tier !== 'free' && <Crown className="w-6 h-6 text-accent" />}
                  <div><CardTitle>{tierInfo.name} Plan</CardTitle><CardDescription>{tierInfo.price === 0 ? 'Free' : `€${tierInfo.price}/month`}</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Max saved prints</span><span className="font-medium">{tierInfo.maxPrints}</span></div>
                  {subscription.subscriptionEnd && <div className="flex justify-between"><span className="text-muted-foreground">Renews on</span><span className="font-medium">{new Date(subscription.subscriptionEnd).toLocaleDateString()}</span></div>}
                </div>
                <div className="flex gap-3">
                  {subscription.tier === 'free' ? <Button variant="accent" asChild className="flex-1"><Link to="/pricing">Upgrade Plan</Link></Button> : <Button variant="outline" onClick={handleManageSubscription} disabled={managingPortal} className="flex-1">{managingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}Manage Subscription</Button>}
                  <Button variant="ghost" onClick={refreshSubscription}>Refresh</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
