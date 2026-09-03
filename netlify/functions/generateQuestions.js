const { GoogleGenAI } = require('@google/genai');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 455, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { jobRole, experienceLevel, difficulty, topic, numQuestions } = JSON.parse(event.body || '{}');

    // Secure Netlify environment key retrieval
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI_API_KEY environment variable is not configured in Netlify.' })
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert technical interviewer. Generate exactly ${numQuestions} realistic interview questions tailored for a ${jobRole} position at experience level "${experienceLevel}".
The interview difficulty should be "${difficulty}" and topic focused on "${topic}".

Return ONLY a JSON object (no markdown, no backticks, no extra text) with the following exact format:
{
  "questions": [
    {
      "question": "Question text here?",
      "difficulty": "${difficulty}",
      "topic": "${topic}",
      "hint": "Useful conceptual hint for the candidate",
      "sampleAnswer": "Comprehensive ideal answer explaining core concepts"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text;
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      // Fallback clean parsing if AI includes code ticks
      const cleanJson = rawText.replace(/---`json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleanJson);
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Netlify Function Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate questions. ' + error.message })
    };
  }
};