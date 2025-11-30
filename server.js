require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing from environment variables!");
} else {
    console.log(`✅ GEMINI_API_KEY found (starts with: ${apiKey.substring(0, 4)}...)`);
}
const genAI = new GoogleGenerativeAI(apiKey || 'YOUR_API_KEY');

app.post('/analyze', async (req, res) => {
    try {
        const { cvData, jobText } = req.body;

        if (!cvData || !jobText) {
            return res.status(400).json({ error: 'CV Data and Job Offer text are required.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Server configuration error: GEMINI_API_KEY is missing.' });
        }

        // Using gemini-2.0-flash as it is available in the user's account
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Format CV Data for Prompt
        const cvString = `
        Name: ${cvData.personal.name}
        Role: ${cvData.personal.targetRole}
        Country: ${cvData.personal.country}
        Education: ${cvData.education.degree} in ${cvData.education.major} at ${cvData.education.university}
        Experience: ${cvData.experience.map(e => `${e.role} at ${e.company}: ${e.description}`).join('; ')}
        Skills: ${cvData.skills}
        Certifications: ${cvData.certifications}
        `;

        const prompt = `
        You are an elite AI Career Strategist from the future. Analyze the following Candidate Profile against the Target Mission (Job Offer).
        
        CANDIDATE PROFILE:
        ${cvString}
        
        TARGET MISSION:
        ${jobText}
        
        Provide a strategic analysis in JSON format with the following fields:
        {
            "matchScore": (integer 0-100),
            "missingSkills": [{"skill": "Skill Name", "link": "URL to a high-quality tutorial or documentation"}],
            "learningPlan": ["step 1", "step 2"],
            "successfulCVProfile": "A paragraph describing what a perfect candidate for this specific job looks like. Use professional, inspiring language.",
            "suggestedRole": "Alternative Job Title (Only if matchScore < 80, otherwise null)",
            "suggestedRoleReason": "Why this alternative role fits the candidate's current skills better (Only if suggestedRole is not null)",
            "candidateLocation": "City, Country (extracted from CV, or 'Remote' if not found)",
            "targetCompanies": ["Company A", "Company B", "Company C"],
            "specificJobTitles": ["Exact Title 1", "Exact Title 2"],
            "helpfulLinks": [{"title": "Resource Name", "url": "http://..."}]
        }
        
        "targetCompanies": Identify 3 top companies that are known to hire for this role/tech stack and are likely to have presence in the candidate's location (or globally if remote).
        "specificJobTitles": 2-3 precise job titles to search for.
        "missingSkills": Provide a specific, high-quality URL for each missing skill.
        Do not include markdown formatting. Return raw JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(jsonStr);
        } catch (e) {
            console.error("Failed to parse JSON from LLM:", text);
            return res.status(500).json({ error: 'Failed to parse analysis results.' });
        }

        res.json(jsonResponse);

    } catch (error) {
        console.error('Error analyzing:', error);
        res.status(500).json({ error: 'Failed to analyze. ' + error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
