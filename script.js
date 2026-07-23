const chat = document.getElementById("chat");
const input = document.getElementById("userInput");

function addMessage(text, sender) {
  const div = document.createElement("div");
  div.className = "message " + sender;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function sendMessage() {
  const message = input.value.trim();
  if (!message) return;

  addMessage(message, "user");
  input.value = "";

  addMessage("ذہین ساتھی سوچ رہا ہے...", "bot");

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
    addMessage(data.reply || "کوئی جواب نہیں ملا۔", "bot");

  } catch (e) {
    chat.lastChild.remove();
    addMessage("سرور سے رابطہ نہیں ہو سکا۔", "bot");
  }
}
