"use client";

import { useState, useEffect, ReactNode } from "react";
import * as XLSX from "xlsx";
import {
  CheckIcon,
  ExclamationIcon,
  XIcon,
  ChartBarIcon,
  DocumentIcon,
  FolderIcon,
} from "@/components/Icons";

interface ImportRecord {
  id: number;
  fileName: string;
  fileType: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  duplicatesInFile: number;
  duplicatesInDb: number;
  status: string;
  errorMessages: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ImportHistoryPage() {
  const [history, setHistory] = useState<ImportRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  async function fetchHistory(page = 1, fileType = "") {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(fileType && fileType !== "all" && { fileType }),
      });

      const res = await fetch(`/api/import-history?${params}`);
      const data = await res.json();

      setHistory(data.history || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch import history:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory(1, filterType === "all" ? "" : filterType);
  }, [filterType]);

  async function handleDelete(id: number) {
    if (!confirm("Энэ бичлэгийг устгахдаа итгэлтэй байна уу?")) return;

    try {
      await fetch(`/api/import-history?id=${id}`, { method: "DELETE" });
      fetchHistory(pagination?.page || 1, filterType === "all" ? "" : filterType);
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  }

  async function handleClearAll() {
    if (!confirm("Бүх түүхийг устгахдаа итгэлтэй байна уу?")) return;

    try {
      await fetch(`/api/import-history`, { method: "DELETE" });
      fetchHistory();
    } catch (error) {
      console.error("Failed to clear all:", error);
    }
  }

  function exportToExcel(format: "xlsx" | "xls" | "csv") {
    if (history.length === 0) return;

    // Prepare data for export
    const exportData = history.map((record) => ({
      "Файлын нэр": record.fileName,
      "Төрөл": record.fileType === "orders" ? "Захиалга" : "Бүтээгдэхүүн",
      "Нийт мөр": record.totalRows,
      "Оруулсан": record.importedCount,
      "Алгассан": record.skippedCount,
      "Файл дахь давхардал": record.duplicatesInFile,
      "DB дахь давхардал": record.duplicatesInDb,
      "Төлөв": record.status === "success" ? "Амжилттай" : record.status === "partial" ? "Хэсэгчлэн" : "Амжилтгүй",
      "Огноо": formatDate(record.createdAt),
      "Алдаа": record.errorMessages || "",
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Импортын түүх");

    // Auto-size columns
    const colWidths = [
      { wch: 30 }, // Файлын нэр
      { wch: 12 }, // Төрөл
      { wch: 10 }, // Нийт мөр
      { wch: 10 }, // Оруулсан
      { wch: 10 }, // Алгассан
      { wch: 18 }, // Файл дахь давхардал
      { wch: 18 }, // DB дахь давхардал
      { wch: 12 }, // Төлөв
      { wch: 18 }, // Огноо
      { wch: 40 }, // Алдаа
    ];
    worksheet["!cols"] = colWidths;

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `import_history_${date}`;

    // Export based on format
    if (format === "csv") {
      XLSX.writeFile(workbook, `${filename}.csv`, { bookType: "csv" });
    } else if (format === "xls") {
      XLSX.writeFile(workbook, `${filename}.xls`, { bookType: "biff8" });
    } else {
      XLSX.writeFile(workbook, `${filename}.xlsx`, { bookType: "xlsx" });
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("mn-MN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getStatusBadge(status: string): { class: string; Icon: React.FC<{ className?: string }>; text: string } {
    switch (status) {
      case "success":
        return {
          class: "bg-green-100 text-green-800",
          Icon: CheckIcon,
          text: "Амжилттай",
        };
      case "partial":
        return {
          class: "bg-yellow-100 text-yellow-800",
          Icon: ExclamationIcon,
          text: "Хэсэгчлэн",
        };
      case "failed":
        return {
          class: "bg-red-100 text-red-800",
          Icon: XIcon,
          text: "Амжилтгүй",
        };
      default:
        return {
          class: "bg-gray-100 text-gray-800",
          Icon: ExclamationIcon,
          text: status,
        };
    }
  }

  function getFileTypeBadge(fileType: string) {
    switch (fileType) {
      case "orders":
        return { class: "bg-blue-100 text-blue-800", text: "Захиалга" };
      case "products":
        return { class: "bg-purple-100 text-purple-800", text: "Бүтээгдэхүүн" };
      default:
        return { class: "bg-gray-100 text-gray-800", text: fileType };
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Импортын түүх</h1>
          <p className="text-gray-600 mt-1">
            {pagination ? `Нийт ${pagination.total} бичлэг` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Бүгд</option>
            <option value="orders">Захиалга</option>
            <option value="products">Бүтээгдэхүүн</option>
          </select>

          {/* Export Button */}
          {history.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Экспорт
                <svg className={`w-4 h-4 transition-transform ${showExportMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => { exportToExcel("xlsx"); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ChartBarIcon className="w-4 h-4 text-green-600" />
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => { exportToExcel("xls"); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ChartBarIcon className="w-4 h-4 text-green-600" />
                    Excel 97-2003 (.xls)
                  </button>
                  <button
                    onClick={() => { exportToExcel("csv"); setShowExportMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <DocumentIcon className="w-4 h-4 text-blue-600" />
                    CSV (.csv)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clear All Button */}
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium"
            >
              Бүгдийг устгах
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow border border-gray-200">
          <FolderIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-500">Импортын түүх байхгүй байна</p>
          <p className="text-sm text-gray-400 mt-1">
            Файл оруулах хэсгээс Excel файл оруулна уу
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Файлын нэр
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Төрөл
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Нийт мөр
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Оруулсан
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Давхардал
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Төлөв
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Огноо
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Үйлдэл
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {history.map((record) => {
                const statusBadge = getStatusBadge(record.status);
                const typeBadge = getFileTypeBadge(record.fileType);
                const totalDuplicates =
                  record.duplicatesInFile + record.duplicatesInDb;
                const isExpanded = expandedRow === record.id;

                return (
                  <>
                    <tr
                      key={record.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DocumentIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                            {record.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs rounded-full font-medium ${typeBadge.class}`}
                        >
                          {typeBadge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600">
                          {record.totalRows}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-medium text-green-600">
                          {record.importedCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {totalDuplicates > 0 ? (
                          <span className="text-sm text-orange-600">
                            {totalDuplicates}
                            <span className="text-xs text-gray-400 ml-1">
                              ({record.duplicatesInFile}ф / {record.duplicatesInDb}
                              д)
                            </span>
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium ${statusBadge.class}`}
                        >
                          <statusBadge.Icon className="w-3 h-3" />
                          {statusBadge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(record.createdAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {record.errorMessages && (
                            <button
                              onClick={() =>
                                setExpandedRow(isExpanded ? null : record.id)
                              }
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Дэлгэрэнгүй"
                            >
                              <svg
                                className={`w-4 h-4 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Устгах"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Row for Errors */}
                    {isExpanded && record.errorMessages && (
                      <tr key={`${record.id}-errors`}>
                        <td
                          colSpan={8}
                          className="px-6 py-4 bg-gray-50 border-t border-gray-100"
                        >
                          <div className="text-sm">
                            <p className="font-medium text-gray-700 mb-2">
                              Алдаанууд:
                            </p>
                            <div className="bg-white rounded-lg p-3 border border-gray-200 max-h-40 overflow-y-auto">
                              <pre className="text-xs text-red-600 whitespace-pre-wrap">
                                {record.errorMessages}
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() =>
              fetchHistory(
                pagination.page - 1,
                filterType === "all" ? "" : filterType
              )
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Өмнөх
          </button>
          <span className="px-4 py-2">
            Хуудас {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              fetchHistory(
                pagination.page + 1,
                filterType === "all" ? "" : filterType
              )
            }
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Дараах
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Нийт импорт</p>
            <p className="text-2xl font-bold text-gray-900">
              {pagination?.total || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Амжилттай</p>
            <p className="text-2xl font-bold text-green-600">
              {history.filter((h) => h.status === "success").length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Хэсэгчлэн</p>
            <p className="text-2xl font-bold text-yellow-600">
              {history.filter((h) => h.status === "partial").length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500">Амжилтгүй</p>
            <p className="text-2xl font-bold text-red-600">
              {history.filter((h) => h.status === "failed").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
