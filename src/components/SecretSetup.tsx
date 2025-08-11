import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Key } from 'lucide-react';

export const SecretSetup: React.FC = () => {
  return (
    <Card className="border-warning">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warning">
          <Key className="w-5 h-5" />
          API Keys Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
          <div>
            <p className="font-medium">Missing API Keys</p>
            <p className="text-sm text-muted-foreground">
              Please configure your OpenAI and Stripe API keys in the Supabase Edge Function Secrets to enable AI assessment and payment features.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};