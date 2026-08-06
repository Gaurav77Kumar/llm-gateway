import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema({
    keyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VirtualKey',
        required: true,
        index: true,
    },

    provider: {
        type: String,
        required: true,
        enum: ['groq', 'gemini'],
    },

    model: {
        type: String,
        required: true,
        trim: true,
    },

    tokensIn: {
        type: Number,
        default: 0,
        min: 0,
    },

    tokensOut: {
        type: Number,
        required: true,
        min: 0,
    },

    totalTokens: {
        type: Number,
        required: true,
        min: 0,
    },

    estimatedCost: {
        type: Number,
        default: 0,
        min: 0,
    },

    status: {
        type: String,
        required: true,
        enum: ['success', 'error', 'fallback_success'],
    }, 

    errorMessage: {
        type: String,
        default: null,
    },

    responseTime: {
        type: Number,
        default: null,
        min: 0,
    },
}, {timestamps: true});

usageLogSchema.index({
    keyId: 1,
    createdAt: -1
})

export default mongoose.model('UsageLog', usageLogSchema);