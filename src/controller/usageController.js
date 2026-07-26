import UsageLog from '../models/UsageLog.js';

export const getUsage = async (req, res) => {
    try {
        const virtualKey = req.virtualKey;

        if (!virtualKey) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        // Aggregate all successful usage for this key
        const result = await UsageLog.aggregate([
            {
                $match: {
                    keyId: virtualKey._id,
                    status: {
                        $in: ['success', 'fallback_success']
                    }
                }
            },
            {
                $group: {
                    _id: null,

                    totalRequests: { $sum: 1 },

                    totalTokensIn: {
                        $sum: '$tokensIn'
                    },

                    totalTokensOut: {
                        $sum: '$tokensOut'
                    },

                    totalTokens: {
                        $sum: '$totalTokens'
                    },

                    totalEstimatedCost: {
                        $sum: '$estimatedCost'
                    }
                }
            }
        ]);

        const usage = result[0] || {
            totalRequests: 0,
            totalTokensIn: 0,
            totalTokensOut: 0,
            totalTokens: 0,
            totalEstimatedCost: 0
        };

        return res.status(200).json({
            key: {
                label: virtualKey.label,
                keyPrefix: virtualKey.keyPrefix
            },

            usage: {
                totalRequests: usage.totalRequests,
                tokensIn: usage.totalTokensIn,
                tokensOut: usage.totalTokensOut,
                totalTokens: usage.totalTokens,
                estimatedCost: usage.totalEstimatedCost
            },

            budget: {
                tokenBudget: virtualKey.tokenBudget,
                tokensUsed: virtualKey.tokensUsed,
                tokensRemaining: Math.max(
                    0,
                    virtualKey.tokenBudget -
                    virtualKey.tokensUsed
                )
            }
        });

    } catch (error) {
        console.error(
            'Get usage error:',
            error.message
        );

        return res.status(500).json({
            error: 'Failed to retrieve usage'
        });
    }
};