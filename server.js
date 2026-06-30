const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize OpenAI client if apiKey is present
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('OpenAI client initialized.');
} else {
  console.warn('Warning: OPENAI_API_KEY environment variable is missing.');
}

// Initialize Supabase client if credentials are provided
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  console.log('Supabase client initialized.');
} else {
  console.warn('Supabase environment variables are missing. Database logging will be bypassed.');
}

// API endpoint for sentiment analysis
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;

  // 1. Validation check
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({
      error: '분석할 문장을 입력해주세요.'
    });
  }

  // Check if OpenAI key is present
  if (!openai) {
    return res.status(500).json({
      error: '서버 설정 오류: OpenAI API Key가 설정되지 않았습니다. .env 파일을 구성해 주세요.'
    });
  }

  try {
    // 2. Request OpenAI analysis
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

    // 3. Save to Supabase (if configured)
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
        } else {
          console.log('Analysis result saved to Supabase.');
        }
      } catch (dbErr) {
        console.error('Failed to communicate with Supabase:', dbErr);
      }
    }

    // 4. Return response
    return res.json({
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
});

// Serve frontend fallback for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
