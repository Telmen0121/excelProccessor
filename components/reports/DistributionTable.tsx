interface DistributionTableProps {
  title: string;
  data: Array<{
    name: string;
    orderCount: number;
    totalAmount: number;
  }>;
}

export default function DistributionTable({ title, data }: DistributionTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("mn-MN", {
      style: "currency",
      currency: "MNT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {title}
      </h3>
      <div className="overflow-x-auto max-h-80">
        <table className="w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Нэр
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Захиалга
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Орлого
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50:bg-gray-700/50">
                <td className="py-2.5 px-2 text-sm text-gray-900">
                  {item.name}
                </td>
                <td className="py-2.5 px-2 text-sm text-right text-gray-600">
                  {item.orderCount.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 text-sm text-right font-medium text-gray-900">
                  {formatCurrency(item.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Мэдээлэл байхгүй байна
          </div>
        )}
      </div>
    </div>
  );
}
