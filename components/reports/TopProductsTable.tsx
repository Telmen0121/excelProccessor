interface TopProductsTableProps {
  products: Array<{
    rank: number;
    productName: string;
    totalQuantity: number;
  }>;
}

export default function TopProductsTable({ products }: TopProductsTableProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Хамгийн их зарагдсан бүтээгдэхүүн
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                №
              </th>
              <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Бүтээгдэхүүн
              </th>
              <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Зарагдсан
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.productName} className="hover:bg-gray-50:bg-gray-700/50">
                <td className="py-3 px-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      product.rank === 1
                        ? "bg-yellow-100 text-yellow-800"
                        : product.rank === 2
                        ? "bg-gray-200 text-gray-800"
                        : product.rank === 3
                        ? "bg-orange-100 text-orange-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {product.rank}
                  </span>
                </td>
                <td className="py-3 px-2 text-sm text-gray-900">
                  {product.productName}
                </td>
                <td className="py-3 px-2 text-sm text-right font-semibold text-gray-900">
                  {product.totalQuantity.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Бүтээгдэхүүний мэдээлэл байхгүй байна
          </div>
        )}
      </div>
    </div>
  );
}
