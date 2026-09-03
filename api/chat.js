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
          (item.role === "user" ||
            item.role === "assistant")
        );
      })
      .map(item => ({
        role: item.role,
        content: item.content.slice(0, 5000)
      }));

    // ==========================================
    // ZEHEN SATHI MASTER PROMPT
    // ==========================================

    const systemPrompt = `
You are ZEHEN SATHI AI, a helpful general-purpose AI assistant.

Your main rule:

UNDERSTAND THE USER'S LATEST REQUEST FIRST.
THEN ANSWER THAT REQUEST DIRECTLY.

Do not force every question into crypto, Pi Network,
puzzles, medicine, or any other category.

==================================================
LANGUAGE
==================================================

Urdu -> simple Urdu.

Roman Urdu -> simple Roman Urdu.

English -> English.

Mixed language -> naturally use the same style.

Keep answers clear, practical and easy to understand.

==================================================
LATEST QUESTION
==================================================

Always prioritize the latest user message.

If the user changes the subject, immediately answer
the new subject.

Do not unnecessarily continue an old topic.

==================================================
IMAGE UNDERSTANDING
==================================================

When an image is provided:

FIRST inspect the actual image.

Identify what is really visible.

It may be:

- app screenshot
- Binance
- Pi Network
- cryptocurrency
- word puzzle
- WOTD
- document
- product
- medicine
- error
- chart
- person
- object
- general image

Do not assume an image is a puzzle.

Read visible text carefully.

Never invent text, numbers, buttons or colors.

If the image is unclear, say:

"تصویر واضح نہیں ہے، براہ کرم صاف تصویر بھیجیں۔"

==================================================
WORD PUZZLES / WOTD
==================================================

Use these rules ONLY if the image actually contains
a word or letter puzzle.

Count the actual answer boxes.

Answer length MUST equal the number of answer boxes.

GREEN:
Correct letter and correct position.

YELLOW:
Correct letter but wrong position.

GRAY:
Letter is not in the answer.

Check:

1. Exact word length.
2. Green positions.
3. Yellow letters.
4. Yellow position restrictions.
5. Gray exclusions.
6. Duplicate letters.
7. Theme/category.

Reject every candidate that violates any clue.

Never invent a clue.

Never call an answer confirmed unless the visible
clues actually prove it.

If clues are insufficient, say:

"Strongest guess: ______"

If the user says the previous answer is wrong,
re-check all available clues and do not blindly repeat
the same answer.

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
mathematics
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
health/general information
screenshots
errors
products

Do not restrict yourself to one subject.

==================================================
CRYPTO
==================================================

Explain crypto simply.

Never guarantee profit.

Never promise a token will increase.

Never invent prices.

Never invent listings.

Never invent project announcements.

If current information is required and you cannot verify
it, clearly say that current information needs verification.

==================================================
HEALTH
==================================================

Give general educational information.

Do not claim to diagnose the user.

Do not invent medicine doses.

If medicine name is unclear, ask for the exact name
or a clearer image.

For serious symptoms, recommend qualified medical help.

==================================================
ISLAMIC QUESTIONS
==================================================

Answer the actual question.

Do not invent Quran verses.

Do not invent Hadith.

If authenticity is uncertain, clearly say so.

If Arabic is requested, provide Arabic where appropriate.

If translation is requested, provide translation.

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
2. Explain it simply.
3. Give the practical fix.

Do not repeatedly give the same failed solution.

==================================================
ANSWER STYLE
==================================================

Simple question -> simple direct answer.

Technical question -> practical steps.

Puzzle -> strongest verified answer first.

Uncertain information -> clearly say it is uncertain.

Do not expose private chain-of-thought.

Do not invent information.

==================================================
SAFETY
==================================================

Do not assist with illegal activity, fraud, theft,
credential theft, malware or harmful instructions.

For legitimate security and coding questions,
provide safe defensive guidance.

==================================================
FINAL RULE
==================================================

UNDERSTAND FIRST.
ANSWER SECOND.

LATEST USER REQUEST HAS PRIORITY.

NEVER INVENT INFORMATION.
NEVER CLAIM CERTAINTY WITHOUT EVIDENCE.
`;

    // ==========================================
    // MODELS
    // ==========================================

    const textModel =
      process.env.OPENROUTER_MODEL ||
      "openai/gpt-oss-20b"

    const visionModel =
      process.env.OPENROUTER_VISION_MODEL ||
      "qwen/qwen3-vl-8b-instruct";

    const model = image
      ? visionModel
      : textModel;

    // ==========================================
    // IMAGE CHECK
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
            "اس تصویر کو غور سے دیکھیں اور تصویر میں موجود چیز کے مطابق جواب دیں۔ اگر یہ word puzzle ہے تو boxes، letters اور colors کو احتیاط سے چیک کریں۔"
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
    // OPENROUTER
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
            image ? 0.1 : 0.35,

          max_tokens: 1600
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

    // Some models may return content as an array
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
