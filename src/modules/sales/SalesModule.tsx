import React, { useState } from 'react';
import {
  FileText,
  Plus,
  ShoppingCart,
  Users,
  Search,
  CheckCircle,
  Printer,
  DollarSign,
  AlertCircle,
  X,
  CreditCard,
  Building,
  Receipt,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Invoice, Quotation, Customer, InvoiceLineItem } from '../../types/erp.ts';
import { PrintDocumentModal } from '../../components/common/PrintDocumentModal.tsx';

interface SalesModuleProps {
  initialSubTab?: string;
  triggerNewInvoice?: boolean;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  initialSubTab = 'invoices',
  triggerNewInvoice = false,
}) => {
  const {
    invoices,
    quotations,
    salesOrders,
    customers,
    products,
    postInvoice,
    recordPayment,
    createQuotation,
    convertQuoteToOrder,
    createCustomer,
    activeWarehouse,
    formatCurrency,
    formatDate,
    currentUser,
    hasPermission,
    settings,
    accounts,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Document Printing
  const [showInvoiceModal, setShowInvoiceModal] = useState(triggerNewInvoice);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);
  const [printDocument, setPrintDocument] = useState<{
    type: 'invoice' | 'quote' | 'receipt';
    data: any;
  } | null>(null);

  // New Invoice Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [invoiceType, setInvoiceType] = useState<'credit' | 'cash' | 'bank_transfer' | 'mobile_money'>('credit');
  const [invoiceItems, setInvoiceItems] = useState<
    { productId: string; quantity: number; unitPrice: number }[]
  >([{ productId: products[0]?.id || '', quantity: 1, unitPrice: products[0]?.sellingPrice || 0 }]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [bankAccountChoice, setBankAccountChoice] = useState('acc_1020'); // Stanbic Bank
  const [payRef, setPayRef] = useState('');

  // New Customer Form State
  const [custForm, setCustForm] = useState({
    code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: 'Kampala',
    tin: '',
    creditLimit: 10000000,
    paymentTermsDays: 14,
  });

  // Calculate invoice live summary
  const calculatedItems: InvoiceLineItem[] = invoiceItems
    .map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return null;
      const subtotal = item.quantity * item.unitPrice;
      const taxRate = prod.taxRate || 0;
      const taxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0;
      return {
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        unit: prod.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate,
        taxAmount,
        subtotal,
        total: subtotal + taxAmount,
        costPrice: prod.costPrice,
      };
    })
    .filter(Boolean) as InvoiceLineItem[];

  const invoiceSubtotal = calculatedItems.reduce((acc, i) => acc + i.subtotal, 0);
  const invoiceTax = calculatedItems.reduce((acc, i) => acc + i.taxAmount, 0);
  const invoiceTotal = invoiceSubtotal + invoiceTax;

  const handlePostNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    const isImmediateSettlement = invoiceType !== 'credit';
    const amountPaid = isImmediateSettlement ? invoiceTotal : 0;
    const balanceDue = isImmediateSettlement ? 0 : invoiceTotal;

    const newInv = postInvoice({
      customerId: cust.id,
      customerName: cust.name,
      customerTin: cust.tin,
      warehouseId: activeWarehouse.id,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + cust.paymentTermsDays * 86400000).toISOString().split('T')[0],
      status: isImmediateSettlement ? 'paid' : 'posted',
      items: calculatedItems,
      subtotal: invoiceSubtotal,
      taxAmount: invoiceTax,
      discountAmount: 0,
      totalAmount: invoiceTotal,
      amountPaid,
      balanceDue,
      paymentType: invoiceType,
      salesRepId: currentUser.id,
      salesRepName: currentUser.name,
      notes: `Sales transaction recorded at ${activeWarehouse.name}`,
    });

    setShowInvoiceModal(false);
    // Open printable document directly
    setPrintDocument({ type: 'invoice', data: newInv });
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;

    const rct = recordPayment(
      selectedInvoiceForPay.id,
      Number(paymentAmount),
      'bank_transfer',
      bankAccountChoice,
      payRef,
      'Settlement via bank transfer'
    );

    setShowPaymentModal(false);
    setSelectedInvoiceForPay(null);
    setPrintDocument({ type: 'receipt', data: rct });
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer({
      ...custForm,
      creditLimit: Number(custForm.creditLimit),
      currentBalance: 0,
      active: true,
    });
    setShowCustomerModal(false);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Sales Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'invoices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Invoices & Counter POS ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('quotations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'quotations'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Quotations & Orders ({quotations.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'customers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Customers & Receivables ({customers.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('sales', 'create') && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Create Tax Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: INVOICES & POS */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices by customer or INV #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span>
                Total Outstanding Receivables:{' '}
                <strong className="text-amber-800 font-mono">
                  {formatCurrency(
                    invoices.reduce((acc, inv) => acc + inv.balanceDue, 0)
                  )}
                </strong>
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Date & Due Date</th>
                    <th className="py-3 px-4 text-center">Type</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">VAT (18%)</th>
                    <th className="py-3 px-4 text-right">Grand Total (UGX)</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{inv.customerName}</p>
                        <p className="text-[10px] text-slate-500">Sales Rep: {inv.salesRepName}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-700">{formatDate(inv.issueDate)}</p>
                        <p className="text-[10px] text-rose-600">Due: {formatDate(inv.dueDate)}</p>
                      </td>
                      <td className="py-3 px-4 text-center capitalize font-medium text-slate-600">
                        {inv.paymentType.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(inv.subtotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(inv.taxAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {inv.balanceDue > 0 ? (
                          <span className="text-rose-700">{formatCurrency(inv.balanceDue)}</span>
                        ) : (
                          <span className="text-emerald-700">Settled</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {inv.balanceDue > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForPay(inv);
                              setPaymentAmount(inv.balanceDue);
                              setShowPaymentModal(true);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-2 py-1 rounded text-[11px]"
                            title="Record Customer Payment"
                          >
                            + Pay
                          </button>
                        )}
                        <button
                          onClick={() => setPrintDocument({ type: 'invoice', data: inv })}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-1"
                          title="Print Formal Invoice"
                        >
                          <Printer size={12} />
                          <span>Print</span>
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

      {/* TAB 2: QUOTATIONS & ORDERS */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <p className="text-slate-600">
              Prepare proforma invoices and quotations, then convert directly into confirmed Sales Orders.
            </p>
            <button
              onClick={() => setShowQuoteModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus size={14} /> + New Quotation
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {quotations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <ShoppingCart size={32} className="mx-auto mb-2 text-slate-300" />
                <p>No sales quotations prepared yet. Click "+ New Quotation" to begin.</p>
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="py-3 px-4">Quote #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Valid Until</th>
                    <th className="py-3 px-4 text-right">Total Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotations.map((q) => (
                    <tr key={q.id}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{q.quoteNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{q.customerName}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(q.validUntil)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(q.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {q.status !== 'converted' && (
                          <button
                            onClick={() => convertQuoteToOrder(q.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[11px]"
                          >
                            Convert to Order →
                          </button>
                        )}
                        <button
                          onClick={() => setPrintDocument({ type: 'quote', data: q })}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-[11px]"
                        >
                          Print Quote
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMERS & RECEIVABLES */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <p className="text-slate-600 font-medium">
              Registered Commercial Customers, Credit Limits, and Outstanding Ledger Balances
            </p>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus size={14} /> + Add Customer
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Customer Name & Contact</th>
                  <th className="py-3 px-4">URA TIN</th>
                  <th className="py-3 px-4">Terms</th>
                  <th className="py-3 px-4 text-right">Credit Limit (UGX)</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4 text-center">Credit Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const creditUtilization = c.creditLimit > 0 ? (c.currentBalance / c.creditLimit) * 100 : 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{c.code}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {c.contactPerson} • {c.phone}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{c.tin || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-600">{c.paymentTermsDays} days</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        {c.creditLimit > 0 ? formatCurrency(c.creditLimit) : 'Cash Only'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {c.currentBalance > 0 ? (
                          <span className="text-rose-700">{formatCurrency(c.currentBalance)}</span>
                        ) : (
                          <span className="text-emerald-700">USh 0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {creditUtilization > 90 ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            Near Limit ({creditUtilization.toFixed(0)}%)
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            Good Standing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE TAX INVOICE */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Issue New Sales Tax Invoice</h3>
                <p className="text-[11px] text-slate-400">
                  Deducts stock automatically and generates balanced GL journal entries
                </p>
              </div>
              <button onClick={() => setShowInvoiceModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostNewInvoice} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Customer *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Bal: {formatCurrency(c.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method / Terms *</label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold outline-none"
                  >
                    <option value="credit">Credit Sale (Term Days)</option>
                    <option value="cash">Immediate Cash Payment</option>
                    <option value="bank_transfer">Bank EFT / Wire Transfer</option>
                    <option value="mobile_money">MTN / Airtel Mobile Money</option>
                  </select>
                </div>
              </div>

              {/* Line Items Builder */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Invoice Line Items</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 p-2 rounded-lg bg-slate-50">
                  {invoiceItems.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                        <div className="flex-1">
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const newItems = [...invoiceItems];
                              const selectedP = products.find((p) => p.id === e.target.value);
                              newItems[idx].productId = e.target.value;
                              if (selectedP) newItems[idx].unitPrice = selectedP.sellingPrice;
                              setInvoiceItems(newItems);
                            }}
                            className="w-full bg-transparent font-medium outline-none text-xs"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.currentStock} {p.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...invoiceItems];
                              newItems[idx].quantity = Number(e.target.value);
                              setInvoiceItems(newItems);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-right font-mono"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const newItems = [...invoiceItems];
                              newItems[idx].unitPrice = Number(e.target.value);
                              setInvoiceItems(newItems);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-right font-mono"
                            placeholder="Rate"
                          />
                        </div>
                        {invoiceItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceItems(invoiceItems.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setInvoiceItems([
                      ...invoiceItems,
                      {
                        productId: products[0]?.id || '',
                        quantity: 1,
                        unitPrice: products[0]?.sellingPrice || 0,
                      },
                    ])
                  }
                  className="mt-2 text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Plus size={12} /> Add Item Row
                </button>
              </div>

              {/* Invoice Calculation Totals */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-600">
                    Net Subtotal: <strong className="font-mono">{formatCurrency(invoiceSubtotal)}</strong>
                  </p>
                  <p className="text-slate-600">
                    VAT Output (18%): <strong className="font-mono">{formatCurrency(invoiceTax)}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-blue-900 uppercase">Grand Total (UGX)</span>
                  <p className="text-lg font-black font-mono text-blue-950">
                    {formatCurrency(invoiceTotal)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Post & Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {showPaymentModal && selectedInvoiceForPay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Customer Payment</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleRecordPaymentSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="font-bold text-slate-900 text-sm">
                  Invoice {selectedInvoiceForPay.invoiceNumber}
                </p>
                <p className="text-slate-600 mt-0.5">{selectedInvoiceForPay.customerName}</p>
                <div className="flex justify-between font-mono font-bold mt-2 pt-2 border-t border-slate-200">
                  <span>Balance Due:</span>
                  <span className="text-rose-700">{formatCurrency(selectedInvoiceForPay.balanceDue)}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Amount (UGX) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoiceForPay.balanceDue}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-base font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deposit To Account *</label>
                <select
                  value={bankAccountChoice}
                  onChange={(e) => setBankAccountChoice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium outline-none"
                >
                  <option value="acc_1010">Cash on Hand (Petty Cash Counter)</option>
                  <option value="acc_1020">Stanbic Bank Operational Account</option>
                  <option value="acc_1030">Centenary Bank / MTN Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Ref / Receipt Cheque #</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. EFT-STANBIC-9012"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Confirm & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOMER */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Register New Customer Account</h3>
              <button onClick={() => setShowCustomerModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Code *</label>
                  <input
                    type="text"
                    required
                    value={custForm.code}
                    onChange={(e) => setCustForm({ ...custForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">URA TIN Number</label>
                  <input
                    type="text"
                    value={custForm.tin}
                    onChange={(e) => setCustForm({ ...custForm, tin: e.target.value })}
                    placeholder="1009847261"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Customer Name *</label>
                <input
                  type="text"
                  required
                  value={custForm.name}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                  placeholder="e.g. Masaka Traders Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={custForm.contactPerson}
                    onChange={(e) => setCustForm({ ...custForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={custForm.phone}
                    onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                    placeholder="+256 700 000 000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Credit Limit (UGX)</label>
                  <input
                    type="number"
                    min="0"
                    value={custForm.creditLimit}
                    onChange={(e) => setCustForm({ ...custForm, creditLimit: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Term (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={custForm.paymentTermsDays}
                    onChange={(e) => setCustForm({ ...custForm, paymentTermsDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCustomerModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE DOCUMENT MODAL */}
      {printDocument && (
        <PrintDocumentModal
          documentType={printDocument.type}
          data={printDocument.data}
          onClose={() => setPrintDocument(null)}
        />
      )}
    </div>
  );
};
