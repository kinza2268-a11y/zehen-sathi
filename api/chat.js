
// ==========================================
// ZEHEN SATHI AI — API CHAT
// Vercel Serverless Function
// ==========================================

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
    // REQUEST BODY
    // ==========================================

    let body = req.body || {};

    // بعض صورتوں میں body string آ سکتی ہے
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (error) {
        body = {};
      }
    }

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
    // VALIDATION
    // ==========================================

    if (!message && !image) {
      return res.status(400).json({
        reply:
          "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
      });
    }


    // ==========================================
    // OPENROUTER API KEY
    // ==========================================

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {

      console.error(
        "ERROR: OPENROUTER_API_KEY is missing"
      );

      return res.status(500).json({
        reply:
          "❌ OPENROUTER_API_KEY موجود نہیں ہے۔ Vercel Environment Variables چیک کریں۔"
      });
    }


    // ==========================================
    // CLEAN HISTORY
    // ==========================================

    const cleanHistory = history
      .filter(item => {

        if (!item || typeof item !== "object") {
          return false;
        }

        if (
          item.role !== "user" &&
          item.role !== "assistant"
        ) {
          return false;
        }

        return (
          typeof item.content === "string" &&
          item.content.trim().length > 0
        );

      })
      .slice(-12)
      .map(item => ({
        role: item.role,
        content: item.content.trim()
      }));


    // ==========================================
    // SYSTEM PROMPT
    // ==========================================

    const systemMessage = `
You are ZEHEN SATHI AI.

You are a reliable ChatGPT-style AI assistant.

LANGUAGE RULES:

1. If the user writes Urdu script,
reply in natural Urdu script.

2. If the user writes Roman Urdu,
understand it and reply in proper Urdu script.

3. If the user writes English,
reply in natural English.

Do not randomly mix languages.

IMAGE RULES:

When an image is supplied, carefully inspect it.

For Wordle-style or crypto word puzzles:

GREEN:
The letter is correct and in the correct position.

YELLOW:
The letter exists in the answer but is in the wrong position.

GREY:
Normally the letter is not in the answer.

Always check:

- every visible letter
- every position
- green letters
- yellow letters
- grey letters
- repeated letters
- word length
- previous guesses
- puzzle clues

Never invent letters or colors.

If the user asks:
"Cod batao"
"code batao"
"answer batao"
"guess batao"

give the strongest answer directly first.

If there are several possibilities,
give the most likely answer and briefly explain the uncertainty.

GENERAL:

Answer directly and clearly.

Do not repeat the user's question.

Do not invent facts.

MATH:

Calculate carefully.

PROGRAMMING:

Give complete working code when requested.

Never expose API keys.

PI NETWORK:

Never invent payment status,
transaction status,
wallet information,
or Pi Network information.

CRYPTO:

Never guarantee profit.

Never invent live prices,
listings,
news,
or transaction status.

GREETING:

If the user says:

Assalam o Alaikum

reply:

وعلیکم السلام! آپ کیسے ہیں؟ 😊

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
    // ADD HISTORY
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

    let openRouterResponse;

    try {

      openRouterResponse =
        await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",

            headers: {
              "Authorization":
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

    } catch (fetchError) {

      console.error(
        "OPENROUTER FETCH ERROR:",
        fetchError
      );

      return res.status(502).json({
        reply:
          "❌ OpenRouter AI Server سے رابطہ نہیں ہو سکا۔ کچھ دیر بعد دوبارہ کوشش کریں۔"
      });

    }


    // ==========================================
    // READ OPENROUTER RESPONSE
    // ==========================================

    let data = {};

    const responseText =
      await openRouterResponse.text();


    try {

      data =
        responseText
          ? JSON.parse(responseText)
          : {};

    } catch (jsonError) {

      console.error(
        "OPENROUTER JSON ERROR:",
        responseText
      );

      return res.status(502).json({
        reply:
          "❌ AI Server نے درست جواب نہیں بھیجا۔"
      });

    }


    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!openRouterResponse.ok) {

      console.error(
        "OPENROUTER API ERROR:",
        JSON.stringify(data)
      );

      const apiError =
        data?.error?.message ||
        data?.error?.code ||
        "OpenRouter request failed.";

      return res.status(502).json({
        reply:
          `❌ AI Server Error: ${apiError}`
      });

    }


    // ==========================================
    // GET AI RESPONSE
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content ||
      "";


    // ==========================================
    // ARRAY RESPONSE
    // ==========================================

    if (Array.isArray(reply)) {

      reply =
        reply
          .map(part => {

            if (typeof part === "string") {
              return part;
            }

            if (
              part &&
              typeof part.text === "string"
            ) {
              return part.text;
            }

            if (
              part &&
              typeof part.content === "string"
            ) {
              return part.content;
            }

            return "";

          })
          .join("");

    }


    // ==========================================
    // REMOVE THINKING TAGS
    // ==========================================

    reply =
      String(reply)
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

      console.error(
        "EMPTY AI RESPONSE:",
        JSON.stringify(data)
      );

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

    // ==========================================
    // FINAL SERVER ERROR
    // ==========================================

    console.error(
      "ZEHEN SATHI /api/chat ERROR:",
      error
    );

    return res.status(500).json({
      reply:
        "❌ Server Error: " +
        (
          error?.message ||
          "Unknown server error"
        )
    });

  }

}
