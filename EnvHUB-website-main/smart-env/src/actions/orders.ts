"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const CheckoutSchema = z.object({
  address: z.string().min(10, "Please enter a valid shipping address"),
});

export async function checkoutAction(
  _: ActionResult<{ orderId: string }> | null,
  formData: FormData
): Promise<ActionResult<{ orderId: string }>> {
  const session = await auth();
  const userIdStr = session?.user?.id;
  if (!userIdStr) return { success: false, error: "Please log in to checkout" };
  const userId = parseInt(userIdStr, 10);

  const parsed = CheckoutSchema.safeParse({ address: formData.get("address") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          status: "DELIVERED",
          address: parsed.data.address,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });

      await tx.cartItem.deleteMany({ where: { userId } });

      const currentUser = await tx.user.findUnique({ where: { id: userId } });
      const currentModules = Array.isArray(currentUser?.modules) ? currentUser.modules as string[] : [];
      const newModules = new Set(currentModules);

      cartItems.forEach(item => {
        const tags = item.product.tags || [];
        if (tags.some(t => ['weather', 'climate', 'temperature', 'humidity'].includes(t))) newModules.add('weather');
        if (tags.some(t => ['energy', 'power'].includes(t))) newModules.add('energy');
        if (tags.some(t => ['health', 'fitness', 'heart'].includes(t))) newModules.add('health');
        if (tags.some(t => ['security', 'motion', 'door', 'camera', 'safe'].includes(t))) newModules.add('security');
        if (tags.some(t => ['water', 'leak', 'flood'].includes(t))) newModules.add('water');
        if (tags.some(t => ['solar'].includes(t))) newModules.add('solar');
      });

      await tx.user.update({
        where: { id: userId },
        data: { modules: Array.from(newModules) }
      });

      return newOrder;
    });

    revalidatePath("/cart");
    revalidatePath("/dashboard");

    return { success: true, data: { orderId: order.id } };
  } catch (error) {
    console.error("checkoutAction Error:", error);
    return { success: false, error: "Database connection not established. Please check your .env file." };
  }


}

export async function getOrders() {
  const session = await auth();
  const userIdStr = session?.user?.id;
  if (!userIdStr) return [];
  const userId = parseInt(userIdStr, 10);

  try {
    return await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getOrders Error:", error);
    return [];
  }
}
