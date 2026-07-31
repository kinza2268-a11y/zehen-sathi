const chat = document.getElementById("chat");
const input = document.getElementById("userInput");

// پرانی Chat لوڈ کریں
window.onload = function () {
  const history = localStorage.getItem("zehenSathiHistory");

  if (history) {
    chat.innerHTML = history;
    chat.scrollTop = chat.scrollHeight;
  }
};

// Chat محفوظ کریں
function saveChat() {
  localStorage.setItem("zehenSathiHistory", chat.innerHTML);
}

// Message دکھائیں
function addMessage(text, sender) {

  const row = document.createElement("div");
  row.className = "chat-row " + sender;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.innerHTML = sender === "user" ? "🧑" : "🤖";

  const msg = document.createElement("div");
  msg.className = "message " + sender;
  msg.textContent = text;

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

// آخری 10 messages حاصل کریں
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

  return messages.slice(-10);
}

// Message بھیجیں
async function sendMessage() {

  const message = input.value.trim();

  if (!message) {
    alert("براہ کرم پہلے کوئی سوال لکھیں۔");
    return;
  }

  // موجودہ سوال سے پہلے کی history محفوظ کریں
  const history = getHistory();

  // User message دکھائیں
  addMessage(message, "user");

  input.value = "";

  // Typing animation
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

    const data = await response.json();

    row.remove();

    addMessage(
      data.reply || "معذرت، ابھی جواب دستیاب نہیں۔",
      "bot"
    );

  } catch (error) {

    console.error(error);

    row.remove();

    addMessage(
      "❌ سرور سے رابطہ نہیں ہو سکا۔",
      "bot"
    );
  }
}

// Enter سے Send
input.addEventListener("keydown", function(event) {

  if (event.key === "Enter") {
    event.preventDefault();
    sendMessage();
  }

});

// Chat صاف کریں
function clearChat() {

  if (confirm("کیا آپ پوری Chat حذف کرنا چاہتے ہیں؟")) {

    chat.innerHTML = "";

    localStorage.removeItem("zehenSathiHistory");
  }
}
