require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const SYSTEM_PROMPT = 'You are a precise nutrition estimator. Analyze the food described and/or shown and estimate calories and macros. Respond ONLY with valid JSON, no markdown fences, no other text, matching exactly this schema: {"items":[{"name":string,"quantity":string,"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number}],"total":{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number}}. Base estimates on standard USDA nutrition data for the described quantities.';

app.post('/api/analyze-food', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Add it to .env and restart the server.' });
  }
  const { description, image } = req.body || {};
  if (!description && !image) {
    return res.status(400).json({ error: 'Provide a description or an image.' });
  }

  const content = [];
  if (image && image.base64 && image.mime) {
    content.push({ type: 'image', source: { type: 'base64', media_type: image.mime, data: image.base64 } });
  }
  content.push({
    type: 'text',
    text: description || 'Estimate the macros for the food shown in the image. Assume a typical single serving if quantity is unclear.'
  });

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }]
      })
    });

    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({ error: data?.error?.message || 'Anthropic API error' });
    }

    const textBlocks = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n');
    const cleaned = textBlocks.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.total) throw new Error('unexpected response format from model');
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to analyze food' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OVERLOAD running at http://localhost:${PORT}`));
