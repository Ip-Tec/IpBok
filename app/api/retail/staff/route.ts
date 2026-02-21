import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated";
import { v4 as uuidv4 } from "uuid";
import { sendStaffInvitationEmail, sendStaffUpgradeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const businessId = session.user.businessId;

  try {
    const memberships = await prisma.membership.findMany({
      where: {
        businessId,
        role: {
          in: ["MANAGER", "CASHIER"] as any
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    const activeStaff = memberships.map(m => ({
      ...m.user,
      status: "Active",
      isInvite: false,
    }));

    // Fetch pending invitations
    const tokens = await prisma.verificationToken.findMany({
      where: {
        identifier: {
          startsWith: "INVITE:"
        }
      }
    });

    const now = new Date();
    const invitations = tokens
      .filter(t => t.identifier.endsWith(`:${businessId}`)) // Ensure it belongs to this business
      .map(t => {
        const [, email, role] = t.identifier.split(":");
        const isExpired = t.expires < now;
        return {
          id: t.token, // Use token as ID for invites
          name: "Processing Signup",
          email,
          role,
          status: isExpired ? "Expired" : "Pending",
          isInvite: true,
          expiresAt: t.expires,
        };
      });

    // Combine and sort (Active first, then Pending, then Expired)
    const combinedStaff = [...activeStaff, ...invitations].sort((a, b) => {
      if (a.status === b.status) return 0;
      if (a.status === "Active") return -1;
      if (b.status === "Active") return 1;
      if (a.status === "Pending") return -1;
      return 1;
    });

    return NextResponse.json(combinedStaff);
  } catch (error) {
    console.error("Error fetching retail staff:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId || session.user.role !== "OWNER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ message: "Email and role are required" }, { status: 400 });
    }

    if (!["MANAGER", "CASHIER"].includes(role)) {
      return NextResponse.json({ message: "Invalid role for retail staff" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
      select: { name: true }
    });

    if (!business) {
      return NextResponse.json({ message: "Business not found" }, { status: 404 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Handle Existing User: Upgrade and Notify
      await prisma.membership.upsert({
        where: {
          userId_businessId: {
            userId: existingUser.id,
            businessId: session.user.businessId
          }
        },
        update: { role: role as Role },
        create: {
          userId: existingUser.id,
          businessId: session.user.businessId,
          role: role as Role,
        }
      });

      // Update user role if it's their primary role (optional logic, but let's keep it simple for now)
      // For Retail, the membership role is what counts.

      try {
        await sendStaffUpgradeEmail(email, business.name, role);
      } catch (e) {
        console.error("Failed to send upgrade email", e);
      }

      return NextResponse.json({ message: "Staff member upgraded successfully" }, { status: 200 });
    } else {
      // Handle New User: Invite
      const token = uuidv4();
      const expires = new Date(Date.now() + 50 * 60 * 1000); // 50 minutes

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        }
      });

      // Store invitation details in a way that signup can consume
      // Since VerificationToken usually just has identifier/token/expires, 
      // we can encode metadata in the identifier or use a custom system.
      // For now, let's use a simple approach: identifier is email:role:businessId
      
      const identifierWithMeta = `INVITE:${email}:${role}:${session.user.businessId}`;
      
      await prisma.verificationToken.update({
        where: { token },
        data: { identifier: identifierWithMeta }
      });

      try {
        const protocol = req.nextUrl.protocol;
        const host = req.headers.get("host");
        const baseUrl = `${protocol}//${host}`;
        await sendStaffInvitationEmail(email, token, business.name, role, baseUrl);
      } catch (e) {
        console.error("Failed to send invitation email", e);
        return NextResponse.json({ message: "Staff noted, but failed to send email. Check configuration." }, { status: 500 });
      }

      return NextResponse.json({ message: "Invitation sent successfully" }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.businessId || session.user.role !== "OWNER") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 });
  }

  try {
    // Basic authorization check: verify the token belongs to this business
    const vToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!vToken || !vToken.identifier.endsWith(`:${session.user.businessId}`)) {
      return NextResponse.json({ message: "Not found or unauthorized" }, { status: 404 });
    }

    await prisma.verificationToken.delete({
      where: { token }
    });

    return NextResponse.json({ message: "Invitation cancelled successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
