"use strict";

// ==========================================
// ZEHEN SATHI AI — FRONTEND PI AUTH + PAYMENT
// ==========================================

const Pi = window.Pi;

const signinBtn = document.getElementById("signin");
const statusEl = document.getElementById("status");

const payPiBtn = document.getElementById("payPi");
const paymentStatusEl =
  document.getElementById("paymentStatus");

let currentUser = null;
let piReady = false;
let paymentInProgress = false;


// ==========================================
// STATUS HELPERS
// ==========================================

function setStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}


function setPaymentStatus(message) {
  if (paymentStatusEl) {
    paymentStatusEl.textContent = message;
  }
}


// ==========================================
// SAFE TEXT
// ==========================================

function safeText(value) {
  return String(value || "")
    .replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character]));
}


// ==========================================
// PI SDK CHECK
// ==========================================

function checkPiSDK() {

  if (!Pi) {

    setStatus(
      "❌ Pi SDK load نہیں ہوا۔ براہ کرم Pi Browser میں app کھولیں۔"
    );

    if (signinBtn) {
      signinBtn.disabled = true;
    }

    if (payPiBtn) {
      payPiBtn.disabled = true;
    }

    return false;
  }

  return true;
}


// ==========================================
// INITIALIZE PI
// ==========================================

function initializePi() {

  if (!checkPiSDK()) {
    return false;
  }

  try {

    Pi.init({
      version: "2.0"
    });

    piReady = true;

    setStatus(
      "🟢 Pi سے Sign In کرنے کے لیے تیار ہے۔"
    );

    return true;

  } catch (error) {

    console.error(
      "Pi.init error:",
      error
    );

    piReady = false;

    setStatus(
      "❌ Pi SDK initialize نہیں ہو سکا۔"
    );

    return false;
  }
}


// ==========================================
// INCOMPLETE PAYMENT
// ==========================================

async function onIncompletePaymentFound(payment) {

  console.log(
    "Incomplete Pi payment:",
    payment
  );

  if (!payment?.identifier) {
    return;
  }

  const paymentId =
    String(payment.identifier).trim();

  const txid =
    payment?.transaction?.txid
      ? String(payment.transaction.txid).trim()
      : "";


  // ----------------------------------------
  // اگر transaction ابھی نہیں بنی
  // تو صرف payment information دکھائیں
  // ----------------------------------------

  if (!txid) {

    setPaymentStatus(
      "⏳ ایک پرانی incomplete payment ملی ہے۔"
    );

    return;
  }


  try {

    setPaymentStatus(
      "⏳ پچھلی payment مکمل کی جا رہی ہے..."
    );


    const response =
      await fetch(
        "/api/payment/complete",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            paymentId,
            txid
          })

        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (!response.ok || !data.success) {

      console.error(
        "Incomplete payment completion failed:",
        data
      );

      setPaymentStatus(
        "⚠️ پچھلی payment مکمل نہیں ہو سکی۔"
      );

      return;
    }


    setPaymentStatus(
      "✅ پچھلی payment مکمل ہو گئی۔"
    );


  } catch (error) {

    console.error(
      "Incomplete payment error:",
      error
    );

    setPaymentStatus(
      "⚠️ پچھلی payment مکمل کرنے میں مسئلہ آیا۔"
    );
  }
}


// ==========================================
// PI LOGIN
// ==========================================

async function loginWithPi() {

  if (!piReady) {

    if (!initializePi()) {
      return;
    }
  }


  if (!Pi) {
    return;
  }


  try {

    if (signinBtn) {
      signinBtn.disabled = true;
    }

    setStatus(
      "⏳ Pi سے connect ہو رہا ہے..."
    );


    // IMPORTANT:
    // payments scope is required because
    // this app uses Pi.createPayment()

    const auth =
      await Pi.authenticate(
        [
          "username",
          "payments"
        ],
        onIncompletePaymentFound
      );


    console.log(
      "Pi authentication result:",
      auth
    );


    if (!auth) {

      throw new Error(
        "Pi authentication failed."
      );
    }


    if (!auth.accessToken) {

      throw new Error(
        "Pi access token نہیں ملا۔"
      );
    }


    // ======================================
    // VERIFY TOKEN ON VERCEL SERVER
    // ======================================

    setStatus(
      "⏳ Pi account verify ہو رہا ہے..."
    );


    const response =
      await fetch(
        "/api/auth",
        {

          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            accessToken:
              auth.accessToken

          })

        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (!response.ok || !data.success) {

      console.error(
        "Server authentication error:",
        data
      );

      throw new Error(
        data?.error ||
        "Pi account verification failed."
      );
    }


    // ======================================
    // SAVE USER
    // ======================================

    currentUser =
      data.user || auth.user || null;


    const username =
      currentUser?.username ||
      auth?.user?.username ||
      "User";


    setStatus(
      `✅ Welcome ${username}`
    );


    if (signinBtn) {

      signinBtn.textContent =
        "✅ Pi سے Sign In ہو گیا";

      signinBtn.disabled =
        true;
    }


    // Payment button available
    if (payPiBtn) {
      payPiBtn.disabled = false;
    }


    console.log(
      "Pi user verified:",
      currentUser
    );


  } catch (error) {

    console.error(
      "Pi Login Error:",
      error
    );


    setStatus(
      "❌ Login Failed: " +
      (
        error?.message ||
        "دوبارہ کوشش کریں۔"
      )
    );


    if (signinBtn) {
      signinBtn.disabled = false;
    }
  }
}


