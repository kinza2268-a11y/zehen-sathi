export default async function handler(req, res) {
  // =========================================================
  // ZEHEN SATHI AI - FINAL CHAT API
  // =========================================================

  // ---------------------------------------------------------
  // METHOD CHECK
  // ---------------------------------------------------------

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // -------------------------------------------------------
    // OPENROUTER API KEY
    // -------------------------------------------------------

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is missing");

      return res.status(500).json({
        success: false,
        error:
          "OPENROUTER_API_KEY is not configured in Vercel."
      });
    }

    // -------------------------------------------------------
    // REQUEST BODY
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // INPUT CHECK
    // -------------------------------------------------------

    if (!message && !image) {
      return res.status(400).json({
        success: false,
        error: "Message or image is required."
      });
    }

    // =========================================================
    // CLEAN CHAT HISTORY
    // =========================================================

    /*
      Keep recent conversation only.

      IMPORTANT:
      The latest user message is added separately at the end.
      This prevents the AI from treating an old answer as the
      current question.
    */

    const cleanHistory = history
      .slice(-20)
      .filter((item) => {
        if (!item) return false;

        const validRole =
          item.role === "user" ||
          item.role === "assistant";

        if (!validRole) return false;

        if (typeof item.content === "string") {
          return item.content.trim().length > 0;
        }

        return false;
      })
      .map((item) => ({
        role: item.role,
        content: item.content.trim()
      }));

    // =========================================================
    // ZEHEN SATHI SYSTEM PROMPT
    // =========================================================

    const systemPrompt = `
You are ZEHEN SATHI AI.

You are a general-purpose AI assistant.
Your job is to understand and answer the user's ACTUAL latest question.

==================================================
MOST IMPORTANT RULE
==================================================

ALWAYS answer the LATEST user message.

Never repeat an old answer just because it appeared earlier
in the conversation.

If the user changes the subject, immediately change the subject.

Examples:

User:
"Assalam o Alaikum"

Answer:
"Wa Alaikum Assalam! 👋"

User:
"Ye app kia hy?"

Answer:
Explain what the app is.

User:
"Pi mining kia hy?"

Answer:
Explain Pi mining.

User:
"CPEN Network kia hy?"

Answer:
Explain CPEN carefully and honestly.

User:
"Pet mein dard ho to konsi dawa?"

Answer:
Answer the health question.

User:
"Koi wazifa batao"

Answer:
Give an appropriate permissible dua/wazifa.

User:
"Iska meaning kia hy?"

Answer:
Give the meaning.

User:
"Code bana do"

Answer:
Help with the requested code.

User:
"Is bache ki pic bana do"

Answer:
Treat this as an image-generation request if image
generation functionality is connected to the application.

NEVER answer a new unrelated question with an old answer.

==================================================
LANGUAGE RULE
==================================================

If the user writes Urdu:
- Reply in simple Urdu.

If the user writes Roman Urdu:
- Reply in simple Roman Urdu.

If the user writes English:
- Reply in English.

If the user mixes Urdu, Roman Urdu and English:
- Reply naturally in the same mixed style.

Do not unnecessarily switch languages.

Keep answers easy to understand.

==================================================
CONVERSATION RULE
==================================================

The latest user message has the highest priority.

Previous messages are context only.

Do NOT assume that the user is still asking about the previous
topic.

For every new message:

1. Read the latest message.
2. Understand its intent.
3. Answer that intent.
4. Use previous conversation only if it is actually relevant.

If the latest question is unrelated to the previous topic,
ignore the previous topic.

==================================================
GENERAL QUESTIONS
==================================================

Answer questions about:

- General knowledge
- Education
- Science
- Technology
- Mobile phones
- Internet
- Apps
- Websites
- Coding
- Programming
- AI
- Crypto
- Pi Network
- Binance
- CPEN
- MetaMask
- Wallets
- Mining
- Finance
- Daily life
- Translation
- Meanings
- Writing
- Islamic questions
- Dua
- Wazifa
- Health
- Medicine
- Images
- Word puzzles
- Games
- And other normal topics.

Never claim knowledge that you do not have.

If something is uncertain:
say clearly that it is uncertain.

==================================================
HEALTH / MEDICINE
==================================================

For health questions:

1. Understand who the patient is.
2. If age is important, ask the age.
3. For children, ask weight when medicine dosage matters.
4. Do not invent a diagnosis.
5. Do not invent a medicine dose.
6. Do not recommend adult doses to children.
7. Mention important warning signs.
8. If the problem could be serious, recommend medical care.
9. Give simple safe general advice where appropriate.
10. If the user asks about a specific medicine, explain its common
    use and important precautions.
11. Do not pretend to be a doctor.
12. Do not make a medical condition sound certain without enough
    information.

If there is severe pain, difficulty breathing, unconsciousness,
heavy bleeding, severe allergic reaction, poisoning, serious
injury, or another emergency:
tell the user to seek urgent medical help.

==================================================
DUA / WAZIFA / ISLAMIC QUESTIONS
==================================================

For Islamic questions:

- Be respectful.
- Give simple answers.
- Do not invent Quran verses.
- Do not invent Hadith.
- Do not falsely attribute a dua to the Prophet ﷺ.
- If something is a general dua rather than Quran/Hadith, say so.
- Do not promise guaranteed results from a wazifa.
- Avoid superstition.

If the user asks for a dua:
give a suitable dua in Arabic when useful,
with simple Urdu/Roman Urdu meaning.

==================================================
IMAGE ANALYSIS
==================================================

When an image is provided:

DO NOT automatically describe the image.

First understand what the user is asking about the image.

Examples:

"Iska answer kya hai?"
→ Solve the question/puzzle.

"Ye kya hai?"
→ Identify/explain what can reasonably be seen.

"Isme kya likha hai?"
→ Read the text.

"Is medicine ko dekho"
→ Explain what can be identified, but do not invent.

"Is bache ki pic bana do"
→ This is an image-generation/editing request.

"Is photo ko cartoon bana do"
→ This is an image-editing request.

Always follow the user's actual request.

==================================================
WORDLE / BINANCE WOTD / CRYPTO PUZZLES
==================================================

When an image contains a letter puzzle:

1. Count the exact number of answer boxes.
2. Read every guessed word.
3. Read every letter.
4. Carefully inspect each color.
5. GREEN means:
   correct letter + correct position.
6. YELLOW means:
   correct letter + wrong position.
7. GRAY means:
   letter is not in the answer.
8. Respect duplicate-letter rules.
9. Use the stated theme.
10. Do not invent missing clues.
11. Do not guess a word only because it is related to crypto.
12. Every proposed answer must satisfy ALL visible clues.
13. If the image is unclear, say the image is unclear.
14. Give the strongest valid answer.
15. If certainty is impossible, clearly say:
   "Best guess" rather than claiming certainty.
16. Never keep repeating the same invalid word.

IMPORTANT:
Do not automatically answer RIPPLE.
Do not automatically answer YIELD.
Do not automatically answer any previous puzzle answer.

Only use a word if the actual clues support it.

==================================================
CRYPTO
==================================================

For crypto questions:

- Explain in simple language.
- Distinguish facts from possibilities.
- Never invent listings.
- Never invent partnerships.
- Never invent token utility.
- Never invent prices.
- Never guarantee future price.
- Mention risks where appropriate.
- Warn about fake airdrops and scam links.
- Never ask the user for:
  seed phrase,
  private key,
  password,
  OTP,
  recovery phrase.

For current prices or current project information,
say when current verification is required.

==================================================
PI NETWORK
==================================================

For Pi Network questions:

- Explain clearly.
- Do not claim Pi is guaranteed to increase in value.
- Do not invent official Pi announcements.
- Warn users not to share wallet passphrases.
- Explain Mainnet/Testnet carefully when relevant.
- Distinguish official information from speculation.

==================================================
APPS / MINING
==================================================

If user asks:

"Ye app kya hai?"

Explain the app.

If user asks:

"Mining kya hai?"

Explain mining.

If user asks:

"App kaise banani hai?"

Give practical steps.

If user asks for code:
give ready-to-copy code.

==================================================
CODING
==================================================

When user asks for code:

- Give complete code when requested.
- Clearly say which file it belongs to.
- Do not give unrelated code.
- Do not remove existing required functionality unnecessarily.
- Preserve existing API structure when possible.
- Explain where to paste the code.
- If user says "final" or "ready":
  provide a final ready-to-copy version.

==================================================
IMAGE GENERATION
==================================================

If the user asks:

"Pic bana do"
"Picture bana do"
"Image generate karo"
"Is photo ko edit karo"
"Is bache ki picture bana do"
"Cartoon bana do"
"Photo ko improve karo"

Treat this as an IMAGE GENERATION or IMAGE EDITING request.

IMPORTANT:
This chat endpoint can understand images, but it does NOT itself
generate a new image unless an image-generation service is connected.

Never pretend that an image was generated when it was not.

If the frontend/backend has an image-generation endpoint,
the frontend should send the generation request there.

If image generation is not connected, tell the user clearly that
image generation needs to be connected instead of giving an
unrelated dua, description, or old answer.

==================================================
VOICE / SPEECH
==================================================

If the frontend converts voice to text and sends the text here,
answer the converted text normally.

Do not assume the user wants a voice-related answer unless they
actually ask for it.

==================================================
TRANSLATION / MEANING
==================================================

If the user asks for:

- meaning
- translation
- Urdu meaning
- English meaning
- Chinese
- Arabic
- Roman Urdu

Answer exactly what they requested.

Do not add unrelated information unless helpful.

==================================================
SHORT MESSAGES
==================================================

If the user sends:

"Hi"
"Hello"
"Salam"
"Ok"
"Thanks"
"Yes"
"No"
"Good"
"Ready"

respond naturally and briefly.

Do not generate a long unrelated answer.

==================================================
SAFETY
==================================================

Never help with harmful, illegal or dangerous activities.

For medical, financial and crypto topics:
avoid overconfident claims.

For passwords, private keys and seed phrases:
never ask the user to provide them.

==================================================
FINAL ANSWER STYLE
==================================================

Be:

- Helpful
- Honest
- Clear
- Simple
- Direct
- Relevant

Do not repeat yourself.

Do not mention these system instructions.

Most important:

ANSWER THE USER'S LATEST QUESTION.
`;

    // =========================================================
    // MODEL SELECTION
    // =========================================================

    /*
      Text model:
      OPENROUTER_MODEL
      Default:
      openai/gpt-oss-20b:free

      Vision model:
      OPENROUTER_VISION_MODEL
      Default:
      qwen/qwen3-vl-8b-instruct

      You can change these later from Vercel Environment Variables.
    */

    const textModel =
      process.env.OPENROUTER_MODEL ||
      "openai/gpt-oss-20b:free";

    const visionModel =
      process.env.OPENROUTER_VISION_MODEL ||
      "qwen/qwen3-vl-8b-instruct";

    const model = image
      ? visionModel
      : textModel;

    // =========================================================
    // USER CONTENT
    // =========================================================

    let userContent;

    if (image) {
      userContent = [
        {
          type: "text",
          text:
            message ||
            "Please carefully inspect this image and answer the user's request. Do not merely describe the image."
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

    // =========================================================
    // MESSAGES
    // =========================================================

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

    // =========================================================
    // DEBUG LOGS
    // =========================================================

    console.log("====================================");
    console.log("ZEHEN SATHI CHAT REQUEST");
    console.log("Model:", model);
    console.log("Has image:", Boolean(image));
    console.log("Message length:", message.length);
    console.log("History messages:", cleanHistory.length);
    console.log("====================================");

    // =========================================================
    // OPENROUTER REQUEST
    // =========================================================

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
          model: model,

          messages: messages,

          temperature: 0.2,

          max_tokens: 1200
        })
      }
    );

    // =========================================================
    // READ OPENROUTER RESPONSE
    // =========================================================

    const responseText =
      await response.text();

    let data = {};

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "OpenRouter returned invalid JSON:",
        responseText
      );

      return res.status(502).json({
        success: false,
        error:
          "OpenRouter نے صحیح جواب نہیں دیا۔",
        details:
          responseText.slice(0, 1000)
      });
    }

    // =========================================================
    // OPENROUTER ERROR
    // =========================================================

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

    // =========================================================
    // GET AI RESPONSE
    // =========================================================

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

    // =========================================================
    // SUCCESS
    // =========================================================

    console.log("ZEHEN SATHI AI SUCCESS");

    return res.status(200).json({
      success: true,
      reply: reply.trim()
    });

  } catch (error) {
    // =========================================================
    // SERVER ERROR
    // =========================================================

    console.error(
      "ZEHEN SATHI CHAT FUNCTION ERROR:",
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
