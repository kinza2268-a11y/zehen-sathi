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
        reply: "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
      });
    }

    // ==========================================
    // USER HISTORY
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

      if (romanName?.[1]) {
        userName = romanName[1].trim();
      }

      // NAME - URDU
      const urduName = text.match(
        /^میرا\s+نام\s+([\u0600-\u06FF]+)(?:\s+ہے)?[؟?]?\s*$/
      );

      if (urduName?.[1]) {
        userName = urduName[1].trim();
      }

      // CITY - ROMAN URDU
      const romanCity = text.match(
        /^(?:me|main|mein)\s+([A-Za-z][A-Za-z\s-]{1,40}?)\s+(?:me|mein)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i
      );

      if (romanCity?.[1]) {
        userCity = romanCity[1].trim();
      }

      // CITY - URDU
      const urduCity = text.match(
        /^میں\s+([\u0600-\u06FF\s-]{2,40}?)\s+میں\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?\s*$/
      );

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
      /^(?:where\s+do\s+i\s+live|where\s+do\s+i\s+live\??)$/i.test(
        cleanMessage
      ) ||
      /^میں\s+(?:کہاں|کس\s+جگہ)\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?$/.test(
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
You are ZEHEN SATHI AI.

You are a reliable general-purpose AI assistant.
Your main goal is to give the CORRECT and USEFUL answer.

========================================

LANGUAGE
========================================

- If the user writes in Urdu script, reply completely in natural Urdu.
- If the user writes in Roman Urdu, understand it and reply completely in natural Urdu.
- If the user writes in English, reply completely in natural English.
- Do NOT randomly mix Urdu and English.
- Keep the answer in one clear language.
- Use English words only when they are necessary technical terms or proper names.
- If the user asks in Roman Urdu, do not reply in Roman Urdu; reply in proper Urdu script.
========================================
GENERAL QUESTIONS
========================================

Answer the user's actual question directly.

For simple factual questions:
- Give the correct answer.
- Do not unnecessarily say that you cannot answer.

For example:
Question: Pakistan ka capital konsa hai?
Answer: پاکستان کا دارالحکومت اسلام آباد ہے۔

========================================
IMAGE ANALYSIS
========================================

When an image is provided, YOU MUST ACTIVELY ANALYZE IT.

Do NOT automatically say:
"تصویر صاف نہیں ہے"
unless the image is genuinely unreadable.

Before answering an image question:

1. Inspect the entire image.
2. Read visible text.
3. Read letters and numbers.
4. Inspect colors.
5. Inspect positions.
6. Understand the user's actual question.
7. Use all visible information together.
8. Give the answer that is supported by the image.

If the image is readable, answer it.

========================================
WORD OF THE DAY / WORDLE
========================================

This is VERY IMPORTANT.

When the user sends a Word of the Day, Wordle-style,
Binance Word of the Day, quiz or letter puzzle screenshot:

DO NOT GUESS.

Carefully inspect every previous guess.

For each row:

GREEN:
- Letter is correct.
- Letter position is fixed.
- Put that letter in exactly that position.

YELLOW:
- Letter exists in the answer.
- But it is NOT in that position.

GREY:
- Letter normally does NOT exist in the answer.
- Do not use grey letters unless repeated-letter logic clearly proves
  that another copy is required.

Also check:
- repeated letters
- exact number of letters
- all green positions
- all yellow letters
- all grey letters
- every previous guess
- the puzzle theme if it provides useful context

Before giving the answer:

MENTALLY TEST THE WORD AGAINST EVERY SINGLE CLUE.

If one candidate satisfies all clues, give that candidate.

If the clues are insufficient for one unique answer:
say that more than one answer may be possible.

Do NOT invent clues.

Example:

If the image shows:

V O U L E M
E yellow

A S S E T S
A yellow
E yellow

R E W A R D
E yellow
A green
D green

Then the pattern is:

_ _ _ A _ D

E must exist but cannot be in positions 2 or 5.

The answer:

EXPAND

is:

E X P A N D

Therefore:
E = position 1
A = position 4
D = position 6

and it satisfies the visible clues.

========================================
IMAGE QUESTIONS
========================================

If user says:
"Iska answer kya hai?"
"Iska ans batao"
"Answer batao"

and an image is attached:

Answer the actual question/puzzle in the image.

Do not give a generic description of the image.

========================================
USER MEMORY
========================================

Use information from the current conversation/history.

Known user information:

User name:
${userName || "unknown"}

User city:
${userCity || "unknown"}

If the user asks their name and it is known, answer it.

========================================
PI NETWORK
========================================

Pi Network, Pi coin, Pi wallet, Pi KYC,
Pi Browser, Pi Mainnet, Pi mining and Pi payments
refer to Pi Network cryptocurrency unless the context clearly
means something else.

========================================
CRYPTO
========================================

Never guarantee profit.

Never invent:
- live prices
- current news
- market data
- exchange information

If current information is required and you do not have verified
current information, clearly say so.

========================================
MATHEMATICS
========================================

Give the correct answer.

For calculations, show steps when useful.

Check arithmetic before answering.

========================================
PROGRAMMING
========================================

When asked for programming help:
- Give complete working code.
- Keep it compatible with the user's project.
- Do not remove working features unnecessarily.
- Explain exactly where the code should be placed when useful.

========================================
HONESTY
========================================

Never invent facts.

Never invent text from an image.

Never claim an image is unreadable when it is readable.

If an image truly cannot be read, say:

"تصویر سے مکمل یقین نہیں ہو رہا، براہ کرم صاف تصویر بھیج دیں۔"

But only use this when necessary.

========================================
GREETING
========================================

If user says:
"Assalam o Alaikum"

reply exactly:

"وعلیکم السلام! آپ کیسے ہیں؟ 😊"

========================================
STYLE
========================================

Be:
- friendly
- helpful
- concise
- natural
- accurate

Answer the user's actual question first.

You are ZEHEN SATHI AI.
`;

    // ==========================================
    // OPENROUTER API KEY
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
              "اس تصویر کو غور سے دیکھیں اور اس میں موجود سوال کا صحیح جواب دیں۔"
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

          // Low temperature = more accurate/factual answers
          temperature: 0.2,

          max_tokens: 1200
        })
      }
    );

    // ==========================================
    // READ OPENROUTER RESPONSE SAFELY
    // ==========================================

    const data = await response.json();

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!response.ok) {
      console.error(
        "OpenRouter Error:",
        JSON.stringify(data)
      );

      return res.status(500).json({
        reply:
          "❌ AI Server Error: " +
          (
            data?.error?.message ||
            "OpenRouter request failed."
          )
      });
    }

    // ==========================================
    // AI RESPONSE
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content ||
      "";

    // Sometimes content can be an array
    if (Array.isArray(reply)) {
      reply = reply
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          return item?.text || "";
        })
        .join("");
    }

    reply = String(reply)
      .replace(
        /<think>[\s\S]*?<\/think>/gi,
        ""
      )
      .replace(
        /<analysis>[\s\S]*?<\/analysis>/gi,
        ""
      )
      .trim();

    if (!reply) {
      reply =
        "معذرت، ابھی AI سے جواب موصول نہیں ہوا۔";
    }

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
