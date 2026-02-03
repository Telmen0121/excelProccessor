"use client";

import { useState, useEffect, useMemo } from "react";

interface Product {
  id: number;
  name: string;
  price: number | null;
  salePrice: number | null;
  categories: string | null;
  stock: number | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type SortField = "name" | "price" | "stock" | "createdAt";
type SortOrder = "asc" | "desc";
type ViewMode = "grid" | "table";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [stockFilter, setStockFilter] = useState<"all" | "inStock" | "lowStock" | "outOfStock">("all");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Check if any filter is active
  const isFilterActive = selectedCategory !== "all" || stockFilter !== "all" || selectedSubcategory !== "all" || search !== "";

  async function fetchProducts(page = 1, searchTerm = "", categoryFilter = "", fetchAll = false) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: fetchAll ? "10000" : "50",
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter })
      });
      
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      
      setProducts(data.products || []);
      setPagination(fetchAll ? null : data.pagination);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Instant search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const shouldFetchAll = selectedCategory !== "all" || stockFilter !== "all" || selectedSubcategory !== "all" || search !== "";
      fetchProducts(1, search, category, shouldFetchAll);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, category]);

  // Refetch all products when a filter is selected (to bypass pagination)
  useEffect(() => {
    const shouldFetchAll = selectedCategory !== "all" || stockFilter !== "all" || selectedSubcategory !== "all";
    fetchProducts(1, search, category, shouldFetchAll);
  }, [selectedCategory, stockFilter, selectedSubcategory]);

  // Extract unique categories from products
  const uniqueCategories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.categories) {
        // Split by comma in case a product has multiple categories
        product.categories.split(',').forEach(cat => {
          const trimmed = cat.trim();
          if (trimmed) categorySet.add(trimmed);
        });
      }
    });
    return Array.from(categorySet).sort();
  }, [products]);

  // Extract subcategories from product names when accessories category is selected
  const accessoriesSubcategories = useMemo(() => {
    if (selectedCategory === "all") return [];
    
    // Check if current category is accessories-related
    const isAccessories = selectedCategory.toLowerCase().includes("дагалдах") || 
      selectedCategory.toLowerCase().includes("аксессуар") ||
      selectedCategory.toLowerCase().includes("accessories");
    
    if (!isAccessories) return [];

    // Get products in this category
    const categoryProducts = products.filter(p => 
      p.categories && p.categories.toLowerCase().includes(selectedCategory.toLowerCase())
    );

    // Extract unique first words or key terms from product names
    const subcatSet = new Set<string>();
    categoryProducts.forEach(product => {
      if (product.name) {
        // Get the first meaningful part of the name (before any model numbers/specs)
        const nameParts = product.name.split(/[\s\-\/]+/);
        if (nameParts.length > 0) {
          // Take first 1-2 words as subcategory
          const subcat = nameParts.slice(0, 2).join(' ').trim();
          if (subcat && subcat.length > 1) {
            subcatSet.add(subcat);
          }
        }
      }
    });
    
    return Array.from(subcatSet).sort();
  }, [products, selectedCategory]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(p => 
        p.categories && p.categories.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // Apply subcategory filter
    if (selectedSubcategory !== "all") {
      filtered = filtered.filter(p => 
        p.name && p.name.toLowerCase().startsWith(selectedSubcategory.toLowerCase())
      );
    }

    // Apply stock filter
    if (stockFilter === "inStock") {
      filtered = filtered.filter(p => p.stock !== null && p.stock > 0);
    } else if (stockFilter === "lowStock") {
      filtered = filtered.filter(p => p.stock !== null && p.stock > 0 && p.stock < 10);
    } else if (stockFilter === "outOfStock") {
      filtered = filtered.filter(p => p.stock === 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "price":
          const priceA = a.salePrice ?? a.price ?? 0;
          const priceB = b.salePrice ?? b.price ?? 0;
          comparison = priceA - priceB;
          break;
        case "stock":
          comparison = (a.stock ?? 0) - (b.stock ?? 0);
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [products, sortField, sortOrder, stockFilter, selectedCategory, selectedSubcategory]);

  function formatCurrency(amount: number | null) {
    if (amount === null) return '-';
    return new Intl.NumberFormat('mn-MN', {
      style: 'currency',
      currency: 'MNT',
      minimumFractionDigits: 0
    }).format(amount);
  }

  function getStockStatus(stock: number | null) {
    if (stock === null) return { text: 'Тодорхойгүй', class: 'bg-gray-100 text-gray-800', dot: 'bg-gray-400' };
    if (stock === 0) return { text: 'Дууссан', class: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
    if (stock < 10) return { text: 'Бага үлдсэн', class: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' };
    return { text: 'Байгаа', class: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
  }

  const sortOptions = [
    { field: "name" as SortField, label: "Нэр", icon: "🔤" },
    { field: "price" as SortField, label: "Үнэ", icon: "💰" },
    { field: "stock" as SortField, label: "Үлдэгдэл", icon: "📦" },
    { field: "createdAt" as SortField, label: "Огноо", icon: "📅" },
  ];

  // Get products filtered by category (for stock filter counts)
  const categoryFilteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter(p => 
      p.categories && p.categories.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [products, selectedCategory]);

  const stockFilters = [
    { value: "all" as const, label: "Бүгд", count: categoryFilteredProducts.length },
    { value: "inStock" as const, label: "Байгаа", count: categoryFilteredProducts.filter(p => p.stock !== null && p.stock > 0).length },
    { value: "lowStock" as const, label: "Бага", count: categoryFilteredProducts.filter(p => p.stock !== null && p.stock > 0 && p.stock < 10).length },
    { value: "outOfStock" as const, label: "Дууссан", count: categoryFilteredProducts.filter(p => p.stock === 0).length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Бүтээгдэхүүн</h1>
          <p className="text-gray-600 mt-1">
            {pagination && `Нийт ${pagination.total} бүтээгдэхүүн`}
            {filteredAndSortedProducts.length !== products.length && ` • ${filteredAndSortedProducts.length} харуулж байна`}
          </p>
        </div>
        
        {/* Search - Instant */}
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Нэрээр хайх..."
              className="pl-10 pr-4 py-2.5 border rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading && search && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ангилал..."
            className="px-4 py-2.5 border rounded-xl w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category Filter Buttons */}
      {uniqueCategories.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600 mr-2">Ангилал:</span>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSelectedSubcategory("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-600"
              }`}
            >
              Бүгд
              <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                selectedCategory === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}>
                {products.length}
              </span>
            </button>
            {uniqueCategories.map((cat) => {
              const count = products.filter(p => 
                p.categories && p.categories.toLowerCase().includes(cat.toLowerCase())
              ).length;
              const isAccessoriesCat = cat.toLowerCase().includes("дагалдах") || 
                cat.toLowerCase().includes("аксессуар") ||
                cat.toLowerCase().includes("accessories");
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory("all"); // Reset subcategory when changing category
                    if (isAccessoriesCat) {
                      setStockFilter("all"); // Reset stock filter for accessories
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-600"
                  }`}
                >
                  {cat}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                    selectedCategory === cat
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Subcategories - shows when accessories category is selected and has subcategories */}
      {accessoriesSubcategories.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-600 mr-2">Дэд ангилал:</span>
            <button
              onClick={() => setSelectedSubcategory("all")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedSubcategory === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Бүгд
            </button>
            {accessoriesSubcategories.map((sub) => {
              const count = products.filter(p => 
                p.categories && p.categories.toLowerCase().includes(selectedCategory.toLowerCase()) &&
                p.name && p.name.toLowerCase().startsWith(sub.toLowerCase())
              ).length;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedSubcategory === sub
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {sub}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                    selectedSubcategory === sub
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters & Controls Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Stock Filter Tabs - hidden when accessories subcategory is shown */}
          {accessoriesSubcategories.length === 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600 mr-2">Үлдэгдэл:</span>
              {stockFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStockFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    stockFilter === filter.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200:bg-gray-600"
                  }`}
                >
                  {filter.label}
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded text-xs ${
                    stockFilter === filter.value
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Sort & View Controls */}
          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Эрэмбэлэх: {sortOptions.find(o => o.field === sortField)?.label}
                <svg className={`w-4 h-4 transition-transform ${showSortDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10">
                  {sortOptions.map((option) => (
                    <button
                      key={option.field}
                      onClick={() => {
                        if (sortField === option.field) {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortField(option.field);
                          setSortOrder("asc");
                        }
                        setShowSortDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100:bg-gray-700 ${
                        sortField === option.field ? "text-blue-600 font-medium" : "text-gray-700"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{option.icon}</span>
                        {option.label}
                      </span>
                      {sortField === option.field && (
                        <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700:text-gray-300"
                }`}
                title="Хүснэгт харагдац"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "table"
                    ? "bg-white shadow text-blue-600"
                    : "text-gray-500 hover:text-gray-700:text-gray-300"
                }`}
                title="Жагсаалт харагдац"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow border border-gray-200">
          <div className="text-4xl mb-3">📦</div>
          <p className="text-gray-500">Бүтээгдэхүүн олдсонгүй</p>
          <p className="text-sm text-gray-400 mt-1">Шүүлтүүрээ өөрчилж үзнэ үү</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock);
            const hasDiscount = product.salePrice !== null && product.price !== null && product.salePrice < product.price;
            
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all hover:border-blue-300:border-blue-600">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 flex-1 line-clamp-2">{product.name}</h3>
                  <div className={`w-2.5 h-2.5 rounded-full ml-2 mt-1.5 ${stockStatus.dot}`} title={stockStatus.text} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    {hasDiscount ? (
                      <>
                        <span className="text-lg font-bold text-red-600">
                          {formatCurrency(product.salePrice)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(product.price)}
                        </span>
                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                          -{Math.round(((product.price! - product.salePrice!) / product.price!) * 100)}%
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </div>
                  
                  {product.categories && (
                    <div className="flex flex-wrap gap-1">
                      {product.categories.split(',').slice(0, 2).map((cat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-lg"
                        >
                          {cat.trim()}
                        </span>
                      ))}
                      {product.categories.split(',').length > 2 && (
                        <span className="px-2 py-0.5 text-gray-400 text-xs">
                          +{product.categories.split(',').length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className={`px-2 py-1 text-xs rounded-lg font-medium ${stockStatus.class}`}>
                      {stockStatus.text}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.stock !== null ? `${product.stock} ширхэг` : 'Тодорхойгүй'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Бүтээгдэхүүн
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ангилал
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Үнэ
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Үлдэгдэл
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Төлөв
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                const hasDiscount = product.salePrice !== null && product.price !== null && product.salePrice < product.price;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.categories?.split(',').slice(0, 2).map((cat, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {cat.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasDiscount ? (
                        <div>
                          <span className="text-sm font-bold text-red-600">{formatCurrency(product.salePrice)}</span>
                          <span className="block text-xs text-gray-400 line-through">{formatCurrency(product.price)}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600">
                        {product.stock !== null ? product.stock : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${stockStatus.class}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stockStatus.dot}`} />
                        {stockStatus.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination - hidden when any filter is active */}
      {!isFilterActive && pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => fetchProducts(pagination.page - 1, search, category)}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50:bg-gray-700 transition-colors"
          >
            Өмнөх
          </button>
          <span className="px-4 py-2">
            Хуудас {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => fetchProducts(pagination.page + 1, search, category)}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50:bg-gray-700 transition-colors"
          >
            Дараах
          </button>
        </div>
      )}
    </div>
  );
}
