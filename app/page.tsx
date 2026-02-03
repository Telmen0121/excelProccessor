import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Excel Viewer Хянах Самбар
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Захиалга эсвэл бүтээгдэхүүний Excel файл оруулж, өгөгдлөө удирдан, дэлгэрэнгүй тайлан гаргана уу.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/upload" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-blue-500">
            <div className="text-3xl mb-3">📤</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Файл оруулах</h2>
            <p className="text-gray-600 text-sm">
              Захиалга эсвэл Бүтээгдэхүүний Excel файл оруулж системд импортлоно уу.
            </p>
          </div>
        </Link>

        <Link href="/orders" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-green-500">
            <div className="text-3xl mb-3">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Захиалгууд</h2>
            <p className="text-gray-600 text-sm">
              Бүх захиалгыг харилцагч, бүтээгдэхүүний мэдээллийн хамт үзэж хайх.
            </p>
          </div>
        </Link>

        <Link href="/products" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-purple-500">
            <div className="text-3xl mb-3">📦</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Бүтээгдэхүүн</h2>
            <p className="text-gray-600 text-sm">
              Бүтээгдэхүүний үнэ, ангилал, үлдэгдлийн мэдээллийг харах.
            </p>
          </div>
        </Link>

        <Link href="/reports" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border-l-4 border-orange-500">
            <div className="text-3xl mb-3">📊</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Тайлан</h2>
            <p className="text-gray-600 text-sm">
              Борлуулалт, шилдэг бүтээгдэхүүн, харилцагчийн тархалтын тайлан гаргах.
            </p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Дэмжигдэх файлын төрөл</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">📑 A төрөл - Захиалга</h3>
            <p className="text-sm text-gray-600 mb-2">Шаардлагатай багана:</p>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
              Код, Төлөв, Т.Х, Харилцагч, Утас, Дэлгэрэнгүй хаяг, И-мэйл, Хот/аймаг, Сум/дүүрэг, Хороо/баг, Хүргэлтийн үнэ, Нийт дүн, Купон код, Купон хувь, Нэмэлт тайлбар, Бараанууд, Огноо
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">📦 B төрөл - Бүтээгдэхүүн</h3>
            <p className="text-sm text-gray-600 mb-2">Шаардлагатай багана:</p>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
              Нэр, Төлөв, Үнэ, Хямдралтай үнэ, Ангилалууд, Үлдэглэл
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
