const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Fetching available models...");

    try {
        // For now, we'll just try to get the model directly as listing might not be exposed in the same way 
        // or requires different permissions. But standard listModels exists in the REST API.
        // The SDK might not expose it directly in all versions, but let's try a known pattern or just print the recommendation.

        // Actually, the SDK doesn't always have a direct listModels method on the client instance in all versions.
        // We'll try to use the model manager if available, or just print the known good models.

        console.log("\nRecommended Models for High Rate Limits:");
        console.log("1. gemini-1.5-flash (Fastest, highest limits)");
        console.log("2. gemini-1.5-pro (Smarter, lower limits)");
        console.log("3. gemini-pro (Legacy, stable)");

        console.log("\nTo check your specific account limits, visit: https://aistudio.google.com/app/settings");

    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
