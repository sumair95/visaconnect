import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Check, Crown, Star, CreditCard, Loader2 } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  is_active: boolean;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string;
  expires_at: string;
  plan: SubscriptionPlan;
}

export const PaymentIntegration: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchUserSubscription();
  }, [user]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch subscription plans",
        variant: "destructive",
      });
      return;
    }

    setPlans(data || []);
  };

  const fetchUserSubscription = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (data) {
      setSubscription(data);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) return;

    setProcessingPayment(planId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          plan_id: planId,
          success_url: `${window.location.origin}/dashboard?tab=payment&success=true`,
          cancel_url: `${window.location.origin}/dashboard?tab=payment&cancelled=true`
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create checkout session",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: { 
          return_url: `${window.location.origin}/dashboard?tab=payment`
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('premium')) return <Crown className="w-5 h-5" />;
    if (planName.toLowerCase().includes('pro')) return <Star className="w-5 h-5" />;
    return <Check className="w-5 h-5" />;
  };

  const isCurrentPlan = (planId: string) => {
    return subscription?.plan_id === planId;
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {subscription && (
        <Card className="bg-gradient-to-r from-success/10 to-primary/10 border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-success" />
              Active Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{subscription.plan.name}</h3>
                <p className="text-muted-foreground">
                  Expires on {new Date(subscription.expires_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="default" className="bg-success">Active</Badge>
                <Button variant="outline" onClick={handleManageSubscription} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Manage Subscription'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative hover:shadow-lg transition-all duration-300 ${
                isCurrentPlan(plan.id) ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
            >
              {isCurrentPlan(plan.id) && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={processingPayment === plan.id || isCurrentPlan(plan.id)}
                  variant={isCurrentPlan(plan.id) ? "outline" : "default"}
                >
                  {processingPayment === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : isCurrentPlan(plan.id) ? (
                    'Current Plan'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Subscribe Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Free Plan Features */}
      {!subscription && (
        <Card>
          <CardHeader>
            <CardTitle>Current: Free Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-muted-foreground mb-4">
                You're currently on the free plan with limited features:
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Basic visa information</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Profile completion</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  <span>Document upload (limited)</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Upgrade to unlock AI-powered assessments, detailed recommendations, and priority support.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};