-- Update existing visa categories with accurate 2025 fees and information
-- First, update the existing Skilled Independent visa (189)
UPDATE visa_categories 
SET 
  application_fee = 4765,
  processing_time = '10 to 12 months',
  english_requirement = 'Competent English (IELTS 6.0 equivalent)',
  minimum_requirements = jsonb_build_object(
    'age_limit', 45,
    'points_test_score', 65,
    'english_competency', 'Competent English minimum',
    'skills_assessment', 'Positive skills assessment required',
    'health_character', 'Meet health and character requirements'
  )
WHERE visa_code = '189';

-- Update Skilled Nominated visa (190) 
UPDATE visa_categories 
SET 
  application_fee = 4765,
  processing_time = '8 to 11 months',
  english_requirement = 'Competent English (IELTS 6.0 equivalent)',
  minimum_requirements = jsonb_build_object(
    'age_limit', 45,
    'points_test_score', 65,
    'english_competency', 'Competent English minimum',
    'skills_assessment', 'Positive skills assessment required',
    'state_nomination', 'Valid state or territory nomination',
    'health_character', 'Meet health and character requirements'
  )
WHERE visa_code = '190';

-- Update Skilled Work Regional visa (491) 
UPDATE visa_categories 
SET 
  application_fee = 4765,
  processing_time = '8 to 11 months',
  english_requirement = 'Competent English (IELTS 6.0 equivalent)',
  minimum_requirements = jsonb_build_object(
    'age_limit', 45,
    'points_test_score', 65,
    'english_competency', 'Competent English minimum',
    'skills_assessment', 'Positive skills assessment required',
    'nomination_sponsorship', 'Valid nomination by state/territory or sponsorship by eligible relative',
    'health_character', 'Meet health and character requirements'
  )
WHERE visa_code = '491';

-- Insert new visa categories requested by user

-- Visitor Visa (subclass 600)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '600', 'Visitor Visa', 
  'For tourism, visiting family and friends, or short-term business activities in Australia',
  200, '15 to 29 days',
  ARRAY['Valid passport', 'Completed application form', 'Passport-style photographs', 'Evidence of funds', 'Travel itinerary', 'Health insurance (if required)', 'Character documents (if required)'],
  false, null, null, null, null,
  'Functional English may be required for some applicants',
  jsonb_build_object(
    'purpose', 'Tourism, family visit, or short-term business',
    'stay_duration', 'Up to 3, 6 or 12 months',
    'genuine_temporary_entrant', 'Must demonstrate genuine intention to visit temporarily',
    'sufficient_funds', 'Evidence of adequate funds for stay',
    'health_character', 'Meet health and character requirements if required'
  )
);

-- Electronic Travel Authority (subclass 601)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '601', 'Electronic Travel Authority (ETA)', 
  'For short-term tourism or business visits to Australia for eligible passport holders',
  20, 'Usually processed immediately',
  ARRAY['Valid passport from eligible country', 'Email address', 'Credit card for payment'],
  false, null, null, null, null, 'No English requirement',
  jsonb_build_object(
    'purpose', 'Tourism or business visitor activities',
    'stay_duration', 'Up to 3 months per visit',
    'passport_eligibility', 'Must hold passport from eligible country',
    'multiple_entry', 'Multiple entries for 12 months from grant date',
    'health_character', 'Meet health and character requirements'
  )
);

-- eVisitor (subclass 651)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '651', 'eVisitor Visa', 
  'Free visa for tourism or business visits for citizens of eligible European countries',
  0, 'Usually processed immediately',
  ARRAY['Valid passport from eligible European country', 'Email address'],
  false, null, null, null, null, 'No English requirement',
  jsonb_build_object(
    'purpose', 'Tourism or business visitor activities',
    'stay_duration', 'Up to 3 months per visit',
    'passport_eligibility', 'Must hold passport from eligible European country',
    'multiple_entry', 'Multiple entries for 12 months from grant date',
    'health_character', 'Meet health and character requirements'
  )
);

-- Student Visa (subclass 500)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '500', 'Student Visa', 
  'For international students to study full-time in Australia at a registered education provider',
  2000, '4 to 12 weeks',
  ARRAY['Confirmation of Enrolment (CoE)', 'Valid passport', 'Academic transcripts', 'English proficiency test results', 'Financial evidence', 'Health insurance (OSHC)', 'Character documents', 'Statement of purpose'],
  false, null, null, null, null,
  'IELTS 5.5 overall (or equivalent) minimum, higher for some courses',
  jsonb_build_object(
    'education_provider', 'Must be enrolled with registered education provider',
    'course_level', 'Full-time study in eligible course',
    'financial_capacity', 'Evidence of sufficient funds for tuition, living costs',
    'english_proficiency', 'Meet English language requirements for chosen course',
    'health_insurance', 'Overseas Student Health Cover (OSHC) required',
    'genuine_student', 'Demonstrate genuine intention to study',
    'health_character', 'Meet health and character requirements'
  )
);

