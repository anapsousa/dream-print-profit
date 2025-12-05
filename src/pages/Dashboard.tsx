import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import { CostTrendsChart } from '@/components/dashboard/CostTrendsChart';
import { ProfitAnalysisChart } from '@/components/dashboard/ProfitAnalysisChart';
import { CostBreakdownChart } from '@/components/dashboard/CostBreakdownChart';
import {
  Printer,
  Package,
  FileText,
  Plus,
  TrendingUp,
  DollarSign,
  Zap,
  PieChart,
  BarChart3,
  LineChart,
} from 'lucide-react';

interface Stats {
  printerCount: number;
  filamentCount: number;
  printCount: number;
  totalRevenue: number;
  totalProfit: number;
  avgProfitMargin: number;
}

interface PrintData {
  id: string;
  name: string;
  created_at: string;
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
  consumables_cost: number | null;
  shipping_option_id: string | null;
}

interface PrinterData {
  id: string;
  purchase_cost: number;
  depreciation_hours: number;
  maintenance_cost: number;
  power_watts: number;
  default_electricity_settings_id: string | null;
}

interface FilamentData {
  id: string;
  cost_per_gram: number;
}

interface ElectricityData {
  id: string;
  price_per_kwh: number;
}

interface FixedExpenseData {
  monthly_amount: number;
  is_active: boolean;
}

interface ShippingData {
  id: string;
  price: number;
}

interface LaborData {
  preparation_rate_per_hour: number;
  post_processing_rate_per_hour: number;
}

