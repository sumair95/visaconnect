-- Add marital status and English test score columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN marital_status TEXT,
ADD COLUMN english_test_score NUMERIC;