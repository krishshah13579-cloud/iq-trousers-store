import { prisma } from "@/lib/prisma";
import { sendSetAutoUnsetNotificationEmail } from "@/lib/email";

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
 * Evaluates a product's colors and checks if any color is OUT OF STOCK.
 * Business Rules:
 * 1. "IF IN THAT PARTICULAR COLOR 2 SIZES ARE AVAILABLE DON'T UNSET ANY SET."
 * 2. "IF ANY COLOR IS OUT OF STOCK ON E-COMMERCE BUT WE HAVE STOCK OF SAME PRODUCT IN WHOLESALE:
 *     MAKE 1 SET UNSET AND UPDATE AVAILABLE QUANTITY IN E-COMMERCE WEBSITE, INFORMING VIA EMAIL."
 * 3. Never unset more than 1 set per color (_unsetCounts[color] >= 1).
 */
export async function autoUnsetOutOfStockColors(productId: string): Promise<boolean> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return false;

    // Parse configured sizes
    let sizesList: string[] = ["30", "32", "34", "36", "38"];
    try {
      if (product.sizes) {
        const parsed = JSON.parse(product.sizes);
        if (Array.isArray(parsed) && parsed.length > 0) sizesList = parsed;
      }
    } catch {}

    // Parse current e-commerce inventory map and unset tracking
    let inventoryMap: Record<string, any> = {};
    let unsetCounts: Record<string, number> = {};
    try {
      if (product.inventory) {
        const parsed = JSON.parse(product.inventory);
        if (parsed && typeof parsed === "object") {
          inventoryMap = parsed;
          if (parsed._unsetCounts && typeof parsed._unsetCounts === "object") {
            unsetCounts = { ...parsed._unsetCounts };
          }
        }
      }
    } catch {}

    // Parse colors list
    let colorsList: string[] = [];
    try {
      if (product.colors) {
        const parsed = JSON.parse(product.colors);
        if (Array.isArray(parsed)) colorsList = parsed;
      }
    } catch {}

    if (colorsList.length === 0 && Object.keys(inventoryMap).length > 0) {
      colorsList = Object.keys(inventoryMap).filter((k) => !k.startsWith("_"));
    }

    if (colorsList.length === 0) return false;

    // Find corresponding wholesale product
    const canonicalName = normalizeCode(product.name);
    let wholesaleProds: any[] = [];
    try {
      wholesaleProds = await prisma.$queryRawUnsafe(`
        SELECT id, name, "setsColorwise", "pcsPerSet", "sizesList"
        FROM wholesale."Product"
      `);
    } catch (dbErr) {
      console.warn("[AUTO-UNSET] Unable to query wholesale table:", dbErr);
      return false;
    }

    const matchedWholesale = wholesaleProds.find(
      (wp) => normalizeCode(wp.name) === canonicalName
    );

    if (!matchedWholesale) return false;

    let didUnsetAny = false;
    let wholesaleSetsMap = parseSetsColorwise(matchedWholesale.setsColorwise);

    for (const color of colorsList) {
      const matchedColorKey = Object.keys(inventoryMap).find(
        (k) => k.trim().toLowerCase() === color.trim().toLowerCase()
      ) || color;

      const colorStock = inventoryMap[matchedColorKey] || {};

      // Count sizes with available pieces (> 0)
      const availableSizesCount = sizesList.filter(
        (sz) => (Number(colorStock[sz]) || 0) > 0
      ).length;

      // RULE 3: "IF IN THAT PARTICULAR COLOR 2 SIZES ARE AVAILABLE DON'T UNSET ANY SET."
      if (availableSizesCount >= 2) {
        continue;
      }

      // Check if already unset for this color
      if ((unsetCounts[matchedColorKey] || 0) >= 1 || (unsetCounts[color] || 0) >= 1) {
        continue;
      }

      // RULE 4: Check if color is OUT OF STOCK (0 loose pieces available across all sizes)
      const totalLoosePieces = sizesList.reduce(
        (sum, sz) => sum + (Number(colorStock[sz]) || 0),
        0
      );

      // Trigger unset when color is out of stock (0 pieces) or 0 sizes available
      const isColorOutOfStock = availableSizesCount === 0 || totalLoosePieces === 0;
      if (!isColorOutOfStock) {
        continue;
      }

      // Check if wholesale has >= 1 set for this color
      const availableSets = getAvailableSetsForColor(matchedWholesale.setsColorwise, color);
      if (availableSets <= 0) {
        continue;
      }

      // Perform atomic auto-unset:
      // 1. Deduct 1 set from wholesale.Product.setsColorwise
      const wholesaleTargetKey = Object.keys(wholesaleSetsMap).find(
        (k) => k.trim().toLowerCase() === color.trim().toLowerCase()
      );

      if (wholesaleTargetKey && wholesaleSetsMap[wholesaleTargetKey]) {
        const val = wholesaleSetsMap[wholesaleTargetKey];
        if (typeof val === "number") {
          wholesaleSetsMap[wholesaleTargetKey] = Math.max(0, val - 1);
        } else if (val && typeof val === "object" && val.ratios) {
          const firstRatioKey = Object.keys(val.ratios)[0];
          if (firstRatioKey && val.ratios[firstRatioKey] > 0) {
            val.ratios[firstRatioKey] = Math.max(0, Number(val.ratios[firstRatioKey]) - 1);
          }
        }
      }

      // 2. Add +1 piece to every size in e-commerce inventoryMap
      if (!inventoryMap[matchedColorKey]) {
        inventoryMap[matchedColorKey] = {};
      }
      for (const sz of sizesList) {
        inventoryMap[matchedColorKey][sz] = (Number(inventoryMap[matchedColorKey][sz]) || 0) + 1;
      }

      // 3. Mark unset count = 1
      unsetCounts[matchedColorKey] = 1;
      unsetCounts[color] = 1;

      const remainingSets = Math.max(0, availableSets - 1);

      // 4. Update wholesale product setsColorwise in DB
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE wholesale."Product" SET "setsColorwise" = $1 WHERE id = $2`,
          JSON.stringify(wholesaleSetsMap),
          matchedWholesale.id
        );
      } catch (wsErr) {
        console.error("[AUTO-UNSET] Failed to deduct set from wholesale:", wsErr);
      }

      // 5. Send automated email notification to Admin (Krish)
      sendSetAutoUnsetNotificationEmail({
        productName: product.name,
        color,
        sizesAdded: sizesList,
        remainingWholesaleSets: remainingSets,
      }).catch((emailErr) => {
        console.error("[AUTO-UNSET] Email alert failed:", emailErr);
      });

      didUnsetAny = true;
      console.log(`[AUTO-UNSET COMPLETE] Unpacked 1 set for ${product.name} (${color}) -> +1 pc to sizes ${sizesList.join(",")}`);
    }

    if (didUnsetAny) {
      inventoryMap._unsetCounts = unsetCounts;
      // Calculate new total stock
      let newTotalStock = 0;
      Object.keys(inventoryMap).forEach((k) => {
        if (!k.startsWith("_") && typeof inventoryMap[k] === "object") {
          Object.values(inventoryMap[k]).forEach((cnt: any) => {
            newTotalStock += Math.max(0, Number(cnt) || 0);
          });
        }
      });

      await prisma.product.update({
        where: { id: product.id },
        data: {
          inventory: JSON.stringify(inventoryMap),
          stock: newTotalStock,
        },
      });

      return true;
    }

    return false;
  } catch (err) {
    console.error("[AUTO-UNSET ERROR]", err);
    return false;
  }
}
