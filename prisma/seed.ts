import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@store.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  // Create regular user
  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password: userPassword,
      role: "USER",
    },
  });

  // Create categories for clothing
  const casual = await prisma.category.create({
    data: {
      name: "Casual Everyday",
      slug: "casual-everyday",
      description: "Relaxed essentials, denim, premium tees, and everyday casualwear designed for comfort and modern style.",
      image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600",
    },
  });

  const formal = await prisma.category.create({
    data: {
      name: "Formal Wear",
      slug: "formal-wear",
      description: "Impeccably tailored suits, crisp dress shirts, pleated trousers, and elevated occasionwear.",
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",
    },
  });

  // Create clothing products with size options
  const products = await Promise.all([
    // Casual Everyday
    prisma.product.create({
      data: {
        name: "Classic Heavyweight Crewneck T-Shirt",
        slug: "classic-heavyweight-crewneck-tshirt",
        description: "Crafted from 240 GSM organic combed cotton, this heavyweight tee provides a relaxed, structured drape that maintains shape wear after wear. Pre-shrunk with reinforced ribbing at the neck.",
        price: 34.99,
        comparePrice: 45.0,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
          "https://images.unsplash.com/photo-1622445275576-721325763afe?w=600",
        ]),
        sizes: JSON.stringify(["30", "32", "34", "36", "38", "40", "42"]),
        categoryId: casual.id,
        stock: 120,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Slim-Tapered Stretch Denim Jeans",
        slug: "slim-tapered-stretch-denim-jeans",
        description: "12oz authentic selvedge-look denim blended with 2% elastane for effortless comfort. Features a mid-rise waist, slim fit through the thigh, and a clean taper toward the ankle.",
        price: 79.99,
        comparePrice: 99.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600",
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600",
        ]),
        sizes: JSON.stringify(["28", "30", "32", "34", "36", "38", "40"]),
        categoryId: casual.id,
        stock: 90,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Washed Linen Casual Button-Down",
        slug: "washed-linen-casual-button-down",
        description: "Pure European flax linen garment-washed for extraordinary softness and breathable comfort in warm weather. Features a relaxed camp collar and mother-of-pearl buttons.",
        price: 59.99,
        comparePrice: 75.0,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600",
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
        ]),
        sizes: JSON.stringify(["30", "32", "34", "36", "38", "40", "42", "44"]),
        categoryId: casual.id,
        stock: 65,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Everyday Stretch Chino Trousers",
        slug: "everyday-stretch-chino-trousers",
        description: "Versatile cotton-twill chinos engineered with 4-way stretch. Equally refined dressed up with a button-down or styled casually with a clean white tee.",
        price: 64.99,
        comparePrice: 79.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600",
        ]),
        sizes: JSON.stringify(["28", "30", "32", "34", "36", "38", "40", "42"]),
        categoryId: casual.id,
        stock: 80,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Vintage Washed Overshirt Jacket",
        slug: "vintage-washed-overshirt-jacket",
        description: "Heavyweight cotton canvas overshirt with functional utility chest pockets and antique brass buttons. The ideal trans-seasonal layering piece.",
        price: 89.99,
        comparePrice: 119.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600",
        ]),
        sizes: JSON.stringify(["32", "34", "36", "38", "40", "42", "44"]),
        categoryId: casual.id,
        stock: 45,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Merino Knit Casual Polo",
        slug: "merino-knit-casual-polo",
        description: "Ultra-fine 100% Australian Merino wool knit polo. Natural temperature regulation, ribbed cuffs, and open placket for understated everyday luxury.",
        price: 54.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600",
        ]),
        sizes: JSON.stringify(["30", "32", "34", "36", "38", "40", "42"]),
        categoryId: casual.id,
        stock: 70,
        featured: false,
      },
    }),

    // Formal Wear
    prisma.product.create({
      data: {
        name: "Italian Wool Tailored Blazer",
        slug: "italian-wool-tailored-blazer",
        description: "Constructed from Super 120s pure Italian wool with full canvas construction, notch lapels, pick-stitching, and dual side vents. Tailored for sharp formal elegance.",
        price: 249.99,
        comparePrice: 329.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
          "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600",
        ]),
        sizes: JSON.stringify(["34", "36", "38", "40", "42", "44"]),
        categoryId: formal.id,
        stock: 40,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Tailored Slim Formal Trousers",
        slug: "tailored-slim-formal-trousers",
        description: "Flat-front dress trousers made from high-twist wool with natural crease recovery. Features side waist adjusters, half-lined interior, and an unfinished hem for precision tailoring.",
        price: 119.99,
        comparePrice: 149.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600",
        ]),
        sizes: JSON.stringify(["28", "30", "32", "34", "36", "38", "40", "42"]),
        categoryId: formal.id,
        stock: 55,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Classic Crisp Oxford Formal Shirt",
        slug: "classic-crisp-oxford-formal-shirt",
        description: "100% two-ply Egyptian cotton woven into a refined pinpoint Oxford texture. Features a structured semi-spread collar, French front, and adjustable rounded cuffs.",
        price: 69.99,
        comparePrice: 89.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1620012253295-c15c429fccf8?w=600",
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600",
        ]),
        sizes: JSON.stringify(["30", "32", "34", "36", "38", "40", "42", "44"]),
        categoryId: formal.id,
        stock: 110,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Double-Breasted Charcoal Wool Suit Jacket",
        slug: "double-breasted-charcoal-wool-suit-jacket",
        description: "Commanding 6x2 double-breasted suit jacket in rich charcoal mélange wool. Peak lapels, functional cuff buttons, and cupro silk lining provide an authoritative silhouette.",
        price: 289.99,
        comparePrice: 369.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?w=600",
        ]),
        sizes: JSON.stringify(["36", "38", "40", "42", "44"]),
        categoryId: formal.id,
        stock: 30,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Pleated Wool Formal Dress Pants",
        slug: "pleated-wool-formal-dress-pants",
        description: "Single reverse pleat trousers crafted with breathable tropical wool. Extended waistband tab with horn button and internal shirt grippers.",
        price: 129.99,
        comparePrice: 169.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600",
        ]),
        sizes: JSON.stringify(["30", "32", "34", "36", "38", "40", "42"]),
        categoryId: formal.id,
        stock: 45,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Midnight Navy Formal Dinner Jacket",
        slug: "midnight-navy-formal-dinner-jacket",
        description: "Black-tie elegance in midnight navy virgin wool with grosgrain silk shawl collar. Single jetted pockets and satin-covered buttons for premier evening occasions.",
        price: 319.99,
        comparePrice: 399.99,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600",
        ]),
        sizes: JSON.stringify(["36", "38", "40", "42", "44"]),
        categoryId: formal.id,
        stock: 25,
        featured: false,
      },
    }),
  ]);

  // Create sample customer reviews
  await Promise.all([
    prisma.review.create({
      data: {
        rating: 5,
        comment: "The cut on the Italian wool blazer is impeccable. Fits like a bespoke suit straight off the rack!",
        userId: user.id,
        productId: products[6].id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Excellent stretch denim. Waist size 32 is true to size and the taper is spot on.",
        userId: user.id,
        productId: products[1].id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Super comfortable heavyweight tee. Doesn't shrink in the wash at all.",
        userId: user.id,
        productId: products[0].id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Perfect crisp collar for business meetings. Will definitely order in more sizes.",
        userId: admin.id,
        productId: products[8].id,
      },
    }),
  ]);

  // Create discount codes
  await Promise.all([
    prisma.discount.create({
      data: {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minOrder: 50,
        maxUses: 100,
        active: true,
        expiresAt: new Date("2027-12-31"),
      },
    }),
    prisma.discount.create({
      data: {
        code: "FORMAL20",
        type: "PERCENTAGE",
        value: 20,
        minOrder: 150,
        maxUses: 100,
        active: true,
        expiresAt: new Date("2027-12-31"),
      },
    }),
    prisma.discount.create({
      data: {
        code: "SAVE20",
        type: "FIXED",
        value: 20,
        minOrder: 100,
        maxUses: 50,
        active: true,
        expiresAt: new Date("2027-06-30"),
      },
    }),
  ]);

  // Create a sample order with size
  await prisma.order.create({
    data: {
      userId: user.id,
      total: 284.98,
      status: "DELIVERED",
      trackingNumber: "TRK-CLOTHING-88219",
      shippingAddress: JSON.stringify({
        fullName: "John Doe",
        address: "742 Evergreen Terrace",
        city: "Springfield",
        state: "OR",
        zipCode: "97477",
        country: "US",
        phone: "+1 555-0199",
      }),
      items: {
        create: [
          {
            productId: products[6].id,
            size: "38",
            quantity: 1,
            price: 249.99,
          },
          {
            productId: products[0].id,
            size: "32",
            quantity: 1,
            price: 34.99,
          },
        ],
      },
    },
  });

  console.log("✅ Clothing database seeded successfully!");
  console.log("🏷️ Categories: Casual Everyday & Formal Wear");
  console.log("📏 Sizes available: 28, 30, 32, 34, 36, 38, 40, 42, 44");
  console.log("📧 Admin: admin@store.com / admin123");
  console.log("📧 User:  john@example.com / user123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
