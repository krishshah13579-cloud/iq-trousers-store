import { NextRequest, NextResponse } from "next/server";
import { calculateShippingFee } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subtotal = 0, state = "", zipCode = "" } = body;
    const quote = calculateShippingFee(Number(subtotal), state, zipCode);
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("Shipping calculate API error:", error);
    return NextResponse.json({ success: false, error: "Failed to calculate shipping" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subtotal = Number(searchParams.get("subtotal") || 0);
    const state = searchParams.get("state") || "";
    const zipCode = searchParams.get("zipCode") || "";
    const quote = calculateShippingFee(subtotal, state, zipCode);
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    console.error("Shipping calculate API error:", error);
    return NextResponse.json({ success: false, error: "Failed to calculate shipping" }, { status: 500 });
  }
}
