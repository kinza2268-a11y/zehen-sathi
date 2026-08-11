const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const voiceBtn = document.getElementById("voiceBtn");
const imageInput = document.getElementById("imageInput");


// ==========================================
// IMAGE MEMORY
// ==========================================

let selectedImage = null;
let lastImage = null;


// ==========================================
// LOAD OLD CHAT
// ==========================================

window.addEventListener("load", () => {

  const history =
    localStorage.getItem("zehenSathiHistory");

  if (history && chat) {
    chat.innerHTML = history;
    chat.scrollTop = chat.scrollHeight;
  }

  // آخری تصویر session میں محفوظ ہو تو واپس لائیں
  try {

    const savedImage =
      sessionStorage.getItem("zehenSathiLastImage");

    if (savedImage) {
      lastImage = savedImage;
    }

  } catch (error) {

    console.error(
      "Image memory error:",
      error
    );

  }

});


// ==========================================
// SAVE CHAT
// ==========================================

function saveChat() {

  if (!chat) return;

  try {

    localStorage.setItem(
      "zehenSathiHistory",
      chat.innerHTML
    );

  } catch (error) {

    console.error(
      "Save chat error:",
      error
    );

  }

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(text, sender) {

  if (!chat) return;

  const row =
    document.createElement("div");

  row.className =
    "chat-row " + sender;


  const avatar =
    document.createElement("div");

  avatar.className =
    "avatar";

  avatar.textContent =
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


// ==========================================
// GET CHAT HISTORY
// ==========================================

function getHistory() {

  const messages = [];

  document
    .querySelectorAll(".chat-row")
    .forEach(row => {

      const msg =
        row.querySelector(".message");

      if (!msg) return;


      // تصویر والے message کو history میں
      // دوبارہ text کے طور پر شامل نہ کریں

      const img =
        msg.querySelector("img");

      if (img) return;


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


// ==========================================
// IMAGE TO BASE64
// ==========================================

function imageToBase64(file) {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();


      reader.onload =
        () => resolve(reader.result);


      reader.onerror =
        error => reject(error);


      reader.readAsDataURL(file);

    }
  );

}


// ==========================================
// SAVE LAST IMAGE
// ==========================================

function saveLastImage(image) {

  lastImage = image;

  try {

    sessionStorage.setItem(
      "zehenSathiLastImage",
      image
    );

  } catch (error) {

    console.warn(
      "Image could not be saved in session:",
      error
    );

  }

}


// ==========================================
// CLEAR LAST IMAGE
// ==========================================

function clearLastImage() {

  selectedImage = null;
  lastImage = null;

  try {

    sessionStorage.removeItem(
      "zehenSathiLastImage"
    );

  } catch (error) {

    console.error(
      "Clear image error:",
      error
    );

  }

}


// ==========================================
// IMAGE SELECT
// ==========================================

if (imageInput) {

  imageInput.addEventListener(
    "change",
    async event => {

      const file =
        event.target.files &&
        event.target.files[0];


      if (!file) return;


      if (!file.type.startsWith("image/")) {

        alert(
          "براہ کرم صرف تصویر منتخب کریں۔"
        );

        return;

      }


      try {

        selectedImage =
          await imageToBase64(file);


        // آخری تصویر محفوظ کریں
        saveLastImage(
          selectedImage
        );


        // ====================================
        // IMAGE PREVIEW
        // ====================================

        const row =
          document.createElement("div");

        row.className =
          "chat-row user";


        const msg =
          document.createElement("div");

        msg.className =
          "message user";


        const img =
          document.createElement("img");

        img.src =
          selectedImage;

        img.style.maxWidth =
          "220px";

        img.style.maxHeight =
          "220px";

        img.style.borderRadius =
          "12px";

        img.style.display =
          "block";


        msg.appendChild(
          img
        );


        const avatar =
          document.createElement("div");

        avatar.className =
          "avatar";

        avatar.textContent =
          "🧑";


        row.appendChild(msg);
        row.appendChild(avatar);


        chat.appendChild(row);


        chat.scrollTop =
          chat.scrollHeight;


        saveChat();


        // Upload button indication

        if (
          imageInput.parentElement
        ) {

          imageInput.parentElement.style.opacity =
            "0.7";

        }

      } catch (error) {

        console.error(
          "Image Error:",
          error
        );


        alert(
          "تصویر منتخب کرنے میں مسئلہ آیا۔"
        );

      }

    }
  );

}


// ==========================================
// DETECT VOICE LANGUAGE
// ==========================================

function detectVoiceLanguage(text) {

  if (!text) {
    return "ur-PK";
  }


  const hasUrdu =
    /[\u0600-\u06FF]/.test(text);


  const hasEnglish =
    /[A-Za-z]/.test(text);


  // صرف اردو
  if (
    hasUrdu &&
    !hasEnglish
  ) {

    return "ur-PK";

  }


  // صرف English
  if (
    hasEnglish &&
    !hasUrdu
  ) {

    return "en-US";

  }


  // Mixed جواب میں اردو
  // کیونکہ ہمارا AI اردو کو ترجیح دیتا ہے

  return "ur-PK";

}


// ==========================================
// SPEAK AI ANSWER
// ==========================================

function speakReply(text) {

  if (
    !("speechSynthesis" in window)
  ) {

    return;

  }


  if (!text) return;


  try {

    window.speechSynthesis.cancel();


    const speech =
      new SpeechSynthesisUtterance(
        text
      );


    speech.lang =
      detectVoiceLanguage(text);


    speech.rate =
      0.88;


    speech.pitch =
      1;


    speech.volume =
      1;


    window.speechSynthesis.speak(
      speech
    );


  } catch (error) {

    console.error(
      "Voice Reply Error:",
      error
    );

  }

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

  const message =
    input
      ? input.value.trim()
      : "";


  // ========================================
  // IMPORTANT:
  // Selected image OR previous image
  // ========================================

  const imageToSend =
    selectedImage ||
    lastImage ||
    null;


  // ========================================
  // TEXT AND IMAGE دونوں خالی ہوں
  // ========================================

  if (
    !message &&
    !imageToSend
  ) {

    alert(
      "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
    );

    return;

  }


  // ========================================
  // GET HISTORY BEFORE ADDING NEW MESSAGE
  // ========================================

  const history =
    getHistory();


  // ========================================
  // USER MESSAGE
  // ========================================

  if (message) {

    addMessage(
      message,
      "user"
    );

  }


  if (input) {

    input.value =
      "";

  }


  // ========================================
  // TYPING
  // ========================================

  const typingRow =
    document.createElement("div");


  typingRow.className =
    "chat-row bot";


  typingRow.innerHTML = `

    <div class="avatar">
      🤖
    </div>

    <div class="message bot">
      ⏳ جواب تیار ہو رہا ہے...
    </div>

  `;


  chat.appendChild(
    typingRow
  );


  chat.scrollTop =
    chat.scrollHeight;


  try {

    // ======================================
    // API REQUEST
    // ======================================

    const response =
      await fetch(
        "/api/chat",
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              message:
                message,

              history:
                history,

              // IMPORTANT:
              // نئی تصویر ہو تو وہ،
              // ورنہ آخری تصویر
              image:
                imageToSend

            })

        }
      );


    // ======================================
    // READ RESPONSE
    // ======================================

    let data = {};


    try {

      data =
        await response.json();

    } catch (jsonError) {

      console.error(
        "JSON Error:",
        jsonError
      );

    }


    // Typing remove

    typingRow.remove();


    // ======================================
    // SERVER ERROR
    // ======================================

    if (!response.ok) {

      const errorMessage =
        data?.reply ||
        data?.error ||
        `Server Error (${response.status})`;


      addMessage(
        "❌ " +
        errorMessage,
        "bot"
      );


      return;

    }


    // ======================================
    // AI REPLY
    // ======================================

    const reply =
      data?.reply ||
      "معذرت، ابھی جواب دستیاب نہیں۔";


    addMessage(
      reply,
      "bot"
    );


    // ======================================
    // AI VOICE
    // ======================================

    speakReply(
      reply
    );


    // ======================================
    // NEW IMAGE COMPLETE
    // ======================================

    // selectedImage صاف کریں
    // لیکن lastImage محفوظ رہنے دیں

    selectedImage =
      null;


    if (imageInput) {

      imageInput.value =
        "";


      if (
        imageInput.parentElement
      ) {

        imageInput.parentElement.style.opacity =
          "1";

      }

    }


  } catch (error) {

    console.error(
      "Chat Error:",
      error
    );


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

      if (
        event.key === "Enter"
      ) {

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

      chat.innerHTML =
        "";

    }


    localStorage.removeItem(
      "zehenSathiHistory"
    );


    // تصویر بھی مکمل صاف
    clearLastImage();


    if (imageInput) {

      imageInput.value =
        "";

    }

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


if (
  voiceBtn &&
  SpeechRecognition
) {

  const recognition =
    new SpeechRecognition();


  recognition.lang =
    "ur-PK";


  recognition.continuous =
    false;


  recognition.interimResults =
    false;


  voiceBtn.addEventListener(
    "click",
    () => {

      try {

        recognition.start();


        voiceBtn.textContent =
          "🔴";

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
        event
          .results[0][0]
          .transcript;


      if (input) {

        input.value =
          transcript;

      }

    };


  recognition.onend =
    () => {

      voiceBtn.textContent =
        "🎤";

    };


  recognition.onerror =
    event => {

      console.error(
        "Voice Error:",
        event.error
      );


      voiceBtn.textContent =
        "🎤";

    };


} else if (voiceBtn) {

  voiceBtn.disabled =
    true;


  voiceBtn.title =
    "آپ کے browser میں Voice Input supported نہیں ہے۔";

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.sendMessage =
  sendMessage;


window.clearChat =
  clearChat;
