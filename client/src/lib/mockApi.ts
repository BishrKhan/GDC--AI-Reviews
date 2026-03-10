/**
 * Mock API utilities for PROD-BOT
 * Simulates product scraping and LLM responses
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  category: string;
  brand: string;
  specs: Record<string, string | number>;
  amazonLink: string;
}

export interface ComparisonResult {
  products: Product[];
  winner: string;
  scores: Record<string, number>;
  insights: string[];
  facts: number;
}

// Mock product database
export const mockProducts: Product[] = [
  {
    id: "prod-1",
    name: "iPhone 15 Pro",
    price: 999,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1592286927505-1def25115558?w=400&h=400&fit=crop",
    category: "Tech",
    brand: "Apple",
    specs: {
      storage: "256GB",
      ram: "8GB",
      display: "6.1 inch",
      battery: "3274 mAh",
      processor: "A17 Pro",
    },
    amazonLink: "https://amazon.com?aff=prodbot&product=iphone15pro",
  },
  {
    id: "prod-2",
    name: "Samsung Galaxy S24",
    price: 899,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=400&h=400&fit=crop",
    category: "Tech",
    brand: "Samsung",
    specs: {
      storage: "256GB",
      ram: "12GB",
      display: "6.2 inch",
      battery: "4000 mAh",
      processor: "Snapdragon 8 Gen 3",
    },
    amazonLink: "https://amazon.com?aff=prodbot&product=galaxys24",
  },
  {
    id: "prod-3",
    name: "Google Pixel 8",
    price: 799,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=400&fit=crop",
    category: "Tech",
    brand: "Google",
    specs: {
      storage: "256GB",
      ram: "12GB",
      display: "6.2 inch",
      battery: "4700 mAh",
      processor: "Tensor G3",
    },
    amazonLink: "https://amazon.com?aff=prodbot&product=pixel8",
  },
  {
    id: "prod-4",
    name: "Sony WH-1000XM5",
    price: 399,
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Gadgets",
    brand: "Sony",
    specs: {
      "noise-cancellation": "Active",
      "battery-life": "30 hours",
      "weight": "250g",
      "driver-size": "40mm",
    },
    amazonLink: "https://amazon.com?aff=prodbot&product=sonywh1000xm5",
  },
  {
    id: "prod-5",
    name: "Apple AirPods Pro",
    price: 249,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop",
    category: "Gadgets",
    brand: "Apple",
    specs: {
      "noise-cancellation": "Active",
      "battery-life": "6 hours",
      "weight": "5.3g",
      "driver-size": "Custom",
    },
    amazonLink: "https://amazon.com?aff=prodbot&product=airpodspro",
  },
  {
    id: "prod-6",
    name: "DJI Mini 3",
    price: 349,
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
    category: "Gadgets",
    brand: "DJI",
    specs: {
      "flight-time": "31 minutes",
      "max-speed": "57.6 km/h",
      "weight": "249g",
      "camera": "4K/30fps",
    },
    amazonLink: "https://amazon.com?aff=prodbot&product=djimini3",
  },
  {
    id: "prod-7",
    name: "Herman Miller Aeron",
    price: 1395,
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=400&fit=crop",
    category: "Furniture",
    brand: "Herman Miller",
    specs: {
      "material": "Mesh",
      "height-range": "16.5-20.5 inches",
      "warranty": "12 years",
      "weight-capacity": "300 lbs",
    },
    amazonLink: "https://amazon.com?aff=prodbot&product=aeronchair",
  },
  {
    id: "prod-8",
    name: "Steelcase Leap",
    price: 1016,
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    category: "Furniture",
    brand: "Steelcase",
    specs: {
      "material": "Mesh",
      "height-range": "17-21 inches",
      "warranty": "12 years",
      "weight-capacity": "300 lbs",
    },
    amazonLink: "https://amazon.com?aff=prodbot&product=steelcaseleap",
  },
];

// Mock categories for interests
export const mockCategories = [
  { id: "tech", name: "Tech", icon: "Smartphone" },
  { id: "beauty", name: "Beauty", icon: "Sparkles" },
  { id: "fragrance", name: "Fragrance", icon: "Wind" },
  { id: "furniture", name: "Furniture", icon: "Sofa" },
  { id: "education", name: "Education", icon: "BookOpen" },
  { id: "hotels", name: "Hotels", icon: "Hotel" },
  { id: "fashion", name: "Fashion", icon: "Shirt" },
  { id: "skincare", name: "Skincare", icon: "Droplet" },
  { id: "gadgets", name: "Gadgets", icon: "Zap" },
  { id: "home", name: "Home", icon: "Home" },
  { id: "fitness", name: "Fitness", icon: "Dumbbell" },
  { id: "travel", name: "Travel", icon: "Plane" },
];

/**
 * Mock API: Scrape products based on query
 */
