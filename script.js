"use strict";

// ==========================================
// ZEHEN SATHI AI — COMPLETE SCRIPT
// ==========================================

const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const voiceBtn = document.getElementById("voiceBtn");
const imageInput = document.getElementById("imageInput");
const imageUploadBtn = document.getElementById("imageUploadBtn");

const CHAT_STORAGE_KEY = "zehenSathiHistory";
const IMAGE_STORAGE_KEY = "zehenSathiLastImage";

let selectedImage = null;
let lastImage = null;
let isSending = false;


// ==========================================
// LOAD
// ==========================================

window.addEventListener("DOMContentLoaded", () => {

  loadChat();
  loadLastImage();

  if (chat && chat.children.length === 0) {

    addMessage(
      "السلام علیکم! 👋 میں ZEHEN SATHI AI ہوں۔ آپ اردو، Roman Urdu یا English میں سوال پوچھ سکتے ہیں۔",
      "bot"
    );

  }

});


// ==========================================
// LOAD CHAT
// ==========================================

function loadChat() {

  if (!chat) return;

  try {

    const history =
      localStorage.getItem(CHAT_STORAGE_KEY);

    if (history) {

      chat.innerHTML = history;

      chat.scrollTop =
        chat.scrollHeight;

    }

  } catch (error) {

    console.error(
      "Chat load error:",
      error
    );

  }

}


// ==========================================
// LOAD LAST IMAGE
// ==========================================

function loadLastImage() {

  try {

    const image =
      sessionStorage.getItem(
        IMAGE_STORAGE_KEY
      );

    if (image) {

      lastImage = image;

    }

  } catch (error) {

    console.error(
      "Image load error:",
      error
    );

  }

}


// ==========================================
// SAVE CHAT
// ==========================================

