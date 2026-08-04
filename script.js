const chat = document.getElementById("chat");
const input = document.getElementById("userInput");


/* ==========================================
   LOAD OLD CHAT
========================================== */

window.onload = function () {

  const history =
    localStorage.getItem("zehenSathiHistory");

  if (history) {

    chat.innerHTML = history;

    chat.scrollTop =
      chat.scrollHeight;

  }

};


/* ==========================================
   SAVE CHAT
========================================== */

function saveChat() {

  localStorage.setItem(
    "zehenSathiHistory",
    chat.innerHTML
  );

}


/* ==========================================
   ADD MESSAGE
========================================== */

function addMessage(text, sender) {

  const row =
    document.createElement("div");

  row.className =
    "chat-row " + sender;


  const avatar =
    document.createElement("div");

  avatar.className =
    "avatar";

  avatar.innerHTML =
    sender === "user"
      ? "🧑"
      : "🤖";


  const msg =
    document.createElement("div");

  msg.className =
    "message " + sender;

  msg.textContent =
    text;


  if (sender === "user") {

    row.appendChild(msg);

    row.appendChild(avatar);

  } else {

    row.appendChild(avatar);

    row.appendChild(msg);

  }


  chat.appendChild(row);

  chat.scrollTop =
    chat.scrollHeight;


  saveChat();

}


/* ==========================================
   GET HISTORY
========================================== */

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

        content:
          text

      });

    });


  return messages.slice(-20);

}


/* ==========================================
   SEND MESSAGE
========================================== */

async function sendMessage() {

  const message =
    input.value.trim();


  if (!message) {

    alert(
      "براہ کرم پہلے کوئی سوال لکھیں۔"
    );

    return;

  }


  const history =
    getHistory();


  addMessage(
    message,
    "user"
  );


  input.value = "";


  /* TYPING */

  const row =
    document.createElement("div");

  row.className =
    "chat-row bot";


  row.innerHTML = `

    <div class="avatar">
      🤖
    </div>

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


    const data =
      await response.json();


    row.remove();


    addMessage(

      data.reply ||
      "معذرت، ابھی جواب دستیاب نہیں۔",

      "bot"

    );


  } catch (error) {

    console.error(
      "Chat Error:",
      error
    );


    row.remove();


    addMessage(

      "❌ سرور سے رابطہ نہیں ہو سکا۔",

      "bot"

    );

  }

}


/* ==========================================
   ENTER TO SEND
========================================== */

input.addEventListener(
  "keydown",
  function(event) {

    if (event.key === "Enter") {

      event.preventDefault();

      sendMessage();

    }

  }
);


/* ==========================================
   CLEAR CHAT
========================================== */

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
// ==========================================
// 🎤 VOICE INPUT
// ==========================================

const voiceBtn = document.getElementById("voiceBtn");

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (voiceBtn && SpeechRecognition) {

  const recognition = new SpeechRecognition();

  recognition.lang = "ur-PK";
  recognition.continuous = false;
  recognition.interimResults = false;

  voiceBtn.addEventListener("click", function () {

    recognition.start();

    voiceBtn.textContent = "🔴";

  });

  recognition.onresult = function (event) {

    const transcript =
      event.results[0][0].transcript;

    input.value = transcript;

  };

  recognition.onend = function () {

    voiceBtn.textContent = "🎤";

  };

  recognition.onerror = function (event) {

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
