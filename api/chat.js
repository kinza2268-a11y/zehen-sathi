export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed"
    });
  }

  try {
    const {
      message = "",
      history = [],
      image = null
    } = req.body || {};

    const cleanMessage =
      typeof message === "string"
        ? message.trim()
        : "";

    // Text یا image میں سے کم از کم ایک ضروری ہے
    if (!cleanMessage && !image) {
      return res.status(400).json({
        reply:
          "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
      });
    }

    // ==========================================
    // CHAT HISTORY
    // ==========================================

    const cleanHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              (m.role === "user" ||
                m.role === "assistant") &&
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
        content: cleanMessage
      }
    ];

    for (const item of allMessages) {
      if (item.role !== "user") continue;

      const text = item.content.trim();

      // NAME - ROMAN URDU
      const romanName = text.match(
        /^mera\s+(?:nam|naam|name)\s+([A-Za-z]+)(?:\s+(?:hai|hy))?[؟?]?\s*$/i
      );

      // NAME - URDU
      const urduName = text.match(
        /^میرا\s+نام\s+([\u0600-\u06FF]+)(?:\s+ہے)?[؟?]?\s*$/
      );

      if (romanName && romanName[1]) {
        userName = romanName[1].trim();
      }

      if (urduName && urduName[1]) {
        userName = urduName[1].trim();
      }

      // CITY - ROMAN URDU
      const romanCity = text.match(
        /^(?:me|main|mein)\s+([A-Za-z][A-Za-z\s-]{1,40}?)\s+(?:me|mein)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i
      );

      if (romanCity && romanCity[1]) {
        userCity = romanCity[1].trim();
      }

      // CITY - URDU
      const urduCity = text.match(
        /^میں\s+([\u0600-\u06FF\s-]{2,40}?)\s+میں\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?\s*$/
      );

      if (urduCity && urduCity[1]) {
        userCity = urduCity[1].trim();
      }
    }

    // ==========================================
    // NAME QUESTION
    // ==========================================

    const askingName =
      /^(?:mera\s+(?:nam|naam|name)\s+kia\s+(?:hai|hy)|mera\s+kia\s+(?:nam|naam|name)\s+(?:hai|hy)|what\s+is\s+my\s+name|my\s+name\s+kia\s+hai)[؟?]?\s*$/i.test(
        cleanMessage
      ) ||
      /^میرا\s+(?:نام\s+کیا\s+ہے|کیا\s+نام\s+ہے)[؟?]?\s*$/.test(
        cleanMessage
      );

    if (askingName && userName) {
      return res.status(200).json({
        reply:
          `آپ کا نام ${userName} ہے۔ 😊`
      });
    }

    // ==========================================
    // LOCATION QUESTION
    // ==========================================

    const askingLocation =
      /^(?:me|main|mein)\s+(?:kahan|kis\s+jaga|kis\s+jagah)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i.test(
        cleanMessage
      ) ||
      /^(?:me|main|mein)\s+(?:kahan|kis\s+jaga|kis\s+jagah)\s+par\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i.test(
        cleanMessage
      ) ||
      /^(?:where\s+do\s+i\s+live|where\s+do\s+i\s+live\??)$/i.test(
        cleanMessage
      ) ||
      /^میں\s+(?:کہاں|کس\s+جگہ)\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?$/.test(
        cleanMessage
      ) ||
      /^میں\s+(?:کہاں|کس\s+جگہ)\s+پر\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?$/.test(
        cleanMessage
      );

    if (askingLocation && userCity) {
      return res.status(200).json({
        reply:
          `آپ ${userCity} میں رہتی ہیں۔ 😊`
      });
    }

    // ==========================================
    // SYSTEM INSTRUCTIONS
    // ==========================================

    const systemMessage = `
You are ZEHEN SATHI AI, a friendly general-purpose AI assistant.

LANGUAGE:
- If user writes Urdu, answer naturally in Urdu.
- If user writes Roman Urdu, understand it and normally answer in Urdu.
- If user writes English, answer in English.

USER MEMORY:

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

GENERAL KNOWLEDGE:
Help with science, mathematics, technology, programming,
education, history, geography, daily life, business,
finance, crypto, Pi Network, AI, computers, mobile phones,
internet, apps and websites.

PI NETWORK:
Pi Network, Pi coin, Pi token, Pi wallet, Pi KYC,
Pi Browser, Pi mainnet and Pi mining refer to Pi Network
cryptocurrency unless the context is mathematics.

CURRENT INFORMATION:
Do not invent live prices, news or current events.

CRYPTO:
Never guarantee profit.
Explain risk when appropriate.
Do not invent prices or news.

MATHEMATICS:
Solve step by step when useful.

PROGRAMMING:
Give complete working code when requested.
Keep it compatible with the user's project.

IMAGE:
If the user sends an image, carefully analyze it.
Describe visible information accurately.
If there is text in the image, read it when possible.
Do not claim to see something that is not visible.

HONESTY:
Never invent facts.
If information is unknown, say so clearly.

STYLE:
Be friendly, helpful, clear, concise and natural.

GREETING:
If the user says "Assalam o Alaikum",
reply:
"وعلیکم السلام! آپ کیسے ہیں؟ 😊"

You are ZEHEN SATHI AI.
`;

    // ==========================================
    // OPENROUTER API KEY
    // ==========================================

    if (!process.env.OPENROUTER_API_KEY) {
      console.error(
        "OPENROUTER_API_KEY is missing"
      );

      return res.status(500).json({
        reply:
          "❌ OpenRouter API key configure نہیں ہے۔ Vercel Environment Variables چیک کریں۔"
      });
    }

    // ==========================================
    // NORMAL TEXT HISTORY
    // ==========================================

    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      ...cleanHistory
    ];

    // ==========================================
    // USER MESSAGE
    // ==========================================

    if (image) {

      // Image + text
      const userContent = [];

      userContent.push({
        type: "text",
        text:
          cleanMessage ||
          "اس تصویر کو دیکھ کر بتائیں کہ اس میں کیا ہے۔"
      });

      userContent.push({
        type: "image_url",
        image_url: {
          url: image
        }
      });

      messages.push({
        role: "user",
        content: userContent
      });

    } else {

      // Text only
      messages.push({
        role: "user",
        content: cleanMessage
      });

    }

    // ==========================================
    // MODEL
    // ==========================================

    /*
      Vision کے لیے ایسا model ضروری ہے جو image input
      support کرتا ہو۔
    */

    const model = image
      ? "google/gemini-2.5-flash"
      : "moonshotai/kimi-k2:free";

    // ==========================================
    // OPENROUTER REQUEST
    // ==========================================

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${process.env.OPENROUTER_API_KEY}`,

          "Content-Type":
            "application/json",

          "HTTP-Referer":
            "https://zehen-sathi.vercel.app",

          "X-Title":
            "ZEHEN SATHI AI"
        },

        body: JSON.stringify({
          model: model,

          messages: messages,

          temperature: 0.3,

          max_tokens: 700
        })
      }
    );

    const data =
      await response.json();

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!response.ok) {

      console.error(
        "OpenRouter Error:",
        data
      );

      return res.status(
        response.status
      ).json({
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

    // Remove thinking tags
    reply = reply
      .replace(
        /<think>[\s\S]*?<\/think>/gi,
        ""
      )
      .replace(
        /<analysis>[\s\S]*?<\/analysis>/gi,
        ""
      )
      .trim();

    // ==========================================
    // FINAL RESPONSE
    // ==========================================

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {

    console.error(
      "Server Error:",
      error
    );

    return res.status(500).json({
      reply:
        "❌ Server Error: " +
        error.message
    });
  }
}