function saveChat() {

  if (!chat) return;

  try {

    localStorage.setItem(
      CHAT_STORAGE_KEY,
      chat.innerHTML
    );

  } catch (error) {

    console.error(
      "Chat save error:",
      error
    );

  }

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(
  text,
  sender,
  save = true
) {

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


  const message =
    document.createElement("div");

  message.className =
    "message " + sender;

  message.textContent =
    String(text || "");


  if (sender === "user") {

    row.appendChild(message);
    row.appendChild(avatar);

  } else {

    row.appendChild(avatar);
    row.appendChild(message);

  }


  chat.appendChild(row);

  chat.scrollTop =
    chat.scrollHeight;


  if (save) {

    saveChat();

  }

}


// ==========================================
// ADD IMAGE MESSAGE
// ==========================================

function addImageMessage(image) {

  if (!chat || !image) return;

  const row =
    document.createElement("div");

  row.className =
    "chat-row user";


  const message =
    document.createElement("div");

  message.className =
    "message user";


  const img =
    document.createElement("img");

  img.src =
    image;

  img.alt =
    "Uploaded image";

  img.style.maxWidth =
    "220px";

  img.style.maxHeight =
    "220px";

  img.style.width =
    "auto";

  img.style.height =
    "auto";

  img.style.display =
    "block";

  img.style.borderRadius =
    "12px";


  message.appendChild(img);


  const avatar =
    document.createElement("div");

  avatar.className =
    "avatar";

  avatar.textContent =
    "🧑";


  row.appendChild(message);
  row.appendChild(avatar);


  chat.appendChild(row);

  chat.scrollTop =
    chat.scrollHeight;


  saveChat();

}


// ==========================================
// GET HISTORY
// ==========================================

function getHistory() {

  if (!chat) return [];

  const messages = [];


  chat
    .querySelectorAll(".chat-row")
    .forEach(row => {

      const message =
        row.querySelector(".message");

      if (!message) return;


      // تصویر کو history میں شامل نہ کریں

      if (
        message.querySelector("img")
      ) {

        return;

      }


      const text =
        message.textContent.trim();


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
        () => {

          resolve(
            reader.result
          );

        };


      reader.onerror =
        error => {

          reject(error);

        };


      reader.readAsDataURL(file);

    }
  );

}


// ==========================================
// SAVE LAST IMAGE
// ==========================================

function saveLastImage(image) {

  if (!image) return;

  lastImage =
    image;


  try {

    sessionStorage.setItem(
      IMAGE_STORAGE_KEY,
      image
    );

  } catch (error) {

    console.warn(
      "Image session save failed:",
      error
    );

  }

}


// ==========================================
// CLEAR IMAGE
// ==========================================

function clearLastImage() {

  selectedImage =
    null;

  lastImage =
    null;


  try {

    sessionStorage.removeItem(
      IMAGE_STORAGE_KEY
    );

  } catch (error) {

    console.error(
      "Image clear error:",
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


      if (
        !file.type.startsWith("image/")
      ) {

        alert(
          "براہ کرم صرف تصویر منتخب کریں۔"
        );

        imageInput.value =
          "";

        return;

      }


      try {

        selectedImage =
          await imageToBase64(file);


        saveLastImage(
          selectedImage
        );


        addImageMessage(
          selectedImage
        );


        if (imageUploadBtn) {

          imageUploadBtn.classList.add(
            "selected"
          );

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
// VOICE LANGUAGE
// ==========================================

function detectVoiceLanguage(text) {

  if (!text) {

    return "ur-PK";

  }


  const hasUrdu =
    /[\u0600-\u06FF]/.test(text);


  const hasEnglish =
    /[A-Za-z]/.test(text);


  if (
    hasUrdu &&
    !hasEnglish
  ) {

    return "ur-PK";

  }


  if (
    hasEnglish &&
    !hasUrdu
  ) {

    return "en-US";

  }


  return "ur-PK";

}


// ==========================================
// SPEAK REPLY
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
      "Voice reply error:",
      error
    );

  }

}


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage() {

  if (isSending) return;


  const message =
    input
      ? input.value.trim()
      : "";


  const imageToSend =
    selectedImage ||
    lastImage ||
    null;


  if (
    !message &&
    !imageToSend
  ) {

    alert(
      "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
    );

    return;

  }


  isSending =
    true;


  if (sendBtn) {

    sendBtn.disabled =
      true;

  }


  // History پہلے لیں

  const history =
    getHistory();


  // User text دکھائیں

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


  const typingAvatar =
    document.createElement("div");

  typingAvatar.className =
    "avatar";

  typingAvatar.textContent =
    "🤖";


  const typingMessage =
    document.createElement("div");

  typingMessage.className =
    "message bot";

  typingMessage.textContent =
    "⏳ جواب تیار ہو رہا ہے...";


  typingRow.appendChild(
    typingAvatar
  );

  typingRow.appendChild(
    typingMessage
  );


  if (chat) {

    chat.appendChild(
      typingRow
    );

    chat.scrollTop =
      chat.scrollHeight;

  }


  // ========================================
  // API
  // ========================================

  try {

    console.log(
      "Sending request to /api/chat"
    );


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

              image:
                imageToSend

            })

        }
      );


    console.log(
      "API status:",
      response.status
    );


    // ======================================
    // RESPONSE
    // ======================================

    let data = {};


    const responseText =
      await response.text();


    try {

      data =
        JSON.parse(
          responseText
        );

    } catch (jsonError) {

      console.error(
        "Invalid JSON:",
        responseText
      );

      data = {

        error:
          responseText ||
          "Server نے صحیح جواب نہیں دیا۔"

      };

    }


    // Typing remove

    if (
      typingRow &&
      typingRow.parentNode
    ) {

      typingRow.remove();

    }


    // ======================================
    // ERROR
    // ======================================

    if (!response.ok) {

      console.error(
        "API Error:",
        data
      );


      addMessage(
        "❌ " +
        (
          data?.reply ||
          data?.error ||
          `Server Error (${response.status})`
        ),
        "bot"
      );


      return;

    }


    // ======================================
    // AI REPLY
    // ======================================

    const reply =
      data?.reply ||
      "معذرت، AI سے جواب موصول نہیں ہوا۔";


    addMessage(
      reply,
      "bot"
    );


    speakReply(
      reply
    );


    // نئی تصویر selected سے ختم کریں
    // لیکن lastImage محفوظ رہے گی

    selectedImage =
      null;


    if (imageInput) {

      imageInput.value =
        "";

    }


    if (imageUploadBtn) {

      imageUploadBtn.classList.remove(
        "selected"
      );

    }


  } catch (error) {

    console.error(
      "Fetch Error:",
      error
    );


    if (
      typingRow &&
      typingRow.parentNode
    ) {

      typingRow.remove();

    }


    addMessage(
      "❌ سرور سے رابطہ نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔",
      "bot"
    );

  } finally {

    isSending =
      false;


    if (sendBtn) {

      sendBtn.disabled =
        false;

    }


    if (input) {

      input.focus();

    }

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
        event.key === "Enter" &&
        !event.shiftKey
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
    !confirm(
      "کیا آپ پوری Chat حذف کرنا چاہتے ہیں؟"
    )
  ) {

    return;

  }


  if (chat) {

    chat.innerHTML =
      "";

  }


  try {

    localStorage.removeItem(
      CHAT_STORAGE_KEY
    );

  } catch (error) {

    console.error(
      "Clear chat error:",
      error
    );

  }


  clearLastImage();


  if (imageInput) {

    imageInput.value =
      "";

  }


  if (imageUploadBtn) {

    imageUploadBtn.classList.remove(
      "selected"
    );

  }


  addMessage(
    "السلام علیکم! 👋 میں ZEHEN SATHI AI ہوں۔ آپ اردو، Roman Urdu یا English میں سوال پوچھ سکتے ہیں۔",
    "bot"
  );

}


// ==========================================
// CLEAR BUTTON
// ==========================================

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


        voiceBtn.classList.add(
          "listening"
        );


        voiceBtn.textContent =
          "🔴";

      } catch (error) {

        console.error(
          "Voice start error:",
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

        input.focus();

      }

    };


  recognition.onend =
    () => {

      voiceBtn.classList.remove(
        "listening"
      );

      voiceBtn.textContent =
        "🎤";

    };


  recognition.onerror =
    event => {

      console.error(
        "Voice error:",
        event.error
      );


      voiceBtn.classList.remove(
        "listening"
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
// GLOBAL
// ==========================================

window.sendMessage =
  sendMessage;

window.clearChat =
  clearChat;
