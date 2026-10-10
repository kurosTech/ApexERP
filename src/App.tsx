import React, { useState } from 'react';
import { ERPProvider, useERP } from './context/ERPContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { TopNavbar } from './components/layout/TopNavbar.tsx';
import { ExecutiveDashboard } from './modules/dashboard/ExecutiveDashboard.tsx';
import { InventoryModule } from './modules/inventory/InventoryModule.tsx';
import { SalesModule } from './modules/sales/SalesModule.tsx';
import { PurchasingModule } from './modules/purchasing/PurchasingModule.tsx';
import { AccountingModule } from './modules/accounting/AccountingModule.tsx';
import { ReportsModule } from './modules/reports/ReportsModule.tsx';
import { AdminModule } from './modules/administration/AdminModule.tsx';
import { ChevronRight, Home } from 'lucide-react';

const ERPAppContent: React.FC = () => {
  const [currentModule, setCurrentModule] = useState<string>('dashboard');
  const [currentSubTab, setCurrentSubTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Quick Action modal trigger flags
  const [triggerInvoice, setTriggerInvoice] = useState<boolean>(false);
  const [triggerPO, setTriggerPO] = useState<boolean>(false);
  const [triggerExpense, setTriggerExpense] = useState<boolean>(false);

  const handleNavigate = (module: string, subTab: string = 'overview') => {
    setCurrentModule(module);
    setCurrentSubTab(subTab);
  };

  const handleQuickAction = (action: string) => {
    if (action === 'new_invoice') {
      setCurrentModule('sales');
      setCurrentSubTab('invoices');
      setTriggerInvoice(true);
      setTimeout(() => setTriggerInvoice(false), 200);
    } else if (action === 'new_po') {
      setCurrentModule('purchasing');
      setCurrentSubTab('purchase_orders');
      setTriggerPO(true);
      setTimeout(() => setTriggerPO(false), 200);
    } else if (action === 'new_product') {
      setCurrentModule('inventory');
      setCurrentSubTab('products');
    } else if (action === 'new_expense') {
      setCurrentModule('accounting');
      setCurrentSubTab('expenses');
      setTriggerExpense(true);
      setTimeout(() => setTriggerExpense(false), 200);
    }
  };

  // Breadcrumb labels
  const moduleLabels: Record<string, string> = {
    dashboard: 'Executive Dashboard',
    inventory: 'Inventory & Stock Management',
    sales: 'Sales & Customer Accounts',
    purchasing: 'Purchasing & Supplier Management',
    accounting: 'Accounting & Financial Ledger',
    reports: 'Reports & Data Analytics',
    admin: 'Administration & Governance',
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Enterprise Collapsible Sidebar */}
      <Sidebar
        currentModule={currentModule}
        currentSubTab={currentSubTab}
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <TopNavbar
          onQuickAction={handleQuickAction}
          onNavigate={handleNavigate}
        />

        {/* Breadcrumb Navigation Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleNavigate('dashboard')}
              className="hover:text-blue-600 flex items-center gap-1 font-medium"
            >
              <Home size={12} />
              <span>ApexERP</span>
            </button>
            <ChevronRight size={12} className="text-slate-400" />
            <span className="font-semibold text-slate-900">
              {moduleLabels[currentModule] || currentModule}
            </span>
            {currentSubTab !== 'overview' && (
              <>
                <ChevronRight size={12} className="text-slate-400" />
                <span className="capitalize text-blue-700 font-medium">
                  {currentSubTab.replace('_', ' ')}
                </span>
              </>
            )}
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px] text-slate-400">
            <span>Perpetual Double-Entry Ledger</span>
            <span>•</span>
            <span className="font-mono text-slate-600">Uganda (EFRIS/VAT 18%)</span>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            {currentModule === 'dashboard' && (
              <ExecutiveDashboard
                onNavigate={handleNavigate}
                onQuickAction={handleQuickAction}
              />
            )}

            {currentModule === 'inventory' && (
              <InventoryModule
                initialSubTab={currentSubTab}
                onOpenCreatePO={() => handleQuickAction('new_po')}
              />
            )}

            {currentModule === 'sales' && (
              <SalesModule
                initialSubTab={currentSubTab}
                triggerNewInvoice={triggerInvoice}
              />
            )}

            {currentModule === 'purchasing' && (
              <PurchasingModule
                initialSubTab={currentSubTab}
                triggerNewPO={triggerPO}
              />
            )}

            {currentModule === 'accounting' && (
              <AccountingModule
                initialSubTab={currentSubTab}
                triggerNewExpense={triggerExpense}
              />
            )}

            {currentModule === 'reports' && <ReportsModule />}

            {currentModule === 'admin' && (
              <AdminModule initialSubTab={currentSubTab} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ERPProvider>
      <ERPAppContent />
    </ERPProvider>
  );
}
