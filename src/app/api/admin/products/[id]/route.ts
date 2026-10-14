import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
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

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update slug if name changed
    let slug = existingProduct.slug;
    if (name && name !== existingProduct.name) {
      let baseSlug = slugify(name) || `trouser-${Date.now()}`;
      slug = baseSlug;
      let counter = 1;
      while (true) {
        const check = await prisma.product.findUnique({ where: { slug } });
        if (!check || check.id === id) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    let imagesJson = existingProduct.images;
    if (images !== undefined) {
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
      }
    }

    let colorsJson = existingProduct.colors;
    if (colors !== undefined) {
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
    let inventoryJson = existingProduct.inventory;
    let computedStock = stock !== undefined ? parseInt(stock, 10) : undefined;
    const rawInventory = body.inventory;

    if (rawInventory !== undefined) {
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
    let sizeGuideJson = existingProduct.sizeGuide || "[]";
    if (body.sizeGuide !== undefined) {
      if (Array.isArray(body.sizeGuide)) {
        sizeGuideJson = JSON.stringify(body.sizeGuide);
      } else if (typeof body.sizeGuide === "string") {
        try {
          const parsed = JSON.parse(body.sizeGuide);
          sizeGuideJson = Array.isArray(parsed) ? JSON.stringify(parsed) : "[]";
        } catch {
          sizeGuideJson = "[]";
        }
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(careInstructions !== undefined && { careInstructions: String(careInstructions).trim() }),
        ...(price !== undefined && {
          price: parseFloat(String(price).replace(/[^0-9.]/g, "")) || 0,
        }),
        comparePrice:
          comparePrice !== undefined
            ? comparePrice
              ? parseFloat(String(comparePrice).replace(/[^0-9.]/g, "")) || null
              : null
            : existingProduct.comparePrice,
        ...(categoryId !== undefined && {
          category: { connect: { id: categoryId } },
        }),
        ...(computedStock !== undefined && { stock: computedStock }),
        images: imagesJson,
        ...(sizes !== undefined && {
          sizes: Array.isArray(sizes) ? JSON.stringify(sizes) : String(sizes),
        }),
        colors: colorsJson,
        ...(inventoryJson !== undefined && { inventory: inventoryJson }),
        ...(body.sizeGuide !== undefined && { sizeGuide: sizeGuideJson }),
        ...(featured !== undefined && { featured: Boolean(featured) }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole((session.user as { role?: string })?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
