import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import {
  Product,
  Customer,
  Supplier,
  Invoice,
  PurchaseOrder,
  GoodsReceiptNote,
  StockMovement,
  Account,
  JournalEntry,
  Expense,
  AuditLog,
  CompanySettings,
  Branch,
  Warehouse,
  UserProfile,
  PaymentReceipt,
  Quotation,
  SalesOrder,
} from '../types/erp.ts';
import {
  initialCompanySettings,
  initialBranches,
  initialWarehouses,
  initialUsers,
  initialCategories,
  initialProducts,
  initialCustomers,
  initialSuppliers,
  initialChartOfAccounts,
  initialInvoices,
  initialPurchaseOrders,
  initialGoodsReceiptNotes,
  initialStockMovements,
  initialJournalEntries,
  initialExpenses,
  initialAuditLogs,
} from './seedData.ts';

// Local storage keys for resilient caching
const STORAGE_PREFIX = 'apex_erp_';
const getKey = (name: string) => `${STORAGE_PREFIX}${name}`;

class ERPStorageService {
  private memoryCache: {
    settings?: CompanySettings;
    branches?: Branch[];
    warehouses?: Warehouse[];
    users?: UserProfile[];
    products?: Product[];
    customers?: Customer[];
    suppliers?: Supplier[];
    invoices?: Invoice[];
    quotations?: Quotation[];
    salesOrders?: SalesOrder[];
    purchaseOrders?: PurchaseOrder[];
    goodsReceipts?: GoodsReceiptNote[];
    stockMovements?: StockMovement[];
    accounts?: Account[];
    journalEntries?: JournalEntry[];
    expenses?: Expense[];
    auditLogs?: AuditLog[];
    payments?: PaymentReceipt[];
  } = {};

  private isInitialized = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const getStored = <T>(key: string, fallback: T): T => {
        const item = localStorage.getItem(getKey(key));
        if (!item) return fallback;
        try {
          return JSON.parse(item);
        } catch {
          return fallback;
        }
      };

