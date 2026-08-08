export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { paymentId, txid } = req.body || {};

    if (!paymentId || !txid) {
      return res.status(400).json({
        success: false,
        error: "Payment ID and transaction ID are required"
      });
    }

    const apiKey = process.env.PI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "PI_API_KEY is not configured"
      });
    }

    const response = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          txid: txid
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Pi Completion Error:", data);

      return res.status(response.status).json({
        success: false,
        error:
          data?.error?.message ||
          data?.message ||
          JSON.stringify(data)
      });
    }

    return res.status(200).json({
      success: true,
      payment: data
    });

  } catch (error) {
    console.error("Complete Server Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
