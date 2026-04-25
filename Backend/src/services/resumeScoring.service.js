import { generateAIResponse } from '../config/fireworks.js';

/**
 * AI Powered ATS Scoring Algorithm
 */
export const calculateScore = async (text, role = 'General') => {
    try {
        const prompt = `Analyze this resume for industry-standard compatibility for the role: "${role}".
        This role could be from ANY field (Healthcare, Engineering, Arts, Business, IT, etc.).
        Resume Text: ${text}

        Your goal is to provide specific, professional feedback based on that role's industry standards.
        Return ONLY a JSON object:
        {
            "atsScore": <0-100 score based on how well the resume matches ${role} standards>,
            "keywordScore": <0-100 score for industry-specific terminology>,
            "formattingScore": <0-100 score for professional layout standards>,
            "completenessScore": <0-100 score for missing essential sections like Certifications, Experience, etc.>,
            "skills": ["Industry Skill 1", "Industry Skill 2"],
            "suggestions": ["Specific improvement for ${role} industry", "Generic formatting improvement"]
        }`;

        const response = await generateAIResponse(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response');

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            atsScore: parsed.atsScore || 0,
            keywordScore: parsed.keywordScore || 0,
            formattingScore: parsed.formattingScore || 0,
            completenessScore: parsed.completenessScore || 0,
            skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
        };
    } catch (error) {
        console.error('Error analyzing resume with Fireworks AI:', error);
        // Fallback to basic scoring if AI fails
        return {
            atsScore: 60,
            keywordScore: 50,
            formattingScore: 70,
            completenessScore: 60,
            suggestions: ["AI analysis is currently unavailable. Please review your resume against industry standards."]
        };
    }
};

/**
 * Generate restructured, ATS-optimized version of the resume
 */
export const generateOptimizedData = async (text, role = 'General') => {
    try {
        const prompt = `Rewrite this resume into a professionally optimized JSON format for the role: "${role}". 
        Respect the conventions of the specific industry (e.g., if it's medical, emphasize certifications; if it's creative, emphasize portfolio/projects).
        Resume Text: ${text}

        JSON Structure:
        {
            "personalInfo": { 
                "name": "...", 
                "email": "...", 
                "phone": "...", 
                "location": "...", 
                "links": ["Portfolio/LinkedIn/Github links if relevant to the industry"] 
            },
            "summary": "Professional summary/objective tailored to ${role}",
            "experience": [{ 
                "role": "...", 
                "company": "...", 
                "duration": "...", 
                "description": ["Action-oriented accomplishment specific to the ${role} field"] 
            }],
            "education": [{ "degree": "...", "institution": "...", "duration": "..." }],
            "skills": ["Skill specific to ${role} industry", "Soft skill"]
        }
        Return ONLY valid JSON. Ensure "links", "description", and "skills" are arrays of simple strings.`;

        console.log('--- START AI OPTIMIZATION ---');
        const response = await generateAIResponse(prompt);
        console.log('AI RAW RESPONSE START >>>');
        console.log(response.substring(0, 500) + '...');
        console.log('<<< AI RAW RESPONSE END');

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response: No JSON object found');
        const parsedData = JSON.parse(jsonMatch[0]);

        // Validate that we got at least a name
        if (!parsedData.personalInfo?.name || parsedData.personalInfo.name === 'Full Name') {
            console.warn('AI returned generic or empty name. Attempting to extract from text manually.');
            // Fallback: try to find name in original text if AI failed
            if (!parsedData.personalInfo) parsedData.personalInfo = {};
            const nameMatch = text.match(/^([A-Z][a-z]+ [A-Z][a-z]+)/);
            if (nameMatch) parsedData.personalInfo.name = nameMatch[1];
        }

        console.log('Successfully generated optimized data for:', parsedData.personalInfo?.name);
        return parsedData;
    } catch (error) {
        console.error('CRITICAL ERROR in generateOptimizedData:', error.message);
        return null;
    }
};
