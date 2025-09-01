-- Change from subscription model to one-time payment model
-- First, remove existing user subscriptions to avoid foreign key conflicts
DELETE FROM public.user_subscriptions;

-- Clear existing subscription plans
DELETE FROM public.subscription_plans;

-- Insert single one-time payment option for $7
INSERT INTO public.subscription_plans (name, description, price, features, is_active)
VALUES 
  (
    'Visa Assessment', 
    'Complete AI-powered visa assessment with personalized guidance', 
    7.00, 
    ARRAY['AI-powered visa assessment', 'Personalized recommendations', 'Document checklist', 'Eligibility scoring', 'Expert insights'], 
    true
  );

-- Update user_subscriptions table to track one-time payments instead of subscriptions
-- Rename the table to reflect one-time payments
ALTER TABLE public.user_subscriptions RENAME TO user_payments;

-- Remove subscription-specific columns and add payment tracking
ALTER TABLE public.user_payments 
  DROP COLUMN IF EXISTS starts_at,
  DROP COLUMN IF EXISTS expires_at,
  ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Update RLS policies for the renamed table
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.user_payments;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_payments;

CREATE POLICY "Users can create their own payments" ON public.user_payments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own payments" ON public.user_payments
  FOR SELECT
  USING (user_id = auth.uid());