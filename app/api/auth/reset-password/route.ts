// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { token, newPassword } = await request.json();
  if (!token || !newPassword) {
    return NextResponse.json(
      { error: "Token and new password are required" },
      { status: 400 },
    );
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 },
    );
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email: record.identifier },
    data: { password: hashed },
  });

  // Delete used token
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json(
    { message: "Password has been reset" },
    { status: 200 },
  );
}
