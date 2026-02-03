"use client";

import { useState, useEffect, ReactNode } from "react";
import * as XLSX from "xlsx";
import SummaryCards from "./SummaryCards";
import DateFilter from "./DateFilter";
import StatusChart from "./StatusChart";
import DistributionChart from "./DistributionChart";
import TopProductsTable from "./TopProductsTable";
import DistributionTable from "./DistributionTable";
import {
  ChartBarIcon,
  CurrencyIcon,
  CubeIcon,
  UsersIcon,
  LocationIcon,
  CalendarIcon,
  ListIcon,
  TrophyIcon,
  BuildingIcon,
  CreditCardIcon,
  TagIcon,
} from "../Icons";

interface SalesData {
  totalSales: number;
  deliveryFees: number;
  orderCount: number;
  avgOrderValue: number;
  recentOrderCount: number;
  ordersByStatus: Array<{
    status: string;
    count: number;
    total: number;
  }>;
}

interface TopProduct {
  rank: number;
  productName: string;
  totalQuantity: number;
}

interface DistributionData {
  byCity: Array<{ city: string; orderCount: number; totalAmount: number }>;
  byDistrict: Array<{ district: string; orderCount: number; totalAmount: number }>;
  byPaymentMethod: Array<{ paymentMethod: string; orderCount: number; totalAmount: number }>;
}

type ViewMode = "overview" | "sales" | "products" | "customers" | "locations";

