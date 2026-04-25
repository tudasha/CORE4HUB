import { Category, OrderStatus, Role } from "@prisma/client";

export type { Category, OrderStatus, Role };

export interface ProductWithCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  category: Category;
  stock: number;
  tags: string[];
  featured: boolean;
  createdAt: Date;
}

export interface CartItemWithProduct {
  id: string;
  quantity: number;
  userId: string;
  productId: string;
  product: ProductWithCategory;
}

export interface OrderWithItems {
  id: string;
  status: OrderStatus;
  total: number;
  userId: string;
  address: string | null;
  createdAt: Date;
  items: OrderItemWithProduct[];
}

export interface OrderItemWithProduct {
  id: string;
  quantity: number;
  price: number;
  orderId: string;
  productId: string;
  product: ProductWithCategory;
}

export interface AIRecommendation {
  packageName: string;
  description: string;
  products: ProductWithCategory[];
  totalPrice: number;
}

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}
