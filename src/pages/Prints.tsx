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
import { Plus, FileText, Loader2, Clock, Package, Truck, Wrench, Scissors, Search, Filter, ArrowUpDown, Trash2, Download, CheckSquare, Copy, Save, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PrintListItem } from '@/components/prints/PrintListItem';
import { PrintDetailPanel } from '@/components/prints/PrintDetailPanel';
import { MultiFilamentSelector } from '@/components/prints/MultiFilamentSelector';
import { exportPrintToCSV, exportPrintToPDF, exportMultiplePrintsToCSV } from '@/lib/exportUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Checkbox } from '@/components/ui/checkbox';

interface FilamentEntry {
  filament_id: string;
  grams: string;
}

interface PrintFilamentDB {
  id: string;
  print_id: string;
  filament_id: string;
  grams_used: number;
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'cost-asc' | 'cost-desc' | 'profit-asc' | 'profit-desc';

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

interface TemplateType {
  id: string;
  name: string;
  printer_id: string | null;
  filament_id: string | null;
  electricity_settings_id: string | null;
  preparation_time_minutes: number;
  slicing_time_minutes: number;
  print_start_time_minutes: number;
  remove_from_plate_minutes: number;
  clean_supports_minutes: number;
  additional_work_minutes: number;
  shipping_option_id: string | null;
  profit_margin_percent: number;
}

const DISCOUNT_PERCENTAGES = [0, 5, 10, 20, 30, 50];

export default function Prints() {
  const { user, subscription } = useAuth();
  const isMobile = useIsMobile();
  const [prints, setPrints] = useState<PrintType[]>([]);
  const [printers, setPrinters] = useState<PrinterType[]>([]);
  const [filaments, setFilaments] = useState<FilamentType[]>([]);
  const [electricitySettings, setElectricitySettings] = useState<ElectricitySettingType[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseType[]>([]);
  const [consumables, setConsumables] = useState<ConsumableType[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOptionType[]>([]);
  const [laborSettings, setLaborSettings] = useState<LaborSettingType | null>(null);
  const [templates, setTemplates] = useState<TemplateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrint, setEditingPrint] = useState<PrintType | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedPrintId, setSelectedPrintId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'details'>('list');
  const { toast } = useToast();

  // Search, filter, sort, and batch selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrinter, setFilterPrinter] = useState<string>('all');
  const [filterFilament, setFilterFilament] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);

  const [form, setForm] = useState({
    name: '',
    printer_id: '',
    electricity_settings_id: '',
    print_time_hours: '',
    print_time_minutes: '',
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

  const [filamentEntries, setFilamentEntries] = useState<FilamentEntry[]>([{ filament_id: '', grams: '' }]);
  const [printFilaments, setPrintFilaments] = useState<Record<string, PrintFilamentDB[]>>({});
  const [selectedConsumables, setSelectedConsumables] = useState<string[]>([]);

  const tierInfo = SUBSCRIPTION_TIERS[subscription.tier];
  const canAddPrint = prints.length < tierInfo.maxPrints;

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;

    const [printsRes, printersRes, filamentsRes, electricityRes, expensesRes, consumablesRes, shippingRes, laborRes, templatesRes] = await Promise.all([
      supabase.from('prints').select('*').order('created_at', { ascending: false }),
      supabase.from('printers').select('id, name, purchase_cost, depreciation_months, depreciation_hours, maintenance_cost, power_watts, default_electricity_settings_id'),
      supabase.from('filaments').select('id, name, cost_per_gram'),
      supabase.from('electricity_settings').select('id, name, price_per_kwh, daily_fixed_cost'),
      supabase.from('fixed_expenses').select('id, monthly_amount, is_active'),
      supabase.from('consumables').select('*'),
      supabase.from('shipping_options').select('*'),
      supabase.from('labor_settings').select('*').limit(1).single(),
      supabase.from('print_templates').select('*').order('name'),
    ]);

    if (printsRes.data) setPrints(printsRes.data as PrintType[]);
    if (printersRes.data) setPrinters(printersRes.data as PrinterType[]);
    if (filamentsRes.data) setFilaments(filamentsRes.data);
    if (electricityRes.data) setElectricitySettings(electricityRes.data);
    if (expensesRes.data) setFixedExpenses(expensesRes.data);
    if (consumablesRes.data) setConsumables(consumablesRes.data);
    if (shippingRes.data) setShippingOptions(shippingRes.data);
    if (laborRes.data) setLaborSettings(laborRes.data);
    if (templatesRes.data) setTemplates(templatesRes.data as TemplateType[]);
    setLoading(false);
  }

  function resetForm() {
    setForm({
      name: '', printer_id: '', electricity_settings_id: '',
      print_time_hours: '', print_time_minutes: '', extra_manual_costs: '',
      profit_margin_percent: '100', discount_percent: '0',
      preparation_time_minutes: '0', slicing_time_minutes: '0', print_start_time_minutes: '0',
      remove_from_plate_minutes: '0', clean_supports_minutes: '0', additional_work_minutes: '0',
      shipping_option_id: '', consumables_cost: '',
    });
    setFilamentEntries([{ filament_id: '', grams: '' }]);
    setSelectedConsumables([]);
    setEditingPrint(null);
  }

  function openEditDialog(print: PrintType) {
    setEditingPrint(print);
    const hours = Math.floor(print.print_time_hours);
    const minutes = Math.round((print.print_time_hours - hours) * 60);
    setForm({
      name: print.name,
      printer_id: print.printer_id,
      electricity_settings_id: print.electricity_settings_id || '',
      print_time_hours: hours.toString(),
      print_time_minutes: minutes.toString(),
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
    // Load filaments for this print - use legacy single filament for backward compatibility
    setFilamentEntries([{ 
      filament_id: print.filament_id, 
      grams: print.filament_used_grams.toString() 
    }]);
    setDialogOpen(true);
  }

  // Filtered and sorted prints
  const filteredPrints = useMemo(() => {
    let result = prints.filter(print => {
      const matchesSearch = print.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrinter = filterPrinter === 'all' || print.printer_id === filterPrinter;
      const matchesFilament = filterFilament === 'all' || print.filament_id === filterFilament;
      return matchesSearch && matchesPrinter && matchesFilament;
    });

    // Sort
    result.sort((a, b) => {
      const calcA = getPrintCalculations(a);
      const calcB = getPrintCalculations(b);
      switch (sortBy) {
        case 'date-desc': return 0; // Already sorted by created_at desc from DB
        case 'date-asc': return -1; // Reverse
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'cost-asc': return calcA.totalCost - calcB.totalCost;
        case 'cost-desc': return calcB.totalCost - calcA.totalCost;
        case 'profit-asc': return calcA.profit - calcB.profit;
        case 'profit-desc': return calcB.profit - calcA.profit;
        default: return 0;
      }
    });

    if (sortBy === 'date-asc') result.reverse();
    return result;
  }, [prints, searchQuery, filterPrinter, filterFilament, sortBy, printers, filaments, electricitySettings, fixedExpenses, shippingOptions, laborSettings]);

  const totalConsumablesCost = useMemo(() => {
    if (form.consumables_cost) return parseFloat(form.consumables_cost) || 0;
    return consumables.filter(c => c.is_active && selectedConsumables.includes(c.id)).reduce((sum, c) => sum + c.cost, 0);
  }, [form.consumables_cost, selectedConsumables, consumables]);

  // Calculate total filament cost from entries
  const totalFilamentCost = useMemo(() => {
    return filamentEntries.reduce((sum, entry) => {
      const filament = filaments.find(f => f.id === entry.filament_id);
      const grams = parseFloat(entry.grams) || 0;
      return sum + (filament ? grams * filament.cost_per_gram : 0);
    }, 0);
  }, [filamentEntries, filaments]);

  const totalFilamentGrams = useMemo(() => {
    return filamentEntries.reduce((sum, entry) => sum + (parseFloat(entry.grams) || 0), 0);
  }, [filamentEntries]);

  const calculations = useMemo(() => {
    const printer = printers.find(p => p.id === form.printer_id);
    const electricityId = form.electricity_settings_id || printer?.default_electricity_settings_id;
    const electricity = electricitySettings.find(e => e.id === electricityId);
    const shipping = shippingOptions.find(s => s.id === form.shipping_option_id);
    
    const printHours = (parseFloat(form.print_time_hours) || 0) + (parseFloat(form.print_time_minutes) || 0) / 60;
    const extraCosts = parseFloat(form.extra_manual_costs) || 0;
    const profitMargin = parseFloat(form.profit_margin_percent) || 0;

    const prepTime = (parseFloat(form.preparation_time_minutes) || 0) + (parseFloat(form.slicing_time_minutes) || 0) + (parseFloat(form.print_start_time_minutes) || 0);
    const postTime = (parseFloat(form.remove_from_plate_minutes) || 0) + (parseFloat(form.clean_supports_minutes) || 0) + (parseFloat(form.additional_work_minutes) || 0);

    const filamentCost = totalFilamentCost;
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
  }, [form, printers, electricitySettings, fixedExpenses, shippingOptions, laborSettings, totalConsumablesCost, totalFilamentCost]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!canAddPrint && !editingPrint) {
      toast({ variant: 'destructive', title: 'Limit reached', description: 'Upgrade your plan to save more prints.' });
      return;
    }
    setSaving(true);

    const totalPrintHours = (parseFloat(form.print_time_hours) || 0) + (parseFloat(form.print_time_minutes) || 0) / 60;
    // Get primary filament for backward compatibility
    const primaryFilament = filamentEntries[0];
    const data = {
      user_id: user.id,
      name: form.name.trim(),
      printer_id: form.printer_id,
      filament_id: primaryFilament?.filament_id || '',
      electricity_settings_id: form.electricity_settings_id || null,
      filament_used_grams: totalFilamentGrams,
      print_time_hours: totalPrintHours,
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

  async function handleDuplicate(print: PrintType) {
    if (!user || !canAddPrint) {
      toast({ variant: 'destructive', title: 'Limit reached', description: 'Upgrade your plan to save more prints.' });
      return;
    }
    const { error } = await supabase.from('prints').insert([{
      user_id: user.id,
      name: `${print.name} (copy)`,
      printer_id: print.printer_id,
      filament_id: print.filament_id,
      electricity_settings_id: print.electricity_settings_id,
      filament_used_grams: print.filament_used_grams,
      print_time_hours: print.print_time_hours,
      extra_manual_costs: print.extra_manual_costs,
      profit_margin_percent: print.profit_margin_percent,
      discount_percent: print.discount_percent,
      preparation_time_minutes: print.preparation_time_minutes,
      slicing_time_minutes: print.slicing_time_minutes,
      print_start_time_minutes: print.print_start_time_minutes,
      remove_from_plate_minutes: print.remove_from_plate_minutes,
      clean_supports_minutes: print.clean_supports_minutes,
      additional_work_minutes: print.additional_work_minutes,
      shipping_option_id: print.shipping_option_id,
      consumables_cost: print.consumables_cost,
    }]);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Print duplicated' });
      fetchData();
    }
  }

  async function handleSaveTemplate() {
    if (!user) return;
    const templateName = prompt('Enter template name:');
    if (!templateName?.trim()) return;
    
    const primaryFilament = filamentEntries[0];
    const { error } = await supabase.from('print_templates').insert([{
      user_id: user.id,
      name: templateName.trim(),
      printer_id: form.printer_id || null,
      filament_id: primaryFilament?.filament_id || null,
      electricity_settings_id: form.electricity_settings_id || null,
      preparation_time_minutes: parseFloat(form.preparation_time_minutes) || 0,
      slicing_time_minutes: parseFloat(form.slicing_time_minutes) || 0,
      print_start_time_minutes: parseFloat(form.print_start_time_minutes) || 0,
      remove_from_plate_minutes: parseFloat(form.remove_from_plate_minutes) || 0,
      clean_supports_minutes: parseFloat(form.clean_supports_minutes) || 0,
      additional_work_minutes: parseFloat(form.additional_work_minutes) || 0,
      shipping_option_id: form.shipping_option_id || null,
      profit_margin_percent: parseFloat(form.profit_margin_percent) || 100,
    }]);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Template saved' });
      fetchData();
    }
  }

  function handleLoadTemplate(template: TemplateType) {
    setForm(prev => ({
      ...prev,
      printer_id: template.printer_id || prev.printer_id,
      electricity_settings_id: template.electricity_settings_id || prev.electricity_settings_id,
      preparation_time_minutes: template.preparation_time_minutes.toString(),
      slicing_time_minutes: template.slicing_time_minutes.toString(),
      print_start_time_minutes: template.print_start_time_minutes.toString(),
      remove_from_plate_minutes: template.remove_from_plate_minutes.toString(),
      clean_supports_minutes: template.clean_supports_minutes.toString(),
      additional_work_minutes: template.additional_work_minutes.toString(),
      shipping_option_id: template.shipping_option_id || '',
      profit_margin_percent: template.profit_margin_percent.toString(),
    }));
    if (template.filament_id) {
      setFilamentEntries([{ filament_id: template.filament_id, grams: '' }]);
    }
    toast({ title: `Template "${template.name}" loaded` });
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Delete this template?')) return;
    const { error } = await supabase.from('print_templates').delete().eq('id', id);
    if (error) toast({ variant: 'destructive', title: 'Error', description: error.message });
    else {
      toast({ title: 'Template deleted' });
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

  // Auto-switch to details tab on mobile when print is selected
  const handleSelectPrint = (id: string) => {
    setSelectedPrintId(id);
    if (isMobile) setMobileTab('details');
  };

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

  // Batch operations
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPrints.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPrints.map(p => p.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} print(s)?`)) return;
    
    const { error } = await supabase.from('prints').delete().in('id', Array.from(selectedIds));
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: `Deleted ${selectedIds.size} prints` });
      setSelectedIds(new Set());
      setBatchMode(false);
      if (selectedPrintId && selectedIds.has(selectedPrintId)) setSelectedPrintId(null);
      fetchData();
    }
  };

  const handleBatchExport = () => {
    if (selectedIds.size === 0) return;
    const printsToExport = prints.filter(p => selectedIds.has(p.id)).map(print => {
      const calc = getPrintCalculations(print);
      return {
        name: print.name,
        printerName: calc.printer?.name || 'Unknown',
        filamentName: calc.filament?.name || 'Unknown',
        filamentUsedGrams: print.filament_used_grams,
        printTimeHours: print.print_time_hours,
        calculations: calc,
        profitMarginPercent: print.profit_margin_percent || 0,
        discountPercent: print.discount_percent || 0,
      };
    });
    exportMultiplePrintsToCSV(printsToExport);
    toast({ title: `Exported ${selectedIds.size} prints to CSV` });
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
                
                {/* Template actions */}
                {!editingPrint && (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
                    <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Templates:</span>
                    {templates.length === 0 ? (
                      <span className="text-xs text-muted-foreground">No templates saved yet</span>
                    ) : (
                      <Select onValueChange={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) handleLoadTemplate(template);
                      }}>
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Load template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={handleSaveTemplate} className="ml-auto">
                      <Save className="w-3 h-3 mr-1" />Save as Template
                    </Button>
                    {templates.length > 0 && (
                      <Select onValueChange={(id) => handleDeleteTemplate(id)}>
                        <SelectTrigger className="w-8 h-8 p-0">
                          <Trash2 className="w-3 h-3" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(t => (
                            <SelectItem key={t.id} value={t.id}>Delete: {t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
                
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
                        <MultiFilamentSelector
                          filaments={filaments.map(f => ({ id: f.id, name: f.name, cost_per_gram: f.cost_per_gram }))}
                          entries={filamentEntries}
                          onChange={setFilamentEntries}
                        />
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
                          <Label>Print Time *</Label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input type="number" min="0" value={form.print_time_hours} onChange={(e) => setForm({ ...form, print_time_hours: e.target.value })} placeholder="0" required />
                              <span className="text-xs text-muted-foreground">hours</span>
                            </div>
                            <div className="flex-1">
                              <Input type="number" min="0" max="59" value={form.print_time_minutes} onChange={(e) => setForm({ ...form, print_time_minutes: e.target.value })} placeholder="0" />
                              <span className="text-xs text-muted-foreground">minutes</span>
                            </div>
                          </div>
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
            {isMobile ? (
              /* Mobile: Tabs layout */
              <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'list' | 'details')} className="w-full">
                <TabsList className="grid grid-cols-2 w-full rounded-none border-b">
                  <TabsTrigger value="list">Prints ({filteredPrints.length})</TabsTrigger>
                  <TabsTrigger value="details" disabled={!selectedPrint}>Details</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="m-0">
                  {/* Search, filter, sort bar */}
                  <div className="p-3 border-b border-border/50 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search prints..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={filterPrinter} onValueChange={setFilterPrinter}>
                        <SelectTrigger className="flex-1">
                          <Filter className="w-3 h-3 mr-1" />
                          <SelectValue placeholder="Printer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Printers</SelectItem>
                          {printers.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Select value={filterFilament} onValueChange={setFilterFilament}>
                        <SelectTrigger className="flex-1">
                          <Filter className="w-3 h-3 mr-1" />
                          <SelectValue placeholder="Filament" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Filaments</SelectItem>
                          {filaments.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <SelectTrigger className="flex-1">
                          <ArrowUpDown className="w-3 h-3 mr-1" />
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Newest first</SelectItem>
                          <SelectItem value="date-asc">Oldest first</SelectItem>
                          <SelectItem value="name-asc">Name A-Z</SelectItem>
                          <SelectItem value="name-desc">Name Z-A</SelectItem>
                          <SelectItem value="cost-asc">Cost: Low to High</SelectItem>
                          <SelectItem value="cost-desc">Cost: High to Low</SelectItem>
                          <SelectItem value="profit-asc">Profit: Low to High</SelectItem>
                          <SelectItem value="profit-desc">Profit: High to Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant={batchMode ? "secondary" : "outline"} size="icon" onClick={toggleBatchMode}>
                        <CheckSquare className="w-4 h-4" />
                      </Button>
                    </div>
                    {batchMode && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <Checkbox
                          checked={selectedIds.size === filteredPrints.length && filteredPrints.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-xs text-muted-foreground flex-1">
                          {selectedIds.size} selected
                        </span>
                        <Button variant="outline" size="sm" onClick={handleBatchExport} disabled={selectedIds.size === 0}>
                          <Download className="w-3 h-3 mr-1" />Export
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleBatchDelete} disabled={selectedIds.size === 0}>
                          <Trash2 className="w-3 h-3 mr-1" />Delete
                        </Button>
                      </div>
                    )}
                  </div>
                  <ScrollArea className="h-[500px]">
                    <div className="p-3 space-y-3">
                      {filteredPrints.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No prints found</p>
                      ) : filteredPrints.map((print) => {
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
                            showCheckbox={batchMode}
                            isChecked={selectedIds.has(print.id)}
                            onCheck={(checked) => {
                              const newSet = new Set(selectedIds);
                              checked ? newSet.add(print.id) : newSet.delete(print.id);
                              setSelectedIds(newSet);
                            }}
                            onSelect={() => handleSelectPrint(print.id)}
                            onEdit={() => openEditDialog(print)}
                            onDelete={() => handleDelete(print.id)}
                            onDuplicate={() => handleDuplicate(print)}
                          />
                        );
                      })}
                    </div>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="details" className="m-0">
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
                </TabsContent>
              </Tabs>
            ) : (
              /* Desktop: Resizable panels */
              <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
                <ResizablePanel defaultSize={40} minSize={30}>
                  {/* Search, filter, sort bar */}
                  <div className="p-4 border-b border-border/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Your Prints ({filteredPrints.length})</h3>
                      <Button variant={batchMode ? "secondary" : "outline"} size="sm" onClick={toggleBatchMode}>
                        <CheckSquare className="w-4 h-4 mr-1" />Batch
                      </Button>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search prints..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select value={filterPrinter} onValueChange={setFilterPrinter}>
                        <SelectTrigger className="flex-1">
                          <Filter className="w-3 h-3 mr-1" />
                          <SelectValue placeholder="Printer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Printers</SelectItem>
                          {printers.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Select value={filterFilament} onValueChange={setFilterFilament}>
                        <SelectTrigger className="flex-1">
                          <Filter className="w-3 h-3 mr-1" />
                          <SelectValue placeholder="Filament" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Filaments</SelectItem>
                          {filaments.map((f) => (<SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                        <SelectTrigger className="w-[140px]">
                          <ArrowUpDown className="w-3 h-3 mr-1" />
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="date-desc">Newest</SelectItem>
                          <SelectItem value="date-asc">Oldest</SelectItem>
                          <SelectItem value="name-asc">Name A-Z</SelectItem>
                          <SelectItem value="name-desc">Name Z-A</SelectItem>
                          <SelectItem value="cost-asc">Cost ↑</SelectItem>
                          <SelectItem value="cost-desc">Cost ↓</SelectItem>
                          <SelectItem value="profit-asc">Profit ↑</SelectItem>
                          <SelectItem value="profit-desc">Profit ↓</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {batchMode && (
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <Checkbox
                          checked={selectedIds.size === filteredPrints.length && filteredPrints.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                        <span className="text-sm text-muted-foreground flex-1">
                          {selectedIds.size} selected
                        </span>
                        <Button variant="outline" size="sm" onClick={handleBatchExport} disabled={selectedIds.size === 0}>
                          <Download className="w-3 h-3 mr-1" />Export CSV
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleBatchDelete} disabled={selectedIds.size === 0}>
                          <Trash2 className="w-3 h-3 mr-1" />Delete
                        </Button>
                      </div>
                    )}
                  </div>
                  <ScrollArea className="h-[480px]">
                    <div className="p-4 space-y-3">
                      {filteredPrints.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No prints found</p>
                      ) : filteredPrints.map((print) => {
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
                            showCheckbox={batchMode}
                            isChecked={selectedIds.has(print.id)}
                            onCheck={(checked) => {
                              const newSet = new Set(selectedIds);
                              checked ? newSet.add(print.id) : newSet.delete(print.id);
                              setSelectedIds(newSet);
                            }}
                            onSelect={() => handleSelectPrint(print.id)}
                            onEdit={() => openEditDialog(print)}
                            onDelete={() => handleDelete(print.id)}
                            onDuplicate={() => handleDuplicate(print)}
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
            )}
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
