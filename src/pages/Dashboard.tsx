import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import {
  Printer,
  Package,
  FileText,
  Plus,
  TrendingUp,
  DollarSign,
  Clock,
  Zap,
} from 'lucide-react';

interface Stats {
  printerCount: number;
  filamentCount: number;
  printCount: number;
  totalCost: number;
}

export default function Dashboard() {
  const { user, subscription, refreshSubscription } = useAuth();
  const [stats, setStats] = useState<Stats>({ printerCount: 0, filamentCount: 0, printCount: 0, totalCost: 0 });
  const [loading, setLoading] = useState(true);
  const [hasElectricitySettings, setHasElectricitySettings] = useState<boolean | null>(null);
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
    async function fetchStats() {
      if (!user) return;

      const [printersRes, filamentsRes, printsRes, electricityRes] = await Promise.all([
        supabase.from('printers').select('id', { count: 'exact' }),
        supabase.from('filaments').select('id', { count: 'exact' }),
        supabase.from('prints').select('id', { count: 'exact' }),
        supabase.from('electricity_settings').select('id').limit(1),
      ]);

      setStats({
        printerCount: printersRes.count || 0,
        filamentCount: filamentsRes.count || 0,
        printCount: printsRes.count || 0,
        totalCost: 0,
      });

      setHasElectricitySettings((electricityRes.data?.length || 0) > 0);
      setLoading(false);
    }

    fetchStats();
  }, [user]);

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
        {/* Header */}
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
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Saved Prints</p>
                  <p className="text-2xl font-bold">{stats.printCount}</p>
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
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-2xl font-bold">{tierInfo.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
