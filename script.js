const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const voiceBtn = document.getElementById("voiceBtn");


// ==========================================
// LOAD OLD CHAT
// ==========================================

window.addEventListener("load", () => {
  const history = localStorage.getItem("zehenSathiHistory");

  if (history && chat) {
    chat.innerHTML = history;
    chat.scrollTop = chat.scrollHeight;
  }
});


// ==========================================
// SAVE CHAT
// ==========================================

function saveChat() {
  if (!chat) return;

  localStorage.setItem(
    "zehenSathiHistory",
    chat.innerHTML
  );
}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(text, sender) {
  if (!chat) return;

  const row = document.createElement("div");
  row.className = "chat-row " + sender;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = sender === "user" ? "🧑" : "🤖";

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
  const message = input ? input.value.trim() : "";

  if (!message) {
    alert("براہ کرم پہلے کوئی سوال لکھیں۔");
    return;
  }

  const history = getHistory();

  addMessage(message, "user");

  input.value = "";

  const typingRow = document.createElement("div");
  typingRow.className = "chat-row bot";

  typingRow.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="message bot">
      <span>⏳ جواب تیار ہو رہا ہے...</span>
    </div>
  `;

  chat.appendChild(typingRow);
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

    let data;

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    typingRow.remove();

    if (!response.ok) {
      const errorMessage =
        data?.reply ||
        data?.error ||
        `Server Error (${response.status})`;

      addMessage(
        "❌ " + errorMessage,
        "bot"
      );

      return;
    }

    const reply =
      data?.reply ||
      "معذرت، ابھی جواب دستیاب نہیں۔";

    addMessage(reply, "bot");

    // ========================================
    // AI VOICE
    // ========================================

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();

        const speech =
          new SpeechSynthesisUtterance(reply);

        speech.lang = "ur-PK";
        speech.rate = 0.9;
        speech.pitch = 1;

        window.speechSynthesis.speak(speech);
      } catch (voiceError) {
        console.error(
          "Voice Reply Error:",
          voiceError
        );
      }
    }

  } catch (error) {
    console.error("Chat Error:", error);

    typingRow.remove();

    addMessage(
      "❌ سرور سے رابطہ نہیں ہو سکا۔",
      "bot"
    );
  }
}


// ==========================================
// SEND BUTTON
// ==========================================

if (sendBtn) {
  sendBtn.addEventListener(
    "click",
    sendMessage
  );
}


// ==========================================
// ENTER TO SEND
// ==========================================

if (input) {
  input.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
      }
    }
  );
}


// ==========================================
// CLEAR CHAT
// ==========================================

function clearChat() {
  if (
    confirm(
      "کیا آپ پوری Chat حذف کرنا چاہتے ہیں؟"
    )
  ) {
    if (chat) {
      chat.innerHTML = "";
    }

    localStorage.removeItem(
      "zehenSathiHistory"
    );
  }
}

if (clearBtn) {
  clearBtn.addEventListener(
    "click",
    clearChat
  );
}


// ==========================================
// VOICE INPUT
// ==========================================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (voiceBtn && SpeechRecognition) {

  const recognition =
    new SpeechRecognition();

  recognition.lang = "ur-PK";
  recognition.continuous = false;
  recognition.interimResults = false;

  voiceBtn.addEventListener(
    "click",
    () => {

      try {
        recognition.start();
        voiceBtn.textContent = "🔴";
      } catch (error) {
        console.error(
          "Voice Start Error:",
          error
        );
      }

    }
  );

  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0].transcript;

      if (input) {
        input.value = transcript;
      }

    };

  recognition.onend = () => {
    voiceBtn.textContent = "🎤";
  };

  recognition.onerror =
    event => {

      console.error(
        "Voice Error:",
        event.error
      );

      voiceBtn.textContent = "🎤";
    };

} else if (voiceBtn) {

  voiceBtn.disabled = true;

  voiceBtn.title =
    "آپ کے browser میں Voice Input supported نہیں ہے۔";
}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.sendMessage = sendMessage;
window.clearChat = clearChat;
