import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
    const assessmentText = aiData.choices[0].message.content;

    // Parse AI response
    let assessmentResult;
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