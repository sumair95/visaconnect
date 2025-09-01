-- Clear existing subscription plans and insert new ones with correct pricing
DELETE FROM public.subscription_plans;

-- Insert the two subscription plans with the requested pricing
INSERT INTO public.subscription_plans (name, description, price, features, is_active)
VALUES 
  (
    'Simple Guidance', 
    'Basic visa assessment and simple guidance', 
    0.00, 
    ARRAY['Basic visa assessment', 'Simple guidance', 'Document checklist', 'Basic eligibility check'], 
    true
  ),
  (
    'Complete Analysis', 
    'Detailed assessment with complete analysis and guidance', 
    10.00, 
    ARRAY['Detailed visa assessment', 'Complete analysis with AI insights', 'Personalized guidance', 'Document preparation help', 'Priority support', 'Comprehensive scoring'], 
    true
  );