const MODEL_PRICING = {
    'openai/gpt-oss-20b': {
        inputPerMillion: 0.075,
        outputPerMillion: 0.30
    }
};

export function calculateEstimatedCost(
    model,
    tokensIn,
    tokensOut
) {
    const pricing = MODEL_PRICING[model];

    if (!pricing) {
        console.warn(`Pricing information for ${model} not configured. Cost recorded as 0.`);
        return 0;
    }

    const inputCost = (tokensIn / 1_000_000) * pricing.inputPerMillion;
    const outputCost =(tokensOut / 1_000_000) * pricing.outputPerMillion;
    return inputCost + outputCost;
}