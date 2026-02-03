"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatusChartProps {
  data: Array<{
    status: string;
    count: number;
    total: number;
  }>;
}

export default function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map((item) => ({
    name: item.status,
    orders: item.count,
    revenue: item.total,
  }));

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `₮${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `₮${(value / 1000).toFixed(0)}K`;
    }
    return `₮${value}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Захиалгын төлөв
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={formatCurrency}
              tick={{ fill: "#6b7280", fontSize: 12 }}
              tickLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
              formatter={(value: number, name: string) => [
                name === "revenue" ? formatCurrency(value) : value,
                name === "orders" ? "Захиалга" : "Орлого",
              ]}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="orders"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              name="Захиалга"
            />
            <Bar
              yAxisId="right"
              dataKey="revenue"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Орлого"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
