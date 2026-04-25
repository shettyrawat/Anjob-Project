import mongoose from 'mongoose';

const interviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        enum: ['text', 'voice'],
        default: 'text'
    },
    isAdaptive: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed'],
        default: 'ongoing'
    },
    chatHistory: [
        {
            role: { type: String, enum: ['user', 'assistant', 'system'] },
            content: String,
            timestamp: { type: Date, default: Date.now }
        }
    ],
    questions: [
        {
            question: String,
            answer: String,
            score: Number,
            feedback: String,
            improvements: [String],
            modelAnswer: String
        }
    ],
    overallScore: Number
}, {
    timestamps: true
});

// Add indexes for optimization
interviewSchema.index({ user: 1 });

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
