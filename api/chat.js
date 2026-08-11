export default async function handler(req, res) {
  // ==========================================
  // METHOD CHECK
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method not allowed"
    });
  }

  try {
    // ==========================================
    // REQUEST DATA
    // ==========================================

    const {
      message = "",
      history = [],
      image = null
    } = req.body || {};

    const cleanMessage =
      typeof message === "string"
        ? message.trim()
        : "";

    // ==========================================
    // TEXT OR IMAGE REQUIRED
    // ==========================================

    if (!cleanMessage && !image) {
      return res.status(400).json({
        reply:
          "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
      });
    }

    // ==========================================
    // CHAT HISTORY
    // ==========================================

    const cleanHistory = Array.isArray(history)
      ? history
          .filter((item) => {
            return (
              item &&
              (item.role === "user" ||
                item.role === "assistant") &&
              typeof item.content === "string" &&
              item.content.trim()
            );
          })
          .slice(-20)
      : [];

    // ==========================================
    // USER MEMORY
    // ==========================================

    let userName = "";
    let userCity = "";

    const allMessages = [
      ...cleanHistory,
      {
        role: "user",
        content: cleanMessage
      }
    ];

    for (const item of allMessages) {
      if (item.role !== "user") continue;

      const text = item.content.trim();

      // ------------------------------------------
      // NAME - ROMAN URDU
      // ------------------------------------------

      const romanName = text.match(
        /^mera\s+(?:nam|naam|name)\s+([A-Za-z]+)(?:\s+(?:hai|hy|h))?[؟?]?\s*$/i
      );

      // ------------------------------------------
      // NAME - URDU
      // ------------------------------------------

      const urduName = text.match(
        /^میرا\s+نام\s+([\u0600-\u06FF]+)(?:\s+ہے)?[؟?]?\s*$/
      );

      if (romanName?.[1]) {
        userName = romanName[1].trim();
      }

      if (urduName?.[1]) {
        userName = urduName[1].trim();
      }

      // ------------------------------------------
      // CITY - ROMAN URDU
      // ------------------------------------------

      const romanCity = text.match(
        /^(?:me|main|mein)\s+([A-Za-z][A-Za-z\s-]{1,40}?)\s+(?:me|mein)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i
      );

      // ------------------------------------------
      // CITY - URDU
      // ------------------------------------------

      const urduCity = text.match(
        /^میں\s+([\u0600-\u06FF\s-]{2,40}?)\s+میں\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?\s*$/
      );

      if (romanCity?.[1]) {
        userCity = romanCity[1].trim();
      }

      if (urduCity?.[1]) {
        userCity = urduCity[1].trim();
      }
    }

    // ==========================================
    // ASKING NAME
    // ==========================================

    const askingName =
      /^(?:mera\s+(?:nam|naam|name)\s+kia\s+(?:hai|hy)|mera\s+kia\s+(?:nam|naam|name)\s+(?:hai|hy)|what\s+is\s+my\s+name|my\s+name\s+kia\s+hai)[؟?]?\s*$/i.test(
        cleanMessage
      ) ||
      /^میرا\s+(?:نام\s+کیا\s+ہے|کیا\s+نام\s+ہے)[؟?]?\s*$/.test(
        cleanMessage
      );

    if (askingName && userName) {
      return res.status(200).json({
        reply: `آپ کا نام ${userName} ہے۔ 😊`
      });
    }

    // ==========================================
    // ASKING LOCATION
    // ==========================================

    const askingLocation =
      /^(?:me|main|mein)\s+(?:kahan|kis\s+jaga|kis\s+jagah)\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i.test(
        cleanMessage
      ) ||
      /^(?:me|main|mein)\s+(?:kahan|kis\s+jaga|kis\s+jagah)\s+par\s+(?:rehti|rehta)\s+(?:ho|hun|houn|hu)\s*[؟?]?\s*$/i.test(
        cleanMessage
      ) ||
      /^(?:where\s+do\s+i\s+live)[؟?]?\s*$/i.test(
        cleanMessage
      ) ||
      /^میں\s+(?:کہاں|کس\s+جگہ)\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?$/.test(
        cleanMessage
      ) ||
      /^میں\s+(?:کہاں|کس\s+جگہ)\s+پر\s+(?:رہتی|رہتا)\s+(?:ہوں|ہو)\s*[؟?]?$/.test(
        cleanMessage
      );

    if (askingLocation && userCity) {
      return res.status(200).json({
        reply: `آپ ${userCity} میں رہتی ہیں۔ 😊`
      });
    }

    // ==========================================
    // SYSTEM PROMPT
    // ==========================================

    const systemMessage = `
You are ZEHEN SATHI AI, a reliable general-purpose AI assistant.

IMPORTANT:
Your job is to give the correct answer, not just a possible guess.

LANGUAGE:
- If the user writes Urdu, answer naturally in Urdu.
- If the user writes Roman Urdu, understand it and normally answer in Urdu.
- If the user writes English, answer in English.

GENERAL QUESTIONS:
- Answer the actual question directly.
- Give accurate answers.
- For simple factual questions, keep the answer concise.
- Do not invent facts.
- If you are not sure, clearly say that you are not sure.

IMAGE QUESTIONS:
When the user sends an image, carefully inspect the image before answering.

For screenshots, puzzles, Word of the Day games, quizzes, charts,
documents, mathematics, app screens and text in images:

1. Read all visible text carefully.
2. Inspect visible letters, numbers, symbols and colors.
3. For Wordle/Word of the Day style puzzles:
   - GREEN means the letter is in the correct position.
   - YELLOW means the letter exists but is in the wrong position.
   - GREY means the letter should not be used, unless repeated-letter rules indicate otherwise.
   - Check every clue together.
   - Check repeated letters carefully.
   - Do not guess simply because a word looks possible.
4. Before giving the answer, verify that it satisfies every visible clue.
5. If one exact answer cannot be determined from the image, say so clearly.
6. Never invent letters, colors or clues.
7. If the image is unclear, say:
   "تصویر سے مکمل یقین نہیں ہو رہا، براہ کرم صاف تصویر بھیج دیں۔"
8. If the user asks "Iska answer kya hai?", answer the actual question shown in the image.
9. Do not merely describe the screenshot when the user wants the answer.

MEMORY:
Use information available in the current conversation/history when relevant.

If the user tells you their name, remember it within the conversation.
If asked for their name, answer using the known name.

If the user tells you their city/location, remember it within the conversation.
If asked where they live, answer using the known location.

PI NETWORK:
Pi Network, Pi coin, Pi wallet, Pi KYC, Pi Browser, Pi Mainnet,
Pi mining and Pi payments refer to Pi Network cryptocurrency unless
the context clearly means something else.

CRYPTO:
- Never guarantee profit.
- Never invent live prices.
- Never invent current news.
- Explain risk when appropriate.

MATHEMATICS:
- Give the correct answer.
- Show calculations step by step when useful.

PROGRAMMING:
- Give complete working code when requested.
- Keep code compatible with the user's project.
- If fixing code, provide the complete corrected version when useful.

CURRENT INFORMATION:
Do not pretend to know live/current information.
If current information is required and you do not have verified current data,
clearly say that it needs verification.

HONESTY:
Never make up facts.
Never pretend an image contains something that cannot actually be seen.

GREETING:
If the user says:
"Assalam o Alaikum"

reply:
"وعلیکم السلام! آپ کیسے ہیں؟ 😊"

STYLE:
Be friendly, helpful, concise and natural.
Answer the user's actual question directly.

You are ZEHEN SATHI AI.
`;

    // ==========================================
    // OPENROUTER API KEY CHECK
    // ==========================================

    const apiKey =
      process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error(
        "OPENROUTER_API_KEY is missing"
      );

      return res.status(500).json({
        reply:
          "❌ OpenRouter API key موجود نہیں۔ Vercel Environment Variables میں OPENROUTER_API_KEY چیک کریں۔"
      });
    }

    // ==========================================
    // BUILD MESSAGES
    // ==========================================

    const messages = [
      {
        role: "system",
        content: systemMessage
      },
      ...cleanHistory
    ];

    // ==========================================
    // USER MESSAGE
    // ==========================================

    if (image) {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text:
              cleanMessage ||
              "اس تصویر کو غور سے دیکھیں اور اس میں موجود سوال یا مسئلے کا صحیح جواب دیں۔"
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
        content: cleanMessage
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

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          Authorization:
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
          temperature: 0.2,
          max_tokens: 1200
        })
      }
    );

    // ==========================================
    // READ RESPONSE SAFELY
    // ==========================================

    const responseText =
      await response.text();

    let data = {};

    try {
      data =
        responseText
          ? JSON.parse(responseText)
          : {};
    } catch (parseError) {
      console.error(
        "OpenRouter JSON Parse Error:",
        responseText
      );

      return res.status(502).json({
        reply:
          "❌ OpenRouter نے درست جواب نہیں دیا۔"
      });
    }

    // ==========================================
    // OPENROUTER ERROR
    // ==========================================

    if (!response.ok) {
      console.error(
        "OpenRouter Error:",
        response.status,
        data
      );

      const errorMessage =
        data?.error?.message ||
        data?.message ||
        `OpenRouter request failed (${response.status})`;

      return res.status(502).json({
        reply:
          "❌ AI Server Error: " +
          errorMessage
      });
    }

    // ==========================================
    // AI RESPONSE
    // ==========================================

    let reply =
      data?.choices?.[0]?.message?.content;

    // بعض models content کو array کی صورت میں دے سکتے ہیں
    if (Array.isArray(reply)) {
      reply = reply
        .map((part) => {
          if (typeof part === "string") {
            return part;
          }

          return part?.text || "";
        })
        .join("");
    }

    if (
      typeof reply !== "string" ||
      !reply.trim()
    ) {
      console.error(
        "Empty AI response:",
        data
      );

      return res.status(502).json({
        reply:
          "❌ AI نے کوئی جواب نہیں دیا۔"
      });
    }

    // ==========================================
    // REMOVE THINKING TAGS
    // ==========================================

    reply = reply
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
    // FINAL RESPONSE
    // ==========================================

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {
    // ==========================================
    // SERVER ERROR
    // ==========================================

    console.error(
      "ZEHEN SATHI SERVER ERROR:",
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
