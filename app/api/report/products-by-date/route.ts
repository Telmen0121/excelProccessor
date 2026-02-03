import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { start, end } = await req.json();

    if (!start || !end) {
      return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    // Get all order items within the date range with order details
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        order: {
          select: {
            code: true,
            createdAt: true,
            status: true,
            customer: true,
            totalAmount: true,
          },
        },
        product: {
          select: {
            price: true,
            salePrice: true,
            categories: true,
          },
        },
      },
      orderBy: {
        order: {
          createdAt: "desc",
        },
      },
    });

    // Get all unique product names to fetch their prices
    const productNamesSet = new Set<string>();
    orderItems.forEach(item => productNamesSet.add(item.productName));
    const uniqueProductNames = Array.from(productNamesSet);
    
    // Fetch products by name to get prices for items without linked product
    const products = await prisma.product.findMany({
      where: {
        name: { in: uniqueProductNames }
      },
      select: {
        name: true,
        price: true,
        salePrice: true,
        categories: true,
      }
    });
    
    // Create a map for quick lookup
    const productMap = new Map(products.map(p => [p.name, p]));

    // Also get aggregated data by product
    const aggregatedByProduct = await prisma.orderItem.groupBy({
      by: ["productName"],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
    });

    return NextResponse.json({
      // Detailed list of all sold items
      items: orderItems.map((item) => {
        // Try to get product info from linked product or from productMap
        const linkedProduct = item.product;
        const mappedProduct = productMap.get(item.productName);
        const productInfo = linkedProduct || mappedProduct;
        
        return {
          orderCode: item.order.code,
          orderDate: item.order.createdAt,
          orderStatus: item.order.status,
          customer: item.order.customer,
          productName: item.productName,
          quantity: item.quantity,
          price: productInfo?.salePrice || productInfo?.price || null,
          categories: productInfo?.categories || null,
        };
      }),
      // Aggregated summary by product
      summary: aggregatedByProduct.map((item, index) => {
        const productInfo = productMap.get(item.productName);
        return {
          rank: index + 1,
          productName: item.productName,
          totalQuantity: item._sum.quantity || 0,
          orderCount: item._count.id,
          price: productInfo?.salePrice || productInfo?.price || null,
        };
      }),
      totalItems: orderItems.length,
      uniqueProducts: aggregatedByProduct.length,
    });
  } catch (error) {
    console.error("Products by date report error:", error);
    return NextResponse.json(
      { error: "Failed to generate products report" },
      { status: 500 }
    );
  }
}
