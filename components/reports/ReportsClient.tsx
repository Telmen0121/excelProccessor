"use client";

import { useState, useEffect } from "react";
import SummaryCards from "./SummaryCards";
import DateFilter from "./DateFilter";
import StatusChart from "./StatusChart";
import DistributionChart from "./DistributionChart";
import TopProductsTable from "./TopProductsTable";
import DistributionTable from "./DistributionTable";

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

  // Date filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredSummary, setFilteredSummary] = useState<{
    totalOrders: number;
    totalSales: number;
    totalDeliveryFees: number;
    avgOrderValue: number;
  } | null>(null);

  const viewModes: Array<{ id: ViewMode; label: string; icon: string; description: string }> = [
    { id: "overview", label: "Ерөнхий", icon: "📊", description: "Бүх үзүүлэлтүүд" },
    { id: "sales", label: "Борлуулалт", icon: "💰", description: "Орлого & захиалга" },
    { id: "products", label: "Бүтээгдэхүүн", icon: "📦", description: "Их зарагдсан бараа" },
    { id: "customers", label: "Харилцагч", icon: "👥", description: "Төлбөрийн мэдээлэл" },
    { id: "locations", label: "Байршил", icon: "📍", description: "Газарзүйн тархалт" },
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

  async function handleDateFilter() {
    if (!startDate || !endDate) return;

    setFilterLoading(true);
    try {
      const res = await fetch("/api/report/by-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: startDate, end: endDate }),
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
          <p className="text-gray-500 dark:text-gray-400">Тайлан уншиж байна...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 transition-opacity ${filterLoading ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Тайлангийн самбар
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Борлуулалтын шинжилгээ болон гүйцэтгэлийн үзүүлэлтүүд
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Экспорт
        </button>
      </div>

      {/* Quick View Preset Buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Түргэн харах:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {viewModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                viewMode === mode.id
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-[1.02]"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              <span className="text-lg">{mode.icon}</span>
              <div className="text-left">
                <div>{mode.label}</div>
                <div className={`text-xs ${viewMode === mode.id ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
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
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              📅 Шүүсэн үр дүн ({startDate} - {endDate})
            </p>
            <button
              onClick={() => setFilteredSummary(null)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
            >
              Шүүлтүүр арилгах
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Захиалга</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {filteredSummary.totalOrders.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Борлуулалт</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                ₮{filteredSummary.totalSales.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Хүргэлтийн төлбөр</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                ₮{filteredSummary.totalDeliveryFees.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Дундаж захиалга</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Захиалгын төлөв
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {salesData.ordersByStatus.map((status) => (
                  <div
                    key={status.status}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {status.status}
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {status.count}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Бүтээгдэхүүний статистик
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Нийт зарагдсан</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {topProducts.reduce((sum, p) => sum + p.totalQuantity, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Нэр төрөл</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {topProducts.length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Хамгийн эрэлттэй</span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400 text-right max-w-[150px] truncate">
                    {topProducts[0]?.productName || "Байхгүй"}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Дундаж тоо</span>
                  <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                        <span className="text-gray-700 dark:text-gray-300">{method.paymentMethod}</span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {method.orderCount} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
