import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export default function AdminTranslations() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
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

  const filteredTranslations = translations.filter((t) => {
    const matchesSearch = searchQuery === '' || 
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">{t('admin.translations')}</h1>
            <p className="text-muted-foreground">Manage PT/EN translations for the application</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleImportDefaults} disabled={saving}>
              <Upload className="h-4 w-4 mr-2" />
              Import Defaults
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export JSON
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
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search translations..."
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted">
                          {translation.category || '-'}
                        </span>
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
