import mongoose from 'mongoose';

const virtualKeySchema = new mongoose.Schema({
    keyHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
        select: false
    },

    keyPrefix: {
        type: String,
        required: true,
        trim: true
    },

    label: {
        type: String,
        required: true,
        trim: true
    },

    tokenBudget: {
        type: Number,
        required: true,
        min: 0
    },

    tokensUsed: {
        type: Number,
        min: 0,
        default: 0

    },

    isActive: {
        type: Boolean,
        default: true
    },
   
}, {
    timestamps: true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

virtualKeySchema.virtual('tokensRemaining').get(function () {
    return Math.max(0, this.tokenBudget - this.tokensUsed);
});

export default mongoose.model('VirtualKey', virtualKeySchema);