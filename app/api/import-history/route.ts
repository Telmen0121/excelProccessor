import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const fileType = searchParams.get("fileType") || "";

    const where = fileType ? { fileType } : {};

    const [history, total] = await Promise.all([
      prisma.importHistory.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.importHistory.count({ where }),
    ]);

    return NextResponse.json({
      history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch import history:", error);
    return NextResponse.json(
      { error: "Failed to fetch import history" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      await prisma.importHistory.delete({
        where: { id: parseInt(id) },
      });
      return NextResponse.json({ message: "Import history deleted" });
    }

    // Delete all if no id provided
    await prisma.importHistory.deleteMany();
    return NextResponse.json({ message: "All import history deleted" });
  } catch (error) {
    console.error("Failed to delete import history:", error);
    return NextResponse.json(
      { error: "Failed to delete import history" },
      { status: 500 }
    );
  }
}
