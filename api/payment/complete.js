export default async function handler(req, res) {
  // ==========================================
  // METHOD CHECK
  // ==========================================

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    // ==========================================
    // REQUEST BODY
    // ==========================================

    const body = req.body || {};

    const paymentId =
      typeof body.paymentId === "string"
        ? body.paymentId.trim()
        : "";

    const txid =
      typeof body.txid === "string"
        ? body.txid.trim()
        : "";

    // ==========================================
    // REQUIRED DATA
    // ==========================================

    if (!paymentId || !txid) {
      return res.status(400).json({
        success: false,
        error:
          "Payment ID and transaction ID are required"
      });
    }

    // ==========================================
    // PI API KEY
    // ==========================================

    const apiKey =
      process.env.PI_API_KEY;

    if (!apiKey) {
      console.error(
        "PI_API_KEY is missing"
      );

      return res.status(500).json({
        success: false,
        error:
          "PI_API_KEY is not configured in Vercel."
      });
    }

    // ==========================================
    // COMPLETE PAYMENT
    // ==========================================

    const response = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(
        paymentId
      )}/complete`,
      {
        method: "POST",

        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json"
        },

        body: JSON.stringify({
          txid
        })
      }
    );

    // ==========================================
    // READ PI RESPONSE
    // ==========================================

    const responseText =
      await response.text();

    let data = {};

    try {
      data = responseText
        ? JSON.parse(responseText)
        : {};
    } catch (error) {
      console.error(
        "Pi completion JSON error:",
        responseText
      );

      return res.status(502).json({
        success: false,
        error:
          "Pi Network نے درست جواب نہیں دیا۔"
      });
    }

    // ==========================================
    // PI API ERROR
    // ==========================================

    if (!response.ok) {
      console.error(
        "Pi Completion Error:",
        JSON.stringify(data)
      );

      return res.status(
        response.status >= 400 &&
        response.status < 600
          ? response.status
          : 502
      ).json({
        success: false,
        error:
          data?.error?.message ||
          data?.error ||
          data?.message ||
          "Payment completion failed"
      });
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    console.log(
      "Pi payment completed:",
      paymentId,
      txid
    );

    return res.status(200).json({
      success: true,
      payment: data
    });

  } catch (error) {
    // ==========================================
    // SERVER ERROR
    // ==========================================

    console.error(
      "Complete Server Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Payment completion failed"
    });
  }
}
