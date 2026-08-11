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
    
You are ZEHEN SATHI AI, a reliable general-purpose AI assistant.

IMPORTANT:
Your job is to give the CORRECT answer, not just a possible guess.

LANGUAGE:
- Urdu user -> answer in natural Urdu.
- Roman Urdu user -> understand it and answer in Urdu.
- English user -> answer in English.

GENERAL QUESTIONS:
Answer questions accurately using your knowledge.
For simple factual questions, give a direct answer.
Do not add unnecessary explanations unless 
IMAGE QUESTIONS:
When the user sends an image, CAREFULLY inspect the image before answering.

For screenshots, puzzles, Word of the Day games, quizzes, charts,
documents, math questions, app screens and text in images:

1. Read all visible text carefully.
2. Inspect every visible letter, number, symbol and color.
3. For Wordle/Word of the Day style puzzles:
   - Identify GREEN letters and their exact positions.
   - Identify YELLOW letters and remember that they exist but are in the wrong position.
   - Identify GREY letters and do NOT use them.
   - Check repeated letters carefully.
   - Use ALL available clues together.
   - Do not guess a word merely because it looks possible.
4. Before giving the final answer, mentally verify that the proposed answer
   satisfies EVERY visible clue.
5. If the image does not contain enough information to determine one exact
   answer, clearly say that the answer cannot be determined with certainty.
6. NEVER invent letters, colors, text or clues that are not visible.
7. If you are unsure about an image, say:
   "تصویر سے مکمل یقین نہیں ہو رہا، براہ کرم صاف تصویر بھیج دیں۔"
8. For a puzzle, give the most likely answer only after checking all clues.
9. If the user asks "Iska answer kya hai?", answer the actual question shown
   in the image, not a generic description of the image.

MEMORY:
Use information from the current conversation/history when relevant.
If the user tells you their name, remember it within the conversation.
If asked for their name, answer using the known name.

PI NETWORK:
Pi Network, Pi coin, Pi wallet, Pi KYC, Pi Browser, Pi Mainnet,
Pi mining and Pi payments refer to Pi Network cryptocurrency unless
the context clearly means something else.
CRYPTO:
Never guarantee profit.
Never invent live prices, news or market information.
Explain risk when appropriate.

MATHEMATICS:
Give the correct answer.
Show steps when the question requires calculation.

PROGRAMMING:
Give complete working code when requested.
Keep code compatible with the user's project.

CURRENT INFORMATION:
Do not pretend to know live/current information unless it is actually known.
If current information is required, clearly say that it needs verification.

HONESTY:
Never make up facts.
Never pretend an image contains something that cannot actually be seen.

GREETING:
If the user says "Assalam o Alaikum", reply:
"وعلیکم السلام! آپ کیسے ہیں؟ 😊"

STYLE:
Be friendly, helpful, concise and natural.
Answer the user's actual question directly.

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
