import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

function normalizeCode(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseSetsColorwise(setsColorwiseRaw: string | null | undefined): Record<string, any> {
  if (!setsColorwiseRaw) return {};
  try {
    const parsed = typeof setsColorwiseRaw === "string" ? JSON.parse(setsColorwiseRaw) : setsColorwiseRaw;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getAvailableSetsForColor(setsColorwiseRaw: string | null | undefined, colorName: string): number {
  const sets = parseSetsColorwise(setsColorwiseRaw);
  const target = colorName.trim().toLowerCase();
  const matchedKey = Object.keys(sets).find((k) => k.trim().toLowerCase() === target);
  if (!matchedKey) return 0;

  const val = sets[matchedKey];
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
  return 0;
}

/**
 * GET /api/products/[id]/unset?color=...
 * Inspects whether the product and color variant qualifies for 1 Wholesale Set Unset.
 * Rule:
 * 1. Checks available sizes count for the color variant.
 * 2. If <= 3 sizes are available AND 1 set has not already been unset AND wholesale has >= 1 set:
 *    canUnset = true.
 * 3. If 1 set was already unset: canUnset = false (Strict limit: exactly 1 set unset allowed).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const colorParam = searchParams.get("color")?.trim();

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Parse configured sizes
    let sizesList: string[] = ["30", "32", "34", "36", "38"];
    try {
      if (product.sizes) {
        const parsed = JSON.parse(product.sizes);
        if (Array.isArray(parsed) && parsed.length > 0) sizesList = parsed;
      }
    } catch {}

    // Parse inventory map
    let inventoryMap: Record<string, Record<string, number>> = {};
    let unsetCounts: Record<string, number> = {};
    try {
      if (product.inventory) {
        const parsed = JSON.parse(product.inventory);
        if (parsed && typeof parsed === "object") {
          inventoryMap = parsed;
          if (parsed._unsetCounts && typeof parsed._unsetCounts === "object") {
            unsetCounts = parsed._unsetCounts;
          }
        }
      }
    } catch {}

    // Determine target color (either requested color or first color)
    let colorsList: string[] = [];
    try {
      if (product.colors) {
        const parsed = JSON.parse(product.colors);
        if (Array.isArray(parsed)) colorsList = parsed;
      }
    } catch {}
    const activeColor = colorParam || colorsList[0] || "Default";

    // Match color in inventory
    const matchedColorKey = Object.keys(inventoryMap).find(
      (k) => k.trim().toLowerCase() === activeColor.trim().toLowerCase()
    ) || activeColor;

    const colorStock = inventoryMap[matchedColorKey] || {};
    const availableSizes = sizesList.filter((sz) => (Number(colorStock[sz]) || 0) > 0);
    const availableSizesCount = availableSizes.length;
    const totalSizesCount = sizesList.length;
    const isAllSizesAvailable = availableSizesCount >= totalSizesCount;

    // Check wholesale stock
    const canonicalName = normalizeCode(product.name);
    const wholesaleProds: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, name, "setsColorwise" FROM wholesale."Product"
    `);
    const matchedWholesale = wholesaleProds.find(
      (wp) => normalizeCode(wp.name) === canonicalName
    );

    const wholesaleSetsAvailable = matchedWholesale
      ? getAvailableSetsForColor(matchedWholesale.setsColorwise, activeColor)
      : 0;

    const alreadyUnset = (unsetCounts[matchedColorKey] || 0) >= 1;
    const canUnset = availableSizesCount <= 3 && !alreadyUnset && wholesaleSetsAvailable > 0;

    let statusMessage = "";
    if (alreadyUnset) {
      statusMessage = "1 Set has already been unset for this color. No further unsets can be made available.";
    } else if (availableSizesCount > 3) {
      statusMessage = `${availableSizesCount} sizes currently available. Unset is only permitted when 3 or fewer sizes remain.`;
    } else if (wholesaleSetsAvailable <= 0) {
      statusMessage = "No wholesale sets currently available in stock to unset.";
    } else {
      statusMessage = `Only ${availableSizesCount} sizes remaining! 1 Wholesale Set is eligible to be unset into individual pieces across all sizes.`;
    }

    return NextResponse.json({
      productId: product.id,
      color: activeColor,
      totalSizesCount,
      availableSizesCount,
      availableSizes,
      isAllSizesAvailable,
      alreadyUnset,
      canUnset,
      wholesaleSetsAvailable,
      statusMessage,
    });
  } catch (error: any) {
    console.error("Error inspecting unset status:", error);
    return NextResponse.json(
      { error: "Failed to check unset status: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/products/[id]/unset
 * Body: { color: string }
 * Performs the 1-set unset conversion:
 * Deducts 1 set from wholesale sets, adds +1 piece to every size for this color in public.Product,
 * and sets _unsetCounts[color] = 1 (preventing any subsequent unsets).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const colorParam = (body.color || "").trim();

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Parse configured sizes
    let sizesList: string[] = ["30", "32", "34", "36", "38"];
    try {
      if (product.sizes) {
        const parsed = JSON.parse(product.sizes);
        if (Array.isArray(parsed) && parsed.length > 0) sizesList = parsed;
      }
    } catch {}

    // Parse inventory map and _unsetCounts
    let inventoryMap: Record<string, Record<string, number>> = {};
    let unsetCounts: Record<string, number> = {};
    try {
      if (product.inventory) {
        const parsed = JSON.parse(product.inventory);
        if (parsed && typeof parsed === "object") {
          inventoryMap = parsed;
          if (parsed._unsetCounts && typeof parsed._unsetCounts === "object") {
            unsetCounts = parsed._unsetCounts;
          }
        }
      }
    } catch {}

    // Determine target color
    let colorsList: string[] = [];
    try {
      if (product.colors) {
        const parsed = JSON.parse(product.colors);
        if (Array.isArray(parsed)) colorsList = parsed;
      }
    } catch {}
    const activeColor = colorParam || colorsList[0] || "Default";

    const matchedColorKey = Object.keys(inventoryMap).find(
      (k) => k.trim().toLowerCase() === activeColor.trim().toLowerCase()
    ) || activeColor;

    // 1. Check if already unset
    if ((unsetCounts[matchedColorKey] || 0) >= 1) {
      return NextResponse.json(
        { error: "1 set has already been unset for this color. After that no unset can be made available." },
        { status: 400 }
      );
    }

    // 2. Count distinct sizes with qty > 0
    const colorStock = inventoryMap[matchedColorKey] || {};
    const availableSizes = sizesList.filter((sz) => (Number(colorStock[sz]) || 0) > 0);
    if (availableSizes.length > 3) {
      return NextResponse.json(
        {
          error: `Unset is only permitted when 3 or fewer different sizes are available (Currently ${availableSizes.length} sizes in stock).`,
        },
        { status: 400 }
      );
    }

    // 3. Find wholesale product and deduct 1 set
    const canonicalName = normalizeCode(product.name);
    const wholesaleProds: any[] = await prisma.$queryRawUnsafe(`
      SELECT id, name, "setsColorwise" FROM wholesale."Product"
    `);
    const matchedWholesale = wholesaleProds.find(
      (wp) => normalizeCode(wp.name) === canonicalName
    );

    if (!matchedWholesale) {
      return NextResponse.json(
        { error: "Wholesale product record not found for stock deduction." },
        { status: 404 }
      );
    }

    const currentSets = getAvailableSetsForColor(matchedWholesale.setsColorwise, activeColor);
    if (currentSets <= 0) {
      return NextResponse.json(
        { error: `No wholesale sets available in stock for color "${activeColor}".` },
        { status: 400 }
      );
    }

    // Deduct 1 set from wholesale setsColorwise
    const wholesaleSetsObj = parseSetsColorwise(matchedWholesale.setsColorwise);
    const wsTargetKey = Object.keys(wholesaleSetsObj).find(
      (k) => k.trim().toLowerCase() === activeColor.trim().toLowerCase()
    );

    if (wsTargetKey) {
      const val = wholesaleSetsObj[wsTargetKey];
      if (typeof val === "number") {
        wholesaleSetsObj[wsTargetKey] = Math.max(0, val - 1);
      } else if (val && typeof val === "object" && val.ratios) {
        // Deduct from first ratio entry with stock
        for (const [rKey, rVal] of Object.entries(val.ratios)) {
          if (Number(rVal) > 0) {
            val.ratios[rKey] = Math.max(0, Number(rVal) - 1);
            break;
          }
        }
      }

      await prisma.$executeRawUnsafe(
        `UPDATE wholesale."Product" SET "setsColorwise" = $1, "updatedAt" = NOW() WHERE id = $2`,
        JSON.stringify(wholesaleSetsObj),
        matchedWholesale.id
      );
    }

    // 4. In public.Product: replenish +1 piece to every size for this color
    if (!inventoryMap[matchedColorKey]) {
      inventoryMap[matchedColorKey] = {};
    }
    for (const sz of sizesList) {
      inventoryMap[matchedColorKey][sz] = (Number(inventoryMap[matchedColorKey][sz]) || 0) + 1;
    }

    // Record that 1 set has been unset for this color
    unsetCounts[matchedColorKey] = 1;
    (inventoryMap as any)._unsetCounts = unsetCounts;

    // Recalculate total product stock across all colors and sizes
    let totalStock = 0;
    for (const [col, sizesObj] of Object.entries(inventoryMap)) {
      if (col.startsWith("_")) continue;
      if (sizesObj && typeof sizesObj === "object") {
        for (const qty of Object.values(sizesObj)) {
          totalStock += Math.max(0, Number(qty) || 0);
        }
      }
    }

    // Update public.Product
    const updated = await prisma.product.update({
      where: { id: product.id },
      data: {
        inventory: JSON.stringify(inventoryMap),
        stock: totalStock,
        active: totalStock > 0 ? true : product.active,
      },
    });

    try {
      revalidatePath(`/products/${product.id}`);
      revalidatePath(`/products/${product.slug}`);
      revalidatePath("/products");
      revalidatePath("/");
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Successfully unset 1 wholesale set for "${activeColor}". +1 piece added to every size. No further unsets permitted.`,
      color: activeColor,
      inventory: inventoryMap,
      stock: totalStock,
      alreadyUnset: true,
      canUnset: false,
    });
  } catch (error: any) {
    console.error("Error executing unset:", error);
    return NextResponse.json(
      { error: "Failed to unset set: " + error.message },
      { status: 500 }
    );
  }
}
