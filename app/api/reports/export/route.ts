export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { Role } from "@/src/generated/enums";
import { format } from "date-fns";

// Helper to convert JSON to CSV
function jsonToCsv(jsonData: any[]): string {
  if (!jsonData || jsonData.length === 0) {
    return "";
  }
  const keys = Object.keys(jsonData[0]);
  const header = keys.join(",") + "\n";
  const rows = jsonData
    .map((row) => {
      return keys
        .map((key) => {
          let cell = row[key] === null || row[key] === undefined ? "" : row[key];
          cell = String(cell).replace(/"/g, '""');
          if (String(cell).includes(",")) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(",");
    })
    .join("\n");

  return header + rows;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== Role.OWNER) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    const businessId = session.user.businessId;

    if (!businessId) {
      return NextResponse.json(
        { message: "Business not found" },
        { status: 404 }
      );
    }
    
    // Fetch Agent Performance data
    const agentPerformance = await prisma.transaction.groupBy({
      by: ["recordedById"],
      where: {
        businessId: businessId,
        ...( (startDate || endDate) && { date: dateFilter }),
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
            amount: 'desc'
        }
      }
    });

    const agentIds = agentPerformance.map((p) => p.recordedById);
    const agents = await prisma.user.findMany({
      where: {
        id: {
          in: agentIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const agentPerformanceData = agentPerformance.map((p) => {
      const agent = agents.find((a) => a.id === p.recordedById);
      return {
        "Agent Name": agent?.name || "Unknown Agent",
        "Transactions": p._count.id,
        "Total Volume": p._sum.amount,
        "Status": "Active", // Placeholder
      };
    });

    const csv = jsonToCsv(agentPerformanceData);
    const date = format(new Date(), "yyyy-MM-dd");
    const filename = `agent_performance_report_${date}.csv`;

    return new NextResponse(csv, {
        status: 200,
        headers: {
            "Content-Disposition": `attachment; filename="${filename}"`, 
            "Content-Type": "text/csv",
        }
    })

  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
