-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  nationality TEXT,
  education_level TEXT,
  years_of_experience INTEGER,
  current_occupation TEXT,
  preferred_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create visa categories table
CREATE TABLE public.visa_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_code TEXT NOT NULL UNIQUE,
  visa_name TEXT NOT NULL,
  description TEXT,
  minimum_requirements JSONB,
  required_documents TEXT[],
  processing_time TEXT,
  application_fee DECIMAL(10,2),
  skill_assessment_required BOOLEAN DEFAULT false,
  skill_assessment_authority TEXT,
  skill_assessment_fee DECIMAL(10,2),
  points_required INTEGER,
  age_limit INTEGER,
  english_requirement TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user documents table
CREATE TABLE public.user_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create visa assessments table
CREATE TABLE public.visa_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recommended_visa_id UUID REFERENCES visa_categories(id),
  assessment_score DECIMAL(5,2),
  strengths TEXT[],
  improvement_areas TEXT[],
  detailed_analysis JSONB,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_session_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for visa categories (public read)
CREATE POLICY "Anyone can view visa categories" ON public.visa_categories
  FOR SELECT USING (true);

-- Create RLS policies for user documents
CREATE POLICY "Users can view their own documents" ON public.user_documents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can upload their own documents" ON public.user_documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" ON public.user_documents
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for visa assessments
CREATE POLICY "Users can view their own assessments" ON public.visa_assessments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create assessments" ON public.visa_assessments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create RLS policies for subscription plans (public read)
CREATE POLICY "Anyone can view subscription plans" ON public.subscription_plans
  FOR SELECT USING (true);

-- Create RLS policies for user subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Create storage policies for documents
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some sample visa categories
INSERT INTO public.visa_categories (visa_code, visa_name, description, minimum_requirements, required_documents, processing_time, application_fee, skill_assessment_required, skill_assessment_authority, skill_assessment_fee, points_required, age_limit, english_requirement) VALUES
('189', 'Skilled Independent visa (subclass 189)', 'A permanent residence visa for skilled workers who are not sponsored by an employer, state, or family member.', 
 '{"points_required": 65, "age_limit": 45, "english_requirement": "Competent English", "skills_assessment": "Positive skills assessment"}',
 ARRAY['Skills assessment', 'English language test results', 'Educational qualifications', 'Work experience evidence', 'Health examinations', 'Character documents'],
 '8-11 months', 4640.00, true, 'Various assessing authorities', 500.00, 65, 45, 'Competent English'),

('190', 'Skilled Nominated visa (subclass 190)', 'A permanent residence visa for skilled workers nominated by a state or territory government.',
 '{"points_required": 65, "age_limit": 45, "english_requirement": "Competent English", "skills_assessment": "Positive skills assessment", "nomination": "State/territory nomination"}',
 ARRAY['Skills assessment', 'English language test results', 'Educational qualifications', 'Work experience evidence', 'State nomination', 'Health examinations', 'Character documents'],
 '8-11 months', 4640.00, true, 'Various assessing authorities', 500.00, 65, 45, 'Competent English'),

('491', 'Skilled Work Regional (Provisional) visa (subclass 491)', 'A provisional visa for skilled workers to live and work in regional Australia.',
 '{"points_required": 65, "age_limit": 45, "english_requirement": "Competent English", "skills_assessment": "Positive skills assessment"}',
 ARRAY['Skills assessment', 'English language test results', 'Educational qualifications', 'Work experience evidence', 'State nomination or family sponsorship', 'Health examinations', 'Character documents'],
 '9-12 months', 4640.00, true, 'Various assessing authorities', 500.00, 65, 45, 'Competent English');

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, description, price, features) VALUES
('Basic', 'Basic visa assessment and recommendations', 0.00, ARRAY['Basic visa category matching', 'General requirements overview', 'Document checklist']),
('Premium', 'Detailed analysis and personalized guidance', 49.99, ARRAY['Detailed skills analysis', 'Personalized improvement plan', 'Priority support', 'Document templates', 'Timeline planning', 'Fee calculator']);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visa_categories_updated_at BEFORE UPDATE ON public.visa_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();