"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

async function getUserId(): Promise<number | null> {
  const session = await auth();
  return session?.user?.id ? parseInt(session.user.id, 10) : null;
}

export async function addToCart(
  productId: string,
  quantity: number = 1
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Please log in to add items to cart" };

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { success: false, error: "Product not found" };
    if (product.stock < quantity) return { success: false, error: "Out of stock" };

    await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, quantity },
    });

    revalidatePath("/cart");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("addToCart Error:", error);
    return { success: false, error: "Database connection not established. Please check your .env file." };
  }
}

export async function removeFromCart(productId: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    await prisma.cartItem.deleteMany({
      where: { userId, productId },
    });

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("removeFromCart Error:", error);
    return { success: false, error: "Database connection not established. Please check your .env file." };
  }
}

export async function updateCartQuantity(
  productId: string,
  quantity: number
): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({ where: { userId, productId } });
    } else {
      await prisma.cartItem.update({
        where: { userId_productId: { userId, productId } },
        data: { quantity },
      });
    }

    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    console.error("updateCartQuantity Error:", error);
    return { success: false, error: "Database connection not established. Please check your .env file." };
  }
}

export async function getCartItems() {
  const userId = await getUserId();
  if (!userId) return [];

  try {
    return await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { product: { name: "asc" } },
    });
  } catch (error) {
    console.error("getCartItems Error:", error);
    return [];
  }
}

export async function getCartCount(): Promise<number> {
  const userId = await getUserId();
  if (!userId) return 0;

  try {
    const result = await prisma.cartItem.aggregate({
      where: { userId },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  } catch (error) {
    console.error("getCartCount Error:", error);
    return 0;
  }
}
