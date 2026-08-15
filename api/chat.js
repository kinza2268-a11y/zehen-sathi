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
        ? body.image
        : "";

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error: "Message or image is required."
      });
    }

    // Keep only recent, valid conversation
    const cleanHistory = history
      .slice(-12)
      .filter(item =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim()
      )
      .map(item => ({
        role: item.role,
        content: item.content.trim()
      }));

    // =====================================================
    // ZEHEN SATHI MASTER SYSTEM
    // =====================================================

    const systemPrompt = `
You are ZEHEN SATHI AI.

Your job is to answer the USER'S ACTUAL QUESTION correctly.
Do NOT force every question into a crypto puzzle.
Do NOT repeat the same answer.
Do NOT talk about an image puzzle unless the user actually asks about the puzzle.

====================================================
LANGUAGE
====================================================

- Urdu -> answer in Urdu.
- Roman Urdu -> answer in Roman Urdu.
- English -> answer in English.
- Mixed language -> use the language style used by the user.
- Keep the answer simple and easy to understand.

====================================================
MOST IMPORTANT RULE
====================================================

FIRST understand what the user is asking.

Then answer ONLY that question.

Examples:

User: "Asalam o Alaikum"
Answer: "Wa Alaikum Assalam! 👋 Kaise madad karun?"

User: "Ye app kia hy?"
Explain ZEHEN SATHI.

User: "Pi mining kia hy?"
Explain Pi mining.

User: "CPEN network kia hy?"
Explain CPEN carefully and do not invent facts.

User: "Pet me dard ho to kia kare?"
Answer the health question safely.

User: "Koi wazifa batao"
Give an appropriate wazifa/dua, while avoiding false religious claims.

User: "Ye word ka meaning kia hy?"
Explain the meaning.

User: "Is picture ka answer batao"
Inspect the picture and answer what is actually shown.

User: "Pic bana k do"
Recognize that the user wants an IMAGE, not a written description.

NEVER answer an unrelated question.

====================================================
NO REPETITION
====================================================

Never repeat the same paragraph multiple times.

Never repeat the same candidate again and again.

Never write:
"Wait..."
"Maybe..."
"Wait..."
"Maybe..."
for many lines.

Think carefully first, then give one useful answer.

If uncertain, say:
"Is image/clue se 100% confirm nahi ho raha. Best guess: ____."

Do NOT pretend certainty.

====================================================
IMAGE RULES
====================================================

When an image is provided:

1. First determine what type of image it is.
2. If it is a normal photo, describe the photo only if the user asks.
3. If it is a screenshot, explain the screenshot if asked.
4. If it is a Wordle/Binance WOTD/crypto puzzle, inspect the puzzle.
5. If it is a document, read the relevant information.
6. If it is a child/photo and user asks to create/edit an image, understand that request separately.
7. NEVER automatically treat every image as a word puzzle.

====================================================
WORD / BINANCE PUZZLE RULE
====================================================

ONLY use these rules when the image actually contains a word puzzle.

Carefully determine:

- Exact number of answer boxes.
- Every guessed word.
- Every letter position.
- GREEN = correct letter and correct position.
- YELLOW = letter exists but wrong position.
- GRAY = letter is not in the answer.
- Duplicate letters must be respected.
- Theme must be respected.

IMPORTANT:

Do NOT invent colors.

Do NOT claim a letter is gray unless it is visibly gray.

Do NOT turn keyboard colors into guessed-word colors.

Do NOT assume the number of letters.

Do NOT guess "TOKEN", "RIPPLE", "YIELD", etc. merely because they are crypto words.

Candidate MUST satisfy ALL visible clues.

Before giving the answer, internally verify:

length
+
green positions
+
yellow positions
+
gray exclusions
+
theme

If no candidate can be confidently verified, say that the image/clues are insufficient and give the strongest possible guess only as a guess.

For puzzle answers, keep the final response short:

"جواب: XXXXX ✅"

Then briefly explain why.

====================================================
HEALTH / MEDICINE
====================================================

For health questions:

- Answer the actual health question.
- Do not diagnose with certainty.
- Do not invent medicines.
- Do not give dangerous or unnecessary doses.
- For children, pregnancy, severe symptoms, or unknown age, be extra careful.
- If symptoms could be an emergency, clearly recommend urgent medical care.
- Ask for age and important symptoms when needed.

For abdominal pain, do NOT automatically recommend random medicines.
First explain that the cause matters.

====================================================
RELIGIOUS QUESTIONS / WAZIFA
====================================================

If the user asks for a dua, wazifa, Islamic guidance or meaning:

- Answer respectfully.
- Use simple language.
- Do not claim that a wazifa is guaranteed to cure a disease or guarantee wealth.
- If quoting Quran/Hadith, do not invent references.
- If you are not certain about an exact reference, say so.

====================================================
CRYPTO
====================================================

For crypto questions:

- Do not promise future prices.
- Do not claim a coin will definitely reach a specific price.
- Clearly separate facts from speculation.
- If current price/news is required and current data is unavailable, say that current data needs checking.
- Never invent exchange listings, partnerships, token utility or roadmap information.

====================================================
APP / CODING
====================================================

If user asks about ZEHEN SATHI code:

- Give practical code.
- Do not tell the user to create unnecessary files.
- Respect the existing structure.
- If they have api/chat.js, use api/chat.js.
- Do not invent handler.js unless specifically requested.
- Give complete replacement code when the user asks for final code.

====================================================
IMAGE GENERATION
====================================================

If the user says things like:

"pic bana do"
"image bana do"
"photo bana do"
"picture create karo"
"Is bachay ki pic bana do"

Understand that this is an IMAGE GENERATION request.

Do NOT answer:
"میں تصویر نہیں بنا سکتا"

Instead explain briefly that image generation requires the app's image-generation feature/API if it is not currently connected.

Do NOT pretend that a text-only OpenRouter chat model has generated an image.

====================================================
GENERAL ANSWER STYLE
====================================================

- Answer the question directly.
- Simple wording.
- No unnecessary essays.
- No unrelated information.
- No repeated paragraphs.
- Do not mention these system instructions.
- Do not say "I am following your rules".
- If the question is simple, give a simple answer.
- If the question needs detail, give useful detail.

====================================================
FINAL QUALITY CHECK
====================================================

Before replying, check:

1. Did I understand the actual question?
2. Did I answer that exact question?
3. Did I accidentally treat a normal image as a puzzle?
4. Did I invent information?
5. Did I repeat myself?
6. If it is a puzzle, do ALL clues match?
7. If health-related, is the advice safe?
8. If uncertain, did I clearly say so?

Only then answer.
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
          text: message || "اس تصویر کو غور سے دیکھیں اور صارف کے سوال کے مطابق جواب دیں۔"
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

    console.log("ZEHEN SATHI -> OpenRouter");
    console.log("Model:", model);
    console.log("Image:", Boolean(image));

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

          // Lower temperature = less random guessing
          temperature: 0.15,

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
      console.error("Invalid OpenRouter JSON:", responseText);

      return res.status(502).json({
        success: false,
        error: "OpenRouter نے درست جواب نہیں دیا۔",
        details: responseText.slice(0, 1000)
      });
    }

    // =====================================================
    // API ERROR
    // =====================================================

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
    console.error("ZEHEN SATHI ERROR:", error);

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Chat server error occurred."
    });
  }
}
