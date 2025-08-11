import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TrendingUp, Star, AlertCircle, CheckCircle, FileText, Lightbulb } from 'lucide-react';

interface AssessmentResult {
  id: string;
  assessment_score: number;
  recommended_visa_id: string;
  strengths: string[];
  improvement_areas: string[];
  detailed_analysis: any;
  created_at: string;
  is_premium: boolean;
}

interface VisaCategory {
  id: string;
  visa_name: string;
  visa_code: string;
  description: string;
  points_required: number;
}

export const VisaAssessment: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [recommendedVisa, setRecommendedVisa] = useState<VisaCategory | null>(null);
  const [profileComplete, setProfileComplete] = useState(false);

  useEffect(() => {
    checkProfileCompleteness();
    fetchLatestAssessment();
  }, [user]);

  const checkProfileCompleteness = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'nationality', 'current_occupation', 'education_level'];
      const completed = requiredFields.every(field => data[field]);
      setProfileComplete(completed);
    }
  };

  const fetchLatestAssessment = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('visa_assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setAssessmentResult(data);
      
      if (data.recommended_visa_id) {
        const { data: visaData } = await supabase
          .from('visa_categories')
          .select('*')
          .eq('id', data.recommended_visa_id)
          .single();
        
        if (visaData) {
          setRecommendedVisa(visaData);
        }
      }
    }
  };

  const runAssessment = async () => {
    if (!user || !profileComplete) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('visa-assessment', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      toast({
        title: "Assessment Complete",
        description: "Your visa assessment has been generated successfully!",
      });

      fetchLatestAssessment();
    } catch (error: any) {
      toast({
        title: "Assessment Failed",
        description: error.message || "Failed to generate assessment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (!profileComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Complete Your Profile First
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Profile Incomplete</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Please complete your profile information before running a visa assessment. 
            We need your personal details, education, and work experience.
          </p>
          <Button variant="outline">Complete Profile</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assessment Header */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            AI-Powered Visa Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <p className="text-muted-foreground mb-2">
                Get personalized visa recommendations based on your profile and Australian immigration requirements.
              </p>
              {assessmentResult && (
                <p className="text-sm text-muted-foreground">
                  Last assessment: {new Date(assessmentResult.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button 
              onClick={runAssessment} 
              disabled={loading}
              className="whitespace-nowrap"
            >
              {loading ? 'Analyzing...' : 'Run New Assessment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Results */}
      {assessmentResult && (
        <>
          {/* Score Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                Assessment Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(assessmentResult.assessment_score)}`}>
                    {assessmentResult.assessment_score}/100
                  </div>
                  <Badge variant={getScoreBadgeVariant(assessmentResult.assessment_score)} className="mt-2">
                    {assessmentResult.assessment_score >= 80 ? 'Excellent' : 
                     assessmentResult.assessment_score >= 60 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Eligibility</span>
                      <span>{assessmentResult.assessment_score}%</span>
                    </div>
                    <Progress value={assessmentResult.assessment_score} className="h-3" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommended Visa */}
          {recommendedVisa && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Recommended Visa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{recommendedVisa.visa_name}</h3>
                      <Badge variant="outline" className="font-mono mt-1">
                        {recommendedVisa.visa_code}
                      </Badge>
                    </div>
                    <Badge variant="secondary">
                      {recommendedVisa.points_required} points required
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{recommendedVisa.description}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          {assessmentResult.strengths && assessmentResult.strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle className="w-5 h-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {assessmentResult.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Improvement Areas */}
          {assessmentResult.improvement_areas && assessmentResult.improvement_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <Lightbulb className="w-5 h-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {assessmentResult.improvement_areas.map((area, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Detailed Analysis */}
          {assessmentResult.detailed_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detailed Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  {typeof assessmentResult.detailed_analysis === 'string' ? (
                    <p>{assessmentResult.detailed_analysis}</p>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm">
                      {JSON.stringify(assessmentResult.detailed_analysis, null, 2)}
                    </pre>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* No Assessment Yet */}
      {!assessmentResult && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assessment Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Run your first visa assessment to get personalized recommendations based on your profile.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};