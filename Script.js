"use strict";

// ==========================================
// ZEHEN SATHI AI — FINAL SCRIPT
// ==========================================

const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const voiceBtn = document.getElementById("voiceBtn");
const imageInput = document.getElementById("imageInput");
const imageUploadBtn = document.getElementById("imageUploadBtn");

const CHAT_STORAGE_KEY = "zehenSathiHistory";

let selectedImage = null;
let isSending = false;


// ==========================================
// INITIAL LOAD
// ==========================================

window.addEventListener("DOMContentLoaded", () => {
  loadChat();

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
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);

    if (saved) {
      chat.innerHTML = saved;
      chat.scrollTop = chat.scrollHeight;
    }
  } catch (error) {
    console.error("Chat load error:", error);
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
    console.error("Chat save error:", error);
  }
}


// ==========================================
// ADD TEXT MESSAGE
// ==========================================

function addMessage(text, sender, save = true) {
  if (!chat) return;

  const row = document.createElement("div");
  row.className = `chat-row ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = sender === "user" ? "🧑" : "🤖";

  const message = document.createElement("div");
  message.className = `message ${sender}`;

  // textContent استعمال کر رہے ہیں تاکہ AI کا جواب
  // HTML/script نہ بن سکے۔
  message.textContent = String(text || "");

  if (sender === "user") {
    row.appendChild(message);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(message);
  }

  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;

  if (save) {
    saveChat();
  }
}


// ==========================================
// ADD IMAGE MESSAGE
// ==========================================

function addImageMessage(image) {
  if (!chat || !image) return;

  const row = document.createElement("div");
  row.className = "chat-row user";

  const message = document.createElement("div");
  message.className = "message user";

  const img = document.createElement("img");

  img.src = image;
  img.alt = "Uploaded image";
  img.loading = "lazy";

  img.style.maxWidth = "220px";
  img.style.maxHeight = "220px";
  img.style.width = "auto";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.borderRadius = "12px";

  message.appendChild(img);

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "🧑";

  row.appendChild(message);
  row.appendChild(avatar);

  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;

  saveChat();
}


// ==========================================
// GET CHAT HISTORY
// ==========================================

function getHistory() {
  if (!chat) return [];

  const messages = [];

  chat.querySelectorAll(".chat-row").forEach(row => {
    const message = row.querySelector(".message");

    if (!message) return;

    // Images کو AI text history میں شامل نہیں کرنا
    if (message.querySelector("img")) {
      return;
    }

    const text = message.textContent.trim();

    if (!text) return;

    messages.push({
      role: row.classList.contains("user")
        ? "user"
        : "assistant",
      content: text
    });
  });

  // صرف آخری 20 messages
  return messages.slice(-20);
}


// ==========================================
// IMAGE → BASE64
// ==========================================

function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);

    reader.onerror = error => reject(error);

    reader.readAsDataURL(file);
  });
}


// ==========================================
// COMPRESS IMAGE
// ==========================================

function compressImage(file) {
  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = event => {

      const img = new Image();

      img.onload = () => {

        const maxSize = 1600;

        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {

          if (width > height) {
            height =
              Math.round(
                height * maxSize / width
              );

            width = maxSize;

          } else {

            width =
              Math.round(
                width * maxSize / height
              );

            height = maxSize;
          }
        }

        const canvas =
          document.createElement("canvas");

        canvas.width = width;
        canvas.height = height;

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          reject(
            new Error("Canvas supported نہیں ہے۔")
          );
          return;
        }

        ctx.drawImage(
          img,
          0,
          0,
          width,
          height
        );

        const result =
          canvas.toDataURL(
            "image/jpeg",
            0.82
          );

        resolve(result);
      };

      img.onerror = () => {
        reject(
          new Error("Image load نہیں ہو سکی۔")
        );
      };

      img.src = event.target.result;
    };

    reader.onerror = error => reject(error);

    reader.readAsDataURL(file);
  });
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

        imageInput.value = "";
        return;
      }

      try {

        // Image کو compress کیا جا رہا ہے
        // تاکہ request بہت بڑی نہ ہو۔
        selectedImage =
          await compressImage(file);

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
          "Image processing error:",
          error
        );

        // fallback
        try {

          selectedImage =
            await imageToBase64(file);

          addImageMessage(
            selectedImage
          );

        } catch (fallbackError) {

          console.error(
            "Image fallback error:",
            fallbackError
          );

          alert(
            "تصویر منتخب کرنے میں مسئلہ آیا۔"
          );

          selectedImage = null;
          imageInput.value = "";
        }
      }
    }
  );
}


// ==========================================
// CLEAR SELECTED IMAGE
// ==========================================

function clearSelectedImage() {

  selectedImage = null;

  if (imageInput) {
    imageInput.value = "";
  }

  if (imageUploadBtn) {
    imageUploadBtn.classList.remove(
      "selected"
    );
  }
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

  if (hasUrdu && !hasEnglish) {
    return "ur-PK";
  }

  if (hasEnglish && !hasUrdu) {
    return "en-US";
  }

  return "ur-PK";
}


// ==========================================
// SPEAK AI REPLY
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

    speech.rate = 0.88;
    speech.pitch = 1;
    speech.volume = 1;

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

  // صرف اسی وقت image بھیجیں جب user
  // موجودہ message کے ساتھ image select کرے۔
  const imageToSend =
    selectedImage;

  if (!message && !imageToSend) {

    alert(
      "براہ کرم سوال لکھیں یا تصویر منتخب کریں۔"
    );

    return;
  }

  isSending = true;

  if (sendBtn) {
    sendBtn.disabled = true;
  }

  // API کو بھیجنے سے پہلے موجودہ history لیں
  const history = getHistory();

  // User text
  if (message) {
    addMessage(
      message,
      "user"
    );
  }

  if (input) {
    input.value = "";
  }

  // ========================================
  // TYPING MESSAGE
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
  // API REQUEST
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

          body:
            JSON.stringify({
              message,
              history,
              image: imageToSend || ""
            })
        }
      );

    const responseText =
      await response.text();

    let data = {};

    try {

      data =
        JSON.parse(
          responseText
        );

    } catch (jsonError) {

      console.error(
        "Invalid JSON response:",
        responseText
      );

      data = {
        error:
          responseText ||
          "Server نے صحیح جواب نہیں دیا۔"
      };
    }

    // typing remove
    if (
      typingRow &&
      typingRow.parentNode
    ) {
      typingRow.remove();
    }

    // ======================================
    // SERVER ERROR
    // ======================================

    if (!response.ok) {

      console.error(
        "API Error:",
        data
      );

      addMessage(
        "❌ " +
        (
          data?.error ||
          data?.reply ||
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
      typeof data?.reply === "string" &&
      data.reply.trim()
        ? data.reply.trim()
        : "معذرت، AI سے جواب موصول نہیں ہوا۔";

    addMessage(
      reply,
      "bot"
    );

    // Voice reply
    speakReply(
      reply
    );

    // ======================================
    // IMPORTANT
    // ======================================
    // Image صرف ایک request کے لیے تھی۔
    // اگلے سوال میں خودکار طور پر نہیں جائے گی۔

    clearSelectedImage();

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

    isSending = false;

    if (sendBtn) {
      sendBtn.disabled = false;
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
    chat.innerHTML = "";
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

  clearSelectedImage();

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
// GLOBAL FUNCTIONS
// ==========================================

window.sendMessage =
  sendMessage;

window.clearChat =
  clearChat;
