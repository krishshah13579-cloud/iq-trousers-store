import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getProductAllImages } from "@/lib/utils";

function normalizeCode(str: string): string {
  return (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function slugify(text: string): string {
  return (text || "")
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
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
 * Synchronize and merge all products from wholesale."Product" to public."Product"
 * If product exists: updates colors, sizes, stock, inventory, and comparePrice.
 * If product does not exist: creates a new product in public."Product" so it appears under New Arrivals.
 */
export async function performDirectStockSync() {
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
  const categories = await prisma.category.findMany();
  const defaultCategory = categories[0] || { id: "cmv64y1vg0002107jpul5acm2" };

  const updates: Array<{
    name: string;
    action: "updated" | "created";
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
    if (matched) {
      try {
        if (matched.inventory) {
          currentInventory = JSON.parse(matched.inventory);
        }
      } catch {}
    }

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
            colorBreakdown[sz] = Math.max(0, qty);
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

    // Extract all uploaded images from wholesale product using getProductAllImages
    const imagesArr: string[] = [];
    if (wp.imageUrl) {
      imagesArr.push(...getProductAllImages(wp.imageUrl));
    }
    if (wp.colorImages) {
      try {
        const parsedImgs = typeof wp.colorImages === "string" ? JSON.parse(wp.colorImages) : wp.colorImages;
        if (Array.isArray(parsedImgs)) {
          for (const item of parsedImgs) {
            if (typeof item === "string" && item.trim()) {
              imagesArr.push(...getProductAllImages(item));
            }
          }
        } else if (typeof parsedImgs === "object" && parsedImgs !== null) {
          Object.values(parsedImgs).forEach((img: any) => {
            if (typeof img === "string" && img.trim()) {
              imagesArr.push(...getProductAllImages(img));
            }
          });
        }
      } catch {}
    }
    const uniqueImages = Array.from(new Set(imagesArr.filter(Boolean)));

    if (matched) {
      const updateData: any = {
        name: wp.name,
        colors: JSON.stringify(colorsList),
        sizes: JSON.stringify(sizesList),
        inventory: JSON.stringify(inventoryMap),
        stock: totalPieces,
        active: totalPieces > 0 ? true : matched.active,
        ...(wp.mrp && wp.mrp > 0 ? { comparePrice: wp.mrp } : {}),
      };

      // When products are matched with stock, sync the exact uploaded image(s) from wholesale stock
      if (uniqueImages.length > 0) {
        updateData.images = JSON.stringify(uniqueImages);
      } else if (matched.images && matched.images.includes("photo-1542272604-780c96856592")) {
        const fallbackList = ["/products/imp-001.jpg", "/products/imp-002.jpg", "/products/imp-003.jpg", "/products/imp-004.jpg"];
        const selectedImg = fallbackList[Math.abs(canonicalWp.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % fallbackList.length];
        updateData.images = JSON.stringify([selectedImg]);
      }

      await prisma.product.update({
        where: { id: matched.id },
        data: updateData,
      });

      updates.push({
        name: wp.name,
        action: "updated",
        newStock: totalPieces,
        colors: colorsList,
      });

      try {
        revalidatePath(`/products/${matched.id}`);
        revalidatePath(`/products/${matched.slug}`);
      } catch {}
    } else {
      let cat = categories.find((c) =>
        wp.category && c.name.toLowerCase().includes(wp.category.toLowerCase().split(" ")[0])
      ) || defaultCategory;

      let baseSlug = slugify(wp.name);
      let finalSlug = baseSlug;
      let counter = 1;
      while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      const comparePrice = wp.mrp && wp.mrp > 0 ? wp.mrp : Math.round((wp.price || 800) * 1.33);
      const price = Math.round(comparePrice * 0.75);

      const fallbackList = ["/products/imp-001.jpg", "/products/imp-002.jpg", "/products/imp-003.jpg", "/products/imp-004.jpg"];
      const selectedImg = fallbackList[Math.abs(canonicalWp.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)) % fallbackList.length];

      const finalImages = uniqueImages.length > 0
        ? uniqueImages
        : [selectedImg];

      const created = await prisma.product.create({
        data: {
          name: wp.name,
          slug: finalSlug,
          description: "Premium handcrafted trousers tailored for perfection, unmatched all-day comfort, and refined silhouette.",
          careInstructions: "Machine wash cold with like colors. Line dry in shade. Warm iron.",
          price,
          comparePrice,
          images: JSON.stringify(finalImages),
          sizes: JSON.stringify(sizesList),
          colors: JSON.stringify(colorsList),
          inventory: JSON.stringify(inventoryMap),
          categoryId: cat.id,
          stock: totalPieces,
          featured: false,
          active: totalPieces > 0,
        },
      });

      updates.push({
        name: wp.name,
        action: "created",
        newStock: totalPieces,
        colors: colorsList,
      });

      try {
        revalidatePath(`/products/${created.id}`);
        revalidatePath(`/products/${created.slug}`);
      } catch {}
    }
  }

  try {
    revalidatePath("/");
    revalidatePath("/products");
  } catch {}

  return updates;
}
