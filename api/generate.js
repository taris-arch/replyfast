export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { clientMessage, extraContext, tone, platform, premiumToken, bypassAuth, accessCode } = req.body;
    const chatgptApiKey = process.env.CHATGPT_KEY;
    const gumroadProductId = process.env.GUMROAD_PRODUCT_ID; // Your Gumroad Product ID (from the License Key block)

    // INFLUENCER_CODES is a JSON string in your Vercel env vars, e.g:
    // {"UKMIKE2026":"Mike (UK)","USJANE2026":"Jane (US)","CAALEX2026":"Alex (Canada)"}
    // To revoke ONE influencer without affecting the others, just delete their entry from this JSON and redeploy.
    let influencerCodesMap = {};
    try {
        influencerCodesMap = JSON.parse(process.env.INFLUENCER_CODES || "{}");
    } catch (e) {
        influencerCodesMap = {};
    }

    const hasValidInfluencerCode = Boolean(accessCode && influencerCodesMap[accessCode]);

    if (!bypassAuth && !hasValidInfluencerCode) {
        if (!premiumToken) {
            return res.status(401).json({ error: "Access Denied: Premium license key is missing." });
        }
        try {
            // SECURE SERVER-SIDE VALIDATION: Verify the license key straight with Gumroad
            const verifyBody = new URLSearchParams();
            verifyBody.append('product_id', gumroadProductId);
            verifyBody.append('license_key', premiumToken);
            verifyBody.append('increment_uses_count', 'false'); // Don't burn a "use" on every single generate call

            const gumroadVerify = await fetch('https://api.gumroad.com/v2/licenses/verify', {
                method: 'POST',
                body: verifyBody
            });
            const gumroadData = await gumroadVerify.json();

            // Block request if the key is invalid, refunded, disputed, or cancelled
            if (!gumroadVerify.ok || !gumroadData.success) {
                return res.status(401).json({ error: "Access Denied: Invalid license key." });
            }
            if (gumroadData.purchase?.refunded || gumroadData.purchase?.disputed || gumroadData.purchase?.subscription_cancelled_at) {
                return res.status(401).json({ error: "Access Denied: This license is no longer active (refunded or cancelled)." });
            }
        } catch (e) {
            return res.status(500).json({ error: "Billing authentication routing failure." });
        }
    }

    if (!clientMessage) return res.status(400).json({ error: "Client message content is missing." });
    // Core ChatGPT Logic Execution
    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${chatgptApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: `You are an integrated communication bot inside ReplyFast. Draft a reply for ${platform}. Tone: ${tone}.

Rules:
- Write a complete, ready-to-send reply that directly addresses what the incoming message actually said or asked.
- If the user provides specific details (availability, prices, timelines, names, etc.), use them naturally and specifically in the reply instead of speaking in vague generalities.
- If no specific details are provided and the message asks for something concrete you don't have (like a price or date), don't invent one — instead, write a natural, proactive line acknowledging the question and suggesting a concrete next step (e.g. "let's jump on a call to go over the numbers") rather than a vague stall like "I'll get back to you."
- Never include a "Subject:" line, regardless of platform.
- Never use placeholder brackets like [Your Name], [Recipient's Name], or [Your Company]. If a sign-off is appropriate for the platform, end with a natural, generic closing line (e.g. "Best," or "Thanks,") without inventing a name or company.
- Avoid stiff, generic AI phrasing like "I would be happy to," "Please let me know," "I hope this message finds you well," "Thank you for following up," "Thank you for reaching out," or "Looking forward to your response." Write the way a real, busy professional would actually type it — plain words, contractions where natural, and get to the point. Skip the throat-clearing opener entirely if possible — jump straight into answering or acknowledging what they actually said (e.g. "Good questions — here's where things stand:" or just diving straight into the timeline/pricing answer).
- Match the length and formality naturally to the platform: keep Slack and WhatsApp replies short and conversational; Gmail and LinkedIn can be a little more developed, but should still read like a real person wrote it quickly, not a formal letter.
- Output ONLY the final reply text, nothing else.` },
                    { role: "user", content: extraContext ? `Incoming message:\n${clientMessage}\n\nSpecific details to include in the reply:\n${extraContext}` : clientMessage }
                ]
            })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error?.message || "OpenAI API request failed.");
        }
        return res.status(200).json({ reply: data.choices[0].message.content });
    } catch (error) {
        return res.status(500).json({ error: "ChatGPT generation exception occurred." });
    }
}
