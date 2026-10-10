import React from 'react';
import { Printer, X, CheckCircle, Download } from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Invoice, Quotation, PurchaseOrder, PaymentReceipt } from '../../types/erp.ts';

interface PrintDocumentModalProps {
  documentType: 'invoice' | 'quote' | 'po' | 'receipt';
  data: Invoice | Quotation | PurchaseOrder | PaymentReceipt | any;
  onClose: () => void;
}

export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  documentType,
  data,
  onClose,
}) => {
  const { settings, formatCurrency, formatDate } = useERP();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Actions (Hidden in print) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Document Preview
            </span>
            <span className="text-xs text-slate-400">• Ready for Print & PDF</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 overflow-y-auto flex-1 font-sans text-slate-800 print:p-0 print:m-0" id="printable-content">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-900 text-white font-extrabold text-2xl flex items-center justify-center">
                  P
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    {settings.name}
                  </h1>
                  <p className="text-xs font-medium text-slate-600">{settings.tradingName}</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-0.5">
                <p>{settings.address}, {settings.city}, {settings.country}</p>
                <p>Tel: {settings.phone} • Email: {settings.email}</p>
                <p className="font-semibold text-slate-800">
                  URA TIN: <span className="font-mono text-blue-900">{settings.tin}</span> • VAT Registered (18%)
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded">
                {documentType === 'invoice' && 'TAX INVOICE'}
                {documentType === 'quote' && 'PROFORMA / QUOTATION'}
                {documentType === 'po' && 'PURCHASE ORDER'}
                {documentType === 'receipt' && 'OFFICIAL RECEIPT'}
              </span>
              <p className="mt-3 text-base font-extrabold text-slate-900 font-mono">
                {data.invoiceNumber || data.quoteNumber || data.poNumber || data.receiptNumber}
              </p>
              <p className="text-xs text-slate-600">
                Date:{' '}
                <span className="font-medium">
                  {formatDate(data.issueDate || data.orderDate || data.paymentDate || data.createdAt)}
                </span>
              </p>
              {data.dueDate && (
                <p className="text-xs text-slate-600">
                  Due Date: <span className="font-semibold text-rose-700">{formatDate(data.dueDate)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Party Details */}
          <div className="grid grid-cols-2 gap-8 my-6 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                {documentType === 'po' ? 'SUPPLIER / VENDOR:' : 'CUSTOMER BILL TO:'}
              </p>
              <p className="text-sm font-bold text-slate-900">
                {data.customerName || data.supplierName || 'Cash Client'}
              </p>
              {data.customerTin && (
                <p className="text-slate-600 font-mono mt-0.5">TIN: {data.customerTin}</p>
              )}
              {data.paymentType && (
                <p className="text-slate-600 mt-1 capitalize font-medium">
                  Terms: {data.paymentType.replace('_', ' ')}
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">
                TRANSACTION STATUS & REFS:
              </p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Status:</span>
                  <span className="font-bold uppercase text-slate-900">
                    {data.status || 'PROCESSED'}
                  </span>
                </div>
                {data.referenceNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ref / Cheque:</span>
                    <span className="font-mono font-semibold">{data.referenceNumber}</span>
                  </div>
                )}
                {data.salesRepName && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sales Officer:</span>
                    <span className="font-medium">{data.salesRepName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table (For Invoice, PO, Quote) */}
          {data.items && data.items.length > 0 && (
            <div className="my-6">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-900 font-bold bg-slate-100">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Item Description & SKU</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Rate ({settings.currency})</th>
                    <th className="py-2.5 px-3 text-right">VAT</th>
                    <th className="py-2.5 px-3 text-right">Total ({settings.currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.items.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <p className="font-semibold text-slate-900">{item.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{item.sku}</p>
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600">{item.unit || '-'}</td>
                      <td className="py-2 px-3 text-right font-medium">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">
                        {(item.unitPrice || item.unitCost || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 font-mono">
                        {item.taxRate ? `${item.taxRate}%` : '0%'}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">
                        {(item.total || item.subtotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Receipt Direct Content */}
          {documentType === 'receipt' && (
            <div className="my-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CheckCircle size={28} className="text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-emerald-900">
                    Payment Received: {formatCurrency(data.amount)}
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Method: {data.paymentMethod?.toUpperCase()} • Applied to Invoice {data.invoiceNumber}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Totals Calculation Box */}
          <div className="flex justify-end my-6">
            <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Net):</span>
                <span className="font-mono font-medium">
                  {formatCurrency(data.subtotal || data.amount)}
                </span>
              </div>
              {data.taxAmount !== undefined && (
                <div className="flex justify-between text-slate-600">
                  <span>VAT Output Tax (18%):</span>
                  <span className="font-mono font-medium">{formatCurrency(data.taxAmount)}</span>
                </div>
              )}
              {data.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount Allowed:</span>
                  <span className="font-mono font-medium">-{formatCurrency(data.discountAmount)}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-800 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span className="font-mono text-blue-950 font-black">
                  {formatCurrency(data.totalAmount || data.amount)}
                </span>
              </div>
              {data.amountPaid !== undefined && (
                <>
                  <div className="flex justify-between text-emerald-700 font-medium pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono">{formatCurrency(data.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold border-t border-slate-200 pt-1">
                    <span>Balance Due:</span>
                    <span className="font-mono">{formatCurrency(data.balanceDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Banking & Settlement Instructions */}
          <div className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-6 text-xs text-slate-600">
            <div>
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                Settlement Bank Accounts (Uganda):
              </p>
              <p className="font-semibold text-slate-900">Stanbic Bank Uganda Ltd</p>
              <p>Account Name: Pearl Mercantile & Distributors Ltd</p>
              <p className="font-mono">Account No: 903001889201 (Forest Mall Branch)</p>
              <p className="mt-1 font-semibold text-slate-900">Centenary Bank / MTN MoMo Pay</p>
              <p className="font-mono">Merchant Code: 592811</p>
            </div>
            <div className="text-right flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                  Authorized Signatory:
                </p>
                <div className="h-12 border-b border-dashed border-slate-400 mt-2"></div>
                <p className="text-[10px] text-slate-500 mt-1">Finance & Accounting Department</p>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Thank you for your valued partnership. This is a computer-generated tax document.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
