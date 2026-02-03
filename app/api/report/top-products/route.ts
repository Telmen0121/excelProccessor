import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const items = await prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: limit
    });

    return NextResponse.json({
      products: items.map((item, index) => ({
        rank: index + 1,
        productName: item.productName,
        totalQuantity: item._sum.quantity || 0
      }))
    });
  } catch (error) {
    console.error("Top products report error:", error);
    return NextResponse.json({ error: "Failed to generate top products report" }, { status: 500 });
  }
}
