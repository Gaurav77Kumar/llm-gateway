import { callLLM } from '../service/providerService.js';
import UsageLog from '../models/UsageLog.js';
import { updateTokenUsage } from '../middleware/budget.js';
import { calculateEstimatedCost } from '../utils/costCalculator.js';

export const chatCompletion = async (req, res) => {
    const startTime = Date.now();
    const virtualKey = req.virtualKey;

    if (!virtualKey) {
        return res.status(401).json({error: 'Authentication required'});
    }

    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({error: '"messages" must be a non-empty array'});
    }

    const validMessages = messages.every(
        (message) =>['system', 'user', 'assistant'].includes(message.role) && typeof message.content === 'string' && message.content.trim() !== '' );

    if (!validMessages) {
        return res.status(400).json({error: 'Each message must have a valid role and content'});
    }

    let result = null;
    let estimatedCost = 0;

    try {
        // 1. Call Groq / Gemini
        result = await callLLM(messages);

        // 2. Calculate cost
        estimatedCost = calculateEstimatedCost(
            result.model,
            result.tokensIn,
            result.tokensOut
        );

        // 3. Atomically update budget
        const updatedKey = await updateTokenUsage( virtualKey._id, result.totalTokens );

        // 4. Store successful usage
        await UsageLog.create({
            keyId: virtualKey._id,
            provider: result.provider,
            model: result.model,

            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            totalTokens: result.totalTokens,

            estimatedCost,

            status: result.usedFallback
                ? 'fallback_success'
                : 'success',

            errorMessage: null,
            responseTime: Date.now() - startTime
        });

        // 5. Return response
        return res.status(200).json({
            message: result.content,
            provider: result.provider,
            model: result.model,

            usage: {
                tokensIn: result.tokensIn,
                tokensOut: result.tokensOut,
                totalTokens: result.totalTokens,
                estimatedCost,

                tokenBudget: updatedKey.tokenBudget,
                tokensUsed: updatedKey.tokensUsed,
                tokensRemaining: Math.max(
                    updatedKey.tokenBudget - updatedKey.tokensUsed,
                    0
                )
            },

            fallbackUsed: result.usedFallback
        });

    } catch (error) {
        console.error(
            'Error in chatCompletion:',
            error.message,
            'statusCode:',
            error.statusCode
        );

        // Provider succeeded but something afterward failed
        if (result) {
            await UsageLog.create({
                keyId: virtualKey._id,
                provider: result.provider,
                model: result.model,

                tokensIn: result.tokensIn,
                tokensOut: result.tokensOut,
                totalTokens: result.totalTokens,

                estimatedCost,

                status: 'error',
                errorMessage: error.message,

                responseTime: Date.now() - startTime
            }).catch((logError) => {
                console.error(
                    'Failed to create error usage log:',
                    logError.message
                );
            });
        }

        // Budget exceeded
        if (error.statusCode === 402) {
            return res.status(402).json({
                error: 'Budget exceeded',
                message: 'Token budget would be exceeded'
            });
        }

        // Both providers failed
        if (error.statusCode === 503) {
            return res.status(503).json({
                error: 'Service unavailable',
                message: 'Both Groq and Gemini calls failed'
            });
        }

        return res.status(500).json({
            error: 'Internal server error'
        });
    }
};