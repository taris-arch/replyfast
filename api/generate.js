export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { clientMessage, tone, platform, premiumToken, bypassAuth, accessCode } = req.body;
    const chatgptApiKey = process.env.CHATGPT_KEY;
    const gumroadProductId = process.env.GUMROAD_PRODUCT_ID; // Your Gumroad Product ID (from the License Key block)
    const influencerAccessCode = process.env.INFLUENCER_ACCESS_CODE; // Shared code you give to influencers for free lifetime access

    const hasValidInfluencerCode = accessCode && influencerAccessCode && accessCode === influencerAccessCode;

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
                    { role: "system", content: `You are an integrated communication bot inside ReplyFast. Draft a response for ${platform}. Tone: ${tone}. Output ONLY the final draft.` },
                    { role: "user", content: clientMessage }
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