-- Skills in Demand Visa (subclass 482) - replaces TSS
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '482', 'Skills in Demand Visa', 
  'For skilled workers to work in Australia temporarily when sponsored by an approved employer',
  3210, '2 to 5 months',
  ARRAY['Job offer from approved sponsor', 'Skills assessment (if required)', 'English test results', 'Qualifications', 'Work experience evidence', 'Character documents', 'Health examination results'],
  true, 'Varies by occupation', 1000, null, null,
  'IELTS 5.0 overall minimum (higher for some occupations)',
  jsonb_build_object(
    'employer_sponsorship', 'Must have job offer from approved Australian employer',
    'occupation_eligibility', 'Occupation must be on relevant skilled occupation list',
    'work_experience', 'At least 2 years relevant work experience',
    'skills_assessment', 'Positive skills assessment may be required',
    'english_competency', 'Meet English language requirements for occupation',
    'health_character', 'Meet health and character requirements'
  )
);

-- Partner Visa Offshore (subclass 309/100)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '309/100', 'Partner Visa (Offshore)', 
  'For partners of Australian citizens, permanent residents or eligible New Zealand citizens who are outside Australia',
  9365, '12 to 20 months for temporary, additional 12-18 months for permanent',
  ARRAY['Relationship evidence', 'Identity documents', 'Character documents', 'Health examinations', 'Partner sponsorship application', 'Financial documents', 'Photos and correspondence'],
  false, null, null, null, null, 'Functional English may be required',
  jsonb_build_object(
    'relationship_requirement', 'Genuine and continuing relationship with eligible partner',
    'partner_eligibility', 'Partner must be Australian citizen, permanent resident, or eligible NZ citizen',
    'relationship_duration', 'Usually 12+ months living together or married',
    'sponsorship', 'Partner must sponsor the application',
    'health_character', 'Meet health and character requirements',
    'two_stage_process', 'Temporary visa first, then permanent after 2 years'
  )
);

-- Partner Visa Onshore (subclass 820/801)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '820/801', 'Partner Visa (Onshore)', 
  'For partners of Australian citizens, permanent residents or eligible New Zealand citizens who are in Australia',
  9365, '12 to 24 months for temporary, additional 12-24 months for permanent',
  ARRAY['Relationship evidence', 'Identity documents', 'Character documents', 'Health examinations', 'Partner sponsorship application', 'Financial documents', 'Photos and correspondence'],
  false, null, null, null, null, 'Functional English may be required',
  jsonb_build_object(
    'relationship_requirement', 'Genuine and continuing relationship with eligible partner',
    'partner_eligibility', 'Partner must be Australian citizen, permanent resident, or eligible NZ citizen',
    'relationship_duration', 'Usually 12+ months living together or married',
    'sponsorship', 'Partner must sponsor the application',
    'health_character', 'Meet health and character requirements',
    'two_stage_process', 'Temporary visa first, then permanent after 2 years'
  )
);

-- Prospective Marriage Visa (subclass 300)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '300', 'Prospective Marriage Visa', 
  'For people who want to come to Australia to marry their Australian citizen, permanent resident or eligible New Zealand citizen partner',
  9365, '12 to 18 months',
  ARRAY['Evidence of relationship', 'Intention to marry documents', 'Identity documents', 'Character documents', 'Health examinations', 'Sponsor application', 'Meeting in person evidence'],
  false, null, null, null, null, 'Functional English may be required',
  jsonb_build_object(
    'marriage_intention', 'Genuine intention to marry eligible partner',
    'partner_eligibility', 'Partner must be Australian citizen, permanent resident, or eligible NZ citizen',
    'meeting_requirement', 'Must have met partner in person',
    'marriage_timeline', 'Must marry within 9 months of visa grant',
    'sponsorship', 'Partner must sponsor the application',
    'health_character', 'Meet health and character requirements'
  )
);

-- Training Visa (subclass 407)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '407', 'Training Visa', 
  'For people who want to participate in occupational training, professional development, or workplace-based training in Australia',
  395, '3 to 6 months',
  ARRAY['Training agreement', 'Sponsorship documents', 'Qualifications', 'English test results', 'Character documents', 'Health examination results', 'Insurance evidence'],
  false, null, null, null, null, 'Functional English minimum',
  jsonb_build_object(
    'training_program', 'Must have structured training program with approved sponsor',
    'sponsor_approval', 'Training organization must be approved sponsor',
    'training_relevance', 'Training must be relevant to your field or area of tertiary study',
    'duration', 'Usually up to 2 years depending on training type',
    'english_competency', 'Meet English language requirements',
    'health_character', 'Meet health and character requirements'
  )
);

-- Temporary Graduate Visa (subclass 485)
INSERT INTO visa_categories (
  visa_code, visa_name, description, application_fee, processing_time,
  required_documents, skill_assessment_required, skill_assessment_authority,
  skill_assessment_fee, points_required, age_limit, english_requirement,
  minimum_requirements
) VALUES (
  '485', 'Temporary Graduate Visa', 
  'For international students who have recently graduated from an Australian education institution',
  2300, '4 to 7 months',
  ARRAY['Australian qualification', 'English test results', 'Health insurance', 'Character documents', 'Health examination results', 'Skills assessment (for some streams)'],
  false, 'Varies by stream and occupation', 500, null, 50,
  'IELTS 6.0 overall (or equivalent)',
  jsonb_build_object(
    'recent_graduate', 'Must have recently completed eligible Australian qualification',
    'study_requirements', 'Must have studied for at least 2 years in Australia',
    'english_competency', 'Competent English required',
    'age_limit', 'Must be under 50 years old',
    'study_location', 'Must have studied in Australia on student visa',
    'health_character', 'Meet health and character requirements'
  )
);