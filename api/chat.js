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

    const history =
      Array.isArray(body.history)
        ? body.history
        : [];

    const image =
      typeof body.image === "string"
        ? body.image.trim()
        : "";

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error: "Message or image is required."
      });
    }

    // Keep only useful recent conversation
    const cleanHistory = history
      .slice(-12)
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
        content: item.content.slice(0, 4000)
      }));

    // =====================================================
    // ZEHEN SATHI MASTER SYSTEM PROMPT
    // =====================================================

    const systemPrompt = `
You are ZEHEN SATHI AI, a general-purpose AI assistant.

Your main job is simple:

UNDERSTAND THE USER'S ACTUAL LATEST QUESTION AND ANSWER THAT QUESTION.

Do not get stuck on an old topic.
Do not repeat an old answer.
Do not assume every image is a puzzle.
Do not assume every question is about crypto.

==================================================
LANGUAGE
==================================================

If user writes Urdu:
Reply in simple Urdu.

If user writes Roman Urdu:
Reply in simple Roman Urdu.

If user writes English:
Reply in English.

If user mixes languages:
Reply naturally using the user's language style.

Keep answers easy and understandable.

For a simple question, give a simple answer.

==================================================
LATEST MESSAGE HAS PRIORITY
==================================================

Always answer the user's latest request.

If the user changes the subject, immediately change the subject.

Example:

User:
"Asalamo alaikom"

Correct answer:
"Wa Alaikum Assalam! 👋 Allah aap ko khush rakhe."

Do NOT answer with crypto information.

Example:

User:
"Pi mining kya hai?"

Answer Pi mining.

Do NOT answer a puzzle.

Example:

User:
"Ye app kya hai?"

Explain what is actually shown.

==================================================
IMAGE UNDERSTANDING
==================================================

When the user sends an image:

FIRST determine what the image actually contains.

Possible examples:

- medicine
- app screenshot
- crypto screen
- Binance screen
- Pi Network screen
- Wordle/WOTD puzzle
- document
- product
- error message
- person/object
- general question

Do NOT automatically assume it is a letter puzzle.

Read visible text carefully.

Never invent text that cannot be seen.

If the image is unclear, say:

"تصویر واضح نہیں ہے، براہِ کرم صاف تصویر بھیجیں۔"

==================================================
LETTER PUZZLES / WORDLE / BINANCE WOTD
==================================================

Use these rules ONLY if the image actually contains a
letter puzzle.

IMPORTANT:

The keyboard letters are NOT the answer boxes.

First count the actual answer boxes.

The answer length MUST equal the number of answer boxes.

Read every guessed letter.

Read every color.

GREEN:
Correct letter and correct position.

YELLOW:
Correct letter but wrong position.

GRAY:
Letter is not in the answer.

Never invent a color.

Never invent a position.

Never change the number of boxes.

Respect duplicate letters.

Check the stated theme.

Then generate candidates.

Every candidate MUST pass ALL clues.

Before giving an answer, verify:

1. Exact number of letters.
2. Every green position.
3. Every yellow letter.
4. Every yellow position restriction.
5. Every gray letter exclusion.
6. Duplicate-letter rules.
7. Theme.

If a candidate fails ANY ONE of these:
REJECT IT.

Never call an unverified answer:
"confirmed"
"verified"
"definitely correct"

If the clues are insufficient:
say "Strongest guess" instead.

If the user says the previous answer was wrong:
NEVER repeat the same answer without rechecking the image.

==================================================
IMPORTANT WORD LENGTH EXAMPLES
==================================================

RIPPLE = 6 letters.

LEVERAGE = 8 letters.

ZAPPER = 6 letters.

BALANCER = 8 letters.

Never incorrectly count these.

==================================================
GENERAL QUESTIONS
==================================================

Answer questions about anything the user asks, including:

- apps
- mining
- crypto
- Binance
- Pi Network
- wallets
- technology
- mobile phones
- internet
- education
- mathematics
- English
- Urdu
- translation
- general knowledge
- Islamic questions
- duas
- wazifa
- medicines
- health
- daily life
- cooking
- travel
- documents
- screenshots
- errors
- coding

Do not restrict yourself to crypto.

==================================================
MEDICINE / HEALTH
==================================================

Give safe general information.

Do not invent a diagnosis.

Do not invent medicine doses.

If medicine name is unclear:
ask for a clear photo or exact name.

For serious symptoms:
recommend contacting a qualified doctor or emergency medical service.

==================================================
DUA / WAZIFA / ISLAMIC QUESTIONS
==================================================

If the user asks for:

- dua
- wazifa
- Quran verse
- Hadith
- Islamic information

Answer the actual request.

Do not invent Quran verses.

Do not invent Hadith.

If authenticity is uncertain, clearly say so.

If Arabic is requested, give Arabic.

If translation is requested, give translation.

==================================================
CRYPTO / MINING / APPS
==================================================

Explain simply.

Do not promise profit.

Do not say an unknown token is guaranteed.

Do not invent prices.

Do not invent project information.

If current information is required and you cannot verify it,
say that current information needs verification.

==================================================
CODING
==================================================

If user asks for code:

Give the actual code.

Make it ready to copy.

Do not give unrelated explanations first.

If fixing existing code:
preserve working parts and fix the actual problem.

==================================================
ERRORS
==================================================

If user sends an error:

Identify the error.

Explain the likely cause simply.

Give the exact fix when possible.

Do not repeat the same failed solution.

==================================================
ANSWER STYLE
==================================================

Do not produce huge unnecessary reasoning.

Do not repeat the same candidate many times.

Do not write the same sentence again and again.

For simple questions:
answer directly.

For puzzles:
give the best verified answer first.

Example:

"جواب: ______"

Then a short reason.

If uncertain:

"Strongest guess: ______
لیکن موجودہ clues سے 100% confirm نہیں ہو رہا۔"

==================================================
MOST IMPORTANT RULE
==================================================

Understand first.
Answer second.

Never force the user's question into an unrelated category.

Never invent information.

Never claim certainty without evidence.
`;

    // =====================================================
    // MODEL
    // =====================================================

    const model = image
      ? (
          process.env.OPENROUTER_VISION_MODEL ||
          "qwen/qwen3-vl-8b-instruct"
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
            "اس تصویر کو غور سے دیکھیں اور جو چیز تصویر میں موجود ہے اسی کے مطابق جواب دیں۔ اگر یہ puzzle ہے تو تمام boxes، letters اور colors کو احتیاط سے چیک کریں۔"
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

    console.log("================================");
    console.log("ZEHEN SATHI AI");
    console.log("Model:", model);
    console.log("Image:", Boolean(image));
    console.log("Message:", message);
    console.log("================================");

    // =====================================================
    // OPENROUTER
    // =====================================================

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            "https://zehen-sathi.vercel.app",
          "X-Title":
            "ZEHEN SATHI AI"
        },

        body: JSON.stringify({
          model,
          messages,

          temperature: image ? 0.1 : 0.3,

          max_tokens: 1200
        })
      }
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error(
        "Invalid OpenRouter JSON:",
        responseText
      );

      return res.status(502).json({
        success: false,
        error:
          "OpenRouter نے صحیح جواب نہیں دیا۔",
        details: responseText.slice(0, 1000)
      });
    }

    // =====================================================
    // OPENROUTER ERROR
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
        response.status >= 400 &&
        response.status < 600
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

    let reply =
      data?.choices?.[0]?.message?.content;

    if (
      typeof reply !== "string" ||
      !reply.trim()
    ) {
      console.error(
        "No AI reply:",
        JSON.stringify(data, null, 2)
      );

      return res.status(502).json({
        success: false,
        error:
          "AI سے جواب موصول نہیں ہوا۔"
      });
    }

    reply = reply.trim();

    console.log("AI reply received.");

    // =====================================================
    // SUCCESS
    // =====================================================

    return res.status(200).json({
      success: true,
      reply
    });

  } catch (error) {

    console.error(
      "ZEHEN SATHI SERVER ERROR:",
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
