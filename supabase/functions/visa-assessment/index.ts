
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const deepSeekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { user_id } = await req.json();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError) {
      throw new Error('Failed to fetch user profile');
    }

    // Fetch visa categories
    const { data: visaCategories, error: visaError } = await supabaseClient
      .from('visa_categories')
      .select('*');

    if (visaError) {
      throw new Error('Failed to fetch visa categories');
    }

    // Calculate age
    const age = profile.date_of_birth ? 
      Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    let assessmentResult;

    // Try DeepSeek API if key is available and valid
    if (deepSeekApiKey) {
      // Prepare assessment prompt
      const prompt = `Analyze the following user profile for Australian visa eligibility and provide a detailed assessment:

User Profile:
- Age: ${age} years
- Nationality: ${profile.nationality}
- Education: ${profile.education_level}
- Occupation: ${profile.current_occupation}
- Experience: ${profile.years_of_experience} years
- Preferred State: ${profile.preferred_state}

Available Visa Categories:
${visaCategories.map(visa => `- ${visa.visa_code}: ${visa.visa_name} (${visa.points_required} points required)`).join('\n')}

Please provide:
1. An overall assessment score out of 100
2. The most suitable visa category
3. User's strengths (3-5 points)
4. Areas for improvement (3-5 points)
5. Detailed analysis explaining the recommendation

Format your response as JSON with this structure:
{
  "assessment_score": number,
  "recommended_visa_code": "string",
  "strengths": ["string"],
  "improvement_areas": ["string"],
  "detailed_analysis": "string"
}`;

      try {
        // Call DeepSeek API
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepSeekApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: 'You are an expert Australian immigration consultant. Provide accurate, helpful visa assessments based on current immigration requirements.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3,
          }),
        });

        const aiData = await response.json();
        
        // Check for DeepSeek API errors
        if (aiData.error) {
          console.error('DeepSeek API error:', aiData.error);
          throw new Error(`DeepSeek API error: ${aiData.error.message}`);
        }
        
        // Check if DeepSeek response is valid
        if (!aiData.choices || aiData.choices.length === 0) {
          console.error('Invalid DeepSeek response:', aiData);
          throw new Error('Invalid response from DeepSeek API');
        }
        
        const assessmentText = aiData.choices[0].message.content;

        // Parse AI response
        try {
          assessmentResult = JSON.parse(assessmentText);
        } catch (e) {
          // Fallback if JSON parsing fails
          assessmentResult = {
            assessment_score: 65,
            recommended_visa_code: "189",
            strengths: ["Strong professional background", "Good education level"],
            improvement_areas: ["Consider skills assessment", "Improve English proficiency"],
            detailed_analysis: assessmentText
          };
        }
      } catch (error) {
        console.error('DeepSeek API call failed:', error);
        // Fall back to basic assessment
        assessmentResult = await generateBasicAssessment(profile, age, visaCategories);
      }
    } else {
      // No DeepSeek key available, use basic assessment
      assessmentResult = await generateBasicAssessment(profile, age, visaCategories);
    }

    // Find recommended visa
    const recommendedVisa = visaCategories.find(visa => 
      visa.visa_code === assessmentResult.recommended_visa_code
    );

    // Save assessment to database
    const { data: savedAssessment, error: saveError } = await supabaseClient
      .from('visa_assessments')
      .insert({
        user_id: user_id,
        assessment_score: assessmentResult.assessment_score,
        recommended_visa_id: recommendedVisa?.id || null,
        strengths: assessmentResult.strengths,
        improvement_areas: assessmentResult.improvement_areas,
        detailed_analysis: assessmentResult.detailed_analysis,
        is_premium: false
      })
      .select()
      .single();

    if (saveError) {
      throw new Error('Failed to save assessment');
    }

    return new Response(JSON.stringify({
      success: true,
      assessment: savedAssessment,
      recommended_visa: recommendedVisa
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in visa-assessment function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate assessment' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Basic assessment function when DeepSeek is not available
async function generateBasicAssessment(profile: any, age: number, visaCategories: any[]) {
  let score = 50; // Base score
  
  // Age scoring (based on Australian points system)
  if (age >= 25 && age <= 32) score += 15;
  else if (age >= 33 && age <= 39) score += 10;
  else if (age >= 40 && age <= 44) score += 5;
  
  // Education scoring
  if (profile.education_level === 'PhD' || profile.education_level === 'Masters') score += 15;
  else if (profile.education_level === 'Bachelors') score += 10;
  else if (profile.education_level === 'Diploma') score += 5;
  
  // Experience scoring
  if (profile.years_of_experience >= 8) score += 10;
  else if (profile.years_of_experience >= 5) score += 5;
  else if (profile.years_of_experience >= 3) score += 3;
  
  // Cap at 100
  score = Math.min(score, 100);
  
  const strengths = [];
  const improvements = [];
  
  if (age >= 25 && age <= 32) strengths.push("Optimal age range for visa applications");
  if (profile.education_level === 'PhD' || profile.education_level === 'Masters') strengths.push("High level of education");
  if (profile.years_of_experience >= 5) strengths.push("Substantial work experience");
  if (profile.current_occupation) strengths.push("Clear occupation pathway");
  
  if (age > 44) improvements.push("Consider applying soon as age affects points");
  if (!profile.education_level || profile.education_level === 'High School') improvements.push("Consider higher education qualifications");
  if (profile.years_of_experience < 3) improvements.push("Gain more relevant work experience");
  improvements.push("Complete English proficiency test (IELTS/PTE)");
  improvements.push("Get skills assessment from relevant authority");
  
  // Recommend most suitable visa based on score
  let recommendedVisa = "189"; // Default to Skilled Independent
  if (score >= 80) recommendedVisa = "189";
  else if (score >= 65) recommendedVisa = "190";
  else recommendedVisa = "491";
  
  return {
    assessment_score: score,
    recommended_visa_code: recommendedVisa,
    strengths: strengths.slice(0, 5),
    improvement_areas: improvements.slice(0, 5),
    detailed_analysis: `Based on your profile analysis, you scored ${score}/100 points. This assessment considers your age (${age} years), education level (${profile.education_level}), and work experience (${profile.years_of_experience} years). The recommended visa subclass ${recommendedVisa} aligns with your current profile strength.`
  };
}
