// app/api/auth/forgot-password/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.emailVerified) {
    return NextResponse.json(
      { error: "Email not found or not verified. Please contact support." },
      { status: 400 },
    );
  }

  const token = uuidv4();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host");
  const baseUrl = `${protocol}://${host}`;

  await sendPasswordResetEmail(email, token, baseUrl);

  return NextResponse.json(
    { message: "Password reset email sent" },
    { status: 200 },
  );
}
