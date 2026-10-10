import React from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  BookOpen,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Boxes,
  FileText,
  Users,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
  Layers,
  ArrowRightLeft,
  Building2,
  DollarSign,
  Receipt,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';

interface SidebarProps {
  currentModule: string;
  currentSubTab: string;
  onNavigate: (module: string, subTab?: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  currentSubTab,
  onNavigate,
  collapsed,
  onToggleCollapse,
}) => {
  const { settings, products, purchaseOrders, hasPermission } = useERP();
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    overview: true,
    inventory: true,
    sales: true,
    purchasing: true,
    accounting: true,
    reports: true,
    administration: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Low stock count badge
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockLevel).length;
  // Pending approvals badge
  const pendingPOCount = purchaseOrders.filter((p) => p.status === 'pending_approval').length;

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-all duration-200 select-none z-30 shrink-0 ${
        collapsed ? 'w-20' : 'w-68'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
            P
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-white text-sm tracking-wide truncate">
                {settings.name.split(' ')[0]} ERP
              </h1>
              <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Kampala HQ • UGX
              </p>
            </div>
          )}
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 text-xs"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4 custom-scrollbar text-xs">
        {/* SECTION: OVERVIEW */}
        <div>
          {!collapsed && (
            <button
              onClick={() => toggleSection('overview')}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
            >
              <span>Overview</span>
              {openSections.overview ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}
          {(collapsed || openSections.overview) && (
            <div className="mt-1 space-y-1">
              <button
                onClick={() => onNavigate('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  currentModule === 'dashboard'
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
                title="Executive Dashboard"
              >
                <LayoutDashboard size={18} className="shrink-0" />
                {!collapsed && <span>Executive Dashboard</span>}
              </button>
            </div>
          )}
        </div>

        {/* SECTION: INVENTORY */}
        {hasPermission('inventory', 'view') && (
          <div>
            {!collapsed && (
              <button
                onClick={() => toggleSection('inventory')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
              >
                <span>Inventory</span>
                <div className="flex items-center gap-1">
                  {lowStockCount > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                      {lowStockCount}
                    </span>
                  )}
                  {openSections.inventory ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>
            )}
            {(collapsed || openSections.inventory) && (
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => onNavigate('inventory', 'products')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'inventory' && currentSubTab === 'products'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Products & Catalog"
                >
                  <div className="flex items-center gap-3">
                    <Boxes size={18} className="shrink-0" />
                    {!collapsed && <span>Products & Catalog</span>}
                  </div>
                  {!collapsed && lowStockCount > 0 && (
                    <span className="bg-amber-500 text-slate-900 font-bold px-1.5 rounded-full text-[10px]">
                      {lowStockCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => onNavigate('inventory', 'movements')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'inventory' && currentSubTab === 'movements'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Stock Movement Ledger"
                >
                  <ArrowRightLeft size={18} className="shrink-0" />
                  {!collapsed && <span>Stock Movements</span>}
                </button>
                <button
                  onClick={() => onNavigate('inventory', 'warehouses')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'inventory' && currentSubTab === 'warehouses'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Warehouses & Stock Counts"
                >
                  <Building2 size={18} className="shrink-0" />
                  {!collapsed && <span>Warehouses & Counts</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: SALES */}
        {hasPermission('sales', 'view') && (
          <div>
            {!collapsed && (
              <button
                onClick={() => toggleSection('sales')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
              >
                <span>Sales & Orders</span>
                {openSections.sales ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {(collapsed || openSections.sales) && (
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => onNavigate('sales', 'invoices')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'sales' && currentSubTab === 'invoices'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Invoices & Counter POS"
                >
                  <FileText size={18} className="shrink-0" />
                  {!collapsed && <span>Invoices & POS</span>}
                </button>
                <button
                  onClick={() => onNavigate('sales', 'quotations')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'sales' && currentSubTab === 'quotations'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Quotations & Orders"
                >
                  <ShoppingCart size={18} className="shrink-0" />
                  {!collapsed && <span>Quotations & Orders</span>}
                </button>
                <button
                  onClick={() => onNavigate('sales', 'customers')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'sales' && currentSubTab === 'customers'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Customers & Receivables"
                >
                  <Users size={18} className="shrink-0" />
                  {!collapsed && <span>Customers & Accounts</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: PURCHASING */}
        {hasPermission('purchasing', 'view') && (
          <div>
            {!collapsed && (
              <button
                onClick={() => toggleSection('purchasing')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
              >
                <span>Purchasing</span>
                <div className="flex items-center gap-1">
                  {pendingPOCount > 0 && (
                    <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                      {pendingPOCount}
                    </span>
                  )}
                  {openSections.purchasing ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>
              </button>
            )}
            {(collapsed || openSections.purchasing) && (
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => onNavigate('purchasing', 'purchase_orders')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'purchasing' && currentSubTab === 'purchase_orders'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Purchase Orders"
                >
                  <div className="flex items-center gap-3">
                    <Truck size={18} className="shrink-0" />
                    {!collapsed && <span>Purchase Orders</span>}
                  </div>
                  {!collapsed && pendingPOCount > 0 && (
                    <span className="bg-amber-500 text-slate-900 font-bold px-1.5 rounded-full text-[10px]">
                      {pendingPOCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => onNavigate('purchasing', 'receipts')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'purchasing' && currentSubTab === 'receipts'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Goods Received Notes (GRN)"
                >
                  <ClipboardList size={18} className="shrink-0" />
                  {!collapsed && <span>Goods Received (GRN)</span>}
                </button>
                <button
                  onClick={() => onNavigate('purchasing', 'suppliers')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'purchasing' && currentSubTab === 'suppliers'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Suppliers & Payables"
                >
                  <Users size={18} className="shrink-0" />
                  {!collapsed && <span>Suppliers Directory</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: ACCOUNTING & FINANCE */}
        {hasPermission('accounting', 'view') && (
          <div>
            {!collapsed && (
              <button
                onClick={() => toggleSection('accounting')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
              >
                <span>Accounting & GL</span>
                {openSections.accounting ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {(collapsed || openSections.accounting) && (
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => onNavigate('accounting', 'overview')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'accounting' && currentSubTab === 'overview'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Accounting Overview & Financials"
                >
                  <DollarSign size={18} className="shrink-0" />
                  {!collapsed && <span>Financial Statements</span>}
                </button>
                <button
                  onClick={() => onNavigate('accounting', 'chart_of_accounts')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'accounting' && currentSubTab === 'chart_of_accounts'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Chart of Accounts"
                >
                  <Layers size={18} className="shrink-0" />
                  {!collapsed && <span>Chart of Accounts</span>}
                </button>
                <button
                  onClick={() => onNavigate('accounting', 'journals')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'accounting' && currentSubTab === 'journals'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="General Ledger & Journals"
                >
                  <BookOpen size={18} className="shrink-0" />
                  {!collapsed && <span>General Ledger</span>}
                </button>
                <button
                  onClick={() => onNavigate('accounting', 'expenses')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'accounting' && currentSubTab === 'expenses'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Operating Expenses"
                >
                  <Receipt size={18} className="shrink-0" />
                  {!collapsed && <span>Operating Expenses</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: REPORTS */}
        {hasPermission('reports', 'view') && (
          <div>
            {!collapsed && (
              <button
                onClick={() => toggleSection('reports')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
              >
                <span>Reports & Exports</span>
                {openSections.reports ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {(collapsed || openSections.reports) && (
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => onNavigate('reports', 'all')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'reports'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Business Reports & CSV Exports"
                >
                  <BarChart3 size={18} className="shrink-0" />
                  {!collapsed && <span>Reports & Analytics</span>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION: ADMINISTRATION & GOVERNANCE */}
        {hasPermission('administration', 'view') && (
          <div>
            {!collapsed && (
              <button
                onClick={() => toggleSection('administration')}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200"
              >
                <span>Administration</span>
                {openSections.administration ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            )}
            {(collapsed || openSections.administration) && (
              <div className="mt-1 space-y-1">
                <button
                  onClick={() => onNavigate('admin', 'settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'admin' && currentSubTab === 'settings'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Company Profile & Localization"
                >
                  <Settings size={18} className="shrink-0" />
                  {!collapsed && <span>Company Settings</span>}
                </button>
                <button
                  onClick={() => onNavigate('admin', 'rbac')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'admin' && currentSubTab === 'rbac'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Users & Roles (RBAC)"
                >
                  <ShieldCheck size={18} className="shrink-0" />
                  {!collapsed && <span>Users & Permissions</span>}
                </button>
                <button
                  onClick={() => onNavigate('admin', 'audits')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'admin' && currentSubTab === 'audits'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Audit Trail Logs"
                >
                  <ClipboardList size={18} className="shrink-0" />
                  {!collapsed && <span>Audit Trail Logs</span>}
                </button>
                <button
                  onClick={() => onNavigate('admin', 'import')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    currentModule === 'admin' && currentSubTab === 'import'
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                  title="CSV Data Importer & Sample Reset"
                >
                  <Package size={18} className="shrink-0" />
                  {!collapsed && <span>Data Import / Reset</span>}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Role Indicator Footer */}
      {!collapsed && (
        <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-300">Default Currency:</span>
            <span className="text-blue-400 font-semibold">{settings.currency} (18% VAT)</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span>Timezone:</span>
            <span className="text-slate-400">{settings.timezone}</span>
          </div>
        </div>
      )}
    </aside>
  );
};
