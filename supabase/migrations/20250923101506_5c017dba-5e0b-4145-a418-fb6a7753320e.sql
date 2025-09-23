-- Create security definer function for safe user authentication
CREATE OR REPLACE FUNCTION public.get_authenticated_user_id()
RETURNS UUID AS $$
  SELECT COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop existing policies on user_payments
DROP POLICY IF EXISTS "Users can create their own payments" ON public.user_payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.user_payments;

-- Create enhanced RLS policies for user_payments with stricter security
CREATE POLICY "Authenticated users can create their own payments" 
ON public.user_payments 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = public.get_authenticated_user_id() AND 
  public.get_authenticated_user_id() != '00000000-0000-0000-0000-000000000000'::uuid
);

CREATE POLICY "Authenticated users can view their own payments" 
ON public.user_payments 
FOR SELECT 
TO authenticated
USING (
  user_id = public.get_authenticated_user_id() AND 
  public.get_authenticated_user_id() != '00000000-0000-0000-0000-000000000000'::uuid
);

-- Add constraint to ensure user_id cannot be null (defensive measure)
ALTER TABLE public.user_payments 
ALTER COLUMN user_id SET NOT NULL;

-- Add constraint to ensure user_id references a valid auth user indirectly
-- through profiles table (since we can't reference auth.users directly)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_payments_user_id_fkey' 
    AND table_name = 'user_payments'
  ) THEN
    ALTER TABLE public.user_payments 
    ADD CONSTRAINT user_payments_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id);
  END IF;
END $$;