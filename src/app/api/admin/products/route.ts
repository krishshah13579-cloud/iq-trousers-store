import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
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
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    if (!name || !description || price === undefined || !categoryId) {
      return NextResponse.json(
        { error: "Name, description, price, and category are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Normalize images: if array stringify, if comma-separated string convert to json array
    let imagesJson: string;
    if (Array.isArray(images)) {
      imagesJson = JSON.stringify(images);
    } else if (typeof images === "string") {
      const parsed = images
        .split(",")
        .map((img: string) => img.trim())
        .filter(Boolean);
      imagesJson = JSON.stringify(parsed);
    } else {
      imagesJson = JSON.stringify([]);
    }

    let sizesJson = JSON.stringify(["28", "30", "32", "34", "36", "38", "40", "42", "44"]);
    if (sizes) {
      if (Array.isArray(sizes)) {
        sizesJson = JSON.stringify(sizes);
      } else if (typeof sizes === "string") {
        sizesJson = sizes;
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        category: { connect: { id: categoryId } },
        stock: parseInt(stock ?? 0, 10),
        images: imagesJson,
        sizes: sizesJson,
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
