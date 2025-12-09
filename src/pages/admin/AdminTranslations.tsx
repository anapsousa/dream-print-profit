import { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { defaultTranslations } from '@/lib/translations';
import { Plus, Pencil, Trash2, Loader2, Search, Upload, Download } from 'lucide-react';

interface Translation {
  id: string;
  key: string;
  en: string;
  pt: string;
  category: string | null;
}

const CATEGORIES = ['navigation', 'common', 'auth', 'dashboard', 'printers', 'filaments', 'prints', 'settings', 'onboarding', 'admin', 'landing', 'subscription', 'error'];

const CATEGORY_LABELS: Record<string, { en: string; pt: string }> = {
  all: { en: 'All', pt: 'Todos' },
  navigation: { en: 'Navigation', pt: 'Navegação' },
  common: { en: 'Common', pt: 'Comum' },
  auth: { en: 'Auth', pt: 'Autenticação' },
  dashboard: { en: 'Dashboard', pt: 'Painel' },
  printers: { en: 'Printers', pt: 'Impressoras' },
  filaments: { en: 'Filaments', pt: 'Filamentos' },
  prints: { en: 'Prints', pt: 'Impressões' },
  settings: { en: 'Settings', pt: 'Definições' },
  onboarding: { en: 'Onboarding', pt: 'Introdução' },
  admin: { en: 'Admin', pt: 'Admin' },
  landing: { en: 'Landing', pt: 'Página Inicial' },
  subscription: { en: 'Subscription', pt: 'Subscrição' },
  error: { en: 'Errors', pt: 'Erros' },
};

export default function AdminTranslations() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [form, setForm] = useState({
    key: '',
    en: '',
    pt: '',
    category: '',
  });

  const fetchTranslations = async () => {
    const { data, error } = await supabase
      .from('translations')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setTranslations(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTranslations();
  }, []);

  // Count translations by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: translations.length };
    CATEGORIES.forEach(cat => {
      counts[cat] = translations.filter(t => t.category === cat).length;
    });
    return counts;
  }, [translations]);

  const resetForm = () => {
    setForm({ key: '', en: '', pt: '', category: '' });
    setEditingTranslation(null);
  };

  const openEditDialog = (translation: Translation) => {
    setEditingTranslation(translation);
    setForm({
      key: translation.key,
      en: translation.en,
      pt: translation.pt,
      category: translation.category || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.key || !form.en || !form.pt) {
      toast({ variant: 'destructive', title: 'Error', description: 'Key, English, and Portuguese are required' });
      return;
    }

    setSaving(true);
    const translationData = {
      key: form.key,
      en: form.en,
      pt: form.pt,
      category: form.category || null,
    };

    let error;
    if (editingTranslation) {
      const result = await supabase
        .from('translations')
        .update(translationData)
        .eq('id', editingTranslation.id);
      error = result.error;
    } else {
      const result = await supabase.from('translations').insert([translationData]);
      error = result.error;
    }

    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: editingTranslation ? 'Translation updated!' : 'Translation added!' });
      setDialogOpen(false);
      resetForm();
      fetchTranslations();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this translation?')) return;

    const { error } = await supabase.from('translations').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Translation deleted!' });
      fetchTranslations();
    }
  };

  const handleImportDefaults = async () => {
    if (!confirm('This will import all default translations. Existing keys will be skipped. Continue?')) return;

    setSaving(true);
    const toImport = Object.entries(defaultTranslations).map(([key, value]) => ({
      key,
      en: value.en,
      pt: value.pt,
      category: key.split('.')[0],
    }));

    const { error } = await supabase.from('translations').upsert(toImport, { onConflict: 'key' });
    setSaving(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      toast({ title: 'Default translations imported!' });
      fetchTranslations();
    }
  };

  const handleExport = () => {
    const exportData = translations.reduce((acc, t) => {
      acc[t.key] = { en: t.en, pt: t.pt };
      return acc;
    }, {} as Record<string, { en: string; pt: string }>);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredTranslations = useMemo(() => {
    return translations.filter((t) => {
      const matchesSearch = searchQuery === '' || 
        t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.pt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [translations, searchQuery, selectedCategory]);

  const getCategoryLabel = (cat: string) => {
    return CATEGORY_LABELS[cat]?.[language] || cat;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('admin.translations')}</h1>
            <p className="text-muted-foreground">Manage PT/EN translations for the application</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleImportDefaults} disabled={saving}>
              <Upload className="h-4 w-4 mr-2" />
              {t('admin.importDefaults')}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              {t('admin.exportJson')}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin.addTranslation')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingTranslation ? t('admin.editTranslation') : t('admin.addTranslation')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('admin.key')}</Label>
                      <Input
                        value={form.key}
                        onChange={(e) => setForm({ ...form, key: e.target.value })}
                        placeholder="e.g. nav.dashboard"
                        disabled={!!editingTranslation}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('admin.category')}</Label>
                      <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.english')}</Label>
                    <Textarea
                      value={form.en}
                      onChange={(e) => setForm({ ...form, en: e.target.value })}
                      placeholder="English text"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('admin.portuguese')}</Label>
                    <Textarea
                      value={form.pt}
                      onChange={(e) => setForm({ ...form, pt: e.target.value })}
                      placeholder="Portuguese text"
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    {t('common.save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Category Tabs */}
        <ScrollArea className="w-full">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="inline-flex h-auto p-1 gap-1 bg-muted/50">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5"
              >
                <span>{getCategoryLabel('all')}</span>
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {categoryCounts.all}
                </Badge>
              </TabsTrigger>
              {CATEGORIES.map((cat) => (
                <TabsTrigger 
                  key={cat} 
                  value={cat}
                  className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5"
                >
                  <span className="capitalize">{getCategoryLabel(cat)}</span>
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                    {categoryCounts[cat] || 0}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.searchTranslations')}
            className="pl-10"
          />
        </div>

        {/* Results Summary */}
        <div className="text-sm text-muted-foreground">
          {filteredTranslations.length} {filteredTranslations.length === 1 ? 'translation' : 'translations'} found
          {selectedCategory !== 'all' && ` in "${getCategoryLabel(selectedCategory)}"`}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTranslations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {translations.length === 0 ? 'No translations yet. Import defaults to get started.' : t('common.noData')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-48">{t('admin.key')}</TableHead>
                    <TableHead>{t('admin.english')}</TableHead>
                    <TableHead>{t('admin.portuguese')}</TableHead>
                    <TableHead className="w-32">{t('admin.category')}</TableHead>
                    <TableHead className="w-24 text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTranslations.map((translation) => (
                    <TableRow key={translation.id}>
                      <TableCell className="font-mono text-xs">{translation.key}</TableCell>
                      <TableCell className="max-w-xs truncate">{translation.en}</TableCell>
                      <TableCell className="max-w-xs truncate">{translation.pt}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(translation.category || '')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(translation)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(translation.id)}>
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
