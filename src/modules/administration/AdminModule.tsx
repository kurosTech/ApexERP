import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  ClipboardList,
  Upload,
  RefreshCw,
  Building,
  CheckCircle,
  AlertTriangle,
  Users,
  Lock,
  Save,
  FileSpreadsheet,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { UserRole } from '../../types/erp.ts';

interface AdminModuleProps {
  initialSubTab?: string;
}

export const AdminModule: React.FC<AdminModuleProps> = ({ initialSubTab = 'settings' }) => {
  const {
    settings,
    updateSettings,
    users,
    auditLogs,
    resetDemoData,
    formatDate,
    createProduct,
    showToast,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);

  // Company Settings Form State
  const [formSettings, setFormSettings] = useState({ ...settings });

  // CSV Importer State
  const [importType, setImportType] = useState<'products' | 'customers'>('products');
  const [csvRawText, setCsvRawText] = useState(
    `SKU,Name,Category,Unit,CostPrice,SellingPrice,Stock\n` +
    `FLR-KMP-25K,Kampala Super Wheat Flour,Grains & Flours,25kg Bag,62000,78000,40\n` +
    `OIL-PLM-10L,Palm Cooking Oil Pure,Edible Oils & Fats,10L Jerrycan,58000,70000,25\n` +
    `CMT-HMA-50K,Hima Power Plus Cement 42.5R,Building & Hardware,50kg Bag,34000,39500,60`
  );
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
  };

  const handleParseCsv = () => {
    const lines = csvRawText.trim().split('\n');
    if (lines.length < 2) {
      setImportErrors(['CSV must contain a header row and at least one data row.']);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const parsed = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 5) {
        errors.push(`Row ${i + 1}: Missing required columns`);
        continue;
      }
      parsed.push({
        sku: parts[0],
        name: parts[1],
        categoryName: parts[2] || 'General',
        unit: parts[3] || 'Pcs',
        costPrice: Number(parts[4]) || 0,
        sellingPrice: Number(parts[5]) || 0,
        currentStock: Number(parts[6]) || 0,
      });
    }

    setPreviewRows(parsed);
    setImportErrors(errors);
  };

  const handleCommitImport = () => {
    if (previewRows.length === 0) return;
    let count = 0;
    for (const r of previewRows) {
      try {
        createProduct({
          sku: r.sku,
          name: r.name,
          categoryId: 'cat_grains',
          categoryName: r.categoryName,
          unit: r.unit,
          costPrice: r.costPrice,
          sellingPrice: r.sellingPrice,
          wholesalePrice: r.sellingPrice,
          minStockLevel: 10,
          currentStock: r.currentStock,
          taxRate: 18,
          active: true,
          description: 'Imported via CSV template',
        });
        count++;
      } catch (err: any) {
        console.warn('Import skipped duplicate/error:', err.message);
      }
    }
    showToast(`Successfully imported ${count} products from CSV batch.`);
    setPreviewRows([]);
  };

  return (
    <div className="space-y-6">
      {/* Admin Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Company & Localization Settings
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'rbac'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Users & Roles (RBAC Matrix)
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'audits'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Audit Trail Logs ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'import'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Data Import & Database Reset
          </button>
        </div>
      </div>

      {/* TAB 1: COMPANY & LOCALIZATION SETTINGS */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 text-xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">Company Profile & Legal Details</h3>
            <p className="text-slate-500">Configured default branding and tax credentials</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Company Legal Registered Name *</label>
              <input
                type="text"
                required
                value={formSettings.name}
                onChange={(e) => setFormSettings({ ...formSettings, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Trading Brand Name</label>
              <input
                type="text"
                value={formSettings.tradingName}
                onChange={(e) => setFormSettings({ ...formSettings, tradingName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Uganda URA TIN Number *</label>
              <input
                type="text"
                required
                value={formSettings.tin}
                onChange={(e) => setFormSettings({ ...formSettings, tin: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Standard VAT Rate (%)</label>
              <input
                type="number"
                value={formSettings.standardVatRate}
                onChange={(e) => setFormSettings({ ...formSettings, standardVatRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Currency Code & Symbol</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formSettings.currency}
                  onChange={(e) => setFormSettings({ ...formSettings, currency: e.target.value })}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono"
                />
                <input
                  type="text"
                  value={formSettings.currencySymbol}
                  onChange={(e) => setFormSettings({ ...formSettings, currencySymbol: e.target.value })}
                  className="w-1/2 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold font-mono"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Business Timezone</label>
              <input
                type="text"
                value={formSettings.timezone}
                onChange={(e) => setFormSettings({ ...formSettings, timezone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fiscal Year Starting Month (1-12)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={formSettings.financialYearStartMonth}
                onChange={(e) => setFormSettings({ ...formSettings, financialYearStartMonth: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Official Email</label>
              <input
                type="email"
                value={formSettings.email}
                onChange={(e) => setFormSettings({ ...formSettings, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
              <input
                type="text"
                value={formSettings.phone}
                onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Premises Address</label>
              <input
                type="text"
                value={formSettings.address}
                onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
            >
              <Save size={14} />
              <span>Save System Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: RBAC PERMISSIONS MATRIX */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Active ERP User Accounts</h3>
            <p className="text-xs text-slate-500 mb-4">
              Configured enterprise team members with branch assignment and RBAC role.
            </p>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Role Code</th>
                  <th className="py-2.5 px-3">Assigned Branch</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold uppercase text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">Kampala HQ Depot</td>
                    <td className="py-2.5 px-3 text-emerald-700 font-bold">Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Permissions Matrix */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              Role-Based Access Control (RBAC) Permission Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[11px]">
                    <th className="py-2.5 px-3 text-left">Module / Capability</th>
                    <th className="py-2.5 px-2">Admin</th>
                    <th className="py-2.5 px-2">Manager</th>
                    <th className="py-2.5 px-2">Sales</th>
                    <th className="py-2.5 px-2">Storekeeper</th>
                    <th className="py-2.5 px-2">Purchaser</th>
                    <th className="py-2.5 px-2">Accountant</th>
                    <th className="py-2.5 px-2">Auditor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {[
                    { cap: 'Inventory (View Catalog & Stock)', roles: [1, 1, 1, 1, 1, 1, 1] },
                    { cap: 'Inventory (Stock Receipts & Adjustments)', roles: [1, 1, 0, 1, 0, 0, 0] },
                    { cap: 'Sales (Create Quotes & Invoices)', roles: [1, 1, 1, 0, 0, 0, 0] },
                    { cap: 'Purchasing (Create Purchase Orders)', roles: [1, 1, 0, 0, 1, 0, 0] },
                    { cap: 'Purchasing (Approve Purchase Orders)', roles: [1, 1, 0, 0, 0, 0, 0] },
                    { cap: 'Purchasing (Receive Goods Notes)', roles: [1, 1, 0, 1, 0, 0, 0] },
                    { cap: 'Accounting (General Ledger & Journals)', roles: [1, 1, 0, 0, 0, 1, 0] },
                    { cap: 'Accounting (Record Customer Payments)', roles: [1, 1, 0, 0, 0, 1, 0] },
                    { cap: 'Reporting & Data Export', roles: [1, 1, 1, 0, 1, 1, 1] },
                    { cap: 'System Settings & Audit Log Management', roles: [1, 0, 0, 0, 0, 0, 0] },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-left font-semibold text-slate-900">{row.cap}</td>
                      {row.roles.map((val, rIdx) => (
                        <td key={rIdx} className="py-2 px-2">
                          {val ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL LOGS */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Entity Ref</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500">{formatDate(log.timestamp)}</td>
                    <td className="py-2.5 px-4 font-bold uppercase text-[10px] text-blue-900">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 capitalize font-medium text-slate-600">{log.module}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-800">
                      {log.entityName || log.entityId}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">{log.description}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{log.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CSV IMPORTER & DEMO RESET */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* CSV Import */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Batch CSV Data Importer</h3>
              <p className="text-slate-500">
                Import opening products, prices, and stock balances with strict validation and preview checks.
              </p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">CSV Template Data</label>
              <textarea
                rows={6}
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleParseCsv}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg"
              >
                Validate & Preview Rows
              </button>
            </div>

            {/* Preview Section */}
            {previewRows.length > 0 && (
              <div className="mt-4 border-t border-slate-200 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800">
                    Validation Passed: {previewRows.length} valid rows ready for import
                  </p>
                  <button
                    onClick={handleCommitImport}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-xs"
                  >
                    Commit {previewRows.length} Products to Database
                  </button>
                </div>
                <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="p-2">SKU</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Category</th>
                        <th className="p-2 text-right">Cost Price</th>
                        <th className="p-2 text-right">Selling Price</th>
                        <th className="p-2 text-right">Opening Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewRows.map((r, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono font-bold text-slate-800">{r.sku}</td>
                          <td className="p-2">{r.name}</td>
                          <td className="p-2 text-slate-600">{r.categoryName}</td>
                          <td className="p-2 text-right font-mono">{r.costPrice.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono">{r.sellingPrice.toLocaleString()}</td>
                          <td className="p-2 text-right font-mono font-bold">{r.currentStock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Database Reset Section */}
          <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-xs space-y-3 text-xs">
            <div>
              <h3 className="font-bold text-rose-900 text-sm">Demo Data Management & System Re-Seed</h3>
              <p className="text-slate-600">
                Restore the ERP database to initial verified Ugandan trading sample data (Pearl Mercantile &
                Distributors Ltd). This clears custom test modifications and re-initializes opening balances.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset database to initial clean Ugandan enterprise sample records?')) {
                  resetDemoData();
                }
              }}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-xs transition-colors"
            >
              <RefreshCw size={14} />
              <span>Reset & Re-Seed Sample Database</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
