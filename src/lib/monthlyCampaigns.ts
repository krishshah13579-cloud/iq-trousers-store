/**
 * Dynamic Monthly Campaigns for IQ Trousers Hero Carousel.
 * Automatically changes the festival poster, discount poster, and new arrival poster
 * every month as per the active festival season, discounts available, and new arrivals.
 * Inspired by Levi's and high-fashion menswear brand billboard campaigns.
 */

export interface CampaignPoster {
  id: string;
  type: "festival" | "discount" | "new-arrival";
  tabTitle: string;
  badge: string;
  tagline: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  bgImage: string;
  accentBadgeColor: string;
  couponCode?: string;
  couponOffer?: string;
  features?: string[];
}

export interface MonthCampaignConfig {
  monthIndex: number; // 0 = Jan, 11 = Dec
  monthName: string;
  season: "Winter" | "Spring" | "Summer" | "Monsoon" | "Autumn" | "Festive";
  festival: {
    badge: string;
    tagline: string;
    title: string;
    subtitle: string;
    description: string;
    ctaText: string;
    ctaLink: string;
    bgImage: string;
  };
  discount: {
    badge: string;
    tagline: string;
    title: string;
    subtitle: string;
    description: string;
    couponCode: string;
    couponOffer: string;
    ctaText: string;
    ctaLink: string;
    bgImage: string;
  };
  newArrival: {
    badge: string;
    tagline: string;
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    ctaText: string;
    ctaLink: string;
    bgImage: string;
  };
}

