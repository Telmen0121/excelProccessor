"use client";

import { useState, useEffect } from "react";

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

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchOrders(1, search);
  }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Захиалгууд</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {pagination ? `Нийт ${pagination.total} захиалга` : "Ачааллаж байна..."}
          </p>
        </div>
        
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Код, хэрэглэгч, утас..."
            className="px-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Хайх
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-500 dark:text-gray-400">Захиалга олдсонгүй</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Код
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Хэрэглэгч
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Төлөв
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Дүн
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Огноо
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <>
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {order.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div>{order.customer || '-'}</div>
                      <div className="text-xs text-gray-400">{order.phone || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' || order.status === 'Хүргэгдсэн'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : order.status === 'pending' || order.status === 'Хүлээгдэж буй'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {order.status || 'Тодорхойгүй'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {expandedOrder === order.id ? 'Нуух' : 'Дэлгэрэнгүй'}
                      </button>
                    </td>
                  </tr>
                  {expandedOrder === order.id && (
                    <tr key={`${order.id}-details`}>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Төлбөр:</span>{' '}
                            <span className="font-medium dark:text-white">{order.paymentMethod || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Имэйл:</span>{' '}
                            <span className="font-medium dark:text-white">{order.email || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Хот:</span>{' '}
                            <span className="font-medium dark:text-white">{order.city || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Дүүрэг:</span>{' '}
                            <span className="font-medium dark:text-white">{order.district || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Хүргэлт:</span>{' '}
                            <span className="font-medium dark:text-white">{formatCurrency(order.deliveryFee)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Купон:</span>{' '}
                            <span className="font-medium dark:text-white">
                              {order.couponCode ? `${order.couponCode} (${order.couponPercent}%)` : '-'}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 dark:text-gray-400">Хаяг:</span>{' '}
                            <span className="font-medium dark:text-white">{order.addressDetail || '-'}</span>
                          </div>
                        </div>
                        {order.items.length > 0 && (
                          <div className="mt-4">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Бүтээгдэхүүн:</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {order.items.map((item) => (
                                <span
                                  key={item.id}
                                  className="px-2 py-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded text-xs dark:text-white"
                                >
                                  {item.productName} × {item.quantity || 1}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {order.note && (
                          <div className="mt-4">
                            <span className="text-gray-500 dark:text-gray-400 text-sm">Тэмдэглэл:</span>
                            <p className="text-sm mt-1 dark:text-white">{order.note}</p>
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
            className="px-4 py-2 border dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
          >
            Өмнөх
          </button>
          <span className="px-4 py-2 dark:text-white">
            Хуудас {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchOrders(pagination.page + 1, search)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
          >
            Дараах
          </button>
        </div>
      )}
    </div>
  );
}
