import {
  CurrencyIcon,
  CubeIcon,
  ChartBarIcon,
  TruckIcon,
  CalendarIcon,
} from "../Icons";

interface SummaryCardsProps {
  totalSales: number;
  orderCount: number;
  avgOrderValue: number;
  deliveryFees: number;
  recentOrderCount: number;
}

export default function SummaryCards({
  totalSales,
  orderCount,
  avgOrderValue,
  deliveryFees,
  recentOrderCount,
}: SummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("mn-MN", {
      style: "currency",
      currency: "MNT",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Нийт борлуулалт",
      value: formatCurrency(totalSales),
      icon: CurrencyIcon,
      color: "blue",
    },
    {
      title: "Нийт захиалга",
      value: orderCount.toLocaleString(),
      icon: CubeIcon,
      color: "green",
    },
    {
      title: "Дундаж захиалга",
      value: formatCurrency(avgOrderValue),
      icon: ChartBarIcon,
      color: "purple",
    },
    {
      title: "Хүргэлтийн төлбөр",
      value: formatCurrency(deliveryFees),
      icon: TruckIcon,
      color: "orange",
    },
    {
      title: "Сүүлийн 7 хоног",
      value: recentOrderCount.toLocaleString(),
      icon: CalendarIcon,
      color: "pink",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600",
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600",
    },
    purple: {
      bg: "bg-purple-100",
      text: "text-purple-600",
    },
    orange: {
      bg: "bg-orange-100",
      text: "text-orange-600",
    },
    pink: {
      bg: "bg-pink-100",
      text: "text-pink-600",
    },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[card.color].bg}`}
            >
              <card.icon className={`w-5 h-5 ${colorClasses[card.color].text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">
                {card.title}
              </p>
              <p
                className={`text-lg font-bold truncate ${colorClasses[card.color].text}`}
              >
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
