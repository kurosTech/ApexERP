import React, { useState } from 'react';
import {
  Truck,
  Plus,
  ClipboardList,
  Users,
  Search,
  CheckCircle,
  Clock,
  Printer,
  X,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { PurchaseOrder, POLineItem, Supplier, GoodsReceiptNote } from '../../types/erp.ts';
import { PrintDocumentModal } from '../../components/common/PrintDocumentModal.tsx';

interface PurchasingModuleProps {
  initialSubTab?: string;
  triggerNewPO?: boolean;
}

export const PurchasingModule: React.FC<PurchasingModuleProps> = ({
  initialSubTab = 'purchase_orders',
  triggerNewPO = false,
}) => {
  const {
    purchaseOrders,
    goodsReceipts,
    suppliers,
    products,
    createPurchaseOrder,
    approvePurchaseOrder,
    receiveGoods,
    createSupplier,
    activeWarehouse,
    formatCurrency,
    formatDate,
    currentUser,
    hasPermission,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showPOModal, setShowPOModal] = useState(triggerNewPO);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [selectedPOForGRN, setSelectedPOForGRN] = useState<PurchaseOrder | null>(null);
  const [printDocument, setPrintDocument] = useState<{ type: 'po'; data: any } | null>(null);

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<
    { productId: string; quantity: number; unitCost: number }[]
  >([{ productId: products[0]?.id || '', quantity: 50, unitCost: products[0]?.costPrice || 0 }]);
  const [poNotes, setPoNotes] = useState('');

  // GRN Receipt Quantities State
  const [receivedQtys, setReceivedQtys] = useState<Record<string, number>>({});
  const [grnNotes, setGrnNotes] = useState('Offloaded, inspected, and verified intact.');

  // Supplier Form State
  const [suppForm, setSuppForm] = useState({
    code: `SUPP-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    tin: '',
    paymentTermsDays: 30,
  });

  // Calculate PO Totals
  const calculatedLines: POLineItem[] = poItems
    .map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return null;
      return {
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        unit: prod.unit,
        quantity: item.quantity,
        unitCost: item.unitCost,
        subtotal: item.quantity * item.unitCost,
        receivedQty: 0,
      };
    })
    .filter(Boolean) as POLineItem[];

  const poSubtotal = calculatedLines.reduce((acc, l) => acc + l.subtotal, 0);
  const poTax = (poSubtotal * 18) / 100;
  const poTotal = poSubtotal + poTax;

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const supp = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supp) return;

    const newPO = createPurchaseOrder({
      supplierId: supp.id,
      supplierName: supp.name,
      warehouseId: activeWarehouse.id,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: 'pending_approval',
      items: calculatedLines,
      subtotal: poSubtotal,
      taxAmount: poTax,
      totalAmount: poTotal,
      notes: poNotes,
    });

    setShowPOModal(false);
    setPrintDocument({ type: 'po', data: newPO });
  };

  const handleOpenGRNModal = (po: PurchaseOrder) => {
    setSelectedPOForGRN(po);
    const initialQtys: Record<string, number> = {};
    po.items.forEach((item) => {
      const remaining = item.quantity - (item.receivedQty || 0);
      initialQtys[item.productId] = Math.max(0, remaining);
    });
    setReceivedQtys(initialQtys);
    setShowGRNModal(true);
  };

  const handleConfirmGRN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOForGRN) return;

    const itemsToReceive = selectedPOForGRN.items.map((item) => ({
      productId: item.productId,
      quantityReceived: Number(receivedQtys[item.productId] || 0),
      unitCost: item.unitCost,
    }));

    receiveGoods(selectedPOForGRN.id, itemsToReceive, activeWarehouse.id, grnNotes);
    setShowGRNModal(false);
    setSelectedPOForGRN(null);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplier({
      ...suppForm,
      currentBalance: 0,
      active: true,
    });
    setShowSupplierModal(false);
  };

  const filteredPOs = purchaseOrders.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Purchasing Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('purchase_orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'purchase_orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Purchase Orders ({purchaseOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'receipts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Goods Received Notes (GRN) ({goodsReceipts.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'suppliers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Suppliers & Payables ({suppliers.length})
          </button>
        </div>

        {hasPermission('purchasing', 'create') && (
          <button
            onClick={() => setShowPOModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus size={14} />
            <span>Create Purchase Order</span>
          </button>
        )}
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === 'purchase_orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search purchase orders by supplier or PO #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
            <div className="text-slate-600">
              Total Trade Payables Owed:{' '}
              <strong className="text-rose-800 font-mono">
                {formatCurrency(suppliers.reduce((acc, s) => acc + s.currentBalance, 0))}
              </strong>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">PO #</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-right">Order Value (UGX)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{po.poNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{po.supplierName}</p>
                      {po.approvedBy && (
                        <p className="text-[10px] text-emerald-700">Approved by {po.approvedBy}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{formatDate(po.orderDate)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(po.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          po.status === 'received'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : po.status === 'partially_received'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      {/* Approval Action for Manager / Admin */}
                      {po.status === 'pending_approval' && hasPermission('purchasing', 'approve_po') && (
                        <button
                          onClick={() => approvePurchaseOrder(po.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-2 py-1 rounded text-[11px]"
                        >
                          Approve PO
                        </button>
                      )}
                      {/* Goods Receipt Action (Storekeeper / Manager) */}
                      {(po.status === 'approved' || po.status === 'partially_received') && (
                        <button
                          onClick={() => handleOpenGRNModal(po)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-1"
                        >
                          <Package size={11} />
                          <span>Receive Stock (GRN)</span>
                        </button>
                      )}
                      <button
                        onClick={() => setPrintDocument({ type: 'po', data: po })}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded text-[11px] inline-flex items-center gap-1"
                      >
                        <Printer size={11} />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GOODS RECEIVED NOTES */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">Goods Received Notes (GRN) Warehouse Registry</p>
              <p className="text-[11px] text-emerald-700">
                Official warehouse verification documents confirming receipt of physical inventory into storage.
              </p>
            </div>
            <span className="font-mono font-bold bg-white px-2.5 py-1 rounded shadow-xs text-emerald-900">
              {goodsReceipts.length} GRNs Recorded
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">GRN #</th>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4 text-right">Items Verified</th>
                  <th className="py-3 px-4 text-right">Total Goods Valuation</th>
                  <th className="py-3 px-4">Receiving Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {goodsReceipts.map((grn) => (
                  <tr key={grn.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{grn.grnNumber}</td>
                    <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{grn.poNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{grn.supplierName}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{formatDate(grn.receivedDate)}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {grn.items.reduce((acc, i) => acc + i.quantityReceived, 0)} units
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                      {formatCurrency(grn.totalCost)}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{grn.receivedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS & DIRECTORY */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <p className="text-slate-600 font-medium">
              Registered Manufacturers, Agro-Processors, and Wholesale Vendors
            </p>
            <button
              onClick={() => setShowSupplierModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus size={14} /> + Add Supplier
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Supplier Code</th>
                  <th className="py-3 px-4">Vendor Company & Contact</th>
                  <th className="py-3 px-4">URA TIN</th>
                  <th className="py-3 px-4">Address / District</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Outstanding Payables (UGX)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{s.code}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {s.contactPerson} • {s.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{s.tin || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-600">{s.address || 'Uganda'}</td>
                    <td className="py-3 px-4 text-slate-600">{s.paymentTermsDays} days</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {s.currentBalance > 0 ? (
                        <span className="text-rose-700">{formatCurrency(s.currentBalance)}</span>
                      ) : (
                        <span className="text-emerald-700">Settled (0)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PURCHASE ORDER */}
      {showPOModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Issue Purchase Order (PO)</h3>
                <p className="text-[11px] text-slate-400">
                  Note: PO does NOT increase stock until goods are formally received under a GRN
                </p>
              </div>
              <button onClick={() => setShowPOModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePOSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Supplier *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Receiving Warehouse Depot</label>
                  <input
                    type="text"
                    disabled
                    value={activeWarehouse.name}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Order Items & Procurement Costs</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 p-2 rounded-lg bg-slate-50">
                  {poItems.map((item, idx) => {
                    return (
                      <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                        <div className="flex-1">
                          <select
                            value={item.productId}
                            onChange={(e) => {
                              const newItems = [...poItems];
                              const selectedP = products.find((p) => p.id === e.target.value);
                              newItems[idx].productId = e.target.value;
                              if (selectedP) newItems[idx].unitCost = selectedP.costPrice;
                              setPoItems(newItems);
                            }}
                            className="w-full bg-transparent font-medium outline-none text-xs"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...poItems];
                              newItems[idx].quantity = Number(e.target.value);
                              setPoItems(newItems);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-right font-mono"
                            placeholder="Qty"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            min="0"
                            value={item.unitCost}
                            onChange={(e) => {
                              const newItems = [...poItems];
                              newItems[idx].unitCost = Number(e.target.value);
                              setPoItems(newItems);
                            }}
                            className="w-full p-1 border border-slate-200 rounded text-right font-mono"
                            placeholder="Unit Cost"
                          />
                        </div>
                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
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
                    setPoItems([
                      ...poItems,
                      {
                        productId: products[0]?.id || '',
                        quantity: 20,
                        unitCost: products[0]?.costPrice || 0,
                      },
                    ])
                  }
                  className="mt-2 text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Plus size={12} /> Add Item Row
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Procurement Instructions</label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Deliver to Industrial Area depot gate before 3 PM"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-slate-600">
                    Net Procurement: <strong className="font-mono">{formatCurrency(poSubtotal)}</strong>
                  </p>
                  <p className="text-slate-600">
                    Estimated VAT (18%): <strong className="font-mono">{formatCurrency(poTax)}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-blue-900 uppercase">Total PO Value</span>
                  <p className="text-lg font-black font-mono text-blue-950">{formatCurrency(poTotal)}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Create & Submit PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GOODS RECEIVED NOTE (GRN) */}
      {showGRNModal && selectedPOForGRN && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Goods Received Note (GRN) Verification</h3>
                <p className="text-[11px] text-slate-400">
                  Receiving against PO #{selectedPOForGRN.poNumber} from {selectedPOForGRN.supplierName}
                </p>
              </div>
              <button onClick={() => setShowGRNModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmGRN} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-[11px]">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-600" /> Stock Increment & Accounting Integration:
                </p>
                <p className="mt-1 text-emerald-800">
                  Submitting this GRN will increment warehouse physical stock balances, update weighted-average
                  inventory costs, and post an automated double-entry GL entry: Debit Inventory Asset (1050), Credit
                  Accounts Payable (2010).
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-2">
                  Verify Physical Quantities Received
                </label>
                <div className="space-y-3">
                  {selectedPOForGRN.items.map((item) => (
                    <div
                      key={item.productId}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Ordered: {item.quantity} {item.unit} • Unit Cost: {item.unitCost.toLocaleString()} UGX
                        </p>
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                          Received Qty:
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={receivedQtys[item.productId] ?? 0}
                          onChange={(e) =>
                            setReceivedQtys({
                              ...receivedQtys,
                              [item.productId]: Number(e.target.value),
                            })
                          }
                          className="w-full p-1.5 border border-slate-300 rounded text-right font-mono font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Offloading & Inspection Notes</label>
                <input
                  type="text"
                  value={grnNotes}
                  onChange={(e) => setGrnNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowGRNModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Confirm & Post GRN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Register New Supplier Account</h3>
              <button onClick={() => setShowSupplierModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supplier Code *</label>
                  <input
                    type="text"
                    required
                    value={suppForm.code}
                    onChange={(e) => setSuppForm({ ...suppForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">URA TIN</label>
                  <input
                    type="text"
                    value={suppForm.tin}
                    onChange={(e) => setSuppForm({ ...suppForm, tin: e.target.value })}
                    placeholder="1000001245"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier Company Name *</label>
                <input
                  type="text"
                  required
                  value={suppForm.name}
                  onChange={(e) => setSuppForm({ ...suppForm, name: e.target.value })}
                  placeholder="e.g. Kakira Sugar Works Ltd"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={suppForm.contactPerson}
                    onChange={(e) => setSuppForm({ ...suppForm, contactPerson: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={suppForm.phone}
                    onChange={(e) => setSuppForm({ ...suppForm, phone: e.target.value })}
                    placeholder="+256 414 000 000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Factory / Office Address</label>
                <input
                  type="text"
                  value={suppForm.address}
                  onChange={(e) => setSuppForm({ ...suppForm, address: e.target.value })}
                  placeholder="Jinja Highway, Kakira"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Save Supplier
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
