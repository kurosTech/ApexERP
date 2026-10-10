import React, { useState } from 'react';
import {
  Search,
  Bell,
  Building,
  User,
  Plus,
  AlertTriangle,
  FileText,
  Truck,
  Package,
  X,
  CheckCircle,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { UserRole } from '../../types/erp.ts';

interface TopNavbarProps {
  onQuickAction: (action: string) => void;
  onNavigate: (module: string, subTab?: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onQuickAction, onNavigate }) => {
  const {
    currentUser,
    switchRole,
    users,
    branches,
    activeBranch,
    setActiveBranch,
    warehouses,
    activeWarehouse,
    setActiveWarehouse,
    products,
    customers,
    invoices,
    purchaseOrders,
    formatCurrency,
  } = useERP();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Search filtering
  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredCustomers = searchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredInvoices = searchQuery.trim()
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Alerts
  const lowStockItems = products.filter((p) => p.currentStock <= p.minStockLevel);
  const pendingPOs = purchaseOrders.filter((p) => p.status === 'pending_approval');
  const totalNotifications = lowStockItems.length + pendingPOs.length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 shrink-0">
      {/* Left: Branch & Warehouse Context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium border border-slate-200">
          <Building size={14} className="text-blue-600" />
          <select
            value={activeBranch.id}
            onChange={(e) => {
              const b = branches.find((branch) => branch.id === e.target.value);
              if (b) setActiveBranch(b);
            }}
            className="bg-transparent border-none outline-none font-semibold text-slate-800 cursor-pointer"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-slate-50 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 border border-slate-200">
          <span className="text-slate-400 font-medium">Store:</span>
          <select
            value={activeWarehouse.id}
            onChange={(e) => {
              const wh = warehouses.find((w) => w.id === e.target.value);
              if (wh) setActiveWarehouse(wh);
            }}
            className="bg-transparent border-none outline-none font-medium text-slate-700 cursor-pointer text-xs"
          >
            {warehouses
              .filter((w) => w.branchId === activeBranch.id || true)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-4 relative hidden md:block">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Global search: SKU, product, customer, or invoice #..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchModal(true);
            }}
            onFocus={() => setShowSearchModal(true)}
            className="w-full bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchModal(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchModal && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-10 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 max-h-96 overflow-y-auto">
            {filteredProducts.length === 0 &&
            filteredCustomers.length === 0 &&
            filteredInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 text-center">
                No matching records found for "{searchQuery}".
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                {filteredProducts.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      Products ({filteredProducts.length})
                    </span>
                    <div className="mt-1 space-y-1">
                      {filteredProducts.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setShowSearchModal(false);
                            onNavigate('inventory', 'products');
                          }}
                          className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{p.name}</p>
                            <p className="text-[10px] text-slate-500">
                              SKU: {p.sku} • Stock: {p.currentStock} {p.unit}
                            </p>
                          </div>
                          <span className="font-bold text-blue-700">
                            {formatCurrency(p.sellingPrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredCustomers.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      Customers ({filteredCustomers.length})
                    </span>
                    <div className="mt-1 space-y-1">
                      {filteredCustomers.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setShowSearchModal(false);
                            onNavigate('sales', 'customers');
                          }}
                          className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.code} • TIN: {c.tin || 'N/A'}</p>
                          </div>
                          <span className="text-slate-600 font-medium">
                            Bal: {formatCurrency(c.currentBalance)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {filteredInvoices.length > 0 && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                      Invoices ({filteredInvoices.length})
                    </span>
                    <div className="mt-1 space-y-1">
                      {filteredInvoices.slice(0, 3).map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => {
                            setShowSearchModal(false);
                            onNavigate('sales', 'invoices');
                          }}
                          className="px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{inv.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-500">{inv.customerName}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800">{formatCurrency(inv.totalAmount)}</p>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Quick Action, Alerts & Role Switcher */}
      <div className="flex items-center gap-2">
        {/* Quick Action Button */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Action</span>
          </button>
          {showQuickMenu && (
            <div className="absolute right-0 top-9 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 text-xs">
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onQuickAction('new_invoice');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <FileText size={14} className="text-blue-600" />
                <span>+ Sales Invoice / POS</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onQuickAction('new_po');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <Truck size={14} className="text-amber-600" />
                <span>+ Purchase Order</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onQuickAction('new_product');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <Package size={14} className="text-emerald-600" />
                <span>+ Inventory Item</span>
              </button>
              <button
                onClick={() => {
                  setShowQuickMenu(false);
                  onQuickAction('new_expense');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <AlertTriangle size={14} className="text-rose-600" />
                <span>+ Record Expense</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative"
            title="Notifications & System Alerts"
          >
            <Bell size={18} />
            {totalNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {totalNotifications}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-10 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-3 z-50 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="font-bold text-slate-800">Operational Alerts</span>
                <span className="text-[10px] text-slate-500">{totalNotifications} pending</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {lowStockItems.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('inventory', 'products');
                    }}
                    className="p-2 rounded bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                  >
                    <p className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="text-amber-600" /> Low Stock Alert
                    </p>
                    <p className="text-[11px] text-amber-800">
                      {p.name} has only {p.currentStock} {p.unit} remaining (Min: {p.minStockLevel})
                    </p>
                  </div>
                ))}
                {pendingPOs.map((po) => (
                  <div
                    key={po.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onNavigate('purchasing', 'purchase_orders');
                    }}
                    className="p-2 rounded bg-blue-50 border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                      <Truck size={12} className="text-blue-600" /> PO Pending Approval
                    </p>
                    <p className="text-[11px] text-blue-800">
                      {po.poNumber} for {po.supplierName} ({formatCurrency(po.totalAmount)})
                    </p>
                  </div>
                ))}
                {totalNotifications === 0 && (
                  <div className="text-center py-4 text-slate-400">
                    <CheckCircle size={24} className="mx-auto text-emerald-500 mb-1" />
                    <p>All stock levels & orders in good standing</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs"
          >
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-bold text-slate-800 text-[11px] leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider leading-none">
                {currentUser.role}
              </p>
            </div>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-11 w-64 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50 text-xs">
              <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500">{currentUser.email}</p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px] uppercase">
                  Active Role: {currentUser.role}
                </span>
              </div>
              <p className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Test Role (RBAC)
              </p>
              <div className="space-y-0.5">
                {[
                  { role: 'admin' as UserRole, label: 'Arthur Mugabe (System Admin)' },
                  { role: 'manager' as UserRole, label: 'Brenda Namuganza (Operations Mgr)' },
                  { role: 'sales' as UserRole, label: 'Denis Kato (Sales Officer)' },
                  { role: 'storekeeper' as UserRole, label: 'Faridah Alupo (Storekeeper)' },
                  { role: 'purchaser' as UserRole, label: 'Geoffrey Mukasa (Purchasing Off.)' },
                  { role: 'accountant' as UserRole, label: 'Harriet Birungi (Senior Accountant)' },
                  { role: 'auditor' as UserRole, label: 'Isaac Ouma (Internal Auditor)' },
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => {
                      switchRole(item.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors ${
                      currentUser.role === item.role
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{item.label}</span>
                    {currentUser.role === item.role && <CheckCircle size={12} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
