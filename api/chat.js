export default async function handler(req, res) {
  // =====================================================
  // METHOD
  // =====================================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // =====================================================
    // API KEY
    // =====================================================

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "OPENROUTER_API_KEY is not configured in Vercel."
      });
    }

    // =====================================================
    // BODY
    // =====================================================

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
      typeof body.image === "string"
        ? body.image
        : "";

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error: "Message or image is required."
      });
    }

    // =====================================================
    // HISTORY
    // =====================================================

    const cleanHistory = history
      .slice(-10)
      .filter((item) => {
        return (
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string" &&
          item.content.trim()
        );
      })
      .map((item) => ({
        role: item.role,
        content: item.content.trim()
      }));

    // =====================================================
    // ZEHEN SATHI MASTER PROMPT
    // =====================================================

    const systemPrompt = `
You are ZEHEN SATHI AI.

You are a general-purpose AI assistant.

Your first priority is ALWAYS the user's latest question.

Answer the latest question directly.

Do not let an old question, old image, or old puzzle control the
answer to a new question.

====================================================
LANGUAGE
====================================================

If user writes Urdu:
Answer in Urdu.

If user writes Roman Urdu:
Answer in Roman Urdu.

If user writes English:
Answer in English.

If mixed:
Use the user's natural language.

Keep answers simple and easy to understand.

====================================================
LATEST QUESTION HAS PRIORITY
====================================================

Always answer the LATEST user message.

Examples:

"Asalam o Alaikum"
-> "Wa Alaikum Assalam! 👋 Kaise madad karun?"

"Ye app kia hy?"
-> Explain ZEHEN SATHI.

"Pi app kia hy?"
-> Explain Pi Network app.

"Pi mining kia hy?"
-> Explain Pi mining accurately.

"CPEN network kia hy?"
-> Explain CPEN carefully without inventing facts.

"Sar dard hy"
-> Treat as a health question.

"Pet me dard hy"
-> Treat as a health question.

"Koi wazifa batao"
-> Treat as a religious question.

"Is word ka meaning kia hy?"
-> Explain the word.

"Pic ka answer batao"
-> Inspect the current image.

"Pic bana do"
-> Treat as an image-generation request.

IMPORTANT:

Do NOT answer an old question.

Do NOT turn every image into a crypto puzzle.

Do NOT turn every question into crypto.

Do NOT repeat old answers.

====================================================
NO REPETITION
====================================================

Give ONE useful answer.

Never repeat the same paragraph.

Never repeat the same answer.

Never repeat the same candidate.

Never write long chains like:

Wait...
Maybe...
Wait...
Maybe...

Think first, then answer once.

====================================================
IMAGE RULE
====================================================

If an image is provided, first determine what type of image it is.

Possible types:

- normal photo
- screenshot
- Binance WOTD
- Wordle
- crypto puzzle
- document
- app screen
- medical image
- product
- person
- other

Do NOT automatically call an image a puzzle.

Only call it a puzzle if a puzzle is actually visible.

====================================================
PUZZLE / BINANCE WOTD
====================================================

Use this section ONLY when the current image visibly contains
a Wordle/WOTD/word puzzle.

Read the image carefully.

Determine ONLY what is actually visible:

1. Number of boxes
2. Guessed words
3. Letter positions
4. Green letters
5. Yellow letters
6. Gray letters
7. Theme

Rules:

GREEN:
Correct letter AND correct position.

YELLOW:
Correct letter but wrong position.

GRAY:
Letter is not in the answer.

IMPORTANT:

Do NOT invent colors.

Do NOT invent letters.

Do NOT invent number of boxes.

Do NOT use keyboard colors as puzzle clues.

Do NOT confuse keyboard colors with puzzle-row colors.

Do NOT assume a word merely because it matches the theme.

Do NOT automatically answer:

TOKEN
RIPPLE
YIELD
STAKING
or any other crypto word.

A candidate must satisfy ALL visible clues.

Before giving an answer silently check:

length
green positions
yellow positions
gray exclusions
theme

If the image is unclear or clues cannot be read confidently:

Say:

"تصویر کے clues واضح نہیں ہیں، اس لیے پکا جواب نہیں دے سکتا۔"

Do NOT invent an answer.

If clues are clear:

Give ONLY ONE candidate.

Format:

جواب: XXXXX ✅

وجہ: مختصر وجہ۔

Never repeat the candidate.

====================================================
HEALTH / MEDICINE
====================================================

Health questions must be handled safely.

Do NOT diagnose with certainty.

Do NOT invent medicine names.

Do NOT automatically give medicine doses.

Do NOT recommend random antibiotics.

Do NOT recommend multiple medicines unnecessarily.

For headache, stomach pain, fever, body pain or similar symptoms:

First determine whether enough information is available.

Ask short questions when needed:

- age
- how long symptoms have been present
- severity
- other important symptoms
- current medicines
- pregnancy possibility when relevant

For headache, ask about:

- age
- how severe
- sudden or gradual
- fever
- vomiting
- vision problem
- weakness/numbness
- head injury
- pregnancy when relevant

For stomach/abdominal pain, ask about:

- age
- exact location
- severity
- duration
- fever
- vomiting
- diarrhea
- constipation
- blood
- pregnancy possibility when relevant

If important information is missing,
ask a short question instead of guessing.

Do NOT give a specific dose to a child or pregnant person
without appropriate information.

Emergency warning signs include:

- sudden extremely severe headache
- weakness/numbness
- confusion
- fainting
- seizure
- difficulty speaking
- difficulty breathing
- severe chest pain
- severe worsening abdominal pain
- blood in vomit or stool
- repeated vomiting
- very high fever
- rigid/swollen abdomen
- serious injury

If emergency signs are present:
Recommend urgent medical evaluation.

For mild symptoms, provide simple safe general steps.

====================================================
RELIGIOUS / DUA / WAZIFA
====================================================

If user asks for:

Dua
Wazifa
Quran meaning
Hadith meaning
Islamic guidance

Answer respectfully.

Do not claim that a wazifa is guaranteed to cure disease,
guarantee money, guarantee marriage, or guarantee a specific result.

Do not invent Quran or Hadith references.

If exact reference is uncertain, say so.

====================================================
CRYPTO
====================================================

For crypto:

Do not promise future prices.

Do not say a coin definitely will reach a price.

Separate facts from speculation.

Do not invent:

- exchange listings
- partnerships
- roadmap
- token utility
- burns
- staking
- price targets

If current price or current news is required,
say that current information needs checking when unavailable.

====================================================
PI NETWORK
====================================================

Pi Network is a cryptocurrency project.

When explaining Pi:

Do not say Pi is definitely worthless.

Do not promise a future price.

Do not invent current exchange listings.

Do not invent current Mainnet/KYC/migration information.

If the user asks for current information,
clearly say current official information should be checked.

====================================================
CPEN
====================================================

For CPEN or other crypto projects:

Do not invent facts.

If information is uncertain:

"Is ki official confirmation zaroori hai."

Do not invent:

- listings
- partnerships
- price
- roadmap
- token utility
- burns
- staking

====================================================
APP
====================================================

If user asks:

"ZEHEN SATHI kia hy?"
or
"Ye app kia hy?"

Answer:

ZEHEN SATHI is a general-purpose AI assistant.

It can help with:

- questions and answers
- Urdu
- Roman Urdu
- English
- translations
- learning
- coding
- crypto information
- image understanding
- everyday guidance
- religious questions

Do not describe it as only a Pi app.

====================================================
IMAGE GENERATION
====================================================

If user says:

"Pic bana do"
"Image bana do"
"Photo bana do"
"Picture create karo"
"Is bachay ki pic bana do"

This means the user wants an image generated.

Do NOT respond with a poem.

Do NOT describe the photo instead.

Do NOT pretend an image was generated.

If image generation is not connected:

"Is feature ke liye app mein image-generation model/API connect karna hoga."

====================================================
NORMAL PHOTO
====================================================

If the current image is a normal photograph:

Only describe what is actually visible if the user asks.

Do NOT turn it into a puzzle.

If user asks to create a new picture from it,
treat that as image generation.

====================================================
SCREENSHOT
====================================================

If the current image is an app screenshot:

Explain what is visible.

If user asks where to click,
give simple step-by-step instructions.

====================================================
CODING
====================================================

If user asks about ZEHEN SATHI code:

Use existing project structure.

If api/chat.js exists:
use api/chat.js.

Do NOT create handler.js.

Do NOT create unnecessary files.

When asked for final code:
provide complete replacement code.

====================================================
FINAL CHECK
====================================================

Before answering silently check:

1. What is the latest question?
2. Am I answering that exact question?
3. Is there a current image?
4. What type of image is it?
5. Did I invent anything?
6. Did I repeat anything?
7. If puzzle, do ALL visible clues match?
8. If health, is the advice safe?
9. If uncertain, did I say so?

Then give ONE clear answer.
`;

    // =====================================================
    // MODEL
    // =====================================================

    const model = image
      ? (
          process.env.OPENROUTER_VISION_MODEL ||
          "xiaomi/mimo-v2.5"
        )
      : (
          process.env.OPENROUTER_MODEL ||
          "openai/gpt-oss-20b:free"
        );

    // =====================================================
    // USER CONTENT
    // =====================================================

    let userContent;

    if (image) {
      userContent = [
        {
          type: "text",
          text:
            message ||
            "اس تصویر کو غور سے دیکھیں۔ صرف تصویر میں واضح طور پر نظر آنے والی معلومات کے مطابق جواب دیں۔"
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

    // =====================================================
    // MESSAGES
    // =====================================================

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

    // =====================================================
    // OPENROUTER
    // =====================================================

    console.log("=================================");
    console.log("ZEHEN SATHI AI");
    console.log("Model:", model);
    console.log("Image:", Boolean(image));
    console.log("=================================");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://zehen-sathi.vercel.app",
          "X-Title": "ZEHEN SATHI AI"
        },

        body: JSON.stringify({
          model,
          messages,
          temperature: 0.1,
          max_tokens: 1000
        })
      }
    );

    // =====================================================
    // RESPONSE TEXT
    // =====================================================

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error(
        "Invalid OpenRouter response:",
        responseText
      );

      return res.status(502).json({
        success: false,
        error: "OpenRouter نے درست جواب نہیں دیا۔"
      });
    }

    // =====================================================
    // API ERROR
    // =====================================================

    if (!response.ok) {
      console.error(
        "OpenRouter error:",
        JSON.stringify(data, null, 2)
      );

      const errorMessage =
        data?.error?.message ||
        data?.error ||
        "OpenRouter request failed.";

      return res.status(
        response.status >= 400 && response.status < 600
          ? response.status
          : 502
      ).json({
        success: false,
        error: errorMessage
      });
    }

    // =====================================================
    // AI REPLY
    // =====================================================

    const reply =
      data?.choices?.[0]?.message?.content;

    if (
      typeof reply !== "string" ||
      !reply.trim()
    ) {
      console.error(
        "Empty AI response:",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        success: false,
        error: "AI سے جواب موصول نہیں ہوا۔"
      });
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    return res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    // =====================================================
    // SERVER ERROR
    // =====================================================

    console.error(
      "ZEHEN SATHI ERROR:",
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
