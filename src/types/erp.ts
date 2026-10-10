export type UserRole = 
  | 'admin' 
  | 'manager' 
  | 'sales' 
  | 'storekeeper' 
  | 'purchaser' 
  | 'accountant' 
  | 'auditor';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string;
  avatar?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  tradingName: string;
  tin: string; // Tax Identification Number (e.g. Uganda URA TIN)
  vatRegistered: boolean;
  standardVatRate: number; // e.g. 18 for 18% VAT
  currency: string; // e.g. 'UGX'
  currencySymbol: string; // e.g. 'USh'
  timezone: string; // e.g. 'Africa/Kampala'
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  financialYearStartMonth: number; // 1-12 (e.g. 7 for July)
  invoicePrefix: string;
  quotePrefix: string;
  poPrefix: string;
  receiptPrefix: string;
  allowNegativeStock: boolean;
  valuationMethod: 'weighted_average' | 'fifo';
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  isMain: boolean;
  phone: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  branchId: string;
  location: string;
  isDefault: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  unit: string; // 'kg', 'bags', 'litres', 'pcs', 'cartons', etc.
  costPrice: number; // In UGX
  sellingPrice: number; // Retail price in UGX
  wholesalePrice?: number; // Wholesale tier in UGX
  minStockLevel: number;
  currentStock: number; // Aggregated stock across warehouses
  taxRate: number; // 18% or 0%
  isVatExempt?: boolean;
  active: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'goods_receipt' // From purchase order
  | 'sales_issue' // From sales invoice / order
  | 'adjustment_in' // Physical count upward adjustment
  | 'adjustment_out' // Physical count downward adjustment / damage
  | 'transfer_in'
  | 'transfer_out'
  | 'return_in' // Sales return from customer
  | 'return_out'; // Purchase return to supplier

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName?: string;
  type: StockMovementType;
  quantity: number; // Positive quantity moved
  balanceAfter: number;
  unitCost: number;
  totalCost: number;
  referenceNumber: string; // e.g. 'INV-001', 'PO-002', 'ADJ-003'
  sourceDocument?: string;
  notes?: string;
  createdBy: string;
  userName?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  tin?: string;
  creditLimit: number;
  currentBalance: number; // Outstanding receivables
  paymentTermsDays: number;
  active: boolean;
  createdAt: string;
}

export interface InvoiceLineItem {
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  costPrice: number; // For COGS calculation
}

export type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'partially_paid' | 'voided';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerTin?: string;
  warehouseId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentType: 'cash' | 'credit' | 'bank_transfer' | 'mobile_money';
  salesRepId?: string;
  salesRepName?: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'converted' | 'expired';
  items: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  orderDate: string;
  status: 'draft' | 'confirmed' | 'fulfilled' | 'cancelled';
  items: InvoiceLineItem[];
  totalAmount: number;
  invoiceId?: string;
  createdAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'cheque';
  referenceNumber?: string;
  paymentDate: string;
  accountId: string; // Cash or Bank GL Account
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  tin?: string;
  currentBalance: number; // Payables owed to supplier
  paymentTermsDays: number;
  active: boolean;
  createdAt: string;
}

export interface POLineItem {
  productId: string;
  sku: string;
  productName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
  receivedQty: number;
}

export type POStatus = 'draft' | 'pending_approval' | 'approved' | 'partially_received' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  orderDate: string;
  expectedDate?: string;
  status: POStatus;
  items: POLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface GoodsReceiptNote {
  id: string;
  grnNumber: string;
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  receivedDate: string;
  items: {
    productId: string;
    productName: string;
    quantityReceived: number;
    unitCost: number;
    totalCost: number;
  }[];
  totalCost: number;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'cogs' | 'expense';

export interface Account {
  id: string;
  code: string; // e.g. 1010, 1020, 2010, 4010, 5010, 6010
  name: string;
  type: AccountType;
  category: string; // e.g. 'Current Assets', 'Operating Expenses'
  balance: number;
  currency: string;
  isSystem: boolean;
  active: boolean;
  description?: string;
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference: string; // e.g. 'INV-2026-0001'
  sourceType: 'manual' | 'invoice' | 'receipt' | 'goods_receipt' | 'payment' | 'expense';
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  posted: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  expenseNumber: string;
  date: string;
  category: string; // 'Rent', 'Fuel', 'Electricity', 'Salaries', etc.
  expenseAccountId: string; // GL Account
  paymentAccountId: string; // Cash or Bank Account
  amount: number;
  payee: string;
  reference?: string;
  notes?: string;
  recordedBy: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  module: 'inventory' | 'sales' | 'purchasing' | 'accounting' | 'administration';
  entityId: string;
  entityName?: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  ipAddress?: string;
  details?: Record<string, any>;
}
