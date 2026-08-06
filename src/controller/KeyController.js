import VirtualKey from '../models/VirtualKey.js';
import { generateApiKey, hashApiKey, getKeyPrefix, maskApiKey } from '../utils/apiKey.js';

/**
* Create a new virtual API key
* POST /api/keys
* 
* Request body:
* {
*   "label": "My App Key",
*   "tokenBudget": 10000
* }
* 
* Response:
* {
*   "key": "sk-gw-abc123...",
*   "label": "My App Key",
*   "tokenBudget": 10000,
*   "tokensRemaining": 10000,
*   "message": "Store this key safely..."
 }
*/

export const createKey =  async (req, res) => {
    try {
        const { label, tokenBudget } = req.body;

        if(typeof label !== 'string' || label.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid label' });
        }

        if(!Number.isFinite(tokenBudget) || tokenBudget < 0) {
            return res.status(400).json({ error: 'tokenBudget must be a positive number' });
        }

        const apiKey = generateApiKey();
        const keyHash = hashApiKey(apiKey);
        const keyPrefix = getKeyPrefix(apiKey);

        const virtualKey = await VirtualKey.create({
            keyHash,
            keyPrefix,
            label: label.trim(),
            tokenBudget,
            tokensUsed: 0,
            isActive: true
        });

        console.log(`New API key created: ${label.trim()} with (${keyPrefix} - Budget: ${tokenBudget} tokens)`);

        return res.status(201).json({
            id: virtualKey._id,
            key: apiKey,
            keyPrefix: virtualKey.keyPrefix,
            tokenBudget: virtualKey.tokenBudget,
            tokensUsed: virtualKey.tokensUsed,
            tokensRemaining: virtualKey.tokensRemaining,
            message: 'Please store the API key securely, It will not be shown again✌️'
        });

    } catch (error) {
        console.error('Error creating key:', error.message);

        if(error.code === 11000){
            return res.status(409).json({ error: 'A key already exist pleasee try again'})
        }
        res.status(500).json({ error: 'Failed to create Key😒' });
    }
}

/**
 * Get all keys (with filtering)
 * Get /api/keys
 * 
 * Query params:
 * - active: boolean (filter by active status)
 * - limit: number (default: 10, max: 100)
 * - offset: number (for pagination)
 * 
 * Response:
 * {
 * "keys": [...],
 * "count": 10,
 * "total": 25,
 * "page": 1,
 * "totalPages": 3
 * 
 * }
 */

export const getAllKeys = async (req, res) => {
    try {
        const {
            active = true,
            limit = 10,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
        if( active !== undefined) {
            filter.isActive = active === 'true';
        }

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const keys = await VirtualKey.find(filter)
             .select('KeyPrefix label tokenBudget tokensUsed isActive createdAt updatedAt')
             .sort(sort)
             .limit(parseInt(limit))
             .skip(parseInt(offset))
             .lean();

             const total = await VirtualKey.countDocuments(filter);

             const keysWithRemainingTokens = keys.map(key => ({
                ...key,
                tokensRemaining: Math.max(0, key.tokenBudget - key.tokensUsed),
                usagePercentage: key.tokenBudget > 0 ? ((key.tokensUsed / key.tokenBudget) * 100).toFixed(2) : '0.00'
             }));

             res.json({
                keys: keysWithRemainingTokens,
                count: keysWithRemainingTokens.length,
                total,
                page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
                totalPages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit),
                offset: parseInt(offset)
             })
    }catch (error) {
        console.error('Error fetching keys:', error.message);
        res.status(500).json({ error: 'Failed to fetch keys' });
    }
}

/**
 * Get a specific key by ID
 * GET /api/keys/:id
 * 
 * Identifier can be:
 * -MongoDB ObjectId
 * - Key Prefix (e.g., sk-gw-abc123)
 * 
 * Response:
 * {
 *  "keys": {..},
 *  "usage": {...},
 *   "recentLgs": [...]
 * }
 */

export const getKeyById = async (req, res) => {
    try {
        const { identifier } = req.params;

        if(!identifier || identifier.trim().length === 0) {
            return res.status(400).json({ error: 'Identifier is required' });
        }

        let virtualKey;

        if(identifier.match(/^[0-9a-fA-F]{24}$/)) {
            virtualKey = await VirtualKey.findById(identifier).lean();
        } else {
            virtualKey = await VirtualKey.findOne({ keyPrefix: identifier }).lean();
        }

        if(!virtualKey) {
            return res.status(404).json({ error: 'Key not found' });
        }

        const usageStats = await this._getKeyUsageStats(virtualKey._id);

        const recentLogs = await this.UsageLog.find({ keyId: virtualKey._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const keyData = {
            id: virtualKey._id,
            prefix: virtualKey.keyPrefix,
            label: virtualKey.label,
            tokenBudget: virtualKey.tokenBudget,
            tokensUsed: virtualKey.tokensUsed,
            tokensRemaining: Math.max(0, virtualKey.tokenBudget - virtualKey.tokensUsed),
            usagePercentage: virtualKey.tokenBudget > 0 ? ((virtualKey.tokensUsed / virtualKey.tokenBudget) * 100).toFixed(2) : '0.00',
            isActive: virtualKey.isActive,
            createdAt: virtualKey.createdAt,
            updatedAt: virtualKey.updatedAt
        };
           

        res.json({
            key: keyData,
            usage: usageStats,
            recentLogs: recentLogs,
            isNearExhaustion: (virtualKey.tokenBudget - virtualKey.tokensUsed) / virtualKey.tokenBudget < 0.1
        });
        

    }catch (error) {
        console.error('Error fetching key by ID:', error.message);
        res.status(500).json({ error: 'Failed to fetch key' });
    }
}