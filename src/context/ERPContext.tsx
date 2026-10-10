import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  CompanySettings,
  Branch,
  Warehouse,
  Product,
  Customer,
  Supplier,
  Invoice,
  Quotation,
  SalesOrder,
  PurchaseOrder,
  GoodsReceiptNote,
  StockMovement,
  Account,
  JournalEntry,
  Expense,
  AuditLog,
  PaymentReceipt,
} from '../types/erp.ts';
import { erpStorage } from '../services/erpStorage.ts';

interface ToastInfo {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ERPContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  settings: CompanySettings;
  branches: Branch[];
  warehouses: Warehouse[];
  users: UserProfile[];
  activeBranch: Branch;
  setActiveBranch: (branch: Branch) => void;
  activeWarehouse: Warehouse;
  setActiveWarehouse: (warehouse: Warehouse) => void;

  // Data collections
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  invoices: Invoice[];
  quotations: Quotation[];
  salesOrders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceiptNote[];
  stockMovements: StockMovement[];
  accounts: Account[];
  journalEntries: JournalEntry[];
  expenses: Expense[];
  auditLogs: AuditLog[];

  // Formatters
  formatCurrency: (val: number | undefined) => string;
  formatDate: (val: string | undefined) => string;
  hasPermission: (module: string, action: string) => boolean;

