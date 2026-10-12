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

  // Create categories
  const electronics = await prisma.category.create({
    data: {
      name: "Electronics",
      slug: "electronics",
      description: "Latest gadgets and electronics",
      image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400",
    },
  });

  const clothing = await prisma.category.create({
    data: {
      name: "Clothing",
      slug: "clothing",
      description: "Trendy fashion and apparel",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400",
    },
  });

  const homeGarden = await prisma.category.create({
    data: {
      name: "Home & Garden",
      slug: "home-garden",
      description: "Everything for your home",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
    },
  });

  const sports = await prisma.category.create({
    data: {
      name: "Sports & Outdoors",
      slug: "sports-outdoors",
      description: "Gear up for your next adventure",
      image: "https://images.unsplash.com/photo-1461896836934-bd45ba24e4c7?w=400",
    },
  });

  // Create products
  const products = await Promise.all([
    // Electronics
    prisma.product.create({
      data: {
        name: "Wireless Noise-Canceling Headphones",
        slug: "wireless-noise-canceling-headphones",
        description: "Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio. Features Bluetooth 5.2, comfortable memory foam ear cushions, and a foldable design for easy portability.",
        price: 299.99,
        comparePrice: 399.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600"]),
        categoryId: electronics.id,
        stock: 50,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Smart Watch Pro",
        slug: "smart-watch-pro",
        description: "Advanced smartwatch with health monitoring, GPS tracking, and a stunning AMOLED display. Water-resistant up to 50m with 7-day battery life. Tracks heart rate, sleep, blood oxygen, and over 100 workout modes.",
        price: 349.99,
        comparePrice: 449.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600", "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600"]),
        categoryId: electronics.id,
        stock: 35,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "4K Ultra HD Monitor",
        slug: "4k-ultra-hd-monitor",
        description: "27-inch 4K UHD monitor with IPS panel, 99% sRGB color accuracy, USB-C connectivity, and built-in speakers. Perfect for creative professionals and productivity enthusiasts.",
        price: 499.99,
        comparePrice: 599.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600"]),
        categoryId: electronics.id,
        stock: 20,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Portable Bluetooth Speaker",
        slug: "portable-bluetooth-speaker",
        description: "Waterproof portable speaker with 360° immersive sound, 20-hour playtime, and built-in microphone. Perfect for outdoor adventures, pool parties, and beach trips.",
        price: 79.99,
        comparePrice: 99.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600"]),
        categoryId: electronics.id,
        stock: 100,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Mechanical Keyboard RGB",
        slug: "mechanical-keyboard-rgb",
        description: "Full-size mechanical keyboard with customizable RGB backlighting, hot-swappable switches, and programmable macro keys. Durable aluminum frame with PBT keycaps.",
        price: 149.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1595225476474-87563907a212?w=600"]),
        categoryId: electronics.id,
        stock: 45,
        featured: false,
      },
    }),

    // Clothing
    prisma.product.create({
      data: {
        name: "Premium Cotton T-Shirt",
        slug: "premium-cotton-tshirt",
        description: "Ultra-soft 100% organic cotton t-shirt with a relaxed fit. Pre-washed for a vintage feel. Available in multiple colors. Sustainably sourced and ethically manufactured.",
        price: 39.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600", "https://images.unsplash.com/photo-1622445275576-721325763afe?w=600"]),
        categoryId: clothing.id,
        stock: 200,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Slim Fit Denim Jeans",
        slug: "slim-fit-denim-jeans",
        description: "Classic slim-fit jeans made from premium stretch denim. Features a comfortable mid-rise waist, tapered leg, and authentic indigo wash. Built to last with reinforced stitching.",
        price: 89.99,
        comparePrice: 119.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600"]),
        categoryId: clothing.id,
        stock: 150,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Lightweight Running Jacket",
        slug: "lightweight-running-jacket",
        description: "Ultralight windproof and water-resistant running jacket. Features reflective details for visibility, zippered pockets, and breathable mesh panels. Packs into its own pocket.",
        price: 129.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600"]),
        categoryId: clothing.id,
        stock: 60,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Merino Wool Sweater",
        slug: "merino-wool-sweater",
        description: "Luxurious merino wool crew-neck sweater. Naturally temperature-regulating, moisture-wicking, and odor-resistant. Perfect for layering in any season.",
        price: 119.99,
        comparePrice: 159.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1434389677669-e08b4cda3f0a?w=600"]),
        categoryId: clothing.id,
        stock: 75,
        featured: false,
      },
    }),

    // Home & Garden
    prisma.product.create({
      data: {
        name: "Ceramic Plant Pot Set",
        slug: "ceramic-plant-pot-set",
        description: "Set of 3 minimalist ceramic plant pots with bamboo saucers. Modern matte finish in neutral tones. Drainage holes included. Perfect for succulents, herbs, and small plants.",
        price: 49.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600"]),
        categoryId: homeGarden.id,
        stock: 80,
        featured: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Scented Soy Candle Collection",
        slug: "scented-soy-candle-collection",
        description: "Hand-poured soy wax candles in 3 calming scents: lavender, vanilla, and eucalyptus. Made with essential oils and cotton wicks. 50+ hour burn time each.",
        price: 34.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600"]),
        categoryId: homeGarden.id,
        stock: 120,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Minimalist Desk Lamp",
        slug: "minimalist-desk-lamp",
        description: "Sleek LED desk lamp with adjustable brightness and color temperature. Touch-sensitive controls, USB charging port, and a flexible gooseneck. Energy-efficient with 50,000-hour lifespan.",
        price: 69.99,
        comparePrice: 89.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600"]),
        categoryId: homeGarden.id,
        stock: 55,
        featured: false,
      },
    }),

    // Sports & Outdoors
    prisma.product.create({
      data: {
        name: "Yoga Mat Premium",
        slug: "yoga-mat-premium",
        description: "Eco-friendly non-slip yoga mat made from natural rubber and recycled materials. 6mm thick for optimal cushioning. Includes carrying strap. Alignment markers built-in.",
        price: 59.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600"]),
        categoryId: sports.id,
        stock: 90,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Stainless Steel Water Bottle",
        slug: "stainless-steel-water-bottle",
        description: "Double-wall vacuum insulated water bottle. Keeps drinks cold for 24 hours or hot for 12. BPA-free, leak-proof lid with one-hand operation. 750ml capacity.",
        price: 29.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600"]),
        categoryId: sports.id,
        stock: 200,
        featured: false,
      },
    }),
    prisma.product.create({
      data: {
        name: "Resistance Bands Set",
        slug: "resistance-bands-set",
        description: "Complete set of 5 resistance bands with varying levels of resistance. Includes door anchor, ankle straps, and carrying bag. Perfect for home workouts and physical therapy.",
        price: 24.99,
        comparePrice: 39.99,
        images: JSON.stringify(["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600"]),
        categoryId: sports.id,
        stock: 150,
        featured: true,
      },
    }),
  ]);

  // Create reviews
  await Promise.all([
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Best headphones I've ever owned! The noise cancellation is incredible and battery life is amazing.",
        userId: user.id,
        productId: products[0].id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 4,
        comment: "Great smartwatch with tons of features. The battery lasts about 5 days with heavy use.",
        userId: user.id,
        productId: products[1].id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Super comfortable and great quality cotton. Will definitely buy more!",
        userId: user.id,
        productId: products[5].id,
      },
    }),
    prisma.review.create({
      data: {
        rating: 5,
        comment: "Beautiful pots! They look even better in person. Great quality.",
        userId: admin.id,
        productId: products[9].id,
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
        code: "SAVE20",
        type: "FIXED",
        value: 20,
        minOrder: 100,
        maxUses: 50,
        active: true,
        expiresAt: new Date("2027-06-30"),
      },
    }),
    prisma.discount.create({
      data: {
        code: "SUMMER25",
        type: "PERCENTAGE",
        value: 25,
        minOrder: 75,
        maxUses: 200,
        active: true,
        expiresAt: new Date("2027-08-31"),
      },
    }),
  ]);

  // Create a sample order
  await prisma.order.create({
    data: {
      userId: user.id,
      total: 339.98,
      status: "DELIVERED",
      trackingNumber: "TRK-2024-001234",
      shippingAddress: JSON.stringify({
        fullName: "John Doe",
        address: "123 Main St",
        city: "New York",
        state: "NY",
        zipCode: "10001",
        country: "US",
        phone: "+1 555-0123",
      }),
      items: {
        create: [
          {
            productId: products[0].id,
            quantity: 1,
            price: 299.99,
          },
          {
            productId: products[5].id,
            quantity: 1,
            price: 39.99,
          },
        ],
      },
    },
  });

  console.log("✅ Database seeded successfully!");
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
