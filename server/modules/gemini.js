// modules/gemini.js
const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const handleGeminiRequest = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const text = response.text;
    console.log(text);

    res.json({ response: text });
  } catch (e) {
    console.error("❌ [Gemini] 호출 실패", e);
    res.status(500).json({ error: "Failed to generate response" });
  }
};

module.exports = { handleGeminiRequest };
