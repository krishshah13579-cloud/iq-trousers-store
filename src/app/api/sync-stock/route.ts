import { NextRequest, NextResponse } from "next/server";
import { performDirectStockSync } from "@/lib/stockSync";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-sync-secret, Accept, User-Agent",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const updates = await performDirectStockSync();
    return NextResponse.json(
      {
        success: true,
        message: `Stock, colors, and variant inventory successfully synchronized and merged directly from database.`,
        timestamp: new Date().toISOString(),
        updatedProductsCount: updates.length,
        updates,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Direct sync failed:", error);
    return NextResponse.json(
      { error: "Direct sync error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await performDirectStockSync();
    return NextResponse.json(
      {
        success: true,
        message: `Real-time sync complete: ${updates.length} products updated and merged from wholesale stock.`,
        updates,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Webhook sync error:", error);
    return NextResponse.json(
      { error: "Webhook sync error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
