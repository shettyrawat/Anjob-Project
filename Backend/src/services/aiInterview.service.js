import { generateAIResponse } from '../config/fireworks.js';

/**
 * Mock Interview Question Bank & Evaluation
 */

export const getQuestions = async (role) => {
    try {
        const prompt = `Generate a list of 5 most important and common interview questions for the role: "${role}".
    This role could be from ANY industry (e.g., Healthcare, Construction, Finance, Education, or IT).
    Ensure the questions are professionally tailored to the specific standards and challenges of this field.
    The questions should cover essential skills, problem-solving, and situational judgment.
    Return the response as a simple JSON array of strings ONLY. 
    Example: ["Question 1", "Question 2", ...]`;

        const response = await generateAIResponse(prompt);
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error('Invalid AI response: No JSON array found');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating questions with Fireworks AI:', error);
        throw new Error('Could not generate interview questions. Please check your AI configuration.');
    }
};

/**
 * Dynamic Adaptive Interview Logic
 * Fireworks AI decides whether to follow up or move to a new topic.
 */
export const getNextAdaptiveQuestion = async (role, history) => {
    try {
        const prompt = `You are an expert industry interviewer for the role: "${role}".
        Based on the conversation history below, either:
        1. Ask a follow-up question if the last answer was incomplete or interesting.
        2. Move to a new relevant topic if the current one is sufficiently covered.
        3. If you've asked around 5-7 questions and feel you have enough info, say "INTERVIEW_COMPLETE".

        Current History: ${JSON.stringify(history.map(h => ({ role: h.role, content: h.content })))}

        Return your response in this JSON format:
        {
            "question": "<your next question or 'INTERVIEW_COMPLETE'>",
            "thought": "<briefly explain why you chose this question/follow-up>"
        }`;

        const response = await generateAIResponse(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response: No JSON object found');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error in adaptive question generation:', error);
        throw new Error('Evaluation service is temporarily unavailable.');
    }
};

export const evaluateAnswer = async (role, question, answer) => {
    try {
        const prompt = `As an expert industry interviewer, evaluate the following answer for the role of ${role}.
        Question: ${question}
        Candidate's Answer: ${answer}

        Provide a critical yet constructive analysis in the following JSON format:
        {
            "score": <number 1-10>,
            "feedback": "<A detailed summary of why this score was given, mentioning what was good and what was missing>",
            "improvements": ["Actionable tip 1", "Actionable tip 2"],
            "modelAnswer": "<A concise example of how a perfect answer would look>"
        }
        The feedback should be professional and encouraging.`;

        const response = await generateAIResponse(prompt);
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Invalid AI response: No JSON object found');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error evaluating answer with Fireworks AI:', error);
        return {
            score: 0,
            feedback: "AI Evaluation failed. Please try again later.",
            improvements: [],
            modelAnswer: "Not available"
        };
    }
};

