"use client";

import { useState, useRef } from "react";

interface UploadResult {
  message?: string;
  error?: string;
  type?: string;
  imported?: number;
  updated?: number;
  skipped?: number;
  total?: number;
  errors?: string[];
}

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    if (!file) return;

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      setResult({ error: "Excel файл оруулна уу (.xlsx эсвэл .xls)" });
      return;
    }

    setIsUploading(true);
    setResult(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: form
      });

      const json = await res.json();
      setResult(json);
    } catch (error) {
      setResult({ error: "Файл оруулахад алдаа гарлаа. Дахин оролдоно уу." });
    } finally {
      setIsUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Excel файл оруулах</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Захиалга эсвэл Бүтээгдэхүүний Excel файлаа оруулж системд импортлоно уу.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="text-5xl mb-4">📁</div>
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="text-gray-600 dark:text-gray-400">Файл боловсруулж байна...</p>
          </div>
        ) : (
          <>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              Excel файлаа энд чирж тавина уу
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-4">эсвэл</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Файл сонгох
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Дэмжигдэх формат: .xlsx, .xls
            </p>
          </>
        )}
      </div>

      {result && (
        <div
          className={`rounded-lg p-6 ${
            result.error
              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
          }`}
        >
          {result.error ? (
            <div className="flex items-start">
              <span className="text-2xl mr-3">❌</span>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Оруулахад алдаа гарлаа</h3>
                <p className="text-red-700 dark:text-red-400">{result.error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <h3 className="font-semibold text-green-800 dark:text-green-300">{result.message}</h3>
                  <p className="text-green-700 dark:text-green-400">
                    Файлын төрөл: <span className="font-medium capitalize">{result.type === "orders" ? "Захиалга" : "Бүтээгдэхүүн"}</span>
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Нийт мөр</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Импортлогдсон</p>
                  <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                </div>
                {result.updated !== undefined && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Шинэчлэгдсэн</p>
                    <p className="text-2xl font-bold text-blue-600">{result.updated}</p>
                  </div>
                )}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Алгассан</p>
                  <p className="text-2xl font-bold text-gray-500">{result.skipped}</p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">Анхааруулга:</h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Зааварчилгаа</h2>
        <div className="space-y-3 text-gray-600 dark:text-gray-400">
          <p>
            <strong>1.</strong> Excel файлдаа зөв баганын гарчиг оруулна уу.
          </p>
          <p>
            <strong>2.</strong> Систем автоматаар Захиалга эсвэл Бүтээгдэхүүн гэдгийг таньна.
          </p>
          <p>
            <strong>3.</strong> Давхардсан бичлэгийг алгасна (Захиалга: &quot;Код&quot;, Бүтээгдэхүүн: &quot;Нэр&quot;).
          </p>
          <p>
            <strong>4.</strong> Буруу мөрийг алгасаад үр дүнд харуулна.
          </p>
        </div>
      </div>
    </div>
  );
}
