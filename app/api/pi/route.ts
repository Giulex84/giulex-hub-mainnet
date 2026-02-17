import { NextRequest, NextResponse } from "next/server";

const PI_API_KEY = process.env.PI_API_KEY;
const PI_API_URL = "https://api.minepi.com/v2/payments";

export async function GET() {
  return NextResponse.json({ status: "Giulex Hub Mainnet API OK" });
}

export async function POST(req: NextRequest) {
  try {
    if (!PI_API_KEY) {
      return NextResponse.json(
        { error: "PI_API_KEY not set in environment variables" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { action, paymentId, txid } = body;

    if (!action || !paymentId) {
      return NextResponse.json(
        { error: "Missing action or paymentId" },
        { status: 400 }
      );
    }

    let url = "";
    let payload: any = undefined;

    if (action === "approve") {
      url = `${PI_API_URL}/${paymentId}/approve`;
    }

    else if (action === "complete") {
      if (!txid) {
        return NextResponse.json(
          { error: "Missing txid for complete action" },
          { status: 400 }
        );
      }

      url = `${PI_API_URL}/${paymentId}/complete`;
      payload = { txid };
    }

    else if (action === "cancel") {
      url = `${PI_API_URL}/${paymentId}/cancel`;
    }

    else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Key ${PI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: payload ? JSON.stringify(payload) : undefined
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });

  } catch (error: any) {
    console.error("PI MAINNET ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
