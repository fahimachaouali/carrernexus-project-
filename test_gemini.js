require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY not found in .env");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        console.log("Fetching models from:", url.replace(apiKey, 'HIDDEN_KEY'));
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("✅ Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name} (Version: ${m.version})`);
                }
            });
        } else {
            console.error("❌ Failed to list models:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("❌ Error fetching models:", error.message);
    }
}

listModels();
