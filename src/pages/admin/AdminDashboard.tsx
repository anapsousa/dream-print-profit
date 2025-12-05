import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Printer, Languages, Users, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPrints: 0,
    totalGlobalPrinters: 0,
    totalTranslations: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [printsRes, globalPrintersRes, translationsRes] = await Promise.all([
        supabase.from('prints').select('id', { count: 'exact', head: true }),
        supabase.from('global_printers').select('id', { count: 'exact', head: true }),
        supabase.from('translations').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: 0, // We can't count auth.users directly
        totalPrints: printsRes.count || 0,
        totalGlobalPrinters: globalPrintersRes.count || 0,
        totalTranslations: translationsRes.count || 0,
      });
    };

    fetchStats();
  }, []);

  const adminCards = [
    {
      title: t('admin.printers'),
      description: 'Manage global printer presets',
      icon: Printer,
      href: '/admin/printers',
      count: stats.totalGlobalPrinters,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: t('admin.translations'),
      description: 'Manage PT/EN translations',
      icon: Languages,
      href: '/admin/translations',
      count: stats.totalTranslations,
      color: 'bg-secondary/10 text-secondary',
    },
    {
      title: t('admin.users'),
      description: 'View user statistics',
      icon: Users,
      href: '/admin/users',
      count: stats.totalPrints,
      countLabel: 'Total Prints',
      color: 'bg-accent/10 text-accent',
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('admin.title')}</h1>
          <p className="text-muted-foreground">Manage application settings and content</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminCards.map((card) => (
            <Link key={card.href} to={card.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.countLabel || card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Global Printers</div>
                <div className="text-2xl font-bold">{stats.totalGlobalPrinters}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Translations</div>
                <div className="text-2xl font-bold">{stats.totalTranslations}</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Total Prints (All Users)</div>
                <div className="text-2xl font-bold">{stats.totalPrints}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
