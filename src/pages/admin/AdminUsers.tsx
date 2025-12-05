import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Printer, FileText, Palette } from 'lucide-react';

interface UserStats {
  user_id: string;
  print_count: number;
  printer_count: number;
  filament_count: number;
  subscription_plan: string;
}

export default function AdminUsers() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({
    totalPrints: 0,
    totalPrinters: 0,
    totalFilaments: 0,
  });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Fetch prints grouped by user
        const { data: prints } = await supabase
          .from('prints')
          .select('user_id');

        // Fetch printers grouped by user
        const { data: printers } = await supabase
          .from('printers')
          .select('user_id');

        // Fetch filaments grouped by user
        const { data: filaments } = await supabase
          .from('filaments')
          .select('user_id');

        // Fetch subscriptions
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('user_id, plan_type');

        // Aggregate stats by user
        const userMap = new Map<string, UserStats>();

        prints?.forEach((p) => {
          const existing = userMap.get(p.user_id) || { user_id: p.user_id, print_count: 0, printer_count: 0, filament_count: 0, subscription_plan: 'free' };
          existing.print_count++;
          userMap.set(p.user_id, existing);
        });

        printers?.forEach((p) => {
          const existing = userMap.get(p.user_id) || { user_id: p.user_id, print_count: 0, printer_count: 0, filament_count: 0, subscription_plan: 'free' };
          existing.printer_count++;
          userMap.set(p.user_id, existing);
        });

        filaments?.forEach((f) => {
          const existing = userMap.get(f.user_id) || { user_id: f.user_id, print_count: 0, printer_count: 0, filament_count: 0, subscription_plan: 'free' };
          existing.filament_count++;
          userMap.set(f.user_id, existing);
        });

        subscriptions?.forEach((s) => {
          const existing = userMap.get(s.user_id);
          if (existing) {
            existing.subscription_plan = s.plan_type;
          }
        });

        const stats = Array.from(userMap.values());
        setUserStats(stats);

        setTotals({
          totalPrints: prints?.length || 0,
          totalPrinters: printers?.length || 0,
          totalFilaments: filaments?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user statistics' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('admin.users')}</h1>
          <p className="text-muted-foreground">Overview of user activity and statistics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Prints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalPrints}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Printers</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalPrinters}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Filaments</CardTitle>
              <Palette className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalFilaments}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : userStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No user data available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Prints</TableHead>
                    <TableHead className="text-right">Printers</TableHead>
                    <TableHead className="text-right">Filaments</TableHead>
                    <TableHead>Plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userStats.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell className="font-mono text-xs">{user.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-right">{user.print_count}</TableCell>
                      <TableCell className="text-right">{user.printer_count}</TableCell>
                      <TableCell className="text-right">{user.filament_count}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                          user.subscription_plan === 'pro' ? 'bg-primary/10 text-primary' :
                          user.subscription_plan === 'standard' ? 'bg-secondary/10 text-secondary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {user.subscription_plan}
                        </span>
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
