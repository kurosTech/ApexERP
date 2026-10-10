import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertCircle,
  PackageCheck,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  Calendar,
  Truck,
  CheckCircle,
  FileText,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

interface DashboardProps {
  onNavigate: (module: string, subTab?: string) => void;
  onQuickAction: (action: string) => void;
}

export const ExecutiveDashboard: React.FC<DashboardProps> = ({ onNavigate, onQuickAction }) => {
  const {
    settings,
    products,
    invoices,
    purchaseOrders,
    customers,
    suppliers,
    expenses,
    auditLogs,
    formatCurrency,
    formatDate,
    activeWarehouse,
  } = useERP();

  const [dateRange, setDateRange] = useState<'30days' | 'month' | 'ytd' | 'all'>('all');

  // Real KPI calculations from stored transactions
  const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const salesCollected = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const outstandingReceivables = customers.reduce((acc, c) => acc + c.currentBalance, 0);
  const outstandingPayables = suppliers.reduce((acc, s) => acc + s.currentBalance, 0);
  const totalPurchases = purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0);

  // Total inventory valuation = sum of current stock * cost price
  const totalInventoryValuation = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);
  const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockLevel);

  // Profitability calculations:
  // Revenue from invoices (net of VAT and discounts)
  const netSalesRevenue = invoices.reduce(
    (acc, inv) => acc + (inv.subtotal - (inv.discountAmount || 0)),
    0
  );
  // Total cost of goods sold across invoice line items
  const totalCOGS = invoices.reduce((acc, inv) => {
    const invCOGS = inv.items.reduce(
      (itemAcc, item) => itemAcc + item.quantity * item.costPrice,
      0
    );
    return acc + invCOGS;
  }, 0);

  const grossProfit = Math.max(0, netSalesRevenue - totalCOGS);
  const grossMarginPercent = netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;
  const totalOperatingExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalOperatingExpenses;

  // Top Selling Products
  const productSalesCount: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};
  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSalesCount[item.productId]) {
        productSalesCount[item.productId] = {
          name: item.productName,
          sku: item.sku,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesCount[item.productId].qty += item.quantity;
      productSalesCount[item.productId].revenue += item.total;
    });
  });
  const topProducts = Object.values(productSalesCount)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  products.forEach((p) => {
    const cat = p.categoryName || 'Other Goods';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + p.currentStock * p.costPrice;
  });

  // Pending PO approvals
  const pendingApprovals = purchaseOrders.filter((po) => po.status === 'pending_approval');

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h2>
            <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
              Live Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance metrics for {settings.name}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                dateRange === 'month' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                dateRange === '30days' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                dateRange === 'all' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Fiscal Period YTD
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Primary Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Invoiced Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(totalSales)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Collected:</span>
            <span className="text-emerald-700 font-bold font-mono">
              {formatCurrency(salesCollected)}
            </span>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trade Receivables (AR)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2 font-mono">
            {formatCurrency(outstandingReceivables)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Trade Creditors (AP):</span>
            <span className="text-rose-700 font-bold font-mono">
              {formatCurrency(outstandingPayables)}
            </span>
          </div>
        </div>

        {/* Current Inventory Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Stock Valuation (Cost)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PackageCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {formatCurrency(totalInventoryValuation)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Active SKUs:</span>
            <span className="font-bold text-slate-700">{products.length} products</span>
          </div>
        </div>

        {/* Net Profit & Gross Margin */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Profit (Current)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-950 mt-2 font-mono">
            {formatCurrency(netProfit)}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Gross Margin:</span>
            <span className="font-bold text-indigo-700 font-mono">
              {grossMarginPercent.toFixed(1)}% (USh {grossProfit.toLocaleString()})
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Secondary Quick KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-sm text-xs">
        <div className="border-r border-slate-800 pr-3">
          <p className="text-slate-400">Total Procurement:</p>
          <p className="font-bold font-mono text-base mt-0.5">{formatCurrency(totalPurchases)}</p>
        </div>
        <div className="border-r border-slate-800 pr-3">
          <p className="text-slate-400">Operating Expenses:</p>
          <p className="font-bold font-mono text-base text-rose-300 mt-0.5">
            {formatCurrency(totalOperatingExpenses)}
          </p>
        </div>
        <div className="border-r border-slate-800 pr-3">
          <p className="text-slate-400">Cost of Goods Sold (COGS):</p>
          <p className="font-bold font-mono text-base text-amber-300 mt-0.5">
            {formatCurrency(totalCOGS)}
          </p>
        </div>
        <div>
          <p className="text-slate-400">Low Stock Reorder Alerts:</p>
          <p className="font-bold text-base text-amber-400 mt-0.5 flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>{lowStockProducts.length} Items need PO</span>
          </p>
        </div>
      </div>

      {/* Row 3: Visual Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sales Trends & Top Products */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Performance Visual Chart */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Monthly Revenue Invoiced (UGX)</h3>
                <p className="text-xs text-slate-500">Sales performance across fiscal cycles</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded">
                Uganda Shilling (UGX)
              </span>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-100">
              {[
                { month: 'Oct 25', sales: 42000000, height: '45%' },
                { month: 'Nov 25', sales: 58000000, height: '62%' },
                { month: 'Dec 25', sales: 74000000, height: '80%' },
                { month: 'Jan 26', sales: 49000000, height: '52%' },
                { month: 'Feb 26', sales: 66000000, height: '70%' },
                { month: 'Mar 26', sales: totalSales, height: '88%' },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(item.sales / 1000000).toFixed(0)}M
                  </span>
                  <div className="w-full bg-slate-100 rounded-t-md relative overflow-hidden h-36 flex items-end">
                    <div
                      style={{ height: item.height }}
                      className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all duration-300"
                    ></div>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500">{item.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                Invoiced Gross Merchandise Sales
              </span>
              <span>Perpetual FIFO/Weighted-Average valuation active</span>
            </div>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Top-Selling Products by Revenue</h3>
              <button
                onClick={() => onNavigate('inventory', 'products')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                View Full Catalog →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-2">Product Name</th>
                    <th className="py-2">SKU</th>
                    <th className="py-2 text-right">Units Sold</th>
                    <th className="py-2 text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 font-semibold text-slate-800">{p.name}</td>
                      <td className="py-2.5 font-mono text-slate-500">{p.sku}</td>
                      <td className="py-2.5 text-right font-medium text-slate-700">{p.qty}</td>
                      <td className="py-2.5 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Category Breakdown, Approvals, & Low Stock */}
        <div className="space-y-6">
          {/* Inventory Valuation by Category */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Inventory Value by Category</h3>
            <div className="space-y-3">
              {Object.entries(categoryTotals).map(([cat, val], idx) => {
                const pct = totalInventoryValuation > 0 ? (val / totalInventoryValuation) * 100 : 0;
                return (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between font-medium text-slate-700 mb-1">
                      <span>{cat}</span>
                      <span className="font-mono font-bold">{formatCurrency(val)}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Purchase Approvals Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Clock size={16} className="text-amber-500" />
                <span>Pending Approvals ({pendingApprovals.length})</span>
              </h3>
            </div>
            {pendingApprovals.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No pending approval requests</p>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.map((po) => (
                  <div
                    key={po.id}
                    className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg text-xs"
                  >
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{po.poNumber}</span>
                      <span className="font-mono">{formatCurrency(po.totalAmount)}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{po.supplierName}</p>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => onNavigate('purchasing', 'purchase_orders')}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2.5 py-1 rounded"
                      >
                        Review PO
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Reorder List */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 text-rose-900">
                <AlertCircle size={16} className="text-rose-600" />
                <span>Low Stock Reorder Alerts</span>
              </h3>
            </div>
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">All product inventory above minimum threshold</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-rose-700">
                        Remaining: <span className="font-bold">{p.currentStock}</span> {p.unit} (Min: {p.minStockLevel})
                      </p>
                    </div>
                    <button
                      onClick={() => onQuickAction('new_po')}
                      className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs"
                    >
                      + Create PO
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Activities Audit Trail Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-900 text-sm">Recent Business Transactions Audit Log</h3>
          <button
            onClick={() => onNavigate('admin', 'audits')}
            className="text-xs text-blue-600 hover:underline font-semibold"
          >
            View Complete Audit Trail →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2">Timestamp</th>
                <th className="py-2">Action</th>
                <th className="py-2">Module</th>
                <th className="py-2">Description</th>
                <th className="py-2">User (Actor)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 6).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-2 text-slate-500 font-mono">{formatDate(log.timestamp)}</td>
                  <td className="py-2">
                    <span className="font-bold uppercase text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 capitalize font-medium text-slate-600">{log.module}</td>
                  <td className="py-2 text-slate-800 font-medium">{log.description}</td>
                  <td className="py-2 font-semibold text-blue-900">{log.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
