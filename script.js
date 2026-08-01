const chat = document.getElementById("chat");
const input = document.getElementById("userInput");

// ==========================================
// CHAT LOAD
// ==========================================

window.onload = function () {
  const history = localStorage.getItem("zehenSathiHistory");

  if (history) {
    chat.innerHTML = history;
    chat.scrollTop = chat.scrollHeight;
  }
};

// ==========================================
// SAVE CHAT
// ==========================================

function saveChat() {
  localStorage.setItem("zehenSathiHistory", chat.innerHTML);
}

// ==========================================
// FORMAT AI RESPONSE
// ==========================================

function formatAIText(text) {

  if (!text) return "";

  let safe = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  safe = safe.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );

  // Italic
  safe = safe.replace(
    /(^|[^*])\*(.*?)\*(?!\*)/g,
    "$1<em>$2</em>"
  );

  // Code
  safe = safe.replace(
    /`([^`]+)`/g,
    "<code>$1</code>"
  );

  // Line breaks
  safe = safe.replace(/\n/g, "<br>");

  return safe;
}

// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(text, sender) {

  const row = document.createElement("div");
  row.className = "chat-row " + sender;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = sender === "user" ? "🧑" : "🤖";

  const msg = document.createElement("div");
  msg.className = "message " + sender;

  if (sender === "bot") {
    msg.innerHTML = formatAIText(text);
  } else {
    msg.textContent = text;
  }

  if (sender === "user") {
    row.appendChild(msg);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(msg);
  }

  chat.appendChild(row);

  chat.scrollTop = chat.scrollHeight;

  saveChat();
}

// ==========================================
// GET CHAT HISTORY
// ==========================================

function getHistory() {

  const messages = [];

  document.querySelectorAll(".chat-row").forEach(row => {

    const msg = row.querySelector(".message");

    if (!msg) return;

    const text = msg.textContent.trim();

    if (!text) return;

    messages.push({
      role: row.classList.contains("user")
        ? "user"
        : "assistant",
      content: text
    });

  });

  return messages.slice(-20);
}

// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

  const message = input.value.trim();

  if (!message) {
    alert("براہ کرم پہلے کوئی سوال لکھیں۔");
    return;
  }

  // موجودہ سوال سے پہلے کی history
  const history = getHistory();

  // User message
  addMessage(message, "user");

  input.value = "";

  // ========================================
  // TYPING ANIMATION
  // ========================================

  const row = document.createElement("div");

  row.className = "chat-row bot";

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

  chat.scrollTop = chat.scrollHeight;

  try {

    // ======================================
    // API REQUEST
    // ======================================

    const response = await fetch("/api/chat", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: message,
        history: history
      })

    });

    // ======================================
    // RESPONSE CHECK
    // ======================================

    if (!response.ok) {

      throw new Error(
        "Server returned " + response.status
      );

    }

    const data = await response.json();

    // Typing remove
    row.remove();

    // AI reply
    addMessage(
      data.reply ||
      "معذرت، ابھی جواب دستیاب نہیں۔",
      "bot"
    );

  } catch (error) {

    console.error("Chat Error:", error);

    row.remove();

    addMessage(
      "❌ سرور سے رابطہ نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔",
      "bot"
    );

  }

}

// ==========================================
// ENTER TO SEND
// ==========================================

input.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {

      event.preventDefault();

      sendMessage();

    }

  }
);

// ==========================================
// CLEAR CHAT
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
