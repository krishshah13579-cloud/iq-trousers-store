import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

function normalizeCode(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getSetsForColor(setsColorwiseRaw: string | null | undefined, colorName: string): number {
  if (!setsColorwiseRaw) return 0;
  try {
    const parsed = typeof setsColorwiseRaw === "string" ? JSON.parse(setsColorwiseRaw) : setsColorwiseRaw;
    if (!parsed || typeof parsed !== "object") return 0;

    const target = colorName.trim().toLowerCase();
    const matchedKey = Object.keys(parsed).find((k) => k.trim().toLowerCase() === target);
    if (!matchedKey) return 0;

    const val = parsed[matchedKey];
    if (typeof val === "number") return Math.max(0, val);
    if (val && typeof val === "object") {
      let total = 0;
      if (val.ratios && typeof val.ratios === "object") {
        Object.values(val.ratios).forEach((cnt: any) => {
          total += Math.max(0, Number(cnt) || 0);
        });
      }
      return total;
    }
  } catch {}
  return 0;
}

/**
 * Synchronize all products from wholesale."Product" to public."Product"
 */
async function performDirectStockSync() {
  const wholesaleProducts: any[] = await prisma.$queryRawUnsafe(`
    SELECT 
      id, 
      name, 
      category, 
      "colorsAvailable", 
      "colorMapping", 
      "sizesRatio", 
      "sizesList", 
      "pcsPerSet", 
      price, 
      mrp, 
      "setsColorwise", 
      "mixPcs", 
      "colorImages", 
      "imageUrl",
      "isActive"
    FROM wholesale."Product"
  `);

  if (!Array.isArray(wholesaleProducts) || wholesaleProducts.length === 0) {
    throw new Error("No wholesale products found in database.");
  }

  const storeProducts = await prisma.product.findMany();

  const updates: Array<{
    name: string;
    oldStock: number;
    newStock: number;
    colors: string[];
  }> = [];

  for (const wp of wholesaleProducts) {
    const canonicalWp = normalizeCode(wp.name);
    if (!canonicalWp) continue;

    const matched = storeProducts.find((sp) => {
      return (
        normalizeCode(sp.name) === canonicalWp ||
        normalizeCode(sp.slug) === canonicalWp
      );
    });

    if (!matched) continue;

    const colorsList = (wp.colorsAvailable || "")
      .split(",")
      .map((c: string) => c.trim())
      .filter(Boolean);

    let sizesList = (wp.sizesList || "30, 32, 34, 36, 38")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    if (sizesList.length === 0) {
      sizesList = ["30", "32", "34", "36", "38"];
    }

    let currentInventory: Record<string, Record<string, number>> = {};
    try {
      if (matched.inventory) {
        currentInventory = JSON.parse(matched.inventory);
      }
    } catch {}

    const inventoryMap: Record<string, Record<string, number>> = {};
    let totalPieces = 0;

    for (const color of colorsList) {
      const availableSets = getSetsForColor(wp.setsColorwise, color);
      const colorBreakdown: Record<string, number> = {};

      if (availableSets <= 0) {
        for (const sz of sizesList) {
          colorBreakdown[sz] = 0;
        }
      } else {
        const existingCol = currentInventory[color] || {};
        const hasExistingStock = Object.values(existingCol).some((q) => Number(q) > 0);

        if (hasExistingStock) {
          for (const sz of sizesList) {
            const qty = Number(existingCol[sz]) || 0;
            colorBreakdown[sz] = Math.min(1, Math.max(0, qty));
            totalPieces += colorBreakdown[sz];
          }
        } else {
          for (const sz of sizesList) {
            colorBreakdown[sz] = 1;
            totalPieces += 1;
          }
        }
      }

      inventoryMap[color] = colorBreakdown;
    }

    await prisma.product.update({
      where: { id: matched.id },
      data: {
        name: wp.name,
        colors: JSON.stringify(colorsList),
        sizes: JSON.stringify(sizesList),
        inventory: JSON.stringify(inventoryMap),
        stock: totalPieces,
        active: totalPieces > 0 ? true : matched.active,
        ...(wp.mrp && wp.mrp > 0 ? { comparePrice: wp.mrp } : {}),
      },
    });

    updates.push({
      name: wp.name,
      oldStock: matched.stock,
      newStock: totalPieces,
      colors: colorsList,
    });

    try {
      revalidatePath(`/products/${matched.id}`);
      revalidatePath(`/products/${matched.slug}`);
    } catch {}
  }

  try {
    revalidatePath("/");
    revalidatePath("/products");
  } catch {}

  return updates;
}

export async function GET(request: NextRequest) {
  try {
    const updates = await performDirectStockSync();
    return NextResponse.json({
      success: true,
      message: `Stock, colors, and variant inventory successfully synchronized directly from database.`,
      timestamp: new Date().toISOString(),
      updatedProductsCount: updates.length,
      updates,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Direct sync failed, trying fallback:", error);
    return NextResponse.json(
      { error: "Direct sync error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await performDirectStockSync();
    return NextResponse.json({
      success: true,
      message: `Real-time sync complete: ${updates.length} products updated from wholesale stock.`,
      updates,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error("Webhook sync error:", error);
    return NextResponse.json(
      { error: "Webhook sync error: " + error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
