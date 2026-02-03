import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Excel Viewer - Борлуулалт & Бүтээгдэхүүн",
  description: "Excel файл оруулж, захиалга болон бүтээгдэхүүнийг удирдан, тайлан гаргах",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar />
          <main className="ml-64 min-h-screen p-6 transition-all duration-300">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
