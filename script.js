"use strict";

// ==========================================
// ZEHEN SATHI AI — MAIN SCRIPT
// ==========================================

const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const voiceBtn = document.getElementById("voiceBtn");
const imageInput = document.getElementById("imageInput");

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
      "bot",
      false
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
      chat.scrollTop = chat.scrollHeight;
    }
  } catch (error) {
    console.error("Chat load error:", error);
  }
}


// ==========================================
// LOAD LAST IMAGE
// ==========================================

function loadLastImage() {
  try {
    const image =
      sessionStorage.getItem(IMAGE_STORAGE_KEY);

    if (image) {
      lastImage = image;
    }
  } catch (error) {
    console.error("Image load error:", error);
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
  avatar.textContent =
    sender === "user" ? "🧑" : "🤖";

  const message = document.createElement("div");
  message.className = `message ${sender}`;
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

function addImageMessage(image, sender = "user") {
  if (!chat || !image) return;

  const row = document.createElement("div");
  row.className = `chat-row ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent =
    sender === "user" ? "🧑" : "🤖";

  const message = document.createElement("div");
  message.className = `message ${sender}`;

  const img = document.createElement("img");

  img.src = image;
  img.alt = "Uploaded image";

  img.style.maxWidth = "220px";
  img.style.maxHeight = "220px";
  img.style.width = "auto";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.borderRadius = "12px";

  message.appendChild(img);

  if (sender === "user") {
    row.appendChild(message);
    row.appendChild(avatar);
  } else {
    row.appendChild(avatar);
    row.appendChild(message);
  }

  chat.appendChild(row);
  chat.scrollTop = chat.scrollHeight;

  saveChat();
}


// ==========================================
// GET HISTORY
// ==========================================

function getHistory() {
  if (!chat) return [];

  const messages = [];

  chat.querySelectorAll(".chat-row").forEach(row => {
    const message =
      row.querySelector(".message");

    if (!message) return;

    // تصویر کو AI history میں text نہ بنائیں
    if (message.querySelector("img")) return;

    const text =
      message.textContent.trim();

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
// IMAGE TO BASE64
// ==========================================

function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = error => {
      reject(error);
    };

    reader.readAsDataURL(file);
  });
}


// ==========================================
// SAVE IMAGE
// ==========================================

function saveLastImage(image) {
  if (!image) return;

  lastImage = image;

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
  selectedImage = null;
  lastImage = null;

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

      if (!file.type.startsWith("image/")) {
        alert("براہ کرم صرف تصویر منتخب کریں۔");
        imageInput.value = "";
        return;
      }

      try {
        selectedImage =
          await imageToBase64(file);

        saveLastImage(selectedImage);

        addImageMessage(
          selectedImage,
          "user"
        );

        const uploadBtn =
          document.getElementById(
            "imageUploadBtn"
          );

        if (uploadBtn) {
          uploadBtn.classList.add("selected");
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
  if (!text) return "ur-PK";

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
