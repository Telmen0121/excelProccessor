"use client";

import { useState, useEffect, useMemo } from "react";

interface Order {
  id: number;
  code: string;
  status: string | null;
  paymentMethod: string | null;
  customer: string | null;
  phone: string | null;
  addressDetail: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  khoroo: string | null;
  deliveryFee: number | null;
  totalAmount: number | null;
  couponCode: string | null;
  couponPercent: number | null;
  note: string | null;
  productsRaw: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");

  async function fetchOrders(page = 1, searchTerm = "") {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm })
      });
      
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      
      setOrders(data.orders || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  // Instant search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(1, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Extract unique values for filters
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.status) set.add(o.status); });
    return Array.from(set).sort();
  }, [orders]);

  const uniquePaymentMethods = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.paymentMethod) set.add(o.paymentMethod); });
    return Array.from(set).sort();
  }, [orders]);

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => { if (o.city) set.add(o.city); });
    return Array.from(set).sort();
  }, [orders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (paymentFilter !== "all" && order.paymentMethod !== paymentFilter) return false;
      if (cityFilter !== "all" && order.city !== cityFilter) return false;
      return true;
    });
  }, [orders, statusFilter, paymentFilter, cityFilter]);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatCurrency(amount: number | null) {
    if (amount === null) return '-';
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0
    }).format(amount);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Захиалгууд</h1>
          <p className="text-gray-600 mt-1">
            {pagination ? `Нийт ${pagination.total} захиалга` : "Ачааллаж байна..."}
            {filteredOrders.length !== orders.length && ` • ${filteredOrders.length} харуулж байна`}
          </p>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Код, хэрэглэгч, утас..."
            className="pl-10 pr-10 py-2 border rounded-lg w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {loading && search && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Төлөв:</span>
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  statusFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Бүгд
              </button>
              {uniqueStatuses.map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          {uniquePaymentMethods.length > 0 && (
            <div className="h-6 w-px bg-gray-300 hidden md:block" />
          )}

          {/* Payment Method Filter */}
          {uniquePaymentMethods.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Төлбөр:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Бүгд</option>
                {uniquePaymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>
          )}

          {/* City Filter */}
          {uniqueCities.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Хот:</span>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Бүгд</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {(statusFilter !== "all" || paymentFilter !== "all" || cityFilter !== "all") && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setPaymentFilter("all");
                setCityFilter("all");
              }}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Цэвэрлэх
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">
            {orders.length === 0 ? "Захиалга олдсонгүй" : "Шүүлтэд тохирох захиалга олдсонгүй"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Код
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Хэрэглэгч
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Төлөв
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дүн
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Огноо
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <>
                  <tr key={order.id} className="hover:bg-gray-50:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{order.customer || '-'}</div>
                      <div className="text-xs text-gray-400">{order.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' || order.status === 'Хүргэгдсэн'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending' || order.status === 'Хүлээгдэж буй'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'Тодорхойгүй'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="text-blue-600 hover:text-blue-800:text-blue-300"
                      >
                        {expandedOrder === order.id ? 'Нуух' : 'Дэлгэрэнгүй'}
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-details`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Төлбөр:</span>{' '}
                            <span className="font-medium">{order.paymentMethod || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Имэйл:</span>{' '}
                            <span className="font-medium">{order.email || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Хот:</span>{' '}
                            <span className="font-medium">{order.city || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Дүүрэг:</span>{' '}
                            <span className="font-medium">{order.district || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Хүргэлт:</span>{' '}
                            <span className="font-medium">{formatCurrency(order.deliveryFee)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Купон:</span>{' '}
                            <span className="font-medium">
                              {order.couponCode ? `${order.couponCode} (${order.couponPercent}%)` : '-'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">Хаяг:</span>{' '}
                            <span className="font-medium">{order.addressDetail || '-'}</span>
                          </div>
                        </div>
                        {order.items.length > 0 && (
                          <div className="mt-4">
                            <span className="text-gray-500 text-sm">Бүтээгдэхүүн:</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {order.items.map((item) => (
                                <span
                                  key={item.id}
                                  className="px-2 py-1 bg-white border rounded text-xs"
                                >
                                  {item.productName} × {item.quantity || 1}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {order.note && (
                          <div className="mt-4">
                            <span className="text-gray-500 text-sm">Тэмдэглэл:</span>
                            <p className="text-sm mt-1">{order.note}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => fetchOrders(pagination.page - 1, search)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50:bg-gray-700"
          >
            Өмнөх
          </button>
          <span className="px-4 py-2">
            Хуудас {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchOrders(pagination.page + 1, search)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50:bg-gray-700"
          >
            Дараах
          </button>
        </div>
      )}
    </div>
  );
}
