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
          "PI_API_KEY is not configured in Vercel."
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
          Authorization: `Key ${apiKey}`,
          Accept: "application/json"
        }
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
        "Pi approval JSON error:",
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
        "Pi payment approval failed:",
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
          "Payment approval failed"
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
