import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  DollarSign, 
  FileText, 
  GraduationCap, 
  MapPin, 
  Users,
  AlertTriangle,
  CheckCircle,
  ExternalLink
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

interface VisaRequirementsModalProps {
  visa: VisaCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VisaRequirementsModal: React.FC<VisaRequirementsModalProps> = ({
  visa,
  open,
  onOpenChange
}) => {
  if (!visa) return null;

  const getDetailedRequirements = () => {
    const code = visa.visa_code;
    
    // Detailed requirements based on Home Affairs website
    const requirements = {
      '189': {
        title: 'Skilled Independent Visa (Subclass 189)',
        description: 'This visa allows skilled workers to live and work permanently anywhere in Australia. You do not need sponsorship from an employer, family member, or state or territory government.',
        keyRequirements: [
          'Be under 45 years of age when you apply',
          'Have competent English (IELTS 6.0 or equivalent in each band)',
          'Have a suitable skills assessment for your nominated occupation',
          'Nominate an occupation on the relevant skilled occupation list',
          'Score at least 65 points on the points test',
          'Meet health and character requirements'
        ],
        eligibleOccupations: 'Medium and Long-term Strategic Skills List (MLTSSL)',
        pointsTest: 'Minimum 65 points required',
        permanentResidency: true,
        workRights: 'Unrestricted work rights throughout Australia',
        studyRights: 'Enrol in Medicare and study at Australian institutions',
        familyInclusion: 'Include eligible family members in your application',
        pathwayToCitizenship: 'Eligible to apply for Australian citizenship after meeting residency requirements'
      },
      '190': {
        title: 'Skilled Nominated Visa (Subclass 190)',
        description: 'This visa allows skilled workers nominated by a state or territory government to live and work permanently anywhere in Australia.',
        keyRequirements: [
          'Be under 45 years of age when you apply',
          'Have competent English (IELTS 6.0 or equivalent in each band)',
          'Have a suitable skills assessment for your nominated occupation',
          'Be nominated by a state or territory government',
          'Nominate an occupation on the relevant skilled occupation list',
          'Score at least 65 points on the points test (including state nomination)',
          'Meet health and character requirements'
        ],
        eligibleOccupations: 'Medium and Long-term Strategic Skills List (MLTSSL) or Short-term Skilled Occupation List (STSOL)',
        pointsTest: 'Minimum 65 points required (including 5 points for state nomination)',
        permanentResidency: true,
        workRights: 'Unrestricted work rights throughout Australia',
        studyRights: 'Enrol in Medicare and study at Australian institutions',
        familyInclusion: 'Include eligible family members in your application',
        pathwayToCitizenship: 'Eligible to apply for Australian citizenship after meeting residency requirements'
      },
      '491': {
        title: 'Skilled Work Regional (Provisional) Visa (Subclass 491)',
        description: 'This provisional visa allows skilled workers to live, work and study in designated regional areas of Australia for up to 5 years.',
        keyRequirements: [
          'Be under 45 years of age when you apply',
          'Have competent English (IELTS 6.0 or equivalent in each band)',
          'Have a suitable skills assessment for your nominated occupation',
          'Be nominated by a state or territory government or sponsored by an eligible relative',
          'Nominate an occupation on the relevant skilled occupation list',
          'Score at least 65 points on the points test',
          'Meet health and character requirements'
        ],
        eligibleOccupations: 'Medium and Long-term Strategic Skills List (MLTSSL), Short-term Skilled Occupation List (STSOL), or Regional Occupation List (ROL)',
        pointsTest: 'Minimum 65 points required (including 15 points for regional nomination)',
        permanentResidency: false,
        workRights: 'Work and study in designated regional areas only',
        studyRights: 'Study in designated regional areas',
        familyInclusion: 'Include eligible family members in your application',
        pathwayToCitizenship: 'Pathway to permanent residence through subclass 191 visa after 3 years'
      },
      '482': {
        title: 'Temporary Skill Shortage Visa (Subclass 482)',
        description: 'This visa allows skilled workers to come to or remain in Australia to work for an approved sponsor for up to 4 years.',
        keyRequirements: [
          'Have a job offer from an approved Australian employer',
          'Have the skills and qualifications for the job',
          'Have at least 2 years relevant work experience',
          'Meet English language requirements (varies by stream)',
          'Be under 45 years of age (some exceptions apply)',
          'Meet health and character requirements'
        ],
        eligibleOccupations: 'Short-term Skilled Occupation List (STSOL), Medium and Long-term Strategic Skills List (MLTSSL), or Regional Occupation List (ROL)',
        pointsTest: 'Not required',
        permanentResidency: false,
        workRights: 'Work only for sponsoring employer',
        studyRights: 'Limited study rights',
        familyInclusion: 'Include eligible family members in your application',
        pathwayToCitizenship: 'Medium-term stream may lead to permanent residence'
      }
    };

    return requirements[code as keyof typeof requirements] || {
      title: visa.visa_name,
      description: visa.description,
      keyRequirements: [
        'Meet age requirements',
        'Meet English language requirements',
        'Have relevant qualifications and experience',
        'Meet health and character requirements'
      ],
      eligibleOccupations: 'Refer to skilled occupation lists',
      pointsTest: `${visa.points_required} points required`,
      permanentResidency: code === '189' || code === '190',
      workRights: 'As per visa conditions',
      studyRights: 'As per visa conditions',
      familyInclusion: 'Eligible family members may be included',
      pathwayToCitizenship: 'Subject to meeting residency requirements'
    };
  };

  const requirements = getDetailedRequirements();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {requirements.title}
          </DialogTitle>
          <DialogDescription>
            Complete requirements and eligibility criteria as per Department of Home Affairs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{requirements.description}</p>
            </CardContent>
          </Card>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Processing Time</span>
                </div>
                <p className="text-sm text-muted-foreground">{visa.processing_time}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Application Fee</span>
                </div>
                <p className="text-sm text-muted-foreground">AUD ${visa.application_fee?.toLocaleString() || 'TBA'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Residency Status</span>
                </div>
                <Badge variant={requirements.permanentResidency ? "default" : "secondary"}>
                  {requirements.permanentResidency ? "Permanent" : "Temporary"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Key Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                Key Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {requirements.keyRequirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Skills Assessment */}
          {visa.skill_assessment_required && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Skills Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Assessment Authority:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {visa.skill_assessment_authority || 'Varies by occupation'}
                  </p>
                </div>
                <div>
                  <span className="font-semibold">Assessment Fee:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    AUD ${visa.skill_assessment_fee?.toLocaleString() || 'Varies by authority'}
                  </p>
                </div>
                <Badge variant="outline" className="bg-warning/10 text-warning-foreground">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Skills assessment required before application
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Eligible Occupations */}
          <Card>
            <CardHeader>
              <CardTitle>Eligible Occupations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{requirements.eligibleOccupations}</p>
              <Badge variant="outline">
                <ExternalLink className="w-3 h-3 mr-1" />
                View full occupation list on Home Affairs website
              </Badge>
            </CardContent>
          </Card>

          {/* Points Test */}
          <Card>
            <CardHeader>
              <CardTitle>Points Test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{requirements.pointsTest}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Age: Maximum 30 points (25-32 years)</p>
                <p>• English: Maximum 20 points (Superior level)</p>
                <p>• Education: Maximum 20 points (Doctorate degree)</p>
                <p>• Experience: Maximum 20 points (8+ years)</p>
                <p>• State nomination: 5 or 15 points (if applicable)</p>
              </div>
            </CardContent>
          </Card>

          {/* Rights and Obligations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-semibold">Work Rights:</span>
                  <p className="text-sm text-muted-foreground">{requirements.workRights}</p>
                </div>
                <div>
                  <span className="font-semibold">Study Rights:</span>
                  <p className="text-sm text-muted-foreground">{requirements.studyRights}</p>
                </div>
                <div>
                  <span className="font-semibold">Family Inclusion:</span>
                  <p className="text-sm text-muted-foreground">{requirements.familyInclusion}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pathway to Citizenship</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{requirements.pathwayToCitizenship}</p>
                {requirements.permanentResidency && (
                  <Badge variant="default" className="mt-2">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Eligible for citizenship after 4 years
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Documents Required */}
          {visa.required_documents && visa.required_documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Required Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {visa.required_documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm">{doc}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Important Notice</p>
                  <p className="text-sm text-muted-foreground">
                    This information is based on current Department of Home Affairs guidelines. 
                    Requirements may change. Always refer to the official Home Affairs website 
                    for the most up-to-date information before applying.
                  </p>
                  <Badge variant="outline" className="mt-2">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Visit homeaffairs.gov.au
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};