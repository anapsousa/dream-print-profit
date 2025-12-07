import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcher';
import { Zap, Calculator, TrendingUp, DollarSign, Printer, Package, FileText, ArrowRight } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-soft">
          <Zap className="w-6 h-6 text-primary-foreground" />
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-card border-border/50 animate-scale-in">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">{t('landing.welcomeBack')}</h1>
            <p className="text-muted-foreground mb-6">{t('landing.continueToDashboard')}</p>
            <Button asChild size="lg" className="w-full">
              <Link to="/dashboard">
                {t('landing.goToDashboard')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <nav className="relative z-10 max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <LanguageSwitcherCompact />
            <Button variant="ghost" asChild>
              <Link to="/pricing">{t('nav.pricing')}</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">{t('nav.getStarted')}</Link>
            </Button>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-3xl mx-auto animate-slide-up">
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-tight mb-6">
              {t('landing.hero.title1')} <span className="text-gradient">{t('landing.hero.title2')}</span>,{' '}
              <br className="hidden md:block" />
              {t('landing.hero.title3')} <span className="text-gradient">{t('landing.hero.title4')}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="xl" variant="gradient" asChild>
                <Link to="/auth">
                  {t('landing.hero.startFree')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/pricing">{t('landing.hero.viewPricing')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Calculator className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{t('landing.features.accurateCost.title')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.features.accurateCost.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{t('landing.features.profitOptimization.title')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.features.profitOptimization.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{t('landing.features.expenseTracking.title')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.features.expenseTracking.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Printer className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{t('landing.features.multiplePrinters.title')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.features.multiplePrinters.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{t('landing.features.filamentLibrary.title')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.features.filamentLibrary.desc')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-border/50 hover:shadow-soft transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{t('landing.features.printHistory.title')}</h3>
                <p className="text-muted-foreground">
                  {t('landing.features.printHistory.desc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-card border-border/50 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center relative">
              <div className="absolute inset-0 gradient-hero opacity-5" />
              <div className="relative z-10">
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  {t('landing.cta.title')}
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  {t('landing.cta.subtitle')}
                </p>
                <Button size="xl" variant="gradient" asChild>
                  <Link to="/auth">
                    {t('landing.cta.createAccount')}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">Dr3amToReal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dr3amToReal. {t('common.allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}