// ==========================================
// CREATE PI PAYMENT
// ==========================================

async function makePayment() {

  if (paymentInProgress) {
    return;
  }


  if (!piReady || !Pi) {

    setPaymentStatus(
      "❌ Pi SDK available نہیں ہے۔"
    );

    return;
  }


  paymentInProgress = true;


  if (payPiBtn) {
    payPiBtn.disabled = true;
  }


  try {

    setPaymentStatus(
      "⏳ Payment تیار ہو رہی ہے..."
    );


    const paymentData = {

      amount: 0.01,

      memo:
        "ZEHEN SATHI AI Testnet Payment",

      metadata: {

        app:
          "zehen-sathi",

        purpose:
          "developer-test",

        timestamp:
          Date.now()

      }

    };


    await Pi.createPayment(

      paymentData,

      {

        // ==================================
        // SERVER APPROVAL
        // ==================================

        onReadyForServerApproval:
          async paymentId => {

            console.log(
              "Payment ready for approval:",
              paymentId
            );


            setPaymentStatus(
              "⏳ Payment approve ہو رہی ہے..."
            );


            try {

              const response =
                await fetch(
                  "/api/payment/approve",
                  {

                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json"
                    },

                    body: JSON.stringify({

                      paymentId:
                        String(paymentId)

                    })

                  }
                );


              const data =
                await response.json()
                  .catch(() => ({}));


              if (
                !response.ok ||
                !data.success
              ) {

                console.error(
                  "Payment approval failed:",
                  data
                );


                setPaymentStatus(
                  "❌ Payment approval failed: " +
                  (
                    data?.error ||
                    "Unknown error"
                  )
                );

                return;
              }


              console.log(
                "Payment approved:",
                data
              );


              setPaymentStatus(
                "💳 Wallet میں payment confirm کریں..."
              );


            } catch (error) {

              console.error(
                "Approval request error:",
                error
              );


              setPaymentStatus(
                "❌ Payment approval میں مسئلہ آیا۔"
              );
            }

          },


        // ==================================
        // SERVER COMPLETION
        // ==================================

        onReadyForServerCompletion:
          async (
            paymentId,
            txid
          ) => {

            console.log(
              "Payment ready for completion:",
              paymentId,
              txid
            );


            setPaymentStatus(
              "⏳ Payment مکمل ہو رہی ہے..."
            );


            try {

              const response =
                await fetch(
                  "/api/payment/complete",
                  {

                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json"
                    },

                    body: JSON.stringify({

                      paymentId:
                        String(paymentId),

                      txid:
                        String(txid)

                    })

                  }
                );


              const data =
                await response.json()
                  .catch(() => ({}));


              if (
                !response.ok ||
                !data.success
              ) {

                console.error(
                  "Payment completion failed:",
                  data
                );


                setPaymentStatus(
                  "❌ Payment completion failed: " +
                  (
                    data?.error ||
                    "Unknown error"
                  )
                );

                return;
              }


              console.log(
                "Payment completed:",
                data
              );


              setPaymentStatus(
                "✅ 0.01 Pi payment کامیابی سے مکمل ہو گئی۔"
              );


            } catch (error) {

              console.error(
                "Completion request error:",
                error
              );


              setPaymentStatus(
                "❌ Payment complete کرنے میں مسئلہ آیا۔"
              );
            }

          }

      }

    );


  } catch (error) {

    console.error(
      "Pi Payment Error:",
      error
    );


    const message =
      error?.message ||
      "Payment شروع نہیں ہو سکی۔";


    setPaymentStatus(
      "❌ " + message
    );


  } finally {

    paymentInProgress = false;


    if (payPiBtn) {
      payPiBtn.disabled = false;
    }
  }
}


// ==========================================
// LOGIN BUTTON
// ==========================================

if (signinBtn) {

  signinBtn.addEventListener(
    "click",
    loginWithPi
  );

}


// ==========================================
// PAYMENT BUTTON
// ==========================================

if (payPiBtn) {

  payPiBtn.addEventListener(
    "click",
    makePayment
  );

}


// ==========================================
// START
// ==========================================

window.addEventListener(
  "DOMContentLoaded",
  () => {

    initializePi();

  }
);


// ==========================================
// GLOBAL
// ==========================================

window.loginWithPi =
  loginWithPi;

window.makePayment =
  makePayment;
