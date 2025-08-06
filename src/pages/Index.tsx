import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, FileText, TrendingUp, MapPin, Star, Users } from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-australia-blue/20 via-background to-australia-gold/20">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center space-y-8 max-w-4xl mx-auto">
            <Badge variant="outline" className="mx-auto bg-primary/10 text-primary border-primary/20">
              🇦🇺 Australian Immigration Made Simple
            </Badge>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Your Intelligent Guide to{' '}
              <span className="bg-gradient-to-r from-australia-blue to-australia-gold bg-clip-text text-transparent">
                Australian Immigration
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized visa recommendations, detailed eligibility analysis, and expert guidance 
              powered by real-time data from Australian Home Affairs.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <a href="/auth">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold">Why Choose Aussie Visa Assist?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive visa guidance powered by intelligent analysis and real-time data
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Smart Visa Matching</CardTitle>
                <CardDescription>
                  AI-powered analysis of your profile to recommend the most suitable visa categories based on your skills, experience, and goals.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Real-time Data</CardTitle>
                <CardDescription>
                  Live scraping of Australian Home Affairs website ensures you get the most current visa requirements, fees, and processing times.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Document Guidance</CardTitle>
                <CardDescription>
                  Complete document checklists, skill assessment requirements, and step-by-step guidance for your visa application.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Skills Analysis</CardTitle>
                <CardDescription>
                  Detailed analysis of your skills against Australian job market demands with improvement recommendations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Premium Features</CardTitle>
                <CardDescription>
                  Advanced analytics, personalized roadmaps, priority support, and detailed timeline planning for serious applicants.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Expert Support</CardTitle>
                <CardDescription>
                  Professional immigration guidance and support throughout your visa application journey.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="text-center py-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Ready to Start Your Australian Dream?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of successful applicants who used our platform to navigate their visa journey.
              </p>
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <a href="/auth">
                  Get Started Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Aussie Visa Assist. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
