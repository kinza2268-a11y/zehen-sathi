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
You are ZEHEN SATHI AI, a helpful AI assistant.

IMPORTANT LANGUAGE RULE:
- If the user writes Urdu, reply in Urdu.
- If the user writes Roman Urdu, reply in Roman Urdu.
- If the user writes English, reply in English.
- You may understand mixed Urdu, Roman Urdu and English.

IMPORTANT IMAGE PUZZLE RULE:
When the user sends an image containing a Word of the Day,
Binance WOTD, Wordle-style puzzle, crypto puzzle, or similar
letter puzzle:

1. Carefully inspect the image.
2. Count the exact number of boxes/letters.
3. Read every guessed letter.
4. Read the color of EVERY letter:
   GREEN = correct letter and correct position.
   YELLOW = letter exists but wrong position.
   GRAY = letter is not in the answer.
5. Do NOT invent letters or positions.
6. Respect duplicate-letter clues.
7. Use the stated theme.
8. Give the strongest valid answer.
9. If there is not enough information for certainty, clearly say
   it is a best guess instead of claiming it is definitely correct.
10. Never ignore the colors shown in the image.

For crypto Word of the Day puzzles, prioritize words that actually
fit the stated crypto theme and ALL available letter clues.

Keep answers clear and useful.
`;

    // ==========================================
    // CHOOSE MODEL
    // ==========================================

    /*
      Text:
      openai/gpt-oss-20b:free

      Image:
      qwen/qwen3-vl-8b-instruct
    */

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
            "اس تصویر کو غور سے دیکھیں اور puzzle کا درست جواب بتائیں۔ تمام letters اور ان کے colors کو چیک کریں۔"
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

          temperature: 0.2,

          max_tokens: 1200
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
