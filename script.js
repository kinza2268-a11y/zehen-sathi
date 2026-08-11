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
// INITIAL LOAD
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
      sessionStorage.getItem(IMAGE_STORAGE_KEY);

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
    `chat-row ${sender}`;


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
    `message ${sender}`;

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

function addImageMessage(
  image,
  sender = "user"
) {

  if (!chat || !image) return;

  const row =
    document.createElement("div");

  row.className =
    `chat-row ${sender}`;


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
    `message ${sender}`;


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

  img.style
