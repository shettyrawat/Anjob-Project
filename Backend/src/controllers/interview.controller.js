import Interview from '../models/Interview.js';
import { getQuestions, evaluateAnswer, getNextAdaptiveQuestion } from '../services/aiInterview.service.js';

// @desc    Start an interview session (Static 5-Question)
// @route   POST /api/interviews/start
// @access  Private
export const startInterview = async (req, res, next) => {
    try {
        const { role, mode } = req.body;
        const roleQuestions = await getQuestions(role);

        const interview = await Interview.create({
            user: req.user.id,
            role,
            mode: mode || 'text',
            questions: roleQuestions.map(q => ({ question: q }))
        });

        res.status(201).json(interview);
    } catch (error) {
        next(error);
    }
};

// @desc    Submit an answer (Static Mode)
// @route   POST /api/interviews/:id/answer
// @access  Private
export const submitAnswer = async (req, res, next) => {
    try {
        const { questionIndex, answer } = req.body;
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        const questionObj = interview.questions[questionIndex];
        const evaluation = await evaluateAnswer(interview.role, questionObj.question, answer);

        questionObj.answer = answer;
        questionObj.score = evaluation.score;
        questionObj.feedback = evaluation.feedback;
        questionObj.improvements = evaluation.improvements;
        questionObj.modelAnswer = evaluation.modelAnswer;

        // Check if all questions answered
        const unanswered = interview.questions.filter(q => !q.answer);
        if (unanswered.length === 0) {
            interview.status = 'completed';
            const totalScore = interview.questions.reduce((acc, q) => acc + q.score, 0);
            interview.overallScore = Math.round(totalScore / interview.questions.length);
        }

        await interview.save();
        res.json(interview);
    } catch (error) {
        next(error);
    }
};

// @desc    Start an adaptive interview session
// @route   POST /api/interviews/adaptive/start
// @access  Private
export const startAdaptiveInterview = async (req, res, next) => {
    try {
        const { role, mode } = req.body;

        // Get initial question
        const adaptiveResponse = await getQuestions(role);
        const firstQuestion = adaptiveResponse[0];

        const interview = await Interview.create({
            user: req.user.id,
            role,
            mode: mode || 'text',
            isAdaptive: true,
            chatHistory: [{ role: 'assistant', content: firstQuestion }],
            questions: []
        });

        res.status(201).json(interview);
    } catch (error) {
        next(error);
    }
};

// @desc    Submit an adaptive answer
// @route   POST /api/interviews/adaptive/:id/step
// @access  Private
export const submitAdaptiveAnswer = async (req, res, next) => {
    try {
        const { answer } = req.body;
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({ message: 'Interview not found' });
        }

        const lastAIIdx = [...interview.chatHistory].reverse().findIndex(h => h.role === 'assistant');
        const currentQuestion = interview.chatHistory[interview.chatHistory.length - 1 - lastAIIdx].content;

        const evaluation = await evaluateAnswer(interview.role, currentQuestion, answer);

        interview.chatHistory.push({ role: 'user', content: answer });

        interview.questions.push({
            question: currentQuestion,
            answer: answer,
            score: evaluation.score,
            feedback: evaluation.feedback,
            improvements: evaluation.improvements,
            modelAnswer: evaluation.modelAnswer
        });

        const nextStep = await getNextAdaptiveQuestion(interview.role, interview.chatHistory);

        if (nextStep.question === 'INTERVIEW_COMPLETE') {
            interview.status = 'completed';
            const totalScore = interview.questions.reduce((acc, q) => acc + q.score, 0);
            interview.overallScore = Math.round(totalScore / interview.questions.length);
        } else {
            interview.chatHistory.push({ role: 'assistant', content: nextStep.question });
        }

        await interview.save();
        res.json(interview);
    } catch (error) {
        next(error);
    }
};

// @desc    Get user interview sessions
// @route   GET /api/interviews
// @access  Private
export const getInterviews = async (req, res, next) => {
    try {
        const interviews = await Interview.find({ user: req.user.id });
        res.json(interviews);
    } catch (error) {
        next(error);
    }
};
