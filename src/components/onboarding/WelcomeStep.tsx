import { Button } from '@/components/ui/button';
import { Printer, Package, Zap, Calculator } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 rounded-2xl gradient-hero flex items-center justify-center mb-4 animate-float">
        <Calculator className="w-10 h-10 text-white" />
      </div>
      
      <div>
        <h1 className="font-display text-3xl font-bold text-gradient mb-2">
          Welcome to Dr3amToReal!
        </h1>
        <p className="text-muted-foreground text-lg">
          Your 3D printing cost calculator
        </p>
      </div>

      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Let's get you set up in just a few minutes. We'll help you configure your printers, 
        filaments, and electricity costs so you can calculate accurate prices for your prints.
      </p>

      <div className="grid grid-cols-2 gap-4 py-6">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Printer className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium">Printers</p>
          <p className="text-xs text-muted-foreground">Add your 3D printers</p>
        </div>
        <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-sm font-medium">Filaments</p>
          <p className="text-xs text-muted-foreground">Track material costs</p>
        </div>
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <p className="text-sm font-medium">Electricity</p>
          <p className="text-xs text-muted-foreground">Energy costs</p>
        </div>
        <div className="p-4 rounded-xl bg-success/5 border border-success/20">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-2">
            <Calculator className="w-5 h-5 text-success" />
          </div>
          <p className="text-sm font-medium">Calculate</p>
          <p className="text-xs text-muted-foreground">Get accurate prices</p>
        </div>
      </div>

      <Button onClick={onNext} size="lg" className="w-full gradient-primary text-primary-foreground">
        Let's Get Started
      </Button>
    </div>
  );
}
