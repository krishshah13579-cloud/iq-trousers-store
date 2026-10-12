import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      description,
      price,
      comparePrice,
      categoryId,
      stock,
      images,
      sizes,
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
      let baseSlug = slugify(name);
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
        const parsed = images
          .split(",")
          .map((img: string) => img.trim())
          .filter(Boolean);
        imagesJson = JSON.stringify(parsed);
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        comparePrice:
          comparePrice !== undefined
            ? comparePrice
              ? parseFloat(comparePrice)
              : null
            : existingProduct.comparePrice,
        ...(categoryId !== undefined && {
          category: { connect: { id: categoryId } },
        }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        images: imagesJson,
        ...(sizes !== undefined && {
          sizes: Array.isArray(sizes) ? JSON.stringify(sizes) : String(sizes),
        }),
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
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
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
