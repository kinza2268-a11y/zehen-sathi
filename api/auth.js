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

    const accessToken =
      typeof body.accessToken === "string"
        ? body.accessToken.trim()
        : "";

    // ==========================================
    // TOKEN CHECK
    // ==========================================

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: "Access token missing"
      });
    }

    // ==========================================
    // VERIFY TOKEN WITH PI NETWORK
    // ==========================================

    const response = await fetch(
      "https://api.minepi.com/v2/me",
      {
        method: "GET",

        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json"
        }
      }
    );

    // ==========================================
    // READ RESPONSE
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
        "Pi API JSON Error:",
        responseText
      );

      return res.status(502).json({
        success: false,
        error:
          "Pi Network نے درست جواب نہیں دیا۔"
      });
    }

    // ==========================================
    // INVALID TOKEN
    // ==========================================

    if (!response.ok) {
      console.error(
        "Pi Authentication Failed:",
        JSON.stringify(data)
      );

      return res.status(401).json({
        success: false,
        error:
          data?.error ||
          data?.message ||
          "Invalid or expired Pi access token"
      });
    }

    // ==========================================
    // USER DATA CHECK
    // ==========================================

    if (
      !data ||
      typeof data !== "object"
    ) {
      return res.status(502).json({
        success: false,
        error:
          "Pi Network نے درست user data نہیں بھیجا۔"
      });
    }

    // ==========================================
    // USERNAME CHECK
    // ==========================================

    const username =
      typeof data.username === "string"
        ? data.username
        : "";

    const uid =
      typeof data.uid === "string"
        ? data.uid
        : "";

    if (!username && !uid) {
      return res.status(502).json({
        success: false,
        error:
          "Pi Network user information نہیں ملی۔"
      });
    }

    // ==========================================
    // SUCCESS
    // ==========================================

    return res.status(200).json({
      success: true,

      user: {
        uid: uid || null,
        username: username || null
      }
    });

  } catch (error) {
    // ==========================================
    // SERVER ERROR
    // ==========================================

    console.error(
      "Pi Auth Server Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Pi authentication server error"
    });
  }
}
