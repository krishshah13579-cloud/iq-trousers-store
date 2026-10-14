import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      description,
      careInstructions,
      price,
      comparePrice,
      categoryId,
      stock,
      images,
      sizes,
      colors,
      featured,
      active,
    } = body;

    if (!name || !description || price === undefined || !categoryId) {
      return NextResponse.json(
        { error: "Name, description, price, and category are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(name) || `trouser-${Date.now()}`;
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const parsedPrice = parseFloat(String(price).replace(/[^0-9.]/g, ""));
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json(
        { error: "A valid positive price is required" },
        { status: 400 }
      );
    }
    const parsedComparePrice = comparePrice
      ? parseFloat(String(comparePrice).replace(/[^0-9.]/g, "")) || null
      : null;

    // Normalize images
    let imagesJson: string;
    if (Array.isArray(images)) {
      imagesJson = JSON.stringify(images);
    } else if (typeof images === "string") {
      try {
        const parsed = JSON.parse(images);
        imagesJson = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([images]);
      } catch {
        const parsed = images
          .split(",")
          .map((img: string) => img.trim())
          .filter(Boolean);
        imagesJson = JSON.stringify(parsed);
      }
    } else {
      imagesJson = JSON.stringify([]);
    }

    let sizesJson = JSON.stringify(["28", "30", "32", "34", "36", "38", "40", "42", "44"]);
    if (sizes) {
      if (Array.isArray(sizes)) {
        sizesJson = JSON.stringify(sizes);
      } else if (typeof sizes === "string") {
        try {
          const parsed = JSON.parse(sizes);
          sizesJson = Array.isArray(parsed) ? JSON.stringify(parsed) : sizes;
        } catch {
          sizesJson = sizes;
        }
      }
    }

    let colorsJson = JSON.stringify([]);
    if (colors) {
      if (Array.isArray(colors)) {
        colorsJson = JSON.stringify(colors);
      } else if (typeof colors === "string") {
        try {
          const parsed = JSON.parse(colors);
          colorsJson = Array.isArray(parsed) ? JSON.stringify(parsed) : JSON.stringify([colors]);
        } catch {
          colorsJson = JSON.stringify(
            colors
              .split(",")
              .map((c: string) => c.trim())
              .filter(Boolean)
          );
        }
      }
    }

    // Process inventory availability by size and color
    let inventoryJson = "{}";
    let computedStock = stock !== undefined ? parseInt(stock, 10) : 0;
    const rawInventory = body.inventory;

    if (rawInventory) {
      if (typeof rawInventory === "object" && rawInventory !== null) {
        inventoryJson = JSON.stringify(rawInventory);
        let sum = 0;
        let hasVariants = false;
        Object.values(rawInventory).forEach((row: any) => {
          if (typeof row === "object" && row !== null) {
            Object.values(row).forEach((val: any) => {
              hasVariants = true;
              sum += Math.max(0, parseInt(String(val || 0), 10) || 0);
            });
          } else if (typeof row === "number" || typeof row === "string") {
            hasVariants = true;
            sum += Math.max(0, parseInt(String(row || 0), 10) || 0);
          }
        });
        if (hasVariants) {
          computedStock = sum;
        }
      } else if (typeof rawInventory === "string") {
        try {
          const parsed = JSON.parse(rawInventory);
          inventoryJson = JSON.stringify(parsed);
          let sum = 0;
          let hasVariants = false;
          Object.values(parsed).forEach((row: any) => {
            if (typeof row === "object" && row !== null) {
              Object.values(row).forEach((val: any) => {
                hasVariants = true;
                sum += Math.max(0, parseInt(String(val || 0), 10) || 0);
              });
            } else if (typeof row === "number" || typeof row === "string") {
              hasVariants = true;
              sum += Math.max(0, parseInt(String(row || 0), 10) || 0);
            }
          });
          if (hasVariants) {
            computedStock = sum;
          }
        } catch {
          inventoryJson = "{}";
        }
      }
    }

    // Process size guide
    let sizeGuideJson = "[]";
    const rawSizeGuide = body.sizeGuide;
    if (rawSizeGuide) {
      if (Array.isArray(rawSizeGuide)) {
        sizeGuideJson = JSON.stringify(rawSizeGuide);
      } else if (typeof rawSizeGuide === "string") {
        try {
          const parsed = JSON.parse(rawSizeGuide);
          sizeGuideJson = Array.isArray(parsed) ? JSON.stringify(parsed) : "[]";
        } catch {
          sizeGuideJson = "[]";
        }
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        careInstructions: careInstructions ? String(careInstructions).trim() : "",
        price: parsedPrice,
        comparePrice: parsedComparePrice,
        category: { connect: { id: categoryId } },
        stock: computedStock,
        images: imagesJson,
        sizes: sizesJson,
        colors: colorsJson,
        inventory: inventoryJson,
        sizeGuide: sizeGuideJson,
        featured: Boolean(featured),
        active: active !== undefined ? Boolean(active) : true,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
