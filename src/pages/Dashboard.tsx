import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { DocumentUpload } from '@/components/DocumentUpload';
import { ProfileCompletion } from '@/components/ProfileCompletion';
import { VisaAssessment } from '@/components/VisaAssessment';
import { PaymentIntegration } from '@/components/PaymentIntegration';
import { VisaRequirementsModal } from '@/components/VisaRequirementsModal';
import { 
  GraduationCap, 
  MapPin, 
  TrendingUp,
  Star,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  LogOut,
  Zap
} from 'lucide-react';

interface VisaCategory {
  id: string;
  visa_code: string;
  visa_name: string;
  description: string;
  minimum_requirements: any;
  required_documents: string[];
  processing_time: string;
  application_fee: number;
  skill_assessment_required: boolean;
  skill_assessment_authority: string;
  skill_assessment_fee: number;
  points_required: number;
  age_limit: number;
  english_requirement: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  nationality: string;
  education_level: string;
  years_of_experience: number;
  current_occupation: string;
  preferred_state: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [visaCategories, setVisaCategories] = useState<VisaCategory[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVisa, setSelectedVisa] = useState<VisaCategory | null>(null);
  const [requirementsModalOpen, setRequirementsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch visa categories
      const { data: visas, error: visaError } = await supabase
        .from('visa_categories')
        .select('*')
        .order('visa_code');

      if (visaError) throw visaError;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      setVisaCategories(visas || []);
      setUserProfile(profile);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewRequirements = (visa: VisaCategory) => {
    setSelectedVisa(visa);
    setRequirementsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-australia-blue to-australia-gold rounded-lg"></div>
            <h1 className="text-xl font-bold">Aussie Visa Assist</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {userProfile?.first_name || user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="assessment" className="text-xs sm:text-sm">Assessment</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="payment" className="text-xs sm:text-sm">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  Get Started with Your Visa Journey
                </CardTitle>
                <CardDescription>
                  Complete your profile and upload documents to get personalized visa recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1" onClick={() => setActiveTab('assessment')}>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Complete Profile Assessment
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setActiveTab('documents')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Visa Categories Grid */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Available Visa Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visaCategories.map((visa) => (
                  <Card key={visa.id} className="hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Badge variant="outline" className="font-mono">
                          {visa.visa_code}
                        </Badge>
                        <Badge variant="secondary">
                          {visa.points_required} points
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{visa.visa_name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {visa.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{visa.processing_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span>AUD ${visa.application_fee}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span>{visa.english_requirement}</span>
                        </div>
                      </div>
                      
                      {visa.skill_assessment_required && (
                        <Badge variant="outline" className="bg-warning/10 text-warning-foreground">
                          <Zap className="w-3 h-3 mr-1" />
                          Skills Assessment Required
                        </Badge>
                      )}
                      
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => handleViewRequirements(visa)}
                      >
                        View Requirements
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="space-y-6">
            <VisaAssessment />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <ProfileCompletion />
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-6">
            <PaymentIntegration />
          </TabsContent>
        </Tabs>
      </div>

      <VisaRequirementsModal
        visa={selectedVisa}
        open={requirementsModalOpen}
        onOpenChange={setRequirementsModalOpen}
      />
    </div>
  );
};

export default Dashboard;