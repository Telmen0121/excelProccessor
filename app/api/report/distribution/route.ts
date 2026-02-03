import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Group by city
    const byCity = await prisma.order.groupBy({
      by: ['city'],
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { id: 'desc' } }
    });

    // Group by district
    const byDistrict = await prisma.order.groupBy({
      by: ['district'],
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20
    });

    // Group by payment method
    const byPaymentMethod = await prisma.order.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
      _sum: { totalAmount: true },
      orderBy: { _count: { id: 'desc' } }
    });

    return NextResponse.json({
      byCity: byCity.map((c: typeof byCity[number]) => ({
        city: c.city || 'Unknown',
        orderCount: c._count.id,
        totalAmount: c._sum.totalAmount || 0
      })),
      byDistrict: byDistrict.map((d: typeof byDistrict[number]) => ({
        district: d.district || 'Unknown',
        orderCount: d._count.id,
        totalAmount: d._sum.totalAmount || 0
      })),
      byPaymentMethod: byPaymentMethod.map((p: typeof byPaymentMethod[number]) => ({
        paymentMethod: p.paymentMethod || 'Unknown',
        orderCount: p._count.id,
        totalAmount: p._sum.totalAmount || 0
      }))
    });
  } catch (error) {
    console.error("Customer distribution report error:", error);
    return NextResponse.json({ error: "Failed to generate distribution report" }, { status: 500 });
  }
}
