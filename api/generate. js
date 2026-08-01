export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { clientMessage, tone, platform, premiumToken, bypassAuth } = req.body;
    const chatgptApiKey = process.env.CHATGPT_KEY;
    const flwSecretKey = process.env.FLW_SECRET_KEY; // Your private Flutterwave live secret key
    if (!bypassAuth) {
        if (!premiumToken) {
            return res.status(401).json({ error: "Access Denied: Premium subscription authentication token is missing." });
        }
        try {
            // SECURE SERVER-SIDE VALIDATION: Verify the token straight with Flutterwave
            const flwVerify = await fetch(`https://api.flutterwave.com/v3/transactions/${premiumToken}/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${flwSecretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const flwData = await flwVerify.json();
            // Block request if transaction is unpaid or invalid
            if (!flwVerify.ok || flwData.status !== "success" || flwData.data.status !== "successful") {
                return res.status(401).json({ error: "Access Denied: Invalid or expired premium payment signature detected." });
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
