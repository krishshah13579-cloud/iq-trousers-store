import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp, checkRateLimit, createRateLimitResponse } from "@/lib/rateLimit";

export async function GET(request: NextRequest) {
  // Rate Limiting: Max 60 product searches / listing requests per minute per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`products:${ip}`, { limit: 60, windowMs: 60 * 1000 });
  if (!rl.success) {
    return createRateLimitResponse(rl.resetMs);
  }

  try {
    const searchParams = request.nextUrl.searchParams;

    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const sort = searchParams.get("sort");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const featured = searchParams.get("featured");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "12", 10) || 12));
    const skip = (page - 1) * limit;

    // Build filter criteria
    const where: {
      active: boolean;
      OR?: Array<{ name: { contains: string } } | { description: { contains: string } }>;
      category?: {
        OR: Array<{ slug: string } | { id: string }>;
      };
      price?: {
        gte?: number;
        lte?: number;
      };
      featured?: boolean;
    } = {
      active: true,
    };

    if (search && search.trim() !== "") {
      where.OR = [
        { name: { contains: search.trim() } },
        { description: { contains: search.trim() } },
      ];
    }

    if (category && category.trim() !== "") {
      where.category = {
        OR: [
          { slug: category.trim() },
          { id: category.trim() },
        ],
      };
    }

    const parsedMin = minPrice ? parseFloat(minPrice) : NaN;
    const parsedMax = maxPrice ? parseFloat(maxPrice) : NaN;
    if (!isNaN(parsedMin) || !isNaN(parsedMax)) {
      where.price = {};
      if (!isNaN(parsedMin)) where.price.gte = parsedMin;
      if (!isNaN(parsedMax)) where.price.lte = parsedMax;
    }

    if (featured === "true") {
      where.featured = true;
    }

    // Determine sort ordering
    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
    if (sort === "price-asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price-desc") {
      orderBy = { price: "desc" };
    } else if (sort === "name") {
      orderBy = { name: "asc" };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          reviews: {
            select: {
              id: true,
              rating: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
