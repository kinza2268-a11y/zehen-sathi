        cleanMessage
      ) ||
      /^
Then:
User: "
               ||
      "معذرت، ابھی جواب دستیاب نہیں۔";

    // ==========================================
    // CLEAN THINKING TAGS
    // ==========================================

    reply = reply
      .replace(
        /<think>[\s\S]*?<\/think>/gi,
        ""
      )
      .replace(
        /<analysis>[\s\S]*?<\/analysis>/gi,
        ""
      )
      .trim();

    // ==========================================
    // FINAL RESPONSE
    // ==========================================

    return res.status(200).json({
      reply
    });

  } catch (error) {

    console.error(
      "Server Error:",
      error
    );

    return res.status(500).json({
      reply:
        "❌ Server Error: " +
        (
          error?.message ||
          "Unknown error"
        )
    });
  }
}
