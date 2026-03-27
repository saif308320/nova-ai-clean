// ══════════════════════════════════════════════
//  Nova AI — Vercel Serverless Backend
//  Multiple API keys rotation for more requests
// ══════════════════════════════════════════════

// ── Multiple keys — rotate karo ──
const KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
].filter(Boolean); // empty keys hata do

const GROQ_MODEL        = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  if (KEYS.length === 0) {
    return res.status(500).json({ error: 'Koi API key configure nahi — Vercel env check karo' });
  }

  // ── Random key pick karo ──
  const GROQ_API_KEY = KEYS[Math.floor(Math.random() * KEYS.length)];

  try {
    const { messages, useVision } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const model = useVision ? GROQ_VISION_MODEL : GROQ_MODEL;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens:  8192,
        temperature: 0.7,
        top_p:       0.9,
        stream:      false
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      const errMsg = typeof data?.error === 'string'
        ? data.error
        : data?.error?.message || `Groq API error: ${groqRes.status}`;
      return res.status(groqRes.status).json({ error: errMsg });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}