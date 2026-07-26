import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
    'MONGODB_URI',
    'GROQ_API_KEY',
    'ADMIN_SECRET'
];

for (const variable of requiredEnvVars) {
    if (!process.env[variable]) {
        throw new Error(
            `Missing required environment variable: ${variable}`
        );
    }
}

export const env = {
    port: process.env.PORT || 3000,

    mongoUri: process.env.MONGODB_URI,

    groqApiKey: process.env.GROQ_API_KEY,
    groqModel:  process.env.GROQ_MODEL || 'openai/gpt-oss-20b',

    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL,

    adminSecret: process.env.ADMIN_SECRET
};