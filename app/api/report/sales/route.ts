import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const totalSales = await prisma.order.aggregate({
      _sum: { totalAmount: true }
    });

    const deliveryFees = await prisma.order.aggregate({
      _sum: { deliveryFee: true }
    });

    const orderCount = await prisma.order.count();

    const avgOrderValue = await prisma.order.aggregate({
      _avg: { totalAmount: true }
    });

    // Get orders by status
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalAmount: true }
    });

    // Get recent orders count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentOrderCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    return NextResponse.json({
      totalSales: totalSales._sum.totalAmount || 0,
      deliveryFees: deliveryFees._sum.deliveryFee || 0,
      orderCount,
      avgOrderValue: avgOrderValue._avg.totalAmount || 0,
      recentOrderCount,
      ordersByStatus: ordersByStatus.map((s: typeof ordersByStatus[number]) => ({
        status: s.status || 'Unknown',
        count: s._count.id,
        total: s._sum.totalAmount || 0
      }))
    });
  } catch (error) {
    console.error("Sales report error:", error);
    return NextResponse.json({ error: "Failed to generate sales report" }, { status: 500 });
  }
}
