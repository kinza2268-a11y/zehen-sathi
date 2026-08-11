const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearBtn");
const voiceBtn = document.getElementById("voiceBtn");
const imageInput = document.getElementById("imageInput");
const imageUploadBtn = document.getElementById("imageUploadBtn");

let selectedImage = null;
let lastImage = null;
let isSending = false;

const HISTORY_KEY = "zehenSathiHistory";
const IMAGE_KEY = "zehenSathiLastImage";


// ==========================================
// LOAD SAVED DATA
// ==========================================

function loadStoredData() {
  try {
    const history = localStorage.getItem(HISTORY_KEY);

    if (history && chat) {
      chat.innerHTML = history;
      chat.scrollTop = chat.scrollHeight;
    }
  } catch (error) {
    console.error("Chat history load error:", error);
  }

  try {
    lastImage = sessionStorage.getItem(IMAGE_KEY) || null;
  } catch (error) {
    console.error("Image memory load error:", error);
    lastImage = null;
  }
}


// ==========================================
// SAVE CHAT
// ==========================================

function saveChat() {
  if (!chat) return;

  try {
    localStorage.setItem(
      HISTORY_KEY,
      chat.innerHTML
    );
  } catch (error) {
    console.error("Save chat error:", error);
  }
}


// ==========================================
// SAVE LAST IMAGE
// ==========================================

function saveLastImage(image) {
  lastImage = image;

  try {
    sessionStorage.setItem(
      IMAGE_KEY,
      image
    );
  } catch (error) {
    console.warn(
      "Image could not be saved:",
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
    sessionStorage.removeItem(IMAGE_KEY);
  } catch (error) {
    console.error(
      "Clear image error:",
      error
    );
  }
}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ==========================================
// FORMAT AI REPLY
// ==========================================

function formatReply(text) {
  let value = escapeHtml(text);

  value = value.replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );

  value = value.replace(
    /`([^`]+)`
