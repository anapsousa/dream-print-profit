import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import { Logo } from '@/components/Logo';
import { LanguageSwitcherCompact } from '@/components/LanguageSwitcher';
import { Check, Loader2, ArrowLeft } from 'lucide-react';

export default function Pricing() {
  const { user, subscription } = useAuth();
  const { t } = useLanguage();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const tiers = [
    {
      key: 'free' as const,
      name: t('pricing.tier.free.name'),
      price: 0,
      description: t('pricing.tier.free.description'),
      features: [
        t('pricing.tier.free.feature1'),
        t('pricing.tier.free.feature2'),
        t('pricing.tier.free.feature3'),
        t('pricing.tier.free.feature4'),
      ],
      cta: t('pricing.currentPlan'),
      highlighted: false,
    },
    {
      key: 'standard' as const,
      name: t('pricing.tier.standard.name'),
      price: 5,
      description: t('pricing.tier.standard.description'),
      features: [
        t('pricing.tier.standard.feature1'),
        t('pricing.tier.standard.feature2'),
        t('pricing.tier.standard.feature3'),
        t('pricing.tier.standard.feature4'),
      ],
      cta: t('pricing.upgradeToStandard'),
      highlighted: true,
    },
    {
      key: 'pro' as const,
      name: t('pricing.tier.pro.name'),
      price: 10,
      description: t('pricing.tier.pro.description'),
      features: [
        t('pricing.tier.pro.feature1'),
        t('pricing.tier.pro.feature2'),
        t('pricing.tier.pro.feature3'),
        t('pricing.tier.pro.feature4'),
      ],
      cta: t('pricing.upgradeToPro'),
      highlighted: false,
    },
  ];

  useEffect(() => {
    if (searchParams.get('subscription') === 'canceled') {
      toast({
        title: t('pricing.checkoutCanceled'),
        description: t('pricing.noCharges'),
      });
    }
  }, [searchParams, toast, t]);

  async function handleUpgrade(tierKey: 'standard' | 'pro') {
    if (!user) {
      navigate('/auth');
      return;
    }

    const tier = SUBSCRIPTION_TIERS[tierKey];
    if (!tier.priceId) return;

    setLoadingTier(tierKey);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: tier.priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: t('error.generic'),
        description: t('pricing.couldNotStart'),
      });
    }

    setLoadingTier(null);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <header className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <Logo size="md" />
        <LanguageSwitcherCompact />
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        {user && (
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              {t('nav.backToDashboard')}
            </Link>
          </Button>
        )}

        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {t('pricing.title')} <span className="text-gradient">{t('pricing.titleHighlight')}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {tiers.map((tier) => {
            const isCurrentPlan = subscription.tier === tier.key;
            const canUpgrade = tier.key !== 'free' && !isCurrentPlan;

            return (
              <Card
                key={tier.key}
                className={`relative shadow-card border-border/50 ${
                  tier.highlighted ? 'border-2 border-primary shadow-soft' : ''
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-xs font-semibold gradient-primary text-primary-foreground">
                      {t('pricing.mostPopular')}
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="font-display text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">€{tier.price}</span>
                    {tier.price > 0 && <span className="text-muted-foreground">{t('pricing.perMonth')}</span>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-success" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {tier.key === 'free' ? (
                    <Button
                      variant={isCurrentPlan ? 'outline' : 'ghost'}
                      className="w-full"
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? t('pricing.currentPlan') : t('pricing.freeForever')}
                    </Button>
                  ) : (
                    <Button
                      variant={tier.highlighted ? 'gradient' : 'default'}
                      className="w-full"
                      onClick={() => handleUpgrade(tier.key as 'standard' | 'pro')}
                      disabled={isCurrentPlan || loadingTier === tier.key}
                    >
                      {loadingTier === tier.key && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isCurrentPlan ? t('pricing.currentPlan') : tier.cta}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            {t('common.questions')} {t('common.contactUs')}{' '}
            <a href="mailto:support@dr3amtoreal.com" className="text-primary hover:underline">
              support@dr3amtoreal.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
