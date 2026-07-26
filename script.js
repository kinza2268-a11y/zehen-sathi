
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

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = text;
  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;

  saveChat();
}

async function sendMessage() {

  const message = input.value.trim();

  if (!message) {
    alert("براہ کرم پہلے کوئی سوال لکھیں۔");
    return;
  }

  addMessage(message, "user");

  input.value = "";

  addMessage("🤖 ZEHEN SATHI AI سوچ رہی ہے...", "bot");

  try {

    const response = await fetch("/api/chat", {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: message
      })

    });

    const data = await response.json();

    chat.lastChild.remove();

    addMessage(
      data.reply || "معذرت، ابھی جواب دستیاب نہیں۔",
      "bot"
    );

  } catch (e) {

    chat.lastChild.remove();

    addMessage(
      "❌ سرور سے رابطہ نہیں ہو سکا۔",
      "bot"
    );

  }

}

// Enter سے Send
input.addEventListener("keydown", function (event) {

  if (event.key === "Enter") {
    sendMessage();
  }

});

// Chat صاف کرنے کا فنکشن
function clearChat() {

  if (confirm("کیا آپ پوری Chat حذف کرنا چاہتے ہیں؟")) {

    chat.innerHTML = "";

    localStorage.removeItem("zehenSathiHistory");

  }

}
