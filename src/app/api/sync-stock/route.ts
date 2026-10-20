import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Canonical normalizer: "IMP - 004" -> "imp004", "IMP-001" -> "imp001"
function normalizeCode(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * GET /api/sync-stock
 * Pulls the live products feed from Krish Clothing Admin Backend (employee-order.vercel.app)
 * and synchronizes total pieces, in-stock colors, variant size inventory, and active status.
 */
export async function GET(request: NextRequest) {
  try {
    const backendUrl =
      process.env.GARMENT_BACKEND_URL || "https://employee-order.vercel.app";

    const res = await fetch(`${backendUrl}/api/ecommerce?action=products&in_stock_only=0`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch products from backend: ${res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const products = data.products;
    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid products payload from backend" },
        { status: 500 }
      );
    }

    const allDbProducts = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, stock: true, colors: true, inventory: true, sizes: true, active: true },
    });

    const updates: Array<{
      name: string;
      oldStock: number;
      newStock: number;
      inStockColors: string[];
      totalColors: number;
    }> = [];

    for (const item of products) {
      const canonicalBackend = normalizeCode(item.name || item.sku || "");
      if (!canonicalBackend) continue;

      const matched = allDbProducts.find((p) => {
        const canonicalName = normalizeCode(p.name);
        const canonicalSlug = normalizeCode(p.slug);
        return canonicalName === canonicalBackend || canonicalSlug === canonicalBackend;
      });

      if (matched) {
        const newStock = Math.max(0, Number(item.totalPcs) || 0);

        // Filter ONLY colors that have available stock (> 0 pcs)
        const inStockColorObjs = (item.colors || []).filter(
          (c: any) => (Number(c.pcsInStock) > 0 || c.inStock === true)
        );
        const inStockColorNames = inStockColorObjs.map((c: any) => c.color);

        // Build exact variant size inventory map for all colors
        const inventoryMap: Record<string, Record<string, number>> = {};
        const availableSizesSet = new Set<string>();

        for (const c of item.colors || []) {
          const breakdown = c.sizesBreakdown || {};
          inventoryMap[c.color] = breakdown;
          if (c.pcsInStock > 0 || c.inStock) {
            Object.keys(breakdown).forEach((sz) => {
              if (Number(breakdown[sz]) > 0) {
                availableSizesSet.add(sz);
              }
            });
          }
        }

        // If backend sizes list exists, merge
        if (availableSizesSet.size === 0 && item.sizesList) {
          item.sizesList.split(",").forEach((s: string) => {
            if (s.trim()) availableSizesSet.add(s.trim());
          });
        }

        const sortedSizes = Array.from(availableSizesSet).sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
          return a.localeCompare(b);
        });

        // Update product in DB with synchronized stock, in-stock colors, and size inventory
        await prisma.product.update({
          where: { id: matched.id },
          data: {
            stock: newStock,
            active: newStock > 0,
            colors: JSON.stringify(inStockColorNames.length > 0 ? inStockColorNames : []),
            inventory: JSON.stringify(inventoryMap),
            sizes: JSON.stringify(sortedSizes.length > 0 ? sortedSizes : ["30", "32", "34", "36", "38"]),
          },
        });

        updates.push({
          name: matched.name,
          oldStock: matched.stock,
          newStock,
          inStockColors: inStockColorNames,
          totalColors: (item.colors || []).length,
        });

        try {
          revalidatePath(`/products/${matched.id}`);
          revalidatePath(`/products/${matched.slug}`);
        } catch {}
      }
    }

    try {
      revalidatePath("/");
      revalidatePath("/products");
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Stock, in-stock colors, and variant inventory synchronized successfully with Krish Clothing Admin Stock Tab.",
      timestamp: new Date().toISOString(),
      syncedStylesCount: products.length,
      updatedProductsCount: updates.length,
      updates,
    });
  } catch (error: any) {
    console.error("Error syncing stock:", error);
    return NextResponse.json(
      { error: "Internal server error during stock sync: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync-stock
 * Real-time webhook receiver triggered instantly whenever admin saves stock in the Stock Tab.
 */
export async function POST(request: NextRequest) {
  try {
    const backendUrl =
      process.env.GARMENT_BACKEND_URL || "https://employee-order.vercel.app";

    // When webhook is triggered, pull fresh data to ensure full consistency
    const res = await fetch(`${backendUrl}/api/ecommerce?action=products&in_stock_only=0`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        const allDb = await prisma.product.findMany({
          select: { id: true, name: true, slug: true, stock: true },
        });

        const updates: Array<{ name: string; oldStock: number; newStock: number }> = [];

        for (const item of data.products) {
          const code = normalizeCode(item.name || item.sku || "");
          const m = allDb.find(
            (p) => normalizeCode(p.name) === code || normalizeCode(p.slug) === code
          );
          if (m) {
            const newStock = Math.max(0, Number(item.totalPcs) || 0);
            const inStockColorNames = (item.colors || [])
              .filter((c: any) => Number(c.pcsInStock) > 0 || c.inStock === true)
              .map((c: any) => c.color);

            const inventoryMap: Record<string, Record<string, number>> = {};
            for (const c of item.colors || []) {
              inventoryMap[c.color] = c.sizesBreakdown || {};
            }

            await prisma.product.update({
              where: { id: m.id },
              data: {
                stock: newStock,
                active: newStock > 0,
                colors: JSON.stringify(inStockColorNames.length > 0 ? inStockColorNames : []),
                inventory: JSON.stringify(inventoryMap),
              },
            });

            updates.push({ name: m.name, oldStock: m.stock, newStock });

            try {
              revalidatePath(`/products/${m.id}`);
              revalidatePath(`/products/${m.slug}`);
            } catch {}
          }
        }

        try {
          revalidatePath("/");
          revalidatePath("/products");
        } catch {}

        return NextResponse.json({
          success: true,
          message: `Real-time webhook processed: ${updates.length} products updated.`,
          updates,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook acknowledged",
    });
  } catch (error: any) {
    console.error("Webhook sync error:", error);
    return NextResponse.json(
      { error: "Webhook sync error: " + error.message },
      { status: 500 }
    );
  }
}
