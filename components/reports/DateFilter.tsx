"use client";

import { useState } from "react";

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApply: (start?: string, end?: string) => void;
  loading?: boolean;
}

export default function DateFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  loading,
}: DateFilterProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const quickFilters = [
    { label: "Өнөөдөр", days: 0, id: "today" },
    { label: "7 хоног", days: 7, id: "7days" },
    { label: "30 хоног", days: 30, id: "30days" },
    { label: "90 хоног", days: 90, id: "90days" },
    { label: "Энэ жил", days: 365, id: "year" },
  ];

  const setQuickFilter = (days: number, id: string) => {
    const end = new Date();
    const start = new Date();
    if (days > 0) {
      start.setDate(start.getDate() - days);
    }
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    onStartDateChange(startStr);
    onEndDateChange(endStr);
    setActiveFilter(id);
    // Instantly apply with the new dates
    onApply(startStr, endStr);
  };

  const handleDateChange = (type: "start" | "end", value: string) => {
    if (type === "start") {
      onStartDateChange(value);
      setActiveFilter("custom");
      // Apply with new start date and current end date
      if (endDate) onApply(value, endDate);
    } else {
      onEndDateChange(value);
      setActiveFilter("custom");
      // Apply with current start date and new end date
      if (startDate) onApply(startDate, value);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Түргэн шүүлт:
          </span>
          <div className="flex gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setQuickFilter(filter.days, filter.id)}
                disabled={loading}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                  activeFilter === filter.id
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-blue-300"
                } disabled:opacity-50`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden md:block" />

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Эхлэх:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange("start", e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Дуусах:
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange("end", e.target.value)}
            className="px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Уншиж байна...</span>
          </div>
        )}
      </div>
    </div>
  );
}
