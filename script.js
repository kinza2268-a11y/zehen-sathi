const chat = document.getElementById("chat");
const input = document.getElementById("userInput");

// ==========================================
// پرانی Chat لوڈ کریں
// ==========================================

window.onload = function () {
  const history = localStorage.getItem("zehenSathiHistory");

  if (history) {
    chat.innerHTML = history;
    chat.scrollTop = chat.scrollHeight;
  }
};

// ==========================================
// Chat محفوظ کریں
// ==========================================

function saveChat() {
  localStorage.setItem(
    "zehenSathiHistory",
    chat.innerHTML
  );
}

// ==========================================
// AI جواب کو صاف Format کرنا
// ==========================================

function formatAIText(text) {

  if (!text) return "";

  // پہلے HTML کو محفوظ بنائیں
  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // <br> کو line break میں تبدیل کریں
  safe = safe.replace(
    /&lt;br\s*\/?&gt;/gi,
    "<br>"
  );

  // **Bold**
  safe = safe.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  // Markdown headings
  safe = safe.replace(
    /^###\s+(.*)$/gm,
    "<strong>$1</strong>"
  );

  safe = safe.replace(
    /^##\s+(.*)$/gm,
    "<strong>$1</strong>"
  );

  safe = safe.replace(
    /^#\s+(.*)$/gm,
    "<strong>$1</strong>"
  );

  // Bullet points
  safe = safe.replace(
    /^[\-\*]\s+(.*)$/gm,
    "• $1"
  );

  // نئی لائن
  safe = safe.replace(
    /\n/g,
    "<br>"
  );

  return safe;
}

// ==========================================
// Message دکھائیں
// ==========================================

function addMessage(text, sender) {

  const row = document.createElement("div");

  row.className =
    "chat-row " + sender;

  const avatar = document.createElement("div");

  avatar.className = "avatar";

  avatar.textContent =
    sender === "user"
      ? "🧑"
      : "🤖";

  const msg = document.createElement("div");

  msg.className =
    "message " + sender;

  // User message
  if (sender === "user") {

    msg.textContent = text;

  }

  // AI message
  else {

    msg.innerHTML =
      formatAIText(text);

  }

  // User right side
  if (sender === "user") {

    row.appendChild(msg);
    row.appendChild(avatar);

  }

  // AI left side
  else {

    row.appendChild(avatar);
    row.appendChild(msg);

  }

  chat.appendChild(row);

  chat.scrollTop =
    chat.scrollHeight;

  saveChat();
}

// ==========================================
// آخری 20 Messages حاصل کریں
// ==========================================

function getHistory() {

  const messages = [];

  document
    .querySelectorAll(".chat-row")
    .forEach(row => {

      const msg =
        row.querySelector(".message");

      if (!msg) return;

      const text =
        msg.textContent.trim();

      if (!text) return;

      messages.push({

        role:
          row.classList.contains("user")
            ? "user"
            : "assistant",

        content: text

      });

    });

  return messages.slice(-20);
}

// ==========================================
// Message بھیجیں
// ==========================================

async function sendMessage() {

  const message =
    input.value.trim();

  if (!message) {

    alert(
      "براہ کرم پہلے کوئی سوال لکھیں۔"
    );

    return;
  }

  // موجودہ سوال سے پہلے کی history
  const history =
    getHistory();

  // User message دکھائیں
  addMessage(
    message,
    "user"
  );

  // Input صاف کریں
  input.value = "";

  // ========================================
  // Typing Animation
  // ========================================

  const row =
    document.createElement("div");

  row.className =
    "chat-row bot";

  row.innerHTML = `
    <div class="avatar">🤖</div>

    <div class="message bot">

      <div class="typing">

        <span></span>
        <span></span>
        <span></span>

      </div>

    </div>
  `;

  chat.appendChild(row);

  chat.scrollTop =
    chat.scrollHeight;

  // ========================================
  // API Request
  // ========================================

  try {

    const response =
      await fetch(
        "/api/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            message:
              message,

            history:
              history

          })

        }
      );

    // Server error
    if (!response.ok) {

      throw new Error(
        "Server Error: " +
        response.status
      );

    }

    const data =
      await response.json();

    // Typing remove
    row.remove();

    // AI جواب
    addMessage(

      data.reply ||
      "معذرت، ابھی جواب دستیاب نہیں۔",

      "bot"

    );

  }

  catch (error) {

    console.error(
      "Chat Error:",
      error
    );

    row.remove();

    addMessage(

      "❌ سرور سے رابطہ نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔",

      "bot"

    );

  }

}

// ==========================================
// Enter سے Send
// ==========================================

input.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      sendMessage();

    }

  }
);

// ==========================================
// Chat صاف کریں
// ==========================================

function clearChat() {

  if (
    confirm(
      "کیا آپ پوری Chat حذف کرنا چاہتے ہیں؟"
    )
  ) {

    chat.innerHTML = "";

    localStorage.removeItem(
      "zehenSathiHistory"
    );

  }

}
