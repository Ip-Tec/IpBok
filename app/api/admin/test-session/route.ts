import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  return NextResponse.json({
    hasSession: !!session,
    user: session?.user || null,
    role: session?.user?.role || null,
    authOptionsDefined: !!authOptions,
    timestamp: new Date().toISOString(),
  });
}
