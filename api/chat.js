// Vercel Serverless Function — /api/chat

const GROQ_API_KEY = process.env.GROQ_API_KEY; // ✅ secure (no fallback)
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ❗ safety check
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'API key missing (check env variables)' });
  }

  try {
    const { messages, useVision } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const model = useVision ? GROQ_VISION_MODEL : GROQ_MODEL;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}` // ✅ hidden key
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 8192
      })
    });

    const data = await response.json();

    // ❗ error handling
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Groq API error'
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Server error'
    });
  }
}