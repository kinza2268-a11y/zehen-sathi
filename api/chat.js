export default async function handler(req, res) {
  // ==========================================
  // METHOD
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed"
    });
  }

  try {
    // ==========================================
    // REQUEST DATA
    // ==========================================

    const body = req.body || {};

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const history =
      Array.isArray(body.history)
        ? body.history
        : [];

    const image =
      typeof body.image === "string" && body.image.trim()
        ? body.image.trim()
        : null;

    // ==========================================
    // VALIDATE INPUT
    // ==========================================

    if (!message && !image) {
      return res.status(400).json({
        reply:
          "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
      });
    }

    // ==========================================
    // API KEY
    // ==========================================

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error(
        "OPENROUTER_API_KEY is missing"
      );

      return res.status(500).json({
        reply:
          "❌ OpenRouter API Key موجود نہیں ہے۔ Vercel Environment Variables میں OPENROUTER_API_KEY چیک کریں۔"
      });
    }

    // ==========================================
    // CLEAN HISTORY
    // ==========================================

    const cleanHistory = history
      .filter((item) => {
        return (
          item &&
          (item.role === "user" ||
            item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.trim().length > 0
        );
      })
      .slice(-20)
      .map((item) => ({
        role: item.role,
        content: item.content.trim()
      }));

    // ==========================================
    // USER MEMORY
    // ==========================================

    let userName = "";
    let userCity = "";

    const allUserMessages = [
      ...cleanHistory.filter(
        (item) => item.role === "user"
      ),
      ...(message
        ? [
            {
              role: "user",
              content: message
            }
          ]
        : [])
    ];

    for (const item of allUserMessages) {
      const text =
        item.content.trim();

      // ----------------------------------------
      // NAME — ROMAN URDU
      // ----------------------------------------

      const romanName = text.match(
        /^mera\s+(?:nam|naam|name)\s+([A-Za-z][A-Za-z'-]*)(?:\s+(?:hai|hy|he))?[؟?]?\s*$/i
      );

      if (romanName?.[1]) {
        userName =
          romanName[1].trim();
      }

      // ----------------------------------------
      // NAME — URDU
      // ----------------------------------------

      const urduName = text.match(
        /^میرا\s+نام\s+([\u0600-\u06FF]+)(?:\s+ہے)?[؟?]?\s*$/
      );

      if (urduName?.[1]) {
        userName =
          urduName[1].trim();
      }

      // ----------------------------------------
      // CITY — ROMAN URDU
      // ----------------------------------------

      const romanCity = text.match(
        /^(?:me|main|mein)\s+([A-Za-z][A-Za-z\s-]{1,40}?)\s+(?:me|mein)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i
      );

      if (romanCity?.[1]) {
        userCity =
          romanCity[1].trim();
      }

      // ----------------------------------------
      // CITY — URDU
      // ----------------------------------------

      const urduCity = text.match(
        /^میں\s+([\u0600-\u06FF\s-]{2,40}?)\s+میں\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?\s*$/
      );

      if (urduCity?.[1]) {
        userCity =
          urduCity[1].trim();
      }
    }

    // ==========================================
    // NAME QUESTION
    // ==========================================

    const askingName =
      /^(?:mera\s+(?:nam|naam|name)\s+kia\s+(?:hai|hy|he)|mera\s+kia\s+(?:nam|naam|name)\s+(?:hai|hy|he)|what\s+is\s+my\s+name|my\s+name\s+kia\s+hai)[؟?]?\s*$/i.test(
        message
      ) ||
      /^میرا\s+(?:نام\s+کیا\s+ہے|کیا\s+نام\s+ہے)[؟?]?\s*$/.test(
        message
      );

    if (askingName && userName) {
      return res.status(200).json({
        reply:
          `آپ کا نام ${userName} ہے۔ 😊`
      });
    }

    // ==========================================
    // CITY QUESTION
    // ==========================================

    const askingLocation =
      /^(?:me|main|mein)\s+(?:kahan|kis\s+jaga|kis\s+jagah)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i.test(
        message
      ) ||
      /^where\s+do\s+i\s+live[؟?]?\s*$/i.test(
        message
      ) ||
      /^میں\s+(?:کہاں|کس\s+جگہ)\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)[؟?]?\s*$/.test(
        message
      );

    if (askingLocation && userCity) {
      return res.status(200).json({
        reply:
          `آپ ${userCity} میں رہتی ہیں۔ 😊`
      });
    }

    // ==========================================
    // SYSTEM PROMPT
    // ==========================================

    const systemMessage = `
You are ZEHEN SATHI AI, a helpful general-purpose AI assistant.

Your goal is to behave like a reliable ChatGPT-style assistant:
understand the user's intent, remember the current conversation,
analyze images when provided, solve problems carefully, and give
direct useful answers.

========================================
LANGUAGE
========================================

1. Urdu script -> reply in natural Urdu script.
2. Roman Urdu -> understand it and reply in proper Urdu script.
3. English -> reply in natural English.
4. Do not randomly mix languages.
5. Technical names, proper names, crypto names and programming
   keywords may remain in English when necessary.

========================================
GENERAL ANSWERS
========================================

- Understand the actual intent.
- Answer directly.
- Be helpful and clear.
- Do not repeat the question unnecessarily.
- Do not invent facts.
- If information is uncertain, say so.
- For current/live information, never pretend that old knowledge
  is current.
- If browsing or verification is unavailable, clearly say that
  current information needs verification.

========================================
CONVERSATION MEMORY
========================================

Use the supplied conversation history.

Remember useful information that appears in the current conversation,
such as the user's name, city, preferences, previous question,
previous answer and ongoing task.

Do not invent memory.

Known name:
${userName || "unknown"}

Known city:
${userCity || "unknown"}

========================================
IMAGE UNDERSTANDING
========================================

If an image is provided, inspect it carefully before answering.

Read:
- visible text
- numbers
- letters
- colors
- positions
- buttons
- labels
- symbols
- questions
- clues
- word length
- previous guesses

Do not say the image is unclear unless it is genuinely unreadable.

If the image is readable, answer from the image.

========================================
WORDLE / WORD OF THE DAY / PUZZLES
========================================

For word puzzles:

1. Identify exact word length.
2. Check every previous guess.
3. GREEN = exact letter and exact position.
4. YELLOW = letter exists but cannot remain in that position.
5. GREY = normally not present.
6. Check repeated letters.
7. Check every clue before answering.

Never invent colors, letters or clues.

If one answer is not certain, say:

"ان اشاروں سے ایک ہی جواب یقینی طور پر طے نہیں ہو رہا۔ مزید کوشش کی تصویر بھیج دیں۔"

Do not present an unsupported guess as certain.

========================================
MATHEMATICS
========================================

Solve carefully.

Check calculations before answering.

For multi-step problems, show useful steps when needed.

========================================
PROGRAMMING
========================================

When helping with code:

- provide working code;
- preserve existing useful features;
- do not remove functionality unnecessarily;
- identify the correct file;
- explain where code belongs when necessary;
- consider common browser, Vercel and API errors;
- never expose API keys in frontend code.

========================================
PI NETWORK
========================================

Pi Network, Pi Browser, Pi Wallet, Pi KYC,
Pi Mainnet, Pi payments and Pi SDK refer to
Pi Network unless the context clearly means something else.

Never invent Pi transaction status or wallet information.

========================================
CRYPTO
========================================

Never guarantee profit.

Never invent:
- live prices
- exchange status
- current listings
- current news
- transaction status
- market data

Clearly distinguish facts from assumptions.

========================================
SAFETY AND HONESTY
========================================

Never pretend to have seen information that was not supplied.

Never fabricate image text.

Never fabricate puzzle clues.

Never claim a transaction succeeded unless verified.

Never expose private API keys or secrets.

========================================
GREETING
========================================

If the user says:

Assalam o Alaikum

reply exactly:

وعلیکم السلام! آپ کیسے ہیں؟ 😊

========================================
FINAL STYLE
========================================

Be useful, accurate and direct.

Answer first.

Add explanation only when it helps.

You are ZEHEN SATHI AI.
`;

    // ==========================================
    // BUILD OPENROUTER MESSAGES
    // ==========================================

    const messages = [
      {
        role: "system",
        content: systemMessage
      }
    ];

    // ------------------------------------------
    // HISTORY
    // ------------------------------------------

    for (const item of cleanHistory) {
      messages.push({
        role: item.role,
        content: item.content
      });
    }

    // ==========================================
    // CURRENT MESSAGE
    // ==========================================

    if (image) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text:
              message ||
              "اس تصویر کو غور سے دیکھیں اور تصویر میں موجود سوال کا صحیح جواب دیں۔"
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
        content: message
      });
    }

    // ==========================================
    // MODEL
    // ==========================================

    const model =
      "google/gemini-2.5-flash";

    // ==========================================
    // OPENROUTER REQUEST
    // ==========================================

    const openRouterResponse =
      await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

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

            max_tokens: 1500
          })
        }
      );

    // ==========================================
    // RESPONSE JSON
    // ==========================================

    let data = {};

    try {
      data =
        await openRouterResponse.json();
    } catch (error) {
      console.error(
        "OpenRouter JSON parse error:",
        error
      );

      return res.status(502).json({
        reply:
          "❌ AI Server سے درست جواب موصول نہیں ہوا۔"
      });
    }

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!openRouterResponse.ok) {
      console.error(
        "OpenRouter error:",
        JSON.stringify(data)
      );

      const apiError =
        data?.error?.message ||
        data?.error?.code ||
        "OpenRouter request failed.";

      return res.status(
        openRouterResponse.status >= 400 &&
        openRouterResponse.status < 600
          ? openRouterResponse.status
          : 500
      ).json({
        reply:
          `❌ AI Server Error: ${apiError}`
      });
    }

    // ==========================================
    // EXTRACT REPLY
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content ||
      "";

    // Some providers may return array content
    if (Array.isArray(reply)) {
      reply = reply
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }

          return (
            part?.text ||
            part?.content ||
            ""
          );
        })
        .join("");
    }

    // ==========================================
    // CLEAN THINKING TAGS
    // ==========================================

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
    // EMPTY RESPONSE
    // ==========================================

    if (!reply) {
      reply =
        "معذرت، ابھی AI سے جواب موصول نہیں ہوا۔ براہ کرم دوبارہ کوشش کریں۔";
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.error(
      "ZEHEN SATHI API ERROR:",
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
