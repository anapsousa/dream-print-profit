import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { WelcomeStep } from './WelcomeStep';
import { PrinterStep } from './PrinterStep';
import { FilamentStep } from './FilamentStep';
import { ElectricityStep } from './ElectricityStep';
import { ExpensesStep } from './ExpensesStep';
import { CompletionStep } from './CompletionStep';

interface SetupWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'printer', title: 'Printer' },
  { id: 'filament', title: 'Filament' },
  { id: 'electricity', title: 'Electricity' },
  { id: 'expenses', title: 'Expenses' },
  { id: 'complete', title: 'Done!' },
];

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState({
    printerAdded: false,
    filamentAdded: false,
    electricityAdded: false,
    expensesAdded: false,
  });

  const progress = ((currentStep) / (STEPS.length - 1)) * 100;

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateSetupData = (key: keyof typeof setupData, value: boolean) => {
    setSetupData(prev => ({ ...prev, [key]: value }));
  };

  const handleComplete = () => {
    localStorage.setItem('dr3am_onboarding_complete', 'true');
    onComplete();
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />;
      case 'printer':
        return (
          <PrinterStep 
            onNext={nextStep} 
            onBack={prevStep}
            onPrinterAdded={() => updateSetupData('printerAdded', true)}
          />
        );
      case 'filament':
        return (
          <FilamentStep 
            onNext={nextStep} 
            onBack={prevStep}
            onFilamentAdded={() => updateSetupData('filamentAdded', true)}
          />
        );
      case 'electricity':
        return (
          <ElectricityStep 
            onNext={nextStep} 
            onBack={prevStep}
            onElectricityAdded={() => updateSetupData('electricityAdded', true)}
          />
        );
      case 'expenses':
        return (
          <ExpensesStep 
            onNext={nextStep} 
            onBack={prevStep}
            onExpensesAdded={() => updateSetupData('expensesAdded', true)}
          />
        );
      case 'complete':
        return (
          <CompletionStep 
            setupData={setupData}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-2xl shadow-card border-border/50 animate-scale-in">
        <CardContent className="p-0">
          {/* Progress header */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                {STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step content */}
          <div className="p-6">
            {renderStep()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
