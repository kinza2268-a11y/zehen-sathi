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

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is missing");

      return res.status(500).json({
        success: false,
        error: "OPENROUTER_API_KEY is not configured in Vercel."
      });
    }

    // ==========================================
    // BODY
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
      typeof body.image === "string"
        ? body.image
        : "";

    // ==========================================
    // CHECK INPUT
    // ==========================================

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error: "Message or image is required."
      });
    }

    // ==========================================
    // CLEAN HISTORY
    // ==========================================

    const cleanHistory = history
      .slice(-20)
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
        content: item.content
      }));

    // ==========================================
    // SYSTEM PROMPT
    // ==========================================

    const systemPrompt = `
You are ZEHEN SATHI AI, a careful and reliable AI assistant.

LANGUAGE RULE:
- Urdu question -> answer in Urdu.
- Roman Urdu question -> answer in Roman Urdu.
- English question -> answer in English.
- Mixed language -> use the user's main language.

==================================================
IMPORTANT: IMAGE WORD PUZZLE / BINANCE WOTD RULE
==================================================

When the user sends an image containing:
- Binance Word of the Day
- Wordle-style puzzle
- Crypto word puzzle
- Letter guessing puzzle
- Any puzzle with colored letters and boxes

DO NOT guess casually.

You MUST solve it in this exact order:

STEP 1 — COUNT THE BOXES
Carefully count the answer boxes in the puzzle.

The number of boxes = EXACT answer length.

ABSOLUTE RULE:
If there are 7 boxes, the answer MUST contain exactly 7 letters.
A 6-letter word is INVALID.
An 8-letter word is INVALID.
Never suggest a word with the wrong number of letters.

STEP 2 — READ ALL GUESSED LETTERS
Read every visible guessed word/letter from the image.

Do not invent letters.

STEP 3 — READ COLORS
For EVERY letter determine its color:

GREEN:
The letter is correct AND in the correct position.

YELLOW:
The letter exists in the answer BUT is in the wrong position.

GRAY:
The letter is NOT in the answer.

Never ignore a gray letter.

STEP 4 — BUILD HARD CONSTRAINTS

For each GREEN letter:
- Keep exactly that letter in that position.

For each YELLOW letter:
- The answer MUST contain that letter.
- The answer MUST NOT put that letter in the yellow position.

For each GRAY letter:
- Do NOT use that letter in the answer.

IMPORTANT:
Respect duplicate letters carefully.
If a letter appears more than once, use the colors and counts shown in the puzzle to determine whether one or more copies are allowed.

STEP 5 — CHECK THE THEME

Use the puzzle's stated theme.

For crypto/Binance puzzles, prefer genuine crypto, blockchain, DeFi,
trading, finance, Web3, or related terminology.

But THEME NEVER OVERRIDES LETTER CLUES.

A themed word that violates even one hard letter clue is INVALID.

STEP 6 — VERIFY EVERY CANDIDATE

Before giving an answer, check:

[ ] Exact number of letters
[ ] Every green letter is in the correct position
[ ] Every yellow letter exists
[ ] No yellow letter is in its forbidden position
[ ] No gray letter appears
[ ] Duplicate letters are consistent
[ ] Word fits the stated theme

If ANY box is unchecked, reject the candidate.

STEP 7 — NEVER CLAIM CERTAINTY WITHOUT VERIFICATION

Do NOT say:
"confirmed"
"verified"
"definitely correct"
"this is the answer"

unless the candidate satisfies ALL known clues.

If clues are insufficient, say:
"یہ strongest guess ہے، 100% confirm نہیں ہے۔"

==================================================
EXAMPLE OF LENGTH VALIDATION
==================================================

If the image has 7 boxes:

ZAPPER = 6 letters -> INVALID.
LEVERAGE = 8 letters -> INVALID.
Any 6-letter or 8-letter answer MUST be rejected.

Do not repeatedly suggest an answer that has already been rejected
because of its length.

==================================================
IMPORTANT BEHAVIOR
==================================================

When solving an image puzzle:

1. First identify the number of boxes.
2. Then identify green letters and positions.
3. Then identify yellow letters and forbidden positions.
4. Then identify gray letters.
5. Then consider the theme.
6. Generate candidates.
7. Check every candidate against ALL constraints.
8. Give only the strongest valid candidate(s).

If no candidate can be safely identified:
- Do not invent an answer.
- Explain which clue is missing.
- Give at most 2-3 possible guesses, clearly marked as guesses.

Keep the final response short and useful.

For a puzzle answer, prefer this format:

"جواب: XXXXXXX ✅"

Then, if useful:

"7 letters — R دوسری position پر ہے، P موجود ہے مگر اس position پر نہیں، اور gray letters شامل نہیں ہیں۔"

Never produce long repetitive explanations.
Never repeat the same rejected answer again and again.
`;

    // ==========================================
    // MODEL
    // ==========================================

    const model = image
      ? (
          process.env.OPENROUTER_VISION_MODEL ||
          "qwen/qwen3-vl-8b-instruct"
        )
      : (
          process.env.OPENROUTER_MODEL ||
          "openai/gpt-oss-20b:free"
        );

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
            "اس تصویر کو بہت غور سے دیکھیں۔ پہلے answer boxes کی صحیح تعداد گنیں، پھر ہر guessed letter کا green/yellow/gray رنگ اور position چیک کریں۔ تمام clues verify کرنے کے بعد ہی strongest valid answer دیں۔ غلط length والا لفظ ہرگز جواب نہ دیں۔"
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

    console.log("Calling OpenRouter...");
    console.log("Model:", model);
    console.log("Has image:", Boolean(image));
    console.log("Message length:", message.length);

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
          temperature: 0.1,
          max_tokens: 1000
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
        "OpenRouter returned invalid JSON:",
        responseText
      );

      return res.status(502).json({
        success: false,
        error:
          "OpenRouter نے صحیح JSON جواب نہیں دیا۔",
        details: responseText.slice(0, 1000)
      });
    }

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

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
        response.status >= 400 &&
        response.status < 600
          ? response.status
          : 502
      ).json({
        success: false,
        error: errorMessage,
        details: data
      });
    }

    // ==========================================
    // GET AI REPLY
    // ==========================================

    const reply =
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
          "AI سے جواب موصول نہیں ہوا۔",
        details: data
      });
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    console.log("OpenRouter success.");

    return res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    // ==========================================
    // SERVER ERROR
    // ==========================================

    console.error(
      "CHAT FUNCTION ERROR:",
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
