import VirtualKey from '../models/VirtualKey.js';

const budgetMiddleware =  async (req, res, next) => {
    try {
        const virtualKey = req.virtualKey;

        if (!virtualKey) {
            return res.status(401).json({ error: "Authentication required. VirtualKey not found." });
        }

        const key =  await VirtualKey.findById(virtualKey._id);

        if(!key || !key.isActive) {
            return res.status(403).json({ error: "VirtualKey is inactive or not found." });
        }

        const tokensRemaining = key.tokenBudget - key.tokensUsed;

        if (tokensRemaining <= 0) {
            return res.status(403).json({
                 error: "Budget exceeded." ,
                 message: 'Token budget exhausted',
                 budget: {
                    tokenBudget: key.tokenBudget,
                    tokensUsed: key.tokensUsed,
                    tokensRemaining: 0
                 } 
                });
        }
        req.virtualKey = key;
        next();

    } catch (err) {
        console.error("Budget middleware error:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/*
Atomically record actual token usage after
successful provider response. This ensures that the token usage is accurately tracked and prevents race conditions in concurrent
*/
export const updateTokenUsage = async (keyId, tokensUsed) => {
    if (
        !keyId ||
        !Number.isFinite(tokensUsed) ||
        tokensUsed < 0
    ) {
        const error = new Error(
            'Invalid parameters for updating token usage.'
        );

        error.statusCode = 400;
        throw error;
    }

    const updatedKey = await VirtualKey.findOneAndUpdate(
        {
            _id: keyId,

            // Atomic budget enforcement
            $expr: {
                $lte: [
                    {
                        $add: ['$tokensUsed', tokensUsed]
                    },
                    '$tokenBudget'
                ]
            }
        },
        {
            $inc: {
                tokensUsed: tokensUsed
            }
        },
        {
            returnDocument: 'after',
            runValidators: true
        }
    );

    // Query didn't match:
    // key missing OR requested usage would exceed budget
    if (!updatedKey) {

        const keyExists = await VirtualKey.exists({
            _id: keyId
        });

        if (!keyExists) {
            const error = new Error(
                'VirtualKey not found.'
            );

            error.statusCode = 404;
            throw error;
        }

        // Key exists, therefore atomic budget condition failed
        const error = new Error(
            'Token budget would be exceeded.'
        );

        error.statusCode = 402;
        throw error;
    }

    return updatedKey;
};
export default budgetMiddleware;