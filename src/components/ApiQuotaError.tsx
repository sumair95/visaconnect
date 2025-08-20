
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiQuotaErrorProps {
  service: 'OpenAI' | 'Stripe';
  onRetry?: () => void;
}

export const ApiQuotaError: React.FC<ApiQuotaErrorProps> = ({ service, onRetry }) => {
  const getServiceInfo = () => {
    switch (service) {
      case 'OpenAI':
        return {
          title: 'OpenAI API Quota Exceeded',
          description: 'The OpenAI API quota has been exceeded. Please check your OpenAI billing and usage limits.',
          link: 'https://platform.openai.com/account/billing',
          linkText: 'Check OpenAI Billing'
        };
      case 'Stripe':
        return {
          title: 'Stripe Configuration Issue',
          description: 'There\'s an issue with the Stripe configuration. Please check your Stripe API keys.',
          link: 'https://dashboard.stripe.com/apikeys',
          linkText: 'Check Stripe Keys'
        };
      default:
        return {
          title: 'API Service Error',
          description: 'There was an issue with an external service.',
          link: '#',
          linkText: 'Learn More'
        };
    }
  };

  const info = getServiceInfo();

  return (
    <Card className="border-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <AlertTriangle className="w-5 h-5" />
          {info.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">{info.description}</p>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={info.link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              {info.linkText}
            </a>
          </Button>
          {onRetry && (
            <Button onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
