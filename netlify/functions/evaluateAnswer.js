const { GoogleGenAI } = require('@google/genai');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 455, body: 'Method Not Allowed' };
  }

  try {
    const { question, userAnswer, sampleAnswer } = JSON.parse(event.body || '{}');
    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'AI_API_KEY is not set.' })
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert technical interviewer evaluating a candidate's answer.
Question: "${question}"
Ideal Benchmark Answer: "${sampleAnswer}"
Candidate Answer: "${userAnswer}"

Evaluate the answer and output ONLY JSON:
{
  "score": 8, // Integer out of 10
  "correctness": "Accurate/Partially Accurate/Incorrect",
  "strengths": "What candidate did well",
  "weaknesses": "What was missing or flawed",
  "suggestions": "Actionable advice to improve",
  "idealAnswer": "Refined candidate answer"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-09-2025',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: response.text
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Evaluation failed: ' + err.message })
    };
  }
};