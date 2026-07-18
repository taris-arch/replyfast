module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, tone, platform } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a professional communication assistant. Write a reply to this ${platform} message.\n\nTone: ${tone}\nPlatform: ${platform}\n\nMessage:\n"""\n${message}\n"""\n\nRules:\n- Perfectly match the ${tone} tone\n- Format correctly for ${platform}: Email gets greeting + sign-off; Slack/WhatsApp are short and casual; LinkedIn is semi-formal\n- Sound natural and human, not robotic\n- Skip filler phrases like "I hope this finds you well"\n- Output ONLY the reply text, nothing else`
        }]
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || '';
    if (!reply) return res.status(500).json({ error: 'No reply generated' });

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, tone, platform } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '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',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `You are a professional communication assistant. Write a reply to this ${platform} message.\n\nTone: ${tone}\nPlatform: ${platform}\n\nMessage:\n"""\n${message}\n"""\n\nRules:\n- Perfectly match the ${tone} tone\n- Format correctly for ${platform}: Email gets greeting + sign-off; Slack/WhatsApp are short and casual; LinkedIn is semi-formal\n- Sound natural and human, not robotic\n- Skip filler phrases like "I hope this finds you well"\n- Output ONLY the reply text, nothing else`
        }]
      })
    });

    const data = await response.json();
    const reply = data.content?.[0]?.text || '';
    if (!reply) return res.status(500).json({ error: 'No reply generated' });

    return res.status(200).json({ reply });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