export default function ReportsClient() {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [distribution, setDistribution] = useState<DistributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [showExportModal, setShowExportModal] = useState(false);

  // Export options state
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "xls" | "csv">("xlsx");
  const [exportOptions, setExportOptions] = useState({
    summary: true,
    status: true,
    topProducts: true,
    byCity: true,
    byDistrict: true,
    byPayment: true,
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Date filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredSummary, setFilteredSummary] = useState<{
    totalOrders: number;
    totalSales: number;
    totalDeliveryFees: number;
    avgOrderValue: number;
  } | null>(null);

  const viewModes: Array<{ id: ViewMode; label: string; icon: ReactNode; description: string }> = [
    { id: "overview", label: "Ерөнхий", icon: <ChartBarIcon className="w-5 h-5" />, description: "Бүх үзүүлэлтүүд" },
    { id: "sales", label: "Борлуулалт", icon: <CurrencyIcon className="w-5 h-5" />, description: "Орлого & захиалга" },
    { id: "products", label: "Бүтээгдэхүүн", icon: <CubeIcon className="w-5 h-5" />, description: "Их зарагдсан бараа" },
    { id: "customers", label: "Харилцагч", icon: <UsersIcon className="w-5 h-5" />, description: "Төлбөрийн мэдээлэл" },
    { id: "locations", label: "Байршил", icon: <LocationIcon className="w-5 h-5" />, description: "Газарзүйн тархалт" },
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [salesRes, productsRes, distRes] = await Promise.all([
          fetch("/api/report/sales"),
          fetch("/api/report/top-products?limit=10"),
          fetch("/api/report/distribution"),
        ]);

        const salesJson = await salesRes.json();
        const productsJson = await productsRes.json();
        const distJson = await distRes.json();

        setSalesData(salesJson);
        setTopProducts(productsJson.products || []);
        setDistribution(distJson);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    }

    // Set default date range (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);

    fetchData();
  }, []);

  function openExportModal() {
    // Set default export dates to current filter dates
    setExportStartDate(startDate);
    setExportEndDate(endDate);
    setShowExportModal(true);
  }

  async function handleExport() {
    setExportLoading(true);
    
    try {
      // Fetch data for the selected date range
      const [salesRes, productsRes, distRes, dateRes, productsByDateRes] = await Promise.all([
        fetch("/api/report/sales"),
        fetch("/api/report/top-products?limit=20"),
        fetch("/api/report/distribution"),
        fetch("/api/report/by-date", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start: exportStartDate, end: exportEndDate }),
        }),
        fetch("/api/report/products-by-date", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start: exportStartDate, end: exportEndDate }),
        }),
      ]);

      const salesJson = await salesRes.json();
      const productsJson = await productsRes.json();
      const distJson = await distRes.json();
      const dateJson = await dateRes.json();
      const productsByDateJson = await productsByDateRes.json();

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Summary with date range
      if (exportOptions.summary) {
        const summaryData = [
          { "Үзүүлэлт": "Тайлангийн хугацаа", "Утга": `${exportStartDate} - ${exportEndDate}` },
          { "Үзүүлэлт": "", "Утга": "" },
          { "Үзүүлэлт": "--- Сонгосон хугацаанд ---", "Утга": "" },
          { "Үзүүлэлт": "Захиалгын тоо", "Утга": dateJson.summary?.totalOrders || 0 },
          { "Үзүүлэлт": "Борлуулалт", "Утга": `₮${(dateJson.summary?.totalSales || 0).toLocaleString()}` },
          { "Үзүүлэлт": "Хүргэлтийн төлбөр", "Утга": `₮${(dateJson.summary?.totalDeliveryFees || 0).toLocaleString()}` },
          { "Үзүүлэлт": "Дундаж захиалга", "Утга": `₮${Math.round(dateJson.summary?.avgOrderValue || 0).toLocaleString()}` },
          { "Үзүүлэлт": "Зарагдсан бараа (төрөл)", "Утга": productsByDateJson.uniqueProducts || 0 },
          { "Үзүүлэлт": "Зарагдсан бараа (нийт)", "Утга": productsByDateJson.totalItems || 0 },
          { "Үзүүлэлт": "", "Утга": "" },
          { "Үзүүлэлт": "--- Нийт ---", "Утга": "" },
          { "Үзүүлэлт": "Нийт борлуулалт", "Утга": `₮${(salesJson.totalSales || 0).toLocaleString()}` },
          { "Үзүүлэлт": "Нийт захиалга", "Утга": salesJson.orderCount || 0 },
          { "Үзүүлэлт": "Дундаж захиалга", "Утга": `₮${Math.round(salesJson.avgOrderValue || 0).toLocaleString()}` },
          { "Үзүүлэлт": "Нийт хүргэлтийн төлбөр", "Утга": `₮${(salesJson.deliveryFees || 0).toLocaleString()}` },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        summarySheet["!cols"] = [{ wch: 30 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Ерөнхий");
      }

      // Sheet 2: Orders by Status
      if (exportOptions.status && salesJson.ordersByStatus) {
        const statusData = salesJson.ordersByStatus.map((item: { status: string; count: number; total: number }) => ({
          "Төлөв": item.status || "Тодорхойгүй",
          "Захиалгын тоо": item.count,
          "Нийт дүн": `₮${item.total.toLocaleString()}`,
        }));
        const statusSheet = XLSX.utils.json_to_sheet(statusData);
        statusSheet["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, statusSheet, "Төлөв");
      }

      // Sheet 3: All Sold Products Summary (aggregated by product)
      if (exportOptions.topProducts && productsByDateJson.summary?.length > 0) {
        const productsSummaryData = productsByDateJson.summary.map((item: { rank: number; productName: string; totalQuantity: number; orderCount: number; price: number | null }) => ({
          "№": item.rank,
          "Бүтээгдэхүүн": item.productName,
          "Үнэ": item.price ? `₮${item.price.toLocaleString()}` : "-",
          "Зарагдсан тоо": item.totalQuantity,
          "Захиалгын тоо": item.orderCount,
          "Нийт дүн": item.price ? `₮${(item.price * item.totalQuantity).toLocaleString()}` : "-",
        }));
        const productsSummarySheet = XLSX.utils.json_to_sheet(productsSummaryData);
        productsSummarySheet["!cols"] = [{ wch: 6 }, { wch: 50 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(workbook, productsSummarySheet, "Бараа (нэгтгэсэн)");
      }

      // Sheet 4: All Sold Products Detail (each sale)
      if (exportOptions.topProducts && productsByDateJson.items?.length > 0) {
        const productsDetailData = productsByDateJson.items.map((item: { orderCode: string; orderDate: string; orderStatus: string; customer: string; productName: string; quantity: number; price: number | null; categories: string | null }) => ({
          "Захиалгын код": item.orderCode,
          "Огноо": new Date(item.orderDate).toLocaleDateString("mn-MN"),
          "Төлөв": item.orderStatus || "-",
          "Харилцагч": item.customer || "-",
          "Бүтээгдэхүүн": item.productName,
          "Тоо ширхэг": item.quantity || 1,
          "Үнэ": item.price ? `₮${item.price.toLocaleString()}` : "-",
          "Ангилал": item.categories || "-",
        }));
        const productsDetailSheet = XLSX.utils.json_to_sheet(productsDetailData);
        productsDetailSheet["!cols"] = [
          { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, 
          { wch: 45 }, { wch: 12 }, { wch: 15 }, { wch: 25 }
        ];
        XLSX.utils.book_append_sheet(workbook, productsDetailSheet, "Бараа (дэлгэрэнгүй)");
      }

      // Sheet 5: By City
      if (exportOptions.byCity && distJson.byCity) {
        const cityData = distJson.byCity.map((item: { city: string; orderCount: number; totalAmount: number }) => ({
          "Хот/Аймаг": item.city || "Тодорхойгүй",
          "Захиалгын тоо": item.orderCount,
          "Нийт дүн": `₮${item.totalAmount.toLocaleString()}`,
        }));
        const citySheet = XLSX.utils.json_to_sheet(cityData);
        citySheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, citySheet, "Хотоор");
      }

      // Sheet 5: By District
      if (exportOptions.byDistrict && distJson.byDistrict) {
        const districtData = distJson.byDistrict.map((item: { district: string; orderCount: number; totalAmount: number }) => ({
          "Дүүрэг/Сум": item.district || "Тодорхойгүй",
          "Захиалгын тоо": item.orderCount,
          "Нийт дүн": `₮${item.totalAmount.toLocaleString()}`,
        }));
        const districtSheet = XLSX.utils.json_to_sheet(districtData);
        districtSheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, districtSheet, "Дүүргээр");
      }

      // Sheet 6: By Payment Method
      if (exportOptions.byPayment && distJson.byPaymentMethod) {
        const paymentData = distJson.byPaymentMethod.map((item: { paymentMethod: string; orderCount: number; totalAmount: number }) => ({
          "Төлбөрийн хэлбэр": item.paymentMethod || "Тодорхойгүй",
          "Захиалгын тоо": item.orderCount,
          "Нийт дүн": `₮${item.totalAmount.toLocaleString()}`,
        }));
        const paymentSheet = XLSX.utils.json_to_sheet(paymentData);
        paymentSheet["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, paymentSheet, "Төлбөр");
      }

      const filename = `Тайлан_${exportStartDate}_${exportEndDate}`;

      if (exportFormat === "csv") {
        XLSX.writeFile(workbook, `${filename}.csv`, { bookType: "csv", sheet: "Ерөнхий" });
      } else if (exportFormat === "xls") {
        XLSX.writeFile(workbook, `${filename}.xls`, { bookType: "biff8" });
      } else {
        XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: "xlsx" });
      }

      setShowExportModal(false);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Экспорт амжилтгүй боллоо");
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDateFilter(start?: string, end?: string) {
    const effectiveStart = start || startDate;
    const effectiveEnd = end || endDate;
    
    if (!effectiveStart || !effectiveEnd) return;

    setFilterLoading(true);
    try {
      const res = await fetch("/api/report/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: effectiveStart, end: effectiveEnd }),
      });
      const data = await res.json();
      setFilteredSummary(data.summary);
    } catch (error) {
      console.error("Failed to fetch filtered data:", error);
    } finally {
      setFilterLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-gray-500">Тайлан уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 transition-opacity ${filterLoading ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Тайлангийн самбар
          </h1>
          <p className="text-gray-600 mt-1">
            Борлуулалтын шинжилгээ болон гүйцэтгэлийн үзүүлэлтүүд
          </p>
        </div>
        <button
          onClick={openExportModal}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Экспорт
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Тайлан экспортлох
                </h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Date Range */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <CalendarIcon className="w-4 h-4" />
                  Хугацаа сонгох
                </label>
                
                {/* Quick Date Selection Buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { label: "Өнөөдөр", days: 0 },
                    { label: "Өчигдөр", days: 1, single: true },
                    { label: "7 хоног", days: 7 },
                    { label: "14 хоног", days: 14 },
                    { label: "30 хоног", days: 30 },
                    { label: "Энэ сар", type: "thisMonth" },
                    { label: "Өмнөх сар", type: "lastMonth" },
                    { label: "Энэ жил", type: "thisYear" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        let start: Date, end: Date;
                        
                        if (preset.type === "thisMonth") {
                          start = new Date(today.getFullYear(), today.getMonth(), 1);
                          end = today;
                        } else if (preset.type === "lastMonth") {
                          start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                          end = new Date(today.getFullYear(), today.getMonth(), 0);
                        } else if (preset.type === "thisYear") {
                          start = new Date(today.getFullYear(), 0, 1);
                          end = today;
                        } else if (preset.single) {
                          start = new Date(today);
                          start.setDate(start.getDate() - preset.days!);
                          end = new Date(start);
                        } else {
                          start = new Date(today);
                          start.setDate(start.getDate() - preset.days!);
                          end = today;
                        }
                        
                        setExportStartDate(start.toISOString().split("T")[0]);
                        setExportEndDate(end.toISOString().split("T")[0]);
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Эхлэх огноо</label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Дуусах огноо</label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Data to Include */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <ListIcon className="w-4 h-4" />
                  Оруулах мэдээлэл
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "summary", label: "Ерөнхий мэдээлэл", Icon: ChartBarIcon },
                    { key: "status", label: "Төлвөөр", Icon: TagIcon },
                    { key: "topProducts", label: "Зарагдсан бараа", Icon: TrophyIcon },
                    { key: "byCity", label: "Хотоор", Icon: BuildingIcon },
                    { key: "byDistrict", label: "Дүүргээр", Icon: LocationIcon },
                    { key: "byPayment", label: "Төлбөрийн хэлбэр", Icon: CreditCardIcon },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                        exportOptions[item.key as keyof typeof exportOptions]
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={exportOptions[item.key as keyof typeof exportOptions]}
                        onChange={(e) =>
                          setExportOptions({ ...exportOptions, [item.key]: e.target.checked })
                        }
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="flex items-center gap-1.5 text-sm">
                        <item.Icon className="w-4 h-4 text-gray-500" />
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* File Format */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  Файлын формат
                </label>
                <div className="flex gap-3">
                  {[
                    { value: "xlsx", label: "Excel (.xlsx)", desc: "Шинэ формат" },
                    { value: "xls", label: "Excel (.xls)", desc: "Хуучин формат" },
                    { value: "csv", label: "CSV (.csv)", desc: "Текст формат" },
                  ].map((format) => (
                    <label
                      key={format.value}
                      className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all text-center ${
                        exportFormat === format.value
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.value}
                        checked={exportFormat === format.value}
                        onChange={(e) => setExportFormat(e.target.value as "xlsx" | "xls" | "csv")}
                        className="sr-only"
                      />
                      <div className="text-sm font-medium">{format.label}</div>
                      <div className="text-xs text-gray-500">{format.desc}</div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Цуцлах
              </button>
              <button
                onClick={handleExport}
                disabled={exportLoading || !Object.values(exportOptions).some(v => v)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {exportLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Татаж байна...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Татах
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick View Preset Buttons */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700">Түргэн харах:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === mode.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200:bg-gray-600"
              }`}
            >
              <span className="text-lg">{mode.icon}</span>
              <div className="text-left">
                <div>{mode.label}</div>
                <div className={`text-xs ${viewMode === mode.id ? "text-blue-100" : "text-gray-500"}`}>
                  {mode.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Date Filter */}
      <DateFilter
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={handleDateFilter}
        loading={filterLoading}
      />

      {/* Filtered Summary (if available) */}
      {filteredSummary && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Шүүсэн үр дүн ({startDate} - {endDate})
            </p>
            <button
              onClick={() => setFilteredSummary(null)}
              className="text-blue-600 hover:text-blue-800:text-blue-200 text-sm"
            >
              Шүүлтүүр арилгах
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-blue-600">Захиалга</p>
              <p className="text-lg font-bold text-blue-900">
                {filteredSummary.totalOrders.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Борлуулалт</p>
              <p className="text-lg font-bold text-blue-900">
                ₮{filteredSummary.totalSales.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Хүргэлтийн төлбөр</p>
              <p className="text-lg font-bold text-blue-900">
                ₮{filteredSummary.totalDeliveryFees.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Дундаж захиалга</p>
              <p className="text-lg font-bold text-blue-900">
                ₮{Math.round(filteredSummary.avgOrderValue).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards - Show for overview and sales views */}
      {(viewMode === "overview" || viewMode === "sales") && salesData && (
        <SummaryCards
          totalSales={salesData.totalSales}
          orderCount={salesData.orderCount}
          avgOrderValue={salesData.avgOrderValue}
          deliveryFees={salesData.deliveryFees}
          recentOrderCount={salesData.recentOrderCount}
        />
      )}

      {/* OVERVIEW VIEW */}
      {viewMode === "overview" && (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {salesData && salesData.ordersByStatus.length > 0 && (
              <StatusChart data={salesData.ordersByStatus} />
            )}
            {distribution && distribution.byPaymentMethod.length > 0 && (
              <DistributionChart
                title="Төлбөрийн хэлбэрээр"
                data={distribution.byPaymentMethod.map((p) => ({
                  name: p.paymentMethod,
                  orderCount: p.orderCount,
                  totalAmount: p.totalAmount,
                }))}
              />
            )}
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopProductsTable products={topProducts} />
            {distribution && (
              <DistributionTable
                title="Хотоор"
                data={distribution.byCity.map((c) => ({
                  name: c.city,
                  orderCount: c.orderCount,
                  totalAmount: c.totalAmount,
                }))}
              />
            )}
          </div>
        </>
      )}

      {/* SALES VIEW */}
      {viewMode === "sales" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {salesData && salesData.ordersByStatus.length > 0 && (
              <StatusChart data={salesData.ordersByStatus} />
            )}
            {distribution && distribution.byCity.length > 0 && (
              <DistributionChart
                title="Хотоор орлого"
                data={distribution.byCity.map((c) => ({
                  name: c.city,
                  orderCount: c.orderCount,
                  totalAmount: c.totalAmount,
                }))}
              />
            )}
          </div>
          
          {/* Захиалгын төлөв */}
          {salesData && salesData.ordersByStatus.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Захиалгын төлөв
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {salesData.ordersByStatus.map((status) => (
                  <div
                    key={status.status}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {status.status}
                    </p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {status.count}
                    </p>
                    <p className="text-sm text-gray-500">
                      ₮{status.total.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* PRODUCTS VIEW */}
      {viewMode === "products" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TopProductsTable products={topProducts} />
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Бүтээгдэхүүний статистик
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-600">Нийт зарагдсан</span>
                  <span className="text-xl font-bold text-blue-600">
                    {topProducts.reduce((sum, p) => sum + p.totalQuantity, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">Нэр төрөл</span>
                  <span className="text-xl font-bold text-green-600">
                    {topProducts.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-600">Хамгийн эрэлттэй</span>
                  <span className="text-sm font-bold text-purple-600 text-right max-w-[150px] truncate">
                    {topProducts[0]?.productName || "Байхгүй"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm text-gray-600">Дундаж тоо</span>
                  <span className="text-xl font-bold text-orange-600">
                    {topProducts.length > 0
                      ? Math.round(topProducts.reduce((sum, p) => sum + p.totalQuantity, 0) / topProducts.length)
                      : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CUSTOMERS VIEW */}
      {viewMode === "customers" && distribution && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionChart
              title="Төлбөрийн хэлбэрээр"
              data={distribution.byPaymentMethod.map((p) => ({
                name: p.paymentMethod,
                orderCount: p.orderCount,
                totalAmount: p.totalAmount,
              }))}
            />
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Төлбөрийн хэлбэр
              </h3>
              <div className="space-y-3">
                {distribution.byPaymentMethod.map((method, index) => {
                  const total = distribution.byPaymentMethod.reduce((s, m) => s + m.orderCount, 0);
                  const percentage = total > 0 ? Math.round((method.orderCount / total) * 100) : 0;
                  const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-red-500", "bg-purple-500"];
                  
                  return (
                    <div key={method.paymentMethod}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">{method.paymentMethod}</span>
                        <span className="text-gray-500">
                          {method.orderCount} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${colors[index % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DistributionTable
            title="Хотоор захиалга"
            data={distribution.byCity.map((c) => ({
              name: c.city,
              orderCount: c.orderCount,
              totalAmount: c.totalAmount,
            }))}
          />
        </>
      )}

      {/* БАЙРШИЛ */}
      {viewMode === "locations" && distribution && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DistributionChart
              title="Хотоор"
              data={distribution.byCity.map((c) => ({
                name: c.city,
                orderCount: c.orderCount,
                totalAmount: c.totalAmount,
              }))}
            />
            <DistributionTable
              title="Хотоор"
              data={distribution.byCity.map((c) => ({
                name: c.city,
                orderCount: c.orderCount,
                totalAmount: c.totalAmount,
              }))}
            />
          </div>

          <DistributionTable
            title="Дүүргээр (Топ 20)"
            data={distribution.byDistrict.map((d) => ({
              name: d.district,
              orderCount: d.orderCount,
              totalAmount: d.totalAmount,
            }))}
          />
        </>
      )}
    </div>
  );
}
