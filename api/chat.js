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
      typeof body.image === "string" &&
      body.image.trim()
        ? body.image.trim()
        : null;

    // ==========================================
    // VALIDATE
    // ==========================================

    if (!message && !image) {
      return res.status(400).json({
        reply: "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
      });
    }

    // ==========================================
    // API KEY
    // ==========================================

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is missing");

      return res.status(500).json({
        reply:
          "❌ OpenRouter API Key موجود نہیں ہے۔ Vercel Environment Variables میں OPENROUTER_API_KEY چیک کریں۔"
      });
    }

    // ==========================================
    // CLEAN HISTORY
    // ==========================================

    const cleanHistory = history
      .filter(item => {
        return (
          item &&
          (item.role === "user" ||
            item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.trim()
        );
      })
      .slice(-20)
      .map(item => ({
        role: item.role,
        content: item.content.trim()
      }));

    // ==========================================
    // SYSTEM PROMPT
    // ==========================================

    const systemMessage = `
You are ZEHEN SATHI AI.

You are a reliable ChatGPT-style assistant.

IMPORTANT:
When an image is supplied, you MUST carefully inspect the image
and answer the user's actual question from the image.

Do NOT guess image information.

========================================
LANGUAGE
========================================

If user writes Urdu script:
Reply in natural Urdu script.

If user writes Roman Urdu:
Understand it and reply in proper Urdu script.

If user writes English:
Reply in natural English.

Do not randomly mix languages.

========================================
IMAGE ANALYSIS
========================================

When an image is provided, carefully inspect:

- all visible letters
- all visible words
- numbers
- colors
- green letters
- yellow letters
- grey letters
- positions of letters
- word length
- previous guesses
- puzzle clues
- buttons
- labels
- questions

The image may contain a Wordle-style crypto puzzle.

For Wordle-style puzzles:

GREEN:
Letter is correct and in the correct position.

YELLOW:
Letter exists in the answer but is in the wrong position.

GREY:
Normally the letter is not in the answer.

You MUST check every letter and every position.

You MUST also consider repeated letters.

Never invent colors or letters.

If the image gives enough information for a likely answer,
give the best answer directly.

If there are several possibilities, clearly say that the answer
is not 100% certain and give the strongest candidates.

If the user asks "Cod batao" or "answer batao",
give the actual word first.

========================================
GENERAL ANSWERS
========================================

Answer directly.

Do not repeat the user's question.

Do not make up facts.

If uncertain, say so.

========================================
MATH
========================================

Calculate carefully.

Check calculations before answering.

========================================
PROGRAMMING
========================================

Give complete working code when requested.

Do not remove useful existing functionality.

Never expose API keys.

========================================
PI NETWORK
========================================

Never invent payment status,
transaction status,
wallet information,
or Pi Network information.

========================================
CRYPTO
========================================

Never guarantee profit.

Never invent live prices,
listings,
news,
or transaction status.

========================================
GREETING
========================================

If user says:

Assalam o Alaikum

reply:

وعلیکم السلام! آپ کیسے ہیں؟ 😊

========================================
FINAL RULE
========================================

Be accurate, direct and useful.

For image puzzles, inspect the image carefully before answering.

You are ZEHEN SATHI AI.
`;

    // ==========================================
    // BUILD MESSAGES
    // ==========================================

    const messages = [
      {
        role: "system",
        content: systemMessage
      }
    ];

    // ==========================================
    // HISTORY
    // ==========================================

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
              message ||
              "اس تصویر کو غور سے دیکھیں اور تصویر میں موجود سوال یا Wordle puzzle کا صحیح جواب دیں۔"
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

    const openRouterResponse = await fetch(
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
          model: model,
          messages: messages,
          temperature: 0.1,
          max_tokens: 1500
        })
      }
    );

    // ==========================================
    // READ RESPONSE
    // ==========================================

    let data = {};

    try {
      data =
        await openRouterResponse.json();
    } catch (error) {
      console.error(
        "OpenRouter JSON error:",
        error
      );

      return res.status(502).json({
        reply:
          "❌ AI Server سے درست جواب موصول نہیں ہوا۔"
      });
    }

    // ==========================================
    // API ERROR
    // ==========================================

    if (!openRouterResponse.ok) {
      console.error(
        "OpenRouter Error:",
        JSON.stringify(data)
      );

      const apiError =
        data?.error?.message ||
        data?.error?.code ||
        "OpenRouter request failed.";

      return res.status(
        openRouterResponse.status
      ).json({
        reply:
          `❌ AI Server Error: ${apiError}`
      });
    }

    // ==========================================
    // GET AI REPLY
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content ||
      "";

    // ==========================================
    // ARRAY RESPONSE SUPPORT
    // ==========================================

    if (Array.isArray(reply)) {
      reply = reply
        .map(part => {
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
    // REMOVE THINKING TAGS
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
      reply: reply
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
