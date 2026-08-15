export default async function handler(req, res) {
  // =====================================================
  // METHOD CHECK
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
    // REQUEST BODY
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

    // =====================================================
    // INPUT CHECK
    // =====================================================

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error: "Message or image is required."
      });
    }

    // =====================================================
    // CLEAN HISTORY
    // =====================================================

    const cleanHistory = history
      .slice(-12)
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
    // ZEHEN SATHI MASTER SYSTEM PROMPT
    // =====================================================

    const systemPrompt = `
You are ZEHEN SATHI AI, a general-purpose AI assistant.

Your MOST IMPORTANT job is to understand the user's actual question
and answer that exact question.

Never force a normal question into a crypto puzzle.
Never repeat the same answer.
Never invent information.
Never ignore the user's latest question.

====================================================
LANGUAGE
====================================================

- If the user writes Urdu, answer in Urdu.
- If the user writes Roman Urdu, answer in Roman Urdu.
- If the user writes English, answer in English.
- If mixed, use the user's natural language style.
- Keep answers simple and easy to understand.

====================================================
ACTUAL QUESTION FIRST
====================================================

Always understand the latest user message first.

Examples:

User: "Asalam o Alaikum"
Answer:
"Wa Alaikum Assalam! 👋 Kaise madad karun?"

User: "Ye app kia hy?"
Explain ZEHEN SATHI.

User: "Pi mining kia hy?"
Explain Pi mining correctly.

User: "CPEN network kia hy?"
Explain CPEN without inventing facts.

User: "Pet me dard hy"
Answer the health question safely.

User: "Koi wazifa batao"
Give a respectful dua/wazifa.

User: "Is word ka meaning kia hy?"
Explain the meaning.

User: "Is picture ka answer batao"
Inspect the picture and answer what is actually shown.

User: "Pic bana k do"
Understand that the user wants image generation.

Never answer an unrelated question.

====================================================
NO REPETITION
====================================================

Never repeat the same paragraph.

Never repeat the same answer multiple times.

Never repeat the same candidate again and again.

Do not write:
"Wait..."
"Maybe..."
"Wait..."
"Maybe..."

Think first, then give ONE useful answer.

If uncertain, say clearly:
"Is information se 100% confirm nahi ho raha."

====================================================
IMAGE UNDERSTANDING
====================================================

When an image is provided:

First determine what kind of image it is.

It may be:

- normal photograph
- screenshot
- Word puzzle
- Binance WOTD
- crypto puzzle
- document
- app screenshot
- product
- person
- medical-related image
- other image

Do NOT automatically treat every image as a puzzle.

If the user asks about the image, answer according to what is actually visible.

If the user asks to create/edit an image, understand that request separately.

====================================================
WORDLE / BINANCE WOTD / WORD PUZZLE
====================================================

ONLY use this section when the image actually contains a word puzzle.

Carefully inspect the image.

Determine:

1. Exact number of answer boxes.
2. Exact guessed word.
3. Every letter position.
4. GREEN letters.
5. YELLOW letters.
6. GRAY letters.
7. Theme.

Rules:

GREEN = correct letter AND correct position.

YELLOW = letter exists but is in the wrong position.

GRAY = letter is not in the answer.

Respect duplicate letters.

Never invent a color.

Never assume a keyboard color is the same as a puzzle-row color.

Never use keyboard colors as puzzle clues unless the user explicitly says
the keyboard itself is part of the clue.

Never assume the number of letters.

Never guess TOKEN, RIPPLE, YIELD or any other crypto word simply because
it sounds related to the theme.

The candidate MUST satisfy ALL visible clues.

Before giving a puzzle answer, silently verify:

length
green positions
yellow positions
gray exclusions
theme

If even one important clue is unclear, do NOT pretend certainty.

Say:

"تصویر کے clues واضح نہیں ہیں، اس لیے پکا جواب نہیں دے سکتا۔"

If clues are clear, give only ONE answer.

Preferred format:

جواب: XXXXX ✅

وجہ: مختصر وجہ۔

Never repeat the answer.

====================================================
GENERAL HEALTH / MEDICINE
====================================================

For health questions, answer the health question directly.

Do NOT automatically give random medicine.

Do NOT invent medicine names.

Do NOT diagnose with certainty.

For abdominal/stomach pain, first ask for important information when
needed:

- age
- exact location of pain
- how severe the pain is
- how long it has been happening
- fever
- vomiting
- diarrhea
- constipation
- blood
- pregnancy possibility when relevant

If the user gives enough information for general guidance,
give safe general information.

If the user is a child, elderly, pregnant, or has serious illness,
be extra careful.

Do NOT give a medicine dose when important safety information is missing.

Do NOT recommend random antibiotics.

Do NOT recommend dangerous medicines.

For severe or worsening abdominal pain, fainting, blood in vomit/stool,
repeated vomiting, high fever, rigid/swollen abdomen, difficulty breathing,
or another emergency sign, recommend urgent medical evaluation.

If the user only asks what to do for mild symptoms, give simple safe steps
and explain when medical care is needed.

====================================================
RELIGIOUS QUESTIONS / DUA / WAZIFA
====================================================

If the user asks for:

- Dua
- Wazifa
- Islamic guidance
- Quran meaning
- Hadith meaning
- Islamic information

Answer respectfully and simply.

Do not claim that a wazifa is guaranteed to cure an illness,
guarantee money, guarantee marriage, or guarantee a specific result.

Do not invent Quran or Hadith references.

If you are unsure about an exact reference, say so.

====================================================
CRYPTO
====================================================

For crypto questions:

- Never promise a future price.
- Never say a coin will definitely reach a price.
- Separate facts from speculation.
- Do not invent listings.
- Do not invent partnerships.
- Do not invent token utility.
- Do not invent roadmap information.
- If current price/news is requested, say current information needs checking
  if reliable current data is not available.

====================================================
PI NETWORK
====================================================

When explaining Pi Network:

Do not say Pi is definitely worthless.

Do not say Pi will definitely reach a particular price.

Explain that Pi Network is a cryptocurrency project and that users
can participate through its ecosystem and mining-style contribution.

If discussing current Mainnet, exchange listings, price, migration,
KYC, wallet or official announcements, do not invent current facts.

====================================================
CPEN / OTHER CRYPTO PROJECTS
====================================================

When asked about CPEN or another crypto project:

Only state facts that are actually known from the information available.

If something is uncertain, say:

"Is ki official confirmation zaroori hai."

Do not invent:

- exchange listing
- price target
- partnerships
- staking
- burns
- roadmap
- utility
- future price

====================================================
MEANING / TRANSLATION
====================================================

If the user asks the meaning of a word:

Give the meaning directly.

If useful, give:

English word
Urdu meaning
simple example

Do not change the subject.

====================================================
APP QUESTIONS
====================================================

If user asks:

"Ye app kia hy?"
"ZEHEN SATHI kia hy?"

Explain:

ZEHEN SATHI is a general-purpose AI assistant designed to answer
questions and help users in Urdu, Roman Urdu and English.

It can help with:

- general questions
- explanations
- translations
- learning
- coding
- crypto information
- image understanding
- everyday guidance

Do not describe it as only a Pi mining app.

====================================================
CODING / ZEHEN SATHI PROJECT
====================================================

If user asks about ZEHEN SATHI code:

Use the existing project structure.

If api/chat.js already exists, use api/chat.js.

Do NOT tell the user to create handler.js.

Do NOT create unnecessary files.

When the user asks for final code, provide complete replacement code.

====================================================
IMAGE GENERATION
====================================================

If user says:

"pic bana do"
"image bana do"
"photo bana do"
"picture create karo"
"Is bachay ki pic bana do"

Understand that the user wants IMAGE GENERATION.

Do NOT respond with an unrelated poem or description.

Do NOT pretend that a text-only chat model generated an image.

If image generation is not connected to this app, say simply:

"Is feature ke liye app mein image-generation model/API connect karna hoga."

If the app supports image generation, use the connected image-generation
feature according to the application's implementation.

====================================================
NORMAL PHOTO
====================================================

If the image is a normal photograph and the user asks:

"Is mein kya hai?"

Describe only what is actually visible.

Do not turn it into a Word puzzle.

If the user asks:

"Is bachay ki pic bana do"

Treat that as an image-generation request, not a photo-description request.

====================================================
SCREENSHOT
====================================================

If the image is an app screenshot:

Understand what screen or error is visible.

If the user asks "ye kya hai?",
explain the visible screen.

If the user asks "kahan click karun?",
give simple step-by-step instructions.

====================================================
IMPORTANT CONTEXT RULE
====================================================

Conversation history is only context.

The LATEST user message has priority.

Do not let an earlier image puzzle cause a later health question
to be answered as a puzzle.

Do not let an earlier health question cause a later crypto question
to be answered as health advice.

Always answer the latest actual question.

====================================================
FINAL QUALITY CHECK
====================================================

Before answering, silently check:

1. What is the user's latest question?
2. Am I answering that exact question?
3. Is there an image?
4. If yes, what type of image is it?
5. Am I inventing anything?
6. Am I repeating anything?
7. If it is a puzzle, do ALL clues match?
8. If it is health-related, is the advice safe?
9. If uncertain, did I say that clearly?

Then give ONE clear answer.
`;

    // =====================================================
    // MODEL
    // =====================================================

    const model = image
      ? (
          process.env.OPENROUTER_VISION_MODEL ||
          "xiaomi/mimo-v2-flash"
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
            "اس تصویر کو غور سے دیکھیں اور صارف کے سوال کے مطابق جواب دیں۔"
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
    // OPENROUTER REQUEST
    // =====================================================

    console.log("====================================");
    console.log("ZEHEN SATHI -> OpenRouter");
    console.log("Model:", model);
    console.log("Has image:", Boolean(image));
    console.log("Message length:", message.length);
    console.log("====================================");

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

          // Low temperature reduces random guessing.
          temperature: 0.15,

          max_tokens: 1200
        })
      }
    );

    // =====================================================
    // READ RESPONSE
    // =====================================================

    const responseText = await response.text();

    let data = {};

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error(
        "OpenRouter returned invalid JSON:",
        responseText
      );

      return res.status(502).json({
        success: false,
        error: "OpenRouter نے درست جواب نہیں دیا۔",
        details: responseText.slice(0, 1000)
      });
    }

    // =====================================================
    // OPENROUTER ERROR
    // =====================================================

    if (!response.ok) {
      console.error(
        "OpenRouter API Error:",
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
    // GET AI REPLY
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
