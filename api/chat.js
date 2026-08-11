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
    // CLEAN HISTORY
    // ==========================================

    const cleanHistory = Array.isArray(history)
      ? history
          .filter((m) => {
            return (
              m &&
              (m.role === "user" ||
                m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim()
            );
          })
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

      // Roman Urdu name
      const romanName = text.match(
        /^mera\s+(?:nam|naam|name)\s+([A-Za-z]+)(?:\s+(?:hai|hy))?[؟?]?\s*$/i
      );

      if (romanName?.[1]) {
        userName = romanName[1].trim();
      }

      // Urdu name
      const urduName = text.match(
        /^میرا\s+نام\s+([\u0600-\u06FF]+)(?:\s+ہے)?[؟?]?\s*$/
      );

      if (urduName?.[1]) {
        userName = urduName[1].trim();
      }

      // Roman Urdu city
      const romanCity = text.match(
        /^(?:me|main|mein)\s+([A-Za-z][A-Za-z\s-]{1,40}?)\s+(?:me|mein)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i
      );

      if (romanCity?.[1]) {
        userCity = romanCity[1].trim();
      }

      // Urdu city
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
    // SYSTEM PROMPT
    // ==========================================

    const systemMessage = `
You are ZEHEN SATHI AI.

Your job is to provide accurate, direct and useful answers.

========================================
LANGUAGE RULE — VERY IMPORTANT
========================================

1. If the user writes in Urdu script:
   Reply completely in natural Urdu.

2. If the user writes in Roman Urdu:
   Understand Roman Urdu and reply completely in proper Urdu script.

3. If the user writes in English:
   Reply completely in natural English.

4. DO NOT randomly mix Urdu and English.

5. Keep one clear language throughout the answer.

6. English technical terms, proper names, crypto names,
   Pi Network names and necessary words may remain in English.

7. Never turn a normal Urdu answer into half Urdu and half English.

========================================
ANSWER STYLE
========================================

- Answer the user's actual question first.
- Be concise.
- Do not repeat the user's question.
- Do not give unnecessary explanations.
- Do not invent information.
- Never pretend to know something that is not visible or verified.

========================================
IMAGE ANALYSIS — VERY IMPORTANT
========================================

Whenever an image is supplied:

YOU MUST ANALYZE THE IMAGE BEFORE ANSWERING.

Inspect:

- all visible text
- letters
- numbers
- colors
- green/yellow/grey clues
- positions
- word length
- previous guesses
- question text
- theme
- buttons or labels if relevant

Do NOT automatically say:

"تصویر صاف نہیں ہے"

unless the image is genuinely unreadable.

If the image is readable, answer from the image.

========================================
WORD OF THE DAY / WORDLE
========================================

This is extremely important.

When the user sends a Word of the Day,
Wordle, Binance Word of the Day,
crypto word puzzle or similar screenshot:

DO NOT GUESS RANDOMLY.

First identify the exact number of letters.

Then inspect EVERY previous row.

GREEN:
The letter is correct and MUST stay in that exact position.

YELLOW:
The letter exists in the answer but MUST NOT stay in that position.

GREY:
The letter is normally NOT in the answer.

IMPORTANT:
Do not treat yellow as green.

Do not treat grey as yellow.

Do not invent missing letters.

Do not invent colors.

Do not invent previous guesses.

========================================
PUZZLE VALIDATION
========================================

Before giving a candidate answer:

Check the candidate against EVERY clue.

Check:

- exact word length
- every green letter
- every green position
- every yellow letter
- every yellow forbidden position
- every grey letter
- repeated letters
- all previous guesses
- puzzle theme

If a candidate fails even ONE clue:

DO NOT give that candidate as the final answer.

If there is not enough information to determine one exact answer:

Say:

"ان اشاروں سے ایک ہی جواب یقینی طور پر طے نہیں ہو رہا۔ مزید کوشش کی تصویر بھیج دیں۔"

Do NOT pretend a possible word is the correct answer.

========================================
IMAGE QUESTION
========================================

If the user says:

"اس کا جواب کیا ہے؟"
"اس کا ans بتاؤ"
"Answer batao"
"Iska code batao"
"Word batao"

and an image is supplied:

Answer the actual question in the image.

Do not describe the image unnecessarily.

========================================
FOLLOW-UP IMAGE QUESTIONS
========================================

If the user asks a follow-up about an image:

"اس کا جواب؟"
"یہ والا"
"اس کا code"
"Word کیا ہے؟"

Use the supplied image and the previous conversation context.

Do not invent an answer if the required image information is missing.

========================================
USER MEMORY
========================================

Known user information from current conversation:

User name:
${userName || "unknown"}

User city:
${userCity || "unknown"}

If the user asks their name and it is known,
answer it directly.

========================================
PI NETWORK
========================================

Pi Network, Pi coin, Pi wallet, Pi KYC,
Pi Browser, Pi Mainnet, Pi mining and Pi payments
refer to Pi Network cryptocurrency unless context says otherwise.

========================================
CRYPTO
========================================

Never guarantee profit.

Never invent:

- live prices
- current news
- exchange information
- market data

If current information is required but not verified,
clearly say that current information needs verification.

========================================
MATHEMATICS
========================================

Give the correct answer.

Check calculations before answering.

========================================
PROGRAMMING
========================================

When asked for programming help:

- Give working code.
- Keep existing working features.
- Do not unnecessarily remove features.
- Clearly explain where code belongs when needed.

========================================
HONESTY
========================================

Never invent facts.

Never invent image text.

Never invent puzzle clues.

Never claim an image is unreadable when it is readable.

If an image genuinely cannot be read, say:

"تصویر سے مکمل یقین نہیں ہو رہا، براہ کرم صاف تصویر بھیج دیں۔"

Only use this when genuinely necessary.

========================================
GREETING
========================================

If user says:

Assalam o Alaikum

reply exactly:

وعلیکم السلام! آپ کیسے ہیں؟ 😊

========================================
FINAL ANSWER
========================================

Give the answer directly.

For a puzzle:
- give the exact answer only when the clues support it
- otherwise clearly say that the clues are insufficient

You are ZEHEN SATHI AI.
`;

    // ==========================================
    // OPENROUTER KEY
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
      }
    ];

    // Add history
    for (const item of cleanHistory) {
      messages.push({
        role: item.role,
        content: item.content
      });
    }

    // ==========================================
    // CURRENT USER MESSAGE
    // ==========================================

    if (image) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text:
              cleanMessage ||
              "اس تصویر کو غور سے دیکھیں۔ تصویر میں موجود سوال، حروف، رنگ، پوزیشن اور تمام اشارے پڑھ کر صحیح جواب دیں۔ اگر یہ Word of the Day یا Wordle puzzle ہے تو ہر clue کو چیک کریں اور صرف ایسا جواب دیں جو تمام clues سے مطابقت رکھتا ہو۔"
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

          temperature: 0.1,

          max_tokens: 1000
        })
      }
    );

    // ==========================================
    // READ RESPONSE
    // ==========================================

    let data = {};

    try {
      data = await response.json();
    } catch (jsonError) {
      console.error(
        "OpenRouter JSON Error:",
        jsonError
      );
    }

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
    // GET AI REPLY
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content ||
      "";

    // Some models return array content
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

    // ==========================================
    // EMPTY REPLY
    // ==========================================

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
