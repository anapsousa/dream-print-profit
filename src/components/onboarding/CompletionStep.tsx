import { Button } from '@/components/ui/button';
import { Check, Printer, Package, Zap, Receipt, PartyPopper } from 'lucide-react';

interface CompletionStepProps {
  setupData: {
    printerAdded: boolean;
    filamentAdded: boolean;
    electricityAdded: boolean;
    expensesAdded: boolean;
  };
  onComplete: () => void;
}

export function CompletionStep({ setupData, onComplete }: CompletionStepProps) {
  const items = [
    { label: 'Printer', done: setupData.printerAdded, icon: Printer },
    { label: 'Filament', done: setupData.filamentAdded, icon: Package },
    { label: 'Electricity', done: setupData.electricityAdded, icon: Zap },
    { label: 'Expenses', done: setupData.expensesAdded, icon: Receipt },
  ];

  const completedCount = items.filter(i => i.done).length;

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mb-4 animate-float">
        <PartyPopper className="w-10 h-10 text-white" />
      </div>

      <div>
        <h1 className="font-display text-3xl font-bold text-gradient mb-2">
          You're All Set!
        </h1>
        <p className="text-muted-foreground text-lg">
          Welcome to Dr3amToReal
        </p>
      </div>

      <div className="py-6">
        <div className="grid grid-cols-4 gap-3">
          {items.map(item => (
            <div
              key={item.label}
              className={`p-3 rounded-xl border text-center ${
                item.done
                  ? 'border-success/50 bg-success/5'
                  : 'border-border/50 bg-muted/30'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                item.done ? 'bg-success/10' : 'bg-muted'
              }`}>
                {item.done ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <p className={`text-xs ${item.done ? 'text-success font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          {completedCount === 4
            ? 'All configured! You\'re ready to calculate print costs.'
            : `${completedCount}/4 configured. You can complete the rest anytime in Settings.`}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          <strong>Next step:</strong> Go to the Prints page to create your first print calculation!
        </p>
        <Button onClick={onComplete} size="lg" className="w-full gradient-primary text-primary-foreground">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
