import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Package,
  Users,
  CreditCard,
  Building,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

export const ReportsModule: React.FC = () => {
  const {
    invoices,
    products,
    stockMovements,
    purchaseOrders,
    customers,
    suppliers,
    formatCurrency,
    formatDate,
    settings,
  } = useERP();

  const [selectedReport, setSelectedReport] = useState<
    'sales' | 'inventory' | 'purchases' | 'receivables' | 'payables'
  >('sales');

  const [dateFilter, setDateFilter] = useState<'30days' | '90days' | 'all'>('all');

  // CSV Export utility
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrent = () => {
    if (selectedReport === 'sales') {
      const headers = ['Invoice Number', 'Customer Name', 'Issue Date', 'Subtotal (UGX)', 'VAT 18% (UGX)', 'Total Amount (UGX)', 'Amount Paid (UGX)', 'Balance Due (UGX)', 'Status'];
      const rows = invoices.map((i) => [
        i.invoiceNumber,
        i.customerName,
        i.issueDate,
        i.subtotal,
        i.taxAmount,
        i.totalAmount,
        i.amountPaid,
        i.balanceDue,
        i.status,
      ]);
      downloadCSV('Sales_Tax_Invoices_Report', headers, rows);
    } else if (selectedReport === 'inventory') {
      const headers = ['SKU', 'Product Name', 'Category', 'Unit', 'Cost Price (UGX)', 'Selling Price (UGX)', 'Current Stock', 'Total Valuation (UGX)'];
      const rows = products.map((p) => [
        p.sku,
        p.name,
        p.categoryName || 'General',
        p.unit,
        p.costPrice,
        p.sellingPrice,
        p.currentStock,
        p.currentStock * p.costPrice,
      ]);
      downloadCSV('Inventory_Valuation_Report', headers, rows);
    } else if (selectedReport === 'purchases') {
      const headers = ['PO Number', 'Supplier Name', 'Order Date', 'Total Value (UGX)', 'Status', 'Approved By'];
      const rows = purchaseOrders.map((po) => [
        po.poNumber,
        po.supplierName,
        po.orderDate,
        po.totalAmount,
        po.status,
        po.approvedBy || 'Pending',
      ]);
      downloadCSV('Purchasing_Orders_Report', headers, rows);
    } else if (selectedReport === 'receivables') {
      const headers = ['Customer Code', 'Customer Name', 'TIN', 'Phone', 'Credit Limit (UGX)', 'Outstanding Receivables (UGX)', 'Payment Terms'];
      const rows = customers.map((c) => [
        c.code,
        c.name,
        c.tin || 'N/A',
        c.phone,
        c.creditLimit,
        c.currentBalance,
        `${c.paymentTermsDays} days`,
      ]);
      downloadCSV('Customer_Aged_Receivables_Report', headers, rows);
    } else if (selectedReport === 'payables') {
      const headers = ['Supplier Code', 'Supplier Name', 'TIN', 'Phone', 'Payment Terms', 'Outstanding Payables (UGX)'];
      const rows = suppliers.map((s) => [
        s.code,
        s.name,
        s.tin || 'N/A',
        s.phone,
        `${s.paymentTermsDays} days`,
        s.currentBalance,
      ]);
      downloadCSV('Supplier_Aged_Payables_Report', headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Report Type Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Business Reports & Data Export</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational summaries, inventory reconciliations, aged balances, and CSV exports for {settings.name}
          </p>
        </div>

        <button
          onClick={handleExportCurrent}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
        >
          <Download size={14} />
          <span>Export to CSV File</span>
        </button>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-xs">
        {[
          { id: 'sales', label: 'Sales & Revenue Summary', icon: TrendingUp },
          { id: 'inventory', label: 'Inventory Stock Valuation', icon: Package },
          { id: 'purchases', label: 'Purchasing & Procurement', icon: BarChart3 },
          { id: 'receivables', label: 'Customer Receivables (AR)', icon: Users },
          { id: 'payables', label: 'Supplier Payables (AP)', icon: CreditCard },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedReport(item.id as any)}
              className={`px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors ${
                selectedReport === item.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT VIEW 1: SALES & REVENUE */}
      {selectedReport === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500">Total Invoiced:</span>
              <p className="text-xl font-black font-mono text-slate-900 mt-1">
                {formatCurrency(invoices.reduce((acc, i) => acc + i.totalAmount, 0))}
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500">Collected Cash:</span>
              <p className="text-xl font-black font-mono text-emerald-700 mt-1">
                {formatCurrency(invoices.reduce((acc, i) => acc + i.amountPaid, 0))}
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500">Outstanding Uncollected:</span>
              <p className="text-xl font-black font-mono text-rose-700 mt-1">
                {formatCurrency(invoices.reduce((acc, i) => acc + i.balanceDue, 0))}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">VAT (18%)</th>
                  <th className="py-3 px-4 text-right">Total (UGX)</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.customerName}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{formatDate(inv.issueDate)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">{formatCurrency(inv.taxAmount)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-medium">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(inv.balanceDue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT VIEW 2: INVENTORY VALUATION */}
      {selectedReport === 'inventory' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-right">Stock Qty</th>
                  <th className="py-3 px-4 text-right">Weighted Cost (UGX)</th>
                  <th className="py-3 px-4 text-right">Retail Rate (UGX)</th>
                  <th className="py-3 px-4 text-right">Total Cost Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{p.sku}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.categoryName || 'General'}</td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600">{p.unit}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {p.currentStock}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {p.costPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {p.sellingPrice.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-900">
                      {formatCurrency(p.currentStock * p.costPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT VIEW 3: PURCHASING & PROCUREMENT */}
      {selectedReport === 'purchases' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">PO #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-right">Total Value (UGX)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Approved By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.map((po) => (
                  <tr key={po.id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{po.poNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{po.supplierName}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{formatDate(po.orderDate)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100">
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{po.approvedBy || 'Pending'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT VIEW 4: AGED RECEIVABLES */}
      {selectedReport === 'receivables' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Customer Code</th>
                  <th className="py-3 px-4">Company Name</th>
                  <th className="py-3 px-4">TIN</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-right">Credit Limit (UGX)</th>
                  <th className="py-3 px-4 text-right">Receivables Balance</th>
                  <th className="py-3 px-4">Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{c.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{c.tin || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(c.creditLimit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(c.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.paymentTermsDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT VIEW 5: AGED PAYABLES */}
      {selectedReport === 'payables' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Supplier Code</th>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">TIN</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Terms</th>
                  <th className="py-3 px-4 text-right">Payables Balance (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{s.tin || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{s.phone}</td>
                    <td className="py-3 px-4 text-slate-600">{s.paymentTermsDays} days</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(s.currentBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
