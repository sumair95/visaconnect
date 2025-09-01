-- Update subscription plan prices
UPDATE public.subscription_plans 
SET price = 0.00 
WHERE name ILIKE '%basic%' OR name ILIKE '%simple%' OR name ILIKE '%free%';

UPDATE public.subscription_plans 
SET price = 10.00 
WHERE name ILIKE '%premium%' OR name ILIKE '%complete%' OR name ILIKE '%pro%';

-- If no plans exist, insert the basic plans
INSERT INTO public.subscription_plans (name, description, price, features, is_active)
VALUES 
  ('Simple Guidance', 'Basic visa assessment and simple guidance', 0.00, ARRAY['Basic visa assessment', 'Simple guidance', 'Document checklist'], true),
  ('Complete Analysis', 'Detailed assessment with complete analysis and guidance', 10.00, ARRAY['Detailed visa assessment', 'Complete analysis', 'Personalized guidance', 'Document preparation help', 'Priority support'], true)
ON CONFLICT (name) DO UPDATE SET 
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  features = EXCLUDED.features;