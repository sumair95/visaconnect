
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
  let score = 0; // Start from 0 for more accurate scoring
  let pointsBreakdown = {
    age: 0,
    education: 0,
    experience: 0,
    english: 0,
    additional: 0
  };
  
  // Age scoring (Australian immigration points system)
  if (age >= 18 && age <= 24) {
    pointsBreakdown.age = 25;
    score += 25;
  } else if (age >= 25 && age <= 32) {
    pointsBreakdown.age = 30;
    score += 30;
  } else if (age >= 33 && age <= 39) {
    pointsBreakdown.age = 25;
    score += 25;
  } else if (age >= 40 && age <= 44) {
    pointsBreakdown.age = 15;
    score += 15;
  } else if (age >= 45) {
    pointsBreakdown.age = 0;
    score += 0;
  }
  
  // Education scoring (Australian points system)
  const educationLevel = profile.education_level?.toLowerCase() || '';
  if (educationLevel.includes('phd') || educationLevel.includes('doctorate')) {
    pointsBreakdown.education = 20;
    score += 20;
  } else if (educationLevel.includes('masters') || educationLevel.includes('master')) {
    pointsBreakdown.education = 15;
    score += 15;
  } else if (educationLevel.includes('bachelors') || educationLevel.includes('bachelor')) {
    pointsBreakdown.education = 15;
    score += 15;
  } else if (educationLevel.includes('diploma') || educationLevel.includes('advanced diploma')) {
    pointsBreakdown.education = 10;
    score += 10;
  } else if (educationLevel.includes('certificate') || educationLevel.includes('trade')) {
    pointsBreakdown.education = 10;
    score += 10;
  }
  
  // Work experience scoring (Australian points system)
  const experience = profile.years_of_experience || 0;
  if (experience >= 8) {
    pointsBreakdown.experience = 15;
    score += 15;
  } else if (experience >= 5) {
    pointsBreakdown.experience = 10;
    score += 10;
  } else if (experience >= 3) {
    pointsBreakdown.experience = 5;
    score += 5;
  }
  
  // English proficiency (assumed competent level for basic assessment)
  pointsBreakdown.english = 10; // Assume competent English
  score += 10;
  
  // Additional factors
  if (profile.preferred_state && profile.preferred_state !== 'Any') {
    pointsBreakdown.additional += 5; // State nomination potential
    score += 5;
  }
  
  // Professional year bonus (if applicable)
  if (profile.current_occupation && 
      (profile.current_occupation.toLowerCase().includes('engineer') || 
       profile.current_occupation.toLowerCase().includes('accountant') || 
       profile.current_occupation.toLowerCase().includes('it') ||
       profile.current_occupation.toLowerCase().includes('computer'))) {
    pointsBreakdown.additional += 5;
    score += 5;
  }
  
  const strengths = [];
  const improvements = [];
  
  // Dynamic strengths based on actual scoring
  if (pointsBreakdown.age >= 25) strengths.push(`Excellent age range (${age} years) - ${pointsBreakdown.age} points`);
  if (pointsBreakdown.education >= 15) strengths.push(`Strong educational qualifications - ${pointsBreakdown.education} points`);
  if (pointsBreakdown.experience >= 10) strengths.push(`Substantial work experience (${experience} years) - ${pointsBreakdown.experience} points`);
  if (profile.current_occupation) strengths.push("Clear occupation pathway for skills assessment");
  if (score >= 65) strengths.push("Meets minimum points threshold for skilled migration");
  
  // Dynamic improvements based on scoring gaps
  if (pointsBreakdown.age < 15) improvements.push("Age affects points - consider applying sooner");
  if (pointsBreakdown.education < 15) improvements.push("Higher qualifications could improve your score significantly");
  if (pointsBreakdown.experience < 10) improvements.push("More work experience would boost your points");
  if (!profile.preferred_state || profile.preferred_state === 'Any') {
    improvements.push("Consider state nomination for additional 5-15 points");
  }
  
  // Always include these standard improvements
  improvements.push("Achieve superior English (8.0+ IELTS) for maximum 20 points");
  improvements.push("Complete skills assessment from relevant assessing authority");
  if (score < 80) improvements.push("Consider Professional Year program for additional points");
  
  // Recommend visa based on actual points score
  let recommendedVisa = "491"; // Regional visa as fallback
  if (score >= 85) {
    recommendedVisa = "189"; // Skilled Independent
  } else if (score >= 70) {
    recommendedVisa = "190"; // State Nominated
  } else if (score >= 55) {
    recommendedVisa = "491"; // Regional
  } else {
    recommendedVisa = "482"; // Temporary Skills Shortage
  }
  
  // Generate detailed analysis
  const analysis = {
    summary: `Based on your profile, you scored ${score} points out of 100. This assessment follows the Australian immigration points system.`,
    breakdown: pointsBreakdown,
    recommendation: `With ${score} points, visa subclass ${recommendedVisa} appears most suitable for your profile.`,
    nextSteps: score >= 65 ? 
      "You meet the minimum points requirement. Focus on skills assessment and English test preparation." :
      "You're below the minimum 65 points threshold. Consider improving your qualifications or English proficiency."
  };
  
  return {
    assessment_score: score,
    recommended_visa_code: recommendedVisa,
    strengths: strengths.slice(0, 5),
    improvement_areas: improvements.slice(0, 5),
    detailed_analysis: analysis
  };
}
