export default async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });

  }


  try {

    const {
      paymentId,
      txid
    } = req.body || {};


    if (!paymentId) {

      return res.status(400).json({
        error: "Payment ID missing"
      });

    }


    if (!txid) {

      return res.status(400).json({
        error: "Transaction ID missing"
      });

    }


    const apiKey =
      process.env.PI_API_KEY;


    if (!apiKey) {

      console.error(
        "PI_API_KEY is missing"
      );


      return res.status(500).json({
        error: "Pi API key is not configured"
      });

    }


    const response =
      await fetch(
        `https://api.minepi.com/v2/payments/${paymentId}/complete`,
        {

          method: "POST",

          headers: {

            "Authorization":
              `Key ${apiKey}`,

            "Content-Type":
              "application/json"

          },

          body: JSON.stringify({

            txid: txid

          })

        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      console.error(
        "Pi completion error:",
        data
      );


      return res.status(
        response.status
      ).json(data);

    }


    return res.status(200).json(
      data
    );


  } catch (error) {

    console.error(
      "Complete error:",
      error
    );


    return res.status(500).json({

      error:
        "Payment completion failed"

    });

  }

}
