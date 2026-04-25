import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    publicId: String,
    analysis: {
        atsScore: Number,
        skills: [String],
        suggestions: [String],
        completenessScore: Number,
        formattingScore: Number,
        keywordScore: Number,
        optimizedData: {
            personalInfo: {
                name: String,
                email: String,
                phone: String,
                location: String,
                links: mongoose.Schema.Types.Mixed // Flexible for objects or strings
            },
            summary: String,
            experience: [{
                role: String,
                company: String,
                duration: String,
                description: mongoose.Schema.Types.Mixed // Flexible for arrays of strings
            }],
            education: [{
                degree: String,
                institution: String,
                duration: String
            }],
            skills: mongoose.Schema.Types.Mixed // Flexible
        }
    }
}, {
    timestamps: true
});

// Add indexes for optimization
resumeSchema.index({ user: 1 });

const Resume = mongoose.model('Resume', resumeSchema);
export default Resume;
