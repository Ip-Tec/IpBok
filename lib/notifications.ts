import { prisma } from "@/lib/prisma";

export async function createNotification(userId: string, message: string, link?: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        message,
        link,
        isRead: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
