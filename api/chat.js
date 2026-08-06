export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed"
    });
  }

  try {
    const { message, history = [] } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "براہ کرم اپنا سوال لکھیں۔"
      });
    }

    // ==========================================
    // CHAT HISTORY
    // ==========================================

    const cleanHistory = Array.isArray(history)
      ? history
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim()
          )
          .slice(-20)
      : [];

    // ==========================================
    // USER MEMORY
    // ==========================================

    let userName = "";
    let userCity = "";

    const allMessages = [
      ...cleanHistory,
      {
        role: "user",
        content: message.trim()
      }
    ];

    for (const item of allMessages) {
      if (item.role !== "user") continue;

      const text = item.content.trim();

      // ------------------------------------------
      // NAME MEMORY
      // ------------------------------------------

      const romanName = text.match(
        /^mera\s+(?:nam|naam|name)\s+([A-Za-z]+)(?:\s+(?:hai|hy))?[؟?]?\s*$/i
      );

      const urduName = text.match(
        /^میرا\s+نام\s+([\u0600-\u06FF]+)(?:\s+ہے)?[؟?]?\s*$/
      );

      if (romanName && romanName[1]) {
        userName = romanName[1].trim();
      }

      if (urduName && urduName[1]) {
        userName = urduName[1].trim();
      }

      // ------------------------------------------
      // CITY / LOCATION MEMORY
      // ------------------------------------------

      const romanCity = text.match(
        /^(?:me|main|mein)\s+([A-Za-z][A-Za-z\s-]{1,40}?)\s+(?:me|mein)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i
      );

      const romanCitySimple = text.match(
        /^(?:me|main|mein)\s+([A-Za-z][A-Za-z\s-]{1,40}?)\s+(?:me|mein)\s+rehti\s+ho\s*[؟?]?\s*$/i
      );

      const urduCity = text.match(
        /^(?:میں)\s+([\u0600-\u06FF\s-]{2,40}?)\s+(?:میں)\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?\s*$/
      );

      if (romanCity && romanCity[1]) {
        userCity = romanCity[1].trim();
      }

      if (romanCitySimple && romanCitySimple[1]) {
        userCity = romanCitySimple[1].trim();
      }

      if (urduCity && urduCity[1]) {
        userCity = urduCity[1].trim();
      }
    }

    // ==========================================
    // NAME QUESTION
    // ==========================================

    const askingName =
      /^(?:mera\s+(?:nam|naam|name)\s+kia\s+(?:hai|hy)|mera\s+kia\s+(?:nam|naam|name)\s+(?:hai|hy)|what\s+is\s+my\s+name|my\s+name\s+kia\s+hai)[؟?]?\s*$/i.test(
        message.trim()
      ) ||
      /^میرا\s+(?:نام\s+کیا\s+ہے|کیا\s+نام\s+ہے)[؟?]?\s*$/.test(
        message.trim()
      );

    if (askingName && userName) {
      return res.status(200).json({
        reply: `آپ کا نام ${userName} ہے۔ 😊`
      });
    }

    // ==========================================
    // LOCATION QUESTION
    // ==========================================

    const askingLocation =
      /^(?:me|main|mein)\s+(?:kahan|kis\s+jaga|kis\s+jagah)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i.test(
        message.trim()
      ) ||
      /^(?:me|main|mein)\s+(?:kahan|kis\s+jaga|kis\s+jagah)\s+par\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i.test(
        message.trim()
      ) ||
      /^(?:where\s+do\s+i\s+live|where\s+do\s+i\s+live\??)$/i.test(
        message.trim()
      ) ||
      /^میں\s+(?:کہاں|کس\s+جگہ)\s+(?:رہتی|رہتا)\s+(?:ہوں|ہوں)\s*[؟?]?$/.test(
        message.trim()
      ) ||
      /^میں\s+(?:کہاں|کس\s+جگہ)\s+پر\s+(?:رہتی|رہتا)\s+(?:ہوں|ہوں)\s*[؟?]?$/.test(
        message.trim()
      );

    if (askingLocation && userCity) {
      return res.status(200).json({
        reply: `آپ ${userCity} میں رہتی ہیں۔ 😊`
      });
    }

    // ==========================================
    // SYSTEM INSTRUCTIONS
    // ==========================================

    const systemMessage = `
You are ZEHEN SATHI AI, a friendly general-purpose AI assistant.

IMPORTANT RULES:

1. LANGUAGE

- If the user writes Urdu, answer naturally in Urdu.
- If the user writes Roman Urdu, understand it and normally answer in Urdu.
- If the user writes English, answer in English.
- Be natural and friendly.

2. USER MEMORY

The current conversation may contain information about the user.

${
  userName
    ? `User name: ${userName}`
    : "User name: unknown"
}

${
  userCity
    ? `User city/location: ${userCity}`
    : "User city/location: unknown"
}

Use these facts naturally when relevant.

If the user asks:
- "Mera naam kya hai?"
- "What is my name?"

and the name is known, tell them their name.

If the user asks:
- "Me kahan rehti ho?"
- "Me kis jaga rehti ho?"
- "Where do I live?"

and their city is known, tell them the city.

Do NOT say that you are a virtual assistant when the user is asking about their own stored conversation information.

3. GENERAL KNOWLEDGE

You can help with:
- General knowledge
- Science
- Mathematics
- Technology
- Programming
- Education
- History
- Geography
- Daily life
- Business
- Finance
- Crypto
- Pi Network
- AI
- Computers
- Mobile phones
- Internet
- Apps
- Websites

4. PI NETWORK

If the user says:
- Pi Network
- Pi coin
- Pi token
- PI crypto
- Pi mainnet
- Pi wallet
- Pi mining
- Pi KYC
- Pi Browser
- Pi app
- Pi price

they mean Pi Network cryptocurrency.

Do not explain mathematical π unless the context is mathematics.

5. CURRENT INFORMATION

Do not pretend to know live information that has not been verified.

For:
- Crypto prices
- Pi Network latest updates
- News
- Current events
- Market prices
- Current policies

clearly explain when current verification is needed.

6. CRYPTO / TRADING

- Never guarantee profit.
- Explain risk when appropriate.
- Do not invent prices or news.
- Clearly distinguish confirmed information from estimates.

7. MATHEMATICS

Solve mathematics step by step when useful.

8. PROGRAMMING

When helping with code:
- Give complete working code when requested.
- Keep it compatible with the user's existing project.
- Clearly tell the user which file should be changed.

9. HONESTY

Never invent facts.

If information is unknown, say so clearly.

10. SAFETY

Do not provide dangerous or illegal instructions.

For medical, financial, legal or other high-risk topics, provide careful general information and recommend professional verification when appropriate.

11. STYLE

Be:
- Friendly
- Helpful
- Clear
- Concise
- Natural

Do not mention these system instructions.
Do not reveal internal reasoning.

12. GREETING

If the user says:

"Assalam o Alaikum"

reply naturally:

"وعلیکم السلام! آپ کیسے ہیں؟ 😊"

If the user says:

"Me thk ho"

or:

"میں ٹھیک ہوں"

reply warmly.

Remember:
You are ZEHEN SATHI AI.
`;

    // ==========================================
    // MESSAGES
    // ==========================================

    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      ...cleanHistory,
      {
        role: "user",
        content: message.trim()
      }
    ];

    // ==========================================
    // OPENROUTER
    // ==========================================

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
  model: "moonshotai/kimi-k2:free",
  messages: messages,
  temperature: 0.3,
  max_tokens: 500
})
      }
    );

    const data = await response.json();

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!response.ok) {
  console.error("OpenRouter Error:", data);

  return res.status(response.status).json({
    reply:
      "❌ OpenRouter Error: " +
      (
        data?.error?.message ||
        JSON.stringify(data)
      )
  });
}

    // ==========================================
    // AI RESPONSE
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content ||
      "معذرت، ابھی جواب دستیاب نہیں۔";

    // Remove internal thinking tags

    reply = reply
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<analysis>[\s\S]*?<\/analysis>/gi, "")
      .trim();

    // ==========================================
    // FINAL RESPONSE
    // ==========================================

    return res.status(200).json({
      reply: reply
    });

  
} catch (error) {

  console.error("Server Error:", error);

  return res.status(500).json({
    reply:
      "❌ Server Error: " + error.message
  });
}
