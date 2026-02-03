import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { detectFileType } from "@/lib/detectFileType";
import { parseOrderProducts } from "@/lib/parseOrderProducts";
import { parseFloatSafe, parseIntSafe, parseDateSafe, getStringOrNull } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json({ error: "File must be an Excel file (.xlsx or .xls)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];

    if (json.length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const headers = Object.keys(json[0]);
    const type = detectFileType(headers);

    if (type === "orders") {
      return await handleOrders(json);
    }

    if (type === "products") {
      return await handleProducts(json);
    }

    return NextResponse.json({ 
      error: "Unknown file format. Please check column headers.",
      expectedHeaders: {
        orders: ["Код", "Бараанууд", "Төлөв", "Т.Х", "Харилцагч", "..."],
        products: ["Нэр", "Ангилалууд", "Үнэ", "..."]
      }
    }, { status: 400 });
    
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ 
      error: "Failed to process file", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

async function handleOrders(json: Record<string, unknown>[]) {
  let imported = 0;
  let skipped = 0;
  let duplicatesInFile = 0;
  let duplicatesInDb = 0;
  const errors: string[] = [];
  const seenCodes = new Set<string>();

  for (const row of json) {
    try {
      const code = getStringOrNull(row["Код"]);
      
      if (!code) {
        skipped++;
        continue;
      }

      // Check for duplicate within the file
      if (seenCodes.has(code)) {
        duplicatesInFile++;
        errors.push(`Давхардсан код файл дотор: ${code}`);
        continue;
      }
      seenCodes.add(code);

      // Check for duplicate in database
      const existing = await prisma.order.findUnique({
        where: { code }
      });

      if (existing) {
        duplicatesInDb++;
        continue;
      }

      const order = await prisma.order.create({
        data: {
          code,
          status: getStringOrNull(row["Төлөв"]),
          paymentMethod: getStringOrNull(row["Т.Х"]),
          customer: getStringOrNull(row["Харилцагч"]),
          phone: getStringOrNull(row["Утас"]),
          addressDetail: getStringOrNull(row["Дэлгэрэнгүй хаяг"]),
          email: getStringOrNull(row["И-мэйл"]),
          city: getStringOrNull(row["Хот/аймаг"]),
          district: getStringOrNull(row["Сум/дүүрэг"]),
          khoroo: getStringOrNull(row["Хороо/баг"]),
          deliveryFee: parseFloatSafe(row["Хүргэлтийн үнэ"]) ?? 0,
          totalAmount: parseFloatSafe(row["Нийт дүн"]) ?? 0,
          couponCode: getStringOrNull(row["Купон код"]),
          couponPercent: parseFloatSafe(row["Купон хувь"]) ?? 0,
          note: getStringOrNull(row["Нэмэлт тайлбар"]),
          productsRaw: getStringOrNull(row["Бараанууд"]),
          createdAt: parseDateSafe(row["Огноо"])
        }
      });

      // Parse and create order items
      const rawProducts = getStringOrNull(row["Бараанууд"]) || "";
      const parsedProducts = parseOrderProducts(rawProducts);

      for (const item of parsedProducts) {
        const product = await prisma.product.findUnique({
          where: { name: item.name }
        });

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: product?.id || null,
            productName: item.name,
            quantity: item.quantity
          }
        });
      }

      imported++;
    } catch (err) {
      console.error("Error processing order row:", err);
      errors.push(`Row with code ${row["Код"]}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      skipped++;
    }
  }

  return NextResponse.json({
    message: "Orders uploaded successfully",
    type: "orders",
    imported,
    skipped,
    duplicatesInFile,
    duplicatesInDb,
    total: json.length,
    errors: errors.length > 0 ? errors.slice(0, 20) : undefined
  });
}

async function handleProducts(json: Record<string, unknown>[]) {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let duplicatesInFile = 0;
  const errors: string[] = [];
  const seenNames = new Set<string>();

  for (const row of json) {
    try {
      const name = getStringOrNull(row["Нэр"]);
      
      if (!name) {
        skipped++;
        continue;
      }

      // Check for duplicate within the file
      if (seenNames.has(name)) {
        duplicatesInFile++;
        errors.push(`Давхардсан нэр файл дотор: ${name}`);
        continue;
      }
      seenNames.add(name);

      const existing = await prisma.product.findUnique({
        where: { name }
      });

      if (existing) {
        // Update existing product
        await prisma.product.update({
          where: { name },
          data: {
            price: parseFloatSafe(row["Үнэ"]),
            salePrice: parseFloatSafe(row["Хямдралтай үнэ"]),
            categories: getStringOrNull(row["Ангилалууд"]),
            stock: parseIntSafe(row["Үлдэглэл"])
          }
        });
        updated++;
      } else {
        // Create new product
        await prisma.product.create({
          data: {
            name,
            price: parseFloatSafe(row["Үнэ"]),
            salePrice: parseFloatSafe(row["Хямдралтай үнэ"]),
            categories: getStringOrNull(row["Ангилалууд"]),
            stock: parseIntSafe(row["Үлдэглэл"])
          }
        });
        imported++;
      }
    } catch (err) {
      console.error("Error processing product row:", err);
      errors.push(`Product ${row["Нэр"]}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      skipped++;
    }
  }

  return NextResponse.json({
    message: "Products uploaded successfully",
    type: "products",
    imported,
    updated,
    skipped,
    duplicatesInFile,
    total: json.length,
    errors: errors.length > 0 ? errors.slice(0, 20) : undefined
  });
}
