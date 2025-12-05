import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { Plus, Zap, DollarSign, Edit, Trash2, Loader2, Crown, ExternalLink } from 'lucide-react';
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

export default function Settings() {
  const { user, subscription, refreshSubscription } = useAuth();
  const [electricitySettings, setElectricitySettings] = useState<ElectricitySetting[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [electricityDialogOpen, setElectricityDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingElectricity, setEditingElectricity] = useState<ElectricitySetting | null>(null);
  const [editingExpense, setEditingExpense] = useState<FixedExpense | null>(null);
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

  const tierInfo = SUBSCRIPTION_TIERS[subscription.tier];

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;

    const [electricityRes, expensesRes] = await Promise.all([
      supabase.from('electricity_settings').select('*').order('created_at', { ascending: false }),
      supabase.from('fixed_expenses').select('*').order('created_at', { ascending: false }),
    ]);

    if (electricityRes.data) setElectricitySettings(electricityRes.data);
    if (expensesRes.data) setFixedExpenses(expensesRes.data);
    setLoading(false);
  }

  // Electricity Settings functions
  function resetElectricityForm() {
    setElectricityForm({
      name: '',
      contracted_power_kva: '3.45',
      price_per_kwh: '0.15',
      daily_fixed_cost: '',
      notes: '',
    });
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
      toast({ title: editingElectricity ? 'Electricity settings updated' : 'Electricity settings added' });
      setElectricityDialogOpen(false);
      resetElectricityForm();
      fetchData();
    }
  }

  async function handleDeleteElectricity(id: string) {
    if (!confirm('Are you sure you want to delete this electricity profile?')) return;

    const { error } = await supabase.from('electricity_settings').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Electricity profile deleted' });
      fetchData();
    }
  }

  // Fixed Expenses functions
  function resetExpenseForm() {
    setExpenseForm({
      name: '',
      monthly_amount: '',
      is_active: true,
    });
    setEditingExpense(null);
  }

  function openEditExpenseDialog(item: FixedExpense) {
    setEditingExpense(item);
    setExpenseForm({
      name: item.name,
      monthly_amount: item.monthly_amount.toString(),
      is_active: item.is_active,
    });
    setExpenseDialogOpen(true);
  }

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    const data = {
      user_id: user.id,
      name: expenseForm.name.trim(),
      monthly_amount: parseFloat(expenseForm.monthly_amount) || 0,
      is_active: expenseForm.is_active,
    };

    let error;
    if (editingExpense) {
      const res = await supabase.from('fixed_expenses').update(data).eq('id', editingExpense.id);
      error = res.error;
    } else {
      const res = await supabase.from('fixed_expenses').insert([data]);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: editingExpense ? 'Expense updated' : 'Expense added' });
      setExpenseDialogOpen(false);
      resetExpenseForm();
      fetchData();
    }
  }

  async function handleDeleteExpense(id: string) {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    const { error } = await supabase.from('fixed_expenses').delete().eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Expense deleted' });
      fetchData();
    }
  }

  async function handleToggleExpense(id: string, isActive: boolean) {
    const { error } = await supabase.from('fixed_expenses').update({ is_active: isActive }).eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      fetchData();
    }
  }

  async function handleManageSubscription() {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not open subscription management' });
    }
    setManagingPortal(false);
  }

  const totalMonthlyExpenses = fixedExpenses
    .filter(e => e.is_active)
    .reduce((sum, e) => sum + e.monthly_amount, 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your electricity profiles, expenses, and subscription</p>
        </div>

        <Tabs defaultValue="electricity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="electricity">Electricity</TabsTrigger>
            <TabsTrigger value="expenses">Fixed Expenses</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
          </TabsList>

          {/* Electricity Settings Tab */}
          <TabsContent value="electricity" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Electricity Profiles</h2>
                <p className="text-sm text-muted-foreground">Configure your electricity costs for accurate calculations</p>
              </div>
              <Dialog open={electricityDialogOpen} onOpenChange={(open) => { setElectricityDialogOpen(open); if (!open) resetElectricityForm(); }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4" />
                    Add Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingElectricity ? 'Edit Electricity Profile' : 'Add Electricity Profile'}</DialogTitle>
                    <DialogDescription>Configure your electricity rates for cost calculations</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleElectricitySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="elec_name">Profile Name *</Label>
                      <Input
                        id="elec_name"
                        value={electricityForm.name}
                        onChange={(e) => setElectricityForm({ ...electricityForm, name: e.target.value })}
                        placeholder="e.g. Home 3.45kVA"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="power_kva">Contracted Power (kVA)</Label>
                        <Input
                          id="power_kva"
                          type="number"
                          step="0.01"
                          value={electricityForm.contracted_power_kva}
                          onChange={(e) => setElectricityForm({ ...electricityForm, contracted_power_kva: e.target.value })}
                          placeholder="3.45"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price_kwh">Price per kWh (€)</Label>
                        <Input
                          id="price_kwh"
                          type="number"
                          step="0.0001"
                          value={electricityForm.price_per_kwh}
                          onChange={(e) => setElectricityForm({ ...electricityForm, price_per_kwh: e.target.value })}
                          placeholder="0.15"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="daily_fixed">Daily Fixed Cost (€)</Label>
                      <Input
                        id="daily_fixed"
                        type="number"
                        step="0.01"
                        value={electricityForm.daily_fixed_cost}
                        onChange={(e) => setElectricityForm({ ...electricityForm, daily_fixed_cost: e.target.value })}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground">Standing charges if applicable</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="elec_notes">Notes</Label>
                      <Textarea
                        id="elec_notes"
                        value={electricityForm.notes}
                        onChange={(e) => setElectricityForm({ ...electricityForm, notes: e.target.value })}
                        placeholder="Any additional notes..."
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingElectricity ? 'Update Profile' : 'Add Profile'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : electricitySettings.length === 0 ? (
              <Card className="shadow-card border-border/50">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No electricity profiles yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first profile to start tracking energy costs</p>
                  <Button onClick={() => setElectricityDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Add Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {electricitySettings.map((item) => (
                  <Card key={item.id} className="shadow-card border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{item.name}</CardTitle>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditElectricityDialog(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteElectricity(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Power</span>
                        <span className="font-medium">{item.contracted_power_kva} kVA</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price per kWh</span>
                        <span className="font-medium">€{item.price_per_kwh.toFixed(4)}</span>
                      </div>
                      {item.daily_fixed_cost && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Daily fixed</span>
                          <span className="font-medium">€{item.daily_fixed_cost.toFixed(2)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Fixed Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Fixed Expenses</h2>
                <p className="text-sm text-muted-foreground">Monthly business costs shared across prints</p>
              </div>
              <Dialog open={expenseDialogOpen} onOpenChange={(open) => { setExpenseDialogOpen(open); if (!open) resetExpenseForm(); }}>
                <DialogTrigger asChild>
                  <Button variant="secondary">
                    <Plus className="w-4 h-4" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Fixed Expense'}</DialogTitle>
                    <DialogDescription>Add a recurring monthly expense to allocate across prints</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="expense_name">Expense Name *</Label>
                      <Input
                        id="expense_name"
                        value={expenseForm.name}
                        onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                        placeholder="e.g. Rent, Internet, Insurance"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_amount">Monthly Amount (€) *</Label>
                      <Input
                        id="monthly_amount"
                        type="number"
                        step="0.01"
                        value={expenseForm.monthly_amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, monthly_amount: e.target.value })}
                        placeholder="50.00"
                        required
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_active">Include in calculations</Label>
                      <Switch
                        id="is_active"
                        checked={expenseForm.is_active}
                        onCheckedChange={(checked) => setExpenseForm({ ...expenseForm, is_active: checked })}
                      />
                    </div>
                    <Button type="submit" variant="secondary" className="w-full" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingExpense ? 'Update Expense' : 'Add Expense'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Total Summary */}
            <Card className="shadow-card border-border/50 bg-secondary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold">Total Monthly Expenses</p>
                      <p className="text-sm text-muted-foreground">Active expenses only</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">€{totalMonthlyExpenses.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>

            {fixedExpenses.length === 0 ? (
              <Card className="shadow-card border-border/50">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <DollarSign className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">No fixed expenses yet</h3>
                  <p className="text-muted-foreground mb-4">Add expenses like rent or internet to include in cost calculations</p>
                  <Button variant="secondary" onClick={() => setExpenseDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Add Expense
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {fixedExpenses.map((expense) => (
                  <Card key={expense.id} className={`shadow-card border-border/50 ${!expense.is_active ? 'opacity-60' : ''}`}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={expense.is_active}
                            onCheckedChange={(checked) => handleToggleExpense(expense.id, checked)}
                          />
                          <span className="font-medium">{expense.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">€{expense.monthly_amount.toFixed(2)}/mo</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditExpenseDialog(expense)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Your Subscription</h2>
              <p className="text-sm text-muted-foreground">Manage your plan and billing</p>
            </div>

            <Card className="shadow-card border-border/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {subscription.tier !== 'free' && <Crown className="w-6 h-6 text-accent" />}
                  <div>
                    <CardTitle>{tierInfo.name} Plan</CardTitle>
                    <CardDescription>
                      {tierInfo.price === 0 ? 'Free' : `€${tierInfo.price}/month`}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max saved prints</span>
                    <span className="font-medium">{tierInfo.maxPrints}</span>
                  </div>
                  {subscription.subscriptionEnd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renews on</span>
                      <span className="font-medium">
                        {new Date(subscription.subscriptionEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  {subscription.tier === 'free' ? (
                    <Button variant="accent" asChild className="flex-1">
                      <Link to="/pricing">Upgrade Plan</Link>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleManageSubscription}
                      disabled={managingPortal}
                      className="flex-1"
                    >
                      {managingPortal ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      Manage Subscription
                    </Button>
                  )}
                  <Button variant="ghost" onClick={refreshSubscription}>
                    Refresh Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
