import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    disabled: true,
    message: "Payments are not supported by this application",
  });
}
