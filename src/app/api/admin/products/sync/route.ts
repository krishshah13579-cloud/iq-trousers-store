import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { performDirectStockSync } from "@/lib/stockSync";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/products/sync
 * Admin endpoint for on-demand synchronization and merging between Wholesale Stock
 * (wholesale.Product) and Storefront Products (public.Product).
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updates = await performDirectStockSync();

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized and merged ${updates.length} products with wholesale stock.`,
      updatedCount: updates.length,
      updates,
    });
  } catch (error: any) {
    console.error("Stock synchronization error:", error);
    return NextResponse.json(
      { error: "Failed to synchronize with stock: " + error.message },
      { status: 500 }
    );
  }
}