export async function scrapeProducts(
  query: string,
  category?: string,
  limit: number = 4
): Promise<Product[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filtered = mockProducts;

  if (category) {
    filtered = filtered.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  return filtered.slice(0, limit);
}

/**
 * Mock API: Compare products
 */
export async function compareProducts(
  productIds: string[]
): Promise<ComparisonResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const products = mockProducts.filter((p) => productIds.includes(p.id));

  if (products.length === 0) {
    return {
      products: [],
      winner: "",
      scores: {},
      insights: [],
      facts: 0,
    };
  }

  // Calculate scores based on price and rating
  const scores: Record<string, number> = {};
  let maxScore = 0;
  let winner = "";

  products.forEach((p) => {
    const score = Math.round((p.rating / 5) * 100);
    scores[p.id] = score;
    if (score > maxScore) {
      maxScore = score;
      winner = p.id;
    }
  });

  const insights = [
    `${products.find((p) => p.id === winner)?.name} leads in overall value and performance.`,
    `Price range: $${Math.min(...products.map((p) => p.price))} - $${Math.max(...products.map((p) => p.price))}`,
    `Average rating: ${(products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)}/5`,
  ];

  return {
    products,
    winner,
    scores,
    insights,
    facts: products.length * 44, // Mock fact count
  };
}

/**
 * Mock API: LLM chat response
 */
export async function getLLMResponse(
  message: string,
  context?: { selectedProducts?: string[]; interests?: string[] }
): Promise<string> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const lowerMessage = message.toLowerCase();

  // Simple intent detection
  if (
    lowerMessage.includes("compare") ||
    lowerMessage.includes("versus") ||
    lowerMessage.includes("vs")
  ) {
    return "I'd be happy to help you compare products! You can select items from the grid above or ask me to compare specific products. Just tell me which ones you'd like to see side-by-side.";
  }

  if (
    lowerMessage.includes("recommend") ||
    lowerMessage.includes("suggest") ||
    lowerMessage.includes("best")
  ) {
    return "Based on your interests, I'd recommend checking out our top-rated products in the grid above. Each one has been carefully selected for quality and value. Would you like me to compare any specific items?";
  }

  if (lowerMessage.includes("price") || lowerMessage.includes("cost")) {
    return "I can help you find products within your budget. Our current selection ranges from affordable options to premium choices. Let me know your price range and I'll filter the best options for you.";
  }

  if (lowerMessage.includes("feature") || lowerMessage.includes("spec")) {
    return "Each product has detailed specifications available. I can help you understand the key features and how they compare. What specific features are most important to you?";
  }

  // Default response
  return "I'm here to help you find and compare products! You can ask me about specific items, request comparisons, or let me know what you're looking for. What would you like to explore?";
}

/**
 * Mock API: Get trending products
 */
export async function getTrendingProducts(limit: number = 4): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return mockProducts.slice(0, limit);
}

/**
 * Mock API: Search products by category
 */
export async function getProductsByCategory(
  category: string,
  limit: number = 4
): Promise<Product[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockProducts
    .filter((p) => p.category.toLowerCase() === category.toLowerCase())
    .slice(0, limit);
}
