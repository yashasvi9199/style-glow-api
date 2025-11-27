const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

module.exports = async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', "true");
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        const base64Data = image.split(',')[1] || image;

        const prompt = `You are an expert photographer, fashion stylist, and dermatologist. Analyze the attached image and provide a JSON response with: summary, details (20 aspects), suggestions (10 categories with 3 items each), and recaptureSuggestions (5-7 tips).`;

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });

        const result = await model.generateContent([
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            prompt
        ]);

        const response = await result.response;
        const text = response.text();

        res.status(200).json({ summary: text, details: {}, suggestions: {}, recaptureSuggestions: [] });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
