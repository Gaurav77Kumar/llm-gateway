import crypto from 'crypto';

const KEY_PREFIX = 'sk-gw-';
const KEY_REGEX = /^sk-gw-[a-f0-9]{64}$/;

export function generateApiKey() {
    return `${KEY_PREFIX}${crypto.randomBytes(32).toString('hex')}`;
}

export function hashApiKey(apiKey) {
    if(!isValidApiKey(apiKey)) {
        throw new Error('Invalid API key format');
    }
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function isValidApiKey(apiKey) {
    return typeof apiKey === 'string' && KEY_REGEX.test(apiKey);
}

export function getKeyPrefix(apiKey) {
    if(!isValidApiKey(apiKey)) {
        throw new Error('Invalid API key format');
    }
    return apiKey.slice(0,12);
}

export function maskApiKey(apiKey) {
    if(!isValidApiKey(apiKey)) {
        throw new Error('Invalid API key format');
    }
    
    return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
}