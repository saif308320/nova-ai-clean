// ══════════════════════════════════════════════
//  Nova AI — Vercel Serverless Backend
//  API key secure — frontend mein nahi dikhti
// ══════════════════════════════════════════════

const GROQ_API_KEY      = process.env.GROQ_API_KEY;
const GROQ_MODEL        = 'llama-3.3-70b-versatile';      // text — 128k context
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'; // vision

export default async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // ── API key check ──
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'GROQ_API_KEY missing — Vercel env variables check karo' });
  }

  try {
    const { messages, useVision } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const model = useVision ? GROQ_VISION_MODEL : GROQ_MODEL;

    // ── Groq API call ──
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens:   32000,   // max output — lamba code ke liye
        temperature:  0.7,     // creative but focused
        top_p:        0.9,
        stream:       false
      })
    });

    const data = await groqRes.json();

    // ── Error from Groq ──
    if (!groqRes.ok) {
      const errMsg = typeof data?.error === 'string'
        ? data.error
        : data?.error?.message || `Groq API error: ${groqRes.status}`;
      return res.status(groqRes.status).json({ error: errMsg });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}