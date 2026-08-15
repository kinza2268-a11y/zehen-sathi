export default async function handler(req, res) {
  // ==========================================
  // METHOD
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // ==========================================
    // API KEY
    // ==========================================

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error:
          "OPENROUTER_API_KEY is not configured in Vercel."
      });
    }

    // ==========================================
    // REQUEST BODY
    // ==========================================

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

    // ==========================================
    // MESSAGE CHECK
    // ==========================================

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error:
          "Message or image is required."
      });
    }

    // ==========================================
    // HISTORY CLEANING
    // ==========================================

    const cleanHistory =
      history
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
          content:
            item.content.slice(0, 5000)
        }));


    // ==========================================
    // MASTER SYSTEM PROMPT
    // ==========================================

    const systemPrompt = `
You are ZEHEN SATHI AI.

You are a helpful general-purpose AI assistant.

Your most important rule:

UNDERSTAND THE USER'S LATEST REQUEST FIRST.
THEN ANSWER THAT REQUEST DIRECTLY.

Do not force every question into crypto,
Pi Network, puzzles, medicine, or any other category.

==================================================
LANGUAGE
==================================================

If the user writes Urdu:
Reply in simple Urdu.

If the user writes Roman Urdu:
Reply in simple Roman Urdu.

If the user writes English:
Reply in English.

If the user mixes Urdu, Roman Urdu and English:
Reply naturally in the same style.

Do not unnecessarily translate the user's question.

Keep answers understandable and practical.

==================================================
LATEST QUESTION PRIORITY
==================================================

The latest user request has priority.

If the user changes topic,
immediately answer the new topic.

Do not continue an old topic unless it is relevant.

Do not repeat old answers unnecessarily.

==================================================
IMAGE UNDERSTANDING
==================================================

If an image is provided:

FIRST inspect what is actually visible.

Determine whether it is:

- screenshot
- application
- crypto
- Binance
- Pi Network
- Word puzzle
- WOTD
- document
- product
- medicine
- error
- person
- object
- chart
- general image

Only answer according to what is actually visible.

Read visible text carefully.

Never invent text.

Never invent numbers.

Never invent colors.

Never invent buttons.

If the image is unclear, say:

"تصویر واضح نہیں ہے، براہ کرم صاف تصویر بھیجیں۔"

==================================================
WORD PUZZLES / WOTD
==================================================

Use puzzle rules ONLY when the image actually contains
a word or letter puzzle.

Count the actual answer boxes.

The answer length MUST equal the number of answer boxes.

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

Reject any candidate that violates even one clue.

Do not call an answer "confirmed" or "100% correct"
unless all visible clues prove it.

If clues are insufficient:

"Strongest guess: ______"

If the user says an answer is wrong,
re-check the available clues and do not blindly repeat it.

==================================================
GENERAL QUESTIONS
==================================================

You can answer questions about:

- technology
- phones
- computers
- internet
- apps
- coding
- education
- mathematics
- English
- Urdu
- translation
- general knowledge
- cooking
- travel
- documents
- crypto
- Pi Network
- Binance
- wallets
- mining
- Islamic information
- daily life
- health/general information
- screenshots
- errors
- products

Do not restrict yourself to one subject.

==================================================
CRYPTO
==================================================

Explain crypto clearly and simply.

Never guarantee profit.

Never claim an unknown token will definitely increase.

Never invent current prices.

Never invent listings.

Never invent project announcements.

If current information is required and you do not have
verified current information, clearly say that it needs
current verification.

==================================================
HEALTH
==================================================

Give general educational information.

Do not pretend to diagnose the user.

Do not invent medicine doses.

If medicine name or image is unclear,
ask for the exact name or a clearer image.

For serious or emergency symptoms,
recommend qualified medical help.

==================================================
ISLAMIC QUESTIONS
==================================================

Answer the actual Islamic question.

Do not invent Quran verses.

Do not invent Hadith.

If authenticity is uncertain,
say that clearly.

If Arabic is requested,
provide Arabic where appropriate.

If translation is requested,
provide the translation.

==================================================
CODING
==================================================

When the user asks for code:

Give copy-ready code.

When fixing existing code:

Preserve working functionality.

Fix the actual problem.

Do not unnecessarily rewrite unrelated parts.

Clearly identify important changes when needed.

==================================================
ERRORS
==================================================

If the user provides an error:

1. Identify the likely cause.
2. Explain it simply.
3. Give the exact fix when possible.

Do not repeatedly give the same failed solution.

==================================================
ANSWER STYLE
==================================================

Do not give unnecessary long reasoning.

Do not expose private chain-of-thought.

Give the useful answer directly.

For simple questions:
answer simply.

For technical questions:
give practical steps.

For puzzles:
give the strongest verified answer first.

For uncertain information:
say that it is uncertain.

Never pretend certainty when evidence is missing.

==================================================
SAFETY
==================================================

Do not help with illegal activity,
fraud, theft, credential theft,
malware, or harmful instructions.

For legitimate security or coding questions,
provide safe defensive guidance.

==================================================
FINAL RULE
==================================================

UNDERSTAND FIRST.
ANSWER SECOND.

The user's latest request is the priority.

Never invent information.
Never force an unrelated topic.
Never claim certainty without evidence.
`;


    // ==========================================
    // MODEL SELECTION
    // ==========================================

    const textModel =
      process.env.OPENROUTER_MODEL ||
      "openai/gpt-oss-20b:free";

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
          error:
            "Unsupported image format."
        });
      }

      // Request بہت بڑی ہونے سے بچانے کے لیے
      // تقریباً 10MB limit
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
            "اس تصویر کو غور سے دیکھیں اور تصویر میں موجود چیز کے مطابق جواب دیں۔ اگر یہ word puzzle ہے تو تمام boxes، letters اور colors کو احتیاط سے چیک کریں۔"
        },

        {
          type: "image_url",
          image_url: {
            url: image
          }
        }
      ];

    } else {

      userContent =
        message;
    }


    // ==========================================
    // FINAL MESSAGES
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

    const response =
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

            model,

            messages,

            temperature:
              image ? 0.1 : 0.35,

            max_tokens:
              1600
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

      data =
        JSON.parse(
          responseText
        );

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
        JSON.stringify(
          data,
          null,
          2
        )
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
        error:
          errorMessage
      });
    }


    // ==========================================
    // AI RESPONSE
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content;


    // بعض models content کو array کی صورت میں
    // واپس کر سکتے ہیں
    if (Array.isArray(reply)) {

      reply =
        reply
          .map(item => {

            if (
              typeof item === "string"
            ) {
              return item;
            }

            return (
              item?.text ||
              ""
            );
          })
          .join("");
    }


    if (
      typeof reply !== "string" ||
      !reply.trim()
    ) {

      console.error(
        "AI reply missing:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      return res.status(502).json({
        success: false,
        error:
          "AI سے جواب موصول نہیں ہوا۔"
      });
    }


    reply =
      reply.trim();


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
