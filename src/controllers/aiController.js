import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

// ===== Generate product description using AI =====
export const generateDescription = async (req, res) => {
  try {
    const { name, category, gender, brand, keywords } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    const prompt = `Write a persuasive, SEO-friendly product description for a ${gender || 'unisex'} fashion item.
Product: ${name}
Category: ${category || 'fashion'}
Brand: ${brand || 'our store'}
Keywords: ${keywords || 'style, quality, comfort'}

Keep it 60-80 words, professional, highlighting key features.`;

    const response = await client.chat.completions.create({
      model: "deepseek-v4-pro",
      messages: [
        { role: "system", content: "You are a professional fashion copywriter." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      success: true,
      data: { description: response.choices[0].message.content.trim() }
    });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ success: false, message: 'AI generation failed' });
  }
};

// ===== Parse natural language search query using AI =====
// backend/src/controllers/aiController.js – parseSearchQuery

export const parseSearchQuery = async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Query is required' });
  }

  try {
    const systemPrompt = `
      You are an AI that extracts structured product search filters from natural language queries.
      Return ONLY a valid JSON object with these fields (omit if not present):
      - gender: "women" | "men" | "kids" | "unisex"
      - category: string
      - subcategory: string
      - minPrice: number
      - maxPrice: number
      - keywords: array of important keywords (at least the main product names)
      Do not include any other text, only the JSON object.
    `;

    const response = await client.chat.completions.create({
      model: "deepseek-v4-pro",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    let content = response.choices[0].message.content.trim();
    content = content.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.warn('AI response not valid JSON, using fallback:', content);
      parsed = {};
    }

    // ✅ Always ensure keywords exist
    if (!parsed.keywords || parsed.keywords.length === 0) {
      // Fallback: split query by spaces, remove common stop words
      const stopWords = ['for', 'and', 'the', 'with', 'under', 'over', 'from', 'to', 'of', 'a', 'an'];
      const words = query.toLowerCase().split(' ')
        .map(w => w.replace(/[^a-z0-9]/g, ''))
        .filter(w => w.length > 1 && !stopWords.includes(w));
      parsed.keywords = words.length > 0 ? words : [query];
    }

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('DeepSeek parse error:', error);
    // Fallback: return a basic keywords extraction
    const words = query.toLowerCase().split(' ').filter(w => w.length > 2);
    res.json({
      success: true,
      data: {
        keywords: words.length > 0 ? words : [query]
      }
    });
  }
};