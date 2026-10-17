import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Canonical normalizer: "IMP - 004" -> "imp004", "IMP-001" -> "imp001"
function normalizeCode(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * GET /api/sync-stock
 * Pulls the live inventory feed from Krish Clothing Admin Backend (krish-clothing.vercel.app)
 * and synchronizes the total pieces (Sets * PcsPerSet + MixPcs) into the Storefront PostgreSQL database.
 */
export async function GET(request: NextRequest) {
  try {
    const backendUrl =
      process.env.GARMENT_BACKEND_URL || "https://employee-order.vercel.app";
    const res = await fetch(`${backendUrl}/api/ecommerce?action=inventory&in_stock_only=0`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch inventory from backend: ${res.statusText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const inventory = data.inventory;
    if (!Array.isArray(inventory)) {
      return NextResponse.json(
        { error: "Invalid inventory payload from backend" },
        { status: 500 }
      );
    }

    const allDbProducts = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, stock: true },
    });

    const updates: Array<{ name: string; oldStock: number; newStock: number }> = [];

    for (const item of inventory) {
      const canonicalBackend = normalizeCode(item.name || item.sku || "");
      if (!canonicalBackend) continue;

      const matched = allDbProducts.find((p) => {
        const canonicalName = normalizeCode(p.name);
        const canonicalSlug = normalizeCode(p.slug);
        return canonicalName === canonicalBackend || canonicalSlug === canonicalBackend;
      });

      if (matched) {
        const newStock = Math.max(0, Number(item.totalPcs) || 0);
        if (matched.stock !== newStock) {
          await prisma.product.update({
            where: { id: matched.id },
            data: { stock: newStock },
          });
          updates.push({
            name: matched.name,
            oldStock: matched.stock,
            newStock,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Stock synchronized successfully with Krish Clothing Admin Stock Tab.",
      timestamp: new Date().toISOString(),
      syncedStylesCount: inventory.length,
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
    const body = await request.json();
    const { styleCode, totalPcs, items } = body;

    const allDb = await prisma.product.findMany({
      select: { id: true, name: true, slug: true, stock: true },
    });

    const updates: Array<{ name: string; oldStock: number; newStock: number }> = [];

    if (Array.isArray(items)) {
      for (const it of items) {
        const code = normalizeCode(it.styleCode || it.name || "");
        const pcs = Math.max(0, Number(it.totalPcs) || 0);
        const m = allDb.find(
          (p) => normalizeCode(p.name) === code || normalizeCode(p.slug) === code
        );
        if (m) {
          await prisma.product.update({
            where: { id: m.id },
            data: { stock: pcs },
          });
          updates.push({ name: m.name, oldStock: m.stock, newStock: pcs });
        }
      }
    } else if (styleCode) {
      const code = normalizeCode(styleCode);
      const pcs = Math.max(0, Number(totalPcs) || 0);
      const m = allDb.find(
        (p) => normalizeCode(p.name) === code || normalizeCode(p.slug) === code
      );
      if (m) {
        await prisma.product.update({
          where: { id: m.id },
          data: { stock: pcs },
        });
        updates.push({ name: m.name, oldStock: m.stock, newStock: pcs });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Real-time webhook processed: ${updates.length} products updated.`,
      updates,
    });
  } catch (error: any) {
    console.error("Webhook sync error:", error);
    return NextResponse.json(
      { error: "Webhook sync error: " + error.message },
      { status: 500 }
    );
  }
}
