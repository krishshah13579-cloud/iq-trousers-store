import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function normalizeCode(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

interface WholesaleRow {
  id: number;
  name: string;
  category: string;
  colorsAvailable: string;
  colorMapping?: string | null;
  sizesRatio?: string | null;
  sizesList?: string | null;
  pcsPerSet?: number | null;
  price?: number | null;
  mrp?: number | null;
  setsColorwise?: string | null;
  mixPcs?: number | null;
  colorImages?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

/**
 * Calculates total available sets for a specific color from setsColorwise JSON.
 */
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
 * POST /api/admin/products/sync
 * Direct database synchronization between Wholesale Stock (wholesale.Product)
 * and Storefront Products (public.Product).
 * Matches all colors, sizes, inventory maps, product names, and pricing.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch live wholesale catalog directly from PostgreSQL wholesale schema
    const wholesaleProducts: WholesaleRow[] = await prisma.$queryRawUnsafe(`
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
      return NextResponse.json(
        { error: "No products found in wholesale stock schema." },
        { status: 404 }
      );
    }

    // 2. Fetch existing storefront products from public schema
    const storeProducts = await prisma.product.findMany();

    const updates: Array<{
      name: string;
      oldStock: number;
      newStock: number;
      colorsCount: number;
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

      // Extract raw colors list from colorsAvailable
      const colorsList = (wp.colorsAvailable || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      // Extract sizes list from sizesList or default to standard trouser sizes
      let sizesList = (wp.sizesList || "30, 32, 34, 36, 38")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (sizesList.length === 0) {
        sizesList = ["30", "32", "34", "36", "38"];
      }

      // Read current store inventory to preserve existing broken set states if any
      let currentInventory: Record<string, Record<string, number>> = {};
      try {
        if (matched.inventory) {
          currentInventory = JSON.parse(matched.inventory);
        }
      } catch {}

      // Build new variant inventory map
      const inventoryMap: Record<string, Record<string, number>> = {};
      let totalPieces = 0;

      for (const color of colorsList) {
        const availableSets = getSetsForColor(wp.setsColorwise, color);
        const colorBreakdown: Record<string, number> = {};

        if (availableSets <= 0) {
          // Color has 0 sets in stock
          for (const sz of sizesList) {
            colorBreakdown[sz] = 0;
          }
        } else {
          // Wholesale has sets available (> 0)
          // Check if an existing broken set was already partially sold
          const existingCol = currentInventory[color] || {};
          const hasExistingStock = Object.values(existingCol).some((q) => Number(q) > 0);

          if (hasExistingStock) {
            for (const sz of sizesList) {
              const qty = Number(existingCol[sz]) || 0;
              colorBreakdown[sz] = Math.min(1, Math.max(0, qty));
              totalPieces += colorBreakdown[sz];
            }
          } else {
            // Unlock 1 Set: 1 pc of each size
            for (const sz of sizesList) {
              colorBreakdown[sz] = 1;
              totalPieces += 1;
            }
          }
        }

        inventoryMap[color] = colorBreakdown;
      }

      // Update product in database
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
        colorsCount: colorsList.length,
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

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${updates.length} products with wholesale stock.`,
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
