import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Check, CreditCard, Loader2, FileCheck } from 'lucide-react';

interface AssessmentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  is_active: boolean;
}

interface UserPayment {
  id: string;
  plan_id: string;
  status: string;
  payment_completed_at: string | null;
  plan: AssessmentPlan;
}

export const PaymentIntegration: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plan, setPlan] = useState<AssessmentPlan | null>(null);
  const [payment, setPayment] = useState<UserPayment | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchPlan();
    fetchUserPayment();
  }, [user]);

  const fetchPlan = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch assessment plan",
        variant: "destructive",
      });
      return;
    }

    setPlan(data);
  };

  const fetchUserPayment = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_payments')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .order('payment_completed_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setPayment(data);
    }
  };

  const handlePurchaseAssessment = async () => {
    if (!user || !plan) return;

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { 
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
        description: error.message || "Failed to create payment session",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const hasPaid = () => {
    return payment && payment.status === 'paid';
  };

  return (
    <div className="space-y-6">
      {/* Payment Status */}
      {hasPaid() && (
        <Card className="bg-gradient-to-r from-success/10 to-primary/10 border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-success" />
              Assessment Purchased
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Visa Assessment Complete</h3>
                <p className="text-muted-foreground">
                  Purchased on {payment?.payment_completed_at ? new Date(payment.payment_completed_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <Badge variant="default" className="bg-success">Paid</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assessment Purchase */}
      {!hasPaid() && plan && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Visa Assessment</h2>
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                <FileCheck className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-primary">
                ${plan.price}
                <span className="text-sm font-normal text-muted-foreground"> one-time</span>
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
                onClick={handlePurchaseAssessment}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase Assessment for ${plan.price}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Free Plan Features */}
      {!hasPaid() && (
        <Card>
          <CardHeader>
            <CardTitle>Current: Free Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-muted-foreground mb-4">
                You currently have access to basic features:
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
                  <span>Document upload</span>
                </li>
              </ul>
              <p className="text-sm text-muted-foreground mt-4">
                Purchase the AI-powered assessment to get personalized visa recommendations and detailed guidance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};