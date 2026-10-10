import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  Search,
  Filter,
  AlertTriangle,
  Building,
  CheckCircle,
  X,
  FileSpreadsheet,
  TrendingDown,
  TrendingUp,
  PackageCheck,
  Edit2,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Product, StockMovementType } from '../../types/erp.ts';

interface InventoryModuleProps {
  initialSubTab?: string;
  onOpenCreatePO?: () => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  initialSubTab = 'products',
  onOpenCreatePO,
}) => {
  const {
    products,
    createProduct,
    updateProduct,
    recordStockAdjustment,
    stockMovements,
    warehouses,
    activeWarehouse,
    formatCurrency,
    formatDate,
    hasPermission,
    settings,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedProductForAdj, setSelectedProductForAdj] = useState<Product | null>(null);
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('Periodic Physical Stock Count');

  // New/Edit product form state
  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: 'cat_grains',
    categoryName: 'Grains & Flours',
    unit: '50kg Bag',
    costPrice: 80000,
    sellingPrice: 100000,
    wholesalePrice: 95000,
    minStockLevel: 20,
    currentStock: 0,
    taxRate: 18,
    description: '',
  });

  const categories = [
    { id: 'cat_sugar', name: 'Sugar & Sweeteners' },
    { id: 'cat_grains', name: 'Grains & Flours' },
    { id: 'cat_oils', name: 'Edible Oils & Fats' },
    { id: 'cat_building', name: 'Building & Hardware' },
    { id: 'cat_cleaning', name: 'Soaps & Detergents' },
  ];

  // Filtering products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
    const matchesLowStock = !filterLowStockOnly || p.currentStock <= p.minStockLevel;
    return matchesSearch && matchesCat && matchesLowStock;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setProdForm({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: '',
      categoryId: 'cat_grains',
      categoryName: 'Grains & Flours',
      unit: '50kg Bag',
      costPrice: 50000,
      sellingPrice: 65000,
      wholesalePrice: 60000,
      minStockLevel: 20,
      currentStock: 0,
      taxRate: 18,
      description: '',
    });
    setShowProductModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      categoryId: p.categoryId,
      categoryName: p.categoryName || 'General',
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      wholesalePrice: p.wholesalePrice || p.sellingPrice,
      minStockLevel: p.minStockLevel,
      currentStock: p.currentStock,
      taxRate: p.taxRate,
      description: p.description || '',
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name: prodForm.name,
        categoryName: categories.find((c) => c.id === prodForm.categoryId)?.name,
        categoryId: prodForm.categoryId,
        unit: prodForm.unit,
        costPrice: Number(prodForm.costPrice),
        sellingPrice: Number(prodForm.sellingPrice),
        wholesalePrice: Number(prodForm.wholesalePrice),
        minStockLevel: Number(prodForm.minStockLevel),
        taxRate: Number(prodForm.taxRate),
        description: prodForm.description,
      });
    } else {
      createProduct({
        ...prodForm,
        categoryName: categories.find((c) => c.id === prodForm.categoryId)?.name,
        costPrice: Number(prodForm.costPrice),
        sellingPrice: Number(prodForm.sellingPrice),
        wholesalePrice: Number(prodForm.wholesalePrice),
        minStockLevel: Number(prodForm.minStockLevel),
        currentStock: Number(prodForm.currentStock),
        taxRate: Number(prodForm.taxRate),
        active: true,
      });
    }
    setShowProductModal(false);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdj) return;
    recordStockAdjustment(
      selectedProductForAdj.id,
      activeWarehouse.id,
      Number(adjQty),
      adjReason
    );
    setShowAdjustmentModal(false);
    setSelectedProductForAdj(null);
  };

  return (
    <div className="space-y-6">
      {/* Module Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Products & Pricing ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'movements'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Stock Movement Ledger ({stockMovements.length})
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'warehouses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Warehouses & Stock Valuation
          </button>
        </div>

        {hasPermission('inventory', 'create') && (
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      {/* TAB 1: PRODUCTS & PRICING */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by SKU or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-medium text-slate-700"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                  filterLowStockOnly
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <AlertTriangle size={13} />
                <span>Low Stock Only</span>
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">SKU / Code</th>
                    <th className="py-3 px-4">Product Name & Category</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-right">Cost Price (UGX)</th>
                    <th className="py-3 px-4 text-right">Selling Price (UGX)</th>
                    <th className="py-3 px-4 text-right">Stock Level</th>
                    <th className="py-3 px-4 text-right">Valuation (UGX)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => {
                    const isLowStock = p.currentStock <= p.minStockLevel;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.sku}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-500">{p.categoryName || 'General'}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-medium text-slate-600">{p.unit}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {p.costPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {p.sellingPrice.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`font-bold font-mono ${
                              isLowStock ? 'text-rose-600' : 'text-slate-800'
                            }`}
                          >
                            {p.currentStock}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Min: {p.minStockLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">
                          {formatCurrency(p.currentStock * p.costPrice)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isLowStock ? (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <AlertTriangle size={10} /> REORDER
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              IN STOCK
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <button
                            onClick={() => {
                              setSelectedProductForAdj(p);
                              setAdjQty(0);
                              setShowAdjustmentModal(true);
                            }}
                            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded"
                            title="Adjust Stock Quantity"
                          >
                            Adjust
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded"
                            title="Edit Product"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENT LEDGER */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Traceable Inventory Movement Ledger</p>
              <p className="text-[11px] text-blue-700">
                Every stock addition, delivery, physical count adjustment, and return is permanently recorded with full audit trail.
              </p>
            </div>
            <span className="font-mono font-bold bg-white px-2.5 py-1 rounded shadow-xs">
              {stockMovements.length} Movement Records
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Product Name & SKU</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Balance After</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4">Document Ref</th>
                    <th className="py-3 px-4">Officer (User)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockMovements.map((sm) => {
                    const isPositive = ['goods_receipt', 'adjustment_in', 'transfer_in', 'return_in'].includes(
                      sm.type
                    );
                    return (
                      <tr key={sm.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono text-slate-500">{formatDate(sm.createdAt)}</td>
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-slate-900">{sm.productName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{sm.productSku}</p>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                            {sm.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-mono font-bold ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? '+' : '-'}
                          {sm.quantity}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {sm.balanceAfter}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                          {sm.unitCost.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(sm.totalCost)}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-700 font-semibold">
                          {sm.referenceNumber}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">{sm.createdBy}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WAREHOUSES & STOCK VALUATION */}
      {activeTab === 'warehouses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {warehouses.map((wh) => {
              const whStockVal = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
              return (
                <div key={wh.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-blue-600">{wh.code}</span>
                    {wh.isDefault && (
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Primary Depot
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{wh.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{wh.location}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Warehouse Valuation:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(whStockVal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Physical Stock Count Reconciliation */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-2">
              Physical Stock Count Reconciliation
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perform physical inventory counting and reconcile discrepancies with the perpetual general ledger.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-right">System Balance</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost (UGX)</th>
                    <th className="py-2.5 px-3 text-right">Total Book Value</th>
                    <th className="py-2.5 px-3 text-right">Reconcile Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700">{p.sku}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        {p.currentStock} {p.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">
                        {p.costPrice.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.currentStock * p.costPrice)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedProductForAdj(p);
                            setAdjQty(0);
                            setShowAdjustmentModal(true);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-[11px]"
                        >
                          Record Count / Adjustment
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.sku}
                    onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-blue-500"
                    placeholder="e.g. SUG-KKR-50K"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    value={prodForm.barcode}
                    onChange={(e) => setProdForm({ ...prodForm, barcode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none focus:border-blue-500"
                    placeholder="e.g. 616400010012"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none focus:border-blue-500 font-semibold"
                  placeholder="e.g. Tororo Portland Pozzolana Cement 32.5R"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit of Measure *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.unit}
                    onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
                    placeholder="50kg Bag, 20L Jerrycan, Piece"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cost Price (UGX) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodForm.costPrice}
                    onChange={(e) => setProdForm({ ...prodForm, costPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Retail Price (UGX) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={prodForm.sellingPrice}
                    onChange={(e) => setProdForm({ ...prodForm, sellingPrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Wholesale (UGX)</label>
                  <input
                    type="number"
                    min="0"
                    value={prodForm.wholesalePrice}
                    onChange={(e) => setProdForm({ ...prodForm, wholesalePrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    value={prodForm.minStockLevel}
                    onChange={(e) => setProdForm({ ...prodForm, minStockLevel: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none"
                  />
                </div>
                {!editingProduct && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Opening Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={prodForm.currentStock}
                      onChange={(e) => setProdForm({ ...prodForm, currentStock: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax Category</label>
                  <select
                    value={prodForm.taxRate}
                    onChange={(e) => setProdForm({ ...prodForm, taxRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none"
                  >
                    <option value={18}>Standard VAT (18%)</option>
                    <option value={0}>Zero-Rated / Exempt (0%)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENT */}
      {showAdjustmentModal && selectedProductForAdj && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Stock Adjustment & Variance</h3>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-900 text-sm">{selectedProductForAdj.name}</p>
                <p className="text-slate-500 font-mono mt-0.5">SKU: {selectedProductForAdj.sku}</p>
                <p className="text-blue-900 font-bold mt-1">
                  Current System Stock: {selectedProductForAdj.currentStock} {selectedProductForAdj.unit}
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Quantity to Adjust (+ to add, - to deduct) *
                </label>
                <input
                  type="number"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-base font-bold outline-none focus:border-blue-500"
                  placeholder="+10 or -5"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  New stock balance will become:{' '}
                  <span className="font-bold text-slate-900">
                    {selectedProductForAdj.currentStock + Number(adjQty)} {selectedProductForAdj.unit}
                  </span>
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reason / Reference *</label>
                <select
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none font-medium mb-2"
                >
                  <option value="Periodic Physical Stock Count">Periodic Physical Stock Count</option>
                  <option value="Damaged / Expired Goods Write-off">Damaged / Expired Goods Write-off</option>
                  <option value="Supplier Bonus / Uninvoiced Excess">Supplier Bonus / Uninvoiced Excess</option>
                  <option value="Internal Store Transfer / Breakage">Internal Store Transfer / Breakage</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle size={12} className="text-amber-700" /> Automated Double-Entry Posting:
                </p>
                <p className="mt-0.5">
                  This adjustment will atomically generate a balanced GL journal entry between
                  Inventory Asset (1050) and Cost of Goods Sold / Inventory Variance (5010).
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjQty === 0}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-xs"
                >
                  Post Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
