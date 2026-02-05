// Simple JSON-based product database
// This can be upgraded to a real database later (PostgreSQL, MongoDB, etc.)

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  onSale: boolean;
  category: string;
  images: string[];
  tags: string[];
  inventory: number;
  sku: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: {
    origin?: string;
    gemType?: string;
    cut?: string;
    carat?: number;
    clarity?: string;
    color?: string;
  };
}

// In-memory storage (will persist to JSON file)
let products: Product[] = [];

// Initialize with some sample data if empty
const initializeProducts = () => {
  if (products.length === 0) {
    // Start with empty array - no sample data
    products = [];
  }
};

// CRUD Operations
export const getProducts = (): Product[] => {
  initializeProducts();
  return products.filter(p => !p.isActive === false); // Only return active products by default
};

export const getAllProducts = (): Product[] => {
  initializeProducts();
  return products; // Return all products including inactive ones
};

export const getProductById = (id: string): Product | null => {
  initializeProducts();
  return products.find(p => p.id === id) || null;
};

export const createProduct = (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Product => {
  initializeProducts();

  const newProduct: Product = {
    ...productData,
    id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.push(newProduct);
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Product>): Product | null => {
  initializeProducts();

  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;

  products[index] = {
    ...products[index],
    ...updates,
    id, // Ensure ID doesn't change
    updatedAt: new Date().toISOString(),
  };

  return products[index];
};

export const deleteProduct = (id: string): boolean => {
  initializeProducts();

  const index = products.findIndex(p => p.id === id);
  if (index === -1) return false;

  // Soft delete - just mark as inactive
  products[index].isActive = false;
  products[index].updatedAt = new Date().toISOString();

  return true;
};

export const permanentDeleteProduct = (id: string): boolean => {
  initializeProducts();

  const index = products.findIndex(p => p.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  return true;
};

// Search and filter functions
export const searchProducts = (query: string): Product[] => {
  initializeProducts();

  const lowercaseQuery = query.toLowerCase();
  return products.filter(
    p =>
      p.isActive &&
      (p.name.toLowerCase().includes(lowercaseQuery) ||
        p.description.toLowerCase().includes(lowercaseQuery) ||
        p.category.toLowerCase().includes(lowercaseQuery) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        p.sku.toLowerCase().includes(lowercaseQuery))
  );
};

export const getProductsByCategory = (category: string): Product[] => {
  initializeProducts();
  return products.filter(p => p.isActive && p.category === category);
};

export const getFeaturedProducts = (): Product[] => {
  initializeProducts();
  return products.filter(p => p.isActive && p.featured);
};

export const getProductsOnSale = (): Product[] => {
  initializeProducts();
  return products.filter(p => p.isActive && p.onSale);
};
