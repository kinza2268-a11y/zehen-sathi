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

    // ==========================================
    // PAYMENT ID CHECK
    // ==========================================

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        error: "Payment ID missing"
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
          "Pi API key configure نہیں ہے۔ Vercel Environment Variables چیک کریں۔"
      });
    }

    // ==========================================
    // APPROVE PAYMENT
    // ==========================================

    const response = await fetch(
      `https://api.minepi.com/v2/payments/${encodeURIComponent(
        paymentId
      )}/approve`,
      {
        method: "POST",

        headers: {
          Authorization:
            `Key ${apiKey}`,

          Accept:
            "application/json"
        }
      }
    );

    // ==========================================
    // READ RESPONSE
    // ==========================================

    let data = {};

    try {
      data = await response.json();
    } catch (error) {
      console.error(
        "Pi approval JSON error:",
        error
      );
    }

    // ==========================================
    // PI API ERROR
    // ==========================================

    if (!response.ok) {
      console.error(
        "Pi payment approval failed:",
        data
      );

      return res.status(
        response.status || 500
      ).json({
        success: false,
        error:
          data?.error ||
          data?.message ||
          "Payment approval failed",
        details: data
      });
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    console.log(
      "Pi payment approved:",
      paymentId
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
      "Payment approval server error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Payment approval failed"
    });
  }
}
