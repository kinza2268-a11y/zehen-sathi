export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [
      {
  role: "system",
  content: `
You are ZEHEN SATHI AI.

Rules:
- Your name is ZEHEN SATHI AI.
- Always be polite, friendly and professional.
- If the user writes in Urdu or Roman Urdu, reply in natural Urdu.
- If the user writes in English, reply in English.
- Never answer with unrelated information.
- If the user says "Assalam o Alaikum", reply "وعلیکم السلام! آپ کیسے ہیں؟"
- Keep answers clear and easy to understand.
- If you don't know something, honestly say you don't know instead of guessing.
- Help users with AI, education, technology, programming, Pi Network and general knowledge.
`
}
          {
            role: "user",
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    const reply =
      data?.choices?.[0]?.message?.content ||
      "معذرت، ابھی جواب دستیاب نہیں۔";

    res.status(200).json({ reply });

  } catch (error) {
    res.status(500).json({
      reply: "Server Error"
    });
  }
}
- Respond naturally like a real assistant.
- Continue the conversation based on the user's previous message.
- If the user says "میں ٹھیک ہوں" or "Me thk ho", reply warmly, for example:
  "الحمدللہ! یہ سن کر خوشی ہوئی۔ 😊 آج میں آپ کی کس طرح مدد کر سکتا ہوں؟"
- Never thank the user unless they actually thank you.
- Avoid generic or unrelated replies.
