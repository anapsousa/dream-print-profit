import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_TIERS } from '@/lib/constants';
import { Check, Zap, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const tiers = [
  {
    key: 'free' as const,
    name: 'Free',
    price: 0,
    description: 'Get started with basic features',
    features: [
      'Up to 15 saved prints',
      'Unlimited printers & filaments',
      'Cost calculations',
      'Profit margin calculator',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    key: 'standard' as const,
    name: 'Standard',
    price: 5,
    description: 'For hobbyists & small businesses',
    features: [
      'Up to 100 saved prints',
      'Everything in Free',
      'Priority support',
      'Export reports (coming soon)',
    ],
    cta: 'Upgrade to Standard',
    highlighted: true,
  },
  {
    key: 'pro' as const,
    name: 'Pro',
    price: 10,
    description: 'For professional makers',
    features: [
      'Up to 200 saved prints',
      'Everything in Standard',
      'Advanced analytics (coming soon)',
      'API access (coming soon)',
    ],
    cta: 'Upgrade to Pro',
    highlighted: false,
  },
];

export default function Pricing() {
  const { user, subscription } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('subscription') === 'canceled') {
      toast({
        title: 'Checkout canceled',
        description: 'No charges were made. Feel free to try again when ready.',
      });
    }
  }, [searchParams, toast]);

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
        title: 'Error',
        description: 'Could not start checkout process. Please try again.',
      });
    }

    setLoadingTier(null);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Back Button */}
        {user && (
          <Button variant="ghost" asChild className="mb-8">
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        )}

        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-glow mb-6">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Choose Your <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include unlimited printers and filaments.
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
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="font-display text-2xl">{tier.name}</CardTitle>
                  <CardDescription>{tier.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">€{tier.price}</span>
                    {tier.price > 0 && <span className="text-muted-foreground">/month</span>}
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
                      {isCurrentPlan ? 'Current Plan' : 'Free Forever'}
                    </Button>
                  ) : (
                    <Button
                      variant={tier.highlighted ? 'gradient' : 'default'}
                      className="w-full"
                      onClick={() => handleUpgrade(tier.key as 'standard' | 'pro')}
                      disabled={isCurrentPlan || loadingTier === tier.key}
                    >
                      {loadingTier === tier.key && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isCurrentPlan ? 'Current Plan' : tier.cta}
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
            Questions? Contact us at{' '}
            <a href="mailto:support@dr3amtoreal.com" className="text-primary hover:underline">
              support@dr3amtoreal.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