      this.memoryCache.settings = getStored('settings', initialCompanySettings);
      this.memoryCache.branches = getStored('branches', initialBranches);
      this.memoryCache.warehouses = getStored('warehouses', initialWarehouses);
      this.memoryCache.users = getStored('users', initialUsers);
      this.memoryCache.products = getStored('products', initialProducts);
      this.memoryCache.customers = getStored('customers', initialCustomers);
      this.memoryCache.suppliers = getStored('suppliers', initialSuppliers);
      this.memoryCache.invoices = getStored('invoices', initialInvoices);
      this.memoryCache.quotations = getStored('quotations', []);
      this.memoryCache.salesOrders = getStored('salesOrders', []);
      this.memoryCache.purchaseOrders = getStored('purchaseOrders', initialPurchaseOrders);
      this.memoryCache.goodsReceipts = getStored('goodsReceipts', initialGoodsReceiptNotes);
      this.memoryCache.stockMovements = getStored('stockMovements', initialStockMovements);
      this.memoryCache.accounts = getStored('accounts', initialChartOfAccounts);
      this.memoryCache.journalEntries = getStored('journalEntries', initialJournalEntries);
      this.memoryCache.expenses = getStored('expenses', initialExpenses);
      this.memoryCache.auditLogs = getStored('auditLogs', initialAuditLogs);
      this.memoryCache.payments = getStored('payments', []);
    } catch (e) {
      console.warn('LocalStorage unavailable, using initial in-memory state', e);
    }
  }

  private saveItem<T>(key: string, data: T) {
    try {
      localStorage.setItem(getKey(key), JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  }

  // Initialize and synchronize with Firestore
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Check if settings doc exists in Firestore
      const settingsRef = doc(db, 'system', 'settings');
      const snap = await getDoc(settingsRef);

      if (!snap.exists()) {
        // First boot: Seed remote Firestore with default Uganda enterprise records
        await this.seedFirestore();
      } else {
        // Load remote data from Firestore collections if available
        await this.syncFromFirestore();
      }
    } catch (err) {
      console.warn('Firestore remote sync fallback to local store:', err);
    } finally {
      this.isInitialized = true;
    }
  }

  private async seedFirestore(): Promise<void> {
    try {
      await setDoc(doc(db, 'system', 'settings'), initialCompanySettings);
      for (const p of initialProducts) {
        await setDoc(doc(db, 'products', p.id), p);
      }
      for (const c of initialCustomers) {
        await setDoc(doc(db, 'customers', c.id), c);
      }
      for (const s of initialSuppliers) {
        await setDoc(doc(db, 'suppliers', s.id), s);
      }
      for (const a of initialChartOfAccounts) {
        await setDoc(doc(db, 'accounts', a.id), a);
      }
    } catch (e) {
      console.warn('Notice: Remote Firestore seed skipped, operating in robust local mode', e);
    }
  }

  private async syncFromFirestore(): Promise<void> {
    try {
      const snapProducts = await getDocs(collection(db, 'products'));
      if (!snapProducts.empty) {
        this.memoryCache.products = snapProducts.docs.map((d) => d.data() as Product);
        this.saveItem('products', this.memoryCache.products);
      }
    } catch (e) {
      // Fallback silently to memoryCache
    }
  }

  // GETTERS
  public getSettings(): CompanySettings {
    return this.memoryCache.settings || initialCompanySettings;
  }

  public updateSettings(newSettings: Partial<CompanySettings>, user: UserProfile): CompanySettings {
    const updated = { ...this.getSettings(), ...newSettings };
    this.memoryCache.settings = updated;
    this.saveItem('settings', updated);
    this.addAuditLog({
      action: 'UPDATE_SETTINGS',
      module: 'administration',
      entityId: updated.id,
      description: 'Updated company profile and localization configurations',
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });
    // Async firestore sync
    setDoc(doc(db, 'system', 'settings'), updated).catch(() => {});
    return updated;
  }

  public getBranches(): Branch[] {
    return this.memoryCache.branches || initialBranches;
  }

  public getWarehouses(): Warehouse[] {
    return this.memoryCache.warehouses || initialWarehouses;
  }

  public getUsers(): UserProfile[] {
    return this.memoryCache.users || initialUsers;
  }

  public getProducts(): Product[] {
    return this.memoryCache.products || initialProducts;
  }

  public getCustomers(): Customer[] {
    return this.memoryCache.customers || initialCustomers;
  }

  public getSuppliers(): Supplier[] {
    return this.memoryCache.suppliers || initialSuppliers;
  }

  public getInvoices(): Invoice[] {
    return this.memoryCache.invoices || initialInvoices;
  }

  public getQuotations(): Quotation[] {
    return this.memoryCache.quotations || [];
  }

  public getSalesOrders(): SalesOrder[] {
    return this.memoryCache.salesOrders || [];
  }

  public getPurchaseOrders(): PurchaseOrder[] {
    return this.memoryCache.purchaseOrders || initialPurchaseOrders;
  }

  public getGoodsReceipts(): GoodsReceiptNote[] {
    return this.memoryCache.goodsReceipts || initialGoodsReceiptNotes;
  }

  public getStockMovements(): StockMovement[] {
    return (this.memoryCache.stockMovements || initialStockMovements).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getAccounts(): Account[] {
    return this.memoryCache.accounts || initialChartOfAccounts;
  }

  public getJournalEntries(): JournalEntry[] {
    return (this.memoryCache.journalEntries || initialJournalEntries).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getExpenses(): Expense[] {
    return (this.memoryCache.expenses || initialExpenses).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public getAuditLogs(): AuditLog[] {
    return (this.memoryCache.auditLogs || initialAuditLogs).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // AUDIT LOG
  public addAuditLog(log: Omit<AuditLog, 'id'>): AuditLog {
    const newLog: AuditLog = {
      ...log,
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    const logs = [newLog, ...(this.memoryCache.auditLogs || [])];
    this.memoryCache.auditLogs = logs;
    this.saveItem('auditLogs', logs);
    return newLog;
  }

  // PRODUCT ACTIONS
  public createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, user: UserProfile): Product {
    const existing = this.getProducts().find((p) => p.sku.toLowerCase() === data.sku.toLowerCase());
    if (existing) {
      throw new Error(`SKU "${data.sku}" already exists. SKU must be unique across catalog.`);
    }

    const newProd: Product = {
      ...data,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newProd, ...this.getProducts()];
    this.memoryCache.products = updated;
    this.saveItem('products', updated);

    // If opening stock > 0, record opening movement
    if (newProd.currentStock > 0) {
      const defaultWh = this.getWarehouses()[0];
      this.addStockMovement({
        productId: newProd.id,
        productName: newProd.name,
        productSku: newProd.sku,
        warehouseId: defaultWh.id,
        warehouseName: defaultWh.name,
        type: 'adjustment_in',
        quantity: newProd.currentStock,
        balanceAfter: newProd.currentStock,
        unitCost: newProd.costPrice,
        totalCost: newProd.currentStock * newProd.costPrice,
        referenceNumber: 'OPEN-STOCK',
        notes: 'Initial opening stock balance upon creation',
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      });
    }

    this.addAuditLog({
      action: 'CREATE_PRODUCT',
      module: 'inventory',
      entityId: newProd.id,
      entityName: newProd.sku,
      description: `Created new product ${newProd.name} (${newProd.sku}) with cost USh ${newProd.costPrice.toLocaleString()}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    setDoc(doc(db, 'products', newProd.id), newProd).catch(() => {});
    return newProd;
  }

  public updateProduct(id: string, updates: Partial<Product>, user: UserProfile): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Product not found');

    const updated = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    products[index] = updated;
    this.memoryCache.products = products;
    this.saveItem('products', products);

    this.addAuditLog({
      action: 'UPDATE_PRODUCT',
      module: 'inventory',
      entityId: id,
      entityName: updated.sku,
      description: `Updated product details for ${updated.name}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    setDoc(doc(db, 'products', id), updated).catch(() => {});
    return updated;
  }

  // STOCK MOVEMENTS
  public addStockMovement(movement: Omit<StockMovement, 'id'>): StockMovement {
    const newMovement: StockMovement = {
      ...movement,
      id: `sm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };
    const list = [newMovement, ...(this.memoryCache.stockMovements || [])];
    this.memoryCache.stockMovements = list;
    this.saveItem('stockMovements', list);
    return newMovement;
  }

  // STOCK ADJUSTMENT (PHYSICAL COUNT VARIANCE / DAMAGE)
  public recordStockAdjustment(
    productId: string,
    warehouseId: string,
    adjustedQty: number, // Positive for addition, negative for deduction
    reason: string,
    user: UserProfile
  ): void {
    const products = this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const newStock = product.currentStock + adjustedQty;
    if (newStock < 0 && !this.getSettings().allowNegativeStock) {
      throw new Error(`Negative stock not allowed. Current stock is ${product.currentStock}, cannot reduce by ${Math.abs(adjustedQty)}.`);
    }

    product.currentStock = newStock;
    product.updatedAt = new Date().toISOString();
    this.saveItem('products', products);

    const warehouse = this.getWarehouses().find((w) => w.id === warehouseId) || this.getWarehouses()[0];
    const isIncrease = adjustedQty > 0;
    const absQty = Math.abs(adjustedQty);
    const varianceValue = absQty * product.costPrice;

    // Record Stock Movement
    this.addStockMovement({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      type: isIncrease ? 'adjustment_in' : 'adjustment_out',
      quantity: absQty,
      balanceAfter: newStock,
      unitCost: product.costPrice,
      totalCost: varianceValue,
      referenceNumber: `ADJ-${Date.now().toString().slice(-4)}`,
      notes: reason,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
    });

    // GL Journal Entry for Inventory Adjustment
    const entryNumber = `JE-ADJ-${Date.now().toString().slice(-4)}`;
    const accounts = this.getAccounts();
    const invAcc = accounts.find((a) => a.code === '1050') || accounts[4];
    const adjExpenseAcc = accounts.find((a) => a.code === '5010') || accounts[11]; // COGS / Variance

    if (isIncrease) {
      // Debit Inventory, Credit COGS/Adjustment gain
      this.createJournalEntry(
        {
          entryNumber,
          date: new Date().toISOString().split('T')[0],
          description: `Stock adjustment gain for ${product.name} (${absQty} ${product.unit})`,
          reference: 'PHYSICAL-COUNT',
          sourceType: 'manual',
          lines: [
            { accountId: invAcc.id, accountCode: invAcc.code, accountName: invAcc.name, debit: varianceValue, credit: 0 },
            { accountId: adjExpenseAcc.id, accountCode: adjExpenseAcc.code, accountName: adjExpenseAcc.name, debit: 0, credit: varianceValue },
          ],
          totalDebit: varianceValue,
          totalCredit: varianceValue,
          posted: true,
          createdBy: user.name,
          createdAt: new Date().toISOString(),
        },
        user
      );
    } else {
      // Debit COGS/Adjustment loss, Credit Inventory
      this.createJournalEntry(
        {
          entryNumber,
          date: new Date().toISOString().split('T')[0],
          description: `Stock adjustment loss for ${product.name} (${absQty} ${product.unit}): ${reason}`,
          reference: 'PHYSICAL-COUNT',
          sourceType: 'manual',
          lines: [
            { accountId: adjExpenseAcc.id, accountCode: adjExpenseAcc.code, accountName: adjExpenseAcc.name, debit: varianceValue, credit: 0 },
            { accountId: invAcc.id, accountCode: invAcc.code, accountName: invAcc.name, debit: 0, credit: varianceValue },
          ],
          totalDebit: varianceValue,
          totalCredit: varianceValue,
          posted: true,
          createdBy: user.name,
          createdAt: new Date().toISOString(),
        },
        user
      );
    }

    this.addAuditLog({
      action: 'STOCK_ADJUSTMENT',
      module: 'inventory',
      entityId: product.id,
      entityName: product.sku,
      description: `Adjusted stock for ${product.name} by ${adjustedQty > 0 ? '+' : ''}${adjustedQty} ${product.unit}. Reason: ${reason}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });
  }

  // PURCHASING & GOODS RECEIPT
  public createPurchaseOrder(poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'createdAt'>, user: UserProfile): PurchaseOrder {
    const existingPOs = this.getPurchaseOrders();
    const count = existingPOs.length + 1;
    const poNumber = `${this.getSettings().poPrefix}${count.toString().padStart(4, '0')}`;

    const newPO: PurchaseOrder = {
      ...poData,
      id: `po_${Date.now()}`,
      poNumber,
      createdAt: new Date().toISOString(),
    };

    const updated = [newPO, ...existingPOs];
    this.memoryCache.purchaseOrders = updated;
    this.saveItem('purchaseOrders', updated);

    this.addAuditLog({
      action: 'CREATE_PO',
      module: 'purchasing',
      entityId: newPO.id,
      entityName: poNumber,
      description: `Created Purchase Order ${poNumber} for supplier ${newPO.supplierName} total USh ${newPO.totalAmount.toLocaleString()}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return newPO;
  }

  public approvePurchaseOrder(poId: string, user: UserProfile): PurchaseOrder {
    const pos = this.getPurchaseOrders();
    const po = pos.find((p) => p.id === poId);
    if (!po) throw new Error('Purchase Order not found');

    po.status = 'approved';
    po.approvedBy = user.name;
    po.approvedAt = new Date().toISOString();
    this.saveItem('purchaseOrders', pos);

    this.addAuditLog({
      action: 'APPROVE_PO',
      module: 'purchasing',
      entityId: po.id,
      entityName: po.poNumber,
      description: `Approved Purchase Order ${po.poNumber}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return po;
  }

  // GOODS RECEIPT NOTE (INCREMENTS STOCK + GENERATES GL POSTING)
  public receiveGoods(
    poId: string,
    receivedItems: { productId: string; quantityReceived: number; unitCost: number }[],
    warehouseId: string,
    user: UserProfile,
    notes?: string
  ): GoodsReceiptNote {
    const pos = this.getPurchaseOrders();
    const po = pos.find((p) => p.id === poId);
    if (!po) throw new Error('Purchase Order not found');

    const products = this.getProducts();
    const warehouse = this.getWarehouses().find((w) => w.id === warehouseId) || this.getWarehouses()[0];

    let totalGRNCost = 0;
    const grnItems = [];

    for (const item of receivedItems) {
      if (item.quantityReceived <= 0) continue;
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;

      const cost = item.quantityReceived * item.unitCost;
      totalGRNCost += cost;

      // Update product current stock
      product.currentStock += item.quantityReceived;
      // Weighted average cost update
      const totalUnits = product.currentStock;
      if (totalUnits > 0) {
        const previousCostBasis = (totalUnits - item.quantityReceived) * product.costPrice;
        const newCostBasis = previousCostBasis + cost;
        product.costPrice = Math.round(newCostBasis / totalUnits);
      }
      product.updatedAt = new Date().toISOString();

      // Update PO line received qty
      const poLine = po.items.find((l) => l.productId === item.productId);
      if (poLine) {
        poLine.receivedQty = (poLine.receivedQty || 0) + item.quantityReceived;
      }

      grnItems.push({
        productId: product.id,
        productName: product.name,
        quantityReceived: item.quantityReceived,
        unitCost: item.unitCost,
        totalCost: cost,
      });

      // Stock Movement entry
      this.addStockMovement({
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        type: 'goods_receipt',
        quantity: item.quantityReceived,
        balanceAfter: product.currentStock,
        unitCost: item.unitCost,
        totalCost: cost,
        referenceNumber: po.poNumber,
        sourceDocument: `GRN from ${po.supplierName}`,
        notes: notes || `Goods received against ${po.poNumber}`,
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      });
    }

    // Check if PO is fully received
    const allReceived = po.items.every((l) => l.receivedQty >= l.quantity);
    po.status = allReceived ? 'received' : 'partially_received';
    this.saveItem('products', products);
    this.saveItem('purchaseOrders', pos);

    // Create GRN document
    const grnCount = (this.memoryCache.goodsReceipts || []).length + 1;
    const grnNumber = `GRN-2026-${grnCount.toString().padStart(4, '0')}`;
    const newGRN: GoodsReceiptNote = {
      id: `grn_${Date.now()}`,
      grnNumber,
      poId: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      warehouseId: warehouse.id,
      receivedDate: new Date().toISOString().split('T')[0],
      items: grnItems,
      totalCost: totalGRNCost,
      receivedBy: user.name,
      notes,
      createdAt: new Date().toISOString(),
    };

    const grnList = [newGRN, ...(this.memoryCache.goodsReceipts || [])];
    this.memoryCache.goodsReceipts = grnList;
    this.saveItem('goodsReceipts', grnList);

    // Update Supplier Balance (Payables increase)
    const suppliers = this.getSuppliers();
    const supplier = suppliers.find((s) => s.id === po.supplierId);
    if (supplier) {
      supplier.currentBalance += totalGRNCost;
      this.saveItem('suppliers', suppliers);
    }

    // Automatic GL Journal Entry: Debit Inventory Asset (1050), Credit Accounts Payable (2010)
    const accounts = this.getAccounts();
    const invAcc = accounts.find((a) => a.code === '1050') || accounts[4];
    const apAcc = accounts.find((a) => a.code === '2010') || accounts[5];

    this.createJournalEntry(
      {
        entryNumber: `JE-GRN-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        description: `Goods receipt ${grnNumber} from ${po.supplierName} (${po.poNumber})`,
        reference: grnNumber,
        sourceType: 'goods_receipt',
        lines: [
          { accountId: invAcc.id, accountCode: invAcc.code, accountName: invAcc.name, debit: totalGRNCost, credit: 0 },
          { accountId: apAcc.id, accountCode: apAcc.code, accountName: apAcc.name, debit: 0, credit: totalGRNCost },
        ],
        totalDebit: totalGRNCost,
        totalCredit: totalGRNCost,
        posted: true,
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      },
      user
    );

    this.addAuditLog({
      action: 'GOODS_RECEIPT',
      module: 'purchasing',
      entityId: newGRN.id,
      entityName: grnNumber,
      description: `Received goods for ${po.poNumber} worth USh ${totalGRNCost.toLocaleString()} into ${warehouse.name}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return newGRN;
  }

  // SALES WORKFLOW: QUOTATIONS & ORDERS
  public createQuotation(quoteData: Omit<Quotation, 'id' | 'quoteNumber' | 'createdAt'>, user: UserProfile): Quotation {
    const quotes = this.getQuotations();
    const count = quotes.length + 1;
    const quoteNumber = `${this.getSettings().quotePrefix}${count.toString().padStart(4, '0')}`;

    const newQuote: Quotation = {
      ...quoteData,
      id: `qt_${Date.now()}`,
      quoteNumber,
      createdAt: new Date().toISOString(),
    };

    const updated = [newQuote, ...quotes];
    this.memoryCache.quotations = updated;
    this.saveItem('quotations', updated);

    this.addAuditLog({
      action: 'CREATE_QUOTE',
      module: 'sales',
      entityId: newQuote.id,
      entityName: quoteNumber,
      description: `Created sales quote ${quoteNumber} for customer ${newQuote.customerName} (USh ${newQuote.totalAmount.toLocaleString()})`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return newQuote;
  }

  public convertQuoteToOrder(quoteId: string, user: UserProfile): SalesOrder {
    const quotes = this.getQuotations();
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Quotation not found');

    quote.status = 'converted';
    this.saveItem('quotations', quotes);

    const orders = this.getSalesOrders();
    const orderNumber = `SO-2026-${(orders.length + 1).toString().padStart(4, '0')}`;

    const newOrder: SalesOrder = {
      id: `so_${Date.now()}`,
      orderNumber,
      customerId: quote.customerId,
      customerName: quote.customerName,
      orderDate: new Date().toISOString().split('T')[0],
      status: 'confirmed',
      items: quote.items,
      totalAmount: quote.totalAmount,
      createdAt: new Date().toISOString(),
    };

    const updatedOrders = [newOrder, ...orders];
    this.memoryCache.salesOrders = updatedOrders;
    this.saveItem('salesOrders', updatedOrders);

    this.addAuditLog({
      action: 'CONVERT_QUOTE',
      module: 'sales',
      entityId: newOrder.id,
      entityName: orderNumber,
      description: `Converted Quote ${quote.quoteNumber} into Sales Order ${orderNumber}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return newOrder;
  }

  // POST INVOICE (DEDUCTS STOCK + POSTS BALANCED GL JOURNAL)
  public postInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>, user: UserProfile): Invoice {
    const products = this.getProducts();
    const allowNeg = this.getSettings().allowNegativeStock;

    // Step 1: Stock availability validation
    for (const line of invoiceData.items) {
      const prod = products.find((p) => p.id === line.productId);
      if (!prod) throw new Error(`Product ${line.productName} not found in catalog.`);
      if (!allowNeg && prod.currentStock < line.quantity) {
        throw new Error(
          `Insufficient stock for "${prod.name}". Available: ${prod.currentStock} ${prod.unit}, Requested: ${line.quantity} ${prod.unit}.`
        );
      }
    }

    // Step 2: Customer credit limit check (for credit sales)
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === invoiceData.customerId);
    if (invoiceData.paymentType === 'credit' && customer && customer.creditLimit > 0) {
      const newPotentialBalance = customer.currentBalance + invoiceData.balanceDue;
      if (newPotentialBalance > customer.creditLimit) {
        throw new Error(
          `Credit limit exceeded for "${customer.name}". Credit Limit: USh ${customer.creditLimit.toLocaleString()}, Current Balance: USh ${customer.currentBalance.toLocaleString()}, New Balance would be: USh ${newPotentialBalance.toLocaleString()}.`
        );
      }
    }

    // Step 3: Deduct stock and record movements
    const warehouse = this.getWarehouses().find((w) => w.id === invoiceData.warehouseId) || this.getWarehouses()[0];
    let totalCOGS = 0;

    const invoices = this.getInvoices();
    const invoiceNumber = `${this.getSettings().invoicePrefix}${(invoices.length + 1).toString().padStart(4, '0')}`;

    for (const line of invoiceData.items) {
      const prod = products.find((p) => p.id === line.productId)!;
      prod.currentStock -= line.quantity;
      prod.updatedAt = new Date().toISOString();

      const lineCOGS = line.quantity * (line.costPrice || prod.costPrice);
      totalCOGS += lineCOGS;

      // Stock Movement entry
      this.addStockMovement({
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        type: 'sales_issue',
        quantity: line.quantity,
        balanceAfter: prod.currentStock,
        unitCost: line.costPrice || prod.costPrice,
        totalCost: lineCOGS,
        referenceNumber: invoiceNumber,
        sourceDocument: `Invoice to ${invoiceData.customerName}`,
        notes: `Delivered for invoice ${invoiceNumber}`,
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      });
    }
    this.saveItem('products', products);

    // Step 4: Create and persist Invoice
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv_${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    // Update customer outstanding balance if credit or partial payment
    if (customer && newInvoice.balanceDue > 0) {
      customer.currentBalance += newInvoice.balanceDue;
      this.saveItem('customers', customers);
    }

    // Step 5: Post Automated Double-Entry Journal Entry
    // Credit Sale / Cash Sale:
    // Debits:
    //  - Accounts Receivable (1040) or Cash (1010) = totalAmount
    //  - Cost of Goods Sold (5010) = totalCOGS
    // Credits:
    //  - Sales Revenue (4010) = subtotal - discount
    //  - VAT Output Tax Payable (2020) = taxAmount
    //  - Inventory Asset (1050) = totalCOGS
    // Sum Debits == Sum Credits guaranteed!
    const accounts = this.getAccounts();
    const arAcc = accounts.find((a) => a.code === '1040') || accounts[3];
    const cashAcc = accounts.find((a) => a.code === '1010') || accounts[0];
    const bankAcc = accounts.find((a) => a.code === '1020') || accounts[1];
    const revAcc = accounts.find((a) => a.code === '4010') || accounts[10];
    const vatAcc = accounts.find((a) => a.code === '2020') || accounts[6];
    const cogsAcc = accounts.find((a) => a.code === '5010') || accounts[12];
    const invAcc = accounts.find((a) => a.code === '1050') || accounts[4];

    const netSalesRevenue = newInvoice.subtotal - (newInvoice.discountAmount || 0);
    const journalLines = [];

    // Debit payment or receivable
    if (newInvoice.paymentType === 'cash') {
      journalLines.push({ accountId: cashAcc.id, accountCode: cashAcc.code, accountName: cashAcc.name, debit: newInvoice.totalAmount, credit: 0 });
    } else if (newInvoice.paymentType === 'bank_transfer') {
      journalLines.push({ accountId: bankAcc.id, accountCode: bankAcc.code, accountName: bankAcc.name, debit: newInvoice.totalAmount, credit: 0 });
    } else {
      journalLines.push({ accountId: arAcc.id, accountCode: arAcc.code, accountName: arAcc.name, debit: newInvoice.totalAmount, credit: 0 });
    }

    // Debit COGS
    if (totalCOGS > 0) {
      journalLines.push({ accountId: cogsAcc.id, accountCode: cogsAcc.code, accountName: cogsAcc.name, debit: totalCOGS, credit: 0 });
    }

    // Credit Sales Revenue
    journalLines.push({ accountId: revAcc.id, accountCode: revAcc.code, accountName: revAcc.name, debit: 0, credit: netSalesRevenue });

    // Credit VAT
    if (newInvoice.taxAmount > 0) {
      journalLines.push({ accountId: vatAcc.id, accountCode: vatAcc.code, accountName: vatAcc.name, debit: 0, credit: newInvoice.taxAmount });
    }

    // Credit Inventory
    if (totalCOGS > 0) {
      journalLines.push({ accountId: invAcc.id, accountCode: invAcc.code, accountName: invAcc.name, debit: 0, credit: totalCOGS });
    }

    const totalDebit = journalLines.reduce((acc, l) => acc + l.debit, 0);
    const totalCredit = journalLines.reduce((acc, l) => acc + l.credit, 0);

    const journalEntryId = `je_inv_${Date.now()}`;
    newInvoice.journalEntryId = journalEntryId;

    this.createJournalEntry(
      {
        entryNumber: `JE-INV-${Date.now().toString().slice(-4)}`,
        date: newInvoice.issueDate,
        description: `Sales Invoice ${invoiceNumber} to ${newInvoice.customerName}`,
        reference: invoiceNumber,
        sourceType: 'invoice',
        lines: journalLines,
        totalDebit,
        totalCredit,
        posted: true,
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      },
      user
    );

    const updatedInvoices = [newInvoice, ...invoices];
    this.memoryCache.invoices = updatedInvoices;
    this.saveItem('invoices', updatedInvoices);

    this.addAuditLog({
      action: 'POST_INVOICE',
      module: 'sales',
      entityId: newInvoice.id,
      entityName: invoiceNumber,
      description: `Posted Invoice ${invoiceNumber} for ${newInvoice.customerName} total USh ${newInvoice.totalAmount.toLocaleString()}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return newInvoice;
  }

  // RECORD PAYMENT / RECEIPT
  public recordPayment(
    invoiceId: string,
    amount: number,
    paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque',
    bankAccountId: string,
    user: UserProfile,
    referenceNumber?: string,
    notes?: string
  ): PaymentReceipt {
    const invoices = this.getInvoices();
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) throw new Error('Invoice not found');
    if (amount <= 0) throw new Error('Payment amount must be greater than zero');
    if (amount > invoice.balanceDue) {
      throw new Error(`Payment amount (USh ${amount.toLocaleString()}) cannot exceed outstanding balance due (USh ${invoice.balanceDue.toLocaleString()})`);
    }

    invoice.amountPaid += amount;
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
    invoice.status = invoice.balanceDue <= 0 ? 'paid' : 'partially_paid';
    this.saveItem('invoices', invoices);

    // Update customer balance
    const customers = this.getCustomers();
    const customer = customers.find((c) => c.id === invoice.customerId);
    if (customer) {
      customer.currentBalance = Math.max(0, customer.currentBalance - amount);
      this.saveItem('customers', customers);
    }

    // Create receipt
    const payments = this.memoryCache.payments || [];
    const receiptNumber = `${this.getSettings().receiptPrefix}${(payments.length + 1).toString().padStart(4, '0')}`;
    const newReceipt: PaymentReceipt = {
      id: `rct_${Date.now()}`,
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount,
      paymentMethod,
      referenceNumber,
      paymentDate: new Date().toISOString().split('T')[0],
      accountId: bankAccountId,
      recordedBy: user.name,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updatedPayments = [newReceipt, ...payments];
    this.memoryCache.payments = updatedPayments;
    this.saveItem('payments', updatedPayments);

    // GL Journal: Debit Cash / Bank, Credit Accounts Receivable
    const accounts = this.getAccounts();
    const depositAcc = accounts.find((a) => a.id === bankAccountId) || accounts[1];
    const arAcc = accounts.find((a) => a.code === '1040') || accounts[3];

    this.createJournalEntry(
      {
        entryNumber: `JE-RCT-${Date.now().toString().slice(-4)}`,
        date: newReceipt.paymentDate,
        description: `Payment receipt ${receiptNumber} on ${invoice.invoiceNumber} from ${invoice.customerName}`,
        reference: receiptNumber,
        sourceType: 'receipt',
        lines: [
          { accountId: depositAcc.id, accountCode: depositAcc.code, accountName: depositAcc.name, debit: amount, credit: 0 },
          { accountId: arAcc.id, accountCode: arAcc.code, accountName: arAcc.name, debit: 0, credit: amount },
        ],
        totalDebit: amount,
        totalCredit: amount,
        posted: true,
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      },
      user
    );

    this.addAuditLog({
      action: 'RECORD_PAYMENT',
      module: 'sales',
      entityId: newReceipt.id,
      entityName: receiptNumber,
      description: `Recorded payment of USh ${amount.toLocaleString()} on invoice ${invoice.invoiceNumber}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return newReceipt;
  }

  // DOUBLE-ENTRY GENERAL LEDGER
  public createJournalEntry(
    entryData: Omit<JournalEntry, 'id'>,
    user: UserProfile
  ): JournalEntry {
    // Balanced validation check
    const diff = Math.abs(entryData.totalDebit - entryData.totalCredit);
    if (diff > 0.01) {
      throw new Error(
        `Journal entry does not balance! Total Debits (USh ${entryData.totalDebit.toLocaleString()}) must equal Total Credits (USh ${entryData.totalCredit.toLocaleString()}). Difference: USh ${diff.toLocaleString()}`
      );
    }

    const accounts = this.getAccounts();

    // Update account balances based on account types
    for (const line of entryData.lines) {
      const acc = accounts.find((a) => a.id === line.accountId);
      if (!acc) continue;

      if (['asset', 'cogs', 'expense'].includes(acc.type)) {
        // Normal debit balance
        acc.balance += line.debit - line.credit;
      } else {
        // Normal credit balance (liability, equity, revenue)
        acc.balance += line.credit - line.debit;
      }
    }
    this.saveItem('accounts', accounts);

    const newEntry: JournalEntry = {
      ...entryData,
      id: `je_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    const entries = [newEntry, ...this.getJournalEntries()];
    this.memoryCache.journalEntries = entries;
    this.saveItem('journalEntries', entries);

    this.addAuditLog({
      action: 'POST_JOURNAL',
      module: 'accounting',
      entityId: newEntry.id,
      entityName: newEntry.entryNumber,
      description: `Posted General Ledger Journal ${newEntry.entryNumber}: ${newEntry.description} (USh ${newEntry.totalDebit.toLocaleString()})`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return newEntry;
  }

  // EXPENSES
  public recordExpense(
    data: Omit<Expense, 'id' | 'expenseNumber' | 'createdAt'>,
    user: UserProfile
  ): Expense {
    const expenses = this.getExpenses();
    const expenseNumber = `EXP-2026-${(expenses.length + 1).toString().padStart(4, '0')}`;

    const newExpense: Expense = {
      ...data,
      id: `exp_${Date.now()}`,
      expenseNumber,
      createdAt: new Date().toISOString(),
    };

    // GL Journal: Debit Expense Account, Credit Cash/Bank
    const accounts = this.getAccounts();
    const expAcc = accounts.find((a) => a.id === data.expenseAccountId) || accounts[13];
    const payAcc = accounts.find((a) => a.id === data.paymentAccountId) || accounts[0];

    const je = this.createJournalEntry(
      {
        entryNumber: `JE-EXP-${Date.now().toString().slice(-4)}`,
        date: data.date,
        description: `Expense ${expenseNumber} to ${data.payee}: ${data.category}`,
        reference: expenseNumber,
        sourceType: 'expense',
        lines: [
          { accountId: expAcc.id, accountCode: expAcc.code, accountName: expAcc.name, debit: data.amount, credit: 0 },
          { accountId: payAcc.id, accountCode: payAcc.code, accountName: payAcc.name, debit: 0, credit: data.amount },
        ],
        totalDebit: data.amount,
        totalCredit: data.amount,
        posted: true,
        createdBy: user.name,
        createdAt: new Date().toISOString(),
      },
      user
    );

    newExpense.journalEntryId = je.id;
    const updated = [newExpense, ...expenses];
    this.memoryCache.expenses = updated;
    this.saveItem('expenses', updated);

    this.addAuditLog({
      action: 'RECORD_EXPENSE',
      module: 'accounting',
      entityId: newExpense.id,
      entityName: expenseNumber,
      description: `Recorded expense of USh ${data.amount.toLocaleString()} for ${data.category} to ${data.payee}`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    return newExpense;
  }

  // CUSTOMER & SUPPLIER MANAGEMENT
  public createCustomer(data: Omit<Customer, 'id' | 'createdAt'>, user: UserProfile): Customer {
    const customers = this.getCustomers();
    const newCust: Customer = {
      ...data,
      id: `cust_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCust, ...customers];
    this.memoryCache.customers = updated;
    this.saveItem('customers', updated);

    this.addAuditLog({
      action: 'CREATE_CUSTOMER',
      module: 'sales',
      entityId: newCust.id,
      entityName: newCust.name,
      description: `Registered new customer account "${newCust.name}"`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    setDoc(doc(db, 'customers', newCust.id), newCust).catch(() => {});
    return newCust;
  }

  public createSupplier(data: Omit<Supplier, 'id' | 'createdAt'>, user: UserProfile): Supplier {
    const suppliers = this.getSuppliers();
    const newSupp: Supplier = {
      ...data,
      id: `supp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newSupp, ...suppliers];
    this.memoryCache.suppliers = updated;
    this.saveItem('suppliers', updated);

    this.addAuditLog({
      action: 'CREATE_SUPPLIER',
      module: 'purchasing',
      entityId: newSupp.id,
      entityName: newSupp.name,
      description: `Registered new supplier account "${newSupp.name}"`,
      userId: user.id,
      userName: user.name,
      timestamp: new Date().toISOString(),
    });

    setDoc(doc(db, 'suppliers', newSupp.id), newSupp).catch(() => {});
    return newSupp;
  }

  // RESET DEMO DATABASE
  public resetToDemo(): void {
    localStorage.clear();
    this.memoryCache = {};
    this.loadFromLocalStorage();
    this.seedFirestore().catch(() => {});
  }
}

export const erpStorage = new ERPStorageService();
