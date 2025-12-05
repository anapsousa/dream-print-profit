import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import { Plus, FileText, Loader2, Clock, Package, Truck, Wrench, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PrintListItem } from '@/components/prints/PrintListItem';
import { PrintDetailPanel } from '@/components/prints/PrintDetailPanel';
import { exportPrintToCSV, exportPrintToPDF } from '@/lib/exportUtils';

interface PrintType {
  id: string;
  name: string;
  printer_id: string;
  filament_id: string;
  electricity_settings_id: string | null;
  filament_used_grams: number;
  print_time_hours: number;
  extra_manual_costs: number | null;
  profit_margin_percent: number | null;
  discount_percent: number | null;
  preparation_time_minutes: number | null;
  slicing_time_minutes: number | null;
  print_start_time_minutes: number | null;
  remove_from_plate_minutes: number | null;
  clean_supports_minutes: number | null;
  additional_work_minutes: number | null;
  shipping_option_id: string | null;
  consumables_cost: number | null;
}

interface PrinterType {
  id: string;
  name: string;
  purchase_cost: number;
  depreciation_months: number;
  depreciation_hours: number;
  maintenance_cost: number;
  power_watts: number;
  default_electricity_settings_id: string | null;
}

interface FilamentType {
  id: string;
  name: string;
  cost_per_gram: number;
}

interface ElectricitySettingType {
  id: string;
  name: string;
  price_per_kwh: number;
  daily_fixed_cost: number | null;
}

interface FixedExpenseType {
  id: string;
  monthly_amount: number;
  is_active: boolean;
}

interface ConsumableType {
  id: string;
  name: string;
  cost: number;
  is_active: boolean;
}

interface ShippingOptionType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
}

interface LaborSettingType {
  preparation_rate_per_hour: number;
  post_processing_rate_per_hour: number;
}

const DISCOUNT_PERCENTAGES = [0, 5, 10, 20, 30, 50];

