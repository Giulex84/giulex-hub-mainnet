import { NextRequest } from "next/server";

const PI_API_URL = "https://api.minepi.com/v2/payments";

export async function GET() {
  return new Response(
    JSON.stringify({ status: "Giulex Hub Mainnet API OK" }),
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!process.env.PI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "PI_API_KEY not configured" }),
        { status: 500 }
      );
    }

    /* =============================
       ENGAGEMENT TRACKING
       ============================= */

    if (action === "engage") {
      console.log("User engaged:", body.uid);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200 }
      );
    }

    /* =============================
       APPROVE PAYMENT
       ============================= */

    if (action === "approve") {
      const { paymentId } = body;

      const response = await fetch(
        `${PI_API_URL}/${paymentId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify(data), {
          status: response.status,
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
      });
    }

    /* =============================
       COMPLETE PAYMENT
       ============================= */

    if (action === "complete") {
      const { paymentId, txid } = body;

      const response = await fetch(
        `${PI_API_URL}/${paymentId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txid: txid || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify(data), {
          status: response.status,
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
      });
    }

    /* =============================
       CANCEL PAYMENT
       ============================= */

    if (action === "cancel") {
      const { paymentId } = body;

      const response = await fetch(
        `${PI_API_URL}/${paymentId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Key ${process.env.PI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify(data), {
          status: response.status,
        });
      }

      return new Response(JSON.stringify(data), {
        status: 200,
      });
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400 }
    );

  } catch (error: any) {
    console.error("API Error:", error);

    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    );
  }
}
