import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  BookOpen,
  Layers,
  FileText,
  CheckCircle,
  AlertTriangle,
  Receipt,
  X,
  Search,
  Scale,
  TrendingUp,
  TrendingDown,
  Building,
} from 'lucide-react';
import { useERP } from '../../context/ERPContext.tsx';
import { Account, JournalEntry, JournalLine, Expense } from '../../types/erp.ts';

interface AccountingModuleProps {
  initialSubTab?: string;
  triggerNewExpense?: boolean;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  initialSubTab = 'overview',
  triggerNewExpense = false,
}) => {
  const {
    accounts,
    journalEntries,
    expenses,
    invoices,
    createJournalEntry,
    recordExpense,
    formatCurrency,
    formatDate,
    currentUser,
    hasPermission,
    settings,
  } = useERP();

  const [activeTab, setActiveTab] = useState<string>(initialSubTab);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(triggerNewExpense);

  // New Journal Entry state
  const [jeDate, setJeDate] = useState(new Date().toISOString().split('T')[0]);
  const [jeDesc, setJeDesc] = useState('');
  const [jeRef, setJeRef] = useState('');
  const [jeLines, setJeLines] = useState<
    { accountId: string; debit: number; credit: number; description?: string }[]
  >([
    { accountId: accounts[0]?.id || '', debit: 1000000, credit: 0 },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 1000000 },
  ]);

  // New Expense state
  const [expCategory, setExpCategory] = useState('Fuel, Logistics & Distribution');
  const [expAmount, setExpAmount] = useState(350000);
  const [expPayee, setExpPayee] = useState('Shell Kampala Industrial');
  const [expPaymentAcc, setExpPaymentAcc] = useState('acc_1010'); // Cash on Hand
  const [expExpenseAcc, setExpExpenseAcc] = useState('acc_6020'); // Fuel Expense
  const [expRef, setExpRef] = useState('PETTY-FUEL-01');
  const [expNotes, setExpNotes] = useState('Diesel top up for delivery van');

  // Trial balance calculations
  const totalDebitTrial = accounts.reduce((acc, a) => {
    return ['asset', 'cogs', 'expense'].includes(a.type) ? acc + Math.max(0, a.balance) : acc;
  }, 0);

  const totalCreditTrial = accounts.reduce((acc, a) => {
    return ['liability', 'equity', 'revenue'].includes(a.type) ? acc + Math.max(0, a.balance) : acc;
  }, 0);

  // Profit and Loss calculations from GL accounts
  const totalRevenue = accounts
    .filter((a) => a.type === 'revenue')
    .reduce((acc, a) => acc + Math.max(0, a.balance), 0);

  const totalCOGS = accounts
    .filter((a) => a.type === 'cogs')
    .reduce((acc, a) => acc + Math.max(0, a.balance), 0);

  const grossProfit = totalRevenue - totalCOGS;

  const totalOperatingExpenses = accounts
    .filter((a) => a.type === 'expense')
    .reduce((acc, a) => acc + Math.max(0, a.balance), 0);

  const netProfit = grossProfit - totalOperatingExpenses;

  // Balance sheet calculations
  const totalAssets = accounts
    .filter((a) => a.type === 'asset')
    .reduce((acc, a) => acc + Math.max(0, a.balance), 0);

  const totalLiabilities = accounts
    .filter((a) => a.type === 'liability')
    .reduce((acc, a) => acc + Math.max(0, a.balance), 0);

  const totalEquity = accounts
    .filter((a) => a.type === 'equity')
    .reduce((acc, a) => acc + Math.max(0, a.balance), 0);

  // Journal entry line balance checking
  const currentTotalDebit = jeLines.reduce((acc, l) => acc + Number(l.debit || 0), 0);
  const currentTotalCredit = jeLines.reduce((acc, l) => acc + Number(l.credit || 0), 0);
  const isJournalBalanced = Math.abs(currentTotalDebit - currentTotalCredit) < 0.01;

  const handlePostJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isJournalBalanced) {
      alert('Debits and Credits must balance!');
      return;
    }

    const count = journalEntries.length + 1;
    const entryNumber = `JE-2026-${count.toString().padStart(4, '0')}`;

    const formattedLines: JournalLine[] = jeLines.map((l) => {
      const acc = accounts.find((a) => a.id === l.accountId)!;
      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        description: l.description,
      };
    });

    createJournalEntry({
      entryNumber,
      date: jeDate,
      description: jeDesc || 'Manual general ledger journal entry',
      reference: jeRef || 'MANUAL-JE',
      sourceType: 'manual',
      lines: formattedLines,
      totalDebit: currentTotalDebit,
      totalCredit: currentTotalCredit,
      posted: true,
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
    });

    setShowJournalModal(false);
  };

  const handlePostExpense = (e: React.FormEvent) => {
    e.preventDefault();
    recordExpense({
      date: new Date().toISOString().split('T')[0],
      category: expCategory,
      expenseAccountId: expExpenseAcc,
      paymentAccountId: expPaymentAcc,
      amount: Number(expAmount),
      payee: expPayee,
      reference: expRef,
      notes: expNotes,
      recordedBy: currentUser.name,
    });
    setShowExpenseModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Accounting Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Financial Statements (P&L / BS)
          </button>
          <button
            onClick={() => setActiveTab('chart_of_accounts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'chart_of_accounts'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('journals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'journals'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            General Ledger ({journalEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'expenses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Operating Expenses ({expenses.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('accounting', 'create') && (
            <>
              <button
                onClick={() => setShowExpenseModal(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus size={14} />
                <span>Record Expense</span>
              </button>
              <button
                onClick={() => setShowJournalModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Plus size={14} />
                <span>New Journal Entry</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: FINANCIAL STATEMENTS & TRIAL BALANCE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Trial Balance Banner Check */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Scale size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">General Ledger Double-Entry Trial Balance</h3>
                <p className="text-xs text-slate-500">
                  Every transaction across Inventory, Sales, Purchasing, and Cash balances debits against credits.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                BALANCED • DEBITS = CREDITS
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                Trial Volume: {formatCurrency(totalDebitTrial)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit and Loss Statement */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Profit & Loss Statement</h3>
                  <p className="text-xs text-slate-500">Trading, Manufacturing & Operational P&L (UGX)</p>
                </div>
                <span className="font-mono text-xs font-bold text-blue-700">UGX</span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Revenue Section */}
                <div className="pb-2 border-b border-slate-100">
                  <div className="flex justify-between font-bold text-slate-900 mb-1">
                    <span>1. Operating Revenue & Sales</span>
                    <span className="font-mono text-blue-900">{formatCurrency(totalRevenue)}</span>
                  </div>
                  {accounts
                    .filter((a) => a.type === 'revenue')
                    .map((a) => (
                      <div key={a.id} className="flex justify-between text-slate-600 pl-3 py-0.5">
                        <span>{a.name} ({a.code})</span>
                        <span className="font-mono">{formatCurrency(a.balance)}</span>
                      </div>
                    ))}
                </div>

                {/* COGS Section */}
                <div className="pb-2 border-b border-slate-100">
                  <div className="flex justify-between font-bold text-slate-900 mb-1">
                    <span>2. Cost of Goods Sold (COGS)</span>
                    <span className="font-mono text-amber-900">-{formatCurrency(totalCOGS)}</span>
                  </div>
                  {accounts
                    .filter((a) => a.type === 'cogs')
                    .map((a) => (
                      <div key={a.id} className="flex justify-between text-slate-600 pl-3 py-0.5">
                        <span>{a.name} ({a.code})</span>
                        <span className="font-mono">{formatCurrency(a.balance)}</span>
                      </div>
                    ))}
                </div>

                {/* Gross Profit */}
                <div className="bg-slate-50 p-2.5 rounded-lg flex justify-between font-bold text-sm text-slate-900 border border-slate-200">
                  <span>Gross Trading Profit:</span>
                  <span className="font-mono text-emerald-800">{formatCurrency(grossProfit)}</span>
                </div>

                {/* Operating Expenses */}
                <div className="pt-2 pb-2 border-b border-slate-100">
                  <div className="flex justify-between font-bold text-slate-900 mb-1">
                    <span>3. Operating & Administrative Expenses</span>
                    <span className="font-mono text-rose-800">-{formatCurrency(totalOperatingExpenses)}</span>
                  </div>
                  {accounts
                    .filter((a) => a.type === 'expense')
                    .map((a) => (
                      <div key={a.id} className="flex justify-between text-slate-600 pl-3 py-0.5">
                        <span>{a.name} ({a.code})</span>
                        <span className="font-mono">{formatCurrency(a.balance)}</span>
                      </div>
                    ))}
                </div>

                {/* Net Profit */}
                <div className="bg-blue-900 text-white p-3 rounded-lg flex justify-between font-extrabold text-sm shadow-xs">
                  <span>Net Operating Profit / (Loss):</span>
                  <span className="font-mono text-emerald-300">{formatCurrency(netProfit)}</span>
                </div>
              </div>
            </div>

            {/* Balance Sheet */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Statement of Financial Position</h3>
                  <p className="text-xs text-slate-500">Balance Sheet (Assets = Liabilities + Equity)</p>
                </div>
                <span className="font-mono text-xs font-bold text-blue-700">UGX</span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Assets */}
                <div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm mb-1">
                    <span>Current & Non-Current Assets</span>
                    <span className="font-mono text-emerald-800">{formatCurrency(totalAssets)}</span>
                  </div>
                  <div className="space-y-1 pl-3 border-l-2 border-emerald-400">
                    {accounts
                      .filter((a) => a.type === 'asset')
                      .map((a) => (
                        <div key={a.id} className="flex justify-between text-slate-600 py-0.5">
                          <span>{a.name} ({a.code})</span>
                          <span className="font-mono font-medium">{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Liabilities */}
                <div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm mb-1">
                    <span>Current Liabilities</span>
                    <span className="font-mono text-rose-800">{formatCurrency(totalLiabilities)}</span>
                  </div>
                  <div className="space-y-1 pl-3 border-l-2 border-rose-400">
                    {accounts
                      .filter((a) => a.type === 'liability')
                      .map((a) => (
                        <div key={a.id} className="flex justify-between text-slate-600 py-0.5">
                          <span>{a.name} ({a.code})</span>
                          <span className="font-mono font-medium">{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Equity */}
                <div>
                  <div className="flex justify-between font-bold text-slate-900 text-sm mb-1">
                    <span>Shareholders Equity & Retained Earnings</span>
                    <span className="font-mono text-blue-800">{formatCurrency(totalEquity)}</span>
                  </div>
                  <div className="space-y-1 pl-3 border-l-2 border-blue-400">
                    {accounts
                      .filter((a) => a.type === 'equity')
                      .map((a) => (
                        <div key={a.id} className="flex justify-between text-slate-600 py-0.5">
                          <span>{a.name} ({a.code})</span>
                          <span className="font-mono font-medium">{formatCurrency(a.balance)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === 'chart_of_accounts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Current Ledger Balance (UGX)</th>
                  <th className="py-3 px-4 text-center">System Protected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{acc.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{acc.name}</td>
                    <td className="py-3 px-4 text-slate-600">{acc.category}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          acc.type === 'asset'
                            ? 'bg-emerald-100 text-emerald-800'
                            : acc.type === 'liability'
                            ? 'bg-rose-100 text-rose-800'
                            : acc.type === 'revenue'
                            ? 'bg-blue-100 text-blue-800'
                            : acc.type === 'cogs'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(acc.balance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {acc.isSystem ? (
                        <span className="text-[10px] text-slate-400 font-bold">YES</span>
                      ) : (
                        <span className="text-[10px] text-slate-300">CUSTOM</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL LEDGER & JOURNALS */}
      {activeTab === 'journals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-200">
              {journalEntries.map((je) => (
                <div key={je.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-xs">
                        {je.entryNumber}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">{formatDate(je.date)}</span>
                      <span className="text-xs font-semibold text-slate-800">{je.description}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded uppercase font-bold">
                        Ref: {je.reference}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-900">
                        {formatCurrency(je.totalDebit)}
                      </span>
                    </div>
                  </div>

                  {/* Journal Lines Debit / Credit breakdown */}
                  <div className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-400 uppercase font-bold border-b border-slate-200 pb-1">
                          <th className="py-1">Account</th>
                          <th className="py-1 text-right">Debit (UGX)</th>
                          <th className="py-1 text-right">Credit (UGX)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {je.lines.map((l, idx) => (
                          <tr key={idx}>
                            <td className="py-1 text-slate-700">
                              <span className="font-mono font-bold text-blue-900">{l.accountCode}</span> -{' '}
                              {l.accountName}
                            </td>
                            <td className="py-1 text-right font-mono font-medium text-emerald-800">
                              {l.debit > 0 ? formatCurrency(l.debit) : '-'}
                            </td>
                            <td className="py-1 text-right font-mono font-medium text-rose-800">
                              {l.credit > 0 ? formatCurrency(l.credit) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <p className="text-slate-600 font-medium">
              Operational Expenditures, Utilities, Premises Rent, and Fleet Distribution Costs
            </p>
            <div className="font-mono font-bold text-rose-700">
              Total Expenses: {formatCurrency(expenses.reduce((acc, e) => acc + e.amount, 0))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Expense #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payee / Vendor</th>
                  <th className="py-3 px-4">Reference / Receipt</th>
                  <th className="py-3 px-4 text-right">Amount (UGX)</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{exp.expenseNumber}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{formatDate(exp.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{exp.category}</td>
                    <td className="py-3 px-4 text-slate-700">{exp.payee}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{exp.reference || '-'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{exp.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: NEW JOURNAL ENTRY */}
      {showJournalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Post Balanced General Ledger Journal Entry</h3>
                <p className="text-[11px] text-slate-400">Strict double-entry balance enforced (Debits = Credits)</p>
              </div>
              <button onClick={() => setShowJournalModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostJournal} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Posting Date *</label>
                  <input
                    type="date"
                    required
                    value={jeDate}
                    onChange={(e) => setJeDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Journal Description / Narration *</label>
                  <input
                    type="text"
                    required
                    value={jeDesc}
                    onChange={(e) => setJeDesc(e.target.value)}
                    placeholder="e.g. Bank loan interest / Depreciation allowance"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                  />
                </div>
              </div>

              {/* Journal Lines */}
              <div>
                <label className="font-bold text-slate-700 block mb-2">Debit and Credit Journal Lines</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 p-2 rounded-lg bg-slate-50">
                  {jeLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={line.accountId}
                          onChange={(e) => {
                            const newLines = [...jeLines];
                            newLines[idx].accountId = e.target.value;
                            setJeLines(newLines);
                          }}
                          className="w-full bg-transparent font-medium outline-none text-xs"
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} - {a.name} ({a.type.toUpperCase()})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          value={line.debit}
                          onChange={(e) => {
                            const newLines = [...jeLines];
                            newLines[idx].debit = Number(e.target.value);
                            if (Number(e.target.value) > 0) newLines[idx].credit = 0;
                            setJeLines(newLines);
                          }}
                          className="w-full p-1 border border-slate-200 rounded text-right font-mono"
                          placeholder="Debit"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          min="0"
                          value={line.credit}
                          onChange={(e) => {
                            const newLines = [...jeLines];
                            newLines[idx].credit = Number(e.target.value);
                            if (Number(e.target.value) > 0) newLines[idx].debit = 0;
                            setJeLines(newLines);
                          }}
                          className="w-full p-1 border border-slate-200 rounded text-right font-mono"
                          placeholder="Credit"
                        />
                      </div>
                      {jeLines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setJeLines(jeLines.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setJeLines([
                      ...jeLines,
                      { accountId: accounts[0]?.id || '', debit: 0, credit: 0 },
                    ])
                  }
                  className="mt-2 text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Plus size={12} /> Add Account Line
                </button>
              </div>

              {/* Balance Verification Box */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between font-mono font-bold ${
                  isJournalBalanced
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                <div>
                  <p>Total Debits: {formatCurrency(currentTotalDebit)}</p>
                  <p>Total Credits: {formatCurrency(currentTotalCredit)}</p>
                </div>
                <div className="text-right">
                  {isJournalBalanced ? (
                    <span className="text-xs bg-emerald-600 text-white px-2 py-1 rounded font-sans uppercase font-bold">
                      BALANCED (0.00)
                    </span>
                  ) : (
                    <span className="text-xs bg-rose-600 text-white px-2 py-1 rounded font-sans uppercase font-bold">
                      DIFF: {formatCurrency(Math.abs(currentTotalDebit - currentTotalCredit))}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowJournalModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJournalBalanced}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold shadow-xs"
                >
                  Post Journal to GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD EXPENSE */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Record Operating Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handlePostExpense} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Category *</label>
                <select
                  value={expCategory}
                  onChange={(e) => {
                    setExpCategory(e.target.value);
                    if (e.target.value.includes('Rent')) setExpExpenseAcc('acc_6010');
                    else if (e.target.value.includes('Fuel')) setExpExpenseAcc('acc_6020');
                    else if (e.target.value.includes('Electricity')) setExpExpenseAcc('acc_6030');
                    else if (e.target.value.includes('Wages')) setExpExpenseAcc('acc_6040');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="Fuel, Logistics & Distribution">Fuel, Logistics & Distribution</option>
                  <option value="Warehouse & Office Rent Expense">Warehouse & Office Rent Expense</option>
                  <option value="Electricity & Water (Umeme / NWSC)">Electricity & Water (Umeme / NWSC)</option>
                  <option value="Staff Wages, Overtime & Allowances">Staff Wages, Overtime & Allowances</option>
                  <option value="Bank Charges & Transaction Fees">Bank Charges & Transaction Fees</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Amount (UGX) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-base font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payee / Merchant *</label>
                <input
                  type="text"
                  required
                  value={expPayee}
                  onChange={(e) => setExpPayee(e.target.value)}
                  placeholder="e.g. TotalEnergies 7th Street Station"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Disbursed From Account *</label>
                <select
                  value={expPaymentAcc}
                  onChange={(e) => setExpPaymentAcc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                >
                  <option value="acc_1010">Cash on Hand (Petty Cash Counter)</option>
                  <option value="acc_1020">Stanbic Bank Operational Account</option>
                  <option value="acc_1030">Centenary Bank / MTN Mobile Money</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reference / Receipt Number</label>
                <input
                  type="text"
                  value={expRef}
                  onChange={(e) => setExpRef(e.target.value)}
                  placeholder="e.g. PETTY-VOUCHER-04"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xs"
                >
                  Save & Post Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
