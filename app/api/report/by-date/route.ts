import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface OrderWithItems {
  totalAmount: number | null;
  deliveryFee: number | null;
}

export async function POST(req: NextRequest) {
  try {
    const { start, end } = await req.json();

    if (!start || !end) {
      return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Set end date to end of day
    endDate.setHours(23, 59, 59, 999);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate summary for the date range
    const summary = {
      totalOrders: orders.length,
      totalSales: orders.reduce((sum: number, o: OrderWithItems) => sum + (o.totalAmount || 0), 0),
      totalDeliveryFees: orders.reduce((sum: number, o: OrderWithItems) => sum + (o.deliveryFee || 0), 0),
      avgOrderValue: orders.length > 0 
        ? orders.reduce((sum: number, o: OrderWithItems) => sum + (o.totalAmount || 0), 0) / orders.length 
        : 0
    };

    return NextResponse.json({
      orders,
      summary,
      dateRange: { start: startDate, end: endDate }
    });
  } catch (error) {
    console.error("Orders by date report error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
