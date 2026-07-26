import axios from 'axios';
import { env } from '../config/env.js';

const GROQ_API_KEY = env.groqApiKey;
const GROQ_MODEL = env.groqModel;

const GEMINI_API_KEY = env.geminiApiKey;
const GEMINI_MODEL = env.geminiModel;

const GROQ_URL =
    'https://api.groq.com/openai/v1/chat/completions';

const TIMEOUT_MS = 15000;


/**
 * Primary provider — Groq
 */
async function callGroq(messages) {
    const response = await axios.post(
        GROQ_URL,
        {
            model: GROQ_MODEL,
            messages,
            stream: false,
        },
        {
            headers: {
                Authorization: `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: TIMEOUT_MS,
        }
    );

    const usage = response.data.usage ?? {};

    const tokensIn = usage.prompt_tokens ?? 0;
    const tokensOut = usage.completion_tokens ?? 0;

    // Calculate ourselves so budget accounting is consistent
    const totalTokens = tokensIn + tokensOut;

    return {
        provider: 'groq',

        model:
            response.data.model || GROQ_MODEL,

        content:
            response.data.choices?.[0]?.message?.content ?? '',

        tokensIn,
        tokensOut,
        totalTokens,
    };
}


/**
 * Convert messages to Gemini format
 */
function toGeminiFormat(messages) {
    return messages
        .filter(message => message.role !== 'system')
        .map(message => ({
            role:
                message.role === 'assistant'
                    ? 'model'
                    : 'user',

            parts: [
                {
                    text: message.content
                }
            ]
        }));
}


/**
 * Fallback provider — Gemini
 */
async function callGemini(messages) {
    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    const response = await axios.post(
        url,
        {
            contents: toGeminiFormat(messages)
        },
        {
            headers: {
                'x-goog-api-key': GEMINI_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: TIMEOUT_MS,
        }
    );

    const usage = response.data.usageMetadata ?? {};

    const tokensIn =
        usage.promptTokenCount ?? 0;

    const tokensOut =
        usage.candidatesTokenCount ?? 0;

    const totalTokens =
        usage.totalTokenCount ??
        (tokensIn + tokensOut);

    return {
        provider: 'gemini',

        model: GEMINI_MODEL,

        content:
            response.data.candidates?.[0]
                ?.content?.parts?.[0]?.text ?? '',

        tokensIn,
        tokensOut,
        totalTokens,
    };
}


/**
 * Groq = primary
 * Gemini = fallback
 */
export async function callLLM(messages) {
    try {
        const result = await callGroq(messages);

        return {
            ...result,
            usedFallback: false
        };

    } catch (groqError) {

        console.error(
            'Groq failed:',
            groqError.response?.data || groqError.message
        );

        try {
            const result = await callGemini(messages);

            return {
                ...result,
                usedFallback: true
            };

        } catch (geminiError) {

            console.error(
                'Gemini failed:',
                geminiError.response?.data || geminiError.message
            );

            const error =
                new Error('Both Groq and Gemini calls failed');

            error.statusCode = 503;

            throw error;
        }
    }
}