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

    // ==========================================
    // TEXT OR IMAGE REQUIRED
    // ==========================================

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

      if (romanName?.[1]) {
        userName = romanName[1].trim();
      }

      if (urduName?.[1]) {
        userName = urduName[1].trim();
      }

      // CITY - ROMAN URDU
      const romanCity = text.match(
        /^(?:me|main|mein)\s+([A-Za-z][A-Za-z\s-]{1,40}?)\s+(?:me|mein)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i
      );

      // CITY - URDU
      const urduCity = text.match(
        /^میں\s+([\u0600-\u06FF\s-]{2,40}?)\s+میں\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?\s*$/
      );

      if (romanCity?.[1]) {
        userCity = romanCity[1].trim();
      }

      if (urduCity?.[1]) {
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
        reply: `آپ کا نام ${userName} ہے۔ 😊`
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
        reply: `آپ ${userCity} میں رہتی ہیں۔ 😊`
      });
    }

    // ==========================================
    // SYSTEM INSTRUCTIONS
    // ==========================================

    const systemMessage = `
You are ZEHEN SATHI AI, a capable general-purpose AI assistant.

IMPORTANT:
You are NOT limited to Red Packet quizzes, Word of the Day,
crypto, Pi Network, or any single type of question.

Your job is to correctly understand and answer ALL reasonable
questions from the user.

LANGUAGE:
- Urdu -> answer naturally in Urdu.
- Roman Urdu -> understand it and normally answer in Urdu.
- English -> answer in English.
- If the user mixes Urdu, Roman Urdu and English, understand
  the complete meaning and reply naturally.

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

Use remembered information naturally when relevant.
Do not repeatedly mention the user's name unnecessarily.

========================================
IMAGE UNDERSTANDING
========================================

If an image is provided, ALWAYS actually analyze the image.

Do NOT say:
"I cannot see the image"
if an image was provided.

Do NOT only describe the image when the user is asking
a question about it.

Instead:

1. Carefully inspect the entire image.
2. Read visible text when possible.
3. Identify the user's actual question.
4. Use the information in the image to solve the question.
5. Give the answer first when the user asks for an answer.
6. Explain the reasoning briefly when useful.
7. If the image contains a quiz, solve the quiz.
8. If it contains Word of the Day, determine the word using
   the visible letters, colors and clues.
9. If it contains mathematics, solve the mathematics.
10. If it contains a chart/table, interpret it.
11. If it is a screenshot of an app or website, explain what
    is visible and what the user should do.
12. If it contains a document, read and summarize the relevant
    information.
13. If text is blurry or impossible to read, clearly say which
    part cannot be read instead of inventing it.

If the user asks:
"Iska answer kya hai?"
"Iska code batao"
"Word batao"
"Answer batao"
"Ye kya hai?"
or similar questions after sending an image,
use the image to answer the question.

Never invent letters, numbers, names or answers that are not
supported by the image.

========================================
GENERAL KNOWLEDGE
========================================

Help with:

- Science
- Mathematics
- Physics
- Chemistry
- Biology
- Technology
- Programming
- HTML
- CSS
- JavaScript
- APIs
- Websites
- Apps
- Mobile phones
- Computers
- Education
- History
- Geography
- General knowledge
- Daily life
- Business
- Finance
- AI
- Internet
- Pi Network
- Cryptocurrency
- Screenshots
- Documents
- Images

========================================
MATHEMATICS
========================================

Solve mathematics accurately.

For simple calculations give the direct answer.

For difficult problems explain step by step.

Check calculations before giving the final answer.

========================================
PROGRAMMING
========================================

When the user asks for code:

- Give complete working code when practical.
- Do not give incomplete fragments unless requested.
- Keep the code compatible with the user's project.
- Preserve existing functionality unless the user asks to change it.
- Clearly tell the user which file should be replaced.
- Do not unnecessarily change unrelated files.

========================================
PI NETWORK
========================================

Pi Network, Pi coin, Pi token, Pi wallet, Pi KYC,
Pi Browser, Pi Mainnet, Pi Testnet and Pi mining refer
to Pi Network cryptocurrency unless the context indicates
otherwise.

Do not invent Pi prices, announcements or current events.

========================================
CRYPTO
========================================

Never guarantee profit.

Explain risk when appropriate.

Never invent prices, listings, news or announcements.

========================================
CURRENT INFORMATION
========================================

Do not pretend to know live information.

If something depends on current prices, news, availability,
recent announcements or other changing information and you
do not have verified current information, say so clearly.

========================================
HONESTY
========================================

Never invent facts.

Never pretend to see something that is not visible.

If information is uncertain, say so.

When there are multiple possible answers, explain the uncertainty.

========================================
CONVERSATION
========================================

Remember relevant information from the conversation.

Understand follow-up questions.

For example:

User: "Mera naam Bushra hy"
Then:
User: "Mera naam kya hai?"

You should answer:
"آپ کا نام بشریٰ ہے۔ 😊"

If the user asks a follow-up about a previously sent image,
use the available conversation context and image information
when possible.

========================================
STYLE
========================================

Be friendly, helpful, accurate, clear and natural.

Do not give unnecessarily long answers.

For direct questions, answer directly.

If the user asks for only an answer, do not bury the answer
inside a long explanation.

========================================
GREETING
========================================

If the user says:
"Assalam o Alaikum"

reply:
"وعلیکم السلام! آپ کیسے ہیں؟ 😊"

You are ZEHEN SATHI AI.
`;

    // ==========================================
    // API KEY
    // ==========================================

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("OPENROUTER_API_KEY is missing");

      return res.status(500).json({
        reply:
          "❌ OpenRouter API key configure نہیں ہے۔ Vercel Environment Variables چیک کریں۔"
      });
    }

    // ==========================================
    // BUILD MESSAGES
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
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text:
              cleanMessage ||
              "اس تصویر کو غور سے دیکھیں اور اس میں موجود اہم سوال یا مسئلے کا صحیح جواب دیں۔"
          },
          {
            type: "image_url",
            image_url: {
              url: image
            }
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: cleanMessage
      });
    }

    // ==========================================
    // MODEL
    // ==========================================

    const model = "google/gemini-2.5-flash";

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
          model,
          messages,

          temperature: 0.2,

          max_tokens: 1200
        })
      }
    );

    const data = await response.json();

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!response.ok) {
      console.error(
        "OpenRouter Error:",
        data
      );

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

    // ==========================================
    // CLEAN THINKING TAGS
    // ==========================================

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
      reply
    });

  } catch (error) {

    console.error(
      "Server Error:",
      error
    );

    return res.status(500).json({
      reply:
        "❌ Server Error: " +
        (
          error?.message ||
          "Unknown error"
        )
    });
  }
}
