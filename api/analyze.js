const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables (Vercel loads these automatically, but config() is safe)
dotenv.config();

// Initialize OpenAI client
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Initialize Supabase client
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = req.body;

  // Validation check
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: '분석할 문장을 입력해주세요.'
    });
  }

  // Check if OpenAI key is present
  if (!openai) {
    return res.status(500).json({
      error: '서버 설정 오류: OpenAI API Key가 설정되지 않았습니다.'
    });
  }

  try {
    const systemPrompt = `You are a sentiment analysis assistant. Analyze the sentiment of the user's Korean text.
You MUST respond with a JSON object containing the following keys:
- "sentiment": must be one of "긍정", "부정", or "중립" (Korean only)
- "confidence": confidence level of the analysis in percentage, as an integer between 0 and 100.
- "reason": a concise, friendly explanation in Korean of why you chose this sentiment.

JSON format example:
{
  "sentiment": "긍정",
  "confidence": 92,
  "reason": "전반적으로 긍정적인 형용사들이 많이 사용되었으며 기쁨을 표현하고 있습니다."
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      response_format: { type: "json_object" }
    });

    const resultText = completion.choices[0].message.content;
    const analysis = JSON.parse(resultText);

    // Save to Supabase (if configured)
    if (supabase) {
      try {
        const { error } = await supabase
          .from('sentiment_logs')
          .insert([
            {
              text: text.trim(),
              sentiment: analysis.sentiment,
              confidence: analysis.confidence,
              reason: analysis.reason
            }
          ]);
        if (error) {
          console.error('Supabase DB Insert Error:', error);
        }
      } catch (dbErr) {
        console.error('Failed to communicate with Supabase:', dbErr);
      }
    }

    return res.status(200).json({
      sentiment: analysis.sentiment,
      confidence: analysis.confidence,
      reason: analysis.reason
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return res.status(500).json({
      error: 'AI 분석 요청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
};