export default function Dashboard() {
  const { user, subscription, refreshSubscription } = useAuth();
  const [stats, setStats] = useState<Stats>({ 
    printerCount: 0, filamentCount: 0, printCount: 0, 
    totalRevenue: 0, totalProfit: 0, avgProfitMargin: 0 
  });
  const [loading, setLoading] = useState(true);
  const [hasElectricitySettings, setHasElectricitySettings] = useState<boolean | null>(null);
  const [prints, setPrints] = useState<PrintData[]>([]);
  const [printers, setPrinters] = useState<PrinterData[]>([]);
  const [filaments, setFilaments] = useState<FilamentData[]>([]);
  const [electricity, setElectricity] = useState<ElectricityData[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenseData[]>([]);
  const [shipping, setShipping] = useState<ShippingData[]>([]);
  const [labor, setLabor] = useState<LaborData | null>(null);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      toast({
        title: 'Subscription activated!',
        description: 'Thank you for upgrading. Enjoy your new features!',
      });
      refreshSubscription();
    }
  }, [searchParams, toast, refreshSubscription]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const [printersRes, filamentsRes, printsRes, electricityRes, expensesRes, shippingRes, laborRes] = await Promise.all([
        supabase.from('printers').select('id, purchase_cost, depreciation_hours, maintenance_cost, power_watts, default_electricity_settings_id'),
        supabase.from('filaments').select('id, cost_per_gram'),
        supabase.from('prints').select('*').order('created_at', { ascending: true }),
        supabase.from('electricity_settings').select('id, price_per_kwh'),
        supabase.from('fixed_expenses').select('monthly_amount, is_active'),
        supabase.from('shipping_options').select('id, price'),
        supabase.from('labor_settings').select('*').limit(1).single(),
      ]);

      if (printersRes.data) setPrinters(printersRes.data);
      if (filamentsRes.data) setFilaments(filamentsRes.data);
      if (printsRes.data) setPrints(printsRes.data as PrintData[]);
      if (electricityRes.data) setElectricity(electricityRes.data);
      if (expensesRes.data) setFixedExpenses(expensesRes.data);
      if (shippingRes.data) setShipping(shippingRes.data);
      if (laborRes.data) setLabor(laborRes.data);

      setStats(prev => ({
        ...prev,
        printerCount: printersRes.data?.length || 0,
        filamentCount: filamentsRes.data?.length || 0,
        printCount: printsRes.data?.length || 0,
      }));

      setHasElectricitySettings((electricityRes.data?.length || 0) > 0);
      setLoading(false);
    }

    fetchData();
  }, [user]);

  // Calculate costs for each print
  const printCalculations = useMemo(() => {
    return prints.map(print => {
      const printer = printers.find(p => p.id === print.printer_id);
      const filament = filaments.find(f => f.id === print.filament_id);
      const electricityId = print.electricity_settings_id || printer?.default_electricity_settings_id;
      const elec = electricity.find(e => e.id === electricityId);
      const ship = shipping.find(s => s.id === print.shipping_option_id);

      const filamentCost = filament ? print.filament_used_grams * filament.cost_per_gram : 0;
      const energyCost = printer && elec ? (printer.power_watts * print.print_time_hours / 1000) * elec.price_per_kwh : 0;
      const depHours = printer?.depreciation_hours || 5000;
      const depreciationPerHour = printer ? (printer.purchase_cost + (printer.maintenance_cost || 0)) / depHours : 0;
      const depreciationCost = depreciationPerHour * print.print_time_hours;
      const totalMonthlyFixed = fixedExpenses.filter(e => e.is_active).reduce((sum, e) => sum + e.monthly_amount, 0);
      const fixedCostShare = (totalMonthlyFixed / 720) * print.print_time_hours;
      const extraCosts = print.extra_manual_costs || 0;

      const prepTime = (print.preparation_time_minutes || 0) + (print.slicing_time_minutes || 0) + (print.print_start_time_minutes || 0);
      const postTime = (print.remove_from_plate_minutes || 0) + (print.clean_supports_minutes || 0) + (print.additional_work_minutes || 0);
      const prepRate = labor?.preparation_rate_per_hour || 15;
      const postRate = labor?.post_processing_rate_per_hour || 12;
      const preparationCost = (prepTime / 60) * prepRate;
      const postProcessingCost = (postTime / 60) * postRate;
      const shippingCost = ship?.price || 0;
      const consumablesCost = print.consumables_cost || 0;

      const totalCost = filamentCost + energyCost + depreciationCost + fixedCostShare + extraCosts + preparationCost + postProcessingCost + shippingCost + consumablesCost;
      const profitMargin = print.profit_margin_percent || 0;
      const discount = print.discount_percent || 0;
      const priceBeforeDiscount = totalCost * (1 + profitMargin / 100);
      const recommendedPrice = priceBeforeDiscount * (1 - discount / 100);
      const profit = recommendedPrice - totalCost;

      return {
        ...print,
        totalCost,
        recommendedPrice,
        profit,
        filamentCost,
        energyCost,
        depreciationCost,
        fixedCostShare,
        preparationCost,
        postProcessingCost,
        shippingCost,
        consumablesCost,
      };
    });
  }, [prints, printers, filaments, electricity, fixedExpenses, shipping, labor]);

  // Aggregate stats
  const aggregateStats = useMemo(() => {
    const totalRevenue = printCalculations.reduce((sum, p) => sum + p.recommendedPrice, 0);
    const totalProfit = printCalculations.reduce((sum, p) => sum + p.profit, 0);
    const avgProfitMargin = printCalculations.length > 0
      ? (totalProfit / printCalculations.reduce((sum, p) => sum + p.totalCost, 0)) * 100
      : 0;
    return { totalRevenue, totalProfit, avgProfitMargin };
  }, [printCalculations]);

  // Chart data
  const costTrendsData = useMemo(() => {
    return printCalculations.slice(-10).map(p => ({
      date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      cost: parseFloat(p.totalCost.toFixed(2)),
      price: parseFloat(p.recommendedPrice.toFixed(2)),
    }));
  }, [printCalculations]);

  const profitAnalysisData = useMemo(() => {
    return printCalculations.slice(-6).map(p => ({
      name: p.name.length > 10 ? p.name.substring(0, 10) + '...' : p.name,
      cost: parseFloat(p.totalCost.toFixed(2)),
      profit: parseFloat(p.profit.toFixed(2)),
    }));
  }, [printCalculations]);

  const costBreakdownData = useMemo(() => {
    const totals = printCalculations.reduce((acc, p) => ({
      filament: acc.filament + p.filamentCost,
      energy: acc.energy + p.energyCost,
      depreciation: acc.depreciation + p.depreciationCost,
      fixed: acc.fixed + p.fixedCostShare,
      preparation: acc.preparation + p.preparationCost,
      postProcessing: acc.postProcessing + p.postProcessingCost,
      shipping: acc.shipping + p.shippingCost,
      consumables: acc.consumables + p.consumablesCost,
    }), { filament: 0, energy: 0, depreciation: 0, fixed: 0, preparation: 0, postProcessing: 0, shipping: 0, consumables: 0 });

    return [
      { name: 'Filament', value: parseFloat(totals.filament.toFixed(2)) },
      { name: 'Energy', value: parseFloat(totals.energy.toFixed(2)) },
      { name: 'Depreciation', value: parseFloat(totals.depreciation.toFixed(2)) },
      { name: 'Fixed', value: parseFloat(totals.fixed.toFixed(2)) },
      { name: 'Prep', value: parseFloat(totals.preparation.toFixed(2)) },
      { name: 'Post-Proc', value: parseFloat(totals.postProcessing.toFixed(2)) },
      { name: 'Shipping', value: parseFloat(totals.shipping.toFixed(2)) },
      { name: 'Consumables', value: parseFloat(totals.consumables.toFixed(2)) },
    ];
  }, [printCalculations]);

  const tierInfo = SUBSCRIPTION_TIERS[subscription.tier];
  const usagePercent = Math.min((stats.printCount / tierInfo.maxPrints) * 100, 100);

  if (hasElectricitySettings === false) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto animate-slide-up">
          <Card className="shadow-card border-border/50">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl gradient-accent flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-accent-foreground" />
              </div>
              <CardTitle className="font-display text-2xl">Welcome to Dr3amToReal!</CardTitle>
              <CardDescription>
                Let's get you started by setting up your electricity configuration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                This helps calculate accurate energy costs for your prints.
              </p>
              <Button asChild className="w-full" size="lg">
                <Link to="/settings">Set Up Electricity Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 animate-slide-up">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your 3D printing costs.
          </p>
        </div>

        {/* Usage Progress */}
        <Card className="shadow-card border-border/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Print Storage</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.printCount} of {tierInfo.maxPrints} prints used
                </p>
              </div>
              {subscription.tier === 'free' && (
                <Button variant="accent" size="sm" asChild>
                  <Link to="/pricing">Upgrade</Link>
                </Button>
              )}
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary transition-all duration-500"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Printer className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Printers</p>
                  <p className="text-2xl font-bold">{stats.printerCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Filaments</p>
                  <p className="text-2xl font-bold">{stats.filamentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">€{aggregateStats.totalRevenue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                  <p className="text-2xl font-bold text-success">€{aggregateStats.totalProfit.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <LineChart className="w-5 h-5 text-primary" />
                Cost vs Price Trends
              </CardTitle>
              <CardDescription>Recent prints cost and sale price comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <CostTrendsChart data={costTrendsData} />
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-5 h-5 text-success" />
                Profit Analysis
              </CardTitle>
              <CardDescription>Cost vs profit for recent prints</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitAnalysisChart data={profitAnalysisData} />
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PieChart className="w-5 h-5 text-accent" />
              Cost Distribution
            </CardTitle>
            <CardDescription>Where your production costs come from</CardDescription>
          </CardHeader>
          <CardContent>
            <CostBreakdownChart data={costBreakdownData} />
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-primary" />
                Add Printer
              </CardTitle>
              <CardDescription>Set up a new 3D printer with cost details</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/printers">
                  <Plus className="w-4 h-4" />
                  Add Printer
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-secondary" />
                Add Filament
              </CardTitle>
              <CardDescription>Track your filament costs per gram</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" asChild className="w-full">
                <Link to="/filaments">
                  <Plus className="w-4 h-4" />
                  Add Filament
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                Calculate Print
              </CardTitle>
              <CardDescription>Get accurate cost & pricing for a print</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="accent" asChild className="w-full">
                <Link to="/prints">
                  <Plus className="w-4 h-4" />
                  New Print
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