export default function Prints() {
  const { user, subscription } = useAuth();
  const [prints, setPrints] = useState<PrintType[]>([]);
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [filaments, setFilaments] = useState<FilamentType[]>([]);
  const [electricitySettings, setElectricitySettings] = useState<ElectricitySettingType[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseType[]>([]);
  const [consumables, setConsumables] = useState<ConsumableType[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionType[]>([]);
  const [laborSettings, setLaborSettings] = useState<LaborSettingType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrint, setEditingPrint] = useState<PrintType | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPrintId, setSelectedPrintId] = useState<string | null>(null);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    printer_id: '',
    filament_id: '',
    electricity_settings_id: '',
    filament_used_grams: '',
    print_time_hours: '',
    extra_manual_costs: '',
    profit_margin_percent: '100',
    discount_percent: '0',
    preparation_time_minutes: '0',
    slicing_time_minutes: '0',
    print_start_time_minutes: '0',
    remove_from_plate_minutes: '0',
    clean_supports_minutes: '0',
    additional_work_minutes: '0',
    shipping_option_id: '',
    consumables_cost: '',
  });

  const [selectedConsumables, setSelectedConsumables] = useState<string[]>([]);

  const tierInfo = SUBSCRIPTION_TIERS[subscription.tier];
  const canAddPrint = prints.length < tierInfo.maxPrints;

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;

    const [printsRes, printersRes, filamentsRes, electricityRes, expensesRes, consumablesRes, shippingRes, laborRes] = await Promise.all([
      supabase.from('prints').select('*').order('created_at', { ascending: false }),
      supabase.from('printers').select('id, name, purchase_cost, depreciation_months, depreciation_hours, maintenance_cost, power_watts, default_electricity_settings_id'),
      supabase.from('filaments').select('id, name, cost_per_gram'),
      supabase.from('electricity_settings').select('id, name, price_per_kwh, daily_fixed_cost'),
      supabase.from('fixed_expenses').select('id, monthly_amount, is_active'),
      supabase.from('consumables').select('*'),
      supabase.from('shipping_options').select('*'),
      supabase.from('labor_settings').select('*').limit(1).single(),
    ]);

    if (printsRes.data) setPrints(printsRes.data as PrintType[]);
    if (printersRes.data) setPrinters(printersRes.data as PrinterType[]);
    if (filamentsRes.data) setFilaments(filamentsRes.data);
    if (electricityRes.data) setElectricitySettings(electricityRes.data);
    if (expensesRes.data) setFixedExpenses(expensesRes.data);
    if (consumablesRes.data) setConsumables(consumablesRes.data);
    if (shippingRes.data) setShippingOptions(shippingRes.data);
    if (laborRes.data) setLaborSettings(laborRes.data);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      name: '', printer_id: '', filament_id: '', electricity_settings_id: '',
      filament_used_grams: '', print_time_hours: '', extra_manual_costs: '',
      profit_margin_percent: '100', discount_percent: '0',
      preparation_time_minutes: '0', slicing_time_minutes: '0', print_start_time_minutes: '0',
      remove_from_plate_minutes: '0', clean_supports_minutes: '0', additional_work_minutes: '0',
      shipping_option_id: '', consumables_cost: '',
    });
    setSelectedConsumables([]);
    setEditingPrint(null);
  }

  function openEditDialog(print: PrintType) {
    setEditingPrint(print);
    setForm({
      name: print.name,
      printer_id: print.printer_id,
      filament_id: print.filament_id,
      electricity_settings_id: print.electricity_settings_id || '',
      filament_used_grams: print.filament_used_grams.toString(),
      print_time_hours: print.print_time_hours.toString(),
      extra_manual_costs: print.extra_manual_costs?.toString() || '',
      profit_margin_percent: print.profit_margin_percent?.toString() || '100',
      discount_percent: print.discount_percent?.toString() || '0',
      preparation_time_minutes: print.preparation_time_minutes?.toString() || '0',
      slicing_time_minutes: print.slicing_time_minutes?.toString() || '0',
      print_start_time_minutes: print.print_start_time_minutes?.toString() || '0',
      remove_from_plate_minutes: print.remove_from_plate_minutes?.toString() || '0',
      clean_supports_minutes: print.clean_supports_minutes?.toString() || '0',
      additional_work_minutes: print.additional_work_minutes?.toString() || '0',
      shipping_option_id: print.shipping_option_id || '',
      consumables_cost: print.consumables_cost?.toString() || '',
    });
    setDialogOpen(true);
  }

  const totalConsumablesCost = useMemo(() => {
    if (form.consumables_cost) return parseFloat(form.consumables_cost) || 0;
    return consumables.filter(c => c.is_active && selectedConsumables.includes(c.id)).reduce((sum, c) => sum + c.cost, 0);
  }, [form.consumables_cost, selectedConsumables, consumables]);

  const calculations = useMemo(() => {
    const printer = printers.find(p => p.id === form.printer_id);
    const filament = filaments.find(f => f.id === form.filament_id);
    const electricityId = form.electricity_settings_id || printer?.default_electricity_settings_id;
    const electricity = electricitySettings.find(e => e.id === electricityId);
    const shipping = shippingOptions.find(s => s.id === form.shipping_option_id);
    
    const filamentGrams = parseFloat(form.filament_used_grams) || 0;
    const printHours = parseFloat(form.print_time_hours) || 0;
    const extraCosts = parseFloat(form.extra_manual_costs) || 0;
    const profitMargin = parseFloat(form.profit_margin_percent) || 0;

    const prepTime = (parseFloat(form.preparation_time_minutes) || 0) + (parseFloat(form.slicing_time_minutes) || 0) + (parseFloat(form.print_start_time_minutes) || 0);
    const postTime = (parseFloat(form.remove_from_plate_minutes) || 0) + (parseFloat(form.clean_supports_minutes) || 0) + (parseFloat(form.additional_work_minutes) || 0);

    const filamentCost = filament ? filamentGrams * filament.cost_per_gram : 0;
    const energyCost = printer && electricity ? (printer.power_watts * printHours / 1000) * electricity.price_per_kwh : 0;
    const depHours = printer?.depreciation_hours || 5000;
    const depreciationPerHour = printer ? (printer.purchase_cost + (printer.maintenance_cost || 0)) / depHours : 0;
    const depreciationCost = depreciationPerHour * printHours;
    const totalMonthlyFixed = fixedExpenses.filter(e => e.is_active).reduce((sum, e) => sum + e.monthly_amount, 0);
    const fixedCostShare = (totalMonthlyFixed / 720) * printHours;
    const prepRate = laborSettings?.preparation_rate_per_hour || 15;
    const postRate = laborSettings?.post_processing_rate_per_hour || 12;
    const preparationCost = (prepTime / 60) * prepRate;
    const postProcessingCost = (postTime / 60) * postRate;
    const shippingCost = shipping?.price || 0;
    const consumablesCost = totalConsumablesCost;

    const totalCost = filamentCost + energyCost + depreciationCost + fixedCostShare + extraCosts + preparationCost + postProcessingCost + shippingCost + consumablesCost;
    const profitAmount = totalCost * (profitMargin / 100);
    const priceBeforeDiscount = totalCost + profitAmount;

    const discountTable = DISCOUNT_PERCENTAGES.map(discountPct => {
      const discountedPrice = priceBeforeDiscount * (1 - discountPct / 100);
      const discountAmount = priceBeforeDiscount * (discountPct / 100);
      const potentialProfit = discountedPrice - totalCost;
      return { discountPct, discountedPrice, discountAmount, potentialProfit, finalPrice: discountedPrice };
    });

    const currentDiscount = parseFloat(form.discount_percent) || 0;
    const recommendedPrice = priceBeforeDiscount * (1 - currentDiscount / 100);
    const profit = recommendedPrice - totalCost;

    return {
      filamentCost, energyCost, depreciationCost, fixedCostShare, extraCosts,
      preparationCost, postProcessingCost, shippingCost, consumablesCost,
      totalCost, priceBeforeDiscount, recommendedPrice, profit, profitAmount, discountTable,
    };
  }, [form, printers, filaments, electricitySettings, fixedExpenses, shippingOptions, laborSettings, totalConsumablesCost]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!canAddPrint && !editingPrint) {
      toast({ variant: 'destructive', title: 'Limit reached', description: 'Upgrade your plan to save more prints.' });
      return;
    }
    setSaving(true);

    const data = {
      user_id: user.id,
      name: form.name.trim(),
      printer_id: form.printer_id,
      filament_id: form.filament_id,
      electricity_settings_id: form.electricity_settings_id || null,
      filament_used_grams: parseFloat(form.filament_used_grams) || 0,
      print_time_hours: parseFloat(form.print_time_hours) || 0,
      extra_manual_costs: parseFloat(form.extra_manual_costs) || null,
      profit_margin_percent: parseFloat(form.profit_margin_percent) || 100,
      discount_percent: parseFloat(form.discount_percent) || 0,
      preparation_time_minutes: parseFloat(form.preparation_time_minutes) || 0,
      slicing_time_minutes: parseFloat(form.slicing_time_minutes) || 0,
      print_start_time_minutes: parseFloat(form.print_start_time_minutes) || 0,
      remove_from_plate_minutes: parseFloat(form.remove_from_plate_minutes) || 0,
      clean_supports_minutes: parseFloat(form.clean_supports_minutes) || 0,
      additional_work_minutes: parseFloat(form.additional_work_minutes) || 0,
      shipping_option_id: form.shipping_option_id || null,
      consumables_cost: totalConsumablesCost || null,
    };

    let error;
    if (editingPrint) {
      const res = await supabase.from('prints').update(data).eq('id', editingPrint.id);
      error = res.error;
    } else {
      const res = await supabase.from('prints').insert([data]);
      error = res.error;
    }
    setSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: editingPrint ? 'Print updated' : 'Print saved' });
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this print?')) return;
    const { error } = await supabase.from('prints').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Deleted' });
      if (selectedPrintId === id) setSelectedPrintId(null);
      fetchData();
    }
  }

  function getPrintCalculations(print: PrintType) {
    const printer = printers.find(p => p.id === print.printer_id);
    const filament = filaments.find(f => f.id === print.filament_id);
    const electricityId = print.electricity_settings_id || printer?.default_electricity_settings_id;
    const electricity = electricitySettings.find(e => e.id === electricityId);
    const shipping = shippingOptions.find(s => s.id === print.shipping_option_id);

    const filamentCost = filament ? print.filament_used_grams * filament.cost_per_gram : 0;
    const energyCost = printer && electricity ? (printer.power_watts * print.print_time_hours / 1000) * electricity.price_per_kwh : 0;
    const depHours = printer?.depreciation_hours || 5000;
    const depreciationPerHour = printer ? (printer.purchase_cost + (printer.maintenance_cost || 0)) / depHours : 0;
    const depreciationCost = depreciationPerHour * print.print_time_hours;
    const totalMonthlyFixed = fixedExpenses.filter(e => e.is_active).reduce((sum, e) => sum + e.monthly_amount, 0);
    const fixedCostShare = (totalMonthlyFixed / 720) * print.print_time_hours;
    const extraCosts = print.extra_manual_costs || 0;

    const prepTime = (print.preparation_time_minutes || 0) + (print.slicing_time_minutes || 0) + (print.print_start_time_minutes || 0);
    const postTime = (print.remove_from_plate_minutes || 0) + (print.clean_supports_minutes || 0) + (print.additional_work_minutes || 0);
    const prepRate = laborSettings?.preparation_rate_per_hour || 15;
    const postRate = laborSettings?.post_processing_rate_per_hour || 12;
    const preparationCost = (prepTime / 60) * prepRate;
    const postProcessingCost = (postTime / 60) * postRate;
    const shippingCost = shipping?.price || 0;
    const consumablesCost = print.consumables_cost || 0;

    const totalCost = filamentCost + energyCost + depreciationCost + fixedCostShare + extraCosts + preparationCost + postProcessingCost + shippingCost + consumablesCost;
    const profitMargin = print.profit_margin_percent || 0;
    const discount = print.discount_percent || 0;
    const priceBeforeDiscount = totalCost * (1 + profitMargin / 100);
    const recommendedPrice = priceBeforeDiscount * (1 - discount / 100);
    const profit = recommendedPrice - totalCost;
    const profitAmount = totalCost * (profitMargin / 100);

    const discountTable = DISCOUNT_PERCENTAGES.map(discountPct => {
      const discountedPrice = priceBeforeDiscount * (1 - discountPct / 100);
      const discountAmount = priceBeforeDiscount * (discountPct / 100);
      const potentialProfit = discountedPrice - totalCost;
      return { discountPct, discountedPrice, discountAmount, potentialProfit, finalPrice: discountedPrice };
    });

    return { 
      filamentCost, energyCost, depreciationCost, fixedCostShare, extraCosts,
      preparationCost, postProcessingCost, shippingCost, consumablesCost,
      totalCost, priceBeforeDiscount, recommendedPrice, profit, profitAmount, discountTable,
      printer, filament 
    };
  }

  const selectedPrint = prints.find(p => p.id === selectedPrintId);
  const selectedPrintCalc = selectedPrint ? getPrintCalculations(selectedPrint) : null;

  const handleExportCSV = () => {
    if (!selectedPrint || !selectedPrintCalc) return;
    exportPrintToCSV({
      name: selectedPrint.name,
      printerName: selectedPrintCalc.printer?.name || 'Unknown',
      filamentName: selectedPrintCalc.filament?.name || 'Unknown',
      filamentUsedGrams: selectedPrint.filament_used_grams,
      printTimeHours: selectedPrint.print_time_hours,
      calculations: selectedPrintCalc,
      profitMarginPercent: selectedPrint.profit_margin_percent || 0,
      discountPercent: selectedPrint.discount_percent || 0,
    });
    toast({ title: 'CSV exported' });
  };

  const handleExportPDF = () => {
    if (!selectedPrint || !selectedPrintCalc) return;
    exportPrintToPDF({
      name: selectedPrint.name,
      printerName: selectedPrintCalc.printer?.name || 'Unknown',
      filamentName: selectedPrintCalc.filament?.name || 'Unknown',
      filamentUsedGrams: selectedPrint.filament_used_grams,
      printTimeHours: selectedPrint.print_time_hours,
      calculations: selectedPrintCalc,
      profitMarginPercent: selectedPrint.profit_margin_percent || 0,
      discountPercent: selectedPrint.discount_percent || 0,
    });
  };

  const canCreatePrint = printers.length > 0 && filaments.length > 0;

  return (
    <AppLayout>
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Prints</h1>
            <p className="text-muted-foreground mt-1">Calculate costs and pricing for your 3D prints</p>
          </div>
          {canCreatePrint ? (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="accent" disabled={!canAddPrint && !editingPrint}>
                  <Plus className="w-4 h-4" />New Print
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPrint ? 'Edit Print' : 'Calculate Print Cost'}</DialogTitle>
                  <DialogDescription>Enter print details to calculate costs and pricing</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs defaultValue="basic" className="space-y-4">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="basic">Basic Info</TabsTrigger>
                      <TabsTrigger value="labor">Labor</TabsTrigger>
                      <TabsTrigger value="extras">Extras</TabsTrigger>
                      <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Print Name *</Label>
                          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Custom Phone Stand" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Printer *</Label>
                          <Select value={form.printer_id} onValueChange={(v) => setForm({ ...form, printer_id: v })} required>
                            <SelectTrigger><SelectValue placeholder="Select printer" /></SelectTrigger>
                            <SelectContent>{printers.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Filament *</Label>
                          <Select value={form.filament_id} onValueChange={(v) => setForm({ ...form, filament_id: v })} required>
                            <SelectTrigger><SelectValue placeholder="Select filament" /></SelectTrigger>
                            <SelectContent>{filaments.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        {electricitySettings.length > 0 && (
                          <div className="space-y-2">
                            <Label>Electricity Profile</Label>
                            <Select value={form.electricity_settings_id} onValueChange={(v) => setForm({ ...form, electricity_settings_id: v })}>
                              <SelectTrigger><SelectValue placeholder="Use printer default" /></SelectTrigger>
                              <SelectContent>{electricitySettings.map((e) => (<SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>))}</SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>Filament Used (g) *</Label>
                          <Input type="number" step="0.1" value={form.filament_used_grams} onChange={(e) => setForm({ ...form, filament_used_grams: e.target.value })} placeholder="50" required />
                        </div>
                        <div className="space-y-2">
                          <Label>Print Time (hours) *</Label>
                          <Input type="number" step="0.1" value={form.print_time_hours} onChange={(e) => setForm({ ...form, print_time_hours: e.target.value })} placeholder="2.5" required />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="labor" className="space-y-4">
                      <div className="p-4 rounded-xl bg-muted/50">
                        <h4 className="font-semibold flex items-center gap-2 mb-4"><Wrench className="w-4 h-4" />Preparation (before printing)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Model Preparation (min)</Label>
                            <Input type="number" value={form.preparation_time_minutes} onChange={(e) => setForm({ ...form, preparation_time_minutes: e.target.value })} placeholder="0" />
                          </div>
                          <div className="space-y-2">
                            <Label>Slicing (min)</Label>
                            <Input type="number" value={form.slicing_time_minutes} onChange={(e) => setForm({ ...form, slicing_time_minutes: e.target.value })} placeholder="0" />
                          </div>
                          <div className="space-y-2">
                            <Label>Print Start (min)</Label>
                            <Input type="number" value={form.print_start_time_minutes} onChange={(e) => setForm({ ...form, print_start_time_minutes: e.target.value })} placeholder="0" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Rate: €{laborSettings?.preparation_rate_per_hour || 15}/hour</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50">
                        <h4 className="font-semibold flex items-center gap-2 mb-4"><Scissors className="w-4 h-4" />Post-Processing (after printing)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Remove from Plate (min)</Label>
                            <Input type="number" value={form.remove_from_plate_minutes} onChange={(e) => setForm({ ...form, remove_from_plate_minutes: e.target.value })} placeholder="0" />
                          </div>
                          <div className="space-y-2">
                            <Label>Clean Supports (min)</Label>
                            <Input type="number" value={form.clean_supports_minutes} onChange={(e) => setForm({ ...form, clean_supports_minutes: e.target.value })} placeholder="0" />
                          </div>
                          <div className="space-y-2">
                            <Label>Additional Work (min)</Label>
                            <Input type="number" value={form.additional_work_minutes} onChange={(e) => setForm({ ...form, additional_work_minutes: e.target.value })} placeholder="0" />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Rate: €{laborSettings?.post_processing_rate_per_hour || 12}/hour</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="extras" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Package className="w-4 h-4" />Consumables Cost (€)</Label>
                            <Input type="number" step="0.01" value={form.consumables_cost} onChange={(e) => setForm({ ...form, consumables_cost: e.target.value })} placeholder="Auto-calculated or enter manually" />
                            {consumables.filter(c => c.is_active).length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground">Or select from your consumables:</p>
                                <div className="flex flex-wrap gap-2">
                                  {consumables.filter(c => c.is_active).map((c) => (
                                    <Button
                                      key={c.id}
                                      type="button"
                                      variant={selectedConsumables.includes(c.id) ? 'secondary' : 'outline'}
                                      size="sm"
                                      onClick={() => {
                                        setForm({ ...form, consumables_cost: '' });
                                        setSelectedConsumables(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]);
                                      }}
                                    >
                                      {c.name} (€{c.cost.toFixed(2)})
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label>Extra Manual Costs (€)</Label>
                            <Input type="number" step="0.01" value={form.extra_manual_costs} onChange={(e) => setForm({ ...form, extra_manual_costs: e.target.value })} placeholder="0.00" />
                            <p className="text-xs text-muted-foreground">Sanding, painting, etc.</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2"><Truck className="w-4 h-4" />Shipping Option</Label>
                          <Select value={form.shipping_option_id || "none"} onValueChange={(v) => setForm({ ...form, shipping_option_id: v === "none" ? "" : v })}>
                            <SelectTrigger><SelectValue placeholder="No shipping" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No shipping</SelectItem>
                              {shippingOptions.filter(s => s.is_active).map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name} - €{s.price.toFixed(2)}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Profit Margin (%)</Label>
                          <Input type="number" value={form.profit_margin_percent} onChange={(e) => setForm({ ...form, profit_margin_percent: e.target.value })} placeholder="100" />
                        </div>
                        <div className="space-y-2">
                          <Label>Discount (%)</Label>
                          <Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} placeholder="0" />
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/50 text-center">
                        <p className="text-sm text-muted-foreground">Recommended Price</p>
                        <p className="text-3xl font-bold text-accent">€{calculations.recommendedPrice.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Profit: €{calculations.profit.toFixed(2)}</p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Button type="submit" variant="accent" className="w-full" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {editingPrint ? 'Update Print' : 'Save Print'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="accent" disabled><Plus className="w-4 h-4" />Add printer & filament first</Button>
          )}
        </div>

        {!canAddPrint && (
          <Card className="border-accent/50 bg-accent/5">
            <CardContent className="py-4 flex items-center justify-between">
              <div><p className="font-medium">You've reached your print limit</p><p className="text-sm text-muted-foreground">Upgrade to save more</p></div>
              <Button variant="accent" asChild><Link to="/pricing">Upgrade</Link></Button>
            </CardContent>
          </Card>
        )}

        {!canCreatePrint && (
          <Card className="shadow-card border-border/50">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">You need at least one printer and one filament to create prints.</p>
              <div className="flex gap-4 justify-center">
                <Button asChild><Link to="/printers">Add Printer</Link></Button>
                <Button variant="secondary" asChild><Link to="/filaments">Add Filament</Link></Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : prints.length === 0 && canCreatePrint ? (
          <Card className="shadow-card border-border/50">
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-muted-foreground" /></div>
              <h3 className="font-semibold text-lg mb-2">No prints yet</h3>
              <p className="text-muted-foreground mb-4">Calculate your first print cost</p>
              <Button variant="accent" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4" />New Print</Button>
            </CardContent>
          </Card>
        ) : prints.length > 0 && (
          <Card className="shadow-card border-border/50 overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
              <ResizablePanel defaultSize={40} minSize={30}>
                <div className="p-4 border-b border-border/50">
                  <h3 className="font-semibold">Your Prints ({prints.length})</h3>
                </div>
                <ScrollArea className="h-[550px]">
                  <div className="p-4 space-y-3">
                    {prints.map((print) => {
                      const calc = getPrintCalculations(print);
                      return (
                        <PrintListItem
                          key={print.id}
                          id={print.id}
                          name={print.name}
                          printerName={calc.printer?.name || 'Unknown'}
                          filamentName={calc.filament?.name || 'Unknown'}
                          filamentUsedGrams={print.filament_used_grams}
                          printTimeHours={print.print_time_hours}
                          totalCost={calc.totalCost}
                          recommendedPrice={calc.recommendedPrice}
                          profit={calc.profit}
                          isSelected={selectedPrintId === print.id}
                          onSelect={() => setSelectedPrintId(print.id)}
                          onEdit={() => openEditDialog(print)}
                          onDelete={() => handleDelete(print.id)}
                        />
                      );
                    })}
                  </div>
                </ScrollArea>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={60} minSize={40}>
                <PrintDetailPanel
                  print={selectedPrint && selectedPrintCalc ? {
                    id: selectedPrint.id,
                    name: selectedPrint.name,
                    printerName: selectedPrintCalc.printer?.name || 'Unknown',
                    filamentName: selectedPrintCalc.filament?.name || 'Unknown',
                    filamentUsedGrams: selectedPrint.filament_used_grams,
                    printTimeHours: selectedPrint.print_time_hours,
                    profitMarginPercent: selectedPrint.profit_margin_percent || 0,
                    discountPercent: selectedPrint.discount_percent || 0,
                  } : null}
                  calculations={selectedPrintCalc}
                  onExportCSV={handleExportCSV}
                  onExportPDF={handleExportPDF}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
