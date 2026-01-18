export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays } from "date-fns";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) {
      console.error("PAYSTACK_SECRET_KEY not configured");
      return new NextResponse("Secret not found", { status: 500 });
    }

    const body = await req.text();
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");

    if (hash !== req.headers.get("x-paystack-signature")) {
      console.error("Invalid webhook signature");
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const metadata = event.data.metadata || {};
      const { businessId, planId, months, businessType } = metadata;

      // Validate required fields
      if (!businessId || !planId) {
        console.error("Missing required metadata in webhook", { metadata });
        return new NextResponse("Invalid metadata", { status: 400 });
      }

      // Update business status
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { subscriptionEndsAt: true },
      });

      if (!business) {
        console.error("Business not found for webhook", { businessId });
        return new NextResponse("Business not found", { status: 404 });
      }

      const now = new Date();
      // Default to 1 month (30 days) if months missing
      const durationDays = (months || 1) * 30;

      // Calculate new end date: extend existing if valid, otherwise start from now
      const currentExpiry = business?.subscriptionEndsAt
        ? new Date(business.subscriptionEndsAt)
        : now;
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const subscriptionEndsAt = addDays(baseDate, durationDays);

      await prisma.business.update({
        where: { id: businessId },
        data: {
          subscriptionStatus: "ACTIVE",
          planId: planId,
          // Sync business type if provided in metadata (from plan)
          ...(businessType && { type: businessType }),
          subscriptionEndsAt: subscriptionEndsAt,
        },
      });

      console.log("Webhook processed successfully", {
        businessId,
        planId,
        subscriptionEndsAt,
      });
    }

    return new NextResponse("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