  // Actions
  refreshData: () => void;
  createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => Product;
  recordStockAdjustment: (productId: string, warehouseId: string, adjustedQty: number, reason: string) => void;
  createPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => PurchaseOrder;
  approvePurchaseOrder: (poId: string) => PurchaseOrder;
  receiveGoods: (
    poId: string,
    receivedItems: { productId: string; quantityReceived: number; unitCost: number }[],
    warehouseId: string,
    notes?: string
  ) => GoodsReceiptNote;
  createQuotation: (data: Omit<Quotation, 'id' | 'quoteNumber' | 'createdAt'>) => Quotation;
  convertQuoteToOrder: (quoteId: string) => SalesOrder;
  postInvoice: (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => Invoice;
  recordPayment: (
    invoiceId: string,
    amount: number,
    paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque',
    bankAccountId: string,
    referenceNumber?: string,
    notes?: string
  ) => PaymentReceipt;
  createJournalEntry: (entryData: Omit<JournalEntry, 'id'>) => JournalEntry;
  recordExpense: (data: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>) => Expense;
  createCustomer: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  createSupplier: (data: Omit<Supplier, 'id' | 'createdAt'>) => Supplier;
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  resetDemoData: () => void;

  // Toast
  toasts: ToastInfo[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ERPContext = createContext<ERPContextType | undefined>(undefined);

export const ERPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [usersList, setUsersList] = useState<UserProfile[]>(erpStorage.getUsers());
  const [currentUser, setCurrentUserState] = useState<UserProfile>(usersList[0]);
  const [settings, setSettings] = useState<CompanySettings>(erpStorage.getSettings());
  const [branches, setBranches] = useState<Branch[]>(erpStorage.getBranches());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(erpStorage.getWarehouses());
  const [activeBranch, setActiveBranch] = useState<Branch>(branches[0]);
  const [activeWarehouse, setActiveWarehouse] = useState<Warehouse>(warehouses[0]);

  // Data states
  const [products, setProducts] = useState<Product[]>(erpStorage.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(erpStorage.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(erpStorage.getSuppliers());
  const [invoices, setInvoices] = useState<Invoice[]>(erpStorage.getInvoices());
  const [quotations, setQuotations] = useState<Quotation[]>(erpStorage.getQuotations());
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(erpStorage.getSalesOrders());
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(erpStorage.getPurchaseOrders());
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceiptNote[]>(erpStorage.getGoodsReceipts());
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(erpStorage.getStockMovements());
  const [accounts, setAccounts] = useState<Account[]>(erpStorage.getAccounts());
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(erpStorage.getJournalEntries());
  const [expenses, setExpenses] = useState<Expense[]>(erpStorage.getExpenses());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(erpStorage.getAuditLogs());

  // Toasts
  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `tst_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const refreshData = () => {
    setSettings(erpStorage.getSettings());
    setBranches(erpStorage.getBranches());
    setWarehouses(erpStorage.getWarehouses());
    setUsersList(erpStorage.getUsers());
    setProducts(erpStorage.getProducts());
    setCustomers(erpStorage.getCustomers());
    setSuppliers(erpStorage.getSuppliers());
    setInvoices(erpStorage.getInvoices());
    setQuotations(erpStorage.getQuotations());
    setSalesOrders(erpStorage.getSalesOrders());
    setPurchaseOrders(erpStorage.getPurchaseOrders());
    setGoodsReceipts(erpStorage.getGoodsReceipts());
    setStockMovements(erpStorage.getStockMovements());
    setAccounts(erpStorage.getAccounts());
    setJournalEntries(erpStorage.getJournalEntries());
    setExpenses(erpStorage.getExpenses());
    setAuditLogs(erpStorage.getAuditLogs());
  };

  useEffect(() => {
    erpStorage.initialize().then(() => {
      refreshData();
    });
  }, []);

  const switchRole = (role: UserRole) => {
    const matched = usersList.find((u) => u.role === role);
    if (matched) {
      setCurrentUserState(matched);
      showToast(`Switched active user to ${matched.name} (${role.toUpperCase()})`, 'info');
    }
  };

  const formatCurrency = (val: number | undefined): string => {
    if (val === undefined || val === null || isNaN(val)) return `${settings.currencySymbol} 0`;
    return `${settings.currencySymbol} ${Math.round(val).toLocaleString()}`;
  };

  const formatDate = (val: string | undefined): string => {
    if (!val) return '-';
    try {
      const d = new Date(val);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return val;
    }
  };

  // RBAC Permission engine
  const hasPermission = (module: string, action: string): boolean => {
    const role = currentUser.role;
    if (role === 'admin') return true; // Administrator has full privileges

    if (role === 'manager') {
      if (module === 'administration' && action === 'delete_database') return false;
      return true; // Managers can access everything else including approvals
    }

    if (role === 'sales') {
      if (module === 'sales') return true;
      if (module === 'inventory' && action === 'view') return true;
      if (module === 'reports' && action === 'sales_report') return true;
      return false;
    }

    if (role === 'storekeeper') {
      if (module === 'inventory') return true;
      if (module === 'purchasing' && (action === 'view' || action === 'receive_goods')) return true;
      if (module === 'sales' && action === 'view_orders') return true;
      return false;
    }

    if (role === 'purchaser') {
      if (module === 'purchasing') return action !== 'approve_po'; // Purchaser creates POs, Manager approves
      if (module === 'inventory' && action === 'view') return true;
      if (module === 'reports' && action === 'purchasing_report') return true;
      return false;
    }

    if (role === 'accountant') {
      if (module === 'accounting') return true;
      if (module === 'sales' && (action === 'view' || action === 'record_payment')) return true;
      if (module === 'purchasing' && (action === 'view' || action === 'pay_supplier')) return true;
      if (module === 'reports') return true;
      return false;
    }

    if (role === 'auditor') {
      return action === 'view' || action.includes('report') || module === 'reports';
    }

    return false;
  };

  // Wrapper mutations with automatic state refresh and notifications
  const handleCreateProduct = (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const p = erpStorage.createProduct(data, currentUser);
      refreshData();
      showToast(`Product "${p.name}" (${p.sku}) created successfully.`);
      return p;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    try {
      const p = erpStorage.updateProduct(id, updates, currentUser);
      refreshData();
      showToast(`Product "${p.name}" updated successfully.`);
      return p;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleRecordStockAdjustment = (productId: string, warehouseId: string, adjustedQty: number, reason: string) => {
    try {
      erpStorage.recordStockAdjustment(productId, warehouseId, adjustedQty, reason, currentUser);
      refreshData();
      showToast(`Stock adjusted (${adjustedQty > 0 ? '+' : ''}${adjustedQty}) and GL journal posted.`);
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleCreatePO = (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>) => {
    try {
      const po = erpStorage.createPurchaseOrder(poData, currentUser);
      refreshData();
      showToast(`Purchase Order ${po.poNumber} created.`);
      return po;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleApprovePO = (poId: string) => {
    try {
      const po = erpStorage.approvePurchaseOrder(poId, currentUser);
      refreshData();
      showToast(`Purchase Order ${po.poNumber} approved.`);
      return po;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleReceiveGoods = (
    poId: string,
    receivedItems: { productId: string; quantityReceived: number; unitCost: number }[],
    warehouseId: string,
    notes?: string
  ) => {
    try {
      const grn = erpStorage.receiveGoods(poId, receivedItems, warehouseId, currentUser, notes);
      refreshData();
      showToast(`Goods received under ${grn.grnNumber}. Inventory incremented & GL updated.`);
      return grn;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleCreateQuotation = (data: Omit<Quotation, 'id' | 'quoteNumber' | 'createdAt'>) => {
    try {
      const q = erpStorage.createQuotation(data, currentUser);
      refreshData();
      showToast(`Sales Quotation ${q.quoteNumber} prepared.`);
      return q;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleConvertQuoteToOrder = (quoteId: string) => {
    try {
      const order = erpStorage.convertQuoteToOrder(quoteId, currentUser);
      refreshData();
      showToast(`Sales Order ${order.orderNumber} created from quotation.`);
      return order;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handlePostInvoice = (data: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    try {
      const inv = erpStorage.postInvoice(data, currentUser);
      refreshData();
      showToast(`Invoice ${inv.invoiceNumber} posted. Stock deducted & GL balanced.`);
      return inv;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleRecordPayment = (
    invoiceId: string,
    amount: number,
    paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque',
    bankAccountId: string,
    referenceNumber?: string,
    notes?: string
  ) => {
    try {
      const rct = erpStorage.recordPayment(invoiceId, amount, paymentMethod, bankAccountId, currentUser, referenceNumber, notes);
      refreshData();
      showToast(`Payment of ${formatCurrency(amount)} recorded under Receipt ${rct.receiptNumber}.`);
      return rct;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleCreateJournalEntry = (entryData: Omit<JournalEntry, 'id'>) => {
    try {
      const je = erpStorage.createJournalEntry(entryData, currentUser);
      refreshData();
      showToast(`Journal Entry ${je.entryNumber} posted to General Ledger.`);
      return je;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleRecordExpense = (data: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>) => {
    try {
      const exp = erpStorage.recordExpense(data, currentUser);
      refreshData();
      showToast(`Expense ${exp.expenseNumber} of ${formatCurrency(exp.amount)} logged.`);
      return exp;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleCreateCustomer = (data: Omit<Customer, 'id' | 'createdAt'>) => {
    try {
      const cust = erpStorage.createCustomer(data, currentUser);
      refreshData();
      showToast(`Customer account "${cust.name}" registered.`);
      return cust;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleCreateSupplier = (data: Omit<Supplier, 'id' | 'createdAt'>) => {
    try {
      const s = erpStorage.createSupplier(data, currentUser);
      refreshData();
      showToast(`Supplier account "${s.name}" registered.`);
      return s;
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleUpdateSettings = (newSettings: Partial<CompanySettings>) => {
    try {
      const updated = erpStorage.updateSettings(newSettings, currentUser);
      refreshData();
      showToast('Company settings and preferences saved.');
    } catch (err: any) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleResetDemo = () => {
    erpStorage.resetToDemo();
    refreshData();
    showToast('Database restored to initial Ugandan sample enterprise.', 'info');
  };

  return (
    <ERPContext.Provider
      value={{
        currentUser,
        setCurrentUser: setCurrentUserState,
        switchRole,
        settings,
        branches,
        warehouses,
        users: usersList,
        activeBranch,
        setActiveBranch,
        activeWarehouse,
        setActiveWarehouse,
        products,
        customers,
        suppliers,
        invoices,
        quotations,
        salesOrders,
        purchaseOrders,
        goodsReceipts,
        stockMovements,
        accounts,
        journalEntries,
        expenses,
        auditLogs,
        formatCurrency,
        formatDate,
        hasPermission,
        refreshData,
        createProduct: handleCreateProduct,
        updateProduct: handleUpdateProduct,
        recordStockAdjustment: handleRecordStockAdjustment,
        createPurchaseOrder: handleCreatePO,
        approvePurchaseOrder: handleApprovePO,
        receiveGoods: handleReceiveGoods,
        createQuotation: handleCreateQuotation,
        convertQuoteToOrder: handleConvertQuoteToOrder,
        postInvoice: handlePostInvoice,
        recordPayment: handleRecordPayment,
        createJournalEntry: handleCreateJournalEntry,
        recordExpense: handleRecordExpense,
        createCustomer: handleCreateCustomer,
        createSupplier: handleCreateSupplier,
        updateSettings: handleUpdateSettings,
        resetDemoData: handleResetDemo,
        toasts,
        showToast,
      }}
    >
      {children}

      {/* Global Toast Render */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-xl text-sm font-medium flex items-center justify-between gap-3 transition-all ${
              t.type === 'error'
                ? 'bg-rose-900 text-rose-100 border border-rose-700'
                : t.type === 'info'
                ? 'bg-blue-900 text-blue-100 border border-blue-700'
                : 'bg-emerald-900 text-emerald-100 border border-emerald-700'
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ERPContext.Provider>
  );
};

export const useERP = (): ERPContextType => {
  const context = useContext(ERPContext);
  if (!context) {
    throw new Error('useERP must be used within an ERPProvider');
  }
  return context;
};
