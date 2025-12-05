import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Receipt, ArrowLeft, ArrowRight, Loader2, Check, Plus, X } from 'lucide-react';

interface ExpensesStepProps {
  onNext: () => void;
  onBack: () => void;
  onExpensesAdded: () => void;
}

interface Expense {
  name: string;
  amount: string;
}

const SUGGESTED_EXPENSES = [
  { name: 'Rent/Space', amount: '50' },
  { name: 'Internet', amount: '30' },
  { name: 'Software Subscriptions', amount: '15' },
  { name: 'Insurance', amount: '20' },
];

export function ExpensesStep({ onNext, onBack, onExpensesAdded }: ExpensesStepProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const addExpense = (expense?: Expense) => {
    setExpenses([...expenses, expense || { name: '', amount: '' }]);
  };

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  const updateExpense = (index: number, field: keyof Expense, value: string) => {
    const updated = [...expenses];
    updated[index][field] = value;
    setExpenses(updated);
  };

  const handleSave = async () => {
    if (!user || expenses.length === 0) return;
    const validExpenses = expenses.filter(e => e.name && e.amount);
    if (validExpenses.length === 0) return;

    setSaving(true);
    const { error } = await supabase.from('fixed_expenses').insert(
      validExpenses.map(e => ({
        user_id: user.id,
        name: e.name,
        monthly_amount: parseFloat(e.amount) || 0,
        is_active: true,
      }))
    );

    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setAdded(true);
      onExpensesAdded();
      toast({ title: `${validExpenses.length} expense(s) added!` });
    }
  };

  const totalMonthly = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="font-display text-2xl font-bold">Fixed Monthly Expenses</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Do you have recurring business costs? (optional)
        </p>
      </div>

      {added ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <p className="font-medium text-success">Expenses added successfully!</p>
          <p className="text-sm text-muted-foreground mt-1">You can manage these in Settings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Suggested expenses */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Quick add suggestions</Label>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_EXPENSES.map(suggestion => (
                <button
                  key={suggestion.name}
                  type="button"
                  onClick={() => addExpense(suggestion)}
                  className="px-3 py-1.5 text-xs rounded-full border border-border/50 bg-card hover:bg-muted transition-colors"
                >
                  + {suggestion.name} (€{suggestion.amount}/mo)
                </button>
              ))}
            </div>
          </div>

          {/* Expense list */}
          <div className="space-y-3 pt-4 border-t border-border/50">
            {expenses.map((expense, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    value={expense.name}
                    onChange={e => updateExpense(index, 'name', e.target.value)}
                    placeholder="Expense name"
                    className="mb-2"
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    value={expense.amount}
                    onChange={e => updateExpense(index, 'amount', e.target.value)}
                    placeholder="€/month"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExpense(index)}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={() => addExpense()} className="w-full">
              <Plus className="w-4 h-4 mr-2" />Add Expense
            </Button>

            {expenses.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total monthly:</span>
                  <span className="font-semibold">€{totalMonthly.toFixed(2)}</span>
                </div>
              </div>
            )}

            {expenses.length > 0 && (
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Expenses'}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back
        </Button>
        <Button onClick={onNext} variant={added || expenses.length === 0 ? 'default' : 'outline'}>
          {added ? 'Continue' : 'Skip for now'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