export const MONTHLY_CAMPAIGNS: MonthCampaignConfig[] = [
  // 0: January
  {
    monthIndex: 0,
    monthName: "January",
    season: "Winter",
    festival: {
      badge: "NEW YEAR & REPUBLIC CELEBRATION • FESTIVE EDIT",
      tagline: "THE NEW YEAR REGALIA",
      title: "NEW YEAR, ELEVATED STYLE",
      subtitle: "Executive Worsted Wool & Boardroom Formals",
      description:
        "Step into the new year with commanding boardroom authority. Crafted from heavyweight worsted flannels with French curtained waistbands tailored for modern leaders.",
      ctaText: "Shop New Year Edit",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "END OF SEASON SALE • WINTER CLEARANCE",
      tagline: "ANNUAL WINTER SAVINGS",
      title: "UP TO 40% OFF",
      subtitle: "Flat ₹100 Off on Orders Above ₹1,999 with Exclusive Coupon",
      description:
        "End the season on a high note. Enjoy heavy discounts across all wool-blend and comfort-flex winter trouser lines with nationwide complimentary dispatch.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF • Min Order ₹1,999",
      ctaText: "Claim Winter Discount",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • EARLY SPRING 2026",
      tagline: "FIRST DROP OF THE YEAR",
      title: "THE TRANSITIONAL FIT",
      subtitle: "Medium-Weight Stretch Chinos for Season Hand-off",
      description:
        "Engineered for the transition from chill to spring warmth. Features adaptive 4-way flex waistbands and moisture-wicking weave.",
      features: ["360° Flex Waist", "Zero-Iron Crease", "Tailored Ankle Break"],
      ctaText: "Explore Jan Drops",
      ctaLink: "/products",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 1: February
  {
    monthIndex: 1,
    monthName: "February",
    season: "Spring",
    festival: {
      badge: "ROYAL WEDDING & RECEPTION EDIT",
      tagline: "CELEBRATION SOIREE",
      title: "THE WEDDING GALA",
      subtitle: "Luxury Sateen Creases & Bespoke Evening Silhouettes",
      description:
        "Tailored for the grand Indian wedding season. Precision French pleats, internal shirt-retention grips, and impeccable break over dress footwear.",
      ctaText: "Shop Wedding Collection",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "VALENTINE & CELEBRATION SPECIAL",
      tagline: "EXCLUSIVE FEBRUARY PROMO",
      title: "SPECIAL FESTIVE DEALS",
      subtitle: "Flat ₹100 Off on Luxury Formal & Casual Trousers",
      description:
        "Dress your best for special evenings. Save on twin-pair orders and enjoy doorstep express transit across all PIN codes.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF • Limited Time Offer",
      ctaText: "Claim Exclusive Deal",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "SPRING DEBUT • COLLECTION 2026",
      tagline: "FRESH AIR PERFORMANCE",
      title: "SPRING LINEN-STRETCH",
      subtitle: "Featherlight Weaves Crafted for Dynamic Daywear",
      description:
        "Our latest innovation combining French flax linen with micro-elastic stretch fibers for breathable refinement from brunch to boardroom.",
      features: ["French Flax Linen", "Anti-Wrinkle Weave", "Relaxed Taper"],
      ctaText: "Discover Spring Drops",
      ctaLink: "/products?category=everyday-casual",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 2: March
  {
    monthIndex: 2,
    monthName: "March",
    season: "Spring",
    festival: {
      badge: "HOLI FESTIVAL OF COLORS & SPRING EQUINOX",
      tagline: "FESTIVE SPRING ENERGY",
      title: "FESTIVE EQUINOX EDIT",
      subtitle: "Vibrant Earthy & Navy Tones in Easy-Clean Stretch",
      description:
        "Celebrate the festival of colors with effortless flair. Stain-resistant Nano-wash twills engineered to stay spotless and sharp all celebration long.",
      ctaText: "Shop Festive Spring",
      ctaLink: "/products?category=everyday-casual",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "MID-SEASON FLASH SALE",
      tagline: "SPRING PROMO EXTRAVAGANZA",
      title: "FLAT ₹100 SAVINGS",
      subtitle: "Apply Promo Code for Instant Cart Reduction",
      description:
        "Upgrade your wardrobe for the warm season ahead. Flat discount on premium everyday chinos, tailored formals, and comfort stretch trousers.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF on Entire Cart",
      ctaText: "Apply & Shop Now",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • HIGH-TWIST COTTON",
      tagline: "NEW GENERATION COMFORT",
      title: "THE ULTIMATE CHINO",
      subtitle: "Engineered 360-Degree Mobility & Zero Crease Loss",
      description:
        "High-density compact spun cotton with an active flex core that maintains crisp front creases even after continuous twelve-hour wear.",
      features: ["Compact Spun Cotton", "No-Slip Waist", "Laser Hemmed"],
      ctaText: "Explore New Chinos",
      ctaLink: "/products?category=everyday-casual",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 3: April
  {
    monthIndex: 3,
    monthName: "April",
    season: "Summer",
    festival: {
      badge: "EID-UL-FITR & BAISAKHI SPECIAL FESTIVE EDIT",
      tagline: "ROYAL FESTIVE ATTIRE",
      title: "THE ROYAL FESTIVAL GALA",
      subtitle: "Opulent Midnight Navy & Jet Black Tailoring",
      description:
        "Celebrate Eid and Baisakhi with majestic sartorial presence. Luxurious drape, hidden comfort flex waist, and exquisite satin pocket piping.",
      ctaText: "Shop Eid & Festive Fits",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "EID & FESTIVE CELEBRATION DISCOUNT",
      tagline: "FESTIVE SAVINGS UNLOCKED",
      title: "FLAT ₹100 OFF",
      subtitle: "Celebrate with Instant Checkout Savings Across India",
      description:
        "Festive gifting and personal luxury made accessible. Free express DTDC delivery to your doorstep on every order.",
      couponCode: "FLAT100",
      couponOffer: "USE CODE: FLAT100 AT CHECKOUT",
      ctaText: "Shop Festive Sale",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • SUMMER BREEZE LINE",
      tagline: "COOLING TECHNOLOGY",
      title: "AERO-FLEX TROUSERS",
      subtitle: "Micro-Perforated Comfort for Summer Days",
      description:
        "Designed to beat 40°C heat with active airflow channels and lightweight cotton-modal stretch composition.",
      features: ["Micro-Ventilated", "Featherlight 210 GSM", "Active Flex"],
      ctaText: "Explore Aero-Flex",
      ctaLink: "/products",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 4: May
  {
    monthIndex: 4,
    monthName: "May",
    season: "Summer",
    festival: {
      badge: "AKSHAYA TRITIYA & SUMMER WEDDINGS",
      tagline: "GOLDEN AUSPICIOUS OCCASIONS",
      title: "THE AUSPICIOUS EDIT",
      subtitle: "Bespoke Sand, Beige & Light Khaki Formals",
      description:
        "Bring prosperity to auspicious milestones in refined neutral hues. Lightweight tropical worsted wool engineered for cool comfort.",
      ctaText: "Shop Golden Edit",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "SUMMER CARNIVAL SAVINGS",
      tagline: "MID-SUMMER SPECIAL",
      title: "SUMMER SAVINGS SPREE",
      subtitle: "Save Extra with Instant Coupon on Handcrafted Trousers",
      description:
        "Beat the heat with massive summer discounts. Premium stretch trousers shipped within 48 hours directly from our Ahmedabad workshop.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF • Use Code: FLAT100",
      ctaText: "Shop Summer Sale",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • RESORT & LEISURE",
      tagline: "SUMMER VACATION ESSENTIAL",
      title: "RIVIERA LINEN CHINOS",
      subtitle: "Casual Elegance for Weekends & Travel",
      description:
        "The relaxed vacation silhouette reimagined with a modern tapered cuff and stretch drawstring-hybrid waistband.",
      features: ["Pure Belgian Linen Blend", "Drawstring + Belt Loops", "Pre-Shrunk"],
      ctaText: "Discover Riviera Line",
      ctaLink: "/products?category=everyday-casual",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 5: June
  {
    monthIndex: 5,
    monthName: "June",
    season: "Monsoon",
    festival: {
      badge: "MID-YEAR SOIREE & FATHER'S DAY EDIT",
      tagline: "THE TIMELESS GENTLEMAN",
      title: "FATHER & SON TAILORING",
      subtitle: "Classic Cuts Engineered for Uncompromising Dignity",
      description:
        "Honoring generational craftsmanship. Timeless regular and slim-tapered silhouettes that fit effortlessly across all sizes 28 through 44.",
      ctaText: "Shop Timeless Cuts",
      ctaLink: "/products",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "MID-YEAR MEGA EVENT",
      tagline: "HALF-YEAR SALE",
      title: "UP TO 40% OFF",
      subtitle: "Instant Savings with Live Promo Discount Coupon",
      description:
        "Mid-year wardrobe replenishment event. Stock up on essential charcoal, navy, and khaki trousers with nationwide doorstep fulfillment.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 DISCOUNT ON ORDERS",
      ctaText: "Grab Mid-Year Deal",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • MONSOON PROOFING",
      tagline: "ALL-WEATHER TROUSERS",
      title: "HYDRO-REPEL SERIES",
      subtitle: "Quick-Dry DWR Finish for Rainy Commutes",
      description:
        "Water beads off effortlessly while maintaining the soft hand-feel of luxury combed cotton twill.",
      features: ["Hydrophobic Coating", "Fast-Drying", "Stain Guard"],
      ctaText: "Shop Hydro-Repel",
      ctaLink: "/products",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 6: July
  {
    monthIndex: 6,
    monthName: "July",
    season: "Monsoon",
    festival: {
      badge: "PRE-FESTIVE MONSOON CELEBRATION",
      tagline: "EARLY FESTIVE PREVIEW",
      title: "THE PREVIEW COLLECTION",
      subtitle: "Architectural Trousers Designed for Contemporary Poise",
      description:
        "A glimpse into the upcoming festival season. High-density tailored weaves built for movement, presentation, and all-weather confidence.",
      ctaText: "Shop Preview Edit",
      ctaLink: "/products",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "MONSOON MANIA DISCOUNTS",
      tagline: "RAINY SEASON OFFER",
      title: "FLAT ₹100 OFF",
      subtitle: "Use Code FLAT100 for Instant Cart Deductions",
      description:
        "Upgrade your trouser rotation without second thought. Tested across thousands of everyday commutes.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF • Pan-India Delivery",
      ctaText: "Claim Monsoon Discount",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • DUAL-STRETCH SERIES",
      tagline: "BI-STRETCH REVOLUTION",
      title: "THE 4D FLEX FORMAL",
      subtitle: "True 360-Degree Expansion Without Sagging",
      description:
        "Retains crisp sharp creases from morning flights through midnight dinners with our proprietary elastane-core yarn.",
      features: ["Bi-Stretch Memory", "Anti-Crease", "Curtained Waistband"],
      ctaText: "Explore 4D Flex",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 7: August
  {
    monthIndex: 7,
    monthName: "August",
    season: "Festive",
    festival: {
      badge: "INDEPENDENCE DAY & RAKSHA BANDHAN GALA",
      tagline: "FREEDOM & TRADITION",
      title: "FREEDOM TO MOVE",
      subtitle: "Unrestricted Movement for Festive Family Celebrations",
      description:
        "Celebrate freedom and kinship in quintessential style. Ultra-comfortable flex waistbands crafted for festive dinners and sibling reunions.",
      ctaText: "Shop Independence Edit",
      ctaLink: "/products?category=everyday-casual",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "FREEDOM FESTIVAL SALE",
      tagline: "INDEPENDENCE DAY DEALS",
      title: "FLAT ₹100 SAVINGS",
      subtitle: "Special National Holiday Promotional Coupon",
      description:
        "Celebrate Independence Day with exclusive discounts across all trousers. Crafted in India with surgical tailoring standards.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF • Code: FLAT100",
      ctaText: "Shop Freedom Deals",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • PRE-FALL COLLECTION",
      tagline: "PRE-FALL PREVIEW",
      title: "AUTUMN CHINO LAUNCH",
      subtitle: "Rich Earthy Tones: Mocha, Cognac & Dark Olive",
      description:
        "Warm rich tones for the turn of the season. Deep dyed colorfast fabrics that stay vibrant wash after wash.",
      features: ["Colorfast Dye", "Velvet-Touch Peach Finish", "Reinforced Seams"],
      ctaText: "Explore Autumn Chinos",
      ctaLink: "/products",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 8: September
  {
    monthIndex: 8,
    monthName: "September",
    season: "Festive",
    festival: {
      badge: "NAVRATRI & DUSSEHRA SPECIAL FESTIVE GALA",
      tagline: "NINE NIGHTS OF STYLE",
      title: "THE FESTIVE OVERTURE",
      subtitle: "Charcoal, Midnight Navy & Deep Jet Black Attire",
      description:
        "Dance, celebrate, and command every festive venue. Breathable tailored trousers that remain crisp throughout nine nights of celebration.",
      ctaText: "Shop Navratri Collection",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "DUSSEHRA FESTIVE PROMO",
      tagline: "VICTORY OF STYLE",
      title: "FLAT ₹100 DISCOUNT",
      subtitle: "Instant Savings with Coupon on All Cart Purchases",
      description:
        "Kick off the festival season with unbeatable savings on high-grade tailored menswear.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF • Valid All Month",
      ctaText: "Grab Festive Discount",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • LUXURY PLEATED EDIT",
      tagline: "THE PLEATED RENAISSANCE",
      title: "THE SARTORIAL PLEAT",
      subtitle: "Double-Pleat drape with High-Rise Comfort",
      description:
        "The classic sartorial silhouette is back. Relaxed through the thighs with a sharp taper down to the shoe line.",
      features: ["Double Forward Pleats", "High-Rise Fit", "Extended Tab Closure"],
      ctaText: "Discover Pleated Fit",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 9: October (CURRENT MONTH!)
  {
    monthIndex: 9,
    monthName: "October",
    season: "Festive",
    festival: {
      badge: "DIWALI & DHANTERAS GRAND EXTRAVAGANZA",
      tagline: "THE GRAND DIWALI GALA",
      title: "ILLUMINATE IN STYLE",
      subtitle: "Bespoke Royal Festive Trousers Tailored to Perfection",
      description:
        "Illuminate the festival of lights in sharp tailored brilliance. Hand-finished waistbands, deep lustrous navy & jet black tones, engineered for grand festive nights and family celebrations.",
      ctaText: "Shop Diwali Collection",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "DIWALI MEGA SALE • EXCLUSIVE DISCOUNT",
      tagline: "FESTIVE SAVINGS UNLOCKED",
      title: "FLAT ₹100 OFF",
      subtitle: "Apply Code FLAT100 for Instant Savings on Premium Trousers",
      description:
        "Our biggest festive promotion of the year. Save on every pair, with complimentary DTDC express dispatch from our Ahmedabad warehouse directly to your doorstep.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF • Code: FLAT100",
      ctaText: "Claim Diwali Discount",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • AUTUMN/WINTER '26",
      tagline: "LEVI'S STYLE EDITORIAL DROP",
      title: "WINTER WORSTED '26",
      subtitle: "Heavyweight Flannels & Architectural 4-Way Stretch",
      description:
        "Experience the next echelon of tailored performance. Featuring anti-slip internal shirt grips, flex-comfort waistbands, and impeccable break over dress shoes.",
      features: ["Heavyweight 320 GSM", "Zero-Iron Crease", "Tailored Ankle Break"],
      ctaText: "Explore New Drops",
      ctaLink: "/products",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 10: November
  {
    monthIndex: 10,
    monthName: "November",
    season: "Winter",
    festival: {
      badge: "WEDDING SEASON & POST-DIWALI CELEBRATION",
      tagline: "THE CELEBRATION SUITE",
      title: "ROYAL WEDDING SEASON",
      subtitle: "Opulent Black-Tie Formals & Satin Creased Trousers",
      description:
        "The definitive trousers for the Indian wedding gala. Impeccable drape with anti-slip shirt grips and hidden stretch waist engineered for celebratory nights.",
      ctaText: "Shop Wedding Gala",
      ctaLink: "/products?category=formal-wear",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "BLACK FRIDAY & CYBER WEEK SALE",
      tagline: "MEGA NOVEMBER DISCOUNTS",
      title: "UP TO 50% OFF",
      subtitle: "Huge Limited-Time Price Drops on Signature Trouser Fits",
      description:
        "Global Cyber Week event at IQ Trousers. Unlock the lowest prices of the year on both formal trousers and everyday comfort stretch chinos.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF + UP TO 50% SALE",
      ctaText: "Shop Black Friday Sale",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • THERMAL FLANNEL SERIES",
      tagline: "WINTER INSULATION",
      title: "THERMAL WORSTED WEAVE",
      subtitle: "Engineered for Cold Weather Without Any Added Bulk",
      description:
        "Dense-gauge wool blend with micro-brushed interior lining for sub-zero warmth and razor-sharp tailored creases.",
      features: ["Micro-Brushed Interior", "Thermal Wool Core", "Wind Resistant"],
      ctaText: "Shop Thermal Flannels",
      ctaLink: "/products",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },

  // 11: December
  {
    monthIndex: 11,
    monthName: "December",
    season: "Winter",
    festival: {
      badge: "CHRISTMAS & YEAR-END GRAND FINALE",
      tagline: "YEAR-END REVELRY",
      title: "THE WINTER GALA",
      subtitle: "Heavyweight Corduroys, Velveteen Finishes & Evening Formals",
      description:
        "Celebrate the grand finale of the year in unparalleled warmth and sophistication. Tailored for Christmas banquets, winter getaways, and New Year countdowns.",
      ctaText: "Shop Year-End Edit",
      ctaLink: "/products",
      bgImage: "/posters/festival-hero-poster.jpg",
    },
    discount: {
      badge: "YEAR-END CLEARANCE EXTRAVAGANZA",
      tagline: "FINAL SALE OF THE YEAR",
      title: "YEAR-END CLEARANCE",
      subtitle: "Flat ₹100 Off with Code on All Last-Minute Gifting Orders",
      description:
        "Make your year-end memorable. Guaranteed express delivery with door-to-door tracking for festive gifting and celebrations.",
      couponCode: "FLAT100",
      couponOffer: "FLAT ₹100 OFF • Code: FLAT100",
      ctaText: "Shop Clearance Now",
      ctaLink: "/products",
      bgImage: "/posters/discount-hero-poster.jpg",
    },
    newArrival: {
      badge: "NEW ARRIVAL • LUXURY CORDUROY LINE",
      tagline: "VINTAGE TEXTURE REDEFINED",
      title: "CASHMERE-TOUCH CORD",
      subtitle: "14-Wale Ultra-Soft Stretch Corduroy in Winter Hues",
      description:
        "The heritage texture updated with modern 4-way stretch and a contemporary slim-straight profile.",
      features: ["14-Wale Cotton Cord", "Cashmere Softness", "Deep Winter Dye"],
      ctaText: "Discover Corduroys",
      ctaLink: "/products?category=everyday-casual",
      bgImage: "/posters/new-arrival-hero-poster.jpg",
    },
  },
];

/**
 * Returns the three dynamic campaign posters (Festival, Discount, New Arrival)
 * for the requested month (or current month if omitted).
 */
export function getMonthlyPosters(monthIndex?: number, activeCouponCode?: string): CampaignPoster[] {
  const currentMonth = typeof monthIndex === "number" ? (monthIndex % 12 + 12) % 12 : new Date().getMonth();
  const config = MONTHLY_CAMPAIGNS[currentMonth] || MONTHLY_CAMPAIGNS[9];
  const couponToUse = activeCouponCode || config.discount.couponCode;

  return [
    // 1. Festival Poster (Dynamic per month)
    {
      id: `festival-${config.monthName.toLowerCase()}`,
      type: "festival",
      tabTitle: "Festive Gala",
      badge: config.festival.badge,
      tagline: config.festival.tagline,
      title: config.festival.title,
      subtitle: config.festival.subtitle,
      description: config.festival.description,
      ctaText: config.festival.ctaText,
      ctaLink: config.festival.ctaLink,
      bgImage: config.festival.bgImage,
      accentBadgeColor: "amber",
    },

    // 2. Discount Poster (Dynamic promotion & coupon)
    {
      id: `discount-${config.monthName.toLowerCase()}`,
      type: "discount",
      tabTitle: "Mega Sale",
      badge: config.discount.badge,
      tagline: config.discount.tagline,
      title: config.discount.title,
      subtitle: config.discount.subtitle,
      description: config.discount.description,
      ctaText: config.discount.ctaText,
      ctaLink: config.discount.ctaLink,
      bgImage: config.discount.bgImage,
      accentBadgeColor: "rose",
      couponCode: couponToUse,
      couponOffer: config.discount.couponOffer,
    },

    // 3. New Arrival Poster (Dynamic seasonal new arrival)
    {
      id: `new-arrival-${config.monthName.toLowerCase()}`,
      type: "new-arrival",
      tabTitle: "New Arrivals",
      badge: config.newArrival.badge,
      tagline: config.newArrival.tagline,
      title: config.newArrival.title,
      subtitle: config.newArrival.subtitle,
      description: config.newArrival.description,
      ctaText: config.newArrival.ctaText,
      ctaLink: config.newArrival.ctaLink,
      bgImage: config.newArrival.bgImage,
      accentBadgeColor: "sky",
      features: config.newArrival.features,
    },
  ];
}
