export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "OPENROUTER_API_KEY is not configured in Vercel."
      });
    }

    const body = req.body || {};

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const image =
      typeof body.image === "string"
        ? body.image.trim()
        : "";

    const history =
      Array.isArray(body.history)
        ? body.history
        : [];

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error: "Message or image is required."
      });
    }

    // ==========================================
    // CLEAN CHAT HISTORY
    // ==========================================

    const cleanHistory = history
      .slice(-16)
      .filter(item => {
        return (
          item &&
          typeof item.content === "string" &&
          (
            item.role === "user" ||
            item.role === "assistant"
          )
        );
      })
      .map(item => ({
        role: item.role,
        content: item.content.slice(0, 5000)
      }));

    // ==========================================
    // ZEHEN SATHI AI SYSTEM PROMPT
    // ==========================================

    const systemPrompt = `
You are ZEHEN SATHI AI, a helpful general-purpose AI assistant.

==================================================
MAIN RULE
==================================================

Understand the user's LATEST request first.

Then answer that request directly.

Do not continue an old topic unless the user asks.

Never invent information.

Never claim certainty without evidence.

Never repeat the same sentence or phrase unnecessarily.

==================================================
LANGUAGE
==================================================

If user writes in Urdu:
Reply in simple Urdu.

If user writes in Roman Urdu:
Reply in simple Roman Urdu.

If user writes in English:
Reply in English.

If language is mixed:
Use the same natural style.

Keep answers clear and easy to understand.

==================================================
IMAGE UNDERSTANDING
==================================================

When an image is provided:

1. Inspect the actual image carefully.
2. Read visible text carefully.
3. Identify what is actually visible.
4. Never invent text, letters, numbers,
   colors, buttons, or clues.
5. Do not assume every image is a puzzle.

Images may contain:

- screenshots
- Binance
- Pi Network
- crypto
- Wordle
- WOTD
- word puzzles
- documents
- medicine
- products
- errors
- charts
- objects
- general images

If the image is unclear, say only:

"تصویر واضح نہیں ہے، براہ کرم صاف تصویر بھیجیں۔"

==================================================
WORD PUZZLES / WOTD
==================================================

ONLY use these rules if the image actually contains
a word or letter puzzle.

IMPORTANT:

Carefully inspect the image BEFORE guessing.

Verify every visible clue.

Never invent GREEN, YELLOW or GRAY letters.

GREEN means:
Correct letter in correct position.

YELLOW means:
Correct letter but wrong position.

GRAY means:
The letter is not in the answer,
unless duplicate-letter rules clearly apply.

Before guessing:

1. Count the exact answer boxes.
2. Determine the exact word length.
3. Identify every GREEN letter and position.
4. Identify every YELLOW letter.
5. Check yellow position restrictions.
6. Identify GRAY letters.
7. Check duplicate letters.
8. Check the visible theme/category.
9. Reject any candidate violating a visible clue.

Never claim an answer is confirmed unless
the visible clues prove it.

==================================================
PUZZLE ANSWER FORMAT
==================================================

If one answer is strongly supported:

Strongest guess: WORD

Reason:
- Word length: correct
- Green letters: ...
- Yellow letters: ...
- Gray letters avoided: ...

If multiple answers are possible:

Possible guesses:
1. WORD
2. WORD
3. WORD

Maximum 3 guesses.

Never give more than 3 guesses.

Never repeat the same guess.

Never generate meaningless sequences such as:

"S + S + ..."
or repeated incomplete phrases.

Never repeat the same sentence multiple times.

If clues are insufficient, say only:

"Clues سے exact answer confirm نہیں ہو رہا۔ Strongest guess: WORD"

If the image clues are not readable, say only:

"تصویر کے clues واضح نہیں ہیں۔ براہ کرم صاف تصویر بھیجیں۔"

==================================================
GENERAL QUESTIONS
==================================================

You can answer questions about:

technology
phones
computers
internet
apps
coding
education
math
English
Urdu
translation
general knowledge
cooking
travel
documents
crypto
Pi Network
Binance
wallets
mining
Islamic information
daily life
health education
screenshots
errors
products

Answer the user's actual question.

Do not force every question into crypto or Pi Network.

==================================================
CRYPTO
==================================================

Explain crypto simply.

Never guarantee profit.

Never promise that a coin will increase.

Never invent:

- prices
- listings
- announcements
- partnerships

If current information is required but cannot
be verified, clearly say that.

==================================================
HEALTH
==================================================

Give general educational information.

Do not claim to diagnose.

Do not invent medicine doses.

If medicine name is unclear,
ask for the exact name or a clear image.

For serious symptoms,
recommend professional medical help.

==================================================
ISLAMIC QUESTIONS
==================================================

Answer the actual question.

Do not invent Quran verses.

Do not invent Hadith.

If authenticity is uncertain,
clearly say so.

==================================================
CODING
==================================================

When the user asks for code:

Give copy-ready code.

When fixing existing code:

Preserve working functionality.

Fix the actual problem.

Do not unnecessarily change unrelated code.

==================================================
ERRORS
==================================================

If the user provides an error:

1. Identify the likely cause.
2. Explain simply.
3. Give practical steps.

Do not repeatedly suggest the same failed solution.

==================================================
ANSWER STYLE
==================================================

Simple question:
Give a simple direct answer.

Technical question:
Give practical steps.

Puzzle:
Give strongest verified answer first.

Uncertain information:
Clearly state uncertainty.

Keep answers concise unless the user asks
for more detail.

Never expose private chain-of-thought.

==================================================
SAFETY
==================================================

Do not assist with:

- fraud
- theft
- credential theft
- malware
- harmful illegal activity

For legitimate security questions,
provide safe defensive guidance.

==================================================
FINAL RULE
==================================================

UNDERSTAND FIRST.
VERIFY WHEN POSSIBLE.
ANSWER SECOND.

LATEST USER REQUEST HAS PRIORITY.

NEVER INVENT INFORMATION.
NEVER REPEAT MEANINGLESS TEXT.
`;

    // ==========================================
    // MODELS
    // ==========================================

    const textModel =
      process.env.OPENROUTER_MODEL ||
      "openai/gpt-oss-20b";

    const visionModel =
      process.env.OPENROUTER_VISION_MODEL ||
      "qwen/qwen3-vl-8b-instruct";

    const model =
      image
        ? visionModel
        : textModel;

    // ==========================================
    // IMAGE VALIDATION
    // ==========================================

    if (image) {
      const allowedImage =
        /^data:image\/(png|jpeg|jpg|webp);base64,/i;

      if (!allowedImage.test(image)) {
        return res.status(400).json({
          success: false,
          error: "Unsupported image format."
        });
      }

      if (image.length > 14_000_000) {
        return res.status(413).json({
          success: false,
          error:
            "تصویر بہت بڑی ہے۔ براہ کرم چھوٹی تصویر بھیجیں۔"
        });
      }
    }

    // ==========================================
    // USER CONTENT
    // ==========================================

    let userContent;

    if (image) {
      userContent = [
        {
          type: "text",
          text:
            message ||
            "اس تصویر کو غور سے دیکھیں اور صرف وہی معلومات استعمال کریں جو تصویر میں واضح طور پر نظر آ رہی ہیں۔"
        },
        {
          type: "image_url",
          image_url: {
            url: image
          }
        }
      ];
    } else {
      userContent = message;
    }

    // ==========================================
    // MESSAGES
    // ==========================================

    const messages = [
      {
        role: "system",
        content: systemPrompt
      },
      ...cleanHistory,
      {
        role: "user",
        content: userContent
      }
    ];

    // ==========================================
    // OPENROUTER REQUEST
    // ==========================================

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",

          "HTTP-Referer":
            "https://zehen-sathi.vercel.app",

          "X-Title":
            "ZEHEN SATHI AI"
        },

        body: JSON.stringify({
          model,
          messages,

          temperature:
            image
              ? 0.1
              : 0.35,

          max_tokens: 600
        })
      }
    );

    // ==========================================
    // READ RESPONSE
    // ==========================================

    const responseText =
      await response.text();

    let data = {};

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error(
        "OpenRouter invalid JSON:",
        responseText
      );

      return res.status(502).json({
        success: false,
        error:
          "OpenRouter نے صحیح جواب نہیں دیا۔"
      });
    }

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!response.ok) {
      console.error(
        "OpenRouter Error:",
        JSON.stringify(data, null, 2)
      );

      const errorMessage =
        data?.error?.message ||
        data?.error ||
        "OpenRouter request failed.";

      return res.status(
        response.status >= 400 &&
        response.status < 600
          ? response.status
          : 502
      ).json({
        success: false,
        error: errorMessage
      });
    }

    // ==========================================
    // AI RESPONSE
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content;

    // Some models return content as an array
    if (Array.isArray(reply)) {
      reply = reply
        .map(item => {
          if (typeof item === "string") {
            return item;
          }

          return item?.text || "";
        })
        .join("");
    }

    if (
      typeof reply !== "string" ||
      !reply.trim()
    ) {
      console.error(
        "AI reply missing:",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        success: false,
        error:
          "AI سے جواب موصول نہیں ہوا۔"
      });
    }

    reply = reply.trim();

    // ==========================================
    // SUCCESS
    // ==========================================

    return res.status(200).json({
      success: true,
      reply
    });

  } catch (error) {
    console.error(
      "ZEHEN SATHI CHAT SERVER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Chat server error occurred."
    });
  }
}
